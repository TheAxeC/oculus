Brief check of D23 (tools/oculus/.scratch/migration/agents/briefs/D23.md, working-tree version, 173 lines), read against main at cf880dbe. I changed no file in the repository. Every probe ran from /private/tmp/claude-502/.../scratchpad/D23-brief-check/ using the packed pyright 1.1.414 and /usr/bin/clangd.

Summary: the brief is not ready to dispatch. Five findings would each make the builder fail or build the wrong thing:
- F1: pyright switches to pull diagnostics under Monaco's client capabilities.
- F2: the client's own models are opened before the model is registered.
- F4: pyright encodes URIs differently from encodeURIComponent.
- F5: the status item id `server` is already taken.
- F6: a read-only source tab is not a Monaco editor.

On scope, the client also turns on 18 features beyond the ruled four (S1), and DESIGN.md's process rule clashes with background language servers (S3, which goes to Axel).

## Premises

Most line references reproduce. I checked these with `sed -n`/`grep -n` on the cited files and they match: the Monaco exports, `index.d.ts:124-147`, `out/index.js` 1440-1488, 2724-2735, 2908-3087, `Editor.svelte` 172/216/259-296, `Source.svelte` 117/133/183-200/304, `socket.ts` 79-81, `src/server.ts` 43-67, `vite-plugin.ts` 31-38/63/71, `roots.ts` 25-36, and the folder counts (`git ls-files <dir> | ... | wc -l`: tests/ui/controls/editor 10, tests/server/root 10, src/lib/state/sources 10, ui/controls/editor 10, kit 7, tests/server/machine 5, server/machine 4). The false or incomplete ones:

P1. "pushed diagnostic" (lines 21 and 23, case 1) is true only for an empty capability set. The brief's probe sent `capabilities: {}`. The client declares `textDocument.diagnostic: { dynamicRegistration: true }` (`out/index.js:2600-2603`). Pyright turns pull diagnostics on when it sees that (`dist/pyright-internal.js`: `supportsPullDiagnostics=!!i.textDocument?.diagnostic?.dynamicRegistration&&r?.disablePullDiagnostics!==!0`). My probe (probe2.mjs, the same two-file project with those capabilities) printed:
- `server asks client/registerCapability {"registrations":[{... "method":"textDocument/diagnostic","registerOptions":{"interFileDependencies":true,...,"documentSelector":null,...}}]}`
- `server asks workspace/diagnostic/refresh`
- no `publishDiagnostics` at all
- the error only through `textDocument/diagnostic`: `pull {"kind":"full","resultId":"3","items":[{... "Type \"int\" is not assignable to declared type \"str\"`

See F1 for the consequences.

P2. "21 features" (line 16) is wrong. `createFeatures()` at `out/index.js:3063-3087` adds 22 (Completion through Diagnostics).

P3. "The five real inputs" (line 44): four of the five paths do not exist. `for f in ...; do [ -e "$f" ]` printed `missing` for `tools/oculus/utils/metrics.py`, `projects/manuscripts/btfno/code/train model.py`, `feeds/réseau.py` and `a/b#c.py`; only `tools/data/redownload.py` exists. Change "real inputs" to "example inputs". The file names do not need to exist for the unit cases.

P4. "A definition in lib.py ... references across both files" for clangd over a `compile_flags.txt` project (item 2, case 2) does not happen. Probe5 (lib.h, lib.cpp, main.cpp and compile_flags.txt) printed:
- `def [...cproj/lib.h]`, which is the declaration, not lib.cpp
- `refs ["main.cpp:2","main.cpp:4"]`, main.cpp only
- `.cache exists false`

With a `compile_commands.json` instead (probe6): `def after index ["lib.cpp"]`, `refs ["main.cpp:2","main.cpp:4","lib.cpp:1","lib.h:0"]`, and `cproj2/.cache/clangd` was written. Decision 6's premise is incomplete too: clangd writes `<root>/.cache/clangd` only when a compile database exists, and cross-file results need that index. Change the proof's C++ project to a `compile_commands.json`. Restate decision 6 as: cross-file navigation in C++ exists only in roots with a compile database, and there clangd writes `.cache/clangd` into the root. The hub's own `.gitignore:73` ignores `.cache/`.

P5. "A tab that may not write its file still gets a server" (item 6, case 22) is false against the tree. `Source.svelte:127-131`: `locked = draft.readonly ? ... : draft.truncated ? ... : ''` and `editing = ... && locked === ''`. `Source.svelte:377-386` draws `<Code .../>`, the highlight.js window, when `locked !== ''`, so no Monaco model exists. HELP.md:156 ("drawn as a read-only window") and DESIGN.md:284 ("the read-only code window, which `Source.svelte` draws for a file it may not write") say the same. Also, `actions: editing ? actions : []` (`Source.svelte:199`) publishes no editor actions for such a tab. See F6.

P6. `views/sources/source/Editor.svelte` passes the instance to the primitive as `model={instance}` (line 177), not as `instance`. The primitive's prop is `model: name`. This is minor; the brief should name the prop.

P7. HELP.md:150 is the "Five views are opened for something" paragraph. The source tab's own paragraph is HELP.md:156.

P8. Line 24's claim holds: `grep -o execFileSync pyright-internal.js | wc -l` prints 1. There is also a `spawn` of the interpreter inside `runScript` (`-B -I <script>`), but `grep -o runScript *.js | uniq -c` shows only its definition, so it has no caller. Nothing to change.

## Scope

S1. The brief never restricts the client to the four ruled features. `MonacoLspClient`'s constructor registers all 22 (`out/index.js:3063-3087`) and `setServerCapabilities` enables each one the server offers. Pyright and clangd offer completion, signature help, rename, code actions, formatting, inlay hints, document highlight, document symbols, folding ranges, code lens, links and semantic tokens. Once D23 lands, a Python tab would get pyright completions while typing, F2 rename applying a WorkspaceEdit to in-memory models, quick fixes and inlay hints drawn into the text. Those are user-visible features the ruling (hover, go to definition, references, diagnostics) does not name. The feature classes are not exported (`index.d.ts:263` exports only `MonacoLspClient, WebSocketTransport, createTransportToIFrame, createTransportToWorker`), so a subclass cannot build a smaller set. Two ways out:
- (a) The relay strips every provider except `hoverProvider`, `definitionProvider`, `referencesProvider` and `textDocumentSync` from the `initialize` answer, removes the matching client capabilities from the request, and refuses any other dynamic `client/registerCapability`. This matches the ruling.
- (b) Raise the wider feature set to Axel as a decision.

The brief must pick (a) or raise (b). It cannot leave the choice to the builder.

S2. "One server per root and language" (plan line 337, Answer 11) is read in decision 1 as one per root, language and page. Two browser pages over the same root then run two pyrights. Probe4 over the hub root measured `peak rss MB 385` and `8442 ms references answered 303 142 files`, so that is about 0.4 GB each. That is a reading of the ruling with a resource cost, not a reversible internal detail. It should be raised with the measurement.

S3. Rule clash, to raise, not to edit. DESIGN.md:148 says a process started from text the reader did not write "runs in a pane the reader can see, never in the background" and is stopped only "behind a confirmation naming the process". DESIGN.md:305 says that rule "binds every part of oculus that starts a process". Language servers run in the background and are stopped by SIGTERM/SIGKILL without confirmation. They also read text a repository wrote: pyright runs the PATH `python3` in the root, and clangd reads `.clangd` and `compile_commands.json`. Item 8 has the builder write an exemption sentence into :148/:305. By the hub rule "Surface rule clashes: stop and tell" this goes to Axel as an open item before dispatch, with options: (a) the exemption as drafted, (b) a visible entry and confirmation per server. It is not a docs edit for the builder.

S4. The `.cache/clangd` write into reader repositories (P4) is user-visible: a new folder in the file browser, and in `git status` wherever `.cache/` is not ignored. List it as a decision for Axel beside S3, not as a reversible internal decision.

S5. Nothing in "What to build" goes beyond the ruling except S1. Item 4 (C and C++ as languages) is needed for clangd to see any model and is in scope.

## Feasibility

F1. Diagnostics (item 5, case 1). With pull diagnostics on (P1):
- (i) pyright registers `documentSelector: null`, so `_addPullDiagnosticProvider` (`out/index.js:2612-2621`) makes a provider for every model on the page on every pyright client, diff and merge models included.
- (ii) The brief's transport answers `null` for unregistered documents. `_handleDiagnosticReport(null)` then reads `report.kind` and throws, and `console.error("Error requesting diagnostics:")` fires on every model change, 500 ms debounced, per client.
- (iii) All clients share the marker owner `"lsp"` (line 2593). An empty full report from another root's client would clear the right client's markers.
- (iv) The client has no handler for `workspace/diagnostic/refresh` (`grep -n registerRequestHandler` shows only inlayHint refresh, register and unregister). So main.py's markers go stale when lib.py changes in another tab.
- (v) The item 2 proof, run "with the capabilities the client declares", gets no push. The builder would then hand back a "pyright failed" and trigger the LA16 fallback for the wrong reason.

Fix: the relay's `initialize` rewrite removes `textDocument.diagnostic` from the client capabilities, or sets `initializationOptions.disablePullDiagnostics: true`, so pyright pushes. Add a case: a pushed diagnostic after a dependency file changes in another tab. Say what the transport answers for a pull request if any server still pulls; `{kind:'unchanged'}` needs a resultId, so dropping the request may be safer.

F2. Registration order (item 5, "drops didOpen/didChange/didClose for any model not registered"). `Editor.svelte:264-281` calls `createModel` before any registration could happen. The synchroniser's `onDidCreateModel` sends `didOpen` at once (`out/index.js:2926-2929, 2995-3000`), so every tab model after a client's first arrives unregistered, its `didOpen` is dropped, and the server never opens it. The same applies in reverse: when a model is disposed, `ManagedModel.dispose` sends `didClose` from `onWillDispose` (3013-3016), and if the unregistration runs first that `didClose` is dropped and the server keeps a stale document. Fix: the transport sends its own `didOpen` (full text) on registration and its own `didClose` on unregistration, and always drops the client's open and close. Add cases: a second tab model registered after the client started gets a `didOpen`, and a tab pointed at another file sends `didClose` for the old path and `didOpen` for the new.

F3. Two URI forms from the client. `didOpen`, `didChange` and `didClose` carry `m.uri.toString(true).toLowerCase()` (2934, 2994). Every feature request carries `translate()`'s `textModel.uri.toString(true)`, not lowercased (2967-2970). The brief tells the transport to map "a registered model's lowercased URI"; a builder following that misses every hover or definition from a model whose instance id or path has an upper-case letter. Fix: the transport keys by the model object and its registered (root, path), recognises both string forms, and never derives a path from the URI string. Peek URIs must stay distinct after lowercasing (`Foo.py` and `foo.py`).

F4. URI encoding (item 3, cases 4 and 14). Pyright re-encodes `(`, `)` and similar characters that `encodeURIComponent` leaves alone. Probe3 sent `.../proj2/li%20b(1).py` and pyright answered `refs [".../li%20b%281%29.py", ...]` and `diag uri .../li%20b%281%29.py`. Two consequences:
- The transport's string comparison of `oculus:/li%20b(1).py` with `oculus:/li%20b%281%29.py` fails, so a tab's own file becomes a second peek model or its locations are dropped.
- A root directory containing `(`, `)`, `!`, `'` or `*` never matches the relay's prefix `file://<encodeURIComponent root>/`. Every answer then passes as a foreign `file:` URI and is dropped, so nothing works in that root.

Fix: the relay and the transport parse URIs and compare decoded paths (and the NFC form); prefix matching on encoded strings goes. Add cases: a file `fig(1).py`; a root directory `/tmp/proj (copy)`; a name that is NFD on disk.

F5. The status item id collides. `status-items.ts:14` `LEFT_ITEMS = ['host','branch','sync','findings','hpc','usage','server']`, `StatusBar.svelte:138-139` `shown('server')` / `data-status="server"`, and `statusbar.yml:12,45-48` `item_server`, `server_open`, `server_closed`, `server_connecting`, `server_tip` already mean the oculus server connection. Item 7's "a `server` item ... joins status-items.ts", with its label, tooltip and state words, collides in the id, the hidden-items key and the catalog keys. spec.md requires every new key to be exercised against a reserved one. Name the id (for example `language_server`) and the exact catalog keys in the brief. The id is user-visible in the right-click menu.

F6. The read-only tab (P5). Either drop "A tab that may not write its file still gets a server" and case 22, or make a locked tab a `writable={false}` Monaco editor. The second is a user-visible change to DESIGN.md:284 and HELP.md:156 and must be raised, not built silently. Also, `actions` are published only while `editing`.

F7. Peek models opened on the server (item 5, "registered as a peek model of the pair (so the server follows it)"):
- (i) Up to 200 `didOpen`s per answer. Pyright checks every open file, and clangd builds a preamble and AST per open file, which on a C++ codebase is hundreds of MB and seconds per file. Probe4: `argparse` in the hub gave 142 files in one references answer.
- (ii) A file read truncated (`answer.truncated`, `source.svelte.ts:238-240`) or read in the gap before a save would override the disk copy in the server's program, and wrong analysis would follow for every file that imports it.

Recommended: peek models exist only for `translateBack`. The transport never sends their `didOpen`, `didChange` or `didClose`, and a request from a peek editor is answered `null` or first opens the file with its disk text. Decision 5 then reads "peek models never reach the server". A truncated read also counts as `services.read` failing.

F8. The language comes from the state layer. A peek model is made "under the file's language", but `languageOf` is in `state/sources/file-type.ts` and `ui/` may import only `ui/**`, `themes/**`, `state/shared/words/text` and `data/prose/markdown` (`boundaries.test.ts` ALLOWED.ui). Fix: `LspServices.read(root, path)` answers `{ text, language } | null`, or a `languageOf` service is added.

F9. Who sends the hello. Item 5 says the kit sends it ("a socket from `services.connect(root, server)`, the hello, then a `MonacoLspClient`"); item 6 says `connect` sends it with `writes.writeToken()`. The token cannot reach `ui/`, so `connect` must send it. Say so once, and say that `connect` answers an open socket, or a failure with the close code and reason.

F10. The close reason limit. `ws` 8.21.3 throws `RangeError('The message must not be greater than 123 bytes')` for a longer close reason (`node_modules/ws/lib/sender.js:197-198`). "A reason carrying ... the last line of its stderr" will throw on a long line, and clangd writes log lines like `I[03:13:24.768] Loaded compilation database from /private/tmp/...` far beyond 123 bytes. Define the reason as a short code plus a UTF-8-safe cut to 123 bytes. The page words it from `statusbar.yml`; the server sends no sentence. Name the codes: not found, exited, refused (1008 with root, token or server), and no answer. The "last line of stderr" is a log line for clangd, so name what the sentence shows for it.

F11. Versions. The brief numbers versions only for the whole-text `didChange`. The followed model's later incremental changes carry its own `getVersionId()`, which can be lower. My probe2 shows pyright tolerates a falling version (`pull after back-version` answered). Still, write "the transport numbers every message of a document", since clangd's handling is not verified here.

F12. Subclass field trap and privates (item 5, "a subclass ... keeps the store `createFeatures()` returns"). `createFeatures()` runs inside the base constructor (3049). A subclass field declared with an initialiser, or without `declare` under the `esnext` target (`.svelte-kit/tsconfig.json:28`), is re-initialised after `super()` and loses the store. `_bridge` is `private` in `index.d.ts:208`, so disposing it needs a cast that `npm run check` accepts. Disposing the bridge does not dispose its `ManagedModel`s: they are not `_register`ed (2936-2946), and after a client ends they keep sending through a dead transport. The transport must drop sends after close, and the markers of owner `lsp` must be cleared on the client's models when it ends (stale errors otherwise). Name all three in the item.

F13. Unhandled rejection. `this._initPromise = this._init()` (3051) is never awaited. A socket closing before the `initialize` answer is an unhandled rejection on the page, so the kit must attach a handler through its own transport's state.

F14. Case 21's labels contradict "Monaco's labels as installed". Monaco 0.57 names them `"Show or Focus Hover"` (hover/browser/hoverActions.js) and `"Go to Next Problem (Error, Warning, Info)"` / `"Go to Previous Problem (Error, Warning, Info)"` (gotoError.js). `showHover`'s key is the chord Cmd+K Cmd+I (hoverActions.js:58), which `freedKeys` removes (chords.ts:82-84). Give its hint as empty and fix case 21's labels.

F15. The relay rewrites string values too widely (item 3, "every string value of a message that starts with `oculus:/`"). That rewrites file text: a `didOpen` `text` or a `didChange` `text` that is exactly a pasted `oculus:/...` would reach the server changed. Restrict the rewrite to URI-bearing fields: `textDocument.uri`, `uri`/`targetUri` of locations, `rootUri`, `workspaceFolders[].uri`, `relatedInformation.location.uri`, and workspace edit keys if S1 keeps any.

F16. The vite-plugin dependency. `ViteServerDependencies` (vite-plugin.ts:16-19) has `createContext` and `attachSocket`; `attachLsp` belongs there too so that `tests/server/root/vite-plugin.test.ts` can assert it is closed on `http.emit('close')` (the test's lines 18-24, 66-68 do so for the socket). See Paths.

## Cases

Missing, each with its expected result:
1. `initialize` from the page carries `textDocument.diagnostic`: the server receives it removed (F1), and pyright pushes.
2. A tab model registered after the client started: the server gets one `didOpen` with full text (F2).
3. A tab pointed at another file: `didClose` for the old path, then `didOpen` for the new; nothing reaches the server between them.
4. A model whose URI has upper-case letters (`README.py`, instance id with capitals): hover is answered (F3).
5. `fig(1).py`, a root directory with a space or parentheses, and an NFD file name: locations map back to the tab's own model (F4).
6. A model's language changed from the status bar while registered (python to plaintext, plaintext to python, c to cpp): unregistered from the old pair and registered with the new; state `none` or `starting`.
7. A Python file over `editor.paint_limit_kb`. It opens as plaintext (`views/sources/source/Editor.svelte:111`), so the brief must say whether the server follows `language` or `shown`. Expected: stated either way.
8. An empty file, and an unsaved new file: `didOpen` with `""`; hover answers null without error.
9. A `.h` file in a C++ project resolves to `c` (highlight.js alias, `c [ 'h' ]`). Expected: clangd parses it by its compile command, and the status bar says C.
10. A server that never answers `initialize`: after a named timeout the socket closes 1011 with a code, and the state is `failed`.
11. A server that exits at start while tabs re-register on every remount: no spawn loop; one failed state until the reader acts (name the action).
12. The oculus server restarts while a Python tab is open (a new token is minted, `mintToken`): the tab's client reconnects on its next request, or when the main socket reconnects, instead of staying `failed` until the tab is reopened.
13. A root removed from the saved workspace while its server runs: the server is kept until its last tab closes, or ended; state it.
14. A hello with `root: ''`, `server: ''`, a duplicate hello on an open socket, and a hello while the process token is `''`: refused with 1008, nothing started.
15. Path traversal: `oculus:/../x.py`, `oculus:/a%2F..%2F..%2Fx.py` and a `workspace/didChangeWorkspaceFolders` naming another folder: dropped or refused, and nothing reaches the server.
16. In flight, after close, superseded (spec.md): the socket closes while the spawn is in flight (the process is killed once it exists); `services.read` resolves after the client ended (no model made); an answer arrives for a disposed model; a new registration arrives while the old client's socket is closing (a new client, and the old one's late messages dropped).
17. The page reloads: the old server gets SIGTERM, a new one starts, and no two stay alive past 2 s.
18. Two browser pages over one root: two servers, or one, per the ruling on S2.
19. A peek model of `lib.py`, then a tab opens `lib.py`: the tab is followed, the peek model is disposed or never reached the server (F7), and the opener still goes to the tab.
20. The second tab of a file whose first tab is locked (read-only): per F6.
21. A file renamed or deleted on disk while its tab and server are open: `didClose` and `didOpen` under the new path on the tab's repoint; a peek model of the old path is disposed at the next answer.
22. A references answer where the 200-file cap splits a file's locations: all of a file's locations are kept or dropped together.
23. A location in a file over the read limit (`truncated`): treated as a failed read (F7).
24. The client ends: the `lsp` markers are cleared on its tab models, and no provider of it answers after (F12).
25. A pushed diagnostic for a file no model holds: ignored without a console error. Today it is `console.debug` in `_handlePublishDiagnostics`, which is fine; state it.
26. A pull diagnostic request, a hover and a definition from a diff or merge model while a pyright client lives: nothing reaches the socket and no console error.
27. clangd missing on the machine running the slow proof: the clangd half fails with a named message and is not skipped silently.

## Paths

1. `HELP.md:166` says "Finding every reference to a name is `word` over the root that holds the code, which is what a C++ codebase needs and gets without a language server". It becomes false and item 8 does not name it (`grep -n "language server" HELP.md`).
2. `HELP.md:156` (the read-only window) and `DESIGN.md:284` ("the read-only code window, which `Source.svelte` draws for a file it may not write") must move if F6 goes the Monaco way. `DESIGN.md:284` also names the model URI form, which the peek URIs extend.
3. `src/lib/ui/controls/editor/kit/load.ts:1` ("the eighteen coloured languages") and `src/lib/data/prose/languages.ts:17` ("the eighteen a research tree actually holds") become false with c and cpp. Both files are listed; the sentences are not named.
4. `tests/server/root/vite-plugin.test.ts` (F16) is not listed. The folder is at 10 items; changing a file adds none.
5. `src/lib/state/workbench/navigation/status.ts` holds `languageName` and the other status word helpers the source items use (`SourceItems.svelte:23`). A server-words helper would go there. Not listed.
6. `src/lib/state/sessions/source.svelte.ts` if `read` needs a `{ text, language }` shape or a truncation flag (F8, F7). Not listed.
7. Overlap with steps in flight (from `## Paths` of briefs Q102 and Q84): `package.json` and `package-lock.json` (Q102, Q84), `README.md` line 13 (Q102, Q84), `DESIGN.md` and `HELP.md` (Q102), `docs/diagrams/`. Q84 also rewrites `src/lib/state/client/writes.svelte.ts`, whose `writeToken` D23 uses (`shapes.ts:113`). The orchestrator judges these; the README line is a same-line edit three times.

## Standards

1. Verification item 2 runs a slow-tagged file (`npx vitest run --tagsFilter slow ...`). spec.md:52 says "a step never runs `npm run test:slow`" and that slow files are left out of both suites. Running one file is not that command, but the brief should say explicitly that this is allowed. As built, nothing in the verify list ever runs the proof again, so a pyright or clangd upgrade would break it unseen.
2. The Conventions line says "The rules file's, unchanged: ... each new or changed test naming its revert". spec.md has no such rule: `grep -n -i revert agents/spec.md` finds only lines 13, 39 and 52, and line 52 says "no revert directive". The requirement comes from other briefs (Q86c, Q87, Q88, Q96, R14 carry the same verify item 4). Attribute it to the brief, not the rules file.
3. Case 3's `é` must be written as `\u00e9` in the test source. The ASCII gate in the verify list is `! LC_ALL=C grep -rna '[^ -~]' src tests`.
4. Item 8's edit to DESIGN.md:148/305 is a rule change by a builder over a clash (S3). The hub's rule is to stop and raise it.
5. Status item words and failure sentences: spec.md requires every user-facing string from a catalog. The server must send codes, not sentences (F10).

## Security

1. Origin. `allowedOrigin` (auth.ts:29-38) admits any port on 127.0.0.1 or localhost, so another local web app can open `/lsp`. The token in the hello is the actual guard, and "compared as socket.ts's terminals compare it" includes the empty-token refusal (`channel.ts:353`). Add case 14 for `token: ''` against an empty process token.
2. Roots. `browserRoots` includes workspace-saved roots, which can be any directory, `~` included. Pyright over such a root walks every `.py` below it: over the hub it reported `Found 811 source files` at `peak rss MB 385`, and over `~` with `~/data` it would be far larger (not measured). Either state a bound or list it as a known cost with a measurement over the largest configured root.
3. Traversal (case 15). The relay turns any `oculus:/` string into `file://<root>/...` without refusing `..` or `%2F`, so a page message can point the server at files outside every served root. DESIGN.md:293's rule is that nothing outside a served root is reachable.
4. Page-controlled workspace folders. Forwarded `workspace/didChangeWorkspaceFolders` or a second `initialize` let the page add folders; the relay should drop both.
5. No cap on processes. The relay has no limit on processes per page, so a client bug that reconnects in a loop spawns without bound. A per-page cap per (root, server) in the relay closes it.
6. Repository-supplied flags. I checked whether clangd honours flags from repository text that load code. A `compile_flags.txt` with `-fplugin=...` and `-Xclang -load -Xclang ...` (probe7) produced only the expected type diagnostic and no plugin-load error, so clangd did not try to load them. Pyright's interpreter run takes `pythonPath` only from `workspace/configuration`, which the relay answers `null`; the brief's premise holds.
7. PATH lookups. Pyright runs `python3`/`python` from PATH with the root as its working directory. A PATH containing `.` or an empty entry would run a repository's own `python3`. I did not check the server's PATH; the item should say it is taken from the oculus process unchanged and name that dependence.

## Declined to judge

1. Whether Monaco's references widget and peek editor need a model for every location. I read `toMonacoLocation`'s throw but did not run the widget. The brief's premise that a missing model throws is correct per `out/index.js:2951-2966`.
2. clangd's behaviour on a falling document version, and its URI encoding of special characters. Not probed; F11 and F4's fixes cover both either way.
3. Pyright's real-case handling of a root configured in the wrong case on case-insensitive APFS. Not probed. The fix is the decoded-path comparison of F4 plus `fs.realpathSync.native`; a probe with a mis-cased root would settle it.
4. The memory cost of opening 142 to 200 peek files in pyright or clangd. Not measured, since F7 recommends not opening them.
5. Whether the Vite dev server's HMR upgrade handler interferes with a second path. Not run. `socket.ts` coexists with it today on `/ws` by the same early-return pattern.
