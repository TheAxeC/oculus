D43 premise survey, rechecked on main at c0a4af9c (`git rev-parse --short HEAD`). Read-only: I edited no file, ran only read-only git commands, started no server or test, installed nothing, and never opened tools/oculus/config/local.yml.

Since the survey (at 951b61e3), 19 commits have landed (`git log --oneline 951b61e3..HEAD | wc -l` prints 19), among them D23c (c0a4af9c) and PR3 (a2901490). `git worktree list` shows main only. During the recheck the orchestrator's uncommitted edits to plan.md, queue.md, choices.md and orchestrator-history.md were in the working tree (`git status --short`), so the plan line numbers below are taken from HEAD (`git show HEAD:.../plan.md | grep -n`).

## 0. Plan reads

- No "Goal" heading in plan.md or orchestrator-state.md: holds. The grep prints nothing.
- D43's line: holds word for word, with no sub-bullets. Now at `plan.md:516`, not :514.
- Z347: holds. Now at `plan.md:1117`. "D23 lands before Z669" is at :1452. Z671 is :1444. Z672 (M8, automode) is :1445 and is new. Using the working tree, the other named lines are D45 :519, D15 :524, D36 :591, Z182 :956, Z280 :1090, Z309 :1080, Z299 :1082, Z487 :1259, Z503 :1275, Z541 :1301, Z669 :1441 and Z670 :1442.

## 1. texlab

- Licence GPL-3.0: holds.
  - The GitHub API prints `spdx_id: GPL-3.0`.
  - `brew info texlab` prints `License: GPL-3.0-only`.
  - Cargo.toml on master has `license = "GPL-3.0"` and `version = "5.26.0"`.
  - README:87-89 says GPL-3.0.
  - That running texlab as a separate program puts no GPL obligation on oculus is still a reading, not a legal finding.
- Repository state: holds. It is not archived, has 91 open issues, and was last pushed 2026-10-06T18:50:16Z.
- Latest release: holds. `releases/latest` prints v5.26.0, published 2026-06-25T19:19:51Z. Its macOS assets are `texlab-aarch64-macos.tar.gz` (10154621 bytes) and `texlab-x86_64-macos.tar.gz` (10253264 bytes).
- Homebrew: holds. It prints `stable 5.26.0 (bottled), HEAD` and `Not installed`; installs in the last 365 days are now 2,566, not 2,567. The bottle tag is `['arm64_sequoia']`, the build dependency is `rust`, and there are no runtime dependencies. This machine is macOS 15.6.1 on arm64.
- cargo route: holds. README:46 says "Avoid installing `texlab` from crates.io" and README:51 gives `cargo install --git ... --tag`. `rust-version = "1.89"`. This machine has `cargo 1.98.1`.
- On this machine: holds. `which texlab` prints "texlab not found" and exits 1. clangd is `/usr/bin/clangd`, tex-fmt is `/opt/homebrew/bin/tex-fmt`, and chktex and latexmk are under `/usr/local/texlive/2025/bin/universal-darwin/`. The login-shell PATH is taken at `src/desktop/server/login-env.ts:1-5`.
- Capabilities in `server.rs`: hold. Text sync is incremental, with a save notification that carries no text (:135-147). Document links, folding, definition, references, hover and completion (with resolve) are at :148-158. Document and workspace symbols, rename with prepare, highlight, formatting, executeCommand, inlay hints and `experimental` are at :168-188.
- Providers and symbol kinds: hold. `crates/symbols/src/types.rs:7-21` lists the 14 kinds.
- Diagnostic codes: hold, at `to_proto.rs:89-101`. They are UnusedLabel 9, UndefinedLabel 10, UndefinedCitation 11, UnusedEntry 12, DuplicateEntry 13 and DuplicateLabel 14. The source (:107-111) is `texlab` for Tex and Bib errors, `latex` for build-log errors and `ChkTeX` for ChkTeX results.
- A `.bib` opened as `latex` is parsed as TeX: holds.
  - `server.rs:388` is `Language::from_id(language_id).unwrap_or(Language::Tex)`.
  - `language.rs:41-48` maps `tex`/`latex` to Tex and `bib`/`bibtex` to Bib.
  - oculus sends the model's language as `languageId`. Now at `kit/lsp/transport.ts:224`, not :341.
- texlab asks `workspace/configuration` for section `texlab`: holds (`server.rs:297-320`).
- "A null answer raises the warning": now false, by reading the code (not run). `client.rs:96-116` deserializes into `Option<Options>`, because the error arm returns `None`. serde reads a JSON null as `None`, then `unwrap_or_default()` applies, so a null answer gives texlab's defaults with no message. The "configuration is invalid" warning comes only from a value that fails to deserialize.
- Defaults: hold. Every struct in `server/options.rs` is `#[serde(default)]`. `chktex.on_open_and_save` and `on_edit` are bool (:99-100) and `build.on_save` is bool (:71), so all three default to false.
- texlab reads the build log itself: not rechecked this time. The file was not fetched.
- texlab watches files itself: holds in substance. The notify watcher is made at `server.rs:83` and `struct FileWatcher` is at :1239. The survey's :1241 points into that struct.

## 2. D23's client as landed

- `servers.ts`: now 324 lines, not 319.
  - Head comment :1-14. The sentence "a new server is one entry here and nothing else" is now at :6.
  - `ServerId = 'pyright' | 'clangd'` is now at :41, not :36.
  - `ServerEntry` is now at :96-112, not :91-107. The `Adapter` type sits in this file at :74-94.
  - `createServers` is now at :265-276, with `[pyright(options), clangd()]` at :266.
  - pyright entry :177-214. Its `launch` returns null when the file is missing (:184-192). `ownFolder` is :168-174, and `configuration` answers the `python` section (:196-199).
  - clangd entry :217-260. The command is `'clangd'` and `configuration: () => null` is at :235.
  - `initializeParams` is :282-324. It deletes `textDocument.diagnostic` at :291, and the clangd-only branch is :292-294.
  - The only change since the survey adds `interpreterPrefixes` to `Setup` (:31).
- Adapters outside `servers.ts`: hold. `pyright/adapter.ts` is now 94 lines and `clangd/adapter.ts` 76. `relay.ts:85` is unchanged: `const ADAPTERS: Record<ServerId, Adapter> = { pyright: pyrightAdapter, clangd: clangdAdapter };`. `relay.ts` is now 845 lines, not 869.
- Routing: holds.
  - The relay takes the language from the channel and calls `this.#servers.forLanguage(language)` (`relay.ts:177-178`).
  - The page's `initialize` is answered with `entry.capabilities(language)` (`relay.ts:404`), so a capability the registry does not list never reaches the page, texlab's `experimental` ones included.
  - The channel prefix `lsp:` is at `wire.ts:16-24`.
  - One server per page, root and entry: `relay.ts:6-8`, `DESIGN.md:571`.
- Where server requests are answered: now in `held/held.ts`.
  - `answer()` at :282-320 handles `workspace/configuration`, which calls `this.entry.configuration(section, setup)` at :290-301, and also `client/registerCapability` and progress.
  - The relay's `#serverRequest` (`relay.ts:711-747`) passes on only the two refreshes and `workspace/applyEdit`, and answers anything else with method-not-found.
  - Notifications reach the page in `#serverNotification`, now at `relay.ts:770-797` (was :805). Only `publishDiagnostics` and `inactiveRegions` pass (:771-776). A filter of texlab's `source: "latex"` diagnostics would go there or into texlab's own adapter.
- A missing server: holds, with line moves.
  - `pyright/adapter.ts:41-42` and `clangd/adapter.ts:38-39` answer `not_found`.
  - The spawn's ENOENT check is at `process.ts:195-199`.
  - The state is set in `held/held.ts:441`.
  - The page drops the root's entries at `kit/lsp/client.ts:372-377` (was :357-363).
  - The status bar strings are `LanguageItems.svelte:61-62` and :80-81, with `statusbar.yml:82` and :89.
  - The tex-fmt sentence with its install command is at `config/text/views/academic/latex.yml:48`.
- File types: hold.
  - `config/sources.yml:110` is `latex: [.tex, .latex, .bib, .sty, .cls]`.
  - `kit/grammars.ts:37` has `latex: 'latex'`, inside `SHIKI_IDS` at :21-53, which has no `bibtex` entry. `latex` is also among the grammars that load first (:64).
  - `node_modules/@shikijs/langs/dist` holds `bibtex.mjs`, `latex.mjs` and `tex.mjs`.
- Page side:
  - `SERVED_LANGUAGES = ['python', 'c', 'cpp']` is now at `kit/lsp/hosts.ts:21` (was :20) and is checked at :147 (was :143). The head comment :10-11 says "Pyright serves `python`, clangd `c` and `cpp`".
  - `views/sources/source/language/lsp.ts` is now 487 lines, not 445. Its two-way branches are:
    - `labels()` at :106-113;
    - `servedLanguage` at :117;
    - the output tab name `python ? 'pyright' : 'clangd'` at :385;
    - Select Interpreter or Select Compile Database at :389-399;
    - `!python && answering` at :401 (switch header) and :424 (AST, memory).
  - `SEMANTIC_LANGUAGES = ['c', 'cpp']` is now at `client.ts:40` (checked at :300). `formatOnType` for every non-Python language is now at `client.ts:219` (was :204). `client.ts` is 547 lines.
  - `source.yml` command words: hold. `cmd_clangd_*` are at :12-17 and `cmd_python_*` at :23-25. `cmd_submit` (:29) is the last `cmd_` key before `code:` (:30).
  - `LanguageItems.svelte`: holds. The name ternary is :41, the interpreter item :148 and the compile-database item `{#if !python && shown('compile_database')}` :159.
- What adding texlab needs, items 1 to 15 of the survey: hold, with these line moves.
  - Item 6, `extension.ts:26` (`if (choice.served !== undefined) return choice.served;`): served still wins over `latex()`.
  - Item 7: `latex-editor.ts:58` still wraps `latexOutline` in `symbolsExtension`, and `displayName: 'headings'` is at `symbols.ts:84`.
  - Item 8, `Outline.svelte` (255 lines):
    - the latexReader effect is now :104-112;
    - `served` is :118;
    - `if (served !== null) return symbols;` is :189;
    - `client.ts` sets `'loading'` at :270 and `'none'` at :245 and :511.
  - Item 10: `client.ts:219`.
  - Item 13: holds. `behavior.yml:131` is `latex:`, with `tex_fmt_path` at :135. `options.yml` `latex.*` is at :527-558. `settings.ts` (541 lines) has `latexFormatting` at :478 and `latexAutoBuild` at :497, exported at :523-524.
  - Item 14: holds. The lines are `DESIGN.md:23`, :568 ("Python interpreter or the compile database"), :571-572, `docs/files-and-search.md:71` and `README.md:5` (the install line).
  - Item 15: `servers.test.ts` is now 126 lines (describe 'starting a server' at :122). `lifetime.test.ts` is 490 and `lsp-fixture.ts` 252.

## 3. LaTeX today

- Files Outline for `.tex`: holds.
  - `outlineFollower` is `state/sources/explorer/sections/outline.ts:122-142` and `createLatexReader` is :93.
  - `latexOutline` falls back to `scanSections` at :110-116.
  - D23's look item 13 counted 42 headings for a `.tex` file (`D23-landing.md:49`).
- Sticky scroll and breadcrumbs: holds (`language/latex-editor.ts:58`, `symbols.ts:77-104`).
- D14's view: holds.
  - `views/academic/latex/Latex.svelte` is 70 lines, with `id: 'latex'` and `listed: false`.
  - `views/shared/latex/` holds Main 212, Outline 91, Problems 72, Rows 47 and places 46.
  - `server/content/latex/outline.ts` is 86 lines and is served through `&outline=` (`endpoint.ts:3`). `views/boards/project/Latex.svelte` exists.
  - The build markers have moved: the owner `oculus-latex` is at `kit/latex/latex-widget.ts:38` and `source: 'latex'` at :62 (was :208).
- Problems surfaces today: there is no Problems view, since D33 has no tick at `plan.md:587`.
  - Language-server diagnostics are Monaco markers under owner `lsp-<language>` (`kit/lsp/markers.ts:11-13`), so a texlab marker would be owned by `lsp-latex`, beside D14's `oculus-latex`.
  - The Files Outline marks a symbol row that has a problem (`Outline.svelte:122`).
  - The LaTeX view lists build problems in `views/shared/latex/Problems.svelte`.
- D45's brief: holds as cited. `git diff --stat 951b61e3 HEAD -- agents/briefs/D45.md` prints nothing, so :114-117, :130, :154, :163, :198, :202, :209 and :306-348 are unchanged.
- Overlap and duplication observations: hold, with one addition. `DESIGN.md:535` ("LaTeX reading: ... the sections ... read by one module ... which the server and the Files Outline both call") becomes untrue for the Files Outline once texlab supplies its rows.

## 4. Folder counts and file sizes

Counted with `git ls-files <dir> | sed "s|^<dir>/||" | cut -d/ -f1 | sort -u | wc -l`:

- `server/machine/lsp`: 10 holds. The contents changed: `held/` and `library/` replace `held.ts` and `watch.ts`.
- `lsp/clangd` 3 and `lsp/pyright` 2: hold. The new subfolders are `lsp/held` (3) and `lsp/library` (5).
- `ui/controls/editor/kit/lsp`: now 10, not 9 (a new `transport/` folder).
- `ui/controls/editor/kit`: 10 holds.
- `kit/latex` 2, `views/sources/source` 8, `source/language` 5: hold.
- `shell/status` 9, `state/system/machine/lsp` 7, `state/sources/explorer/sections` 8, `views/sources/files/sections` 9: hold.
- `data/sources/config` 10, `data/model` 10: hold.
- `tests/server/machine/lsp`: now 8, not 7 (`library.test.ts`).
- `config/text/views/sources` 10, `config/catalogs` 8, `tests/data/sources/config` 6, `server/content/latex` 5, `views/shared/latex` 5: hold.

Sizes (`wc -l`):

- `kit/lsp/transport.ts` is now 819 lines, not 897, and is split with `transport/connection.ts` (36) and `transport/messages.ts` (135). No step is forced to split it now.
- `relay.ts` is now 845 (was 869).
- `Source.svelte` 520 holds, which is the component line.
- Now larger: `held/held.ts` 599 (was 587), `client.ts` 547 (was 529), `language/lsp.ts` 487 (was 445), `servers.ts` 324 (was 319), `Outline.svelte` 255 (was 242), `hosts.ts` 172 (was 168).
- Hold: `settings.ts` 541, `LanguageItems.svelte` 171, `outline.ts` 152, `symbols.ts` 105, `grammars.ts` 92, `latex-editor.ts` 65, `extension.ts` 30.
- The size test catches at 900 and 540 (`tests/checks/tree/size.test.ts:5`, :29).

Guarded entries:

- "G36 was never written": now false. G36 is at `agents/guarded.md:62-64`. Its Code is `process.ts` and `relay.ts`; its Test is `lifetime.test.ts`, describe 'the life of a language server'. Its sentence still says "one pyright serves a page's Python tabs of a root, and one clangd its C and C++ tabs", so texlab needs a clause.
- G7: now names `src/lib/server/machine/lsp/servers.ts` and `pyright/interpreter.ts` in its Code line (`guarded.md:26`). Its Test holds `servers.test.ts`, 'starts each server and the interpreter probe with an argument array...'. A texlab entry joins that row.
- G1 names `relay.ts` for the `lsp:` channel (:8), with `relay.test.ts`.
- G2 (:10-11) names `uris.ts` and `library/read.ts`, `tokens.ts` and `rules.ts`.
- G12, G13, G20 and G24: hold (:119, :122, :149, :153).

## 5. Choices: the facts inside them

- C1: holds. The bottle matches this machine and the not-found tooltip is still generic (`statusbar.yml:89`). The tex-fmt precedent is Z280 (`plan.md:1090`) with its keys in Z309 (:1080).
- C2: holds. The keys stand as listed in section 2, item 13.
- C3 (c), "the lazy option makes texlab show its warning": now false (section 1). A null answer gives the defaults silently: build on save off, ChkTeX off, and no forward search configured. Options (a) and (c) differ in what texlab does only for settings other than these three.
- C4: holds. Z487 (:1259), Z503 (:1275), Z541 (:1301) and Z671 (:1444) give D45 the build and SyncTeX. Because the page is told only the registry's capabilities (`relay.ts:404`), texlab's `experimental` build and forward search never reach the page unless the entry lists them.
- C5: the "not verified" point is now verified.
  - VS Code's LaTeX extensions give `.bib` the language id `bibtex`. LaTeX Workshop 10.19.0's `package.json` (`~/.vscode/extensions/james-yu.latex-workshop-10.19.0`) lists `('bibtex', ['.bib'])`, and texlab-vscode's `package.json` on master lists `('latex', ['.tex', '.sty', '.cls']), ('bibtex', ['.bib'])`.
  - Option (b) would now edit `transport.ts` at 819 lines rather than 897.
  - `sources.yml` refuses a language the editor does not colour (its comment at :100), so `bibtex` needs a `SHIKI_IDS` row first.
- C6: holds. Rename is D23b's (`plan.md:553`), and `DESIGN.md:572` refuses an edit outside the open file.
- C7: holds. The Outline would still read "No symbols" with texlab missing, by the same code path as before (`client.ts:372-377` and :511, `Outline.svelte:189`).
- C9: now settled. texlab-vscode (not archived, pushed 2026-09-13) contributes eight commands, all in category "LaTeX": Build file, Cancel build, Forward Search, Clean auxiliary files (latexmk), Clean artifacts (latexmk), Change environment, Find environments and Show dependency graph. It has no Restart or Show Output command, so oculus's restart and output words have no VS Code title to copy for texlab.

## 6. Shared paths with PR3, D23c and D45

- PR3 and D23c are no longer in flight; both have landed. What D23c changed for D43:
  - A definition texlab names outside every served root (a `.sty` under texlive, a `.bib` outside the root) now opens as a read-only library tab through `lsp/library/`.
  - The dot-segment exception is pyright's alone (`library/rules.ts:84`).
  - `language/tab-language.svelte.ts` (70 lines) passes the library address.
  - `held.ts` and `watch.ts` moved under `lsp/held/`.
  - D23c's case 17 ("a LaTeX section: the caret goes to the line") stops holding once texlab's symbols fill the Outline, because a server symbol row selects its name.
- D45: see the last section. Its brief's line numbers (taken at f073b0494) are stale. `latex-editor.ts` is now at `views/sources/source/language/latex-editor.ts`, not `views/sources/source/latex-editor.ts`. `sources.yml`'s latex line is :110, not :106. The LaTeX block of `behavior.yml` is :128-136, and `DESIGN.md`'s LaTeX lines are :531, :533 and :535.

## Changed since the survey

1. D23c and PR3 have landed. No worktree is in flight.
2. `transport.ts` dropped from 897 to 819 lines (split into `kit/lsp/transport/`), so it no longer forces a split. `kit/lsp` is now at 10 items, so a new file there needs a regroup.
3. G36 is written (`guarded.md:62-64`), and G7 now covers `servers.ts`. Both need a texlab clause or row.
4. `server/machine/lsp` still holds 10 items, but now `held/` and `library/` instead of `held.ts` and `watch.ts`. A texlab adapter still needs a regroup there.
5. `relay.ts` is 845 lines (35 below the line), `language/lsp.ts` 487, `client.ts` 547, `held/held.ts` 599.
6. `workspace/configuration` is answered in `held/held.ts:290-301`, and notifications pass at `relay.ts:770-797`.
7. Correction to the survey: a null `workspace/configuration` answer does not make texlab warn (by reading `client.rs:96-116`, not run). C3's lazy-option description is wrong on that point.
8. Verified now: VS Code's language id for `.bib` is `bibtex`. texlab-vscode's commands are in category "LaTeX", with no Restart or Output command.
9. Line moves:
   - plan D43 :516, Z347 :1117;
   - `ServerId` :41, `createServers` :265-276;
   - `SERVED_LANGUAGES` :21, `SEMANTIC_LANGUAGES` :40;
   - `formatOnType` `client.ts:219`;
   - `lsp.ts` branches :106-113, :385, :389-399, :401, :424;
   - the Outline at :104-112, :118, :189;
   - the `languageId` at `transport.ts:224`;
   - the latex-widget owner at :38 and :62.
10. New fact for D45: `DESIGN.md:535` (the "LaTeX reading" paragraph) is made untrue by D43.

## Shared with D45 and M8

The standard: a shared file is simple when git merges it with no conflict, or when the only conflict is two additions whose union is the answer. It is not simple when both steps rewrite the same construct differently, or one moves what the other edits.

**D43 and M8.** M8 has no brief yet. Its survey (`agents/reviews/M8-premise-survey.md:136-141`) names the same five files, and Z672 is at `plan.md:1445`.

- `server/machine/lsp/servers.ts`: not simple. Both edit the same lines:
  - `ServerId` (:41);
  - the head comment "There are two entries" (:6-11);
  - `const entries = [pyright(options), clangd()];` (:266);
  - both append an entry after :262.
  The union of these edits is easy. What is not simple is that both steps need a new adapter inside `server/machine/lsp/`, which already holds 10 items. Two steps each regrouping that folder their own way will not merge.
- `relay.ts`: not simple, for the same reason. `ADAPTERS` at :85 is one line both edit, and the adapter import paths depend on the regroup.
- `kit/lsp/hosts.ts`: a conflict whose union is simple. Both edit `SERVED_LANGUAGES` (:21) and the head comment (:10-11).
- `views/sources/source/language/lsp.ts`: not simple. Each step has to turn the two-way `python ? ... : clangd` branches (:106-113, :385, :389-399, :401, :424) into an n-way choice. Two independent rewrites of the same lines into different shapes need a manual re-design at the merge.
- `config/text/views/sources/source.yml`: simple only if the keys fall in different places. `cmd_latex_*` would sort between :19 and :20, and `cmd_yaml_*` between :29 and :30. If D43 picks `cmd_texlab_*`, both insert at :29-30 and conflict, though the union is still trivial.
- Shared, though neither step lists it yet:
  - `shell/status/LanguageItems.svelte` (:41, :148, :159): not simple, the same two-way branch problem as `lsp.ts`.
  - `config/text/statusbar.yml` (`server_*` at :76-77): both append there, a union conflict.
  - `tests/server/machine/lsp/servers.test.ts`: both extend the one G7 row, a union conflict.
  - `DESIGN.md:23` and :571, and `docs/files-and-search.md:71`: both rewrite the same sentence. Not simple; the sentence has to be written once naming all four servers.
  - `guarded.md:62`, G36's sentence: the orchestrator's text at landing.
  - `client.ts:219`, `formatOnType`: only if yaml-language-server's on-type formatting is turned on.
  - `config/catalogs/options.yml`: not simple. M8's Z672 (4) renames `description:` to `help:` (202 occurrences) and `values:` to `options:` (23) across the whole catalog, which touches every hunk where D43's C2 would add `latex.texlab_path`.
- Judgment: D43 and M8 should not be built in parallel. Whichever goes first should leave a one-row extension point for the second:
  - the regroup of `server/machine/lsp/`, one folder per server, holding a shared no-choices adapter (texlab and yaml-language-server both need an `Adapter` with empty `choices`, `choose`, `approve` and `settings`; two copies would also meet the duplication check);
  - the page-side branches of `lsp.ts` and `LanguageItems.svelte` keyed by server rather than `python`;
  - the `DESIGN.md:571` sentence.
  The second step then adds one row in each of these files.

**D43 and D45.** D45's brief, "Paths this step writes", is at `D45.md:306-348`.

- `config/sources.yml:110`: a same-line conflict. D45 item 9 adds `.rnw .Rnw .jnw .pnw`, and D43 C5 (a) removes `.bib` and adds a `bibtex:` line. The union is simple once C5 is ruled. C5 must be ruled before D45's item 26 ("in a `.bib` tab") is built, since those commands key on the language.
- `config/behavior.yml` latex block (:131-136), `config/catalogs/options.yml` `latex.*` (:527-558), `data/sources/config/settings.ts` (:478-524, the export list :523-524), and the settings tests (`settings.test.ts`, `wrong-settings.ts`): adjacent-insertion conflicts if D43 takes C2 (a), since both steps append keys and readers at the end of the same blocks. The union is mechanical, and options.yml also carries M8's key rename above.
- `views/sources/source/language/latex-editor.ts`: not simple. D45 moves it into `source/latex/` and rewrites it; D43 edits its heading-symbols provider (:58) so texlab's symbols replace it while texlab answers.
- `language/extension.ts` (:26-27) and `tab-language.svelte.ts` (:12, :54, the `latexEditor` import): not simple. D43 must let a served `latex` tab keep `latexEditor`, while D45 moves `latexEditor` and adds providers to it. D45's item 22 (kinds texlab lacks) also depends on D43's final capability list.
- `config/text/statusbar.yml`: not judged until D45 places its LaTeX item's words. It is simple if they sit away from :76-77 (`server_*`) and :106 (`language_bash`, where `language_bibtex` would go).
- `DESIGN.md`: simple except one line. D45 writes :531 and :533; D43 writes :23, :568 and :571-572, at least 30 lines apart. :535 ("LaTeX reading") is the exception: D43 makes it untrue and D45's shared root reader may rewrite it.
- `kit/latex/` and `server/content/latex/`: D45 only. They are coupled to D43 in behaviour only: texlab's `source: latex` diagnostics against D45's build markers (C4), and two `.bib` readers.
- Judgment: D43 and D45 should be built in sequence. D43 first, with C5 and C6 ruled, gives D45 the `bibtex` language and the capability list its item 22 needs, and D45 then moves `latex-editor.ts` with D43's change in it. In parallel, `latex-editor.ts`, `extension.ts` and `tab-language.svelte.ts` would need a hand-merge, and the LaTeX config blocks would conflict.

Usage: claude-opus-5-5, about 205,000 tokens by the context counter, 67 tool uses including this hand-back. Time was not measured.

Agent: af1423dc861b85cb3, claude-opus-5-5, 215,577 tokens, 70 tool uses, 8.1 min.
