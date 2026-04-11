import { useState, useEffect } from 'react';
import { getGlobalStats, getBatchStats, getBatches, getResultDistribution, getExamsByBatchSubject, getSubjects } from '../api/client';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Users, Shield, BookOpen, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';

const COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#22c55e'];

function StatCard({ label, value, icon: Icon, color }) {
    return (
        <div className="glass-panel p-5 flex items-center gap-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(59,130,246,0.15)] hover:border-white/20 rounded-2xl">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-inner border border-white/10 ${color}`}>
                <Icon className="w-6 h-6 text-white" />
            </div>
            <div>
                <p className="text-2xl font-extrabold text-white drop-shadow-sm">{value ?? '—'}</p>
                <p className="text-sm font-medium text-slate-300">{label}</p>
            </div>
        </div>
    );
}

export default function Dashboard() {
    const [globalStats, setGlobalStats] = useState(null);
    const [batches, setBatches] = useState([]);
    const [selectedBatch, setSelectedBatch] = useState(null);
    const [batchStats, setBatchStats] = useState(null);
    const [subjects, setSubjects] = useState([]);
    const [charts, setCharts] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([getGlobalStats(), getBatches(), getSubjects()])
            .then(([gRes, bRes, sRes]) => {
                setGlobalStats(gRes.data.data);
                const batchList = bRes.data.data;
                setBatches(batchList);
                setSubjects(sRes.data.data);
                if (batchList.length > 0) setSelectedBatch(batchList[0]);
            })
            .catch(() => toast.error('Failed to load dashboard data'))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (!selectedBatch) return;
        getBatchStats(selectedBatch.id).then((r) => setBatchStats(r.data.data)).catch(() => { });
    }, [selectedBatch]);

    useEffect(() => {
        if (!selectedBatch || subjects.length === 0) return;
        // Load chart data for each subject
        const loadCharts = async () => {
            const newCharts = {};
            for (const subj of subjects) {
                try {
                    const examsRes = await getExamsByBatchSubject(selectedBatch.id, subj.id);
                    const exams = examsRes.data.data.filter(e => e.resultReleasedAt);
                    if (exams.length > 0) {
                        const distRes = await getResultDistribution(exams[0].id);
                        newCharts[subj.name] = distRes.data.data;
                    }
                } catch { }
            }
            setCharts(newCharts);
        };
        loadCharts();
    }, [selectedBatch, subjects]);

    if (loading) return <div className="flex items-center justify-center h-full text-blue-600 text-lg font-semibold">Loading Dashboard...</div>;

    return (
        <div className="p-6 space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 tracking-tight drop-shadow-sm">Dashboard</h1>
                <p className="text-slate-300 text-sm font-medium mt-1">Welcome back! Here's an overview of your system.</p>
            </div>

            {/* Global Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Total Students" value={globalStats?.totalStudents} icon={Users} color="bg-blue-600" />
                <StatCard label="Administrators" value={globalStats?.totalAdmins} icon={Shield} color="bg-slate-800" />
                <StatCard label="Math Students" value={globalStats?.mathStudents} icon={BookOpen} color="bg-emerald-600" />
                <StatCard label="Biology Students" value={globalStats?.bioStudents} icon={TrendingUp} color="bg-orange-600" />
            </div>

            {/* Batch Selector */}
            <div className="glass-panel p-6 rounded-2xl hover:border-white/20 transition-all duration-300">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                    <h2 className="text-lg font-bold text-white tracking-wide">Batch Overview</h2>
                    <select
                        className="glass-panel px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 !rounded-lg appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23FFFFFF%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[length:12px_12px] bg-[right_12px_center] pr-10"
                        value={selectedBatch?.id || ''}
                        onChange={(e) => {
                            const b = batches.find((b) => b.id === parseInt(e.target.value));
                            setSelectedBatch(b);
                        }}
                    >
                        {batches.length === 0 && <option value="">No batches</option>}
                        {batches.map((b) => (
                            <option key={b.id} value={b.id}>Batch {b.year}</option>
                        ))}
                    </select>
                </div>

                {batchStats && selectedBatch ? (
                    <>
                        {/* Batch Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-5 text-center shadow-inner hover:bg-blue-500/20 transition-colors">
                                <p className="text-3xl font-black text-blue-400 drop-shadow-sm">{batchStats.totalStudents}</p>
                                <p className="text-sm text-blue-200 mt-1 font-semibold uppercase tracking-wider">Total Students</p>
                            </div>
                            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-5 text-center shadow-inner hover:bg-emerald-500/20 transition-colors">
                                <p className="text-3xl font-black text-emerald-400 drop-shadow-sm">{batchStats.releasedExams}</p>
                                <p className="text-sm text-emerald-200 mt-1 font-semibold uppercase tracking-wider">Released Results</p>
                            </div>
                            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-5 text-center shadow-inner hover:bg-amber-500/20 transition-colors">
                                <p className="text-3xl font-black text-amber-400 drop-shadow-sm">{batchStats.pendingExams}</p>
                                <p className="text-sm text-amber-200 mt-1 font-semibold uppercase tracking-wider">Pending Results</p>
                            </div>
                        </div>

                        {/* Subject-wise stats */}
                        <div className="overflow-x-auto border border-white/10 rounded-xl bg-slate-900/40">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-white/5 border-b border-white/10 text-slate-300 text-left font-bold">
                                        <th className="px-5 py-4">Subject</th>
                                        <th className="px-5 py-4">Students</th>
                                        <th className="px-5 py-4">Exams</th>
                                        <th className="px-5 py-4">Released</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {batchStats.subjectStats.map((s, idx) => (
                                        <tr key={s.subject} className={`hover:bg-white/5 transition-colors ${idx !== batchStats.subjectStats.length -1 ? "border-b border-white/5" : ""}`}>
                                            <td className="px-5 py-4 font-bold text-white tracking-wide">{s.subject}</td>
                                            <td className="px-5 py-4 text-slate-300 font-medium">{s.studentCount}</td>
                                            <td className="px-5 py-4 text-slate-300 font-medium">{s.examCount}</td>
                                            <td className="px-5 py-4">
                                                <span className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 px-3 py-1 rounded-full text-xs font-bold tracking-wide shadow-sm">
                                                    {s.releasedCount}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                ) : (
                    <p className="text-slate-400 text-sm text-center py-8">No batch data available. Add a batch first.</p>
                )}
            </div>

            {/* Performance Charts */}
            {Object.keys(charts).length > 0 && (
                <div>
                    <h2 className="text-lg font-semibold text-white mb-4">Exam Performance Distributions</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                        {Object.entries(charts).map(([subjectName, data]) => (
                            <div key={subjectName} className="glass-panel p-5 rounded-2xl hover:border-white/20 transition-all duration-300">
                                <h3 className="text-sm font-bold text-slate-300 mb-3 text-center tracking-wide">{subjectName}</h3>
                                <ResponsiveContainer width="100%" height={220}>
                                    <PieChart>
                                        <Pie data={data} dataKey="count" nameKey="range" cx="50%" cy="50%" outerRadius={80} label>
                                            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                        </Pie>
                                        <Tooltip />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Exam Status Summary */}
            {batchStats && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="glass-panel p-6 flex items-center gap-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(37,99,235,0.2)] hover:border-white/20 rounded-2xl">
                        <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-blue-500/20 border border-blue-500/30 shadow-inner">
                            <BookOpen className="w-7 h-7 text-blue-400" />
                        </div>
                        <div>
                            <p className="text-3xl font-black text-white drop-shadow-sm">{batchStats.totalExams}</p>
                            <p className="text-sm font-bold text-slate-300 mt-0.5">Total Exams</p>
                        </div>
                    </div>
                    <div className="glass-panel p-6 flex items-center gap-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(16,185,129,0.2)] hover:border-white/20 rounded-2xl">
                        <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-emerald-500/20 border border-emerald-500/30 shadow-inner">
                            <CheckCircle className="w-7 h-7 text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-3xl font-black text-white drop-shadow-sm">{batchStats.releasedExams}</p>
                            <p className="text-sm font-bold text-slate-300 mt-0.5">Results Released</p>
                        </div>
                    </div>
                    <div className="glass-panel p-6 flex items-center gap-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(245,158,11,0.2)] hover:border-white/20 rounded-2xl">
                        <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-amber-500/20 border border-amber-500/30 shadow-inner">
                            <Clock className="w-7 h-7 text-amber-400" />
                        </div>
                        <div>
                            <p className="text-3xl font-black text-white drop-shadow-sm">{batchStats.pendingExams}</p>
                            <p className="text-sm font-bold text-slate-300 mt-0.5">Pending Release</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
