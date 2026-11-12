import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LetterView } from "@/components/letter-view";
import { LETTER_NAME, letterIssuePath } from "@/content/letter";
import { getIssue, listIssues } from "@/lib/letter";
import { letterAlternates } from "@/lib/letter/meta";

export const dynamicParams = false;

export function generateStaticParams() {
  return listIssues().map((issue) => ({ date: issue.date }));
}

export async function generateMetadata({ params }: { params: Promise<{ date: string }> }): Promise<Metadata> {
  const { date } = await params;
  const issue = getIssue(date);
  if (!issue) return { title: LETTER_NAME };
  return {
    title: issue.title,
    description: issue.summary,
    alternates: letterAlternates(letterIssuePath(issue.date)),
  };
}

export default async function LetterDatePage({ params }: { params: Promise<{ date: string }> }) {
  const { date } = await params;
  const issue = getIssue(date);
  if (!issue) notFound();
  return <LetterView issue={issue} onPermalink />;
}
