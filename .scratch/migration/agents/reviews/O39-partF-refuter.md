# Step O39 part F refuter report (on .agents/worktrees/migration-O39-partF, base d82cd0c3)

A page this report cites (the rules file, a standard, a skill's text) is named with its section, never with a line number, since a page's lines move and a section's name does not. A finding in code keeps its `file:line`.

The report is written in the rules file's character set. A character outside it in a quoted line is written by its name in angle brackets, such as `<tab>` or `<em dash>`.

## Verification (rerun by the reviewer)

```
1. npm run test:quick -- src/app.html src/hooks.server.ts src/lib/shell/window/appearance.svelte.ts src/lib/themes/parse.ts src/lib/ui/theme/app-theme.ts src/lib/ui/theme/theme.ts src/routes/+layout.svelte tests/server/desktop/app-theme-start.test.ts tests/server/root/hooks-server.test.ts docs/diagrams/layers.dot docs/diagrams/layers.svg
test:quick: 11 changed file(s), from the given paths
test:quick: 5 test file(s)
        tests/server/desktop/app-theme-start.test.ts: changed
        tests/server/root/hooks-server.test.ts: changed
        tests/server/root/process/config-cache.test.ts: imports at depth 1
        tests/checks/look/contrast.test.ts: imports at depth 2
        tests/server/desktop/window-guard.test.ts: imports at depth 2
ok      prettier (34.5 s): All matched files use Prettier code style!
ok      ASCII gate (38.6 s)
ok      svelte-kit sync (79.4 s)
ok      vitest (159.1 s): Duration  112.97s (transform 227.82s, setup 0ms, import 346.89s, tests 12.89s, environment 2ms)
ok      vitest slow (165.5 s): Duration  117.70s (transform 39.27s, setup 0ms, import 246.92s, tests 22.74s, environment 1ms)
ok      vitest checks (175.6 s): Duration  129.07s (transform 12.18s, setup 0ms, import 60.83s, tests 65.67s, environment 0ms)
ok      eslint (176.4 s)
ok      svelte-check (230.4 s): 1792748215281 COMPLETED 537 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
test:quick: 309.9 s; every command passed
test:quick: not covered: tests that reach no changed file within the import depth,
            the build, the lint of unchanged files

2. npx vitest run tests/server/root/hooks-server.test.ts tests/server/desktop/app-theme-start.test.ts tests/server/desktop/window-guard.test.ts tests/server/desktop/attached-themes.test.ts --reporter=verbose
 (the new and extended rows, each with <check mark>:)
 |unit| tests/server/desktop/app-theme-start.test.ts > the ground a page is sent with > is taken away by the page's first draw, and a later draw finds none and takes nothing 3ms
 |unit| tests/server/root/hooks-server.test.ts > a page sent with the theme it starts on > sends 'a float window' the start the workbench gets (C6) 243ms
 (likewise 'the find page', 'the audience page', 'the print page')
 |unit| ... > sends the ground of 'theme dark (C1)' in a style element of its own ahead of the head Kit fills 11ms
 |unit| ... > sends the ground of 'the first row in a browser (C3)' ... 16ms
 |unit| ... > sends the ground of 'the shipped config in the desktop win<horizontal ellipsis>' ... 20ms
 |unit| ... > sends the ground of 'theme kanagawalotus (C3b)' ... 16ms
 |unit| ... > sends the ground of 'an approved app\'s theme (C2)' ... 14ms
 |unit| ... > sends the ground of 'an app\'s theme whose app is not appr<horizontal ellipsis>' ... 15ms (two rows)
 |unit| ... > sends no ground for an app's theme 'whose block\'s --bg is no hex colour,<horizontal ellipsis>' 15ms
 |unit| ... > sends no ground for an app's theme 'whose block holds a closing tag, the <horizontal ellipsis>' 19ms
 |unit| ... > sends the HTML with no theme and the title when the theme cannot be computed 13ms
 Test Files  4 passed (4)
      Tests  74 passed (74)

3. npx vitest run tests/checks/tree/boundaries.test.ts   (run four times)
 run 1:  Test Files  1 failed (1) / Tests  1 failed | 10 passed (11)
 run 2:  Test Files  1 passed (1) / Tests  11 passed (11)
 runs 3 and 4, each:
 FAIL  |unit| tests/checks/tree/boundaries.test.ts > layer boundaries > holds across src/lib
 Error: Test timed out in 5000ms.
 FAIL  |unit| tests/checks/tree/boundaries.test.ts > layer boundaries > holds no process-wide state under src
 Error: Test timed out in 5000ms.
 Test Files  1 failed (1) / Tests  2 failed | 9 passed (11)

4. wc -l (after the last change)
      13 src/app.html
     227 src/hooks.server.ts
     185 src/lib/shell/window/appearance.svelte.ts
     130 src/lib/themes/parse.ts
     224 src/lib/ui/theme/app-theme.ts
     176 src/lib/ui/theme/theme.ts
      55 src/routes/+layout.svelte
     490 tests/server/desktop/app-theme-start.test.ts
     569 tests/server/root/hooks-server.test.ts
     101 docs/diagrams/layers.dot
     556 docs/diagrams/layers.svg
   sh utils/folder-check.sh: printed nothing, exit 0

5. sh utils/unused-exports.sh > <scratchpad>/unused-partF.txt; diff <base>/unused-exports.txt <scratchpad>/unused-partF.txt
   exit 0; diff exit 0 (no line added); both 343 lines; first line "Unused exports (230)"

6. git diff -U0 d82cd0c3 -- src tests | (added comment lines and titles) | grep -inE "before|used to|no longer|still|always has been|always had|as before|previously|the step adds|after this package|O39|Z468|2026|part F|part E"
   11 hits: ten "before" (order of events while a page loads: hooks.server.ts GROUND_BAR doc, pageTheme doc twice, the head comment above handle, parse.ts head, theme.ts GROUND_STYLE_ID doc, +layout.svelte both comments, hooks-server.test.ts head) and one "still wanted" (drawTheme doc, a load in flight). None names a package, a date or an earlier state.

7. grep -rn --exclude=local.yml "oculus-ground\|GROUND_STYLE_ID\|ground-style\|themeGround\|GROUND_BAR\|groundElement" src tests config docs README.md
   src/app.html:8; src/hooks.server.ts:9,13,65,69,72,74,91,92,122,130,159,213; src/lib/ui/theme/theme.ts:5,45,135,147; src/lib/themes/parse.ts:7,115,121,126; tests/server/desktop/app-theme-start.test.ts:54,81; tests/server/root/hooks-server.test.ts:40,275,472. No hit in config, docs or README.md.
   grep -rn "'oculus-[a-z-]*'" src: style element ids 'oculus-ground' (theme.ts:45), 'oculus-icon-fonts' (held.svelte.ts:22), 'oculus-app-theme' (vscode-map.ts:559); 'oculus-scheme' (apps/serve/oculus.js:164) is an element of an app's frame document. No collision.

Commands the builder's report quotes, rerun:
- LC_ALL=C grep -n '[^ -~]' over the 11 changed files and the report: printed nothing, exit 1.
- The ASCII perl gate of spec.md over $(find src tests config -type f ! -name local.yml): printed nothing; ls -d bin: "No such file or directory".
- grep -rn "first paint\|first frame" docs README.md: one hit, docs/HELP.md:514.
- grep -rn --exclude=local.yml "first HTML" src tests config docs README.md: the hits the report lists, plus the lines the step wrote.
- grep -rn "scrollbar-color" src: hooks.server.ts:66, +layout.svelte:53, GlyphList.svelte:70, SuggestInput.svelte:185, HueSelect.svelte:102 (the last three `!important`).

Reviewer's own measurement (node --experimental-strip-types over src/lib/themes/parse.ts, a script in the scratchpad, reading the sheets in the server's order):
chars 107725; parseBlocks 0.659 ms; resolveTheme 0.0072 ms
"" #f1f5f9 / "dark" #0b1120 / "vscode-dark-modern" #181818 / "rice kanagawalotus" #e5ddb0 / "dark crt" #0b1120
awk over tokens.css, themes.css, rice/*.css and vscode.css: every `--bg:` sits in a `:root` or `body.<one class>` block; the one nested rule (themes.css:105, @media prefers-reduced-motion) sets `background: none` on body.crt::after only.
```

## Verdicts

Items of the brief's "What to build", in its numbering:

- 1: holds. `src/app.html:8` puts `%oculus.ground-style%` ahead of `%sveltekit.head%`; `pageTheme` (`src/hooks.server.ts:120-130`) reads the ground over `tokensCss` and the same `themes` text `derivedTokens` gets (THEME_SHEETS, or `withThemeBlock` for an app theme); `groundElement` (`:72-75`) writes `html { background: <hex> }` followed by the scrollbar rule of ruling 261 (a). The 7 ground rows and the 4 page-kind rows pass (verification 2). The colour sent equals the `--bg` the page's first draw resolves for the four starts asked about, by reading and by the reviewer's resolve run: the browser default `''` gives `#f1f5f9`, the light theme `rice kanagawalotus` `#e5ddb0`, the desktop default `vscode-dark-modern` `#181818` (the same as `windowColours`'s fill), Ember `#7a1020` (the `--bg` of the block the page's first draw makes from the same file, as the C4 row asserts). This holds because every `--bg` is in a `:root` or single-class `body.` block that `parseBlocks` reads, and the layout loads the sheets (`+layout.svelte:10-13`) in the order `THEME_SHEETS` joins them (`theme.ts:48`). The two copies of the scrollbar rule are Standards 1.
- 2: holds. `themeGround` returns null unless `isHexColour` (`parse.ts:115-118`); `pageTheme` reads no ground for a withheld block (`hooks.server.ts:120-123`); the catch returns `ground: ''` (`:133`). The two C6 rows and the C7 assertion pass. The withheld-block guard is Standards 2.
- 3: holds. `Themeable.getElementById` (`theme.ts:36`), `GROUND_STYLE_ID` (`:45`), `document.getElementById(GROUND_STYLE_ID)?.remove()` (`:147`); the G118 row passes. By reading, every later draw goes through `applyTheme` (`app-theme.ts:158`, `:180`, `:191`), and the sheets are in the document by the first draw, since the layout imports them before any page script runs.
- 4: holds. `themeGround` is called by `windowColours` (`parse.ts:126`) and `pageTheme` (`hooks.server.ts:122`); window-guard and attached-themes pass. On the second parse, judged with no finding: `pageTheme` parses the joined sheets twice, once inside `derivedTokens` and once for the ground, and `windowColours` now resolves the blocks twice. The reviewer's run measured 0.659 ms for one parse of the 107725-character text and 0.0072 ms for one resolve. That is a fraction of a millisecond for each page HTML, and microseconds in the host. The parser exists once, so the DRY clause of spec.md "The principles every package is judged on" holds. A single resolve feeding `deriveTokens` and a ground reader over resolved tokens would remove both repeats; that is a judgment and is not required.
- 5: violated, Spec 2 (the head comment of `parse.ts` does not say what the ground element is or when it leaves). Every other comment the item names was rewritten and reads true. The change to `src/lib/shell/window/appearance.svelte.ts:13-16`, outside "Paths this step writes", is judged acceptable. It is a comment only, rewrapped under 100 columns. Its sentence listed what the first HTML is sent with and credited that list with the first paint, which under the dev server the ground now makes. That is the same reason the brief gives for putting `app-theme.ts:9-16` in item 5, and spec.md "The principles" (the grep-and-carry rule, spec.md:70) asks for such a fix. The report names the path with that reason, as "Where you work" asks. The new text holds by reading: the module's first draw ends in `applyTheme` through `drawTheme`.
- 6: holds. Every row the item names is present and passes. Each positive row's failure on the unchanged tree is quoted. The two C6 rows and the C7 assertion passed on the base, which is the expected result for a case whose behaviour the change keeps (see Spec 1 for the report's wording).

Cases of the brief's "Cases":

- C1: met for the first HTML: the row 'theme dark (C1)' asserts `html { background: #0b1120 } ...` and that the element precedes `%sveltekit.head%`. The frames are not verifiable here; the look at landing settles them.
- C2: met for the first HTML (the row C2, `#7a1020`); the first frame is not verifiable here (the look).
- C1b: met for the first HTML: every ground row asserts the whole element text, the scrollbar rule included. The frames are not verifiable here (the look on a view that scrolls).
- C3: met (the row C3, `#f1f5f9`).
- C3b: met (the two C3b rows, `#181818` and `#e5ddb0`; the reviewer's resolve run gives the same).
- C3c: not verifiable: built-server frames need the look. By reading, the ground element comes before every link Kit writes.
- C4: met for the removal: the G118 row shows that the first `applyTheme` removes the element, and that a second call asks again, finds none and changes nothing. With the element gone and no other `html` background rule in the sheets, the body's background reaches the canvas. The whole window after a change is not verifiable here (the look).
- C5: met (the four rows 'sends $row the start the workbench gets (C6)', each start's ground on each page kind equal to `/`'s); the frames are the look.
- C6: met. The two spy rows pass. By reading, each would fail with its behaviour taken out: without the hex check, `var(--panel)` is sent; without the `sheet === null || sent` guard, `#f1f5f9` is sent for `app-theme`. So neither is a test that passes with the behaviour removed. The spy wraps the real converter and edits only its output. The rows' other assertions (the block sent holding `--bg: var(--panel);`, no block for the closing tag) show that the spy reaches the hook's call.
- C6b: met. The two not-approved rows give `#f1f5f9` and `#181818`. A file that does not resolve has no hook row, and needs none under spec.md's one-row-per-outcome rule. `requestStart` gives `file: null` and the start class for it (`routes/theme.ts:94-95`; G118's rows 'theme naming an app theme whose file does not resolve, in a browser (C5)' and '... in the desktop window (C5)', `app-theme-start.test.ts:378`, `:385`). In `pageTheme` that is the same branch as not approved, with the same outcome.
- C7: met (the row asserts `grounds(sent.html)` is `[]` and no `%oculus.` text).
- C8: met (window-guard and attached-themes pass; `windowColours` with `themeGround` returns the same value as before for every input, by reading).
- C9: met (74 of 74 rows in the four files).

## 1. Spec

- `.scratch/migration/agents/reviews/O39-partF-report.md`, "Anything in the brief wrong or impossible": "Nothing."; what is wrong: item 6 asks that "Each new row is run once on the unchanged tree first and its failure quoted". For the two "sends no ground for an app's theme $row" rows and the C7 assertion, no failure can occur on a tree that sends no ground, and they passed there (the report's own C6 and C7 lines). The section should have said so instead of "Nothing". Failure scenario: the orchestrator reads "Nothing" and books item 6 as met to the letter, while three new checks have no failing run. Verdict: none (item 6 holds; the passes are quoted in the cases section).
- `src/lib/themes/parse.ts:7-13`, the head comment: "themeGround reads from it the theme's ground, its `--bg` as a hex colour, which the server paints the page's first HTML with (hooks.server.ts) and windowColours fills a window of the desktop app with before its page paints"; what is wrong: item 5 names "the head comment of `parse.ts`" among the comments that "say what the ground element is and when it leaves". This one names the colour only. It says nothing of the style element, and nothing of the page's first `applyTheme` taking it away. Failure scenario: a reader of parse.ts takes the ground for a colour the server writes once, and does not know it is a removable element that the first draw takes away. Verdict: item 5 violated. Fixable at landing with one clause.

## 2. Proof

none

## 3. Standards

- `src/hooks.server.ts:65-66` with `src/routes/+layout.svelte:51-54` and `tests/server/root/hooks-server.test.ts:283-286`: "const GROUND_BAR =\n    '* { scrollbar-width: thin; scrollbar-color: var(--scroll-thumb) var(--scroll-track) }';" beside the layout's `:global(*) { scrollbar-width: thin; scrollbar-color: var(--scroll-thumb) var(--scroll-track); }` and the test helper's `const bar = 'scrollbar-width: thin; scrollbar-color: var(--scroll-thumb) var(--scroll-track)';`. What is wrong: one CSS rule is held three times. spec.md "The principles every package is judged on" says "a parser, a fold or a rule exists once and is reused". The two comments name each other, but no check ties them, and the test compares the hook's copy with its own third copy, never with the layout's. One holder exists that both readers can use: a small sheet that the layout imports as a stylesheet and the hook reads with `?raw`, as it already reads `tokens.css`. It needs a path outside the write list (a new sheet, and the layout's rule lines, where the write list allows only the comments of lines 30-49), so this is the orchestrator's to decide: widen at landing or raise. Failure scenario: the layout's rule is changed to `scrollbar-width: auto` (or gains `scrollbar-gutter`) and `GROUND_BAR` is not. Under the dev server the first frames then draw thin bars, and at the first draw every bar widens and the content beside it moves by the difference. No test fails, and the `+layout.svelte:47-50` comment ("draw the same bar") becomes false. Verdict: none (item 1 holds by its text, "as `+layout.svelte:46-49` writes it").
- `src/hooks.server.ts:120-123`: "const ground =\n            sheet === null || sent\n                ? themeGround(parseBlocks(`${tokensCss}\n${themes}`), start.classes)\n                : null;" with the spy row 'whose block holds a closing tag, the block withheld (C6)' (`hooks-server.test.ts:491`). What is wrong: under spec.md's "code larger than its job" (a branch for an input that has not happened, whose wrong answer costs nothing), this guard qualifies. The pageTheme doc (`:96-97`) says "no value of a theme file reaches the block", so `sent` is false for a resolved file only if tokens.css or themes.css ever gains a `<`. The wrong answer would be a light ground in the first frames of a dark app theme, with nothing lost. The row reaches the branch only through a spy. The brief's item 2 and C6 ask for exactly this guard and row, so it is not the builder's defect, and taking it out is the orchestrator's call, not a repair. The non-hex spy row reaches no new code: its branch is `windowColours`'s existing hex check, moved into `themeGround` by item 4. Failure scenario: a reader maintains a guard and a spied row for a state the comment above them calls unreachable. Verdict: none.
- `src/lib/themes/parse.ts:8-10`: "which the server paints the page's first HTML with (hooks.server.ts) and windowColours fills a window of the desktop app with before its page paints, beside the window buttons' symbol colour, which the host reads"; what is wrong: `windowColours` is a pure function that returns two colours; the host (`desktop/windows/start-colours.ts`) fills the window. The base text said "windowColours reads from it the two colours a window ... takes ..., which the host reads". spec.md "The working rules" (prose: name the actual function) and the grep-and-carry rule (a head comment made false is a defect). Failure scenario: a reader looks in parse.ts for the code that fills the window and finds a reader of colours. Verdict: item 5 (with Spec 2), fixable at landing.

## 4. Behaviour

- `src/routes/` (no `+error.svelte`), with `src/hooks.server.ts:120-130`: a page that SvelteKit renders through `app.html` with its default error component (a path no route matches, or a failed load) gets the ground element and never draws a theme, so the element stays for the page's life. What is wrong: the report states this under "Anything in the brief wrong or impossible" only. Its "Before and after, for the look" section has no line for it, though the behaviour changes there too: before, white first frames under the dev server; after, the start ground from the first frame, with the element kept. By reading, the outcome does no harm: the ground equals the body's `var(--bg)` for the body class sent, the scrollbar rule is the layout's, and the page offers no theme change. Failure scenario: the look at landing reloads the four page kinds of C5, never opens an unmatched path, and the one page where the element stays is never seen. Verdict: none.

## Declined to judge

- Every frame: C1, C1b, C2, C3c, C4's whole window and C5's frames under the dev and the built server. A read and a rerun cannot show a frame; the look at landing settles them.
- The builder's first runs on the unchanged tree (12 failed | 32 passed, and 64 passed on the base). Rerunning them means putting the new test files over the base copy, which writes. They are judged by reading the quoted assertion lines, which match the rows.
- `npm run diagrams` and `npm run format`: both write into the tree. The diagram change (`"src to themes"` label 3 to 4) matches, by reading, the new import of `$lib/themes/parse` in `hooks.server.ts:9`.
- The builder's `git diff --numstat`, `git diff -U0` (without a base) and `git diff` of `docs/diagrams`: these git forms are outside the three the reviewer runs. `git diff -U0 d82cd0c3` stood in for verify item 6.
- The builder's git reads against the rules file. spec.md "Where you work" bans every git command for a builder, read-only ones included. The report says the dispatch message allowed read-only git, and `plan-orchestration` SKILL.md (its builder dispatch text, lines 93 and 101) does say "reading with `git status`, `git diff` and `git show` is fine". The dispatch message itself is not on disk. The clash between the two texts is the orchestrator's to raise.
- The boundaries check's three red runs: each red is a 5000 ms timeout on 'holds across src/lib' and 'holds no process-wide state under src', and no assertion failed. One run of the same command passed 11 of 11. That machine load from other suites causes the timeouts is not established beyond that one green run. The step changes no file of that check's own, and its import edges (`hooks.server.ts` to `themes/parse`, `ui/theme`) are of a kind already present at the base.
- Whether `node_modules/vite`'s style injection always precedes the first `applyTheme` on the find and presenter pages: taken from the brief check's reading (Vite 8.3.0 `updateStyle`) and the layout's import order, and not traced again.

Reviewer usage: add6b720b0361987f, claude-opus-5-5, 243598 tokens, 57 tool uses, 24 min 10 s.
