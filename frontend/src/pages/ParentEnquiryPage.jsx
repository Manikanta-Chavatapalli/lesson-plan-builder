import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/axios.js';
import FormField from '../components/FormField.jsx';
import ErrorAlert from '../components/ErrorAlert.jsx';
import { getApiError } from '../services/index.js';

const ParentEnquiryPage = () => {
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState([]);
  const [fetchingTeachers, setFetchingTeachers] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    parentName: '',
    parentEmail: '',
    studentName: '',
    studentClass: '',
    studentSection: '',
    message: '',
    teacherEmail: '',
    roleTarget: 'teacher'
  });

  useEffect(() => {
    apiClient.get('/enquiries/teachers')
      .then(res => {
        console.log('Dynamic Teachers fetched from DB:', res.data.data);
        setTeachers(res.data.data);
      })
      .catch(err => {
        console.error('Error fetching teachers from DB:', err);
        setError('Failed to load teachers list. ' + getApiError(err).message);
      })
      .finally(() => {
        setFetchingTeachers(false);
      });
  }, []);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      !form.parentName ||
      !form.parentEmail ||
      !form.studentName ||
      !form.studentClass ||
      !form.message
    ) {
      setError('Please fill in all required fields');
      return;
    }
    if (form.roleTarget === 'teacher' && !form.teacherEmail) {
      setError('Please select a teacher');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await apiClient.post('/enquiries', form);
      setSuccess(true);
    } catch (err) {
      setError(getApiError(err).message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="auth-page auth-page-gradient">
        <div className="auth-card-success">
          <div className="auth-success-icon-wrap">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          <h2 className="auth-success-title">Enquiry Sent!</h2>
          <p className="text-muted auth-success-text">
            Thank you for reaching out to FirstCry Intellitots. The teacher has been notified and will get back to you soon.
          </p>
          <button className="btn btn--primary" onClick={() => navigate('/')}>
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page auth-page-gradient">
      <div className="auth-card-wide">
        
        <div className="auth-header-wrap">
          <div className="auth-header-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              <path d="M21 8a2 2 0 0 0-2-2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
          </div>
          <h2 className="auth-page-title-enquiry">Parent Enquiry</h2>
          <p className="text-muted auth-page-subtitle-enquiry">Have a question? We'd love to hear from you.</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          
          <div className="auth-form-section">
            <h3 className="auth-form-section-title">Parent Details</h3>
            <div className="auth-form-grid">
              <FormField
                label="Your Name"
                name="parentName"
                value={form.parentName}
                onChange={handleChange}
                placeholder="Name"
                required
              />
              <FormField
                label="Email Address"
                name="parentEmail"
                type="email"
                value={form.parentEmail}
                onChange={handleChange}
                placeholder="Email"
                required
              />
            </div>
          </div>

          <div className="auth-form-section">
            <h3 className="auth-form-section-title">Student Details</h3>
            <FormField
              label="Student Name"
              name="studentName"
              value={form.studentName}
              onChange={handleChange}
              placeholder="Child's full name"
              required
            />
            <div className="auth-form-grid auth-form-grid-spaced">
              <FormField
                label="Class / Grade"
                name="studentClass"
                type="select"
                value={form.studentClass}
                onChange={handleChange}
                required
                options={[
                  { value: '', label: '-- Select Class --' },
                  { value: 'Pre-Nursery', label: 'Pre-Nursery' },
                  { value: 'Nursery', label: 'Nursery' },
                  { value: 'LKG', label: 'LKG' },
                  { value: 'UKG', label: 'UKG' },
                  { value: 'Class 1', label: 'Class 1' },
                  { value: 'Class 2', label: 'Class 2' },
                  { value: 'Class 3', label: 'Class 3' },
                  { value: 'Class 4', label: 'Class 4' },
                  { value: 'Class 5', label: 'Class 5' }
                ]}
              />
              <FormField
                label="Section (Optional)"
                name="studentSection"
                type="select"
                value={form.studentSection}
                onChange={handleChange}
                options={[
                  { value: '', label: '-- Select Section --' },
                  { value: 'A', label: 'Section A' },
                  { value: 'B', label: 'Section B' },
                  { value: 'C', label: 'Section C' },
                  { value: 'D', label: 'Section D' }
                ]}
              />
            </div>
          </div>

          <div className="auth-form-section">
            <h3 className="auth-form-section-title">Enquiry Details</h3>
          
          <div className="auth-form-group">
            <label className="auth-form-label">Who would you like to contact?</label>
            <div className="auth-radio-group">
              <label className="auth-radio-label">
                <input
                  type="radio"
                  name="roleTarget"
                  value="teacher"
                  checked={form.roleTarget === 'teacher'}
                  onChange={handleChange}
                />
                Specific Teacher
              </label>
              <label className="auth-radio-label">
                <input
                  type="radio"
                  name="roleTarget"
                  value="counsellor"
                  checked={form.roleTarget === 'counsellor'}
                  onChange={handleChange}
                />
                Counsellor (Direct Enquiry)
              </label>
            </div>
          </div>

          {form.roleTarget === 'teacher' && (
            <FormField
              label="Select Teacher"
              name="teacherEmail"
              type="select"
              value={form.teacherEmail}
              onChange={handleChange}
              required
              disabled={fetchingTeachers}
              options={
                fetchingTeachers
                  ? [{ value: '', label: 'Loading teachers from database...' }]
                  : [
                      { value: '', label: '-- Choose a Teacher --' },
                      ...teachers.map(t => ({ value: t.email, label: `${t.name} (${t.email})` }))
                    ]
              }
            />
          )}
          
          <FormField
            label="Message"
            name="message"
            as="textarea"
            value={form.message}
            onChange={handleChange}
            rows={4}
            placeholder="How can we help you today?"
            required
          />
          </div>
          
          <ErrorAlert message={error} onDismiss={() => setError('')} />

          <div className="auth-form-actions">
            <button type="submit" className="btn btn--primary btn-submit-enquiry" disabled={loading}>
              {loading ? (
                <span className="auth-spinner-wrapper">
                  <svg className="spinner spinner-animated" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="2" x2="12" y2="6"></line>
                    <line x1="12" y1="18" x2="12" y2="22"></line>
                    <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
                    <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
                    <line x1="2" y1="12" x2="6" y2="12"></line>
                    <line x1="18" y1="12" x2="22" y2="12"></line>
                    <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
                    <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
                  </svg>
                  Sending...
                </span>
              ) : 'Submit Enquiry'}
            </button>
            <button 
                type="button" 
                className="btn btn--ghost" 
                onClick={() => navigate('/')}
              >
                Cancel </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ParentEnquiryPage;
