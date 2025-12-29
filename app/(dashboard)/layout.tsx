import Link from 'next/link';
import { LayoutDashboard, FileText, MessageSquare, Settings, LogOut, FileInput } from 'lucide-react';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex h-screen bg-[#F3F4F6] dark:bg-[#111827] overflow-hidden font-sans">
            {/* Sidebar */}
            <aside className="w-72 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-r border-gray-200 dark:border-gray-800 flex flex-col shadow-xl z-20">
                <div className="p-8 pb-4">
                    <Link href="/documents" className="flex items-center gap-3 group">
                        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/30 group-hover:scale-105 transition-transform">
                            <FileText size={20} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Kraken</h1>
                            <p className="text-xs text-gray-500 font-medium tracking-wide text-blue-600 dark:text-blue-400">RAG Workspace</p>
                        </div>
                    </Link>
                </div>

                <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
                    <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 px-4">Menu</div>

                    <SidebarLink href="/documents" icon={<FileInput size={20} />} label="Documents" />
                    <SidebarLink href="/chat" icon={<MessageSquare size={20} />} label="Chat Assistant" />

                    <div className="my-6 border-b border-gray-100 dark:border-gray-800"></div>

                    <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 px-4">Settings</div>
                    <SidebarLink href="#" icon={<Settings size={20} />} label="Workspace" active={false} />
                </nav>

                <div className="p-4 m-4 bg-blue-50 dark:bg-gray-800/50 rounded-2xl border border-blue-100 dark:border-gray-700/50">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 shadow-md"></div>
                        <div>
                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Admin User</p>
                            <p className="text-xs text-gray-500">Pro Plan</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 relative overflow-auto bg-gray-50/50 dark:bg-[#0B1120]">
                <div className="absolute inset-0 pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
                {children}
            </main>
        </div>
    );
}

function SidebarLink({ href, icon, label, active }: { href: string; icon: React.ReactNode; label: string; active?: boolean }) {
    return (
        <Link href={href} className={`
            flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
            ${active
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/60 hover:text-gray-900 dark:hover:text-white'
            }
        `}>
            {icon}
            <span className="font-medium">{label}</span>
        </Link>
    )
}
