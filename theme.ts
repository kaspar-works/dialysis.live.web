/**
 * Wellness & Calm theme tokens.
 * Change hex values here and every page/component using THEME updates.
 */
export const THEME = {
  // Brand
  teal: '#4EC7B8',
  tealDark: '#2F8F87',

  // Pastel tile backgrounds (soft, low saturation)
  peach: '#FFE2D6',
  peachInk: '#E87556',
  sky: '#D8E7F8',
  skyInk: '#5C8FD1',
  lavender: '#E4DAF2',
  lavenderInk: '#8A6FC4',
  mint: '#D6EFDD',
  mintInk: '#4FA872',
  butter: '#FBEBC7',
  butterInk: '#C99638',

  // Neutrals (warm cream)
  bg: '#F4F1EC',
  bgSoft: '#EDE9E1',
  card: '#FFFFFF',
  border: '#E6E1D7',
  ink: '#1F2D2A',
  muted: '#7B7A74',

  // Gradients
  heroGradient: 'linear-gradient(135deg, #4EC7B8 0%, #7ED6A7 100%)',
  calmGradient: 'linear-gradient(180deg, #F4F1EC 0%, #EDE9E1 100%)',
  aiGradient: 'linear-gradient(135deg, #D8E7F8 0%, #E4DAF2 100%)',

  // Legacy aliases
  green: '#4FA872',
  coral: '#E87556',
} as const;

export const WELLNESS_FONT_HREF =
  'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap';

export const WELLNESS_FONT_FAMILY = "'Plus Jakarta Sans', system-ui, sans-serif";

/** Loads the wellness font stylesheet once into <head>. Call from a useEffect. */
export function ensureWellnessFont() {
  if (typeof document === 'undefined') return;
  const id = 'wellness-fonts';
  if (document.getElementById(id)) return;
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = WELLNESS_FONT_HREF;
  document.head.appendChild(link);
}
