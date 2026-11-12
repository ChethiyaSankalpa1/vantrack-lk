import React, { createContext, useContext, useState, useEffect } from 'react';
import client from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('vantrack_admin_token');
    const savedUser = localStorage.getItem('vantrack_admin_user');

    if (savedToken && savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        if (parsed.role === 'admin') {
          setToken(savedToken);
          setUser(parsed);
        } else {
          localStorage.removeItem('vantrack_admin_token');
          localStorage.removeItem('vantrack_admin_user');
        }
      } catch (e) {
        localStorage.removeItem('vantrack_admin_token');
        localStorage.removeItem('vantrack_admin_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const res = await client.post('/auth/login', {
        identifier: email,
        email,
        password,
      });
      if (res.data.success) {
        const { token: jwtToken, user: userData } = res.data.data;
        if (userData.role !== 'admin') {
          throw new Error('Access denied. Administrator privileges required.');
        }
        localStorage.setItem('vantrack_admin_token', jwtToken);
        localStorage.setItem('vantrack_admin_user', JSON.stringify(userData));
        setToken(jwtToken);
        setUser(userData);
        return { success: true };
      }
      throw new Error(res.data.message || 'Login failed');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Login failed';
      return { success: false, message: msg };
    }
  };

  const logout = () => {
    localStorage.removeItem('vantrack_admin_token');
    localStorage.removeItem('vantrack_admin_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
