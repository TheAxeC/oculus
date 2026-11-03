# O126 landing

Roadmap entry: the cockpit-to-oculus migration. Step O126, the Sessions tab's shape. Next: O127, a card shows the year a paper appeared, its repair round 1 under review.

## Open items

None.

## Steps 1

The runner's agent listing showed one subagent, O127's reviewer over round 1 a86efa7addc7ea610, running; none of O126's agents (the builder a60c985f78f84ef3c and the reviewers a5a6eef1ec6ba505c and ac782cca5d8c0891d had each sent their completion notice).

## Not done

Nothing in the brief is left undone. Not seen on the look: the badge "0" of a clean repository (the look's session works in a repository with changes; settled by reading `ChangesRepository.svelte:62,150` and `TreeItem.svelte:245-246`), a Session tab's own Details field, and a 300 px pane (C12's wrap).

## What landed

The whole range from base 936a411b2 (the builder's work under its cases ruling, repair round 1, wip commit 83ddd4349) plus one fix at landing in code, 45 paths. The Sessions tab draws one line between the list and the first section, whose head drops its own top border; every heading is a group row of the Repositories look that folds, with its count as a badge; the session's repository groups are drawn by the Repositories view's own Changes partial; Details is one-line rows under Session, Model and Usage, with Rename, Pin, Resume and Open the transcript on its head.

Verification in the gate, `npm run diagrams && npm run docs:palette && npm run test:quick` with the fix: `test:quick: 111.1 s; every command passed`; the staged diffs of main and the gate are equal under `cmp`.

Fixes at landing: Standards 1 of the review over round 1 (`title-field.ts:22-23`); Standards 2 (`O126-report.md:204`); G104's Code line in `agents/guarded.md`. Behaviour 1 kept: Rename, Pin and Resume on a closed Details open it first.

The look (scratch server on 8797 from the gate, one small session transcript under the scratch HOME), computed style read by JS: the divider stands right above Customizations with no session followed, and right above Details with one followed, the head under it drawing no border and the heads after it their 1 px border; a Pin pick from the head of a closed Details opened it and its outcome row said "saved"; no console error. The server is stopped, and the user's `~/.oculus/sessions.json` is untouched.

## Usage

Builder a60c985f78f84ef3c: first run 285292 tokens, 66 tool uses, 8 min 29 s; after the cases ruling 299779 tokens, 179 tool uses, 33 min 21 s; round 1 156566 tokens, 132 tool uses, 17 min 59 s. Brief check a6698c519c0fa9d0a: 239318 tokens, 72 tool uses, 9 min 27 s. Reviewer a5a6eef1ec6ba505c: 304410 tokens, 92 tool uses, 13 min 50 s. Reviewer over round 1 ac782cca5d8c0891d: 209552 tokens, 45 tool uses, 9 min 28 s. All claude-opus-5-5. The first report did not pass its bar: one repair round.

## Next

O127's review over round 1, then its landing.
