Survey for D43 (texlab through D23's client). Read-only: I edited no file, ran no git command that changes state, started no server and ran no test. `tools/oculus/config/local.yml` was never opened.

Repository state: `git rev-parse --short HEAD` printed `fb7f076f` at the start and `951b61e3` ("Prepare D23c, library definitions read-only and the symbol selected on open") by the end. `git diff --stat fb7f076f HEAD` lists only scratch files: D23c.md, D23c-brief-check.md, orchestrator-state.md, plan.md (+2 lines) and queue.md. No file under `tools/oculus/src` changed. Every plan line number below is from 951b61e3. `git worktree list` shows D23c at 951b61e3 and PR3 at 272f60b4, both in flight.

Plan reads:
- There is no "Goal" heading in `plan.md`: `grep -niE '^#+ .*goal|^goal|\*\*goal' plan.md orchestrator-state.md` printed nothing. Its opening paragraph (`plan.md:3`) is the closest thing: "Execution ledger for `tools/oculus/DESIGN.md`...".
- D43 (`plan.md:514`): "texlab through D23's language server client for `.tex` and `.bib` files: `\cite` completion and hover from the project's `.bib`, go to a `\label` from its `\ref`, the section outline, undefined and unused labels and citations as problems; texlab's licence and install route checked at /spec (ruling Z347)". It has no sub-bullets.
- Z347 (`plan.md:1108`): "the six suggestions for Files approved, as D39 to D44 (the user)."
- Other lines naming D43, LaTeX or D45: `:517-520` (D45 and its Z671 stop), `:521` (D15), `:583` (D36, ChkTeX), `:947` (Z182), `:1027` (Z260, sticky scroll from LaTeX headings), `:1044` (Z278), `:1045` (Z279), `:1073` (Z299, the line-scan fallback), `:1081` (Z280, a path setting per formatter program), `:1250` (Z487), `:1266` (Z503), `:1432-1434` (Z669, Z670, "D23 lands before Z669"; the last says D43 waits on D23).

## 1. texlab

**Licence: GPL-3.0.**
- `curl -s https://api.github.com/repos/latex-lsp/texlab` prints `license: GPL-3.0`.
- `brew info texlab` prints `License: GPL-3.0-only`.
- The workspace `Cargo.toml` (read through the contents API) has `license = "GPL-3.0"` and `version = "5.26.0"`.
- The README's License section reads "GPL-3.0".
- oculus would run texlab as a separate program over stdio and, on the recommended route, ship no copy of it. That this puts no GPL obligation on oculus is my reading, not a verified legal finding.

**Maintainer.**
- README "Maintainers": Patrick Foerster.
- `contributors?per_page=6`: pfoerster 1565 commits, efoerster 368, then the dependabot bots.
- The owner is the `latex-lsp` organisation. The repository is not archived, has 91 open issues, and was last pushed 2026-10-06T18:50:16Z.
- The last four commits are all on 2026-10-06, by dajiaohuang and pfoerster.

**Latest release.**
- `releases/latest`: `v5.26.0`, published 2026-06-25T19:19:51Z. The ones before it are v5.25.1 (2025-12-30) and v5.25.0 (2025-12-28).

**Install routes for macOS.**
- Homebrew. `HOMEBREW_NO_AUTO_UPDATE=1 brew info texlab` prints `stable 5.26.0 (bottled), HEAD`, `Not installed`, and 2,567 installs in 365 days. `brew info --json=v2` lists the bottle tag `['arm64_sequoia']`, build dependency `rust`, and no runtime dependencies. This machine matches the bottle: `sw_vers -productVersion` prints 15.6.1 and `uname -m` prints arm64.
- GitHub release binaries. The v5.26.0 assets include `texlab-aarch64-macos.tar.gz` (10,154,621 bytes) and `texlab-x86_64-macos.tar.gz` (10,253,264 bytes). Whether they are codesigned or notarized is not verified, since downloading them is outside the allowed network reads.
- cargo. The README says "Avoid installing `texlab` from crates.io because we don't publish new versions of the server to the registry, anymore", and gives `cargo install --git https://github.com/latex-lsp/texlab --locked --tag <insert version here>`. The workspace needs `rust-version = "1.89"`. This machine has `cargo 1.98.1` at `~/.cargo/bin/cargo`. Not run, so the build time is not measured.

**On this machine: not installed.**
- `command -v texlab` exits 1.
- `brew list texlab` prints `Error: No such keg: /opt/homebrew/Cellar/texlab`.
- For comparison: `clangd` is `/usr/bin/clangd`, `tex-fmt` is `/opt/homebrew/bin/tex-fmt`, and `chktex` and `latexmk` are under `/usr/local/texlive/2025/bin/universal-darwin/`.
- The desktop app takes the login shell's PATH (`src/desktop/server/login-env.ts:1-5`), so a Homebrew texlab would be found there too. Not verified at runtime.

**What texlab offers for the step.** Read from source on master; nothing was run, because texlab is not installed.

Its capabilities (`crates/texlab/src/server.rs:135-196`):
- incremental sync, with save notifications that carry no text;
- document links, folding, definition, references, hover, completion (resolve on; trigger characters `\ { } @ / ` and space);
- document and workspace symbols, rename with prepare, document highlight;
- formatting;
- executeCommand: `texlab.cleanAuxiliary`, `cleanArtifacts`, `changeEnvironment`, `findEnvironments`, `showDependencyGraph`, `cancelBuild`;
- inlay hints;
- experimental `textDocumentBuild` and `textDocumentForwardSearch`.

The four features the step names:
- **`\cite` completion and hover from `.bib`:** `crates/completion/src/providers/citations.rs` and `crates/hover/src/citation.rs`.
- **Go to `\label` from `\ref`:** `crates/definition/src/label.rs`.
- **Document symbols:** `crates/symbols/src/types.rs:7-21` lists Section, Figure, Algorithm, Table, Listing, Enumeration, EnumerationItem, Theorem, Equation, BibTeX Entry, Field, Environment, CommandDefinition and BeamerFrame.
- **Diagnostics** (codes from `crates/texlab/src/util/to_proto.rs:84-110`):
  - UnusedLabel 9, UndefinedLabel 10, UndefinedCitation 11, DuplicateLabel 14;
  - UnusedEntry 12 (a `.bib` entry no `\cite` uses), DuplicateEntry 13;
  - syntax errors 1 to 8.
  - These carry `source: "texlab"`. Build-log errors carry `source: "latex"`, and ChkTeX results `source: "ChkTeX"`.

The other completion and hover kinds D45 expects from D43 (`D45.md:114-116`):
- completion providers: `argument`, `color`, `color_model`, `command`, `entry_type`, `environment`, `field`, `glossary`, `import`, `include`, `label_def`, `label_ref`, `tikz_library`;
- hover providers: `citation`, `command`, `entry_type`, `field_type`, `label`, `package`, `string_ref`.

Behaviours of texlab that bear on the brief:
- **A `.bib` opened as `latex` is read as TeX.** `server.rs:388` is `Language::from_id(language_id).unwrap_or(Language::Tex)`. `crates/distro/src/language.rs:41-48` maps `"tex" | "latex"` to Tex and `"bib" | "bibtex"` to Bib. oculus maps `.bib` to `latex` (`config/sources.yml:110`) and sends the model's language as `languageId` (`kit/lsp/transport.ts:341`). So an open `.bib` tab would be parsed as TeX.
- **A null configuration answer raises a warning.** texlab asks `workspace/configuration` for the section `texlab` (`server.rs:297-320`). On a null answer, `client.rs:96-115` sends "The texlab configuration is invalid; using the default settings instead." and uses the defaults.
- **Defaults** (`server/options.rs`, every struct `#[serde(default)]`): `chktex.onOpenAndSave` and `onEdit` false; `build.onSave` false.
- **Build-log errors are reported on its own.** texlab reads the `.log` of a root document it knows and publishes the errors (`crates/diagnostics/src/build_log.rs:11-50`), with source `latex`.
- **It watches files itself.** It uses its own notify watcher (`server.rs:1241`) and finds files by `read_dir` of the folders of known documents (`crates/base-db/src/deps/discover.rs:48-70`). Not verified at runtime.

## 2. D23's client as landed

**How a server is declared.** `src/lib/server/machine/lsp/servers.ts` (319 lines):
- Head comment `:1-14`. `:6` says "a new server is one entry here and nothing else", which the tree does not bear out (below).
- `ServerId = 'pyright' | 'clangd'` at `:36`; `ServerEntry` at `:91-107`.
- `createServers` at `:260-271` builds `[pyright(options), clangd()]`, and `forLanguage` (`:264`) picks the entry by Monaco language.

**pyright, found from oculus's own folder** (`servers.ts:171-209`):
- Its entry is `join(options.oculus, 'node_modules', 'pyright', 'langserver.index.js')`, run with `options.node`.
- `launch` returns null when that file is missing (`:179-187`). `ownFolder()` is at `:163-169`.
- Its configuration answers the `python` section (`:191-194`).

**clangd, found on PATH** (`:211-255`):
- The command is `'clangd'`, and `launch` never returns null.
- Its `configuration` returns null (`:230`).
- `initializeParams` has a clangd-only branch (`:287-289`) and deletes `textDocument.diagnostic` (`:286`), so servers push diagnostics.

**Adapters live outside `servers.ts`.** `pyright/adapter.ts` (92 lines) and `clangd/adapter.ts` (75 lines) are joined in `relay.ts:85`: `const ADAPTERS: Record<ServerId, Adapter> = { pyright: pyrightAdapter, clangd: clangdAdapter };`. `relay.ts` is 869 of 880 lines.

**How a missing server is reported:**
- `pyright/adapter.ts:36-45` and `clangd/adapter.ts:33-42` answer `not_found` when `launch` is null. For clangd that never happens; its `not_found` comes from the spawn: `process.ts:195-199` (`error.code === 'ENOENT' ? 'not_found' : 'exited'`).
- `held.ts:436-443` sets the state.
- The page drops the root's entries (`kit/lsp/client.ts:357-363`).
- The status bar (`shell/status/LanguageItems.svelte:61-62`, `:80-81`) says `statusbar.ls_not_found` "'{0}: not found'" and the tooltip `ls_tip_not_found` "'{0} was not found for {1}. Install it, then restart the language server.'" (`config/text/statusbar.yml:82`, `:89`). No install command is named.
- The one sentence in the tree that does name an install command: `config/text/views/academic/latex.yml:48` "tex-fmt was not found. Install it with brew install tex-fmt, or name it in latex.tex_fmt_path."

**Which file types route to which server:**
- `config/sources.yml` `languages:` maps endings to a language. `:110` is `latex: [.tex, .latex, .bib, .sty, .cls]`.
- `kit/grammars.ts:37` maps `latex` to Shiki `latex`, so the model's language is `latex`. There is no `bibtex` entry in `SHIKI_IDS` (`:21-53`).
- The page opens channel `lsp:<language>` (`server/machine/lsp/wire.ts:16-24`), and the relay looks the language up with `forLanguage`.
- One server runs per page, root and registry entry, shared by that entry's languages (`relay.ts:6-8`, `DESIGN.md:571`).

**The page side's language registration:**
- `ui/controls/editor/kit/lsp/hosts.ts:20` `SERVED_LANGUAGES = ['python', 'c', 'cpp']`, checked at `:143`; head comment `:9-10`.
- `views/sources/source/language/lsp.ts:27`, `:105-107`, `:284`, `:318`, `:324`.

**What adding texlab for `.tex` and `.bib` needs, file by file:**
1. `server/machine/lsp/servers.ts`:
   - `'texlab'` in `ServerId`, and a texlab entry.
   - Its `configuration` answers the `texlab` section with an object, not null (section 1).
   - Its capabilities leave out `documentFormattingProvider`, because D14's `latex.formatter` keeps Format Document.
   - The head comment `:6-11` is rewritten.
2. A texlab adapter. `server/machine/lsp/` already holds 10 items, so it cannot be a new `texlab/` folder without a split (section 4).
3. `relay.ts:85` `ADAPTERS` and its import (869 of 880 lines). Also wherever a filter of texlab's `source: "latex"` build diagnostics is placed, if that is chosen (section 5, C4). Notifications reach the page at `relay.ts:805`.
4. `kit/lsp/hosts.ts:20`, and its head comment.
5. `views/sources/source/language/lsp.ts`. Every server branch there is a two-way Python-or-clangd choice:
   - `labels` at `:95-102` (`python ? ... : clangd`);
   - the output tab name at `:343` (`python ? 'pyright' : 'clangd'`);
   - Select Interpreter or Select Compile Database at `:347-357`;
   - the clangd actions while `!python && answering` at `:359`.
   - As written, a LaTeX tab would get clangd's words and actions.
6. `views/sources/source/language/extension.ts:25-29`. `languageExtension` returns only `served` when a server serves the language. Once `latex` is served, a LaTeX tab loses `latexEditor`: build markers, the math and picture preview, Format Document through `latex.formatter`, and the heading symbols for sticky scroll. Both have to be combined.
7. `views/sources/source/language/latex-editor.ts:58`. Its `symbolsExtension` heading provider (`symbols.ts:81`) and texlab's document symbol provider would both be registered for `latex`. Monaco merging them into duplicate breadcrumb and sticky-scroll entries is my reading and is not verified.
8. `views/sources/files/sections/Outline.svelte`. The latexReader effect is `:93-109`; `served` is `:112`; `:178` is `if (served !== null) return symbols;`. Once a tab is registered, `served` is `'loading'` and then the symbols or `'none'` (`kit/lsp/client.ts:230`, `:255`, `:496`). So with texlab not found, the Outline would draw "No symbols" instead of the 42 headings D23's look counted. A fallback is needed.
9. `shell/status/LanguageItems.svelte`. The server name is `:41` (`python ? server_pyright : server_clangd`); the interpreter item `:148`; the compile-database item `:159` (`{#if !python && shown('compile_database')}`). A LaTeX tab would show "clangd" and "No compile database".
10. `kit/lsp/client.ts:204` turns on `formatOnType` for every non-Python language. `client.ts` is 529 lines.
11. Catalogs:
    - `config/text/statusbar.yml:76-77`: `server_texlab`, and `language_bibtex` if C5 (a) is chosen;
    - `config/text/views/sources/source.yml:12-25`: the texlab restart and output command words.
12. If `.bib` gets its own language (C5): `config/sources.yml:110` and `kit/grammars.ts:21-53`. `ls node_modules/@shikijs/langs/dist` lists `bibtex.mjs`.
13. A path key, if chosen (C2):
    - `config/behavior.yml:128-136`, the LaTeX block; `latex:` is at `:131`;
    - `config/catalogs/options.yml` around `:527-561`;
    - `data/sources/config/settings.ts`, near `latexFormatting` `:478` and `latexAutoBuild` `:497`, exported at `:523-524`;
    - the G13 case in `tests/data/sources/config/settings.test.ts`.
14. Documents:
    - `DESIGN.md:23` ("a language server client (pyright for Python, clangd for C and C++)");
    - `DESIGN.md:568` (the status bar shows "the Python interpreter or the compile database");
    - `DESIGN.md:571-572`;
    - `docs/files-and-search.md:71`;
    - `README.md:5`, the install line.
15. Tests: `tests/server/machine/lsp/servers.test.ts` (125 lines, describe 'starting a server', a table of rows) and `lifetime.test.ts` (490 lines). The stub server is `lsp-fixture.ts`.

## 3. LaTeX today

**Files Outline of a `.tex` file:**
- `Outline.svelte:93-131` asks `outlineFollower` (`state/sources/explorer/sections/outline.ts:122-142`) over the client's `latexReader`. That reader is latex-utensils loaded lazily (`:93-95`).
- When the parser cannot load, `latexOutline` falls back to `scanSections` (`:110-116`). When the parser refuses a file, `readTex`'s line scan supplies the headings (Z299).
- D23's look item 13 (`agents/reviews/D23-landing.md:49`): "a `.tex` file (42, the file's 42 sectioning commands)".

**Sticky scroll and breadcrumbs:** `language/latex-editor.ts:58` wraps `latexOutline` in `symbolsExtension` (`language/symbols.ts:77-104`, `displayName: 'headings'`).

**D14's LaTeX view:**
- `views/academic/latex/Latex.svelte` (70 lines; `id: 'latex'`, `listed: false`).
- `views/shared/latex/`: `Main.svelte` 212, `Outline.svelte` 91, `Problems.svelte` 72, `Rows.svelte` 47, `places.ts` 46.
- The section outline across includes is `server/content/latex/outline.ts` (86 lines), served by `/api/latex` with `&outline=`.
- The project tab draws the same rows through `views/boards/project/Latex.svelte`.
- Build markers: `kit/latex/latex-widget.ts:208` (owner `oculus-latex`, source `latex`).

**D45's plan (`agents/briefs/D45.md`):**
- The TeX view's Structure section: sections, `\label`s, and floats with numbers and captions from the `.aux` (item 18, `:198`). It replaces `shared/latex/Outline.svelte` (`:154`).
- The Files Outline and sticky scroll are kept (`:163`).
- A new `server/content/latex/bib.ts` for the Citation Browser, using latex-utensils' `bibtexParser` (item 26, `:209`, `:311`).
- Item 22 (`:202`): hover and completion kinds texlab does not give are built in D45.
- `:114-117` assign texlab hover (`\ref` with number, `\cite`, command signature), completion of commands, environments, packages, classes, paths, labels, citations and colours, argument hints, and undefined and unused labels and citations to D43.
- `:130`: "The orchestrator carries the other texlab rows into D43's brief at its `/spec`". So D43's scope is wider than its plan line, by D45's brief.

**Where texlab's outline replaces or joins:**
- Replaces, while texlab answers: the latexReader rows in the Files Outline, and the heading provider for sticky scroll and breadcrumbs. The latexReader stays as the fallback while texlab is not found, failed or loading.
- Joins: D45's Structure. That follows includes and `.aux` numbers, and texlab's document symbols are per file, so it does not replace it.
- Overlaps: texlab's build-log diagnostics (`source: latex`) duplicate D14's markers and D45's item 21 problems. The `.bib` read happens twice (texlab, and D45's `bib.ts`), which bears on the "a parser exists once" rule.

**Overlap with D45's brief paths** (`D45.md:306-348`):
- `views/sources/source/`: `latex-editor.ts` moves into `source/latex/`, and `Source.svelte`. D43 needs `language/extension.ts`, `latex-editor.ts` and `lsp.ts`, and `tab-language.svelte.ts:12` imports `latexEditor`.
- `ui/controls/editor/kit/latex/`.
- `config/sources.yml`, the `latex` languages line: D45 names `:106` at f073b0494; it is `:110` now.
- `config/behavior.yml`, the LaTeX block.
- `config/catalogs/options.yml`, the `latex.*` entries.
- `data/sources/config/settings.ts`, the LaTeX readers.
- `config/text/statusbar.yml`.
- `DESIGN.md`, and `tests/data/sources/config/settings.test.ts`.
- `data/prose/latex.ts`, if D43 touches it.

## 4. Folder counts and file sizes

**Folder item counts.** Taken with `git ls-files <dir> | cut -d/ -f1 | sort -u | wc -l`; the limit is 10.

| Folder | Items |
|---|---|
| `server/machine/lsp` | **10** |
| `lsp/clangd` | 3 |
| `lsp/pyright` | 2 |
| `ui/controls/editor/kit/lsp` | 9 |
| `ui/controls/editor/kit` | **10** |
| `kit/latex` | 2 |
| `views/sources/source` | 8 |
| `source/language` | 5 |
| `shell/status` | 9 |
| `state/system/machine/lsp` | 7 |
| `state/sources/explorer/sections` | 8 |
| `views/sources/files/sections` | 9 |
| `data/sources/config` | **10** |
| `data/model` | **10** |
| `tests/server/machine/lsp` | 7 |
| `config/text/views/sources` | **10** |
| `config/catalogs` | 8 |
| `tests/data/sources/config` | 6 |
| `server/content/latex` | 5 |
| `views/shared/latex` | 5 |

**File sizes** (`wc -l`):
- Over the 880 line on main already: **`kit/lsp/transport.ts` is 897 lines**. The size check refuses 900. Any step that edits it must split it.
- Near the line:
  - `relay.ts` 869;
  - `Source.svelte` 520, which is the component limit;
  - `held.ts` 587;
  - `settings.ts` 541;
  - `client.ts` 529;
  - `lsp.ts` 445;
  - `servers.ts` 319.
- Everything else D43 would touch is under 320 lines:
  - `Outline.svelte` 242, `LanguageItems.svelte` 171, `hosts.ts` 168, `outline.ts` 152;
  - `symbols.ts` 105, `grammars.ts` 92, `latex-editor.ts` 65, `extension.ts` 30.

**Guarded entries covering these files:**
- `grep -n -iE 'G36|lsp|language server|relay' agents/guarded.md` prints nothing. No entry names the relay or the language server code.
- **G36 was never written into `guarded.md`.** It was ruled by Z485 (`plan.md:1249`, "written into `agents/guarded.md` at D23's landing") with Z499's wording (`plan.md:1262`): "one pyright serves a page's Python tabs of a root, and one clangd its C and C++ tabs". Yet `git log --all --oneline -S'G36' -- .../guarded.md` prints nothing, and D23's landing commit 797e1e5d does not touch `guarded.md`.
  - So `lifetime.test.ts` and `servers.test.ts` are attached to no entry, which `spec.md:57` does not allow.
  - Z499's wording would need a texlab clause.
  - This finding is outside the D43 survey and is for the orchestrator.
- The entries that do apply:
  - G13 covers a new setting reader (`tests/data/sources/config/settings.test.ts`, one case per reader).
  - G12 and G24 cover new config and catalog keys.
  - G20 is the size check.
  - G7 asks for argument arrays, but its Code line names commands, hpc and open, not lsp.

## 5. User-visible choices no ruling settles

**C1. The install route oculus documents or runs.**
- (a) **Recommended.** texlab found on PATH, or at a path key (C2). The not-found tooltip names the install command, as `latex.yml:48` does for tex-fmt, and `README.md:5` says `brew install texlab`.
  - Pros: one command; the bottle matches this machine; `brew upgrade` keeps it current; oculus redistributes no GPL binary; it matches the tex-fmt precedent of Z280.
  - Cons: the version is not pinned.
- (b) A script fetches a pinned release tarball into oculus's own folder, as pyright sits in `node_modules`.
  - Pros: a pinned version, and it works without Homebrew.
  - Cons: a new script needs Axel's approval (scripts rule); a network fetch at install; notarization is not verified.
- (c) `cargo install --git ... --tag v5.26.0`.
  - Pros: pinned, built from source.
  - Cons: needs Rust 1.89 or later; the build time is not measured.
- (d) oculus runs `brew install` itself. It clashes with `DESIGN.md:165`'s processes rule and is not proposed.
- **Lazy option:** keep the generic "Install it, then restart the language server." (`statusbar.yml:89`) and document nothing.

**C2. A config key for texlab's path.**
- (a) **Recommended.** `latex.texlab_path` in `behavior.yml`, beside `tex_fmt_path`, with its catalog entry and G13 reader. This follows Z280's "a path setting per program". It shares lines with D45.
- (b) PATH only, as clangd. **Lazy option:** a texlab outside PATH then cannot be used.
- (c) A key in `local.yml`. A program path is machine-local, but Z280's precedent placed formatter paths in `behavior.yml`.

**C3. texlab's own settings, the answer to `workspace/configuration`.**
- (a) **Recommended.** oculus answers the `texlab` section with a fixed object: build on save off, no forward search, ChkTeX off (D36 owns ChkTeX by Z196). No reader-visible texlab settings.
- (b) `latex.texlab.*` keys exposed to the reader. This duplicates D36's and D45's settings.
- (c) Answer null, as the registry does for every other section today. **Lazy option:** texlab shows its "configuration is invalid" warning.

**C4. texlab's build, forward search and build diagnostics, given D45 owns the build (Z487, Z503) and SyncTeX (Z541, Z671).**
- (a) **Recommended.**
  - texlab's build, forward search and clean commands are not used, and its experimental capabilities are not told to the page.
  - Its `source: "latex"` diagnostics are dropped, so the build's problems come from D14 and D45's one log reader, which carries bad boxes and the "No pages of output." line.
  - texlab's `texlab` and `ChkTeX` diagnostics pass.
- (b) Keep both. Each build error then shows twice, in the editor and in D33's Problems. **Lazy option.**
- (c) Use texlab's build-log diagnostics instead of D14's. This drops what D45 item 21 adds.

**C5. The language of `.bib` files.**
- (a) **Recommended.** A `bibtex` language: `bibtex: [.bib]` in `sources.yml`, with `.bib` taken out of `latex`; Shiki's `bibtex` grammar; status bar word "BibTeX"; texlab serving `['latex', 'bibtex']`.
  - D45 item 26's ".bib tab" commands would key on `bibtex`.
  - That VS Code itself uses the language id `bibtex` is not verified.
- (b) Keep `latex` and send `languageId: 'bibtex'` for a `.bib` path. No visible change, but a special case by file extension, in `transport.ts`, which is 897 lines.
- (c) Do not serve `.bib`. **Lazy option:** it drops unused-entry and duplicate-entry problems, and `.bib` would still have to leave the `latex` channel, or texlab reads it as TeX.

**C6. Which texlab features D43 turns on.**
- (a) **Recommended.** Everything texlab gives except formatting and build: the plan's four, plus D45's `:114-117` rows, references, document highlight, folding, document links, inlay hints (label numbers) and workspace symbols.
  - Rename is D23b's.
  - A rename or code action across files is refused by `DESIGN.md:572`.
- (b) Only the plan line's four. **Lazy option:** D45 item 22 would rebuild what texlab gives.

**C7. The Outline while texlab is missing, failed or loading.**
- (a) **Recommended.** The latexReader headings until texlab answers.
- (b) "No symbols". **Lazy option:** a regression from D23's look item 13.

**C8. What the Outline lists once texlab answers.**
- (a) **Recommended.** texlab's full symbol tree (sections, figures, tables, equations, theorems, enumerations), as VS Code with texlab shows it.
- (b) Sections only, filtered on the page to match the latexReader. **Lazy option.**

**C9. Names of the status item and palette actions.**
- (a) "texlab" on the status item, and "LaTeX: Restart Language Server" and "LaTeX: Show Language Server Output", after "Python: ..." (`source.yml:23-25`).
- (b) "texlab: ...", after "clangd: ..." (`source.yml:12-17`).
- **Recommended:** read the VS Code texlab extension's command titles at /spec and use them. They are not verified here.
- **Lazy option:** reuse clangd's words.

## 6. Shared paths with PR3, D23c and D45

**D23c** (committed in 951b61e3, worktree in flight). Its write list (`D23c.md`, "Paths this step writes"):
- `server/machine/lsp/` "(the folder, a new subfolder included)". D43 needs `servers.ts`, `relay.ts:85` and an adapter. The folder is at 10 items and both steps want a new item in it. `relay.ts` is at 869 lines.
- `ui/controls/editor/kit/lsp/` (`hosts.ts`; `transport.ts` at 897 if touched).
- `views/sources/source/`, the whole folder: `language/lsp.ts`, `extension.ts`, `latex-editor.ts`.
- `views/sources/files/sections/Outline.svelte`: D23c passes the range and column; D43 changes the LaTeX and served branch at `:93-178`.
- `state/system/machine/lsp/symbols.ts` and `lsp.svelte.ts`.
- `config/text/views/sources/source.yml`.
- `tests/server/machine/lsp/`.
- `DESIGN.md` 123, 510, 522, 571-572, and `docs/files-and-search.md` 69-72.
- D23c's case 17 ("a LaTeX section: the caret goes to the line, as now") stops holding once D43 makes LaTeX rows server symbols.
- D43 is simpler to build after D23c lands.

**D45** (stopped on Z671, not built), as in section 3:
- `views/sources/source/` (`latex-editor.ts` moved, `Source.svelte`) and `kit/latex/`;
- `config/sources.yml` (the `latex` line), the `behavior.yml` LaTeX block, `options.yml` `latex.*`, and the LaTeX readers in `settings.ts`;
- `config/text/statusbar.yml`, `DESIGN.md`, `HELP.md`, and `tests/data/sources/config/settings.test.ts`;
- `data/prose/latex.ts` and `server/content/latex/`, only if D43 touches them.
- D45's item 22 depends on D43's final capability list, so D43's brief should fix that list before D45 is prepared.

**PR3** (in flight at 272f60b4). Its write list (`PR3.md:207-232`):
- `state/workbench/palette.ts`: shared only if D43 adds a palette mode; `palette.ts:276` and `:296` gate by language already;
- `DESIGN.md` and `docs/files-and-search.md`: both write the Language servers passage, `:69-72`, if D43 updates it;
- `config/text/`: the files named in PR3's part 9;
- `tests/`;
- `agents/guarded.md`: the G2, G8, G9, G32 and G49 lines. D43 would write G36's line only if the orchestrator first adds G36.
- No source file under `server/machine/lsp`, `kit/lsp` or `views/sources/source` is in PR3's list.

Agent usage: ad765bd6f6ff2b7ca, claude-opus-5-5, 265,235 tokens, 88 tool uses, 11.3 min.
