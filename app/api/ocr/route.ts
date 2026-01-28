import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: 'Server Configuration Error: Missing GEMINI_API_KEY' }, { status: 500 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const base64Image = buffer.toString('base64');
        const mimeType = file.type || 'image/jpeg';

        // Initialize Google Generative AI (AI Studio)
        const genAI = new GoogleGenerativeAI(apiKey);

        // Using confirm available model from diagnostic list
        const modelName = 'gemini-2.5-flash';
        const model = genAI.getGenerativeModel({ model: modelName });

        const prompt = `
            Extract the following details from this ID card image:
            1. Name (Full Name, converted to Title Case e.g. "Juan Dela Cruz")
            2. Date of Birth (Format: YYYY-MM-DD or DD Mon YYYY)
            3. Address (Full Address, converted to Title Case e.g. "123 Main St, Cebu City")

            Return the result ONLY as a JSON object with keys: "name", "dob", "address".
            If a field is not found or unclear, use null. 
            Do not include markdown code blocks.
        `;

        const imagePart = {
            inlineData: {
                data: base64Image,
                mimeType: mimeType
            }
        };

        const result = await model.generateContent([prompt, imagePart]);
        const response = await result.response;
        const text = response.text();

        console.log("Gemini Raw Response:", text);

        // Clean up markdown if present
        const cleanJson = text.replace(/^```json\s*|\s*```$/g, '').trim();

        let parsedData;
        try {
            parsedData = JSON.parse(cleanJson);
        } catch (parseError) {
            console.error("JSON Parse failed for:", cleanJson);
            return NextResponse.json({ error: 'Failed to parse Gemini response', raw: text }, { status: 500 });
        }

        return NextResponse.json({
            name: parsedData.name || null,
            address: parsedData.address || null,
            dob: parsedData.dob || null
        });

    } catch (error) {
        console.error('OCR API Error:', error);
        return NextResponse.json({
            error: 'Internal Server Error',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
