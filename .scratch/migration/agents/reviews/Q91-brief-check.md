# Step Q91 brief check (on main at e1d7de25)

The report of the fresh agent of the `spec` skill's "Steps / The brief check", on `agents/briefs/Q91.md` (read from main's working copy, where the brief is uncommitted). A page this report cites (the rules file, a standard, a skill's text) is named by its section. A line of code or a grep hit keeps its `file:line`. Commands ran from `/Users/axelfaes/workspace/research-hub/tools/oculus` unless they say otherwise. I wrote one probe, `scratchpad/probe-followup.mts`. I changed no file in the repository.

Four findings carry most of the weight. The first two block the build as the brief is written, and both need the orchestrator to decide before dispatch:

- **B1 (boundaries).** `views/boards/project/Project.svelte` cannot import `views/sources/files/RootedTree.svelte`. The layer table forbids it (Names N5).
- **B2 (instance state).** The project tree's state "under `files`" cannot work while `Tree.svelte` and its helpers write the Files view's record at the top level of the owner's instance state. `Project.svelte:106` also replaces that record whole whenever a document is chosen (Premises P8).
- **B3 (behaviour lost).** In the project view, the tree drops things the card's flat list does that VS Code's Explorer does not: opening a file in its program, a fuzzy finder over every file of the project, sizes, and most-recent-first order. The rules file's last principle requires the brief to list such things before the build, and the brief does not (Cases K1).
- **B4 (follow-up writes).** Once the follow-up fields are writable, emptying the one note's text does nothing at all on a bare note and leaves an orphan `after` on a map note. A list of one note is refused by the server, although the brief opens it as writable (Implied inputs I1 to I3).

## 1. Names

- **`NOT_IN_MODEL` and the head comment's "Eleven".** `grep -rn "NOT_IN_MODEL\|not_in_model\|Eleven of the schema\|not in the model" src tests config HELP.md DESIGN.md README.md --exclude=local.yml` (with `schema.ts` and `Editor.svelte` filtered out) printed:
  - `tests/state/forms/schema.test.ts:260` `expect(missing.sort()).toEqual([...NOT_IN_MODEL].sort());`. It stays true when `fieldValues` gains the five keys, even with the value `undefined` for the several-notes case.
  - `tests/views/boards/editor.test.ts:189`. Stays true, since five fields keep the note.
  - `config/text/views/boards/editor.yml:11`. Inside the paths, and still true.
- **The card's `.statusline` class** (item 3 drops it). `grep -rn "statusline" src tests` printed `tests/views/whole/type-scale.test.ts:227 'shared/card/CardDetails.svelte': '.field .value=fs-md | .label=fs-xs | .statusline=fs-sm'`. The change makes it false. It is under `tests/`, so inside the paths, but the brief never names it, and the rules file requires every edit to an existing assertion to be listed with its before and after. The status line also changes size, from `fs-sm` to the field value's `fs-md`, which the brief does not list as a visible change.
- **`documents` and the new `files` prop.** `grep -rn "<ProjectCard\|<CardDetails\|<CardDocs" src` printed only `CardDetails.svelte:103`, `ProjectCard.svelte:371` and `Project.svelte:159`, all inside the paths.
- **Files.svelte's wiring moved into another component.** `grep -rn "partial of views/sources/files/Files.svelte\|partial of Files.svelte\|The id of the Files view" src/lib/views/sources/files`:
  - These become false and are outside the paths: `tree/Tree.svelte:2` (partial of Files.svelte), `tree/Tree.svelte:83` (`/** The id of the Files view this tree is drawn for ... */`), `tree/control/view-access.ts:1-3` ("What one Files tab remembers"), and `header/Outside.svelte:2` if the project view reuses Outside for item 4's outside line.
  - `control/tab-actions.ts:1` becomes false if it moves into RootedTree.
- **N5, the import of RootedTree from the project view.**
  - `tests/checks/tree/boundaries.test.ts:129` allows a view to import only `'ui/**', 'state/**', 'views/shared/**', 'data/shapes/shapes'`.
  - `ownPartials` (`:175-180`) adds only the view's own folder, `views/boards/project/**`.
  - The comment at `:27-29` says a file under `views/shared/` "may reach no other view's partials".
  - So `Project.svelte` importing `views/sources/files/RootedTree.svelte` is a boundary violation, and the rules file says `boundaries.test.ts` must pass. Placing RootedTree under `views/shared/` does not fix it: it draws `tree/Tree.svelte`, which imports `../Questions.svelte`, `tree/control/*` and `tree/menu/*`, and it opens through `opening.ts`. The whole tree folder would have to move under `views/shared/`.
  - Size of that move: `git ls-files src/lib/views/sources/files/tree | wc -l` printed 17. `grep -rln "views/sources/files/" tests src | wc -l` printed 53 importers. `views/shared` holds 9 items (`git ls-files src/lib/views/shared | ... | sort -u | wc -l`), so one new folder fits.
  - Not run as a check. Read from the test's code.
- **HELP.md and DESIGN.md.** The brief's grep `grep -n "project view\|Project view\|status line\|follow-up" HELP.md DESIGN.md` prints only `HELP.md:101`, `DESIGN.md:159` and `DESIGN.md:421`. It misses:
  - `HELP.md:152`: the `project` entry ("whose card leaves out the document row ..."), the `editor` entry ("a project's manifest form"), and "Open in its program ... on a project card's file list". The last becomes partly false once the project view's card has no list.
  - `DESIGN.md:366`, "A project opens as its own tab ...".
  - `DESIGN.md:421`, "The project tab draws its documents once ... the card's list left out through `ProjectCard`'s `documents`".
  - All three are inside the paths; the grep in item 5 does not reach them.
- **`ops.svelte.ts:273-286` `followTabs`.** It restates only `FILES_VIEW` tabs after a rename or move (`:275`). A project tab's tree state would not follow a renamed folder. Outside the paths, and not covered by the brief.

Findings:

- **N1.** `type-scale.test.ts:227` must change and the brief does not name it.
- **N2.** `Tree.svelte:2` and `:83` and `view-access.ts:1-3` become false and are outside the paths; so is `Outside.svelte:2` if it is reused.
- **N3.** Item 5's grep misses `HELP.md:152` and `DESIGN.md:366`.
- **N4.** `followTabs` does not restate the project tree's state.
- **N5.** The import of RootedTree from the project view breaks the layer boundaries; the fix moves the explorer tree into `views/shared/`, a widening of scope.

## 2. The step line

- "a manifest's `followup` ... shows on the Focus board but neither in the project view nor in its editor": served by item 1 (the editor) and item 2 (the card, so the project view and the board card).
- "whose schema declares `followup.do` and `followup.after`": item 1.
- "the status line is drawn awkwardly": item 3.
- "the project's file list becomes the Files view's list (X3a) rather than its own": item 4, for the project view only (see the judgment on decision 1 below).
- "The cause of the missing follow-up is found read-only before the brief": "What is on the tree", its first two bullets.
- "the project view and its manifest editor reworked" (the short line): items 1 to 5.

Findings: none for a part with no item. See the judgment below for how far item 4 reaches.

**Judgment on decision 1 against "the project's file list becomes the Files view's list (X3a) rather than its own".** The line is better read as covering the board card's list too.

- "The project's file list" names one thing: the card's Files section, `CardDocs.svelte:90-145`. The board's open card and the project view's card draw the same component.
- The brief already reasons this way for items 2 and 3 ("The board's open card and the project view's card both draw it, since they are one card"). Item 4 is the only item that splits them.
- "Rather than its own" names what makes the list its own: its own rows and its own open rules. Those are the READABLE regex at `CardDocs.svelte:47` and `opensInProgram` at `:120`, against `opening.ts`, which decides from the file's first bytes. Decision 1 keeps all of that on the board, so two open rules for one file stay in the product.
- Decision 1's reason, that a tree has "no height to live in" inside a card, is weaker than it reads. `VirtualRows.svelte:10-12` says the box that scrolls is the pane body (`data-scroll`) with the list's offset as the scroll margin, so the tree does not need a box of its own height.
- What the evidence does not settle is the reading cost of several open cards each drawing a tree. A look on TEST at a board with three open cards drawing it would settle that.

The options, for the orchestrator:

- **(a)** The board's open card draws the same tree, its state kept per card in the board instance. This is the reading the line supports.
- **(b)** The board card drops its list and keeps Show in Files, which opens the Files view at the project folder. The list then literally becomes the Files view's.
- **(c)** Decision 1 as written. This is the narrower reading, and the lazy option if the line covers both cards.

Either (a) or (b) must still carry the program open and the finder (Cases K1). Z283 ruled decision 1 in automode, so a change is the orchestrator's to make, or Axel's if the orchestrator sees it as his.

## 3. Premises

- **P1, the `NOT_IN_MODEL` lines.** `cat -n src/lib/state/forms/schema.ts`: the list runs `:51-63` (the brief says `:50-62`). The head comment is at `:10-12` (matches), and `fieldValues` runs `:190-229` (the brief says `:190-227`). The eleven names match. Small line drift only.
- **P2, the model fields.** `grep -n "priority?\|waitingOn\|followups:\|snooze?\|subtasks: Subtask\|^export type Followup" model-entities.ts` printed 457, 469, 471, 473, 477 and 225, which match. `grep -n "description\|homepage\|topics\|visibility\|paths" model-entities.ts` printed `:31`, `:183-184` and `:562`, none in `Project`. `CodeAvailability` at `:186-192` holds only status, date, url, doi and repo. Matches.
- **P3, `Editor.svelte:146-148` `noteFor`.** Matches.
- **P4, the follow-up on the card.** `grep -n "followup\|Followup" src/lib/views/shared/card/*` printed nothing, which matches. `views/boards/focus/rows.ts:104` and `:224` are the follow-up row's action and its write, not where it is drawn; the drawing is in `CommandCenter.svelte`, `CommandCenterView.svelte` and `Tasks.svelte` (`grep -rln followups src/lib/views`). The due rule is `state/boards/ticker.ts:175` `dueFollowups`, which the brief does not name.
  - `CardDetails.svelte` draws, in order: status line, latest, results, outcome, next, ideas, reproduced, disseminated, then the documents and files. The brief lists only six of these.
  - Line counts: `wc -l` printed Project 288, ProjectCard 478, CardDetails 162, CardDocs 216 and Files 494, which match.
- **P5, the follow-up shapes.** `git grep -n -A3 "^followup" -- '*project.yml'`: `abduction/project.yml:6` and `glassbox-decision-pipelines/project.yml:29` are flow maps with `after: "2026-09-18"`, and `hccnet-fl/project.yml:18` is the bare `"Register for FLTA 2026"`. Matches. No manifest holds a list.
- **P6, the manifest write against a list of notes.**
  - The brief cites `manifest.ts:254-262` for "takes `followup.do` and `followup.after` through dotted parents". Those lines are the group-clear rule: the parent name `followup` may be cleared whole. The children are taken because the schema names them (`named.has(field)`), and `yaml-edit.ts` `applyOne` applies the two-segment path.
  - The probe settles what the write does with a list. `node scratchpad/probe-followup.mts` calls `setFields` from `yaml-edit.ts` and printed:
    - a list of two, setting `followup.do`: `{"changed":[],"refused":[{"field":"followup.do","reason":"followup is not a map"}]}`
    - a list of one, setting `followup.after`: `{"changed":[],"refused":[{"field":"followup.after","reason":"followup is not a map"}]}`
    - the bare note, setting `followup.after`: `{"changed":["followup.after"],"refused":[]}`, written as `followup:\n  do: "Register for FLTA 2026"\n  after: 2026-11-01`
    - the bare note, clearing `followup.do`: `{"changed":[],"refused":[]}`, file unchanged
    - the map note, clearing `followup.do`: `{"changed":["followup.do"],"refused":[]}`, giving `followup: { after: "2026-09-18" }`
  - So the write refuses a list and says why (`yaml-edit.ts:606-607`); it does not mishandle it. It mishandles a clear (I2 and I3 below).
  - `SHORTHAND` at `yaml-edit.ts:86-92` matches.
- **P7, the status line and CodeText.** `CardDetails.svelte:52-54` is a bare `<p class="statusline">`, and the `field` snippet is at `:33-38`; both match. `git grep -n 'line: "`article`, 33 pp'` printed `projects/active/linfoot-estimator/project.yml:6`, which matches. glassbox `:26` and hccnet-fl `:13` also carry backticked words.
  - `ui/display/CodeText.svelte` is used by `Empty.svelte`, `Config.svelte`, `Audit.svelte` and the settings `Item.svelte` (`grep -rln CodeText src`). The brief omits Config; harmless.
- **P8, the file list and the Files view's tree.**
  - The Files section is `CardDocs.svelte:90-145`, not `:67-120` (`:69-88` is the documents row).
  - `Files.svelte:51-56` and `:170-194` match, and `tab-roots.ts:129` `rootedView` matches.
  - "for a folder read through the root that holds it, `followView` (`tree/Follow.svelte`)" is misattributed. The reading is `tab-roots.ts:58` `followView`, gated on `followsSession(state)`, that is `state.follow === true` (`:59`). It builds on `rootHolding` (`:22`, exported) and `folderName` (`:47`, private). `Follow.svelte` holds only the effect that opens the head once (`:27-34`, writing `followRevealed` into `instanceState(owner)` at the top level) and the two lines.
  - So `followView` can serve a fixed project folder only when given a fake `{ follow: true }` state. The clean route is a small function exported from `tab-roots.ts` (the root holding the folder, and the folder as `top`) that `followView` then calls. The brief's conditional path note names `Follow.svelte` where it should name that function.
  - **The "under `files`" premise, finding B2.** It does not hold against the tree:
    - `tree/Tree.svelte:137` `viewAccess(client, () => owner)` and `:140` `filesViewOf(client.ui.instanceState(owner))` read the owner's whole record as the Files view.
    - `tree/control/view-access.ts:22-28` writes `patchedFilesView(instanceState(owner), part)`, a top-level merge (`files-view.ts:219-221`).
    - `control/tab-actions.ts:43-45` and `Follow.svelte:33` do the same.
    - `Project.svelte:106` `setInstanceState(instance.id, { id, doc: name })` replaces the record whole (`ui.svelte.ts:606-608` `setInstanceState` stores the value as given). Choosing a document would therefore wipe any `files` key, and the tree's own presses would write the Files view's keys beside `id` and `doc` instead of under `files`.
    - Keeping the state "under `files`" needs either an owner accessor that `Tree.svelte`, `view-access.ts` and the others take (outside the paths), or a separate owner id such as `<tab id>#files`. The latter has precedent: DESIGN.md:418 names `<id>#forms`. That one must then be cleared when the tab closes.
- **P9, the folder sizes.** `git ls-files <dir> | ... | sort -u | wc -l` gives:

  | Folder | Items | Brief |
  |---|---|---|
  | `views/sources/files` | 7 | matches |
  | `views/boards/project` | 2 | matches |
  | `views/shared/card` | 10 | matches |
  | `state/forms` | 5 | matches |
  | `tests/views/boards` | 10 | not stated |
  | `tests/views/sources/files` | 10 | not stated |
  | `views/sources/files/tree` | 9 | not stated |

  The brief does not state the three at the limit or near it. A new test file for RootedTree, or for the project view's tree, cannot be added to either test folder at 10.
- **P10, ADRs.** `ls docs/adr` and `ls tools/oculus/docs/adr` both printed "No such file or directory". `grep -n 'adr' .agents/plan.yaml` exit 1. Matches. The brief's own command `grep -n '^adr'` could never match an indented key under `projects.oculus`, so it is a weak check, but the conclusion stands. `.agents/plan.yaml:15` `libraries: check` matches.

Findings:

- **P4.** The follow-up draw sites and the due rule (`ticker.ts:175` `dueFollowups`) are misnamed.
- **P6.** The cited lines describe the group clear. The list refusal (`yaml-edit.ts:606-607`), the fact decision 2 rests on, is not cited.
- **P8 (misattribution).** The folder reading is `followView` in `tab-roots.ts`, not `Follow.svelte`.
- **P8 (B2).** The "under `files`" state contradicts how `Tree.svelte`, `view-access.ts`, `tab-actions.ts`, `Follow.svelte` and `Project.svelte:106` read and write instance state.
- **P9.** The two test folders at 10 are not stated.
- **Line drift.** `:50-62` vs `:51-63`, `:190-227` vs `:190-229`, `:67-120` vs `:90-145`.

## 4. Cases and checks

- **C1 to C3, C5 and C6.** Consistent with the rules file. C3's write must run on a synthetic fixture: the rules file's "Where you work" bans writing a `project.yml`, and the case names the real hccnet-fl note. The brief should say "the hccnet-fl shape, in a temporary fixture".
- **C4.** "The payload holds neither field after an edit attempt". `payload()` and the read-only rule live in `Editor.svelte:107-114`, and an edit needs a DOM. The unit suite renders to a string (the rules file, on a behaviour that needs a DOM), so this is runnable only if the rule moves into a state function in `schema.ts` and is tested there, or is tested through a kept draft (as `editor.test.ts:197-215` does) with the bar's count. The brief names neither.
- **C11.** "a file row opens as the Files view opens it" needs a press, so in the unit suite it is an audit and is seen at the look.
- **C12.** As written it requires the state under `files`, which needs the changes in P8 to files outside the paths.
- **C16.** Consistent.
- **K1, finding B3.** Moving the project view's list to the tree removes things the card's list does that VS Code's Explorer does not:
  - Open in its program for a `.docx` (`CardDocs.svelte:120-126`, documented at `HELP.md:152`; `grep -rn "opensInProgram\|ProgramButton" src/lib` finds no use in the Files tree).
  - A fuzzy finder over every file of the project, recursive and capped (`state/sources/files.svelte.ts:32-37`, `matchingFiles`). The Files view's `filterRows` matches only folders already read.
  - Each file's size.
  - Most-recent-first order (`project.card.files_capped`, "showing the {0} most recent").

  The rules file's last principle says the brief lists each such thing before the build, and a build that removes one is not landed. The brief lists none.
- **K2, key cases.** The rules file ("What every package obeys") and the state file's standing demand (Z253) require every key or id a step adds to be exercised empty, duplicated and colliding. The new instance-state key `files`, its collision with the project tab's `id` and `doc`, and the new `files` prop have no such case.
- **K3, asynchronous paths.** The rules file requires the in-flight, after-close and superseded cases. The project tree's listings and the outside line's add-folder request are new asynchronous paths in the project view, and the brief gives none of these cases.

Findings:

- **C3.** The fixture is not stated.
- **C4.** Not runnable as a state test as written.
- **C11.** The open-row part is an audit.
- **C12.** Depends on files outside the paths.
- **K1 (B3).** What the card's list does better is not listed.
- **K2.** No empty, duplicated or colliding cases for the new key.
- **K3.** No asynchronous cases.

## 5. The question

Whether each case and check could pass without the goal being reached:

- **C1: yes.** "fieldValues gives ... the subtask" passes when `subtasks` maps to `project.subtasks` as objects. The read-only box then shows nothing: `asText` maps each item through `scalar`, which returns `''` for an object (`schema.ts:246-255`, `guards.ts:36-40`), and `TextInput` is a single-line `<input>` (`TextInput.svelte:64`), so line breaks are lost anyway. The brief does not state the text the box shows.
- **C2: no.**
- **C3: no.** A preserved behaviour.
- **C4: yes.** Read-only inputs never produce an edit, so the payload is empty without any rule. A draft kept from before a second note appeared (a reload keeps edits, `manifest-draft.ts`) would still be posted and counted. That is the path the rule exists for, and the case does not cover it.
- **C5 and C6: no.**
- **C7: no** for the drawing. It could pass with the "not until" rule written beside `ticker.ts:175` `dueFollowups` instead of reusing it, which is a standards issue rather than the goal.
- **C8, C9 and C10: no.** C10 covers latest, next, outcome and results. `ideas` and `reproduced.note`, also manifest prose, are left out of item 3's rule.
- **C11: yes,** for the open part (an audit).
- **C12: yes.** A test that seeds `files.expanded` and reads the rows passes while every press in the browser writes the Files view's keys at the top level (`view-access.ts:22-28`), so the goal "the same tree after a reload" fails in use.
- **C13 and C14: no.**
- **C15: no.**
- **C16: yes.** An audit: wiring copied in a reshaped form can pass the duplication check. "No copy left" is judged by reading the diff.
- **Verify 1 (`checks.sh`): yes.** It is the generic list. As it stands it would be red on `boundaries.test.ts` (N5) unless the tree moves.
- **Verify 2 (the grep): yes,** taken alone: removing the five names without mapping them passes. Together with `schema.test.ts:260` it does not.
- **Item 1's check: yes.** Covered by C1 to C6, with the C1 and C4 gaps above.
- **Item 2's check: no.** Covered by C7 and C8.
- **Item 3's check: partly.** `ideas` is not covered.
- **Item 4's check: yes.** Through C12 and N5.
- **Item 5's check: yes.** Its grep misses `HELP.md:152` and `DESIGN.md:366`.

Findings: C1, C4, C11, C12, C16, item 3 (`ideas`), item 5 (the grep), and verify 1 against N5.

## 6. Implied inputs

Each input below is implied by the step and not listed under "Cases".

**The editor fields:**

- **I1.** A list holding exactly one note (`followup: ["a"]` or `[{do: a}]`). The model gives one note (`normalise.ts:234`), so item 1 opens both fields writable, and the save is refused with "followup is not a map" (probe). The brief must state the expected result: read-only as for several notes (the model cannot tell a list of one from a map), or the refusal shown as the result line.
- **I2.** Emptying the bare note's text (hccnet-fl). The form posts `followup.do: ''`, which `coerce` (`manifest.ts:136-137`) turns into null, and `setFields` changes nothing and refuses nothing (probe). The editor then says "saved" with nothing saved and the note still in place. Expected result: unstated.
- **I3.** Emptying the map note's text (glassbox). The file is left as `followup: { after: "2026-09-18" }` (probe), and `normalise.ts:238` drops a note with no `do` in silence, leaving an orphan `after`. Expected result: unstated. One candidate is that emptying `do` clears the group `followup`, as `manifest.ts:254-262` allows.
- **I4.** A draft edit of `followup.do` kept from before the manifest gained a second note. Expected: not posted and not counted as dirty.
- **I5.** `subtasks` with three lines, one of them done. Expected: the text the read-only box shows, given a single-line `<input>`.
- **I6.** `waiting-on: stephanie` written as a bare word. `strings()` gives `[]` (`guards.ts:67-70`), so the field opens empty, which `validate.ts:140` reports. Expected: unstated.
- **I7.** `priority:` holding a word that is not in `priority_levels` (`vocab.yml:170-173`). Expected: what the Select shows.

**The card fields:**

- **I8.** A note whose `after` is not a date ("next week"). `daysUntil` gives null, and `dueFollowups` treats the note as due. Expected: the card draws no "not until".
- **I9.** `now` for the card's "not until". `CardDetails` takes no `now`, while `ProjectCard` and `Project.svelte:86` have one. Expected: passed down, and the due rule shared with `ticker.ts:175`.
- **I10.** `ideas` items and `reproduced.note` holding backticks. Expected: drawn through CodeText, by item 3's own rule.
- **I11.** The project view's card with `files={false}`. Expected: no `api/project-files` request. `CardDocs.svelte:51` calls `files(item.id)` unconditionally today.

**The moved tree component:**

- **I12.** The project tab's head row on first open. Expected: open, listing the project's top level (as `Follow.svelte:27-34` does for a session).
- **I13.** Where the filter box and the fuzzy toggle are drawn in the project view. `Files.svelte` draws them in its Pane's bar (`:325-332`); `Project.svelte`'s Pane has none.
- **I14.** The hidden, ignored and nesting toggles. The project tree has no workspace header to flip them. Expected: their defaults, stated.
- **I15.** Enter on a file row. Under Z181 the Files view's tree renames on Enter, so the project tree does too. This is a visible change for the project view and is not stated.
- **I16.** The row menu's bookmark item and its required `onbookmark` prop (`Tree.svelte`), the git decorations (`fold`) and the stars (`marked`) in the project tree. Expected: unstated.
- **I17.** A rename or move made in the project tree. Expected: the open folders and the selection follow, as `ops.svelte.ts:275` does for Files tabs only.
- **I18.** Choosing a document in the project view after opening folders. Expected: the tree's state kept (`Project.svelte:106` drops it today).
- **I19.** A saved `files` value of the wrong shape, and the key colliding with `id` or `doc`. Expected: an empty tree, and nothing else lost.
- **I20.** A named workspace without the hub root, which puts every project outside every root. Expected: the outside line. Also, whether the dismiss control of `header/Outside.svelte` is drawn in the project view.
- **I21.** A project folder that is itself a root. Expected: the head named by the folder, with path `''`.
- **I22.** The project tab closed while a listing or the add-folder request is in flight, and a second request superseding a first.

Findings: I1 to I22 are all missing from "Cases". I1, I2, I3 and I18 are defects the step would expose or cause.

## 7. ADRs

- `ls docs/adr`: No such file or directory. `.agents/plan.yaml` names no `adr` key (`grep -n adr .agents/plan.yaml`, exit 1). No record.

Findings: none.

## Declined to judge

- Whether decision 1's board card list stays. That is the orchestrator's or Axel's ruling (Z283, automode). My reading is under section 2.
- How the B1 tree move is done (folder name, the order of moves). A design choice for the orchestrator.
- The exact text the subtasks box shows (I5). A user-visible choice.

Agent usage: claude-opus-5-5 (as configured; the served model is read by the session from the runner's record), about 230,000 tokens (my estimate from the context counter, not measured), 60 tool uses, time not measured.

## Closed

Left to the orchestrator: every finding above.

- **Need a ruling or a scope decision (a stop under "Steps / The brief check" item 4):**
  - **N5 (B1).** RootedTree and the tree it draws must move under `views/shared/`, which widens the paths by about 17 files and 53 importers.
  - **P8 (B2).** Where the project tree's state lives.
  - **K1 (B3).** The four things the card's list does better than the tree.
  - The reading of decision 1 against the plan line.
- **Closable by a change to the brief:** N1, N2, N3, N4, P4, P6, the P8 misattribution, P9, the line drift, C3, C4, C11, C12, C16, K2, K3, item 3's `ideas` and `reproduced.note`, item 5's grep, I1 to I22.

Relevant paths:

- `/Users/axelfaes/workspace/research-hub/tools/oculus/.scratch/migration/agents/briefs/Q91.md`
- `/Users/axelfaes/workspace/research-hub/tools/oculus/tests/checks/tree/boundaries.test.ts`
- `/Users/axelfaes/workspace/research-hub/tools/oculus/src/lib/views/sources/files/tree/control/view-access.ts`
- `/Users/axelfaes/workspace/research-hub/tools/oculus/src/lib/views/boards/project/Project.svelte`
- `/Users/axelfaes/workspace/research-hub/tools/oculus/src/lib/server/edit/yaml-edit.ts`
- `/Users/axelfaes/workspace/research-hub/tools/oculus/tests/views/whole/type-scale.test.ts`
- `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/probe-followup.mts`

Usage (completion notice): claude-opus-5-5, 240,437 tokens, 84 tool uses, 11.5 min.

## Closed

Each finding is closed in `agents/briefs/Q91.md` by ruling Z286 (the orchestrator, automode), which revises Z283.

- B1 (the layer rule): item 4 moves `views/sources/files/tree/`, `Questions.svelte` and `opening.ts` under `views/shared/explorer/` with a new `RootedTree.svelte` drawn by the Files view and the cards; C24 requires `boundaries.test.ts` to pass with no allow row; decision 2.
- B2 (the instance state): item 4 gives each card's tree the record `<tab instance id>#files:<project id>`, cleared by a prefix clear in the forget at `context.ts:207-214`, and restated by `followTabs`; C15-C17, C20; decision 3.
- B3 (what the card's list does that the tree does not): item 4 keeps the finder box with today's flat matches while text is typed, adds Open in Program to the tree's row menu, and asks `files()` only while the finder holds text; C21, C22; decision 1.
- B4 and I1-I3 (the follow-up writes): item 1 writes a one-note list as the note, clears the whole `followup` group when `do` is emptied, and leaves out of the payload a kept draft of a field `followupWritable` refuses; C4, C7, C8.
- N1-N5 and the premise findings: the premises section corrected (line numbers, draw sites, the probe results, the CardDocs section, `followView`, the record writes, the layer rule, the folder sizes).
- C3: a temporary fixture manifest. C4: stated over `followupWritable` and the payload function. C11, C12, C16: cases rewritten. K2, K3: C9 and C23.
- `ideas` and `reproduced.note`: item 3 draws them through `CodeText`; C13.
- Item 5's grep: widened to catch `HELP.md:152` and `DESIGN.md:366`.
- `type-scale.test.ts:227`: item 3 drops `.statusline=fs-sm`; listed in the paths.
- The due rule: item 2 exports and reuses the rule of `dueFollowups` with the card's `now`.
- I4-I22: covered by C9-C25, or by the item text where no test reaches them (the look).
