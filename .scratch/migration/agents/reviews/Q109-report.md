Everything in the brief is done, and all eight rulings of repair round 1 are done, except the looks: case 1 and the browser halves of cases 18, 19, 26 and 28 are not run, because they need a browser on the dev server and ports 8787 and 8790 are forbidden to me. Not covered by any test either: the bar's wiring in `Terminal.svelte` (the `menu` and `onpick` props of `TerminalTitle`); four mutations of it fail no test, so it rests on those looks (see Repair round 1, ruling 2).

## Open items of the state file (lines 120 to 125 of `.scratch/migration/orchestrator-state.md`, verbatim from `sed -n 120,125p`)

## Open items (only what Axel must rule on; every report opens with this list verbatim and repeats it until he has ruled)

An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is booked as its own step in `plan.md` and carried in the Booked section below, since it needs no ruling from him.

- Z138 (raised 2026-10-01 03:36, step X3d, its builder's open item A). Your ruling of 2026-09-25 says Seti's own table and colours, and X3d's round-0 ruling 4 draws them as `--seti-*` tokens set to `seti-ui`'s `ui-variables.less` values in every theme. Its premise that one set serves every theme is wrong: VS Code's Seti theme carries a `light` set (238 extension, 98 filename and 82 language entries; the default file icon `#d4d7d6` dark, `#bfc2c1` light), and on oculus's light panel Seti's own colours measure a contrast of 1.45 for white, 1.73 for yellow (every `.json`) and 2.13 for green (the builder's report, `agents/reviews/X3d-report.md`). (1) Keep Seti's colours in every theme. For: your ruling's words exactly. Against: icons on the light themes are hard to see, `.json` worst. (2) Copy VS Code's light values. For: what VS Code shows. Against: breaks the brief's rule that no VS Code hex is copied. (3) Keep Seti's values on the dark themes and set each `--seti-*` token on the light themes to a darker value derived from the same colour in `themes/derive.ts`, as other light tokens are derived. For: Seti's colours where they were made for, readable icons everywhere, no copied hex. Against: the light theme's icon colours are oculus's, not Seti's. Recommendation: (3). The lazy option is (1). What waits: only the light-theme colours of X3d's icons; X3d's review runs meanwhile, and the ruling goes into its repair round or its landing.

## The cases' first run on the unchanged tree

Every test below is in its final form (the tests of the step were written before any source change and run on the unchanged tree: 51 failing, 462 passing, 513 tests, 10 files failing, `npx vitest run` over the files of the step). The five watcher test files ran in a scratch copy of the unchanged tree with constants-only shims, since `MAX_WAIT` and `USAGE_MAX_WAIT` do not exist there. None of the brief's rules got a case wrong. `<unit>` is the word the file uses for what its watcher makes: rebuild (usage, portfolio), message (bookmarks), call (local), publish (sessions). The line after each test is the failure line of that run; vitest's ellipsis and marks are written in ASCII (`...`, `x`, `-`, `>`).

- **Case 1 (look)**
  - not run: it needs a browser on the dev server, and ports 8787 and 8790 are forbidden to me
- **Case 2**
  - `resizes the window to the grid before it asks for the channel`: `AssertionError: expected [] to deeply equal [ { action: 'resize', ...(3) } ]`
  - `asks for the channel and hands the scrollback over first`: `AssertionError: expected [] to deeply equal [ { ...(2) }, ...(2) ]`
- **Case 3**
  - `asks for the channel when the resize is refused` (terminals.test.ts:459) PASSES on the unchanged tree and after; against a scratch copy whose subscribe is sent only when the resize is ok it fails with `expected [] to deeply equal [subscribe]`
- **Case 4**
  - `asks for nothing when the listener is taken off before the resize answered`: `AssertionError: expected [ { type: 'subscribe', ...(2) } ] to deeply equal []`
  - `stops handing them over, and stops asking for the channel on a reconnect`: `AssertionError: expected [] to deeply equal [ 'before' ]`
- **Case 5**
  - `posts the grid size again when it changed while the resize was out, and asks after that`: `AssertionError: expected [] to have a length of 2 but got +0`
- **Case 6**
  - `asks for the channel at RESIZE_WAIT when the resize never answers`: `AssertionError: expected [] to have a length of 1 but got +0`
- **Case 7**
  - `posts the resize of a second subscribe after the first one answered, ending at the later size`: `AssertionError: expected [] to deeply equal [ { action: 'resize', ...(3) } ]`
  - `posts the resize of a remount after the one of the grid taken off, and asks for the channel once`: `AssertionError: expected [] to deeply equal [ { action: 'resize', ...(3) } ]`
- **Case 8**
  - `holds input typed while the resize is out and writes it right after the subscribe, in order`: `AssertionError: expected [ { type: 'subscribe', ...(2) }, ...(2) ] to deeply equal []`
  - `drops the input held for a listener taken off, and the input given after that`: `AssertionError: expected true to be false // Object.is equality`
- **Case 9 (reading)**
  - unchanged `TerminalGrid.svelte` line 371 `const off = subscribePty(wanted, (bytes, scrollback) => {` and line 377 `resized(wanted);` (grep -n on the unchanged tree)
- **Case 10**
  - `publishes a started terminal within the maximum wait when the store is written every 100 ms`: `AssertionError: the started terminal published in -1 ms: expected -1 to be greater than 0`
  - `publishes a started terminal within the maximum wait when the store is written every 300 ms`: `AssertionError: the started terminal published in -1 ms: expected -1 to be greater than 0`
  - `publishes a started terminal within the maximum wait when the store is written every 450 ms`: `AssertionError: the started terminal published in -1 ms: expected -1 to be greater than 0`
- **Case 11**
  - `publishes a renamed terminal with a new icon and colour within the maximum wait`: `AssertionError: the renamed terminal published in -1 ms: expected -1 to be greater than 0`
- **Case 12**
  - `publishes the session's own appended prompts within the maximum wait`: `AssertionError: the 21 prompts written published in -1 ms: expected -1 to be greater than 0`
- **Case 13 (each watcher; vitest prints one error block for the tests of a file that fail the same way)**
  - machine/usage/watch.test.ts: `makes a rebuild within the maximum wait of a source written every 100 ms`: `AssertionError: the first rebuild came at -1 ms, the bound is 1000: expected -1 to be greater than 0`
  - machine/usage/watch.test.ts: `makes a rebuild within the maximum wait of a source written every 450 ms`: `AssertionError: the first rebuild came at -1 ms, the bound is 1000: expected -1 to be greater than 0`
  - bookmarks.test.ts: `makes a message within the maximum wait of a source written every 100 ms`: `AssertionError: the first message came at -1 ms, the bound is 1000: expected -1 to be greater than 0`
  - bookmarks.test.ts: `makes a message within the maximum wait of a source written every 450 ms`: `AssertionError: the first message came at -1 ms, the bound is 1000: expected -1 to be greater than 0`
  - local.test.ts: `makes a call within the maximum wait of a source written every 100 ms`: `AssertionError: the first call came at -1 ms, the bound is 400: expected -1 to be greater than 0`
  - local.test.ts: `makes a call within the maximum wait of a source written every 180 ms`: `AssertionError: the first call came at -1 ms, the bound is 400: expected -1 to be greater than 0`
  - portfolio.test.ts: `makes a rebuild within the maximum wait of a source written every 100 ms`: `AssertionError: the first rebuild came at -1 ms, the bound is 400: expected -1 to be greater than 0`
  - portfolio.test.ts: `makes a rebuild within the maximum wait of a source written every 180 ms`: `AssertionError: the first rebuild came at -1 ms, the bound is 400: expected -1 to be greater than 0`
  - sessions.test.ts: `makes a publish within the maximum wait of a source written every 100 ms`: `AssertionError: the first publish came at -1 ms, the bound is 1000: expected -1 to be greater than 0`
  - sessions.test.ts: `makes a publish within the maximum wait of a source written every 450 ms`: `AssertionError: the first publish came at -1 ms, the bound is 1000: expected -1 to be greater than 0`
- **Case 14, 15, 16**
  - `makes one <unit> for a burst, also after a stretch of writes that reached the maximum wait`, `makes one <unit> for each write spaced 1.2 quiets apart` and `makes no <unit> after a close in the middle of writes longer than the maximum wait`, in each of the five watcher files: PASS on the unchanged tree (none appears among the 51 failures) and after
- **Case 17**
  - `runs one <unit> for each event when the quiet is 0`, `waits an injected quiet longer than the maximum wait, and a burst under it is one <unit>` in each file, and `makes no call after it is closed` (local.test.ts, quiet 1500): PASS on the unchanged tree and after
- **Case 18**
  - `draws the bar name directly inside the context menu trigger a list row sits in`: `AssertionError: expected '' to contain 'data-context-menu-trigger'`
  - `audits that the bar menu offers the items of a list row, with Join Terminals while another tab owns a terminal, and no Unsplit` (terminal-menu.test.ts) PASSES on the unchanged tree and after, since `terminalRowMenu` existed
  - `audits that each pick of the row menu goes to its own handler with the terminal it was opened on`: `TypeError: routePick is not a function`
  - `audits that an id no item carries, and the headings of the colour and join lists, do nothing`: `TypeError: routePick is not a function`
- **Case 19**
  - `audits that a Rename picked on the bar opens the rename field of the shown terminal`: `TypeError: routePick is not a function`
- **Case 20**
  - `audits that Kill arms on the first pick from the bar and kills on the second`: `TypeError: routePick is not a function`
- **Case 21**
  - `audits that the Join pick is handed the terminal the bar shows and the one to move`: `TypeError: routePick is not a function`
- **Case 22**
  - `is empty with none of the four keys, and for a terminal key that is not a map`: `TypeError: terminalOptions is not a function`
  - `sets no cursor or Option option on a grid built with none of the four keys`: `TypeError: terminalOptions is not a function`
- **Case 23**
  - `reads the cursor style as xterm names it: line is bar, block and underline are themselves`: `TypeError: terminalOptions is not a function`
  - `builds a grid with the cursor and Option options the read holds, and none of its copy key`: `AssertionError: expected undefined to be 'bar' // Object.is equality`
- **Case 24**
  - `leaves a key of the wrong type unset, and reads each of the three toggles on its own`: `TypeError: terminalOptions is not a function`
- **Case 25**
  - `is empty, with the file named as one that does not parse, when a key is written twice`: `TypeError: terminalOptions is not a function`
- **Case 26**
  - `audits that the selected text is written, and nothing for an empty selection`: `TypeError: copySelection is not a function`
  - `audits that a clipboard that refuses, throws at once or is absent throws nothing`: `AssertionError: expected [Function] to not throw an error but 'TypeError: (0 , __vite_ssr_import_4__...' was thrown`
- **Case 27**
  - `audits that a selection that stood when the key was turned on is not copied until it changes`: `TypeError: followTerminalOptions is not a function`
  - `audits that Select All copies the whole buffer while the key is on`: `TypeError: followTerminalOptions is not a function`
  - `audits that a selection is copied as it changes while the key is on, and an empty one writes nothing`: `TypeError: followTerminalOptions is not a function`
  - `audits that one call that turns the key on listens once, and none listens after the key is off or the call is undone`: `TypeError: followTerminalOptions is not a function`
- **Case 28**
  - `audits that the three xterm options follow the read, and the ones it leaves unset go back to the defaults`: `TypeError: followTerminalOptions is not a function`
  - `audits that no option change resizes the grid`: `TypeError: followTerminalOptions is not a function`
- **Case 29**
  - `carries all eleven keys the client state reads at first load`: `AssertionError: expected { font_px: 12.5 } to deeply equal { font_px: 12.5, ...(4) }`
  - the catalog check `holds an entry for every option of the five config files and every machine-local key` with the four entries removed from `config/catalogs/options.yml`: `appearance.yml: terminal.mac_option_is_meta: has no catalog entry`, `appearance.yml: terminal.copy_on_selection: has no catalog entry`, `appearance.yml: terminal.cursor_style: has no catalog entry`, `appearance.yml: terminal.cursor_blinking: has no catalog entry` (Tests 1 failed | 62 passed (63)); with them: Tests 63 passed (63)
- **Case 30 (reading)**
  - unchanged tree: `perfect-debounce` imported in src/lib/server/machine/usage/watch.ts:11, bookmarks.ts:28, local.ts:12, portfolio.ts:25, sessions.ts:31 and listed in package.json:76; `npm ls perfect-debounce` printed `perfect-debounce@2.1.0`. Now: the greps print nothing and `npm ls perfect-debounce` prints `(empty)`
- **Tests of the step that belong to no numbered case**
  - `reads the four keys beside font_px without either taking the other`: `TypeError: terminalOptions is not a function`
  - `hands out a copy, so a caller cannot change what the next read returns`: `TypeError: terminalOptions is not a function`
  - `holds today's behaviour in the file as it ships`: `TypeError: terminalOptions is not a function`
  - `audits that it lists the terminals of the other Terminal tabs by name, without a foreign one`: `TypeError: ownedElsewhere is not a function`
  - `audits that it marks the terminal for BELL_MS, replaces an earlier ring, and stops with the tab`: `TypeError: bellMark is not a function`

The failing tests per file in that run, from `grep -E '^ FAIL '`: usage/watch 2, bookmarks 2, local 2, portfolio 2, sessions 7, terminals 10, tones 1, theme 7, terminal-menu 7, terminal 11, which is 51.

## Result table (DONE / NOT DONE)

| Row | State | Proof |
|---|---|---|
| 1 `subscribePty(id, size, onBytes)` resizes first, `RESIZE_WAIT = 2000`, input held | DONE | tests/state/sessions/terminals.test.ts (10 tests red on the unchanged tree, green now); `npm test` |
| 2 lodash-es `debounce` with `maxWait` in the five watchers, `perfect-debounce` removed, `MAX_WAIT` and `USAGE_MAX_WAIT` exported | DONE | five watcher test files; `grep -rn perfect-debounce src tests package.json` prints nothing; `npm ls perfect-debounce` prints `(empty)` |
| 3 right-click row menu on the bar name of a sole terminal, one `routePick` | DONE except the browser half of the look | tests/views/sessions/terminal-menu.test.ts, terminal.test.ts |
| 4 four `terminal:` keys, `terminalOptions()`, `followTerminalOptions`, copy on selection, catalog entries | DONE except the browser half of the look | tests/ui/theme/theme.test.ts, tests/views/sessions/terminal.test.ts, the options catalog check in `npm run test:checks` |
| 5 docs DESIGN.md:116, README.md:13, HELP.md:127, HELP.md:221 | DONE | `sed -n Np` of each line; `tests/views/system/help.test.ts` passes inside `npm test` |
| Repair round 1, rulings 1 to 8 | DONE | the section Repair round 1 below |
| Case 1 and the browser halves of 18, 19, 26, 28 (looks) | NOT DONE | need a browser on a dev server; ports 8787 and 8790 are forbidden to me |

`npm run diagrams` (rc 0), then `sh ~/.claude/skills/land/templates/checks.sh .scratch/migration/orchestrator-state.md`, its lines verbatim:

```
$ npm test
 Test Files  355 passed | 20 skipped (375)
      Tests  5555 passed | 580 skipped (6135)
$ npm run test:checks
 Test Files  29 passed | 2 skipped (31)
      Tests  438 passed | 9 skipped (447)
$ npm run check
1790826919409 COMPLETED 2809 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build
$ npm run format:check
All matched files use Prettier code style!
$ npm run lint
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 7 commands passed
rc=0
```

Verify 3: `grep -rn perfect-debounce src tests package.json` prints nothing (rc 1) and `grep -rn "perfect-debounce\|es-toolkit" DESIGN.md README.md src` prints nothing (rc 1).

Verify 4: `npx vitest run tests/server/root/watch tests/server/machine/usage tests/state/sessions/terminals.test.ts tests/checks/config tests/ui/theme tests/views/sessions tests/state/shared --testTimeout 0`, rc 0:

```
 Test Files  34 passed (34)
      Tests  667 passed (667)
```

Verify 5 is the first-run section above (failures of the unchanged tree, quoted per test), the Repair round 1 section (the tests of this round, quoted before the change) and the audit / proof sort below.

Also run: the spec.md ASCII gate with `bin` dropped (`LC_ALL=C perl -ne ... $(find src tests config -type f ! -name local.yml) | wc -l`) prints 0; `sh utils/folder-check.sh` rc=0. Item counts (`ls -A | wc -l`): `src/lib/state/sessions/terminal` 8; `tests/views/sessions`, `tests/server/root/watch`, `tests/state/sessions` 10 each, so no new file in them. `package.json` line 69 `lodash-es` ^4.18.1, line 26 `@types/lodash-es` ^4.17.12.

What the green does not cover: the looks (case 1 and the browser halves of 18, 19, 26, 28); the bar's wiring in `Terminal.svelte` and `TerminalTitle.svelte` (`menu`, `onpick`, `own`), which no test fails on when it is broken; behaviour against a real tmux server and a real browser clipboard; the fold time of a real usage store (not measured).

## The tests named `audits that ...`, sorted into audits and proofs

Each line names the test, its class and the scratch-copy mutation that decides it. A proof fails with the behaviour it is written for taken out of the code; an audit passes with it taken out. Mutations ran one at a time on a copy of this tree, `python3 mutr1.py` (output `mutr1-out.txt`), and each was undone.

terminal-menu.test.ts:
- `audits that the bar menu offers the items of a list row, with Join Terminals while another tab owns a terminal, and no Unsplit`: AUDIT. It reads `terminalRowMenu`, which existed before this step; replacing the bar's `menu={() => ...}` in `Terminal.svelte` with `menu={() => []}` fails no test in `tests/views/sessions` (0 failing, rc 0).
- `audits that each pick of the row menu goes to its own handler with the terminal it was opened on`: PROOF. Fails with the body of `routePick` returning at once, with join's arguments swapped, with rename or kill left unrouted, and with the icon pick routed to clear.
- `audits that a Rename picked on the bar opens the rename field of the shown terminal`: PROOF. Fails with the body of `routePick` returning at once and with rename left unrouted.
- `audits that Kill arms on the first pick from the bar and kills on the second`: PROOF. Fails with the body of `routePick` returning at once and with kill left unrouted.
- `audits that the Join pick is handed the terminal the bar shows and the one to move`: PROOF. Fails with the body of `routePick` returning at once and with join's arguments swapped.
- `audits that an id no item carries, and the headings of the colour and join lists, do nothing`: PROOF. Fails with the last branch of `routePick` made a default that calls clear (it passes with the body returning at once, which is the other way round).
- `audits that it lists the terminals of the other Terminal tabs by name, without a foreign one`: PROOF. Fails with the own tab not excluded, with a foreign terminal not excluded, and with the view not checked, each alone.
- `audits that it marks the terminal for BELL_MS, replaces an earlier ring, and stops with the tab`: PROOF. Fails with the earlier ring not replaced, with the mark lasting 1 ms longer, and with `stop` leaving the timer.

terminal.test.ts:
- `audits that the three xterm options follow the read, and the ones it leaves unset go back to the defaults`: PROOF. Fails with each of the cursor style, the blink and the Option key left as it was when unset, each alone.
- `audits that no option change resizes the grid`: AUDIT. `followTerminalOptions` takes an `OptionsTarget`, which has no `resize`, so no typed change of the function can call one; the test fails only for a call made through a cast (the mutation that casts and calls `resize?.(80, 24)`). That the config effect sends no resize rests on the reading of `TerminalGrid.svelte:438-444`, which calls `followTerminalOptions` and nothing else.
- `audits that a selection is copied as it changes while the key is on, and an empty one writes nothing`: PROOF. Fails with the callback copying the first character only and with `copySelection` writing an empty text.
- `audits that a selection that stood when the key was turned on is not copied until it changes`: PROOF. Fails with the standing selection copied when the key turns on.
- `audits that Select All copies the whole buffer while the key is on`: PROOF. Fails with the callback copying the first character only.
- `audits that one call that turns the key on listens once, and none listens after the key is off or the call is undone`: PROOF. Fails with the listener attached whatever the key, with the undo not disposing it, and with the first-character copy.
- `audits that the selected text is written, and nothing for an empty selection`: PROOF. Fails with `copySelection` writing an empty text.
- `audits that a clipboard that refuses, throws at once or is absent throws nothing`: PROOF. Fails with the `try`/`catch` removed (the throwing and the absent clipboard), and with the `.catch` removed the run ends rc 1 on `Unhandled Rejection: Error: denied` from this test. Removing the `clipboard === undefined` guard alone changes no result, since the `catch` takes the absent clipboard's TypeError; the guard is not covered by any test.

That makes 16 tests named `audits that ...` in this step (`diff` of the `audits that` lines of the files on main against this tree lists exactly these 16): 14 proofs and 2 audits.

## Files, with line counts (`wc -l`)

All under `tools/oculus`:
- 129 src/lib/state/sessions/terminal/pty-subscribe.ts (new)
- 899 src/lib/state/sessions/terminals.svelte.ts
- 267 src/lib/state/shared/words/appearance.ts
- 142 src/lib/views/sessions/terminal/grid/grid-look.ts
- 86 src/lib/views/sessions/terminal/grid/grid-actions.ts
- 540 src/lib/views/sessions/terminal/grid/TerminalGrid.svelte
- 697 src/lib/views/sessions/terminal/terminal-list.ts
- 472 src/lib/views/sessions/terminal/TerminalList.svelte
- 540 src/lib/views/sessions/terminal/Terminal.svelte
- 103 src/lib/views/sessions/terminal/TerminalTitle.svelte
- 318 src/lib/server/root/watch/sessions.ts
- 112 src/lib/server/root/watch/bookmarks.ts
- 439 src/lib/server/root/watch/portfolio.ts
- 72 src/lib/server/root/watch/local.ts
- 189 src/lib/server/machine/usage/watch.ts
- 70 config/appearance.yml
- 613 config/catalogs/options.yml
- 26 config/text/views/system/config.yml
- 418 DESIGN.md
- 36 README.md
- 302 HELP.md
- 85 package.json
- 412 tests/server/root/watch/probe.ts
- 133 tests/server/root/watch/local.test.ts
- 209 tests/server/root/watch/bookmarks.test.ts
- 848 tests/server/root/watch/portfolio.test.ts
- 694 tests/server/root/watch/sessions.test.ts
- 228 tests/server/machine/usage/watch.test.ts
- 747 tests/state/sessions/terminals.test.ts
- 490 tests/views/sessions/terminal-menu.test.ts
- 813 tests/views/sessions/terminal.test.ts
- 363 tests/ui/theme/theme.test.ts
- 284 tests/state/shared/words/tones.test.ts
- 605 tests/checks/tree/boundaries.test.ts
- package-lock.json, docs/diagrams/layer-views.{dot,svg} and layers.{dot,svg}: regenerated by `npm install` and `npm run diagrams`

## Judgment calls the brief left open

- New module `src/lib/state/sessions/terminal/pty-subscribe.ts` holds the ordering (`createPtyOrder`, `RESIZE_WAIT`), because `terminals.svelte.ts` stands at 899 of 900 lines. `RESIZE_WAIT` is defined there and re-exported from the store.
- Held input goes to the newest live waiting subscription of the terminal and is dropped for a listener taken off while it waits.
- With two grids on one terminal id, the first grid's subscribe is sent between the two resizes, and the second grid's `socket.subscribe` is a deduplicated no-op, since the socket dedupes channels. The second resize still posts after the first answered.
- `TerminalListProps` loses six callbacks (`onsplit`, `onrename`, `onicon`, `oncolor`, `onclear`, `onkill`) and takes one `handlers: PickHandlers`, so a row and the bar call the same `routePick`.
- `TerminalTitle.svelte`'s `ContextMenu` is `own`, so a right-click on the bar name does not open an outer menu.
- `followTerminalOptions` returns an unset key to xterm's defaults (block, no blinking, no Option as Meta).
- The 540-line component limit forced three extractions, each with tests: `ownedElsewhere` and `bellMark` (terminal-list.ts) and `pageClipboard` (grid-actions.ts).
- `tests/server/root/watch/probe.ts` is widened beyond the brief's paths: the helper `holdsQuietAndMaxWait` serves the five watcher test files, and the synthetic hub fixtures moved from portfolio.test.ts so the duplication check holds. It takes `it` from `tests/fixtures/scratch.ts` because it takes a scratch directory.
- `tests/checks/tree/boundaries.test.ts` holds one FROZEN entry for the terminal settings, `lib/state/shared/words/appearance.ts:terminal` (line 277), in place of `terminalFont`; the file is not named in the brief and repair round 1 ruling 3 widened it.
- `config/text/views/system/config.yml` `desc_appearance` is changed, because `tests/views/system/help.test.ts` (lines 329 to 334) requires HELP.md to contain the catalog text and the brief names only HELP.md.
- `DESIGN.md` lines 264 and 361 are updated beside the named line 116, since they described the old debounce and the old subscribe order.
- The non-rendering cases under `tests/views` are named `audits that ...`, which `tests/checks` (audits.test.ts) requires.
- `package-lock.json` carries `@types/lodash` transitively through `@types/lodash-es`.
- The unit word in the injected-0 test name follows the file (ruling 1 below).

## Host and user-visible changes, before and after

- Moving or remounting a terminal pane: before, the client subscribed and then resized, so the scrollback arrived at the old size and rows under the cursor could be blank; now the window is resized to the grid first and the subscribe follows when the resize answers, or after `RESIZE_WAIT` (2000 ms) when it does not.
- Keys typed during that round trip: before, they went to the socket at once; now they are held and written right after the subscribe, in order.
- The bookmarks, portfolio, local and sessions channels under continuous writes: before, a file written without a pause was not rebuilt until the writes stopped; now it is rebuilt at least every `maxWait` (sessions 1000 ms, bookmarks 1000 ms, portfolio 400 ms, local 400 ms).
- The usage channel under continuous writes: before, no rebuild until the writes stopped; now one at least every `USAGE_MAX_WAIT` (1000 ms), and never more than one waiting behind a running fold. A fold slower than `USAGE_MAX_WAIT` leaves one rebuild queued, built from what is on disk when it starts, and every refresh in the meantime joins it.
- Right-click on the bar name of a sole terminal: before, nothing or the browser menu; now the same row menu as a list row.
- Four configurable terminal keys in `config/appearance.yml` (`mac_option_is_meta`, `copy_on_selection`, `cursor_style`, `cursor_blinking`) follow a config change without a reload or a resize.
- Copy in the terminal menu with a missing or refusing clipboard: before, it could throw; now it does nothing.
- The `copy_on_selection` catalog description now says `false copies only when asked: Copy, Copy as HTML or the copy key.`
- HELP.md, DESIGN.md and README.md text changed on the lines the brief names; DESIGN.md:116 and :361 as the rulings of round 1 say.

## Wrong or impossible in the brief

- The spec.md ASCII gate command names a `bin` directory that does not exist in `tools/oculus`: `find` errors on it (`bfs: error: bin: No such file or directory.`), the `perl` check prints nothing and the command exits 0, so it checks nothing there. I ran it with `bin` dropped, and the checks.sh line `! LC_ALL=C grep -rna '[^ -~]' src tests` also passes.
- `package.json` and `package-lock.json` will conflict textually with step X3d, whose `package.json` has `perfect-debounce` directly before `seti-ui`. Resolve by dropping `perfect-debounce` and keeping `seti-ui` and `lodash-es`.
- The looks of case 1 and of the browser halves of cases 18, 19, 26 and 28 are for landing; I cannot run them.

## Repair round 1

Eight rulings of `agents/briefs/Q109-round1.md`, each with what changed. For a change of behaviour the failing run is the run of the new test on the code before this round's change.

**Ruling 1 (Proof 1).** `tests/server/root/watch/probe.ts:306`, in `holdsQuietAndMaxWait`, the test is now ``it(`runs one ${what} for each event when the quiet is 0`, ...)``. `what` is the unit word each file passes, so the five files read `runs one rebuild ...` (usage, portfolio), `runs one message ...` (bookmarks), `runs one call ...` (local) and `runs one publish ...` (sessions); the ruling's wording is the usage and portfolio one, and the other three keep their own unit as every sibling test in the helper does. The test asserts what it did, so no behaviour changed; `npx vitest run tests/server/root/watch tests/server/machine/usage --reporter=verbose` lists the five names above, all passing.

**Ruling 2 (Proof 2).** The section "The tests named `audits that ...`, sorted into audits and proofs" above gives 16 tests, 14 proofs and 2 audits, one line each, with the mutation that decides it. `audits that no option change resizes the grid` is an audit: an `OptionsTarget` has no `resize`, and that the config effect sends no resize rests on the reading of `TerminalGrid.svelte:438-444`. The sort also found that the bar's wiring in `Terminal.svelte` (`menu={...}` and `onpick={...}`) and in `TerminalTitle.svelte` (`read={menu}`, `own`) is not covered: with `menu={() => []}`, with `onpick={() => undefined}`, with `read={() => []}` and with `own` removed, `npx vitest run tests/views/sessions` fails no test (0 failing, rc 0 for each). That wiring is what the looks of cases 18 to 21 check.

**Ruling 3 (Proof 3).** `src/lib/state/shared/words/appearance.ts:78` is now one module binding, `let terminal: { fontPx: number | null; options: TerminalOptions } = { fontPx: null, options: {} };`, written only by `setAppearance` (line 168: `terminal = { fontPx: readTerminalFont(config), options: readTerminalOptions(config) };`). `terminalFontPx()` (line 232) and `terminalOptions()` (line 238) read from it and keep their names and shapes; `terminalFont` and `terminalSettings` no longer exist. `tests/checks/tree/boundaries.test.ts:277` holds the one entry `lib/state/shared/words/appearance.ts:terminal`, in place of `terminalFont` and `terminalSettings`. The FROZEN entry is needed: with the line removed, the check fails with `lib/state/shared/words/appearance.ts holds module-level state in terminal` (`Tests  1 failed | 10 passed (11)`, scratch copy). `tests/ui/theme`, `tests/state/shared` and the boundaries test pass (`Test Files  9 passed (9)`, `Tests  111 passed (111)`).

**Ruling 4 (Proof 4).** The first-run section above names the tests of each case, case 5's `posts the grid size again when it changed while the resize was out, and asks after that` among them, and quotes the failure line of each from the first run.

**Ruling 5 (Standards 1).** `DESIGN.md:361` now reads `as they are once the page's resize has answered; after `RESIZE_WAIT` (2 s) with no answer the channel is asked for anyway, and the first lines can land at the old height (`subscribePty` ...`. Proof: `grep -o "as they are once the page's resize has answered[^(]*" DESIGN.md` prints the clause.

**Ruling 6 (Standards 2).** `config/catalogs/options.yml:29`, `terminal.copy_on_selection`, now ends `false copies only when asked: Copy, Copy as HTML or the copy key. A value that is not true or false counts as false.` The scalar is single-quoted, since a colon followed by a space ends a plain YAML scalar; the options catalog check and `tests/checks/config` pass (`Test Files  29 passed | 2 skipped (31)` for `npm run test:checks`).

**Ruling 7 (Standards 3).** `DESIGN.md:116` now opens `Each channel has one watcher module that owns its `fs.watch` handles, rebuilds only what changed, and pushes.`, says `The usage, bookmarks, portfolio, local and sessions watchers debounce with lodash's `debounce` and a `maxWait` of twice the quiet ...`, and the git sentence reads `Git does not debounce: it watches each workspace's `.git/index` and worktree and throttles per root, reading at once on the first event after a quiet period and once more at the end of the next two seconds when events came in them (`touch` of `server/root/watch/git.ts`), so it re-reads on change no more often than every two seconds.` `server/root/watch/git.ts:231-234` is the throttle's doc comment and `touch`.

**Ruling 8 (Behaviour 1).** `src/lib/server/machine/usage/watch.ts:80-125`: `refresh` keeps `running` and `waiting`. With none running it starts a rebuild; while one runs it creates one rebuild that starts when the running one has ended (`waiting = running.then(after, after)`), and every refresh in the meantime returns that same promise. `closed` and `build` are as before. The head comment (lines 5 to 10), the `DESIGN.md:116` clause and the before and after of the usage channel above say so.

The tests are in `tests/server/machine/usage/watch.test.ts:154-200`, describe `the usage watcher under a fold slower than the maximum wait`:
- `leaves at most one rebuild waiting behind the fold, and publishes the last change's data`: a fold the test releases, events every 100 ms for 5 * `USAGE_MAX_WAIT`, then `USAGE_DEBOUNCE` more; the start-up fold stays unreleased; after releasing repeatedly the fold was called twice, twice published, and the second `builtAt` is not before the last write.
- `hands every refresh that arrives while a fold runs the one rebuild that waits`: two `refresh()` calls while the start-up fold runs return the same promise, and the fold is called twice in all.

Run on the code before this round's change (`npx vitest run tests/server/machine/usage/watch.test.ts --testTimeout 0`, the tests in the form above):

```
     x leaves at most one rebuild waiting behind the fold, and publishes the last change's data 5ms
     x hands every refresh that arrives while a fold runs the one rebuild that waits 1ms
------- Failed Tests 2 -------
AssertionError: expected 6 to be 2 // Object.is equality
 > tests/server/machine/usage/watch.test.ts:180:30
AssertionError: expected Promise{...} to be Promise{...} // Object.is equality
Compared values have no visual difference.
 > tests/server/machine/usage/watch.test.ts:192:35
 Test Files  1 failed (1)
      Tests  2 failed | 9 passed (11)
```

(`expected 6 to be 2` is six fold calls where two are expected: the start-up rebuild and the one that waits; the second test's two promises were different objects.) After the change, `npx vitest run tests/server/machine/usage --testTimeout 0`:

```
 Test Files  3 passed (3)
      Tests  58 passed (58)
```

