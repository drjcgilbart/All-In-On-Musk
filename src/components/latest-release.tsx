import Link from "next/link";
import { ReleaseImage } from "@/components/release-image";
import { featuredReleaseShowsImage, listReleases, type Release } from "@/lib/releases";

function kindLabel(kind: Release["kind"]) {
  return kind === "letter" ? "Letter" : "Video";
}

function Featured({ release, showImage }: { release: Release; showImage: boolean }) {
  return (
    <Link className={showImage ? "release-feature" : "release-feature release-feature-plain"} href={release.href}>
      {showImage ? <ReleaseImage src={release.image} fallback={release.imageFallback} alt={release.title} /> : null}
      <span className="release-copy">
        <p className="kicker">
          {kindLabel(release.kind)} · <time dateTime={new Date(release.at).toISOString()}>{release.dateLabel}</time>
        </p>
        <h3>{release.title}</h3>
        <p className="release-blurb">{release.blurb}</p>
      </span>
    </Link>
  );
}

function Row({ release }: { release: Release }) {
  const shot = release.kind === "letter" && release.image ? release.image : null;
  const copy = (
    <>
      <p className="mono">
        {kindLabel(release.kind)} · <time dateTime={new Date(release.at).toISOString()}>{release.dateLabel}</time>
      </p>
      <strong>{release.title}</strong>
      <p className="release-line">{release.blurb}</p>
    </>
  );
  return (
    <li>
      <Link className={shot ? "release-row has-shot" : "release-row"} href={release.href}>
        {shot ? (
          <>
            <img className="release-row-shot" src={shot} alt={release.title} width={1200} height={675} />
            <span className="release-row-copy">{copy}</span>
          </>
        ) : (
          copy
        )}
      </Link>
    </li>
  );
}

/** One big card for the newest letter or channel video, then older releases as compact rows. */
export async function LatestRelease({ hideFeaturedLetterImage = false }: { hideFeaturedLetterImage?: boolean } = {}) {
  const { featured, earlier } = await listReleases();
  if (!featured) return null;
  return (
    <section className="section latest-release" aria-labelledby="latest-release-title">
      <h2 id="latest-release-title">Latest</h2>
      <Featured release={featured} showImage={featuredReleaseShowsImage(featured, hideFeaturedLetterImage)} />
      {earlier.length > 0 ? (
        <ol className="release-rows">
          {earlier.map((release) => (
            <Row key={`${release.kind}-${release.id}`} release={release} />
          ))}
        </ol>
      ) : null}
    </section>
  );
}
