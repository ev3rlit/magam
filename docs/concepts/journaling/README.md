# 📒 Handcrafted Journal UI — Concept Library

> **Aesthetic**: Kawaii Stationery × Analog Scrapbook × Paper Craft  
> **Tech Stack**: Pure HTML + CSS + Inline SVG (no dependencies)  
> **Purpose**: Reusable UI components for journal-style, diary-decoration web interfaces

---

## 📂 File Structure

```
journaling/
├── README.md              ← this file
├── SYSTEM_PROMPT.md       ← AI generation prompt for reproducing this style
├── index.html             ← full demo page (all components composed)
└── components/
    ├── washi-tape.html    ← decorative tape strips (6 colors, 2 edge cuts)
    ├── lined-paper.html   ← ruled notebook paper with red margin
    ├── grid-paper.html    ← graph paper, fine grid, dot grid
    ├── kraft-paper.html   ← recycled brown paper with fiber texture
    ├── postit.html        ← sticky notes (6 colors, curl & fold effects)
    ├── pin.html           ← push pins (6 colors, 3 sizes)
    ├── stamp.html         ← rubber stamps (5 colors, round, double border)
    ├── torn-paper.html    ← torn edges (top, bottom, right, both)
    ├── stickers-emoji.html ← SVG symbol stickers + emoji particles
    ├── photo-frame.html   ← polaroid frames (standard, landscape, vintage)
    └── handwriting.html   ← font families + text effects (highlight, underline, circle, strike)
```

## 🧩 Components Overview

### 🎀 Washi Tape
Semi-transparent decorative tape with patterned overlays. Each color has a unique pattern: diagonal stripes, polka dots, horizontal lines, etc. Torn-edge clip-path variants for organic cuts.

**Classes**: `.washi` `.washi-pink` `.washi-mint` `.washi-butter` `.washi-lavender` `.washi-sky` `.washi-peach` `.washi-edge-left` `.washi-edge-right`

### 📝 Lined Paper
Classic ruled notebook with 28px line spacing and a red margin line at 42px from left. Optional hole-punch marks for binder look.

**Classes**: `.paper-note` `.paper-lined` `.paper-punched`

### 📐 Grid Paper
Three variants: standard 20px grid, fine 10px grid, and dot grid (bullet journal style). All use CSS `background-image` with no SVG overhead.

**Classes**: `.paper-grid` `.paper-grid-fine` `.paper-grid-dot`

### 📦 Kraft Paper
Warm brown recycled-paper surface. Texture via SVG `feTurbulence` noise + radial speckle pattern. Light and dark variants.

**Classes**: `.paper-kraft` `.paper-kraft-dark`

### 📌 Post-it Notes
Gradient-shaded sticky notes with adhesive-edge gloss strip and corner curl/fold effects. Six colors, bouncy hover interaction.

**Classes**: `.postit` `.postit-yellow` `.postit-pink` `.postit-blue` `.postit-green` `.postit-orange` `.postit-lavender` `.postit-curl` `.postit-curl-bl` `.postit-fold`

### 📍 Push Pins
3D sphere illusion via radial gradient + highlight dot. Three sizes (sm/default/lg), six colors including white and black.

**Classes**: `.pin` `.pin-red` `.pin-yellow` `.pin-blue` `.pin-green` `.pin-white` `.pin-black` `.pin-sm` `.pin-lg`

### 🔏 Rubber Stamps
Vintage stamp with border, ink-bleed noise texture, and slam-down animation. Round variant with double-border option.

**Classes**: `.stamp` `.stamp-red` `.stamp-blue` `.stamp-green` `.stamp-purple` `.stamp-brown` `.stamp-round` `.stamp-double` `.stamp-faded` `.stamp-animate`

### ✂️ Torn Paper
CSS `clip-path: polygon()` with hand-tuned jagged points. Four edge variants that can be combined with any paper type.

**Classes**: `.paper-torn-bottom` `.paper-torn-top` `.paper-torn-right` `.paper-torn-both`

### 🌸 SVG Stickers & Emoji
Reusable SVG `<symbol>` definitions: `#flower-1` (pink), `#flower-2` (lavender), `#star`, `#heart`, `#cloud`, `#leaf`. Emoji stickers with click-to-burst particle effects.

**Classes**: `.sticker` `.emoji-sticker`

### 📷 Photo Frame
Polaroid-style white-border frame with caption area. Landscape and vintage (sepia-tinted) variants. Combine with pins or washi tape for attachment.

**Classes**: `.photo-frame` `.photo-frame-landscape` `.photo-frame-vintage`

### ✍️ Handwriting & Text Effects
Six curated Google Font families for Korean + English handwriting. Four text decoration effects: highlighter, wavy underline, hand-drawn circle, scribble strikethrough.

**Font classes**: `.hand-title` `.hand-body` `.hand-cursive` `.hand-marker` `.hand-casual` `.hand-english`  
**Effect classes**: `.hand-highlight` `.hand-underline` `.hand-circle` `.hand-strike`

---

## 🎨 Art Design Prompts

Use these prompts to guide AI generation or communicate the visual direction to designers.

### Core Aesthetic Prompt

```
Handcrafted scrapbook journal page. Cream-colored desk surface with scattered 
stationery elements. Warm analog aesthetic — nothing digital or sterile. Paper 
textures are visible (grain, fiber, creases). Colors are soft pastels: pink, 
mint, butter yellow, lavender, peach, sky blue. All text appears hand-written 
in brown ink. Elements are slightly tilted at random angles (±1–4°) as if placed 
by hand. Washi tape strips hold paper notes in place. Post-it notes have curled 
corners. Push pins attach polaroid photos. Rubber stamps leave faded ink marks. 
Torn paper edges are jagged and organic. SVG flower stickers, hearts, and stars 
are scattered between notes. The mood is cozy, warm, and creative.
```

### Washi Tape Pattern Prompt

```
Japanese washi tape strip, semi-transparent adhesive tape. 28px height, elongated 
horizontal rectangle. Each tape has a unique repeating pattern printed on it:
  - Pink: 45° diagonal stripes (5px spacing)
  - Mint: -45° diagonal stripes (4px spacing)
  - Butter: horizontal thin lines (6px spacing)
  - Lavender: 60° steep diagonal stripes (3px spacing)
  - Sky: polka dots (2px circles, 8px grid)
  - Peach: vertical bar segments (8px spacing)
Edges are slightly irregular (clip-path cut). Applied with mix-blend-mode: multiply 
for translucency over paper underneath.
```

### Paper Texture Prompt

```
Four paper texture surfaces:
1. LINED: White paper (#fefcf7) with light brown horizontal rules every 28px. 
   A faded red vertical margin line 42px from left edge. Feels like a school notebook.
2. GRID: White paper with a subtle gray grid (20px cells, 1px lines, 20% opacity). 
   Engineering/graph paper feel.
3. DOT GRID: White paper with small dots (1px) at 20px intervals. Bullet journal style.
4. KRAFT: Warm brown (#e8d5a8) recycled paper with visible grain noise (SVG feTurbulence) 
   and tiny speckle dots. Organic, eco-friendly feel.
All papers have warm drop shadows (brown-tinted, never gray/blue).
```

### Post-it Note Prompt

```
Square sticky note (180×140px). Three-tone gradient from top-left to bottom-right:
light → medium → deep. A subtle white gloss strip across the top 30px simulates 
the adhesive edge catching light. Bottom-right corner peels up with a triangular 
shadow. On hover, the note lifts slightly (scale 1.04) and straightens its rotation 
to 0° with a bouncy ease. Available in: yellow, pink, blue, green, orange, lavender.
Content is written in Gaegu font, 17px, brown ink.
```

### Sticker & Doodle Prompt

```
Cute kawaii SVG stickers. Flat vector style with minimal strokes:
  - FLOWER 1: Five overlapping pink circles around a yellow center (daisy)
  - FLOWER 2: Five elongated lavender petals rotated 72° each, yellow center
  - STAR: Classic 5-point star, yellow fill with gold stroke
  - HEART: Soft pink heart with subtle pink-hot stroke
  - CLOUD: Cluster of 5 overlapping ellipses in light blue
  - LEAF: Teardrop shape in mint green with center vein and side veins
  - CAT DOODLE: Simple pencil-sketch cat with round head, triangle ears, 
    dot eyes, tiny nose, curved smile, whiskers, oval body, curled tail
All stickers have drop-shadow filter. Hover scales to 1.25×. Click spawns 
5 emoji particles that fly outward and fade.
```

### Rubber Stamp Prompt

```
Vintage rubber ink stamp. Rectangular with 3px border, 4px border-radius, 
uppercase text in Patrick Hand font, 2px letter-spacing. Rotated -8° for 
hand-stamped look. Ink color at 70% opacity to simulate imperfect stamp pressure. 
SVG feTurbulence noise overlay for ink-bleed texture. Entrance animation: slams 
down from 2.5× scale, bounces to 0.9×, settles at 1×. Available colors: 
red (#cc4444), blue (#3366aa), green (#338855), purple (#7744aa), brown (#8b6914).
Round variant: 90×90px circle with double outline border.
```

### Torn Paper Edge Prompt

```
Paper with irregular torn edges. CSS clip-path polygon with ~30 control points 
per edge. Points alternate between 87%–93% of the edge dimension to create a 
jagged, organic rip pattern. Extra padding on the torn side prevents content 
clipping. Available edges: bottom, top, right, both (top+bottom). The torn edge 
reveals the cream background underneath, creating a natural layered collage look.
Combine with kraft paper for a vintage scrapbook strip aesthetic.
```

### Overall Page Composition Prompt

```
Full journal page layout on a cream canvas (max-width 1100px, centered).
Composition layers from back to front:

1. BACKGROUND: Cream (#faf5eb) with subtle crosshatch and SVG noise grain overlay
2. PAPER NOTES: Lined and grid paper notes as main content areas, slightly rotated
3. POST-ITS: Scattered sticky notes with to-do lists, quotes, and quick notes
4. WASHI TAPE: Colorful tape strips crossing over paper edges to "attach" them
5. STICKERS: SVG flowers, hearts, stars scattered in gaps between notes
6. EMOJI: Floating emoji decorations (🌸🦋✨🎀) with gentle animation
7. PINS: Red/yellow/blue push pins attaching photo frames and cards
8. STAMPS: Faded "Approved" or "Complete" stamps at random angles

Header has a brush-stroke SVG underline animation. Two-column layout for main 
content. Bottom "scrapbook corner" is a free-form area with absolutely-positioned 
scattered elements. Footer has a washi tape decoration and "made with love" caption.
All elements have staggered entrance animations (0.1s–2.0s delay).
```

---

## 🎨 Color Palette

| Swatch | Name | Hex | Usage |
|--------|------|-----|-------|
| 🟫 | Cream | `#faf5eb` | Page background |
| ⬜ | Warm White | `#fefcf7` | Paper surface |
| 🟤 | Kraft | `#c9a96e` | Brown paper |
| 🟡 | Kraft Light | `#e8d5a8` | Kraft surface |
| 🩷 | Pink Soft | `#f7c5cc` | Washi, stickers |
| ❤️ | Pink Hot | `#e8668a` | Accents, underlines |
| 💚 | Mint | `#b8e6d0` | Washi, checkmarks |
| 💜 | Lavender | `#d4c5f0` | Washi, flowers |
| 💛 | Butter | `#fce588` | Post-its, highlights |
| 🧡 | Peach | `#fbd0b0` | Washi, warmth |
| 💙 | Sky | `#b3d9f2` | Washi, coolness |
| 🖊️ | Brown Ink | `#5a3e28` | All text |

## 🔤 Typography Stack

| Class | Font | Weight | Size | Use |
|-------|------|--------|------|-----|
| `.hand-title` | Nanum Pen Script | 400 | 42px | Page/section headings |
| `.hand-body` | Gaegu | 400 | 19px | Body text, diary entries |
| `.hand-cursive` | Caveat | 600 | 24px | Elegant quotes, signatures |
| `.hand-marker` | Gamja Flower | 400 | 24px | Section labels, markers |
| `.hand-casual` | Single Day | 400 | 22px | Casual notes, asides |
| `.hand-english` | Patrick Hand | 400 | 22px | Stamps, Latin labels |

**Google Fonts import:**
```
https://fonts.googleapis.com/css2?family=Caveat:wght@400;600;700&family=Nanum+Pen+Script&family=Patrick+Hand&family=Gaegu:wght@300;400;700&family=Single+Day&family=Gamja+Flower&display=swap
```

---

## 🚀 Quick Start

Open any component HTML file directly in a browser to preview it standalone. Open `index.html` for the full composed demo page.

To use components in your own project:
1. Copy the relevant CSS from any component's `<style>` block
2. Copy the SVG `<defs>` block from `stickers-emoji.html` if using SVG stickers
3. Add the Google Fonts `<link>` tag
4. Compose your page using the class names documented above

---

## 📝 Notes

- All components are **zero-dependency** — pure HTML, CSS, and inline SVG
- SVG stickers use `<symbol>` + `<use>` for efficient reuse
- Paper textures use CSS `background-image` gradients (no external images)
- Noise/grain textures use inline SVG data URIs with `feTurbulence`
- Animations are CSS-only except for emoji particle effects (minimal JS)
- Responsive breakpoint at 768px collapses to single-column layout
