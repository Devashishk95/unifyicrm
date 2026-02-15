import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  LayoutDashboard, Building2, CreditCard, BarChart3, Settings,
  Users, GraduationCap, FileText, Calendar, BookOpen, ClipboardList,
  UserCog, Menu, X, Sun, Moon, LogOut, ChevronDown, Key, MessageCircle
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { toast } from 'sonner';
import axios from 'axios';

const superAdminMenu = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
  { icon: Building2, label: 'Universities', path: '/admin/universities' },
  { icon: CreditCard, label: 'Payments', path: '/admin/payments' },
  { icon: BarChart3, label: 'Analytics', path: '/admin/analytics' },
  { icon: Settings, label: 'System', path: '/admin/system' },
];

const universityAdminMenu = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/university' },
  { icon: Building2, label: 'Departments', path: '/university/departments' },
  { icon: BookOpen, label: 'Courses', path: '/university/courses' },
  { icon: Calendar, label: 'Sessions', path: '/university/sessions' },
  { icon: Users, label: 'Staff', path: '/university/staff' },
  { icon: ClipboardList, label: 'Registration Config', path: '/university/registration-config' },
  { icon: FileText, label: 'Question Bank', path: '/university/questions' },
  { icon: CreditCard, label: 'Payments', path: '/university/payments' },
  { icon: Settings, label: 'Settings', path: '/university/settings' },
];

const counsellingManagerMenu = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/counselling' },
  { icon: Users, label: 'All Leads', path: '/counselling/leads' },
  { icon: BarChart3, label: 'Lead Analytics', path: '/counselling/analytics' },
  { icon: UserCog, label: 'Team Performance', path: '/counselling/team' },
  { icon: MessageCircle, label: 'Student Queries', path: '/counselling/queries' },
];

const counsellorMenu = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/counsellor' },
  { icon: Users, label: 'My Leads', path: '/counsellor/leads' },
  { icon: Calendar, label: 'Follow-ups', path: '/counsellor/follow-ups' },
  { icon: MessageCircle, label: 'Student Queries', path: '/counsellor/queries' },
];

export function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const { user, logout, token, isSuperAdmin, isUniversityAdmin, isCounsellingManager, isCounsellor } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const API = process.env.REACT_APP_BACKEND_URL;

  let menuItems = [];
  if (isSuperAdmin) menuItems = superAdminMenu;
  else if (isUniversityAdmin) menuItems = universityAdminMenu;
  else if (isCounsellingManager) menuItems = counsellingManagerMenu;
  else if (isCounsellor) menuItems = counsellorMenu;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setPasswordLoading(true);
    try {
      await axios.put(
        `${API}/api/auth/change-password`,
        {
          current_password: passwordForm.currentPassword,
          new_password: passwordForm.newPassword
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Password changed successfully');
      setChangePasswordOpen(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      const errorMsg = error.response?.data?.detail || 'Failed to change password';
      toast.error(errorMsg);
    } finally {
      setPasswordLoading(false);
    }
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-slate-200 dark:border-slate-800">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-2xl font-bold text-blue-600">UNIFY</span>
        </Link>
      </div>
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                }`}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>
      <div className="p-4 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3 px-3 py-2 text-sm">
          <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium">
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-slate-900 dark:text-white truncate">{user?.name}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate capitalize">{user?.role?.replace('_', ' ')}</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Desktop Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 hidden lg:block ${
          sidebarOpen ? 'w-64' : 'w-20'
        }`}
      >
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
          <aside className="fixed inset-y-0 left-0 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'}`}>
        {/* Top Bar */}
        <header className="sticky top-0 z-40 h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between h-full px-4 lg:px-6">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden"
                data-testid="mobile-menu-btn"
              >
                <Menu className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="hidden lg:flex"
                data-testid="sidebar-toggle-btn"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                data-testid="theme-toggle-btn"
              >
                {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2" data-testid="user-menu-btn">
                    <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium">
                      {user?.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5">
                    <p className="font-medium">{user?.name}</p>
                    <p className="text-sm text-slate-500">{user?.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setChangePasswordOpen(true)} data-testid="change-password-btn">
                    <Key className="h-4 w-4 mr-2" />
                    Change Password
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} data-testid="logout-btn">
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-6">
          {children}
        </main>
      </div>

      {/* Change Password Dialog */}
      <Dialog open={changePasswordOpen} onOpenChange={setChangePasswordOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Enter your current password and choose a new password.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <Input
                id="current-password"
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                placeholder="Enter current password"
                data-testid="current-password-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                placeholder="Enter new password (min 8 characters)"
                data-testid="new-password-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                placeholder="Confirm new password"
                data-testid="confirm-password-input"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setChangePasswordOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleChangePassword} 
              disabled={passwordLoading}
              className="bg-blue-600 hover:bg-blue-700"
              data-testid="submit-password-change"
            >
              {passwordLoading ? 'Changing...' : 'Change Password'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
