'use client';

import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { FileText, UploadCloud, Loader2, CheckCircle2, AlertCircle, RefreshCw, Trash2 } from 'lucide-react';

type Document = {
    id: string;
    filename: string;
    status: string;
    pageCount: number;
    createdAt: string;
    originalName: string;
};

export default function DocumentsPage() {
    const [uploading, setUploading] = useState(false);
    const [documents, setDocuments] = useState<Document[]>([]);
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

    const ingestDocument = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        await fetch(`/api/documents/${id}/ingest`, { method: 'POST' });
        fetchDocuments();
    };

    const deleteDocument = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete this document? This cannot be undone.')) return;

        try {
            const res = await fetch(`/api/documents/${id}`, { method: 'DELETE' });
            if (res.ok) {
                fetchDocuments();
            } else {
                alert('Failed to delete document');
            }
        } catch (error) {
            console.error('Delete error:', error);
            alert('Error deleting document');
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 relative z-10">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Knowledge Base</h2>
                    <p className="text-gray-500 mt-2">Manage your PDF documents and ingestion status.</p>
                </div>
                <button onClick={fetchDocuments} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
                    <RefreshCw size={20} />
                </button>
            </div>

            {/* Upload Area */}
            <div
                {...getRootProps()}
                className={`
                    group relative overflow-hidden rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer p-12 text-center
                    ${isDragActive
                        ? 'border-blue-500 bg-blue-50/50 scale-[1.01]'
                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-lg'
                    }
                `}
            >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center justify-center gap-4 relative z-10">
                    <div className={`
                        w-16 h-16 rounded-2xl flex items-center justify-center transition-colors shadow-sm
                        ${isDragActive ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 group-hover:bg-blue-50 group-hover:text-blue-600'}
                    `}>
                        {uploading ? <Loader2 className="animate-spin" size={32} /> : <UploadCloud size={32} />}
                    </div>
                    <div>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                            {uploading ? "Uploading & Processing..." : "Click or drag PDF files here"}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                            Supported format: .pdf (Text-based)
                        </p>
                    </div>
                </div>
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px]"></div>
            </div>

            {/* Grid List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {documents.map((doc) => (
                    <div
                        key={doc.id}
                        className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="w-10 h-10 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-500">
                                <FileText size={20} />
                            </div>
                            <StatusBadge status={doc.status} />
                        </div>

                        <h3 className="font-semibold text-gray-900 dark:text-white truncate pr-2 mb-1" title={doc.originalName}>
                            {doc.originalName}
                        </h3>
                        <div className="flex items-center text-xs text-gray-500 gap-2 mb-4">
                            <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                            <span>•</span>
                            <span>{doc.pageCount} pages</span>
                        </div>

                        <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50 dark:border-gray-700">
                            {doc.status !== 'READY' && doc.status !== 'PROCESSING' ? (
                                <button
                                    onClick={(e) => ingestDocument(doc.id, e)}
                                    className="text-xs font-medium text-blue-600 hover:underline flex items-center gap-1"
                                >
                                    <RefreshCw size={12} /> Retry Ingest
                                </button>
                            ) : (
                                <span className="text-xs text-gray-400">Synced</span>
                            )}
                            <button
                                onClick={(e) => deleteDocument(doc.id, e)}
                                className="text-gray-300 hover:text-red-500 transition-colors"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    if (status === 'READY') {
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200"><CheckCircle2 size={12} className="mr-1" /> Ready</span>
    }
    if (status === 'PROCESSING') {
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200"><Loader2 size={12} className="mr-1 animate-spin" /> Processing</span>
    }
    if (status === 'ERROR') {
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200"><AlertCircle size={12} className="mr-1" /> Error</span>
    }
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200"><Loader2 size={12} className="mr-1" /> Pending</span>
}
