import { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import ErrorAlert from '../components/ErrorAlert.jsx';
import dashboardApi from '../api/dashboard.api.js';
import enquiryApi from '../api/enquiry.api.js';
import lessonPlanApi from '../api/lessonPlan.api.js';
import { getAlerts, acknowledgeAlert, sessionDismissedAlerts } from '../api/alert.api.js';
import { getApiError } from '../services/index.js';
import { useAppContext } from '../context/AppContext.jsx';
import EnquiryViewModal from '../components/EnquiryViewModal.jsx';

const DashboardPage = () => {
  const { user } = useAppContext();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [stats, setStats] = useState(null);
  const [records, setRecords] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [deletingIds, setDeletingIds] = useState([]);

  // Filters
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterDate, setFilterDate] = useState('All');

  const loadData = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const [statsRes, unifiedRes, alertsRes] = await Promise.all([
        dashboardApi.getDashboardStats(),
        dashboardApi.getUnifiedRecords(),
        getAlerts()
      ]);
      
      let alertsData = Array.isArray(alertsRes.data) ? alertsRes.data : alertsRes.data?.data;
      if (!Array.isArray(alertsData)) alertsData = [];
      const visibleAlerts = alertsData.filter(a => {
        if (sessionDismissedAlerts.has(a.id)) return false;
        return true;
      });
      setAlerts(visibleAlerts);
      
      const statsData = statsRes.data;
      statsData.unreadAlerts = visibleAlerts.length;
      setStats(statsData);
      
      setRecords((Array.isArray(unifiedRes.data) ? unifiedRes.data : []).filter(r => r.type === 'Lesson Plan'));
    } catch (err) {
      setError(getApiError(err).message);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const handleNewAlert = () => loadData(false);
    window.addEventListener('new-alert-received', handleNewAlert);
    return () => {
      window.removeEventListener('new-alert-received', handleNewAlert);
    };
  }, []);

  const handleUpdateStatus = async (id, type, newStatus) => {
    try {
      await lessonPlanApi.updateLessonPlanStatus(id, newStatus);
      
      // Optimistic update
      setRecords(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
    } catch (err) {
      setError(getApiError(err).message);
    }
  };

  const handleUpdatePriority = async (id, type, newPriority) => {
    try {
      await lessonPlanApi.updateLessonPlanPriority(id, newPriority);
      
      // Optimistic update
      setRecords(prev => prev.map(r => r.id === id ? { ...r, priority: newPriority } : r));
    } catch (err) {
      setError(getApiError(err).message);
    }
  };

  const handleDismissAlert = async (alertId) => {
    try {
      if (alertId.startsWith('alert-new-enq-')) {
        const enqId = alertId.replace('alert-new-enq-', '');
        await enquiryApi.updateEnquiryStatus(enqId, 'Pending');
        sessionDismissedAlerts.add(alertId);
      } else {
        await acknowledgeAlert(alertId);
      }
      setAlerts(prev => prev.filter(a => a.id !== alertId));
      setStats(prev => ({ ...prev, unreadAlerts: Math.max(0, prev.unreadAlerts - 1) }));
    } catch (err) {
      setError(getApiError(err).message);
    }
  };

  const handleDeleteAlert = async (alertId) => {
    if (!window.confirm('Are you sure you want to completely delete this enquiry/alert?')) return;
    setDeletingIds(prev => [...prev, alertId]);
    try {
      if (alertId.startsWith('alert-new-enq-')) {
        const enqId = alertId.replace('alert-new-enq-', '');
        await enquiryApi.deleteEnquiry(enqId);
        sessionDismissedAlerts.add(alertId);
      } else {
        await acknowledgeAlert(alertId);
      }
      setAlerts(prev => prev.filter(a => a.id !== alertId));
      setStats(prev => ({ ...prev, unreadAlerts: Math.max(0, prev.unreadAlerts - 1) }));
      if (selectedAlert && selectedAlert.id === alertId) {
        setSelectedAlert(null);
      }
    } catch (err) {
      setError(getApiError(err).message);
    } finally {
      setDeletingIds(prev => prev.filter(deleteId => deleteId !== alertId));
    }
  };

  const handleRowClick = (record) => {
    navigate(`/lesson-plans/${record.id}`);
  };

  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      let matches = true;
      if (filterStatus !== 'All' && r.status !== filterStatus) matches = false;
      
      if (filterDate !== 'All') {
        const recordDate = new Date(r.date);
        const today = new Date();
        const diffTime = Math.abs(today - recordDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (filterDate === 'Today' && diffDays > 1) matches = false;
        if (filterDate === 'This Week' && diffDays > 7) matches = false;
        if (filterDate === 'This Month' && diffDays > 30) matches = false;
      }
      return matches;
    });
  }, [records, filterStatus, filterDate]);

  if (loading) return <LoadingSpinner message="Loading dashboard..." />;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-greeting-bar">
        <span className="dashboard-greeting-text">
          {getGreeting()}, {user?.name || 'Teacher'} 👋
        </span>
        <span className="text-muted dashboard-greeting-date">
          📅 {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </span>
      </div>
      <PageHeader
        title="Workflow Control Center"
        subtitle="Manage, track, and action your parent enquiries and lesson plans"
      />
      <ErrorAlert message={error} onDismiss={() => setError('')} />

      {/* TOP SECTION: Summary Cards */}
      {stats && (
        <div className="stats-grid dashboard-stats">
          <div className="stat-card">
            <span className="stat-card__label">Lesson Plans Created</span>
            <span className="stat-card__value stat-card-val-primary">{stats.lessonPlansCreated}</span>
          </div>
          <div className="stat-card">
            <span className="stat-card__label">Total Enquiries</span>
            <span className="stat-card__value stat-card-val-success">{stats.totalEnquiries || 0}</span>
          </div>
          <div className="stat-card">
            <span className="stat-card__label">Responded Enquiries</span>
            <span className="stat-card__value stat-card-val-muted">{stats.respondedEnquiries || 0}</span>
          </div>
          <div className="stat-card">
            <span className="stat-card__label">Unread Alerts</span>
            <span className="stat-card__value stat-card-val-warning">{stats.unreadAlerts}</span>
          </div>
        </div>
      )}

      {/* FILTERS SECTION */}
      <section className="card dashboard-filters-bar">
        <div className="dashboard-filter-group">
          <label className="dashboard-filter-label">Status:</label>
          <select className="form-select dashboard-filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="All">All Statuses</option>
            <option value="New">New</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Follow-up">Follow-up</option>
          </select>
        </div>

        <div className="dashboard-filter-group">
          <label className="dashboard-filter-label">Date Range:</label>
          <select className="form-select dashboard-filter-select" value={filterDate} onChange={e => setFilterDate(e.target.value)}>
            <option value="All">All Time</option>
            <option value="Today">Today</option>
            <option value="This Week">This Week</option>
            <option value="This Month">This Month</option>
          </select>
        </div>
      </section>

      {/* MAIN CONTENT LAYOUT */}
      <div className="dashboard-layout">
        
        {/* LEFT SIDE (70%) */}
        <div className="dashboard-layout__main">
          
          {/* UNIFIED DATA TABLE SECTION */}
          <section className="card">
            <div className="dashboard-table-header">
              <h3>Workflow Records</h3>
            </div>

            {filteredRecords.length === 0 ? (
              <div className="empty-state">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="dashboard-table-empty">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
                <p>No records found matching your filters.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="workflow-table">
                  <thead>
                    <tr>
                      <th>Name / Title</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th>Date</th>
                      <th>Assigned Teacher</th>
                      <th>Priority</th>
                      <th>Preview</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecords.map((record) => (
                      <tr 
                        key={`${record.type}-${record.id}`} 
                        className={`priority-${record.priority.toLowerCase()}`}
                      >
                        <td onClick={() => handleRowClick(record)} className="clickable-cell dashboard-filter-label">
                          {record.title}
                        </td>
                        <td onClick={() => handleRowClick(record)} className="clickable-cell">
                          <span className="badge badge--secondary">
                            {record.type}
                          </span>
                        </td>
                        <td>
                          <select 
                            className="form-select select-sm" 
                            value={record.status} 
                            onChange={(e) => handleUpdateStatus(record.id, record.type, e.target.value)}
                            onClick={(e) => e.stopPropagation()} // Prevent row click
                          >
                            <option value="New">New</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Completed">Completed</option>
                            <option value="Follow-up">Follow-up</option>
                          </select>
                        </td>
                        <td onClick={() => handleRowClick(record)} className="clickable-cell dashboard-table-cell">
                          {new Date(record.date).toLocaleDateString()}
                        </td>
                        <td onClick={() => handleRowClick(record)} className="clickable-cell dashboard-table-cell">
                          {record.teacher}
                        </td>
                        <td>
                          <select 
                            className="form-select select-sm" 
                            value={record.priority} 
                            onChange={(e) => handleUpdatePriority(record.id, record.type, e.target.value)}
                            onClick={(e) => e.stopPropagation()} // Prevent row click
                          >
                            <option value="High">High</option>
                            <option value="Medium">Medium</option>
                            <option value="Low">Low</option>
                          </select>
                        </td>
                        <td onClick={() => handleRowClick(record)} className="clickable-cell dashboard-table-cell-preview">
                          {record.preview}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

        </div>

        {/* RIGHT SIDE (30%) */}
        <div className="dashboard-layout__sidebar">
          
          {/* Teacher Info Card */}
          <section className="card teacher-info-card sidebar-profile-card">
            <div className="sidebar-profile-avatar">
              {user?.name?.charAt(0).toUpperCase() || 'T'}
            </div>
            <div>
              <h3 className="sidebar-profile-name">{user?.name || 'System User'}</h3>
              <p className="text-muted sidebar-profile-role">Role: Teacher</p>
            </div>
          </section>

          {/* Alerts / Notifications */}
          <section className="card alerts-card">
            <h3 className="sidebar-alerts-header">Alerts & Notifications</h3>
            {alerts.length === 0 ? (
              <div className="empty-state sidebar-alerts-empty">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                <p>No new alerts.</p>
              </div>
            ) : (
              <div className="alert-list sidebar-alert-list">
                {alerts.map(alert => (
                  <div key={alert.id} className={`sidebar-alert-item border-priority-${alert.priority ? alert.priority.toLowerCase() : 'normal'}`}>
                    <div>
                      <p className="sidebar-alert-message">{alert.message}</p>
                      {alert.date && (
                       <span className="text-muted sidebar-alert-date">
                          {new Date(alert.date).toLocaleString()}
                        </span>
                      )}
                    </div>
                    {alert.type !== 'success' && (
                      <div style={{ marginTop: '0.5rem' }}>
                        <button 
                          className="btn btn--sm btn--primary sidebar-alert-btn" 
                          onClick={() => {
                            if (alert.id.startsWith('alert-new-enq-')) {
                              setSelectedAlert(alert);
                            } else {
                              handleDismissAlert(alert.id);
                            }
                          }}
                        >
                          {alert.id.startsWith('alert-new-enq-') ? 'View' : 'Dismiss'}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Activity History Navigation */}
          <section className="card activity-card sidebar-activity-card">
            <h3 className="sidebar-activity-title">Activity Logs</h3>
            <p className="text-muted sidebar-activity-desc">
              View a complete audit trail of system events, enquiries, and lesson plans.
            </p>
            <button 
              className="btn btn--primary sidebar-activity-btn" 
              onClick={() => navigate('/history')}
            >
              View Activity History &rarr;
            </button>
          </section>

        </div>
      </div>
      
      <EnquiryViewModal 
        selectedEnquiry={selectedAlert}
        onClose={() => setSelectedAlert(null)}
        onAccept={selectedAlert ? () => {
          handleDismissAlert(selectedAlert.id);
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

export default DashboardPage;
