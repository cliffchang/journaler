// Geneva Emotion Wheel (Scherer, v3.0) — 20 emotion families arranged on a
// valence x control circumplex. Flattened here into two columns (positive /
// negative), each ordered high-control at top to low-control at bottom.
export const QUADRANTS = {
  posHigh: { color: '#e8a13c' }, // positive, high control
  posLow: { color: '#4dae7c' },  // positive, low control
  negHigh: { color: '#d95757' }, // negative, high control
  negLow: { color: '#5b8dd9' },  // negative, low control
};

export const POSITIVE = [
  { key: 'interest', label: 'Interest', quadrant: 'posHigh' },
  { key: 'amusement', label: 'Amusement', quadrant: 'posHigh' },
  { key: 'pride', label: 'Pride', quadrant: 'posHigh' },
  { key: 'joy', label: 'Joy', quadrant: 'posHigh' },
  { key: 'pleasure', label: 'Pleasure', quadrant: 'posHigh' },
  { key: 'contentment', label: 'Contentment', quadrant: 'posLow' },
  { key: 'love', label: 'Love', quadrant: 'posLow' },
  { key: 'admiration', label: 'Admiration', quadrant: 'posLow' },
  { key: 'relief', label: 'Relief', quadrant: 'posLow' },
  { key: 'compassion', label: 'Compassion', quadrant: 'posLow' },
];

export const NEGATIVE = [
  { key: 'anger', label: 'Anger', quadrant: 'negHigh' },
  { key: 'hate', label: 'Hate', quadrant: 'negHigh' },
  { key: 'contempt', label: 'Contempt', quadrant: 'negHigh' },
  { key: 'disgust', label: 'Disgust', quadrant: 'negHigh' },
  { key: 'fear', label: 'Fear', quadrant: 'negHigh' },
  { key: 'disappointment', label: 'Disappointment', quadrant: 'negLow' },
  { key: 'shame', label: 'Shame', quadrant: 'negLow' },
  { key: 'regret', label: 'Regret', quadrant: 'negLow' },
  { key: 'guilt', label: 'Guilt', quadrant: 'negLow' },
  { key: 'sadness', label: 'Sadness', quadrant: 'negLow' },
];

export const FAMILIES = [...POSITIVE, ...NEGATIVE];
export const familyByKey = Object.fromEntries(FAMILIES.map((f) => [f.key, f]));

export function familyColor(key) {
  const f = familyByKey[key];
  return f ? QUADRANTS[f.quadrant].color : '#888';
}

// Colors for entries logged under the previous (Willcox-inspired) taxonomy,
// so old history entries keep their chip colors.
export const LEGACY_CORE_COLORS = {
  happy: '#f5b942',
  sad: '#5b8dd9',
  angry: '#e05c5c',
  fearful: '#9b6dd6',
  surprised: '#4dbfa8',
  disgusted: '#8a9a5b',
};
