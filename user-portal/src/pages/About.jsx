import { GraduationCap, BookOpen, Users, Target, Mail } from 'lucide-react';

export default function About() {
    return (
        <div className="max-w-4xl mx-auto px-4 py-16">
            {/* Hero */}
            <div className="text-center mb-16">
                <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-[0_8px_30px_rgba(37,99,235,0.4)]">
                    <GraduationCap className="w-10 h-10 text-white" />
                </div>
                <h1 className="text-4xl font-extrabold text-white mb-4 drop-shadow-md">About EMS</h1>
                <p className="text-slate-300 text-lg leading-relaxed max-w-2xl mx-auto font-medium">
                    The Exam Management System is a comprehensive academic platform designed to streamline examination
                    workflows, results management, and student communication.
                </p>
            </div>

            {/* Feature Cards */}
            <div className="grid md:grid-cols-2 gap-6 mb-16">
                {[
                    { icon: BookOpen, color: 'bg-blue-500/20 text-blue-400', title: 'Exam Scheduling', desc: 'All upcoming and past exams organized in an easy-to-view timetable with calendar and list views.' },
                    { icon: Target, color: 'bg-emerald-500/20 text-emerald-400', title: 'Results Access', desc: 'Securely access your personal exam results using your index number and email — no login required.' },
                    { icon: Users, color: 'bg-purple-500/20 text-purple-400', title: 'Multi-Batch Support', desc: 'Supports multiple batch years simultaneously, with subject-specific management for each batch.' },
                    { icon: Mail, color: 'bg-orange-500/20 text-orange-400', title: 'Notifications', desc: 'Automated email alerts for new exams, cancellations, and results releases keep students informed.' },
                ].map(({ icon: Icon, color, title, desc }) => (
                    <div key={title} className="glass-panel p-6 hover:-translate-y-1 transition-all duration-300 rounded-2xl border-white/10 hover:border-white/20 hover:shadow-[0_8px_30px_rgba(59,130,246,0.15)]">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${color}`}>
                            <Icon className="w-5 h-5" />
                        </div>
                        <h3 className="font-bold text-white text-lg mb-2">{title}</h3>
                        <p className="text-slate-300 text-sm leading-relaxed">{desc}</p>
                    </div>
                ))}
            </div>

            {/* Subjects */}
            <div className="glass-panel p-8 mb-16 rounded-2xl bg-blue-900/10 hover:border-white/20 transition-all duration-300">
                <h2 className="text-xl font-bold text-white mb-2">Available Subjects</h2>
                <p className="text-slate-300 text-sm mb-5">The system supports the following subjects across all batches:</p>
                <div className="flex flex-wrap gap-3">
                    {['Physics', 'Chemistry', 'Mathematics', 'Biology', 'Information and Communication Technology'].map(s => (
                        <span key={s} className="bg-white/5 border border-white/10 text-blue-300 px-4 py-2 rounded-full text-sm font-semibold shadow-sm backdrop-blur-sm hover:bg-white/10 transition-colors cursor-default">
                            {s}
                        </span>
                    ))}
                </div>
            </div>

            {/* Contact */}
            <div className="text-center">
                <h2 className="text-xl font-bold text-white mb-2">Need Help?</h2>
                <p className="text-slate-300 text-sm mb-4">If you have trouble accessing your results or need assistance, please contact your school administrator.</p>
                <div className="inline-flex items-center gap-2 glass-panel rounded-full px-5 py-2.5 text-sm text-slate-200 font-medium">
                    <Mail className="w-4 h-4 text-blue-400" /> admin@ems.school.lk
                </div>
            </div>
        </div>
    );
}
