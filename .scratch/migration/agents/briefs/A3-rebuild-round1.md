# A3 (rebuilt under Z569 to Z585), repair round 1

The review of your build is `agents/reviews/A3-refuter.md` (main checkout ledger); read it whole first. Each item below names the finding it closes and says what to change. Your brief `agents/briefs/A3.md` and `agents/spec.md` still hold in full; this round widens your paths only where an item says so. Line numbers are the reviewer's; check each with `grep -n` before you change it.

Never use breakage testing of any kind: no mutation, no revert or removal of code to watch a test fail, no injected fault, no scratch copy with a block removed. A test is judged by reading it. You run no git command of any kind, read-only ones included. Never start an app window or take focus; never touch Axel's `~/.oculus`, a real `claude`, ports 8787 or 8790, or his tmux server.

## Items

1. **Spec 1 (Z609).** A Pause, a Resume and a Save change only what they change, on the entry's node in the YAML document: a pause sets `paused: true`, a resume removes the `paused` key, and a save sets each key whose value changed and removes each key the dialog cleared, so every other key, its order, its comments and a value `readEntry` would normalise (an unknown task, an unknown key, `when: 5`) stay as the reader wrote them. The re-parse check compares the raw list read back with the raw list asked for, never with `readEntry`'s normalised entry. A row whose entry reads with a problem keeps Pause and Resume, and they leave the problem as it was. The run: the reviewer's five probe lines (`task: radar`, the unknown key `at`, `when: 5`, `unattended: 1`, the key order with its comment) each through Pause then Resume, the file before and after quoted, byte-equal after the pair.
2. **Proof 2.** G31's table in `tests/server/machine/schedules/file.test.ts` ('refuses an edit over a schedules file it cannot read, leaving it') gains rows through the route (`handleSchedules`): a save, a delete, a pause and a resume over each of the three unread texts, each answering 409 `schedules-unread` with the file byte-equal after. Quote its run.
3. **Standards 2 and Z610.** DESIGN.md:138 says that a save and a delete refuse with `schedules-unread` or `record-unread`, and a pause or a resume with `schedules-unread`, before they write; that the route edits the entry's node in place so the other keys, their order and comments stay; HELP.md:25 says the same of comments. Both sentences become true by item 1.
4. **Standards 3.** The schedule store words a failed answer by `failedAnswer` of `state/shared/answers/answers.ts`, as DESIGN.md's "Untyped input" says; `app.schedules.unreachable`, `unreadable` and `refused` are removed from the catalog. The route's commit failure answers `{ error: word, names }` as item 12 of the brief says, never the operating system's message.
5. **Standards 1.** The title at `tests/checks/config/config.test.ts:378` says what the row checks: the sentence a retired key's finding gives, which names the Run unattended choice. Name the old and new title in the report.
6. **Behaviour 1.** `routes.ts:163-177` commits `schedules.yml` first, and renames or drops the record only after the commit succeeded, so a failed commit leaves the record as it was.
7. **Behaviour 2 (Z610).** A `close()` between `claimDue` and the launch (`watch.ts:484-491`) records that run `failed` with `why: { word: 'server-stopped' }` instead of leaving it `started` with no terminal; the row then shows the due time did not run. Its run quoted.
8. **Proof 4.** S51 run again so the due-time refusal path is reached (the record of the run `failed` with `why: { word: 'folder-not-served' }`), with the watcher's reload held off as the case needs; quote it. If the case cannot reach it, say so.
9. **Proof 5.** The report's sentence on file modes says what holds: a file oculus creates is 0600; a file the reader made keeps its mode.

## Verify before you report

The brief's list, once, after the last change: from the worktree's `tools/oculus`, `bash ~/.claude-work/skills/land/templates/checks.sh /Users/axelfaes/workspace/research-hub/tools/oculus/.scratch/migration/orchestrator-state.md`, the lines quoted; then `npm run test:checks` and the brief's verify item 2 (the seven test files). While working, run only the test files you changed.

## Report

Append "# Repair round 1" to your report in the worktree's ledger copy: one row per item, DONE or NOT DONE with its command or run, NOT DONE first; the runs; every test added or changed by file and title; the verify lines.
