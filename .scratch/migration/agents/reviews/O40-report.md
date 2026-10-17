# O40 report: the defects of O37's looks

NOT done:
- The report file `tools/oculus/.scratch/migration/agents/reviews/O40-report.md` does not exist. The harness refuses report files written by a subagent ("Subagents should return findings as text, not write report files"). This message is the whole report, in the brief's order, and the orchestrator writes it to that path.
- Item 40 (row 73) meets its 1 s bound only while the Markdown server is running. The first drag of a page session, and the first drag after the server's 60 s linger, takes 4.2 to 5.2 s. Keeping the server longer contradicts G36 (open item A).
- Item 43 (row 84) has no change. Nothing in the built client or server names the requested path, and finding the cause needs the app's log (open item D).
- Items 34 (row 46) and 35 (row 49) have no change, because their premises are wrong (open items B and C).
- Item 38 (row 70) has its change, but its 50 ms bound can be measured only at the look. The unit-level timing shows the matcher is not the cost.
- Item 28 (row 30) places a new project at its links' rest length. On the twenty-node map, 5 of 20 links settle at 1.00 to 1.09 times the settled link length. So "within the link distance" holds only to within 9 percent, and the look decides it.

Everything else in the brief is done.

## Open items of the state file, verbatim

An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own.

## Open items this step raises

**A. Item 40 (row 73): the brief's 1 s bound clashes with G36.**
- G36 says a link-rewrite Markdown server ends 60 s after its answer. Its lifetime row reads 'is started for a link rewrite with no Markdown tab open and ends 60 s after its answer, not at 59.999 s'.
- On the look hub's size (2246 Markdown files, 44 MB), a cold server takes 4153 to 5171 ms for its first rewrite. So the first drag after the linger cannot meet 1 s.
- Options:
  - (a) Keep the link-rewrite server alive while the page that asked for it is open. This changes G36's text and its lifetime row. The first drag of a page session still pays the cold start once.
  - (b) Keep the 60 s linger as G36 says, and accept a cold drag after a minute of rest. This is the option that costs least now and leaves the defect.
  - (c) Start the server when a Files view mounts, so the first drag finds it warm. The cost is a Markdown server for every page that shows Files.
- Recommendation: (a). It ends the cold drag for every drag but the first, and it starts nothing a page did not ask for.

**B. Item 34 (row 46): no command opens an index tab.**
- `openHead` calls only `headTabState(root, path, 'head')`.
- The look made the tab by writing the layout store by hand, with a HEAD tab's id (`head:head:...`) and the side `index`.
- A tab opened with its own index id keeps its side. The scratch `index-side.mts` printed `index tab after a save and a read back: head:index:/r:a.txt index`.
- The must-hold can only be tested once an "Open File (Index)" command exists. That command is a new user-visible shape, so it is Axel's decision.

**C. Item 35 (row 49): the look hub's settings are stale.**
- The look hub's settings (`looks/d/hub-config.yml.bak`) name `leads_file:` and `radar_file:`, which are keys the engine does not read. They also lack the `radar` and `leads` collections.
- Over the hub's own current settings, the base already reads `radar {"lastRun":"2026-10-11"} leads 1`.
- The look is retaken over the hub's current settings.

**D. Item 43 (row 84): the requested path is a development address.**
- The path is Vite's development address of a `?worker` import, not a path the built app makes.
- The look is retaken with the app's log open, to find which page and which build asked for it.

**E. Test entries the cases would need.** The orchestrator brings these to Axel. No test was written for any of them.
- Item 1: "An open merge tab reads the three sides again when the repository's git state moves: a second conflict written behind it is drawn, and a conflict resolved behind it says the path is no longer in conflict."
- Item 2: "The commit box takes git's new prepared message when it changes while the field still holds the one offered before; a message the reader typed stays."
- Item 4: "The merge Result editor tints each open conflict at its line in the Result, following choices and typing; a settled region has no tint."
- Item 18: "A path joined to the root's own folder is the name alone, and a file git does not track gets no blame request."
- Item 20: "Two browser tabs that each change the layout within a second keep both changes, and an operation whose node the other tab removed is dropped."
- Item 25: "The status bar keeps the last active source tab's items while a view tab of another pane is active, until that source tab closes or is covered in its pane."
- Item 28: "A new project with links is placed at its links' settled distance, and no other node moves."
- Item 29: "After New File, or any open that asks for the keyboard, the new file's editor holds the keyboard once it mounts."
- Item 30: "After a paste into a closed folder the first pasted item is the selected row, in view."
- Item 31: "A terminal grid drawn again, by a reload, a move, Float or Return to Page, shows the lines it was scrolled to."
- Item 32: "After F8 the problem's line is in view below the sticky lines."
- Item 33, the LaTeX part: "Once a root leaves the workspace the LaTeX store sends no request for its files, and reads them again when it is added back."
- Item 36: "An armed Kill stays where it was for the second press at every row width, and its words are drawn whole or said on the bar."
- Item 37: "One press of Open Folder or Add Folder to Workspace from the palette closes the palette and opens one folder panel, and nothing says the panel is open already."
- Item 41: "A Terminal pane whose terminal's window takes a new size is sent the terminal's screen again, as tmux holds it at that size." G90 covers a pane that starts reading, not a resize.
- Item 42: "After the plan Submit Job asks for is refused, the keyboard is on Submit Job, the first press of a freshly opened tab included."

## The cases' first run, on the unchanged tree

Before any change, the worktree was identical to the base copy: `diff -rq` over `src tests config utils docs bin` and `HELP.md` / `DESIGN.md` printed nothing. Every run marked "base" below ran on the base copy, or on `scratchpad/o40/basecopy`, an rsync of it.

- **Item 1**, by reading `Merge.svelte:98-103`. The load effect is keyed on root and path through `taken`, so a second conflict git writes behind the tab is never read, and the tab keeps "1 conflict left".
- **Item 2**, by reading `CommitBox.svelte:72-86`. The prepared message goes in only while the field is empty, so the field keeps "Merge branch 'side'" after `MERGE_MSG` names side2.
- **Item 4**, by reading. Only `MergeSide.svelte:43-47` builds `highlights`; the Result `<Editor>` gets none.
- **Items 15 and 16**: the G9 rows appended to 'takes a created entry out again and puts a deleted one back' fail on base:
  ```
  AssertionError: a delete: expected 'title: Tasks\nschema:\n  - { field: t...' to be 'title: Tasks\nschema:\n  - { field: t...' // Object.is equality
   at tests/routes/edit/undo/undo.test.ts:302:73
  ```
- **Item 18**: `node --experimental-strip-types join-now.mts` on base printed:
  ```
  ["","look.tex"] -> "/look.tex"
  ["a","b"] -> "a/b"
  ["",""] -> ""
  ["a/","b"] -> "a/b"
  ["","/b"] -> "//b"
  ["a/","/b"] -> "a//b"
  ["/","b"] -> "/b"
  ```
- **Item 20**: the scratch `scratch-o40-case20.test.ts` on base printed:
  ```
  two splits of one pane: [ '[["a","c"],["b"]]', '[["b","c"],["a"]]' ]
  split in a pane the other tab closed: [ '[["a"],["b"],["c","d"]]', '[["c","d"]]' ]
  ```
- **Item 24**, by reading `Confirm.svelte:64,89-99`: Cancel then Confirm, the keyboard on Confirm, and no Save.
- **Item 26**: the G47 case on base:
  ```
  AssertionError: expected { titleBarStyle: 'hidden', ...(1) } to match object { acceptFirstMouse: true }
   at tests/server/desktop/window-guard.test.ts:209:39
  ```
- No case contradicted the brief's rules, so there was no stop.

## The items

Each item gives the operation at fault, the change, the reading or run, and the look on landing (the record to retake and what must be seen).

### 1. Row 14, merge tab
- **Fault.** `Merge.svelte` load effect (base :98-103) reads the sides once per root and path.
- **Change.** The effect is keyed on root, path and `gitFor(root)` (`Merge.svelte:113-116`, with `seen`).
  - A read bringing the same base, ours, theirs and deleted keeps the choices and typing (`sameSides`).
  - A read after this tab's own Complete Merge or Accept Deletion keeps the done note.
  - Any other read draws the new regions, or the refusal that the path is no longer in conflict.
- **Reading.** Before: one read. After: one read per git state move.
- **Look a/i43-1.** Open a merge tab on one conflict, then write a second conflict with git: the tab shows 2. Resolve it behind the tab: the tab says the path is no longer in conflict.

### 2. Row 15, commit box
- **Fault.** `CommitBox.svelte:72-86`.
- **Change.** When the prepared message changes and the field is empty or still holds the offered text (`offered`, :56), the field takes the new text. A typed message stays.
- **Look a/i43-1.** After the merges of side, then side2, the box reads "Merge branch 'side2'". With the field hand-edited, the hand text stays.

### 3. Row 21, Cmd+S while settings are held
- **Fault.** `tab-asks.svelte.ts:140` returned null while `facts.indent === null`.
- **Change.**
  - It publishes once `facts.read`, and `EditorStatus.indent` is `Indent | null`.
  - `SourceItems.svelte:169` draws the indentation item only when it is not null.
  - `widths` and `indentChoices` are functions that read it only then.
- **Reading.** Before: no status, so Cmd+S found no source tab. After: a status with a null indentation.
- **Look f/i43-12.** While the settings are held, Cmd+S in the editor saves, and the bar shows no indentation item until the settings arrive.

### 4. Row 26, Result tint
- **Change.** `openRuns(regions, pieces, choices)` in `merge-regions.ts:342` gives each open region's first Result line and line count. `Merge.svelte` passes it as `highlights={tints}`.
- **Run.** A run of `openRuns` gave `[{line 2,count 1},{line 4,count 1}]`, and after Incoming on the first conflict `[{line 5,count 1}]`.
- **Look a/i43-23.** Two open conflicts are tinted; accept one, and only the other stays tinted, at its new line.

### 5. Row 35, Transcript tab brought forward
- **Fault.** `PaneView.svelte` `entered`.
- **Change.** `entered` skips `activateInstance` when the event's target is inside `[role="tab"]` (`PaneView.svelte:184`).
- **Reading** of look d/i43-37: a press on the Projects tab of the right pane first activated the shown Transcript tab.
- **Look d/i43-37.** After a session card's pick, the tab used last is the one the reader used last.

### 6. Row 38, clone question dims the page
- **Change.** `CloneAsk.svelte:39,55` draw both Confirms at `level="palette"`.
- **Look e/R10.** No step of the clone question dims the page.

### 7. Row 39, Save to Literature answer
- **Change.** `SaveToLiterature.svelte` loses `onsaid` and draws its own `said` under the button (`:37`, `role="status"`). `LiteratureCard.svelte` and `RadarCard.svelte` stop passing it, and keep their own `onsaid` for their other answers.
- **Look f/L8.** A refused save is said under the button, and the notification of a refused write still comes.

### 8. Row 40, PDF place
- **Change.** `#position` takes `page: at.pageNumber ?? viewer.currentPageNumber` from `_location` (`viewer.svelte.ts:611`, type `PdfLocation` at :100).
- **Look f/L38.** At Page Width, part way into a page, the place survives a reload.

### 9. Row 41, picture preview at 0x0
- **Change.** `sizePicture(picture, tallest)` (`latex-widget.ts:110`) sets a definite width and height from the natural size, capped at 458 px and at `PICTURE_MAX_HEIGHT` with the aspect kept. A picture with no size of its own gets width 458. It is called after decode and in `fitBeside`.
- **Look f/L57.** The picture has a non-zero size. In a narrow pane the widget scrolls with the text.

### 10. Row 44, Save to Literature refused
- **Fault.** `homeNaming`.
- **Change.** `homeNaming` (`hubs.ts:180-193`) takes a hub whose list names the collection, or, for Literature, a hub holding the file at the engine's path (`literatureFile`, exported from `literature.ts`). The doc at :176-179 says so.
- **Reading** of look f/L80: the primary's list names no literature, so base picked hub2, which lacks the file.
- **Docs.** `docs/data-map.md` and the Literature bullet of `HELP.md` now say which hub takes the paper.
- **Look f/L80.** The save lands in the primary's Literature file.

### 11. Row 45, Search scope
- **Change.** `rescope(id, changes, roots)` in `search.svelte.ts:139` and `:504` (`changeAndRun`, shared with `toggleMode`). `Search.svelte` (onroot, onclearscope) and `row-menu.ts` use it.
- **Look c/L20.** A change of root or scope runs the search again.

### 12. Row 51, "saved status" after undo
- **Change.** `Entry.svelte:184-193`. `say(words)` records `saidOver = shownValues`, and an effect clears `said` when the values differ. The page's own save keeps its line.
- **Look d/owed-D52.** After an undo from History the line goes.

### 13. Row 53, History value pills
- **Change.** `History.svelte`'s `.reveal` wrapper around the value pill is removed. Only Undo is revealed. The head comment says so.
- **Look d/owed-D52.** The pills are drawn at rest.

### 14. Row 55 (G96), Settings save dot
- **Change.** `writer.ts`:
  - `landed` (:80). An answer with the value written ends the draft (the tab reads saved).
  - `shown(row)` returns the value sent until the push.
  - A push with another value says `workbench.settings_changed_since`.
  - `Editor.svelte` reads `current`.
- **G96 test** (`tests/state/system/settings/editor-saved.test.ts`):
  - Edited assertion, before `expect(writer.saved(row)).toBe(false)`, after `toBe(true)`.
  - Added `expect(ended).toHaveBeenCalledWith(row)` and `expect(writer.shown(row)).toEqual({})`, then `toBeUndefined()` after the push.
  - New test 'says the file changed when the push after the answer brings another value'.
  - Base failures: `expected false to be true` at `editor-saved.test.ts:48:35`, and `TypeError: writer.shown is not a function` at `:75:23`. After: 2/2.
- **Look e/L24.** The dot goes when the write returns.

### 15 and 16. Rows 58 and 59 (G9, and G8)
- **Change.**
  - `replacedLines` and `putBack` in `config-checks.ts` record the text an add or a delete replaced, widened by one whole line on each side.
  - `removeEntry` and `createEntry` (`entries.ts`) record `replaced`.
  - `putBackEntry` (`entries.ts:478`) puts the text back when the file still holds what the write left. It rereads the file through `collectionText` (split out of `collections.ts`), and checks the entry and every other entry.
  - Otherwise `collectionUndo` (`undo.ts:560-567`) falls back to `removeEntry` / `createEntry`, which keeps a hand change.
  - Feed deletes (Lit Watch, leads) take the same path: `deleteFeedEntry` records `replaced`, and `restoreFeedEntry` tries `putBackDeleted` (`feeds.ts:713`) before the render fallback.
  - The doc comments of `changes.ts` and `DESIGN.md:159` name the records that carry the text.
- **G9, `tests/routes/edit/undo/undo.test.ts`:**
  - Rows appended to 'takes a created entry out again and puts a deleted one back', title kept: a delete, an add, and each over a hand change. Base failure quoted above.
  - New 'puts a deleted lead back byte for byte, and keeps a hand change made after the delete'. Base failure: `expected 'meta: {}\nschema:...' to be 'meta: {}\nschema:...'` at `undo.test.ts:619:44`.
- **G8 tests** (the brief named only G9, but `writes/` is G8 code):
  - `tests/server/edit/writes.test.ts`, 'appends a new entry rendered from the file schema': the expected record before was `record(...)`; after, it is `{ ...record(...), replaced: { offset: TASKS.length - last.length, before: last, after: `${last}\n  - title: A new task\n    status: open\n` } }`. Base failure at `writes.test.ts:544:21`.
  - `tests/routes/hubs/hub-writes.test.ts`, rows 'a deletion', 'a Lit Watch deletion' and 'a lead deletion' lose `values: true`. The assertion before was `expect(differing(before.lab, back), row.name).toEqual(row.values === true ? [...row.files].sort() : [])` plus a parse-equality loop; after, it is `expect(differing(before.lab, filesOf(lab)), row.name).toEqual([])`. Titles are unchanged. Base failure: `a deletion: expected [ 'tasks/tasks.yml' ] to deeply equal []` at `hub-writes.test.ts:267:67`, and the same for the other two rows.
- **Look d/owed-D72-11.** Delete then undo, and add then undo: the file is byte for byte as before.

### 17. Row 61, missing settings file requested
- **Change.** `source-options.ts` `named(root)` (:128) reads `.oculus/settings.yml` only once the held listings name it. The input is `fs: Pick<FsStore,'listing'|'fileText'>`, and `Source.svelte` and `DiffSection.svelte` pass `client.fs`.
- **Look e/L109.** A workspace switch sends no 404 for a missing settings file.

### 18. Row 62, failing requests on a plain file
- **Change.**
  - `joinPath` (`paths.ts:76`). After, the same run printed `"look.tex"`, `"a/b"`, `""`, `"a/b"`, `"b"`, `"a/b"`, `"/b"`, `"/"`.
  - `gitTracks` (`file-git.ts:101`), `ignoredFile` (`fs.svelte.ts`), `tracked` (`tab-file.svelte.ts`) and the gutter's `tracked` input (`source-gutter.svelte.ts:68,129`).
- **Scratch `tracked.mts`** on a real repository:
  - done.txt: tracked, and git blames it.
  - new.txt, fresh/inner.txt, staged.txt: false, and git refuses "no such path ... in HEAD".
  - skip.log: ignored.
  - A repository with no commit: false.
- **Caveat.** git's untracked and staged lists are capped at 200 entries (`MAX_ENTRIES`). Past the cap, a file beyond the list counts as tracked, in part covered by `untrackedByFolder`.
- **Look f/L62.** Opening a plain file sends no failing `/api/git?blame` or `/api/latex` request.

### 19. Row 66, popped-out window
- **Change.** `palette-open.ts:79` and `CommandRows.svelte` / `FileRows.svelte` / `SymbolRows.svelte` open into `float ?? undefined`. `palette-source.svelte.ts` `openFile(root, path, page?)`.
- **Look o/L112.** In a popped-out window, `:tab help` and Quick Open open in that window.

### 20. Row 68, two browser tabs splitting
- **Fault.** `splitInstance` saved twice, so the crossing rule never matched.
- **Change.** New `layout/saved/rerun.ts`, split by concern from `layout.svelte.ts` (890 to 858 lines).
  - An operation is one save.
  - A path argument is named again in the new arrangement by what it held: a pane by its tabs, a page by its page, a split by its leaves, an empty pane by its place.
  - An operation whose node is gone is dropped.
  - New ops `resizeSplit` and `lockPane`, used by `PageLeaf`, `PageArea` and `PaneView`.
- **Run.** The scratch after printed `two splits of one pane: [[["c"],["a"],["b"]], same]` and `split in a pane the other tab closed: [[["b"],["c","d"]], same]`.
- **Look o/line720.** Both splits survive in both tabs.

### 21 and 39. Rows 72 and 71, palette list
- **Fault.** bits-ui Command reselects the first item and skips its scroll.
- **Change.** `FileRows.svelte` `onselect` prop and `keep(root)` (:114): a new answer selects and scrolls its first row, and paging keeps the selected row. `Palette.svelte` passes `onselect`.
- **Look c/L76.** ArrowDown from the last drawn row selects the next row in view, and a new answer brings the selection into view.

### 22. Row 74, Node's command line instead of tmux's sentence
- **Change.**
  - `tmux.ts`: a call killed at its timeout rejects as `TmuxSilence('timeout')`, and an empty stderr as `TmuxSilence('silent')`. `silenceWords` words them from `server.terminals.tmux_timeout` / `tmux_silent` (`server.yml`).
  - `channel.ts:537` reports `silenceWords(error, this.#text) ?? said`.
- **Run.** Stub base runs gave Node's "Command failed: ...". After, the channel printed `"tmux did not answer within 5 s"`.
- **Look d/L91.** The Schedules section never quotes Node's command line.

### 23. Row 80, undo row words
- **Change.** `history.yml:74` reads `undid_new_entry: add undone`.
- **Look d/owed-D72-11.** The add's undo row reads "add undone".

### 24. Row 81 (G28), close question over unsaved text
- **Change.**
  - `Confirm.svelte` `discard`. `CloseQuestion.svelte` `onsave`: Don't Save, Cancel, Save, with the keyboard on Save.
  - `ui.yml`: the brief's wording for `tab_close_dirty` and `tabs_close_dirty`, plus `confirm_dont_save` and `confirm_save`.
  - `ui.svelte.ts` `registerCloseSave` and `saveForClose`, returning the tabs left unsaved. Tab saves return their outcome (RailEditor, Editor, Control, `autosave.saveAsked`, the app editor through `context.ts`).
  - `close-question.svelte.ts` `save()` / `saves()`. `PaneView`, `editor-closing.ts` and `OpenEditors`.
  - `pages.ts`: `closeAsk` with `dirty`, `Answer = 'yes'|'no'|'save'`, `ResetSaves`. A held close carries its own `save`, which `CloseQuestions.svelte` runs.
  - The reset surfaces (`ActivityRail`, `PagesReset`) draw their question through `CloseQuestions`.
  - `HELP.md:53,66`. `DESIGN.md:706`.
- **G28 tests:**
  - `tab-menu.test.ts`: 'asks before Close Others...' asserts `${catalog('ui.tab_close_dirty')} ...` in place of `${catalog('ui.tab_close_many', 2)} ...`, plus `expect(question.saves()).toBe(true)`. New tests: "closes a tab holding unsaved text once Save wrote it, and on Don't Save without writing it" and 'keeps open, with its text, a tab whose save failed or that has no save, and closes the rest on Save'.
  - `pages.test.ts`:
    - In 'asks one question over a pane...', the assertion `expect(ask?.message).toBe(MANY)` becomes `expect([ask?.message, ask?.dirty]).toEqual([t('ui.tab_close_dirty'), ['text']])`.
    - Title changed. Old: 'asks how many go when several tabs close, naming only the tabs left unsaved'. New: 'asks to save the tabs left unsaved when several tabs close, naming them, and how many go once none is'.
    - In that test, `toBe('Close 2 tabs?')` becomes a `[message, dirty]` equality, and `{ message, detail }` gains `dirty: []`.
    - New describe 'the close of a page holding unsaved text', with 'asks to save it, and Save closes the page once the save took' and 'keeps the page with the tab whose save failed, its text kept, and closes the others'.
  - `app-editor-close.test.ts`: the assertion becomes `[message, saves()]`, and there is a new test 'saves through the frame on Save and closes the tab once the frame cleared the mark'.
  - 12 failures on base, for example `TypeError: question.saves is not a function` at `app-editor-close.test.ts:116:46`, `client.ui.registerCloseSave is not a function` at `tab-menu.test.ts:133:42`, and `expected [ 'Close 2 tabs?', undefined ] to deeply equal [...]` in pages.test.ts.
- **Look o/O30 case 41.** Cmd+W then Enter saves and closes. Don't Save loses the text. Escape keeps it. A page closed from the rail asks the same question.

### 25. Row 82, status items
- **Change.** `sourceKept` (`editor-status.svelte.ts:187`), and `StatusBar.svelte` keeps `kept`.
- **Run.** The scratch printed `viewOfOtherPane` null on base and "src1" after; covered and closed give null on both.
- **Look (O30 looks).** With Files active in another group, the editor items stay, and they go when the source tab closes.

### 26. Row 85 (G47), first press on an inactive window
- **Change.** `window-options.ts:65,84`: `acceptFirstMouse: true` on darwin.
- **Test.** New G47 test "makes the main window and a float's window take the first press on an inactive window on macOS". Base failure quoted above; after, 9/9.
- **Look O30 case 27.** A drag from the inactive window moves the tab in one drag, with the real pointer.

### 27. Row 27, Cmd+A in the Settings search
- **Fault: premise wrong.** Nothing in the box takes Cmd+A. Electron's `registerAccelerator` applies to Linux and Windows only, and the look's CDP keys reach no menu role.
- **Change.** Only the false head comment of `src/desktop/windows/menu.ts` is rewritten.
- **Look e/L22.** Retake with real keys: Cmd+A selects, and typing replaces the text.

### 28. Row 30, new project on the rim
- **Change.** `forces.ts` `settleNew` (:470). The kept nodes are pinned, the new node's links rest at the median standing length, the map ticks to rest, and alpha and velocities are restored.
- **Run `map-new.mts`, 10 maps each:**

  | Map | Base | After |
  |---|---|---|
  | 161 nodes | max 1.8 L, 5 of 30 links farther than L | max 0.9 L, 0 of 30 |
  | 20 nodes | max 0.9 L, 0 of 20 | 0.6 to 1.1 L, 5 of 20 at 1.00 to 1.09 L |

  In both runs no other node moved.
- **Look b/line702.** The new project sits next to its links.

### 29. Row 33, New File and the keyboard
- **Fault.** The loading placeholder took the ask, was removed, and focus fell to BODY.
- **Change.** `SourceBody.svelte` marks the placeholder `data-tab-loading`, and `PaneBody.svelte:251` keeps the ask standing for it.
- **Look c/L81.** After New File, typing goes into the editor.

### 30. Row 34, Paste into a closed folder
- **Change.** `settledEntries` (`fs.svelte.ts:565`), the prune in `rooted-tree.svelte.ts`, the `reveal` prop of `TreeView.svelte`, the `shown` dep in `picks.svelte.ts`, and `shownRow` in `Tree.svelte`.
- **Run `paste-select.mts`.** "pruned by the held entries: selected = null"; "pruned by the settled entries: selected = {"root":"hub","path":"q88/sub/a.txt"}".
- **Look c/L82.** The pasted item is selected and in view.

### 31. Row 36, terminal scroll position
- **Change.** `viewport.ts` keeps the viewport by the text of its first lines, plus `sessionStorage`. `kept-viewport.ts`. `TerminalGrid.svelte`.
- **Run `viewport.mts`:**
  - Base: redraw top "359" (shown "354"), reload "371".
  - After: "354" and "354".
- **Look d/L27.** A reload and a redraw keep the top line.

### 32. Row 42, F8 under the sticky line
- **Change.** `revealLaidOut` (`commands.ts:30`) reveals again at each new layout height for 1 s, and stops on a mouse press, a key or a wheel.
- **Run `reveal.mts`.** Base reveals at height 23; after, at 23 and 513.
- **Look f/L58.** After F8 the line is fully in view below the sticky lines.

### 33. Row 43 (G93), requests to a root that left
- **Change.**
  - `reloadSource` returns early for an unserved root (`source.svelte.ts:495`).
  - `latex.svelte.ts` (`unservedTargets` at :214) and `calls.ts` guard every request by root, and `latex.yml` has an `unserved` key.
  - `Source.svelte` asks no gutter for an unserved tab.
- **G93 test** 'reads nothing of a file whose root left the workspace when its channel says it changed'. Base failure: `expected [ [ 'fixture/a.md' ], 'same' ] to deeply equal [ [], 'unserved' ]` at `source-unserved.test.ts:69:77`. After: 4/4.
- **Run `latex-left.mts`.** Base: 1 / 6 / 0 requests before, after leaving, after adding back. After: 1 / 0 / 1.
- **Look f/L71.** No failed request after the root leaves.

### 34. Row 46
No change; see open item B. Look a/L56 waits on that ruling.

### 35. Row 49
No change; see open item C. Run `radar2.mts` over the hub's own settings: `radar {"lastRun":"2026-10-11"} leads 1`. With the radar file gone: `radar null` and the finding `feeds/literature-radar.yml "" registry file does not exist`. Look d/i43-28 over the hub's current settings.

### 36. Row 50, armed Kill
- **Change.**
  - `RowFace.svelte`: `.description { flex: 1 1 0; width: 0; min-width: 0 }`, so arming moves no control, and `oncut` reports cut words.
  - `TerminalList` / `terminal-list.ts` pass `onarmedcut`.
  - `Terminal.svelte` sends the armed words to the bar when they are cut.
- **Look d/L55.** At 180 and 203 px the second press lands on Kill, and the words are whole or on the bar.

### 37. Row 69 (G42 code unchanged), Add Folder to Workspace
- **Change.** `CommandRows.svelte` `panelled` (:89) closes the palette, then posts what is left to say as a notice. `Files.svelte` loses its `panelOpen()` busy line.
- **Look o/L95, o/L68.** One press opens one panel, the palette closes, and no "already open" appears.

### 38. Row 70, first key in file mode
- **Fault.** The first key emptied the list until the worker answered.
- **Change.** The work removed from the first key: the list keeps the open files until the matcher has answered (`file-list.svelte.ts`, used by `Palette.svelte`).
- **Unit timing** (`time-first.mts`, 9893 names): prepare 39.7 ms; per key 0.4 to 6.3 ms (s 1.84, sr 2.55, src 2.07, tes 6.27 ms). The page-side cost cannot be timed at unit level.
- **Look c/L76.** Ten runs, giving the mean and spread against 50 ms.

### 40. Row 73, Refactor Preview after a drag
- **Fault.** The backtick pass of `links.ts` read every file.
- **Change.** `touches(text, real, moves)` (`links.ts:107`) keeps only files under a move's target or naming the moved file's basename. The run `touches.mts` printed "files a move changed: 22, of them left out by the filter: 0".
- **Run `links-real.mts`** (2246 files):

  | Run | Base | After |
  |---|---|---|
  | First | 10798 ms | 5171 ms |
  | Warm | 5805 to 6081 ms | 352 to 423 ms |
  | After the 65 s linger | 10215 ms | 4153 ms |

- G89/G72 tests `markdown-links-lent.test.ts` and `markdown-created.test.ts` pass on base and after.
- **Look c/L69.** Warm drags under 1 s; the cold drag waits on open item A.

### 41. Row 75 (G90 code), one prompt where tmux holds two
- **Fault.** tmux and xterm.js reflow differently at a resize.
- **Change.**
  - `pty-wire.ts` sends `subscribe([ch], true)` after a resize that changed the size on an admitted socket, for a terminal a pane reads and whose order is not waiting (`waits` in `pty-subscribe.ts`).
  - `kept-viewport.ts` `reset` keeps the reader's line, and `TerminalGrid.svelte:366` calls it.
- **Run `repaint.mts`:**
  - Narrower: base `["resize 60x24"]`; after `["resize 60x24","subscribe pty:t1 again=true"]`.
  - Same size, socket not admitted, and no pane reading: unchanged.
  - Viewport after the screen is sent again: base 186; after 55, reading "line 50".
- G90 tests `moved-pane-screen.test.ts` and `pane-screen.test.ts` pass on base and after.
- **Look d/L84.** After a resize the page shows both prompts, with no reload.

### 42. Row 76, Submit Job
- **Fault.** `keepThroughPress` held the ask until the click that Enter sends.
- **Change.** `PaneBody.svelte`: the hold drops at keydown, and `chosen` keeps the ask only for a target inside `[data-tab-loading]` (:262).
- **Look f/L17.** Three runs; after refusing the plan, the keyboard is on Submit Job.

### 43. Row 84
- **No change.**
- **Evidence.**
  - A grep of the built `.svelte-kit-app/output`, `build-app` and the workers chunk finds no `/node_modules/monaco-editor/esm/vs/editor/editor.worker.js`. The chunk uses `new URL('../workers/editor.worker-a97YorOs.js', import.meta.url)`.
  - monaco falls back to its own URLs only without `getWorker`, which `load.ts:311-313` always sets.
  - Look f/r2/network.jsonl shows the path as the `?worker` address on the dev port.
- **Look.** See open item D.

## DONE / NOT DONE

| Check | Result | Command and output |
|---|---|---|
| diagrams | DONE | `npm run diagrams`, exit 0 |
| test:quick after the last change | DONE | 5 runs in all. The third failed `prettier` on `rerun.ts`, which was then formatted. The last run printed `ok ASCII gate (7.1 s)`, `ok prettier (6.7 s): All matched files use Prettier code style!`, `ok svelte-kit sync (13.0 s)`, `ok eslint (25.5 s)`, `ok svelte-check (27.7 s): ... 513 FILES 0 ERRORS 0 WARNINGS`, `ok vitest (71.3 s)`, `test:quick: 84.5 s (limit 45.0 s); every command passed`, `test:quick: over the time limit`. It also printed `tests/routes/hubs/hub-writes.test.ts: changed, run by npm run test:slow`. |
| ASCII gate | DONE | spec perl form over the 129 touched files: 0 lines. Over `src tests config`: 0 lines. |
| Line limits | DONE | `wc -l`: no source over 880 and no component over 520. `state/client/context.ts` is 880 and `Terminal.svelte` / `TerminalGrid.svelte` are 520. |
| Guarded tests, before and after | DONE | base copy: 99 files / 1073 tests passed. Worktree, final: 99 files / 1082 tests passed. Failing lines of changed tests on base are quoted per item. |
| Tree checks | DONE | `npx vitest run` over size, boundaries, duplication, order, cycles, augments, keys, history, comment-width, diagrams, palette page and config: all pass |
| `npm run check` | DONE | 4117 files, 0 errors |
| unused exports | DONE | `diff` against the base list. The only difference is that `noServer` left `channel.ts`'s line (moved to `tmux.ts`, which imports it). No new line was added. |
| Report file | NOT DONE | refused by the harness; this message is the report |

## Files, from diff -rq against the base copy (base, now)

| File | Base | Now |
|---|---|---|
| `DESIGN.md` | 759 | 761 |
| `HELP.md` | 503 | 508 |
| `config/text/server.yml` | 524 | 527 |
| `config/text/ui.yml` | 154 | 157 |
| `config/text/views/academic/latex.yml` | 216 | 217 |
| `config/text/views/system/history.yml` | 107 | 107 |
| `docs/data-map.md` | 210 | 210 |
| `docs/diagrams/layer-server.dot` | 159 | 159 |
| `docs/diagrams/layer-server.svg` | 781 | 781 |
| `docs/diagrams/layer-shell.dot` | 156 | 156 |
| `docs/diagrams/layer-shell.svg` | 715 | 715 |
| `docs/diagrams/layer-state.dot` | 173 | 173 |
| `docs/diagrams/layer-state.svg` | 855 | 855 |
| `docs/diagrams/layer-views.dot` | 184 | 184 |
| `docs/diagrams/layer-views.svg` | 832 | 832 |
| `docs/diagrams/layers.dot` | 92 | 92 |
| `docs/diagrams/layers.svg` | 505 | 505 |
| `docs/diagrams/writes.dot` | 940 | 956 |
| `docs/diagrams/writes.svg` | 2969 | 3021 |
| `src/desktop/decide/window-options.ts` | 120 | 128 |
| `src/desktop/windows/menu.ts` | 146 | 149 |
| `src/lib/data/helpers/files/paths.ts` | 148 | 151 |
| `src/lib/server/core/changes.ts` | 420 | 424 |
| `src/lib/server/edit/feeds/feeds.ts` | 788 | 842 |
| `src/lib/server/edit/feeds/literature.ts` | 259 | 259 |
| `src/lib/server/edit/writes/config/config-checks.ts` | 594 | 638 |
| `src/lib/server/edit/writes/entries.ts` | 613 | 673 |
| `src/lib/server/edit/writes/hubs.ts` | 242 | 251 |
| `src/lib/server/edit/writes/undo.ts` | 594 | 610 |
| `src/lib/server/files/fs/collections.ts` | 153 | 161 |
| `src/lib/server/machine/lsp/held/requests/links.ts` | 395 | 410 |
| `src/lib/server/machine/pty/channel.ts` | 878 | 876 |
| `src/lib/server/machine/pty/tmux.ts` | 460 | 511 |
| `src/lib/server/machine/runs/schedules/watch.ts` | 787 | 788 |
| `src/lib/server/root/context.ts` | 877 | 786 |
| `src/lib/server/root/process/context/dependencies.ts` | new | 115 |
| `src/lib/shell/commands/CloneAsk.svelte` | 119 | 122 |
| `src/lib/shell/keys/Palette.svelte` | 519 | 515 |
| `src/lib/shell/keys/lists/file-list.svelte.ts` | new | 49 |
| `src/lib/shell/keys/lists/file-window.svelte.ts` | 46 | 46 |
| `src/lib/shell/keys/palette-open.ts` | 88 | 95 |
| `src/lib/shell/keys/rows/CommandRows.svelte` | 234 | 260 |
| `src/lib/shell/keys/rows/FileRows.svelte` | 197 | 243 |
| `src/lib/shell/keys/rows/SymbolRows.svelte` | 104 | 104 |
| `src/lib/shell/panes/PaneBody.svelte` | 352 | 371 |
| `src/lib/shell/panes/PaneView.svelte` | 517 | 519 |
| `src/lib/shell/panes/leaf/PageArea.svelte` | 117 | 116 |
| `src/lib/shell/panes/leaf/PageLeaf.svelte` | 171 | 179 |
| `src/lib/shell/panes/strip/close-question.svelte.ts` | 113 | 139 |
| `src/lib/shell/rail/ActivityRail.svelte` | 377 | 372 |
| `src/lib/shell/rail/WorkbenchMenu.svelte` | 120 | 123 |
| `src/lib/shell/status/SourceItems.svelte` | 197 | 204 |
| `src/lib/shell/status/StatusBar.svelte` | 417 | 426 |
| `src/lib/state/boards/structure/forces.ts` | 547 | 615 |
| `src/lib/state/client/context.ts` | 874 | 880 |
| `src/lib/state/sessions/latex/calls.ts` | 206 | 213 |
| `src/lib/state/sessions/latex/latex.svelte.ts` | 693 | 728 |
| `src/lib/state/sessions/source/autosave.svelte.ts` | 218 | 232 |
| `src/lib/state/sessions/source/source.svelte.ts` | 847 | 853 |
| `src/lib/state/sessions/terminal/pty/pty-subscribe.ts` | 136 | 139 |
| `src/lib/state/sessions/terminal/pty/pty-wire.ts` | 102 | 131 |
| `src/lib/state/sessions/terminal/viewport.ts` | 45 | 135 |
| `src/lib/state/sources/explorer/ops.svelte.ts` | 792 | 792 |
| `src/lib/state/sources/fs.svelte.ts` | 832 | 864 |
| `src/lib/state/sources/repositories/diff/merge-regions.ts` | 336 | 365 |
| `src/lib/state/sources/repositories/file-git.ts` | 214 | 232 |
| `src/lib/state/sources/search/search.svelte.ts` | 536 | 555 |
| `src/lib/state/system/config/editors/writer.ts` | 152 | 179 |
| `src/lib/state/workbench/layout/saved/rerun.ts` | new | 267 |
| `src/lib/state/workbench/layout.svelte.ts` | 890 | 858 |
| `src/lib/state/workbench/navigation/editor-status.svelte.ts` | 257 | 282 |
| `src/lib/state/workbench/navigation/pages.ts` | 678 | 755 |
| `src/lib/state/workbench/palette-source.svelte.ts` | 160 | 160 |
| `src/lib/state/workbench/palette.ts` | 832 | 832 |
| `src/lib/state/workbench/ui.svelte.ts` | 838 | 878 |
| `src/lib/ui/controls/CloseQuestion.svelte` | 33 | 50 |
| `src/lib/ui/controls/Confirm.svelte` | 183 | 195 |
| `src/lib/ui/controls/editor/commands.ts` | 256 | 285 |
| `src/lib/ui/controls/editor/kit/latex/latex-widget.ts` | 329 | 347 |
| `src/lib/ui/tabs/CloseQuestions.svelte` | 38 | 75 |
| `src/lib/ui/tree/TreeView.svelte` | 281 | 312 |
| `src/lib/views/boards/entry/Entry.svelte` | 349 | 364 |
| `src/lib/views/feeds/literature/LiteratureCard.svelte` | 222 | 221 |
| `src/lib/views/sessions/terminal/Terminal.svelte` | 517 | 520 |
| `src/lib/views/sessions/terminal/bar/TerminalBar.svelte` | 121 | 122 |
| `src/lib/views/sessions/terminal/grid/TerminalGrid.svelte` | 520 | 520 |
| `src/lib/views/sessions/terminal/grid/kept-viewport.ts` | 55 | 105 |
| `src/lib/views/sessions/terminal/list/RowFace.svelte` | 103 | 126 |
| `src/lib/views/sessions/terminal/list/TerminalList.svelte` | 484 | 487 |
| `src/lib/views/sessions/terminal/terminal-list.ts` | 725 | 727 |
| `src/lib/views/shared/card/feed/RadarCard.svelte` | 322 | 321 |
| `src/lib/views/shared/card/feed/SaveToLiterature.svelte` | 81 | 105 |
| `src/lib/views/shared/changes/CommitBox.svelte` | 316 | 319 |
| `src/lib/views/shared/explorer/rooted-tree.svelte.ts` | 257 | 259 |
| `src/lib/views/shared/explorer/tree/Tree.svelte` | 511 | 517 |
| `src/lib/views/shared/explorer/tree/control/picks.svelte.ts` | 336 | 341 |
| `src/lib/views/shared/explorer/tree/menu/row-menu.ts` | 672 | 678 |
| `src/lib/views/shared/prose/editor/source-options.ts` | 175 | 194 |
| `src/lib/views/sources/file/pdf/pdf-library.ts` | new | 110 |
| `src/lib/views/sources/file/pdf/viewer.svelte.ts` | 880 | 832 |
| `src/lib/views/sources/files/Files.svelte` | 418 | 418 |
| `src/lib/views/sources/files/control/editor-closing.ts` | 52 | 59 |
| `src/lib/views/sources/files/sections/OpenEditors.svelte` | 335 | 343 |
| `src/lib/views/sources/repositories/apps/change-offers.svelte.ts` | new | 67 |
| `src/lib/views/sources/repositories/diff/DiffSection.svelte` | 524 | 504 |
| `src/lib/views/sources/repositories/merge/Merge.svelte` | 335 | 373 |
| `src/lib/views/sources/search/Search.svelte` | 323 | 324 |
| `src/lib/views/sources/source/Source.svelte` | 517 | 518 |
| `src/lib/views/sources/source/SourceBody.svelte` | 215 | 217 |
| `src/lib/views/sources/source/source-gutter.svelte.ts` | 202 | 210 |
| `src/lib/views/sources/source/status/tab-asks.svelte.ts` | 177 | 177 |
| `src/lib/views/sources/source/status/tab-file.svelte.ts` | 94 | 113 |
| `src/lib/views/system/history/History.svelte` | 484 | 477 |
| `src/lib/views/system/workbench/Pages.svelte` | 350 | 362 |
| `src/lib/views/system/workbench/PagesReset.svelte` | 116 | 111 |
| `src/lib/views/system/workbench/RailEditor.svelte` | 279 | 276 |
| `src/lib/views/system/workbench/Workbenches.svelte` | 361 | 372 |
| `src/lib/views/system/workbench/editors/Editor.svelte` | 222 | 233 |
| `src/lib/views/system/workbench/editors/writer.svelte.ts` | 36 | 40 |
| `src/lib/views/system/workbench/settings/Control.svelte` | 157 | 158 |
| `tests/routes/edit/undo/undo.test.ts` | 647 | 736 |
| `tests/routes/hubs/hub-writes.test.ts` | 655 | 641 |
| `tests/server/desktop/window-guard.test.ts` | 203 | 212 |
| `tests/server/edit/writes.test.ts` | 737 | 746 |
| `tests/shell/panes/strip/app-editor-close.test.ts` | 130 | 149 |
| `tests/shell/panes/strip/tab-menu.test.ts` | 153 | 207 |
| `tests/state/sessions/source-unserved.test.ts` | 57 | 75 |
| `tests/state/system/settings/editor-saved.test.ts` | 52 | 78 |
| `tests/state/workbench/navigation/pages.test.ts` | 182 | 229 |

**Docs.**
- Rewritten: `HELP.md` (lines 53, 66, 88, 261, 276, 309, 391, 395-396), `DESIGN.md` (159, 604-605, 668, 706, 737), `docs/data-map.md:205`, and `docs/diagrams` (regenerated).
- Re-read and still true: `docs/apps.md` (`scm/change/title` row), `docs/palette.md` (the palette page check passes), `docs/templates.md`, and `README.md` (none of the changed names appear there).

## Judgment calls
- The brief's `app.dont_save` is `app.clone.dont_save`, the clone question's key. New keys `ui.confirm_dont_save` and `ui.confirm_save` carry the close question's words.
- Case 18's "no leading slash" is read as applying to a relative base: `joinPath('/', 'b')` stays `/b`.
- Items 15 and 16 change G8 code (`writes/`) as well as G9's, so G8's tests `writes.test.ts` and `hub-writes.test.ts` were edited; G8 is not in the brief's list. Feed deletes (Lit Watch, leads) were made byte for byte too, since hub-writes encoded the values-only undo for them.
- The add's and the delete's `replaced` are widened by one whole line on each side. A hand change outside those lines still puts the text back and keeps the hand change; one inside them goes to the fallback.
- A held page close carries its own Save (`HeldClose.save`), and the reset surfaces draw their question through `CloseQuestions`. This keeps one copy of the question's markup (the duplication check).
- Splits by concern, each under the limits and within the 10-item folder rule:
  - `server/root/context.ts` -> `process/context/dependencies.ts`
  - `Palette.svelte` -> `lists/file-list.svelte.ts`
  - `viewer.svelte.ts` -> `pdf-library.ts`
  - `DiffSection.svelte` (524 on base) -> `apps/change-offers.svelte.ts`
  - `layout.svelte.ts` -> `layout/saved/rerun.ts`
- Item 41 is fixed on the client, because `channel.ts` is at 876 lines and the pty folder holds 10 items.
- Item 38's removed work is the emptying of the list on the first key.

## User-visible changes, before -> after
- Merge tab: reads once -> follows git's state.
- Commit box: keeps the old prepared message -> takes the new one.
- Cmd+S: lost while settings are held -> saves.
- Merge Result: no tint -> tints open conflicts.
- Tab order: a press on a tab no longer brings the shown tab forward.
- Clone question: some steps dimmed the page -> no step dims it.
- Save to Literature:
  - its answer moves from the notice line into the card;
  - it is refused on the primary when the file is at the engine's path -> it saves there.
- PDF Page Width: the place is lost part way into a page -> the place is kept.
- LaTeX picture preview: 0x0 -> sized.
- Search: a scope change keeps the old hits -> it runs the search again.
- Entry page: the old "saved" line stays after an undo -> it goes.
- History: pills only on hover -> pills always drawn.
- Settings: the dot lingers about 2 s -> it goes on the write's answer.
- Undo of an add or a delete, feeds included: re-rendered at the end of the file -> byte for byte.
- Missing settings file: 404s on a workspace switch -> no request.
- Plain file: blame and LaTeX 404s -> none.
- Popped-out window: palette opens in the main window -> opens in that window.
- Two tabs splitting: one split lost -> both kept.
- Palette list: selection lost on a new answer or ArrowDown -> kept in view.
- Schedules: Node's command line -> "tmux did not answer within 5 s" or tmux's own sentence.
- Undo row of an add: "entry removed" -> "add undone".
- Close question over unsaved text: Cancel/Confirm -> Don't Save / Cancel / Save, with the keyboard on Save. The several-tab form reads "Do you want to save the changes to 2 tabs before they close?".
- Status bar: editor items go when Files is active -> they stay.
- Desktop: first press on an inactive window was swallowed -> it reaches the page.
- Map: a new project on the rim -> at its links' rest length.
- New File: the keyboard on BODY -> in the editor.
- Paste into a closed folder: nothing selected -> the item selected.
- Terminal: reload or redraw off by lines -> same top line; a resize redraws from tmux.
- F8: the line under the sticky line -> in view below it.
- A root that left: repeated failed requests -> none.
- Armed Kill: moves away and its words are cut -> stays put, words whole or on the bar.
- Open Folder / Add Folder to Workspace: palette stays and "already open" appears -> palette closes, no such note.
- Refactor Preview after a drag, warm: 5.8 to 6.1 s -> 0.35 to 0.42 s.
- Submit Job: keyboard in the editor after a refused plan -> on Submit Job.

## Wrong or impossible in the brief
- Item 27's premise: the defect is the harness's CDP keys, which reach no menu role.
- Item 34's premise: no command opens an index tab (open item B).
- Item 35's premise: the look hub's settings are stale (open item C).
- Item 40: the 1 s bound clashes with G36 when the server is cold (open item A).
- Item 43: the requested path is not in the built app (open item D).
- Item 38's 50 ms bound cannot be measured without a page.
- The brief's G list leaves out G8, whose tests items 15 and 16 change.
- The brief's `app.dont_save` key names the clone question's key.
