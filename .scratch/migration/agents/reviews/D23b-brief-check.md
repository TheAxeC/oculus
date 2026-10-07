# Brief check of D23b (tools/oculus/.scratch/migration/agents/briefs/D23b.md)

**Open items for Axel, first.** I found three choices that Z682 does not settle. Each has options and a recommendation under check 4 and the closing judgements.
- **The Svelte approval.** What exactly the reader approves, under what key, and on what wire message (findings 4.3 and 4.4).
- **A test for "no repository code runs unapproved".** No guarded entry covers it, and a new entry needs Axel's yes (finding 4.6).
- **Where the lsp-edit tests belong.** Cases 8 and 9 are G8 and G9 guarantees. Putting their rows under G10 means widening G10's guarantee text (finding 4.5).

Main is at c23093bd, one commit past the brief's base c0a4af9c. It changes nothing in tools/oculus outside .scratch: `git log --format='%h %s' c0a4af9c..HEAD` prints only `c23093bd Book the rechecks of the ready steps and M8's open item`, and `git diff --stat c0a4af9c HEAD -- tools/oculus ':!tools/oculus/.scratch'` prints nothing. The brief is the only file in the plan folder whose diff is unstaged: `git status --short` shows ` M agents/briefs/D23b.md` and `?? agents/briefs/PR4.md`.

## 1. Names

1. **The References view's path is wrong.** The brief points at `src/lib/views/sources/references/`, which does not exist.
   - Command: `ls src/lib/views/sources/` lists `data doc document file files note repositories search source venues`.
   - The view is `src/lib/views/sources/search/References.svelte` (368 lines, `wc -l`).
   - Its strings are the group `references:` in `config/text/views/sources/search.yml:3` (`grep -rn "^    references:" config/text`).
   - There is no `config/text/views/sources/references.yml`, and that folder is full at 10 (`git ls-files | cut | sort -u | wc -l`), so the file cannot be added there.
   - The write list names both missing paths and leaves out the real two: `views/sources/search/References.svelte` and `config/text/views/sources/search.yml`. Part 8 cannot be built inside the write list as it stands.
2. **The path of `palette-modes.ts` is wrong.** The write list names `src/lib/state/workbench/palette-modes.ts`, but `find src -name "palette*"` puts it at `src/lib/shell/keys/palette-modes.ts`. That file is inside the write list only by the line "the file that binds Cmd+T and Shift+Alt+H", which does not describe it.
3. **Cmd+T is free.**
   - `src/lib/shell/keys/keys.ts:131-145` (`appKey`) binds only KeyW, KeyN and KeyF. `:111-112` binds Cmd+Shift+B and Cmd+Alt+T.
   - Monaco binds the T key only for transpose: `grep -rn "KeyCode.KeyT \*/" node_modules/monaco-editor/esm/vs` finds `transpose.js:22: primary: 256 /* KeyMod.WinCtrl */ | 50`, which is Ctrl+T on macOS.
   - The desktop menu (`src/desktop/windows/menu.ts`) uses `Cmd+,`, `Cmd+Shift+N`, `Cmd+Shift+W`, `Cmd+R`, `Ctrl+Cmd+F`, `Cmd+=`, `Cmd+-`, `Cmd+0` and `Alt+Cmd+I`. None is Cmd+T.
   - The change makes no existing statement false through a key clash. It does make `docs/window.md:7` false: that line lists the app's keys exhaustively ("the keys Cmd+W, Ctrl+Tab ..., Cmd+N, ..., Cmd+F"), and it is not on the write list.
4. **Shift+Alt+H is free.**
   - In oculus, `grep -rni "alt+h\|shift+alt\|alt+shift" src config HELP.md` finds only Shift+Alt+F5.
   - `keys.ts:168-180` takes Cmd+Shift+H for Replace in Files, and it requires `altKey !== true`.
   - In Monaco, `grep -rn "KeyH" node_modules/monaco-editor/esm/vs/editor/contrib` finds only `findController.js:815`, Cmd+H for Replace.
5. **The `#` prefix is free in the palette, and the palette's docs are not on the write list.**
   - `palette.ts:278` handles only `:`. `grep -rn "startsWith('#')"` finds no palette hit. `:accent`'s hint `'<name | #hex | reset>'` sits after a colon, so it does not collide.
   - `docs/window.md:74` ("Cmd-K opens the palette. With nothing typed it lists the views; a word typed searches...") becomes incomplete. It is not on the write list.
   - The palette strings are `app.palette.*` in `config/text/app.yml`. The `#` mode's row kind and empty state need keys there, and `app.yml` is not on the write list.
   - `src/lib/shell/keys/Palette.svelte` (508 lines, 12 lines below the 520 limit) is not on the write list. Neither is a rows component beside `ChoiceRows.svelte`, and `shell/keys` is full at 10.
6. **`ServerId`, `SERVED_LANGUAGES`, `SEMANTIC_LANGUAGES`: every hit is on the write list.**
   - `grep -rn ServerId src tests`: `servers.ts:41,97,118` and `relay.ts:64,85`.
   - `SERVED_LANGUAGES`: `hosts.ts:21,147` and `views/sources/source/language/lsp.ts:31,117`.
   - `SEMANTIC_LANGUAGES`: `client.ts:40,300`. Its use is at :300, not :219; :219 is the format-on-type branch, as the brief's second number says.
   - `hosts.ts:10` has a head comment, "Pyright serves `python`, clangd `c` and `cpp`", that part 1 makes false. That file is on the write list.
7. **`RefKind` also exists in two other modules.**
   - `grep -rn RefKind src tests`: `server/core/git/compare.ts:53` (exported, `'branch' | 'remote' | 'tag'`) and `views/sources/repositories/menus/graph-menu.ts:60` (exported).
   - The one in `references.ts:19` is module-local, so widening it collides with neither. If the builder exports it, it becomes a third exported `RefKind`. The brief could ask for a distinct name.
8. **`lsp-edit` and the History label have no hits today** (`grep -rn "lsp-edit\|lsp_edit\|Edited by a language server"` over src, tests, config and docs). The new field still needs readers that are off the write list:
   - `src/lib/views/system/history/rows.ts:70-83` draws the History label. For an unknown field it ends in `return field`, so without an edit there the row reads "lsp-edit".
   - `src/lib/views/system/history/History.svelte:143` names a row by `row.field === 'replace'`.
   - `src/lib/state/sources/explorer/acts/undo.ts:93` (`replacedPlaces`) is what makes source tabs re-read after a replace is undone. Without an lsp-edit branch, a tab over an undone file keeps the stale text.
   - `src/lib/server/files/fs/history.ts:59` has `HistoryKind = 'save' | 'replace' | 'delete'`, and `timeline.ts:15`, `timeline-reads.ts:35` and `Timeline.svelte:152` follow it. The copy kind of an lsp-edit history copy is a key in a saved record under `~/.oculus`, a user-visible shape by spec.md, and the brief does not decide it.
9. **The catalog keys.**
   - `statusbar.yml:76-77` (`server_pyright`, `server_clangd`) share the `server_` prefix with `server_open`, `server_closed`, `server_connecting` and `server_tip`.
   - `source.yml:16-17,24-25` hold `cmd_clangd_*` and `cmd_python_*`, keyed partly by server and partly by language.
   - `tests/checks/source/keys.test.ts:307-316` ('uses literals except at the documented computed prefixes') refuses any `t()` whose key is computed, unless it is in `COMPUTED_PREFIXES` (:144) or `REGISTRATION_LOOKUPS`. So part 1's "the entry names its labels' text keys", read as `t(entry.labelKey)`, fails that check unless someone edits the allow list. That file is off the write list, and spec.md counts an allow-list edit as a reported change.
   - `source.yml:51`, `lsp_other_files: This change edits other files too; open them to apply it there.`, becomes false after part 4. The brief does not name it.
10. **The package names.**
    - `README.md:15` must also name `typescript` (Apache-2.0) once it is a runtime dependency.
    - The same line says "The app's two development dependencies are `electron` (MIT) ... and `@electron/packager`". That stays as it is.
    - `grep -rln "licen" tests` finds no test over the licence list.

## 2. The step line

The step line is `plan.md:555`. The brief quotes D23b's line as it was before Z126, D34's line, and Z682 (`plan.md:1456`).

1. **D23b's line, part by part.**
   - "edit files no tab holds (rename, code actions, `workspace/applyEdit`) through oculus's write chain" maps to parts 3, 4 and 6.
   - "workspace symbols" maps to part 7, "call and type hierarchy" to part 8.
   - "the TypeScript and Svelte servers from npm as pyright's is (D34)" maps to part 2.
   - "after D23" is met: D23 and D23c are booked (`plan.md:547` area).
2. **D34's line has a part with no requirement.** "TypeScript and Svelte language features on D23's relay" maps to part 2, but part 2 names no capability set for the two new entries.
   - Each entry's `capabilities()` decides what the page gets: completion trigger characters, signature help, code action kinds, organize imports, formatting, semantic tokens, inlay hints, folding, rename and hierarchies.
   - The precedent is Z72 (4) (b1), "every feature both servers offer".
   - "Which features the TypeScript and Svelte servers serve" has no requirement. Case 10 checks only hover, completion, definition and diagnostics.
3. **Z682, item by item.**
   - (1) maps to parts 3 and 4. (2) maps to parts 4 and 5. (4) maps to part 7, (5) to part 8, (6) to part 2.
   - (3) maps to part 6. Its "no preview before D39" is not stated, but nothing contradicts it.
   - (7) maps to the "Doc text" paragraph, but see 4.5.
   - (8) maps to part 1.
   - Every part has a requirement except the one in 2.2.

## 3. Premises

Most claims reproduce. These are the exceptions and the corrections.

1. **False: the References view.** "`src/lib/views/sources/references/References.svelte` 368 lines" is wrong; the file is `src/lib/views/sources/search/References.svelte` (see 1.1). `references.ts` 186 lines and `RefKind` at :19 hold.
2. **Incomplete: what the Svelte server loads.** The brief says svelte-language-server "loads a repository's own `svelte` package and `svelte.config.js` through `@sveltejs/load-config`". It loads more.
   - `npm view @sveltejs/load-config@0.2.3 description` prints "Load Svelte config via vite.config or svelte.config".
   - The package's `dist/src/lib/documents/configLoader.js` (read through unpkg) matches `/\/(svelte\.config\.(js|ts|cjs|mjs|mts)|vite\.config\.(js|mjs|ts|cjs|mts|cts))$/` while it crawls the workspace with fdir.
   - `@sveltejs/load-config/dist/src/index.js` loads the file with `dynamicImport(pathToFileURL(configFilePath).href)`. It also imports the repository's own `vite`, through `require.resolve('vite/package.json', { paths: [fromPath] })`.
   - `importPackage.js` resolves `svelte`, `prettier` and `prettier-plugin-svelte` from the workspace first when trusted, and `svelte-preprocess` from the workspace only.
3. **True but misleading: "No tracked `svelte.config.*`".** `git ls-files '*svelte.config.*' '*vite.config.*'` prints `tools/oculus/vite.config.ts`. `git ls-files '*.svelte' | cut -d/ -f1-2 | sort | uniq -c` prints `357 tools/oculus`. So every `.svelte` file in the hub is oculus's own, and once approved the Svelte server imports `tools/oculus/vite.config.ts` and oculus's `vite`.
4. **The Svelte server has a trust switch the brief does not mention.**
   - In `svelte-language-server@0.18.4/dist/src/server.js`: `const isTrusted = evt.initializationOptions?.isTrusted ?? true;`, `configLoader.setDisabled(!isTrusted)`, `setIsTrusted(isTrusted)`.
   - Started with `isTrusted: false`, it loads no config and no workspace package, and it logs "running with reduced capabilities".
   - That makes a third option beside "start only after approval" and "start freely": start untrusted without an approval, and trusted once approved. Z682 (6) did not weigh it.
5. **Holds: the TypeScript server can be pinned to oculus's tsserver.**
   - typescript-language-server's `docs/configuration.md` documents `tsserver.path` ("The path to the `tsserver.js` file or the typescript lib directory").
   - Its `src/tsServer/spawner.ts` pushes `--globalPlugins` and `--pluginProbeLocations`, built from the `plugins` init option, and never `--allowLocalPluginLoads`. So tsserver does not load a tsconfig `plugins` entry from the repository; the probe falls back to tsserver's own install location, which is oculus's.
   - Two things the brief does not state:
     - **Automatic Type Acquisition** is on unless `disableAutomaticTypingAcquisition` is set. Then tsserver forks its typings installer, which runs `npm` from PATH and installs `@types` packages over the network. That process is outside "oculus's own command with oculus's own arguments" (DESIGN.md:165, :571).
     - **The tsserver log** goes "within the workspace, inside the `.log` directory" when `tsserver.logDirectory` is unset and logging is on. Case 10 invites quoting "the server's log", so the builder could write into a repository.
6. **Holds: the packages.**
   - `npm view typescript-language-server@6.0.1`: Apache-2.0, engines `node: '>=22.22.2'`, modified 2026-09-24, no dependencies listed.
   - `npm view svelte-language-server@0.18.4`: MIT, peer `typescript: '^5.9.2 || ^6.0.2'`, and it depends on `svelte: '^4.2.19'`. Its fallback compiler for a repository with no `svelte` package is Svelte 4, which is relevant to case 11.
   - `node -p "require('typescript/package.json').version"` prints 6.0.3, and `package.json:47` has `"typescript": "^6.0.3"`. `package.json:94` has `"pyright": "1.1.414"`. `ls node_modules/{typescript,svelte}-language-server` says no such file for both.
   - `node -v` prints v24.21.0, which meets >=22.22.2. Electron 44.5.1's Node version is not verified; the app starts the servers with `process.execPath` (`context.ts:342`).
7. **Holds: code actions.** `transport.ts:543-575` as stated; the stripped edit is at :556.
8. **Holds: applyEdit on the page.** `transport.ts:609-637` as stated. It applies only to `doc.models[0]` (:637).
9. **Holds: the relay's routing.** `relay.ts:710-746` and `#toPage` :752-768. The channel comes from the first key of `edit.changes` (:723-727). Without a uri it falls back to `#channelFor`'s first channel of the entry (:700-707).
10. **Holds: the `documentChanges` defect.** `uris.ts:281-329`. The array walk at :288-290 filters out a DROPped entry, while a `changes` key that does not map drops the whole edit (:307-313).
11. **Holds:** `addressOf` (`wire.ts:90-115`), `#route` (`relay.ts:461-476`) and `initializeParams` (`servers.ts:282-324`) declare no applyEdit or workspaceEdit capability.
12. **Holds:** `servers.ts:6` reads "a new server is one entry here and nothing else", and that sentence is false today.
13. **Incomplete: the list of server-naming places.** These are missing:
    - `palette.ts:299` `DATABASE_LANGUAGES = ['c', 'cpp']` and `palette-modes.ts:39` `served === 'c' || served === 'cpp'`.
    - `model-processes.ts:211` `{ oculus: 'approve'; root: string; interpreter: string }`, and the interpreter and database fields of `ChoicesBody` (:235-240).
    - The `Setup` type (`servers.ts:23-36`: `interpreter`, `interpreterPrefixes`, `databaseFolder`, `fallbackFlags`).
    - `ChoiceRows.svelte` and `lsp.svelte.ts:100,353` (the `approve(root, language, interpreter)` call).
    - `hosts.ts:10`'s head comment.
    - DESIGN.md:165 ("A language server (pyright or clangd ...)") and DESIGN.md:512 ("`formatOnType` for a C or C++ model, as clangd formats").
14. **Holds: the write chain.** `ops.ts` opsShape :156-209 and `chained` :692; `context.ts:578`; `FILE_FIELDS` `file-ops.ts:321-331`; `history.yml:79`.
    - `ops.ts` is 814 lines, so it has 66 lines of room.
    - The guard the brief calls "G3's rules" is `guarded` (`ops.ts:375`), which protects only local.yml by inode. ops refuses no dot path and no `closed_paths` folder (`grep -n closed ops.ts replace.ts` finds nothing).
15. **Holds:** `library.test.ts:646` is titled 'passes an edit a server asks the page to apply that names a file the page holds an address for, under that address'.
16. **Holds, but the test belongs to G7.** `servers.test.ts:49` expects `['/node', 'clangd']`. It sits in the test G7 names ('starts each server and the interpreter probe with an argument array ...'), not G36's.
17. **Holds: folder counts and sizes.** The counts match my `git ls-files` runs, including `tests/routes/edit` at 10. `relay.ts` is 845, `context.ts` 877, `transport.ts` 819 and `Source.svelte` 520.

## 4. Cases and checks

1. **Case 6 fits G2.** G2's Code line names `uris.ts`, and its lsp test is `uris.test.ts`. The row proves only that `toPage` returns null; "`applied: false`; nothing written" is the relay and the page, which are checked by reading.
2. **Case 7 is partly outside its entries and partly outside its test file.**
   - "Outside the roots" fits G2's ops row ('refuses a path that climbs out ... (case 5)', `tests/server/files/ops.test.ts`).
   - "`local.yml`" is a G3 unit. G3's ops-replace row lives in `tests/routes/replace/ops-replace.test.ts:97`, which is off the write list.
   - "A dot path" is in neither G2's nor G3's text, and part 3 does not require refusing one. The case asks for a refusal that no requirement builds.
   - "The file operations entry" (G10: Trash, Delete for good, paste with Replace) covers none of the three.
3. **Case 11 can be run by a builder, but the approval itself is unspecified.**
   - The approval lands in the scratch HOME's approvals file, so a builder can run the flow.
   - Not specified: what the reader is asked and where (pyright's is a Confirm in the palette's `:interpreter` list, `ChoiceRows.svelte:60-79`), the approval key, and the wire message (`approve` carries `interpreter` only).
   - DESIGN.md:165 keys an approval "by the text, so a changed text asks again". Brief decision 5, "the processes approval of the repository's folder, asked once per repository", approves a folder whose `svelte.config.js` and `vite.config.*` can change without asking again. That departs from DESIGN.md:165, and it is a clash between a ruling and a design rule, which is Axel's.
   - The case's repository has no config, so it does not exercise the hazard.
4. **Case 4 may not produce an edit at all.** pyright and clangd usually refuse to rename a symbol declared in a library or system file. Not run (no server started), so not verified. The "first run" rule will show it, but the brief could name a setup that reaches the `oculus-lib:` refusal.
5. **Cases 8 and 9 belong to G8 and G9, not G10.**
   - Case 8 (stale expected text, nothing written) is G8's guarantee ("A write whose base the file no longer holds is refused").
   - Case 9 (undo restores both files) is G9's. G9's replace rows are in `tests/routes/replace/replace-undo.test.ts` and `tests/routes/files/file-undo.test.ts`, both off the write list. `ops.test.ts` tests `handleOps`, not the undo route.
   - Z682 (7) puts the rows under G10, but G10's text covers neither guarantee, so the rows would test a promise the entry does not state.
   - The options:
     - (a) The rows go under G8, G9, G2 and G3, with each Code line widened to name the lsp-edit module in "Doc text". Recommended: no new guarantee is needed.
     - (b) Widen G10's text. That is a new guarantee, which needs Axel's yes.
   - The lazy option is to leave the rows under a text that does not state them.
6. **The guarantee that no repository code runs without the approval gets only a browser run.** This is the kind of behaviour whose failure costs something: repository code executed. No entry covers it (`grep -n "^- G" guarded.md | grep -i approv` finds G31, G38, G49 and G43, none for language servers), and a new entry is Axel's.
   - Recommended: ask Axel for an entry. Its test row would be a fixture repository whose `svelte.config.js` would write a marker file if it were imported, so the row reads the marker's absence without an approval. That is a fixture, not breakage testing.
7. **Case 12 credits a G7 test to G36.** `servers.test.ts:49` is in G7's test, not G36's, so the brief should say case 12 widens G36's rows and G7's row. The fake spawn also needs the Svelte approval stubbed, or the Svelte server will not be in the spawned list.
8. **No case asks for a forbidden test.** None asks for breakage, mutation or a revert. Running a new test on the unchanged tree is what spec.md asks for.
9. **The re-parse check is missing from part 3.** spec.md: "A write that edits a file's text re-parses its own result and refuses when the reparse is not what was asked." Part 3 names the history copy, the splice and the atomic write, but not the reread and recheck that `replace.ts` does.

## 5. The question (could it pass without the goal being reached?)

1. **Case 3 and decision 2: yes.** The page never holds the text of a file no tab holds, and LSP gives no version for an unopened file (`OptionalVersionedTextDocumentIdentifier.version` is null). The hash can only be of text the page reads just before the POST. A file that changed on disk after the server read it, but before the page's read, matches its hash and is written at stale offsets. Decision 2's sentence "a file changed on disk since the server read it is never overwritten" cannot be built as worded, and case 3 cannot be staged in the milliseconds between the answer and the POST.
2. **Case 11: yes.** A repository with no `svelte.config.js`, no `vite.config.*` and no `svelte` exercises none of the code the approval exists for.
3. **Case 10: yes.** It passes while automatic type acquisition runs `npm` in the background (3.5).
4. **Verify item 4, the grep: yes.** It misses `SERVED_LANGUAGES`, `SEMANTIC_LANGUAGES`, `DATABASE_LANGUAGES`, `palette-modes.ts:39` (`'c' || 'cpp'`), the interpreter-only `approve` message and the `Setup` fields. I ran the grep's language-list complement and it prints `client.ts:40`, `hosts.ts:21`, `palette-modes.ts:39` and `palette.ts:299`. Part 1 can pass the grep with those branches still in place.
5. **Part 4's declared capabilities: yes, and the declaration is the wrong one.** No case checks them.
   - `failureHandling: 'abort'` means, in the LSP spec, that operations before the failing one stay applied. The brief's own rule (refused whole, nothing applied) is `transactional`.
   - Declaring `documentChanges: true` invites versioned edits. The brief never says to refuse one whose `textDocument.version` differs from the tab model's.
6. **Part 4's ordering: yes.** "Tabs edited, then `lsp-edit` in one request" does not say what happens when `lsp-edit` is refused (a stale hash, or a path refused on the server) after the tab edits were applied. The edit is then partial. The brief must say: post `lsp-edit` first and apply the tab edits only after it succeeds, or undo the tab edits on refusal.
7. **Part 4's open-tab test: yes.** "Registered on the page" is per language channel: `hosts.ts:146-160` makes one `LanguageHost` per language, and `transport.ts` keeps its own `#docs`. These edits name a file open in a tab of the same page that is registered on another channel, so they would go to disk under that tab:
   - a clangd edit from a `cpp` tab naming a header open as `c`;
   - a TypeScript edit from a `typescript` tab naming a `.js` tab;
   - a Svelte edit naming a `.ts` tab;
   - an edit naming a file open in a tab no server serves.
   A save of that tab would then overwrite the disk write, which is the hazard Z682 (2) names for another page. The test must be over every tab of the page.
8. **Part 1, "servers.ts:6's sentence becomes true": yes, as specified.**
   - The page side (`hosts.ts`, `client.ts`, `transport.ts`, the views, the shell) may not import `lib/server` (DESIGN's layer rule, `boundaries.test.ts`). So the page cannot "read the entry" in `servers.ts`.
   - Either the page-facing facts (languages, labels, semantic tokens, format-on-type, Organize Imports, the choice kinds) travel over the wire, or they live in a shared module under `src/lib/data`. With a shared module, "one entry in `servers.ts`" is no longer one place.
   - `SERVED_LANGUAGES` is needed before any server message, at `register` time (`hosts.ts:147`).
   - The brief chooses none of these. Combined with the computed-key check (1.9), part 1 can be built several incompatible ways, or not at all inside the write list.
9. **Case 13: partly.** Only a Python tab is run, so the routing of `workspace/symbol` to clangd and TypeScript is unchecked. That is acceptable but thin.
10. **A rename of a TypeScript symbol used in `.svelte` files: yes, without the goal.** Without `typescript-svelte-plugin` in tsserver, the rename is incomplete across `.svelte` files. That is the main use in this hub: oculus's own 357 components. The brief does not mention it. Adding the plugin is a new dependency, which is a decision.

## 6. Implied inputs

1. **The same file named twice** (a `changes` key and a `documentChanges` entry, or two `documentChanges` entries). LSP applies `documentChanges` in order, each entry against the text left by the one before. `#applyEdit` (`transport.ts:611-624`) concatenates them, and part 3's "applies the edits from the end" would apply them against the original text. Expected: apply the entries in order, or refuse the edit whole when one file appears twice.
2. **A file open in two tabs of the same page.** Two models make one document, and `host.apply(doc.models[0], ...)` (`transport.ts:637`) edits only the first. Whether two tabs of one file share text is not verified. Expected: every model of the document shows the edit, and the second tab never saves over it.
3. **Overlapping ranges.** LSP forbids them. Expected: `lsp-edit` and the tab apply both refuse the edit whole.
4. **CRLF files, a BOM, non-ASCII text.** Positions are UTF-16 code units per line. Expected: offsets computed over the file's own line ends, the file's line ending and BOM kept, and the hash taken over the same bytes the write compares.
5. **A file not saved in a tab and also named for the disk write.** This is 5.7. Expected: the edit is refused whole, or applied in that tab.
6. **A rename answer naming thousands of files.** The cost is one POST, thousands of history copies and one `files` record listing every path, which the History row draws as a list. `ops.ts` and `replace.ts` show no item limit (`grep -n "limit\|MAX" ops.ts replace.ts`). Expected: a stated limit with a sentence, or a statement that there is none.
7. **A server's answer arriving after the asking tab closed, or the page closed.** The relay drops it when the page is gone. If the page lives but the tab closed, the asking file is now "no tab holds", so the whole edit would go to disk. Expected: the edit is dropped when the asking document is no longer registered.
8. **An approval revoked while the Svelte server runs.** Expected: the server ends at once, as for a root no longer served (G36). Not stated.
9. **A JS or TS file under `node_modules` inside a served root.** It maps as an ordinary root file (`toPageUri`, `uris.ts:193-197`), so an edit naming it would be written. Expected: refused as a library file is. Not stated. The same question applies to in-root dot folders (`.venv`, `.oculus`), where case 7's dot rule and part 3 disagree.
10. **A peek model of a file the write changes.** Expected: the peek model is refreshed or dropped after the write.
11. **A killed `typescript-language-server` (SIGKILL at 5 s, G36).** Whether its own tsserver children end with it is not verified. Expected: no orphan tsserver.
12. **A repository with no `svelte` package.** The Svelte server falls back to its own Svelte 4 (`svelte: '^4.2.19'`), so a Svelte 5 file gets Svelte 4 diagnostics. Expected: stated as accepted, or the server not offered there.

## 7. ADRs

1. None exist. `ls -d docs/adr ../../docs/adr /Users/axelfaes/workspace/research-hub/docs/adr` from tools/oculus prints "No such file or directory" for each, so the brief's sentence holds.

## 8. Dictated text

1. **The History label breaks the catalog's own singular form.** `grep -n "Edited by a language server" agents/briefs/D23b.md` finds :45 (the label "Edited by a language server in {0} files") and :58 (case 1's "Edited by a language server in 1 files").
   - The replace label it copies has a singular sibling: `history.yml:79-80` holds `file_replace: Replaced in {0} files` and `file_replace_one: Replaced in 1 file`, chosen at `rows.ts:78-81`.
   - "in 1 files" is wrong English, and case 1 expects exactly that string. The label needs a `_one` form, "Edited by a language server in 1 file".
2. **The editor command names hold.** `grep -n "Show Call Hierarchy\|Rename Symbol\|Organize Imports"` finds :48, :50, :71 and :73. "Show Call Hierarchy", "Show Type Hierarchy" and "Rename Symbol" are VS Code's command names.
3. **The report wording holds.** :163 "Everything in the brief is done" and :171 the "Doc text" heading follow spec.md.
4. **The brief is ASCII.** `LC_ALL=C grep -n '[^ -~]' agents/briefs/D23b.md` prints nothing. No em dashes and no negation-contrast were found on reading.
5. **A small redundancy in the brief.** Read item 3, "`kit/lsp/` whole and `kit/lsp/client.ts`", names `client.ts` twice.

## Judgements asked for

1. **Size: large, and splittable along the brief's own parts.** I put it at about 45 files across 8 parts, with folder splits forced in `server/machine/lsp`, `kit/lsp`, `shell/keys` and `config/text/views/sources` (all full at 10). Line limits are close on `relay.ts` (845), `context.ts` (877), `ops.ts` (814), `Palette.svelte` (508) and `Source.svelte` (520). It adds two npm servers, 16 cases, 11 of them browser runs, and an approval flow.
   - D23 itself landed at 197 files (`plan.md`, D23's booking line), so in this plan the size alone is not out of line.
   - The parts do separate cleanly:
     - (a) one entry per server plus the TypeScript and Svelte servers: parts 1 and 2, D34's line, which D43 and M8 wait on;
     - (b) the cross-file edit: parts 3 to 6;
     - (c) workspace symbols and the hierarchies: parts 7 and 8.
   - Recommendation: split into (a) and (b)+(c), (a) first, so D43 is unblocked sooner and the approval clash in 4.3 is ruled before the servers are built.
   - The lazy option is to keep one step and absorb the write-list gaps at landing.
   - Z126 folded D34 in "against tiny steps". D34 is not tiny, so a split does not contradict the reason given for the fold, but undoing a ruling is Axel's call.
2. **"One entry per server" (part 1) is not precise enough to build.** See 5.8. It does not say where the page-facing part of an entry lives (wire or a shared `src/lib/data` module), given the layer rule. It does not say how labels are keyed, given the literal-key check at `keys.test.ts:307-316`. It does not say whether the interpreter and database pickers become a generic "choice kind" vocabulary, which is a wire and palette shape.
3. **Choices Z682 does not settle, which a reader would see.**
   - The Svelte approval: what text is approved, its key in the approvals file, the wire message, and where it is asked. The options are a folder, a hash of the config files, or untrusted mode. Recommendation: start with `isTrusted: false` without approval and trusted after an approval keyed by the config files' text, which satisfies DESIGN.md:165.
   - The history copy kind of an lsp-edit (`replace` or a new kind).
   - TypeScript's automatic type acquisition, on or off. Recommendation: off.
   - The tsserver log location.
   - `typescript-svelte-plugin` for complete renames.
   - The capability set of the two new entries.
   - The `#` mode's wire field naming the root for `workspace/symbol`.
4. **Paths the step needs that are off the write list:**
   - `src/lib/views/sources/search/References.svelte`
   - `config/text/views/sources/search.yml`
   - `config/text/app.yml`
   - `src/lib/shell/keys/Palette.svelte`, `ChoiceRows.svelte`, `palette-modes.ts` (at its real path) and a new rows component
   - `src/lib/views/system/history/rows.ts` and `History.svelte`
   - `src/lib/state/sources/explorer/acts/undo.ts`
   - `src/lib/server/files/fs/history.ts` and the Timeline files, if a new copy kind is chosen
   - `src/lib/server/machine/approvals/approvals.ts`
   - `src/lib/state/system/machine/lsp/lsp.svelte.ts` is covered.
   - `tests/routes/replace/*.test.ts`, `tests/routes/files/file-undo.test.ts`, `tests/checks/source/keys.test.ts`
   - `DESIGN.md:165` and `:512`, `docs/window.md:7` and `:74`

## Declined to judge

- Whether the Svelte server's `fdir` crawl of a large root such as the hub costs noticeable time or memory: not measured.
- Electron 44.5.1's bundled Node version against `typescript-language-server`'s `>=22.22.2`: not verified.
- Whether pyright and clangd refuse a rename into a library file, which decides whether case 4 is reachable: not run.
- Whether tsserver children outlive a SIGKILLed `typescript-language-server`: not run.

Usage: claude-opus-5-5, about 218,000 tokens (15,000,000 at start, about 14,782,000 now, from the session counter), about 75 tool uses; minutes not measured.

Agent: a87b263e7d9067812, claude-opus-5-5, 231,512 tokens, 94 tool uses, 13.2 min.

## Closed

Each finding is closed in `agents/briefs/D23b.md` by Z686 (`plan.md`, Rulings) or by a correction of the brief:

- 1.1, 3.1: the References view's path and its words (`search.yml`'s `references:` group) corrected in the premises, the parts, the paths and the reads.
- 1.2: `palette-modes.ts` at `src/lib/shell/keys/`; the whole of `shell/keys` on the write list, with a subfolder for moved items.
- 1.3, 1.4, 1.5: `docs/window.md:7` and `:74`, `app.yml`'s `palette:` group, `Palette.svelte`, `ChoiceRows.svelte` and a rows component added.
- 1.6, 3.13: every server-naming place added to the premises; `hosts.ts:10`'s comment in part 1; verify item 4's grep widened to the language lists.
- 1.7: no exported `RefKind` is added; the builder keeps the type module-local or names it distinctly (the standards' naming rule).
- 1.8: `rows.ts`, `History.svelte`, `undo.ts`, `history.ts` and the Timeline files added; the copy kind `lsp-edit` (Z686 (6)).
- 1.9: the label keys' prefix joins `COMPUTED_PREFIXES`, reported (Z686 (5)); `source.yml:51` rewritten (part 4).
- 1.10: `README.md:15` names `typescript` and the three packages.
- 2.2: the feature set of the two servers (Z686 (9)).
- 3.2, 3.3, 3.4, 4.3, 5.2: the Svelte approval by config text, untrusted before it (Z686 (1)); case 11 uses a config with a marker.
- 3.5, 5.3: type acquisition and the tsserver log off (Z686 (7)); case 10 checks both.
- 4.2: case 7's rows under G2 and G3; dot and `node_modules` paths refused by part 3.
- 4.4: case 4 names two setups and asks which reached the refusal.
- 4.5: the rows under G2, G3, G8 and G9 (Z686 (3)).
- 4.6: G55 written (Z686 (2)), case 13a.
- 4.7: case 12 names G36's and G7's rows.
- 4.9: part 3 rereads and rechecks.
- 5.1: decision 2 reworded to what can be built; case 3 staged by case 8's test.
- 5.4: verify 4 widened.
- 5.5: `failureHandling: 'transactional'`, versioned entries checked.
- 5.6: `lsp-edit` posted first, tab edits after it succeeds.
- 5.7: the open-tab test is over every tab of the page; case 13c.
- 5.8: the shared entries module under `src/lib/data/` (Z686 (5)).
- 5.9: case 14 runs three languages.
- 5.10: `typescript-svelte-plugin` (Z686 (8)), case 13b.
- 6.1 to 6.12: the implied inputs listed after the cases; 6.9 refused in part 3; 6.12 stated in part 2.
- 8.1: the singular label (Z686 (10)).
- 8.5: kept; it names the folder and the file the transport imports.
- Judgement 1: one step, the write list widened (Z686 (4)).

