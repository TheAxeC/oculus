# O39 part E refuter report

## 1. Verification lines

Every command ran from `/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O39-partE` unless another directory is named.

`npm run test:quick -- --base 200f12da` (the verify list in reviewer form):
```
test:quick: 26 changed file(s), from git since 200f12da
test:quick: 8 test file(s)
        tests/checks/tree/boundaries.test.ts: changed
        tests/server/desktop/app-theme-start.test.ts: changed
        tests/server/root/hooks-server.test.ts: changed
        tests/server/desktop/window-guard.test.ts: imports at depth 1
        tests/server/root/process/config-cache.test.ts: imports at depth 1
        tests/checks/config/config.test.ts: imports at depth 2
        tests/shell/keys/theme-rows.test.ts: imports at depth 2
        tests/state/system/settings/theme-groups.test.ts: imports at depth 2
ok      svelte-kit sync (19.8 s)
ok      prettier (19.8 s): All matched files use Prettier code style!
ok      ASCII gate (21.7 s)
ok      vitest slow (72.0 s): Duration  48.36s (transform 20.09s, setup 0ms, import 70.31s, tests 19.18s, environment 1ms)
ok      vitest checks (82.3 s): Duration  58.63s (transform 16.73s, setup 0ms, import 67.21s, tests 47.63s, environment 2ms)
ok      vitest (87.5 s): Duration  63.86s (transform 136.42s, setup 0ms, import 185.03s, tests 11.75s, environment 3ms)
ok      eslint (109.6 s)
ok      svelte-check (119.0 s): 1792703727827 COMPLETED 536 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
test:quick: 139.7 s; every command passed
```

Brief verify 2, `npx vitest run tests/server/desktop/app-theme-start.test.ts tests/server/desktop/window-guard.test.ts tests/server/desktop/attached-themes.test.ts tests/server/root/hooks-server.test.ts --reporter=verbose` (the check mark written as `<check mark>`): every row passed, the new ones among them:
```
<check mark> ... app-theme-start.test.ts > the theme a page is sent with > starts on 'the shipped config in a browser (C1)' 0ms
<check mark> ... app-theme-start.test.ts > the theme a page is sent with > starts on 'the CRT overlay on and the rice toggl...' 3ms
<check mark> ... app-theme-start.test.ts > the theme a page is sent with > starts on 'the same looks on a page that draws n...' 2ms
<check mark> ... hooks-server.test.ts > a page sent with the theme it starts on > sends 'a float window' the start the workbench gets (C6) 173ms
<check mark> ... hooks-server.test.ts > a page sent with the theme it starts on > sends 'the find page' the start the workbench gets (C6) 639ms
<check mark> ... hooks-server.test.ts > a page sent with the theme it starts on > sends 'the audience page' the start the workbench gets (C6) 401ms
<check mark> ... hooks-server.test.ts > a page sent with the theme it starts on > sends 'the print page' the start the workbench gets (C6) 415ms
<check mark> ... hooks-server.test.ts > a page sent with the theme it starts on > sends a theme whose file holds a closing tag in a colour with its block, the colour falling back (C15) 16ms
<check mark> ... hooks-server.test.ts > a page sent with the theme it starts on > reads no config and no apps for a request to an API route (C16) 8ms
 Test Files  4 passed (4)
      Tests  62 passed (62)
```

C6 rows timed in runs of their own: `npx vitest run tests/server/root/hooks-server.test.ts -t "C6" --reporter=verbose` printed 136ms, 120ms, 108ms, 115ms (`Tests  4 passed | 9 skipped (13)`). With `-t "a float window"` the row alone took `175ms`, and with `-t "the print page"` it took `227ms` (`Tests  1 passed | 12 skipped (13)`).

Brief verify 3, `npx vitest run tests/checks/tree/boundaries.test.ts`, run twice:
```
 FAIL  |unit| tests/checks/tree/boundaries.test.ts > layer boundaries > holds across src/lib
Error: Test timed out in 5000ms.
      Tests  1 failed | 10 passed (11)
<multiplication sign> |unit| ... > layer boundaries > holds across src/lib 5139ms
```
`uptime` at that moment printed `load averages: 15.26 15.58 13.50`. The same file run with `--testTimeout=0` printed `<check mark> |unit| ... > holds across src/lib 3936ms`, `Test Files  1 passed (1)`, `Tests  11 passed (11)`, and `vitest checks` passed inside test:quick. The assertion holds. The 5000 ms timeout comes from machine load (spec.md:78), and the step's one added `ALLOWED` entry does not cause it.

Brief verify 4, `wc -l`: `13 src/app.html`, `177 src/hooks.server.ts`, `3 src/routes/+layout.ts`, `93 src/routes/+page.server.ts`, `35 src/routes/+page.ts`, `136 src/routes/find/+page.svelte`, `107 .../apps/routes/theme.ts`, `614 src/lib/themes/vscode-map.ts`, `219 .../ui/theme/app-theme.ts`, `140 .../ui/theme/theme.ts`, `153 .../editor/start-theme.ts`, `184 .../window/appearance.svelte.ts`, `456 src/lib/shell/Workbench.svelte`, `398 src/desktop/app.ts`, `113 .../windows/start-colours.ts`, `853 tests/checks/tree/boundaries.test.ts`, `432 .../app-theme-start.test.ts`, `360 .../hooks-server.test.ts`. Every file is under its limit, and each count equals the report's. `sh utils/folder-check.sh` printed nothing and exited 0.

Brief verify 5: `sh utils/unused-exports.sh` (exit 0), diffed with `migration-O39-partE-base/unused-exports.txt`:
```
< Unused exports (230)
> Unused exports (229)
< src/lib/themes/vscode-map.ts: MINIMUM, table, parseColour
> src/lib/themes/vscode-map.ts: MINIMUM, table, GIT_DEFAULTS, basesOf, parseColour, mapTheme
< src/lib/ui/theme/theme.ts: CRT_CLASS
< src/lib/themes/vscode-map.ts: TokenRule
> src/lib/themes/vscode-map.ts: TokenRule, TypeDefaults, Context, Mapped
```
This matches the report. `utils/migrations/convert-vscode-themes.ts:47-56` imports every name that was added to the list.

Brief verify 6: `git diff 200f12da -- src tests | grep -E "^\+" | grep -inE "before|used to|no longer|still|..."` printed `// before the app starts, each in a placeholder of app.html ...` (hooks.server.ts), and three `beforeAll` code lines that are not comments. "before the app starts" is a time inside one request. It compares nothing with an earlier state of the code, so it is not history.

Brief verify 7: `grep -rn -E "convertAppTheme|appThemeBlock\b|AppThemeSheet|'oculus-app-theme'|\bSTYLE_ID\b" src tests config docs README.md utils --exclude=local.yml --exclude-dir=diagrams` printed only `icon-theme/held.svelte.ts:22,58,68` (its own `STYLE_ID = 'oculus-icon-fonts'`) and `vscode-map.ts:559: export const APP_THEME_STYLE_ID = 'oculus-app-theme';`. The grep for `CRT_CLASS|RICE_PLAIN_CLASS|RICE_SANS_CLASS|BodyLooks|oculus-desktop|DESKTOP_MARK` gives hits in `app.ts:18,164`, `app-theme.ts:31,111`, `ui/theme/theme.ts:13,105,127`, `start-theme.ts`, and `hooks-server.test.ts:17,101,240`. None is stale.

ASCII gate (spec.md:101, `find src tests config`, since the worktree has no `bin/`): it printed nothing (`perl exit 0`). `LC_ALL=C grep -n '[^ -~]'` over the report exited 1.

Premises checked on the base copy `migration-O39-partE-base`: the UA grep over `src/lib/server` and `src/hooks.server.ts` exited 1 (prints nothing); `app.html:10` reads `<body data-sveltekit-preload-data="hover">`; `theme.ts:51` is `firstAppThemes`; `app-theme.ts:43` is `STYLE_ID = 'oculus-app-theme'`; `ui/theme/theme.ts:38,44,50,138` hold the three classes and `className`; `find/+page.svelte:62` reads `true, data.appThemes`; the folder counts are 10, 10, 10, 10, 7, 9; `boundaries.test.ts:313` already lists start-theme in the state row. Every premise reproduces. `ls docs/adr` gives "No such file or directory" in the main checkout and in the worktree, so no ADR applies.

## 2. Verdicts

### Items of "What to build"

1. The first HTML carries the start theme: **holds**.
   - `app.html` has the two placeholders.
   - `pageTheme` (`hooks.server.ts:68-91`) calls `requestStart` with `desktopMarked(user-agent)` and `route.id === '/'`.
   - It escapes `&`, `"` and `<` through a function replacer, withholds a block that holds `<`, runs inside `transformPageChunk`, and a throw gives no theme.
   - The find page uses `desktopOf(window, '') !== undefined` (`find/+page.svelte:64`).
   - B1 concerns the derived tokens, which the item does not name.
2. One conversion, one join, one rule: **holds**.
   - `themeSheet` and `APP_THEME_STYLE_ID` are in `vscode-map.ts`, and `bodyClass` with the three classes in `start-theme.ts`. `applyTheme` calls `bodyClass`.
   - `requestStart(held, config, marked, crt)` sits beside `firstAppThemes`.
   - The `startOf`, `startClass` and `windowStart` signatures are unchanged, and the `ui` row of the layer table was added with its reason.
   - The reading of the looks is written twice (T1).
3. The server knows a desktop window's request: **holds** by reading.
   - `app.ts:164` appends `DESKTOP_MARK` to `session.defaultSession` before any window is made.
   - No other `setUserAgent` or partition exists in `src/desktop` (grep).
   - The server reads the token as a whole word. No test reaches the host call; the look covers it.
4. Comments and the guarded entries: **holds** for every comment the item names, each rewritten, and the Doc text is given. Two comments outside the item's list remain false: T3 and T4.

### Cases (as amended by the cases ruling)

- C1: met. G11 row C1/C2 (browser `''`, no style) and the G118 row C1.
- C2: met. G11 row C1/C2 with `MARKED`, `vscode-dark-modern`. The in-word UA gets no mark.
- C3: met. G118 rows for both requests.
- C4: met. G11 row C4: class `app-theme`, one style element equal to `themeSheet`'s block, holding `--bg: #7a1020;`, placed before `</head>`.
- C5: met. G118 rows, not approved and unresolved, for both requests. File `null` means the hook sends no style element (`hooks.server.ts:84-88`).
- C6: met as ruled. The G11 C6 rows: float equals `/`; find, show and print get the same style as `/` and the class without `crt`. The two `crt.on: true` configs are included.
- C7: met by reading. `paintAppTheme` (`app-theme.ts:88-104`) looks up `APP_THEME_STYLE_ID` and replaces the element's text.
- C8: not verifiable (the orchestrator's look).
- C9: not verifiable (the orchestrator's look).
- C10: met as ruled. Given finding, one read each, start class by mark, title replaced.
- C11: met. The G118 rows give `rice kanagawalotus crt rice-plain rice-sans` and, with no CRT, the same without `crt`. The equality check with `applyTheme` is weak (P1).
- C12: met. G118 rows, desktop `app-theme` with file, browser `''` with null.
- C13: met. The G11 HTML row; the page half by reading of `find/+page.svelte:64`.
- C14: met. G11 row C14: `a&quot;b&lt;c&amp;d$&amp;e`, the rest of the HTML unchanged.
- C15: met as ruled. One style element equal to the block of the file without the colour, no `<`, no `<script>`.
- C16: met. G11 row C16 (0 config reads, 0 apps reads). The existing row "reads it once for a page" passes unchanged.

## 3. Findings

### Spec

None.
- The two comment-only files outside the write list are justified. `src/routes/+page.ts:16-17` and `src/lib/shell/Workbench.svelte:156` each said an app's theme "is drawn from the first paint" by the page's script, which is the claim the premise correction says cannot hold. Item 4 asks that every comment saying when the theme is drawn be made true, and spec.md:70 asks for the same. The report names both paths with their reason (spec.md:35), and the new wording is true.
- The rows rewritten after the ruling read correctly: C6 with its CRT configs, C15, and the G118 row 'the same looks on a page that draws no CRT overlay (C11)', judged by reading. On the unchanged tree the hook adds no class: C6 first fails at `expect(bodyClass(root.html)).toBe('vscode-dark-modern')` on its second config; C15 fails at `toBe('app-theme')` with `''`; the new G118 row throws `loaded.requestStart is not a function`.

### Proof

**P1 (low-moderate). C11's equality with `applyTheme` cannot fail.** Place: `tests/server/desktop/app-theme-start.test.ts:426-430`:
```
if (looks !== undefined) {
    const page = body();
    loaded.applyTheme(page, looks.theme, looks);
    expect(start.classes).toBe(page.body.className);
}
```
- Both sides are computed by `bodyClass`, and the looks are handed to `applyTheme` as a literal (`{ crt: true, brackets: false, monospace: false }`), not read from the config the way the page reads them (`setAppearance` and `configuredLook`, through `lookShape`).
- So the equality cannot fail, and only the literal `classes` string tests `configLooks`.
- Failure scenario: `lookShape` changes its default for a non-boolean `rice.monospace` while `configLooks` keeps `true`. For `rice: { monospace: 'x' }`, the server then sends a class without `rice-sans` and the page's first draw adds it, a font change after the first frame. No row fails.
- This is the test-side half of T1.

**P2 (low). Two new rows have no failure on the unchanged tree.** The C13 HTML row and 'sends the HTML with no theme and the title when the theme cannot be computed' pass on the unchanged tree by construction, because the unchanged hook adds no theme. Read on their own merits, each would fail on a defect of the new code: C13 if the hook treated every request as marked; the throw row if the `catch` in `pageTheme` were absent. The tests are sound; the brief's demand cannot be met for these two rows.

### Standards

**T1 (moderate). The rule for reading the looks exists twice (spec.md:87, "a parser, a fold or a rule exists once and is reused").** Place: `src/lib/data/helpers/editor/start-theme.ts:128-136`:
```
export function configLooks(config: Record<string, unknown>): BodyLooks {
    const crt = isMap(config.crt) ? config.crt : {};
    const rice = isMap(config.rice) ? config.rice : {};
    return {
        crt: typeof crt.on === 'boolean' ? crt.on : false,
        brackets: typeof rice.brackets === 'boolean' ? rice.brackets : true,
        monospace: typeof rice.monospace === 'boolean' ? rice.monospace : true
```
- The page reads the same three options, with the same defaults, through `lookShape` in `src/lib/state/shared/words/appearance.ts:328-370`. The builder's own judgment call 3 says so.
- The state row of the layer table already lets `appearance.ts` import `start-theme`, so `lookShape`'s three fields can take their values from `configLooks`. That widens the write list by `src/lib/state/shared/words/appearance.ts` (spec.md:13).
- Failure scenario: the one in P1.

**T2 (low). The C6 rows exceed the test file's 100 ms rule and are not tagged slow.** Place: `tests/server/root/hooks-server.test.ts:255-294`. The file's head comment (`:7-8`) says a case that takes 100 ms or more in a run of its own is tagged slow. Run alone, 'a float window' took 175 ms and 'the print page' 227 ms. Failure scenario: the unit tier carries four rows its own rule moves to the slow tier.

**T3 (low). A sentence the step makes false.** Place: `src/lib/themes/tokens.css:18-20`:
```
/* Three colours derive.ts computes for every theme and ui/theme/theme.ts sets on the root
   element: the selected-row surface and the scrollbar's thumb and track. These are the
   default theme's values, so the first paint, before a theme is applied, draws them as well. */
```
The first paint now carries the start theme's class, so "the first paint, before a theme is applied" is false. The report lists it as still true.

**T4 (low). A doc comment in a changed file still carries the overturned premise.** Place: `src/lib/ui/theme/app-theme.ts:160-162`:
```
 * its block put in the document and its tokens derived from it. An app's theme the draw hands the
 * file of (`file`, which the page's first load carries) is drawn from that file at once, before
 * the page paints; any other draw of an app's theme loads its file from the server.
```
The page's script runs after its first paint; under this step the first paint comes from the HTML and the draw replaces the element the server sent.

**T5 (low). An added export with no importer outside its own file (spec.md:87).** Place: `src/lib/server/machine/apps/routes/theme.ts:70`, `export type RequestStart`. `grep -rn "RequestStart\b" src tests` prints only `theme.ts:70` and `:85`.

**T6 (low). The verify list ran once more than spec.md:26 allows.** The report says it ran twice, once before the last comment edits and once after.

**T7 (low). The report has no collision statement for the new keys (spec.md:71).** By reading: a browser whose user agent carries the word `oculus-desktop` gets the desktop start in its HTML and its page, with no bridge, draws the first row, one change of colour; a placeholder name `filled` does not know is left as it is (`?? whole`).

### Behaviour

**B1 (moderate). The report's stated limitation on the derived tokens is unverified, and the reading suggests it cannot appear in the first paint.** The report says a dark theme's first frames draw the scrollbar and the selected-row surface in the light theme's derived colours until the script draws.
- With `ssr = false` the first HTML's body is `<div style="display: contents"></div>` with nothing inside (`app.html:12`), so the first paint has no scrolling box and no selected row, only the body ground (`+layout.svelte:36`), which the class now themes. The derived tokens could only show in a frame painted after the script mounts content and before `applyTheme`'s `$effect` sets them (`appearance.svelte.ts:121-160`).
- The report gives no command or reading for that frame, and briefs the look to accept a scrollbar colour change on dark themes as expected.
- Judgment, not verified: Svelte flushes the mount's effects before the next paint, so the stated artifact does not occur. If it does occur, it is inside the step's goal and not among the brief's accepted exceptions (Decision 5 names only the wallpaper).
- What settles it: the C8 and C9 recording, frame by frame, on a dark start theme with a scrolling view.

Judged with no finding: `firstAppThemes` runs twice per page boot, once in the HTML request and once in the page load; it resolves at most two files, and Decision 4 accepts the two reads disagreeing.

Stated in the report with before and after, so no finding: the find page in a browser now starts on Light, not Dark Modern; the CRT overlay appears in the workbench's first paint; the user agent token reaches every origin a desktop window's frames load.

## 4. Declined to judge

- `npm run diagrams`: not run, since it writes into the worktree.
- The builder's first run on the unchanged tree: not rerun; the quoted failures were judged by reading.
- C8 and C9: the orchestrator's look.
- Whether `session.setUserAgent` reaches every request header: needs Electron; judged by reading of `app.ts:159-164`.
- Whether a frame with mounted content paints before the first `$effect` sets the derived tokens (B1): needs the recording at the look.
- The time and file reads of `firstAppThemes` running twice: not measured.
- The report's count "the other 7 are under `docs/diagrams/`": `git status --short` shows six diagram files plus the report; no decision rests on it.

Usage: a6d705f9b51150ea3, claude-opus-5-5, 272567 tokens, 67 tool uses, 17 min 28 s
