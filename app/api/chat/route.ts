import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getEmbeddings, generateRAGResponse } from '@/lib/openai';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const { message, workspaceId, conversationId, isRegeneration } = await req.json();

        if (!message || !workspaceId) {
            return NextResponse.json({ error: 'Missing message or workspaceId' }, { status: 400 });
        }

        // 0. Resolve Conversation
        let currentConversationId = conversationId;
        if (!currentConversationId) {
            const newConversation = await db.conversation.create({
                data: {
                    workspaceId,
                    title: message.slice(0, 50) + (message.length > 50 ? '...' : ''), // Simple title gen
                }
            });
            currentConversationId = newConversation.id;
        }

        // 1. Handle Message History (Regeneration vs New Logic)
        if (isRegeneration) {
            // Delete the last assistant message to replace it
            const lastMessage = await db.message.findFirst({
                where: { conversationId: currentConversationId, role: 'assistant' },
                orderBy: { createdAt: 'desc' }
            });

            if (lastMessage) {
                await db.message.delete({
                    where: { id: lastMessage.id }
                });
            }
            // SKIP creating a new user message because it already exists
        } else {
            // 1. Save User Message (Normal Flow)
            await db.message.create({
                data: {
                    conversationId: currentConversationId,
                    role: 'user',
                    content: message,
                }
            });
        }

        // 2. Embed Query
        const queryEmbedding = await getEmbeddings(message);

        // 3. Vector Search
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

        // 4. Generate Answer
        const validResults = results.filter(r => r.similarity > 0.5);
        let answer = "I couldn't find any relevant information in the uploaded documents.";
        let sources = [];

        if (validResults.length > 0) {
            // ... Call LLM
            const ragResponse = await generateRAGResponse(message, validResults.map(r => ({
                documentId: r.documentId,
                documentName: r.documentName,
                page: r.page,
                text: r.text
            })));
            answer = ragResponse.answer;
            sources = ragResponse.sources;
        }

        // 5. Save Assistant Message
        await db.message.create({
            data: {
                conversationId: currentConversationId,
                role: 'assistant',
                content: answer,
                sources: sources ? sources : undefined,
            }
        });

        // 6. Update Conversation Timestamp
        await db.conversation.update({
            where: { id: currentConversationId },
            data: { updatedAt: new Date() }
        });

        return NextResponse.json({
            answer,
            sources,
            conversationId: currentConversationId
        });

    } catch (error) {
        console.error('Chat error:', error);
        return NextResponse.json({ error: 'Chat processing failed' }, { status: 500 });
    }
}
