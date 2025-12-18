import Link from 'next/link';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
            {/* Sidebar */}
            <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h1 className="text-xl font-bold text-gray-800 dark:text-white">RAG Workspace</h1>
                    <p className="text-xs text-gray-500 mt-1">v0.1.0 MVP</p>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    <Link href="/documents" className="flex items-center px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md">
                        <span className="mr-3">📄</span> Documents
                    </Link>
                    <Link href="/chat" className="flex items-center px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md">
                        <span className="mr-3">💬</span> Chat Assistant
                    </Link>
                </nav>

                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="text-sm text-gray-500">Logged in as Admin</div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                {children}
            </main>
        </div>
    );
}
