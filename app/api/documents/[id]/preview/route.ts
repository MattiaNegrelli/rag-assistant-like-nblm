import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const document = await db.document.findUnique({
            where: { id: params.id },
        });

        if (!document || !document.storageUrl) {
            return NextResponse.json({ error: 'Document not found' }, { status: 404 });
        }

        // Fetch the file from the storage URL (Blob Storage)
        const response = await fetch(document.storageUrl);

        if (!response.ok) {
            return NextResponse.json({ error: 'Failed to fetch document content' }, { status: 502 });
        }

        const blob = await response.blob();
        const headers = new Headers();

        headers.set('Content-Type', 'application/pdf');
        headers.set('Content-Disposition', `inline; filename="${document.filename}"`);
        headers.set('Cache-Control', 'public, max-age=3600');

        return new NextResponse(blob, {
            status: 200,
            headers,
        });

    } catch (error) {
        console.error('Preview error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
