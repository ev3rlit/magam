export const postit = 'postit';
export const pasteldots = 'pastel-dots';
export const kraftgrid = 'kraft-grid';
export const maskingsolid = 'masking-solid';
export const neonstripe = 'neon-stripe';
export const vintagepaper = 'vintage-paper';
export const linedwarm = 'lined-warm';
export const gridstandard = 'grid-standard';
export const gridfine = 'grid-fine';
export const dotgrid = 'dot-grid';
export const kraftnatural = 'kraft-natural';

const MATERIAL_PRESET_IDS_INTERNAL = [
  postit,
  pasteldots,
  kraftgrid,
  maskingsolid,
  neonstripe,
  vintagepaper,
  linedwarm,
  gridstandard,
  gridfine,
  dotgrid,
  kraftnatural,
] as const;

export const MATERIAL_PRESET_IDS = MATERIAL_PRESET_IDS_INTERNAL;

export type MaterialPresetId = (typeof MATERIAL_PRESET_IDS)[number];

export const MATERIAL_PRESET_REGISTRY = {
  [postit]: {
    label: 'Post-it',
    backgroundColor: '#fce588',
    backgroundImage: 'linear-gradient(135deg, #fff9b0 0%, #fce588 60%, #f5d85a 100%)',
    backgroundSize: '100% 100%',
    textColor: '#5a3e28',
    texture: { glossOpacity: 0.10, gradientIntensity: 0.05, insetShadowOpacity: 0.03, shadowWarmth: 0.85, noiseOpacity: 0.35 },
  },
  [pasteldots]: {
    label: 'Pastel Dots',
    backgroundColor: '#fdf2f8',
    backgroundImage: `radial-gradient(circle at 10px 10px, rgba(244,114,182,0.35) 0 2px, transparent 2px), linear-gradient(135deg, #fff0f6 0%, #fdf2f8 60%, #f5e1eb 100%)`,
    backgroundSize: '20px 20px, 100% 100%',
    textColor: '#7f1d1d',
    texture: { glossOpacity: 0.08, gradientIntensity: 0.04, insetShadowOpacity: 0.02, shadowWarmth: 0.6, noiseOpacity: 0.30 },
  },
  [kraftgrid]: {
    label: 'Kraft Grid',
    backgroundColor: '#f5deb3',
    backgroundImage: `linear-gradient(0deg, rgba(120,53,15,0.13) 1px, transparent 1px), linear-gradient(90deg, rgba(120,53,15,0.13) 1px, transparent 1px), linear-gradient(145deg, #f5deb3 0%, #dcc590 40%, #f5deb3 70%, #d8c088 100%)`,
    backgroundSize: '20px 20px, 20px 20px, 100% 100%',
    textColor: '#78350f',
    texture: { glossOpacity: 0.04, gradientIntensity: 0.04, insetShadowOpacity: 0.04, shadowWarmth: 0.9, noiseOpacity: 0.55 },
  },
  [maskingsolid]: {
    label: 'Masking Solid',
    backgroundColor: '#fde68a',
    backgroundImage: 'linear-gradient(135deg, #fff3c4 0%, #fde68a 60%, #f5d456 100%)',
    backgroundSize: '100% 100%',
    textColor: '#713f12',
    texture: { glossOpacity: 0.08, gradientIntensity: 0.04, insetShadowOpacity: 0.03, shadowWarmth: 0.7, noiseOpacity: 0.32 },
  },
  [neonstripe]: {
    label: 'Neon Stripe',
    backgroundColor: '#d9f99d',
    backgroundImage: `repeating-linear-gradient(-45deg, rgba(34,197,94,0.22) 0 8px, rgba(34,197,94,0.08) 8px 16px), linear-gradient(135deg, #e8ffc0 0%, #d9f99d 60%, #c0e878 100%)`,
    backgroundSize: '100% 100%, 100% 100%',
    textColor: '#14532d',
    texture: { glossOpacity: 0.06, gradientIntensity: 0.03, insetShadowOpacity: 0.02, shadowWarmth: 0.3, noiseOpacity: 0.25 },
  },
  [vintagepaper]: {
    label: 'Vintage Paper',
    backgroundColor: '#f8fafc',
    backgroundImage: `linear-gradient(135deg, rgba(100,116,139,0.08) 0%, rgba(100,116,139,0) 70%), linear-gradient(135deg, #fefeff 0%, #f8fafc 60%, #eef2f6 100%)`,
    backgroundSize: '100% 100%, 100% 100%',
    textColor: '#1e293b',
    texture: { glossOpacity: 0.04, gradientIntensity: 0.02, insetShadowOpacity: 0.02, shadowWarmth: 0.4, noiseOpacity: 0.22 },
  },
  [linedwarm]: {
    label: 'Lined Warm',
    backgroundColor: '#fefcf7',
    backgroundImage: `linear-gradient(transparent 27px, rgba(220,208,192,0.95) 28px), linear-gradient(135deg, #fffdf8 0%, #fefcf7 60%, #f5f0e8 100%)`,
    backgroundSize: '100% 28px, 100% 100%',
    textColor: '#5a3e28',
    texture: { glossOpacity: 0.05, gradientIntensity: 0.03, insetShadowOpacity: 0.02, shadowWarmth: 0.7, noiseOpacity: 0.25 },
  },
  [gridstandard]: {
    label: 'Grid Standard',
    backgroundColor: '#fefcf7',
    backgroundImage: `linear-gradient(rgba(180,170,155,0.22) 1px, transparent 1px), linear-gradient(90deg, rgba(180,170,155,0.22) 1px, transparent 1px), linear-gradient(135deg, #fffdf8 0%, #fefcf7 60%, #f5f0e8 100%)`,
    backgroundSize: '20px 20px, 20px 20px, 100% 100%',
    textColor: '#5a3e28',
    texture: { glossOpacity: 0.05, gradientIntensity: 0.03, insetShadowOpacity: 0.02, shadowWarmth: 0.7, noiseOpacity: 0.25 },
  },
  [gridfine]: {
    label: 'Grid Fine',
    backgroundColor: '#fefcf7',
    backgroundImage: `linear-gradient(rgba(180,170,155,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(180,170,155,0.18) 1px, transparent 1px), linear-gradient(135deg, #fffdf8 0%, #fefcf7 60%, #f5f0e8 100%)`,
    backgroundSize: '10px 10px, 10px 10px, 100% 100%',
    textColor: '#5a3e28',
    texture: { glossOpacity: 0.05, gradientIntensity: 0.03, insetShadowOpacity: 0.02, shadowWarmth: 0.7, noiseOpacity: 0.25 },
  },
  [dotgrid]: {
    label: 'Dot Grid',
    backgroundColor: '#fefcf7',
    backgroundImage: `radial-gradient(circle 1px at 1px 1px, rgba(160,150,135,0.45) 1px, transparent 1px), linear-gradient(135deg, #fffdf8 0%, #fefcf7 60%, #f5f0e8 100%)`,
    backgroundSize: '20px 20px, 100% 100%',
    textColor: '#5a3e28',
    texture: { glossOpacity: 0.05, gradientIntensity: 0.03, insetShadowOpacity: 0.02, shadowWarmth: 0.7, noiseOpacity: 0.25 },
  },
  [kraftnatural]: {
    label: 'Kraft Natural',
    backgroundColor: '#e8d5a8',
    textColor: '#5a3e28',
    texture: { glossOpacity: 0, gradientIntensity: 0, insetShadowOpacity: 0.04, shadowWarmth: 0.95, noiseOpacity: 0.85 },
  },
} as const;
