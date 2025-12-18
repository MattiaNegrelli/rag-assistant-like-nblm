import { put, del } from '@vercel/blob';

export const storage = {
    async upload(file: File, filename: string): Promise<string> {
        const blob = await put(filename, file, {
            access: 'public',
        });
        return blob.url;
    },

    async delete(url: string): Promise<void> {
        await del(url);
    },
};
