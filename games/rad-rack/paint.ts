import type { Look, LookPixel } from "./looks";
import doorClosedUrl from "./art/door-closed.png";
import doorOpenUrl from "./art/door-open.png";
import wardrobeUrl from "./art/wardrobe-color.png";

let wardrobeImage: HTMLImageElement | null = null;

function wardrobeArt() {
  if (!wardrobeImage && typeof Image !== "undefined") {
    wardrobeImage = new Image();
    wardrobeImage.src = wardrobeUrl;
  }
  return wardrobeImage && wardrobeImage.complete && wardrobeImage.naturalWidth > 0 ? wardrobeImage : null;
}

export const WARDROBE_CLOSET = { x: 0.54, y: 0.0, w: 0.3, h: 0.48 };
export const WARDROBE_CURTAIN = { x: 0.12, y: 0.05, w: 0.22, h: 0.36 };
export const WARDROBE_DESK = { x: 0.42, y: 0.72, w: 0.18, h: 0.16 };

export function wardrobeHit(
  width: number,
  height: number,
  x: number,
  y: number,
): "closet" | "curtain" | "desk" | { nx: number; ny: number } | null {
  const layout = wardrobeLayout(width, height);
  const nx = (x - layout.x) / layout.w;
  const ny = (y - layout.y) / layout.h;
  if (nx < 0 || ny < 0 || nx > 1 || ny > 1) return null;
  if (inside(WARDROBE_CLOSET, nx, ny)) return "closet";
  if (inside(WARDROBE_CURTAIN, nx, ny)) return "curtain";
  if (inside(WARDROBE_DESK, nx, ny)) return "desk";
  return {
    nx: Math.min(0.78, Math.max(0.18, nx)),
    ny: Math.min(0.82, Math.max(0.56, ny)),
  };
}

function inside(zone: { x: number; y: number; w: number; h: number }, nx: number, ny: number) {
  return nx >= zone.x && ny >= zone.y && nx <= zone.x + zone.w && ny <= zone.y + zone.h;
}

function wardrobeLayout(width: number, height: number) {
  const aspect = 1420 / 1140;
  let w = width * 0.98;
  let h = w / aspect;
  if (h > height * 0.96) {
    h = height * 0.96;
    w = h * aspect;
  }
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
  paintSign(ctx, "Rink", layout.x + layout.w * 0.22, layout.y + layout.h * 0.05, layout.h);
  paintSign(ctx, "Dance", layout.x + layout.w * 0.68, layout.y + layout.h * -0.02, layout.h);
  paintSign(ctx, "Yours", layout.x + layout.w * 0.52, layout.y + layout.h * 0.82, layout.h, 0.62);
  const friendScale = Math.max(2, Math.round((layout.h * 0.16) / 16));
  const bob = walking && !reducedMotion && zoom <= 0 ? Math.round(Math.sin(time / 140) * friendScale * 0.6) : 0;
  const big = Math.max(friendScale + 2, Math.round(Math.min(width, height) / 32));
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
  const fontSize = Math.max(11, Math.round(roomH * 0.055 * scale));
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
