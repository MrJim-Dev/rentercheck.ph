import { ExtractedData } from '../scanner';

export async function scanWithOpenAI(file: File): Promise<ExtractedData> {
    console.log('[OpenAI Provider] Starting scan via API...');

    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/ocr', {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        const errorBody = await response.text();
        console.error('[OpenAI Provider] API Error:', errorBody);
        throw new Error(`OpenAI OCR failed: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('[OpenAI Provider] Result:', data);

    return {
        name: data.name || null,
        address: data.address || null,
        dob: data.dob || null
    };
}
