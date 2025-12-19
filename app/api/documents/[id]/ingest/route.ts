import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { extractTextFromPDF } from '@/lib/pdf';
import { chunkText } from '@/lib/chunking';
import { getEmbeddings } from '@/lib/openai';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    const documentId = params.id;

    try {
        const document = await db.document.findUnique({
            where: { id: documentId },
        });

        if (!document) {
            return NextResponse.json({ error: 'Document not found' }, { status: 404 });
        }

        // Update status to PROCESSING
        await db.document.update({
            where: { id: documentId },
            data: { status: 'PROCESSING' },
        });

        // 1. Fetch File
        const response = await fetch(document.storageUrl);
        if (!response.ok) throw new Error('Failed to fetch file from storage');

        const buffer = Buffer.from(await response.arrayBuffer());

        // 2. Extract Text
        const { text, pages } = await extractTextFromPDF(buffer);

        // 3. Chunking
        const chunks = chunkText(pages, { maxLength: 1000, overlap: 200 });

        // 4. Generate Embeddings & Save Chunks
        const savedChunks = [];

        for (const chunk of chunks) {
            const embedding = await getEmbeddings(chunk.content);

            const id = crypto.randomUUID();

            await db.$executeRaw`
            INSERT INTO "DocumentChunk" (id, "documentId", "workspaceId", "pageNumber", "chunkIndex", "content", "embedding", "createdAt")
            VALUES (${id}, ${documentId}, ${document.workspaceId}, ${chunk.metadata.pageNumber}, ${chunk.metadata.chunkIndex}, ${chunk.content}, ${JSON.stringify(embedding)}::vector, NOW())
        `;

            savedChunks.push(id);
        }

        // 5. Update Document Status & Page Count
        await db.document.update({
            where: { id: documentId },
            data: {
                status: 'READY',
                pageCount: pages.length,
            },
        });

        return NextResponse.json({ success: true, chunksCount: savedChunks.length });

    } catch (error) {
        console.error('Ingestion error:', error);

        await db.document.update({
            where: { id: documentId },
            data: { status: 'ERROR' },
        });

        return NextResponse.json({ error: 'Ingestion failed' }, { status: 500 });
    }
}
