import type { Metadata } from "next";
import Link from "next/link";
import { LetterSubscribeForm } from "@/components/letter-subscribe-form";
import { LETTER_NAME, LETTER_PATH, LETTER_SUBSCRIBE_PATH } from "@/content/letter";
import { letterAlternates } from "@/lib/letter/meta";

export const metadata: Metadata = {
  title: `Subscribe to ${LETTER_NAME}`,
  description: `Free ${LETTER_NAME}. Unsubscribe anytime.`,
  alternates: letterAlternates(LETTER_SUBSCRIBE_PATH),
};

export default function LetterSubscribePage() {
  return (
    <>
      <p className="kicker">
        <Link href={LETTER_PATH}>{LETTER_NAME}</Link>
      </p>
      <h1 className="page-title letter-title">Get the letter.</h1>
      <p className="lede">One issue a day. Free. No account.</p>
      <LetterSubscribeForm />
    </>
  );
}
