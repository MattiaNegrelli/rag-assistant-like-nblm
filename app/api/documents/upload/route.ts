import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { storage } from '@/lib/storage';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;
        const workspaceId = formData.get('workspaceId') as string;

        if (!file || !workspaceId) {
            return NextResponse.json({ error: 'Missing file or workspaceId' }, { status: 400 });
        }

        // 1. Upload to Blob Storage
        const blobUrl = await storage.upload(file, `workspaces/${workspaceId}/${file.name}`);

        // 2. Setup/Get Workspace (For MVP, ensure it exists or create one if we are just starting)
        // Normally workspace comes from Auth, but MVP requests passing it or ensuring integrity.
        // Let's check if workspace exists, if not create it for MVP flow ease.
        let workspace = await db.workspace.findUnique({ where: { id: workspaceId } });
        if (!workspace) {
            workspace = await db.workspace.create({
                data: { id: workspaceId, name: 'Default Workspace' }
            });
        }

        // 3. Create Document Record
        const document = await db.document.create({
            data: {
                workspaceId: workspace.id,
                filename: file.name,
                originalName: file.name,
                storageUrl: blobUrl,
                status: 'PENDING',
            },
        });

        return NextResponse.json(document);
    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }
}
