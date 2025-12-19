import pdf from 'pdf-parse';

export async function extractTextFromPDF(buffer: Buffer): Promise<{ text: string; pages: PageContent[] }> {
    try {
        const data = await pdf(buffer);

        // Naive split by form feed (common in unix/linux pdf text extraction)
        const rawText = data.text;
        const pages: PageContent[] = [];

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
