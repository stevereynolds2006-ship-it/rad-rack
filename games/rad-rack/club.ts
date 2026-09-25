import type { Look } from "./looks";
import { paintFriend, paintSign } from "./paint";
import floorUrl from "./art/dance-neon.jpg";
import gymUrl from "./art/gym-color-2.jpg";
import arcadeUrl from "./art/arcade-neon-2.jpg";

const INK = "#141018";
const CREAM = "#f4ecdf";
const MAGENTA = "#ff2bd6";
const CYAN = "#39f2e4";
const GOLD = "#e6c36a";

let floorImage: HTMLImageElement | null = null;

function floorArt() {
  if (!floorImage && typeof Image !== "undefined") {
    floorImage = new Image();
    floorImage.src = floorUrl;
  }
  return floorImage && floorImage.complete && floorImage.naturalWidth > 0 ? floorImage : null;
}

let gymImage: HTMLImageElement | null = null;

function gymArt() {
  if (!gymImage && typeof Image !== "undefined") {
    gymImage = new Image();
    gymImage.src = gymUrl;
  }
  return gymImage && gymImage.complete && gymImage.naturalWidth > 0 ? gymImage : null;
}

let arcadeImage: HTMLImageElement | null = null;

function arcadeArt() {
  if (!arcadeImage && typeof Image !== "undefined") {
    arcadeImage = new Image();
    arcadeImage.src = arcadeUrl;
  }
  return arcadeImage && arcadeImage.complete && arcadeImage.naturalWidth > 0 ? arcadeImage : null;
}

type Part = "hair" | "skin" | "cloth" | "trim" | "shoe";
type Pix = readonly [number, number, Part];
type Fit = "band" | "shades" | "warmers" | "phones" | "jacket" | "bolt";

export const DANCE_MOVES = ["Bounce", "Robot", "Wave", "Freeze"] as const;

type Crew = {
  readonly bias: number;
  readonly hair: string;
  readonly skin: string;
  readonly cloth: string;
  readonly trim: string;
  readonly fits: readonly Fit[];
};

const CREW: readonly Crew[] = [
  { bias: 0, hair: INK, skin: GOLD, cloth: MAGENTA, trim: CYAN, fits: ["band", "warmers"] },
  { bias: 1, hair: MAGENTA, skin: CREAM, cloth: CYAN, trim: GOLD, fits: ["shades", "jacket"] },
  { bias: 2, hair: INK, skin: CREAM, cloth: "#2a1840", trim: GOLD, fits: ["phones"] },
  { bias: 3, hair: CYAN, skin: GOLD, cloth: MAGENTA, trim: CREAM, fits: ["jacket", "bolt"] },
  { bias: 1, hair: INK, skin: CREAM, cloth: "#ff7a1a", trim: MAGENTA, fits: ["warmers", "shades"] },
  { bias: 0, hair: GOLD, skin: "#e7b090", cloth: CYAN, trim: MAGENTA, fits: ["band", "phones"] },
  { bias: 2, hair: MAGENTA, skin: GOLD, cloth: CREAM, trim: CYAN, fits: ["jacket", "warmers"] },
  { bias: 3, hair: INK, skin: CREAM, cloth: MAGENTA, trim: GOLD, fits: ["bolt", "shades"] },
];

const COLOR: Record<Part, (crew: Crew) => string> = {
  hair: (crew) => crew.hair,
  skin: (crew) => crew.skin,
  cloth: (crew) => crew.cloth,
  trim: (crew) => crew.trim,
  shoe: () => INK,
};

function stamp(art: string): Pix[] {
  const pixels: Pix[] = [];
  const key: Record<string, Part> = { H: "hair", S: "skin", M: "cloth", T: "trim", K: "shoe" };
  for (const [y, row] of art.trim().split("\n").entries()) {
    for (const [x, ch] of [...row].entries()) {
      const part = key[ch];
      if (part) pixels.push([x - 4, y, part]);
    }
  }
  return pixels;
}

const FRAMES: readonly (readonly Pix[])[] = [
  stamp(`
...HHH...
..HSSSH..
...SSS...
..MMMMM..
..MMMMM..
.TMMMMMT.
..MM.MM..
..KK.KK..
`),
  stamp(`
T..HHH..T
..HSSSH..
...SSS...
..MMMMM..
..MMMMM..
..MMMMM..
..MM.MM..
.KK...KK.
`),
  stamp(`
T..HHH...
..HSSSHT.
...SSS...
..MMMMM..
..MMMMMMT
..MMMMM..
..MM.MM..
..K...K..
`),
  stamp(`
...HHH...
..HSSSH..
...SSS...
..MMMMM..
..MMMMM..
..MMMMM..
..MM.KK..
..KK.KKK.
`),
];

export function danceOffset(move: number, beat: number, scale: number, reduced: boolean) {
  if (reduced || move === 3) return { x: 0, y: 0 };
  const phase = ((beat % 1) + 1) % 1;
  const hop = -Math.sin(phase * Math.PI) * scale * 1.15;
  if (move === 1) {
    const side = Math.floor(beat * 2) % 2 === 0 ? -1 : 1;
    return { x: Math.round(side * scale * 1.25), y: Math.round(phase > 0.5 ? scale * 0.3 : 0) };
  }
  if (move === 2) {
    return { x: Math.round(Math.sin(beat * Math.PI) * scale * 1.7), y: Math.round(hop * 0.4) };
  }
  return { x: 0, y: Math.round(hop) };
}

function paintFits(ctx: CanvasRenderingContext2D, crew: Crew, cx: number, top: number, scale: number) {
  for (const fit of crew.fits) {
    if (fit === "band") {
      ctx.fillStyle = crew.trim;
      ctx.fillRect(cx - 2 * scale, top + scale, 5 * scale, scale);
    } else if (fit === "shades") {
      ctx.fillStyle = INK;
      ctx.fillRect(cx - 2 * scale, top + 2 * scale, 5 * scale, scale);
      ctx.fillStyle = CYAN;
      ctx.fillRect(cx - 2 * scale, top + 2 * scale, 2 * scale, scale);
      ctx.fillRect(cx + scale, top + 2 * scale, 2 * scale, scale);
    } else if (fit === "warmers") {
      ctx.fillStyle = MAGENTA;
      ctx.fillRect(cx - 2 * scale, top + 6 * scale, 2 * scale, 2 * scale);
      ctx.fillRect(cx + scale, top + 6 * scale, 2 * scale, 2 * scale);
    } else if (fit === "phones") {
      ctx.fillStyle = INK;
      ctx.fillRect(cx - 3 * scale, top + scale, scale, 2 * scale);
      ctx.fillRect(cx + 2 * scale, top + scale, scale, 2 * scale);
      ctx.fillRect(cx - 2 * scale, top, 5 * scale, Math.max(1, scale * 0.6));
    } else if (fit === "jacket") {
      ctx.fillStyle = crew.trim;
      ctx.fillRect(cx - 4 * scale, top + 3 * scale, scale, 3 * scale);
      ctx.fillRect(cx + 3 * scale, top + 3 * scale, scale, 3 * scale);
      ctx.fillStyle = GOLD;
      ctx.fillRect(cx, top + 3 * scale, scale, 3 * scale);
    } else if (fit === "bolt") {
      ctx.fillStyle = GOLD;
      ctx.fillRect(cx + 2 * scale, top + scale, scale, scale);
      ctx.fillRect(cx + 3 * scale, top + 2 * scale, scale, scale);
    }
  }
}

function paintDancerAt(
  ctx: CanvasRenderingContext2D,
  crew: Crew,
  beat: number,
  reduced: boolean,
  cx: number,
  foot: number,
  scale: number,
  move: number,
) {
  const frame = FRAMES[0];
  const shift = danceOffset(move, beat, scale, reduced);
  const top = foot - 8 * scale + shift.y;
  const left = cx + shift.x;
  ctx.fillStyle = "rgba(0,0,0,0.45)";
  ctx.fillRect(cx - scale * 3, foot - scale * 0.3, scale * 6, Math.max(2, scale * 0.35));
  if (!frame) return;
  for (const [x, y, part] of frame) {
    ctx.fillStyle = COLOR[part](crew);
    ctx.fillRect(left + x * scale, top + y * scale, scale, scale);
  }
  paintFits(ctx, crew, left, top, scale);
}

function paintDecks(ctx: CanvasRenderingContext2D, cx: number, foot: number, scale: number) {
  const w = scale * 16;
  const h = scale * 6.2;
  const x = cx - w / 2;
  const top = foot - h * 0.2;
  ctx.fillStyle = "#120e0c";
  ctx.fillRect(x, top, w, h);
  ctx.fillStyle = GOLD;
  ctx.fillRect(x, top, w, Math.max(2, Math.round(scale * 0.4)));
  ctx.fillRect(x, top + h - Math.max(2, scale * 0.35), w, Math.max(2, scale * 0.35));
  for (const side of [-1, 1]) {
    const px = cx + side * scale * 4.2;
    const py = top + h * 0.55;
    ctx.fillStyle = "#1c1c1c";
    ctx.beginPath();
    ctx.arc(px, py, scale * 2.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#8a8a8a";
    ctx.lineWidth = Math.max(1, scale * 0.28);
    ctx.beginPath();
    ctx.arc(px, py, scale * 1.45, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = CREAM;
    ctx.beginPath();
    ctx.arc(px, py, scale * 0.55, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = Math.max(1, scale * 0.22);
    ctx.beginPath();
    ctx.moveTo(px + side * scale * 1.7, py - scale * 1.5);
    ctx.lineTo(px + side * scale * 0.2, py - scale * 0.15);
    ctx.stroke();
  }
  ctx.fillStyle = "#2a241c";
  ctx.fillRect(cx - scale * 1.3, top + scale, scale * 2.6, h * 0.55);
  for (let i = 0; i < 3; i += 1) {
    ctx.fillStyle = i === 1 ? MAGENTA : CYAN;
    ctx.fillRect(cx - scale * 0.9 + i * scale * 0.7, top + scale * 1.5, scale * 0.35, scale * 1.3);
  }
}

function floorLayout(width: number, height: number) {
  const aspect = 1500 / 1535;
  let w = width * 0.98;
  let h = w / aspect;
  if (h > height * 0.96) {
    h = height * 0.96;
    w = h * aspect;
  }
  const zoom = 1.72;
  w *= zoom;
  h *= zoom;
  return { x: (width - w) / 2, y: (height - h) / 2, w, h };
}

const LAMPS = [
  { nx: 628 / 910, ny: 42 / 400 },
  { nx: 824 / 910, ny: 78 / 400 },
] as const;

function paintStrobes(
  ctx: CanvasRenderingContext2D,
  layout: { x: number; y: number; w: number; h: number },
  now: number,
  reduced: boolean,
) {
  const tick = reduced ? 0 : Math.floor(now / 80);
  const colors = [CYAN, MAGENTA, GOLD, CREAM];
  LAMPS.forEach((lamp, index) => {
    const cx = layout.x + lamp.nx * layout.w;
    const cy = layout.y + lamp.ny * layout.h;
    const radius = Math.max(8, layout.h * 0.045);
    const on = reduced || (tick + index) % 2 === 0;
    const color = colors[(tick + index) % colors.length] ?? CREAM;
    const beamBottom = cy + layout.h * 0.34;
    ctx.fillStyle = color;
    ctx.globalAlpha = on ? 0.38 : 0.06;
    ctx.beginPath();
    ctx.moveTo(cx - radius * 0.35, cy + radius);
    ctx.lineTo(cx + radius * 0.35, cy + radius);
    ctx.lineTo(cx + radius * 4.2, beamBottom);
    ctx.lineTo(cx - radius * 4.2, beamBottom);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = on ? 1 : 0.2;
    ctx.beginPath();
    ctx.moveTo(cx - radius, cy);
    ctx.lineTo(cx + radius, cy);
    ctx.lineTo(cx + radius * 0.72, cy + radius * 0.7);
    ctx.lineTo(cx - radius * 0.72, cy + radius * 0.7);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
  });
}

function paintSmoke(
  ctx: CanvasRenderingContext2D,
  layout: { x: number; y: number; w: number; h: number },
  now: number,
  reduced: boolean,
) {
  const tick = reduced ? 0 : Math.floor(now / 80);
  const colors = [CYAN, MAGENTA, GOLD, CREAM];
  const drift = reduced ? 0 : now * 0.000035;
  for (let i = 0; i < 16; i += 1) {
    const span = 0.55 + (i % 5) * 0.08;
    const raw = (i * 0.137 + drift * span) % 1;
    const nx = 0.1 + (raw < 0 ? raw + 1 : raw) * 0.8;
    const bob = reduced ? 0 : Math.sin(now / 700 + i * 1.3) * 0.025;
    const ny = 0.28 + (i % 7) * 0.07 + bob;
    const x = layout.x + nx * layout.w;
    const y = layout.y + ny * layout.h;
    const radius = layout.h * (0.08 + (i % 4) * 0.025);
    let color = "rgba(220,220,230,0.9)";
    let alpha = 0.16;
    LAMPS.forEach((lamp, index) => {
      const on = reduced || (tick + index) % 2 === 0;
      const lampX = layout.x + lamp.nx * layout.w;
      if (Math.abs(x - lampX) < layout.w * 0.16 && ny > lamp.ny && ny < lamp.ny + 0.42) {
        color = colors[(tick + index) % colors.length] ?? CREAM;
        alpha = on ? 0.34 : 0.1;
      }
    });
    const glow = ctx.createRadialGradient(x, y, radius * 0.08, x, y, radius * 1.6);
    glow.addColorStop(0, color);
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.globalAlpha = alpha;
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.ellipse(x, y, radius * 1.6, radius * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function paintDisco(
  ctx: CanvasRenderingContext2D,
  layout: { x: number; y: number; w: number; h: number },
  now: number,
  reduced: boolean,
) {
  const cx = layout.x + layout.w * 0.528;
  const cy = layout.y + layout.h * 0.443;
  const radius = Math.max(10, layout.h * 0.042);
  const spin = reduced ? 0.4 : now / 260;
  const colors = [CYAN, MAGENTA, GOLD, CREAM, "#7cff6b", "#7aa2ff"];
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.clip();
  for (let i = 0; i < 12; i += 1) {
    const angle = spin + i * 0.62;
    ctx.globalAlpha = 0.72;
    ctx.fillStyle = colors[i % colors.length] ?? CREAM;
    ctx.fillRect(
      cx + Math.cos(angle) * radius * 0.55 - radius * 0.22,
      cy + Math.sin(angle * 1.4) * radius * 0.45 - radius * 0.12,
      radius * 0.42,
      radius * 0.24,
    );
  }
  ctx.restore();
  ctx.globalAlpha = 0.9;
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(cx + Math.cos(spin) * radius * 0.38, cy + Math.sin(spin) * radius * 0.32, radius * 0.16, 0, Math.PI * 2);
  ctx.fill();
  for (let i = 0; i < 16; i += 1) {
    const angle = spin * 0.65 + (i * Math.PI * 2) / 16;
    const nx = 0.48 + Math.cos(angle) * (0.16 + (i % 3) * 0.07);
    const ny = 0.64 + Math.sin(angle) * 0.08;
    const x = layout.x + nx * layout.w;
    const y = layout.y + ny * layout.h;
    const color = colors[i % colors.length] ?? CREAM;
    const spot = layout.w * 0.03;
    const glow = ctx.createRadialGradient(x, y, 0, x, y, spot);
    glow.addColorStop(0, color);
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.globalAlpha = 0.42;
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.ellipse(x, y, spot, spot * 0.42, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.16;
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(1, layout.h * 0.004);
    ctx.beginPath();
    ctx.moveTo(cx, cy + radius);
    ctx.lineTo(x, y);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

export function clubPoint(
  width: number,
  height: number,
  x: number,
  y: number,
): { nx: number; ny: number } | null {
  const layout = floorLayout(width, height);
  const nx = (x - layout.x) / layout.w;
  const ny = (y - layout.y) / layout.h;
  if (nx < -0.02 || ny < -0.02 || nx > 1.02 || ny > 1.02) return null;
  return {
    nx: Math.min(0.8, Math.max(0.18, nx)),
    ny: Math.min(0.78, Math.max(0.55, ny)),
  };
}

export function paintClub(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  rows: readonly string[] | null,
  worn: readonly Look[],
  place: { nx: number; ny: number },
  move: number,
  beat: number,
  reduced: boolean,
  now: number,
  moving: boolean,
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
  paintDisco(ctx, layout, now, reduced);

  const shelfH = layout.h * 0.1;
  const dancerScale = Math.max(1, Math.round(shelfH / 22));
  const spot = (nx: number, ny: number) => ({
    x: layout.x + nx * layout.w,
    y: layout.y + ny * layout.h,
  });

  const crowd = [
    { crew: CREW[0], nx: 0.28, ny: 0.66 },
    { crew: CREW[1], nx: 0.4, ny: 0.74 },
    { crew: CREW[3], nx: 0.55, ny: 0.64 },
    { crew: CREW[4], nx: 0.66, ny: 0.74 },
    { crew: CREW[5], nx: 0.34, ny: 0.58 },
    { crew: CREW[6], nx: 0.5, ny: 0.7 },
    { crew: CREW[7], nx: 0.72, ny: 0.66 },
  ].filter((item): item is { crew: Crew; nx: number; ny: number } => Boolean(item.crew));

  const friendSpot = spot(place.nx, place.ny);
  const shift = rows && !moving ? danceOffset(move, beat, Math.max(1, Math.round(shelfH / 32)), reduced) : { x: 0, y: 0 };

  const layers: { y: number; draw: () => void }[] = crowd.map((item) => ({
      y: spot(item.nx, item.ny).y,
      draw: () => {
        const at = spot(item.nx, item.ny);
        paintDancerAt(ctx, item.crew, beat, reduced, at.x, at.y, dancerScale, move);
      },
    }));
  if (rows) {
    const friendScale = Math.max(1, Math.round(shelfH / 32));
    layers.push({
      y: friendSpot.y + shift.y,
      draw: () => {
        const footX = friendSpot.x + shift.x;
        const footY = friendSpot.y + shift.y;
        ctx.fillStyle = "rgba(0,0,0,0.45)";
        ctx.fillRect(footX - friendScale * 5, footY - friendScale * 0.3, friendScale * 10, Math.max(2, friendScale * 0.4));
        paintFriend(ctx, footX - 8 * friendScale, footY - 16 * friendScale, friendScale, rows, worn, restRows);
      },
    });
  }
  layers.sort((a, b) => a.y - b.y);
  for (const layer of layers) layer.draw();
}

type Island = { x: number; y: number; w: number; h: number };

function islandBox(width: number, height: number, aspect: number, focus: number, side: -1 | 1): Island {
  let w = width * (0.26 + 0.52 * focus);
  let h = w / aspect;
  const maxH = height * (0.4 + 0.54 * focus);
  if (h > maxH) {
    h = maxH;
    w = h * aspect;
  }
  const cx = width / 2 + side * (1 - focus) * width * 0.36;
  return { x: cx - w / 2, y: (height - h) / 2, w, h };
}

export function deckRects(width: number, height: number, blend: number) {
  const gymFocus = 1 - blend;
  const arcadeFocus = blend;
  return {
    gym: islandBox(width, height, 1500 / 2230, gymFocus, -1),
    arcade: islandBox(width, height, 1500 / 1010, arcadeFocus, 1),
  };
}

function inside(box: Island, x: number, y: number) {
  return x >= box.x && x <= box.x + box.w && y >= box.y && y <= box.y + box.h;
}

export type GymGear = "lift" | "punch";

const RF = 10n ** 18n;
const WEEK = 7 * 24 * 60 * 60 * 1000;
export const GYM_MS = 4900;

export type Glove = {
  name: string;
  price: bigint;
  swatch: string;
  pixels: readonly (readonly [number, number, string])[];
};

const cream = "#f4ecdf";
const magenta = "#ff2bd6";
const cyan = "#39f2e4";
const ink = "#141018";
const gold = "#e6c36a";

function mitts(color: string, cuff: string, big: boolean): Glove["pixels"] {
  const pixels: [number, number, string][] = [];
  const span = big ? 4 : 3;
  const top = big ? 7 : 8;
  for (let y = 0; y < span; y += 1) {
    for (let x = 0; x < (big ? 3 : 2); x += 1) {
      pixels.push([-3 + x, top + y, y === span - 1 ? cuff : color]);
      pixels.push([15 + (big ? 0 : 1) + x, top + y, y === span - 1 ? cuff : color]);
    }
  }
  return pixels;
}

export const GLOVES: readonly Glove[] = [
  { name: "Bare hands", price: 0n, swatch: cream, pixels: [] },
  { name: "Workout gloves", price: 2n * RF, swatch: cyan, pixels: mitts(cyan, magenta, false) },
  { name: "Boxing gloves", price: 4n * RF, swatch: magenta, pixels: mitts(magenta, cream, true) },
];

const RARE_GLOVES: readonly Glove[] = [
  { name: "Gold mitts", price: 8n * RF, swatch: gold, pixels: mitts(gold, ink, true) },
  { name: "Neon wraps", price: 8n * RF, swatch: cyan, pixels: mitts(cyan, magenta, true) },
  { name: "Tiger gloves", price: 9n * RF, swatch: "#ff7a1a", pixels: mitts("#ff7a1a", ink, true) },
  { name: "Velvet hooks", price: 8n * RF, swatch: "#4a1468", pixels: mitts("#4a1468", magenta, true) },
  { name: "Chrome bag gloves", price: 10n * RF, swatch: cream, pixels: mitts(cream, cyan, true) },
];

export function gloveById(id: number) {
  if (id >= 300) return RARE_GLOVES[id - 300] ?? GLOVES[0];
  return GLOVES[id] ?? GLOVES[0];
}

export function weeklyRareGlove(now = Date.now()): Glove & { readonly id: number } {
  const index = Math.floor(now / WEEK) % RARE_GLOVES.length;
  const glove = RARE_GLOVES[index] ?? RARE_GLOVES[0];
  return { ...glove, id: 300 + index };
}

function paintGloves(
  ctx: CanvasRenderingContext2D,
  originX: number,
  originY: number,
  scale: number,
  glove: Glove,
  lift = 0,
) {
  for (const [x, y, color] of glove.pixels) {
    ctx.fillStyle = color;
    ctx.fillRect(originX + x * scale, originY + (y - lift) * scale, scale, scale);
  }
}

export function gymZoom(now: number, until: number) {
  if (until <= now) return 0;
  const elapsed = GYM_MS - (until - now);
  if (elapsed <= 0) return 0;
  if (elapsed < 400) return elapsed / 400;
  if (elapsed < 4400) return 1;
  return Math.max(0, 1 - (elapsed - 4400) / 500);
}

export function gymDeckHit(width: number, height: number, x: number, y: number, blend: number): "gym" | "arcade" | null {
  const decks = deckRects(width, height, blend);
  const onGym = inside(decks.gym, x, y);
  const onArcade = inside(decks.arcade, x, y);
  if (onGym && onArcade) return blend >= 0.5 ? "arcade" : "gym";
  if (onArcade) return "arcade";
  if (onGym) return "gym";
  return null;
}

export function gymPoint(width: number, height: number, x: number, y: number, blend: number): { nx: number; ny: number } | null {
  const layout = deckRects(width, height, blend).gym;
  const nx = (x - layout.x) / layout.w;
  const ny = (y - layout.y) / layout.h;
  if (nx < 0.1 || nx > 0.9 || ny < 0.42 || ny > 0.72) return null;
  return {
    nx: Math.min(0.82, Math.max(0.18, nx)),
    ny: Math.min(0.66, Math.max(0.46, ny)),
  };
}

export function arcadeCabinetHit(width: number, height: number, x: number, y: number, blend: number) {
  if (blend < 0.72) return false;
  const layout = deckRects(width, height, blend).arcade;
  const nx = (x - layout.x) / layout.w;
  const ny = (y - layout.y) / layout.h;
  const machines = [
    { x: 0.36, y: 0.48, w: 0.14, h: 0.2 },
    { x: 0.45, y: 0.4, w: 0.14, h: 0.2 },
    { x: 0.53, y: 0.48, w: 0.15, h: 0.22 },
  ];
  return machines.some((machine) => nx >= machine.x && ny >= machine.y && nx <= machine.x + machine.w && ny <= machine.y + machine.h);
}

export function arcadePoint(width: number, height: number, x: number, y: number, blend: number): { nx: number; ny: number } | null {
  const layout = deckRects(width, height, blend).arcade;
  const nx = (x - layout.x) / layout.w;
  const ny = (y - layout.y) / layout.h;
  if (nx < 0.16 || nx > 0.86 || ny < 0.68 || ny > 0.94) return null;
  return {
    nx: Math.min(0.82, Math.max(0.2, nx)),
    ny: Math.min(0.9, Math.max(0.72, ny)),
  };
}

export function gymGearHit(width: number, height: number, x: number, y: number, blend: number): GymGear | null {
  const layout = deckRects(width, height, blend).gym;
  const nx = (x - layout.x) / layout.w;
  const ny = (y - layout.y) / layout.h;
  if (nx < 0 || ny < 0 || nx > 1 || ny > 1) return null;
  if (nx > 0.28 && nx < 0.62 && ny > 0.26 && ny < 0.5) return "lift";
  return null;
}

export function paintGym(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  rows: readonly string[] | null,
  worn: readonly Look[],
  gear: GymGear | "",
  glove: Glove,
  place: { nx: number; ny: number },
  deck: "gym" | "arcade",
  blend: number,
  now: number,
  until: number,
  reduced: boolean,
  restRows?: readonly string[] | null,
) {
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, width, height);
  const decks = deckRects(width, height, blend);
  const art = gymArt();
  const arcade = arcadeArt();
  const smoothing = ctx.imageSmoothingEnabled;
  ctx.imageSmoothingEnabled = false;
  const drawIsland = (box: Island, image: HTMLImageElement | null, focus: number) => {
    if (!image) return;
    ctx.save();
    ctx.globalAlpha = 0.45 + 0.55 * focus;
    ctx.drawImage(image, box.x, box.y, box.w, box.h);
    ctx.restore();
  };
  if (blend < 0.5) {
    drawIsland(decks.arcade, arcade, blend);
    drawIsland(decks.gym, art, 1 - blend);
  } else {
    drawIsland(decks.gym, art, 1 - blend);
    drawIsland(decks.arcade, arcade, blend);
  }
  ctx.imageSmoothingEnabled = smoothing;
  paintSign(ctx, "Click the one you want", width / 2, 6, height, 0.42);
  paintSign(ctx, "Gym", decks.gym.x + decks.gym.w / 2, Math.max(28, decks.gym.y + decks.gym.h * 0.04), decks.gym.h, 0.55);
  paintSign(ctx, "Arcade", decks.arcade.x + decks.arcade.w / 2, Math.max(28, decks.arcade.y + decks.arcade.h * 0.04), decks.arcade.h, 0.55);
  const layout = deck === "arcade" ? decks.arcade : decks.gym;
  const active = gear !== "" && now < until;
  const elapsed = active ? GYM_MS - (until - now) : 0;
  const cycle = active && !reduced ? (elapsed / 520) % 1 : 0;
  if (!rows) return;
  const base = Math.max(2, Math.round((layout.h * 0.09) / 16));
  const zoom = reduced ? 0 : gymZoom(now, until);
  const eased = zoom * zoom * (3 - 2 * zoom);
  const peak = Math.max(base + 2, Math.round(Math.min(width, height) / 28));
  const scale = base + (peak - base) * eased;
  const lifting = active && gear === "lift";
  const press = lifting && !reduced ? (Math.sin(cycle * Math.PI * 2) + 1) / 2 : 0;
  const squat = lifting && !reduced ? (1 - press) * scale * 1.4 : 0;
  const homeX = layout.x + layout.w * (lifting ? 0.4 : place.nx);
  const homeY = layout.y + layout.h * (lifting ? 0.5 : place.ny);
  const footX = homeX + (width / 2 - homeX) * eased;
  const footY = homeY + (height * 0.55 - homeY) * eased + squat;
  if (eased > 0.04) {
    ctx.fillStyle = `rgba(8,4,14,${0.55 * eased})`;
    ctx.fillRect(0, 0, width, height);
  }
  const originX = footX - 8 * scale;
  const originY = footY - 16 * scale;
  paintFriend(ctx, originX, originY, scale, rows, worn, restRows);
  paintGloves(ctx, originX, originY, scale, glove, press * 7);
  if (lifting) {
    const barY = footY - scale * (8 + press * 7);
    ctx.strokeStyle = "#f4ecdf";
    ctx.lineWidth = Math.max(2, Math.round(scale * 0.45));
    ctx.beginPath();
    ctx.moveTo(footX - scale * 7, barY);
    ctx.lineTo(footX + scale * 7, barY);
    ctx.stroke();
    ctx.lineWidth = Math.max(3, Math.round(scale * 0.9));
    ctx.beginPath();
    ctx.moveTo(footX - scale * 7, barY - scale);
    ctx.lineTo(footX - scale * 7, barY + scale);
    ctx.moveTo(footX + scale * 7, barY - scale);
    ctx.lineTo(footX + scale * 7, barY + scale);
    ctx.stroke();
  }
}
