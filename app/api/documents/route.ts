import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const workspaceId = searchParams.get('workspaceId');
        const search = searchParams.get('search');

        if (!workspaceId) {
            return NextResponse.json({ error: 'Missing workspaceId' }, { status: 400 });
        }

        const whereClause: any = { workspaceId };
        if (search) {
            whereClause.originalName = {
                contains: search,
                mode: 'insensitive',
            };
        }

        const documents = await db.document.findMany({
            where: whereClause,
            orderBy: { originalName: 'asc' },
        });

        return NextResponse.json(documents);
    } catch (error) {
        console.error('List documents error:', error);
        return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
    }
}
