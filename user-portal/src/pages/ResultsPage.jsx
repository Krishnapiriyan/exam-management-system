import { useState, useEffect } from 'react';
import { getBatches, getSubjects, getExamsByBatchSubject, verifyStudent, getStudentResults } from '../api/client';
import toast from 'react-hot-toast';
import { Search, Lock, CheckCircle, Clock, FileQuestion } from 'lucide-react';

function ResultStatusBadge({ status }) {
    const map = {
        Released: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 shadow-sm',
        Pending: 'bg-amber-500/20 text-amber-300 border-amber-500/30 shadow-sm',
        'New Released': 'bg-blue-500/20 text-blue-300 border-blue-500/30 shadow-[0_0_10px_rgba(59,130,246,0.5)]',
    };
    return (
        <span className={`px-2.5 py-1 rounded-full text-xs font-bold tracking-wide border ${map[status] || 'bg-white/10 text-slate-300 border-white/10'}`}>{status}</span>
    );
}

// Public Overview Tab
function PublicOverview({ batches, subjects }) {
    const [selectedBatch, setSelectedBatch] = useState(null);
    const [activeSubject, setActiveSubject] = useState(null);
    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => { if (batches.length) setSelectedBatch(batches[0]); }, [batches]);
    useEffect(() => { if (subjects.length) setActiveSubject(subjects[0]); }, [subjects]);

    useEffect(() => {
        if (!selectedBatch || !activeSubject) return;
        setLoading(true);
        getExamsByBatchSubject(selectedBatch.id, activeSubject.id)
            .then(r => setExams(r.data.data)).finally(() => setLoading(false));
    }, [selectedBatch, activeSubject]);

    return (
        <div className="space-y-6">
            <select className="glass-panel px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 !rounded-lg appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23FFFFFF%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[length:12px_12px] bg-[right_12px_center] pr-10"
                value={selectedBatch?.id || ''} onChange={e => { setSelectedBatch(batches.find(b => b.id === parseInt(e.target.value))); }}>
                {batches.map(b => <option key={b.id} value={b.id} className="bg-slate-900 text-white">Batch {b.year}</option>)}
            </select>
            <div className="flex gap-1 bg-white/5 border border-white/10 p-1 rounded-xl overflow-x-auto backdrop-blur-md">
                {subjects.map(s => (
                    <button key={s.id} onClick={() => setActiveSubject(s)}
                        className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${activeSubject?.id === s.id ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
                        {s.name}
                    </button>
                ))}
            </div>
            {loading ? <div className="py-10 flex justify-center"><div className="animate-spin w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)]"></div></div> : (
                <div className="space-y-3">
                    {exams.map(exam => (
                        <div key={exam.id} className="glass-panel rounded-xl p-4 flex items-center justify-between hover:border-white/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(59,130,246,0.15)]">
                            <div>
                                <p className="font-bold text-white tracking-wide">{exam.title}</p>
                                <p className="text-sm text-slate-300 mt-0.5">{new Date(exam.examDate).toLocaleDateString()} · {exam.durationHours}h</p>
                            </div>
                            <ResultStatusBadge status={exam.resultReleasedAt ? 'Released' : 'Pending'} />
                        </div>
                    ))}
                    {exams.length === 0 && <p className="text-center text-slate-400 py-10 text-sm font-medium">No exams found for this batch and subject.</p>}
                </div>
            )}
        </div>
    );
}

// My Results Tab (needs verification)
function MyResults() {
    const [step, setStep] = useState('verify'); // 'verify' | 'results'
    const [verifyForm, setVerifyForm] = useState({ indexNumber: '', email: '' });
    const [studentData, setStudentData] = useState(null);
    const [results, setResults] = useState([]);
    const [activeSubject, setActiveSubject] = useState(null);
    const [verifying, setVerifying] = useState(false);

    const handleVerify = async (e) => {
        e.preventDefault();
        setVerifying(true);
        try {
            const r = await verifyStudent(verifyForm);
            const student = r.data.data;
            setStudentData(student);
            const rRes = await getStudentResults(student.id);
            setResults(rRes.data.data);
            if (student.subjects.length > 0) setActiveSubject(student.subjects[0]);
            setStep('results');
        } catch (err) { toast.error(err.response?.data?.message || 'Verification failed. Check your index number and email.'); }
        finally { setVerifying(false); }
    };

    const subjectResults = results.filter(r => r.subject?.id === activeSubject?.id);

    if (step === 'verify') {
        return (
            <div className="max-w-sm mx-auto">
                <div className="glass-panel rounded-2xl p-7">
                    <div className="text-center mb-6">
                        <div className="w-14 h-14 bg-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-[0_0_15px_rgba(59,130,246,0.3)] border border-blue-500/30">
                            <Lock className="w-7 h-7 text-blue-400" />
                        </div>
                        <h3 className="font-extrabold text-white text-lg tracking-wide">Student Verification</h3>
                        <p className="text-sm text-slate-300 mt-1">Enter your credentials to view your results</p>
                    </div>
                    <form onSubmit={handleVerify} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Index Number</label>
                            <input required type="text" value={verifyForm.indexNumber} onChange={e => setVerifyForm({ ...verifyForm, indexNumber: e.target.value })}
                                placeholder="e.g., 2024/001"
                                className="w-full bg-slate-900/50 border border-white/20 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-inner" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Email Address</label>
                            <input required type="email" value={verifyForm.email} onChange={e => setVerifyForm({ ...verifyForm, email: e.target.value })}
                                placeholder="your@email.com"
                                className="w-full bg-slate-900/50 border border-white/20 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-inner" />
                        </div>
                        <button type="submit" disabled={verifying}
                            className="w-full py-2.5 bg-blue-600/90 text-white rounded-lg font-bold text-sm hover:bg-blue-500 transition-all duration-300 shadow-[0_4px_20px_rgba(37,99,235,0.4)] disabled:opacity-60 flex items-center justify-center gap-2 hover:-translate-y-0.5">
                            <Search className="w-4 h-4" /> {verifying ? 'Verifying...' : 'View My Results'}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Student Info */}
            <div className="bg-gradient-to-r from-blue-600/90 to-emerald-600/90 backdrop-blur-sm shadow-[0_8px_30px_rgba(37,99,235,0.3)] rounded-2xl p-5 text-white flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-inner border border-white/30">
                    {studentData?.name[0]}
                </div>
                <div>
                    <p className="font-extrabold text-lg tracking-wide drop-shadow-md">{studentData?.name}</p>
                    <p className="text-white/80 text-sm font-medium">Index: {studentData?.indexNumber}</p>
                </div>
                <button onClick={() => { setStep('verify'); setStudentData(null); setResults([]); }} className="ml-auto text-white/80 hover:text-white font-bold text-sm bg-black/20 px-3 py-1.5 rounded-lg transition-colors hover:bg-black/40">
                    Sign Out
                </button>
            </div>

            {/* Subject Tabs */}
            {studentData?.subjects?.length > 0 && (
                <div className="flex gap-1 bg-white/5 border border-white/10 p-1 rounded-xl overflow-x-auto backdrop-blur-sm">
                    {studentData.subjects.map(s => (
                        <button key={s.id} onClick={() => setActiveSubject(s)}
                            className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${activeSubject?.id === s.id ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
                            {s.name}
                        </button>
                    ))}
                </div>
            )}

            {/* Results */}
            <div className="space-y-4">
                {subjectResults.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 glass-panel rounded-2xl">
                        <FileQuestion className="w-10 h-10 mx-auto mb-2 text-slate-500" />
                        <p className="text-sm font-medium">No exams found for this subject.</p>
                    </div>
                ) : subjectResults.map(r => (
                    <div key={r.id} className="glass-panel p-6 hover:border-white/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(59,130,246,0.15)] rounded-2xl">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <p className="font-extrabold text-white text-lg tracking-wide">{r.examTitle}</p>
                                <p className="text-sm text-slate-300 mt-0.5">{new Date(r.examDate).toLocaleDateString()}</p>
                            </div>
                            <ResultStatusBadge status={r.resultStatus} />
                        </div>
                        {r.resultStatus === 'Released' || r.resultStatus === 'New Released' ? (
                            r.marksObtained !== null ? (
                                <div className="bg-slate-900/50 border border-white/10 rounded-xl p-4 flex items-center justify-between shadow-inner">
                                    <span className="text-sm font-bold text-slate-300">Marks Obtained</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 drop-shadow-sm">{r.marksObtained}</span>
                                        <span className="text-slate-400 font-bold">/ {r.totalMarks}</span>
                                    </div>
                                </div>
                            ) : <p className="text-sm text-amber-300 bg-amber-900/30 border border-amber-500/20 rounded-lg px-4 py-3 font-medium">Results released but your marks are not entered yet.</p>
                        ) : (
                            <div className="flex items-center gap-2 text-sm text-amber-300 bg-amber-900/30 border border-amber-500/20 rounded-lg px-4 py-3 font-medium">
                                <Clock className="w-4 h-4" /> Results not yet released.
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function ResultsPage() {
    const [batches, setBatches] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [tab, setTab] = useState('overview');

    useEffect(() => {
        Promise.all([
            fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/batches`).then(r => r.json()),
            fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/subjects`).then(r => r.json()),
        ]).then(([br, sr]) => {
            setBatches(br.data);
            setSubjects(sr.data);
        });
    }, []);

    return (
        <div className="max-w-4xl mx-auto px-4 py-10">
            <div className="mb-8">
                <h1 className="text-3xl font-extrabold text-white drop-shadow-md">Exam Results</h1>
                <p className="text-slate-300 font-medium text-sm mt-2">Check published results or verify your identity to view your personal marks</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-white/5 border border-white/10 p-1 rounded-xl mb-8 w-fit backdrop-blur-md">
                {[['overview', 'Published Results'], ['my-results', 'My Results']].map(([v, l]) => (
                    <button key={v} onClick={() => setTab(v)}
                        className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${tab === v ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
                        {l}
                    </button>
                ))}
            </div>

            {tab === 'overview'
                ? <PublicOverview batches={batches} subjects={subjects} />
                : <MyResults />
            }
        </div>
    );
}
