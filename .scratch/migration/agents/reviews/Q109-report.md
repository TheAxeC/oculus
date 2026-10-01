Everything in the brief is done except the looks: case 1 and the browser halves of cases 18, 19, 26 and 28 are not run, because they need a browser on the dev server and ports 8787 and 8790 are forbidden to me. Every other row of the brief, the five docs lines and all 30 cases are done and checked below.

## Open items of the state file (lines 120 to 125 of `.scratch/migration/orchestrator-state.md`, verbatim)

## Open items (only what Axel must rule on; every report opens with this list verbatim and repeats it until he has ruled)

An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is booked as its own step in `plan.md` and carried in the Booked section below, since it needs no ruling from him.

- Z138 (raised 2026-10-01 03:36, step X3d, its builder's open item A). Your ruling of 2026-09-25 says Seti's own table and colours, and X3d's round-0 ruling 4 draws them as `--seti-*` tokens set to `seti-ui`'s `ui-variables.less` values in every theme. Its premise that one set serves every theme is wrong: VS Code's Seti theme carries a `light` set (238 extension, 98 filename and 82 language entries; the default file icon `#d4d7d6` dark, `#bfc2c1` light), and on oculus's light panel Seti's own colours measure a contrast of 1.45 for white, 1.73 for yellow (every `.json`) and 2.13 for green (the builder's report, `agents/reviews/X3d-report.md`). (1) Keep Seti's colours in every theme. For: your ruling's words exactly. Against: icons on the light themes are hard to see, `.json` worst. (2) Copy VS Code's light values. For: what VS Code shows. Against: breaks the brief's rule that no VS Code hex is copied. (3) Keep Seti's values on the dark themes and set each `--seti-*` token on the light themes to a darker value derived from the same colour in `themes/derive.ts`, as other light tokens are derived. For: Seti's colours where they were made for, readable icons everywhere, no copied hex. Against: the light theme's icon colours are oculus's, not Seti's. Recommendation: (3). The lazy option is (1). What waits: only the light-theme colours of X3d's icons; X3d's review runs meanwhile, and the ruling goes into its repair round or its landing.

## The cases' first run on the unchanged tree

The final-form tests were run before any source change (`npx vitest run ...`, output of the whole run: 51 failing, 462 passing, 513 tests, 10 files failing). The five watcher test files were run in a scratch copy of the unchanged tree with constants-only shims, since `MAX_WAIT` and `USAGE_MAX_WAIT` do not exist there. None of the brief's rules got a case wrong.

| Case | First run on the unchanged tree |
|---|---|
| 1 look | not run (browser, forbidden ports) |
| 2 | FAIL: `resizes the window to the grid before it asks for the channel` |
| 3 | PASS before and after; fails against the mutation that subscribes only when the resize is ok (expected [] to deeply equal [subscribe]) |
| 4, 5, 6 | FAIL: `asks for the channel at RESIZE_WAIT when the resize never answers`, `asks for nothing when the listener is taken off before the resize answered`, `stops handing them over, and stops asking for the channel on a reconnect` |
| 7 | FAIL: the second-subscribe and the remount tests |
| 8 | FAIL: the hold and the drop tests |
| 9 | reading: unchanged `TerminalGrid.svelte` line 371 `subscribePty`, line 377 `resized(wanted)` |
| 10 to 12 | FAIL: `published in -1 ms` (no maxWait in the unchanged watchers) |
| 13 | FAIL for usage (100, 450), bookmarks (100, 450), local (100, 180), portfolio (100, 180), sessions (100, 450): the first call came at -1 ms, the bound is N |
| 14, 15, 16 | PASS before and after |
| 17 | the injected-quiet cases PASS before and after |
| 18 | items test passes before (`terminalRowMenu` existed); bar-markup test FAILS before (expected '' to contain 'data-context-menu-trigger') |
| 19 to 21 | FAIL: routing tests, `routePick` is not a function |
| 22 to 25 | FAIL: `terminalOptions` is not a function; `tones.test.ts` carries five keys not eleven |
| 26 to 28 | FAIL: the functions are absent |
| 29 | red (four `has no catalog entry` lines for terminal.mac_option_is_meta, copy_on_selection, cursor_style, cursor_blinking), then green |
| 30 | before: `perfect-debounce` in five watcher files and in package.json, `npm ls perfect-debounce` shows perfect-debounce@2.1.0; after: greps empty and `npm ls perfect-debounce` prints `(empty)` |

The tests for the extracted `ownedElsewhere` and `bellMark` fail on the unchanged tree only because those functions are new.

The failing files of that run, from `grep -E '^ FAIL '` on its output (count of failing tests per file): usage/watch 2, bookmarks 2, local 2, portfolio 2, sessions 7, terminals 10, tones 1, theme 7, terminal-menu 7, terminal 11, which is 51.

## Result table (DONE / NOT DONE)

| Row | State | Proof |
|---|---|---|
| 1 `subscribePty(id, size, onBytes)` resizes first, `RESIZE_WAIT = 2000`, input held | DONE | tests/state/sessions/terminals.test.ts (10 cases, red on the unchanged tree, green now); `npm test` |
| 2 lodash-es `debounce` with `maxWait` in the five watchers, `perfect-debounce` removed, `MAX_WAIT` and `USAGE_MAX_WAIT` exported | DONE | five watcher test files; `grep -rn perfect-debounce src tests package.json` prints nothing; `npm ls perfect-debounce` prints `(empty)` |
| 3 right-click row menu on the bar name of a sole terminal, one `routePick` | DONE except the browser half of the look | tests/views/sessions/terminal-menu.test.ts, terminal.test.ts |
| 4 four `terminal:` keys, `terminalOptions()`, `followTerminalOptions`, copy on selection, catalog entries | DONE except the browser half of the look | tests/ui/theme/theme.test.ts, tests/views/sessions/terminal.test.ts, the options catalog check in `npm run test:checks` |
| 5 docs DESIGN.md:116, README.md:13, HELP.md:127, HELP.md:221 | DONE | `sed -n Np` of each line; `tests/views/system/help.test.ts` passes inside `npm test` |
| Case 1 and the browser halves of 18, 19, 26, 28 (looks) | NOT DONE | need a browser on a dev server; ports 8787 and 8790 are forbidden to me |

The final verification, `sh ~/.claude/skills/land/templates/checks.sh .scratch/migration/orchestrator-state.md`, run after the last `npm run diagrams` (output lines kept verbatim):

```
$ npm test
 Test Files  355 passed | 20 skipped (375)
      Tests  5553 passed | 580 skipped (6133)
$ npm run test:checks
 Test Files  29 passed | 2 skipped (31)
      Tests  438 passed | 9 skipped (447)
$ npm run check
1790824770859 COMPLETED 2809 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build
$ npm run format:check
All matched files use Prettier code style!
$ npm run lint
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 7 commands passed
rc=0
```

Also run: the spec.md ASCII gate with `bin` dropped (`LC_ALL=C perl -ne ... $(find src tests config -type f ! -name local.yml)`) prints 0 lines (`| wc -l` gives 0); `sh utils/folder-check.sh` rc=0. File counts: `src/lib/state/sessions/terminal` 8 items; `tests/views/sessions`, `tests/server/root/watch`, `tests/state/sessions` 10 items each (no new file in them). `grep -rn perfect-debounce src tests package.json` prints nothing. `package.json` line 69 `lodash-es` ^4.18.1, line 26 `@types/lodash-es` ^4.17.12.

What the green does not cover: the looks (case 1 and the browser halves of 18, 19, 26, 28); the behaviour against a real tmux server and a real browser clipboard.

## Files, with line counts (`wc -l`)

- 129 src/lib/state/sessions/terminal/pty-subscribe.ts (new)
- 899 src/lib/state/sessions/terminals.svelte.ts
- 268 src/lib/state/shared/words/appearance.ts
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
- 164 src/lib/server/machine/usage/watch.ts
- 70 config/appearance.yml
- 613 config/catalogs/options.yml
- 26 config/text/views/system/config.yml
- 418 DESIGN.md
- 36 README.md
- 302 HELP.md
- 85 package.json (and package-lock.json)
- 412 tests/server/root/watch/probe.ts
- 133 tests/server/root/watch/local.test.ts
- 209 tests/server/root/watch/bookmarks.test.ts
- 848 tests/server/root/watch/portfolio.test.ts
- 694 tests/server/root/watch/sessions.test.ts
- 172 tests/server/machine/usage/watch.test.ts
- 747 tests/state/sessions/terminals.test.ts
- 490 tests/views/sessions/terminal-menu.test.ts
- 813 tests/views/sessions/terminal.test.ts
- 363 tests/ui/theme/theme.test.ts
- 284 tests/state/shared/words/tones.test.ts
- 606 tests/checks/tree/boundaries.test.ts
- docs/diagrams/layer-views.{dot,svg} and layers.{dot,svg}: regenerated by `npm run diagrams`

## Judgment calls the brief left open

- New module `src/lib/state/sessions/terminal/pty-subscribe.ts` holds the ordering (`createPtyOrder`, `RESIZE_WAIT`), because `terminals.svelte.ts` stands at 899 of 900 lines. `RESIZE_WAIT` is defined there and re-exported from the store.
- Held input goes to the newest live waiting subscription of the terminal and is dropped for a listener taken off while it waits.
- With two grids on one terminal id, the first grid's subscribe is sent between the two resizes, and the second grid's `socket.subscribe` is a deduplicated no-op, since the socket dedupes channels. The second resize still posts after the first answered.
- `TerminalListProps` loses six callbacks (`onsplit`, `onrename`, `onicon`, `oncolor`, `onclear`, `onkill`) and takes one `handlers: PickHandlers`, so a row and the bar call the same `routePick`.
- `TerminalTitle.svelte`'s `ContextMenu` is `own`, so a right-click on the bar name does not open an outer menu.
- `followTerminalOptions` returns an unset key to xterm's defaults (block, no blinking, no Option as Meta).
- The 540-line component limit forced three extractions, each with tests: `ownedElsewhere` and `bellMark` (terminal-list.ts) and `pageClipboard` (grid-actions.ts).
- `tests/server/root/watch/probe.ts` is widened beyond the brief's paths: the helper `holdsQuietAndMaxWait` serves the five watcher test files, and the synthetic hub fixtures moved from portfolio.test.ts so the duplication check holds. It takes `it` from `tests/fixtures/scratch.ts` because it takes a scratch directory.
- `tests/checks/tree/boundaries.test.ts` gets one line in the FROZEN module-state list (`lib/state/shared/words/appearance.ts:terminalSettings`, line 278), the same class as `terminalFont`. The brief does not name that file; the orchestrator should read it.
- `config/text/views/system/config.yml` `desc_appearance` is changed, because `tests/views/system/help.test.ts` (lines 329 to 334) requires HELP.md to contain the catalog text and the brief names only HELP.md.
- `DESIGN.md` lines 264 and 361 are updated beside the named line 116, since they described the old debounce and the old subscribe order.
- The non-rendering cases under `tests/views` are named `audits that ...`, which `tests/checks` (audits.test.ts) requires.
- `package-lock.json` carries `@types/lodash` transitively through `@types/lodash-es`.

## Host and user-visible changes, before and after

- Moving or remounting a terminal pane: before, the client subscribed and then resized, so the scrollback arrived at the old size and rows under the cursor could be blank; now the window is resized to the grid first and the subscribe follows when the resize answers, or after `RESIZE_WAIT` (2000 ms) when it does not.
- Keys typed during that round trip: before, they went to the socket at once; now they are held and written right after the subscribe, in order.
- The five watcher channels under continuous writes: before, a file written without a pause was never rebuilt until the writes stopped; now it is rebuilt at least every `maxWait` (sessions 1000 ms, bookmarks 1000 ms, usage 1000 ms, portfolio 400 ms, local 400 ms).
- Right-click on the bar name of a sole terminal: before, nothing or the browser menu; now the same row menu as a list row.
- Four configurable terminal keys in `config/appearance.yml` (`mac_option_is_meta`, `copy_on_selection`, `cursor_style`, `cursor_blinking`) follow a config change without a reload or a resize.
- Copy in the terminal menu with a missing or refusing clipboard: before, it could throw; now it does nothing.
- HELP.md, DESIGN.md and README.md text changed on the lines the brief names.

## Wrong or impossible in the brief

- The spec.md ASCII gate command names a `bin` directory that does not exist in `tools/oculus`: `find` errors on it, the `perl` check prints nothing and the command exits 0, so it checks nothing there. The checks.sh line `! LC_ALL=C grep -rna '[^ -~]' src tests` is the effective ASCII check and passes.
- `package.json` and `package-lock.json` will conflict textually with step X3d, whose `package.json` has `perfect-debounce` directly before `seti-ui`. Resolve by dropping `perfect-debounce` and keeping `seti-ui` and `lodash-es`.
- The looks of case 1 and of the browser halves of cases 18, 19, 26 and 28 are for landing; I cannot run them.
