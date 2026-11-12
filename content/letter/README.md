# Daily letter

Add an issue by creating `content/letter/YYYY-MM-DD.md`. One file per day. The newest date is the current issue.

The public name and the base path live in `src/content/letter.ts` (`LETTER_NAME`, `LETTER_PATH`). Change them there.

```yaml
---
title: Today in Musk World: YYYY-MM-DD
date: YYYY-MM-DD
issue: Issue 001
subject: The headline shown on the page and the cards
preview: One or two sentences for the homepage and the news card.
permalink: /letter/YYYY-MM-DD
---
```

`date` must match the file name. `subject` is the display headline. `preview` is the card text (`summary` still works if there is no preview). `permalink` is the dated path. `chip` is optional: `Confirmed`, `Reported`, or `Rumor`.

Write Markdown under the frontmatter. Raw HTML is shown as text, not rendered. Desk labels in inline code render as chips: `` `Confirmed` ``, `` `Reported` ``, `` `Rumor` ``, and pairs such as `` `Confirmed / Reported` ``. Bracket labels still work: `[Confirmed]`, `[Reported]`, `[Rumor]`. A YouTube link on its own line is a click-to-play embed:

```
https://www.youtube.com/watch?v=VIDEO_ID
```

A link to `https://allinonmusk.com/shop` is rendered as `/shop`.
