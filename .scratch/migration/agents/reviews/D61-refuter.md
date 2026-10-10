# Step D61 refuter report (on .agents/worktrees/D61, base a35863cc6)

## Verification (rerun by the reviewer)

All commands were run from `tools/oculus` in the worktree. I did not run `npm run diagrams` because it writes files, and a reviewer changes none. The diagrams check in `npm run test:checks` (below) compares the committed diagrams with the source in memory, and it passes.

```
$ npm run test:quick -- --base a35863cc6
test:quick: 37 changed file(s), from git since a35863cc6
test:quick: 29 test file(s), 10 essential
ok      prettier (0.4 s): All matched files use Prettier code style!
ok      ASCII gate (0.4 s)
ok      eslint (1.4 s)
ok      svelte-kit sync (1.9 s)
ok      svelte-check (5.4 s): 1791650808124 COMPLETED 459 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (16.6 s): Duration  12.62s (transform 27.99s, setup 0ms, import 40.47s, tests 6.93s, environment 211ms)
test:quick: 17.1 s (limit 45.0 s); every command passed

$ grep -rn "workbenches_reset_heading\|useWorkbenchReset\|provideWorkbenchReset\|workbench-reset" src config tests docs HELP.md DESIGN.md
exit=1 (nothing printed)

$ sh utils/unused-exports.sh  vs  .agents/worktrees/D61-base/tools/oculus/unused-exports.txt
365 lines now, 365 at base; comm: added: (none) removed: (none)

$ ASCII gate of spec.md (perl over src tests bin config, local.yml excluded)
bfs: error: bin: No such file or directory.
exit=0, no other line
$ LC_ALL=C grep -n '[^ -~]' HELP.md DESIGN.md .scratch/migration/agents/reviews/D61-report.md
(nothing)

$ sh utils/folder-check.sh
exit=0 (nothing printed)
$ wc -l of every changed source file: largest layout.svelte.ts 812, ops.svelte.ts 742, ui.svelte.ts 781; largest component ActivityRail.svelte 406, Workbenches.svelte 360; src/lib/views/system/workbench holds 10 items, layout/open/float 7

$ git status --short   (worktree)
every entry is ` M`, ` D` (src/lib/shell/rail/workbench-reset.ts) or `??`; no entry has a letter in the index column

Commands the report quotes:
$ npm run test:checks -- --reporter=dot
 FAIL  |unit| tests/checks/config/config-folder.test.ts > oculus's own config directory > reads the roots of sources.yml without a finding
 FAIL  |unit| tests/checks/config/config-folder.test.ts > oculus's own config directory > names a group of its own and a path under the hub for every document
 FAIL  |unit| tests/checks/config/integrity.test.ts > the real hub > validates with no findings
 Test Files  2 failed | 15 passed (17)
      Tests  3 failed | 268 passed (271)
(reproduces the report's counts; of the 239 integrity findings, 25 are under the key `domain` and the rest under `themes` keys; none names a file the step changed)

$ npx vitest run --config <scratch>/d61b/vitest.config.ts <scratch>/d61b/after.cases.ts --reporter=verbose --silent=false
every CASE line matches the report byte for byte except the UUID in "CASE 2 close of a one-tab page" (a fresh UUID each run)
 Test Files  1 passed (1)
      Tests  9 passed (9)
```

## Verdicts

Items of the brief's "What to build", in its numbering:

- 1: violated, Spec 1. The rest of the item holds:
  - the view is registered at order 10 in `views` with the `folder` glyph;
  - the Open and Closed sections are drawn with TreeItem rows;
  - Reset and Close go through the page flows;
  - Reopen and Forget work (the `keptWorkbenches` and `forgetKept` members, and `withFreshIds` for a held id);
  - the layout store is split into `rail-pages.ts`, taking it from 877 to 812 lines;
  - a row whose root is not served is dimmed and cannot be reopened, while none is dimmed during the read;
  - New workbench is built on `pickWorkbenchFolder`;
  - each empty section draws its line.
- 2: holds. `WorkbenchMenu.svelte` shows the open list with its close buttons and Manage Workbenches, and no longer has the reset group. `workbench-reset.ts` and its provide call in `+page.svelte` are deleted, and so is `ui.workbenches_reset_heading` (verify 2 prints nothing). See Behaviour 1 for one change it does not state.
- 3: violated, Spec 2 and Spec 3. The rule order, the `repository` item, the ui-store field with its fallback and the heading of the picker all hold.
- 4: violated, Standards 1 and Spec 1. The HELP sentence about where the view opens does not match the code, and two sentences about `holdingRepository` are false.

Cases of the brief's "Cases":

- 1: met. "CASE 1 open rows" shows two rows with their folder and branch; "closed rows newest first" shows d, then c.
- 2: met. CASE 2: the reset leaves `kept: 0`; the close asks before it closes anything (`closedBeforeYes: []`); a one-tab page passes its own id to `closePage`.
- 3: met. CASE 3: `sameIds: true`, `freshIds: true` with 7 of 7 tabs and `unique: true`, the state is found under the fresh id, `forget` answers true with `keptInSavedLayout: []`, and the next open is fresh.
- 4: met. CASE 4 runs `servesRoot`. The reading is `Workbenches.svelte:266,292-306`: `tone` is muted, the mark at the row's end carries the tooltip, Reopen is disabled and Forget stays active.
- 5: met. CASE 5 covers cancel, a folder inside a served root, a folder outside, a refused add and a failed panel. The menu was checked by reading `Workbenches.svelte:162-175`.
- 6: met for the case as written, on a workbench page: "CASE 6 after" gives `pageIsWorkbench: false` and `rail: "views"`, and I read `ActivityRail.svelte:195-210`. The press itself is for the look.
- 7: met. CASE 7 gives repoA/file, repoB/workbench, repoC/chosen and hub/hub, and `["wait","use","wait"]` after a reload.
- 8: partial. The run uses a single workspace, so it never meets a second saved workspace. By reading, a session's repository that lies under another saved workspace's root is listed, which the case says must never happen. See Spec 2.
- 9: met. Both CASE 9 lines answer null.
- 10: met. "CASE 10 after reload" keeps `repository` hidden, keeps the choice, and shows `repository` before `branch` in `LEFT_ITEMS`.
- 11: met. "CASE 11 old envelope" gives `statusRepository: null` with the hidden set and the instance state intact. G29's `tests/state/workbench/layout/saved/layout-saved.test.ts` was in the `test:quick` selection and passed.
- 12: met. In "CASE 12", Settings to Gallery keep `y1` to `y9`, and Processes and Workbenches have none. The brief's own wording ("Settings to Processes keep y1 to y9") is wrong about the tree, as the report says.

## 1. Spec

1. **The view moves to the System page even when no workbench is on screen.**
   - Place: `src/lib/shell/rail/ActivityRail.svelte:195-210`.
   - Hunk: `if (heldInstance(WORKBENCHES_VIEW) === null) { const group = viewFor(WORKBENCHES_VIEW)?.group; const entry = pages.find((one) => one.page === group); if (entry !== undefined) { openRailPage(entry.page, entry.label, entry.node); } else if (currentPage().folder !== undefined) { ... } }`
   - What is wrong: when no page or float holds the view, the code always switches to the rail page of the `views` group (and makes it the first time), whatever page is on screen. Item 1 asks for that only "When none holds it and the page on screen is a workbench". Otherwise the view should open "as a unique view does", on the page on screen.
     - `HELP.md:59` states the brief's rule ("when no page or float holds it and the page on screen is a workbench, it opens on the System page of the rail"), so it is false about the code.
     - `DESIGN.md:476` ("opens it on the rail page of its catalogue group and never inside a workbench") describes the code instead.
   - Failure scenario: the reader is on the Focus page, which is no workbench, and no page holds the Workbenches view. They press Manage Workbenches. Oculus switches to the System page, and makes it if it was never made, instead of opening the view on Focus. HELP has told them otherwise.
   - Fix at landing: put `currentPage().folder !== undefined` on the rail-page branch and rewrite `DESIGN.md:476`.
   - Verdict: item 1 violated, item 4 violated.

2. **The repository picker and its drop rule read every saved workspace's roots.**
   - Place: `src/routes/+page.svelte:179,185,211`.
   - Hunk: `const served = $derived(allRoots(workspaces()));` ... `chosenState(statusRepository(), gitPayload(), served)` ... `choices: repositoryChoices(gitPayload(), served)`
   - What is wrong: `allRoots` (fs-transport.ts) is the roots of every saved workspace. The git channel serves only the fixed roots and the current workspace's: `repositoryRoots` calls `browserRoots` (`src/lib/server/files/roots.ts:55-59`), whose `addedRoots` reads `saved.current` (`src/lib/server/files/fs.ts:313-317`). The Files view shows the current workspace too.
     - `repositoryChoices` therefore treats another workspace's root as served.
     - So does `chosenState`'s `'drop'` test (`status.ts:319`).
     - Item 3 says the picker lists "the repositories of the Files view ... a session's workspace outside the served roots ... not listed". Case 8 says such a workspace is "never listed".
   - Failure scenario: a saved workspace "lab" has the root `~/lab`, but the default workspace is current. A Claude session works in `~/lab/tool`, a repository.
     - The git channel carries `~/lab/tool` as a session workspace. `underServedRoot(allRoots, '~/lab/tool')` is true, so the picker lists "tool".
     - After a switch of workspace, a chosen repository under the previous workspace's root is never dropped. `chosenState` answers `'wait'` (or `'use'` while a session runs there).
   - Fix: pass the current workspace's roots (`fs.roots()`, or `readRoots` with null meaning "not read") to `repositoryChoices` and `chosenState`. Keep `allRoots` only for resolving a tab's root key.
   - Verdict: item 3 violated, case 8 partial.

3. **The check of a chosen repository has its own rule.**
   - Place: `src/lib/state/workbench/navigation/status.ts:312-323`, beside 194 and 225.
   - Hunk: `if (!underServedRoot(roots, chosen)) return 'drop'; if (!Object.hasOwn(git, chosen)) return 'wait'; const state = git[chosen]; return state.repository && state.error === null ? 'use' : 'wait';`
   - What is wrong: item 3's last bullet asks for one rule for "the repository holding a path", used for the file, the folder, the Open rows' branch "and the check that a chosen repository is still reported".
     - `chosenState` does not use `holdingRepository`.
     - The readable-repository predicate now exists three times: `readableRepositories` (194), `repositoryStatus` (225) and `chosenState` (322). This is against spec.md's principle "a parser, a fold or a rule exists once and is reused".
   - Failure scenario: a later change to what counts as a readable repository is made in `readableRepositories`. `chosenState` keeps answering `'use'` for a root that `repositoryStatus` now refuses. `repoStatus` then returns null for the chosen rule, and the bar draws no repository, branch or sync item instead of falling back to the hub.
   - Verdict: item 3 violated.

## 2. Proof

1. **The report's reason for the `test:checks` failures is inaccurate.**
   - Place: `D61-report.md`, the `npm run test:checks` row.
   - Hunk: "They read the hub's project files and `local.yml`, which this worktree does not hold" and "(no assertion, `HUB.present` false)".
   - What the rerun showed: the same 3 failures (268 passed), but the stated cause is wrong.
     - The worktree does hold the hub's project files. The integrity findings name `.agents/worktrees/D61/projects/.../project.yml`.
     - `HUB.present` is true. If it were false, `it.skipIf(!HUB.present)` (`config-folder.test.ts:589`) would skip the case, and it ran with no document.
     - What the worktree lacks is the hub's own layer `<hub>/.oculus/`. `ls -a` of the worktree root shows no `.oculus`, while the main checkout has one. Without `local.yml`, the hub resolves to the worktree root (`src/lib/data/sources/config/local.ts:201`).
     - All 239 integrity findings are `domain` or `themes` keys checked against `.oculus/config/catalogs/vocab.yml`.
     - The two config-folder cases read `sources.yml` roots and `docs:` from that layer. The step changed neither file, nor any vocab or catalog.
   - The decision that rests on it: whether these failures count against the step. The conclusion stands (they are not the step's); only the reason given is wrong.
   - Failure scenario: an orchestrator who believes `local.yml` is the cause copies or creates one in the worktree and still gets the same 3 failures.
   - Verdict: none.

## 3. Standards

1. **Two sentences about `holdingRepository` are false.**
   - Place: `src/lib/state/workbench/navigation/status.ts:15-16` and `DESIGN.md:578`.
   - Hunks: "the file, the folder, the Workbenches view's rows and the check of a chosen repository all ask it" and "else the hub's; all four ask `holdingRepository`".
   - The rule broken: spec.md, "What every package obeys": "A sentence in a document or a head comment that the change makes false is a defect of the change".
     - `chosenState` never calls `holdingRepository` (Spec 3).
     - The last-chosen path calls `repositoryStatus(rule.chosen, ...)` directly (`status.ts:766`).
   - Failure scenario: a maintainer changes `holdingRepository`, trusting both texts, and expects the last-chosen path and the drop check to follow. They do not.
   - Verdict: item 4 violated.

2. **The builder ran two git commands.**
   - Place: the builder's session. The report says it ran `git -C . status` and `git rm -q` with no path.
   - The rule broken: spec.md "Where you work": "You never run a git command, read-only ones included".
   - Effect: `git status --short` shows no entry with a letter in the index column. The deletion of `workbench-reset.ts` is ` D`, an unstaged deletion in the working tree, so neither command left a trace in the index or the tree.
   - Failure scenario in general: a `git rm` given a path stages a change the orchestrator's read of the diff does not expect.
   - Verdict: none.

## 4. Behaviour

1. **The Workbenches menu loses its heading without saying so.**
   - Place: `src/lib/shell/rail/WorkbenchMenu.svelte:70-90`.
   - Hunk: `const items = $derived<MenuItem[]>(grouped([ open.length === 0 ? none : open.map(...), manage ]));` replaces groups whose first was `{ id: 'open', heading: t('ui.workbenches'), ... }`.
   - What a user sees change: the "Workbenches" heading above the list of open workbenches is gone, and the menu is now one flat list. Item 2 does not ask for this, and the report's before and after for the rail menu does not state it.
   - Failure scenario: at the look on TEST, the orchestrator sees the heading missing and has nothing to tell it whether that is intended or a defect.
   - Verdict: none.

2. **The repository item's accessible name omits the repository.**
   - Place: `src/lib/shell/status/RepoItems.svelte:156-166`.
   - Hunk: `label={t('statusbar.repository_menu')}`, where `statusbar.repository_menu` is "Repositories".
   - What a user sees change: the new item's accessible name is "Repositories" and does not carry the repository's name. The branch item's is "Branches of {0}".
     - spec.md counts the accessible name as visible.
     - The report's before and after does not name it, so the look has nothing to check it against.
   - Failure scenario: a screen-reader user tabbing to the item hears "Repositories" and not which repository is followed.
   - Verdict: none.

## Declined to judge

- **When a chosen repository is dropped.** Item 3 says both "a chosen repository the git channel ... reports with an error is kept" and "a chosen repository no longer among the picker's repositories is dropped". These overlap: a repository reported with an error is not among the picker's repositories. The builder drops a choice only when no served root holds it (judgment call 3), which matches case 8's wording. One consequence is that a repository deleted under a served root keeps the choice at `'wait'` indefinitely, with the hub shown. Which reading is wanted is the orchestrator's call.
- **What only a DOM shows:** the rows, the controls under the pointer and the focus, the tooltips, the menus, the order of focus and the themes. This is for the look at landing.
- **Point (a), `ActivityRail.svelte` and `RailFoot.svelte` outside the write list.** The change is needed for items 1 and 2.
  - Opening the rail page takes `openRailPage(key, label, node)`, and the arrangement node comes from the config. Only `+page.svelte` and, through its props, `ActivityRail` hold it; the shell may not read the config.
  - The one listed path that could carry it, `+page.svelte`, would need a context module in `shell/rail` to hand a function to the menu. That is the pattern `workbench-reset.ts` was, and the brief ordered that file deleted. A new module there would be another path outside the list.
  - The report names both files outside the list, with the reason.
  - This is not a finding.
- **Point (d), the reopen change.** Item 1 and decision 7 ask for it. The report states it with a before and an after. The change lives in `createFolderOps.openFolderPage`, so it applies to every open of a folder that has a kept layout, Open Workbench on a card included, and `DESIGN.md:476` says so. Not a finding.
- **Point (e), the exports removed from the layout facade.** svelte-check reports 0 errors over src and tests (`.svelte-kit/tsconfig.json` includes `../tests/**`). A grep finds no importer of `adoptFloats`, `adoptedPage`, `keptDefault`, `startedOn`, `withPage` or `giveDocuments` through the facade. `unused-exports.sh` adds and removes no line. Holds.
- **The cases' first run on the unchanged tree.** I could not rerun it: `first.cases.ts` imports the worktree's sources, which have since changed, and the base copy has no `node_modules`.
- **The report's count of three `test:quick` runs.** It cannot be reproduced from here, and no decision rests on it.
- **The ASCII gate's `bin` folder.** It does not exist in the tree, a fact of the tree that is not the step's.

Reviewer usage: a86856c9cda9069e5, claude-opus-5-5, 266968 tokens, 81 tool uses, 15m 13s.

## Repair round 1, refuted

Reviewer over round 1 (ace7fca6430f15a2c, claude-opus-5-5), on `.agents/worktrees/D61`, base a35863cc6. The delta of `git diff a35863cc6` against `D61-before-round1.diff` (shasum 9172f22e84511d444f211ca4b3e17248f9412fd1) is exactly the saved `D61-round1-delta.diff`.

```
From tools/oculus in the worktree.
$ npm run test:quick -- --base a35863cc6
ok prettier, ok ASCII gate, ok eslint, ok svelte-kit sync,
ok svelte-check (5.0 s): 459 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok vitest (14.5 s)
test:quick: 15.0 s (limit 45.0 s); every command passed
$ rename grep (workbenches_reset_heading|useWorkbenchReset|provideWorkbenchReset|workbench-reset) over src config tests docs HELP.md DESIGN.md: exit=1, nothing printed
$ sh utils/unused-exports.sh | diff - .agents/worktrees/D61-base/tools/oculus/unused-exports.txt: exit=0 (365 lines now, 365 at base)
$ ASCII gate of spec.md: exit=0 (bfs: error: bin: No such file or directory.); LC_ALL=C grep over HELP.md DESIGN.md D61-report.md: exit=1
$ sh utils/folder-check.sh: exit=0
$ wc -l: largest source file layout.svelte.ts 812 (limit 880); largest component ActivityRail.svelte 407 (limit 520)
$ npm run test:checks -- --reporter=dot
 FAIL config-folder.test.ts > reads the roots of sources.yml without a finding
 FAIL config-folder.test.ts > names a group of its own and a path under the hub for every document
 FAIL integrity.test.ts > the real hub > validates with no findings
 Test Files 2 failed | 15 passed (17); Tests 3 failed | 268 passed (271)
$ integrity findings: 239 keys, "domain" 25, themes 214; the worktree root has no .oculus, the main checkout has one
$ after.cases.ts: Test Files 1 passed (1), Tests 9 passed (9); CASE 6, 7, 8, 3, 10, 11 lines as the round report quotes them (page UUIDs differ per run)
```

### Verdicts

Items of the brief: 1 holds; 2 holds; 3 holds; 4 violated (Standards 1).

Cases: 1 to 5 met; 6 met for the opener logic (a copy of `openWorkbenches` over the real layout store, compared line by line with `ActivityRail.svelte:196-208`); 7 to 12 met.

Round items: 1 closed (HELP.md:59 inexact, Standards 1); 2 closed; 3 closed (Standards 2); 4 closed; 5 closed; 6 closed for the list with workbenches, the empty menu gains a heading (Behaviour 1); 7 closed; 8 not verifiable.

### 1. Spec

None.

### 2. Proof

None. Every closure reproduces; no check was removed, loosened or exempted.

### 3. Standards

1. `HELP.md:59`: "when no page or float holds it and the page on screen is a workbench, it opens on the System page of the rail, never inside a workbench." The code (`ActivityRail.svelte:198-205`) opens it on the System page only when the rail lists that page, else on the first page that is no workbench, else on a new page; `HELP.md:22` says a rail button can be hidden. Failure scenario: a reader who hid System presses Manage Workbenches on a workbench and the view opens elsewhere than HELP says. Item 4 violated.
2. `status.ts:315` and `status.ts:340-341` compose "listed by the picker" twice (`readableRepositories(git).filter((root) => underServedRoot(roots, root))` against `underServedRoot` then `readableState` in `chosenState`), against spec.md's "a rule exists once and is reused". Failure scenario: a later filter added to `repositoryChoices` leaves `chosenState` answering `use` for a repository the picker no longer lists.

### 4. Behaviour

1. `WorkbenchMenu.svelte:72-93,105-106`: with no workbench open, the base menu held "No workbench is open" alone with no heading; now it shows the heading, that line, a rule and Manage Workbenches. Round item 6 asked for the heading over the list "as before the step". Failure scenario: at the look the empty menu shows a heading the base did not have, with no Before/After for it.

### Declined to judge

- Round item 8 (no git in the round): nothing in the tree records it.
- The ` A` marks of `rail-pages.ts` and `Workbenches.svelte` in `git status --short`: the orchestrator's intent-to-add for its saved diff.
- A repository deleted under a served root stays at `wait`, kept as built by the round brief.
- What only a DOM shows (the menu's heading and rule, the accessible name as spoken, the rows and themes): for the look at landing.
- `npm run diagrams`: not run since it writes files; the diagrams check in test:checks passes.

Reviewer usage: ace7fca6430f15a2c, claude-opus-5-5, 196,355 tokens, 52 tool uses, 11.0 min (from the completion notice).

## Closed

- Round 1, Standards 1 (HELP.md:59): fixed at landing on main, the sentence gains the two fallbacks the code has: else on the first page that is no workbench, else on a new page.
- Round 1, Standards 2 (the picker's rule written twice): fixed at landing on main, one private predicate in `status.ts` that `repositoryChoices` and `chosenState` both call.
- Round 1, Behaviour 1 (the empty menu's heading): fixed at landing on main, the empty menu goes back to the base's shape with no heading: "No workbench is open" and Manage Workbenches, the group with its heading only when a workbench is open.
- Round 1, item 8: not verifiable; the builder's round section names no git command.
- The test:checks failures: the three are the worktree's missing hub `.oculus/` layer, and the plan's verify list runs on main at landing.
