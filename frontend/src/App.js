import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Toaster } from "./components/ui/sonner";

// Public Pages
import LandingPage from "./pages/public/LandingPage";
import AboutPage from "./pages/public/AboutPage";
import FeaturesPage from "./pages/public/FeaturesPage";
import ContactPage from "./pages/public/ContactPage";
import LoginPage from "./pages/auth/LoginPage";
import StudentLoginPage from "./pages/auth/StudentLoginPage";
import SuperAdminLoginPage from "./pages/auth/SuperAdminLoginPage";

// Admin Pages
import SuperAdminDashboard from "./pages/admin/SuperAdminDashboard";
import UniversitiesPage from "./pages/admin/UniversitiesPage";
import PaymentsPage from "./pages/admin/PaymentsPage";
import AnalyticsPage from "./pages/admin/AnalyticsPage";
import SystemPage from "./pages/admin/SystemPage";

// University Pages
import UniversityDashboard from "./pages/university/UniversityDashboard";
import RegistrationConfigPage from "./pages/university/RegistrationConfigPage";
import StaffManagementPage from "./pages/university/StaffManagementPage";
import DepartmentsPage from "./pages/university/DepartmentsPage";
import CoursesPage from "./pages/university/CoursesPage";
import SessionsPage from "./pages/university/SessionsPage";
import QuestionBankPage from "./pages/university/QuestionBankPage";
import UniversityPaymentsPage from "./pages/university/UniversityPaymentsPage";
import UniversitySettingsPage from "./pages/university/UniversitySettingsPage";

// Counselling Pages
import LeadsPage from "./pages/counselling/LeadsPage";
import LeadDetailsPage from "./pages/counselling/LeadDetailsPage";
import CounsellingManagerDashboard from "./pages/counselling/CounsellingManagerDashboard";
import TeamManagementPage from "./pages/counselling/TeamManagementPage";
import CounsellorDashboard from "./pages/counselling/CounsellorDashboard";
import CounsellorQueriesPage from "./pages/counselling/CounsellorQueriesPage";
import LeadAnalyticsPage from "./pages/counselling/LeadAnalyticsPage";

// Student Pages
import StudentDashboard from "./pages/student/StudentDashboard";
import StudentApplicationPage from "./pages/student/StudentApplicationPage";
import StudentTestPage from "./pages/student/StudentTestPage";
import InstitutionPage from "./pages/student/InstitutionPage";
import StudentQueriesPage from "./pages/student/StudentQueriesPage";
import StudentDocumentsPage from "./pages/student/StudentDocumentsPage";
import StudentPaymentPage from "./pages/student/StudentPaymentPage";

// Protected Route Component
function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    // Redirect to appropriate dashboard based on role
    switch (user?.role) {
      case 'super_admin':
        return <Navigate to="/admin" replace />;
      case 'university_admin':
        return <Navigate to="/university" replace />;
      case 'counselling_manager':
        return <Navigate to="/counselling" replace />;
      case 'counsellor':
        return <Navigate to="/counsellor" replace />;
      case 'student':
        return <Navigate to="/student" replace />;
      default:
        return <Navigate to="/" replace />;
    }
  }

  return children;
}

// Placeholder components for routes not yet implemented
const PlaceholderPage = ({ title }) => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
    <div className="text-center">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{title}</h1>
      <p className="text-slate-600 dark:text-slate-400">This page is under development</p>
    </div>
  </div>
);

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/features" element={<FeaturesPage />} />
      <Route path="/contact" element={<ContactPage />} />
      
      {/* Auth Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/super-admin-login" element={<SuperAdminLoginPage />} />
      <Route path="/student/login" element={<StudentLoginPage />} />
      <Route path="/student/register" element={<StudentLoginPage />} />
      
      {/* Super Admin Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <SuperAdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/universities"
        element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <UniversitiesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/payments"
        element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <PaymentsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/analytics"
        element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <AnalyticsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/system"
        element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <SystemPage />
          </ProtectedRoute>
        }
      />
      
      {/* University Admin Routes */}
      <Route
        path="/university"
        element={
          <ProtectedRoute allowedRoles={['university_admin']}>
            <UniversityDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/university/departments"
        element={
          <ProtectedRoute allowedRoles={['university_admin']}>
            <DepartmentsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/university/courses"
        element={
          <ProtectedRoute allowedRoles={['university_admin']}>
            <CoursesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/university/sessions"
        element={
          <ProtectedRoute allowedRoles={['university_admin']}>
            <SessionsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/university/staff"
        element={
          <ProtectedRoute allowedRoles={['university_admin']}>
            <StaffManagementPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/university/registration-config"
        element={
          <ProtectedRoute allowedRoles={['university_admin']}>
            <RegistrationConfigPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/university/questions"
        element={
          <ProtectedRoute allowedRoles={['university_admin']}>
            <QuestionBankPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/university/payments"
        element={
          <ProtectedRoute allowedRoles={['university_admin']}>
            <UniversityPaymentsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/university/settings"
        element={
          <ProtectedRoute allowedRoles={['university_admin']}>
            <UniversitySettingsPage />
          </ProtectedRoute>
        }
      />
      
      {/* Counselling Manager Routes */}
      <Route
        path="/counselling"
        element={
          <ProtectedRoute allowedRoles={['counselling_manager']}>
            <CounsellingManagerDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/counselling/leads"
        element={
          <ProtectedRoute allowedRoles={['counselling_manager', 'university_admin']}>
            <LeadsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/counselling/leads/:leadId"
        element={
          <ProtectedRoute allowedRoles={['counselling_manager', 'university_admin', 'counsellor']}>
            <LeadDetailsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/counselling/team"
        element={
          <ProtectedRoute allowedRoles={['counselling_manager']}>
            <TeamManagementPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/counselling/queries"
        element={
          <ProtectedRoute allowedRoles={['counselling_manager', 'counsellor']}>
            <CounsellorQueriesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/counselling/analytics"
        element={
          <ProtectedRoute allowedRoles={['counselling_manager', 'university_admin']}>
            <LeadAnalyticsPage />
          </ProtectedRoute>
        }
      />
      
      {/* Counsellor Routes */}
      <Route
        path="/counsellor"
        element={
          <ProtectedRoute allowedRoles={['counsellor']}>
            <CounsellorDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/counsellor/leads"
        element={
          <ProtectedRoute allowedRoles={['counsellor']}>
            <LeadsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/counsellor/follow-ups"
        element={
          <ProtectedRoute allowedRoles={['counsellor']}>
            <LeadsPage filterFollowUps={true} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/counsellor/queries"
        element={
          <ProtectedRoute allowedRoles={['counsellor']}>
            <CounsellorQueriesPage />
          </ProtectedRoute>
        }
      />
      
      {/* Student Routes */}
      <Route
        path="/student"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <StudentDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/application"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <StudentApplicationPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/documents"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <StudentDocumentsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/test"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <StudentTestPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/payment"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <StudentPaymentPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/institution"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <InstitutionPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/queries"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <StudentQueriesPage />
          </ProtectedRoute>
        }
      />
      
      {/* Catch all - redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="unify-theme">
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
          <Toaster position="top-right" richColors />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
