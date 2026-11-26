Read `.scratch/migration/agents/spec.md` whole first (the rules file), then `agents/briefs/O195.md` (the step's brief), then `agents/reviews/O195-refuter.md` (the review this round answers), then `agents/reviews/O195-report.md` (the report you rewrite).

# O195, repair round 1

The step's work is in the worktree `.agents/worktrees/migration-O195` at base `ff548136a`. You are a new builder for this round; the step's first builder is stopped. Every change of the round stays inside the step's part. Do each item, then the last round of checks once, then rewrite the report.

## How you run tests (spec.md:26 and :34, restated)

- While working, run a test file only when it covers a file you just changed. Never run the brief's list, or any wide list, before the last round.
- Vitest runs with `TMPDIR` unset, at `nice -n 10`, at most 4 workers, dot reporter, one command at a time, in the foreground.
- After your last change, run the last round once: the 35 test files the review ran (its "Verification lines run" 1) plus `tests/checks/tree/size.test.ts`, then prettier, eslint and the ASCII gate over the changed files, `npm run check`, and `sh utils/unused-exports.sh` diffed against `../migration-O195-base/unused-exports.txt`. Run it again only for a red file the step changed, once, after fixing it. A red file the step does not change is never rerun: name it with its first error line.
- Never `npm run test:quick`, `npm test`, `npm run test:checks`, `npm run test:landing`, `npm run test:slow`, `npm run docs:shots`, or `npx vitest run` with no file.
- The report states how many times you ran each test command, each with its file count.

## What to change

1. (S1) `tests/fixtures/hubs/` may hold ten items. Move `HUB_SCAN` and `HUB_SCAN_LINES` out of `tests/fixtures/hubs/hub-scan.ts` into `tests/fixtures/hubs/hub-build.ts`, whose concern is building a test hub, delete `hub-scan.ts` (with `rm`), and change every import. Grep `tests` for `hub-scan` afterwards: it prints nothing.
2. (P4) The moved `HUB_SCAN` is frozen, the array and each rule (`Object.freeze`), so no reader can change the rules another test reads. `npm run check` stays at 0 errors; where a reader's type needs a mutable array, give that reader a copy at the call site rather than unfreezing.
3. (S2) Rewrap each of these edited comments as a whole paragraph at 100 columns: `src/lib/state/sessions/source/website.svelte.ts` head comment (line 10 is 127 columns), `tests/state/forms/choices.test.ts:66`, `src/lib/state/feeds/feeds.ts:92` and its paragraph, `tests/server/root/watch/deck-folders.test.ts:83` and its paragraph, `tests/routes/sessions/terminal-fixture.ts:253-257` (the paragraph ending short at "Each").
4. (P1) For each test the step adds or changes, quote its failing line on the unchanged tree: the new and changed rows of `tests/data/sources/config/settings/hub-rows.test.ts`, the changed G139 rows of `tests/data/hubs/website-files.test.ts`, and the new row and the changed TIPS and UNSAVED rows of `tests/state/sessions/source/website-store.test.ts`. Do it once, before your other changes: copy the base tree from `../migration-O195-base/` (src, tests, utils, config with no `local.yml`, which it lacks; add `package.json`, `vite.config.ts`, `svelte.config.js`, `tsconfig.json` and a `node_modules` symlink to the worktree's) into `.agents/scratch/base-tree/`, lay the step's current copy of those three test files and of the fixtures they import (`tests/fixtures/hubs/website-hub.ts`) over it, and run those three files there once. A row that passes there is a test of preserved behaviour and the report says so; a row that fails gives its failing line verbatim. Remove `.agents/scratch/base-tree/` afterwards.
5. Nothing else in the code changes. `website.svelte.ts` `off()` and `career.website_no_path` stay as built (SP1 is the orchestrator's at landing).

## The report

Rewrite `.scratch/migration/agents/reviews/O195-report.md` whole for the state after this round. Copy the open items from the state file at the moment you write it. Besides the items above, it:
- gives the case 6 after-run as the rows assert it (`range`, `whole`, `number`), not `field` (P5);
- names under "Changed guarded rows" the new titles of G139, G140 (`guarded.md:230`, 'writes the file website.files names and not the one at the path it replaces') and G125 (`guarded.md:191`, 'compare the file website.files names, and leave the path it replaces alone'), and says that G140's text (`guarded.md:228`) describes a refusal of an empty path that the button now forestalls with `career.website_no_path` (SP1);
- names `src/lib/views/system/findings/AuditSection.svelte:166-167` as a fourth reader of `website.off()` (SP2);
- runs the history-word grep with the spec's whole list, `still` and `always` included, and quotes it (S3);
- quotes the grep run before each new name (`HUB_SCAN`, `HUB_SCAN_LINES`, `PATHS`, `HEADER`, `FILE_SETTINGS`, `FILE_LINES`), and states the empty, duplicate and collision cases of each new key (`stale_days`, `career.website_no_path`, `sessions.f_id`, `focus.command.radar_glyph`, `focus.command.refresh_radar_plain`) (S4);
- puts under "Visible changes" the Settings refusal sentence of a bad task name, before "such as litwatch" and after "such as weekly-digest" (B1), and the second-hub change: a hub whose `update_tasks` rows set no `stale_days` was nudged at 14, 7 and 2 days and now never is (B2);
- keeps the run table of the first build as it is and adds this round's runs.

After the round's last change, run the last round of checks once as above and quote its final lines in the report; a red line in a file you touched is fixed before hand-back.

## Paths this round writes

- `tests/fixtures/hubs/hub-build.ts`
- `tests/fixtures/hubs/hub-scan.ts` (deleted)
- each test file and fixture that imports `hub-scan.ts` (import line only)
- `src/lib/state/sessions/source/website.svelte.ts` (comment only)
- `src/lib/state/feeds/feeds.ts` (comment only)
- `tests/state/forms/choices.test.ts` (comment only)
- `tests/server/root/watch/deck-folders.test.ts` (comment only)
- `tests/routes/sessions/terminal-fixture.ts` (comment only)
- `.scratch/migration/agents/reviews/O195-report.md`
