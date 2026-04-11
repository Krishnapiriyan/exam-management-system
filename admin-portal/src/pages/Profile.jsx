import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getAdmins, createAdmin, updateAdmin, deleteAdmin, changePassword } from '../api/client';
import toast from 'react-hot-toast';
import { Plus, Trash2, Edit2, Key, X, Shield } from 'lucide-react';

function Modal({ title, onClose, children }) {
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="glass-panel rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/20 w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/5 backdrop-blur-md">
                    <h2 className="text-lg font-bold text-white tracking-wide">{title}</h2>
                    <button onClick={onClose} className="p-1.5 hover:bg-white/10 text-slate-300 hover:text-white rounded-lg transition-colors"><X className="w-5 h-5" /></button>
                </div>
                <div className="px-6 py-6 bg-slate-900/20">{children}</div>
            </div>
        </div>
    );
}

export default function Profile() {
    const { admin: currentAdmin } = useAuth();
    const [admins, setAdmins] = useState([]);
    const [showAddAdmin, setShowAddAdmin] = useState(false);
    const [editAdmin, setEditAdmin] = useState(null);
    const [changePwAdmin, setChangePwAdmin] = useState(null);
    const [adminForm, setAdminForm] = useState({ name: '', email: '', password: '' });
    const [editForm, setEditForm] = useState({ name: '', email: '' });
    const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

    const loadAdmins = () => {
        getAdmins().then(r => setAdmins(r.data.data)).catch(() => toast.error('Failed to load admins'));
    };

    useEffect(() => { loadAdmins(); }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await createAdmin(adminForm);
            toast.success('Admin created!');
            setShowAddAdmin(false);
            setAdminForm({ name: '', email: '', password: '' });
            loadAdmins();
        } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    };

    const handleEdit = async (e) => {
        e.preventDefault();
        try {
            await updateAdmin(editAdmin.id, editForm);
            toast.success('Admin updated!');
            setEditAdmin(null);
            loadAdmins();
        } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this admin? This cannot be undone.')) return;
        try {
            await deleteAdmin(id);
            toast.success('Admin deleted');
            loadAdmins();
        } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (pwForm.newPassword !== pwForm.confirmPassword) {
            return toast.error('New passwords do not match');
        }
        try {
            await changePassword(changePwAdmin.id, { currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
            toast.success('Password changed!');
            setChangePwAdmin(null);
            setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-600/20 border border-blue-500/30 rounded-xl flex items-center justify-center shadow-inner">
                    <Shield className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                    <h1 className="text-3xl font-extrabold text-white drop-shadow-md tracking-tight">Profile & Admin Management</h1>
                    <p className="text-slate-300 text-sm font-medium mt-1">Manage admin accounts and your profile</p>
                </div>
            </div>

            {/* My Profile Card */}
            <div className="glass-panel rounded-2xl shadow-sm border-white/10 p-6">
                <h2 className="font-bold text-white mb-5 text-lg tracking-wide">My Account</h2>
                <div className="flex items-center gap-5 mb-5">
                    <div className="w-16 h-16 rounded-2xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 text-3xl font-black shadow-inner">
                        {currentAdmin?.name?.[0]?.toUpperCase() || 'A'}
                    </div>
                    <div>
                        <p className="text-2xl font-extrabold text-white tracking-tight">{currentAdmin?.name}</p>
                        <p className="text-slate-400 text-sm font-medium mt-0.5">{currentAdmin?.email}</p>
                    </div>
                </div>
                <button onClick={() => { setChangePwAdmin(currentAdmin); setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' }); }}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 text-blue-300 border border-blue-500/30 rounded-lg text-sm font-bold hover:bg-blue-600/30 transition-colors shadow-sm w-fit">
                    <Key className="w-4 h-4" /> Change My Password
                </button>
            </div>

            {/* All Admins */}
            <div className="glass-panel rounded-2xl shadow-sm border-white/10 p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="font-bold text-white text-lg tracking-wide">All Administrators</h2>
                    <button onClick={() => setShowAddAdmin(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600/90 text-white rounded-lg text-sm font-bold shadow-[0_4px_15px_rgba(37,99,235,0.4)] hover:bg-blue-500 transition-all hover:-translate-y-0.5">
                        <Plus className="w-4 h-4" /> Add Admin
                    </button>
                </div>
                <div className="space-y-4 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                    {admins.map(admin => (
                        <div key={admin.id} className="glass-panel border-white/10 rounded-xl p-4 flex items-center gap-4 hover:border-white/20 transition-all">
                            <div className="w-12 h-12 rounded-full bg-slate-900/50 border border-white/10 flex items-center justify-center text-white font-black text-xl shadow-inner">
                                {admin.name[0].toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-white text-base truncate tracking-wide flex items-center gap-2">
                                    {admin.name}
                                    {admin.id === currentAdmin?.id && <span className="text-[10px] bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">You</span>}
                                </p>
                                <p className="text-sm text-slate-400 truncate mt-0.5 font-medium">{admin.email}</p>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => { setEditAdmin(admin); setEditForm({ name: admin.name, email: admin.email }); }}
                                    className="p-2 bg-slate-900/50 hover:bg-blue-500/20 text-slate-400 hover:text-blue-400 rounded-lg transition-colors border border-transparent hover:border-blue-500/30" title="Edit">
                                    <Edit2 className="w-4 h-4" />
                                </button>
                                <button onClick={() => { setChangePwAdmin(admin); setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' }); }}
                                    className="p-2 bg-slate-900/50 hover:bg-emerald-500/20 text-slate-400 hover:text-emerald-400 rounded-lg transition-colors border border-transparent hover:border-emerald-500/30" title="Change Password">
                                    <Key className="w-4 h-4" />
                                </button>
                                {admin.id !== currentAdmin?.id && (
                                    <button onClick={() => handleDelete(admin.id)}
                                        className="p-2 bg-slate-900/50 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-lg transition-colors border border-transparent hover:border-red-500/30" title="Delete">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Add Admin Modal */}
            {showAddAdmin && (
                <Modal title="Add New Admin" onClose={() => setShowAddAdmin(false)}>
                    <form onSubmit={handleCreate} className="space-y-5">
                        {[['Full Name *', 'name', 'text'], ['Email *', 'email', 'email'], ['Password *', 'password', 'password']].map(([label, key, type]) => (
                            <div key={key}>
                                <label className="block text-sm font-bold text-slate-300 mb-1.5 tracking-wide">{label}</label>
                                <input type={type} required value={adminForm[key]} onChange={e => setAdminForm({ ...adminForm, [key]: e.target.value })}
                                    className="w-full bg-slate-900/50 border border-white/20 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-inner placeholder-slate-500" style={{colorScheme: 'dark'}} />
                            </div>
                        ))}
                        <div className="flex gap-3 pt-4 border-t border-white/10 mt-2">
                            <button type="submit" className="flex-1 py-2.5 bg-blue-600/90 text-white rounded-lg text-sm font-bold shadow-[0_4px_15px_rgba(37,99,235,0.4)] hover:bg-blue-500 hover:-translate-y-0.5 transition-all">Create Admin</button>
                            <button type="button" onClick={() => setShowAddAdmin(false)} className="flex-1 py-2.5 bg-white/5 text-slate-300 border border-white/10 rounded-lg text-sm font-bold hover:bg-white/10 transition-colors">Cancel</button>
                        </div>
                    </form>
                </Modal>
            )}

            {/* Edit Admin Modal */}
            {editAdmin && (
                <Modal title="Edit Admin" onClose={() => setEditAdmin(null)}>
                    <form onSubmit={handleEdit} className="space-y-5">
                        {[['Full Name *', 'name', 'text'], ['Email *', 'email', 'email']].map(([label, key, type]) => (
                            <div key={key}>
                                <label className="block text-sm font-bold text-slate-300 mb-1.5 tracking-wide">{label}</label>
                                <input type={type} required value={editForm[key]} onChange={e => setEditForm({ ...editForm, [key]: e.target.value })}
                                    className="w-full bg-slate-900/50 border border-white/20 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-inner placeholder-slate-500" style={{colorScheme: 'dark'}} />
                            </div>
                        ))}
                        <div className="flex gap-3 pt-4 border-t border-white/10 mt-2">
                            <button type="submit" className="flex-1 py-2.5 bg-blue-600/90 text-white rounded-lg text-sm font-bold shadow-[0_4px_15px_rgba(37,99,235,0.4)] hover:bg-blue-500 hover:-translate-y-0.5 transition-all">Save Changes</button>
                            <button type="button" onClick={() => setEditAdmin(null)} className="flex-1 py-2.5 bg-white/5 text-slate-300 border border-white/10 rounded-lg text-sm font-bold hover:bg-white/10 transition-colors">Cancel</button>
                        </div>
                    </form>
                </Modal>
            )}

            {/* Change Password Modal */}
            {changePwAdmin && (
                <Modal title={`Change Password — ${changePwAdmin.name}`} onClose={() => setChangePwAdmin(null)}>
                    <form onSubmit={handleChangePassword} className="space-y-5">
                        {[['Current Password *', 'currentPassword'], ['New Password *', 'newPassword'], ['Confirm New Password *', 'confirmPassword']].map(([label, key]) => (
                            <div key={key}>
                                <label className="block text-sm font-bold text-slate-300 mb-1.5 tracking-wide">{label}</label>
                                <input type="password" required value={pwForm[key]} onChange={e => setPwForm({ ...pwForm, [key]: e.target.value })} minLength={6}
                                    className="w-full bg-slate-900/50 border border-white/20 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-inner placeholder-slate-500" style={{colorScheme: 'dark'}} />
                            </div>
                        ))}
                        <div className="flex gap-3 pt-4 border-t border-white/10 mt-2">
                            <button type="submit" className="flex-1 py-2.5 bg-blue-600/90 text-white rounded-lg text-sm font-bold shadow-[0_4px_15px_rgba(37,99,235,0.4)] hover:bg-blue-500 hover:-translate-y-0.5 transition-all">Change Password</button>
                            <button type="button" onClick={() => setChangePwAdmin(null)} className="flex-1 py-2.5 bg-white/5 text-slate-300 border border-white/10 rounded-lg text-sm font-bold hover:bg-white/10 transition-colors">Cancel</button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
}
