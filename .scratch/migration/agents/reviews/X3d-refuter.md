# X3d refuter report

The review of X3d as prepared again on base 2c7a6ea4 (reviewer a0069f4ae7f73ca18, claude-opus-5-5, 360,431 tokens, 94 tool uses, 16.4 min). The report of the attempt taken back out of main is in git history at 1908b1e9.

## Verification lines (verbatim)

From the worktree's tools/oculus: `npm run diagrams` regenerated the diagrams; `git status --short` showed the same diagram entries before and after it ran. Then `checks.sh`, exit 0:

```
$ npm test
 Test Files  366 passed | 20 skipped (386)
      Tests  5666 passed | 572 skipped (6238)
$ npm run test:checks
 Test Files  27 passed | 2 skipped (29)
      Tests  365 passed | 9 skipped (374)
$ npm run check
1790818786959 COMPLETED 2506 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build
$ npm run format:check
All matched files use Prettier code style!
$ npm run lint
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 7 commands passed
```

The other checks the brief and spec ask for:
- **Verify 3 (pixel literals):** `grep -rn "px" src/lib/views/sources/repositories src/lib/views/shared/changes/CommitBox.svelte | wc -l` prints 57, the same count as the report.
- **The spec's perl ASCII gate:** prints nothing. `bfs` warns that `bin` does not exist, and the other folders were scanned.
- **Non-ASCII in DESIGN.md, HELP.md, vite.config.ts, package.json and the report:** `LC_ALL=C grep -n '[^ -~]'` prints nothing.
- **ADR folder:** `ls tools/oculus/docs/adr` prints "No such file or directory".
- **The build emits the Seti font:** `.svelte-kit/output/client/_app/immutable/assets/seti.Cd2SFYCl.woff` exists.
- **First run on the unchanged tree, rerun in `X3d-base`** (`npx vitest run` over virtual, badge and commit-action, then tool-button, text-area and menu-opener):
  - Case 28 fails as the report quotes: `AssertionError: expected { rows: [ ...(30) ], after: 19250, ...(1) } to be ... // Object.is equality`.
  - `messageRows` and `actionButton` fail with "is not a function".
  - The badge test fails.
  - The primitive tests give `Tests 11 failed | 3 passed (14)`.

## Verdicts: items

- **15 (Graph hang): holds.** The `rowWindow(virtualizer, held)` and `sameWindow` code and both `untrack(() => windowed)` writes match the brief. Case 28 is reproduced red on the base and green here. Case 29 needs a browser and is not verifiable here.
- **16 (action button spans the view): holds** in the code: `block={rail || cell || primary}`, and `.acts` is a grid with `minmax(0,1fr) auto`, which reaches the same result as the brief's `flex: 1 1 auto`. The drawn widths are not verifiable here (no server).
- **17 (Seti icons): violated.** See Spec S1 (the matching order departs from ruling 5) and Proof P1.
- **18 (Incoming and Outgoing lanes): holds.** `lanesIncoming` and `lanesOutgoing` in Graph.svelte, the "have none" sentence is gone, and case 32 tests pass.
- **19 (the builder's look): violated, and reported as NOT DONE 1.** The session panel's box was never looked at (Spec S5).
- **1 (tokens): holds.** One minor standards point: St7.
- **2 (section heads): holds.** TreeItem `.heading .main` is uppercase at 700, and the muted rule is removed.
- **3 (TreeItem props): violated.** The badge colours depart from the brief and the report does not record it as a judgment call (Spec S2). The 12 px inset holds as a reported deviation.
- **4 (primitives): holds.**
- **5 (repository row): holds.** The row also carries a `...` menu, which the measures table names.
- **6 (Repo.svelte): holds.**
- **7 (commit box): holds, with one minor point** (Spec S6).
- **8 (change groups and rows): holds.** The rename in a group diff is Z139.
- **9 (list and tree): violated** (Spec S3, Behaviour B1).
- **10 (lane geometry): holds.**
- **11 (graph row): holds**, with Behaviour B2.
- **12 (diff pane): violated** (Spec S4, Behaviour B10).
- **13 (words): holds.**
- **14 (docs): violated** (Standards St2, St3, St4).

## Verdicts: cases

- **Cases 1 to 8 and 10 to 19:** met. The tests are present and pass in `npm test`. The cases rerun on the base fail as quoted.
- **Case 9:** met.
- **Case 20:** partial. The pruning runs only on the toggle write path, so the Branch control's write of `collapsed` does not prune (S3).
- **Cases 21 and 22:** met.
- **Case 23:** met. The rename header is tested through a commit or stash diff.
- **Cases 24 to 27:** met.
- **Case 28:** met, reproduced on both trees.
- **Cases 29 and 30:** not verifiable. Both need a browser, and the evidence files the report cites (`/tmp/x3d-final.json`, `final1.out`, `final2.out`) are gone: `ls /tmp/x3d-final.json` finds no such file.
- **Case 31:** partial.
  - The eight names resolve as ruled.
  - No test checks that a change-group folder row draws no icon. Only the folder row of a graph commit is checked (tree-mode.test.ts:419).
  - The longest-ending test cannot fail (P1).
- **Case 32:** met.
- **Case 33:** partial. The session panel is not looked at.

## Spec

**Paths outside the brief's list, judged one by one:**
- **vite.config.ts:** justified. `?raw` `.less` reads come back empty in vitest without the `css.include` entry.
- **ui/tree/TreeActions.svelte:** justified, since TreeItem is at 537 lines against the 540 limit. But it sits outside the folders the brief allows for a size-forced component (graph/, diff/, changes/, menus/, refs/), and the report does not say a size limit forced it.
- **ui/menu/Menu.svelte:** justified. It has to pass `primary` to the opener, so the brief's "neither is changed" premise was wrong.
- **state/sources/repositories/diff-hunks.ts:** justified. It holds the pure reveal rule for item 12's "unfold before reveal".
- **views/sessions/changes/Changes.svelte:** justified by item 7, which removes the panel's Push.
- **ui/controls/editor/kit/colours.ts:** not justified by any item. See S2.

**Findings:**

- **S1. file-icons.ts:114-124 departs from ruling 5.**
  - Hunk:
    ```
    const contained = longest(PARTIAL.filter((entry) => base.includes(entry.pattern)));
    ```
    and `SET.filter((entry) => base.endsWith(entry.pattern))` over entries without a leading dot.
  - **What the ruling says:** the whole name first, then the longest ending, then the default, "how VS Code reads its Seti theme".
  - **What VS Code's file shows** (python over `vs-seti-icon-theme.json`): `mix`, `pom.xml`, `license` and `todo` are exact `fileNames`, all keys are lower-case, and Dockerfile and makefile are `languageIds`.
  - **What the code does** (node simulation of the module over seti-ui's `mapping.less`):

    | Name | Drawn here | VS Code |
    |---|---|---|
    | `remix.zzz`, `admixture.zzz` | hex, red | default |
    | `LICENSE-MIT` | license | default |
    | `TODOS` | todo | default |
    | `REBUILD` | bazel | default |
    | `mypom.xml` | maven | xml |
    | `readme.md` | markdown | info |
    | `README.MD`, `Foo.TS` | default | info, typescript (case-insensitive) |

  - The report's ruling-5 line ("then the longest name contained (a partial entry)") presents the added step as if the ruling carried it. It is not raised as a judgment call. The module's head comment (file-icons.ts:8-11) states it as VS Code's reading, which is false.
  - **Failure scenario:** a repository with `Readme.md`, `LICENSE-APACHE` or `remix.config.zzz` shows icons VS Code does not draw.
  - Verdict: item 17 violated.

- **S2. TreeItem.svelte badge rule and colours.ts:375-386 change the badge colours.**
  - Hunk: `background: var(--line); color: var(--on-line);` and `'badge.background': '--line', 'badge.foreground': '--on-line'`.
  - Item 3(a) says `background: var(--muted)`, `color: var(--c-on)`. The change came with the applied patch and badge.test.ts asserts a 4.5:1 contrast, so it may well be the better pair. But the report lists colours.ts only as "repoints Monaco's badge colours", with no judgment call and no before and after.
  - It also recolours every Monaco badge in the app (the find widget's count, the peek titles), outside this view.
  - **Failure scenario:** the orchestrator reads item 3 as built to the brief, and a reader sees new badge colours in every editor with nothing to say why.
  - Verdict: item 3 violated (unreported deviation).

- **S3. Repositories.svelte `showBranches` and change-tree.ts:140-160 prune `collapsed` only partly.**
  - `showBranches` writes `collapsed: view.collapsed.filter((id) => id !== 'branches')` without `prunedCollapsed`. Item 9 and case 20 say every write of `collapsed` drops the dead `dir:` ids.
  - `prunedCollapsed` keeps every commit-folder id: "The folders of a commit's files ... are left as they are". The brief says every `dir:` id of the shown repository whose folder is in none of its groups is dropped.
  - That narrower reading may be the right one, but it is not reported as a judgment call.
  - **Failure scenario:** commit-folder ids accumulate without bound in the saved instance state.
  - Verdict: item 9 violated, case 20 partial.

- **S4. diff/FileHeader.svelte:91-94 uses a different wall surface from the pane.**
  - Hunk: `:global(body.wall) .header { background: color-mix(in srgb, var(--panel) var(--wall-panel), transparent); ...}`
  - Item 12 says the header sits "on the translucent surface the pane draws under body.wall (Diff.svelte:490-493)". That surface is `color-mix(in srgb, var(--chip) ...)` (Diff.svelte:522-525).
  - **Failure scenario:** under the wall theme the sticky header is a different tint from the pane it floats over.
  - Verdict: item 12 violated (small).

- **S5. Item 19 and case 33: the session panel's commit box was never drawn in a browser** (report line 1).
  - The reason given: the scratch server lists no session.
  - The panel's own Push removal and its Sync Changes button are covered only by case 26's server render.
  - Verdict: item 19 violated, as reported.

- **S6. CommitBox.svelte:160-168 gives Suggest a different tooltip from the brief.**
  - `title={t('git.suggest_title')}`. Item 7 says Suggest is a bare icon button "with its words as the tooltip". The tooltip is the longer `suggest_title` sentence.
  - Minor; verdict for item 7 stays holds.

- **S7. The builder put test copies into `.agents/worktrees/X3d-base/tools/oculus/tests` and left them there** (report call 12; `git status --short` in X3d-base shows 9 modified and 16 untracked test files).
  - Six of them differ from the final tests: change-rows, diff-pane, view-state, tree-mode, change-tree and file-icons (`cmp`).
  - **Failure scenario:** anyone running the "unchanged tree" there runs stale tests.

## Proof

- **P1. tests/ui/display/file-icons.test.ts: three tests pass with their stated revert applied.** Node simulation of `fileIcon`, with the longest-ending pick swapped for the table's last match and with the whole path read in place of its last part:
  - **:79-83** ("Revert: take the ending of the stylesheet's last match ... rather than the longest"). `pom.xml` is caught by the whole-name step, so the last-match version also gives maven/red, and `a.test.ts` gives typescript/orange both ways. No case in the file tells the two orders apart; `mypom.xml` would (maven vs xml).
  - **:47-50** ("Revert: drop the folder part"). Reading the whole path still gives svelte/red for `src/lib/ui/App.svelte`.
  - **:85-90.** Reading the whole path still gives the default for `''` and `'dir/'`. Line 89 compares `fileIcon('a.ts')` with itself.
  - None of these carries "audit" in its name, as Verify 4 requires.

- **P2. New tests with no first-run failure quoted in the report:**
  - tool-button.test.ts, text-area.test.ts and menu-opener.test.ts. I ran them on the base: 11 fail, so the behaviour checks hold, but the report does not quote them.
  - commit-action.test.ts: "is the disabled Commit button on a detached head", and the `checkedOutBranch` test.
  - view-state.test.ts: `groupWaits`.
  - change-tree.test.ts: `dirOf`.
  - tree-mode.test.ts:427-467: the commit file's folder, a changed behaviour.
  - diff-pane.test.ts:354-367: the chevron class audit.
  - The later tests of file-icons.test.ts.
  - The report itself says the later tests are "not in the table" (line 42). The first-run rows for change-rows and diff-pane were taken on older versions of those files (`cmp` against the X3d-base copies), not "in the form it has after its last change" (Verify 4).

- **P3. tests/views/sources/repositories/press-on-render.ts:13 adds a file-scope mutable:** `let wanted: ((props: Props) => boolean) | null = null;`. It is mutable module state shared between the `vi.mock` factory graph and the case; spec.md "No globals". It is a test helper, so the impact is low.

- **P4. Cases 29 and 30 and judgment call 9 cannot be reproduced.** The report's counts rest on `final1.out`, `final2.out` and `/tmp/x3d-final.json`, and the item-19 scratch folder was removed. The landing look on TEST is the remaining check.

## Standards

- **St1. spec.md:32 ("You never run a git command. Not ... status") was broken.** Report judgment call 11 says the builder ran `git -C . status` and `git status --short` in the worktree.
- **St2. DESIGN.md:389 has a sentence the diff makes false:** "...which also puts the commit, push and branch controls of the Changes panel over a configured repository...". ChangesRepo.svelte no longer draws a Push control (diff removes it at old lines 86-101). A reader looks for a Push button in the session panel.
- **St3. DESIGN.md:405 cites a wrong line:** "(`.main`, `flex: 1 1 auto`, `ui/tree/TreeItem.svelte:327-329`)", added by this diff. `grep -n "flex: 1 1 auto" TreeItem.svelte` gives 336, and `.main` opens at 334.
- **St4. HELP.md:112 "Each row's controls show on hover or when the row has the focus."** A readable repository row draws its controls always (RepoList.svelte `showActions={readable}`), as item 5 asks. The help now misdescribes the row it describes in the same paragraph.
- **St5. Test names that carry history:**
  - repo-row.test.ts:179 "...the branch line has said until now"
  - diff-pane.test.ts:288 "...the sentence it draws today"
  - text-area.test.ts:26 "...three by default, as before"
- **St6. Head comments that contradict the code:**
  - file-icons.ts:8-11 claims VS Code reads a "contained name" step (S1).
  - file-icons.test.ts:1-4 says "the last entry that matches a name winning", while the code picks the longest ending.
  - DESIGN.md's TreeActions sentence says "a 16 px icon and 2 px of padding". The code is `--action-pad: 1px` plus the control's 1 px border (Repositories.svelte:391-397).
- **St7. Item 1's rule ("a size that more than one rule reads is one of these tokens") is not followed for the 16 px icon box.** Three rules read it: `width: calc(16px ...)` in FileIcon.svelte:44 and ChangeRow.svelte:208, and `--action-font: calc(16px ...)` in Repositories.svelte. Minor.
- **No problems found for:** non-ASCII, file sizes (`checks.sh` size test green, TreeItem 537 of 540), and package ids or dates in comments (grep of the added lines).

## Behaviour (user-visible changes the report does not state, or states without before and after)

- **B1. An untracked folder in tree mode is drawn wrongly, and no test covers it.** Git status runs with `--untracked-files=normal` (server/core/git.ts:15), so a new folder arrives as `newdir/`. `changeTree([{path:'newdir/'}])` (run through node over change-tree.ts) gives a folder row `newdir` holding a file row with name `''` and path `newdir/`. ChangeRow labels it `nameOf('newdir/')`, so the view draws a folder `newdir` with a row `newdir` inside it, under the default icon, and its type-ahead name is empty.
- **B2. Graph pills and every count badge are drawn in the mono number font.** TreeItem's `.count, .end { font-family: var(--font-num) }` (`--font-num` is `--font-mono`, tokens.css:119) and CommitRow `.pill` does not reset it. The screenshots `item18-*` and `item17-diff-file-headers-light.png` show `origin/main` and `main` in monospace. VS Code draws pills and badges in the UI font.
- **B3. The capitalised git verbs show on more than tooltips.** The report says before "push" and after "Push" for tooltips only. They also show on word buttons: ChangesRepo.svelte:77 Create, ChangeGroups.svelte row Stage, Unstage and Discard in the session panel, and the status bar's confirm verbs (RepoItems.svelte:63, 74 and 80).
- **B4. The session panel's change rows change and the report does not say so.** ChangeGroups.svelte per-row Stage, Unstage and Discard buttons gain glyphs (`glyph="stage"`, `"unstage"`, `"note_back"`), and the group buttons swap `expand`/`collapse` for `stage`/`unstage`. No before and after is given.
- **B5. The 20x20 controls of the Repositories view are missing from the before/after table.** Every row control in the view is now a 16 px icon in a 20 px box (`.repos { --action-font: 16px; --action-pad: 1px }`, TreeActions `.opener.bare` 20 px), where before it was the small glyph with `1px 3px` padding. Only the look table mentions "box 20 x 20".
- **B6. The badge and Monaco badge colours change app-wide** (S2), with no before and after.
- **B7. Commit file rows changed and the before/after table does not show it.** They show the folder instead of the whole path (judgment call 10) and the Seti icon instead of the `diff` glyph. Their status letter stays mono, unlike the change rows'.
- **B8. Diff.svelte's Refresh is never disabled while a read is in flight** (`reading` was removed; before it was `disabled={reading || !subject}`). Not stated.
- **B9. The group diff wait** (`groupWaits`) is stated in judgment call 9 with a before and after. It is not verifiable without a browser.
- **B10. In a staged-group diff, the header of a deleted file offers Open File** (`openable={onDisk}`, `pathOf` falls back to `oldPath`). The screenshot `item17-diff-file-headers-light.png` shows the button on the `d5.md` header. Pressing it opens a path that is not on disk.

## The facts behind items A and B

- **A (Z138): confirmed.** python over VS Code's theme gives `light`: 238 fileExtensions, 98 fileNames, 82 languageIds; the default `#d4d7d6` dark and `#bfc2c1` light. Contrast against #ffffff and #121a2b: white 1.45, yellow 1.73, green 2.13 on light; ignore 2.16 and grey 2.43 on dark. The tokens match seti-ui's `ui-variables.less` values.
- **B (Z139): confirmed.** `GitEntry` at model-sessions.ts:323-330 has no old path, and git-parse.ts:339-341 reads `from` for an R or C line. Nothing found contradicts either item.

## Declined to judge

- Cases 29, 30 and 33, and the drawn measures of the look table: they need a running server and a browser, which this review may not start.
- Whether the 12 px row inset is better than the brief's 6 px: the VS Code CSS supports it (X3d-vscode-scm.css line 4), and the report raised it as a judgment call.
- Whether type-scale.test.ts "gets the rows for the new rules": the test parses only `font-size: var(--fs-*)`, so the new `calc(--tree-font ...)`, `--button-font` and `--tree-badge-font` rules cannot be expressed in it. Item 4's demand is not meaningful against this test, and settling it would need a ruling on extending the test.
- `nav.kept()` and the focus behaviour of a folder that closes over the focused row: they need a DOM.

## Usage

claude-opus-5-5, roughly 360,000 tokens, about 65 tool uses; minutes not measured.

## Files

- Worktree: /Users/axelfaes/workspace/research-hub/.agents/worktrees/X3d/tools/oculus
- Builder's report: /Users/axelfaes/workspace/research-hub/tools/oculus/.scratch/migration/agents/reviews/X3d-report.md
- Screenshots: /Users/axelfaes/workspace/research-hub/tools/oculus/.scratch/migration/agents/reviews/X3d-shots/

## Repair round 1, refuted

Step X3d. Worktree `/Users/axelfaes/workspace/research-hub/.agents/worktrees/X3d`, base 2c7a6ea4. Reviewer: a fresh agent, read-only. The only git commands run were `git diff 2c7a6ea4` and `git status --short`, both inside the worktree.

### Summary

All 7 checks pass. Every finding sent in round 1 closes, except where noted:
- Items 4 and 20 are already ruled (Z140 (2) and Z141 (1)) and are not counted against the builder.
- No round finding was closed by removing a check.
- Every closure I reran reproduced.
- Item 21 holds only through a guard in `Diff.svelte`. The new `disabled` on menu items does not stop a mouse press.
- Item 9 has one part the table makes impossible to test; the builder said so and my rerun confirms it.

Six small findings remain. Each can be fixed at landing.

### Verification (rerun from the worktree's tools/oculus, `PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH`)

```
npm run diagrams                          exit 0; `git status --short -- docs/diagrams` identical before and after
sh ~/.claude/skills/land/templates/checks.sh .scratch/migration/orchestrator-state.md   exit 0
$ npm test
 Test Files  366 passed | 20 skipped (386)
      Tests  5689 passed | 573 skipped (6262)
$ npm run test:checks
 Test Files  27 passed | 2 skipped (29)
      Tests  365 passed | 9 skipped (374)
$ npm run check
1790825742656 COMPLETED 2506 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build
$ npm run format:check
All matched files use Prettier code style!
$ npm run lint
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 7 commands passed
```

These counts match the report's numbers exactly.

The brief's verify items:
- **Verify 3:** `grep -rn "px" src/lib/views/sources/repositories src/lib/views/shared/changes/CommitBox.svelte | wc -l` gives 55, as the report says.
- **ASCII gate:** the spec's perl gate over src, tests and config prints nothing. `LC_ALL=C grep -n '[^ -~]'` over DESIGN.md, HELP.md, vite.config.ts, package.json and the report prints nothing.
- **Verify 5 (the look):** not rerun. It needs a server and a browser, which this review may not start.

Evidence commands from the report, rerun:
- **colours.ts untouched:** `git diff 2c7a6ea4 --stat -- src/lib/ui/controls/editor/kit/colours.ts` prints nothing.
- **The wall literal:** `grep -rln "color-mix(in srgb, var(--chip) var(--wall-panel), transparent)" src | wc -l` gives 13 files with 13 lines, as claimed.
- **S4 shared-token check:** reproduced on a scratch copy with both rules set to `var(--diff-wall-surface)` and the token added to tokens.css. `npx vitest run tests/ui/theme/colours.test.ts tests/ui/theme/wall.test.ts` gives `Tests  2 failed | 15 passed (17)`, both lines "(not a surface or a hue)", as `s4-shared-token-checks.txt` says.
- **P3:** `grep -n "^let \|^var " tests/views/sources/repositories/press-on-render.ts` exits 1 with no output.
- **St5:** `grep -rniE "until now|as before" tests/views/sources/repositories tests/ui/forms tests/ui/tree` exits 1 with no output.
- **S7:** `diff -rq X3d/tools/oculus/tests X3d-base/tools/oculus/tests` lists only the four `narrow-*.test.ts` files in X3d-base.
- **Raw look files:** read and consistent with the report's figures.
  - `case29-x3d.txt`: 8, 6, 1 and 1 ms, 2 file rows each time.
  - `case30-x3d.txt`: 16 of 16 rows show left 11, right 12, h 26.
  - `call9-x3d.txt`: 4 headers, `four.ts` renamedFrom `src/lib/old.ts`, `d5.md` openFile false.
  - `b2-fonts-x3d.txt` and `badge-contrast.txt`: minimum 2.56 before and 8.63 after.
  - `s5-session-panel-buttons.txt`: 0 Push buttons in all four shots.
- **First runs on the unchanged tree (X3d-base, tests in their final form), with `npx vitest run <file> --reporter=verbose`:**

| Test file | Result |
|---|---|
| tool-button | `5 failed (5)` |
| text-area | `5 failed \| 2 passed (7)` |
| menu-opener | `2 failed \| 1 passed (3)` |
| commit-action | `11 failed (11)`, with the detached-head and `checkedOutBranch` tests failing, the latter with `TypeError: checkedOutBranch is not a function` |
| view-state | fails, `groupWaits` and `groupFrom` included |
| menu.test, "a disabled menu item" | `1 failed \| 2 passed (3)` |
| git-parse, "gives the entry of a rename or a copy its old path" | `1 failed \| 7 passed (8)` |

All match the report.

Mutations rerun on a scratch copy under $TMPDIR, since removed. Sample chosen: S3-branch-write, B10-open-file, S1-contained, S1-last-match, S1-case, B8-bar, B8-menu, Z139-renames, S3-prune-commits. The baseline of the six files in the scratch copy was 134 passed.

| Mutation | Test file | Result | Report |
|---|---|---|---|
| S3-branch-write (`collapsed: opened` in `showBranches`) | repo-row | `2 failed \| 26 passed` | matches |
| B10-open-file (`present = openable`) | diff-pane | `1 failed \| 25 passed` | matches |
| S1-contained (contained-name step added back) | file-icons | `1 failed \| 10 passed` | matches |
| S1-last-match (`.at(-1)` in place of `longest`) | file-icons | `11 passed` | matches the report's "no test tells it apart" |
| S1-case (no lower-casing) | file-icons | `4 failed \| 7 passed` | matches |
| B8-bar (`disabled: reading` removed) | diff-pane | `1 failed \| 25 passed` | matches |
| B8-menu (`disabled=` removed from MenuList) | menu.test | `1 failed \| 2 passed` | matches |
| Z139-renames (`--renames` removed) | git.test | `1 failed \| 42 passed` | matches |
| S3-prune-commits (`withoutClosedCommits` bypassed) | change-tree | `1 failed \| 22 passed` | matches |

I also checked the S1-last-match claim against the table. A node scan of seti-ui's `mapping.less` finds one longer ending listed before a shorter one it ends in: `.smarty.tpl` (line 392) before `.tpl` (line 393). Both are glyph `smarty`, colour `@yellow`, so no file name can tell the two orders apart.

### Verdicts: the 23 round items

1. **S1, Seti matching order: closed.**
   - `file-icons.ts:114-120` does whole name, then the longest dot-led ending, then the default, all lower-cased. There is no contained-name step.
   - Tests for every name the ruling lists are present, and the mutations reproduce.
   - The head comment at `:8-15` says the order the code applies.
2. **S2, badge colours: closed.**
   - colours.ts has no diff.
   - Judgment call 14 gives the before, the after and the contrast figures, which match `badge-contrast.txt`.
3. **S3, pruning `collapsed`: closed.**
   - `showBranches` writes through `prunedCollapsed` (`Repositories.svelte:141`).
   - Commit folder ids are written (`CommitFiles.svelte:128` `onfolder(id)`). They are dropped by `withoutClosedCommits` in `prunedCollapsed` and in `openCommit` (`repositories.svelte.ts:377`).
   - Mutations reproduce.
4. **S4, wall surface: ruled Z140 (2), the token is made at landing.** The code holds the two literals tied by an audit test. Not counted.
5. **S5, session panel look: closed.** Four screenshots exist and show the panel's commit box, Sync Changes with its counts, and no Push.
6. **S6, Suggest tooltip: closed.** `CommitBox.svelte:161-162` uses `git.suggest`, and the orphaned `suggest_title` key is removed.
7. **S7, X3d-base: closed.** The final tests are there, plus the four narrow copies the report names.
8. **Z139, rename in a group diff: closed.**
   - `GitEntry.from`, `movedIn` in git-parse, `--renames` in git.ts, `groupFrom` and `DiffSection` all present.
   - DESIGN.md:128 is updated with `--renames`.
   - The tests fail without the change, both on the unchanged tree and under mutation.
9. **P1, file-icons tests: closed as far as the table allows.**
   - The test at `:79-83` cannot be made to tell longest-ending from last-match on seti-ui 1.11.0 (rerun above). The builder disclosed this.
   - The `App.svelte/notes` and self-compare items are done.
10. **P2, first runs: closed.** My sample reproduces.
11. **P3, press-on-render: closed.**
    - No module-scope `let`.
    - The press lives in the mock's implementation, and `harness.ts` `clear`/`fresh` reset it with `mockReset`. In vitest 4.1.11 that restores the `vi.fn(impl)` implementation.
12. **P4, raw output: closed.** Files are under X3d-shots. Not re-measured, for want of a browser.
13. **St2, DESIGN.md:389: closed.**
14. **St3: closed.** The citation names the rule with no line number.
15. **St4, HELP.md:112: closed.**
16. **St5, test names: closed.** But see Standards finding 4 for history wording left in comments.
17. **St6, head comments and the TreeActions sentence: closed.**
18. **St7, `--icon-box`: closed.** `tokens.css:171` is read by its three readers.
19. **B1, untracked folder: closed.** The change-tree tests and the tree-mode test are present. The builder's report gives `b1-x3d.txt` as browser evidence.
20. **B2, badge and pill fonts: closed.** The status letter is ruled Z141 (1) and not counted.
21. **B8, Refresh while a read runs: closed for in-flight reads, but only through a guard.**
    - A mouse press on the dimmed menu item still reaches `onpick`; the guard in `Diff.svelte` stops the read.
    - Refresh is no longer disabled in an empty pane (no subject) as it was on the base.
    - See Behaviour findings 1 and 2.
22. **B10, no Open File on a deleted file: closed.** But HELP.md:180 still says every header has Open File (Standards finding 2).
23. **B3 to B7: closed.** All are stated in "User-visible changes".

None of the closures removed a check. The diff's removed assertions (changes.test, views repositories.test, repositories.test) belong to behaviour the brief removes: the panel's Push, the branch line, the layout buttons. The badge test keeps the Monaco pair.

Fixes that reach beyond their finding: `MenuItem.disabled` in menu-items.ts and MenuList.svelte, and `openFile` revealing a folder. Both are needed by their item (B8 and B1) and both are named in the report. Neither is an overreach. The first has the defect in Behaviour finding 1.

### Verdicts: items of the brief, whole diff since 2c7a6ea4

- **15 holds.** `rowWindow`/`sameWindow` and `untrack`; `virtual.test.ts` is in `npm test`. Case 28 was reproduced on base by the first refuter.
- **16 holds.** The code is `block={rail || cell || primary}`; `case30-x3d.txt` shows insets 11 and 12.
- **17 holds.** The light colours wait on Axel (Z138).
- **18 holds.**
- **19 violated (minor).** No screenshot of the diff bar over a file's own diff; see Spec finding 1.
- **1 holds.**
- **2 holds.**
- **3 holds.** The badge pair and the 12 px inset are recorded as judgment calls 14 and 5.
- **4 holds.**
- **5 holds.**
- **6 holds.**
- **7 holds.**
- **8 holds.**
- **9 holds.**
- **10 holds.**
- **11 holds.**
- **12 holds.** Subject to Z140 at landing, and Behaviour finding 2.
- **13 holds**, apart from Standards finding 3 (a literal "R").
- **14 violated (minor).** HELP.md:180; see Standards finding 2.

### Verdicts: cases

- **1 to 19, 21 to 28: met.** The tests are present and pass in `npm test`. My sample of first runs on X3d-base fails as quoted.
- **20: met.** The Branch-control write prunes, and the mutation gives 2 failing tests.
- **29 and 30: not verifiable here.** They need a server and browser. The builder's raw files are consistent with the case.
- **31: partial.** No test checks that a change-group folder row (`changes/FolderRow.svelte`) draws no icon. Only a graph commit's folder row is checked (`tree-mode.test.ts:455`). See Spec finding 2.
- **32: met.**
- **33: partial.** See Spec finding 1.

### Findings

#### Spec

1. **The diff bar over a file's own diff was never looked at.**
   - Where: report, "The look", the row "Diff bar of a group diff".
   - Quote: "Previous Change, Next Change, Collapse Unchanged Regions and `...` (no Open File: a group's files open from their headers)".
   - What is wrong: the measures-table element "The diff editor's actions" starts with Open File. No screenshot or measure covers a file's own diff, the one state where the bar draws it. Item 19 and case 33 require each state the element names.
   - Failure scenario: the bar's Open File button (size, order, icon) reaches TEST unseen. Fix: take it in the landing look; the report's own landing table already lists "a file diff (Open File shown)".
   - Verdict: item 19 violated, case 33 partial.
2. **No test that a change-group folder row draws no file icon.**
   - Where: `tests/views/sources/repositories/tree-mode.test.ts:454-455`.
   - Quote: "// a folder row stands for a directory, for which the Seti theme draws no icon / expect(rows[0]).not.toContain('data-file-icon');"
   - What is wrong: this is the graph-commit folder row only. Case 31 says "a folder row holds none", and `changes/FolderRow.svelte` has no such test.
   - Failure scenario: a later change gives `FolderRow` a `file=` prop and every change-group folder draws the default Seti glyph with nothing failing.
   - Verdict: case 31 partial.
3. **TreeActions and DiffBar are not named with the size limit that forced them.**
   - Where: report, "Paths outside the brief's list", and `diff/DiffBar.svelte`.
   - What is wrong: the brief allows a further new component only under graph/, diff/, changes/, menus/ or refs/, when a size limit forces it, and named in the report. `ui/tree/TreeActions.svelte` is outside those folders and listed only as "(new)". `diff/DiffBar.svelte` is not named with its reason. TreeItem is 539 lines against the 540 limit and Diff.svelte 529, so the reason exists but is not stated.
   - Failure scenario: the orchestrator cannot tell from the report why a shared `ui/tree` primitive was added.

#### Proof

1. **The disabled-menu-item test checks markup only.**
   - Where: `tests/ui/menu/menu.test.ts`, "a disabled menu item".
   - What is wrong: it asserts `aria-disabled` and `data-disabled` on the markup. It would pass with a pointer press still reaching `onpick`, which is what happens (Behaviour finding 1).
   - Failure scenario: report item 21's "inert" stands on a test that cannot see the press.

#### Standards

1. **The `disabled` comment on `MenuItem` is false.**
   - Where: `src/lib/ui/menu/menu-items.ts:19`.
   - Quote: "/** Draw the choice dimmed and let a press do nothing, as a disabled button does. */"
   - What is wrong: a pointer press does reach `onpick` (Behaviour finding 1).
   - Failure scenario: the next caller that sets `disabled: true` trusts the comment and gets its action run on click.
2. **HELP.md still says every diff header has Open File.**
   - Where: `HELP.md:180`.
   - Quote: "gives each file a header row with its file icon, its name, its folder and Open File".
   - What is wrong: after B10 a deleted file's header has no Open File, and a rename's header carries R and the old path. DESIGN.md:389 says both; HELP does not.
   - Failure scenario: a reader looks for Open File on a deleted file's header.
   - Verdict: item 14 violated (minor).
3. **A literal "R" in markup.**
   - Where: `src/lib/views/sources/repositories/diff/FileHeader.svelte:58`.
   - Quote: `<span class="renamed" style={statusStyle('R')}>R</span>`.
   - What is wrong: spec.md "What every package obeys" says a literal string anywhere a reader sees it is a defect. The change rows draw the letter from `entry.status`; the header types it.
   - Failure scenario: none at run time. The catalog rule is broken in one place, and the keys check does not see it.
4. **Test comments that carry history.**
   - Where:
     - `tests/views/sources/repositories/change-rows.test.ts:156`: "one token gives every 16px icon box now, so the view keeps no size token of its own", together with `:157` `expect(tokens).not.toContain('--tree-action-icon')`, a name that exists nowhere on main (it was only in the first build, `X3d-landing-attempt.patch:7624`).
     - `change-rows.test.ts:223`: "the icons the merge group drew before the view changed".
     - `tests/views/sources/repositories/diff-pane.test.ts:164`: "the layout is the menu's Inline View item now".
     - `tests/ui/display/file-icons.test.ts:112-113`: "as the table's partial entries once were".
   - What is wrong: spec.md "No history in code or comments", which bars what the code did before. The `:157` assertion is over a name that never landed, so it cannot fail for any change on main.
   - Failure scenario: a reader on main looks for `--tree-action-icon` or an earlier merge-group look that does not exist.

#### Behaviour

1. **A mouse press on a disabled menu item still runs its action.**
   - Where: `src/lib/ui/menu/MenuList.svelte:112-114`.
   - Quote:
     ```
     disabled={item.disabled === true}
     onclick={(event: MouseEvent) => onpick(item.id, event, group?.id)}
     ```
   - What is wrong: bits-ui's `menu-item.svelte` builds `mergeProps(restProps, itemState.props)`. svelte-toolbelt's `composeHandlers` runs the caller's `onclick` first, and only bits-ui's own handler checks `disabled`. So a click on the dimmed item calls `onpick`, and the menu stays open. The keyboard path is inert.
   - Effect on Refresh: no read runs, only because `Diff.svelte` `onrefresh` checks `!reading`.
   - Failure scenario: any other menu that marks an item disabled (a write while busy) runs that write on click.
   - Fix: return early in MenuList's `onclick` when `item.disabled`, plus a press test through the recorder.
2. **Refresh is enabled in an empty diff pane.**
   - Where: `src/lib/views/sources/repositories/diff/DiffBar.svelte:48`.
   - Quote: `{ id: 'refresh', label: t('repositories.diff_refresh'), disabled: reading }`.
   - What is wrong: before, the base `Diff.svelte:379` had `disabled={reading || !subject}`. Now an empty diff pane (no subject) offers Refresh at full strength, and pressing it does nothing (the guard `subject && !reading`). The report states no before and after for this. Round item 21 said "as before".
   - Failure scenario: a reader opens the `...` menu of an empty diff pane, presses Refresh, and nothing happens.

### Declined to judge

- **Cases 29, 30 and 33, and every drawn measure:** they need a running server and a browser, which this review may not start. I read the builder's raw files and the screenshots only.
- **Z138 (light-theme Seti colours):** Axel's ruling.
- **Item 4 (S4) and item 20's status letter:** ruled Z140 (2) and Z141 (1).
- **Whether the builder ran git after the round was read (report judgment call 11):** nothing on disk records it.
- **Whether X3d-base's `src` is exactly the base:** checking it would need git in X3d-base, which this review was told not to run. I compared only the tests folders.
- **Why "Publish Branch" appears in `s5-session-panel-buttons.txt`'s sync state:** the CommitBox shows it only in its publish state. A second repository's box lower in the panel would explain it; the screenshots are cut off above it.
- **The type-scale rows (item 4):** as the first refuter said, the test cannot express the new `calc` rules.

Reviewer usage: about 190,000 tokens, 62 tool uses, about 35 minutes (estimated, not measured).

Files: `/Users/axelfaes/workspace/research-hub/.agents/worktrees/X3d/tools/oculus` (worktree), `/Users/axelfaes/workspace/research-hub/tools/oculus/.scratch/migration/agents/reviews/X3d-report.md` (builder's report, identical to the worktree copy), `/Users/axelfaes/workspace/research-hub/tools/oculus/.scratch/migration/agents/reviews/X3d-shots/`.

## Closed (findings of the run over repair round 1, at landing on main)

- Spec 1, the diff bar over a file's own diff never looked at: looked at on TEST at landing, `git-parse.ts`'s own diff, light and vscode dark modern: Open File, Previous Change, Next Change, Collapse Unchanged Regions and `...`, in that order. In a pane of about 480 px the `...` wraps onto a second row; the cause is the shared pane header (`ui/frame/Pane.svelte` `.tools` `min-width: 0` with `ui/frame/Toolbar.svelte` wrapping), on main before this step, so it is folded into U2's audit (brief What to build 3 and case 11), closed in automode.
- Spec 2, no test that a change-group folder row draws no file icon: `tests/views/sources/repositories/tree-mode.test.ts`, "draw a file icon on each file row and none on a folder row"; passes, and fails with `file="src/x.ts"` given to `changes/FolderRow.svelte`'s TreeItem (`AssertionError: expected 'data-folder="src">...' not to contain 'data-file-icon'`).
- Spec 3, TreeActions and DiffBar not named with the size limit: named in the booking (TreeItem.svelte at 539 lines and Diff.svelte at 529 against the 540-line component limit).
- Proof 1 and Behaviour 1 and Standards 1, a mouse press on a disabled menu item runs its pick: `clickOf` in `ui/menu/menu-items.ts` returns the item's click handler and does nothing for a disabled item; `MenuList.svelte` draws every item's `onclick` through it. Test `tests/ui/menu/menu.test.ts` "hands a press on it to nothing, and a press on an enabled item to onpick", failing first with the handler unguarded (`expected [ [ 'wait', 'g' ], [ 'go', 'g' ] ] to deeply equal [ [ 'go', 'g' ] ]`). The `disabled` comment names `clickOf`.
- Behaviour 2, Refresh enabled in an empty diff pane: `DiffBar.svelte` takes `subject` and disables Refresh with `reading || !subject`; `Diff.svelte` passes it. The diff-pane test checks `bar(false, false)` disabled, failing first (`expected { id: 'refresh', ... } to match object { id: 'refresh', disabled: true }`).
- Standards 2, HELP.md:180: the header sentence says a deleted file has no Open File and a renamed file's header shows R and the path it had.
- Standards 3, the literal "R": `RENAMED` in `state/sources/repositories/repositories.ts`, git's status code, drawn by `FileHeader.svelte`.
- Standards 4, history in test comments: the four comments rewritten; the assertion over `--tree-action-icon`, a name that never existed on main, removed.
- Item 4 (S4), Z140 (2): `--chip-on-wall` declared on body in `themes/tokens.css` (where a theme sets `--chip`), the 13 components on it, and the three checks that read the wall form taught it (`tests/ui/theme/colours.test.ts`, `tests/ui/theme/wall.test.ts`, `tests/views/whole/tinted.test.ts`), each with a fixture; a test holds the token's declaration to the mix over `--chip` (fails with `--accent` put in its place). `--wall-panel: 100%` declared on `:root` as the no-wallpaper value, which `tests/checks/look/contrast.test.ts` requires of every token the sheets reference.
- Item 20, Z141 (1): as built.
- Not a finding of the step, seen at the look and folded into U2's audit: an open diff editor keeps the previous theme's colours after a theme switch in Settings until the page is reloaded; the path from `theme()` to the editor (`look` in `Diff.svelte` to `DiffSection.svelte`) is the same before and after this step.
