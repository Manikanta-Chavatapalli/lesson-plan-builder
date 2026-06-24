

export const EXTENDED_KNOWLEDGE_MAP = {
  'dinosaurs': ['Dinosaurs lived during the Mesozoic Era.', 'The word dinosaur means "terrible lizard".', 'Birds are the closest living relatives of dinosaurs.'],
  'volcano': ['Volcanoes are openings in the Earth\'s crust that allow magma to escape.', 'The Ring of Fire has the most volcanoes in the world.', 'Lava is what we call magma once it erupts.'],
  'insects': ['Insects have three body parts: head, thorax, and abdomen.', 'All insects have six legs.', 'Many insects undergo metamorphosis, like caterpillars turning into butterflies.'],
  'space': ['Space is a near-perfect vacuum, meaning it has almost no matter.', 'The Milky Way is the galaxy that contains our Solar System.', 'A light-year is the distance light travels in one year.'],
  'phonics': ['Phonics teaches the relationship between letters and sounds.', 'C-A-T makes the word cat.', 'Blending is pushing sounds together to read a word.'],
  'grammar': ['A noun is a person, place, or thing.', 'A verb shows action or state of being.', 'An adjective describes a noun.'],
  'fractions': ['A fraction represents a part of a whole.', 'The top number is the numerator, the bottom is the denominator.', '1/2 is the same as 2/4.'],
  'addition': ['Addition is combining numbers to find a total.', 'Adding zero to a number leaves it unchanged.', 'The numbers added together are called addends.'],
  'civics': ['Civics is the study of the rights and duties of citizens.', 'A community works together to solve problems.', 'Rules and laws help keep everyone safe and fair.'],
  'coding': ['Coding is giving a computer step-by-step instructions.', 'An algorithm is a list of steps to finish a task.', 'A bug is a mistake in the code.']
};

export const getRandomTemplate = (templates, topic) => {
  const index = Math.floor(Math.random() * templates.length);
  return templates[index](topic);
};

export const CATEGORY_OVERRIDES = {
  math: {
    simple: [{ name: 'Math Manipulatives', type: 'Hands-on Math', desc: t => getRandomTemplate([
      t => `Children use counting blocks or physical objects to practice ${t} in small groups.`,
      t => `Set up a math station where students group objects to understand ${t}.`
    ], t) }],
    moderate: [{ name: 'Problem Solving Relay', type: 'Math Practice', desc: t => getRandomTemplate([
      t => `Students work in teams to solve a series of ${t} problems on the whiteboard.`,
      t => `Complete a structured worksheet on ${t}, followed by a peer-review session.`
    ], t) }]
  },
  science: {
    simple: [{ name: 'Sensory Observation', type: 'Science Discovery', desc: t => getRandomTemplate([
      t => `Provide natural materials related to ${t}. Children use magnifying glasses to observe.`,
      t => `A guided nature walk or indoor sensory bin focusing on ${t} principles.`
    ], t) }],
    moderate: [{ name: 'Guided Experiment', type: 'Science Lab', desc: t => getRandomTemplate([
      t => `Conduct a simple, safe class experiment demonstrating ${t}. Students predict the outcome.`,
      t => `Build a basic model showing how ${t} works, recording observations in notebooks.`
    ], t) }]
  },
  language: {
    simple: [{ name: 'Phonics Tracing', type: 'Literacy', desc: t => getRandomTemplate([
      t => `Children trace letters and words related to ${t} in sand trays or on whiteboards.`,
      t => `Sing a phonics song about ${t} while pointing to flashcards.`
    ], t) }],
    moderate: [{ name: 'Story Construction', type: 'Creative Writing', desc: t => getRandomTemplate([
      t => `Students write a short 3-sentence story incorporating the concept of ${t}.`,
      t => `Read a short text on ${t} and have students identify the main characters and setting.`
    ], t) }]
  }
};

export const extractKeywords = (outcome) => {
  if (!outcome) return '';
  const lower = outcome.toLowerCase();

  const fillers = ['students will', 'learn to', 'be able to', 'understand how to', 'understand', 'the', 'a', 'an', 'and', 'or', 'to'];
  let clean = lower;
  fillers.forEach(f => {
    clean = clean.replace(new RegExp(`\\b${f}\\b`, 'g'), '');
  });
  return clean.replace(/\s+/g, ' ').trim() || outcome;
};
