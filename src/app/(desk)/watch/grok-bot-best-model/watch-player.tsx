"use client";

import { InlineVideo } from "@/components/inline-video";

type Props = { videoId: string; title: string };

export function WatchPlayer({ videoId, title }: Props) {
  return (
    <InlineVideo
      youtubeId={videoId}
      title={title}
      posterUrl={`https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`}
      thumbnailUrl={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`}
    />
  );
}
