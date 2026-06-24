import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';

import { useRef } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import ErrorAlert from '../components/ErrorAlert.jsx';
import EmptyState from '../components/EmptyState.jsx';
import FormField from '../components/FormField.jsx';
import LessonPreview from '../components/LessonPreview.jsx';
import {
  getLessonPlanById,
  updateLessonPlan,
} from '../api/lessonPlan.api.js';
import {
  generateRecommendations,
  getRecommendationsByLessonId,
  applyRecommendation,
} from '../api/recommendation.api.js';
import { getApiError } from '../services/index.js';
import { validateLessonPlanForm } from '../utils/validation.js';

import html2pdf from 'html2pdf.js';

const LessonDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [plan, setPlan] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({});
  const [formErrors, setFormErrors] = useState({});
  const printRef = useRef();

  const handlePrint = () => {
    if (!printRef.current) return;
    
    // Temporarily add a class to the body so the CSS media query for print applies
    // Since html2pdf uses screen media by default, we just toggle visibility classes directly on the element
    const container = printRef.current;
    
    // Create a wrapper div to clone the content without messing up the UI
    const clone = container.cloneNode(true);
    
    // Ensure the clone forces light theme so the PDF text isn't light/grey on dark backgrounds
    clone.setAttribute('data-theme', 'light');
    
    // html2canvas clones the target element into an iframe, ignoring parent styles.
    // We must inject a style block directly into the clone to guarantee variables and page-breaks are applied.
    const styleBlock = document.createElement('style');
    styleBlock.innerHTML = `
      .print-container, .print-container * {
        --color-bg: #ffffff !important;
        --color-surface: #ffffff !important;
        --color-text: #0f172a !important;
        --color-text-muted: #334155 !important;
        --color-border: #e2e8f0 !important;
        --color-primary: #4f46e5 !important;
      }
      .print-container {
        background-color: #ffffff !important;
        color: #0f172a !important;
      }
      .avoid-break {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
        display: block !important;
      }
      h3, h4, .lesson-preview__section-title, .day-panel__activities-label {
        page-break-after: avoid !important;
        break-after: avoid !important;
      }
    `;
    clone.prepend(styleBlock);
    
    // In the clone, hide .no-print and show .print-only
    const noPrintElems = clone.querySelectorAll('.no-print');
    noPrintElems.forEach(el => el.style.setProperty('display', 'none', 'important'));
    
    const printOnlyElems = clone.querySelectorAll('.print-only');
    printOnlyElems.forEach(el => el.style.setProperty('display', 'block', 'important'));
    
    // Create a temporary off-screen container for html2pdf to render
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    tempContainer.style.top = '-9999px';
    tempContainer.style.width = '800px'; // Set a fixed width to ensure good layout
    
    tempContainer.appendChild(clone);
    document.body.appendChild(tempContainer);
    
    const opt = {
      margin:       10,
      filename:     `Lesson_Plan_${plan?.theme?.replace(/\s+/g, '_') || id}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak:    { mode: ['css', 'legacy'], avoid: ['.avoid-break'] }
    };

    setSubmitting(true);
    html2pdf().set(opt).from(clone).save().then(() => {
      document.body.removeChild(tempContainer);
      setSubmitting(false);
    }).catch(err => {
      console.error('PDF Generation Error:', err);
      document.body.removeChild(tempContainer);
      setSubmitting(false);
      setError('Failed to generate PDF. Please try again.');
    });
  };

  const loadData = async () => {
    const [planRes, recRes] = await Promise.all([
      getLessonPlanById(id),
      getRecommendationsByLessonId(id),
    ]);
    setPlan(planRes.data);
    setForm(planRes.data);
    setRecommendations(Array.isArray(recRes.data) ? recRes.data : []);
  };

  useEffect(() => {
    (async () => {
      try {
        await loadData();
      } catch (err) {
        setError(getApiError(err).message);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFormErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    const validationErrors = validateLessonPlanForm(form);
    if (Object.keys(validationErrors).length) {
      setFormErrors(validationErrors);
      return;
    }

    setSubmitting(true);
    try {
      const response = await updateLessonPlan(id, {
        ...form,
        weekNumber: Number(form.weekNumber),
      });
      setPlan(response.data);
      setEditMode(false);
      setSuccess('Lesson plan updated');
    } catch (err) {
      setError(getApiError(err).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGenerateRecommendations = async () => {
    setSubmitting(true);
    setError('');
    try {
      await generateRecommendations({
        ageGroup: plan.ageGroup,
        theme: plan.theme,
        learningOutcome: plan.learningOutcome,
        existingLessonPlanId: plan.id,
      });
      setSuccess('Recommendations generated');
      const recRes = await getRecommendationsByLessonId(id);
      setRecommendations(Array.isArray(recRes.data) ? recRes.data : []);
    } catch (err) {
      setError(getApiError(err).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleApply = async (recommendationId, action) => {
    setSubmitting(true);
    try {
      await applyRecommendation({
        recommendationId,
        action,
        attachToLessonPlan: action === 'accept',
      });
      setSuccess(`Recommendation ${action}ed`);
      await loadData();
    } catch (err) {
      setError(getApiError(err).message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading lesson plan..." />;
  if (!plan) {
    return (
      <EmptyState
        title="Lesson plan not found"
        description="This plan may have been deleted."
        action={<Link to="/lesson-plans" className="btn btn--secondary">Back to plans</Link>}
      />
    );
  }

  return (
    <div>
      <PageHeader
        title={plan.theme}
        subtitle={`${plan.ageGroup} · Week ${plan.weekNumber}`}
        actions={
          <>
            <button type="button" className="btn btn--ghost" onClick={() => navigate('/lesson-plans')}>Back</button>
            <button type="button" className="btn btn--secondary" onClick={() => setEditMode(!editMode)}>
              {editMode ? 'Cancel Edit' : 'Edit'}
            </button>
            <button type="button" className="btn btn--secondary" onClick={handlePrint} disabled={editMode}>
              Download PDF
            </button>
            <button type="button" className="btn btn--primary" onClick={handleGenerateRecommendations} disabled={submitting}>
              Get Recommendations
            </button>
          </>
        }
      />

      <ErrorAlert message={error} onDismiss={() => setError('')} />
      {success && <div className="success-alert" role="status">{success}</div>}

      <section className="card">
        {editMode ? (
          <form onSubmit={handleUpdate} className="form-grid" noValidate>
            <FormField label="Age Group" name="ageGroup" value={form.ageGroup} onChange={handleChange} error={formErrors.ageGroup} required />
            <FormField label="Theme" name="theme" value={form.theme} onChange={handleChange} error={formErrors.theme} required />
            <FormField label="Learning Outcome" name="learningOutcome" value={form.learningOutcome} onChange={handleChange} error={formErrors.learningOutcome} required />
            <FormField label="Week Number" name="weekNumber" type="number" value={form.weekNumber} onChange={handleChange} error={formErrors.weekNumber} required />
            <FormField label="Duration" name="duration" value={form.duration} onChange={handleChange} error={formErrors.duration} required />
            <FormField label="Notes" name="notes" as="textarea" value={form.notes || ''} onChange={handleChange} />
            <div className="form-actions">
              <button type="submit" className="btn btn--primary" disabled={submitting}>Save Changes</button>
            </div>
          </form>
        ) : (
          <>
            <dl className="detail-list lesson-detail-list">
              <div><dt>Status</dt><dd><span className={`badge badge--${plan.status?.toLowerCase()}`}>{plan.status}</span></dd></div>
              <div><dt>Learning Outcome</dt><dd>{plan.learningOutcome}</dd></div>
              <div><dt>Duration</dt><dd>{plan.duration}</dd></div>
              <div><dt>Notes</dt><dd>{plan.notes || '—'}</dd></div>
            </dl>
            <div ref={printRef} className="print-container">
              {plan.weeklyPlan ? (
                <LessonPreview data={plan} hideHeader />
              ) : (
                <EmptyState
                  title="Legacy Lesson Plan"
                  description="This plan was saved before full data preservation was enabled. Detailed preview is not available."
                />
              )}
            </div>
          </>
        )}
      </section>

      <section className="card">
        <h3>Recommendations</h3>
        {recommendations.length > 0 ? (
          recommendations.map((rec) => (
            <div key={rec.id} className="recommendation-item">
              <div className="recommendation-item__header">
                <strong>Status: {rec.status}</strong>
                {rec.status === 'Pending' && (
                  <div className="recommendation-item__actions">
                    <button type="button" className="btn btn--primary btn--sm" onClick={() => handleApply(rec.id, 'accept')} disabled={submitting}>Accept</button>
                    <button type="button" className="btn btn--danger btn--sm" onClick={() => handleApply(rec.id, 'reject')} disabled={submitting}>Reject</button>
                  </div>
                )}
              </div>
              <p className="text-muted">{rec.activities?.length || 0} activities · {rec.teachingTips?.length || 0} tips</p>
            </div>
          ))
        ) : (
          <div className="recommendations-success-box">
            <p className="recommendations-success-text">
              ✓ All teaching recommendations have been applied!
            </p>
          </div>
        )}
      </section>
    </div>
  );
};

export default LessonDetailPage;
