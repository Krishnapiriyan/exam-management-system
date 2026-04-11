import { useState, useEffect, useCallback } from 'react';
import {
    getBatches, createBatch, deleteBatch,
    getStudentsByBatch, getStudentById, createStudent, updateStudent, deleteStudent, getStudentResults,
    getSubjects
} from '../api/client';
import toast from 'react-hot-toast';
import { Plus, Trash2, Eye, ArrowLeft, Edit2, X, ChevronDown } from 'lucide-react';

// ── Reusable Modal Wrapper ────────────────────────────────────────────────────
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

// ── Subject Tabs ──────────────────────────────────────────────────────────────
function SubjectTabs({ subjects, active, onChange }) {
    return (
        <div className="flex gap-1 bg-white/5 border border-white/10 p-1 rounded-xl overflow-x-auto backdrop-blur-md shadow-inner">
            {subjects.map(s => (
                <button key={s.id}
                    className={`px-4 py-2.5 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${active?.id === s.id ? 'bg-blue-600/90 text-white shadow-[0_4px_15px_rgba(37,99,235,0.4)]' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                    onClick={() => onChange(s)}>
                    {s.name}
                </button>
            ))}
        </div>
    );
}

// ── Student Detail View ───────────────────────────────────────────────────────
function StudentDetail({ student, subjects, onBack, onEdit, onDelete, onRefresh }) {
    const [view, setView] = useState('profile'); // 'profile' | 'results'
    const [results, setResults] = useState([]);
    const [activeSubject, setActiveSubject] = useState(null);
    const [showEdit, setShowEdit] = useState(false);
    const [editForm, setEditForm] = useState({ name: student.name, indexNumber: student.indexNumber });
    const [showConfirm, setShowConfirm] = useState(false);

    const loadResults = useCallback(() => {
        getStudentResults(student.id).then(r => {
            setResults(r.data.data);
            if (student.subjects.length > 0) setActiveSubject(student.subjects[0]);
        }).catch(() => toast.error('Failed to load results'));
    }, [student.id, student.subjects]);

    useEffect(() => { if (view === 'results') loadResults(); }, [view, loadResults]);

    const subjectResults = results.filter(r => r.subject?.id === activeSubject?.id);

    const handleEdit = async (e) => {
        e.preventDefault();
        try {
            await updateStudent(student.id, editForm);
            toast.success('Student updated');
            setShowEdit(false);
            onRefresh();
        } catch (err) { toast.error(err.response?.data?.message || 'Update failed'); }
    };

    const handleDelete = async () => {
        try {
            await deleteStudent(student.id);
            toast.success('Student deleted');
            onDelete();
        } catch (err) { toast.error(err.response?.data?.message || 'Delete failed'); }
    };

    const statusBadge = (s) => {
        const map = { 'Released': 'bg-green-100 text-green-700', 'New Released': 'bg-blue-100 text-blue-700', 'Pending': 'bg-amber-100 text-amber-700' };
        return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${map[s] || 'bg-slate-100 text-slate-600'}`}>{s}</span>;
    };

    return (
        <div className="glass-panel rounded-2xl border border-white/10 shadow-sm p-6">
            <div className="flex flex-col sm:flex-row items-center gap-4 mb-8">
                <button onClick={onBack} className="p-2 hover:bg-white/5 text-slate-300 hover:text-white rounded-lg transition-colors"><ArrowLeft className="w-5 h-5" /></button>
                <h2 className="text-xl font-bold text-white tracking-wide">Student Profile</h2>
                <div className="flex gap-2 w-full sm:w-auto ml-auto">
                    <button onClick={() => setShowEdit(true)} className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 transition-colors flex-1 sm:flex-none"><Edit2 className="w-3.5 h-3.5" />Edit</button>
                    <button onClick={() => setShowConfirm(true)} className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30 transition-colors flex-1 sm:flex-none"><Trash2 className="w-3.5 h-3.5" />Delete</button>
                </div>
            </div>

            {/* Profile Info */}
            <div className="bg-slate-900/50 rounded-2xl border border-white/10 p-6 mb-6 shadow-inner flex flex-col md:flex-row gap-6 items-center md:items-start text-center md:text-left">
                <div className="w-20 h-20 rounded-2xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 text-3xl font-black shadow-inner">
                    {student.name[0].toUpperCase()}
                </div>
                <div>
                    <p className="text-2xl font-extrabold text-white tracking-wide">{student.name}</p>
                    <div className="flex flex-col md:flex-row gap-2 md:gap-4 mt-2">
                        <p className="text-slate-300 font-medium">Index: <span className="text-white bg-white/5 px-2 py-0.5 rounded ml-1 border border-white/10">{student.indexNumber}</span></p>
                        <p className="text-slate-300 font-medium whitespace-nowrap overflow-hidden text-ellipsis max-w-full">Email: <span className="text-white">{student.email}</span></p>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-4 justify-center md:justify-start">
                        {student.subjects.map(s => (
                            <span key={s.id} className="bg-blue-500/20 border border-blue-500/30 text-blue-300 text-xs px-3 py-1 rounded-full font-bold shadow-sm">{s.name}</span>
                        ))}
                    </div>
                </div>
            </div>

            {/* View Toggle */}
            <div className="flex gap-2 mb-6 border-b border-white/10 pb-4">
                <button onClick={() => setView('profile')} className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${view === 'profile' ? 'bg-blue-600/90 text-white shadow-[0_4px_15px_rgba(37,99,235,0.4)]' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>Profile Details</button>
                <button onClick={() => setView('results')} className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${view === 'results' ? 'bg-blue-600/90 text-white shadow-[0_4px_15px_rgba(37,99,235,0.4)]' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>Exam Results</button>
            </div>

            {/* Results View */}
            {view === 'results' && (
                <div>
                    {student.subjects.length === 0 ? <p className="text-slate-400 text-sm font-medium text-center py-6 bg-slate-900/30 rounded-xl border border-white/5">No subjects enrolled.</p> : (
                        <>
                            <SubjectTabs subjects={student.subjects} active={activeSubject} onChange={setActiveSubject} />
                            <div className="mt-5 space-y-3">
                                {subjectResults.length === 0 ? <p className="text-slate-400 text-sm py-8 text-center bg-slate-900/30 rounded-xl border border-white/5">No exams found for this subject.</p> : subjectResults.map(r => (
                                    <div key={r.id} className="glass-panel border-white/10 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-white/20 transition-all hover:shadow-[0_4px_15px_rgba(59,130,246,0.1)]">
                                        <div>
                                            <p className="font-bold text-white tracking-wide">{r.examTitle}</p>
                                            <p className="text-sm text-slate-300 font-medium mt-0.5">{new Date(r.examDate).toLocaleDateString()}</p>
                                        </div>
                                        <div className="flex items-center gap-4 bg-slate-900/50 p-2 rounded-lg border border-white/5 w-fit">
                                            {statusBadge(r.resultStatus)}
                                            {r.marksObtained !== null ? (
                                                <span className="font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 drop-shadow-sm text-lg">{r.marksObtained}<span className="text-slate-400 text-sm font-bold ml-1">/ {r.totalMarks}</span></span>
                                            ) : <span className="text-slate-500 font-bold px-2">—</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Edit Modal */}
            {showEdit && (
                <Modal title="Edit Student" onClose={() => setShowEdit(false)}>
                    <form onSubmit={handleEdit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-bold text-slate-300 mb-1.5 tracking-wide">Name</label>
                            <input type="text" required value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                className="w-full bg-slate-900/50 border border-white/20 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-inner" style={{colorScheme: 'dark'}} />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-300 mb-1.5 tracking-wide">Index Number</label>
                            <input type="text" required value={editForm.indexNumber} onChange={e => setEditForm({ ...editForm, indexNumber: e.target.value })}
                                className="w-full bg-slate-900/50 border border-white/20 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-inner" style={{colorScheme: 'dark'}} />
                        </div>
                        <div className="flex gap-3 pt-4">
                            <button type="submit" className="flex-1 py-2.5 bg-blue-600/90 text-white rounded-lg text-sm font-bold hover:bg-blue-500 shadow-[0_4px_15px_rgba(37,99,235,0.4)] transition-all hover:-translate-y-0.5">Save Changes</button>
                            <button type="button" onClick={() => setShowEdit(false)} className="flex-1 py-2.5 bg-white/5 text-slate-300 border border-white/10 rounded-lg text-sm font-bold hover:bg-white/10 transition-colors">Cancel</button>
                        </div>
                    </form>
                </Modal>
            )}

            {/* Confirm Delete */}
            {showConfirm && (
                <Modal title="Delete Student?" onClose={() => setShowConfirm(false)}>
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-5 mb-6 shadow-inner text-center">
                        <p className="text-red-200 text-sm font-medium leading-relaxed">This will permanently delete <strong className="text-white px-1">{student.name}</strong> and all their results. This action cannot be undone.</p>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={handleDelete} className="flex-1 py-2.5 bg-red-600/90 text-white rounded-lg text-sm font-bold hover:bg-red-500 shadow-[0_4px_15px_rgba(220,38,38,0.4)] transition-all hover:-translate-y-0.5">Yes, Delete</button>
                        <button onClick={() => setShowConfirm(false)} className="flex-1 py-2.5 bg-white/5 text-slate-300 border border-white/10 rounded-lg text-sm font-bold hover:bg-white/10 transition-colors">Cancel</button>
                    </div>
                </Modal>
            )}
        </div>
    );
}


// ── Main Students Page ────────────────────────────────────────────────────────
export default function Students() {
    const [batches, setBatches] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [selectedBatch, setSelectedBatch] = useState(null);
    const [students, setStudents] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [showAddBatch, setShowAddBatch] = useState(false);
    const [showAddStudent, setShowAddStudent] = useState(false);
    const [showDeleteBatch, setShowDeleteBatch] = useState(null);
    const [batchForm, setBatchForm] = useState({ year: new Date().getFullYear(), description: '', coverPhotoUrl: '' });
    const [studentForm, setStudentForm] = useState({ name: '', indexNumber: '', email: '', subjectIds: [] });

    const loadBatches = useCallback(() => {
        getBatches().then(r => { setBatches(r.data.data); }).catch(() => toast.error('Failed to load batches'));
    }, []);

    useEffect(() => {
        loadBatches();
        getSubjects().then(r => setSubjects(r.data.data)).catch(() => { });
    }, [loadBatches]);

    useEffect(() => {
        if (!selectedBatch) return;
        getStudentsByBatch(selectedBatch.id).then(r => setStudents(r.data.data)).catch(() => toast.error('Failed to load students'));
    }, [selectedBatch]);

    const handleAddBatch = async (e) => {
        e.preventDefault();
        try {
            await createBatch(batchForm);
            toast.success('Batch created!');
            setShowAddBatch(false);
            loadBatches();
        } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    };

    const handleDeleteBatch = async () => {
        try {
            await deleteBatch(showDeleteBatch.id);
            toast.success('Batch deleted');
            setShowDeleteBatch(null);
            setSelectedBatch(null);
            loadBatches();
        } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    };

    const handleAddStudent = async (e) => {
        e.preventDefault();
        try {
            await createStudent(selectedBatch.id, studentForm);
            toast.success('Student registered!');
            setShowAddStudent(false);
            setStudentForm({ name: '', indexNumber: '', email: '', subjectIds: [] });
            getStudentsByBatch(selectedBatch.id).then(r => setStudents(r.data.data));
        } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    };

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 2050 - (currentYear - 5) + 1 }, (_, i) => 2050 - i);

    return (
        <div className="p-6 space-y-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-white drop-shadow-md tracking-tight">Students</h1>
                    <p className="text-slate-300 text-sm font-medium mt-1">Manage batches and student records</p>
                </div>
                <button onClick={() => setShowAddBatch(true)}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600/90 text-white rounded-lg text-sm font-bold shadow-[0_4px_15px_rgba(37,99,235,0.4)] hover:bg-blue-500 hover:-translate-y-0.5 transition-all w-full sm:w-auto">
                    <Plus className="w-4 h-4" /> Add Batch
                </button>
            </div>

            {/* Batch Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {batches.map(b => (
                    <div key={b.id}
                        className={`glass-panel rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(59,130,246,0.2)] ${selectedBatch?.id === b.id ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-white/10 hover:border-white/20'}`}
                        onClick={() => { setSelectedBatch(b); setSelectedStudent(null); }}>
                        <div className="h-32 bg-gradient-to-br from-blue-600/80 to-emerald-600/80 relative overflow-hidden flex items-center justify-center">
                            {b.coverPhotoUrl && <img src={b.coverPhotoUrl} alt="" className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-60" />}
                            <div className="absolute inset-0 bg-black/20"></div>
                            <span className="relative z-10 text-white text-4xl font-black drop-shadow-lg tracking-wider">{b.year}</span>
                        </div>
                        <div className="p-5">
                            <div className="flex items-start justify-between">
                                <div className="flex-1 pr-2">
                                    <p className="font-extrabold text-white text-lg tracking-wide">Batch {b.year}</p>
                                    <p className="text-sm text-slate-300 mt-1 line-clamp-2 font-medium leading-relaxed">{b.description || 'No description provided.'}</p>
                                </div>
                                <button onClick={e => { e.stopPropagation(); setShowDeleteBatch(b); }}
                                    className="p-2 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-lg transition-colors border border-transparent hover:border-red-500/30">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4">
                                <span className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">{b.totalStudents} students</span>
                                <div className="flex gap-1.5 flex-wrap justify-end">
                                    {Object.entries(b.subjectCounts || {}).map(([subj, cnt]) => (
                                        <span key={subj} className="text-xs bg-white/5 border border-white/10 text-slate-300 px-2 py-1 rounded-md font-bold shadow-inner">
                                            {subj.substring(0, 4)}: {cnt}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
                {batches.length === 0 && (
                    <div className="col-span-1 md:col-span-2 xl:col-span-3 text-center py-20 glass-panel rounded-2xl border-dashed">
                        <p className="text-slate-400 text-lg font-bold">No batches yet.</p>
                        <p className="text-slate-500 text-sm mt-1">Click "Add Batch" to get started.</p>
                    </div>
                )}
            </div>

            {/* Students Section */}
            {selectedBatch && !selectedStudent && (
                <div className="glass-panel rounded-2xl border-white/10 p-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                        <h2 className="text-xl font-bold text-white tracking-wide">Students — Batch {selectedBatch.year}</h2>
                        <button onClick={() => setShowAddStudent(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600/90 text-white rounded-lg text-sm font-bold shadow-[0_4px_15px_rgba(37,99,235,0.4)] hover:bg-blue-500 hover:-translate-y-0.5 transition-all w-full sm:w-auto justify-center">
                            <Plus className="w-4 h-4" /> Add Student
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {students.map(s => (
                            <div key={s.id} className="glass-panel p-4 rounded-xl hover:border-white/20 hover:shadow-[0_8px_30px_rgba(59,130,246,0.1)] transition-all duration-300 hover:-translate-y-1 flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-black text-xl shadow-inner">
                                    {s.name[0].toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-extrabold text-white truncate">{s.name}</p>
                                    <p className="text-xs text-slate-300 font-bold tracking-wider mt-0.5">{s.indexNumber}</p>
                                </div>
                                <button onClick={() => setSelectedStudent(s)}
                                    className="p-2.5 hover:bg-blue-500/20 text-blue-400 hover:text-blue-300 rounded-lg transition-colors border border-transparent hover:border-blue-500/30">
                                    <Eye className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                        {students.length === 0 && <div className="col-span-1 md:col-span-2 xl:col-span-3 text-center text-slate-400 py-12 text-sm font-medium bg-slate-900/30 rounded-xl border border-white/5">No students registered in this batch yet.</div>}
                    </div>
                </div>
            )}

            {/* Student Detail */}
            {selectedStudent && (
                <StudentDetail
                    student={selectedStudent}
                    subjects={subjects}
                    onBack={() => setSelectedStudent(null)}
                    onEdit={() => { }}
                    onDelete={() => { setSelectedStudent(null); getStudentsByBatch(selectedBatch.id).then(r => setStudents(r.data.data)); }}
                    onRefresh={() => getStudentById(selectedStudent.id).then(r => setSelectedStudent({ ...r.data.data, subjects: r.data.data.subjects }))}
                />
            )}

            {/* Add Batch Modal */}
            {showAddBatch && (
                <Modal title="Add New Batch" onClose={() => setShowAddBatch(false)}>
                    <form onSubmit={handleAddBatch} className="space-y-5">
                        <div>
                            <label className="block text-sm font-bold text-slate-300 mb-1.5 tracking-wide">Batch Year</label>
                            <select value={batchForm.year} onChange={e => setBatchForm({ ...batchForm, year: parseInt(e.target.value) })}
                                className="w-full bg-slate-900/50 border border-white/20 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-inner appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23FFFFFF%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[length:12px_12px] bg-[right_12px_center]" style={{colorScheme: 'dark'}}>
                                {years.map(y => <option key={y} value={y} className="bg-slate-900 text-white">{y}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-300 mb-1.5 tracking-wide">Description (optional)</label>
                            <textarea rows={3} value={batchForm.description} onChange={e => setBatchForm({ ...batchForm, description: e.target.value })}
                                className="w-full bg-slate-900/50 border border-white/20 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-inner resize-none placeholder-slate-500" placeholder="E.g., 2024 Advanced Level batch" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-300 mb-1.5 tracking-wide">Cover Photo URL (optional)</label>
                            <input type="url" value={batchForm.coverPhotoUrl} onChange={e => setBatchForm({ ...batchForm, coverPhotoUrl: e.target.value })}
                                placeholder="https://..." className="w-full bg-slate-900/50 border border-white/20 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-inner placeholder-slate-500" style={{colorScheme: 'dark'}} />
                        </div>
                        <div className="flex gap-3 pt-4">
                            <button type="submit" className="flex-1 py-2.5 bg-blue-600/90 text-white rounded-lg text-sm font-bold hover:bg-blue-500 shadow-[0_4px_15px_rgba(37,99,235,0.4)] transition-all hover:-translate-y-0.5">Create Batch</button>
                            <button type="button" onClick={() => setShowAddBatch(false)} className="flex-1 py-2.5 bg-white/5 text-slate-300 border border-white/10 rounded-lg text-sm font-bold hover:bg-white/10 transition-colors">Cancel</button>
                        </div>
                    </form>
                </Modal>
            )}

            {/* Delete Batch Confirm */}
            {showDeleteBatch && (
                <Modal title="Delete Batch?" onClose={() => setShowDeleteBatch(null)}>
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-5 mb-6 shadow-inner text-center">
                        <p className="text-white font-bold text-lg mb-2 tracking-wide">Batch {showDeleteBatch.year}</p>
                        <p className="text-red-300 text-sm font-medium leading-relaxed">⚠️ This will permanently delete ALL students, exams, results, and past papers in this batch. This cannot be undone.</p>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={handleDeleteBatch} className="flex-1 py-2.5 bg-red-600/90 text-white rounded-lg text-sm font-bold hover:bg-red-500 shadow-[0_4px_15px_rgba(220,38,38,0.4)] transition-all hover:-translate-y-0.5">Delete Everything</button>
                        <button onClick={() => setShowDeleteBatch(null)} className="flex-1 py-2.5 bg-white/5 text-slate-300 border border-white/10 rounded-lg text-sm font-bold hover:bg-white/10 transition-colors">Cancel</button>
                    </div>
                </Modal>
            )}

            {/* Add Student Modal */}
            {showAddStudent && selectedBatch && (
                <Modal title={`Add Student — Batch ${selectedBatch.year}`} onClose={() => setShowAddStudent(false)}>
                    <form onSubmit={handleAddStudent} className="space-y-5">
                        <div>
                            <label className="block text-sm font-bold text-slate-300 mb-1.5 tracking-wide">Student Name *</label>
                            <input type="text" required value={studentForm.name} onChange={e => setStudentForm({ ...studentForm, name: e.target.value })}
                                className="w-full bg-slate-900/50 border border-white/20 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-inner" style={{colorScheme: 'dark'}} />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-300 mb-1.5 tracking-wide">Index Number *</label>
                            <input type="text" required value={studentForm.indexNumber} onChange={e => setStudentForm({ ...studentForm, indexNumber: e.target.value })}
                                className="w-full bg-slate-900/50 border border-white/20 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-inner" style={{colorScheme: 'dark'}} />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-300 mb-1.5 tracking-wide">Email Address *</label>
                            <input type="email" required value={studentForm.email} onChange={e => setStudentForm({ ...studentForm, email: e.target.value })}
                                className="w-full bg-slate-900/50 border border-white/20 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-inner" style={{colorScheme: 'dark'}} />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-300 mb-1.5 tracking-wide">Subjects *</label>
                            <div className="space-y-3 bg-slate-900/50 border border-white/20 rounded-lg p-4 shadow-inner">
                                {subjects.map(s => (
                                    <label key={s.id} className="flex items-center gap-3 cursor-pointer group">
                                        <input type="checkbox" value={s.id}
                                            checked={studentForm.subjectIds.includes(s.id)}
                                            onChange={e => {
                                                const sid = parseInt(e.target.value);
                                                setStudentForm(prev => ({
                                                    ...prev,
                                                    subjectIds: e.target.checked ? [...prev.subjectIds, sid] : prev.subjectIds.filter(id => id !== sid)
                                                }));
                                            }}
                                            className="w-4 h-4 rounded border-white/20 bg-slate-800 text-blue-500 focus:ring-blue-500 focus:ring-offset-slate-900 cursor-pointer" />
                                        <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">{s.name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div className="flex gap-3 pt-4">
                            <button type="submit" className="flex-1 py-2.5 bg-blue-600/90 text-white rounded-lg text-sm font-bold hover:bg-blue-500 shadow-[0_4px_15px_rgba(37,99,235,0.4)] transition-all hover:-translate-y-0.5">Register Student</button>
                            <button type="button" onClick={() => setShowAddStudent(false)} className="flex-1 py-2.5 bg-white/5 text-slate-300 border border-white/10 rounded-lg text-sm font-bold hover:bg-white/10 transition-colors">Cancel</button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
}
