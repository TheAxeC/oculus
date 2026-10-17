# Step O41 brief check (on main at f2de25c47)

The report of the fresh agent of the `spec` skill's "Steps / The brief check", on `agents/briefs/O41.md`. A page this report cites (the rules file, a standard, a skill's text) is named with its section, never with a line number, since a page's lines move and a section's name does not. A line of code or a hit of a grep keeps its `file:line`.

The report is written in the rules file's character set. A character outside it in a quoted line is written by its name in angle brackets, such as `<tab>` or `<em dash>`.

All commands ran from `/Users/axelfaes/workspace/research-hub` (git grep) or its `tools/oculus` (grep, sed, wc). Nothing was written.

## 1. Names

- `firstBadge`: `git grep -n firstBadge -- ':!tools/oculus/.scratch' ':!**/local.yml'` printed `RailPages.svelte:20`, `RailPages.svelte:65`, `rail.ts:68`. No hit outside the paths.
- `badgeFor`: same form; `RailPages.svelte:58`, `RailPages.svelte:177`. No hit outside the paths.
- `ui.page_badge_tip`: same form; `config/text/ui.yml:38`, `RailPages.svelte:75`. No hit outside the paths.
- `gitConfigDir`: same form; `origin.ts:23`, `origin.ts:49`. No hit outside the paths. It is a file-local function (`origin.ts:23`, no `export`), so item 14's grouping needs it exported or wrapped, which the brief does not say.
- `placeClones`: same form; hits outside the paths: `tools/oculus/src/lib/server/root/watch/portfolio.ts:74` and `:750` (the caller; true as long as the signature stays) and `tools/oculus/DESIGN.md:703` ("raises `findings.manifests.cloned_twice` for a project cloned in two folders"). DESIGN.md is on the write list only for "the sentences item 16 names", and item 16 names lines 179, 336 and 730, not 703. Item 14 makes the 703 sentence false: a linked worktree beside its main checkout is two folders and raises nothing.
- `cloned_twice`: same form; `DESIGN.md:703` (above), `config/text/findings.yml:59` ("the repository {0} is cloned in more than one folder: {1}", still true, since each clone is a folder), `clones.ts:45`, `manifests.test.ts:828`.
- `busy` / `repositories.busy(root)`: `git grep -n "busy(" -- tools/oculus/src tools/oculus/tests`; outside the paths: `ChangesRepository.svelte:43`, `CommitBox.svelte:58`, `Changes.svelte:108`, `Diff.svelte:177`, `Merge.svelte:94`, `Stashes.svelte:21`, `Tags.svelte:20`, `ui.svelte.ts:463` (a different `busy`). Item 1 keeps `busy(root)`'s answer, so none becomes false.
- `git.busy` ("Working"): `grep -rn "git\.busy" src`; outside the paths: `CommitBox.svelte:90,198,215`, `changes/FolderRow.svelte:85,96,106`, `graph/GraphActions.svelte:57,67,76,86`. None becomes false. But each of these is drawn inside the Source Control view, so while a commit runs the view's line says "Committing..." and the Commit button's hover words (`CommitBox.svelte:90,198`) say "Working".
- The rail-badges store (`rail-badges.svelte.ts`), whose imports item 11 widens: `git grep -n rail-badges -- tools/oculus/docs` hits `docs/diagrams/channels.dot:123,247` and `docs/diagrams/channels.svg:1189-1197`. These are tracked diagrams that `npm run diagrams` rewrites before the verify list (rules file, "Token discipline"). They change if the store reads the sessions, processes or apps channels. `docs/diagrams/` is not on the write list.
- `HELP.md:41` ("Its badge is the count of the first view on the page that counts something") is named by item 16. `RailPages.svelte:2-5` and `:55-56` say the same and are on the write list.

Findings:
- `DESIGN.md:703` (the Clone bullet that states the clone rule and names `placeClones` and `cloned_twice`) becomes false and is not among the sentences item 16 lets the builder change.
- `docs/diagrams/channels.dot` and `channels.svg` will change through `npm run diagrams` and are not on the write list.
- The `git.busy` hits in `CommitBox.svelte`, `FolderRow.svelte` and `GraphActions.svelte` keep "Working" inside the same view that item 2 makes say the action's words. No case names this mix.

## 2. The step line

- Motion, an action the reader started shows motion where it was started, with words, none under reduce-motion: the Part A preamble.
- git commit, push, pull, fetch, sync, clone, checkout, merge and stash: items 1 to 4 and Decision 1.
- A progress line on the Source Control view and the repository's row: item 2.
- The sync glyph turning in the status bar's git item for push, pull, fetch and sync: item 3, which adds publish.
- The words naming the action in place of "busy": item 1 and item 2, for `Repo.svelte`'s busy line and `RepoList.svelte`'s titles only. The other "Working" places in the Source Control view (section 1) keep "busy".
- The Search view's search and the Literature search: item 5.
- Submit Job: item 6.
- A Usage refresh the reader asks for: item 7.
- An update task or a scheduled run started by hand: item 8 and Decision 2.
- Background work gets no motion; the LaTeX build and an app's progress keep theirs: the Part A preamble.
- The rail: a view's count is one of three: item 9.
- The rail button shows the sum, hover words list each part, most urgent tone: items 12 and 13 and Decision 3.
- A tab with a mark gives nothing to the sum and its mark shows when the sum is 0: item 12.
- Rail counts Projects (in progress) ... Session list (new): item 10. Projects is mapped to the `active` cell of `tab_split`, which holds the same projects as `tab_rollup.projects` "in progress" (`config/layout.yml:254,257-258`, keys `[active]`).
- Tab only: Leads, Processes (new): items 10 and 11.
- Nothing to the rail: Archive, Software, Calendar, Radar: item 10.
- The tabs keep their own numbers: item 9.
- The clone finding counts worktrees; clones counted by the git folder they share: item 14 and Decision 4.
- Every other finding or list that reads repositories is checked for the same: item 15. Item 15 omits two readers. One is the search route, which the brief's own premise names as `context.ts:594` (`git grep` shows `src/routes/api/(files)/search/+server.ts:22` `repositories: locals.server.repositories()`). The other is autofetch (`src/lib/server/root/watch/autofetch.ts:177-192`), which already groups the roots of one repository by `worktrees[0].path`.
- Beside O40, naming every shared file (`Search.svelte`, `submit-job.svelte.ts`, `HELP.md`, `DESIGN.md`) in `shared_paths`: brief line 11 names `Search.svelte`, `config/text/ui.yml`, `HELP.md` and `DESIGN.md`. `submit-job.svelte.ts` is neither named as shared nor on the write list. The dispatch entry holds no `shared_paths` yet: `grep -n shared_paths orchestrator-state.md` printed nothing, and the O41 entry has only `step`, `brief_check` and `landing`.
- Keeps the progress line out of `CommitBox.svelte`: item 2 and brief line 11.

Findings:
- "the words naming the action in place of 'busy'" is served at two places only. The step line keeps only the progress line out of `CommitBox.svelte`, while the brief keeps CommitBox's words out too, and leaves `FolderRow.svelte` and `GraphActions.svelte` saying "Working".
- "every other finding or list that reads repositories": item 15 does not name the search route (`+server.ts:22`, the `context.ts:594` reader) or autofetch.
- Step 0's shared file `submit-job.svelte.ts` is not named. Item 6 probably needs it (section 6, Submit Job), and it is not on the write list. The dispatch entry has no `shared_paths`.

## 3. Premises

- Rail badge, the first badge: `sed -n 55,80p src/lib/shell/rail/RailPages.svelte` shows `badgeFor` at 58-66 calling `firstBadge`. `grep -n page_badge_tip config/text/ui.yml` printed `38:        page_badge_tip: '{0} ({1})'`. `rail.ts:68-70` and `registry.ts:167-185` match. The `.badge` comment and rule are at `RailPages.svelte:238-268`, with the rice rule to 276. Matches.
- `firstBadge` callers: matches (section 1).
- Badge registrations: `grep -rnE 'badge(Glyph|Tone|Title|Cells|TabText|Mark)?:' src --include='*.ts' --include='*.svelte'` lists Calendar (`Calendar.svelte:13-16`, tab text `''`), Inbox red, Leads amber, LinkedIn mark red, Audit, Hpc cells, Collection (`Collection.svelte:18-24`), Projects (`Projects.svelte:12-14`), Repositories, Problems, apps (`src/routes/views.ts:125-127`). Matches.
- Board cells: `grep -n 'function boardCells' rail-badges.svelte.ts` printed `222`. The brief says `216-232`; the function is at 221-237. The layout lines match: `tab_split` at 254, `tab_rollup` at 256-276. Off by six lines.
- Pages: `grep -n '^arrangements:\|^  apps:\|^workbench:\|^floats:' config/layout.yml` printed `48:arrangements:`, `201:  apps:`, `214:workbench:`, `233:floats:`. The page contents match. The brief says `floats:` is at line 216; it is at 233.
- Academic Life counts: a `python3` count of the `nav_live` statuses printed, for the files on disk, Funding 3, Education 1, Applications 2, Joint Work 0, Tasks 0, sum 6. At HEAD it printed Joint Work 4 (13 entries) and sum 10. `git diff --stat -- network/joint-work.yml` printed `1 insertion(+), 22 deletions(-)`, an uncommitted edit. The brief says "read on main at f2de25c47". Its 0 and 6 are the uncommitted working copy, and HEAD gives 4 and 10.
- Findings, Session list and Processes register no badge: `sed -n 1,12p` of each confirms. Findings' `allFindings` call is at `Findings.svelte:40` (`grep -n allFindings` printed `40:`); the brief says `:34`. `needsInput` at `folds.ts:126-128` and `waitingCount` at `selectors.svelte.ts:503-509` match. The brief does not name the existing count `findingsCount` (`src/lib/state/workbench/navigation/status.ts:394-400`, "How many findings the Findings view lists", used at `src/routes/+page.svelte:213`). The rules file's "The principles every package is judged on" asks for that to be reused.
- Git busy: `repositories.svelte.ts:221-230` and `send` at 249-279 match. `changes.yml:14` `busy: Working` matches, and so do `Repo.svelte:379-392` and `RepoList.svelte:199-237`. The action list grep prints the thirteen actions the brief names among 38. Matches.
- Status bar items: `RepoItems.svelte:193-235` matches. The Publish item with several remotes is a `Menu` (`RepoItems.svelte:221-231`), not a `ToolButton`, and `grep -rn turning src/lib/ui` shows no `turning` on `Menu`.
- Turning glyph and moving line: `Glyph.svelte:77-92`, `ToolButton.svelte:17,109`, `Progress.svelte:48-68`, `NoticeEntry.svelte:45-50` and `NoticeSink.post` / `update` (`shapes.ts:240-253`) match. The turning applies to `:global(svg)` only (`Glyph.svelte:78`), so a terminal palette's ASCII stand-in does not turn.
- Searches: `Results.svelte:130-131` and `Literature.svelte:221-222` match.
- Submit Job: `BarActions.svelte:132-139` and `submit-job.svelte.ts:92-93` match. The brief does not say that `submitting` is `submit.busy` (`Source.svelte:452`). That flag is true during the planning press as well (`submit-job.svelte.ts:107-124`), before the plan question, and again during `run` after the yes.
- Usage: `Usage.svelte:189-197`, `usage-refresh.svelte.ts:48-70` and `Usage.svelte:136-138` match. The brief does not say that the route answers only after the refresh has run. `handleUsageRefresh` awaits `target.refresh(label)` (`src/lib/server/machine/usage/routes.ts:21`), which awaits `enqueue` (`src/lib/server/machine/usage/refresh.ts:325-329`).
- Update tasks and Run now: `UpdateTray.svelte:82-91,155-160`, `ScheduleList.svelte:31-40,126-131` and `schedule.svelte.ts:288-300` match. Neither button has a glyph: the tray's task `ToolButton` has `label` and `title` only (`UpdateTray.svelte:155-160`), and Run now has `label` and `compact` (`ScheduleList.svelte:126-131`). `busy` in `ScheduleList.svelte:31` is one flag for every press of every row.
- Clone: `ProjectCard.svelte:254-257` and `clone.svelte.ts` match. The Clone control is a `CardAction` row drawn by `src/lib/views/shared/card/CardActions.svelte`. That component draws no row at rest and moves controls that do not fit into a More menu (`CardActions.svelte:22-29`). The `CardAction` type has no `turning` field. `createClone` takes `notices: Pick<NoticeSink, 'post'>` (`clone.svelte.ts:73`).
- Clone finding: `clones.ts:21-55`, `origin.ts:23-63`, the `nested.ts` walk (`isRepository` uses `lstat` on `.git`), `context.ts:402,594`, `manifests.ts:285-320` (`settle` at 291) and `DESIGN.md:730` match. `ls .agents/worktrees/` printed `gate migration-O40 O40-base`. The `.git` files of `gate` and `migration-O40` name `.../research-hub/.git/worktrees/<name>`, and `cat .git/worktrees/migration-O40/commondir` printed `../..`. A python read of every `project.yml` found `side-projects/research-hub/project.yml` with the hub's origin as `repository.url`. "Found cloned in three folders" fits these files. It was not seen on a running page (not verified).
- Sizes: `wc -l` printed `Repo.svelte` 517, `Repositories.svelte` 514, `ToolButton.svelte` 508, `Collection.svelte` 503 and `selectors.svelte.ts` 724, all matching. The list omits several files that items change or will likely need: `ProjectCard.svelte` 517 (item 4, on the write list), `tests/data/sources/manifests.test.ts` 831 (five new rows, and tests are measured too: `tests/checks/tree/size.test.ts` walks `src`, `tests` and `utils`), `src/lib/views/sources/source/Source.svelte` 517 and `src/lib/state/client/context.ts` 874.
- Base copy: `ls .agents/worktrees/O41-base` printed `No such file or directory`. The `spec` skill makes it after the check, so this is not verifiable now.
- Guarded entries: G32 (`agents/guarded.md:209-211`) and its describes `the clones of a project` (`manifests.test.ts:782`) and "the scan and the manifest's own tier and type" (`:563`) match. G80 covers `clone.svelte.ts` (`guarded.md:167-169`), but the brief calls it "item 3", and the clone is item 4. G81 (`guarded.md:227-229`) covers `nested.ts` and `exclude.ts`, which item 15 reads and may change, and the brief does not name it. No entry names the rail badges: `grep -n -i badge agents/guarded.md` shows none.
- The plan correction: `grep -n "Nothing to the rail" plan.md` printed `567:` with "Nothing to the rail: Archive, Software, Calendar, Radar, each tab keeping what it shows." Matches.

Findings:
- `boardCells` is at `rail-badges.svelte.ts:221-237`, not `216-232`.
- `floats:` is at `config/layout.yml:233`, not 216.
- The Academic Life counts (Joint Work 0, sum 6) are those of the uncommitted `network/joint-work.yml`. On main at f2de25c47 they are Joint Work 4 and sum 10.
- `Findings.svelte:34` is `Findings.svelte:40`. The existing `findingsCount` (`status.ts:394-400`) is not named.
- G80 is item 4's entry, not item 3's. G81 is not named for item 15.
- The near-limit list omits `ProjectCard.svelte` 517 and `tests/data/sources/manifests.test.ts` 831 (both written by the step), as well as `Source.svelte` 517 and `context.ts` 874.
- These facts the items depend on are missing: `submitting` covers the planning press; the usage route answers after the refresh; the tray and Run now buttons have no glyph and Run now shares one `busy`; the Clone control lives in `CardActions` (hidden at rest, possibly in More); the Publish item with several remotes is a `Menu`; `createClone` takes only `post`.

## 4. Cases and checks

- Cases 1, 2, 4 to 8 and 10: consistent with the rules file. They are readings or scratch runs, with no test added ("What every package obeys", the test rule).
- Case 3: consistent, though its "the Leads tab still shows 7 and the Calendar tab still shows its 2" checks tab drawing the step does not change (`strip-tab.ts`, `TabFace.svelte`).
- Case 9: Hpc on the float. It reads `Hpc.svelte` and `layout.yml`, which the step does not change. A negative check of the sum.
- Cases 11 and 13 to 18: consistent, proved at the look ("What every package obeys", the builder runs no page).
- Case 12: its second half ("a git auto-fetch draws no turning and no words") checks `src/lib/server/root/watch/autofetch.ts`, a server module the step does not change and the client store never sees.
- Case 19 and item 4 against the test rule ("What every package obeys": a step whose change touches an entry's code runs that entry's test). `tests/state/sources/clone.test.ts:47-58` builds `createClone` with a `notices` fake that has only `post`. Its row 'opens the panel at the home folder, clones into the pick and asks what to do' asserts `expect(said).toEqual([{ message: 'Cloned Tool' }])` (`clone.test.ts:181`). Item 4's progress notice changes that outcome, and replacing the notice needs `remove`, which the fake lacks. Three things clash with this: the brief says the motion cases add or change no test, `tests/state/sources/clone.test.ts` is not on the write list, and verify item 4 says "every other row passes both times".
- Cases 20 and 21: consistent, and both fail on the base (three folders, and three clones respectively).
- Cases 22, 23 and 24 against "What every package obeys" ("The report quotes, for each test the step adds or changes, its failing line on the unchanged tree") and against the brief's verify item 4 ("the new rows of cases 20 to 24 fail before and pass after"). On the base, `placeClones` already gives a lone listed worktree one clone (22). It already gives a submodule with no `commondir` its own config and clone (23, `origin.ts:36-39`). It already gives a gone git folder no origin (24, `origin.ts:50-51`). These three rows pass before the change, so neither demand can hold.
- Item 15 asks the report to explain readers the step may not change (`exclude.ts`, the Repositories list, the status bar, the rail's Repositories count). The step line asks for this check, so it is required work.

Findings:
- Cases 22, 23 and 24 cannot fail on the unchanged tree, against the rules file ("What every package obeys", the failing-line rule) and the brief's own verify item 4.
- Case 19 and item 4 change G80's tested outcome (`clone.test.ts:181`) and fake (`clone.test.ts:47-58`) while the brief keeps that test file off the write list and says every other row passes before and after.
- Case 12's auto-fetch half checks a place the step does not change. Cases 3 and 9 check tab drawing and the Hpc registration, which the step does not change.

## 5. The question

- Case 1: yes. The tone is left as "that of the most urgent ... by Decision 3" with no value. Under Decision 3 the parts are Projects green, Coauthor green (`#16a34a` to `c-green`, `vocab.yml:28`) and Personal brass (`#d4a017` to `c-brass`, `vocab.yml:25`), so the expected tone is Projects' green. A wrong tone would pass.
- Case 2: yes for the tone, which is unstated. The sum and the order are checkable.
- Cases 3, 5, 6, 7, 8 and 10: no. Each states a number or tone.
- Case 4: yes for the badge colour. The mark's tone (LinkedIn's `badgeTone` red) under item 13 is unstated.
- Case 9: no. It is a negative check.
- Cases 11 and 13 to 15: no. They are stated at the look.
- Case 12: no for the push. The auto-fetch half passes whatever is built (server side).
- Case 16: yes. It covers only "until the plan question or the refusal". The run after the yes (`submit-job.svelte.ts:91-104`, rsync and sbatch, the long wait) could draw no turning and the case would pass.
- Case 17: yes. It passes at the look when the refresh is quick, whether or not the hold's end rule is right (section 6).
- Case 18: no.
- Case 19: yes. The card's actions row is drawn only on hover or focus, and the Clone control can sit in the More menu (`CardActions.svelte:22-29`), where no glyph turns. A look with the pointer on a wide card passes.
- Cases 20 and 21: no.
- Cases 22 to 24: yes. They pass on the base, so they do not show the grouping rule.
- The step line's check: the plan's O41 line (`plan.md:565-569`) names no check of its own. The brief's verify list stands in. `npm run test:quick` (verify 1) passes with none of Parts A and B built, because no test covers them.
- Item 1: yes as written, since the store can keep the name with nothing reading it. Items 2 and 3 carry the proof.
- Item 2: yes. The goal "the words naming the action in place of 'busy'" passes with CommitBox, FolderRow and GraphActions still saying "Working" in the same view.
- Item 3: yes for Publish with several remotes (`RepoItems.svelte:221-231`, a `Menu` with no `turning`).
- Item 4: yes (case 19).
- Item 5: no.
- Item 6: yes. Its hover words `source.submit_running`, "Copying the code and submitting the job..." (`source.yml:214`), would be shown while `submitting` is true during the planning press, when nothing is copied.
- Item 7: yes (section 6).
- Item 8: yes. Neither button has a glyph to turn, and no Decision names which glyph is added.
- Items 9, 10 and 12: yes. Nothing requires the sum, the tone order and the hover words to be a pure function (in `rail.ts`, in place of `firstBadge`) that cases 1 to 10 could run with `npx tsx`. As written they can be "proved" by reading `RailPages.svelte` alone.
- Item 11: yes. The Session list in a workbench page limited to a folder (`config/layout.yml:228`), and Processes after a failed read (section 6), are unstated.
- Item 13: yes for a mark's tone.
- Item 14: yes (cases 22 to 24).
- Item 15: yes. The search route and autofetch can be left unread.
- Item 16: yes. Lines 179, 336 and 730 can be rewritten while 703 stays false.
- Decision 3: it cites the `nav_live` comment (`config/layout.yml`, "Set `tone:` to force an urgency class (`red` / `amber` / `green`) ... used where a count means 'act'"), which names green with red and amber. Yet it ranks green with every other tone, so its stated reason does not give its order.

Findings:
- Cases 1, 2 and 4: expected tone unstated.
- Case 16: the run phase is missing.
- Case 19: only a hover look.
- Cases 22 to 24: pass on the base.
- Items 2, 3, 6, 7, 8, 11, 13, 15 and 16: as above.
- Items 9 to 12: no pure-function run is required.
- Decision 3's order does not follow from the comment it cites.

## 6. Implied inputs

This is a code step.

- Submit Job's planning press (save, `planSubmit`) while `submitting`: missing. Expected: the glyph turns, with hover words that do not say the code is being copied.
- Submit Job after the yes, during `run`: missing (case 16 stops at the question). Expected: the glyph turns until the done line or the refusal.
- A Usage refresh pressed while the account's `refresher` is undefined (`model-sessions.ts:745`, optional) or never seen as `refreshing` in a payload: missing. Under item 7's end rule the hold may never end, or may end on the first payload after the press before the refresh ran. Expected: the turning stops at the press's own answer, which the route sends after the refresh (`refresh.ts:325-329`).
- Pause or Resume pressed on a schedule row (one shared `busy`, `ScheduleList.svelte:31`), and Run now on one row while other rows show: missing. Expected: only the pressed row's Run now turns.
- The glyph the tray's task button and Run now turn (both have none): missing, and not a Decision. It is a user-visible shape.
- The card's Clone control at rest or in the More menu: missing. Expected: stated.
- Publish with several remotes (the `Menu` branch): missing. Expected: the menu's glyph turns, or the item says the words.
- A terminal palette (`body.rice`), where `Glyph`'s turning does not reach the stand-in: missing. Expected: stated (no motion, words kept, or other).
- A git action sent on a root that is already busy: stated in item 1, missing from Cases. Expected: nothing changes.
- A push started from the Repositories view while the status bar follows the same repository through another root of one top (`RepoItems.svelte:1-6`, `repo.root`): missing. Expected: stated.
- The Source Control tab closed, or the page reloaded, while an action runs; the Clone from GitHub notice dismissed by the reader before the answer (an id the store then removes). These are the asynchronous paths the rules file asks about ("What every package obeys", in flight, after close, superseded). All missing.
- Hpc, Leads or any unlisted view moved by the reader onto a rail page: missing (case 9 covers only the float). Expected: nothing to the rail.
- A rail sum of three or more digits: missing. Expected: stated (the badge cuts with an ellipsis today, `RailPages.svelte:238-268`).
- The tone of a mark shown when the sum is 0 (LinkedIn red, apps none): missing.
- The Session list tab on a workbench page whose list is limited to the folder: missing. A registration hook is per view, not per tab instance, so the tab would show the global count against Decision 6's "so the tab and the rows agree". Expected: stated.
- Processes after a failed read, which keeps the last rows (`Processes.svelte:16-19`), and whether a terminal with several processes counts once: missing.
- Two linked worktrees listed whose main checkout is outside the list (Decision 4, first listed): missing beyond case 22's single worktree. Expected: one clone, named by the first.
- A worktree whose `gitdir:` path and the listed main checkout's path differ only by a symlink (the macOS temp folder is one, which the tests' scratch folders sit in): missing. Expected: one clone.
- The order of `repository.clones` once a group is named by its main checkout listed after its worktree, since the card names the first clone (`clones.ts:8-9`): missing.
- A scanned project folder that is a linked worktree of another scanned folder (item 15, `settle`): missing, with no expected result.

Findings: every item above is missing from "Cases", except the busy-root refusal, which is stated only in item 1.

## 7. ADRs

- `ls docs/adr tools/oculus/docs/adr` printed `No such file or directory` for both, and `find . -type d -name adr` (excluding `node_modules`) printed nothing. No record. The configuration block has no `adr` key (`grep -n adr .agents/plan.yaml orchestrator-state.md` printed nothing).

Findings: none.

## 8. Dictated text

- "Nothing to the rail: Archive, Software, Calendar, Radar, each tab keeping what it shows": `grep -n 'Nothing to the rail: Archive' O41.md` (line 36). Holds.
- The hover-word form `<the view's label> <count>`, joined by `, `, and "Projects 20, Coauthor 2, Personal 3": `grep -n '<the view' O41.md` (line 71). Holds.
- "Projects, key 2 (Projects 20, Coauthor 2, Personal 3)": `grep -n 'Projects 20, Coauthor 2, Personal 3' O41.md` (line 87). Holds. It matches `ui.page_shortcut` '{0}, key {1}' (`ui.yml:44`) and `page_badge_tip` '{0} ({1})'.
- Decision 1's words ("Committing...", "Pushing...", "Pulling...", "Fetching...", "Syncing...", "Publishing the branch...", "Checking out...", "Merging...", "Stashing...", "Applying the stash...", "Popping the stash...", "Dropping the stash...", "Cloning {0}..."): `grep -n 'commit "Committing..."' O41.md` (line 161). ASCII with "..." (rules file, "The working rules that bind every package", Prose). Holds as text. Two problems sit in the same line. Its closing sentence "since the ruled list names only these" is false for `publish`, which the ruled list (`plan.md:566`) does not name. And it puts "Cloning {0}..." in the `git` group of `changes.yml`, while every other clone sentence is `app.clone.*` in `app.yml` (`clone.svelte.ts:80,109,140`). That second point is a cohesion question, not a rule break.
- Item 4's "the words of Decision 1's `clone` row": `grep -n 'its words "Cloning..." as today' O41.md` (line 47). Decision 1 has no row named `clone`; it says "for Clone from GitHub". It names a thing the decision does not name. No prose rule is broken.
- Case words "Committing...", "Pushing...", "Cloning repo...": `grep -n '"Pushing..."\|"Cloning repo..."\|"Committing..."' O41.md` (lines 97, 98, 105). Holds.
- Decision 3: `grep -n 'urgency order' O41.md` (line 163). Holds as prose. Its reasoning is in section 5.
- `LC_ALL=C grep -n '[^ -~]' O41.md` printed nothing, so the brief is ASCII.

Findings: none against the rules file's prose rules. The content of Decision 1's reason sentence (publish) and item 4's "`clone` row" are noted above.

## Declined to judge

- Whether the step line's "in place of 'busy'" reaches `CommitBox.svelte`'s words despite the O40 overlap is the orchestrator's call on the shared file. I report the gap only.
- Whether item 14 should decide one repository by `gitConfigDir` equality or reuse the rule DESIGN.md:730 and autofetch use (`GitState.worktrees[0].path`). The data layer runs no git (`origin.ts:1-4`), which argues for the former; the orchestrator weighs the two rules for one fact.
- Whether O40's in-progress changes to `src/lib/state/client/context.ts`, `src/lib/views/sources/source/Source.svelte` and `src/lib/shell/commands/CloneAsk.svelte` (seen in `git -C .agents/worktrees/migration-O40 status --short`) will meet O41's work. That depends on how the builder wires items 4, 6 and 11. I read only that worktree's status.
- "The hub's project is found cloned in three folders" is consistent with the files on disk (section 3). It was not seen on a running page, which this check may not start.

Agent usage: a5ee76e018077f142, claude-opus-5-5, 254,121 tokens, 97 tool uses, 16.1 min.

## Closed (the session's change to the brief for every finding above, and each dictated line added after the check, made before the preparation commit)

Item numbers below are those of the rewritten brief, where the old items 14 and 15 became 14 to 16 and the docs item 17.

- 1, `DESIGN.md:703` (the Clone bullet) left out: item 17 names the Clone bullet (line 702 on main) with the rule of item 15.
- 1, `docs/diagrams/channels.dot` and `channels.svg`: on the write list "as `npm run diagrams` writes them"; item 17 and verify 1 run `npm run diagrams` first.
- 1 and 2, "Working" left in `CommitBox.svelte`, `FolderRow.svelte` and `GraphActions.svelte`: item 2 makes every "Working" of the Source Control view for that repository say the action's words, `CommitBox.svelte:90,198,215` only (and no progress line there); `CommitBox.svelte` joins the shared files, its three lines named on the write list; `FolderRow.svelte` and `GraphActions.svelte` on the write list; case 11 checks the commit box's hover words.
- 2, the search route and autofetch: item 16 names both.
- 2, `submit-job.svelte.ts` not shared and not on the write list: named among the six shared files and on the write list; Steps 9 writes `shared_paths` in the dispatch entry.
- 3, line numbers: `boardCells` 221-237, `floats:` 233, `Findings.svelte:40`, all corrected.
- 3, the Academic Life counts: the premise gives main's (Joint Work 4, sum 10) and the checkout's (Joint Work 0, sum 6, Axel's uncommitted edit); case 2 uses main's.
- 3, `findingsCount`: named in the premises, and item 11 counts through it.
- 3, G80 is item 4's, G81 not named: corrected, G81 named for item 16.
- 3, the size list: `ProjectCard.svelte` 517, `manifests.test.ts` 831, `Source.svelte` 517 and `context.ts` 874 added, tests measured too; verify 3 says tests included.
- 3, the missing facts: each added to the premises (`submitting` over both phases, the usage route answering after the refresh, no glyph on the tray and Run now and the shared `busy`, the Clone control in `CardActions` and More, the Publish `Menu`, `createClone` taking only `post`, the notice sink's `remove`).
- 4, cases 22 to 24 pass on the base: cases 28 and 29 (a lone worktree, a submodule, a gone git folder) are rows of behaviour kept, passing before and after; the rows that fail before are cases 23 to 27, 30 and 31; verify 4 says which.
- 4, case 19 and G80's test: item 4 changes `tests/state/sources/clone.test.ts` (the fake gains `remove`, the row asserts the running notice and its removal); the file is on the write list; case 31 is that row, failing before; changed titles go in the report for `agents/guarded.md`.
- 4, case 12's auto-fetch half and case 3's tab half: removed. Case 9 now checks the sum over views moved onto a page, which item 12 changes.
- 5, tones unstated: case 1 green, case 2 green, case 4 red with the mark's own hover words, case 5 none; item 12 gives a mark its own tone.
- 5 and 6, Submit Job's two phases: item 6 turns through both, with `source.submit_planning` "Preparing the job..." while it plans (Decision 1); case 18 covers both phases.
- 5 and 6, the Usage hold's end: item 7 ends the hold at the press's own answer, which the route sends after the refresh.
- 5 and 6, the tray and Run now glyph and the shared `busy`: item 8 and Decision 2 add the `sync` glyph turning before the label while starting, none at rest, only the pressed row's Run now; case 20.
- 5 and 6, the Clone control hidden at rest or in More: item 4 posts a notice with a moving line for every clone, and the card's control turns in the row or in More; `CardActions.svelte` and the `CardAction` type on the write list; case 21.
- 5 and 6, Publish with several remotes: item 3 draws one turning `sync` button in place of the `Menu` while publish runs; case 14.
- 5 and 9 to 12, no pure function: item 12 makes the sum, hover words and tone one pure function in `rail.ts` in place of `firstBadge`; cases 1 to 10 run it before (as `firstBadge`) and after; verify 5.
- 5, item 11's limited Session list and Processes after a failed read: item 11 counts the last good read's rows, each process one row; item 9 and Decision 6 state that a count is the view's on every tab, as every badge is today.
- 5, item 16's DESIGN line: closed with the Clone bullet above.
- 5, Decision 3's order: red, amber, green, then other tones, then none, as the comment names them.
- 6, the terminal palette: the Part A preamble and Decision 7 state that the stand-in stays still while the words and the line show.
- 6, the busy-root refusal: case 16.
- 6, another root of one repository: item 1 answers the action for a repository's roots together; item 3 reads it; case 13.
- 6, the tab closed, the page reloaded, the notice dismissed: item 1 and item 4 state each; cases 21 and 22.
- 6, Hpc or Leads moved onto a rail page: item 10 and case 9.
- 6, a sum of three or more digits: item 12 (drawn as a number, cut at the badge's edge as today).
- 6, two worktrees with the main checkout outside, a symlinked spelling, the order of the clones, a scanned worktree: item 14 resolves the git folder through symlinks, item 15 places a group at its first listed folder, item 16 states `settle`'s result; cases 25, 26, 27 and 30.
- 8, Decision 1's reason sentence false for `publish`: it now says publish is the first push of a branch and counts with push.
- 8, "Cloning {0}..." in the `git` group: moved to `app.clone.running` in `config/text/app.yml` beside the other clone lines; item 4 names that key.
- Declined, `gitConfigDir` equality or `GitState.worktrees`: item 14 reads the git folder from the files in the data layer, which runs no git (`origin.ts:1-4`), the rule DESIGN.md:730 states for the views; the fact is the same one.
- Declined, O40's `context.ts`: item 4 notes that `context.ts:487` already passes the whole notice sink, so this step does not change that file; `Source.svelte` and `CloneAsk.svelte` are not on this step's write list.
- Dictated lines added after the check, each held against the rules file (ASCII, "..." for an ellipsis, no dash, plain words): `submit_planning` "Preparing the job...", holds; `app.clone.running` "Cloning {0}...", holds; "Publish is the first push of a branch, so it counts with push", holds; "Incoming, key 3 (Inbox 4)", holds and matches `page_shortcut` and `page_badge_tip`.
