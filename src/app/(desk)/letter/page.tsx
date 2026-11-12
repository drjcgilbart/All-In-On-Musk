import type { Metadata } from "next";
import { LetterSubscribeForm } from "@/components/letter-subscribe-form";
import { LetterView } from "@/components/letter-view";
import { LETTER_NAME, LETTER_PATH } from "@/content/letter";
import { getCurrentIssue } from "@/lib/letter";
import { letterAlternates } from "@/lib/letter/meta";

export async function generateMetadata(): Promise<Metadata> {
  const issue = getCurrentIssue();
  if (!issue) {
    return {
      title: LETTER_NAME,
      description: `The current issue of ${LETTER_NAME}.`,
      alternates: letterAlternates(LETTER_PATH),
    };
  }
  return {
    title: issue.title,
    description: issue.summary,
    alternates: letterAlternates(LETTER_PATH),
  };
}

export default function LetterPage() {
  const issue = getCurrentIssue();
  if (!issue) {
    return (
      <>
        <p className="kicker">{LETTER_NAME}</p>
        <h1 className="page-title">No issue yet.</h1>
        <p className="lede">The next file in the letter folder becomes the current issue.</p>
        <LetterSubscribeForm />
      </>
    );
  }
  return <LetterView issue={issue} onPermalink={false} />;
}
