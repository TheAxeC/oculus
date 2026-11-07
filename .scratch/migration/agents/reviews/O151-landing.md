# O151 landing

Position: the migration plan, step O151 (a deck for every research project, and the facts strip made smaller), landed. Next: O165 (the guides redesigned), on Axel's approval of its three pages.

Open items: none.

Agents stopped: the runner's agent listing (`ListAgents`) shows no agent of O151; the builder a242c8c8c4aa11ec0 and both reviewers had ended.

NOT DONE: the research hub commit of the decks and of `README.md:60`, which waits on Axel's word.

## What landed

- On main, from base 391708a81, the whole range (the builder's build and repair round 1, in the wip commit b997eb221) with one fix at landing, 4 files, 109 insertions and 53 deletions: `src/lib/themes/slide.css` and `parts/project/Facts.svelte` set the facts strip's values at 12 px and its labels at 10 px at the design size; `parts/project/Project.svelte` lays out the project slide; `tests/checks/config/integrity.test.ts` (G14) reads the decks with the hub's records as the app does, its floor kept.
- In the research hub, uncommitted: 95 decks under `projects/*/present/` (91 of two slides, 4 of one, 186 slides; every first slide `kind: project`, 86 second slides `columns` and 5 `equation`): 50 files changed, 77 new entries, and 36 images removed that no slide names (brief case C5), each still in the hub's git history. `README.md:60` describes the deck as it now is: one or two slides, the first `kind: project`, the second a `columns` or `equation` slide.

## Fixes at landing

- Code: `hubRecords` in `integrity.test.ts` looks a record up with `byKey(entities, id)` from `src/lib/data/helpers/guards.ts`, as `src/lib/server/content/deck/read.ts:98` does (review over round 1, Standards 1).
- Decks, every fact kept: the three slides still too tall after the round (cirrhosis-digital-twin rewritten over its two slides, covert-theory and fed-multicellular-immune slide 1); cirrhosis-digital-twin's facts the round dropped put back; covert-theory's and fed-multicellular-immune's "public" specs; ecg-readable-substrate's slide 2 heading, hook and CODE-15 to MIMIC line; individual-reference-intervals' purpose; the second-slide figures of clinical-hccnet, raw-pls, ward-bttr-crosssubject, hccnet-revision and dries-bttr-ecg given more room by moving items into the text-only column and writing them in fewer words.
- Spec 6 (unapproved scripts) closed under 337 (a) and 715 (a); nothing they printed is used.

## Verification

- Gate worktree at main's head 7b0cabc64, `npm run diagrams && npm run docs:palette && npm run test:quick`: `ok prettier`, `ok ASCII gate`, `ok svelte-kit sync`, `ok svelte-check (13.6 s): ... COMPLETED 589 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`, `ok eslint`, `ok vitest checks (54.2 s)`, `test:quick: 56.8 s; every command passed`. Not covered: tests that reach no changed file within the import depth, the build, the lint of unchanged files.
- G14 from the gate over the scratch hub with the final decks: `Test Files 1 passed (1)`, `Tests 14 passed (14)`.
- Main: the same range cherry-picked with the gate's `integrity.test.ts`; the staged diff equals the gate's under `cmp`.
- The verify list unchanged. A/B: none, `bench: []`.

## The look

On 8799 from the O151 worktree over the scratch hub (`agents/reviews/O151-look.md`, "Landing"): all 95 decks stepped slide by slide after a reload, 372 slides with the portfolio's, then the Findings view held no "slide too tall". The five figures are drawn 215 x 126 (clinical-hccnet), 216 x 152 (raw-pls), 116 x 91 (ward-bttr-crosssubject), 194 x 208 (hccnet-revision) and 250 x 182 (dries-bttr-ecg) design px: a Markdown image on a columns slide takes only the room its column's text leaves (`docs/decks.md`), so with every fact kept these figures stay small, ward's the smallest.

## Usage

The builder's first report did not pass its bar (94 slides too tall, sent back in repair round 1). No diagnosis record. All agents claude-opus-5-5: builder a242c8c8c4aa11ec0, build 329549 tokens, 1538 tool uses, 163.9 min; round 1 to checkpoint 1 302733 tokens, 299 tool uses, 53.3 min; to checkpoint 2 111231 tokens, 65 tool uses, 13.1 min; to checkpoint 3 239048 tokens, 150 tool uses, 32.1 min; to the hand-back 324070 tokens, 234 tool uses, 46.2 min; brief check a9884b252a619f8e8 208952 tokens, 72 tool uses, 13.6 min; reviewer a35359bb43448153a 94045 tokens, 95 tool uses, 15.3 min; reviewer over round 1 a6df3635a2e3bb58c 274604 tokens, 70 tool uses, 10.8 min.
