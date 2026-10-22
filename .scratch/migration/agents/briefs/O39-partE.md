# Brief: O39 part E, the page's first HTML carries the theme it starts on

Size: a full step

Read `.scratch/migration/agents/spec.md` first; its rules govern this step unchanged. The configuration lists one standards page, `spec.md` itself (`standards: [.scratch/migration/agents/spec.md]` in `orchestrator-state.md`). The repository has no ADR folder (`ls docs/adr`: "No such file or directory"), so no ADR touches the step.

A design ruling decides what is built. It never exempts the code: every line is written to the standards pages, so that people can read, use and maintain it.

## What is on the tree (read on main at 65ceceae)

- The step's line, `plan.md` step O39, carries ruling O39 closing ("the desktop look owed from part A taken in the packaged app (a window started on an app's colour theme filled with its background from the first paint) ... then the step ticked"; `plan.md` Rulings) and ruling 186 ("an app's colour theme is drawn from a window's first paint"). The look was taken and failed; its booking (`plan.md:664`, "Booked 2026-10-22: the owed look of part A") gives what was seen: the window's first frame is a light ground (rgb 238,242,243) for 32 frames at 60 frames a second, then the page draws the theme (Ember, an app's colour theme, in that run). This part ends that.
- **Premise corrected in `plan.md` (under O39, after the booking at `:664`).** Ruling 186 says the page "converts it before it first paints". That cannot hold: the page's script runs after its first paint, which is what the look showed. The ruling's result (drawn from the first paint, the same file the host converts, no new choice source) is kept; the means becomes the server converting the file with the page's own conversion into the first HTML.
- **Why the first frame is light.** The desktop window is made with `show: false` and the host's fill (`src/desktop/windows/windows.ts:373`, `windowFill` of `decide/window-options.ts`) and shown on `ready-to-show` (`windows.ts:401`), which Electron fires at the page's first paint. The page renders on the client alone (`src/routes/+layout.ts:2`, `export const ssr = false`), so the first HTML is `src/app.html` with an empty body and no theme: `<body data-sveltekit-preload-data="hover">` (`app.html:10`) with no class, and no style element. Its first paint is the `:root` ground of `src/lib/themes/tokens.css`, the light theme's, until the script draws the theme (`document.body.className`, `src/lib/ui/theme/theme.ts:138`; an app theme's block in the style element whose id is `STYLE_ID`, `'oculus-app-theme'`, `src/lib/ui/theme/app-theme.ts:43`, written by `paintAppTheme`, `:95-111`, which replaces the element's text when the element is there, `:102-104`). The host's colours are right (`startColours`, `src/desktop/windows/start-colours.ts:92-115`). The same holds in a browser tab: its first paint is light whatever the theme.
- **Two requests.** With `ssr = false`, SvelteKit sends the HTML without running load functions (`node_modules/@sveltejs/kit/src/runtime/server/page/index.js:140-142`); the page's data comes from a second request. The HTML's theme and the page's first draw are computed from two reads of the config, which agree unless the config changes between them.
- **What the server already has per request.** `src/hooks.server.ts:101-103` resolves every page with `transformPageChunk`, which today replaces `%oculus.title%` (`src/app.html:7`) alone; the request's config is read only when asked, through `locals.config()`, which the title and the load functions share, so an API route reads nothing (`hooks.server.ts` head comment, `:67-70`; G11's row "reads it once for a page, whose title and load function share the read", `tests/server/root/hooks-server.test.ts:41-54`). The merged config holds the `theme` and `app_theme` options, the `themes:` rows and the CRT and rice options. The files of the app themes those options name are read by `firstAppThemes(locals.server.apps.held(), config)` (`src/lib/server/machine/apps/routes/theme.ts:51`), an approved, enabled app's file alone (`src/routes/+page.server.ts:58` reads `locals.config()` for the page's load).
- **The rule a page starts on.** `startOf` (`src/lib/data/helpers/editor/start-theme.ts:42-52`) over the rows, the drawable app themes, the saved `theme` and a `start`. The page passes `look.appTheme` as `start` in the desktop app's window and nothing in a browser (`startChoice` and `startClass`, `src/lib/state/shared/words/appearance.ts:497-513`); the host passes `config.app_theme` (`windowStart`, `start-theme.ts:62-73`, called by `tests/server/desktop/window-guard.test.ts:31,347,350,393`). The page knows it is in the desktop window by its bridge (`inApp = desktop !== undefined`, `src/lib/shell/window/appearance.svelte.ts:77`); the audience and print pages by `desktopOf(window, '') !== undefined` (`src/routes/present/show/+page.svelte:183`, `src/routes/present/print/+page.svelte:72`); the find page passes `true` always (`src/routes/find/+page.svelte:62`). The server cannot tell a desktop window's request from a browser's today (`grep -rn "userAgent\|user-agent" src/lib/server src/hooks.server.ts` prints nothing). The defaults make the two differ: `theme: ''` and `app_theme: vscode-dark-modern` (`config/defaults/appearance.yml:60,63`), whose first row is `light` with the empty class (`:9`), so with the defaults a desktop window starts on Dark Modern and a browser tab on Light.
- **The host's windows.** Every window the host makes uses `session.defaultSession` (`src/desktop/app.ts:159`; `show.ts:8` says so): the workbench windows (`windows.ts:190,204,446,472`), the audience window (`src/desktop/windows/show.ts:92-109`, `/present/show`), the print window (`print.ts:46-58`) and the find bar's view (`find-bar.ts:49,81`, `/find`).
- **The body class.** `applyTheme` (`ui/theme/theme.ts:128-138`) sets the theme's class string joined with `CRT_CLASS` (`:38`) when the overlay is on and `RICE_PLAIN_CLASS` (`:44`) and `RICE_SANS_CLASS` (`:50`) when the rice toggles are off. The workbench adds `wall` when a wallpaper shows (`appearance.svelte.ts:117`) and sets the wallpaper's properties from the script (`theme.ts:95-111`).
- **How the page turns an app theme into CSS.** `convertAppTheme` (`src/lib/ui/theme/app-theme.ts:58-66`) maps the resolved theme with `mapTheme` and `basesOf` of `src/lib/themes/vscode-map.ts` over `tokens.css` and `themes.css` imported `?raw` (`app-theme.ts:37-38`), into the block `body.<APP_THEME_CLASS>`. `APP_THEME_CLASS` is in `src/lib/data/helpers/files/apps/choices.ts:16`. The host maps the same file with the same `mapTheme` and `basesOf` (`appThemeBlock`, `start-colours.ts:78-90`) into a record of tokens, not a block of text.
- **The layer table** (`tests/checks/tree/boundaries.test.ts`, `spec.md:55`): `themes: ['themes/**']`, `server: ['server/**', 'data/**']`, `data: ['data/**']`; the `ui` row (`:219-231`) allows `themes/**` and named `data/` helpers, not `data/helpers/editor/start-theme`; `src/hooks.server.ts`, `src/routes/` and `src/desktop/` are outside `LAYERS` (`:20`). So the server's modules cannot import `themes/`, a `themes/` module cannot import `APP_THEME_CLASS`, and the hook can import both.
- **Folder counts** (`spec.md:48`, at most ten items): `src/lib/themes` 10, `src/lib/server` 10, `src/desktop` 10, `src/desktop/windows` 10, `src/lib/server/machine/apps/routes` 7, `tests/server/desktop` 9. No new file goes directly into a folder at ten.
- **The guarded entries.** G118 (`agents/guarded.md:336-338`): "A page draws the theme it starts on from its first paint, and a desktop window is filled before its page paints with the background ... of that theme, by one rule (`startOf`)"; its tests `tests/server/desktop/app-theme-start.test.ts`, `window-guard.test.ts` and `attached-themes.test.ts`, none of which reads the HTML. G11 (`guarded.md:183-185`): the server starts on a clean checkout; its test `tests/server/root/hooks-server.test.ts` calls the hook's `transformPageChunk` and asserts one config read. This step changes G11's code (`hooks.server.ts`), so G11's test runs, and the hook's new HTML rows are rows of G11's test (the hook is its unit); the request-start function's rows are G118's. Vitest empties a stylesheet a module reads as text (`app-theme-start.test.ts:12-13`); a test of a module that imports `?raw` sheets mocks them as `app-theme-start.test.ts:34-35` does.
- Size: `src/hooks.server.ts` 109, `start-theme.ts` 73, `start-colours.ts` 115, `app-theme.ts` 226, `windows.ts` 541, `vscode-map.ts` 585, `theme.ts` (server route) 67, `ui/theme/theme.ts` 168, `find/+page.svelte` 134, `desktop/app.ts` 393.
- The base copy is `.agents/worktrees/migration-O39-partE-base/`, unpacked at preparation with `git archive <base> src tests utils config ':!config/local.yml'`, with `unused-exports.txt` beside it, the output of `sh utils/unused-exports.sh` on main at the base.
- The verify list in the state file equals the verification page's commands (the state file is the page); it is not changed.

## What to build

1. **The first HTML carries the start theme.** Every page the server renders from `src/app.html` (the workbench at `/`, a float window's `/?float=...`, the find page, the audience and print pages) is sent with the theme it will start on already on the document:
   - `<body>` carries the class string the page's first `applyTheme` sets for the same config: the start theme's class joined with the CRT class when `crt.on` is set and the rice classes when a rice toggle is off. The join is one pure function that `applyTheme` and the server both call (item 2).
   - When the start theme is an app's colour theme whose file resolves (an approved, enabled app, as `firstAppThemes` reads it), the head carries the converted block in a style element whose id is the one constant `paintAppTheme` looks up, so the page's first draw replaces that element's text rather than adding a second one.
   - The start theme is the one the page's first draw chooses: `startOf` over the request's merged config (the one `locals.config()` read the title shares), the drawable app themes of `firstAppThemes`, the `theme` option, and the `app_theme` option as `start` for a request the desktop host marked (item 3) alone. A theme the page passes over (an app's theme whose app is not approved and enabled, or whose file does not resolve) is passed over here too, to the same start theme.
   - The class string is written into the attribute with `&`, `"` and `<` escaped, and inserted by a replacer function, so `$&` and its kin in a class are written literally. A block whose text holds `<` is not sent (the page draws it after), so no theme file can close the style element.
   - The theme is computed inside `transformPageChunk`, so an API request reads no config and no apps. A throw in the theme's computation sends the HTML with no theme added, and the title is replaced as today.
   - The find page draws its theme with `desktopOf(window, '') !== undefined`, as the audience and print pages do, in place of `true` (`src/routes/find/+page.svelte:62`), so every page's start follows the one mark.
2. **One conversion, one join, one rule, within the layer table.**
   - The pure conversion (resolved theme, UI kind, the two sheets' text and the class name to the CSS text of the block, its editor rules and whether it is dark) is one exported function of `src/lib/themes/vscode-map.ts`, beside `mapTheme`; the class name is an argument, since `themes/` cannot import `APP_THEME_CLASS`. The style element's id is one exported constant of the same file. `app-theme.ts`'s `convertAppTheme` and `STYLE_ID` become uses of the two; the hook imports the same two with the sheets `?raw`.
   - The join of the body class (the theme's class string and the CRT and rice looks) is one exported function of `src/lib/data/helpers/editor/start-theme.ts`, with `CRT_CLASS`, `RICE_PLAIN_CLASS` and `RICE_SANS_CLASS` moved there; `applyTheme` calls it. `data/helpers/editor/start-theme` is added to the `ui` row of `tests/checks/tree/boundaries.test.ts` with its reason in the table's comment (a pure helper with no reader and no I/O, as it already is in the `state` row).
   - The request's start (the class string from item 1's rule and the join, and the app theme's file or none) is one exported function of `src/lib/server/machine/apps/routes/theme.ts`, beside `firstAppThemes`, taking the held apps, the config and whether the request is marked. `startOf`, `startClass` and `windowStart` keep their signatures.
   - The hook calls the request's start and, for an app theme, the conversion; it holds no rule of its own.
3. **The server knows a desktop window's request.** The host appends the token `oculus-desktop` to the user agent of `session.defaultSession` once, at start in `src/desktop/app.ts` beside the session's other settings (`:159`), so every request of every window on that session carries it: the main window, a float window, a reload, `moveTo` and `follow`, the audience and print windows, the find bar, and a window onto an oculus the app did not start. The token is one exported constant of `start-theme.ts`, which the host and the server import; the server reads it from the request's `user-agent` header as a whole word. No query parameter (`inPlace`, `windows.ts:217-228`, compares the search), and no per-load option. A browser tab never carries it.
4. **Comments and the guarded entries.** Every head comment that says when or where the theme is drawn is made true: `src/routes/+layout.ts:1` ("The server's job is data and the socket, not HTML"); `hooks.server.ts`'s head comment on `app.html`'s placeholders and the one config read; `app-theme.ts:1-13`; `appearance.svelte.ts:13-20`; `start-theme.ts:1-11`; `start-colours.ts:1-23`; `server/machine/apps/routes/theme.ts:1-16`; `ui/theme/theme.ts`'s comment on `applyTheme`; `+page.server.ts`'s paragraph on app theme files (`:18`); the find page's comment at its draw. The report's "Doc text" gives G118's and G11's new Code paths and Test titles for the orchestrator to apply at landing.

## Cases

Each case is an input and its expected result. C1 to C6 and C10 to C16 are tests: the request-start function's rows in G118's `tests/server/desktop/app-theme-start.test.ts` (or a new G118 file beside it), the hook's HTML rows in G11's `tests/server/root/hooks-server.test.ts`. C7 is a reading. C8 and C9 are the orchestrator's look.

- C1. Default config (`theme: ''`, `app_theme: vscode-dark-modern`), a request with no mark for `/`: the body's class attribute is empty (Light) or absent, and no style element with the shared id. Test.
- C2. The same config, a request whose `user-agent` carries `oculus-desktop`: the body's class attribute is `vscode-dark-modern`. Test.
- C3. `theme: dark`, either request: the body's class attribute is `dark`. Test.
- C4. `theme` names an approved, enabled app's colour theme whose file resolves (Ember, `sideBar.background` `#7a1020`): the body's class attribute is `app-theme`, and the head holds one style element whose id is the shared constant and whose text equals what the conversion function returns for the same file, `#7a1020` among it. Test.
- C5. `theme` names an app theme whose app is not approved, or whose file does not resolve: the start theme's class (C1's without the mark, C2's with it), no style element. Test.
- C6. For the same config and mark, `/?float=<id>`, `/find`, `/present/show` and `/present/print` get the same body class and style element as `/`. Test.
- C7. The page's first draw on a page sent as C4: one element with the shared id, not two. Read in `paintAppTheme` (`app-theme.ts:95-111`).
- C8. The orchestrator's look at landing, after `npm run app:package` from landed main: the packaged app and `npm run app`, each started on Ember and on the default config, on the scratch setup the booking at `plan.md:664` describes, under a screen recording at 60 frames a second: the main window's first frame, a float window's, a reload's and the find bar's are the start theme's ground. The look is written under "Taken" in `agents/reviews/owed-looks.md` before O39 is ticked. Not run by the builder (`spec.md:64`).
- C9. The orchestrator's look: a browser tab on the same scratch server (port 8797, scratch HOME and hub, never TEST's workspace), on `theme: dark` and on Ember, reloaded under a screen recording: no light frame. Not run by the builder.
- C10. A config the read answers with a finding (the `theme` option naming no row and no app theme): the body carries the start theme `startOf` gives (C1's or C2's), the title is replaced as today, and the answer is the page, not an error. Test.
- C11. `crt.on: true`, `rice.brackets: false` and `rice.monospace: false` with a rice theme (`rice kanagawalotus` or another multi-word class of `config/defaults/appearance.yml:21-23`): the body's class attribute equals the string `applyTheme` sets for the same theme and looks. Test.
- C12. `app_theme` names an approved, enabled app's theme whose file resolves, `theme` empty: a marked request gets the class `app-theme` and the block; an unmarked one gets the first row (the empty class) and no style element. Test.
- C13. `/find` with no mark: the browser start (C1's), and the find page draws the same by `desktopOf`. Test for the HTML; reading for the page.
- C14. A `themes:` row whose class holds `"`, `<`, `&` and `$&`, chosen by `theme`: the attribute holds the escaped text, the `$&` written literally, and the rest of the HTML unchanged. Test.
- C15. An app theme whose converted block holds `<` (a colour value with `</style>` in the theme file): no style element is sent; the body still carries `app-theme`'s start as C4 would. Test.
- C16. A request to an API route (`/api/health`): no config read and no apps read; G11's existing row "reads it once for a page" passes unchanged. Test.

The builder's first task, before any change, is the first run of every test case above (C1 to C6, C10 to C16) on the unchanged tree, with each failure quoted, and the reading of C7 and C13's page half; C8 and C9 are named for the look and not run.

- A case of a code step becomes a test of the step only when the rules file's test rule calls for a test of it; here G118 and G11 call for these rows (ruling 186). No assertion over source text, a label or a constant is written (`spec.md:65`): each row asserts the HTML the hook returns or the start the function returns.
- No prototype script stands in for such a test.
- Every case marked as the look is checked by reading the code that draws it, and its row in the report names the look at landing as its proof, with the window or tab, the state to put it in and what should be seen (`spec.md:60`, `:64`). The builder runs no page, drives no browser and starts no desktop app.

When the first run finds a case the brief's own rules get wrong, the builder stops there, before changing any code, and hands back the first run and that case, with the rule and the result it gives. The orchestrator rules on the case and resumes the builder with the ruling, and the final report carries it.

## Paths this step writes

- `src/app.html`
- `src/hooks.server.ts`
- `src/routes/+layout.ts` (its comment)
- `src/routes/+page.server.ts` (its head comment)
- `src/routes/find/+page.svelte`
- `src/lib/server/machine/apps/routes/theme.ts`
- `src/lib/themes/vscode-map.ts`
- `src/lib/ui/theme/app-theme.ts`
- `src/lib/ui/theme/theme.ts`
- `src/lib/data/helpers/editor/start-theme.ts`
- `src/lib/shell/window/appearance.svelte.ts` (its head comment)
- `src/desktop/app.ts`
- `src/desktop/windows/start-colours.ts` (its head comment, and its block if it reads the shared conversion)
- `tests/server/desktop/app-theme-start.test.ts`, or a new G118 test file beside it
- `tests/server/root/hooks-server.test.ts`
- `tests/checks/tree/boundaries.test.ts` (the `ui` row and its comment)
- `docs/diagrams/`, as `npm run diagrams` writes it
- `.scratch/migration/agents/reviews/O39-partE-report.md`, in the worktree's copy of the ledger

One path per line: a whole file, or a range of lines of a shared document, numbered as on main at the base. The step writes these paths and nothing else.

No script is written for this step, by the builder or by the session that runs it inline, other than a script the step builds under "What to build". Any other script needs the user's approval of what it computes, quoted from a line of `plan.md`'s Rulings. This brief's mention of a script is no approval.

## Decisions taken in this brief (each reversible, none silent)

1. The fix is the first HTML carrying the theme, converted by the server with the page's own conversion, not a later show of the window, so a browser tab's first paint is right too. This replaces ruling 186's "the page converts it before it first paints", which cannot hold; the ruling's result is kept (the premise correction under O39 in `plan.md`).
2. One conversion and one join, each in one file the layer table lets every caller import, so the HTML and the page's first draw cannot differ.
3. The mark is the user-agent token `oculus-desktop` on the default session, which every window and every load of it carries. It also reaches the other origins a desktop window's frames load; it carries no user data.
4. When the config changes between the HTML's request and the page data's request, the page redraws to the data's theme: one change of colour, accepted.
5. The wallpaper arrives with the script: the first paint is the start theme's ground, and the wallpaper and the `wall` class come when the script draws them.

## Libraries checked

None found: the work is a page template, a request hook and a move of existing functions. The builder adds no dependency.

## Read, with sections or line ranges

1. `src/app.html`; `src/hooks.server.ts` whole; `src/routes/+layout.ts`; `src/routes/+page.server.ts` `:1-90`; `src/routes/find/+page.svelte` whole.
2. `src/lib/data/helpers/editor/start-theme.ts` whole; `src/desktop/windows/start-colours.ts` whole; `src/lib/server/machine/apps/routes/theme.ts` whole; `src/desktop/app.ts` `:140-200`.
3. `src/lib/ui/theme/app-theme.ts` whole; `src/lib/ui/theme/theme.ts` whole; `src/lib/themes/vscode-map.ts` `:1-80`, `:260-290`, `:355-420`; `src/lib/state/shared/words/appearance.ts` `:460-515`; `src/lib/shell/window/appearance.svelte.ts` `:1-140`.
4. `src/desktop/windows/windows.ts` `:180-230`, `:360-480`.
5. `tests/server/desktop/app-theme-start.test.ts` whole; `tests/server/desktop/window-guard.test.ts` `:1-60`, `:340-400`; `tests/server/root/hooks-server.test.ts` whole; `tests/checks/tree/boundaries.test.ts` `:1-120`, `:210-340`; `agents/guarded.md` G11 and G118.

## Conventions

The rules file's character set (ASCII). Words a reader sees come from `config/text` keys. Head comments say what the code does and why, with no history.

## Verify before you report

Run from the worktree root, each must hold, each output read by its own exit:

1. `npm run diagrams && npm run test:quick` (the verify list, which reads the changed files from git itself and holds prettier, eslint, the type check, the ASCII gate, the tree checks and the tests that name or import the changed files): it ends with every command passed. The report quotes the lines it prints. The plan's whole verify list runs once, at landing on main.
2. G118's and G11's test files run alone with `npx vitest run tests/server/desktop/app-theme-start.test.ts tests/server/desktop/window-guard.test.ts tests/server/desktop/attached-themes.test.ts tests/server/root/hooks-server.test.ts` (and the new file, if one): every row passes, and each new row's failure on the unchanged tree is quoted.
3. `npx vitest run tests/checks/tree/boundaries.test.ts`: passes.
4. `wc -l` of every changed file: a component at or under 520, a source file at or under 880; `sh utils/folder-check.sh` passes.
5. `sh utils/unused-exports.sh` compared with `.agents/worktrees/migration-O39-partE-base/unused-exports.txt`: each line the step added is quoted with what was done to it (`spec.md:87`).
6. The grep of the comment lines added or changed for the history words of `spec.md:44`, quoted with each hit judged.
7. The grep of every name the step changes or moves (`convertAppTheme`, `STYLE_ID`, `CRT_CLASS`, `RICE_PLAIN_CLASS`, `RICE_SANS_CLASS`, the new exports of `vscode-map.ts`, `start-theme.ts` and `theme.ts`, `oculus-desktop`) across `src`, `tests`, `config`, `docs` and `README.md`, quoted, and each comment named under "What to build" item 4 listed as 'still true' or 'rewritten' (`spec.md:70`).

## Report

Write it to `.scratch/migration/agents/reviews/O39-partE-report.md` in the worktree, in the rules file's character set, a character outside it in quoted output written by its name in angle brackets, such as `<tab>` or `<em dash>`, with these parts in this order.

- The first line: anything NOT done, or "Everything in the brief is done".
- The open items of the state file, verbatim, which hold only what the user must rule on.
- The cases' first run: every case of "Cases" by its name, none left out, each with the command or the reading that checked it and its output as printed, and each case the brief's rules got wrong with the rule, the result and the orchestrator's ruling.
- The DONE / NOT DONE table with the checks above and their output as printed, the ASCII gate's line included.
- The files with line counts.
- Every judgment call the brief left open.
- Every host- or user-visible change with its before and after, written for the look: the window or tab, the state to put it in and what should be seen.
- Anything in the brief that was wrong or impossible, with the evidence.
- A section "Doc text" with G118's and G11's new Code paths and Test titles, for the orchestrator to apply at landing.
