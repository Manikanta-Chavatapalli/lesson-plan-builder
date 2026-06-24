import LessonPreview from './LessonPreview.jsx';

const TeachingRecommendations = ({
  recommendations,
  selectedIds,
  onToggle,
}) => {
  return (
    <section className="lesson-preview__section lesson-preview__section--recommendations">
      <h4 className="lesson-preview__section-title">
        <span className="section-icon" aria-hidden="true">💡</span>
        Teaching Recommendations
      </h4>
      <p className="recommendations-intro">
        Optional suggestions to improve engagement, participation, and learning outcomes.
        Select any you would like applied when regenerating.
      </p>
      
      {recommendations?.length > 0 ? (
        <ul className="recommendations-list">
          {recommendations.map((rec) => (
            <li key={rec.id} className="recommendation-card">
              <label className="recommendation-card__label">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(rec.id)}
                  onChange={() => onToggle(rec.id)}
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
      ) : (
        <div className="lesson-workflow-success-box">
          <p className="lesson-workflow-success-text">
            ✓ All teaching recommendations have been applied!
          </p>
        </div>
      )}
    </section>
  );
};

const VersionTabs = ({ versions, activeIndex, onSelect }) => {
  if (versions.length <= 1) return null;

  return (
    <div className="version-tabs" role="tablist" aria-label="Generation versions">
      {versions.map((version, index) => (
        <button
          key={version.id}
          type="button"
          role="tab"
          aria-selected={index === activeIndex}
          className={`version-tab${index === activeIndex ? ' version-tab--active' : ''}`}
          onClick={() => onSelect(index)}
        >
          {version.label}
          {version.isEnhanced && <span className="version-tab__badge">Enhanced</span>}
        </button>
      ))}
    </div>
  );
};

const WorkflowSteps = ({ currentStep }) => {
  const steps = ['Generate', 'Review', 'Improve', 'Regenerate', 'Save'];

  return (
    <ol className="workflow-steps">
      {steps.map((step, index) => (
        <li
          key={step}
          className={`workflow-step${index <= currentStep ? ' workflow-step--active' : ''}${index === currentStep ? ' workflow-step--current' : ''}`}
        >
          <span className="workflow-step__number">{index + 1}</span>
          <span className="workflow-step__label">{step}</span>
        </li>
      ))}
    </ol>
  );
};

const LessonGenerationWorkflow = ({
  versions,
  activeVersionIndex,
  onSelectVersion,
  recommendations,
  selectedRecommendationIds,
  onToggleRecommendation,
  improvementRequest,
  onImprovementChange,
  onRegenerate,
  onSave,
  onDismiss,
  submitting,
  saving,
  currentStep,
}) => {
  const activeVersion = versions[activeVersionIndex];
  if (!activeVersion) return null;

  return (
    <article className="lesson-workflow">
      <header className="lesson-workflow__header">
        <div>
          <h3 className="lesson-workflow__title">Lesson Planning Assistant</h3>
          <p className="lesson-workflow__subtitle">
            Generate → Review → Improve → Regenerate → Save
          </p>
        </div>
        {onDismiss && (
          <button type="button" className="btn btn--ghost btn--sm" onClick={onDismiss}>
            Close
          </button>
        )}
      </header>

      <WorkflowSteps currentStep={currentStep} />

      <VersionTabs
        versions={versions}
        activeIndex={activeVersionIndex}
        onSelect={onSelectVersion}
      />

      <LessonPreview
        data={activeVersion.data}
        versionLabel={activeVersion.label}
        hideHeader
      />

      <TeachingRecommendations
        recommendations={recommendations}
        selectedIds={selectedRecommendationIds}
        onToggle={onToggleRecommendation}
      />

      <section className="lesson-preview__section lesson-preview__section--improve">
        <h4 className="lesson-preview__section-title">
          <span className="section-icon" aria-hidden="true">✏️</span>
          Improve This Lesson (Optional)
        </h4>
        <textarea
          className="improvement-textarea"
          value={improvementRequest}
          onChange={(e) => onImprovementChange(e.target.value)}
          placeholder={`Examples:\n• Add more sensory activities\n• Reduce story time\n• Include puppet show activity\n• Increase group participation\n• Add assessment activity on Friday`}
          rows={5}
        />
      </section>

      <footer className="lesson-workflow__actions">
        <button
          type="button"
          className="btn btn--secondary"
          onClick={onRegenerate}
          disabled={submitting}
        >
          {submitting ? 'Regenerating…' : 'Regenerate Plan'}
        </button>
        <button
          type="button"
          className="btn btn--primary"
          onClick={onSave}
          disabled={saving || submitting}
        >
          {saving ? 'Saving…' : 'Save Lesson Plan'}
        </button>
      </footer>
    </article>
  );
};

export default LessonGenerationWorkflow;
