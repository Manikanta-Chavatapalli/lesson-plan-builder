import { useState, useEffect, useRef } from 'react';
import { Link, Outlet, NavLink, useLocation } from 'react-router-dom';
import { useAppContext } from '../context/AppContext.jsx';
import alertApi from '../api/alert.api.js';
import apiClient from '../api/axios.js';

const getNavLinks = (role) => {
  if (role === 'admin') {
    return [
      { to: '/admin', label: 'Admin Dashboard' },
      { to: '/history', label: 'History' }
    ];
  }
  if (role === 'head') {
    return [
      { to: '/overview', label: 'Overview' },
      { to: '/alerts', label: 'Alerts' }
    ];
  }
  if (role === 'counsellor') {
    return [
      { to: '/counsellor/teacher-data', label: 'Teacher Data' },
      { to: '/counsellor/enquiries', label: 'Counsellor Enquiries' },
      { to: '/counsellor/alerts', label: 'Alerts' }
    ];
  }
  return [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/lesson-plans', label: 'Lesson Plans' },
    { to: '/history', label: 'History' },
    { to: '/enquiries', label: 'Enquiries' },
    { to: '/alerts', label: 'Alerts' },
  ];
};

const AppLayout = () => {
  const { user, logout, theme, toggleTheme } = useAppContext();
  const location = useLocation();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [hasUnreadAlerts, setHasUnreadAlerts] = useState(false);
  const [hasUnreadEnquiries, setHasUnreadEnquiries] = useState(false);
  const seenAlertIds = useRef(new Set());
  const seenEnquiryIds = useRef(new Set());

  useEffect(() => {
    let mounted = true;
    const fetchAlertsAndEnquiries = async () => {
      try {
        if (!user) return;
        
        let currentAlerts = [];
        if (user.role === 'counsellor') {
          // You need to import apiClient at the top of the file
          const timestamp = Date.now();
          const { data } = await apiClient.get(`/counsellor/alerts?t=${timestamp}`);
          currentAlerts = data.data || [];

          const enquiriesRes = await apiClient.get(`/counsellor/enquiries?t=${timestamp}`);
          const currentEnquiries = enquiriesRes.data.data || [];

          if (mounted) {
            const pendingEnquiries = currentEnquiries.filter(e => e.status === 'pending');
            const pendingIds = pendingEnquiries.map(e => e.id);
            
            if (location.pathname === '/counsellor/enquiries') {
              pendingIds.forEach(id => seenEnquiryIds.current.add(id));
              setHasUnreadEnquiries(false);
            } else {
              const hasNewEnq = pendingIds.some(id => !seenEnquiryIds.current.has(id));
              setHasUnreadEnquiries(hasNewEnq);
            }
          }
        } else {
          const { data } = await alertApi.getAlerts();
          currentAlerts = data || [];
        }

        if (mounted) {
          const currentIds = currentAlerts.map(a => a.id);
          
          if (location.pathname === '/alerts' || location.pathname === '/counsellor/alerts') {
            currentIds.forEach(id => seenAlertIds.current.add(id));
            setHasUnreadAlerts(false);
          } else {
            const hasNew = currentIds.some(id => !seenAlertIds.current.has(id));
            setHasUnreadAlerts(hasNew);
          }
        }
      } catch (err) {
        console.error("Failed to fetch alerts/enquiries", err);
      }
    };
    fetchAlertsAndEnquiries();

    // Set up Server-Sent Events (SSE) listener
    let eventSource;
    if (user) {
      const token = localStorage.getItem('token');
      const API_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
      eventSource = new EventSource(`${API_URL}/api/stream?token=${token}`);
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'NEW_ALERT') {
            setTimeout(() => {
              if (mounted) {
                fetchAlertsAndEnquiries();
                window.dispatchEvent(new CustomEvent('new-alert-received'));
              }
            }, 500);
          }
        } catch (e) {
          console.error('Failed to parse SSE data', e);
        }
      };
    }

    return () => {
      mounted = false;
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [user, location.pathname]);

  const performLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="app-layout">
      <header className="app-header">
        <div className="app-header__brand">
          <h1>FirstCry Intellitots</h1>
          <span>Lesson Plan Builder</span>
        </div>
        <nav className="app-nav">
          {getNavLinks(user?.role).map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/' || to === '/admin' || to === '/overview' || to === '/dashboard'}
              className={({ isActive }) => `app-nav__link${isActive ? ' active' : ''}`}
            >
              {label}
              {(to === '/alerts' || to === '/counsellor/alerts') && hasUnreadAlerts && (
                <span 
                  title="New unread alerts"
                  className="nav-alert-dot"
                />
              )}
            </NavLink>
          ))}
        </nav>
        <div className="app-header__user">
          <button 
            type="button" 
            className="btn btn--secondary btn--sm" 
            onClick={toggleTheme}
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
          </button>
          <button 
            type="button" 
            className="btn logout-btn logout-btn-styled" 
            onClick={performLogout}
            disabled={isLoggingOut}
            title="Logout"
          >
            {isLoggingOut ? (
              <span className="spinner-icon">⏳</span>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
            )}
            <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
          </button>
        </div>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;
