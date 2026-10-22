# O39 part E: report (repair round 1)

Everything in the brief and in `agents/briefs/O39-partE-round1.md` is done. Ruling 7 found a frame that paints the mounted page before the derived tokens are set, so this round fixes it: the first HTML now carries the start theme's derived tokens on the root element. That adds `src/routes/+layout.svelte` (a comment made false by the fix) and the dependency of `src/hooks.server.ts` on `src/lib/ui/theme/theme.ts` (see ruling 7).

## Open items of the state file, verbatim

From `orchestrator-state.md`, section "## Open items", read with `sed -n '/## Open items/,/^## [A-Z]/p'`:

- Open item 259 (2026-10-22, O65): Pin Editor and Unpin Editor show the chord Cmd+K Shift+Enter in the palette, but no key runs it, on main or in O65; with Cmd+K now the editor's chord key (ruling 258 (b)), the hint names a key that does nothing. Options: (a) bind Cmd+K Shift+Enter in the editor to pin and unpin the tab, as VS Code does, in O65's repair round; (b) keep the hint as it is, naming a key that does nothing; (c) drop the hint, the lazy option. Recommendation: (a), since the palette then tells the truth and the key behaves as in VS Code.

## Rulings

### 1. T1 and P1, one reader of the looks: DONE

`src/lib/state/shared/words/appearance.ts`: `lookShape` no longer reads `crt.on`, `rice.brackets` or `rice.monospace` itself. `rice` and `crt` are taken as `z.unknown()` and the three fields come from `configLooks` over the same node; `rice.icons` is read by a shape of its own; `NO_LOOK`'s three values come from `configLooks({})`.

```ts
// appearance.ts:323
const iconsShape = z.object({ icons: z.boolean() }).transform((rice) => rice.icons);
// lookShape, :337 and :341
        rice: z.unknown(),
        crt: z.unknown(),
// its transform, :356-357
        icons: readAs(iconsShape, node.rice) ?? NO_LOOK.icons,
        ...configLooks(node),
// NO_LOOK, :160
    ...configLooks({}),
```

`rice.icons` reads as before for every input: a boolean is kept, a non-boolean, a missing key or a `rice` that is not a map gives `false`. `configLooks`'s doc comment (`start-theme.ts:123-128`) now names it the one reader of the three options, and `lookShape`'s doc comment (`appearance.ts:325-331`, above `const lookShape` at `:332`) says it takes them from there.

The C11 rows of G118 (`tests/server/desktop/app-theme-start.test.ts`) now compare the server's class with the class the page sets for the same config, read the page's way, through `pageClass(config, inApp, drawnBy)`: `setAppearance(config, CLASSES)`, then for the workbench `configuredLook()` and `drawTheme` with `themeClass(look.theme, NO_OFFERS, inApp)` and `look.crt`, `look.brackets`, `look.monospace`, as `shell/window/appearance.svelte.ts:134-145` calls it, and for a page with no `apps` channel `drawConfiguredTheme(document, inApp, {})`. The rows:

- 'the CRT overlay on and the rice toggles off over a rice theme (C11)', drawn by the workbench, class `rice kanagawalotus crt rice-plain rice-sans`;
- 'the same looks on a page that draws no CRT overlay (C11)', drawn as the find page draws, class `rice kanagawalotus rice-plain rice-sans`;
- new: 'rice.monospace written as a word, which reads as its default (C11)', `rice: { brackets: false, monospace: 'x' }`, drawn by the workbench, class `rice kanagawalotus crt rice-plain`.

The literal `looks` field and the test's own `body()` document are gone, and `applyTheme` is no longer a member of the test's `Modules`.

Run of the three rows on the tree before this round's change to `src/` (only the test file changed): `npx vitest run tests/server/desktop/app-theme-start.test.ts -t "starts on 'the CRT overlay|starts on 'the same looks|starts on 'rice.monospace written" --reporter=verbose`:

```
<check mark> |unit| ... > the theme a page is sent with > starts on 'the CRT overlay on and the rice toggl...' 15ms
<check mark> |unit| ... > the theme a page is sent with > starts on 'the same looks on a page that draws n...' 4ms
<check mark> |unit| ... > the theme a page is sent with > starts on 'rice.monospace written as a word, whi...' 4ms
      Tests  3 passed | 17 skipped (20)
```

They pass there because the page's own zod reading and `configLooks` already gave the same answer for these inputs: a non-boolean `monospace` gives `true` in both. With this round the two cannot diverge, since there is one reader. The same command after the change:

```
<check mark> |unit| ... > starts on 'the CRT overlay on and the rice toggl...' 7ms
<check mark> |unit| ... > starts on 'the same looks on a page that draws n...' 2ms
<check mark> |unit| ... > starts on 'rice.monospace written as a word, whi...' 2ms
      Tests  3 passed | 17 skipped (20)
```

### 2. T2, the C6 rows: DONE

The C6 table is tagged slow: `it.each([...])('sends $row the start the workbench gets (C6)', { tags: ['slow'] }, ...)`, `hooks-server.test.ts:310-312`. While timing every row of the file alone, C4 also took 129 ms alone, so it is tagged slow as well (`:285-287`). Each row run alone with `npx vitest run tests/server/root/hooks-server.test.ts -t "<row>" --reporter=verbose`:

| Row | Alone |
|---|---|
| C1, C2 | 48 ms |
| C4 | 129 ms, tagged slow |
| C6 'a float window' | 129 ms, tagged slow |
| C6 'the find page' | 122 ms, tagged slow |
| C6 'the audience page' | 177 ms, tagged slow |
| C6 'the print page' | 210 ms, tagged slow |
| the root element's tokens (new, ruling 7) | 59 ms |
| C10 | 33 ms |
| the theme cannot be computed | 16 ms |
| C13 | 21 ms |
| C14 | 27 ms |
| C15 | 32 ms |
| C16 | 21 ms |

### 3. T3, `tokens.css:18-20`: DONE

```css
    /* Three colours derive.ts computes for every theme and ui/theme/theme.ts sets on the root
       element: the selected-row surface and the scrollbar's thumb and track. The page's first HTML
       carries the start theme's class and its derived tokens, these three among them, on the root
       element (hooks.server.ts), and the page's script sets them again when it draws. These are
       the default theme's values, which a page sent with no start theme draws. */
```

The ruling's wording ("these three derived colours are set when the page's script draws") was written before ruling 7 settled; with ruling 7's fix the HTML carries them too, and the comment says that. The values on `:root` are what the page draws when the hook's `pageTheme` throws and sends no start theme (`hooks.server.ts:102-104`).

### 4. T4, `drawTheme`'s doc comment: DONE

`src/lib/ui/theme/app-theme.ts:160-170`: "The page's first paint comes from the HTML the server sent, which holds the start theme's class, its derived tokens and, for an app's theme, its block; an app's theme the draw hands the file of (`file`, which the page's first load carries) is drawn from that file at once, the draw replacing the text of the style element the server sent, and any other draw of an app's theme loads its file from the server." The file's head comment (`:10-15`) names the derived tokens as part of the first HTML.

### 5. T5, `RequestStart`: DONE

`src/lib/server/machine/apps/routes/theme.ts:70`: `type RequestStart = { classes: string; file: AppThemeFile | null };`. `grep -rn RequestStart src tests` prints only `:70` and `:85` (the return type of `requestStart`).

### 6. T7, two statements: DONE

- A browser whose user agent carries the word `oculus-desktop` (split on whitespace, `desktopMarked`, `start-theme.ts:96-100`) is sent the desktop start: `app_theme` when `theme` names nothing drawable, and the start theme's class, tokens and block in its HTML. Its page has no bridge to the host (`desktopOf(window, '')` is undefined), so its first draw starts as a browser's does, on the first row; where the two starts differ (`theme` empty or not drawable and `app_theme` set) the tab shows the desktop start at its first paint and changes colour once when the script draws. Where `theme` names a drawable theme both starts are that theme and nothing changes. The mark inside a longer word (`x oculus-desktopy`) is not the mark: G11 row C1, C2 checks `bodyClass` is `''` for it. The hook's head comment says this (`hooks.server.ts:129-134`).
- An unknown placeholder name, `%oculus.<name>%` with a name the hook does not fill, is left in the HTML as it is: the replacer returns `filled[name] ?? whole` (`hooks.server.ts:183`). `app.html` holds only the four names the hook fills (`title`, `root-style`, `body-class`, `theme-style`), and the throw row checks `sent.html` holds no `%oculus.`. The hook's head comment says this (`hooks.server.ts:129`).

### 7. B1, a frame before the derived tokens: a frame can, fixed in this round: DONE

The reading, line by line:

- `src/app.html:10-11` (the brief's `:12`), `<body class="%oculus.body-class%" ...>` and `<div style="display: contents">%sveltekit.body%</div>`: with `ssr = false` the body holds only Kit's start script, so a frame painted before the script mounts shows the body's background and no mounted content.
- `node_modules/@sveltejs/kit/src/runtime/client/client.js:703-711`: Kit mounts the root with `new app.root({ target, props, hydrate, sync: false, ... })`. The root is a class made by `asClassComponent` (`@sveltejs/kit/src/core/sync/write_root.js:190-192`).
- `node_modules/svelte/src/legacy/legacy-client.js:115-129`: the class constructor mounts the component and then runs `flushSync()` when `!async_mode_flag && (!options?.props?.$$host || options.sync === false)`. Kit passes no `$$host`, and the app does not turn on Svelte's experimental async mode (`vite.config.ts:440-444`, `compilerOptions` holds only `runes`; `async_mode_flag` defaults to false, `svelte/src/internal/flags/index.js:2`). So the mount and every effect it creates, `$effect` and `onMount` included, run in the same task, and the browser paints no frame in between.
- `src/routes/+layout.svelte`: renders the children under `TooltipGroup` with no `{#await}` and no condition, and the find, audience and print pages draw in `onMount` with `drawConfiguredTheme` (`find/+page.svelte:61-64`, `present/show/+page.svelte:182-183`, `present/print/+page.svelte:71-72`), which is synchronous for every start: `fileOffers(files)` makes the offers non-null, so an app theme is `ready` with its file or `missing` and drawn as the start (`app-theme.ts:204-222`).
- `src/lib/shell/window/appearance.svelte.ts:117-145`, the workbench's draw: at mount the apps channel has sent nothing, so `appShell.offers().themes` is `null` (`state/system/apps/shell/shell.svelte.ts:411-413`). For a `theme` (or, in the desktop window, `app_theme`) naming an app's theme whose file the first load carries as `null` (the app not approved or disabled, or the file not resolving), `withoutThemes` keeps the null offers (`appearance.ts:479`), `appThemeState` answers `pending` (`appearance.ts:425`), so `app` is true (`appearance.svelte.ts:132`) and `firstFile(shown)` is undefined (`firstDrawFile` answers undefined for a null file). `drawTheme` then awaits `loadAppTheme` (`app-theme.ts:185`) and sets nothing synchronously. The mounted workbench paints with the class the server sent (the start theme's, since `requestStart` found that theme not drawable) and without its derived tokens until the request answers and `applyTheme(document, draw.classes, draw)` runs (`app-theme.ts:186-190`). In the desktop window the start theme is Dark Modern, so those frames drew `--accent-bg`, `--scroll-thumb`, `--scroll-track` and the `-txt` tokens in the light theme's values from `tokens.css`.

The fix: the HTML carries the start theme's derived tokens on the root element, where `applyTheme` sets them, through the same derivation.

```ts
// src/lib/ui/theme/theme.ts:94-106, used by applyTheme at :127
export function derivedTokens(
    className: string,
    tokens: string = tokensCss,
    themes: string = THEME_SHEETS
): Record<string, string> {
    return deriveTokens(resolveTheme(parseBlocks(`${tokens}\n${themes}`), className));
}

// src/hooks.server.ts, pageTheme, :93-99
        const themes = sent ? `${THEME_SHEETS}\n${sheet.css}` : THEME_SHEETS;
        const tokens = Object.entries(derivedTokens(start.classes, tokensCss, themes));
        return {
            rootStyle: escapeAttribute(
                tokens.map(([name, value]) => `${name}: ${value}`).join('; ')
            ),
            bodyClass: escapeAttribute(start.classes),
```

```html
<!-- src/app.html:2 -->
<html lang="en" style="%oculus.root-style%">
```

The sheets are the ones the page's draw uses: `THEME_SHEETS` for a theme of the configuration, and `THEME_SHEETS` plus the block for an app's theme, as `paintLoad` passes them (`app-theme.ts:155-157`). An inline style on `<html>` is what `setProperty` on `document.documentElement.style` writes, so the page's draw overwrites the same properties and no stylesheet order can outrank them. The attribute is escaped with the existing `escapeAttribute` of `data/prose/markdown/markdown.ts:40`, which the class now goes through too (it also escapes `>`); the hook's own `ATTRIBUTE_ESCAPES` table is gone. A throw sends `style=""`.

The hook now imports `$lib/ui/theme/theme`. The layer table of `tests/checks/tree/boundaries.test.ts` binds files under `src/lib` and not `src/hooks.server.ts`, which already imported `$lib/themes/*`, which the server row does not allow either; boundaries passes (verify 3). The sheet assembly stays in one place: `src/lib/themes/` holds 10 items, the folder limit, and `derive.ts` and `vscode-map.ts` are run by the desktop host under Node without Vite, so neither can take the `?raw` imports.

Check: the new G11 row 'sends on the root element the tokens the page derives for the start theme' sends the browser default, the desktop window, `theme: dark` and Ember, and for each compares the root element's tokens in the HTML with what `applyTheme` sets for the same class and sheets (`pageTokens`), and checks the four `--scroll-track` values differ (light, Dark Modern, dark and Ember each have their own). The hook test now hands `vscode.css` its text as well as `tokens.css` and `themes.css` (`:41-58`), so Dark Modern resolves; the rice palettes stay empty in that file, and no row there starts on a rice theme. The throw row checks the root style is empty. On the tree before this round the row fails at its first start: `app.html` had no root placeholder, so `rootTokens` gives `{}` against a non-empty set (read, not run).

Comments made true by the fix: `src/routes/+layout.svelte:41-45` (it said `tokens.css`'s `:root` values give the first paint the same scrollbar; now the first HTML carries the start theme's two), `ui/theme/theme.ts:1-6` and the `applyTheme` comment, `app-theme.ts:8-15`, `appearance.svelte.ts:13-15`, `hooks.server.ts:66-77` and its head comment, and `tokens.css:18-22` (ruling 3). The hook test's head comment names the root element's tokens and the three sheets it hands text.

### 8. P2 and T6: the verify list ran twice in this round

The first run, after the last change to `src/`, ended `test:quick: 177.4 s; failed: svelte-check, eslint`, both in the two test files: `app-theme-start.test.ts:323:58 "Argument of type '{}' is not assignable to parameter of type 'AppOffers'."` and `hooks-server.test.ts:232:68 error void operator is useless here`. The fixes: `themeClass(look.theme, NO_OFFERS, inApp)` (the offers the workbench holds at mount) and a block body for the test's `setProperty`. The second run, after that last change, is quoted under verify 1.

## DONE / NOT DONE

| Check | Command | Output |
|---|---|---|
| Verify 1 | `npm run diagrams && npm run test:quick` | `test:quick: 30 changed file(s), from git since HEAD`, `test:quick: 23 test file(s)`, `ok      prettier (2.5 s): All matched files use Prettier code style!`, `ok      ASCII gate (4.7 s)`, `ok      svelte-kit sync (5.2 s)`, `ok      eslint (28.4 s)`, `ok      svelte-check (29.6 s): 1792706328740 COMPLETED 536 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`, `ok      vitest (63.6 s): Duration  42.63s (transform 70.00s, setup 0ms, import 136.35s, tests 20.18s, environment 4.02s)`, `ok      vitest slow (67.5 s): Duration  46.11s (transform 35.51s, setup 0ms, import 98.86s, tests 43.36s, environment 1ms)`, `ok      vitest checks (116.5 s): Duration  95.45s (transform 13.10s, setup 0ms, import 46.16s, tests 166.26s, environment 2ms)`, `test:quick: 122.2 s; every command passed` |
| Verify 2 | `npx vitest run tests/server/desktop/app-theme-start.test.ts tests/server/desktop/window-guard.test.ts tests/server/desktop/attached-themes.test.ts tests/server/root/hooks-server.test.ts --reporter=dot` | `Test Files  4 passed (4)`, `Tests  64 passed (64)` |
| Verify 3 | `npx vitest run tests/checks/tree/boundaries.test.ts --reporter=dot` | `Test Files  1 passed (1)`, `Tests  11 passed (11)` |
| Verify 4 | `wc -l` (Files, below); `sh utils/folder-check.sh` | every file under its limit; folder-check exit 0, nothing printed |
| Verify 5 | `sh utils/unused-exports.sh` against the base's list | below |
| Verify 6 | history-word grep | below |
| Verify 7 | name grep | below |
| ASCII | `LC_ALL=C grep -n '[^ -~]'` over this round's 12 files; test:quick's ASCII gate | grep printed nothing, exit 1; `ok      ASCII gate (4.7 s)` |

`npm run diagrams` wrote under `docs/diagrams/`, which test:quick counts among its 30 changed files.

## Files

`diff -rq src ../migration-O39-partE-base/src` lists 18 files; with the three test files, line counts base -> now (`wc -l`):

| File | Lines | Changed in this round |
|---|---|---|
| src/app.html | 13 -> 13 | yes, the root placeholder |
| src/hooks.server.ts | 109 -> 191 | yes |
| src/routes/+layout.ts | 2 -> 3 | no |
| src/routes/+layout.svelte | 50 -> 50 | yes, comment (ruling 7) |
| src/routes/+page.server.ts | 91 -> 93 | no |
| src/routes/+page.ts | 34 -> 35 | no (outside the main write list, a comment, accepted by the refuter) |
| src/routes/find/+page.svelte | 134 -> 136 | no |
| src/lib/server/machine/apps/routes/theme.ts | 67 -> 107 | yes |
| src/lib/themes/vscode-map.ts | 585 -> 614 | no |
| src/lib/themes/tokens.css | 343 -> 345 | yes |
| src/lib/ui/theme/app-theme.ts | 226 -> 222 | yes |
| src/lib/ui/theme/theme.ts | 168 -> 154 | yes |
| src/lib/data/helpers/editor/start-theme.ts | 73 -> 154 | yes, `configLooks`'s comment |
| src/lib/shell/window/appearance.svelte.ts | 181 -> 184 | yes, comment |
| src/lib/shell/Workbench.svelte | 456 -> 456 | no (outside the main write list, a comment, accepted by the refuter) |
| src/lib/state/shared/words/appearance.ts | 696 -> 688 | yes |
| src/desktop/app.ts | 393 -> 398 | no |
| src/desktop/windows/start-colours.ts | 115 -> 113 | no |
| tests/checks/tree/boundaries.test.ts | 848 -> 853 | no |
| tests/server/desktop/app-theme-start.test.ts | 271 -> 458 | yes |
| tests/server/root/hooks-server.test.ts | 55 -> 428 | yes |

Edits to an existing assertion, allow list or predicate in this round: none. The changed C11 rows and the new rows are this step's own.

## Unused exports (verify 5)

`diff` of `.agents/worktrees/migration-O39-partE-base/unused-exports.txt` with the run after the last change, the same lines as after the first build:

- `src/lib/themes/vscode-map.ts: MINIMUM, table, GIT_DEFAULTS, basesOf, parseColour, mapTheme` and `src/lib/themes/vscode-map.ts: TokenRule, TypeDefaults, Context, Mapped`: the six added names are kept, each imported by `utils/migrations/convert-vscode-themes.ts:47-56`, which the count does not see.
- `src/lib/ui/theme/theme.ts: CRT_CLASS` gone (moved to start-theme.ts and imported).

`derivedTokens` (imported by `hooks.server.ts:12`) and `NO_OFFERS` raise no line. `RequestStart` is local.

The helpers this round writes, grepped first with `grep -rn "deriveTokens(resolveTheme\|function attribute\b\|function escapeAttr\|iconsShape\|function rootTokens\|function pageTokens\|derivedTokens" src tests`: the derivation was written once, inside `applyTheme`, and is now `derivedTokens`, which `applyTheme` calls; the grep found `escapeAttribute` in `markdown.ts:40`, which the hook now uses in place of its own escape. `iconsShape`, `rootTokens` and `pageTokens` had no match.

## History words (verify 6)

Grep of the comment lines and test titles added or changed against the base copy, for the words of spec.md:44 and package ids or dates, printed five hits:

- `hooks.server.ts`: "so a frame that paints the mounted page before its draw has run": the order of a frame and a draw within one page load. Kept.
- `hooks.server.ts`: "before the app starts, each in a placeholder": a time within one request. Kept.
- `appearance.ts`: "so a half-edited file still draws a page": the existing sentence, rewrapped; "still" is the page drawing despite a bad value. Kept.
- `app-theme.ts`: "whether the draw is still wanted once the load has returned": the existing sentence, rewrapped. Kept.
- `theme.ts`: "a frame that paints the page before its script draws": within one page load. Kept.

None compares with an earlier state of the code.

## Names (verify 7)

`grep -rn -E "RequestStart|derivedTokens|root-style|rootStyle|configLooks|ATTRIBUTE_ESCAPES" src tests config docs README.md --exclude=local.yml` prints `hooks.server.ts:12, 63, 69, 94, 96, 103, 128, 175`, `app.html:2`, `ui/theme/theme.ts:6, 100, 115, 127`, `routes/theme.ts:27, 70, 85, 96`, `appearance.ts:41, 160, 329, 357`, `start-theme.ts:129`. `ATTRIBUTE_ESCAPES` has no hit left. `grep -rn "first HTML"` over `src` lists every comment that names what the first HTML carries; each one that lists its parts names the derived tokens (`app-theme.ts:10-12`, `appearance.svelte.ts:13-14`, `tokens.css:19-21`, `+layout.svelte:44-45`, `hooks.server.ts:128`); the others say only that the HTML carries the start theme and stay true.

## Judgment calls

1. The derived tokens go in an inline `style` on `<html>`, a fourth placeholder `%oculus.root-style%`, and not in a `<style>` block: inline is where `applyTheme` writes them, and in development Vite injects `tokens.css` as a style element appended to the head (`node_modules/vite/dist/client/client.mjs:1229-1239`, `updateStyle`), after the head's own elements, where its `:root` rule would win over a block of equal specificity.
2. The hook imports `derivedTokens` and `THEME_SHEETS` from `ui/theme/theme.ts` (see ruling 7 for why the derivation is not moved).
3. The C4 row is tagged slow with the C6 rows, by the file's 100 ms rule.
4. The class is escaped with `escapeAttribute`, which also escapes `>`; C14's expected class has no `>` and is unchanged.

## Before and after, for the look

- C8, the desktop app on the scratch setup of `plan.md:664`, recorded at 60 frames a second: before, the main window's first frame was the light ground for about 32 frames; after, the main window's, a float window's, a reload's (Cmd-R) and the find bar's (Cmd-F) first frame are the start theme's ground: Ember's red on Ember, Dark Modern's `#181818` on the default config.
- C9, a browser tab on the scratch server (port 8797), on `theme: dark` and on Ember, reloaded under a recording: before, a light first paint then the theme; after, no light frame.
- The find bar in a browser tab (`/find`): before, Dark Modern after a light first paint; after, Light from its first paint.
- `crt.on: true`: the workbench's first paint carries the CRT overlay; the find bar and the presenter's pages show none.
- New in this round, the derived tokens: in the desktop window with `theme` naming the colour theme of an app that is not approved (or whose file is gone), reload under a recording. Before this round the workbench's first frames, until `/api/app-theme` answered, drew on Dark Modern's ground with the light theme's scrollbar (thumb `#8593a7` on track `#fff`) and the light selected-row colour `#e6d6d2`; after, the scrollbar and a selected row are Dark Modern's from the first frame. In devtools, `<html>`'s `style` attribute in the page source holds `--scroll-track`, `--accent-bg` and the `-txt` tokens before any script runs.
- The wallpaper and its `wall` class still come with the script's first draw (Decisions 5).

## Limitations and sharp edges

- `firstAppThemes` runs twice per page boot, once in the HTML request and once in the load, and the HTML request now also derives the tokens over the theme sheets (one `parseBlocks` of tokens.css, themes.css, the rice palettes and vscode.css per page request). Neither cost is measured.
- When the config changes between the HTML request and the data request, the page redraws once (Decisions 4).
- The host's `setUserAgent` call is reached by no test (no test starts Electron); the look on landing is its proof.
- The `<` guard has no row: no theme file reaches it (ruling C15).

## Anything in the brief wrong or impossible

Ruling 3's text predates ruling 7's finding; the comment says what is true after ruling 7's fix (see ruling 3). Nothing else.

## Doc text

G11 (`agents/guarded.md`):
- Code: `src/hooks.server.ts`, `src/app.html`.
- Test: `tests/server/root/hooks-server.test.ts`, describe 'a page sent with the theme it starts on', every row: 'starts a browser on the first row and the desktop window on app_theme, by the mark (C1, C2)', "sends an approved app's theme as its class and the block of its file in the shared style element (C4)", 'sends $row the start the workbench gets (C6)' (float, find, audience, print), 'sends on the root element the tokens the page derives for the start theme', 'sends the start theme and the title for a theme option naming nothing, in a config the read answers with a finding (C10)', 'sends the HTML with no theme and the title when the theme cannot be computed', 'sends the find page in a browser the browser start (C13)', 'writes a class holding a quote, a bracket, an ampersand and a replacement pattern escaped and literal (C14)', 'sends a theme whose file holds a closing tag in a colour with its block, the colour falling back (C15)', 'reads no config and no apps for a request to an API route (C16)'. C4 and C6 are tagged slow.

G118 (`agents/guarded.md`):
- Text, after "by one rule (`startOf`): ... else the first row.": "The page's first HTML is sent with that theme: the body class its first draw sets, the CRT class on the workbench alone, the tokens its draw derives for that class on the root element, and for an app's theme the block of its file in the style element the first draw replaces; a request of the desktop app's window carries the word `oculus-desktop` in its user agent and starts on `app_theme`, a browser's starts on the first row. `crt.on`, `rice.brackets` and `rice.monospace` are read by one function, `configLooks`, for the page and the server."
- Code: add `src/lib/server/machine/apps/routes/theme.ts` (`requestStart`) beside `firstAppThemes`, `src/lib/data/helpers/editor/start-theme.ts` (`bodyClass`, `configLooks`, `desktopMarked`), `src/lib/themes/vscode-map.ts` (`themeSheet`), `src/lib/ui/theme/theme.ts` (`applyTheme`, `derivedTokens`), `src/lib/state/shared/words/appearance.ts` (`lookShape`).
- Test: `tests/server/desktop/app-theme-start.test.ts`, describe 'the theme a page is sent with', 'starts on $row', every row, the three C11 rows included.
