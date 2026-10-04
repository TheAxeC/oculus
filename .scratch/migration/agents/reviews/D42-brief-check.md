# Step D42 brief check (on main at 3e3574ef9)

The report of the fresh agent of the `spec` skill's "Steps / The brief check", on `agents/briefs/D42.md`. The brief says it was read at ed0e6de58. `git diff --stat ed0e6de58 HEAD -- tools/oculus ':!tools/oculus/config/local.yml'` shows only three ledger files changed since then (`S5-brief-check.md`, `orchestrator-state.md`, `queue.md`), so the source tree is the same at both commits. There is no D42 worktree or base copy yet (`ls .agents/worktrees/` printed `D37 D37-base X3f X3f-base`). Every command below ran on the main checkout. A path written without a prefix is under `tools/oculus/`.

## 1. Names

- `files.timeline_failed` (removed, replaced by two lines): `grep -rn "timeline_failed\|timeline_row_title\|FILE_LOG_ENTRIES" src config --exclude=local.yml` hit `files.ts:18,57,70`, `Timeline.svelte:151,181` and `files.yml:209,216`. All of them are in the write list.
- `fileLog`, `logUrl`, `commitsOf`, `createFileHistory`, `TimelineEntry`, `RevealAsk`, `sectionFlipped`, `STARTS_CLOSED`: `grep -rn "RevealAsk\|revealAsked\|TimelineEntry\|createFileHistory\|logUrl\|commitsOf\|sectionFlipped\|STARTS_CLOSED" src tests` gave these hits outside the write list:
  - `views/shared/explorer/control/tab-actions.ts:21,92` (`sectionFlipped`). The change leaves this true.
  - `state/sources/repositories/diff/diff-hunks.ts:228`. This is a different function also named `revealAsked`, so it is unaffected.
  - The grep printed no hits under `tests`.
- The reveal ask is settled in a file the brief does not name. `grep -rln "revealSettled\|revealScrolled" src/lib` printed `state/sources/explorer/view/reveal.ts` and `views/shared/explorer/tree/ShowPath.svelte` (`:62`, `:85`, `:105`, where the scroll to the row also runs). Item 5 says "when the view settles that ask it adds `timeline` to `opened` ... and brings the section's head into view". Adding to `opened` can be done in `revealSettled` (`reveal.ts`, in the write list). The scroll to the section head competes with ShowPath's scroll to the row. `ShowPath.svelte` is in neither "Read" nor "Paths this step writes".
- Docs and comments: `grep -n -i "timeline" DESIGN.md README.md HELP.md` hit `DESIGN.md:128,204,398,409,422,431` and `HELP.md:120,138,163,183`. DESIGN.md and HELP.md are whole paths of the step. Two comment hits outside the write list stay true: `state/sources/fs.ts:15` ("the Open Editors, Outline and Timeline sections") and `state/workbench/navigation/pages.ts:11`.
- `tests/shell/panes/strip/tab-menu.test.ts` imports `createTabMenu` from `tab-menu-state.svelte.ts` (`:12`), a file this step writes. `tests/tiers/essential.txt:20` lists that test. The brief's tests grep missed it, because it searches for `tabMenu`, not `createTabMenu` or the file name.

Findings:
- `ShowPath.svelte`, where the reveal ask is settled and scrolled, is missing from the brief's "Read" list and write list, although item 5's "brings the section's head into view" runs beside its scroll.
- The tab-menu test imports a file the step writes. See Premises for how the brief's tests premise misreports this.

## 2. The step line

The plan's line is `plan.md:496`. Each part maps to these items of "What to build":
- "the Files view ... list the commits that touched a file (`git log --follow`)": item 1, which reads the commits through `fileLog`.
- "and the source editor": item 4 (the Timeline keeps the editor's file) and item 5 (Open Timeline in the file tab's menu).
- "newest first": item 1 (the order is by committer date) and decision 3.
- "with author, date and subject": item 1 (the row and the tooltip).
- "each opening the diff of the file at that commit against its parent": item 1, last bullet (`row.path`), cases 2 to 5, 15 and 16.
- "as VS Code's Timeline": items 2, 4 and 6 (Load more, follow the editor, Pin, Refresh, filter), item 5's menu placement, and decisions 1, 2, 4 and 6.

Every part has a requirement.

Item 8 (the hunk bar) serves no part of the line. It rests on Z375 (`plan.md:1087`), which ends "(the orchestrator, automode)." D42's line ends `(ruling Z347)` only. `grep -n "^- D42 \|^- Z375" plan.md` shows that no tag or sub-bullet on D42's line names Z375.

Findings: none against the step line itself. The authority of item 8 is under "Declined to judge".

## 3. Premises

- **Authority.** `grep -n "^- D42 \|^- Z347\|Z327" plan.md` printed `496: - D42 ...`, `499:   - Step 0, stopped at /spec 2026-10-03 ... Z327`, `554: ...Z327` and `1057: - Z347 ... (the user).` `awk 'NR>=494 && NR<=500' plan.md` shows lines 496 D42, 497 D43, 498 D44, then line 499's Step 0. So line 499 is the Step 0 of **D44**, not of D42. The brief says "The Step 0 at `plan.md:499` ... is superseded by Z347", treating it as D42's. D42 has no Step 0. Its authority (Z347, "(the user)") holds.
- **Timeline.svelte line numbers.**
  - `wc -l` printed 194, which matches.
  - `Sections.svelte:87` matches.
  - `grep -n "const tab = \|const file = \|function labelOf\|function whenOf\|function show\|timeline_row_title" Timeline.svelte` printed `47`, `48`, `86`, `92`, `97` and `181`. The brief gives `:46-47`, `labelOf :83-87`, `whenOf :89-91`, `show :94-108` and the tooltip `:173`. The behaviour it describes matches. The line numbers are off by 1 to 8.
- **fileLog, parseLog, GitCommit, the route and the client reads.**
  - `files.ts:62-79`, `:18` and `:78` match.
  - `grep -n "LOG_FORMAT =" parse.ts` printed `37:export const LOG_FORMAT = '--format=%H%x1f%h%x1f%s%x1f%aI';`, which matches.
  - `parseLog` at `parse.ts:43-54` matches.
  - `GitCommit` at `model-sessions.ts:376-383` and `:570` matches.
  - The `log` read is `state.ts:204-205`, which matches.
  - `git-reads.ts:251-258` holds the `log` branch, which matches.
  - `timeline-reads.ts:20-46` matches.
  - `fs-history.ts`: `commits` is at `:63-70`, where the brief says `:64-71`. `:43`, `:65` and `reasonOf :31-33` match.
  - One point the brief omits: `GitGraphCommit = GitCommit & {...}` (`model-sessions.ts:428`), so the graph also uses `GitCommit`. That is one more reason to keep it unchanged, which the brief already asks.
- **The record separator.** Item 1 says "each commit's record opens with the record separator, as `GRAPH_FORMAT` does". `grep -n GRAPH_FORMAT parse.ts` printed `93:export const GRAPH_FORMAT = '--format=%H%x1f%h%x1f%P%x1f%D%x1f%an%x1f%aI%x1f%s%x1f%B%x1e';`. GRAPH_FORMAT ends each record with `%x1e`. It does not open with it. The brief's own probe command opens with `%x1e`, which is right for `-z --name-status` output.
- **The 50-commit cap and HELP.md's history.** `git log --follow --format=%h -- tools/oculus/HELP.md | wc -l` printed `115`, which matches.
- **Paging with `--skip` (the important one).** Item 2 pages with `--skip=<n>` together with `--follow`. That does not page a file's history:
  - `diff <(git log --follow --format=%h -- tools/oculus/HELP.md | sed -n 51,101p) <(git log --follow --skip=50 -51 --format=%h -- tools/oculus/HELP.md)` shows that the "second page" is the file's commits 1 to 51 again: `ffb4457ae at line 1`, `d075e44b3 at line 50` of the full list.
  - `git log --follow --skip=100 -51 ... | wc -l` printed `51`.
  - `git log --follow --skip=3 -2 --format=%h -- .../diff/DiffEditor.svelte` printed `4c7cf9154 33be30af8`, the two newest. The 4th and 5th are `5a503e825 f6403f406`.
  - `git log --follow --format=%h --skip=114 -- tools/oculus/HELP.md | wc -l` printed `110`. Without `--follow` the same command printed `1`.
  - `git --version` printed `git version 2.49.0`. Under `--follow`, `--skip` counts commits of the whole history walk, not the file's own commits.
  - A cursor form does page correctly: `git log --follow -51 --format=%h 8b9cbc3db^ -- tools/oculus/HELP.md | head -3` printed `d5e08b8e6 6b73371d4 667ed7084`, which are lines 47 to 49 of the full list after `8b9cbc3db` at line 46.
  - So the wire shape `skip=<n>` cannot be built as the brief writes it. A replacement such as `before=<hash>` with the path at that commit is a different route parameter.
- **The rename output.** `git log --follow -z --name-status --diff-merges=first-parent --format='%x1e%H%x1f%an%x1f%cI' -2 -- tools/oculus/src/lib/ui/controls/editor/diff/DiffEditor.svelte | od -c` shows `R079\0<old>\0<new>\0`, which matches. The status block begins with `\n` after the format's `\0` (`\0  \n   R   0   7   9`). Fed whole to `parseNameStatus`, the first field is `"\nR079"`, whose first character is `\n`. So "reusing `parseNameStatus`" works only after that newline is stripped. The brief does not say so.
- **The empty diff before a rename.** `git show --format= --no-color --no-ext-diff -M --diff-merges=first-parent c8d890799 -- .../atlas/acquisition_headers.json | wc -l` printed `0`, and with `analysis/` it printed `2158`, which matches. `commitDiff` at `reads.ts:107-141` matches.
- **The lists go stale.**
  - `grep -rn "\.bump(" src/lib` printed only `latex.svelte.ts:506`.
  - `staleTime: Infinity` (`queries.svelte.ts:46`) and `markText` (`context.ts:328-331`) match.
  - One correction: `fs.svelte.ts:669-670` `invalidate()` marks `ALL = ['fs']` (`:162`), so history and log are also read again after a workspace action or a bookmarks change (`:693`, `:749`, `:758`, `:799`). "Until the page is reloaded" is too strong. A save and a commit, the two cases the brief names, do stay stale.
- **The files message.** `hub.publish('files', { root } ...)` is at `server/root/watch/git.ts:237`, and `FilesPayload = { root: string; bookmarks?: boolean }` is at `model-sessions.ts:615`. `FsRoot = { key, dir, fixed }` is at `place.ts:55`. These match.
- **The error text.** `files.yml:209`, `failureSentence` at `compare-words.ts:39-49` and its caller `Diff.svelte:184` match.
- **The lost file.** `activeInstance` at `instances.ts:91-95` matches. The `selectedFile` derivation is at `Files.svelte:160-166`.
- **Menus, showInFiles, reveal and sections.**
  - The `rowMenu` file groups are at `row-menu.ts:249-271`, and its doc comment at `:208-222`. These match.
  - `tabMenu`'s doc comment is at `:60-64`, and `TAB_SHOW_IN_FILES` is at `:86`. These match.
  - `showInFiles` at `show-in-files.ts:32-47`, and `layout.svelte.ts:211` and `:810`, match.
  - `revealAsked` at `reveal.ts:29-45` matches. `RevealAsk` is at `files-view.ts:24-29`, and `opened` at `:66`, `:163` and `:203`. These match.
  - `STARTS_CLOSED` (`section-state.ts:10`) matches.
  - `Section.svelte`'s `more` snippet (`:31`, `:65`) matches.
- **HELP.md and DESIGN.md.**
  - `HELP.md:44`, `:120` and `:211` match.
  - `grep -n -o "log --follow[^,;]*" DESIGN.md` printed `128:log --follow --format=<fields> -50 -- <path>`, which matches.
  - `run.ts:57-59` matches.
- **The hunk bar.**
  - `owed-looks.md:159` matches.
  - `wc -l DiffSection.svelte` printed 515.
  - `git ls-tree --name-only HEAD src/lib/views/sources/repositories/diff/ | wc -l` printed 9.
  - `.hunk` is at `:340` with `padding: 1px 6px` and `flex: none` (`:484-510`). These match.
  - Monaco is 0.57.0, and `diffEditorWidget.js` computes `modifiedWidth = fullWidth - modifiedLeft - overviewRulerPartWidth` in `:98-130`, which matches.
  - `ToolButton` `compact` at `:40-45` matches.
- **The cause of the hunk bar overflow (wrong).** The brief says "`fit` (`zones.ts:57-61`) sets its [the `.hunk`'s] `style.width`" and that, because `.hunk` has padding and no `box-sizing`, "the bar's outer box is 12 px wider than the width `fit` gives it". Both statements are false:
  - `fit` sets the width of the node `placed.above(...)` is attached to: `zones.ts:156-167` calls `place(node, ...)` and then `fit(on, node)` (`:76`). That node is the `.line-bar` wrapper `div` (`ui/controls/editor/bars/LineBars.svelte:21`), which already has `box-sizing: border-box` (`LineBars.svelte:35`) and no padding.
  - The `.hunk` is a child of that wrapper (`DiffSection.svelte:321-382`, inside the `lineBar` snippet), a `display: flex` block with `width: auto`. Its padding therefore falls inside its parent's width and does not add to it.
  - `grep -rln "box-sizing" src | grep -v "\.svelte$"` printed only `ui/controls/editor/gutter/marks.css`. That part of the premise holds.
  - The overflow comes from the `flex: none` buttons in a `nowrap` row alone (`DiffSection.svelte:508-510`).
- **Sizes and folder counts.** `wc -l` printed 809, 818, 587, 802, 496, 270, 222, 194 and 321 for the files the brief names, which matches. `git ls-tree --name-only HEAD <dir>/ | wc -l` printed 6, 5, 8, 10 and 6 for the folders it names, which matches.
- **Tests and guarded entries.** `grep -rln "fileLog\|log=\|timelineOf\|commitsOf\|parseLog\|rowMenu\|tabMenu\|showInFiles\|lineBars" tests` printed nothing, which matches. The brief's second command, `grep -n -i "git\|timeline\|history\|row-menu\|tab-menu\|show-in-files\|diff\|zones" agents/guarded.md`, did print hits: G1's `src/routes/api/ ... git` (`:8`), G2's `history` route (`:11`), G6 and G33's git routes (`:22-24`, `:44-46`), G9's `server/files/fs/history.ts` (`:34-36`) and G28's test `tests/shell/panes/strip/tab-menu.test.ts` (`:43`). The brief reports that command as showing no entry. G28's test imports `tab-menu-state.svelte.ts`, which this step writes. G28's Code line does not name that file, so the brief's conclusion that the step writes no test can stand. But the premise as written misreports what the command printed, and `npm run test:quick` will run that test.
- **ADRs.** `ls docs/adr tools/oculus/docs/adr` printed `No such file or directory` twice, which matches.
- **Libraries.** `library-audit.md:303` and `library-audit-F.md:38-53` match. `.agents/plan.yaml:15` is `libraries: check`, which matches.

Findings:
1. The `--skip` paging premise behind item 2 is false on git 2.49.0. A second page repeats the first page. A cursor such as `<hash>^` works, but it changes the route parameter item 2 dictates. That is a user-visible wire shape (spec.md, "The working rules", "No silent design decisions").
2. The cause of the hunk bar overflow is false. `fit` sizes the `.line-bar` wrapper, which is already border-box with no padding. `.hunk`'s padding does not widen its outer box. Only the `flex: none` buttons overflow.
3. The Authority premise points at `plan.md:499`, which is D44's Step 0. D42 has no Step 0.
4. The guarded.md premise says its grep shows no entry. The grep prints hits, G28's tab-menu test among them.
5. The line numbers in `Timeline.svelte` (`:46-47`, `:83-87`, `:89-91`, `:94-108`, `:173`) are 1 to 8 lines off, and `fs-history.ts:64-71` is one line off.
6. The record separator is described "as GRAPH_FORMAT does", but GRAPH_FORMAT ends records with it. The `\n` that opens each status block must be stripped before `parseNameStatus` reads it.
7. "Until the page is reloaded" overstates: `invalidate()` also re-reads history and log.

## 4. Cases and checks

- Cases 1 to 8 and 11 to 36, apart from the cases listed below, are consistent with `agents/spec.md` and the state file's look rules.
- **Case 9** ("then a commit of it made in the Repositories view") breaks the standing demand in `orchestrator-state.md`, "Looks and the machine": "In the Changes view never click Unstage, Commit or Discard on real repositories". The case can only be run on a scratch repository served as a root. It names none.
- **Cases 10 and 11** save files on TEST. They are consistent with "A look never leaves a write behind" only if the file is restored and its `shasum` checked, or the new file deleted. The local-history copies the save writes under `~/.oculus/history` stay behind. The cases say nothing about either.
- **Case 14** names "`config/layout.yml` of the engine root". The engine root is the config folder itself: `place.ts:17-22` says "The key the engine's own `config/` folder is served under", and `server/files/files.ts:242-250` has `engineRoot` with `dir: configDir(engine)`. So the file's path under the engine root is `layout.yml`. The case gives a path that does not exist under that root.
- **Case 34** expects the tooltips `Stage 3 Lines` and `Revert 3 Lines` as "the `repositories.lines_*` words". `grep -rn "lines_stage:\|lines_revert:" config/text --exclude=local.yml` printed `repositories.yml:82: lines_stage: Stage {0} Selected Lines` and `:80: lines_revert: Revert {0} Selected Lines`. The expected words are therefore `Stage 3 Selected Lines` and `Revert 3 Selected Lines`.
- **Case 7** (HELP.md, "115 commits ... a second press adds 15") is inconsistent with spec.md's "The working rules" ("Every count ... is taken after your last change"). `grep` of the in-flight briefs' write lists shows `tools/oculus/HELP.md` in X3f, D37 and H3, and D42 writes it too. The count at the look will be higher than 115, and the case's numbers will be false.
- **Decisions 1, 4, 6 and 8** are user-visible shapes:
  - Decision 1: an Open Timeline item in the file tab's menu that VS Code lacks.
  - Decision 4: the `skip` parameter and `more` field on `GET /api/git?log=`.
  - Decision 6: new keys of the Files tab's saved instance state, and the `...` menu's Git History and Local History items.
  - Decision 8: the diff tab's label.

  `grep -n "D42" choices.md orchestrator-state.md orchestrator-history.md queue.md` printed only Z375's entries and queue lines. These decisions were neither raised nor booked as automode choices before the brief was written. That is against the brief template's "a user-visible one went to the user before this brief was written", the `spec` skill's stop "A user-visible choice" (closed in automode under the state file's standing demand) and spec.md's "No silent design decisions".

Findings: case 9 (a rule clash with the look rules), case 14 (the wrong path), case 34 (the wrong expected words), case 7 (counts that will drift), cases 10 and 11 (the restore not said), and the user-visible decisions not booked.

## 5. The question

"The goal" here is the part of the plan's goal this step delivers. `plan.md` has no Goal section: `grep -n "^## " plan.md` printed `5`, `615`, `626` and `1143`. So the goal was read from the plan's head (the migration to oculus as DESIGN.md says) and the step line: a file's history as VS Code's Timeline, plus a hunk bar that stays whole in a narrow pane.

- **Verify 1 to 6** can pass without the goal. No test is written, `test:quick`, the tree checks, the ASCII gate, unused exports and the grep hold on any change, and the brief names the look as the proof. That is by design, so it is no finding.
- **Item 2's check and case 7** cannot pass as built. With `--skip`, Load more would repeat page one (Premises 1). Case 7 would catch this at the look, but only after the build.
- **Item 8's clause "The bar is `box-sizing: border-box`, so its outer box is the width `fit` gives it"** can pass without the goal: setting border-box on `.hunk` changes nothing (Premises 2). Only the compact clause and cases 32 and 33 test the goal.
- **Cases 12 and 15** are checked by reading the code. A reading can pass while the merge-path fallback is wrong. The hub has no merge (`git log --merges -1 --format=%h | wc -l` printed `0`), so there is no better check on the tree. This is acceptable.
- **Case 16** names no file. `git log --diff-filter=D --name-only --format=` filtered for paths present now gave real candidates, for example `.claude/skills/academic-paper-reviewer/agents/devils_advocate_reviewer_agent.md`. The case can be made concrete. As written, a builder reading the code could mark it as passed.
- **Case 18** ("a commit no longer in the repository") cannot be produced from a Timeline row on TEST without a git write such as an amend or a reset. It does not say "by reading the code", so at the look it either cannot be run or would break the look rules.
- **Case 9** cannot be run on a real repository at the look (Cases 4). As written it does not check that the commits are read again when HEAD moves.
- **Cases 1 to 6, 8, 10, 11, 13, 14 (with the corrected path), 17, 19 to 33 (with case 32 checked on the compact buttons), 35 and 36**: no, these cannot pass without the goal. Each needs the drawn behaviour at the look.

Findings: item 2 with case 7 (blocked by the `--skip` premise), item 8's border-box clause (passes without the goal), case 16 (no file named), case 18 (cannot be produced at the look), case 9 (cannot be run at the look as written).

## 6. Implied inputs

This is a code step. Inputs that the step's text implies but that "Cases" does not list:
- A `skip` (or its replacement cursor) that is absent, not an integer or negative should read as the first page. Item 2 says so, but no case lists it.
- A page asked past the end should answer `commits: []` and `more: false`.
- A file with exactly 50 commits should draw 50 rows and no Load more row. A file with 51 should draw 50 rows and Load more.
- A Load more answer that arrives after the followed file changed, after Refresh, or after the repository's HEAD moved should be dropped, with only the current file's first page drawn. Case 28 covers only the first page. spec.md's "What every package obeys" asks for every async path that is in flight or superseded.
- Enter on Load more should load the next page. Item 2 names it, but case 7 covers a press and a scroll only.
- With Git History unchecked on a file with more than 50 commits and old copies, every copy row should be drawn, since none is held back.
- A layout saved before this step, with no pin and no source keys in the Files instance state, or a malformed value there, should read as unpinned with both sources shown.
- A pinned file that is deleted or renamed, or whose root leaves the workspace: the expected result is not stated. One option is that the Timeline stays on the pinned path and lists its commits, with no failure line from git's text.
- Two Open Timeline asks in quick succession: the later ask should be the one settled, by the reveal ask's `asked` counter.
- Open Timeline from a card tree whose root the page's Files workspace lacks: the expected result is not stated. One option is the reveal outcome's sentence with the Timeline section opened.
- A file tab moved to another page while it is the followed file: the expected result is not stated. One option is that it counts as closed for this page and the section says `files.timeline_no_file`.
- A `files` message with `root: ''` (the bookmarks message, `bookmarks.ts:76`) should mark no copies read, unless it is a version gap.
- A hunk bar whose file has no block actions (`actions === 'none'`, the `.whole` sentence `repositories.diff_whole` or `diff_conflicted`, `DiffSection.svelte:346-351`) at about 297 px: the sentence is `flex: none` in the same row and overflows under the ruler in the same way. The expected result is that it is cut with an ellipsis or drawn within the bar, never under the scrollbar.

Findings: each of the thirteen inputs above is missing from "Cases".

## 7. ADRs

- `ls docs/adr tools/oculus/docs/adr` printed `No such file or directory` for both. `grep -n "adr" .agents/plan.yaml` printed nothing, so the folder is `docs/adr`. There is no record.

Findings: none.

## 8. Dictated text

- `Load more`: `grep -n "Load more" D42.md` printed `58`, `60`, `84`, `85` and `160`. Holds. It is VS Code's own wording and ASCII.
- `Open Timeline` (`files.menu_timeline`): `grep -n "Open Timeline" D42.md` printed `65`, `67`, `68`, `99`, `100` and `101`. Holds.
- `Pin the Current Timeline` and `Unpin the Current Timeline`: `grep -n "Pin the Current\|Unpin the Current" D42.md` printed `69` and `102`. Holds.
- `Git History` and `Local History`: `grep -n "Git History\|Local History" D42.md` printed `69` and `104`. Holds. `Local History` already appears in `files.yml:217` (`timeline_save_diff`).
- `The commits of this file could not be read.` and `The local history of this file could not be read.`: `grep -n "could not be read" D42.md` printed `30`, `70`, `94` and `95`. Holds. They are plain, ASCII, carry no engine text and match the catalog's existing form (`repositories.yml:185`, `diff_failed: The diff could not be read.`).
- `The change in commit {0} could not be read.`: `grep -n "The change in commit" D42.md` printed `70` and `95`. Holds.
- `` `GET /api/git?log=<repository>&path=<file>&skip=<n>` answers `{ ok, commits, more }` ``: `grep -n "skip=<n>" D42.md` printed `59` and `72`. As text it breaks no prose rule. As a wire shape it rests on the false premise (Premises 1).
- `` `timeline: true` `` on `RevealAsk`: `grep -n "timeline: true" D42.md` printed `66`. Holds as a code line.
- The verify 5 command `grep -rn "timeline_failed\|timeline_row_title\|FILE_LOG_ENTRIES\|showTimeline\|menu_timeline" src config --exclude=local.yml`: `grep -n "exclude=local.yml" D42.md` printed `201`. Holds, and it keeps the local.yml exclusion.
- A sweep of the brief: `LC_ALL=C grep -n '[^ -~]' D42.md` printed only line 83, the accented letter in `Lozano_Jiménez_2021.pdf`, a real file name quoted as a case input. `grep -n " -- \| --- " D42.md` hits are git's `--` path separator inside code spans. There is no em dash and no en dash.

Findings: none against the prose rules. The wire line at `:59` is covered by Premises finding 1.

## Declined to judge

- Whether item 8, which rests only on Z375, has authority. Z375 is recorded "(the orchestrator, automode)", and the `spec` skill's "What it reads" 4 counts only a ruling ending "(the user)" or "(self-rule)" named in the line's tags. The state file's automode standing demand lets the orchestrator close such items. Which of the two governs a widening of a step's scope is the session's or Axel's call.
- Whether the new log parser (NUL-ended records, the merge path fallback, paths byte for byte) needs an entry in `agents/guarded.md`, given spec.md's "A step that needs a new entry stops and asks Axel for it". Whether the cost of its failure, a wrong diff opened, calls for an entry is a judgment for Axel.
- How to page under `--follow`: a cursor of the oldest hash read with its path, or reading the whole history once and paging on the client. This is a choice of the route's shape, and so a stop for the session.
- I did not run any case on TEST, start any server or open any page. The look-dependent claims ("not seen on TEST at /spec") were checked only by reading the code.
- I did not check VS Code's own sources on GitHub (`timeline.contribution.ts`, `timelineProvider.ts`, `git.timeline.date`). The brief's VS Code claims are taken as quoted.

Agent usage: a5f84259f8e93e657, claude-opus-5-5, 207,414 tokens, 81 tool uses, 10.3 min.

## Closed

Each finding is closed by a change to `agents/briefs/D42.md`, listed in its section "Changes from the brief check" under the number given here. The brief was read again on main at 6005baee6, whose source tree is that of ed0e6de58 (`git diff --stat ed0e6de58 HEAD -- tools/oculus ':!tools/oculus/config/local.yml' ':!tools/oculus/.scratch'` prints nothing).

Names:
- `ShowPath.svelte` missing from Read and the write list: change 1. It is in Read 6 and the write list, and item 5 orders the scrolls: for a Timeline ask the head's `scrollIntoView({ block: 'start' })` runs in place of the row's, since the tree and the sections share one scroll (`Files.svelte:229-305`).
- The tab-menu test imports a written file: change 2 (the tests premise, Read 7, verify 1).

Premises:
1. The paging premise: change 3, the cursor of Z434 (`plan.md:1147`).
2. The hunk bar's cause: change 4; the cause now names the `.line-bar` wrapper (`LineBars.svelte:21`, `:34-37`) and the `flex: none` children in the nowrap row; the border-box clause is gone.
3. The Authority premise: change 5; Z347 alone, no Step 0.
4. The guarded.md premise: change 6; the hits quoted, G28's test named.
5. The line numbers: change 7.
6. The record separator and the newline before `parseNameStatus`: change 8.
7. `invalidate()` also reads again: change 9.

Cases and checks:
- Case 9 against the look rules: change 10 (the scratch repository, served through `config/sources.yml` and removed, `git diff --exit-code -- tools/oculus/config` checked).
- Case 14's path: change 12 (`layout.yml` of the `engine` root).
- Case 34's words: change 13 (`Stage 3 Selected Lines`, `Revert 3 Selected Lines`).
- Case 7's counts: change 14 (the count taken at the look with the command).
- Cases 10 and 11 leave writes: change 11 (the file put back and checked by `shasum`, or deleted; the local history the save added removed, `entries.json` checked by `shasum`).
- Decisions 1, 4, 6 and 8 unbooked: change 15 (Z434 and Z435 cited on each decision).

The question:
- Item 2 with case 7: change 16.
- Item 8's border-box clause: change 17.
- Case 16 names no file: change 18 (`projects/manuscripts/bttd-source-eeg/admin/SUBMISSION_CHECKLIST.md`).
- Case 18 cannot be produced at the look: change 19 (by reading the code).
- Case 9 cannot be run at the look: change 20.

Implied inputs, each now a case with its expected result:
1. A cursor absent or malformed: change 21, case 37, decision 9.
2. A page past the end: change 22, case 38.
3. Exactly 50 and 51 commits: change 23, case 39.
4. A stale page answer: change 24, item 2, case 40.
5. Enter on Load more: change 25, case 41.
6. Git History unchecked with old copies: change 26, item 2, case 42.
7. A layout saved without the new keys or malformed: change 27, item 6, case 43.
8. A pinned file deleted, renamed or out of the workspace: change 28, item 6, case 44, decision 10.
9. Two Open Timeline asks in quick succession: change 29, case 45.
10. Open Timeline for a root the workspace lacks: change 30, item 5, case 46, decision 12.
11. The followed file's tab moved to another page: change 31, item 4, case 47.
12. A `files` message with `root: ''`: change 32, item 3, case 48.
13. A hunk bar with no block actions: change 33, item 8, case 49.

ADRs: none to close.

Dictated text: no finding. The lines the revision adds or rewrites, held line by line against `agents/spec.md` (ASCII, no em or en dash, no spaced hyphen, no history words), each holds:
- `GET /api/git?log=<repository>&path=<path>&before=<hash>` and `{ ok, commits, more }` (`grep -n "before=<hash>" agents/briefs/D42.md`: lines 68, 191, 249): a code line of the route Z434 rules; holds.
- `git log --follow ... -51 <hash>^ -- <path>` (`grep -n -F -- "-51 <hash>^" agents/briefs/D42.md`: line 68): a command, the `--` git's path separator; holds.
- `scrollIntoView({ block: 'start' })` and `[data-instance="<owner>"] [data-fs-timeline]` (`grep -n "block: 'start'" agents/briefs/D42.md`: line 77): code; holds.
- `{ key: d42-scratch, dir: <its path> }` (`grep -n "key: d42-scratch" agents/briefs/D42.md`: line 89): a YAML item the look writes and removes; holds.
- `Load more`, `Open Timeline`, `Pin the Current Timeline`, `Unpin the Current Timeline`, `Git History`, `Local History`, `The commits of this file could not be read.`, `The local history of this file could not be read.` and `The change in commit {0} could not be read.` are unchanged; the catalog's existing `files.timeline_reading` (`Reading...`) is reused, no new words.
- `LC_ALL=C grep -n '[^ -~]' agents/briefs/D42.md` prints only line 98, the accented letter of `Lozano_Jiménez_2021.pdf`, a real file name.

Declined to judge:
- Item 8's authority: change 34 (Z375 under the automode demand, `orchestrator-state.md:63`).
- A guarded entry for the log parser: change 35 (none; a wrong diff opened is caught at the look).
- The paging shape: change 36 (Z434).
- VS Code's sources: change 37 (each claim read on GitHub and quoted with its file; `git.timeline.date` defaults to `committed`).
- No case run on TEST: rests on no part of the brief; the look at landing runs the cases.

Found while closing, beyond the report: changes 38 (a copy under `--follow`, case 50), 39 (a later page that fails, case 51), 40 (`duplication.test.ts` and `comment-width.test.ts` in verify 2) and 41 (the Load more row's reading word).
