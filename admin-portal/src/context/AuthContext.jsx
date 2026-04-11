import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [admin, setAdmin] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('ems_token');
        const stored = localStorage.getItem('ems_admin');
        if (token && stored) {
            try { setAdmin(JSON.parse(stored)); } catch { localStorage.clear(); }
        }
        setLoading(false);
    }, []);

    const loginAdmin = (token, adminData) => {
        localStorage.setItem('ems_token', token);
        localStorage.setItem('ems_admin', JSON.stringify(adminData));
        setAdmin(adminData);
    };

    const logoutAdmin = () => {
        localStorage.removeItem('ems_token');
        localStorage.removeItem('ems_admin');
        setAdmin(null);
    };

    return (
        <AuthContext.Provider value={{ admin, loading, loginAdmin, logoutAdmin, isAuthenticated: !!admin }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
