"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function scanImageWithAI(base64Image: string) {
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "") {
        console.error("OCR Error: GEMINI_API_KEY is missing in server environment variables.");
        return {
            success: false,
            error: "SERVER_ENV_MISSING: The Gemini API Key is not configured on the deployment server. Please add GEMINI_API_KEY to your Vercel Environment Variables."
        };
    }

    try {
        // Using gemini-1.5-flash-latest for better compatibility with different API versions
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

        const prompt = "You are an expert OCR assistant. Your goal is to extract study subjects from an image. Look for subject codes (e.g., 5G00DL96-3014) and their names. Ignore multiple duplicate rows representing 'implementations' if they refer to the same course. Return ONLY a raw JSON array of objects with 'name' and 'code' properties inside a 'subjects' key. Do not include markdown formatting or backticks.";

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: base64Image,
                    mimeType: "image/jpeg"
                }
            }
        ]);

        const response = await result.response;
        const text = response.text();

        // Clean up potential markdown formatting if Gemini adds it despite instructions
        const cleanedText = text.replace(/```json/g, "").replace(/```/g, "").trim();

        const parsed = JSON.parse(cleanedText);
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
        console.error("Gemini OCR Error:", error);
        return {
            success: false,
            error: error.message || "An unexpected error occurred during Gemini AI processing."
        };
    }
}
