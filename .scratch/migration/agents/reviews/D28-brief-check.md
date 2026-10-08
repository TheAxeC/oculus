# Step D28 brief check (on main at 1ae5e7c8d)

`git rev-parse HEAD` printed `1ae5e7c8d94cbe03a0b87e48850648c54ba23a8c`. The brief read is the working-tree copy (`git status --short` lists `M tools/oculus/.scratch/migration/agents/briefs/D28.md`). plan.md has no "Goal" heading (`grep -n '^#' plan.md`: Packages, Could run in parallel, Rulings, Agents, Blocked), so the goal used is its opening paragraph and D28's step line with its bullets (plan.md:592-594). Every grep over `config/` carried `--exclude=local.yml` or named single files other than local.yml.

## 1. Names

- `editor.format_on_save` (brief :54, 2.2 "the format", case 20, 22, 36): `grep -n 'format_on_save' config/behavior.yml config/catalogs/options.yml` printed only `options.yml:524: format_on_save:` (a field of `editor.languages`); `editor.ts:117` is `formatOnSave: layered(ask, 'formatOnSave', false)`. No global key `editor.format_on_save` exists, so the name in the brief is false and invites a new global key.
- `saveText` vs `trimText`/`endText`: `grep -n 'G59' guarded.md` gives the Test line "one table over `saveText`"; brief 3.2 and Tests name `trimText` and `endText`. The two disagree.
- The whole-file rule's home: G58's Code line (guarded.md:116-117) puts it "in `src/lib/data/helpers/files/text-kind.ts`"; brief Part 4 has the page use it (so Layer 1); brief 1.3 says "The hash, the BOM rule and the whole-file UTF-8 rule ... taken out into one server module". The brief contradicts itself and G58 on where the rule lives.
- The `gone` fact: `sed -n '22,30p;41p' strip-tab.ts` shows `gone: (file: { root: string; path: string }) => boolean;` and `facts.gone(shown)`; `ui.svelte.ts:166` shows `registerUnsaved: (reports: (id: string) => boolean)`. Brief 1.4 asks for a registration "beside `registerUnsaved`" ORed into the fact at `PaneView.svelte:193` while "`strip-tab.ts`'s drawing ... do not change". The fact receives a file, never an instance id, so the registration must be keyed by `{root, path}` or `strip-tab.ts` (not in the paths) changes.
- `registerUnsaved` / the close question: `grep -n "askAndClose\|registerUnsaved" DESIGN.md` hits `:549` "every store that can hold unsaved text registers with `registerUnsaved` ..., so a tab holding any of them asks before it closes" and `:563` "every close goes through `askAndClose`". The autosave close makes :549 false; :549 is outside the brief's DESIGN.md ranges (121-125, 455, 509-515).
- `askAndClose` is not the only close: `grep -rn "closeAsk\|closingEditors" src` hits `views/sources/files/sections/OpenEditors.svelte:94-101` (`closingEditors`) and `views/system/workbench/Pages.svelte:129-150` (`closeAsk`). Both close file tabs with the question and are outside the paths; G28 as widened ("closing a file editor tab saves it in place of the question") stays false for them.
- `keepCopy`: `grep -rln keepCopy src` hits `edit/writes/file-undo.ts`, `fs/replace.ts`, `fs/file-changes.ts`, outside the paths. Brief 1.3 says keepCopy "takes the bytes, or a `keepBytes` beside it"; the first option changes three files outside the paths.
- `DiffSubject` / `sideOf` / the compare pane: `sideOf` is local to repositories.ts (other hits are unrelated `sideOf`s in `ui/menu` and `ui/frame`). But `diffUrl` (repositories.ts:259), `diffActs` (repositories.ts:278-291), `diffRequest` (`state/sources/repositories/answers.ts:244`) and the caller `views/sources/repositories/diff/Diff.svelte:174` (`readPaneDiff(state, repo, writes.writeToken())`, with no access to the source store) all have to handle `unsaved`. The brief does not name them, and answers.ts and Diff.svelte are not in the paths. Left as is, `diffActs` returns true for an `unsaved` subject and the conflict pane offers Stage, Unstage and Revert Block.
- `isBinaryFile`, `TEXT_SNIFF_READ`, `isTextBytes`: `grep -rn "isBinaryFile\|TEXT_SNIFF_READ" src` gives callers source.ts:165, replace.ts:156, ops.ts:754, lsp/library/read.ts:53, and `state/sources/fs.svelte.ts:613` for `TEXT_SNIFF_READ`, matching the brief. `isTextBytes` is also used at `state/sources/explorer/file-type.ts`, which stays. None is made false.
- `readHash`: hits fs-transport.ts and context.ts:105, :544 (the lsp edits' `hashOf: readHash`). Taking the digest out keeps `readHash`'s behaviour, so nothing is made false.
- `hashOf`: a second server `hashOf` exists in `edit/writes/config/deck/deck-files.ts:437`, with a `sha256:` prefix. It is not made false, but there are two server hashes after the move.
- `revertSourceDraft`, `saveSourceDraft`: hits are only in paths (source.svelte.ts, Source.svelte, BarActions.svelte, context.ts) plus `OpenEditors.svelte:110`, which calls `saveSourceDraft` with the same signature. Not false as long as the signature holds.
- `app.waiting`: hits Inbox, Leads, Radar, Linkedin, Status and Source (`grep -rln "app.waiting" src`). Only Source changes, so nothing is made false.
- `source.binary`: only `state/sessions/source.svelte.ts`. No test asserts its text (`grep -rn "not text on disk" src tests` printed nothing).
- `sessions/source.svelte` (the move): `grep -rln "sessions/source.svelte" src tests | wc -l` printed 23, all in src, and `tests/checks/tree/boundaries.test.ts:157`, `:194` hold `state/sessions/source`. These are covered by "every importer".
- `source:` channel name: `grep -rn "'source:\|\"source:\|\`source:" src` printed nothing; the prefixes in use are `pty:` (pty/channel.ts:80) and `lsp:` (lsp/wire.ts:17). No collision.

Findings:
- F1: `editor.format_on_save` is not a key; the brief should say `editor.languages.<lang>.format_on_save` (resolved `formatOnSave`).
- F2: G59's Test line says `saveText`, the brief says `trimText` and `endText`; one wording is chosen and the report's Doc text carries it.
- F3: 1.3 puts the whole-file UTF-8 rule in a new server module, while Part 4 and G58 put it in `text-kind.ts` for both layers. The brief should say the server module holds the hash and the BOM write, and `text-kind.ts` holds the whole-file rule.
- F4: the gone registration must be keyed by file to fit `StripTabFacts.gone`, or `shell/panes/strip/strip-tab.ts` joins the paths.
- F5: `DESIGN.md:549` is made false and is not in the write ranges.
- F6: the Open Editors close (`OpenEditors.svelte`, `closingEditors`) and the Pages view's close (`Pages.svelte`, `closeAsk`) bypass `askAndClose`, so the autosave close covers only the strip. Either the rule moves to where all three reach it (`state/workbench/navigation/pages.ts` `closeAsk`, or a ui-store call all three make), or the two views join the paths.
- F7: `diffUrl`, `diffActs` and `diffRequest` are not named, and `answers.ts` and `Diff.svelte` are missing from the paths. `diffActs` must return false for `unsaved`, or the conflict pane offers hunk actions that write the worktree file.
- F8: the brief leaves keepCopy's shape open, and one of the two shapes writes three files outside the paths. The brief should fix `keepBytes` beside `keepCopy` or list those files.

## 2. The step line

- "a source tab with no edits takes the file's new text when it changes on disk": served by 1.2 (the fifth bullet, a clean tab read again) and 3.4 (the edits, caret and scroll kept).
- "a tab with edits keeps them and says the file changed": served by 1.2 (`disk: 'changed'`) and 1.4 (`source.disk_changed`).
- "its save is refused with Compare, Overwrite and Revert": served by 1.3 (409 `changed`), 1.4 (the three ToolButtons) and 1.5 (Revert File).
- "the server comparing a hash of the text the tab last read": served by 1.1 (`base`) and 1.3. The brief hashes the bytes, an equivalent stronger form.
- "(2) `editor.autosave` (`off`, `after_delay`, `on_focus_change`) with a delay, `off` by default, with its control in the Settings view": served by 2.1 (both keys and their catalog entries) and 2.2 (the behaviour). The Settings control comes from the catalog entry; brief :62 leaves whether the view draws it to the builder. I read `views/system/workbench/settings/Item.svelte:93-95`, `:197-198` (generic `Control` by `control`, fields listed from `row.fields`), which supports it but does not prove it on screen.
- "(3) two keys per language in D25's per-language area ... both off by default": served by 3.1 to 3.4. The added global keys are C2 (a) of Z528.
- "(4) the whole file is tested as UTF-8 before a save": served by Part 4.
- "after D25": D25 is booked (plan.md:588, "Booked 2026-10-03").
- D13a-3 (Z289; plan.md:594 "a small file draws within VS Code's time, with no multi-second wait for the first snapshot"): Part 5 removes the words and diagnoses the wait only when the builder's run reproduces it. No requirement gives a time the draw must meet.
- plan.md:593 (the Settings ruling widening: "UTF-8 only ... said in DESIGN.md and HELP.md"): Part 4 and 6.4 write DESIGN.md:509-515 and `docs/files-and-search.md:59`. HELP.md is limited to "where what a user does changes" (6.4, spec.md:66), and no requirement says the UTF-8 rule in HELP.md.
- Z79 (1) "handled as VS Code does": VS Code's conflict compare, read from `workbench.desktop.main.js` (`static async open(e,t,i,n,r){await n.openEditor({original:{resource:FN.resourceToTextFile(t,e)},modified:{resource:e},label:i,...})}`, title `d(16202,null,t,t,this.productService.nameLong)`), puts the editor's own dirty model on the modified side: editable, live, titled `{0} (in file) <-> {0} (in Visual Studio Code)`. Brief 1.4 makes the right side a read-only snapshot titled `(unsaved)`, opened "beside the tab", and does not list this as a departure among its decisions.

Findings:
- F9: plan.md:593's "said in ... HELP.md" has no requirement. The brief should map that bullet and either write the rule in HELP.md or record why spec.md:66 overrides it.
- F10: D13a-3's "within VS Code's time" has no bound in Part 5 or case 43. If the builder's main run does not reproduce the wait, only the words are removed.
- F11: the conflict compare departs from VS Code (read-only snapshot, "(unsaved)", beside the tab) without being named under "Decisions taken in this brief". Either the editable live right side is built, or the departure is a stated decision.

## 3. Premises

- source route: `wc -l` 33; `sed -n '20,33p'` shows GET `handleSourceInfo` and POST `handleSource(request, locals.token, () => textCatalog(...), roots(locals), locals.server.local.history ?? defaultHistoryDir())`. Matches.
- source.ts: `wc -l` 181. `SourceBody` :29, `sourceBodyShape` :75-79, `handleSource` :144-181, 404 `the file is not there` :160-161, `readonly` :164, `binary` :165, local :166-167, `historyRefusal` :168 (fn :116-122, `keepCopy(history, path, 'save')` :120), `writeTextAtomic` :170, `isBinaryFile` :60-72 reading `TEXT_SNIFF_READ`. Matches.
- isBinaryFile callers: the grep printed exactly the four callers named. Matches.
- text-kind.ts: `wc -l` 41, `TEXT_SNIFF = 8192` :16, `TEXT_SNIFF_READ` :22, `isTextBytes` :31-41. Matches.
- decoder: `node -e` printed `"a", "a" followed by U+FFFD, v24.21.0`. `readCapped` :371-377, `readCappedBytes` :380. Matches.
- lsp-edit.ts: `BOM` :46, `hashOf` :62-64, `changed` :72, BOM :73-80, round trip `binary` :76, `writeBytesAtomic` :106, read-back :113-120. Matches. `readHash` fs-transport.ts:435-445 matches.
- files.ts `resolveRootFileResult` :82 (to :93), `resolveRootPath` :103; json.ts `writeTextAtomic` :72, `writeBytesAtomic` :81; package.json:108 `"write-file-atomic": "^8.0.0"`. Matches.
- source.svelte.ts: `wc -l` 636. Every cited line matches (`grep -n`: :60, :127, :222, :258, :269, :323, :343, :354, Promise.all :365, :472, :489, :508, :515, :520, :561, :610). `revertSourceDraft` takes `saved` with no read (:520-522). Matches.
- reloadSource callers: ops.svelte.ts:297-307, Present.svelte:175. Matches. tab-draft.svelte.ts :40-48 and :50-62 match. BarActions.svelte:109 and Source.svelte:319 match.
- `ls src/lib/state/sessions | wc -l` printed 10. Matches.
- client context.ts: :286 `createSocket`, :410-420 saveAll, :449-455 `createSource` and `registerUnsaved`, :594 `saveDraft`, :596-598 `saveText`. Matches. PaneView.svelte:192-193, strip-tab.ts :27, :41, :47, :64, tab-strip.ts:41-42, TabFace.svelte (383 lines) :29-30, :97, :107, :172-174, :373-377, pane-view.ts:485, ui.yml:100 all match.
- `fs.gone` :488-499, `readFileKind` :591-600, `readKind` :608-620. Matches.
- close-question.svelte.ts: 80 lines, `unsaved` and `busyTerminals` :24-27. `askAndClose` is :42-53 (doc comment from :37), brief says :41-50.
- socket.svelte.ts: `subscribe` :226, `unsubscribe` :238, `listen` :245, "no unsubscribe message on the wire" :234-237. Matches.
- channels.ts: `hasSubscriber` :75, `onFirstSubscriber` :88, `subscribe` :106 (doc :97). Matches. socket.ts: options `terminals` :75-76, drop :170-172, subscribe branch :177-188 with `options.terminals?.subscribed` at :187, brief says :178-186. serve.ts `attachAtWs` :21-27 and server-context.ts `terminals` :39 match.
- server context.ts: `const git = startGitWatcher()` :386, `close()` :496-521, `starters` :525. Matches.
- file-poll.ts: `POLL = 500` :19, `pollFile` :74-103, head :6-10. `reading()` is the poll's method (:94-96) that `changed` calls; brief says "`changed` calls `reading()` first, :60-73", the doc comment range. Matches in substance.
- `files` channel: git-start.ts:33 `repositoryRoots`, roots.ts:45-49 (all browser roots but `ENGINE_ROOT`), git.ts :44-51, `announceFiles` :342-347, the timer :436-456, `heard` :488-502. Matches.
- Source.svelte: `wc -l` 519, `repoSettings` :124, status :338-369, Empty `app.waiting` :437-438. size.test.ts holds `LINES = 900` and `COMPONENT = 540` at :29-30, brief and spec.md say :28-29.
- `ls src/lib/views/sources/source | wc -l` 9; `save/` 8 (the brief names five of them); `status/` 6; `actions/` holds 4 (`BarActions.svelte`, `ReadAgainButton.svelte`, `read-again.ts`, `submit-job.svelte.ts`), the brief names two and gives no count.
- `app.waiting`: app.yml:234 `waiting: Waiting for the first snapshot`, users as listed. Matches. locked-words.ts head :1-8 and :37 match.
- keys.ts :62 and :238, workbench-keys :226-229, Workbench.svelte:232, ask-perform.ts:57, OpenEditors.svelte:110, Timeline.svelte:229 (`views/sources/files/sections/`), debug-file.ts:59. Matches.
- ui Editor.svelte: 513 lines, effect :347-371; `ls ui/controls/editor | wc -l` 10, `kit` 10; commands.ts `reachedBy` :167; text-edits.ts `TextEdit` :23. Matches.
- editor-options.ts: 208 lines, `readRecord` :56-99, `format_on_save` :91-93, `readLanguages` :102-123, `readEditorOptions` :131-163, `parseRepoSettings` :187-208. Matches.
- editor.ts: 129 lines, `LanguageRecord` :21-27, `EditorResolved` :68-76, `layered` :82 match. `EditorOptions` is :33-45 (brief :33-49) and `resolveEditor` is :98-119 (brief :98-118).
- options.yml: `editor.paint_limit_kb` :448, `editor.sticky_scroll` :490, `editor.languages` :496, `format_on_save` :524-526, `latex.auto_build` :527. Matches. behavior.yml comment :111-113, block :114-125, `sticky_scroll` :121. Matches.
- `ls tests/data/sources/config`: `catalog languages.test.ts local.test.ts rail.test.ts settings.test.ts wrong-settings.ts`. Matches. config.test.ts:412 title matches.
- repositories.ts: `DiffSubject` :139-163, `sideOf` :170-182, `compare@` :173-174, `heldDiffShape` :208. Matches. ops.ts `handleCompare` :782, `previewed` :820 (brief :816; the doc comment starts earlier).
- docs lines: files-and-search.md :21, :59, :65; configuration.md:13; window.md :54, :59; DESIGN.md :121, :125, :455, :509, :510, :512, :515; HELP.md :33, :41, :63. Each printed the sentence the brief describes.
- `grep -rn spawnSync src/lib/server` gives registry.ts:66 and stores/codex.ts:387; hooks.server.ts:86-91 is `locals.config` with `loadConfig`. Matches.
- folder counts: `ls src/lib/server/files/fs | wc -l` 9, `ls src/lib/data/helpers/files | wc -l` 7, `ls src/lib/data/prose | wc -l` 9, `ls tests/server/files | wc -l` 9, `ls tests/data/helpers/files | wc -l` 1. Matches. `ls src/lib/server/files` prints 10 items (files-channel.ts, files.ts, fs, fs.ts, open.ts, project-files.ts, roots.ts, search-routes.ts, search.ts, source.ts) and `ls src/lib/server/core` 8. The paths line's "in `server/files/` or `server/core/`" has only `server/core/` open.
- Importers: `grep -rln "sessions/source.svelte" src tests | wc -l` printed 23. Matches.
- Brief line 5: `ls tools/oculus/docs` prints six guides plus `diagrams`. True that no `adr/` exists.
- Test titles: source.test.ts :44 'requires the current write token', :54 'refuses a path outside the named root', :72 '... atomic rename'; history.test.ts:63 matches. The close question's rows 'asks one question over a pane ...' and 'lists every instance of every pane ...' are in `tests/state/workbench/navigation/pages.test.ts:20`, `:35`, not in tab-menu.test.ts.
- `orchestrator-state.md:27` reads `dispatch: []`. Matches "Nothing is in flight".

Findings:
- F12: these line offsets are wrong in the brief: `EditorOptions` :33-45 (brief :33-49), `resolveEditor` :98-119 (:98-118), `askAndClose` :42-53 (:41-50), socket.ts terminals call :187 (brief's :178-186), size.test.ts :29-30 (brief and spec.md :28-29), ops.ts `previewed` :820 (:816).
- F13: `server/files/` holds 10 items, so the shared server module can only go under `server/core/`; the paths line should say so.

## 4. Cases and checks

- Cases 1 to 8, 10 to 13, 15 to 20, 22, 24 to 28, 31, 32, 35 to 42 and 44 (none) are consistent with spec.md ("What every package obeys": tests only under an entry, a fake clock for "did not happen", DOM behaviour at the look; the brief marks 1 to 6, 8, 10, 11, 18, 22, 23, 26, 33, 34, 37, 39 and 43 for the look).
- Case 9: "a test hook between the two" asks for code in `handleSource` that exists only for a test. spec.md "What every package obeys" says "code written only so a check passes is a finding". The other route it names ("a second stat that differs") fits if the stat is a dependency the route already takes; the brief should name that route alone.
- Case 9 also leaves out the history. With 1.3's order (the copy from the bytes read, then the second stat), a save refused at the second stat has already written a history copy. DESIGN.md:515 says "a refused save leaves no copy".
- Case 14: checks only the Save; see section 5.
- Case 21: checks the history's 50-copy pruning, which the step does not change, but autosave at delay 0 drives it, so it is in scope.
- Case 23: Tests puts its G28 row in `tests/shell/panes/strip/tab-menu.test.ts` "beside the close question's rows". Those rows are in `tests/state/workbench/navigation/pages.test.ts:20`, `:35` (`closeAsk`), so the place named is wrong.
- Case 30 against 3.1's dictated description and 3.2: 3.2 says "so the text ends with one line ending" and the description says "Ends the file with one line ending", yet case 30 keeps `""` and `"abc\n  "` without one. 3.2's rule "taking off every line after the last line that holds any character", read on lines, turns `"abc\n\n\n"` into `"abc"`; case 30 expects `"abc\n"` (VS Code's trimFinalNewlines keeps the line ending after the last line with content).
- Case 33 and 34: DOM behaviour at the look, as spec.md says.
- Case 42: "as today", but see F17 on NUL bytes.
- Case 43: measurement only, with no expected bound (see F10).

Findings:
- F14: case 9's "a test hook" breaks spec.md's rule on code written only for a check. The brief should name the injected-stat route.
- F15: case 9 does not say whether a save refused at the second stat leaves a history copy. 1.3's order leaves one, which contradicts DESIGN.md:515. The brief should order the copy after the second stat, or state the exception and rewrite :515.
- F16: case 23's test place names tab-menu.test.ts for rows that live in pages.test.ts.
- F17: 3.2's rule text and 3.1's description contradict case 30 (the empty text, the whitespace-only last line, `"abc\n\n\n"`). The rule should be worded on line endings, as case 30 gives it.

## 5. The question

- Case 1: no. A new line within a second with the caret kept is observed.
- Case 2: no.
- Case 3: no. `shasum` unchanged and the three actions are drawn.
- Case 4: yes. It passes with a read-only snapshot on the right, which is not VS Code's conflict compare (F11).
- Cases 5, 6, 7: no.
- Case 8: no, within one page; two pages are not covered (section 6).
- Case 9: no.
- Case 10 to 13: no.
- Case 14: yes. The poll "stays as it was resolved", so `pollFile`'s `statSync` and the read follow the link out of every root and publish the SHA-256 of a file outside the roots. G2's Code line (guarded.md:11) says a `source:` channel "is never polled for a path outside the roots", and case 14 checks only the Save.
- Case 15: no.
- Case 16: yes, for the goal of polls ending. The page's `unsubscribe` sends nothing on the wire (socket.svelte.ts:234-240), so `hub.hasSubscriber(channel)` stays true after a tab closes and its poll (a stat every 500 ms, a full read and hash on each change) lasts until the page closes. The hub also keeps `#latest` per channel for ever (channels.ts:43), so a later subscriber is first handed a stale hash. The case checks only the whole page closing.
- Cases 17 to 22, 24 to 28: no.
- Case 23: yes. It passes on the strip's close while Open Editors' close and the Pages view's close still ask (F6).
- Cases 29 to 42: no, given F17's wording fix.
- Case 43: yes. It states measurements with no bound, so a 4 to 6 s wait on TEST passes it.
- 1.1: yes, see F19. A draft restored from storage takes its base from the read after the reload, so its edits overwrite an outside change with no conflict.
- 1.2: yes, by case 16's reasoning (polls of closed tabs never end) and case 14's (outside reads).
- 1.3: no.
- 1.4: yes, via F11 and F7 (the pane's hunk actions).
- 1.5: no.
- 2.2: yes, through F6 (two close paths) and F20 (self-conflict).
- 3.x: no.
- Part 4: no.
- Part 5: yes, the D13a-3 fix list. It allows a fix in `server/sessions/registry.ts` but not in `server/sessions/stores/codex.ts`, whose `spawnSync('ps')` at :387 the brief names as an H5 cause. A cause proved there would be handed back.
- 6.x: no.

Findings:
- F18: case 14 and 1.2 let a poll read and publish the hash of a file outside every root. Each read should resolve the path again, and a path now out of the roots publishes null and is not read.
- F19: case 16 and 1.2 leave a closed tab's poll running for the page's lifetime, and the hub keeps a stale latest message per channel. This needs a stated decision (an unsubscribe message is a wire-format change, a Stop) or a case with its expected result.
- F20: case 43 needs a bound, from plan.md:594 "within VS Code's time", and a rule for when the look on TEST reproduces the wait that the builder's run did not.
- F21: Part 5's fix list omits `server/sessions/stores/codex.ts`, which holds the second `spawnSync('ps')` the brief itself names.

## 6. Implied inputs

- A dirty draft restored from storage after a reload, whose file changed while the page was closed: `loadSourceDraft` keeps the edited text and takes `saved` from the new read (source.svelte.ts:367-376). By 1.1 the base comes from that read, so Save writes over the outside change with no conflict, against G28 ("survives ... a change of its file on disk") and G60. A draft stored before this step has no `base`, so `''` is sent and refused 400 by 1.3's "any other value". Missing. Expected: an edited draft keeps its stored base, an empty stored base counts as unknown (the tab is marked changed and Save shows the conflict), and a clean draft takes the new read's base.
- A save started while the same tab's previous save is in flight (case 21 at delay 0, or Cmd+S twice): both send the old base, and the first save's write makes the second refused `changed`. Missing. Expected: a tab's saves run one at a time, each sending the hash the previous one answered, and no conflict arises from the tab's own write.
- A channel message arriving while a save is in flight (the hash of the tab's own write before its answer): the tab is dirty with a different base, so it is marked changed until the answer lands. Missing. Expected: no `source.disk_changed` drawn for the tab's own write.
- A file over `TEXT_LIMIT` (2 MB, `data/file-ops.ts:32`), a truncated tab: its base (first 2 MB) never equals the server's whole-file hash. A clean truncated tab reads 2 MB again on every message, and for a growing log the server reads the whole file every 500 ms. Missing. Expected: a truncated tab subscribes no channel, or the server's hash covers the same bytes; and a cap on the server's read.
- A root key renamed or dropped from `sources.yml` while a tab is open: the poll stops by 1.2 and the tab hears nothing. Missing. Expected result to state, for instance null published and the tab marked gone, or a line saying the folder is no longer served, with Save answering 403.
- Two pages over one file (two sockets): a save in page B makes page A's clean tab take the text and its dirty tab marked changed. Missing; case 8 is one page.
- A save or an outside write while the socket is disconnected, then reconnect: on reconnect the hub replays its retained (possibly stale) latest message and the new poll publishes at its first tick. Missing. Expected: a clean tab takes the disk text within a second of reconnect, and a dirty tab is marked changed only when the disk differs from its base.
- Autosave over a config file the server reads: under `after_delay` a half-typed `config/*.yml` is written every second and pushed to the running server. Over `config/local.yml` the save is refused 400 with `checkLocal`'s sentence. Missing. Expected: stated, for instance whether `after_delay` writes config files, and that a refused automatic save is not retried until the next edit, drawn with its sentence.
- The conflict pane after a reload (its subject holds `unsaved@<id>`), typing in the tab while the pane is open, and the file changing on disk while it is open: missing. Expected: the pane draws the disk text and the tab's current text, follows both, and offers no hunk action (F7).
- A rename or move of the open file through oculus (`ops.svelte.ts:422-428` re-points tabs): the old path's poll may publish null before the re-point, which marks the tab Deleted. Missing. Expected: no Deleted mark, the edits kept, `disk: 'same'`.
- A path replaced by a folder: null marks the tab gone, then Save with `create: true` finds the parent present and the path a directory, and the write fails 500. Missing. Expected result to state.
- A preview tab re-pointed to another file, and HEAD, index, library and untitled tabs: whether they subscribe (1.1's `base: ''` implies not), and that the old file's listener is dropped. Missing.
- A socket that carries no token subscribing many `source:` channels: each starts a poll, and nothing bounds the count. Missing. Expected: stated (read channels are open to every socket, socket.ts:191-193), with a bound or the decision not to bound.

Findings:
- F22: the restored dirty draft (base from storage, or none) is missing.
- F23: overlapping saves of one tab are missing.
- F24: a channel message during the tab's own save is missing.
- F25: a truncated tab over a large or growing file is missing.
- F26: a root key renamed or dropped while the tab is open is missing.
- F27: two pages over one file are missing.
- F28: a disconnect and reconnect is missing.
- F29: autosave over a config file and over `local.yml` is missing.
- F30: the conflict pane after a reload, with typing and with a disk change, is missing.
- F31: a rename or move of the open file is missing.
- F32: a path replaced by a folder is missing.
- F33: preview re-point and HEAD, index, library and untitled subscriptions are missing.
- F34: tokenless or unbounded subscriptions are missing.
- F35 (related, from 1.3 against Part 4): 1.3 says "`lsp-edit.ts`'s behaviour does not change", but Part 4 replaces its round trip with "no NUL byte and a fatal UTF-8 decode" over the whole file. Today `readChecked` checks NUL only in the first 8 KB (`replace.ts:156` through `isBinaryFile`), and the round trip at `lsp-edit.ts:76` passes NUL bytes, so a file with a NUL after 8 KB is edited today and refused after the step. Case 42 says "as today". The brief should say which.

## 7. ADRs

- `ls docs/adr` and `ls tools/oculus/docs/adr` printed "No such file or directory". `.agents/plan.yaml`'s `oculus` block has no `adr:` key, and `standards: []`. No record.

Findings: none.

## 8. Dictated text

- `compare: Compare`, `overwrite: Overwrite`, `revert: Revert` (`grep -n "compare: Compare" D28.md` gives :155): VS Code's 16187, 16192, 16201 (read from `nls.messages.json`). They hold. `source.bar_revert: Revert File` already exists (source.yml:6) for the bar; the conflict's `Revert` is VS Code's own word there.
- `save_conflict: "Failed to save '{0}': The content of the file is newer. Please compare your version with the file contents or overwrite the content of the file with your changes."` (:155): VS Code's 16205, byte for byte, ASCII. Holds.
- `conflict_title` `'{0} (in file) <-> {0} (unsaved) - Resolve save conflict'` (`grep -n "conflict_title" D28.md` gives :102, :155): `<->` is ASCII, so the arrow rule holds. The spaced hyphen ` - ` is banned by the hub CLAUDE.md "Writing docs" (no AI-tell unicode: "A spaced hyphen ` - ` ... standing in for a dash is the same tell and is banned"), whose exceptions are "a compound word, a number range, and a quoted title". The catalog already holds a VS Code label in this form (`statusbar.yml:178` `'({0}) - Configured Language'`). The brief does not invoke the quoted-title exception, and `(unsaved)` is not VS Code's `(in {2})`, so the string is no longer a verbatim quotation.
- `conflict_gone: The tab this comparison was opened from is closed.` (:155): holds.
- `disk_changed: The file changed on disk after this tab read it; your changes are kept, and Save asks before replacing it.` (:155): "Save asks" names the wrong behaviour. By 1.4 the save is refused and the line offers Compare, Overwrite and Revert, and under autosave nothing asks (case 24). spec.md "The working rules": "name the actual function, file and line".
- `disk_gone: The file was deleted on disk; Save writes it again.` (:155): holds.
- `not_text: This file is not UTF-8 text throughout; the editor shows it and saves nothing.` (:155): Part 4 draws such a file in the code window, not the editor (`locked-words.ts` `window: true`, DESIGN.md:510 keeps the two apart), so "the editor shows it" is inaccurate.
- `binary` reworded to `This file is not UTF-8 text throughout on disk; the editor saves nothing over it.` (:155): holds, in the form of `readonly` and `truncated`.
- 2.1, `editor.autosave` "its description VS Code's three sentences (16454, 16453, 16455)", and `editor.autosave_delay_ms` "described as 16406 says" (`grep -n "VS Code's three sentences\|described as 16406" D28.md` gives :110, :111): 16453 and 16406 carry VS Code's setting links `` `#files.autoSaveDelay#` `` and `` `#files.autoSave#` `` and a `{0}` (`afterDelay`). The catalog's descriptions name oculus keys in plain words (options.yml:458, :473). The brief does not say the copies name `editor.autosave_delay_ms`, `editor.autosave` and `after_delay`.
- 3.1, `final_newline`: "Ends the file with one line ending when saving it: a last line with text gets one, and the empty lines after the last line with text are taken off." (`grep -n "Ends the file with one line ending" D28.md` gives :125): the first clause is false for `""` and `"abc\n  "` (case 30), and "text" means "a character other than a space or a tab" in its second clause but "any character" in its third (3.2).
- No guarded-entry wording is dictated; guarded.md is the orchestrator's (brief :303).
- `LC_ALL=C grep -n '[^ -~]' D28.md` printed nothing: the brief is ASCII.

Findings:
- F36: `conflict_title`'s ` - ` breaks the Writing docs spaced-hyphen rule unless the brief names it as VS Code's quoted title; with `(unsaved)` in place of VS Code's `(in {2})` it is not a quotation (see F11).
- F37: `disk_changed`'s "Save asks before replacing it" misstates 1.4.
- F38: `not_text`'s "the editor shows it" misstates Part 4's code window.
- F39: 2.1's VS Code sentences need their `#files.*#` links and `{0}` rewritten to the oculus keys and words, and the brief does not say so.
- F40: 3.1's `final_newline` description contradicts case 30 (with F17).

## Declined to judge

- Whether the Settings view draws `editor.autosave`, `editor.autosave_delay_ms` and the two new record fields with no view change. `Item.svelte:93-95`, `:197-198` draw any catalog entry through `Control` by its `control`, which suggests yes. Only a render or the look settles it, and I started no server.
- Whether the ui `Editor.svelte` (513 lines, in a folder of 10 items, as is `kit/`) stays under 520 after `onblur`. That is the builder's to measure after the change, and spec.md's size and folder rules already bind it.
- Which side wins F15, F19 and F35. Each is the orchestrator's ruling, and F19 may be a Stop if an unsubscribe message on the wire is chosen, since that changes the wire format.
- Whether D13a-3 reproduces on main today. Measuring it needs a running server, which this check may not start.

Agent usage: a148f9947c88c06e2, claude-opus-5-5, 262,283 tokens, 78 tool uses, 12.7 min.

## Closed (the session's change to the brief for every finding above, and each dictated line added after the check, made before the preparation commit)

- F1: "What is on the tree" (the Cmd+S bullet), 2.2 and cases 20, 22, 36 name the language record's `format_on_save` (`editor.languages.<lang>.format_on_save`, resolved `formatOnSave`); no global key.
- F2: 3.2 keeps `trimText` and `endText`; G59's Code and Test lines in `agents/guarded.md` now name them.
- F3: 1.3 puts the hash and the BOM's keeping in a new server module under `server/core/`, the whole-file rule in `text-kind.ts`; G58's Code line says the same.
- F4: 1.4 keys the gone registration by file, `(root, path) => boolean`, to fit the fact at `PaneView.svelte:193`.
- F5: 2.2 rewrites `DESIGN.md:549` and `:563`; "Paths" gains `DESIGN.md` lines 549-563.
- F6: 2.2 adds the ui store's `saveBeforeClose(ids)`, awaited by the strip's `askAndClose`, Open Editors' `closingEditors` and the Pages view's close before `closeAsk`; "What is on the tree" names the three; "Paths" gains `editor-closing.ts` and `Pages.svelte`; case 58.
- F7: 1.4 names `diffUrl`, `diffActs` (false for `unsaved`) and `diffRequest`; "Paths" gains `answers.ts` and `Diff.svelte`; case 4 checks no hunk action.
- F8: 1.3 fixes a new `keepBytes` beside `keepCopy`; `keepCopy`'s three callers keep it.
- F9: 6.4 has HELP.md say the UTF-8 rule in one sentence; "Paths" says so.
- F10: Part 5 and case 43 give the bound, 300 ms (Z714 (8)).
- F11: 1.4 builds VS Code's conflict compare, the right side the source tab's own text, editable and live, in the tab's pane (Z714 (1)); Decision 11.
- F12: the six offsets corrected (`EditorOptions` :33-45, `resolveEditor` :98-119, `askAndClose` :42-53, socket.ts :177-188 and :187, size.test.ts :29-30, `previewed` :820).
- F13: the server module goes under `server/core/` (8 items); "Paths" says so.
- F14: case 9 uses the route's `stat` dependency, no test hook.
- F15: 1.3 runs the second stat before the history copy, so a refused save keeps none; case 9 checks no copy.
- F16: the G28 row's place is `tests/state/workbench/navigation/pages.test.ts`; "Paths" follows.
- F17: 3.2's `endText` is worded on line endings with case 30's results.
- F18: 1.2 resolves the name again at each tick before any read (Z714 (2)); case 48.
- F19: 1.2 adds the `unsubscribe` message for `source:` channels and the hub's `forget` (Z714 (3)); "Paths" gains `socket.svelte.ts` and `channels.ts`; case 57.
- F20: Part 5 sends a wait only the look reproduces back to the builder (Z714 (8)).
- F21: Part 5's fix list and the "Paths" note add `server/sessions/stores/codex.ts`.
- F22 to F24, F28: 1.3 adds the restored base, one save at a time, the held message and the reconnect (Z714 (5)); cases 44, 45, 46, 50.
- F25: 1.2 signals a file over 2 MB by its stat signature (Z714 (4)); case 47.
- F26: 1.2 publishes null for a root key renamed or dropped; case 48.
- F27: case 49.
- F29: 2.2 covers every writable file and a refused automatic save (Z714 (7)); case 51.
- F30: 1.4 states the restored conflict tab; case 52.
- F31: case 53.
- F32: case 54.
- F33: case 55.
- F34: 1.2 bounds the channels at 200 per socket and 1,000 per server (Z714 (4)); case 56.
- F35: 1.3 has `lsp-edit.ts` refuse a NUL anywhere (Z714 (6)); case 42 rewritten.
- F36: `conflict_title` is `'{0} (in file) <-> {0} (in oculus): Resolve save conflict'`, a colon in place of the spaced hyphen.
- F37: `disk_changed` says Save is refused until you compare, overwrite or revert.
- F38: `not_text` says the file is shown read-only and nothing is saved over it.
- F39: 2.1 writes VS Code's setting links and `{0}` as the oculus keys and words.
- F40: 3.1's `final_newline` description rewritten to fit case 30.
- Dictated lines added after the check, held line by line: `conflict_title: '{0} (in file) <-> {0} (in oculus): Resolve save conflict'` holds (ASCII, `<->` allowed, no spaced hyphen); `disk_changed: The file changed on disk after this tab read it; your changes are kept, and Save is refused until you compare, overwrite or revert.` holds (1.4: an explicit Save is refused 409 and the line offers the three actions); `not_text: This file is not UTF-8 text throughout; it is shown read-only and nothing is saved over it.` holds (Part 4: the code window, no save); the `final_newline` description "When enabled, a save ends a last line of text with one line ending and takes off the empty lines after the last line that holds any character." holds against case 30 (a last line of only spaces is no line of text and keeps as it is).
