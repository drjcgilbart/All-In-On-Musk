import type { Metadata } from "next";
import { connection } from "next/server";
import { ny } from "@/lib/format";
import { presentMuskToday, readMuskToday, viewsLabel } from "@/lib/muskToday";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "What Did Musk Say on X Today?",
  description: "Up to 10 posts from Elon Musk in the last 24 hours.",
  alternates: { canonical: "/musk-today" },
};

export default async function MuskTodayPage() {
  await connection();
  const view = presentMuskToday(await readMuskToday());

  return (
    <>
      <p className="kicker">Today</p>
      <h1 className="page-title musk-today-title">What Did Musk Say on X Today?</h1>
      <p className="lede">Up to 10 posts from Elon Musk in the last 24 hours.</p>
      {view.updatedAt ? <p className="mono musk-today-status">Last updated {ny(view.updatedAt)}.</p> : null}
      {view.notice ? (
        <p className="note stale" role="status">
          {view.notice}
        </p>
      ) : null}
      {view.sortNote ? <p className="mono musk-today-status">{view.sortNote}</p> : null}
      {view.emptyMessage ? <p className="note">{view.emptyMessage}</p> : null}
      {view.posts.length ? (
        <ol className="musk-today-list" aria-label={view.sortNote ?? "Posts from Elon Musk in the last 24 hours"}>
          {view.posts.map((post) => (
            <li key={post.id}>
              <a href={post.href} target="_blank" rel="noopener noreferrer">
                {post.text || "Open this post on X"}
              </a>
              <p className="mono">
                {viewsLabel(post.views)} · {ny(post.createdAt)}
              </p>
            </li>
          ))}
        </ol>
      ) : null}
    </>
  );
}
