import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { useTheme } from '../../context/ThemeContext';
import { Sun, Moon, Shield, Lock } from 'lucide-react';

export default function SuperAdminLoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Redirect if already authenticated as super admin
  if (isAuthenticated && user?.role === 'super_admin') {
    navigate('/admin');
    return null;
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const result = await login({
      email: email,
      password: password,
      role: 'super_admin'
    });
    
    setLoading(false);
    
    if (result.success) {
      navigate('/admin');
    } else {
      const errorMsg = typeof result.error === 'string' 
        ? result.error 
        : result.error?.message || result.error?.detail || 'Login failed';
      setError(errorMsg);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%239C92AC%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-30"></div>
      
      <div className="absolute top-4 right-4 flex gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="text-slate-400 hover:text-white"
          data-testid="superadmin-theme-toggle"
        >
          {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>
        <Button 
          variant="ghost" 
          onClick={() => navigate('/')}
          className="text-slate-400 hover:text-white"
        >
          Back to Home
        </Button>
      </div>

      <Card className="w-full max-w-md relative z-10 bg-slate-800 border-slate-700">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-blue-600/20 flex items-center justify-center">
            <Shield className="h-8 w-8 text-blue-500" />
          </div>
          <div className="mb-2">
            <span className="text-3xl font-bold text-blue-500">UNIFY</span>
          </div>
          <CardTitle className="text-2xl text-white">Super Admin Portal</CardTitle>
          <CardDescription className="text-slate-400">
            Authorized personnel only. This access is monitored.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4 bg-red-900/50 border-red-800">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-300">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@unify.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
                data-testid="superadmin-email-input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-300">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
                data-testid="superadmin-password-input"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={loading}
              data-testid="superadmin-login-btn"
            >
              <Lock className="h-4 w-4 mr-2" />
              {loading ? 'Authenticating...' : 'Access Admin Panel'}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-700 text-center">
            <p className="text-xs text-slate-500">
              This is a restricted area. Unauthorized access attempts are logged and may be prosecuted.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
