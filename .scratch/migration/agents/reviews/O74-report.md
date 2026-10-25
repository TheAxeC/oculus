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
| 2 The box and the flow (TickerGroup box, purple edge, editor spans both columns, old grid/facts/ol/when/Table/.career removed) | DONE | `{@render box('purple', content)}` at `CareerPanel.svelte:225`. `.body.wide { column-span: all }` at `:241`. `grep -n "sections\|facts\|class=\"order\"\|\.when\|Table\|\.career" src/lib/views/boards/focus/career/CareerPanel.svelte` prints nothing. The columns: the look (case 2). |
| 3 The groups and rows (NEXT, GOAL, SITUATION, ORDER OF WORK, TRACK RECORD; tails, tones, note line; nextLine/recordTable/career_next_line gone; daysLeft exported) | DONE | case run, "case 2" block (below). `grep -rn "nextLine\|recordTable\|RecordTable\|career_next_line" src tests config docs README.md` prints nothing. |
| 4 A press on a file row (career-text.ts, findCareer in draft-entry.ts, boundaries line, openFound shared, outcome line) | DONE | case run: `case 3 [{"line":24,...},{"line":25,...}] {"line":32,...} {"line":37,...}`; `case 4 ... {"line":2} {"line":4} {"line":6}`; `case 5 null`; `case 5 sentence {"ok":false,"sentence":"Now is no longer in career.yml","line":null}`; `case 20 {"line":26,"column":7}`; `case 23 {"line":1,...} {"line":3,...} {"line":4,...}`. The press itself: the look (case 14). |
| 5 Buttons under the pointer (Edit opens the editor on the field; `openOn` prop; Open link per distinct address) | DONE | case run "case 12" block: `acts=Edit(),example.org(Open https://example.org/a),foo.test(Open http://foo.test/b)` and `acts=Edit(),x.test(Open https://x.test)`. Scroll and focus: the look (case 7). |
| 6 Track record rows (first board of `boards:` taking the role and registered as a board; plain otherwise; Funding opens `funding`) | DONE | case run: `case 9 lead->projects supervisor->supervision collaborator->coauthor other->coauthor`; `case 9 none undefined`; `case 21 "projects"`; rows `career:role:other ... plain | acts=-`, `career:funding ... acts=-`. |
| 7 Edit in the heading row (FoldHead `end`; unfolds a folded banner and opens the editor) | DONE, label differs | `end={page === null ? undefined : edit}` at `CareerPanel.svelte:197`, `toggle` at `:121-130`. The label reads "Close editor" (`entry_form.edit_done`, as today), not "Done". The look (case 8). |
| 8 The words (HELP.md:287, head comments, four new keys, unread key removed) | DONE | `git diff --numstat`: `4 1 config/text/views/boards/focus.yml`, `1 1 docs/HELP.md`. `tests/checks/source/keys.test.ts` passed in the run below. |
| 9 TickerGroup.svelte (group, split, folded, note lines, after snippet, exported `box`; command center drawn through it; no box/group styles left in either view) | DONE | `grep -n "\.week\|\.grp\|\.category\|\.lbl\|\.sub\b\|\.career" src/lib/views/boards/focus/CommandCenterView.svelte src/lib/views/boards/focus/career/CareerPanel.svelte` prints nothing. svelte-check accepts the module export: `COMPLETED 538 FILES 0 ERRORS 0 WARNINGS`. Command center unchanged: the look (case 25). |
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
9. The banner's body no longer has its own 4px top padding: each group's `margin-top: 4px` gives the gap, as in the command center. The open editor gets `padding-top: 4px` with `column-span: all`.
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
