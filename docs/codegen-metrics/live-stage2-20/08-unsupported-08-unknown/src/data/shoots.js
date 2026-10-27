import React from 'react';

// Each shoot has an inline SVG scene rendered as JSX for the card placeholder image.
const shoots = [
  {
    id: 'farm-to-table',
    title: 'Farm-to-Table Dinner',
    category: 'Restaurant',
    description: 'A seasonal tasting menu at Gut Wiesenhof — earthy, honest plating photographed in the golden hour light of their open kitchen.',
    longDescription: 'Gut Wiesenhof approached me to document their new autumn tasting menu ahead of a press launch. We spent two evenings in their open kitchen, working with natural candlelight and a single reflector to capture the warmth of each course. The brief was "honest abundance" — no fussy styling, just beautiful ingredients treated with respect.',
    palette: { bg: '#2a1a0a', accent: '#c4622d', light: '#e8c99a' },
    meta: [
      { label: 'Client', value: 'Gut Wiesenhof Restaurant' },
      { label: 'Usage', value: 'Menu, Press & Social' },
      { label: 'Duration', value: '2-day shoot' },
      { label: 'Deliverables', value: '48 retouched images' },
    ],
    svgScene: (
      <>
        {/* Table surface */}
        <rect x="0" y="180" width="480" height="140" fill="#3d2510" />
        {/* Linen */}
        <rect x="60" y="185" width="360" height="130" rx="4" fill="#d4b896" opacity="0.3" />
        {/* Main plate */}
        <ellipse cx="240" cy="240" rx="100" ry="72" fill="#f0ebe3" />
        <ellipse cx="240" cy="240" rx="88" ry="62" fill="#ede5d8" />
        {/* Protein */}
        <ellipse cx="230" cy="238" rx="42" ry="30" fill="#8b3a1a" />
        <ellipse cx="228" cy="235" rx="36" ry="24" fill="#a84520" />
        {/* Sauce */}
        <path d="M200 248 Q220 238 240 252 Q260 262 280 248" fill="none" stroke="#c4622d" strokeWidth="3" opacity="0.8" strokeLinecap="round" />
        {/* Micro greens */}
        <path d="M215 222 Q212 212 218 208 Q221 218 215 222Z" fill="#5a8a3c" />
        <path d="M225 218 Q222 208 228 204 Q231 214 225 218Z" fill="#6aa048" />
        <path d="M235 220 Q233 210 239 207 Q241 217 235 220Z" fill="#5a8a3c" />
        {/* Root vegetable */}
        <ellipse cx="268" cy="245" rx="18" ry="12" fill="#c8832a" />
        <ellipse cx="268" cy="243" rx="15" ry="9" fill="#d4962e" />
        {/* Wine glass */}
        <ellipse cx="370" cy="230" rx="18" ry="6" fill="#c8a87a" opacity="0.5" />
        <path d="M352 230 Q358 210 370 205 Q382 210 388 230Z" fill="#8b1a2a" opacity="0.6" />
        <rect x="368" y="230" width="4" height="40" fill="#c8a87a" opacity="0.5" />
        <ellipse cx="370" cy="270" rx="14" ry="4" fill="#c8a87a" opacity="0.5" />
        {/* Candle */}
        <rect x="118" y="195" width="8" height="50" rx="2" fill="#f5e8c8" />
        <ellipse cx="122" cy="192" rx="5" ry="3" fill="#f5e8c8" />
        <path d="M122 185 Q119 178 122 174 Q125 178 122 185Z" fill="#f5a020" opacity="0.9" />
        {/* Warm light glow */}
        <radialGradient id="candleGlow" cx="25%" cy="40%" r="30%">
          <stop offset="0%" stopColor="#f5a020" stopOpacity="0.2" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <rect width="480" height="320" fill="url(#candleGlow)" />
      </>
    ),
  },
  {
    id: 'artisan-bakery',
    title: 'Artisan Bakery',
    category: 'Brand',
    description: 'Mehl & Morgen's sourdough range — crusty loaves, morning pastries, and the floury hands that make them, shot for a full brand refresh.',
    longDescription: 'Mehl & Morgen had been baking the same sourdough for fifteen years but their photography hadn't kept pace with their reputation. Over three mornings starting at 5am, I documented the full baking process — from shaping to scoring to the first pull from the oven. The resulting images now anchor their website, packaging, and a feature in a national food magazine.',
    palette: { bg: '#1e1208', accent: '#d4962e', light: '#f5e8c8' },
    meta: [
      { label: 'Client', value: 'Mehl & Morgen Bakery' },
      { label: 'Usage', value: 'Website, Packaging & Press' },
      { label: 'Duration', value: '3 morning sessions' },
      { label: 'Deliverables', value: '72 retouched images' },
    ],
    svgScene: (
      <>
        {/* Wooden board */}
        <rect x="0" y="160" width="480" height="160" fill="#5c3a1e" />
        <rect x="0" y="160" width="480" height="4" fill="#7a4e28" opacity="0.5" />
        {/* Flour dusting */}
        <ellipse cx="240" cy="220" rx="180" ry="60" fill="#f5f0e8" opacity="0.12" />
        {/* Main sourdough loaf */}
        <ellipse cx="200" cy="230" rx="110" ry="65" fill="#8b4a1a" />
        <ellipse cx="200" cy="222" rx="105" ry="58" fill="#a85a20" />
        <ellipse cx="200" cy="218" rx="98" ry="52" fill="#c4722a" />
        {/* Score marks */}
        <path d="M140 210 Q200 195 260 210" fill="none" stroke="#7a3a10" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M145 222 Q200 208 255 222" fill="none" stroke="#7a3a10" strokeWidth="2" strokeLinecap="round" />
        <path d="M150 234 Q200 221 250 234" fill="none" stroke="#7a3a10" strokeWidth="1.5" strokeLinecap="round" />
        {/* Crust highlight */}
        <ellipse cx="185" cy="205" rx="40" ry="18" fill="#d4862a" opacity="0.5" />
        {/* Croissant */}
        <path d="M330 215 Q360 195 390 215 Q375 235 360 240 Q345 235 330 215Z" fill="#d4962e" />
        <path d="M335 218 Q360 200 385 218" fill="none" stroke="#b87820" strokeWidth="2" strokeLinecap="round" />
        <path d="M338 226 Q360 210 382 226" fill="none" stroke="#b87820" strokeWidth="1.5" strokeLinecap="round" />
        {/* Small roll */}
        <ellipse cx="370" cy="255" rx="28" ry="20" fill="#c47828" />
        <ellipse cx="370" cy="251" rx="24" ry="16" fill="#d48a30" />
        <path d="M358 248 Q370 242 382 248" fill="none" stroke="#a86020" strokeWidth="1.5" strokeLinecap="round" />
        {/* Flour scatter */}
        {[...Array(12)].map((_, i) => (
          <circle
            key={i}
            cx={80 + i * 28 + (i % 3) * 8}
            cy={175 + (i % 4) * 12}
            r={2 + (i % 3)}
            fill="#f5f0e8"
            opacity={0.3 + (i % 4) * 0.1}
          />
        ))}
        {/* Warm morning light */}
        <radialGradient id="morningLight" cx="70%" cy="20%" r="50%">
          <stop offset="0%" stopColor="#f5c060" stopOpacity="0.25" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <rect width="480" height="320" fill="url(#morningLight)" />
      </>
    ),
  },
  {
    id: 'cocktail-menu',
    title: 'Cocktail Menu',
    category: 'Editorial',
    description: 'Bar Negroni's new seasonal cocktail list — moody, jewel-toned drinks styled against dark marble for a high-end menu redesign.',
    longDescription: 'Bar Negroni wanted their new menu to feel like a collector's item. We built a small studio in their back room with a slab of dark Marquina marble and a single tungsten light source. Each cocktail was styled to highlight its signature ingredient — a smoked rosemary sprig, a dehydrated citrus wheel, a hand-chipped ice cube. The result is a menu that guests photograph before they even take a sip.',
    palette: { bg: '#0d0d14', accent: '#7a3a8a', light: '#c8a0d8' },
    meta: [
      { label: 'Client', value: 'Bar Negroni' },
      { label: 'Usage', value: 'Printed Menu & Website' },
      { label: 'Duration', value: '1-day studio shoot' },
      { label: 'Deliverables', value: '24 retouched images' },
    ],
    svgScene: (
      <>
        {/* Dark marble surface */}
        <rect width="480" height="320" fill="#0d0d14" />
        <path d="M0 80 Q120 60 240 90 Q360 120 480 80 L480 320 L0 320Z" fill="#141420" opacity="0.8" />
        {/* Marble veins */}
        <path d="M0 120 Q80 110 160 130 Q240 150 320 120 Q400 90 480 110" fill="none" stroke="#2a2a3a" strokeWidth="1" opacity="0.6" />
        <path d="M0 200 Q100 185 200 205 Q300 225 400 195 Q440 185 480 200" fill="none" stroke="#2a2a3a" strokeWidth="0.8" opacity="0.5" />

        {/* Main cocktail glass — coupe */}
        <path d="M200 100 Q240 100 280 100 Q265 155 240 165 Q215 155 200 100Z" fill="#c8388a" opacity="0.85" />
        <path d="M202 103 Q240 103 278 103 Q264 152 240 162 Q216 152 202 103Z" fill="#d84a9a" opacity="0.6" />
        {/* Glass stem */}
        <rect x="237" y="165" width="6" height="55" fill="#8080a0" opacity="0.6" />
        <ellipse cx="240" cy="220" rx="28" ry="6" fill="#8080a0" opacity="0.4" />
        {/* Garnish — citrus wheel */}
        <circle cx="272" cy="108" r="16" fill="#f5a020" opacity="0.9" />
        <circle cx="272" cy="108" r="12" fill="#f5c040" opacity="0.8" />
        <circle cx="272" cy="108" r="6" fill="#f5a020" opacity="0.9" />
        {[...Array(8)].map((_, i) => (
          <line
            key={i}
            x1="272" y1="108"
            x2={272 + 12 * Math.cos((i * Math.PI) / 4)}
            y2={108 + 12 * Math.sin((i * Math.PI) / 4)}
            stroke="#f5a020"
            strokeWidth="1"
            opacity="0.7"
          />
        ))}

        {/* Second glass — highball */}
        <rect x="330" y="130" width="44" height="100" rx="4" fill="#2a6a4a" opacity="0.7" />
        <rect x="332" y="132" width="40" height="96" rx="3" fill="#3a8a5a" opacity="0.5" />
        {/* Ice cube */}
        <rect x="340" y="185" width="24" height="24" rx="3" fill="#c8e8f8" opacity="0.5" />
        <rect x="342" y="187" width="20" height="20" rx="2" fill="#e0f4ff" opacity="0.3" />
        {/* Mint sprig */}
        <path d="M352 135 Q348 120 354 114 Q358 126 352 135Z" fill="#4aaa6a" />
        <path d="M358 132 Q355 117 361 112 Q364 124 358 132Z" fill="#5aba7a" />
        <rect x="355" y="130" width="2" height="30" fill="#3a8a4a" opacity="0.8" />

        {/* Third glass — rocks */}
        <rect x="100" y="175" width="60" height="55" rx="6" fill="#c87820" opacity="0.7" />
        <rect x="102" y="177" width="56" height="51" rx="5" fill="#d89030" opacity="0.5" />
        {/* Large ice */}
        <rect x="108" y="195" width="30" height="28" rx="4" fill="#d0eeff" opacity="0.45" />
        {/* Orange peel */}
        <path d="M118 182 Q130 175 138 182 Q132 190 118 182Z" fill="#f5a020" opacity="0.9" />

        {/* Ambient glow */}
        <radialGradient id="barGlow" cx="50%" cy="45%" r="40%">
          <stop offset="0%" stopColor="#9a40aa" stopOpacity="0.2" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <rect width="480" height="320" fill="url(#barGlow)" />

        {/* Surface reflections */}
        <ellipse cx="240" cy="228" rx="40" ry="8" fill="#c8388a" opacity="0.15" />
        <ellipse cx="352" cy="238" rx="22" ry="5" fill="#3a8a5a" opacity="0.15" />
        <ellipse cx="130" cy="238" rx="30" ry="6" fill="#c87820" opacity="0.15" />
      </>
    ),
  },
];

export default shoots;
