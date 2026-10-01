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

Tests over 700 lines after repair round 1: `context.test.ts` 813, `refresh.test.ts` 725, `deposit.test.ts` 778. No `size-allow` entry was added.

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

One point of the brief's item 2 differs from the code: the hook target keeps `recordFor` beside `store`, `hub`, `limiter` and `logged`. `handleHookRequest` reads it at `src/lib/server/root/hooks.ts:273` (`into.recordFor?.(event.session)`) to look up the session of each event, so a target without it would answer every event as if its session were unknown. Items 1 to 13 are otherwise as built.

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

# Repair round 1

Everything in the round is done. Full-list runs this round: 2 (the first ended at `npm run test:checks` with two findings, a comment line over 100 columns and a block of lines held twice under `tests`; the second passed). Full-list runs for the whole step: 5.

## Open items (verbatim from `orchestrator-state.md`)

The section "Open items" holds no entry. Its body: "An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is booked as its own step in `plan.md` and carried in the Booked section below, since it needs no ruling from him."

## Items

1. **Spec 1, hook target.** No code. The text under "Anything in the brief that was wrong" now says the hook target keeps `recordFor` beside `store`, `hub`, `limiter` and `logged`, because `handleHookRequest` reads it at `src/lib/server/root/hooks.ts:273`.
2. **Spec 2, `set` after close.** `src/lib/server/machine/usage/refresh.ts`: `if (closed) return;` now comes before `requireRefreshSettings(next)`. New test in `tests/server/machine/usage/refresh.test.ts`, "returns for a setting its reader refuses once it is closed". With the two lines in the old order it fails: `AssertionError: expected [Function] to not throw an error but 'Error: config/behavior.yml: usage_ref...' was thrown`.
3. **Spec 3, deposit `local`.** `DepositOptions` in `src/lib/server/git/deposit.ts` is now the common fields plus either no start values or all three of `engine`, `config` and `local` (type `DepositStart`), so a caller that names the engine without `local` does not compile. `knownIds` in `src/lib/server/git/deposit-routes.ts` has two signatures: `knownIds(published?)` and `knownIds(published, engine, config, local)`, `local` required in the second. The `catch {}` in `knownIds` is unchanged. `tests/server/git/deposit.test.ts`: the loop that calls with the engine alone and with the engine and config carries `// @ts-expect-error a caller that leaves `local` out is refused by the types` (one directive for both calls), which fails `npm run check` if the call ever compiles. `npm run check`: 0 ERRORS.
4. **Proof 1, first runs.** Scratch copy at `$TMPDIR/d35-unchanged`: the worktree's `tools/oculus` (without `node_modules`, `.svelte-kit`, `build`, `config/local.yml`, `.scratch`, `.agents`), the 31 base files copied over it from `scratchpad/D35-base/tools/oculus` (`find ... -type f | wc -l` prints 31), `src/lib/server/root/live-settings.ts` deleted (`ls src/lib/server/root | grep -c live-settings` prints 0), the final tests kept. HELP.md and DESIGN.md are in their new text in the copy (they are not among the 31). Each file run with `npx vitest run <file> --reporter=verbose`; result lines:

```
tests/data/sources/config/settings.test.ts :: Tests  6 failed | 46 passed (52)
tests/data/sources/config/calendar-config.test.ts :: Tests  3 failed | 15 passed (18)
tests/data/sources/config/mail-config.test.ts :: Tests  2 failed | 15 passed (17)
tests/server/machine/hpc/poll.test.ts :: Tests  20 passed (20)
tests/server/machine/hpc/poll-live.test.ts :: Tests  15 failed (15)
tests/server/machine/usage/refresh.test.ts :: Tests  10 failed | 29 passed (39)
tests/server/machine/usage/watch.test.ts :: Tests  2 failed | 14 passed (16)
tests/server/machine/usage/usage-readers.test.ts :: Tests  10 passed (10)
tests/server/accounts/connect/loop.test.ts :: Tests  6 failed | 6 passed (12)
tests/server/accounts/calendar/live.test.ts :: Tests  11 failed (11)
tests/server/accounts/mail/live.test.ts :: Tests  10 failed (10)
tests/server/root/context.test.ts :: Tests  14 failed | 10 passed (24)
tests/server/root/hooks.test.ts :: Tests  38 passed (38)
tests/routes/sessions/hook.test.ts :: Tests  4 passed (4)
tests/server/edit/config-key.test.ts :: Tests  52 failed (52)
tests/server/git/deposit.test.ts :: Tests  3 failed | 29 passed (32)
tests/server/content/images.test.ts :: Tests  1 failed | 31 passed (32)
tests/routes/docs/wallpaper.test.ts :: Tests  3 failed | 15 passed (18)
tests/routes/docs/memories.test.ts :: Tests  2 failed | 25 passed (27)
tests/routes/edit/config-key.test.ts :: Tests  1 failed | 14 passed (15)
tests/routes/files/project-files.test.ts :: Tests  1 failed | 4 passed (5)
tests/routes/files/file.test.ts :: Tests  24 passed (24)
tests/routes/sessions/terminal.test.ts :: Tests  17 passed (17)
tests/routes/sessions/terminal-actions.test.ts :: Tests  21 passed (21)
tests/routes/sessions/terminal-edit.test.ts :: Tests  21 passed (21)
tests/routes/sessions/compose.test.ts :: Tests  11 passed (11)
tests/views/system/help.test.ts :: Tests  20 passed (20)
```

   Cases of new behaviour that pass on the unchanged tree: `context.test.ts` "hands nothing on for a push whose values equal the ones in force" (an audit; its title says so); `hooks.test.ts` and `hook.test.ts` (the hook target split is a type change, enforced by `npm run check`); the portfolio-chat test in `terminal-actions.test.ts` and the agents test in `compose.test.ts` (audits: the options were already honoured when handed in; the change makes them required, enforced by `npm run check`); `file.test.ts` (a deletion); `usage-readers.test.ts` (two describes moved unchanged out of `refresh.test.ts`, preserved behaviour); `poll.test.ts` (its 20 cases are the ones that predate the step). `help.test.ts` passes in the copy because the copy holds the new HELP.md; on the earlier copy with the old HELP.md its wording case failed with `Expected: "read once when the server starts and used from that value"`. The rest of the partial-pass files (settings, calendar-config, mail-config, refresh, watch, loop, context, deposit, images, wallpaper, memories, routes config-key, project-files) pass only on cases that predate the step; the failing ones are listed below.

   Every failing case with its first assertion line (142 cases, from `scratchpad/first-assertions.txt`):

```
data/sources/config/calendar-config.test.ts > calendarSettings > throws "calendar.poll_min must be a number from 1 to 35791"
    AssertionError: expected [Function] to throw error including 'config/behavior.yml: calendar.poll_mi…' but got 'config/behavior.yml: calendar.poll_mi…'
data/sources/config/calendar-config.test.ts > calendarSettings > throws "calendar.days_back must be a whole number from 0 to 3650"
    AssertionError: expected [Function] to throw error including 'config/behavior.yml: calendar.days_ba…' but got 'config/behavior.yml: calendar.days_ba…'
data/sources/config/calendar-config.test.ts > calendarSettings > throws "calendar.days_ahead must be a whole number from 0 to 3650"
    AssertionError: expected [Function] to throw error including 'config/behavior.yml: calendar.days_ah…' but got 'config/behavior.yml: calendar.days_ah…'
data/sources/config/mail-config.test.ts > mailSettings > throws "mail.poll_min must be a number from 1 to 35791"
    AssertionError: expected [Function] to throw error including 'config/behavior.yml: mail.poll_min mu…' but got 'config/behavior.yml: mail.poll_min mu…'
data/sources/config/mail-config.test.ts > mailSettings > throws "mail.per_signal must be a whole number from 1 to 500"
    AssertionError: expected [Function] to throw error including 'config/behavior.yml: mail.per_signal …' but got 'config/behavior.yml: mail.per_signal …'
data/sources/config/settings.test.ts > slurmSettings > refuses a days that is not a number or is past its bound
    AssertionError: expected { Object (threw) } to strictly equal { Object (threw) }
data/sources/config/settings.test.ts > slurmSettings > refuses a poll_min that is not a number or is past its bound
    AssertionError: expected { Object (threw) } to strictly equal { Object (threw) }
data/sources/config/settings.test.ts > slurmSettings > refuses a quota_min that is not a number or is past its bound
    AssertionError: expected { Object (threw) } to strictly equal { Object (threw) }
data/sources/config/settings.test.ts > slurmSettings > refuses the host before the prewarm and the prewarm before the numbers
    AssertionError: expected { Object (threw) } to strictly equal { Object (threw) }
data/sources/config/settings.test.ts > calendarSettings > refuses each number that is not a number or is past its bound, naming the key
    AssertionError: expected { Object (threw) } to strictly equal { Object (threw) }
data/sources/config/settings.test.ts > mailSettings > refuses each number that is not a number or is past its bound, naming the key
    AssertionError: expected { Object (threw) } to strictly equal { Object (threw) }
routes/docs/memories.test.ts > the configured folder > resolves the configured directory under the hub
    AssertionError: expected '/var/folders/7r/49ks4w4558vcr57tvb9sv…' to be '/var/folders/7r/49ks4w4558vcr57tvb9sv…' // Object.is equality
routes/docs/memories.test.ts > the configured folder > resolves the directory under the hub it is given, though local.yml names another since
    AssertionError: expected '/var/folders/7r/49ks4w4558vcr57tvb9sv…' to be '/var/folders/7r/49ks4w4558vcr57tvb9sv…' // Object.is equality
routes/docs/wallpaper.test.ts > the configured settings > reads the configured directory under the hub it is given
    AssertionError: expected { …(3) } to deeply equal { …(3) }
routes/docs/wallpaper.test.ts > the configured settings > reads the directory under the hub it is given, though local.yml names another since
    AssertionError: expected { …(3) } to deeply equal { …(3) }
routes/docs/wallpaper.test.ts > the configured settings of the wrong shape > reads a file that is not text as no file, the key still present
    AssertionError: expected { …(3) } to strictly equal { …(3) }
routes/edit/config-key.test.ts > the hub of a write target > is the hub the server started with, though local.yml names another since
    AssertionError: expected '/var/folders/7r/49ks4w4558vcr57tvb9sv…' to be '/var/folders/7r/49ks4w4558vcr57tvb9sv…' // Object.is equality
routes/files/project-files.test.ts > the target of the route > names the hub the server started with, though local.yml names another since
    AssertionError: expected '/var/folders/7r/49ks4w4558vcr57tvb9sv…' to be '/var/folders/7r/49ks4w4558vcr57tvb9sv…' // Object.is equality
server/accounts/calendar/live.test.ts > a calendar poller whose settings change > reads an account that is due in 15 minutes 5 minutes after the period becomes 5
    TypeError: watcher.setSettings is not a function
server/accounts/calendar/live.test.ts > a calendar poller whose settings change > moves an account in retry to 1 minute after the push when the period becomes 1
    TypeError: watcher.setSettings is not a function
server/accounts/calendar/live.test.ts > a calendar poller whose settings change > keeps the retry time of an account in retry when the period becomes 5
    TypeError: watcher.setSettings is not a function
server/accounts/calendar/live.test.ts > a calendar poller whose settings change > leaves an account due in 3 minutes at 3 when the period is raised to 60
    TypeError: watcher.setSettings is not a function
server/accounts/calendar/live.test.ts > a calendar poller whose settings change > publishes again with the new period when only the period changed, reading nobody
    TypeError: watcher.setSettings is not a function
server/accounts/calendar/live.test.ts > a calendar poller whose settings change > reads every account at once through the new window, and publishes it
    TypeError: watcher.setSettings is not a function
server/accounts/calendar/live.test.ts > a calendar poller whose settings change > does nothing for settings equal to the ones in force
    TypeError: watcher.setSettings is not a function
server/accounts/calendar/live.test.ts > a calendar poller whose settings change > writes the pushed sentence on the next row of the kind it is
    TypeError: missing.watcher.setWords is not a function
server/accounts/calendar/live.test.ts > a calendar poller whose settings change > writes the pushed timeout sentence on the next row that a request without an answer leaves
    TypeError: watcher.setWords is not a function
server/accounts/calendar/live.test.ts > a calendar poller whose settings change > does nothing once it is closed: no timer, no read, no publish
    TypeError: watcher.setSettings is not a function
server/accounts/calendar/live.test.ts > a calendar poller whose settings change > publishes the new window and period when no account is configured
    TypeError: watcher.setSettings is not a function
server/accounts/connect/loop.test.ts > a period that changes while the loop runs > moves the next read of an account to the new period from now when that is sooner
    TypeError: loop.setPollMin is not a function
server/accounts/connect/loop.test.ts > a period that changes while the loop runs > leaves an account due sooner where it is, and reads again at the new period after it
    TypeError: loop.setPollMin is not a function
server/accounts/connect/loop.test.ts > a period that changes while the loop runs > treats the retry time of an account that failed as its next read
    TypeError: loop.setPollMin is not a function
server/accounts/connect/loop.test.ts > a period that changes while the loop runs > does nothing once the loop is closed
    TypeError: loop.setPollMin is not a function
server/accounts/connect/loop.test.ts > settings that change while a round runs > arms the next round at the new period after the round that was running ends
    TypeError: loop.setPollMin is not a function
server/accounts/connect/loop.test.ts > settings that change while a round runs > runs one follow-up round at the new window after the round ends, however many changes came
    TypeError: takeLoopSettings is not a function
server/accounts/mail/live.test.ts > a mail poller whose settings change > reads an account that is due in 15 minutes 5 minutes after the period becomes 5
    TypeError: watcher.setSettings is not a function
server/accounts/mail/live.test.ts > a mail poller whose settings change > moves an account in retry to 1 minute after the push when the period becomes 1
    TypeError: watcher.setSettings is not a function
server/accounts/mail/live.test.ts > a mail poller whose settings change > keeps the retry time of an account in retry when the period becomes 5
    TypeError: watcher.setSettings is not a function
server/accounts/mail/live.test.ts > a mail poller whose settings change > leaves an account due in 3 minutes at 3 when the period is raised to 60
    TypeError: watcher.setSettings is not a function
server/accounts/mail/live.test.ts > a mail poller whose settings change > publishes again with the new period when only the period changed, reading nobody
    TypeError: watcher.setSettings is not a function
server/accounts/mail/live.test.ts > a mail poller whose settings change > reads every account at once asking each listing for the new count
    TypeError: watcher.setSettings is not a function
server/accounts/mail/live.test.ts > a mail poller whose settings change > does nothing for settings equal to the ones in force
    TypeError: watcher.setSettings is not a function
server/accounts/mail/live.test.ts > a mail poller whose settings change > writes the pushed sentence on the next row that a request without an answer leaves
    TypeError: watcher.setWords is not a function
server/accounts/mail/live.test.ts > a mail poller whose settings change > does nothing once it is closed: no timer, no read, no publish
    TypeError: watcher.setSettings is not a function
server/accounts/mail/live.test.ts > a mail poller whose settings change > publishes the new period and reads nothing when no account is configured
    TypeError: watcher.setSettings is not a function
server/content/images.test.ts > the folder a configuration block names > names the folder under the hub, and none that leaves it, saying so once
    AssertionError: expected '/var/folders/7r/49ks4w4558vcr57tvb9sv…' to be '/var/folders/7r/49ks4w4558vcr57tvb9sv…' // Object.is equality
server/edit/config-key.test.ts > one value written over its own bytes > replaces the value and keeps every other byte, the comment on its line included
    AssertionError: expected [] to deeply equal [ 'behavior.yml:changes.keep' ]
server/edit/config-key.test.ts > one value written over its own bytes > writes nothing for the value the file already holds
    AssertionError: expected { changed: [], refused: [ { …(2) } ] } to deeply equal { changed: [], refused: [] }
server/edit/config-key.test.ts > one value written over its own bytes > writes a key three segments deep, in the style its line used
    AssertionError: expected [ [], [] ] to deeply equal [ …(2) ]
server/edit/config-key.test.ts > one value written over its own bytes > keeps the quote style of the line, the apostrophe of a single-quoted one doubled
    AssertionError: expected [] to deeply equal [ 'behavior.yml:usage_refresh_model' ]
server/edit/config-key.test.ts > one value written over its own bytes > writes a choice that is one of its values and a toggle that is a boolean
    AssertionError: expected [] to deeply equal [ 'appearance.yml:wallpaper.pick' ]
server/edit/config-key.test.ts > one value written over its own bytes > writes a text that holds a colon, a hash and both quotes so the file reads back as it
    AssertionError: expected [ { …(2) } ] to deeply equal []
server/edit/config-key.test.ts > one value written over its own bytes > writes a text that holds a newline double-quoted, even over a single-quoted line
    AssertionError: expected '# ===================================…' to contain 'usage_refresh_model: "a\nb"\n'
server/edit/config-key.test.ts > one value written over its own bytes > writes a text as given when it holds an em dash or an accented letter
    AssertionError: expected [ { …(2) } ] to deeply equal []
server/edit/config-key.test.ts > one value written over its own bytes > writes nothing for a text equal to the one held, in whatever quote style the file uses
    AssertionError: expected { changed: [], refused: [ { …(2) } ] } to deeply equal { changed: [], refused: [] }
server/edit/config-key.test.ts > one value written over its own bytes > writes a text with commas and braces inside a flow map double-quoted
    AssertionError: expected [ { …(2) } ] to deeply equal []
server/edit/config-key.test.ts > one value written over its own bytes > keeps every CRLF line end and the byte order mark
    AssertionError: expected [ { …(2) } ] to deeply equal []
server/edit/config-key.test.ts > a value the option does not take > refuses a whole number the reader refuses, with the reader's own sentence
    AssertionError: expected [ Array(1) ] to deeply equal [ 'behavior.yml:changes.keep' ]
server/edit/config-key.test.ts > a value the option does not take > refuses what is not a finite number for a number option
    AssertionError: expected [ Array(1) ] to deeply equal [ 'behavior.yml:changes.keep' ]
server/edit/config-key.test.ts > a value the option does not take > writes minus zero as zero, over an option whose reader takes zero
    AssertionError: expected [ { …(2) } ] to deeply equal []
server/edit/config-key.test.ts > a value the option does not take > refuses a choice outside its values and a toggle that is not a boolean
    AssertionError: expected [ Array(1) ] to deeply equal [ 'appearance.yml:wallpaper.pick' ]
server/edit/config-key.test.ts > a value the option does not take > refuses a family and a list, which are not set one key at a time
    AssertionError: expected [ Array(1) ] to deeply equal [ 'appearance.yml:themes' ]
server/edit/config-key.test.ts > an option the catalog does not hold > refuses the machine's own file without reading it
    AssertionError: expected [ Array(1) ] to deeply equal [ 'local.yml:port' ]
server/edit/config-key.test.ts > an option the catalog does not hold > refuses a key or a file the catalog has no entry for, the reserved names among them
    AssertionError: expected [ Array(1) ] to deeply equal [ 'behavior.yml:not.a.key' ]
server/edit/config-key.test.ts > a file that does not hold the key > refuses a file that does not parse and a file that holds a key twice
    AssertionError: expected [ Array(1) ] to deeply equal [ 'behavior.yml:changes.keep' ]
server/edit/config-key.test.ts > a file that does not hold the key > refuses a key that is absent, empty, null, an alias, anchored, tagged or a block scalar
    AssertionError: expected [ Array(1) ] to deeply equal [ 'behavior.yml:changes.keep' ]
server/edit/config-key.test.ts > a file that does not hold the key > refuses an edit that would change a second key, which an alias of the map reads
    AssertionError: expected [ Array(1) ] to deeply equal [ 'behavior.yml:changes.keep' ]
server/edit/config-key.test.ts > a file that does not hold the key > writes beside a file value that JSON cannot hold: infinity, not a number and minus zero
    AssertionError: expected [ { …(2) } ] to deeply equal []
server/edit/config-key.test.ts > a file that does not hold the key > refuses a key segment that holds a dot and a key that is not a string
    AssertionError: expected [ Array(1) ] to deeply equal [ 'behavior.yml:changes.a.b' ]
server/edit/config-key.test.ts > the readers of the merged configuration > refuses a value the reader of its block refuses, with that reader's sentence
    AssertionError: expected [ Array(1) ] to deeply equal [ Array(1) ]
server/edit/config-key.test.ts > the readers of the merged configuration > refuses a code theme that is none, in the words of the finding it would give
    AssertionError: expected [ Array(1) ] to deeply equal [ 'appearance.yml:code_theme' ]
server/edit/config-key.test.ts > the readers of the merged configuration > writes the repair of a value the reader refuses, and refuses a write that leaves it
    AssertionError: expected [] to deeply equal [ 'behavior.yml:search.max_hits' ]
server/edit/config-key.test.ts > the readers of the merged configuration > writes nothing for the refused value the file holds, and refuses to put it back
    AssertionError: expected { changed: [], refused: [ { …(2) } ] } to deeply equal { changed: [], refused: [] }
server/edit/config-key.test.ts > the period of the automatic fetch > refuses -1 and 1.5 with the reader's sentence and writes nothing
    AssertionError: expected [ Array(1) ] to deeply equal [ Array(1) ]
server/edit/config-key.test.ts > the period of the automatic fetch > refuses a text with the words of a number option and writes nothing
    AssertionError: expected [ Array(1) ] to deeply equal [ Array(1) ]
server/edit/config-key.test.ts > the period of the automatic fetch > writes 3 over the shipped 0 and keeps every other byte
    AssertionError: expected [ { …(2) } ] to deeply equal []
server/edit/config-key.test.ts > a file the writer cannot write > lets the exception of a read-only file reach the route and leaves the mode as it was
    AssertionError: expected [Function] to throw an error
server/edit/config-key.test.ts > the readers that give findings > refuses a write when a finder throws on the configuration holding it, in its own words
    AssertionError: expected [ Array(1) ] to deeply equal [ 'behavior.yml:changes.keep' ]
server/edit/config-key.test.ts > the readers that give findings > refuses a write when a finder throws before the edit and again after it
    AssertionError: expected [ Array(1) ] to deeply equal [ 'behavior.yml:changes.keep' ]
server/edit/config-key.test.ts > the readers that give findings > compares nothing for a finder that threw before the edit and gives findings after it
    AssertionError: expected [ { …(2) } ] to deeply equal []
server/edit/config-key.test.ts > the readers that give findings > hands every finder the hub it is given, though local.yml names another since
    AssertionError: expected [] to deeply equal [ '/the/started/hub', …(1) ]
server/edit/config-key.test.ts > the readers that give findings > writes when a finder gives the same finding before and after the edit
    AssertionError: expected [ { …(2) } ] to deeply equal []
server/edit/config-key.test.ts > the bounds of the cadences, the day windows and the count > refuses slurm.poll_min of 0 with the reader sentence and writes nothing
    AssertionError: expected [ Array(1) ] to deeply equal [ 'behavior.yml:slurm.poll_min' ]
server/edit/config-key.test.ts > the bounds of the cadences, the day windows and the count > refuses slurm.poll_min of 35792 with the reader sentence and writes nothing
    AssertionError: expected [ Array(1) ] to deeply equal [ 'behavior.yml:slurm.poll_min' ]
server/edit/config-key.test.ts > the bounds of the cadences, the day windows and the count > refuses slurm.quota_min of 0.5 with the reader sentence and writes nothing
    AssertionError: expected [ Array(1) ] to deeply equal [ 'behavior.yml:slurm.quota_min' ]
server/edit/config-key.test.ts > the bounds of the cadences, the day windows and the count > refuses calendar.poll_min of 40000 with the reader sentence and writes nothing
    AssertionError: expected [ Array(1) ] to deeply equal [ 'behavior.yml:calendar.poll_min' ]
server/edit/config-key.test.ts > the bounds of the cadences, the day windows and the count > refuses mail.poll_min of 0 with the reader sentence and writes nothing
    AssertionError: expected [ Array(1) ] to deeply equal [ 'behavior.yml:mail.poll_min' ]
server/edit/config-key.test.ts > the bounds of the cadences, the day windows and the count > refuses slurm.days of -1 with the reader sentence and writes nothing
    AssertionError: expected [ Array(1) ] to deeply equal [ 'behavior.yml:slurm.days' ]
server/edit/config-key.test.ts > the bounds of the cadences, the day windows and the count > refuses slurm.days of 2.5 with the reader sentence and writes nothing
    AssertionError: expected [ Array(1) ] to deeply equal [ 'behavior.yml:slurm.days' ]
server/edit/config-key.test.ts > the bounds of the cadences, the day windows and the count > refuses calendar.days_back of 3651 with the reader sentence and writes nothing
    AssertionError: expected [ Array(1) ] to deeply equal [ 'behavior.yml:calendar.days_back' ]
server/edit/config-key.test.ts > the bounds of the cadences, the day windows and the count > refuses calendar.days_ahead of -1 with the reader sentence and writes nothing
    AssertionError: expected [ Array(1) ] to deeply equal [ 'behavior.yml:calendar.days_ahead' ]
server/edit/config-key.test.ts > the bounds of the cadences, the day windows and the count > refuses mail.per_signal of 0 with the reader sentence and writes nothing
    AssertionError: expected [ Array(1) ] to deeply equal [ 'behavior.yml:mail.per_signal' ]
server/edit/config-key.test.ts > the bounds of the cadences, the day windows and the count > refuses mail.per_signal of 501 with the reader sentence and writes nothing
    AssertionError: expected [ Array(1) ] to deeply equal [ 'behavior.yml:mail.per_signal' ]
server/edit/config-key.test.ts > the bounds of the cadences, the day windows and the count > refuses mail.per_signal of 2.5 with the reader sentence and writes nothing
    AssertionError: expected [ Array(1) ] to deeply equal [ 'behavior.yml:mail.per_signal' ]
server/edit/config-key.test.ts > the bounds of the cadences, the day windows and the count > writes calendar.days_back of 0
    AssertionError: expected [ { …(2) } ] to deeply equal []
server/edit/config-key.test.ts > the bounds of the cadences, the day windows and the count > writes slurm.poll_min of 1
    AssertionError: expected [ { …(2) } ] to deeply equal []
server/edit/config-key.test.ts > the bounds of the cadences, the day windows and the count > writes slurm.poll_min of 35791
    AssertionError: expected [ { …(2) } ] to deeply equal []
server/edit/config-key.test.ts > the bounds of the cadences, the day windows and the count > writes mail.per_signal of 500
    AssertionError: expected [ { …(2) } ] to deeply equal []
server/git/deposit.test.ts > the hub the machine values name > is the hub of the machine values handed in when the caller names no target
    AssertionError: expected null not to be null
server/git/deposit.test.ts > the hub the machine values name > is a fault said plainly when the caller names neither a target nor an engine
    AssertionError: expected [Function] to throw error including 'the engine directory, its configurati…' but got 'a deposit needs either a write target…'
server/git/deposit.test.ts > the hub the machine values name > is the id gate, so a project the last payload does not carry is still known
    AssertionError: expected [ 'gamma' ] to include 'alpha'
server/machine/hpc/poll-live.test.ts > settings changed while the watcher runs > moves the next poll to the new period from the push when that is sooner, and publishes it
    TypeError: watcher.set is not a function
server/machine/hpc/poll-live.test.ts > settings changed while the watcher runs > leaves the next poll where it is for a longer period, and polls at the new period after it
    TypeError: watcher.set is not a function
server/machine/hpc/poll-live.test.ts > settings changed while the watcher runs > treats the retry wait as the next poll: a shorter period moves it, a longer one leaves it
    TypeError: watcher.set is not a function
server/machine/hpc/poll-live.test.ts > settings changed while the watcher runs > clears what the old host answered and polls the new one at once
    TypeError: watcher.set is not a function
server/machine/hpc/poll-live.test.ts > settings changed while the watcher runs > starts no poll for a host that did not change
    TypeError: watcher.set is not a function
server/machine/hpc/poll-live.test.ts > settings changed while the watcher runs > drops the rows of a poll begun under the old host and answers with one follow-up poll
    TypeError: watcher.set is not a function
server/machine/hpc/poll-live.test.ts > settings changed while the watcher runs > starts one poll for a push that changes the host and the day count together
    TypeError: watcher.set is not a function
server/machine/hpc/poll-live.test.ts > settings changed while the watcher runs > polls at once with the new window when the day count changes
    TypeError: watcher.set is not a function
server/machine/hpc/poll-live.test.ts > settings changed while the watcher runs > reads the quota by the same rule as the poll: sooner at once, never later
    TypeError: down.watcher.set is not a function
server/machine/hpc/poll-live.test.ts > settings changed while the watcher runs > stops prewarming from the next good poll when the prewarm is turned off
    TypeError: watcher.set is not a function
server/machine/hpc/poll-live.test.ts > settings changed while the watcher runs > does nothing once the watcher is closed: no timer, no poll, no publish
    TypeError: watcher.set is not a function
server/machine/hpc/poll-live.test.ts > settings changed while the watcher runs > drops the meters of a quota read begun under the old host and publishes the new host
    TypeError: watcher.set is not a function
server/machine/hpc/poll-live.test.ts > settings changed while the watcher runs > lets a quota read in flight land when only the day count changes
    TypeError: watcher.set is not a function
server/machine/hpc/poll-live.test.ts > settings changed while the watcher runs > drops the log paths of a prewarm begun under the old host
    TypeError: watcher.set is not a function
server/machine/hpc/poll-live.test.ts > settings changed while the watcher runs > drops the rows of a poll begun under the old window and answers with one poll at the new one
    TypeError: watcher.set is not a function
server/machine/usage/refresh.test.ts > the settings the refresher requires > refuses a cadence outside 1 to 35791, and a model that is empty or not text
    AssertionError: expected [Function] to throw error including 'config/behavior.yml: usage_refresh_mi…' but got 'usage_refresh_min must be a positive …'
server/machine/usage/refresh.test.ts > the settings the refresher requires > is the check the watcher starts with, so a bad setting starts no watcher
    AssertionError: expected [Function] to throw error including 'config/behavior.yml: usage_refresh_mi…' but got 'usage_refresh_min must be a positive …'
server/machine/usage/refresh.test.ts > the settings the refresher requires, read as one value > throws the cadence sentence for an absent cadence and for both wrong
    AssertionError: expected [Function] to throw error including 'config/behavior.yml: usage_refresh_mi…' but got 'usage_refresh_min must be a positive …'
server/machine/usage/refresh.test.ts > refresh settings changed while the watcher runs > moves the next refresh to the new period from the push when that is sooner, then every period
    TypeError: refresh.set is not a function
server/machine/usage/refresh.test.ts > refresh settings changed while the watcher runs > leaves the next refresh where it is for a longer period, and waits the new period after it
    TypeError: refresh.set is not a function
server/machine/usage/refresh.test.ts > refresh settings changed while the watcher runs > starts the next session with the new model, a start already running keeping its own
    TypeError: refresh.set is not a function
server/machine/usage/refresh.test.ts > refresh settings changed while the watcher runs > replaces the timer and starts nothing when there is no Claude account
    TypeError: refresh.set is not a function
server/machine/usage/refresh.test.ts > refresh settings changed while the watcher runs > refuses what the start refuses and keeps the timer it has
    AssertionError: expected [Function] to throw error including 'config/behavior.yml: usage_refresh_mi…' but got 'refresh.set is not a function'
server/machine/usage/refresh.test.ts > refresh settings changed while the watcher runs > does nothing once it is closed: no timer, no session
    TypeError: refresh.set is not a function
server/machine/usage/refresh.test.ts > refresh settings changed while the watcher runs > returns for a setting its reader refuses once it is closed
    AssertionError: expected [Function] to not throw an error but 'TypeError: refresh.set is not a funct…' was thrown
server/machine/usage/watch.test.ts > the usage watcher on tiers that change > publishes again with the new label, and publishes nothing for equal tiers
    TypeError: watcher.setTiers is not a function
server/machine/usage/watch.test.ts > the usage watcher on tiers that change > publishes nothing once it is closed
    TypeError: watcher.setTiers is not a function
server/root/context.test.ts > ServerContext with a refresh cadence outside 1 to 35791 > throws the cadence sentence at start-up, after the portfolio and the sessions watch
    AssertionError: expected [Function] to throw error including 'config/behavior.yml: usage_refresh_mi…' but got 'usage_refresh_min must be a positive …'
server/root/context.test.ts > ServerContext with a refresh cadence outside 1 to 35791 > throws the same sentence before a replaced refresher is started
    AssertionError: expected [Function] to throw error including 'config/behavior.yml: usage_refresh_mi…' but got 'usage_refresh_min must be a positive …'
server/root/context.test.ts > ServerContext on a configuration push > hands each group the settings its reader gives the pushed configuration
    AssertionError: expected "vi.fn()" to be called once with arguments: [ { host: 'cluster', days: 14, …(3) } ]
server/root/context.test.ts > ServerContext on a configuration push > keeps the host the machine names, so a pushed slurm.host reaches the poller only without one
    AssertionError: expected "vi.fn()" to be called once with arguments: [ ObjectContaining{…} ]
server/root/context.test.ts > ServerContext on a configuration push > hands the three sentences, each kept when the push lacks it, and says the lack once
    AssertionError: expected "vi.fn()" to be called once with arguments: [ { icsNoLink: 'new link', …(2) } ]
server/root/context.test.ts > ServerContext on a configuration push > keeps a refused group and logs it once, again after a read that took, and clears on a push back
    AssertionError: expected [] to deeply equal [ Array(1) ]
server/root/context.test.ts > ServerContext on a configuration push > refuses each group on its own, with its reader message, and lets the others take theirs
    AssertionError: expected "vi.fn()" to be called once with arguments: [ { pollMin: 5, daysBack: 1, …(1) } ]
server/root/context.test.ts > ServerContext on a configuration push > keeps every group and says so once for a push whose configuration is not a map
    AssertionError: expected [] to deeply equal [ Array(1) ]
server/root/context.test.ts > ServerContext on a configuration push > keeps the five groups, each logged once, when behavior.yml was saved unparseable
    AssertionError: expected [] to deeply equal [ …(5) ]
server/root/context.test.ts > ServerContext on a configuration push > holds the settings of the last of two pushes made in quick succession
    AssertionError: expected [] to deeply equal [ 5, 7 ]
server/root/context.test.ts > ServerContext on a configuration push > takes the sink off the hub on close, after which a push changes nothing and logs nothing
    AssertionError: expected +0 to be -1 // Object.is equality
server/root/context.test.ts > ServerContext on a configuration push > builds a hook target without the notification settings, which the hook route reads at each request
    AssertionError: expected [ 'config', 'hub', 'limiter', …(4) ] to deeply equal [ 'hub', 'limiter', 'logged', …(2) ]
server/root/context.test.ts > ServerContext on a configuration push > logs a setter that throws once as its group failing, and the next push still reaches the others
    AssertionError: expected [] to deeply equal [ Array(1) ]
server/root/context.test.ts > ServerContext on a configuration push > stops at start-up naming the key for a cadence of 0, a day window of -1 and a count of 501
    AssertionError: expected [Function] to throw an error
```

5. **Proof 2, the HPC watcher in flight.** Tests in `tests/server/machine/hpc/poll-live.test.ts` (the "settings changed while the watcher runs" describe moved there with the helpers in `poll-fixture.ts`, because `poll.test.ts` passed the 900-line cap): "drops the meters of a quota read begun under the old host and publishes the new host", "drops the log paths of a prewarm begun under the old host", "drops the rows of a poll begun under the old window and answers with one poll at the new one". Each run with its guard taken out (`src/lib/server/machine/hpc/poll.ts`, restored after each; `cmp` against the final copy printed `restored`):

```
guard of publishQuota removed (began !== hosts):
 FAIL ... > drops the meters of a quota read begun under the old host and publishes the new host
 AssertionError: expected [ 75, 75, 25 ] to not include 25
 Tests  1 failed | 34 passed (35)
guard of prewarmStep removed (began !== asking):
 FAIL ... > drops the log paths of a prewarm begun under the old host
 AssertionError: expected [ [ '9', ...(1) ], [ '10', ...(1) ] ] to deeply equal []
 Tests  1 failed | 34 passed (35)
guard of poll removed (began !== asking):
 FAIL ... > drops the rows of a poll begun under the old window and answers with one poll at the new one
 FAIL ... > drops the rows of a poll begun under the old host and answers with one follow-up poll
 AssertionError: expected [ 'old', 'x' ] to not include 'old'
 Tests  2 failed | 33 passed (35)
```
6. **Behaviour 2, quota and window.** `poll.ts` has a second counter `hosts`, raised on a host change only; `publishQuota` reads and compares `hosts`, the poll and the prewarm keep `asking` (raised by a host or a days change). New test "lets a quota read in flight land when only the day count changes". With the quota guard counting `asking` it fails: `AssertionError: expected [] to deeply equal [ 25 ]`, `Tests  1 failed | 34 passed (35)`.
7. **Proof 3, loops in flight.** `tests/server/accounts/connect/loop.test.ts`, describe "settings that change while a round runs": "arms the next round at the new period after the round that was running ends" and "runs one follow-up round at the new window after the round ends, however many changes came" (two changes during one round, reads `[1, 9]`: one follow-up round, at the later window). Taking `pollMin = minutes;` out of `setPollMin` fails them (`Tests  3 failed | 9 passed (12)`; the new case: `expected [ '/first:google-work' ] to have a length of 2 but got 1`). Taking the follow-up out of `takeLoopSettings` fails the window case (`Tests  1 failed | 11 passed (12)`, `expected [ '/first:google-work' ] to have a length of 2 but got 1`). Two other changes to the loop leave every test green and change no observable result: dropping the `if (running === null)` guard of `setPollMin` (the timer it arms during a round fires into a round that reads nothing, since the due times the round sets are later) and `queued ??=` to `queued =` (the second follow-up reads no account, since none is due). The tests therefore pin the observable result (the next read time, one follow-up read), not those two lines.
8. **Behaviour 1, no account.** `takeLoopSettings` in `loop.ts` publishes when the asked thing or the period changed and the loop holds no account (`if (askedChanged && loop.accounts().length > 0) void loop.run(true); else if (askedChanged || period changed) publish();`). Tests: calendar "publishes the new window and period when no account is configured" (payload `pollMin: 5, daysBack: 7, daysAhead: 30`, then `daysAhead: 60`), mail "publishes the new period and reads nothing when no account is configured". With the old condition both fail: `AssertionError: expected { status: 'unconfigured', ...(7) } to match object { pollMin: 5, daysBack: 7, ...(1) }` and `AssertionError: expected 2 to be 3 // Object.is equality`.
9. **Behaviour 3, a throwing setter.** `live-settings.ts`: the read, the comparison and the setter call of each group (slurm, calendar, mail, refresh, tiers, and the two sentence hand-offs `calendar.words` and `mail.words`) run inside that group's `attempt`; the settings in force change after the setter took them, so a later push offers them again. Test in `context.test.ts`, "logs a setter that throws once as its group failing, and the next push still reaches the others": the line `config: the poller broke; the settings in force are kept` once over two pushes, the calendar setter called twice, `hub.size` unchanged. With the slurm hand-off outside an `attempt` it fails: `AssertionError: expected [] to deeply equal [ Array(1) ]` (4 of 24 cases fail in that variant, the other three because the variant also stops that group's reader messages).
10. **Standards 1, comments.** `deposit.ts` (the `into` field, the start-values paragraph, the `hubTarget` paragraph), `deposit-routes.ts` (the `knownIds` paragraph), `chat.ts` (the `engine` field) now say the hub comes from the start `LocalConfig` passed in, with no history.
11. **Standards 2 (Z183).** `DESIGN.md:236` ends: "`local.yml` is read when the server starts and used from that value, except the account lists and folders of the calendar and the mail, and `apps_dir`, which the apps section says is followed; its watch reads those again." `:244` and `:266` are unchanged. No code.
12. **Standards 3.** `tests/routes/sessions/hook.test.ts` head comment re-flowed to full lines (five lines of 83, 97, 97, 95 and 38 columns, the last ending the paragraph): the comment check caps a line at 100 columns, so one line per paragraph is held by filling the lines.

## Other files changed by the round

- `tests/server/root/context-fixture.ts` now holds `driver`, `inertConfig` and `inertDependencies` (moved out of `context.test.ts`, which grew past 900 lines with the new case); the first test of `context.test.ts` reads `{ ...inertConfig(), glyphs, icons }` where it held a copy of the same literal (the duplication check flagged it).
- `tests/server/machine/hpc/poll-fixture.ts` (new), `poll-live.test.ts` (new): the helpers and the third describe of `poll.test.ts`. Counts: `poll.test.ts` 20 cases (453 lines), `poll-live.test.ts` 15 cases (441 lines), `npx vitest run tests/server/machine/hpc`: 6 files, 70 tests passed.

## Checks (run 5, the full list that passed)

```
$ npm run diagrams            (exit 0)
$ sh ~/.claude/skills/land/templates/checks.sh .scratch/migration/orchestrator-state.md
$ npm test                    Test Files  417 passed | 22 skipped (439)
                                   Tests  10926 passed | 618 skipped (11544)
$ npm run test:checks         Test Files  29 passed | 2 skipped (31)
                                   Tests  442 passed | 9 skipped (451)
$ npm run check               COMPLETED 2935 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build
$ npm run format:check        All matched files use Prettier code style!
$ npm run lint
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 7 commands passed
```

Run 4 (before the two findings were fixed) ended `checks: failed with exit 1: npm run test:checks`, with `tests/checks/source/comment-width.test.ts` naming `tests/server/machine/hpc/poll-live.test.ts:2` and `tests/checks/tree/duplication.test.ts` naming `poll-live.test.ts:96`/`poll.test.ts:357` and `context-fixture.ts:138`/`context.test.ts:98`; `npm run test:checks` alone then printed `Tests  442 passed | 9 skipped (451)`.

## Not verified

- The mutation variants of item 7 that leave tests green (named there) were not given a test of their own, because they change no observable result.
- No server was started; no route was exercised over HTTP.
