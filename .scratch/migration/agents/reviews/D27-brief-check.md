BRIEF CHECK REPORT, step D27 (oculus/migration), brief `tools/oculus/.scratch/migration/agents/briefs/D27.md`, tree at main 04b39b45 (`git log --oneline -1` prints `04b39b45 Book Z172 into Q88c and raise workers_at_once to five`). I changed nothing in the repository; my only writes were scratch copies under the session scratchpad. I did not run the test suite (read-only role); where a claim below says "red" or "breaks", it is from reading the code or from a command named with it, and says so.

Findings that block the brief as written: Names 1, 2, 3 and 4, Cases and checks 1, 2, 3 and 4, The step line 1. The rest are smaller.

## Names

Command: `grep -rn --exclude=local.yml -E "languageOf|typeOfFile|[^a-zA-Z.]languages\(\)|\bLANGUAGES\b|\bNAMES\b|SHIKI_IDS|SHIKI_LANGUAGES|shikiId|painter|languageNamed|\bregistered\(\)|\bPLAINTEXT\b" src tests config DESIGN.md HELP.md README.md` (146 hits). Hits for `LANGUAGES` and `NAMES` outside `file-type.ts` are all unrelated (`registries.ts:48,169`, theme `NAMES` in tests/checks/look). README.md has no hit and no sentence the change makes false.

1. **The status bar and the language picker are driven by `registered()` and a per-name catalog key; the brief never mentions them.** `src/lib/state/workbench/navigation/status.ts:259-262` (`languageName`: `registered().includes(name) ? name : PLAIN`, then `t(\`statusbar.language_${known}\`)`) and `:276-278` (`languageMatches` lists `registered()` only). `config/text/statusbar.yml:73-91` holds `language_<name>` for the nineteen names only. `tests/checks/source/keys.test.ts:178-181` fails for any `registered()` name without `statusbar.language_<name>`; `tests/state/workbench/navigation/status.test.ts:251` and `:258` pin the list to `registered()`. Consequences once item 6 registers c, cpp, cmake, lua, ruby, scss, java, dart, fortran and jinja: (a) `keys.test.ts` and `status.test.ts` go red unless ten keys are added to `config/text/statusbar.yml` (the brief lets `config/text/` be written only for "the finding's sentence"); (b) `svelte`, `rite` and `fortran-fixed` are not hljs-registered names in the brief, so the status bar shows "Plain Text" for a Svelte, rite or `.f` file coloured by their grammars and the picker cannot select them. Decision 3 of the brief ("so the status bar shows a short name") is not built by anything in "What to build". Change: add to item 6 that hljs also registers `svelte` (xml's grammar), `rite` (plaintext's) and `fortran-fixed` (fortran's), so `registered()` equals the map's languages; add item 10: `config/text/statusbar.yml` gains `language_<name>` for every new name; add `status.ts` (if its behaviour changes), `statusbar.yml`, `tests/state/workbench/navigation/status.test.ts` and `tests/checks/source/keys.test.ts` to the paths. Registering one definition under two hljs names also moves the aliases (`registerLanguage` stores `aliases[alias] = name`, so `html`, `svg`, `f90` end up owned by whichever name registered last, and `languageNamed` follows); the brief should say which name registers last and keep `languageNamed('html')` unchanged by a test.

2. **`src/lib/ui/controls/editor/commands.ts:7,33` is outside the paths and must change.** `commands.ts:33`: `monaco.editor.setModelLanguage(held, shikiId(command.language))` is the status-bar picker's way to change a file's language. With grammars loaded on first use, choosing Lua for a `.txt` file must load the Lua grammar, so this call site needs the same load as `Editor.svelte:268,319` and `DiffEditor.svelte:188,267`. Change: add `commands.ts` to the paths and a case "choose a language from the picker whose grammar is not loaded: it loads once and the model takes its colours".

3. **State layer imports a new data module; the boundary test and DESIGN.md's layer table list the allowed ones.** `tests/checks/tree/boundaries.test.ts:123-150` (`state:` row) names `'data/helpers/files/opens-in-program'`, `'data/prose/languages'` and so on; `state/client/selectors.svelte.ts` and `explorer/file-type.ts` will import `data/helpers/files/languages`. `DESIGN.md:171` holds the same list. Neither file is in the paths. Change: add `tests/checks/tree/boundaries.test.ts` (row plus its explanatory comment block at lines 31-60) and `DESIGN.md:171` to the paths.

4. **The finder cannot live where the brief implies, and is also needed in a third list.** `tests/checks/imports/order.ts:36-45` orders `data` as data, sources, snapshot, accounts, shapes, helpers, prose, model, and a module may import only its own folder or one below. A finder needs `configDir` and `textCatalog` (both in `data/sources/config/`), so it cannot sit in `data/helpers/files/languages.ts` with the reader. Existing finders live in `src/lib/data/sources/config/catalogs.ts:152` (`behaviorFindings`), a file Q85c converts. The brief names neither the finder's file nor its export path (`src/lib/data/sources/config.ts:46-55` re-exports the finders). Also `src/lib/server/edit/writes/config-key.ts:104-110` holds a third list, `FINDERS`, which the Settings write checks; the brief names only `watch/portfolio.ts:331-340` and `context.ts:241-246`. Change: name a new file `src/lib/data/sources/config/languages.ts` (the folder holds 9 items, `ls src/lib/data/sources/config | wc -l` prints 9, so 10 is the limit and is allowed), its re-export in `data/sources/config.ts`, and the entry in `config-key.ts` `FINDERS` (see Merge claims 2: D31 writes the import block of that file).

5. **Docs the change makes false or incomplete that item 8's grep will not find.** `DESIGN.md:379` (one bullet) says "A file's name reaches a grammar through highlight.js's own names and aliases first ... then through the extension map of `state/sources/explorer/file-type.ts` ... `.svelte` as xml ... a file called `Makefile` ... is matched by its whole name" and "A `.svelte` file is painted as xml" and "(`grammars.ts` answers each name's Shiki id: `bash` is `shellscript`, `lisp` is `common-lisp`, `makefile` is `make`, the rest their own"; all false after the change. `DESIGN.md:85` lists what `sources.yml` holds ("the tier scan paths, the registry and collection files, the document and feed paths") and `HELP.md:230` says "What the portfolio reads: the scan paths, the registry and collection files, the feeds, and the roots": neither contains the words item 8 greps for (`svelte|eighteen|highlight|language`), so both would be missed; both need "the extension-to-language map". `config/sources.yml:1-8` head comment likewise. Change: list `DESIGN.md:85`, `:171`, `:379` and `HELP.md:230` and the head of `sources.yml` in item 8.

6. **Head comment of `data/prose/languages.ts` has a third false sentence.** Lines 11-13 say "The file browser's state asks it too, which language a file's extension names, so the table of names and aliases is highlight.js's own and oculus keeps only the extensions it does not know." After item 3 the file browser no longer asks hljs. The brief mentions only the count (line 17, "the eighteen") and the Svelte sentence (lines 21-23). `languageNamed`'s doc ("so an extension it knows needs no line of oculus's", lines 89-93) goes false too.

7. **Existing tests that pin the old behaviour (inside the brief's test paths, listed so the builder rewrites them rather than meets them red):** `tests/ui/controls/editor/kit/grammars.test.ts:14,17,34,41-44` (19 names, 18 grammars; `registered()` is iterated, so it never checks `svelte`, `rite` or `fortran-fixed`, and `rite` is not in `bundledLanguages`); `tests/state/sources/fs/fs-shape.test.ts:76` (`View.svelte` is `xml`), `:107-109` (`languages()` equals `registered()` both ways), `:136` (every `languageOf` result is registered); `tests/state/sources/fs/fs.test.ts:893-898`; `tests/views/sources/source.test.ts:494-512` (`['View.svelte','xml']`) and `:515-516`; `tests/checks/tree/allow-audits.txt:108-111`; `tests/ui/controls/editor/kit/paint.test.ts` (the brief says "the kit's load test"; no such file exists, `ls tests/ui/controls/editor/kit` prints badge, grammars, look, paint, platform, theme). `fs-shape.test.ts:107-109` pins "the map names only registered languages", which stops being guaranteed once a user can edit the map (see Implied inputs 4).

8. **`fs.svelte.ts` cannot take the map "from the selectors".** `src/lib/state/client/context.ts:230` builds `createFs(writes, forms, entities, queries)` and `:291` builds `createSelectors(...)` after it; `fs.svelte.ts:506,522,535,540` call `typeOfFile` inside `heldFileKind`, `readFileKind` and `readKind`, which cache a `FileType` (with its `language`) under `['fs','kind',root,path]`. Only `.kind` of that cache is read (`grep -rn "\.language" src/lib/views/sources src/lib/state/sources` finds only `Source.svelte:133,269`), so a stale cached language is harmless, but the brief gives these four calls no map source. Six of the callers (`File.svelte:86,130`, `Tree.svelte:246`, `opening.ts:67`, `+page.svelte:178`, `fs.svelte.ts` x4) read only `.kind`; forcing a map argument into them is noise. Change: decide the shape in the brief: `typeOfFile(name, bytes?)` stays kind-only with `language` removed from `FileType`, and `languageOf(name, map)` is the only function that takes the map; then `fs.svelte.ts`, `Tree.svelte`, `opening.ts`, `+page.svelte` and `File.svelte` need no change and no `context.ts` edit. If the brief keeps the map argument, add `context.ts` to the paths (`createFs` gets a getter).

## The step line

Command: `grep -n '^- D27' plan.md` prints plan.md:419 (the plan line); the two carried lines are brief lines 9 and 10. Mapping:

| Part of the lines | Item |
|---|---|
| Shiki grammar + registration for C, C++, CMake, Lua, Ruby, SCSS, Java, Dart, Fortran, Jinja | 4 (ids), 1 (endings); Monaco registration of lazy ids is not stated (Cases and checks 2) |
| Svelte on its own grammar instead of XML | 1 (`.svelte` moves), 4 (`svelte` id), 6 (code window keeps xml) |
| `.pyi` as Python | NONE (only Case 2) |
| each grammar loaded when the first file of its language opens | 4 |
| extensions entered in D26's map | 1, 2 |
| Wren and Graphviz stay plain text | NONE (Case 5 and item 8 text only; Case 5 names `.dot` but not `.gv`) |
| D26: rite grammar + language settings (comments, brackets) in oculus's tree | 5 |
| D26: `.rite` mapped in oculus's own config | 1 and 5 (end) |
| D26: nothing loaded from cathedra at run time | 5 (a head-comment sentence) ; no check |
| D26: the map is the one map, holding the table of `file-type.ts`, shown in Settings | 1, 3, 7 |

1. **`.pyi` has no item.** Item 1 says what moves (`.svelte`, `.txt` stays) but not `.pyi`; only Case 2 mentions it. Change: item 1 lists `.pyi` under python, and `.gv` (and `.dot`) as deliberately absent.
2. **"Nothing loaded from cathedra at run time" has no check.** Verify 4 (`cmp`) proves the copies are byte-identical, not that no import reads cathedra. Change: add `grep -rn "cathedra" src/lib/ui/controls/editor/kit/` printing only the head comment of the rite module (or nothing in any import or fetch).
3. **The endings of the new languages are not listed.** Items 1 and the cases name some (`.c .cpp .hpp .h .lua .rb .scss .java .dart .f90 .f .jinja .j2 .rite .cmake`, `Gemfile`, `CMakeLists.txt`); the rest (`.cc .cxx .hh .hxx`, `.gemspec`, `.jav`, `.f95 .f03`, `.jinja2`) is the builder's choice, and the file is shown in Settings. hljs's own aliases disagree with the choice for `.h` (hljs `c` alias `h`: `node` over `highlight.js/lib/languages/c` prints `h`). That `.h` is cpp is a visible choice with no line in "Decisions". Change: list every ending per language in item 1 and add `.h` as cpp to Decisions with the reason.

## Premises

Re-run results (all from `tools/oculus`):

- `grep -rn "languageOf\|typeOfFile\|[^a-zA-Z]languages()" src` prints exactly the callers in brief line 17 (fs.ts:15,18; fs.svelte.ts:104,506,522,535,540; File.svelte:86,130; Source.svelte:133; source/Editor.svelte:109; Merge.svelte:90; DiffSection.svelte:332; opening.ts:67; Tree.svelte:246; row-menu.ts:93; +page.svelte:178). Holds.
- hljs names/aliases (`node` over `highlight.js/lib/languages/*`): matches brief line 16 for all nineteen. Holds. Shiki 4.4.3 `bundledLanguagesInfo` has `c cpp cmake lua ruby scss java dart fortran-free-form fortran-fixed-form jinja svelte`; hljs has `c cpp cmake lua ruby scss java dart fortran django` (aliases `h`; `cc c++ h++ hpp hh hxx cxx`; `cmake.in`; `pluto`; `rb gemspec podspec thor irb`; none; `jsp`; none; `f90 f95`; `jinja`) and no svelte file (`ls node_modules/highlight.js/lib/languages | grep -E '^(svelte|rite)'` prints nothing). Holds.
- `package.json:79` shiki 4.4.3, `:65` highlight.js ^11.12.0, `:45`/`:75` @shikijs/monaco 4.4.3 / monaco-editor 0.57.0. Holds.
- Selectors `:91`, `:147-149`, `:469`, `configMap` `:130-132`; `options.yml` `usage_tiers` 124-129, `scan` 505-513; `data/prose/languages.ts:94-99`, REGISTERED `:57-77`, loop `:79-81`; `grep -rn --exclude=local.yml "languages:" config` prints nothing (exit 1); `ls ../../docs/adr docs/adr` prints two "No such file or directory". Holds.
- Folder counts: helpers 10, helpers/files 3, kit 7, explorer 4, tests/state/sources/fs 3, tests/ui/controls/editor/kit 6. Holds. (`kit/rite/` makes kit 8.)
- rite files: `LC_ALL=C grep -n '[^ -~]'` over both prints nothing (ASCII); `~/workspace/cathedra/LICENSE` is MIT, "Copyright (c) 2023 Axel Faes". Holds.

Wrong premises:

1. **Line numbers.** `languages()` is `file-type.ts:94-96` (sed -n 94,98p prints it), not 96-98. `load.ts` registers missing ids at `:126-128` (the `for` loop; `:127` is the `if`), not 127-130. The `langs: [...parts.langs]` call is `load.ts:204`, not 205 (`:205` is `Object.assign(editor, made)`). Change: correct the three.
2. **"Q85c writes the readers under `src/lib/data` (not ... `data/helpers/files/`)" is false.** `Q85c.md` lines 15 and 20 name `helpers/files/opens-in-program.ts:56-62` (`programApps`) as a reader it converts to a zod schema. D27 writes a new sibling file, not that one, so there is no file clash, but the precedent the brief tells the builder to follow (`programApps`) is being rewritten by Q85c, and `languages.ts` imports `extensionOf` from it. Change: say "follow `opens-in-program.ts` as Q85c leaves it; D27 does not edit it".
3. **"`section: Files`" is not an existing Settings section.** `grep -o "section: .*" config/catalogs/options.yml | sort | uniq -c` prints eleven section names (Registry and feed files, Thresholds and horizons, Rail and pages, Audit, Usage and sessions, Project labels, Tab badges, Roots, Project scan, Collections, Code theme); none is Files. A new section name is a user-visible Settings shape. Change: name the section (for example "Registry and feed files" or "Roots", or a new one stated as a decision).
4. **`behavior.yml`'s head**: line 3 says "Source roots and permitted file extensions live in sources.yml" (true target of Z176), but `sources.yml` holds no extension key today; no change needed, noted so the builder does not edit behavior.yml.

## Cases and checks

1. **Verify 4 (byte-identical JSON) contradicts two standing gates.** (a) `npm run format:check` is `prettier --check .` and `.prettierignore` has no entry for JSON. Command: copied both cathedra files to the scratchpad and ran `npx prettier --config .prettierrc --check <copies>`; output: `[warn] ...language-configuration.json`, `[warn] ...rite.tmLanguage.json`, `Code style issues found in 2 files`. `format:check` is line 5 of the state file's verify list (`orchestrator-state.md:6-13`). (b) `tests/checks/source/history.test.ts` walks every file under src, tests, utils and config (`proseLines` handles only `.txt` and `.yml`, else `commentText`, which throws for an unknown language). Command: `node --input-type=module -e "import {commentText} from './tests/checks/source/code.ts'; ... commentText('src/lib/ui/controls/editor/kit/rite/rite.tmLanguage.json', <cathedra text>)"`; output: `THROWS: src/lib/ui/controls/editor/kit/rite/rite.tmLanguage.json does not parse: no reader is known for its language`. `git ls-files src tests utils config` lists no `.json` today (extensions: ts 978, svelte 288, yml 65, mjs 11, sh 4, txt 3, css 3, svg 1, html 1). Even with a reader, `rite.tmLanguage.json:77` contains `Q32.16`, which the audit's `Q[0-9]{1,2}` family matches. The spec forbids loosening a check and forbids hand-formatting; the brief forbids editing the copies. This is a clash between the brief's byte-identical rule and the rules file, to be ruled before dispatch. Options: (i) keep the copies byte-identical and add `.prettierignore` + a `.json` branch (skip) in `history.test.ts` with their reasons (two paths added, a check narrowed for one carried file); (ii) store the files under a folder the checks do not walk (`tools/oculus/assets/` exists; prettier still covers it unless ignored, and Vite import by `?raw` or `?url` from `src` is possible) with only `.prettierignore` changed; (iii) convert the grammar to a `.ts` module (not byte-identical, contradicts Verify 4 and the brief's convention). Recommendation: (ii), the narrowest check change; the lazy option is to let the builder discover this at Verify and weaken `history.test.ts` itself.

2. **Case 13 and the "draws plain" sentence are wrong for seven of the languages.** Monaco's full build registers `c`, `cpp`, `lua`, `ruby`, `scss`, `java` and `dart` itself: `node_modules/monaco-editor/esm/vs/editor/editor.main.js:11,16,29,35,62,67` import `languages/definitions/{cpp,dart,java,lua,ruby,scss}/register.js`, and `cpp/register.js` registers ids `c` and `cpp`; `package.json` `"module"` is `./esm/vs/editor/editor.main.js`; `load.ts:125` already reads these as `known`. A model made under one of those ids is coloured by Monaco's own Monarch tokenizer until Shiki's provider replaces it. Consequences: item 4's "A model whose grammar has not loaded yet draws plain" and Case 13's "the file stays plain" hold only for cmake, jinja, svelte, fortran, fortran-fixed and rite; Case 13 as stated gives a different result for the other seven. Change: state both behaviours and write Case 13 for one language of each kind.

3. **A lazily loaded language needs two registrations the brief does not state.** `@shikijs/monaco` `index.mjs` sets a tokens provider only for `highlighter.getLoadedLanguages()` that are in `monaco.languages.getLanguages()` at the moment of the call (`const monacoLanguageIds = new Set(...)`; `for (const lang of highlighter.getLoadedLanguages()) if (monacoLanguageIds.has(lang)) ...`), and each call re-wraps `monaco.editor.setTheme` and `create` (`load.ts:21-29` explains why `painter` resets them with `Object.assign(editor, made)`). So after `loadLanguage` the bridge must run again with that reset, and the Monaco language id must be registered before `createModel` (an unregistered id yields a plaintext model; `load.ts:126-128` registers only `SHIKI_LANGUAGES`). If `SHIKI_LANGUAGES` stays "the grammars the highlighter loads" (18), the lazy ids are never registered. Also loading `svelte` or `jinja` loads embedded `html`, `postcss` and `css` (node over `createHighlighter` + `loadLanguage` prints loaded `javascript typescript css postcss html scss dart ts`), and the bridge then replaces Monaco's own tokenizer for `html` and `scss`. Change: item 4 states the two lists (eager 18, all ids registered with Monaco at start), that the load runs inside `painter`'s queue so a theme paint and a grammar load cannot interleave, and that the bridge is re-run with the wrap reset.

4. **Case 12 cannot be a unit test.** Cmd+/ , auto-close and bracket matching need Monaco's DOM; `agents/spec.md:57-58` says such behaviour is seen at the look. Item 9 says each case becomes a test. Change: say Case 12's proof is the look on TEST plus a unit test that the converted configuration object has `comments.lineComment === ';'`, the three bracket pairs and the word pattern as a RegExp, and the report marks that test an audit. Also `notIn: ["string","comment"]` in `language-configuration.json` depends on the token types the Shiki provider reports; not verified.

5. **Case 14 (`svelte` fence painted as xml) has no mechanism** (see Names 1). `codeHtml` (`prose/languages.ts:106`) uses `language in REGISTERED`, so `svelte` is plain text unless it is registered. The same applies to the code window for a `.svelte` file, since `Source.svelte:133` will now pass `svelte`.

6. **Case 2's TypeScript block is achievable.** Command: node + `shiki.createHighlighter`, `loadLanguage('svelte')`, `codeToTokens` of `<script lang="ts">const a: number = 1;</script>` with explanations; output scope names `source.svelte | source.ts`. Holds, as a real-Shiki test.

7. **Case 7 (before the config arrives) works only through `$derived` and through the callers that have the map**; `fs.svelte.ts` does not (Names 8). Case 7 has no test that can run in the string-render suite except at the selectors level (`languages()` empty until `entities.config()` has a message). Change: say the proof is a selectors test plus the look.

8. **Case 10 and file names that are reserved words.** `__proto__` as a key is covered. A file *named* `constructor`, `toString` or `valueOf` is looked up in the same table; a plain object lookup returns `Object`'s function. `grammars.test.ts:37` already tests `shikiId('constructor')` for the same reason. Add the case (expected `plaintext`) and require `Object.hasOwn` or a `Map` in the reader.

9. **Check 5 (`yaml.safe_load`) proves only YAML syntax.** Check 3 (`grep LANGUAGES|NAMES` prints nothing) proves removal, not that every old ending survives. Change: add a test over the tracked `config/sources.yml` through `loadConfig` that, for every alias in brief line 16 plus `LANGUAGES` and `NAMES`, `languageOf` gives what the old code gave (the old code's answers are computable now from the lists in the brief).

10. **Case 4's `x.h` is cpp and Case 8 gives `.h` to both:** consistent only if the tracked file lists `.h` under cpp alone; say so (Decisions, see The step line 3).

## The question

Goal: every language the plan lists is coloured in the editor, each grammar beyond today's loaded on first use, one extension-to-language map in oculus's config shown in Settings, rite carried in oculus's tree.

1. **Cases 1 to 5 and 11** test `languageOf` names only. They pass with the map and with no Shiki id, no lazy load and no Settings entry; and they pass against a map the test writes inline rather than the tracked `sources.yml` unless the brief says the tests read the tracked file (Cases and checks 9). Change: the cases run over `languageMap(loadConfig(ENGINE_ROOT).config)`.
2. **Case 6** (one load, nothing more for a second `.lua`, colours kept after a theme change) passes with a stub highlighter whatever id is passed to the real Shiki, and for `.lua` passes visually through Monaco's own Monarch tokenizer (Cases and checks 2). Change: one test with the real `createHighlighter` that, for every value of `SHIKI_IDS` except `rite`, loads the id and tokenizes a sample line asserting more than one distinct scope; `rite` is loaded from the copied grammar. That fails for a wrong id (`fortran-fixed` is not a Shiki id; the id is `fortran-fixed-form`).
3. **Case 13** passes for any failure handling on the seven Monaco-known languages; see Cases and checks 2.
4. **Cases 8 and 9** (finding on the config channel) pass from a unit test of the reader/finder alone. Nothing in the brief's test paths exercises the wiring: `tests/server/root/watch/portfolio.test.ts` (the config channel payload; line 482 asserts `payload.findings` equals `[]` over a synthetic engine from `buildEngine()`) and `tests/server/root/context.test.ts` are not in the paths, and deleting the added line in `portfolio.ts`, `context.ts` or `config-key.ts` leaves every listed test green. Change: add a `portfolio.test.ts` case (bad map yields the finding on the payload, valid map yields none) and a `config-key.test.ts` case, and add both files to the paths.
5. **Case 12** passes with a configuration object nobody registers (Cases and checks 4).
6. **Case 14** passes with `codeHtml('...', 'cpp')`; its svelte half needs the registration of Names 1.
7. **Item 7 (Settings entry)** passes `options-catalog.test.ts` with any entry text; the Settings row exists (`rows.ts:165-195` builds a family row from the file's text), but no listed test reads the row. Change: one test that `fileRows('sources.yml', ...)` over the tracked file contains a row `languages` with control `family` and state `set`.
8. **Verify 1 to 6**: the whole list passes with a rite module that registers nothing (Verify 4 compares bytes only; no test imports the module). Change: a test that the module's registration calls `setLanguageConfiguration('rite', ...)` and `loadLanguage` with a registration named `rite` and scope `source.rite`.
9. **Items 3, 5, 6, 8** each can pass without the goal as the paragraphs above show; items 1, 2, 4 are covered once the changes named above are made.

## Implied inputs (missing from "Cases"), with expected result

1. A file with no extension and no known name (`README`, `LICENSE`): `plaintext` (today's `fs.test.ts:898` pins `README`; keep it in the new cases).
2. Dotfiles (`.bashrc`, `.gitignore`, `.zshrc`, `.prettierrc`): `extensionOf` returns `''` for a name whose only dot is the first character (`opens-in-program.ts:42-46`: `at <= 0`), so they are plaintext. The brief's rule "an entry starting with a dot is an extension" means a whole-name dotfile can never be mapped (an entry `.bashrc` is compared against `extensionOf`, which never returns it). Decide: dotfile names are whole names (an entry that equals the whole lowercased name matches whatever its first character), or unsupported with a stated sentence in the Settings description. Expected for now: plaintext.
3. Double extensions: `x.d.ts` typescript, `archive.tar.gz` plaintext (kind `other` by bytes), `x.test.ts` typescript, `CMakeLists.txt.in` plaintext; an entry that holds an inner dot or a slash (`.tar.gz`, `src/Makefile`) can never match; expected: dropped with a finding, or accepted and inert; state which.
4. A language in the map with no grammar (`cobol: [.cbl]`): `languageOf` answers `cobol`, `shikiId` answers plaintext, `codeHtml` plain, `languageName` "Plain Text" (misleading), absent from the picker; `fs-shape.test.ts:107-109,136` stops being an invariant. Expected: a finding naming the language, or the status bar showing the raw name; state which.
5. An empty list (`python: []`): the language has no endings; no effect, no finding. An empty map (`languages: {}`) and an absent key: every file is plaintext; decide finding or silence. Precedent: `behaviorFindings` flags an absent `editor.paint_limit_kb`; but a finding on an absent key makes `portfolio.test.ts:482` (`findings` equals `[]`) and `context.test.ts:48` fixtures need a `languages:` key. Not verified which fixtures lack it.
6. The same ending twice in one language (`python: [.py, .py]`): silent. Two endings that differ only in case across languages (`.F90` and `.f90`): a conflict finding after lowercasing. A language name with upper case (`Python`): `shikiId('Python')` is plaintext; expected: dropped with a finding, or lowercased.
7. The config changing while an editor holds a file: the map is `$derived`, the `Source.svelte:133` language follows, `Editor.svelte:317-321` calls `setModelLanguage`, which must also load the grammar; the undo stack is kept. A language removed from the map: the model goes to plaintext.
8. A theme change while a grammar is loading: after both settle, the highlighter in force holds every grammar loaded so far and the model has colours; no `loadLanguage` on a disposed highlighter (`painter` disposes the one before at `load.ts:207`). Also: a second model of the same language while the first load is in flight makes one load; the page torn down mid-load loads nothing and throws nothing; a later paint supersedes (spec lines 59-60 require in flight, after close and superseded cases for an asynchronous path; the brief has Cases 6 and 13 only).
9. The DiffEditor's two models (`DiffEditor.svelte:179-190` makes original and modified models, `:264-270` sets both): one load for the language, both models coloured; `Merge.svelte:90` and `DiffSection.svelte:332` give it the language.
10. A file above `editor.paint_limit_kb`: the editor is handed `plaintext` and must load no grammar (add a case: a 5 MB `.lua` loads nothing).
11. The server-side Markdown fences (`turns.ts:264`, `docs.ts` via `codeColour`): the server does not read the map, so fences follow hljs names: ` ```c ` and ` ```h ` are c (hljs alias `h`) while a file `x.h` opens as cpp; ` ```django ` is plain (registered as `jinja`); ` ```rite ` plain; ` ```html ` still xml after the registrations of Names 1. Expected results to add as Case 14 lines.
12. The language configuration (comment toggle, brackets) for languages Monaco does not know: cmake, jinja, svelte, fortran, fortran-fixed get Monaco's defaults, so Cmd+/ does nothing there (c, cpp, lua, ruby, scss, java, dart keep Monaco's own). The goal is colour, so this is outside it; stated here as a visible limit the report should name, or a decision to add four small configurations.
13. A tree row for `Gemfile`, `Makefile`, `CMakeLists.txt`: `Tree.svelte:246` and `row-menu.ts:93` call `languageOf` per row; `languageMap(config)` with a zod parse on every call would be run per row. Selectors should hand a value computed once per config change (a `$derived`), and the brief should say so.

## ADRs

1. None. Commands: `ls ../../docs/adr docs/adr` prints `ls: ../../docs/adr: No such file or directory` and `ls: docs/adr: No such file or directory`; `find . -maxdepth 4 -type d -iname 'adr*' -not -path '*/node_modules/*'` from the repository root prints nothing; `.agents/plan.yaml` has no `adr` key. The brief's statement holds.

## Merge claims

Read the "Paths this step writes" of `U3.md`, `Q85c.md`, `D31.md` and `D35.md` (D35.md is untracked in the working tree, read as it stands).

1. **`context.ts`**: D31 (`requireAutofetch` beside `requirePaintLimit` at :222, `ContextDependencies` at :165-185, `close()`), D35 (whole file: live settings wiring, comment at :211-213, `close()`), D27 (one line in the `reportFindings([...])` list at :241-246). Three different hunks; textual merge simple, but D35 writes the file whole so its exact hunks need reading.
2. **`config-key.ts`**: D31 writes lines 28-60 (the import block) and 81-93 (`READERS`); D27 needs `FINDERS` (:104-110) and an import in the same alphabetical list as D31's `requireAutofetch` import. Hunks 11+ lines apart for the code, but the import block is shared: needs reading. D27's brief lists no write here (Names 4).
3. **`watch/portfolio.ts`**: no other brief writes it (D35 reads it). Simple.
4. **`options.yml`**: D31 294-297 (and an entry after `git.message_model`), D35 whole file (descriptions at :126,:132,:137,:219,:222-277 and the `local.yml:` block :581-613), D27 an entry in the `sources.yml:` block (:504-580). D27's hunk is apart from D31's and D35's unless appended after `roots` (:575-580), which touches the line before the `local.yml:` header at :581 where D35's descriptions begin. Put the entry after `scan` (:505-513) or `career_file` to keep the hunks apart; then simple.
5. **`DESIGN.md` / `HELP.md`**: ranges named in the brief (U3 214-222 and 405; D31 116, 128, 344, HELP 172,186,222; Q85c 148; D35 224-236, HELP 216) do not overlap the lines D27 changes (85, 171, 379; HELP 230). But U3 also writes "the `Pane` and `Toolbar` paragraph" (`DESIGN.md:158`) "and each other line the report names", which cannot be checked; `DESIGN.md:379` is one line that also describes the source tab's bar toggles (Preview, Blame) that U3's toolbar work could rewrite, and two edits to different sentences of one line conflict. Simple if U3 leaves 379 alone, needs reading otherwise.
6. **`Source.svelte`, `File.svelte`, `Merge.svelte`** (D27 script lines; U3 markup, style and the `Toolbar` import): `import Toolbar` is at `Source.svelte:61`, `File.svelte:57`, `Merge.svelte:43`; D27's imports are at `Source.svelte:67`, `File.svelte:63`, `Merge.svelte:59`, i.e. 6, 6 and 16 lines apart; U3 moves `Toolbar` to `ui/frame/toolbar/` so its import line changes. Different hunks, simple, provided D27 puts its new selector destructure away from line 61. Not verified for the other views, whose U3 edits are not enumerated.
7. **`Editor.svelte` (`ui/controls/editor/`, 517 lines per `wc -l`)**: U3 lists it among components at the 540-line limit and says it splits any component it would take over 540 (U3.md item 8, "first among them ... `Editor.svelte`"). D27 changes its script lines 268 and 319. If U3 splits it, D27's lines move and the merge is not a clean hunk merge. Needs reading; consider ordering D27 before U3's split, or having U3's builder told D27's lines.
8. **`tests/views/sources/source.test.ts`**: U3 writes `tests/views/` (pinned markup); D27 edits lines 494-512 and the fake client to carry a map. Different hunks likely, needs reading.
9. **Q85c**: no overlap of files (it writes no `src/lib/state`, `ui`, `server`, `routes` or `config`; D27 writes none of its listed data files unless the finder goes into `catalogs.ts`, Names 4). `tests/data/` is shared by directory: D27's new file goes in `tests/data/helpers/files/` (3 items today), Q85c adds cases to existing files there. Simple. The brief's sentence about `data/helpers/files/` is wrong (Premises 2).
10. **`docs/diagrams/`**: all five steps regenerate it; resolve by rerunning `npm run diagrams` after merging, not by merging the generated files.
11. **`config/text/`**: U3 (tooltip words, likely `ui.yml`) and D27 (`findings.yml`, and `statusbar.yml` per Names 1) write different files of the folder; simple.

## Declined to judge

- Whether Monaco's Monarch colours for c, cpp, lua, ruby, scss, java and dart look acceptable before the Shiki provider replaces them: needs a browser look.
- Whether `notIn: ["string","comment"]` in the rite configuration is honoured under the Shiki bridge's token types: needs Monaco running.
- Whether `keys.test.ts`, `status.test.ts` and `boundaries.test.ts` go red: read from source, tests not run (read-only role, and a suite run writes caches).
- The exact hunks of D35 and U3 beyond what their "Paths" list says; both briefs leave open-ended lines ("each other line the report names").
- Whether Z78's "every language of the three repositories that Shiki ships" is met by the plan's list: the ruling's text (commit 4054841e's state file) names C, C++, CMake, Lua, Ruby, SCSS, Java, Dart, Fortran, Jinja, `.pyi` and Svelte, which the brief carries; `git ls-files` in the three repositories also shows `.csv` (177 files in the hub, a Shiki grammar `csv` exists) and `.clo` (14 LaTeX class-option files); I did not judge whether they were meant to be in scope, and neither appears in the ruling.
- Performance of `languageMap` per call (Implied 13): the cost was not measured.
- Whether the added hljs registrations change the server's start time or bundle size: not measured.

Usage: Sonnet 5.5 (claude-sonnet-5-5)

Usage (from the completion notice): claude-sonnet-5-5, 301,967 tokens, 104 tool uses, 16.6 min.

## Closed

Each finding is closed by a change to `agents/briefs/D27.md`, re-read on main at acbf7544 (Q85c and D31 landed).

Names
1. The status bar and the picker: item 8 registers `svelte`, `rite` and `fortran-fixed` in highlight.js on wrapped grammars with no aliases, so `registered()` equals the map's languages plus plaintext and every alias keeps its owner (case 23 checks `html`, `svg`, `f90`, `h`); item 9 adds the `statusbar.language_<name>` keys with VS Code's display names (Z178, automode); `statusbar.yml`, `status.test.ts` and `keys.test.ts` are in the paths.
2. `commands.ts:33` is in the paths and calls `ensureLanguage` (item 5); case 11 is the picker case.
3. `boundaries.test.ts` (row and comment) and `DESIGN.md:171` are in the paths, item 11.
4. The finder is `languageFindings` in a new `src/lib/data/sources/config/languages.ts`, re-exported from `data/sources/config.ts`, called from all three lists, `config-key.ts` `FINDERS` included (item 3).
5. Item 12 names `DESIGN.md:85`, `:379`, `HELP.md:230` and the head of `sources.yml`.
6. Item 8 rewrites the head comment lines 11-23 and `languageNamed`'s doc.
7. The pinned tests are listed under "What is on the tree", `paint.test.ts` named in place of "the kit's load test"; item 13 says they are rewritten. `fs-shape.test.ts:107-109` holds again, since a language the editor does not colour is dropped (decision 10).
8. Decision 7: `typeOfFile` answers the kind only; `languageOf(name, map)` alone takes the map; `fs.svelte.ts`, `File.svelte`, `Tree.svelte`, `opening.ts` and `+page.svelte` leave the paths.

The step line
1. `.pyi` is in item 1's python line; `.wren`, `.dot` and `.gv` are named as absent on purpose.
2. Verify 5: `grep -rn "cathedra" src` prints only the rite module's head comment.
3. Item 1 lists every ending per language; decision 4 gives `.h` to cpp, as VS Code's C++ language claims it, with the fence alias staying c.

Premises
1. Line numbers corrected: `file-type.ts:94-96`, `load.ts:126-128` (known at :125), `load.ts:204`.
2. The reader follows `opens-in-program.ts` as Q85c left it on main; the sentence about Q85c's paths is gone (it has landed).
3. `section: Files` is now ruled: Z178 (the orchestrator, automode), a new section Files.
4. Noted; the brief asks no edit of `behavior.yml`.

Cases and checks
1. Decision 6: the rite files are carried as a TypeScript module with every value unchanged, so no ignore file and no audit is narrowed; Verify 4 is a deep-equality check against cathedra's files, quoted once. The lazy option, `.prettierignore` plus a `.json` skip in `history.test.ts`, is not taken.
2. Item 5 states both behaviours before a grammar loads (Monarch for c, cpp, lua, ruby, scss, java, dart; plain for the other six); case 10 covers one of each.
3. Item 5: every id registered with Monaco at `start()`, the load inside `painter`'s queue, `shikiToMonaco` run again with the wrap reset; the embedded grammars of svelte and jinja named.
4. Case 22: the look on TEST plus a unit test of the configuration object, called an audit.
5. Case 23 and item 8 give the mechanism for ` ```svelte ` (xml's grammar under the name svelte).
6. Holds; case 2 asks for real Shiki.
7. Case 15 names a selectors test plus the look.
8. Item 2 answers a `Map`; case 19 adds `constructor`, `toString`, `__proto__` as file names.
9. Case 6: every old name through the tracked map gives the old answer, except `.svelte` and the new names.
10. Item 1 lists `.h` under cpp alone; decision 4.

The question
1. The name cases run over `languageMap(loadConfig(ENGINE_ROOT).config)` (the line above the cases).
2. Case 7: real Shiki, every id loads and tokenizes into more than one scope; rite from its module.
3. Case 10 covers a Monaco-known and an unknown language.
4. Item 13 adds `portfolio.test.ts` and `config-key.test.ts` cases; both files are in the paths.
5. Case 22's unit test reads the configuration given to `setLanguageConfiguration('rite', ...)`.
6. Case 23 needs the svelte registration of item 8.
7. Item 13 adds a `rows.test.ts` case for the `languages` row; case 25.
8. Case 7 loads rite from its module with scope `source.rite`; case 22 checks the registration.
9. Answered by the changes above.

Implied inputs
1. Kept: case 21's class of names; `README` stays plaintext (case 3's rule, `fs.test.ts:898`).
2. Dotfiles are plaintext (item 2, case 21), and the Settings description says so (item 10).
3. An entry with a slash or (as an extension) a second dot is dropped with a finding (item 2, case 18); `x.d.ts` and `CMakeLists.txt.in` in case 21.
4. A language the editor does not colour is dropped with a finding (decision 10, case 18).
5. An empty list: no effect, no finding; an absent key: no finding (decision 11); a value that is not a map: one finding (case 17).
6. A duplicate inside one language is silent; a case-only clash across languages is the conflict of case 16 (case 20); an upper-case language name is dropped with a finding (case 18).
7. Item 4: each caller is `$derived`, a removed language makes the file plaintext; `Editor.svelte:321` calls `ensureLanguage` (item 5).
8. Cases 8, 9 and 14: in flight, interleaved with a paint, torn down.
9. Case 12: one load for both diff models.
10. Case 13: above the paint limit, no load.
11. Case 23 states the fence results.
12. Item 7 adds language settings for cmake, fortran, fortran-fixed, jinja and svelte; the others keep Monaco's.
13. Item 2: the map is computed once per config in a `$derived` selector.

ADRs: none, as the brief says.

Merge claims
1, 3, 9, 10, 11: as the report says; D31 and Q85c have landed, so only U3 is in flight.
2. `config-key.ts` is in the paths; D31 has landed, so its import block is on main.
4. The `options.yml` entry goes after `scan` (item 10); D35 is not in flight.
5. `DESIGN.md:379` is apart from U3's lines (374-375 and 392); U3's round adds 410, also apart.
6. `File.svelte` leaves the paths (decision 7); `Source.svelte`'s line 133 and import are apart from U3's hunks (28-30, 56-61, 124, 330 on).
7. U3 does not change `ui/controls/editor/Editor.svelte` (`git diff 41cc19bf --stat` in its worktree).
8. `source.test.ts` lines 494-516 are apart from U3's hunks, which end by line 314.

Declined to judge: `.csv` and `.clo` are not in Z78's list, and the brief leaves them plain.

