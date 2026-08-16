# School logos

One file per school, named after the school in `src/model.ts`. Two maps use
this directory:

- `LOGOS` — the compact mark. Drawn in the 22px slot on a course card and next
  to the title on a course page, so a crest or monogram is the right shape here.
- `WORDMARKS` — the landing page's logo row, 26px tall. Only schools whose main
  logo is a seal need an entry; everything else falls back to `LOGOS`. A crest
  scaled to a row of type turns into a blob, which is why Harvard, Stanford,
  Berkeley and UC Santa Cruz carry a separate `-wordmark` file.

A school with no file at all still appears — as its name set in type — so
logos can be filled in a few at a time.

The row inks every mark flat (black in light theme, white in dark) and returns
it to its own colours on hover, so mismatched brand palettes and transparent
backgrounds sort themselves out. What matters in a new file is the shape: a
transparent background, tight cropping, and no baked-in white box.

Sources: the marks are the schools' own, taken from Wikimedia Commons and used
to identify whose lectures a course is. They are trademarks of their
institutions and are not covered by this repository's licence.
