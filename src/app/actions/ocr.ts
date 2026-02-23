"use server";

import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function scanImageWithAI(base64Image: string) {
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === "") {
        console.error("OCR Error: OPENAI_API_KEY is missing in server environment variables.");
        return {
            success: false,
            error: "SERVER_ENV_MISSING: The OpenAI API Key is not configured on the deployment server. Please add OPENAI_API_KEY to your Vercel Environment Variables."
        };
    }

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: "You are an expert OCR assistant. Your goal is to extract study subjects from an image. Look for subject codes (e.g., 5G00DL96-3014) and their names. Ignore multiple duplicate rows representing 'implementations' if they refer to the same course. Return ONLY a raw JSON array of objects with 'name' and 'code' properties inside a 'subjects' key.",
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
        if (!content) return { success: true, data: [] };

        const parsed = JSON.parse(content);
        let results = [];

        if (Array.isArray(parsed)) {
            results = parsed;
        } else if (parsed.subjects && Array.isArray(parsed.subjects)) {
            results = parsed.subjects;
        } else if (parsed.courses && Array.isArray(parsed.courses)) {
            results = parsed.courses;
        }

        return { success: true, data: results };
    } catch (error: any) {
        console.error("OpenAI OCR Error:", error);
        return {
            success: false,
            error: error.message || "An unexpected error occurred during AI processing."
        };
    }
}
