import { useState, useEffect, useCallback } from 'react';
import { getBatches, getSubjects, getExamsByBatchSubject, getResults, saveResults, releaseResults, getResultSummary, getResultDistribution } from '../api/client';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';
import { CheckCircle, AlertCircle, TrendingUp } from 'lucide-react';

const COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#22c55e'];

export default function Results() {
    const [batches, setBatches] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [selectedBatch, setSelectedBatch] = useState(null);
    const [activeSubject, setActiveSubject] = useState(null);
    const [exams, setExams] = useState([]);
    const [selectedExam, setSelectedExam] = useState(null);
    const [resultData, setResultData] = useState({ results: [], exam: null });
    const [marks, setMarks] = useState({});
    const [summary, setSummary] = useState(null);
    const [distribution, setDistribution] = useState([]);
    const [saving, setSaving] = useState(false);
    const [releasing, setReleasing] = useState(false);

    useEffect(() => {
        Promise.all([getBatches(), getSubjects()]).then(([br, sr]) => {
            const b = br.data.data; const s = sr.data.data;
            setBatches(b); setSubjects(s);
            if (b.length) setSelectedBatch(b[0]);
            if (s.length) setActiveSubject(s[0]);
        });
    }, []);

    useEffect(() => {
        if (!selectedBatch || !activeSubject) return;
        getExamsByBatchSubject(selectedBatch.id, activeSubject.id).then(r => {
            setExams(r.data.data);
            setSelectedExam(null);
        }).catch(() => { });
    }, [selectedBatch, activeSubject]);

    const loadResults = useCallback((examId) => {
        Promise.all([getResults(examId), getResultSummary(examId), getResultDistribution(examId)]).then(([rRes, sRes, dRes]) => {
            setResultData(rRes.data);
            const initMarks = {};
            rRes.data.data.forEach(r => { initMarks[r.studentId] = r.marksObtained ?? ''; });
            setMarks(initMarks);
            setSummary(sRes.data.data);
            setDistribution(dRes.data.data);
        }).catch(() => toast.error('Failed to load results'));
    }, []);

    const handleExamSelect = (exam) => {
        setSelectedExam(exam);
        loadResults(exam.id);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const payload = Object.entries(marks).map(([studentId, marksObtained]) => ({
                studentId: parseInt(studentId),
                marksObtained: marksObtained === '' ? null : parseFloat(marksObtained),
            }));
            await saveResults(selectedExam.id, { results: payload });
            toast.success('Results saved!');
            loadResults(selectedExam.id);
        } catch (err) { toast.error(err.response?.data?.message || 'Save failed'); }
        finally { setSaving(false); }
    };

    const handleRelease = async () => {
        if (!window.confirm(`Release results for "${selectedExam.title}"? Students will be notified.`)) return;
        setReleasing(true);
        try {
            await releaseResults(selectedExam.id);
            toast.success('Results released!');
            getExamsByBatchSubject(selectedBatch.id, activeSubject.id).then(r => setExams(r.data.data));
            loadResults(selectedExam.id);
        } catch (err) { toast.error(err.response?.data?.message || 'Release failed'); }
        finally { setReleasing(false); }
    };

    const resultStatusBadge = (status) => {
        const map = { Released: 'bg-green-100 text-green-700', Pending: 'bg-amber-100 text-amber-700', 'New Released': 'bg-blue-100 text-blue-700' };
        return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${map[status] || 'bg-slate-100 text-slate-600'}`}>{status}</span>;
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-white drop-shadow-md tracking-tight">Results</h1>
                    <p className="text-slate-300 text-sm font-medium mt-1">Enter and manage exam results</p>
                </div>
                <div className="w-full sm:w-auto">
                    <select className="glass-panel w-full sm:w-auto px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 !rounded-lg appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23FFFFFF%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[length:12px_12px] bg-[right_12px_center] pr-10 shadow-sm"
                        value={selectedBatch?.id || ''} onChange={e => { const b = batches.find(b => b.id === parseInt(e.target.value)); setSelectedBatch(b); setSelectedExam(null); }}>
                        {batches.map(b => <option key={b.id} value={b.id} className="bg-slate-900 text-white">Batch {b.year}</option>)}
                    </select>
                </div>
            </div>

            {/* Subject Tabs */}
            <div className="flex gap-1 bg-white/5 border border-white/10 p-1 rounded-xl overflow-x-auto backdrop-blur-md shadow-inner">
                {subjects.map(s => (
                    <button key={s.id} onClick={() => { setActiveSubject(s); setSelectedExam(null); }}
                        className={`px-4 py-2.5 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${activeSubject?.id === s.id ? 'bg-blue-600/90 text-white shadow-[0_4px_15px_rgba(37,99,235,0.4)]' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
                        {s.name}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Exam List */}
                <div className="glass-panel rounded-2xl border-white/10 p-5 shadow-sm">
                    <h3 className="font-bold text-white mb-4 tracking-wide">Select Exam</h3>
                    <div className="space-y-3 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                        {exams.map(exam => (
                            <button key={exam.id} onClick={() => handleExamSelect(exam)}
                                className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-all duration-300 ${selectedExam?.id === exam.id ? 'bg-blue-600/90 text-white shadow-[0_4px_15px_rgba(37,99,235,0.4)] border-transparent' : 'hover:bg-white/5 text-slate-300 border border-white/10 hover:border-white/20'}`}>
                                <p className="font-extrabold truncate tracking-wide">{exam.title}</p>
                                <p className={`text-xs mt-1 font-medium ${selectedExam?.id === exam.id ? 'text-blue-100' : 'text-slate-400'}`}>{new Date(exam.examDate).toLocaleDateString()}</p>
                            </button>
                        ))}
                        {exams.length === 0 && <p className="text-slate-400 text-xs text-center py-6 font-medium bg-slate-900/30 rounded-xl border border-white/5">No exams for this selection.</p>}
                    </div>
                </div>

                {/* Results Panel */}
                <div className="lg:col-span-2 space-y-5">
                    {selectedExam ? (
                        <>
                            {/* Summary */}
                            {summary && (
                                <div className="glass-panel rounded-2xl border-white/10 p-5 shadow-sm">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 gap-3">
                                        <h3 className="font-extrabold text-white text-lg tracking-wide">{selectedExam.title}</h3>
                                        <div>{resultStatusBadge(resultData.exam?.resultStatus === 'Released' || resultData.exam?.resultReleasedAt ? 'Released' : 'Pending')}</div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4 mb-5">
                                        {[['Total', summary.totalStudents], ['Entered', summary.withMarks], ['Missing', summary.withoutMarks]].map(([l, v]) => (
                                            <div key={l} className="bg-slate-900/50 rounded-xl p-3 border border-white/5 text-center shadow-inner">
                                                <p className="text-2xl font-black text-white">{v}</p>
                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">{l}</p>
                                            </div>
                                        ))}
                                    </div>
                                    {summary.average !== null && (
                                        <div className="flex flex-wrap gap-4 text-sm font-bold bg-white/5 border border-white/10 rounded-xl p-3 justify-around">
                                            <span className="text-slate-300">Avg: <span className="text-white ml-1 text-lg">{summary.average}</span></span>
                                            <span className="text-slate-300">Highest: <span className="text-emerald-400 ml-1 text-lg">{summary.highest}</span></span>
                                            <span className="text-slate-300">Lowest: <span className="text-red-400 ml-1 text-lg">{summary.lowest}</span></span>
                                        </div>
                                    )}
                                    {!resultData.exam?.resultReleasedAt && (
                                        <div className="mt-5 space-y-3">
                                            {(() => {
                                                const exam = resultData.exam;
                                                const endTime = new Date(new Date(exam.examDate).getTime() + exam.durationHours * 60 * 60 * 1000);
                                                const isFinished = new Date() > endTime;

                                                if (!isFinished) {
                                                    return (
                                                        <div className="flex items-center gap-2 text-amber-400 text-xs font-bold bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 shadow-inner">
                                                            <AlertCircle className="w-4 h-4" />
                                                            Results cannot be released until the exam finishes at {endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.
                                                        </div>
                                                    );
                                                }

                                                return (
                                                    <button onClick={handleRelease} disabled={releasing}
                                                        className="w-full py-3 bg-emerald-600/90 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-[0_4px_15px_rgba(16,185,129,0.4)] hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 disabled:shadow-none">
                                                        <CheckCircle className="w-5 h-5" />{releasing ? 'Releasing Results...' : 'Release Results to Students'}
                                                    </button>
                                                );
                                            })()}
                                        </div>
                                    )}
                                    {resultData.exam?.resultReleasedAt && (
                                        <div className="mt-5 flex items-center justify-center gap-2 text-emerald-400 text-sm font-bold bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 shadow-inner">
                                            <CheckCircle className="w-5 h-5" />
                                            Results successfully released on {new Date(resultData.exam.resultReleasedAt).toLocaleDateString()}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Marks Entry Table */}
                            <div className="glass-panel rounded-2xl border-white/10 p-5 shadow-sm">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-bold text-white tracking-wide">Student Marks <span className="text-slate-400 font-medium ml-1">(out of {selectedExam.totalMarks})</span></h3>
                                    <button onClick={handleSave} disabled={saving}
                                        className="px-5 py-2 bg-blue-600/90 text-white rounded-lg text-sm font-bold shadow-[0_4px_15px_rgba(37,99,235,0.4)] hover:bg-blue-500 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:translate-y-0 disabled:shadow-none">
                                        {saving ? 'Saving...' : 'Save All'}
                                    </button>
                                </div>
                                <div className="space-y-3 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                                    {resultData.data?.map(student => (
                                        <div key={student.studentId} className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-xl px-4 py-3 hover:border-white/20 transition-colors">
                                            <div className="w-10 h-10 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-400 flex items-center justify-center font-black text-lg flex-shrink-0 shadow-inner">
                                                {student.studentName[0]?.toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-white truncate tracking-wide">{student.studentName}</p>
                                                <p className="text-xs text-slate-400 font-medium">{student.indexNumber}</p>
                                            </div>
                                            <input type="number" min="0" max={selectedExam.totalMarks}
                                                value={marks[student.studentId] ?? ''} placeholder="—"
                                                onChange={e => setMarks(prev => ({ ...prev, [student.studentId]: e.target.value }))}
                                                className="w-24 bg-slate-900/50 border border-white/20 rounded-lg px-3 py-2 text-sm text-center text-white focus:outline-none focus:ring-2 focus:ring-blue-400 font-bold shadow-inner" style={{colorScheme: 'dark'}} />
                                        </div>
                                    ))}
                                    {!resultData.data?.length && <p className="text-center text-slate-400 text-sm py-6 font-medium bg-slate-900/30 rounded-xl border border-white/5">No students enrolled in this subject.</p>}
                                </div>
                            </div>

                            {/* Distribution Chart */}
                            {distribution.some(d => d.count > 0) && (
                                <div className="glass-panel rounded-2xl border-white/10 p-5 shadow-sm">
                                    <h3 className="font-bold text-white mb-4 flex items-center gap-2 tracking-wide"><TrendingUp className="w-5 h-5 text-blue-400" />Mark Distribution</h3>
                                    <ResponsiveContainer width="100%" height={240}>
                                        <PieChart>
                                            <Pie data={distribution} dataKey="count" nameKey="range" cx="50%" cy="50%" outerRadius={85} label={{ fill: '#fff', fontSize: 12, fontWeight: 'bold' }}>
                                                {distribution.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="rgba(255,255,255,0.1)" strokeWidth={2} />)}
                                            </Pie>
                                            <Tooltip contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '0.5rem', color: '#fff', fontWeight: 'bold' }} itemStyle={{ color: '#fff' }} />
                                            <Legend wrapperStyle={{ color: '#cbd5e1', fontSize: '13px', fontWeight: '600', paddingTop: '10px' }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="glass-panel rounded-2xl border-white/10 p-16 flex flex-col items-center justify-center text-slate-400 border-dashed border-2">
                            <AlertCircle className="w-16 h-16 mb-4 text-slate-500 opacity-50" />
                            <p className="text-lg font-bold text-slate-300">Select an exam to manage results</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
