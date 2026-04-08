import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AdminContext = createContext(null);
const API_URL = '/api';

export function AdminProvider({ children }) {
  const [admin, setAdmin]   = useState(null);
  const [token, setToken]   = useState(localStorage.getItem('adminToken'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      verifyToken();
    } else {
      setLoading(false);
    }
  }, []);

  async function verifyToken() {
    try {
      const res = await axios.get(`${API_URL}/admin/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // If the request succeeds the token is valid; decode role from storage
      const stored = JSON.parse(atob(token.split('.')[1]));
      setAdmin({ id: stored.id, email: stored.email, role: stored.role, name: 'Platform Admin' });
    } catch {
      localStorage.removeItem('adminToken');
      setToken(null);
      setAdmin(null);
    } finally {
      setLoading(false);
    }
  }

  async function login(email, password) {
    const res = await axios.post(`${API_URL}/admin/login`, { email, password });
    localStorage.setItem('adminToken', res.data.token);
    setToken(res.data.token);
    setAdmin(res.data.user);
    return res.data;
  }

  function logout() {
    localStorage.removeItem('adminToken');
    setToken(null);
    setAdmin(null);
  }

  return (
    <AdminContext.Provider value={{ admin, token, loading, login, logout }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdmin must be inside AdminProvider');
  return ctx;
}
