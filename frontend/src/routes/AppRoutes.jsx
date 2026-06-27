import { Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from '../layouts/AppLayout.jsx';
import AuthLayout from '../layouts/AuthLayout.jsx';
import ProtectedRoute from '../components/ProtectedRoute.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import ScrollToTop from '../components/ScrollToTop.jsx';

import EmailEntryPage from '../pages/EmailEntryPage.jsx';
import VerifyOtpPage from '../pages/VerifyOtpPage.jsx';
import AccessDeniedPage from '../pages/AccessDeniedPage.jsx';
import AdminDashboard from '../pages/AdminDashboard.jsx';
import OverviewPage from '../pages/OverviewPage.jsx';

import DashboardPage from '../pages/DashboardPage.jsx';
import LessonPlansPage from '../pages/LessonPlansPage.jsx';
import LessonDetailPage from '../pages/LessonDetailPage.jsx';
import HistoryPage from '../pages/HistoryPage.jsx';
import EnquiriesPage from '../pages/EnquiriesPage.jsx';
import EnquiryRespondPage from '../pages/EnquiryRespondPage.jsx';
import EnquiryVerifyPage from '../pages/EnquiryVerifyPage.jsx';
import AlertsPage from '../pages/AlertsPage.jsx';
import ParentEnquiryPage from '../pages/ParentEnquiryPage.jsx';
import CounsellorDashboardPage from '../pages/CounsellorDashboardPage.jsx';
import { useAppContext } from '../context/AppContext.jsx';

const PublicOnlyRoute = ({ children }) => {
  const { isAuthenticated, isAuthLoading, user } = useAppContext();

  if (isAuthLoading) return <LoadingSpinner message="Loading..." />;
  if (isAuthenticated) {
    if (user?.role === 'admin') return <Navigate to="/admin" replace />;
    if (user?.role === 'head') return <Navigate to="/overview" replace />;
    if (user?.role === 'counsellor') return <Navigate to="/counsellor/teacher-data" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Role-based protection
const RoleRoute = ({ children, allowedRoles }) => {
  const { user } = useAppContext();
  
  if (!user || !allowedRoles.includes(user.role)) {
    if (user) {
      if (user.role === 'admin') return <Navigate to="/admin" replace />;
      if (user.role === 'head') return <Navigate to="/overview" replace />;
      if (user.role === 'counsellor') return <Navigate to="/counsellor/teacher-data" replace />;
      return <Navigate to="/dashboard" replace />;
    }
    return <Navigate to="/" replace />;
  }
  
  return children;
};

const AppRoutes = () => (
  <>
  <ScrollToTop />
  <Routes>
    <Route element={<AuthLayout />}>
      <Route 
        path="/" 
        element={
          <PublicOnlyRoute>
            <EmailEntryPage />
          </PublicOnlyRoute>
        } 
      />
      <Route path="/verify-otp" element={<PublicOnlyRoute><VerifyOtpPage /></PublicOnlyRoute>} />
      <Route path="/access-denied" element={<AccessDeniedPage />} />
    </Route>

    <Route path="/enquiry" element={<ParentEnquiryPage />} />

    <Route
      path="/"
      element={
        <ProtectedRoute>
          <AppLayout />
        </ProtectedRoute>
      }
    >
      <Route path="dashboard" element={
        <RoleRoute allowedRoles={['teacher']}>
          <DashboardPage />
        </RoleRoute>
      } />
      <Route path="admin" element={
        <RoleRoute allowedRoles={['admin']}>
          <AdminDashboard />
        </RoleRoute>
      } />
      <Route path="overview" element={
        <RoleRoute allowedRoles={['head']}>
          <OverviewPage />
        </RoleRoute>
      } />
      <Route path="counsellor/teacher-data" element={
        <RoleRoute allowedRoles={['counsellor']}>
          <CounsellorDashboardPage />
        </RoleRoute>
      } />
      <Route path="counsellor/enquiries" element={
        <RoleRoute allowedRoles={['counsellor']}>
          <CounsellorDashboardPage />
        </RoleRoute>
      } />
      <Route path="counsellor/alerts" element={
        <RoleRoute allowedRoles={['counsellor']}>
          <CounsellorDashboardPage />
        </RoleRoute>
      } />
      
      {/* Other teacher routes */}
      <Route path="lesson-plans" element={<RoleRoute allowedRoles={['teacher']}><LessonPlansPage /></RoleRoute>} />
      <Route path="lesson-plans/:id" element={<RoleRoute allowedRoles={['teacher']}><LessonDetailPage /></RoleRoute>} />
      <Route path="history" element={<RoleRoute allowedRoles={['teacher', 'admin', 'counsellor', 'head']}><HistoryPage /></RoleRoute>} />
      <Route path="enquiries" element={<RoleRoute allowedRoles={['teacher', 'admin']}><EnquiriesPage /></RoleRoute>} />
      <Route path="enquiries/:id/verify" element={<RoleRoute allowedRoles={['teacher', 'admin']}><EnquiryVerifyPage /></RoleRoute>} />
      <Route path="enquiries/:id/respond" element={<RoleRoute allowedRoles={['teacher', 'admin']}><EnquiryRespondPage /></RoleRoute>} />
      <Route path="alerts" element={<RoleRoute allowedRoles={['teacher', 'admin', 'head']}><AlertsPage /></RoleRoute>} />
    </Route>

    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
  </>
);

export default AppRoutes;
