import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard, Users, BookOpen, BarChart2, FileText,
    Settings, User, LogOut, Menu, X
} from 'lucide-react';

const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { to: '/students', label: 'Students', icon: Users },
    { to: '/exams', label: 'Exams', icon: BookOpen },
    { to: '/results', label: 'Results', icon: BarChart2 },
    { to: '/past-papers', label: 'Past Papers', icon: FileText },
    { to: '/site-settings', label: 'Site Settings', icon: Settings },
    { to: '/profile', label: 'Profile', icon: User },
];

export default function Layout() {
    const { admin, logoutAdmin } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Auto-close sidebar on mobile when route changes
    useEffect(() => {
        setIsSidebarOpen(false);
    }, [location]);

    const handleLogout = () => {
        logoutAdmin();
        navigate('/login');
    };

    return (
        <div className="flex h-screen bg-[#020617] text-slate-200 overflow-hidden relative">
            {/* Mobile Header */}
            <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[#0b1221] border-b border-slate-800 flex items-center justify-between px-4 z-40">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center p-1 border border-slate-700 shadow-sm">
                        <img src="/logo.png" alt="School Logo" className="w-full h-full object-contain" />
                    </div>
                    <span className="text-white font-bold text-sm tracking-wide uppercase font-outfit">EMS Admin</span>
                </div>
                <button 
                    onClick={() => setIsSidebarOpen(true)}
                    className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                >
                    <Menu className="w-6 h-6" />
                </button>
            </header>

            {/* Mobile Backdrop */}
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar (Adaptive) */}
            <aside className={`
                fixed inset-y-0 left-0 w-64 bg-[#0f172a] shadow-[4px_0_24px_rgba(0,0,0,0.4)] flex flex-col flex-shrink-0 z-50 border-r border-slate-800 transition-transform duration-300 ease-in-out
                md:static md:translate-x-0
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            `}>
                {/* Logo Section */}
                <div className="flex items-center justify-between gap-3 px-6 py-5 border-b border-slate-800 bg-[#0b1221]">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center p-1 border border-slate-700 shadow-sm">
                            <img src="/logo.png" alt="School Logo" className="w-full h-full object-contain" />
                        </div>
                        <div>
                            <p className="text-white font-bold text-sm leading-tight tracking-wide uppercase font-outfit">Exam System</p>
                            <p className="text-blue-400 text-xs">Admin Portal</p>
                        </div>
                    </div>
                    {/* Close button for mobile */}
                    <button 
                        onClick={() => setIsSidebarOpen(false)}
                        className="md:hidden p-1 text-slate-400 hover:text-white"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Nav Links */}
                <nav className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto custom-scrollbar">
                    {navItems.map(({ to, label, icon: Icon, exact }) => (
                        <NavLink
                            key={to}
                            to={to}
                            end={exact}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${isActive
                                    ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20'
                                    : 'text-slate-400 hover:bg-[#1e293b] hover:text-white'
                                }`
                            }
                        >
                            <Icon className="w-4.5 h-4.5" />
                            {label}
                        </NavLink>
                    ))}
                </nav>

                {/* Admin Info + Logout */}
                <div className="px-4 py-4 border-t border-slate-800 bg-[#0b1221]">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                            {admin?.name?.[0]?.toUpperCase() || 'A'}
                        </div>
                        <div className="min-w-0">
                            <p className="text-white text-sm font-medium truncate">{admin?.name}</p>
                            <p className="text-slate-400 text-xs truncate">{admin?.email}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 text-slate-400 hover:text-white text-sm px-3 py-2 rounded-lg hover:bg-slate-800 transition-colors w-full"
                    >
                        <LogOut className="w-4 h-4" /> Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto mt-16 md:mt-0 pt-2 pb-8">
                <Outlet />
            </main>
        </div>
    );
}
