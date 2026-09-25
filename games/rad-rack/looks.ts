/** 80s overlays in Friend-pixel space. They never rewrite the NFT bitmap. */

const M = "#ff2bd6";
const C = "#39f2e4";
const K = "#141018";
const G = "#e6c36a";
const W = "#f4ecdf";
const KEY: Record<string, string> = { M, C, K, G, W };

export type LookPixel = readonly [number, number, string];

export type Look = {
  readonly name: string;
  readonly blurb: string;
  readonly swatch: string;
  readonly back: readonly LookPixel[];
  readonly front: readonly LookPixel[];
};

function stamp(art: string, ox = 0, oy = 0): LookPixel[] {
  const pixels: LookPixel[] = [];
  for (const [y, row] of art.trim().split("\n").entries()) {
    for (const [x, ch] of [...row].entries()) {
      const color = KEY[ch];
      if (color) pixels.push([ox + x, oy + y, color]);
    }
  }
  return pixels;
}

export const LOOKS: readonly Look[] = [
  {
    name: "Sweatband",
    blurb: "Aerobics class, 1985.",
    swatch: C,
    back: [],
    front: stamp(
      `
....CCCCCCCC....
...C........C...
`,
      0,
      1,
    ),
  },
  {
    name: "Fingerless gloves",
    blurb: "For the mall arcade.",
    swatch: K,
    back: [],
    front: [
      ...stamp(
        `
KK
KM
KK
`,
        -2,
        8,
      ),
      ...stamp(
        `
KK
MK
KK
`,
        16,
        8,
      ),
    ],
  },
  {
    name: "Leg warmers",
    blurb: "Stripes over the sneakers.",
    swatch: M,
    back: [],
    front: [
      ...stamp(
        `
MCM
CMC
MCM
CMC
MCM
`,
        3,
        13,
      ),
      ...stamp(
        `
MCM
CMC
MCM
CMC
MCM
`,
        10,
        13,
      ),
    ],
  },
  {
    name: "Shutter shades",
    blurb: "The future, as seen from the food court.",
    swatch: M,
    back: [],
    front: stamp(
      `
..KKKKKKKKKKKK..
..KMMMKMMMKMKK..
..KKKKKKKKKKKK..
`,
      0,
      4,
    ),
  },
  {
    name: "Walkman phones",
    blurb: "One cassette. Endless loop.",
    swatch: M,
    back: [],
    front: [
      ...stamp(`..MMMMMMMMMMMM..`, 0, 0),
      ...stamp(
        `
KK
KC
KC
KK
`,
        0,
        2,
      ),
      ...stamp(
        `
KK
CK
CK
KK
`,
        14,
        2,
      ),
    ],
  },
  {
    name: "Neon windbreaker",
    blurb: "Crinkle nylon. Serious shoulders.",
    swatch: M,
    back: stamp(
      `
.MMMMMMMMMMMMMM.
MM.CCCCCCCCCC.MM
MM............MM
.M............M.
.M............M.
MM............MM
.CC..........CC.
`,
      0,
      6,
    ),
    front: [],
  },
  {
    name: "Parachute pants",
    blurb: "Loud enough to hear from the parking lot.",
    swatch: C,
    back: stamp(
      `
.CCCCCCCCCCCCCC.
CCCCCCCCCCCCCCCC
.MMMMMMMMMMMMMM.
CCCCCCCCCCCCCCCC
.KKKK......KKKK.
`,
      -1,
      12,
    ),
    front: [],
  },
  {
    name: "Boombox",
    blurb: "Shoulder-mounted. Volume optional.",
    swatch: G,
    back: [],
    front: stamp(
      `
.GGGG.
KKKKKK
KWWKWK
KMMKMK
KWWWWK
KCCKCK
KKKKKK
`,
      16,
      6,
    ),
  },
  {
    name: "Members jacket",
    blurb: "Collar up. Questions later.",
    swatch: G,
    back: stamp(
      `
GKKKKKKKKKKKKKKG
KK............KK
KK............KK
K..............K
K..............K
KK............KK
.GG..........GG.
`,
      -1,
      5,
    ),
    front: [],
  },
  {
    name: "Lightning earring",
    blurb: "One bolt. Zero subtlety.",
    swatch: G,
    back: [],
    front: stamp(
      `
G.
MG
.G
G.
`,
      14,
      3,
    ),
  },
];

export function chanceLabel(bps: number): string {
  const pct = bps / 100;
  return Number.isInteger(pct) ? `${pct}%` : `${pct.toFixed(1)}%`;
}

const RF = 10n ** 18n;
const WEEK = 7 * 24 * 60 * 60 * 1000;

export const LOOK_PRICES: readonly bigint[] = [1n, 2n, 2n, 3n, 3n, 4n, 5n, 6n, 7n, 4n].map((price) => price * RF);

const RARE_LOOKS: readonly (Look & { readonly price: bigint })[] = [
  {
    name: "Gold sweatband",
    blurb: "The rare outfit this week.",
    swatch: G,
    price: 8n * RF,
    back: [],
    front: stamp(`....GGGGGGGG....\n...G........G...`, 0, 1),
  },
  {
    name: "Laser visor",
    blurb: "The rare outfit this week.",
    swatch: C,
    price: 9n * RF,
    back: [],
    front: stamp(`..CCCCCCCCCCCC..\n..CKKKCKKKCKCC..\n..CCCCCCCCCCCC..`, 0, 4),
  },
  {
    name: "Tiger jacket",
    blurb: "The rare outfit this week.",
    swatch: "#ff7a1a",
    price: 10n * RF,
    back: stamp(
      `
.MMMMMMMMMMMMMM.
MM.GGGGGGGGGG.MM
MM............MM
.M............M.
MM............MM
.GG..........GG.
`,
      0,
      6,
    ),
    front: [],
  },
  {
    name: "Mirror pants",
    blurb: "The rare outfit this week.",
    swatch: W,
    price: 8n * RF,
    back: stamp(
      `
.WWWWWWWWWWWWWW.
WWWWWWWWWWWWWWWW
.CCCCCCCCCCCCCC.
WWWWWWWWWWWWWWWW
.MMMM......MMMM.
`,
      -1,
      12,
    ),
    front: [],
  },
  {
    name: "Chrome bolt",
    blurb: "The rare outfit this week.",
    swatch: C,
    price: 8n * RF,
    back: [],
    front: stamp(`C.\nMC\n.C\nC.`, 14, 3),
  },
];

export function weeklyRareLook(now = Date.now()): Look & { readonly price: bigint; readonly id: number } {
  const index = Math.floor(now / WEEK) % RARE_LOOKS.length;
  const look = RARE_LOOKS[index] ?? RARE_LOOKS[0];
  return { ...look, id: 100 + index };
}

export function lookById(id: number): Look & { readonly price: bigint } {
  if (id >= 100) return RARE_LOOKS[id - 100] ?? { ...LOOKS[0], price: LOOK_PRICES[0] ?? RF };
  return { ...(LOOKS[id] ?? LOOKS[0]), price: LOOK_PRICES[id] ?? RF };
}
