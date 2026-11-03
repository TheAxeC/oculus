Everything in the brief and in repair round 1 is done, with the rulings of `O123-cases.md` applied. Every page case is read and not seen: a builder runs no page, so each is proved by the look at landing named in its row below.

## Open items of the state file

`.scratch/migration/orchestrator-state.md` as it stands at landing holds open item 637: over a wallpaper a group's sticky strip is painted at `wallpaper.panel_opacity`, so what scrolls under it shows through. The worktree's copy of the file is at the base and held no entry.

```
## Open items (only what Axel must rule on; every report tells him these in plain words, decisions first, until he has ruled)

An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own.
```

## The cases' first run, and each case now

The first run read the unchanged tree. The second column is its result, with the ruling each wrong case took. The third is how the built tree answers it, by reading, and the look at landing that proves it.

| Case | First run on the unchanged tree | Built tree, and the look at landing |
| --- | --- | --- |
| Explorer, new page | Holds after items 5 and 6; `layout.yml`, `catalogue.ts` chords come from rail entries, so `m` goes with the entry. | `layout.yml` explorer shape. Look: a new Explorer. Left tabs Files, Repositories, Sessions, Search, LaTeX; top right empty; bottom right Terminal, Problems, References, Debug Console. No Sessions button; `m` opens no group. |
| A list of 200 sessions | Holds; zag's `focusNode` calls plain `.focus()`, so the browser scrolls a row into the fold. | `.fold` in `SessionList.svelte`, max-height of ten rows. Look: 200 sessions. The fold scrolls at ten rows and the sections stand under it. |
| Row height, Tab once | Wrong: `FoldControl` was a Tab stop per group. Ruling 1, option A. | `GroupHead` `row`, `FoldControl` `reach`, `listRows`, and `tabindex="-1"` on `.fold` so a scroller past ten rows is no Tab stop. Look: 200 sessions; rows are one tree row tall; Tab from the Search box reaches the list once and the second Tab leaves it; arrows walk heads and rows; Left and Right fold a group. |
| A press: terminal this page owns; another page owns; no terminal; workbench | Holds after item 7 and ruling 4. | `open-session.ts`, `reading-tab.test.ts`. Look: the sections follow and the bottom Terminal tab shows the terminal; another page's terminal switches to that page; a session with no terminal is read in the Terminal tab and a second press retargets it; a workbench opens no Session tab. |
| Terminal row, resume, fork; by-hand terminal | Holds if the tab resolves the selection through `sessionOfTerminal`. | `pickedSession` in `SessionList.svelte`. Look: each of the three moves the sections to its session; a by-hand terminal leaves them. |
| A reload | Holds; `shown` has no identity field. | `keepShown` in `SessionList.svelte`. Look: pick a session, reload, the tab shows it with nothing selected. |
| Closing a section, reordering | Holds, state in each owner's layout state. | `SessionSections.svelte` takes `owner`. Look: close a section and reorder by drag and by Alt+Up, in the tab and in a Session tab, reload, pick another session; each keeps its own. Alt+Up on a list row does nothing. |
| A file opened from Files or Changes | Wrong after a reload with a Session tab alone on top. Ruling 5, option A. | `opened: true`, `registerOpened`. Look: open a file with a Session tab alone on top, before and after a reload; it lands in the top pane. |
| Details transcript control and an Agents row (ruling 2) | Timeline rows have no press; ruling 2 replaced the row. | `terminal-host.ts` `open`. Look: both land in the bottom pane, never over the list. |
| Row menu's Pinned, a notice's press | Holds. The terminal row's menu item opened over the list. | `opened: true`; `moveToNewTab`. Look: a session row's Open in its own pane and a notice's press open a Session tab in the top pane; a terminal row's item opens a Terminal tab in the bottom pane. |
| A workbench | Holds after item 7; `startInTab` needs the page folder too. | `startOf`, `folderOf`, `pageFolder`. Look: same shape with Deposit after Repositories; New, `n` and the tab's menu start in the folder; Reset layout gives the shape back; the list shows "In root/folder". |
| Pinned tab ends or is moved out; unpinned closes | Holds; needs `pinned` from `terminal-host.ts`. Typed prompt: ruling 4, option A. | `closeEnded`, `moveInto`, `reading-tab.test.ts` rows 'ended' and 'moved out'. Look: both stand and show the composer, the next press lands there and a typed prompt comes back at New, also with a second Terminal tab on the page and from a list limited to a folder; a task start or a worktree start then opens another tab and leaves the reading tab reading; an unpinned tab closes. |
| Two sessions need input, 37 changes | Holds. The hub sets no `counts:` (cases file). | `tone: 'amber'`, `rail: false`. Look: Explorer badge 2 in amber, tooltip names sessions; Repositories tab reads 37. None waiting: no badge. |
| Status bar's Sessions and Problems | Holds. | `StatusBar.svelte:245,359` unchanged. Look: on the Explorer each shows its tab. |
| A debug start | Holds. | Look: Debug Console shows in the bottom pane. |
| Find All References | Holds. | Look: results show in the bottom pane. |
| A narrow Sessions tab | Holds with the age in `end`. | `TreeItem` `end`. Look: titles cut with an ellipsis and the age stays. |
| A rename in a row | The `TextInput` is 26 px in a 22 px row. | `NameField` in `TreeItem` `field`, `typed`, the document-level Escape in `SessionWorkspace.svelte`. Look: double-press a row and type a word: the letters go into the field, which fits the line; a title arriving on the channel leaves them; Enter and Esc in the field close it with the focus back on the row; with the focus elsewhere Esc closes it and the focus stays there. |
| A wallpaper theme | Holds. | Look: the list and sections draw as Files does; a group strip paints over what scrolls under it (without a wallpaper; over one it shows at `wallpaper.panel_opacity`, open item 637). |
| No session and no terminal | Holds. | Look: the empty words inside the fold, and Customizations. |
| A saved page | The orchestrator's data edit; no code reads the old form. | Look after the edit: the same shape, running terminals shown. |

## DONE / NOT DONE

| Check | State | Output as printed |
| --- | --- | --- |
| 1. `npm run diagrams`, then `npm run test:quick -- --base 3e2595261`, after the last change | DONE | `test:quick: 72 changed file(s), from git since 3e2595261`; `test:quick: 47 test file(s)`; `ok      prettier (1.3 s): All matched files use Prettier code style!`; `ok      ASCII gate (1.5 s)`; `ok      svelte-kit sync (3.0 s)`; `ok      svelte-check (13.5 s): 1793662734662 COMPLETED 582 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`; `ok      eslint (13.6 s)`; `ok      vitest slow (47.1 s): Duration  29.78s (transform 14.17s, setup 0ms, import 18.49s, tests 11.05s, environment 0ms)`; `ok      vitest (55.7 s): Duration  38.72s (transform 62.13s, setup 0ms, import 126.02s, tests 6.94s, environment 1.66s)`; `ok      vitest checks (67.1 s): Duration  49.96s (transform 30.49s, setup 0ms, import 63.34s, tests 116.83s, environment 3ms)`; `test:quick: 70.2 s; every command passed`; `test:quick: not covered: tests that reach no changed file within the import depth, other than the checks under tests/checks/source and tests/checks/tree, which run for any change under src, tests or utils; the build, the lint of unchanged files` |
| 2. `LC_ALL=C grep -n '[^ -~]'` over the 59 changed and new files, svg left out | DONE | prints nothing |
| 3. `grep -rnEi --exclude=local.yml 'sessions page|page: sessions|(^|[^a-z])m Sessions' src config/defaults docs/HELP.md README.md` | DONE | prints nothing, exit 1 |
| 4. `git diff --stat -- package.json package-lock.json` | DONE | prints nothing |
| 5. New lines read against the standards | DONE | One departure, the `row` type in `GroupHead`, under judgment calls. |
| `sh utils/unused-exports.sh` against the base list | DONE | 337 lines; `diff ../O123-base/unused-exports.txt` prints nothing, exit 0 |
| Banned words on added comment and test-title lines (`git diff -U0 3e2595261`, and a grep over the new files) | DONE | two hits of `before`, each a position or order: `session-list.ts:5` "its kind before its key", `session-marks.svelte.ts:2` "before the write lands" |
| Old names (`grep -rn "views/sessions/session-detail/[A-Za-z]"` with SessionDetail left out; `arrangements.sessions\|group: 'sessions'`) | DONE | 0 lines, 0 lines. `chord: m` in `layout.yml`: 0. `rail: 'sessions'` stays once, `tests/state/workbench/layout/saved/layout-saved.test.ts:107`, a fixture naming an arbitrary saved rail. |
| Item 9 sentences | DONE | `README.md:16,25`, the rail list's Sessions bullet, `HELP.md` rail, workbench, chords, views table, Sessions and Session, Terminals. |

### Tests changed

No test is added as a file; `reading-tab.test.ts` gains the row the brief asks for, and G147's Test line names the file and describe, so `guarded.md` needs no edit. Repair round 1 adds and changes no test. `composeIn` and `composeAt` have no test: `grep -rln "composeAt\|composeIn" tests` prints nothing, `spec.md` lets a test exist only as an entry of `agents/guarded.md`, no entry covers them, and a builder does not edit the ledger. The look at landing presses them.

| Test | Before | After | Failing line |
| --- | --- | --- | --- |
| `reading-tab.test.ts` title | 'opens one tab per session for presses in a list limited to a folder', count 2 | 'retargets one tab for two presses that open it in the documents pane', `expect(count()).toBe(1)`, transcript session `OTHER` | Unchanged tree: `AssertionError: expected 2 to be 1 // Object.is equality` |
| `reading-tab.test.ts`, `it.each` | absent | 'stands pinned when its last terminal %s, and takes the next press', rows 'ended', 'moved out' | Unchanged tree, both rows: `AssertionError: expected [ [ 't' ], [], true, 'live' ] to deeply equal [ [], [], true, 'live' ]` |
| `workspace-layer.test.ts` | `read.from['arrangements.sessions']` | `read.from['arrangements.explorer']` | The old line on the new config: `AssertionError: expected undefined to be 'layout.yml' // Object.is equality`. The new line passes on the unchanged tree too, since `explorer` is there: the edit only follows the page this step deletes. |

Those three reading-tab cases read `Tests  3 failed | 30 passed (33)` on the unchanged tree.

### Ids, keys and asynchronous paths

- `draft` in the composer record: empty leaves no key; a non-text value reads as absent (`filledTextShape`).
- `attached` in the composer record: empty leaves no key; a value that is no list of strings reads as absent; a path is added once (`attached.includes`).
- Fold key `list`: a workspace's key is an absolute path or the empty key, so neither it nor `terminals` meets one.
- List tree rows `list`, `group:<key>`, `session:<id>`, `terminal:<id>`: the prefix keeps a session, a terminal and a group apart, the empty key gives `group:`, and each list holds an id once. Session and terminal rows of a folded group are left out of the keyboard's rows.
- Customizations tree rows `head`, `kind:<kind>`, `finding:<kind>:<path>`, `item:<kind>:<at>`, `none:<kind>`: the kind and the place keep two kinds that read one file apart.
- `opened` and `pinned`: absent reads as false.
- `asNew` on a folder start: absent reads as false. `typed` in `SessionWorkspace.svelte`: set from the row's title each time the field opens, so an empty title gives an empty field and a second row's rename starts from its own title.
- The title field closing: `renamed` focuses the row after `tick`; a row gone by then gives no focus and no error, by reading of `api.focus`. The document-level Escape: its listener lives while a field of this group is open and is removed when the field closes or the row leaves the group; two fields cannot be open, since `renaming` is one id.
- A mark's write: `session-marks.svelte.ts` holds the logic it held in `SessionList.svelte`, counted per key, so a later write of the same mark keeps the mark drawn; a write answered after the tab closed changes only that closure.
- A start in flight: a landed start clears `draft` and `attached` in the record, as it cleared the component's prompt, so text typed during the start goes with it. A start refused keeps both.
- A section head dragged from the Sessions tab onto a Session tab's sections is no drop: both lists share the type `application/x-oculus-session-section`, and a drop is taken only with the list's own random mark (`list-drag.svelte.ts:35,42`). The sentence in the first form of this report calling this not verified is settled by that read.

## The terms

`docs/glossary.md` does not exist, so there are no terms to check.

## Files with line counts

`wc -l`. State: `client/context.ts` 880; `composer/composer.ts` 545; `composer/opening.svelte.ts` 231; `terminal/latex-target.ts` 92; `session/open-session.ts` 150; `session/workbench-shape.ts` 64; `terminal/terminal-lists.ts` 230; `terminal/terminal-tabs.ts` 435; `terminals.svelte.ts` 849; `open/float/folder-opener.ts` 177; `open/landing.ts` 97; `open/opening.ts` 557; `tabs/terminal-host.ts` 84; `navigation/registry.ts` 331; `selection.svelte.ts` 114.

UI: `FoldControl.svelte` 30; `GroupHead.svelte` 242; `RowButton.svelte` 63.

Views, `sessions/session-list/`: `Customizations.svelte` 312; `session-list.ts` 222; `session-marks.svelte.ts` 99 (new); `SessionList.svelte` 467; `SessionWorkspace.svelte` 260; `TerminalRows.svelte` 151.

Views, `shared/sessions/sections/` (ten items): `AgentRows` 173; `ChangesRepo` 166; `ChangesRepository` 216; `ChangesTouched` 99; `DetailsBody` 421; `session-sections.ts` 56; `SessionSection` 56; `SessionSections` 157 (new); `SharedMark` 25; `TimelineTurns` 208.

Views, other: `SessionDetail.svelte` 90; `SessionRow.svelte` 89; `Composer.svelte` 478; `Terminal.svelte` 489; `Latex.svelte` 240; `NotesGraph.svelte` 113; `Repositories.svelte` 517; `Problems.svelte` 449; `References.svelte` 494; `Search.svelte` 324; `Console.svelte` 303; `Debug.svelte` 213.

Tests: `workspace-layer.test.ts` 130; `reading-tab.test.ts` 322. Also changed: `config/defaults/layout.yml`, `config/text/views/sessions/session-list.yml`, `docs/HELP.md`, `README.md`, and eight diagram files.

## Judgment calls

- `GroupHead`'s `row.nav` is typed by the one call it uses, in place of `TreeNav`, because `tests/checks/imports/order.test.ts` refuses an import from `ui/tree` in `ui/controls`. The ruling's shape stands.
- `opened` is the name of the registration field of ruling 5.
- `targetTab` and `typedTab` in `opening.svelte.ts`: New goes to a page tab whose composer holds a `draft` (of several, the one `pageTab` picks among them, else the first), then to `host.pageTab`, then to a new tab. `pageTarget` itself keeps its rule.
- `asNew` on `ComposeAt`: the Sessions tab's New in a list limited to a folder starts through `composeAt` with the folder. It is New, so ruling 4 and item 4 of the round cover it, and without the key it would open a second tab with the draft hidden. Every other caller of `composeAt` leaves the key out and keeps the base's behaviour.
- `startedAt` keeps `draft` through `keptOf`, so a task start on a tab that holds a draft and reads no session shows the seed with that prompt in the box. It lands on such a tab only as the base did; the base's component kept its prompt there too while it was mounted.
- Escape in the title's field: with the focus in the row the field's own Escape closes it and brings the focus back to the row; with the focus elsewhere the document-level rule closes it and leaves the focus where it is. The base had the document-level rule alone, with no focus return.
- `attached` joins `draft` in the record. Ruling 4 names the prompt; a mention left in a draft would otherwise come back with its Codex image gone.
- A press passes `documents: true` every time; the path is reached only on a page with no Terminal tab. `composeIn(page, documents)` takes the same flag.
- `moveToNewTab` is a store call, so the view no longer opens a Terminal tab itself.
- Customizations has its own `TreeView`, as each session section has, so it is its own stop of the focus order; its `max-height: 50%` and own scroll are gone.
- The rename field is `NameField`; leaving it keeps it open, the behaviour of the field it replaces. It opens on the second press's mousedown (`onpressagain`, where the base used `ondblclick`), and that press's default is prevented so the field keeps the focus.
- The kind `Tag` on a terminal row is gone, since the kind glyph says it; `sessions.files_tip` and `sessions.prompts_tip` are deleted, unused.
- Session rows use `depth={1}`, so they stand one step in from the group head with the tree's guide.
- `SessionSections` lives under the tab's `.list`; the default `--tree-end-inset` applies, the Files value.

Paths written beyond the brief and the cases, each needed:

- `views/sessions/session-list/session-marks.svelte.ts` (new): `SessionList.svelte` would pass 520, so the drawn-ahead marks moved out by concern.
- `state/sessions/terminal/latex-target.ts`: `terminals.svelte.ts` would pass 880, so the two LaTeX calls and their types moved there; `TerminalsStore` takes them as `LatexCalls`, and the store re-exports `LatexStep` and `LatexBuildAsk`.
- `state/workbench/selection.svelte.ts` and `views/shared/sessions/SessionRow.svelte`: comments the change made false.
- `Terminal.svelte`: its head comment, beyond its registration, to name a pinned tab.
- `README.md`: the rail list's Sessions bullet is folded into Explorer, beyond lines 16 and 25.
- `tests/data/sources/config/workspace-layer.test.ts`: one assertion, listed above.
- `docs/diagrams/channels.dot/.svg` and `layer-state.dot/.svg`: `npm run diagrams` rewrote them beside the two the brief names.
- `state/sessions/terminal/terminal-tabs.ts`: the doc comment of `pageTarget`, which repair round 1 made incomplete; no code. The round adds `landing.ts` by its own text.

## Host- and user-visible changes

| What | Before | After |
| --- | --- | --- |
| Rail | A Sessions button, chord `m` | None. Explorer badge shows needs-input sessions, amber; Repositories and Problems count on their tabs only |
| Explorer page | Files, Repositories, Search, LaTeX beside an empty pane | Left adds Sessions after Repositories; right is a column, documents above, bottom pane with Terminal, Problems, References, Debug Console, `sizes: [0.6, 0.4]` |
| Workbench | Left: all tools; right: documents | Same shape as the Explorer, Deposit after Repositories. Problems moves to the bottom pane |
| Chords | `m1-m3`, `s1-s8` | `s1` Files to `s9` Debug; Debug Console, Notes Graph and Session have none |
| Catalogue | A Sessions group | `session-list`, `terminal`, `session-detail` under Explorer; a press on Session lands in the documents pane |
| Session row | Two lines, 40 px, Tag for input | One tree row; agent, model, files, prompts, input words in hover words; pin mark before the title |
| Terminal row | Two lines, kind Tag | One tree row; folder in hover words |
| List | Scrolled to fill the pane, sections in a Session tab | A fold of at most ten rows, the followed session's sections and Customizations under it |
| Press | Opened a transcript tab; on a workbench also a Session tab | Picks and shows it in the page's Terminal tab; never a Session tab |
| Terminal tab | Closed with no terminal | A pinned one stands with its composer; on a workbench starts in the folder |
| Composer | Prompt lost when the tab went to read | Prompt and attached files come back; saved in the tab's instance state as `draft` and `attached` |
| New | The page's Terminal tab that reads no session, else a new tab | A page tab holding a typed `draft` first, ahead of any other Terminal tab, and it stops reading its session; then as the base. The same for New in a list limited to a folder, and the `n` key |
| A start from a place or a task | The page's Terminal tab that reads no session, else a new tab; a reading tab stays reading | Unchanged from the base |
| Row rename | Double-click, field in a taller row, Escape read on the document | Second press or the menu; `NameField` in the row's height; what is typed held in `typed`; Escape closes it wherever the focus is |
| Section state | Session tab only | Sessions tab keeps its own `closed`, `sections`, `shown` |

## Anything in the brief wrong or impossible

The first run found five, each ruled in `O123-cases.md`: the Tab stops of `GroupHead`, the Timeline row's missing press, verify 3's false hit, the typed prompt, and the Session tab after a reload. No sentence the brief gives about a script's behaviour was found false.

The brief's path list misses the paths under judgment calls. `opening.ts:62` needed only its comment.

## Number of full-list runs

Three completed: the first printed three red checks, all in changed files (`tests/checks/imports/order.test.ts`, `tests/checks/source/comment-width.test.ts`, `tests/checks/tree/duplication.test.ts`), which were fixed and rerun alone (`Tests  33 passed (33)`); the second and third printed `every command passed`, the third after the last change. Two more runs were started and stopped before they finished, with no result read. No whole-suite command was run. `tests/checks/tree/boundaries.test.ts` timed out at 5000 ms once under a parallel `vitest run`; it passes in the list and with `--testTimeout=30000`.

Repair round 1 ran the list twice with `--base 3e2595261`. The first printed one red, in a file the round changes:

```
FAILED  vitest checks (78.7 s)
 FAIL  |unit| tests/checks/source/comment-width.test.ts > a comment line > ends by the hundredth column everywhere under src, tests and utils
+   "src/lib/state/sessions/terminal/composer/opening.svelte.ts:63",
      Tests  1 failed | 150 passed | 2 skipped (153)
test:quick: 82.1 s; failed: vitest checks
```

That comment was shortened and the second run, after the last change, is the one quoted in the table above. The round brief's "once" holds for a run with no red; `spec.md` allows one more after a red.

## Repair round 1

| Item | What closed it |
| --- | --- |
| 1, B1 | `SessionWorkspace.svelte`: the `onpressagain` handler takes the event, calls `event.preventDefault()`, then `startRename`. `TreeItem.svelte` is unchanged. |
| 2, B4 | `SessionWorkspace.svelte`: `let typed = $state('')`, set by `startRename` (both the press and the menu), `value={typed}`, `oninput` writes it. The document-level Escape `$effect`, its rule from `git show 3e2595261:src/lib/views/sessions/session-list/SessionWorkspace.svelte`; a key inside the row is left to the field's own Escape, which brings the focus back. |
| 3, B2 | `SessionList.svelte`: `tabindex="-1"` on `<li class="fold">`, with the CSS comment saying why. |
| 4, B3 | `opening.svelte.ts`: `composerTab` is gone; `targetTab(on, documents, asNew)` holds the base's body with `typedTab` first for New alone. `composeIn` passes true; `composeAt` for a place passes `at.asNew === true`, for a task false. The before and after are in the host- and user-visible table. |
| 5, ST1 | `opening.ts:10`, `opening.ts:155`, `landing.ts:3`, `landing.ts:21` name `opened: true` beside no catalogue group. |
| 6, ST2 | `session-list.ts:1-4`: the unit-test claim is gone; the head says the file holds what the list and its row partials share, as stateless functions. No test added. |
| 7, ST3 | `docs/HELP.md`, Workbenches, second bullet: both sentences rewritten. |
| 8, ST5 | The two lists below. |
| 9, S1 and ST4 | The list of program edits below. No such command ran in this round. The full-list count stands above. |

Sentences the round's reach required beyond the items: `HELP.md` Terminals bullet on New, `SessionList.svelte` head and `newSession` doc, `terminals.svelte.ts` head and `pageTab` doc, `terminal-tabs.ts` `pageTarget` doc, `opening.svelte.ts` head, `ComposeAt`, `composeIn`.

## Helper greps

`grep -rnw <name> ../O123-base/src ../O123-base/tests ../O123-base/config ../O123-base/utils --exclude=local.yml`, run in this round on the base copy; the build's own grep before writing each is not on record in the first report.

| Name | Hits on the base | Reading |
| --- | --- | --- |
| `withDraft` | 0 | none; `grep -rnE "draft\b\|Draft\b"` over the base's composer state and `views/sessions/terminal/start` prints nothing |
| `keptOf` | 6 | `layout/saved/kept.ts:60` (kept workbench layouts) and `boards/focus/filter.ts:313` (a filter over records); neither reads a composer record, and mine is local to `composer.ts` |
| `composerTab` | 0 | the name is gone from the tree (`grep -rnw composerTab src tests docs README.md`: 0); the function is `targetTab`, the base's name |
| `pressTarget` | 0 | the base's press rule is inline in `open-session.ts:56,70`, moved into the helper |
| `moveToNewTab` | 0 | `moveInto` moves into a tab that exists; `openBeside` opens one; the helper calls both, so it repeats neither |
| `listRows` | 5 | `server/accounts/connect/rows.ts:250` (rows of a config list), server side and unrelated; mine is view support. `graphRows` (`views/sources/repositories/graph/graph-rows.ts:28`) builds another list's `KeyRow[]` from its own shape |
| `groupRow` | 2 | `boards/collection/index.ts:498`, local, a collection's group row; mine makes a tree id |

## Each changed thing and the sentences that describe it

Greps over `src tests config docs/HELP.md docs/apps.md docs/data-map.md README.md`, `--exclude=local.yml`.

**`opened`, a view opened for something** (`no catalogue group|catalogue group lists|with a catalogue group`):

| Sentence | State |
| --- | --- |
| `opening.ts:10`, `opening.ts:155`, `landing.ts:3`, `landing.ts:21` | rewritten |
| `context.ts:717`, `registry.ts:122` | still true, written with the field |
| `shell/Workbench.svelte:129` "views no catalogue group holds" | still true: it speaks of the views themselves, not of the landing rule |

**The composer's tab and the typed prompt** (`prompt being typed|typed prompt|holds only the prompt`, `pageTabOf|pageTarget`, `documents pane`):

| Sentence | State |
| --- | --- |
| `opening.svelte.ts` head, `ComposeAt`, `targetTab`, `composeIn` | rewritten |
| `terminals.svelte.ts:19-22`, `:367` | rewritten |
| `terminal-tabs.ts:421` `pageTarget` | rewritten |
| `SessionList.svelte` head, `newSession` | rewritten |
| `docs/HELP.md` Terminals, the bullet on a press | rewritten |
| `composer.ts:2,6,73,75,182`, `Composer.svelte:9,114` | still true |
| `terminal-lists.ts:161`, `:706` of the store (`startOnPage`) | still true: a terminal start has no draft reach |
| `terminals.svelte.ts:225` `composeAt` | still true: a typed tab is a Terminal tab of the page on screen |
| `opening.ts:61`, `open-session.ts:21,53`, `workbench-shape.ts:40`, `terminals.svelte.ts:205` | still true |
| `HELP.md:157` table row of `n` | still true |

**The press and the Sessions tab** (`press in (a\|the) (list\|session)\|in the sessions list\|a press on a session`, `Sessions view\|sessions view\|Sessions rail\|Sessions page\|sessions rail`):

| Sentence | State |
| --- | --- |
| `docs/HELP.md` Workbenches, second bullet | rewritten |
| `selection.svelte.ts:10`, `composer.ts:7`, `open-session.ts:19,53`, `config/options/layout.yml:340` | still true |
| `bodies.ts:58`, `overrides.ts:5,25`, `stores/shapes.ts:201` "the sessions list" | still true: the list keeps that name |
| `PaneStrip.svelte:42`, `server/sessions/stores/hooks.ts:115`, `server/root/hooks.ts:3`, `git-message.ts:13`, `PickSession.svelte:3,36`, `SessionWorkspace.svelte:2`, `TerminalRows.svelte:2`, `Terminal.svelte:186`, `session-list.yml:44,45` "the Sessions view" | still true: `session-list` is a view, shown as a tab |

**The moved section files and the deleted page** (`views/sessions/session-detail/[A-Za-z]`, `arrangements\.sessions\|group: 'sessions'`, `chord: m`): 0 hits apart from `SessionDetail.svelte`'s own path; the nine moved files' head comments are rewritten.

## Program edits of the build

Every Bash command of the build's transcript (125) was searched for `sed -i`, `perl`, inline `python`, `open(...,'w')`, `write_text`, `writeFileSync`, and a redirect into `src`, `tests`, `config`, `docs` or `README`.

| Command | File changed | What it changed |
| --- | --- | --- |
| `sed -i '' 's/The row menu'"'"'s Open in Pinned Pane opens a Session tab in the documents pane\./The row menu'"'"'s Open in its own pane opens a Session tab in the documents pane./' docs/HELP.md` | `docs/HELP.md` | the one sentence |

It is the only one. Three inline `python3` commands of the build had an empty script and changed nothing. `mv` moved the nine section files, which the brief's rules name. `npm run diagrams` is the generator the brief names. No program edit ran in repair round 1: every edit went through Edit, and the programs run were read-only. One `git log --oneline -3` ran at the round's start, a read outside the three git commands the task names; it changed nothing.
