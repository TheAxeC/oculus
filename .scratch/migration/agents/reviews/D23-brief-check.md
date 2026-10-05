# Step D23 brief check (on main at 1dee6354a)

This checks `agents/briefs/D23.md` (working copy, 450 lines, pure ASCII: `LC_ALL=C grep -n '[^ -~]' D23.md` prints nothing). It was read against HEAD 1dee6354a, exported read-only with `git archive HEAD tools/oculus | tar -x -C $TMPDIR/d23bc`. `config/local.yml` is not in that export and was never opened. Main's index currently holds D37's cherry-pick, staged and uncommitted (`git diff --cached --stat`: 61 files, +1821 -881). Where that changes a premise, the finding below says so.

Pages are cited by section: `agents/spec.md` (the rules file), `agents/guarded.md`, the state file and `plan.md` Rulings. Code, HELP.md and DESIGN.md are cited by `file:line`.

## 1. Names

- **Moved files** (`kit/colours.ts`, `kit/theme.ts` to `kit/theme/`; `views/sources/source/symbols.ts`, `latex-editor.ts` to `language/`). Command: `grep -rn "kit/theme\|kit/colours\|colours\.ts\|latex-editor\|symbols\.ts" src tests config DESIGN.md HELP.md README.md utils`. Hits outside the write list:
  - `DESIGN.md:399` "`ui/controls/editor/kit/theme.ts` reads the body's computed tokens". False after the move.
  - `DESIGN.md:396` "(`views/sources/source/symbols.ts`, over the same outline reader as the Outline section)". False after the move.
  - The other hits are `load.ts:18`, `colours.ts:6`, `Source.svelte:77,80,98` and `latex-editor.ts:4`. All are inside the write list.
  - Importers: `grep -rn ... | grep import` lists only `kit/load.ts:60` and `kit/theme.ts:26`. The same grep over the five in-flight worktrees finds no new importer.
- **The editor options and sticky scroll** (the `format_on_save` field, semantic highlighting, clangd's symbols and folding).
  - `DESIGN.md:396` holds "Sticky scroll takes its structure from document symbols: Monaco's language services for TypeScript ... and the brace ranges that `ui/controls/editor/kit/folding.ts` registers for C, C++ ...". It also holds "Every Monaco option outside these keys stays at Monaco's default."
  - D23 makes both false: clangd's symbols and folding, pyright's symbols, and the semantic-highlighting option that OI-6 needs (section 4).
  - `DESIGN.md:396` is not in the write list.
- **The breadcrumb's symbol segments.**
  - `HELP.md:48`: "has the file's path drawn under the strip as a breadcrumb ...: the root, each folder, the file. A press on the root or a folder shows the Files view ..., and a press on the file shows it in the Files view." False once symbol segments follow the file.
  - `DESIGN.md:427`: "A tab showing a file draws its path as a breadcrumb (`ui/tabs/Breadcrumb.svelte`, `shell/panes/strip/tab-crumbs.ts` ...) ... a press on the root or a folder runs `showFolderInFiles` and a press on the file `showInFiles`". It does not describe the symbol segments.
  - Neither line is in the write list (`grep -n -i "breadcrumb" HELP.md DESIGN.md`).
- **The new `local.yml` key `lsp`** (OI-1). Command: `grep -rln "sessions_overrides" src tests config HELP.md DESIGN.md`. Two hits outside the write list:
  - `HELP.md:282` lists every key of `local.yml` ("and `calendar_dir`, `mail_dir`, `sessions_cache`, ... and `approvals`, the places ... are kept in"). It becomes incomplete.
  - `DESIGN.md:245` says "every key holds at once ... each object built from a changed key is closed and built again", then lists each key's rebuild. It names nothing for `lsp`, and the brief states no rebuild for a changed `lsp` (section 6).
  - Q119 (folded into S5) writes `HELP.md` 267 and 282 and `DESIGN.md` 243, 245 and 402, so these are shared lines.
- **New ids and keys.** Command: `grep -rn "'interpreter'\|'language_server'\|'compile_database'\|format_on_save\|oculus-file\|cpp\.yml\|'lsp'\|lsp:" src tests config`. The only hit is the MIME string `application/x-oculus-file` (`state/sources/explorer/view/place.ts:174`), which does not collide. No hit for `language server` outside the brief's list (`grep -rni "language server" src tests config HELP.md DESIGN.md README.md`). That grep matches premise 10.
- **Write-list overlap with steps in flight.** Each path list was read with `awk '/^## Paths this step writes/...'` over `briefs/{X3f,D37,S5,H3,D42,Q119}.md` and their round files. The round files hold no path list. Q119 is folded into S5 by Z468. The orchestrator judges these:
  - `views/sources/source/Source.svelte` and `views/sources/source/Editor.svelte`: X3f writes both whole. In X3f's worktree `Source.svelte` is 508 lines (`wc -l`), against D23's "502 now, cap 520".
  - `HELP.md:120`: X3f and D42 both change this line (`diff <(git show <base>:HELP.md) <worktree>/HELP.md`: X3f `120c120`, D42 `120c120`). D23 changes it too, so three steps edit one line.
  - `DESIGN.md:391` and `:395`: X3f changes both (`391c391`, `395c395`), and D23 changes both. `DESIGN.md:427`: X3f changes it, and D23 needs it.
  - `data/sources/config/local.ts` and `data/helpers/editor.ts`: Q119 writes both whole. `server/root/context.ts`: S5 and Q119 write it whole. `config/catalogs/options.yml`: S5 writes it whole.
  - `config/text/views/sources/files.yml`: X3f and D42. `data/model/index.ts`: D42. `state/client/context.ts`: D37 writes lines 370-377 (D37 is landing now). `docs/diagrams/`: every step.
  - `src/lib/data/sources/config/` has 9 items and D23 adds `cpp.ts`. Q119 allows "A module split out of `settings.ts` or `local.ts` by the size rule goes beside it", so the two steps together can pass the ten-item cap.

Findings:
- N1. `DESIGN.md:396` and `:399` become false (moved paths, sticky-scroll sources, "Every Monaco option ... stays at Monaco's default"). Neither is in the write list.
- N2. `HELP.md:48` and `DESIGN.md:427` become false or incomplete (breadcrumb symbol segments). Neither is in the write list.
- N3. `HELP.md:282` and `DESIGN.md:245` become incomplete with the `lsp` key. Neither is in the write list, and both lines are Q119's (S5's).
- N4. The overlaps above, for the orchestrator's `shared_paths` judgment. These are same-line edits with X3f (`DESIGN.md:391`, `:395`, `:427`) and with X3f and D42 (`HELP.md:120`). `config/sources/config/` can pass ten items with Q119's split.

## 2. The step line

The step line is `plan.md:522` with its widening at `:523`. The rulings it carries are Z72, Z74 (4), Z79 (4), Z80, Z92 (2), Z182, Z47 4 (a), Z88 and Z260. Z72 in full is at `orchestrator-history.md:1204` at HEAD.

- "a language server client in the D13a editor": section 3 (Monaco's client).
- "pyright for Python, clangd for C++": section 1, servers.ts. C is added beyond the line.
- "one server per root and language": section 1, process.ts and relay.ts (per page, Z72 (3) (c)).
- "each feature editing only the open file": the "What to build" opening, section 3 and the parity table.
- `.oculus/cpp.yml` (Z92 (2) (a)): section 2.
- "the Files Outline's code symbols" (Z182 (a)): section 3, "The Outline's code symbols".
- Settings widening (servers read the repository's own settings, everything else at the server's default): section 1, first sub-bullet.
- Z80 (a), the interpreter found, named on the status bar, picked and remembered: section 1 `interpreter.ts` and `choices.ts`, and OI-2.
- Z79 (4) (a), `format_on_save`: section 3, "Format on save".
- Z74 (4) (a), `--header-insertion=never`: section 1.
- Z72 (1) (a), "run in the background ... and ended with their tab without a confirmation". The only end conditions in section 1 (`process.ts`) and in G36 are these: the page's socket closing (60 s), the root no longer served, and the oculus server's close. When the last tab of a root and language closes while the page stays open, no requirement says the server ends. Section 1's "one server per root that has an open document" implies it but gives no rule or time.
- Z72 (2) (a), the database found, linked, picked and remembered: section 1, `databases.ts`.
- Z72 (4) (b1), "every feature both servers offer, D23 ... the features that edit only the open file, D23b the features that edit files no tab holds ... plus workspace symbols and call and type hierarchy". The parity table (section 5) sends three features to D23b: the References view in the side bar, clangd's AST view and clangd's memory-usage view. None of the three edits a file, and none is among D23b's named features. The only authority for the move is the uncommitted `plan.md:527` ("widened (Z468, from D23's brief): ..."). That line ends with no "(the user)" and no automode ruling, and Z468 itself (`plan.md:1188`) says only that no step may be added.
- Z47 4 (a), "symbols after D23": section 3, "The breadcrumb's symbols".
- Z88, D34 on D23's relay: section 1, "the table is the one place a server is described".
- Z260 (`choices.md`, "D23's clangd symbols then replace the folding for C and C++"): section 3, "Formatting" (clangd's folding used while it serves).
- Z467, a landing look across at least ten files of different types: "The landing look", 14 items.

Findings:
- L1. Z72 (1) (a)'s "ended with their tab" has no requirement for a page that stays open after its last tab of a root and language closes. Neither section 1 nor G36 states when that server ends.
- L2. The References side-bar view and clangd's AST and memory-usage views are inside D23's ruled scope (Z72 (4) (b1)). The parity table defers them to D23b, resting on a widening line that carries no ruling marker. This is a deferral inside the scope.

## 3. Premises

- The plan's line numbers (`plan.md:522-525`, `:741`, `:743`, `:753`, `:754`, `:762`, `:764`, `:795`, `:857`, `:903`, `:1185-1187`).
  - `git show HEAD:.../plan.md | grep -n ...` prints these numbers exactly, so they match HEAD.
  - In the working copy each line after 526 is one higher (`grep -n` prints 742, 744, ..., 1186-1188) because of the uncommitted D23b widening at 527.
- `orchestrator-state.md:129` (the libraries rule). Working copy: 129. HEAD: 128 (`git show HEAD:... | grep -n "code is written by hand only"`). This cite matches the working copy, while the plan cites match HEAD.
- The source tree unchanged since 3dccf6a8c (`git diff --stat 3dccf6a8c..HEAD -- tools/oculus ':!tools/oculus/.scratch'`): prints nothing, so it holds.
- **D37's landing in the index** will move main's head before dispatch.
  - `git diff --cached --stat -- tools/oculus/src/lib/ui/controls/editor/Editor.svelte`: +7 lines at 289. The brief's "496 lines, cap 520", `Editor.svelte:292-302` and `:385-390` become 503, 299-309 and 392-397.
  - `data/file-ops.ts:23` `TEXT_LIMIT` becomes `:27` (`git show :tools/oculus/src/lib/data/file-ops.ts | grep -n "TEXT_LIMIT ="`).
  - `data/model/index.ts` 511 becomes 517.
  - D37's HELP and DESIGN hunks are one-line replacements (`git diff --cached -U0 -- HELP.md DESIGN.md`: `-131 +131`, `-33 +33` and so on), so no cited doc line moves.
  - The brief's base ("read on main at 1dee6354a") is not the head the worktree will be made at.
- **The Monaco client.**
  - `index.js` 3203 lines and `index.d.ts` 263 lines (`wc -l`): matches.
  - `createFeatures()` at 3060 with 22 features (`sed -n 3045,3090p`): matches.
  - `_init` with `processId: null` and `rootUri: null` at 3051-3058: matches.
  - Synchronizer 2908-2932 with `onDidCreateModel` and `getModels()` at 2926 and 2929: matches.
  - `toMonacoLanguageSelector`: the function is at 1457 and the `if (!s || s.length === 0) return { language: "*" }` line is at 1458. That is close enough.
  - Marker owner `"lsp"` at 2590: matches.
  - `translateBack` lower-cases the URI and throws at 2951-2962: matches.
  - `_bridge` private at `index.d.ts:208`: matches.
  - `_initPromise` is assigned at 3049 and never awaited (`grep -n _initPromise`: lines 3041 and 3049 only): matches.
  - `registerRequestHandler`: lines 485, 653 and 863 are generic, and 2390, 2724 and 2732 are inlay-hint refresh, register and unregister. Matches.
  - Not stated in the brief: the client's own `LspDiagnosticsFeature` registers a `publishDiagnostics` handler that sets owner `"lsp"` markers (`index.js:2605`, `_handlePublishDiagnostics` 2622-2635). Section 4 picks this up.
- `standaloneThemeService.js:149-151` `_match`: line 151, matches. Not stated in the brief: `StandaloneTheme` sets `this.semanticHighlighting = false` (`standaloneThemeService.js:40`), and `isSemanticColoringEnabled` (`contrib/semanticTokens/common/semanticTokensConfig.js:6-11`) colours semantic tokens only when the editor option `semanticHighlighting.enabled` is true or the theme says so.
- `formatOnType` defaults to `false` (`editorOptions.js:3259`). The brief does not state this.
- Folder counts (`git ls-tree --name-only HEAD <dir>/ | ... | sort -u | wc -l`): editor 10, kit 10, `views/sources/source` 10, `data/model` 10, `state/sources` 10, `server/machine` 7, `state/system/machine` 6, `shell/status` 8, `data/sources/config` 9, `tests/server/machine` 6. All match.
- File sizes at HEAD (`wc -l`): `load.ts` 385, `Source.svelte` 502, `views/sources/source/Editor.svelte` 266, `symbols.ts` 105, `outline.ts` 137, `Outline.svelte` 137, `tab-crumbs.ts` 40, `Breadcrumb.svelte` 117, `socket.ts` 135, `socket.svelte.ts` 358, `data/helpers/editor.ts` 324. All match.
- `Source.svelte:168-180` (`locked` and `editing`) and `:424-433` (the `Code` window): match.
- `HELP.md:165`, `:169` ("Every other editor setting stays at Monaco's default."), `:177` ("... gets without a language server") and `DESIGN.md:23`, `:114`, `:116`, `:149`, `:153`, `:391`, `:395`, `:403` ("no language server and no index of oculus's own."), `:416`: all match (`sed -n`).
- `options.yml:326` (the sticky-scroll description) and `:329-336` (`editor.languages`): match.
- OI-1's key list "(`config/catalogs/options.yml:694-722`: `transcript_cache`, `sessions`, `workspaces`, `bookmarks`, `notes`, `changes`, `history`, `approvals`, `calendar`, `mail`)" does not match. `grep -n "^        [a-z_]*:$"` prints `sessions_cache` (693), `sessions_overrides` (695), `workspaces` (697), `bookmarks` (699), `notes` (701), `changes` (703), `history` (705), `approvals` (707), `calendar_dir` (717) and `mail_dir` (721). No `transcript_cache`, `sessions`, `calendar` or `mail` key is a path key.
- `files.yml:137` `outline_none: No symbols for this file yet.`: matches.
- `status-items.ts:14` `LEFT_ITEMS` ending `'server'` and `statusbar.yml:12` `item_server`: match.
- `kit/colours.ts:53-75, 450-485` (`symbolIcon.*`, 33 keys): matches.
- `types.ts:84-88` `EditorExtension`: matches.
- `kit/load.ts:94` `createFormatting`: matches. `modelUri` is at `:152-159` with scheme `inmemory`, authority `oculus`: matches.
- `socket.ts:105-122`: matches. `channel.ts:477-499` (`subscribed` and `inbound`, with the `#writable` set in `Terminals`): matches.
- `auth.ts:29-38` `allowedOrigin`: matches.
- `sources.yml:96-102` roots and `:106` languages (`python` at 120, `c` at 126, `cpp` at 127 including `.h`): match.
- `behavior.yml:113-129`, `paint_limit_kb: 20480` at 119: matches. `PaneBody.svelte:7-11`: matches.
- `keys.ts:141` (`held = context.typing || ...`): matches.
- `chords.ts:51` and `:72`: match. The file is `src/lib/ui/controls/editor/chords.ts`; the brief gives no folder.
- `grep -rn "F12\|'F8'" src/lib` finds only `chords.ts:51`: matches.
- `PaneView.svelte:320` `tabCrumbs`: matches.
- `library-audit.md:185-191` (LA16) and `:305` (`fs.watch` kept): match.
- Probes run under `$TMPDIR`:
  - `which pyright` / `pyright-langserver` are the global nvm install. `node_modules/pyright` is absent (`ls`: No such file).
  - `langserver.index.js` is the package's `pyright-langserver` bin (`package.json` `bin`).
  - `npm view`: pyright 1.1.414 MIT 2026-09-09; vscode-jsonrpc 9.0.3 MIT 2026-09-25; vscode-languageserver-protocol 3.18.4 MIT 2026-09-25, depending on vscode-jsonrpc 9.0.3 and vscode-languageserver-types 3.18.4. All match.
  - `path.matchesGlob('a/b/pyrightconfig.json','**/pyrightconfig.json')` prints `true` on Node 24: matches.
  - My `initialize` probe (`node cap.mjs pyright-langserver --stdio`) gives pyright `codeActionKinds: ["quickfix","source.organizeImports"]`, so organize imports exists.
  - The same probe on clangd gives `codeActionKinds: ["quickfix","refactor","info"]`, commands `clangd.applyFix`, `clangd.applyRename` and `clangd.applyTweak`, on-type trigger `"\n"`, and a semantic-token legend with `concept`, `bracket`, `modifier`, `label`, `unknown` and duplicated types.
- Repositories (`for r in ...; find ...`):
  - cathedra has 13 databases under `build/*/` (22 in total) and game-engine 7. scotoma, ordo, officium and youtube-downloader have 0.
  - No `.venv` or `venv` at any root, and no `.clangd`, `.clang-tidy`, `compile_flags.txt`, `pyrightconfig.json` or `pyproject.toml` within depth 3.
  - All six repositories hold `.oculus/project.yml` (the brief names three; nothing depends on that).
- Every file of the landing look exists, with the sizes the brief gives (`stat -f %z`: `_torch_docs.py` 439320, `main.cpp` 158810). `build.py:24` imports `catalog` and `deck_config.py:42` is `def catalog(root):`.
- Line 7 of the brief: "This brief waits on the open items below; the orchestrator writes Axel's ruling on each into 'Decisions' before dispatch." This is false on the tree:
  - The six items are ruled (Z476 to Z481, working-copy `plan.md:1196-1201`).
  - They were ruled by the orchestrator in automode, not by Axel.
  - The rulings are written under "Open items, ruled", not under "Decisions".
- Line 55: "The ruled texts are kept whole at the end of this brief." The end section holds Answer 11, the plan line, Z92, Z72, Z74 (4) and Step 0 only. Z80, Z79 (4), Z182, Z47 4 (a), Z88, The queue, Z466 to Z468 and Z260 are not there.

Findings:
- P1. The brief's base will not be 1dee6354a once D37's staged landing is committed. `ui/controls/editor/Editor.svelte` becomes 503 lines, its cited ranges move by +7, and `TEXT_LIMIT` moves to `file-ops.ts:27`.
- P2. OI-1's names of the `local.yml` path keys are wrong: they are `sessions_cache`, `sessions_overrides`, `calendar_dir` and `mail_dir`, at 693-722.
- P3. Line 7 (brief waits on open items; "Axel's ruling"; "into Decisions") is false.
- P4. Line 55 (ruled texts kept whole at the end) is false.
- P5. The `orchestrator-state.md:129` cite matches the working copy while the `plan.md` cites match HEAD. Minor.
- P6. The brief does not state two client facts the design depends on: the client's own `publishDiagnostics` handler with owner `"lsp"`, and Monaco's standalone `semanticHighlighting = false`. Both are covered in section 4.

## 4. Cases and checks

- Cases 1-7, 9-12, 14-20, 22-27, 29-31 and 33-38 are consistent with spec.md and guarded.md, except as noted below.
- **Case 8** expects "the include of `scotoma.h` resolves; without the file, clangd reports it". `clangd --check=src/dlg.c` on a copy of scotoma's `src/` under `$TMPDIR` with no flags prints `[pp_file_not_found] Line 15: in included file: 'snes.h' file not found`. So `scotoma.h` resolves without any `cpp.yml`, because it sits beside `dlg.c`. What fails is `<snes.h>` from `scotoma.h:18`, found at `tools/pvsneslib/pvsneslib/include/snes.h` (`find`). The case's expected result is wrong on the tree. `-Isrc` is also not the flag that fixes it. Look item 12 rests on the same example.
- **Case 13** ("Two pages over the hub, one closed: its pyright is still running 50 s later and ended at 65 s; a page opened at 30 s takes it over (one pyright process, `ps`)"):
  - It conflates two runs: a server taken over at 30 s does not end at 65 s.
  - Under one server per page (Z72 (3) (c)), with the second page still open there are two pyrights, not one.
- **Case 32** ("The close reason of a failed server sent to the page stays under 123 bytes ...") belongs to a per-server socket. Decision 1 makes the wire the page's one `/ws` socket with `lsp:<language>` channels, where a failed server must never close the page's socket. The case contradicts the brief's own Decision 1.
- **Cases 13, 15, 16, 28, 29 and 31 as tests of G36.**
  - Z392 (`plan.md` Rulings, "(the user)") says "a new entry needs Axel's yes". `agents/guarded.md` opens with "A new entry needs Axel's yes", and spec.md "What every package obeys" says "A step that needs a new entry stops and asks Axel for it".
  - G36 was added by Z479 "(the orchestrator, automode)". The state file's automode demand leaves open "a reversal of a ruling Axel gave", and Z392 is one.
- **The G36 test** spawns a stub server process with 60 s timers. spec.md "What every package obeys" says "one that cannot (a real process, a timer, a network wait) is tagged slow", and that a check that something did not happen "advances a fake clock". The brief does not say the file is slow-tagged or on a fake clock, so the builder can write a test `npm test` never runs.
- **The tests under G1, G2, G7, G13 and G31** need their Test lines, and G2's and G7's Code lines, written into `agents/guarded.md` (spec.md: an entry "names it there by file and title"). The builder never edits `.scratch/`. Q119's brief asks the report's "Doc text" for the new Test lines; D23's report section does not ask for G36's entry text or any of these lines.
- **The first proof** ("pyright and clangd each serve a hover, a definition and a pushed diagnostic to a Monaco page through `monaco.lsp.MonacoLspClient`") needs a DOM. spec.md "What every package obeys" says "the unit suite renders to a string" and "there is no browser suite", and builders open no browser. The brief does not say what the builder runs for it.
- **Verify item 5** (`ps ... with two pages open, and 70 s after both close`) needs a running oculus server and two pages. The brief names no dev-server port (spec.md "Where you work": "The oculus dev server uses the port the brief names") and no stand-in for a page.
- **Verify item 3** uses `grep '[^ -~]'`. spec.md's closing paragraph names the perl gate, which "replaces the `grep '[^ -~]'` form wherever a brief or a check names it". The perl gate is already in `test:quick`, so this is minor.

Findings:
- C1. Case 8's expected result is wrong on the tree (`scotoma.h` resolves without flags; `snes.h` is the miss). Look item 12 inherits it.
- C2. Case 13 is self-contradictory and its process count is wrong under one server per page.
- C3. Case 32 contradicts Decision 1, the single socket.
- C4. G36 and its tests rest on an automode ruling, while Z392 (the user) requires Axel's yes for a new entry. The session cannot close this by editing the brief.
- C5. The G36 test's slow tag and fake clock are unstated.
- C6. The report shape does not ask for the `agents/guarded.md` lines (G36's entry, and the new Test and Code lines of G1, G2, G7, G13 and G31) for the orchestrator to apply.
- C7. The first proof and verify item 5 cannot be run by a builder as worded.

## 5. The question

- Case 8: yes, it can pass without the goal. The include of `scotoma.h` resolves with or without `.oculus/cpp.yml`, so the case passes whether `fallback_flags` reach clangd or not.
- Case 13: yes. A run with two pages where neither server is taken over shows a process gone at 65 s and passes as worded.
- The first proof: yes. Run without a page (a Node script speaking LSP to the relay), it passes while `MonacoLspClient` in the page never exercises the transport, the synchronizer drop or the URI mapping.
- Verify item 5: yes. With no pages it prints 0, 0, 0.
- OI-6 (a), semantic tokens "with a rule per semantic token type added to the theme": yes. Theme rules can be added and checked while nothing is coloured, because `semanticHighlighting.enabled` is left at its default and the standalone theme has `semanticHighlighting = false`. The look catches it; no requirement does.
- Section 3, "Diagnostics" ("the transport hands each `publishDiagnostics` to the page's diagnostics store and sets markers under one owner per language client"): yes. If the transport also passes the notification on to the client, the client's own handler (`index.js:2605`, owner `"lsp"`) sets a second marker set, and one client clears another's. Premise 5 is then still true while the requirement reads as met.
- The relay's forwarding of `workspace/semanticTokens/refresh` and `workspace/diagnostic/refresh` to the page: yes. The client has no handler for either (`grep -n registerRequestHandler`), so "forwarded" is met while nothing happens on the page.
- The other cases and items: no. Each needs the server's answer in the editor or the file state it names.

Findings: case 8, case 13, the first proof, verify item 5, OI-6's missing editor option and the diagnostics hand-off, each as above.

## 6. Implied inputs

This is a code step. Inputs the step implies that "Cases" leaves out, each with the result it should have:

- I1. A page that stays open after its last tab of a root and language closes, under Z72 (1) (a) "ended with their tab". Expected: the server ends, at once or after a stated delay, and a tab reopened within the delay takes it back.
- I2. A C repository's `.h` file. `sources.yml:127` maps `.h` to `cpp`, while `dlg.c` is `c`.
  - Expected: one clangd per root serves both the `c` and the `cpp` client of a page. The brief contradicts itself here: "one clangd serves both, as one server per root" against "Per page and language it holds one client session and, below it, one server per root", with channels `lsp:c` and `lsp:cpp`.
  - `fallback_flags` such as `-std=c99` must not break a header that clangd reads as C++.
  - The marker owners must include `c` (the brief names only `lsp-python` and `lsp-cpp`).
- I3. A relative path in `fallback_flags` (`-Isrc`). clangd resolves a fallback command against the file's own folder, so `-Isrc` on `src/dlg.c` names `src/src`. Expected: the base folder stated, the repository root or the file's folder, with case 33 covering the other.
- I4. A file over a configured `editor.paint_limit_kb`. `shownLanguage` (`state/workbench/navigation/editor-text.ts:96-97`) makes the model `plaintext`. Expected: the brief says whether registration uses the file's language or the shown one.
- I5. The `lsp` key changed while servers run (`DESIGN.md:245`: every key holds at once), and an `lsp` value that is a file or an unwritable folder. Expected: servers restarted on the new folder or kept, said in `DESIGN.md:245`. A wrong value gives a finding naming `lsp`, and the default is used (G13).
- I6. A root key used as a folder under the `lsp` folder: a key from a hand-edited `~/.oculus/workspaces.json` that holds `/` or `..`, or one key reassigned to a different folder, which reuses a stale index. Expected: the key refused as a path part, or the folder keyed by the real path, as `choices.json` is.
- I7. Overlapping roots, such as `~/workspace` added as a root beside `cathedra`, so one file sits under two root keys. A large root (the served `claude` root, `~/.claude`) also needs a stated result. Expected: one document per real path, and the cost stated.
- I8. The interpreter pyright runs. `<root>/.venv/bin/python` is a repository file, and pyright executes `pythonPath`. `python3` is the pyenv shim, so "resolved to its real path" names the shim script. The interpreter item's version also needs the interpreter to be run. Expected: the rewritten `DESIGN.md:153` and `:416` cover the interpreter pyright and oculus run, not only the servers. The version and folder shown for a shim are stated.
- I9. `node` for pyright's command. Expected: `process.execPath`, not a `node` looked up on PATH. G7 covers the arguments but not this.
- I10. A Python-language file that is not `.py` or `.pyi` (`sources.yml:120` maps `.gyp`, `.ipython` and `.python` to `python`). Expected: served or not, stated.
- I11. A file whose mode changes while it is open, which under OI-5 (a) switches between a writable and a read-only Monaco editor. Expected: the model is registered once and the `readOnly` option follows.

Findings: I1 to I11 are missing from "Cases". I1, I2 and I5 also leave a requirement of "What to build" unknown.

## 7. ADRs

- `.agents/plan.yaml` has no `adr` key (`cat .agents/plan.yaml`), and `ls docs/adr tools/oculus/docs/adr` prints "No such file or directory" for both. There is no record.

Findings: none.

## 8. Dictated text

- G36 (OI-4): "A language server oculus started ends: 60 s after the last page using it closed when no page took it over, at once when its root is no longer served, and with the oculus server; none is started twice for one page, root and language." (`grep -n "Proposed G36" D23.md`: line 36). Plain ASCII, so it holds against the prose rules. Its content leaves out Z72 (1) (a)'s end with the tab (L1). With `c` and `cpp` as two languages, "never started twice for one page, root and language" allows two clangds per root (I2).
- Status item words: `No compile database` and `build/debug` (line 28); the right-click names "Language Server", "Python Interpreter" and "Compile Database" (line 28); the sample `3.13.4 (.venv)` (line 28). These hold.
- Outline words: "Loading document symbols..." and "No symbols for this file yet." (line 148). Plain ASCII; "..." is the allowed form. They hold.
- Relay codes `not_found`, `exited`, `refused`, `no_answer` (line 230). They hold as wire codes, but they sit in case 32 (C3).
- Marker owners `lsp-python` and `lsp-cpp` (line 141). They hold as code identifiers, but the `c` client is left out (I2).
- Palette and command labels (`grep -n "Restart Language Server\|Switch Between Source/Header" D23.md`: lines 143, 155): "Restart Language Server", "Show Language Server Output", "Select Interpreter", "Select Compile Database", "Switch Between Source/Header", "Show or Focus Hover" and "Go to Next Problem (Error, Warning, Info)". They hold, and the last two are Monaco's own.

Findings: none against the prose rules. G36's content and the owner list are already findings (L1, I2, C4).

## Further findings on "What to build" whose content or path is not known

- W1. Palette pickers. "a press opens the palette on the interpreter list" and "the palette lists for the two pickers" need palette modes. The command vocabulary is `PaletteCommand.name` in `state/workbench/palette.ts:54-67` (`'language'` is the model), and the modes are drawn in `shell/keys/Palette.svelte`, which is 523 lines (`wc -l`) and already over the 520 line. Neither file is in the write list. The names of the new palette commands are a vocabulary the brief does not name.
- W2. Symbol-kind icons. "a tree with VS Code's symbol kinds and icons" needs glyph names in `config/catalogs/glyphs.yml` and Lucide rows in `config/catalogs/icons.yml` (`icons.yml` head: "A value is a file name in the icon package, `<name>.svg` under lucide-static/icons"). `grep -n -i symbol glyphs.yml` prints nothing. Neither file is in the write list, and the mapping from 26 kinds to Lucide icons is a visible choice the brief does not make.
- W3. Show Output's "read-only tab". No view, registry entry or catalog for it is named or listed.
- W4. Source tab notices. The format-on-save failure and the refused other-file edit belong in the `source` group, which lives in `config/text/views/sources/source.yml` (`grep -rn head_locked config/text`: `views/sources/source.yml:12`). That file is not in the write list; the write list names `config/text/ui.yml` "if the words live there". OI-5 (a) also changes what the `source.readonly` line does, and the brief does not say whether the line stays above the read-only Monaco editor.
- W5. The token gate. The set of sockets that carried the token lives inside `Terminals` (`server/machine/pty/channel.ts:482`, `#writable`). `channel.ts` is not in the write list, so the relay must write the comparison a second time, against spec.md "The principles every package is judged on" ("a parser, a fold or a rule exists once"). `socket.ts:110-112` also passes every channel not starting with `CHANNEL_PREFIX` to `hub.subscribe`, so `lsp:` needs filtering there (`socket.ts` is in the list).
- W6. OI-6 (a) needs the editor option `semanticHighlighting.enabled: true` (`semanticTokensConfig.js:6-11`; `standaloneThemeService.js:40`). The brief names only theme rules, and "the rest of VS Code's default `semanticTokenScopes`" is not given as a table. clangd's own types (`concept`, `bracket`, `modifier`, `label`, `unknown`, from the probe) have no stated scope.
- W7. "formatting of the document, a selection and while typing (clangd)". Format on type needs `formatOnType: true`, whose default is `false` in Monaco (`editorOptions.js:3259`) and in VS Code. Whether it is on, and the rewrite of `HELP.md:169` and `DESIGN.md:396` ("stays at Monaco's default"), are not stated.
- W8. The diagnostics hand-off. The brief does not say that the transport withholds `publishDiagnostics` from the client (section 5). It also does not say what the page does with the forwarded `workspace/semanticTokens/refresh` and `workspace/diagnostic/refresh`.
- W9. The ui kit's port lists only `send(text)`, `listen(fn)` and `state`. The kit also needs a file read with the file's language (peek models; `ui/` imports no state, spec.md "What every package obeys"), the opener into a source tab, the diagnostics and symbols stores, and the notices. The shape of those services is not stated.

## Declined to judge

- The step line's authority tag `(ruling Z182)`. The Z182 line ends "(the orchestrator, automode)", which is the plan's convention (`grep -c "automode)" plan.md`: 264; `grep -c "(self-rule)"`: 0). The spec skill's form is "(the user)" or "(self-rule)". Which form counts is the session's Step 1 call for the whole plan, not this step's.
- Whether "The items as they were put" (OI-1 to OI-6 with For and Against), "Answer 11" (its CodeMirror wording, which Monaco replaced) and "Step 0" are history in the brief under the spec skill's anti-pattern "History in the brief". They read as record more than requirement. Whether they stay is the session's choice.
- Whether moving `References view`, `AST` and `memory usage` to D23b (L2) is the orchestrator's to rule under automode or Axel's.
- The memory cost of pyright over a root as large as `~/.claude` or `~`. Not measured. A probe with `ps -o rss=` over that root would settle it.
- Whether pyright serves a `didOpen` of a `.gyp` file as Python (I10). Not probed.
- VS Code's full default `semanticTokenScopes` table (W6). The VS Code source is not on the tree, and I did not look it up.

Usage: claude-opus-5-5 (ad0ebdc1a60146409), 312,538 tokens, 124 tool uses, 16.2 min.

### Closed

Every finding above is closed in the brief `agents/briefs/D23.md` (754 lines, read on main at 4927e2d57), each by the brief line named.

- N1. `DESIGN.md:396` and `:399` are in the write list (line 494), their new text under "Doc text this step writes" (lines 324, 325).
- N2. `HELP.md:48` and `DESIGN.md:427` are in the write list (lines 493, 494), their new text at lines 328 and 326; the breadcrumb's symbol segments are built in section 3 (line 272).
- N3. `HELP.md:282` and `DESIGN.md:245` are in the write list (lines 493, 494), their new text at lines 329 and 327, applied to the lines as S5 leaves them (line 322).
- N4. "Shared paths (for the orchestrator)" (lines 500-509): D23 dispatches after X3f lands (line 504) and after S5 with Q119 lands (line 505); D42 (line 506), H3 (line 507) and the diagrams (line 508); `cpp-file.ts` sits under `server/machine/lsp/clangd/`, leaving `data/sources/config` at 9 items before Q119's split (line 509).
- L1. Z482 is written into section 1's server lifetimes (lines 134-139), G36's text (line 415) and the doc text for DESIGN.md:153 and :416 (line 332), with cases 41 (last tab closed), 42 (reopened inside 60 s) and 43 (reopened after) at lines 384-386, and look item 14 (line 641).
- L2. Z483: the parity table puts the References view and clangd's AST and memory-usage views in D23 (lines 295, 314); the References view (line 273, `textDocument/references` and `textDocument/implementation`), the AST view (line 274, `textDocument/ast`) and the memory-usage view (line 275, `$/memoryUsage`) each with its place, rows and actions; their glyphs (line 276); cases 53-55 (lines 396-398); their paths (lines 467, 468, 485, 487); Decision 4 (line 516); the view's place as UV-5 (line 556).
- P1. The brief is read on main's head 4927e2d57, after H3 landed at 575c997c8 (lines 49, 51); every `file:line` was re-read there, `sources.yml` moved to `roots:` 88-94 and `languages:` 98 (lines 106, 107), and D42's staged landing and the one line it moves in `files.yml` are stated (line 51).
- P2. OI-1 names the keys `sessions_cache`, `sessions_overrides`, `workspaces`, `bookmarks`, `notes`, `changes`, `history`, `approvals`, `calendar_dir`, `mail_dir` at `options.yml:693-722` (line 22).
- P3. Line 7 states the six items ruled Z476 to Z481 by the orchestrator in automode under "Open items, ruled", G36 approved by Axel (Z485 (a)) and every finding closed; OI-4 says the same (line 14).
- P4. "The scope as ruled (kept whole)" (lines 663-754) holds Answer 11, the plan line, The queue, Z92, Z72, Z74 (4), the Settings ruling, Z79 (4), Z80, Z88, Z47 4 (a), Z182 as ruled and as raised, Z260 as ruled and as chosen, Z466 to Z468 and Z476 to Z485, each compared with its ledger line at head.
- P5. Every cite of `plan.md`, `orchestrator-state.md`, `orchestrator-history.md` and `choices.md` is at main's head, where the working copies of `plan.md` and `orchestrator-state.md` equal HEAD (lines 51, 55).
- P6. The client's own `publishDiagnostics` handler with owner `"lsp"` (premise 4, line 64) and the standalone theme's `semanticHighlighting = false` with the `semanticHighlighting.enabled` option (premise 7, line 67) are stated, and the client's refresh capabilities (premise 3, line 63).
- C1. Case 8 (line 347) and look item 12 (line 639) use the `#include <snes.h>` miss of `scotoma.h:18` and `fallback_flags: [-xc, -Itools/pvsneslib/pvsneslib/include]` relative to the repository root, from the probe at lines 90-94.
- C2. Case 13 is split into 13a (two pages, one closed, line 352) and 13b (the page closed and taken over at 30 s, line 353).
- C3. Case 32 (line 375) sends the failed state on the language's `lsp:` channel and keeps the page socket and its other channels open.
- C4. Closed by Axel's Z485 (a): OI-4 (line 14) and G36 under "Tests" (line 415).
- C5. G36's test runs on vitest's fake clock over an in-process stub server, not slow-tagged, with the reason (line 415; Decision 22, line 534).
- C6. The report has a section "Lines for agents/guarded.md" (line 658) with G36's entry and the Test and Code lines of G1, G2, G7, G13 and G31.
- C7. The first proof (lines 422-428) is a Node script over a real pyright and clangd and a client-runtime test of the transport over a fake port, the in-page proof moved to look items 1 and 8 (lines 628, 635); verify item 5 runs on a dev server of the builder's on port 8795 with `ws` stand-in pages (line 621); verify item 3 is the perl gate (line 615).
- Section 5, case 8: the case now fails without `fallback_flags` reaching clangd (line 347).
- Section 5, case 13 and verify item 5: both count processes with pages open and closed at stated times (lines 352, 353, 621).
- Section 5, the first proof: its second run exercises the transport's document set and message rewriting (line 427).
- Section 5, OI-6: `semanticHighlighting.enabled: true` on served models, the theme table covering clangd's types and the drop of the types with no scope (lines 171-205), with case 52 (line 395).
- Section 5, the diagnostics hand-off: the transport keeps `publishDiagnostics` from the client and sets owners `lsp-python`, `lsp-c`, `lsp-cpp` (line 167), with case 51 (line 394).
- Section 5, the refreshes: `workspace/inlayHint/refresh` goes to the client, `workspace/semanticTokens/refresh` fires the transport's provider, `workspace/diagnostic/refresh` is answered with `null` and never comes (lines 144, 168).
- I1. Section 1 (line 135) and cases 41-43 (lines 384-386).
- I2. One clangd per page and root serves the `c` and `cpp` channels (lines 134, 140; Decision 16, line 528), owners include `lsp-c` (line 167), a C repository names `-xc` (line 157), and case 40 (line 383).
- I3. Relative include paths resolve against the repository root (line 157), UV-1 (line 540), cases 8 and 39 (lines 347, 382).
- I4. A model registers under its shown language (line 238; Decision 19, line 531), case 44 (line 387).
- I5. A changed `lsp` key restarts every server under the new folder, an unusable folder fails clangd with `lsp_folder` (line 149), a wrong value is a finding with the default used, DESIGN.md:245's clause (line 327), and case 45 (line 388).
- I6. The lsp folder is keyed by 16 hex digits of the SHA-256 of the root's real path (line 153; OI-1, line 11; Decision 15, line 527), case 46 (line 389).
- I7. A document belongs to its innermost served root by real path (line 147), pyright's memory over `~/.claude` and the hub measured (lines 86, 87), case 47 (line 390).
- I8. The interpreter is found, asked for its version, passed unresolved for a venv and as `sys.executable` for the PATH `python3`, and runs only after approval (line 151; UV-3, line 548; doc text line 332), cases 12 and 48 (lines 351, 391).
- I9. pyright runs under `process.execPath` (line 131), case 48 (line 391), G7's test (line 418).
- I10. pyright serves `.gyp`, `.ipython` and `.python` files (probe line 88), case 49 (line 392).
- I11. A mode change toggles `readOnly` and keeps the registration (line 165), case 50 (line 393).
- W1. The palette's `interpreter` and `compile-database` modes, the split of `Palette.svelte` into `palette-modes.ts` and `ChoiceRows.svelte`, and the editor actions listed by `editorItems` (line 278; UV-4, line 552; paths lines 474-476).
- W2. 26 `symbol_<kind>` glyph names with ASCII stand-ins and Lucide rows (lines 240-271), the AST and memory glyphs (line 276), the paths (lines 481, 482).
- W3. Show Language Server Output opens the unlisted view `lsp-output` (line 279), its paths (lines 470, 488).
- W4. The notices and action labels in `source.yml`, and `source.readonly` kept above the read-only Monaco editor (line 280; path line 486).
- W5. `carriesToken` in `server/core/auth.ts`, the writable sinks in `socket.ts` handed to the terminals and the relay (line 146; Decision 20, line 532), paths (lines 438, 440, 491), case 57 (line 400).
- W6. The transport's own semantic tokens provider and the table from VS Code's `tokenClassificationRegistry.ts` (lines 171-205; Decision 17, line 529), case 52 (line 395).
- W7. `formatOnType: true` on models clangd serves (line 206; Decision 18, line 530), doc text (lines 324, 330).
- W8. As P6: lines 141, 142, 144, 167, 168, case 51 (line 394), Decision 5 (line 517).
- W9. The `LspServices` and `LspPort` types the view passes to the kit (lines 207-235), built by the state side (line 237).
- Declined, the authority tag `(ruling Z182)`: the plan line carries it as the plan's convention; nothing in D23's brief depends on it.
- Declined, the record sections: "The items as they were put" (line 18), "Answer 11" (line 667) and "Step 0" (line 752) are kept as the options and texts the rulings name.
- Declined, who rules L2: Z483 (the orchestrator, automode) ruled it.
- Declined, pyright's memory over a large root: probed, peak 320.0 MB over `~/.claude` and 215.6 MB over the hub (lines 86, 87).
- Declined, `.gyp` served as Python: probed, served (line 88).
- Declined, VS Code's `semanticTokenScopes` defaults: read from `tokenClassificationRegistry.ts:545-595` at microsoft/vscode 548a0c47, and vscode-clangd 0.6.0 adds none (line 172).

# The first brief check, of the 173-line brief at cf880dbe

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

## Rechecked after S5 (2026-10-05)

Agent a06e5bd28d3450606, claude-opus-5-5: 372,291 tokens, 139 tool uses, 16.4 min (completion notice). The brief's premises reread on main at a21aa859d: 42 corrections marked "(corrected after S5: ...)", among them Format on save's four places after S5 moved the readers to `data/sources/config/editor-options.ts`, `DESIGN.md:85` and `HELP.md:169` added to the doc text, and the Outline following the followed tab (Z490). Shared paths: X3f shares 23 paths, `Source.svelte` and `Outline.svelte` rewritten by both, so D23 is prepared on a base after X3f lands; D20's shared files merge simply; D44's `Source.svelte` is not simple, so the second of D23 and D44 is prepared on the other's landing. The "Closed" line numbers above refer to the brief before this recheck.

Closed by the orchestrator: F3 as case 58, F12 as case 59, the first check's case 19 as case 60. Show AST stays in Monaco's right-click menu opening a Files view section, as VS Code's clangd does (Z483, Z496).

## Rechecked after X3f (2026-10-05)

The brief's premises reread on main at b1aedbfc6, whose source tree is X3f's landing ee0407a5a (`git log --oneline a21aa859d..HEAD -- tools/oculus ':!tools/oculus/.scratch'` prints only ee0407a5a). 42 places are marked "(corrected after X3f: ...)" and 17 "(added after X3f ...)", and two paths in "Shared paths" are marked "added to D23's paths by this recheck". The main ones:

- `Source.svelte` is 528 lines on main, over the 520 a component may have, so the step must leave it at or under 520; the split into `language/` and by concern into `status/`, `actions/` or `save/` is now required, not conditional.
- The palette lists the source tab's own actions and what the editor says through `onactions`, so an action added by `addAction` inside an extension is listed nowhere. The language actions are handed to the tab as `EditorOwnAction`s joined to `own`; `EditorOwnAction` gains an optional context menu group for Show AST; labels carry VS Code's category, as X3f's `cmd_*` keys do. `status/ask-perform.ts` joins the paths.
- The breadcrumb's segments carry no icon and the bar is drawn by `PaneStrip.svelte`'s `path` snippet; `Breadcrumb.svelte` gains an optional glyph per segment, and `PaneStrip.svelte` joins the paths.
- The References view makes the Explorer group's chords `s1-s4`: `HELP.md:69` and `config/text/app.yml:12` join the doc text. `DESIGN.md:430`, rewritten by X3f, lists the status bar's right group and must name the three language items.
- `tests/server/root/context-fixture.ts` (it builds a whole `ServerContext`) and `src/lib/server/root/watch/local.ts` (`FIELDS`, so a changed `lsp` is seen) join the paths.
- Every `HELP.md` line after 85 is one higher; every `plan.md` cite moved by three, `orchestrator-history.md` by eight, `choices.md` Z260 to 1631-1636; each quoted ruling compared with its line at b1aedbfc6, all identical. Every reference to X3f's worktree or to X3f being in flight is rewritten to main.

Shared paths, rewritten for D38 and D20, with merges simulated by `git merge-file` on D38's files as its worktree held them:

- D38: not simple. Both write `HELP.md:283`, `DESIGN.md:85`, `config/text/app.yml:12`, and both insert after `DESIGN.md:403`; `HELP.md:68` and `:69` are adjacent. Each simulated: conflict. D23 waits for D38's landing and is prepared on main after it. `options.yml`, `local.ts`, `local.test.ts`, `watch/local.ts`, `index.ts`, `context.ts`, `context-fixture.ts`, `behavior.yml` and `package.json` merge cleanly with the placements the brief now names (`lsp` after `approvals`, never at a list's end; the wire types' export as a new line after `index.ts:510`).
- D20: simple on `DESIGN.md`, `HELP.md`, `index.ts`, `context.ts`, `context-fixture.ts` and `docs/diagrams/` (the nearest pair five unchanged lines apart; the code files simulated clean, D20 and D38 together).

Usage of this recheck: not known to the agent that wrote it; the completion notice carries it.

Usage of the recheck after X3f: ordo-high on claude-opus-5-5 (a109988b506ff31e4), 166,278 tokens, 172 tool uses, 26.9 min (completion notice). `grep -o` counts 31 "(corrected after X3f" and 5 "(added after X3f" markers in `agents/briefs/D23.md`. D23 waits for D38's landing: their merge in `HELP.md`, `DESIGN.md` and `config/text/app.yml` is not simple (`git merge-file` conflicts on each).

## Rechecked after D38 and D20 (2026-10-05)

The brief's premises reread on main's working tree: head f0f311964 ("Book Axel's rulings Z538, Z539, Z543 and Z545"), D38 committed at b07d24766 (`git log --oneline 1fb89b9cd..HEAD -- tools/oculus ':!tools/oculus/.scratch'` prints only that commit), and D20 applied and staged on it (`git diff --cached --stat -- tools/oculus` prints `97 files changed, 3944 insertions(+), 992 deletions(-)`, none under `docs/`). Outside the ledger the working tree holds one unstaged change, `src/lib/views/feeds/literature/Head.svelte`, which no line of the brief names. Every path the brief cites under `src`, `config` and `tests` (190 paths) was compared with b1aedbfc6 by `git diff --stat b1aedbfc6 -- <path>` over each, and `HELP.md`, `DESIGN.md` and `package.json` by their hunks: the changed files are `HELP.md`, `DESIGN.md`, `config/text/app.yml`, `config/catalogs/options.yml`, `config/behavior.yml`, `package.json`, `data/sources/config/local.ts`, `server/root/watch/local.ts`, `server/root/context.ts`, `data/model/index.ts`, `tests/data/sources/config/local.test.ts` and `tests/server/root/context-fixture.ts`, each cited line of them read again by a grep; every other cited file is unchanged and its cites hold (sizes, anchors and folder counts rerun: `Source.svelte` 528, `Palette.svelte` 523, `Editor.svelte` 508, `glyphs.yml` 177 names, the ten-item folders still at 10).

48 places are marked "(corrected after D38 and D20: ...)" on 44 lines and 4 "(added after D38 and D20 ...)"; 33 lines of ledger cites in "The scope as ruled" are renumbered under that section's one marker, each quoted ruling compared with its new line by a script over the working copies (31 cites and the three quoted blocks, every one identical); "Shared paths" is rewritten. The main ones:

- Numbering: D38 inserted two lines after `DESIGN.md:132` and one after `:403`, and one after `HELP.md:131` and two after `:296`; D20's hunks replace one line with one. So DESIGN's Auth is `:151`, Processes `:155`, the rebuild list `:247`, the editor items `:393`, `:397`, `:398`, `:401`, the Search view `:405` (D38's Literature item follows at `:406`, and D23's References item goes between them), the processes rule's second sentence `:419`, the breadcrumb `:430`, the status bar `:433`, the decisions list's last item `:434`; HELP's locked files `:167`, editor options `:171`, references `:179`, the local keys `:284`.
- Ledger: `plan.md` holds one line more from `:506` (D38's booking), so D23's line is `:533-536` and every ruling one higher; `orchestrator-history.md` holds four more at `:7-10`, so Z72 and Z74 are at `:1277-1278` and Z182's raising at `:338`; `choices.md` unchanged; `orchestrator-state.md`'s "code is written by hand only" is at `:79`.
- Code lines D38 or D20 moved: `options.yml`'s `local.yml` entries at `:1205-1280` and `approvals` at `:1236-1238`, D38's `literature.*` keys ending the file; `local.ts` `approvals` at `:87`, `:141`, `:379`; `context.ts`'s `terminals` lines at `:71`, `:108`, `:293`, `:440`, `:494` and `changedKeys` at `:681-692`; `context-fixture.ts`'s at `:43-44`, `:56`, `:119`; `index.ts`'s `model-processes.ts` export at `:535`; `local.test.ts`'s second `hpc_host` row at `:118` and D38's rows ending the table at `:85-87`; `package.json`'s `nodemailer`, `seti-ui`, `trash` and `write-file-atomic` at `:86`, `:87`, `:90`, `:91`.
- `src/lib/server/machine` holds 8 items, D20 having added `seeds/`; D23's `lsp/` and D11's `debug/` bring it to 10.
- Wrong before D38 and D20, found by this recheck: the lsp folder's naming cited "HELP.md:282" for the history folder, which is `HELP.md:121` (the `files` row) and `DESIGN.md:400`; `editor.languages` ends at `options.yml:529`, `latex.auto_build` at 530 (so on a21aa859d as well), where the brief said 533; `socket.ts`'s head comment is lines 1-16, where the brief said 1-12.
- Added: Z545 (b) has A3 put an exception for a scheduled run's idle terminal into the processes paragraph, `DESIGN.md:155`, which D23 also rewrites (premise 13).

Shared paths, rewritten: nothing of D38 or D20 is left to merge, the placements the last recheck asked for (`lsp` after `approvals`, the wire types' export as a new line after `index.ts:535`, the relay beside `terminals`) hold on main, and after D20's commit no step is in flight (the dispatch block names D20 alone). Steps not in flight that share paths, judged at preparation: A3 (its own brief judges the merge with D23 not simple: `model-processes.ts`, `model/index.ts`, `state/client/context.ts`, `context.ts`, `context-fixture.ts`, `package.json`, `DESIGN.md:85`, `:114` and the Processes paragraph), D44 (`Source.svelte` beyond a hunk, `ask-perform.ts`, `source.yml`, the glyph catalogs, `context.ts`, `context-fixture.ts`, `package.json`, `HELP.md`, `DESIGN.md`), D45 (the `latex-editor.ts` move, `s1-s5`, `options.yml:530-564` beginning on the line after D23's `:529`, the status items, `Source.svelte`) and M6 (as `agents/briefs/M6.md:342` lists). In each case whichever is dispatched second is prepared on main after the first lands. `A3.md` and `D44.md` were being changed by other agents while this was read, so the A3 quote is as `grep -n "^- D23 (" agents/briefs/A3.md` printed it at 369.

For the orchestrator, outside D23's brief: `queue.md:6` and `:7` still name Z545 and Z538 with Z539 as what A3 and D44 wait for, and Axel has ruled all three (`plan.md:1267-1270`).

Stops: none. No correction changes what D23 builds or makes a choice Axel would see; the References view's DESIGN.md item now sits between the Search view's item and D38's Literature item, which is the order of the document and no shape of the product.

Usage of this recheck: not known to the agent that wrote it; the completion notice carries it.
