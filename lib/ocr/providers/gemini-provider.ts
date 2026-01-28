import { ExtractedData } from '../scanner';

export async function scanWithGemini(file: File): Promise<ExtractedData> {
    console.log('[Gemini Provider] Starting scan via API...');

    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/ocr', {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        const errorBody = await response.text();
        console.error('[Gemini Provider] API Error:', errorBody);
        throw new Error(`Gemini OCR failed: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('[Gemini Provider] Result:', data);

    return {
        name: data.name || null,
        address: data.address || null,
        dob: data.dob || null
    };
}
