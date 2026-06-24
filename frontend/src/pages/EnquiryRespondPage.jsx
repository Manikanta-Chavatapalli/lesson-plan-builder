import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import ErrorAlert from '../components/ErrorAlert.jsx';
import { getEnquiryById, updateEnquiryStatus } from '../api/enquiry.api.js';
import { getApiError } from '../services/index.js';

const EnquiryRespondPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [enquiry, setEnquiry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [responseMessage, setResponseMessage] = useState('');

  useEffect(() => {
    const loadEnquiry = async () => {
      try {
        const response = await getEnquiryById(id);
        if (response.data) {
          setEnquiry(response.data);
        } else {
          setError('Enquiry not found');
        }
      } catch (err) {
        setError(getApiError(err).message);
      } finally {
        setLoading(false);
      }
    };
    loadEnquiry();
  }, [id]);

  const handleSendResponse = async (e) => {
    e.preventDefault();
    if (!responseMessage.trim()) {
      setError('Please enter a response message.');
      return;
    }

    try {
      setSubmitting(true);
      await updateEnquiryStatus(id, 'Responded', responseMessage);
      navigate('/enquiries', { state: { message: `Response sent to ${enquiry.parentEmail}` } });
    } catch (err) {
      setError(getApiError(err).message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading enquiry details..." />;

  return (
    <div className="respond-page enquiry-action-page">
      <PageHeader 
        title="Respond to Enquiry" 
        subtitle="Send a response to the parent"
        actions={<button className="btn btn--secondary" onClick={() => navigate('/enquiries')}>Back</button>}
      />
      <ErrorAlert message={error} onDismiss={() => setError('')} />

      {enquiry && (
        <div className="card">
          <div className="enquiry-action-header">
            <h3 className="enquiry-action-title">From: {enquiry.parentName}</h3>
            <p className="text-muted enquiry-action-meta">
              <a href={`mailto:${enquiry.parentEmail}`}>{enquiry.parentEmail}</a>
              <span>•</span>
              {new Date(enquiry.createdAt).toLocaleString()}
            </p>
            <div className="enquiry-action-student-grid">
              <div><strong>Student:</strong> {enquiry.studentName || 'N/A'}</div>
              <div><strong>Class:</strong> {enquiry.studentClass || 'N/A'} - {enquiry.studentSection || 'N/A'}</div>
            </div>
            <div className="enquiry-action-message-box">
              <strong>Original Message:</strong>
              <p className="enquiry-action-message-text">
                {enquiry.message}
              </p>
            </div>
          </div>

          <form onSubmit={handleSendResponse}>
            <div className="form-field enquiry-respond-form-group">
              <label htmlFor="responseMessage">Your Response</label>
              <textarea
                id="responseMessage"
                rows="6"
                placeholder={`Draft your reply to ${enquiry.parentName}...`}
                value={responseMessage}
                onChange={(e) => setResponseMessage(e.target.value)}
                required
              />
              <small className="text-muted enquiry-respond-help">
                This message will be sent directly to {enquiry.parentEmail}
              </small>
            </div>

            <div className="enquiry-action-footer">
              <button 
                type="button" 
                className="btn btn--ghost" 
                onClick={() => navigate('/enquiries')}
                disabled={submitting}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn btn--primary"
                disabled={submitting}
              >
                {submitting ? 'Sending...' : 'Send Response'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default EnquiryRespondPage;
