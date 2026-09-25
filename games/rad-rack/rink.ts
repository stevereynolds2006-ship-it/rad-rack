import type { Look } from "./looks";
import { paintFriend, paintSign } from "./paint";
import floorUrl from "./art/skate-neon.jpg";
import photoUrl from "./art/photo-neon.jpg";

const INK = "#141018";
const CREAM = "#f4ecdf";
const MAGENTA = "#ff2bd6";
const CYAN = "#39f2e4";
const GOLD = "#e6c36a";
const RF = 10n ** 18n;

export type Mask = {
  name: string;
  price: bigint;
  swatch: string;
  pixels: readonly (readonly [number, number, string])[];
};

const K = "#141018";
const C = "#39f2e4";
const G = "#e6c36a";
const M = "#ff2bd6";
const W = "#f4ecdf";

export const MASKS: readonly Mask[] = [
  { name: "Bare face", price: 0n, swatch: W, pixels: [] },
  {
    name: "Domino",
    price: 1n * RF,
    swatch: K,
    pixels: [
      [4, 3, K], [5, 3, K], [6, 3, K], [7, 3, K], [8, 3, K], [9, 3, K], [10, 3, K], [11, 3, K],
      [3, 4, K], [4, 4, K], [5, 4, W], [6, 4, K], [7, 4, K], [8, 4, K], [9, 4, W], [10, 4, K], [11, 4, K], [12, 4, K],
      [4, 5, K], [5, 5, K], [6, 5, K], [7, 5, K], [8, 5, K], [9, 5, K], [10, 5, K], [11, 5, K],
    ],
  },
  {
    name: "Shutter shades",
    price: 2n * RF,
    swatch: M,
    pixels: [
      [3, 3, M], [4, 3, K], [5, 3, M], [6, 3, K], [7, 3, M], [8, 3, K], [9, 3, M], [10, 3, K], [11, 3, M], [12, 3, K],
      [3, 4, K], [4, 4, M], [5, 4, K], [6, 4, M], [7, 4, K], [8, 4, M], [9, 4, K], [10, 4, M], [11, 4, K], [12, 4, M],
      [3, 5, M], [4, 5, K], [5, 5, M], [6, 5, K], [7, 5, M], [8, 5, K], [9, 5, M], [10, 5, K], [11, 5, M], [12, 5, K],
    ],
  },
  {
    name: "Star eye",
    price: 2n * RF,
    swatch: G,
    pixels: [
      [6, 2, G],
      [5, 3, G], [6, 3, G], [7, 3, G], [10, 3, K], [11, 3, K],
      [4, 4, G], [5, 4, G], [6, 4, W], [7, 4, G], [8, 4, G], [10, 4, K], [11, 4, K],
      [5, 5, G], [6, 5, G], [7, 5, G], [10, 5, K], [11, 5, K],
      [6, 6, G],
    ],
  },
  {
    name: "Neon visor",
    price: 3n * RF,
    swatch: C,
    pixels: [
      [3, 3, C], [4, 3, C], [5, 3, C], [6, 3, C], [7, 3, C], [8, 3, C], [9, 3, C], [10, 3, C], [11, 3, C], [12, 3, C],
      [3, 4, C], [4, 4, K], [5, 4, K], [6, 4, K], [7, 4, K], [8, 4, K], [9, 4, K], [10, 4, K], [11, 4, K], [12, 4, C],
      [3, 5, C], [4, 5, C], [5, 5, C], [6, 5, C], [7, 5, C], [8, 5, C], [9, 5, C], [10, 5, C], [11, 5, C], [12, 5, C],
    ],
  },
  {
    name: "Gold phantom",
    price: 5n * RF,
    swatch: G,
    pixels: [
      [3, 3, G], [4, 3, G], [5, 3, G], [6, 3, G], [7, 3, G], [8, 3, G],
      [3, 4, G], [4, 4, W], [5, 4, G], [6, 4, G], [7, 4, G], [8, 4, G], [9, 4, G],
      [4, 5, G], [5, 5, G], [6, 5, G], [7, 5, G], [8, 5, G],
    ],
  },
];

const RARE_MASKS: readonly Mask[] = [
  {
    name: "Laser grill",
    price: 8n * RF,
    swatch: M,
    pixels: [
      [3, 2, C], [4, 2, M], [5, 2, C], [6, 2, M], [7, 2, C], [8, 2, M], [9, 2, C], [10, 2, M], [11, 2, C], [12, 2, M],
      [3, 3, M], [4, 3, C], [5, 3, M], [6, 3, C], [7, 3, M], [8, 3, C], [9, 3, M], [10, 3, C], [11, 3, M], [12, 3, C],
      [4, 4, C], [5, 4, M], [6, 4, C], [7, 4, M], [8, 4, C], [9, 4, M], [10, 4, C], [11, 4, M],
      [5, 5, M], [6, 5, C], [7, 5, M], [8, 5, C], [9, 5, M], [10, 5, C],
    ],
  },
  {
    name: "Eclipse visor",
    price: 8n * RF,
    swatch: K,
    pixels: [
      [3, 3, G], [4, 3, G], [5, 3, G], [6, 3, G], [7, 3, G], [8, 3, G], [9, 3, G], [10, 3, G], [11, 3, G], [12, 3, G],
      [4, 4, K], [5, 4, K], [6, 4, G], [7, 4, K], [8, 4, K], [9, 4, G], [10, 4, K], [11, 4, K],
      [4, 5, G], [5, 5, G], [6, 5, G], [7, 5, G], [8, 5, G], [9, 5, G], [10, 5, G], [11, 5, G],
    ],
  },
  {
    name: "Heart eyes",
    price: 9n * RF,
    swatch: M,
    pixels: [
      [4, 3, M], [5, 3, M], [7, 3, M], [8, 3, M], [10, 3, M], [11, 3, M],
      [3, 4, M], [6, 4, M], [9, 4, M], [12, 4, M],
      [4, 5, M], [5, 5, W], [7, 5, M], [8, 5, M], [10, 5, W], [11, 5, M],
    ],
  },
  {
    name: "Chrome skull",
    price: 8n * RF,
    swatch: W,
    pixels: [
      [4, 2, W], [5, 2, W], [6, 2, W], [7, 2, W], [8, 2, W], [9, 2, W], [10, 2, W], [11, 2, W],
      [4, 3, K], [5, 3, K], [6, 3, W], [7, 3, W], [8, 3, W], [9, 3, K], [10, 3, K], [11, 3, W],
      [4, 4, W], [5, 4, K], [6, 4, K], [7, 4, W], [8, 4, K], [9, 4, K], [10, 4, W], [11, 4, W],
      [5, 5, W], [6, 5, W], [7, 5, K], [8, 5, W], [9, 5, W], [10, 5, W],
    ],
  },
  {
    name: "Disco ball",
    price: 10n * RF,
    swatch: G,
    pixels: [
      [4, 2, G], [5, 2, C], [6, 2, G], [7, 2, C], [8, 2, G], [9, 2, C], [10, 2, G], [11, 2, C],
      [4, 3, C], [5, 3, G], [6, 3, C], [7, 3, G], [8, 3, C], [9, 3, G], [10, 3, C], [11, 3, G],
      [4, 4, G], [5, 4, C], [6, 4, W], [7, 4, G], [8, 4, C], [9, 4, W], [10, 4, G], [11, 4, C],
      [5, 5, C], [6, 5, G], [7, 5, C], [8, 5, G], [9, 5, C], [10, 5, G],
    ],
  },
];

export function maskById(id: number) {
  if (id >= 200) return RARE_MASKS[id - 200] ?? MASKS[0];
  return MASKS[id] ?? MASKS[0];
}

export function weeklyRareMask(now = Date.now()): Mask & { readonly id: number } {
  const index = Math.floor(now / WEEK) % RARE_MASKS.length;
  const mask = RARE_MASKS[index] ?? RARE_MASKS[0];
  return { ...mask, id: 200 + index };
}

function paintMask(ctx: CanvasRenderingContext2D, originX: number, originY: number, scale: number, mask: Mask) {
  for (const [x, y, color] of mask.pixels) {
    ctx.fillStyle = color;
    ctx.fillRect(originX + x * scale, originY + y * scale, scale, scale);
  }
}

export function paintPortrait(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  rows: readonly string[],
  worn: readonly Look[],
  mask: Mask,
) {
  ctx.fillStyle = "#07040c";
  ctx.fillRect(0, 0, width, height);
  const scale = Math.max(2, Math.floor(Math.min(width, height) / 22));
  const originX = Math.round(width / 2 - 8 * scale);
  const originY = Math.round(height / 2 - 6 * scale);
  ctx.fillStyle = "#f4ecdf";
  ctx.fillRect(originX - scale * 2, originY - scale * 2, scale * 20, scale * 22);
  paintFriend(ctx, originX, originY, scale, rows, worn, null);
  paintMask(ctx, originX, originY, scale, mask);
}

export type Quad = {
  readonly name: string;
  readonly price: bigint;
  readonly boot: string;
  readonly lace: string;
  readonly wheel: string;
};

export const SKATES: readonly Quad[] = [
  { name: "Rental whites", price: 0n, boot: CREAM, lace: CYAN, wheel: INK },
  { name: "Bubblegum quads", price: RF, boot: MAGENTA, lace: CREAM, wheel: GOLD },
  { name: "Cyan flashes", price: 2n * RF, boot: CYAN, lace: MAGENTA, wheel: INK },
  { name: "Sunset high-tops", price: 3n * RF, boot: "#ff7a1a", lace: GOLD, wheel: MAGENTA },
  { name: "Blackout bolts", price: 5n * RF, boot: INK, lace: GOLD, wheel: CYAN },
];

const RARE_SKATES: readonly Quad[] = [
  { name: "Hologram quads", price: 8n * RF, boot: "#7a3cff", lace: CYAN, wheel: GOLD },
  { name: "Mirror-ball skates", price: 8n * RF, boot: CREAM, lace: MAGENTA, wheel: "#7a3cff" },
  { name: "Tiger quads", price: 9n * RF, boot: "#ff7a1a", lace: INK, wheel: GOLD },
  { name: "Velvet night", price: 8n * RF, boot: "#4a1468", lace: MAGENTA, wheel: CYAN },
  { name: "Gold record", price: 10n * RF, boot: GOLD, lace: INK, wheel: CREAM },
];

const WEEK = 7 * 24 * 60 * 60 * 1000;

export function weeklyRare(now = Date.now()): Quad & { readonly id: number } {
  const index = Math.floor(now / WEEK) % RARE_SKATES.length;
  const skate = RARE_SKATES[index] ?? RARE_SKATES[0];
  return { ...skate, id: 100 + index };
}

export function skateById(id: number): Quad {
  if (id >= 100) return RARE_SKATES[id - 100] ?? SKATES[0];
  return SKATES[id] ?? SKATES[0];
}

function paintQuads(
  ctx: CanvasRenderingContext2D,
  originX: number,
  originY: number,
  scale: number,
  quad: Quad,
) {
  const boot: ReadonlyArray<readonly [number, number, string]> = [
    [2, 14, quad.boot], [3, 14, quad.boot], [4, 14, quad.lace], [5, 14, quad.boot], [6, 14, quad.boot],
    [9, 14, quad.boot], [10, 14, quad.boot], [11, 14, quad.lace], [12, 14, quad.boot], [13, 14, quad.boot],
    [1, 15, quad.boot], [2, 15, quad.boot], [5, 15, quad.boot], [6, 15, quad.boot],
    [9, 15, quad.boot], [10, 15, quad.boot], [13, 15, quad.boot], [14, 15, quad.boot],
  ];
  const wheels: ReadonlyArray<readonly [number, number]> = [
    [2, 16], [5, 16], [10, 16], [13, 16],
  ];
  for (const [x, y, color] of boot) {
    ctx.fillStyle = color;
    ctx.fillRect(originX + x * scale, originY + y * scale, scale, scale);
  }
  ctx.fillStyle = quad.wheel;
  for (const [x, y] of wheels) {
    ctx.fillRect(originX + x * scale, originY + y * scale, scale, scale);
  }
}
let floorImage: HTMLImageElement | null = null;
let photoImage: HTMLImageElement | null = null;

function floorArt() {
  if (!floorImage && typeof Image !== "undefined") {
    floorImage = new Image();
    floorImage.src = floorUrl;
  }
  return floorImage && floorImage.complete && floorImage.naturalWidth > 0 ? floorImage : null;
}

function photoArt() {
  if (!photoImage && typeof Image !== "undefined") {
    photoImage = new Image();
    photoImage.src = photoUrl;
  }
  return photoImage && photoImage.complete && photoImage.naturalWidth > 0 ? photoImage : null;
}

export function rinkBoothHit(width: number, height: number, x: number, y: number) {
  const layout = floorLayout(width, height);
  const nx = (x - layout.x) / layout.w;
  const ny = (y - layout.y) / layout.h;
  return nx >= 0.64 && nx <= 0.86 && ny >= 0.0 && ny <= 0.42;
}

type Gear = "band" | "shades" | "warmers" | "phones" | "jacket";

type Skater = {
  readonly phase: number;
  readonly radius: number;
  readonly hair: string;
  readonly skin: string;
  readonly cloth: string;
  readonly trim: string;
  readonly gear: readonly Gear[];
};

const CROWD: readonly Skater[] = [
  { phase: 0.2, radius: 0.82, hair: MAGENTA, skin: GOLD, cloth: CYAN, trim: CREAM, gear: ["band", "warmers"] },
  { phase: 1.0, radius: 1.08, hair: INK, skin: CREAM, cloth: MAGENTA, trim: GOLD, gear: ["shades", "jacket"] },
  { phase: 1.8, radius: 0.9, hair: CYAN, skin: GOLD, cloth: "#ff7a1a", trim: MAGENTA, gear: ["phones", "warmers"] },
  { phase: 2.6, radius: 1.14, hair: INK, skin: "#e7b090", cloth: CYAN, trim: GOLD, gear: ["jacket", "band"] },
  { phase: 3.4, radius: 0.86, hair: GOLD, skin: CREAM, cloth: MAGENTA, trim: CYAN, gear: ["shades", "phones"] },
  { phase: 4.2, radius: 1.02, hair: MAGENTA, skin: GOLD, cloth: CREAM, trim: CYAN, gear: ["warmers", "jacket"] },
  { phase: 5.0, radius: 0.94, hair: INK, skin: CREAM, cloth: "#7a3cff", trim: GOLD, gear: ["band", "shades"] },
  { phase: 5.8, radius: 1.1, hair: CYAN, skin: GOLD, cloth: MAGENTA, trim: CREAM, gear: ["phones", "jacket"] },
];

function floorLayout(width: number, height: number) {
  const aspect = 1500 / 1034;
  let w = width * 0.98;
  let h = w / aspect;
  if (h > height * 0.96) {
    h = height * 0.96;
    w = h * aspect;
  }
  return { x: (width - w) / 2, y: (height - h) / 2, w, h };
}

export function rinkSpot(angle: number, width: number, height: number, radius = 1) {
  const layout = floorLayout(width, height);
  const cx = layout.x + layout.w * 0.5;
  const cy = layout.y + layout.h * 0.58;
  const rx = layout.w * 0.22 * radius;
  const ry = layout.h * 0.14 * radius;
  return {
    x: cx + Math.cos(angle) * rx,
    y: cy + Math.sin(angle) * ry,
    facing: (Math.sin(angle) > 0 ? "left" : "right") as "left" | "right",
  };
}

function paintOval(ctx: CanvasRenderingContext2D, cx: number, cy: number, rx: number, ry: number, color: string) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

function paintSkater(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  facing: "left" | "right",
  skater: Skater,
  bob: number,
) {
  const lean = facing === "right" ? scale * 0.4 : -scale * 0.4;
  const left = Math.round(x - 4 * scale + lean);
  const top = Math.round(y - 10 * scale + bob);
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.fillRect(left + scale, top + 10 * scale, 7 * scale, Math.max(2, scale * 0.35));
  const body = [
    [2, 0, skater.hair], [3, 0, skater.hair], [4, 0, skater.hair], [5, 0, skater.hair],
    [2, 1, skater.skin], [3, 1, skater.skin], [4, 1, skater.skin], [5, 1, skater.skin],
    [1, 2, skater.trim], [2, 2, skater.cloth], [3, 2, skater.cloth], [4, 2, skater.cloth], [5, 2, skater.cloth], [6, 2, skater.trim],
    [1, 3, skater.cloth], [2, 3, skater.cloth], [3, 3, skater.cloth], [4, 3, skater.cloth], [5, 3, skater.cloth], [6, 3, skater.cloth],
    [2, 4, skater.cloth], [3, 4, skater.cloth], [4, 4, skater.cloth], [5, 4, skater.cloth],
    [2, 5, skater.trim], [5, 5, skater.trim],
    [2, 6, CYAN], [5, 6, MAGENTA],
    [1, 7, GOLD], [2, 7, INK], [3, 7, GOLD],
    [4, 7, GOLD], [5, 7, INK], [6, 7, GOLD],
  ] as const;
  for (const [px, py, color] of body) {
    const dx = facing === "left" ? 7 - px : px;
    ctx.fillStyle = color;
    ctx.fillRect(left + dx * scale, top + py * scale, scale, scale);
  }
  for (const gear of skater.gear) {
    if (gear === "band") {
      ctx.fillStyle = skater.trim;
      ctx.fillRect(left + 2 * scale, top + scale, 4 * scale, Math.max(1, scale * 0.7));
    } else if (gear === "shades") {
      ctx.fillStyle = INK;
      ctx.fillRect(left + 2 * scale, top + 2 * scale, 4 * scale, scale);
      ctx.fillStyle = CYAN;
      ctx.fillRect(left + 2 * scale, top + 2 * scale, scale, scale);
      ctx.fillRect(left + 4 * scale, top + 2 * scale, scale, scale);
    } else if (gear === "warmers") {
      ctx.fillStyle = MAGENTA;
      ctx.fillRect(left + 2 * scale, top + 5 * scale, 2 * scale, 2 * scale);
      ctx.fillRect(left + 5 * scale, top + 5 * scale, 2 * scale, 2 * scale);
    } else if (gear === "phones") {
      ctx.fillStyle = INK;
      ctx.fillRect(left + scale, top + scale, scale, 2 * scale);
      ctx.fillRect(left + 6 * scale, top + scale, scale, 2 * scale);
      ctx.fillRect(left + 2 * scale, top, 4 * scale, Math.max(1, scale * 0.6));
    } else if (gear === "jacket") {
      ctx.fillStyle = skater.trim;
      ctx.fillRect(left + scale, top + 2 * scale, scale, 3 * scale);
      ctx.fillRect(left + 6 * scale, top + 2 * scale, scale, 3 * scale);
    }
  }
}

export function paintRink(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  rows: readonly string[] | null,
  worn: readonly Look[],
  angle: number,
  reduced: boolean,
  now: number,
  quad: Quad,
  fitting: boolean,
  crack = 0,
  restRows?: readonly string[] | null,
) {
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, width, height);
  const layout = floorLayout(width, height);
  const art = floorArt();
  if (art) {
    const smoothing = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(art, layout.x, layout.y, layout.w, layout.h);
    ctx.imageSmoothingEnabled = smoothing;
  }
  if (crack > 0) paintCrack(ctx, layout, crack);

  const people = layout.h * 0.1;
  const scale = Math.max(2, Math.round(people / 8));
  const crowd = CROWD.map((skater) => {
    const spot = rinkSpot(angle + skater.phase, width, height, skater.radius);
    return { skater, spot };
  }).sort((a, b) => a.spot.y - b.spot.y);
  const friendSpot = rows && !fitting ? rinkSpot(angle, width, height) : null;
  const friendAt = friendSpot ? crowd.findIndex((item) => item.spot.y > friendSpot.y) : -1;

  const paintOne = (skater: Skater, spot: { x: number; y: number; facing: "left" | "right" }) => {
    const bob = reduced ? 0 : Math.round(Math.sin(now / 140 + skater.phase) * scale * 0.45);
    paintSkater(ctx, spot.x, spot.y, scale, spot.facing, skater, bob);
  };

  crowd.forEach((item, index) => {
    if (friendSpot && index === friendAt) paintFriendOnRink();
    paintOne(item.skater, item.spot);
  });
  if (friendSpot && friendAt === -1) paintFriendOnRink();

  function paintFriendOnRink() {
    if (!rows || !friendSpot) return;
    const friendScale = Math.max(2, Math.round((people / 16) * (1 - crack * 0.7)));
    const bob = reduced ? 0 : Math.round(Math.sin(now / 120) * friendScale * 0.6);
    const originX = Math.round(friendSpot.x - 8 * friendScale);
    const originY = Math.round(friendSpot.y - 16 * friendScale + bob + crack * layout.h * 0.42);
    ctx.globalAlpha = 1 - crack * 0.85;
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.fillRect(originX + 2 * friendScale, originY + 16 * friendScale, 12 * friendScale, Math.max(2, Math.round(friendScale * 0.45)));
    paintFriend(ctx, originX, originY, friendScale, rows, worn, restRows);
    paintQuads(ctx, originX, originY, friendScale, quad);
    ctx.globalAlpha = 1;
  }

  if (fitting && rows && crack <= 0) {
    ctx.fillStyle = "rgba(8,4,14,0.62)";
    ctx.fillRect(0, 0, width, height);
    const friendScale = Math.max(6, Math.round(Math.min(width, height) / 18));
    const originX = Math.round(width / 2 - 8 * friendScale);
    const originY = Math.round(height / 2 - 8 * friendScale);
    const bob = reduced ? 0 : Math.round(Math.sin(now / 160) * friendScale * 0.35);
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.beginPath();
    ctx.ellipse(width / 2, originY + 16 * friendScale + bob, friendScale * 7, friendScale * 1.6, 0, 0, Math.PI * 2);
    ctx.fill();
    paintFriend(ctx, originX, originY + bob, friendScale, rows, worn, restRows);
    paintQuads(ctx, originX, originY + bob, friendScale, quad);
  }
}

function paintCrack(
  ctx: CanvasRenderingContext2D,
  layout: { x: number; y: number; w: number; h: number },
  amount: number,
) {
  const cx = layout.x + layout.w * 0.5;
  const cy = layout.y + layout.h * 0.58;
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(cx, cy, layout.w * 0.22 * amount, layout.h * 0.16 * amount, 0, 0, Math.PI * 2);
  ctx.fillStyle = "#050308";
  ctx.fill();
  ctx.strokeStyle = "#2a140c";
  ctx.lineWidth = Math.max(2, layout.h * 0.012);
  const rays: ReadonlyArray<readonly [number, number]> = [
    [-0.28, -0.08],
    [0.26, -0.12],
    [-0.18, 0.16],
    [0.22, 0.14],
    [0.02, -0.2],
    [-0.04, 0.22],
  ];
  for (const [dx, dy] of rays) {
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + dx * layout.w * amount, cy + dy * layout.h * amount);
    ctx.stroke();
  }
  ctx.restore();
}

export function paintUnder(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  rows: readonly string[] | null,
  worn: readonly Look[],
  lights: readonly boolean[],
  restRows?: readonly string[] | null,
) {
  ctx.fillStyle = "#07040c";
  ctx.fillRect(0, 0, width, height);
  const wallTop = height * 0.08;
  ctx.fillStyle = "#1a1020";
  ctx.fillRect(width * 0.08, wallTop, width * 0.84, height * 0.72);
  ctx.fillStyle = "#120a16";
  for (let i = 0; i < 8; i += 1) {
    ctx.fillRect(width * 0.1, wallTop + i * height * 0.09, width * 0.8, Math.max(2, height * 0.012));
  }
  ctx.fillStyle = "#39f2e4";
  ctx.fillRect(width * 0.12, wallTop + height * 0.08, width * 0.06, height * 0.02);
  ctx.fillStyle = "#ff2bd6";
  ctx.fillRect(width * 0.82, wallTop + height * 0.2, width * 0.05, height * 0.02);
  const lamps = [0.28, 0.5, 0.72];
  lamps.forEach((nx, index) => {
    const on = lights[index] === true;
    const x = width * nx;
    const y = height * 0.34;
    ctx.fillStyle = "#141018";
    ctx.fillRect(x - 28, y - 36, 56, 72);
    ctx.fillStyle = on ? "#ffe14a" : "#2a2418";
    ctx.beginPath();
    ctx.arc(x, y, 16, 0, Math.PI * 2);
    ctx.fill();
    if (on) {
      ctx.fillStyle = "rgba(255, 225, 74, 0.18)";
      ctx.beginPath();
      ctx.arc(x, y, 48, 0, Math.PI * 2);
      ctx.fill();
    }
  });
  if (!rows) return;
  const scale = Math.max(3, Math.round(height / 70));
  const footX = width * 0.5;
  const footY = height * 0.78;
  ctx.fillStyle = "rgba(0,0,0,0.45)";
  ctx.beginPath();
  ctx.ellipse(footX, footY, scale * 7, scale * 1.5, 0, 0, Math.PI * 2);
  ctx.fill();
  paintFriend(ctx, footX - 8 * scale, footY - 16 * scale, scale, rows, worn, restRows);
}

function photoLayout(width: number, height: number) {
  const aspect = 1500 / 1093;
  let w = width * 0.96;
  let h = w / aspect;
  if (h > height * 0.96) {
    h = height * 0.96;
    w = h * aspect;
  }
  const zoom = 1.7;
  w *= zoom;
  h *= zoom;
  return { x: (width - w) / 2, y: (height - h) / 2, w, h };
}

export function paintPhoto(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  rows: readonly string[] | null,
  worn: readonly Look[],
  mask: Mask,
  zoom = 0,
  projection: Mask | null = null,
  restRows?: readonly string[] | null,
) {
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, width, height);
  const layout = photoLayout(width, height);
  const art = photoArt();
  if (art) {
    const smoothing = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(art, layout.x, layout.y, layout.w, layout.h);
    ctx.imageSmoothingEnabled = smoothing;
  }
  paintSign(ctx, "Pictures", layout.x + layout.w * 0.5, Math.max(8, layout.y - layout.h * 0.01), layout.h, 0.85);
  if (!rows) return;
  const friendScale = Math.max(1, Math.round((layout.h * 0.11) / 16));
  const peak = Math.max(friendScale + 1, Math.round(Math.min(width, height) / 64));
  const eased = zoom * zoom * (3 - 2 * zoom);
  const scale = friendScale + (peak - friendScale) * eased;
  const homeX = layout.x + layout.w * 0.46;
  const homeY = layout.y + layout.h * 0.62;
  const footX = homeX + (width / 2 - homeX) * eased;
  const footY = homeY + (height * 0.56 - homeY) * eased;
  if (eased > 0.04) {
    ctx.fillStyle = `rgba(8,4,14,${0.55 * eased})`;
    ctx.fillRect(0, 0, width, height);
  }
  const originX = footX - 8 * scale;
  const originY = footY - 16 * scale;
  paintFriend(ctx, originX, originY, scale, rows, worn, restRows);
  paintMask(ctx, originX, originY, scale, mask);
  if (zoom > 0.04 || !projection || !rows) return;
  const px = homeX;
  const py = homeY + layout.h * 0.1;
  ctx.save();
  ctx.globalAlpha = 0.28;
  ctx.fillStyle = "#39f2e4";
  ctx.beginPath();
  ctx.moveTo(layout.x + layout.w * 0.5, layout.y + layout.h * 0.2);
  ctx.lineTo(px - layout.w * 0.06, py - layout.h * 0.02);
  ctx.lineTo(px + layout.w * 0.06, py + layout.h * 0.04);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.translate(px, py);
  ctx.transform(1, 0.12, -0.15, 0.38, 0, 0);
  ctx.fillStyle = "rgba(244,236,223,0.92)";
  ctx.fillRect(-36, -46, 72, 78);
  ctx.strokeStyle = "#141018";
  ctx.lineWidth = 2;
  ctx.strokeRect(-36, -46, 72, 78);
  const shot = Math.max(2, Math.round(3));
  paintFriend(ctx, -8 * shot, -8 * shot, shot, rows, worn, restRows);
  paintMask(ctx, -8 * shot, -8 * shot, shot, projection);
  ctx.restore();
}
