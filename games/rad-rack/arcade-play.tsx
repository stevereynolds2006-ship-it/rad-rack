import { useEffect, useRef, useState } from "react";
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
