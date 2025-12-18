'use client';

import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';

type Document = {
    id: string;
    filename: string;
    status: string;
    pageCount: number;
    createdAt: string;
};

export default function DocumentsPage() {
    const [uploading, setUploading] = useState(false);
    const [documents, setDocuments] = useState<Document[]>([]);

    // Hardcoded workspace for MVP simplicity as requested
    const WORKSPACE_ID = "default-workspace";

    const fetchDocuments = useCallback(async () => {
        const res = await fetch(`/api/documents?workspaceId=${WORKSPACE_ID}`);
        if (res.ok) {
            const data = await res.json();
            setDocuments(data);
        }
    }, []);

    useEffect(() => {
        fetchDocuments();
    }, [fetchDocuments]);

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('workspaceId', WORKSPACE_ID);

        try {
            const res = await fetch('/api/documents/upload', {
                method: 'POST',
                body: formData,
            });

            if (res.ok) {
                const doc = await res.json();
                // Auto-trigger ingestion for better UX
                await fetch(`/api/documents/${doc.id}/ingest`, { method: 'POST' });
                fetchDocuments();
            }
        } catch (err) {
            console.error(err);
            alert("Upload failed");
        } finally {
            setUploading(false);
        }
    }, [fetchDocuments]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { 'application/pdf': ['.pdf'] } });

    const ingestDocument = async (id: string) => {
        await fetch(`/api/documents/${id}/ingest`, { method: 'POST' });
        fetchDocuments();
    };

    return (
        <div className="p-8 max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Documents</h2>

            {/* Upload Area */}
            <div {...getRootProps()} className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors mb-8
                ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}>
                <input {...getInputProps()} />
                {uploading ? (
                    <p className="text-blue-500">Uploading & Processing...</p>
                ) : (
                    <p className="text-gray-600">Drag & drop a PDF here, or click to select files</p>
                )}
            </div>

            {/* List */}
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Filename</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pages</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {documents.map((doc) => (
                            <tr key={doc.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{doc.filename}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{doc.pageCount}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                        ${doc.status === 'READY' ? 'bg-green-100 text-green-800' :
                                            doc.status === 'ERROR' ? 'bg-red-100 text-red-800' :
                                                'bg-yellow-100 text-yellow-800'}`}>
                                        {doc.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    {doc.status !== 'READY' && doc.status !== 'PROCESSING' && (
                                        <button onClick={() => ingestDocument(doc.id)} className="text-indigo-600 hover:text-indigo-900 mr-4">Retry Ingest</button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
