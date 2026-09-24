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
