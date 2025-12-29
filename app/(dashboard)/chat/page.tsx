'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, User, Sparkles, BookOpen, ChevronRight, StopCircle, RefreshCw } from 'lucide-react';

type Message = {
    role: 'user' | 'assistant';
    content: string;
    sources?: { documentName: string; page: number; quote: string }[];
};

export default function ChatPage() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [conversations, setConversations] = useState<{ id: string, title: string, updatedAt: string }[]>([]);
    const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const WORKSPACE_ID = "default-workspace";

    // Fetch conversations on mount
    const fetchConversations = async () => {
        const res = await fetch(`/api/conversations?workspaceId=${WORKSPACE_ID}`);
        if (res.ok) {
            setConversations(await res.json());
        }
    };

    useEffect(() => {
        fetchConversations();
    }, []);

    // Load conversation history
    const loadConversation = async (id: string) => {
        setCurrentConversationId(id);
        const res = await fetch(`/api/conversations/${id}`);
        if (res.ok) {
            const data = await res.json();
            setMessages(data.map((m: any) => ({
                role: m.role,
                content: m.content,
                sources: m.sources ? JSON.parse(JSON.stringify(m.sources)) : undefined // Handle JSON/Object nuances
            })));
        }
    };

    const startNewChat = () => {
        setCurrentConversationId(null);
        setMessages([]);
        inputRef.current?.focus();
    };

    // Auto-scroll
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, loading]);

    // Focus input on mount
    useEffect(() => {
        inputRef.current?.focus();
    }, []);

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
                body: JSON.stringify({
                    message: userMsg,
                    workspaceId: WORKSPACE_ID,
                    conversationId: currentConversationId
                }),
            });

            const data = await res.json();

            setMessages(prev => [...prev, {
                role: 'assistant',
                content: data.answer,
                sources: data.sources
            }]);

            // If it was a new conversation, update ID and refresh list
            if (!currentConversationId && data.conversationId) {
                setCurrentConversationId(data.conversationId);
                fetchConversations();
            } else {
                // Just refresh list to update order/title if needed
                fetchConversations();
            }

        } catch (err) {
            console.error(err);
            setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I encountered an error connecting to the knowledge base." }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex h-full relative z-10">
            {/* Sidebar (History) */}
            <div className="w-64 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col hidden md:flex">
                <div className="p-4">
                    <button
                        onClick={startNewChat}
                        className="w-full flex items-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all shadow-sm font-medium text-sm"
                    >
                        <Sparkles size={16} /> New Chat
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto px-2 space-y-1">
                    {conversations.map(conv => (
                        <button
                            key={conv.id}
                            onClick={() => loadConversation(conv.id)}
                            className={`w-full text-left px-3 py-2.5 rounded-lg text-sm truncate transition-colors ${currentConversationId === conv.id
                                ? 'bg-white dark:bg-gray-800 shadow-sm text-gray-900 dark:text-white font-medium'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200/50 dark:hover:bg-gray-800/50'
                                }`}
                        >
                            {conv.title}
                        </button>
                    ))}
                    {conversations.length === 0 && (
                        <div className="text-center py-8 text-xs text-gray-400">
                            No history yet
                        </div>
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col h-full overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 flex items-center justify-between backdrop-blur-sm border-b border-gray-100 dark:border-gray-800/50">
                    <div className="flex items-center gap-3">
                        {/* Mobile menu logic could go here */}
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">AI Assistant</h2>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                            Online
                        </p>
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-4 md:px-8 pb-4 space-y-8 scroll-smooth" ref={scrollRef}>
                    {messages.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-center opacity-0 animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-forwards" style={{ animationDelay: '0.2s' }}>
                            <div className="w-24 h-24 bg-gradient-to-tr from-blue-100 to-indigo-50 dark:from-blue-900/40 dark:to-indigo-900/20 rounded-3xl flex items-center justify-center mb-8 shadow-inner ring-1 ring-black/5 dark:ring-white/10">
                                <BookOpen size={40} className="text-blue-600 dark:text-blue-400" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">What would you like to know?</h3>
                            <p className="text-gray-500 max-w-md mx-auto leading-relaxed">
                                I can answer questions based on your uploaded PDF documents.
                                The history sidebar allows you to continue previous conversations.
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-12 w-full max-w-2xl">
                                {['Summarize the latest product catalog', 'What are the safety protocols?', 'Compare price lists for 2024'].map((suggestion, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setInput(suggestion)}
                                        className="p-4 text-sm text-left bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-blue-400 hover:shadow-md transition-all text-gray-600 dark:text-gray-300"
                                    >
                                        {suggestion}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {messages.map((msg, i) => (
                        <div key={i} className={`flex gap-4 max-w-4xl mx-auto ${msg.role === 'user' ? 'justify-end' : ''} animate-in fade-in slide-in-from-bottom-2 duration-300`}>

                            {msg.role === 'assistant' && (
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex-shrink-0 flex items-center justify-center shadow-md mt-1">
                                    <Sparkles size={14} className="text-white" />
                                </div>
                            )}

                            <div className={`space-y-2 max-w-[85%] ${msg.role === 'user' ? 'order-1' : 'order-2'}`}>
                                {msg.role === 'user' ? (
                                    <div className="bg-blue-600 text-white px-6 py-3.5 rounded-2xl rounded-tr-sm shadow-md text-[15px] leading-relaxed">
                                        {msg.content}
                                    </div>
                                ) : (
                                    <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 px-6 py-5 rounded-2xl rounded-tl-sm shadow-sm text-gray-800 dark:text-gray-200 text-[15px] leading-7">
                                        {msg.content}

                                        {/* Citations */}
                                        {msg.sources && msg.sources.length > 0 && typeof msg.sources === 'object' && (
                                            <div className="mt-6 pt-5 border-t border-gray-100 dark:border-gray-700/50">
                                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                                    <BookOpen size={12} /> Sources Verified
                                                </p>
                                                <div className="grid gap-2">
                                                    {/* @ts-ignore */}
                                                    {msg.sources.map((src: any, idx: number) => (
                                                        <div key={idx} className="group flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-gray-100 dark:border-gray-700/50 hover:border-blue-200 dark:hover:border-blue-500/30 transition-colors cursor-help">
                                                            <div className="mt-0.5 min-w-[20px] h-5 rounded-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 flex items-center justify-center text-[10px] font-bold text-gray-500">
                                                                {idx + 1}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-baseline justify-between gap-2">
                                                                    <h4 className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                                                                        {src.documentName}
                                                                    </h4>
                                                                    <span className="text-[10px] text-gray-400 whitespace-nowrap bg-white dark:bg-gray-800 px-1.5 py-0.5 rounded border border-gray-100 dark:border-gray-700">Page {src.page}</span>
                                                                </div>
                                                                <p className="text-xs text-gray-500 mt-1 italic line-clamp-2 leading-relaxed opacity-80 group-hover:opacity-100 transition-opacity">
                                                                    "{src.quote}"
                                                                </p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Regenerate Button (Only for last assistant message) */}
                                {msg.role === 'assistant' && i === messages.length - 1 && !loading && (
                                    <div className="mt-2 flex justify-start animate-in fade-in duration-300">
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                const lastUserMsgIndex = messages.findLastIndex(m => m.role === 'user');
                                                if (lastUserMsgIndex !== -1) {
                                                    const lastMsg = messages[lastUserMsgIndex].content;
                                                    setMessages(prev => prev.slice(0, -1));
                                                    setLoading(true);
                                                    fetch('/api/chat', {
                                                        method: 'POST',
                                                        headers: { 'Content-Type': 'application/json' },
                                                        body: JSON.stringify({
                                                            message: lastMsg,
                                                            workspaceId: WORKSPACE_ID,
                                                            conversationId: currentConversationId
                                                        }),
                                                    })
                                                        .then(res => res.json())
                                                        .then(data => {
                                                            setMessages(prev => [...prev, {
                                                                role: 'assistant',
                                                                content: data.answer,
                                                                sources: data.sources
                                                            }]);
                                                            if (!currentConversationId && data.conversationId) {
                                                                setCurrentConversationId(data.conversationId);
                                                                fetchConversations();
                                                            }
                                                        })
                                                        .catch(err => {
                                                            console.error(err);
                                                            setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I encountered an error regenerating the response." }]);
                                                        })
                                                        .finally(() => setLoading(false));
                                                }
                                            }}
                                            className="text-xs text-gray-400 hover:text-blue-600 flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                                            title="Regenerate this response"
                                        >
                                            <RefreshCw size={12} /> Regenerate
                                        </button>
                                    </div>
                                )}
                            </div>

                            {msg.role === 'user' && (
                                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0 flex items-center justify-center mt-1">
                                    <User size={14} className="text-gray-500 dark:text-gray-400" />
                                </div>
                            )}
                        </div>
                    ))}

                    {loading && (
                        <div className="flex gap-4 max-w-4xl mx-auto animate-pulse">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex-shrink-0 flex items-center justify-center opacity-50">
                                <Sparkles size={14} className="text-white" />
                            </div>
                            <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 px-6 py-4 rounded-2xl rounded-tl-sm shadow-sm">
                                <div className="flex gap-1.5">
                                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Input Area */}
                <div className="p-6 bg-gradient-to-t from-gray-50 via-gray-50 to-transparent dark:from-[#0B1120] dark:via-[#0B1120] sticky bottom-0 z-30">
                    <div className="max-w-4xl mx-auto relative group">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl opacity-20 group-hover:opacity-100 transition duration-500 blur"></div>
                        <form onSubmit={handleSend} className="relative flex items-center bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-2 pl-4 transition-all focus-within:ring-2 focus-within:ring-blue-100 dark:focus-within:ring-blue-900/30">
                            <input
                                ref={inputRef}
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Ask a follow up..."
                                className="flex-1 bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-400 text-base py-3"
                            />
                            <button
                                type="submit"
                                disabled={loading || !input.trim()}
                                className="p-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 dark:disabled:bg-gray-700 disabled:text-gray-400 text-white rounded-lg transition-all duration-200 shadow-sm transform hover:scale-105 active:scale-95"
                            >
                                {loading ? <StopCircle size={20} /> : <Send size={20} />}
                            </button>
                        </form>
                        <div className="text-center mt-3">
                            <p className="text-[10px] text-gray-400">AI can make mistakes. Please verify important information.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
