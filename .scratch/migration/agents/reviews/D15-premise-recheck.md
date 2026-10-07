D15 premise recheck on main at 8bd2070c

Read this first: main moved while I was checking. `git rev-parse HEAD` now prints `d5d7f727b6f84f936fa2b4310856a834269fc132` ("Give the PDF viewer its own box inside the frame"). `git merge-base --is-ancestor d5d7f727b 8bd2070c` fails ("d5d7 NOT in 8bd2070c"), so it is the next commit after 8bd2070c. That commit is the Z699 patch. `git diff 8bd2070c d5d7f727b -- tools/oculus/src | diff - agents/reviews/D45-pdf-height.patch` printed nothing, which means the commit's source change is the patch, byte for byte. The same commit closes Z699 in `orchestrator-state.md` (the item moves to "Closed items"), rewrites the D45 look bullet in `plan.md`, and lists this recheck as agent ac8eba7ca69860cb6. Every line number below is taken at 8bd2070c, and where the commit moved a line I also give its place at d5d7f727b. I changed no file and ran no git command that writes.

## 1. Brief lines whose premise moved

`agents/briefs/D15.md` has 7 lines (`cat -n`). `git log -1 -- agents/briefs/D15.md` prints `c12e4fbd8 Wed Sep 30 15:00:04 2026`.

- **Line 1** ("# Brief: D15"): holds.
- **Line 3** ("This file holds the step's plan lines whole, so nothing is lost by the one sentence `plan.md` keeps."): moved.
  - `plan.md:530` is now a rewritten line that fits whole. `plan.md:531` carries a widening the brief does not hold: "Widened 2026-10-02 (Z289, the orchestrator, automode): a formula on the deck's equation card is readable (M4-1) and scrolls in a narrow pane (M4-2); Restore panes keeps the document frame's page (M4-3)."
  - Corrected text: "This file holds the step's plan line (`plan.md:530`) and its widening (`plan.md:531`) whole, with the line as booked until 2026-09-30 kept below for its history."
- **Line 5** (the heading): holds, as a record of history.
- **Line 7**: four of its premises moved.
  - "and the LaTeX panel opening its PDF beside the source" moved into D45 by Z487 (`plan.md:1268`: "D15's PDF beside the source moves into D45") and is built there. `docs/views.md:259` says: "The first build of a root opened from a source tab shows its PDF beside the tab, once per tab."
  - "(the browser's own viewer keeps pages, zoom, find and the outline)" is false now. Every PDF is drawn by oculus's PDF.js viewer (Z503, `plan.md:1284`; `File.svelte:31-35`; `docs/views.md:259`). The browser's own viewer is only the "Open in Browser" item (Z671, `plan.md:1453`).
  - "brief at dispatch" still holds: the brief has to be written at /spec.
  - "the scope is widened to `pdfjs-dist`, with `synctex` run as a process ... SyncTeX works both ways (LA19 a)" moved into D45 and is built:
    - `package.json:92` holds `"pdfjs-dist": "6.4.299"`;
    - `src/lib/server/content/latex/synctex.ts` exists (`ls src/lib/server/content/latex/`);
    - D45's brief says the same at `agents/briefs/D45.md:27`: "It was booked against D15 ... Z487 moved the PDF beside the source and SyncTeX into D45, so it covers D45".
  - Corrected text: "- D15 PDF reading: the page position of a PDF kept per file in the instance state, on D45's PDF.js viewer (`src/lib/views/sources/file/pdf/viewer.svelte.ts`; D45 landed as 0753a5e76 and its blank-page fix as d5d7f727b). The PDF beside the source, `pdfjs-dist` and SyncTeX both ways (LA19 a) are built in D45 (ruling Z487) (ruling Z503) (ruling Z671) (Axel 2026-09-13 00:45) (ruling The queue). Widened by Z289 with M4-1, M4-2 and M4-3 (`agents/reviews/owed-looks.md:151-153`); M4-1 and M4-2 clash with Z650 (see section 5, C4)."

## 2. Premises of the step's text, bullets, rulings and earlier reports, checked against the tree

### The rulings

- **Z487.** Holds at `plan.md:1268` (`sed -n 1268p plan.md`).
- **Z503.** At `plan.md:1284`. Its clause "View in Web Browser opening oculus's viewer with SyncTeX over a `BroadcastChannel`" is superseded:
  - Z671 (`plan.md:1453`) replaces the bare `/pdf` page and the `BroadcastChannel` jump.
  - Z683 (`plan.md:1463`) makes "Open in New Window" a float window.
  - `grep -rn BroadcastChannel src` finds it only in `src/desktop/windows/show.ts:9` and `src/lib/state/life/present.svelte.ts:111,353`, none of them in LaTeX code.
  - `DESIGN.md:533` says the inverse jump "travels over the server's socket as the page's `jump` message".
  - The clause "D15 builds on D45's viewer" holds.
- **"Axel 2026-09-13 00:45".** Holds at `plan.md:777` ("D12 to D17 booked (... PDF reading ...)").
- **The queue.** Holds at `plan.md:857`.
- **Z289.** Holds at `plan.md:1073`: "D15 takes M4-1, M4-2 and M4-3".
- **LA19 (a).** Holds in `orchestrator-history.md:763` ("LA19 (a) `pdfjs-dist`"). It is used up by D45, as line 7 above says.

### The M4 defects

- **M4-1** (`owed-looks.md:151`) names `.eqcard` in `tools/present/assets/css/deck.css`. The selector is still there: `grep -rn eqcard tools/present` prints `deck.css:69: .eqcard{background:#f7f8fa;...}`, with no colour set. That is the cockpit's generated deck, and `git check-ignore -v tools/present/present.html` prints `.gitignore:132`. Z650 (`plan.md:1433`, the user) rules that "PR2 leaves the cockpit's public deck (`tools/present/`) as it is and does not update it, since the cockpit is to be deleted". So the premise holds as a fact, but changing that file now goes against Z650. oculus's own equation card is different: `src/lib/views/academic/present/parts/Equation.svelte:53-61` sets `background: var(--card)`, a token, and no fixed text colour. Its colours on screen are not verified.
- **M4-2** (`owed-looks.md:152`) names `deck.css:71` (`.eqcard mjx-container{max-width:100%;overflow-x:auto}`), which still holds. The same Z650 clash applies. oculus's card has `overflow-x: auto` (`Equation.svelte:60`) and scales a formula wider than the card down to fit (`Equation.svelte:21-41`, `equationScale`). Not looked at.
- **M4-3** (`owed-looks.md:153`): "Restore panes after Maximise pane reloaded the document frame". This was seen on 2026-10-02.
  - The frame layer arrived later: `git log --format='%h %ad' -- src/lib/ui/tabs/tab-frames.svelte.ts` prints `10ac00c69 2026-10-06` (E4) first.
  - `Document.svelte` now hands its iframe to it (`kind: 'document'`, `key: ''`, at 8bd2070c :160-180).
  - `tab-frames.svelte.ts:11-14` says a frame is dropped only when its view drops it, its key changes or no tab shows its view.
  - From reading, Restore panes should no longer reload the frame. This is not verified on screen.
  - The strings are `config/text/ui.yml:56` (`pane_maximise: Maximise pane`) and `:60` (`pane_restore: Restore panes`).

### What D45 built of D15's part

All of this is checked by reading `viewer.svelte.ts` (618 lines at 8bd2070c, 625 at d5d7f727b by `wc -l`) and `File.svelte` (416 lines).

- **The PDF.js viewer.** `class PdfViewer` (`viewer.svelte.ts:108`) runs `PDFViewer`, `PDFLinkService` and `PDFFindController` (`:344-401`). It has page, scale, scaleValue, scroll, spread, sidebar and invert as state (`:109-127`). It is mounted once per frame box by `File.svelte:240-261` and handed out through `frames.provide`.
- **The page position kept in memory.**
  - `open(url, key)` (`:209`, d5d7: `:216`) keeps "the page, the offset in the page and the zoom" when the key is unchanged, through `#position()` (`:512`, d5d7: `:519`) and `#restore` (`:150`, d5d7: `:155`).
  - `#initialised()` (`:491`, d5d7: `:498`) applies that place.
  - The `Position` type (`:90-95`) is `{ page, left, top, scaleValue }`.
  - `#position()` reads PDF.js's private `viewer._location` (`:515`).
  - This covers a rebuild of the same file and every layout change (the frame layer keeps the box).
- **The PDF beside the source.** Built in D45, as above.

### What is left for D15

The position is never written anywhere that outlives the viewer object:

- `grep -n "setInstanceState\|instanceState" src/lib/views/sources/file/File.svelte` prints nothing.
- `File.svelte` reads only `root`, `path`, `label` and `size` from `instance.state` (`:113-115`, `:132`).

So each of these starts at page 1 at the default zoom:

- a page reload;
- "Open in New Window", which moves the tab into a float drawn by a new page (`float/browser.ts:57-62`, `windowTab` and then `/?float=<id>`);
- Copy into New Window and Return to Page, since the viewer is mounted fresh;
- closing the tab and opening the PDF again.

D45's inventory row agrees: "Page position kept per file across reopen | none | D15" (`git show 8bd2070c:.../briefs/D45.md | sed -n 110p`).

### "Instance state" in the tree

- There are two places with that name:
  - the layout's `Instance.state`, which is the tab's opening identity (`layout/instance.ts:110`, `newInstance`);
  - the ui store's per-instance record, `setInstanceState` (`ui.svelte.ts:609`), saved under `UI_KEY = 'oculus.ui.v1'` (`:34`).
- `DESIGN.md:169` says "`ui` holds theme and per-view-instance state such as selection and filters. Both persist to `localStorage`".
- Present's slide follows the second pattern: `Present.svelte:292-294`, `setInstanceState(id, { ...parsePresentState(instanceState(id)), slide: key })`.
- The ui record is cleared when a tab closes (`instances.ts:234`, `:292`, `:319`) and when a preview tab is pointed at another file (`opening.ts:168`, `access.ui.clearInstanceState(replaced.id)`).
- It is copied by Copy into New Window (`float/store.ts:108-110`).
- A per-instance record therefore does not by itself survive "reopen". This is choice C1.

### The viewer code D15 will use

- An events hook to report the place: `pagechanging` (`:369-375`, d5d7: `:376-382`) and `scalechanging` (`:376-383`, d5d7: `:384`) are already handled.
- `ViewerHooks` (`:51-71`) has no hook that reports a place. D15 adds one.

### Z699 and the patch

The patch touches `viewer.svelte.ts` only:

- it adds `#box` beside `#root` (d5d7: after `:131`);
- it replaces `root.classList.add('oc-pdf')` (`:157`) with a created `.oc-pdf` div appended to the root (`:178`);
- `toggleInvert` (`:278-281`) toggles on `#box`.

It touches none of D15's position code (`Position`, `open`, `#initialised`, `#position`, `#scrollTo`). It only moves those lines down by 5 to 7: the d5d7 numbers above come from `git show d5d7f727b:<file> | grep -n`. It touches nothing in `File.svelte`. `viewer.css:42` (`.oc-pdf.invert .pdfViewer`) still matches, since `#box` carries `oc-pdf`. D15 builds on d5d7f727b.

### Other premises

- **No guarded entry covers a PDF position.** `grep -n "pdf\|PDF" agents/guarded.md` prints nothing. `tests/views/sources/` holds no file-view test (`ls`), and no test reads `diffViewOf` or `parsePresentState` (`grep -rln` prints nothing).
- **Folder limits.** `git ls-tree --name-only d5d7f727b <dir>/ | wc -l`:
  - `src/lib/state/sources` holds 10 (full);
  - `src/lib/state/workbench` holds 10;
  - `src/lib/state/workbench/layout` holds 10;
  - `src/lib/views/sources/file/pdf` holds 5;
  - `src/lib/state/sources/explorer` holds 8.

## 3. Landings since the brief's commit c12e4fbd8, in the files D15 reads or writes

All lists come from `git log --oneline c12e4fbd8..HEAD -- <path>`, run with HEAD at d5d7f727b.

- **`src/lib/views/sources/file/pdf/`:**
  - 0753a5e76 (D45) created all five files;
  - d5d7f727b (the Z699 fix) changed `viewer.svelte.ts` (the hunks named in section 2).
- **`src/lib/views/sources/file/File.svelte`:**
  - 0753a5e76 (D45): the PDF frame of kind `viewer`, `mount`, `texKey`, `rootOfFile`, `revealFor`, the four ways to open;
  - 10ac00c69 (E4): the frame layer and `FrameSlot`;
  - e6d00fb0f (X3f): `handUp` and the bar actions;
  - cf91445bf (X3c);
  - d2d85b3ac (Q66): `shownGate`, so a hidden tab draws nothing;
  - 999c2544a (Q85d);
  - 797717293 (U3).
- **`src/lib/ui/tabs/tab-frames.svelte.ts` and `src/lib/shell/frames/FrameLayer.svelte`:**
  - 10ac00c69 (E4) created them;
  - 0753a5e76 (D45) added the kind `viewer`, `mount`, `provide` and `provided`, `boxOf` and `boxed`.
- **`src/lib/views/sources/document/Document.svelte`** (M4-3): 0753a5e76, 10ac00c69 (the document iframe moved into the frame layer), e6d00fb0f, cf91445bf, 999c2544a, 797717293.
- **`src/lib/state/workbench/ui.svelte.ts`:** 3cb170eae (O30), 5dad8bdcc, e752624e3, f444ac509, 63d8ea82a, 0000594d3, 60c5577bd, a8c061d11. None changes `setInstanceState` or `clearInstanceState`, which are at `:609` and `:616` now.
- **`src/lib/state/workbench/layout/instances.ts`:** 548004bcc, 3cb170eae, cf91445bf, 5531bc5c2.
- **`src/lib/state/workbench/layout/open/preview.ts`:** e6d00fb0f, f444ac509.
- **`src/lib/views/academic/present/`** (M4-1 and M4-2 on oculus's own card):
  - 50be07eb1 (M4) made the KaTeX `Equation.svelte`;
  - 548004bcc last changed `Equation.svelte` (`git log -- .../Equation.svelte`);
  - 687cd1d5c, a29014904 and eede45985 (PR1, PR3, PR4) changed the view.
- **`tools/present/assets/css/deck.css`:** only 50be07eb1 (M4); frozen by Z650 since.
- **`DESIGN.md`, `HELP.md`, `docs/views.md`, `docs/window.md`:** many landings. The ones that bear on D15:
  - 0753a5e76 wrote `DESIGN.md:533`'s PDF.js sentence and `docs/views.md:259`;
  - 639820b91 (D23b) and eede45985 (PR4) changed other paragraphs.
- **The ledger:** d5d7f727b changed `plan.md` (the D45 look bullet, the Agents list), `orchestrator-state.md` (Z699 moved to "Closed items", a new position line) and `queue.md:1`.

## Paths this step writes

The tree fixes most of these exactly. Where a path depends on a choice in section 5, I say which.

- **`tools/oculus/src/lib/views/sources/file/pdf/viewer.svelte.ts`** (exists, 625 lines at d5d7f727b). It gains:
  - a hook that reports the place (page, offset, zoom, and what C2 adds);
  - a saved place handed to `open`, through the existing `#restore`.
  - No queued step is known to write it: `grep` over the briefs of X3e, D11, D28 and M6 finds no `file/pdf` path, and D43, D33, M8, M7, D41, D39, D36 and D40 have no brief file (`ls agents/briefs`). Their plan lines (`plan.md:196`, `:491`, `:239`, `:519`, `:594`, `:576`, `:231`, `:236`, `:516`, `:514`, `:599`, `:515`) do not name it.
- **`tools/oculus/src/lib/views/sources/file/File.svelte`** (exists, 416 lines; the component limit is 520). It reads the saved place from the ui instance record, writes it back, and passes it to `viewer.open`. No queued brief names it.
- **The saved-place reader** (a zod shape with a `.catch`, as `diffViewOf` in `state/sources/repositories/repositories.ts:337-370` or `parsePresentState` in `state/life/present.ts:80`), in one of two places:
  - a new module in `tools/oculus/src/lib/state/sources/explorer/` (8 items there, so a new file fits);
  - or added to `state/sources/explorer/file-type.ts` (85 lines), beside `markdownPreviewState`.
  - `state/sources` itself is full at 10. No queued step is known to write either place.
- **`tools/oculus/docs/views.md:259`** (the PDF paragraph). The rechecks say D33 writes the views list and the Audit text (`D33-premise-recheck.md:120`, `:203`), and D43 writes other lines. A different line, so the merge should be simple.
- **`tools/oculus/DESIGN.md:533`** (the "LaTeX builds" paragraph, its sentence on the viewer's page, zoom and scroll). Other writers:
  - D43 writes `:23`, `:568`, `:571-572` and makes `:535` untrue (`D43-premise-recheck.md:225`);
  - D33 writes `:568`;
  - D36 writes `:23` (`plan.md:599`);
  - X3e, D11, D28 and M6 name DESIGN.md for other paragraphs.
  - `:533` is one line, so a D43 edit to it would not be a simple merge. Not seen in its recheck.
- **Only under choice C4 (b):** `tools/present/assets/css/deck.css` (exists). No other queued step writes it, and Z650 freezes it.
- **Only if the M4-3 look on TEST shows the reload:** `tools/oculus/src/lib/views/sources/document/Document.svelte` and maybe `tools/oculus/src/lib/shell/frames/FrameLayer.svelte`. No queued brief names them.
- **Not expected:** `ui.svelte.ts`. D28 writes it (`registerDeleted`, `agents/briefs/D28.md:97`) and D11 reads it (`D11.md:78`). It would be needed only if C1 (b) or (c) needs a new forget-by-prefix beyond `clearInstanceStates` (`ui.svelte.ts:192`).
- **Not expected:** `HELP.md` and `docs/window.md`.

## 4. Libraries

- **Keeping a PDF's place across reloads and reopen: none found.**
  - pdfjs-dist 6.4.299 (Apache-2.0, `node_modules/pdfjs-dist/package.json:3,14`) is already the dependency, ruled by LA19 (a) and Z503.
  - Its viewer module exports `PDFHistory` among others (`grep -n "^export {" -A 40 .../pdf_viewer.mjs`). `PDFHistory` pushes onto the window's history, which D45 chose not to use because "the window's history is the router's" (`viewer.svelte.ts:23-25`).
  - The generic PDF.js app's per-document `ViewHistory` is not in the package's viewer module: `grep -c ViewHistory node_modules/pdfjs-dist/web/pdf_viewer.mjs` prints 0.
  - Saving a small record needs no library. The ui store and zod 4.6.5 (`package.json:110`) are already there.
- **The M4 defects, if kept:** CSS only; no library.

## 5. Choices

### User-visible, or changing an established decision

- **C1. What "kept per file" covers** (D15's line says "per file in the instance state"; D45's inventory row says "per file across reopen").
  - (a) Per tab, in the tab's ui instance record. It survives a reload, Open in New Window, Copy and Move into New Window (`float/store.ts:108-110` copies it), Return to Page and Restore panes. It is lost when the tab closes and when a preview tab is pointed at another file (`opening.ts:168`). Pro: smallest; Present's slide and Z592's source scroll work the same way. Con: fails the inventory row "across reopen". This is the lazy option, because it is the narrower reading of the line.
  - (b) Per file across every tab and reopen: one ui record keyed by file. Pro: meets "across reopen". Con: two tabs of one PDF overwrite each other's place, so after a reload both open where the last one scrolled. It also needs a cap on how many files are kept, and that cap is a new user-visible shape in `localStorage`.
  - (c) Both: each tab keeps its own place, and a new tab of a file starts at that file's last known place, with the per-file record capped. Pro: meets both texts, and two tabs keep their own places. Con: two records and a cap number to choose.
  - Recommended: (c), because it is the only option that meets both the plan line and D45's inventory row without one tab undoing another.
- **C2. What is kept.**
  - (a) The page and the offset only, the line's literal words.
  - (b) The page, the offset and the zoom: D45's `Position` type (`viewer.svelte.ts:90-95`) already holds these.
  - (c) (b) plus the scroll and spread modes and the side panel shown. The WebFetch of LaTeX Workshop's `types/latex-workshop-protocol-types/index.d.ts` shows its `PdfViewerState` holding `scale`, `scrollTop`, `scrollLeft`, `sidebarView`, `scrollMode` and `spreadMode`. Invert is not in that list.
  - Recommended: (c), since D45 measures the viewer against LaTeX Workshop and that is the state LaTeX Workshop keeps. (a) is the lazy option.
- **C3. Where it is stored.**
  - (a) The ui store in `localStorage` (`oculus.ui.v1`), as the line says ("instance state") and as `DESIGN.md:169` describes.
  - (b) A record under `~/.oculus/` on the server, so the Chrome page and the desktop app share it. This departs from the line's "instance state" and adds a route and a write.
  - Recommended: (a), because it is what the ruling says. (b) would be a new decision for Axel.
- **C4. M4-1 and M4-2 against Z650 (a clash between two rulings, so Axel's).** Z289 (the orchestrator, automode) gives D15 two defects of `tools/present/assets/css/deck.css`. Z650 (the user) says that deck is left as it is and is to be deleted.
  - (a) Drop M4-1 and M4-2 from D15 under Z650, and look at oculus's own equation card on TEST (`Equation.svelte`: token colours, `overflow-x: auto`, scaled to fit); any defect found there is fixed in D15.
  - (b) Fix `deck.css` anyway. This goes against Z650.
  - (c) Drop them with no look. This is the lazy option.
  - Recommended: (a), because Z650 is Axel's and later, and the look covers what M4-1 and M4-2 were about on the deck oculus now draws itself.
- **C5. M4-3 may already be met by E4's frame layer.**
  - (a) Look at it on TEST (Maximise pane, then Restore panes, on a document tab and a PDF tab). If the frame stays, M4-3 is closed in the booking by that look, with no code; if it reloads, D15 fixes it.
  - (b) Write code without the look.
  - Recommended: (a).

### Internal and reversible (the brief can take these)

- **I1. Where the reader goes:** a new module in `state/sources/explorer/`, or `file-type.ts`; `state/sources` is full. Recommended: `file-type.ts`, which already builds the state of a file view.
- **I2. When the place is written:** on PDF.js's `pagechanging` event and at the end of a scroll, throttled, never on every frame. Each `save` writes `oculus.ui.v1` and other pages follow it through storage events (`ui.svelte.ts:414`, `loadUi` with a source). Recommended: write on a page change and on a throttled end of scroll.
- **I3. The viewer's shape:** extend `open(url, key)` with an optional saved place fed into `#restore`, and add one `ViewerHooks` member, for example `placed(place)`. Recommended as stated.
- **I4. Writes only when it is safe:** write only while `status === 'ready'` and the box is drawn, never while the frame is `display: none` (`FrameLayer.svelte:79-80` at 8bd2070c) and never for a missing or unreadable file. Recommended.
- **I5. Validation:** clamp a saved page to the document's page count; accept only `auto`, `page-width`, `page-fit`, `page-actual` or a positive number as a zoom, otherwise use `auto`. Recommended.
- **I6. Tests:** no guarded entry covers this (section 2). Recommended: no test, with the look on TEST as the proof. A new entry would be a stop for Axel under the spec.

## 6. Cases

### Must pass, from the step's text

1. A PDF scrolled to page 5 at some offset and zoom, then the page reloaded: the tab opens at page 5, at the same offset and zoom.
2. The same PDF closed and opened again from Files: it opens at page 5 (C1 (b) or (c)).
3. Open in New Window on that PDF: the window's viewer opens at page 5, and Return to Page also lands at page 5.
4. Copy into New Window: the copy opens at the original's place.
5. Maximise pane and then Restore panes on a PDF tab and on a document tab (M4-3): the PDF keeps its page and the document frame is not reloaded.
6. A rebuilt PDF keeps its place (D45's behaviour, which D15 must not break).
7. Under C4 (a): oculus's equation card on a deck slide is readable in light and dark, and a wide formula in a 230 px pane fits or scrolls.

### Implied but never stated, each with its expected result

8. A saved page beyond the page count, because the PDF was rebuilt shorter: the last page opens, with no console error.
9. A saved zoom that is not a valid value: `auto` is used, with no PDF.js error.
10. A saved record that is not an object or holds NaN: ignored, and the PDF opens at the top.
11. A preview tab pointed at another PDF: the new file opens at its own place or at the top, never at the first file's place (`opening.ts:168` clears the record).
12. Two tabs of one PDF (Open in New Tab): each keeps its own place across a reload under C1 (c).
13. A hidden tab, or a frame that is `display: none`: it writes nothing, so the saved place is never overwritten with page 1.
14. A missing, invalid or unreadable file: nothing is written, and the saved place stays.
15. A forward SyncTeX search pending when the viewer opens: the search place wins over the saved place.
16. Scrolling through a 100-page PDF: no write per animation frame, and other pages do not reload records on every step.
17. A layout saved before D15, holding no place: the PDF opens at page 1 and G29 (`guarded.md:68`) is unaffected.
18. A picture or another file in a `file` tab: its ui record is unchanged.
19. More files opened than the cap under C1 (b) or (c): the oldest place is dropped, and no error is raised.

## Declined to judge

- Whether M4-1, M4-2 and M4-3 occur on screen today, on oculus's own Present card or on a document frame after E4: that needs a look on TEST, which my brief forbids (no server ports).
- Whether LaTeX Workshop restores a viewer's place when a closed PDF is opened again within one session, as opposed to the webview state VS Code restores: my WebFetch showed only the state type, not when it is restored.
- The capacity of PDF.js's own generic-viewer history: the module is not in the package, and I did not read its source.
- Whether D43's or D33's coming briefs write `DESIGN.md:533` or `docs/views.md:259`: their briefs do not exist yet, and their rechecks on 8bd2070c were running at the same time as this one.
