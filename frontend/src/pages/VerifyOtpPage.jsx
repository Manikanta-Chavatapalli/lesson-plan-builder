import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext.jsx';
import FormField from '../components/FormField.jsx';
import ErrorAlert from '../components/ErrorAlert.jsx';
import { getApiError } from '../services/index.js';

const VerifyOtpPage = () => {
  const navigate = useNavigate();
  const { verifyOtp, requestOtp } = useAppContext();
  
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const savedEmail = window.localStorage.getItem('emailForSignIn');
    if (!savedEmail) {
      navigate('/');
    } else {
      setEmail(savedEmail);
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      await verifyOtp({ email, otp });
    } catch (err) {
      setError(getApiError(err).message || 'Invalid OTP');
      setOtp('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setMessage('');
    setIsResending(true);
    try {
      await requestOtp({ email });
      setMessage('A new OTP has been sent to your email.');
    } catch (err) {
      setError(getApiError(err).message || 'Failed to resend OTP');
    } finally {
      setIsResending(false);
    }
  };

  if (!email) return null;

  return (
    <>
      <div className="auth-header-wrap">
        <h2 className="auth-page-title">
          Verify OTP
        </h2>
        
        <p className="text-muted auth-page-subtitle">
          We've sent a 6-digit code to <strong>{email}</strong>
        </p>



        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <FormField
            label="Enter 6-digit OTP"
            name="otp"
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="123456"
            required
            autoComplete="one-time-code"
          />
          <ErrorAlert message={error} onDismiss={() => setError('')} />
          {message && <div className="alert alert-success">{message}</div>}
          <button 
            type="submit" 
            className="btn btn--primary auth-primary-btn" 
            disabled={isLoading || otp.length !== 6}
            aria-label="Verify OTP and Login"
          >
            {isLoading ? 'Verifying...' : 'Verify & Login'}
          </button>
        </form>

        <div className="auth-form-actions">
          <button 
            type="button" 
            onClick={handleResend} 
            className="btn btn--secondary auth-secondary-btn" 
            disabled={isResending}
          >
            {isResending ? 'Sending...' : 'Resend OTP'}
          </button>
        </div>
        
        <div className="auth-text-center">
          <a href="/" className="auth-link-text">
            Use a different email
          </a>
        </div>
      </div>
    </>
  );
};

export default VerifyOtpPage;
