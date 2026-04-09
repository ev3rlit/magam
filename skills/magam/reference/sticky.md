# Sticky Reference

This guide covers the upgraded `Sticky` usage in Magam, including material patterns, shape variants, sizing modes, and `at`-based placement.

## Import

```tsx
import { Canvas, Shape, Sticky, Edge, anchor, attach, preset, solid, svg, image } from '@magam/core';
```

## Quick Start

When `pattern` is omitted, Sticky falls back to the default paper preset (`postit`).

```tsx
<Canvas>
  <Sticky id="todo-1" x={120} y={100}>
    Prepare release notes
  </Sticky>
</Canvas>
```

## Pattern Types

Sticky supports the shared paper-material contract:

- `preset`
- `solid`
- `svg`
- `image`

### 1) Preset

```tsx
<Sticky id="s-preset" x={80} y={80} pattern={preset('lined-warm')}>
  Weekly Review
</Sticky>
```

Preset IDs:

- `postit`
- `pastel-dots`
- `kraft-grid`
- `masking-solid`
- `neon-stripe`
- `vintage-paper`
- `lined-warm`
- `grid-standard`
- `grid-fine`
- `dot-grid`
- `kraft-natural`

Preset color override is supported:

```tsx
<Sticky id="s-preset-color" x={320} y={80} pattern={preset('postit', { color: '#ffb4a2' })}>
  Priority A
</Sticky>
```

### 2) Solid

```tsx
<Sticky id="s-solid" x={560} y={80} pattern={solid('#fde68a')}>
  Action Item
</Sticky>
```

### 3) SVG

```tsx
<Sticky
  id="s-svg"
  x={80}
  y={260}
  pattern={svg({
    markup: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><path d="M0 12h24" stroke="#8b5cf6" stroke-width="2"/></svg>',
  })}
>
  Patterned Note
</Sticky>
```

### 4) Image

```tsx
<Sticky
  id="s-image"
  x={360}
  y={260}
  pattern={image('/assets/paper-grain.png', { scale: 1.2, repeat: 'repeat' })}
>
  Texture Layer
</Sticky>
```

Fallback behavior:

- Invalid `solid` color, bad `svg` payload, missing image source, or unknown preset ID do not throw.
- Resolver applies a deterministic preset fallback (`postit`) for Sticky.

## Shape Variants

Sticky shape options:

- `rectangle` (default)
- `heart`
- `cloud`
- `speech`

```tsx
<Sticky id="shape-rect" x={80} y={460} shape="rectangle">Default</Sticky>
<Sticky id="shape-heart" x={280} y={460} shape="heart">Love It</Sticky>
<Sticky id="shape-cloud" x={500} y={460} shape="cloud">Brainstorm</Sticky>
<Sticky id="shape-speech" x={740} y={460} shape="speech">Discuss</Sticky>
```

## Sizing Modes

### 1) Auto Size (no width/height)

```tsx
<Sticky id="size-auto" x={80} y={620}>
  Auto sizing follows content.
</Sticky>
```

### 2) Width Only

```tsx
<Sticky id="size-width" x={360} y={620} width={220}>
  Width is fixed; height grows with wrapped content.
</Sticky>
```

### 3) Fixed Frame (width + height)

```tsx
<Sticky id="size-fixed" x={680} y={620} width={220} height={120}>
  Frame is fixed and overflow is clipped when content exceeds bounds.
</Sticky>
```

## Placement Modes

Sticky position can use absolute coordinates or `at`:

### 1) Absolute (`x`, `y`)

```tsx
<Sticky id="pos-xy" x={120} y={120}>Absolute placement</Sticky>
```

### 2) Anchor (`at={anchor(...)}`)

```tsx
<Shape id="base-card" x={520} y={140} width={200} height={100}>Base</Shape>

<Sticky
  id="pos-anchor"
  at={anchor('base-card', { position: 'bottom', gap: 20, align: 'center' })}
>
  Anchored below base
</Sticky>
```

### 3) Attach (`at={attach(...)}`)

```tsx
<Sticky
  id="pos-attach"
  at={attach({ target: 'base-card', placement: 'right', span: 0.6, align: 0.5, offset: 12 })}
  pattern={preset('kraft-natural')}
>
  Attached note
</Sticky>
```

Priority rule:

- If both `at` and `x`/`y` are provided, `at` takes precedence.

## Legacy Compatibility

For backward compatibility, old Sticky fields are still accepted:

- `color` -> internally normalized to `pattern={solid(color)}`
- `anchor` + `position` + `gap` + `align` -> normalized into `at={{ type: 'anchor', ... }}`

Preferred modern form:

- Use `pattern` for material
- Use `at` for relative placement

## Full Example

```tsx
import { Canvas, Shape, Sticky, Edge, anchor, preset, solid, image } from '@magam/core';

export default function StickyShowcase() {
  return (
    <Canvas>
      <Shape id="board" x={90} y={70} width={300} height={160}>Planning Board</Shape>

      <Sticky id="s-default" x={120} y={110}>
        Default postit
      </Sticky>

      <Sticky
        id="s-preset"
        x={430}
        y={90}
        shape="speech"
        pattern={preset('grid-standard')}
        width={220}
      >
        Grid preset note
      </Sticky>

      <Sticky
        id="s-solid"
        at={anchor('board', { position: 'bottom', gap: 24 })}
        pattern={solid('#fef08a')}
        shape="cloud"
        width={260}
      >
        Anchored cloud note
        <Edge to="s-preset" />
      </Sticky>

      <Sticky
        id="s-image"
        x={720}
        y={90}
        width={240}
        height={140}
        pattern={image('/assets/fiber-paper.png', { scale: 1.1, repeat: 'repeat' })}
      >
        Fixed frame + image texture
      </Sticky>
    </Canvas>
  );
}
```

