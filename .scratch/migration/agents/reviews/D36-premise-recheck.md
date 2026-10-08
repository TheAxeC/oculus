# D36 premise recheck on main at a60dcb4fa

## Findings that change what D36 builds

1. **Two more files import `programPath`.** D43 added `programPath` to `recipes.ts`, and two new files import it: `server/machine/lsp/adapters/texlab/adapter.ts:15` (used at :27 and :41) and `adapters/texlab/links.ts:17` (used at :59). Item 1 moves `programPath` to `server/core/program.ts`, so both imports must change too. Neither file is on the write list. `links.ts` is on G55's Code line, so G55's `servers.test.ts` row has to run. (`grep -rn -E "programPath|onPath\(|onPath," src tests`)
2. **The approvals fold is now concrete.** D43's `latexmkrcKey` (`approvals.ts:322-325`) and `isLatexmkrcApproved` (`:327-330`) are `configKey` and `isConfigApproved` with the prefix `latexmkrc:`. `approveLatex` (`:332-356`) builds that key inline.
   - Folding them touches files the write list does not name: `server/machine/pty/latex/approval.ts:30` and `:186`, `server/machine/lsp/adapters/web/approval.ts:6-54`, and `tests/server/machine/approvals/approvals.test.ts:20, 88, 89, 100, 133`.
   - The head comment now reads "There are five kinds of key" (`:7`), so D36 makes it six.
   - G55's Code line now names `approvals.ts` and `pty/latex/latex.ts`, and G31's tests now include `tests/routes/sessions/latex-approvals.test.ts`. That test file is not in Verify item 3.
   - Commands: `git diff e61cfc598 a60dcb4fa -- .../approvals.ts`, `grep -rn -E "isLatexmkrcApproved|approveLatex\b|configKey\(" src tests`, `sed -n 37,39p agents/guarded.md`.
3. **`.bib` is now its own language, `bibtex`** (`config/sources.yml:106`). `latex` is now `.tex .latex .sty .cls .rnw .jnw .pnw` (`:113`), and the map spans `:104-137`. The brief's line 72 and O8's evidence (line 399) and option (b) (line 401) are wrong. ChkTeX's file list (O8 (a)) and case 24 still hold. (`git diff e61cfc598 a60dcb4fa -- config/sources.yml`)
4. **A new `behavior.yml` key needs two test edits the write list does not name.** D43's keys show the pattern: the `settingFindings` key list in `tests/checks/config/config.test.ts` and the `WRONG_SETTINGS` map in `tests/data/sources/config/wrong-settings.ts` each gained the new keys. D36's `lint.*` keys need the same. (`git diff e61cfc598 a60dcb4fa -- tests/checks/config/config.test.ts tests/data/sources/config/wrong-settings.ts`)
5. **D43 set a precedent for a program path key.** `latex.texlab_path` takes an absolute path or one starting with `~`. A named path that cannot be used is `not_found` naming the path, and PATH is not tried (`adapters/texlab/adapter.ts:1-10, 20-45`, `docs/files-and-search.md:85`). The older `latex.<tool>_path` keys hand the value to the runner as written (`content/latex/endpoint.ts:477`). The brief does not say which rule `lint.*_path` follows. This is choice C1, and it is Axel's.
6. **The server-context ranges on the write list miss three places D36 must write** (`server/root/context.ts`):
   - the context object (`:472-480`);
   - `close()` (`:527-553`), which ends the held ESLint children with the server;
   - the served-roots follow (`followRoots` at `:269` and `:756-759`, which calls `relay.reconcile()`). The held children need this to end "at once when its root stops being served".
   
   The base already had this gap; D43 only moved the lines. (`sed -n 470,480p`, `sed -n 525,553p`, `sed -n 740,770p`, `grep -rn "followRoots(" src`)
7. **D39 is now the queued step that shares paths with D36, not D43.** Nothing is in flight. D39's write list overlaps D36's at `server/root/context.ts` (D39 :240-330), `state/client/context.ts`, `glyphs.yml`/`icons.yml`, `DESIGN.md`, `HELP.md`, `docs/files-and-search.md:85` and `docs/diagrams/`. (`cat queue.md`; the "Paths this step writes" section of `agents/briefs/D39.md`)
8. **The `problem-rows.ts` path is wrong in the brief (base error).** The brief's item 3 (line 118) and write list (line 257) name `state/system/problem-rows.ts`. The file is `src/lib/views/sources/search/problem-rows.ts`, and it was there at e61cfc598 too. (`git ls-files | grep problem-rows`; `git ls-tree -r --name-only e61cfc598 -- src | grep problem-rows`)
9. **Line numbers moved in most of the files D36 touches** (section 1).
   - No file is near a size limit. `state/client/context.ts` went from 855 to 821 lines, and `settings.ts` (809) and `server/root/context.ts` (810) both have about 70 lines of room.
   - No folder count changed, and `sh utils/folder-check.sh` exits 0.

## 1. Premises rerun on a60dcb4fa

The only commits that touch product code since the brief was written are M6 (827d5b77c) and D43 (a60dcb4fa): `git log --oneline e61cfc598..a60dcb4fa -- tools/oculus ':!tools/oculus/.scratch'`. The checkout's `tools/oculus` matches HEAD except for the ledger's `plan.md` and `queue.md` (`git status --short .`).

`git diff --numstat e61cfc598 a60dcb4fa` shows these files unchanged, so every brief line reference into them still holds:

- `problems.svelte.ts`, `problem-sources.ts`, `command-marks.svelte.ts`, `tab-language.svelte.ts`, `markers.ts`
- `content/latex/tools.ts`, `endpoint.ts`, `synctex.ts`, `texdoc.ts`
- `token-post.ts`, `login-env.ts`, `status-items.ts`, `glyphs.yml`, `icons.yml`
- `editor-status.svelte.ts`, `tab-asks.svelte.ts`, `palette-modes.ts`, `ChoiceRows.svelte`, `palette.ts`
- `server-context.ts`, `Diff.svelte`, `SourceItems.svelte`, `views/sources/search/problem-rows.ts`
- `files/source.ts`, `routes/api/(machine)/debug/+server.ts`, `routes/api/(files)/source/+server.ts`
- `tests/checks/imports/order.ts`, `tests/checks/tree/size.test.ts`

I spot-checked these by reading them: `problems.svelte.ts:5-9, 24-46`; `status-items.ts:9-11, 44-58`; `glyphs.yml:233-236`; `icons.yml:232-235`; `editor-status:53`; `tab-asks:58, :145`; `palette-modes:4`; `palette.ts:320`; `SourceItems:176`; `server-context.ts:39-45`.

What changed (old value, then new value, then the command):

**Saving a file** (`source.svelte.ts`, `context.ts`, `builds.ts`)
- `source.svelte.ts:542-613`, 725 lines, is now `:558-628`, 742 lines. `postSave` moved from `:681-690` to `:697-707`, and `saved(...)` from `:689` to `:705`. The `context.ts` caller of `saveSource` moved from `:726` to `:693`; `Timeline.svelte:229` is unchanged. (`grep -n "saved(\|function postSave\|function saveSource\|function saveSourceDraft\|function performSave"`, `grep -rn "saveSource(" src`, `wc -l`)
- `context.ts`:
  - The save hook moved from `:483-489` to `:450-456`.
  - The file went from 855 lines (25 under 880) to 821 lines (59 under 880).
  - `servedRoots` moved from `:421` to `:381`.
  - `watchServedRoots` moved from `:630-639` to `:600-606`. Its own comment, at `:597-599`, names only the command and LaTeX rows, and the brief's head-comment list does not name it.
  - The comment over the problems store moved from `:640-643` to `:607-610`.
  - The `problems.register` calls moved from `:684-686` to `:651-653`.
  
  (`grep -n "createSource\|latex.onSaved\|problems.register\|servedRoots\|watchServedRoots\|forgetOutside" src/lib/state/client/context.ts`, `sed -n 445,462p`, `sed -n 595,660p`, `wc -l`)
- `latex.onSaved` moved from `builds.ts:605-620` to `:819-834`. `builds.ts` went from 637 to 856 lines. The per-file counter is the same pattern (`:827-830`). (`grep -n "onSaved\|saves" builds.ts`)

**The editor and its marks** (`extension.ts`, `client.ts`)
- `extension.ts` went from 63 to 64 lines. `languageExtension` moved from `:45-49` to `:46-50`, and `commands?` from `:29` to `:30`. LaTeX now covers `latex` and `bibtex` through `isLatexLanguage` (`:54`). (`git diff ... extension.ts`, `grep -n`)
- The code action provider moved from `kit/lsp/client.ts:355` to `:364`. (`grep -rn "registerCodeActionProvider" src/lib`)

**`recipes.ts`, `latex.ts` and the language servers**
- `recipes.ts` went from 291 to 304 lines. `runnable` is unchanged at `:230-238`. `programPath` is new at `:240-254`. `onPath` moved from `:241-246` to `:256-259` and now calls `programPath`. The brief's span `:230-246`/`:236-246` becomes `:230-259`. `TEXLIVE_PACKAGES` (`:59`) and `BREW_FORMULAE` (`:72`) are unchanged. (`grep -n "^function runnable\|^export function programPath\|^export function onPath" recipes.ts`)
- In `latex.ts`, the `onPath` import moved from `:40` to `:54` and its use from `:213` to `:234`. The file went from 313 to 464 lines. `programPath` has new importers in `adapters/texlab/adapter.ts:15` and `links.ts:17`. (`grep -n onPath latex.ts`, `grep -rn -E "programPath" src`)
- `servers.ts` went from 642 to 741 lines.
  - The head comment that says where each server comes from moved from `:10-22` to `:10-23`, and texlab now comes from `latex.texlab_path` or PATH.
  - `ownFolder` moved from `:276-282` to `:304-316`.
  - texlab's entry is at `:612-675`, its diagnostics filter at `:643-653`, and `BUILD_LOG_SOURCE` at `:615`.
  
  (`git diff ... servers.ts`, `grep -n "function ownFolder\|BUILD_LOG_SOURCE" servers.ts`)
- `relay.ts` went from 864 to 852 lines (the brief's O1 says 864). (`git show <c>:... | wc -l`)

**Approvals** (`approvals.ts`)
- The file went from 316 to 356 lines.
- The key-kind count in the head comment changed from "four" at `:6-7` to "five" at `:7`.
- The `svelte-config:` sentence at `:11-14` now runs `:11-24` and includes `latexmkrc:` and `approveLatex`.
- The brief's spans `:166-243` and `:208-250` are now `:166-257` and `:208-257`: `configText` :208, `configKey` :212-215, `anyConfigApproved` :217-221 (hard-wired to `svelte-config:`), `isConfigApproved` :223-226, `approveConfig` :228-241, `revokeConfig` :243-257.
- New: `latexmkrcKey` :322-325, `isLatexmkrcApproved` :327-330, `approveLatex` :332-356.

(`git diff ... approvals.ts`, `grep -n "^export function\|^function" approvals.ts`)

**Settings and server start-up**
- `data/sources/config.ts:85` is still `latexFormatting`. (`grep -n latexFormatting`)
- The start-up reader in `server/root/context.ts` moved from `:241` to `:243`.
  - The relay now reads `latex: () => latexBuild(make.loadConfig(engine).config)` at `:256`. That is the model for a lint reading its keys at each run.
  - The `built` hook at `:321-325` calls `relay.settingsChanged()`.
  - The file went from 803 to 810 lines.
  
  (`grep -n "latexFormatting\|latexBuild\|openSettings" ...`, `sed -n 236,264p`, `sed -n 310,330p`)

**Status bar, catalogs and config**
- `LanguageItems.svelte` went from 200 to 204 lines. It gained `install` (`:49-50`) and the `ls_tip_not_found_install` branch (`:88-91`); its head comment `:2-19` is unchanged. (`git diff ... LanguageItems.svelte`)
- `statusbar.yml`:
  - `ls_not_found` moved from `:105` to `:107`, and `ls_tip_not_found` from `:112` to `:114`.
  - New lines: `server_texlab` :102, `ls_tip_not_found_install` :115, `ls_install_texlab: brew install texlab` :116, `latex_unapproved_tip` :71, `language_bibtex` :139.
  - The `ls_*` words now span `:103-123`, and the brief's block `:95-125` is now `:96-129`.
  - `item_language_server` :21 and `item_svelte_config` :24 are unchanged.
  
  (`grep -n` over `statusbar.yml`)
- `latex.yml`'s not-found sentences moved from `:112-139` to `:117-147`. (`grep -n "refused_badness_missing\|refused_texdoc_missing"`)
- `behavior.yml`:
  - The LaTeX block (comment from :132, `latex:` from :139) is now from :140; the block ends at :179, and the `=== Writes` heading moved from :178 to :182.
  - The path keys moved from `:147-154` to `:148` and `:155-158`; `texlab_path` is at :158.
  - New keys: `unimath_symbols` :152 and `includegraphics_preview` :153.
  
  (`grep -n` at both commits)
- `options.yml`: the path entries moved from `:660-680` to `:672-699`, with `latex.texlab_path` at `:693-699` and `writes.timeout_seconds` at `:700`. `latex.synctex_path` is at `:607-613`. (`grep -n "^        latex\..*_path:\|^        writes.timeout_seconds:"` at both commits)
- `settings.ts` went from 803 to 809 lines. `latexFormatting` is at `:526-542`, `latexBuild` at `:735`, and it reads `latex.texlab_path` at `:765`. (`grep -n`)
- `config/sources.yml`: roots `:92-98` are unchanged; the language map is now `:104-137` with `bibtex: [.bib]` at `:106`. (`sed -n 88,137p`)

**Hub counts** (`git ls-files | grep -c` per extension)
- `.tex`: 235, unchanged.
- `.py`: 807, unchanged.
- `.ts`/`.js`/`.mjs`/`.cjs`: 1236, now 1251.
- TypeScript, JavaScript and Svelte under `tools/oculus`: 1598, now 1616.
- `.svelte`: 381, now 384.
- `.sh`/`.bash`/`.slurm`: 237, unchanged (229 under `projects/`, unchanged).
- Linter configuration files: unchanged (`projects/ideas/engram/code/pyproject.toml`, `tools/oculus/eslint.config.js`).

**The linters on this machine:** unchanged. chktex is at `/usr/local/texlive/2025/bin/universal-darwin//chktex` (v1.7.9) and ruff at `~/.local/bin/ruff` (0.16.5). eslint is not on PATH; oculus's own is v10.10.0 (`package.json:39`). shellcheck is not found. texlab is now at `/opt/homebrew/bin/texlab`. (`command -v`, `--version`)

**Other dependencies:** `@sveltejs/kit` is still 2.70.3, and the request-abort code at `index.js:137-146` reads as the brief says. No change to `package.json`, `package-lock.json`, `eslint.config.js` or `vite.config.ts`. (`git diff --stat`, `sed -n`)

**Folders** (the brief's own command, `git ls-files <d> | ... | wc -l`): every count is unchanged.
- `server/machine` 10, `runs` 3, `core` 9, `content/latex` 10, `routes/api/(machine)` 5.
- `state/system` 10, `state/system/machine` 6, `views/sources/source/language` 7.
- `data/model` 10, `config/text` 7.
- `sh utils/folder-check.sh` exits 0.

**Guarded entries.** G1 is at :7, G2 :10, G7 :25, G55 :37-39, G28 :53-55, G36 :65-67, G31 :74-76, G12 :149, G13 :152-154 and G16-G25 :190-199.
- The texts changed: G55 now covers "A language server, a LaTeX build's latexmk step and a weave tool". G36 now includes "one texlab its LaTeX and BibTeX tabs". G28 adds the write refusal and `held-unsaved.test.ts`. G31's tests now include `latex-approvals.test.ts`. G13's tests now include the texlab rows.
- G28's Code line still names `state/client/context.ts` and `source.svelte.ts`.
- (`grep -n "^- G[0-9]*\. "`, `git diff e61cfc598 HEAD -- agents/guarded.md`)

**Documents.**
- `DESIGN.md:23` now names texlab and still ends "It has no lint panel and no other debugger."
- `DESIGN.md:166` now also describes the `latexmkrc:` approval and says texlab is oculus's own command, not shipped.
- `DESIGN.md:476` is unchanged.
- `DESIGN.md:575` now says texlab "never runs ChkTeX".
- `HELP.md:118`, `docs/views.md:81` and `docs/configuration.md:13` are unchanged.
- `docs/files-and-search.md:83-85` is in the same place and now says texlab "runs no ChkTeX".
- `README.md:26` is unchanged.

(`git diff -U0 e61cfc598 a60dcb4fa -- DESIGN.md HELP.md docs/... README.md`, `sed -n`)

**Tests the brief names, and the verify tools:** all present at the named paths. `tests/state/forms/form-drafts.test.ts` is gone (M6), but the brief does not name it. `checks.sh`, the node path `v24.21.0`, `utils/unused-exports.sh` and `utils/folder-check.sh` exist. (`[ -f ]`, `ls`)

**New ids and keys:** still free. There is no `linter` id, no `lint-*` owner, no `eslint-config`, no `/api/lint` route and no `lint.` key. (`grep -rn "linter\|lint-...\|eslint-config\|/api/lint" src config --exclude=local.yml`; `ls "src/routes/api/(machine)"`)

## 2. Where M6's or D43's code changes what D36 builds

- **`programPath` and `onPath`:** see finding 1. Moving them to `core/program.ts` now also rewrites the imports in `adapters/texlab/adapter.ts:15` and `links.ts:17`, along with `latex.ts:54`. G55's `tests/server/machine/lsp/servers.test.ts` row ('links latex and kpsewhich ...', `:121`) runs.
- **`servers.ts`:** D43 added the entry hooks `diagnostics` and `followed`, and `Setup.resolved`, `Launch.env` and `RootEnv.env` (`servers.ts:66-83`, `:100`, `:185-194`). D36 does not write `servers.ts`. The texlab entry is the model for a program found by path key or PATH. The held ESLint runs under `process.execPath` (`servers.ts:214`) and uses `ownFolder` (`:304-316`).
- **The approvals module:** see finding 2. There is also a second approval precedent. The latexmkrc approval is asked in a shell dialog (`shell/commands/LatexAsk.svelte`, `Asks.svelte`), while `svelte-config` uses a palette list. O2 already ruled the palette list for ESLint, so nothing changes.
- **The LaTeX settings block:** see findings 4 and 5. The `lint:` block goes after `:179`, before the `=== Writes` heading at `:182`.
- **The status bar's language items:**
  - A `.tex` tab now shows texlab's server item beside D36's ChkTeX item, and a `.bib` tab shows texlab's item and no linter item. Case 24 holds.
  - D43 introduced a per-server install word (`words.install`, `ls_tip_not_found_install` with `{2}`, `lsp-servers.ts` `install?`). D36's dictated lint tooltips name the path key as well as the install command, so the brief's full lines stay. No change.
  - `keys.test.ts` gained a `COMPUTED_PREFIXES` entry for D43's computed key (`git diff ... tests/checks/source/keys.test.ts`). If D36 builds a `t()` key from the linter id, that file needs the same.
- **Guarded entries:**
  - D36's new G55 text extends "A language server, a LaTeX build's latexmk step and a weave tool", as O6 foresaw. G55's Code line now names `approvals.ts`, `pty/latex/latex.ts` and `adapters/texlab/links.ts`, all of which D36 changes.
  - D36's new G36 text extends the texlab-widened sentence.
  - G1, G2 and G7 are unchanged in what matters.
  - M6 changed G28's tests to `held-unsaved.test.ts` among others. The brief names them through the entry, so they still resolve.
- **Size and folders:** no file D36 writes is over the limits (see the `wc -l` values above). `settings.ts` at 809 and `server/root/context.ts` at 810 each take new code from D36 and have about 70 lines of room. No folder count changed.
- **Changed text at the named lines:**
  - `server/root/context.ts` lines 235-260 now hold the relay's `latex:` reader (`:256`).
  - `behavior.yml` "after 178" now falls inside the LaTeX tools list (`:169-179`).
  - `statusbar.yml` 95-125 now includes texlab's lines.
  - `recipes.ts` 230-246 now cuts `programPath` in half.
  - `approvals.ts:6-7` now says "five".
- **Document sentences the brief dictates:**
  - The dictated rewrite of `DESIGN.md:23` still applies, but the line now names texlab.
  - The `:166` addition still fits after the new texlab sentence.
  - New sentences to read and report as still true or rewritten: `DESIGN.md:575` ("never runs ChkTeX"), `docs/files-and-search.md:85` ("runs no ChkTeX"), `relay.ts:23-25` ("texlab's own and ChkTeX's are kept"), `servers.ts:620-623`, and `adapters/texlab/settings.ts:3-5`.
- **M6:**
  - M6 added `source.unsavedFile(root, path)` (`source.svelte.ts:224-232`), a per-file check for unsaved text across the page's tabs, which the lint store can reuse.
  - M6 also added `diskName` (`data/helpers/hub-names.ts`), the one name of a file reachable under both `hub` and `engine`. Only YAML lives there, which no linter takes.
  - M6's refusal of writes over files with unsaved text (`state/client/writes.svelte.ts`) does not reach D36: its fixes edit the tab's text, and `:eslint-config` posts through `postWithToken`.
  
  (`git diff ... source.svelte.ts`, `cat hub-names.ts`)

## 3. ChkTeX in D36 against texlab in D43

**ChkTeX rows cannot come twice.**
- texlab is told `chktex: { onOpenAndSave: false, onEdit: false }` (`server/machine/lsp/adapters/texlab/settings.ts:47`).
- It also runs with a PATH that is only its links folder (`adapters/texlab/adapter.ts:68`, `PATH: links.folder`). That folder holds links to `latex`, `kpsewhich` and `tectonic` alone (`links.ts:20`), so texlab could not find `chktex` even if it were switched on.
- The relay drops only diagnostics whose `source` is `latex` (`servers.ts:615`, the filter at `:643-653`, applied at `relay.ts:784-785`).
- D36's rows carry the owner `lint-chktex` and the source `ChkTeX`. texlab's carry `lsp-latex`/`lsp-bibtex`.
- Z703 (U8) holds as written.

**texlab's own diagnostics stay and are different rules.** They cover undefined references and citations, unused labels and duplicate `.bib` keys (`docs/files-and-search.md:85`), plus its syntax errors. ChkTeX's warnings are typographic.
- A partial overlap is possible where both flag the same mismatched delimiter or environment (ChkTeX warnings 9, 10, 15 and 17 against texlab's syntax errors).
- That would show as two rows under two sources, as VS Code shows with both texlab and LaTeX Workshop installed.
- Not verified: it needs a texlab run, which this check does not start.

**Gaps:** none against the rulings.
- texlab's on-edit ChkTeX is off, and D36 lints on save and when a clean tab opens (O4). Lint on type is left out by O4, matching LaTeX Workshop's default `linting.run: onSave`.
- texlab serves `.sty`, `.cls` and `.bib`, which ChkTeX does not take under O8 (a). LaTeX Workshop gives ChkTeX rows only to `.tex`, `.bbx`, `.cbx` and `.dtx`.
- `.rnw`, `.jnw` and `.pnw` are linted by neither: texlab refuses them (`lsp-servers.ts` `refusedExtensions`, `servers.ts:642`), and O8 leaves them out.

**One comment is misleading after D36.** `relay.ts:23-25` reads "texlab's own and ChkTeX's are kept". This is true of the filter, but texlab never sends ChkTeX rows, and after D36 ChkTeX's rows are the linter's (choice C4).

## 4. Corrections to the brief

Line numbers are those of `agents/briefs/D36.md` as `cat -n` prints it now.

```
L13  Old: as it reads on main at fbc434269
     New: as it reads on main at a60dcb4fa

L17  Old: texlab (D43, in flight) runs with ChkTeX off, so ChkTeX's rows come from this step alone and never twice.
     New: texlab (D43, landed at a60dcb4fa) runs with ChkTeX off (`server/machine/lsp/adapters/texlab/settings.ts:47`) and with a PATH that holds links to `latex`, `kpsewhich` and `tectonic` alone (`adapters/texlab/adapter.ts:68`, `links.ts:20`), so ChkTeX's rows come from this step alone and never twice.

L22  Old: ## What is on the tree (read on main at e61cfc598)
     New: ## What is on the tree (read on main at a60dcb4fa)

L24  Old: (the whole paragraph) Main's oculus tree is unchanged since e61cfc598: ... the commit with D43 in it.
     New: Read on main at a60dcb4fa, after M6 (827d5b77c) and D43 (a60dcb4fa) landed: `git log --oneline e61cfc598..a60dcb4fa -- tools/oculus ':!tools/oculus/.scratch'` prints those two commits and no other.

L27  Old: `src/lib/state/sessions/source/source.svelte.ts:542-613`, 725 lines
     New: `src/lib/state/sessions/source/source.svelte.ts:558-628`, 742 lines
     Old: through `postSave` (`:681-690`)
     New: through `postSave` (`:697-707`)
     Old: on every `ok` answer (`:689`)
     New: on every `ok` answer (`:705`)
     Old: callers `Timeline.svelte:229` and `context.ts:726`
     New: callers `Timeline.svelte:229` and `context.ts:693`

L28  Old: `src/lib/state/client/context.ts:483-489`, which today runs `fs.markText(root, path)` and `void latex.onSaved(root, path)` (`sed -n 483,490p`). `context.ts` is 855 lines (`wc -l`), 25 under the line of 880.
     New: `src/lib/state/client/context.ts:450-456`, which today runs `fs.markText(root, path)` and `void latex.onSaved(root, path)` (`sed -n 450,457p`). `context.ts` is 821 lines (`wc -l`), 59 under the line of 880.

L29  Old: (`src/lib/state/sessions/latex/builds.ts:605-620`)
     New: (`src/lib/state/sessions/latex/builds.ts:819-834`, 856 lines)

L35  Old: The registration is `context.ts:684-686` (`grep -n "problems.register" src/lib/state/client/context.ts`), with `servedRoots` at `:421` and the comment over the store at `:640-643`, which names the three sources.
     New: The registration is `context.ts:651-653` (`grep -n "problems.register" src/lib/state/client/context.ts`), with `servedRoots` at `:381` and the comment over the store at `:607-610`, which names the three sources.

L39  Old: (`views/sources/source/language/extension.ts:45-49`, 63 lines) through the `commands?` field (`:29`)
     New: (`views/sources/source/language/extension.ts:46-50`, 64 lines) through the `commands?` field (`:30`)

L40  Old: (`kit/lsp/client.ts:355`,
     New: (`kit/lsp/client.ts:364`,

L44  Old: - `onPath` (`src/lib/server/content/latex/recipes.ts:241-246`) says whether a program is found on PATH or at a path,
     New: - `programPath` (`src/lib/server/content/latex/recipes.ts:240-254`) answers where a program is, at a path or on PATH, or null, and `onPath` (`:256-259`) says whether that lookup finds it,

L45  Old: `server/machine/lsp/servers.ts` (642 lines), each from oculus's own `node_modules` under the node that runs oculus, or clangd from PATH (`servers.ts:10-22`)
     New: `server/machine/lsp/servers.ts` (741 lines), each from oculus's own `node_modules` under the node that runs oculus, or clangd from PATH, or texlab from `latex.texlab_path` or PATH with a PATH of its own (`servers.ts:10-23`)
     Old: `server/machine/approvals/approvals.ts`, 316 lines, `:166-243`
     New: `server/machine/approvals/approvals.ts`, 356 lines, `:166-257`, beside D43's `latexmkrc:<sha256 hex>` at `:322-356`

L48  Old: - `onPath` is imported by `src/lib/server/machine/pty/latex/latex.ts:40` and used at `:213`. D43, which lands first, adds `programPath(program, env)` beside `onPath` in `recipes.ts` and makes `onPath` call it.
     New: - `onPath` is imported by `src/lib/server/machine/pty/latex/latex.ts:54` and used at `:234`; `programPath` is imported by `src/lib/server/machine/lsp/adapters/texlab/adapter.ts:15` (used at `:27`, `:41`) and `adapters/texlab/links.ts:17` (used at `:59`) (`grep -rn -E "programPath|onPath\(|onPath," src tests`).

L51  Old: run once at start by `src/lib/server/root/context.ts:241` (`openSettings, latexFormatting, latexBuild`).
     New: run once at start by `src/lib/server/root/context.ts:243` (`openSettings, latexFormatting, latexBuild`); the relay reads `latexBuild` again at each start through `latex: () => latexBuild(make.loadConfig(engine).config)` (`:256`).

L52  Old: (`src/lib/state/client/context.ts:630-639`)
     New: (`src/lib/state/client/context.ts:600-606`, its comment `:597-599`)

L72  Old: The language map (`config/sources.yml:104-135`) gives `bash` `.sh .bash .zsh .slurm`, `latex` `.tex .latex .bib .sty .cls .rnw .jnw .pnw`,
     New: The language map (`config/sources.yml:104-137`) gives `bash` `.sh .bash .zsh .slurm`, `bibtex` `.bib`, `latex` `.tex .latex .sty .cls .rnw .jnw .pnw`,
     Old: 1236 `.ts`/`.js`/`.mjs`/`.cjs` (1598 of the TypeScript, JavaScript and Svelte files under `tools/oculus`), 381 `.svelte`
     New: 1251 `.ts`/`.js`/`.mjs`/`.cjs` (1616 of the TypeScript, JavaScript and Svelte files under `tools/oculus`), 384 `.svelte`

L74  Old: (`src/lib/shell/status/LanguageItems.svelte`, 200 lines,
     New: (`src/lib/shell/status/LanguageItems.svelte`, 204 lines,
     Old: (`config/text/statusbar.yml:105`, `:112`)
     New: (`config/text/statusbar.yml:107`, `:114`; texlab's names its install through `ls_tip_not_found_install` `:115` and `ls_install_texlab` `:116`)
     Old: (`config/text/views/academic/latex.yml:112-139`)
     New: (`config/text/views/academic/latex.yml:117-147`)
     Old: (`config/behavior.yml:147-154`, options `config/catalogs/options.yml:660-680`, read by `latexFormatting` in `src/lib/data/sources/config/settings.ts:526-541`, 803 lines)
     New: (`config/behavior.yml:148` and `:155-158`, options `config/catalogs/options.yml:607-613` and `:672-699`, read by `latexFormatting` in `src/lib/data/sources/config/settings.ts:526-542` and, for `latex.texlab_path`, by `latexBuild` at `:765`, 809 lines). `latex.texlab_path` takes an absolute path or one that starts with `~`, and a named path that cannot be used is `not_found` with no PATH fallback (`adapters/texlab/adapter.ts:20-45`).

L78  Old: G55 (`:37-38`, no repository code before its approval) state guarantees D36's new code must keep, under Code lines that do not name it (O6).
     New: G55 (`:37-39`, no repository code before its approval) state guarantees D36's new code must keep, under Code lines that do not name it (O6). G55's Code line names `approvals.ts`, `pty/latex/latex.ts` and `adapters/texlab/links.ts`, and G31's names `approvals.ts`, all of which D36 changes.

L81  Old: `:476` ("Problems"), which lists the sources and says where the owners are defined.
     New: `:476` ("Problems"), which lists the sources and says where the owners are defined; `:575`, which says texlab "never runs ChkTeX".

L84  Old: - `docs/files-and-search.md:83-85` ("Language servers"); a section on the linters follows it.
     New: - `docs/files-and-search.md:83-85` ("Language servers"), which says texlab "runs no ChkTeX"; a section on the linters follows it.

L86  Old: `context.ts:640-643`,
     New: `context.ts:597-599` and `:607-610`,
     Old: `content/latex/recipes.ts` around `onPath`,
     New: `content/latex/recipes.ts:240-259`,
     Old: `approvals.ts:6-7` ("There are four kinds of key") and `:11-14` (O2).
     New: `approvals.ts:7` ("There are five kinds of key") and `:11-24` (O2); `server/machine/lsp/relay.ts:23-25` ("texlab's own and ChkTeX's are kept", C4).

L89  Old: (the whole paragraph) **Shared with the steps in flight** ... D39 is prepared after D43 too.
     New: **Shared with the steps in flight** (`queue.md`): nothing is in flight. D39, queued beside D36, writes these paths D36 writes too (`agents/briefs/D39.md`, "Paths this step writes", numbered at e61cfc598): `server/root/context.ts` (D39 :240-330), `state/client/context.ts` (other lines), `config/catalogs/glyphs.yml` and `icons.yml` (only for a new glyph), `DESIGN.md` (D39 :526 and :575-576), `HELP.md` (D39 :81 and :116), `docs/files-and-search.md` (D39 :85; D36 a section after :85) and `docs/diagrams/`. Whether the two run at once is the orchestrator's judgment in `shared_paths:`.

L97  Old: `tools.ts`, `recipes.ts`, `endpoint.ts`, `synctex.ts`, `texdoc.ts` and `server/machine/pty/latex/latex.ts` (its import at :40) import them from there and behave as today.
     New: `tools.ts`, `recipes.ts`, `endpoint.ts`, `synctex.ts`, `texdoc.ts`, `server/machine/pty/latex/latex.ts` (its import at :54), `server/machine/lsp/adapters/texlab/adapter.ts` (:15) and `adapters/texlab/links.ts` (:17) import them from there and behave as today.

L102 Old: (`ownFolder`, `servers.ts:276-282`, the folder of oculus's `package.json`)
     New: (`ownFolder`, `servers.ts:304-316`, the folder of oculus's `package.json`)
     Add after "and with the oculus server;": the held children hear a change of the served roots where the relay does, through `followRoots` (`server/machine/lsp/held/watch.ts:158-184`, called at `server/root/context.ts:269` and `:756-759`), and end in the context's `close()` (`:527-553`) (C2);

L105 Old: `configKey`, `approveConfig` and `revokeConfig` (`approvals.ts:208-250`) take the key kind as a parameter and serve `svelte-config:` and `eslint-config:` alike, with no copy (G21); D43, which lands first, adds `latexmkrcKey`, and where it is a copy of `configKey` with another prefix it is folded into the general function. The head comment's count of key kinds (`:6-7`) follows;
     New: `configKey`, `isConfigApproved`, `approveConfig` and `revokeConfig` (`approvals.ts:212-257`) take the key kind as a parameter and serve `svelte-config:`, `latexmkrc:` and `eslint-config:` alike, with no copy (G21): D43's `latexmkrcKey` (`:322-325`) and `isLatexmkrcApproved` (`:327-330`) are `configKey` and `isConfigApproved` with the prefix `latexmkrc:` and are folded into them, `approveLatex` (`:332-356`) builds its key through the general one, and the callers `server/machine/lsp/adapters/web/approval.ts:6-54` and `server/machine/pty/latex/approval.ts:30` and `:186` follow (C5). The head comment's count of key kinds (`:7`, now "five") becomes six;

L110 Old: called from the save callback at `context.ts:483-489` beside `latex.onSaved`,
     New: called from the save callback at `context.ts:450-456` beside `latex.onSaved`,

L113 Old: (`context.ts:630-639`)
     New: (`context.ts:600-606`, its comment `:597-599` rewritten)

L116 Old: `context.ts` registers it after `latexProblems` (`:686`) and rewrites the comment at `:640-643`.
     New: `context.ts` registers it after `latexProblems` (`:653`) and rewrites the comment at `:607-610`.

L118 Old: (`state/system/problem-rows.ts`, `views/sources/search/Problems.svelte`)
     New: (`views/sources/search/problem-rows.ts`, `views/sources/search/Problems.svelte`)

L126 Old: beside `ls_*` (`:95-125`)
     New: beside `ls_*` (`:103-123`)

L136 Old: A `lint:` block in `config/behavior.yml` after `latex:` (`:139-178`) with its comment:
     New: A `lint:` block in `config/behavior.yml` after the LaTeX block (its comment from `:132`, `latex:` at `:140` to `:179`), before the `=== Writes` heading at `:182`, with its comment:
     Old: run at start by `src/lib/server/root/context.ts:241` beside `latexFormatting`. G13's test (`tests/data/sources/config/settings.test.ts`) gains one case for the `lint.*` reader.
     New: run at start by `src/lib/server/root/context.ts:243` beside `latexFormatting`. G13's test (`tests/data/sources/config/settings.test.ts`) gains one case for the `lint.*` reader; `tests/data/sources/config/wrong-settings.ts` gains a `lint:` block and the `settingFindings` key list of `tests/checks/config/config.test.ts` gains the `lint.*` keys, as D43's `latex.texlab_path` did. A `*_path` value is read by the rule C1 rules.

L138 Old: `:476` adds the linters to the sources and the owners `lint-<id>`.
     New: `:476` adds the linters to the sources and the owners `lint-<id>`; `:575` and `docs/files-and-search.md:85` ("never runs ChkTeX", "runs no ChkTeX") are read against the change.

L222 Old: D43's `latexmkrc:` is checked by the orchestrator at landing
     New: `latexmkrc:` unchanged

L230 Old: `tests/server/machine/approvals/approvals.test.ts` (G31), `tests/routes/sessions/compose.test.ts` (G38) and `tests/server/machine/lsp/svelte-trust.test.ts` (G55, slow, run alone) (`approvals.ts` changes);
     New: `tests/server/machine/approvals/approvals.test.ts` (G31), `tests/routes/sessions/compose.test.ts` (G38), `tests/routes/sessions/latex-approvals.test.ts` (G31, G55) and `tests/server/machine/lsp/svelte-trust.test.ts` (G55, slow, run alone) (`approvals.ts` and `pty/latex/latex.ts` change); `tests/server/machine/lsp/servers.test.ts` (G55's links row, G7) (`adapters/texlab/links.ts` and `adapter.ts` change);

L240 Old: Numbered as on main at e61cfc598.
     New: Numbered as on main at a60dcb4fa.

L244 Old: - `tools/oculus/src/lib/server/content/latex/recipes.ts` lines 230-246 (`runnable`, `onPath`) and its imports
     New: - `tools/oculus/src/lib/server/content/latex/recipes.ts` lines 230-259 (`runnable`, `programPath`, `onPath`) and its imports (:24-25)

L246 Old: - `tools/oculus/src/lib/server/machine/pty/latex/latex.ts` (its import of `onPath` at :40)
     New: - `tools/oculus/src/lib/server/machine/pty/latex/latex.ts` (its import of `onPath` at :54)
     Add: - `tools/oculus/src/lib/server/machine/lsp/adapters/texlab/adapter.ts` line 15 and `links.ts` line 17 (the import of `programPath`)

L247 Old: - `tools/oculus/src/lib/server/root/context.ts` lines 235-260 (the reader run at start, the held runs and children made)
     New: - `tools/oculus/src/lib/server/root/context.ts` lines 237-262 (the reader run at start, the held runs and children made), 269 and 754-760 (the served roots followed), 472-480 (the context's objects) and 527-553 (`close()`)

L252 Add after it: - `tools/oculus/src/lib/server/machine/lsp/adapters/web/approval.ts` and `tools/oculus/src/lib/server/machine/pty/latex/approval.ts` (lines 30 and 186), the callers of the folded key functions
                   - `tools/oculus/tests/server/machine/approvals/approvals.test.ts` (the `isLatexmkrcApproved` calls at :20, :88, :89, :100, :133, only under C5 (a))

L257 Old: - `tools/oculus/src/lib/state/system/problem-rows.ts` and `tools/oculus/src/lib/views/sources/search/Problems.svelte` (the code drawn as a link)
     New: - `tools/oculus/src/lib/views/sources/search/problem-rows.ts` and `tools/oculus/src/lib/views/sources/search/Problems.svelte` (the code drawn as a link)

L270 Old: - `tools/oculus/config/behavior.yml` (a `lint:` block after line 178)
     New: - `tools/oculus/config/behavior.yml` (a `lint:` block after line 179, before the `=== Writes` heading at line 182)

L272 Old: - `tools/oculus/config/text/statusbar.yml` (lines beside 95-125)
     New: - `tools/oculus/config/text/statusbar.yml` (lines beside 103-123)

L276 Add after it: - `tools/oculus/tests/data/sources/config/wrong-settings.ts` (a `lint:` block)
                   - `tools/oculus/tests/checks/config/config.test.ts` (the `settingFindings` key list)
                   - `tools/oculus/tests/checks/source/keys.test.ts` (a `COMPUTED_PREFIXES` entry, only if a catalog key is built from the linter id)
                   - `tools/oculus/src/lib/server/machine/lsp/relay.ts` lines 23-25 (the comment, only under C4 (a))

L285 Old: The paths D43 also writes are listed under "Shared with the steps in flight"; D36's base comes after D43's landing, and `/spec` renumbers this list there.
     New: The paths D39 also writes are listed under "Shared with the steps in flight".

L317 Old: `src/lib/state/client/context.ts:415-500` and `:600-700`
     New: `src/lib/state/client/context.ts:375-470` and `:590-700`

L318 Old: `src/lib/state/sessions/source/source.svelte.ts:540-700`: the save and `saved`; `src/lib/state/sessions/latex/builds.ts:600-635`
     New: `src/lib/state/sessions/source/source.svelte.ts:550-715` and `:220-235` (`unsavedFile`): the save and `saved`; `src/lib/state/sessions/latex/builds.ts:815-835`

L319 Old: `kit/lsp/client.ts:340-380`.
     New: `kit/lsp/client.ts:350-390`.

L320 Old: `recipes.ts:50-90` and `:225-260`;
     New: `recipes.ts:50-90` and `:225-285`;

L321 Old: 6. `src/lib/server/machine/lsp/servers.ts:1-60`; `src/lib/server/machine/approvals/approvals.ts` whole; `DESIGN.md:166`.
     New: 6. `src/lib/server/machine/lsp/servers.ts:1-100`, `:300-316` and `:612-680`; `src/lib/server/machine/lsp/adapters/texlab/adapter.ts`, `links.ts` and `settings.ts` whole; `src/lib/server/machine/lsp/held/watch.ts:158-184`; `src/lib/server/machine/approvals/approvals.ts` whole; `src/lib/server/machine/pty/latex/approval.ts:1-35` and `:175-200`; `src/lib/server/root/context.ts:236-330`, `:470-553` and `:740-770`; `DESIGN.md:166`.

L322 Old: `config/text/statusbar.yml:90-130`.
     New: `config/text/statusbar.yml:92-132`.

L323 Old: 8. `config/behavior.yml:130-182`; `config/catalogs/options.yml:640-690`; `src/lib/data/sources/config/settings.ts:500-560`.
     New: 8. `config/behavior.yml:130-184`; `config/catalogs/options.yml:600-705`; `src/lib/data/sources/config/settings.ts:500-560` and `:735-770`; `tests/data/sources/config/wrong-settings.ts`; `tests/checks/config/config.test.ts:430-470`.

L324 Old: `DESIGN.md:20-24`, `:142`, `:164-166`, `:476`;
     New: `DESIGN.md:20-24`, `:142`, `:164-166`, `:476`, `:575`;
     Old: `agents/guarded.md` G1, G2, G7, G12, G13, G28, G36, G55.
     New: `agents/guarded.md` G1, G2, G7, G12, G13, G28, G31, G36, G55.

L356 Old: `relay.ts` is 864 of 880 lines.
     New: `relay.ts` is 852 of 880 lines.

L358 Old: ChkTeX through texlab contradicts Z703 (U8) and D43 is in flight;
     New: ChkTeX through texlab contradicts Z703 (U8), under which D43 landed with texlab's ChkTeX off;

L391 Old: D43 lands first and widens G55 to "A language server, a LaTeX build's latexmk step and a weave tool";
     New: D43 has landed and G55 reads "A language server, a LaTeX build's latexmk step and a weave tool run no code of a repository ..." (`agents/guarded.md:37`), and G36 names one texlab for a root's LaTeX and BibTeX tabs (`:65`);

L399 Old: puts `.zsh` and `.slurm` under `bash` and `.bib`, `.sty` and `.cls` under `latex`;
     New: puts `.zsh` and `.slurm` under `bash`, `.sty` and `.cls` under `latex` and `.bib` under `bibtex` (`config/sources.yml:105-113`);

L401 Old: Cons: ChkTeX over `.bib` and `.sty`,
     New: Cons: ChkTeX over `.sty` and `.cls`,
```

## 5. Choices the corrections leave open

**C1. How a `lint.*_path` value is read.** This is Axel's: it sets what a config key accepts.
- (a) As `latex.texlab_path` reads its value (`adapters/texlab/adapter.ts:20-45`): an absolute path or one starting with `~`, expanded by `expandHome`. A named path that cannot be used is `not_found` naming the path, and PATH is not tried.
  - Pros: one rule for oculus's newest path key; no dependence on the server's working folder; a named program is never silently replaced by another.
  - Cons: unlike the older `latex.<tool>_path` keys, a relative path is refused.
- (b) As `latex.latexindent_path` and `latex.synctex_path` read theirs (`content/latex/endpoint.ts:477`, `:519`): handed to the runner as written, a relative path resolved against the server's working folder.
  - Pros: no new handling.
  - Cons: what a relative path means depends on where the server runs, which no document names; `~` is not expanded.
- (c) (a), falling back to PATH when the named path fails.
  - Cons: a typo runs a different program than the one named; D43 rejected this for texlab.
- The lazy option is (b). Recommendation: (a). If it is ruled, the `lint_tip_not_found_*` lines and the options help name the absolute-or-`~` rule.

**C2. How the held ESLint children hear the served roots change.** Internal; the orchestrator's choice.
- (a) Pass `followRoots` (`held/watch.ts:159`) one object whose `reconcile` calls `relay.reconcile()` and the children's own, at `server/root/context.ts:269` and `:758`.
  - Pros: one poll of the workspaces file, one subscription.
  - Cons: the relay and the children share one follower.
- (b) A second `followRoots` for the children.
  - Pros: independent.
  - Cons: two polls of the same file, two `close()` calls to keep in step.
- (c) No follow; the 15-minute idle ends them.
  - Cons: breaks item 2's "at once when its root stops being served".
- The lazy option is (c). Recommendation: (a).

**C3. What switching `lint.eslint` to `false` does to a held child.** Internal; the orchestrator's choice.
- (a) End the children at once, from the `built` hook at `server/root/context.ts:321-325`, beside D43's `relay.settingsChanged()`.
  - Pros: an off switch leaves no process that loads repository code.
  - Cons: one more line in the hook.
- (b) Leave them to the 15-minute idle.
  - Cons: a process holding the repository's config stays up to 15 minutes after the reader switched it off.
- The lazy option is (b). Recommendation: (a).

**C4. The comment at `relay.ts:23-25`, "texlab's own and ChkTeX's are kept".** The orchestrator's choice.
- (a) D36 rewords the parenthesis to say texlab sends no ChkTeX rows, since it runs none, and ChkTeX's rows are the linter's; `relay.ts:23-25` is added to the write list.
  - Pros: the comment no longer suggests a second ChkTeX route.
  - Cons: one more shared file with D39 (a comment line, a simple merge).
- (b) Leave it, since it is true of the filter.
  - Cons: a reader looking for where ChkTeX rows come from is sent to the relay.
- The lazy option is (b). Recommendation: (a).

**C5. The shape of the folded approval functions.** Internal; the orchestrator's choice.
- (a) One exported function per operation that takes the kind (`configKey(kind, text)`, `isConfigApproved(file, kind, text)`, and so on). `isLatexmkrcApproved` goes, and its callers (`pty/latex/approval.ts:186`, `approvals.test.ts:88-133`) pass `'latexmkrc'`. The test edits are listed before and after, as the spec requires.
  - Pros: one function per rule, no per-kind name to keep.
  - Cons: five assertions in a G31 test file change.
- (b) Fold the bodies but keep `isLatexmkrcApproved` as a one-line call of the general function.
  - Pros: no test edit.
  - Cons: a per-kind export for one kind and not the others.
- (c) Leave D43's copy and add a third copy for `eslint-config:`.
  - Cons: against item 2 and G21.
- The lazy option is (c). Recommendation: (a).

## Declined to judge

- Whether texlab's syntax diagnostics and ChkTeX's delimiter warnings 9, 10, 15 and 17 duplicate each other in practice: deciding it needs a texlab run, which this check does not start (not verified).
- The "Libraries checked" versions (`npm view`): that section is outside the sections this recheck covers, and I did not rerun it.
- Every line reference into the unchanged files listed in section 1: these hold by `git diff --numstat` showing no change. I re-read a sample, not every line.
- Whether D39 and D36 can run at once: that is the orchestrator's `shared_paths:` judgment. Section 4 (L89) gives the overlapping paths.
- ShellCheck is still not installed (`command -v shellcheck`: not found). Z729 has it installed by the orchestrator before the look, so it does not affect the builder's runs.

Usage: agent a171b94b2f14b66e9 (as booked at `plan.md:1788` in the working tree), claude-opus-5-5, about 85 tool uses.
