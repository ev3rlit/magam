import { Canvas, Image, Sticker } from '@magam/core';

/**
 * Sticker Example
 *
 * Practical diary-deco sticker samples (no markdown).
 */
export default function StickerExample() {
  const washiTapeSticker =
    'data:image/svg+xml;utf8,'
    + encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="240" height="110" viewBox="0 0 240 110">
        <defs>
          <linearGradient id="tape" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="#fde68a" stop-opacity="0.88" />
            <stop offset="100%" stop-color="#fbcfe8" stop-opacity="0.88" />
          </linearGradient>
        </defs>
        <path d="M14 20 Q120 2 226 20 L226 90 Q120 108 14 90 Z" fill="url(#tape)" />
        <path d="M22 28 Q120 14 218 28" stroke="#ffffff" stroke-opacity="0.7" stroke-width="3" fill="none" />
        <path d="M24 82 Q120 96 216 82" stroke="#ffffff" stroke-opacity="0.6" stroke-width="2" fill="none" />
      </svg>
    `);

  const polaroidHeartSticker =
    'data:image/svg+xml;utf8,'
    + encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" viewBox="0 0 180 180">
        <rect x="22" y="18" width="136" height="144" rx="16" fill="#ffffff" />
        <rect x="36" y="34" width="108" height="90" rx="10" fill="#fef3c7" />
        <path d="M90 112 C96 96, 122 88, 122 72 C122 62,114 54,104 54 C98 54,93 57,90 62 C87 57,82 54,76 54 C66 54,58 62,58 72 C58 88,84 96,90 112Z" fill="#fb7185" />
      </svg>
    `);

  const pressedFlowerSticker =
    'data:image/svg+xml;utf8,'
    + encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" viewBox="0 0 180 180">
        <rect x="14" y="14" width="152" height="152" rx="22" fill="#ffffff" fill-opacity="0.86" />
        <path d="M92 36 C84 66, 78 92, 82 132" stroke="#166534" stroke-width="5" stroke-linecap="round" fill="none" />
        <ellipse cx="70" cy="76" rx="24" ry="16" fill="#f9a8d4" transform="rotate(-26 70 76)" />
        <ellipse cx="108" cy="64" rx="22" ry="14" fill="#fca5a5" transform="rotate(22 108 64)" />
        <ellipse cx="104" cy="106" rx="26" ry="16" fill="#86efac" transform="rotate(-14 104 106)" />
      </svg>
    `);

  const ticketStubSticker =
    'data:image/svg+xml;utf8,'
    + encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="280" height="120" viewBox="0 0 280 120">
        <rect x="12" y="12" width="256" height="96" rx="16" fill="#fef3c7" />
        <path d="M84 12 V108" stroke="#f59e0b" stroke-dasharray="7 7" stroke-width="3" />
        <text x="44" y="66" font-family="Arial, sans-serif" font-size="16" font-weight="700" text-anchor="middle" fill="#92400e">NO.17</text>
        <text x="172" y="56" font-family="Arial, sans-serif" font-size="24" font-weight="700" text-anchor="middle" fill="#78350f">WEEKEND</text>
        <text x="172" y="82" font-family="Arial, sans-serif" font-size="14" text-anchor="middle" fill="#92400e">MEMORY PASS</text>
      </svg>
    `);

  return (
    <Canvas>
      <Sticker
        id="sticker-title"
        x={80}
        y={64}
        rotation={-4}
      >
        2026 Diary
      </Sticker>

      <Sticker
        id="sticker-mood"
        x={326}
        y={72}
        rotation={5}
      >
        ☀️ Good Day
      </Sticker>

      <Sticker
        id="sticker-washi"
        x={90}
        y={176}
        rotation={-8}
      >
        <Image src={washiTapeSticker} alt="Washi tape sticker" width={190} height={82} />
      </Sticker>

      <Sticker
        id="sticker-polaroid"
        x={332}
        y={156}
        rotation={3}
      >
        <Image src={polaroidHeartSticker} alt="Polaroid heart sticker" width={132} height={132} />
      </Sticker>

      <Sticker
        id="sticker-star-svg"
        x={548}
        y={84}
        rotation={-6}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="148"
          height="116"
          viewBox="-72 -66 144 132"
          role="img"
          aria-label="Star badge"
        >
          <path
            d="M0 -58 L14 -20 L58 -20 L22 6 L36 50 L0 24 L-36 50 L-22 6 L-58 -20 L-14 -20 Z"
            fill="#fef08a"
            stroke="#1e3a8a"
            strokeWidth="7"
            strokeLinejoin="round"
          />
          <circle cx="0" cy="0" r="14" fill="#ffffff" fillOpacity="0.9" />
          <text
            x="0"
            y="6"
            textAnchor="middle"
            fontSize="14"
            fontFamily="Arial, sans-serif"
            fontWeight="700"
            fill="#1e3a8a"
          >
            BEST
          </text>
        </svg>
      </Sticker>

      <Sticker
        id="sticker-check"
        x={548}
        y={240}
        rotation={4}
      >
        ✔ Done
      </Sticker>

      <Sticker
        id="sticker-emoji"
        x={676}
        y={168}
      >
        🌿✨📷
      </Sticker>

      <Sticker id="sticker-note-1" x={72} y={310} rotation={-7}>
        coffee + journaling
      </Sticker>
      <Sticker id="sticker-note-2" x={280} y={304} rotation={6}>
        playlist of the day 🎧
      </Sticker>
      <Sticker id="sticker-note-3" x={564} y={334} rotation={-3}>
        tiny wins matter
      </Sticker>
      <Sticker id="sticker-note-4" x={856} y={92} rotation={8}>
        📌 Top 3 goals today
      </Sticker>
      <Sticker id="sticker-note-5" x={854} y={250} rotation={-6}>
        stretch • water • walk
      </Sticker>
      <Sticker id="sticker-note-6" x={1036} y={318} rotation={4}>
        22:30 lights off
      </Sticker>

      <Sticker id="sticker-emoji-line-1" x={1004} y={92} rotation={-4}>
        🌼🫧🖇️🎀
      </Sticker>
      <Sticker id="sticker-emoji-line-2" x={1164} y={178} rotation={5}>
        🍋☁️💛📝
      </Sticker>
      <Sticker id="sticker-emoji-line-3" x={948} y={414} rotation={-5}>
        🧃📚🪴✨
      </Sticker>

      <Sticker id="sticker-washi-2" x={700} y={400} rotation={-11}>
        <Image src={washiTapeSticker} alt="Washi tape sticker 2" width={170} height={72} />
      </Sticker>
      <Sticker id="sticker-washi-3" x={1014} y={486} rotation={9}>
        <Image src={washiTapeSticker} alt="Washi tape sticker 3" width={190} height={80} />
      </Sticker>
      <Sticker id="sticker-polaroid-2" x={188} y={432} rotation={-10}>
        <Image src={polaroidHeartSticker} alt="Polaroid heart sticker 2" width={118} height={118} />
      </Sticker>
      <Sticker id="sticker-polaroid-3" x={450} y={474} rotation={8}>
        <Image src={pressedFlowerSticker} alt="Pressed flower card sticker" width={132} height={132} />
      </Sticker>
      <Sticker id="sticker-ticket" x={754} y={520} rotation={-4}>
        <Image src={ticketStubSticker} alt="Ticket stub sticker" width={210} height={92} />
      </Sticker>

      <Sticker id="sticker-svg-heart" x={1128} y={72} rotation={-9}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="132"
          height="104"
          viewBox="0 0 180 140"
          role="img"
          aria-label="Heart badge"
        >
          <path
            d="M90 124 C78 112, 22 78, 22 42 C22 24,36 12,52 12 C68 12,80 22,90 34 C100 22,112 12,128 12 C144 12,158 24,158 42 C158 78,102 112,90 124Z"
            fill="#fda4af"
            stroke="#9f1239"
            strokeWidth="8"
            strokeLinejoin="round"
          />
          <text x="90" y="72" textAnchor="middle" fontSize="20" fontWeight="700" fill="#881337">LOVE</text>
        </svg>
      </Sticker>

      <Sticker id="sticker-svg-lemon" x={1188} y={286} rotation={7}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="130"
          height="100"
          viewBox="0 0 180 140"
          role="img"
          aria-label="Lemon badge"
        >
          <ellipse cx="90" cy="70" rx="70" ry="44" fill="#fde047" stroke="#ca8a04" strokeWidth="8" />
          <path d="M34 70 L146 70" stroke="#fef9c3" strokeWidth="6" strokeLinecap="round" />
          <text x="90" y="78" textAnchor="middle" fontSize="18" fontWeight="700" fill="#713f12">FRESH</text>
        </svg>
      </Sticker>

      <Sticker id="sticker-svg-cloud" x={72} y={540} rotation={6}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="190"
          height="102"
          viewBox="0 0 260 140"
          role="img"
          aria-label="Cloud memo badge"
        >
          <path
            d="M70 114 C40 114, 20 96, 20 72 C20 48,40 32,62 32 C68 18,84 10,100 10 C118 10,134 22,140 40 C148 34,158 30,170 30 C196 30,218 50,218 76 C218 98,198 114,174 114 Z"
            fill="#dbeafe"
            stroke="#1d4ed8"
            strokeWidth="7"
            strokeLinejoin="round"
          />
          <text x="120" y="82" textAnchor="middle" fontSize="20" fontWeight="700" fill="#1e40af">TODAY</text>
        </svg>
      </Sticker>
    </Canvas>
  );
}
