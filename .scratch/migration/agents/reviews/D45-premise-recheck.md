## D45 brief recheck against main

Main moved while I was checking. `b23de6e7c` was followed by `1b0098a2a` (Q123's hand-back ruling) and `92063ed58` (Z634, Z635 and Q125 booked). `git diff --stat b23de6e7c HEAD` lists only `.scratch/migration` files. `git diff --stat a564e4e29 HEAD -- tools/oculus ':!tools/oculus/.scratch'` prints nothing, so the source tree at HEAD is E4's landing, and it is the same tree every in-flight step started from.

The plan.md numbers below are taken at `92063ed58`. Q125's new line at `plan.md:643` moved every later line down by one compared with `b23de6e7c`.

The brief's tree section was read at `a21aa859d`. Since then these commits have changed source under `tools/oculus` (`git log --oneline a21aa859d..HEAD -- tools/oculus/src tools/oculus/config tools/oculus/tests ...`):
- X3f (`ee0407a5a`)
- D38 (`b07d24766`)
- D20 (`0aea28449`)
- `eba29a18e` (layout.yml)
- D44 (`297349683`)
- `a37aaa5de` (tests removed)
- `ebb6861c1` (help pane)
- O30 (`8ed2d1f5a`)
- A3 (`af7d8df07`)
- E4 (`a564e4e29`)

All paths below are under `tools/oculus/`.

### 1. Claims no longer true

Rulings and plan lines (`grep -n "^- <id> " plan.md` for each; `grep -n "LA1 to LA22" orchestrator-history.md`):

| Brief line | Claim | Now | Corrected text |
|---|---|---|---|
| 3 | `DESIGN.md:151` Untyped input | `grep -n "Untyped input" DESIGN.md` prints 156 | `DESIGN.md:156` |
| 9, 11 | `plan.md:510`, `:511` | 516, 517 (the text is the same) | `plan.md:516`, `:517` |
| 14-21 | Z487 :1213, Z467 :1193, Z468 :1194, Z488 :1214, Z503 :1229, Z504 :1255, Z509 :1233, Z536 :1252 | 1229, 1209, 1210, 1230, 1245, 1297, 1249, 1268 | those numbers |
| 22 | `orchestrator-history.md:661` | 749 | `:749` |
| 24 | Z192, Z278, Z279 at :1006-1008; Z309 :1034; Z299 :1036; Z300 :1037; Z303 :1040; Z317, Z318 :1047-1048; Z332 :1057; Z427 :1155 | 1022-1024; 1050; 1052; 1053; 1056; 1063-1064; 1073; 1171 | those numbers |
| 25 | D43 :508, D36 :570, D33 :567, D15 :512 | 513, 577, 574, 518 | those numbers |
| 222 | D15's line at `plan.md:512`; Z536 at `1252:` | 518; 1268 | those numbers |

What is on the tree:

| Brief line | Claim | Now (command) | Corrected text |
|---|---|---|---|
| 27-29 | read at `a21aa859d`; only D42 and S5 changed source | the ten commits listed above | "read on main at 92063ed58 (source = a564e4e29)" |
| 37 | `routes.ts` 627 lines; LATEX_STEPS :89, latexStepShape :93, latexFolderShape :99-102, latexCommand :393, latexFolder :410, keptLatex :444, startLatex :470, job :494, dispatch :549, hub read :432 | `wc -l` 656; `grep -n` prints 90, 94, 100-103, 420, 437, 471, 497, 521, 576, 459 | those numbers |
| 38 | `settings.ts:414-420` (latexAutoBuild) | 496-502 | `settings.ts:496-502` |
| 38 | `context.ts:325-331` | `grep -n "createLatex\|onSaved" state/client/context.ts`: 352, 358 | `context.ts:352-359` |
| 39 | `settings.ts` 457 lines; latexFormatting :396-412; latexAutoBuild :415-420; PROBLEM_READERS :438-440 | 541; 478-494 (its type at 471-476); 497-502; list at 505-524, with the latex entries at 522-523 | those numbers |
| 39 | settings.test describe at :364-391; `wrong-settings.ts` latex at :12-18; config.test 'settingFindings' at :397-441, latex keys at :424-428 | :307-328; :13-19; :405-484, keys at :432-436 | those numbers |
| 41 | `row-menu.ts` 504 lines: ROW_LATEX :70; fact :103, :201; item :240; uses :262, :301, :313; rootOf :346, :366; `latex(row)` :467-478; dispatch :495; fileUrl :40, :490 | 548 lines: :78; :114-118, :223-228; :262; :295, :335, :348; :381, :402; :506-518; :537; :44, :532 | those numbers |
| 42 | `Source.svelte` 512 lines; latexEditor at :214-215; StripActions (95 lines) drawn at :391-408; palette at :263-285, onactions :468 | 513 lines; :216-217; `StripActions` is gone (`grep -rn StripActions src` prints nothing); `BarActions` is in the `barActions` snippet at :399-412 and handed up by `handUp` at :350; `own`/`listed` at :293-313, `onactions` at :471 | as given |
| 43 | X3f round 3 (a forecast) | landed differently: there is no `actions/StripActions.svelte`; `actions/BarActions.svelte` is 140 lines (D44's Submit Job and Open Preview to the Side are in it); `Source.svelte` is 513 lines, not 518; `File.svelte` is 285, not 273; `views/sources/source/` holds 9 items with `read-again.ts` under `actions/`; `keys.ts` has the `save` kind at :56 and `savesFile` at :122, its resolve at :181-182 | replace the bullet with a description of the landed tree |
| 44 | `File.svelte` (319) draws a PDF as an unsandboxed iframe, frame comment :32-34, address comment :36-40, iframe :238, address :103 | 285 lines and no `<iframe>` (`grep -n iframe` prints nothing). It draws `FrameSlot` at :238-239 and describes a `pdf` frame at :180-190 to `ui/tabs/tab-frames.svelte.ts`. The unsandboxed iframe is now `shell/frames/FrameLayer.svelte:196-204`. Comments at :32-38 and :39-44; address at :107 | see 2.1 |
| 45 | `fileBytesUrl` callers `fs.svelte.ts:573`, `File.svelte:103`; `fileUrl` callers `row-menu.ts:490`, `Document.svelte:65` | `grep -rn fileBytesUrl` prints :582 and :107, plus two new callers, `state/workbench/navigation/pages.ts:506` and `row-menu.ts:526` (X3f's Open in Browser Tab, imported from `fs-transport` at :45). `fileUrl` callers: `row-menu.ts:532`, `Document.svelte:83` | add the two callers and correct the lines |
| 46 | `keys.ts:89-103` defaultCommand; `s` chord at :169-183 | 100-114; 234-249 | those numbers |
| 48 | `layout.yml:74-80` | Explorer is now a split at :76-83 and the side pane is at :82 | `layout.yml:82` |
| 50 | `behavior.yml:132-140` (rule :132, comments :133-134, `latex:` :135, keys :136-140) | `grep -n` prints 128; comments at 129-130; `latex:` at 131; keys at 132-136 | `behavior.yml:128-136` |
| 50 | `options.yml:530-564`; head :9-12; themes :15-29; `behavior.yml:119` paint limit | 524-558; head :10-13; themes :16-30; :115 | those numbers |
| 50 | `files.yml:92`; `server.yml:85-86`; `project.yml:116-117`; `file.yml` 25 lines | :93; :97-98; :118-119; 23 lines | those numbers |
| 51 | katex :73, latex-utensils :74, monaco :81; pdfjs-dist between nodemailer :83 and seti-ui :84 | :82, :83, :90; nodemailer :92, penpal :93, seti-ui :94 | "between `nodemailer` (:92) and `penpal` (:93)" |
| 53 | `views/sources/source` is full at 10; room in `server/content` is 9 | `git ls-tree ... \| wc -l` prints 9 and 10 | `views/sources/source` 9; `server/content` 10 (full, D38's `literature/`) |
| 54 | config-folder :144, :230; boundaries comment :106-109 and entry :162; keys.test :411, :463; G29 test :22 | :143, :232; :118-121, :175; :416, :468-469; :23 | those numbers |
| 56 | `model-sessions.ts:666` | :672 | `:672` |
| 59 | DESIGN :395, :409, :430; HELP :19, :33, :102, table :108-155, :122, :120, :136, :159, :163, config table :265-277, :270/:271 | DESIGN 398, 413, 434. HELP 21, 35, 112, 116-166, 132, 130, 147, 170, 174, 286-301, 293/294 (`sed -n` and `grep -n`) | those numbers |
| 59 | head comments `File.svelte:17-40`, `Source.svelte:77-81`, `keys.ts:89-93`, `picks.svelte.ts:137-141`; `Document.svelte`/`Panel.svelte` "where they name file-url.ts" | :16-62, :88-92, :100-104, :141-147; neither comment names `file-url.ts` (only the imports do) | those numbers; drop the last two |

Items, paths and read list:

| Brief line | Claim | Now | Corrected text |
|---|---|---|---|
| 21, 187, 196, 226, 330 | "the `bar` place of `ui/tabs/tab-actions.svelte.ts`" | there is no named place: one snippet per tab through `handUp` (`tab-actions.svelte.ts:74`), with an `applies` predicate (`Source.svelte:350-360`) | "handed up through `handUp` (`tab-actions.svelte.ts:74`) to the right end of the breadcrumb bar" |
| 176 | `pty/shell-word.ts:10` | :11 | `:11` |
| 178 | `terminals.svelte.ts` latex at :117-120, :488-499 | :127-131, :485-497 (file is 830 lines) | those numbers |
| 196 | `Source.svelte`, 518 lines once X3f lands; folder count stays 10 | 513; 9 | "513 lines; the folder stays at 9" |
| 198 | `layout.yml:80` | :82 | `:82` |
| 209 | `pty/sessions.ts:214` | :223 (and it moves again with Q123's split) | `:223` |
| 215 | callers `row-menu.ts:40,490`, `Document.svelte:45,65` | :44,532 and :61,83 | those numbers |
| 217 | `behavior.yml:132-140`, `latex.badness_path (:558-564)` | 128-136; 552-558 | those numbers |
| 218 | DESIGN/HELP line list | as in the row for brief line 59 above; plus `HELP.md:51` and `:77` (see 2.3, 2.10) | renumber |
| 315 | routes.ts 87-102, 380-501, 548-550 | 89-103, 407-528, 576-578 | those numbers |
| 317 | settings.ts 385-457 | 470-541 | that range |
| 320 | terminals.svelte.ts 44, 100, 117-120, 488-499 | 49, 110-111, 127-131, 485-497 | those numbers |
| 322 | context.ts 320-335 | 352-359 | that range |
| 327 | row-menu.ts 40, 70, 100-105, 116-118, 195-205, 235-245, 255-320, 340-370, 460-500 | 44, 78, 114-118, 130-133, 218-228, 237-264, 290-350, 377-405, 494-540 | those ranges |
| 328 | picks.svelte.ts 137-141 | 141-147 | that range |
| 329 | Panel 14, 32 (true); Document 45, 65 | Document 61, 83 | those numbers |
| 330 | Source.svelte :77-81, :98, :214-215 | :88-92, :116, :216-217 | those numbers |
| 336 | layout.yml 80; behavior.yml 132-140; options.yml 530-564 | 82; 128-136; 524-558 | those numbers |
| 337 | files.yml 92; server.yml 85-86; project.yml 116-117 | 93; 97-98; 118-119 | those numbers |
| 339 | DESIGN 395/409/430; HELP 19, 33, 102, 120, 122, 136, 159, 163, 270 | DESIGN 398/413/434; HELP 21, 35, 51, 77, 112, 130, 132, 147, 170, 174, 293 | those numbers |
| 340 | settings.test 364-391; wrong-settings 12-18; config.test 409-441 | 307-328; 13-19; 405-484 | those ranges |
| 344-348 | X3f, D20 and D44 are in flight | all three landed (`queue.md` "Landed"). Section 3 has the current list | rewrite |
| 378-389 | read list: routes.ts 85-102, 380-501, 540-552; terminals 40-46, 98-122, 486-500; context 320-335; settings 385-457; settings.test 364-391; config.test 395-445; options 526-564; `actions/StripActions.svelte`; keys.ts 40-200; row-menu ranges; behavior.yml 115-141; layout.yml 70-80; DESIGN 140-160, 395, 409, 430; HELP 19, 33, 102, 108-160, 163, 261-277 | 87-103, 404-528, 570-580; 47-51, 108-132, 483-497; 345-362; 469-541; 307-328; 405-484; 520-558; the StripActions file does not exist; keys.ts 40-260 (appKey :137-148, chords :234-249); the row-menu ranges from the table above; behavior.yml 111-137; layout.yml 76-83; DESIGN 145-165, 398, 413, 434; HELP 21, 35, 51, 56-110, 112, 116-171, 174, 282-301 | add `ui/tabs/tab-frames.svelte.ts`, `ui/tabs/FrameSlot.svelte`, `shell/frames/FrameLayer.svelte`, `views/shared/links/file-bar.ts`, `src/desktop/decide/links.ts` |
| 421 | D45 waits for X3f and D20 | both landed; `queue.md:10`: "launched after Q125 lands" | that text |

### 2. Changes beyond a line number

1. **E4 moved the PDF frame out of `File.svelte`.** Any frame a tab shows (apps, documents, PDFs) is now drawn outside the pane tree, in the frame layer. The reason given in `ui/tabs/tab-frames.svelte.ts:1-15` is that "a layout change never loads the PDF again." Item 10 replaces Chrome's viewer, so these become D45's writes, and none of them is in its path list:
   - `tab-frames.svelte.ts:31`, the `'pdf'` FrameKind;
   - `FrameLayer.svelte:196-204`, the `pdf` branch;
   - `File.svelte:180-190`, `:238-239` and its comment at :32-38;
   - `DESIGN.md:308`, the frame paragraph, if it changes.

   A PDF.js viewer drawn inside the pane would be drawn again at every pane add, tab move or page switch, and would lose its page, zoom and scroll each time. Today's frame layer prevents that, so losing it would drop behaviour the user has now.
   - What it means for the step: the brief must require the viewer to keep its document across a layout change. One way is to draw the Z541 `/pdf` page in the `pdf` frame, so one viewer serves both the tab and the browser.
   - User-visible choice: no. The mechanism is internal, and the requirement follows from "nothing of what they do dropped".

2. **O30, oculus in its own window.**
   - `src/desktop/decide/links.ts:44-54` sends every address of the server other than `/` and `/?float=<id>` to the default browser through `shell.openExternal` (`windows.ts:108`). Z541's `/pdf?root=&path=` therefore opens in the default browser when oculus runs in the app. A `BroadcastChannel` cannot cross from that browser to the app window, so inverse SyncTeX from View in Web Browser (case 15 over the channel, look L12) does not work in the app.
   - **This is a user-visible choice, and one option touches the words of `agents/guarded.md` G47.** The options:
     - (a) Keep `/pdf` in the browser and carry SyncTeX over the server's socket instead of a `BroadcastChannel`. This is a new wire shape. My recommendation.
     - (b) Open `/pdf` in an app window. This changes `linkDecision` and G47's sentence "An app window shows only its own server's page"; that sentence is Axel's to change.
     - (c) Have no SyncTeX from the browser viewer when running in the app. This is the lazy option, since it drops a feature.
   - Z541 was an automode ruling made before O30 landed.
   - In the app, `appKey` (`keys.ts:137-148`) takes Cmd+F for the app's find bar unless the view calls `preventDefault` first, so item 10's viewer find must do that.
   - No item of the app menu (`src/desktop/windows/menu.ts`) collides with LTW's keys. Look L17 should record the app window as well as Chrome.

3. **X3f's landed bar.**
   - `BarActions.svelte` (140 lines) holds Save, Revert File, the star and Open in Program, Open Preview, Open Preview to the Side, Submit Job (D44) and Toggle Blame.
   - The `applies` predicate of `handUp` at `Source.svelte:350-360` must also hold for a LaTeX tab.
   - **New guarded entry G37** (`guarded.md:71-73`) covers `handUp` and its call in each file view, Source and File among them. Its tests are `tests/views/sources/bar-actions.test.ts` ('the place a file tab hands its actions to') and `tests/ui/tabs/tab-actions.client.test.ts`. The brief's "A case becomes a test only under ..." lists G35, G13, G1 and G29, and should add G37.
   - `HELP.md:51`, "A file tab's actions", lists the bar's actions. D45 must add Build, View PDF, Build Log and the PDF viewer's controls there, so it is a new path.
   - X3f also added "Open in Browser Tab" for html, image and pdf files: `files.yml:97`, `row-menu.ts:66`, `:136`, `:221`, `:525-526`, and the tab menu through `pages.ts:505-507`. Inventory 2 does not list it. With D45 a PDF would offer both Open in Browser Tab (the bytes in the browser's viewer) and View in Web Browser (oculus's viewer).
   - **This is a user-visible menu shape.** I recommend keeping both and naming both in Inventory 2. The orchestrator can rule it under self-rule.
   - The source tab's note now says a refused "LaTeX action": `save/tab-said.svelte.ts:2`, `save/SourceNote.svelte:4` and `:59`, `Source.svelte:50` and `:217`. That is where D45's build refusals would show. These head comments should be read again; no user choice.

4. **Folders and file sizes.**
   - `src/routes/` now holds 9 items: O30's `find/` and E4's `apps/`. Z541's `pdf/` brings it to 10, the limit. O30's `find/` (`+page.svelte`, `+page.server.ts`, `+page.ts`) is a precedent for a standalone page route.
   - `terminals.svelte.ts` is 830 of 880 lines, and D45 adds `stop`, `checkcites`, `force` and the recipe there.
   - `server/content` is full (10), but D45 adds nothing at that level.
   - No user choice.

5. **Q123's ruling A** (`agents/briefs/Q123-cases.md`, committed in `1b0098a2a`) widens Q123's write list:
   - `pty/routes.ts:34` and `:51` (imports);
   - `tests/routes/sessions/terminal-actions.test.ts:21`;
   - `chat.ts`, `compose.ts` and `context.ts` move into `pty/start/`, and a new `pty/capture.ts`.

   These touch two of D45's files at other lines; see section 3. `pty/sessions.ts:223` moves again. No user choice.

6. **Q125 is queued next, before D45** (`queue.md:8-10`, Z636, `plan.md:643`). It rewrites `HELP.md` into a user's guide and moves the configuration reference to `docs/configuration.md`. It rewrites `DESIGN.md` to its decisions, and changes the rule at `spec.md:66` so that a step writes HELP.md only where what a user does changes.
   - What it means for the step: item 32, the HELP and DESIGN rows of the path list, the views-table row and the `catalogs/latex.yml` config-table row must all be taken again after Q125 lands.
   - User-visible choice: none for D45, since Z636 is ruled.

7. **D23 is queued ahead of D45** (`queue.md:9`). D23 moves `latex-editor.ts` into `views/sources/source/language/`; D45 moves it into `latex/`. D23's brief (its line 257, and Decision 12) says that when D45 is on D23's base, the file stays in D45's `latex/`.
   - D23 adds a `references` view to the Explorer group at order 3 (D23.md:293). After both steps the keys sheet reads `s1-s5`. D11's planned `debug` at order 3 collides with `references`; that is D11's concern.
   - D23's brief cites `D45.md:321` and `:189`; the lines it means are now `:330` and `:198`.

8. **A second keys sheet the brief omits.** HELP.md's "## The keys" table carries `s1-s3` at :77 and Cmd+Shift+B and Cmd+Alt+T at :95-96. It was already there at `a21aa859d`, so this is a gap in the brief, not a landing. D45's new keys and its `s` range belong there too. D23 already writes that row.

9. **X3e** (queued, launched after Q125) shares these files with D45: `options.yml`, `glyphs.yml`, `icons.yml`, `server.yml`, `app.yml` and `files.yml`. It is not in flight.

### 3. Paths D45 writes that the other steps also write

Line numbers are at HEAD. D23's were numbered at `f0f311964` with D20 staged; I mapped them to HEAD with `git diff -U0 0aea28449 HEAD`.

| Step | Shared file | That step's lines | D45's lines | Merge |
|---|---|---|---|---|
| E4g | `HELP.md` | 21 (the Help tabs), 82, 210-221 | 21 (the Explorer list) | same line 21: not simple; 82 against 77 is simple |
| E4g | `config/text/app.yml` | 12 | 12 | same line: not simple |
| E4g | `config/layout.yml` | 98, 176-180 | 82 | simple |
| E4g | `DESIGN.md` | 79-80 | 398, 413, 434 | simple |
| Q124 | `package.json` | scripts at :13-18 | dependencies at :92-93 | simple |
| Q124 | `HELP.md` | 371-373 | none near | simple |
| Q123 | `HELP.md` | 147 | 147 (the terminal row) | same line: not simple |
| Q123 | `pty/routes.ts` (ruling A) | 34, 51 | 89-103, 407-528, 576-578 | simple |
| Q123 | `tests/routes/sessions/terminal-actions.test.ts` (ruling A) | 21 | the latex cases at :128-202 | simple |
| Q123 | `docs/diagrams/` | redrawn | redrawn | regenerate |
| O30b | `config/text/server.yml` | 99-101 (`server.start`) | 97-98 (`server.latex`, plus new keys) | adjacent: not simple |
| O30b | `DESIGN.md` | 38-81, 436 | 434 | one unchanged line between: simple, not verified by a merge |
| O30b | `docs/diagrams/` | redrawn | redrawn | regenerate |
| D23 | `views/sources/source/Source.svelte` | whole file (520-line limit) | LaTeX wiring and the split | not simple |
| D23 | `views/sources/source/latex-editor.ts` | moved to `language/` | moved to `latex/` | not simple |
| D23 | `views/sources/source/actions/` (`BarActions.svelte`) | a new file only if its split needs one | `BarActions.svelte` | judge at preparation |
| D23 | `state/client/context.ts` | whole file | 352-359 | not simple |
| D23 | `state/workbench/palette.ts` | whole file | only if needed | judge at preparation |
| D23 | `shell/status/status-items.ts`, `StatusBar.svelte` | the right group, `LanguageItems` | the left group :14, head comment :1-9 | not simple |
| D23 | `config/catalogs/glyphs.yml`, `icons.yml` | `symbol_*`, `ast_*`, `memory_leaf` | new glyph rows | judge when the rows are placed |
| D23 | `config/text/statusbar.yml` | whole file | the item's words | judge |
| D23 | `config/text/app.yml` | 12 (`s1-s4`), `palette` group from :17 | 12 (`s` range, keys) | same line: not simple |
| D23 | `config/text/views/sources/files.yml` | Outline, AST, Memory words | 93 | judge |
| D23 | `config/behavior.yml` | 109-125 | 128-136 | two blank lines between: simple |
| D23 | `config/catalogs/options.yml` | 493, 496-523 | 524-558 | adjacent: not simple |
| D23 | `package.json`, `package-lock.json` | pyright, vscode-jsonrpc, vscode-languageserver-protocol | pdfjs-dist | one line (`penpal` :93) between; not verified by a merge; lock regenerated |
| D23 | `HELP.md` | 50, 77, 112, 130, a row after 132, 176, 180 and a paragraph after it, 188, 305 | 77, 112, 130, a row after 132 | same lines: not simple |
| D23 | `DESIGN.md` | 23, 87, 116, 154, 158, 250, 394, 398, 399, 402, 406, 420, 431, 434 | 398, 413, 434 | 398 and 434 are the same lines: not simple |
| D23 | `docs/diagrams/` | redrawn | redrawn | regenerate |

### 4. Claims checked and found true

179 claims were checked and found true, counting each fact once. They include:
- the LaTeX server and store files' sizes and names;
- the zod/token premises;
- G1, G13, G29 and G35 and their tests;
- the 21 program lookups;
- the hub's real-case counts (232, 123, 16, 21 inputs, 22 files, 188779 bytes, the ignore lines, the three tracked PDFs);
- the `files` channel throttle and merge;
- the folder counts that still hold;
- LaTeX Workshop 10.19.0 being installed;
- the HELP wording that still holds;
- Decisions 1 and 4.

Usage: Opus 5.5 (claude-opus-5-5). About 75 tool uses. Tokens and time not known.

Usage: a4473b4fa94dfdd3a, claude-opus-5-5, 298,474 tokens, 126 tool uses, 18.0 min.
