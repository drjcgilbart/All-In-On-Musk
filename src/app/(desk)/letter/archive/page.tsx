import type { Metadata } from "next";
import Link from "next/link";
import { Chip } from "@/components/chip";
import { LETTER_ARCHIVE_PATH, LETTER_NAME, LETTER_PATH, letterDateLabel, letterIssuePath } from "@/content/letter";
import { listIssues } from "@/lib/letter";

export const metadata: Metadata = {
  title: "Archive",
  description: `Past issues of ${LETTER_NAME}.`,
  alternates: { canonical: LETTER_ARCHIVE_PATH },
};

export default function LetterArchivePage() {
  const issues = listIssues();
  return (
    <>
      <p className="kicker">
        <Link href={LETTER_PATH}>{LETTER_NAME}</Link>
      </p>
      <h1 className="page-title">Archive.</h1>
      <p className="lede">Newest first.</p>
      {issues.length === 0 ? <p className="note">No issues yet.</p> : null}
      <ol className="mark-list letter-archive">
        {issues.map((issue) => (
          <li key={issue.date}>
            <p className="mono">
              {issue.chip ? <Chip chip={issue.chip} /> : null}
              {issue.issue ? <span>{issue.issue} · </span> : null}
              <time dateTime={issue.date}>{letterDateLabel(issue.date)}</time>
            </p>
            <h2>
              <Link href={letterIssuePath(issue.date)}>{issue.title}</Link>
            </h2>
            <p>{issue.summary}</p>
          </li>
        ))}
      </ol>
    </>
  );
}
