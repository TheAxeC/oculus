# Brief check: O39 part F (`.scratch/migration/agents/briefs/O39-partF.md`, main at 6f89bfeb plus the uncommitted brief)

Read: the brief; plan.md's Goal, the O39 line (`plan.md:655`) and its sub-bullets, the Z468 booking at `plan.md:667`, the rulings at `plan.md:2313-2329` (186 at `:2323`, "Start theme while an app theme loads" at `:2321`, "Theme data in config" at `:2317`); `agents/spec.md` whole; `agents/guarded.md` G11 (`:192-194`) and G118 (`:345-347`); part E's brief; the tree. `git log --oneline -1` printed `6f89bfeb Book ruling 260 (a)`. `git status --short` printed ` M .scratch/migration/orchestrator-state.md` and `?? .scratch/migration/agents/briefs/O39-partF.md`.

Six findings change what the builder would build or check. Each is under its check below.
- (A) "The two sheets" (brief lines 14 and 22) is wrong. The ground has to be read over tokens.css and every theme sheet. If the builder reads only tokens.css and themes.css, every rice theme and every VS Code theme gets a light ground, the desktop start theme `vscode-dark-modern` included. No case would catch it.
- (B) C6 points at part E's C15 row, but that row's block is sent. The brief also leaves open what the ground is when the block is withheld.
- (C) Decision 2 puts the new id beside `APP_THEME_STYLE_ID`. That constant is in `vscode-map.ts`, which the write list does not hold.
- (D) The clause for `hooks-server.test.ts` in the write list is too narrow for a removal inside `applyTheme`.
- (E) "No new test" cites a test rule that is not in spec.md, and it conflicts with spec.md:59 and :71.
- (F) C1 to C3 check only the first frame, and they check only `/` under the dev server. The built server has no case.

## 1. Names

Command: `for n in pageTheme windowColours resolveTheme isHexColour APP_THEME_STYLE_ID; do grep -rn --exclude=local.yml "$n" src config docs tests README.md; done`. I also grepped `applyTheme\b` (with `applyThemeFacets` dropped), `%oculus\.` with the placeholder names, and `oculus-app-theme\|STYLE_ID`, over the same paths. None of these names appears in `config/`, `docs/` or `README.md`.

Hits outside "Paths this step writes", and whether the change makes each one false:
- `pageTheme`: the only hits are in `src/hooks.server.ts` (`:78`, `:129`, `:172`), which is on the list.
- `applyTheme`:
  - `src/lib/ui/theme/app-theme.ts:42`, `:87`, `:157`, `:178`, `:189` are calls and an import. They stay true if the signature is kept. If `Themeable` gains `getElementById`, these callers already pass `Themeable & AppThemeDocument`, so they still type-check.
  - The head comment of `src/lib/ui/theme/app-theme.ts:9-16` ("the server writes its body class, the tokens derived for it on the root element and, for an app's theme, the block ... so the first paint is the theme's") and the doc comment of `drawTheme` (`:143-152`, "The page's first paint comes from the HTML the server sent, which holds the start theme's class, its derived tokens and, for an app's theme, its block") list what the first HTML holds. After the change the list leaves out the ground, which is what makes the first paint right under the dev server. They become incomplete; I read them as not false. The file is not on the write list, and item 5 does not name it.
  - `src/lib/server/machine/apps/routes/theme.ts:77`, `src/lib/data/helpers/editor/start-theme.ts:17` and `tests/server/desktop/app-theme-start.test.ts:282` stay true.
  - `tests/server/root/hooks-server.test.ts:40` and `:251`: `pageTokens` (`:236-252`) passes `applyTheme` a plain object with `body` and `documentElement` only. svelte-check covers tests (`.svelte-kit/tsconfig.json:43-45` includes `../tests/**/*.ts`). If item 3 puts the removal inside `applyTheme` by widening `Themeable`, this fake no longer type-checks. The write list allows edits to that file "only where a row reads the HTML whole", which does not cover this helper. The head comment of the same file (`:1-14`) lists what a page is sent with, and it becomes incomplete.
- `windowColours`:
  - `src/desktop/windows/start-colours.ts:41`, `:110`, `:112` stay true if the signature is kept.
  - The comment at `src/lib/shell/window/strip-colours.ts:11` stays true.
- `resolveTheme`:
  - `tests/checks/look/themes.ts:10` and `:94` stay true.
  - `src/lib/server/machine/apps/read/theme-files/themes.ts:83`, `:114`, `:152` and `src/lib/server/machine/apps/routes/theme.ts:32`, `:47` are a different function with the same name (it resolves a theme file's `include` chain). The change does not touch them, and the builder's grep should not take them for the same function.
- `isHexColour`: `src/desktop/decide/window-options.ts:19`, `:62`, `:121` stay true.
- Placeholders:
  - `tests/server/root/hooks-server.test.ts:103` is the title only and stays true.
  - `:398` is `expect(sent.html).not.toContain('%oculus.')`, which stays true and already covers a leftover new placeholder.
- `APP_THEME_STYLE_ID`:
  - Its definition is `src/lib/themes/vscode-map.ts:559`, `export const APP_THEME_STYLE_ID = 'oculus-app-theme';`, and its head comment (`:7-8`) says the id "is here for the same reason". Decision 2 puts the new id "beside" it, and `vscode-map.ts` is not on the write list. The new id is also not about a VS Code theme, so `vscode-map.ts` is the wrong home for it. A home in `theme.ts` or `parse.ts`, which are on the list, would put it outside `vscode-map.ts` and so would not literally follow decision 2's "beside APP_THEME_STYLE_ID". The brief should name the home.
  - `src/lib/ui/theme/app-theme.ts:5`, `:34`, `:90`, `:101` and `tests/server/root/hooks-server.test.ts:28`, `:257`, `:304` stay true.
- The id value: `src/lib/ui/display/icon-theme/held.svelte.ts:22` already uses `'oculus-icon-fonts'` for another style element. The new id must not collide with it or with `'oculus-app-theme'` (spec.md:71). The brief asks for no collision check.
- `.scratch/migration/agents/guarded.md`: G118's text says "The page's first HTML is sent with that theme: the body class ..., the tokens ..., and for an app's theme the block ...". After the step that text is incomplete. The report's "Doc text" section (brief `:110`) asks only for "G11's and G118's new Code paths". It does not ask for G118's sentence on the ground element, or for the name of the new shared reader in G118's Code line.

## 2. The step line

Requirements, from the booking at `plan.md:667`, from ruling 186 (`:2323`) and its premise correction (`:665`), and the part that serves each:
- A reload under the dev server does not start white, for every theme (dark and Ember named): item 1, with items 2 and 4.
- "The first HTML paints the start theme's ground itself, under the dev server too": item 1.
- The built server keeps no white frame: item 1's last sentence.
- Ruling 186's result (an app's colour theme drawn from the first paint, from the same file the host converts, no new choice source): item 1's clause "for an app's colour theme over the sheets with the converted block". Item 4 (the same reading as `windowColours`) keeps the page's ground and the host's fill equal.
- "No colour of the start theme outlives a later theme change" is not in the line. It follows from decision 1's choice of mechanism, and item 3 serves it.
- "Built before O39's closing" is scheduling and needs no item.

Parts with no requirement in the line or ruling:
- Item 2 (hex only) serves spec.md:71, an untrusted value reaching HTML.
- Item 4 serves spec.md:87 (DRY).
- Item 5 serves spec.md:70.

None of these widens the step.

Pages served by `src/app.html`. `find src/routes -name "+*"` lists four page routes: `/` (with `?float=`), `/find`, `/present/show` and `/present/print`. Item 1 names all four, plus the float window. One more kind of response uses the shell: a path no route matches. `respond.js:708-718` calls `respond_with_error`, which renders the root layout (`respond_with_error.js:45-47`, `:93`) through `app.html` with `event.route.id` null, so `transformPageChunk` runs and the page gets a ground. Its error page calls no `drawTheme` (callers: `appearance.svelte.ts:134`, `find/+page.svelte:64`, `present/show/+page.svelte:183`, `present/print/+page.svelte:72`), so the element stays. It has the same colour as the body, and that page never changes theme. It costs nothing, and naming it in item 1 is not needed.

## 3. Premises

| Brief line | Rerun | Result |
|---|---|---|
| `+layout.ts:3` `export const ssr = false` | `cat -n src/routes/+layout.ts` | holds (line 3) |
| `app.html` 13 lines | `wc -l` | 13, holds |
| stylesheets at `+layout.svelte:10-15` | `cat -n` | holds (10 tokens, 11 themes, 12 rice glob, 13 vscode, 14 code, 15 slide) |
| body rule at `:34-39` | same | holds |
| its comment at `:30-33` | same | holds. The write list says "lines 29-34", but 29 is `<style>` and 34 is the selector; harmless. |
| `pageTheme` at `hooks.server.ts:55-104` | `cat -n` | approximately: `PLACEHOLDER` is 56-57, `PageTheme` 63, the function 78-105 |
| `handle` / `transformPageChunk` at `:152-191` | same | holds (`:181-184`) |
| `derivedTokens` at `theme.ts:102-113` | `cat -n` | 102-114, holds |
| the `<` check at `:87-90` | `cat -n` | wrong lines: the check is `:92` (`const sent = sheet !== null && !sheet.css.includes('<');`); 87-91 build the sheet |
| no theme at `:102-104` | same | holds |
| `resolveTheme` at `parse.ts:84-91` | `cat -n` | holds |
| `tokens.css:9` `--bg: #f1f5f9` | `grep -n -- "--bg"` | holds |
| `themes.css:18-20` `--bg: #0b1120` | same | holds |
| `isHexColour` at `parse.ts:103-108` | `cat -n` | 103-106 (`HEX` at 101) |
| `windowColours` at `:113-118` | same | holds |
| `start-colours.ts:110-112` | `grep -n ""`, lines 95-115 | holds (the merge is `:112`) |
| `applyTheme` at `theme.ts:125-140` | `cat -n` | holds |
| sizes 191 / 162 / 118 / 13 / 50 | `wc -l` | `191 src/hooks.server.ts`, `162 .../theme.ts`, `118 .../parse.ts`, `13 src/app.html`, `50 src/routes/+layout.svelte`; holds |
| G11 and G118 files and describes | `sed -n 192,194p` and `345,347p` of `guarded.md` | holds |
| verify list | `grep -n verification .agents/plan.yaml` | `4:verification: .scratch/migration/orchestrator-state.md`; holds |
| no ADR folder | `ls docs/adr` | "No such file or directory"; holds |
| `docs/HELP.md:514` | `grep -rn "first paint\|first frame" docs README.md` | one hit, `docs/HELP.md:514`, "...the page draws it from its first paint..."; holds |

"The ground of a theme: `--bg` resolved for the body class string over the two sheets" (line 14, repeated in item 1, line 22) is wrong:
- `pageTheme` derives over `tokensCss` and `THEME_SHEETS` (`hooks.server.ts:93-94`).
- `THEME_SHEETS` is `[themesCss, ...riceSheets, vscodeCss]` (`theme.ts:37`).
- `windowColours` in the host reads tokens.css, themes.css, the rice files and vscode.css (`start-colours.ts`, `themeSheets`).
- `grep -c -- "--bg:"` counts a `--bg` in each of the nine rice files and 19 in `vscode.css`.
- The desktop start theme is `vscode-dark-modern` (`config/defaults/appearance.yml:63`), and its `--bg: #181818` is at `vscode.css:382`.

Item 1's own clause "the same sheets `derivedTokens` reads in `pageTheme`" is right. The two sentences contradict each other, and only the second is true.

The cause, read in SvelteKit 2.70.3 (`node_modules/@sveltejs/kit/package.json:3`). It holds for the layout's stylesheets:
- With `ssr === false`, `page/index.js:123` and `:140-155` call `render_response` with the branch nodes, without their load functions, "so that the styles and fonts are linked in the head".
- `render.js:286-299` collects `node.stylesheets` and `node.inline_styles()`. `:315-326` inlines the styles, and `:330-345` links the stylesheets.
- In dev, `exports/vite/dev/index.js:194-197` sets `result.stylesheets = []`. `inline_styles` (`:231-258`) collects CSS only from `module_nodes`, which are filled by `result.component()` (`:202-210`, called only by an SSR render) or by resolving a universal node whose `page_options.ssr` is not false (`:214-222`).
- `+layout.ts` has `ssr = false` and the layout component is never resolved, so none of the layout's stylesheets reach the dev server's first HTML.
- Nuance: the leaf `+page.ts` has no `ssr` export, so its import graph is resolved and could inline CSS it imports. I did not check that graph. It does not change the conclusion for the ground. The booking at `:667` reports no stylesheet in the first HTML.

The built server links the node stylesheets (`render.js:330-345`), as the brief says.

The library claim holds by the same reading. Dev inlining depends only on `module_nodes`, and no option fills them for an `ssr = false` route.

The base copy the brief names in verify item 5, `.agents/worktrees/migration-O39-partF-base/`, does not exist yet (`ls`: "No such file or directory"). /spec makes it after the brief check, so this is noted, not a defect. Unlike part E (`O39-partE.md:24`), the brief names the base copy only in verify item 5 and names no worktree (spec.md:32-33).

## 4. Cases and checks

- "No new test" (brief `:42`) does not match the rules file.
  - Its reason ("a frame of the wrong colour loses no work, breaks no installation and accepts no wrong configuration, so the rules file's test rule gives it none") is not in spec.md: `grep -n "loses no work\|broken installation\|wrong configuration" .scratch/migration/agents/spec.md` exits 1.
  - spec.md's test rule (`:59`) says a guarded entry keeps one test per unit, "with one row per input that gives a different outcome". G11 covers `hooks.server.ts` and `app.html`. The ground element (sent for a hex `--bg`, not sent when the start cannot be computed) is a new outcome of that unit.
  - spec.md:71 makes a value from a feed or an app that reaches HTML untrusted. The ground of an app theme comes from the app's file, and item 2 is the guard on it.
  - Part E wrote G11 rows for every other piece the first HTML carries (`hooks-server.test.ts:280-436`).
  - The removal in `applyTheme` is a new outcome of a unit G118's Code line names (`theme.ts` `applyTheme`). `theme.ts:28-34` shaped `Themeable` so that "a test can hand it a plain object". This is not the DOM-only behaviour spec.md:65 sends to the look.
  - Judgment: rows belong in G11's describe and in a G118 file, under existing entries, so no new entry is needed. The rows: the ground for `dark`, Ember, the first row, a VS Code row, and each page kind in the C6 table; no ground when the start cannot be computed (the existing `:385` row); `applyTheme` removing the element, and a second call doing nothing.
- C6 does not match the tree.
  - It names "part E's C15 row" as an input "whose block holds `<`". That row (`hooks-server.test.ts:416-426`) asserts the block is sent (`expect(themeStyles(sent.html)).toEqual([converted(fallback)])`) and holds no `<`.
  - The converter writes every `--bg` with `hexOf` (`vscode-map.ts:297-300`, `:428`), so the row's fallback block carries a hex `--bg`. The step as written would send a ground there, and C6 expects none.
  - The branch where the block really is withheld (`hooks.server.ts:92`) has no reachable input (comment `:73-76`).
  - The brief never says what the ground is when the block is withheld. Resolving `app-theme` over `THEME_SHEETS` without the block gives `:root`'s `#f1f5f9`, a hex, so item 2 would send a light ground for a dark app theme.
  - The brief should state: no ground when the block is not sent. C6 should drop the C15 reference.
- C1 to C3 and C5 to C7 cannot be shown on "G11's existing test harness as its rows run" (brief `:30`). No existing row reads the ground, so running the rows shows nothing about it, and the builder's check reduces to reading.
- C1's "before any `<script>` and `<link>`": in the harness `TEMPLATE` holds `%sveltekit.head%` unexpanded. The builder can check only that the new placeholder precedes `%sveltekit.head%` in `app.html:8`, where today `%oculus.theme-style%` follows it.
- Cases that point at places the step does not change:
  - C8 (the host's fill; `start-colours.ts` is not changed, but `parse.ts` is if `windowColours` is refactored). Justified.
  - C6 (part E's C15 row, wrong, above).
  - C4 (Settings and `:theme`, which is the look). Justified.
  - Item 5 asks that `docs/HELP.md:514` be kept, a place left as it is. It is settled in the brief.

## 5. The question

- C1 to C3 (the look): yes, they can pass. Each checks "the first frame". A white frame after the first one (for example between the ground's removal and the sheets) would pass. Part E's C9 used "no light frame" over every frame after the reload. By reading, Vite 8.3.0's `updateStyle` (`node_modules/vite/dist/client/client.mjs:1229-1247`) appends the style synchronously when the CSS module evaluates, before the layout mounts, so no such frame is expected. The check should still be "no white frame from the reload to the drawn page".
- C1 to C4 are taken only for `/` under the dev server. A ground missing on the other pages, or a regression under the built server, would pass every case (see C5).
- C4: it can pass while no start colour is left on `/` under the dev server alone. The mechanism is the same under the built server, so reading covers the rest.
- C5: yes. It is checked by reading only, no row asserts the ground, and the look does not open those pages. A ground computed only for route `/` passes.
- C6: it is not tied to the goal (it guards safety), and its premise is wrong (section 4).
- C7: the existing row does not assert that the ground is absent. A ground computed outside `pageTheme`'s `try` passes.
- C8 and C9: regression guards. They pass with or without the goal. With no new rows, C9 passes if the ground element is dropped later.
- Item 1: yes. A reading "over the two sheets" passes C1 to C3 (dark is in themes.css, light is `:root`, Ember is its block) while every rice and VS Code theme, the desktop window's start `vscode-dark-modern` included, gets `#f1f5f9`, a light first frame on a dark theme under the dev server. No case covers a rice or VS Code theme.
- Item 2: no input reaches its branch. `grep` of every `--bg` in `src/lib/themes/rice` and `vscode.css` found none that is not hex, and the converter always writes hex. It cannot affect the goal.
- Item 3: holds by reading for every page that draws. Every later draw goes through `applyTheme` (`app-theme.ts:157`, `:178`, `:189`). Only the unmatched-path page never draws, and that is harmless.
- Item 4: it can pass without the goal (it is DRY only). Item 5 likewise.
- The line's own check ("built before O39's closing", taken at the look): it passes with C1 alone, so it carries the same first-frame and `/`-only weakness as above.
- The root-style tokens of part E are the other way a start colour could outlive a theme change. `deriveTokens` emits its keys from the hex colour tokens (`derive.ts:52-55`, `:230-232`), and `grep -cE` of non-hex colour tokens over `themes.css`, `vscode.css` and `rice/*.css` printed 0 for each file. The key set is therefore the same for every shipped theme, and nothing of the start survives through them.

## 6. Implied inputs

Missing from "Cases", with the expected result:
- A VS Code row and a rice row, whose `--bg` lives in `vscode.css` or a `rice/` file. This has happened: it is the desktop window's default start (`app_theme: vscode-dark-modern`, `appearance.yml:63`). A wrong answer brings back the very defect. Expected:
  - a marked request with default config gives `html { background: #181818 }`;
  - `theme: kanagawalotus` (class `rice kanagawalotus`, `appearance.yml:55`) gives `html { background: #e5ddb0 }` (`rice/kanagawa.css`).
  - The harness empties the rice sheets (`hooks-server.test.ts:11-13`), so a rice row needs the rice files mocked as tokens, themes and vscode are.
- The built server (`vite build` then `vite preview`). Item 1 promises "what it is now", and the packaged app runs this server. Expected, as part E's C9: `theme: dark` and Ember each draw their ground in every frame after a reload, and after choosing light no `#0b1120` is left.
- Pages other than `/` under the dev server at the look: a float window, `/find`, `/present/show`, `/present/print`. Expected: the start ground in every frame.
- An app theme passed over (app not approved, or file not resolving). Expected: the ground of the start theme the body class is sent with (`#f1f5f9` in a browser, `#181818` when marked). The cost of a wrong answer is one colour change.
- Covered or unreachable:
  - The rice and CRT classes: `dark crt` gives `#0b1120`, since `body.crt` sets no `--bg` (`themes.css:84`, `:97`, `:106` are pseudo-element rules that `parseBlocks` skips). `rice-plain` and `rice-sans` set none either.
  - A theme with no hex `--bg` (C6) is unreachable today.
  - A start that cannot be computed is C7.
  - A later theme change is C4.
  - The desktop window is C8.

## 7. ADRs

None exists: `ls docs/adr` prints "No such file or directory".

## 8. Dictated text

- `grep -n 'html { background' .scratch/migration/agents/briefs/O39-partF.md` gives `:22` (`html { background: <colour> }`) and `:32` (`html { background: #0b1120 }`). Holds: ASCII, and the colour is read from the sheet at run time, not a raw hex in source (spec.md:50).
- `grep -n 'Everything in the brief is done'` gives `:102`. Holds (the wording of spec.md:82).
- `grep -n '"Doc text"'` gives `:110`. The heading holds. Its content requirement is short (section 1).
- `grep -n "'still true' or 'rewritten'"` gives `:96`. Holds (spec.md:70).
- `LC_ALL=C grep -n '[^ -~]'` over the brief printed nothing (exit 1). The brief is ASCII.

## Findings whose fix widens the step

- `src/routes/+layout.svelte:41-45`, the scrollbar comment, ends "The page's first HTML carries the start theme's two on the root element (hooks.server.ts), so the first paint draws the same bar." This is false under the dev server for the same cause the brief names: the `scrollbar-color` rule is the layout component's style, which the dev server's first HTML lacks. This step does not make it false. Correcting it extends the write list from lines 29-34 to 41-45 of a file already on it. Widens the step.

## Declined to judge

- What a frame actually shows under the dev or built server: the task forbids starting a server or driving a browser. Frame claims above are by reading.
- Whether `src/routes/+page.ts`'s static import graph inlines any CSS into the dev server's first HTML (`dev/index.js:214-222`): not traced. It does not bear on the ground.
- How `npm run app` serves in development beyond `src/desktop/server/build.ts:3-22` (`vite build --mode app`): not read further.

Usage: af556f98c3e4cc9ab, claude-opus-5-5, 228914 tokens, 59 tool uses, 10 min 42 s

## Closed

Every finding inside the step's line is closed in `agents/briefs/O39-partF.md`; the one finding the check marked as widening the step is open item 261.

- (A) "The two sheets": the premise and item 1 now read `tokens.css` and `THEME_SHEETS` (themes.css, every rice file, vscode.css), with `vscode-dark-modern` (`#181818`) and `kanagawalotus` (`#e5ddb0`) named; C3b added for them.
- (B) C6: the reference to part E's C15 row is dropped; item 2 and C6 say an app theme whose block is withheld sends no ground element, with the reason (a ground resolved without the block is the light `:root` one).
- (C) Decision 2: the id is an exported constant in `src/lib/ui/theme/theme.ts` beside `applyTheme`, distinct from `'oculus-app-theme'` and `'oculus-icon-fonts'`; the premise lists both ids.
- (D) The write list now holds `tests/server/root/hooks-server.test.ts` whole for its head comment, its mocked sheets, `pageTokens` and the new rows, and `tests/server/desktop/app-theme-start.test.ts` for the `applyTheme` row.
- (E) The tests: item 6 adds rows under G11 (the ground for dark, the first row, the desktop mark's default, a rice row, an app theme, each page kind; no ground for a start not computed and a withheld block) and under G118 (`applyTheme` removes the element, a second call changes nothing), as spec.md:59 asks of a new outcome of a unit an entry covers; decision 4 says no new entry; "No new test" is gone.
- (F) The look checks every frame from the reload to the drawn page (C1), the built server (C3c) and each page kind under the dev server (C5); C6b added for a theme passed over.
- Section 1: item 5 and the write list add the comments of `app-theme.ts:9-16` and `drawTheme` (`:143-152`) and the head of `hooks-server.test.ts`; the report's "Doc text" adds G118's sentence on what the first HTML holds.
- Section 3: `isHexColour` at `parse.ts:103-106`, the withheld block at `hooks.server.ts:92`, the layout comment at lines 30-33; the ground element precedes `%sveltekit.head%` in `app.html` (item 1).
- Widens the step: the scrollbar comment of `src/routes/+layout.svelte:41-45` ("so the first paint draws the same bar"), false under the dev server for the same cause, which this step does not change. Raised as open item 261; Axel ruled (a) on 2026-10-23: item 1 and C1b now send the scrollbar rule in the ground element, and the write list holds `+layout.svelte` lines 30-49.
