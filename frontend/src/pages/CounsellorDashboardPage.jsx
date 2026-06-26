import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAppContext } from '../context/AppContext.jsx';
import PageHeader from '../components/PageHeader.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import ErrorAlert from '../components/ErrorAlert.jsx';
import EnquiryCard from '../components/EnquiryCard.jsx';
import EnquiryViewModal from '../components/EnquiryViewModal.jsx';
import apiClient from '../api/axios.js';

const CounsellorDashboardPage = () => {
  const { user } = useAppContext();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('teacher-data');

  useEffect(() => {
    if (location.pathname.includes('/alerts')) setActiveTab('alerts');
    else if (location.pathname.includes('/enquiries')) setActiveTab('counsellor-enquiries');
    else setActiveTab('teacher-data');
  }, [location.pathname]);
  const [alerts, setAlerts] = useState([]);
  const [enquiries, setEnquiries] = useState([]);
  const [teacherStats, setTeacherStats] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [responseError, setResponseError] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [teacherEnquiries, setTeacherEnquiries] = useState([]);

  // Tab states
  const [counsellorEnquiriesTab, setCounsellorEnquiriesTab] = useState('pending');
  const [teacherSubTab, setTeacherSubTab] = useState('not-responded');

  // Modal states
  const [selectedViewEnquiry, setSelectedViewEnquiry] = useState(null);
  const [responseModal, setResponseModal] = useState({ open: false, enquiry: null, message: '' });
  const [isSubmittingResponse, setIsSubmittingResponse] = useState(false);

  const fetchData = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const timestamp = Date.now();
      const [alertsRes, enqRes, statsRes] = await Promise.all([
        apiClient.get(`/counsellor/alerts?t=${timestamp}`),
        apiClient.get(`/counsellor/enquiries?t=${timestamp}`),
        apiClient.get(`/counsellor/teacher-stats?t=${timestamp}`)
      ]);

      setAlerts(alertsRes.data?.data || []);
      setEnquiries(enqRes.data?.data || []);
      setTeacherStats(statsRes.data?.data || []);
    } catch (err) {
      console.error(err);
      setError('Failed to load dashboard data. Please try again later.');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    // Ensure we have fresh data when switching dashboard tabs, 
    // unless it's the initial mount which is handled above.
    // To prevent double fetch on mount, we can just rely on activeTab changes 
    // but the simplest safe way without refactoring is to just call it.
    fetchData(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleNewAlert = () => {
      setTimeout(() => {
        fetchData(false);
        if (selectedTeacher) {
          handleTeacherClick(selectedTeacher, false);
        }
      }, 1000);
    };

    window.addEventListener('new-alert-received', handleNewAlert);
    return () => window.removeEventListener('new-alert-received', handleNewAlert);
  }, [selectedTeacher]);

  const handleTeacherClick = async (teacher, showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const res = await apiClient.get(`/counsellor/teacher-enquiries/${teacher.email}`);
      const teacherData = res.data?.data || [];
      setTeacherEnquiries(teacherData);
      setSelectedTeacher(teacher);

      // Auto switch tab based on data
      const hasNew = teacherData.some(e => e.status?.toLowerCase() === 'new');
      if (hasNew) {
        setTeacherSubTab('alerts');
      } else {
        setTeacherSubTab('not-responded');
      }
    } catch (err) {
      setError(`Failed to load enquiries for ${teacher.name}`);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const handleAcceptAlert = async (id) => {
    try {
      if (id.startsWith('alert-new-enq-')) {
        const enqId = id.replace('alert-new-enq-', '');
        await apiClient.patch(`/enquiries/${enqId}/status`, { status: 'pending' });
      } else {
        await apiClient.patch(`/counsellor/alerts/${id}/accept`);
      }
      fetchData(false);
    } catch (err) {
      setError('Failed to accept alert.');
    }
  };

  const handleDeleteAlert = async (id) => {
    if (!window.confirm('Are you sure you want to delete this alert?')) return;
    try {
      if (id.startsWith('alert-new-enq-')) {
        // Just hide it locally for demo purposes if it's a virtual alert
        setAlerts(alerts.filter(a => a.id !== id));
      } else {
        await apiClient.delete(`/counsellor/alerts/${id}`);
        fetchData(false);
      }
    } catch (err) {
      setError('Failed to delete alert.');
    }
  };

  const handleRespond = async () => {
    if (isSubmittingResponse) return;
    setIsSubmittingResponse(true);
    try {
      await apiClient.post(`/counsellor/enquiries/${responseModal.enquiry.id}/respond`, {
        responseMessage: responseModal.message
      });

      setResponseModal({ open: false, enquiry: null, message: '' });
      setResponseError('');

      // Refresh current view
      if (selectedTeacher) {
        handleTeacherClick(selectedTeacher, false);
      }
      fetchData(false);
    } catch (err) {
      setResponseError('Failed to send response: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsSubmittingResponse(false);
    }
  };

  const handleDeleteEnquiry = async (id) => {
    if (!window.confirm('Are you sure you want to delete this enquiry?')) return;
    try {
      await apiClient.delete(`/enquiries/${id}`);
      fetchData(false);
      if (selectedTeacher) {
        handleTeacherClick(selectedTeacher, false);
      }
      setSelectedViewEnquiry(null);
    } catch (err) {
      setError('Failed to delete enquiry.');
    }
  };

  const handleAcceptTeacherAlert = async (id) => {
    try {
      await apiClient.patch(`/enquiries/${id}/status`, { status: 'pending' });
      if (selectedTeacher) handleTeacherClick(selectedTeacher, false);
      fetchData(false); // refresh stats silently
    } catch (err) {
      setError('Failed to accept alert.');
    }
  };

  const EmptyState = ({ message, icon }) => (
    <div className="inline-empty-state">
      <div className="inline-empty-icon">{icon}</div>
      <p className="inline-empty-text">{message}</p>
    </div>
  );

  const renderAlertsTab = () => (
    <div className="alerts-container">
      {alerts.length === 0 ? (
        <EmptyState icon="🔕" message="You have no new alerts at the moment." />
      ) : (
        <div className="card-grid">
          {alerts.map(alert => (
            <article key={alert.id} className="alert-card alert-card--warning">
              <div className="alert-card-layout">
                <div className="alert-card-content">
                  <h3 className="alert-card-title">New Enquiry: Enquiry from {alert.parentName || alert.parentEmail}</h3>
                  <p className="text-muted alert-card-timestamp">
                    Created: {formatTimeAgo(alert.createdAt)}
                  </p>
                </div>
                <div className="alert-card-actions">
                  <button
                    className="btn btn--primary"
                    onClick={() => setSelectedViewEnquiry(alert)}
                  >
                    View
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );

  const renderCounsellorEnquiriesTab = () => (
    <div className="enquiries-container">
      <div className="tabs-container">
        <button
          className={`btn tab-btn-top ${counsellorEnquiriesTab === 'pending' ? 'btn--primary' : 'btn--ghost'}`}
          onClick={() => setCounsellorEnquiriesTab('pending')}
        >
          Not Responded
        </button>
        <button
          className={`btn tab-btn-top ${counsellorEnquiriesTab === 'responded' ? 'btn--primary' : 'btn--ghost'}`}
          onClick={() => setCounsellorEnquiriesTab('responded')}
        >
          Responded
        </button>
      </div>

      {enquiries.filter(e => e.status?.toLowerCase() === counsellorEnquiriesTab).length === 0 ? (
        <EmptyState
          icon={counsellorEnquiriesTab === 'responded' ? '✅' : '📥'}
          message={`No ${counsellorEnquiriesTab === 'responded' ? 'responded' : 'pending'} counsellor enquiries found.`}
        />
      ) : (
        <div className="card-grid">
          {enquiries
            .filter(e => e.status?.toLowerCase() === counsellorEnquiriesTab)
            .map(enq => (
              <EnquiryCard
                key={enq.id}
                item={enq}
                customActions={
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <button className="btn btn--secondary btn--sm" onClick={() => setSelectedViewEnquiry(enq)}>View</button>
                    {enq.status?.toLowerCase() !== 'responded' && (
                      <button className="btn btn--primary btn--sm" onClick={() => setResponseModal({ open: true, enquiry: enq, message: '' })}>Respond</button>
                    )}
                    {enq.status?.toLowerCase() === 'responded' && (
                      <button className="btn btn--danger btn--sm" onClick={() => handleDeleteEnquiry(enq.id)}>Delete</button>
                    )}
                  </div>
                }
              />
            ))}
        </div>
      )}
    </div>
  );

  const renderTeacherDataTab = () => {
    if (selectedTeacher) {
      return (
        <div className="teacher-details-container">
          <div className="teacher-details-header">
            <button
              className="btn btn--ghost btn--sm btn-back-icon"
              onClick={() => setSelectedTeacher(null)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
              Back
            </button>
            <h3 className="teacher-details-title">Enquiries for {selectedTeacher.name}</h3>
          </div>

          <div className="tabs-container">
            <button
              className={`btn tab-btn-top ${teacherSubTab === 'alerts' ? 'btn--primary' : 'btn--ghost'}`}
              onClick={() => setTeacherSubTab('alerts')}
            >
              Alerts
            </button>
            <button
              className={`btn tab-btn-top ${teacherSubTab === 'not-responded' ? 'btn--primary' : 'btn--ghost'}`}
              onClick={() => setTeacherSubTab('not-responded')}
            >
              Not Responded
            </button>
            <button
              className={`btn tab-btn-top ${teacherSubTab === 'responded' ? 'btn--primary' : 'btn--ghost'}`}
              onClick={() => setTeacherSubTab('responded')}
            >
              Responded
            </button>
          </div>

          <div>
            {teacherEnquiries.filter(e => {
              if (teacherSubTab === 'alerts') return e.status?.toLowerCase() === 'new';
              if (teacherSubTab === 'not-responded') return e.status?.toLowerCase() === 'pending';
              return e.status?.toLowerCase() === 'responded';
            }).length === 0 ? (
              <EmptyState
                icon={teacherSubTab === 'responded' ? '✅' : teacherSubTab === 'alerts' ? '🔕' : '⏳'}
                message={`No ${teacherSubTab === 'responded' ? 'responded' : teacherSubTab === 'alerts' ? 'new alerts' : 'pending enquiries'} found.`}
              />
            ) : (
              <div className="card-grid">
                {teacherEnquiries
                  .filter(e => {
                    if (teacherSubTab === 'alerts') return e.status?.toLowerCase() === 'new';
                    if (teacherSubTab === 'not-responded') return e.status?.toLowerCase() === 'pending';
                    return e.status?.toLowerCase() === 'responded';
                  })
                  .map(enq => (
                    <EnquiryCard
                      key={enq.id}
                      item={enq}
                      customActions={
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          <button className="btn btn--secondary btn--sm" onClick={() => setSelectedViewEnquiry(enq)}>View</button>
                          {enq.status?.toLowerCase() === 'pending' && (
                            <button className="btn btn--primary btn--sm" onClick={() => setResponseModal({ open: true, enquiry: enq, message: '' })}>Respond</button>
                          )}
                          {enq.status?.toLowerCase() === 'responded' && (
                            <button className="btn btn--danger btn--sm" onClick={() => handleDeleteEnquiry(enq.id)}>Delete</button>
                          )}
                        </div>
                      }
                    />
                  ))}
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="teacher-overview-card-main">
        <h3 className="teacher-overview-title">Teacher Overview</h3>
        <div className="card teacher-overview-container-inner">
          {teacherStats.length === 0 ? (
            <EmptyState icon="👥" message="No teachers found." />
          ) : (
            teacherStats.map((t, index) => (
              <div
                key={t.id}
                onClick={() => handleTeacherClick(t)}
                className="card hover-scale teacher-overview-item"
                style={{ marginBottom: index === teacherStats.length - 1 ? '0' : '15px' }}
              >
                <div className="teacher-overview-item-info">
                  <h4 className="teacher-overview-item-name">{t.name}</h4>
                  <div className="teacher-overview-item-email">
                    📧 {t.email}
                  </div>
                </div>
                <div className="teacher-overview-item-stats">
                  <div className="teacher-overview-stat-col">
                    <div className="teacher-overview-stat-label">RESPONDED</div>
                    <div className="teacher-overview-stat-success">{t.respondedCount}</div>
                  </div>
                  <div className="teacher-overview-stat-col">
                    <div className="teacher-overview-stat-label">NOT RESPONDED</div>
                    <div className="teacher-overview-stat-danger">{t.notRespondedCount}</div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  if (responseModal.open && responseModal.enquiry) {
    const enq = responseModal.enquiry;
    return (
      <div className="page-container response-view-container">
        <div className="respond-page response-view-wrapper">
          <div className="response-view-header">
            <div>
              <h2 className="response-view-title">Respond to Enquiry</h2>
              <p className="response-view-subtitle">Send a response to the parent</p>
            </div>
            <button className="btn btn--ghost" onClick={() => {
              setResponseModal({ open: false, enquiry: null, message: '' });
              setResponseError('');
            }}>Cancel</button>
          </div>
          <div className="card">
            <div className="response-detail-section">
              <h3 className="response-detail-from">From: {enq.parentName}</h3>
              <p className="text-muted response-detail-meta">
                <a href={`mailto:${enq.parentEmail}`}>{enq.parentEmail}</a>
                <span className="response-detail-meta-dot">•</span>
                {enq.createdAt ? new Date(enq.createdAt).toLocaleString() : 'Unknown'}
              </p>
              <div className="response-student-info">
                <div><strong>Student:</strong> {enq.studentName || 'N/A'}</div>
                <div><strong>Class:</strong> {enq.studentClass || 'N/A'} - {enq.studentSection || 'N/A'}</div>
              </div>
              <div className="response-original-msg">
                <strong>Original Message:</strong>
                <p className="response-original-msg-text">
                  {enq.message}
                </p>
              </div>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleRespond(); }}>
              <div className="form-field counsellor-form-field">
                <label htmlFor="responseMessage">Your Response</label>
                <textarea
                  id="responseMessage"
                  rows="6"
                  className="form-input response-textarea"
                  placeholder={`Draft your reply to ${enq.parentName}...`}
                  value={responseModal.message}
                  onChange={(e) => setResponseModal({ ...responseModal, message: e.target.value })}
                  required
                />
                <small className="text-muted response-help-text">
                  This message will be sent directly to {enq.parentEmail}
                </small>
              </div>
              {responseError && (
                <div style={{ marginBottom: '1rem' }}>
                  <ErrorAlert message={responseError} onDismiss={() => setResponseError('')} />
                </div>
              )}
              <div className="response-actions">
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={() => setResponseModal({ open: false, enquiry: null, message: '' })}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn--primary"
                  disabled={!responseModal.message.trim() || isSubmittingResponse}
                >
                  {isSubmittingResponse ? 'Sending...' : 'Send Response'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container counsellor-page-container">
      <PageHeader
        title="Counsellor Dashboard"
        subtitle="Manage alerts, teacher stats, and parent enquiries."
      />

      <ErrorAlert message={error} onDismiss={() => setError('')} />

      {loading ? <LoadingSpinner /> : (
        <div className="tab-content">
          {activeTab === 'alerts' && renderAlertsTab()}
          {activeTab === 'counsellor-enquiries' && renderCounsellorEnquiriesTab()}
          {activeTab === 'teacher-data' && renderTeacherDataTab()}
        </div>
      )}

      <EnquiryViewModal
        selectedEnquiry={selectedViewEnquiry}
        onClose={() => setSelectedViewEnquiry(null)}
        onDelete={selectedViewEnquiry ? () => {
          // If it's an alert from the alerts tab (which has roleTarget), we can use handleDeleteAlert,
          // but CounsellorDashboard treats alerts as full enquiries. So handleDeleteEnquiry is fine.
          handleDeleteEnquiry(selectedViewEnquiry.id);
          setSelectedViewEnquiry(null);
        } : null}
        onAccept={selectedViewEnquiry?.status === 'new' ? () => {
          handleAcceptTeacherAlert(selectedViewEnquiry.id);
          setSelectedViewEnquiry(null);
        } : null}
      />
    </div>
  );
};

// Helper function
function formatTimeAgo(dateString) {
  if (!dateString) return 'Unknown';
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return 'Just now';

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) return `${diffInDays}d ago`;

  return date.toLocaleDateString();
}

export default CounsellorDashboardPage;
