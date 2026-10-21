/**
 * SI Slopcore Videos: a new monthly series.
 * Add one entry per video. Newest-first sorting is automatic, so order here doesn't matter.
 *   youtubeId: the ID from the YouTube URL (the part after "watch?v=" or "youtu.be/")
 *   title:     the video title shown on the page
 *   date:      publish date, YYYY-MM-DD
 *   blurb:     one or two sentences shown under the video
 */
export type SlopcoreVideo = { youtubeId: string; title: string; date: string; blurb: string };

export const slopcoreVideos: SlopcoreVideo[] = [];
