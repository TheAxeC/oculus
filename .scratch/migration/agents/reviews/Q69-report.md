All nine items are built or already present, and every verification command passes. Two things differ from what the brief assumed:
- **Item 9** was already on the tree, so nothing was built for it.
- **Item 7's transcript shapes are not verified against a real Claude Code transcript.** This covers the background launch answer and the completion notice. The permission classifier refused my read of a real transcript, so they come from the tree's `subagents/agent-<id>.jsonl` layout and from what I know of Claude Code.

## Open items of the state file
The "Open items" section of `tools/oculus/.scratch/migration/orchestrator-state.md` holds no entry (read at lines 89-92).

## DONE / NOT DONE
| # | Item | State | Proof |
|---|---|---|---|
| 1 | The catalogue is never covered | DONE | `away.ts`: `uncover()` makes the catalogue its pane's tab again after `split` (:55) and after `transfer` (:77). New browser cases in views.spec.ts: "...moves a view out of the catalogue's only pane..." (red under `away.ts:55 => delete`) and "...into the pane beside it..." (red under `away.ts:77 => delete`). |
| 2 | A diagram's fetch stops when its view closes | DONE | `newest.ts`: the stop now aborts an `AbortController` whose signal reaches `fetch`. `Diagram.svelte:56-59` returns that stop from its effect. New browser case "a diagram whose view closes with its answer held back stops its fetch, and nothing lands", red under `Diagram.svelte:58 => void ask(...)`. New node audit: a stop aborts only its own signal. |
| 3 | The write reader follows a local alias and a function passed by name | DONE | `bin/diagrams/writes.mjs` and `calls.mjs`. Five node cases, each red under its revert: a local alias; a destructured member plus a module-level alias; an imported module-level alias; a passed function; a passed function through an alias and a second function (a function that only keeps its argument is not counted). One audit case: a function passed across modules is not followed. The head comment of `writes.mjs` says what is followed, what is not, and why. |
| 4 | A reused pid does not flip its row | DONE | `dispatches.ts` `builderProcesses` takes and returns a `reused` list, kept in the transcript cache file. Node cases, all red under their reverts: mismatch, then no start time, then the matching start, and the row stays done; the list is pruned once a launch is stamped; a watcher case where nothing is republished (`dispatches.ts:202 => const state = false`). |
| 5 | Inline code paints no layer of its own over a wallpaper | DONE | `Markdown.svelte:106-112`: under `body.wall`, `code` and `pre` have a transparent background and no blur. Help and Doc now ask their box for the tint. Browser case in tinted.spec.ts under mocha: it finds a wrapped span and asserts no filter on the span or anywhere in its paragraph, no fill, and a translucent Help box. Red under `Markdown.svelte:107` and under `Help.svelte:53`. |
| 6 | Sentences that send the reader to the rail | DONE | `detail_empty` and `no_terminal` now name the Sessions view. New `views/shared/sessions/PickSession.svelte` (the sentence plus an "Open the Sessions view" button) in Agents, Transcript, Changes, Timeline, SessionDetail and Terminal. Two browser cases in session-tabs.spec.ts, each red under the text revert and under `PickSession.svelte:31`. |
| 7 | A background subagent read as done at once | DONE, not verified on a real transcript | `stores/background.ts` plus `fold.ts:102,110`: a background launch's answer keeps the agent running until its completion notice, or until its own transcript has been still for 30 min. `tests/server/sessions/stores/background.test.ts` has 3 cases, red under `fold.ts:102`, `fold.ts:110` and `background.ts:108`. |
| 8 | A launched builder's duration | DONE | Cause: `Agents.svelte` took `now` once when the view mounted. Now a one-second tick runs while any row runs, and a done row with no known end shows no count. Node cases for 90 s stamped, running-to-now and no end. Browser case: a running count moves and a stamped row reads `1m 30s` (red under `Agents.svelte:73`). |
| 9 | The style module served raw | Already on the tree | `src/lib/server/core/style-first.ts` is registered at `vite.config.ts:15`. `npx vitest run tests/server/core/dev-server.test.ts`: 2 passed. `node bin/revert-check.mjs tests/server/core/dev-server.test.ts`: "2 reverts, 0 unproven, 0 unchecked"; both cases red under `vite.config.ts:15`. |

Verification commands, run on the final tree:
1. `npx vitest run --reporter=dot`: `Test Files 298 passed (298)`, `Tests 4738 passed (4738)`.
2. `npm run check`: `COMPLETED 1368 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`.
3. `npm run build`: exit 0.
4. `npm run format:check`: `All matched files use Prettier code style!`
5. `npm run lint`: exit 0.
6. `LC_ALL=C grep -rna '[^ -~]' src tests`: 0 lines. The perl gate from the spec: 0 lines.
7. `sh bin/size-check.sh`: exit 0. `sh bin/folder-check.sh`: exit 0.
8. `npm run build`, then `npx playwright test`: `380 passed (7.2m)`.
9. `node bin/revert-check.mjs`:
   - Node files (dispatch-note, diagrams, background, dispatches, watch/sessions, agents.test, help.test, type-scale): last runs gave "101 reverts, 3 unproven". The three were fixed, and a rerun of the two files that held them gave "38 reverts, 0 unproven".
   - Browser files: views, system, tinted, session-tabs and agents gave "40 reverts, 2 unproven". The two were fixed, and a rerun of agents.spec and session-tabs.spec gave "12 reverts, 0 unproven, 0 unchecked".
   - The "unchecked" lines are existing cases with no directive.
10. `node bin/diagrams.mjs` no longer exists (see judgment call 1). `npm run diagrams` leaves `docs/diagrams/` byte-identical (`diff -rq` against main: no output), and the diagrams check is green.
11. `ls -d $TMPDIR/oculus-* | wc -l`: 7015 before the dev-server, browser and revert-check runs, and 7015 after. The first count was taken after work had begun, not before the first vitest run.

## Files (lines now; was)
- **src:**
  - away.ts 88 (79)
  - Diagram.svelte 86 (82)
  - newest.ts 28 (23)
  - Help.svelte 88 (87)
  - Markdown.svelte 140 (137)
  - Doc.svelte 79 (77)
  - Project.svelte 431 (430)
  - Agents.svelte 247 (224)
  - Changes 303 (303)
  - SessionDetail 507 (507)
  - Terminal 442 (439)
  - Timeline 195 (194)
  - Transcript 326 (325)
  - shared/sessions/PickSession.svelte 42 (new)
  - dispatches.ts 235 (203)
  - transcripts.ts 323 (315)
  - stores/background.ts 112 (new)
  - fold.ts 210 (201)
  - record.ts 256 (249)
  - cache.ts 114 (100)
  - ui/html.ts 324 (324, comment only)
  - content/diagrams.ts 60 (60, comment only)
- **bin:** diagrams.mjs 899 removed; bin/diagrams/ holds diagrams.mjs 146, source.mjs 152, graphs.mjs 327, writes.mjs 415, calls.mjs 175.
- **config:**
  - session-list.yml 40 (38)
  - terminal.yml 24 (24)
  - system/help.yml 10 (10)
- **package.json:** 52 (51)
- **tests:**
  - views.spec 548 (485)
  - system.spec 339 (280)
  - tinted.spec 89 (32)
  - session-tabs.spec 189 (152)
  - agents.spec 215 (164)
  - diagrams.test 546 (408)
  - dispatches.test 564 (500)
  - dispatch-note.test 457 (457)
  - watch/sessions.test 621 (573)
  - stores/background.test.ts 159 (new)
  - views/sessions/agents.test 190 (156)
  - help.test 307 (282)
  - type-scale.test 311 (310)

## Judgment calls (each reversible)
1. **The diagram tool moved.** `bin/diagrams.mjs` was 899 lines and `bin/` held its ten items, so the new reader did not fit. The tool is now `bin/diagrams/` with `diagrams.mjs` (the entry), `source.mjs`, `graphs.mjs`, `writes.mjs` and `calls.mjs`. It runs with the new script `npm run diagrams`, and the `help.diagram_failed` text now reads "npm run diagrams writes it". This widened the paths to `config/text/views/system/help.yml`, `src/lib/ui/html.ts` and `src/lib/server/content/diagrams.ts` (comments only). Every directive into the old file was moved to its line in the new files.
2. **Decision 2 against item 3's wording.** Decision 2 is kept: a function passed across modules is not followed. Item 3 also says the head comment names only what cannot be followed without running the code, and a cross-module pass could be followed statically. The head comment names it with its scope reason instead.
3. **A stop now aborts the fetch.** The browser case tells a stopped fetch by the request failing rather than finishing. `Ask<T>` now takes a function of an `AbortSignal`.
4. **Where the reused-pid list lives.** It is kept in `~/.oculus/transcript-cache.json` under a new `reused` key, so it survives a restart, and it is pruned to launches still pending. `CACHE_VERSION` went from 2 to 3 for item 7's new accumulator field, so every transcript is folded once more, whole.
5. **The Help and hub-document boxes are now tinted.** Premise 5 said "the Help view's box is already that translucent surface". It was not: `Help.svelte` had `<Pane title=...>` with no `tinted`. Once Markdown paints no surface, `tests/views/whole/tinted.test.ts` requires both views to ask for the tint. Code blocks in Markdown also paint nothing now: Markdown is drawn only in a tinted box or inside the source preview's frame.
6. **The project board's inline code** (`Project.svelte`, path widened) paints no fill either. Its `pre` keeps its layer because it sits on no translucent surface.
7. **One pick control for every session view.** It is the new shared partial, with keys `open_sessions` and `open_sessions_tip` (path widened to `views/shared/sessions/`). Timeline uses `detail_empty` too, so it got the control. `restore_tip` now reads "bring this session back to the list". The Document view's "Open one from the rail's bookmarks" stays, since bookmarks do live in the rail (`shell/rail/RailFoot.svelte`).
8. **Item 7's reading rules.**
   - A launch is background when the call carries `run_in_background: true`, or its answer carries `toolUseResult.isAsync` or `status: 'async_launched'`.
   - The agent id comes from `toolUseResult.agentId`, or from the text `agentId: X`.
   - A launch ends at a `<task-notification>` naming that id as its `<task-id>`: completed, done or success read done, and any other status reads error.
   - Without a notice, the agent reads done once `<session>/subagents/agent-<id>.jsonl` (or the session's own file) has been still for `IDLE_AFTER_SECONDS` (30 min).
9. **An unstamped launch done by its exited process** keeps `ended` null, so no count is shown until the stamp. One read done by its builder's own session keeps that session's last activity as its end, as before.
10. **Existing directives corrected.**
    - `diagrams.test.ts` pointed at `const found = [];` and now points at the message loop's `lost.push` (`graphs.mjs:202`).
    - `agents.spec.ts` pointed at `watch/sessions.ts:279`, the Codex store line the case never uses. It now points at the note watch (`:288`), and the case gained a stamp step that only that watch can carry.
    - A `SessionDetail.svelte:182` directive my insertion had separated from its case is back above it.
    - The watcher case "republishes... exits unstamped" now waits for a quiet channel first; it went green once under its revert in a loaded run.

## Changes a reader sees (before, after), for the look on TEST
- **Views catalogue:** make it the only pane, with Help and Config tabs after it, then choose Open on this page for Help. Before: the pane showed Config. After: the catalogue. The same holds when a second pane exists.
- **Help under mocha,** rail section (`{label, glyph, page}` wrapping): before, the prose around the span drew blurred and the code had a fill. After, no blur and no fill, and the Help box is a translucent surface. Doc (a hub document) now has the same tinted box.
- **Project board prose under a wallpaper:** inline code has no fill or blur.
- **Agents, Transcript, Changes, Timeline and Session detail with no session picked, and a new Terminal tab:** the sentence names the Sessions view, and an "Open the Sessions view" button opens it.
- **Agents view:** a background subagent reads running while it works, not done at once. A launched builder's count moves every second while it runs, and a stamped one shows start to end (90 s reads `1m 30s`).

## Wrong or impossible in the brief
- **Item 9** is already built and proven, as the table's commands show.
- **Premise 5** was wrong: Help's box was not tinted.
- **Verification 10** names a command that no longer exists after the split.

## Limitations
- **Item 7's shapes** (`toolUseResult` fields, the `agentId:` text, the notice tags) are assumed. If Claude Code writes them differently, a background launch whose call lacks `run_in_background` would still read done at once. One that has it would read running until its own transcript has been still for 30 min.
- **The write reader** does not follow a `let` or `var` name assigned again, a name a branch or a call decides, or a function held in a value built at run time. Its head comment names each of these.
- **A second case now waits a fixed 1 s:** the watcher case for a reused pid waits 1 s of re-checks.

## Doc text
- **HELP.md:15.** After "...a new pane beside the catalogue.", add: "A view that was a tab of the catalogue's own pane moves out of it, and that pane goes on showing the catalogue."
- **HELP.md:187.** After "...reads running for as long as that pid runs;", add: "once a scan has seen the pid running another process, the row reads done for good, whatever a later `ps` answers;". Also append: "A launched row counts from its start to its stamped end, and to now while it runs; a row read done because its process exited shows no count until its end is stamped."
- **HELP.md, Agents paragraph or table row 109.** Add: "A subagent started in the background reads running until the session's completion notice for it, or, without one, until its own transcript has been still for 30 minutes."
- **HELP.md:199 and DESIGN.md:165.**
  - `node bin/diagrams.mjs` becomes `npm run diagrams`.
  - The last sentence becomes: "A call through a local alias, and a function passed by name to a function of the same module that calls it, are followed; a function passed to a function of another module is not, and neither is a name that holds a function only by a branch, a second assignment or the answer of a call."
- **DESIGN.md:66.** `bin/diagrams.mjs;` becomes `bin/diagrams/, the diagram tool;`.
- **DESIGN.md:68.** `bin/diagrams.mjs draws` becomes `bin/diagrams/ draws`.
- **DESIGN.md:115.** After "...and done once it does not;", add: "once a scan has seen that pid running with another start time, the launch reads done for good, kept in the transcript cache so a later scan whose `ps` fails cannot bring it back;". Also add: "An unstamped row read done by its process has no known end; one read done by its builder's session ends at that session's last activity."
- **DESIGN.md:112.** Append: "A subagent started in the background is not ended by its launch answer: it runs until a completion notice names its agent id, or until `subagents/agent-<id>.jsonl` has been still for the idle time."
- **DESIGN.md:193 (wallpaper paragraph).** After "A surface inside one of those paints nothing in turn, the current tab inside the strip included", add: "and the code spans and code blocks of prose drawn on one, since a blur behind a span that wraps covers the prose between its halves".

# Repair round 1

The seven rulings are all done and every verification command passes on the final tree. The item 9 dev-server fix was already on the tree and is unchanged. Item 7's transcript shapes are unconfirmed apart from the `completed` and `killed` values and the `<tool-use-id>` field the rulings gave. Everything else item 7 reads from a transcript was not checked against a real log from here. Three other things need a look:
- To stamp a launch through the note's own lock, `bin/dispatch-note.mjs` now carries JSDoc types and takes main's `LOCK_WAIT_MS = 2000` block. Your note also asked for its executable bit to be kept, so it is set.
- The dev-server test now copies `bin/dispatch-note.mjs` into its engine copy.
- The mail poller test failed once in a loaded full run. It passed 3 times alone and in the next full run; this is the Q70 watcher item.

## The rulings

1. **`killed` reads stopped.** A `killed` notice now reads `stopped`, with its own words (`sessions.ag_stopped: stopped`) and an amber dot. `completed` reads done, any other status reads error, and `done` and `success` are gone (`background.ts:35`).
   - New case "reads a subagent killed before it finished as stopped" in background.test.ts, red under `background.ts:35`.
   - New case "says a subagent stopped before it finished is stopped..." in agents.test.ts, red under `Agents.svelte:87`.
2. **A notice is matched by its `<tool-use-id>` first.** That id is the key of `acc.background`; the agent id is the fallback (`background.ts:78-81`). New case "ends one by the notice naming its call when the launch answer named no agent id", red under `background.ts:79 => false`.
3. **The real launch shape is proven.** "knows a launch by its answer when the call does not ask for the background" uses a call without `run_in_background` and an answer carrying `isAsync: true` and `status: 'async_launched'`. It is red under `background.ts:52 => return false;`.
   - The notice cases also use that shape now.
   - **Resumed subagent:** a launch stays known after its notice, so each later notice for the same id sets the row again. The row reads what the latest notice says: its status and its end.
   - Between a resume and its next notice the row still shows the earlier notice's status. The resume itself is not read from the transcript.
   - New case "reads a subagent resumed after its notice by the latest notice": killed then completed reads done with the second end. Red under `background.ts:86`, the revert that drops the launch after its first notice.
4. **Decision 2 revised: a passed function is followed across modules.** A name passed to an imported function, or to a member of a namespace import, is followed wherever that function's text calls the parameter. This includes passing it on through further modules (`writes.mjs` `declaredAt`, `sitesOf`, `callsParameter`).
   - The head comment now names only what needs a run: a computed member, a method of an imported value, a name a branch, a second assignment or a call decides, and a function passed to a callee the reader cannot place.
   - The audit case is replaced by "follows a function passed by name to a function of another module that calls it": it goes through two modules and through `guard.run` of a namespace import. Red under `writes.mjs:326` and under `:237`.
5. **A reused pid now stamps the launch ended in the note itself.** `stampEnded` (`dispatches.ts`) writes through `update()` of `bin/dispatch-note.mjs`, the same lock and rename, and keeps any stamp already there. The same scan's row carries the stamp at once (`transcripts.ts:300-302`).
   - The `reused` list is gone from the cache. `cache.ts` differs from main only in the version bump for item 7, and its comments are true again.
   - Case "stamps a launch seen under a reused pid ended in the note, once, so it stays done": the note is stamped and another launch is left alone. With the transcript cache deleted and no start time, the row still reads done with the stamp as its end, and the note bytes are unchanged.
   - Watcher case: the stamp reaches the page, and nothing is republished after `ps` fails.
   - Both are red under `transcripts.ts:301 => delete`. The unit case "names the launches whose pid runs another process, and no other" is red under `dispatches.ts:199`.
   - To import `update()` into the server, `dispatch-note.mjs` got JSDoc types (it now falls under `npm run check`). It also got main's 2000 ms lock wait and comment, and its executable bit. The stamp therefore waits no longer than a launcher's note call.
6. **The proof gaps are closed.**
   - One case each in session-tabs.spec.ts for Transcript, Changes, Timeline and Session.
     - Transcript and Timeline are red under the revert to `<Empty .../>`.
     - Changes and SessionDetail no longer import Empty (lint forbids an unused import), so their revert is `<p>{t('sessions.detail_empty')}</p>`, the words with no control. Both are red.
   - "a code span of a project document paints no fill of its own over a wallpaper" in tinted.spec.ts, red under `Project.svelte:336`.
   - The fixed `waitForTimeout(300)` is gone from system.spec.ts. After release, a second fetch of the same file passes the route. The case waits until exactly one request has finished (that second one) and the held one has failed once.
7. **"Changes a reader sees" is completed below.** The refold time was measured on this machine's real store, read-only. The command ran `scan()` from `src/lib/server/sessions/stores/transcripts.ts` over `~/.claude-work/projects` and `~/.claude/projects` with a cache in the scratch directory and a probe that asks nothing, 3 runs:
   - Empty cache: `11 sessions 821 ms`, `778 ms`, `735 ms`.
   - Warm cache: `8 ms`, `7 ms`, `7 ms`.

## Open items of the state file
The "Open items" section of `orchestrator-state.md` holds no entry (read at lines 89-92).

## DONE / NOT DONE
| # | Item | State | Proof |
|---|---|---|---|
| 1 | The catalogue is never covered | DONE | views.spec.ts two cases, red under `away.ts:55` and `:77` |
| 2 | A diagram's fetch stops when its view closes | DONE | system.spec.ts case, red under `Diagram.svelte:58` |
| 3 | The write reader follows aliases and passed functions, across modules too | DONE | diagrams.test.ts, 34 reverts all red |
| 4 | A reused pid does not flip its row | DONE | dispatches.test.ts and watch/sessions.test.ts cases, red under `transcripts.ts:301` |
| 5 | Inline code (and project code) paints no layer over a wallpaper | DONE | tinted.spec.ts two cases, red under `Markdown.svelte:107`, `Help.svelte:53`, `Project.svelte:336` |
| 6 | Sentences no longer send the reader to the rail | DONE | session-tabs.spec.ts 6 cases, all red |
| 7 | A background subagent is not read done at once | DONE; the transcript shapes are unconfirmed apart from the rulings' values | background.test.ts, 7 reverts all red |
| 8 | A launched builder's duration | DONE | agents.test.ts and agents.spec.ts cases, all red |
| 9 | The style module served raw | Already on the tree | dev-server.test.ts 2 passed, red under `vite.config.ts:15` |

Verification, final tree:
1. `npx vitest run --reporter=dot`: `Test Files 298 passed (298)`, `Tests 4743 passed (4743)`.
2. `npm run check`: `COMPLETED 1369 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`.
3. `npm run build`: `build exit=0`.
4. `npm run format:check`: `All matched files use Prettier code style!`
5. `npm run lint`: `lint exit=0`.
6. `LC_ALL=C grep -rna '[^ -~]' src tests`: 0 lines. The spec's perl gate: 0 lines.
7. `sh bin/size-check.sh`: `size exit=0`. `sh bin/folder-check.sh`: `folder exit=0`.
8. `npm run build`, then `npx playwright test`: `385 passed (8.4m)`, port 8792 free.
9. `node bin/revert-check.mjs` over all 15 changed test files: `157 reverts, 19 unproven, 34 unchecked`.
   - The unproven came from two sources. One was a writes.mjs directive my reformat had moved. The rest were the note-writer directives, shifted by main's lock-wait edit while that run was going.
   - After fixing both, a rerun over diagrams.test.ts, dispatch-note.test.ts and dispatch-note-race.test.ts gave `55 reverts, 0 unproven, 0 unchecked`.
   - Every other line of the full run was red or unchecked. The unchecked ones are existing cases with no directive.
10. `npm run diagrams`: `docs/diagrams unchanged` (`diff -rq` against main).
11. `ls -d $TMPDIR/oculus-* | wc -l`: 7015 before and 7015 after.

## Files (lines now; main)
- **Tests:**
  - agents.spec 239 (164)
  - tinted.spec 112 (32)
  - views.spec 548 (485)
  - session-tabs.spec 221 (152)
  - system.spec 345 (280)
  - dispatch-note-race.test 64 (64)
  - dispatch-note.test 457 (457)
  - diagrams.test 560 (408)
  - dev-server.test 242 (231)
  - stores/background.test.ts 209 (new)
  - dispatches.test 572 (500)
  - watch/sessions.test 626 (573)
  - views/sessions/agents.test 205 (156)
  - help.test 307 (282)
  - type-scale.test 311 (310)
- **Server source:**
  - model-sessions.ts 547 (545)
  - content/diagrams.ts 60 (60)
  - cache.ts 100 (100)
  - fold.ts 210 (201)
  - record.ts 261 (249)
  - stores/background.ts 121 (new)
  - dispatches.ts 252 (203)
  - transcripts.ts 328 (315)
- **Client source:**
  - away.ts 88 (79)
  - html.ts 324 (324)
  - Project.svelte 431 (430)
  - Agents.svelte 253 (224)
  - Changes 303 (303)
  - SessionDetail 507 (507)
  - Terminal 442 (439)
  - Timeline 195 (194)
  - Transcript 326 (325)
  - Markdown.svelte 140 (137)
  - shared/sessions/PickSession.svelte 42 (new)
  - Doc.svelte 79 (77)
  - Diagram.svelte 86 (82)
  - Help.svelte 88 (87)
  - newest.ts 28 (23)
- **bin:**
  - diagrams.mjs 899 removed
  - bin/diagrams/ (new): graphs.mjs 327, source.mjs 152, diagrams.mjs 146, writes.mjs 454, calls.mjs 175
  - dispatch-note.mjs 425 (407)
- **config:**
  - sessions/agents.yml 20 (19)
  - session-list.yml 40 (38)
  - terminal.yml 24 (24)
  - system/help.yml 10 (10)
- **package.json:** 52 (51)

## Judgment calls (each reversible)
1. `bin/diagrams.mjs` is split into `bin/diagrams/`. It runs with `npm run diagrams`, and `help.diagram_failed` names that command. `bin/` was full at ten items and the file was at 899 lines.
2. The server imports `update()` from `bin/dispatch-note.mjs` so the stamp uses the writer's own lock and rename. This is the first import from `src` into `bin`.
   - The dev-server test's engine copy now includes that file.
   - The layer diagram does not draw imports that leave `src`, so it does not show this edge. That is the reader's existing rule, which this step leaves unchanged.
3. A stamp for a reused launch is the scan's time, not the moment the builder exited. That moment is unknown. A stamp that cannot take the lock is logged, and the next scan that sees the same reuse tries again. The row still reads done in that scan.
4. The new status value `stopped` enters the payload's agent status set. The model comment says so.
5. Changes and SessionDetail are reverted to a `<p>` in their cases, not to `Empty` (see ruling 6).
6. The earlier calls stand:
   - the Help and hub-document boxes are tinted (premise 5 was wrong);
   - `CACHE_VERSION` is 3;
   - `restore_tip` reads "list";
   - an unstamped launch done by its process shows no count;
   - one done by its builder's session ends at that session's last activity.

## Changes a reader sees (before, after)
- **Views catalogue:** make it the only pane, with Help and Config after it, then choose Open on this page for Help. Before, the pane showed Config. After, it shows the catalogue. The same holds with a second pane.
- **Help under mocha, rail section:** before, the prose around a wrapped code span drew blurred and the span had a fill. After, there is no blur and no fill, and the Help box is a translucent surface. Doc (a hub document) has the same box.
- **Code blocks in Help, Doc and the source preview, over a wallpaper:** before, each block had its own translucent fill and backdrop blur. After, a block draws on the surface around it, with no fill and no blur, in its monospace text. Outside a wallpaper nothing changes.
- **Project board prose over a wallpaper:** inline code has no fill. Code blocks keep theirs, since that prose sits on no translucent surface.
- **Session list after landing:** the first scan refolds every transcript in its window once, because of the cache version bump. Measured on this machine: about 0.8 s against 7-8 ms warm, with 11 sessions in the window.
- **Agents, Transcript, Changes, Timeline, Session and a new Terminal tab with nothing picked:** before, "Pick a session in the rail." and "...or pick one in the rail." After, "No session is picked. Pick one in the Sessions view." and "...or pick one in the Sessions view.", with an "Open the Sessions view" button.
- **The Sessions view's restore tooltip:** before, "bring this session back to the rail". After, "bring this session back to the list".
- **Agents view, background subagent:** before, it read done at once. After, it reads running until its notice, then:
  - `done` for `completed`;
  - `stopped` with an amber dot for `killed` (before this round, error in red);
  - `error` for any other status.
- **Agents view, launched builder:**
  - A running row's count moves every second; before, it froze at the moment the view mounted.
  - A stamped row counts start to end: a 90 s run reads `1m 30s`.
  - A row done because its process exited, with no stamp yet, shows no count. Before, it showed its builder session's last activity, or the frozen mount time.
- **Agents view, reused pid:** a launch whose pid now runs another process reads done with an end the moment a scan sees the reuse. It stays done after a restart or after the transcript cache is lost, because the note carries the stamp.

## Wrong or impossible in the brief
- Item 9 was already built.
- Premise 5 (Help's box already translucent) was wrong.
- Verification 10 names `node bin/diagrams.mjs`, which is now `npm run diagrams`.

## Limitations
- **Item 7's shapes** are assumed beyond the rulings' values: the `toolUseResult` fields, the `agentId:` text and the notice tag names.
- **A stale note lock** can hold one scan for up to about 4 s: the 2 s wait plus the writer's own 2 s slack.
- **The watcher case for a reused pid** still waits a fixed 1 s to prove nothing is published.

## Doc text
- **HELP.md:15.** Add after the Open-on-this-page sentences: "A view that was a tab of the catalogue's own pane moves out of it, and that pane goes on showing the catalogue."
- **HELP.md:187.** After "...reads running for as long as that pid runs;", add: "once a scan sees the pid running another process, it stamps the launch ended in the note, so the row reads done for good;". Append: "A launched row counts from its start to its stamped end, and to now while it runs; a row read done because its process exited shows no count until its end is stamped."
- **HELP.md, Agents paragraph or table row 109.** Add: "A subagent started in the background reads running until the session's notice that it stopped: done when it completed, stopped when it was killed, error otherwise; without a notice, until its own transcript has been still for 30 minutes. A resumed subagent reads what its latest notice says."
- **HELP.md:199 and DESIGN.md:165.**
  - `node bin/diagrams.mjs` becomes `npm run diagrams`.
  - The last sentence becomes: "A call through a local alias, and a function passed by name to a function that calls it, in the same module or another, are followed; a name that holds a function only by a branch, a second assignment or the answer of a call is not."
- **DESIGN.md:66.** `bin/diagrams.mjs;` becomes `bin/diagrams/, the diagram tool;`.
- **DESIGN.md:68.** `bin/diagrams.mjs draws` becomes `bin/diagrams/ draws`.
- **DESIGN.md:115.** After "...and done once it does not;", add: "a launch whose pid a scan sees running another process is stamped ended in the note through the writer's own lock and rename, so no later scan asks about it again;". Add: "An unstamped row read done by its process has no known end; one read done by its builder's session ends at that session's last activity."
- **DESIGN.md:112.** Append: "A subagent started in the background is not ended by its launch answer: its row runs until a completion notice names its tool-use id or agent id (`completed` done, `killed` stopped, anything else error), or until `subagents/agent-<id>.jsonl` has been still for the idle time."
- **DESIGN.md:193 (wallpaper paragraph).** After "A surface inside one of those paints nothing in turn, the current tab inside the strip included", add: "and the code spans and code blocks of prose drawn on one, since a blur behind a span that wraps covers the prose between its halves".
