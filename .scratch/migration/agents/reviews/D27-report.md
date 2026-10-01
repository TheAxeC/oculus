Everything in the brief is done, with R1 to R4 carried. The full verify list printed `checks: 7 commands passed` on its third start (run 3); the first two starts each stopped at a red command (below). Not run: the look on the TEST page (rite file, the picker, a diff of two Lua files), which the brief assigns to landing.

# D27 report: the editor's languages, one map in oculus's config, the rite grammar and the Shiki grammars


## Open items of the state file (orchestrator-state.md:116-118, verbatim)

## Open items (only what Axel must rule on; every report opens with this list verbatim and repeats it until he has ruled)

An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is booked as its own step in `plan.md` and carried in the Booked section below, since it needs no ruling from him.

(The section holds no entry.)

## Rulings carried

- R1: `languageFindings` stays in `FINDERS` of `config-key.ts`. Case 16's third clause is two tests in `tests/server/edit/config-key.test.ts`: a write of the family key `languages` is refused as `not_single`, and a finder mocked as the `docFindings` mock is, giving a finding after the edit it did not give before, refuses the write. No single-value write can change the `languages` map (`writeConfigKey` sets one scalar and refuses a family, and a list element is not addressable), so the real finder is reached only through the mocked path until a write of a whole family exists (S4).
- R2: `languageNamed` answers `html` and `svg` as xml (kept by the `aliases: []` wrappers), `f90` and `f95` as fortran, `h` as c, `hpp` as cpp, `jinja` as jinja and `django` null. Changed answers, before and after (probe `languageNamed` from node over `src/lib/data/prose/languages.ts`, after the step: `html xml; svg xml; f90 fortran; f95 fortran; h c; hpp cpp; jinja jinja; django null`): `languageNamed('f90')` null to fortran; `languageNamed('h')` null to c. A fence ` ```h ` drew `<code class="hljs language-h">` with no `hljs-` span before and is C after.
- R3: `Tree.svelte` (the one `rowFacts` call) and `files-menu.test.ts` joined the paths. `rowFacts(row, fixed, addable, explorer, languages)` takes the map as a fifth argument and computes `markdown: boolean` as `kind === 'file' && languageOf(row.path, languages) === 'markdown'`; `rowMenu` reads `facts.markdown`. `row-menu.ts` holds no extension test of its own.
- R4: three more paths joined the step. `tests/ui/menu/menu-words.test.ts`: `ROW_OPS` gained `markdown: false` (before: the three `rowMenu` calls at lines 76-78 were `npm run check` type errors). `tests/views/sources/repositories/repositories.test.ts`: `section()` renders `DiffSection` with `context: clientContext(client)` (before: 2 cases failed with "Cannot destructure property 'selectors' of 'useState(...)' as it is undefined"). `tests/checks/config/config-folder.test.ts`: `EXPECTED['sources.yml']` gained `'languages'` (before: 2 cases failed with `languages` as the extra key). `Diff.svelte` passes no `language` prop.
- The premises the first run measured, as stated there, all stand and are built: `languageFindings(engine, config)`; the reader's names from `registered()` of `data/prose/languages.ts`, pinned to the `SHIKI_IDS` keys plus plaintext by `tests/ui/controls/editor/kit/grammars.test.ts` ("holds the names the highlighter registers and no other"); one nullary `$derived` (`languageMapNow`) made once in `createSelectors`, with the head comment of `selectors.svelte.ts` rewritten; the language configurations set under the Shiki ids `fortran-free-form` and `fortran-fixed-form`; the embedded grammars measured with Shiki 4.4.3 (svelte: javascript, typescript, css, postcss; jinja: javascript, css, html, jinja-html; scss: css) named in the head comments of `kit/grammars.ts` and `kit/load.ts`; `__proto__` as a key reported as an unknown language; a dotfile named like an extension (`.py`) is plaintext, because the whole-name lookup is skipped for a name starting with a dot; an extension entry `.` alone is dropped.

## The cases' first run on the unchanged tree (tests written first, in final form)

`npx vitest run --reporter=dot tests/state/sources/fs tests/ui/controls/editor/kit tests/views/sources/source.test.ts tests/data/helpers/files tests/data/sources/config/languages.test.ts tests/server/edit/config-key.test.ts tests/state/system/settings/rows.test.ts tests/state/workbench/navigation/status.test.ts tests/server/root/watch/portfolio.test.ts` printed `Test Files  13 failed | 9 passed (22)` and `Tests  15 failed | 289 passed (304)`.

- Nine files fail at import (`Cannot find module .../data/helpers/files/languages.ts` or `.../kit/rite/rite.ts`): `tests/views/sources/source.test.ts`, `tests/data/helpers/files/languages.test.ts`, `tests/state/sources/fs/file-language.test.ts`, `fs-shape.test.ts`, `fs.test.ts`, `tests/state/workbench/navigation/status.test.ts`, `tests/ui/controls/editor/kit/grammars.test.ts`, `paint.test.ts`, `rite.test.ts`.
- Fifteen cases fail on assertions: `config-key.test.ts` 3 (the languages finder cases), `tests/data/sources/config/languages.test.ts` 10 (`languageFindings is not a function`), `portfolio.test.ts` 1 (`expected [] to deeply equal ['languages.cpp','languages.cobol']`), `rows.test.ts` 1 (no `languages` row).
- Per case, on the unchanged tree: 1 holds today. 2: `stubs.pyi` plaintext, `Component.svelte` xml; Shiki's Svelte grammar gives `source.ts`, `meta.var.expr.ts` and `support.type.primitive.ts` for a `<script lang="ts">` block. 3: `Makefile` and `makefile` makefile, `CMakeLists.txt`, `notes.txt`, `build.cmake` plaintext. 4: all fifteen names plaintext. 5 holds. 6: needs the map. 7: real Shiki, a sample line of each of the 30 grammars Shiki bundles scoped more than one distinct scope (svelte 28), rite untested (no module). 8 to 14: `ensureLanguage` does not exist, `shikiId('lua')` was plaintext. 15: `selectors.languages` does not exist. 16 to 21: reader and finder do not exist. 22: `kit/rite/` does not exist. 23: see R2. 24: `registered()` had 19 names and `status.ts:259-262` mapped any other name to Plain Text. 25: no `languages` row.
- Tests added or changed after that run: `tests/state/sources/fs/languages-selector.client.test.ts` (new; `selectors.languages` does not exist on the unchanged tree, so it fails there on a TypeError, not run separately), the three R4 test files (not run on the unchanged tree; `menu-words.test.ts` and `repositories.test.ts` follow the change and pass without it too, `config-folder.test.ts` fails there on the missing key by reading, not run).

## DONE / NOT DONE

Commands run from `tools/oculus` in the worktree with `PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH`.

| Item | State | Proof |
|---|---|---|
| 1 map `languages:` in `config/sources.yml` (32 entries with plaintext, flow style, `.wren .dot .gv` absent) | DONE | `python3 -c "import yaml; yaml.safe_load(open('config/sources.yml'))"` exit 0; `tests/data/helpers/files/languages.test.ts`, `tests/state/sources/fs/file-language.test.ts` pass |
| 2 reader `languageMap`/`readLanguages` | DONE | `src/lib/data/helpers/files/languages.ts`; 17 reader cases pass |
| 3 finder in the three lists | DONE | `tests/data/sources/config/languages.test.ts`, `portfolio.test.ts`, `config-key.test.ts` pass |
| 4 `file-type.ts`, selector, five callers | DONE | `grep -n "LANGUAGES\|NAMES" src/lib/state/sources/explorer/file-type.ts` prints nothing (rc 1); `tests/state/sources/fs/` and `languages-selector.client.test.ts` pass |
| 5 grammars, `ensureLanguage`, `close`, picker | DONE | `tests/ui/controls/editor/kit/paint.test.ts` (cases 8 to 14), `grammars.test.ts` (case 7) pass |
| 6 rite module | DONE | node one-off: `equal: grammar (6 keys), configuration (5 keys), word pattern source [^\s()\[\]{}";]+` (deep equality with both cathedra files, the word pattern as its source string) |
| 7 language settings | DONE | `tests/ui/controls/editor/kit/rite.test.ts` (an audit of the values handed to Monaco) |
| 8 code window registrations | DONE | `tests/views/sources/source.test.ts`; `languageNamed` probe above |
| 9 status bar names | DONE | `tests/state/workbench/navigation/status.test.ts`, `tests/checks/source/keys.test.ts` |
| 10 Settings entry | DONE | `tests/state/system/settings/rows.test.ts` ("is a family row of the section Files, set") |
| 11 layer rule | DONE | `tests/checks/tree/boundaries.test.ts` |
| 12 docs | DONE | `DESIGN.md` lines 85, 171, 379; `HELP.md` line 230; head comment of `config/sources.yml` |
| 13 tests | DONE | the verify list below |

Verify list:

- 1 (full list): `npm run diagrams`, then `sh ~/.claude/skills/land/templates/checks.sh .scratch/migration/orchestrator-state.md` printed `$ npm test`, `$ npm run test:checks`, `$ npm run check`, `$ npm run build`, `$ npm run format:check`, `$ npm run lint`, `$ ! LC_ALL=C grep -rna '[^ -~]' src tests` and `checks: 7 commands passed`, exit 0.
- 2: the scoped list passes inside `npm test`: `Test Files  418 passed | 22 skipped (440)`, `Tests  10947 passed | 619 skipped (11566)` (the `npm test` run alone after its fix).
- 3: `grep -n "LANGUAGES\|NAMES" src/lib/state/sources/explorer/file-type.ts` prints nothing.
- 4: the node one-off above, run over `kit/rite/rite.ts` directly with Node 24.
- 5: `grep -rn "cathedra" src` prints three lines: `src/lib/ui/controls/editor/kit/rite/rite.ts:3` (the head comment) and two older comments, `src/lib/server/files/files.ts:6` and `src/lib/views/sources/document/Document.svelte:17`, about cathedra's manuals. Nothing imports, reads or fetches from cathedra.
- 6: the yaml parse exits 0.
- ASCII gate (spec): prints nothing (it also prints `bfs: error: bin: No such file or directory` when `bin` is in its file list, as the worktree has no `bin`; I ran it with `src tests config`).
- 7: the failing first run is quoted above; tests that audit rather than prove are the ones named "audits that ..." and `rite.test.ts` (values handed to Monaco; that Cmd+/ toggles, a bracket closes and a pair matches is Monaco's, shown by the look).

Number of full-list runs: 3 starts. Start 1 was run with `cd ../..` before `checks.sh` (the command as R4 wrote it) and ended at its first command with `npm error ... Could not read package.json` (`checks: failed with exit 254: npm test`), never reaching the tests. Start 2 (from `tools/oculus`) stopped at `npm test` on one case, `tests/views/system/help.test.ts > describes every configuration file in the words the Config view shows` (the `sources.yml` row of `HELP.md` no longer held the Config view's description verbatim); fixed in `HELP.md` line 230, `npm test` rerun alone (`exit 0`), then start 3 passed.

## Files and line counts (all under tools/oculus)

New: `src/lib/data/helpers/files/languages.ts` 97, `src/lib/data/sources/config/languages.ts` 62, `src/lib/ui/controls/editor/kit/rite/rite.ts` 326, `src/lib/ui/controls/editor/kit/rite/settings.ts` 43, `tests/data/helpers/files/languages.test.ts` 163, `tests/data/sources/config/languages.test.ts` 116, `tests/state/sources/fs/file-language.test.ts` 273, `tests/state/sources/fs/languages-selector.client.test.ts` 52, `tests/ui/controls/editor/kit/rite.test.ts` 105.

Changed: `config/sources.yml` 130, `config/catalogs/options.yml` 623, `config/text/findings.yml` 109, `config/text/statusbar.yml` 130, `HELP.md` 302, `DESIGN.md` 419, `src/lib/data/sources/config.ts` 72, `src/lib/data/prose/languages.ts` 160, `src/lib/state/sources/explorer/file-type.ts` 65, `src/lib/state/sources/fs.ts` 837, `src/lib/state/client/selectors.svelte.ts` 510, `kit/grammars.ts` 92, `kit/load.ts` 324, `Editor.svelte` 518, `DiffEditor.svelte` 398, `commands.ts` 40, `Source.svelte` 441, `source/Editor.svelte` 218, `Merge.svelte` 326, `DiffSection.svelte` 419, `Tree.svelte` 533, `row-menu.ts` 276, `portfolio.ts` 441, `context.ts` 462, `config-key.ts` 335, and the tests `grammars.test.ts` 187, `paint.test.ts` 554, `look.test.ts` 36, `fs.test.ts` 879, `fs-shape.test.ts` 379, `source.test.ts` 650, `files-menu.test.ts` 570, `repositories.test.ts` 757, `menu-words.test.ts` 159, `config-key.test.ts` 657, `portfolio.test.ts` 877, `rows.test.ts` 551, `status.test.ts` 372, `boundaries.test.ts` 620, `allow-audits.txt` 122, `config-folder.test.ts` 672, and `docs/diagrams/` as `npm run diagrams` regenerated it. Folder counts: `src/lib/data/sources/config` 10, `kit` 8, `data/helpers/files` 4, `tests/state/sources/fs` 5, `tests/ui/controls/editor/kit` 7. No file is over 1000 lines.

## Judgment calls the brief left open

- `readLanguages(config)` returns `{ map, drops }` and `languageMap` is its map; the finder words the drops, so the page and the server cannot disagree about what was dropped. A claimed ending is reported once per pair of languages.
- `kit/grammars.ts` exports `SHIKI_NAMES` (31 names), `SHIKI_LANGUAGES` (31 ids), `FIRST_LANGUAGES` (the 18 ids loaded with the first editor); `painter` returns `{ paint, ensureLanguage, close }`, `EditorKit` gains `ensureLanguage`, and `runCommand` takes the kit. `ensureLanguage` runs in the paint queue, waits for the first paint when asked earlier, forgets a failed load (the next model of that language retries and logs again), and `close` is wired to a `pagehide` that is not a page-cache hide.
- `ensureLanguage` is called once in each component's language `$effect` (`Editor.svelte`, `DiffEditor.svelte`), which runs after a model is made and whenever the language changes, in place of the two call sites per file the brief names; a second call for a loaded or loading language does nothing.
- `kit/rite/settings.ts` gives Monaco `surroundingPairs` as objects. Monaco reads `pair.open` of each surrounding pair (`cursorCommon.js:77-81`), and cathedra's file gives each as a two-element array, so the module keeps the file's arrays (Verify 4 equality) and the registration converts them; `rite.test.ts` pins both.
- Case 15's plain selector test checks equality: an unowned `$derived` recomputes on every read outside a reactive scope. `languages-selector.client.test.ts` checks, inside effects, that readers of one config share one map and that a new config gives a new one. A config message with an unchanged `languages:` also gives a new map, because the derived runs again for each new config object.
- Tests in `tests/views/` that draw nothing are named "audits that ..." (`tests/checks/tree/audits.test.ts`), and the two absence assertions in `source.test.ts` carry a reason comment (`negatives.test.ts`); `allow-audits.txt` changed on one line, the `[name, languageOf(name, MAP)]` expression.

## Host- and user-visible changes, before and after

- A file's language: `.pyi` plaintext to python; `.svelte` xml to svelte (Shiki's Svelte grammar in the editor, xml's grammar in the read-only code window); `.h` plaintext to cpp; `.c .i` plaintext to c; `.cpp .cc .cxx .hpp` and the rest plaintext to cpp; `.cmake` and `CMakeLists.txt` plaintext to cmake (the whole name is matched before `.txt`); `.lua`, `.rb Gemfile Rakefile`, `.scss`, `.java`, `.dart`, `.f90`, `.f`, `.jinja .j2`, `.rite` plaintext to their languages. `.wren .dot .gv` stay plaintext. Every ending in force before stays on its language (case 6).
- Status bar names: `C`, `C++`, `CMake`, `Lua`, `Ruby`, `SCSS`, `Java`, `Dart`, `Fortran`, `Fortran (Fixed Form)`, `Jinja`, `Svelte`, `Rite` in `config/text/statusbar.yml`; a `.cpp` file read Plain Text before and reads C++ after (from `status.ts:259-262` and the `registered()` count 19 to 32). The picker lists the 32 names.
- Settings: a `languages` family row in the new section Files (`config/catalogs/options.yml`), fields key and value.
- Code window and Markdown fences: ` ```cpp `, ` ```c `, ` ```h ` (c), ` ```jinja `, ` ```svelte ` (xml's grammar) coloured; ` ```django ` and ` ```rite ` plain; ` ```html ` xml.
- Editor: grammars beyond the first 18 load on the first model of their language; until then c, cpp, lua, ruby, scss, java and dart draw Monaco's colours and the other six draw plain. Loading svelte or jinja brings in their embedded grammars (the measured lists above), so Shiki's tokens then also colour html and scss models.
- Files menu: Open Preview is offered on a file whose language in the map is markdown.

## Anything in the brief wrong, with evidence

- Verify 5 expects one `cathedra` line; the tree has two older ones (`files.ts:6`, `Document.svelte:17`), listed above.
- Item 2 names the editor's languages as the keys of `SHIKI_IDS`, which the data layer cannot import (`tests/checks/imports/order.ts`); the reader uses `registered()`.
- Item 3 names `languageFindings(config)`; a `Finding` carries an absolute `file` and its siblings take the engine.
- Items 5 and 7 name `fortran` and `fortran-fixed` for the configurations; Monaco's ids are the Shiki ids.
- Item 6 and surroundingPairs: see the judgment calls.
- The embedded grammars are not the brief's list (html and scss for both): measured lists in the premises.
- The R4 command line for the verify list runs `checks.sh` from the worktree root, where `npm test` finds no `package.json`; the state file's line says it runs from `tools/oculus`.
- The Config view's description of `sources.yml` (`desc_sources` in `config/text/views/system/config.yml`) still reads only "What the portfolio reads: ..." and does not mention the language map. That file is outside this step's paths; `HELP.md` holds that sentence verbatim (`help.test.ts` requires it) and adds the map after it. Changing `desc_sources` needs that file and the `HELP.md` row changed together.
