import Link from "next/link";
import { Chip } from "@/components/chip";
import { LETTER_ARCHIVE_PATH, LETTER_NAME, LETTER_PATH, letterDateLabel } from "@/content/letter";
import type { LetterIssue } from "@/lib/letter";

export function LetterCard({
  issue,
  titleAs = "h2",
  showName = false,
}: {
  issue: LetterIssue;
  titleAs?: "h2" | "h3";
  showName?: boolean;
}) {
  const Title = titleAs;
  return (
    <article className="letter-card">
      {showName ? <p className="kicker">{LETTER_NAME}</p> : null}
      <p className="mono">
        {issue.chip ? <Chip chip={issue.chip} /> : null}
        <time dateTime={issue.date}>{letterDateLabel(issue.date)}</time>
      </p>
      <Title>
        <Link href={LETTER_PATH}>{issue.title}</Link>
      </Title>
      <p>{issue.summary}</p>
      <p className="letter-actions">
        <Link className="letter-cta" href={LETTER_PATH}>
          Today&apos;s letter
        </Link>
        <Link className="letter-quiet" href={LETTER_ARCHIVE_PATH}>
          Past issues
        </Link>
      </p>
    </article>
  );
}
