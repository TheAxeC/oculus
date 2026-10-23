# O39 part F, builder report

Everything in the brief is done.

## Open items of the state file, verbatim

From `.scratch/migration/orchestrator-state.md:203-206` in the worktree (the copy at the base, from before ruling 261 (a) was booked there):

- 261 (2026-10-23, O39 part F's brief check): the comment of the scrollbar rule in `src/routes/+layout.svelte:41-45` ends "The page's first HTML carries the start theme's two on the root element (hooks.server.ts), so the first paint draws the same bar." Under the dev server that is false, for the cause part F fixes for the background: the `scrollbar-color` rule is the layout's own style, which the dev server's first HTML lacks, so the first frames draw the browser's bar. Part F's line is the background only, and the brief check scope ruling sends a fix beyond the line to you. Options: (a) part F's builder also makes it true, by sending the scrollbar rule in the same head element as the background (the first frames then draw the theme's bar under the dev server too) and the comment kept; (b) only the comment is rewritten to say the bar is drawn once the stylesheets load; (c) left as it is. Recommendation: (a), a judgment: it ends the cause for the bar the same way part F ends it for the background, in the same element, at no new place; (b) leaves the light bar on a dark first frame; (c) leaves a false comment and is the lazy option.

The brief carries ruling 261 (a); this step builds it (item 1, C1b).

## The cases' first run (unchanged source tree)

Before any edit, the four G11/G118 files on the base: `npx vitest run tests/server/root/hooks-server.test.ts tests/server/desktop/app-theme-start.test.ts tests/server/desktop/window-guard.test.ts tests/server/desktop/attached-themes.test.ts --reporter=verbose` printed `Test Files  4 passed (4)` and `Tests  64 passed (64)`.

Then the new and extended rows were put into the two test files with `src` untouched (`diff -rq <base>/src src` printed nothing), and `npx vitest run tests/server/root/hooks-server.test.ts tests/server/desktop/app-theme-start.test.ts --reporter=verbose` printed `Test Files  2 failed (2)` and `Tests  12 failed | 32 passed (44)`. Each case:

- C1 (`theme: dark`, ground `#0b1120` before `%sveltekit.head%`). Row 'sends the ground of 'theme dark (C1)' in a style element of its own ahead of the head Kit fills' failed: `AssertionError: expected [] to deeply equal [ Array(1) ]`, `- "html { background: #0b1120 } * { scrollbar-width: thin; scrollbar-color: var(--scroll-thumb) var(--scroll-track) }",` `+ []`. Reading: `src/app.html:8` held `%sveltekit.head% %oculus.theme-style%` and no ground placeholder. The frames themselves are the look at landing.
- C1b (the scrollbar rule in the ground element). The same rows assert the element's whole text, the rule included, and failed as quoted. Reading: `grep -n scrollbar src/app.html src/hooks.server.ts` on the base printed nothing; the rule lived only in `+layout.svelte:46-49`.
- C2 (Ember). Row "sends the ground of 'an approved app's theme (C2)' ..." failed: expected `"html { background: #7a1020 } * { ... }"`, received `[]`.
- C3 (the first row, `#f1f5f9`). Row 'the first row in a browser (C3)' failed: expected `"html { background: #f1f5f9 } ..."`, received `[]`.
- C3b (`#181818` with the desktop mark, `#e5ddb0` for kanagawalotus). Rows 'the shipped config in the desktop window (C3b)' and 'theme kanagawalotus (C3b)' failed: expected `"html { background: #181818 } ..."` and `"html { background: #e5ddb0 } ..."`, each received `[]`. The kanagawalotus row's class check (`rice kanagawalotus`) passed on the base with the rice sheets mocked, so the mocks leave the existing rows as they were.
- C3c (the built server). Taken at the look; by reading, the built server links the stylesheets in the head (brief check section 3, `render.js:330-345`), and the ground element comes before them.
- C4 (a later change). G118 row "is taken away by the page's first draw, and a later draw finds none and takes nothing" failed: `AssertionError: expected [ undefined, 'another-style' ] to deeply equal [ 'another-style' ]` at the first `expect(head)` (the base exports no id and its `applyTheme` removes nothing). The window after a change is the look.
- C5 (every page kind). The four rows 'sends $row the start the workbench gets (C6)' (float, find, audience, print) failed on their new line `expect(grounds(page.html)).toEqual([ground(colour)])`: `AssertionError: expected [] to deeply equal [ Array(1) ]`, first start `- "html { background: #f1f5f9 } ..."`, `+ []`.
- C6 (no hex colour, a withheld block). Rows "sends no ground for an app's theme 'whose block's --bg is no hex colour, the block sent (C6)'" and "... 'whose block holds a closing tag, the block withheld (C6)'" passed on the base: the base sends no ground for any input. Their other assertions (the block sent holding `--bg: var(--panel);`, and no block for the closing tag) passed too, which shows the spy on `themeSheet` reaches the hook's call.
- C6b (an app theme passed over). Rows "an app's theme whose app is not approved, in a browser (C6b)" and "... in the desktop window (C6b)" failed: expected `#f1f5f9` and `#181818`, each received `[]`; their class checks (`''`, `vscode-dark-modern`) passed.
- C7 (no start). The row 'sends the HTML with no theme and the title when the theme cannot be computed', with `expect(grounds(sent.html)).toEqual([])` added, passed on the base.
- C8 (the desktop window's fill). `window-guard.test.ts` and `attached-themes.test.ts` passed on the base (64 passed above); `windowColours` is changed only to read its background through `themeGround`.
- C9 (part E's rows). Every existing row of both describes passed on the base (64 passed).

No case of the brief's rules turned out wrong.

## DONE / NOT DONE

| Item | State | Proof |
|---|---|---|
| 1. Ground element in the head of every page, before `%sveltekit.head%`, with the scrollbar rule, `--bg` over tokens.css and `THEME_SHEETS` (and the block for an app theme) | DONE | `src/app.html:8` `%oculus.ground-style% %sveltekit.head% %oculus.theme-style%`; `src/hooks.server.ts` `pageTheme`, `groundElement`, `GROUND_BAR`; the 7 ground rows and the 4 page-kind rows pass (final run below) |
| 2. Hex colour only; none for a start not computed or a withheld block | DONE | `themeGround` returns null unless `isHexColour`; `pageTheme` reads the ground only when `sheet === null \|\| sent`; the two C6 rows and the C7 row pass |
| 3. First `applyTheme` removes the element by id through `Themeable`; a second call changes nothing | DONE | `src/lib/ui/theme/theme.ts` `Themeable.getElementById`, `GROUND_STYLE_ID`, `document.getElementById(GROUND_STYLE_ID)?.remove()`; G118 row passes |
| 4. One reading of the ground shared with `windowColours` | DONE | `src/lib/themes/parse.ts` `themeGround`, called by `windowColours` and by `pageTheme`; window-guard and attached-themes pass |
| 5. Comments listing the first HTML made true, the two layout comments included | DONE | list under "Comments" below |
| 6. Rows under G11 and G118, each new row first run on the unchanged tree | DONE | first run above; final run below |
| Verify 1: `npm run diagrams && npm run test:quick` | DONE | `ok      prettier (1.1 s): All matched files use Prettier code style!`, `ok      ASCII gate (1.3 s)`, `ok      svelte-kit sync (2.9 s)`, `ok      vitest checks (13.7 s): Duration  4.33s ...`, `ok      vitest slow (19.7 s): Duration  10.38s ...`, `ok      vitest (22.5 s): Duration  13.19s ...`, `ok      eslint (27.9 s)`, `ok      svelte-check (37.6 s): 1792747402477 COMPLETED 537 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`, `test:quick: 41.0 s; every command passed` |
| Verify 2: the four G11/G118 files alone | DONE | `Test Files  4 passed (4)`, `Tests  74 passed (74)` |
| Verify 3: `npx vitest run tests/checks/tree/boundaries.test.ts` | DONE | `Test Files  1 passed (1)`, `Tests  11 passed (11)` |
| Verify 4: `wc -l`, `sh utils/folder-check.sh` | DONE | sizes below, all under 880 (no component over 520: `+layout.svelte` 55); folder-check printed nothing, exit 0 |
| Verify 5: `sh utils/unused-exports.sh` against the base list | DONE | `diff <base>/unused-exports.txt <new list>` printed nothing, exit 0 (both 343 lines, first line `Unused exports (230)`); the step adds no line |
| Verify 6: history-word grep | DONE | below |
| Verify 7: grep of the new names | DONE | below |
| ASCII gate | DONE | `LC_ALL=C perl -ne '...' $(find src tests config -type f ! -name local.yml)` printed nothing, exit 0 (the tree has no `bin`); `LC_ALL=C grep -n '[^ -~]'` over the 11 changed files printed nothing, exit 1 |

test:quick also printed `test:quick: 13 changed file(s), from git since HEAD`, `test:quick: 5 test file(s)` (app-theme-start and hooks-server changed; config-cache at depth 1; contrast and window-guard at depth 2) and `test:quick: not covered: tests that reach no changed file within the import depth, the build, the lint of unchanged files`. The 13 changed files are the 11 below plus the two ledger files the orchestrator left modified in the worktree (the brief and the brief check).

Runs: the verify list once (`npm run diagrams && npm run test:quick`), `npm run format` once. No whole-suite command. Git: read-only `git status --short`, `git diff --numstat`, `git diff -U0` and `git diff` of `docs/diagrams`, as the dispatch message allows (spec.md's builder rule bans them; the file list itself comes from `diff -rq` against the base copy); no git command that changes state. Other runs: the four G11/G118 files three times (base, after the change, final), the first run of the two changed test files once, boundaries once.

## Files

From `diff -rq` against the base copy over `src`, `tests`, `config`, `utils`, plus `docs/diagrams` (not in the base copy; changed by `npm run diagrams`). Lines are `wc -l` after the last change, with lines added and removed.

| File | Lines | +/- | In the write list |
|---|---|---|---|
| `src/app.html` | 13 | +1 -1 | yes |
| `src/hooks.server.ts` | 227 | +59 -23 | yes |
| `src/lib/ui/theme/theme.ts` | 176 | +20 -6 | yes |
| `src/lib/themes/parse.ts` | 130 | +23 -11 | yes |
| `src/routes/+layout.svelte` | 55 | +8 -3 | yes (the two comments, lines 30-49 of the base) |
| `src/lib/ui/theme/app-theme.ts` | 224 | +15 -13 | yes (the head comment and the `drawTheme` doc comment) |
| `src/lib/shell/window/appearance.svelte.ts` | 185 | +5 -4 | no: its head comment (lines 13-15) lists what the page's first HTML is sent with ("its body class, the tokens derived for it and the block of an app's theme ... so the first paint is that theme's") and says its first draw comes after; it now names the ground and that the first draw takes it away. Comment only. |
| `tests/server/root/hooks-server.test.ts` | 569 | +177 -46 | yes |
| `tests/server/desktop/app-theme-start.test.ts` | 490 | +36 -4 | yes (the row; also one sentence of its head comment and the two loaded names the row needs) |
| `docs/diagrams/layers.dot` | 101 | +1 -1 | yes (`"src to themes"` label 3 to 4, the new import of parse.ts) |
| `docs/diagrams/layers.svg` | 556 | +1 -1 | yes |

## Edits to existing assertions and helpers (from `diff <base> <tree>` of each test file)

`tests/server/root/hooks-server.test.ts`:
- `pageTokens`: the fake document gains `getElementById: () => null`, which `Themeable` now asks of a document.
- `themeStyles`: `new RegExp(... APP_THEME_STYLE_ID ...)` and `matchAll` moved into `stylesOf(html, id)`; `themeStyles` returns `stylesOf(html, vscodeMap.APP_THEME_STYLE_ID)`. Same pattern, same result.
- `converted`: `themeSheet(file as ResolvedTheme, ...)` becomes `vscodeMap.themeSheet(file as vscodeMap.ResolvedTheme, ...)`; the import of vscode-map is a namespace import so a row can spy on `themeSheet`.
- C4 row: `` `<style id="${APP_THEME_STYLE_ID}">` `` becomes `` `<style id="${vscodeMap.APP_THEME_STYLE_ID}">` ``.
- C6 rows: the tuple `[PageCase, string, string, boolean]` gains the ground colour (`'#f1f5f9'`, `'#181818'`, `'#0b1120'`, `EMBER_GROUND` three times, `'#0b1120'`), and two assertions are added: `expect(grounds(page.html)).toEqual([ground(colour)])` and `expect(grounds(page.html)).toEqual(grounds(root.html))`. No existing assertion changed.
- 'cannot be computed' row: `expect(grounds(sent.html)).toEqual([])` added.
- The three sheet mocks become one `vi.hoisted` reader `sheetText` and twelve `vi.mock` lines, the nine rice sheets added; the head comment's "The rice palettes stay empty, and no case here starts on a rice theme" is gone.

`tests/server/desktop/app-theme-start.test.ts`: `Modules` and `beforeAll` gain `applyTheme` and `groundId` from `theme.ts`; no existing assertion changed.

## Comments (item 5, spec.md:70)

- `src/hooks.server.ts`, head comment above `handle`: rewritten (names `%oculus.ground-style%`, ahead of the head Kit fills, the built and the dev server).
- `src/hooks.server.ts`, `PageTheme` comment and `pageTheme` doc comment: rewritten.
- `src/lib/ui/theme/theme.ts`, head comment: rewritten (the first theme put on takes the ground away); `Themeable` doc: still true; `applyTheme` doc: rewritten; `derivedTokens` doc: still true.
- `src/lib/themes/parse.ts`, head comment: rewritten ("the two stylesheets" became "the theme stylesheets", `themeGround` named); `windowColours` doc: rewritten.
- `src/lib/ui/theme/app-theme.ts:9-16`: rewritten; `drawTheme` doc: rewritten.
- `tests/server/root/hooks-server.test.ts:1-17`: rewritten.
- `src/routes/+layout.svelte`, `:global(body)` comment: rewritten (the ground before the first draw, the body's background the whole window's after it); `:global(*)` comment: rewritten (the rule in the ground element for the frames before the stylesheet, the layout's rule after the first draw); the script's head comment: still true.
- `src/routes/+layout.ts:1-2`: still true.
- `src/lib/shell/window/appearance.svelte.ts:13-16`: rewritten (outside the write list, above).
- Other comments that name the first HTML (`grep -rn "first HTML" src tests config docs README.md`): `src/desktop/windows/start-colours.ts:6`, `src/lib/server/machine/apps/routes/theme.ts:4,16,73`, `src/lib/data/helpers/editor/start-theme.ts:9,17`, `src/lib/views/system/findings/Findings.svelte:118`, `src/lib/themes/derive.ts:288`, `src/lib/themes/tokens.css:19`, `src/routes/find/+page.svelte:62`, `src/routes/+page.server.ts:39`, `src/routes/+page.ts:17`, `src/lib/themes/vscode-map.ts:5`: still true (none lists the head's elements as a whole).
- `docs/HELP.md:514` ("the page draws it from its first paint"): still true, unchanged (`grep -rn "first paint\|first frame" docs README.md` prints only that line).

## Verify 6: history words

`git diff -U0 -- src tests | grep -E "^\+" | grep -E "//|\*|/\*|it\(|it\.each|describe\(|row:" | grep -inE "before|used to|no longer|still|always has been|always had|as before|previously|the step adds|after this package|O39|Z468|2026|part F|part E"` printed nine lines, and the same grep over the added lines of `+layout.svelte` and `app.html` two more. Each hit:
- `* bar before the layout's stylesheet has loaded.`, `* sets them, so a frame that paints the mounted page before its draw has run`, `* (`GROUND_BAR`), ... so the frames before any`, `* stylesheet has loaded, which under the dev server come before the page's script runs`, `// `%oculus.ground-style%`, ... so it comes before any script and`, `// fills a window of the desktop app with before its page paints`, `* in the page's first HTML (hooks.server.ts), before any stylesheet has loaded.`, `Before the page's first draw the window's`, `the root element and this rule in its ground element (hooks.server.ts), so the frames before`: order of events while a page loads, no earlier state of the code.
- `* which for an app's theme is the start theme's. `current` says whether the draw is still wanted`: the existing `drawTheme` sentence rewrapped, about a load in flight.
- `// and vscode.css, are handed the text the browser reads. The module registry is reset before this`: the existing sentence rewrapped, about the order of module loads.
No hit names a package, a date or an earlier state.

## Verify 7: names

`grep -rn --exclude=local.yml "oculus-ground\|GROUND_STYLE_ID\|ground-style\|themeGround\|GROUND_BAR\|groundElement" src tests config docs README.md`:
- `src/app.html:8`, the placeholder.
- `src/hooks.server.ts:9,13,65,69,72,74,91,92,122,130,159,213`, the imports, `GROUND_BAR`, `groundElement`, the doc comments, the call and the `values` key.
- `src/lib/ui/theme/theme.ts:5,45,135,147`, the head comment, the constant, the `applyTheme` doc and the removal.
- `src/lib/themes/parse.ts:7,115,121,126`, the head comment, `themeGround`, the `windowColours` doc and call.
- `tests/server/desktop/app-theme-start.test.ts:54,81` and `tests/server/root/hooks-server.test.ts:40,275,472`.
No hit in `config`, `docs` or `README.md`. The id `'oculus-ground'` collides with no other: `grep -rn "'oculus-[a-z-]*'" src` lists `'oculus-app-theme'` (`vscode-map.ts`) and `'oculus-icon-fonts'` (`held.svelte.ts:22`) as the other style element ids, and no other element id `oculus-ground`. The placeholder name `ground-style` is distinct from `title`, `root-style`, `body-class` and `theme-style`.

Grep before writing a helper (spec.md:87): `grep -rn "scrollbar-color" src` printed the layout's rule and three components' `!important` rules, no shared constant to reuse. `grep -rn "isHexColour\|windowColours\|themeGround" src` after the change: `themeGround` is called by `windowColours` (`parse.ts:126`) and `pageTheme` (`hooks.server.ts:122`); `src/desktop/decide/window-options.ts:62` checks a colour a page sent with `isHexColour`, which resolves no theme and is a different reading.

## Judgment calls the brief left open (each reversible)

1. Names: the placeholder `%oculus.ground-style%`; the id `GROUND_STYLE_ID = 'oculus-ground'` in `theme.ts` beside `applyTheme`; the shared reader `themeGround(blocks, classes): string | null` in `parse.ts`; `GROUND_BAR` and `groundElement(colour)` in `hooks.server.ts`.
2. The element's text is `html { background: <hex> } * { scrollbar-width: thin; scrollbar-color: var(--scroll-thumb) var(--scroll-track) }`. The scrollbar rule is written twice, in `+layout.svelte` (a Svelte `<style>`, which cannot import a TypeScript constant) and in `GROUND_BAR`; each comment names the other. A change to one not carried to the other changes only the frames before the first draw.
3. `pageTheme` parses the sheets a second time for the ground (`derivedTokens` parses them inside); the cost per page HTML is not measured. `windowColours` now resolves the blocks twice in the host; not measured either.
4. `applyTheme` asks for the element on every call; only the first finds it. No flag or state records the first draw.
5. The withheld-block and the non-hex rows reach their branches by a spy on `vscodeMap.themeSheet` that edits the converted block (a `--bg: var(--panel);`, or a trailing `/* </style> */`), since no shipped input reaches either branch.
6. The nine rice sheets are mocked one literal `vi.mock` line each, through one hoisted reader `sheetText`, as the three other sheets are.
7. C6b's "file does not resolve" has no hook row: in `pageTheme` it is the same branch as "not approved" (`start.file === null`), and G118's `requestStart` rows already give `file` null for both.
8. The C6b rows send the browser's user agent explicitly (`BROWSER`) and `noApps`, the harness's defaults.

## Before and after, for the look

- Workbench `/` under the dev server (`npm run dev` on a scratch port), config `theme: dark`, reload: before, the first frames are white; after, every frame from the reload to the drawn page is `#0b1120`. View source (not the Elements panel): `<title>...</title>` followed by `<style id="oculus-ground">html { background: #0b1120 } * { scrollbar-width: thin; scrollbar-color: var(--scroll-thumb) var(--scroll-track) }</style>` before Kit's head links and scripts.
- Same, a view that scrolls (a long file in the editor or a long list): before, the first frames draw the browser's light bar; after, the theme's thin dark bar from the first frame (C1b).
- `theme` set to Ember (approved app theme): every frame is the `--bg` of Ember's converted block.
- Desktop window default (`vscode-dark-modern`) and `theme: kanagawalotus`: `#181818` and `#e5ddb0` from the first frame.
- After the page has drawn: in the Elements panel `<style id="oculus-ground">` is absent from the head.
- Start on `dark`, then choose a light theme in Settings (and by `:theme`): the whole window is the light ground, the area below a short page and an overscroll included; no `#0b1120` anywhere.
- Float window, `/find`, `/present/show`, `/present/print` under the dev server: each reload shows its start theme's ground in every frame.
- Built server (`vite build` then the preview or the app): `theme: dark` and Ember paint their ground in every frame after a reload, as before the step.
- Desktop app window: filled before its page paints with the same colours as before (`windowColours` unchanged in result).

## Anything in the brief wrong or impossible

Nothing. Two notes: no input reaches the withheld-block or the non-hex branch today (judgment call 5 says how the rows reach them); and the page an unmatched path serves through `app.html` gets the ground element and never draws, so the element stays there, in the same colour as its body, on a page that never changes theme (brief check section 2).

Limitations and sharp edges: the scrollbar rule's two copies (call 2); the second parse per page HTML, not measured (call 3); under the dev server a start theme whose ground is withheld (an app block holding `<`, unreachable today) still has white first frames, as item 2 asks.

## Doc text (for the orchestrator to apply at landing)

G11, Code: unchanged (`src/hooks.server.ts`, `src/app.html`). G11, Test, rows to add to the describe 'a page sent with the theme it starts on': 'sends the ground of $row in a style element of its own ahead of the head Kit fills' (theme dark (C1), the first row in a browser (C3), the shipped config in the desktop window (C3b), theme kanagawalotus (C3b), an approved app's theme (C2), an app's theme whose app is not approved, in a browser (C6b), and in the desktop window (C6b)); "sends no ground for an app's theme $row" (whose block's --bg is no hex colour, the block sent (C6); whose block holds a closing tag, the block withheld (C6)). The rows 'sends $row the start the workbench gets (C6)' and 'sends the HTML with no theme and the title when the theme cannot be computed' now also assert the ground.

G118, Code: `src/lib/ui/theme/theme.ts` (`applyTheme`, `derivedTokens`, `withThemeBlock`, `GROUND_STYLE_ID`) and `src/lib/themes/parse.ts` (`windowColours`, `themeGround`) in place of the two present entries.

G118, Test, add: `tests/server/desktop/app-theme-start.test.ts`, describe 'the ground a page is sent with', "is taken away by the page's first draw, and a later draw finds none and takes nothing".

G118, the sentence on the first HTML, proposed: "The page's first HTML is sent with that theme: its ground, the theme's `--bg` as a hex colour on the root element with the layout's scrollbar rule, in a style element of its own ahead of every script and stylesheet, which the page's first draw takes away, and no ground for an app's theme whose block is not sent; the body class its first draw sets, the CRT class on the workbench alone, the tokens its draw derives for that class on the root element, and for an app's theme the block of its file in the style element the first draw replaces; a request of the desktop app's window carries the word `oculus-desktop` in its user agent and starts on `app_theme`, a browser's starts on the first row."

## Tests proposed, not added

None.
