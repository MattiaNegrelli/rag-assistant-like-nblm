'use client';

import { useState, useRef, useEffect } from 'react';

type Message = {
    role: 'user' | 'assistant';
    content: string;
    sources?: { documentName: string; page: number; quote: string }[];
};

export default function ChatPage() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const WORKSPACE_ID = "default-workspace";

    // Auto-scroll
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMsg = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setLoading(true);

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userMsg, workspaceId: WORKSPACE_ID }),
            });

            const data = await res.json();

            setMessages(prev => [...prev, {
                role: 'assistant',
                content: data.answer,
                sources: data.sources
            }]);
        } catch (err) {
            console.error(err);
            setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I encountered an error." }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-gray-900">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-800">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Workspace Chat</h2>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6" ref={scrollRef}>
                {messages.length === 0 && (
                    <div className="text-center text-gray-500 mt-20">
                        <p className="text-lg">Ask me anything about your documents!</p>
                    </div>
                )}

                {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-2xl p-4 rounded-lg shadow-sm border ${msg.role === 'user'
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-gray-50 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700'
                            }`}>
                            <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>

                            {/* Sources */}
                            {msg.sources && msg.sources.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-gray-200/20">
                                    <p className="text-xs font-semibold opacity-70 mb-2">Sources:</p>
                                    <div className="space-y-2">
                                        {msg.sources.map((src, idx) => (
                                            <div key={idx} className="bg-gray-100 dark:bg-gray-700/50 p-2 rounded text-xs border border-gray-200 dark:border-gray-700">
                                                <div className="font-medium text-blue-600 dark:text-blue-400">
                                                    📄 {src.documentName} (Page {src.page})
                                                </div>
                                                <div className="mt-1 italic opacity-80 line-clamp-2">
                                                    "{src.quote}"
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="flex justify-start">
                        <div className="bg-gray-100 p-4 rounded-lg animate-pulse">
                            Thinking...
                        </div>
                    </div>
                )}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
                <form onSubmit={handleSend} className="max-w-4xl mx-auto flex gap-4">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Search your knowledge base..."
                        className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none dark:bg-gray-800 dark:border-gray-700"
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                        Send
                    </button>
                </form>
            </div>
        </div>
    );
}
