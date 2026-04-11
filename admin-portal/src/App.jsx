import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Exams from './pages/Exams';
import Results from './pages/Results';
import PastPapers from './pages/PastPapers';
import SiteSettings from './pages/SiteSettings';
import Profile from './pages/Profile';
import './index.css';

function PrivateRoute({ children }) {
    const { isAuthenticated, loading } = useAuth();
    if (loading) return <div className="flex items-center justify-center h-screen text-blue-600 text-xl font-semibold">Loading...</div>;
    return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function AppRoutes() {
    const { isAuthenticated } = useAuth();
    return (
        <Routes>
            <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} />
            <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
                <Route index element={<Dashboard />} />
                <Route path="students" element={<Students />} />
                <Route path="exams" element={<Exams />} />
                <Route path="results" element={<Results />} />
                <Route path="past-papers" element={<PastPapers />} />
                <Route path="site-settings" element={<SiteSettings />} />
                <Route path="profile" element={<Profile />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

export default function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
                <AppRoutes />
            </BrowserRouter>
        </AuthProvider>
    );
}
