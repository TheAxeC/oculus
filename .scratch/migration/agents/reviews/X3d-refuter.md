# X3d refuter report

The review of X3d as prepared again on base 6dc78524 (reviewer a0069f4ae7f73ca18, claude-opus-5-5, 360,431 tokens, 94 tool uses, 16.4 min). The report of the attempt taken back out of main is in git history at cbe70683.

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
