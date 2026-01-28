import { ExtractedData } from '../scanner';

export async function scanWithTesseract(file: File): Promise<ExtractedData> {
    console.log('[Tesseract Provider] Starting scan...');

    // Dynamic imports to save bundle size
    const Tesseract = (await import('tesseract.js')).default;
    const { extractDataFromOCR } = await import('../../utils/ocr-parser');

    const worker = await Tesseract.createWorker('eng', 1, {
        logger: m => console.log("[Tesseract Log]", m)
    });

    // Set PSM to 6 (Assume a single uniform block of text) which often helps with IDs that are being treated as complex layouts
    await worker.setParameters({
        tessedit_pageseg_mode: Tesseract.PSM.SINGLE_BLOCK,
    });

    const { data: { text } } = await worker.recognize(file);
    console.log('[Tesseract Provider] Raw Text:', text);

    await worker.terminate();

    return extractDataFromOCR(text);
}
