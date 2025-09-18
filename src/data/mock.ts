import { Article, Topic } from '../types';

export const TOPICS: Topic[] = [
  { slug: 'all', title: 'All' },
  { slug: 'physics', title: 'Physics' },
  { slug: 'chemistry', title: 'Chemistry' },
  { slug: 'biology', title: 'Biology' },
  { slug: 'space', title: 'Space' },
  { slug: 'history', title: 'History' },
  { slug: 'tech', title: 'Tech' },
];

export const CARDS: Article[] = [
  {
    id: 1,
    slug: 'why-is-the-sky-blue',
    title: 'Why is the sky blue?',
    excerpt:
      'Rayleigh scattering makes shorter (blue) wavelengths scatter in air, so the sky looks blue from most angles.',
    topic: 'physics',
    body1:
      'Sunlight contains many wavelengths. As it passes through the atmosphere, tiny gas molecules scatter shorter wavelengths more efficiently.',
    body2:
      'Because blue light scatters more than red, more blue light reaches your eyes from all directions, making the sky appear blue.',
    source1: 'https://www.nasa.gov/learning-resources/for-kids/why-is-the-sky-blue/',
  },
  {
    id: 2,
    slug: 'what-makes-salt-salty',
    title: 'What makes salt salty?',
    excerpt:
      "Table salt dissolves into Na+ and Cl− ions that trigger taste receptors your brain interprets as 'salty'.",
    topic: 'chemistry',
    body1:
      'Sodium chloride crystals break apart in saliva into ions that interact with epithelial sodium channels on the tongue.',
    body2:
      'This ionic interaction generates signals to the brain’s gustatory cortex, producing the perception of saltiness.',
    source1: 'https://www.britannica.com/science/taste-sense',
  },
  {
    id: 3,
    slug: 'how-do-vaccines-work',
    title: 'How do vaccines work?',
    excerpt:
      'Vaccines train your immune system with a safe preview of a pathogen, creating memory cells for faster responses.',
    topic: 'biology',
    body1:
      'A vaccine introduces antigens (or instructions to make them) that activate B and T cells without causing the disease.',
    body2:
      'Some activated cells become long-lived memory cells, enabling rapid reaction on real exposure.',
    source1: 'https://www.cdc.gov/vaccines/basics/index.html',
  },
  {
    id: 4,
    slug: 'why-planets-stay-in-orbit',
    title: 'Why do planets stay in orbit?',
    excerpt:
      'Gravity pulls planets toward the Sun while sideways motion keeps them falling around it — an orbit.',
    topic: 'space',
    body1:
      'Planets have tangential velocity from the Solar System’s formation. Gravity constantly pulls them inward toward the Sun.',
    body2:
      'Because their sideways speed is just right, they perpetually fall around the Sun rather than straight in.',
    source1: 'https://solarsystem.nasa.gov/basics/chapter3-1/',
  },
  {
    id: 5,
    slug: 'who-invented-paper',
    title: 'Who invented paper?',
    excerpt:
      'Paper was invented in ancient China, credited to Cai Lun (~105 CE), transforming record-keeping and culture.',
    topic: 'history',
    body1:
      'Earlier media included bamboo, silk, papyrus, and parchment, each limited by cost or durability.',
    body2: 'Paper’s spread along trade routes reshaped administration, education, and literature.',
    source1: 'https://www.britannica.com/technology/paper',
  },
  {
    id: 6,
    slug: 'why-are-cpus-getting-smaller',
    title: 'Why are CPUs getting smaller?',
    excerpt:
      'Transistor miniaturization packs more on chips, boosting performance and efficiency — but gains face limits.',
    topic: 'tech',
    body1:
      'For decades, manufacturers shrank transistors with improved lithography, tracking Moore’s law.',
    body2:
      'At nanoscales, quantum effects and heat make further shrinking hard; new architectures emerge.',
    source1: 'https://en.wikipedia.org/wiki/Moore%27s_law',
  },
];
