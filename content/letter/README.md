# Daily letter

Add an issue by creating `content/letter/YYYY-MM-DD.md`. One file per day. The newest date is the current issue.

For that day's share card, add `public/letter/og/YYYY-MM-DD.jpg` (1200×675). That same file is the on-page graphic: the banner on `/letter/YYYY-MM-DD` and, when that issue is current, on `/letter`, plus the Latest letter card (feature or row) and the archive thumbnail. Days without the file keep the site-wide share card and the campus banner. No second image file is required.

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

The letter view adds this line under every issue. Leave it out of the markdown:

Prefer to listen? The All In On Musk podcast is on [Spotify](https://open.spotify.com/show/5lt5NyoKlprgjsQB1g65iV).
