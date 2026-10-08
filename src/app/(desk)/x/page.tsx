import type { Metadata } from "next";
import { accounts } from "@/content/records";

export const metadata: Metadata = {
  title: "X feed",
  description: "Links out to company accounts on X. This desk does not reprint posts.",
  alternates: { canonical: "/x" },
};

export default function FeedPage() {
  return (
    <>
      <p className="kicker">X</p>
      <h1 className="page-title">Read it there.</h1>
      <p className="lede">Accounts, linked out. No scraped posts, and no invented ones.</p>
      <ul className="question-list">
        {accounts.map((account) => (
          <li key={account.href}>
            <a href={account.href}>{account.name}</a>
          </li>
        ))}
      </ul>
    </>
  );
}
