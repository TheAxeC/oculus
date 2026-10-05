# Brief check of D45, LaTeX as VS Code's LaTeX Workshop

Main's head is now 40cc596ff ("Book D45's choices and start D45, X3e and D20"), not 8077dd556. `git show --stat HEAD` shows it changes only `.scratch` ledger files, so the source tree is the tree D42 left. Every check below ran at 40cc596ff. Probes ran under `$TMPDIR/d45bc`, which was removed at the end. `pgrep -lf "latexmk|pdflatex|synctex"` printed nothing, so no probe process is left running.

## Names

Command: `grep -rn --exclude=local.yml --exclude-dir=node_modules ... <name> tools/oculus` for `menu_latex`, `ROW_LATEX`, `Open LaTeX`, `latex-editor`, `latex\.svelte`, `academic/latex`, `shared/latex`, `latexCommand`, `LATEX_STEPS`, `startLatex`, `keptLatex`, `latexFolder`, `latex-target`, `LatexTarget`, `latexDiagnostics`, `onSaved`, `auto_build`, the `*_path` keys, `'latex'`, `client.latex`, `fileBytesUrl`, `fs.bump`, `LEFT_ITEMS`. The hits outside "Paths this step writes":

1. `src/lib/views/shared/explorer/tree/control/picks.svelte.ts:140`: a comment saying "Open LaTeX join when their answers arrive". Removing Open LaTeX makes it false. The file is not in the write list.
2. `src/lib/state/sessions/terminal/commands.svelte.ts:31`: a comment naming the path `state/sessions/latex.svelte.ts`. Moving the store into `state/sessions/latex/` makes it false. Not in the write list.
3. `src/lib/state/sessions/terminals.svelte.ts:44,118,493-499`: the client side of the `latex` terminal action, `post({ action: 'latex', ...targetFields(target), main, step, cols, rows })`. The new `stop` step, the recipe name and the `-g` request all have to travel through it. Not in the write list.
4. `src/lib/data/sources/config/settings.ts:279-296` (`latexFormatting`) and `tests/data/sources/config/settings.test.ts:134`: the existing readers of `latex:` keys live here, under G13 ("settings.ts: one case per setting reader"). The brief adds eleven `latex.*` settings without naming their reader. Following the existing pattern puts the readers in this file, which is not in the write list.
5. `src/lib/server/machine/pty/sessions.ts:214`, `state/sessions/terminal/terminal-payloads.ts:30`, `data/model/model-sessions.ts:280` (job source `'latex'`): these stay true unless checkcites gets a source of its own. Item 24 says checkcites runs "as a task terminal of its own" without saying how it starts.
6. `src/lib/views/shared/explorer/tree/menu/row-menu.ts:346,366` (`rootOf: client.latex.rootOf` in `RowStores`): inside the write list's ranges. They become dead once Open LaTeX goes.
7. HELP.md and DESIGN.md sentences the change makes false that are not in the brief's list (verified with `sed -n` and `grep -n`):
   - `HELP.md:19` and `HELP.md:33` both say the Explorer page holds "Files, Repositories and Search". Choice 5 (a) adds the TeX view there.
   - `HELP.md:102` (status bar "On the left: ...") and `DESIGN.md:430` ("The left group is host, branch, sync, findings, HPC, usage and server") both become false once the `latex` item is added.
   - `HELP.md:159` says "Six views are opened for something" (the count changes when `latex` becomes listed) and "`file` (a picture, a PDF in a frame, ...)". The PDF.js viewer of choice 2 (a) makes the frame wording false. The brief only says ":159 loses `latex`".
   - HELP.md's views table (`:108-155`) gets no row for the newly listed `latex` view.
   - HELP.md's config table (`:265-276`) gets no row for the new `config/catalogs/latex.yml`.
   - `config/text/app.yml:12` holds "s1-s3 | open a view of the Explorer page's group". It is in the write list, but nothing says the chord range grows.
8. `tests/checks/source/keys.test.ts:411,463` use `server.latex.name` as synthetic fixture text. They stay true as long as the key keeps its name.
9. `tests/checks/config/config-folder.test.ts:144,230`: in the write list.

## The step line, and standing demand Z488

The D45 line is `plan.md:508` (the brief says :507). Its parts, mapped to "What to build":

1. "a `.tex` file opened in the editor is all it takes": items 15, 16 and 27. Mapped.
2. "root found from the open file (`% !TEX root`, else the folder's main)": item 1. Mapped.
3. "build from the editor's title bar, from Cmd+Alt+B and on save": items 15, 16 and 6. Mapped.
4. "the PDF opened in a tab beside the source and refreshed after each build": items 10 and 11. Mapped.
5. "SyncTeX forward and inverse": items 12 to 14. Mapped.
6. "errors and warnings as editor marks and in the Problems list": items 20 and 17 (Problems section). Mapped.
7. "the build log one click away": **not met from the editor.**
   - Item 15's title bar has only Build and View PDF.
   - Item 16 lists no Compiler Log or Build Log action, although LaTeX Workshop has the `compilerlog` command.
   - Item 18's status item opens the TeX view on a click and has no menu. Inventory 2 says "Log control | ... the status item's menu", so the inventory and item 18 contradict each other.
   - After a successful build there is no notice, so from the open file the log is at least two presses away (status item, then Logs, then Build Log).
8. "clean": items 16 and 17. Mapped.
9. "a TeX side bar view": item 17. Mapped.
10. "D14's view and Open LaTeX replaced, nothing dropped": items 27 and 17, and Inventory 2. Mapped. Two gaps are in the findings below.
11. "D15's LaTeX panel opening its PDF beside the source built here": item 11. Mapped.
12. "inventoried on TEST and against LaTeX Workshop before the brief": the LaTeX Workshop half is Inventory 1. **The TEST half has no record:** Inventory 2 is built from source `file:line` references and records nothing seen on TEST.

Against Z488 (`plan.md:1211`: a file feature works from the file opened in the editor):

1. Choosing a recipe is reachable only from the TeX view's Build node, or from a `% !LW recipe` comment typed into the file. LaTeX Workshop has a palette command for it (`latex-workshop.recipes` "Build with recipe"), and item 16 has no matching editor action.
2. Three LaTeX Workshop commands are in neither inventory: `saveWithoutBuilding` ("Save without Building"), `select-env` ("Select the current environment") and `actions`. I listed them from `contributes.commands` of `~/.vscode/extensions/james-yu.latex-workshop-10.19.0/package.json`. Under the `on_file_change` default, Save without Building is the only way to save without a build, so leaving it out drops an LTW feature, which Z468 forbids.
3. Show TeX View (Cmd+Alt+X) is bound in LaTeX Workshop with no editor condition (`!config.latex-workshop.bind.altKeymap.enabled` only). Item 16 makes it a Monaco action, so it only works with LaTeX editor focus. A workbench binding would go in `shell/keys/keys.ts`, which is not in the write list.
4. No item reaches a feature through a right-click: Open LaTeX goes, and the TeX view is a listed tab. That part of Z488 holds.

## Premises (rerun at 40cc596ff)

Line counts, from `wc -l`: all hold. `latex.ts` 326, `endpoint.ts` 287, `root.ts` 58, `tools.ts` 83, `outline.ts` 86, `reader.ts` 17, the route 26, `data/prose/latex.ts` 306, `pty/routes.ts` 628, `latex.svelte.ts` 809, `latex-target.ts` 23, `Latex.svelte` 70, `Main.svelte` 212, `Outline.svelte` 91, `Problems.svelte` 72, `Rows.svelte` 47, `places.ts` 46, `boards/project/Latex.svelte` 49, `row-menu.ts` 504, `Source.svelte` 502, `StripActions.svelte` 95, `latex-editor.ts` 65, `latex-widget.ts` 234, `kit/latex/latex.ts` 138, `File.svelte` 319.

Line references that hold (grep and sed):
- `routes.ts`: `latexCommand` :393, `startLatex` :471, job :495, dispatch :550, no `synctex` and no `outdir`.
- `latex.svelte.ts`: `autoBuildShape` :273, `onSaved` :739, `latexDiagnostics` :749, `format` :775.
- `context.ts:325-331`; `Source.svelte:205-206` and `:78-81`; `StripActions.svelte:1-11`; `keys.ts:89-103`; `palette.ts:158-174`; `LEFT_ITEMS` at `status-items.ts:14`; `shell/status` holds 8 items; `notices.svelte.ts:18-29`; `layout.yml:74-80`; Search at `group: 'explorer', order: 2`; `opening.ts:91` and `:99`; `showFolderInFiles` at `show-in-files.ts:67`.
- Config: `behavior.yml:135-140` and `:119`; `options.yml:337-358` and the `latexmk` pattern at `:257`; `sources.yml:106`; `latex.yml` 55 lines; `files.yml:92`; `server.yml:63-64`; `project.yml:116-117`; `statusbar.yml:88`.
- `package.json` has `katex` ^0.18.7 at :73, `latex-utensils` 7.0.0 at :74, `monaco-editor` 0.57.0 at :81, and no pdfjs.
- Folder counts (`git ls-tree --name-only HEAD <d>/ | wc -l`): every named folder holds as stated.
- Programs (`command -v`): all hold. `synctex -v` prints "client, version 1.21". `latexmk -v` prints 4.86a. There is no `~/.latexmkrc`.
- Tests: the G1 title at `latex.test.ts:73`; the G35 line at `terminal-actions.test.ts:145` and `:184`; the G29 title at `layout-saved.test.ts:22`.
- Hub probe (a Python read over the six folders): 232 `.tex`, 123 mains, 24 multi-main folders, 16 root comments (none declaring a class), 0 program comments, 0 subfiles, 0 literate files, largest 188779 bytes. The `.gitignore:87-95` lines hold. `git ls-files --error-unmatch` confirms the three tracked PDFs.
- L1 probe on a copied `main.pdf` and `main.synctex.gz`: `synctex view -i 78:1:<real main.tex>` gave `Page:2`.
- LaTeX Workshop 10.19.0 is installed locally, so I could read it. It has 192 settings and 9 default recipes, and its defaults are `onFileChange`, interval 1000, `%DIR%`, `ctrl-click` (which accepts `e.ctrlKey || e.metaKey` at `out/viewer/components/synctex.js:55`), `first`, and so on. All hold.
- `pdfjs-dist` 6.4.299: `npm view` shows Apache-2.0, released 2026-10-03, engines `>=22.13.0 || >=24`, 34913648 bytes unpacked. `npm pack` shows the `cmaps/`, `standard_fonts/`, `wasm/` and `web/` folders, and `web/pdf_viewer.mjs` exports all seven names. Holds.
- Probes rerun on scratch copies, all holding: case 9 (interrupt exit 12; the rerun without `-g` printed "Nothing to do for 'main.tex'"), case 13 (exit 12, no PDF, one "No pages of output"), case 16 (`-c` with `-outdir=out` kept `main.pdf` and `main.synctex.gz`), and case 6 (a folder `sp ace` with `my thesis's.tex` gave exit 12 and wrote the PDF and the `.synctex.gz`).

Premises that do not hold, or moved:
1. `DESIGN.md:148` ("Untyped input") is blank. The paragraph is at `DESIGN.md:151`, at HEAD and at 575c997c8 alike (`grep -n "Untyped input"`).
2. Ledger numbers moved:
   - D45 `plan.md:507` is now :508; Z487 :1209 is :1210; Z467 :1189 is :1190.
   - D43 :505 is :506; D36 :566 is :567; D33 :563 is :564; D15 :508 is :509.
   - The rulings range "`plan.md:1002-1053`" is wrong: Z192, Z278 and Z279 are at :1003-1005, Z299 at :1033, Z309 at :1031, Z317 and Z318 at :1044-1045, Z332 at :1054, and Z427 at :1152, so Z332 and Z427 fall outside the stated range.
   - LA19 `orchestrator-history.md:610` is now :626 (`git show HEAD:... | grep -n "LA1 to LA22"`).
3. The section says "read on main at 575c997c8", but the `row-menu.ts` numbers it gives (504 lines, :201, :240, :467-478, :495) are HEAD's. At 575c997c8 the file had 499 lines, with `latex` at :463-474 and the dispatch at :491 (`git show 575c997c8:...`). The numbers are right for dispatch; the header is wrong.
4. `File.svelte:32-37`: the frame comment is at :32-34 and the version-address comment at :36-40. The iframe is at :238.
5. `hccnet-revision/manuscript/main.tex` has 21 `\input{sections/...}` lines. The 22 is the count of `.tex` files under `sections/` (`grep -n "\\input"`, `find sections -name '*.tex' | wc -l`). L3's "across its 22 inputs" should say 21.
6. The brief's line 191 says D15's line "is for the orchestrator to rewrite". Z503 has already rewritten it (`plan.md:509` at HEAD).
7. **A premise of item 6 that the tree does not support.** The `files` channel payload is `FilesPayload = { root: string; bookmarks?: boolean }` (`data/model/model-sessions.ts:666`). `server/root/watch/git.ts:237` publishes it per root, throttled to at most one re-read every two seconds (`THROTTLE = 2000` at :77; DESIGN.md:116). `mergeFiles` (`server/files/files-channel.ts`) folds pending messages into the newest root. A message therefore never says which file changed. Item 6 ("builds a root when a file of its dependency set changes ... Changes are taken from the `files` messages the fs store already receives") and case 11 ("a write to the root's own `.aux` or `.pdf` builds nothing"; "ten writes within one second") cannot be met from the message alone. The build's own writes of `.aux`, `.log` and `.pdf` would also publish a message for the root. Either the store stats the dependency set on each message, or the payload carries paths. The second touches `model-sessions.ts`, `git.ts` and `files-channel.ts`, none of which is in the write list. The brief names neither.

## Cases and checks against spec.md and guarded.md

1. Tests are confined to G1, G29 and G35, which keeps to guarded.md. But case 24's "a finding" for a duplicated recipe name, and the new `latex.*` readers, fall under G13 (`guarded.md:71-73`, "settings.ts: one case per setting reader"). guarded.md:3 says an entry keeps one test per unit it covers, while the brief's test list leaves G13 out. That clash needs a ruling in the brief.
2. Synthetic fixtures: the run cases name scratch folders. Holds.
3. Real folders, case 17: "or a root such as `claude`". No `claude` root is in `config/sources.yml:88-94` (the roots are cathedra, game-engine, ordo, scotoma, officium and youtube-downloader; `local.yml` was not opened). Read as written, the case builds in a real root.
4. Real folders, look cases L1 to L6 and L12: these open real files in place on Axel's running server, while the new default `latex.auto_build: on_file_change` (Z503) is in force. Nothing in the brief stops a build of a watched real root, so any write under the hub would trigger one. Three of those roots hold tracked PDFs a build would rewrite: `proposal-ls/main.pdf`, `fwo-postdoc/main.pdf` and `thesis.pdf`. The before-and-after `git status --porcelain --ignored` detects the damage after the fact; it does not prevent it.
5. No process left running: the look's cleanup (`rm -rf $TMPDIR/d45-look`, close tabs, remove the folder) does not end the kept tmux build terminals of the copied mains. G28 says a page detach leaves tmux running.
6. Cases that need a page or a DOM: 10, 12, 18, 19, 20, 21 and 22 cannot be run by a builder. spec.md:61 sends DOM behaviour to the look and the brief names no dev-server port (spec.md:38). Yet the brief asks "each checked by a run the report quotes", and none of these seven is in the look list L1 to L14. Case 12 is in it only for "keeps its page" (L8); zoom and scroll are not.
7. Verify item 5 and spec.md:63: a G1 row "refuses a request without the token" for `forward`, `inverse` or `texdoc` passes on the unchanged tree. `handleLatexPost` calls `tokenedBody` before reading the action (`endpoint.ts:274-277`), so it already answers 403. The row cannot show the required failing line.

## The question: could it pass without the goal?

1. Case 5 (root walk cost) prints times with no bound, so it passes at any cost.
2. Case 6 against item 2. LaTeX Workshop's default `latexmk` tool is `-synctex=1 -interaction=nonstopmode -file-line-error -pdf -outdir=%OUTDIR% -auxdir=%AUXDIR% %DOC%` (local `package.json`). `%DOC%` is the absolute path without its extension (`out/src/utils/utils.js:333-347`). Case 6 expects `-outdir=<out> 'main.tex'` with no `-auxdir`. A builder who copies LTW's defaults fails case 6; one who meets case 6 departs silently from "LaTeX Workshop's defaults".
3. Item 16 and choice 7: the look's key events do not pass through Chrome's menus, as the brief itself says. So Cmd+Alt+B, J and C and Cmd+L can be taken by Chrome while the step passes. No check in the step settles it.
4. Items 22 to 26 have no run case and no look line: the environment commands, chords, Enter `\item`, `@` suggestions, selection ranges, Math Symbols, Math Preview, the citation browser beyond L8's one insert, BibTeX Align and Sort, checkcites, texdoc beyond case 23's refusals, Reveal Output Folder, External Viewer, and View in Web Browser with SyncTeX over a `BroadcastChannel` (Z503's choice 2 (d)). Item 20's bad boxes as warnings and item 21's paint limit (case 18, not in the look) are also unchecked. Z467 requires the look to exercise the feature, and all of these could be missing while the step passes.
5. The G29 test row passes on the unchanged tree, because the id is kept and `layout/saved/` does not change. The behaviour itself, opening the TeX view on the folder's first main, is in the view, and only case 21 covers it, which is outside the look.
6. The rule that a hover or completion kind texlab lacks "is built in D45's providers" (Inventory 1, line 111) has no item and no case, so it could be absent.
7. Item 4 (`stop`): the G35 row proves only which terminal receives Ctrl+C. The engine ending within 2 s is case 9, which needs a run the report quotes, and L10 shows it at the look. Holds.
8. Items 1, 13, 14, 15, 18, 19 and 27 are each tied to a look line (L1 to L5, L8 to L10, L14). Holds.

## Implied inputs

Each missing input, with the result it should state:

1. The text of the probe's `chap/one.tex`. Without it, case 14's "x 157.01, y 211.35" and case 15's "line 3" cannot be reproduced. My probe, with different text, gave `Page:1 x:133.77 y:134.76`.
2. Which record wins when `synctex edit` answers several, and what `Column:-1` maps to. My probe answered two records (`Line:2` and `Line:3`, both `Column:-1`). Expected: the first record, with the column absent.
3. How the placeholders resolve (absolute or relative, with or without the extension), `%AUXDIR%` and LTW's `latex.auxDir` (default `%OUTDIR%`), and whether `-auxdir` is in the default line. Expected: case 6's exact line, derived from them.
4. The mechanism of `on_file_change` under a root-only, two-second-throttled `files` message, as described under Premises.
5. Where the new `latex.*` keys are read, and whether G13 applies to them. Expected: readers beside `latexFormatting` in `settings.ts`, with G13 rows.
6. The Math Preview view's id, registration and folder. A new view id is user-visible (spec.md:18).
7. Choice 2 (d): the standalone viewer page's route path, its `BroadcastChannel` name and message shape, and where it lives. No `src/routes` path is in the write list.
8. How `cmaps/`, `standard_fonts/` and `wasm/` are served "by fixed names": a route, a static copy, or a Vite config change. None of these is in the write list.
9. Where the PDF viewer's words go. `config/text/views/sources/file.yml` (25 lines) is the file view's catalog and is not in the write list. The words do not belong in the `latex` group, since the viewer draws every PDF.
10. The root and the title bar of a `.bib`, `.sty` or `.cls` tab, which `sources.yml:106` maps to `latex`. Item 1 covers only `.tex` and the literate kinds. Expected: the folder rule, else none.
11. How a status item failure is set by a refusal that starts no terminal (case 7).
12. Where "after a stop" is remembered, so that the next build passes `-g` (item 4).
13. Whether the Monaco providers of section D register through `ui/controls/editor/kit/load.ts`, as Format Document does (`createFormatting`, :94-102). That folder is full (10 items), and `load.ts` is not in the write list.
14. The base copy (`git archive ... src tests utils config`) holds no `HELP.md`, `DESIGN.md`, `package.json` or `package-lock.json`. The `diff -rq` file table of spec.md:34 will not show those changes.
15. Z503's values are not in the brief (`grep -n Z503 D45.md` prints nothing). Items 6, 7 and 10 and Inventory 2 still say "choice 1", "choice 2", "choice 4" and "choice 6".
16. If S5 lands first, the `heading:` and `section:` of each new `options.yml` entry, and the controls under S5's vocabulary (`path` with `empty: true` for `synctex_path`, a record list for `recipes` and `tools`).

## ADRs

`ls tools/oculus/docs` prints only `diagrams`. `ls tools/oculus/docs/adr` reports no such folder. `grep -n -i "^\s*adr" .agents/plan.yaml orchestrator-state.md` prints nothing. There are no ADRs, as the brief says.

## Dictated text

`LC_ALL=C grep -c '[^ -~]' D45.md` prints 0, so the brief is ASCII. `grep -n -- ' - \| -- \|---'` hits only the table rules at :52 and :116. The longest lines, :9, :43 and :145, are single paragraphs with no hard wraps.

1. `D45.md:167`, the label "LaTeX" and the node names (Build, Clean, Kill, View PDF, View in Tab, View in Web Browser, View in External Viewer, Refresh Viewers, Logs, Compiler Log, Build Log, Navigate, Select and Edit, Insert Root Comment, Miscellaneous, Citation Browser, Count Words, Reveal Output Folder, texdoc, BibTeX, Align, Sort, Align and Sort, checkcites): holds. "LaTeX" equals the existing `views.latex` in `latex.yml`.
2. `D45.md:168`, "Build": holds.
3. `D45.md:169`, "The LaTeX build of <main> failed", with Open Compiler Log and Show Problems: ASCII and dash-free, holds. One convention to note: the catalog's notices end with a period (`statusbar.yml:134`, `notice_job_failed: '... exit code {3}.'`).
4. `D45.md:166`, the action names of item 16: holds.
5. `D45.md:292`, "refused rather than run beside the build": a contrast phrasing next to spec.md:20's ban. This is a decision line, so it holds.

## Shared paths

Both in-flight worktrees were read with read-only git (`git -C .agents/worktrees/<w> diff HEAD`). The round-2 brief of X3f does not exist yet (`ls agents/briefs/X3f*` lists only `X3f.md`, `X3f-round1.md` and `X3f-cases.md`).

X3f (worktree at ec4c6f577 with its backed-out patch applied):
1. `StripActions.svelte`: X3f moves it to `views/shared/links/StripActions.svelte` (122 lines, widened to every file tab). D45 writes it at the old path. **Not simple:** D45's title bar has to be rebuilt on X3f's shared component.
2. `Source.svelte`: both change the StripActions call around HEAD :380-402. **Not simple.**
3. `File.svelte`: X3f changes 60 lines (its controls handed up through `useTabActions`). D45 replaces the iframe at :238 and its head comment. **Not simple.**
4. `DESIGN.md:395`: both rewrite the same line. **Not simple:** a line conflict.
5. HELP.md's "Six views" paragraph (HEAD :159): both rewrite it. **Not simple.** HELP.md :120 and :163 are separate from X3f's hunks.
6. `row-menu.ts`: X3f's hunks are the imports and the `ROW_PREVIEW` branch. D45's are :70, :240, :467-478 and :495, with four unchanged lines between :495 and X3f's branch. Simple.
7. `files.yml`: X3f adds a line after its :149; D45 removes :92. Simple.
8. `docs/diagrams/`: regenerated. Simple.

S5 (worktree at 6005baee6, with Q119 folded):
1. `config/catalogs/options.yml`: S5 rewrites every entry, the latex entries included (`heading: editor`, `section: LaTeX`, path controls). D45 changes `latex.auto_build` and adds about eleven entries. **Not simple:** the same hunks, and the new entries need S5's fields.
2. `DESIGN.md`: S5 changes :408 and D45 :409. **Not simple:** a scratch git repository showed that changes on adjacent lines conflict (`cherry-pick exit 1`, `UU f`).
3. `HELP.md`: S5 changes :154, :157, :261 and :274. D45's own lines do not collide, but the missing `catalogs/latex.yml` row of the config table would sit next to S5's :274 row.
4. `config/text/server.yml`: S5 adds after :31 and :52; D45 changes :63-64. Simple.
5. `pty/routes.ts`: Q119 changes the `loadLocalOrDefaults` call in `latexFolder` (HEAD :433), which is inside D45's range :380-520. **Not simple** if D45 rewrites `latexFolder`.
6. `settings.ts` and `settings.test.ts`: Q119 writes both. D45 needs them (Names, finding 4). **Not simple.**

Overall: D45's merges with both X3f and S5 are not simple. The brief's own rule is that a step whose merge would not be simple waits.

## Choice 8, Z504 (Docker and Live Share)

The brief recommends (b) for both. Z504 (`orchestrator-state.md:158`) adds an option (c), "Docker built, Live Share left out", which the brief's choice 8 does not list. Z504's (a) says "no LaTeX Workshop feature dropped", yet it names only Docker. Since oculus has no shared-session layer, (a) as written also drops Live Share, which makes (a) the same as (c).

What changes under each option:
- **(a) or (c), Docker built:**
  - Configuration: three keys, as LaTeX Workshop has three (`docker.enabled` false, `docker.image.latex` "", `docker.path` "docker"). The brief names only `latex.docker_image`. Each key needs a `behavior.yml` entry, an `options.yml` entry (which collides with S5) and a reader.
  - Item 2: the PATH lookup changes to look up `docker`, and the placeholders take the bare file name (`utils.js:347`, `docker ? docfile : doc`).
  - Item 12: SyncTeX must translate container paths back to host paths.
  - No case or look entry can run, because `command -v docker` prints nothing. Every Docker claim stays "not verified", and Z467's look cannot exercise it.
- **(b), both left out:**
  - Inventory 1's rows :107-108 become "dropped by Z504".
  - Nothing is built, and the item 28 rewrite of DESIGN.md names neither feature.
  - Z468 holds only through Axel's explicit yes.
  - No path or case changes.

## Declined to judge

1. LaTeX Workshop source line references that only GitHub source would confirm: `executor.ts:148,167`, `plan.ts:251-265`, `activity-bar.ts:19-75`. The brief cites both `executor.ts:413-424` (:76) and `:406-424` (:291). The local extension ships only compiled `out/`.
2. Whether Chrome hands Cmd+Alt+B, J and C and Cmd+L to the page (choice 7). Settling it needs a real keystroke.
3. Which hover and completion kinds texlab lacks (the D43 boundary).
4. Whether about 40 behaviours fit one step, and the design merit of choices 1 to 7 and 9 (ruled under Z503).
5. Visual parity with VS Code's LaTeX Workshop.

Usage: ordo-high on claude-opus-5-5 (a57c2197995fd04d5), 276,990 tokens, 109 tool uses, 14.5 min.
