# Q89 report: the Terminal view as VS Code's terminal panel

Everything in "What to build" is built and every case is a passing test, but the verify run did not end with `verify: 6 commands passed`: its first command, `npm test`, went red on two 5000 ms timeouts in test files this step does not touch (`tests/checks/imports/order.test.ts` "holds the data folders" and `tests/checks/tree/scratch.test.ts` "is the only way a test file makes one"), which stopped the runner before the other five; those five were then run one by one from the worktree and each exits 0 (quoted below).

## Open items of the state file (verbatim, read from the main checkout's `tools/oculus/.scratch/migration/orchestrator-state.md:117-130`)

- Z36, where Q92's calendar link is kept (raised 2026-09-28, by `/spec` Q92). Z12 ruled the link written in `config/local.yml` as `- { provider: ics, label: <label>, url: "<link>" }` and never sent to the page. The tree makes the two contradict: the Config view lists `local.yml` as a card (`src/lib/state/system/config-files.ts:49`), reads its whole text through the file endpoint to count its lines (`src/lib/views/system/config/Config.svelte:107`) and draws that raw text under a disclosure, so any link in `local.yml` reaches the page whenever the Config view is open, and shows on screen when the card is opened. The connector's other secrets (client halves, refresh tokens) are kept out of `local.yml` in `~/.oculus/connect/`, at mode 0600, which nothing on the page reads (`src/lib/server/accounts/connect/store.ts:1-24`). Options:
  - (a) The link in the account's own credential file, `~/.oculus/connect/calendar/ics-<label>.json` holding `{ "url": "<link>" }`, and `local.yml` holding only `- { provider: ics, label: <label> }`. The Calendar's Add form offers a third provider, the published link, which asks for the label and the link, and the server writes the row and the file. Pros: the link sits with every other secret, the Config view shows none, and it is put there from the page without editing a file. Cons: the Add form gets a third field shape, and the link is not where `local.yml` readers would look for it.
  - (b) The link in `local.yml` as ruled, and the file endpoint masks the `url` of every `ics` row when it serves `local.yml`, a save carrying the mask keeping the stored link. Pros: the shape Z12 ruled. Cons: one file's text is rewritten on every read and save, the text shown differs from the disk, and a save must merge the mask back, which is fragile.
  - (c) The link in `local.yml` as ruled, and "never sent to the page" narrowed to never in the `calendar` channel, a log or an error. Pros: nothing more to build. Cons: the link shows in the Config view, where a screenshot of that card carries it. This is the lazy option.
  - Recommended: (a), since it keeps the link where oculus already keeps every connector secret and needs no masking. The rest of Q92 (the Inbox card, the entities, the calendar views, the 31/62 window) does not depend on this choice and is briefed once it is ruled, so Q92 goes out as one step.
- Z37, Q79 as one step or four (raised 2026-09-28, by the orchestrator while preparing the queue). Q79 is section D of `agents/reviews/library-audit.md` in full plus the raw view buttons. Counted on main at 406e97fa: 22 files build JSON responses by hand (`grep -rln 'new Response(JSON.stringify' src`), 24 call `sameOrigin(` (two different `sameOrigin` rules, `server/core/auth.ts:38` and `server/content/images.ts:298`), 99 test files end with `afterAll(sweepScratch` and 113 lines assert on a tmpdir, 31 test files walk folders with `readdirSync`, 7 `isRecord` copies, 11 raw `<button>` elements under `src/lib/views`, plus the marked, highlight.js, yaml, terminal-token, HPC-markup and plural items. As one step it touches most of `src/lib/server`, most of `tests` and a part of the views: one builder for many hours, a diff of a few hundred files that must be read in full, and no other step can run beside it, since it shares files with nearly every one. Two items shrink by rulings already made: the overlays' focus traps and the palette's `aria-activedescendant` go to Q81 (LA1 (a), LA2 (b) taken), and the `duplication.test.ts` fix goes, since Q87 replaces that check with `jscpd` (LA12 (a)). Options:
  - (a) Split Q79 into four steps, each one builder and one review: Q79a the server (`json()`, the one `/api/` origin guard in `hooks.server.ts` with the two rules reconciled, config read one way, `isDeepStrictEqual`, `TextDecoder`, `util.parseArgs` in `bin/` and `root/args.ts`, `stripVTControlCharacters` and `timers/promises` in `usage/refresh.ts`, `yaml` `stringify` in the migration script); Q79b the tests (vitest `test.extend` scratch fixtures in place of `afterAll(sweepScratch)`, the redundant tmpdir assertions dropped, `fs.globSync` for the walkers, the TypeScript scanner and `svelte/compiler` as the one code reader of the checks); Q79c the page (`svelte/no-restricted-html-elements` over every view folder in place of `controls.test.ts`, the 11 raw buttons made primitives, marked's `walkTokens`, the Help view reading marked's tokens, `hljs.getLanguage`, the unused highlight.js in Config, the terminal's font and selection colour from tokens, the HPC views' markup one element per line, the `hpc.svelte.ts:33` plural); Q79d the shared helpers (the seven `isRecord` copies to `isMap`, one `inside`, one `parseBranches`, one porcelain parser, one path helper, one `ago`, one local-date helper). Q79a and Q79c touch disjoint folders and can run side by side with other steps; Q79b runs alone. Pros: each diff can be read whole and reviewed, and work goes on beside three of the four. Cons: four dispatches, four landings.
  - (b) Keep Q79 as one step, run alone. Pros: one dispatch. Cons: the diff is too large to read in full and review well, and the queue stops while it runs. This is the lazy option.
  - Recommended: (a).

## The cases' first run, on the unchanged tree

Command: `npx vitest run tests/views/sessions/terminal.test.ts tests/state/sessions/folds.test.ts`. `terminal.test.ts` failed at import (`Error: Cannot find module '../../../src/lib/views/sessions/terminal/terminal-list.ts'`), so to get one result per case the same cases were run once from a temporary copy with that one import replaced by stubs that throw, and the copy was deleted after the run. Results per case (the case names are those of that first run; the pure-function cases were renamed "audits ..." afterwards, see the judgment calls):

| Case of the brief | Test | First run |
|---|---|---|
| Agent terminal shown: steer box under the grid | "is drawn under an agent terminal" | passed: the tree draws the steer box under every terminal, so this case holds before and after; it guards that the change keeps it |
| Shell shown: no steer box | "is not drawn under a shell, ..." | failed: `expected '<!--[--><section class="pane svelte-b...' not to contain 'data-steer'` |
| Agent session running elsewhere: sentence and disabled box, as today | "stays disabled with its sentence ..." | passed: the case says "as today", so it holds before and after; it guards that the change keeps it |
| One terminal: no list, toolbar holds its title | "draws no list and puts its title and description on the bar" | failed: `expected '' to be 'vim'` |
| Two terminals, Claude "Fix the parser" and vim in `/Users/x/work/oculus` | "draws one row per terminal, titled after what runs, the shown one marked current" | failed: `expected '<!--[--><section ...' to contain 'data-terminal-list'` |
| Shell with empty `command`: titled "shell" | view: "titles a shell tmux reports no command for "shell""; folds: same name | view failed: `expected '' to be undefined`; folds failed: `expected undefined to be 'shell'` |
| A foreign terminal: no row | "holds no row for a terminal oculus did not start" | failed: `expected [] to deeply equal [ 'a1b2c3-claude', 'd4e5f6-shell' ]` |
| Stored order names the second first; one missing goes last | view: "draws the rows in the page's stored order, ..."; pure: "orders rows by start time, ..." | view failed: `TypeError: client.layout.setPageViewState is not a function`; pure failed: module missing |
| `shellQuote('/tmp/it\'s here.txt')` | "quotes a path for the shell, ..." | failed: module missing |
| Paste `a\nb\nc` held naming 3 lines; `abc` passed through | "holds a paste of several lines, ..." | failed: module missing |
| `terminalChoices` row model per kind, in folds.test.ts | "titles an agent terminal by its agent ...", "describes an agent terminal no session is found in ...", "titles a shell by its running command ...", "titles a shell tmux reports no command ..." | all four failed, e.g. `expected [ { id: 'a1b2c3-shell', ...(2) } ] to deeply equal [ { id: 'a1b2c3-shell', ...(5) } ]` (the old model had `label` and no `title`, `description`, `kind`, `created`) |
| Split and Kill on rows, tooltip (item 2, no case of its own) | "offers Split and Kill on every row, ..." | failed: `expected 0 to be greater than or equal to 2` |
| Order survives a reload (item 6) | first written in terminal.test.ts, now in `tests/state/workbench/layout/pages.test.ts` | failed: `TypeError: first.setPageViewState is not a function` |

No case turned out to be one the brief's rules get wrong. The two cases that passed on the unchanged tree are the ones the brief states as unchanged behaviour ("as today" and the agent steer box), so verify item 2's "each new case failing" cannot hold for them; they are kept as guards.

## What to build, item by item

| Item | State | Where | Proof |
|---|---|---|---|
| 1. Message box only under an agent | DONE | `src/lib/views/sessions/terminal/Terminal.svelte:147` (`agent`), `:478-480` (`{#if agent}<SteerBox>`); the "selected elsewhere" branch unchanged at `:453-460` | `npx vitest run tests/views/sessions/terminal.test.ts` (3 steer-box cases pass); `tests/views/sessions/sessions.test.ts` shell case updated to expect no steer box, passes |
| 2. TerminalList replaces TerminalPicker | DONE | `TerminalPicker.svelte` deleted; `TerminalList.svelte` new (339 lines); rows from `terminalChoices` (`src/lib/state/sessions/folds.ts:249-303`); title, description, current mark (`data-current`, `.row.current`), tooltip (`terminalTip`, `terminal-list.ts`), press by the picker's rule (`TerminalList.svelte` `show`), roving by `nextStop` from `ui/tree/roving.ts` with Enter, Split (`openBeside('terminal', { id })` then `setInstanceState` with `withComposer(..., { workspace, agent: row.kind })`), Kill arming then `stopTerminal`, bell mark for `BELL_MS` = 1000 from `term.onBell` (`Terminal.svelte` `ring`) | `tests/views/sessions/terminal.test.ts` list cases pass; `grep -rn "pick_terminal\|TerminalPicker\|Pick a terminal\|picks among the terminals" src tests config HELP.md DESIGN.md README.md` prints nothing |
| 3. One terminal: title on the bar | DONE | `TerminalTitle.svelte` (new, 61 lines), drawn by `Terminal.svelte` when `!listed && shown !== null` | "draws no list and puts its title and description on the bar" passes |
| 4. Multi-line paste question | DONE | `holdPastes` and `pasteLines` in `terminal-list.ts`; `Confirm` with `sessions.paste_confirm` in `Terminal.svelte`; yes calls `grid.paste`, no drops it | "audits the line count a paste is held and asked about by, and one line passing" passes; the press itself is DOM-only, for the look |
| 5. File drop types a quoted path | DONE | `droppedOnGrid` in `Terminal.svelte` sends `` `${shellQuote(path)} ` `` through `sendInput`, no Enter | "audits the quoting of a dropped path ..." passes (`'/tmp/it'\''s here.txt'`) |
| 6. Reorder kept in the page's layout state | DONE | `Page.views` (`src/lib/state/workbench/layout/model.ts`), read back in `parseLayout` (`saved/saved.ts`), `pageViewState` / `setPageViewState` in `layout.svelte.ts`; `orderedRows`, `movedOrder`, `storedOrder`, `withOrder` in `terminal-list.ts`; HTML5 drag in `TerminalList.svelte` | `npx vitest run tests/state/workbench/layout/pages.test.ts` ("is saved with the pages and read back after a reload" and three more pass); view case "draws the rows in the page's stored order ..." passes |
| 7. Words and docs | DONE | 11 keys added to `config/text/views/sessions/terminal.yml`, `pick_terminal` and `pick_terminal_tip` removed from `session-list.yml`; `HELP.md:123`, `DESIGN.md:208`, `:271`, `:272` corrected; head comment of `layout.svelte.ts` corrected | `grep -rn "steer box" HELP.md DESIGN.md` shows only the corrected sentences; `tests/checks` pass (catalog key readers included) |

The tests of "Paths this step writes", run last with `npx vitest run tests/checks tests/views/sessions tests/state/sessions/folds.test.ts tests/state/workbench tests/views/whole`: `Test Files  64 passed (64)`, `Tests  1283 passed (1283)`. `npx vitest run tests/ui/colours.test.ts tests/ui/wall.test.ts`: `Test Files  2 passed (2)`, `Tests  16 passed (16)`.

### The verify lines, verbatim

`sh /Users/axelfaes/.claude-work/skills/land/templates/verify.sh /Users/axelfaes/workspace/research-hub/tools/oculus/.scratch/migration/orchestrator-state.md` (exit 1):

```
RED: npm test
exit status: 1
...
 FAIL  tests/checks/imports/order.test.ts > the folder order of each layer > holds the data folders
Error: Test timed out in 5000ms.
 FAIL  tests/checks/tree/scratch.test.ts > a scratch directory > is the only way a test file makes one
Error: Test timed out in 5000ms.
 Test Files  2 failed | 337 passed (339)
      Tests  2 failed | 5330 passed (5332)
```

Not this step's (timeouts in files this step does not touch): `tests/checks/imports/order.test.ts` and `tests/checks/tree/scratch.test.ts`; both passed in the `tests/checks` run above. Nothing was done about them.

The five commands the red stopped the runner before, each run once from the worktree with `bash -o pipefail -c`:

```
npm run check -> exit 0
1790607539334 COMPLETED 1431 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
npm run build -> exit 0
npm run format:check -> exit 0
All matched files use Prettier code style!
npm run lint -> exit 0
! LC_ALL=C grep -rna '[^ -~]' src tests -> exit 0
```

The spec's ASCII gate (`LC_ALL=C perl -ne ...` over `src tests bin config`) printed nothing, and `LC_ALL=C grep -n '[^ -~]' HELP.md DESIGN.md` printed nothing.

### What turns each new test red (in words)

- Steer box under an agent: drawing `SteerBox` for no terminal (dropping it from the grid branch).
- No steer box under a shell: removing the `{#if agent}` around `<SteerBox {terminal} />`.
- Selected elsewhere: removing the `id === null && selectedSession !== null` branch.
- One terminal on the bar: removing `<TerminalTitle>` or its `!listed && shown !== null` condition.
- Two rows titled Claude / vim with descriptions: reverting `terminalChoices` to the old `label` model, or dropping `TerminalList` from the body.
- Shell titled "shell": removing the `one.command === ''` branch in `terminalChoices`.
- No foreign row: removing the `foreign !== true` filter.
- Stored order drawn: passing `[]` in place of `storedOrder(pageViewState(instance.id))`, or dropping `views` from `Page`.
- Split and Kill on rows: removing the `.actions` controls in `TerminalList.svelte`.
- `shellQuote`, `pasteLines`, `orderedRows`, `movedOrder`, `placeOf`, `storedOrder`: changing each function's rule.
- The four `terminalChoices` folds cases: changing the agent title, the session-title description, the name fallback, the folder description or the empty-command title.
- The four page-view-state cases in `pages.test.ts`: dropping the `views` read in `parseLayout`, keying the store by page alone rather than by view, or storing for an instance no page holds.

## Files, lines before and after

Before is `wc -l` of the same path in the main checkout as it stands now.

| File | Before | After |
|---|---|---|
| src/lib/views/sessions/terminal/Terminal.svelte | 411 | 536 |
| src/lib/views/sessions/terminal/TerminalPicker.svelte | 62 | deleted |
| src/lib/views/sessions/terminal/TerminalList.svelte | new | 339 |
| src/lib/views/sessions/terminal/TerminalTitle.svelte | new | 61 |
| src/lib/views/sessions/terminal/terminal-list.ts | new | 121 |
| src/lib/state/sessions/folds.ts | 272 | 303 |
| src/lib/state/workbench/layout.svelte.ts | 638 | 668 |
| src/lib/state/workbench/layout/model.ts | 157 | 168 |
| src/lib/state/workbench/layout/saved/saved.ts | 425 | 426 |
| config/text/views/sessions/terminal.yml | 20 | 31 |
| config/text/views/sessions/session-list.yml | 70 | 68 |
| tests/state/sessions/folds.test.ts | 288 | 374 |
| tests/views/sessions/terminal.test.ts | new | 256 |
| tests/views/sessions/sessions.test.ts | 638 | 639 |
| tests/views/whole/type-scale.test.ts | 344 | 345 |
| tests/state/workbench/layout/pages.test.ts | 611 | 666 |
| tests/ui/wall.test.ts | 204 | 206 |
| HELP.md | 294 | 294 (one line rewritten) |
| DESIGN.md | 320 | 320 (three lines rewritten) |
| docs/diagrams/layers.dot/.svg, layer-state.dot/.svg, layer-views.dot/.svg | | regenerated by `npm run diagrams`; `cmp` against main lists exactly these six |

## Paths outside the brief's list, and why

- `src/lib/views/sessions/terminal/TerminalTitle.svelte`: Terminal.svelte passed the 540-line component line of `tests/checks/tree/size.test.ts` (593 lines); the bar title moved into this partial beside it, and the paste listener into `terminal-list.ts`, which brought it to 536.
- `src/lib/state/workbench/layout/model.ts`, `saved/saved.ts`, `layout.svelte.ts`: the layout-state helper item 6 needs is three edits there (the `views` field on `Page`, its read in `parseLayout`, the store's getter and setter), since a page field is saved by the store and read back by the parse.
- `tests/state/workbench/layout/pages.test.ts`: the store's persistence cases draw nothing, and `tests/checks/tree/audits.test.ts` names any case under `tests/views` that draws nothing an audit; they are coverage of the layout store, so they sit with its other page cases.
- `tests/ui/wall.test.ts`: the list row's hover fill (`background: var(--chip)`) is solid on purpose, as `TerminalRows.svelte .row:hover` is, and is listed there with the same reason.

## Judgment calls the brief did not cover (each reversible)

1. The page's view state is a generic `Page.views: Record<ViewId, unknown>` keyed by view id, read and written by instance (`pageViewState(instance)`, `setPageViewState(instance, state)`), and the Terminal view keeps `{ order: string[] }` under `terminal`. It is saved in the browser's layout envelope and read back; a value that is not a map is read as nothing. This is a saved shape the brief did not name.
2. The stored order written on a drop is the whole order as drawn (every live terminal), so an id of a terminal since stopped leaves it at the next drag; until then `orderedRows` passes over it.
3. Start order is `created` compared as an ISO string.
4. An agent terminal with no session found is described by its own `name`, else its id (the label `terminalChoices` gave before).
5. A shell's description is the last non-empty segment of `cwd`, or `cwd` itself for `/`.
6. `pasteLines` counts lines split on `\r\n`, `\r` or `\n`, a trailing line break closing the last line (`a\nb\n` is 2); any line break at all holds the paste, so `a\n` asks about 1 line.
7. The roving list is one stop for its rows; the Split and Kill of the row at the stop follow it in the Tab order (tabindex 0), the other rows' controls carry -1, so the keyboard reaches both controls of the row it is on. The controls are drawn clear (`opacity: 0`) until hover or focus-within, so they stay focusable.
8. The bell mark is also drawn beside the bar's title when one terminal is shown, not only on a list row.
9. Split starts the composer in the deepest composer place holding the row's `cwd` (`placeOf`), since the composer only offers its places; with none holding it the folder is passed and the composer falls back to the hub.
10. A row press on a pinned tab calls `pinInstance(instance, row.terminal, row.title)`; the tab's label effect then renames it to the terminal's name, as before.
11. The dropped path is typed with `sendInput` (the keystroke channel), not `term.paste`, so no bracketed-paste markers wrap it.
12. The list is 180 px wide; row height 22 px; Kill failure is one line under the rows.
13. New catalog words: `terminal_title_shell` ("shell"), `terminal_list`, `terminal_row_tip` ("{0}\nCommand: {1}\nFolder: {2}\nStarted: {3}"), `terminal_split`, `terminal_split_tip`, `terminal_kill`, `terminal_kill_tip`, `terminal_kill_armed`, `terminal_bell`, `paste_confirm` ("Paste {0} lines into the terminal?"), `paste_ok`; the paste question's cancel is `ui.confirm_cancel`. Glyphs used: `split_right`, `trash`, `bell`, and the kind glyphs.
14. The seven pure-function cases in `tests/views/sessions/terminal.test.ts` are named "audits ..." as `tests/checks/tree/audits.test.ts` requires of a case under `tests/views` that draws nothing; they assert the functions the view calls.

## Limitations and sharp edges

- A Terminal tab showing the composer with exactly one terminal running has no list and no bar control to show that terminal in this tab (item 3 draws the title only for a terminal shown). The Sessions list's terminal row still opens it in its own pane.
- Paste interception, the file drop, the bell, the arrow keys, hover and drag need a DOM and are not exercised by the unit suite; they are for the look. That xterm takes Cmd+V through the browser's paste event on its textarea, which the capture listener relies on, was not verified in a browser.
- A drag started on the row's button inside a `draggable` row: works in Chrome by the HTML drag model; other browsers not verified.
- A drop while the socket is closed: `sendInput` returns false and nothing is typed, with no message.
- Kill stays armed until pressed again or another row's Kill is pressed, as the Sessions list's stop does.
- What tmux reports as `command` for a Claude or Codex pane is still not verified; agent rows do not use it for the title.
- A Terminal tab moved to another page reads that page's stored order.
- One read-only `git rev-parse` ran in the worktree with its output discarded; no git state was changed.

## Before and after, for the look (page TEST)

- Toolbar, one terminal: open a Terminal tab with only one terminal running (a shell in some folder). Before: a "Pick a terminal" menu. After: the terminal's title (the running command, e.g. `zsh`) and its folder name muted after it; no menu.
- The list: start a second terminal (Claude). Before: no list, the menu lists names. After: a 180 px column on the right with one row per terminal, "Claude" plus the session title, and the shell's command plus its folder; the row this tab shows has the accent bar and tint; hovering a row shows Split and Kill; the tooltip shows name, command, folder, start time. With the tab on the composer (New terminal) the list is still drawn.
- Steer box under a shell: show the shell. Before: the message box under the grid. After: none, the grid fills the height. Show the Claude terminal: the message box is under the grid.
- Paste question: copy three lines and paste into the shell grid. Before: sent at once. After: a dialog "Paste 3 lines into the terminal?" with Cancel and Paste; one line pastes without a question.
- Drop: drag a file from a Files tab onto the grid. Before: nothing. After: its absolute path in single quotes and a space appear at the prompt, no Enter.
- Order: drag the second row above the first. Before: no drag. After: the rows swap; reload the page and the order is kept; a third terminal started later goes last.
- Bell: run `printf '\a'` in the shown shell with two terminals running: its row shows the bell mark for a second.
