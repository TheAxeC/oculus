# Brief: O39 part F, the first HTML paints the start theme's ground under the dev server too

Size: a full step

Read `.scratch/migration/agents/spec.md` first; its rules govern this step unchanged. The configuration lists one standards page, `spec.md` itself (`standards: [.scratch/migration/agents/spec.md]` in `orchestrator-state.md`). The repository has no ADR folder (`ls docs/adr`: "No such file or directory"), so no ADR touches the step.

A design ruling decides what is built. It never exempts the code: every line is written to the standards pages, so that people can read, use and maintain it.

## What is on the tree (read on main at 6f89bfeb)

- The step's line is O39 in `plan.md` (its tags include ruling 186: a page's first paint is its start theme's ground). The part is booked under O39 as "Booked 2026-10-23 (Z468), found at part E's look": under the dev server (`vite dev`, which `npm run dev` starts), a reload's first frame is white for every theme, `theme: dark` and Ember alike; a static page dark from its first byte shows no white frame. The fix is O39's, inside part A's line: "the first HTML paints the start theme's ground itself, under the dev server too; built before O39's closing."
- The cause, read on the tree: every route renders in the browser (`src/routes/+layout.ts:3`, `export const ssr = false`), so the first HTML is the shell `src/app.html` (13 lines). The stylesheets are imported by the layout's script (`src/routes/+layout.svelte:10-15`, `tokens.css`, `themes.css`, the rice sheets, `vscode.css`, `code.css`, `slide.css`), and the ground is the layout's component rule `:global(body) { background: var(--bg) }` (`+layout.svelte:34-39`). The built server links the stylesheets in the head; the dev server injects them from the scripts, so until the scripts run no rule paints a background, and the canvas is the browser's white.
- What the first HTML carries now (`src/hooks.server.ts:55-104`, `pageTheme`, filled into app.html by `transformPageChunk` inside `handle` at `:152-191`): `%oculus.root-style%` on `<html>`, the tokens `derivedTokens` gives for the start classes (the readable foregrounds and the scrollbar tokens, `src/lib/ui/theme/theme.ts:102-113`; `--bg` is not among them, since a stylesheet sets it); `%oculus.body-class%` on `<body>`, the start body class string; `%oculus.theme-style%`, for an app's colour theme the style element `APP_THEME_STYLE_ID` with the converted block, sent only when the block's text holds no `<` (`:87-90`, case C15 of part E). A start that cannot be computed sends all three empty (`:102-104`). The block is withheld when its text holds `<` (`:92`, `const sent = sheet !== null && !sheet.css.includes('<')`); the comment at `:73-76` says no value of a theme file reaches the block, so no input reaches that branch today.
- The ground of a theme: `--bg` resolved for the body class string over `tokens.css` and `THEME_SHEETS`, `resolveTheme(parseBlocks(...), classes)['--bg']` (`src/lib/themes/parse.ts:84-91`). `THEME_SHEETS` is `[themesCss, ...riceSheets, vscodeCss]` (`src/lib/ui/theme/theme.ts:37`), the sheets `pageTheme` derives over (`hooks.server.ts:93-94`). `:root` sets `--bg: #f1f5f9` (`src/lib/themes/tokens.css:9`), `body.dark` sets `--bg: #0b1120` (`src/lib/themes/themes.css:18-20`), every rice file and `vscode.css` (19 times) set one; the desktop window's start `vscode-dark-modern` (`config/defaults/appearance.yml:63`) sets `--bg: #181818` (`vscode.css:382`), and `kanagawalotus` (class `rice kanagawalotus`, `appearance.yml:55`) `#e5ddb0` (`src/lib/themes/rice/kanagawa.css`). Every shipped `--bg` is a hex colour, and the converter writes an app theme's `--bg` as hex (`vscode-map.ts:297-300`, `:428`). `body.crt`, `rice-plain` and `rice-sans` set no `--bg`. `windowColours` (`parse.ts:113-118`) already reads `--bg` this way for the desktop window and accepts it only as a hex colour (`isHexColour`, `parse.ts:103-106`); for an app's theme the host merges the converted block's tokens (`src/desktop/windows/start-colours.ts:110-112`).
- `applyTheme` (`src/lib/ui/theme/theme.ts:125-140`) sets the body class and the derived tokens on every theme change; it is the page's first draw and every later one.
- Sizes: `src/hooks.server.ts` 191 lines, `src/lib/ui/theme/theme.ts` 162, `src/lib/themes/parse.ts` 118, `src/app.html` 13, `src/routes/+layout.svelte` 50 (`wc -l`).
- Guarded entries over files this step changes: G11 (`src/hooks.server.ts`, `src/app.html`; `tests/server/root/hooks-server.test.ts`, describe 'a page sent with the theme it starts on'; its harness empties the rice sheets at `:11-13` and hands `applyTheme` a plain object in `pageTokens`, `:236-252`) and G118 (the start theme, `theme.ts` `applyTheme`, `parse.ts`; `tests/server/desktop/app-theme-start.test.ts`, `window-guard.test.ts`, `attached-themes.test.ts`). The ground is a new outcome of both units, so it gets rows in their tests (spec.md:59), under these entries; no new entry. `Themeable` (`theme.ts:28-34`) is shaped so a test can hand `applyTheme` a plain object.
- Ids of style elements in use: `'oculus-app-theme'` (`APP_THEME_STYLE_ID`, `src/lib/themes/vscode-map.ts:559`) and `'oculus-icon-fonts'` (`src/lib/ui/display/icon-theme/held.svelte.ts:22`).
- Comments that list what the first HTML holds: the head comment of `hooks.server.ts` above `handle`, the head comment of `src/lib/ui/theme/app-theme.ts:9-16` and the doc comment of `drawTheme` (`:143-152`), the head comment of `tests/server/root/hooks-server.test.ts:1-14`, and G118's text in `guarded.md`.
- The plan's verify list equals the verification page's commands (the page is the state file itself, `.agents/plan.yaml` `verification:`), so it is unchanged.

## What to build

1. **The first HTML paints the ground.** Every page the shell serves (the workbench `/`, a float window, the find page, the audience and print pages) is sent with the start theme's ground as a rule in the head of its first HTML, before any script or stylesheet: `html { background: <colour> }` in a style element of its own, the colour the `--bg` that the start body class string resolves to over `tokens.css` and `THEME_SHEETS` (themes.css, every rice file and vscode.css), and for an app's colour theme over those sheets with the converted block, the same sheets `derivedTokens` reads in `pageTheme`. The ground element precedes `%sveltekit.head%` in `app.html`, so it comes before any script and link. By ruling 261 (a) the same element also carries the layout's scrollbar rule, `* { scrollbar-width: thin; scrollbar-color: var(--scroll-thumb) var(--scroll-track) }` as `+layout.svelte:46-49` writes it, whose two tokens the root element's style already carries (`derivedTokens`, `src/lib/themes/derive.ts:282`), so the first frames draw the theme's bar too; the comment at `+layout.svelte:40-44` ("so the first paint draws the same bar") is then true and says where the first bar comes from. Under the dev server a reload's first frame is then the theme's ground, not white, and under the built server the first frame is what it is now.
2. **Only a colour is sent.** The colour is sent only when it is a hex colour (`isHexColour`); any other value (a `var()`, a word, a value holding `<`) sends no ground element, and the page paints as it does now. A start that cannot be computed, and an app theme whose block is withheld (`:92`), send no ground element and no placeholder text: a ground resolved without the block would be the light `:root` ground under a dark app theme.
3. **The ground leaves when the page draws.** (The scrollbar rule of item 1 leaves with it; the layout's rule draws the bar from then on.) The page's first `applyTheme` removes the ground element (by its id, through `Themeable`, so a test still hands it a plain object), so from then on the ground is the layout's `body` rule over the loaded stylesheets, and a theme changed later (in Settings, by `:theme`, by an app) paints its ground over the whole window, the canvas beyond the body included, with no colour of the start theme left anywhere. `applyTheme` called again finds no element and does nothing more.
4. **One reading of the ground.** The server reads the ground with the reading `windowColours` uses (`resolveTheme` of the blocks, `--bg`, a hex colour), shared, not written a second time.
5. **Comments and documents.** The head comment of `hooks.server.ts` above `handle` (it lists what the shell carries), the doc comment of `pageTheme`, the doc comment of `applyTheme`, the head comment of `parse.ts`, the head comment of `app-theme.ts:9-16` and the doc comment of `drawTheme` (`:143-152`), and the head comment of `hooks-server.test.ts:1-14` say what the ground element is and when it leaves; the comment of the layout's `:global(body)` rule (`+layout.svelte:30-33`) stays true or is made true. The one user document that names it, `docs/HELP.md:514` ("the page draws it from its first paint"), this step makes true under the dev server too, and it stays as it is (`grep -rn "first paint\|first frame" docs README.md`).

6. **Rows under G11 and G118 (spec.md:59).** In `tests/server/root/hooks-server.test.ts`, describe 'a page sent with the theme it starts on', a table of the ground sent for: `theme: dark` (`#0b1120`); the first row (`#f1f5f9`); the desktop mark with the default config (`vscode-dark-modern`, `#181818`); a rice row (`kanagawalotus`, `#e5ddb0`, with the rice files read as the harness reads tokens, themes and vscode); an approved app theme (the `--bg` of its converted block); and each page kind of part E's C6 rows; and rows of no ground element for a start that cannot be computed and for a withheld block. In `tests/server/desktop/app-theme-start.test.ts` (G118's, which calls `applyTheme`), a row that the first call removes the ground element and a second call finds none and changes nothing. Each new row is run once on the unchanged tree first and its failure quoted. The orchestrator names the rows in G11's and G118's Test lines at landing.

## Cases

The builder's first task, before any change, is the first run of every case on the unchanged tree, by reading the code and by the command the case names, with each result noted. A case the brief's rules get wrong is handed back before any code changes. A first frame cannot be seen without a browser, which the builder does not drive; the orchestrator takes C1 to C4 on screen at landing on a scratch dev server. The builder checks C1 to C3, C5 to C7 and C3b by the rows of item 6, and C4 by the `applyTheme` row of item 6 and by reading. The look checks every frame from the reload to the drawn page, not only the first.

- C1. (The line.) `theme: dark`, the dev server, a reload of `/`: the first HTML's head holds `html { background: #0b1120 }` before `%sveltekit.head%`; no frame from the reload to the drawn page is white.
- C2. (The line.) An approved app's colour theme (Ember) as `theme`: the ground is the `--bg` of Ember's converted block; the first frame is that colour.
- C1b. (Ruling 261 (a).) `theme: dark`, the dev server, a reload of a view that scrolls: the first HTML's ground element holds the scrollbar rule; no frame draws the browser's light bar.
- C3. (Implied: the light theme.) The first row, the empty class string: the ground is `#f1f5f9`.
- C3b. (Implied: a VS Code and a rice row; the desktop window's default start.) A request with the desktop mark and the default config: `html { background: #181818 }`; `theme: kanagawalotus`: `html { background: #e5ddb0 }`.
- C3c. (Implied: the built server.) Under the built server, `theme: dark` and Ember each paint their ground in every frame after a reload, as now; taken at the look.
- C4. (Implied: a later change.) Start on `dark`, then choose a light theme in Settings: the whole window, the area below a short page and an overscroll included, is the light ground; no `#0b1120` is painted anywhere; the ground element is gone from the document after the first draw.
- C5. (Implied: every page.) A float window, the find page, the audience page and the print page are sent the ground of their start theme, as part E's C6 rows send them their start; the look reloads each under the dev server.
- C6. (Implied: no colour.) An app theme whose block is withheld (`hooks.server.ts:92`) or a start whose `--bg` is not a hex colour: no ground element; the page is sent as it is now.
- C6b. (Implied: a theme passed over.) An app theme whose app is not approved or whose file does not resolve: the ground of the start theme the body class is sent with (`#f1f5f9` in a browser, `#181818` with the desktop mark).
- C7. (Implied: no start.) The start cannot be computed (G11's row 'sends the HTML with no theme and the title when the theme cannot be computed'): no ground element and no `%oculus.` text left in the HTML.
- C8. (Implied: the desktop window.) A window of the desktop app is still filled before its page paints with the colours `windowColours` gives (G118's rows), unchanged.
- C9. (Implied: what part E sends.) Every row of G11's describe 'a page sent with the theme it starts on' and G118's tests still passes after the change.

The rows of item 6 are the step's tests, under G11 and G118; C1, C2, C3c, C4 and C5's frames are the look at landing.

## Paths this step writes

- `src/app.html`
- `src/hooks.server.ts`
- `src/lib/ui/theme/theme.ts`
- `src/lib/themes/parse.ts`
- `src/routes/+layout.svelte` lines 30-49, the comments of the `:global(body)` and `:global(*)` rules
- `tests/server/root/hooks-server.test.ts` (its head comment, the harness's mocked sheets, `pageTokens`, the rows of item 6 and any row the new element changes)
- `tests/server/desktop/app-theme-start.test.ts`, the `applyTheme` row of item 6
- `src/lib/ui/theme/app-theme.ts` lines 9-16 and 143-152, the comments
- `docs/diagrams/`, only where `npm run diagrams` changes it
- a file a split for the size rule makes, named in the report
- `.scratch/migration/agents/reviews/O39-partF-report.md`

The step writes these paths and nothing else; a file the work reaches outside them is named in the report with why.

No script is written for this step, by the builder or by the session that runs it inline, other than a script the step builds under "What to build". Any other script needs the user's approval of what it computes, quoted from a line of `plan.md`'s Rulings. This brief's mention of a script is no approval.

## Decisions taken in this brief (each reversible, none silent)

1. The ground is a style element of its own in the head, filled from a new placeholder of app.html in the same one-pass replacement `handle` uses, and not a `background` on the root element's style attribute: an inline style on `<html>` would outlive the first draw and stop the body's background reaching the canvas, leaving the start ground at the edges after a theme change.
2. The element carries an id the page's first `applyTheme` removes it by; the id is an exported constant in `src/lib/ui/theme/theme.ts`, beside `applyTheme`, which removes the element, distinct from `'oculus-app-theme'` and `'oculus-icon-fonts'`, an internal name no user sees.
3. The ground is `background` alone; `color-scheme` stays with the stylesheets, since a canvas with an explicit background shows no white whatever the scheme.
4. No new guarded entry: the rows of item 6 sit under G11 and G118.

## Libraries checked

None found: no library or SvelteKit option inlines a route's stylesheets into the first HTML of a page that renders in the browser under the dev server. The step adds no dependency.

## Read, with sections or line ranges

- `src/app.html`, whole.
- `src/hooks.server.ts:55-104` and `:120-191` (`handle` at `:152-191`).
- `src/lib/themes/parse.ts`, whole.
- `src/lib/ui/theme/theme.ts:95-162`.
- `src/routes/+layout.svelte`, whole; `src/routes/+layout.ts`.
- `src/desktop/windows/start-colours.ts:95-115`.
- `tests/server/root/hooks-server.test.ts:220-440`.
- `.scratch/migration/agents/guarded.md`, G11 and G118.

## Conventions

The rules file's character set (ASCII). Words a reader sees come from `config/text` keys; this step adds none. Head comments say what the code does and why, with no history; a code comment edited is rewrapped as a whole paragraph at 100 columns.

## Verify before you report

Run from the worktree root, each must hold, each output read by its own exit:

1. `npm run diagrams && npm run test:quick` (the verify list, which reads the changed files from git itself and holds prettier, eslint, the type check, the ASCII gate, the tree checks and the tests that name or import the changed files): it ends with every command passed. The report quotes the lines it prints. The plan's whole verify list runs once, at landing on main.
2. G11's and G118's test files run alone with `npx vitest run tests/server/root/hooks-server.test.ts tests/server/desktop/app-theme-start.test.ts tests/server/desktop/window-guard.test.ts tests/server/desktop/attached-themes.test.ts`: every row passes after the change; each new row's failure on the unchanged tree is quoted, and each existing row's pass before the change.
3. `npx vitest run tests/checks/tree/boundaries.test.ts`: passes.
4. `wc -l` of every changed file: a component at or under 520, a source file at or under 880; `sh utils/folder-check.sh` passes.
5. `sh utils/unused-exports.sh` compared with `.agents/worktrees/migration-O39-partF-base/unused-exports.txt`: each line the step added is quoted with what was done to it (`spec.md:87`).
6. The grep of the comment lines added or changed for the history words of `spec.md:44`, quoted with each hit judged.
7. The grep of every name the step adds or changes (the new placeholder, the ground element's id constant, the shared ground reader) across `src`, `tests`, `config`, `docs` and `README.md`, quoted, and each comment named under "What to build" item 5 listed as 'still true' or 'rewritten' (`spec.md:70`).

## Report

Write it to `.scratch/migration/agents/reviews/O39-partF-report.md` in the worktree, in the rules file's character set, a character outside it in quoted output written by its name in angle brackets, such as `<tab>` or `<em dash>`, with these parts in this order.

- The first line: anything NOT done, or "Everything in the brief is done".
- The open items of the state file, verbatim, which hold only what the user must rule on.
- The cases' first run: every case of "Cases" by its name, none left out, each with the command or the reading that checked it and its output as printed, and each case the brief's rules got wrong with the rule, the result and the orchestrator's ruling.
- The DONE / NOT DONE table with the checks above and their output as printed, the ASCII gate's line included.
- The files with line counts.
- Every judgment call the brief left open.
- Every host- or user-visible change with its before and after, written for the look: the window or tab, the state to put it in and what should be seen.
- Anything in the brief that was wrong or impossible, with the evidence.
- A section "Doc text" with G11's and G118's new Code paths and Test rows, and G118's sentence on what the first HTML is sent with, the ground element added, for the orchestrator to apply at landing.
