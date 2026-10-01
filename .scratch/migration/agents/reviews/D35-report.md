# D35 report

Everything in the brief is done. Every item of the brief and of the ruling is built and the verify list passed on its third full run.

## Open items (verbatim from `orchestrator-state.md`)

The section "Open items" holds no entry. Its body is: "An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is booked as its own step in `plan.md` and carried in the Booked section below, since it needs no ruling from him."

## First run on the unchanged tree

The unchanged tree is a scratch copy (no git was used): the worktree with every changed `src` and `config` file restored from the main checkout and `live-settings.ts` deleted. The final-form tests were run against it: `npx vitest run tests/data/sources/config tests/server tests/routes`. Result: 17 files failed, 118 passed; 132 tests failed, 2408 passed (output in `scratchpad/firstrun3.txt`).

| Test file | Failing on the unchanged tree |
|---|---|
| tests/data/sources/config/settings.test.ts | 6 (slurm days, poll_min, quota_min, the host-before-prewarm order, calendar and mail numbers) |
| tests/data/sources/config/calendar-config.test.ts | 3 (poll_min, days_back, days_ahead sentences) |
| tests/data/sources/config/mail-config.test.ts | 2 (poll_min, per_signal sentences) |
| tests/server/machine/hpc/poll.test.ts | 11 (all of "settings changed while the watcher runs") |
| tests/server/machine/usage/refresh.test.ts | 9 (6 of the set() describe, 3 of the requireRefreshSettings describes) |
| tests/server/machine/usage/watch.test.ts | 2 (tiers change, closed) |
| tests/server/accounts/connect/loop.test.ts | 4 |
| tests/server/accounts/calendar/live.test.ts | 10 |
| tests/server/accounts/mail/live.test.ts | 9 |
| tests/server/root/context.test.ts | 13 (10 of the push describe, 2 of the refresh cadence describe, 1 start-up bounds) |
| tests/server/edit/config-key.test.ts | 52 (45 existing cases fail on the new `write(engine, hub, ...)` signature, 7 new bounds cases fail) |
| tests/server/git/deposit.test.ts | 3 |
| tests/server/content/images.test.ts | 1 |
| tests/routes/docs/wallpaper.test.ts | 3 |
| tests/routes/docs/memories.test.ts | 2 |
| tests/routes/edit/config-key.test.ts | 1 |
| tests/routes/files/project-files.test.ts | 1 |
| tests/views/system/help.test.ts | 1 wording case ("Expected: 'read once when the server starts and used from that value'"); its 2 failures on the copy also include a diagram audit that fails only because the copy has no `docs/diagrams` folder |

The first-run failure lines of each case are listed in `scratchpad/fails.txt` (132 lines, one per failing case). The edit cases of `config-key.test.ts` named "writes the repair of a value the reader refuses ..." and the others of that file fail with a TypeError on the old signature; the 7 bounds cases (`refuses slurm.poll_min of 0 ...` and the rest of "the bounds of the cadences, the day windows and the count") fail on the old reader because it takes any finite number.

Passing on the unchanged tree, named as audits (the behaviour already held, so they do not prove the change; they pin it):
- context.test.ts "hands nothing on for a push whose values equal the ones in force".
- hooks.test.ts, hook.test.ts (the hook target without `config`: a type-level change, enforced by `npm run check`).
- terminal-actions.test.ts portfolio-chat test and compose.test.ts agents test: the options were already honoured when handed in. The change makes `localFor` and `hubFor` required, which `npm run check` enforces, and `grep -rn "loadLocalOrDefaults" src tests` prints nothing.

## Changed `tests/data` cases (ruled)

| File | Before | After |
|---|---|---|
| settings.test.ts, calendar-config.test.ts, mail-config.test.ts | "any finite value" cases: a negative, zero, fractional or huge cadence, window or count was taken | boundary cases: cadence 1 and 35791 read, 0 and 35792 refused with "a number from 1 to 35791"; day windows 0 and 3650 read, -1, 3651, 2.5 refused with "a whole number from 0 to 3650"; `mail.per_signal` 1 and 500 read, 0, 501, 2.5 refused with "a whole number from 1 to 500" |
| `tests/routes/files/file.test.ts` | describe "roots over a machine file that does not read" (lines 215 to 245) | deleted with `loadLocalOrDefaults` |

## Signature-following tests

- `tests/server/edit/config-key.test.ts`: the local `write` wrapper takes the hub; `target(engine, merged, local, server?)`.
- `tests/routes/edit/config-key.test.ts`, `tests/routes/docs/wallpaper.test.ts`, `tests/routes/docs/memories.test.ts`, `tests/routes/files/project-files.test.ts`, `tests/server/content/images.test.ts`: the hub the server started with is handed in.
- `tests/server/root/hooks.test.ts`, `tests/server/root/context-fixture.ts`, `tests/routes/sessions/hook.test.ts`: the `HookRequestTarget` split.
- `tests/routes/sessions/terminal-fixture.ts` (new `startOf(engine)`), `terminal.test.ts`, `terminal-actions.test.ts`, `terminal-edit.test.ts`, `compose.test.ts`: `localFor` and `hubFor` required.
- `tests/server/git/deposit.test.ts`: `local` handed in; the fault message and `knownIds` call updated.

## DONE / NOT DONE

| Row | Check | State |
|---|---|---|
| 13 keys re-read at every config push; pollers have setters | `tests/server/root/context.test.ts` (push describe, 11 cases), `hpc/poll.test.ts`, `accounts/*/live.test.ts`, `connect/loop.test.ts`, `usage/refresh.test.ts`, `usage/watch.test.ts` | DONE |
| Z174 bounds in the readers | settings, calendar-config, mail-config, config-key tests; start-up case in context.test.ts | DONE |
| Z177: `local.yml` read once, `loadLocalOrDefaults` removed | `grep -rn "loadLocalOrDefaults" src tests` prints nothing (exit 1) | DONE |
| options.yml sentences | `grep -c "A change takes effect when the server is started again." config/catalogs/options.yml` = 12; "A change is read again at once." = 4; "keeps the value in force and is logged" = 4; YAML parses | DONE |
| HELP.md and DESIGN.md wording | `tests/views/system/help.test.ts` passes (20 tests) | DONE |
| Diagrams | `npm run diagrams` regenerates `docs/diagrams/` | DONE |
| Types | `npm run check`: 0 ERRORS 0 WARNINGS | DONE |
| Lint and format | `npx eslint .` and `npx prettier --check .` print no finding | DONE |
| Test checks | `npm run test:checks`: 29 files passed, 2 skipped; 442 tests passed, 9 skipped | DONE |
| Full verify list | `npm run diagrams`, then `sh ~/.claude/skills/land/templates/checks.sh .scratch/migration/orchestrator-state.md` ended with `checks: 7 commands passed` | DONE |

Full-list runs: 3. Run 1 failed at `npm test` (a help wording case), run 2 at `npm run test:checks` (8 findings: file size, comment width, text-key readers, a scratch-directory import, an absence assertion), run 3 passed. Each failed command was rerun alone before the next full run.

## Files and line counts

New: `src/lib/server/root/live-settings.ts` 186; `tests/server/accounts/calendar/live.test.ts` 292; `tests/server/accounts/mail/live.test.ts` 227; `tests/server/machine/usage/usage-readers.test.ts` 262.

Changed source (lines): `data/sources/config/settings.ts` 183, `config.ts` 72, `config/local.ts` 332, `accounts/calendar/poll.ts` 335, `accounts/connect/loop.ts` 241, `accounts/mail/poll.ts` 327, `content/images.ts` 337, `content/memories.ts` 178, `content/wallpaper.ts` 118, `edit/writes.ts` 571, `edit/writes/config-key.ts` 333, `edit/writes/undo.ts` 361, `files/project-files.ts` 220, `git/deposit.ts` 835, `git/deposit-routes.ts` 220, `machine/hpc/poll.ts` 340, `machine/pty/chat.ts` 123, `machine/pty/compose.ts` 240, `machine/pty/routes.ts` 552, `machine/usage/refresh.ts` 387, `machine/usage/watch.ts` 208, `root/context.ts` 482, `root/hooks.ts` 291, and the routes `api/write`, `api/(docs)/docs`, `(docs)/memories`, `(docs)/wallpaper`, `(files)/project-files`, `(git)/changes`, `(git)/deposit` (11 to 24 lines each). Also `config/catalogs/options.yml` 617, `HELP.md` 302, `DESIGN.md` 421.

Tests over 700 lines: `context.test.ts` 900 (at the cap), `hpc/poll.test.ts` 839, `refresh.test.ts` 713. No `size-allow` entry was added.

## Paths beyond the brief's list

- `src/routes/api/(git)/deposit/+server.ts` and `src/lib/server/git/deposit-routes.ts`: the deposit route read `local.yml` through the removed function; `knownIds(published, engine, config, local)` and `DepositOptions.local`.
- `tests/views/system/help.test.ts`: the HELP paragraph it pinned was rewritten.
- `tests/server/git/deposit.test.ts`, the terminal and compose tests, `terminal-fixture.ts`: signature following (listed above).
- `tests/server/machine/usage/usage-readers.test.ts` (new) holds the two describes "usage readers over files of the wrong shape" and "Codex rollouts of the wrong shape", moved unchanged out of `refresh.test.ts` (which had grown past the 900-line cap); the folder holds 4 items.
- `tests/data/sources/config/*` and `tests/routes/files/file.test.ts`: ruled.

## Judgment calls

- `liveSettings(hub, start, targets)` in `server/root/live-settings.ts` subscribes a sink to the `config` channel (no replay), reads each group through its own reader, compares with the settings in force (`isDeepStrictEqual`), and hands a poller only a group that changed. A refusal logs `config: <message>; the settings in force are kept` once per message; a read that takes clears it. The pushed `slurm.host` is replaced by the `local.yml` `hpc_host` when the machine names one.
- A retry time counts as the next run when a period changes: a new period m moves the next run to `min(next, now + m * 60000)`; a raise keeps it.
- The HPC watcher drops the results of a poll, quota read or prewarm begun under an older host or window (a generation counter). A host change clears rows, quota and the asked state and polls at once.
- A usage refresh model change applies from the next session started; a session already starting keeps its model.
- `HookTarget` no longer carries `config` or `stopMessage`; `HookRequestTarget = HookTarget & { config, stopMessage? }` is what `handleHookRequest` takes, because the hook route reads them at each request.
- `startOf(engine)` in `terminal-fixture.ts` builds `localFor` and `hubFor` from `loadLocal`, as the route gets them.
- The three catalog sentences the pollers write on a row are read with the literal `textCatalog(config)['key']` form in `live-settings.ts` and `context.ts`, so the text-key check sees each key.

## Visible changes, before and after

- A cadence outside 1 to 35791, a day window outside 0 to 3650, or a mail count outside 1 to 500 is refused with "a number from 1 to 35791", "a whole number from 0 to 3650", "a whole number from 1 to 500" (naming the key); before, any finite number was taken.
- Config page options of the 13 keys: description ends with "A change is read again at once." (4 options) or the start-only options keep "A change takes effect when the server is started again." (12); the refused-value sentence reads "... keeps the value in force and is logged" (4).
- HELP.md line 216 adds: "A change to a cadence, a window, a count or the usage tiers takes effect at once, and a value the server refuses keeps the one in force." Line 236 now reads: "The whole file is read once when the server starts and used from that value; `calendars`, `calendar_dir`, `mail` and `mail_dir` are read again whenever the file changes, from the page or by hand, and hold at once; an edit to any other key holds from the next start."
- DESIGN.md "Hot reload" (line 234) names `server/root/live-settings.ts`; a paragraph at line 236 describes the push path.

## Anything in the brief that was wrong

Nothing found wrong.

## This ruling carried

- Changed `tests/data` cases named with before and after, each quoted failing on the unchanged tree (table above and `scratchpad/fails.txt`).
- `loadLocalOrDefaults` cases of `file.test.ts` deleted and named.
- Signature-following tests listed with what changed.
- Open items copied verbatim.
- Full list run once after the last change; runs counted (3).
- Audits named as audits.

## Not verified

- `prettier --write src tests` reformatted only files this step changed: `npx prettier --check .` is clean now, and the files it rewrote were not compared one by one (no git in this step).
- No server was started; no route was exercised over HTTP.
