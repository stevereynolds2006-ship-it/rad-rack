import { useEffect, useRef, useState } from "react";
import { paintFriend } from "./paint";
import type { Look } from "./looks";
import type { GameplaySfx } from "./sfx";

const COLS = 8;
const ROWS = 4;
const COLORS = ["#ff2bd6", "#39f2e4", "#e6c36a", "#f4ecdf"];

export function ArcadePlay({
  sfx,
  onClose,
  onDie,
}: {
  sfx: { current: GameplaySfx };
  onClose: () => void;
  onDie: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dieRef = useRef(onDie);
  dieRef.current = onDie;
  const [score, setScore] = useState(0);
  const [note, setNote] = useState("Drag to move. Tap to serve.");

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const width = 240;
    const height = 280;
    canvas.width = width;
    canvas.height = height;
    const paddle = { x: width / 2, w: 42 };
    const ball = { x: width / 2, y: height - 36, vx: 70, vy: -120, live: false };
    const bricks = Array.from({ length: ROWS * COLS }, (_, index) => ({
      alive: true,
      color: COLORS[Math.floor(index / COLS) % COLORS.length] ?? "#f4ecdf",
    }));
    let points = 0;
    let last = 0;
    let frame = 0;
    let dead = false;

    const brickBox = (index: number) => {
      const col = index % COLS;
      const row = Math.floor(index / COLS);
      const w = 26;
      const h = 10;
      return { x: 12 + col * 28, y: 28 + row * 14, w, h };
    };

    const movePaddle = (clientX: number) => {
      const rect = canvas.getBoundingClientRect();
      const nx = (clientX - rect.left) / rect.width;
      paddle.x = Math.min(width - paddle.w / 2, Math.max(paddle.w / 2, nx * width));
    };

    const onPointer = (event: PointerEvent) => {
      movePaddle(event.clientX);
      if (!ball.live && !dead) {
        ball.live = true;
        ball.vx = event.clientX < canvas.getBoundingClientRect().left + canvas.getBoundingClientRect().width / 2 ? -80 : 80;
        ball.vy = -130;
        sfx.current.play("serve");
        setNote("Clear the rack");
      }
    };
    canvas.addEventListener("pointerdown", onPointer);
    canvas.addEventListener("pointermove", onPointer);

    const tick = (now: number) => {
      const dt = Math.min(0.033, last ? (now - last) / 1000 : 0);
      last = now;
      if (ball.live) {
        ball.x += ball.vx * dt;
        ball.y += ball.vy * dt;
        if (ball.x < 4 || ball.x > width - 4) ball.vx *= -1;
        if (ball.y < 4) ball.vy *= -1;
        const paddleTop = height - 22;
        if (ball.y > paddleTop && ball.y < paddleTop + 10 && Math.abs(ball.x - paddle.x) < paddle.w / 2 + 4 && ball.vy > 0) {
          ball.vy = -Math.abs(ball.vy);
          ball.vx += (ball.x - paddle.x) * 3;
          ball.vx = Math.max(-160, Math.min(160, ball.vx));
          sfx.current.play("hit");
        }
        bricks.forEach((brick, index) => {
          if (!brick.alive) return;
          const box = brickBox(index);
          if (ball.x > box.x && ball.x < box.x + box.w && ball.y > box.y && ball.y < box.y + box.h) {
            brick.alive = false;
            ball.vy *= -1;
            points += 10;
            sfx.current.play("break");
            setScore(points);
          }
        });
        if (bricks.every((brick) => !brick.alive)) {
          ball.live = false;
          dead = true;
          sfx.current.play("win");
          setNote("You cleared the rack");
        } else if (ball.y > height) {
          ball.live = false;
          dead = true;
          sfx.current.play("drop");
          setNote("Dropped");
          dieRef.current();
        }
      } else {
        ball.x = paddle.x;
      }
      ctx.fillStyle = "#07060c";
      ctx.fillRect(0, 0, width, height);
      bricks.forEach((brick, index) => {
        if (!brick.alive) return;
        const box = brickBox(index);
        ctx.fillStyle = brick.color;
        ctx.fillRect(box.x, box.y, box.w, box.h);
      });
      ctx.fillStyle = "#f4ecdf";
      ctx.fillRect(paddle.x - paddle.w / 2, height - 18, paddle.w, 6);
      ctx.fillStyle = "#39f2e4";
      ctx.fillRect(ball.x - 3, ball.y - 3, 6, 6);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      canvas.removeEventListener("pointerdown", onPointer);
      canvas.removeEventListener("pointermove", onPointer);
    };
  }, []);

  return (
    <div className="rad-arcade" onPointerDown={(event) => event.stopPropagation()}>
      <p className="rad-arcade-title">
        Rad Break <span>{score}</span>
      </p>
      <canvas ref={canvasRef} className="rad-arcade-screen" />
      <p className="rad-arcade-note">{note}</p>
      <button type="button" onClick={onClose}>
        Leave machine
      </button>
    </div>
  );
}

const MAZES = [
  [
    "###############",
    "#.............#",
    "#.###.###.###.#",
    "#.#.........#.#",
    "#.#.##...##.#.#",
    "#.............#",
    "#.###.#.#.###.#",
    "#.....#.#.....#",
    "#.###.#.#.###.#",
    "#.............#",
    "#.###.###.###.#",
    "#.............#",
    "###############",
  ],
  [
    "###############",
    "#.#.#.#.#.#.#.#",
    "#.#.#.#.#.#.#.#",
    "#.............#",
    "###.#.#.#.#.###",
    "#...#.#.#.#...#",
    "#.#.#.#.#.#.#.#",
    "#.#.........#.#",
    "#.#.#.#.#.#.#.#",
    "#...#.....#...#",
    "###.#.#.#.#.###",
    "#.............#",
    "###############",
  ],
];

const MAZE_DIRS = [
  { x: 1, y: 0 },
  { x: 0, y: 1 },
  { x: -1, y: 0 },
  { x: 0, y: -1 },
];

export function MazePlay({
  sfx,
  onClose,
  onDie,
  rows,
  worn,
}: {
  sfx: { current: GameplaySfx };
  onClose: () => void;
  onDie: () => void;
  rows: readonly string[] | null;
  worn: readonly Look[];
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dieRef = useRef(onDie);
  dieRef.current = onDie;
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(2);
  const [level, setLevel] = useState(1);
  const [note, setNote] = useState("Big dots power you up. Swipe to turn.");

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const cols = MAZES[0]?.[0]?.length ?? 15;
    const rowCount = MAZES[0]?.length ?? 13;
    const cell = 22;
    const width = cols * cell;
    const height = rowCount * cell;
    canvas.width = width;
    canvas.height = height;
    let map = MAZES[0] ?? [];
    let levelNow = 1;
    let ghostWait = 420;
    const open = (x: number, y: number) => map[y]?.[x] === ".";
    const dots = new Set<string>();
    const powers = new Set<string>();
    const fillDots = () => {
      dots.clear();
      powers.clear();
      map.forEach((row, y) => {
        [...row].forEach((cellChar, x) => {
          if (cellChar === ".") dots.add(`${x},${y}`);
        });
      });
      ["1,1", "13,1", "1,11", "13,11"].forEach((key) => {
        if (dots.delete(key)) powers.add(key);
      });
    };
    fillDots();
    const player = { x: 7, y: 11, dir: 0, next: 0 };
    const ghosts: { x: number; y: number; dir: number; color: string; homeX: number; homeY: number; eyesUntil: number }[] = [];
    let points = 0;
    let livesLeft = 2;
    let dead = false;
    let won = false;
    let stepAt = 0;
    let ghostAt = 0;
    let safeUntil = 0;
    let powerUntil = 0;
    let chain = 0;
    let frame = 0;
    let dragX = 0;
    let dragY = 0;

    const homeGhosts = () => {
      const spots = levelNow === 1
        ? [
            { x: 6, y: 5, dir: 0, color: "#ff2bd6", homeX: 6, homeY: 5, eyesUntil: 0 },
            { x: 7, y: 5, dir: 2, color: "#39f2e4", homeX: 7, homeY: 5, eyesUntil: 0 },
            { x: 8, y: 5, dir: 1, color: "#e6c36a", homeX: 8, homeY: 5, eyesUntil: 0 },
          ]
        : [
            { x: 5, y: 7, dir: 0, color: "#ff2bd6", homeX: 5, homeY: 7, eyesUntil: 0 },
            { x: 7, y: 7, dir: 2, color: "#39f2e4", homeX: 7, homeY: 7, eyesUntil: 0 },
            { x: 9, y: 7, dir: 1, color: "#e6c36a", homeX: 9, homeY: 7, eyesUntil: 0 },
            { x: 3, y: 7, dir: 0, color: "#ff7a1a", homeX: 3, homeY: 7, eyesUntil: 0 },
          ];
      ghosts.length = 0;
      spots.forEach((spot) => ghosts.push(spot));
    };
    homeGhosts();

    const clearLevel = (now: number) => {
      if (dots.size > 0 || powers.size > 0) return;
      if (levelNow < MAZES.length) {
        levelNow += 1;
        map = MAZES[levelNow - 1] ?? map;
        ghostWait = 240;
        powerUntil = 0;
        fillDots();
        player.x = 7;
        player.y = 11;
        player.dir = 0;
        player.next = 0;
        homeGhosts();
        safeUntil = now + 1200;
        setLevel(levelNow);
        sfx.current.play("win");
        setNote("Level 2. Faster ghosts.");
        return;
      }
      won = true;
      sfx.current.play("win");
      setNote("You cleared the maze");
    };

    const catchPlayer = (now: number) => {
      if (dead || won || now < safeUntil) return;
      const scared = now < powerUntil;
      let ate = false;
      ghosts.forEach((ghost) => {
        if (ghost.x !== player.x || ghost.y !== player.y || now < ghost.eyesUntil) return;
        if (!scared) return;
        chain += 1;
        points += 50 * chain;
        ghost.x = ghost.homeX;
        ghost.y = ghost.homeY;
        ghost.eyesUntil = now + 2200;
        ate = true;
      });
      if (ate) {
        sfx.current.play("hit");
        setScore(points);
        setNote("Ghost munched");
        return;
      }
      if (scared) return;
      if (!ghosts.some((ghost) => ghost.x === player.x && ghost.y === player.y && now >= ghost.eyesUntil)) return;
      livesLeft -= 1;
      setLives(livesLeft);
      sfx.current.play("drop");
      if (livesLeft <= 0) {
        dead = true;
        setNote("Caught");
        dieRef.current();
        return;
      }
      player.x = 7;
      player.y = 11;
      player.dir = 0;
      player.next = 0;
      homeGhosts();
      safeUntil = now + 1400;
      setNote(livesLeft === 1 ? "1 life left" : `${livesLeft} lives left`);
    };

    const onDown = (event: PointerEvent) => {
      dragX = event.clientX;
      dragY = event.clientY;
    };
    const onUp = (event: PointerEvent) => {
      const dx = event.clientX - dragX;
      const dy = event.clientY - dragY;
      if (Math.hypot(dx, dy) < 12) return;
      if (Math.abs(dx) > Math.abs(dy)) player.next = dx > 0 ? 0 : 2;
      else player.next = dy > 0 ? 1 : 3;
    };
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointerup", onUp);

    const tick = (now: number) => {
      if (!dead && !won && now - stepAt > 150) {
        stepAt = now;
        const turn = MAZE_DIRS[player.next];
        const keep = MAZE_DIRS[player.dir];
        if (turn && open(player.x + turn.x, player.y + turn.y)) player.dir = player.next;
        const step = MAZE_DIRS[player.dir] ?? keep;
        if (step && open(player.x + step.x, player.y + step.y)) {
          player.x += step.x;
          player.y += step.y;
          const key = `${player.x},${player.y}`;
          if (powers.delete(key)) {
            powerUntil = now + (levelNow === 1 ? 6500 : 4500);
            chain = 0;
            points += 50;
            sfx.current.play("serve");
            setScore(points);
            setNote("Power up");
            clearLevel(now);
          } else if (dots.delete(key)) {
            points += 10;
            sfx.current.play("break");
            setScore(points);
            clearLevel(now);
          }
        }
        catchPlayer(now);
      }
      if (!dead && !won && now - ghostAt > (now < powerUntil ? ghostWait * 2 : ghostWait)) {
        ghostAt = now;
        const scared = now < powerUntil;
        ghosts.forEach((ghost) => {
          if (now < ghost.eyesUntil) return;
          const choices = MAZE_DIRS.map((dir, index) => ({ dir, index })).filter(
            (choice) => open(ghost.x + choice.dir.x, ghost.y + choice.dir.y) && (choice.index + 2) % 4 !== ghost.dir,
          );
          const options = choices.length > 0 ? choices : MAZE_DIRS.map((dir, index) => ({ dir, index })).filter((choice) => open(ghost.x + choice.dir.x, ghost.y + choice.dir.y));
          const pick = options.sort((a, b) => {
            const da = Math.abs(ghost.x + a.dir.x - player.x) + Math.abs(ghost.y + a.dir.y - player.y);
            const db = Math.abs(ghost.x + b.dir.x - player.x) + Math.abs(ghost.y + b.dir.y - player.y);
            return scared ? db - da : da - db;
          })[0];
          if (pick) {
            ghost.dir = pick.index;
            ghost.x += pick.dir.x;
            ghost.y += pick.dir.y;
          }
        });
        catchPlayer(now);
      }
      ctx.fillStyle = "#07060c";
      ctx.fillRect(0, 0, width, height);
      map.forEach((row, y) => {
        [...row].forEach((cellChar, x) => {
          if (cellChar === "#") {
            ctx.fillStyle = "#2a1a4a";
            ctx.fillRect(x * cell, y * cell, cell, cell);
            ctx.fillStyle = "#7a3cff";
            ctx.fillRect(x * cell + 1, y * cell + 1, cell - 2, 2);
          } else if (powers.has(`${x},${y}`)) {
            ctx.fillStyle = now < powerUntil ? "#39f2e4" : "#ff2bd6";
            ctx.fillRect(x * cell + 4, y * cell + 4, cell - 8, cell - 8);
          } else if (dots.has(`${x},${y}`)) {
            ctx.fillStyle = "#f4ecdf";
            ctx.fillRect(x * cell + 6, y * cell + 6, 2, 2);
          }
        });
      });
      ctx.fillStyle = "#ffe14a";
      if (rows) {
        const scale = Math.max(1, Math.floor((cell - 4) / 16));
        const sprite = 16 * scale;
        paintFriend(
          ctx,
          player.x * cell + (cell - sprite) / 2,
          player.y * cell + (cell - sprite) / 2,
          scale,
          rows,
          worn,
          rows,
        );
      } else {
        ctx.fillRect(player.x * cell + 2, player.y * cell + 2, cell - 4, cell - 4);
      }
      ghosts.forEach((ghost) => {
        if (now < ghost.eyesUntil) return;
        ctx.fillStyle = now < powerUntil ? "#f4ecdf" : ghost.color;
        ctx.fillRect(ghost.x * cell + 2, ghost.y * cell + 2, cell - 4, cell - 4);
      });
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointerup", onUp);
    };
  }, []);

  return (
    <div className="rad-arcade rad-arcade-wide" onPointerDown={(event) => event.stopPropagation()}>
      <p className="rad-arcade-title">
        Dot Run <span>L{level} · {lives} {lives === 1 ? "life" : "lives"} · {score}</span>
      </p>
      <canvas ref={canvasRef} className="rad-arcade-screen" />
      <p className="rad-arcade-note">{note}</p>
      <button type="button" onClick={onClose}>
        Leave machine
      </button>
    </div>
  );
}

const RC_COLORS = ["#ff2bd6", "#39f2e4", "#e6c36a", "#ff7a1a"];

export function RcPlay({
  sfx,
  onClose,
  onDie,
}: {
  sfx: { current: GameplaySfx };
  onClose: () => void;
  onDie: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dieRef = useRef(onDie);
  dieRef.current = onDie;
  const [score, setScore] = useState(0);
  const [note, setNote] = useState("Drag to steer. Three laps.");

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const width = 240;
    const height = 300;
    canvas.width = width;
    canvas.height = height;
    const roadL = 34;
    const roadR = 206;
    let carX = width / 2;
    let aimX = carX;
    let dist = 0;
    let lap = 0;
    let speed = 110;
    let spawnIn = 0.4;
    let dead = false;
    let won = false;
    let last = 0;
    let frame = 0;
    const traffic: { x: number; y: number; color: string }[] = [];

    const aim = (clientX: number) => {
      const rect = canvas.getBoundingClientRect();
      aimX = ((clientX - rect.left) / rect.width) * width;
    };
    const onPointer = (event: PointerEvent) => aim(event.clientX);
    canvas.addEventListener("pointerdown", onPointer);
    canvas.addEventListener("pointermove", onPointer);

    const tick = (now: number) => {
      const dt = Math.min(0.033, last ? (now - last) / 1000 : 0);
      last = now;
      if (!dead && !won) {
        carX += (aimX - carX) * Math.min(1, dt * 7);
        carX = Math.max(roadL + 16, Math.min(roadR - 16, carX));
        dist += speed * dt;
        speed = Math.min(210, 110 + dist * 0.03);
        const nextLap = Math.min(3, Math.floor(dist / 760));
        if (nextLap > lap) {
          lap = nextLap;
          setScore(lap);
          sfx.current.play(lap >= 3 ? "win" : "serve");
          if (lap >= 3) {
            won = true;
            setNote("You finished the mall");
          } else {
            setNote(`Lap ${lap} of 3`);
          }
        }
        spawnIn -= dt;
        if (spawnIn <= 0) {
          const lanes = [58, 96, 134, 172];
          traffic.push({
            x: lanes[Math.floor(Math.random() * lanes.length)] ?? 96,
            y: -36,
            color: RC_COLORS[Math.floor(Math.random() * RC_COLORS.length)] ?? "#ff2bd6",
          });
          spawnIn = Math.max(0.38, 0.95 - dist / 4000);
        }
        traffic.forEach((car) => {
          car.y += speed * dt * 0.55;
        });
        for (let index = traffic.length - 1; index >= 0; index -= 1) {
          const car = traffic[index];
          if (!car || car.y <= height + 40) continue;
          traffic.splice(index, 1);
        }
        const hit = traffic.some((car) => Math.abs(car.x - carX) < 20 && car.y > height - 92 && car.y < height - 40);
        if (hit) {
          dead = true;
          sfx.current.play("drop");
          setNote("Crashed");
          dieRef.current();
        }
      }
      const scroll = dist % 28;
      ctx.fillStyle = "#141018";
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = "#1b1b22";
      ctx.fillRect(roadL, 0, roadR - roadL, height);
      ctx.fillStyle = "#ff2bd6";
      ctx.fillRect(roadL, 0, 4, height);
      ctx.fillStyle = "#39f2e4";
      ctx.fillRect(roadR - 4, 0, 4, height);
      ctx.fillStyle = "#e6c36a";
      for (let y = -28; y < height; y += 28) {
        ctx.fillRect(width / 2 - 2, y + scroll, 4, 14);
      }
      traffic.forEach((car) => {
        ctx.fillStyle = "#111111";
        ctx.fillRect(car.x - 8, car.y + 4, 4, 8);
        ctx.fillRect(car.x + 4, car.y + 4, 4, 8);
        ctx.fillStyle = car.color;
        ctx.fillRect(car.x - 10, car.y, 20, 28);
        ctx.fillStyle = "#07060c";
        ctx.fillRect(car.x - 6, car.y + 6, 12, 8);
      });
      const py = height - 78;
      ctx.fillStyle = "#111111";
      ctx.fillRect(carX - 12, py + 6, 5, 10);
      ctx.fillRect(carX + 7, py + 6, 5, 10);
      ctx.fillStyle = "#ff2bd6";
      ctx.fillRect(carX - 11, py, 22, 32);
      ctx.fillStyle = "#39f2e4";
      ctx.fillRect(carX - 7, py + 6, 14, 10);
      ctx.fillStyle = "#e6c36a";
      ctx.fillRect(carX - 3, py + 22, 6, 4);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      canvas.removeEventListener("pointerdown", onPointer);
      canvas.removeEventListener("pointermove", onPointer);
    };
  }, []);

  return (
    <div className="rad-arcade" onPointerDown={(event) => event.stopPropagation()}>
      <p className="rad-arcade-title">
        Mall RC <span>{score} / 3</span>
      </p>
      <canvas ref={canvasRef} className="rad-arcade-screen" />
      <p className="rad-arcade-note">{note}</p>
      <button type="button" onClick={onClose}>
        Leave machine
      </button>
    </div>
  );
}

const TRIP_COLORS = ["#ff2bd6", "#39f2e4", "#e6c36a", "#f4ecdf", "#ff7a1a", "#7cff6b", "#7aa2ff"];

export function TripWorld({ reduced, onDone }: { reduced: boolean; onDone: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const parent = canvas.parentElement;
    const fit = () => {
      const rect = parent?.getBoundingClientRect();
      canvas.width = Math.max(2, Math.floor(rect?.width ?? 320));
      canvas.height = Math.max(2, Math.floor(rect?.height ?? 480));
    };
    fit();
    type Bit = { x: number; y: number; vx: number; vy: number; w: number; h: number; spin: number; color: string; life: number };
    const bits: Bit[] = [];
    const burst = (x: number, y: number) => {
      for (let index = 0; index < 28; index += 1) {
        const angle = (index / 28) * Math.PI * 2 + Math.random() * 0.4;
        const speed = 80 + Math.random() * 220;
        bits.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 40,
          w: 6 + Math.random() * 10,
          h: 3 + Math.random() * 6,
          spin: Math.random() * Math.PI,
          color: TRIP_COLORS[index % TRIP_COLORS.length] ?? "#f4ecdf",
          life: 1,
        });
      }
    };
    const started = performance.now();
    let last = started;
    let frame = 0;
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      doneRef.current();
    };
    const tick = (now: number) => {
      const elapsed = (now - started) / 1000;
      if (elapsed >= 5) {
        finish();
        return;
      }
      const dt = Math.min(0.033, (now - last) / 1000);
      last = now;
      const width = canvas.width;
      const height = canvas.height;
      if (reduced) {
        if (Math.floor(elapsed * 2) !== Math.floor((elapsed - dt) * 2)) burst(width * (0.2 + Math.random() * 0.6), height * (0.2 + Math.random() * 0.5));
      } else if (Math.random() < 0.35) {
        burst(width * Math.random(), height * Math.random());
      }
      const flash = reduced ? 0.35 + (Math.floor(elapsed * 2) % 2) * 0.2 : 0.25 + Math.abs(Math.sin(now / 70)) * 0.55;
      const hue = (now / 6) % 360;
      ctx.fillStyle = `hsl(${hue} 85% ${18 + flash * 28}%)`;
      ctx.fillRect(0, 0, width, height);
      if (!reduced) {
        for (let band = 0; band < 5; band += 1) {
          const y = ((now / 8 + band * 90) % (height + 80)) - 40;
          ctx.fillStyle = `hsla(${(hue + band * 48) % 360} 100% 62% / ${0.28 + flash * 0.4})`;
          ctx.fillRect(0, y, width, 18);
        }
      }
      for (const bit of bits) {
        bit.vy += 280 * dt;
        bit.x += bit.vx * dt;
        bit.y += bit.vy * dt;
        bit.spin += dt * 6;
        bit.life -= dt * 0.35;
        if (bit.life <= 0) continue;
        ctx.save();
        ctx.translate(bit.x, bit.y);
        ctx.rotate(bit.spin);
        ctx.globalAlpha = Math.max(0, bit.life);
        ctx.fillStyle = bit.color;
        ctx.fillRect(-bit.w / 2, -bit.h / 2, bit.w, bit.h);
        ctx.restore();
      }
      while (bits.length > 400) bits.shift();
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#f4ecdf";
      ctx.font = "16px Outfit, system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("TRIP", width / 2, 36);
      frame = requestAnimationFrame(tick);
    };
    burst(canvas.width / 2, canvas.height / 2);
    frame = requestAnimationFrame(tick);
    return () => {
      finished = true;
      cancelAnimationFrame(frame);
    };
  }, [reduced]);

  return (
    <div className="rad-trip" aria-label="Trippy world" onPointerDown={(event) => event.stopPropagation()}>
      <canvas ref={canvasRef} />
    </div>
  );
}
