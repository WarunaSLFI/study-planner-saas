"use server";

import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function scanImageWithAI(base64Image: string) {
    if (!process.env.OPENAI_API_KEY) {
        throw new Error("OpenAI API Key is not configured on the server.");
    }

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: "You are an expert OCR assistant. Your goal is to extract study subjects from an image. Look for subject codes (e.g., 5G00DL96-3014) and their names. Ignore multiple duplicate rows representing 'implementations' if they refer to the same course. Return ONLY a raw JSON array of objects with 'name' and 'code' properties. Do not include markdown formatting or backticks.",
                },
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: "Extract the subjects from this image as a JSON array of { name, code }.",
                        },
                        {
                            type: "image_url",
                            image_url: {
                                url: `data:image/jpeg;base64,${base64Image}`,
                            },
                        },
                    ],
                },
            ],
            response_format: { type: "json_object" },
        });

        const content = response.choices[0].message.content;
        if (!content) return [];

        // OpenAI might return it wrapped in a "subjects" key or similar if we use json_object
        const parsed = JSON.parse(content);

        // Normalize to flat array
        if (Array.isArray(parsed)) return parsed;
        if (parsed.subjects && Array.isArray(parsed.subjects)) return parsed.subjects;
        if (parsed.courses && Array.isArray(parsed.courses)) return parsed.courses;

        return [];
    } catch (error) {
        console.error("OpenAI OCR Error:", error);
        throw new Error("Failed to process image with AI.");
    }
}
