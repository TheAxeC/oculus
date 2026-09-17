## Closure audit, 2026-09-17
Reports read: 38. Findings judged: 967. Dropped as not findings: 62.

Counting method, so the numbers can be rechecked: 624 top-level finding bullets across the 18 refuter reports (the 15 step refuters, plus `M2-refuter.md`, `D16-refuter3.md`, `Q33-refuter3.md`) in their Spec / Proof / Standards / Behaviour / "the look" / "repair round, refuted" / "second review's findings" sections, plus 405 bullets in the builder reports' Limitations, Sharp edges, Decisions, Premise-found-wrong, Not-covered and Known-limits sections, plus the 3 landing reports and `recurring-2026-09-17.md`. 62 of the refuter bullets say "none", "no finding", "no defect found" or "reproduced, nothing to change" and are dropped. `D16-refuter.md`, `D16-refuter2.md`, `Q33-refuter.md` and `Q33-refuter2.md` were read through `D16-refuter3.md:3-18` and `Q33-refuter3.md:9-27`, which itemise and dispose of every finding of the earlier two rounds; `M2-report.md`, `D16-report.md` and `Q33-report.md` were not opened.

### Neither fixed nor booked

- Q39, `agents/reviews/Q39-refuter.md:59,80`: `rest` in `tests/browser/pages.spec.ts` repeats `edge` of `tests/browser/shell-defects.spec.ts`, same 1 px slack; the closure left a shared helper "for Q38, which redraws the tab and page strips and rewrites those cases". Tree: `tests/browser/pages.spec.ts:149` still declares its own `rest` and `tests/browser/shell-defects.spec.ts:384` its own `edge`, with the same `onStart` / `atEnd` body; Q38's diff did not touch either, and no step or open item names it.
- Q37, `agents/reviews/Q37-report.md:53`: "An empty or unknown tone in `focus_lane_tones` gives an undefined `--c--band`, so that header gets no fill." Tree: `src/lib/views/focus/LaneHead.svelte:25` builds `--lane: var(--c-${tone}-lane); --lane-txt: var(--c-${tone}-lane-txt)` with no fallback, so a header whose tone is unknown still paints nothing.
- Q34, `agents/reviews/Q34-refuter.md:251`: "the browser case writes a project only, so the entry card's `overflow-wrap` is not proven by a test; noted, not fixed." Tree: `src/lib/views/collection/EntryCard.svelte:420` carries the rule; `tests/browser/cards.spec.ts:480` writes a project manifest and reads a `.cards .slot` project card only.
- Q34, `agents/reviews/Q34-report.md:280`: "The Memories alt text stays shown for a picture that failed and is later replaced under the same name, until the view is reopened." Tree: `src/lib/views/Memories.svelte:56` `arrived` is per-mount `$state` keyed by name, written only by `onerror` at `:213`; nothing clears it when the listing changes.
- Q34, `agents/reviews/Q34-report.md:126`: "Map label boxes are measured again only when the node set or a label changes. A text-scale change keeps the old boxes until then." Tree: `src/lib/views/map/Graph.svelte:128-131`, the `$effect` reads the node set and the words and nothing else.
- Q34, `agents/reviews/Q34-report.md:124`: "Hover reveal matches any ancestor with the class `.card`." Tree: `src/lib/views/shared/CardActions.svelte:215` `:global(.card:hover) .act`.
- Q31, `agents/reviews/Q31-refuter.md:107` and `Q31-report.md:185`: "Every keystroke in any in-pane entry form rewrites the whole ui record to localStorage. Not measured." Still unmeasured; no step or open item covers it.
- Q31, `agents/reviews/Q31-report.md:61`: "Two add forms in one view share a draft."
- Q31, `agents/reviews/Q31-report.md:63`: "Manifest draft for a vanished project: the close question counts any edit with words in it as unsaved."
- Q43, `agents/reviews/Q43-refuter.md:182,212`: the `registerUnsaved` reporter repeats the layout store's private `holding` + `findInstance` lookup; "noted, `state/layout*` outside the step". Tree: `src/lib/state/context.ts:147-150` still walks `layout.pages().flatMap((page) => findInstance(page.workbench.root, id) ?? [])`.
- Q43, `agents/reviews/Q43-refuter.md:176,211`: the `{#key `${instance.id} ${view.opening}`}` over instance and opening changes no measured behaviour and no test covers those two parts; "noted".
- Q43, `agents/reviews/Q43-report.md:69`: "The refusal and outcome lines (`note`, `said`) stay component state and are gone after a switch."
- Q43, `agents/reviews/Q43-refuter.md:69`: the DESIGN.md decision line ending "Package Q31." is history in a design line. Tree: `DESIGN.md:333` still ends that way; 32 decision lines carry a package id, so the point is about the document's convention rather than one line.
- Q38, `agents/reviews/Q38-refuter.md:110`: "`tokens.css:95-106` claims 'VS Code's editor tab defaults' for `--tab-pad` 10, `--tab-icon-gap` 6, `--tab-actions` 28 and `--tab-close` 20. I did not check them against VS Code's source." Neither review nor landing verified them since.
- D16, `agents/reviews/D16-refuter3.md:14`: "File view close while an open is in flight: OPEN. It is still not exercised." Tree: `src/lib/views/shared/ProgramButton.svelte:36-44` guards a superseded press with a per-component counter; nothing exercises the unmount path.
- D16, `agents/reviews/D16-refuter3.md:15`: "`runs()` fail-closed catch unpinned: OPEN, stated" (the matching catch in `mayOpen` is reported as an audit). Round 4's Closed list does not name it.
- Q32, `agents/reviews/Q32-report.md:351-356`: four sharp edges left after the repair round, none of them ruled or booked: rows still span the full pane width so the right-edge controls and counts sit far from the name; the picker is still a bordered `Menu` button; a row's tooltip no longer describes the row to a screen reader (no `aria-describedby`, since the Tooltip sits inside the button); row controls stay invisible but pressable on a touch screen. Tree: `src/lib/ui/TreeItem.svelte:219-227`, `.item` has `min-width: 0` and no `max-width`.
- D22, `agents/reviews/D22-report.md:64,236`: "Keyboard focus stays on the card control that was pressed; it does not move to the row", and it is not tested with the keyboard.
- D22, `agents/reviews/D22-report.md:239`: "Terminal themes. Drawing the `[@]` stand-in in a terminal theme is not checked."
- Q30, `agents/reviews/Q30-refuter.md:23`: "`readCareer(file = CAREER_FILE)` and `readRegistries(files = REGISTRY_FILES)` lost their defaults... No item asks for this." Tree: `src/lib/data/sources/career.ts:21` and `src/lib/data/sources/registries.ts:160` still take the file arguments with no default.

### Closed, with the tree checked

- Q31: the first review's twenty findings closed by the round's eight rulings and the second run's nine by the fixes at landing (`Q31-refuter.md:156-165`). Tree: `src/lib/state/form-values.ts:63` `sameSaved` is the one save rule, the `written` overlay is gone from `views/Editor.svelte`, and `Leads.svelte` / `Linkedin.svelte` close through `toggleAdd`.
- Q37: all findings closed in the round (`Q37-refuter.md:101-110`), the three second-run findings at landing (`:136-141`). Tree: `src/lib/themes/derive.ts:51,252` mints `--c-<hue>-lane` at `LANE_SHARE`, leaving every hue's `-txt` at main's value, and `views/focus/LaneHead.svelte:25` paints the pair.
- Q39: its three findings closed by the reviewer's own reverts (`Q39-refuter.md:77-81`), except the `rest`/`edge` duplication listed above. Tree: both spec files hold the cases.
- Q32: fourteen rulings closed, the second run's eight at landing (`Q32-refuter.md:219-230`). Tree: `src/lib/ui/TreeItem.svelte:222,226` scales the row height and type by `--text-scale`. The one closure the landing did not deliver, "the session views' Changes panel is looked at on the TEST page at landing", was carried by Q47's landing, whose look reads the panel over a real workspace.
- Q30: nine rulings, six second-run findings closed at landing (`Q30-refuter.md:149-158`). Tree: `grep -rn findingTextOrKey src tests config DESIGN.md HELP.md` prints nothing; the brief's internal conflict over `findings.config.directory_missing` is accepted in the landing note.
- Q42: six rulings, all closed and reproduced V1 to V9 (`Q42-refuter.md:146-149`). Tree: `src/lib/state/layout.svelte.ts:441,609,616` clear a closed pane's and a closed page's tabs through one `forgetTabs`.
- Q34: eleven rulings, seven second-run findings closed at landing (`Q34-refuter.md:241-253`). Tree: `src/lib/views/focus/rows.ts:39` `keptAction` keeps a row's done alone.
- Q43: nine rulings, the second run's findings closed at landing or booked (`Q43-refuter.md:203-213`). Tree: `src/lib/state/fs.ts:446` `filesLineTyped`.
- Q44: nine rulings, seven second-run findings closed at landing (`Q44-refuter.md:169-177`). Tree: `grep -n branch_new_unborn -r config src` prints nothing, so New branch is live again on a repository with no commit.
- Q45: four rulings, six second-run findings closed at landing (`Q45-refuter.md:141-148`). Tree: `src/lib/server/pty/chat.ts:8,56` fills through `fillPlaceholders`.
- Q41: five rulings; ruling 1 stopped as ruled, the rest closed in the round (`Q41-report.md:713-798`). Tree: `src/lib/themes/derive.ts:51` `LANE_SHARE = 0.5`.
- D22: ten rulings, six of the second run's eight closed at landing (`D22-refuter.md:185-194`). Tree: `DESIGN.md:334` now names `reveal`, `revealed` and `revealing` among the Files instance keys, which was the first review's Doc-text finding.
- Q38: eight rulings, three second-run findings closed at landing (`Q38-refuter.md:203-213`). Tree: `config/text/ui.yml:44,54` carry `pane_more_glyph` and `tab_unsaved`, both named in the landing note.
- Q46: eight rulings, four second-run findings closed at landing (`Q46-refuter.md:144-151`). Tree: `Picture` is declared once at `src/lib/data/model.ts:253` and imported by `src/lib/server/memories.ts:23` and `src/lib/state/memories.svelte.ts:16`, which closes the first review's wire-type duplication; `src/lib/state/memories.svelte.ts:30-33` states the bound sentence the right way round.
- Q47: nine rulings, three second-run findings closed at landing (`Q47-refuter.md:172-181`). Tree: `src/lib/views/sessions/repo-shape.ts` exists and holds the five shapes.
- M2: every finding closed in rounds 1 and 2 or ruled by Axel (`M2-refuter.md`, Closed section). Tree: `config/vocab.yml:265,281` carry `venue_themes` and `data_themes`.
- D16: rounds 1 to 3's findings closed by Axel's ruling (a) as built in round 4 (`D16-refuter3.md:148-155`), except the two items listed under Neither. Tree: `src/lib/server/open.ts:37,181` hands a file to a named application and always reveals a folder, so the Launch Services, Open-With and alias findings no longer apply.
- Q33: rounds 1 to 3's findings closed by the partial round 4 and the landing fixes (`Q33-refuter3.md:144-149`). Tree: `src/lib/ui/tab-scroll.svelte.ts` carries option (2).

### Booked

- Q31, `Q31-refuter.md:27`: the Files view's bookmark form in component state -> state file Open items, "Q31, the Files view's bookmark form", carried into Q32 and Q43.
- Q31, `Q31-refuter.md:103-106`: drafts left in `localStorage` after a pane or page close -> state file Open items, "Q31, drafts left after a pane or page close" -> plan.md Q42 (landed).
- Q31, `Q31-refuter.md:152`: the Leads and LinkedIn add toggles -> state file Open items, closed at Q31's landing.
- Q31, repair Limitations: the source-text audit in `tests/views/collection.test.ts` -> plan.md R14, recurring cause 9 (the audits test).
- Q37, `Q37-refuter.md:110`: the awaiting strip against a coauthor card, and lanes of one colour -> state file Open items, "Q37, the awaiting strip and a coauthor card" and "Q37, lanes of one colour" -> plan.md Q41 (landed).
- Q32, `Q32-refuter.md:207,221`: the picker leaving out a repository with no commit or a failed read -> plan.md Q44 (landed).
- Q32/Q34/Q38, recurring cause 8 (`TreeItem.svelte:408` `:global(.tool)`, `CardActions.svelte:202` `:global(.opener)`, `PageStrip` reaching `Tabs`' `.strip`) -> plan.md R14, item 8 (the boundaries case). Both `:global` reaches are still in the tree.
- Q30, `Q30-refuter.md:54,145`: `sources/config.ts` at 902 lines -> plan.md Q58.
- Q30, `Q30-refuter.md:138-144,156`: `server/pty/chat.ts` `words`, a second placeholder fill -> plan.md Q45 (landed).
- Q34, `Q34-refuter.md:39-42`: the Memories 4:3 crop and the recommendation to carry each picture's size from the server -> plan.md Q46 (landed).
- Q34, `Q34-report.md:125`: hidden ticker controls holding their width -> plan.md Q49, and repeated in the state file's Open items.
- Q34/Q38, `Q34-refuter.md:93`: history written into `ProjectCard.svelte` and `EntryCard.svelte` comments -> plan.md Q59.
- Q43, `Q43-refuter.md:154-159,206`: the shared entry form forgetting a reopened add form's text, in Files and the collection views, and the gone-bookmark close -> plan.md Q48 (in flight).
- Q43, `Q43-refuter.md:64,198`: `Files.svelte` past the component guide -> plan.md Q58.
- Q43, `Q43-refuter.md:188,213`: browser cases cleaning up at the end of their body rather than in a `finally`, and leaving scratch roots -> plan.md Q59.
- Q44, `Q44-refuter.md:29-34`: the Sessions Changes panel drawing `sessions.ch_norepo` for any read failure -> plan.md Q47 (landed).
- Q44, `Q44-refuter.md:52`: `tests/browser/repositories.spec.ts` leaving `mkdtemp` folders -> closed by ruling 6 at Q44, and the cause -> plan.md R14, item 5 (the scratch-directory count).
- Q45, `Q45-refuter.md:136,147`: `tests/routes/terminal.test.ts` at 967 lines -> plan.md Q58.
- Q41, `Q41-refuter.md:19-26` and `Q41-report.md:584`: lane colours with a cluster collapsed or a band column hidden -> state file Open items, "Q41, lane colours with a cluster collapsed or a band column hidden", ruled (a) by Axel.
- D22, `D22-refuter.md:175,191`: `url` as a path field and a scheme-less address counted as a hub path -> plan.md Q50.
- D22, `D22-refuter.md:178,194`: `state/layout.svelte.ts` at 942 lines -> plan.md Q51.
- Q38, `Q38-refuter.md:186-188,208-210`: the accent line across nested pages and a folded pane -> plan.md Q53; `ui/Tabs.svelte` at 596 lines -> plan.md Q54; the pane menu behind the pane body under the rice themes -> plan.md Q55.
- Q38, `Q38-refuter.md:193,211`: the sash reach one device pixel past the pane borders, recorded at landing -> plan.md Q60.
- Q38, `Q38-refuter.md:188,212`: `ui.tab_unsaved` and `ui.pane_more_glyph`, two user-visible keys no brief named -> plan.md Q60.
- Q38, `Q38-refuter.md:107-108`: the stale `config/glyphs.yml` section comment and the duplicated `dirty` glyph -> plan.md Q59.
- Q46, `Q46-refuter.md:139,150`: the PNG `eXIf` chunk past the 512-chunk cap, recorded at landing -> plan.md Q60.
- Q47, `Q47-refuter.md:162,177`: the `reading` branch whose closure no test can catch -> plan.md Q60.
- Q47, `Q47-refuter.md:160,176`: a deleted workspace read as "not a git repository" -> plan.md Q57.
- Q47, `Q47-refuter.md:70,161,179`: `Repo.svelte`'s second `branchState` and the `data-repo-failed` spelling -> plan.md Q52.
- Q32/D22, the error and outcome lines left on screen after their cause is gone -> plan.md Q56 and Q59, and the state file's Open items.
- M2, `M2-refuter.md` verification: the worktree cockpit gate failing on `tools/present` -> state file Open items, "The worktree cockpit gate".
- M2 landing: `tests/server/hpc/ssh.test.ts` timing out under load -> plan.md Q36; the `tests/server/entry-edit.test.ts` failure seen once -> state file Open items.
- D16, `D16-refuter2.md` and `D16-refuter3.md`: which files may be handed to their program, and how a file reaches its program -> state file Open items, two entries.
- Q33, `Q33-refuter3.md:149`: the page strip's control-step case and the reverts of the rewritten tab cases -> plan.md Q39 (landed); whole-tab scrolling's cost -> state file Open items.
- Q48, `Q48-report.md:103-105`: the sweep needing one mounted Files view, `Files.svelte` at 619 lines, and the per-form-key `kept` mark -> state file Open items, "Q48's own sharp edges, ... to close at its landing", with the size line also in plan.md Q58. Q48's two stale Doc-text sentences (`HELP.md:65`, `DESIGN.md:334`) are held out by its brief's decision 2 and are due at its landing, which has not happened.
- The eleven recurring causes -> plan.md R14; the twelve one-or-two-step causes -> plan.md Q59; the files over the size line -> plan.md Q58; the four findings a landing recorded without booking -> plan.md Q60.
- The looks owed for Q43, Q44, Q41 and D22, which landed with none -> state file Open items, "The looks owed".
