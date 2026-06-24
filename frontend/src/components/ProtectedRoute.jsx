import { Navigate, useLocation } from 'react-router-dom';
import { useAppContext } from '../context/AppContext.jsx';
import LoadingSpinner from './LoadingSpinner.jsx';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isAuthLoading } = useAppContext();
  const location = useLocation();

  if (isAuthLoading) {
    return <LoadingSpinner message="Checking authentication..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;
