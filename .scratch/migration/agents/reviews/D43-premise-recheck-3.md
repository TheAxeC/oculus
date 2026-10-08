# D43 premise recheck on main at 7c5514850

Read-only. I edited no file, ran only read-only git commands, started no server, page, agent or skill, and installed nothing. I never opened local.yml, `secrets` or `~/.oculus`. Network reads: `brew info texlab`, `npm view texlab`, and curl to api.github.com for texlab's release and licence. I fetched no texlab source, so every statement below about texlab's internals comes from recheck 1 or recheck 2 and is marked "not re-read".

Before the sections, three corrections that bear on the brief:

- **The size line is 880, not 1000.** spec.md:45 keeps a source file at or under 880 lines and a component at or under 520. `tests/checks/tree/size.test.ts:28-29` refuses 900 and 540. `utils/size-allow.txt` is empty.
- **Z703 U2's split of `server/root/context.ts` is no longer needed.** The file is 803 lines (`wc -l`), down from 879. D11 (c88b76443) moved the ServerContext type into `process/server-context.ts`. The `latex.texlab_path` key can be added in place.
- **D33 is in flight and shares D43's files.** It is on repair round 1 (orchestrator-state.md:27-44). Its write list (`agents/briefs/D33.md:149-210`) includes `extension.ts`, `client.ts`, `lsp.ts`, `hosts.ts`, `services.ts`, `documents.svelte.ts`, `statusbar.yml`, `views/academic/latex.yml` and `Latex.svelte` (it deletes the TeX view's `Problems.svelte`), plus `DESIGN.md:569`, `docs/files-and-search.md:85` and `docs/views.md:265`. D43 is prepared after D33 lands, or these paths go in its `shared_paths:`.

## 0. Main's head and what landed since 8bd2070c that touches D43

`git rev-parse HEAD` printed 7c5514850e3f557efce08b626cbbfd6bbd1b70f3. `git log --oneline 8bd2070c..HEAD | wc -l` printed 43. The source-touching commits are these (`git log --format=%h 8bd2070c..HEAD -- src config tests docs ...`):

- **7c5514850, M8.** Added yaml-language-server as an entry: `servers.ts` yaml() :525-575, `lsp-servers.ts` :149-166, `adapters/yaml/`. Moved every adapter under `server/machine/lsp/adapters/`. Added the entry hooks `requests`, `registrations` and `refuses` (`servers.ts:153-162`), the relay's schema feed (`relay.ts:117-121`, :157-179), and `prepareBare` and `NO_CHOICE` in `choices.ts:233`, :252. Added page-side `isMachineFile` (`lsp.ts:128`, :381, :424), which names `language === 'yaml'`. Added `server_yaml` (`statusbar.yml:92`), `cmd_yaml_*` (`source.yml:37-38`), and a strict whole-file shape for `catalogs/latex.yml` (`data/shapes/catalog-files.ts:196-208`, :327-333). Renamed every `description:` in `options.yml` to `help:` (`grep -c "description:"` 0, `grep -c "  help:"` 224). Brought G7, G36 and G55 to the new paths and added G63.
- **3bf3bf4c6, D28.** The ServerContext config cache (`process/config-cache.ts`, G61 at guarded.md:155-157). `context.ts` changed by 27 lines. `behavior.yml`'s editor block. `options.yml` +33.
- **1ae5e7c8d, X3e.** `Outline.svelte` (+23, now 272 lines), `lsp-servers.ts` (`LSP_CHOICES` lost `hint`), `settings.ts` +49, `context.ts`, `sources.yml` +2 (the latex line moved to :112).
- **c88b76443, D11.** `context.ts` -136 / `process/server-context.ts` +135, which is the split U2 asked for. `approvals.ts` (the debug launch key). `extension.ts` (rite's hover composed beside a server's, :44-46). `tab-language.svelte.ts`, `status-items.ts`, `StatusBar.svelte`.
- **d098915b5, D11's look fixes.** `StatusBar.svelte` only.
- **D15 (a84214dad, 0d440a6ef, d5d7f727b).** DESIGN.md and views.md lines only; nothing D43 writes.

## 1. How a language server is added now, place by place, with M8's YAML server as the example

1. **`src/lib/server/machine/lsp/servers.ts` (642 lines).**
   - Import the adapter (:30-36).
   - Write one entry function. yaml() is :544-575, with its settings constant at :526-536. It holds `launch`, `initializationOptions`, `configuration`, `capabilities`, `commands` and the optional hooks.
   - Add the entry to `createServers` (:578-595, entries :579-585).
   - Rewrite the head comment's count and list (:10-20, "There are five entries").
   - YAML wrote its own capability map (:563-572) instead of `common()` (:213-228). `common()` always adds `typeDefinitionProvider` (:219), which texlab lacks, so the YAML entry is the precedent for a map of the entry's own.
2. **`src/lib/data/prose/lsp-servers.ts` (225 lines).**
   - The `LspServerId` union (:16).
   - One `LspServerFacts` entry (:149-166): languages, program, `words` (name, restart, output, choice), semanticTokens, formatOnType, organizeImports, choices, interpreterLibrary, extras, approvedBy.
   - `LspServerWords` (:25-34) has no install field, so Z703 U1's `words.install` is new here.
3. **The adapter folder.** It is `src/lib/server/machine/lsp/adapters/<id>/`; `adapters/` holds 4 items and `server/machine/lsp` holds 9. The YAML adapter (`adapters/yaml/adapter.ts`, 15 lines) is `prepareBare` + `NO_CHOICE` + `NO_APPROVAL` from `choices.ts:233-270`. `prepareBare`'s not-found note says "under the oculus folder" (:248), which is wrong for a PATH program such as texlab. clangd's PATH launch is never null, and its ENOENT becomes `not_found` at `held/process.ts:205`.
4. **The relay.** It has no per-server edit; M8 extended it generically.
   - The adapter is called at `relay.ts:669`.
   - Capabilities are answered at :439.
   - `refuses` is applied at :591.
   - `requests` and `registrations` are consumed at `held.ts:371` and :491.
   - The relay is built in `context.ts:247-259`, and `RelayOptions.servers` (`relay.ts:121-122`, used at :151-152) lets `context.ts` pass a registry built with its own readers.
5. **Status and language items.** `LanguageItems.svelte` (200 lines) reads the facts (:43-46). A server adds only its name word, as `server_yaml` at `statusbar.yml:92`. Not-found tip: `LanguageItems.svelte:87`, `statusbar.yml:104`.
6. **Palette words.** `source.yml` gets `cmd_<x>_output` and `cmd_<x>_restart` in key order (YAML at :37-38), and the facts point at them (`lsp-servers.ts:155-156`).
7. **`options.yml`.** M8 added no server option. A path key goes beside the LaTeX path keys (section 3, U2).
8. **The page.** Nothing per server except M8's YAML-only `isMachineFile` (`lsp.ts:128-136`), a language named in page code that DESIGN.md:573 says nothing else names. texlab needs no such branch.
9. **Tests.**
   - A row in G7's `servers.test.ts` 'starts each server and the interpreter probe with an argument array...': the sorted command list grows by one.
   - A row in G36's `lifetime.test.ts` table: M8's 'is one YAML server for a yml tab and a yaml tab of one root on one page, which ends 60 s after the last closed'.
   - The guarded.md sentences of G7, G36 and G55 are the orchestrator's.

## 2. Every premise of recheck 2

**Plan and rulings** (`grep -n` over plan.md; HEAD and the working copy agree on these lines):

- **D43's line: moved.** It is now :535, word for word, with two sub-bullets at :536-537.
- **Rulings: moved.** Z347 :1153, Z682 :1489, Z683 :1490, Z690 :1497, Z691 :1498, Z703 :1510.
- **Z690 D45-2 is not built: holds.** `grep -rn -i "unimath\|texlab" src config tests HELP.md DESIGN.md docs README.md` prints only `LatexLabel` at `latex-state.ts:80` and :98.
- **Z683 (3) composition: holds, moved** to `extension.ts:44-46`. D11 added rite's composition beside it.
- **Z682 (8), one entry plus one adapter: holds.** `servers.ts:6-8` now says the adapter is "written in a folder of its own under adapters/".

**The plan bullet's constructs:**

- **`servers.ts`: moved.** `createServers` is :578-595 with five entries. `ServerId` is :65. The file is 642 lines (was 556).
- **`lsp-servers.ts`: moved.** `LSP_SERVERS` is :76-167 and `LspServerId` :16 (five ids). The file is 225 lines (was 209).
- **"relay.ts's adapters" is false: holds.** `grep -n ADAPTERS relay.ts` prints nothing. relay.ts is 864 lines (was 839).
- **"two-way branches" is false: holds.** The one exception is M8's YAML-only `isMachineFile` (`lsp.ts:128`). `lsp.ts` is 563 lines.
- **`latex-editor.ts` not moved: holds.** It is 125 lines. `source/latex/` holds 3 items and `latex-tab.svelte.ts` is 460 lines.
- **`tab-language.svelte.ts`: moved.** `languageExtension` is imported at :15 and `latexEditor` at :16; the call is at :57.
- **LaTeX config blocks: moved.**
  - `behavior.yml`: `latex:` at :139 (was :135), the block running to :175, `# === Writes` at :178.
  - `options.yml`: the `latex.*` entries are :560-680 (was :527-646); the file is 1332 lines, with 0 `description:` and 224 `help:`.
  - `settings.ts`: 803 lines (was 770); `latexFormatting` :526, `LatexBuilding` :562-576, `latexBuild` :732, `synctexPath` :750.

**texlab:**

- **Licence and release: hold.** The API printed `GPL-3.0 False 2026-10-06T18:50:16Z 91` and `v5.26.0 2026-06-25T19:19:51Z`, with assets `texlab-aarch64-macos.tar.gz 10154621` and `texlab-x86_64-macos.tar.gz 10253264`.
- **Homebrew: holds.** It prints `stable 5.26.0 (bottled)`, `Not installed`, `License: GPL-3.0-only`, 2,567 installs in 365 days. The JSON gives bottle `['arm64_sequoia']`, build dependency `['rust']`, runtime dependencies `[]`. This machine is `15.6.1` on `arm64`.
- **`which texlab`** prints "texlab not found" and exits 1.
- **The programs texlab calls are present.** `command -v latexmk latex kpsewhich` prints all three under `/usr/local/texlive/2025/bin/universal-darwin/`.
- **No npm route: holds.** `npm view texlab version` gives E404.
- **Not re-read** (no source fetch): the capabilities, the null-configuration answer, texlab's latexmkrc run, its own file watcher, and how far up its ancestor scan goes.
- **latexmkrc files.** `find` over research-hub (secrets pruned), cathedra, game-engine, ordo, scotoma, officium and youtube-downloader for `latexmkrc` or `.latexmkrc` printed nothing. `ls ~/.latexmkrc ~/.config/latexmk/latexmkrc` found neither.

**`.bib` as `latex`: holds, moved.** `transport.ts:256` `languageId: doc.language` and :234 `model.getLanguageId()` hold. `sources.yml:112` (was :110) is `latex: [.tex, .latex, .bib, .sty, .cls, .rnw, .jnw, .pnw]`. `SHIKI_IDS` :21-53 has no `bibtex`, and `node_modules/@shikijs/langs/dist` holds `bibtex.mjs`.

**The client as landed:**

- **Configuration answer: moved** to `held.ts:344`.
- **Server notifications: moved.** They are `relay.ts:785-821`: the method filter is :788-789 and the drop for a document not open is :801 (was :776).
- **Capabilities told to the page: moved** to `relay.ts:439`.
- **A missing program: moved.** ENOENT is at `held/process.ts:205` (was :199) and `notFound` at `choices.ts:218` (was :206). `NO_APPROVAL` is at :266 (was :220), now beside `prepareBare` :233 and `NO_CHOICE` :252.
- **Status words: moved.** `server_*` are :88-92 (was :85-88). `ls_tip_not_found` is :104 (was :100). `language_latex` is :141 (was :137). `language_bibtex` does not exist: holds.
- **LaTeX install sentences: hold** at `latex.yml:130` and :139.
- **Palette words: moved.** `cmd_svelte_*` are at `source.yml:32-33`, `cmd_typescript_*` at :35-36 and `cmd_yaml_*` at :37-38. A `cmd_latex_*` key sorts between :20 and :21.
- **`Outline.svelte`: changed by X3e**, now 272 lines. The LaTeX effect is :108-116, `served` :122, the loading text :165, and `if (served !== null) return symbols;` :193.
- **`client.ts`: holds.** It is 640 lines; `'none'` is at :283 and :604, `'loading'` at :308, and the not_found clear at :421-426. On not_found, `#forget` (:497-507) clears diagnostics only, so the symbol state stays `'loading'`. This is by reading, not run.
- **`latex-editor.ts:108`, `symbols.ts:84` and `folding.ts:10-13`: hold.**
- **Build markers: hold.** `latex-widget.ts:54` is `OWNER = 'oculus-latex'` and :78 is `source: 'latex'`. Format Document is now `kit.formatting.add` at :290. The client's `#format` unsupported answer is at `client.ts:611-614`.
- **DESIGN.md: moved.**
  - :23 names five servers, YAML included.
  - The LaTeX builds sentence is :535; the reading sentence ("the server and the Files Outline both call") is now :537.
  - The status bar line "the Python interpreter or the compile database" is now :570.
  - The servers paragraph is :573.
  - The processes rule is :166.
- **`docs/files-and-search.md:71`: moved** to :85.
- **README.md has no install line: holds.** `grep -n -i "brew\|clangd" README.md` prints nothing.
- **guarded.md: moved and extended.**
  - G7 :25-27. G36 :65-67, which now names five servers, yaml-language-server among them. G55 :37-39. G12 :140-142. G13 :143-145. G61 :155-157. G63 :131-133. G20 :179. G24 :183.
- **Tests: changed.** `tests/server/machine/lsp` holds 10 items (was 9), so a new test file there needs the folder regrouped. `servers.test.ts` is 158 lines.

**Sizes** (`wc -l`): `transport.ts` 871, `relay.ts` 864, `context.ts` 803, `settings.ts` 803, `held.ts` 667, `servers.ts` 642, `client.ts` 640, `builds.ts` 637, `model-machine.ts` 608, `lsp.ts` 563, `latex.svelte.ts` 554, `routes.ts` (pty) 516.

**Folder item counts** (`git ls-files <dir> | sed | cut -d/ -f1 | sort -u | wc -l`):

- **At 10:** `server/root`, `kit`, `kit/lsp`, `views/sources/source` (was 9), `views/sources/files/sections` (was 9), `shell/status`, `state/system/machine/lsp`, `data/sources/config`, `server/content/latex`, `config/text/views/sources`, `tests/server/machine/lsp`, `data/model`.
- **With room:**
  - 9 items: `server/machine/lsp` (was 10), `data/prose`, `server/root/process`.
  - 8 items: `config/catalogs` (was 9).
  - 6 items: `kit/latex`, `source/language`, `tests/data/sources/config`.
  - 4 items: `adapters`.
  - 3 items: `source/latex`.

**D45 features D43 must not duplicate: hold, moved.** `oculus.latex.cites` is `latex-tab.svelte.ts:358` and `citationsOf` is `bib.ts:28`. `pictureAt` and `pictureFile` are now `kit/latex/latex.ts:96` and :123 (was :89-95). The Math Symbols group is `latex.yml:158`. `image-size` ^2.0.4 is at `package.json:81`.

## 3. Z703 U1 to U10 and Z690 against the tree

- **U1 (brew in the not-found tooltip, `words.install`).** Add the field to `LspServerWords` (`lsp-servers.ts:25-34`). The tip at `LanguageItems.svelte:87` reads `ls_tip_not_found` (`statusbar.yml:104`). The precedent is `latex.yml:130` `refused_program_brew`. Holds.
- **U2 (`latex.texlab_path`).**
  - The neighbours: `behavior.yml:147` `synctex_path` and :152-154 `latexindent_path`, `tex_fmt_path`, `badness_path`; `options.yml:607` and :660-680; `settings.ts` `latexFormatting` :526-543 and `latexBuild` :732 (`synctexPath` :750).
  - **Correction:** the context.ts split is no longer needed (803 lines).
  - The path reaches the registry without a `RelayOptions` change: `context.ts:247-259` passes `servers: createServers({ ..., texlab path reader })` through `RelayOptions.servers` (`relay.ts:121-122`).
  - `server/root` holds 10 items, so any new file goes in `process/` (9 items).
- **U3 (`latexmkrc:<sha256 hex>`).**
  - Today there are four key kinds (`approvals.ts:6-15`; `svelte-config` key at :208-211; DESIGN.md:166 for `interpreter` and `svelte-config`, :411 for `app` and `command`). G55 is guarded.md:37-39.
  - The build entry points:
    - page side: `state/sessions/latex/builds.ts:546` (on_file_change), :605-611 (on_save, called from `state/client/context.ts:471`), and `terminals.svelte.ts:505`;
    - server side: `pty/routes.ts:436-437` to `startLatex` (`latex.ts:259`) to `runStep` (:279).
  - The terminal's cwd is the main's folder (:307), so a build's latexmk reads the latexmkrc of that folder.
  - **Clean also runs latexmk.** `cleanStep` (`recipes.ts:214-220`) runs `latexmk -c`, and `latex.auto_clean` runs it after a build. The gate must cover every latexmk step, not only the build; checkcites runs no latexmk.
  - The command-approval precedent: `runs/commands/run.ts:123` answers `{ approve: lines }`.
  - Three things the tree raises go to section 5: N1 (texlab's watcher), N2 (the weave recipes) and N4 (where an automatic build asks).
  - Not verified: how far texlab's ancestor scan goes. If it goes past the root, Z703's set "up to the root" misses files above it. Reading `crates/base-db/src/deps/discover.rs` at v5.26.0 would settle it.
- **U4 (`bibtex` language).** The places:
  - `sources.yml:112`, plus a `bibtex:` line;
  - `SHIKI_IDS` (`grammars.ts:21-53`);
  - `language_bibtex`, between `statusbar.yml:126` and :127;
  - `latex-tab.svelte.ts:77` and :101-108 (`applies`), with the `.bib` commands at :371-378;
  - `extension.ts:42`;
  - `followed.svelte.ts:3` and :37;
  - `Outline.svelte:103`.

  The TeX view's `Latex.svelte:89` and `onSaved` go by path and are unaffected. D28's per-language save rules hold no `latex` entry (`behavior.yml:127-130`), so there is nothing to carry. Holds.
- **U5 (`latex.unimath_symbols` false, `latex.includegraphics_preview` true).**
  - `behavior.yml` latex block and `options.yml`, with `help:` (M8's rename).
  - New: a unimath group in `catalogs/latex.yml` must be added to M8's strict `latexFileShape` (`catalog-files.ts:196-208` and the owned list :327-333). Otherwise the file gives a finding.
  - The hub's `docs/DATA-MAP.md:240` describes `latex.yml`'s groups.
  - The unimath data's upstream licence is still not verified.
- **U6 (words).** `cmd_latex_output` and `cmd_latex_restart` sort between `source.yml:20` and :21. `server_texlab` goes after `statusbar.yml:92`. Holds.
- **U7 (features).** texlab needs its own capability map (YAML precedent `servers.ts:563-572`) or an `Offers` flag, since `common()` adds `typeDefinitionProvider` at :219. Its `commands` leave out build and clean. Holds.
- **U8 (an entry-level hook dropping texlab's `source: "latex"` diagnostics): no such hook exists.**
  - The entry hooks today are `requests` (:158), `registrations` (:160) and `refuses` (:162).
  - The new optional `ServerEntry` field goes beside them. It is applied either in `#serverNotification` (`relay.ts:785-821`, before `toPage` at :796-799) or in `held.ts` (667 lines, which has room).
  - relay.ts is at 864, 16 lines under 880, so the held side is the safer place.
- **U9 (Outline fallback).** On not_found, the symbol state stays `'loading'` (`client.ts:308`, :421-426), so the Outline needs the server's state.
  - The places: `Outline.svelte` :122, :165 and :193, and its head comment :9-10, which already names only "Python, C or C++".
  - `client.ts` and `documents.svelte.ts` are both on D33's write list.
- **U10 (problems of files not open).** D33's brief keeps the relay's rule (`relay.ts:801`; `D33-premise-recheck-2.md:480` "the relay sends only open documents"), and `relay.ts` is not on D33's list. After both land, a problem in a file not open shows for no server. This is consistent with U10 (a). Holds.
- **Z690.**
  - D45-1, both hovers: holds through `together` (`extension.ts:44-46`).
  - D45-2, unbuilt: holds (the grep above). The preview can reuse `pictureAt` and `pictureFile` (`kit/latex/latex.ts:96`, :123) and `fileBytesUrl`. `kit/latex` has room (6 items).

## 4. Tests and guarded entries

These apply. The units come from `awk` over guarded.md's Code lines; the test files are named by each entry's Test line.

- **G7**, `servers.ts`: the `servers.test.ts` rows. texlab is a PATH program like clangd, so its command joins the sorted list. Its launch from `latex.texlab_path` is one argument-array row.
- **G36**, `relay.ts` and `held/process.ts`: a `lifetime.test.ts` row, "one texlab for a tex tab and a bib tab". G36's sentence needs a texlab clause; that is the orchestrator's text.
- **G1** (`relay.test.ts`) and **G63** (`versions.test.ts`): run whenever relay.ts or held.ts changes (U8).
- **G55**, `approvals.ts` and the adapters: Z703 widens it.
  - Its sentence names only a language server. The build gate in `pty/latex/latex.ts` needs that sentence, or another, to name a LaTeX build. Otherwise the build gate's rows have no entry.
  - Its current test is slow and real-server (`svelte-trust.test.ts`). texlab is not installed, so texlab's rows must be unit rows over its adapter and the build gate. `tests/server/machine/lsp` is at 10 items, so a new file there needs the folder regrouped.
- **G31**, `approvals.ts` and `choices.ts`: a row for the new approval write over an unreadable file (`approvals.test.ts`).
- **G35**, `pty/latex/latex.ts`: the refusal table 'POST /api/terminal, a refusal' (`terminal-actions.test.ts:400`) gets the unapproved-latexmkrc rows, if G55's text places them there.
- **G13**, `settings.ts`: `settings.test.ts` and `wrong-settings.ts` rows for the new keys.
- **G12 and G24:** the catalogs and `options.yml`.
- **G61**, `server/root/context.ts`: run if context.ts changes.
- **The tree checks:** G16, G17, G20, G21, G22, G23, G24, G25.

New guarded entries: none is needed if G55's text is widened to the build, as Z703 rules. If the orchestrator keeps G55 to language servers, the build gate needs a new entry, which is Axel's. U8's filter, U9's fallback and U1's words are seen at the look, and none needs an entry.

## 5. New choices the tree raises

**N1. texlab running a latexmkrc that appears or changes after it started.**

The basis is recheck 1 (texlab's own notify watcher, `server.rs:83`, :1239) and recheck 2 (`Document::parse` of a latexmkrc runs `latexmk -dir-report-only`). Both are not re-read here.

The consequence: once texlab runs, a latexmkrc added or edited under a document folder can be executed by texlab's own watcher before oculus could stop it. Z703's "a changed file asks again" then cannot be held for texlab. Computing Z703's set before start also needs the root scanned for document folders; for the hub root that cost is not measured.

- **(a) Recommended. Start texlab with a PATH that holds no `latexmk`:** a folder under the `lsp` folder with links to `latex`, `kpsewhich` and `tectonic` (if present). texlab then never runs a latexmkrc. Give it the aux and out folders through its configuration from `latex.aux_dir` and `latex.out_dir`. Z703's approval stays, whole, on D45's latexmk steps.
  - Pros: no race and no prompt before texlab starts. The approval set is only the main folder's rc and the home rc, so it is exact and cheap. No texlab approval UI is needed: the Svelte `config` approval is named in about ten places (`palette-modes.ts:54`, :87, :104, `ChoiceRows.svelte:57-154`, `palette.ts:320`, `lsp.svelte.ts:462`, `model-machine.ts:390`, :414, `status-items.ts:56`, `LanguageItems.svelte:186-192`), so a second kind would add a parallel branch in each.
  - Cons: it departs from Z703 U3's "asked before texlab starts", so it is a ruling's change. A repository whose latexmkrc sets its own `$out_dir` leaves texlab reading `.aux` from the configured folder. It needs a links folder kept current at each start. That kpsewhich resolves its tree through a link is not verified.
- **(b) Z703 as written, plus a watcher in oculus that stops texlab on a new or changed latexmkrc.**
  - Pros: no departure from the ruling.
  - Cons: the race with texlab's own watcher is not closed, so G55 cannot be guaranteed. It also needs the parallel approval branches and a root scan.
- **(c) Ignore changes after start.** This is the lazy option: a changed latexmkrc runs unapproved.

**N2. The weave recipes.** `behavior.yml:161-163` and :172-174 run `Rscript -e knitr::...`, `julia ... weave` and `pweave` on the document. That runs the repository's own R, Julia or Python chunks without an approval, which is the same DESIGN.md:166 cause as Z703 U3. No `.rnw`, `.jnw` or `.pnw` file exists in the hub (`find` printed nothing).

- **(a) Recommended.** A build whose recipe runs a weave tool asks once per repository, main folder and recipe tools. This follows the debug-launch precedent (DESIGN.md:166: repository, folder and program, not the changing text).
- **(b) Key the approval on the document text.** It asks on every edit, which makes the recipes unusable.
- **(c) Leave the weave recipes out.** This is the lazy option: it ends the cause for latexmkrc only.

**N3. texlab is not installed, so the landing look sees none of D43.** `which texlab` exits 1. A builder installs nothing, and every texlab test is a stub.

- **(a) Recommended.** The orchestrator runs `brew install texlab` (bottle 5.26.0, arm64_sequoia) before the look on TEST. That is Z703 U1's own route.
- **(b)** Look only at the not-found state.
- **(c)** Land without looking at texlab's features. This is the lazy option.

**N4. Where an automatic build asks.** `on_file_change` and `on_save` builds (`builds.ts:546`, :605-611) have no press to answer an approval question, and Z703 does not name the shape.

- **(a) Recommended.** An automatic build starts nothing while the latexmkrc is unapproved, and the LaTeX status item (`shell/status/LatexItem.svelte`) says so in the warning tone. A press on it lists the files with Approve. A pressed build asks at once with the same list, as a project command does (`run.ts:123`).
- **(b)** A notification at each skipped build.
- **(c)** Skip the build silently. This is the lazy option.

## 6. The paths D43 writes

Under N1 (a), N2 (a) and N4 (a). Lines marked "if" depend on the ruling or on the brief's own choice.

```
tools/oculus/src/lib/server/machine/lsp/servers.ts
tools/oculus/src/lib/data/prose/lsp-servers.ts
tools/oculus/src/lib/server/machine/lsp/adapters/texlab/adapter.ts (new)
tools/oculus/src/lib/server/machine/lsp/adapters/texlab/<the links folder module> (new, N1 (a))
tools/oculus/src/lib/server/machine/lsp/held/held.ts (U8 hook applied), or relay.ts at :785-821
tools/oculus/src/lib/server/root/context.ts (the registry with the texlab path, :247-259)
tools/oculus/src/lib/server/machine/approvals/approvals.ts (latexmkrc key, head comment :6-15)
tools/oculus/src/lib/server/machine/pty/latex/latex.ts (gate on build and clean)
tools/oculus/src/lib/server/content/latex/recipes.ts (if the rc files of a main are read there)
tools/oculus/src/lib/data/model/<the module holding the terminal answer type> (the approve answer)
tools/oculus/src/lib/data/sources/config/settings.ts
tools/oculus/src/lib/data/shapes/catalog-files.ts (:196-208, :327-333)
tools/oculus/src/lib/data/sources/config/catalog/latex-tables.ts
tools/oculus/config/behavior.yml (:139-175)
tools/oculus/config/catalogs/options.yml (:560-680)
tools/oculus/config/catalogs/latex.yml (the unimath group)
tools/oculus/config/sources.yml (:112 and a bibtex line)
tools/oculus/config/text/statusbar.yml (:92, :104, near :126, the LaTeX item words)
tools/oculus/config/text/views/sources/source.yml (between :20 and :21)
tools/oculus/config/text/views/academic/latex.yml (shared with D33)
tools/oculus/src/lib/ui/controls/editor/kit/grammars.ts
tools/oculus/src/lib/ui/controls/editor/kit/latex/<unimath completion and image preview> (new)
tools/oculus/src/lib/views/sources/source/language/latex-editor.ts
tools/oculus/src/lib/views/sources/source/language/symbols.ts (if)
tools/oculus/src/lib/views/sources/source/language/extension.ts (shared with D33)
tools/oculus/src/lib/views/sources/source/latex/latex-tab.svelte.ts
tools/oculus/src/lib/views/shared/latex/followed.svelte.ts
tools/oculus/src/lib/views/sources/files/sections/Outline.svelte
tools/oculus/src/lib/ui/controls/editor/kit/lsp/client.ts (if, shared with D33)
tools/oculus/src/lib/state/system/machine/lsp/documents.svelte.ts (if, shared with D33)
tools/oculus/src/lib/shell/status/LanguageItems.svelte
tools/oculus/src/lib/shell/status/LatexItem.svelte
tools/oculus/src/lib/state/sessions/latex/builds.ts
tools/oculus/src/lib/state/sessions/terminals.svelte.ts (if)
tools/oculus/tests/server/machine/lsp/servers.test.ts
tools/oculus/tests/server/machine/lsp/lifetime.test.ts
tools/oculus/tests/server/machine/lsp/<the texlab adapter rows>, with the folder regrouped if a file is new
tools/oculus/tests/server/machine/approvals/approvals.test.ts
tools/oculus/tests/routes/sessions/terminal-actions.test.ts
tools/oculus/tests/data/sources/config/settings.test.ts
tools/oculus/tests/data/sources/config/wrong-settings.ts
tools/oculus/DESIGN.md (:23, :166, :535, :537, :570, :573)
tools/oculus/docs/files-and-search.md (:17, :85)
tools/oculus/docs/views.md (:263, :271)
tools/oculus/docs/configuration.md (:17)
tools/oculus/docs/diagrams/ (regenerated)
docs/DATA-MAP.md (:240)
```

HELP.md needs no change unless the brief adds a key or a view. The hub's `deck` is in `.agents/plan.yaml:12` `worktree_paths`, but D43 writes nothing there; of the hub's `docs/`, D43 writes only `DATA-MAP.md:240`. The orchestrator's own files are `agents/guarded.md` G7, G36, G55 and G31.

Usage: claude-opus-5-5, about 90 tool uses, time not measured.
Usage (from the completion notice): afc7fb00307ab9995, claude-opus-5-5, 351,138 tokens, 112 tool uses, 15.1 min.
