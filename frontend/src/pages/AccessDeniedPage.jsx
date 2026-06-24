import { Link } from 'react-router-dom';

const AccessDeniedPage = () => {
  return (
    <div className="auth-page">
      <div className="auth-card auth-card-access-denied">
        <h1 className="access-denied-title">Access Denied</h1>
        <p className="text-muted access-denied-text">
          You do not have permission to access this page.
        </p>
        <Link to="/" className="btn btn--primary">
          Return to Login
        </Link>
      </div>
    </div>
  );
};

export default AccessDeniedPage;
