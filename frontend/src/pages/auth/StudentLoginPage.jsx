import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { publicAPI } from '../../lib/api';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { useTheme } from '../../context/ThemeContext';
import { Sun, Moon, GraduationCap } from 'lucide-react';

export default function StudentLoginPage() {
  const navigate = useNavigate();
  const { login, studentRegister, isAuthenticated, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  
  const [universities, setUniversities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Login form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Register form
  const [selectedUniversity, setSelectedUniversity] = useState('');
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPhone, setRegisterPhone] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');

  useEffect(() => {
    if (isAuthenticated && user?.role === 'student') {
      navigate('/student');
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    loadUniversities();
  }, []);

  const loadUniversities = async () => {
    try {
      const response = await publicAPI.listUniversities();
      setUniversities(response.data.data || []);
    } catch (err) {
      console.error('Failed to load universities:', err);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const result = await login({ email: loginEmail, password: loginPassword }, true);
    
    setLoading(false);
    
    if (result.success) {
      navigate('/student');
    } else {
      const errorMsg = typeof result.error === 'string' 
        ? result.error 
        : result.error?.message || 'Login failed';
      setError(errorMsg);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    
    if (!selectedUniversity) {
      setError('Please select a university');
      setLoading(false);
      return;
    }

    const selectedUni = universities.find(u => u.id === selectedUniversity);
    
    const result = await studentRegister({
      name: registerName,
      email: registerEmail,
      phone: registerPhone,
      password: registerPassword
    }, selectedUni?.code);
    
    setLoading(false);
    
    if (result.success) {
      navigate('/student');
    } else {
      const errorMsg = typeof result.error === 'string' 
        ? result.error 
        : result.error?.message || 'Registration failed';
      setError(errorMsg);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
      <div className="absolute top-4 right-4 flex gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          data-testid="student-login-theme-toggle"
        >
          {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>
        <Button variant="ghost" onClick={() => navigate('/')}>
          Back to Home
        </Button>
      </div>

      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <GraduationCap className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <CardTitle className="text-2xl">Student Portal</CardTitle>
          <CardDescription>Login or register to continue your application</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login" data-testid="student-login-tab">Login</TabsTrigger>
              <TabsTrigger value="register" data-testid="student-register-tab">Register</TabsTrigger>
            </TabsList>

            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="mt-4 bg-green-50 text-green-700 border-green-200">
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="loginEmail">Email</Label>
                  <Input
                    id="loginEmail"
                    type="email"
                    placeholder="Enter your email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                    data-testid="student-login-email"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="loginPassword">Password</Label>
                  <Input
                    id="loginPassword"
                    type="password"
                    placeholder="Enter your password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    data-testid="student-login-password"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  disabled={loading}
                  data-testid="student-login-submit"
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="university">Select University</Label>
                  <Select value={selectedUniversity} onValueChange={setSelectedUniversity}>
                    <SelectTrigger id="university" data-testid="register-university-select">
                      <SelectValue placeholder="Choose a university" />
                    </SelectTrigger>
                    <SelectContent>
                      {universities.map((uni) => (
                        <SelectItem key={uni.id} value={uni.id}>
                          {uni.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="registerName">Full Name</Label>
                  <Input
                    id="registerName"
                    placeholder="Enter your full name"
                    value={registerName}
                    onChange={(e) => setRegisterName(e.target.value)}
                    required
                    data-testid="register-name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="registerEmail">Email</Label>
                  <Input
                    id="registerEmail"
                    type="email"
                    placeholder="Enter your email"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    required
                    data-testid="register-email"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="registerPhone">Phone Number</Label>
                  <Input
                    id="registerPhone"
                    type="tel"
                    placeholder="Enter your phone number"
                    value={registerPhone}
                    onChange={(e) => setRegisterPhone(e.target.value)}
                    required
                    data-testid="register-phone"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="registerPassword">Password</Label>
                  <Input
                    id="registerPassword"
                    type="password"
                    placeholder="Create a password"
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    required
                    data-testid="register-password"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  disabled={loading}
                  data-testid="student-register-submit"
                >
                  {loading ? 'Creating Account...' : 'Create Account & Start Application'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              University or Admin?{' '}
              <Button
                variant="link"
                className="p-0 text-blue-600"
                onClick={() => navigate('/login')}
                data-testid="admin-login-link"
              >
                Login here
              </Button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
