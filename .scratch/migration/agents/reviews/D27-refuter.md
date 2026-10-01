# D27 refuter report

D27 REFUTATION REPORT (reviewer; nothing changed; read-only git only; local.yml, .vscode, ports and URLs untouched)

SUMMARY
Verdict: the build holds against items 1 to 11 and 13; item 12 (docs) is partly short. No red check. Open findings: 1 Spec, 4 Proof, 5 Standards, 3 Behaviour (below). Nothing found that makes a case unmet. The two most actionable: (S1) the Config view description `desc_sources` is still the old sentence, and (ST1) the rewritten DESIGN.md:379 now attaches "one model per tab instance on an inmemory:// URI" to the wrong sentence.

COMMANDS I RAN (worktree /Users/axelfaes/workspace/research-hub/.agents/worktrees/D27/tools/oculus, PATH with node v24.21.0)
- `npm run diagrams`: ran; `git diff 193479a8 --stat -- tools/oculus/docs` afterwards lists the same 8 files with the same counts as before the run (layer-data.dot 5, layer-data.svg 169, layer-state.dot 4, .svg 4, layer-views.dot 2, .svg 2, layers.dot 4, .svg 4), so the committed diagrams match.
- `sh ~/.claude/skills/land/templates/checks.sh .scratch/migration/orchestrator-state.md` (I piped it through `tail -40`, so I did not capture the exit code and only saw the end). The lines I saw: `Run npm run preview to preview your production build locally.`, `$ npm run format:check`, `All matched files use Prettier code style!`, `$ npm run lint`, `> eslint .`, `$ ! LC_ALL=C grep -rna '[^ -~]' src tests`, `checks: 7 commands passed`. The earlier commands' headers (npm test, test:checks, check, build) scrolled out of my tail; I reran two of them alone:
  - `npm test`: `Test Files  418 passed | 22 skipped (440)`, `Tests  10947 passed | 619 skipped (11566)` (the report's numbers, identical).
  - `npm run test:checks`: `Test Files  29 passed | 2 skipped (31)`, `Tests  442 passed | 9 skipped (451)`.
- Report's evidence, reproduced:
  - `grep -n "LANGUAGES\|NAMES" src/lib/state/sources/explorer/file-type.ts` prints nothing (rc=1).
  - `python3 -c "import yaml; yaml.safe_load(open('config/sources.yml'))"` rc=0.
  - `grep -rn "cathedra" src` prints 3 lines: `kit/rite/rite.ts:3`, `server/files/files.ts:6`, `views/sources/document/Document.svelte:17`. Matches the report; the brief's "only the head comment" premise is false because of the two older lines, as the report says.
  - ASCII gate (spec form, over src tests config, excluding local.yml): prints nothing.
  - `sh utils/folder-check.sh`: rc=0; `ls src/lib/data/sources/config | wc -l` = 10.
  - Verify 4 (my own node one-off, `isDeepStrictEqual` of cathedra's two JSON files against `RITE_GRAMMAR` and `RITE_CONFIGURATION` with the word pattern as its source): `grammar true`, `conf true`, `RegExp true`, word pattern `[^\s()\[\]{}";]+`. Equal.
  - Item 1 by command: the `languages:` key has 32 entries (31 languages plus plaintext). A node script over highlight.js's 19 registered names and every alias of each (read live from the library, not from the brief) checked that `.<alias>` in the tracked map gives the same language: result `[]` (no mismatch). Case 6 holds independently of the builder's hard-coded alias list.
  - Item 1 content equals the brief's lists line by line; `.wren .dot .gv` absent.

VERDICT PER ITEM OF "WHAT TO BUILD"
1 Map in config: holds. `config/sources.yml` lines 96-130, one language per line, flow style, lists identical to the brief.
2 Reader `languageMap`: holds. `data/helpers/files/languages.ts` (97 lines) returns a Map, zod regex on endings, skips/records `__proto__` (reported as an unknown language, R4), non-list value drops the language, non-map gives an empty map plus one drop, absent key gives no drop, first claimant wins, lowercase compare. The names come from `registered()` instead of `SHIKI_IDS` (R4-ruled). Computed once per config by the `$derived` `languageMapNow`.
3 Finder: holds. `data/sources/config/languages.ts` takes `(engine, config)` (R4), re-exported at `config.ts:71`, called in `portfolio.ts:340`, `context.ts:252`, `config-key.ts:111`; sentences in `config/text/findings.yml:60-64` under `findings.config`.
4 `file-type.ts`: holds. `FileType = { kind }`, `languageOf(name, map)`, `languages(map)`, no `LANGUAGES`/`NAMES`; five callers call `languageOf(name, languages())` in a `$derived`; selector `languages` added.
5 Grammars/`ensureLanguage`: holds, with one deviation the report declares. `ensureLanguage` is called once in each component's language `$effect` (`Editor.svelte:322`, `DiffEditor.svelte:272`) and in `commands.ts:35`, not at the model-creation lines (`Editor.svelte:268`, `DiffEditor.svelte:188`) the brief names. Both effects read `$state.raw` fields (`model`, `models`, `kit`), so they run when the model is made and when the language changes. Equivalent in effect; I cannot run a DOM here, so the wiring is "not verified" beyond reading.
6 rite module: holds (equality above). `settings.ts` converts `surroundingPairs` to `{open, close}` objects for Monaco; the module keeps the file's arrays.
7 Language settings: holds (`kit/rite/settings.ts`, ids are Shiki ids, R4).
8 Code window: holds. `registered()` is 32 names; `withoutAliases` wrappers keep `html`/`svg`/`f90`.
9 Status bar names: holds (`config/text/statusbar.yml`, 13 keys, VS Code display names).
10 Settings entry: holds (`options.yml` after `scan`, `section: Files`, fields key/value).
11 Layer rule: holds (`boundaries.test.ts` row and comment, `DESIGN.md:171`).
12 Docs: PARTIAL. DESIGN.md:85, :171, :379, HELP.md:230 and the head comment of `config/sources.yml` are done. Findings S1 and ST1 below.
13 Tests: holds, with the proof gaps under P1 to P4.

VERDICT PER CASE
1 met. 2 met (Shiki scopes tested with real Shiki; editor colours need the look). 3 met. 4 met. 5 met. 6 met (one test over the whole alias list; my independent alias script agrees). 7 met (real Shiki for every `SHIKI_NAMES` sample plus rite). 8 met. 9 met (asserts the highlighter in force holds the grammar and no `loadLanguage` ran on a disposed one, both orders). 10 met by proxy: the test asserts no tokens provider is set for the failed language (`providers.has('lua') === false`), from which "Monaco keeps its own colours" is inferred; the look shows it. 11 met (stub kit; real Monaco at the look). 12 PARTIAL: the single-load property is tested through `ensureLanguage` (second ask waits on the first), but `DiffEditor.svelte:272` making one call for both models is covered by no test (needs DOM); not verifiable here. 13 met (via `shownLanguage` + `ensureLanguage('plaintext')`; the component wiring is the look). 14 met. 15 met (`file-language.test.ts` selector describe, `languages-selector.client.test.ts`). 16 met under R1 (portfolio test for the finding naming `.h`, reader test for first-listed, `not_single` refusal and the mocked-finder refusal test). 17 met. 18 met. 19 met. 20 met. 21 met. 22 met as an audit (said so in `rite.test.ts` head and report); the look on a rite file is not run. 23 met under R2 (`f90` and `h` named as changed answers). 24 met. 25 met (`rows.test.ts`).

FINDINGS

SPEC
S1. `config/text/views/system/config.yml:15`: `desc_sources: 'What the portfolio reads: the scan paths, the registry and collection files, the feeds, and the roots a local file is served from.'` The step adds the language map to `sources.yml` (brief item 12: "any other line ... the step makes false"; spec: "a sentence in a document ... the change makes false is a defect of the change"; named thing is its whole), and updates DESIGN.md and HELP.md but not this line, which is what the Config view shows for the `sources.yml` row. The builder names it in "Anything in the brief wrong" and stops there. Failure scenario: a reader of the Config view's row for `sources.yml` is told the file holds only portfolio sources; HELP.md:230 (which must start with this sentence verbatim, `tests/views/system/help.test.ts`) says more. The fix is two lines (config.yml:15 and the HELP.md:230 prefix together) and was left as a note, so the report's first line "Everything in the brief is done" is not true of item 12. The path was outside the step's list, which the spec says to report before writing; the orchestrator can fix it at landing.
S2. Not a defect, recorded: `ensureLanguage` is called in the two language effects and not at the model-creation lines (item 5), disclosed as a judgment call (report line 74); equivalent by reading, unverified in a DOM.

PROOF
P1. Verify 7 asks for the failure of each new or changed test on the unchanged tree to be quoted. The report quotes only the aggregate (`Test Files  13 failed | 9 passed (22)`, `Tests  15 failed | 289 passed (304)`), and for nine files the failure is "Cannot find module", i.e. the whole file fails at import (`source.test.ts`, `languages.test.ts`, `file-language.test.ts`, `fs-shape.test.ts`, `fs.test.ts`, `status.test.ts`, `grammars.test.ts`, `paint.test.ts`, `rite.test.ts`). For tests in those files that check behaviour the step preserves (for example the existing theme-paint cases in `paint.test.ts`, the `NAMED` cases in `fs.test.ts`), the report quotes no run on the unchanged tree, which Verify 7 asks for "where it can run there". Per-case "first run" lines (report line 28) are prose descriptions, not quoted output. I did not rerun them (I may not create a base copy with git); treat as unreproduced, no decision rests on them.
P2. `tests/state/sources/fs/languages-selector.client.test.ts` was never run on the unchanged tree (report line 29: "fails there on a TypeError, not run separately"). By reading, it does fail without the shared `$derived` (it asserts `second.seen[0]` is `first.seen[0]`), so it is a real test; the "seen failing first" claim is unquoted.
P3. Case 10's "lua keeps Monaco's colours" and case 11's "the model takes its colours" are asserted as "no provider set" / "setModelLanguage called with id" over a stand-in Monaco (`paint.test.ts`). They would still pass if Monaco ignored the provider. Stated in the file head ("What this does NOT cover") and left to the look; the look on TEST (rite file, picker, a diff of two Lua files) is not run (report line 1).
P4. `tests/server/edit/config-key.test.ts`: two of the three added tests drive a mocked `languageFindings` (R1-ruled); the real finder is never reached by a write. Disclosed (report line 16). The refusal test does fail if the finder is dropped from `FINDERS` (calls would be 0), so it proves the wiring, not the finder.

STANDARDS
ST1. `DESIGN.md:379`: the builder inserted several sentences into the middle of the original sentence. It now reads "...so Shiki's tokens then replace Monaco's for those languages' models too, one model per tab instance on an `inmemory://oculus/<instance>/<path>` URI; this highlighter, which sits in `data/prose/languages.ts` ..." The phrase "one model per tab instance on an inmemory URI" originally continued "coloured by Shiki's TextMate grammars under the same language names"; it now attaches to the Svelte/Jinja/SCSS embedded-grammar sentence and reads as if Shiki's tokens replace Monaco's "one model per tab instance". Failure scenario: a reader takes the URI clause as a property of the embedded-grammar replacement. Move the clause back before the inserted sentences.
ST2. `tests/state/sources/fs/fs.test.ts:871` `it('gives every extension and name the language it has always been painted in'` and `:829` `/** Every extension the table named, with the language it gave, and the one whole name. */`. The table (`LANGUAGES`) no longer exists, and `x.svelte` in that list (line 855) changed from xml to svelte, so "always been painted in" is false for it. Title and comment carry history and are untrue.
ST3. `tests/state/sources/fs/file-language.test.ts:6-7` head: "What this does NOT cover: ... the selector that hands the map to a view (tests/state/client/selectors.test.ts)". `tests/state/client/selectors.test.ts` is untouched and has no `languages()` test (`grep -rn "languages()" tests/state/client` prints nothing), and the same file's last describe ("the selector that hands the map to a view", lines ~250-275) covers the selector. The comment is false both ways.
ST4. `tests/views/sources/files/files-menu.test.ts` (new test): `// Revert: compute \`markdown\` from the extension \`.md\` in rowFacts instead of the map.` The spec says the step adds no revert directive. 637 existing uses in tests/ (the convention is old and no check reads it), so low severity.
ST5. Import order nit, no check fails: `context.ts` and `portfolio.ts` insert `languageFindings` between `behaviorFindings` and `calendarSettings`/`configDir` (the surrounding lists are alphabetical).
Not found: history words in added source comments (grep of added lines), non-ASCII, files over size (rite.ts 326, selectors 510, Editor.svelte 518, load.ts 324), a new dependency (`package.json` untouched), file-scope mutable (the one new `$derived` is inside `createSelectors`), a path outside the brief's list plus R3/R4.

BEHAVIOUR
B1. Before the config channel speaks, every file is plain text; the report states this only in the judgment calls, not under "Host- and user-visible changes". Visible consequence: the Files context menu offers no Open Preview on a Markdown file until the config arrives (before: offered from the first paint), and a file opened at start shows plain, then coloured.
B2. `languageFindings` words an empty entry as `language python lists , which is not a file name ...` (finder test pins it, `tests/data/sources/config/languages.test.ts`). Awkward but correct; not stated in the report.
B3. A config message with an unchanged `languages:` still gives a new Map (the report says so, line 76), so every `$derived` that reads the map re-runs on each config message (language strings compare equal, so effects do not re-run). Stated; no user-visible effect found.
Stated and confirmed in the report: file-language changes, the 13 status bar names, the Settings section Files, the fence changes (`h` null to c, `f90` null to fortran), the Monarch/plain interim before a grammar loads, the embedded grammars of svelte/jinja/scss replacing Monaco's.

DECLINED TO JUDGE
- Whether Cmd+/ , bracket closing and bracket matching work in a rite file, whether Monaco retokenizes open models when the tokens provider is set after the grammar load, and whether the Settings view draws the new Files section correctly: need a browser/DOM, which I may not use; the look on TEST is not run (report line 1).
- The "first run on the unchanged tree" per-case results (P1): I may not build a base copy (git beyond `diff` and `status` is barred), so they are unreproduced.
- Shiki figures ("30 grammars", "svelte 28 scopes"): no decision rests on them; the current tests assert more than one distinct scope per grammar.
- The U3 merge in `Source.svelte`/`Tree.svelte`/`files-menu.test.ts`: the landing's.
- `pagehide` teardown in a real browser (the listener `self.addEventListener('pagehide', ...)` in `load.ts:158`): only the `close()` path is unit tested.

USAGE
Left for the orchestrator (token, tool-use and time counts are not available to me).

Files read (absolute): /Users/axelfaes/workspace/research-hub/.agents/worktrees/D27/tools/oculus (diff and new files whole), /Users/axelfaes/workspace/research-hub/tools/oculus/.scratch/migration/agents/{spec.md,briefs/D27.md,briefs/D27-cases.md,reviews/D27-report.md}. Scratch scripts only in the session scratchpad.
