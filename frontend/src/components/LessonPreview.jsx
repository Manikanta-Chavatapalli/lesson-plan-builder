import { useState } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// Small helper components
// ─────────────────────────────────────────────────────────────────────────────

const PreviewSection = ({ title, icon, children }) => (
  <section className="lesson-preview__section">
    <h4 className="lesson-preview__section-title">
      {icon && <span className="section-icon" aria-hidden="true">{icon}</span>}
      {title}
    </h4>
    {children}
  </section>
);

// Reusable activity list — used both in the main plan and in each day tab
const ActivityList = ({ activities }) => {
  const safeActivities = Array.isArray(activities) ? activities : [];
  if (!safeActivities.length) return <p className="text-muted">No activities listed.</p>;
  return (
    <ol className="activity-list">
      {safeActivities.map((a, i) => (
        <li key={i} className="activity-item avoid-break">
          <div className="activity-item__header">
            <span className="activity-item__order">{a.order ?? i + 1}</span>
            <div>
              <strong>{a.name || 'Activity'}</strong>
              <span className="activity-item__meta">{a.type || 'General'} · {a.duration || 'N/A'}</span>
            </div>
          </div>
          <p className="activity-item__description">{a.description || (typeof a === 'string' ? a : '')}</p>
        </li>
      ))}
    </ol>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Day content panel — shown when you click a day tab
// ─────────────────────────────────────────────────────────────────────────────

const DAY_ACCENT = {
  Monday:    { bg: '#e3f2fd', text: '#1565c0', border: '#90caf9' },
  Tuesday:   { bg: '#f3e5f5', text: '#6a1b9a', border: '#ce93d8' },
  Wednesday: { bg: '#e8f5e9', text: '#2e7d32', border: '#a5d6a7' },
  Thursday:  { bg: '#fff3e0', text: '#e65100', border: '#ffcc80' },
  Friday:    { bg: '#fce4ec', text: '#c62828', border: '#f48fb1' },
};

const DayPanel = ({ day }) => {
  const accent = DAY_ACCENT[day.dayName] || { bg: '#f5f5f5', text: '#333', border: '#ddd' };

  return (
    <div className="day-panel">
      {/* Day header strip */}
      <div
        className="day-panel__header avoid-break"
        style={{ backgroundColor: accent.bg, borderLeftColor: accent.border }}
      >
        <div className="day-panel__title-row">
          <span className="day-panel__name" style={{ color: accent.text }}>{day.dayName}</span>
          <span className="day-panel__focus-chip" style={{ color: accent.text, borderColor: accent.border }}>
            {day.focus}
          </span>
        </div>
        <p className="day-panel__approach">{day.approach}</p>
        {day.keyQuestion && (
          <p className="day-panel__key-q">
            <span className="day-panel__key-q-label">Teacher asks:</span>
            {' '}{day.keyQuestion.replace(/^Week \d+ — /, '')}
          </p>
        )}
      </div>

      {/* Did you know fact */}
      {day.contextFacts?.length > 0 && (
        <div className="day-panel__fact avoid-break">
          <span className="day-panel__fact-icon">📖</span>
          <span>{day.contextFacts[0]}</span>
        </div>
      )}

      {/* Activities */}
      <div className="day-panel__activities">
        <p className="day-panel__activities-label">Today's Activities</p>
        <ActivityList activities={day.activities} />
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Weekly plan view
// Handles TWO formats for backward compatibility:
//   New format:  weeklyDays = [{ weekNumber, weekFocus, days: [...] }, ...]
//   Old format:  weeklyDays = [{ dayName, activities, ... }, ...]  (flat array)
// ─────────────────────────────────────────────────────────────────────────────

const WeeklyPlanView = ({ weeklyDays }) => {
  const [activeWeek, setActiveWeek] = useState(0);
  const [activeDay, setActiveDay] = useState(0);

  // Detect format — new structure has a `days` array on each item
  const isMultiWeek = weeklyDays[0]?.days !== undefined;

  // Normalise to multi-week format so the rest of the component is the same
  const weeks = isMultiWeek
    ? weeklyDays
    : [{ weekNumber: 1, weekFocus: 'Weekly Plan', weekSubtopic: '', days: weeklyDays }];

  // Reset day selection when the teacher switches weeks
  const handleWeekChange = (i) => {
    setActiveWeek(i);
    setActiveDay(0);
  };

  const currentWeek = weeks[activeWeek] || weeks[0];
  const currentDay  = currentWeek?.days?.[activeDay];

  return (
    <div className="weekly-plan-view">
      {/* --- UI VIEW --- */}
      <div className="no-print">
        {/* Week tabs — only visible when there are multiple weeks */}
        {weeks.length > 1 && (
          <div className="week-tabs" role="tablist" aria-label="Week">
            {weeks.map((w, i) => (
              <button
                key={w.weekNumber}
                role="tab"
                aria-selected={i === activeWeek}
                className={`week-tab ${i === activeWeek ? 'week-tab--active' : ''}`}
                onClick={() => handleWeekChange(i)}
              >
                <span className="week-tab__number">Wk {w.weekNumber}</span>
                <span className="week-tab__label">{w.weekFocus}</span>
              </button>
            ))}
          </div>
        )}

        {/* Current week info bar */}
        {currentWeek.weekSubtopic && (
          <div className="week-info-bar">
            <span className="week-info-bar__label">Week {currentWeek.weekNumber} focus:</span>
            <span className="week-info-bar__text">{currentWeek.weekSubtopic}</span>
          </div>
        )}

        {/* Day tabs */}
        <div className="day-tabs" role="tablist" aria-label="Day">
          {currentWeek.days?.map((d, i) => {
            const accent = DAY_ACCENT[d.dayName] || {};
            return (
              <button
                key={d.dayName}
                role="tab"
                aria-selected={i === activeDay}
                className={`day-tab ${i === activeDay ? 'day-tab--active' : ''}`}
                style={i === activeDay ? { borderBottomColor: accent.text, color: accent.text } : {}}
                onClick={() => setActiveDay(i)}
              >
                <span className="day-tab__short">{d.dayName.slice(0, 3)}</span>
                <span className="day-tab__full">{d.dayName}</span>
              </button>
            );
          })}
        </div>

        {/* Day content */}
        {currentDay && <DayPanel day={currentDay} />}
      </div>

      {/* --- PRINT VIEW --- */}
      <div className="print-only">
        {weeks.map((w) => (
          <div key={w.weekNumber} className="print-week-section lesson-preview-print-week">
            <h3 className="lesson-preview-week-header">
              Week {w.weekNumber}: {w.weekFocus}
            </h3>
            {w.weekSubtopic && (
              <p className="lesson-preview-week-subtopic">{w.weekSubtopic}</p>
            )}
            <div className="print-days">
              {w.days?.map((d) => (
                <div key={d.dayName} className="print-day-section avoid-break lesson-preview-day-section">
                  <DayPanel day={d} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

const LessonPreview = ({ data, onDismiss, hideHeader = false, versionLabel }) => {
  if (!data) return null;

  const {
    weeklyPlan = {},
    weeklyDays = null,
  } = data;

  const activities = Array.isArray(data.activities) ? data.activities : [];
  const materials = Array.isArray(data.materials) ? data.materials : [];
  const learningGoals = Array.isArray(data.learningGoals) ? data.learningGoals : [];
  const lessonFlow = Array.isArray(data.lessonFlow) ? data.lessonFlow : [];
  const teacherQuestions = Array.isArray(data.teacherQuestions) ? data.teacherQuestions : [];
  const teachingTips = Array.isArray(data.teachingTips) ? data.teachingTips : [];
  const contextFacts = Array.isArray(data.contextFacts) ? data.contextFacts : [];

  // True when the backend returned a weekly plan (new or old format)
  const hasWeeklyDays = Array.isArray(weeklyDays) && weeklyDays.length > 0;

  // Figure out total weeks for display
  const totalWeeks = hasWeeklyDays && weeklyDays[0]?.days
    ? weeklyDays.length
    : hasWeeklyDays ? 1 : null;

  return (
    <article className="lesson-preview">

      {/* ── Header ── */}
      {!hideHeader && (
        <header className="lesson-preview__header">
          <div>
            <h3 className="lesson-preview__title">Lesson Preview</h3>
            <p className="lesson-preview__subtitle">Review the plan before saving</p>
          </div>
          {onDismiss && (
            <button type="button" className="btn btn--ghost btn--sm" onClick={onDismiss}>
              Dismiss
            </button>
          )}
        </header>
      )}

      {versionLabel && <div className="lesson-preview__version-badge">{versionLabel}</div>}

      {/* ── Overview ── */}
      <PreviewSection title="Lesson Overview" icon="📋">
        <div className="overview-grid">
          <div className="overview-item">
            <span className="overview-item__label">Topic</span>
            <span className="overview-item__value">{weeklyPlan.theme || '—'}</span>
          </div>
          <div className="overview-item">
            <span className="overview-item__label">Age Group</span>
            <span className="overview-item__value">{weeklyPlan.ageGroup || '—'}</span>
          </div>
          <div className="overview-item">
            <span className="overview-item__label">Approach</span>
            <span className="overview-item__value">{weeklyPlan.approach || '—'}</span>
          </div>
          <div className="overview-item">
            <span className="overview-item__label">Session</span>
            <span className="overview-item__value">{weeklyPlan.duration || '—'}</span>
          </div>
          {totalWeeks && (
            <div className="overview-item">
              <span className="overview-item__label">Duration</span>
              <span className="overview-item__value">{totalWeeks} {totalWeeks === 1 ? 'Week' : 'Weeks'}</span>
            </div>
          )}
        </div>
        {weeklyPlan.learningOutcome && (
          <div className="overview-objective">
            <strong>Objective:</strong> {weeklyPlan.learningOutcome}
          </div>
        )}
      </PreviewSection>

      {/* ── Topic Facts (single-day mode only; multi-week shows facts per day) ── */}
      {contextFacts.length > 0 && !hasWeeklyDays && (
        <PreviewSection title="Did You Know?" icon="📖">
          <ul className="fact-list">
            {contextFacts.map((f, i) => (
              <li key={i} className="fact-list__item">{f}</li>
            ))}
          </ul>
        </PreviewSection>
      )}

      {/* ── Weekly Plan (tab view) OR simple day-list ── */}
      {hasWeeklyDays ? (
        <PreviewSection title={totalWeeks > 1 ? `${totalWeeks}-Week Plan` : '5-Day Plan'} icon="📅">
          <WeeklyPlanView weeklyDays={weeklyDays} />
        </PreviewSection>
      ) : (
        <PreviewSection title="Weekly Schedule" icon="📅">
          {Array.isArray(weeklyPlan.days) && weeklyPlan.days.length > 0 ? (
            <div className="schedule-list">
              {weeklyPlan.days.map((day) => (
                <div key={day.day} className="schedule-item avoid-break">
                  <div className="schedule-item__day">{day.day}</div>
                  <div className="schedule-item__content">
                    <p className="schedule-item__focus">{day.focus}</p>
                    <span className="schedule-item__duration">{day.duration}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted">No schedule available.</p>
          )}
        </PreviewSection>
      )}

      {/* ── Learning Goals ── */}
      <PreviewSection title="Learning Goals" icon="🎯">
        {learningGoals.length ? (
          <ul className="goals-list">
            {learningGoals.map((g, i) => <li key={i}>{g}</li>)}
          </ul>
        ) : (
          <p className="text-muted">No learning goals listed.</p>
        )}
      </PreviewSection>

      {/* Activities shown only for single-day plans — weekly shows activities per day tab */}
      {!hasWeeklyDays && (
        <PreviewSection title="Activities" icon="✏️">
          <ActivityList activities={activities} />
        </PreviewSection>
      )}

      {/* ── Lesson Flow ── */}
      <PreviewSection title="Lesson Flow" icon="🔄">
        {lessonFlow.length ? (
          <ol className="flow-list">
            {lessonFlow.map((step) => (
              <li key={step.step} className="flow-item avoid-break">
                <div className="flow-item__step">{step.step}</div>
                <div className="flow-item__content">
                  <strong>{step.phase}</strong>
                  <p>{step.activity}</p>
                  <span className="flow-item__duration">{step.duration}</span>
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-muted">No flow steps available.</p>
        )}
      </PreviewSection>

      {/* ── Materials ── */}
      <PreviewSection title="Materials Required" icon="🎒">
        {materials.length ? (
          <ul className="materials-list lesson-preview-materials-list">
            {materials.map((m, i) => (
              <li key={i} className="lesson-preview-material-item">
                <input type="checkbox" id={`material-${i}`} className="lesson-preview-material-checkbox" />
                <label htmlFor={`material-${i}`} className="lesson-preview-material-label">{m}</label>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted">No materials listed.</p>
        )}
      </PreviewSection>

      {/* ── Teacher Questions ── */}
      {teacherQuestions.length > 0 && (
        <PreviewSection title="Teacher Questions" icon="❓">
          <p className="preview-section-hint">Use these to guide class discussion:</p>
          <ol className="teacher-questions-list">
            {teacherQuestions.map((q, i) => (
              <li key={i} className="teacher-question-item avoid-break">{q}</li>
            ))}
          </ol>
        </PreviewSection>
      )}

      {/* ── Teaching Tips ── */}
      {teachingTips.length > 0 && (
        <PreviewSection title="Teaching Tips" icon="💡">
          <ul className="teaching-tips-list">
            {teachingTips.map((tip, i) => (
              <li key={i} className="teaching-tip-item avoid-break">
                <span className="teaching-tip-icon" aria-hidden="true">💡</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </PreviewSection>
      )}

    </article>
  );
};

export default LessonPreview;
