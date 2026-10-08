"use client";

import { useEffect, useRef, useState } from "react";
import { DESK_TRACKS, createDeskMusicEngine, type TrackId } from "@/lib/deskMusic";

const STORAGE_VOL = "aim-theme-vol";
const STORAGE_OPEN = "aim-theme-music-open";
const STORAGE_TRACK = "aim-theme-track";
const STORAGE_LOOP = "aim-theme-loop-ids";

const ALL_TRACK_IDS = DESK_TRACKS.map((track) => track.id);

function parseLoopIds(raw: string | null): TrackId[] {
  if (!raw) return [...ALL_TRACK_IDS];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [...ALL_TRACK_IDS];
    const ids = parsed.filter((id): id is TrackId => DESK_TRACKS.some((track) => track.id === id));
    return ids.length ? ids : [...ALL_TRACK_IDS];
  } catch {
    return [...ALL_TRACK_IDS];
  }
}

export function DeskMusic() {
  const engineRef = useRef<ReturnType<typeof createDeskMusicEngine> | null>(null);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.35);
  const [open, setOpen] = useState(false);
  const [trackId, setTrackId] = useState<TrackId>("neon-velocity-1");
  const [loopIds, setLoopIds] = useState<TrackId[]>([...ALL_TRACK_IDS]);
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const loopIdsRef = useRef<TrackId[]>(loopIds);
  const playTrackRef = useRef<(id: TrackId) => Promise<void>>(async () => undefined);

  const active = DESK_TRACKS.find((track) => track.id === trackId) || DESK_TRACKS[0];
  loopIdsRef.current = loopIds;

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    let initial: TrackId = "neon-velocity-1";
    try {
      const savedVolume = localStorage.getItem(STORAGE_VOL);
      if (savedVolume != null) setVolume(Math.min(1, Math.max(0, Number(savedVolume) || 0.35)));
      if (localStorage.getItem(STORAGE_OPEN) === "1") setOpen(true);
      const savedTrack = localStorage.getItem(STORAGE_TRACK);
      if (savedTrack && DESK_TRACKS.some((track) => track.id === savedTrack)) {
        initial = savedTrack as TrackId;
        setTrackId(initial);
      }
      setLoopIds(parseLoopIds(localStorage.getItem(STORAGE_LOOP)));
    } catch {
      /* ignore */
    }

    engineRef.current = createDeskMusicEngine(initial);
    engineRef.current.setOnEnded((endedId) => {
      const list = loopIdsRef.current.length ? loopIdsRef.current : ALL_TRACK_IDS;
      if (list.length <= 1) return;
      const index = list.indexOf(endedId);
      const next = list[(index + 1 + list.length) % list.length];
      void playTrackRef.current(next);
    });
    return () => {
      engineRef.current?.dispose();
      engineRef.current = null;
    };
  }, [hydrated]);

  useEffect(() => {
    engineRef.current?.setVolume(volume);
    try {
      localStorage.setItem(STORAGE_VOL, String(volume));
    } catch {
      /* ignore */
    }
  }, [volume]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_OPEN, open ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [open]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_TRACK, trackId);
    } catch {
      /* ignore */
    }
  }, [trackId]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_LOOP, JSON.stringify(loopIds));
    } catch {
      /* ignore */
    }
    engineRef.current?.setRepeatOne(loopIds.length <= 1);
  }, [loopIds]);

  function stopAll() {
    engineRef.current?.stopAll();
    setPlaying(false);
    setError(null);
  }

  async function playTrack(id: TrackId) {
    setError(null);
    setTrackId(id);
    const engine = engineRef.current;
    if (!engine) return;
    try {
      engine.setRepeatOne(loopIdsRef.current.length <= 1);
      engine.stopAll();
      engine.setTrack(id);
      engine.setVolume(volume);
      await engine.start();
      setPlaying(true);
    } catch {
      setError("Could not start audio — try Play again.");
      setPlaying(false);
    }
  }
  playTrackRef.current = playTrack;

  function stopTrack(id: TrackId) {
    if (engineRef.current?.getTrackId() === id) stopAll();
  }

  async function togglePlay() {
    if (playing) {
      stopAll();
      return;
    }
    await playTrack(trackId);
  }

  async function selectTrack(id: TrackId) {
    if (playing && id !== trackId) {
      await playTrack(id);
      return;
    }
    setTrackId(id);
    engineRef.current?.setTrack(id);
  }

  async function nextTrack(dir: 1 | -1) {
    const list = loopIds.length ? loopIds : ALL_TRACK_IDS;
    const index = list.indexOf(trackId);
    const from = index >= 0 ? index : 0;
    const next = list[(from + dir + list.length) % list.length];
    await selectTrack(next);
  }

  function toggleLoop(id: TrackId) {
    setLoopIds((prev) => {
      if (prev.includes(id)) {
        const next = prev.filter((item) => item !== id);
        return next.length ? next : prev;
      }
      return ALL_TRACK_IDS.filter((item) => prev.includes(item) || item === id);
    });
  }

  if (!hydrated) return null;

  return (
    <div className={`theme-music ${open ? "open" : ""} ${playing ? "playing" : ""}`}>
      <button
        type="button"
        className="theme-music-fab"
        onClick={() => {
          if (playing) stopAll();
          else if (!open) setOpen(true);
          else void togglePlay();
        }}
        aria-label={playing ? "Stop all theme music" : open ? "Play theme music" : "Open theme music"}
        title={playing ? "Stop all music" : "Theme music (optional)"}
      >
        <span className="theme-music-icon" aria-hidden="true">
          {playing ? active.emoji : "♪"}
        </span>
        {playing ? <span className="theme-music-pulse" aria-hidden="true" /> : null}
      </button>

      {open ? (
        <div className="theme-music-panel" role="region" aria-label="Theme music controls">
          <div className="theme-music-head">
            <strong>Theme music</strong>
            <button type="button" className="theme-music-close" onClick={() => setOpen(false)} aria-label="Collapse music panel">
              ✕
            </button>
          </div>
          <div className="theme-music-body">
            <p className="theme-music-note">
              Optional scores from Tesla World Racer. Check the tracks to rotate. When a track ends, the next checked one plays. Music stays off until you press Play.
            </p>
            <div className="theme-music-now">
              <span className="theme-music-now-emoji" aria-hidden="true">
                {active.emoji}
              </span>
              <div>
                <div className="theme-music-now-name">{active.name}</div>
                <div className="theme-music-now-blurb">{active.blurb}</div>
              </div>
            </div>
            <div className="theme-music-switcher">
              <button type="button" className="theme-music-mini" onClick={() => nextTrack(-1)} aria-label="Previous mood">
                ←
              </button>
              <label className="theme-music-select-wrap">
                <span className="sr">Mood</span>
                <select className="theme-music-select" value={trackId} onChange={(event) => selectTrack(event.target.value as TrackId)} aria-label="Choose music mood">
                  {DESK_TRACKS.map((track) => (
                    <option key={track.id} value={track.id}>
                      {track.emoji} {track.name}
                    </option>
                  ))}
                </select>
              </label>
              <button type="button" className="theme-music-mini" onClick={() => nextTrack(1)} aria-label="Next mood">
                →
              </button>
            </div>
            <div className="theme-music-loop-bar">
              <span>
                Rotate {loopIds.length} of {DESK_TRACKS.length}
              </span>
              <button type="button" className="theme-music-mini" onClick={() => setLoopIds([...ALL_TRACK_IDS])}>
                All moods
              </button>
              <button type="button" className="theme-music-mini" onClick={() => setLoopIds([trackId])}>
                This mood only
              </button>
            </div>
            <ul className="theme-music-tracks">
              {DESK_TRACKS.map((track) => {
                const on = playing && track.id === trackId;
                return (
                  <li key={track.id} className={`theme-music-track ${on ? "playing" : ""} ${track.id === trackId ? "selected" : ""}`}>
                    <label className="theme-music-loop-check">
                      <input type="checkbox" checked={loopIds.includes(track.id)} onChange={() => toggleLoop(track.id)} aria-label={`Include ${track.name} in the rotation`} />
                    </label>
                    <button type="button" className="theme-music-track-label" onClick={() => (on ? stopTrack(track.id) : playTrack(track.id))}>
                      <span aria-hidden="true">{track.emoji}</span>
                      <span>{track.name}</span>
                      {on ? <span className="theme-music-live">Playing</span> : null}
                    </button>
                    <button type="button" className="theme-music-mini" onClick={() => (on ? stopTrack(track.id) : playTrack(track.id))}>
                      {on ? "Stop" : "Play"}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="theme-music-controls">
            <button type="button" className="theme-music-stop-all" onClick={stopAll} disabled={!playing}>
              Stop all music
            </button>
            <label className="theme-music-vol">
              <span>Volume</span>
              <input type="range" min={0} max={1} step={0.01} value={volume} onChange={(event) => setVolume(Number(event.target.value))} aria-label="Music volume" />
            </label>
            <p className="theme-music-credit">{active.credit}</p>
            {error ? <p className="theme-music-error">{error}</p> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
