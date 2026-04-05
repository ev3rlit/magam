export interface ExampleRegistryOverride {
  title?: string;
  description?: string;
  category?: string;
}

export interface ExampleRegistryConfig {
  include: string[];
  defaultExamplePath?: string;
  overrides?: Record<string, ExampleRegistryOverride>;
}

export const exampleRegistryConfig: ExampleRegistryConfig = {
  include: [
    'examples/readme.tsx',
    'examples/showcase_intro.tsx',
    'examples/showcase_mindmap.tsx',
    'examples/showcase_styling.tsx',
    'examples/sequence.tsx',
    'examples/background/custom_grid.tsx',
  ],
  defaultExamplePath: 'examples/readme.tsx',
  overrides: {
    'examples/readme.tsx': {
      title: 'Magam Readme',
      description: 'Core positioning and AI-native workflow overview.',
      category: 'Getting started',
    },
    'examples/showcase_intro.tsx': {
      title: 'Intro Showcase',
      description: 'High-level product introduction rendered as a mind map.',
      category: 'Showcases',
    },
    'examples/showcase_mindmap.tsx': {
      title: 'MindMap Showcase',
      description: 'MindMap layout patterns, structure rules, and interaction hints.',
      category: 'Showcases',
    },
    'examples/showcase_styling.tsx': {
      title: 'Styling Showcase',
      description: 'Tailwind-based node styling examples for prompt-driven visuals.',
      category: 'Showcases',
    },
    'examples/sequence.tsx': {
      title: 'Authentication Sequence',
      description: 'A compact sequence example that exercises participants and messages.',
      category: 'Flow diagrams',
    },
    'examples/background/custom_grid.tsx': {
      title: 'Custom Grid Background',
      description: 'Nested-folder example with a custom canvas background pattern.',
      category: 'Backgrounds',
    },
  },
};
