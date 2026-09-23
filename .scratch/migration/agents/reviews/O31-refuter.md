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
- **Premise check.** Brief item 4, "opens it as the view opens a subagent's", is false on the base: `git show 10c2852c:tools/oculus/src/lib/views/sessions/agents/Agents.svelte | grep -n "onclick\|openView"` prints only `88: onclick={togglePanePin}`. The builder's open control uses `openView('transcript', { session, label })`, which is a reasonable reading. It is still a reader-visible control the brief did not shape.
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
