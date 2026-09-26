export const FACE = { U: 0, R: 1, F: 2, D: 3, L: 4, B: 5 } as const;

export const CUBE_COLORS = ["#f4f4f4", "#e23b3b", "#2f9e3a", "#f2d23a", "#f28a1a", "#2f5bd6"] as const;

export type Cube = number[][];

export function freshCube(): Cube {
  return [0, 1, 2, 3, 4, 5].map((color) => Array(9).fill(color));
}

export function cloneCube(cube: Cube): Cube {
  return cube.map((face) => face.slice());
}

function rot(face: number[], cw: boolean) {
  const next = face.slice();
  const map = cw ? [6, 3, 0, 7, 4, 1, 8, 5, 2] : [2, 5, 8, 1, 4, 7, 0, 3, 6];
  for (let index = 0; index < 9; index += 1) face[index] = next[map[index]] ?? face[index];
}

function cycle(cube: Cube, strips: readonly (readonly [number, number, number, number])[], cw: boolean) {
  const saved = strips.map(([face, a, b, c]) => [cube[face]?.[a], cube[face]?.[b], cube[face]?.[c]]);
  strips.forEach((strip, index) => {
    const from = saved[cw ? (index + 3) % 4 : (index + 1) % 4];
    const [face, a, b, c] = strip;
    const row = cube[face];
    if (!row || !from) return;
    row[a] = from[0] ?? row[a];
    row[b] = from[1] ?? row[b];
    row[c] = from[2] ?? row[c];
  });
}

export function turnCube(cube: Cube, face: number, cw = true) {
  const row = cube[face];
  if (!row) return;
  rot(row, cw);
  const { U, R, F, D, L, B } = FACE;
  if (face === U) cycle(cube, [[F, 0, 1, 2], [R, 0, 1, 2], [B, 0, 1, 2], [L, 0, 1, 2]], cw);
  else if (face === D) cycle(cube, [[F, 6, 7, 8], [R, 6, 7, 8], [B, 6, 7, 8], [L, 6, 7, 8]], !cw);
  else if (face === R) cycle(cube, [[U, 2, 5, 8], [F, 2, 5, 8], [D, 2, 5, 8], [B, 6, 3, 0]], cw);
  else if (face === L) cycle(cube, [[U, 0, 3, 6], [B, 8, 5, 2], [D, 0, 3, 6], [F, 0, 3, 6]], cw);
  else if (face === F) cycle(cube, [[U, 6, 7, 8], [R, 0, 3, 6], [D, 2, 1, 0], [L, 8, 5, 2]], cw);
  else if (face === B) cycle(cube, [[U, 2, 1, 0], [L, 0, 3, 6], [D, 6, 7, 8], [R, 8, 5, 2]], cw);
}

export function solvedCube(cube: Cube) {
  return cube.every((face) => face.every((sticker) => sticker === face[0]));
}

export function yawCube(cube: Cube) {
  const { U, R, F, D, L, B } = FACE;
  const front = cube[F]?.slice() ?? [];
  const right = cube[R]?.slice() ?? [];
  const back = cube[B]?.slice() ?? [];
  const left = cube[L]?.slice() ?? [];
  cube[R] = front;
  cube[B] = right;
  cube[L] = back;
  cube[F] = left;
  const up = cube[U];
  const down = cube[D];
  if (up) rot(up, true);
  if (down) rot(down, false);
}

export function scrambleCube(cube: Cube, turns = 8) {
  let last = -1;
  for (let count = 0; count < turns; count += 1) {
    let face = Math.floor(Math.random() * 6);
    if (face === last) face = (face + 1) % 6;
    last = face;
    turnCube(cube, face, Math.random() > 0.5);
  }
  if (solvedCube(cube)) turnCube(cube, FACE.R, true);
}
