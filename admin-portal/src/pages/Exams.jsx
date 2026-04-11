import { useState, useEffect, useCallback } from 'react';
import { getBatches, getSubjects, getExamsByBatchSubject, createExam, updateExam, deleteExam, getExamById } from '../api/client';
import toast from 'react-hot-toast';
import { Plus, Eye, Edit2, Trash2, X, Calendar, Clock, CheckCircle, AlertCircle } from 'lucide-react';

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

const examStatusBadge = (status) => {
    const map = { Completed: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', Upcoming: 'bg-blue-500/20 text-blue-300 border-blue-500/30' };
    return <span className={`px-2.5 py-1 rounded-full text-xs font-bold tracking-wide border shadow-sm ${map[status] || 'bg-white/10 text-slate-300 border-white/10'}`}>{status}</span>;
};
const resultStatusBadge = (status) => {
    const map = { Released: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', Pending: 'bg-amber-500/20 text-amber-300 border-amber-500/30' };
    return <span className={`px-2.5 py-1 rounded-full text-xs font-bold tracking-wide border shadow-sm ${map[status] || 'bg-white/10 text-slate-300 border-white/10'}`}>{status}</span>;
};

export default function Exams() {
    const [batches, setBatches] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [selectedBatch, setSelectedBatch] = useState(null);
    const [activeSubject, setActiveSubject] = useState(null);
    const [exams, setExams] = useState([]);
    const [viewingExam, setViewingExam] = useState(null);
    const [editingExam, setEditingExam] = useState(null);
    const [showAdd, setShowAdd] = useState(false);
    const [showDeleteId, setShowDeleteId] = useState(null);
    const [form, setForm] = useState({ title: '', description: '', examDate: '', durationHours: '', totalMarks: 100 });
    const [editForm, setEditForm] = useState({});

    useEffect(() => {
        Promise.all([getBatches(), getSubjects()]).then(([br, sr]) => {
            const b = br.data.data; const s = sr.data.data;
            setBatches(b); setSubjects(s);
            if (b.length) setSelectedBatch(b[0]);
            if (s.length) setActiveSubject(s[0]);
        });
    }, []);

    const loadExams = useCallback(() => {
        if (!selectedBatch || !activeSubject) return;
        getExamsByBatchSubject(selectedBatch.id, activeSubject.id).then(r => setExams(r.data.data)).catch(() => toast.error('Failed to load exams'));
    }, [selectedBatch, activeSubject]);

    useEffect(() => { loadExams(); }, [loadExams]);

    const handleAdd = async (e) => {
        e.preventDefault();
        try {
            await createExam(selectedBatch.id, activeSubject.id, form);
            toast.success('Exam created!');
            setShowAdd(false);
            setForm({ title: '', description: '', examDate: '', durationHours: '', totalMarks: 100 });
            loadExams();
        } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    };

    const handleEdit = async (e) => {
        e.preventDefault();
        try {
            await updateExam(editingExam.id, editForm);
            toast.success('Exam updated!');
            setEditingExam(null);
            loadExams();
        } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    };

    const handleDelete = async () => {
        try {
            await deleteExam(showDeleteId);
            toast.success('Exam deleted');
            setShowDeleteId(null);
            setViewingExam(null);
            loadExams();
        } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-white drop-shadow-md tracking-tight">Exams</h1>
                    <p className="text-slate-300 text-sm font-medium mt-1">Manage subject-wise examinations</p>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <select className="glass-panel w-full sm:w-auto px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 !rounded-lg appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23FFFFFF%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[length:12px_12px] bg-[right_12px_center] pr-10 shadow-sm"
                        value={selectedBatch?.id || ''} onChange={e => { const b = batches.find(b => b.id === parseInt(e.target.value)); setSelectedBatch(b); }}>
                        {batches.length === 0 && <option value="" className="bg-slate-900 text-white">No batches</option>}
                        {batches.map(b => <option key={b.id} value={b.id} className="bg-slate-900 text-white">Batch {b.year}</option>)}
                    </select>
                </div>
            </div>

            {/* Subject Tabs */}
            <div className="flex gap-1 bg-white/5 border border-white/10 p-1 rounded-xl overflow-x-auto backdrop-blur-md shadow-inner">
                {subjects.map(s => (
                    <button key={s.id} onClick={() => setActiveSubject(s)}
                        className={`px-4 py-2.5 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${activeSubject?.id === s.id ? 'bg-blue-600/90 text-white shadow-[0_4px_15px_rgba(37,99,235,0.4)]' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
                        {s.name}
                    </button>
                ))}
            </div>

            {/* Exams List */}
            <div className="glass-panel rounded-2xl p-6 hover:border-white/20 transition-all duration-300">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold text-white tracking-wide">{activeSubject?.name} Exams</h2>
                    <button onClick={() => setShowAdd(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600/90 text-white rounded-lg text-sm font-bold shadow-[0_4px_15px_rgba(37,99,235,0.4)] hover:bg-blue-500 transition-all hover:-translate-y-0.5">
                        <Plus className="w-4 h-4" /> Add Exam
                    </button>
                </div>
                <div className="space-y-4">
                    {exams.map(exam => (
                        <div key={exam.id} className="glass-panel p-5 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-white/20 hover:shadow-[0_8px_30px_rgba(59,130,246,0.15)] transition-all duration-300 hover:-translate-y-1">
                            <div className="flex-1">
                                <div className="flex flex-wrap items-center gap-3 mb-2">
                                    <p className="font-extrabold text-white text-lg tracking-wide">{exam.title}</p>
                                    {examStatusBadge(exam.examStatus)}
                                </div>
                                <div className="flex items-center gap-4 text-sm text-slate-300 font-medium">
                                    <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-blue-400" />{new Date(exam.examDate).toLocaleDateString()}</span>
                                    <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-emerald-400" />{exam.durationHours}h</span>
                                </div>
                            </div>
                            <button onClick={() => setViewingExam(exam)} className="px-4 py-2 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-lg text-sm font-bold hover:bg-blue-500/30 flex items-center gap-2 justify-center transition-colors shadow-sm w-full md:w-auto">
                                <Eye className="w-4 h-4" /> View Details
                            </button>
                        </div>
                    ))}
                    {exams.length === 0 && (
                        <div className="text-center py-12">
                            <AlertCircle className="w-12 h-12 text-slate-500 mx-auto mb-3 opacity-50" />
                            <p className="text-slate-400 text-sm font-medium">No exams yet for this subject and batch.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* View Exam Modal */}
            {viewingExam && (
                <Modal title="Exam Details" onClose={() => setViewingExam(null)}>
                    <div className="space-y-4">
                        <div className="bg-slate-900/50 border border-white/10 shadow-inner rounded-xl p-5 space-y-2">
                            <h3 className="font-extrabold text-white text-xl tracking-wide">{viewingExam.title}</h3>
                            <p className="text-sm text-slate-300 font-medium leading-relaxed">{viewingExam.description || 'No description provided.'}</p>
                        </div>
                        <div className="glass-panel rounded-xl p-5 space-y-3">
                            {[
                                ['Subject', viewingExam.subject?.name],
                                ['Batch', `Batch ${viewingExam.batch?.year}`],
                                ['Date', new Date(viewingExam.examDate).toLocaleDateString()],
                                ['Duration', `${viewingExam.durationHours} hour(s)`],
                                ['Total Marks', viewingExam.totalMarks],
                            ].map(([k, v]) => (
                                <div key={k} className="flex justify-between text-sm items-center border-b border-white/5 pb-3 last:border-0 last:pb-0">
                                    <span className="text-slate-400 font-medium">{k}</span>
                                    <span className="font-bold text-white bg-slate-900/50 px-3 py-1 rounded-md border border-white/5 shadow-inner">{v}</span>
                                </div>
                            ))}
                        </div>
                        <div className="glass-panel p-4 rounded-xl flex justify-between text-sm items-center">
                            <span className="text-slate-400 font-medium">Exam Status</span>{examStatusBadge(viewingExam.examStatus)}
                        </div>
                        <div className="glass-panel p-4 rounded-xl flex justify-between text-sm items-center">
                            <span className="text-slate-400 font-medium">Result Status</span>{resultStatusBadge(viewingExam.resultStatus)}
                        </div>
                    </div>
                    <div className="flex gap-3 mt-6">
                        <button onClick={() => { 
                            setEditingExam(viewingExam); 
                            // Format date for datetime-local input (YYYY-MM-DDTHH:mm)
                            const date = new Date(viewingExam.examDate);
                            const formattedDate = date.toISOString().slice(0, 16);
                            setEditForm({ 
                                title: viewingExam.title, 
                                description: viewingExam.description, 
                                examDate: formattedDate, 
                                durationHours: viewingExam.durationHours, 
                                totalMarks: viewingExam.totalMarks 
                            }); 
                            setViewingExam(null); 
                        }}
                            className="flex-1 py-2.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-sm font-bold hover:bg-amber-500/30 flex items-center justify-center gap-2 transition-colors shadow-sm hover:-translate-y-0.5">
                            <Edit2 className="w-4 h-4" /> Edit Details
                        </button>
                        <button onClick={() => { setShowDeleteId(viewingExam.id); setViewingExam(null); }}
                            className="flex-1 py-2.5 bg-red-500/20 text-red-300 border border-red-500/30 rounded-lg text-sm font-bold hover:bg-red-500/30 flex items-center justify-center gap-2 transition-colors shadow-sm hover:-translate-y-0.5">
                            <Trash2 className="w-4 h-4" /> Delete Exam
                        </button>
                    </div>
                </Modal>
            )}

            {/* Add Exam Modal */}
            {showAdd && (
                <Modal title={`Add Exam — ${activeSubject?.name}`} onClose={() => setShowAdd(false)}>
                    <form onSubmit={handleAdd} className="space-y-5">
                        {[['Exam Title *', 'title', 'text'], ['Exam Date & Time *', 'examDate', 'datetime-local'], ['Duration (hours) *', 'durationHours', 'number'], ['Total Marks', 'totalMarks', 'number']].map(([label, key, type]) => (
                            <div key={key}>
                                <label className="block text-sm font-bold text-slate-300 mb-1.5 tracking-wide">{label}</label>
                                <input type={type} required={label.includes('*')} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} min={type === 'number' ? 1 : undefined}
                                    className="w-full bg-slate-900/50 border border-white/20 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-inner" style={{colorScheme: 'dark'}} />
                            </div>
                        ))}
                        <div>
                            <label className="block text-sm font-bold text-slate-300 mb-1.5 tracking-wide">Description (optional)</label>
                            <textarea rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                                className="w-full bg-slate-900/50 border border-white/20 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-inner resize-none placeholder-slate-500" placeholder="Enter exam details..." />
                        </div>
                        <div className="flex gap-3 pt-4">
                            <button type="submit" className="flex-1 py-2.5 bg-blue-600/90 text-white rounded-lg text-sm font-bold hover:bg-blue-500 shadow-[0_4px_15px_rgba(37,99,235,0.4)] transition-all hover:-translate-y-0.5">Create Exam</button>
                            <button type="button" onClick={() => setShowAdd(false)} className="flex-1 py-2.5 bg-white/5 text-slate-300 border border-white/10 rounded-lg text-sm font-bold hover:bg-white/10 transition-colors">Cancel</button>
                        </div>
                    </form>
                </Modal>
            )}

            {/* Edit Exam Modal */}
            {editingExam && (
                <Modal title="Edit Exam" onClose={() => setEditingExam(null)}>
                    <form onSubmit={handleEdit} className="space-y-5">
                        {[['Exam Title *', 'title', 'text'], ['Exam Date & Time *', 'examDate', 'datetime-local'], ['Duration (hours) *', 'durationHours', 'number'], ['Total Marks', 'totalMarks', 'number']].map(([label, key, type]) => (
                            <div key={key}>
                                <label className="block text-sm font-bold text-slate-300 mb-1.5 tracking-wide">{label}</label>
                                <input type={type} required={label.includes('*')} value={editForm[key] || ''} onChange={e => setEditForm({ ...editForm, [key]: e.target.value })} min={type === 'number' ? 1 : undefined}
                                    className="w-full bg-slate-900/50 border border-white/20 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-inner" style={{colorScheme: 'dark'}} />
                            </div>
                        ))}
                        <div>
                            <label className="block text-sm font-bold text-slate-300 mb-1.5 tracking-wide">Description</label>
                            <textarea rows={3} value={editForm.description || ''} onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                                className="w-full bg-slate-900/50 border border-white/20 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-inner resize-none placeholder-slate-500" placeholder="Enter exam details..." />
                        </div>
                        <p className="text-xs font-medium text-slate-400 bg-white/5 border border-white/10 shadow-inner rounded-lg p-3 text-center">Subject and batch cannot be changed after creation.</p>
                        <div className="flex gap-3 pt-4">
                            <button type="submit" className="flex-1 py-2.5 bg-blue-600/90 text-white rounded-lg text-sm font-bold hover:bg-blue-500 shadow-[0_4px_15px_rgba(37,99,235,0.4)] transition-all hover:-translate-y-0.5">Save Changes</button>
                            <button type="button" onClick={() => setEditingExam(null)} className="flex-1 py-2.5 bg-white/5 text-slate-300 border border-white/10 rounded-lg text-sm font-bold hover:bg-white/10 transition-colors">Cancel</button>
                        </div>
                    </form>
                </Modal>
            )}

            {/* Delete Confirm */}
            {showDeleteId && (
                <Modal title="Delete Exam?" onClose={() => setShowDeleteId(null)}>
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-5 mb-6 shadow-inner text-center">
                        <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
                        <p className="text-red-200 text-sm font-medium">This will permanently delete the exam and all associated results and past papers. This cannot be undone.</p>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={handleDelete} className="flex-1 py-2.5 bg-red-600/90 text-white rounded-lg text-sm font-bold hover:bg-red-500 shadow-[0_4px_15px_rgba(220,38,38,0.4)] transition-all hover:-translate-y-0.5">Yes, Delete</button>
                        <button onClick={() => setShowDeleteId(null)} className="flex-1 py-2.5 bg-white/5 text-slate-300 border border-white/10 rounded-lg text-sm font-bold hover:bg-white/10 transition-colors">Cancel</button>
                    </div>
                </Modal>
            )}
        </div>
    );
}
