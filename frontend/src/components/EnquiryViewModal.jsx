import React from 'react';

const EnquiryViewModal = ({ selectedEnquiry, onClose, onDelete, onAccept }) => {
  if (!selectedEnquiry) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>&times;</button>
        <h2 className="enquiry-modal-title">Enquiry Details</h2>
        
        <div className="modal-section-divider">
          <div className="modal-grid">
            <div>
              <div className="text-muted enquiry-modal-label">Parent</div>
              <div className="enquiry-modal-value">{selectedEnquiry.parentName}</div>
              <a href={`mailto:${selectedEnquiry.parentEmail}`} className="enquiry-modal-email">{selectedEnquiry.parentEmail}</a>
            </div>
            <div>
              <div className="text-muted enquiry-modal-label">Student</div>
              <div className="enquiry-modal-value">{selectedEnquiry.studentName || 'N/A'}</div>
              <div className="enquiry-modal-class-info">Class: {selectedEnquiry.studentClass || 'N/A'} {selectedEnquiry.studentSection ? `(${selectedEnquiry.studentSection})` : ''}</div>
            </div>
          </div>
        </div>

        <div className="modal-message-wrap">
          <h3 className="modal-message-title-styled">Message</h3>
          <div className="modal-message-box-styled">
            <p className="modal-message-text">{selectedEnquiry.enquiryMessage || selectedEnquiry.message}</p>
          </div>
        </div>

        {selectedEnquiry.status?.toLowerCase() === 'responded' && selectedEnquiry.responseMessage && (
          <div className="modal-response-wrap">
            <h3 className="modal-response-title">Response</h3>
            <div className="modal-response-box">
              <p className="modal-message-text">{selectedEnquiry.responseMessage}</p>
              <small className="modal-timestamp">
                Responded at: {new Date(selectedEnquiry.respondedAt).toLocaleString()}
              </small>
            </div>
          </div>
        )}

        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
          {onAccept && (
            <button className="btn btn--primary" onClick={onAccept}>Accept Enquiry</button>
          )}
          {onDelete && (
            <button className="btn btn--danger" onClick={onDelete}>Delete Enquiry</button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnquiryViewModal;
