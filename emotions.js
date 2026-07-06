// Feelings Wheel (Gloria Willcox), flattened to two levels for a fast tap flow.
export const CORES = [
  {
    key: 'happy',
    label: 'Happy',
    color: '#f5b942',
    specifics: [
      'joyful', 'content', 'proud', 'excited', 'optimistic', 'playful',
      'peaceful', 'grateful', 'hopeful', 'confident', 'loving', 'inspired',
    ],
  },
  {
    key: 'sad',
    label: 'Sad',
    color: '#5b8dd9',
    specifics: [
      'lonely', 'disappointed', 'hurt', 'guilty', 'ashamed', 'depressed',
      'hopeless', 'grieving', 'empty', 'discouraged',
    ],
  },
  {
    key: 'angry',
    label: 'Angry',
    color: '#e05c5c',
    specifics: [
      'frustrated', 'annoyed', 'resentful', 'jealous', 'bitter', 'irritated',
      'furious', 'betrayed', 'humiliated', 'critical',
    ],
  },
  {
    key: 'fearful',
    label: 'Fearful',
    color: '#9b6dd6',
    specifics: [
      'anxious', 'worried', 'overwhelmed', 'insecure', 'stressed', 'scared',
      'nervous', 'inadequate', 'rejected', 'helpless',
    ],
  },
  {
    key: 'surprised',
    label: 'Surprised',
    color: '#4dbfa8',
    specifics: [
      'amazed', 'confused', 'startled', 'awed', 'shocked', 'disillusioned',
      'energized',
    ],
  },
  {
    key: 'disgusted',
    label: 'Disgusted',
    color: '#8a9a5b',
    specifics: [
      'disapproving', 'repelled', 'judgmental', 'embarrassed', 'appalled',
      'let down',
    ],
  },
];

export const coreByKey = Object.fromEntries(CORES.map((c) => [c.key, c]));
