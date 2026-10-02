D14 refuter report (reviewer, read only; worktree /Users/axelfaes/workspace/research-hub/.agents/worktrees/D14, base eaf8034f)

## Verification lines

The command was `cd .../worktrees/D14/tools/oculus && PATH=... sh ~/.claude/skills/land/templates/checks.sh .../orchestrator-state.md`. It exited 0. The lines it printed are quoted below; the vite chunk listing and the plugin-timing lines of `npm run build` are left out.

```
$ npm test
> vitest run --tagsFilter '!slow' --exclude 'tests/checks/**'
fatal: Needed a single revision
 Test Files  515 passed | 24 skipped (539)
      Tests  12806 passed | 639 skipped (13445)
   Duration  215.82s (...)
$ npm run test:checks
 Test Files  29 passed | 2 skipped (31)
      Tests  446 passed | 9 skipped (455)
$ npm run check
1790966045568 COMPLETED 3178 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build
✓ built in 27.25s
$ npm run format:check
All matched files use Prettier code style!
$ npm run lint
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 7 commands passed
```

No test timed out in this run. The report's first line ("NOT DONE: the verify list never printed `checks: 7 commands passed`") is therefore settled by this run.

I also re-ran the commands the builder's report cites:
- `sh utils/folder-check.sh`: exit 0.
- `wc -l`: terminals.svelte.ts 888, routes.ts 613, content/latex.ts 329, Editor.svelte 530, Source.svelte 509. These match the report.
- The spec's ASCII perl gate prints nothing. It also printed `bfs: error: bin: No such file or directory`, since this tree has no `bin` folder.
- The report's rename grep (`grep -rn "project\.latex\.\|sessions/latex\.test\|latex\.state(['\"]" ...`) prints only `project.latex.heading` (Latex.svelte:31 and project.test.ts:373 and 436). This matches the report.
- `ls src/lib/data/helpers | wc -l` prints 10 and `ls tests/views/sources | wc -l` prints 10. Both match.
- Parse time (case 20), measured with my own script calling `readTex` over `find funding applications projects -name '*.tex'`: `files 231 median 2.58 max 85.36 refused 4`. The report has 3.29 and 71.16 ms. Both runs are under the brief's stops, so the decision holds. The 4 refused files are the same in both.
- Mutation record `scratchpad/d14/mutations.out`: 126 ids. The last row of each has at least one failure, except h7, which the report explains (it is not a mutation). The claim of 125 mutations holds.

## Item verdicts ("What to build")

1. **Holds.** `mainsIn`, `isMainOf`, `mains` and `programOf` are in content/latex.ts:131-179, and `program` is on `MainState`.
2. **Holds.** Built in endpoint.ts with a zod `queryShape`. The project form's outline answer is against the hub, not the project folder (finding Spec 6).
3. **Holds.** root.ts. The test of the fall-through for a root comment outside the root does not discriminate (finding Proof 3).
4. **Holds.** `latexFolderShape` (zod), `latexCommand` exported with `LATEX_SWITCH`, the store's `latex(target, ...)`, and the Log control.
5. **Holds.** The tab glyph `publish` and the instance key `label` are judged in findings Spec 3 and Spec 4.
6. **Holds.** `latexDiagnostics()` exists, and markers reach the editor through the `extension` prop.
7. **Holds.** `rowFacts` reads `fs.heldEntries`, which only peeks at what the fs store holds and never fetches.
8. **Holds, with one departure the report states.** The reader is at `data/helpers/files/latex.ts` instead of the brief's `data/helpers/latex/`, because of the folder limit (finding Spec 2). The Files Outline goes through `readTex`, and the parse time was measured.
9. **Holds.** It adds a 2 MB skip rule that the brief does not name (finding Spec 6).
10. **Holds.** tools.ts `readCount` and `run`, with the 502 and 504 answers.
11. **Holds.** kit/latex.ts and kit/latex-widget.ts. `Editor.svelte` is at 530 lines.
12. **Violated when two LaTeX editors are mounted** (finding Behaviour 1). It holds for a single one.
13. **Violated in part.** `onSaved` exists and the build is not shown, but nothing in the row says it is building (finding Spec 1). The call site differs from the brief: the build is started from the source store's save function instead of `Source.svelte` (finding Spec 5).
14. **Holds.** `isMainOf` is checked before any read or process. `outlineAnswer` calls `realPath` before the check, which only stats the path.
15. **Holds.** DESIGN.md:406 and HELP.md:152 and 156 are rewritten. The new DESIGN sentence "one build at a time per main file" is false in a window (finding Standards 2).
16. **Holds.** `"latex-utensils": "7.0.0"`. The lockfile also adds the optional dependencies `commander` 11.1.0 (MIT) and `pegjs-backtrace` 0.2.1 (ISC); the report states this in judgment call 3.

## Case verdicts

1. Met.
2. Met.
3. Met.
4. **Partial.** The "outside the root falls through to the folder rule" test (latex-root.test.ts:45-52) has no main in the folder, so it passes whether or not the folder rule runs. A main placed in that folder would settle it.
5. Met.
6. Met.
7. Met.
8. Met.
9. **Partial.** The `count` and `outline` parameters are covered by all four bad names. For the terminal action, only `intro.tex`, `../../../etc/passwd` and `main.tex; touch nope` (project form) and `chapter.tex` (folder form) are tested. A `-v.tex` that is a real main and the absolute `/etc/passwd` are not run through the action. Adding them to terminal-actions.test.ts would settle it.
10. Met.
11. Met.
12. Met. The tests are pure; the press is checked at the look.
13. **Partial.** The two folder-target watch tests pass on the unchanged tree (finding Proof 2). The rest is met.
14. Met. The building indicator of item 13 has no case.
15. Met.
16. Met.
17. Met. The shipped Outline cases passed in the first run and pass now.
18. Met.
19. Met.
20. Met, reproduced: median 2.58 ms, maximum 85.36 ms.

## Spec

1. **Item 13's "an open view's row says it is building" is not built.**
   - Place: `views/shared/latex/Main.svelte:98-166`. `LatexMain` (`latex.svelte.ts:57-71`) has no building field, and `config/text/views/academic/latex.yml` has no key for it.
   - Failure: Axel saves `c6.tex`, latexmk runs hidden for 20 s, and the LaTeX view shows nothing until the PDF time changes. A save that builds nothing looks the same as one that does.
   - The DONE row 13 of the report does not say this. Verdict: item 13 violated in part.
2. **Location of the shared reader** (judgment call 1).
   - `data/helpers/` is at 10 items, so the brief's `data/helpers/latex/` was impossible; the report is right about that.
   - `data/helpers/files/` holds helpers about file names, paths and kinds. `data/prose/` holds `markdown.ts`, whose head comment is "One rule, imported by both sides". That is the same concern as the LaTeX reader, and the folder holds 2 items.
   - Judgment: `data/prose/latex.ts` is where the concern already lives (the spec's "a new file goes where its concern already lives"). The `boundaries.test.ts` entry would then name `data/prose/latex`. This is a reversible choice for the orchestrator.
3. **The tab glyph `publish`** (judgment call 11).
   - `glyphs.yml:53` `publish: "[^]"` and `icons.yml:52` `publish: cloud-upload`. `publish` is also Source Control's Publish action (`repositories.ts:791-804`).
   - A cloud-upload icon on a LaTeX tab reads as "upload or publish branch". Judgment: a poor fit. A glyph that reads as a typeset document is needed; `book` is already the Doc view's (`doc.yml:11`).
   - This is a user-visible choice; the report names it as one.
4. **Instance-state key `label`.** The view reads `label` beside the brief's `{ root, path }` (academic/latex/Latex.svelte:43), and `row-menu.ts` writes it.
   - This is a key in the saved layout under `~/.oculus`. It follows the `file` view's existing `label` convention, but the report does not list it as a decision.
5. **Build on save is started from the source store's save** (`source.svelte.ts:405-409`, wired in `context.ts:306`), where the brief named `Source.svelte`.
   - The report states this (judgment call 5).
   - Judgment: the better placement. It covers Open Editors' Save All (`OpenEditors.svelte:89-97`), which a call in `Source.svelte` would miss.
   - It also makes a Timeline restore (`Timeline.svelte:135`, which calls `saveSource`) start a hidden build. The orchestrator should accept that consequence explicitly.
6. **Wire bases and an unnamed rule in the project form.**
   - Decision 3 says the `?id=` paths are relative to the project folder.
   - In the project form, `errors[].file` is relative to `manuscript/` (prefix `''`, `latex.ts` `buildState`), `pdfPath` is relative to the project folder, and the outline's `file` is relative to the hub (`endpoint.ts:107` `bound: realPath(into.hub)`, `outline.ts:56`). That is three bases in one answer.
   - The store copes, since the project form is drawn under `HUB_ROOT`.
   - `OUTLINE_MAX_BYTES` (2 MB, `outline.ts:18`) lists a large file as "not read". Neither this nor the outline base is a decision in the brief or in the report.
7. **Premises:** every premise I checked reproduces.
   - Read on the staged base copy: content/latex.ts 347, routes.ts 558, latex.svelte.ts 208, terminals 887, Latex.svelte 247, row-menu 364, Tree.svelte 379, outline.ts 143, Source.svelte 496 with `save()` at 327-328, Editor.svelte 518, kit 8 items, `views/academic` holding present and slides, `latexCommand` at :363, `startLatex` at :383, `'latex'` at :483, katex at package.json:69, `instanceText` and `instanceMap` at instance.ts:36-41.
   - The brief's verify step 1 directory (the worktree root) is wrong, as the report says. I ran it from tools/oculus, as the state file's comment says.
8. **ADRs:** `ls docs/adr tools/oculus/docs/adr` prints "No such file or directory" for both. No ADR is contradicted.

## Proof

1. **The first run is not quoted per test in the report.**
   - The report gives per-file aggregates and points to `scratchpad/d14/first-summary.txt`. That file exists (44,813 bytes) and holds the per-test lines.
   - The spec requires the report to quote each new or changed test's failing line on the unchanged tree.
2. **Two new tests of the folder target pass on the unchanged tree.**
   - `first-summary.txt` shows `passed | ... asks again on every sessions push while a watched build runs, and stops when it ends` and `passed | ... asks again at once for a folder whose build is watched` (tests/state/sessions/latex/folder.test.ts:115 and 140).
   - They count requests (`seen.asked` length) and never the address. A store that sent `?id=[object Object]` passes them, as the unchanged tree did.
   - The report does not flag them. Verdict: case 13 partial.
3. **One root test does not discriminate.** latex-root.test.ts:45-52 ("falls through for a root comment naming a file outside the root") expects `null` with no main in the folder. It still passes with the fall-through removed (an early `return null`). Verdict: case 4 partial.
4. **Case 9 is not run through the terminal action** for a dash-named real main or an absolute path (see case 9).
5. **A file-scope mutable was added in a test:** tests/routes/sessions/latex.test.ts:26 `let BIN = ''`, assigned in `beforeAll`. It sits beside the existing `let HUB`. The spec's no-globals rule covers test files too. Minor.
6. **The report contradicts itself on allow lists.**
   - Judgment call 14 says "No allow-list entries were added to `tests/checks/**`".
   - `tests/checks/tree/boundaries.test.ts:150` adds `'data/helpers/files/latex'` to the `ALLOWED` state row. The same report lists that edit under "Edits to existing assertions". The edit itself follows the existing `data/helpers/files/*` rows.
7. **No list of asynchronous paths.** The spec requires each asynchronous path with its in-flight, after-close and superseded test, or why a case cannot occur. The report has no such list.
   - Paths added: the folder state load, `outline`, `count`, `rootOf` and `onSaved`, `build`, `format`, the hover's `show`, the row menu's `latex()` and latex-editor's `folder()`.
   - Most cases have tests: after close for state, outline and count; superseded for count, onSaved and format; in flight for the widget.
   - Missing: `build()` while its `terminals.latex` request is out (finding Behaviour 2), and the row menu's `latex()` picked twice.

## Standards

1. **New literal English refusals reach the reader.**
   - In endpoint.ts: `:119` `'root is missing'`, `:121` `` `${path} is ${found.error} for the root ${root}` ``, `:139` `` `${path} is not a folder` ``, `:168` `` `${main} is not a main file of this folder` ``.
   - In routes.ts: `'root and path do not name a folder of a served root'` and `` `main is not a main file of this ${folder.scope}` ``.
   - They are drawn inside `latex.read_failed` and `latex.refused` (Rows.svelte:29, Main.svelte:73). Example: "the folder was not read: proposal is missing for the root docs".
   - The server catalog is at hand (`into.catalog`, `server.latex.*`). The spec says every user-facing string comes from a catalog and an engine error is mapped to a catalog line. The project form already had sentences like this; the step adds new ones.
2. **A sentence the diff makes false.**
   - `latex.svelte.ts:32-33` says "A main file is never built twice at once", and DESIGN.md:406 says "one build at a time per main file". Both are false in the window of finding Behaviour 2.
3. **Clean otherwise:**
   - Head comments are present on every new file.
   - The only history-like words in comments are "still" in a runtime sense.
   - No module-level mutable in `src`. The only `as` hit is a type import.
   - ASCII gate, folder check, sizes and catalog orphans are all green.

## Behaviour

1. **Format Document does nothing in the earlier of two mounted LaTeX editors.** Not reproduced in a browser; read from Monaco 0.57.0's source.
   - `kit/latex-widget.ts:203-217` registers `registerDocumentFormattingEditProvider(model.getLanguageId(), ...)` once per model, and returns `[]` when `asked !== model`.
   - Monaco sorts providers of equal score newest first (`languageFeatureRegistry.js:148-168`).
   - Standalone Monaco's selector is `FormattingConflicts.setFormatterSelector((formatter, document, mode) => Promise.resolve(formatter[0]))` (`editor.api.js:19`).
   - Scenario: `main.tex` and `c6.tex` side by side; Shift+Alt+F in the first-opened tab picks the second tab's provider, which answers `[]`. Nothing changes and no sentence is shown. Each landing re-runs the extension and re-registers, so which tab works changes over time.
   - Fix: one provider per language that dispatches on the model, or a selector that matches only that model's URI. Verdict: item 12 violated.
2. **One main can be built twice at once.**
   - `build()` (`latex.svelte.ts:511-522`) skips only when `live(running.terminal)` is true. `live` reads the last `sessions` payload, and the entry is set only after `terminals.latex` answers.
   - So in the window from the POST until a `sessions` push lists the new terminal, a second save starts a second latexmk in the same folder. The test at folder.test.ts:586 pushes the terminal list before the second save, so it never meets the window.
   - Scenario: Save All in Open Editors with two dirty chapters of one thesis gives two latexmk runs writing the same `.aux` and `.log`. Not measured.
3. **Project panel changes the report does not state with before and after.**
   - The place text of a problem is now the hub-relative path (`projects/manuscripts/alpha/manuscript/sec/b.tex:12`; before it was `sec/b.tex:12`). It is re-based in `stateOf` (`latex.svelte.ts:252-257`); the project store test's expectation changed to `${FOLDER}/manuscript/main.tex`.
   - The failure sentence changed from "the manuscript was not read: {0}" to "the folder was not read: {0}".
   - The outcome line moved from the panel into each row.
   - Problem rows can now be pressed.
   - Stated in the report: the count now includes warnings (`>2</strong>` became `>3</strong>`).
4. **Files Outline on the parser's refusals.** This is ruled by Z279; the report states the rule but not the effect on real files. My comparison of the old and new `latexOutline` on real files:
   - `funding/2024-fwo-postdoc-fbttr/fwo-postdoc/main.tex`: 20 headings before, 0 after.
   - `projects/archive/dropped/connectivity-motor-imagery/manuscript/main.tex`: 18 before, 0 after.
   - `.../source-localization/manuscript/appendix.tex`: 21 before, 0 after.
   - Any edit in progress with an unclosed `{` or a lone `$` also empties the Outline until it is closed, which my probe confirms (`readTex('\\section{A}\nprice $5\n...')` gives `refused: true`). D25's sticky scroll will read the same reader.
5. **Page weight.**
   - The latex-utensils parser is bundled into the page's main chunk: `.svelte-kit/output/client/_app/immutable/nodes/2.B-0NZy23.js`, 2,692,882 bytes, which contains `math.matching_delimiters`. Its source `latex_parser_simple.js` is 246,360 bytes.
   - The size change needs a build of the base to measure. Not stated in the report.
6. **Tab title inconsistency.** With Open LaTeX on a `.tex` file at the top of a root, `row-menu.ts` `latex()` writes `label = place.root`, which is the key. On the root row itself it writes `row.name`, the root's label. The same folder gets two tab names.
7. **Build on save also runs on a Timeline restore and on Save All** (finding Spec 5). Before: neither built. After: both start a hidden latexmk. The report states "a save from any caller builds" in judgment call 5, but its before/after table does not.

## Declined to judge

- The look in a browser is the orchestrator's, on TEST: KaTeX drawing, the widget's place, the Shift+Alt+F binding live, the menu entry, the view, the markers and the panel.
- The real `tex-fmt`: not installed here (Z280 is open).
- The bundle size change: it needs a second, base build. I reproduced only that the parser is in the page chunk.
- How often finding Behaviour 2's window occurs: not measured.
- The builder's note on `scratchpad/base`: the copy there has a DESIGN.md byte-equal to eaf8034f's, no `content/latex/` folder and no latex-utensils in its `package.json`. Whether it equals the staged base of any other step in flight was not checked.
- Git commands outside the brief's two: for these comparisons I ran `git show eaf8034f:<path>` (read only) several times. The brief allows only `git diff` and `git status --short`.

## Usage

About 320,000 tokens (the context counter went from 15,000,000 to about 14,680,000) and about 65 tool uses. The minutes were not measured.
