## D45 brief recheck on main c0a4af9c

**Where the brief was last checked.** The brief's "What is on the tree" heading still says `f073b0494`. The premise recheck (`agents/reviews/D45-premise-recheck.md`) ran at `0d316064c`, on source equal to `10ac00c69`. None of that recheck's corrections were applied to the brief, so every line number in the brief is still the `f073b0494` one.

**What has landed since.** `git log --oneline 0d316064c..HEAD -- tools/oculus/src tools/oculus/config tools/oculus/tests tools/oculus/DESIGN.md tools/oculus/HELP.md tools/oculus/package.json tools/oculus/docs tools/oculus/utils` lists 11 source commits:
- Q123 `02ac124e`
- PR1 `687cd1d5`
- E4g `c86f10f2`
- O30b `4ce24363`
- Q124 `abf4356c`
- `548004bc` (decks from any folder)
- Q125 `e7952e16`
- D23 `797e1e5d`
- Q126 `6561f82a`
- PR3 `a2901490`
- D23c `c0a4af9c`

All old hashes still resolve (`git rev-parse --verify`). Paths are under `tools/oculus/` unless stated otherwise.

## Premises with verdicts

### Header, plan line and rulings
Commands: `grep -n "^- <id> " plan.md` for each id; a Python comparison of the plan line with the brief's quote; `grep -n "LA1 to LA22" orchestrator-history.md`.

| Brief line | Premise | Output now | Verdict |
|---|---|---|---|
| 3 | `DESIGN.md:151` Untyped input | `163:` | false. Correction: `DESIGN.md:163` |
| 3 | no `docs/adr`; no `adr:` key | `ls docs/adr` gives "No such file"; `grep adr` over `.agents/plan.yaml` and the state file gives nothing | holds |
| 9 | the plan line is at `plan.md:510` and the text is unchanged | line `519:`; the quoted text matches as a prefix, and the line now ends ` (ruling Z671)` | false. Correction: `plan.md:519`, with " (ruling Z671)" added to the end of the quote |
| 11 | the sub-line is at `:511` | `520:`, text unchanged. New sub-lines at 521 (the recheck), 522 (Step 0 stopped on Z671) and 523 (Z671 closed) | false. Correction: `:520`; name 521-523 |
| 14-21 | Z487 :1213, Z467 :1193, Z468 :1194, Z488 :1214, Z503 :1229, Z504 :1255, Z509 :1233, Z536 :1252 | 1259, 1239, 1240, 1260, 1275, 1327, 1279, 1298 | false. Correction: those numbers |
| 18, 222, 224-227 | Z503 choice 2 (d) and Z541: View in Web Browser on a `/pdf` page, with SyncTeX over a `BroadcastChannel` | `plan.md:1444` Z671 (Axel): "This replaces the bare `/pdf` viewer page (Z541's "View in Web Browser") and the jump over a `BroadcastChannel`" | false: replaced by Z671. See the corrections below |
| 22 | `orchestrator-history.md:661` | `761:` | false. Correction: `:761` |
| 22 | `briefs/D15.md:7` and `library-audit.md:216-223` (LA19) | `D15.md:7` names LA19's subject; `library-audit.md:216` is `### LA19.` | holds |
| 24 | Z192, Z278, Z279 at :1006-1008; Z309 :1034; Z299 :1036; Z300 :1037; Z303 :1040; Z317, Z318 :1047-1048; Z332 :1057; Z427 :1155 | Z192, Z278, Z279 are "Open item" lines at 1052-1054; the others at 1080, 1082, 1083, 1086, 1093-1094, 1103, 1201 | false. Correction: those numbers, with the grep `grep -n "Z192\|Z278\|Z279"` |
| 25 | D43 :508, D36 :570, D33 :567, D15 :512; none landed | 516, 591, 587, 524; none ticked (`grep -c "✅"` prints 0). `queue.md` shows D43 and D33 "being prepared" | holds that none landed. Correction: the line numbers |
| 222 | D15's line at `plan.md:512` | `524:` | false. Correction: `:524` |
| 224-228 | Z540 to Z542 | 1300, 1301, 1302 | holds |

### What is on the tree

| Brief line | Premise | Command and output now | Verdict |
|---|---|---|---|
| 27-29 | read at `f073b0494`; only D42 and S5 changed source | the 21 source commits since `f073b0494` (`git log ... | wc -l`) | false. Correction: "read on main at c0a4af9c" |
| 33 | `git archive` list for the base copy | the user guides now live in `docs/` (`ls docs`: apps, configuration, files-and-search, source-control, terminals, views, window) | false: incomplete. Correction: add `tools/oculus/docs` to the archive list |
| 34 | `latex.ts` 326 lines with its functions and HEAD_BYTES 65536 | `wc -l` 326; `grep -n "export function"` lists them; `HEAD_BYTES = 65536` at :35 | holds |
| 35 | `latex/` 5 items: endpoint 287, root 58, tools 83, outline 86, reader 17; `tokenedBody` at `endpoint.ts:274-277`; `rootOf` and `TOOL_TIMEOUT_MS` 20000; route file 26 lines | `wc -l` prints the same; `endpoint.ts:274` `tokenedBody`, :276 `formatShape.safeParse`; `root.ts:55`; `tools.ts:16` | holds |
| 36 | `data/prose/latex.ts` 306 lines and its exports | `wc -l` 306; `grep -n export` lists all of them | holds |
| 37 | `routes.ts` 627 lines; LATEX_STEPS :89, latexStepShape :93, latexFolderShape :99-102, latexCommand :393, latexFolder :410, keptLatex :444, startLatex :470, job :494, dispatch :549, hub read :432; no synctex or outdir | 656 lines; :90, :94, :100-103, :420, :437, :471, :497, :521, :576, :459; `grep synctex\|outdir` prints nothing | false on the numbers, the rest holds. Correction: those numbers; LATEX_SWITCH :408, latexName :431 |
| 38 | `latex.svelte.ts` 813 lines; createLatex :317, onSaved :743, latexDiagnostics :753, format :779, buildsOnSave :654-660, NEVER :211, import :49 | `wc -l` and `grep` print the same | holds |
| 38 | `settings.ts:414-420` | latexAutoBuild at 497-502 | false. Correction: `settings.ts:497-502` |
| 38 | `context.ts:325-331` | createLatex :367; the save callback :371-374 with `latex.onSaved` at :373 | false. Correction: `context.ts:367-374` |
| 38 | `latex-target.ts` 23 lines, `LatexTarget` | 23; :8 | holds |
| 39 | `settings.ts` 457 lines; latexFormatting :396-412; latexAutoBuild :415-420; PROBLEM_READERS :438-440 | 541 lines; its type at 471-475; latexFormatting 478-494; latexAutoBuild 497-502; PROBLEM_READERS 505-525, latex entries at 523-524 | false. Correction: those numbers |
| 39 | settings.test describe :364-391; wrong-settings latex :12-18; config.test 'settingFindings' :397-441 with keys :424-428; `data/sources/config` 10 items | :307-328; :13-19; :401-484 with keys :429-433; 10 | false on the numbers. Correction: those numbers |
| 40 | `Latex.svelte` 70 lines, id `latex`, group `''`, unlisted; `shared/latex` sizes; `boards/project/Latex.svelte` 49; `Project.svelte:172` | same sizes and registration; `<Latex {id} />` at `Project.svelte:169` | holds except the line. Correction: `Project.svelte:169` |
| 41 | `row-menu.ts` 504 lines and its anchors | 601 lines. ROW_LATEX :81; fact type :125; fact :237-242; `isTex` :144-147; group :292-297; uses :330, :370, :383; `rootOf` :417, :440; `latex(row)` :534-556; Download :584; dispatch :589; `fileUrl` import :45 | false. Correction: those numbers. Also new: the `latex` group array (:292-297) now also holds PR3's Open Presentation, New Presentation and New Presentation from Outline. Removing Open LaTeX keeps that group, so it should be renamed rather than deleted |
| 42 | `Source.svelte` 512 lines; latexEditor at :214-215 | 520 lines, at the 520 limit. The LaTeX extension is chosen in `language/extension.ts:27` (`choice.language === 'latex' && !choice.version`) and built at `language/tab-language.svelte.ts:54` | false. Correction: see the corrections below |
| 42 | `StripActions.svelte` 95 lines, drawn at :391-408 | `grep -rn StripActions src` prints nothing. `actions/BarActions.svelte` (140 lines) is drawn in the `barActions` snippet at :401-415 and handed up by `handUp` at :352-361 | false |
| 42 | `latex-editor.ts` 65 lines, `fileUrl` at :16 and :54 | now `views/sources/source/language/latex-editor.ts` (moved by D23), 65 lines, :16 and :54 | false on the path. Correction: `language/latex-editor.ts` |
| 42 | palette at `Source.svelte:263-285`, onactions :468 | `actions` :289, `own` from `tabActions` :291 on, onactions :477 | false. Correction: those numbers |
| 42 | `kit/latex/` holds latex-widget.ts 234 and latex.ts 138 | same | holds |
| 43 | X3f round 3 is a forecast | X3f landed. `source/` holds 8 items: Editor.svelte, Gutter.svelte, Source.svelte, actions, language, save, source-gutter.svelte.ts, status (`git ls-tree`). `actions/`: BarActions.svelte, read-again.ts, ReadAgainButton.svelte, submit-job.svelte.ts. `language/`: extension.ts, latex-editor.ts, lsp.ts (487), symbols.ts, tab-language.svelte.ts. `keys.ts`: the `save` kind at :56 and `savesFile` at :122 | false. Correction: replace the bullet with this landed tree |
| 44 | `File.svelte` 319 lines draws an unsandboxed iframe at :238 | 285 lines and no `<iframe>`. It describes a `pdf` frame at :180-190 and draws `FrameSlot` at :238-239. The frame comment is at :32-38, the version comment at :40-45, the address at :107. The iframe is `shell/frames/FrameLayer.svelte:197-204` (the last branch), and the kind is `tab-frames.svelte.ts:31` | false. Correction: those places, and these files are now ones D45 writes |
| 45 | `fileBytesUrl` at `fs-transport.ts:205-212`, re-exported at `fs.svelte.ts:122`; its callers; `fileUrl` with 4 callers | `fileBytesUrl` callers: `fs-transport.ts:371`, `fs.svelte.ts:582`, `File.svelte:107`, `pages.ts:508`, `row-menu.ts:578`. `fileUrl` callers: `row-menu.ts:584`, `language/latex-editor.ts:54`, `Document.svelte:83`. `Panel.svelte` no longer calls it (it uses `panel.src`) | false. Correction: 3 callers; see item 29 below |
| 46 | `keys.ts:89-103` defaultCommand; `s` chord at :169-183; palette :159-175, `editorItems` :163 | doc 98-104 and function 105-114; chords 234-249; `editorItems` at :167 (doc :164) | false. Correction: those numbers |
| 47 | LEFT_ITEMS :14, RIGHT_ITEMS :17-27, folder 8 items; notices at :18-29 | LEFT_ITEMS :30, RIGHT_ITEMS from :33, head comment :1-23; 9 items (D23 added `LanguageItems.svelte`); notices :15-30 | false. Correction: those numbers |
| 48 | side pane at `layout.yml:74-80`; Files 0, Repositories 1, Search 2, keys `s1-s3`; D11 adds orders 3 and 4 | side pane at `layout.yml:82` (in the split at 76-83). D23's `references` is order 3 (`References.svelte:10`), and the keys sheet reads `s1-s4` (`app.yml:12`, `HELP.md:46`) | false. Correction: "References order 3 (D23); the sheet is `s1-s4`; D11's planned `debug` at order 3 collides with References, which is D11's concern" |
| 49 | `openBeside` at `opening.ts:91`, `openInPane` at :99; `showFolderInFiles` at `show-in-files.ts:67` | :91 and :99 hold; `showFolderInFiles` is at `state/workbench/layout/open/show.ts:69` | partly false. Correction: `show.ts:69` |
| 50 | `behavior.yml:132-140` | `# === LaTeX` :128, comments :129-130, `latex:` :131, keys :132-136 | false. Correction: `behavior.yml:128-136` |
| 50 | `options.yml:530-564`; head :9-12; themes :15-29; latexmk :375; control words | entries 527-561; controls named at :10-11; `themes:` at :16; latexmk default at :375; `auto_build` `control: choice`, `values: [on_save, never]` | false on the numbers. Correction: those numbers |
| 50 | `sources.yml:106` | `110:  latex: [.tex, .latex, .bib, .sty, .cls]` | false. Correction: `:110` |
| 50 | `behavior.yml:119` paint limit | `:115` | false. Correction: `:115` |
| 50 | `latex.yml` 55 lines; `files.yml:92`; `server.yml:85-86`; `project.yml:116-117`; `statusbar.yml:88`; `file.yml` 25 lines; `app.yml:12` | 55 lines; `menu_latex` at :102; `latex:` / `name:` at :127-128; :118-119; `statusbar.yml:121` (`language_latex: LaTeX`); 23 lines; `app.yml:12` now holds `s1-s4` | false. Correction: those numbers |
| 51 | katex :73, latex-utensils :74, monaco :81; pdfjs-dist goes between nodemailer :83 and seti-ui :84 | :82, :83, :90; nodemailer :92, penpal :93, pyright :94, seti-ui :95 | false. Correction: "between `nodemailer` (:92) and `penpal` (:93)" |
| 52 | programs | `command -v` finds latexmk (4.86a), synctex ("version 1.21"), the engines, bibtex, biber, texcount, chktex, latexindent, texdoc, checkcites, makeindex, makeglossaries, tex-fmt and Rscript; texlab, tectonic, julia, pweave and docker are absent; no `~/.latexmkrc` | holds |
| 53 | full folders and room | full (10): views/sources, state/sessions, state/sessions/terminal, state/sources, ui/controls/editor, kit, data/sources/config, state/workbench, views/shared, **server/content**, **shell/keys**, **src/routes**. Not full: views/sources/source 8, shell/status 9, views/shared/links 9, routes/api/(files) 9, source/language 5, source/actions 4. Unchanged: file 1, academic 3, academic/latex 1, shared/latex 5, kit/latex 2, content/latex 5, config/catalogs 8, (sessions) 6 | false. Correction: these counts |
| 54 | `latex.test.ts:73`; terminal-actions :128, :145, :158, :184, :202; settings.test 364-391; wrong-settings 12-18; config.test 424-428; config-folder :144, :230; boundaries :106-109 and :162; keys.test :411, :463; `sessions-fixture.ts:91`; G29 test :22 | :73; the five terminal-actions lines hold; 307-328; 13-19; 429-433; :143, :233; :116-119 and :179; :420, :472-473; :91; :23 | partly false. Correction: those numbers |
| 55 | the hub's real cases | a Python walk prints 232, 123, 24, 16, 188779 and 0 literate files; no `% !TEX program`; no `subfiles`; hccnet has 21 `\input{sections/` and 22 files; `.gitignore:87-95`; `ls-files` finds the three tracked PDFs; every look file exists | holds |
| 56 | `model-sessions.ts:666`; `git.ts:237` and `THROTTLE` at :77; `files-channel.ts:8` | :672; publish at :243, `THROTTLE = 2000` at :78; :8 | false on the numbers. Correction: those numbers |
| 57 | LaTeX Workshop 10.19.0: 192 settings, the latexmk args, outDir, auxDir, recipe default, autoBuild, 9 recipes, unbound commands, `utils.js:333-347`, `logger.js:148` and :199-205, `commands.js:335-338` | a Python read of its `package.json` and `sed` of the `out/` files print all of these | holds |
| 63-126 | LTW `src/compile/executor.ts:148,167,413-424`, `plan.ts:251-265`, `activity-bar.ts:19-75`, `viewer/components/synctex.ts:61-67` | only the compiled `out/` is installed | not verified |
| 59 | the DESIGN and HELP paragraphs | Q125 and Q126 rewrote both. `HELP.md` is 160 lines and has no LaTeX at all (`grep -n -i latex HELP.md` prints only the Present row). The paragraphs now live in the places listed under corrections | false |
| 59 | `picks.svelte.ts:137-141`; `commands.svelte.ts:31`; `Project.svelte:21-23` | :164-170 (Open LaTeX at :169); :31 holds; :21-23 holds | partly false |
| 59 | `README.md` names no LaTeX | `grep -n -i latex README.md` prints nothing | holds |
| 59 | DESIGN.md:23 stays D36's | :23 still names "LaTeX builds, PDF reading" | holds |

### Inventory 2

| Premise | Now | Verdict |
|---|---|---|
| `context.ts:331` (build on save) | `:373` | false |
| `File.svelte:36-40` (the version on the PDF's address) | `:40-45` | false |
| `options.yml:375` (the latexmk process pattern) | `:375` | holds |
| `row-menu.ts:70,103,...` | the new numbers in the line 41 row above | false |
| `Project.svelte:172` | `:169` | false |
| `files.yml:92` | `:102` | false |

Missing surfaces:
- Open in Browser Tab in the row menu (`row-menu.ts:322-323`) and in the tab menu (`shell/panes/strip/tab-menu.ts:126`). Z671 renames it to Open in Browser.
- Present's figure address: `data/sources/deck/files.ts:76` `fileAddress`.

### What to build, Cases, Paths, Read, Verify

| Item | Premise | Now | Verdict |
|---|---|---|---|
| 2 | `shell-word.ts:10` | `:11` | false |
| 4 | `terminals.svelte.ts` :117-120, :488-499 | type member 127-133; function 485-497, post at :496; import :49; `LatexStep` :110-111 | false |
| 6 | `latex.svelte.ts:654-660` | holds | holds |
| 10, 16, 21, 226, 330 | "X3f's `bar` place of `ui/tabs/tab-actions.svelte.ts`" | there is no named place; one snippet per tab is handed up through `handUp` (`tab-actions.svelte.ts:74`) | false |
| 10 | `kit/workers.ts` uses `?worker` | `workers.ts:10-14` | holds |
| 10, 11 | the PDF is drawn in the file view | it is drawn in the frame layer, which keeps the document across layout changes (`tab-frames.svelte.ts:1-15`) | false. A viewer drawn inside the pane would reload at every layout change |
| 12 | `tokenedBody` reads the token before the action | `endpoint.ts:274-277` | holds |
| 15 | View in External Viewer "through the open route" | `api/(files)/open/+server.ts:1-6` opens only the application `open.program_ext` names. `.pdf` is not in `behavior.yml:187-197` | false. This is Stop 4 |
| 16 | `Source.svelte` 518 lines; the folder stays 10; `latex-editor.ts` moves to `latex/` | 520 lines; 8 items; the file is in `language/` | false |
| 17 | `app.yml:12` `s1-s3` | `s1-s4` | false |
| 18 | `layout.yml:80`; the `views.latex` word exists | `:82`; `latex: LaTeX` at `config/text/views/academic/latex.yml:54` | false on the line |
| 19 | LEFT_ITEMS | `status-items.ts:30` | holds; renumber |
| 20 | `statusbar.yml:134`: notices end with a period | the notices are at :164-167 and end with "." | holds; renumber to `:164-167` |
| 21 | `LatexDiagnostic` carries `source: 'latex'` | `latex.svelte.ts:125-132` | holds |
| 24 | providers register through the LaTeX `EditorExtension` | `language/extension.ts:26` returns the served extension instead when a language server serves the file, so once D43's texlab serves `latex` the LaTeX extension (markers, hover, Format, D45's providers) is not added | new premise. This is Stop 3 |
| 26 | `pty/sessions.ts:214`, `terminal-payloads.ts:30`, `model-sessions.ts:280` | :227, :30, :280 | first false; the other two hold |
| 29 | four `fileUrl` callers, including `Panel.svelte:14,32`; `Document.svelte:45,65` | 3 callers; `Document.svelte:61,83`. Two more copies of the same address exist: `sourceFileUrl` (`state/sessions/source.svelte.ts:211`, used at :231) and `fileAddress` (`data/sources/deck/files.ts:76`, used at `deck/read.ts:326`). Hub-only builders: `views/shared/card/card.ts:66-72`, `state/boards/collection.ts:294` | false |
| 30 | `rootOf` in `RowStores` at :346, :366 | :417, :440 | false |
| 31 | `behavior.yml:132-140`; `badness_path` at :558-564 | 128-136; 555-561 | false |
| 32 | DESIGN :395/:409/:430; HELP :19/:33/:102/:120/:122/:136/:159/:163/:270 | see the docs correction below | false |
| Decision 3 | `% !TEX program` is documented in `HELP.md:163` | it is at `docs/views.md:243` | false |
| Decision 4 | no CJK file name | `find ... -name '*.tex' | LC_ALL=C grep -c '[^ -~]'` prints 0 | holds |
| Libraries | `pdfjs-dist` 6.4.299, engines `>=22.13.0 \|\| >=24` | `npm view` prints 6.4.299 (still the latest) and those engines | holds |
| 344-348 | X3f, D20 and D44 are in flight | all three landed. `queue.md`: X3e, PR4, M8, D43, D23b and D33 are being prepared; D43 and D33 have no brief yet | false |
| Verify 1 | `~/.claude/skills/land/templates/checks.sh` exists; `npm run diagrams` and `test:quick` | present; `package.json:15`, `:21` | holds |
| Verify 4, 2 | `spec.md:97` (ASCII gate), `:25` (token discipline) | both hold | holds |
| Cases | `spec.md:61` (a builder has no page) | :61 says a behaviour that needs a DOM is seen at the look; :38 is the port rule | holds as a paraphrase |
| Verify 3 | `utils/folder-check.sh`, `unused-exports.sh` | both exist | holds |

The probe outputs of cases 6, 7, 9 and 12 to 16 were not rerun, since running them writes build files. TeX Live's versions are unchanged (`latexmk` 4.86a, `synctex` 1.21).

## Corrections for the brief

1. **Line 3:** replace `DESIGN.md:151` with `DESIGN.md:163` (`grep -n "Untyped input" DESIGN.md`).

2. **Lines 9 and 11:** `plan.md:519`, with the quote ending "(ruling Z487) (ruling Z671)"; the sub-line at `plan.md:520`; add "sub-lines 521-523: the premise recheck, Step 0 stopped on Z671, Z671 closed".

3. **Lines 14-25 and 222:** use the ruling and step numbers from the first table. Add a ruling: "Z671 (`plan.md:1444`, the user): a PDF offers Open in New Tab (an oculus tab with oculus's PDF viewer), Open in New Window (a new oculus window holding one oculus tab with that viewer: a new browser tab with oculus in Chrome, a new app window in the app), Open in Browser (the browser's own viewer; the existing Open in Browser Tab renamed on every file it is offered for, `files.yml:107` `menu_open_browser`, the comments at `File.svelte:53`, `Document.svelte:46`, `tab-menu.ts:87`, `row-menu.ts:7`, and `docs/window.md:59`) and the PDF in the Preview program. A click in oculus's viewer opens the `.tex` line in oculus. It replaces Z541's `/pdf` page and the `BroadcastChannel`; how the click travels between two oculus windows is D45's choice."

4. **Lines 27-29:** "read on main at c0a4af9c"; list the 11 source commits since `0d316064c` (above).

5. **Line 33:** add `tools/oculus/docs` to the `git archive` list.

6. **Lines 37-56:** use the numbers in the "What is on the tree" table. Replace line 43 (X3f forecast) with: "`views/sources/source/` holds 8 items (Editor.svelte, Gutter.svelte, Source.svelte at 520 of 520 lines, actions/, language/, save/, source-gutter.svelte.ts, status/). `actions/BarActions.svelte` (140) carries Save, Revert File, the star and Open in Program, Open Preview, Open Preview to the Side, Submit Job and Toggle Blame, drawn in `Source.svelte`'s `barActions` snippet (:401-415) and handed up by `handUp` (:352-361; `ui/tabs/tab-actions.svelte.ts:74`). `language/` (D23) holds `latex-editor.ts` (65), `extension.ts` (the LaTeX extension at :27 is skipped when a language server serves the file, :26), `tab-language.svelte.ts` (:54 builds it), `lsp.ts` and `symbols.ts`. `status/ask-perform.ts:50` `tabActions`. `status/library-tab.svelte.ts` (D23c) shows a library file outside every root read-only."

7. **Line 44:** "`File.svelte` (285) describes a `pdf` frame (:180-190) and draws its slot (`FrameSlot`, :238-239), with the frame comment at :32-38 and the version comment at :40-45, and the address `fileBytesUrl(root, path, fileVersion(root, path))` at :107. The frame layer draws it as an unsandboxed iframe (`shell/frames/FrameLayer.svelte:197-204`, kind `pdf` at `ui/tabs/tab-frames.svelte.ts:31`), so a layout change never loads it again." Item 10 then requires the PDF.js viewer to keep its document, page, zoom and scroll across a pane add, a tab move or a page switch. Two ways meet this: draw it in the `pdf` frame, or hold the document outside the pane tree. Add `ui/tabs/tab-frames.svelte.ts`, `ui/tabs/FrameSlot.svelte` and `shell/frames/FrameLayer.svelte` to the write list.

8. **Line 45 and item 29:** "`fileUrl` (`views/shared/links/file-url.ts:9-15`) has three callers: `row-menu.ts:584` (import :45), `language/latex-editor.ts:54` (import :16), `Document.svelte:83` (import :61). The same address is built by `sourceFileUrl` (`state/sessions/source.svelte.ts:211`, used at :231) and by `fileAddress` (`data/sources/deck/files.ts:76`, used at `deck/read.ts:326`, the Present figure)."
   - Item 29 becomes: "fold `fileUrl`, `sourceFileUrl` and `fileAddress` into one helper with `fileBytesUrl`. Since `data/sources/deck` cannot import `state/`, the one helper lives in `data/` and `fs-transport.ts` re-exports it."
   - Verify 7's grep adds `sourceFileUrl|fileAddress`. Case 25's Present figure comes through `fileAddress`.
   - Whether the hub-only builders (`card.ts:66-72`, `collection.ts:294`) join is for the orchestrator to judge.
   - Drop `Panel.svelte` from the write list.

9. **Line 48 and item 17:** "References registers `group: 'explorer', order: 3` (D23, `References.svelte:10`); the keys sheet reads `s1-s4` (`config/text/app.yml:12`, `HELP.md:46`), and with the TeX view it reads `s1-s5`." Item 17: "its `s1-s4` range grows to `s1-s5`".

10. **Line 49:** `showFolderInFiles` is at `state/workbench/layout/open/show.ts:69`.

11. **Line 53:** use the folder counts in the line 53 row. `shell/keys`, `server/content` and `src/routes` are full, and Z541's `/pdf` route could not have been added at `src/routes` anyway.

12. **Line 59 and item 32:** the docs D45 rewrites, each with its line now:
    - **DESIGN.md:**
      - `:531` "LaTeX on any folder" names the `latex` view;
      - `:533` "LaTeX builds" says "a rebuilt PDF is redrawn through a version on its address";
      - `:535` "LaTeX reading" is the root rule;
      - `:574` is the windows paragraph, if Open in New Window changes it.
      - `:568` (the status bar) no longer lists the left group, so it stays true.
      - The old `:395` PDF paragraph is gone.
    - **HELP.md:**
      - the keys table `:23-73` (`s1-s4` at :46, Cmd+Shift+B at :64, Cmd+Alt+T at :65, plus the LTW keys);
      - the views table, with a `latex` row after `references` (:96);
      - `:132` "Six views are opened for something".
    - **docs/views.md:**
      - a TeX view section after References (:67);
      - `:229` (`latex` among the six, and `file` as "a PDF in a frame");
      - `:241-243` "LaTeX builds", rewritten whole.
    - **docs/window.md:**
      - `:15` (the Explorer page as "Files, Repositories and Search");
      - `:58-59` (a file tab's actions: Build, View PDF, Build Log, the viewer's controls, and the Open in Browser rename);
      - `:82` (the status bar's left group).
    - **docs/configuration.md:** a `catalogs/latex.yml` row between `catalogs/icons.yml` (:16) and `layout.yml` (:17).
    - **docs/files-and-search.md:** `:43` (the row menu's Open LaTeX).
    - **Head comments:** `picks.svelte.ts:164-170`, `File.svelte:32-45` and `:53`, `Source.svelte:83-85`, `BarActions.svelte:1-17`, `keys.ts:98-104`, `status-items.ts:1-23`, `Project.svelte:21-23`, `commands.svelte.ts:31`, `language/extension.ts:1-5`, `language/tab-language.svelte.ts:1-5`. Drop `Document.svelte` and `Panel.svelte` for `file-url.ts`, since only the imports name it.

13. **Items 10, 16, 21, 226 and 330:** replace "the `bar` place of `ui/tabs/tab-actions.svelte.ts`" with "handed up through `handUp` (`ui/tabs/tab-actions.svelte.ts:74`) to the right end of the breadcrumb bar, with `Source.svelte`'s `applies` predicate (:356-360) also true for a LaTeX source tab".

14. **Item 16:** "`Source.svelte` is at 520 of 520 lines (`wc -l`), so any LaTeX wiring there is paid for by a split by concern in this step. The LaTeX parts of the tab go in `views/sources/source/language/` beside `latex-editor.ts` (5 items) or a new `views/sources/source/latex/` (the folder holds 8). Build, View PDF and Build Log are not shown on a HEAD or index read, nor on a library tab (`status/library-tab.svelte.ts`)." Drop "moved there, so the folder count stays 10".

15. **Item 2:** `shell-word.ts:11`.

16. **Item 4:** `terminals.svelte.ts` :49, :110-111, :127-133, :485-497.

17. **Item 15:**
    - Rewrite to Z671's four items. Open in New Tab: a `file` tab with oculus's viewer. Open in New Window: a new oculus window holding one oculus tab with the viewer. Open in Browser: the renamed Open in Browser Tab, `window.open(fileBytesUrl(...))` at `row-menu.ts:578` and `pages.ts:508`. The Preview program: see Stop 4.
    - The inverse-search click from any oculus window opens the `.tex` line in oculus. The server's socket is the route that works in Chrome and in the app, since `src/desktop/decide/links.ts` keeps only `/` and `/?float=<id>` in an app window (G47).
    - Remove the `/pdf` route, the `BroadcastChannel` named `oculus-synctex`, choice 2 (d), and Z541 from "Choices ruled before dispatch".
    - Add `src/desktop/decide/links.ts`, `src/desktop/windows/windows.ts`, `src/lib/state/shared/stores/desktop.ts`, `src/lib/shell/panes/floats/FloatWindow.svelte`, `src/lib/shell/Workbench.svelte`, `src/lib/state/workbench/layout/saved/storage.ts` (read; written as Stop 1 settles), `src/lib/shell/panes/strip/tab-menu.ts` and `src/lib/state/workbench/navigation/pages.ts` to the read and write lists.
    - G47 joins the guarded entries a case may test under, if the window opening touches `src/desktop/`.

18. **Item 17:** also name `src/lib/shell/keys/workbench-keys.svelte.ts` as the file that performs Show TeX View; `shell/keys` is full at 10, so no new file there.

19. **Item 18:** `config/layout.yml:82`.

20. **Item 20:** `statusbar.yml:164-167`.

21. **Item 24:** "registered through the LaTeX `EditorExtension` (`language/latex-editor.ts`), which `language/extension.ts:26-27` adds only when no language server serves the file". Then Stop 3.

22. **Item 26:** `pty/sessions.ts:227`.

23. **Item 30:**
    - `RowStores.rootOf` at `row-menu.ts:417`, `:440`.
    - Open LaTeX goes from the `latex` group (`:292-297`), but the group keeps PR3's three Present items and gets a name that fits them.
    - Also remove `newestLatex` and `latex(row)` (:534-556) and the dispatch (:589).

24. **Item 31:**
    - `behavior.yml:128-136`;
    - `options.yml` entries beside `latex.badness_path` (:555-561);
    - `settings.ts` readers beside 478-502, PROBLEM_READERS 505-525;
    - `settings.test.ts` 307-328; `wrong-settings.ts` 13-19; `config.test.ts` 401-484 (keys at 429-433).

25. **Inventory 2:**
    - renumber (`context.ts:373`, `File.svelte:40-45`, `row-menu.ts:81,125,237-242,292-297,330,370,383,417,440,534-556,589`, `files.yml:102`, `Project.svelte:169`);
    - change the PDF row to "drawn by the frame layer (`FrameLayer.svelte:197-204`)";
    - add the row "Open in Browser Tab (row menu `row-menu.ts:322-323`, tab menu `tab-menu.ts:126`, `files.yml:107`) | Renamed Open in Browser (Z671), joined by Open in New Tab and Open in New Window".

26. **Paths this step writes:**
    - `routes.ts` 89-104, 407-528, 576-578;
    - `settings.ts` 470-541;
    - `terminals.svelte.ts` 49, 110-111, 127-133, 485-497;
    - `context.ts` 366-375;
    - `row-menu.ts` 7, 45-46, 81, 125, 144-147, 237-242, 260-270, 292-297, 330, 370, 383, 417, 440, 534-556, 584, 589;
    - `picks.svelte.ts` 164-170;
    - `Document.svelte` 46, 61, 83;
    - add `state/sessions/source.svelte.ts` 210-217 and 231;
    - add `data/sources/deck/files.ts` 75-82 and `data/sources/deck/read.ts` 30 and 326;
    - `Source.svelte` (whole, 520) and `views/sources/source/language/`;
    - the frame and window files of corrections 7 and 17;
    - `behavior.yml` 128-136; `options.yml` 527-561; `sources.yml` 110; `layout.yml` 82;
    - `files.yml` 102 and 107; `server.yml` 127-128; `project.yml` 118-119; `app.yml` 12;
    - `package.json` dependencies at :92-93;
    - DESIGN, HELP and docs as in correction 12;
    - tests as in correction 24, plus boundaries :116-119 and :179;
    - drop `Panel.svelte`.

27. **Lines 344-348:** replace with the comparison against the steps now being prepared. X3e's write list (`briefs/X3e.md`) shares:
    - `server/content/latex/endpoint.ts`, `routes/api/(sessions)/latex/+server.ts`, `tests/routes/sessions/latex.test.ts`, `pty/routes.ts`;
    - `settings.ts` and `settings.test.ts`;
    - `options.yml`, `sources.yml`, `server.yml`, `files.yml`, `app.yml`, `glyphs.yml`, `icons.yml`;
    - `fs-transport.ts`, `fs.svelte.ts`, `state/sessions/source.svelte.ts`, `Source.svelte`, `palette.ts`, `commands.svelte.ts`;
    - `HELP.md` and `DESIGN.md`.

    PR4's (`briefs/PR4.md`) shares `src/desktop/decide/links.ts`, `src/desktop/windows/windows.ts`, `docs/views.md`, `docs/window.md`, `HELP.md` and `DESIGN.md`. D43 and D33 have no brief yet. Line 421's "D45 waits for X3f and D20" becomes "both landed".

28. **Read list:**
    - item 2: `routes.ts:86-104,404-528,570-580`;
    - item 3: `terminals.svelte.ts:47-50,108-133,482-497`, `context.ts:364-375`;
    - item 4: `settings.ts:1-60,466-541`, `settings.test.ts:1-70,307-328`, `config.test.ts:399-484`, `options.yml:1-30,524-561`;
    - item 6: drop `actions/StripActions.svelte`; `latex-editor.ts` becomes `language/latex-editor.ts`; add `language/extension.ts`, `language/tab-language.svelte.ts`, `status/library-tab.svelte.ts`, `ui/controls/editor/kit/lsp/markers.ts` (marker owners `lsp-<language>`; the LaTeX owner is `oculus-latex`, `latex-widget.ts:38`);
    - item 7: add `ui/tabs/tab-frames.svelte.ts`, `ui/tabs/FrameSlot.svelte`, `shell/frames/FrameLayer.svelte`;
    - item 8: `keys.ts:40-260`, `palette.ts:160-180`;
    - item 9: `show.ts`;
    - item 10: the row-menu ranges above;
    - item 11: `behavior.yml:111-137`, `layout.yml:76-83`, `sources.yml:104-114`;
    - item 13: `DESIGN.md:155-170,531-535,568,574`, `HELP.md:23-132`, `docs/views.md:63-70,229-243`, `docs/window.md:15,41,58-59,82`, `docs/configuration.md:10-20`, `docs/files-and-search.md:43`, and `agents/guarded.md` G37 (handUp, `:74-76`) and G47 (`:31-33`).

29. **Decision 3:** "documented in `docs/views.md:243`".

## Stops

1. **The form of Open in New Window, and how it keeps its layout.**
   - The facts: no browser page shows one tab alone today. `desktopOf` returns undefined in a browser (`state/shared/stores/desktop.ts:105-117`), and the float-only page exists only in the app (`Workbench.svelte:20-23`). Every browser tab of one server reads and writes one stored arrangement (`layout/saved/storage.ts:10-12`), so a second browser tab opened on `/` shows the whole arrangement, not one tab.
   - Why it is a stop: Z671 asks for "a whole oculus page holding one OculusTab" in Chrome and "a new oculus desktop window" in the app. The app's Move into New Window gives a float window with no rail and no status bar. Whether the new window is that float form or a full workbench with rail and status bar is something the reader sees, and Z671's wording fits either.
   - (a) Recommended: the float window form in both. The browser reads `?float=<id>` as the app does; the PDF tab becomes a float with a `window` place in the one saved arrangement; G29 is kept.
   - (b) A full workbench in the new browser tab. Its arrangement would need its own storage key, kept apart from the main page's. This is the design Z541 rejected.
   - (c) Lazy option: open the main page and activate the PDF tab there, which drops "one OculusTab".

2. **The inverse-search gesture.** Z671 says "a click on a word opens the `.tex`". Item 14 uses LaTeX Workshop's Cmd or Ctrl click, with a double click when `latex.reverse_synctex` is `double_click`. A plain click would take over text selection and the PDF's internal links.
   - (a) Recommended: read Z671's "click" as the SyncTeX click and keep Cmd/Ctrl click, with the double-click option.
   - (b) A plain click jumps, and selection needs a drag.

3. **The LaTeX extension when a language server serves the file.** `language/extension.ts:26` returns the served extension and skips the LaTeX one. Once D43's texlab serves `latex`, D45's markers, hover, Format Document and every provider of items 22 and 24 disappear. D43 is being prepared at the same time. This changes what D45 builds, and nothing the reader sees has to be decided.
   - (a) Recommended: D45 makes the LaTeX extension compose with a served one (both registered, both disposed), since D45 owns the extension and its providers.
   - (b) D43 does it. D45's work then breaks on the day D43 lands if D43 lands second without it.
   - Lazy option: leave it to whichever step finds it.

4. **"The PDF in the Preview program, as before" (Z671 (4)).** Nothing opens a PDF in Preview today. `.pdf` is not in `open.program_ext` (`behavior.yml:187-197`; `docs/window.md:59` says so too), and the open route only opens the application that map names (`api/(files)/open/+server.ts:1-6`). So item 15's "View in External Viewer ... through the open route" is false.
   - (a) Recommended: ship `".pdf": com.apple.Preview` in `open.program_ext`, so the existing Open in Program item carries it, labelled as that item already is. This is a shipped configuration value Axel sees.
   - (b) Widen the open route to the machine's default application for a PDF. This adds a wire shape and leaves the configuration alone.
   - Lazy option: drop item (4).

## Already built

None.
- `grep -rn --exclude=local.yml -i "synctex|on_file_change|math-preview|texdoc|checkcites|recipe_default|out_dir|Kill Build|Build Log|View PDF|Citation Browser" src config tests` prints nothing.
- `grep -c pdfjs package-lock.json` prints 0.
- `server/content/literature/bibtex.ts` (D38) fetches BibTeX entries from web sources. It is no `.bib` parser, so item 26 still needs `latex-utensils`' `bibtexParser`.

Usage: Opus 5.5 (claude-opus-5-5), about 80 tool uses; tokens and time not known.

Agent: a0dc73f3ef96a19bb, claude-opus-5-5, 263,515 tokens, 119 tool uses, 12.1 min.
