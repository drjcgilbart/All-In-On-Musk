"use client";

import { pageFrames } from "@/content/art";
import { glossary, watchlist } from "@/content/records";
import { machines } from "@/content/machines";
import { moreNav, nav, site, tabs } from "@/content/site";
import { DeskMusic } from "@/components/desk-music";
import { PhoneViewToggle } from "@/components/phone-view-toggle";
import { ScrollJumps } from "@/components/scroll-jumps";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";

const catalog = [
  ...nav.map((item) => ({ href: item.href, label: item.label, kind: "Page" })),
  ...moreNav.map((item) => ({ href: item.href, label: item.label, kind: "Page" })),
  { href: "/projects/robotaxi", label: "Florida fleet lab", kind: "Project" },
  ...machines.map((item) => ({ href: `/machines/${item.slug}`, label: item.name, kind: "Machine" })),
  ...machines.flatMap((item) =>
    item.programs.map((program) => ({
      href: `/machines/${item.slug}`,
      label: program.name,
      kind: item.name,
    })),
  ),
  ...watchlist.map((item) => ({ href: "/#watch-title", label: item.name, kind: "Watch" })),
  { href: "/markets", label: "TSLA", kind: "Ticker" },
  { href: "/markets", label: "NASDAQ", kind: "Ticker" },
  { href: "/markets", label: "DJIA", kind: "Ticker" },
  { href: "/markets", label: "S&P 500", kind: "Ticker" },
  { href: "/markets", label: "Russell 2000", kind: "Ticker" },
  { href: "/markets#spacex", label: "SPCX", kind: "Ticker" },
  ...glossary.map((item) => ({ href: `/glossary#${item.term}`, label: item.term, kind: "Term" })),
  { href: "/login", label: "Login", kind: "Page" },
];

function active(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (href.startsWith("/#")) return false;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function DeskAuth({
  admin,
  pathname,
  className,
  onLogout,
}: {
  admin: boolean;
  pathname: string;
  className?: string;
  onLogout: () => void;
}) {
  if (admin) {
    return (
      <button type="button" className={className} onClick={onLogout}>
        Log out
      </button>
    );
  }
  return (
    <Link className={className} href="/login" aria-current={active(pathname, "/login") ? "page" : undefined}>
      Log in
    </Link>
  );
}

function DeskLink({
  href,
  pathname,
  children,
}: {
  href: string;
  pathname: string;
  children: React.ReactNode;
}) {
  const current = active(pathname, href) ? "page" : undefined;
  if (href.includes("/race")) {
    return (
      <a href={href} aria-current={current}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} aria-current={current}>
      {children}
    </Link>
  );
}

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [admin, setAdmin] = useState(false);
  const [askLogout, setAskLogout] = useState(false);
  const [logoutBusy, setLogoutBusy] = useState(false);
  const [logoutError, setLogoutError] = useState("");
  const logoutNoRef = useRef<HTMLButtonElement>(null);
  const frames = pageFrames(pathname);

  useEffect(() => {
    let cancel = false;
    const load = () => {
      fetch("/api/studio/auth", { cache: "no-store" })
        .then((response) => response.json())
        .then((data) => {
          if (!cancel) setAdmin(Boolean(data?.authenticated));
        })
        .catch(() => {
          if (!cancel) setAdmin(false);
        });
    };
    load();
    window.addEventListener("aim-auth", load);
    return () => {
      cancel = true;
      window.removeEventListener("aim-auth", load);
    };
  }, [pathname]);

  useEffect(() => {
    if (!askLogout) return;
    logoutNoRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !logoutBusy) {
        setAskLogout(false);
        setLogoutError("");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [askLogout, logoutBusy]);

  async function confirmLogout() {
    setLogoutBusy(true);
    setLogoutError("");
    try {
      const response = await fetch("/api/studio/auth", { method: "DELETE" });
      if (!response.ok) {
        setLogoutError("Could not log out. Try again.");
        setLogoutBusy(false);
        return;
      }
      setAdmin(false);
      setAskLogout(false);
      window.dispatchEvent(new Event("aim-auth"));
      router.refresh();
    } catch {
      setLogoutError("Could not log out. Try again.");
    } finally {
      setLogoutBusy(false);
    }
  }

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const hits = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const list = needle
      ? catalog.filter((item) => `${item.label} ${item.kind}`.toLowerCase().includes(needle))
      : catalog;
    return list.slice(0, 8);
  }, [query]);

  if (pathname === "/phone-view") {
    return <div className="phone-view-root">{children}</div>;
  }

  return (
    <div className="desk">
      <a className="skip" href="#content">
        Skip to content
      </a>
      <header className="topbar">
        <Link className="word" href="/">
          {site.name}
        </Link>
        <div className="top-scroll">
        <nav className="top-links" aria-label="Primary">
          {admin ? (
            <Link className="nav-btn admin-btn" href="/admin">
              Admin
            </Link>
          ) : null}
          {nav.map((item) =>
            item.label === "Machines" ? (
              <div className="mega" key={item.href}>
                <Link href={item.href} aria-current={active(pathname, item.href) ? "page" : undefined}>
                  {item.label}
                </Link>
                <div className="mega-panel">
                  {machines.map((machine) => (
                    <Link key={machine.slug} href={`/machines/${machine.slug}`}>
                      <span>{machine.index}</span>
                      {machine.name}
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <DeskLink key={item.href} href={item.href} pathname={pathname}>
                {item.label}
              </DeskLink>
            ),
          )}
          <DeskAuth admin={admin} pathname={pathname} className="nav-btn" onLogout={() => setAskLogout(true)} />
        </nav>
        <div className="top-tools">
          {admin ? (
            <Suspense fallback={null}>
              <PhoneViewToggle />
            </Suspense>
          ) : null}
          {admin ? (
            <Link className="nav-btn admin-btn pin-only" href="/admin">
              Admin
            </Link>
          ) : null}
          <DeskAuth admin={admin} pathname={pathname} className="nav-btn pin-only" onLogout={() => setAskLogout(true)} />
          <button className="search-btn" type="button" onClick={() => setOpen(true)}>
            Search
          </button>
        </div>
        </div>
      </header>

      <aside className="rail" aria-label="Primary">
        {admin ? (
          <Link href="/admin" aria-current={active(pathname, "/admin") ? "page" : undefined}>
            Admin
          </Link>
        ) : null}
        {nav.map((item) => (
          <DeskLink key={item.href} href={item.href} pathname={pathname}>
            {item.label}
          </DeskLink>
        ))}
        <DeskAuth admin={admin} pathname={pathname} onLogout={() => setAskLogout(true)} />
        <div className="rail-more">
          {moreNav.map((item) => (
            <Link key={item.href} href={item.href} aria-current={active(pathname, item.href) ? "page" : undefined}>
              {item.label}
            </Link>
          ))}
        </div>
      </aside>

      <div className="desk-main" id="content">
        <div className={frames.length > 1 ? "page-art page-art-row" : "page-art"}>
          {frames.map((frame) => (
            <img key={frame.src + frame.alt} src={frame.src} alt={frame.alt} />
          ))}
        </div>
        {children}
        <footer className="legal">
          <p>{site.disclaimer}</p>
          <p>© 2026. Fan page. My opinion only.</p>
        </footer>
      </div>

      <nav className="tabs" aria-label="Sections">
        {tabs.map((item) => (
          <Link key={item.href} href={item.href} aria-current={active(pathname, item.href) ? "page" : undefined}>
            {item.label}
          </Link>
        ))}
      </nav>

      {open ? (
        <div className="palette" role="dialog" aria-label="Search" onClick={() => setOpen(false)}>
          <div onClick={(event) => event.stopPropagation()}>
            <input
              autoFocus
              value={query}
              placeholder="Machines, pages, terms"
              onChange={(event) => setQuery(event.target.value)}
            />
            <ul>
              {hits.map((item) => (
                <li key={`${item.kind}-${item.href}-${item.label}`}>
                  {item.href.includes("/race") ? (
                    <a href={item.href} onClick={() => setOpen(false)}>
                      <span>{item.kind}</span>
                      {item.label}
                    </a>
                  ) : (
                    <Link
                      href={item.href}
                      onClick={(event) => {
                        event.preventDefault();
                        setOpen(false);
                        router.push(item.href);
                      }}
                    >
                      <span>{item.kind}</span>
                      {item.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
      <ScrollJumps />
      <DeskMusic />
      {askLogout ? (
        <div
          className="logout-ask"
          role="dialog"
          aria-modal="true"
          aria-labelledby="logout-ask-title"
          onClick={() => {
            if (logoutBusy) return;
            setAskLogout(false);
            setLogoutError("");
          }}
        >
          <div onClick={(event) => event.stopPropagation()}>
            <p id="logout-ask-title">Are you sure you want to log out?</p>
            {logoutError ? <p className="logout-ask-error">{logoutError}</p> : null}
            <div className="logout-ask-actions">
              <button type="button" onClick={confirmLogout} disabled={logoutBusy}>
                Yes
              </button>
              <button
                type="button"
                ref={logoutNoRef}
                onClick={() => {
                  setAskLogout(false);
                  setLogoutError("");
                }}
                disabled={logoutBusy}
              >
                No
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
