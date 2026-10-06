# Step L7 refuter report (on /Users/axelfaes/workspace/research-hub/.agents/worktrees/L7, base 6b07631b)

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
- **The directive count is wrong.** "227 directive lines were deleted from 20 test files" (row 11) does not reproduce: `git diff 6b07631b -- tools/oculus/tests | grep -E '^-[[:space:]]*// revert:' | wc -l` prints `159`, over 15 files (catalogue 29, arrangement 21, shell rail 19, navigation rail 17, config-folder 13, and 10 more files).
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


## Repair round 1, refuted (reviewer claude:opus, a fresh agent, 2026-09-28)

I changed no file in the tree. `git status --short` in the worktree printed 39 lines both before and after my runs (38 tracked changes and the untracked HeldQuestion.svelte). My scratch files are under the session scratchpad only: `verify-r1.txt`, `r1-tests.diff`, `d0/` and `d1/`.

## Verification (rerun by the reviewer)

- **The verify list.** `uptime` before: `3:23 ... load averages: 4.87 6.85 8.20`. I ran `sh /Users/axelfaes/.claude-work/skills/land/templates/verify.sh .../orchestrator-state.md` from `.agents/worktrees/L7/tools/oculus`. It exited 0 and printed:
  - ` Test Files  345 passed (345)`
  - `      Tests  5432 passed (5432)`
  - `1790558752001 COMPLETED 1523 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`
  - `✓ built in 1.35s`
  - `✓ built in 6.69s`
  - `All matched files use Prettier code style!`
  - `verify: 6 commands passed`
  - No RED line.
  - `uptime` after: `3:27 ... load averages: 7.09 8.11 8.53`.
- **`ls -d $TMPDIR/oculus-* | wc -l`:** 1 before and 1 after.
- **`npx vitest run tests/checks/config/config-folder.test.ts`:** `Test Files 1 passed (1)`, `Tests 26 passed (26)`. Matches the report.
- **`npx vitest run tests/state/workbench/layout/pages.test.ts tests/state/workbench/navigation/pages.test.ts`:** `Test Files 2 passed (2)`, `Tests 61 passed (61)`. Matches.
- **`npx vitest run tests/state/feeds/lead-application.test.ts tests/views/feeds/leads.test.ts`:** `Test Files 2 passed (2)`, `Tests 25 passed (25)`. Matches.
- **The other seven changed test files** (views catalogue, state catalogue, help, type-scale, registry, memories, rail): `Test Files 7 passed (7)`, `Tests 354 passed (354)`.
- **`grep -c "it(" tests/state/workbench/layout/open/landing.test.ts`:** 14. Matches the correction.
- **The `// revert:` grep** over every file changed or added since 6b07631b (101 files: `git diff --name-only --diff-filter=AMR 6b07631b` plus the untracked files): nothing printed, exit 1. Matches "101 files".
- **The 8 directive lines deleted this round in `tests/views/system/help.test.ts`:** counted in the round diff, 8. Matches.
- **`diff -r .../L7-base/tools/oculus/tests/browser tests/browser`:** nothing printed, exit 0.
- **`sh bin/size-check.sh`:** exit 0. **`sh bin/folder-check.sh`:** exit 0. `ls src/lib/ui/controls | wc -l` is 10, the folder limit.
- **`npm run diagrams` twice:** a copy of `docs/diagrams` was taken before each run. The first run changed nothing against the committed files (`diff -r` exit 0), and the second changed nothing either (exit 0). So the regenerated `.svg` files follow from the `.dot` changes. The `.dot` deltas are:
  - `state/feeds` gains an edge to `state/forms` (2), and its edge to `state/boards` goes from 2 to 3;
  - `ui/controls` to state goes from 3 to 4 (HeldQuestion's `t` import);
  - `views/feeds` to state goes from 47 to 46;
  - `views/system` to shared goes from 3 to 1, and to ui from 76 to 78;
  - `ui` to state goes from 8 to 9.

  Each is consistent with the source delta.

## 1. Spec

- **Round item 3 adds a UI primitive the round did not ask for, and removes a shared confirm from two views.**
  - The new file is `src/lib/ui/controls/HeldQuestion.svelte`: Confirm with `ui.confirm_ok` and `ui.confirm_cancel`, over `{ message, detail, answer }`.
  - It is the third wrapper that renders the same Confirm with the same two buttons, beside `ui/controls/CloseQuestion.svelte` (message only) and `views/shared/AskConfirm.svelte` (message, detail and act).
  - `Pages.svelte` and `PagesReset.svelte` drop `AskConfirm` for it (`-<AskConfirm asking={resetting} ...` becomes `+<HeldQuestion {question} />`).
  - The round asked that each tab be asked "the same question closing that tab asks (`ui.tab_close_dirty`, through the function the tab close uses)". The function `closeQuestion` is used. The tab close's dialog, `CloseQuestion.svelte`, is not: a `detail` prop on CloseQuestion would have served the reset, and the tab close would not need a second component.
  - HeldQuestion takes the tenth and last slot of `ui/controls`. The report states this as a judgment call. It is a reach beyond the brief and a DRY cost the orchestrator should rule on.
- **The verify runner was run more than once in the round.** The report says: "The runner was run more than once in this round. Only the run quoted above is on the final tree." The round brief says "Verify, once, at the end of the round", and the step brief says "Running the whole unit suite more than once is a finding in the review." The report is open about it. It is still a departure from the brief.
- **Items 1, 2, 4 and 5 do what the round brief says:**
  - `config/layout.yml:35`: `help: { label: "Help", glyph: page, chord: h }` after `info`.
  - The three `docs:` entries take `group: help`.
  - `Help.svelte` and `Memories.svelte` register `group: 'help'` with orders 0 and 1.
  - `arrangements.info` is unchanged.
  - `page` exists in `glyphs.yml:116`, and no entry of the group carries it: `help_glyph: question`, `memories_glyph: memories`, `doc_glyph: book`.
  - `grep -rnE "(key|\.key)\s*===?\s*'h'|case 'h'" src/lib` prints nothing.
  - The keyless case is replaced.
  - `prefillFromLead`, `leadAddFor` and `closeAddForm` are in `state/feeds/lead-application.ts` with unit cases.
  - The three comments are rewritten.
- **Z18 as written in the brief is met.** Every entry of every group carries a key: this is asserted per drawn group in `tests/views/system/workbench/catalogue.test.ts:66-83`, and it passed in the run above.

## 2. Proof

- **The change to `tests/views/system/help.test.ts` widens both key-sheet predicates, and leaves the round's System row unproven.**
  - The new helper, `help.test.ts:57-71`:
    ```
    const count = Math.min(order.chords[letter]?.length ?? 0, 9);
    const whole = `${letter}1-${letter}9`;
    return count > 0 && count < 9 ? [whole, `${letter}1-${letter}${String(count)}`] : [whole];
    ```
  - Both "names every catalogue group that has a chord" (`:244`) and "writes down every letter a catalogue group is reached by" (`:280`) now pass on either `x1-x9` or `x1-x<exact count>`.
  - The widening is bounded: only the exact count is added, taken from the live config. It is not an arbitrary n.
  - But it keeps `y1-y9` acceptable for a 6-entry group. So reverting `HELP.md:67` and the `app.yml` key row to the old `y1-y9 | open a view or a document of the System page's group` keeps both cases green: `y1-y9` is in `ranges('y')`, and the meaning still contains `System`. This is by reading; I did not edit the tree to run it.
  - The same holds for a row `h1-h9` in place of `h1-h5`.
  - So the round's y1-y6 and h1-h5 rows are not pinned by any case. A predicate that required the exact range for these two groups, or for every group, would pin them.
- **The component wiring of item 4 still has no case.** `Collection.svelte:156` `const leadAdd = $derived(leadAddFor(tab, { newEntry, writeFeedField }, instance.id, key));`, the `onadd={leadAdd}` and `onclose={() => closeAddForm(tab, instance.id)}` bindings, and `Leads.svelte`'s call of `prefillFromLead` are component lines. Reverting any of them leaves the suite green. The state functions they call are covered (`lead-application.test.ts:148-245`), which is what the round asked. What is left is seen at the look.
- **The item 3 cases do fail on revert, by reading.**
  - `tests/state/workbench/layout/pages.test.ts:546` expects `asked.slice(1)` to equal two `ui.tab_close_dirty` questions. A `resetAfterAsking` that skipped the per-tab loop would give `[]`.
  - `:581` expects `[ran, asked]` to equal `[false, 3]` with the pages' JSON unchanged.
  - `navigation/pages.test.ts:143` covers the superseded question being answered no.
- **Every count and path the round report quotes reproduces** (see Verification).

## 3. Standards

- **A head comment the round makes incomplete.** `src/lib/state/workbench/navigation/pages.ts:1-3` still reads "What a page is called, which tabs it holds, and what a close asks before it happens." The module now also holds `questionFor`, a general asker any component's held question runs through, and `resetAfterAsking`. Neither is a close, and the head comment does not name either.
- **A DESIGN.md sentence that misplaces what holds the question.** `DESIGN.md:305` (added): "is drawn by `ui/controls/HeldQuestion.svelte` over the question `questionFor` of `state/workbench/navigation/pages.ts` holds". `questionFor` holds only the pending resolver. The question itself is held in each component's `$state` (`let question: Question | null = $state(null)` in ActivityRail, Pages and PagesReset).
- **The key table now mixes two conventions** (`HELP.md:58-70`, and the same rows in `config/text/app.yml`).
  - `y1-y6` and `h1-h5` give the exact count.
  - Every other group with fewer than nine entries still reads `x1-x9`: Focus 3, Sessions 7, Projects 3, Incoming 5, Explorer 3, Academic Life 6, Pillars 3, References 4, Present 1, Views and Settings 4 (counts from `tests/state/workbench/navigation/catalogue.test.ts:319-345`).
  - The round brief asked for the y1-y6 row, so this follows the brief. The test helper's own comment calls the exact form "the one range that says exactly which keys open something", which the other ten rows are not.
- **Changed names grepped over `src tests config HELP.md DESIGN.md README.md`:**
  - `reset_unsaved`: no hit.
  - `resetAsk(`: every call uses the new 3 or 4 argument form.
  - `leads/application` or `application.ts`: no stale reference. `Leads.svelte:20` and `Collection.svelte:58` name `state/feeds/lead-application.ts`.
  - "System group", "System page's group", `group: 'info'`: the remaining hits are the six System views' registrations, their tests, `HELP.md:67` and `DESIGN.md:280/282` (History and Audit), all still true.
  - `tests/browser/workbench/system.spec.ts:1` "The System group in Chrome: the manual, ..." is now false, but it sits under `tests/browser/`, which brief item 11 forbids touching and Q93 deletes.
- **Nothing else found:**
  - No history marker on added lines: I grepped for step ids, dates outside test fixtures, "round" and "revert-check".
  - No non-ASCII (the verify gate, plus `LC_ALL=C grep -n '[^ -~]'` over HELP.md, DESIGN.md and HeldQuestion.svelte printed nothing).
  - No file over its limit (largest touched this round: `tests/state/workbench/layout/pages.test.ts` at 610 lines, `Collection.svelte` at 423).
  - HeldQuestion opens with a Layer 3 head comment.

## 4. Behaviour

- **The per-tab question a reset asks is not the same question closing that tab asks.**
  - The message is the same: `ui.tab_close_dirty`, "Close this tab and lose its unsaved changes?".
  - The buttons are the same: Confirm and Cancel, from `ui.confirm_ok` and `ui.confirm_cancel`, as CloseQuestion draws them.
  - Three things differ:
    - (a) It is a different dialog component (HeldQuestion, not CloseQuestion).
    - (b) It carries a detail line that the tab close lacks: the page's name (`pages.ts:193`, `ask(t('ui.tab_close_dirty'), pageNameOf(all, page.id))`).
    - (c) It names and shows no tab. The tab close is asked about the tab the reader just pressed, so "this tab" is on screen. The reset asks while the reset's page may not be on screen, and names only the page.
  - Two unsaved tabs on one page therefore produce two identical dialogs, and the reader cannot tell which tab each is about.
  - The report's judgment call ("shows the page's name as its second line, since the tab itself is not on screen") names (b) but not (c).
  - Naming the tab (its view label, or the instance's title) in the detail would make the question answerable.
- **The report states these user-visible changes:** the Help heading with h1 to h5, and one confirm per unsaved tab after the reset confirm. It does not state:
  - the System catalogue section now lists six entries (y1 to y6) and no longer lists Help, Memories and the three documents;
  - the key sheet's System row reads "open a view of the System page's group" in place of "a view or a document".
- **A no to any per-tab question now cancels the whole reset,** including Reset all across every page. This is as the round brief says, and HELP.md and DESIGN.md state it.

## Not checked

- Anything that needs a DOM, left to the look:
  - the HeldQuestion dialog appearing and chaining;
  - the Help heading drawn in the browser;
  - the h chord pressed;
  - the Applications form prefilled on screen.
- Whether `$derived(leadAddFor(...))` in `Collection.svelte:156` re-derives when the tab's `lead` changes. It depends on `instanceState` being a reactive read inside `$derived`. I did not trace the ui store.
- The 25 view files of the first round that the round did not touch. The first reviewer sampled them.
- The help.test.ts revert argument under Proof is by reading. I did not edit the tree to run it.

Reviewer usage: 25 tool uses, about 12 minutes (about 03:18 to 03:30 local). Token count not visible to me.

## Closed (the orchestrator's disposition of every finding above, 2026-09-28)

First review:
- The two System entries without a key, and the test asserting it: Axel's ruling on Z18 (d), a Help group with chord `h`; round 1 items 1 and 2.
- The landing order, the prefill carried in the form drafts, and the other judgment calls: kept, round 1 item 6.
- Unsaved tabs not asked about per tab: round 1 item 3.
- The leads-to-Applications flow without a case: round 1 item 4, the state moved into `state/feeds/lead-application.ts` with its cases.
- The case and directive counts: corrected in the report by round 1.
- The red full suite: not reproduced by the reviewer; the whole suite passed on main at landing.
- The three comments made false: round 1 item 5.
- The behaviour the report did not state (saved pages keep their layout until a reset, no decline on an applied lead, declined leads hidden by default, `applied` on declined and expired leads): written into the report by round 1, and into the landing report.

Repair round 1, refuted:
- `HeldQuestion.svelte`, a third wrapper over the same Confirm: fixed at landing; `CloseQuestion` takes a `detail` line, the three reset surfaces draw it, and `HeldQuestion.svelte` is deleted.
- The verify runner run more than once in the round: a departure from the brief with no effect on the tree; the whole list ran once on main at landing.
- The key-sheet predicates widened: fixed at landing; both cases require the exact range, and a case asserts no row for a chord letter that reaches nothing.
- The component wiring of item 4 without a case: needs a DOM, which the unit suite does not run; seen at the look (the applied control opened the Applications form prefilled with title, subtitle, url, deadline and status).
- The head comment of `navigation/pages.ts` and `DESIGN.md:305`: fixed at landing.
- The key table mixing two conventions: fixed at landing, every row exact; the `v1-v9` row removed since `v` reaches no view.
- The per-tab question naming no tab: fixed at landing; the question reads "Tab: <name>, on <page>." (`tabNameOf`, `workbench.reset_tab`), with a case that fails without the name.
- The System and key-sheet changes the report did not state: written into the landing report.
