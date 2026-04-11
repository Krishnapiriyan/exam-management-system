import { useState, useEffect, useCallback } from 'react';
import { getBatches, getSubjects, getExamsByBatchSubject, getPastPapers, createPastPaper, deletePastPaper } from '../api/client';
import toast from 'react-hot-toast';
import { Plus, Trash2, FileText, ExternalLink, Upload, X } from 'lucide-react';

function Modal({ title, onClose, children }) {
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="glass-panel rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/20 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/5 backdrop-blur-md">
                    <h2 className="text-lg font-bold text-white tracking-wide">{title}</h2>
                    <button onClick={onClose} className="p-1.5 hover:bg-white/10 text-slate-300 hover:text-white rounded-lg transition-colors"><X className="w-5 h-5" /></button>
                </div>
                <div className="px-6 py-6 bg-slate-900/20">{children}</div>
            </div>
        </div>
    );
}

export default function PastPapers() {
    const [batches, setBatches] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [selectedBatch, setSelectedBatch] = useState(null);
    const [activeSubject, setActiveSubject] = useState(null);
    const [exams, setExams] = useState([]);
    const [selectedExam, setSelectedExam] = useState(null);
    const [papers, setPapers] = useState([]);
    const [showAdd, setShowAdd] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [form, setForm] = useState({
        title: '', questionPaperUrl: '', markingSchemeUrl: '', marksSheetUrl: '',
        questionPaperFile: null, markingSchemeFile: null, marksSheetFile: null, useFiles: false
    });

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
        });
    }, [selectedBatch, activeSubject]);

    const loadPapers = useCallback(() => {
        if (!selectedExam) return;
        getPastPapers(selectedExam.id).then(r => setPapers(r.data.data)).catch(() => { });
    }, [selectedExam]);

    useEffect(() => { loadPapers(); }, [loadPapers]);

    const handleAdd = async (e) => {
        e.preventDefault();
        setUploading(true);
        try {
            const fd = new FormData();
            fd.append('title', form.title);
            if (form.useFiles) {
                if (form.questionPaperFile) fd.append('questionPaper', form.questionPaperFile);
                if (form.markingSchemeFile) fd.append('markingScheme', form.markingSchemeFile);
                if (form.marksSheetFile) fd.append('marksSheet', form.marksSheetFile);
            } else {
                fd.append('questionPaperUrl', form.questionPaperUrl);
                fd.append('markingSchemeUrl', form.markingSchemeUrl);
                fd.append('marksSheetUrl', form.marksSheetUrl);
            }
            await createPastPaper(selectedExam.id, fd);
            toast.success('Resource uploaded!');
            setShowAdd(false);
            setForm({ title: '', questionPaperUrl: '', markingSchemeUrl: '', marksSheetUrl: '', questionPaperFile: null, markingSchemeFile: null, marksSheetFile: null, useFiles: false });
            loadPapers();
        } catch (err) { toast.error(err.response?.data?.message || 'Upload failed'); }
        finally { setUploading(false); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this past paper?')) return;
        try { await deletePastPaper(id); toast.success('Deleted'); loadPapers(); }
        catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-white drop-shadow-md tracking-tight">Past Papers</h1>
                    <p className="text-slate-300 text-sm font-medium mt-1">Upload question papers and marking schemes</p>
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
                {/* Exam Selector */}
                <div className="glass-panel rounded-2xl border-white/10 p-5 shadow-sm">
                    <h3 className="font-bold text-white mb-4 tracking-wide">Select Exam</h3>
                    <div className="space-y-3 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                        {exams.map(exam => (
                            <button key={exam.id} onClick={() => setSelectedExam(exam)}
                                className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-all duration-300 ${selectedExam?.id === exam.id ? 'bg-blue-600/90 text-white shadow-[0_4px_15px_rgba(37,99,235,0.4)] border-transparent' : 'hover:bg-white/5 text-slate-300 border border-white/10 hover:border-white/20'}`}>
                                <p className="font-extrabold truncate tracking-wide">{exam.title}</p>
                                <p className={`text-xs mt-1 font-medium ${selectedExam?.id === exam.id ? 'text-blue-100' : 'text-slate-400'}`}>{new Date(exam.examDate).toLocaleDateString()}</p>
                            </button>
                        ))}
                        {exams.length === 0 && <p className="text-slate-400 text-xs text-center py-6 font-medium bg-slate-900/30 rounded-xl border border-white/5">No exams for this selection.</p>}
                    </div>
                </div>

                {/* Papers List */}
                <div className="lg:col-span-2 glass-panel rounded-2xl border-white/10 p-6 shadow-sm">
                    {selectedExam ? (
                        <>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                                <h3 className="font-extrabold text-white text-lg tracking-wide">{selectedExam.title}</h3>
                                <button onClick={() => setShowAdd(true)}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600/90 text-white rounded-lg text-sm font-bold shadow-[0_4px_15px_rgba(37,99,235,0.4)] hover:bg-blue-500 transition-all hover:-translate-y-0.5 w-full sm:w-auto justify-center">
                                    <Plus className="w-4 h-4" /> Upload Paper
                                </button>
                            </div>
                            <div className="space-y-4">
                                {papers.map(p => (
                                    <div key={p.id} className="glass-panel p-5 rounded-xl border border-white/10 hover:border-white/20 hover:shadow-[0_8px_30px_rgba(59,130,246,0.1)] transition-all duration-300 hover:-translate-y-1">
                                        <div className="flex items-start justify-between mb-4">
                                            <p className="font-bold text-white tracking-wide text-lg">{p.title}</p>
                                            <button onClick={() => handleDelete(p.id)} className="p-2 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-lg transition-colors border border-transparent hover:border-red-500/30">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <div className="flex flex-wrap gap-3">
                                            {p.questionPaperUrl && (
                                                <a href={p.questionPaperUrl} target="_blank" rel="noopener noreferrer"
                                                    className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-lg text-sm font-bold hover:bg-blue-500/30 transition-colors shadow-sm">
                                                    <FileText className="w-4 h-4" /> Question Paper <ExternalLink className="w-3 h-3 ml-1" />
                                                </a>
                                            )}
                                            {p.markingSchemeUrl && (
                                                <a href={p.markingSchemeUrl} target="_blank" rel="noopener noreferrer"
                                                    className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-lg text-sm font-bold hover:bg-emerald-500/30 transition-colors shadow-sm">
                                                    <FileText className="w-4 h-4" /> Marking Scheme <ExternalLink className="w-3 h-3 ml-1" />
                                                </a>
                                            )}
                                            {p.marksSheetUrl && (
                                                <a href={p.marksSheetUrl} target="_blank" rel="noopener noreferrer"
                                                    className="flex items-center gap-2 px-4 py-2 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-lg text-sm font-bold hover:bg-indigo-500/30 transition-colors shadow-sm">
                                                    <FileText className="w-4 h-4" /> Marks Sheet <ExternalLink className="w-3 h-3 ml-1" />
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {papers.length === 0 && (
                                    <div className="flex flex-col items-center justify-center py-16 text-slate-400 bg-slate-900/30 rounded-xl border border-white/5">
                                        <FileText className="w-12 h-12 mb-3 text-slate-500 opacity-50" />
                                        <p className="text-sm font-medium">No papers uploaded for this exam yet.</p>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-64 text-slate-400 border-dashed border-2 border-white/10 rounded-xl m-2">
                            <FileText className="w-12 h-12 mb-3 text-slate-500 opacity-50" />
                            <p className="text-lg font-bold text-slate-300">Select an exam</p>
                            <p className="text-sm">Choose an exam to view or manage past papers.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Add Paper Modal */}
            {showAdd && (
                <Modal title="Upload Past Paper" onClose={() => setShowAdd(false)}>
                    <form onSubmit={handleAdd} className="space-y-5">
                        <div>
                            <label className="block text-sm font-bold text-slate-300 mb-1.5 tracking-wide">Title *</label>
                            <input type="text" required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                                placeholder="e.g., 2024 Mock Exam Paper"
                                className="w-full bg-slate-900/50 border border-white/20 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-inner placeholder-slate-500" style={{colorScheme: 'dark'}} />
                        </div>
                        <div className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 shadow-inner rounded-xl">
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <input type="checkbox" checked={form.useFiles} onChange={e => setForm({ ...form, useFiles: e.target.checked })} className="w-4 h-4 rounded border-white/20 bg-slate-800 text-blue-500 focus:ring-blue-500 focus:ring-offset-slate-900 cursor-pointer" />
                                <span className="text-sm font-bold text-slate-300 flex items-center gap-2 group-hover:text-white transition-colors"><Upload className="w-4 h-4 text-blue-400" />Upload PDF files directly (instead of linking URLs)</span>
                            </label>
                        </div>
                        {form.useFiles ? (
                            <div className="space-y-4 bg-slate-900/30 p-4 border border-white/5 rounded-xl">
                                <div>
                                    <label className="block text-sm font-bold text-slate-300 mb-1.5 tracking-wide">Question Paper PDF</label>
                                    <input type="file" accept=".pdf" onChange={e => setForm({ ...form, questionPaperFile: e.target.files[0] })}
                                        className="w-full text-sm text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-600/90 file:text-white file:text-sm file:font-bold hover:file:bg-blue-500 file:cursor-pointer file:shadow-md file:transition-all" />
                                </div>
                                <div className="mt-4">
                                    <label className="block text-sm font-bold text-slate-300 mb-1.5 tracking-wide">Marking Scheme PDF</label>
                                    <input type="file" accept=".pdf" onChange={e => setForm({ ...form, markingSchemeFile: e.target.files[0] })}
                                        className="w-full text-sm text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-emerald-600/90 file:text-white file:text-sm file:font-bold hover:file:bg-emerald-500 file:cursor-pointer file:shadow-md file:transition-all" />
                                </div>
                                <div className="mt-4">
                                    <label className="block text-sm font-bold text-slate-300 mb-1.5 tracking-wide">Marks Sheet PDF</label>
                                    <input type="file" accept=".pdf" onChange={e => setForm({ ...form, marksSheetFile: e.target.files[0] })}
                                        className="w-full text-sm text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-indigo-600/90 file:text-white file:text-sm file:font-bold hover:file:bg-indigo-500 file:cursor-pointer file:shadow-md file:transition-all" />
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-300 mb-1.5 tracking-wide">Question Paper URL</label>
                                    <input type="url" value={form.questionPaperUrl} onChange={e => setForm({ ...form, questionPaperUrl: e.target.value })}
                                        placeholder="https://..." className="w-full bg-slate-900/50 border border-white/20 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-inner placeholder-slate-500" style={{colorScheme: 'dark'}} />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-300 mb-1.5 tracking-wide">Marking Scheme URL</label>
                                    <input type="url" value={form.markingSchemeUrl} onChange={e => setForm({ ...form, markingSchemeUrl: e.target.value })}
                                        placeholder="https://..." className="w-full bg-slate-900/50 border border-white/20 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-inner placeholder-slate-500" style={{colorScheme: 'dark'}} />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-300 mb-1.5 tracking-wide">Marks Sheet URL</label>
                                    <input type="url" value={form.marksSheetUrl} onChange={e => setForm({ ...form, marksSheetUrl: e.target.value })}
                                        placeholder="https://..." className="w-full bg-slate-900/50 border border-white/20 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-inner placeholder-slate-500" style={{colorScheme: 'dark'}} />
                                </div>
                            </div>
                        )}
                        <div className="flex gap-3 pt-4 border-t border-white/10 mt-2">
                            <button type="submit" disabled={uploading}
                                className="flex-1 py-2.5 bg-blue-600/90 text-white rounded-lg text-sm font-bold shadow-[0_4px_15px_rgba(37,99,235,0.4)] hover:bg-blue-500 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:translate-y-0 disabled:shadow-none">
                                {uploading ? 'Uploading...' : 'Upload Resource'}
                            </button>
                            <button type="button" onClick={() => setShowAdd(false)} className="flex-1 py-2.5 bg-white/5 text-slate-300 border border-white/10 rounded-lg text-sm font-bold hover:bg-white/10 transition-colors">Cancel</button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
}
