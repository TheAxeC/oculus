# Step O74 brief check (on main at 84f9723a)

The report of the fresh agent of the `spec` skill's "Steps / The brief check", on `agents/briefs/O74.md`. A page this report cites (the rules file, a standard, a skill's text) is named with its section, never with a line number, since a page's lines move and a section's name does not. A line of code or a hit of a grep keeps its `file:line`.

The report is written in the rules file's character set. A character outside it in a quoted line is written by its name in angle brackets, such as `<em dash>`.

Main moved from the brief's base b8756e7b to 84f9723a while this check ran (`git log --oneline b8756e7b..HEAD`: e0687c50 "Prepare step O75 with ruling 364", 84f9723a "Launch the builder of step O75"). `git diff --stat b8756e7b HEAD` touches only ledger files (`.scratch/migration/agents/briefs/O75.md`, `reviews/O75-brief-check.md`, `reviews/O76-report.md`, `orchestrator-state.md`, `plan.md`), so every source premise below was checked against the same source tree as the brief's base.

`plan.md` has no `## Goal` section (`grep -n "^## " .scratch/migration/plan.md`: Steps, Could run in parallel, Rulings, Agents, Blocked). Its opening paragraph says the plan executes `tools/oculus/DESIGN.md`. "The goal" in section 5 is therefore the part the step delivers as rulings 346 (a) and 357 (a) state it (`plan.md:2690`, `:2695`; state file "Closed items" 346 and 357).

## 1. Names

- `nextLine`, `recordTable`, `RecordTable`, `trackRecord`, `daysLeft`: `git grep -n "nextLine\|recordTable\|RecordTable\|trackRecord\|daysLeft" -- ':!.scratch' ':!config/local.yml'`, hits outside `state/boards/career.ts` and `CareerPanel.svelte` filtered out: no output. No hit outside the paths.
- `career_next_line`: `git grep -n "career_next_line" -- ':!.scratch' ':!config/local.yml'`: `config/text/views/boards/focus.yml:18` and `src/lib/state/boards/career.ts:51`, both in the paths. No hit outside the paths.
- `FoldKey`, `foldOpen`, `foldToggled`: `git grep -n "FoldKey\|foldOpen\|foldToggled" -- src tests docs config ':!config/local.yml'`: `src/lib/state/boards/focus.ts:533,539,544` and `src/lib/views/boards/focus/Focus.svelte:46,47,53,163,164,175,184`, all in the paths. No hit outside the paths.
- `openedDraft`, `arrived` (to be exported from `entry-file.ts`): the same grep finds `openedDraft` only at `src/lib/views/shared/forms/entry-file.ts:32,83,94`. The `arrived` hits elsewhere (`reveal.svelte.ts:210`, `Memories.svelte:65`, `Outline.svelte:107` and others) are other local names, so the change makes none of them false.
- "starts folded" / "folds by itself": `src/lib/views/boards/focus/Focus.svelte:26-27` and `CareerPanel.svelte:101`, both in the paths.
- `EntryForm` / `EntryEditor` (both gain a prop): `git grep -n "EntryForm\b\|EntryForm.svelte\|EntryEditor" -- src tests docs README.md config ':!config/local.yml'`. Outside the two files:
  - `src/lib/views/boards/editor/Editor.svelte:25,49,262` (the project editor draws `<EntryForm` at :262);
  - `src/lib/views/boards/entry/Entry.svelte:23,51,322`;
  - `src/lib/views/boards/person/Person.svelte:48,323`;
  - `CareerPanel.svelte:20,39,133` (in the paths).
  None is made false, since the prop is optional. The brief's sentence "Both are also drawn by the person page (...) and the entry page (...)" leaves out that `EntryForm` is also drawn by the project editor `Editor.svelte:262`. Case 7 does not name that editor either.
- The career banner in prose: `git grep -n -i "career banner\|career panel\|CareerPanel" -- ':!.scratch' ':!config/local.yml'`. The hits outside the paths and whether each stays true:
  - `config/catalogs/vocab.yml:109`, `config/options/catalogs/vocab.yml:123` and `src/lib/data/shapes/catalog-files/vocab.ts:176` ("which the career banner's track record counts"): stay true, since the Funding obtained row still counts.
  - `config/defaults/sources.yml:52` and `config/options/sources.yml:74`: stay true.
  - `docs/data-map.md:54,62` and `docs/templates.md:92,1415` ("the goal, the next milestone with its day and the days left to it, the situation and the order of work"): stay true.
  - `src/lib/data/model/model-collections.ts:200`, `src/lib/data/snapshot/normalise-parts/career.ts:3`, `src/lib/data/sources/documents/career.ts:1`, `src/lib/data/shapes/boards/roles.ts:6`, `src/lib/state/forms/form-draft.ts:4`, `src/lib/state/forms/page-entry.ts:3`, `src/lib/views/shared/forms/entry/edit/page-file.ts:1`, `tests/data/sources/career.test.ts:33`, `tests/fixtures/hubs/demo/.oculus/data/academic/career.yml:1` and `tests/server/edit/writes-fixture.ts:113`: stay true.
  - `src/lib/views/boards/focus/FoldHead.svelte:5-8`: stays true. It still says the career banner draws its heading with FoldHead, and "whatever the section puts at the end of the row" covers the Edit control. O75 moves this file.
- `docs/HELP.md` mentions of the career banner: `grep -n -i career docs/HELP.md`. Hits at `:207` (the views table, "the career strategy", stays true) and `:287` (in the paths). No other line describes the banner.
- Other docs: `grep -n -i career README.md docs/*.md` minus HELP, templates and data-map gives `docs/apps.md:380,412` (the `career` portfolio key). Both stay true.

Findings:
- 1.1. Not a hit the change makes false. The brief's premise that EntryForm is drawn only by the person and entry pages through EntryEditor is incomplete: `Editor.svelte:262` (the project editor) draws `EntryForm` directly. The new optional prop reaches that editor too, and case 7 should name it among the editors that focus nothing.

## 2. The step line

- "its fold kept in the Focus instance state like the command center's and the tasks', starting open": item 1.
- "the command center's box and two-column flow": item 2.
- "every line a command-center row (a glyph, the words, a tail, buttons under the pointer)": item 3, with the buttons in item 5.
- "NEXT the milestone as a deadline row, its day and days left as the tail coloured as the command center colours a deadline": item 3 NEXT (`daysTone`).
- "GOAL": item 3 GOAL.
- "SITUATION one row per fact": item 3 SITUATION.
- "ORDER OF WORK one row per task with its date as the tail and its note in its words": item 3 ORDER OF WORK (`career_task_note`).
- "TRACK RECORD one row per role with its counts as the tail and a Funding obtained row": item 3 TRACK RECORD.
- "a press on a row of the career file (Next, Goal, a Situation fact, an Order of work task) opens the career file in an editor tab at that entry's line": item 4.
- "its one button under the pointer, Edit, opens the banner's form on that section": item 5.
- "a Track record role row opens its board (Lead to Projects, Supervisor to Supervision, Collaborator to Coauthor) and Funding obtained the Funding view, with no button": item 6.
- "Edit in the heading row": item 7.
- "the banner's own grid, definition grid, list, date boxes and table removed": item 2, last sentence.

Findings: none. Every part has a requirement. Two requirements go past the line without widening it: item 3's order note as a `.sub` line (decision 4) keeps content the banner draws today, and item 8 (the words) applies the standards to the change.

## 3. Premises

- The step's line rests on rulings 346 (a) and 357 (a): `grep -n "Open item 346\|Open item 357" .scratch/migration/plan.md` gives `:2690` and `:2695`, both "(the user)". `grep -n "^- 357 \|^- 346 \|^## Closed items" orchestrator-state.md` gives `193:## Closed items`, `195:- 357`, `237:- 346`. Matches.
- `CareerPanel.svelte` has 404 lines (`wc -l`: 404). Matches.
  - `FoldHead` has no `end` (`:111-117`); Edit is a ToolButton at `:123-131`; `.sections` is at `:274-283`; `.facts` at `:159-164`; the table at `:196-219`; the fold is `let unfolded = $state(false)` at `:102`; the `hidden`/`onbeforematch` body is at `:118-122`; the box is at `:239-257`. All match.
  - Order of work at `:175-191`: the `<ol>` is `:175-189` and the order note is `:190-192`. Matches near enough.
- CommandCenterView `.week` (`:248-257`): `cat -n` shows `.week` at `:271-279`. The values match (`padding: 4px 8px`, the borders, `background: var(--chip)`, `columns: 2 22em; column-gap: 16px`), but **the line range differs**.
  - `.grp` is `margin-top: 4px; break-inside: avoid` at `:292-295`, matching.
  - `.lbl` is at `:302-312` and `.sub` at `:316-320`, matching.
  - Each group draws `<Ticker {rows} {onpick} {onaction} reveal kept={view.kept} {marked} />` at `:122`, matching.
  - FoldHead's `.head` has `column-span: all` at `FoldHead.svelte:63`, and its `end` snippet is at `:51-55`. Both match.
- `TickerRow` (`ticker-rows.ts:9-30`) has `id, glyph, label, tail, tone, mark, actions, plain`, and `TickerAction` is `id, label, title, disabled`. This matches, except the brief leaves out `mark`.
  - Ticker draws words and tail as one `<button class="name">` when `onpick` is set, the id is not empty and the row is not plain (`Ticker.svelte:76-93`). Otherwise it draws `LinkedText` for the label (`:95`), with the tail always plain text (`:96-104`).
  - `cutText` and `measureCut` are at `reveal.svelte.ts:239-254`.
  - All match.
- `daysTone` is at `src/lib/state/boards/ticker.ts:544-548` (red if < 0, amber if <= DEADLINE_SOON), and `DEADLINE_SOON = 14` is at `presets.ts:302`. Matches.
- `Focus.svelte:159-165` (folds, fold) and `focus.ts:532-550` (`FoldKey = 'command' | 'tasks'`, `foldOpen`, `foldToggled`): match. The head comment `Focus.svelte:24-27` matches. `said` is at `:151` and drawn at `:192-194`, matching. `onsaid` is passed to CommandCenter, Tasks, QuickAdd and Lanes (`:179,188,191,214`), matching.
- `Career` is at `model-collections.ts:202-220`, and the normaliser's `orderRow` is at `normalise-parts/career.ts:27-33`. Match.
- `career.ts` holds `nextLine` (`:46`), `daysLeft` (`:31`, module-private, not exported), `trackRecord` (`:79`) and `recordTable` (`:157`). The Names grep shows no reader outside the banner and no test. Matches. Note: `daysLeft` is not exported, so a tail function written outside `career.ts` (for example in `career-rows.ts`) needs it exported or the tail built in `career.ts`. The brief does not say which.
- `entry-file.ts`: `openedDraft` is `:32-42` (doc comment at `:31`); `arrived` is `:45-64` (doc at `:44`, the brief says `:45-63`); neither is exported. `findEntry` is at `draft-entry.ts:92`, `sourceTabState` at `draft.ts:236` and `pageFile` at `page-file.ts:17`, with the career branch at `:20`. These match.
  - The brief says the career file opens "at its top" when the text does not hold the entry. The mechanism it shares says otherwise: `entry-file.ts:89-91`, "in which case the tab stays where it was" (`arrived` calls `openSourceFile` with no line when `answer.line === null`). **That differs.** See 4.3.
- `EntryEditor` props are `page, instance, file, fault` (`EntryEditor.svelte:50-60`), and `EntryForm` draws one `Field` per field at `:93-106`. These match. The claim that they are drawn by the person and entry pages is incomplete: `Editor.svelte:262` also draws `EntryForm` (see 1.1).
- `boards:` is at `config/defaults/layout.yml:227` and runs to `:299` (the brief says `:227-298`, one line off). `boardRegistration` is at `Projects.svelte:22-27`, `roles:` at `vocab.yml:207-211` and `categories:` at `:218-223`. The Funding view is `ticker.ts:96` `FUNDING = 'funding'`, `:242` `entry: FUNDING`, opened by `rows.ts:319` `layout.openView(line.entry)`. Matches in substance.
- The hub career file (`cat -n ~/workspace/research-hub/.oculus/data/academic/career.yml`): `goal:` :24, `milestone:` :25, `milestone_date: "2026-11-17"` :26, situation PhD/Past/Now/Also :30-33, `order:` row :37 `{ task: "ERC Starting Grant", when: "Oct 2027", note: "" }`, schema fields title, goal, milestone, milestone_date, situation, order_note, order. Matches.
- `focus.yml:8-23` holds the `career_*` keys (`sed -n 1,32p`), matching. `career_next_line` is read only by `nextLine` (Names grep), matching.
- `docs/HELP.md:287` holds the Career banner sentences as the brief says (`sed -n 287p`). Matches.
- Folder counts (`ls`): `src/lib/views/boards/focus/` has 10 items (Band.svelte, career, CommandCenter.svelte, CommandCenterView.svelte, Focus.svelte, FoldHead.svelte, lanes, QuickAdd.svelte, rows.ts, Tasks.svelte). `src/lib/views/shared/forms/` has 10. `career/` has 1. `git status --short` shows nothing untracked there. Matches. (`utils/folder-check.sh` was not run, since it runs `git ls-files`, which this check may not run.)
- O75 "in flight (preparing)": the state file's dispatch block, read when the check started, had O75 at `landing: preparing`. Head commit 84f9723a "Launch the builder of step O75" now shows it launched. `git show HEAD:.scratch/migration/agents/briefs/O75.md` paths: O75 writes `docs/HELP.md` lines 289-295 **and line 523** (added by ruling 364), `CareerPanel.svelte` (its import), `src/lib/state/boards/board/presets.ts` and `items.ts`. None overlaps O74's paths beyond the CareerPanel import line and HELP.md, both already named in `shared_paths`. The O75 sentence in the brief is out of date on two points: the state, and the extra HELP line 523.
- The verify list equals the state file's `verify:` (`orchestrator-state.md:6-9`: `npm run test:quick`, `npm run diagrams && npm run test:quick`). Matches.
- The base file `.agents/worktrees/O74-base/unused-exports.txt`: `ls .agents/worktrees/` gives gate, migration-O75, migration-O76, O75-base, O76-base. The O74 base does not exist yet, which is expected before the worktree step.
- The ADR folder: `ls docs/adr` gives "No such file or directory", and `.agents/plan.yaml` has no `adr` key. Matches.

Findings:
- 3.1. The CommandCenterView `.week` range is `:271-279` on the tree, where the brief says `:248-257`.
- 3.2. The brief says a press on a row whose entry is gone opens the tab "at its top". The mechanism it tells the builder to share leaves the tab where it was (`entry-file.ts:89-91`, `arrived` `:62`). Either the brief changes its expected result, or the shared opener gains a top-of-file place for this caller.
- 3.3. The O75 sentence is stale: O75 is launched, and it also writes `docs/HELP.md` line 523.
- 3.4. Small offsets: `arrived` is `:45-64`, `boards:` is `:227-299`, and `TickerRow` also has `mark`. No decision rests on these.
- 3.5. `daysLeft` is module-private (`career.ts:31`, no `export`), and the brief does not say where the NEXT tail is built.

## 4. Cases and checks

- Preamble ("No case is a test: no entry of `agents/guarded.md` covers the career banner"): `grep -c draft-entry .scratch/migration/agents/guarded.md` gives 1. **G28's Code line names `src/lib/state/sessions/source/draft-entry.ts`**, a file this step changes, and G28's text names "the career editor". The standards page, "What every package obeys": "A step whose change touches an entry's code runs that entry's test." The brief names no G28 test to run, and `test:quick` will not select one: `git grep -ln "draft-entry\|entry-file\|...EntryForm\|EntryEditor\|CareerPanel"` over `tests` finds only `boundaries.test.ts` and `board-rules.test.ts`, which import neither draft-entry nor entry-file. This is inconsistent with the standards page.
- Case 1 (fold run): consistent.
- Case 2 (hub file, look): consistent.
- Cases 3 and 4 (finder runs): consistent.
- Case 5: inconsistent with the shared mechanism on "opens the tab at its top" (3.2).
- Case 6 (tail and tone run): consistent.
- Case 7: asks the builder to check the person page and the entry page (`Person.svelte`, `Entry.svelte`, places the step does not change). This is justified, since the observed behaviour belongs to the changed `EntryEditor`/`EntryForm`. It omits the project editor `Editor.svelte:262`, which draws the changed `EntryForm` too.
- Case 8: consistent. Its reference to G28 confirms that G28 covers the career editor, which is relevant to the preamble finding.
- Case 9: consistent. Its "other to coauthor" row is an input the banner never meets: `trackRecord` keeps only roles with a `field` (`career.ts:98`), and `other` has none (`vocab.yml:211`).
- Case 10: consistent.
- Case 11: consistent.
- Case 12: asks about Ticker behaviour (`Ticker.svelte`, a place the step does not change). It is consistent with the rules. It records a user-visible loss: today a web address in a fact, the goal, the milestone, a task or a note is a link (`CareerPanel.svelte:16-17`, `LinkedText`). After the change it is text, since a pressed row's words sit inside a button and a tail is never linked (`Ticker.svelte:84-104`). "Decisions taken in this brief" does not list this. Under the rules file's "No silent design decisions" it belongs there.
- The Conventions paragraph ("The command center's look is reused, never copied: a style the banner shares with the command center is written so the two read the same") read against the standards page's "SOLID, DRY ... a parser, a fold or a rule exists once and is reused": item 2 dictates the command center's CSS values (`columns`, `break-inside`, `margin-top`, `.lbl`, `.sub`) for the banner's own `<style>`, which is a copy. Svelte styles are scoped, so real reuse needs a shared group component or a stylesheet. That touches `CommandCenterView.svelte`, which is not in the paths, and `views/boards/focus/` is full at 10, so the new file would go elsewhere. The sentence contradicts itself as written. Making it hold widens the step.
- Item 4's placement ("the finder sits beside `findEntry` in `draft-entry.ts`"), read against `draft-entry.ts:3-6` ("The text rules (where the entry goes, ..., where an existing entry stands) are data/helpers/files/yaml/collection-text.ts; this module reads the draft ...") and the standards page's separation of concerns: the career text rule (which line a key or an order row stands on) would sit in the module that says it holds no text rules. `collection-text.ts` is not in the paths, and `state/` may import `collection-text` but not `yaml-ranges` (`tests/checks/tree/boundaries.test.ts:309`). Putting the rule in `collection-text.ts` widens the step.

Findings:
- 4.1. The brief says no guarded entry applies, but G28's Code line names `draft-entry.ts`, which the step changes. The standards page requires running G28's tests, and the brief does not name them.
- 4.2. Case 5's "opens the tab at its top" conflicts with the shared opener's "the tab stays where it was" (`entry-file.ts:89-91`).
- 4.3. Case 7 omits the project editor (`Editor.svelte:262`), which draws `EntryForm`.
- 4.4. Case 12's loss of links in the banner is a user-visible change that "Decisions taken in this brief" does not list.
- 4.5. The Conventions "reused, never copied" sentence contradicts item 2's dictated copied CSS. Reuse would need `CommandCenterView.svelte` and a shared component: widens the step.
- 4.6. The finder's text rule placed in `draft-entry.ts` contradicts that module's head comment (text rules live in `collection-text.ts`). The fix widens the step (`collection-text.ts`).
- 4.7. Case 9's "other to coauthor" checks a role that `trackRecord` never yields as a row (`career.ts:98`). Harmless as a run of the choice function.

## 5. The question

"Could this pass without the goal being reached?"

- Case 1: **yes**. It runs `foldOpen` and `foldToggled` alone, so it passes once `FoldKey` gains `'career'`, even if `Focus.svelte` never passes `open` and `ontoggle` to the banner or the banner keeps its local state. No case or look line asks to see the banner start open on a tab with no saved state, or keep its fold across a reload or a move.
- Case 2: no. The look shows the groups, rows, tails and two columns.
- Case 3: **yes**. It runs the finder alone. It passes with the row press not wired to the finder, or with a tab opened without the caret at the line. No case names a press with its expected tab and caret (for example "a press on GOAL opens career.yml kept, caret at line 24").
- Case 4: **yes**, as case 3. It also passes while two rows with the task "Review" carry one row id, so the second row's press goes to the first's line. The row-to-rank mapping is never checked.
- Case 5: no for the sentence, which is read. Its expected tab place conflicts (4.2).
- Case 6: **yes, partly**. It runs the tail and tone function alone. Case 2's look can show only the 23-day tail with no tone (the hub's date), so no look shows a red or amber tail on the NEXT row. The tone's wiring is checked by reading only.
- Case 7: no (look).
- Case 8: no (look).
- Case 9: **yes**. It runs the role-to-board choice alone. Case 10 looks only at the Funding row and the absence of buttons, so no look line shows a press on Lead opening Projects.
- Case 10: no.
- Case 11: no (reading).
- Case 12: no.
- The step line's check (the verify list and the look): the verify list (`test:quick`, unused exports, folder check, prose reading) can pass without the goal, as expected of hygiene checks. The goal rests on the look and the readings above.
- Item 1: as case 1, **yes**.
- Item 2: no (case 2's look).
- Item 3: no for the drawing (case 2's look). Yes for the tones (case 6).
- Item 4: **yes**. Cases 3-5 check the finder, not the press, and no case checks that Edit in File still opens a collection card at its entry after `openedDraft` and `arrived` are made shared.
- Item 5: no (case 7).
- Item 6: **yes** for the role rows (case 9).
- Item 7: no (case 8).
- Item 8: no; the words are judged by reading under verify 4.

Findings:
- 5.1. Item 1 and case 1 can pass with the banner's fold unwired. A look line is needed: a fresh Focus tab shows the banner open, and a fold survives a reload.
- 5.2. Item 4 and cases 3-4 can pass with the press unwired, or with duplicate-task rows sharing an id. A look line per file row (the caret at lines 24, 25, 32 and 37) and a run of the row-id-to-rank mapping are needed.
- 5.3. Item 4 has no case for Edit in File after `openedDraft` and `arrived` are made shared. A look line is needed: Edit in File on a collection card still opens at its entry.
- 5.4. Case 6's tone can pass unwired, since the hub's date gives no tone at the look.
- 5.5. Item 6 and case 9 can pass with role-row presses unwired. A look line is needed: a press on Lead opens Projects.

## 6. Implied inputs

A code step. Each input the step implies and does not state, with whether it is listed under "Cases":

- A career file with no `schema:`: **missing, and it exists in the repository.** `tests/fixtures/hubs/demo/.oculus/data/academic/career.yml` has no `schema:` (`grep -n "schema:"` gives no hit). `careerPage` returns null then (`page-entry.ts:191`), and the banner's `file` is `pageFile(page)` (`CareerPanel.svelte:78-79`), so it is null too. A row press built on that `file` would do nothing. Expected result: the rows still open the career file (from `career_file`, `viewSourceFile('career', ...)`) at the entry; no row carries Edit, and the heading row has no Edit.
- An order row whose `note` is `""` (the hub's own `:37`; `optionalTextShape` keeps `""`, `shapes.ts:56`, and `compact` keeps it): covered only through case 2's expected words "ERC Starting Grant". Expected result: no ", " and no empty note. It should be stated so it is checked.
- `order_note: ""` (the template writes `# order_note: ""`, `docs/templates.md:1439`; `str("")` is `""`, `normalise-parts/career.ts:83`): **missing**. Expected result: no `.sub` line.
- Two order rows with the same task, and the row ids: **missing** for the ids. Case 4 covers the finder only. Expected result: each row has its own id, and each press opens its own line. Row ids that are empty (an empty label or key gives a Ticker plain row, `Ticker.svelte:76`), duplicated, or colliding across groups when one `onpick` handler serves several groups are unlisted. The state file's standing demand (`orchestrator-state.md:148`, "Every brief that introduces a key or id names it and lists its empty, duplicated and colliding cases as acceptance items") applies.
- A draft with unsaved text in which the entry has moved (decision 1): **missing**. Expected result: the press opens at the line the draft holds.
- The career source tab already open at another line when the entry is gone: **missing, and it conflicts** (3.2). Expected result: whatever the brief settles, top or stays.
- A `boards:` row with no `role:` key (oculus's `personal` and `software`, `layout.yml`) placed before a role's board in a hub's order: **missing**. Expected result: a board naming no `role:` holds no role, so it is skipped.
- A `boards:` key that is no registered board view but whose `role` holds the role: **missing from case 9**. Item 6 states the rule. Expected result: that key is skipped and the next board is chosen.
- The editor open, and whether the rows stay drawn beside it or the editor replaces them (today it replaces them, `CareerPanel.svelte:132-135`): **missing**. Item 2 says only that the editor spans both columns. Expected result: to be stated.
- Edit under the pointer pressed while the editor is already open on another section: **missing**. Expected result: the editor stays open and the new section's field scrolls into view and takes the focus.
- A situation written as a flow map, or with a quoted key (`"Now": ...`): **missing**. Expected result: the line of that key.
- A find-in-page match inside the folded body (item 1): no case. It needs a look line.

Findings: the inputs above marked missing.
- 6.1. A career file with no schema (it exists in the demo hub).
- 6.2. `order_note: ""`.
- 6.3. Row ids: empty, duplicated and colliding across groups, under the standing demand.
- 6.4. A moved entry in an unsaved draft.
- 6.5. A tab already open at another line when the entry is gone.
- 6.6. A board with no `role:` key.
- 6.7. An unregistered board key.
- 6.8. Rows while the editor is open.
- 6.9. Edit pressed while the editor is open.
- 6.10. A flow-map or quoted situation key.
- 6.11. Find-in-page while folded.

## 7. ADRs

- `ls docs/adr` gives "No such file or directory", and `.agents/plan.yaml` has no `adr` key (`cat .agents/plan.yaml`). No record.

Findings: none.

## 8. Dictated text

- `career_next_tail: '{0}, {1}'`, found by `grep -n "'{0}, {1}'" briefs/O74.md` (line 32): holds (ASCII, a single-quoted YAML scalar).
- `career_task_note: '{0}, {1}'`, found by the same grep (line 35): holds.
- `career_record_count: '{0} {1}'`, found by `grep -n "'{0} {1}'"` (line 36): holds.
- `` `FoldKey` gains `'career'` ``, `open={foldOpen(folds, 'career')}` and `ontoggle={() => fold('career')}`, found by `grep -n "foldOpen(folds, 'career')"` (line 29): holds. They follow `Focus.svelte:175-176` and `:184-185` exactly.
- `columns: 2 22em; column-gap: 16px`, `break-inside: avoid`, `margin-top: 4px`, found by `grep -n "columns: 2 22em\|break-inside: avoid"` (line 30): hold for the character set and formatting. Against the standards page's DRY and the brief's own "reused, never copied", they are copied declarations (4.5).
- `LC_ALL=C grep -n '[^ -~]' briefs/O74.md`: no output, so the brief is ASCII throughout. HELP and the head comments are described as requirements and not dictated, so the builder words them.

Findings: none beyond 4.5.

## Declined to judge

- Whether the step should be widened to give the command center's look one shared source (4.5), or to place the finder's text rule in `collection-text.ts` (4.6). Each widens the step's paths, so it is the user's call through the orchestrator.
- Whether the loss of links in the banner's rows (4.4) is accepted under rulings 346 (a) and 357 (a). This is a user-visible choice, so it is the user's call.
- `utils/folder-check.sh` and `utils/unused-exports.sh` were not run: the first runs `git ls-files`, a git command this check may not run, and the second needs the O74 base, which does not exist yet. The folder counts were taken with `ls`.
- The plan has no Goal section, so "the goal" in section 5 was taken from rulings 346 (a) and 357 (a).

Agent usage: a12d854c070c867cd, claude-opus-5-5, 237654 tokens, 83 tool uses, 9 min 31 s.

## Closed (the session's change to the brief for every finding above, and each dictated line added after the check, made before the preparation commit)

- 1.1 and 4.3 (the project editor draws `EntryForm`): "What is on the tree" names `Editor.svelte:262`; case 7 adds the project editor among the editors that focus nothing.
- 3.1 (`.week` range): "What is on the tree" reads `:271-279`.
- 3.2 and 4.2 (the tab place when the entry is gone): item 4 and case 5 follow the shared opener: no line given, the top for a tab newly opened, unmoved for one already open.
- 3.3 (O75's state): "What is on the tree" says O75 is building at base e0687c50 and writes `docs/HELP.md` lines 289-295 and 523.
- 3.4 (offsets): `arrived` `:45-64`, `boards:` `:227-299` and `TickerRow`'s `mark` written in "What is on the tree".
- 3.5 (`daysLeft`): item 3 exports `daysLeft` so the NEXT tail is built beside the other rows.
- 4.1 (G28 covers `draft-entry.ts`): Verify 4 runs G28's tests that reach the career editor and the draft (`form-draft`, `page-entry`, `held-unsaved`, `source` test files) before and after; the Cases preamble says so.
- 4.4 (links lost in the rows): a stop, open item 373; ruled (a) and closed in the brief: item 5 gives a row that holds a web address one Open link button per distinct address, case 12 rewritten to it, Decision 9, the new key `career_open_link: 'Open {0}'` (a dictated line added after the check, held: plain ASCII, a key and its words as the file's other `career_*` keys are written).
- 4.5 (the command center's look copied): a stop, open item 372; ruled (a) and closed in the brief: item 9 builds `src/lib/ui/display/ticker/TickerGroup.svelte` with the group and the box, items 2 and 3 draw the banner with it, the Conventions sentence rewritten to the one source, case 25 (the command center unchanged at the look), Decision 8, the paths widened to `TickerGroup.svelte` and `CommandCenterView.svelte`.
- 4.6 (the finder's text rule in `draft-entry.ts`): a stop, open item 371; ruled (a) and closed in the brief: item 4 puts the rule in `src/lib/data/helpers/files/yaml/career-text.ts`, called from `draft-entry.ts` as it calls `collection-text.ts`, with the one line `'data/helpers/files/yaml/career-text'` added to the `state:` list of `tests/checks/tree/boundaries.test.ts` (G16) that this call needs (a dictated code line added after the check, held: the form of the list's other entries), case 26 and Verify 4 running G16's test; the paths widened to `career-text.ts` and that one line.
- 4.7 (case 9's `other`): case 9 says it is a run of the choice function only, since `trackRecord` gives no `other` row.
- 5.1: case 13 (the banner open on a fresh tab, its fold kept over a reload).
- 5.2: case 14 (each file row's press at its line, and the duplicate-task ids and ranks run).
- 5.3: case 15 (Edit in File on a collection card after the sharing).
- 5.4: case 6 keeps the run of the tail and tone; the wiring of the tone is read, the hub's date giving none at the look.
- 5.5: case 16 (a press on Lead opens Projects).
- 6.1: case 17. 6.2: case 18. 6.3: case 19. 6.4: case 20. 6.5: case 5 as rewritten. 6.6 and 6.7: case 21. 6.8 and 6.9: case 22 (the editor takes the place of the groups while open, so no row's Edit can be pressed then). 6.10: case 23. 6.11: case 24.
- The brief was then held in the session's scratch folder and taken out of the ledger, as a stop leaves no brief; it is written again from that copy after Axel rules on 371, 372 and 373.
