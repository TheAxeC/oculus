D43 premise recheck on main at 8bd2070c

`git rev-parse HEAD` printed 8bd2070c740d88b0dfaf6f8c7db6e00f5ac9f2f4. This was a read-only check: I edited no file, ran only read-only git commands, started no server, agent or skill, sent nothing to ports 8787 or 8790, and never opened local.yml. Network reads were limited to WebFetch of GitHub (the API and raw source), `npm view` and `brew info`.

Two findings come before the rest, because the brief cannot be written without them:

- **A. texlab runs a repository's latexmkrc.** texlab runs `latexmk` over the text of any `latexmkrc` or `.latexmkrc` it finds in the folder of a known document or in any folder above it. A latexmkrc is Perl, so this runs the repository's own code. `DESIGN.md:165` says: "What a repository's own configuration would run through a server is a process of the repository's text and takes the approval". The step text does not mention this. Choice U3 in section 5 covers it.
- **B. The step text's description of the client is out of date.** Its picture of how a server is added (relay.ts's adapter table, two-way branches in `lsp.ts` and `LanguageItems.svelte`, D45 moving `latex-editor.ts`) is false now. After D23b, a server is one entry in `servers.ts`, one entry in `data/prose/lsp-servers.ts`, and an adapter attached to the entry. Details are in section 1.

## 1. Premises against the tree

### Plan text and rulings

- **D43's line: holds, moved.** `grep -n "^- D43 " plan.md` printed `519:- D43 LaTeX navigation, after D23: ...`, word for word as before (it was :516 at c0a4af9c). It now has one sub-bullet, at :520 ("Waits for D23b and D45").
- **Rulings: hold.** `grep -n "^- Z347 \|^- Z69[0-9] " plan.md` and the awk over the Rulings section give:
  - Z347 at :1126;
  - Z682 at :1462;
  - Z683 at :1463;
  - Z690 at :1470.
  - Others named by the earlier reports: Z299 :1091, Z309 :1089, Z280 :1099, Z196 :977, Z485 :1267, Z487 :1268, Z499 :1280, Z503 :1284, Z541 :1310, Z671 :1453, Z672 :1454.
- **Z690 D45-2 (the image preview and unimath symbols move to D43): holds, and neither is built.**
  - `grep -rn -i "unimath\|texlab" src config tests HELP.md DESIGN.md docs README.md` finds no unimath code and no texlab code. Its only hits are `LatexLabel` in `latex-state.ts`.
  - D45's report row 22 (`D45-report.md:94`) reads "not built: the two extras of open item D45-2".
- **Z683 (3), D45's extension composing with a language server's: built.**
  - `extension.ts:37-45` has `if (choice.served !== undefined) { return latex ? together(choice.latex(), choice.served) : choice.served; }`.
  - The survey's item 6 (a served LaTeX tab losing `latexEditor`) is now false.
- **Z682 (8), a new server is one entry and one adapter: built by D23b.** The head comment of `servers.ts:6-8` reads "A new server is one entry in each of the two places, and the `adapter` of its entry here names what it needs of a root (written in a folder of its own beside this file); nothing else names a server or a language".

### The plan bullet at :520

- **"servers.ts's entries": moved.** A server is now:
  - an entry in `servers.ts`: `createServers` :499-510, `const entries = [pyright(options), clangd(), typescript(options), svelte(options)]` at :500;
  - plus an entry in `src/lib/data/prose/lsp-servers.ts`: `LSP_SERVERS` :76-149, `LspServerId` union :16, covering languages, words, semantic tokens, formatOnType, organizeImports, choices, extras and approvedBy.
  - `servers.ts` has `type ServerId = LspServerId` (:57) and is now 556 lines (`wc -l`), up from 324.
- **"relay.ts's adapters": false.** `grep -n "ADAPTERS" relay.ts` prints nothing. The adapter is `ServerEntry.adapter` (`servers.ts:130`), and the relay calls `held.entry.adapter.prepare(...)` (`relay.ts:648`). relay.ts is 839 lines.
- **"the two-way server branches of lsp.ts and LanguageItems.svelte": false.**
  - `lsp.ts:410-491` reads `factsForLanguage(language)` and `facts.words.*` / `facts.extras`.
  - `LanguageItems.svelte:45-47` reads `facts?.choices` and `t(facts.words.name)`.
  - `hosts.ts:19-22` re-exports `SERVED_LANGUAGES` from the facts (`lsp-servers.ts:171`).
  - `client.ts:255` takes formatOnType from `factsForLanguage(...)?.formatOnType`.
- **"latex-editor.ts, which D45 moves": false.**
  - The file is still `views/sources/source/language/latex-editor.ts` (`ls views/sources/source/language`), now 125 lines.
  - D45 added a new folder `views/sources/source/latex/` holding `latex-tab.svelte.ts` (460 lines), `LatexButtons.svelte` and `LatexDialogs.svelte`.
- **"extension.ts": built by D45** (above).
- **"tab-language.svelte.ts": holds, moved.** It imports `latexEditor` at :15 (was :12) and calls `languageExtension` at :56.
- **"the LaTeX config blocks": moved.**
  - `grep -n "^latex:" config/behavior.yml` prints :135 (was :131). The block runs to `tools:` before `# === Writes` at :174, and holds `synctex_path`, `latexindent_path`, `tex_fmt_path` and `badness_path`.
  - The `latex.*` entries of `options.yml` are :527-646. That file is 1286 lines with 216 `description:` and 0 `help:` (`grep -c`).
  - `settings.ts` is 770 lines (was 541). `latexFormatting` is at :494, `latexBuild` at :700, with `synctexPath` at :718.

### texlab facts

**Licence and release** (WebFetch of `api.github.com/repos/latex-lsp/texlab` and of `.../releases/latest`):
- Licence: holds, `License SPDX ID: "GPL-3.0"`.
- `archived false`, `open_issues_count 91`, last push `2026-10-06T18:50:16Z`, owner `latex-lsp`.
- Latest release: holds, `v5.26.0`, published `2026-06-25T19:19:51Z`. Assets `texlab-aarch64-macos.tar.gz` (10,154,621 bytes) and `texlab-x86_64-macos.tar.gz` (10,253,264 bytes).

**Homebrew and this machine:**
- `HOMEBREW_NO_AUTO_UPDATE=1 brew info texlab` prints `stable 5.26.0 (bottled), HEAD`, `Not installed`, `License: GPL-3.0-only`, `install: ... 2,566 (365 days)`.
- The JSON form gives bottle `['arm64_sequoia']`, build dependency `['rust']`, no runtime dependencies.
- `sw_vers -productVersion` prints 15.6.1 and `uname -m` prints arm64, so the bottle matches. Not installed: `command -v texlab` exits 1.
- The programs texlab runs are present: `command -v latexmk latex kpsewhich` prints the three under `/usr/local/texlive/2025/bin/universal-darwin/`, and `tectonic` is absent. `latexmk --version` prints `Version 4.86a`.

**No npm route.** `npm view texlab`, `npm view @texlab/texlab` and `npm view texlab-bin` each print `E404`.

**Capabilities.** WebFetch of `crates/texlab/src/server.rs` gives:
- text sync incremental, save without text;
- `document_link`, `folding_range`, `definition`, `references`, `hover`, `completion` (resolve, triggers `\ { } @ /` and space);
- `document_symbol`, `workspace_symbol`, `rename` with prepare, `document_highlight`, `document_formatting`;
- `execute_command` (cleanAuxiliary, cleanArtifacts, changeEnvironment, findEnvironments, showDependencyGraph, cancelBuild);
- `inlay_hint`, and `experimental` textDocumentBuild and textDocumentForwardSearch.
- **No** type definition, declaration, implementation, signature help, code action, call hierarchy or selection range.
- This bears on `servers.ts:190-205`: `common()` always tells the page `typeDefinitionProvider` (:196), and texlab has none.

**A null configuration answer gives defaults with no warning: holds** (the recheck's correction). WebFetch of `crates/texlab/src/client.rs` quotes `parse_options`: `serde_json::from_value(options)` into an option, and the warning "The texlab configuration is invalid; using the default settings instead." is sent only in the `Err` arm, then `options.unwrap_or_default()`.

**A `.bib` sent as `latex` is read as TeX: holds, moved.**
- `transport.ts:256` is `languageId: doc.language`, and the language comes from `model.getLanguageId()` (:234). It was :224.
- `config/sources.yml:110` is `latex: [.tex, .latex, .bib, .sty, .cls, .rnw, .jnw, .pnw]`; D45 added the three weave endings.
- `grammars.ts` `SHIKI_IDS` (:21-53) has no `bibtex`.

**The programs texlab starts** (new, read from source, not run):
- `crates/distro/src/lib.rs`: `Command::new("latex").arg("--version")` and `Command::new("tectonic")...` in `Distro::detect()`.
- `crates/distro/src/kpsewhich.rs`: `Command::new("kpsewhich").args(args)`.
- `crates/parser/src/latexmkrc.rs`: `v484::parse_latexmkrc(input, src_dir)` writes `append_texinputs(input)`, which is the latexmkrc text plus print lines, to `<tempdir>/.latexmkrc`, then runs `Command::new("latexmk").arg("-dir-report-only").current_dir(temp_dir.path())`.
- `crates/base-db/src/document.rs`: `Language::Latexmkrc => ... parser::parse_latexmkrc(&text, dir)`.
- `crates/distro/src/language.rs`: `".latexmkrc"` or `"latexmkrc"` is `Language::Latexmkrc`.
- `crates/base-db/src/deps/discover.rs`: `discover_parents` does a `read_dir` of the ancestor folders of known documents and loads `Language::Tex | Language::Root | Language::Tectonic | Language::Latexmkrc` files.
- So a latexmkrc in a document's folder or any folder above it is executed by latexmk under texlab.
- `find . -path ./secrets -prune -o \( -name latexmkrc -o -name .latexmkrc \) -print` over the hub printed nothing, and `ls ~/.latexmkrc ~/.config/latexmk/latexmkrc` found neither. The roots under `~/workspace/*` were not scanned.

**Watching files: not rechecked.** texlab watching files itself was not re-read; the recheck had it at `server.rs:83` and :1239.

### The client as landed (the survey's items 1 to 15)

- **Configuration answers: holds.** They are given in `held/held.ts:290-301` through `this.entry.configuration(section, setup)`. Per the WebFetch of `client.rs` above, a null answer to texlab gives its defaults with no warning.
- **Server notifications: hold, moved.** They pass at `relay.ts:763-791`: only `textDocument/publishDiagnostics` and `textDocument/inactiveRegions` (:766-767), and `window/showMessage` goes to the log (`held.ts` `notice`). A diagnostic for a document the page has not opened is dropped at `relay.ts:776`: `if (doc === undefined || page === null || mapped === null) return;`.
- **Capabilities told to the page: holds, moved.** `entry.capabilities(language)` is at `relay.ts:419` (was :404).
- **A missing program: holds, moved.**
  - `held/process.ts:199` is `events.failed(error.code === 'ENOENT' ? 'not_found' : 'exited', launch.program)` (was `process.ts:195-199`).
  - `notFound` is at `choices.ts:206-214`, and the adapter parts shared by every server with no approval of its own (`NO_APPROVAL`) are at :220-224.
- **Status words: hold, moved.**
  - `statusbar.yml` has `server_pyright/clangd/typescript/svelte` at :85-88.
  - `ls_tip_not_found: '{0} was not found for {1}. Install it, then restart the language server.'` is at :100 (was :89).
  - `language_latex: LaTeX` is at :137. There is no `language_bibtex`.
- **Install sentences in the LaTeX catalog: moved.** The tex-fmt sentence is now `latex.yml:139` (was :48). A brew precedent exists at :130, `refused_program_brew: '{0} was not found, so the build was not started. Install it with brew install {1}.'`.
- **Palette words: the survey's C9 is now settled by precedent.** `source.yml:11-36` has `cmd_typescript_restart: 'TypeScript: Restart Language Server'` and `cmd_svelte_restart: 'Svelte: Restart Language Server'`. The facts' `words.restart` and `words.output` point at these keys (`lsp-servers.ts:83-84`, :101-102, :119-120, :137-138).
- **Outline.svelte: holds.** `git log --format=%h c0a4af9c..HEAD -- src/lib/views/sources/files/sections/Outline.svelte` prints nothing. The latexReader effect is :104-112, `served` :118, `if (served !== null) return symbols;` :189, and the file is 255 lines.
- **Symbol states in client.ts: moved.** `client.ts` (640 lines) sets `'loading'` at :308 and `'none'` at :283 and :604. On `not_found` it clears the root's markers (:421-426) but leaves the symbol state alone. By reading, not run: a LaTeX tab with texlab missing gets either "No symbols" or a lasting loading state in the Outline in place of its headings. The survey's C7 is still open.
- **latex-editor.ts symbols: holds, moved.** It registers the heading symbols at :108 (was :58). `symbols.ts:84` is `displayName: 'headings'`. `kit/folding.ts:10-13` states the precedent: "While a language server serves a model its folding ranges are the ones used ... Monaco joins the ranges of every provider of a language, so two answers for one block would be drawn twice".
- **Build marker owner and source: moved.** `latex-widget.ts:54` is `const OWNER = 'oculus-latex'` and :78 is `source: 'latex'` (were :38 and :62). The LSP owner is `lsp-${language}` (`markers.ts:12`).
- **D45's Format Document is the editor's own registration** (`latex-widget.ts:287-304`, `kit.formatting.add`). The LSP client's `#format` answers `unsupported` when the entry declares no `documentFormattingProvider` (`client.ts:612-614`).
- **DESIGN.md:**
  - `:23` names four servers, rewritten by D23b.
  - `:535` was rewritten by D45. It still says the Files Outline calls the shared reader, and adds "the extension composes with a language server's, so a served LaTeX file keeps both". Once texlab answers the Files Outline, the first part becomes untrue.
  - `:568` still says "the Python interpreter or the compile database".
  - `:571` was rewritten by D23b: "One entry per server holds what is known before a message is sent (`src/lib/data/prose/lsp-servers.ts`...) and one holds how it is started (`server/machine/lsp/servers.ts`); nothing else names a server or a language".
  - `:165`, the processes rule, is quoted above.
- **docs/files-and-search.md:71: moved text.** D23b rewrote it ("Each action is in the palette under the language's name, such as Python: Select Interpreter or clangd: Restart language server").
- **README.md:5: holds as the install paragraph, but it names no external program.** `grep -n -i "clangd\|brew" README.md` prints no install line for clangd.
- **guarded.md** (`grep -n` over it):
  - G7 :25-27, with Code naming `servers.ts`, `pyright/interpreter.ts`, `web/svelte-adapter.ts` and `web/typescript-adapter.ts`, and its test row in `servers.test.ts` 'starts each server and the interpreter probe with an argument array...'.
  - G36 :65-67. Its sentence now names four servers ("one TypeScript server its TypeScript and JavaScript tabs and one Svelte server its Svelte tabs"), so texlab needs a clause.
  - G12 :122, G13 :125, G20 :152, G24 :156.
- **Tests:** `tests/server/machine/lsp` holds 9 items. `servers.test.ts` is 133 lines with describe 'starting a server' at :129.

### Sizes and folder counts (`wc -l`; `git ls-files <dir> | sed | cut -d/ -f1 | sort -u | wc -l`)

**Near the size line:**
- `server/root/context.ts` 879. The relay is built here (:341-345), so a path key reaching the relay needs a split.
- `kit/lsp/transport.ts` 871 (was 819).
- `relay.ts` 839.
- Also large: `client.ts` 640, `held/held.ts` 601, `servers.ts` 556, `language/lsp.ts` 543, `settings.ts` 770.

**Folders already at 10 items:**
- `server/machine/lsp`, which holds choices.ts, clangd, held, library, pyright, relay.ts, servers.ts, uris.ts, web and wire.ts;
- `kit`, `kit/lsp`, `shell/status`, `state/system/machine/lsp`, `data/sources/config`, `config/text/views/sources`, `server/content/latex`.

**Folders with room:**
- 9 items: `data/prose`, `views/sources/source`, `views/sources/files/sections`, `tests/server/machine/lsp`, `config/catalogs`.
- 8 or fewer: `kit/latex` 6, `source/language` 6, `source/latex` 3, `lsp/web` 4, `tests/data/sources/config` 6.

### What D45 already built that D43 would duplicate

Read from the tree; `git show --stat 0753a5e76` lists 203 files.

- **Citations.**
  - A Citation Browser: a picker command `oculus.latex.cites` at `latex-tab.svelte.ts:358`, reading `latex.cites` and inserting `\cite{key}` or the key inside an open `\cite` (`:188-242`).
  - It is fed by `server/content/latex/bib.ts:28` `citationsOf`, which reads every `.bib` in the root's closure through `data/prose/bib.ts` (latex-utensils' `bibtexParser`).
  - A checkcites run in a terminal (`actions.ts:327`).
  - None of these is a completion provider or a problem marker.
- **Labels.** The server outline returns `labels` with build numbers across includes (`server/content/latex/outline.ts`, type `Outline` with `labels: LabelEntry[]`). The page uses them only for the `\ref` hover and View on PDF (`latex-editor.ts:36-53`, :89-101). There is no `\ref` completion and no go-to-label.
- **Hovers:** `\ref`-family (number, typeset block, View on PDF) and `\usepackage` (texdoc), in `kit/latex/latex-widget.ts` and `references.ts`. Z690 keeps texlab's hovers beside them.
- **Completion:** `\envname` and sub/superscripts (`latex-suggest.ts:29`) and `@` suggestions (`latex-editing.ts:207`).
- **Structure:** the TeX view's Structure (`views/academic/latex/Structure.svelte`, sections, labels and floats across includes). The Files Outline and sticky scroll still come from the per-file heading reader.
- **Problems:** the build log's problems as markers (`latexDiagnostics`, `latex.svelte.ts:454`) and the TeX view's Problems section (`views/academic/latex/Problems.svelte`).
- **Picture finder:** `kit/latex/latex.ts:89-95` (`pictureAt`, `pictureFile`), which an `\includegraphics` completion preview can reuse.
- **Math Symbols:** the Math Symbols table (`latex_editing.symbols` in `config/catalogs/latex.yml:158`), which is LaTeX Workshop's snippet panel and not the unimath completion.

**What D43 adds without overlap:** `\cite` and `\ref` completion, go to a label, texlab's per-file symbols, undefined/unused label and citation problems, unused and duplicate `.bib` entries, and texlab's command, environment, package, class, file and colour completion.

## 2. What the landings since c0a4af9c changed in D43's files

Commits: `git log --oneline c0a4af9c..HEAD` lists 24 commits. Those touching oculus outside the ledger are 0753a5e76 (D45), 639820b91 (D23b) and eede45985 (PR4). Per path, from `git log --format=%h c0a4af9c..HEAD -- <path>`:

- **`server/machine/lsp/`: 639820b91.**
  - `servers.ts` +328/-: the entries for typescript and svelte, `Adapter` and `ServerEntry.adapter`, `common()`/`Offers`, `packaged`, `factsOf`.
  - `choices.ts` +78: `notFound` and `NO_APPROVAL`.
  - New `web/` (approval.ts, config-files.ts, svelte-adapter.ts, typescript-adapter.ts) and `held/elsewhere.ts`, `held/oculus.ts`.
  - `process.ts` moved under `held/`.
  - `relay.ts` 182 lines changed: adapters via the entry.
- **`data/prose/lsp-servers.ts`: 639820b91**, new, 209 lines.
- **`kit/lsp/`: 639820b91.** `client.ts` +109, `hosts.ts`, `transport.ts` 308 lines changed and now 871, new `transport/edits.ts`.
- **`views/sources/source/language/`:**
  - 639820b91: `lsp.ts` 178 lines changed, onto the facts; new `hierarchy.ts`.
  - 0753a5e76: `extension.ts` (the `together` composition), `latex-editor.ts` +76, `tab-language.svelte.ts` +28.
- **New `views/sources/source/latex/`: 0753a5e76.**
- **`kit/latex/`: 0753a5e76.** New `editing/`, `latex-editing.ts`, `latex-suggest.ts`, `references.ts`; `latex-widget.ts` rewritten.
- **`shell/status/LanguageItems.svelte`: 639820b91**, onto the facts. D45 also added `LatexItem.svelte`.
- **`state/sources/explorer/sections/outline.ts`: 0753a5e76.** `Outline.svelte`: no commit.
- **`state/system/machine/lsp/`: 639820b91** (edits, hierarchy, workspace-symbols).
- **`config/sources.yml`: 0753a5e76**, adding `.rnw .jnw .pnw` to the latex line. **`grammars.ts`: no commit.**
- **`config/behavior.yml`, `options.yml`, `settings.ts`, `tests/data/sources/config/`: 0753a5e76**: the recipes, tools, synctex, formatter and auto build keys, and their readers and G13 rows.
- **`config/text/statusbar.yml`: 0753a5e76 and 639820b91** (`server_typescript`, `server_svelte`, the LaTeX item).
- **`config/text/views/sources/source.yml`: 639820b91** (`cmd_typescript_*`, `cmd_svelte_*`).
- **`config/text/views/academic/latex.yml`: 0753a5e76.**
- **Docs:**
  - `DESIGN.md`: 0753a5e76, 639820b91, eede45985 (:23, :535, :571 among them).
  - `HELP.md`: the same three.
  - `README.md`: 639820b91 (the runtime dependency list).
  - `docs/files-and-search.md`: 0753a5e76 and 639820b91.
  - `docs/views.md`: 0753a5e76, 639820b91, eede45985.
- **`tests/server/machine/lsp/`: 639820b91** (`servers.test.ts`, `lifetime.test.ts`, `lsp-fixture.ts`, new `svelte-trust.test.ts`).
- **`server/content/latex/`, `data/prose/latex.ts`, new `data/prose/bib.ts`: 0753a5e76.**
- **`agents/guarded.md`:** 0753a5e76, 639820b91, eede45985, 8d9cdd605.
- **`tests/checks/tree/boundaries.test.ts`:** 0753a5e76 and 639820b91.

The earlier recheck's judgment that D43 should go before D45 and be built in sequence with M8 is moot now that D23b and D45 have landed. The unused-exports base line was not taken; that is the brief's.

## 3. Paths this step writes

As precisely as the tree allows. Which ones depend on the choices in section 5 is noted on each line.

**Registry (always):**
- `src/lib/server/machine/lsp/servers.ts`: the texlab entry. `Offers` gains a type-definition flag, or texlab gets its own capability map. Head comment :10-17 ("There are four entries").
  - Also written by M8 (yaml-language-server is a new server; M8 plan :239 and Z672).
- `src/lib/data/prose/lsp-servers.ts`: `LspServerId`, the texlab entry, the head comment. A `words.install` field if U1 (a). Also written by M8.

**The adapter (new file or files):**
- Under U3 (a), `src/lib/server/machine/lsp/texlab/adapter.ts` plus an approval module. `server/machine/lsp/` is at 10 items, so the step regroups it, for example moving `clangd/`, `pyright/`, `web/` and `texlab/` into one folder. M8 needs the same folder.
- Without U3, a shared no-choices adapter beside `NO_APPROVAL` in `src/lib/server/machine/lsp/choices.ts` (224 lines). M8 could reuse it.
- Under U3 (a), also `src/lib/server/machine/approvals/approvals.ts` and `src/lib/data/model/model-processes.ts` (a new approval kind). M8 not known.

**Diagnostics:**
- The `source: "latex"` filter (U8): `src/lib/server/machine/lsp/relay.ts` (839 lines) through a new `ServerEntry` hook. M8 and D33 may touch relay.ts; D33's recheck names the relay rule at old line numbers.

**Path key and settings:**
- If U2 (a): `src/lib/server/root/context.ts` (879 lines, so a split), `relay.ts` `RelayOptions`, `config/behavior.yml` latex block (:135-172), `config/catalogs/options.yml` latex entries (:527-646), `src/lib/data/sources/config/settings.ts` (770), `tests/data/sources/config/settings.test.ts` and `wrong-settings.ts`. The same files carry the two keys of U5.
  - `options.yml`: also X3e (brief line 69), D11 (:1209-1217), D28 (:496-529, adjacent to `latex.auto_build` at :527) and M8 (Z672 (4) renames all 216 `description:` to `help:`).
  - `settings.ts`: also X3e (brief line 25).
  - `settings.test.ts`: also X3e (brief line 80).
  - `behavior.yml`: also D28 (:114-129, the editor block).

**Catalogs:**
- `config/text/statusbar.yml` :85-88 (`server_texlab`), plus `language_bibtex` near :137 if U4 (a). Also D11 (:9), D33 (an item name) and M8 (`server_yaml...`).
- `config/text/views/sources/source.yml` (`cmd_latex_restart`, `cmd_latex_output`, sorting between `cmd_find_references` :20 and `cmd_next_reference` :21). Also X3e, D28 and M8.
- `config/text/views/academic/latex.yml`: the not-found sentence if it sits there, and the words of the unimath completion. Nothing else queued known.
- `config/catalogs/latex.yml`: a unimath group with LaTeX Workshop's MIT notice, if I7 (a). Its reader is `src/lib/data/sources/config/catalog/latex-tables.ts`. Nothing else queued known.

**The `.bib` language, if U4 (a):**
- `config/sources.yml:110` and a `bibtex:` line. Also X3e (`repository_scan_depth` after `roots:`) and M6 (line 48), at different lines.
- `src/lib/ui/controls/editor/kit/grammars.ts` (`SHIKI_IDS`).
- `src/lib/views/sources/source/latex/latex-tab.svelte.ts:102-108` (`applies` keyed on `LATEX_LANGUAGE`, and `bib`).
- `src/lib/views/sources/source/language/extension.ts:38`.
- `src/lib/views/shared/latex/followed.svelte.ts:37`.
- None of these is known to be written by another queued step.

**Editor (page side):**
- `src/lib/views/sources/source/language/latex-editor.ts`: the heading provider off while texlab answers; the image preview and unimath wiring. Not known for others.
- `src/lib/views/sources/source/language/symbols.ts` (maybe). Not known.
- `src/lib/ui/controls/editor/kit/latex/latex-suggest.ts`, or a new file in `kit/latex/` (6 items): the unimath completion and the `\includegraphics` preview. Not known.
- `src/lib/views/sources/files/sections/Outline.svelte`: the fallback while texlab is missing or loading. Also X3e (brief line 46, the section head's drag props) and D33 (reads `diagnosticsOf`).
- `src/lib/ui/controls/editor/kit/lsp/client.ts` (640): only if the fallback needs a `none` on `not_found`. D33 per its recheck.
- `transport.ts` (871): only if U4 (b), and then a split.

**Tests:**
- `tests/server/machine/lsp/servers.test.ts`: a texlab row under G7. Also M8.
- Possibly `tests/server/machine/lsp/lifetime.test.ts` (G36).

**Docs:**
- `DESIGN.md` :23, :165 (if U3), :535, :568, :571. Also written by D11, D28, M6, M8 (:23, :24, :571), D33 (:568) and D36 (:23).
- `docs/files-and-search.md:71`. Also M8 and D33.
- `docs/views.md:263`. Not known.
- `HELP.md`, the palette actions. Also D11, D28, M6.
- `README.md` if it is to name the texlab install. Not known.
- `docs/configuration.md` if new keys. Not known.

**The orchestrator's:** `agents/guarded.md` G7 :25-27 and G36 :65-67.

**Cannot tell:** D15's brief has no "Paths this step writes" heading (`grep -n "^#" agents/briefs/D15.md` prints only `# Brief: D15` and one subheading). D41, D39, D40, D36 and M7 have no brief; their plan lines name none of the files above except DESIGN.md:23 for D36.

## 4. Libraries

**The LSP client and transport:** no new library. Ruling Z478 chose `vscode-jsonrpc` 9.0.3 and `vscode-languageserver-protocol` 3.18.4 (package.json :105-106). Everything for texlab rides on them.

**texlab itself (Z347 asks for licence and install route):**
- Licence: GPL-3.0 (GitHub API) / GPL-3.0-only (brew).
- Maintainer Patrick Foerster (pfoerster), org `latex-lsp`; v5.26.0 published 2026-06-25; repository pushed 2026-10-06, not archived.
- Install routes:
  - Homebrew bottle 5.26.0 for `arm64_sequoia`, which matches this machine (15.6.1 arm64), with no runtime dependencies.
  - GitHub release tarballs; whether they are codesigned or notarized was not verified.
  - `cargo install --git ... --tag v5.26.0`, per the survey and recheck; not rerun.
- No npm package (three 404s). It runs as a separate program over stdio, like clangd, so package.json is not involved. Whether running it puts any obligation on oculus is a legal reading, not verified.

**unimath symbol completion (Z690 D45-2):**
- (i) LaTeX Workshop 10.19.0's `data/unimathsymbols.json`: 2415 entries, 334,627 bytes; each has `command`, `detail` (the glyph) and `documentation`. The extension is `"license": "MIT"` (package.json:8). Its README says the file "is generated from the `unimathsymbols.txt` ... by Günter Milde". The upstream file's licence was not verified: its URL redirects, and ctan.org/pkg/unimathsymbols is 404.
- (ii) `unicode2latex` 7.0.35: ISC, maintainer retorquere, modified 2026-09-04, ESM and CJS, 1,785,108 bytes unpacked. It maps characters to macros; whether it carries descriptions was not verified.
- (iii) `unicode-math` 0.2.0 (MIT, jmeas, 2022-06-28) and `latex-symbols-list` 0.1.2 (MIT, jmeas, 2022-06-19): stale.
- What stays hand-written in every case: the completion provider in `kit/latex/` and the setting. The data source is the choice (I7). No ruling covers it.

**`\includegraphics` preview while completing:** none found. `image-size` ^2.0.4 is already a dependency (package.json:79). The finder is D45's `kit/latex/latex.ts:89-95` and the address is `fileBytesUrl`. Hand-written: decorating texlab's File completion items with the preview.

**`.bib` reading, label reading, outline:** none needed. texlab reads them itself. D45's `latex-utensils` 7.0.0 reader stays for the Citation Browser.

## 5. Choices

### User-visible, or changing an established decision

**U3. texlab and a repository's latexmkrc (new; DESIGN.md:165).**
- (a) **Recommended.** texlab starts for a root only after the reader approves the latexmkrc text texlab would read, as the Svelte server does: an `approvals` entry keyed by the files' hashes, a status bar note while it waits, a changed file asking again. A root whose document folders and their ancestors hold no latexmkrc starts at once.
  - Pros: keeps the processes rule as written; follows the Svelte precedent of Z682 (6).
  - Cons: a new approval kind (a wire and file shape); an adapter with approval logic, so the `lsp/` regroup; it needs to know which ancestor folders texlab scans (read from `discover.rs`, the depth not read).
- (b) Start texlab in an environment where `latexmk` is not on PATH.
  - Cons: it also hides `latex` and `kpsewhich`, which texlab needs. Not proposed.
- (c) Treat texlab like the build. D45's latexmk build already reads the repository's latexmkrc, on a press or on save under `latex.auto_build: on_file_change` (behavior.yml).
  - Pro: nothing new to build.
  - Con: it departs from DESIGN.md:165's sentence, which is a ruling for Axel. This is the lazy option.
- Note: D45's build reading latexmkrc without an approval may itself be outside DESIGN.md:165's wording. That is outside D43 and is reported here, not judged.

**U1. Install route and the not-found words.**
- (a) **Recommended.** `brew install texlab`, named in the not-found tooltip through a per-server catalog key (a `words.install` facts field), following `latex.yml:130`'s `refused_program_brew`; README or docs name it too.
  - Pros: one command, the matching bottle, GPL binary not redistributed.
  - Con: version not pinned.
- (b) A script fetches the pinned v5.26.0 tarball into oculus's folder.
  - Pro: pinned.
  - Cons: a new script needs Axel's approval; notarization not verified.
- (c) cargo from the tag. Con: a Rust toolchain and an unmeasured build time.
- The lazy option: keep the generic `ls_tip_not_found` at `statusbar.yml:100`.

**U2. A path key `latex.texlab_path`.**
- (a) **Recommended**, beside `synctex_path`, `latexindent_path`, `tex_fmt_path` and `badness_path`, under Z280 (c)'s "a path setting per program" and Z309.
  - Con: it reaches the relay through `context.ts` (879 lines), which then must be split.
- (b) PATH only, as clangd. The lazy option.

**U4. The language of `.bib`.**
- (a) **Recommended.** A `bibtex` language, the id LaTeX Workshop and texlab-vscode use per the recheck. Its parts:
  - `sources.yml`, `SHIKI_IDS` (`@shikijs/langs` has `bibtex.mjs`), `language_bibtex`;
  - texlab serving `['latex','bibtex']`;
  - D45's `.bib` commands and `applies` (`latex-tab.svelte.ts:102-108`, `extension.ts:38`, `followed.svelte.ts:37`) carried to `bibtex`.
- (b) Keep `latex` and send `languageId: 'bibtex'` for `.bib` from a facts field.
  - Con: `transport.ts` at 871 lines must be split, and the status bar keeps calling a `.bib` file LaTeX.
- (c) Do not serve `.bib`. Lazy: loses the unused and duplicate entry problems, and a `.bib` tab is still parsed as TeX.

**U5. The keys of the two LaTeX Workshop extras.**
- (a) **Recommended.** `latex.unimath_symbols` (default false) and `latex.includegraphics_preview` (default true), after LaTeX Workshop's `intellisense.unimathsymbols.enabled` (package.json:2339, `"default": false`) and `intellisense.includegraphics.preview.enabled` (:2396, `"default": true`), with catalog entries and G13 rows.
- (b) No keys: symbols always off, preview always on. Lazy: the symbols could never be turned on, which Z690's "off by default" implies they can.

**U6. Words.**
- **Recommended:** `LaTeX: Restart Language Server` and `LaTeX: Show Language Server Output` as `cmd_latex_*`, and status name `texlab`, on the TypeScript and Svelte precedent (`source.yml:33-36`).
- The other option: `texlab: ...` after clangd's words (`source.yml:13-18`). texlab-vscode has no restart or output command (per the recheck).

**U7. Which texlab features reach the page.**
- **Recommended:** everything texlab offers except formatting (D14's `latex.formatter` keeps Format Document), build, forward search and its execute commands for build and clean (D45 owns these by Z487, Z503 and Z541).
- That is: hover, definition, references, highlight, symbols, workspace symbols, completion with resolve, folding, document links, inlay hints, and rename. Z682 (3) offers Rename from every server that declares it, through D23b's lsp-edit.
- Lazy: only the plan line's four features, which leaves D45 brief rows 129-131 unbuilt.

**U8. texlab's build-log diagnostics (`source: "latex"`).**
- **Recommended:** dropped, through an entry-level hook applied in the relay, so each build error shows once (D45's `oculus-latex` markers). texlab's own diagnostics (`texlab`) pass, and `ChkTeX` stays off by configuration (D36 owns it by Z196).
- Lazy: keep both, so each error shows twice.

**U9. The Outline.**
- **Recommended:** the heading reader's rows while texlab is not found, failed or loading; texlab's full symbol tree once it answers (sections, figures, tables, equations, theorems, BibTeX entries).
- Lazy: "No symbols" with texlab missing, a regression from D23's look item 13.

**U10. Problems in files not open.** `relay.ts:776` drops a server's diagnostics for documents the page has not opened, for every server.
- (a) **Recommended:** D43 keeps the rule and its problems show for open files; D33 (the Problems view for every server's diagnostics) decides it for all servers. This is a different concern, D33's, and D33's recheck already names it (`D33-premise-recheck.md:227`).
- (b) D43 widens the relay for texlab alone. This contradicts "nothing else names a server" (`DESIGN.md:571`).

### Internal, reversible choices the brief can take

- **I1. Adapter placement.** With U3 (a): a `texlab/` folder and a regroup of `server/machine/lsp/` (10 items) that M8's adapter joins. Without it: a shared no-choices adapter in `choices.ts` beside `NO_APPROVAL`. Recommended: the regroup, since M8 needs a folder too.
- **I2. `Offers` gains `typeDefinition`** (and the entries set it), so texlab is not told a provider it lacks (`servers.ts:196`). Recommended over a texlab-only capability map, which would repeat `common()`.
- **I3. The heading symbol provider answers nothing while texlab serves the model,** on the precedent of `kit/folding.ts:10-13`. Recommended.
- **I4. texlab's configuration answer.**
  - Recommended: a fixed object for section `texlab`: `chktex.onOpenAndSave` and `onEdit` false, `build.onSave` false, no forward search.
  - The aux and log folders come from `latex.out_dir` and `latex.aux_dir` when they are plain folders; the defaults `%DIR%` and `%OUTDIR%` leave texlab's own defaults.
  - Null would also give the defaults silently, but would not follow a changed out folder.
- **I5. Image preview.** Recommended: the page decorates texlab's File completion items for image files with the picture through `fileBytesUrl` and `pictureFile`. Whether Monaco's suggest details draw an image from that address is not verified; the fallback is D45's content widget.
- **I6. unimath data.** Recommended: LaTeX Workshop's JSON copied into a new `latex_editing` group of `config/catalogs/latex.yml`, with its MIT notice (the D45 precedent at `latex.yml:3-4`), over adding `unicode2latex`.
- **I7. Tests:**
  - a texlab row in G7's `servers.test.ts` table (an argument array, the root as one argument, the configured path as the command);
  - G13 rows for each new key;
  - G36's sentence gains texlab (the orchestrator's text).
  - A new entry for the unimath reader, if one is needed, is Axel's to approve under spec.md's test rule.

## 6. Cases

### Must-pass, from the step text, Z690 and D45 brief rows 129-132

1. Typing `\cite{` in a `.tex` under a root whose `.bib` holds `smith2020` offers `smith2020`. Hovering `\cite{smith2020}` shows the entry.
2. F12 on `\ref{fig:a}` opens the file and line of `\label{fig:a}`, also in a file the main includes.
3. The Files Outline and the breadcrumbs list the file's sections, each once.
4. `\ref{nolabel}` is marked as an undefined label; a `\label` no `\ref` uses is marked unused; `\cite{nokey}` is marked as an undefined citation.
5. In a `.bib` tab, an entry no `\cite` uses is marked unused and a repeated key is marked as a duplicate.
6. On a `\ref` and on a `\usepackage` name, both D45's hover and texlab's appear (Z690 D45-1).
7. Typing in `\includegraphics{` lists picture files with their preview.
8. Typing `\` shows unimath symbols only after the setting is turned on; off by default.
9. Command, environment, package, class, colour and argument completion come from texlab.
10. Restart Language Server and Show Language Server Output for LaTeX work, and the status bar names texlab with its state.

### Implied by the text and the tree, each with its expected result

11. texlab is not installed (this machine today). The status bar says `texlab: not found` and the tooltip names the install command. The build, markers, hovers, Format Document and editing commands of D45 work unchanged. The Outline shows the headings.
12. A root with a `latexmkrc` in a document's folder or above it. Under U3 (a), texlab is not started, so `latexmk -dir-report-only` does not run, until the approval; a changed latexmkrc asks again.
13. A `.bib` tab is sent to texlab as `bibtex`, not parsed as TeX, and keeps D45's Align and Sort.
14. Format Document on a `.tex` runs the formatter `latex.formatter` names, never texlab's latexindent.
15. A build error appears once, under `oculus-latex`, not again under `lsp-latex`.
16. texlab never runs ChkTeX and never starts a build or forward search. Its experimental capabilities are not told to the page.
17. A `.tex` and a `.bib` tab of one root on one page share one texlab (G36). It ends 60 s after the last closes, and at once when the root is no longer served.
18. Go to Definition on `\usepackage{amsmath}` opens the texlive `.sty` as a read-only library tab (D23c).
19. Rename of a label across included files edits open tabs unsaved and writes the others with one History record. A file open on another page refuses the whole edit (Z682 (1) and (2)).
20. A file over `editor.paint_limit_kb` drawn as plaintext is not registered with texlab.
21. A `.tex` at a commit (a version tab) gets texlab's read-only features but none of D45's (`extension.ts:38`).
22. A null or partial configuration answer gives no "configuration is invalid" notice.
23. Go to Type Definition, Show Call Hierarchy and Show Type Hierarchy do not appear for a LaTeX tab (Z691; texlab offers none).
24. Two typed changes in a row: the stale Outline answer of the first is dropped.
25. A `\cite` key used only in a file the page has not opened: no problem row appears, per U10 (a). This is the wrong answer the text could seem to promise; it is decided by U10.

## Declined to judge

- Whether running GPL-3.0 texlab as a separate program puts any obligation on oculus. That is a legal question.
- Whether Monaco draws two document symbol providers' rows twice. I judged it from `folding.ts`'s stated precedent only and did not run it.
- Whether Monaco's suggest details render an image from oculus's file route address. Not run.
- The licence of Günter Milde's upstream `unimathsymbols.txt`. The source URL redirects and CTAN answered 404.
- Whether texlab's ancestor scan stops at the root or goes to `/`. `discover_parents` was read through a summary, not line by line.
- Every texlab behaviour at runtime, since texlab is not installed on this machine.
- Whether D45's latexmk build reading a repository's latexmkrc departs from DESIGN.md:165. Outside D43; noted under U3.
- What D15, D36, D39, D40, D41 and M7 will write. They have no "Paths this step writes" list (D15's brief has none; the others have no brief).
