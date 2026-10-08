"use client";

import { news, newsFilters, type NewsItem } from "@/content/news";
import { useMemo, useState } from "react";

export function NewsList({ items = news, showFilters = true }: { items?: NewsItem[]; showFilters?: boolean }) {
  const [filter, setFilter] = useState<string>("All");
  const visible = useMemo(
    () => (filter === "All" ? items : items.filter((item) => item.tags.includes(filter))),
    [filter, items],
  );

  return (
    <div>
      {showFilters ? (
        <div className="filters" role="tablist" aria-label="News filters">
          <button type="button" className={filter === "All" ? "on" : ""} onClick={() => setFilter("All")}>
            All
          </button>
          {newsFilters.map((tag) => (
            <button key={tag} type="button" className={filter === tag ? "on" : ""} onClick={() => setFilter(tag)}>
              {tag}
            </button>
          ))}
        </div>
      ) : null}
      <div className="news-list">
        {visible.length === 0 ? <p className="mono">Nothing tagged {filter} on the starter desk.</p> : null}
        {visible.map((item) => (
          <article key={item.id} className="news-card">
            <p className="mono">
              <span className={`chip chip-${item.chip.toLowerCase()}`}>{item.chip}</span>
              {item.tags[0]} · {item.source} · {item.time}
            </p>
            <h3>
              <a href={item.href} target="_blank" rel="noopener noreferrer">
                {item.title}
              </a>
            </h3>
            <p>{item.summary}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
