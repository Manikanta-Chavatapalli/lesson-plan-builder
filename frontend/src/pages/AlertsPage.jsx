import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import ErrorAlert from '../components/ErrorAlert.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { getAlerts, acknowledgeAlert, sessionDismissedAlerts, hasOpenedAlertsPage, setOpenedAlertsPage, cancelOpenedAlertsPage } from '../api/alert.api.js';
import { updateEnquiryStatus, deleteEnquiry } from '../api/enquiry.api.js';
import { getApiError } from '../services/index.js';
import EnquiryViewModal from '../components/EnquiryViewModal.jsx';

const AlertsPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [deletingIds, setDeletingIds] = useState([]);
  // student written: keep track of which alerts are being accepted right now
  const [processingIds, setProcessingIds] = useState([]);

  const loadAlerts = async () => {
    try {
      const response = await getAlerts();
      const allAlerts = Array.isArray(response.data) ? response.data : [];
      setItems(allAlerts.filter(a => {
        if (sessionDismissedAlerts.has(a.id)) return false;
        // If it's not a new enquiry and we've already navigated away from the alerts page once this session, hide it
        if (!a.id.startsWith('alert-new-enq-') && hasOpenedAlertsPage) return false;
        return true;
      }));
    } catch (err) {
      setError(getApiError(err).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    cancelOpenedAlertsPage(); // In strict mode remount, this cancels the unmount timer
    loadAlerts();
    
    // Listen for Server-Sent Events to update instantly instead of polling every 10 seconds
    const API_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
    const eventSource = new EventSource(`${API_URL}/api/stream`);
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'NEW_ALERT' && mounted) {
          loadAlerts();
        }
      } catch (e) {
        console.error('Failed to parse SSE', e);
      }
    };

    return () => {
      mounted = false;
      eventSource.close();
      setOpenedAlertsPage(true); // Mark that user has visited and left the alerts tab
    };
  }, []);

  const handleAcceptAlert = async (alertId) => {
    // student written: block double clicks by adding id to processing list
    setProcessingIds(prev => [...prev, alertId]);
    try {
      if (alertId.startsWith('alert-new-enq-')) {
        const enqId = alertId.replace('alert-new-enq-', '');
        await updateEnquiryStatus(enqId, 'Pending');
        sessionDismissedAlerts.add(alertId);
      } else {
        await acknowledgeAlert(alertId);
      }
      setItems(prev => prev.filter(a => a.id !== alertId));
    } catch (err) {
      setError(getApiError(err).message);
    } finally {
      // student written: remove id from processing list when done
      setProcessingIds(prev => prev.filter(id => id !== alertId));
    }
  };

  const handleDeleteAlert = async (alertId) => {
    if (!window.confirm('Are you sure you want to completely delete this enquiry/alert?')) return;
    setDeletingIds(prev => [...prev, alertId]);
    try {
      if (alertId.startsWith('alert-new-enq-')) {
        const enqId = alertId.replace('alert-new-enq-', '');
        await deleteEnquiry(enqId);
        sessionDismissedAlerts.add(alertId);
      } else {
        await acknowledgeAlert(alertId);
      }
      setItems(prev => prev.filter(a => a.id !== alertId));
      if (selectedAlert && selectedAlert.id === alertId) {
        setSelectedAlert(null);
      }
    } catch (err) {
      setError(getApiError(err).message);
    } finally {
      setDeletingIds(prev => prev.filter(deleteId => deleteId !== alertId));
    }
  };

  if (loading) return <LoadingSpinner message="Loading alerts..." />;

  const getAlertClass = (type) => {
    if (type === 'warning') return 'alert-card--warning';
    if (type === 'success') return 'alert-card--success';
    return 'alert-card--primary';
  };

  return (
    <div>
      <PageHeader title="Alerts" subtitle="System and operational alerts" />
      <ErrorAlert message={error} onDismiss={() => setError('')} />
      {items.length === 0 ? (
        <div className="empty-state alert-empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="alert-empty-icon">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
          <h3 className="alert-empty-title">No new alerts</h3>
          <p className="alert-empty-text">You're all caught up!</p>
        </div>
      ) : (
        <div className="card-grid">
          {items.map((item) => (
            <article key={item.id} className={`alert-card ${getAlertClass(item.type)}`}>
              <div className="alert-card-layout">
                <div className="alert-card-content">
                  <h3 className="alert-card-title">{item.message || item.id}</h3>
                  {item.timestamp && (
                    <p className="text-muted alert-card-timestamp">
                      {new Date(item.timestamp).toLocaleString()}
                    </p>
                  )}
                </div>
                {item.type !== 'success' && (
                  <div className="alert-card-actions">
                    <button 
                      className="btn btn--primary" 
                      disabled={processingIds.includes(item.id)} // student written: make unclickable while processing
                      onClick={() => {
                        if (item.id.startsWith('alert-new-enq-')) {
                          setSelectedAlert(item);
                        } else {
                          handleAcceptAlert(item.id);
                        }
                      }}
                    >
                      {processingIds.includes(item.id) ? 'Processing...' : (item.id.startsWith('alert-new-enq-') ? 'View' : 'Dismiss')}
                    </button>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
      
      <EnquiryViewModal 
        selectedEnquiry={selectedAlert}
        onClose={() => setSelectedAlert(null)}
        onAccept={selectedAlert ? () => {
          handleAcceptAlert(selectedAlert.id);
          setSelectedAlert(null);
        } : null}
        onDelete={selectedAlert ? () => {
          handleDeleteAlert(selectedAlert.id);
        } : null}
        isDeleting={selectedAlert ? deletingIds.includes(selectedAlert.id) : false}
      />
    </div>
  );
};

export default AlertsPage;
