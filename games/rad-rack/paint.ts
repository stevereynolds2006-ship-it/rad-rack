import type { Look, LookPixel } from "./looks";
import doorClosedUrl from "./art/door-closed.png";
import doorOpenUrl from "./art/door-open.png";
import wardrobeUrl from "./art/rack-neon-3.jpg";
import bowlUrl from "./art/bowling-2.jpg";
import laneUrl from "./art/lane.jpg";
import snackUrl from "./art/snack.jpg";

let wardrobeImage: HTMLImageElement | null = null;

function wardrobeArt() {
  if (!wardrobeImage && typeof Image !== "undefined") {
    wardrobeImage = new Image();
    wardrobeImage.src = wardrobeUrl;
  }
  return wardrobeImage && wardrobeImage.complete && wardrobeImage.naturalWidth > 0 ? wardrobeImage : null;
}

let bowlImage: HTMLImageElement | null = null;

function bowlArt() {
  if (!bowlImage && typeof Image !== "undefined") {
    bowlImage = new Image();
    bowlImage.src = bowlUrl;
  }
  return bowlImage && bowlImage.complete && bowlImage.naturalWidth > 0 ? bowlImage : null;
}

export const WARDROBE_CLOSET = { x: 0.48, y: 0.14, w: 0.24, h: 0.42 };
export const WARDROBE_CURTAIN = { x: 0.06, y: 0.26, w: 0.2, h: 0.26 };
export const WARDROBE_DESK = { x: 0.34, y: 0.62, w: 0.16, h: 0.16 };
export const WARDROBE_BAG = { x: 0.3, y: 0.13, w: 0.2, h: 0.36 };
export const WARDROBE_BOWL = { x: 0.76, y: 0.36, w: 0.2, h: 0.36 };

export function wardrobeHit(
  width: number,
  height: number,
  x: number,
  y: number,
): "closet" | "curtain" | "desk" | "gym" | "bowl" | { nx: number; ny: number } | null {
  const layout = wardrobeLayout(width, height);
  const nx = (x - layout.x) / layout.w;
  const ny = (y - layout.y) / layout.h;
  if (nx < 0 || ny < 0 || nx > 1 || ny > 1) return null;
  if (inside(WARDROBE_BAG, nx, ny)) return "gym";
  if (inside(WARDROBE_CLOSET, nx, ny)) return "closet";
  if (inside(WARDROBE_CURTAIN, nx, ny)) return "curtain";
  if (inside(WARDROBE_DESK, nx, ny)) return "desk";
  if (inside(WARDROBE_BOWL, nx, ny)) return "bowl";
  return {
    nx: Math.min(0.82, Math.max(0.16, nx)),
    ny: Math.min(0.66, Math.max(0.44, ny)),
  };
}

function inside(zone: { x: number; y: number; w: number; h: number }, nx: number, ny: number) {
  return nx >= zone.x && ny >= zone.y && nx <= zone.x + zone.w && ny <= zone.y + zone.h;
}

function wardrobeLayout(width: number, height: number) {
  const aspect = 1500 / 1861;
  let w = width * 0.98;
  let h = w / aspect;
  if (h > height * 0.96) {
    h = height * 0.96;
    w = h * aspect;
  }
  const zoom = 1.42;
  w *= zoom;
  h *= zoom;
  return { x: (width - w) / 2, y: (height - h) / 2, w, h };
}
let doorClosed: HTMLImageElement | null = null;
let doorOpen: HTMLImageElement | null = null;

function doorImage(open: boolean) {
  if (!doorClosed && typeof Image !== "undefined") {
    doorClosed = new Image();
    doorOpen = new Image();
    doorClosed.src = doorClosedUrl;
    doorOpen.src = doorOpenUrl;
  }
  const image = open ? doorOpen : doorClosed;
  return image && image.complete && image.naturalWidth > 0 ? image : null;
}

export function doorSize(open: boolean, maxH: number, maxW: number) {
  const image = doorImage(open);
  const aspect = image ? image.naturalWidth / image.naturalHeight : 0.52;
  let height = maxH;
  let width = height * aspect;
  if (width > maxW) {
    width = maxW;
    height = width / aspect;
  }
  return { w: Math.round(width), h: Math.round(height) };
}
const COLS = 30;
const ROWS = 24;
const FRIEND_COL = 6;
const FRIEND_ROW = 3;
const HALO = "#ffffff";
const INK = "#141018";

export function clothDelta(current: readonly string[], rest: readonly string[]) {
  const mass = (rows: readonly string[]) => {
    let count = 0;
    let sum = 0;
    rows.forEach((row, y) => {
      for (let x = 0; x < row.length; x += 1) {
        if (row[x] === "#") {
          count += 1;
          sum += y;
        }
      }
    });
    return count ? sum / count : null;
  };
  const now = mass(current);
  const base = mass(rest);
  if (now === null || base === null) return 0;
  return now - base;
}

export function paintFriend(
  ctx: CanvasRenderingContext2D,
  originX: number,
  originY: number,
  scale: number,
  rows: readonly string[],
  worn: readonly Look[],
  restRows?: readonly string[] | null,
) {
  const bob = restRows ? Math.round(clothDelta(rows, restRows) * scale) : 0;
  const blit = (pixels: readonly LookPixel[], dy: number) => {
    for (const [x, y, color] of pixels) {
      ctx.fillStyle = color;
      ctx.fillRect(originX + x * scale, originY + y * scale + dy, scale, scale);
    }
  };

  ctx.fillStyle = HALO;
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x += 1) {
      if (row[x] !== "#") continue;
      ctx.fillRect(originX + (x - 1) * scale, originY + (y - 1) * scale, scale * 3, scale * 3);
    }
  });

  for (const look of worn) blit(look.back, bob);
  const ink: LookPixel[] = [];
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x += 1) {
      if (row[x] === "#") ink.push([x, y, INK]);
    }
  });
  blit(ink, 0);
  for (const look of worn) blit(look.front, bob);
}

/** A doorway you can step through. Paint the opening (and the door leaf) first, the friend, then the casing. */
export function paintWalkDoor(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  open: boolean,
  label: string,
  hinge: "left" | "right",
  layer: "opening" | "frame",
) {
  const sprite = doorImage(open);
  if (sprite) {
    if (layer === "opening") {
      const smoothing = ctx.imageSmoothingEnabled;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(sprite, Math.round(x), Math.round(y), Math.round(w), Math.round(h));
      ctx.imageSmoothingEnabled = smoothing;
    }
    return;
  }
  const casing = Math.max(8, Math.round(w * 0.12));
  const header = Math.max(22, Math.round(Math.min(36, h * 0.18)));
  const ix = x + casing;
  const iy = y + header;
  const iw = Math.max(12, w - casing * 2);
  const ih = Math.max(16, h - header - casing);

  if (layer === "opening") {
    ctx.fillStyle = "#07040c";
    ctx.fillRect(ix, iy, iw, ih);
    if (open) {
      const glow = ctx.createLinearGradient(0, iy, 0, iy + ih);
      glow.addColorStop(0, "#39f2e455");
      glow.addColorStop(0.45, "#ff2bd628");
      glow.addColorStop(1, "#07040c");
      ctx.fillStyle = glow;
      ctx.fillRect(ix, iy, iw, ih);
      ctx.fillStyle = "#1a1024";
      for (let row = 0; row < 4; row += 1) {
        ctx.globalAlpha = 0.35;
        ctx.fillRect(ix, iy + ih * 0.62 + row * (ih * 0.08), iw, 2);
      }
      ctx.globalAlpha = 1;
    }

    const slabW = open ? iw * 0.58 : iw - 8;
    const hingeX = hinge === "left" ? ix + (open ? 0 : 4) : ix + iw - (open ? 0 : 4);
    const edge = hinge === "left" ? hingeX + (open ? -slabW : slabW) : hingeX + (open ? slabW : -slabW);
    const topInset = open ? ih * 0.05 : 4;
    const botInset = open ? ih * 0.04 : 4;
    ctx.fillStyle = open ? "#ff2bd6" : "#e4149a";
    ctx.beginPath();
    ctx.moveTo(hingeX, iy + (open ? 0 : 4));
    ctx.lineTo(edge, iy + topInset);
    ctx.lineTo(edge, iy + ih - botInset);
    ctx.lineTo(hingeX, iy + ih - (open ? 0 : 4));
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = open ? "#ff2bd6" : "#5a3058";
    ctx.lineWidth = 2;
    ctx.stroke();

    const panelLeft = Math.min(hingeX, edge) + 8;
    const panelWidth = Math.max(10, Math.abs(edge - hingeX) - 16);
    ctx.fillStyle = "#140816";
    ctx.fillRect(panelLeft, iy + ih * 0.14, panelWidth, ih * 0.26);
    ctx.fillRect(panelLeft, iy + ih * 0.5, panelWidth, ih * 0.28);
    ctx.strokeStyle = "#f4ecdf";
    ctx.lineWidth = 2;
    ctx.strokeRect(panelLeft, iy + ih * 0.14, panelWidth, ih * 0.26);
    ctx.strokeRect(panelLeft, iy + ih * 0.5, panelWidth, ih * 0.28);
    ctx.fillStyle = open ? "#39f2e4" : "#cbb8c4";
    const knobX = hinge === "left" ? (open ? edge + 12 : ix + iw - 16) : open ? edge - 12 : ix + 16;
    ctx.beginPath();
    ctx.arc(knobX, iy + ih * 0.56, Math.max(3, w * 0.035), 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  ctx.fillStyle = "#f4ecdf";
  ctx.fillRect(x, y, w, header);
  ctx.fillRect(x, iy, casing, ih + casing);
  ctx.fillRect(x + w - casing, iy, casing, ih + casing);
  ctx.fillRect(x, y + h - casing, w, casing);
  ctx.strokeStyle = "#ff2bd6";
  ctx.lineWidth = 4;
  ctx.strokeRect(x + 2, y + 2, w - 4, h - 4);
  ctx.fillStyle = open ? "#ff2bd6" : "#5a3058";
  const fontPx = Math.max(8, Math.min(11, Math.floor((w - 8) / 6)));
  ctx.font = `${fontPx}px "Press Start 2P", ui-monospace, monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, x + w / 2, y + header / 2);
  ctx.fillStyle = "#f4ecdf";
  ctx.fillRect(x - 10, y + h - 6, w + 20, 7);
}



function roomFrame(width: number, height: number) {
  return {
    horizon: height * 0.56,
    backL: width * 0.22,
    backR: width * 0.78,
    backTop: height * 0.1,
  };
}

function wallPoint(width: number, height: number, side: "left" | "right", along: number, down: number) {
  const frame = roomFrame(width, height);
  const nearX = side === "left" ? 0 : width;
  const farX = side === "left" ? frame.backL : frame.backR;
  const x = nearX + (farX - nearX) * along;
  const ceilY = frame.backTop * along;
  const floorY = height + (frame.horizon - height) * along;
  return { x, y: ceilY + (floorY - ceilY) * down };
}

/** Door set into a side wall. The outer edge is flush with that wall. */
function paintFlatWallDoor(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  side: "left" | "right",
  open: boolean,
) {
  const along1 = 0.78;
  const down0 = 0.5;
  const corner = (along: number, down: number) => wallPoint(width, height, side, along, down);
  const quad = [corner(0, down0), corner(along1, down0), corner(along1, 1), corner(0, 1)];
  ctx.beginPath();
  ctx.moveTo(quad[0].x, quad[0].y);
  for (const point of quad.slice(1)) ctx.lineTo(point.x, point.y);
  ctx.closePath();
  ctx.fillStyle = "#120814";
  ctx.fill();

  const sprite = doorImage(open);
  if (sprite) {
    const strips = 32;
    const smoothing = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = false;
    for (let i = 0; i < strips; i += 1) {
      const t0 = i / strips;
      const t1 = (i + 1) / strips;
      const downA = down0 + (1 - down0) * t0;
      const downB = down0 + (1 - down0) * t1;
      const start = corner(0, downA);
      const end = corner(along1, downA);
      const next = corner(0, downB);
      const sy = (sprite.naturalHeight * i) / strips;
      const sh = Math.max(0.5, sprite.naturalHeight / strips);
      ctx.save();
      ctx.transform(
        (end.x - start.x) / sprite.naturalWidth,
        (end.y - start.y) / sprite.naturalWidth,
        (next.x - start.x) / sh,
        (next.y - start.y) / sh,
        start.x,
        start.y,
      );
      ctx.drawImage(sprite, 0, sy, sprite.naturalWidth, sh, 0, 0, sprite.naturalWidth, sh);
      ctx.restore();
    }
    ctx.imageSmoothingEnabled = smoothing;
  }

  ctx.beginPath();
  ctx.moveTo(quad[0].x, quad[0].y);
  for (const point of quad.slice(1)) ctx.lineTo(point.x, point.y);
  ctx.closePath();
  ctx.strokeStyle = "#f4ecdf";
  ctx.lineWidth = 3;
  ctx.stroke();
}

function paintChangingRoom(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const { horizon, backL, backR, backTop } = roomFrame(width, height);
  const backW = backR - backL;

  ctx.fillStyle = "#1a0c22";
  ctx.fillRect(0, 0, width, height);

  const ceiling = ctx.createLinearGradient(0, 0, 0, backTop + 8);
  ceiling.addColorStop(0, "#241028");
  ceiling.addColorStop(1, "#4a2860");
  ctx.fillStyle = ceiling;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(width, 0);
  ctx.lineTo(backR, backTop);
  ctx.lineTo(backL, backTop);
  ctx.closePath();
  ctx.fill();

  const leftWall = ctx.createLinearGradient(0, 0, backL, 0);
  leftWall.addColorStop(0, "#7a447f");
  leftWall.addColorStop(1, "#3d1a4c");
  ctx.fillStyle = leftWall;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(backL, backTop);
  ctx.lineTo(backL, horizon);
  ctx.lineTo(0, height);
  ctx.closePath();
  ctx.fill();

  const rightWall = ctx.createLinearGradient(width, 0, backR, 0);
  rightWall.addColorStop(0, "#4e2460");
  rightWall.addColorStop(1, "#2a1036");
  ctx.fillStyle = rightWall;
  ctx.beginPath();
  ctx.moveTo(width, 0);
  ctx.lineTo(backR, backTop);
  ctx.lineTo(backR, horizon);
  ctx.lineTo(width, height);
  ctx.closePath();
  ctx.fill();

  const back = ctx.createLinearGradient(0, backTop, 0, horizon);
  back.addColorStop(0, "#6a3878");
  back.addColorStop(1, "#3a1846");
  ctx.fillStyle = back;
  ctx.fillRect(backL, backTop, backW, horizon - backTop);

  for (let i = 1; i < 4; i += 1) {
    const x = backL + (backW * i) / 4;
    ctx.fillStyle = "rgba(20,8,28,0.28)";
    ctx.fillRect(x, backTop, 3, horizon - backTop);
  }

  ctx.fillStyle = "#f7f1e4";
  const lightW = backW * 0.22;
  ctx.fillRect(width / 2 - lightW / 2, backTop - 6, lightW, 10);
  const glow = ctx.createRadialGradient(width / 2, backTop + 24, 6, width / 2, horizon * 0.72, backW * 0.46);
  glow.addColorStop(0, "rgba(247,241,228,0.42)");
  glow.addColorStop(1, "rgba(247,241,228,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(backL, backTop, backW, horizon - backTop);

  ctx.beginPath();
  ctx.moveTo(backL, horizon);
  ctx.lineTo(backR, horizon);
  ctx.lineTo(width, height);
  ctx.lineTo(0, height);
  ctx.closePath();
  ctx.fillStyle = "#3a1830";
  ctx.fill();

  for (let i = 0; i < 9; i += 1) {
    const t0 = (i / 9) ** 1.35;
    const t1 = ((i + 0.42) / 9) ** 1.35;
    const y0 = horizon + (height - horizon) * t0;
    const y1 = horizon + (height - horizon) * t1;
    const x0L = backL + (0 - backL) * t0;
    const x0R = backR + (width - backR) * t0;
    const x1L = backL + (0 - backL) * t1;
    const x1R = backR + (width - backR) * t1;
    ctx.fillStyle = i % 2 === 0 ? "#8d4b68" : "#5a2844";
    ctx.beginPath();
    ctx.moveTo(x0L, y0);
    ctx.lineTo(x0R, y0);
    ctx.lineTo(x1R, y1);
    ctx.lineTo(x1L, y1);
    ctx.closePath();
    ctx.fill();
  }

  ctx.strokeStyle = "rgba(244,236,223,0.45)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(backL, backTop);
  ctx.lineTo(backL, horizon);
  ctx.lineTo(0, height);
  ctx.moveTo(backR, backTop);
  ctx.lineTo(backR, horizon);
  ctx.lineTo(width, height);
  ctx.stroke();
  ctx.fillStyle = "#1a1024";
  ctx.fillRect(backL, horizon - 7, backW, 8);

  const mirrorW = backW * 0.4;
  const mirrorH = (horizon - backTop) * 0.58;
  const mirrorX = width / 2 - mirrorW / 2;
  const mirrorY = backTop + (horizon - backTop) * 0.14;
  ctx.fillStyle = "#e7d3b0";
  ctx.fillRect(mirrorX - 8, mirrorY - 8, mirrorW + 16, mirrorH + 16);
  ctx.fillStyle = "#102830";
  ctx.fillRect(mirrorX, mirrorY, mirrorW, mirrorH);
  ctx.fillStyle = "rgba(57,242,228,0.3)";
  ctx.beginPath();
  ctx.moveTo(mirrorX, mirrorY);
  ctx.lineTo(mirrorX + mirrorW * 0.4, mirrorY);
  ctx.lineTo(mirrorX + mirrorW * 0.12, mirrorY + mirrorH);
  ctx.lineTo(mirrorX, mirrorY + mirrorH);
  ctx.closePath();
  ctx.fill();

  const benchT = 0.28;
  const by = horizon + (height - horizon) * benchT ** 1.35;
  const bxL = backL + (0 - backL) * benchT;
  const bxR = backR + (width - backR) * benchT;
  const inset = (bxR - bxL) * 0.3;
  const bL = bxL + inset;
  const bR = bxR - inset;
  const seat = 16 + benchT * 36;
  ctx.fillStyle = "#3d2418";
  ctx.beginPath();
  ctx.moveTo(bL, by - seat);
  ctx.lineTo(bR, by - seat);
  ctx.lineTo(bR - 14, by - seat - 12);
  ctx.lineTo(bL + 14, by - seat - 12);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#6b4030";
  ctx.beginPath();
  ctx.moveTo(bL, by - seat);
  ctx.lineTo(bR, by - seat);
  ctx.lineTo(bR, by - seat + 14);
  ctx.lineTo(bL, by - seat + 14);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#4a2a1c";
  ctx.fillRect(bL + 10, by - seat + 14, 8, seat - 8);
  ctx.fillRect(bR - 18, by - seat + 14, 8, seat - 8);

  ctx.strokeStyle = "#e6c36a";
  ctx.lineWidth = 3;
  for (const t of [0.34, 0.52]) {
    const hx = backL * (1 - t) * 0.72;
    const hy = backTop * (1 - t) + horizon * 0.55 * t;
    ctx.beginPath();
    ctx.moveTo(hx, hy);
    ctx.lineTo(hx + 16, hy + 8);
    ctx.stroke();
    ctx.strokeStyle = "#f4ecdf";
    ctx.beginPath();
    ctx.moveTo(hx + 16, hy + 8);
    ctx.lineTo(hx + 28, hy + 20);
    ctx.lineTo(hx + 4, hy + 20);
    ctx.closePath();
    ctx.stroke();
    ctx.strokeStyle = "#e6c36a";
  }
}

export function outfitZoom(now: number, until: number) {
  const duration = 1800;
  if (until <= now) return 0;
  const t = 1 - (until - now) / duration;
  if (t <= 0) return 0;
  if (t < 0.32) return t / 0.32;
  if (t < 0.62) return 1;
  return Math.max(0, 1 - (t - 0.62) / 0.38);
}

function bowlLayout(width: number, height: number) {
  const aspect = 1500 / 2230;
  let w = width * 0.96;
  let h = w / aspect;
  if (h > height * 0.96) {
    h = height * 0.96;
    w = h * aspect;
  }
  const zoom = 1.2;
  w *= zoom;
  h *= zoom;
  return { x: (width - w) / 2, y: (height - h) / 2, w, h };
}

export function bowlSnackHit(width: number, height: number, x: number, y: number) {
  const layout = bowlLayout(width, height);
  const nx = (x - layout.x) / layout.w;
  const ny = (y - layout.y) / layout.h;
  return nx >= 0.08 && nx <= 0.3 && ny >= 0.18 && ny <= 0.42;
}

export function bowlLaneHit(width: number, height: number, x: number, y: number) {
  const layout = bowlLayout(width, height);
  const nx = (x - layout.x) / layout.w;
  const ny = (y - layout.y) / layout.h;
  return nx >= 0.28 && nx <= 0.64 && ny >= 0.32 && ny <= 0.52;
}

export function bowlPoint(width: number, height: number, x: number, y: number): { nx: number; ny: number } | null {
  const layout = bowlLayout(width, height);
  const nx = (x - layout.x) / layout.w;
  const ny = (y - layout.y) / layout.h;
  if (nx < 0.16 || nx > 0.78 || ny < 0.5 || ny > 0.74) return null;
  return {
    nx: Math.min(0.72, Math.max(0.2, nx)),
    ny: Math.min(0.72, Math.max(0.54, ny)),
  };
}

export function paintBowl(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  rows: readonly string[] | null,
  worn: readonly Look[],
  place: { nx: number; ny: number },
  restRows?: readonly string[] | null,
) {
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, width, height);
  const { x, y, w, h } = bowlLayout(width, height);
  const art = bowlArt();
  if (art) {
    const smoothing = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(art, x, y, w, h);
    ctx.imageSmoothingEnabled = smoothing;
  }
  if (!rows) return;
  const scale = Math.max(1, Math.round((h * 0.05) / 16));
  const footX = x + place.nx * w;
  const footY = y + place.ny * h;
  ctx.fillStyle = "rgba(0,0,0,0.4)";
  ctx.beginPath();
  ctx.ellipse(footX, footY, scale * 6, scale * 1.4, 0, 0, Math.PI * 2);
  ctx.fill();
  paintFriend(ctx, footX - 8 * scale, footY - 16 * scale, scale, rows, worn, restRows);
}

export type Snack = {
  readonly name: string;
  readonly price: bigint;
  readonly color: string;
  readonly kind: "burger" | "dog" | "fries" | "nachos" | "pretzel" | "popcorn" | "soda" | "coffee";
};

const SNACK_RF = 10n ** 18n;

export const SNACKS: readonly Snack[] = [
  { name: "Burger", price: 3n * SNACK_RF, color: "#c47a3a", kind: "burger" },
  { name: "Hot dog", price: 2n * SNACK_RF, color: "#e23b6a", kind: "dog" },
  { name: "Fries", price: 2n * SNACK_RF, color: "#e6c36a", kind: "fries" },
  { name: "Nachos", price: 3n * SNACK_RF, color: "#ff7a1a", kind: "nachos" },
  { name: "Pretzel", price: 2n * SNACK_RF, color: "#c47a3a", kind: "pretzel" },
  { name: "Popcorn", price: 2n * SNACK_RF, color: "#f4ecdf", kind: "popcorn" },
  { name: "Soda", price: SNACK_RF, color: "#39f2e4", kind: "soda" },
  { name: "Coffee", price: SNACK_RF, color: "#6b3a22", kind: "coffee" },
];

let snackImage: HTMLImageElement | null = null;

function snackArt() {
  if (!snackImage && typeof Image !== "undefined") {
    snackImage = new Image();
    snackImage.src = snackUrl;
  }
  return snackImage && snackImage.complete && snackImage.naturalWidth > 0 ? snackImage : null;
}

function paintSnackIcon(ctx: CanvasRenderingContext2D, kind: Snack["kind"], size: number) {
  const s = size;
  if (kind === "burger") {
    ctx.fillStyle = "#e6c36a";
    ctx.fillRect(-s, -s * 0.2, s * 2, s * 0.45);
    ctx.fillStyle = "#6b3a22";
    ctx.fillRect(-s * 0.85, -s * 0.05, s * 1.7, s * 0.28);
    ctx.fillStyle = "#3f8f4a";
    ctx.fillRect(-s * 0.7, s * 0.12, s * 1.4, s * 0.12);
    ctx.fillStyle = "#f4ecdf";
    ctx.fillRect(-s, s * 0.22, s * 2, s * 0.4);
  } else if (kind === "dog") {
    ctx.fillStyle = "#f4ecdf";
    ctx.fillRect(-s * 1.1, -s * 0.2, s * 2.2, s * 0.55);
    ctx.fillStyle = "#e23b6a";
    ctx.fillRect(-s, -s * 0.08, s * 2, s * 0.28);
  } else if (kind === "fries") {
    ctx.fillStyle = "#c23b4a";
    ctx.fillRect(-s * 0.7, -s * 0.1, s * 1.4, s * 1.1);
    ctx.fillStyle = "#e6c36a";
    ctx.fillRect(-s * 0.45, -s * 0.9, s * 0.2, s * 0.9);
    ctx.fillRect(-s * 0.1, -s, s * 0.2, s);
    ctx.fillRect(s * 0.25, -s * 0.8, s * 0.2, s * 0.8);
  } else if (kind === "nachos") {
    ctx.fillStyle = "#e6c36a";
    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.lineTo(s, s * 0.7);
    ctx.lineTo(-s, s * 0.7);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#ff7a1a";
    ctx.fillRect(-s * 0.2, -s * 0.1, s * 0.35, s * 0.25);
  } else if (kind === "pretzel") {
    ctx.strokeStyle = "#c47a3a";
    ctx.lineWidth = s * 0.35;
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.7, 0, Math.PI * 2);
    ctx.stroke();
  } else if (kind === "popcorn") {
    ctx.fillStyle = "#ff2bd6";
    ctx.fillRect(-s * 0.7, -s * 0.1, s * 1.4, s);
    ctx.fillStyle = "#f4ecdf";
    ctx.beginPath();
    ctx.arc(-s * 0.3, -s * 0.3, s * 0.28, 0, Math.PI * 2);
    ctx.arc(s * 0.15, -s * 0.45, s * 0.3, 0, Math.PI * 2);
    ctx.arc(s * 0.35, -s * 0.15, s * 0.24, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === "soda") {
    ctx.fillStyle = "#39f2e4";
    ctx.fillRect(-s * 0.45, -s * 0.2, s * 0.9, s * 1.2);
    ctx.fillStyle = "#ff2bd6";
    ctx.fillRect(-s * 0.15, -s * 0.7, s * 0.3, s * 0.5);
  } else {
    ctx.fillStyle = "#f4ecdf";
    ctx.fillRect(-s * 0.5, -s * 0.15, s, s * 0.9);
    ctx.fillStyle = "#6b3a22";
    ctx.fillRect(-s * 0.35, -s * 0.05, s * 0.7, s * 0.55);
    ctx.strokeStyle = "#f4ecdf";
    ctx.lineWidth = s * 0.12;
    ctx.beginPath();
    ctx.arc(s * 0.45, -s * 0.35, s * 0.28, 0, Math.PI);
    ctx.stroke();
  }
}

export function paintSnack(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  snack: Snack | null,
  zoom: number,
) {
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, width, height);
  const aspect = 1500 / 2235;
  let w = width * 0.96;
  let h = w / aspect;
  if (h > height * 0.94) {
    h = height * 0.94;
    w = h * aspect;
  }
  const x = (width - w) / 2;
  const y = (height - h) / 2;
  const art = snackArt();
  if (art) {
    const smoothing = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(art, x, y, w, h);
    ctx.imageSmoothingEnabled = smoothing;
  }
  if (!snack || zoom <= 0.02) return;
  ctx.fillStyle = `rgba(0,0,0,${0.62 * zoom})`;
  ctx.fillRect(0, 0, width, height);
  const grow = 0.4 + zoom * 2.4;
  ctx.save();
  ctx.translate(width / 2, height * 0.4);
  ctx.scale(grow, grow);
  paintSnackIcon(ctx, snack.kind, Math.max(18, Math.round(height * 0.04)));
  ctx.restore();
  ctx.globalAlpha = zoom;
  ctx.fillStyle = "#f4ecdf";
  ctx.font = `700 ${Math.max(22, Math.round(height * 0.06))}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(snack.name, width / 2, height * 0.68);
  ctx.globalAlpha = 1;
}

export type Ball = {
  readonly name: string;
  readonly price: bigint;
  readonly color: string;
  readonly stripe: string;
};

const BALL_RF = 10n ** 18n;
const BALL_WEEK = 7 * 24 * 60 * 60 * 1000;

export const BALLS: readonly Ball[] = [
  { name: "House ball", price: 0n, color: "#141018", stripe: "#f4ecdf" },
  { name: "Magenta comet", price: BALL_RF, color: "#ff2bd6", stripe: "#f4ecdf" },
  { name: "Cyan spare", price: 2n * BALL_RF, color: "#39f2e4", stripe: "#141018" },
  { name: "Gold strike", price: 3n * BALL_RF, color: "#e6c36a", stripe: "#ff2bd6" },
  { name: "Midnight swirl", price: 5n * BALL_RF, color: "#141018", stripe: "#39f2e4" },
];

const RARE_BALLS: readonly Ball[] = [
  { name: "Disco ball", price: 8n * BALL_RF, color: "#7a3cff", stripe: "#39f2e4" },
  { name: "Lightning", price: 8n * BALL_RF, color: "#e6c36a", stripe: "#ff2bd6" },
  { name: "Tiger", price: 9n * BALL_RF, color: "#ff7a1a", stripe: "#141018" },
  { name: "Velvet night", price: 8n * BALL_RF, color: "#4a1468", stripe: "#ff2bd6" },
  { name: "Neon swirl", price: 10n * BALL_RF, color: "#39f2e4", stripe: "#e6c36a" },
];

export function weeklyRareBall(now = Date.now()): Ball & { readonly id: number } {
  const index = Math.floor(now / BALL_WEEK) % RARE_BALLS.length;
  const ball = RARE_BALLS[index] ?? RARE_BALLS[0];
  return { ...ball, id: 400 + index };
}

export function ballById(id: number): Ball {
  if (id >= 400) return RARE_BALLS[id - 400] ?? BALLS[0];
  return BALLS[id] ?? BALLS[0];
}

let laneImage: HTMLImageElement | null = null;

function laneArt() {
  if (!laneImage && typeof Image !== "undefined") {
    laneImage = new Image();
    laneImage.src = laneUrl;
  }
  return laneImage && laneImage.complete && laneImage.naturalWidth > 0 ? laneImage : null;
}

function laneLayout(width: number, height: number) {
  const aspect = 1500 / 2230;
  let w = width * 0.98;
  let h = w / aspect;
  if (h > height * 0.96) {
    h = height * 0.96;
    w = h * aspect;
  }
  const zoom = 1.15;
  w *= zoom;
  h *= zoom;
  return { x: (width - w) / 2, y: (height - h) / 2, w, h };
}

export function lanePoint(width: number, height: number, x: number, y: number): { nx: number; ny: number } | null {
  const layout = laneLayout(width, height);
  const nx = (x - layout.x) / layout.w;
  const ny = (y - layout.y) / layout.h;
  if (nx < 0.08 || nx > 0.92 || ny < 0.08 || ny > 0.72) return null;
  return { nx, ny };
}

function paintBall(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, ball: Ball) {
  ctx.fillStyle = ball.color;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = ball.stripe;
  ctx.lineWidth = Math.max(1, radius * 0.28);
  ctx.beginPath();
  ctx.arc(x, y, radius * 0.45, 0.4, Math.PI - 0.2);
  ctx.stroke();
  ctx.fillStyle = "#f4ecdf";
  ctx.beginPath();
  ctx.arc(x - radius * 0.15, y - radius * 0.1, Math.max(1, radius * 0.22), 0, Math.PI * 2);
  ctx.fill();
}

export type BowlFrame = { rolls: number[] };

function frameClosed(frame: BowlFrame, index: number) {
  const first = frame.rolls[0] ?? 0;
  const second = frame.rolls[1] ?? 0;
  if (index < 9) return first === 10 || frame.rolls.length >= 2;
  if (first === 10 || first + second === 10) return frame.rolls.length >= 3;
  return frame.rolls.length >= 2;
}

export function bowlDone(frames: readonly BowlFrame[]) {
  return frames.length >= 10 && frameClosed(frames[9] ?? { rolls: [] }, 9);
}

export function addBowlRoll(frames: readonly BowlFrame[], knocked: number): BowlFrame[] {
  const next = frames.map((frame) => ({ rolls: [...frame.rolls] }));
  const pins = Math.max(0, Math.min(10, knocked));
  if (bowlDone(next)) return [{ rolls: [pins] }];
  const index = next.length - 1;
  const frame = index >= 0 ? next[index] : undefined;
  if (!frame || frameClosed(frame, index)) {
    next.push({ rolls: [pins] });
    return next;
  }
  const first = frame.rolls[0] ?? 0;
  if (index < 9) {
    frame.rolls.push(Math.min(10 - first, pins));
    return next;
  }
  if (frame.rolls.length === 1) {
    frame.rolls.push(first === 10 ? pins : Math.min(10 - first, pins));
    return next;
  }
  const second = frame.rolls[1] ?? 0;
  if (first === 10 && second < 10) frame.rolls.push(Math.min(10 - second, pins));
  else frame.rolls.push(pins);
  return next;
}

export function bowlCard(frames: readonly BowlFrame[]) {
  const marks: string[][] = [];
  const totals: (number | null)[] = [];
  let running = 0;
  for (let index = 0; index < 10; index += 1) {
    const frame = frames[index];
    const rolls = frame?.rolls ?? [];
    const next = frames[index + 1]?.rolls ?? [];
    const after = frames[index + 2]?.rolls ?? [];
    if (index < 9) {
      if (rolls[0] === 10) marks.push(["", "X"]);
      else if (rolls.length >= 2 && (rolls[0] ?? 0) + (rolls[1] ?? 0) === 10) marks.push([rolls[0] === 0 ? "-" : String(rolls[0]), "/"]);
      else marks.push(rolls.map((roll) => (roll === 0 ? "-" : String(roll))));
      if (rolls[0] === 10) {
        const bonusA = next[0];
        const bonusB = next.length > 1 ? next[1] : after[0];
        if (bonusA === undefined || bonusB === undefined) totals.push(null);
        else {
          running += 10 + bonusA + bonusB;
          totals.push(running);
        }
      } else if (rolls.length < 2) totals.push(null);
      else if ((rolls[0] ?? 0) + (rolls[1] ?? 0) === 10) {
        if (next[0] === undefined) totals.push(null);
        else {
          running += 10 + next[0];
          totals.push(running);
        }
      } else {
        running += (rolls[0] ?? 0) + (rolls[1] ?? 0);
        totals.push(running);
      }
    } else {
      const shown = rolls.map((roll, rollIndex) => {
        const prev = rollIndex === 0 ? 0 : (rolls[rollIndex - 1] ?? 0);
        const fresh = rollIndex === 0 || rolls[0] === 10 || (rollIndex === 2 && (rolls[0] === 10 ? prev === 10 : (rolls[0] ?? 0) + prev === 10));
        if (!fresh && rollIndex > 0 && prev + roll === 10) return "/";
        if (roll === 10) return "X";
        return roll === 0 ? "-" : String(roll);
      });
      marks.push(shown);
      const first = rolls[0] ?? 0;
      const second = rolls[1] ?? 0;
      if (rolls.length === 0) totals.push(null);
      else if ((first === 10 || first + second === 10) && rolls.length < 3) totals.push(null);
      else if (first !== 10 && first + second !== 10 && rolls.length < 2) totals.push(null);
      else {
        running += rolls.reduce((sum, roll) => sum + roll, 0);
        totals.push(running);
      }
    }
  }
  const last = [...totals].reverse().find((total) => total !== null) ?? 0;
  return { marks, totals, total: last, done: bowlDone(frames) };
}

function paintScoreboard(ctx: CanvasRenderingContext2D, width: number, frames: readonly BowlFrame[]) {
  const card = bowlCard(frames);
  const cell = Math.min(46, (width - 16) / 10);
  const left = (width - cell * 10) / 2;
  const top = 8;
  ctx.fillStyle = "rgba(8,4,14,0.82)";
  ctx.fillRect(left - 4, top - 2, cell * 10 + 8, 36);
  ctx.font = "10px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (let index = 0; index < 10; index += 1) {
    const x = left + index * cell;
    ctx.strokeStyle = "#39f2e4";
    ctx.strokeRect(x, top, cell, 34);
    ctx.fillStyle = "#f4ecdf";
    ctx.fillText((card.marks[index] ?? []).join(" "), x + cell / 2, top + 10);
    const total = card.totals[index];
    ctx.fillStyle = "#e6c36a";
    if (total !== null) ctx.fillText(String(total), x + cell / 2, top + 24);
  }
}

export function pinsForAim(aim: number) {
  const miss = Math.abs(aim);
  if (miss < 0.16) return 10;
  if (miss < 0.34) return 7;
  if (miss < 0.55) return 4;
  if (miss < 0.78) return 2;
  return 0;
}

const RACK = [
  { x: 0, y: -0.028 },
  { x: -0.02, y: -0.01 },
  { x: 0.02, y: -0.01 },
  { x: -0.04, y: 0.008 },
  { x: 0, y: 0.008 },
  { x: 0.04, y: 0.008 },
  { x: -0.06, y: 0.026 },
  { x: -0.02, y: 0.026 },
  { x: 0.02, y: 0.026 },
  { x: 0.06, y: 0.026 },
] as const;

function paintPin(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, fallen: boolean) {
  ctx.save();
  ctx.translate(x, y);
  if (fallen) ctx.rotate(1.15);
  ctx.fillStyle = "#f4f0ea";
  ctx.fillRect(-w * 0.012, -h * 0.016, w * 0.024, h * 0.028);
  ctx.fillStyle = "#e23b6a";
  ctx.fillRect(-w * 0.012, -h * 0.004, w * 0.024, h * 0.006);
  ctx.restore();
}

export function paintLane(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  rows: readonly string[] | null,
  worn: readonly Look[],
  ball: Ball,
  roll = 0,
  aim = 0,
  frames: readonly BowlFrame[] = [],
  reveal = 0,
  restRows?: readonly string[] | null,
) {
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, width, height);
  const layout = laneLayout(width, height);
  const { x, y, w, h } = layout;
  const art = laneArt();
  if (art) {
    const smoothing = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(art, x, y, w, h);
    ctx.imageSmoothingEnabled = smoothing;
  }
  const pinsX = x + w * 0.252;
  const pinsY = y + h * 0.189;
  const knocked = roll > 0.88 ? pinsForAim(aim) : 0;
  if (knocked > 0 && art) {
    ctx.drawImage(art, 520, 860, 260, 140, x + w * 0.12, y + h * 0.125, w * 0.28, h * 0.13);
    const impact = aim * 0.07;
    const order = RACK.map((pin, index) => ({ index, dist: Math.abs(pin.x - impact) })).sort((a, b) => a.dist - b.dist);
    const down = new Set(order.slice(0, knocked).map((pin) => pin.index));
    RACK.forEach((pin, index) => {
      paintPin(ctx, pinsX + pin.x * w, pinsY + pin.y * h, w, h, down.has(index));
    });
  }
  if (!rows) return;
  const scale = Math.max(2, Math.round((h * 0.09) / 16));
  const footX = x + w * 0.58;
  const footY = y + h * 0.78;
  ctx.fillStyle = "rgba(0,0,0,0.4)";
  ctx.beginPath();
  ctx.ellipse(footX, footY, scale * 6, scale * 1.4, 0, 0, Math.PI * 2);
  ctx.fill();
  paintFriend(ctx, footX - 8 * scale, footY - 16 * scale, scale, rows, worn, restRows);
  const radius = Math.max(5, scale * 2.4) * (1 - Math.min(1, roll) * 0.5);
  const startX = footX - scale * 2;
  const startY = footY - scale * 10;
  const eased = roll * roll * (3 - 2 * roll);
  const endX = pinsX + aim * w * 0.07;
  const endY = pinsY + h * 0.02;
  paintBall(ctx, startX + (endX - startX) * eased, startY + (endY - startY) * eased, Math.max(3, radius), ball);
  if (knocked > 0 && reveal >= 790 && reveal < 2790) {
    const zoomT = Math.min(1, Math.max(0, (reveal - 790) / 120));
    const fade = reveal > 2390 ? Math.max(0, 1 - (reveal - 2390) / 400) : 1;
    const easedZoom = zoomT * zoomT * (3 - 2 * zoomT) * fade;
    ctx.fillStyle = `rgba(0,0,0,${0.62 * easedZoom})`;
    ctx.fillRect(0, 0, width, height);
    const impact = aim * 0.07;
    const order = RACK.map((pin, index) => ({ index, dist: Math.abs(pin.x - impact) })).sort((a, b) => a.dist - b.dist);
    const down = new Set(order.slice(0, knocked).map((pin) => pin.index));
    const grow = 1 + easedZoom * 2.8;
    ctx.save();
    ctx.translate(width / 2, height * 0.36);
    ctx.scale(grow, grow);
    RACK.forEach((pin, index) => {
      paintPin(ctx, pin.x * w, pin.y * h, w, h, down.has(index));
    });
    ctx.restore();
    ctx.globalAlpha = easedZoom;
    ctx.fillStyle = knocked === 10 ? "#e6c36a" : "#f4ecdf";
    ctx.font = `700 ${Math.max(28, Math.round(height * 0.16))}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(knocked === 10 ? "STRIKE" : String(knocked), width / 2, height * 0.68);
    if (knocked !== 10) {
      ctx.font = `${Math.max(14, Math.round(height * 0.04))}px sans-serif`;
      ctx.fillText("pins down", width / 2, height * 0.78);
    }
    ctx.globalAlpha = 1;
  } else if (knocked === 0 && reveal >= 900 && reveal < 2900) {
    ctx.fillStyle = "#f4ecdf";
    ctx.font = `${Math.max(16, Math.round(h * 0.04))}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("GUTTER", x + w * 0.26, y + h * 0.12);
  }
  paintScoreboard(ctx, width, frames);
}

export function paintStage(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  rows: readonly string[],
  worn: readonly Look[],
  place: { nx: number; ny: number },
  walking: boolean,
  reducedMotion: boolean,
  time: number,
  restRows?: readonly string[] | null,
  zoom = 0,
) {
  const layout = wardrobeLayout(width, height);
  const art = wardrobeArt();
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, width, height);
  if (art) {
    const smoothing = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(art, layout.x, layout.y, layout.w, layout.h);
    ctx.imageSmoothingEnabled = smoothing;
  }
  const friendScale = Math.max(1, Math.round((layout.h * 0.069) / 16));
  const bob = walking && !reducedMotion && zoom <= 0 ? Math.round(Math.sin(time / 140) * friendScale * 0.6) : 0;
  const big = Math.max(friendScale + 1, Math.round(Math.min(width, height) / 51));
  const eased = zoom * zoom * (3 - 2 * zoom);
  const scale = friendScale + (big - friendScale) * eased;
  const focusX = width / 2;
  const focusY = height * 0.58;
  const footX = layout.x + place.nx * layout.w + (focusX - (layout.x + place.nx * layout.w)) * eased;
  const footY = layout.y + place.ny * layout.h + (focusY - (layout.y + place.ny * layout.h)) * eased;
  if (eased > 0.04) {
    ctx.fillStyle = `rgba(8,4,14,${0.5 * eased})`;
    ctx.fillRect(0, 0, width, height);
  }
  ctx.fillStyle = "rgba(0,0,0,0.4)";
  ctx.beginPath();
  ctx.ellipse(footX, footY + bob, 6 * scale, 1.4 * scale, 0, 0, Math.PI * 2);
  ctx.fill();
  paintFriend(ctx, footX - 8 * scale, footY - 16 * scale + bob, scale, rows, worn, restRows);
}

export function paintSign(ctx: CanvasRenderingContext2D, text: string, cx: number, cy: number, roomH: number, scale = 1) {
  const fontSize = Math.max(9, Math.round(roomH * 0.046 * scale));
  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.font = `400 ${fontSize}px "Avenir Next", "Gill Sans", "Trebuchet MS", sans-serif`;
  const spaced = ctx as CanvasRenderingContext2D & { letterSpacing?: string };
  spaced.letterSpacing = `${Math.round(fontSize * 0.12)}px`;
  const textW = ctx.measureText(text).width;
  const padX = fontSize * 0.85;
  const padY = fontSize * 0.42;
  const w = textW + padX * 2;
  const h = fontSize + padY * 2;
  const x = cx - w / 2;
  const y = cy;
  const shadow = Math.max(scale < 1 ? 4 : 7, Math.round(fontSize * 0.34));
  const border = Math.max(scale < 1 ? 2 : 3, Math.round(fontSize * 0.09));
  ctx.fillStyle = "#111111";
  ctx.fillRect(x + shadow, y + shadow, w, h);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = "#111111";
  ctx.lineWidth = border;
  ctx.strokeRect(x + border / 2, y + border / 2, w - border, h - border);
  ctx.fillStyle = "#111111";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, cx, y + h / 2);
  ctx.restore();
}
