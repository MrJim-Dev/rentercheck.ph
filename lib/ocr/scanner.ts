import { scanWithGemini } from './providers/gemini-provider';
import { scanWithTesseract } from './providers/tesseract-provider';

export type ExtractedData = {
    name: string | null;
    address: string | null;
    city: string | null;
    dob: string | null;
};

export async function scanID(file: File): Promise<ExtractedData> {
    // Default to 'google' (Gemini) if not specified
    const provider = process.env.NEXT_PUBLIC_OCR_PROVIDER || 'google';

    console.log(`[Scanner] Using provider: ${provider} (Gemini Flash)`);

    if (provider === 'tesseract') {
        return scanWithTesseract(file);
    } else {
        // Default to Gemini Flash
        return scanWithGemini(file);
    }
}
