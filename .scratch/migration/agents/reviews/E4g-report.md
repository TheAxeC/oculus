Not done: the `onTheme` triggers, the policy sentence and the inline-script row of the guide are stated from the source and were not run in a browser; the channel payload tables other than the Project fields were read from the model types and not compared by a script; five prose sentences and 14 table cells of the guide stay over 25 words (reason for each under Standards 3 of "Repair round 1"). Everything else in the brief and in repair round 1 is done. The guide is `tools/oculus/docs/apps.md` (861 lines, eleven parts); the three code defects are fixed in `src` (the `getState` copy, the question words, the selected tab), `DESIGN.md` is corrected, and no test was added or changed.

## Open items

The state file's "Open items" section (`orchestrator-state.md:130`) holds no entry: the heading and its one explanatory sentence are followed by an empty list. The brief names none.

Nothing is open for Axel. For the orchestrator: `DESIGN.md:83` says every group has a chord, which is false for the `apps` group; the sentence is outside this step's write list and is unchanged.

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
| 9 example read by `scanApps` (final run in "Repair round 1") | `node $S/bin/scan.ts` (a `.ts` script run by Node 24 on copies under the scratchpad) | final run: `findings: []`; apps `app:hello` (3 files, 451 bytes) and `app:task-demo` (4 files, 5820 bytes, reads `portfolio`, writes `new-entry`, `delete-entry`); every file typed, no inline script, no handler attribute, no modal, storage or form; `channel portfolio {"access":"open"}`; `violations:` printed 0 for both apps. The files in the guide's fenced blocks equal the files run (checked by a script that compares each block to its file: all True). |
| 10 catalogue entry | first run: `docs:` list held four entries, the last `Data map`. After: `npm run test:quick` and `npx vitest run tests/checks/config` | After: see the verification table of "Repair round 1". The Views catalogue lists "Apps guide" (h7) in its Help group (case 14). |
| 11 no claim without code | each part read against the files in "Parts" below | no claim left unchecked; where code and DESIGN.md differ, the guide follows the code and the difference is listed below. |
| 12 history, dash, non-ASCII, wrap | greps below | all clean; each hit judged below. |
| 13 example runs | scratch oculus on 8797, headless Chrome driven over CDP, hub and `HOME` under the scratchpad | whole run in "Repair round 1", Proof. |
| 14 Help page | first run on the unchanged tree: the pane at line 98 lacked the Apps guide, `HELP.md:21`, `:82`, `config/text/app.yml:12` said six. After: browser run | whole output in "Repair round 1", Proof. |

The runs of cases 13 and 14 on the final tree are quoted whole in "Repair round 1", Proof.

## DONE / NOT DONE

| Deliverable | Command | Output | State |
|-------------|---------|--------|-------|
| `docs/apps.md` with eleven parts | `grep -n "^## " docs/apps.md` | `## 1. What an app is` ... `## 11. When something goes wrong` at lines 5, 15, 38, 90, 122, 147, 460, 534, 552, 574, 809 (before the Project table was added; the file is 861 lines) | DONE |
| HELP.md Apps sentence | `grep -n "docs/apps.md" HELP.md` | the Apps section names the guide | DONE |
| `docs:` entry | `grep -n "Apps guide" config/layout.yml` | the entry with `group: help` | DONE |
| Help pane doc view | case 14, Repair round 1 | tab list names "Apps guide" | DONE |
| Lines made false | `diff` against base | `HELP.md:21`, `:82`, `config/text/app.yml:12`, `DESIGN.md:79` | DONE |
| Repair round 1 | see the section below | every finding closed | DONE |

Not covered by these runs: the full `npm test`, `test:slow` and `test:landing` (forbidden to this step), and the plan's landing verify list (runs at landing on main).

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

`wc -l` after repair round 1: `docs/apps.md` 861, `DESIGN.md` 437, `HELP.md` 375, `config/layout.yml` 176, `config/text/app.yml` 170, `config/text/findings.yml` 215, `config/text/views/apps/apps.yml` 74, `src/lib/state/system/apps/apps.svelte.ts` 421, `methods.ts` 341, `words.ts` 75. No test was added or changed (`diff -rq tests <base>/tests` printed "tests identical" after the final edit).

## Judgment calls

1. The Help page arrangement (`config/layout.yml` line 93 onward) was `root: { kind: split, dir: row, sizes: [0.6, 0.4], children: [ <one pane> ] }`. `readNode` in `src/lib/state/workbench/layout/saved/saved.ts` (about line 241) refuses a split with fewer than two children, so the whole arrangement is dropped and the Help rail button opened no page. The brief's claim that the guide "opens on the Help page" cannot hold without a parseable arrangement, and the arrangement is in a file on the write list, so it is now `root: { kind: pane, view: [help, ... Apps guide, memories] }`. Alternative: leave it and book it; that was the lazy option. This is a user-visible change (before: Help button did nothing on a fresh profile; after: it opens one pane with seven tabs). The second 40 percent that `sizes` implied held no pane.
2. The example keeps its tab state as a string (`setState(id)` and `setState('')`); a list or a map would read back as well, and part 6 says so.
3. The example puts "Open example.org" before "Open Findings" and the walkthrough presses them in that order. A question asked by a hidden tab brings the tab forward (repair round 1, Spec 1(d)), so the order is a convenience of the walkthrough.
4. The guide shows reasons as printed by the code, including the sentence `the identity field is what the entry is found by`.
5. Sentences over 25 words: see "Repair round 1", Standards, per sentence.

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
| Question of a confirmed write | `The app Task demo asks to Delete an entry of a collection, asking you first.: {...}` | `The app Task demo asks to delete an entry of a collection: {...}` |
| Tab of an app whose question is drawn | stayed hidden behind the selected tab | selected in its pane |
| `getState` after `setState` of a list or a map | rejected | answers the value |
| Approval panel, inbox, calendar, sessions | `Read the subjects and senders of your mail.`, `Read the titles and attendees of your calendar events.`, `Read the titles, prompts and paths of your Claude sessions.` | `Read the subjects, senders and message previews of your mail.`, `Read the titles, times, places and links of your calendar events.`, `Read the titles, prompts, paths and events of your Claude sessions.` |

## Anything wrong in the brief, and every place the code and DESIGN.md disagree

1. `DESIGN.md:83` says every group has a chord; the `apps` group has none. The sentence is outside this step's write list and is unchanged; for the orchestrator.
2. `appsSettings` (`settings.ts:371`) gives each of the eight numeric limits its catalogue default when the key is missing or wrong, and `closed_paths` a finding `closed_paths_shape` with every file closed; the guide says exactly this in part 8.
3. The channel payload tables of part 6 are read from the model types (`model-entities.ts`, `model-calendar.ts`, `model-mail.ts`, `model-sessions.ts`, which also holds the usage types); see Spec 2 in "Repair round 1".

## Repair round 1

Every finding of `E4g-refuter.md` is closed by its heading and number below. `$S` is the scratchpad; all outputs are saved files under `$S/r1/`.

### Code and words changed (the three defects, the terminal sentence)

| Change | File | What it is |
|--------|------|-----------|
| `getState` copy | `src/lib/state/system/apps/apps.svelte.ts:293` | `getState: () => $state.snapshot(appTab(deps.ui.instanceState(options.instance)).value)`, the same call `held` uses |
| Question words | `config/text/views/apps/apps.yml` (new group `apps.ask`, five verb phrases), `src/lib/state/system/apps/words.ts` (`askWords`), `methods.ts:267` (`askWords(kind)` in place of `writeWords(kind)`) | `confirm_write` is unchanged; the approval panel still reads `apps.write.<kind>` |
| Tab selected | `apps.svelte.ts` `showFirst` calls `deps.layout.activateInstance(instance)`; `AppsDeps.layout` gains `activateInstance` (the layout store passed in `context.ts` already has it) | the tab of a question is selected in its pane |
| `terminal` sentence | `DESIGN.md` Opening paragraph | `terminal`, which is listed, opens a Terminal tab; `document`, `file`, `source`, `project` and every view that is not listed reject `closed`; guide part 6 stays |
| `ask.<kind>` word group | `DESIGN.md` (words list), `DESIGN.md` (open question paragraph names the selected tab) | the written design names the new words and the selected tab |
| Panel words | `apps.yml` `read.inbox`, `read.calendar`, `read.sessions`; `findings.yml` `carries.inbox`, `carries.calendar`, `carries.sessions`; `DESIGN.md` channel paragraph | see Judgment call A |

Diff of the code files against the base: `diff <base>/src/lib/state/system/apps/apps.svelte.ts src/lib/state/system/apps/apps.svelte.ts` shows the `activateInstance` line in `AppsDeps`, the `showFirst` call with its comment, and the `$state.snapshot` line; `methods.ts` shows two lines; `words.ts` shows the `ASK` table and `askWords`.

### Spec

1. **The three defects written up as intended behaviour.**
   - (a) `getState`: fixed in `apps.svelte.ts:293`. Run on the rebuilt scratch oculus (`$S/cdp/state2.mjs`, saved in `$S/r1/state2-run.txt`): `setState([1,{a:2}])` is accepted and `getState()` answers `[1,{"a":2}]`. The guide's rows at `docs/apps.md:175` and `:188` now say the value is a copy of the saved value, a list or a map included; the `DataCloneError` row is gone (`grep -c DataCloneError docs/apps.md` prints 0). The unchanged tree rejected this call (first-round run); the tree now answers it.
   - (b) Question text: the dialog of the run below reads `The app Task demo asks to delete an entry of a collection: {"kind":"delete-entry","collection":"tasks","id":"Task demo 1791285393599"}` (case 13, whole, below): lower-case verb, one colon, no `.:`. Guide `:433` quotes the form `The app <title> asks to <kind in words>: <body>` and the five phrases.
   - (c) `DESIGN.md` Opening paragraph rewritten as in the table; the code stands. `grep -n "terminal" DESIGN.md` shows the sentence; guide part 6 `{ view }` row is unchanged.
   - (d) Tab selected: in `$S/r1/hidden-run.txt` the app is hidden behind Findings (`["Focus","Task demo","Findings (selected)",...]`), the Delete is pressed, and while the question is asked the tabs read `["Focus","Task demo (selected)","Findings","Live HPC (selected)","Usage"]`; the dialog is present, Confirm deletes and `tasks.yml` is as it was. Guide: `:473` (`open`) and step 8 at `:825`.
2. **Payload types (brief item 1.6).** Part 6 "Channels" has an overview table and one subsection per channel (`portfolio`, `feeds`, `hpc`, `audit`, `config`, `git`, `files`, `inbox`, `calendar`, `sessions`, `usage`), each with the field names and types read from the model types. The record fields of a Project were compared with `Project` in `src/lib/data/model/model-entities.ts` by a script that lists the type's fields and the guide's fields (both differences empty apart from the `tier` values). The other channels were read from the types, not compared by a script: not verified mechanically.
   - First line corrected: it states what holds, and the section "Not done and not verified" below names what is left.

### Proof

1. **History rows.** In the whole run of case 13 below, the `## History rows` block shows `entry removed`, `entry added` and `app store`, each with Undo. The Undo of `entry removed` writes the entry back to `tasks.yml`, the Undo of `entry added` removes it, and `## tasks.yml equals the original` prints `true`.
2. **Cases 9 and 13 whole, case 14 from a saved file.** Quoted whole below, with the files `$S/r1/case9-run.txt`, `$S/r1/case13-whole.txt`, `$S/r1/case14-run.txt`.
3. **Verify item 5 per sentence.** See Standards below.
4. **History words.** `grep -n -i -w -E "used to|no longer|still|always has been|always had|as before|previously|before|now|always|earlier|formerly|originally|new|old|fixed|reverted|renamed" docs/apps.md` prints hits only in these uses, each read: `before` states an order of events in the code or page (lines 40, 157, 187, 190, 473, 837) or is the History column label `Before` (826); `new` is in a kind name (`new-entry`, `new-idea`), in `a new entry`, `a new message`, `A new folder is offered` or `a new browser tab`. None refers to an earlier version of the tool. `used to`, `no longer`, `still`, `previously`, `as before`, `always has been`, `formerly`, `originally`, `reverted` and `renamed` print nothing (the same command, no hit on those words).

### Standards

1. `no collection <name>` is written with the placeholder at `docs/apps.md:505`.
2. Line 11: "may read every channel an app can read (part 6)"; line 220 lists the channels no app reads. `grep -n "may be offered every channel" docs/apps.md` prints nothing.
3. Sentence and list-item rules (verify item 5). `LC_ALL=C grep -n '[^ -~]' docs/apps.md` prints nothing; a sentence-length script over every paragraph, list item and table cell was run, and the long sentences and long cell lists were split, turned into lists or turned into tables (the SessionRecord, Terminal and UsageAccount shapes, the Project fields, the findings of a folder, the denied channels, the field reasons, the example's panel lines). The departures that remain, each with the reason for its form:
   - `:9` (26 words): a list of five things the frame lacks; splitting it would repeat the subject five times.
   - `:433` (30 words): the five quoted phrases of the confirmation, which have to be read together to be compared with the five kinds.
   - `:471` (38 words): contains the quoted question text, which must appear whole.
   - `:587` (27 words): one condition, the boundary, with two things approved.
   - `:819` (34 words): the script's output line quoted in the example, "The theme is light." and the count line, then one sentence.
   - table cells over 25 words: `:128`, `:130` (control behaviours, one cell each), `:163` (the `onChannel` trigger), `:239`, `:243`, `:247`, `:249` (field lists of the entity table: a split would separate a field from its record), `:405` (the `windows` item type), `:493`, `:494` (what makes a reason), `:535`, `:542`, `:551` (the exact condition of a finding), `:834`, `:837` (the symptom rows of part 11).
   - Remaining count: 5 prose sentences and 14 table cells over 25 words. All of them state exact conditions or quoted text.

### Behaviour

1. **Open the app's folder.** Line 130 quotes the notice. Run (`$S/cdp/folder.mjs`, saved in `$S/r1/folder-run.txt`, quoted below): pressing the button for a machine app outside the roots shows the notice `The folder of this app, <path>, is inside no root the file browser shows.`, and the guide row quotes it.
2. **Step 9 ends with the tasks file as it was.** Step 9 (`:826`) names Undo on `entry removed` and then Undo on `entry added` and says `tasks/tasks.yml` is as it was before step 4. Run in case 13 below: `tasks.yml equals the original` prints `true` after both Undo presses.
3. **`not_json` and class instances.** Run (`$S/r1/state2-run.txt`): a `Date`, a `Map`, a `Set`, `undefined`, an object holding `undefined`, `NaN`, `Infinity` and a cycle each reject `not_json`; a class instance is accepted and reads back as `{"x":1}`; a function rejects with a `PenpalError` whose `code` is `TRANSMISSION_FAILED`. Guide `:186` and `:187`. Whole output below.
4. **`onTheme` triggers.** Line 164 lists theme, wallpaper, CRT overlay, text size and each time oculus draws the app again. Source: `AppFrame.svelte:104-114` (the effect reads `ui.theme()`, `ui.wallpaper()`, `ui.crt()`, `ui.textScale()` and calls `apps.themeChanged`). Not run in a browser: not verified by a run.
5. **Policy.** Line 581: `connects` origins are allowed for `fetch` and other connection requests only; an `<img src>` or `<script src>` on one is blocked. Source: `address.ts` `appPolicy` (`img-src ${base} data:`, `script-src ${base} ${shared}`, `connect-src` holds `connects`). Not run in a browser: not verified by a run.
6. **Inline script.** Line 837 says a script that is all inline never calls `connect`, so the tab shows "The app did not answer in time." (`AppFrame.svelte:209-214`); line 838 describes only the mixed case. Not run in a browser: not verified by a run.
7. **Panel path.** Step 1 (`:816`) shows `<home>/.oculus/app-data/task-demo.json.` with `<home>` explained; the run's panel line (case 13) prints the absolute path under the scratch home.
8. **Approvals key.** Line 139 names the `approvals` key of `config/local.yml`.
9. **`snippet`.** Line 341 names `snippet` and says a machine app that reads `inbox` receives part of every message's content; the approval panel and `findings.yml` words say previews (Judgment call A).

### Findings outside the numbered list, as the reviewer closed them

- Brief item 1.6: Spec 2 above.
- Brief item 1.11 and case 3: the section "Reading a refusal in the browser console" is at `:848`, five steps; the page-level console of an unhandled `oculus.read('inbox')` shows `Uncaught (in promise)` with the value `not_declared` and a handled call logs the word (`$S/r1/state-run.txt`, below). The store reasons `unwritable`, `outside`, `too_large` and `readback` are in the reasons table (`:516` to `:519`; source `app-store.ts:53`, `:55`, `:60`, `:80`); the feed rows are `no entry <id> in <collection>` and `unknown feed <name>` (`:504`, `:506`) with the LinkedIn rows `the LinkedIn folder is not on this hub` and `the LinkedIn idea file is not on this hub` (`:510`, `:511`); the `failed:<status>` row (`:495`) names `write`, `setStore`, `getStore` and `open`; `no collection <name>` is `:505` and a run answered `{"status":404,"text":"{\"error\":\"no collection nonesuch\"}"}` for an unknown collection.
- Help arrangement: one pane, as the orchestrator ruled; unchanged.

### Judgment calls of this round

A. The approval-panel words and the finding words for `inbox`, `calendar` and `sessions` said "subjects and senders", "titles and attendees" and "titles, prompts and paths". The code carries a `snippet` for each mail thread, no attendees for an event (it holds title, times, place and links) and timeline events for a session. I corrected the words (and the DESIGN.md channel paragraph) so the guide and the panel say the same; this changes what the panel shows to a reader approving such an app (Visible changes above).
B. The question's verb phrases are a separate word group `apps.ask.<kind>`, because `apps.write.<kind>` is a panel sentence (capitalised, ends in a period) and `confirm_write` needs a lower-case verb phrase. The alternative, lower-casing and trimming `apps.write.<kind>` in code, would have broken the sentences of the panel.
C. `activateInstance` is added to `AppsDeps.layout`; the object passed already has it, so no wiring changed.
D. The Project fields of the `portfolio` channel are a separate table below the entity table.

### Verification of the round

| Check | Command | Result |
|-------|---------|--------|
| Diagrams | `npm run diagrams; echo $?` | exit 0; `docs/diagrams/channels.dot` and `.svg` differ from the base in the one line number `apps.svelte.ts:285` against `:278` (the file grew), the regenerated output |
| Quick suite | `npm run test:quick; echo $?` | last run: `ok prettier`, `ok ASCII gate`, `ok svelte-kit sync`, `ok eslint`, `ok vitest`, `ok svelte-check ... 0 ERRORS 0 WARNINGS`, `every command passed`, exit 0. It prints `over the time limit` (65.0 s against 45.0 s): the machine's load average is 14 to 19. At that load a 5000 ms vitest timeout can hit a test unrelated to this step; the tests that timed out pass when run alone. Not covered per its own line: tests outside the selection, `tests/checks`, slow tests, build, lint of unchanged files |
| Checks and apps tests | `npx vitest run tests/checks/config tests/checks/source tests/state/system/apps` | `Tests 149 passed` of 150, the one other, `tests/checks/source/html-sites.test.ts`, a 5000 ms timeout under load, passes alone (`Tests 19 passed (19)`); the earlier run of the same command passed config-folder and keys.test.ts under `--testTimeout=120000` (`Tests 28 passed (28)`) |
| ASCII | `LC_ALL=C grep -c '[^ -~]' <file>` over `docs/apps.md`, `DESIGN.md`, `HELP.md`, `config/layout.yml`, `config/text/app.yml`, `config/text/findings.yml`, `config/text/views/apps/apps.yml`, `apps.svelte.ts`, `methods.ts`, `words.ts` | prints 0 for each |
| Dashes, hyphens, ellipsis | `grep -n -- ' - \| -- \|\.\.\.' docs/apps.md` | after removing the nested list markers of step 1 (`   - `), two hits remain, `:721` `...notes.map(` and `:741` `[...notes, text]`, the JavaScript spread in the example's code block, kept as code |
| Unused exports | `sh utils/unused-exports.sh; echo $?` | exit 0, 381 lines; the list equals the first-round list apart from its trailing `exit` line; `askWords` is used by `methods.ts` and is not listed |
| Prettier on the guide | `npx prettier --check docs/apps.md` | `All matched files use Prettier code style!` |
| Tests untouched | `diff -rq tests <base>/tests` | prints "tests identical" |
| Changed files | `diff -rq --exclude=local.yml --exclude=node_modules --exclude=.scratch --exclude=.svelte-kit --exclude=build . <base>` | `DESIGN.md`, `HELP.md`, `config/layout.yml`, `config/text/app.yml`, `config/text/findings.yml`, `config/text/views/apps/apps.yml`, `docs/diagrams/channels.dot`, `docs/diagrams/channels.svg`, `src/lib/state/system/apps/apps.svelte.ts`, `methods.ts`, `words.ts`, and `Only in ./docs: apps.md` |
| Guide blocks equal the example files | python block comparison | all True for `hello` (`index.html`, `app.js`, `app.yml`) and `task-demo` (`index.html`, `app.css`, `app.js`, `app.yml`) |

### Not done and not verified

- Not verified by a run: the `onTheme` triggers (Behaviour 4), the policy sentence (Behaviour 5) and the inline-script row (Behaviour 6); each is stated from the named source lines.
- Not verified mechanically: the channel payload tables other than the Project fields (Spec 2).
- The DevTools filter or panel menu text is not described in the guide: the console section names only what the page prints and the word it carries.
- The sentence lengths named under Standards 3 remain over 25 words, with the reason for each.

### Runs, whole

Case 9 (`node $S/bin/scan.ts`, `$S/r1/case9-run.txt`):

```
apps: [
  {
    id: 'app:hello',
    title: 'Hello',
    glyph: 'app_view',
    entry: 'index.html',
    reads: [],
    writes: [],
    connects: [],
    files: 3,
    bytes: 451,
    approved: false,
    storeBytes: 0,
    storeFile: '<S>/scan-run/data/hello.json'
  },
  {
    id: 'app:task-demo',
    title: 'Task demo',
    glyph: 'page',
    entry: 'index.html',
    reads: [ 'portfolio' ],
    writes: [ 'new-entry', 'delete-entry' ],
    connects: [],
    files: 4,
    bytes: 5820,
    approved: false,
    storeBytes: 0,
    storeFile: '<S>/scan-run/data/task-demo.json'
  }
]
findings: []
folders: [ '<S>/scan-run/machine' ]
app:hello app.js typed: true inline script: false handler attribute: false modal/storage/form: false
app:hello app.yml typed: true inline script: false handler attribute: false modal/storage/form: false
app:hello index.html typed: true inline script: false handler attribute: false modal/storage/form: false
app:task-demo app.css typed: true inline script: false handler attribute: false modal/storage/form: false
app:task-demo app.js typed: true inline script: false handler attribute: false modal/storage/form: false
app:task-demo app.yml typed: true inline script: false handler attribute: false modal/storage/form: false
app:task-demo index.html typed: true inline script: false handler attribute: false modal/storage/form: false
channel portfolio {"access":"open"}
write kind new-entry open
write kind delete-entry open
violations: 0
new-entry parser: {"kind":"new-entry","collection":"tasks","fields":{"title":"Task demo 1"}}
delete-entry parser: {"kind":"delete-entry","collection":"tasks","id":"Task demo 1"}
left behind outside the run folder: no data folder
```

Case 13 (`node $S/cdp/example3.mjs`, scratch oculus 8797, `$S/r1/case13-whole.txt`):

```
## rows after the copy
[
 {
  "name": "task-demo",
  "title": "Task demo",
  "reads": [
   "portfolio"
  ],
  "writes": [
   "new-entry",
   "delete-entry"
  ],
  "approved": false,
  "key": "",
  "files": 4
 }
]
## findings
no apps[...] finding in page data
   [rail after 1554 ms]
## panel
Approve this app
Task demo

Reads the tasks collection, keeps notes, creates and deletes one task, and opens a view and an address.

Name: task-demo

Folder: /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/scratch/apps/task-demo

4 files, 6 KB

This app is a folder of web files that runs inside oculus. It runs only after you approve it, and it asks again whenever its files change. It can:

Read the portfolio, with every project, person, venue and funding entry.
Add an entry to a collection.
Delete an entry of a collection, asking you first.
Reach no address outside this machine.
Keep its own data in /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/scratch/home/.oculus/app-data/task-demo.json.
Approve
Keep approved while I edit
Open the app's folder
## approve
{
 "status": 200,
 "text": "{\"ok\":true}"
}
## app after approval
Task demo

Connected. The theme is light.

Channel

2 entries in tasks; an entry is named by its title.

Store

 Add note

Write

Create a task Delete that task

Open

Open example.org Open Findings

Refusals

Read inbox Open the engine's local.yml Open a view that is not there
   [store file after 1208 ms]
## store file
{"notes":["first note"]}
   [note shown after 784 ms]
## notes list in the app
first note
   [created line after 319 ms]
## created line
Created: Task demo 1791285393599
## tasks.yml after create
title: Tasks
schema:
  - { field: title, type: text }
  - { field: status, type: select, options: [open, done] }
entries:
  - title: "Review the draft"
    status: open

  - title: "Another task"
    status: open

  - title: Task demo 1791285393599

   [dialog after 48 ms]
## dialog on delete
The app Task demo asks to delete an entry of a collection: {"kind":"delete-entry","collection":"tasks","id":"Task demo 1791285393599"}

Cancel
Confirm
   [declined after 1 ms]
   [dialog closed after 2 ms]
## refusals after Cancel
write delete-entry: declined
## tasks.yml still holds the entry
true
   [dialog 2 after 152 ms]
   [deleted after 707 ms]
   [dialog closed 3 after 1 ms]
## created line after delete

## tasks.yml equals the original
true
   [dialog url after 60 ms]
## dialog on open url
The app Task demo asks to open this address in a new browser tab. The address can carry what the app has read.

https://example.org/

Cancel
Confirm
   [declined 2 after 4 ms]
   [dialog closed 2 after 1 ms]
## refusals after open url Cancel
open url: declined
write delete-entry: declined
   [dialog url 2 after 71 ms]
   [dialog closed 4 after 6 ms]
## targets
{
 "before": 8,
 "after": 9,
 "added": [
  "https://example.org/"
 ]
}
   [refusals after 17 ms]
## refusals list
open view: missing
open file: closed
read inbox: not_declared
open url: declined
write delete-entry: declined
   [findings tab after 40 ms]
## tabs after open view
["Focus","Task demo","Findings (selected)","Live HPC (selected)","Usage"]
## theme tokens in the frame
[["--bg","#f1f5f9"],["--ink","#0f172a"],["--muted","#64748b"],["--c-red","#dc2626"]]
## changes.jsonl
{"at":"2026-10-06T11:16:33.092Z","kind":"app-store","file":"/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/scratch/home/.oculus/app-data/task-demo.json","key":"app:task-demo","field":"store","before":0,"after":24,"undo":"field","app":"app:task-demo"}
{"at":"2026-10-06T11:16:33.886Z","kind":"new-entry","file":"tasks/tasks.yml","key":"Task demo 1791285393599","field":"entries","before":null,"after":{"title":"Task demo 1791285393599"},"undo":"create","app":"app:task-demo"}
{"at":"2026-10-06T11:16:36.211Z","kind":"delete-entry","file":"tasks/tasks.yml","key":"Task demo 1791285393599","field":"entries","before":{"title":"Task demo 1791285393599"},"after":null,"undo":"delete","app":"app:task-demo"}

## store file at the end
{"notes":["first note"]}
## console of the page (errors naming the app)
[]
   [history rows drawn after 26849 ms]
## History rows
HISTORY | 13:16 | entry removed | tasks/tasks.yml | Task demo 1791285393599 / entries | Undo | Before | 1 | values | After | nothing | 13:16 | entry added | tasks/tasks.yml | Task demo 1791285393599 / entries | Undo | Before | nothing | After | 1 | values | 13:16 | app store | /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/scratch/home/.oculus/app-data/task-demo.json | app:task-demo / store | Undo | Before | 0 bytes | After | 24 bytes | Live HPC | Usage | LIVE HPC | unreachable | | | retrying every 2m | utwente names no resource | Refresh now | YQ530VVFGK | 36
## undo target of entry removed
[
 596.0234375,
 587,
 "13:16 entry removed tasks/tasks.yml Task demo 1791285393599 / entries Undo"
]
   [file changed after 1060 ms]
## tasks.yml after Undo on entry removed
title: Tasks
schema:
  - { field: title, type: text }
  - { field: status, type: select, options: [open, done] }
entries:
  - title: "Review the draft"
    status: open

  - title: "Another task"
    status: open

  - title: Task demo 1791285393599

## undo target of entry added
[
 596.0234375,
 653.5,
 "13:16 entry added tasks/tasks.yml Task demo 1791285393599 / entries Undo"
]
   [file changed after 1215 ms]
## tasks.yml after Undo on entry added
title: Tasks
schema:
  - { field: title, type: text }
  - { field: status, type: select, options: [open, done] }
entries:
  - title: "Review the draft"
    status: open

  - title: "Another task"
    status: open

## tasks.yml equals the original
true
## History rows after both Undo
HISTORY | Task demo 1791285393599 / entries is back. | 13:17 | entry removed | tasks/tasks.yml | Task demo 1791285393599 / entries | Undo | Before | nothing | After | 1 | values | 13:16 | entry removed | tasks/tasks.yml | Task demo 1791285393599 / entries | Undo | Before | 1 | values | After | nothing | 13:16 | entry added | tasks/tasks.yml | Task demo 1791285393599 / entries | Undo | Before | nothing | After | 1 | values | 13:16 | app store | /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/scratch/home/.oculus/app-data/task-demo.json | app:task-demo / store | Undo | Before | 0 bytes | After
```

Case 14 (`node $S/cdp/case14final.mjs`, `$S/r1/case14-run.txt`):

```
## Help page tabs
["Help*"," HPC how-to"," Data map"," Research approach"," Agent approach"," Apps guide","Memories","Live HPC*","Usage"]
## guide in its tab
{"h1":1,"h2":11,"h3":9,"h4":11,"tables":23,"pre":10,"ol":4,"len":56837,"last":true,"part11":true}
## catalogue Help group
s | r4 | PRESENT | T | Present | t1 | APPS | Panel test | v1 | Task demo | v2 | HELP | H | Help | h1 | Memories | h2 | Research approach | h3 | Agent approach | h4 | HPC how-to | h5 | Data map | h6 | Apps guide | h7 | SYSTEM | Y | Setting
## Settings mentions
[["App limits",true],["Closed folders",true],["apps_dir",true]]
```

`getState` list, instances and refusals (`node $S/cdp/state2.mjs`, `$S/r1/state2-run.txt`):

```
approve {"status":200,"text":"{\"ok\":true}"}
{ "list": "accepted, reads back [1,{\"a\":2}]", "instance": "accepted, reads back {\"x\":1}", "date": "rejected: not_json", "map": "rejected: not_json", "set": "rejected: not_json", "undefinedValue": "rejected: not_json", "undefinedInside": "rejected: not_json", "nan": "rejected: not_json", "infinity": "rejected: not_json", "cycle": "rejected: not_json", "fn": "rejected: PenpalError (object): Failed to execute 'postMessage' on 'MessagePort': () => 1 could not be cloned. code=TRANSMISSION_FAILED" }
```

Question text and hidden tab (`$S/r1/hidden-run.txt`):

```
   [created after 616 ms]
   [findings selected after 18 ms]
## tabs with the app hidden
["Focus","Task demo","Findings (selected)","Live HPC (selected)","Usage"]
   [dialog after 13 ms]
## dialog
The app Task demo asks to delete an entry of a collection: {"kind":"delete-entry","collection":"tasks","id":"Task demo 1791283481677"}

Cancel
Confirm
## tabs while the question is asked
["Focus","Task demo (selected)","Findings","Live HPC (selected)","Usage"]
   [deleted after 624 ms]
## tasks.yml after confirm
title: Tasks
schema:
  - { field: title, type: text }
  - { field: status, type: select, options: [open, done] }
entries:
  - title: "Review the draft"
    status: open

  - title: "Another task"
    status: open
```

The Open the app's folder notice (`$S/r1/folder-run.txt`) and the unhandled and handled refusal in the page console (`$S/r1/state-run.txt`):

```
## page text around the notice
e-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/scratch/apps/paneltest, is inside no root the file browser shows.

12:59
## approve
{
 "status": 200,
 "text": "{\"ok\":true}"
}
## page of the app
[1,{"a":2}]
## console entries
[
 {
  "session": "445E75183899A05D92C5E4CA49E7FAEF",
  "type": "exception",
  "text": "\"Uncaught (in promise)\" value=\"not_declared\""
 },
 {
  "session": "445E75183899A05D92C5E4CA49E7FAEF",
  "type": "log",
  "text": "refused: not_declared"
 }
]
```

The scratch oculus on 8797 is stopped: `lsof -nP -iTCP:8797 -sTCP:LISTEN` prints nothing, and `ps -axo pid,command | grep "[s]cratchpad/chrome"` prints nothing.
