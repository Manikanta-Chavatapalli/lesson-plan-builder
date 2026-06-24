/**
 * Rule-based teaching recommendation engine.
 * Generates 3–5 practical recommendations from lesson context.
 */

const parseMinAge = (ageGroup) => {
  const match = ageGroup?.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 4;
};

const hasActivityType = (activities, pattern) =>
  activities.some((a) => pattern.test(`${a.type} ${a.name} ${a.description}`));

const hasFlowPhase = (lessonFlow, pattern) =>
  lessonFlow.some((s) => pattern.test(`${s.phase} ${s.activity}`));

export const generateTeachingRecommendations = (lesson, inputs) => {
  const { ageGroup = '', theme = '', learningOutcome = '' } = inputs;
  const activities = lesson?.activities || [];
  const lessonFlow = lesson?.lessonFlow || [];
  const themeLower = theme.toLowerCase();
  const minAge = parseMinAge(ageGroup);
  const pool = [];

  if (themeLower.includes('animal')) {
    pool.push({
      id: 'animal-sounds',
      recommendation: `Add ${theme} sound imitation before story time.`,
      reason:
        'This helps children connect sounds with animal identification and improves engagement.',
    });
  }

  if (themeLower.includes('color') || themeLower.includes('colour')) {
    pool.push({
      id: 'color-sorting',
      recommendation: 'Include a color sorting table with themed objects at arrival.',
      reason: 'Hands-on sorting reinforces color recognition and eases children into the lesson.',
    });
  }

  if (themeLower.includes('nature') || themeLower.includes('plant')) {
    pool.push({
      id: 'nature-walk',
      recommendation: 'Begin Wednesday with a short nature observation walk or tray exploration.',
      reason: 'Direct contact with natural materials deepens theme understanding and curiosity.',
    });
  }

  if (!hasActivityType(activities, /movement|music|dance|action/i)) {
    pool.push({
      id: 'movement-activity',
      recommendation: 'Add a movement-based warm-up activity before the core lesson.',
      reason: 'Improves participation and helps children release energy before focused learning.',
    });
  }

  if (minAge <= 4 && !hasActivityType(activities, /sensory/i)) {
    pool.push({
      id: 'sensory-station',
      recommendation: 'Include a sensory exploration station with themed tactile materials.',
      reason: 'Sensory play strengthens retention and supports hands-on learning for early learners.',
    });
  }

  if (!hasFlowPhase(lessonFlow, /share|reflect|discuss/i)) {
    pool.push({
      id: 'pair-sharing',
      recommendation: 'Add a brief pair-sharing moment after the main activity.',
      reason: 'Encourages classroom interaction and verbal expression of what was learned.',
    });
  }

  pool.push({
    id: 'visual-chart',
    recommendation: `Display a ${theme || 'theme'} progress chart that children update daily.`,
    reason: 'Visual anchors improve retention and give children a reference for weekly review.',
  });

  if (learningOutcome) {
    pool.push({
      id: 'outcome-check',
      recommendation: 'Close each session with a quick thumbs-up check for the learning goal.',
      reason: `Helps verify daily progress toward: "${learningOutcome.slice(0, 80)}${learningOutcome.length > 80 ? '…' : ''}"`,
    });
  }

  if (minAge >= 5) {
    pool.push({
      id: 'group-challenge',
      recommendation: 'Add a small-group challenge that applies the theme to a shared task.',
      reason: 'Structured group work builds collaboration and strengthens learning outcomes.',
    });
  }

  if (!hasActivityType(activities, /story|circle/i)) {
    pool.push({
      id: 'story-circle',
      recommendation: `Include a themed story circle using ${theme} picture cards.`,
      reason: 'Story time connects the theme to language development and group listening skills.',
    });
  }

  const unique = pool.filter(
    (rec, index, arr) => arr.findIndex((r) => r.id === rec.id) === index
  );

  const count = Math.min(5, Math.max(3, unique.length));
  return unique.slice(0, count);
};

export default generateTeachingRecommendations;
