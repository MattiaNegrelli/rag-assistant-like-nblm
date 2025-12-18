import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const workspaceId = searchParams.get('workspaceId');

        if (!workspaceId) {
            return NextResponse.json({ error: 'Missing workspaceId' }, { status: 400 });
        }

        const documents = await db.document.findMany({
            where: { workspaceId },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json(documents);
    } catch (error) {
        console.error('List documents error:', error);
        return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
    }
}
