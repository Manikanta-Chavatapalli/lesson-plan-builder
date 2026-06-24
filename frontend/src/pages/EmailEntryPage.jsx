import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext.jsx';
import FormField from '../components/FormField.jsx';
import ErrorAlert from '../components/ErrorAlert.jsx';
import { getApiError } from '../services/index.js';

const EmailEntryPage = () => {
  const navigate = useNavigate();
  const { requestOtp } = useAppContext();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleContinue = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email');
      return;
    }
    setError('');
    setIsLoading(true);

    try {
      // requestOtp will check if user exists and send email via backend
      await requestOtp({ email });
      
      // Store email in localStorage to use on the OTP entry page
      window.localStorage.setItem('emailForSignIn', email);
      
      navigate('/verify-otp');
    } catch (err) {
      if (err.response?.status === 401 && err.response?.data?.code === 'UNAUTHORIZED') {
        setError('Unauthorized access to the application');
      } else {
        setError(getApiError(err).message || 'Failed to send OTP');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="auth-page-wrapper">
        <h2 className="auth-page-title">
          Welcome to FirstCry Intellitots Portal
        </h2>
        


        <form onSubmit={handleContinue} className="form-grid" noValidate>
          <FormField
            label="Email Address"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
          />
          <p className="text-muted auth-page-help">
            A 6-digit OTP will be sent to your email
          </p>
          <ErrorAlert message={error} onDismiss={() => setError('')} />
          <button type="submit" className="btn btn--primary auth-primary-btn" disabled={isLoading}>
            {isLoading ? 'Sending...' : 'Continue'}
          </button>
        </form>
        
        <div className="auth-divider-section">
          <p className="text-muted auth-divider-text">Are you a parent looking to connect?</p>
          <button 
            type="button" 
            className="btn btn--ghost auth-outline-btn" 
            onClick={() => navigate('/enquiry')}
          >
            Continue as a Parent
          </button>
        </div>
      </div>
    </>
  );
};

export default EmailEntryPage;
