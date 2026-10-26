const palmi = {
  id: 'palmi', name: 'PALMI Red', description: 'The signature dark red PALMI D3V identity.', icon: 'P3',
  colors: { background: '#070707', surface: '#101010', text: '#f5f5f5', muted: '#858585', primary: '#ff2525', secondary: '#9f1018', accent: '#ff4545', border: '#282828' },
  gradient: 'linear-gradient(135deg, #080808 0%, #1a0809 42%, #9b1018 78%, #ff2525 100%)',
};
export const themes = [
  palmi,
  {
    id: 'cupboard',
    name: 'Cupboard',
    description: 'Warm pantry neutrals with a leafy green accent.',
    icon: '▦',
    colors: { background: '#12100d', surface: '#1b1814', text: '#f4ead9', muted: '#b5a994', primary: '#78a85b', secondary: '#24351d', accent: '#c98955', border: '#3a3328' },
    gradient: 'linear-gradient(135deg, #12100d 0%, #1b1814 52%, #24351d 100%)',
  },
  { id: 'aurora', name: 'Aurora', description: 'Soft light, vivid gradients, calm motion.', icon: '✦', colors: { background: '#11111a', surface: '#181824', text: '#f5f3ff', muted: '#918da3', primary: '#a78bfa', secondary: '#38bdf8', accent: '#f472b6', border: '#302d3b' }, gradient: 'linear-gradient(135deg, #15162a 0%, #4a3a7a 52%, #c85f91 100%)' },
  { id: 'ocean', name: 'Ocean', description: 'Deep blue tones with a fresh, fluid feel.', icon: '◒', colors: { background: '#071317', surface: '#0d1d22', text: '#effcff', muted: '#6f8e96', primary: '#22c1c3', secondary: '#087ea4', accent: '#7dd3fc', border: '#20383e' }, gradient: 'linear-gradient(135deg, #07171b 0%, #0d6477 50%, #22c1c3 100%)' },
  { id: 'tropical', name: 'Tropical', description: 'Ocean greens, warm yellow, and coral energy.', icon: '☼', colors: { background: '#081713', surface: '#0e211b', text: '#f2fff8', muted: '#73948a', primary: '#10b981', secondary: '#f59e0b', accent: '#ff6b57', border: '#214035' }, gradient: 'linear-gradient(135deg, #063e34 0%, #08a889 38%, #ffd166 72%, #ff5f57 100%)' },
  { id: 'cyberpunk', name: 'Cyberpunk', description: 'Dark surfaces, electric accents, sharp edges.', icon: '⌁', colors: { background: '#08090d', surface: '#11131a', text: '#f5f7ff', muted: '#8991a7', primary: '#00f5a0', secondary: '#8b5cf6', accent: '#ff3cac', border: '#282c3a' }, gradient: 'linear-gradient(135deg, #10192b 0%, #40145f 52%, #ff3cac 100%)' },
  { id: 'forest', name: 'Forest', description: 'Quiet greens with an earthy, grounded tone.', icon: '◌', colors: { background: '#09130f', surface: '#102019', text: '#effff5', muted: '#71877c', primary: '#4ade80', secondary: '#15803d', accent: '#a3a635', border: '#243a2e' }, gradient: 'linear-gradient(135deg, #0a1812 0%, #1d5a3b 48%, #86a65b 100%)' },
  { id: 'sakura', name: 'Sakura', description: 'Dark cherry tones with a softer edge.', icon: '✿', colors: { background: '#180c12', surface: '#251119', text: '#fff3f7', muted: '#9c7483', primary: '#f4729b', secondary: '#d9467a', accent: '#fda4af', border: '#40212d' }, gradient: 'linear-gradient(135deg, #180c12 0%, #6e1d3c 52%, #f4729b 100%)' },
];
export const defaultThemeId = 'palmi';
export function getThemeById(themeId) { return themes.find((theme) => theme.id === themeId) ?? null; }
export function isValidThemeId(themeId) { return themes.some((theme) => theme.id === themeId); }
