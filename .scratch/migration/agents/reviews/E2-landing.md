# E2 landing

Position: oculus/migration (the migration plan). Plan step 238 of 293 landed: E2, the apps section of DESIGN.md rewritten to the rulings of Z93. Next, in Axel's order of 2026-09-30: the landing of Q85a1, then X3d's builder resumed, then `/spec` Q108, Q110 and U2.

## Open items

- Z103, the 42 shapes E2 named in the unbuilt apps design (raised 2026-09-30 19:05 at E2's landing). E2's brief (`agents/briefs/E2.md:101`) says Axel reads them at the landing and rules before any build step is booked. They are the two tables of `agents/reviews/E2-report.md`, section "Shapes named in this step": rows 1 to 17 are the brief's decisions, rows 18 to 42 shapes the builder chose because a builder of the apps needs them, each with the alternative considered. One of them touches the rule that `config/local.yml` holds a secret: row 36, a machine app may name any root the file browser shows in `open({ file })`, the root `engine` included, so it can put `config/local.yml` on screen in a source tab (it never receives the file's text; `DESIGN.md` line 313). (a) All 42 as written. For: the section stands as landed; against: an app can put the file that holds the calendar link on screen, in front of anyone watching the screen. (b) Row 36 changed to every root but `engine`, the other 41 as written; the change is one clause of `DESIGN.md` line 313 and row 36 of the report, made by the build step's `/spec` or as a fix now. For: no app can bring `config/local.yml` or any engine file into view; against: a machine app cannot open an engine file for the reader, which no ruling asked for. (c) You name the rows to change after reading the list; each change is a text fix to line numbers the report gives. Recommended (b), with (c) for anything else you want changed after reading. The lazy option is (a).

## The check of Steps 1

`ListAgents` before the landing listed no agent of this session: E2's builder and both reviewers had ended. Nothing was stopped.

## NOT DONE

- No look: the step changes `DESIGN.md` only and no view.
- No A/B: the configuration block names no `bench:`.
- Not verified, since nothing is built: every browser behaviour the section relies on; the build step measures them.

## What landed

Base d7af9cac, `tools/oculus/DESIGN.md` only, lines 234 to 326, 41 insertions and 27 deletions before the fixes at landing: the section "Apps added while oculus runs" rewritten to Axel's rulings of 2026-09-30 (`agents/reviews/E1-rulings.md`): apps in the machine's folder and in each root's `.oculus/apps/`, what a root app reaches, the channels, the store, outside addresses, downloads, the `open` method and approval while an app is edited. It is still marked as an unbuilt proposal.

## Fixes at landing

In `DESIGN.md` line 313, the two Spec findings of the refutation over repair round 1:

1. Spec 1: a binary file or a `.docx` opened by `open` was said to open in a source tab "which says the file is binary (`state/sessions/source.svelte.ts:325-326`)"; those lines are the answer to a refused save, and nothing in the tree opens the source tab for a binary file (`views/sources/files/opening.ts:31-40`). The clause now reads "open in the source tab as source text, as every file `open` names does, and no program is started", which is ruling N5 (b).
2. Spec 2: a root app naming a root the file browser does not show had two words. The sentence now gives it `closed` whether or not the file browser shows that root, and gives `missing` to a machine app for a root the file browser does not show, so a root app never learns from the word which roots the machine shows.

In `agents/reviews/E2-report.md`, the other three findings of that refutation:

3. Proof 1: the "No history" row now names the three hits of ` was ` and ` were ` that the round's ruled words brought in (lines 258, 315, 319), none of them history.
4. Proof 2: the policy row names N3 (c), the ruling in `E1-rulings.md:17`.
5. Behaviour 1: the section "Repair round 1" now gives the words before and after for items 3, 4, 6, 7 and 12.

## Verification on main, after the last fix

`npm run diagrams` (no change to `docs/diagrams`), then `sh ~/.claude/skills/land/templates/checks.sh .scratch/migration/orchestrator-state.md` from `tools/oculus`, node v24.21.0, exit 0:

```
$ npm test
 Test Files  348 passed | 19 skipped (367)
      Tests  5304 passed | 557 skipped (5861)
$ npm run test:checks
 Test Files  27 passed | 2 skipped (29)
      Tests  365 passed | 9 skipped (374)
$ npm run check
1790787759875 COMPLETED 2377 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build
$ npm run format:check
All matched files use Prettier code style!
$ npm run lint
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 7 commands passed
```

`LC_ALL=C grep -c '[^ -~]' DESIGN.md` prints 0. What this does not cover: whether the design is right, which is Axel's reading of Z103.

## Usage

- Builder, claude-sonnet-5-5: 103 tool uses, 344,341 tokens, 46.1 min; repair round 1: 15 tool uses, 72,720 tokens, 13.2 min.
- Brief check, claude-opus-5-5: 28 tool uses, 171,296 tokens, 8.4 min.
- Reviewer, claude-opus-5-5: 34 tool uses, 201,995 tokens, 17.8 min. Reviewer over round 1, claude-opus-5-5: 24 tool uses, 185,591 tokens, 9.3 min.
- The builder's first report did not pass its bar: the first review's twelve findings went back in one round of fifteen items. The review over round 1 found every item closed and left five findings, all fixed at landing.

## Next

The landing of Q85a1, then X3d's builder resumed, then `/spec` Q108, Q110 and U2, in Axel's order.
