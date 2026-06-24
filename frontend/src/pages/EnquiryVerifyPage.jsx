import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import ErrorAlert from '../components/ErrorAlert.jsx';
import { getEnquiries, updateEnquiryStatus, rejectEnquiry } from '../api/enquiry.api.js';
import { getApiError } from '../services/index.js';

const EnquiryVerifyPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [enquiry, setEnquiry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const response = await getEnquiries();
        const found = (Array.isArray(response.data) ? response.data : []).find(e => e.id === id);
        if (found) {
          setEnquiry(found);
        } else {
          setError('Enquiry not found or you do not have permission to view it.');
        }
      } catch (err) {
        setError(getApiError(err).message);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleAccept = async () => {
    setActionLoading(true);
    setError('');
    try {
      await updateEnquiryStatus(id, 'Pending');
      navigate('/enquiries');
    } catch (err) {
      setError(getApiError(err).message);
      setActionLoading(false);
    }
  };

  const handleDecline = async () => {
    if (!window.confirm('Are you sure you want to decline this enquiry? An email will be sent to the parent, and the enquiry will be deleted.')) return;
    
    setActionLoading(true);
    setError('');
    try {
      await rejectEnquiry(id);
      navigate('/enquiries');
    } catch (err) {
      setError(getApiError(err).message);
      setActionLoading(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading enquiry details..." />;

  return (
    <div>
      <PageHeader 
        title="Review Enquiry" 
        subtitle="Verify if this is a genuine enquiry before adding to your enquiries tab" 
      />
      <ErrorAlert message={error} onDismiss={() => setError('')} />

      {enquiry && (
        <div className="auth-card enquiry-verify-card">
          <div className="enquiry-verify-padding">
            <h3 className="enquiry-action-title">From: {enquiry.parentName}</h3>
            <p className="text-muted enquiry-action-meta">
              <a href={`mailto:${enquiry.parentEmail}`}>{enquiry.parentEmail}</a>
              <span>•</span>
              {new Date(enquiry.createdAt).toLocaleString()}
            </p>
            
            <div className="enquiry-verify-student-grid">
              <div><strong className="enquiry-student-label">Student Name:</strong><br />{enquiry.studentName || 'N/A'}</div>
              <div><strong className="enquiry-student-label">Class & Section:</strong><br />{enquiry.studentClass || 'N/A'} - {enquiry.studentSection || 'N/A'}</div>
            </div>
            
            <div className="enquiry-verify-message-box">
              <strong className="enquiry-verify-message-label">Message:</strong>
              <p className="enquiry-verify-message-text">
                {enquiry.message}
              </p>
            </div>
            
            <div className="enquiry-verify-footer">
              <button 
                className="btn btn--primary enquiry-verify-btn" 
                onClick={handleAccept}
                disabled={actionLoading}
              >
                {actionLoading ? 'Processing...' : 'Accept to Enquiry Tab'}
              </button>
              <button 
                className="btn btn--secondary enquiry-verify-btn enquiry-verify-btn-danger" 
                onClick={handleDecline}
                disabled={actionLoading}
              >
                {actionLoading ? 'Processing...' : 'Decline & Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnquiryVerifyPage;
