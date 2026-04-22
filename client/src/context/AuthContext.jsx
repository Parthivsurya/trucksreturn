import { createContext, useContext, useState, useEffect, useRef } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

const API_URL = '/api';

// Decode JWT payload without verifying signature (browser-side, safe for expiry check only)
function decodeToken(token) {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser]   = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const refreshTimerRef = useRef(null);

  // Schedule a silent refresh 1 minute before access token expires
  function scheduleRefresh(accessToken) {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    const payload = decodeToken(accessToken);
    if (!payload?.exp) return;
    const msUntilExpiry = payload.exp * 1000 - Date.now();
    const refreshIn = Math.max(msUntilExpiry - 60 * 1000, 0); // 1 min before expiry
    refreshTimerRef.current = setTimeout(() => silentRefresh(), refreshIn);
  }

  async function silentRefresh() {
    try {
      const res = await axios.post(`${API_URL}/auth/refresh`, {}, { withCredentials: true });
      const newToken = res.data.token;
      localStorage.setItem('token', newToken);
      setToken(newToken);
      scheduleRefresh(newToken);
    } catch {
      // Refresh token expired or invalid — force logout
      _clearAuth();
    }
  }

  function _clearAuth() {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  }

  useEffect(() => {
    if (token) {
      fetchUser();
      scheduleRefresh(token);
    } else {
      setLoading(false);
    }
    return () => { if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current); };
  }, []);

  async function fetchUser() {
    try {
      const res = await axios.get(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      setUser(res.data.user);
    } catch (err) {
      if (err.response?.status === 401) {
        // Access token expired — try refresh once
        try {
          const refreshRes = await axios.post(`${API_URL}/auth/refresh`, {}, { withCredentials: true });
          const newToken = refreshRes.data.token;
          localStorage.setItem('token', newToken);
          setToken(newToken);
          scheduleRefresh(newToken);
          const meRes = await axios.get(`${API_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${newToken}` },
          });
          setUser(meRes.data.user);
        } catch {
          _clearAuth();
        }
      } else {
        _clearAuth();
      }
    } finally {
      setLoading(false);
    }
  }

  async function login(email, password) {
    const res = await axios.post(`${API_URL}/auth/login`, { email, password }, { withCredentials: true });
    const { token: accessToken, user: userData } = res.data;
    localStorage.setItem('token', accessToken);
    setToken(accessToken);
    setUser(userData);
    scheduleRefresh(accessToken);
    return res.data;
  }

  async function register(data) {
    const res = await axios.post(`${API_URL}/auth/register`, data, { withCredentials: true });
    const { token: accessToken, user: userData } = res.data;
    localStorage.setItem('token', accessToken);
    setToken(accessToken);
    setUser(userData);
    scheduleRefresh(accessToken);
    return res.data;
  }

  async function logout() {
    try {
      await axios.post(`${API_URL}/auth/logout`, {}, { withCredentials: true });
    } catch { /* best-effort */ }
    _clearAuth();
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
