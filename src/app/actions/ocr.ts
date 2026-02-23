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
        // Switching to gemini-2.0-flash as it is confirmed available for this API key
        // and provides superior OCR performance over previous generations.
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const prompt = `You are an expert OCR assistant. Your goal is to extract study subjects from an image. 
        Look for subject codes (e.g., 5G00DL96-3014) and their names.
        
        CRITICAL: Academic systems often show a "Course" row and multiple "Implementation" rows. 
        Implementations often have an extra digit at the start of the code (e.g., 15G... or 25G... instead of 5G...).
        If multiple rows refer to the same course (even if the name varies slightly, like "Programming Languages 1" vs "Programming Languages"), 
        you MUST keep ONLY the primary course row (usually the one with the shorter code or the "main" title).
        
        Return ONLY a raw JSON array of objects with 'name' and 'code' properties inside a 'subjects' key. 
        Format: { "subjects": [ { "name": "...", "code": "..." } ] }`;

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
        let rawResults: any[] = [];

        if (Array.isArray(parsed)) {
            rawResults = parsed;
        } else if (parsed.subjects && Array.isArray(parsed.subjects)) {
            rawResults = parsed.subjects;
        } else if (parsed.courses && Array.isArray(parsed.courses)) {
            rawResults = parsed.courses;
        }

        // --- Post-Processing Deduplication ---
        // Some AI responses might still sneak in duplicates. We consolidate them here.
        const finalized: { name: string, code: string }[] = [];
        const seenKeys = new Set<string>();

        // Heuristic: remove leading digit if it's followed by the rest of the code pattern
        const getBaseCode = (c: string) => c.replace(/^[0-9]([A-Z0-9]{2,})/, "$1");
        // Heuristic: lowercase and remove trailing numbers like " 1", " 2", " 3"
        const normalizeName = (n: string) => n.toLowerCase().replace(/\s*[0-9]+$/, "").trim();

        for (const item of rawResults) {
            const name = (item.name || "").trim();
            const code = (item.code || "").trim();
            if (!name) continue;

            const baseName = normalizeName(name);
            const baseCode = getBaseCode(code);
            const uniqueKey = `${baseName}|${baseCode}`;

            if (!seenKeys.has(uniqueKey)) {
                seenKeys.add(uniqueKey);
                finalized.push({ name, code });
            }
        }

        return { success: true, data: finalized };
    } catch (error: any) {
        console.error("Gemini OCR Error:", error);
        return {
            success: false,
            error: error.message || "An unexpected error occurred during Gemini AI processing."
        };
    }
}
