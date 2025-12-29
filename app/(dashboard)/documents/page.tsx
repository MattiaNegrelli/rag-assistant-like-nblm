'use client';

import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { FileText, UploadCloud, Loader2, CheckCircle2, AlertCircle, RefreshCw, Trash2, X } from 'lucide-react';

type Document = {
    id: string;
    filename: string;
    status: string;
    pageCount: number;
    createdAt: string;
    originalName: string;
    storageUrl: string;
};

export default function DocumentsPage() {
    const [uploading, setUploading] = useState(false);
    const [documents, setDocuments] = useState<Document[]>([]);
    const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [searchQuery, setSearchQuery] = useState('');
    const WORKSPACE_ID = "default-workspace";

    const fetchDocuments = useCallback(async (query: string = '') => {
        const res = await fetch(`/api/documents?workspaceId=${WORKSPACE_ID}&search=${encodeURIComponent(query)}`);
        if (res.ok) {
            const data = await res.json();
            setDocuments(data);
        }
    }, []);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchDocuments(searchQuery);
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery, fetchDocuments]);

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        if (acceptedFiles.length === 0) return;

        setUploading(true);

        try {
            const uploadPromises = acceptedFiles.map(async (file) => {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('workspaceId', WORKSPACE_ID);

                const res = await fetch('/api/documents/upload', {
                    method: 'POST',
                    body: formData,
                });

                if (res.ok) {
                    const doc = await res.json();
                    await fetch(`/api/documents/${doc.id}/ingest`, { method: 'POST' });
                } else {
                    console.error(`Failed to upload ${file.name}`);
                }
            });

            await Promise.all(uploadPromises);
            fetchDocuments(searchQuery);
        } catch (err) {
            console.error(err);
            alert("Some uploads may have failed");
        } finally {
            setUploading(false);
        }
    }, [fetchDocuments, searchQuery]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { 'application/pdf': ['.pdf'] } });

    const ingestDocument = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        await fetch(`/api/documents/${id}/ingest`, { method: 'POST' });
        fetchDocuments(searchQuery);
    };

    const deleteDocument = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete this document? This cannot be undone.')) return;

        try {
            const res = await fetch(`/api/documents/${id}`, { method: 'DELETE' });
            if (res.ok) {
                fetchDocuments(searchQuery);
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
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search documents..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-4 pr-10 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-64"
                        />
                    </div>
                    <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1 border border-gray-200 dark:border-gray-700">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="7" y="7" width="3" height="3"></rect><rect x="14" y="7" width="3" height="3"></rect><rect x="7" y="14" width="3" height="3"></rect><rect x="14" y="14" width="3" height="3"></rect><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect></svg>
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
                        </button>
                    </div>
                    <button onClick={() => fetchDocuments(searchQuery)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
                        <RefreshCw size={20} />
                    </button>
                </div>
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

            {/* Content View */}
            {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {documents.map((doc) => (
                        <div
                            key={doc.id}
                            onClick={() => setSelectedDocument(doc)}
                            className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden cursor-pointer"
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
            ) : (
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
                        <thead className="bg-gray-50 dark:bg-gray-900/50 text-xs uppercase font-medium text-gray-500 dark:text-gray-400">
                            <tr>
                                <th className="px-6 py-4">Name</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Info</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800/50">
                            {documents.map((doc) => (
                                <tr
                                    key={doc.id}
                                    onClick={() => setSelectedDocument(doc)}
                                    className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors cursor-pointer"
                                >
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-500">
                                                <FileText size={16} />
                                            </div>
                                            <span className="font-medium text-gray-900 dark:text-gray-200">{doc.originalName}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <StatusBadge status={doc.status} />
                                    </td>
                                    <td className="px-6 py-4">
                                        {doc.pageCount} pages • {new Date(doc.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-3">
                                            {doc.status !== 'READY' && doc.status !== 'PROCESSING' && (
                                                <button
                                                    onClick={(e) => ingestDocument(doc.id, e)}
                                                    className="text-blue-600 hover:text-blue-700"
                                                    title="Retry Ingest"
                                                >
                                                    <RefreshCw size={16} />
                                                </button>
                                            )}
                                            <button
                                                onClick={(e) => deleteDocument(doc.id, e)}
                                                className="text-gray-400 hover:text-red-500"
                                                title="Delete"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Document Modal */}
            {selectedDocument && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setSelectedDocument(null)}>
                    <div
                        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden relative animate-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-500">
                                    <FileText size={20} />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 dark:text-white leading-tight">{selectedDocument.originalName}</h3>
                                    <p className="text-xs text-gray-500">{selectedDocument.pageCount} pages • {new Date(selectedDocument.createdAt).toLocaleString()}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedDocument(null)}
                                className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="flex-1 bg-gray-100 dark:bg-gray-950 p-0 relative">
                            <iframe
                                src={`/api/documents/${selectedDocument.id}/preview`}
                                className="w-full h-full border-0"
                                title="Document Preview"
                            />
                        </div>
                    </div>
                </div>
            )}
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
