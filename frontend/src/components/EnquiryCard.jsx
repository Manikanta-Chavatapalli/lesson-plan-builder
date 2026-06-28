import React from 'react';
import { Link } from 'react-router-dom';

const EnquiryCard = ({ 
  item, 
  onDelete, 
  onView, 
  customActions,
  isDeleting
}) => {
  const statusStr = item.status || 'pending';
  const statusLower = statusStr.toLowerCase();
  const displayStatus = statusStr.charAt(0).toUpperCase() + statusStr.slice(1).toLowerCase();

  return (
    <article className="lesson-card enquiry-card">
      <div className="enquiry-card__header">
        <h3 className="enquiry-card__title">From: {item.parentName}</h3>
        <span className={`badge badge--${statusLower}`}>
          {displayStatus}
        </span>
      </div>
      <p className="enquiry-card__email-wrap">
        <a href={`mailto:${item.parentEmail}`} className="enquiry-card__email">
          {item.parentEmail}
        </a>
      </p>
      <div className="enquiry-card__meta">
        <div><strong>Student:</strong> {item.studentName || 'N/A'}</div>
        <div><strong>Class:</strong> {item.studentClass || 'N/A'} - {item.studentSection || 'N/A'}</div>
      </div>
      <div className="enquiry-card__message-box">
        <strong className="enquiry-card-parent-label">Parent Message:</strong>
        <p className="enquiry-card__message-text">{item.message}</p>
      </div>
      {statusLower === 'responded' && item.responseMessage && (
        <div className="enquiry-card__response-box">
          <strong className="enquiry-card__response-label">
            {item.respondedBy === 'counsellor' ? 'Response (Counsellor):' : 'Response (Teacher):'}
          </strong>
          <p className="enquiry-card__response-text">{item.responseMessage}</p>
        </div>
      )}
      <div className="enquiry-card__footer">
        <div className="enquiry-card__timestamps">
          <small className="text-muted">
            Received: {item.createdAt ? new Date(item.createdAt).toLocaleString() : 'Unknown'}
          </small>
          {statusLower === 'responded' && item.respondedAt && (
            <small className="text-muted enquiry-card-status-success">
              Responded: {new Date(item.respondedAt).toLocaleString()}
            </small>
          )}
        </div>
        <div className="enquiry-card__actions">
          {customActions ? customActions : (
            <>
              {onDelete && (
                <button 
                  className="btn btn--ghost btn--sm enquiry-card-status-danger" 
                  onClick={() => onDelete(item.id)}
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              )}
              {onView && (
                <button 
                  className="btn btn--secondary btn--sm enquiry-card-btn-view" 
                  onClick={() => onView(item)}
                >
                  View
                </button>
              )}
              {statusLower === 'new' && (
                <Link 
                  to={`/enquiries/${item.id}/verify`}
                  className="btn btn--secondary btn--sm"
                >
                  Review Enquiry
                </Link>
              )}
              {statusLower === 'pending' && (
                <Link to={`/enquiries/${item.id}/respond`} className="btn btn--primary btn--sm">
                  Respond
                </Link>
              )}
            </>
          )}
        </div>
      </div>
    </article>
  );
};

export default EnquiryCard;
