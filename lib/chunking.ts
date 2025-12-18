export type Chunk = {
    content: string;
    metadata: {
        pageNumber: number;
        chunkIndex: number;
    };
};

interface ChunkingOptions {
    maxLength: number;
    overlap: number;
}

export function chunkText(pages: { pageNumber: number; content: string }[], options: ChunkingOptions = { maxLength: 1000, overlap: 200 }): Chunk[] {
    const chunks: Chunk[] = [];
    let chunkGlobalIndex = 0;

    for (const page of pages) {
        const pageContent = page.content;
        if (!pageContent) continue;

        let start = 0;
        while (start < pageContent.length) {
            const end = Math.min(start + options.maxLength, pageContent.length);

            // Try to find a sentence break near the end to avoid cutting words in half
            let actualEnd = end;
            if (actualEnd < pageContent.length) {
                const lastPeriod = pageContent.lastIndexOf('.', actualEnd);
                const lastSpace = pageContent.lastIndexOf(' ', actualEnd);

                // If we found a period reasonably close (within last 20%), break there
                if (lastPeriod > start + options.maxLength * 0.8) {
                    actualEnd = lastPeriod + 1;
                } else if (lastSpace > start + options.maxLength * 0.8) {
                    actualEnd = lastSpace + 1;
                }
            }

            const chunkText = pageContent.slice(start, actualEnd).trim();

            if (chunkText.length > 0) {
                chunks.push({
                    content: chunkText,
                    metadata: {
                        pageNumber: page.pageNumber,
                        chunkIndex: chunkGlobalIndex++,
                    },
                });
            }

            // Move straight to actualEnd for next chunk, then backtrack by overlap
            start = actualEnd - options.overlap;

            // If we've reached the end of the content, stop
            if (actualEnd === pageContent.length) {
                break;
            }

            // Prevent infinite loop if overlap >= maxLength (shouldn't happen with default)
            // Also ensure we consistently move forward
            if (start < 0) start = 0;
            if (start >= actualEnd) start = actualEnd; // Should not trigger unless options are broken
        }
    }

    return chunks;
}
