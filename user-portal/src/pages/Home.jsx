import { useState, useEffect } from 'react';
import { getSiteSettings } from '../api/client';

/* ─── Skeleton shimmer block ─── */
function Shimmer({ className }) {
    return <div className={`animate-pulse bg-white/20 rounded-lg ${className}`} />;
}

export default function Home() {
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        getSiteSettings()
            .then(r => setSettings(r.data.data))
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div>
            {/* ── Hero ── */}
            <section className={`relative min-h-[70vh] flex items-center justify-center overflow-hidden ${settings?.backgroundVideoUrl ? 'bg-black' : 'bg-transparent'
                }`}>
                {settings?.backgroundVideoUrl && (
                    <>
                        <video autoPlay muted loop playsInline
                            className="absolute inset-0 w-full h-full object-cover">
                            <source src={settings.backgroundVideoUrl} />
                        </video>
                        {/* Dark scrim so text stays readable over any video */}
                        <div className="absolute inset-0 bg-slate-900/60" />
                    </>
                )}
                <div className="relative z-10 text-center px-6 max-w-3xl mx-auto">
                    <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 shadow-lg text-white text-sm px-4 py-2 rounded-full mb-6 backdrop-blur-md">
                        <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                        CHC Students Page
                    </div>

                    {loading ? (
                        /* Skeleton while loading */
                        <div className="space-y-4">
                            <Shimmer className="h-12 w-3/4 mx-auto" />
                            <Shimmer className="h-5 w-full mx-auto" />
                            <Shimmer className="h-5 w-5/6 mx-auto" />
                            <div className="flex gap-3 justify-center mt-6">
                                <Shimmer className="h-12 w-36" />
                                <Shimmer className="h-12 w-36" />
                            </div>
                        </div>
                    ) : error ? (
                        /* Error state */
                        <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 shadow-2xl p-8">
                            <p className="text-white text-xl font-bold mb-2">Could not load page content</p>
                            <p className="text-slate-300 text-sm mb-5">The server may be unavailable. Please try again shortly.</p>
                            <button onClick={() => window.location.reload()}
                                className="px-5 py-2.5 bg-white text-slate-900 font-semibold rounded-xl hover:bg-slate-100 transition-all text-sm shadow-xl">
                                Retry
                            </button>
                        </div>
                    ) : (
                        /* Normal content */
                        <>
                            <h1 className="text-4xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-emerald-400 leading-tight mb-4 tracking-tight drop-shadow-md">
                                {settings?.homeTitle || 'Exam Management System'}
                            </h1>
                            <p className="text-slate-100 text-lg md:text-xl leading-relaxed mb-8 drop-shadow-sm font-medium">
                                {settings?.homeDescription || 'Your academic hub for timetables, results, and past papers.'}
                            </p>
                            <div className="flex flex-wrap gap-3 justify-center">
                                <a href="/timetable"
                                    className="px-6 py-3 bg-blue-600/90 backdrop-blur-sm text-white font-bold rounded-xl hover:bg-blue-500 transition-all duration-300 shadow-[0_8px_30px_rgba(37,99,235,0.4)] hover:-translate-y-1 hover:shadow-[0_15px_40px_rgba(37,99,235,0.6)]">
                                    View Timetables →
                                </a>
                                <a href="/results"
                                    className="px-6 py-3 glass-panel text-white font-semibold rounded-xl hover:bg-white/10 transition-all duration-300 hover:-translate-y-1">
                                    Check Results
                                </a>
                            </div>
                        </>
                    )}
                </div>
            </section>

            {/* ── Feature Cards (always shown) ── */}
            <section className="max-w-6xl mx-auto px-4 py-16 grid md:grid-cols-3 gap-6">
                {[
                    { title: '📅 Timetables', desc: 'Browse all upcoming and past exam schedules in calendar or list view.', link: '/timetable' },
                    { title: '📊 Results', desc: 'Verify your identity and securely view your exam results per subject.', link: '/results' },
                    { title: '📁 Past Papers', desc: 'Download past question papers and marking schemes to prepare better.', link: '/past-papers' },
                ].map(card => (
                    <a key={card.title} href={card.link}
                        className="group glass-panel rounded-2xl p-6 hover:shadow-[0_15px_40px_rgba(59,130,246,0.15)] hover:border-white/20 transition-all duration-500 hover:-translate-y-2">
                        <p className="text-3xl mb-4 group-hover:scale-125 transition-transform duration-500 origin-left drop-shadow-lg">{card.title.split(' ')[0]}</p>
                        <h3 className="font-bold text-white text-xl mb-2">{card.title.split(' ').slice(1).join(' ')}</h3>
                        <p className="text-slate-300 text-sm leading-relaxed font-medium">{card.desc}</p>
                        <p className="text-blue-400 text-sm font-bold mt-5 group-hover:underline flex items-center gap-1">Explore <span className="group-hover:translate-x-1 transition-transform">→</span></p>
                    </a>
                ))}
            </section>

            {/* ── Custom Sections (from admin) ── */}
            {!loading && !error && settings?.contentSections?.length > 0 && (
                <section className="bg-transparent py-16 border-t border-white/10">
                    <div className="max-w-6xl mx-auto px-4 space-y-24">
                        {settings.contentSections.map((sec, i) => (
                            <div key={sec.id}
                                className={`flex flex-col md:flex-row gap-12 items-center ${i % 2 === 1 ? 'md:flex-row-reverse' : ''}`}>
                                {sec.mediaUrl && (
                                    <div className="md:w-1/2 rounded-3xl overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.6)] bg-slate-900/50 aspect-video ring-1 ring-white/10 backdrop-blur-sm group hover:ring-white/30 transition-all duration-500">
                                        {sec.mediaUrl.includes('youtube') || sec.mediaUrl.includes('youtu.be')
                                            ? <iframe src={sec.mediaUrl} className="w-full h-full" allowFullScreen title={sec.heading} />
                                            : sec.mediaUrl.match(/\.(mp4|webm)/i)
                                                ? <video src={sec.mediaUrl} controls className="w-full h-full object-cover" />
                                                : <img src={sec.mediaUrl} alt={sec.heading} className="w-full h-full object-cover" />
                                        }
                                    </div>
                                )}
                                <div className={sec.mediaUrl ? 'md:w-1/2' : 'w-full text-center'}>
                                    <h2 className="text-3xl font-extrabold text-white mb-4 tracking-tight">{sec.heading}</h2>
                                    {sec.description && <p className="text-slate-200 font-medium leading-relaxed text-lg">{sec.description}</p>}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* ── Footer ── */}
            <footer className="glass-panel text-slate-400 text-center py-8 text-sm !border-l-0 !border-r-0 !border-b-0 !rounded-none">
                <p>© {new Date().getFullYear()} Exam Management System. All rights reserved.</p>
            </footer>
        </div>
    );
}
