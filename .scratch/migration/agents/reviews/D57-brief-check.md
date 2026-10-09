# Brief check of D57 (oculus/migration), read on main at 2390acd38

The brief changed on disk while I was reading it: decisions 1 and 2 now say "Ruled by Axel (D57-1 (a), D57-2 (a))", G29 was added at line 51, and "Verify" item 2 now runs G29's test. Every finding below is against that current text, re-read with `cat -n agents/briefs/D57.md`. The plan's step line now ends with "(ruling D57 pane marks)", and the ruling itself is at `plan.md:1608`.

The plan has no section titled Goal (`grep -n -i goal plan.md` finds only lines 320 and 766). I used the plan's opening paragraph together with the goal you stated: closing the last tab of a pane the page's arrangement did not define removes that pane, Axel's Focus case included.

## Names

Command: `git grep -n -w <name> -- . ':!tools/oculus/.scratch'`, plus the same grep over src, tests, docs, config, DESIGN.md, HELP.md and README.md, filtered against the write list.

- `KeepRule`, `keptPane`, `keepRule`, `removeTab`, `splitLeaf`, `withoutLeaves`: every hit is in a file on the write list, or in DESIGN.md:238, which is also on it. No hit outside.
- `returnFloat`: outside the write list it appears at `src/lib/shell/panes/pane-view.ts:411,441` and `src/lib/shell/panes/PaneView.svelte:112,274`. These are calls by name only, and the change makes none of them false.
- `splitPane`: outside the write list it appears at `src/lib/state/workbench/layout/open/opening.ts:25,200,270`. These are calls; they stay true and pick up the mark through `splitPane`.
- `repane`: outside the write list it appears at `open/pinned.ts:4,9,28,45` and `open/preview.ts:11,58,70`. These are calls that carry the mark once `repane` does. The head comment at `pinned.ts:4` stays true.
- `Pane`: the type is imported outside the write list by `instance.ts`, `open/attention.ts`, `open/landing.ts`, `open/opening.ts`, `open/preview.ts`, `saved/fold.ts`, `saved/migrate.ts`, `navigation/arrangement.ts`, `shell/panes/PaneView.svelte`, `server/machine/pty/sessions.ts` and `sources/explorer/sections/timeline-state.svelte.ts`. An optional field makes none of these false.
  - `saved/fold.ts:33-36` builds a fresh pane without the mark. That pane is a migrated System page's arrangement pane, so leaving it unmarked is right.
  - `saved/migrate.ts:39` spreads `...pane`, so it carries the mark.
- `added`: `grep -rn "\badded\b" src/lib/state/workbench` finds no field of that name on `Pane`, `Split`, `PageLeaf` or `Float`. The only uses are local variables in `saved/fold.ts:51-109` and words in comments, so there is no collision.
- The mark's name `added` is not in Axel's ruling. `plan.md:1608` reads "(a) only panes made while a page is used carry the mark ..." and gives no field name. So the name is the brief's own choice, even though decision 1 opens with "Ruled by Axel". It is an internal key of the browser-saved layout, not a key under `~/.oculus`, so this is a wording point only.
- Docs sentences: a rerun of the brief's own grep (`grep -rn "empty pane\|last tab\|keeps never" DESIGN.md HELP.md README.md docs config/layout.yml src/lib/state/workbench`) finds hits the brief does not list, and the change makes some of them false:
  - **`src/lib/state/workbench/navigation/registry.ts:203-204`**: "The tabs close while the registration is still held, since whether a pane is kept empty after its last tab goes is read from what the registry says that view is." After the step, whether a pane is kept no longer depends on the registry's opened-for-something rule; only Terminal versus anything else matters. This comment becomes false, and `registry.ts` is not on the write list.
  - **`tree.ts:261-264`** (the `closePane` comment): "collapses into that child, exactly as closing its last tab one at a time would leave it". This becomes false for every arrangement pane, which now stays when its last tab closes. The file is on the write list, but the brief's list of comments does not name this one.
  - `model.ts:237-242` (the `repane` comment, "the lock always and the kind a pane keeps only while it holds no tab") lists the fields `repane` carries. It becomes incomplete once the mark is added, and it is not in the brief's list.
  - `saved/saved.ts:18-20` (head comment, "A pane carries `locked` ... and `recent`") lists the saved pane's fields. Same problem, and not in the brief's list.
  - `workbench.ts:42` ("The pane the instance leaves stays, empty, when the rule keeps it") and `nested.ts:168` and `:209` (the `withoutLeaves` and `settlePageLeaves` comments) are not listed. They are probably still true, but the report should mark each one.
  - `docs/window.md:15`, `:50` and `:54` are still true. The Explorer is described at line 15, Float at 50 (including "A float disappears when its last tab goes"), and the lock at 54.

## The step line

The line (`plan.md:713`) has four parts.

- "a pane the page's arrangement did not define is removed when its last tab closes": served by What to build 1 (the mark), 2 (first bullet) and 3, and cases 1, 5, 6, 10, 11, 12, 13, 16, 17 and 18.
- "the panes the arrangement defines stay": served by What to build 2 (second bullet and the cap removed), decision 2, and cases 2, 3, 4, 6 and 17.
- "a page with no other pane keeps one": served by What to build 2 (fourth bullet) and cases 8 and 9.
- "(ruling Additions of 2026-10-09)" and "(ruling D57 pane marks)": served by decisions 1 and 2. Item 14's "in place of VS Code's" needs nothing built beyond What to build 4's text.

Every part is served. The requirements that serve no part of the line keep existing behaviour: the locked-pane bullet (decision 3, from the lock's own rule at docs/window.md:54), "A float is not a page" and "Close pane still removes any pane". All three are consistent with the line.

## Premises

Rerun with `grep -n "^export function\|^function\|^}\|export type KeepRule\|const fresh" layout/tree.ts`, `wc -l`, `sed -n` on each cited range, and `grep -n` in the other files.

These reproduce:
- tree.ts is 541 lines.
- `const fresh` is at 399.
- `layout.svelte.ts:374-382` (comment 374-378, rule 379-382).
- `opening.ts:200` and `:270`, `instances.ts:371`, `workbench.ts:64`, `workbench.ts:49-67`.
- `pages.ts:171` (`withoutTab`), `:211` (`dropInstance`), `:188` (`writeHost`, which the brief gives as 186-202), `:395` (`returnFloat`).
- `model.ts:54-61` (`Pane`), `:243` (`repane`, comment from 237), `:40-53`.
- `saved.ts:366-372`.
- `arrangement.ts:43-50`.
- `config/layout.yml:44` and `:46-47` (Focus).
- `layout/index.ts:63`.
- `docs/window.md:41` holds the quoted sentences.
- `find . -name adr -type d -not -path '*/node_modules/*'` prints nothing.
- `src/lib/state/workbench/layout/` holds 10 items (`ls | wc -l` gives 10).
- `grep -rln "removeTab\|closeInstance\|KeepRule" tests` prints nothing (exit 1).
- G29 is at `guarded.md:74-76` as quoted.

Line ranges that are off by a few lines, which is harmless:
- `KeepRule`: the type is at 168; 163-167 is its comment.
- `removeTab`: the function is 201-216, the brief says 200-213.
- `closeInstance`: 255-259, the brief says 249-253.
- `closePane`: 266-269 with its comment from 261, the brief says 260-263.
- `splitPane`: 392-401 with its comment from 383, the brief says 393-403.

Premises that are wrong:
1. **`nested.ts:169-173`, "`withoutLeaves`: a page leaf whose page went becomes `emptyPane()`".** `withoutLeaves` is called only from `settlePageLeaves` (`nested.ts:231`), and that runs only when a saved layout is read (`saved.ts:563`). It handles a leaf the reader refuses: a page the list does not hold, a page drawing itself, or a loop. A page that is closed at run time goes through `clearPage` (`layout.svelte.ts:545` and `:696`), then `withoutPage`, then `removeNode` (`nested.ts:187-206`). That removes the leaf and gives its space to the neighbour, so no empty pane is left. (Commands: `grep -rn "clearPage\|settlePageLeaves\|withoutLeaves" src`, `sed -n 205,235p nested.ts`, `sed -n 530,548p layout.svelte.ts`.)
2. **The Explorer's left pane holds five views, not four.** `git show HEAD:tools/oculus/config/layout.yml | sed -n 76,83p` prints `- { kind: pane, view: [files, repositories, search, latex, problems] }`. The brief's "Files, Repositories, Search, TeX" matches `docs/window.md:15` and `:41`, which are themselves out of date, but not the config.
3. "Who passes the rule" leaves out `floatTab` (`pages.ts:251-279`, takes `keep` at 255 and hands it to `dropInstance`) and `moveInstance` (`tree.ts:315-338`, passed `keepFor(to)` at `instances.ts:353`). It also leaves out `adoptFloats` (`pages.ts:126-160`), which calls `withoutTab(next, left.id)` on a page's pane with no rule at all.
4. "Where a pane is made" leaves out `floatPane` (`pages.ts:220-242`). It is reached by Float on a pane and by Move into New Window on a pane (`store.ts:85-88` and `114-118`). It rebuilds the page's pane into a float with `repane(found, ...)` at `pages.ts:233`, which will carry the mark into the float.
5. The base copy `.agents/worktrees/D57-base/tools/oculus/` does not exist yet (`ls` reports "No such file or directory"). That is expected before dispatch.

## Cases and checks

Read against `agents/spec.md`.

Cases that are wrong:
- **Case 3** cannot happen as written. Closing the four named views leaves Problems in the pane, so the pane is never emptied. The case should name all five views.
- **Case 18** cannot be run as written. Closing a page leaves no empty pane at its leaf's spot (see premise 1). The only real input is a saved layout whose page leaf the reader refuses. For that input the empty pane is made in `withoutLeaves` and should be marked, since an arrangement never holds a page leaf: `arrangementNodeShape` at `arrangement.ts:62-65` allows only pane and split.
- **Case 4** is underspecified. Its "Today: the second is removed" holds only when both panes' last tabs were views opened for something or Terminal tabs. With tool views (for example the Incoming page's two panes, `config/layout.yml`), `keptPane` already removes the first one today. The case should name a page and its views.

Inconsistencies with the rules file:
- **The landing look** ("runs cases 1 to 5, 12 and 13 on the page") is set on TEST. By `plan.yaml:20` that page is made with New page, so it has no arrangement: its root pane is unmarked and every pane split from it is marked. Cases 2, 3 and 4 (Explorer panes, two arrangement panes) cannot be shown there. Case 1 can only be imitated by opening Focus in TEST's root pane. spec.md:58 and :62 make the look the proof for what only the page shows, so those three cases are left with no on-page proof.
- **"Verify" item 5** and line 7 tell the builder to read against "the standards pages", but `standards: []` (`plan.yaml:8`) names none, so item 5 checks against nothing.
- **"Verify" item 1** leaves out `npm run diagrams` right before `npm run test:quick` (spec.md:25). The spec governs, so this is minor.
- **G31** (`guarded.md:80-82`) also names `src/lib/state/workbench/layout/saved/` as its code, with the test `tests/state/workbench/layout/saved/layout-unread.test.ts`. The brief names only G29. spec.md:57 says a step that touches an entry's code runs that entry's test.

Cases and acceptance items that ask the builder to check or explain a place the step does not change. These are regression checks, and they are allowed:
- case 8: `newPage` and `defaultWorkbench`, `model.ts:267-283`
- case 14: `leaveFloat` and `writeHost`, which are not changed
- case 15: Reset in `layout.svelte.ts` around 660-700, and `arrangement.ts`
- case 16: `settleFocus`, `workbench.ts:28`
- case 19: `closePane` and `removeNode`
- the acceptance item on a close during a drag: `drag.svelte.ts`, which is not on the write list. This one comes from spec.md:69.

## The question

Could each of these pass without the goal being reached?

- **The step line's own check.** The plan line names none. `npm run test:quick` would pass without the goal, because no test covers the rule (`grep -rln "removeTab\|closeInstance\|KeepRule" tests` is empty). The G29 run would pass as well, because it checks that pages and tabs are kept, not the mark.
- **What to build 1 (the mark).** Yes, it could pass. With a layout saved before the step, a pane already split off on Axel's Focus page reads as unmarked. The next project opened from a deadline row lands in that empty pane (`landingFor`, `landing.ts:69-70`), and closing it leaves the pane empty again. Axel's case would then not be fixed on his own page until one Close pane. Axel ruled this cost acceptable (`plan.md:1608`, D57-1 (a)), so it is not open. The report should still state it in the before and after section, so the look is not read as a failure. Whether Axel's saved Focus page holds such a pane is not verified: the layout is in browser storage, which I did not read.
- **What to build 2 (the rule).** Yes, it could pass at unit level. The case runs are listed over `removeTab`, `closeInstance`, `splitWith`, `returnFloat` and the saved reader, and none of those makes the pane in Axel's case: `openOpened` then `landingFor` then `splitPane` (`opening.ts:270`). A scratch run on a hand-built `added: true` pane passes even if the panes made at run time are never marked. Case 1's run should make its pane through `splitPane`, or through the store's `openView('project', ...)` on a tree holding only Focus. It should not be built by hand.
- **What to build 3 (where it reaches).** Yes, it could pass. "Every caller listed passes it as before" leaves out `adoptFloats` (no rule), `floatTab` and `windowTab` (rule through `store.ts:103` and `:122`), and `floatPane` (mark carried into a float). Those paths could keep or drop panes against the rule and the item would still read as met.
- **What to build 4 (the text).** Yes, it could pass. Its list of run-time panes ("opening a view with no pane to land in, Open to the Side, a drop on an edge, Return to Page") leaves out:
  - the menu and key splits (Split Right, Split Down, Split Up, Split Left and Split & Move, through `splitInstance` and `splitWith` at `PaneView.svelte:410-411` and `tab-menu-state.svelte.ts:168`);
  - a tab dropped on the edge of a pane of another page or a float (`instances.ts:371`);
  - the Views catalogue's `openNextTo` and `openAway` (`open/away.ts`).
  A text written to that list is true and still incomplete. It also leaves out `registry.ts:203-204`.
- **Each case:**
  - Case 1: yes, if the pane is built by hand (see What to build 2). The look on TEST imitates the case without the Focus rail page.
  - Case 3: it cannot pass as written (Problems).
  - Case 18: it cannot be run as written.
  - Cases 2 and 4: they need an arrangement, so at unit level they pass only on a hand-built unmarked tree. That is fine for "unchanged", but the TEST look cannot show them.
  - Cases 5 to 17 and 19: no. Each exercises a specific mark and rule outcome through the real function named.

## Implied inputs

Inputs the step implies but does not state. Each is checked against the code; the expected result comes from the rule and the ruling.

1. **Move into New Window on a tab, and an Alt-drag of a tab into a float** (`windowTab` and `floatTab`, then `dropInstance`, then `withoutTab` with the rule; `store.ts:103` and `:120-122`, `drag.svelte.ts:198` and `:209`). This has happened, and it is a common path. It is missing from the cases. Expected: the last tab of a marked pane removes the pane; the last tab of an arrangement pane leaves it empty (a terminals pane after a Terminal tab).
2. **Float and Move into New Window on a whole pane** (`floatPane`, `pages.ts:220-242`). `closePane` removes the pane from the page, and `repane(found, ...)` at :233 carries every pane field, so the mark would ride into the float and be saved with it (`checkFloatPane` reads it back through `readTree`, `saved.ts:469`). This is missing from the cases and from "What is on the tree". The acceptance item "A float's pane carries no mark" requires a change here without naming the place, and `floatPane` is not in the Read list. Expected: the float's pane carries no mark. Return to Page then marks it (case 13), and the page's only pane, if floated, leaves one unmarked empty pane.
3. **Copy into New Window** (`copyTab`, `pages.ts:281-298`). Expected: the source pane is untouched, and the new float has no mark.
4. **`adoptFloats` on a layout saved before floats** (`pages.ts:126-160`, `withoutTab` with no rule). Today a page pane emptied this way is removed. Expected under the ruling: an arrangement pane stays. The cost is low and applies only to old layouts, but the brief should say which outcome is wanted.
5. **Split from the menus and keys** (`splitInstance` then `splitWith` then `splitPane`): Split Right, Split Down, Split Up, Split Left, Split & Move, and the `split_right` and `split_down` keys. Expected: the new pane is marked and closes with its last tab. No case covers them; case 5 uses the same function through a drop.
6. **A tab of a float or of another page dropped on a page pane's edge** (`instances.ts:368-372`, `carryToPage` with `splitPane`). Expected: the new pane is marked, and the source float is removed if that was its last tab.
7. **The Views catalogue opening a view beside itself** (`open/away.ts`, `openNextTo` and `openAway`, through `splitInstance`). Expected: the pane split off is marked and closes with its last tab. Today it closes only for a tool view, and stays as a documents pane for an opened view.
8. **A drag back onto another pane of the same page** (`moveInstance`, `tree.ts:315-338`), which case 5 uses. Lines 309-360 are not in the Read list (it gives 140-280 and 380-430).
9. **A saved layout with a page leaf the reader refuses** (the only real input to `withoutLeaves`). Expected: a marked empty pane, which closes with its next tab. This is the runnable form of case 18.
10. **Unlocking an empty, locked, marked pane.** Expected: it stays empty and marked until a tab lands in it and leaves, then it is removed. The cost is low.
11. **A tab-close question** (G28): closing the last tab of a pane holding unsaved text asks first, and after Yes the close goes through `closeInstance` and the rule. Expected: unchanged. `tests/state/client/terminal/terminal-close.test.ts:125-139` drives `splitInstance`, `transferInstance` and `moveInstanceToPage` through these paths; it asserts only terminal stops, so the mark does not affect it.

Places that make or rebuild a pane, all checked:
- `kind: 'pane'`: `tree.ts:194` and `:399`, `model.ts:195`, `:244` and `:269`, `saved/fold.ts:35`, `saved/saved.ts:366`, `pages.ts:270` and `:294`, `arrangement.ts:49` and `:123`, `layout.svelte.ts:91`, `Present.svelte:134`.
- `emptyPane(`: `nested.ts:172`, `arrangement.ts:49`, `model.ts:263`, `tree.ts:149`, `:159`, `:160`, `:181` and `:189`.
- `repane(`: `tree.ts:213`, `:247`, `:280`, `:296`, `:306`, `:332` and `:356`; `pinned.ts:28` and `:45`; `preview.ts:58` and `:70`; `pages.ts:112`, `:153`, `:233` and `:345`.
- `setLocked` (`tree.ts:377`, spreads the pane) and `migrate.ts:39` (spreads) carry the mark.
- Only `pages.ts:233` needs a change that the brief does not name.

## ADRs

`find . -name adr -type d -not -path '*/node_modules/*'` (from the repository root) prints nothing, and `.agents/plan.yaml` has no adr key (`cat -n .agents/plan.yaml`, lines 1-22). There is none.

## Dictated text

The brief dictates no paragraph word for word. What to build 4 dictates the content of the docs/window.md sentences, not their wording; its gap is under The question. The lines it does dictate:

- Line 129: `` `added?: true` `` and "a pane added while the page was used, which the page's arrangement did not define". Found with `grep -n 'a pane added while the page was used' agents/briefs/D57.md`, which gives 129. Holds: ASCII, none of the history words spec.md:42 bans, and plain. The field name is the brief's own choice, not from the ruling (see Names).
- Line 178: "Everything in the brief is done". Found with `grep -n 'Everything in the brief is done' agents/briefs/D57.md`, which gives 178. Holds; it is spec.md:80's own phrase.
- Line 182: "no glossary". Found with `grep -n '"no glossary"' agents/briefs/D57.md`, which gives 182. Holds: `ls tools/oculus/docs` lists no glossary.md.
- Line 184: "still true" or "rewritten". Found with `grep -n '"still true" or "rewritten"' agents/briefs/D57.md`, which gives 184. Holds; these are spec.md:68's own words.
- Line 131 quotes docs/window.md:54, "keeps its place when its last tab closes, so only Close pane removes it". Holds; it is present at line 54.

`LC_ALL=C grep -n '[^ -~]' agents/briefs/D57.md` prints nothing, so the brief is ASCII.

## Declined to judge

- Whether Axel's saved Focus page actually holds a pane left empty from before the step. The layout is in browser storage, and reading it would need a browser, which this check may not start.
- Whether `npm run test:quick` picks up `layout-saved.test.ts` and `layout-unread.test.ts` without being told. I did not run it: the brief check runs no suite.
- The ordering against D49. D49 removes `docs/window.md` and comes before D57 in the ledger (`plan.md:705` and `:713`), so if D49 lands first, What to build 4 and the write-list line `docs/window.md line 41` go stale. D49 is not in flight (`grep -n "step:" orchestrator-state.md` shows only D41), so this is not a premise at this head, only an ordering point for the orchestrator.

Usage: brief-check agent for D57. Its agent id is not shown to this session.

## Closed

The G29 line under "What is on the tree", the G29 run under "Verify" item 2 and the rulings in decisions 1 and 2 were written while the check ran, so the check may not have seen them at its start; it re-read the brief and reports on that text. Each finding, and what changed:

- Names, `registry.ts:203-204`: the comment is added to "What is on the tree" and to the paths, with its line range.
- Names, the comments of `closePane` (`tree.ts:261-265`), `repane` (`model.ts:237-242`), `saved.ts:18-20`, `workbench.ts:42`, `nested.ts:168` and `:209`: listed under "What is on the tree", each marked in the report.
- Names, the field name `added` is the brief's own choice: decision 1 keeps it and says the ruling gave no name; it is an internal key of the browser-saved layout.
- Premises, line ranges of `KeepRule`, `removeTab`, `closeInstance`, `closePane`, `splitPane`: corrected.
- Premise 1, `withoutLeaves` reached only by a saved layout's refused page leaf: corrected under "What is on the tree", in item 1 and in case 18.
- Premise 2, the Explorer's left pane holds five views: case 3 names all five; `docs/window.md:15` is added to the paths and to item 4.
- Premises 3 and 4, `floatTab`, `moveInstance`, `adoptFloats` and `floatPane`: added under "What is on the tree", in items 1 to 3, the Read list and cases 20 to 23.
- Premise 5, the base copy: made at the preparation, before dispatch.
- Case 3: names five views. Case 4: names the Explorer page and its views. Case 18: rewritten as the saved layout's refused page leaf.
- The landing look: cases 1 to 4 run on a scratch oculus with rail pages made from their arrangements, cases 5, 12 and 13 on TEST.
- Verify item 5 named standards pages the configuration does not list: it reads against `agents/spec.md`'s prose rules. Item 1 runs `npm run diagrams` first. Item 2 runs G31's and G28's tests with G29's.
- The question, What to build 1 and 2 passing on a hand-built pane: a case's pane is made by the function that makes it in the product, never by hand.
- The question, What to build 3 and 4 incomplete: the callers and the run-time panes the check listed are named in items 3 and 4, and cases 24 to 26 cover them.
- Implied inputs 1 to 11: cases 20 to 28, case 5 (`moveInstance`, with its lines added to the Read list) and case 18.
- Declined to judge, the order against D49: D49 removes `docs/window.md` and is not in flight; D49's brief carries the text D57 writes there.
