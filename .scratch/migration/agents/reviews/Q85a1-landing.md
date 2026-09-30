# Q85a1 landing

Position: oculus/migration (the migration plan). Plan step 198 of 293 landed: Q85a1, runtime validation of untyped input on `zod` in the server's `core` and `root` folders. Next, in Axel's order of 2026-09-30: X3d's builder resumed, then `/spec` Q108, Q110 and U2.

## Open items

- Z103, the 42 shapes E2 named in the unbuilt apps design (raised 2026-09-30 19:05 at E2's landing). E2's brief (`agents/briefs/E2.md:101`) says Axel reads them at the landing and rules before any build step is booked. They are the two tables of `agents/reviews/E2-report.md`, section "Shapes named in this step": rows 1 to 17 are the brief's decisions, rows 18 to 42 shapes the builder chose because a builder of the apps needs them, each with the alternative considered. One of them touches the rule that `config/local.yml` holds a secret: row 36, a machine app may name any root the file browser shows in `open({ file })`, the root `engine` included, so it can put `config/local.yml` on screen in a source tab (it never receives the file's text; `DESIGN.md` line 313). (a) All 42 as written. For: the section stands as landed; against: an app can put the file that holds the calendar link on screen, in front of anyone watching the screen. (b) Row 36 changed to every root but `engine`, the other 41 as written; the change is one clause of `DESIGN.md` line 313 and row 36 of the report, made by the build step's `/spec` or as a fix now. For: no app can bring `config/local.yml` or any engine file into view; against: a machine app cannot open an engine file for the reader, which no ruling asked for. (c) You name the rows to change after reading the list; each change is a text fix to line numbers the report gives. Recommended (b), with (c) for anything else you want changed after reading. The lazy option is (a).

## The check of Steps 1

`ListAgents` before the landing listed no agent of this session, only the peer session `ordo-01`, which is not an agent of this plan. Q85a1's builder and both reviewers had ended. Nothing was stopped.

## NOT DONE

- No look: the step changes server code and tests only, no view.
- No A/B: the configuration block names no `bench:`.

## What landed

Base 8155b826, 12 files, 450 insertions and 70 deletions on main: `zod` 4.6.5, pinned exactly in `package.json` and `package-lock.json`, reads the untyped input of `src/lib/server/core/changes.ts` (a line of the change log), `core/json.ts`, `root/hooks.ts` (a hook body and the `notify:` config) and `root/socket.ts` (the subscribe message); the `data/model` types stay the facade through `satisfies`, and the hand checks the schemas replace are deleted. `append` in `changes.ts` now writes a newline before its first record when the log's last line was cut off, so the new record is no longer glued to that line and lost with it (the report's "Behaviour that changed"). One paragraph in `DESIGN.md` at line 148 states how untyped input is read; `README.md` line 13 names `zod` among the runtime dependencies; the entry of `tests/checks/tree/allow-duplication.txt` for the ten lines `root/socket.ts` shared with `machine/pty/channel.ts` is gone, since `socket.ts` no longer holds them. New cases in `tests/server/core/changes.test.ts`, `tests/server/root/hooks.test.ts` and `tests/server/root/socket.test.ts`.

`npm install` on main installed the lock's `zod` 4.6.5 (`added 1 package`); `package-lock.json` has no change beyond the step's.

## Fixes at landing

The two findings of the refutation over repair round 1 (`agents/reviews/Q85a1-refuter.md`, "Repair round 1, refuted"):

1. Spec 1: three inputs of case 24, which the brief holds by the verify list and by no new case, sat as assertions inside the cases for 2 and 8. Removed: `''` and the BOM-prefixed subscribe message from the list in `tests/server/root/socket.test.ts`, and the `events` YAML set line from `tests/server/root/hooks.test.ts`. Cases 2 and 8 are met by their own inputs.
2. Proof 1: the report gave no run of case 11 as rewritten in the round on the unchanged tree. Run at landing on a detached tree at 8155b826 with the round's `changes.test.ts` copied in: `npx vitest run tests/server/core/changes.test.ts -t "own __proto__ keys"` printed the case passing, `Tests  1 passed | 20 skipped (21)`. The case holds a behaviour the change preserves. The report now carries that run, the removal of fix 1, and row 2 of its case table without the removed inputs.

## Verification on main, after the last fix

`npm run diagrams` (exit 0, no change to `docs/diagrams`), then `sh ~/.claude/skills/land/templates/checks.sh .scratch/migration/orchestrator-state.md` from `tools/oculus`, node v24.21.0, exit 0:

```
$ npm test
 Test Files  348 passed | 19 skipped (367)
      Tests  5319 passed | 563 skipped (5882)
$ npm run test:checks
 Test Files  27 passed | 2 skipped (29)
      Tests  365 passed | 9 skipped (374)
$ npm run check
1790788221193 COMPLETED 2472 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build
$ npm run format:check
All matched files use Prettier code style!
$ npm run lint
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 7 commands passed
```

`tests/server/core/changes.test.ts` is tagged slow and does not run in `npm test`. The three touched test files, the slow one included, on main after the fixes: `npx vitest run tests/server/core/changes.test.ts tests/server/root/hooks.test.ts tests/server/root/socket.test.ts` printed `Test Files  3 passed (3)`, `Tests  70 passed (70)`. What this does not cover: the other server folders, whose hand checks are Q85a2 to Q85a5.

## Usage

- Builder, claude-sonnet-5-5: 45 tool uses, 200,240 tokens, 23.5 min; repair round 1: 23 tool uses, 242,981 tokens, 23.7 min.
- Brief check, claude-opus-5-5: 47 tool uses, 250,287 tokens, 13.3 min.
- Reviewer, claude-opus-5-5: 21 tool uses, 176,149 tokens, 14.1 min. Reviewer over round 1, claude-opus-5-5: 22 tool uses, 174,434 tokens, 13.8 min.
- The builder's first report did not pass its bar: the first review found five Standards, one Proof and one Spec finding, all sent in one round. The review over round 1 found every round item closed and left two findings, both fixed at landing.

## Next

X3d's builder resumed, then `/spec` Q108, Q110 and U2, in Axel's order. Q85a2 to Q85a5 are free to be prepared as slots allow.
