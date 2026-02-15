import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { Button } from '../ui/button';
import { Sun, Moon, Menu, X, Shield } from 'lucide-react';
import { useState } from 'react';

export function PublicLayout({ children }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <span className="text-2xl font-bold text-blue-600">UNIFY</span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-6">
              <Link to="/" className="text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors">
                Home
              </Link>
              <Link to="/about" className="text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors">
                About
              </Link>
              <Link to="/features" className="text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors">
                Features
              </Link>
              <Link to="/contact" className="text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors">
                Contact
              </Link>
            </nav>

            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                data-testid="public-theme-toggle"
              >
                {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
              
              <Button
                variant="ghost"
                onClick={() => navigate('/login')}
                className="hidden md:inline-flex"
                data-testid="login-nav-btn"
              >
                University Login
              </Button>
              
              <Button
                onClick={() => navigate('/student/register')}
                className="hidden md:inline-flex bg-blue-600 hover:bg-blue-700 text-white"
                data-testid="apply-now-btn"
              >
                Apply Now
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(true)}
                className="md:hidden"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
          <div className="fixed inset-y-0 right-0 w-64 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 p-4">
            <div className="flex justify-end mb-4">
              <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <nav className="space-y-4">
              <Link to="/" className="block text-sm font-medium text-slate-600 dark:text-slate-400">Home</Link>
              <Link to="/about" className="block text-sm font-medium text-slate-600 dark:text-slate-400">About</Link>
              <Link to="/features" className="block text-sm font-medium text-slate-600 dark:text-slate-400">Features</Link>
              <Link to="/contact" className="block text-sm font-medium text-slate-600 dark:text-slate-400">Contact</Link>
              <hr className="border-slate-200 dark:border-slate-800" />
              <Button variant="outline" className="w-full" onClick={() => navigate('/login')}>University Login</Button>
              <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={() => navigate('/student/register')}>Apply Now</Button>
            </nav>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main>{children}</main>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <span className="text-2xl font-bold text-blue-500">UNIFY</span>
              <p className="mt-4 text-sm text-slate-400">
                Unifying the university admission process into a seamless, intelligent experience.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><Link to="/about" className="hover:text-white transition-colors">About Us</Link></li>
                <li><Link to="/features" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link to="/contact" className="hover:text-white transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">For Universities</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><Link to="/login" className="hover:text-white transition-colors">University Login</Link></li>
                <li><Link to="/contact" className="hover:text-white transition-colors">Get Started</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">For Students</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><Link to="/student/login" className="hover:text-white transition-colors">Student Login</Link></li>
                <li><Link to="/student/register" className="hover:text-white transition-colors">Apply Now</Link></li>
              </ul>
            </div>
          </div>
          
          {/* Footer Bottom with Super Admin Link */}
          <div className="mt-12 pt-8 border-t border-slate-800">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-sm text-slate-400">
                © 2024 UNIFY. All rights reserved.
              </p>
              <div className="flex items-center gap-4">
                <Link 
                  to="/super-admin-login" 
                  className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-300 transition-colors"
                  data-testid="superadmin-login-link"
                >
                  <Shield className="h-3 w-3" />
                  Super Admin Access
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
