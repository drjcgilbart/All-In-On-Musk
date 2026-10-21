/**
 * SI Slopcore Videos: a new monthly series.
 * Add one entry per video. Newest-first sorting is automatic, so order here doesn't matter.
 *   youtubeId: the ID from the YouTube URL (the part after "watch?v=" or "youtu.be/")
 *   title:     the video title shown on the page
 *   date:      publish date, YYYY-MM-DD
 *   blurb:     one or two sentences shown under the video
 *   src/poster/captions: optional self-hosted MP4, poster image and WebVTT captions (used instead of a YouTube embed)
 *   links:     optional extra links shown under the video
 *   credits:   optional credit lines
 */
export type SlopcoreVideo = {
  youtubeId?: string;
  src?: string;
  poster?: string;
  captions?: string;
  title: string;
  date: string;
  blurb: string;
  links?: { label: string; href: string }[];
  credits?: string[];
};

export const slopcoreVideos: SlopcoreVideo[] = [
  {
    src: "/video/si-slopcore-01-catch-the-ship.mp4",
    poster: "/video/si-slopcore-01-catch-the-ship-poster.webp",
    captions: "/video/si-slopcore-01-catch-the-ship.en.vtt",
    title: "Catch the Ship: AI Techno Anthem for Starship's Chopsticks Catch",
    date: "2026-10-21",
    blurb:
      "What if an AI pop star wrote a peak-time techno anthem about Starship? Nova Red sings the real story: Flight 14's first orbit, 26 Starlink V3 satellites, ~18,000 heat-shield tiles, three booster catches by the Chopsticks, and the planned Flight 15 attempt to catch BOTH stages.",
    links: [
      { label: "Watch on YouTube", href: "https://youtu.be/GwetAoVQPNI" },
      { label: "Watch the Short", href: "https://www.youtube.com/shorts/7otYop5w_sA" },
    ],
    credits: [
      "Song made with Suno",
      "Visuals AI-generated (original). No real SpaceX footage or photos are used.",
      "Character: Nova Red, an AI virtual artist. Series: SI Slopcore. Channel: All In On Musk.",
      "Fan-made news commentary. Not affiliated with SpaceX.",
    ],
  },
];
