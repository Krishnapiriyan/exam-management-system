import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import Home from './pages/Home';
import Timetable from './pages/Timetable';
import ResultsPage from './pages/ResultsPage';
import PastPapers from './pages/PastPapers';
import About from './pages/About';
import './index.css';

const navLinks = [
  { to: '/', label: 'Home', end: true },
  { to: '/timetable', label: 'Timetables' },
  { to: '/results', label: 'Results' },
  { to: '/past-papers', label: 'Past Papers' },
  { to: '/about', label: 'About' },
];

function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <nav className="glass-panel sticky top-0 z-40 !border-l-0 !border-r-0 !border-t-0 border-b border-white/10 !rounded-none">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-16">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 glass-panel !rounded-lg flex items-center justify-center">
            <img src="/logo.png" alt="School Logo" className="w-6 h-6 object-contain" />
          </div>
          <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-emerald-400 tracking-tight">Exam Management System</span>
        </div>
        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map(({ to, label, end }) => (
            <NavLink key={to} to={to} end={end}
              className={({ isActive }) =>
                `px-4 py-2 rounded-lg text-sm font-bold transition-all duration-300 ${isActive ? 'bg-blue-600/90 text-white shadow-[0_4px_20px_rgba(37,99,235,0.4)]' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`
              }>{label}</NavLink>
          ))}
        </div>
        {/* Mobile toggle */}
        <button className="md:hidden p-2 text-slate-400 hover:text-white" onClick={() => setMobileOpen(o => !o)}>
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>
      {mobileOpen && (
        <div className="md:hidden border-t border-white/10 px-4 py-3 space-y-1 glass-panel !rounded-none">
          {navLinks.map(({ to, label, end }) => (
            <NavLink key={to} to={to} end={end} onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `block px-4 py-2.5 rounded-lg text-sm font-bold transition-all ${isActive ? 'bg-blue-600/90 text-white shadow-[0_4px_20px_rgba(37,99,235,0.4)]' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`
              }>{label}</NavLink>
          ))}
        </div>
      )}
    </nav>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{ style: { background: '#1e293b', color: '#fff' } }} />
      <Navbar />
      <main className="min-h-[calc(100vh-4rem)]">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/timetable" element={<Timetable />} />
          <Route path="/results" element={<ResultsPage />} />
          <Route path="/past-papers" element={<PastPapers />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}
