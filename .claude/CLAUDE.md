# Workflow

After adding features, commit with a good commit message and push to `dev`.

## Branches

`main` is protected. `dev` is where work lands.

- Work on `dev`. If `main` is checked out, switch to `dev` before committing.
- Push only to `dev`. Never push to `main`.
- Never merge, rebase, or fast-forward `dev` into `main`. Promoting `dev` to
  `main` is Mann's manual step, and his alone — do not do it even if asked to
  "ship" or "release" something.
- Do not open a pull request against `main` unless Mann asks for one.
