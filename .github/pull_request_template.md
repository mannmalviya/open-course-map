<!-- One course, or one tightly related batch, per PR. Link the course page and the playlist. Drop the checklist lines that don't apply. -->

## What

## Checklist

- [ ] The playlist is public and complete — or the version label says `(partial)`, `(audio only)`, `(excerpts)` or `(selected lectures)`
- [ ] Every new arrow is sourced from the course page or syllabus, linked above
- [ ] `src/data/views/<playlistId>.json` added for each new playlist (`python3 scripts/fetch-views.py`, stage only the new files)
- [ ] Checked the page in `npm run dev`: card inside its box, title wraps, thumbnail loads
- [ ] `npm run build` passes
