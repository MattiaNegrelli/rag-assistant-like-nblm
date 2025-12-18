import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { storage } from '@/lib/storage';

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const documentId = params.id;

        // 1. Get document to find storage URL
        const document = await db.document.findUnique({
            where: { id: documentId },
        });

        if (!document) {
            return NextResponse.json({ error: 'Document not found' }, { status: 404 });
        }

        // 2. Delete from Blob Storage
        // Handle cases where storageUrl might be missing or invalid gracefully
        if (document.storageUrl) {
            try {
                await storage.delete(document.storageUrl);
            } catch (e) {
                console.warn("Failed to delete blob", e);
                // Continue to delete info from DB even if blob delete fails
            }
        }

        // 3. Delete from DB (Cascade deletes chunks because schema has onDelete: Cascade)
        await db.document.delete({
            where: { id: documentId },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete error:', error);
        return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
    }
}
