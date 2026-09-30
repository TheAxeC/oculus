Refutation of D13c

Worktree `/Users/axelfaes/workspace/research-hub/.agents/worktrees/D13c/tools/oculus`, base `dc2ffdc3`. Nothing was edited. Git use was limited to `git diff dc2ffdc3` and `git status --short`. My only write was the check log at `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/D13c-refute/checks.log`.

Summary: the verify list is green, every one of the 26 cases is met, and every item of "What to build" holds. There are two findings that need a change:
- **Behaviour:** a code theme whose import fails produces an unhandled promise rejection, and the Settings view then names a theme that is not painted.
- **Spec:** `codeThemeIds()` has no reader, and the list of ids is derived in three places.

Two lesser doc findings are listed below.

## Verification lines

Command: `PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH sh ~/.claude/skills/land/templates/checks.sh .scratch/migration/orchestrator-state.md`, run from `tools/oculus` in the worktree. Exit status 0. The lines below were filtered from the full log with `grep -E '^\$ |Test Files|  Tests |ERRORS|built in|Prettier|checks:'`. In the two build lines the tool's check-mark glyph is written "(check)" to keep this report ASCII.

```
$ npm test
 Test Files  338 passed | 19 skipped (357)
      Tests  5147 passed | 557 skipped (5704)
$ npm run test:checks
 Test Files  27 passed | 2 skipped (29)
      Tests  365 passed | 9 skipped (374)
$ npm run check
1790726872371 COMPLETED 2345 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build
(check) built in 4.37s
(check) built in 12.05s
$ npm run format:check
All matched files use Prettier code style!
$ npm run lint
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 7 commands passed
```

## Commands the report quotes, rerun

- **The step's test files.** `npx vitest run` over the 11 test files the step touches or relies on (paint, ui, theme, code-theme-menu, settings, config, config-folder, tones, help, repositories, boundaries) printed `Test Files 11 passed (11)`, `Tests 259 passed (259)`.
- **Case 14 grep.** `grep -n "codeTheme\|code_theme" src/lib/data/prose/*.ts src/lib/views/shared/code/Code.svelte src/lib/state/shared/words/languages.ts` printed nothing. This matches the report.
- **Where the new names appear.** `grep -rln "code_theme\|codeTheme" src tests config DESIGN.md HELP.md docs` lists only this step's files. This matches the report.
- **Old count.** `grep -rn "six appearance\|six values" src tests DESIGN.md HELP.md` printed nothing. The remaining "the six" hits are about other things.
- **Non-ASCII in docs.** `LC_ALL=C grep -n '[^ -~]' DESIGN.md HELP.md` printed nothing.
- **The spec's perl ASCII gate** over src, tests and config printed nothing. `bin` does not exist, so bfs printed an error for it.
- **Folder count.** `ls src/lib/data/helpers` shows 10 items. This matches the report.
- **Shiki facts.** A `node --input-type=module` read of `shiki/themes` printed `65 44 21 darkSorted true lightSorted true`, `nord` as "Nord", `dark-plus` as "Dark Plus", and andromeeda as the first dark theme. The report's judgment 7 (Shiki's order equals order by display name within each group) holds.
- **Revert claims, checked by reading.** Each named revert would turn its test red:
  - P1 to P9 in `paint.test.ts`.
  - T1 and T2 in `theme.test.ts`.
  - U0 to U9 in `ui.test.ts`.
  - C2 to C5 and CF in `config.test.ts` and `config-folder.test.ts`.
  - S1 and S2 in `settings.test.ts`.
  - M1 to M4 in `code-theme-menu.test.ts`.
  - B1 and B2 in `boundaries.test.ts`.
- **P5 premise.** `normalizeTheme` in `node_modules/@shikijs/primitive/dist/index.mjs:115-152` copies the theme shallowly and then calls `theme.settings.unshift(...)` on the shared `tokenColors` array. Without `structuredClone`, the second paint's registration would therefore carry the first paint's base rule.
- **P8, one caveat.** The test calls `release()` synchronously right after both paints are queued. Under the revert, nord losing the race to dark-plus therefore rests on microtask ordering between two dynamic imports rather than on a forced order. I read it as red under the revert, but it is less deterministic than it could be.

## Item verdicts ("What to build")

1. **`config/appearance.yml`: holds.** The section after `crt:` is at 63-66 and its comment covers everything the brief lists. The head comment (line 4) names the code theme.
2. **`VOCAB_KEYS`: holds.** `code_theme` is at `catalogs.ts:31`. The first frame reads it through `+page.ts` and `setAppearance`.
3. **The list of code themes: holds, with a finding.** `code-themes.ts` exports `CODE_TOKENS`, `codeThemeIds()` and `codeThemeInfo()`, plus `isCodeTheme`. The ALLOWED row in `boundaries.test.ts`, DESIGN.md:169, the `appearance.ts` re-export and the sentence at `load.ts:12-13` are all there. The finding (under Spec) is that `codeThemeIds()` has no reader.
4. **`themeFindings`: holds.** The check sits before the early return (`themes.ts:35-46`), uses `Object.hasOwn`, is case-sensitive and words the finding with `findings.appearance.code_theme`.
5. **`appearance.ts`: holds.** Variable at 60, set at 126, getter at 183-186, and the allow-list entry is present.
6. **`ui.svelte.ts`: holds.** `codeTheme: string | null` defaults to null. `codeTheme()` falls back to `codeThemeDefault()`. `setCodeTheme` and `loadUi` both go through `isCodeTheme`. The envelope stays at version 2 and the counts in the head comments are corrected.
7. **The control: holds.** The pure builder lives in `code-theme-menu.ts`. The `Menu` is placed after the theme menu with "From the theme" first, then dark, then light, and the theme in force is active. The value span carries `data-code-theme`, as `data-theme-name` does.
8. **The paint: holds.**
   - `PaintParts` has `loadTheme` and `codeIds`; a fulfilled load is cached and a rejected one is not.
   - The theme's name stays `oculus`, and `colors` and `type` come from the tokens.
   - Scoped rules have their `background` removed; scope-less rules are dropped.
   - An unlisted id paints `tokens`, and the queue keeps paints in order.
   - The signature includes the id; the head comments are updated; `repaint` passes the code theme through.
   - The rejected paint the brief asks for is what feeds the Behaviour finding.
9. **The editors: holds.** Both editors take `codeTheme` (default `tokens`), paint with it on mount, and repaint on the combined key `painting`. All five parent components pass it.
10. **Docs: holds, with one weak sentence.** DESIGN.md:85, :169 and :289 and HELP.md:23, :145 and :220 are changed. HELP.md:145 is discussed under Standards.
11. **Tests: holds.** Each case is placed where the brief says, and `config-folder.test.ts` and the envelope test follow the new key and field.

## Case verdicts

- **1 Met:** `theme.test.ts`, "is tokens with no key..."; paint test at line 103 unchanged and green.
- **2 Met:** `paint.test.ts`, "paints dark-plus rules..." (`colors` equal `editorTheme(read).colors`, `editor.background` is `--panel`); `ui.test.ts`, first case of the code theme suite.
- **3 Met:** nord's scope-less entry is dropped; github-light's `carriage-return` keeps its foreground and has no background.
- **4 Met for the store.** The repaint of open editors is owed at the look on TEST, as the brief says.
- **5 Met:** `ui.test.ts` for the pick of tokens; `paint.test.ts` "follows a switch back to tokens".
- **6 and 7 Met:** `config.test.ts` and `theme.test.ts`.
- **8 and 9 Met:** `ui.test.ts`.
- **10 Met:** "...none for the same theme again".
- **11 Met:** "follows a switch of the UI theme with the code theme kept".
- **12 Met:** rejection, theme in force kept, tokens paint succeeds, loader asked twice.
- **13 Met:** `code-theme-menu.test.ts` and `settings.test.ts` (the span reads "Nord", and "From the theme" under tokens).
- **14 Met by reading:** the grep above.
- **15 and 16 Met:** `ui.test.ts`. The socket path `installConfig` calls `setAppearance(payload.config)` at `socket.svelte.ts:218`.
- **17 to 19 Met.**
- **20 Met:** the test is named an audit, correctly, since no revert turns it red.
- **21 Met.** See the caveat on how deterministic the P8 red is.
- **22 to 26 Met.**

## Spec

1. **`codeThemeIds()` has no reader, and the list of ids is derived in three places.**
   - Brief item 4 says the check is against "an id `codeThemeIds()` lists", and item 3 asks for the export. `grep -rn "codeThemeIds" src tests` finds only its definition at `src/lib/data/helpers/code-themes.ts:17`.
   - The same list of ids is instead derived again at `code-themes.ts:34` (`bundledThemesInfo.some((info) => info.id === value)`) and at `src/lib/ui/controls/editor/kit/load.ts:133` (`codeIds: bundledThemesInfo.map((info) => info.id)`).
   - The copy in `load.ts` is forced by the ui layer's import rule. The copy in `isCodeTheme` is not.
   - **Failure scenario:** a later change to what counts as a code theme (for example, excluding a theme) edited in `codeThemeIds()` changes nothing, because no code path reads it; the finding, the store and the menu keep the old rule.
   - **Fix:** `isCodeTheme` reads `codeThemeIds()`, or the orchestrator rules the export out.
2. **The three files outside the path list.**
   - `config/text/views/system/config.yml` (`desc_appearance`) is justified. `tests/views/system/help.test.ts:323-330` requires HELP.md to carry the Config view's description of each file verbatim. Item 10 changes HELP.md:220 to name the code theme, and leaving the Config view's description of `appearance.yml` without the new key would leave it incomplete. It was not strictly forced, since an appended sentence would also have passed the test, but it is the right change.
   - `tests/state/shared/words/tones.test.ts` is forced by item 2: that test asserts the exact key list of `vocabCatalog`.
   - `tests/views/sources/repositories/repositories.test.ts` is forced by the required prop `codeTheme: string` on `DiffSection`, which mirrors the required `look: string`.

No other spec finding. No substitute mechanism, no reserved decision taken, and no dependency added. Every case had a first run, reported in the report's table.

## Proof

1. **The first run has no failing output quoted.** For the "seen red first" runs the report quotes only the aggregate (`Tests 27 failed | 130 passed (157)`) plus test names; for the revert runs it quotes test names only. Neither shows a failing assertion line. The names are enough to identify which test went red. I could not reproduce either without editing the source.
2. **The P8 in-flight test is weaker than it needs to be.** `tests/ui/controls/editor/paint.test.ts`, "leaves the last asked paint in force when an earlier load is in flight", calls `release()` synchronously right after queueing both paints, so the window in which nord's load is in flight is a few microtasks. It passes under the correct code. Under the named revert its red depends on dark-plus's import resolving before nord's gated one. A stronger form would release the gate only after the dark-plus paint has settled.

No test asserts a known defect, no threshold was loosened, and the new module-level mutable (`appearance.ts:codeTheme`) is the one the brief asks for and is allow-listed.

## Standards

1. **HELP.md:145 now says the code theme is saved to `config/layout.yml`.** Quoted: "The theme, the code theme, text size, CRT, wallpaper and icons, and the rail list, edited and saved to `config/layout.yml`."
   - The code theme is saved per browser under `oculus.ui.v1`, not in `layout.yml`.
   - The sentence was already loose for the theme and CRT, but the diff adds the new value to it, and the added second sentence does not say the pick is per browser.
   - **Failure scenario:** a reader looks in `config/layout.yml` for their code theme and does not find it.
   - **Fix:** split the row: the appearance values are kept per browser, and the rail list is saved to `config/layout.yml`.
2. **DESIGN.md:85 is ambiguous.** "which the Settings view's Code theme menu overrides per browser, as it does the CRT default" reads as though the Code theme menu overrides the CRT default. It is a wording defect in a changed sentence.

No other standards finding:
- Head comments are present on all three new files.
- No history in any comment (a grep of the added lines for package ids and dates printed nothing).
- The ASCII gate is clean.
- All files are under 1000 lines (largest changed: `config-folder.test.ts` at 679).
- The literal glyph name `glyph="code"` follows the tree's convention (`ChangeGroups.svelte:76` and others), and `code` is in both `glyphs.yml:80` and `icons.yml:79`.
- The 66-item menu scrolls: `FloatingList.svelte:45-46` sets `max-height: var(--bits-floating-available-height)` and `overflow-y: auto`.

## Behaviour

1. **A code theme whose import fails gives an unhandled rejection, and the Settings view names a theme that is not painted.** This is a defect inside the brief.
   - **Where:** `src/lib/ui/controls/editor/Editor.svelte:197` and `src/lib/ui/controls/editor/DiffEditor.svelte:174` (`void loaded.paint(token, codeTheme);`), and `src/lib/ui/controls/editor/kit/look.ts:44-47` (`painted(); void kit.paint(token, code);`).
   - **What happens:** item 8 makes the paint reject. Nothing catches it: `grep -rn "unhandledrejection\|handleError" src` finds only `src/hooks.server.ts`, and there is no client handler.
   - **Why it is realistic now:** the step adds a network-dependent failure source, one dynamic chunk per theme. The base paint could only reject if `createHighlighter` threw.
   - **Failure scenario:** a page is left open across a rebuild, so the theme chunk hashes change, and the reader picks Nord.
     - The import 404s.
     - The browser console shows "Uncaught (in promise) TypeError: Failed to fetch dynamically imported module".
     - The editors keep the previous syntax colours, while the Settings view's value span (`data-code-theme`) reads "Nord" and the pick is saved.
     - `repaint` has already set `painted` to the new key, so nothing retries until the look or the code theme changes again.
   - **Why it is inside the brief:** item 8 fixes the painter's contract (reject, keep the theme, the next paint runs) and item 9 makes the editors the callers of that contract. The spec's rule that every asynchronous path is exercised applies to the callers too. The builder named the risk under "Sharp edges" 2 and left it unfixed and unverified.
   - **Fix:**
     - One helper in `kit/look.ts`, used by the two mount calls and by `repaint`, that catches the rejection and clears the editor's `painted` key, so the next effect run or pick retries.
     - A unit test on that helper with a rejecting stand-in kit: no unhandled rejection, and `painted` cleared.
   - **For the orchestrator:** whether the reader should also be told (a status line, a catalog key) is a new user-visible shape that no brief names. It is Axel's decision and would need booking. The catch itself needs no ruling.
2. **Everything else the report lists matches the diff.** It gives before and after for the Settings row, the three editors, the key and the stored field. It does not say that once a pick is made there is no way back to "follow the config": "From the theme" saves `tokens`, not null, so a later edit of `code_theme:` no longer reaches that browser. That is how brief decision 1 and item 6 define it, but the report should state it among the user-visible changes.

## Declined to judge

- **What the editors look like on screen** (repaint in place, contrast of a dark code theme on a light UI theme): this is DOM and look work, owed at the landing's look on TEST, and I open no browser.
- **The report's first-run counts** (`27 failed | 130 passed (157)`) and the red runs of each revert: reproducing them needs edits to the source or a checkout of the base, which I may not make. I checked each revert by reading only.
- **The client first-chunk size before and after `shiki/themes` joined it:** the build output names chunks by hash only, and comparing against the base would mean building the base, which writes files. My build log shows the page node chunk `nodes/2.B0xqqhNA.js` at 1,833.09 kB (554.91 kB gzip), with no base figure to compare.
- **The slow-tagged `tests/ui/controls/editor/theme.test.ts`:** it is unchanged by the step and the rules forbid running the slow suite.
- **Whether `npm run diagrams` output matches the source:** I was told not to run it. The diagram changes in the diff (`layer-*.dot/svg`, `layers.dot/svg`) add only the new module's edges, which I did not check line by line.

## Usage

claude-opus-5-5 (the transcript's message.model), 44 tool uses, 187,353 tokens, 13.2 min (789,527 ms), from its completion notice.
