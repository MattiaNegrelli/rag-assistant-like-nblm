import { put } from '@vercel/blob';

export const storage = {
    async upload(file: File, filename: string): Promise<string> {
        const blob = await put(filename, file, {
            access: 'public',
        });
        return blob.url;
    },
};
