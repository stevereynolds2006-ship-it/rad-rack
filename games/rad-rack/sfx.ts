export type GameBlip = "step" | "lift" | "hit" | "break" | "serve" | "drop" | "win" | "snap" | "door" | "skate" | "buy";

export type GameplaySfx = {
  unlock: () => void;
  setMuted: (muted: boolean) => void;
  play: (name: GameBlip) => void;
  dispose: () => void;
};

export function createGameplaySfx(): GameplaySfx {
  let context: AudioContext | null = null;
  let muted = true;

  function unlock() {
    if (typeof AudioContext === "undefined") return;
    if (!context) context = new AudioContext();
    void context.resume();
  }

  function tone(freq: number, duration: number, type: OscillatorType, level: number, slide = 0) {
    if (!context || muted || context.state !== "running") return;
    const now = context.currentTime;
    const osc = context.createOscillator();
    const amp = context.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(48, freq + slide), now + duration);
    amp.gain.setValueAtTime(level, now);
    amp.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.connect(amp);
    amp.connect(context.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  function click(duration: number, level: number) {
    if (!context || muted || context.state !== "running") return;
    const frames = Math.max(1, Math.floor(context.sampleRate * duration));
    const buffer = context.createBuffer(1, frames, context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let index = 0; index < frames; index += 1) {
      data[index] = (Math.random() * 2 - 1) * (1 - index / frames);
    }
    const source = context.createBufferSource();
    const amp = context.createGain();
    const filter = context.createBiquadFilter();
    source.buffer = buffer;
    filter.type = "highpass";
    filter.frequency.value = 900;
    amp.gain.value = level;
    source.connect(filter);
    filter.connect(amp);
    amp.connect(context.destination);
    source.start();
  }

  function play(name: GameBlip) {
    if (name === "step") click(0.03, 0.04);
    else if (name === "skate") tone(180, 0.05, "square", 0.03, 40);
    else if (name === "lift") tone(196, 0.16, "square", 0.06, 180);
    else if (name === "hit") tone(520, 0.06, "square", 0.05);
    else if (name === "break") tone(880, 0.07, "square", 0.05, 120);
    else if (name === "serve") {
      tone(440, 0.08, "square", 0.05);
      window.setTimeout(() => tone(660, 0.1, "square", 0.05), 70);
    } else if (name === "drop") tone(240, 0.22, "sawtooth", 0.05, -160);
    else if (name === "win") {
      tone(523, 0.1, "square", 0.05);
      window.setTimeout(() => tone(659, 0.12, "square", 0.05), 90);
      window.setTimeout(() => tone(784, 0.18, "square", 0.05), 180);
    } else if (name === "snap") click(0.05, 0.08);
    else if (name === "door") tone(300, 0.1, "square", 0.04, 90);
    else if (name === "buy") tone(698, 0.12, "square", 0.05, 80);
  }

  return {
    unlock,
    setMuted(next) {
      muted = next;
    },
    play,
    dispose() {
      void context?.close();
      context = null;
    },
  };
}
