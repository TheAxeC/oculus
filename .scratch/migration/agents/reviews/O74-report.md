# O74 report: the Focus career banner built from the command center's parts

Everything in the brief is done. Two things need the orchestrator's eye: the heading row reads "Close editor" while the editor is open, where the brief says "Done" (item 7, case 22; section "Wrong or impossible"), and two render lines carry an `eslint-disable-next-line @typescript-eslint/no-unsafe-call` for the box snippet (judgment call 1).

## Open items of the state file, verbatim

`.scratch/migration/orchestrator-state.md` lines 174-178 hold the heading and its preamble and no entry:

> ## Open items (only what Axel must rule on; every report tells him these in plain words, decisions first, until he has ruled)
>
> An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own.

## The cases' first run, on the unchanged tree

Run through a scratch vitest file (`tests/zz-o74/cases.test.ts`, removed after the run) importing `foldOpen`, `foldToggled`, `nextLine`, `boardIds` and `draft-entry.ts`, over the hub's `career.yml` read only. Output:

```
case 1 foldOpen({}, career): true
case 1 foldToggled({x:1,closed:[tasks]}, career): {"x":1,"closed":["tasks","career"]}
case 3 hub line of "goal:" 24
case 3 hub line of "milestone:" 25
case 3 hub line of "  Now:" 32
case 3 hub line of "  - { task: \"ERC Starting Grant\"" 37
case 3-5,20,23 draft-entry exports: placeEntry, findEntry
case 2 nextLine hub: FWO Senior on 2026-11-17, in 23 days
case 6 nextLine -3 days: M on 2026-10-22, 3 days ago
case 6 nextLine +10 days: M on 2026-11-04, in 10 days
case 6 nextLine no day: "M"
case 9/21 boardIds(oculus config): projects, supervision, coauthor, archive, personal, software
```

- 1: at run time `foldOpen` answers true and `foldToggled` adds `career` and keeps `x`, but `FoldKey` is `'command' | 'tasks'` (`focus.ts:534`), so `'career'` is a type error, and `CareerPanel.svelte:102` keeps its own `$state(false)`: the banner starts folded and nothing saves the fold.
- 2: the banner starts folded (`CareerPanel.svelte:102`). Unfolded, it draws a grid of sections in the order Goal, Next, Situation, Order of work, Track record. Next is one plain line, "FWO Senior on 2026-11-17, in 23 days", and the track record is a table.
- 3, 4, 5, 20, 23: no finder exists. `draft-entry.ts` exports only `placeEntry` and `findEntry`, both over a collection's list. The hub's lines are 24 (goal), 25 (milestone), 32 (Now) and 37 (ERC Starting Grant).
- 6: the Next line has no tone. It reads "3 days ago" and "in 10 days" in the banner's plain text colour. With no day it is the milestone alone.
- 7, 8, 22: Edit is a ToolButton at the top of the body (`CareerPanel.svelte:123-131`). The editor replaces the sections. No field is scrolled to or focused.
- 9, 21: no role-to-board choice exists. `boardIds` gives the six board ids in order.
- 10, 16: the track record is a table with no press.
- 11: no `self` gives `trackRecord` null and no table (`career.ts:86`). No career file draws nothing (`CareerPanel.svelte:109`).
- 12: an address in a fact, goal, milestone, task or note is drawn as a link (`LinkedText`, `CareerPanel.svelte:140-191`). There are no buttons.
- 13, 24: the banner starts folded. A find-in-page match unfolds it (`onbeforematch`, `:121`) for the life of the component only.
- 14, 15: no press on a row exists. Edit in File opens through the private `openedDraft` and `arrived` (`entry-file.ts:32-64`).
- 17: the demo fixture (no `schema:`) draws its sections and has no Edit.
- 18: an order row with `note: ""` draws an empty `.ordernote` span (`CareerPanel.svelte:179`, `note !== undefined`). `order_note: ""` draws an empty `.note` paragraph (`:190`).
- 19: no row ids exist. The order list is keyed by `${at}:${row.task}`.
- 25: the command center draws its own `.week` box and groups (`CommandCenterView.svelte:118-346`).
- 26: `npx vitest run tests/checks/tree/boundaries.test.ts`: "Test Files 1 passed (1) / Tests 11 passed (11)". The same minute, one earlier attempt printed a failure of "holds across src/lib" and the next run did not reproduce it.

## DONE / NOT DONE

| Item | State | Proof (command and output) |
|---|---|---|
| 1 The fold (`FoldKey` 'career', Focus passes open/ontoggle, local state gone, hidden until found, head comment) | DONE | case run: `case 1 true {"x":1,"closed":["tasks","career"]} true true` (open on an empty state; toggled keeps `x`; the command center and tasks open with `closed: ['career']`). `Focus.svelte:173-179`. Start open, reload and find-in-page: the look (cases 13, 24). |
| 2 The box and the flow (TickerGroup box, purple edge, editor spans both columns, old grid/facts/ol/when/Table/.career removed) | DONE | `{@render box('purple', content)}` at `CareerPanel.svelte:225`. `.body.wide { column-span: all }` at `:240-242`, and the editor's gap `.body.wide:not([hidden]) { padding-top: 4px }` at `:247-249` (repair round 1, item 4). `sed -n '/^<style>/,/^<\/style>/p' src/lib/views/boards/focus/career/CareerPanel.svelte \| grep -nE '\.(week\|grp\|category\|lbl\|sub\|career\|sections\|facts\|order\|when)\b\|Table'` prints nothing (exit 1); the selector lines of that `<style>` block are `.body.wide {` and `.body.wide:not([hidden]) {` and no other. The columns: the look (case 2). |
| 3 The groups and rows (NEXT, GOAL, SITUATION, ORDER OF WORK, TRACK RECORD; tails, tones, note line; nextLine/recordTable/career_next_line gone; daysLeft exported) | DONE | case run, "case 2" block (below). `grep -rn "nextLine\|recordTable\|RecordTable\|career_next_line" src tests config docs README.md` prints nothing. |
| 4 A press on a file row (career-text.ts, findCareer in draft-entry.ts, boundaries line, openFound shared, outcome line) | DONE | case run: `case 3 [{"line":24,...},{"line":25,...}] {"line":32,...} {"line":37,...}`; `case 4 ... {"line":2} {"line":4} {"line":6}`; `case 5 null`; `case 5 sentence {"ok":false,"sentence":"Now is no longer in career.yml","line":null}`; `case 20 {"line":26,"column":7}`; `case 23 {"line":1,...} {"line":3,...} {"line":4,...}`. The press itself: the look (case 14). |
| 5 Buttons under the pointer (Edit opens the editor on the field; `openOn` prop; Open link per distinct address) | DONE | case run "case 12" block: `acts=Edit(),example.org(Open https://example.org/a),foo.test(Open http://foo.test/b)` and `acts=Edit(),x.test(Open https://x.test)`. Scroll and focus: the look (case 7). |
| 6 Track record rows (first board of `boards:` taking the role and registered as a board; plain otherwise; Funding opens `funding`) | DONE | case run: `case 9 lead->projects supervisor->supervision collaborator->coauthor other->coauthor`; `case 9 none undefined`; `case 21 "projects"`; rows `career:role:other ... plain | acts=-`, `career:funding ... acts=-`. |
| 7 Edit in the heading row (FoldHead `end`; unfolds a folded banner and opens the editor) | DONE, label differs | `end={page === null ? undefined : edit}` at `CareerPanel.svelte:197`, `toggle` at `:137-144`. The label reads "Close editor" (`entry_form.edit_done`, as today), not "Done". The look (case 8). |
| 8 The words (HELP.md:287, head comments, four new keys, unread key removed) | DONE | `git diff --numstat`: `4 1 config/text/views/boards/focus.yml`, `1 1 docs/HELP.md`. `tests/checks/source/keys.test.ts` passed in the run below. |
| 9 TickerGroup.svelte (group, split, folded, note lines, after snippet, exported `box`; command center drawn through it; no box/group styles left in either view) | DONE | The same `<style>`-block grep over `CommandCenterView.svelte` prints nothing (exit 1); the selector lines of its `<style>` block are `.behind {`, `.lead {`, `.behind > .link,`, `.behind > .more {`, `.link {`, `.link:hover,` and `.link:focus-within {`, and of `CareerPanel.svelte`'s only the two `.body.wide` rules (row 2). svelte-check accepts the module export: `COMPLETED 538 FILES 0 ERRORS 0 WARNINGS`. Command center unchanged: the look (case 25). |
| Verify 1: `npm run diagrams && npm run test:quick` | DONE | `ok prettier`, `ok ASCII gate`, `ok svelte-kit sync`, `ok svelte-check ... 0 ERRORS 0 WARNINGS`, `ok eslint`, `ok vitest ... Duration 3.62s`, `ok vitest checks ... Duration 7.92s`, `test:quick: 22.8 s; every command passed`. |
| Verify 2: unused exports | DONE | `diff .agents/worktrees/O74-base/unused-exports.txt <new>` exit 0, so no line differs. |
| Verify 3: `sh utils/folder-check.sh` | DONE | exit 0. |
| Verify 4: G28 tests before and after | DONE | before: `Test Files 4 passed (4) / Tests 85 passed (85)`. After the last change: `Test Files 4 passed (4) / Tests 85 passed (85)`. |
| Verify 4 and case 26: G16 boundaries after the change | DONE | `Test Files 1 passed (1) / Tests 11 passed (11)`. The file's diff against the base copy is `309a310 > 'data/helpers/files/yaml/career-text',` and nothing else. |
| Verify 5: prose of HELP.md and head comments | DONE | read; see "Prose" below. |
| ASCII over touched files | DONE | `LC_ALL=C grep -n '[^ -~]'` over every changed and new file except the generated `.svg` files prints nothing; the list's ASCII gate passed. |

The case run after the last code change used the same scratch file (source at the end of this report), run as `npx vitest run tests/zz-o74/cases.test.ts`, with the file removed afterwards. Its output:

```
case 1 true {"x":1,"closed":["tasks","career"]} true true
case 3 [{"line":24,"column":7},{"line":25,"column":12}] {"line":32,"column":8} {"line":37,"column":13}
case 4 {"line":2,"column":13} {"line":4,"column":11} {"line":6,"column":5}
case 5 null
case 5 sentence {"ok":false,"sentence":"Now is no longer in career.yml","line":null}
case 6 -3 {"id":"career:next","glyph":"calendar","label":"M","tail":"2026-10-22, 3 days ago","tone":"red","actions":[{"id":"edit","label":"Edit"}]}
case 6 +10 {"id":"career:next","glyph":"calendar","label":"M","tail":"2026-11-04, in 10 days","tone":"amber","actions":[{"id":"edit","label":"Edit"}]}
case 6 +23 {"id":"career:next","glyph":"calendar","label":"M","tail":"2026-11-17, in 23 days","actions":[{"id":"edit","label":"Edit"}]}
case 6 none {"id":"career:next","glyph":"calendar","label":"M","actions":[{"id":"edit","label":"Edit"}]}
case 9 lead->projects supervisor->supervision collaborator->coauthor other->coauthor
case 9 none undefined
case 21 "projects"
case 12
Goal: {career:goal | see https://x.test. | tail=- | tone=- | acts=Edit(),x.test(Open https://x.test)}
Situation: {career:situation:Web | Web | tail=see https://example.org/a and http://foo.test/b, again https://example.org/a | tone=- | acts=Edit(),example.org(Open https://example.org/a),foo.test(Open http://foo.test/b)} {career:situation:Plain | Plain | tail=no address | tone=- | acts=Edit()}
case 2 (hub file, a scratch track record)
Next: {career:next | FWO Senior | tail=2026-11-17, in 23 days | tone=- | acts=Edit()}
Goal: {career:goal | Assistant professor / tenure-track (NL UD or Flemish ZAP) | tail=- | tone=- | acts=Edit()}
Situation: {career:situation:PhD | PhD | tail=May 2023, KU Leuven (Marc Van Hulle) | ...} {career:situation:Past | Past | ...} {career:situation:Now | Now | ...} {career:situation:Also | Also | ...}
Order of work: {career:order:0 | ERC Starting Grant | tail=Oct 2027 | tone=- | acts=Edit()}
Track record: {career:role:lead | Lead | tail=3 in review, 2 in flight | tone=- | acts=-} {career:role:other | Other | tail=1 in review | tone=- | plain | acts=-} {career:funding | Funding obtained | tail=1 | tone=- | acts=-}
case 14/18
Order of work: {career:order:0 | Review, first | tail=- | ...} {career:order:1 | Review | tail=- | ...} {career:order:2 | Ship | tail=Q3 | ...}
case 14 target career:order:0 {"key":"order","task":"Review","nth":0} {"line":2,"column":13}
case 14 target career:order:1 {"key":"order","task":"Review","nth":1} {"line":3,"column":5}
case 14 target career:order:2 {"key":"order","task":"Ship","nth":0} {"line":4,"column":13}
case 17 (no schema, editable false)
Next: {career:next | Fellowship application | tail=2027-10-15, in 355 days | tone=- | acts=-}
Goal: ... acts=-   Situation: Stage, Anchor ... acts=-   Order of work: three rows, the second "Draft the fellowship concept note, align with a host lab" ... acts=-
case 19 ["career:next","career:goal","career:situation:","career:situation:a","career:order:0","career:order:1","career:role:lead","career:funding"] unique true empty false
case 19 Situation: {career:situation: |  | tail=empty | tone=- | plain | acts=Edit()} ...
case 20 {"line":26,"column":7}
case 23 {"line":1,"column":27} {"line":3,"column":10} {"line":4,"column":11}
refusal {"code":"file_unparsed","line":2,"key":""} null {"code":"file_unparsed","line":1,"key":""}
```

The "..." marks shorten long rows above and are not output. Case 18: the `Ship` row with `note: ""` reads "Ship", and the dup text's `order_note: ""` gives no `[note: ...]` on the Order of work group. Case 4's text holds `{ task: Review }` (line 2), `task: Write` (3), `task: Review` (4) and `- Teach` (6).

Cases checked by reading, with the look on landing as their proof: 2 (the columns), 7, 8, 10, 11, 13, 15, 16, 22, 24 and 25 (see "Before and after"). Case 11 by reading: `trackRecord` returns null with no `self` (`career.ts:75`), `recordRows` then gives no rows (`career-rows.ts`, `recordRows`), and the group is not pushed; with no career file `career` is null and `CareerPanel.svelte:223` draws nothing.

Other tree checks run alone, after the last change, with `--testTimeout 0` as `test:checks` runs them:
- `tests/checks/source/history.test.ts`: "Tests 6 passed (6)". On HEAD its document case fails on `docs/HELP.md:287`, which held the date "2026-11-17" (`git show HEAD:docs/HELP.md | sed -n 287p | grep -o "[0-9]\{4\}-..."` prints `2026-11-17`). The rewritten line holds no date, so this case is now green.
- `tests/checks/tree/duplication.test.ts`: "Tests 1 failed | 17 passed (18)". The one hit is `src/lib/views/sources/data/Data.svelte:64 and src/lib/views/sources/venues/Venues.svelte:77 hold the same 6 lines`. Neither file is touched by this step.
- `tests/checks/tree/size.test.ts`, `imports/order.test.ts`, `source/keys.test.ts`, `imports/cycles.test.ts`: "Test Files 4 passed (4) / Tests 40 passed (40)".

## Files with line counts (`wc -l`, after the last change)

| File | Lines | Diff (added, removed) |
|---|---|---|
| `src/lib/data/helpers/files/yaml/career-text.ts` (new) | 100 | new |
| `src/lib/ui/display/ticker/TickerGroup.svelte` (new) | 183 | new |
| `src/lib/views/boards/focus/career/career-rows.ts` (new) | 257 | new |
| `src/lib/views/boards/focus/career/CareerPanel.svelte` | 245 | 168, 327 |
| `src/lib/views/boards/focus/CommandCenterView.svelte` | 296 | 138, 189 |
| `src/lib/views/boards/focus/Focus.svelte` | 282 | 15, 6 |
| `src/lib/state/boards/focus.ts` | 553 | 5, 2 |
| `src/lib/state/boards/career.ts` | 124 | 23, 82 |
| `src/lib/state/sessions/source/draft-entry.ts` | 136 | 45, 16 |
| `src/lib/views/shared/forms/entry-file.ts` | 162 | 21, 10 |
| `src/lib/views/shared/forms/entry/edit/EntryEditor.svelte` | 249 | 8, 1 |
| `src/lib/views/shared/forms/entry/edit/EntryForm.svelte` | 129 | 36, 13 |
| `config/text/views/boards/focus.yml` | 138 | 4, 1 |
| `docs/HELP.md` (line 287 only) | 568 | 1, 1 |
| `tests/checks/tree/boundaries.test.ts` | 858 | 1, 0 |
| `docs/diagrams/layer-state.*`, `layer-views.*`, `layers.*` (generated by `npm run diagrams`) | | 16, 16 over 6 files |

Every path is on the write list. The one edit to an existing test is the allow-list line in `boundaries.test.ts`: before, `'data/helpers/files/yaml/collection-text',` was followed by `'data/prose/latex',`; after, `'data/helpers/files/yaml/career-text',` sits between them. On the unchanged tree, with no import of `career-text`, the test has nothing to fail on (11 passed). The step adds no test.

## Judgment calls the brief left open

1. `{@render box(...)}` in `CommandCenterView.svelte:265` and `CareerPanel.svelte:224` carries `eslint-disable-next-line @typescript-eslint/no-unsafe-call`, with a reason. svelte-check types the snippet the module script exports (0 errors), but eslint's Svelte parser cannot resolve its type and reports "Unsafe call of a type that could not be resolved". The brief's stop names only a refusal by the type check or the build, and neither refused. This is a suppression of a lint rule on two lines; the orchestrator may reverse it, for example by making the box a wrapping component.
2. A "registered board view" is a registration whose `group` is `projects` (`viewFor(view)?.group === BOARD_GROUP`, `CareerPanel.svelte`), since `views/boards/projects/Projects.svelte` registers every board in that group and a view may not import another view. `roleBoard(config, role, isBoard)` lives in `state/boards/career.ts` and reads `boards:` with `boardRows` and `boardRuleOf`.
3. The caret goes where the entry's value starts on its key's line (`goal: |"Assistant`, column 7), or at the key when the value is on lines below or absent, and at a plain-string order row's start. A map order row opens at its `task:` pair. Edit in File places the caret after the first key; the brief named only the line.
4. Row ids: `career:next`, `career:goal`, `career:situation:<label>`, `career:order:<n>`, `career:role:<key>`, `career:funding`, each part URI-encoded. A fact with an empty label has the id `career:situation:` and is drawn plain (no press) but still carries Edit and any Open link. Two facts cannot share a label, since YAML refuses duplicate keys. Ids cannot collide across groups, since each group has its own second part.
5. Action ids: `edit` and `link:<address>`, the address taken back by `linkOf`. Edit has no hover title. An Open link's label is `new URL(address).host`, which keeps a port, and the address itself when `URL.canParse` refuses it or the host is empty.
6. The career file a press opens is `viewSourceFile('career', config, primary())`, so a file with no `schema:` opens too (case 17). The editor keeps `pageFile(client, page)` as before, so `page-file.ts`'s head comment stays true.
7. The heading Edit on a folded banner with the editor already open (unsaved edits) only unfolds it and does not close the editor. Opening from the heading clears the field a row's Edit named, so the editor then opens with no field focused.
8. The field is focused with `ui/frame/quiet-focus.ts` `focusFirstQuietly` (the first control Tab reaches, with no tooltip opened) after `scrollIntoView({ block: 'nearest' })`. Each field row is a plain `<div data-field>` wrapper with an `{@attach}` only on the named field. The wrapper adds one block element around each `Field` in all four forms; no stylesheet targets a form's direct children (`grep -rn "global(.field" src/lib/views src/lib/ui` prints nothing).
9. The banner's body no longer has its own 4px top padding: each group's `margin-top: 4px` gives the gap, as in the command center. The open editor spans both columns (`column-span: all`) and gets `padding-top: 4px` only while the body is shown (`.body.wide:not([hidden])`).
10. The order's note line is drawn when it holds anything other than spaces; the brief's case named only `""`.
11. `TickerGroup` takes `runs: {key, note?, rows}[]` and passes the ticker's own props through as `Omit<ComponentProps<typeof Ticker>, 'rows'>` spread onto each `Ticker`. Writing the props out again was reported as a copy of `Ticker.svelte`'s by `duplication.test.ts`.
12. The edge colour is a tone name (`'red'`, `'purple'`), drawn as `var(--c-<tone>)` through the custom property `--edge`.

## User-visible changes, for the look on landing (Focus on TEST, the hub's data)

- Banner, fresh Focus tab with no saved state: before, folded to one line. After, open (case 13). Fold it, reload: it stays folded. Move the tab to another pane: the fold is kept.
- Banner, open: before, a grid of sections (Goal, Next, Situation, Order of work, Track record table) with an Edit button at the top of the body. After, the command center's box with a purple left edge and two columns where the pane is wide, holding groups NEXT ("FWO Senior", tail "2026-11-17, in 23 days", no colour), GOAL, SITUATION (PhD, Past, Now, Also, each value as a muted tail), ORDER OF WORK ("ERC Starting Grant", tail "Oct 2027"), TRACK RECORD (one row per role, tail like "3 in review, 2 in flight", then Funding obtained when any). Edit is at the right of the heading row (case 2).
- Pointer over a NEXT, GOAL, SITUATION or ORDER row: an Edit button appears at the row's end. Not over a TRACK RECORD row (case 10).
- Press the GOAL row: `career.yml` opens kept, caret on line 24. NEXT gives line 25, Now line 32, ERC Starting Grant line 37 (case 14). Rename `Now` in an unsaved source tab of `career.yml`, then press Now: the tab is not moved and the outcome line under the quick add reads "Now is no longer in career.yml" (case 5).
- Edit on the GOAL row: the editor opens over both columns, with the Goal field in view and its control focused. Edit on a SITUATION row: the Situation field (case 7). The person page, the entry page and the project editor focus nothing when they open.
- Heading Edit while folded: the banner unfolds and the editor opens. While the editor is open, the heading button reads "Close editor"; pressed over unsaved edits it asks first (cases 8, 22).
- Press Lead in TRACK RECORD: the Projects board opens (case 16). Funding obtained opens the Funding view.
- Fold the banner, find a word of the goal with Cmd+F: the banner unfolds (case 24).
- Command center: same groups, rows, headings, category and run notes, gaps, two columns, red edge, HPC pill and closed Snoozed group as before; compare a screenshot taken before landing (case 25).
- Edit in File on a Funding card: opens `funding.yml` at the entry as before (case 15).
- An address in the career file (none in the hub's file today) is now text inside its row, with an Open link button per address under the pointer; before, it was a link.

## Wrong or impossible in the brief

- Item 7 and case 22 say the heading row reads "Done" while the editor is open, "as today". Today it reads `entry_form.edit_done`, which is "Close editor" (`config/text/views/shared/entry-form.yml:19`, unchanged). I kept today's key; the HELP sentence names "Close editor".
- The brief's HELP example "2026-11-17" is a date, which `tests/checks/source/history.test.ts` refuses in a document. That case fails on HEAD for the same reason. The rewritten line gives the tail as "the day followed by words such as "in 23 days" or "3 days ago"".

## Limitations, sharp edges, risks

- The build (`vite build`) was not run, and the list does not cover it. The module-script snippet export was checked only by svelte-check and the unit render of the tests the list chose.
- Nested `column-span` is not used: the spanning element is `.body`, a direct child of the box section. The two columns and the spanning editor are seen only at the look.
- A web address from the hub reaches only `window.open(address, '_blank', 'noopener,noreferrer')`. It is always `http://` or `https://` (`linkRuns`), and it is drawn as plain text in the row.
- Async: `pick` awaits `openFound`. Two quick presses open the tab twice, and the later place wins. A press whose answer comes after the banner closed still opens the tab and may set the outcome line.
- `duplication.test.ts` stays red on the Data/Venues pair, which this step does not touch. It is named here, not changed.

## Prose

The HELP line and the head comments were read against the rules file. Plain ASCII, no em dash, no quip, no "not X but Y". The HELP paragraph runs long sentences joined by semicolons, as the rest of that line does. History-word grep over every added comment line and the HELP line: hits "no longer" (rewritten to "does not hold"), "the one before it" (spatial, kept) and the example date (removed). After that, `history.test.ts` passes (6 of 6).

Head comments and docs, after the change: `CareerPanel.svelte` rewritten; `Focus.svelte` rewritten (para 2); `CommandCenterView.svelte` rewritten; `career.ts` rewritten; `focus.ts` `FoldKey` doc rewritten; `draft-entry.ts` rewritten; `entry-file.ts` rewritten; `EntryEditor.svelte` and `EntryForm.svelte` gained a paragraph; `FoldHead.svelte:2-13` still true; `Ticker.svelte:1-14` still true; `page-file.ts:1` still true; `docs/templates.md:92,1415`, `docs/data-map.md:54,62`, `config/catalogs/vocab.yml:109`, `config/defaults/sources.yml:52` still true. `docs/apps.md` is unaffected (no app-facing change).

Reuse greps: `grep -rn "FOCUSABLE\|focusableIn\|tabindex\]:not" src/lib` found `quiet-focus.ts`, now reused. `grep -rn "boardRows" src` found `takes.ts`, reused. `afterFirstKey` in `collection-text.ts` is private, and `career-text.ts` places the caret at the value instead (judgment call 3). The unused-exports diff against the base is empty, after `linkActions`, `nextTail`, `CareerTarget` and `CareerGroup` were made module-local.

## Runs

- The verify list (`npm run diagrams && npm run test:quick`) ran twice. Both runs were green. Changes made after the first run, prompted by `history.test.ts` and `duplication.test.ts` (which the list does not select), needed the second run, after the last change.
- One `vitest run` with `--dir` pointed at the scratchpad (`npx vitest run --dir <scratchpad>/o74 --project unit`) was started to run a case file outside the tree. It printed nothing, spawned workers for over five minutes, and was stopped with TaskStop. What it scanned is not verified, so it may have run test files of the tree beyond the scratch file. No other whole-suite command was run.

Case-run source, used for both runs after the change; it lived only as `tests/zz-o74/cases.test.ts` for the length of each run and in the scratchpad: `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o74/cases.test.ts`. It imports `foldOpen`, `foldToggled`, `roleBoard`, `careerAt`, `findCareer`, the career normaliser and `careerRows`, prints each case's result and ends with `expect(out.join('\n')).toBe('')`, so the output is the assertion's diff.

# Repair round 1

Everything in the round brief is done. Nothing is left undone. The first build's file-changing programs are listed below for the orchestrator's read of each hunk; none of those hunks was changed for item 1.

## Items

| Item | State | Proof (command and output) |
|---|---|---|
| 1 Programs of the first build listed | DONE | Section "Programs of the first build" below: 38 programs, each command quoted whole with the files it changed and today's `file:line` ranges. Read from the build's transcript with `jq` over `subagents/agent-a3f212aba186ea413.jsonl` (every Bash call matching `python3 -`, `python3 /`, `sed -i`, `rewrap`, `cat >`, `prettier --write`, `rm`, `cp`, `npm run diagrams` or a redirect into a file). Ranges from `git diff -U0 a5387bdc` hunk headers and `grep -n` of each inserted text in today's tree. |
| 2 The case-run source quoted | DONE | Section "Case-run programs" below quotes the whole of `<scratchpad>/o74/cases.test.ts` (64 lines; `shasum` `4a19c9a995a1ecceb1a8c730dbe9bc89a8e9a250`, the same digest as the heredoc body of the build's call that wrote it) and the whole of the first-run program. This round ran no case-run program. |
| 3 Quoted proofs print what the report says | DONE | DONE rows 2 and 9 of the first section are rewritten to a grep over the `<style>` block alone, and row 7 now names `toggle` at `CareerPanel.svelte:137-144`. Output below. |
| 4 A folded banner with its editor open is no taller than the command center | DONE | `CareerPanel.svelte:239-249` now holds `.body.wide { column-span: all; }` and `.body.wide:not([hidden]) { padding-top: 4px; }`, each with its comment; the second comment says the gap is drawn only while the body is shown, since a body hidden until found still draws its padding and would make the folded box taller than the command center's. The base drew the same guard as `.body:not([hidden])` (`O74-base/src/lib/views/boards/focus/career/CareerPanel.svelte:261-265`). The height itself is seen only at the look. |

Item 3, the checks as quoted and their output:

```
$ grep -n "function toggle" src/lib/views/boards/focus/career/CareerPanel.svelte
137:    function toggle(): void {
$ for f in src/lib/views/boards/focus/career/CareerPanel.svelte src/lib/views/boards/focus/CommandCenterView.svelte; do echo "== $f, selector lines of the <style> block"; sed -n '/^<style>/,/^<\/style>/p' $f | grep -E '^\s+[.:a-z][^;]*[{,]\s*$'; echo "== $f, old box/group/section rules in the <style> block"; sed -n '/^<style>/,/^<\/style>/p' $f | grep -nE '\.(week|grp|category|lbl|sub|career|sections|facts|order|when)\b|Table'; echo "grep exit $?"; done
== src/lib/views/boards/focus/career/CareerPanel.svelte, selector lines of the <style> block
    .body.wide {
    .body.wide:not([hidden]) {
== src/lib/views/boards/focus/career/CareerPanel.svelte, old box/group/section rules in the <style> block
grep exit 1
== src/lib/views/boards/focus/CommandCenterView.svelte, selector lines of the <style> block
    .behind {
    .lead {
    .behind > .link,
    .behind > .more {
    .link {
    .link:hover,
    .link:focus-within {
== src/lib/views/boards/focus/CommandCenterView.svelte, old box/group/section rules in the <style> block
grep exit 1
```

## Verify, once after the last change

```
$ npm run diagrams && npm run test:quick -- --base a5387bdc
test:quick: 23 changed file(s), from git since a5387bdc
test:quick: 3 test file(s)
        tests/checks/tree/boundaries.test.ts: changed
        tests/data/sources/career.test.ts: named for a changed file
        tests/state/boards/board/board-rules.test.ts: imports at depth 1
ok      ASCII gate (0.6 s)
ok      prettier (1.6 s): All matched files use Prettier code style!
ok      svelte-kit sync (2.2 s)
ok      eslint (9.3 s)
ok      vitest (14.3 s): Duration  5.23s (transform 4.82s, setup 0ms, import 6.86s, tests 404ms, environment 1ms)
ok      vitest checks (17.8 s): Duration  8.70s (transform 1.01s, setup 0ms, import 3.53s, tests 5.00s, environment 0ms)
ok      svelte-check (18.6 s): 1792933492047 COMPLETED 538 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
test:quick: 21.0 s; every command passed
test:quick: not covered: tests that reach no changed file within the import depth,
            the build, the lint of unchanged files
$ git diff --stat a5387bdc -- docs/diagrams | tail -1
 6 files changed, 16 insertions(+), 16 deletions(-)
$ sh utils/folder-check.sh; echo "folder-check exit $?"
folder-check exit 0
$ diff .agents/worktrees/O74-base/unused-exports.txt <(sh utils/unused-exports.sh); echo "unused-exports diff exit $?"
unused-exports diff exit 0
$ LC_ALL=C grep -n '[^ -~]' src/lib/views/boards/focus/career/CareerPanel.svelte .scratch/migration/agents/reviews/O74-report.md; echo "ascii grep exit $?"
ascii grep exit 1
```

The unused-exports listing went through a process substitution, so no file was written. The verify list ran once in this round. No whole-suite command ran.

## Files changed in this round

| File | Lines (`wc -l`) |
|---|---|
| `src/lib/views/boards/focus/career/CareerPanel.svelte` | 250 |
| `.scratch/migration/agents/reviews/O74-report.md` (this report: this section, and rows 2, 7 and 9 and judgment call 9 of the first section) | see the file |

Both were changed with the Edit tool. No other file changed in this round.

## Programs of the first build

Every program of the first build that changed a file, in the order it ran, with its time (UTC) from the transcript. `$S` is `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o74`, and every command started with `cd /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O74 &&` unless it says otherwise. The ranges are lines of today's tree. Three files were written whole with the Write tool before any program touched them, so their content is the Write call's plus the programs listed: `career-text.ts` (12:16:16), `career-rows.ts` (12:18:03), `TickerGroup.svelte` (12:18:54) and `CareerPanel.svelte` (12:19:56).

Against the base, the hunks of `git diff -U0 a5387bdc` lie only inside the ranges below and inside those four files; no hunk lies in a line no program or Write call wrote.

### P1, 12:08:14, a probe in the scratchpad (changed only `$S/tests/probe.test.ts`, removed by P21)

```
S=/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o74; mkdir -p $S/tests && cat > $S/tests/probe.test.ts <<'EOF'
import { expect, it } from 'vitest';
import { foldOpen } from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O74/src/lib/state/boards/focus.ts';
it('runs', () => { console.log('foldOpen', foldOpen({}, 'command')); expect(1).toBe(1); });
EOF
cd /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O74 && export PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH && timeout 300 npx vitest run --dir $S --project unit 2>&1 | tail -15
```

This is the `--dir` run the first section names; it was stopped with TaskStop.

### P2, 12:15:00, the first-run case program (wrote `tests/zz-o74/cases.test.ts` in the worktree; P3 removed it)

The command is quoted whole in "Case-run programs", A1. Today's tree: no line (`git status --short` lists no `tests/zz-o74`).

### P3, 12:15:12, removal of P2's folder

```
rm -r tests/zz-o74 && export PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH && npx vitest run tests/checks/tree/boundaries.test.ts 2>&1 | grep -E "Test Files|Tests |FAIL|passed|failed" | head
```

### P4, 12:16:25, `src/lib/data/helpers/files/yaml/career-text.ts`

```
python3 - <<'EOF'
p='src/lib/data/helpers/files/yaml/career-text.ts'
s=open(p).read()
s=s.replace("""    const pair = pairOf(root as YAMLMap, at.key) as Pair<Scalar, unknown> | undefined;
    if (pair === undefined) return null;""","""    const pair = pairNamed(root, at.key);
    if (pair === undefined) return null;""")
s=s.replace("import type { Node, Pair, Scalar, YAMLMap } from 'yaml';","import type { Node, Pair, YAMLMap } from 'yaml';")
s=s.replace("import { columnOf, pairOf, rangeOf } from './yaml-ranges.ts';","import { columnOf, rangeOf } from './yaml-ranges.ts';")
s=s.replace("""// string, as the model reads it. The text rules of the collection files are collection-text.ts
// beside this file; a text that does not parse is refused with that file's refusal, so one module
// words both.""","""// string, as the model reads it. The text rules of the collection files are collection-text.ts
// beside this file; a text that does not parse is refused with that file's `EntryRefusal`, so
// state/sessions/source/draft-entry.ts words the refusals of both alike.""")
open(p,'w').write(s)
EOF
grep -n "pairOf\|Scalar" src/lib/data/helpers/files/yaml/career-text.ts
```

Today: `career-text.ts:11-13`, `:16` (changed again by P19), `:19`, `:92`.

### P5, 12:16:37, `src/lib/state/sessions/source/draft-entry.ts`

```
python3 - <<'EOF'
p='src/lib/state/sessions/source/draft-entry.ts'
s=open(p).read()
old_head=s[:s.index("import type { SchemaField }")]
new_head="""// Layer 2, client state. A collection entry placed in, or found in, the unsaved text of a source
// tab, and a section of the career file found in it: a lead's `applied` control puts an
// application entry into the Applications file's text, Edit in File finds the entry the card
// draws, and a press on a row of the Focus board's career banner finds the section the row names.
// The text rules (where the entry goes, which fields it starts with, where an existing entry
// stands) are data/helpers/files/yaml/collection-text.ts, and the career file's (where a section
// stands) data/helpers/files/yaml/career-text.ts; this module reads the draft, refuses a draft
// whose text differs from the disk's, makes the edit through the source store and words what it
// cannot do.
//
// They run synchronously from the draft they are given, so two presses whose reads were in flight
// together place one entry and the second finds it untouched.

"""
s=new_head+s[len(old_head):]
s=s.replace("""} from '../../../data/helpers/files/yaml/collection-text.ts';
""","""} from '../../../data/helpers/files/yaml/collection-text.ts';
import { careerAt, type CareerAt } from '../../../data/helpers/files/yaml/career-text.ts';
""")
s=s.replace("""import type { SourceStore } from './source.svelte.ts';
""","""import type { SourceStore } from './source.svelte.ts';

// The boundary table lets `views/` import `state/` and nothing of `data/`, so the section a career
// row names reaches it from here.
export type { CareerAt } from '../../../data/helpers/files/yaml/career-text.ts';
""")
old=s[s.index("/** Where an entry stands in the tab's text, or why it is not found. */"):]
new="""/**
 * The answer of a search: the place found, the sentence of a refusal, or, when the text does not
 * hold what `label` names, `collection.entry_gone` naming it and the file.
 */
function answered(found: TextPlace | EntryRefusal | null, label: string, file: string): EntryAnswer {
    if (found === null) {
        return { ok: false, sentence: t('collection.entry_gone', label, nameOf(file)), line: null };
    }
    if ('code' in found) return refused(found, file);
    return { ok: true, line: found.line, column: found.column };
}

/** Where an entry stands in the tab's text, or why it is not found. */
export function findEntry(source: DraftSource, id: string, at: EntryAt): EntryAnswer {
    const draft = source.sourceDraft(id);
    const found =
        'index' in at
            ? entryAtIndex(draft.text, at.index)
            : entryAt(draft.text, at.field, at.value, at.nth ?? 0);
    return answered(found, at.label, draft.file);
}

/**
 * Where a section of the career file stands in the tab's text, or why it is not found; `label` is
 * what the sentence names the section by.
 */
export function findCareer(
    source: DraftSource,
    id: string,
    at: CareerAt,
    label: string
): EntryAnswer {
    const draft = source.sourceDraft(id);
    return answered(careerAt(draft.text, at), label, draft.file);
}
"""
s=s.replace(old,new)
open(p,'w').write(s)
EOF
tail -5 src/lib/state/sessions/source/draft-entry.ts
```

Today: `draft-entry.ts:1-11` (rewrapped by P27), `:21`, `:24-27`, `:98-136`.

### P6, 12:16:42, `tests/checks/tree/boundaries.test.ts`

```
python3 - <<'EOF'
p='tests/checks/tree/boundaries.test.ts'
s=open(p).read()
old="        'data/helpers/files/yaml/collection-text',\n"
assert s.count(old)==1
s=s.replace(old, old+"        'data/helpers/files/yaml/career-text',\n")
open(p,'w').write(s)
EOF
diff /Users/axelfaes/workspace/oculus/.agents/worktrees/O74-base/tests/checks/tree/boundaries.test.ts tests/checks/tree/boundaries.test.ts
```

Today: `boundaries.test.ts:310`.

### P7, 12:16:51, `src/lib/views/shared/forms/entry-file.ts`

```
python3 - <<'EOF'
p='src/lib/views/shared/forms/entry-file.ts'
s=open(p).read()
old_head=s[:s.index("import { tick }")]
new_head="""// Layer 3, shared view support. What Edit in File, a lead's `applied` control and a press on a row
// of the Focus board's career banner do: open the YAML file in a source tab and put the caret where
// the entry or the section is, or in a new entry placed in the tab's unsaved text. The text rules
// and the refusals are state/sessions/source/draft-entry.ts; this opens the tab around them
// (`openFound`, which Edit in File and the career banner share). The Add of a collection, a
// registry view, the leads feed and Lit Watch writes the entry itself and opens its page
// (entry/entry-add.ts).
//
// The tab is kept, so a single click elsewhere cannot point a preview tab at another file and drop
// the new entry with it. The place is opened as an empty range, which the editor's range command
// makes a caret, and asking the same place twice goes there again.

"""
s=new_head+s[len(old_head):]
old=s[s.index("/**\n * Open a file at an entry."):s.index("/**\n * Which entry of a file Edit in File opens at")]
new="""/**
 * Open a file at a place found in its text: the tab opened and kept, its draft read, `find` asked
 * for the place in the tab's text by the tab's id, and the tab opened there. The sentence is the
 * one `find` answers when the text does not hold the place, in which case no line is given, so a
 * tab newly opened shows the file's top and one already open stays where it was; '' otherwise,
 * and '' when no tab could be opened.
 */
export async function openFound(
    client: ClientState,
    file: ViewSource,
    find: (tab: string) => EntryAnswer
): Promise<string> {
    const id = await openedDraft(client, file, (one) => openSourceFile(client, one));
    if (id === '') return '';
    return arrived(client, file, find(id));
}

"""
s=s.replace(old,new)
s=s.replace("""    const sentence = await editInFile(client, file, entryTarget(entry, schema, fault));""","""    const at = entryTarget(entry, schema, fault);
    const sentence = await openFound(client, file, (tab) => findEntry(client.source, tab, at));""")
open(p,'w').write(s)
EOF
grep -n "editInFile\|openFound" src/lib/views/shared/forms/entry-file.ts
```

Today: `entry-file.ts:1-11` (rewrapped by P27), `:91-107` (its doc comment replaced by P8), `:138-139`.

### P8, 12:16:58, `src/lib/views/shared/forms/entry-file.ts`

```
python3 - <<'EOF'
p='src/lib/views/shared/forms/entry-file.ts'
s=open(p).read()
old=""" * Open a file at a place found in its text: the tab opened and kept, its draft read, `find` asked
 * for the place in the tab's text by the tab's id, and the tab opened there. The sentence is the
 * one `find` answers when the text does not hold the place, in which case no line is given, so a
 * tab newly opened shows the file's top and one already open stays where it was; '' otherwise,
 * and '' when no tab could be opened.
 */"""
new=""" * Open a file at a place found in its text: the tab opened and kept, its draft read, `find` asked
 * for the place in the tab's text by the tab's id, and the tab opened there. When `find` answers no
 * place, the sentence is its answer's, and the tab is opened at the line a refusal names, or with
 * no line when the text does not hold the place, so a tab newly opened shows the file's top and one
 * already open stays where it was. The sentence is '' when the place is found, and when no tab
 * could be opened.
 */"""
assert old in s
s=s.replace(old,new)
open(p,'w').write(s)
EOF
```

Today: `entry-file.ts:92-98`.

### P9, 12:17:03, `src/lib/state/boards/focus.ts`

```
python3 - <<'EOF'
p='src/lib/state/boards/focus.ts'
s=open(p).read()
old="""/** The two sections of the Focus board that fold, by the key their closed state is kept under. */
export type FoldKey = 'command' | 'tasks';"""
new="""/**
 * The three sections of the Focus board that fold, the career banner, the command center and the
 * tasks, by the key their closed state is kept under.
 */
export type FoldKey = 'career' | 'command' | 'tasks';"""
assert old in s
s=s.replace(old,new)
open(p,'w').write(s)
EOF
grep -n "fold\|Fold" src/lib/state/boards/focus.ts | head -20; sed -n 1,30p src/lib/state/boards/focus.ts | grep -n -i "fold"
```

Today: `focus.ts:532-536`.

### P10, 12:17:13, `src/lib/state/boards/career.ts`

```
python3 - <<'EOF'
p='src/lib/state/boards/career.ts'
s=open(p).read()
head_old=s[:s.index("import type { Career, Id, Snapshot }")]
head_new="""// Layer 2, client state. The Career banner's arithmetic: the days left to the next milestone, the
// track record, the user's projects counted by the record rows of `categories:` for each role, and
// the funding the user leads that was obtained, and the board a role's row of the track record
// opens.
//
// Pure over the snapshot, the merged config and the day the caller passes. A project's category
// and role are read with the boards' own rule (data/shapes/boards/categories.ts `categoryOf`,
// takes.ts `projectRole`), so the track record counts a project where every board files it, and a
// role's board is read from `boards:` with the rule every board is read with (takes.ts
// `boardRuleOf`). The words come from the catalog through `t`, and a category's and a role's words
// from their rows.

"""
s=head_new+s[len(head_old):]
s=s.replace("import { projectRole } from '../../data/shapes/boards/takes.ts';","import { boardRows, boardRuleOf, projectRole } from '../../data/shapes/boards/takes.ts';")
s=s.replace("function daysLeft(date: string, now: number): string {","export function daysLeft(date: string, now: number): string {")
a=s.index("/**\n * The banner's Next line:")
b=s.index("/** One line of a role's track record")
s=s[:a]+s[b:]
a=s.index("/**\n * One column of the track record's table")
s=s[:a]+"""/**
 * The board a role's row of the track record opens: the first key of the merged `boards:`, in its
 * order, whose `role` (a word or a list) holds the role's key and that `isBoard` says is a
 * registered board view; nothing when no board takes the role. A board that names no `role` holds
 * no role.
 */
export function roleBoard(
    config: Record<string, unknown>,
    role: string,
    isBoard: (view: string) => boolean
): string | undefined {
    const found = boardRows(config).find(
        ([id, row]) => (boardRuleOf(row).roles ?? []).includes(role) && isBoard(id)
    );
    return found?.[0];
}
"""
open(p,'w').write(s)
EOF
grep -n "^export\|^type\|^const\|^function" src/lib/state/boards/career.ts
```

Today: `career.ts:1-10` (rewrapped by P27), `:15`, `:32`, the removal of `nextLine` after `:40`, the removal of `recordTable` and its types with `roleBoard` in their place at `:109-124`. `:12` is P20's.

### P11, 12:17:18, `config/text/views/boards/focus.yml`

```
python3 - <<'EOF'
p='config/text/views/boards/focus.yml'
s=open(p).read()
s=s.replace("        career_next_line: '{0} on {1}, {2}'\n","        career_next_tail: '{0}, {1}'\n")
s=s.replace("        career_order_glyph: list\n","        career_open_link: 'Open {0}'\n        career_order_glyph: list\n")
s=s.replace("        career_record: Track record\n","        career_record: Track record\n        career_record_count: '{0} {1}'\n")
s=s.replace("        career_situation_glyph: info\n","        career_situation_glyph: info\n        career_task_note: '{0}, {1}'\n")
open(p,'w').write(s)
EOF
sed -n 8,30p config/text/views/boards/focus.yml; grep -n "order_of_work\|^        next:" config/text/views/boards/focus.yml
```

Today: `focus.yml:18-19`, `:22`, `:26`.

### P12, 12:18:23, `src/lib/views/boards/focus/career/career-rows.ts`

```
python3 - <<'EOF'
p='src/lib/views/boards/focus/career/career-rows.ts'
s=open(p).read()
a=s.index("/** An id of a row: `career:` and its parts")
s=s[:a]+'''/** An id of a row: `career:` and its parts, each part URI-encoded. */
function idOf(...parts: string[]): string {
    return ['career', ...parts.map((part) => encodeURIComponent(part))].join(':');
}

/** A section of the file a row opens at, under the words a sentence names it by. */
function inFile(at: CareerAt, label: string, field: string): CareerTarget {
    return { kind: 'file', at, label, field };
}

/** The Next row, the milestone, when the file names one. */
function nextRows(input: CareerInput, make: Builder, glyph: string): TickerRow[] {
    const { milestone, milestoneDate } = input.career;
    if (milestone === undefined) return [];
    const row = {
        id: idOf('next'),
        glyph,
        label: milestone,
        ...nextTail(milestoneDate, input.now)
    };
    return [make.file(row, inFile({ key: MILESTONE }, milestone, MILESTONE))];
}

/** The Goal row, when the file names a goal. */
function goalRows(input: CareerInput, make: Builder, glyph: string): TickerRow[] {
    const goal = input.career.goal;
    if (goal === undefined) return [];
    return [make.file({ id: idOf(GOAL), glyph, label: goal }, inFile({ key: GOAL }, goal, GOAL))];
}

/**
 * One row per fact of the situation, its label as its words and its value as its tail. A fact with
 * an empty label is drawn plain, since a press on it would name no key of the file.
 */
function factRows(input: CareerInput, make: Builder, glyph: string): TickerRow[] {
    return input.career.situation.map((fact) => {
        const row = make.file(
            { id: idOf(SITUATION, fact.label), glyph, label: fact.label, tail: fact.value },
            inFile({ key: SITUATION, fact: fact.label }, fact.label, SITUATION)
        );
        return fact.label === '' ? { ...row, plain: true } : row;
    });
}

/**
 * One row per task of the order of work, its words the task followed by its note when it has one,
 * its tail its `when`. A row opens at the task's rank among the rows with that task, so two rows
 * with one task each open at their own line.
 */
function orderRows(input: CareerInput, make: Builder, glyph: string): TickerRow[] {
    const order = input.career.order;
    return order.map((one, at) => {
        const rank = order.slice(0, at).filter((other) => other.task === one.task).length;
        const note = one.note ?? '';
        const label = note === '' ? one.task : t('focus.career_task_note', one.task, note);
        return make.file(
            { id: idOf(ORDER, String(at)), glyph, label, tail: one.when },
            inFile({ key: ORDER, task: one.task, nth: rank }, one.task, ORDER)
        );
    });
}

/**
 * One row per role of the track record, its tail the count of each record row the role has
 * projects in, `<count> <row label>`, joined by commas; then, when funding is obtained, the row
 * Funding obtained with its count. A role opens its board, and is plain when no board takes it.
 */
function recordRows(input: CareerInput, make: Builder, glyph: string): TickerRow[] {
    const record = input.record;
    if (record === null) return [];
    const roles = record.roles.map((role) => {
        const tail = role.lines
            .filter((line) => line.count > 0)
            .map((line) => t('focus.career_record_count', line.count, line.label))
            .join(', ');
        const row = { id: idOf('role', role.key), glyph, label: role.label, tail };
        return make.view(row, input.boardOf(role.key));
    });
    if (record.funding === 0) return roles;
    const funding = {
        id: idOf(FUNDING),
        glyph,
        label: t('focus.career_funding_row'),
        tail: String(record.funding)
    };
    return [...roles, make.view(funding, FUNDING)];
}

/**
 * The groups of the banner in order, NEXT, GOAL, SITUATION, ORDER OF WORK and TRACK RECORD, each
 * only when it has a row; the order's own note is the ORDER OF WORK group's note line, when it
 * holds words.
 */
export function careerRows(input: CareerInput): CareerRows {
    const make = builder(input);
    const groups: CareerGroup[] = [];
    const parts: [string, string, string, typeof nextRows][] = [
        ['next', t('focus.next'), t('focus.career_next_glyph'), nextRows],
        [GOAL, t('focus.career_goal'), t('focus.career_goal_glyph'), goalRows],
        [SITUATION, t('focus.career_situation'), t('focus.career_situation_glyph'), factRows],
        [ORDER, t('focus.order_of_work'), t('focus.career_order_glyph'), orderRows],
        ['record', t('focus.career_record'), t('focus.career_record_glyph'), recordRows]
    ];
    for (const [key, label, glyph, rowsOf] of parts) {
        const rows = rowsOf(input, make, glyph);
        if (rows.length > 0) groups.push({ key, label, glyph, rows });
    }
    const note = input.career.orderNote ?? '';
    const order = groups.find((one) => one.key === ORDER);
    if (order !== undefined && note.trim() !== '') order.note = note;
    return { groups, targets: make.targets };
}
'''
s=s.replace("""/** The rows of the banner, built group by group with the index of what each row opens. */
function builder(input: CareerInput) {""","""/** What builds the rows and fills the index of what each opens. */
type Builder = {
    targets: Record<string, CareerTarget | undefined>;
    file: (row: TickerRow, target: CareerTarget) => TickerRow;
    view: (row: TickerRow, view: string | undefined) => TickerRow;
};

/** The rows of the banner, built group by group with the index of what each row opens. */
function builder(input: CareerInput): Builder {""")
open(p,'w').write(s)
EOF
wc -l src/lib/views/boards/focus/career/career-rows.ts
```

Today: `career-rows.ts:118-126`, `:146-257`.

### P13, 12:18:32, `src/lib/views/boards/focus/career/career-rows.ts`

```
sed -i '' 's/^export function linkActions/function linkActions/; s/^export function nextTail/function nextTail/' src/lib/views/boards/focus/career/career-rows.ts && grep -n "^export" src/lib/views/boards/focus/career/career-rows.ts
```

Today: `career-rows.ts:91`, `:111`.

### P14, 12:19:21, `src/lib/views/boards/focus/CommandCenterView.svelte`

```
python3 - <<'EOF'
p='src/lib/views/boards/focus/CommandCenterView.svelte'
s=open(p).read()
s=s.replace("""    // Layer 3, focus view partial. Command-center groups and their actions live here because visual
    // grouping changes independently of ticker calculation and writes.
""","""    // Layer 3, focus view partial. Command-center groups and their actions live here because visual
    // grouping changes independently of ticker calculation and writes. The groups and the box they
    // stand in, with its red left edge, are drawn by ui/display/ticker/TickerGroup.svelte, which the
    // career banner draws with too, so their look is written there once; this file keeps the look of
    // its own content, the Needs attention group's lines of projects behind their documents and of
    // projects no lane shows.
""")
s=s.replace("""    import Glyph from '$lib/ui/display/Glyph.svelte';
    import Ticker from '$lib/ui/display/ticker/Ticker.svelte';
""","""    import Glyph from '$lib/ui/display/Glyph.svelte';
    import TickerGroup, { box } from '$lib/ui/display/ticker/TickerGroup.svelte';
""")
a=s.index("{#snippet group(label: string, glyph: string, rows: TickerRow[])}")
b=s.index("<style>")
new='''{#snippet group(label: string, glyph: string, rows: TickerRow[])}
    {#if rows.length > 0}
        <TickerGroup
            {label}
            {glyph}
            runs={[{ key: label, rows }]}
            {onpick}
            {onaction}
            reveal
            kept={view.kept}
            {marked}
        />
    {/if}
{/snippet}

{#snippet kindGroups(label: string, glyph: string, groups: RowGroup[])}
    {#if groups.length > 0}
        <TickerGroup
            {label}
            {glyph}
            runs={groups.map((one) => ({ key: one.kind, note: runHeading(one), rows: one.rows }))}
            {onpick}
            {onaction}
            reveal
            kept={view.kept}
            {marked}
        />
    {/if}
{/snippet}

{#snippet behind()}
    {#if week?.behind}
        <div class="behind">
            <span class="lead"
                ><Glyph name={t('board.stale_glyph')} />
                <b>{week.behind.count} {manifestWord(week.behind.count)}</b></span
            >
            {t('focus.command.behind_refresh')}
            <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
            {@render links(week.behind.projects, week.behind.more)}
        </div>
    {/if}
    {#if week?.unplaced}
        <div class="behind">
            <span class="lead"
                ><Glyph name={t('focus.command.unplaced_glyph')} />
                <b>{week.unplaced.count}</b></span
            >
            <span>
                {#if week.unplaced.count === 1}
                    <!-- eslint-disable-next-line svelte/no-at-html-tags -- a catalog line, which oculus wrote -->
                    {@html t('focus.command.unplaced_one')}
                {:else}
                    <!-- eslint-disable-next-line svelte/no-at-html-tags -- a catalog line, which oculus wrote -->
                    {@html t('focus.command.unplaced_many')}
                {/if}
            </span>
            <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
            {@render links(week.unplaced.projects, week.unplaced.more)}
        </div>
    {/if}
{/snippet}

{#snippet content()}
    <FoldHead
        glyph={t('focus.command.command_center_glyph')}
        title={t('focus.command.command_center')}
        name={t('focus.command.command_center')}
        {open}
        {ontoggle}
        end={pillText() === '' ? undefined : pill}
    />
    {#if open}
        <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
        {@render group(
            t('focus.command.grp_overdue_label'),
            t('focus.command.grp_overdue_glyph'),
            view.overdue
        )}
        {#if needsAttention}
            <TickerGroup
                label={t('focus.command.grp_attention_label')}
                glyph={t('focus.command.grp_attention_glyph')}
                runs={attentionRows.length > 0 ? [{ key: 'attention', rows: attentionRows }] : []}
                onpick={onattention}
                after={behind}
            />
        {/if}
        {#if view.categories.length > 0}
            <!-- The group may run on into the second column, a category at a time. -->
            <TickerGroup
                label={t('focus.command.grp_deadlines_label')}
                glyph={t('focus.command.grp_deadlines_glyph')}
                runs={view.categories.map((one) => ({
                    key: one.category,
                    note: categoryLabel(one.category),
                    rows: one.rows
                }))}
                split
                {onpick}
                {onaction}
                reveal
                kept={view.kept}
                {marked}
            />
        {/if}
        <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
        {@render kindGroups(
            t('focus.command.grp_subtask_dl_label'),
            t('focus.command.grp_subtask_glyph'),
            view.subtaskDated
        )}
        <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
        {@render group(
            t('focus.command.grp_followups_label'),
            t('focus.command.grp_followups_glyph'),
            view.followups
        )}
        {#if refreshRows.length > 0}
            <TickerGroup
                label={t('focus.command.grp_refresh_label')}
                glyph={t('focus.command.refresh_glyph')}
                runs={[{ key: 'refresh', rows: refreshRows }]}
                onpick={onrefresh}
            />
        {/if}
        {#if view.snoozed.length > 0}
            <TickerGroup
                label={t('focus.command.snoozed', view.snoozed.length)}
                glyph={t('focus.command.snoozed_glyph')}
                runs={[{ key: 'snoozed', rows: view.snoozed }]}
                folded
                {onpick}
                {onaction}
                reveal
                kept={view.kept}
                {marked}
            />
        {/if}
    {/if}
{/snippet}

{#if anything}
    <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
    {@render box('red', content)}
{/if}

'''
s=s[:a]+new+s[b:]
a=s.index("<style>")
s=s[:a]+'''<style>
    /* A needs-attention line is one sentence that wraps as text: the glyph and the count at its
       start, kept on one line together, the projects at its end, each piece kept in its place on a
       narrow pane. It is a row of the Command Center, so it takes a ticker row's height, size and
       line (`Ticker.svelte`), and the project links inherit them. */
    .behind {
        min-height: calc(18px * var(--text-scale, 1));
        font-size: var(--fs-xs);
        line-height: calc(14px * var(--text-scale, 1));
    }
    .lead {
        white-space: nowrap;
    }
    .behind > .link,
    .behind > .more {
        margin-left: 5px;
    }

    /* A project behind its documents opens from its name, drawn as a link: the accent colour, an
       underline under the pointer and with the focus. */
    .link {
        color: var(--accent-txt, var(--accent));
    }
    .link:hover,
    .link:focus-within {
        text-decoration: underline;
    }
</style>
'''
open(p,'w').write(s)
EOF
wc -l src/lib/views/boards/focus/CommandCenterView.svelte; grep -n "Ticker\b\|<Ticker" src/lib/views/boards/focus/CommandCenterView.svelte
```

Today: `CommandCenterView.svelte:2-7` (rewrapped by P27), `:10`, `:122-267` (the disable line `:265` changed by P20), `:269-296`.

### P15, 12:20:16, `CareerPanel.svelte`, `EntryEditor.svelte`, `EntryForm.svelte`

```
python3 - <<'EOF'
p='src/lib/views/boards/focus/career/CareerPanel.svelte'
s=open(p).read()
s=s.replace("""                {file}
                {field}
            />""","""                {file}
                openOn={field}
            />""")
open(p,'w').write(s)

p='src/lib/views/shared/forms/entry/edit/EntryEditor.svelte'
s=open(p).read()
s=s.replace("""    // leaves the field as the Revert left it (`unlessReverted`).
""","""    // leaves the field as the Revert left it (`unlessReverted`).
    //
    // Opened on one field (`openOn`, which the career banner's Edit on a row names), the form
    // scrolls that field into view and puts the focus in its first control; with none, as on the
    // person and entry pages, nothing scrolls and nothing takes the focus.
""")
s=s.replace("""        /** Why a write cannot address the entry, when the file's identities say so. */
        fault?: IdentityFault;
    };

    let { page, instance, file, fault }: Props = $props();""","""        /** Why a write cannot address the entry, when the file's identities say so. */
        fault?: IdentityFault;
        /** The field the editor opens on, scrolled into view and focused; none for the whole. */
        openOn?: string;
    };

    let { page, instance, file, fault, openOn }: Props = $props();""")
s=s.replace("""        addPerson={newPerson}
    />""","""        addPerson={newPerson}
        {openOn}
    />""")
open(p,'w').write(s)

p='src/lib/views/shared/forms/entry/edit/EntryForm.svelte'
s=open(p).read()
s=s.replace("""    // until the next Add of that field or an edit of it.
""","""    // until the next Add of that field or an edit of it.
    //
    // Each field's row is marked with the field's name (`data-field`). Given `openOn`, the row of
    // that field is scrolled into view as it is drawn and its first control takes the focus, so an
    // editor opened on one section starts there; a name the form has no field for, and no
    // `openOn` at all, scroll nothing and focus nothing.
""")
s=s.replace("""        /** Write a new person of this name to the people registry of the record's hub. */
        addPerson?: (name: string) => Promise<PersonAdded>;
    };""","""        /** Write a new person of this name to the people registry of the record's hub. */
        addPerson?: (name: string) => Promise<PersonAdded>;
        /** The field the form opens on: scrolled into view, its first control focused. */
        openOn?: string;
    };""")
s=s.replace("""        empty,
        addPerson
    }: Props = $props();""","""        empty,
        addPerson,
        openOn
    }: Props = $props();

    /** What takes the focus in a field's row: its first control that the keyboard reaches. */
    const CONTROL =
        'input:not([disabled]), textarea:not([disabled]), select:not([disabled]), button:not([disabled]), [contenteditable="true"], [tabindex]:not([tabindex="-1"])';

    /** Bring the row of the field the form opens on into view and focus its first control. */
    function opened(row: HTMLElement): void {
        row.scrollIntoView({ block: 'nearest' });
        row.querySelector<HTMLElement>(CONTROL)?.focus({ preventScroll: true });
    }""")
s=s.replace("""{#each fields as field (field.field)}
    <Field label={field.label} help={field.help} note={notesOf(field)} dirty={changed(field.field)}>""","""{#each fields as field (field.field)}
    <div
        data-field={field.field}
        {@attach field.field === openOn ? opened : undefined}
    >
        <Field
            label={field.label}
            help={field.help}
            note={notesOf(field)}
            dirty={changed(field.field)}
        >""")
open(p,'w').write(s)
EOF
sed -n 105,140p src/lib/views/shared/forms/entry/edit/EntryForm.svelte
```

Today: `CareerPanel.svelte:206`; `EntryEditor.svelte:26-29`, `:61-62`, `:65`, `:212`; `EntryForm.svelte:13-18` (changed again by P30), `:45-46`, `:59-60`, `:63-67` (the `CONTROL` constant removed by P30, `:66` replaced by P30), `:110-116` (the `<div>` put on one line, `:110`, by prettier in P18).

### P16, 12:20:20, `src/lib/views/shared/forms/entry/edit/EntryForm.svelte`

```
python3 - <<'EOF'
p='src/lib/views/shared/forms/entry/edit/EntryForm.svelte'
s=open(p).read()
s=s.replace("""                : (name: string) => add(field, addPerson, name)}
        />
    </Field>
{/each}""","""                : (name: string) => add(field, addPerson, name)}
        />
        </Field>
    </div>
{/each}""")
open(p,'w').write(s)
EOF
echo ok
```

Today: `EntryForm.svelte:127-128` (the controls between `:117` and `:126` indented by prettier in P18).

### P17, 12:20:29, `src/lib/views/boards/focus/Focus.svelte`

```
python3 - <<'EOF'
p='src/lib/views/boards/focus/Focus.svelte'
s=open(p).read()
old="""    // that says what the last write answered. The command center and the tasks section fold, each
    // by a control on its heading, and which of them is closed is kept in the tab's instance state,
    // so a reload and a move of the tab keep it; both start open. The career banner folds by itself
    // and starts folded.
"""
new="""    // that says what the last write answered, or what a press on a career row could not open. The
    // career banner, the command center and the tasks section fold the same way, each by a control
    // on its heading, and which of them is closed is kept in the tab's instance state, so a reload
    // and a move of the tab keep it; all three start open.
"""
assert old in s
s=s.replace(old,new)
old="""        <CareerPanel instance={instance.id} {now} />"""
new="""        <CareerPanel
            instance={instance.id}
            {now}
            open={foldOpen(folds, 'career')}
            ontoggle={() => fold('career')}
            onsaid={(text: string) => (said = text)}
        />"""
s=s.replace(old,new)
s=s.replace("""    /** What the last write on this board answered, whichever partial made it. */""","""    /**
     * What the last write on this board answered, whichever partial made it, or why a press on a
     * career row opened the file at no line.
     */""")
open(p,'w').write(s)
EOF
grep -n "said" src/lib/views/boards/focus/Focus.svelte | head
```

Today: `Focus.svelte:24-27`, `:150-153`, `:173-179`.

### P18, 12:20:36, prettier over 14 files

```
export PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH && npx prettier --write src/lib/data/helpers/files/yaml/career-text.ts src/lib/state/sessions/source/draft-entry.ts src/lib/views/shared/forms/entry-file.ts src/lib/state/boards/focus.ts src/lib/state/boards/career.ts config/text/views/boards/focus.yml src/lib/views/boards/focus/career/career-rows.ts src/lib/views/boards/focus/career/CareerPanel.svelte src/lib/ui/display/ticker/TickerGroup.svelte src/lib/views/boards/focus/CommandCenterView.svelte src/lib/views/shared/forms/entry/edit/EntryEditor.svelte src/lib/views/shared/forms/entry/edit/EntryForm.svelte src/lib/views/boards/focus/Focus.svelte tests/checks/tree/boundaries.test.ts && npx svelte-check --tsconfig ./tsconfig.json --threshold error 2>&1 | tail -40
```

It printed `career-text.ts`, `draft-entry.ts`, `CareerPanel.svelte`, `TickerGroup.svelte` and `EntryForm.svelte` as changed and the other nine as "(unchanged)". Which lines it reformatted was not recorded. In today's tree its changes lie inside the ranges of P4, P5, P15 and P16 and inside the Write-made `CareerPanel.svelte` and `TickerGroup.svelte`; the one visible by comparing P5's text with today's is `draft-entry.ts:102-106`, the signature of `answered` split over lines.

### P19, 12:21:36, `career-text.ts`, then prettier on it

```
python3 - <<'EOF'
p='src/lib/data/helpers/files/yaml/career-text.ts'
s=open(p).read()
a=s.index("/** The task a row of the list writes as a string")
b=s.index("/**\n * Where a section of the career file stands")
s=s[:a]+'''/**
 * The task a row of the list writes as a string, as a map's `task:` or as the row itself, with the
 * row's place: the `task:` pair's, or the plain row's start. Null for a row with no such task.
 */
function taskOf(source: string, row: unknown): { task: string; place: TextPlace | null } | null {
    if (isScalar(row)) {
        return typeof row.value === 'string' ? { task: row.value, place: startOf(source, row) } : null;
    }
    if (!isYamlMap(row)) return null;
    const pair = pairNamed(row, TASK);
    if (pair === undefined || !isScalar(pair.value) || typeof pair.value.value !== 'string') {
        return null;
    }
    return { task: pair.value.value, place: pairPlace(source, pair) };
}

/** The place of the n-th row of a list whose task is `task`, or null when it holds none. */
function rowPlace(source: string, value: unknown, task: string, nth: number): TextPlace | null {
    if (!isSeq(value)) return null;
    const rows = value.items.map((row) => taskOf(source, row)).filter((row) => row?.task === task);
    return rows.at(nth)?.place ?? null;
}

'''+s[b:]
s=s.replace("import type { Node, Pair, YAMLMap } from 'yaml';","import type { Pair, YAMLMap } from 'yaml';")
open(p,'w').write(s)
EOF
export PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH && npx prettier --write src/lib/data/helpers/files/yaml/career-text.ts && npx svelte-check --tsconfig ./tsconfig.json --threshold error 2>&1 | tail -5
```

Today: `career-text.ts:16`, `:53-76` (prettier split the scalar return over `:59-61`).

### P20, 12:22:55, `career-text.ts`, `career.ts`, `TickerGroup.svelte`, `CommandCenterView.svelte`, `CareerPanel.svelte`

```
python3 - <<'EOF'
import re
p='src/lib/data/helpers/files/yaml/career-text.ts'
s=open(p).read()
s=s.replace("Pair<unknown, unknown>","Pair")
open(p,'w').write(s)
p='src/lib/state/boards/career.ts'
s=open(p).read()
s=s.replace("import type { Career, Id, Snapshot } from","import type { Id, Snapshot } from")
open(p,'w').write(s)
p='src/lib/ui/display/ticker/TickerGroup.svelte'
s=open(p).read()
s=s.replace("""    {#if after !== undefined}
        <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
        {@render after()}""","""    {#if after !== undefined}
        {@render after()}""")
open(p,'w').write(s)
for p,c in [('src/lib/views/boards/focus/CommandCenterView.svelte','red'),('src/lib/views/boards/focus/career/CareerPanel.svelte','purple')]:
    s=open(p).read()
    old="""    <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
    {@render box('%s', content)}"""%c
    new="""    <!-- eslint-disable-next-line @typescript-eslint/no-unsafe-call -- svelte-check types the snippet TickerGroup.svelte's module script exports; the lint's parser does not read it -->
    {@render box('%s', content)}"""%c
    assert old in s
    s=s.replace(old,new)
    open(p,'w').write(s)
EOF
grep -n "Career\b" src/lib/state/boards/career.ts | head; export PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH && npx eslint src/lib/data/helpers/files/yaml/career-text.ts src/lib/state/boards/career.ts src/lib/views/boards/focus/career/CareerPanel.svelte src/lib/ui/display/ticker/TickerGroup.svelte src/lib/views/boards/focus/CommandCenterView.svelte 2>&1 | tail -10
```

Today: `career-text.ts:42`, `:49` (every `Pair<unknown, unknown>`); `career.ts:12`; `TickerGroup.svelte:93-94` (the disable line above `{@render after()}` removed); `CommandCenterView.svelte:265`; `CareerPanel.svelte:224`.

### P21, 12:23:37, a case program in the worktree (wrote and removed `tests/zz-o74/cases.test.ts` in the one command)

The command is quoted whole in "Case-run programs", A2. Today's tree: no line.

### P22, 12:24:25, the case program of record (wrote `$S/cases.test.ts`, removed `$S/tests`, copied the file into `tests/zz-o74/`, wrote `$S/run.txt`, removed `tests/zz-o74`)

```
S=/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o74; rm -rf $S/tests; mkdir -p $S && cat > $S/cases.test.ts <<'EOF'
<the 64 lines quoted in "Case-run programs", B, byte for byte: the heredoc body's shasum is 4a19c9a995a1ecceb1a8c730dbe9bc89a8e9a250, the file's>
EOF
cd /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O74 && mkdir -p tests/zz-o74 && cp $S/cases.test.ts tests/zz-o74/ && export PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH && npx vitest run tests/zz-o74/cases.test.ts 2>&1 > $S/run.txt; rm -r tests/zz-o74; sed -n '/Expected/,/Received/p;/^+ /p' $S/run.txt | head -5; grep -n "^+ \|case\|refusal" $S/run.txt | head -80
```

Today's tree: no line.

### P23, 12:24:53, `docs/HELP.md`

```
python3 - <<'EOF'
p='docs/HELP.md'
lines=open(p).read().split('\n')
l=lines[286]
start=l.index("The Career banner is folded to one line")
end=l.index("A hub with no career file has no banner.")+len("A hub with no career file has no banner.")
assert end==len(l), (end,len(l))
new=("The Career banner, headed Career, is open on a new Focus tab and folds like the command center, and a reload or a move of the tab keeps it folded or open; a find-in-page match inside the folded banner unfolds it. "
"Its rows stand in the command center's box and two columns, in groups in this order, each drawn only when it has a row: Next, the milestone, with its day and the days left to it as the tail, as in \"2026-11-17, in 23 days\", red once the day has passed and amber within 14 days of it; Goal; Situation, one row per fact with its value as the tail; Order of work, one row per task with its note after it and its date as the tail, and the order's own note under the rows; Track record, one row per role with the count of each record row of `categories:` it has projects in as the tail, as in \"3 in review, 2 in flight\", then Funding obtained. "
"A press on a Next, Goal, Situation or Order of work row opens the career file at that entry's line, and when the file no longer holds the entry the board's outcome line says so. "
"Under the pointer such a row carries Edit, which opens the banner's editor at that section, and, for each web address its words hold, an Open link button named by the address's host, which opens the address in a new browser tab. "
"Edit in the heading row opens the editor over the whole career file, unfolding the banner first when it is folded, and Close editor closes it; a career file with no `schema:` has no editor and no Edit. "
"A Track record role row opens the first board of `boards:` that takes the role, so Lead opens Projects, Supervisor Supervision and Collaborator Coauthor, and Funding obtained opens the Funding view; these rows carry no button. "
"The track record counts the projects of every hub whose lead, supervisors or collaborators name you (the workspace setting `self`), in the record rows of `categories:` (in review, in flight, publications, other outputs), never summed. Funding obtained counts the funding entries you lead whose status is obtained (awarded, granted), drawn only when at least one is. With no `self`, or with no project in a record row and no obtained funding, the track record is not drawn. A hub with no career file has no banner.")
lines[286]=l[:start]+new
open(p,'w').write('\n'.join(lines))
EOF
git diff --stat docs/HELP.md
```

Today: `HELP.md:287`, from "The Career banner, headed Career" to the end of the line (changed again by P26 and P34).

### P24, 12:25:11, the unused-exports listing (wrote `$S/unused.txt` only)

```
export PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH && wc -l src/lib/data/helpers/files/yaml/career-text.ts src/lib/state/sessions/source/draft-entry.ts src/lib/views/shared/forms/entry-file.ts src/lib/state/boards/focus.ts src/lib/state/boards/career.ts src/lib/views/boards/focus/career/career-rows.ts src/lib/views/boards/focus/career/CareerPanel.svelte src/lib/ui/display/ticker/TickerGroup.svelte src/lib/views/boards/focus/CommandCenterView.svelte src/lib/views/shared/forms/entry/edit/EntryEditor.svelte src/lib/views/shared/forms/entry/edit/EntryForm.svelte src/lib/views/boards/focus/Focus.svelte config/text/views/boards/focus.yml tests/checks/tree/boundaries.test.ts; sh utils/folder-check.sh; echo "folder-check exit $?"; sh utils/unused-exports.sh > /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o74/unused.txt; diff /Users/axelfaes/workspace/oculus/.agents/worktrees/O74-base/unused-exports.txt /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o74/unused.txt; echo "diff exit $?"
```

### P25, 12:25:27, `career-rows.ts`, and the listing again into `$S/unused.txt`

```
sed -i '' 's/^export type CareerTarget =/type CareerTarget =/; s/^export type CareerGroup = {/type CareerGroup = {/' src/lib/views/boards/focus/career/career-rows.ts && export PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH && sh utils/unused-exports.sh > /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o74/unused.txt; diff /Users/axelfaes/workspace/oculus/.agents/worktrees/O74-base/unused-exports.txt /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o74/unused.txt; echo "diff exit $?"
```

Today: `career-rows.ts:41`, `:54`.

### P26, 12:25:42, `CareerPanel.svelte`, `career-rows.ts`, `docs/HELP.md`

```
sed -i '' 's/no longer holds it/does not hold it/g' src/lib/views/boards/focus/career/CareerPanel.svelte src/lib/views/boards/focus/career/career-rows.ts && sed -i '' 's/when the file no longer holds the entry/when the file does not hold the entry/' docs/HELP.md && grep -rn "no longer" src/lib/views/boards/focus/career/ docs/HELP.md | grep -i career | cut -c1-120; grep -n "does not hold it" src/lib/views/boards/focus/career/*
```

Today: `CareerPanel.svelte:21`, `:155`; `career-rows.ts:46`; `HELP.md:287`.

### P27, 12:25:59, `rewrap.py` written in the scratchpad and run over 11 files

```
cat > /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o74/rewrap.py <<'EOF'
import sys, textwrap, re
# rewrap the leading line-comment paragraphs (the head comment) of a file at 100 columns
p=sys.argv[1]
lines=open(p).read().split('\n')
out=[];i=0
while i<len(lines):
    m=re.match(r'^(\s*// )(.*)$',lines[i])
    if m and m.group(2).strip():
        prefix=m.group(1); words=[]
        while i<len(lines):
            m2=re.match(r'^(\s*// )(.*)$',lines[i])
            if not (m2 and m2.group(1)==prefix and m2.group(2).strip()): break
            words.append(m2.group(2).strip()); i+=1
        text=' '.join(words)
        for l in textwrap.wrap(text,width=100-len(prefix),break_long_words=False,break_on_hyphens=False):
            out.append(prefix+l)
    else:
        out.append(lines[i]); i+=1
open(p,'w').write('\n'.join(out))
EOF
for f in src/lib/views/boards/focus/career/CareerPanel.svelte src/lib/ui/display/ticker/TickerGroup.svelte src/lib/data/helpers/files/yaml/career-text.ts src/lib/views/boards/focus/CommandCenterView.svelte src/lib/views/boards/focus/career/career-rows.ts src/lib/state/sessions/source/draft-entry.ts src/lib/views/shared/forms/entry-file.ts src/lib/state/boards/career.ts src/lib/views/boards/focus/Focus.svelte src/lib/views/shared/forms/entry/edit/EntryEditor.svelte src/lib/views/shared/forms/entry/edit/EntryForm.svelte; do python3 /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o74/rewrap.py $f; done; git diff --stat
```

It reflowed every run of `// ` lines in each file, a base paragraph as well as a new one. Today, the `// ` paragraphs of these files that differ from the base or are new are: `CareerPanel.svelte:2-41`, `TickerGroup.svelte:2-21`, `career-text.ts:1-13`, `CommandCenterView.svelte:2-7`, `career-rows.ts:1-15`, `draft-entry.ts:1-11` and `:25-26`, `entry-file.ts:1-11`, `career.ts:1-10`, `Focus.svelte:24-27`, `EntryEditor.svelte:27-29`, `EntryForm.svelte:14-18`. Every other `// ` paragraph of these files reads as in the base: `git diff -U0 a5387bdc` has no hunk outside the ranges this list names. The one base paragraph the run changed, `Focus.svelte:29-31`, P28 set back, and it now reads as in the base. Which lines inside the ranges above the run moved, and which the program before it wrote already wrapped, was not recorded.

### P28, 12:26:15, `src/lib/views/boards/focus/Focus.svelte`

```
python3 - <<'EOF'
p='src/lib/views/boards/focus/Focus.svelte'
s=open(p).read()
s=s.replace("    // are each a surface of their own; the awaiting box and the said line are read off a `Surface`.","    // are each a surface of their own; the awaiting box and the said line are read off a\n    // `Surface`.")
open(p,'w').write(s)
EOF
git diff src/lib/state/sessions/source/draft-entry.ts src/lib/views/shared/forms/entry/edit/EntryForm.svelte src/lib/views/boards/focus/CommandCenterView.svelte | grep "^[-+]" | grep "//" 
```

Today: `Focus.svelte:30-31`, equal to the base (`git diff -U0 a5387bdc -- src/lib/views/boards/focus/Focus.svelte` has no hunk there).

### P29, 12:26:21, `src/lib/views/shared/forms/entry/edit/EntryForm.svelte`

```
python3 - <<'EOF'
p='src/lib/views/shared/forms/entry/edit/EntryForm.svelte'
s=open(p).read()
old=s[s.index("    const CONTROL ="):s.index("\n",s.index("    const CONTROL =")+30)+1]
new="""    const CONTROL = [
        'input:not([disabled])',
        'textarea:not([disabled])',
        'select:not([disabled])',
        'button:not([disabled])',
        '[contenteditable="true"]',
        '[tabindex]:not([tabindex="-1"])'
    ].join(', ');
"""
s=s.replace(old,new)
open(p,'w').write(s)
EOF
sed -n 55,80p src/lib/views/shared/forms/entry/edit/EntryForm.svelte
```

Today: no line; P30 removed the constant.

### P30, 12:26:40, `EntryForm.svelte`, then `rewrap.py` on it

```
sed -n 20,40p src/lib/ui/frame/quiet-focus.ts && python3 - <<'EOF'
p='src/lib/views/shared/forms/entry/edit/EntryForm.svelte'
s=open(p).read()
a=s.index("    /** What takes the focus in a field's row")
b=s.index("    /** Bring the row of the field")
s=s[:a]+s[b:]
s=s.replace("""        row.scrollIntoView({ block: 'nearest' });
        row.querySelector<HTMLElement>(CONTROL)?.focus({ preventScroll: true });""","""        row.scrollIntoView({ block: 'nearest' });
        focusFirstQuietly(row);""")
s=s.replace("""    import Field from '$lib/ui/forms/Field.svelte';
""","""    import Field from '$lib/ui/forms/Field.svelte';
    import { focusFirstQuietly } from '$lib/ui/frame/quiet-focus';
""")
s=s.replace("that field is scrolled into view as it is drawn and its first control takes the focus","that field is scrolled into view as it is drawn and the first control Tab reaches in it takes the focus (ui/frame/quiet-focus.ts `focusFirstQuietly`, so its tooltip stays shut)")
open(p,'w').write(s)
EOF
python3 /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o74/rewrap.py src/lib/views/shared/forms/entry/edit/EntryForm.svelte; sed -n 1,25p src/lib/views/shared/forms/entry/edit/EntryForm.svelte
```

Today: `EntryForm.svelte:14-18`, `:21`, `:66`.

### P31, 12:26:49, prettier with the file list in one quoted word

```
export PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH && F="src/lib/data/helpers/files/yaml/career-text.ts src/lib/state/sessions/source/draft-entry.ts src/lib/views/shared/forms/entry-file.ts src/lib/state/boards/focus.ts src/lib/state/boards/career.ts config/text/views/boards/focus.yml src/lib/views/boards/focus/career/career-rows.ts src/lib/views/boards/focus/career/CareerPanel.svelte src/lib/ui/display/ticker/TickerGroup.svelte src/lib/views/boards/focus/CommandCenterView.svelte src/lib/views/shared/forms/entry/edit/EntryEditor.svelte src/lib/views/shared/forms/entry/edit/EntryForm.svelte src/lib/views/boards/focus/Focus.svelte tests/checks/tree/boundaries.test.ts docs/HELP.md" && npx prettier --write $F | grep -v unchanged; npx eslint $(echo $F | tr ' ' '\n' | grep -v "yml\|\.md") && echo eslint-ok; npx svelte-check --tsconfig ./tsconfig.json --threshold error 2>&1 | tail -2
```

Prettier answered `[error] No files matching the pattern were found` and wrote nothing. Today: no line.

### P32, 12:27:35, prettier over 15 files

```
export PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH && npx prettier --write src/lib/data/helpers/files/yaml/career-text.ts src/lib/state/sessions/source/draft-entry.ts src/lib/views/shared/forms/entry-file.ts src/lib/state/boards/focus.ts src/lib/state/boards/career.ts config/text/views/boards/focus.yml src/lib/views/boards/focus/career/career-rows.ts src/lib/views/boards/focus/career/CareerPanel.svelte src/lib/ui/display/ticker/TickerGroup.svelte src/lib/views/boards/focus/CommandCenterView.svelte src/lib/views/shared/forms/entry/edit/EntryEditor.svelte src/lib/views/shared/forms/entry/edit/EntryForm.svelte src/lib/views/boards/focus/Focus.svelte tests/checks/tree/boundaries.test.ts docs/HELP.md | grep -v unchanged; echo done
```

It printed only `done`: every file was "(unchanged)". Today: no line.

### P33, 12:27:48, the diagrams and the first verify run (changed `docs/diagrams/*`, wrote `$S/quick1.txt`)

```
export PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH && npm run diagrams 2>&1 | tail -3 && npm run test:quick > /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o74/quick1.txt 2>&1; echo "exit $?"; tail -40 /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o74/quick1.txt
```

Today: `docs/diagrams/layer-state.dot`, `layer-state.svg`, `layer-views.dot`, `layer-views.svg`, `layers.dot`, `layers.svg`, 16 lines added and 16 removed over the six (`git diff --stat a5387bdc -- docs/diagrams`). The svelte-kit sync of `test:quick` also writes `.svelte-kit/`, which git ignores.

### P34, 12:31:10, `docs/HELP.md`, `career-rows.ts`, `TickerGroup.svelte`

```
python3 - <<'EOF'
p='docs/HELP.md'
s=open(p).read()
old='Next, the milestone, with its day and the days left to it as the tail, as in "2026-11-17, in 23 days", red once'
assert old in s
s=s.replace(old,'Next, the milestone, with its day and the days left to it as the tail, the day followed by words such as "in 23 days" or "3 days ago", red once')
open(p,'w').write(s)
p='src/lib/views/boards/focus/career/career-rows.ts'
s=open(p).read()
old=""" * The Next row's tail and tone: the milestone's day and the days left to it, `2026-11-17, in 23
 * days`, toned as the command center tones a deadline (`daysTone`); neither when the file gives
 * no day."""
assert old in s
s=s.replace(old,""" * The Next row's tail and tone: the milestone's day and the days left to it, `<day>, in 23 days`,
 * toned as the command center tones a deadline (`daysTone`); neither when the file gives no day.""")
open(p,'w').write(s)
p='src/lib/ui/display/ticker/TickerGroup.svelte'
s=open(p).read()
old=s[s.index("    type Props = {"):s.index("</script>",s.index("    type Props = {"))]
new="""    /** The ticker's own props but its rows, passed to every run as the caller gives them. */
    type TickerProps = Omit<ComponentProps<typeof Ticker>, 'rows'>;

    type Props = TickerProps & {
        /** The heading's words and glyph name. */
        label: string;
        glyph: string;
        runs: Run[];
        /** A note line under the runs, if any. */
        note?: string;
        /** What the caller draws after the runs and the note line. */
        after?: Snippet;
        /** Each run its own block that does not break, the heading inside the first. */
        split?: boolean;
        /** Closed by default, the heading the control that opens it. */
        folded?: boolean;
    };

    let {
        label,
        glyph,
        runs,
        note,
        after,
        split = false,
        folded = false,
        ...ticker
    }: Props = $props();
"""
s=s.replace(old,new)
s=s.replace("""    <Ticker
        rows={one.rows}
        {onpick}
        {onaction}
        {reveal}
        {kept}
        {marked}
    />""","""    <Ticker rows={one.rows} {...ticker} />""")
s=s.replace("    import type { Snippet } from 'svelte';\n","    import type { ComponentProps, Snippet } from 'svelte';\n")
open(p,'w').write(s)
EOF
grep -n "Ticker rows\|ComponentProps\|onpick" src/lib/ui/display/ticker/TickerGroup.svelte
```

Today: `HELP.md:287` (the Next sentence); `career-rows.ts:108-109`; `TickerGroup.svelte:23`, `:36-63`. Its `<Ticker>` replacement matched nothing, since prettier had put that element on one line; P35 made that change.

### P35, 12:31:17, `TickerGroup.svelte`, then prettier on three files

```
sed -i '' 's|    <Ticker rows={one.rows} {onpick} {onaction} {reveal} {kept} {marked} />|    <Ticker rows={one.rows} {...ticker} />|' src/lib/ui/display/ticker/TickerGroup.svelte && grep -n "Ticker rows" src/lib/ui/display/ticker/TickerGroup.svelte && export PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH && npx prettier --write src/lib/ui/display/ticker/TickerGroup.svelte src/lib/views/boards/focus/career/career-rows.ts docs/HELP.md >/dev/null && npx eslint src/lib/ui/display/ticker/TickerGroup.svelte src/lib/views/boards/focus/career/career-rows.ts src/lib/views/boards/focus/CommandCenterView.svelte src/lib/views/boards/focus/career/CareerPanel.svelte && npx svelte-check --tsconfig ./tsconfig.json --threshold error 2>&1 | tail -1 && npx vitest run tests/checks/source/history.test.ts tests/checks/tree/duplication.test.ts 2>&1 | grep -E "Test Files|Tests |^\+ " 
```

Today: `TickerGroup.svelte:82`. The prettier output went to `/dev/null`, so which of the three files it changed was not recorded; any change it made lies inside `TickerGroup.svelte` (Write-made), `career-rows.ts` (Write-made) or `HELP.md:287`.

### P36, 12:32:37, the history check into `$S/hist.txt` (scratchpad only)

```
export PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH && npx vitest run tests/checks/source/history.test.ts > /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o74/hist.txt 2>&1; grep -n "Error\|src/\|docs/\|tests/" /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o74/hist.txt | cut -c1-250 | head -20
```

### P37, 12:34:08, the second case run (copied `$S/cases.test.ts` into `tests/zz-o74/`, wrote `$S/run2.txt` and `$S/run2-lines.txt`, removed `tests/zz-o74`)

```
S=/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o74; cd /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O74 && mkdir -p tests/zz-o74 && cp $S/cases.test.ts tests/zz-o74/ && export PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH && npx vitest run tests/zz-o74/cases.test.ts > $S/run2.txt 2>&1; rm -r tests/zz-o74; grep "^+ " $S/run2.txt > $S/run2-lines.txt; grep "^+ " $S/run.txt | diff - $S/run2-lines.txt && echo "same output as the first after-change run"; git status --short | grep zz
```

Today's tree: no line.

### P38, 12:34:34 and 12:35:20, the second verify run and the closing checks (changed `docs/diagrams/*` to the same text, wrote `$S/quick2.txt` and `$S/unused.txt`)

```
export PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH && npm run diagrams > /dev/null 2>&1; echo "diagrams exit $?"; npm run test:quick > /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o74/quick2.txt 2>&1; echo "exit $?"; tail -16 /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o74/quick2.txt
```

```
export PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH && npx vitest run tests/state/forms/form-draft.test.ts tests/state/forms/page-entry.test.ts tests/state/client/held-unsaved.test.ts tests/state/sessions/source/source.test.ts 2>&1 | grep -E "Test Files|Tests "; npx vitest run tests/checks/tree/boundaries.test.ts 2>&1 | grep -E "Test Files|Tests "; sh utils/unused-exports.sh > /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o74/unused.txt; diff /Users/axelfaes/workspace/oculus/.agents/worktrees/O74-base/unused-exports.txt /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o74/unused.txt; echo "unused diff exit $?"; sh utils/folder-check.sh; echo "folder exit $?"; LC_ALL=C grep -n '[^ -~]' $(git diff --name-only) src/lib/data/helpers/files/yaml/career-text.ts src/lib/ui/display/ticker/TickerGroup.svelte src/lib/views/boards/focus/career/career-rows.ts | grep -v "\.svg:" | head; echo "ascii done"; git diff --stat docs/diagrams | tail -1; wc -l $(git diff --name-only | grep -v diagrams) src/lib/data/helpers/files/yaml/career-text.ts src/lib/ui/display/ticker/TickerGroup.svelte src/lib/views/boards/focus/career/career-rows.ts; git diff --numstat
```

Today: the six diagram files as P33 left them.

## Case-run programs

Neither program below ran in this round. Their imports are relative (`../../src/...`), so each runs only from a copy two folders under a tree's root; in the first build each was run from `tests/zz-o74/` inside the worktree and that folder was removed after each run (P2, P3, P21, P22, P37). The commands run with `PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH` and `npx vitest run tests/zz-o74/cases.test.ts`.

### A1, the first run on the unchanged tree (P2, the command whole)

```
cd /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O74 && mkdir -p tests/zz-o74 && cat > tests/zz-o74/cases.test.ts <<'EOF'
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { it } from 'vitest';
import { engineDir, loadConfig, textCatalog } from '../../src/lib/data/sources/config.ts';
import { setCatalog } from '../../src/lib/state/shared/words/text.ts';
import { foldOpen, foldToggled, type FoldKey } from '../../src/lib/state/boards/focus.ts';
import { nextLine } from '../../src/lib/state/boards/career.ts';
import { boardIds } from '../../src/lib/state/boards/board/presets.ts';
import * as draft from '../../src/lib/state/sessions/source/draft-entry.ts';

const config = loadConfig(engineDir()).config;
setCatalog(textCatalog(config));

it('first run on the unchanged tree', () => {
    const career = 'career' as FoldKey;
    console.log('case 1 foldOpen({}, career):', foldOpen({}, career));
    console.log('case 1 foldToggled({x:1,closed:[tasks]}, career):', JSON.stringify(foldToggled({ x: 1, closed: ['tasks'] }, career)));
    const text = readFileSync(`${homedir()}/workspace/research-hub/.oculus/data/academic/career.yml`, 'utf8');
    const lines = text.split('\n');
    for (const key of ['goal:', 'milestone:', '  Now:', '  - { task: "ERC Starting Grant"']) {
        console.log('case 3 hub line of', JSON.stringify(key), lines.findIndex((l) => l.startsWith(key)) + 1);
    }
    console.log('case 3-5,20,23 draft-entry exports:', Object.keys(draft).join(', '));
    const now = Date.parse('2026-10-25T12:00:00');
    console.log('case 2 nextLine hub:', nextLine({ milestone: 'FWO Senior', milestoneDate: '2026-11-17' }, now));
    console.log('case 6 nextLine -3 days:', nextLine({ milestone: 'M', milestoneDate: '2026-10-22' }, now));
    console.log('case 6 nextLine +10 days:', nextLine({ milestone: 'M', milestoneDate: '2026-11-04' }, now));
    console.log('case 6 nextLine no day:', JSON.stringify(nextLine({ milestone: 'M' }, now)));
    console.log('case 9/21 boardIds(oculus config):', boardIds(config).join(', '));
});
EOF
export PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH && npx vitest run tests/zz-o74/cases.test.ts 2>&1 | grep -v "^$" | head -30
```

Its output is the first section's "The cases' first run".

### A2, the first after-change run (P21, the command whole)

```
cd /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O74 && mkdir -p tests/zz-o74 && cat > tests/zz-o74/cases.test.ts <<'EOF'
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { parse } from 'yaml';
import { expect, it } from 'vitest';
import { engineDir, loadConfig, textCatalog } from '../../src/lib/data/sources/config.ts';
import { setCatalog } from '../../src/lib/state/shared/words/text.ts';
import { foldOpen, foldToggled } from '../../src/lib/state/boards/focus.ts';
import { roleBoard } from '../../src/lib/state/boards/career.ts';
import { careerAt } from '../../src/lib/data/helpers/files/yaml/career-text.ts';
import { findCareer } from '../../src/lib/state/sessions/source/draft-entry.ts';
import { career as careerOf } from '../../src/lib/data/snapshot/normalise-parts/career.ts';
import { careerRows } from '../../src/lib/views/boards/focus/career/career-rows.ts';

const config = loadConfig(engineDir()).config;
setCatalog(textCatalog(config));
const now = Date.parse('2026-10-25T12:00:00');
const show = (o: unknown) => JSON.stringify(o);
const rowsOf = (text: string, extra: Record<string, unknown> = {}) =>
    careerRows({ career: careerOf(parse(text))!, now, record: null, editable: true, boardOf: () => undefined, ...extra });
const brief = (r: ReturnType<typeof careerRows>) =>
    r.groups.map((g) => `${g.label}${g.note === undefined ? '' : ` [note: ${g.note}]`}: ` + g.rows.map((x) => `{${x.id} | ${x.label} | tail=${x.tail ?? '-'} | tone=${x.tone ?? '-'}${x.plain ? ' | plain' : ''} | acts=${(x.actions ?? []).map((a) => `${a.label}(${a.title ?? ''})`).join(',') || '-'}}`).join(' ')).join('\n');

it('cases after the change', () => {
    console.log('case 1', foldOpen({}, 'career'), show(foldToggled({ x: 1, closed: ['tasks'] }, 'career')), foldOpen({ closed: ['career'] }, 'command'), foldOpen({ closed: ['career'] }, 'tasks'));
    const hub = readFileSync(`${homedir()}/workspace/research-hub/.oculus/data/academic/career.yml`, 'utf8');
    console.log('case 3', show(['goal', 'milestone'].map((key) => careerAt(hub, { key }))), show(careerAt(hub, { key: 'situation', fact: 'Now' })), show(careerAt(hub, { key: 'order', task: 'ERC Starting Grant', nth: 0 })));
    const two = 'order:\n  - { task: Review, when: May }\n  - task: Write\n  - task: Review\n    when: June\n  - Teach\n';
    console.log('case 4', show(careerAt(two, { key: 'order', task: 'Review', nth: 0 })), show(careerAt(two, { key: 'order', task: 'Review', nth: 1 })), show(careerAt(two, { key: 'order', task: 'Teach', nth: 0 })));
    const renamed = hub.replace('  Now:', '  Today:');
    console.log('case 5', show(careerAt(renamed, { key: 'situation', fact: 'Now' })));
    const source = { sourceDraft: () => ({ text: renamed, file: 'research-hub/.oculus/data/academic/career.yml' }), editSourceDraft: () => undefined } as never;
    console.log('case 5 sentence', show(findCareer(source, 'tab', { key: 'situation', fact: 'Now' }, 'Now')));
    for (const [name, date] of [['-3', '2026-10-22'], ['+10', '2026-11-04'], ['+23', '2026-11-17'], ['none', undefined]] as const) {
        const r = rowsOf(`milestone: M\n${date === undefined ? '' : `milestone_date: "${date}"\n`}`);
        console.log('case 6', name, show(r.groups[0].rows[0]));
    }
    const isBoard = (view: string) => ['projects', 'supervision', 'coauthor', 'archive', 'personal', 'software'].includes(view);
    console.log('case 9', ['lead', 'supervisor', 'collaborator', 'other'].map((role) => `${role}->${roleBoard(config, role, isBoard)}`).join(' '));
    const noSup = { boards: { projects: { role: 'lead' }, coauthor: { role: ['collaborator'] } } };
    console.log('case 9 none', show(roleBoard(noSup, 'supervisor', isBoard)));
    const skip = { boards: { personal: { tier: 'personal' }, software: { tier: 'software' }, mine: { role: 'lead' }, projects: { role: 'lead' } } };
    console.log('case 21', show(roleBoard(skip, 'lead', isBoard)));
    console.log('case 12\n' + brief(rowsOf('goal: "see https://x.test."\nsituation:\n  Web: "see https://example.org/a and http://foo.test/b, again https://example.org/a"\n  Plain: "no address"\n')));
    console.log('case 2 (hub file, a scratch track record)\n' + brief(careerRows({ career: careerOf(parse(hub))!, now, editable: true, record: { roles: [{ key: 'lead', label: 'Lead', lines: [{ key: 'review', label: 'in review', count: 3 }, { key: 'flight', label: 'in flight', count: 2 }, { key: 'pub', label: 'publications', count: 0 }] }, { key: 'other', label: 'Other', lines: [{ key: 'review', label: 'in review', count: 1 }] }], funding: 1 }, boardOf: (role) => (role === 'lead' ? 'projects' : undefined) })));
    const dup = 'order:\n  - { task: Review, note: first }\n  - Review\n  - { task: Ship, when: "Q3", note: "" }\norder_note: ""\n';
    const r14 = rowsOf(dup);
    console.log('case 14/18\n' + brief(r14));
    for (const [id, target] of Object.entries(r14.targets)) {
        if (target?.kind === 'file') console.log('case 14 target', id, show(target.at), show(careerAt(dup, target.at)));
    }
    const demo = readFileSync('tests/fixtures/hubs/demo/.oculus/data/academic/career.yml', 'utf8');
    console.log('case 17 (no schema, editable false)\n' + brief(rowsOf(demo, { editable: false })));
    const ids = rowsOf('milestone: M\ngoal: G\nsituation:\n  "": empty\n  a: x\norder:\n  - a\n  - a\n', { record: { roles: [{ key: 'lead', label: 'Lead', lines: [{ key: 'r', label: 'in review', count: 1 }] }], funding: 2 }, boardOf: () => 'projects' });
    const all = ids.groups.flatMap((g) => g.rows.map((x) => x.id));
    console.log('case 19', show(all), 'unique', new Set(all).size === all.length, 'empty', all.includes(''));
    console.log('case 19\n' + brief(ids));
    const moved = hub.replace('goal: "Assistant', '\n\ngoal: "Assistant');
    console.log('case 20', show(careerAt(moved, { key: 'goal' })));
    console.log('case 23', show(careerAt('situation: { PhD: a, Now: b }\n', { key: 'situation', fact: 'Now' })), show(careerAt('title: t\nsituation:\n  "Now": x\n  \'Past\': y\n', { key: 'situation', fact: 'Now' })), show(careerAt('title: t\nsituation:\n  "Now": x\n  \'Past\': y\n', { key: 'situation', fact: 'Past' })));
    console.log('refusal', show(careerAt('goal: [\n', { key: 'goal' })), show(careerAt('', { key: 'goal' })), show(careerAt('- a\n', { key: 'goal' })));
    expect(true).toBe(true);
});
EOF
export PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH && npx vitest run tests/zz-o74/cases.test.ts 2>&1 | grep -v "^$" | grep -v "^stdout" | head -80; rm -r tests/zz-o74; git status --short
```

Its output held no case line, only the vitest summary ("Test Files 1 passed (1)"); B, which puts the case lines in the assertion's diff, replaced it.

### B, the case program of record, `$S/cases.test.ts` (P22 and P37), whole

```
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { parse } from 'yaml';
import { expect, it } from 'vitest';
import { engineDir, loadConfig, textCatalog } from '../../src/lib/data/sources/config.ts';
import { setCatalog } from '../../src/lib/state/shared/words/text.ts';
import { foldOpen, foldToggled } from '../../src/lib/state/boards/focus.ts';
import { roleBoard } from '../../src/lib/state/boards/career.ts';
import { careerAt } from '../../src/lib/data/helpers/files/yaml/career-text.ts';
import { findCareer } from '../../src/lib/state/sessions/source/draft-entry.ts';
import { career as careerOf } from '../../src/lib/data/snapshot/normalise-parts/career.ts';
import { careerRows } from '../../src/lib/views/boards/focus/career/career-rows.ts';

const config = loadConfig(engineDir()).config;
setCatalog(textCatalog(config));
const now = Date.parse('2026-10-25T12:00:00');
const show = (o: unknown) => JSON.stringify(o);
const rowsOf = (text: string, extra: Record<string, unknown> = {}) =>
    careerRows({ career: careerOf(parse(text))!, now, record: null, editable: true, boardOf: () => undefined, ...extra });
const brief = (r: ReturnType<typeof careerRows>) =>
    r.groups.map((g) => `${g.label}${g.note === undefined ? '' : ` [note: ${g.note}]`}: ` + g.rows.map((x) => `{${x.id} | ${x.label} | tail=${x.tail ?? '-'} | tone=${x.tone ?? '-'}${x.plain ? ' | plain' : ''} | acts=${(x.actions ?? []).map((a) => `${a.label}(${a.title ?? ''})`).join(',') || '-'}}`).join(' ')).join('\n');
const out: string[] = [];
const log = (...parts: unknown[]) => out.push(parts.map(String).join(' '));

it('cases after the change', () => {
    log('case 1', foldOpen({}, 'career'), show(foldToggled({ x: 1, closed: ['tasks'] }, 'career')), foldOpen({ closed: ['career'] }, 'command'), foldOpen({ closed: ['career'] }, 'tasks'));
    const hub = readFileSync(`${homedir()}/workspace/research-hub/.oculus/data/academic/career.yml`, 'utf8');
    log('case 3', show(['goal', 'milestone'].map((key) => careerAt(hub, { key }))), show(careerAt(hub, { key: 'situation', fact: 'Now' })), show(careerAt(hub, { key: 'order', task: 'ERC Starting Grant', nth: 0 })));
    const two = 'order:\n  - { task: Review, when: May }\n  - task: Write\n  - task: Review\n    when: June\n  - Teach\n';
    log('case 4', show(careerAt(two, { key: 'order', task: 'Review', nth: 0 })), show(careerAt(two, { key: 'order', task: 'Review', nth: 1 })), show(careerAt(two, { key: 'order', task: 'Teach', nth: 0 })));
    const renamed = hub.replace('  Now:', '  Today:');
    log('case 5', show(careerAt(renamed, { key: 'situation', fact: 'Now' })));
    const source = { sourceDraft: () => ({ text: renamed, file: 'research-hub/.oculus/data/academic/career.yml' }), editSourceDraft: () => undefined } as never;
    log('case 5 sentence', show(findCareer(source, 'tab', { key: 'situation', fact: 'Now' }, 'Now')));
    for (const [name, date] of [['-3', '2026-10-22'], ['+10', '2026-11-04'], ['+23', '2026-11-17'], ['none', undefined]] as const) {
        const r = rowsOf(`milestone: M\n${date === undefined ? '' : `milestone_date: "${date}"\n`}`);
        log('case 6', name, show(r.groups[0].rows[0]));
    }
    const isBoard = (view: string) => ['projects', 'supervision', 'coauthor', 'archive', 'personal', 'software'].includes(view);
    log('case 9', ['lead', 'supervisor', 'collaborator', 'other'].map((role) => `${role}->${roleBoard(config, role, isBoard)}`).join(' '));
    const noSup = { boards: { projects: { role: 'lead' }, coauthor: { role: ['collaborator'] } } };
    log('case 9 none', show(roleBoard(noSup, 'supervisor', isBoard)));
    const skip = { boards: { personal: { tier: 'personal' }, software: { tier: 'software' }, mine: { role: 'lead' }, projects: { role: 'lead' } } };
    log('case 21', show(roleBoard(skip, 'lead', isBoard)));
    log('case 12\n' + brief(rowsOf('goal: "see https://x.test."\nsituation:\n  Web: "see https://example.org/a and http://foo.test/b, again https://example.org/a"\n  Plain: "no address"\n')));
    log('case 2 (hub file, a scratch track record)\n' + brief(careerRows({ career: careerOf(parse(hub))!, now, editable: true, record: { roles: [{ key: 'lead', label: 'Lead', lines: [{ key: 'review', label: 'in review', count: 3 }, { key: 'flight', label: 'in flight', count: 2 }, { key: 'pub', label: 'publications', count: 0 }] }, { key: 'other', label: 'Other', lines: [{ key: 'review', label: 'in review', count: 1 }] }], funding: 1 }, boardOf: (role) => (role === 'lead' ? 'projects' : undefined) })));
    const dup = 'order:\n  - { task: Review, note: first }\n  - Review\n  - { task: Ship, when: "Q3", note: "" }\norder_note: ""\n';
    const r14 = rowsOf(dup);
    log('case 14/18\n' + brief(r14));
    for (const [id, target] of Object.entries(r14.targets)) {
        if (target?.kind === 'file') log('case 14 target', id, show(target.at), show(careerAt(dup, target.at)));
    }
    const demo = readFileSync('tests/fixtures/hubs/demo/.oculus/data/academic/career.yml', 'utf8');
    log('case 17 (no schema, editable false)\n' + brief(rowsOf(demo, { editable: false })));
    const ids = rowsOf('milestone: M\ngoal: G\nsituation:\n  "": empty\n  a: x\norder:\n  - a\n  - a\n', { record: { roles: [{ key: 'lead', label: 'Lead', lines: [{ key: 'r', label: 'in review', count: 1 }] }], funding: 2 }, boardOf: () => 'projects' });
    const all = ids.groups.flatMap((g) => g.rows.map((x) => x.id));
    log('case 19', show(all), 'unique', new Set(all).size === all.length, 'empty', all.includes(''));
    log('case 19\n' + brief(ids));
    const moved = hub.replace('goal: "Assistant', '\n\ngoal: "Assistant');
    log('case 20', show(careerAt(moved, { key: 'goal' })));
    log('case 23', show(careerAt('situation: { PhD: a, Now: b }\n', { key: 'situation', fact: 'Now' })), show(careerAt('title: t\nsituation:\n  "Now": x\n  \'Past\': y\n', { key: 'situation', fact: 'Now' })), show(careerAt('title: t\nsituation:\n  "Now": x\n  \'Past\': y\n', { key: 'situation', fact: 'Past' })));
    log('refusal', show(careerAt('goal: [\n', { key: 'goal' })), show(careerAt('', { key: 'goal' })), show(careerAt('- a\n', { key: 'goal' })));
    expect(out.join('\n')).toBe('');
});
```

Its output is the first section's after-change case run. P37 ran it a second time after the last code change of the first build, and `grep "^+ " $S/run.txt | diff - $S/run2-lines.txt` printed "same output as the first after-change run".
