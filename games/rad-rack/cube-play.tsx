import { useEffect, useRef, useState } from "react";
import { CUBE_COLORS, freshCube, scrambleCube, solvedCube, turnCube, yawCube, type Cube } from "./cube";
import type { GameplaySfx } from "./sfx";

const LABELS = ["U", "R", "F", "D", "L", "B"];

export function CubePlay({
  sfx,
  onSolved,
  onBack,
}: {
  sfx: { current: GameplaySfx };
  onSolved: () => void;
  onBack: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cubeRef = useRef<Cube>(freshCube());
  const [moves, setMoves] = useState(0);
  const [view, setView] = useState(0);
  const [done, setDone] = useState(false);
  const [note, setNote] = useState("Turn a face. Spin to see the back.");

  useEffect(() => {
    const cube = freshCube();
    scrambleCube(cube, 7);
    cubeRef.current = cube;
    setMoves(0);
    setDone(false);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const width = 320;
    const height = 280;
    canvas.width = width;
    canvas.height = height;
    const cube = cubeRef.current;
    const s = 34;
    const hx = s;
    const hy = s * 0.52;
    const vz = s * 0.9;
    const cx = width / 2;
    const topY = 36;
    const top = (c: number, r: number) => ({ x: cx + (c - r) * hx, y: topY + (c + r) * hy });
    const quad = (a: { x: number; y: number }, b: { x: number; y: number }, c: { x: number; y: number }, d: { x: number; y: number }, color: string) => {
      const inset = 0.12;
      const mid = {
        x: (a.x + b.x + c.x + d.x) / 4,
        y: (a.y + b.y + c.y + d.y) / 4,
      };
      const pull = (p: { x: number; y: number }) => ({ x: mid.x + (p.x - mid.x) * (1 - inset), y: mid.y + (p.y - mid.y) * (1 - inset) });
      const pa = pull(a);
      const pb = pull(b);
      const pc = pull(c);
      const pd = pull(d);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(pa.x, pa.y);
      ctx.lineTo(pb.x, pb.y);
      ctx.lineTo(pc.x, pc.y);
      ctx.lineTo(pd.x, pd.y);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "#141018";
      ctx.lineWidth = 2;
      ctx.stroke();
    };
    ctx.fillStyle = "#07060c";
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = "rgba(47, 91, 214, 0.28)";
    for (let y = 0; y < 8; y += 1) {
      for (let x = 0; x < 14; x += 1) {
        ctx.fillRect(cx - 90 + x * 12 + (y % 2) * 6, 230 + y * 5, 4, 3);
      }
    }
    const colorAt = (face: number, index: number) => CUBE_COLORS[cube[face]?.[index] ?? 0] ?? "#f4f4f4";
    for (let row = 0; row < 3; row += 1) {
      for (let col = 0; col < 3; col += 1) {
        const near = top(3, 3 - col);
        const far = top(3, 2 - col);
        quad(
          { x: near.x, y: near.y + row * vz },
          { x: far.x, y: far.y + row * vz },
          { x: far.x, y: far.y + (row + 1) * vz },
          { x: near.x, y: near.y + (row + 1) * vz },
          colorAt(1, row * 3 + col),
        );
      }
    }
    for (let row = 0; row < 3; row += 1) {
      for (let col = 0; col < 3; col += 1) {
        const left = top(col, 3);
        const right = top(col + 1, 3);
        quad(
          { x: left.x, y: left.y + row * vz },
          { x: right.x, y: right.y + row * vz },
          { x: right.x, y: right.y + (row + 1) * vz },
          { x: left.x, y: left.y + (row + 1) * vz },
          colorAt(2, row * 3 + col),
        );
      }
    }
    for (let row = 0; row < 3; row += 1) {
      for (let col = 0; col < 3; col += 1) {
        quad(top(col, row), top(col + 1, row), top(col + 1, row + 1), top(col, row + 1), colorAt(0, row * 3 + col));
      }
    }
  }, [moves, view, done]);

  function twist(face: number, cw: boolean) {
    if (done) return;
    turnCube(cubeRef.current, face, cw);
    sfx.current.play("hit");
    const next = moves + 1;
    setMoves(next);
    if (solvedCube(cubeRef.current)) {
      setDone(true);
      setNote("Solved");
      sfx.current.play("win");
      window.setTimeout(onSolved, 700);
    }
  }

  return (
    <div className="rad-arcade rad-arcade-wide" onPointerDown={(event) => event.stopPropagation()}>
      <p className="rad-arcade-title">
        Cube <span>{moves}</span>
      </p>
      <canvas ref={canvasRef} className="rad-arcade-screen" />
      <p className="rad-arcade-note">{note}</p>
      <div className="rad-cube-moves">
        {LABELS.map((label, face) => (
          <span key={label}>
            <button type="button" onClick={() => twist(face, true)}>
              {label}
            </button>
            <button type="button" onClick={() => twist(face, false)}>
              {label}'
            </button>
          </span>
        ))}
      </div>
      <button
        type="button"
        onClick={() => {
          yawCube(cubeRef.current);
          sfx.current.play("step");
          setView((value) => value + 1);
        }}
      >
        Spin
      </button>
      <button type="button" onClick={onBack}>
        Other choice
      </button>
    </div>
  );
}
