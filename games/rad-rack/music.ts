/** Original soundtrack tapes. Rendered for this game, not licensed tracks. */
import cursorUrl from "./art/cursor.wav";
import mallUrl from "./art/mall.wav";
import skateUrl from "./art/skate.wav";

export const TAPES = [
  { title: "Cursor", bpm: 112, src: cursorUrl },
  { title: "Skate", bpm: 128, src: skateUrl },
  { title: "Mall", bpm: 96, src: mallUrl },
] as const;

export const TRACK_TITLE = TAPES[0].title;

export type ClubMusic = {
  unlock: () => void;
  start: () => void;
  stop: () => void;
  setMuted: (muted: boolean) => void;
  /** Switch tapes. Keeps playing if the soundtrack was already on. */
  select: (index: number) => void;
  title: () => string;
  /** Continuous beat count. Falls back to the wall clock when the loop is stopped. */
  beat: () => number;
  dispose: () => void;
};

export function createClubMusic(): ClubMusic {
  const audio = new Audio(TAPES[0].src);
  audio.loop = true;
  audio.preload = "auto";
  audio.volume = 0.9;
  let muted = true;
  let playing = false;
  let index = 0;
  let bpm: number = TAPES[0].bpm;

  function play() {
    if (muted || playing) return;
    playing = true;
    audio.muted = false;
    audio.volume = 0.9;
    void audio.play().catch(() => {
      playing = false;
    });
  }

  return {
    unlock() {
      if (audio.paused && !muted) play();
    },
    start() {
      play();
    },
    stop() {
      playing = false;
      audio.pause();
    },
    setMuted(nextMuted: boolean) {
      muted = nextMuted;
      audio.muted = nextMuted;
      audio.volume = nextMuted ? 0 : 0.9;
      if (nextMuted) {
        playing = false;
        audio.pause();
      }
    },
    select(next: number) {
      const tape = TAPES[next];
      if (!tape || next === index) return;
      const resume = !muted;
      playing = false;
      audio.pause();
      index = next;
      bpm = tape.bpm;
      audio.src = tape.src;
      audio.loop = true;
      if (resume) play();
    },
    title() {
      return TAPES[index]?.title ?? TAPES[0].title;
    },
    beat() {
      if (playing && !audio.paused) return audio.currentTime * (bpm / 60);
      return (performance.now() / 1000) * (bpm / 60);
    },
    dispose() {
      playing = false;
      audio.pause();
      audio.src = "";
    },
  };
}
