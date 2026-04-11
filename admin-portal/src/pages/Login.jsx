import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { login as loginApi } from '../api/client';
import toast from 'react-hot-toast';
import { GraduationCap, Lock, Mail, Eye, EyeOff } from 'lucide-react';

export default function Login() {
    const [form, setForm] = useState({ email: '', password: '' });
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const { loginAdmin } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { data } = await loginApi(form);
            loginAdmin(data.token, data.admin);
            navigate('/');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Login failed. Check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            {/* Animated background blobs can go here optionally */}
            <div className="w-full max-w-md relative z-10">
                {/* Card */}
                <div className="glass-panel rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/20">
                    {/* Header */}
                    <div className="bg-white/5 border-b border-white/10 px-8 py-8 text-center backdrop-blur-md">
                        <div className="w-16 h-16 bg-blue-600/20 border border-blue-500/30 rounded-2xl mx-auto flex items-center justify-center shadow-inner mb-4">
                            <GraduationCap className="w-9 h-9 text-blue-400" />
                        </div>
                        <h1 className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 text-2xl font-extrabold tracking-wide">Exam Management</h1>
                        <p className="text-slate-300 font-medium text-sm mt-1">Admin Portal — Sign In</p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="px-8 py-8 space-y-5 bg-white/5 backdrop-blur-sm">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="email"
                                    required
                                    value={form.email}
                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                    placeholder="admin@ems.com"
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-900/50 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-inner"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type={showPass ? 'text' : 'password'}
                                    required
                                    value={form.password}
                                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                                    placeholder="••••••••"
                                    className="w-full pl-10 pr-10 py-2.5 bg-slate-900/50 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-inner"
                                />
                                <button type="button" onClick={() => setShowPass(!showPass)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors">
                                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 mt-4 bg-blue-600/90 hover:bg-blue-500 text-white font-bold rounded-lg transition-all duration-300 shadow-[0_4px_20px_rgba(37,99,235,0.4)] disabled:opacity-60 disabled:cursor-not-allowed hover:-translate-y-0.5"
                        >
                            {loading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>
                </div>
                <p className="text-center text-blue-300 text-xs mt-4">
                    Default: admin@ems.com / Admin@1234
                </p>
            </div>
        </div>
    );
}
