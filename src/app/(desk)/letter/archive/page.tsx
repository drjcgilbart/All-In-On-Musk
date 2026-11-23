import type { Metadata } from "next";
import Link from "next/link";
import { Chip } from "@/components/chip";
import { LETTER_ARCHIVE_PATH, LETTER_NAME, LETTER_PATH, LETTER_RSS_PATH, letterDateLabel, letterIssuePath } from "@/content/letter";
import { listIssues } from "@/lib/letter";
import { letterAlternates } from "@/lib/letter/meta";
import { letterHasShareImage, letterOgPublicPath } from "@/lib/letter/share";

export const metadata: Metadata = {
  title: "Archive",
  description: `Past issues of ${LETTER_NAME}.`,
  alternates: letterAlternates(LETTER_ARCHIVE_PATH),
};

export default function LetterArchivePage() {
  const issues = listIssues();
  return (
    <>
      <p className="kicker">
        <Link href={LETTER_PATH}>{LETTER_NAME}</Link>
      </p>
      <h1 className="page-title">Archive.</h1>
      <p className="lede">
        Newest first. <Link className="letter-quiet" href={LETTER_RSS_PATH}>RSS</Link>
      </p>
      {issues.length === 0 ? <p className="note">No issues yet.</p> : null}
      <ol className="mark-list letter-archive">
        {issues.map((issue) => {
          const href = letterIssuePath(issue.date);
          const shot = letterHasShareImage(issue.date) ? letterOgPublicPath(issue.date) : null;
          return (
            <li key={issue.date}>
              {shot ? (
                <Link className="letter-archive-shot-link" href={href}>
                  <img className="letter-archive-shot" src={shot} alt={issue.title} width={1200} height={675} />
                </Link>
              ) : null}
              <div className="letter-archive-copy">
                <p className="mono">
                  {issue.chip ? <Chip chip={issue.chip} /> : null}
                  {issue.issue ? <span>{issue.issue} · </span> : null}
                  <time dateTime={issue.date}>{letterDateLabel(issue.date)}</time>
                </p>
                <h2>
                  <Link href={href}>{issue.title}</Link>
                </h2>
                <p>{issue.summary}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </>
  );
}
