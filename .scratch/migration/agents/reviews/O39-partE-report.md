# O39 part E: report

Everything in the brief is done, under the cases ruling `agents/briefs/O39-partE-cases.md` (C6, C10, C15). Two paths outside the write list were changed, both comments: `src/routes/+page.ts` and `src/lib/shell/Workbench.svelte` (see "Files").

## Open items of the state file, verbatim

The section "## Open items" of `orchestrator-state.md` holds no item. Its text: "An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own."

## The cases' first run, and the ruling

Command on the unchanged tree (no file under `src/` changed, only the two test files): `npx vitest run tests/server/root/hooks-server.test.ts tests/server/desktop/app-theme-start.test.ts --reporter=verbose`. The hook file's summary: `Tests  9 failed | 4 passed (13)`.

| Case | Row | Command or reading | First run on the unchanged tree |
|---|---|---|---|
| C1, C2 | G11 'starts a browser on the first row and the desktop window on app_theme, by the mark (C1, C2)'; G118 'starts on $row' rows C1 and C2 | the run above | G11: `expected '' to be 'vscode-dark-modern'`. G118: `TypeError: loaded.requestStart is not a function` at `app-theme-start.test.ts:399` |
| C3 | G118 rows C3 browser and desktop | the run above | `TypeError: loaded.requestStart is not a function` |
| C4 | G11 "sends an approved app's theme as its class and the block of its file in the shared style element (C4)"; G118 row C4 | the run above | G11: `expected '' to be 'app-theme'`. G118: the TypeError |
| C5 | G118 rows C5 (not approved, browser and desktop; file not resolved, browser and desktop) | the run above | the TypeError |
| C6 | G11 'sends $row the start the workbench gets (C6)', rows float, find, audience, print | the run above | each `expected '' to be 'vscode-dark-modern'` |
| C7 | reading | `paintAppTheme`, `src/lib/ui/theme/app-theme.ts` (now `:88-104`): it looks up `APP_THEME_STYLE_ID`, replaces the text of an element that is there, and creates one only when none is; a first draw that is no app theme removes it | holds: one element |
| C8 | the orchestrator's look | not run (spec.md:64) | see "Before and after" |
| C9 | the orchestrator's look | not run | see "Before and after" |
| C10 | G11 'sends the start theme and the title for a theme option naming nothing, in a config the read answers with a finding (C10)' | the run above | `expected '' to be 'vscode-dark-modern'` |
| C11 | G118 row 'the CRT overlay on and the rice toggles off over a rice theme (C11)' | the run above | the TypeError |
| C12 | G118 rows C12 desktop and browser | the run above | the TypeError |
| C13 | G11 'sends the find page in a browser the browser start (C13)'; page half by reading | the run above; `src/routes/find/+page.svelte:62` was `void drawConfiguredTheme(document, true, data.appThemes);` | HTML row passes on the unchanged tree (the unchanged hook adds nothing, which is the browser start); page half fails on the unchanged tree: a browser tab drew the desktop start |
| C14 | G11 'writes a class holding a quote, a bracket, an ampersand and a replacement pattern escaped and literal (C14)' | the run above | `expected '' to be 'a&quot;b&lt;c&amp;d$&amp;e'` |
| C15 | G11 C15 row as first written | the run above | its precondition `expect(block).toContain('<')` failed: `expected 'color-scheme: dark;\n--shadow: none;\...' to contain '<'`, the block showing `--bg: #252526;`, the base value |
| C16 | G11 'reads no config and no apps for a request to an API route (C16)' | the run above | passes on the unchanged tree (the unchanged hook reads nothing for an API route) |
| item 1, throw | G11 'sends the HTML with no theme and the title when the theme cannot be computed' | the run above | passes on the unchanged tree (the unchanged hook adds no theme) |

The cases the brief's rules got wrong, with the ruling (`agents/briefs/O39-partE-cases.md`):

- C15. Rule: a block holding `<` is not sent. Result: no theme file can put `<` into the block (`parseColour`, `vscode-map.ts:283-290`, accepts only a hex; every other value is a hex from `settle`, a value of the shipped sheets, or `dark`, `none`, `transparent`), so the case's input sends a style element. Ruling, option (a): the guard stays, its comment saying it covers the two shipped sheets' text; C15 is now a theme whose file holds `</style>` in a colour: body class `app-theme`, one style element with the shared id, no `<` in it, the colour falling back. No row mocks the sheets.
- C6. Rule: the body carries the class the page's first `applyTheme` sets. Result: the find, audience and print pages draw `crt: false` (`app-theme.ts:221`, `drawConfiguredTheme`), the workbench draws `crt.on`. Ruling, option (a): `requestStart(held, config, marked, crt)`, the hook passing `event.route.id === '/'`; C6 now: `/?float=<id>` gets `/`'s class and style element, the other three `/`'s style element and class without the CRT class.
- C10. Result: a `theme` naming no row gives the read no finding (`loadConfig`'s findings are merge findings, `merge.ts:123-189`; `themeFindings` runs in `READER_FINDINGS` and names only `app_theme`). Ruling: the row with a given finding stands.

The rows rewritten after the ruling (C6's two `crt.on: true` configs, C15, and the G118 row 'the same looks on a page that draws no CRT overlay (C11)') were not run on the unchanged tree after the ruling. Their failing line there is read, not run: the unchanged hook gives the class `''` for every config, so C6's first failing line is the same `expected '' to be 'vscode-dark-modern'` quoted above (its first two configs are unchanged), C15's is `expect(bodyClass(sent.html)).toBe('app-theme')` with `''`, and the new G118 row fails with the same `TypeError: loaded.requestStart is not a function` as every row of its table.

## DONE / NOT DONE

| Deliverable | Command | Output |
|---|---|---|
| Item 1: the first HTML carries the start theme; class escaped and inserted by a replacer function; app theme block in the style element with the shared id unless it holds `<`; computed in `transformPageChunk` from the one read; a throw sends no theme | `npx vitest run tests/server/desktop/app-theme-start.test.ts tests/server/desktop/window-guard.test.ts tests/server/desktop/attached-themes.test.ts tests/server/root/hooks-server.test.ts --reporter=dot` | `Test Files  4 passed (4)`, `Tests  62 passed (62)` |
| Item 1: the find page draws with `desktopOf(window, '') !== undefined` | reading `src/routes/find/+page.svelte:64`; the look on landing | `void drawConfiguredTheme(document, desktopOf(window, '') !== undefined, data.appThemes);` |
| Item 2: `themeSheet` and `APP_THEME_STYLE_ID` in vscode-map.ts; `bodyClass`, `CRT_CLASS`, the rice classes, `configLooks`, `startRows` in start-theme.ts; `requestStart` in theme.ts; `startOf`, `startClass`, `windowStart` signatures kept; the hook only calls | same run; `npx vitest run tests/checks/tree/boundaries.test.ts --reporter=dot` | `Tests  62 passed (62)`; `Test Files  1 passed (1)`, `Tests  11 passed (11)` |
| Item 3: `oculus-desktop` appended to `session.defaultSession`'s user agent at start; read as a whole word | reading `src/desktop/app.ts:164` (`ses.setUserAgent(\`${ses.getUserAgent()} ${DESKTOP_MARK}\`);`); G11 C1, C2 row (the mark inside a longer word is not marked) | in the 62 passed; the host's call is seen at the look on landing |
| Item 4: comments made true; Doc text | reading, listed under "Comments" | below |
| C1 to C6, C10 to C16 as tests | the run above | 62 passed |
| Verify 1 | `npm run diagrams && npm run test:quick` | `ok      prettier (0.7 s): All matched files use Prettier code style!`, `ok      ASCII gate (0.8 s)`, `ok      svelte-kit sync (2.8 s)`, `ok      eslint (30.2 s)`, `ok      svelte-check (32.0 s): 1792703212354 COMPLETED 536 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`, `ok      vitest (39.2 s): Duration  22.59s (transform 30.93s, setup 0ms, import 59.94s, tests 15.26s, environment 5ms)`, `ok      vitest slow (45.7 s): Duration  28.97s (transform 11.37s, setup 0ms, import 40.47s, tests 11.70s, environment 1ms)`, `ok      vitest checks (61.9 s): Duration  44.94s (transform 10.41s, setup 0ms, import 37.57s, tests 37.89s, environment 2ms)`, `test:quick: 64.8 s; every command passed` |
| Verify 2 | the G118 and G11 files alone, above | `Tests  62 passed (62)` |
| Verify 3 | `npx vitest run tests/checks/tree/boundaries.test.ts` | `Tests  11 passed (11)` |
| Verify 4 | `wc -l` (below); `sh utils/folder-check.sh` | every file under its limit; folder-check exit 0, nothing printed |
| Verify 5 | `sh utils/unused-exports.sh` compared with the base's | below |
| Verify 6 | the history-word grep | below |
| Verify 7 | the name grep | below |
| ASCII | `LC_ALL=C grep -n '[^ -~]'` over the 18 changed files; the perl gate of spec.md | grep printed nothing (exit 1); perl printed nothing (`bfs: error: bin: No such file or directory.`: the worktree has no `bin/`) |

The verify list ran twice: once before the last comment edits, once after them (quoted above). No whole-suite command was run.

test:quick printed `25 changed file(s), from git since HEAD`; the `diff -rq` against the base copy lists the 18 files below, and the other 7 are under `docs/diagrams/`, which the base copy does not hold, written by `npm run diagrams`.

## Files

From `diff -rq` against the base copy, line counts base -> now (`wc -l`):

| File | Lines | In the write list |
|---|---|---|
| src/app.html | 13 -> 13 | yes |
| src/hooks.server.ts | 109 -> 177 | yes |
| src/routes/+layout.ts | 2 -> 3 | yes |
| src/routes/+page.server.ts | 91 -> 93 | yes |
| src/routes/+page.ts | 34 -> 35 | no: its comment "which draws such a theme from them at the first paint" was false (the page's script draws after the first paint), now says the first draw is made from them, the theme the first HTML was sent with |
| src/routes/find/+page.svelte | 134 -> 136 | yes |
| src/lib/server/machine/apps/routes/theme.ts | 67 -> 107 | yes |
| src/lib/themes/vscode-map.ts | 585 -> 614 | yes |
| src/lib/ui/theme/app-theme.ts | 226 -> 219 | yes |
| src/lib/ui/theme/theme.ts | 168 -> 140 | yes |
| src/lib/data/helpers/editor/start-theme.ts | 73 -> 153 | yes |
| src/lib/shell/window/appearance.svelte.ts | 181 -> 184 | yes |
| src/lib/shell/Workbench.svelte | 456 -> 456 | no: the doc comment of `appThemes` said "so such a theme is drawn from the first paint", false for the same reason; now "so the first draw of such a theme is made without a load" |
| src/desktop/app.ts | 393 -> 398 | yes |
| src/desktop/windows/start-colours.ts | 115 -> 113 | yes |
| tests/checks/tree/boundaries.test.ts | 848 -> 853 | yes |
| tests/server/desktop/app-theme-start.test.ts | 271 -> 432 | yes |
| tests/server/root/hooks-server.test.ts | 55 -> 360 | yes |
| docs/diagrams/ (7 files, by test:quick's count) | not counted | yes |

Edits to an existing assertion, allow list or predicate (from `diff` against the base copy): one. `tests/checks/tree/boundaries.test.ts`, the `ui` row: before `'data/helpers/files/languages'` as the last entry; after `'data/helpers/files/languages',` and `'data/helpers/editor/start-theme'`, with its reason in the table's comment. The existing G11 row and the six existing G118 rows are unchanged; `app-theme-start.test.ts` gained two members of `Modules` (`requestStart`, `applyTheme`) and one import of `theme.ts`.

## What was built

- `src/app.html`: `%oculus.theme-style%` in the head after `%sveltekit.head%` (prettier puts both on one line), `class="%oculus.body-class%"` on `<body>`.
- `src/hooks.server.ts`: `pageTheme(event)` calls `requestStart(apps.held(), locals.config().config, desktopMarked(user-agent), route.id === '/')`, converts an app theme's file with `themeSheet(..., APP_THEME_CLASS)` over the `?raw` sheets, escapes `&`, `"`, `<` in the class, and sends `<style id="oculus-app-theme">` unless the block holds `<`; any throw gives no theme. `transformPageChunk` replaces every `%oculus.<name>%` in one pass with a replacer function (an unknown name is left as it is), computing the theme once per request.
- `src/lib/server/machine/apps/routes/theme.ts`: `requestStart(held, config, marked, crt): { classes, file }`.
- `src/lib/data/helpers/editor/start-theme.ts`: `startRows` (the row reading `windowStart` held, which now calls it), `DESKTOP_MARK`, `desktopMarked`, `CRT_CLASS`, `RICE_PLAIN_CLASS`, `RICE_SANS_CLASS` (module-local), `BodyLooks` (moved from `ui/theme/theme.ts`), `configLooks`, `bodyClass`.
- `src/lib/ui/theme/theme.ts`: `applyTheme` calls `bodyClass`; `themeClasses` imports `CRT_CLASS`.
- `src/lib/ui/theme/app-theme.ts`: `convertAppTheme`, `STYLE_ID` and `AppThemeSheet` replaced by `themeSheet`, `APP_THEME_STYLE_ID`, `ThemeSheet`.
- `src/desktop/windows/start-colours.ts`: `appThemeBlock` became `appThemeBlocks`, which parses the block `themeSheet` makes, so the host, the server and the page share one conversion.
- `src/desktop/app.ts:161-164`: the mark on the default session.

## Judgment calls the brief left open (each reversible)

1. Placeholders in `app.html` named `%oculus.body-class%` and `%oculus.theme-style%`, beside `%oculus.title%`; a placeholder the hook does not know is left in the HTML.
2. `desktopMarked(agent)` in start-theme.ts beside the constant, splitting the user agent on whitespace; the hook calls it.
3. `configLooks(config)`, a reader of `crt.on`, `rice.brackets`, `rice.monospace` beside `windowStart`'s reading of `theme`, `app_theme`, `themes:`. The page reads the same three through the zod `lookShape` of `state/shared/words/appearance.ts:330-370`, which the server may not import, so the rule (a non-boolean or a non-map gives the default: off, on, on) is written twice. `appearance.ts` is outside the write list and was not changed.
4. The host's window fill reads the block through `themeSheet` and `parseBlocks` in place of `mapTheme`'s entries, so the three readers share one conversion. The tokens are the same entries; window-guard and the G118 rows pass (62 passed).
5. `GIT_DEFAULTS`, `basesOf`, `mapTheme`, `TypeDefaults`, `Context`, `Mapped` stay exported: `utils/migrations/convert-vscode-themes.ts:47-56` imports them, which knip `--production` does not count.
6. A request carries the mark from every window of the session, the find bar's view included, and to every origin its frames load (Decisions 3).

## Before and after, for the look

- C8, the desktop app (packaged after `npm run app:package` from landed main, and `npm run app`), on the scratch setup of the booking at `plan.md:664`, started on Ember and on the default config, recorded at 60 frames a second: before, the main window's first frame was the light ground (rgb 238,242,243) for about 32 frames; after, the main window's first frame, a float window's, a reload's (Cmd-R) and the find bar's (Cmd-F) are the start theme's ground: Ember's red side bar ground, and Dark Modern's `#181818` on the default config.
- C9, a browser tab on the scratch server (port 8797), on `theme: dark` and on Ember, reloaded under a recording: before, a light first paint then the theme; after, no light frame. On the default config a browser tab starts on Light, as before.
- The find bar opened in a browser tab (`/find`): before, it drew Dark Modern (the desktop start) after a light first paint; after, it draws the browser start, Light, from its first paint.
- With `crt.on: true`: the workbench's first paint carries the CRT overlay; the find bar and the presenter's pages show none, as their script draws.
- What the first paint does not carry: the wallpaper and its `wall` class (Decisions 5), and the derived tokens the script sets on the root element (`--accent-bg`, `--scroll-thumb`, `--scroll-track` among them, `tokens.css:18-20`), so a dark theme's first frames draw the scrollbar and the selected-row surface in the light theme's derived colours until the script draws. This is seen at the look as scrollbar colour, not ground.

## Unused exports (verify 5)

`diff` of the base's `unused-exports.txt` with the run after the last change:

- `src/lib/themes/vscode-map.ts: MINIMUM, table, GIT_DEFAULTS, basesOf, parseColour, mapTheme` (added `GIT_DEFAULTS`, `basesOf`, `mapTheme`) and `src/lib/themes/vscode-map.ts: TokenRule, TypeDefaults, Context, Mapped` (added the last three): kept, each imported by `utils/migrations/convert-vscode-themes.ts:47-56`; they appear because `app-theme.ts` and `start-colours.ts` now import `themeSheet` in their place.
- `src/lib/ui/theme/theme.ts: CRT_CLASS` removed from the list (moved).
- `RICE_PLAIN_CLASS` and `RICE_SANS_CLASS` were made module-local, so no line for them.

## History words (verify 6)

Grep of the added comment lines and test titles of the 18 files for the words of spec.md:44 printed one hit: `src/hooks.server.ts: > // before the app starts, each in a placeholder of app.html this replaces per request in one pass,`. Judged: "before the app starts" is a time within one request, not a comparison with an earlier state of the code.

## Names (verify 7)

`grep -rn -E "convertAppTheme|appThemeBlock\b|AppThemeSheet|'oculus-app-theme'|\bSTYLE_ID\b" src tests config docs README.md utils --exclude=local.yml --exclude-dir=diagrams` prints only `src/lib/ui/display/icon-theme/held.svelte.ts:22,58,68` (its own `STYLE_ID = 'oculus-icon-fonts'`, another element) and `src/lib/themes/vscode-map.ts:559: export const APP_THEME_STYLE_ID = 'oculus-app-theme';`. `oculus-desktop` appears once, `start-theme.ts:94`. The new names are used in start-theme.ts, theme.ts (route), vscode-map.ts, app-theme.ts, ui theme.ts, hooks.server.ts, start-colours.ts, app.ts and the three test files.

## Comments (item 4)

- `src/routes/+layout.ts:1`: rewritten.
- `hooks.server.ts` head comment on the placeholders and the one read: rewritten.
- `app-theme.ts:1-15`: rewritten; `paintAppTheme`'s doc comment rewritten; `drawConfiguredTheme`'s still true.
- `appearance.svelte.ts:13-23`: rewritten.
- `start-theme.ts:1-20`: rewritten; `windowStart`'s doc comment rewritten.
- `start-colours.ts:1-24`: rewritten; `appThemeBlocks`' doc comment new.
- `server/machine/apps/routes/theme.ts:1-20`: rewritten.
- `ui/theme/theme.ts`, the comment on `applyTheme`: rewritten.
- `+page.server.ts`, the paragraph on the one read (`:15-20`) and on app theme files (`:34-40`): rewritten.
- The find page's comment at its draw: new.
- `vscode-map.ts:1-8`: rewritten.
- `src/routes/+page.ts:15-17` and `Workbench.svelte` `appThemes`: rewritten (outside the write list, see Files).
- Still true, read: `docs/HELP.md:513` ("the page draws it from its first paint"), `config/options/appearance.yml:35,42`, `config/defaults/appearance.yml:59`, `tokens.css:18-20`, `+layout.svelte:41-45`, `utils/migrations/convert-vscode-themes.ts:30-33`.

## Limitations and sharp edges

- The derived tokens and the wallpaper come with the script (see "Before and after").
- `firstAppThemes` now runs twice per page boot, once in the HTML request and once in the load; each reads and resolves the named theme files. Not measured.
- When the config changes between the HTML request and the data request, the page redraws once (Decisions 4).
- The host's `setUserAgent` call is not reached by any test: no test starts Electron. The look on landing is its proof.
- The `<` guard has no row: no theme file reaches it (ruling C15).

## Anything in the brief wrong or impossible

C15, C6 and C10 as handed back and ruled above. Nothing else.

## Doc text

G11 (`agents/guarded.md`):
- Code: `src/hooks.server.ts`, `src/app.html`.
- Test: add `tests/server/root/hooks-server.test.ts`, describe 'a page sent with the theme it starts on', every row: 'starts a browser on the first row and the desktop window on app_theme, by the mark (C1, C2)', "sends an approved app's theme as its class and the block of its file in the shared style element (C4)", 'sends $row the start the workbench gets (C6)' (float, find, audience, print), 'sends the start theme and the title for a theme option naming nothing, in a config the read answers with a finding (C10)', 'sends the HTML with no theme and the title when the theme cannot be computed', 'sends the find page in a browser the browser start (C13)', 'writes a class holding a quote, a bracket, an ampersand and a replacement pattern escaped and literal (C14)', 'sends a theme whose file holds a closing tag in a colour with its block, the colour falling back (C15)', 'reads no config and no apps for a request to an API route (C16)'.

G118 (`agents/guarded.md`):
- Text, after "by one rule (`startOf`): ... else the first row.": "The page's first HTML is sent with that theme: the body class its first draw sets, the CRT class on the workbench alone, and for an app's theme the block of its file in the style element the first draw replaces; a request of the desktop app's window carries the word `oculus-desktop` in its user agent and starts on `app_theme`, a browser's starts on the first row."
- Code: add `src/lib/server/machine/apps/routes/theme.ts` (`requestStart`) beside `firstAppThemes`, `src/lib/data/helpers/editor/start-theme.ts` (`bodyClass`, `configLooks`, `desktopMarked`), `src/lib/themes/vscode-map.ts` (`themeSheet`), `src/lib/ui/theme/theme.ts` (`applyTheme`).
- Test: add `tests/server/desktop/app-theme-start.test.ts`, describe 'the theme a page is sent with', 'starts on $row', every row.
