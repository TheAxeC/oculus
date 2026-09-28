# Q89 report: the Terminal view as VS Code terminal panel (after repair round 1)

Everything in the brief and in the round 1 rulings is done, except Z39 (where Split starts for a folder no composer place holds), which the rulings leave to Axel and the landing. The full verify list was not run this round, as the rulings say; the orchestrator runs it on main at landing.

## Open items of the state file (verbatim from the main checkout's `tools/oculus/.scratch/migration/orchestrator-state.md`, read at the end of the round)

An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is booked as its own step in `plan.md` and carried in the Booked section below, since it needs no ruling from him.

- Z39, where Split starts a terminal whose folder no composer place holds (raised 2026-09-28 by Q89's review). Q89's brief says Split opens the composer beside "with the row's folder" (`agents/briefs/Q89.md:29`), and `HELP.md:123` says "in its folder". The composer offers only its places, the hub, every workspace root and every folder a session sits in (`composerPlaces`, `src/lib/state/sessions/composer.ts:119`), and turns any other value into the hub (`Composer.svelte:76-78`). So Split of a shell that has moved to `hub/projects/foo/code`, which no place names, starts at the hub, and one in `/tmp` also at the hub. The server's start takes any folder (`src/lib/server/machine/pty/routes.ts:410`), so nothing below the page stops the first option. Options:
  - (a) The composer a Split opens holds the row's folder as a place of its own, listed first by its path, and starts there. Pros: Split does what it says, as VS Code's split starts in the terminal's folder. Cons: the composer's folder list can hold a folder that is not a workspace, for that tab only.
  - (b) Split starts at the deepest place that holds the row's folder, the hub when none does, and `HELP.md:123` and the Split tooltip say so. Pros: nothing more to build. Cons: a split of a terminal in a subfolder lands somewhere else, and the reader must pick the folder again. This is the lazy option.
  - Recommended: (a). Q89's round 1 is sent without this item; the landing makes the change once Axel rules.


## Round 1: each ruling item

| Item | State | Where | Proof |
|---|---|---|---|
| 1. The list is one keyboard stop; Delete or Backspace kills, Shift+Enter splits | DONE | `TerminalList.svelte:223` and `:237` carry `tabindex={-1}`; `keys()` at `:126` asks `rowKey` (`terminal-list.ts:83`) and calls `show`, `split` or `kill`; head comment `TerminalList.svelte:11-15` corrected; `terminal_split_tip` and `terminal_kill_tip` name the keys; `HELP.md:123` names them | "is one stop of the focus order: the row at the stop, and none of its controls" and "audits the keys a row answers: Delete and Backspace kill, Shift+Enter splits" pass |
| 2. A composer tab with one terminal lists it | DONE | `listDrawn` (`terminal-list.ts:71`), used at `Terminal.svelte:158`; `HELP.md:123` says both cases | "draws the one terminal there is as a row while the tab shows the composer", "draws no list under the composer when no terminal runs", "audits when the list is drawn: two terminals, or one under the composer" pass |
| 3. `parseLayout` keeps only registered view ids | DONE | `parseLayout(value, label, known)` at `saved/saved.ts:279`, `viewStates` at `:328` (drops the empty key and any id `known` refuses; no rule given keeps nothing); `registerViews` on the layout store (`layout.svelte.ts:166`, `:674`), passed to `parseLayout` in `loadLayout`; wired in `src/lib/state/client/context.ts:255` as `registry.viewFor(view) !== undefined` | "keeps a saved value only under a registered view id, dropping an empty or unknown key" and "reads back only what the registry of the client holds after a reload" pass (`tests/state/workbench/layout/pages.test.ts`) |
| 4. `storedOrder` duplicate case | DONE | `terminal.test.ts`, the stored-order audit: `storedOrder({ order: ['a', 'a'] })` equals `['a']` | passes |
| 5. Kill counted per row | DONE | "offers Split and Kill on every row, ..." counts `aria-label="Split"` and `aria-label="Kill"` once in each row's slice | passes |
| 6. `DESIGN.md:271` | DONE | "except the Terminal view"; the sentence also names the one row under the composer | read |
| 7. `layout.svelte.ts:7-9` head comment | DONE | re-wrapped to the file's width | `tests/checks/source/comment-width.test.ts` passes |
| 8. Each case's own failure quoted | DONE | below | |
| 9. The `git rev-parse` line | kept | "Limitations" | |

`context.ts` is a path outside the brief's list: the layout does not import the registry, so the registry's rule is handed to the layout store where the client is wired, beside the existing `registerOpened` call.

## Each new case's failure

### Round 1 cases, on the code before this round (`npx vitest run tests/views/sessions/terminal.test.ts`)

- "is one stop of the focus order: the row at the stop, and none of its controls": `AssertionError: expected [ ...(4) ] to have a length of 2 but got 4` (three `tabindex="0"` in the list: the row, its Split and its Kill).
- "draws the one terminal there is as a row while the tab shows the composer": `AssertionError: expected [] to deeply equal [ 'd4e5f6-shell' ]`.
- "audits the keys a row answers: Delete and Backspace kill, Shift+Enter splits": `TypeError: rowKey is not a function`.
- "draws no list under the composer when no terminal runs": passed on the code before the round; it guards that a composer with no terminal draws no list. With `listDrawn` changed to `count >= 2 || composer`: `AssertionError: expected '<!--[--><section class="pane svelte-b...' not to contain 'data-terminal-list'`.
- "audits when the list is drawn: two terminals, or one under the composer": with `listDrawn` not exported: `TypeError: listDrawn is not a function`. With the rule undone to `count >= 2`, the composer-with-one case fails: `AssertionError: expected [] to deeply equal [ 'd4e5f6-shell' ]`.
- Duplicate stored order (item 4): passed on the code before the round, since `storedOrder` already used `new Set`. With `new Set` removed (`terminal-list.ts:27`): `AssertionError: expected [ 'a', 'a' ] to deeply equal [ 'a' ]`.
- Kill per row (item 5): passed on the code before the round, since every row has Kill. With Kill drawn on the first row only: `AssertionError: expected [ Array(1) ] to have a length of 2 but got 1`.
- "keeps a saved value only under a registered view id, dropping an empty or unknown key": with the round's filter undone (every key kept): `AssertionError: expected { '': { order: [ 'a' ] }, ...(2) } to deeply equal { terminal: { x: 1 } }`.
- "reads back only what the registry of the client holds after a reload": with the `registerViews` line removed from `context.ts`: `AssertionError: expected undefined to deeply equal { order: [ 'x' ] }`.

### The step's four `pages.test.ts` cases and four `folds.test.ts` cases, each with the step's change to its function undone

Each was run alone with `npx vitest run <file> -t '<name>'`, with the undone change in place, and the file was then put back byte for byte (the script asserted it).

- "is saved with the pages and read back after a reload" (`pageViewState`/`setPageViewState` taken out of the store): `TypeError: first.setPageViewState is not a function`.
- "is shared by the tabs of one view on the page and read by no other view" (same): `TypeError: store.setPageViewState is not a function`.
- "is kept by no page for an instance no page holds" (same): `TypeError: store.setPageViewState is not a function`.
- "reads a saved value that is not a map as nothing kept" (the `page.views` read taken out of `parseLayout`): `AssertionError: expected undefined to deeply equal { terminal: { order: [ 'z' ] } }`.
- "titles an agent terminal by its agent and describes it by the session running in it" (`terminalChoices` put back to its old `label` model): `AssertionError: expected { id: 'ended-one', ...(2) } to match object { id: 'ended-one', ...(4) }`.
- "describes an agent terminal no session is found in by its own name, else its id" (same): `AssertionError: expected { id: 'd4e5f6-claude', ...(2) } to match object { id: 'd4e5f6-claude', ...(1) }`.
- "titles a shell by its running command and describes it by its folder" (same): `AssertionError: expected [ { id: 'a1b2c3-shell', ...(2) } ] to deeply equal [ { id: 'a1b2c3-shell', ...(5) } ]`.
- "titles a shell tmux reports no command for "shell"" (same): `AssertionError: expected undefined to be 'shell' // Object.is equality`.

### The step's first run on the unchanged tree (from the first round, unchanged)

Every case failed except two, which the brief states as unchanged behaviour: "is drawn under an agent terminal" and "stays disabled with its sentence for an agent session running outside oculus". The quotes: shell steer box `expected '<!--[--><section class="pane svelte-b...' not to contain 'data-steer'`; one terminal `expected '' to be 'vim'`; two rows `expected '<!--[--><section ...' to contain 'data-terminal-list'`; shell titled "shell" (view) `expected '' to be undefined`; foreign row `expected [] to deeply equal [ 'a1b2c3-claude', 'd4e5f6-shell' ]`; stored order (view) `TypeError: client.layout.setPageViewState is not a function`; Split and Kill `expected 0 to be greater than or equal to 2`; the pure-function audits `Cannot find module '../../../src/lib/views/sessions/terminal/terminal-list.ts'`.

## Checks, run at the end of the round

- `npx vitest run tests/views/sessions/terminal.test.ts tests/state/workbench/layout tests/state/sessions/folds.test.ts tests/views/sessions tests/views/whole tests/checks tests/ui/wall.test.ts tests/ui/colours.test.ts`: `Test Files  51 passed (51)`, `Tests  1044 passed (1044)`.
- `npm run check -> exit 0` (`COMPLETED 1431 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`).
- `npm run format:check -> exit 0` (`All matched files use Prettier code style!`).
- `npm run lint -> exit 0`.
- The spec's perl ASCII gate over `src tests bin config` printed nothing; `LC_ALL=C grep -n '[^ -~]' HELP.md DESIGN.md` printed nothing.
- The full verify list was not run in this round (the rulings' "Tests" section). In the first round, verify stopped on two timeouts in files the step does not touch (`tests/checks/imports/order.test.ts`, `tests/checks/tree/scratch.test.ts`); the refuter's run of it passed all six commands.

## What to build (the brief), item by item

| Item | State | Where |
|---|---|---|
| 1. Message box only under an agent | DONE | `Terminal.svelte` `agent` and `{#if agent}<SteerBox {terminal} />`; the "selected elsewhere" branch unchanged |
| 2. TerminalList replaces TerminalPicker | DONE | `TerminalPicker.svelte` deleted; `TerminalList.svelte`; rows from `terminalChoices` (`folds.ts`); one keyboard stop with Enter, Shift+Enter, Delete and Backspace; Split and Kill on hover; bell mark for 1000 ms |
| 3. One terminal: title on the bar | DONE | `TerminalTitle.svelte`, drawn while the tab shows its only terminal; a composer tab lists the one terminal instead (ruling 2) |
| 4. Multi-line paste question | DONE | `holdPastes`, `pasteLines`, `Confirm` in `Terminal.svelte` |
| 5. File drop types a quoted path | DONE | `droppedOnGrid`, `shellQuote` |
| 6. Reorder kept in the page's layout state | DONE | `Page.views`, read back only under a registered view id; `orderedRows`, `movedOrder`, `storedOrder`, `withOrder` |
| 7. Words and docs | DONE | `terminal.yml` (11 keys of the step, two tips naming the keys), `session-list.yml` picker words removed; `HELP.md:123`, `DESIGN.md:208`, `:271`, `:272` |

`grep -rn "pick_terminal\|TerminalPicker\|Pick a terminal\|picks among the terminals" src tests config HELP.md DESIGN.md README.md` printed nothing in the first round; this round changed none of those names.

## Files, lines before and after

Before is `wc -l` of the same path in the main checkout as it stands at the end of the round.

| File | Before | After |
|---|---|---|
| src/lib/views/sessions/terminal/Terminal.svelte | 411 | 538 |
| src/lib/views/sessions/terminal/TerminalPicker.svelte | 62 | deleted |
| src/lib/views/sessions/terminal/TerminalList.svelte | new | 346 |
| src/lib/views/sessions/terminal/TerminalTitle.svelte | new | 61 |
| src/lib/views/sessions/terminal/terminal-list.ts | new | 143 |
| src/lib/state/sessions/folds.ts | 272 | 303 |
| src/lib/state/workbench/layout.svelte.ts | 638 | 680 |
| src/lib/state/workbench/layout/model.ts | 157 | 168 |
| src/lib/state/workbench/layout/saved/saved.ts | 425 | 445 |
| src/lib/state/client/context.ts | 293 | 295 |
| config/text/views/sessions/terminal.yml | 20 | 31 |
| config/text/views/sessions/session-list.yml | 70 | 68 |
| tests/state/sessions/folds.test.ts | 288 | 374 |
| tests/views/sessions/terminal.test.ts | new | 318 |
| tests/views/sessions/sessions.test.ts | 638 | 639 |
| tests/views/whole/type-scale.test.ts | 345 | 345 (two entries changed; main's count moved since the first round) |
| tests/state/workbench/layout/pages.test.ts | 611 | 708 |
| tests/ui/wall.test.ts | 204 | 206 |
| HELP.md | 294 | 294 (line 123 rewritten) |
| DESIGN.md | 320 | 320 (lines 208, 271, 272 rewritten) |
| docs/diagrams/layers, layer-state, layer-views (.dot and .svg) | | regenerated by `npm run diagrams` in the first round |

## Judgment calls (each reversible)

1. `parseLayout` takes the rule as a third argument whose default keeps no view state, and the layout store keeps nothing until `registerViews` is called. A caller that forgets the rule loses the order rather than carrying unknown keys. The empty key is dropped even when the rule would accept it.
2. `registerViews` is a second registration hook beside `registerOpened`, so the layout store still does not import the registry.
3. Shift+Enter is the Split key; Delete and Backspace both arm and then kill, as the Kill control does.
4. The list under a composer tab with one terminal is drawn only when the tab shows the composer, not when it shows the "selected elsewhere" sentence.
5. From the first round, unchanged: `Page.views` keyed by view id with `{ order: string[] }` under `terminal`; the whole drawn order written on a drop; start order by `created` as an ISO string; agent rows described by the session title, else the terminal's name; shell description the last folder segment; `pasteLines` counting a trailing line break as closing the last line; the bell mark also beside the bar title; the dropped path typed through `sendInput`; list width 180 px.

## Limitations

- Z39: Split of a terminal whose folder no composer place holds opens the composer at the hub; `placeOf`, the composer and the Split half of `HELP.md:123` are left as they are for the landing.
- The paste question, the file drop, the drag, the bell, hover and the keys need a DOM; the unit suite asserts the functions they call, and the look on TEST checks them on screen.
- A drop while the socket is closed types nothing, as typing at the grid does.
- The first round ran one read-only `git rev-parse` in the worktree, against the brief's rule; no git state was changed. No git command was run in this round.

## Before and after, for the look (page TEST)

- One terminal, tab showing it: the bar shows its title and folder, no list.
- One terminal, tab on the composer (New terminal): a one-row list on the right; press the row to show it here.
- Two or more terminals: the list on the right; the row this tab shows is marked; hover shows Split and Kill.
- Keyboard: Tab reaches the list once (the current row), then leaves it; the arrow keys move between rows; Enter shows, Shift+Enter splits, Delete or Backspace pressed twice kills.
- Steer box: under a Claude or Codex terminal only; a shell's grid fills the height.
- Paste of three lines into a grid: the question "Paste 3 lines into the terminal?"; one line pastes at once.
- Drop a file from Files on the grid: its quoted path and a space are typed, no Enter.
- Drag a row: it moves; after a reload the order is kept.
