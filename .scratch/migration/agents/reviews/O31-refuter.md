## Verification lines (run from `.agents/worktrees/O31/tools/oculus`)

- `npx vitest run --reporter=dot`: `Test Files  278 passed (278)`, `Tests  4482 passed (4482)`
- `npm run check`: `COMPLETED 1291 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`
- `npm run build`: exit 0
- `npm run format:check`: `All matched files use Prettier code style!`
- `npm run lint`: exit 0
- The ASCII perl gate: printed nothing, exit 0
- `sh bin/size-check.sh`: exit 0. `sh bin/folder-check.sh`: exit 0
- `npm run build`, then `npx playwright test tests/browser/sessions/agents.spec.ts`: `2 passed (7.0s)`
- `node bin/revert-check.mjs` over the nine test files this step adds or changes (dispatch-note, folders, dispatches, agents view, context, codex, transcripts, watch/sessions, browser agents spec): `35 reverts, 1 unproven, 66 unchecked`, exit 1. The unproven one: `tests/browser/sessions/agents.spec.ts :: marks the launch ended once its note is stamped (revert src/lib/server/watch/sessions.ts:279) [the case did not run]`. There were 34 red lines and no green lines.
- `node bin/revert-check.mjs tests/browser/sessions/agents.spec.ts`, run alone after port 8792 was free: `2 reverts, 1 unproven, 0 unchecked`. This time `watch/sessions.ts:279` was red and `draws the launch ... (revert src/lib/views/sessions/agents/Agents.svelte:105) [the case did not run]` was unproven. So each browser directive was red in one run and "did not run" in the other. Q65 held port 8792 between my runs, so port contention is the likely cause, but that is not verified.
- Temporary folders. Before any run: `oculus-accounts-*`, `oculus-dispatches-*` and `oculus-dispatch-note-*` were 0, and `ls -d $TMPDIR/oculus-* | wc -l` was 7016. After all runs: the three prefixes were still 0 and the total was 7016.
- Stress test of the writer, which is my own and not part of the brief. It is a scratchpad script that starts N `node bin/dispatch-note.mjs start` processes at once under a scratch HOME, then counts the records in the note.
  - With a lock left behind by a dead pid, 24 writers, 150 rounds: `rounds with lost records: 8 of 150; rounds with a failed writer: 0`. Seven rounds read `23 of 24` and one read `22 of 24`.
  - With no stale lock at all, 24 writers, 150 rounds: `rounds with lost records: 3 of 150; rounds with a failed writer: 0`.
  - With 12 writers, 40 rounds and a stale lock: `0 of 40`.
- The writer's rename, seen by `fs.watch` on `~/.oculus` in a scratch HOME: `start` produced 1 event naming `dispatches.json` and `end` produced 2. So the watcher does see a write the writer makes by rename.

## Spec

- **`bin/dispatch-note.mjs:94-113` (`clearStale`) and `:136-146` (`wait`): the lock is not safe when several launchers write at once, and records are lost silently.** This is the defect the step exists to prevent, and it is inside the brief (item 3, "Several launchers may write at the same moment"). It also happens without a stale lock, which the report does not say.
  - The mechanism: a waiter reads the lock's content (holder A), and A releases the lock and exits. A third writer C then links its own lock into place. The waiter's `alive(A)` now reads false, so it runs `renameSync(lock, aside)` on C's live lock. The content check fails and it puts the lock back with `linkSync(aside, lock)`, but in that window a fourth writer D links in. C and D now both hold the lock, and one overwrites the other's record.
  - My stress runs above lost records in 3 of 150 rounds with no stale lock and 8 of 150 with one. Every writer exited 0, so the launcher is told its launch was recorded when it was not.
  - Hunk:
    ```js
    function clearStale(lock, judged) {
        const aside = `${lock}.stale-${process.pid}-${randomBytes(4).toString('hex')}`;
        try {
            renameSync(lock, aside);
    ```
  - What would close it: a lock is never moved by anyone who has not re-checked, under exclusion, that it is still the dead one. For example, a second lock (`dispatches.json.lock.break`, created with `wx`) that clearers take first. Under it the clearer re-reads the lock and removes it only if the content still equals the judged dead content. The breaker itself is cleared by age, since it is held for microseconds.
  - The test `writers started at once all land their record` (8 writers, no stale lock) and `clears a lock whose holder is gone` (1 writer) cannot see this. A case with a stale lock and many writers, repeated, is needed.
- **`bin/dispatch-note.mjs:136-146`: a lock whose pid has been reused is never cleared.** `alive(holderOf(held))` is the only staleness test. If a crashed writer's pid is taken by a long-lived process, every later `start`, `transcript` and `end` waits 10 s and exits 1 until that process ends. This is inside the brief ("cleared if its holder is gone"): the holder is gone and the lock stays. The report lists it as a limitation. What would close it: a write holds the lock for milliseconds, so a lock older than `LOCK_WAIT_MS` (by mtime) is stale whatever its pid. Or record the process start time with the pid, as `sessions/registry.ts` already does for the registry through `ps`.
- **`src/lib/server/sessions/stores/dispatches.ts:84-85`: a launch whose launcher dies before `end` reads "running" forever.**
  - Hunk: `ended: note.endedAt || null, status: note.endedAt ? 'done' : 'running',`.
  - Brief item 4 asks for the row to say "running or ended", and a row that says running for a dead builder is false.
  - Part of this can be closed inside the brief. When the builder's own session is in the scan (`child`, already passed to `dispatchedAgent`), the state can come from `child.live` or `child.state` when `endedAt` is empty.
  - For a launch with no known transcript, the ruled record has no field that can answer. Adding one (a pid) changes Axel's ruled record, so that part is a stop for Axel, not a builder fix. The report states the limitation but books neither part.
- **`src/lib/server/sessions/stores/transcripts.ts:293-299, 416-432` (`builder`): a builder's transcript outside the window is pushed into `found`, so it appears in the session list.** Brief decision 4 says "A dispatched builder is drawn in the Agents view only; the session list is Q65's this run". The report's judgment call 5 admits the row appears in the session list. The row also bypasses `maxSessions`, because it is added after `gather` caps the list. Either the child is kept out of the list payload and the Transcript view is given another way to find it, or Axel rules that this is acceptable.
- **Premise check.** Brief item 4, "opens it as the view opens a subagent's", is false on the base: `git show cee6d57e:tools/oculus/src/lib/views/sessions/agents/Agents.svelte | grep -n "onclick\|openView"` prints only `88: onclick={togglePanePin}`. The builder's open control uses `openView('transcript', { session, label })`, which is a reasonable reading. It is still a reader-visible control the brief did not shape.
- **The widened paths.**
  - `src/lib/server/core/context.ts` (`...sessionFolders(local.accounts)`) and its test: needed, since without them item 1 reaches nothing.
  - `tests/data/real-hub.probe.ts`: needed, since the stores lost their home defaults.
  - `tests/checks/tree/allow-duplication.txt` (one line removed) and `tests/checks/tree/duplication.test.ts:266` (directive `:125` to `:124`): follow from the change to `Agents.svelte`. **Both files are also changed by Q65**, which removes 4 lines and adds 1 in `allow-duplication.txt` and changes the same directive line to `:122`. That is a path both steps change and a certain conflict at `duplication.test.ts:266`: the combined line number has to be recomputed after both land.
- **The reorder of the Agents view** (`Agents.svelte:52-59`, sort by `started`). `src/lib/server/sessions/record.ts:210` already sends newest first (`.slice(-MAX_AGENTS).reverse()`), so the base view's second `.reverse()` drew oldest first, against its own comment. The builder's claim is correct, and the sort is needed to interleave the launches. An agent with a null `started` now goes last instead of keeping its position.
- **Cross-catalog keys.** `Agents.svelte` now reads `sessions.transcript_glyph` (defined in `config/text/views/sessions/transcript.yml:4`) as well as `sessions.meta_sep` (defined in `config/text/views/sessions/session-list.yml`). The step depends on catalog files that the brief gives to Q65.

## Proof

- The concurrency case `writers started at once all land their record` (`tests/checks/bin/dispatch-note.test.ts`) is red under its revert. It still passes over a writer that loses records in about 2% of 24-writer rounds (my stress run above), so the case does not cover the property Axel named. No case covers a stale lock under concurrency, or a reused pid.
- The report's row 11 claims `42 reverts, 0 unproven, 66 unchecked` for the node files and `2 reverts, 0 unproven` for the browser spec. My runs gave `35 reverts, 1 unproven, 66 unchecked` over all nine files, and `2 reverts, 1 unproven` for the browser spec alone. Each browser directive has been red in exactly one of my runs. Its "0 unproven" is not reproduced as stated; the likely cause is port contention with Q65, which is not verified.
- `audits that nothing is read when no account is named` (`tests/server/sessions/folders.test.ts`) is named as an audit with no revert. The reason given (the only revert that would turn it red makes the test read the real home) is sound.
- No threshold, tolerance or predicate is loosened in the diff. `allow-duplication.txt` removes an entry and adds none.

## Standards

- The builder ran `git show HEAD:tools/oculus/src/lib/server/core/context.ts`, against the brief's "Run no git command" (O31.md, first paragraph). It was read-only, and the report says so.
- `bin/dispatch-note.mjs:118-122` (`takeLock`): a writer killed between `writeFileSync(own, ...)` and the `finally` leaves `dispatches.json.lock.<pid>-<hex>` behind, and one killed inside `clearStale` leaves `.stale-*`. Nothing sweeps either, so SIGKILLed writers leave files in `~/.oculus` that are never removed. The report lists this. It is small, but it is litter in a folder the watcher filters by name.
- No history in comments, no non-ASCII (the ASCII gate printed nothing), no file over its limit (size-check exit 0), and the comment lines stay within the hundredth column (format and lint exit 0).
- Doc text. `HELP.md:179`, `HELP.md:106`, `DESIGN.md:104`, `:108`, `:110` and `:223` still name `~/.claude/projects`, `~/.claude/sessions` and `~/.codex/sessions` (seen by `grep -n`). The report's "Doc text" section covers each line and gives a replacement. I did not check the replacements word by word against the code beyond those greps.

## Behaviour

- A machine whose `local.yml` names `accounts` without a `tool: codex` entry now shows no Codex sessions; before, `~/.codex/sessions` was always read. The same holds for Claude. The defaults in `src/lib/data/sources/config/local.ts:111-114` cover a machine with no `accounts` key. The report does not state this before and after.
- A builder's transcript that is older than the window now shows up as its own row in the Sessions list (see Spec). The report states it only as a judgment call, not in its before and after.
- The Agents view's order changed from oldest first to newest first for subagents too, not only when launches are present. The report's before and after says "drawn oldest first" to "newest first by start time", which is accurate.

## What I did not check

- The report's read of the real accounts (`liveSessions(...)` found 4 live sessions, and `~/.claude` alone found 0). I read no real home folder.
- The look on the TEST page named in the 2026-09-21 booking.
- Whether the stress-run losses come only from the sequence described under Spec or also from another path. The loss is reproduced; the exact interleaving is inferred from the code.
- The report's line counts for each file.

Two files I wrote are outside the scratchpad: logs at `/tmp/o31rev-build.log` and `/tmp/o31rev-revert.log`. The stress scripts are in the session scratchpad (`race.sh`, `race-nostale.sh`, `w.mjs`), and their scratch homes were removed. I touched nothing in either worktree.

## Usage

Not measured. About 60k tokens of context by estimate, plus four long runs: the unit suite, two revert-check runs, and about 12 minutes of writer stress runs.

# Repair round 1, refuted

## Verification lines (run from `.agents/worktrees/O31/tools/oculus`)

- `npx vitest run --reporter=dot`: `Test Files  278 passed (278)`, `Tests  4485 passed (4485)`, `Duration  106.72s`
- `npm run check`: `COMPLETED 1291 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`
- `npm run build`: exit 0
- `npm run format:check`: `All matched files use Prettier code style!`
- `npm run lint`: exit 0
- The ASCII perl gate printed nothing (exit 0).
- `sh bin/size-check.sh`: exit 0. `sh bin/folder-check.sh`: exit 0.
- `npx playwright test tests/browser/sessions/agents.spec.ts`: the first try refused because port 8792 was held by pid 34181 (`.agents/worktrees/Q65/tools/oculus/src/server.ts`). I waited for the port to free and did not kill anything. Rerun: `2 passed (6.7s)`.
- `node bin/revert-check.mjs` over dispatch-note, folders, dispatches, agents view, context, codex, transcripts, watch/sessions and duplication: `44 reverts, 0 unproven, 67 unchecked`, exit 1. The exit is 1 because `bin/revert-check.mjs:499` fails on any unchecked case. All 44 lines are `red`.
- `node bin/revert-check.mjs tests/browser/sessions/agents.spec.ts` (port free): `2 reverts, 0 unproven, 0 unchecked`, both red.
- Temporary folders, `ls -d $TMPDIR/oculus-* | wc -l`: 7015 before and 7016 after. The extra folder is `oculus-revert-3kjJnj`, created at 03:13:15 while Q65's `revert-check` (pid 41664, cwd in the Q65 worktree) was running. This step's prefixes (`oculus-accounts-`, `oculus-dispatches-`, `oculus-dispatch-note-`) were 0 before and 0 after.
- `git status --short` in the worktree lists 24 entries, the same set as at the start. I changed nothing in the worktree.
- My own writer runs, with scripts in the scratchpad: `longwait.sh`, and `longwait-touched.sh` over the scratch copy `dn-touched.mjs`.
  - Setup: 24 writers start at once. The lock is held by a live `sleep 60` pid, and its mtime is set 1.5 s ahead, so the writers wait past `LOCK_WAIT_MS`.
  - The worktree's `bin/dispatch-note.mjs` lost records in 2 of 16 rounds: `round 5: landed 23 of 24, failed writers 0` in a 6-round run, and `round 9: landed 23 of 24, failed writers 0` in a 10-round run.
  - The scratch copy differs only by `utimesSync(own, new Date(), new Date())` before `linkSync(own, lock)`. Over 10 rounds it gave `landed 24 of 24` every round.
- Codex rollout gaps. A read-only node script over the 30 newest rollouts under `~/.codex/sessions` printed only counts: `{"files":30,"turns":262,"gapsOver120sInOpenTurn":46,"ofWhichDuringToolCall":29,"maxGapSec":3445}`.

## Spec

- **Ruling 3: `src/lib/server/sessions/stores/dispatches.ts:83` shows a row as `done` for a Codex builder that is still running.**
  - The code:
    ```ts
    const done = note.endedAt !== '' || (child !== null && !child.live);
    ```
  - A Codex child counts as live only if its rollout was written in the last `CODEX_FRESH_SECONDS` = 120 (`stores/codex.ts:31`, `:322`).
  - The rollout count above found 46 silences longer than 120 s inside open turns, 29 of them while a tool call was pending, the longest 3445 s.
  - So a Codex builder running a test suite or any long command reads not live. Its row turns `done`, with `ended` set to the builder's last activity, then goes back to `running` at the next rollout write, and so on.
  - Whether a running `claude -p` writes a registry entry is still not verified: my attempt to read the registry folders was refused by the permission classifier. If it writes none, a Claude builder whose transcript is in the scan reads `done` from its first scan.
  - The proposed rule is: trust the missing end stamp while the launcher's session is live, and fall back to the builder's liveness only once the launcher's session is not live.
    - For a Claude launcher it closes the case, because a Claude session's liveness is its pid in the registry. That covers plan-orchestration run from Claude Code with a Codex worker: the orchestrator is live for the whole build, so the row reads `running` until `end`.
    - For a Codex launcher it does not close the case. A Codex orchestrator blocked on `codex exec` or `claude -p` inside a tool call is itself "not live" after 120 s, so the rule falls back to a Codex builder that may also read not live, and the row reads `done`.
    - I recommend the rule, with the Codex-launcher gap stated and booked. The lazy option is to keep the current rule and book the Codex case as a limitation.
- **`bin/dispatch-note.mjs:167-176`: a writer that waited longer than `LOCK_WAIT_MS` takes a lock that is already stale by age, and the other waiters then clear it while it writes.**
  - The code:
    ```js
    writeFileSync(own, content, { mode: 0o600, flag: 'wx' });
    const deadline = Date.now() + LOCK_WAIT_MS + 2000;
    ...
            linkSync(own, lock);
    ```
  - `own` is written once, before the wait. `linkSync` makes a hard link, so the lock's mtime is the time the writer started, not the time it took the lock.
  - `stale()` (`:111`) judges by that mtime. A waiter that queued more than 10 s ago therefore holds a lock that every other waiter judges stale, and they remove it under the breaker, whose re-check passes because the content has not changed.
  - One stalled or pid-reused holder, which ruling 2 accepts losing, therefore loses records of other writers too, all of which exit 0.
  - Reproduced above: 2 losses in 16 rounds, against 0 in 10 rounds for the copy that refreshes the mtime before linking.
  - Fix inside the ruling: `utimesSync(own, now, now)` before each `linkSync`, or judge age from a time written into the content when the lock is taken.
- **The residual the builder names (`:126-127`) is wider than stated.**
  - The code:
    ```js
    if (Date.now() - statSync(breaker).mtimeMs > BREAK_STALE_MS) rmSync(breaker);
    ```
  - This is stat-then-remove, so a clearer can remove a breaker that another clearer created a moment ago, after a third clearer removed the stale one. Two clearers then hold "the" breaker, and a lock re-read under one can be removed after the other has let a new writer link in.
  - It still needs a stale breaker first: a clearer killed between the `wx` create at `:123` and the `finally` at `:136`, which is a window of one read and one remove. Then a burst of clearers has to arrive when that breaker ages out.
  - My judgement: rare enough to accept, since pure-file locking in Node has no atomic compare-and-remove. But it is neither in the head comment (`:12-17` reads as unconditional) nor booked, and it should be both.

## Proof

- **The re-check at `bin/dispatch-note.mjs:134` is proven by no case.**
  - The code:
    ```js
    if (readText(lock) === judged) rmSync(lock, { force: true });
    ```
  - The only directive over `breakStale` is the stress case's range `:121-137`, which puts back the old rename-aside clearer. That proves the old design is gone, not that the comparison matters.
  - I did not rerun the builder's one-line revert (`:134 => rmSync(lock, { force: true });`) over 150 rounds. Its GREEN is the builder's claim and was not reproduced by me.
  - A deterministic case that would prove it:
    - Export `breakStale`, which the file already does for `takeLock`, `sweepLitter` and `update`.
    - Write the lock with content `"<live pid> taken-since"`, call `breakStale(lock, '<dead pid> judged')`, and assert the lock still exists with its content and that `${lock}.break` is gone.
    - Under the one-line revert the lock is removed, so the case is red on every run. It needs no concurrency and no rounds.
- No case covers a waiter that waited past `LOCK_WAIT_MS` (the Spec finding). The stress case uses a dead-pid lock, which is cleared at once, so no waiter's `own` ever ages past 10 s.
- The ruling-3 case (`tests/server/sessions/stores/dispatches.test.ts:268-283`) covers a Claude child with a registry pid only. No case covers a Codex child past 120 s of silence, which is the case that reads wrong.
- The stress case is red under its range revert in my run. It is probabilistic: about 60 s and 3600 process spawns per suite run.
- The revert counts reproduce. Node files: `44 reverts, 0 unproven, 67 unchecked`. The builder reported `44, 1, 67` and explained the 1 as a green it then replaced. Browser: `2, 0, 0`.
- No threshold, tolerance or allow list is widened by the round.

## Standards

- **`tests/checks/bin/dispatch-note.test.ts`, the stress case's comment, carries history.**
  - The comment:
    > "The loss this guards against is a race that shows in a few rounds of a hundred, so the case runs as many rounds as it took to see it ... Its revert puts back a clearer that moves a lock aside and links it back when it took the wrong one, which is the design that lost records."
  - "as many rounds as it took to see it" and "the design that lost records" record an earlier bug and a replaced design. The rule allows a comment to say what and why, never which earlier bug or reverted attempt.
- **`bin/dispatch-note.mjs:117`**: "Nothing moves a lock aside or puts one back." It describes the replaced design by negation, and is the same kind of history.
- **`bin/dispatch-note.mjs:12-17`**, the head comment: "cleared under a second lock that re-checks it first" is stated without the breaker residual (see Spec). The sentence is true, but a reader takes it as the whole guarantee.

## Behaviour

- **Ruling 3, the flip for a Codex builder.** The report's before and after gives "running while live, done after". It does not state that a Codex builder's row can switch between `running` and `done` for the whole run, each `done` showing an end time that is later overwritten. Before this round, the row read `running` until `end`.
- **The browser spec's first case** (`tests/browser/sessions/agents.spec.ts:115-116`) now asserts `ag_done` for a note with no end stamp. The report states this, and it matches the fixture (the builder is not live). It is also the behaviour the Spec finding questions for live Codex builders.
- **The launch-note bullet in the Doc text.** The builder's replacement ("its row names the builder's session when the scan found that transcript") is accurate. The proposed doc lines still say nothing about when a launched row reads `done` without an end stamp, and ruling 3 changed that.

## What I did not check

- Whether a running `claude -p` writes `<pid>.json` into a Claude registry. Reading the registry folders was refused by the permission classifier.
- The builder's 150-round GREEN for the one-line revert of `:134`, and its scratchpad stress figures (`0 of 150` with and without a stale lock).
- The look on the TEST page.
- The line counts in the report's table.
- The Doc text replacements word by word, beyond reading them against the code paths above.

Files I wrote are only in the session scratchpad: `vitest.log`, `revert.log`, `longwait.sh`, `longwait-touched.sh` and `dn-touched.mjs`. Their scratch homes were removed.

## Usage

Not measured. By estimate about 70k tokens of context, plus these runs: one unit suite, two revert-check runs, one playwright run, and about 5.5 minutes of writer stress runs.

## Closed

The first run's findings, closed in repair round 1 (`agents/reviews/O31-report.md`, "# Repair round 1") unless named otherwise:

- Spec, the lock losing records with several writers: clearing now happens only under `dispatches.json.lock.break`, re-reading the lock and removing it only if it is still the one judged dead; the 24-writer, 150-round stress case is red under its revert.
- Spec, a lock whose pid a live process reused: a lock older than the wait is stale whatever its pid; a case is red under its revert.
- Spec, a launched row reading running for good: a row with no end stamp follows its builder's own session once its launcher's session is not live (the launcher half fixed at landing, below). A launch with no known transcript still reads running until its end stamp; whether the record carries the builder's pid is the open item in `orchestrator-state.md`.
- Spec, a builder transcript folded outside the window into the session list: the special path is removed; a launched row opens a transcript only when the scan already holds it, and an audit names the older case.
- Spec, the Agents view's open control and its new order: kept, stated in the report with their before and after.
- Spec, the widened paths: `core/context.ts`, its test and `real-hub.probe.ts` are needed for item 1; `allow-duplication.txt` and the directive at `duplication.test.ts:266` are shared with Q65 and are recomputed at Q65's landing, which comes after this one.
- Spec, the cross-catalog keys (`sessions.transcript_glyph`, `sessions.meta_sep`, read from Q65's catalog files): read only; checked again at Q65's landing.
- Proof, the concurrency case not covering the property: the stress case with a dead writer's lock covers it.
- Proof, the revert counts: re-run in the round and at landing.
- Standards, the git command the builder ran: recorded in the usage row; nothing in the tree.
- Standards, a killed writer's leftovers: swept by the next writer; a case is red under its revert.
- Behaviour, a machine whose `accounts` name no tool of one kind: stated with its before and after in the round's report.

The run over repair round 1, closed at landing on 2026-09-23:

- Spec, a Codex builder reading done while it still runs: a launched row with no end stamp reads running while its launcher's own session is live, and follows its builder's session only once the launcher's is not (`src/lib/server/sessions/stores/dispatches.ts:90`); the case "reads a launch as running while its launcher lives, whatever its builder reads" is red under its revert. A Codex launcher with a Codex builder can still read done after two minutes of silence from both; ruling (a) of the open item, the builder's pid, closes that too, and the open item says so.
- Spec, a writer that waited past the wait taking a lock already stale by age: the writer stamps its copy's times just before linking it (`bin/dispatch-note.mjs:184`); the case "is taken fresh by a writer that waited" is red under its revert.
- Spec and Standards, the breaker's residual: stated in `breakStale`'s comment and pointed to from the head comment. Two clearers can each remove a breaker left by a dead clearer at once, which needs a clearer killed in the moment it holds the breaker; the file system gives no way to make a look-then-remove one step, and each clearer still removes only a lock it re-read as the one judged.
- Proof, the re-check proven by no case: `breakStale` is exported and the case "is removed by a clearer only while it is still the lock the clearer judged dead" is red under the one-line revert, deterministically.
- Standards, history in the stress case's comment and in `breakStale`'s: both rewritten to say what the code does.
- Behaviour, when a launched row reads done without an end stamp: in the Doc text applied at landing.
