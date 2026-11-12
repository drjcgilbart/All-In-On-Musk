import type { Metadata } from "next";
import Link from "next/link";
import { LetterUnsubscribe } from "@/components/letter-unsubscribe";
import { LETTER_NAME, LETTER_PATH, LETTER_UNSUBSCRIBE_PATH } from "@/content/letter";
import { letterAlternates } from "@/lib/letter/meta";

export const metadata: Metadata = {
  title: "Unsubscribe",
  description: `Leave ${LETTER_NAME}.`,
  alternates: letterAlternates(LETTER_UNSUBSCRIBE_PATH),
};

export default async function LetterUnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const safe = typeof token === "string" && /^[a-f0-9]{64}$/.test(token) ? token : "";
  return (
    <>
      <p className="kicker">
        <Link href={LETTER_PATH}>{LETTER_NAME}</Link>
      </p>
      <h1 className="page-title letter-title">Unsubscribe.</h1>
      <p className="lede">{safe ? "Use the button. Opening this page does not remove you." : "Enter the email on the list."}</p>
      <LetterUnsubscribe token={safe} />
    </>
  );
}
