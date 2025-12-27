import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      const savedUser = localStorage.getItem('user');
      const token = localStorage.getItem('authToken');

      if (token && savedUser) {
        setUser(JSON.parse(savedUser));
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const register = async (tenantName, subdomain, adminEmail, adminPassword, adminFullName) => {
    try {
      setError(null);
      const response = await authService.registerTenant({
        tenantName,
        subdomain,
        adminEmail,
        adminPassword,
        adminFullName,
      });
      return response.data;
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed';
      setError(message);
      throw err;
    }
  };

  const login = async (email, password, tenantSubdomain) => {
    try {
      setError(null);
      // Only include tenantSubdomain if provided (supports super admin login)
      const payload = { email, password };
      if (tenantSubdomain && tenantSubdomain.trim()) {
        payload.tenantSubdomain = tenantSubdomain.trim();
      }
      const response = await authService.login(payload);

      const { user: userData, token } = response.data.data;
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      return userData;
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed';
      setError(message);
      throw err;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      setUser(null);
    }
  };

  const refreshUser = async () => {
    try {
      const response = await authService.getCurrentUser();
      const userData = response.data.data;
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      return userData;
    } catch (err) {
      console.error('Error refreshing user:', err);
      // If token is invalid, logout
      if (err.response?.status === 401) {
        logout();
      }
      throw err;
    }
  };

  const value = {
    user,
    loading,
    error,
    register,
    login,
    logout,
    refreshUser,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
