# Step T1c refuter report

T1c review (refute), worktree /Users/axelfaes/workspace/research-hub/.agents/worktrees/T1c, base d160d13f.

Not done in the step, and therefore open:
- Item 1 is violated by one deletion: `root/vite-plugin.test.ts` loses the only test of the port move's fall-back branch. Spec 1 below.
- Item 3 is violated in three places: two untagged quick tests start a process or open sockets, one untagged quick test runs at 104 ms minimum, and `config-key.test.ts` carries a whole-file tag although about 10 of its cases run under 100 ms. Spec 2 to Spec 4 below.
- Item 7 is partial. The report gives no reason for each root/watch removal, and it misstates the config-key fold mapping. Proof 1 and Proof 2 below.

## Verification lines (my run of checks.sh in the worktree, saved at /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/t1c-review/review-checks.out)

```
$ npm test
 Test Files  567 passed | 39 skipped (606)
      Tests  13777 passed | 859 skipped (14636)
$ npm run test:checks
 Test Files  31 passed | 2 skipped (33)
      Tests  471 passed | 9 skipped (480)
$ npm run check
1791053663223 COMPLETED 3338 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build
built in 4.25s
built in 11.40s
$ npm run format:check
All matched files use Prettier code style!
$ npm run lint
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 7 commands passed
```

- The run exited 0. Load was 3.15 3.41 4.05 at the start and 6.65 5.58 4.87 at the end.
- Whole-folder timings, `npx vitest run tests/server --tagsFilter '!slow'`, one run each:

| Tree | Load before | Result | Duration |
|---|---|---|---|
| Copy of main's `tests/server` | 3.04 3.16 3.33 | 121 files passed, 17 skipped; 2031 tests passed, 444 skipped | 56.88 s |
| Worktree | 8.93 4.69 3.88 | 109 files passed, 30 skipped; 1670 tests passed, 639 skipped | 17.74 s |

- The copy of main's tests sits in my scratch folder with node_modules linked to the worktree's. `local.yml` was excluded from the copy.
- Diff: 111 files changed, 1732 insertions, 3758 deletions (`git diff d160d13f --stat`).
- `git status --short` shows three new files: `tests/server/accounts/calendar/poll-fixture.ts`, `tests/server/accounts/calendar/poll-timeout.test.ts` and the report. No test file was deleted.
- A scan of every added line for non-ASCII characters found none: `grep '^+' full.diff | LC_ALL=C grep '[^ -~]'` printed nothing.

## Verdicts

### Items of "What to build"

1. Delete tests that break `spec.md:57`, keeping the source checks of forbidden writes: **violated**.
   - Every deletion I checked except one is held by a kept or lower-level test. The full list is under Proof 3.
   - The exception is `root/vite-plugin.test.ts`. Main's case at `:330`, "listens on the old port again, and tells the page nothing, when the listen on the new one fails", is deleted.
   - That case was the only test of `src/lib/server/root/mover.ts:129-137`. In that branch the new listen fails, `back === null`, the refusal is returned, and `announce()` is never called. See Spec 1.
   - The source checks of forbidden writes are kept unchanged. In `git-write.test.ts` the three source checks read the same before and after (`sed` of both trees). The autofetch source check is kept at `autofetch.test.ts:779` and retitled.
2. Fold cases into tables: **holds, with one partial point on naming**.
   - Every table I ran passed: deck-edit, chat, table, ssh, the autofetch `it.each` and the other folded files, 161 tests passed across 8 files.
   - In `machine/processes/match.test.ts` vitest cuts row titles longer than 40 characters with an ellipsis, for example "matches nothing for 'a program whose path holds the name a...'". In the verbose output the row therefore does not fully name its case. The source is ASCII.
3. Tag slow by cause and by time (Decision 1): **violated**. See Spec 2, Spec 3 and Spec 4.
4. Keep every other test with no assertion loosened, retitle false titles, drop "audits", replace the two wall-clock margins: **holds**.
   - `grep -rn -i audits tests/server` prints nothing.
   - `ignored.test.ts`: the timeout case now uses a fake git that runs `sleep 2; touch <marker>`, and asserts `existsSync(finished)` is false at the answer (`:179-190`). This is stricter than the old margin.
   - `lines.test.ts`: the elapsed-time assertion is replaced by `vi.waitFor`, and the SIGTERM sentence assertion stays.
   - `writes.test.ts`: the 20 ms sleep is replaced by `utimesSync` 60 s into the past. This is stricter.
   - The git-ops retitle "refuses to take a deletion on a path both sides changed" is correct, since the body never tested "not in conflict".
   - The `core/changes.test.ts` diff carries prettier and comment-rewrap churn. No assertion changes meaning. See Standards 3.
5. Comments and helpers, with outside-imported helpers keeping every export: **holds for the exports, with two comment findings**.
   - `git diff d160d13f --stat` lists no change to `machine/line-counts.ts`.
   - `tmux-fixture.ts` keeps its exports and adds `tmuxOptions`.
   - The new `tmux-fixture.ts` comment is inaccurate. See Standards 1.
   - `poll-timeout.test.ts` has no layer label in its head comment. See Standards 2.
6. Stale `allow-duplication.txt` entries removed: **holds**. `npm run test:checks` is green (above).
7. Report contents: **partial**. See Proof 1 and Proof 2.
8. Doc text: **holds**.
   - The report covers `hooks.ts:63`, `tests/routes/machine/commands.test.ts:8`, `tmux.ts`, `sessions.ts`, `git-message.ts`, `vite.config.ts:31-35`, `README.md:15`, `HELP.md:340/342` and `spec.md:56`.
   - My grep of every mention of `tests/server` outside the folder found no other sentence that the sweep made false.

### Cases

- `block-edit.test.ts:411` (delete): **met**. A grep for "scalar writer" and "yaml library's" in the worktree file prints nothing.
- `autofetch.test.ts:799` (keep, retitle, tag the real-git cases): **met**.
  - The check is now at `:779`: "reaches git only through fetchIn, remoteNames and sshCommand, and starts no process of its own".
  - The describes at `:572` and `:632` carry `{ tags: ['slow'] }`.
- `folders.test.ts:173` (delete): **met**. A grep for "no account is named" prints nothing.
- `customizations.test.ts:99` (delete, keep `beforeAll`): **met**. `CUSTOMIZATION_KINDS` no longer appears, and the `beforeAll` blocks at `:44`, `:94`, `:152` and `:257` are kept.
- `picker.test.ts:111` (delete): **met**. A grep for "folders only" and `PICKER_SCRIPT` prints nothing.
- `yaml-edit-followup.test.ts:157` (keep, retitle): **met**. The title is now "keeps a comment after a flow list after its last value".
- `ignored.test.ts` four cases: **met**.
  - `:153` and `:158` are gone.
  - The timeout case is at `:179`, tagged slow, with its margin replaced.
  - The failed-git case is at `:191`, tagged slow.
- git-write source checks and Decision 5: **met**.
  - The source checks are unchanged.
  - The file also changed its head tag sentence ("its cases start real git processes"), which is true.
  - It also deleted "refuses a path that is not a worktree of the root". That case is held by the kept climb case at `:401`, which reaches the same `worktreeUnder` false branch (`git-write.ts:509`, `OUTSIDE_WORKTREES`) and asserts the same two refusals.
- `core/paths.test.ts` untouched: **met**. `git diff d160d13f --stat` lists no change to it.
- Helper exports (`line-counts.ts`): **met**.
- Stale allow-list entry removed, `test:checks` green: **met**.
- Folds listed old title against row, each row keeping its expectation, table passing: **partial**.
  - The tables pass, and each expectation I compared is kept.
  - The config-key mapping is misstated (Proof 2).
  - The match titles are cut in the verbose output (item 2).

## Spec

1. `tests/server/root/vite-plugin.test.ts`: the deleted case covered behaviour that no kept test reaches.
   - The deleted hunk, main `:330`: `it('listens on the old port again, and tells the page nothing, when the listen on the new one fails', async () => {`
   - The code it alone reached is `src/lib/server/root/mover.ts:129-137`: `const back = await listenOn(server, address.port); if (back !== null) { ... exit(1); } return refused;`. Only the `back === null` path, which returns `refused` without calling `announce()`, lost its test.
   - What the kept tests reach instead:
     - "logs both reasons ... exits with status 1 when neither port can be listened on" reaches the failed relisten.
     - "refuses a port in use without telling the page or stopping the server" reaches the probe branch at `:112-113`.
     - `context-reload.test.ts:579` uses a fake move.
   - The report gives no reason for the deletion.
   - Failure scenario: a change makes the fall-back relisten skip, or call `announce()` before it. After a failed port move the server serves nothing, or the page is sent to a port nothing listens on, and every oculus view stops working. No test fails.
   - Verdict: item 1 violated. The fix is to restore the case.
2. Two quick tests with a Decision 1 cause are untagged.
   - `tests/server/sessions/registry.test.ts:23`, "reads this process's start time under a locale that is not English", calls `systemProbe.starts`, which runs `ps` through `spawnSync`.
   - `tests/server/root/process/serve.test.ts:41`: `await new Promise<void>((resolve) => server.listen(0, LISTEN_HOST, resolve));` opens loopback sockets in the quick tier.
   - Neither file is in the diff, since `diff -q` against main reports them identical. They sit in the swept folder, and item 3 tags every test with a cause.
   - Evidence: my probe (`NODE_OPTIONS=--import probe.mjs`) wraps `child_process` and `net.Server.prototype.listen` and records the running test. Over one `!slow` run of `tests/server` (1670 passed, 639 skipped, 17.38 s) it named these two.
   - The probe also recorded `tmux -V` spawned at import in `task.test.ts`, `sessions.test.ts`, `compose.test.ts` and `channel.test.ts` (plus `python3` in channel). These calls run at module load, outside any test. Two of those files, `task.test.ts` and `sessions.test.ts`, now load in the quick tier because their file tags were removed.
   - Failure scenario: the quick tier still depends on `ps` and on loopback listening, so a sandbox or a loaded machine fails `npm test` for a reason the tiers exist to keep out.
   - Verdict: item 3 violated.
3. `tests/server/edit/writes-collection.test.ts`: "clears a field of any type with an empty value", the first quick case of a collection entry write against its own file's schema, is untagged.
   - Over 8 `!slow` verbose runs at load 3.4 to 5.0 it took 112, 107, 104, 104, 253, 110, 114 and 219 ms, so its minimum is 104 ms.
   - The builder's figure of 99.7 ms over 6 runs puts it at the boundary. The verdict depends on load. On this machine, in this run, it fails verify item 3.
   - `edit/writes.test.ts` "sets a status of the vocabulary..." measured 100 ms once, with a minimum of 92 over 4 more runs. It passes.
   - Verdict: item 3 partial, and verify item 3 not met on my sample.
4. `tests/server/edit/config-key.test.ts` head: "@module-tag slow: each case merges the whole config folder and takes 100 ms or more."
   - Measured: 35 or 36 of the 45 tests take 100 ms or more. The rows of the shared-engine table run at 83 to 87 ms.
   - The sentence is therefore false for about 10 cases, and item 3 allows a whole-file tag only when every test is slow.
   - `core/changes.test.ts` has the same problem in a milder form. The head says "Every case takes about 100 ms or more", but 12 of 21 tests take 100 ms or more, with a minimum of 89.
   - `config-value.test.ts` holds: all 26 tests take 100 ms or more, minimum 175.
   - Failure scenario: about 10 fast config-key cases leave `npm test` with no cause behind their exclusion, and the head comment misstates what the file is.
   - Verdict: item 3 partial. The fix is a per-describe or per-test tag, or the sentence corrected and the choice argued.

## Proof

1. Item 7: the report gives no reason for each removal in the root/watch section.
   - Removals with no reason: the vite-plugin relisten case, the bookmarks burst, `local` "makes no call after it is closed", the git-watch stderr case, the names case, the four portfolio cases and the two roots cases.
   - I checked each one against kept tests. All except the vite-plugin case are held: portfolio republish by `portfolio.test.ts:408`, and the others by their kept siblings.
   - The report does not show this, so the reader cannot check the deletions without redoing the work.
   - Verdict: item 7 partial.
2. The config-key fold mapping.
   - The report says "the other four first rows", but the new table holds three.
   - The dropped row is `['usage_refresh_model', '', 'usage_refresh_model must not be empty']`. The new table type, `[string, number, string]`, cannot hold it.
   - No coverage is lost:
     - `refresh.test.ts` "refuses a cadence outside 1 to 35791, and a model that is empty or not text" holds the branch.
     - The `usage_refresh_min` 0 row holds the `requireRefreshSettings` wire.
     - Each READERS wire (`config-checks.ts:104-120`) keeps one row.
     - The null rows (`~`, `null`) take the same `!valued` branch as empty (`config-key.ts:57-60`). I checked with the `yaml` library that both parse to null.
   - Verdict: item 7 partial, a misstatement with no loss of coverage.
3. Deletions I confirmed are held, each by the test named:
   - run.test approval cases: `approvals.test.ts:189` and `:215`.
   - Name quoting: `chain.test.ts:37`.
   - Cycle: `resolve.test.ts:33`.
   - Placeholders: `placeholders.test.ts:166` and `:182`.
   - hooks-server origin: `auth.test.ts:21` and the `socket.test.ts:74` `allowedOrigin` unit.
   - Socket upgrade with no origin: `allowedOrigin(undefined)`.
   - hooks `handleHook` and `notifyConfig`: the kept tables.
   - git.test "caps each list": `held.test.ts`.
   - "optional locks": `git.test.ts:723`.
   - "comes back empty": `:435`.
   - compare "writes nothing back": the compare-gate vectors.
   - config-value `__proto__`: `config-key.test.ts:328`, through the shared `optionOf`.
   - YAML render cases: `block-edit.test.ts:248`, `:283`, `:358`, `:372` and `:398`.
   - deck-edit guard: the kept flow-style null case.
   - entry-edit subtask: the clear branch at `subtasks.ts:174`.
   - fs reserved keys: `fs.test.ts:640`.
   - git-write worktree: the climb case at `:401`.
   - deposit default branch: the theta case.
   - autofetch key 0: "starts rounds when the key goes from 0 to 2...".
   - shutdown signals: the kept case calls both handlers.
   - transcripts id refusal: `overrides.test.ts:78`.
   - Steer: `sessions.test.ts:201` and the real-tmux wiring at `:328`.
   - calendar route address: the `linkFor` null branch, also reached at `routes.test.ts:78`.
   - mail routes scopes and `defaultConnectDir`: constants.
   - `mail/write` recipient fold: the new row uses REPLY with `to` changed, and the expectations match.

## Standards

1. `tests/server/machine/pty/tmux-fixture.ts`: a change outside every item, inside the paths.
   - It adds the export `tmuxOptions` and rewrites `watchEnds`:
     ```ts
     let counted = 0; let taken = 0; const waiting: (() => void)[] = [];
     const count = async () => { for (;;) { try { await run('wait-for','died'); } catch { return; } counted += 1; for (const wake of waiting.splice(0)) wake(); } };
     ```
   - Judgment: accept, with the comment corrected.
     - The change is justified by verify item 2. With main's fixture, main's `task.test.ts` alone under `--tagsFilter slow` failed 3 of 6 runs at load about 2: the respawn cases "captures all the text..." and "sets the values of a task..." timed out at 30000 ms.
     - With the worktree's fixture, main's `task.test.ts` passed 8 of 8 (12 tests), and the worktree's `task.test.ts` passed 8 of 8.
     - The fixture's consumer outside the folder, `tests/state/sessions/terminal/commands-pane.test.ts`, passed 4 of 4.
   - Two defects:
     - The new comment says a signal "is never held long enough to merge with the next one". That is inaccurate. Between one `wait-for` returning and the next starting, a signal is held and can merge with the next one. The merge does no harm, because `taken = counted` takes every counted end at once, but the sentence should say that.
     - When `wait-for` fails, the counting loop returns silently, and every later wait hangs until the test timeout. The old version rejected with an error. Failure scenario: a tmux server that dies mid-test now shows as a 30 s timeout, with no tmux error in the output.
   - The report should name the change as unasked.
2. `tests/server/accounts/calendar/poll-timeout.test.ts` is new, and its head comment has no layer label (`spec.md:49`).
   - `poll-fixture.ts` carries "Layer 2, test helper".
   - The old `poll.test.ts` head had no label either.
   - The split itself is needed because of the 900-line cap.
3. `tests/server/core/changes.test.ts` carries prettier and comment-rewrap churn that serves no item: `toMatchObject({key...})` split over lines, and comments rewrapped. The diff is larger with no change in meaning, and the head states the tag reason twice.
4. `src/lib/server/root/socket.ts:77`: `subscriptionChannels` has no importer left. The report names this.

## Behaviour

1. Same as Spec 1. The port-move fall-back (`mover.ts:129-137`) has no test, and a break there leaves the server not serving, or serving on a port the page was not told.
2. `edit/feeds.test.ts`: 7 tests are tagged by time, among them `readLeads`, which is a pure string parse.
   - Alone under the slow filter they take 0 ms.
   - In a whole-file run they take about 200 ms ("refuses a file that is no map..." took 199, 200 and 207 ms). Untagged tests in the same runs spiked once each: "uses each feed identity" to 278 ms and "scans the LinkedIn folder" to 152 ms.
   - The tags follow the time rule as written, but the cost is warm-up or garbage collection, not work the test does. See Declined to judge 2.

## Declined to judge

1. Whether the deleted real-hub probe in entry-edit ("reads every id as the identity field...") should stay. It reads hub data, not code, and whether such a check belongs in the server tests is a question for the plan, not the brief.
2. Whether warm-up time counts toward a test's time under Decision 1. The `feeds.test.ts` tags and the writes-collection 104 ms case both depend on it. Decision 1 says "100 ms or more in a verbose run of its own file", which the tags follow literally. Whether that wording was meant to include warm-up is Axel's call.
3. A merge-safety judgment on `tmux-fixture.ts` beyond the four runs above. I did not run the consumer under load.

## Disclosure and usage

- I ran one `git -C . status --short <paths>`. That is a variant of the allowed `git status --short`: read-only, and it printed nothing.
- Every other git command was `git diff d160d13f` or `git status --short` from inside the worktree.
- Scratch files are under `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/t1c-review/`.
- Early on, my `full.diff` may have overwritten a builder file of the same name in the shared `scratchpad/t1c/` folder. The report cites no such file, and every file it does cite there is intact.
- No file in the worktree, on main or in the ledger was edited. `local.yml`, ports 8787 and 8790, and curl were not touched.
- Usage was not measured beyond the commands listed.
