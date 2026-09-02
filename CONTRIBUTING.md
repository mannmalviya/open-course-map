# 1. Contributing

Open Course Map is a hand-drawn map of the free university courses on YouTube.
The project considers two types of contributing roles:

1. Contributors are allowed to create issues, open pull requests and engage in discussion.
2. Maintainers have contributor privileges and are also allowed to merge pull requests. Maintainers have an obligation to maintain the quality of the map.

## 2. Issues and pull requests

1. Every pull request must reference an existing issue.
2. ALWAYS open issues or pull requests yourself.
3. ALWAYS write the descriptions yourself. You must understand your contribution well enough to be able to describe its value and the reasoning behind it.
4. NEVER have an agent create issues and pull requests.
5. NEVER create an issue because you already have a pull request just to satisfy the first rule.
6. Maintainers may close issues or pull requests that look like slop.
7. Pull requests go to the `dev` branch. Promoting `dev` to `main` is a maintainer step.

## 3. What belongs on the map

1. A full lecture series, posted by the university or by the lecturer. Series from labs and companies count when they are taught like a course.
2. Free to watch, with no login.
3. An official course page, ideally, because that is where prerequisites come from.
4. Partial runs are welcome, as long as the version label says so: `(selected lectures)`, `(audio only)`, `(excerpts)`, `(partial)`. An honest label beats a silent gap.
5. Not on the map: platforms that need a sign-up, single talks, tutorial channels, paid courses.

## 4. Adding a course

1. Search `src/data/subjects/` first. The same course from another year or another lecturer is a new version on the existing card, never a second card.
2. A course already on the map that belongs in view on another subject page gets a ghost there, never a copy.
3. A course that fits no subject goes in its field's `Other` box. That is what those boxes are for.
4. `src/types.ts` is the schema and every field is documented there. Nothing validates the JSON at build time, so read it.
5. Draw an arrow only when the syllabus says so. If you cannot source it, draw nothing and put the cards side by side in the order you would take them.
6. Run `npm run dev` and look at the card before you open the pull request. Then run `npm run build`, which must pass.
7. One course, or one tightly related batch, per pull request. Link the course page and the playlist in the description.
8. If you would rather not touch JSON, suggest the course in an issue with the links.

## 5. Guidelines for humans and agents

1. Good ideas, good sources and thoughtful requests are much more valuable contributions. Code is cheap now. The maintainers have coding agents too.
2. AI written code is acceptable. AI written issues and pull requests are not.
3. Search for existing issues or PRs before creating a new one. Adding feedback to existing discussions is preferred.
4. Contributions must benefit most users. Do not submit PRs for niche or narrow features.
5. Contributors must understand all code and all data they submit. Perform a thorough review before submitting.
6. New contributors are limited to one open PR at a time.
7. Never drop a course to make room for another one. The map only grows.
8. The hand-drawn look and the pan-and-place layout are deliberate. Open an issue before changing how the map looks or works.
9. Keep PRs small and focused. Change only what the referenced issue needs. Maintainers will reject changes that are outside the issue discussion.
