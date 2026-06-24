/**
 * Applies selected recommendations and teacher improvement requests
 * to an existing generated lesson (client-side enhancement).
 */

const cloneLesson = (lesson) => JSON.parse(JSON.stringify(lesson));

const reindexActivities = (activities) =>
  activities.map((a, i) => ({ ...a, order: i + 1 }));

const reindexFlow = (flow) =>
  flow.map((s, i) => ({ ...s, step: i + 1 }));

const addActivity = (lesson, activity) => {
  lesson.activities = reindexActivities([...lesson.activities, activity]);
  if (lesson.weeklyPlan) {
    lesson.weeklyPlan.totalActivities = lesson.activities.length;
  }
  return lesson;
};

const addMaterial = (lesson, material) => {
  if (!lesson.materials.includes(material)) {
    lesson.materials = [...lesson.materials, material];
  }
  return lesson;
};

const addFlowStep = (lesson, step, insertBeforeEnd = true) => {
  const flow = [...lesson.lessonFlow];
  if (insertBeforeEnd && flow.length > 1) {
    flow.splice(flow.length - 1, 0, step);
  } else {
    flow.push(step);
  }
  lesson.lessonFlow = reindexFlow(flow);
  return lesson;
};

const addLearningGoal = (lesson, goal) => {
  if (!lesson.learningGoals.includes(goal)) {
    lesson.learningGoals = [...lesson.learningGoals, goal];
  }
  return lesson;
};

const updateFridayFocus = (lesson, focus) => {
  if (lesson.weeklyPlan?.days) {
    lesson.weeklyPlan.days = lesson.weeklyPlan.days.map((d) =>
      d.day === 'Friday' ? { ...d, focus } : d
    );
  }
  return lesson;
};

const RECOMMENDATION_APPLIERS = {
  'animal-sounds': (lesson, ctx) => {
    addActivity(lesson, {
      name: `${ctx.theme} Sound Imitation`,
      type: 'Music & Movement',
      duration: '8 mins',
      description: `Children imitate ${ctx.theme} sounds before story time to build auditory recognition.`,
      order: lesson.activities.length + 1,
    });
    addMaterial(lesson, `${ctx.theme} sound cards or audio clips`);
    addFlowStep(lesson, {
      step: 0,
      phase: 'Sound Warm-up',
      duration: '8 mins',
      activity: `${ctx.theme} sound imitation — ${ctx.theme}`,
    });
    return lesson;
  },
  'color-sorting': (lesson, ctx) => {
    addActivity(lesson, {
      name: `Color Sorting: ${ctx.theme}`,
      type: 'Guided Discovery',
      duration: '10 mins',
      description: 'Children sort themed objects by color at the arrival station.',
      order: lesson.activities.length + 1,
    });
    addMaterial(lesson, 'Sorting trays and colored themed objects');
    return lesson;
  },
  'nature-walk': (lesson, ctx) => {
    addActivity(lesson, {
      name: 'Nature Observation',
      type: 'Outdoor Exploration',
      duration: '15 mins',
      description: `Explore ${ctx.theme} elements through guided nature observation.`,
      order: lesson.activities.length + 1,
    });
    addMaterial(lesson, 'Magnifying glasses and observation journal');
    if (lesson.weeklyPlan?.days) {
      lesson.weeklyPlan.days = lesson.weeklyPlan.days.map((d) =>
        d.day === 'Wednesday' ? { ...d, focus: `Nature exploration: ${ctx.theme}` } : d
      );
    }
    return lesson;
  },
  'movement-activity': (lesson, ctx) => {
    addActivity(lesson, {
      name: 'Movement Warm-up',
      type: 'Music & Movement',
      duration: '10 mins',
      description: `Action rhymes and movement games themed around ${ctx.theme}.`,
      order: lesson.activities.length + 1,
    });
    addFlowStep(lesson, {
      step: 0,
      phase: 'Movement Warm-up',
      duration: '10 mins',
      activity: `Movement-based warm-up — ${ctx.theme}`,
    }, false);
    return lesson;
  },
  'sensory-station': (lesson, ctx) => {
    addActivity(lesson, {
      name: `Sensory Station: ${ctx.theme}`,
      type: 'Sensory Play',
      duration: '12 mins',
      description: 'Tactile exploration station with themed sensory bins and textures.',
      order: lesson.activities.length + 1,
    });
    addMaterial(lesson, 'Sensory bins, textured materials, and scoops');
    return lesson;
  },
  'pair-sharing': (lesson) => {
    addFlowStep(lesson, {
      step: 0,
      phase: 'Pair Sharing',
      duration: '5 mins',
      activity: 'Children share one thing they learned with a partner.',
    });
    addLearningGoal(lesson, 'Practice verbal expression through peer sharing');
    return lesson;
  },
  'visual-chart': (lesson, ctx) => {
    addMaterial(lesson, `${ctx.theme} weekly progress chart`);
    addLearningGoal(lesson, 'Track and review weekly theme progress on the visual chart');
    return lesson;
  },
  'outcome-check': (lesson, ctx) => {
    addFlowStep(lesson, {
      step: 0,
      phase: 'Learning Check',
      duration: '3 mins',
      activity: `Thumbs-up check: "${ctx.learningOutcome?.slice(0, 50) || 'learning goal'}"`,
    });
    return lesson;
  },
  'group-challenge': (lesson, ctx) => {
    addActivity(lesson, {
      name: `Group Challenge: ${ctx.theme}`,
      type: 'Collaborative Project',
      duration: '15 mins',
      description: 'Small groups complete a themed task together and present to the class.',
      order: lesson.activities.length + 1,
    });
    addMaterial(lesson, 'Group task cards and presentation space');
    return lesson;
  },
  'story-circle': (lesson, ctx) => {
    addActivity(lesson, {
      name: `Story Circle: ${ctx.theme}`,
      type: 'Story Circle',
      duration: '12 mins',
      description: `Themed story time with picture cards about ${ctx.theme}.`,
      order: lesson.activities.length + 1,
    });
    addMaterial(lesson, `${ctx.theme} picture book or story cards`);
    return lesson;
  },
};

const parseTeacherRequest = (text) => text.toLowerCase();

export const applyLessonEnhancements = (lesson, selectedRecommendations, teacherRequest, inputs) => {
  let enhanced = cloneLesson(lesson);
  const ctx = { ...inputs };

  // Apply user-provided materials to the lesson
  if (ctx.materials?.trim()) {
    const userMaterials = ctx.materials.split(',').map(m => m.trim()).filter(m => m);
    userMaterials.forEach(material => addMaterial(enhanced, material));
  }

  // Adjust weekly plan based on number of weeks
  if (ctx.weeks && enhanced.weeklyPlan?.days) {
    const weeks = parseInt(ctx.weeks, 10);
    const baseDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const allDays = [];
    for (let w = 1; w <= weeks; w++) {
      baseDays.forEach(day => {
        allDays.push({ day: `Week ${w} - ${day}`, focus: `Week ${w} activities`, duration: ctx.duration ? `${ctx.duration} mins` : '45 mins' });
      });
    }
    enhanced.weeklyPlan.days = allDays;
    enhanced.weeklyPlan.totalWeeks = weeks;
  }

  // Adjust activity durations based on session duration
  if (ctx.duration && enhanced.activities?.length > 0) {
    const totalDuration = parseInt(ctx.duration, 10);
    const activityCount = enhanced.activities.length;
    if (activityCount > 0) {
      const avgDuration = Math.floor(totalDuration / activityCount);
      enhanced.activities = enhanced.activities.map((activity, index) => {
        const duration = index === activityCount - 1 
          ? `${totalDuration - (avgDuration * (activityCount - 1))} mins`
          : `${avgDuration} mins`;
        return { ...activity, duration };
      });
    }
  }

  // Adjust lesson flow durations based on session duration
  if (ctx.duration && enhanced.lessonFlow?.length > 0) {
    const totalDuration = parseInt(ctx.duration, 10);
    const flowCount = enhanced.lessonFlow.length;
    if (flowCount > 0) {
      const avgDuration = Math.floor(totalDuration / flowCount);
      enhanced.lessonFlow = enhanced.lessonFlow.map((step, index) => {
        const duration = index === flowCount - 1
          ? `${totalDuration - (avgDuration * (flowCount - 1))} mins`
          : `${avgDuration} mins`;
        return { ...step, duration };
      });
    }
  }

  // Adjust activity types based on teaching style
  if (ctx.teachingStyle && enhanced.activities?.length > 0) {
    enhanced.activities = enhanced.activities.map(activity => {
      let type = activity.type;
      switch (ctx.teachingStyle) {
        case 'Activity-based':
          if (!type.includes('Activity') && !type.includes('Movement')) {
            type = 'Activity-based Learning';
          }
          break;
        case 'Play-based':
          if (!type.includes('Play') && !type.includes('Game')) {
            type = 'Play-based Learning';
          }
          break;
        case 'Structured':
          if (!type.includes('Structured') && !type.includes('Guided')) {
            type = 'Structured Learning';
          }
          break;
        case 'Mixed':
          // Keep original types for mixed approach
          break;
      }
      return { ...activity, type };
    });
  }

  // Apply selected recommendations
  for (const rec of selectedRecommendations) {
    const applier = RECOMMENDATION_APPLIERS[rec.id];
    if (applier) {
      enhanced = applier(enhanced, ctx);
    }
  }

  // Apply teacher improvement request
  if (teacherRequest?.trim()) {
    const request = parseTeacherRequest(teacherRequest);

    if (request.includes('sensory')) {
      RECOMMENDATION_APPLIERS['sensory-station'](enhanced, ctx);
    }
    if (request.includes('movement') || request.includes('active')) {
      RECOMMENDATION_APPLIERS['movement-activity'](enhanced, ctx);
    }
    if (request.includes('puppet')) {
      addActivity(enhanced, {
        name: `Puppet Show: ${ctx.theme}`,
        type: 'Creative Arts',
        duration: '15 mins',
        description: 'Use puppets to act out theme-related stories and scenarios.',
        order: enhanced.activities.length + 1,
      });
      addMaterial(enhanced, 'Theme puppets or sock puppets');
    }
    if (request.includes('participation') || request.includes('group')) {
      RECOMMENDATION_APPLIERS['group-challenge'](enhanced, ctx);
    }
    if (request.includes('assessment') && request.includes('friday')) {
      updateFridayFocus(enhanced, `Assessment & review: ${ctx.theme}`);
      addActivity(enhanced, {
        name: 'Friday Assessment Activity',
        type: 'Assessment Circle',
        duration: '10 mins',
        description: 'Quick assessment activity to evaluate weekly learning progress.',
        order: enhanced.activities.length + 1,
      });
    } else if (request.includes('assessment')) {
      addActivity(enhanced, {
        name: 'Learning Assessment',
        type: 'Assessment Circle',
        duration: '8 mins',
        description: 'Brief assessment to check understanding of the learning outcome.',
        order: enhanced.activities.length + 1,
      });
    }
    if (request.includes('reduce') && request.includes('story')) {
      enhanced.lessonFlow = enhanced.lessonFlow.map((step) =>
        /story/i.test(step.phase + step.activity)
          ? { ...step, duration: '8 mins', activity: `${step.activity} (shortened)` }
          : step
      );
    }
    if (request.includes('story') && !request.includes('reduce')) {
      RECOMMENDATION_APPLIERS['story-circle'](enhanced, ctx);
    }

    addLearningGoal(
      enhanced,
      `Teacher request applied: ${teacherRequest.trim().slice(0, 100)}${teacherRequest.length > 100 ? '…' : ''}`
    );
  }

  // Apply additional notes from form
  if (ctx.notes?.trim()) {
    addLearningGoal(enhanced, `Teacher notes: ${ctx.notes.trim().slice(0, 100)}${ctx.notes.length > 100 ? '…' : ''}`);
  }

  enhanced.activities = reindexActivities(enhanced.activities);
  enhanced.lessonFlow = reindexFlow(enhanced.lessonFlow);

  return enhanced;
};

export default applyLessonEnhancements;
