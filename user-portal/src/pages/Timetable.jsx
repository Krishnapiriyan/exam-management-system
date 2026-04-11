import { useState, useEffect } from 'react';
import { getAllExams, getBatches } from '../api/client';
import { Calendar, List, ChevronLeft, ChevronRight } from 'lucide-react';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function CalendarView({ exams }) {
    const today = new Date();
    const [current, setCurrent] = useState({ year: today.getFullYear(), month: today.getMonth() });

    const firstDay = new Date(current.year, current.month, 1).getDay();
    const daysInMonth = new Date(current.year, current.month + 1, 0).getDate();

    const examsByDate = {};
    exams.forEach(e => {
        const d = new Date(e.examDate);
        if (d.getFullYear() === current.year && d.getMonth() === current.month) {
            const key = d.getDate();
            if (!examsByDate[key]) examsByDate[key] = [];
            examsByDate[key].push(e);
        }
    });

    const prev = () => setCurrent(c => c.month === 0 ? { year: c.year - 1, month: 11 } : { ...c, month: c.month - 1 });
    const next = () => setCurrent(c => c.month === 11 ? { year: c.year + 1, month: 0 } : { ...c, month: c.month + 1 });

    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);

    const isToday = (d) => d === today.getDate() && current.month === today.getMonth() && current.year === today.getFullYear();

    return (
        <div className="glass-panel overflow-hidden rounded-2xl">
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
                <button onClick={prev} className="p-2 hover:bg-white/10 text-white rounded-lg transition-colors"><ChevronLeft className="w-4 h-4" /></button>
                <h2 className="font-bold text-white">{MONTHS[current.month]} {current.year}</h2>
                <button onClick={next} className="p-2 hover:bg-white/10 text-white rounded-lg transition-colors"><ChevronRight className="w-4 h-4" /></button>
            </div>
            <div className="grid grid-cols-7 border-b border-white/10 bg-white/5">
                {DAYS.map(d => <div key={d} className="text-center text-xs font-semibold text-slate-400 py-2">{d}</div>)}
            </div>
            <div className="grid grid-cols-7 bg-slate-900/40">
                {cells.map((day, i) => (
                    <div key={i} className={`min-h-[72px] p-1.5 border-b border-r border-white/5 ${day && isToday(day) ? 'bg-blue-500/10' : 'hover:bg-white/5 transition-colors'}`}>
                        {day && (
                            <>
                                <span className={`text-xs font-bold flex items-center justify-center w-6 h-6 rounded-full mb-1 ${isToday(day) ? 'bg-blue-600 text-white shadow-md' : 'text-slate-300'}`}>{day}</span>
                                {(examsByDate[day] || []).map(e => (
                                    <div key={e.id} className="bg-blue-600/90 backdrop-blur-sm text-white text-[9px] px-1.5 py-0.5 rounded mb-0.5 truncate leading-tight font-medium shadow-sm border border-blue-500/50">{e.subject?.name}: {e.title}</div>
                                ))}
                            </>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

function examStatusBadge(exam) {
    const isPast = new Date(exam.examDate) < new Date();
    return isPast
        ? <span className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs px-2.5 py-0.5 rounded-full font-bold tracking-wide shadow-sm">Completed</span>
        : <span className="bg-blue-500/20 border border-blue-500/30 text-blue-300 text-xs px-2.5 py-0.5 rounded-full font-bold tracking-wide shadow-sm">Upcoming</span>;
}

export default function Timetable() {
    const [exams, setExams] = useState([]);
    const [batches, setBatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('list'); // 'calendar' | 'list'
    const [filter, setFilter] = useState('all'); // 'all' | 'upcoming' | 'completed'
    const [selectedBatchId, setSelectedBatchId] = useState('all'); // 'all' | batch id

    useEffect(() => {
        Promise.all([
            getAllExams(),
            getBatches(),
        ]).then(([er, br]) => {
            setExams(er.data.data);
            // Sort batches by year descending (newest first) — same as ResultsPage
            const sorted = [...br.data.data].sort((a, b) => b.year - a.year);
            setBatches(sorted);
        }).finally(() => setLoading(false));
    }, []);

    const now = new Date();
    const filtered = exams
        .filter(e => {
            // Batch filter
            if (selectedBatchId !== 'all' && e.batch?.id !== parseInt(selectedBatchId)) return false;
            // Status filter
            if (filter === 'upcoming') return new Date(e.examDate) >= now;
            if (filter === 'completed') return new Date(e.examDate) < now;
            return true;
        })
        .sort((a, b) => {
            // Primary: batch year descending
            const byDiff = (b.batch?.year || 0) - (a.batch?.year || 0);
            if (byDiff !== 0) return byDiff;
            // Secondary: exam date ascending within same batch
            return new Date(a.examDate) - new Date(b.examDate);
        });

    return (
        <div className="max-w-5xl mx-auto px-4 py-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-extrabold text-white drop-shadow-sm">Exam Timetables</h1>
                    <p className="text-slate-300 font-medium text-sm mt-1">All scheduled examinations across batches</p>
                </div>
                <div className="flex gap-2">
                    <div className="flex bg-white/5 border border-white/10 rounded-lg p-1 gap-1 backdrop-blur-md">
                        {[['list', <List className="w-4 h-4" />], ['calendar', <Calendar className="w-4 h-4" />]].map(([v, icon]) => (
                            <button key={v} onClick={() => setView(v)}
                                className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 text-sm font-bold transition-all ${view === v ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
                                {icon} {v.charAt(0).toUpperCase() + v.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Batch selector ── */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
                <select
                    value={selectedBatchId}
                    onChange={e => setSelectedBatchId(e.target.value)}
                    className="glass-panel px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 !rounded-lg appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23FFFFFF%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[length:12px_12px] bg-[right_12px_center] pr-10">
                    <option value="all" className="bg-slate-900 text-white">All Batches</option>
                    {batches.map(b => (
                        <option key={b.id} value={b.id} className="bg-slate-900 text-white">Batch {b.year}</option>
                    ))}
                </select>

                {/* Status filters */}
                <div className="flex gap-2">
                    {[['all', 'All'], ['upcoming', 'Upcoming'], ['completed', 'Completed']].map(([v, l]) => (
                        <button key={v} onClick={() => setFilter(v)}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${filter === v ? 'bg-blue-600 text-white shadow-md' : 'bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10 hover:text-white'}`}>
                            {l}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20"><div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)]"></div></div>
            ) : view === 'calendar' ? (
                <CalendarView exams={filtered} />
            ) : (
                <div className="space-y-3">
                    {filtered.length === 0 && <div className="text-center text-slate-400 py-20 font-medium">No exams found.</div>}
                    {filtered.map(exam => (
                        <div key={exam.id} className="glass-panel rounded-2xl p-4 flex items-center gap-4 hover:border-white/20 hover:shadow-[0_8px_30px_rgba(59,130,246,0.15)] transition-all duration-300 hover:-translate-y-1">
                            <div className="text-center bg-blue-900/30 border border-blue-500/20 rounded-xl px-4 py-2 min-w-[65px]">
                                <p className="text-2xl font-black text-blue-400 drop-shadow-sm">{new Date(exam.examDate).getDate()}</p>
                                <p className="text-xs text-blue-300 font-bold uppercase tracking-wide">{MONTHS[new Date(exam.examDate).getMonth()].slice(0, 3)}</p>
                                <p className="text-xs text-blue-200 font-medium">{new Date(exam.examDate).getFullYear()}</p>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                    <p className="font-bold text-white truncate text-lg">{exam.title}</p>
                                    {examStatusBadge(exam)}
                                </div>
                                <p className="text-sm text-slate-300 font-medium">
                                    {exam.subject?.name} <span className="text-slate-500 mx-1">•</span> <span className="text-blue-400 font-bold">Batch {exam.batch?.year}</span> <span className="text-slate-500 mx-1">•</span> {exam.durationHours}h <span className="text-slate-500 mx-1">•</span> {exam.totalMarks} marks
                                </p>
                            </div>
                            <div className="hidden sm:block text-right text-sm text-slate-400 font-bold bg-white/5 px-4 py-2 rounded-lg border border-white/5 whitespace-nowrap">
                                {(() => {
                                    const date = new Date(exam.examDate);
                                    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
                                    
                                    // Detect if it's the "default" midnight time. 
                                    // (Working with the fact that many systems default to 00:00 UTC or 12:00 AM local)
                                    const hours = date.getHours();
                                    const minutes = date.getMinutes();
                                    
                                    // If it's exactly midnight (or the 5:30am offset often seen in the region)
                                    const isDefault = (hours === 0 && minutes === 0) || (hours === 5 && minutes === 30);
                                    
                                    return isDefault ? 'Morning' : timeStr;
                                })()}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
