# Step D53 brief check (on main at 3bad11b90)

This is the report of the fresh agent from the `spec` skill's "Steps / The brief check", run on `agents/briefs/D53.md` as it stands on disk (uncommitted, 185 lines, `wc -l`). I changed nothing anywhere.

On the plan's Goal: plan.md has no Goal heading (`grep -n -i "goal" plan.md` finds only lines 320 and 775). Its header says "Execution ledger for `tools/oculus/DESIGN.md`". So the goal this step delivers is taken to be the step line: the ten views are held once, and opening one goes to its holder instead of making a copy.

## 1. Names

- **`createOpening`, `createAway`.** `grep -rnE "createOpening|createAway" src tests docs HELP.md DESIGN.md README.md config --exclude=local.yml`, outside the write paths: only `src/lib/state/workbench/layout/index.ts:116` and `:119` (re-exports). They stay true. No test calls either.
- **`registerOpened`.** `DESIGN.md:480` says "The rule reads the registry through `registerOpened` ...". It stays true, and the step adds its own bullet after it.
- **`copiesToWindow`.** `src/lib/shell/panes/strip/tab-menu-state.svelte.ts:88` (`copyable: layout.copiesToWindow(found.id)`) stays true. But `docs/window.md:54` says "in the app, Move into New Window and Copy into New Window (a Terminal tab offers no copy)". After item 5 this is false by omission, because a unique view's tab also offers no copy. Line 54 is not among the paths (only line 21 and a paragraph after 33).
- **`openSettings`.** The other hits are a different function of the same name: `src/lib/data/sources/config/settings.ts:318` and its callers `server/root/context.ts`, `routes/api/(files)/open/+server.ts` and `tests/data/sources/config/settings.test.ts`. Not affected.
- **`openRailPage`, `startOnRailPage`, `keepDefaultPage`, `adoptFloats`.** Callers are `src/lib/shell/Workbench.svelte:246,258-260`, `shell/rail/RailPages.svelte:170` and `views/system/workbench/Catalogue.svelte:109`. Their signatures are unchanged, so these stay true.
- **`resetPage`, `resetPages`.** These hits are made false:
  - `src/lib/views/system/workbench/PagesReset.svelte:2-11`, the head comment ("every saved page ... is made again from that button's arrangement ... the floats held are replaced by the ones the config ships"). It becomes false when a held unique view is left out, or when a shipped float is not made.
  - `config/text/views/system/workbench.yml:106`, `reset_all_tip`, which the reader sees: "Rebuild every rail page from its arrangement ... The floats are replaced by the ones the config ships." Same reason.

  `Pages.svelte:101,169` is a caller only, so it stays true.
- **`openPage`.** `src/lib/state/workbench/layout/model.ts:142` says "The view a fresh page starts on." (`MAIN_VIEW`). After item 4 a New page starts empty when Status is held elsewhere, so the comment becomes partly false. `model.ts` is not in the paths. The `openPage` hits in `views/shared/explorer/opening.ts`, `card.ts`, `CardDocs`, `EntryCard` and `Lanes` are another function.
- **`Registration`.** `grep -rnE "Registration\b|ViewRegistration" docs DESIGN.md HELP.md README.md`:
  - `DESIGN.md:324` ("`Registration` has two optional fields, `words` and `glyphName`"). This is the apps section naming the fields apps added, and it is already loose about `listed`, `badge` and the rest, so the step does not make it more false.
  - `DESIGN.md:397` and `docs/apps.md:453-457` (app `open({view})` "opens a tab"). These already mean activate-or-open, so they stay true.
  - `src/routes/views.ts`: `registerComponent` copies the whole registration by spread (`registry.ts:193`), so a `unique` field reaches the registry.
- **`unique`.** Hits are other senses of the word (`RailPages.svelte:175`, `feeds/idents.ts` and others). No collision.
- **Guarded entries** (`grep -n "<path>" agents/guarded.md` for each write path). G28's Code line (`agents/guarded.md:60`) names three files this step writes: `src/lib/views/system/workbench/Pages.svelte`, `src/lib/shell/rail/ActivityRail.svelte` and `src/lib/state/client/context.ts`. So the brief's sentence "No entry of `agents/guarded.md` covers opening a view or the registration" is true of the behaviour but leaves out G28.
  - The rules file says "A step whose change touches an entry's code runs that entry's test."
  - G28's tests are not in the verify list. They include `tests/shell/panes/strip/tab-menu.test.ts` (the tab menu that item 5 changes), `tests/state/client/terminal/terminal-close.test.ts` ('ends no terminal when it moves to another pane, to another page, or is split', which calls `openPage`) and `tests/state/workbench/navigation/pages.test.ts`.
- **G54** (`agents/guarded.md:188`): "Every page arrangement ... parses, so every rail page opens what its arrangement names." Item 4 makes the clause after "so" false: a rail page made while another page holds a unique view does not open every view its arrangement names. The brief calls G54 "untouched".

Findings:
1. `docs/window.md:54` ("a Terminal tab offers no copy") is made false and is outside the paths.
2. `PagesReset.svelte:2-11` and `config/text/views/system/workbench.yml:106` (`reset_all_tip`) are made false and are outside the paths.
3. `layout/model.ts:142` is made partly false and is outside the paths.
4. G28's Code line names three written files. The brief says no guarded entry applies and does not ask for G28's tests to be run.
5. G54's guarantee text is contradicted by item 4. Its wording is the orchestrator's or the user's to change; the builder cannot touch it.

## 2. The step line

- "Settings, Focus, Usage, HPC, Audit, Findings, History, Processes, Pages and Status are marked unique in their registration": item 1.
- "opening one goes to the page or float that holds it instead of making a copy": items 3, 6 and 7 (opening), items 4 and 5 (no copy by a build or by Copy into New Window), and item 2 (the rule reaching the layout).
- "Files, Search, Terminal and the session views are never unique": item 1's last sentence and case 8.
- "before D56", "(ruling D53 before D56)": the brief's "The plan line and the rulings" paragraph leaves the workbench rule to D56. No requirement is needed.

Findings: none.

## 3. Premises

Every fact below was checked on main at 3bad11b90. `git status --short tools/oculus/src` is clean.

- **ADRs.** `find . -name adr -type d -not -path '*/node_modules/*'` prints nothing, and `ls docs/adr tools/oculus/docs/adr` gives "No such file". plan.yaml has no `adr` key. Matches.
- **Base copy.** `ls .agents/worktrees/D53-base/tools/oculus` gives "No such file or directory". This is expected: the base is created after the preparation commit (`spec` Steps 6 to 8). The base will be that commit, not 3bad11b90.
- **The ten registrations.** `awk '/<script module/,/<\/script>/'` with grep shows every id line as the brief says: status 5, audit 6, pages 5, settings 5, findings 5, processes 6, usage 8, hpc 6, history 7, focus 5. Matches.
- **`registry.ts`.** `git show HEAD:.../registry.ts | grep -n` prints `76:export type Registration`, `101: listed?: boolean;`, `123:};` and `126:export type ViewRegistration`. The brief says 76-121, 99 and 124. Mismatch.
- **`opening.ts`.** `wc -l` gives 321, which matches. The line numbers do not:

  | Item | Brief says | Tree has |
  |---|---|---|
  | `createOpening` | 55-60 | 56-61 |
  | `openView` comment | 61-77 | 62-78 |
  | `openBeside` comment | 82-89 | 83-90 |
  | `openInPane` | 96-103 | 99-106 |
  | `openInto` | 125-203 | 113-204 |
  | float branch | 136-142 | 124-131 |
  | focused or page activate | 149-166 | 135-156 |
  | `findIn` | 151-153 | defined 316-318, used at 141 |
  | `openOpened` comment | 205-209 | 206-211 |
  | `openOpened` | 210-277 | 212-275 |
  | `restore(bench)` | 228 | 231 |
  | `findInFloats` | 280-290 | 277-287 |

  The head comment (1-10) and the behaviour described all match.
- **`instance.ts`.** `isInstanceOf` 144-147 and `findView` 154-160 match.
- **`layout.svelte.ts`.** It is 823 lines, as the brief says.
  - These match: `registerOpened` 372, 385 and 817-819; `copiesToWindow` 761; `openRailPage` 425-448; `startOnRailPage` 455-466; `keepDefaultPage` 469-473; `adoptFloats` 480-484; `closePage` 520-; `defaultPages` at 688.
  - `openPage` is 494-496 (the brief says 495-497), and `resetPage` is 643-657 (the brief says 643-660).
- **`model.ts`.** `MAIN_VIEW` at 143 and the defaults at 280-289 match.
- **`context.ts:762`** matches.
- **`nested.ts`.** `drawnBy` is 78-89 (the brief says 78-90, where line 90 is blank). Effectively a match.
- **Openers.** `grep -rnE "open(View|Beside|Away|NextTo|InPane)\(" src/lib` filtered to the ten ids and constants prints exactly the brief's list. Matches. `openInPane` callers `show.ts:94`, `new-text-file.ts:31` and `context.ts:375` match.
- **`away.ts`.** `openNextTo` is 42-57 (the brief says 41-56) and `openAway` is 59-80 (the brief says 58-80). The comments 1-6, 21-24 and 49-51 match.
- **`drag.svelte.ts`.** 345-346 and 360-373 match. The behaviour of a drop of a float-held view also matches, since `transferInstance` carries across hosts (`instances.ts:349-366`).
- **`tab-menu.ts:173`, `float/pages.ts:283` `copyTab`, `instances.ts:369` `splitInstance`, `floatsFrom` 103.** All match.
- **`adoptFloats`.** The brief says only "the shipped floats taken into pages saved before floats". `open/float/pages.ts:120-161` shows it moves the first page-held tab of each shipped-float view into the float, keeping its id, and removes every other tab of that view from every page (lines 142-148, `withoutTab`). So today it already makes no copy, and it drops tabs on load. The brief omits this. It contradicts item 4 (which says adoptFloats "leaves out" a held view, so the page keeps it and the float lacks it) and item 8 ("nothing is closed or dropped on load").
- **`config/layout.yml`.** The lines 47, 100, 105, 106 and 113 match.
- **Folder counts.** `ls | wc -l` of `layout/` and `layout/open/` gives 10 each. Matches.
- **Text grep.** The brief's own command also prints `docs/window.md:41` ("A tab of that document already open anywhere on the page ...", opened views, stays true) and `docs/window.md:59` (unrelated). The brief's list omits both, which is harmless. It also does not catch `docs/window.md:54` (see Names).
- **`DESIGN.md:480`** matches. **`docs/window.md` 31-37** is the Pages section, which matches.
- **Guarded grep.** `grep -n "opening.ts\|registry.ts\|layout.svelte" agents/guarded.md` prints only line 84, as the brief says. But the claim it supports misses G28 (see Names).
- **Decision 1's reason.** It says "the registry's head comment rules out" view knowledge in the layout. The head comment (`registry.ts:1-12`) speaks of shell modules and views only. The statement that the layout store never imports the registry is `DESIGN.md:480`. The reason is miscited.

Findings:
1. The line numbers in `registry.ts` and in most of `opening.ts` and `away.ts` differ from the tree, as listed above.
2. The `adoptFloats` premise is incomplete, and items 4 and 8 contradict its current move-and-drop behaviour. The brief needs to say whether adoptFloats is changed for unique views or left as it is (it already makes no copy).
3. The "no guarded entry" premise misses G28.
4. Decision 1's cited source does not say what the brief attributes to it.
5. The base copy is not yet staged. This is expected, not a defect.

## 4. Cases and checks

- **Cases intro, "No case becomes a test".**
  - The result (no new test) holds under the rules file's test rule. That rule is "A test exists only as the test of one entry of `agents/guarded.md` ... A step that needs a new entry stops and asks Axel", and guarded.md says "Views have no entry".
  - The reason the brief gives ("a second copy of a view loses nothing a reader made, so by the rules file's test rule") is the cost criterion of the hub CLAUDE.md, not the rules file's text.
  - The same rule requires G28's tests to run, because the step touches G28's code. The brief does not ask for this.
- **"Driving the layout store as `tests/state/workbench/layout/` does".** That folder holds `armed-keep.client.test.ts`, `layout-fixture.ts` and `saved/`. The files that actually drive the store through `createClientState` are `saved/layout-unread.test.ts` and `tests/state/client/terminal/terminal-close.test.ts`. The pointer is loose but workable.
- **Case 1.** "the page on screen is Page 1". The default Page 1 (`defaultPages`, `model.ts:306`) holds a Status tab itself, which `openView` would activate. The setup must say Page 1 holds no Status.
- **Case 17.** Move into New Window and Copy into New Window are offered only in the app (`tab-menu-state.svelte.ts:87`, `windows: deps.client.desktop !== undefined`).
  - The case does not say "in the app".
  - The landing look runs case 17 "on a scratch oculus", which in a browser shows neither item, so the expected "Move into New Window is offered" cannot be seen there.
- **Cases 2-16, 18-20.** Each is consistent with the rules file. The builder runs no page, and the look is the orchestrator's.
- **No case asks the builder to explain a place the step does not change.** Case 17's Files tab reads `tab-menu.ts`, which is unchanged, but its input `copiesToWindow` is changed.

Findings:
1. Case 1's setup is ambiguous.
2. Case 17 and its look need the desktop app.
3. The test-rule reason is miscited, and G28's tests are not asked for (see Names).

## 5. The question

- **Item 1** (the mark): alone, yes, since a field nobody reads passes a grep. It is paired with items 2 and 3, so no finding.
- **Item 2** (the rule reaching the layout): checked by reading; it serves cases 1-20.
- **Item 3** (opening):
  - Cases 1, 3, 4, 5, 9, 19 and 20 fail on the unchanged tree, so no.
  - Case 6 first half (the rail with Settings on the System page): yes, it passes today, because `openSettings` already switches to the rail page holding Settings (`ActivityRail.svelte:165-169`). The second half (the language settings, `palette-source.svelte.ts:96`, opening on `currentPage()`) fails today, so case 6 as a whole is a goal case.
- **Cases 2, 7, 8, 15, case 13's second half and case 18:** yes, by design. They are regression guards that hold on the unchanged tree, and each is paired with a goal case. No finding.
- **Item 4** (builds):
  - Cases 11, 12, 13 first half, 14 and 16 fail today, so no.
  - `adoptFloats` has no case. Its check could pass with adoptFloats wrong or unchanged.
- **Item 5, case 17:** yes. If checked by calling `tabMenu({ windows: true, copyable: false, ... })` with `copyable` set by hand, it passes without `copiesToWindow` changing. The check must go through `layout.copiesToWindow(id)` of a Settings instance. The look cannot show it in a browser (section 4).
- **Item 6, case 10:** no, if "Page 1 stays on screen" is asserted. Today's sink would switch pages after the change, so the case catches it. `createDrag`'s `end()` needs `window`, so the scratch run will likely replay the sink's calls, and the look covers it.
- **Item 7, case 20:** no.
- **Item 8, case 18:** yes. Both halves hold on the unchanged tree. It is a guard, not a goal check.
- **Item 9:** reading; a sentence left false is found by the rules file's re-read.
- **Item 10:** commands.
- **Verify 2** (`npx vitest run tests/state/workbench/layout`): yes. It runs only the armed-keep and saved-layout tests, which exercise no opening and no build. It is a regression check of G29 only.
- **The step line's check** (the landing look, cases 1, 3, 10, 11, 12 and 17): no for 1, 3, 10, 11 and 12. Case 17 in a browser shows nothing.

Findings:
1. Case 17 can pass without the goal, or cannot be seen, as described.
2. `adoptFloats` has no case.

## 6. Implied inputs

This is a code step.

- **Openers that all go through `openView`.** Covered by item 3, and no separate case is needed for:
  - the keys (`shell/keys/workbench-keys.svelte.ts:201` chords, `keys.ts:204`);
  - the palette (`palette-open.ts:62`, `Palette.svelte:300`);
  - apps (`apps.svelte.ts:315`, `methods.ts:273`);
  - Markdown links (`Markdown.svelte:107`) and `card.ts:72` `goto`;
  - notices (`notice-sources.ts:258,271`);
  - the desktop menu and Cmd+, (`desktop-windows.svelte.ts:67`).
- **Missing: a catalogue click or shift-click on a unique view held on the catalogue's own page.** This is the shipped arrangement: seven of the ten sit on the System page with the catalogue. `Catalogue.svelte:101-118` (`showTarget` then `openView`/`openBeside`) first switches to the previous page, or builds the first rail page through `openRailPage`, and only then opens. After item 3 the open switches back.
  - Expected result: the System page stays or returns on screen with that tab active; no copy on the previous page; and the brief states whether the switch away and back, which runs `forgetTouched`, is acceptable.
  - This happens on every such click.
  - `Catalogue.svelte` is not in the Read list.
- **Missing: a catalogue entry of a unique view held on another page or a float, dropped onto the catalogue's own pane.** `drag.svelte.ts:363-365` sends this to `sink.away` (`openAway`). Item 3 says `openAway` goes to the holder and switches page. Item 6 says a drop moves the one instance to the pane and the page stays.
  - Expected result: one of the two, stated. The `docs/window.md:21` sentence "A drop on the catalogue's own pane goes to another pane" follows that choice.
- **Missing: `adoptFloats` on an envelope saved before floats, where a page holds Usage or HPC (or two copies).** Expected result: state whether the page's tab still moves into the float and the others are dropped, as today, or the float is made without it and the page keeps it.
- **Missing: the host is a float.** The keyboard focus is in the shipped float (HPC), so `attention.touched()` returns the float, and the reader presses the status bar's Status while the System page holds Status. Today `openInto` opens a new Status as a tab of the float (`opening.ts:125-131` finds none, then `findView` on the float's layout finds none, then a new instance).
  - Expected result after the step: the System page's Status is activated.
  - Item 3's "the page on screen or the page asked for" does not say what "drawn on" means when the page asked for is a float.
- **Case 17 in the app, and the browser where neither item shows.** Listed under Cases but without "in the app"; see section 4.
- **Minor: one arrangement naming a unique view twice** (a pane list `[status, status]`, possible through the hub's config). Item 4 compares a build only against other pages and "what it built before it", not within one tree. Expected result: one instance. Low cost.
- **Covered by item 3's general rule** and not separately needed: a float placed in a window of its own (desktop or `/?float=`), since activating there is today's float behaviour, and a page drawn by a leaf on a page not on screen.

Findings:
1. The catalogue click on a unique view the catalogue's page holds is missing.
2. The drop onto the catalogue's own pane is missing, and items 3 and 6 contradict each other on it.
3. `adoptFloats` is missing.
4. The opener with a float as the host is missing.
5. Minor: one arrangement naming a unique view twice is missing.

## 7. ADRs

- No record. `.agents/plan.yaml` has no `adr` key, `ls docs/adr tools/oculus/docs/adr` gives "No such file or directory", and `find . -name adr -type d -not -path '*/node_modules/*'` prints nothing. The brief says the same.

Findings: none.

## 8. Dictated text

The ASCII check `LC_ALL=C grep -n '[^ -~]' D53.md` prints nothing.

- **`unique?: boolean`.** `grep -n "unique?: boolean" D53.md` finds lines 59 and 128. Holds.
- **`unique: true`.** `grep -n "unique: true" D53.md` finds line 59. Holds.
- **`registerUnique((view) => registry.viewFor(view)?.unique === true)`.** `grep -n` finds line 61. Holds, as a code line read whole.
- **The comment's content**, given after a colon at line 59: "the view is held once over every page and float, and opening it goes to where it is held". Read as prose, it is plain and ASCII and has no history words. But "is held once" is not true of what item 8 keeps (a layout saved with two instances) or of what a reader can still make by a drag. Under the rules file's "What every package obeys", a sentence that is false is a defect. Wording such as "no opener and no build makes a second instance, and opening it goes to an instance already held" states what the code guarantees.
- **"no glossary".** `grep -n '"no glossary"' D53.md` finds line 180, the report text. Holds; `ls tools/oculus/docs` shows no glossary.

Findings:
1. The comment content dictated at line 59 states "held once", which items 8 and 6 do not guarantee.

## Further findings outside the eight checks

- **Paths listed several to a line.** "Paths this step writes" says "One path per line" (brief line 124; `spec` SKILL.md Steps 4: "every path the step writes, one per line"). Yet line 111 lists ten paths, nine of them shortened to `views/...`, and lines 112 and 114 list two and three. This hampers the orchestrator's path comparison and diff check.
- **`docs/window.md:21` has more sentences made false than item 9 names.** Item 9 names two sentences of the paragraph. "Open on this page, which opens it in another pane of that page" and "A drop on the catalogue's own pane goes to another pane" also become false for a unique view held elsewhere.

## Declined to judge

- **Whether decisions 2 to 5 of the brief need the user's ruling before dispatch.** These are the search order across pages, a build leaving a view out instead of taking it, a catalogue drop moving the one instance, and two saved copies kept. Each is visible to the reader, and the step line and the rulings do not name them. The state file's configuration block has no `self_rule` (`grep -n self_rule orchestrator-state.md .agents/plan.yaml` prints nothing). Whether these follow from "opening one goes to the page or float that holds it instead of making a copy" or need a stop is the orchestrator's and the user's call.
- **Overlap of `docs/window.md` with D49**, whose line removes that guide. Comparing paths with steps in flight is `spec` Steps 5, the orchestrator's.
- **Whether `config/local.yml` overrides an arrangement to name a unique view twice.** Not read, under the hard limits.

Agent usage: a12465afebb34bf1c, claude-opus-5-5, 254,223 tokens, 79 tool uses, 12.0 min.
