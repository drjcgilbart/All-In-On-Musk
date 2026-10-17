import { getChannelRss } from "@/lib/channelRss";

/** Latest channel videos, shown at the top of /news (and as a teaser on the homepage). */
export async function NewsVideos({ limit = 6, heading = "Latest videos", moreHref }: { limit?: number; heading?: string; moreHref?: string }) {
  const videos = await getChannelRss(limit);
  if (videos.length === 0) return null;
  return (
    <section className="section news-videos" aria-labelledby="news-videos-title">
      <h2 id="news-videos-title">{heading}</h2>
      <p className="note">
        New from the @allinonmusk channel.{" "}
        <a href={moreHref ?? "https://www.youtube.com/@allinonmusk"} {...(moreHref ? {} : { target: "_blank", rel: "noopener noreferrer" })}>
          {moreHref ? "More on News" : "All videos on YouTube"}
        </a>
      </p>
      <div className="nv-grid">
        {videos.map((v) => {
          const external = v.href.startsWith("http");
          return (
            <a className="plain-card nv-card" href={v.href} key={v.id} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
              <span className="nv-thumb">
                <img src={v.thumbnailUrl} alt="" loading="lazy" />
                <span className="nv-play" aria-hidden="true">▶</span>
              </span>
              <p className="idx">{v.kind === "short" ? "Short" : "Video"} · {v.dateLabel}</p>
              <h3>{v.title}</h3>
            </a>
          );
        })}
      </div>
    </section>
  );
}
