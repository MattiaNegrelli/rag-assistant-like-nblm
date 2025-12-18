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
        // Note: Doing this sequentially for MVP to avoid rate limits, but could be parallelized with limits.
        const savedChunks = [];

        for (const chunk of chunks) {
            const embedding = await getEmbeddings(chunk.content);

            // We use Prisma's executeRaw because Prisma doesn't fully support vector inserts deeply yet/cleanly in standard Create
            // OR we can use the model if we map it correctly. But inserting 'Unsupported' types via standard create is tricky.
            // Usually, we create the record then update it with raw query or just use straight raw insert.
            // Let's try standard create for valid fields and raw SQL for updating the vector.

            // Actually, for pgvector in Prisma, the standard recommendation is to use $executeRaw for the INSERT to include the vector.
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
