# Q109 brief check

Brief check of Q109 (`tools/oculus/.scratch/migration/agents/briefs/Q109.md`), read on main at 540d460e (`git rev-parse --short HEAD` printed `540d460e`). I changed nothing in the repository. The es-toolkit and lodash-es tarballs and the simulation scripts sat in `$TMPDIR/q109bc`, which I have removed (`ls -d "$TMPDIR/q109bc"` printed "No such file or directory").

The most serious finding comes first, because it decides whether the step can be built as briefed.

**Blocking finding.** The library ruled by Z136 (a), `es-toolkit/compat`'s `debounce` with `maxWait`, does not meet the bound that cases 5, 6, 7 and 10 assert. Its maximum wait is checked only when the debounced function is called. Nothing fires on a timer at `maxWait`. As a result:
- Under steady writes, the rebuild runs on the first event at or after `pendingAt + maxWait`, so a change can wait up to `maxWait` plus one writer interval.
- At writes every 450 ms, with a terminal started 2 s in, the shell is published 1150 ms after the start, which is more than `MAX_WAIT` (1000). Case 5's 450 ms test fails with the library the brief prescribes.
- `lodash-es` 4.18.1 fires exactly every 1000 ms under the same input.

The evidence is under "es-toolkit's debounce" below. This is a ruling's premise found wrong, so the orchestrator decides. The options are:
- (a) `lodash-es`. It meets the bound.
- (b) The hand-written cap from the diagnosis. It meets the bound.
- (c) Keep es-toolkit and widen the bound to `maxWait` plus the quiet. That loosens a check, which the rules file forbids, so it is the lazy option.

## 1. Names

Command: `grep -rIn --exclude-dir=node_modules --exclude-dir=.svelte-kit --exclude-dir=build --exclude-dir=.git --exclude=local.yml -e perfect-debounce -e es-toolkit .` from the hub root. A second grep for `subscribePty|gridOptions|rowPicked|terminalRowMenu` over `tools/` and `.agents`. A third for `cursor_style|mac_option_is_meta|copy_on_selection|cursor_blinking|MAX_WAIT|maxWait|terminalOptions` and `-w DEBOUNCE|USAGE_DEBOUNCE` over `tools/oculus`. The new keys, `MAX_WAIT`, `maxWait` and `terminalOptions` have no hits anywhere today.

Hits outside "Paths this step writes", or inside a path but not named by the brief:
- **`tests/state/shared/words/tones.test.ts:224`**: `expect(vocab.terminal).toEqual({ font_px: 12.5 });`.
  - Made false: adding the four keys under `terminal:` fails this test.
  - It sits under the listed folder `tests/state/shared/`, but the brief describes that entry as "the test file of appearance.ts". It does not name this test, and does not say the test will go red.
- **`tests/ui/theme/theme.test.ts:201-212`** (`describe('terminalFontPx')`): this is where the existing tests of the `terminal:` reader live.
  - Not made false.
  - It is outside the paths list. The brief sends the reader tests to `tests/state/shared/` ("new or existing"), so the natural home of the four keys' reader tests is not writable.
- **`tests/views/sessions/terminal.test.ts:433`, `:442`**: `gridOptions(gridLook(), 14)` and `gridOptions(gridLook(), undefined)`.
  - Made false by item 4's new parameter, unless it is optional.
  - The folder is in the paths list.
- **`tests/ui/menu/menu-words.test.ts:33`, `:81`, `:117`** (`terminalRowMenu`): the signature is unchanged. Not made false.
- **`HELP.md:127`** (the `terminal` view row): it lists every terminal right-click menu (grid, list row, list empty area) and says "a tab showing its only terminal names it on the bar instead".
  - Made incomplete: it will not mention the bar's new right-click menu, and it is the page a reader uses to find menus.
  - Outside the paths list, which allows only `HELP.md` line 221.
- **`DESIGN.md:116`**: besides the library name, the sentence says "handed a function that starts the rebuild and returns, so an async rebuild never shortens the wait". That reason holds only for perfect-debounce's handling of promises; es-toolkit's `debounce` ignores a returned promise.
  - Made false or moot.
  - Line 116 is in the paths list, but item 5 asks only for the name to be swapped and one sentence added.
- **`src/lib/server/machine/usage/watch.ts:5-7`** (head comment): "The debounce is perfect-debounce's, handed a function that starts the rebuild and returns at once: handed the rebuild's promise, it would run the next rebuild without the wait while one is still pending".
  - Made false.
  - In the paths list, but item 2 only says to name the library and the maximum wait.
- **`DESIGN.md:361`**: "lands right once the page's grid and the pane are the same height, as they are after the page's resize reached tmux". This becomes true with item 1. Not made false.
- **Head comments of `portfolio.ts:1-20` and `bookmarks.ts:1-24`**: neither names `perfect-debounce` or "the quiet". The brief's premise "each of the five names `perfect-debounce` or 'the quiet'" is false for these two. Only `sessions.ts:7`, `usage/watch.ts:5` and `local.ts:9` do. `bookmarks.ts:34` names the quiet in the doc comment of `DEBOUNCE`, not in the head.
- **`tests/server/root/watch/local.test.ts:26` and `bookmarks.test.ts:28`**: each declares its own `const DEBOUNCE = 50`.
  - Not made false.
  - But it collides with importing the module's `DEBOUNCE`/`MAX_WAIT`, which the brief's "at the module's own constants" requires.
  - `portfolio.ts:73` and `local.ts:22` do not export `DEBOUNCE` (`const DEBOUNCE = 200`).
- **The X3d worktree, which is in flight** (`.agents/worktrees/X3d`, `git diff HEAD -- tools/oculus/package.json`): it adds `"seti-ui": "1.11.0",` on the line right after `"perfect-debounce": "^2.1.0",`. Its diff also touches `package-lock.json`, `DESIGN.md` and `HELP.md` (`git diff --name-only HEAD`).
  - Q109 removes that `package.json` line and rewrites the lock file. The `package.json` hunks are adjacent, and the lock files will conflict at cherry-pick.
  - The `DESIGN.md` and `HELP.md` hunks of X3d (lines 112 to 405 in `git diff -U0`) do not touch 116, 127 or 221.
  - The brief records no shared paths with X3d.
- **The other `perfect-debounce` hits**:
  - Under `.scratch/`: `plan.md`, `choices.md`, `orchestrator-state.md`, older briefs and reviews. These are records, not made false.
  - `package-lock.json:44`, `:4207`, `:4209`: in the paths list.

## 2. The step line

Each part of the plan's line, Step 0 lines and rulings, mapped to "What to build":
- **"name, icon and colour drawn once set"** (Z101 (a), diagnosis 1): no item, deliberately. The brief says nothing is built and the look confirms it.
  - The line's "a test each" for this part rests on the test 874a27b4 added (`git show 874a27b4` adds "tells its listeners when a title, an icon or a colour was set" to `tests/server/machine/pty/channel.test.ts`).
  - Reading it, it fails with the old `${id}:${name}` signature. It has not been run against that signature, and the brief does not ask for it.
- **"its lines after its tab moves pane"** (Z101 (a), diagnosis 2): item 1, cases 1 to 4.
- **"a sole terminal's bar name gets the row's `terminalRowMenu`"** (ruling Q109 rename): item 3, cases 12 to 15.
- **"the four keys Option as Meta, copy on selection, cursor shape and blink (D30)"**:
  - Z82 (a), keys beside `font_px`, and Z137 (a), VS Code's names: item 4, cases 16 to 21.
  - D30's "each defaulting to today's behaviour": item 4 and case 16.
  - D30's "with their controls in the Settings view": no item builds a Settings control. The brief points to the catalog entry's `control`, which S3c draws, and the premise correction is booked at `plan.md:295`.
  - That is consistent with Axel's Z94 (4) (b). But D30 is fully delivered only when S3c lands, and nothing in S3c's line names these keys. No S3c brief exists: `ls agents/briefs | grep S3` lists `S3.md`, `S3a*`, `S3b.md`.
  - The correction is booked only as a Step 0 line, not as an open item in the state file (`grep -n "D30\|Settings view\|S3c" orchestrator-state.md` shows none for it).
- **Z134 (a)**, the sessions list held back: item 2, cases 5 to 9 and 11.
- **Z135 (a)**, one cap in all five watchers with a test each: item 2 and case 10.
- **Z136 (a)**, `es-toolkit/compat` `debounce` with `maxWait` and perfect-debounce removed: item 2, item 5 and case 22. The ruling's premise does not hold; see the blocking finding above.
- **"a test each"**: items 1 to 4 and the cases.
- **D30's line itself**: `plan.md:395` says D30's line is "kept whole in `agents/briefs/Q109.md`". The brief quotes only the fragment "with their controls in the Settings view". The whole line (recovered with `git log -p -S"- D30"`) is not in the brief.

A part with no item: the Settings control of D30, as above.

## 3. Premises

Commands: `sed -n` and `grep -n` on each cited file, and `npm ls perfect-debounce es-toolkit`.

Hold as stated:
- `TerminalGrid.svelte:371-377`: `subscribePty(wanted, ...)` at 371, then `resized(wanted)` at 377.
- `channel.ts:542-590`: `#attach` from 542, closing brace at 590.
- `sessions.ts:461-468`: `screenAt`.
- `routes.ts:536-545`: the resize route awaits `resizeTerminal` and then answers.
- `pty-io.ts:50`: the catch that makes `postTerminal` never reject.
- `subscribePty` declared at `terminals.svelte.ts:175` and defined at `:827`. Its callers are at `TerminalGrid.svelte:371` and `terminals.test.ts:353`, `:373`, `:381`, `:392`: three tests, four calls.
- `TerminalTitle.svelte` is 91 lines (`wc -l`), drawn at `Terminal.svelte:343-351`.
- `TerminalList.svelte:299-303` and `rowPicked` at 165-175.
- `terminal-list.ts:403` is `terminalRowMenu`.
- In `Terminal.svelte`: `others` at :147, `arming` at :170, `splitOn` at :235.
- `config/catalogs/options.yml:20-23`.
- The control counts: choice 6, list 7, number 34, text 35, toggle 5 (`grep -n "control:"`).
- `gridOptions` at `grid-look.ts:55-58`.
- `grep -rn "onSelectionChange\|cursorBlink\|cursorStyle\|macOptionIsMeta" src` exits 1.
- `xterm.d.ts:63`, `:68`, `:186`. Defaults in `lib/xterm.mjs`: `cursorBlink:!1,cursorStyle:"block"`, `macOptionIsMeta:!1`.
- The five `perfect-debounce` importers, at the lines and constants given, each with `queued.cancel()` on close.
- `package.json:76`, `DESIGN.md:116`, `README.md:13`, `HELP.md:221`.
- `perfect-debounce` is only a direct dependency (`npm ls` printed `perfect-debounce@2.1.0` under oculus only).
- 874a27b4 touched `channel.ts` and `channel.test.ts` (`git show --stat`).

Small drift:
- `config/appearance.yml:28-31` is `29-32`: `terminal:` at 31, `font_px` at 32.
- `readTerminalFont` is at 80-83, not 80-84.

**Wrong.** "A config change reaches a mounted grid through the effect at `TerminalGrid.svelte:416-450`, which today sets `fontSize`." The effect starts at 419; 416 is the end of the mount effect.
- In its body it reads, synchronously, only `theme()`, `terminalFont()`, `textScale()` and `id`.
- `terminalFont()` is the browser's own ui store value (`ui.svelte.ts:217-219`, `store.current.terminalFont`), not the config.
- The config's `font_px` is read by `gridFontSize` (`terminal-list.ts:112`, `terminalFontPx()`, which calls `configGeneration()`). That call is inside the `scheduleReflow` frame callback (`reflow.ts`: `frame(() => { if (update()) ... })`), where the effect does not track it.
- So a change to `config/appearance.yml` alone does not re-run that effect today. A builder told to set the four options "as it sets `fontSize`" would write options that never follow a config push.
- The effect has to read the new options (and `configGeneration`) in its body, or in an effect of its own.

**Wrong.** "Each has its module head comment explain the wait (each of the five names perfect-debounce or 'the quiet')": false for `portfolio.ts` and `bookmarks.ts`, as in check 1.

**Folder count.** `tests/views/sessions` already holds 10 items (`ls -A | wc -l`), the ten-item limit (`utils/folder-check.sh`). The paths entry "(the test files of terminal-list.ts and grid-look.ts, new or existing)" allows a new file there, which would break the tree check. `tests/server/root/watch` and `tests/state/sessions` are also at 10.

**Diagnosis 3's quoted test** (`Q109-diagnosis.md:919-921`) fakes `['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval']`, not `Date`. Every existing watcher test that fakes timers does the same (`grep -n useFakeTimers`: sessions:497, portfolio:501, bookmarks:171, local:79, usage:82/98). es-toolkit's `maxWait` reads `Date.now()`. With `Date` real, a simulation of calls every 100 ms for 20000 fake ms gave `fires []`. The brief tells the builder to build those tests "with es-toolkit in place of the hand-written cap" and never says `Date` must be faked.

**ADR premise**: holds (check 7).

## 4. Cases against the rules file

- **Case 5**: inconsistent with the library the brief prescribes. Its 450 ms row cannot pass with `es-toolkit/compat` (1150 ms against a 1000 ms bound). Passing it would need the bound loosened, which `spec.md:16` and `:54` forbid. Its note "fails on the unchanged tree: not within 20000 ms" also describes the red command, not this test, which polls only to 1000 ms.
- **Case 8**: "passes before and after", so under verify item 5 it is an audit. It runs on a fresh debounce and cannot see that, after a stretch ended by the `maxWait` path, es-toolkit gives a later burst two rebuilds (evidence below).
- **Case 9**: "Test or reading". A reading is no test (`spec.md:56`).
- **Case 11**: "the existing close cases, kept". None of those cases reaches the capped path: they fake only `setTimeout`/`clearTimeout`, and their bursts stay inside one quiet (`tests/server/root/watch/probe.ts:83-109`). It does not exercise "after close" for the capped wait (`spec.md:59`), so it would not fail if that risk were real (`spec.md:17`).
- **Case 20**: "Reading of the effect; the look". Given the premise error above, a reading against "as it sets `fontSize`" would accept an effect that does not track the config.
- **Case 21**: a test of the catalog check's own behaviour, which exists already (`options-catalog.test.ts:128`, "an option and an entry that do not match"). It passes on the unchanged tree, so it is an audit. The shipped-tree case at `:110` is what fails without an entry.
- **`spec.md:59`, keys**: the four keys are not exercised empty, duplicated or colliding. The cases have absent (16), wrong type (18) and unknown value (17), but no `cursor_style: ""`, no null, no duplicate key in the YAML, and no `terminal:` that is not a map.
- **`spec.md:59`, asynchronous paths**: `subscribePty`'s resize is exercised in flight (case 2) and after close (case 4), but not superseded by a later one.
- **`spec.md:48`** says a value that has a config key is never given a fallback in code beside it. Item 4 and decision 4 give the four keys code-side defaults (`false`, `block`) for wrong types.
  - The tree already does this for `wallpaper.themes` and `code_theme`, so this may be acceptable.
  - The brief does not reconcile it with the rule. Leaving the xterm option unset for an absent or wrong value would keep the only default in `appearance.yml` and xterm.

## 5. Could this pass without the goal being reached?

- **Item 1 tests and cases 2 to 4**: yes. They test the store's order (resize, then subscribe) and nothing else. The grid could pass `term.cols`/`term.rows` before `fit.fit()` (xterm's 80x24) and they would still pass. Only the look at landing, on the shrunk case from `Q109-diagnosis.md:365-368`, gates the goal. That means a Terminal tab beside other tabs, moved by "Split tab downwards".
- **Case 1**: only through the look. That is acceptable, but the look must reproduce that exact move. A Terminal tab alone in its pane is not moved (diagnosis run red1, green).
- **Item 2 and cases 5 to 7, 10**: with es-toolkit and `Date` faked, cases 6, 7 and 10 at 100 ms pass, because 100 divides every `maxWait`, yet the stated bound is not met at other intervals.
  - 150 ms writes with quiet 200 and maxWait 400 gave gaps up to 450.
  - 450 ms writes with quiet 500 and maxWait 1000 gave gaps up to 1350.
  - So the 100 ms tests can pass while a watcher still publishes later than its `maxWait`. The goal of publishing while written often is mostly reached, but the bound is not. Case 5's 450 ms row is the only one that exposes it, and it fails.
- **Case 8**: yes, as above (an audit).
- **Case 11**: yes, as above.
- **Case 22**: no. A grep and `npm ls` decide it.
- **Item 3 and cases 12 to 15**: the tests of the pure routing function pass even if `TerminalTitle.svelte` gets no `ContextMenu`. The bar's right-click and the browser menu not opening are left to the look, which is the only gate for Axel's "I just get chrome right click".
- **Item 4 and cases 16 to 19**: the reader and `gridOptions` tests pass whether or not a mounted grid follows a config change, and whether or not copy on selection is attached at mount. Case 20, a reading, is the only check of the former; the look is the only check of the latter.
- **Case 21**: yes, an audit (check 4).
- **Item 5 (docs)**: the grep in verify item 3 passes even if `DESIGN.md:116` keeps the stale perfect-debounce reason and `usage/watch.ts:5-7` keeps its false comment (check 1).
- **Diagnosis 1**: rests on the look and on the 874a27b4 test (check 2).

## 6. Implied inputs

Each is missing from "Cases" unless marked otherwise.

1. **An injected quiet of 0.** Expected: the brief says `maxWait` is "one exported constant", so it should be the module's constant, not twice the injected quiet.
   - If it were derived as `2 * 0`, es-toolkit runs the function synchronously on every call: simulated quiet 0 / maxWait 0 gave `[1,1,2]`, and quiet 100 / maxWait 0 gave `[1,10,20]`. A burst no longer coalesces.
   - The brief does not say which. A negative wait is reachable only from tests.
2. **An injected quiet larger than the module's `maxWait`.** `local.test.ts:64` runs `watchLocal` with `debounce: quiet` = 1500, while local's `MAX_WAIT` would be 400.
   - es-toolkit does not raise `maxWait` to the wait the way lodash does: simulated quiet 500 / maxWait 200 fired every ~200.
   - Expected: the brief should say whether `maxWait` is clamped to the quiet, or whether the options take a `maxWait`.
3. **Fake timers without `Date`.** The new tests must fake `Date`, or es-toolkit never reaches `maxWait`. Not stated.
4. **A grid of 0 columns at mount** (a hidden or zero-size pane). `fit.fit()` changes nothing, the grid stays at xterm's 80x24, and the new `subscribePty` posts a resize to 80x24.
   - `resized()` (`TerminalGrid.svelte:229-233`) does the same today, because `measure()` returns `term.cols`/`term.rows`.
   - Expected: as today, or no resize while the element has no size. Not decided.
5. **A terminal killed while its resize is pending.** The route answers 400, `ok: false`, and the subscribe is still sent; the server's capture logs "no scrollback". Covered in part by case 3 (`ok: false`), not named.
6. **A resize whose fetch never answers.** `postTerminal` has no timeout, so the subscribe is never sent and the grid stays blank. Expected result not stated.
7. **Superseded.** A second `subscribePty` for the same id while the first's resize is pending, as in a remount or two quick moves. The first `.then` sees `listening = false`. But two HTTP resizes are in flight and can complete in either order, so the window may end at the stale size. Missing, and the rules file requires it.
8. **The pane resized while the HTTP resize is in flight.** The `ResizeObserver` sends a socket resize after 100 ms (`SETTLE`). On a fresh page the server drops it, because the sink is not attached yet (`channel.ts:478`). The window keeps the size of the first answer until the next resize. Missing.
9. **Keys typed between mount and the subscribe on a fresh page.** `inbound` drops input from a socket not yet attached (`channel.ts:478`). About 10 ms; missing.
10. **Clipboard API missing** (`navigator.clipboard` undefined in a non-secure context). `writeText` throws a `TypeError` synchronously; it does not reject a promise. Expected: nothing copied, nothing thrown. Case 19 covers only a stub that refuses.
11. **`copy_on_selection` turned on while a selection exists.** Expected, as in VS Code: nothing copied until the selection changes. Missing.
12. **Select All from the grid's menu with `copy_on_selection: true`.** Expected: the whole buffer is copied, since it is a selection change. Missing.
13. **The look effect re-run by every config push.** If the four options are read in the effect at 419-449, every push of any config file re-runs its `refit` and `resized`, which sends a socket resize. Expected: no resize unless an option changed. Missing.
14. **A sole terminal whose tab has no other Terminal tab.** No Join item. Covered by case 12's wording.
15. **Right-click on the bar while its rename field is open.** `TerminalTitle` then draws `RenameField` in the title's place. Expected result not stated.
16. **Kill armed from the bar.** Nothing disarms it on focus loss, as the list does (`TerminalList.svelte:112-118`). Only a terminal joining or leaving disarms it (`Terminal.svelte:211-218`). This matches the grid's menu, but is not stated.
17. **The empty and duplicate forms of the four keys** (`spec.md:59`): see check 4.
18. **es-toolkit's start time for `maxWait` is not reset by its own maxWait firing or by `cancel()`.**
    - A stretch of writes that ends on the call that fires `maxWait` leaves it set. A later burst then fires at once on its first event and again after the quiet: simulated `[1100,10000,10700]`, two rebuilds for one burst. A single later event fires at once with no quiet (`[1100,10000]`).
    - After `cancel()`, a later call fires at once (`[5000]`). Every watcher's `closed` guard (`sessions.ts:214`, `usage/watch.ts:99`, `portfolio.ts:405`, `bookmarks.ts:74`, `local.ts:40`) keeps a call after close from reaching it.
    - Missing, and it contradicts the brief's "a burst that ends within one quiet is still one rebuild" in that state.
19. **The `maxWait` path runs the rebuild synchronously inside the caller.**
    - The callers are the `fs.watch` callback, the terminal source's listener loop (`channel.ts:534`, after `#terminals` is set) and the sessions watcher's change listeners into the usage watcher. Reading these, this is safe.
    - Not named.
20. **A wall-clock jump.** es-toolkit's `maxWait` runs on `Date.now()`. A clock set back delays the maximum wait; a clock set forward fires it at once. Minor; not named.

## 7. ADRs

None. `ls tools/oculus/docs/adr` printed "No such file or directory", `ls tools/oculus/docs` lists only `diagrams`, and `find . -path ./node_modules -prune -o -type d -iname "adr*" -print` from the hub root printed nothing.

## es-toolkit's debounce

Commands: `npm view es-toolkit@1.52.0 version license time.modified dist.tarball` (1.52.0, MIT, released 2026-08-28T07:22:17Z; dist-tag `latest` is 1.52.0), then `npm pack es-toolkit@1.52.0` into `$TMPDIR`. I read `dist/compat/function/debounce.mjs` and `dist/function/debounce.mjs`, then ran simulations with `node:test` mock timers, with and without `Date` faked. The code that decides the behaviour:

```js
if (maxWait != null) {
    if (pendingAt === null) pendingAt = Date.now();
    if (Date.now() - pendingAt >= maxWait) {
        if (leading || trailing) result = func.apply(this, args);
        pendingAt = Date.now();
        _debounced.cancel();
        _debounced.schedule();
        return result;
    }
}
_debounced.apply(this, args);
```

`debounced.cancel = _debounced.cancel` does not reset `pendingAt`. `pendingAt` returns to null only when the trailing call runs.

The brief's three claims:
- **A burst ending within one quiet gives one call.** Holds from a fresh state: the fresh burst at 0, 100, 200 gave `[700]`. It does not hold after a stretch ended by the `maxWait` path (`[1100,10000,10700]`, item 18 above).
- **Steady calls give at most one call per `maxWait`.** Holds as an upper rate: gaps are never under `maxWait`. The bound the cases need, at least one call per `maxWait`, does not hold. Quiet 500, maxWait 1000, change at 2000:

  | Writes every | Calls ran at | Change published after |
  |---|---|---|
  | 100 ms | 1100, 2100, 3100 | 100 ms |
  | 300 ms | 1500, 2700, 3900 | 700 ms (gap 1200) |
  | 450 ms | 1800, 3150, 4500 | 1150 ms (gap 1350) |

  `lodash-es` 4.18.1 (`npm pack`, `debounce.js`) under the same input ran at 1100, 2100 (100 ms); 1300, 2300 (300 ms); 1450, 2450 (450 ms). Its latency stayed within 1000 in each case.
- **`cancel()` drops a pending call.** Holds: calls at 0 and 100, then cancel at 150, gave `[]`. It does not reset the `maxWait` start (`[5000]` for a call after cancel).

Also checked: `es-toolkit/compat` is exported (`./compat`, `./compat/*`), it has no dependencies, and it ships `debounce.d.ts` with `cancel()` and `flush()`. The `maxWait` check uses `Date.now()`, so tests must fake `Date`. With `Date` real, calls every 100 ms for 20000 fake ms gave `[]`.

## Declined to judge

- Whether VS Code's `terminal.integrated.copyOnSelection` copies on every selection change or on mouse-up. I did not read VS Code's source, so case 19's timing is not compared with VS Code.
- Whether the four catalog descriptions are true to their reader. They do not exist yet; that is the reviewer's reading.
- Whether the step's path list is disjoint from U2's. U2's worktree diff shows no overlapping file (`git diff --name-only HEAD` filtered for terminal, watch, appearance, package and doc paths printed nothing).
- Whether the shared lines with X3d merge simply. That judgment is the orchestrator's (`shared_paths:`).
- Whether 874a27b4's test fails on the old signature, by running it. I checked it by reading only; running it would mean editing a tree.
- I ran no vitest command in the repository, so as not to write caches into the main checkout. Every timing claim above comes from the node simulations quoted.

Usage: claude-opus-5-5, about 270,000 tokens, about 55 tool calls.

## Closed

Each finding closed in `agents/briefs/Q109.md` by the orchestrator before the preparation commit.

- Blocking finding (es-toolkit misses the bound): Z136 corrected in automode to (b) `lodash-es` with `@types/lodash-es` (`choices.md`, the state's closed log, `plan.md` Rulings); item 2 and "Libraries checked" rewritten; tests fake `Date`; lodash's clamp of `maxWait` to the wait stated.
- Check 1, names: `tones.test.ts`, `theme.test.ts`, `terminal.test.ts`, `terminal-menu.test.ts` and `HELP.md:127` added to the paths and the premises; `DESIGN.md:116`'s async clause and `usage/watch.ts:5-7` named in items 2 and 5; the portfolio and bookmarks head premise corrected; the tests' own `DEBOUNCE = 50` and the unexported constants handled in item 2; the X3d shared files recorded as premises and in the dispatch entry's `shared_paths`.
- Check 2, the step line: D30's whole line recovered into the premises; S3c's line names the four keys.
- Check 3, premises: line numbers corrected (`appearance.yml:29-32`, `readTerminalFont` 80-83); the look effect premise corrected (the options get an effect of their own reading `terminalOptions()`); no new test files in the three folders at the limit.
- Check 4, cases: case 5's bound now met by the library; cases 8, 9, 11 and 20 of the old list are tests (new cases 14, 15, 16, 28); case 21 is the shipped-tree check run red then green (new case 29); empty, null, duplicate and non-map forms of the keys added (cases 23 to 25); `spec.md:48` followed by leaving the xterm option unset (item 4, decision 4); the superseded subscribe added (case 7).
- Check 5, could pass without the goal: the size read after `fit.fit()` named in item 1 and case 9, with the look of case 1 on the exact move of the diagnosis; 300 and 450 ms intervals for `sessions.ts` and 0.9 times the quiet for the other four (case 13); the follow-a-config-change path tested through `followTerminalOptions` and looked at on TEST (case 28); the doc grep widened (verify 3).
- Check 6, implied inputs: 1 and 2 (module constant, lodash clamp, case 17); 3 (fake `Date`); 4 (decision 8); 5 (case 3); 6 (`RESIZE_WAIT`, case 6); 7 (case 7); 8 (case 5); 9 (held input, case 8); 10 (case 26); 11 and 12 (case 27); 13 (the options effect calls no resize, case 28); 14 (case 18); 15 and 16 (item 3); 17 (cases 23 to 25); 18 and 20 (es-toolkit not used; lodash's timer, case 14); 19 (lodash fires on its timer, outside the caller).
