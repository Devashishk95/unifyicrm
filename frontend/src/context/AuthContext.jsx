import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('unify-token');
    const savedUser = localStorage.getItem('unify-user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
      axios.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
    }
    setLoading(false);
  }, []);

  const login = async (loginData, isStudentLogin = false) => {
    try {
      const endpoint = isStudentLogin ? '/auth/student/login' : '/auth/login';
      const response = await axios.post(`${API}${endpoint}`, loginData);
      const { access_token, user: userData } = response.data;
      
      setToken(access_token);
      setUser(userData);
      localStorage.setItem('unify-token', access_token);
      localStorage.setItem('unify-user', JSON.stringify(userData));
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      
      return { success: true, user: userData };
    } catch (error) {
      // Extract error message properly
      let errorMessage = 'Login failed';
      if (error.response?.data?.detail) {
        errorMessage = typeof error.response.data.detail === 'string' 
          ? error.response.data.detail 
          : JSON.stringify(error.response.data.detail);
      } else if (error.message) {
        errorMessage = error.message;
      }
      return { 
        success: false, 
        error: errorMessage 
      };
    }
  };

  const studentRegister = async (registrationData, universityCode) => {
    try {
      const response = await axios.post(`${API}/student/register`, {
		  registration_data: registrationData,
		  university_code: universityCode
		});

      const { access_token, user: userData, application_id } = response.data;
      
      setToken(access_token);
      setUser(userData);
      localStorage.setItem('unify-token', access_token);
      localStorage.setItem('unify-user', JSON.stringify(userData));
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      
      return { success: true, user: userData, application_id };
    } catch (error) {
      // Extract error message properly
      let errorMessage = 'Registration failed';
      if (error.response?.data?.detail) {
        errorMessage = typeof error.response.data.detail === 'string' 
          ? error.response.data.detail 
          : JSON.stringify(error.response.data.detail);
      } else if (error.message) {
        errorMessage = error.message;
      }
      return { 
        success: false, 
        error: errorMessage 
      };
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('unify-token');
    localStorage.removeItem('unify-user');
    delete axios.defaults.headers.common['Authorization'];
  };

  const isAuthenticated = !!token;
  const isSuperAdmin = user?.role === 'super_admin';
  const isUniversityAdmin = user?.role === 'university_admin';
  const isCounsellingManager = user?.role === 'counselling_manager';
  const isCounsellor = user?.role === 'counsellor';
  const isStudent = user?.role === 'student';

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      login,
      logout,
      studentRegister,
      isAuthenticated,
      isSuperAdmin,
      isUniversityAdmin,
      isCounsellingManager,
      isCounsellor,
      isStudent,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
