# Contract: Workspace Style Interpretation

## Purpose

Define how raw workspace `className` input is interpreted into deterministic, category-based style outcomes.

## Contract surface

- Input:
  - raw `className` string
  - eligible object profile
  - class category definitions and priority
  - current workspace revision/session context
- Output:
  - applied category set
  - applied token set
  - ignored token set
  - status: `applied | partial | reset | unsupported`
  - render-consumable style payload (when applicable)
  - style payload fields may include width/height constraints, colors, border/radius, opacity, outline, and composed box-shadow

## Behavioral guarantees

- Same input + same eligible profile + same category matrix yields same output.
- Empty or removed `className` yields `reset` and clears previous interpreted payload.
- Mixed supported/unsupported category input yields `partial`, not silent success.
- Out-of-scope object input yields `unsupported` with diagnostic-ready context.
- Older stale updates must not override newer accepted style state.

## V1 category requirements

- Interpretation must explicitly support:
  - size
  - basic visual styling
  - shadow/elevation
  - outline/emphasis
- Interpretation order must be deterministic and documented by category priority.

## Current implementation notes

- Arbitrary values are supported for the current priority categories when they can be mapped directly to style payload values.
- Variant-prefixed tokens such as `md:` or `hover:` are currently classified but treated as unsupported in v1.
- Mixed input keeps supported tokens in priority order and emits diagnostics for ignored tokens.

## Out of scope

- Full compatibility with every utility syntax in v1
- Automatic semantic correction of unsupported categories or tokens
