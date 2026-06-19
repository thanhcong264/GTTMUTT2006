import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

const API_BASE = '/api';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('goclick_token'));
  const [loading, setLoading] = useState(true);

  // Axios instance with auth header
  const api = axios.create({ baseURL: API_BASE });
  api.interceptors.request.use((config) => {
    const t = localStorage.getItem('goclick_token');
    if (t) config.headers.Authorization = `Bearer ${t}`;
    return config;
  });
  api.interceptors.response.use(
    (res) => res,
    (err) => {
      if (err.response?.status === 401) logout();
      return Promise.reject(err);
    }
  );

  useEffect(() => {
    if (token) {
      api.get('/auth/me')
        .then((res) => setUser(res.data))
        .catch(() => { localStorage.removeItem('goclick_token'); setToken(null); })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { access_token, user: u } = res.data;
    localStorage.setItem('goclick_token', access_token);
    setToken(access_token);
    setUser(u);
    return u;
  };

  const logout = () => {
    localStorage.removeItem('goclick_token');
    setToken(null);
    setUser(null);
  };

  // RBAC helper
  const hasRole = (...roles) => roles.includes(user?.role);
  const isAdmin = () => user?.role === 'admin';

  const value = { user, token, loading, login, logout, hasRole, isAdmin, api };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
