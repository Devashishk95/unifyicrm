import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { publicAPI } from '../../lib/api';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { useTheme } from '../../context/ThemeContext';
import { Sun, Moon, Building2 } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  
  const [universities, setUniversities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // University Staff form
  const [selectedUniversity, setSelectedUniversity] = useState('');
  const [staffRole, setStaffRole] = useState('');
  const [personId, setPersonId] = useState('');
  const [staffPassword, setStaffPassword] = useState('');

  useEffect(() => {
    if (isAuthenticated && user) {
      redirectBasedOnRole(user.role);
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

  const redirectBasedOnRole = (role) => {
    switch (role) {
      case 'super_admin':
        navigate('/admin');
        break;
      case 'university_admin':
        navigate('/university');
        break;
      case 'counselling_manager':
        navigate('/counselling');
        break;
      case 'counsellor':
        navigate('/counsellor');
        break;
      default:
        navigate('/');
    }
  };

  const handleUniversityLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    if (!selectedUniversity || !staffRole || !personId || !staffPassword) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }
    
    const result = await login({
      university_id: selectedUniversity,
      role: staffRole,
      person_id: personId,
      password: staffPassword
    });
    
    setLoading(false);
    
    if (result.success) {
      redirectBasedOnRole(result.user.role);
    } else {
      const errorMsg = typeof result.error === 'string' 
        ? result.error 
        : result.error?.message || result.error?.detail || 'Login failed';
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
          data-testid="login-theme-toggle"
        >
          {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>
        <Button variant="ghost" onClick={() => navigate('/')}>
          Back to Home
        </Button>
      </div>

      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <Building2 className="h-7 w-7 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="mb-2">
            <span className="text-3xl font-bold text-blue-600">UNIFY</span>
          </div>
          <CardTitle className="text-2xl">University Portal</CardTitle>
          <CardDescription>Sign in to access your university dashboard</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleUniversityLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="university">University</Label>
              <Select value={selectedUniversity} onValueChange={setSelectedUniversity}>
                <SelectTrigger id="university" data-testid="university-select">
                  <SelectValue placeholder="Select University" />
                </SelectTrigger>
                <SelectContent>
                  {universities.map((uni) => (
                    <SelectItem key={uni.id} value={uni.id}>
                      {uni.name} ({uni.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Login As</Label>
              <Select value={staffRole} onValueChange={setStaffRole}>
                <SelectTrigger id="role" data-testid="role-select">
                  <SelectValue placeholder="Select Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="university_admin">University Admin</SelectItem>
                  <SelectItem value="counselling_manager">Counselling Manager</SelectItem>
                  <SelectItem value="counsellor">Counsellor</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="personId">Person ID</Label>
              <Input
                id="personId"
                placeholder="Enter your Person ID"
                value={personId}
                onChange={(e) => setPersonId(e.target.value)}
                data-testid="person-id-input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="staffPassword">Password</Label>
              <Input
                id="staffPassword"
                type="password"
                placeholder="Enter your password"
                value={staffPassword}
                onChange={(e) => setStaffPassword(e.target.value)}
                data-testid="staff-password-input"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={loading}
              data-testid="university-login-btn"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6 text-center space-y-2">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Are you a student?{' '}
              <Button
                variant="link"
                className="p-0 text-blue-600"
                onClick={() => navigate('/student/login')}
                data-testid="student-login-link"
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
