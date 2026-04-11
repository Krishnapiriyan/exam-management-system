import { useState, useEffect, useRef } from 'react';
import { getSiteSettings, updateSiteSettings, createSection, updateSection, deleteSection, uploadSiteMedia } from '../api/client';
import toast from 'react-hot-toast';
import {
    Plus, Trash2, Edit2, X, Globe, Layout, Layers,
    Eye, Save, Monitor, Image, Video, FileText, GripVertical,
    Upload, Link, CheckCircle2, Loader2
} from 'lucide-react';

/* ─── Shared Modal ────────────────────────────────────────────────────── */
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

/* ─── Media Type Icon ─────────────────────────────────────────────────── */
function MediaIcon({ url }) {
    if (!url) return <FileText className="w-4 h-4 text-slate-400" />;
    if (url.includes('youtube') || url.includes('youtu.be')) return <Video className="w-4 h-4 text-red-500" />;
    if (url.match(/\.(mp4|webm)/i)) return <Video className="w-4 h-4 text-purple-500" />;
    return <Image className="w-4 h-4 text-emerald-500" />;
}

/* ─── Live Hero Preview ───────────────────────────────────────────────── */
function HeroPreview({ title, description }) {
    return (
        <div className="rounded-xl overflow-hidden glass-panel border border-white/20 shadow-sm relative group">
            <div className="flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md px-3 py-2 border-b border-white/10 z-10 relative">
                <Monitor className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-xs text-slate-400 font-bold tracking-wider uppercase">Live Preview — User Portal Hero</span>
            </div>
            <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-8 min-h-[160px] flex flex-col items-center justify-center text-center relative overflow-hidden">
                {/* Background effect */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/40 via-transparent to-transparent opacity-60"></div>
                
                <div className="inline-flex items-center gap-1.5 bg-white/5 border border-white/10 text-white text-xs px-3 py-1.5 rounded-full mb-4 shadow-sm relative z-10 backdrop-blur-sm group-hover:border-white/20 group-hover:bg-white/10 transition-all">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span>
                    <span className="font-medium tracking-wide">Student Portal</span>
                </div>
                <h2 className="text-white font-extrabold text-2xl tracking-tight leading-tight mb-3 max-w-sm relative z-10 drop-shadow-md">
                    {title || <span className="opacity-30 italic font-medium">Your page title here…</span>}
                </h2>
                <p className="text-blue-100/80 text-sm leading-relaxed max-w-xs relative z-10 font-medium">
                    {description || <span className="opacity-40 italic">Your description here…</span>}
                </p>
            </div>
        </div>
    );
}

/* ─── Section Form Fields ─────────────────────────────────────────────── */
function SectionFormFields({ form, onChange }) {
    return (
        <div className="space-y-5">
            <div>
                <label className="block text-sm font-bold text-slate-300 mb-1.5 tracking-wide">Heading <span className="text-red-400">*</span></label>
                <input type="text" required value={form.heading} onChange={e => onChange({ ...form, heading: e.target.value })}
                    placeholder="e.g. About Our Programs"
                    className="w-full bg-slate-900/50 border border-white/20 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-inner placeholder-slate-500" style={{colorScheme: 'dark'}} />
            </div>
            <div>
                <label className="block text-sm font-bold text-slate-300 mb-1.5 tracking-wide">Description</label>
                <textarea rows={3} value={form.description} onChange={e => onChange({ ...form, description: e.target.value })}
                    placeholder="Optional text shown below the heading…"
                    className="w-full bg-slate-900/50 border border-white/20 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none shadow-inner placeholder-slate-500" style={{colorScheme: 'dark'}} />
            </div>
            <div>
                <label className="block text-sm font-bold text-slate-300 mb-1.5 tracking-wide">Media URL <span className="text-slate-400 font-medium">(image, video, or YouTube)</span></label>
                <input type="url" value={form.mediaUrl} onChange={e => onChange({ ...form, mediaUrl: e.target.value })}
                    placeholder="https://…"
                    className="w-full bg-slate-900/50 border border-white/20 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-inner placeholder-slate-500" style={{colorScheme: 'dark'}} />
                {form.mediaUrl && (
                    <p className="mt-2 text-xs text-blue-300 flex items-center gap-1.5 font-medium bg-blue-500/10 px-2 py-1 rounded-md w-fit border border-blue-500/20">
                        <MediaIcon url={form.mediaUrl} />
                        {form.mediaUrl.includes('youtube') || form.mediaUrl.includes('youtu.be') ? 'YouTube video' : form.mediaUrl.match(/\.(mp4|webm)/i) ? 'Video file' : 'Image preview'}
                    </p>
                )}
            </div>
            <div className="border-t border-white/10 pt-4">
                <label className="block text-sm font-bold text-slate-300 mb-1.5 tracking-wide">Sort Order</label>
                <input type="number" min={0} value={form.sortOrder} onChange={e => onChange({ ...form, sortOrder: e.target.value })}
                    className="w-32 bg-slate-900/50 border border-white/20 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-inner text-center font-bold" style={{colorScheme: 'dark'}} />
                <p className="text-xs text-slate-400 mt-2 font-medium bg-slate-800/50 rounded inline-block px-2 py-1">Lower number = shown first</p>
            </div>
        </div>
    );
}

/* ─── Main Page ───────────────────────────────────────────────────────── */
export default function SiteSettings() {
    const [activeTab, setActiveTab] = useState('home');
    const [settings, setSettings] = useState(null);
    const [loadError, setLoadError] = useState(false);

    /* Home form */
    const [homeForm, setHomeForm] = useState({ homeTitle: '', homeDescription: '', backgroundVideoUrl: '' });
    const [savingHome, setSavingHome] = useState(false);
    const [showPreview, setShowPreview] = useState(true);

    /* Section form */
    const emptySection = { heading: '', description: '', mediaUrl: '', sortOrder: 0 };
    const [showAddSection, setShowAddSection] = useState(false);
    const [editSection, setEditSection] = useState(null);
    const [sectionForm, setSectionForm] = useState(emptySection);
    const [savingSection, setSavingSection] = useState(false);

    /* Video upload */
    const [videoTab, setVideoTab] = useState('url'); // 'url' | 'upload'
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const videoFileRef = useRef(null);

    const handleVideoFileUpload = async (file) => {
        if (!file) return;
        const allowed = ['video/mp4', 'video/webm', 'video/quicktime'];
        if (!allowed.includes(file.type)) {
            toast.error('Only MP4, WebM, or MOV videos are supported.');
            return;
        }
        if (file.size > 100 * 1024 * 1024) {
            toast.error('File exceeds 100 MB limit.');
            return;
        }
        setUploading(true);
        setUploadProgress(10);
        try {
            const fd = new FormData();
            fd.append('file', file);
            const { data } = await uploadSiteMedia(fd);
            setHomeForm(f => ({ ...f, backgroundVideoUrl: data.url }));
            setUploadProgress(100);
            toast.success('Video uploaded! Remember to Save Changes.');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Upload failed');
        } finally {
            setUploading(false);
            if (videoFileRef.current) videoFileRef.current.value = '';
        }
    };

    const loadSettings = () => {

        setLoadError(false);
        getSiteSettings()
            .then(r => {
                const s = r.data.data;
                setSettings(s);
                setHomeForm({
                    homeTitle: s.homeTitle || '',
                    homeDescription: s.homeDescription || '',
                    backgroundVideoUrl: s.backgroundVideoUrl || '',
                });
            })
            .catch(() => { setLoadError(true); toast.error('Failed to load settings'); });
    };

    useEffect(() => { loadSettings(); }, []);

    /* ── Save home settings ── */
    const handleSaveHome = async (e) => {
        e.preventDefault();
        setSavingHome(true);
        try {
            await updateSiteSettings(homeForm);
            toast.success('Settings saved!');
            loadSettings();
        } catch (err) { toast.error(err.response?.data?.message || 'Failed to save'); }
        finally { setSavingHome(false); }
    };

    /* ── Add section ── */
    const handleAddSection = async (e) => {
        e.preventDefault();
        setSavingSection(true);
        try {
            await createSection({ ...sectionForm, sortOrder: parseInt(sectionForm.sortOrder) || 0 });
            toast.success('Section added!');
            setShowAddSection(false);
            setSectionForm(emptySection);
            loadSettings();
        } catch (err) { toast.error(err.response?.data?.message || 'Failed to add section'); }
        finally { setSavingSection(false); }
    };

    /* ── Edit section ── */
    const handleEditSection = async (e) => {
        e.preventDefault();
        setSavingSection(true);
        try {
            await updateSection(editSection.id, { ...sectionForm, sortOrder: parseInt(sectionForm.sortOrder) || 0 });
            toast.success('Section updated!');
            setEditSection(null);
            loadSettings();
        } catch (err) { toast.error(err.response?.data?.message || 'Failed to update section'); }
        finally { setSavingSection(false); }
    };

    /* ── Delete section ── */
    const handleDeleteSection = async (id) => {
        if (!window.confirm('Delete this section from the home page?')) return;
        try {
            await deleteSection(id);
            toast.success('Section deleted');
            loadSettings();
        } catch (err) { toast.error(err.response?.data?.message || 'Failed to delete'); }
    };

    const openEdit = (sec) => {
        setEditSection(sec);
        setSectionForm({ heading: sec.heading, description: sec.description || '', mediaUrl: sec.mediaUrl || '', sortOrder: sec.sortOrder });
    };

    const tabs = [
        { id: 'home', label: 'Home Page', icon: Layout },
        { id: 'sections', label: 'Custom Sections', icon: Layers },
    ];

    return (
        <div className="p-6 space-y-6 max-w-5xl">
            {/* ── Page Header ── */}
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-600/20 border border-blue-500/30 rounded-xl flex items-center justify-center shadow-inner">
                    <Globe className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                    <h1 className="text-3xl font-extrabold text-white drop-shadow-md tracking-tight">Site Settings</h1>
                    <p className="text-slate-300 text-sm font-medium mt-1">Customize what students see on the user portal</p>
                </div>
            </div>

            {/* ── Tabs ── */}
            <div className="flex gap-1 bg-white/5 border border-white/10 p-1.5 rounded-xl w-fit shadow-inner backdrop-blur-md">
                {tabs.map(({ id, label, icon: Icon }) => (
                    <button key={id} onClick={() => setActiveTab(id)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 ${activeTab === id
                            ? 'bg-blue-600/90 text-white shadow-[0_4px_15px_rgba(37,99,235,0.4)]'
                            : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
                        <Icon className="w-4 h-4" />
                        {label}
                        {id === 'sections' && settings?.contentSections?.length > 0 && (
                            <span className="bg-slate-900 border border-white/10 text-slate-300 text-[10px] px-2 py-0.5 rounded-full ml-1">
                                {settings.contentSections.length}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* ── Loading / Error State ── */}
            {!settings && !loadError && (
                <div className="glass-panel border-white/10 rounded-xl p-12 text-center shadow-sm">
                    <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-slate-300 text-sm font-medium tracking-wide">Loading settings…</p>
                </div>
            )}
            {loadError && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-8 text-center backdrop-blur-sm">
                    <p className="text-red-400 font-bold mb-3 tracking-wide">Could not load settings</p>
                    <button onClick={loadSettings} className="text-sm text-white bg-red-500/80 hover:bg-red-500 px-4 py-2 rounded-lg shadow-sm transition-colors">Try again</button>
                </div>
            )}

            {settings && (
                <>
                    {/* ═══════════════════ HOME PAGE TAB ═══════════════════ */}
                    {activeTab === 'home' && (
                        <div className="grid lg:grid-cols-2 gap-8">
                            {/* Form */}
                            <div className="glass-panel rounded-2xl border-white/10 shadow-sm relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none"></div>
                                <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between bg-white/5 backdrop-blur-sm">
                                    <h2 className="font-bold text-white tracking-wide">Hero Content</h2>
                                    <button onClick={() => setShowPreview(p => !p)}
                                        className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-slate-900/50 border border-white/10 px-3 py-1.5 rounded-lg transition-all hover:bg-slate-800">
                                        <Eye className="w-3.5 h-3.5" />
                                        {showPreview ? 'Hide' : 'Show'} preview
                                    </button>
                                </div>
                                <form onSubmit={handleSaveHome} className="p-6 space-y-6 relative z-10">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-300 mb-1.5 tracking-wide">
                                            Page Title <span className="text-red-400">*</span>
                                        </label>
                                        <input type="text" required
                                            value={homeForm.homeTitle}
                                            onChange={e => setHomeForm({ ...homeForm, homeTitle: e.target.value })}
                                            placeholder="e.g. Exam Management System"
                                            className="w-full bg-slate-900/50 border border-white/20 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-inner placeholder-slate-500" style={{colorScheme: 'dark'}} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-300 mb-1.5 tracking-wide">
                                            Description <span className="text-red-400">*</span>
                                        </label>
                                        <textarea rows={4} required
                                            value={homeForm.homeDescription}
                                            onChange={e => setHomeForm({ ...homeForm, homeDescription: e.target.value })}
                                            placeholder="A short description shown below the title on the home page…"
                                            className="w-full bg-slate-900/50 border border-white/20 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none shadow-inner placeholder-slate-500" style={{colorScheme: 'dark'}} />
                                    </div>
                                    {/* Background Video — file OR url */}
                                    <div className="pt-2 border-t border-white/10">
                                        <label className="block text-sm font-bold text-slate-300 mb-3 tracking-wide">
                                            Background Video
                                            <span className="ml-2 text-xs font-medium text-slate-500 bg-slate-900/50 px-2 py-1 rounded inline-block">optional — plays behind the hero</span>
                                        </label>

                                        {/* Mode tabs */}
                                        <div className="flex gap-1 bg-white/5 border border-white/10 p-1 rounded-lg mb-4 w-fit shadow-inner">
                                            <button type="button" onClick={() => setVideoTab('url')}
                                                className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-bold transition-all duration-300 ${
                                                    videoTab === 'url' ? 'bg-blue-600/90 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                                                }`}>
                                                <Link className="w-3.5 h-3.5" /> Paste URL
                                            </button>
                                            <button type="button" onClick={() => setVideoTab('upload')}
                                                className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-bold transition-all duration-300 ${
                                                    videoTab === 'upload' ? 'bg-blue-600/90 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                                                }`}>
                                                <Upload className="w-3.5 h-3.5" /> Upload File
                                            </button>
                                        </div>

                                        {videoTab === 'url' ? (
                                            <input type="url"
                                                value={homeForm.backgroundVideoUrl}
                                                onChange={e => setHomeForm({ ...homeForm, backgroundVideoUrl: e.target.value })}
                                                placeholder="https://example.com/hero-video.mp4"
                                                className="w-full bg-slate-900/50 border border-white/20 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-inner placeholder-slate-500" style={{colorScheme: 'dark'}} />
                                        ) : (
                                            <div
                                                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
                                                    uploading ? 'border-blue-500 bg-blue-500/10' : 'border-white/20 hover:border-blue-400 hover:bg-blue-900/20 cursor-pointer shadow-inner bg-slate-900/30'
                                                }`}
                                                onClick={() => !uploading && videoFileRef.current?.click()}
                                                onDragOver={e => e.preventDefault()}
                                                onDrop={e => { e.preventDefault(); handleVideoFileUpload(e.dataTransfer.files[0]); }}
                                            >
                                                <input ref={videoFileRef} type="file" accept="video/mp4,video/webm,video/quicktime"
                                                    className="hidden"
                                                    onChange={e => handleVideoFileUpload(e.target.files[0])} />
                                                {uploading ? (
                                                    <div className="flex flex-col items-center gap-3">
                                                        <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
                                                        <p className="text-sm text-blue-300 font-bold tracking-wide">Uploading to Cloudinary…</p>
                                                        <div className="w-56 h-2 bg-slate-800 rounded-full overflow-hidden shadow-inner mt-1 relative">
                                                            <div className="absolute inset-y-0 left-0 bg-blue-500 rounded-full transition-all duration-300 shadow-[0_0_10px_rgba(59,130,246,0.8)]" style={{ width: `${uploadProgress}%` }} />
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <Upload className="w-10 h-10 text-slate-500 mx-auto mb-3" />
                                                        <p className="text-sm font-bold text-slate-300 tracking-wide">Click or drag &amp; drop a video</p>
                                                        <p className="text-xs text-slate-500 mt-2 font-medium">MP4 · WebM · MOV &mdash; max 100 MB</p>
                                                    </>
                                                )}
                                            </div>
                                        )}

                                        {/* Current video preview */}
                                        {homeForm.backgroundVideoUrl && (
                                            <div className="mt-4 flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 shadow-inner">
                                                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                                                <p className="text-sm font-medium text-emerald-400 truncate flex-1 tracking-wide" title={homeForm.backgroundVideoUrl}>
                                                    {homeForm.backgroundVideoUrl}
                                                </p>
                                                <button type="button"
                                                    onClick={() => setHomeForm(f => ({ ...f, backgroundVideoUrl: '' }))}
                                                    className="text-emerald-500 hover:text-red-400 transition-colors flex-shrink-0 bg-black/20 p-1.5 rounded-md hover:bg-black/40">
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3 pt-4 border-t border-white/10 mt-2">
                                        <button type="submit" disabled={savingHome}
                                            className="flex items-center gap-2 px-6 py-3 bg-blue-600/90 text-white rounded-xl text-sm font-bold shadow-[0_4px_15px_rgba(37,99,235,0.4)] hover:bg-blue-500 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 w-full justify-center">
                                            <Save className="w-4 h-4" />
                                            {savingHome ? 'Saving…' : 'Save Changes'}
                                        </button>
                                    </div>
                                </form>
                            </div>

                            {/* Live Preview */}
                            {showPreview && (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <Eye className="w-4 h-4 text-slate-400" />
                                        <p className="text-sm font-medium text-slate-600">Live Preview</p>
                                    </div>
                                    <HeroPreview title={homeForm.homeTitle} description={homeForm.homeDescription} />
                                    <p className="text-xs text-slate-400 text-center">Updates as you type · Reflect real student view</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ════════════════ CUSTOM SECTIONS TAB ════════════════ */}
                    {activeTab === 'sections' && (
                        <div className="glass-panel rounded-2xl border-white/10 shadow-sm relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/5 to-transparent pointer-events-none"></div>
                            <div className="px-6 py-5 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/5 backdrop-blur-sm">
                                <div>
                                    <h2 className="font-bold text-white tracking-wide text-lg">Custom Sections</h2>
                                    <p className="text-xs text-slate-400 mt-1 font-medium">Extra content blocks shown below the feature cards on the home page</p>
                                </div>
                                <button
                                    onClick={() => { setSectionForm({ ...emptySection, sortOrder: settings?.contentSections?.length || 0 }); setShowAddSection(true); }}
                                    className="flex items-center gap-2 px-4 py-2.5 bg-blue-600/90 text-white rounded-xl text-sm font-bold hover:bg-blue-500 transition-all shadow-[0_4px_15px_rgba(37,99,235,0.4)] hover:-translate-y-0.5 whitespace-nowrap self-start">
                                    <Plus className="w-4 h-4" /> Add Section
                                </button>
                            </div>

                            <div className="p-6 relative z-10">
                                {settings?.contentSections?.length === 0 && (
                                    <div className="text-center py-16 border-2 border-dashed border-white/10 bg-slate-900/30 rounded-2xl">
                                        <Layers className="w-12 h-12 text-slate-500 opacity-50 mx-auto mb-4" />
                                        <p className="font-bold text-slate-300 mb-1 text-lg">No custom sections yet</p>
                                        <p className="text-sm text-slate-400">Add sections to enrich your home page with images, videos, and text.</p>
                                    </div>
                                )}

                                <div className="space-y-4">
                                    {settings?.contentSections?.map((sec, i) => (
                                        <div key={sec.id}
                                            className="group flex flex-col sm:flex-row sm:items-start gap-4 glass-panel border border-white/10 rounded-2xl p-5 hover:border-white/20 hover:shadow-[0_8px_30px_rgba(59,130,246,0.1)] transition-all duration-300 hover:-translate-y-1">
                                            {/* Drag handle & order badge */}
                                            <div className="flex sm:flex-col items-center gap-2 pt-1">
                                                <GripVertical className="w-5 h-5 text-slate-500 cursor-move" />
                                                <span className="text-[10px] text-white font-black bg-blue-500/20 border border-blue-500/30 w-6 h-6 flex items-center justify-center rounded-full shadow-inner">{i + 1}</span>
                                            </div>

                                            {/* Media type icon */}
                                            <div className="bg-slate-900/50 p-3 rounded-xl border border-white/5 shadow-inner hidden sm:block">
                                                <MediaIcon url={sec.mediaUrl} />
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-white text-lg tracking-wide">{sec.heading}</p>
                                                {sec.description && (
                                                    <p className="text-sm text-slate-300 mt-1 line-clamp-2 leading-relaxed">{sec.description}</p>
                                                )}
                                                {sec.mediaUrl && (
                                                    <p className="text-xs text-blue-400 mt-2 truncate bg-blue-500/10 px-2 py-1 rounded-md border border-blue-500/20 inline-block max-w-full">{sec.mediaUrl}</p>
                                                )}
                                                <div className="flex flex-wrap items-center gap-2 mt-3">
                                                    <span className="text-xs text-slate-300 bg-slate-800 px-2 py-1 rounded-md font-bold shadow-inner">
                                                        Order: {sec.sortOrder}
                                                    </span>
                                                    {sec.mediaUrl && (
                                                        <span className={`text-xs px-2 py-1 rounded-md font-bold shadow-inner ${
                                                            sec.mediaUrl.includes('youtube') || sec.mediaUrl.includes('youtu.be')
                                                                ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                                                : sec.mediaUrl.match(/\.(mp4|webm)/i)
                                                                    ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                                                                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                                        }`}>
                                                            {sec.mediaUrl.includes('youtube') || sec.mediaUrl.includes('youtu.be') ? 'YouTube' : sec.mediaUrl.match(/\.(mp4|webm)/i) ? 'Video' : 'Image'}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex sm:flex-col gap-2 mt-4 sm:mt-0 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity self-end sm:self-start">
                                                <button onClick={() => openEdit(sec)}
                                                    className="p-2.5 bg-slate-900/50 hover:bg-blue-500/20 text-slate-400 hover:text-blue-400 rounded-xl transition-colors border border-white/5 hover:border-blue-500/30" title="Edit">
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleDeleteSection(sec.id)}
                                                    className="p-2.5 bg-slate-900/50 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-xl transition-colors border border-white/5 hover:border-red-500/30" title="Delete">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* ── Add Section Modal ── */}
            {showAddSection && (
                <Modal title="Add Content Section" onClose={() => setShowAddSection(false)}>
                    <form onSubmit={handleAddSection} className="space-y-6">
                        <SectionFormFields form={sectionForm} onChange={setSectionForm} />
                        <div className="flex gap-3 pt-6 border-t border-white/10">
                            <button type="submit" disabled={savingSection}
                                className="flex-1 py-3 bg-blue-600/90 text-white rounded-xl text-sm font-bold shadow-[0_4px_15px_rgba(37,99,235,0.4)] hover:bg-blue-500 hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 transition-all">
                                {savingSection ? 'Adding…' : 'Add Section'}
                            </button>
                            <button type="button" onClick={() => setShowAddSection(false)}
                                className="flex-1 py-3 bg-white/5 text-slate-300 border border-white/10 rounded-xl text-sm font-bold hover:bg-white/10 transition-colors">
                                Cancel
                            </button>
                        </div>
                    </form>
                </Modal>
            )}

            {/* ── Edit Section Modal ── */}
            {editSection && (
                <Modal title="Edit Section" onClose={() => setEditSection(null)}>
                    <form onSubmit={handleEditSection} className="space-y-6">
                        <SectionFormFields form={sectionForm} onChange={setSectionForm} />
                        <div className="flex gap-3 pt-6 border-t border-white/10">
                            <button type="submit" disabled={savingSection}
                                className="flex-1 py-3 bg-blue-600/90 text-white rounded-xl text-sm font-bold shadow-[0_4px_15px_rgba(37,99,235,0.4)] hover:bg-blue-500 hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 transition-all">
                                {savingSection ? 'Saving…' : 'Save Changes'}
                            </button>
                            <button type="button" onClick={() => setEditSection(null)}
                                className="flex-1 py-3 bg-white/5 text-slate-300 border border-white/10 rounded-xl text-sm font-bold hover:bg-white/10 transition-colors">
                                Cancel
                            </button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
}
