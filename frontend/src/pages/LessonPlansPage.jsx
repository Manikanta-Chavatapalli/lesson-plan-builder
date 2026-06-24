import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import ErrorAlert from '../components/ErrorAlert.jsx';
import EmptyState from '../components/EmptyState.jsx';
import FormField from '../components/FormField.jsx';
import LessonPreview from '../components/LessonPreview.jsx';
import {
  getLessonPlans,
  createLessonPlan,
  deleteLessonPlan,
} from '../api/lessonPlan.api.js';
import { generateLesson } from '../api/lessonGeneration.api.js';
import { getApiError } from '../services/index.js';
import { generateTeachingRecommendations } from '../services/teachingRecommendation.service.js';
import { applyLessonEnhancements } from '../services/lessonEnhancement.service.js';
import { validateGenerationForm } from '../utils/validation.js';
import { formatDate } from '../utils/index.js';

const EMPTY_GENERATE = {
  ageGroup: '',
  theme: '',
  learningOutcome: '',
  planFormat: 'single',
  classSize: '',
  duration: '',
  materials: '',
  teachingStyle: '',
  notes: '',
};

const LessonPlansPage = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showGenerate, setShowGenerate] = useState(false);
  const [genForm, setGenForm] = useState(EMPTY_GENERATE);
  const [genErrors, setGenErrors] = useState({});

  const [generationInputs, setGenerationInputs] = useState(null);
  const [lessonData, setLessonData] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [selectedRecommendationIds, setSelectedRecommendationIds] = useState([]);
  const [improvementRequest, setImprovementRequest] = useState('');
  const [appliedRecs, setAppliedRecs] = useState([]);
  const [appliedImprovements, setAppliedImprovements] = useState([]);

  const fetchPlans = async () => {
    const response = await getLessonPlans();
    setPlans(Array.isArray(response.data) ? response.data : []);
  };

  const updateRecommendations = useCallback((lessonData, inputs, currentAppliedRecs = []) => {
    const newRecs = generateTeachingRecommendations(lessonData, inputs);
    setRecommendations(newRecs.filter(r => !currentAppliedRecs.find(a => a.id === r.id)));
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await fetchPlans();
      } catch (err) {
        setError(getApiError(err).message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const resetWorkflow = () => {
    setGenerationInputs(null);
    setLessonData(null);
    setRecommendations([]);
    setSelectedRecommendationIds([]);
    setImprovementRequest('');
    setAppliedRecs([]);
    setAppliedImprovements([]);
    setShowGenerate(false);
  };

  const handleGenChange = (e) => {
    const { name, value, type, checked } = e.target;
    setGenForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    setGenErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    const validationErrors = validateGenerationForm(genForm);
    if (Object.keys(validationErrors).length) {
      setGenErrors(validationErrors);
      return;
    }

    setSubmitting(true);
    setError('');
    resetWorkflow();

    const isWeekly = genForm.planFormat !== 'single';
    const numWeeks = isWeekly ? Number(genForm.planFormat) : 1;

    const inputs = {
      ageGroup: genForm.ageGroup.trim(),
      theme: genForm.theme.trim(),
      learningOutcome: genForm.learningOutcome.trim(),
      weeks: numWeeks,
      weekly: isWeekly,
      classSize: genForm.classSize ? Number(genForm.classSize) : null,
      duration: genForm.duration ? Number(genForm.duration) : null,
      materials: genForm.materials.trim(),
      teachingStyle: genForm.teachingStyle,
      notes: genForm.notes.trim(),
    };

    try {
      const response = await generateLesson(inputs);
      const lessonData = response.data;

      setGenerationInputs(inputs);
      setLessonData(lessonData);
      updateRecommendations(lessonData, inputs);
      setSuccess('Lesson generated — review the plan below before saving');
    } catch (err) {
      setError(getApiError(err).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleRecommendation = (recId) => {
    setSelectedRecommendationIds((prev) =>
      prev.includes(recId) ? prev.filter((id) => id !== recId) : [...prev, recId]
    );
  };

  const handleImprovementChange = (text) => {
    setImprovementRequest(text);
  };

  const handleRegenerate = async () => {
    if (!generationInputs) return;

    setSubmitting(true);
    setError('');

    try {
      let currentInputs = { ...generationInputs };
      const reqText = improvementRequest.toLowerCase();
      
      const weeksMatch = reqText.match(/(\d+)\s*week/);
      if (weeksMatch) {
        currentInputs.weekly = true;
        currentInputs.weeks = parseInt(weeksMatch[1], 10);
      }

      const currentSelectedRecs = recommendations.filter((r) =>
        selectedRecommendationIds.includes(r.id)
      );

      const allAppliedRecs = [...appliedRecs];
      currentSelectedRecs.forEach(r => {
        if (!allAppliedRecs.find(a => a.id === r.id)) allAppliedRecs.push(r);
      });

      const allImprovements = [...appliedImprovements];
      if (improvementRequest.trim()) {
        allImprovements.push(improvementRequest.trim());
      }

      const response = await generateLesson(currentInputs);
      let lessonData = response.data;

      const hasEnhancements = allAppliedRecs.length > 0 || allImprovements.length > 0;

      if (hasEnhancements) {
        lessonData = applyLessonEnhancements(
          lessonData,
          allAppliedRecs,
          allImprovements.join('\n'),
          generationInputs
        );
      }

      setLessonData(lessonData);
      setSelectedRecommendationIds([]);
      setImprovementRequest('');
      setAppliedRecs(allAppliedRecs);
      setAppliedImprovements(allImprovements);
      setGenerationInputs(currentInputs);
      
      updateRecommendations(lessonData, currentInputs, allAppliedRecs);
      setSuccess('Plan regenerated with your selected improvements');
    } catch (err) {
      setError(getApiError(err).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSave = async () => {
    if (!lessonData?.weeklyPlan) return;

    const { weeklyPlan } = lessonData;
    const appliedRecsNames = [...appliedRecs, ...recommendations.filter((r) => selectedRecommendationIds.includes(r.id))].map((r) => r.recommendation);
    
    const allImprovementsText = [...appliedImprovements, improvementRequest].filter(t => t.trim()).join('\n');

    const notesParts = [
      `Generated via Lesson Planning Assistant`,
      appliedRecsNames.length ? `Applied recommendations: ${appliedRecsNames.join('; ')}` : null,
      allImprovementsText ? `Teacher notes: ${allImprovementsText}` : null,
    ].filter(Boolean);

    setSaving(true);
    setError('');

    try {
      await createLessonPlan({
        ageGroup: weeklyPlan.ageGroup,
        theme: weeklyPlan.theme,
        learningOutcome: weeklyPlan.learningOutcome,
        weekNumber: 1,
        duration: weeklyPlan.duration || '45 mins',
        notes: notesParts.join('\n'),
        weeklyPlan: lessonData.weeklyPlan,
        activities: lessonData.activities,
        materials: lessonData.materials,
        learningGoals: lessonData.learningGoals,
        lessonFlow: lessonData.lessonFlow,
        teacherQuestions: lessonData.teacherQuestions || [],
        teachingTips: lessonData.teachingTips || [],
        contextFacts: lessonData.contextFacts || [],
        // Only include weeklyDays when present (weekly mode was requested)
        ...(lessonData.weeklyDays ? { weeklyDays: lessonData.weeklyDays } : {}),
      });
      setSuccess('Lesson plan saved successfully');
      resetWorkflow();
      setGenForm(EMPTY_GENERATE);
      await fetchPlans();
    } catch (err) {
      setError(getApiError(err).message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this lesson plan?')) return;
    try {
      await deleteLessonPlan(id);
      setSuccess('Lesson plan deleted');
      await fetchPlans();
    } catch (err) {
      setError(getApiError(err).message);
    }
  };

  if (loading) return <LoadingSpinner message="Loading lesson plans..." />;

  const hasGeneratedLesson = lessonData !== null;

  return (
    <div>
      <PageHeader
        title="Lesson Plans"
        subtitle="Create, generate, and manage preschool lesson plans"
        actions={
          !hasGeneratedLesson && (
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => setShowGenerate(!showGenerate)}
            >
              Generate Lesson
            </button>
          )
        }
      />

      <ErrorAlert message={error} onDismiss={() => setError('')} />
      {success && (
        <div className="success-alert" role="status">
          {success}
          <button type="button" onClick={() => setSuccess('')} aria-label="Dismiss">×</button>
        </div>
      )}

      {showGenerate && !hasGeneratedLesson && (
        <section className="card card--form">
          <h3>Generate Lesson</h3>
          <p className="text-muted workflow-form-intro">
            Enter your lesson details. You will review and approve the plan before saving.
          </p>
          <form onSubmit={handleGenerate} className="form-grid" noValidate>
            <FormField label="Age Group" name="ageGroup" value={genForm.ageGroup} onChange={handleGenChange} error={genErrors.ageGroup} required placeholder="Enter age group (e.g., 3-4 years)" />
            <FormField label="Theme / Topic" name="theme" value={genForm.theme} onChange={handleGenChange} error={genErrors.theme} required placeholder="Enter the lesson topic" />
            <FormField label="Learning Objectives" name="learningOutcome" value={genForm.learningOutcome} onChange={handleGenChange} error={genErrors.learningOutcome} required placeholder="Enter learning objectives" as="textarea" rows={2} />
            <FormField label="Plan Format" name="planFormat" type="select" value={genForm.planFormat} onChange={handleGenChange} error={genErrors.planFormat} required options={[{value: 'single', label: 'Single Lesson (1 Day)'}, {value: '1', label: '1 Week Plan (5 Days)'}, {value: '2', label: '2 Week Plan (10 Days)'}, {value: '3', label: '3 Week Plan (15 Days)'}, {value: '4', label: '4 Week Plan (20 Days)'}]} />
            <FormField label="Class Size" name="classSize" type="number" value={genForm.classSize} onChange={handleGenChange} error={genErrors.classSize} required placeholder="Enter class size" />
            <FormField label="Session Duration (minutes)" name="duration" type="number" value={genForm.duration} onChange={handleGenChange} error={genErrors.duration} required placeholder="Enter session duration" />
            <FormField label="Materials Available" name="materials" value={genForm.materials} onChange={handleGenChange} error={genErrors.materials} placeholder="Enter materials available" as="textarea" rows={2} />
            <FormField label="Teaching Style" name="teachingStyle" type="select" value={genForm.teachingStyle} onChange={handleGenChange} error={genErrors.teachingStyle} required options={[{value: 'Activity-based', label: 'Activity-based'}, {value: 'Play-based', label: 'Play-based'}, {value: 'Structured', label: 'Structured'}, {value: 'Mixed', label: 'Mixed'}]} />
            <FormField label="Additional Notes" name="notes" value={genForm.notes} onChange={handleGenChange} error={genErrors.notes} placeholder="Any specific requirements or preferences" as="textarea" rows={2} />
            <div className="form-actions">
              <button type="submit" className="btn btn--primary" disabled={submitting}>
                {submitting ? 'Generating...' : 'Generate Lesson'}
              </button>
            </div>
          </form>
        </section>
      )}

      {hasGeneratedLesson && (
        <section className="card card--preview">
          <header className="lesson-workflow__header">
            <div>
              <h3 className="lesson-workflow__title">Lesson Planning Assistant</h3>
              <p className="lesson-workflow__subtitle">
                Generate → Review → Improve → Save
              </p>
            </div>
            <button type="button" className="btn btn--ghost btn--sm" onClick={resetWorkflow}>
              Close
            </button>
          </header>

          <LessonPreview data={lessonData} hideHeader />

          {recommendations.length > 0 && (
            <section className="lesson-preview__section lesson-preview__section--recommendations">
              <h4 className="lesson-preview__section-title">
                <span className="section-icon" aria-hidden="true">💡</span>
                Teaching Recommendations
              </h4>
              <p className="recommendations-intro">
                Optional suggestions to improve engagement, participation, and learning outcomes.
                Select any you would like applied when regenerating.
              </p>
              <ul className="recommendations-list">
                {recommendations.map((rec) => (
                  <li key={rec.id} className="recommendation-card">
                    <label className="recommendation-card__label">
                      <input
                        type="checkbox"
                        checked={selectedRecommendationIds.includes(rec.id)}
                        onChange={() => handleToggleRecommendation(rec.id)}
                      />
                      <div className="recommendation-card__body">
                        <p className="recommendation-card__text">{rec.recommendation}</p>
                        <p className="recommendation-card__reason">
                          <strong>Reason:</strong> {rec.reason}
                        </p>
                      </div>
                    </label>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="lesson-preview__section lesson-preview__section--improve">
            <h4 className="lesson-preview__section-title">
              <span className="section-icon" aria-hidden="true">✏️</span>
              Improve This Lesson (Optional)
            </h4>
            <textarea
              className="improvement-textarea"
              value={improvementRequest}
              onChange={(e) => handleImprovementChange(e.target.value)}
              placeholder={`Examples:\n• Add more sensory activities\n• Reduce story time\n• Include puppet show activity\n• Increase group participation\n• Add assessment activity on Friday`}
              rows={5}
            />
          </section>

          <footer className="lesson-workflow__actions">
            <button
              type="button"
              className="btn btn--secondary"
              onClick={handleRegenerate}
              disabled={submitting}
            >
              {submitting ? 'Regenerating…' : 'Regenerate Plan'}
            </button>
            <button
              type="button"
              className="btn btn--primary"
              onClick={handleSave}
              disabled={saving || submitting}
            >
              {saving ? 'Saving…' : 'Save Lesson Plan'}
            </button>
          </footer>
        </section>
      )}

      {plans.length === 0 && !hasGeneratedLesson ? (
        <EmptyState
          title="No lesson plans yet"
          description="Use the generator to create your first lesson plan."
        />
      ) : (
        <div className="card-grid">
          {plans.map((plan) => {
            const isWeekly = Array.isArray(plan.weeklyDays) && plan.weeklyDays.length > 0;
            const weekCount = isWeekly && plan.weeklyDays[0]?.days
              ? plan.weeklyDays.length
              : isWeekly ? 1 : null;

            return (
              <article key={plan.id} className="lesson-card">
                <div className="lesson-card__header">
                  <h3>{plan.theme}</h3>
                  <div className="lesson-card__badges">
                    {weekCount && (
                      <span className="badge badge--weekly">{weekCount}W</span>
                    )}
                    <span className={`badge badge--${plan.status?.toLowerCase() || 'draft'}`}>
                      {plan.status}
                    </span>
                  </div>
                </div>
                <p className="text-muted">
                  {plan.ageGroup} · {weekCount ? `${weekCount} Week${weekCount > 1 ? 's' : ''}` : `Week ${plan.weekNumber}`} · {plan.duration}
                </p>
                <p>{plan.learningOutcome}</p>
                <div className="lesson-card__meta">
                  <span>Created {formatDate(plan.createdAt)}</span>
                  {plan.updatedAt && formatDate(plan.createdAt) !== formatDate(plan.updatedAt) && (
                    <span> · Updated {formatDate(plan.updatedAt)}</span>
                  )}
                </div>
                <div className="lesson-card__actions">
                  <Link to={`/lesson-plans/${plan.id}`} className="btn btn--secondary btn--sm">View</Link>
                  <button type="button" className="btn btn--danger btn--sm" onClick={() => handleDelete(plan.id)}>Delete</button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LessonPlansPage;
