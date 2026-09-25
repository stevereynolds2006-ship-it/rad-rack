"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import type { GameComponentProps } from "@rarefriends/friendsdk/runtime";
import { formatGameAmount } from "@rarefriends/friendsdk/ui";
import { maximumPrize, type GamePlay, type GameSnapshot } from "@rarefriends/friendsdk/game";
import { createFriendReader, spriteFrame, type GenerationSprites } from "@rarefriends/friendsdk/sprites";
import { createFriendSoundKit, type FriendSoundCue, type FriendSoundKit } from "@rarefriends/friendsdk/sounds";
import { LOOKS, chanceLabel, lookById, weeklyRareLook } from "./looks";
import { DANCE_MOVES, GLOVES, GYM_MS, arcadeCabinetHit, arcadePoint, clubPoint, gloveById, gymDeckHit, gymGearHit, gymPoint, paintClub, paintGym, weeklyRareGlove } from "./club";
import { createGameplaySfx } from "./sfx";
import { ArcadePlay, TripWorld } from "./arcade-play";
import { TAPES, createClubMusic, type ClubMusic } from "./music";
import { BALLS, SNACKS, ballById, addBowlRoll, bowlCard, bowlDone, bowlLaneHit, bowlPoint, bowlSnackHit, lanePoint, outfitZoom, paintBowl, paintLane, paintSnack, paintStage, pinsForAim, wardrobeHit, weeklyRareBall, WARDROBE_CURTAIN, type BowlFrame } from "./paint";
import { MASKS, maskById, paintPhoto, paintPortrait, paintRink, paintStudio, paintUnder, rinkBoothHit, rinkSpot, SKATES, skateById, weeklyRare, weeklyRareMask } from "./rink";
import { sampleFriendSprites } from "./samples";
import infoTabUrl from "./art/info-tab.png";
import "./style.css";

declare global {
  interface Window {
    __controlsTest?: {
      getX: () => number;
      getYaw: () => number;
      getSpeed: () => number;
      setKeys: (codes: string[]) => void;
    };
  }
}

const rf = (value: bigint) => `${formatGameAmount(value, 18)} RF`;
const BURN_WEEK = 7 * 24 * 60 * 60 * 1000;
const BURN_KEY = "rad-rack-burns";

type BurnWeek = { week: number; amount: string };

function readBurnWeeks(): BurnWeek[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(BURN_KEY) ?? "[]") as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((row) => {
      if (!row || typeof row !== "object") return [];
      const week = (row as BurnWeek).week;
      const amount = (row as BurnWeek).amount;
      return typeof week === "number" && typeof amount === "string" ? [{ week, amount }] : [];
    });
  } catch {
    return [];
  }
}

function recordBurn(amount: bigint) {
  const week = Math.floor(Date.now() / BURN_WEEK);
  const rows = readBurnWeeks();
  const prior = rows.find((row) => row.week === week);
  const weekTotal = (prior ? BigInt(prior.amount) : 0n) + amount;
  const saved = [...rows.filter((row) => row.week !== week), { week, amount: weekTotal.toString() }].slice(-8);
  try {
    localStorage.setItem(BURN_KEY, JSON.stringify(saved));
  } catch {
    // The meter still updates for this visit.
  }
  const sum = saved.reduce((total, row) => total + BigInt(row.amount), 0n);
  return { weekTotal, rate: sum / BigInt(saved.length) };
}

type Panel = "odds" | "reveal" | "desk" | null;

type Room = "rack" | "club" | "rink" | "under" | "photo" | "gym" | "bowl" | "lane" | "snack";
type SavedPhoto = { id: number; mask: number; worn: number[] };

type Live = {
  paused: boolean;
  reduced: boolean;
  worn: typeof LOOKS;
  sprites: GenerationSprites | null;
  held: Set<string>;
  lane: number;
  place: { nx: number; ny: number };
  aim: { nx: number; ny: number } | null;
  aimLane: number | null;
  floor: { nx: number; ny: number };
  floorAim: { nx: number; ny: number } | null;
  gymSpot: { nx: number; ny: number };
  gymAim: { nx: number; ny: number } | null;
  bowlSpot: { nx: number; ny: number };
  bowlAim: { nx: number; ny: number } | null;
  deck: "gym" | "arcade";
  deckBlend: number;
  wander: number;
  fitUntil: number;
  outfitUntil: number;
  maskUntil: number;
  shotMask: number;
  shotReady: number;
  boothUntil: number;
  gymAct: "" | "lift" | "punch";
  gymUntil: number;
  glove: number;
  ball: number;
  rollStart: number;
  rollAim: number;
  rollHit: boolean;
  frames: BowlFrame[];
  bowlPaid: boolean;
  snackUntil: number;
  snackId: number;
  closet: number;
  speed: number;
  side: "left" | "right";
  room: Room;
  move: number;
  muted: boolean;
  skate: number;
  quad: number;
  mask: number;
  lapMark: number;
  lapShown: number;
  crack: number;
  lights: readonly boolean[];
  hold: number;
  latched: boolean;
  info: boolean;
  cross: (way: "in" | "out" | "rink" | "photo" | "gym" | "bowl" | "lane" | "snack", fromButton?: boolean) => void;
  cycleMove: () => void;
};

/** 80s fitting room. Original Friend bitmaps stay intact; clothes are overlays. */
export default function RadRack({ friendId, client, paused }: GameComponentProps) {
  const [snapshot, setSnapshot] = useState<GameSnapshot | null>(null);
  const [sprites, setSprites] = useState<GenerationSprites | null>(null);
  const [spriteError, setSpriteError] = useState("");
  const [spriteNote, setSpriteNote] = useState("");
  const [retry, setRetry] = useState(0);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [panel, setPanel] = useState<Panel>(null);
  const [revealId, setRevealId] = useState<number | null>(null);
  const [worn, setWorn] = useState<ReadonlySet<number>>(() => new Set());
  const [muted, setMuted] = useState(true);
  const [motionPref, setMotionPref] = useState(false);
  const [motionOverride, setMotionOverride] = useState<boolean | null>(null);
  const [caption, setCaption] = useState("");
  const [flash, setFlash] = useState(false);
  const [room, setRoom] = useState<Room>("rack");
  const [move, setMove] = useState(0);
  const [tape, setTape] = useState(0);
  const [equipped, setEquipped] = useState(0);
  const [ownedSkates, setOwnedSkates] = useState<ReadonlySet<number>>(() => new Set([0]));
  const [skateSpent, setSkateSpent] = useState(0n);
  const [ownedMasks, setOwnedMasks] = useState<ReadonlySet<number>>(() => new Set([0]));
  const [mask, setMask] = useState(0);
  const [studio, setStudio] = useState(false);
  const [maskSpent, setMaskSpent] = useState(0n);
  const [ownedGloves, setOwnedGloves] = useState<ReadonlySet<number>>(() => new Set([0]));
  const [glove, setGlove] = useState(0);
  const [gloveSpent, setGloveSpent] = useState(0n);
  const [ownedBalls, setOwnedBalls] = useState<ReadonlySet<number>>(() => new Set([0]));
  const [ball, setBall] = useState(0);
  const [ballSpent, setBallSpent] = useState(0n);
  const [bowlFrames, setBowlFrames] = useState<BowlFrame[]>([]);
  const [bowlPaid, setBowlPaid] = useState(false);
  const [snackSpent, setSnackSpent] = useState(0n);
  const [ownedLooks, setOwnedLooks] = useState<ReadonlySet<number>>(() => new Set());
  const [lookSpent, setLookSpent] = useState(0n);
  const [weekBurned, setWeekBurned] = useState(0n);
  const [burnRate, setBurnRate] = useState(0n);
  const [infoOpen, setInfoOpen] = useState(true);
  const [photos, setPhotos] = useState<SavedPhoto[]>([]);
  const [viewPhoto, setViewPhoto] = useState<number | null>(null);
  const [cabinet, setCabinet] = useState(false);
  const [trip, setTrip] = useState(false);
  const [venue, setVenue] = useState<"gym" | "arcade">("gym");
  const [laps, setLaps] = useState(0);
  const [lights, setLights] = useState<readonly boolean[]>([true, false, false]);
  useEffect(() => {
    setInfoOpen(true);
  }, [room]);
  useEffect(() => {
    const rows = readBurnWeeks();
    const week = Math.floor(Date.now() / BURN_WEEK);
    const current = rows.find((row) => row.week === week);
    setWeekBurned(current ? BigInt(current.amount) : 0n);
    setBurnRate(rows.length === 0 ? 0n : rows.reduce((total, row) => total + BigInt(row.amount), 0n) / BigInt(rows.length));
  }, []);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const portraitRef = useRef<HTMLCanvasElement>(null);
  const sound = useRef<FriendSoundKit | null>(null);
  const fx = useRef(createGameplaySfx());
  const music = useRef<ClubMusic | null>(null);
  const locked = useRef(false);
  const epoch = useRef(0);
  const heard = useRef(false);
  const buyLookRef = useRef<(index: number) => void>(() => {});
  const reduced = motionOverride ?? motionPref;
  const wornLooks = [...worn].sort((a, b) => a - b).map((id) => lookById(id));
  const live = useRef<Live>({
    paused: false,
    reduced: false,
    worn: [],
    sprites: null,
    held: new Set(),
    lane: 0,
    place: { nx: 0.42, ny: 0.56 },
    aim: null,
    aimLane: null,
    floor: { nx: 0.46, ny: 0.68 },
    floorAim: null,
    gymSpot: { nx: 0.42, ny: 0.58 },
    gymAim: null,
    bowlSpot: { nx: 0.36, ny: 0.64 },
    bowlAim: null,
    deck: "gym",
    deckBlend: 0,
    wander: 0,
    fitUntil: 0,
    outfitUntil: 0,
    maskUntil: 0,
    shotMask: -1,
    shotReady: 0,
    boothUntil: 0,
    gymAct: "",
    gymUntil: 0,
    glove: 0,
    ball: 0,
    rollStart: 0,
    rollAim: 0,
    rollHit: false,
    frames: [],
    bowlPaid: false,
    snackUntil: 0,
    snackId: -1,
    closet: 0,
    speed: 0,
    side: "right",
    room: "rack",
    move: 0,
    muted: true,
    skate: 0.4,
    quad: 0,
    mask: 0,
    lapMark: 0.5,
    lapShown: 0,
    crack: 0,
    lights: [true, false, false],
    hold: 0,
    latched: false,
    info: false,
    cross: () => {},
    cycleMove: () => {},
  });
  live.current.paused = paused || panel !== null;
  live.current.reduced = reduced;
  live.current.worn = wornLooks;
  live.current.sprites = sprites;
  live.current.room = room;
  live.current.move = move;
  live.current.muted = muted;
  live.current.quad = equipped;
  live.current.mask = mask;
  live.current.glove = glove;
  live.current.ball = ball;
  live.current.lights = lights;
  live.current.info = infoOpen;

  useEffect(() => {
    music.current?.select(tape);
    if (!live.current.muted) music.current?.start();
  }, [tape]);

  useEffect(() => {
    const canvas = portraitRef.current;
    const photo = photos.find((item) => item.id === viewPhoto);
    if (!canvas || !photo || !sprites) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const frame = spriteFrame(sprites, "down", false, 0, "right").frame.rows;
    const looks = LOOKS.filter((_, index) => photo.worn.includes(index));
    paintPortrait(ctx, canvas.width, canvas.height, frame, looks, maskById(photo.mask));
  }, [viewPhoto, photos, sprites, panel]);

  useEffect(() => {
    const version = ++epoch.current;
    sound.current = createFriendSoundKit({ muted: true });
    setSnapshot(null);
    setError("");
    setBusy(false);
    setPanel(null);
    setRevealId(null);
    setMuted(true);
    setRoom("rack");
    setMove(0);
    setEquipped(0);
    setOwnedSkates(new Set([0]));
    setSkateSpent(0n);
    setOwnedMasks(new Set([0]));
    setMask(0);
    setMaskSpent(0n);
    setOwnedGloves(new Set([0]));
    setGlove(0);
    setGloveSpent(0n);
    setPhotos([]);
    setViewPhoto(null);
    locked.current = false;
    live.current.room = "rack";
    live.current.lane = 0;
    live.current.place = { nx: 0.42, ny: 0.56 };
    live.current.aim = null;
    live.current.aimLane = null;
    live.current.closet = 0;
    live.current.latched = false;
    live.current.shotMask = -1;
    live.current.maskUntil = 0;
    music.current?.stop();
    void client
      .read()
      .then((value) => {
        if (version === epoch.current) setSnapshot(value);
      })
      .catch((cause: unknown) => {
        if (version === epoch.current) {
          setError(cause instanceof Error ? cause.message : "Could not load the fitting room.");
        }
      });
    return () => {
      epoch.current += 1;
      sound.current?.dispose();
      sound.current = null;
    };
  }, [client, friendId]);

  useEffect(() => {
    const track = createClubMusic();
    music.current = track;
    return () => {
      track.dispose();
      if (music.current === track) music.current = null;
    };
  }, []);

  useEffect(() => {
    let alive = true;
    setSpriteError("");
    setSpriteNote("");
    const cached = sampleFriendSprites(friendId);
    setSprites(cached && cached.tokenId === friendId ? cached : null);
    void createFriendReader()
      .read(friendId)
      .then((value) => {
        if (alive && value.tokenId === friendId) setSprites(value);
      })
      .catch((cause: unknown) => {
        if (!alive) return;
        if (cached) {
          setSpriteNote("Chain art didn't answer. Showing the cached sample of this Friend.");
          return;
        }
        setSpriteError(cause instanceof Error ? cause.message : "Could not load this Friend's artwork.");
      });
    return () => {
      alive = false;
    };
  }, [friendId, retry]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setMotionPref(media.matches);
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    sound.current?.setMuted(muted);
    fx.current.setMuted(muted);
  }, [muted]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    let frame = 0;
    let previous = 0;
    let stepAt = 0;
    const state = live.current;
    const probe = {
      getX: () => state.lane,
      getYaw: () => 0,
      getSpeed: () => state.speed,
      setKeys: (codes: string[]) => {
        state.held = new Set(codes);
      },
    };
    window.__controlsTest = probe;
    const tick = (now: number) => {
      const dt = Math.min(0.05, previous ? (now - previous) / 1000 : 0);
      previous = now;
      const held = state.held;
      let dir = 0;
      let vert = 0;
      if (!state.paused) {
        if (held.has("KeyA") || held.has("ArrowLeft") || held.has("TouchLeft")) dir -= 1;
        if (held.has("KeyD") || held.has("ArrowRight") || held.has("TouchRight")) dir += 1;
        if (held.has("KeyW") || held.has("ArrowUp")) vert -= 1;
        if (held.has("KeyS") || held.has("ArrowDown")) vert += 1;
      }
      const rect = canvas.getBoundingClientRect();
      const width = Math.max(1, rect.width);
      const height = Math.max(1, rect.height);
      state.speed = Math.abs(dir) * 7;
      let walking = state.room === "rink" ? !state.reduced : dir !== 0;
      if (state.room === "rink") {
        state.skate += dt * (state.reduced ? 0.45 : 1.15 + dir * 0.6);
        const turned = (state.skate - state.lapMark) / (Math.PI * 2);
        const whole = Math.min(3, Math.max(0, Math.floor(turned)));
        if (whole !== state.lapShown) {
          state.lapShown = whole;
          setLaps(whole);
        }
        if (state.crack === 0 && turned >= 3) {
          state.crack = now;
          fx.current.play("drop");
          setCaption("The floor cracked");
        }
        if (state.crack > 0 && now - state.crack > 1300) {
          state.room = "under";
          state.crack = 0;
          state.latched = true;
          setRoom("under");
          setCaption("Under the mall");
        }
      } else if (state.room === "rack") {
        if (dir !== 0) {
          state.aim = null;
          state.place.nx = Math.min(0.8, Math.max(0.16, state.place.nx + dir * 0.38 * dt));
          state.place.ny = 0.56;
        } else if (state.aim) {
          const dx = state.aim.nx - state.place.nx;
          const dy = state.aim.ny - state.place.ny;
          const dist = Math.hypot(dx, dy);
          const step = Math.min(dist, 0.32 * dt);
          if (dist > 0.001) {
            state.place.nx += (dx / dist) * step;
            state.place.ny += (dy / dist) * step;
          }
          if (dx < -0.01) state.side = "left";
          if (dx > 0.01) state.side = "right";
          walking = dist > 0.02;
          if (dist < 0.02) state.aim = null;
        }
        const atCurtain =
          state.place.nx >= WARDROBE_CURTAIN.x &&
          state.place.nx <= WARDROBE_CURTAIN.x + WARDROBE_CURTAIN.w &&
          state.place.ny >= WARDROBE_CURTAIN.y &&
          state.place.ny <= WARDROBE_CURTAIN.y + WARDROBE_CURTAIN.h;
        if (!state.paused && atCurtain && !state.latched) state.cross("rink");
        if (state.closet > 0 && now - state.closet > 420 && !state.latched) state.cross("in");
        if (!atCurtain && state.closet === 0) state.latched = false;
      } else if (state.room === "club") {
        const spot = state.floor;
        if (dir !== 0 || vert !== 0) {
          state.floorAim = null;
          spot.nx = Math.min(0.8, Math.max(0.18, spot.nx + dir * 0.2 * dt));
          spot.ny = Math.min(0.78, Math.max(0.55, spot.ny + vert * 0.2 * dt));
          walking = true;
        } else if (state.floorAim) {
          const dx = state.floorAim.nx - spot.nx;
          const dy = state.floorAim.ny - spot.ny;
          const dist = Math.hypot(dx, dy);
          const step = Math.min(dist, 0.28 * dt);
          if (dist > 0.001) {
            spot.nx += (dx / dist) * step;
            spot.ny += (dy / dist) * step;
          }
          if (Math.abs(dx) > 0.01) state.side = dx < 0 ? "left" : "right";
          walking = dist > 0.02;
          if (dist < 0.03) state.floorAim = null;
        }
      } else if (state.room === "bowl") {
        const spot = state.bowlSpot;
        if (dir !== 0 || vert !== 0) {
          state.bowlAim = null;
          spot.nx = Math.min(0.72, Math.max(0.2, spot.nx + dir * 0.2 * dt));
          spot.ny = Math.min(0.72, Math.max(0.54, spot.ny + vert * 0.2 * dt));
          walking = true;
        } else if (state.bowlAim) {
          if (state.reduced) {
            spot.nx = state.bowlAim.nx;
            spot.ny = state.bowlAim.ny;
            state.bowlAim = null;
          } else {
          const dx = state.bowlAim.nx - spot.nx;
          const dy = state.bowlAim.ny - spot.ny;
          const dist = Math.hypot(dx, dy);
          const step = Math.min(dist, 0.28 * dt);
          if (dist > 0.001) {
            spot.nx += (dx / dist) * step;
            spot.ny += (dy / dist) * step;
          }
          if (Math.abs(dx) > 0.01) state.side = dx < 0 ? "left" : "right";
          walking = dist > 0.02;
          if (dist < 0.03) state.bowlAim = null;
          }
        }
      } else if (state.room === "gym") {
        const targetBlend = state.deck === "arcade" ? 1 : 0;
        state.deckBlend += (targetBlend - state.deckBlend) * Math.min(1, dt * 3.2);
        if (Math.abs(targetBlend - state.deckBlend) < 0.01) state.deckBlend = targetBlend;
        const lifting = state.deck === "gym" && state.gymAct === "lift" && now < state.gymUntil;
        const spot = state.gymSpot;
        const aim = state.gymAim;
        const onArcade = state.deck === "arcade";
        const loop = [
          { nx: 0.28, ny: 0.58 },
          { nx: 0.62, ny: 0.62 },
          { nx: 0.72, ny: 0.5 },
          { nx: 0.4, ny: 0.48 },
        ];
        if (!lifting) {
          const target = aim ?? (onArcade ? null : loop[state.wander % loop.length] ?? null);
          if (dir !== 0 || vert !== 0) {
            state.gymAim = null;
            const nxLimit = onArcade ? [0.16, 0.84] : [0.18, 0.82];
            const nyLimit = onArcade ? [0.42, 0.88] : [0.46, 0.66];
            spot.nx = Math.min(nxLimit[1] ?? 0.86, Math.max(nxLimit[0] ?? 0.18, spot.nx + dir * 0.2 * dt));
            spot.ny = Math.min(nyLimit[1] ?? 0.72, Math.max(nyLimit[0] ?? 0.46, spot.ny + vert * 0.2 * dt));
            walking = true;
          } else if (target && !state.reduced) {
            const dx = target.nx - spot.nx;
            const dy = target.ny - spot.ny;
            const dist = Math.hypot(dx, dy);
            const step = Math.min(dist, (aim ? 0.28 : 0.07) * dt);
            if (dist > 0.001) {
              spot.nx += (dx / dist) * step;
              spot.ny += (dy / dist) * step;
            }
            if (Math.abs(dx) > 0.01) state.side = dx < 0 ? "left" : "right";
            walking = dist > 0.02;
            if (dist < 0.03) {
              state.gymAim = null;
              if (!aim) state.wander = (state.wander + 1) % loop.length;
            }
          }
        }
      }
      if (dir < 0) state.side = "left";
      if (dir > 0) state.side = "right";
      const frameIndex = state.reduced ? 0 : Math.floor(now / 240) % 8;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const pixelW = Math.floor(width * dpr);
      const pixelH = Math.floor(height * dpr);
      if (canvas.width !== pixelW || canvas.height !== pixelH) {
        canvas.width = pixelW;
        canvas.height = pixelH;
      }
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.imageSmoothingEnabled = false;
      const beat = music.current?.beat() ?? 0;
      if (walking && !state.muted && !state.reduced && now - stepAt > 420) {
        stepAt = now;
        fx.current.play(state.room === "rink" ? "skate" : "step");
      }
      const same = state.sprites && state.sprites.tokenId === friendId ? state.sprites : null;
      const restRows = same ? spriteFrame(same, "down", false, 0, "right").frame.rows : null;
      const friendRows = same
        ? spriteFrame(same, "down", walking && !state.reduced, state.reduced ? 0 : frameIndex, "right").frame.rows
        : null;
      if (state.room === "club") {
        paintClub(context, width, height, friendRows, state.worn, state.floor, state.move, beat, state.reduced, now, walking, restRows);
      } else if (state.room === "rink") {
        const crack = state.crack > 0 ? Math.min(1, (now - state.crack) / 1100) : 0;
        paintRink(context, width, height, friendRows, state.worn, state.skate, state.reduced, now, skateById(state.quad), now < state.fitUntil, crack, restRows);
      } else if (state.room === "under") {
        paintUnder(context, width, height, friendRows, state.worn, state.lights, restRows);
      } else if (state.room === "photo") {
        if (state.boothUntil > 0 && now >= state.boothUntil) {
          state.boothUntil = 0;
          state.cross("out", true);
        } else if (state.boothUntil > now) {
          const shot = maskById(state.shotMask);
          paintStudio(context, width, height, restRows ?? friendRows, state.worn, shot, restRows);
        } else {
          const shot = state.shotMask > 0 && now >= state.shotReady ? maskById(state.shotMask) : null;
          paintPhoto(context, width, height, friendRows, state.worn, maskById(state.mask), outfitZoom(now, state.maskUntil), shot, restRows);
        }
      } else if (state.room === "gym") {
        paintGym(context, width, height, friendRows, state.worn, state.gymAct, gloveById(state.glove), state.gymSpot, state.deck, state.deckBlend, now, state.gymUntil, state.reduced, restRows);
      } else if (state.room === "bowl") {
        paintBowl(context, width, height, friendRows, state.worn, state.bowlSpot, restRows);
      } else if (state.room === "lane") {
        const roll = state.rollStart > 0 ? Math.min(1, (now - state.rollStart) / 900) : 0;
        if (state.rollStart > 0 && !state.rollHit && now - state.rollStart >= 860) {
          state.rollHit = true;
          fx.current.play("hit");
          const knocked = pinsForAim(state.rollAim);
          const finished = bowlDone(state.frames);
          state.frames = addBowlRoll(state.frames, knocked);
          if (!finished && bowlDone(state.frames)) {
            state.bowlPaid = false;
            setBowlPaid(false);
          }
          setBowlFrames(state.frames);
          const text = knocked === 10 ? "Strike" : knocked === 0 ? "Gutter" : `${knocked} pins`;
          setCaption(text);
          window.setTimeout(() => setCaption((current) => (current === text ? "" : current)), 1400);
        }
        const reveal = state.rollStart > 0 ? now - state.rollStart : 0;
        paintLane(context, width, height, friendRows, state.worn, ballById(state.ball), roll, state.rollAim, state.frames, reveal, restRows);
      } else if (state.room === "snack") {
        const left = state.snackUntil - now;
        const zoom = left <= 0 ? 0 : left > 400 ? 1 : left / 400;
        paintSnack(context, width, height, state.snackId >= 0 ? (SNACKS[state.snackId] ?? null) : null, zoom);
      } else if (friendRows) {
        paintStage(context, width, height, friendRows, state.worn, state.place, walking, state.reduced, now, restRows, outfitZoom(now, state.outfitUntil), !state.info);
      } else {
        context.clearRect(0, 0, width, height);
      }
      frame = requestAnimationFrame(tick);
    };
    const stop = () => {
      state.held.clear();
    };
    const onHide = () => {
      if (document.hidden) stop();
    };
    frame = requestAnimationFrame(tick);
    window.addEventListener("blur", stop);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("blur", stop);
      document.removeEventListener("visibilitychange", onHide);
      if (window.__controlsTest === probe) delete window.__controlsTest;
    };
  }, []);

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
      if (event.key === "Escape") {
        setPanel(null);
        return;
      }
      if (live.current.paused) return;
      const key = event.key.toLowerCase();
      if (event.code === "KeyA" || event.code === "KeyD" || event.code === "KeyW" || event.code === "KeyS" || event.code === "ArrowLeft" || event.code === "ArrowRight" || event.code === "ArrowUp" || event.code === "ArrowDown") {
        live.current.held.add(event.code);
        event.preventDefault();
        unlock();
        if (
          (event.code === "KeyD" || event.code === "ArrowRight") &&
          live.current.room === "rack" &&
          live.current.lane > 7.15
        ) {
          live.current.cross("in");
        }
        if (
          (event.code === "KeyA" || event.code === "ArrowLeft") &&
          live.current.room === "rack" &&
          live.current.lane < -7.15
        ) {
          live.current.cross("rink");
        }
      } else if (!event.repeat && event.code === "Space") {
        event.preventDefault();
        if (live.current.room === "club") live.current.cycleMove();
        else pose();
      } else if (!event.repeat && key >= "1" && key <= "9") {
        buyLookRef.current(Number(key) - 1);
      } else if (!event.repeat && key === "0") {
        buyLookRef.current(9);
      } else if (key === "p" && !event.repeat) {
        pose();
      }
    };
    const up = (event: KeyboardEvent) => {
      live.current.held.delete(event.code);
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  function burnHalf(amount: bigint) {
    if (amount < 2n) return;
    const saved = recordBurn(amount / 2n);
    setWeekBurned(saved.weekTotal);
    setBurnRate(saved.rate);
  }

  function buySkate(id: number, fromDesk = false) {
    const skate = skateById(id);
    if (!skate || (live.current.paused && !fromDesk)) return;
    if (ownedSkates.has(id)) {
      setEquipped(id);
      live.current.quad = id;
      if (live.current.room === "rink") live.current.fitUntil = performance.now() + 1800;
      note(`${skate.name} on`);
      return;
    }
    if (fromDesk) return;
    if (purse < skate.price) {
      note("Not enough RF for those skates");
      return;
    }
    setSkateSpent((spent) => spent + skate.price);
    burnHalf(skate.price);
    setOwnedSkates((owned) => new Set(owned).add(id));
    setEquipped(id);
    live.current.quad = id;
    if (live.current.room === "rink") live.current.fitUntil = performance.now() + 1800;
    note(`${skate.name} bought. Half burned`);
    fx.current.play("buy");
  }

  function buyMask(id: number) {
    const rare = weeklyRareMask();
    const item = id >= 200 ? rare : MASKS[id];
    if (!item || live.current.paused || live.current.room !== "photo") return;
    if (id >= 200 && rare.id !== id) return;
    if (ownedMasks.has(id)) {
      setMask(id);
      live.current.mask = id;
      note(`${item.name} on`);
      return;
    }
    if (purse < item.price) {
      note("Not enough RF for that mask");
      return;
    }
    setMaskSpent((spent) => spent + item.price);
    burnHalf(item.price);
    setOwnedMasks((owned) => new Set(owned).add(id));
    setMask(id);
    live.current.mask = id;
    note(`${item.name} bought. Half burned`);
    fx.current.play("buy");
  }

  function buyGlove(id: number) {
    const rare = weeklyRareGlove();
    const item = id >= 300 ? rare : GLOVES[id];
    if (!item || live.current.paused || live.current.room !== "gym") return;
    if (id >= 300 && rare.id !== id) return;
    if (ownedGloves.has(id)) {
      setGlove(id);
      live.current.glove = id;
      note(`${item.name} on`);
      return;
    }
    if (purse < item.price) {
      note("Not enough RF for those gloves");
      return;
    }
    setGloveSpent((spent) => spent + item.price);
    burnHalf(item.price);
    setOwnedGloves((owned) => new Set(owned).add(id));
    setGlove(id);
    live.current.glove = id;
    note(`${item.name} bought. Half burned`);
    fx.current.play("buy");
  }

  function buyBall(id: number) {
    const rare = weeklyRareBall();
    const item = id >= 400 ? rare : BALLS[id];
    if (!item || live.current.paused || live.current.room !== "lane") return;
    if (id >= 400 && rare.id !== id) return;
    if (ownedBalls.has(id)) {
      setBall(id);
      live.current.ball = id;
      note(`${item.name} on`);
      return;
    }
    if (purse < item.price) {
      note("Not enough RF for that ball");
      return;
    }
    setBallSpent((spent) => spent + item.price);
    burnHalf(item.price);
    setOwnedBalls((owned) => new Set(owned).add(id));
    setBall(id);
    live.current.ball = id;
    note(`${item.name} bought. Half burned`);
    fx.current.play("buy");
  }

  function buySnack(id: number) {
    const item = SNACKS[id];
    if (!item || live.current.paused || live.current.room !== "snack") return;
    if (purse < item.price) {
      note("Not enough RF for that snack");
      return;
    }
    setSnackSpent((spent) => spent + item.price);
    burnHalf(item.price);
    setSnackId(id);
    live.current.snackId = id;
    live.current.snackUntil = performance.now() + 2000;
    note(`${item.name}. Half burned`);
    fx.current.play("buy");
  }

  function unlock() {
    void sound.current?.unlock();
    music.current?.unlock();
    fx.current.unlock();
    if (!heard.current && live.current.muted) {
      heard.current = true;
      live.current.muted = false;
      setMuted(false);
      music.current?.setMuted(false);
      fx.current.setMuted(false);
      music.current?.start();
    }
  }

  function flipLight(index: number) {
    setLights((current) => {
      const next = [...current];
      next[index] = !next[index];
      next[(index + 1) % 3] = !next[(index + 1) % 3];
      return next;
    });
    note("Still an odd number of lights");
  }

  function buyOut() {
    if (live.current.room !== "under" || !snapshot || snapshot.consumables < 3n) {
      note("Need 3 tokens");
      return;
    }
    void act(async () => {
      const played = await client.play(3n);
      for (const play of played) await client.settle(play.id);
      const state = live.current;
      state.room = "rack";
      state.latched = true;
      state.crack = 0;
      state.lapShown = 0;
      state.place = { nx: 0.42, ny: 0.56 };
      state.aim = null;
      setLaps(0);
      setRoom("rack");
      note("Spent 3 tokens");
    });
  }

  function note(text: string) {
    setCaption(text);
    window.setTimeout(() => setCaption((current) => (current === text ? "" : current)), 1100);
  }

  function cross(way: "in" | "out" | "rink" | "photo" | "gym" | "bowl" | "lane" | "snack", fromButton = false) {
    const state = live.current;
    if (state.paused) return;
    if (!fromButton && state.latched) return;
    if (way === "out") {
      if (state.room === "rack" || state.room === "under") return;
      state.latched = true;
      if (state.room === "photo") {
        state.boothUntil = 0;
        setStudio(false);
        state.room = "rink";
        setRoom("rink");
        note("The rink");
        return;
      }
      if (state.room === "gym") {
        state.room = "rack";
        state.place = { nx: 0.42, ny: 0.56 };
        state.aim = null;
        setRoom("rack");
        setCabinet(false);
        setVenue("gym");
        note("Back at the rack");
        return;
      }
      if (state.room === "lane") {
        state.room = "bowl";
        setRoom("bowl");
        note("Bowling");
        return;
      }
      if (state.room === "snack") {
        state.room = "bowl";
        setRoom("bowl");
        note("Bowling");
        return;
      }
      state.room = "rack";
      state.lane = 0;
      state.place = { nx: 0.42, ny: 0.56 };
      state.aim = null;
      state.aimLane = null;
      state.closet = 0;
      state.hold = 0;
      setRoom("rack");
      note("Back at the rack");
      return;
    }
    if (way === "photo") {
      if (state.room !== "rink") return;
      state.latched = true;
      state.room = "photo";
      setRoom("photo");
      note("Photo booth");
      fx.current.play("door");
      return;
    }
    if (way === "gym") {
      if (state.room !== "rack") return;
      if (state.worn.length === 0) {
        note("Put a piece of clothing on to enter any room");
        return;
      }
      state.latched = true;
      state.room = "gym";
      state.deck = "arcade";
      state.deckBlend = 1;
      state.gymSpot = { nx: 0.5, ny: 0.8 };
      state.gymAim = null;
      setRoom("gym");
      setVenue("arcade");
      note("Click the gym or the arcade");
      fx.current.play("door");
      return;
    }
    if (way === "bowl") {
      if (state.room !== "rack") return;
      if (state.worn.length === 0) {
        note("Put a piece of clothing on to enter any room");
        return;
      }
      state.latched = true;
      state.room = "bowl";
      setRoom("bowl");
      note("Bowling");
      fx.current.play("door");
      return;
    }
    if (way === "lane") {
      if (state.room !== "bowl") return;
      state.latched = true;
      state.room = "lane";
      setRoom("lane");
      note("Lane 1");
      fx.current.play("door");
      return;
    }
    if (way === "snack") {
      if (state.room !== "bowl") return;
      state.latched = true;
      state.room = "snack";
      setRoom("snack");
      note("Snack bar");
      fx.current.play("door");
      return;
    }
    if (state.room !== "rack") return;
    if (state.worn.length === 0) {
      state.latched = true;
      note("Put a piece of clothing on to enter any room");
      return;
    }
    state.latched = true;
    state.room = way === "rink" ? "rink" : "club";
    state.lane = 0;
    state.place = { nx: 0.42, ny: 0.56 };
    state.aim = null;
    state.closet = 0;
    state.hold = 0;
    if (way === "rink") {
      state.skate = 0.5;
      state.lapMark = 0.5;
      state.lapShown = 0;
      state.crack = 0;
      setLaps(0);
    }
    setRoom(state.room);
    note(way === "rink" ? "The rink" : "The Floor");
    fx.current.play("door");
    if (!state.muted) {
      music.current?.setMuted(false);
      music.current?.unlock();
      music.current?.start();
    }
  }

  function cycleMove() {
    if (live.current.paused || live.current.room !== "club") return;
    unlock();
    const next = (live.current.move + 1) % DANCE_MOVES.length;
    live.current.move = next;
    setMove(next);
    note(DANCE_MOVES[next] ?? "Dance");
    sound.current?.play("select");
  }

  live.current.cross = cross;
  live.current.cycleMove = cycleMove;

  function toggleWear(index: number) {
    if ((live.current.paused && panel !== "desk") || index < 0) return;
    if (index >= 100 && weeklyRareLook().id !== index && !ownedLooks.has(index)) return;
    const puttingOn = !worn.has(index);
    setWorn((current) => {
      const next = new Set(current);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
    if (puttingOn) {
      live.current.worn = [...worn].filter((id) => id !== index).concat(index).sort((a, b) => a - b).map((id) => lookById(id));
      live.current.outfitUntil = performance.now() + 1800;
    }
    sound.current?.play("select");
  }

  function ownsLook(index: number) {
    if (ownedLooks.has(index)) return true;
    return index < LOOKS.length && (snapshot?.inventory[index] ?? 0n) > 0n;
  }

  function buyLook(index: number) {
    if (live.current.paused && panel !== "desk") return;
    const rare = weeklyRareLook();
    if (index >= 100 && rare.id !== index && !ownedLooks.has(index)) return;
    const look = lookById(index);
    if (ownsLook(index)) {
      toggleWear(index);
      return;
    }
    if (purse < look.price) {
      note("Not enough RF for that look");
      return;
    }
    setLookSpent((spent) => spent + look.price);
    burnHalf(look.price);
    setOwnedLooks((owned) => new Set(owned).add(index));
    setWorn((current) => new Set(current).add(index));
    live.current.worn = [...worn].concat(index).sort((a, b) => a - b).map((id) => lookById(id));
    live.current.outfitUntil = performance.now() + 1800;
    note(`${look.name} bought. Half burned`);
    fx.current.play("buy");
  }
  buyLookRef.current = buyLook;

  function pose() {
    if (live.current.paused) return;
    unlock();
    sound.current?.play("impact");
    setCaption("Totally rad");
    window.setTimeout(() => setCaption(""), 900);
    if (!live.current.reduced) {
      setFlash(true);
      window.setTimeout(() => setFlash(false), 180);
    }
  }

  async function act(work: () => Promise<void>, cue?: FriendSoundCue) {
    if (locked.current || paused) return;
    const version = epoch.current;
    locked.current = true;
    setBusy(true);
    setError("");
    unlock();
    try {
      await work();
      const value = await client.read();
      if (version === epoch.current) {
        setSnapshot(value);
        if (cue) sound.current?.play(cue);
      }
    } catch (cause) {
      if (version === epoch.current) {
        setError(cause instanceof Error ? cause.message : "That action failed.");
      }
    } finally {
      if (version === epoch.current) {
        locked.current = false;
        setBusy(false);
      }
    }
  }

  async function playCabinet() {
    if (live.current.room !== "gym" || live.current.deck !== "arcade") return;
    if (!snapshot || snapshot.consumables < 1n) {
      note("1 token to play");
      return;
    }
    await act(async () => {
      const current = await client.read();
      const pending = current.plays.find((play) => play.outcomeId === null);
      const play = pending ?? (await client.play(1n))[0];
      if (!play) throw new Error("No token for the arcade.");
      await client.settle(play.id);
      setCabinet(true);
      fx.current.play("serve");
      note("Rad Break");
    });
  }

  async function payBowl(enter: boolean) {
    if (live.current.bowlPaid) {
      if (enter) live.current.cross("lane", true);
      return;
    }
    if (!snapshot || snapshot.consumables < 1n) {
      note("1 token to bowl");
      return;
    }
    await act(async () => {
      const current = await client.read();
      const pending = current.plays.find((play) => play.outcomeId === null);
      const play = pending ?? (await client.play(1n))[0];
      if (!play) throw new Error("No token for bowling.");
      await client.settle(play.id);
      live.current.bowlPaid = true;
      setBowlPaid(true);
      note("Lane is open");
      if (enter) live.current.cross("lane", true);
    });
  }

  async function changeTape() {
    if (!snapshot || snapshot.consumables < 1n) {
      note("Need a mall token");
      return;
    }
    const next = (tape + 1) % TAPES.length;
    const title = TAPES[next]?.title ?? "New tape";
    await act(async () => {
      const current = await client.read();
      const pending = current.plays.find((play) => play.outcomeId === null);
      const play = pending ?? (await client.play(1n))[0];
      if (!play) throw new Error("No token for the jukebox.");
      const settled = await client.settle(play.id);
      setTape(next);
      const pulled = settled.outcomeId ? definition.outcomes[settled.outcomeId - 1]?.name : "";
      note(pulled ? `${title}. Also pulled ${pulled}.` : title);
    });
  }

  function followPointer(event: ReactPointerEvent<HTMLCanvasElement>) {
    const state = live.current;
    if (state.paused) return;
    if (event.pointerType !== "mouse" && event.buttons === 0) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    if (state.room === "rack") {
      const hit = wardrobeHit(rect.width, rect.height, x, y, !state.info);
      if (hit && typeof hit !== "string") state.aim = hit;
    } else if (state.room === "club") {
      const spot = clubPoint(rect.width, rect.height, x, y);
      if (spot) state.floorAim = spot;
    } else if (state.room === "gym") {
      const spot = state.deck === "arcade" ? arcadePoint(rect.width, rect.height, x, y, state.deckBlend) : gymPoint(rect.width, rect.height, x, y, state.deckBlend);
      if (spot) state.gymAim = spot;
    } else if (state.room === "bowl") {
      const spot = bowlPoint(rect.width, rect.height, x, y);
      if (spot) state.bowlAim = spot;
    }
  }

  const definition = client.definition;
  const price = definition.price;
  const maxPrize = maximumPrize(definition);
  const purse = snapshot ? (snapshot.rfBalance > skateSpent + maskSpent + gloveSpent + ballSpent + snackSpent + lookSpent ? snapshot.rfBalance - skateSpent - maskSpent - gloveSpent - ballSpent - snackSpent - lookSpent : 0n) : 0n;
  const afford = snapshot ? purse >= price : false;
  const backed = snapshot ? snapshot.freeStake >= maxPrize && snapshot.freeStake + price >= maxPrize : false;
  const wornNames = wornLooks.map((look) => look.name).join(", ");
  const trackTitle = TAPES[tape]?.title ?? "Cursor";

  function buyCoin() {
    void act(async () => {
      await client.buy(1n);
      burnHalf(price);
      note(`Burned ${rf(price / 2n)}`);
    }, "purchase");
  }

  return (
    <section
      className="rad"
      data-motion={reduced ? "off" : "on"}
      data-room={room}
      data-info={infoOpen ? "open" : "quiet"}
      aria-label={room === "club" ? "The Floor dance room" : room === "gym" ? "Workout room" : room === "rink" ? "Roller rink" : room === "photo" ? "Photo booth" : room === "under" ? "Secret underground" : "Rad Rack fitting room"}
      onPointerDown={unlock}
    >
      <header className="rad-top">
        <div className="rad-brand">
          <p className="rad-mark">Rad Rack</p>
          <p className="rad-friend">
            {sprites ? `${sprites.familyName} #${friendId.toString()}` : `Friend #${friendId.toString()}`}
          </p>
        </div>
        <div className="rad-meters">
          <span>{snapshot ? rf(purse) : "…"}</span>
          <span>This week {rf(weekBurned)}</span>
          <span>{rf(burnRate)}/week</span>
          <span>{snapshot ? `${snapshot.consumables.toString()} ${snapshot.consumables === 1n ? "token" : "tokens"}` : ""}</span>
        </div>
        <div className="rad-tools">
          <button
            type="button"
            aria-pressed={!muted}
            onPointerDown={(event) => event.stopPropagation()}
            onClick={() => {
              heard.current = true;
              const next = !live.current.muted;
              live.current.muted = next;
              void sound.current?.unlock();
              music.current?.setMuted(next);
              if (!next) {
                music.current?.unlock();
                music.current?.start();
              }
              setMuted(next);
            }}
          >
            {muted ? "Sound off" : "Sound on"}
          </button>
          <button
            type="button"
            aria-pressed={reduced}
            onClick={() => setMotionOverride(!reduced)}
          >
            {reduced ? "Motion off" : "Motion on"}
          </button>
        </div>
      </header>

      <div className="rad-stage">
        <canvas
          ref={canvasRef}
          aria-label={
            room === "club"
              ? `The Floor. Friend ${friendId.toString()} wearing ${wornNames || "a look"}, move ${DANCE_MOVES[move] ?? "Bounce"}. Tap anywhere on the floor to walk there. ${trackTitle} is playing.`
              : room === "rink"
                ? `Roller rink. Friend ${friendId.toString()} is skating with the crowd to ${trackTitle}. Back to the rack leaves the rink.`
                : `Rare Friend ${friendId.toString()} wearing ${wornNames || "no 80s clothes yet"}. Tap the floor to walk. The bag at the top opens the workout room. The curtain goes to the rink. The closet opens onto the dance floor.`
          }
          onPointerMove={followPointer}
          onPointerDown={(event) => {
            if (event.button !== 0) return;
            unlock();
            const state = live.current;
            if (state.paused) return;
            const rect = event.currentTarget.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            if (state.room === "rack") {
              const hit = wardrobeHit(rect.width, rect.height, x, y, !state.info);
              if (hit === "desk") {
                setPanel("desk");
                return;
              }
              if (hit === "closet") {
                if (state.worn.length === 0) {
                  note("Put a piece of clothing on to enter any room");
                  return;
                }
                state.closet = performance.now();
                state.aim = { nx: 0.66, ny: 0.64 };
                return;
              }
              if (hit === "curtain") {
                state.cross("rink");
                return;
              }
              if (hit === "gym") {
                state.cross("gym", true);
                return;
              }
              if (hit === "bowl") {
                state.cross("bowl", true);
                return;
              }
              if (hit) state.aim = hit;
            } else if (state.room === "club") {
              const spot = clubPoint(rect.width, rect.height, x, y);
              if (spot) state.floorAim = spot;
            } else if (state.room === "rink") {
              if (rinkBoothHit(rect.width, rect.height, x, y)) state.cross("photo", true);
            } else if (state.room === "gym") {
              const picked = gymDeckHit(rect.width, rect.height, x, y, state.deckBlend);
              if (picked && picked !== state.deck) {
                state.deck = picked;
                state.gymAct = "";
                state.gymUntil = 0;
                state.gymAim = null;
                state.gymSpot = picked === "arcade" ? { nx: 0.5, ny: 0.8 } : { nx: 0.42, ny: 0.58 };
                if (picked !== "arcade") setCabinet(false);
                setVenue(picked);
                note(picked === "arcade" ? "Arcade" : "Gym");
                return;
              }
              if (state.deck === "gym") {
                const gear = gymGearHit(rect.width, rect.height, x, y, state.deckBlend);
                if (gear) {
                  state.gymAct = gear;
                  state.gymUntil = performance.now() + GYM_MS;
                  state.gymAim = null;
                  fx.current.play("lift");
                  note("Lift");
                  return;
                }
                const spot = gymPoint(rect.width, rect.height, x, y, state.deckBlend);
                if (spot) state.gymAim = spot;
              } else {
                if (arcadeCabinetHit(rect.width, rect.height, x, y, state.deckBlend)) {
                  void playCabinet();
                  return;
                }
                const spot = arcadePoint(rect.width, rect.height, x, y, state.deckBlend);
                if (spot) state.gymAim = spot;
              }
            } else if (state.room === "bowl") {
              if (bowlSnackHit(rect.width, rect.height, x, y)) {
                state.cross("snack", true);
                return;
              }
              if (bowlLaneHit(rect.width, rect.height, x, y)) {
                if (!state.bowlPaid) {
                  void payBowl(true);
                  return;
                }
                state.cross("lane", true);
                return;
              }
              const spot = bowlPoint(rect.width, rect.height, x, y);
              if (spot) state.bowlAim = spot;
            } else if (state.room === "lane") {
              if (lanePoint(rect.width, rect.height, x, y)) {
                if (!state.bowlPaid) {
                  note("1 token to bowl");
                  return;
                }
                if (state.rollStart > 0 && performance.now() - state.rollStart < 900) return;
                const spot = lanePoint(rect.width, rect.height, x, y);
                state.rollAim = Math.max(-1, Math.min(1, ((spot?.nx ?? 0.34) - 0.34) * 2.4));
                state.rollStart = performance.now();
                state.rollHit = false;
                fx.current.play("serve");
              }
            } else if (state.room === "photo") {
              if (state.boothUntil > performance.now()) return;
              if (state.mask <= 0) {
                note("Put a mask on first");
                return;
              }
              state.boothUntil = performance.now() + 5000;
              state.shotMask = state.mask;
              setStudio(true);
              fx.current.play("snap");
              setPhotos((list) => [
                ...list,
                { id: list.length + 1, mask: state.mask, worn: [...worn].sort((a, b) => a - b) },
              ]);
              if (!state.reduced) {
                setFlash(true);
                window.setTimeout(() => setFlash(false), 160);
              }
              note("Cheese");
            }
          }}
        />
        {flash && <div className="rad-flash" aria-hidden="true" />}
        {caption && <p className={caption === "Cheese" ? "rad-caption rad-caption-right" : "rad-caption"}>{caption}</p>}
        {cabinet ? (
          <ArcadePlay
            sfx={fx}
            onClose={() => setCabinet(false)}
            onDie={() => {
              setCabinet(false);
              setTrip(true);
            }}
          />
        ) : null}
        {trip ? (
          <TripWorld
            reduced={reduced}
            onDone={() => {
              setTrip(false);
              fx.current.play("door");
            }}
          />
        ) : null}
        {!sprites && (
          <div className="rad-loading" role={spriteError ? "alert" : "status"}>
            <p>{spriteError || "Pulling this Friend's pixels…"}</p>
            {spriteError && (
              <button type="button" onClick={() => setRetry((value) => value + 1)}>
                Retry artwork
              </button>
            )}
          </div>
        )}
      </div>

      <p className="rad-status" role={error ? "alert" : "status"}>
        {error ||
          spriteNote ||
          (busy
            ? "Waiting on the simulated counter…"
            : room === "club"
              ? muted
                ? `Sound is off. Tap the floor to walk. Back to the rack leaves the floor.`
                : `${trackTitle} is playing. Dance changes your move. Tap the floor to walk.`
              : room === "under"
                ? "Under the mall. The lights cannot all go out. Buy a token, then spend 3 to get back up."
              : room === "photo"
                ? "Photo booth. Put a mask on, then tap the room. The picture projects on the floor."
              : room === "gym"
                ? "Click the gym or the arcade. The middle machines cost 1 token."
              : room === "bowl"
                ? "Bowling. You can buy snacks at the bar on the left."
              : room === "lane"
                ? "Lane 1. Tap toward the pins to bowl. Buy a ball, including the weekly rare."
              : room === "snack"
                ? "Snack bar. Tap a snack to buy it."
              : room === "rink"
                ? `${trackTitle} on the rink. Lap ${laps} of 3. The booth up on the right is the photo booth.`
                : worn.size > 0
                  ? "Clothes on. The bag at the top is the workout room. Right door is the club. Left door is the rink."
                  : "Put a piece of clothing on to enter any room.")}
      </p>

      {room === "under" ? (
        <div className="rad-rack" aria-label="Impossible lights">
          {lights.map((on, index) => (
            <button key={index} type="button" className="rad-look" aria-pressed={on} onClick={() => flipLight(index)}>
              <span className="rad-swatch" style={{ background: on ? "#ffe14a" : "#2a2418" }} aria-hidden="true" />
              <span className="rad-look-name">Switch {index + 1}</span>
              <small>{on ? "On" : "Off"}</small>
            </button>
          ))}
        </div>
      ) : null}

      {room === "under" ? (
        <div className="rad-actions">
          <button
            type="button"
            className="rad-primary"
            disabled={!snapshot || !afford || !backed || busy || paused}
            onClick={buyCoin}
          >
            Buy token · {rf(price)}
          </button>
          <button type="button" className="rad-primary" disabled={paused || busy || !snapshot || snapshot.consumables < 3n} onClick={buyOut}>
            Leave · 3 tokens
          </button>
        </div>
      ) : null}

      {room === "rink" ? (
        <div className="rad-rack" aria-label="Skate shop">
          {[...SKATES.map((skate, id) => ({ skate, id, rare: false })), { skate: weeklyRare(), id: weeklyRare().id, rare: true }].map(
            ({ skate, id, rare }) => {
              const owned = ownedSkates.has(id);
              const on = equipped === id;
              return (
                <button
                  key={id}
                  type="button"
                  className="rad-look"
                  aria-pressed={on}
                  disabled={paused}
                  onClick={() => buySkate(id)}
                >
                  <span className="rad-swatch" style={{ background: skate.boot }} aria-hidden="true" />
                  <span className="rad-look-name">{skate.name}</span>
                  <small>
                    {on ? "Skating" : owned ? "Use" : rare ? `Rare · ${rf(skate.price)}` : `Buy · ${rf(skate.price)}`}
                  </small>
                </button>
              );
            },
          )}
        </div>
      ) : null}

      {room === "photo" && !studio ? (
        <div className="rad-rack" aria-label="Photo booth masks">
          {[...MASKS.map((item, id) => ({ item, id, rare: false })), { item: weeklyRareMask(), id: weeklyRareMask().id, rare: true }].map(
            ({ item, id, rare }) => {
              const owned = ownedMasks.has(id);
              const on = mask === id;
              return (
                <button key={id} type="button" className="rad-look" aria-pressed={on} disabled={paused} onClick={() => buyMask(id)}>
                  <span className="rad-swatch" style={{ background: item.swatch }} aria-hidden="true" />
                  <span className="rad-look-name">{item.name}</span>
                  <small>{on ? "Wearing" : owned ? "Try on" : rare ? `Rare · ${rf(item.price)}` : `Buy · ${rf(item.price)}`}</small>
                </button>
              );
            },
          )}
        </div>
      ) : null}

      {room === "photo" && !studio ? (
        <div className="rad-club-bar">
          <p className="rad-track">
            <strong>Photo booth</strong>
            <span>Tap the room. The picture hits the board, then you leave.</span>
          </p>
          <button
            type="button"
            className="rad-primary"
            disabled={!snapshot || !afford || !backed || busy || paused}
            onClick={buyCoin}
          >
            Buy token · {rf(price)}
          </button>
          <button type="button" disabled={paused} onClick={() => cross("out", true)}>
            Back to the rink
          </button>
        </div>
      ) : null}

      {room === "photo" && studio ? (
        <div className="rad-club-bar">
          <button
            type="button"
            className="rad-primary"
            disabled={!snapshot || !afford || !backed || busy || paused}
            onClick={buyCoin}
          >
            Buy token · {rf(price)}
          </button>
        </div>
      ) : null}

      {room === "bowl" ? (
        <div className="rad-club-bar">
          <p className="rad-track">
            <strong>Bowling</strong>
            <span>You can buy snacks at the bar on the left.</span>
          </p>
          <button
            type="button"
            className="rad-primary"
            disabled={!snapshot || !afford || !backed || busy || paused}
            onClick={buyCoin}
          >
            Buy token · {rf(price)}
          </button>
          {!bowlPaid ? (
            <button
              type="button"
              className="rad-primary"
              disabled={paused || busy || !snapshot || snapshot.consumables < 1n}
              onClick={() => void payBowl(true)}
            >
              Play · 1 token
            </button>
          ) : null}
          <button type="button" disabled={paused} onClick={() => cross("out", true)}>
            Back to the rack
          </button>
        </div>
      ) : null}

      {room === "snack" ? (
        <div className="rad-rack" aria-label="Snack bar">
          {SNACKS.map((item, id) => (
            <button key={item.name} type="button" className="rad-look" disabled={paused} onClick={() => buySnack(id)}>
              <span className="rad-swatch" style={{ background: item.color }} aria-hidden="true" />
              <span className="rad-look-name">{item.name}</span>
              <small>Buy · {rf(item.price)}</small>
            </button>
          ))}
        </div>
      ) : null}

      {room === "snack" ? (
        <div className="rad-club-bar">
          <p className="rad-track">
            <strong>Buy snacks</strong>
            <span>Tap one to buy it. It pops up for 2 seconds.</span>
          </p>
          <button
            type="button"
            className="rad-primary"
            disabled={!snapshot || !afford || !backed || busy || paused}
            onClick={buyCoin}
          >
            Buy token · {rf(price)}
          </button>
          <button type="button" disabled={paused} onClick={() => cross("out", true)}>
            Back to the alley
          </button>
        </div>
      ) : null}

      {room === "lane" ? (
        <div className="rad-rack" aria-label="Bowling balls">
          {[...BALLS.map((item, id) => ({ item, id, rare: false })), { item: weeklyRareBall(), id: weeklyRareBall().id, rare: true }].map(
            ({ item, id, rare }) => {
              const owned = ownedBalls.has(id);
              const on = ball === id;
              return (
                <button key={id} type="button" className="rad-look" aria-pressed={on} disabled={paused} onClick={() => buyBall(id)}>
                  <span className="rad-swatch" style={{ background: item.color }} aria-hidden="true" />
                  <span className="rad-look-name">{item.name}</span>
                  <small>{on ? "Using" : owned ? "Use" : item.price === 0n ? "Free" : rare ? `Rare · ${rf(item.price)}` : `Buy · ${rf(item.price)}`}</small>
                </button>
              );
            },
          )}
        </div>
      ) : null}

      {room === "lane" ? (
        <div className="rad-club-bar">
          <p className="rad-track">
            <strong>{bowlCard(bowlFrames).done ? `Final ${bowlCard(bowlFrames).total}` : `Score ${bowlCard(bowlFrames).total}`}</strong>
            <span>{bowlPaid ? "Tap the lane. Center is a strike." : "Pay 1 token for the next game. The house ball is free."}</span>
          </p>
          {!bowlPaid ? (
            <button
              type="button"
              className="rad-primary"
              disabled={paused || busy || !snapshot || snapshot.consumables < 1n}
              onClick={() => void payBowl(false)}
            >
              Play · 1 token
            </button>
          ) : null}
          <button
            type="button"
            className="rad-primary"
            disabled={!snapshot || !afford || !backed || busy || paused}
            onClick={buyCoin}
          >
            Buy token · {rf(price)}
          </button>
          <button type="button" disabled={paused} onClick={() => cross("out", true)}>
            Back to the alley
          </button>
        </div>
      ) : null}

      {room === "gym" ? (
        <div className="rad-rack" aria-label="Workout gloves">
          {[...GLOVES.map((item, id) => ({ item, id, rare: false })), { item: weeklyRareGlove(), id: weeklyRareGlove().id, rare: true }].map(
            ({ item, id, rare }) => {
              const owned = ownedGloves.has(id);
              const on = glove === id;
              return (
                <button key={id} type="button" className="rad-look" aria-pressed={on} disabled={paused} onClick={() => buyGlove(id)}>
                  <span className="rad-swatch" style={{ background: item.swatch }} aria-hidden="true" />
                  <span className="rad-look-name">{item.name}</span>
                  <small>{on ? "Wearing" : owned ? "Use" : rare ? `Rare · ${rf(item.price)}` : `Buy · ${rf(item.price)}`}</small>
                </button>
              );
            },
          )}
        </div>
      ) : null}

      {room === "gym" ? (
        <div className="rad-club-bar">
          <p className="rad-track">
            <strong>{venue === "arcade" ? "Arcade" : "Gym"}</strong>
            <span>{venue === "arcade" ? "Click the gym or the arcade. 1 token plays a machine." : "Click the gym or the arcade."}</span>
          </p>
          <button
            type="button"
            className="rad-primary"
            disabled={!snapshot || !afford || !backed || busy || paused}
            onClick={buyCoin}
          >
            Buy token · {rf(price)}
          </button>
          <button type="button" disabled={paused} onClick={() => cross("out", true)}>
            Back to the rack
          </button>
        </div>
      ) : null}

      {room === "club" || room === "rink" ? (
        <div className="rad-club-bar">
          <p className="rad-track">
            <strong>{trackTitle}</strong>
            <span>{muted ? "Soundtrack ready" : room === "rink" ? "Skating" : DANCE_MOVES[move]}</span>
          </p>
          <button
            type="button"
            disabled={!snapshot || snapshot.consumables < 1n || busy || paused}
            onClick={() => void changeTape()}
          >
            Change music · 1 token
          </button>
          <button
            type="button"
            className="rad-primary"
            disabled={!snapshot || !afford || !backed || busy || paused}
            onClick={buyCoin}
          >
            Buy token · {rf(price)}
          </button>
          {room === "club" ? (
            <button type="button" className="rad-floor" disabled={paused} onClick={cycleMove}>
              Dance
            </button>
          ) : null}
          <button type="button" disabled={paused} onClick={() => cross("out", true)}>
            Back to the rack
          </button>
        </div>
      ) : room === "gym" || room === "photo" || room === "under" || room === "bowl" || room === "lane" || room === "snack" ? null : (
        <>
          <div className="rad-rack rad-rack-looks" aria-label="80s clothes">
            {[
              ...LOOKS.map((look, index) => ({ look: lookById(index), id: index, rare: false })),
              { look: weeklyRareLook(), id: weeklyRareLook().id, rare: true },
            ].map(({ look, id, rare }) => {
              const owned = ownsLook(id);
              const on = worn.has(id);
              return (
                <button
                  key={id}
                  type="button"
                  className="rad-look"
                  aria-pressed={on}
                  data-owned={owned ? "yes" : "no"}
                  disabled={paused}
                  onClick={() => buyLook(id)}
                >
                  <span className="rad-swatch" style={{ background: look.swatch }} aria-hidden="true" />
                  <span className="rad-look-name">{look.name}</span>
                  <small>{on ? "Wearing" : owned ? "Owned" : rare ? `Rare · ${rf(look.price)}` : `Buy · ${rf(look.price)}`}</small>
                </button>
              );
            })}
          </div>

          <div className="rad-actions">
            <button
              type="button"
              className="rad-floor"
              data-open={worn.size > 0 ? "yes" : "no"}
              disabled={paused}
              onClick={() => cross("rink", true)}
            >
              {worn.size > 0 ? "The Rink" : "The Rink locked"}
            </button>
            <button
              type="button"
              className="rad-floor"
              data-open={worn.size > 0 ? "yes" : "no"}
              disabled={paused}
              onClick={() => cross("in", true)}
            >
              {worn.size > 0 ? "The Floor" : "The Floor locked"}
            </button>
            <button
              type="button"
              disabled={!snapshot || snapshot.consumables < 1n || busy || paused}
              onClick={() => void changeTape()}
            >
              Change music · 1 token
            </button>
            <button
              type="button"
              className="rad-primary"
              disabled={!snapshot || !afford || !backed || busy || paused}
              onClick={buyCoin}
            >
              Buy token · {rf(price)}
            </button>
            <button
              type="button"
              disabled={!snapshot || snapshot.consumables < 1n || busy || paused}
              onClick={() =>
                void act(async () => {
                  const current = await client.read();
                  const pending = current.plays.find((play) => play.outcomeId === null);
                  const play = pending ?? (await client.play(1n))[0];
                  if (!play) throw new Error("No mall token to open.");
                  const settled: GamePlay = await client.settle(play.id);
                  if (!settled.outcomeId) return;
                  const index = settled.outcomeId - 1;
                  const bps = definition.outcomes[index]?.chanceBps ?? 10_000;
                  const cue: FriendSoundCue = bps <= 50 ? "reveal-legendary" : bps <= 500 ? "reveal-rare" : "reveal-common";
                  sound.current?.play(cue);
                  setRevealId(settled.outcomeId);
                  setPanel("reveal");
                  setWorn((value) => new Set(value).add(index));
                  live.current.outfitUntil = performance.now() + 1800;
                })
              }
            >
              Open token
            </button>
            <button type="button" disabled={paused} onClick={() => setPanel("odds")}>
              Odds
            </button>
            <button type="button" disabled={paused || worn.size === 0} onClick={() => setWorn(new Set())}>
              Clear
            </button>
            <button type="button" disabled={paused} onClick={pose}>
              Pose
            </button>
          </div>
        </>
      )}

      {panel && (
        <div className="rad-modal" role="dialog" aria-modal="true" aria-labelledby="rad-dialog-title">
          <div className="rad-dialog">
            <header>
              <h2 id="rad-dialog-title">{panel === "odds" ? "Mall odds" : panel === "desk" ? "Your desk" : "You pulled"}</h2>
              <button
                type="button"
                onClick={() => {
                  setPanel(null);
                  setViewPhoto(null);
                }}
                aria-label="Close"
              >
                Close
              </button>
            </header>
            {panel === "reveal" && revealId ? (
              <div className="rad-reveal">
                <p className="rad-reveal-name">{definition.outcomes[revealId - 1]?.name}</p>
                <p>{LOOKS[revealId - 1]?.blurb}</p>
                <p>It's on your Friend. Redeem it later for simulated RF, or keep stacking the fit.</p>
              </div>
            ) : panel === "desk" ? (
              <>
                <p>Skates, looks, and pictures from the booth. Pictures stay in the closet so you can open them here.</p>
                {viewPhoto != null ? (
                  <div className="rad-reveal">
                    <canvas ref={portraitRef} width={220} height={240} aria-label="Saved picture" />
                    <p>{maskById(photos.find((item) => item.id === viewPhoto)?.mask ?? 0).name}</p>
                    <button type="button" onClick={() => setViewPhoto(null)}>
                      Back to the closet
                    </button>
                  </div>
                ) : (
                <>
                <ul className="rad-odds">
                  {photos.map((photo) => (
                    <li key={photo.id}>
                      <div>
                        <strong>Picture {photo.id}</strong>
                        <small>Closet · {maskById(photo.mask).name}</small>
                      </div>
                      <button type="button" onClick={() => setViewPhoto(photo.id)}>
                        View
                      </button>
                    </li>
                  ))}
                  {[...ownedSkates].sort((a, b) => a - b).map((id) => {
                    const skate = skateById(id);
                    const on = equipped === id;
                    return (
                      <li key={id}>
                        <div>
                          <strong>{skate.name}</strong>
                          <small>{id >= 100 ? "Rare skate" : "Skate"}{on ? " · on your feet" : ""}</small>
                        </div>
                        <button type="button" onClick={() => buySkate(id, true)}>
                          {on ? "Skating" : "Use"}
                        </button>
                      </li>
                    );
                  })}
                  {Array.from(new Set([...ownedLooks, ...LOOKS.map((_, index) => ((snapshot?.inventory[index] ?? 0n) > 0n ? index : -1)).filter((id) => id >= 0)])).sort((a, b) => a - b).map((id) => {
                    const look = lookById(id);
                    const on = worn.has(id);
                    return (
                      <li key={id}>
                        <div>
                          <strong>{look.name}</strong>
                          <small>{id >= 100 ? "Rare look" : "Look"}{on ? " · wearing" : ""}</small>
                        </div>
                        <button type="button" onClick={() => toggleWear(id)}>
                          {on ? "Take off" : "Wear"}
                        </button>
                      </li>
                    );
                  })}
                </ul>
                {(snapshot?.inventory.every((count) => count < 1n) ?? true) && photos.length === 0 && ownedLooks.size === 0 && ownedSkates.size === 0 ? (
                  <p>No looks yet. Buy one at the rack.</p>
                ) : null}
                </>
                )}
              </>
            ) : (
              <>
                <p>
                  One mall token costs {rf(price)} of simulated $RAREFRIENDS and opens into one look. Expected return is under the
                  price, so the rack is a sink. Nothing here sends a transaction.
                </p>
                <ul className="rad-odds">
                  {definition.outcomes.map((outcome, index) => {
                    const count = snapshot?.inventory[index] ?? 0n;
                    return (
                      <li key={outcome.name}>
                        <div>
                          <strong>{outcome.name}</strong>
                          <small>
                            {chanceLabel(outcome.chanceBps)} · redeem {rf(outcome.reward)} · owned {count.toString()}
                          </small>
                        </div>
                        <button
                          type="button"
                          disabled={count < 1n || busy || paused}
                          onClick={() => void act(() => client.redeem(index + 1, 1n), "reward")}
                        >
                          Redeem
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </div>
        </div>
      )}

      <footer className="rad-foot">
        {room === "club"
          ? `${trackTitle} is the soundtrack. One mall token changes the tape. Tap the floor to walk.`
          : room === "gym"
            ? "Click the gym or the arcade. Weights lift. A middle machine costs 1 token."
          : room === "bowl"
            ? "You can buy snacks at the bar on the left. Back to the rack leaves."
          : room === "lane"
            ? "Tap up the lane to roll. Buy a ball. One rare ball changes every week."
          : room === "snack"
            ? "Tap a snack to buy it. Back to the alley leaves the counter."
          : room === "rink"
            ? `${trackTitle} is playing. One mall token changes the tape. Back to the rack leaves the rink.`
            : room === "rack" && worn.size === 0
              ? "Put a piece of clothing on to enter any room. The bag, the doors, and the signs stay shut until then."
              : "The bag at the top is the workout room. Left door is the roller rink. Right door is the club."}
        {room === "rack" && !backed && snapshot ? " Open a token before buying another — the preview reserve is full." : ""}
        {room === "rack" && !afford && snapshot ? " Not enough simulated RF." : ""}
      </footer>
      <button
        type="button"
        className="rad-info-tab"
        aria-expanded={infoOpen}
        aria-label={infoOpen ? "Hide info" : "Info"}
        onClick={() => setInfoOpen((open) => !open)}
      >
        <img src={infoTabUrl} alt="" />
      </button>
    </section>
  );
}
