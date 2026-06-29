import lessonPlanModel from '../models/lessonPlan.model.js';
import { AppError } from '../errors/AppError.js';
import { HTTP_STATUS } from '../constants/index.js';
import { EXTENDED_KNOWLEDGE_MAP, CATEGORY_OVERRIDES, getRandomTemplate, extractKeywords } from '../utils/extendedRules.js';
import asyncHandler from '../utils/asyncHandler.js';
import { successResponse } from '../utils/response.js';
import { API_MESSAGES } from '../constants/messages.js';

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

const AGE_PROFILES = {
  young: {
    label: 'Play-based',
    defaultDuration: 30,
    activityCount: 3,
    complexity: 'simple',
    methods: ['circle time', 'sensory play', 'storytelling', 'movement games'],
    flowPhases: [
      { name: 'Welcome & Circle Time', portion: 0.25 },
      { name: 'Guided Play Activity', portion: 0.50 },
      { name: 'Reflection & Closing Song', portion: 0.25 },
    ],
  },
  middle: {
    label: 'Play-structured blend',
    defaultDuration: 45,
    activityCount: 4,
    complexity: 'moderate',
    methods: ['guided discovery', 'group discussion', 'creative projects', 'hands-on tasks'],
    flowPhases: [
      { name: 'Warm-up & Review', portion: 0.15 },
      { name: 'Core Instruction', portion: 0.30 },
      { name: 'Practice Activity', portion: 0.35 },
      { name: 'Share & Reflect', portion: 0.20 },
    ],
  },
  older: {
    label: 'Structured learning',
    defaultDuration: 60,
    activityCount: 5,
    complexity: 'advanced',
    methods: ['direct instruction', 'collaborative projects', 'problem-solving', 'peer review'],
    flowPhases: [
      { name: 'Introduction & Hook', portion: 0.10 },
      { name: 'Direct Instruction', portion: 0.25 },
      { name: 'Guided Practice', portion: 0.25 },
      { name: 'Independent / Group Task', portion: 0.30 },
      { name: 'Review & Assessment', portion: 0.10 },
    ],
  },
};

const TOPIC_CATEGORIES = [
  {
    key: 'science',
    keywords: ['solar system', 'planet', 'space', 'gravity', 'atom', 'molecule', 'cell', 'biology',
      'chemistry', 'physics', 'light', 'sound', 'electricity', 'magnet', 'force', 'energy',
      'volcano', 'earthquake', 'weather', 'climate', 'ecosystem', 'photosynthesis', 'evolution'],
    materials: ['Science notebook', 'Diagram cards', 'Magnifying glass', 'Experiment materials', 'Observation sheet', 'Pencils & colored pens'],
    verbs: ['observe', 'hypothesize', 'experiment', 'analyze', 'record', 'compare'],
  },
  {
    key: 'nature',
    keywords: ['plant', 'tree', 'flower', 'leaf', 'garden', 'insect', 'bird', 'nature', 'seed',
      'water cycle', 'rain', 'cloud', 'soil', 'forest', 'jungle', 'ocean', 'river', 'animal'],
    materials: ['Nature tray', 'Magnifying glasses', 'Crayons', 'Observation journal', 'Leaves & seeds', 'Drawing sheets'],
    verbs: ['observe', 'sort', 'identify', 'compare', 'describe', 'draw'],
  },
  {
    key: 'math',
    keywords: ['number', 'count', 'addition', 'subtraction', 'multiplication', 'division', 'fraction',
      'geometry', 'shape', 'pattern', 'algebra', 'measurement', 'graph', 'data', 'probability',
      'equation', 'math', 'maths'],
    materials: ['Number flashcards', 'Counting blocks', 'Worksheets', 'Ruler & protractor', 'Graph paper', 'Dice & counters'],
    verbs: ['solve', 'calculate', 'compare', 'measure', 'estimate', 'verify'],
  },
  {
    key: 'language',
    keywords: ['alphabet', 'letter', 'word', 'sentence', 'story', 'poem', 'reading', 'writing',
      'grammar', 'vocabulary', 'phonics', 'comprehension', 'language', 'communication',
      'speech', 'essay', 'paragraph', 'punctuation'],
    materials: ['Storybook', 'Alphabet cards', 'Writing journals', 'Word wall cards', 'Whiteboard & markers', 'Activity worksheets'],
    verbs: ['read', 'write', 'discuss', 'retell', 'identify', 'compose'],
  },
  {
    key: 'social',
    keywords: ['friendship', 'family', 'community', 'sharing', 'kindness', 'emotion', 'feeling',
      'empathy', 'cooperation', 'respect', 'manners', 'teamwork', 'culture', 'society',
      'citizenship', 'responsibility'],
    materials: ['Emotion cards', 'Role-play props', 'Story cards', 'Chart paper', 'Markers', 'Activity sheets'],
    verbs: ['discuss', 'role-play', 'reflect', 'share', 'identify', 'demonstrate'],
  },
  {
    key: 'history',
    keywords: ['history', 'historical', 'ancient', 'civilization', 'war', 'king', 'queen', 'emperor',
      'timeline', 'independence', 'revolution', 'colony', 'culture', 'heritage', 'monument',
      'freedom fighter', 'ruler', 'dynasty'],
    materials: ['Timeline chart', 'Historical images', 'Map', 'Fact cards', 'Notebook', 'Colored pencils'],
    verbs: ['examine', 'analyze', 'discuss', 'compare', 'research', 'present'],
  },
  {
    key: 'geography',
    keywords: ['map', 'continent', 'country', 'capital', 'mountain', 'river', 'desert', 'geography',
      'latitude', 'longitude', 'compass', 'landform', 'region', 'population', 'climate zone'],
    materials: ['World map / atlas', 'Globe', 'Compass', 'Printed maps', 'Colored pencils', 'Fact sheets'],
    verbs: ['locate', 'label', 'compare', 'describe', 'identify', 'trace'],
  },
  {
    key: 'art',
    keywords: ['color', 'colour', 'painting', 'drawing', 'craft', 'art', 'sculpture', 'collage',
      'design', 'creative', 'pattern', 'texture', 'sketch'],
    materials: ['Paint sets', 'Brushes', 'Drawing paper', 'Crayons & markers', 'Craft supplies', 'Glue & scissors'],
    verbs: ['create', 'design', 'explore', 'experiment', 'express', 'reflect'],
  },
  {
    key: 'health',
    keywords: ['health', 'hygiene', 'nutrition', 'food', 'exercise', 'fitness', 'body', 'organ',
      'teeth', 'germs', 'clean', 'healthy', 'diet', 'vitamin', 'muscle', 'bone'],
    materials: ['Body diagram', 'Food group chart', 'Activity sheet', 'Mirror', 'Hygiene props', 'Colored pencils'],
    verbs: ['identify', 'sort', 'demonstrate', 'practice', 'discuss', 'compare'],
  },
  {
    key: 'technology',
    keywords: ['computer', 'coding', 'programming', 'internet', 'technology', 'robot', 'digital',
      'algorithm', 'app', 'device', 'software', 'hardware', 'data', 'AI', 'network'],
    materials: ['Computers / tablets', 'Printed flowcharts', 'Coding cards', 'Whiteboard', 'Markers', 'Activity sheets'],
    verbs: ['code', 'debug', 'design', 'analyze', 'build', 'test'],
  },
];

const DEFAULT_CATEGORY = {
  key: 'general',
  materials: ['Chart paper', 'Markers', 'Storybook', 'Activity sheets', 'Classroom props', 'Colored pencils'],
  verbs: ['explore', 'discuss', 'demonstrate', 'present', 'reflect', 'apply'],
};

const PHASE_TEMPLATES = {
  simple: [
    {
      type: 'Warm-up Activity',
      buildName: (topic) => `Introducing ${topic}`,
      buildDescription: (topic, outcome) =>
        `Start with a brief circle time where children are asked what they know about "${topic}". ` +
        `The teacher introduces the topic using a large picture card or object. ` +
        `Children take turns sharing one word they associate with ${topic}. ` +
        `Goal: Activate prior knowledge and build excitement for today's theme.`,
    },
    {
      type: 'Sensory / Hands-on Play',
      buildName: (topic) => `Exploring ${topic} Through Play`,
      buildDescription: (topic, outcome) => {
        const keyword = extractKeywords(outcome);
        return `Set up a themed exploration station with props, textures, or pictures related to ${topic}. ` +
          `Children rotate through the station in small groups (3–4 children). ` +
          `Encourage them to touch, sort, or match items while the teacher narrates key vocabulary. ` +
          `Target outcome: focus on ${keyword}.`;
      },
    },
    {
      type: 'Story & Reflection',
      buildName: (topic) => `${topic} Story Time & Closing`,
      buildDescription: (topic, outcome) =>
        `Read a short picture book or show illustrated cards about ${topic}. ` +
        `Pause at key moments and ask: "What do you think happens next?" ` +
        `Close with a simple song or rhyme that reinforces today's key word. ` +
        `Children do a thumbs-up check: "Did we learn about ${topic} today?"`,
    },
  ],
  moderate: [
    {
      type: 'Introduction & Hook',
      buildName: (topic) => `Hook: What Do We Know About ${topic}?`,
      buildDescription: (topic, outcome) =>
        `Begin with a short "think-pair-share" exercise: children whisper to their partner ` +
        `one thing they know about ${topic}. Collect responses on the board in a mind-map format. ` +
        `The teacher uses a provocative question or short video clip (if available) to spark curiosity. ` +
        `Goal: Assess prior knowledge and set the learning intention for: "${outcome}".`,
    },
    {
      type: 'Guided Discovery',
      buildName: (topic) => `Discovering Key Concepts in ${topic}`,
      buildDescription: (topic, outcome) =>
        `Teacher presents 3–4 key facts about ${topic} using visual aids (posters, diagrams, or real objects). ` +
        `Students complete a partially-filled graphic organizer (provided as a worksheet). ` +
        `Pause after each fact for a "1-minute write": students jot one question they still have. ` +
        `This builds understanding step-by-step toward: "${outcome}".`,
    },
    {
      type: 'Creative Practice',
      buildName: (topic) => `Creative Application: ${topic} Project`,
      buildDescription: (topic, outcome) =>
        `Students work in pairs to create a mini-presentation (drawing, labelled diagram, or short script) ` +
        `that shows one aspect of ${topic}. ` +
        `Teacher circulates, asking guiding questions and checking for misconceptions. ` +
        `Groups share their work with another pair ("gallery walk" format). ` +
        `Targeted skill: ${outcome}.`,
    },


    {
      type: 'Reflection & Sharing',
      buildName: (topic) => `Reflect & Share: ${topic} Takeaways`,
      buildDescription: (topic, outcome) =>
        `Reconvene as a class. Each group shares their most interesting finding about ${topic}. ` +
        `Teacher creates a class "fact board" with student contributions. ` +
        `Students complete an exit ticket: "Write one thing you learned and one question you still have about ${topic}." ` +
        `Review exit tickets to plan next session.`,
    },
  ],


  advanced: [
    {
      type: 'Hook & Prior Knowledge',
      buildName: (topic) => `Activating Prior Knowledge: ${topic}`,
      buildDescription: (topic, outcome) =>
        `Open with a KWL chart (Know / Want to Know / Learned) projected on the board. ` +
        `Students independently write 2–3 points in the "K" and "W" columns for ${topic}. ` +
        `Facilitate a brief class discussion surfacing key misconceptions or gaps. ` +
        `State the lesson objective clearly: "${outcome}." ` +
        `Estimated teacher-led time: ~10 minutes.`,
    },
    {
      type: 'Direct Instruction',
      buildName: (topic) => `Core Concepts: ${topic} Explained`,
      buildDescription: (topic, outcome) =>
        `Deliver a structured explanation of the core concepts within ${topic} using a visual presentation. ` +
        `Use the "I Do" model: teacher works through 2–3 examples step-by-step while narrating reasoning. ` +
        `Students take structured notes using a provided note-taking template. ` +
        `Pause every 5 minutes for a "cold-call check": ask a random student to summarise the last point. ` +
        `Builds toward: "${outcome}".`,
    },
    {
      type: 'Guided Practice',
      buildName: (topic) => `Guided Practice: Applying ${topic} Concepts`,
      buildDescription: (topic, outcome) =>
        `"We Do" phase: students work alongside the teacher on 3 practice problems or scenarios related to ${topic}. ` +
        `Students attempt each item first, then teacher models the correct approach and reasoning. ` +
        `Encourage students to annotate their work with their own notes. ` +
        `Common misconceptions are addressed explicitly at this stage.`,
    },
    {
      type: 'Collaborative Task',
      buildName: (topic) => `Group Task: Solve a ${topic} Challenge`,
      buildDescription: (topic, outcome) =>
        `"You Do Together" phase: small groups (3–4 students) receive a task card with a real-world ` +
        `or subject-specific challenge linked to ${topic}. ` +
        `Groups must produce a documented solution (written, drawn, or built). ` +
        `One member acts as spokesperson and presents findings in a 2-minute group share. ` +
        `Teacher observes and provides formative feedback. Outcome targeted: "${outcome}".`,
    },
    {
      type: 'Assessment & Closure',
      buildName: (topic) => `Review & Check: ${topic} Understanding`,
      buildDescription: (topic, outcome) =>
        `Return to the KWL chart and complete the "L" column as a class. ` +
        `Students complete a 5-question exit quiz (multiple choice or short answer) on ${topic}. ` +
        `Teacher reviews answers together and clarifies any lingering confusion. ` +
        `Assign a brief extension task for those who finish early. ` +
        `Confirm mastery of: "${outcome}".`,
    },
  ],
};

const buildTeacherQuestions = (topic, outcome, category) => {
  const questionSets = {
    science: [
      `What do you think will happen if we change one variable in our ${topic} experiment?`,
      `Can you explain in your own words how ${topic} works?`,
      `Where have you seen evidence of ${topic} in everyday life?`,
      `What questions do you still have about ${topic} that you'd like to investigate?`,
      `How would you explain ${topic} to someone who has never heard of it?`,
    ],
    math: [
      `Can you think of a real-life situation where you would use what we learned about ${topic}?`,
      `What pattern do you notice in these ${topic} problems?`,
      `Is there another method you could use to solve this ${topic} problem?`,
      `How do you know your answer to this ${topic} question is correct?`,
      `Where might you use ${topic} outside of school?`,
    ],
    language: [
      `What were the most important events in the ${topic} story?`,
      `How did the main character in our ${topic} reading feel, and why?`,
      `Can you retell what you read about ${topic} in your own words?`,
      `What new vocabulary from ${topic} can you use in a sentence?`,
      `If you were the author, how would you change the ${topic} story?`,
    ],
    social: [
      `How would you feel if someone showed ${topic} toward you?`,
      `Can you think of a time when ${topic} was important in your own life?`,
      `How does ${topic} help us in our school or community?`,
      `What would happen if nobody practiced ${topic} in our classroom?`,
      `How can we show ${topic} to someone who is feeling left out?`,
    ],
    history: [
      `Why do you think the people involved in ${topic} made those choices?`,
      `How does learning about ${topic} help us understand today's world?`,
      `What would you have done differently if you were living during the time of ${topic}?`,
      `How has ${topic} influenced our life today?`,
      `What evidence supports what we know about ${topic}?`,
    ],
    nature: [
      `What would happen to our environment if ${topic} disappeared?`,
      `How does ${topic} connect to other things we have studied?`,
      `What can you observe about ${topic} near your own home or school?`,
      `Why is it important for us to understand ${topic}?`,
      `What is the most surprising thing you discovered about ${topic}?`,
    ],
    general: [
      `What do you already know about ${topic}? What made you think that?`,
      `What is the most important thing you learned about ${topic} today?`,
      `How does ${topic} connect to something you already know?`,
      `If you had to teach ${topic} to a younger student, what would you say first?`,
      `What question does today's lesson about ${topic} leave you with?`,
    ],
  };

  const pool = questionSets[category] || questionSets.general;
  return pool.slice(0, 5);
};

const buildTeachingTips = (topic, outcome, profile, category) => {
  const ageTips = {
    simple: [
      `Use large, colourful visuals and real objects when introducing ${topic} — young children learn through concrete examples first.`,
      `Keep instructions short (1–2 steps at a time) and repeat key vocabulary about ${topic} at least three times during the session.`,
      `Transition between activities with a song or clap pattern to re-focus attention.`,
    ],
    moderate: [
      `Anchor every new concept in ${topic} to something students already know — use an analogy or real-world connection.`,
      `Use pair-work before whole-class sharing; it reduces anxiety and improves the quality of responses.`,
      `Regularly check for understanding using mini-whiteboards or thumbs up/down signals during the ${topic} lesson.`,
    ],
    advanced: [
      `Encourage students to articulate their reasoning about ${topic} — "how do you know?" is more powerful than "is that right?"`,
      `Distribute a structured note-taking template to help students organise new information about ${topic} as it is delivered.`,
      `If a misconception about ${topic} surfaces, address it explicitly for the whole class rather than only the individual.`,
    ],
  };

  const categoryTip = {
    science: `Safety first: brief students on any lab or experiment rules before handling materials related to ${topic}.`,
    math: `When working through ${topic} problems, model your thinking aloud so students can hear the internal reasoning process.`,
    language: `Pre-teach 3–5 key vocabulary words from the ${topic} text before students encounter them in context.`,
    social: `Create a safe, non-judgmental atmosphere — personal sharing during ${topic} lessons requires trust.`,
    history: `Use primary-source images or artefacts to make ${topic} feel real and tangible, not just dates in a textbook.`,
    nature: `Wherever possible, bring ${topic} indoors (leaves, soil, seeds) or take learning outdoors for direct observation.`,
    general: `Connect the lesson on ${topic} to students' lived experiences to make the learning personally meaningful.`,
  };

  return [
    ...ageTips[profile.complexity],
    categoryTip[category] || categoryTip.general,
    `Clearly state the learning objective ("${outcome}") at the start and return to it during closure.`,
  ];
};

const buildMaterials = (topic, profile, category) => {
  const cat = TOPIC_CATEGORIES.find((c) => c.key === category) || DEFAULT_CATEGORY;
  return [
    ...cat.materials,
    `${profile.label} task cards for ${topic}`,
    `Display board labelled "${topic}"`,
  ];
};

const buildWeeklyPlan = (ageGroup, topic, learningOutcome, profile, sessionDuration) => {
  const dailyFocus = [
    `Day 1 — Introduction: What is ${topic}?`,
    `Day 2 — Exploration: Key concepts of ${topic}`,
    `Day 3 — Application: Using what we know about ${topic}`,
    `Day 4 — Creative expression: Connecting ${topic} to real life`,
    `Day 5 — Review & reflection: Consolidating ${topic} learning`,
  ];

  return {
    title: `${topic} — Weekly Lesson Plan (${ageGroup})`,
    ageGroup,
    theme: topic,
    learningOutcome,
    approach: profile.label,
    duration: `${sessionDuration} mins`,
    totalActivities: profile.activityCount,
    days: WEEKDAYS.map((day, index) => ({
      day,
      focus: dailyFocus[index],
      duration: `${sessionDuration} mins`,
    })),
  };
};

const buildActivities = (topic, learningOutcome, profile, sessionDuration) => {
  const templates = PHASE_TEMPLATES[profile.complexity];
  const count = profile.activityCount;
  const selectedTemplates = templates.slice(0, count);
  const perActivity = Math.floor(sessionDuration / count);
  const remainder = sessionDuration - perActivity * count;

  return selectedTemplates.map((tpl, index) => ({
    name: tpl.buildName(topic),
    type: tpl.type,
    duration: `${perActivity + (index === count - 1 ? remainder : 0)} mins`,
    description: tpl.buildDescription(topic, learningOutcome),
    order: index + 1,
  }));
};

const buildLearningGoals = (learningOutcome, topic, profile, category) => {
  const cat = TOPIC_CATEGORIES.find((c) => c.key === category) || DEFAULT_CATEGORY;
  const verb = cat.verbs[0] || 'explore';

  return [
    learningOutcome,
    `Students will ${verb} key ideas related to ${topic} through ${profile.methods[0]} and ${profile.methods[1]}.`,
    `Students will use appropriate vocabulary when discussing ${topic}.`,
    `Students will demonstrate understanding of ${topic} through a ${profile.complexity === 'simple' ? 'hands-on activity' : profile.complexity === 'moderate' ? 'creative project' : 'structured task'}.`,
    'Students will build confidence in sharing and discussing their learning with peers.',
  ];
};

const buildLessonFlow = (topic, profile, sessionDuration) => {
  return profile.flowPhases.map((phase, index) => {
    const phaseDuration = Math.round(sessionDuration * phase.portion);
    return {
      step: index + 1,
      phase: phase.name,
      duration: `${phaseDuration} mins`,
      activity: `${phase.name} — ${topic}`,
    };
  });
};

const detectCategory = (topic) => {
  const normalised = topic.toLowerCase();
  for (const cat of TOPIC_CATEGORIES) {
    if (cat.keywords.some((kw) => normalised.includes(kw))) {
      return cat.key;
    }
  }
  return DEFAULT_CATEGORY.key;
};

const parseAgeProfile = (ageGroup) => {
  const match = ageGroup.match(/(\d+)/);
  const minAge = match ? parseInt(match[1], 10) : 5;
  if (minAge <= 4) return AGE_PROFILES.young;
  if (minAge <= 7) return AGE_PROFILES.middle;
  return AGE_PROFILES.older;
};

const TOPIC_KNOWLEDGE_MAP = {
  'solar system': [
    'The solar system contains 8 planets orbiting the Sun, held by gravity.',
    'Mercury is the smallest planet; Jupiter is the largest.',
    'A year on Earth is the time it takes to complete one orbit around the Sun.',
  ],
  'planet': [
    'Planets are large celestial bodies that orbit a star and have cleared their orbital path.',
    'Rocky planets (Mercury, Venus, Earth, Mars) are denser than gas giants.',
    'Pluto was reclassified as a dwarf planet in 2006.',
  ],
  'water cycle': [
    'The water cycle moves water between oceans, atmosphere, and land continuously.',
    'Evaporation converts liquid water into water vapour when heated by the Sun.',
    'Condensation forms clouds when water vapour cools at high altitudes.',
  ],
  'photosynthesis': [
    'Plants use sunlight, water, and carbon dioxide to produce glucose and oxygen.',
    'Chlorophyll in leaves absorbs light energy for the photosynthesis process.',
    'Photosynthesis is the foundation of almost all food chains on Earth.',
  ],
  'plant': [
    'Plants have roots, stems, leaves, and (often) flowers — each with a specific role.',
    'Roots absorb water and nutrients from the soil and anchor the plant.',
    'Leaves are the main site of photosynthesis, converting light into food.',
  ],
  'animal': [
    'Animals are classified into vertebrates (with a backbone) and invertebrates (without).',
    'Mammals are warm-blooded, breathe air, and nurse their young with milk.',
    'Animals have adapted unique features to survive in their specific habitats.',
  ],
  'ecosystem': [
    'An ecosystem is a community of living organisms interacting with their environment.',
    'Food chains show the flow of energy from producers (plants) to consumers (animals).',
    'Decomposers like fungi and bacteria recycle nutrients back into the soil.',
  ],
  'fraction': [
    'A fraction represents a part of a whole and has a numerator and denominator.',
    'Equivalent fractions look different but represent the same value (e.g., 1/2 = 2/4).',
    'To add fractions with different denominators, first find a common denominator.',
  ],
  'geometry': [
    'Geometry is the branch of mathematics dealing with shapes, sizes, and properties of figures.',
    'Polygons are closed 2D shapes with straight sides — triangles, squares, and hexagons are examples.',
    'The sum of angles in any triangle always equals 180 degrees.',
  ],
  'electricity': [
    'Electric current is the flow of electrons through a conductor such as copper wire.',
    'Circuits must be complete (closed) for electricity to flow.',
    'Conductors allow electricity to flow; insulators (like rubber) resist it.',
  ],
  'magnet': [
    'Magnets have two poles — north and south. Opposite poles attract; like poles repel.',
    'Earth itself behaves like a giant magnet, which is why compasses work.',
    'Magnetic fields can pass through non-magnetic materials like paper and plastic.',
  ],
  'climate': [
    'Climate refers to the long-term pattern of weather in an area, not daily conditions.',
    'The greenhouse effect traps heat in Earth\'s atmosphere, maintaining surface temperature.',
    'Human activities like burning fossil fuels are accelerating climate change.',
  ],
  'friendship': [
    'Strong friendships are built on trust, honesty, and mutual respect.',
    'Good friends support each other through challenges and celebrate successes.',
    'Resolving conflicts calmly strengthens rather than weakens a friendship.',
  ],
  'addition': [
    'Addition is combining two or more numbers to find their total (sum).',
    'The commutative property means 3 + 5 = 5 + 3 — order does not change the result.',
    'Mental math strategies like making ten help solve addition problems quickly.',
  ],
  'subtraction': [
    'Subtraction finds the difference between two numbers.',
    'Subtraction is the inverse (opposite) of addition.',
    'Counting back on a number line is a visual strategy for subtraction.',
  ],
};

const getTopicFacts = (topic) => {
  const lower = topic.toLowerCase();
  const COMBINED_MAP = { ...TOPIC_KNOWLEDGE_MAP, ...EXTENDED_KNOWLEDGE_MAP };
  for (const [key, facts] of Object.entries(COMBINED_MAP)) {
    if (lower.includes(key)) return facts;
  }
  return [];
};

const DAILY_THEMES = [
  { dayName: 'Monday', focus: 'Introduction', verb: 'introduce', approach: 'Activate prior knowledge and introduce key vocabulary.' },
  { dayName: 'Tuesday', focus: 'Concept Building', verb: 'explain', approach: 'Develop core concepts through explanation and visual aids.' },
  { dayName: 'Wednesday', focus: 'Guided Activity', verb: 'explore', approach: 'Apply concepts through structured, teacher-guided hands-on tasks.' },
  { dayName: 'Thursday', focus: 'Practice & Application', verb: 'practise', approach: 'Consolidate learning through independent or group practice.' },
  { dayName: 'Friday', focus: 'Assessment & Recap', verb: 'assess', approach: 'Review the week, celebrate learning, and check understanding.' },
];

const ACTIVITY_POOLS = {

  monday: {
    simple: [
      {
        name: 'Picture Walk', type: 'Visual Exploration',
        desc: (t) => `Teacher displays 5–6 large pictures related to ${t}. Children point and name what they see, sharing one word each. Vocabulary introduced: key nouns linked to ${t}.`
      },
      {
        name: 'Story Introduction', type: 'Story Circle',
        desc: (t) => `Read aloud a short picture book or show illustrated cards about ${t}. Pause twice to ask: "What do you see?" and "Does this remind you of something?"`
      },
      {
        name: 'Curiosity Box', type: 'Sensory Play',
        desc: (t) => `Place 3–4 objects related to ${t} in a box. Children take turns reaching in, feeling one object, and guessing what it might be before looking.`
      },
    ],
    moderate: [
      {
        name: 'Think-Pair-Share', type: 'Discussion',
        desc: (t) => `Children write or whisper to a partner: one thing they know about ${t}. Share responses as a class. Teacher records ideas in a mind-map on the board.`
      },
      {
        name: 'Vocabulary Preview', type: 'Guided Discovery',
        desc: (t) => `Introduce 4–5 key words for ${t} using a word wall. Students match words to pictures and use each in a spoken sentence.`
      },
      {
        name: 'KWL Chart — K Column', type: 'Group Discussion',
        desc: (t) => `As a class, fill in the "Know" column of a KWL chart about ${t}. Students contribute ideas; teacher facilitates and corrects obvious misconceptions gently.`
      },
    ],
    advanced: [
      {
        name: 'Prior Knowledge Poll', type: 'Hook Activity',
        desc: (t) => `Quick 5-question true/false quiz about ${t} (paper or whiteboard). No marks — purely to reveal what students already know and set curiosity gaps.`
      },
      {
        name: 'KWL Chart — K & W Columns', type: 'Independent Reflection',
        desc: (t) => `Students complete the K (Know) and W (Want to know) columns of a KWL chart for ${t} individually, then compare with a partner before class discussion.`
      },
      {
        name: 'Concept Map Draft', type: 'Group Work',
        desc: (t) => `In groups of 3, students create a draft concept map with ${t} at the centre. Add at least 5 connecting ideas. Share and discuss differences between groups.`
      },
    ],
  },

  tuesday: {
    simple: [
      {
        name: 'Teacher Explanation with Visuals', type: 'Direct Instruction',
        desc: (t) => `Teacher explains 2–3 core ideas about ${t} using large visual aids. After each idea, children repeat a key phrase together and do a simple action.`
      },
      {
        name: 'Matching Activity', type: 'Guided Discovery',
        desc: (t) => `Children match word cards to picture cards related to ${t}. Work in pairs. Teacher walks around asking: "Why did you match these?"`
      },
      {
        name: 'Sorting Game', type: 'Hands-on Learning',
        desc: (t) => `Provide sets of cards or objects. Children sort them into categories linked to ${t}. Discuss sorting decisions as a class.`
      },
    ],
    moderate: [
      {
        name: 'Diagram Study', type: 'Visual Analysis',
        desc: (t) => `Students examine a labelled diagram of ${t}. In pairs, they describe each part to each other using the diagram vocabulary. Teacher clarifies after.`
      },
      {
        name: 'Fact Discovery Reading', type: 'Guided Reading',
        desc: (t) => `Read a short informational text (½ page) about ${t}. Students underline 3 key facts. Share facts with the group and add to the class fact board.`
      },
      {
        name: 'Show & Explain', type: 'Teacher Demonstration',
        desc: (t) => `Teacher demonstrates a concept or process related to ${t} step-by-step, thinking aloud. Students record one observation after each step.`
      },
    ],
    advanced: [
      {
        name: 'Structured Note-Taking', type: 'Direct Instruction',
        desc: (t) => `Teacher presents 4–5 core concepts of ${t} using a slide deck or whiteboard. Students take notes in a provided two-column format (concept / detail).`
      },
      {
        name: 'Annotated Diagram', type: 'Independent Task',
        desc: (t) => `Students label and annotate a blank diagram related to ${t} using their notes and a reference sheet. Compare annotations with a partner.`
      },
      {
        name: 'Peer Explanation Round', type: 'Collaborative Learning',
        desc: (t) => `Each student explains one concept of ${t} to a partner in 2 minutes. The partner asks one follow-up question. Roles then swap.`
      },
    ],
  },

  wednesday: {
    simple: [
      {
        name: 'Craft Activity', type: 'Creative Arts',
        desc: (t) => `Children create a simple craft linked to ${t} (e.g., drawing, colouring, cutting and sticking). Teacher narrates and reinforces vocabulary during the activity.`
      },
      {
        name: 'Movement Game', type: 'Music & Movement',
        desc: (t) => `Active game where children respond to ${t}-related prompts with a physical action (jump, clap, sit). Reinforces categorisation and listening skills.`
      },
      {
        name: 'Guided Drawing', type: 'Visual Learning',
        desc: (t) => `Teacher draws a simple image linked to ${t} step-by-step. Children follow along at their desks, labelling key parts as they go.`
      },
    ],
    moderate: [
      {
        name: 'Group Poster', type: 'Collaborative Project',
        desc: (t) => `Small groups (3–4) create an information poster about ${t}. Each group member is responsible for one section: title, facts, diagram, and key question.`
      },
      {
        name: 'Investigation Station', type: 'Hands-on Task',
        desc: (t) => `Stations around the room each focus on one aspect of ${t}. Groups rotate every 8–10 minutes, completing a recording sheet at each station.`
      },
      {
        name: 'Role Play', type: 'Drama & Discussion',
        desc: (t) => `Students act out a short scenario connected to ${t}. Teacher assigns roles and guides with prompt cards. Debrief: what did we learn from the role play?`
      },
    ],
    advanced: [
      {
        name: 'Guided Experiment / Inquiry', type: 'Hands-on Investigation',
        desc: (t) => `Students follow a structured inquiry protocol to explore one aspect of ${t}. Record hypothesis, method, observations, and preliminary conclusion.`
      },
      {
        name: 'Case Study Analysis', type: 'Problem Solving',
        desc: (t) => `Groups analyse a real-world scenario connected to ${t}. Identify the key issue, discuss causes and effects, then propose a solution with evidence.`
      },
      {
        name: 'Structured Group Task', type: 'Collaborative Project',
        desc: (t) => `Groups of 4 produce a joint artefact (chart, model, script) demonstrating their understanding of ${t}. Assign roles: leader, recorder, reporter, timekeeper.`
      },
    ],
  },

  thursday: {
    simple: [
      {
        name: 'Worksheet Practice', type: 'Independent Practice',
        desc: (t) => `Children complete a short themed worksheet with pictures and simple tracing or circling tasks related to ${t}. Teacher assists in small groups.`
      },
      {
        name: 'Story Retelling', type: 'Language Activity',
        desc: (t) => `Using picture cards, children retell the ${t} story or lesson in their own words. Focus on using 2–3 key vocabulary words correctly.`
      },
      {
        name: 'Partner Quiz', type: 'Peer Learning',
        desc: (t) => `In pairs, children take turns asking and answering simple questions about ${t} using question prompt cards provided by the teacher.`
      },
    ],
    moderate: [
      {
        name: 'Practice Problems', type: 'Independent Task',
        desc: (t) => `Students complete 6–8 practice items related to ${t} independently. Self-check answers using an answer key, then flag any they are unsure about.`
      },
      {
        name: 'Group Challenge', type: 'Group Work',
        desc: (t) => `Small groups tackle a problem-solving task connected to ${t}. Each group documents their approach and final answer on a shared card.`
      },
      {
        name: 'Real-Life Connection', type: 'Discussion',
        desc: (t) => `Students identify one real-life example of ${t} from their own experience or community. Share in a brief class discussion and explain the connection.`
      },
    ],
    advanced: [
      {
        name: 'Extended Practice Set', type: 'Independent Task',
        desc: (t) => `Students independently complete a structured set of 8–10 questions covering different aspects of ${t}. Include application, analysis, and one open-ended question.`
      },
      {
        name: 'Peer Teaching', type: 'Collaborative Learning',
        desc: (t) => `Students who have mastered a concept of ${t} explain it to a peer who needs support. Teacher monitors and intervenes where explanations need correction.`
      },
      {
        name: 'Scenario Application', type: 'Problem Solving',
        desc: (t) => `Present a novel scenario where students must apply what they know about ${t}. Students write a structured response: situation, approach, conclusion.`
      },
    ],
  },

  friday: {
    simple: [
      {
        name: 'Star of the Week Share', type: 'Sharing Circle',
        desc: (t) => `Each child shares one thing they learned about ${t} this week. Teacher prompts with: "Tell me one thing you remember." Celebrate all contributions.`
      },
      {
        name: 'Thumbs Check', type: 'Formative Assessment',
        desc: (t) => `Teacher states 5 sentences about ${t} — some true, some false. Children show thumbs up (true) or thumbs down (false). Discuss any disagreements.`
      },
      {
        name: 'Draw What You Know', type: 'Creative Assessment',
        desc: (t) => `Children draw and label their favourite thing they learned about ${t} this week. Drawings are shared and displayed as a class gallery.`
      },
    ],
    moderate: [
      {
        name: 'Exit Quiz', type: 'Formative Assessment',
        desc: (t) => `Students complete a 5-question written quiz covering the week\'s learning about ${t}. Teacher reviews responses to identify gaps before the next unit.`
      },
      {
        name: 'KWL Completion', type: 'Reflection',
        desc: (t) => `Students complete the "Learned" column of their KWL chart for ${t}. Compare with the "Want to Know" column — were all questions answered?`
      },
      {
        name: 'Group Presentation', type: 'Peer Sharing',
        desc: (t) => `Each group presents their poster or key findings about ${t} in 2 minutes. Class members give one piece of positive feedback to each group.`
      },
    ],
    advanced: [
      {
        name: 'Topic Quiz', type: 'Summative Assessment',
        desc: (t) => `Students complete a 10-question quiz (mix of multiple choice, short answer, and one explanation question) assessing the week\'s understanding of ${t}.`
      },
      {
        name: 'Reflection Journal', type: 'Self-Assessment',
        desc: (t) => `Students write a structured reflection: (1) Most important thing I learned about ${t}, (2) One question I still have, (3) How I would rate my own understanding.`
      },
      {
        name: 'KWL Final + Peer Review', type: 'Collaborative Review',
        desc: (t) => `Students finalise their KWL chart and swap with a partner to compare learnings. Discuss: what did we both learn? What do we still disagree on regarding ${t}?`
      },
    ],
  },
};

const DAY_POOL_KEYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

const WEEK_PROGRESSIONS = [
  {
    label: 'Introduction',
    subtopicPrefix: 'Getting started with',
    weekObjective: 'introduce core vocabulary and spark curiosity about',
  },
  {
    label: 'Building Knowledge',
    subtopicPrefix: 'Going deeper into',
    weekObjective: 'develop understanding through guided exploration of',
  },
  {
    label: 'Practice & Application',
    subtopicPrefix: 'Applying what we know about',
    weekObjective: 'practise skills and connect knowledge of',
  },
  {
    label: 'Review & Mastery',
    subtopicPrefix: 'Mastering',
    weekObjective: 'consolidate, review and demonstrate mastery of',
  },
];

const buildDayActivities = (topic, dayKey, profile, sessionDuration, weekIndex = 0, category) => {

  let pool = ACTIVITY_POOLS[dayKey]?.[profile.complexity] || ACTIVITY_POOLS.monday.moderate;

  if (CATEGORY_OVERRIDES[category] && CATEGORY_OVERRIDES[category][profile.complexity]) {

    pool = [...CATEGORY_OVERRIDES[category][profile.complexity], ...pool];
  }

  const count = Math.min(profile.activityCount, pool.length);
  const perActivity = Math.floor(sessionDuration / count);
  const remainder = sessionDuration - perActivity * count;

  const offset = weekIndex % pool.length;
  const rotatedPool = [...pool.slice(offset), ...pool.slice(0, offset)];

  return rotatedPool.slice(0, count).map((tpl, index) => {

    let finalDesc = typeof tpl.desc === 'function' ? tpl.desc(topic) : tpl.desc;

    if (typeof tpl.desc === 'function' && tpl.desc.toString().includes('`')) {
      finalDesc = getRandomTemplate([
        (t) => tpl.desc(t),
        (t) => `Alternative: ${tpl.desc(t).replace('Teacher', 'Instructor').replace('Children', 'Students')}`
      ], topic);
    }

    return {
      name: tpl.name,
      type: tpl.type,
      duration: `${perActivity + (index === count - 1 ? remainder : 0)} mins`,
      description: finalDesc,
      order: index + 1,
    };
  });
};

const buildWeeklyDays = (topic, learningOutcome, profile, sessionDuration, category, numWeeks = 1) => {
  const facts = getTopicFacts(topic);

  const weekCount = Math.min(Math.max(parseInt(numWeeks, 10) || 1, 1), 4);

  return Array.from({ length: weekCount }, (_, w) => {
    const prog = WEEK_PROGRESSIONS[w] || WEEK_PROGRESSIONS[WEEK_PROGRESSIONS.length - 1];

    const days = DAILY_THEMES.map((dayTheme, dayIndex) => {
      const dayKey = DAY_POOL_KEYS[dayIndex];

      const dayActivities = buildDayActivities(topic, dayKey, profile, sessionDuration, w, category);

      const factIndex = (w * 5 + dayIndex) % Math.max(facts.length, 1);
      const dayFacts = facts.length > 0 ? [facts[factIndex % facts.length]] : [];

      return {
        dayNumber: dayIndex + 1,
        dayName: dayTheme.dayName,
        focus: dayTheme.focus,
        subtopic: `${dayTheme.focus}: ${topic}`,
        approach: dayTheme.approach,
        contextFacts: dayFacts,
        activities: dayActivities,
        keyQuestion: `Week ${w + 1} — How can students ${dayTheme.verb} key ideas about ${topic} to ${prog.weekObjective} ${topic}?`,
      };
    });

    return {
      weekNumber: w + 1,
      weekFocus: prog.label,
      weekSubtopic: `${prog.subtopicPrefix} ${topic}`,
      days,
    };
  });
};

class LessonGenerationService {
  _validateInput({ ageGroup, theme, learningOutcome }) {
    if (!ageGroup?.trim() || !theme?.trim() || !learningOutcome?.trim()) {
      throw new AppError(
        'ageGroup, theme, and learningOutcome are required',
        HTTP_STATUS.BAD_REQUEST,
        'VALIDATION_ERROR'
      );
    }
  }

  _validateResult(result) {
    const sections = ['weeklyPlan', 'activities', 'materials', 'learningGoals', 'lessonFlow'];
    const isEmpty = sections.every((key) => {
      const value = result[key];
      if (Array.isArray(value)) return value.length === 0;
      return !value || Object.keys(value).length === 0;
    });

    if (isEmpty) {
      throw new AppError(
        'Lesson generation produced no content',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        'GENERATION_FAILED'
      );
    }
  }

  async generateLessonPlan(input) {
    try {
      const ageGroup = input.ageGroup?.trim();
      const theme = input.theme?.trim();
      const learningOutcome = input.learningOutcome?.trim();

      this._validateInput({ ageGroup, theme, learningOutcome });

      const profile = parseAgeProfile(ageGroup);
      const category = detectCategory(theme);

      const rawDuration = input.duration ? parseInt(String(input.duration), 10) : null;
      const sessionDuration =
        rawDuration && rawDuration > 0 ? rawDuration : profile.defaultDuration;

      const isWeeklyMode = input.weekly === true;

      const numWeeks = input.weeks ? parseInt(String(input.weeks), 10) : 1;

      const generated = {
        weeklyPlan: buildWeeklyPlan(ageGroup, theme, learningOutcome, profile, sessionDuration),
        activities: buildActivities(theme, learningOutcome, profile, sessionDuration),
        materials: buildMaterials(theme, profile, category),
        learningGoals: buildLearningGoals(learningOutcome, theme, profile, category),
        lessonFlow: buildLessonFlow(theme, profile, sessionDuration),
        teacherQuestions: buildTeacherQuestions(theme, learningOutcome, category),
        teachingTips: buildTeachingTips(theme, learningOutcome, profile, category),
        contextFacts: getTopicFacts(theme),

        weeklyDays: isWeeklyMode
          ? buildWeeklyDays(theme, learningOutcome, profile, sessionDuration, category, numWeeks)
          : null,
      };

      this._validateResult(generated);

      if (input.save === true) {
        const savedLessonPlan = await lessonPlanModel.createLessonPlan({
          ageGroup,
          theme,
          learningOutcome,
          weekNumber: input.weekNumber ?? 1,
          duration: `${sessionDuration} mins`,
          notes: input.notes ?? `Auto-saved lesson on "${theme}" for ${ageGroup}`,
          ...generated,
        });

        return { ...generated, savedLessonPlan };
      }

      return generated;
    } catch (error) {
      if (error instanceof AppError) throw error;

      throw new AppError(
        'Failed to generate lesson plan',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        'GENERATION_FAILED'
      );
    }
  }
}

const lessonGenerationService = new LessonGenerationService();

export const generateLessonPlanController = asyncHandler(async (req, res) => {
  const data = await lessonGenerationService.generateLessonPlan({ ...req.body, userId: req.workspaceUserId });
  return successResponse(res, data, API_MESSAGES.LESSON_GENERATED);
});

export default {
  generateLessonPlanController,
};