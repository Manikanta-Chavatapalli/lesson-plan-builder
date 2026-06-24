import { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import ErrorAlert from '../components/ErrorAlert.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { getHistory, deleteHistory } from '../api/history.api.js';
import { getApiError } from '../services/index.js';

const HistoryPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const response = await getHistory();
        setItems(Array.isArray(response.data) ? response.data : []);
      } catch (err) {
        setError(getApiError(err).message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleDelete = async (id) => {
    try {
      await deleteHistory(id);
      setItems((prev) => prev.filter(item => item.id !== id));
    } catch (err) {
      setError(getApiError(err).message);
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return 'N/A';
    const date = new Date(isoString);
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatType = (type) => {
    if (!type) return 'Unknown';
    if (type === 'lessonPlan') return 'Lesson Plan';
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  if (loading) return <LoadingSpinner message="Loading history..." />;

  return (
    <div className="page-container history-page-layout">
      <PageHeader title="History" subtitle="Audit log of all system activities" />
      <ErrorAlert message={error} onDismiss={() => setError('')} />
      {items.length === 0 ? (
        <EmptyState title="No activity found" description="Activity history will appear here as you create and update records." />
      ) : (
        <div className="card history-card-wrapper">
          <div className="table-responsive history-table-wrapper">
            <table className="history-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Action</th>
                  <th>Message</th>
                  <th className="history-table-action-header"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="text-muted history-table-date">{formatDate(item.date)}</td>
                    <td>
                      <span className={`badge badge--${
                        item.type === 'enquiry' ? 'primary' : 
                        item.type === 'user' ? 'secondary' : 'success'
                      }`}>
                        {formatType(item.type)}
                      </span>
                    </td>
                    <td><strong>{item.action}</strong></td>
                    <td className="text-muted">{item.message}</td>
                    <td className="history-table-center-cell">
                      <button 
                        onClick={() => handleDelete(item.id)}
                        className="history-delete-btn"
                        title="Delete log"
                        aria-label="Delete log"
                      >
                        &times;
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoryPage;
