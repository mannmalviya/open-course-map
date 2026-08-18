# School logos

One file per school, named after the school in `src/model.ts`. Two maps use
this directory:

- `LOGOS` — the compact mark. Drawn in a card's footer slot — 22px tall and up
  to 56px wide, so a crest, a monogram or a short wordmark all read — and next
  to the title on a course page.
- `WORDMARKS` — the landing page's logo row, 26px tall. Only schools whose main
  logo is a seal need an entry; everything else falls back to `LOGOS`. A crest
  scaled to a row of type turns into a blob, which is why Harvard, Stanford,
  Berkeley and UC Santa Cruz carry a separate `-wordmark` file; Yale's Y is a
  monogram, which in a row of names reads as a letter, so it has one too.
  DeepMind, CMU and Cornell have one for the opposite reason: their lockups'
  text vanishes at card size, so the compact file is the bare swirl (DeepMind),
  the initials set in a Didone to match the wordmark (CMU) or "Cornell" cropped
  out of the full lockup, and the row keeps the whole thing.

A school with no file at all is left out of the logo row — it is a wall of
marks, and a name set in type among them looks like a mistake. fast.ai is the
one such school today. Course cards are unaffected: they fall back to the
school's name.

The row inks every mark flat (black in light theme, white in dark) and returns
it to its own colours on hover — in dark theme by flipping luminance and
putting the hue back, since navy and black straight from a brand book are
invisible on a near-black page. What matters in a new file is the shape: a
transparent background, tight cropping, and no baked-in white box. Marks that
still land heavy or small next to the others are nudged in `styles.css`, where
a handful of `.school-logo[src*='…']` rules do the optical sizing.

Sources: the marks are the schools' own, taken from Wikimedia Commons and used
to identify whose lectures a course is. They are trademarks of their
institutions and are not covered by this repository's licence.
