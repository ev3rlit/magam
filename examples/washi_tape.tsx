import {
  Canvas,
  dotgrid,
  gridfine,
  gridstandard,
  image,
  kraftgrid,
  kraftnatural,
  linedwarm,
  maskingsolid,
  neonstripe,
  pasteldots,
  polar,
  postit,
  preset,
  segment,
  solid,
  svg,
  Text,
  texture,
  torn,
  vintagepaper,
  WashiTape,
} from '@magam/core';

/**
 * Washi Tape Collection
 *
 * Two-column stationery-store display:
 *   Left  — all 11 built-in presets
 *   Right — custom patterns (solid / svg / image)
 *
 * Coverage:
 *   Patterns   — preset (11) + solid (4, incl. MUJI branding) + svg (7) + image (3)
 *   Edges      — smooth (default) and torn (0.6–1.3)
 *   Textures   — multiply blend overlay
 *   Placement  — absolute x/y (grid), polar & segment (featured picks)
 */
export default function WashiTapeExample() {
  // ── SVG pattern markups ──────────────────

  const roseDotMarkup = `
    <svg xmlns="http://www.w3.org/2000/svg" width="120" height="28" viewBox="0 0 120 28">
      <rect width="120" height="28" fill="#fce7f3" />
      <circle cx="15" cy="14" r="4" fill="#f9a8d4" fill-opacity="0.6" />
      <circle cx="45" cy="14" r="4" fill="#f9a8d4" fill-opacity="0.6" />
      <circle cx="75" cy="14" r="4" fill="#f9a8d4" fill-opacity="0.6" />
      <circle cx="105" cy="14" r="4" fill="#f9a8d4" fill-opacity="0.6" />
    </svg>
  `;

  const mintStripeMarkup = `
    <svg xmlns="http://www.w3.org/2000/svg" width="80" height="28" viewBox="0 0 80 28">
      <rect width="80" height="28" fill="#ecfdf5" />
      <rect y="0" width="80" height="7" fill="#6ee7b7" fill-opacity="0.4" />
      <rect y="14" width="80" height="5" fill="#34d399" fill-opacity="0.25" />
      <rect y="24" width="80" height="4" fill="#6ee7b7" fill-opacity="0.2" />
    </svg>
  `;

  const ginghamMarkup = `
    <svg xmlns="http://www.w3.org/2000/svg" width="140" height="28" viewBox="0 0 140 28">
      <rect width="140" height="28" fill="#eff6ff" />
      <rect x="0"  y="0"  width="14" height="14" fill="#93c5fd" fill-opacity="0.3" />
      <rect x="14" y="14" width="14" height="14" fill="#93c5fd" fill-opacity="0.3" />
      <rect x="28" y="0"  width="14" height="14" fill="#93c5fd" fill-opacity="0.3" />
      <rect x="42" y="14" width="14" height="14" fill="#93c5fd" fill-opacity="0.3" />
      <rect x="56" y="0"  width="14" height="14" fill="#93c5fd" fill-opacity="0.3" />
      <rect x="70" y="14" width="14" height="14" fill="#93c5fd" fill-opacity="0.3" />
      <rect x="84" y="0"  width="14" height="14" fill="#93c5fd" fill-opacity="0.3" />
      <rect x="98" y="14" width="14" height="14" fill="#93c5fd" fill-opacity="0.3" />
      <rect x="112" y="0" width="14" height="14" fill="#93c5fd" fill-opacity="0.3" />
      <rect x="126" y="14" width="14" height="14" fill="#93c5fd" fill-opacity="0.3" />
    </svg>
  `;

  const starDotMarkup = `
    <svg xmlns="http://www.w3.org/2000/svg" width="140" height="28" viewBox="0 0 140 28">
      <rect width="140" height="28" fill="#fef9c3" />
      <circle cx="20" cy="14" r="3" fill="#facc15" fill-opacity="0.5" />
      <circle cx="50" cy="14" r="2.5" fill="#fbbf24" fill-opacity="0.4" />
      <circle cx="80" cy="14" r="3" fill="#facc15" fill-opacity="0.5" />
      <circle cx="110" cy="14" r="2.5" fill="#fbbf24" fill-opacity="0.4" />
      <path d="M133 8 l2 5 5 0 -4 3 1.5 5 -4.5 -3 -4.5 3 1.5 -5 -4 -3 5 0Z" fill="#f59e0b" fill-opacity="0.4" />
    </svg>
  `;

  const heartMarkup = `
    <svg xmlns="http://www.w3.org/2000/svg" width="150" height="28" viewBox="0 0 150 28">
      <rect width="150" height="28" fill="#fff1f2" />
      <path d="M18 20 C20 15,25 12,25 9 C25 6,23 5,21 5 C19 5,18 7,17 8 C16 7,15 5,13 5 C11 5,9 6,9 9 C9 12,14 15,18 20Z" fill="#fb7185" fill-opacity="0.5" />
      <path d="M53 20 C55 15,60 12,60 9 C60 6,58 5,56 5 C54 5,53 7,52 8 C51 7,50 5,48 5 C46 5,44 6,44 9 C44 12,49 15,53 20Z" fill="#fb7185" fill-opacity="0.5" />
      <path d="M88 20 C90 15,95 12,95 9 C95 6,93 5,91 5 C89 5,88 7,87 8 C86 7,85 5,83 5 C81 5,79 6,79 9 C79 12,84 15,88 20Z" fill="#fb7185" fill-opacity="0.5" />
      <path d="M123 20 C125 15,130 12,130 9 C130 6,128 5,126 5 C124 5,123 7,122 8 C121 7,120 5,118 5 C116 5,114 6,114 9 C114 12,119 15,123 20Z" fill="#fb7185" fill-opacity="0.5" />
    </svg>
  `;

  const confettiMarkup = `
    <svg xmlns="http://www.w3.org/2000/svg" width="140" height="28" viewBox="0 0 140 28">
      <rect width="140" height="28" fill="#faf5ff" />
      <rect x="10" y="8" width="5" height="5" rx="1" fill="#c084fc" fill-opacity="0.5" transform="rotate(15 12 10)" />
      <rect x="38" y="15" width="6" height="4" rx="1" fill="#f472b6" fill-opacity="0.4" transform="rotate(-20 41 17)" />
      <circle cx="65" cy="12" r="3.5" fill="#67e8f9" fill-opacity="0.45" />
      <rect x="88" y="10" width="5" height="5" rx="1" fill="#fbbf24" fill-opacity="0.5" transform="rotate(30 90 12)" />
      <circle cx="115" cy="16" r="3" fill="#86efac" fill-opacity="0.45" />
      <rect x="130" y="6" width="4" height="6" rx="1" fill="#fb923c" fill-opacity="0.4" transform="rotate(-10 132 9)" />
    </svg>
  `;

  const waveMarkup = `
    <svg xmlns="http://www.w3.org/2000/svg" width="120" height="28" viewBox="0 0 120 28">
      <rect width="120" height="28" fill="#f0f9ff" />
      <path d="M0 12 Q15 4,30 12 Q45 20,60 12 Q75 4,90 12 Q105 20,120 12" stroke="#7dd3fc" stroke-width="2.5" fill="none" stroke-opacity="0.55" />
      <path d="M0 20 Q15 12,30 20 Q45 28,60 20 Q75 12,90 20 Q105 28,120 20" stroke="#38bdf8" stroke-width="1.5" fill="none" stroke-opacity="0.3" />
    </svg>
  `;

  // ── Image patterns ───────────────────────

  const cherryPattern =
    'data:image/svg+xml;utf8,'
    + encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="80" height="28" viewBox="0 0 80 28">
        <rect width="80" height="28" fill="#fce7f3" />
        <rect width="80" height="6" fill="#fbcfe8" fill-opacity="0.6" />
        <rect y="12" width="80" height="4" fill="#f9a8d4" fill-opacity="0.3" />
        <circle cx="20" cy="20" r="2" fill="#ec4899" fill-opacity="0.35" />
        <circle cx="50" cy="22" r="1.5" fill="#ec4899" fill-opacity="0.25" />
        <circle cx="70" cy="19" r="2.5" fill="#f472b6" fill-opacity="0.2" />
      </svg>
    `);

  const honeyPattern =
    'data:image/svg+xml;utf8,'
    + encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="80" height="28" viewBox="0 0 80 28">
        <rect width="80" height="28" fill="#fef3c7" />
        <rect width="80" height="8" fill="#fcd34d" fill-opacity="0.42" />
        <rect y="14" width="80" height="6" fill="#f59e0b" fill-opacity="0.25" />
      </svg>
    `);

  const sunsetPattern =
    'data:image/svg+xml;utf8,'
    + encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="80" height="28" viewBox="0 0 80 28">
        <defs>
          <linearGradient id="sunset" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="#fde68a" stop-opacity="0.7" />
            <stop offset="50%" stop-color="#fdba74" stop-opacity="0.6" />
            <stop offset="100%" stop-color="#fca5a5" stop-opacity="0.7" />
          </linearGradient>
        </defs>
        <rect width="80" height="28" fill="url(#sunset)" />
      </svg>
    `);

  // ── Layout constants ─────────────────────
  const x1 = 100;           // left column x
  const x2 = 500;           // right column x
  const w = 300;
  const h = 26;
  const sp = 38;             // vertical spacing
  const startY = 92;

  return (
    <Canvas>
      <Text id="title" x={90} y={28}>Washi Tape Collection</Text>

      {/* ══ Left Column — Built-in Presets ══ */}
      <Text id="lbl-presets" x={x1} y={64}>Presets</Text>

      <WashiTape id="t-postit" x={x1} y={startY} width={w} height={h}
        pattern={preset(postit)}
        text={{ align: 'center', size: 11 }}
      >Honey Note</WashiTape>

      <WashiTape id="t-pasteldots" x={x1} y={startY + sp} width={w} height={h}
        pattern={preset(pasteldots)}
        text={{ align: 'center', size: 11 }}
      >Pink Polka</WashiTape>

      <WashiTape id="t-kraftgrid" x={x1} y={startY + 2 * sp} width={w} height={h}
        pattern={preset(kraftgrid)}
        edge={torn(0.8)}
        text={{ align: 'center', color: '#78350f', size: 11 }}
      >Craft Grid</WashiTape>

      <WashiTape id="t-maskingsolid" x={x1} y={startY + 3 * sp} width={w} height={h}
        pattern={preset(maskingsolid)}
        edge={torn(1.0)}
        text={{ align: 'center', color: '#78350f', size: 11 }}
      >Masking Tape</WashiTape>

      <WashiTape id="t-neonstripe" x={x1} y={startY + 4 * sp} width={w} height={h}
        pattern={preset(neonstripe)}
        text={{ align: 'center', size: 11 }}
      >Neon Stripe</WashiTape>

      <WashiTape id="t-vintagepaper" x={x1} y={startY + 5 * sp} width={w} height={h}
        pattern={preset(vintagepaper)}
        edge={torn(0.6)}
        text={{ align: 'center', color: '#78350f', size: 11 }}
      >Vintage Paper</WashiTape>

      <WashiTape id="t-linedwarm" x={x1} y={startY + 6 * sp} width={w} height={h}
        pattern={preset(linedwarm)}
        text={{ align: 'center', size: 11 }}
      >Warm Lined</WashiTape>

      <WashiTape id="t-gridstandard" x={x1} y={startY + 7 * sp} width={w} height={h}
        pattern={preset(gridstandard)}
        text={{ align: 'center', size: 11 }}
      >Standard Grid</WashiTape>

      <WashiTape id="t-gridfine" x={x1} y={startY + 8 * sp} width={w} height={h}
        pattern={preset(gridfine)}
        text={{ align: 'center', size: 11 }}
      >Fine Grid</WashiTape>

      <WashiTape id="t-dotgrid" x={x1} y={startY + 9 * sp} width={w} height={h}
        pattern={preset(dotgrid)}
        text={{ align: 'center', size: 11 }}
      >Dot Grid</WashiTape>

      <WashiTape id="t-kraftnatural" x={x1} y={startY + 10 * sp} width={w} height={h}
        pattern={preset(kraftnatural)}
        edge={torn(1.2)}
        text={{ align: 'center', color: '#78350f', size: 11 }}
      >Natural Kraft</WashiTape>

      {/* ══ Right Column — Custom Patterns ══ */}
      <Text id="lbl-custom" x={x2} y={64}>Custom Patterns</Text>

      {/* solid */}
      <WashiTape id="t-lavender" x={x2} y={startY} width={w} height={h}
        pattern={solid('#e9d5ff')}
        edge={torn(0.8)}
        text={{ align: 'center', color: '#6b21a8', size: 11 }}
      >Lavender</WashiTape>

      {/* MUJI branding — Natural / Red / Earth */}
      <WashiTape id="t-muji-natural" x={x2} y={startY + sp} width={w} height={h}
        pattern={solid('#C8BBA7')}
        text={{ align: 'center', color: '#4A3C32', size: 11 }}
      >MUJI Natural</WashiTape>

      <WashiTape id="t-muji-red" x={x2} y={startY + 2 * sp} width={w} height={h}
        pattern={solid('#B5121B')}
        text={{ align: 'center', color: '#fef2f2', size: 11 }}
      >MUJI Red</WashiTape>

      <WashiTape id="t-muji-earth" x={x2} y={startY + 3 * sp} width={w} height={h}
        pattern={solid('#4A3C32')}
        text={{ align: 'center', color: '#C8BBA7', size: 11 }}
      >MUJI Earth</WashiTape>

      {/* svg — 7 patterns */}
      <WashiTape id="t-rosedot" x={x2} y={startY + 4 * sp} width={w} height={h}
        pattern={svg({ markup: roseDotMarkup })}
        text={{ align: 'center', color: '#9d174d', size: 11 }}
      >Rose Dot</WashiTape>

      <WashiTape id="t-mintstripe" x={x2} y={startY + 5 * sp} width={w} height={h}
        pattern={svg({ markup: mintStripeMarkup })}
        text={{ align: 'center', color: '#065f46', size: 11 }}
      >Mint Stripe</WashiTape>

      <WashiTape id="t-gingham" x={x2} y={startY + 6 * sp} width={w} height={h}
        pattern={svg({ markup: ginghamMarkup })}
        text={{ align: 'center', color: '#1e40af', size: 11 }}
      >Blue Gingham</WashiTape>

      <WashiTape id="t-stardot" x={x2} y={startY + 7 * sp} width={w} height={h}
        pattern={svg({ markup: starDotMarkup })}
        text={{ align: 'center', color: '#92400e', size: 11 }}
      >Star Dot</WashiTape>

      <WashiTape id="t-heartline" x={x2} y={startY + 8 * sp} width={w} height={h}
        pattern={svg({ markup: heartMarkup })}
        text={{ align: 'center', color: '#9f1239', size: 11 }}
      >Heart Line</WashiTape>

      <WashiTape id="t-confetti" x={x2} y={startY + 9 * sp} width={w} height={h}
        pattern={svg({ markup: confettiMarkup })}
        texture={texture({ opacity: 0.12, blendMode: 'multiply' })}
        text={{ align: 'center', color: '#6b21a8', size: 11 }}
      >Confetti</WashiTape>

      <WashiTape id="t-wave" x={x2} y={startY + 10 * sp} width={w} height={h}
        pattern={svg({ markup: waveMarkup })}
        text={{ align: 'center', color: '#0369a1', size: 11 }}
      >Ocean Wave</WashiTape>

      {/* image — 3 patterns */}
      <WashiTape id="t-cherry" x={x2} y={startY + 11 * sp} width={w} height={h}
        pattern={image(cherryPattern, { scale: 1, repeat: 'repeat-x' })}
        text={{ align: 'center', color: '#9d174d', size: 11 }}
      >Cherry Blossom</WashiTape>

      <WashiTape id="t-honey" x={x2} y={startY + 12 * sp} width={w} height={h}
        pattern={image(honeyPattern, { scale: 1, repeat: 'repeat-x' })}
        text={{ align: 'center', color: '#78350f', size: 11 }}
      >Honey Stripe</WashiTape>

      <WashiTape id="t-sunset" x={x2} y={startY + 13 * sp} width={w} height={h}
        pattern={image(sunsetPattern, { scale: 1, repeat: 'repeat-x' })}
        text={{ align: 'center', color: '#9a3412', size: 11 }}
      >Sunset Glow</WashiTape>

      {/* ══ Featured — polar & segment ══════ */}
      <Text id="lbl-pick" x={x1} y={startY + 14 * sp + 28}>Today's Pick</Text>

      <WashiTape
        id="t-pick-polar"
        at={polar(320, startY + 15 * sp + 40, 340, -5, { thickness: 30 })}
        pattern={preset(pasteldots)}
        text={{ align: 'center', size: 12 }}
        opacity={0.88}
      >
        spring mood
      </WashiTape>

      <WashiTape
        id="t-pick-segment"
        at={segment(
          { x: 100, y: startY + 16 * sp + 52 },
          { x: 480, y: startY + 16 * sp + 64 },
          { thickness: 28 },
        )}
        pattern={solid('#fcd34d')}
        edge={torn(1.3)}
        text={{ align: 'center', color: '#78350f', size: 12 }}
      >
        sunshine
      </WashiTape>
    </Canvas>
  );
}
