import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getEmbeddings, generateRAGResponse } from '@/lib/openai';

export async function POST(req: NextRequest) {
    try {
        const { message, workspaceId } = await req.json();

        if (!message || !workspaceId) {
            return NextResponse.json({ error: 'Missing message or workspaceId' }, { status: 400 });
        }

        // 1. Embed Query
        const queryEmbedding = await getEmbeddings(message);

        // 2. Vector Search (Hybrid or pure Similarity)
        // We use pgvector cosine similarity (<=>)
        // We need to type the result outcome
        const results = await db.$queryRaw`
      SELECT 
        dc."documentId",
        d."originalName" as "documentName",
        dc."pageNumber" as "page",
        dc."content" as "text",
        1 - (dc."embedding" <=> ${JSON.stringify(queryEmbedding)}::vector) as similarity
      FROM "DocumentChunk" dc
      JOIN "Document" d ON dc."documentId" = d."id"
      WHERE dc."workspaceId" = ${workspaceId}
      AND d."status" = 'READY'
      ORDER BY similarity DESC
      LIMIT 10;
    ` as any[];

        // 3. Filter by threshold (optional, but good practice)
        const validResults = results.filter(r => r.similarity > 0.5); // Loose threshold for MVP

        if (validResults.length === 0) {
            return NextResponse.json({
                answer: "I couldn't find any relevant information in the uploaded documents for this workspace.",
                sources: []
            });
        }

        // 4. Generate Answer
        const response = await generateRAGResponse(message, validResults.map(r => ({
            documentId: r.documentId,
            documentName: r.documentName,
            page: r.page,
            text: r.text
        })));

        return NextResponse.json(response);

    } catch (error) {
        console.error('Chat error:', error);
        return NextResponse.json({ error: 'Chat processing failed' }, { status: 500 });
    }
}
