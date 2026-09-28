# Step L7 refuter report (on /Users/axelfaes/workspace/research-hub/.agents/worktrees/L7, base 1712f075)

I changed no file in the tree. The only files I wrote are under the session scratchpad: `vitest-full.txt`, `verify-runner.txt`, `state-no-test.md`, `cov-out.txt`, `L7.diff`, `diag1/`, `diag2/` and `l7-tests.txt`.

## Verification (rerun by the reviewer)

### The land skill's runner

Command: `sh /Users/axelfaes/.claude-work/skills/land/templates/verify.sh <state file>`, from `.agents/worktrees/L7/tools/oculus`.

The plan's verify list has six entries: `npm test`, `npm run check`, `npm run build`, `npm run format:check`, `npm run lint`, and `LC_ALL=C grep -rna '[^ -~]' src tests`. I read it out of `orchestrator-state.md` with PyYAML.

`npm test` had already run once as `npx vitest run --reporter=dot` (its lines are in the next section). So I ran the runner over a copy of the list without it: `scratchpad/state-no-test.md`, holding the other five commands in the same order. The lines it printed:

```
> svelte-kit sync && svelte-check --tsconfig ./tsconfig.json
1790552961549 COMPLETED 1523 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
> vite build
✓ built in 1.71s
...
✓ built in 6.07s
> Using @sveltejs/adapter-node
  ✔ done
> prettier --check .
Checking formatting...
All matched files use Prettier code style!
> eslint .
RED: LC_ALL=C grep -rna '[^ -~]' src tests
exit status: 1
```

The runner exits 1 on the last entry because grep exits 1 when it finds nothing: that entry prints no line. A clean tree always makes the runner report this entry RED, so the defect is in the state file's verify list, not in L7. The line wants to become `! LC_ALL=C grep -rna '[^ -~]' src tests` or the rules file's perl gate.

### The brief's "How to verify" list, each run once in the foreground

1. `npx vitest run --reporter=dot`
   - Output captured whole to `scratchpad/vitest-full.txt`.
   - `uptime` before: `1:46 ... load averages: 6.08 9.41 8.64`.
   - `uptime` after: `1:48 ... load averages: 11.48 10.54 9.20`.
   - Exit 0, and it printed:
     ```
     Test Files  345 passed (345)
          Tests  5422 passed (5422)
        Start at  01:46:49
        Duration  116.32s
     ```
   - The failures the report gives do not reproduce: no file failed and there is no failure message to quote. `tests/server/git/git-ops.test.ts` and `tests/checks/source/history.test.ts` passed inside this full run.
2. `npm run check`: `COMPLETED 1523 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS` (from the runner above).
3. `npm run build`: `✓ built in 6.07s`, `✔ done`, exit 0 (from the runner).
4. `npm run format:check`: `All matched files use Prettier code style!` (from the runner).
5. `npm run lint`: exit 0 (the runner went on past it).
6. The ASCII gate of the rules file (the perl form): printed nothing, exit 0. `LC_ALL=C grep -n '[^ -~]' HELP.md DESIGN.md` also printed nothing.
7. `sh bin/size-check.sh`: exit 0. `sh bin/folder-check.sh`: exit 0.
8. `npm run diagrams`, then again:
   - A copy taken before the first run matches the tree after it (`diff -r` printed nothing: "first run changed nothing").
   - A copy taken after the first run matches the tree after the second (`diff -r` printed nothing: "second run changed nothing").
9. The directive grep and the browser diff:
   - `grep -rn -E '^[[:space:]]*// revert:'` over all 97 changed or added files: nothing printed, exit 1.
   - `diff -r .../L7-base/tools/oculus/tests/browser tests/browser`: nothing printed, exit 0.
10. `ls -d $TMPDIR/oculus-* | wc -l`: `1` before, `1` after.

### The report's quoted evidence, rerun

- **The 20 changed or added test files:** `npx vitest run <the 20>` prints `Test Files  20 passed (20)` / `Tests  569 passed (569)`. This reproduces.
- **The coverage script:** `node scratchpad/coverage.mjs $PWD` exits 0 with 49 `ok` rows plus `two files group=explorer pages=sessions,explorer`, then `entries 50, not on exactly one page (bar the Files second instance) 0, tabs that are no entry: []`. This reproduces.
- **The file:line citations:** every one quoted in rows 1 to 11 points at the named construct (read with `sed -n`). Examples: `catalogue.ts:82 isChorded`, `opening.ts:93/169`, `context.ts:253`, `PaneView.svelte:383`, `pages.ts:105/126`, `layout.svelte.ts:521/542`, `rail.ts:103`, `Pages.svelte:251`, `LeadCard.svelte:117/120`, `Leads.svelte:113`, `Collection.svelte:283`, `data/accounts/leads.ts:45`, `state/feeds/leads.ts:161`, `arrangement.ts:65`, `Settings.svelte:36`.
- **The line counts** in "Files changed" match `wc -l`.
- **The old-name grep of row 7a** reproduces: the remaining hits are the kept `DISMISSED`, the `showDismissed` fallback and their tests.
- **The glyph names** used exist in `config/catalogs/glyphs.yml`, one line each: `email`, `focus`, `book`, `venue_dist`, `conference`, `settings` and `refresh`, among others.
- **Not reproduced:** "landing.test.ts (13 cases)" and "227 directive lines were deleted from 20 test files". Both are under Proof.

## 1. Spec

- **The System group leaves two entries out of reach of the keyboard.**
  - Brief item 3 says every group is reached by its letter "whatever its size, so no entry is out of reach of the keyboard".
  - The System group holds 8 views plus the 3 hub documents, 11 entries, and a chord reaches only digits 1 to 9. `tests/state/workbench/navigation/catalogue.test.ts:~315` lists `y` as 11 ids.
  - `tests/views/system/workbench/catalogue.test.ts:63-71` says so itself:
    ```
    // The System group holds eleven entries: the first nine carry y1 to y9, the last two none.
    expect(keys).toEqual(['y1', ... 'y9']);
    ...
    expect(last).not.toMatch(/class="key/);
    ```
  - Agent approach and HPC how-to have no key. Row 3 marks the item DONE, and neither the report nor its "Wrong, impossible or left" section names this.
  - HELP.md's row `y1-y9 | open a view or a document of the System page's group` reads as if the whole group is reached.
  - This is an acceptance item not met. The brief's decision 1 assumed that chording every group closes the gap, and for the table's own System page it does not. Axel must rule whether the fix is a two-digit or other scheme, or a group split, since the chord shape is user-visible.
- **The landing order is not the brief's.** `src/lib/state/workbench/layout/open/landing.ts:51-57`:
  ```
  const here = paneAt(tree, reader);
  if (here !== null && holdsOpened(here, opened)) return { kind: 'pane', path: reader };
  ...
  const documents = all.find(({ pane }) => !holdsTool(pane, opened));
  ```
  Brief item 4's order is: last-receiving pane, then an empty pane, then a new pane. The build puts "the reader's pane when it holds opened tabs" before the empty pane and adds "a pane of documents alone". Judgment call 1 of the report states this. It is still a change to a rule the brief fixed, and it is the orchestrator's to accept or send back.
- **The prefill is carried somewhere the brief did not name.** Brief item 7 says "The prefill travels in the Applications tab's instance state". `src/lib/views/feeds/leads/Leads.svelte:131-156` writes the fields into the tab's form drafts (`setFormField(tab, form, ...)`), and only `lead` goes into the instance state. Judgment call 2 reports it.
- **Unsaved tabs are not asked about per tab.** Brief item 6 says "A tab holding unsaved text on a page being reset is asked about as closing it would be". `state/workbench/navigation/pages.ts:126-149` (`resetAsk`) folds this into one line, `workbench.reset_unsaved: '{0} tabs on them hold unsaved changes, which the reset loses.'`, in the one reset confirm. Closing asks per tab through `ui.tab_close_dirty`. Judgment call 9 reports it.
- **Brief premise 10 checks out**: the coverage script counts 50.
- Every other brief premise is either not contradicted by what I read or confirmed by the reruns above (chord letters by the grep, registration groups by `grep -rn "group: '"` over `src/lib/views`).

## 2. Proof

- **A test asserts a known defect as the expected result.** `tests/views/system/workbench/catalogue.test.ts:63-71`, quoted under Spec, asserts that the last two System entries carry no key. This is the defect of item 3, fixed as the expected result, so the case fails on the day the defect is fixed.
- **The landing case count is wrong.** "`landing.test.ts` (13 cases)" (row 4) does not reproduce: `grep -nE "^\s*(it|test)\(" tests/state/workbench/layout/open/landing.test.ts` lists 14 `it(` cases, at lines 45, 53, 58, 63, 76, 81, 118, 129, 145, 154, 161, 169, 179 and 189.
- **The directive count is wrong.** "227 directive lines were deleted from 20 test files" (row 11) does not reproduce: `git diff 1712f075 -- tools/oculus/tests | grep -E '^-[[:space:]]*// revert:' | wc -l` prints `159`, over 15 files (catalogue 29, arrangement 21, shell rail 19, navigation rail 17, config-folder 13, and 10 more files).
- **The red full suite does not reproduce.** The report's row V1 ("Test Files 2 failed | 343 passed") did not recur in my one full run: `Test Files 345 passed (345)`, `Tests 5422 passed (5422)`, with load 6.08 before and 11.48 after. The report quotes no failure message, so I have nothing to compare it with. What I can state is that the failure did not reproduce under a similar load.
- **The core of the leads-to-Applications flow has no case.**
  - Row 7 cites `tests/views/feeds/leads.test.ts` as proof. Its new cases test `applicationFromLead` (a pure map, named "audits") and that the tooltip text `leads.action.applied_tip` appears in the rendered body, which is an assertion over a label alone.
  - `lead-application.test.ts` covers `addFromLead`.
  - Nothing exercises `toApplication` and `prefill` in `Leads.svelte:113-156` (drafts cleared, fields set by schema kind, `adding: true`, `lead` named). Nothing exercises the `leadAdd` wiring in `Collection.svelte:144-152` (`onadd={leadAdd}`, and clearing `lead` after a written entry).
  - Reverting `prefill` or `onadd={leadAdd}` leaves the suite green. That logic is state work in a component, which the rules file wants as state rather than a DOM side effect, and it is the part of item 7 that can go wrong.

## 3. Standards

- **A test head comment the step made false.** `tests/state/workbench/navigation/rail.test.ts:6-7` reads:
  ```
  // Nothing here renders; every case is over a pure function and its revert names the line that
  // makes it red.
  ```
  This step deleted all 17 `// revert:` lines of this file (count from the diff above), so no case names a revert any more. The rules file says: "A sentence in a document or a head comment that the change makes false is a defect of the change." The report names it and leaves it for Q93 "to avoid colliding". That is a deferral of work inside the step's own changed file, which the rules file treats as a shortcut.
- **A comment made false in a file the step did not touch.** `src/lib/shell/Workbench.svelte:84-86` reads:
  ```
  * The `direct_chord` of the merged config: the letter a digit after it counts into the
  * catalogue's small groups.
  ```
  The step removed small groups (`GROUP_MAX` and `sectionSize` are gone, and `isChorded` now reads the chord). The direct chord now counts groups that name no letter and the ungrouped views. The grep of the changed names missed this file.
- **A comment made false once Q93 lands.** `tests/views/whole/type-scale.test.ts:338-339` names `bin/revert-check/revert-check.mjs` in a file this step changed. It is still true on this tree, because revert-check is still present, and false after Q93. The report names it. It is lesser than the rail.test.ts comment.
- Nothing else found: no history markers on added lines (grep for step ids and dates over the diff), no non-ASCII, and no file over its limit (largest touched: `state/boards/collection.ts` 802 lines, `layout.svelte.ts` 638 lines).

## 4. Behaviour

- **Saved pages keep their old layouts until a reset, and the report does not say so.**
  - `openRailPage` (`layout.svelte.ts:326-333`) switches to a saved page carrying the key and leaves it as saved.
  - On a browser with saved pages, which is Axel's, Focus, Sessions, Explorer, System (still named "Info/more", still holding `usage` beside Focus's) and Views and Settings keep their old layouts after this step. Only Incoming is new.
  - The saved Feeds, Calendar and Inbox pages stay as pages no button reaches until Reset all.
  - The report's before and after says "The first press on a page not yet saved shows the table's layout". It does not say that the look on a browser with saved pages sees none of the table until Reset all is pressed.
- **An applied lead no longer offers decline.**
  - Before: `{#if status !== DECLINED}` showed decline on applied leads.
  - After: `{#if isOpen(status)}` at `LeadCard.svelte:120`.
  - The report's before and after names only open leads.
- **Declined leads are now hidden by default.** Before, only `dismissed` ones were held back. The expired count drops accordingly: the view test moved `'3 expired'` to `'2 expired'`. The report says only that the toggle reads "Show declined (n)".
- **`applied` is drawn on every non-applied lead.** That includes declined and closed leads in the expired list, where saving the form overwrites their status with `applied`. This follows the brief ("shown while the lead is not applied"), but the before and after does not name it.

## Not checked

- Anything that needs a DOM: the confirms opening, the empty-pane line on screen, and the prefilled form in the browser. These are left to the look.
- The allow-duplication removals (4 entries): read, not rerun apart from the full suite, which passed.
- 25 of the 32 registration-only view files. I sampled Present, Projects, AccountSetup, Calendar, Agents, Changes, Files and Hpc: each changed only its registration group, order and head comment. `grep -rn "group: '"` over `src/lib/views` tallies every group key against the 11 page keys, with no old group key left.

Reviewer usage: about 150k tokens, 40 tool uses, about 12 minutes (01:43 to 01:55).
