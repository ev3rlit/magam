export interface ExampleRegistryConfig {
  include: string[];
  defaultExamplePath?: string;
}

export const exampleRegistryConfig: ExampleRegistryConfig = {
  include: [
    'examples/readme.tsx',
    'examples/showcase_intro.tsx',
    'examples/showcase_mindmap.tsx',
    'examples/showcase_styling.tsx',
    'examples/sequence.tsx',
    'examples/background/custom_grid.tsx',
    'examples/sticky.tsx',
    'examples/sticker.tsx',
    'examples/washi_tape.tsx',
    'examples/size.tsx'
  ],
  defaultExamplePath: 'examples/readme.tsx',
};
