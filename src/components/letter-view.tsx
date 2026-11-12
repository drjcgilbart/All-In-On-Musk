import Link from "next/link";
import { Chip } from "@/components/chip";
import { LetterMarkdown } from "@/components/letter-markdown";
import { LetterShare } from "@/components/letter-share";
import { LetterSubscribeForm } from "@/components/letter-subscribe-form";
import { LETTER_ARCHIVE_PATH, LETTER_NAME, LETTER_PATH, letterDateLabel, letterIssuePath } from "@/content/letter";
import { issueNeighbors, type LetterIssue } from "@/lib/letter";
import { site } from "@/content/site";

export function LetterView({ issue, onPermalink }: { issue: LetterIssue; onPermalink: boolean }) {
  const { newer, older } = issueNeighbors(issue.date);
  return (
    <article>
      <p className="kicker">
        <Link href={LETTER_PATH}>{LETTER_NAME}</Link>
      </p>
      <h1 className="page-title letter-title">{issue.title}</h1>
      <p className="lede">{issue.summary}</p>
      <p className="mono letter-meta">
        {issue.chip ? <Chip chip={issue.chip} /> : null}
        <time dateTime={issue.date}>{letterDateLabel(issue.date)}</time>
        {issue.issue ? <span>{issue.issue}</span> : null}
        {onPermalink ? null : <span>Current issue</span>}
      </p>
      <LetterShare url={`${site.url}${letterIssuePath(issue.date)}`} title={issue.title} />
      <LetterMarkdown source={issue.body} />
      <nav className="letter-pager" aria-label="Issues">
        {newer ? <Link href={letterIssuePath(newer.date)}>Newer · {letterDateLabel(newer.date)}</Link> : null}
        {older ? <Link href={letterIssuePath(older.date)}>Older · {letterDateLabel(older.date)}</Link> : null}
        <Link href={LETTER_ARCHIVE_PATH}>Archive</Link>
        {onPermalink ? (
          <Link href={LETTER_PATH}>Current issue</Link>
        ) : (
          <Link href={letterIssuePath(issue.date)}>{letterDateLabel(issue.date)}</Link>
        )}
      </nav>
      <LetterSubscribeForm />
    </article>
  );
}
