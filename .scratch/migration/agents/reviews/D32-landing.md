# D32 landing

Position: roadmap entry oculus/migration (the cockpit-to-oculus migration); D32, replace in the Search view as VS Code's, landed; 273 of the 312 step lines of `plan.md` are ticked (`grep -c '^- '` and `grep -c '^- ✅'` over the steps section). Next: D14 with its Closed fixes and Z280 (c), its look setting tex-fmt and putting it back.

## Open items (verbatim)

- Z276 (2026-10-02, at Axel's question whether O34 covers the task "A second person in the hub" in `tasks/tasks.yml`): it does not. O34 reads the signed-in person in one place, which is the base that task needs; the task's three parts (a Focus board per person, a private-or-shared marker per field and document with private as the default, the group views of shared deadlines, who waits on whom and the meeting rotation) are in no step, and D10 waits on a second person too. Options: (a) one new step O36 after O34 with those three parts, so the plan ends with the hub usable by your group; (b) leave the task in `tasks/tasks.yml` until someone else works in the hub, as its note says, and open a step then. For (a): the remote server is built with several users in mind and the privacy marker is cheapest to add before anything is shared. Against (a): it builds for people who are not using the hub yet. Recommended (b): the task's own condition is not met, and O34 already leaves the one place a person is read. (b) is also the cheaper option, chosen because the condition is unmet, not because it costs less.
- Z274 (2026-10-02, Axel's word that oculus is now a full IDE rather than a dashboard): a new name for oculus. Where the name lives, counted on main: 122 files under `tools/oculus/src` and 1054 occurrences across its `src`, `tests` and `config`; 40 references to the `~/.oculus` folder; the `.oculus/project.yml` manifests the other repositories carry; five browser-storage keys (`oculus.ui.v1`, `oculus.layout.v1`, `oculus.layout.previous`, `oculus.carry.v1`, `oculus.diff.addComment`); and 1241 files of the hub outside `tools/oculus` that name it (the skills, rules, memory and manifests among them). Options for when: (a) the rename done in O33, as part of the move into its own repository: the repository, the package, the folder, the source, the docs and the hub's references take the new name at once; the first-run check moves `~/.oculus` and each repository's `.oculus/` folder and carries the five browser-storage keys over once, so nothing Axel saved is lost. For: the repository is created then anyway, so its name is chosen once; no step in flight conflicts with it. Against: the old name stays on screen until the last step. (b) the rename as a step of its own now. For: the new name is in use sooner. Against: it touches nearly every file five steps in flight also touch, so each of them meets conflicts at landing, and it needs a ruling for a new step. (c) keep the name oculus. For: no work. Against: the name no longer says what the tool is, which is Axel's reason for asking. Names, in the style of the other repositories (cathedra, ordo, officium, scotoma): scriptorium (the room where manuscripts were written and copied, fitting a tool for writing papers and code); officina (a workshop; close to officium in sound); fabrica (a workshop where things are made). Recommended (a) with scriptorium. (c) is the lazy option.
- Z314 (2026-10-03, the owed look Q81): a Confirm drawn over the update tray. Taking it needs `tasks.skip_permissions` on in `config/behavior.yml` for the look and back off after; the permission classifier refused that edit, so it waits on Axel. Options: (a) Axel allows the edit for the look, which is reverted and checked with `git diff --exit-code -- tools/oculus/config`; (b) Axel takes the point himself on TEST; (c) the point is dropped from the look. Recommendation: (a), since the look then runs as every other look does and leaves no write behind.
- Z315 (2026-10-03, the owed look Q79c): the Live HPC jobs table and a job's log. The cluster was unreachable from this machine (`ssh: connect to host hpc-head1.ewi.utwente.nl port 22: Operation timed out`), which needs the UT network or EduVPN, Axel's account. Options: (a) Axel connects EduVPN and the look is taken then; (b) the point is dropped from the look. Recommendation: (a).
- Z251 (2026-10-02 09:40, all steps): fewer repair rounds. Axel asked whether the criteria for a round can be stricter so more steps land without one. Evidence: 12 of the last 13 landings had a round; each round's rulings (`agents/briefs/<step>-round1.md`) number 5 to 16, and every one of them holds rulings that change code or add a test. Options: (a) keep the round as ruled 2026-10-01 (`plan.md:773`); (b) land without a round when every first-review finding is small and inside the brief, as the refute dispositions already allow (none of the last 13 would have qualified, so it saves nothing); (c) `refute_after_repair: no` when the round stays inside its rulings, the orchestrator reading the delta in its place (saves about 185k to 270k tokens and 14 to 46 min per step; those runs found 4 to 9 findings that would then rest on the orchestrator's read; reverses part of the 2026-10-01 ruling); (d) fewer findings at the source: the overdue recurring-findings pass, its causes in three or more steps ending in a rule sentence in `agents/spec.md` or a sentence every brief carries. Recommendation: (d), with (a) kept until its effect shows; (b) and (c) are the lazy options, since they lower the bar and keep the cause. Axel, 2026-10-02: (d) taken through Z253; (a) stands meanwhile; Z251 is ruled after ten steps have landed under the new rules (count from the first landing after this line). Count at 2026-10-02 13:05: 1 of 10 (X3a, landed 11:49). Nothing is asked of Axel until the count reaches 10.

## Not done

Nothing inside the brief. `bench: []`, so no A/B. The three defects the look found (below) are step D32b, ruled Z316, not fixed here.

## The check of Steps 1

ListAgents at 03:38 listed no subagent, only two idle peer sessions (ordo-01, research-hub-d8). D32's builders and both reviewers were not listed.

## What landed

From base 8ee38daf, 142 paths staged on main (9445 insertions, 2017 deletions; `git diff --cached --shortstat`), no ledger path among them, the landing fixes included.

- Replace in the Search view: Toggle Replace and the replace row with Preserve Case and Replace All; per hit and per file Replace and Dismiss under the pointer and on focus; Cmd+Shift+1, Cmd+Shift+Enter, Delete off macOS and Cmd+Backspace on macOS; Replace All over the whole answer after the view's question; Up and Down in the query and replace boxes walk the texts run; Cmd+Shift+F and Cmd+Shift+H from the shell.
- The write: `POST /api/ops` `replace` (`server/files/fs/replace.ts`), refused whole or file by file with the new words `bad-query`, `binary`, `marker`, `search-failed` and `changed`; a copy kept per file (`HistoryKind` `replace`); one `files` record with the field `replace`, its undo and redo.
- The replace text read as VS Code reads it, Preserve Case included (`data/helpers/search/replace.ts`), shared by the page's preview and the server's write.
- The Replace Preview, a diff pane read by `POST /api/ops` `preview` with the hits not dismissed.
- Every bare-status error of the page as a sentence; the two `utils/` scripts (`outside-paths.mjs`, the unused-exports script on knip).
- `HELP.md`, `DESIGN.md`, the text catalogs and the regenerated diagrams.

## Verification on main

`npm run build` alone first (exit 0), then from `tools/oculus`:

```
$ npm test
 Test Files  525 passed | 24 skipped (549)
      Tests  13091 passed | 640 skipped (13731)
$ npm run test:checks
 Test Files  30 passed | 2 skipped (32)
      Tests  467 passed | 9 skipped (476)
$ npm run check
COMPLETED 3190 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build
$ npm run format:check
All matched files use Prettier code style!
$ npm run lint
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 7 commands passed
```

## Fixes at landing

The eleven findings of the run over repair round 1 (Z308; `agents/reviews/D32-refuter.md`, "Closed") and the points declined there:

1. Finding 1: `tests/routes/replace/preview.test.ts` drives the request the pane forms (`diffRequest` over `previewSubject` with 2000 hits) through a real HTTP server and asserts 200, POST and the replaced text; with the hits carried in a GET address it fails with "expected 431 to be 200".
2. Finding 2: `tests/state/sources/fs/fs-fixture.ts` exports no `let`; `storeHooks()` returns `{ client, asked, serving }`, rebuilt in its `beforeEach`, read by `fs-files`, `fs-notes` and `fs` tests.
3. Finding 3: `tests/checks/utils/outside-paths.test.ts` holds the section it reads, its titles name no step; on the staged `outside-paths.mjs` two of its 21 cases fail.
4. Finding 4: `server/files/fs/replace.ts:3` and `:359` say POST.
5. Finding 5: the `replacementFor` comment in `state/sources/search/hits.ts` names the one null case.
6. Finding 6: `state/sources/search/search.ts:80` states the rule alone.
7. Finding 7: `RowKind` in `keys.ts` is not exported.
8. Finding 8: the "Replaced ..." sentence follows only a Replace All over the whole answer, or a replace that failed; a Replace, a Dismiss, a run or an edit of the query writes the count line back. `DESIGN.md`, `HELP.md` and the `Search.svelte` head comment say so.
9. Finding 9: a toggle turned during a run aborts it and runs under the new toggles; a superseded run writes nothing. Four new cases in `tests/state/sources/search/replace.test.ts` cover 8 and 9; on the staged store all four fail.
10. Finding 10: no code change; the build stands, and ruling 15's text in `agents/briefs/D32-round1.md` was what was wrong.
11. Finding 11: `utils/outside-paths.mjs` takes an entry only where the text before it is a bullet's start, a comma, a colon, "and", "or", "a folder" or "a file", so a prose word names nothing; a test with a prose word in the section.
12. The origin rule on the preview POST: `src/hooks.server.ts` refuses every `/api/` request from a foreign origin except the two callbacks; a new case in `tests/server/root/hooks-server.test.ts` posts to `/api/ops` with `Origin: https://evil.example` and gets 403 `forbidden` with the route not reached. With `/api/ops` let through in `refused()` it fails ("expected true to be false"); 18 of 18 pass with the guard.
13. The report that lands is main's `agents/reviews/D32-report.md` (1685 lines, with its "Repair round 1" section).

## The look (TEST, localhost:8790, tab 812136282)

Dark theme, 2026-10-03 03:27 to 03:34, on a scratch folder `zz-look-d32/` at the hub root with three files, removed afterwards with every write the look made (the three change-log lines, the three history folders); `shasum -c` of `~/.oculus/changes.jsonl` and `workspaces.json` OK against the hashes taken before, the history folder list the same, `git diff --exit-code -- tools/oculus/config` clean.

- Case 27, met: Toggle Replace shows and hides the row; Cmd+Shift+F from a result row puts the cursor in the query box; with the row hidden, Cmd+Shift+H shows it and selects the replace box's text.
- Case 28, met: each hit row draws the match struck through and then `zz`, following the replace text as it was typed.
- Case 29, met: Cmd+Shift+1 on `sample.txt` line 1 at 13 wrote `qzlook alpha zz` and focused the next hit; the count went from 5 to 4. Delete does nothing on macOS, as bound; Cmd+Backspace dismissed the focused hit, moved the focus on and wrote nothing.
- Case 30, met: `yy` typed over `zz`, Up gave `zz`.
- Case 31, met: with the row hidden a hit row and a file heading offer only Dismiss, and the count line drops "would be replaced".
- A hit pressed with the row shown opened "sample.txt <-> sample.txt (Replace Preview)", side by side, the dismissed hit left unreplaced on the right.
- Replace All over the whole answer asked "Replace 5 occurrences across 3 files with 'zz'? ..." and, on Confirm, wrote two files and said in the count line's place "Replaced in 2 of the files; it stopped at hub/zz-look-d32/third.txt. The file changed since it was searched."
- The change log holds one `files` record with the field `replace` per write, each with its kept copy.

Three defects found, booked as step D32b (Z316):

1. After Replace on the first match of `qzlook x qzlook`, Replace on the second is refused "Nothing was written to hub/zz-look-d32/third.txt. The file changed since it was searched."; its row still draws `qzlook x qzlook` and its Replace Preview draws an empty pane. `without` in `state/sources/search/hits.ts` keeps the hits left with their old `at` and text.
2. With the root `claude` timing out, the count line says "cut at 500" over 5 hits, the Replace All question says "The search stopped at 500 hits", and "No answer from claude." gives no reason: `runSearch` sets `truncated` on a timeout (as on main before D32).
3. The Replace Preview opens as a tab of the Search view's pane and hides the view; with a preview open, Cmd+Shift+1 moves the preview on and the focused row is out of sight.

The Search tab of TEST is left with the query `qzlook`, the replace text `zz` and the replace row shown; the History tab keeps its filter "transcript".

## Agents' usage

- Brief check a56701fda4fc5b483 (claude-opus-5-5, ordo-high): 287,991 tokens, 100 tool uses, 14.7 min.
- Builder add9186f54bd823d9 (claude-sonnet-5-5, ordo-high), continuation: 329,466 tokens, 643 tool uses, 187.8 min; round 1, the same builder resumed: 192,745 tokens, 285 tool uses, 100.8 min. The first builder a5cf8bf3bb8e620a6 and two continuations were stopped and their usage is not reported.
- Reviewer (claude-opus-5-5), first run: 107,087 tokens, 103 tool uses, 15.9 min.
- Reviewer a0129346811f03d66 (claude-opus-5-5, ordo-high), over round 1: 309,013 tokens, 86 tool uses, 28.7 min.
- The builder's first report did not pass its bar; one repair round; eleven findings closed at landing (ten by code) and one test added for the origin rule.
