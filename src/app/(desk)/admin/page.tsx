import type { Metadata } from "next";
import { cookies } from "next/headers";
import { listMembershipRequests } from "@/lib/membership/store";
import { STUDIO_COOKIE, studioTokenMatches } from "@/lib/studio/auth";
import { StudioClient } from "../studio/studio-client";
import "../journal/journal.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  const jar = await cookies();
  const authed = await studioTokenMatches(jar.get(STUDIO_COOKIE)?.value);
  const requests = authed ? await listMembershipRequests() : [];
  return (
    <>
      <StudioClient authed={authed} mode="admin" />
      {authed ? (
        <section className="section" aria-labelledby="requests-title">
          <h2 id="requests-title">Membership requests</h2>
          <p className="note">
            New requests are emailed to admin@allinonmusk.com. Requests saved on this computer are listed here. The password is kept with the request and is not shown.
          </p>
          {requests.length ? (
            <div className="request-list">
              {requests.map((item) => (
                <article className="request-row" key={item.id}>
                  <h3>{item.name}</h3>
                  <p>
                    <a href={`mailto:${item.email}`}>{item.email}</a>
                    {item.phone ? ` · ${item.phone}` : ""}
                    {item.area ? ` · ${item.area}` : ""}
                  </p>
                  <p className="note">
                    {new Date(item.createdAt).toLocaleString()} · {item.mailed ? "Email sent" : "Email not sent"}
                    {item.mailDetail ? ` · ${item.mailDetail}` : ""}
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <p className="note">No saved requests on this desk yet.</p>
          )}
        </section>
      ) : null}
    </>
  );
}
