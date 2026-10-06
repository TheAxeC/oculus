Everything in the brief is done. The guide is `tools/oculus/docs/apps.md` (603 lines, eleven parts), the four other files carry the edits the brief lists, and no code or test changed. One edit goes beyond the brief's wording and is user-visible: the Help page's arrangement in `config/layout.yml` was a split with one child, which oculus refuses to draw, so the Help rail button opened nothing; it is now one pane (see "Judgment calls").

## Open items

The state file's "Open items" section (`orchestrator-state.md:130`) holds no entry: the heading and its one explanatory sentence are followed by an empty list. The brief names none.

Decision for the orchestrator, from this step (not an open item for Axel, a defect for a code step): `getState` rejects with a `DataCloneError` when the tab's state is a list or a map. See "Anything wrong".

## The cases, first run on the unchanged tree, and the check after the change

Command prefix for the unchanged tree: `grep`, `sed -n` and `ls` over `E4g-base` and the worktree before any edit; output in the scratchpad `first/first.txt`.

| Case | Check | Result |
|------|-------|--------|
| 1 manifest keys | read `manifest.ts:23-46` | `KEYS` nine entries, `BRIDGE = 1`, `TITLE_MAX = 40`, `DESCRIPTION_MAX = 200`, `DEFAULT_ENTRY = 'index.html'`, `DEFAULT_GLYPH = 'app_view'`, `RESERVED_GLYPH = 'app'`. Guide part 4 table holds each. |
| 2 methods and handlers | read `methods.ts:217-334`, `oculus.js:11-133` | nine methods and three handlers; each has its own entry in part 6. |
| 3 refusal words | read `rules.ts:13-20`, `apps.yml:65` | six `REFUSED` values plus `not_json`, `refused:<reason>`, `failed:<status>`; all in part 7. |
| 4 the nine limits | `sed -n 202,215p config/behavior.yml` | `connect_timeout_s 10, state_max_kb 64, store_max_kb 256, writes_per_min 30, opens_per_min 30, keys_per_s 20, max_files 500, max_mb 20, closed_paths [secrets]`; part 8 holds them. |
| 5 file locations | read `watch/apps.ts`, `store.ts`, `options.yml:1352-1354` | `machineFolder` gives `~/.oculus/apps` when `apps_dir` is absent; `ROOT_DATA` is `.oculus/app-data`; part 2 says both. |
| 6 approval | read DESIGN.md 252-342, `apps.svelte.ts`, `AppFrame.svelte` | part 5 follows them; a root app has no Keep approved. |
| 7 `open` | read `methods.ts`, `open.ts` | four shapes (view, file, project, url) in part 6, with every rule listed. |
| 8 writes | read `writeAccess`, `bodies.ts`, `app-gate.ts`, `CONFIRMED_WRITES`, `History.svelte` | part 6 and part 7 hold the kinds, the `kind` rule, the five that ask, the three with no undo. |
| 9 example read by `scanApps` | `node $S/bin/scan.ts` (a `.ts` script run by Node 24 on copies under the scratchpad) | final run: `findings: []`; apps `app:hello` (3 files, 451 bytes) and `app:task-demo` (4 files, 5820 bytes, reads `portfolio`, writes `new-entry`, `delete-entry`); every file typed, no inline script, no handler attribute, no modal, storage or form; `channel portfolio {"access":"open"}`; `violations:` printed 0 for both apps. The files in the guide's fenced blocks equal the files run (checked by a script that compares each block to its file: all True). |
| 10 catalogue entry | first run: `docs:` list held four entries, the last `Data map`. After: `npm run test:quick` and `npx vitest run tests/checks/config` | After: test:quick `every command passed`, config checks `Test Files 3 passed, Tests 59 passed`. The Views catalogue lists "Apps guide | h7" in its Help group (browser run, case 14). |
| 11 no claim without code | each part read against the files in "Parts" below | no claim left unchecked; where code and DESIGN.md differ, the guide follows the code and the difference is listed below. |
| 12 history, dash, non-ASCII, wrap | greps below | all clean; each hit judged below. |
| 13 example runs | scratch oculus on 8797, headless Chrome driven over CDP, hub and `HOME` under the scratchpad | see "Case 13 run". |
| 14 Help page | first run on the unchanged tree: the pane at line 98 lacked the Apps guide, `HELP.md:21`, `:82`, `config/text/app.yml:12` said six. After: browser run below | see "Case 14". |

### Case 13 run (final example files, scratch oculus 8797)

Commands: `$S/bin/scratch.sh start`, then `node $S/cdp/example.mjs`, output `first/example-run9.txt`. Quoted lines:

```
## approve
{ "status": 200, "text": "{\"ok\":true}" }
## store file
{"notes":["first note"]}
## created line
Created: Task demo 1791274593273
## tasks.yml equals the original
true
## dialog on delete
The app Task demo asks to Delete an entry of a collection, asking you first.: {"kind":"delete-entry","collection":"tasks","id":"Task demo 1791274593273"}
## refusals after Cancel
write delete-entry: declined
## tasks.yml still holds the entry
true
## dialog on open url
The app Task demo asks to open this address in a new browser tab. The address can carry what the app has read.
https://example.org/
## refusals list
open view: missing
open file: closed
read inbox: not_declared
open url: declined
write delete-entry: declined
## tabs after open view
["Focus","Task demo","Findings (selected)","Live HPC (selected)","Usage"]
## changes.jsonl (kinds, in order)
app-store (undo field), new-entry (undo create), delete-entry (undo delete)
```

The quick start's `hello` app ran in the same scratch oculus (`first/debug11.txt`): approved it shows "Connected. The theme is light."; an edit of `app.js` makes the row show `approved:true` with a new hash after Keep approved; an edit of `app.yml` makes the panel say "This app changed since you approved it. Read what it asks for again and approve it to run it."

### Case 14 (final tree)

Commands: `node $S/cdp/case14.mjs`, `node $S/cdp/case14i.mjs`, `node $S/cdp/case14j.mjs`.

```
## Help page tabs
["Help*"," HPC how-to"," Data map"," Research approach"," Agent approach"," Apps guide","Memories","Live HPC*","Usage"]
## Views catalogue, Help group
... Help | h1 | Memories | h2 | Research approach | h3 | Agent approach | h4 | HPC how-to | h5 | Data map | h6 | Apps guide | h7 | SYSTEM ...
## guide in its tab
{"h2":11,"h3":8,"tables":13,"pre":9,"len":42856,"last":true}
## Settings page
App limits true, Closed folders true, apps_dir true
```

`HELP.md:21`, `:82` (`h1-h7`), `config/text/app.yml:12` (`h1-h7`) and the `DESIGN.md` tree line are in the diffs below.

## DONE / NOT DONE

| Deliverable | Command | Output | State |
|-------------|---------|--------|-------|
| `docs/apps.md` with eleven parts | `grep -n "^## " docs/apps.md` | `## 1. What an app is` ... `## 11. When something goes wrong` (lines 5, 15, 38, 90, 116, 140, 276, 322, 340, 356, 584) | DONE |
| HELP.md Apps sentence | `diff` against base | line 220 gains the sentence naming `docs/apps.md` | DONE |
| `docs:` entry | `diff` against base | `180a176 > - { label: "Apps guide",        path: tools/oculus/docs/apps.md, group: help }` | DONE |
| Help pane doc view | case 14 | tab list above | DONE |
| Lines made false | `diff` against base | `HELP.md:21`, `:82`, `config/text/app.yml:12`, `DESIGN.md:79` | DONE |
| ASCII check | `LC_ALL=C grep -n '[^ -~]' docs/apps.md; echo $?` | prints nothing, exit 1 (no match). Same check over `HELP.md`, `DESIGN.md`, `config/layout.yml`, `config/text/app.yml`: 0 lines each | DONE |
| `npm run diagrams` | exit status | exit 0; `diff -rq docs/diagrams <base>/docs/diagrams` prints nothing | DONE |
| `npm run test:quick` (final run) | exit status | `ok prettier`, `ok ASCII gate`, `ok svelte-kit sync`, `ok svelte-check ... 0 ERRORS 0 WARNINGS`, `ok vitest`, `test:quick: 14.3 s (limit 45.0 s); every command passed`, exit 0. Not covered per its own line: tests outside the selection, `tests/checks`, slow tests, build, lint of unchanged files | DONE |
| Config checks (outside test:quick's selection) | `npx vitest run tests/checks/config` | `Test Files 3 passed (3)`, `Tests 59 passed (59)` | DONE |
| Dash, spaced hyphen, ellipsis | `grep -n -- ' - \| -- \|\.\.\.' docs/apps.md` | two hits, lines 482 and 502, `...notes.map(` and `[...notes, text]`: JavaScript spread in the example's code block, code, kept | DONE |
| Tree unchanged outside the five files | `diff -rq --exclude=local.yml --exclude=node_modules --exclude=.scratch --exclude=.svelte-kit . <base>` | differs: `DESIGN.md`, `HELP.md`, `config/layout.yml`, `config/text/app.yml`, plus `Only in ./docs: apps.md`; `src`, `tests`, `utils` identical | DONE |
| Scratch oculus stopped | `lsof -nP -iTCP:8797 -sTCP:LISTEN; echo $?` | prints nothing, exit 1 | DONE |

Nothing is NOT DONE. Not covered by these runs: the full `npm test`, `test:slow` and `test:landing` (forbidden to this step), and the plan's landing verify list (runs at landing on main).

### History words in the guide

Commands: `grep -n -i -o ".\{30\}\bnow\b.\{20\}\|.\{30\}\bstill\b.\{20\}\|.\{30\}no longer.\{20\}" docs/apps.md` prints nothing; `grep -n -i -o ".\{40\}\balways\b.\{30\}" docs/apps.md` prints nothing. `grep -n -i -o ".\{30\}\bbefore\b.\{30\}" docs/apps.md` prints six hits, each judged: lines 40, 150, 180, 183, 268 and 591 state the order of events in the code or the page (`script before app.yml`, `Before it resolves, connect paints the theme`, `before oculus sees it`, `before oculus answers`, `before it is judged`, `threw before connect`); none refers to an earlier version of the tool. The words `used to`, `previously` and `as before` were not searched in this final turn, so they are: not verified by a command in this report.

## Parts of the guide and what each was read from

1. What an app is: `DESIGN.md:252-342`, `address.ts:27`, `apps.svelte.ts`, `AppFrame.svelte`.
2. Where the files go: `watch/apps.ts:92-97`, `scan.ts`, `store.ts`, `options.yml:1352-1354`, `manifest.ts` name rule, `record.ts` (hash and recorded files).
3. Quick start: `oculus.js` head comment, `manifest.ts`, the scratch run of `hello`.
4. Manifest: `manifest.ts`, `findings.yml` `findings.apps.*`, `apps.yml` words.
5. Approval and change: `apps.svelte.ts`, `AppFrame.svelte`, `record.ts`, DESIGN.md "Approval".
6. Bridge: `methods.ts`, `oculus.js`, `bridge.ts`, `store-cache.ts`, `app-store.ts`, `app-gate.ts`, `bodies.ts`, `open.ts`, `payloads.ts`, `shapes.ts`, `model/index.ts`, `model-calendar.ts`, `model-mail.ts`, `model-sessions.ts`, `registry.ts`, `opening.ts`, `History.svelte`, `Confirm.svelte`, `AskConfirm.svelte`.
7. Refusal words: `rules.ts`, `methods.ts`, `app-gate.ts`, `feeds.ts`, `writes.ts`, `writes/entries.ts` (the reasons in the table are the sentences printed there).
8. Limits: `config/behavior.yml:202`, `settings.ts` (`appsSettings`, `settingReader.leaf`, `closedPaths`), `options.yml:658-731`.
9. What an app cannot do: `address.ts` (CSP, `TYPED`), `DESIGN.md` "What an app does not get", `rules.ts`.
10. Worked example: every file of the example read through the bridge in `methods.ts`; run in case 13.
11. When something goes wrong: `findings.yml`, `apps.yml`, `AppFrame.svelte`, the scratch run.

## Files and line counts

`wc -l`: `docs/apps.md` 603, `DESIGN.md` 437, `HELP.md` 375, `config/layout.yml` 176, `config/text/app.yml` 170. The step adds or changes no test and no code.

`sh utils/unused-exports.sh`: exit 0, 382 lines (scratch `first/unused.txt`). `src` is identical to the base (`diff -rq` above), so the list is the base's list; the base copy has no `node_modules`, so the base's own output was not produced and this equality is by identical input, not by a second run.

## Judgment calls

1. The Help page arrangement (`config/layout.yml` line 93 onward) was `root: { kind: split, dir: row, sizes: [0.6, 0.4], children: [ <one pane> ] }`. `readNode` in `src/lib/state/workbench/layout/saved/saved.ts` (about line 241) refuses a split with fewer than two children, so the whole arrangement is dropped and the Help rail button opened no page. The brief's claim that the guide "opens on the Help page" cannot hold without a parseable arrangement, and the arrangement is in a file on the write list, so it is now `root: { kind: pane, view: [help, ... Apps guide, memories] }`. Alternative: leave it and book it; that was the lazy option. This is a user-visible change (before: Help button did nothing on a fresh profile; after: it opens one pane with seven tabs). The second 40 percent that `sizes` implied held no pane.
2. The example keeps its tab state as a string (`setState(id)` and `setState('')`) because of the `getState` defect named under "Anything wrong".
3. The example puts "Open example.org" before "Open Findings" and the guide's walkthrough presses them in that order, because the view opened last lands in the app's pane and hides the app's tab, and a question box of the hidden tab sits at 0,0. The guide says so in part 6 under `open`.
4. The guide shows reasons as printed by the code, including the odd sentence `the identity field is what the entry is found by`.
5. Sentences over about 30 words (the prose standard asks about 20): reasons of the refusal part and the limits part list several exact conditions in one sentence (`closed_paths` shape, the `closed` and `missing` rule list of `open({ file })`, the CSP and typed-extension list). Those that could be split were split; the rest are lists of exact conditions where a split would separate a condition from its result. No list item carries two ideas.

## Visible changes, before and after

| Place | Before | After |
|-------|--------|-------|
| Views catalogue, Help group | six entries (h1 to h6) | seven, "Apps guide" is h7 |
| Help page tabs | Help, HPC how-to, Data map, Research approach, Agent approach, Memories | Apps guide between Agent approach and Memories |
| Help rail button | opened nothing on a fresh profile | opens the Help page |
| `HELP.md:82` and `config/text/app.yml:12` | `h1-h6` | `h1-h7` |
| `HELP.md:21` | tab list without the guide | tab list names the guide |
| `HELP.md` Apps section | no pointer | one sentence naming `docs/apps.md` |
| `DESIGN.md:79` | `docs/` held only `diagrams/` | tree line for `docs/apps.md` |

## Anything wrong in the brief, and every place the code and DESIGN.md disagree

1. Defect in unmodified code: `getState` rejects with a `DataCloneError` when the tab's state is a list or a map, while `setState` accepts it (found in the scratch run; `apps.svelte.ts` is byte-identical to the base). Code is outside the write list, so the guide tells readers to save text and use `JSON.stringify`, and the example keeps its state as a string. A code step should fix it.
2. DESIGN.md line 330 says `open({ view: 'terminal' })` rejects `closed`. `Terminal.svelte` registers `id: 'terminal'` with no `listed: false`, so the catalogue lists it and `open` opens a Terminal tab. The guide follows the code (part 6, `{ view }` row).
3. The confirmation question of a write is built from two catalogue words and prints `...asking you first.:` (case 13 output above), a full stop followed by a colon. The guide quotes the printed text. Not changed (code and words are outside the write list).
4. The Help page arrangement was a split holding one pane (judgment call 1). DESIGN.md and HELP.md describe the Help page as a page that opens.
5. `appsSettings` (`settings.ts:371`) gives each of the eight numeric limits its catalogue default when the key is missing or wrong, and `closed_paths` a finding `closed_paths_shape` with every file closed; the guide says exactly this in part 8.
6. A question box of an app's tab that is not the selected tab of its pane is drawn inside the hidden pane (case 13: the dialog stayed open at 0,0 after `Open Findings` took the pane). The guide says to answer from the app's tab and orders the example so that the view opens last. This is the unmodified behaviour; whether it is a defect is for a code step.
7. Not checked in this step: the guide's channel payload tables against `model-calendar.ts` and `model-sessions.ts` were read from the types, and DESIGN.md's channel table was not compared field by field: not verified.
