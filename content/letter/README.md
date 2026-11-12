# Daily letter

Add an issue by creating `content/letter/YYYY-MM-DD.md`. One file per day. The newest date is the current issue.

The public name and the base path live in `src/content/letter.ts` (`LETTER_NAME`, `LETTER_PATH`). Change them there.

```yaml
---
title: Short title
date: YYYY-MM-DD
summary: One or two sentences for the homepage and the news card.
chip: Reported
---
```

`date` must match the file name. `summary` can also be named `preview`. `chip` is optional: `Confirmed`, `Reported`, or `Rumor`. `Placeholder` is only for a stand-in issue.

Write Markdown under the frontmatter. Raw HTML is shown as text, not rendered. Inline labels: `[Confirmed]`, `[Reported]`, `[Rumor]`. A YouTube link on its own line is a click-to-play embed:

```
https://www.youtube.com/watch?v=VIDEO_ID
```

`2026-11-12.md` is a placeholder. Leave it, and add the real issue 1 as a new date.
