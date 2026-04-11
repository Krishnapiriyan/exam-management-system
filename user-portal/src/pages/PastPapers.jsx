import { useState, useEffect } from 'react';
import { getBatches, getSubjects, getExamsByBatchSubject, getPastPapers } from '../api/client';
import { FileText, ExternalLink, Download, BookOpen } from 'lucide-react';

export default function PastPapers() {
    const [batches, setBatches] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [selectedBatch, setSelectedBatch] = useState(null);
    const [activeSubject, setActiveSubject] = useState(null);
    const [exams, setExams] = useState([]);
    const [papers, setPapers] = useState({});
    const [loading, setLoading] = useState(false);

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
        setLoading(true);
        setExams([]); setPapers({});
        getExamsByBatchSubject(selectedBatch.id, activeSubject.id).then(async r => {
            const exList = r.data.data;
            setExams(exList);
            const paperMap = {};
            await Promise.all(exList.map(async e => {
                const pr = await getPastPapers(e.id);
                if (pr.data.data.length > 0) paperMap[e.id] = pr.data.data;
            }));
            setPapers(paperMap);
        }).finally(() => setLoading(false));
    }, [selectedBatch, activeSubject]);

    const examsWithPapers = exams.filter(e => papers[e.id]?.length > 0);

    return (
        <div className="max-w-5xl mx-auto px-4 py-10">
            <div className="mb-8">
                <h1 className="text-3xl font-extrabold text-white drop-shadow-md">Past Papers</h1>
                <p className="text-slate-300 font-medium text-sm mt-2">Download question papers and marking schemes to prepare for your exams</p>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-8">
                <select className="glass-panel px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 !rounded-lg appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23FFFFFF%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[length:12px_12px] bg-[right_12px_center] pr-10"
                    value={selectedBatch?.id || ''} onChange={e => setSelectedBatch(batches.find(b => b.id === parseInt(e.target.value)))}>
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
            </div>

            {loading ? (
                <div className="flex justify-center py-20"><div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)]"></div></div>
            ) : examsWithPapers.length === 0 ? (
                <div className="text-center py-20 text-slate-400 glass-panel rounded-2xl mx-auto max-w-lg mt-10">
                    <BookOpen className="w-12 h-12 mx-auto mb-3 text-slate-500" />
                    <p className="text-lg font-bold text-white mb-1">No past papers available</p>
                    <p className="text-sm font-medium">Papers for this batch and subject haven't been uploaded yet.</p>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 gap-5">
                    {examsWithPapers.map(exam => (
                        <div key={exam.id} className="glass-panel rounded-2xl overflow-hidden hover:border-white/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(59,130,246,0.15)] flex flex-col">
                            <div className="px-5 py-4 border-b border-white/10 bg-white/5 flex items-center gap-3 backdrop-blur-sm">
                                <div className="w-10 h-10 bg-blue-500/20 border border-blue-500/30 rounded-xl flex items-center justify-center shadow-inner">
                                    <FileText className="w-5 h-5 text-blue-400" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-extrabold text-white text-lg tracking-wide">{exam.title}</p>
                                    <p className="text-xs text-slate-300 font-medium">{new Date(exam.examDate).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <div className="px-5 py-4 space-y-3 flex-1 flex flex-col justify-center">
                                {papers[exam.id].map(paper => (
                                    <div key={paper.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3 border-b border-white/5 last:border-0 relative group">
                                        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg -mx-2 px-2 pointer-events-none"></div>
                                        <p className="text-sm font-bold text-slate-200 z-10">{paper.title}</p>
                                        <div className="flex gap-2 z-10">
                                            {paper.questionPaperUrl && (
                                                <a href={paper.questionPaperUrl} target="_blank" rel="noopener noreferrer"
                                                    className="flex items-center gap-1.5 px-3 py-2 bg-blue-600/90 text-white rounded-lg text-xs font-bold hover:bg-blue-500 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5">
                                                    <Download className="w-3.5 h-3.5" /> Paper
                                                </a>
                                            )}
                                            {paper.markingSchemeUrl && (
                                                <a href={paper.markingSchemeUrl} target="_blank" rel="noopener noreferrer"
                                                    className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600/90 text-white rounded-lg text-xs font-bold hover:bg-emerald-500 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5">
                                                    <ExternalLink className="w-3.5 h-3.5" /> Scheme
                                                </a>
                                            )}
                                            {paper.marksSheetUrl && (
                                                <a href={paper.marksSheetUrl} target="_blank" rel="noopener noreferrer"
                                                    className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600/90 text-white rounded-lg text-xs font-bold hover:bg-indigo-500 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5">
                                                    <Download className="w-3.5 h-3.5" /> Mark Sheet
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
