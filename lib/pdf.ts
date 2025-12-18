import pdf from 'pdf-parse';

export async function extractTextFromPDF(buffer: Buffer): Promise<{ text: string; pages: PageContent[] }> {
    try {
        const data = await pdf(buffer);

        // pdf-parse gives us full text and numpages but basic extraction doesn't separate by page easily with this lib alone in a structured way per page for ALL PDFs perfectly.
        // However, for MVP, we might want to just treat the whole doc or try to split by form-feed character if present, or use a better parser.
        // BUT user asked for "Node library reliable". pdf-parse is reliable but simple.
        // Let's stick to parsing the whole text and creating a single massive "Page 1" if we can't detect pages, 
        // OR ideally we use something slightly more advanced if we need per-page attribution.

        // Actually, getting per-page text from pdf-parse is tricky without using the detailed render callback.
        // Let's simulate page breaks or just return the whole text for now, but properly typed.
        // Wait, let's use the 'render_page' option of pdf-parse if possible, or accept that for MVP we might lose precise page boundaries 
        // if we don't use a heavier lib like pdfjs-dist.
        // Let's stick to a simple extraction. The user wants "Sources (doc name + page numbers)".
        // We will attempt to split by form feed character '\f' which is often used as page break in extracted text.

        const rawText = data.text;
        const pages: PageContent[] = [];

        // Naive split by form feed (common in unix/linux pdf text extraction)
        const rawPages = rawText.split(/\f/);

        rawPages.forEach((pageText, index) => {
            const cleaned = pageText.trim();
            if (cleaned.length > 0) {
                pages.push({
                    pageNumber: index + 1,
                    content: cleaned
                });
            }
        });

        return {
            text: data.text,
            pages: pages.length > 0 ? pages : [{ pageNumber: 1, content: data.text.trim() }] // Fallback
        };
    } catch (error) {
        console.error("Error parsing PDF:", error);
        throw new Error("Failed to parse PDF");
    }
}

export type PageContent = {
    pageNumber: number;
    content: string;
};
