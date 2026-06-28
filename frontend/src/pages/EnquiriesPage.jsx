import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import ErrorAlert from '../components/ErrorAlert.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { getEnquiries, deleteEnquiry, updateEnquiryStatus } from '../api/enquiry.api.js';
import { getApiError } from '../services/index.js';
import EnquiryCard from '../components/EnquiryCard.jsx';
import EnquiryViewModal from '../components/EnquiryViewModal.jsx';

const EnquiriesPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('Pending'); // Default to Pending (Not Responded)
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [deletingIds, setDeletingIds] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const response = await getEnquiries();
        setItems(Array.isArray(response.data) ? response.data : []);
      } catch (err) {
        setError(getApiError(err).message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this enquiry?')) return;
    setDeletingIds(prev => [...prev, id]);
    try {
      console.log('Attempting to delete:', id);
      await deleteEnquiry(id);
      console.log('Successfully deleted:', id);
      setItems(prev => prev.filter(e => e.id !== id));
      if (selectedEnquiry && selectedEnquiry.id === id) {
        setSelectedEnquiry(null);
      }
    } catch (err) {
      console.error('Delete error:', err);
      alert('Delete failed: ' + getApiError(err).message);
      setError(getApiError(err).message);
    } finally {
      setDeletingIds(prev => prev.filter(deleteId => deleteId !== id));
    }
  };

  const handleAccept = async (id) => {
    try {
      await updateEnquiryStatus(id, 'Pending');
      setItems(prev => prev.map(e => e.id === id ? { ...e, status: 'Pending' } : e));
    } catch (err) {
      setError(getApiError(err).message);
    }
  };

  if (loading) return <LoadingSpinner message="Loading enquiries..." />;

  const filteredItems = items
    .filter(e => {
      const s = (e.status || 'new').toLowerCase();
      if (s === 'new') return false; // Hide 'new' enquiries, they belong in Alerts
      if (filter === 'All') return true;
      if (filter === 'Pending') return s === 'pending';
      if (filter === 'Responded') return s === 'responded';
      return true;
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return (
    <div>
      <PageHeader 
        title="Enquiries" 
        subtitle="Parent and prospect enquiries" 
      />
      <ErrorAlert message={error} onDismiss={() => setError('')} />

      <div className="tabs-container">
        <button 
          className={`btn tab-btn ${filter === 'Pending' ? 'btn--primary' : 'btn--ghost'}`}
          onClick={() => setFilter('Pending')}
        >
          Not Responded
        </button>
        <button 
          className={`btn tab-btn ${filter === 'Responded' ? 'btn--primary' : 'btn--ghost'}`}
          onClick={() => setFilter('Responded')}
        >
          Responded
        </button>
      </div>

      {filteredItems.length === 0 ? (
        <EmptyState title="No enquiries" description="No parent enquiries found for the selected filter." />
      ) : (
        <div className="card-grid">
          {filteredItems.map((item) => {
            const statusStr = item.status || 'new';
            const statusLower = statusStr.toLowerCase();
            const displayStatus = statusStr.charAt(0).toUpperCase() + statusStr.slice(1).toLowerCase();

            return (
              <EnquiryCard 
                key={item.id}
                item={item}
                onDelete={handleDelete}
                onView={setSelectedEnquiry}
                isDeleting={deletingIds.includes(item.id)}
              />
            );
          })}
        </div>
      )}

      <EnquiryViewModal 
        selectedEnquiry={selectedEnquiry}
        onClose={() => setSelectedEnquiry(null)}
        onDelete={() => {
          if (selectedEnquiry) {
            handleDelete(selectedEnquiry.id);
            // Don't close immediately so they can see the 'Deleting...' state if needed,
            // or we can close it. Usually better to let it close on success.
          }
        }}
        isDeleting={selectedEnquiry ? deletingIds.includes(selectedEnquiry.id) : false}
      />
    </div>
  );
};

export default EnquiriesPage;
