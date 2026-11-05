# O152 landing

Position: the cockpit-to-oculus migration, step O152 (the Venue tag's tier icon); in flight beside it O147 (the Present view's filter bar), its repair round 1 next; then O148 (the Project facts strip) once O147 lands.

## Open items, verbatim

None.

## The check of Steps 1

`ListAgents` listed one subagent, a531dbf1711f69533, the reviewer of O147, and no agent of O152: the builder a94ae9654f1813d77, the brief check and both reviewers had finished.

## NOT DONE

Nothing of the step. The Settings view's glyph field of `venue_tiers` (case C11) was not looked at, since the scratch workspace holds no oculus folder and `catalogs/vocab.yml` cannot be opened there; it rests on the options entry and `config-folder.test.ts`.

## What landed

The whole range from base 3ad2d2346 (the wip commit a4013a93d: the builder's first run and repair round 1), 20 paths counted without renames:

- Each `venue_tiers` row of `config/catalogs/vocab.yml` carries a `glyph` (flagship `crown`, strong `star`, specialist `target`, unrated none); `crown` and `target` are added to `glyphs.yml` and `icons.yml`; `config/options/catalogs/vocab.yml` describes the field with `control: glyph`.
- `venueTierMark` (`src/lib/state/boards/structure/lines.ts`) reads the tier row and its hue from the words of the venue's own hub, through the new `wordsTone` of `src/lib/state/shared/words/tones.ts`; `tierRowShape` takes `glyph` and `assignable`, which also gives the Pillars line cards their tier counts.
- The project card's Venue tag draws the tier glyph in the tier's hue, as a tab stop named by the tier's label whose tip shows on hover and keyboard focus, then the venue's name, quartile and JIF, without the cost.

Fixes at landing, from the review over round 1:

- `tests/state/shared/hub-words.test.ts`: the planted hub `lab` also holds a blank glyph and a `specialist` row with no glyph, both read through the server's parse and `vocabOf` and checked null; the board-item half is installed with `home` as its primary, as its snapshot has it; the head comment says the venue tier rows read words built in the case. The case runs in 446 ms.
- The head comment of `tones.ts` says `wordsTone` reads only the words it is handed; the head comment of `lines.ts` names `wordsTone`'s module and its rune as the second tie to the page's words.
- `agents/guarded.md` G127's Code line names `venueTierMark`.

## What was found

- The first review found no broken item; repair round 1 closed its six points (the stop's accessible name, the HELP sentence, the `lines.ts` head comment, one source for a tier's row and tone, the test's time, the case-program sources).
- The review over round 1: Proof P1 and Standards 1 and 2, fixed above; Proof P2 and the kept scratch programs are lines of the builder's report.
- The builder's inline `python3` edit of the test in round 1 is a breach of `agents/spec.md` under the standing ruling "Unapproved builder scripts", recorded in the booking; its two hunks were read whole and kept. `tones.ts` lay outside the brief's path list and is named by round item 4.

## Verification

In the gate worktree at main's head e7c35c940, `npm run diagrams && npm run docs:palette && npm run test:quick` (20 changed files, 24 test files): `ok prettier (1.0 s)`, `ok ASCII gate (1.1 s)`, `ok svelte-kit sync (2.7 s)`, `ok eslint (25.5 s)`, `ok vitest slow (61.9 s)`, `ok svelte-check (82.5 s): ... COMPLETED 582 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`, `ok vitest (142.3 s)`, `ok vitest checks (142.3 s)`, `test:quick: 145.3 s; every command passed`. Not covered: tests that reach no changed file within the import depth, the build, the lint of unchanged files.

On main the same range cherry-picked and the three fixed files copied; `git diff --cached --no-renames e7c35c940` equals the gate's under `cmp`. A/B: none, `bench: []`. The verify list unchanged.

## The look

On a scratch server on 8797 from the gate, with the scratch hub:

- The Projects board draws 21 tier marks: 9 purple crowns labelled flagship, 10 teal stars labelled strong, 2 cyan targets labelled specialist; 2 venues with no tier keep the `venue` glyph.
- Keyboard focus on the first star (`:focus-visible`) opens its tip "strong".
- The Pillars view's line cards read their tier counts, "6 flagship 5 strong 2 specialist 7 unrated" on Interpretable Structured-Tensor Methods.
- Under Phosphor Amber with the brackets on and the icons off: `[*] Artificial Intelligence in Medicine | Q1 | JIF 7.8` and `[ (+) Medical & Biological Engineering & Computing | Q2 | JIF ... ]`, one bracket pair each.
- The scratch workspace file's theme, icons and brackets are put back as they were, the scratch HOME's `.oculus` equals its backup, the server is stopped and 8797 is free.

## Agents

- Builder a94ae9654f1813d77 (claude-opus-5-5): first run 349041 tokens, 154 tool uses, 29 min 41 s; round 1 163702 tokens, 72 tool uses, 17 min 21 s.
- Brief check a43403bea8848ebc5 (claude-opus-5-5, 223233 tokens, 61 tool uses, 10 min 42 s).
- Reviewer a8593b71051db912f (claude-opus-5-5, 204111 tokens, 49 tool uses, 12 min 2 s).
- Reviewer over round 1 a3bc7f695b9d78298 (claude-opus-5-5, 227128 tokens, 52 tool uses, 13 min 29 s).

The builder's first report did not pass its bar (one repair round). No diagnosis record.

## Next

O147's repair round 1 from its review, the review over the round, then its landing; O148 after.
