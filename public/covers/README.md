# Book covers

Drop a PNG here named `<slug>.png`, where the slug is the `cover` field on a
textbook in `src/data/subjects/*.json`. It shows up on every course page that
assigns that book — `clrs.png` covers both 6.006 and 6.046.

Nothing breaks while a file is missing: the card falls back to title and authors
alone, so covers can be added a few at a time.

Portrait scans work best. They are rendered 52px wide, capped at 78px tall, so
anything above roughly 160×240 is wasted bytes.
