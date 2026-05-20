import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('FitStack_token');
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      // Always fetch fresh user from server — never trust cached localStorage role
      const { data } = await authAPI.getMe();
      setUser(data.user);
      setIsAuthenticated(true);
      // Keep localStorage in sync with fresh server data
      localStorage.setItem('FitStack_user', JSON.stringify(data.user));
    } catch {
      localStorage.removeItem('FitStack_token');
      localStorage.removeItem('FitStack_user');
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = async (credentials) => {
    const { data } = await authAPI.login(credentials);
    localStorage.setItem('FitStack_token', data.token);
    localStorage.setItem('FitStack_user', JSON.stringify(data.user));
    setUser(data.user);
    setIsAuthenticated(true);
    return data;
  };

  const register = async (userData) => {
    const { data } = await authAPI.register(userData);
    localStorage.setItem('FitStack_token', data.token);
    localStorage.setItem('FitStack_user', JSON.stringify(data.user));
    setUser(data.user);
    setIsAuthenticated(true);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('FitStack_token');
    localStorage.removeItem('FitStack_user');
    setUser(null);
    setIsAuthenticated(false);
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('FitStack_user', JSON.stringify(updatedUser));
  };

  const isPremium = () => {
    const sub = user?.subscription;
    if (!sub || sub.type !== 'PREMIUM') return false;
    if (sub.status !== 'ACTIVE') return false;
    if (sub.endDate && new Date() > new Date(sub.endDate)) return false;
    return true;
  };

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated, login, register, logout, updateUser, loadUser, isPremium }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
