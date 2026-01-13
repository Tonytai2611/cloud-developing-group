import { useState, useEffect, createContext, useContext } from 'react';
import { useNavigate } from 'react-router-dom';

// API Gateway URL from environment
const API_URL = process.env.VITE_API_GATEWAY_URL || 'https://4jawv6e5e1.execute-api.us-east-1.amazonaws.com';

// Auth Context
const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accessToken, setAccessToken] = useState(localStorage.getItem('accessToken'));

  // Get auth headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem('accessToken');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  };

  // Login function
  const login = async (username, password) => {
    try {
      const response = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Login failed');
      }

      const data = await response.json();

      // Save tokens to localStorage
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('idToken', data.idToken);
      localStorage.setItem('refreshToken', data.refreshToken);

      // Update state
      setAccessToken(data.accessToken);
      setUser(data.userInfo);

      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (token) {
        await fetch(`${API_URL}/api/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear tokens
      localStorage.removeItem('accessToken');
      localStorage.removeItem('idToken');
      localStorage.removeItem('refreshToken');
      setAccessToken(null);
      setUser(null);
    }
  };

  // Get current user info
  const getUserInfo = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setUser(null);
        setLoading(false);
        return null;
      }

      const response = await fetch(`${API_URL}/api/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        // Token expired or invalid
        if (response.status === 401) {
          await logout();
        }
        throw new Error('Failed to get user info');
      }

      const data = await response.json();
      setUser(data.userInfo);
      return data.userInfo;
    } catch (error) {
      console.error('Get user info error:', error);
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Check authentication on mount
  useEffect(() => {
    getUserInfo();
  }, []);

  const value = {
    user,
    loading,
    accessToken,
    login,
    logout,
    getUserInfo,
    getAuthHeaders,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin' || user?.isAdmin
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook for protected routes
export const useRequireAuth = (redirectTo = '/') => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate(redirectTo);
    }
  }, [user, loading, navigate, redirectTo]);

  return { user, loading };
};

// Hook for admin routes
export const useRequireAdmin = (redirectTo = '/') => {
  const { user, loading, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate(redirectTo);
    }
  }, [user, loading, isAdmin, navigate, redirectTo]);

  return { user, loading, isAdmin };
};

export default useAuth;
