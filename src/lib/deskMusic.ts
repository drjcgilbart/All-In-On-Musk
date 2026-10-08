/**
 * Desk background scores. Add a soundtrack by appending one entry.
 * Files stay where Tesla World Racer already serves them.
 */

export type TrackId = "neon-velocity-1" | "neon-velocity-2" | "cyber-necrosis-1" | "cyber-necrosis-2";

export type DeskTrack = {
  id: TrackId;
  name: string;
  emoji: string;
  blurb: string;
  src: string;
  credit: string;
};

export const DESK_TRACKS: DeskTrack[] = [
  {
    id: "neon-velocity-1",
    name: "Neon Velocity 1",
    emoji: "✦",
    blurb: "Night run. The first Tesla World Racer score.",
    src: "/race/neon-velocity-1.m4a",
    credit: "Tesla World Racer soundtrack on this site.",
  },
  {
    id: "neon-velocity-2",
    name: "Neon Velocity 2",
    emoji: "✧",
    blurb: "The second night run.",
    src: "/race/neon-velocity-2.m4a",
    credit: "Tesla World Racer soundtrack on this site.",
  },
  {
    id: "cyber-necrosis-1",
    name: "Cyber Necrosis 1",
    emoji: "▣",
    blurb: "Heavier grid. First of the pair.",
    src: "/race/cyber-necrosis-1.m4a",
    credit: "Tesla World Racer soundtrack on this site.",
  },
  {
    id: "cyber-necrosis-2",
    name: "Cyber Necrosis 2",
    emoji: "▦",
    blurb: "Heavier grid. Second of the pair.",
    src: "/race/cyber-necrosis-2.m4a",
    credit: "Tesla World Racer soundtrack on this site.",
  },
];

export function getTrack(id: TrackId | string): DeskTrack {
  return DESK_TRACKS.find((track) => track.id === id) || DESK_TRACKS[0];
}

export type MusicEngine = {
  start: () => Promise<void>;
  stop: () => void;
  stopAll: () => void;
  setVolume: (v: number) => void;
  setTrack: (id: TrackId | string) => void;
  getTrackId: () => TrackId;
  isPlaying: () => boolean;
  isTrackPlaying: (id: TrackId | string) => boolean;
  setRepeatOne: (repeat: boolean) => void;
  setOnEnded: (cb: ((id: TrackId) => void) | null) => void;
  dispose: () => void;
};

let sharedAudio: HTMLAudioElement | null = null;
let sharedGeneration = 0;

function getSharedAudio(): HTMLAudioElement {
  if (!sharedAudio) {
    sharedAudio = new Audio();
    sharedAudio.loop = false;
    sharedAudio.preload = "none";
  }
  return sharedAudio;
}

function silenceAudio(audio: HTMLAudioElement) {
  try {
    audio.pause();
  } catch {
    /* ignore */
  }
  try {
    audio.currentTime = 0;
  } catch {
    /* ignore */
  }
}

function srcMatches(audio: HTMLAudioElement, path: string) {
  const abs = audio.src || "";
  return abs.endsWith(path) || abs.includes(encodeURI(path));
}

export function createDeskMusicEngine(initialTrack: TrackId = "neon-velocity-1"): MusicEngine {
  let playing = false;
  let volume = 0.35;
  let track = getTrack(initialTrack);
  let repeatOne = false;
  let onEnded: ((id: TrackId) => void) | null = null;

  function stopAll() {
    sharedGeneration += 1;
    playing = false;
    if (!sharedAudio) return;
    silenceAudio(sharedAudio);
    try {
      sharedAudio.removeAttribute("src");
      sharedAudio.load();
    } catch {
      /* ignore */
    }
  }

  async function playCurrent() {
    const gen = (sharedGeneration += 1);
    const audio = getSharedAudio();
    silenceAudio(audio);
    audio.loop = repeatOne;
    audio.volume = volume;
    audio.onended = () => {
      if (gen !== sharedGeneration) return;
      if (audio.loop) return;
      playing = false;
      onEnded?.(track.id);
    };
    if (!srcMatches(audio, track.src)) audio.src = track.src;
    try {
      await audio.play();
    } catch (err) {
      if (gen !== sharedGeneration) return;
      playing = false;
      throw err;
    }
    if (gen !== sharedGeneration) {
      silenceAudio(audio);
      return;
    }
    playing = !audio.paused;
  }

  return {
    async start() {
      await playCurrent();
    },
    stop() {
      stopAll();
    },
    stopAll,
    setVolume(v: number) {
      volume = Math.min(1, Math.max(0, v));
      if (sharedAudio) sharedAudio.volume = volume;
    },
    setTrack(id: TrackId | string) {
      track = getTrack(id);
    },
    getTrackId() {
      return track.id;
    },
    isPlaying() {
      return playing && !!sharedAudio && !sharedAudio.paused;
    },
    isTrackPlaying(id: TrackId | string) {
      return playing && !!sharedAudio && !sharedAudio.paused && track.id === id;
    },
    setRepeatOne(repeat: boolean) {
      repeatOne = !!repeat;
      if (sharedAudio) sharedAudio.loop = repeatOne;
    },
    setOnEnded(cb) {
      onEnded = cb;
    },
    dispose() {
      onEnded = null;
      stopAll();
    },
  };
}
