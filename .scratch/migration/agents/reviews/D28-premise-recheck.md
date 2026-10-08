# D28 premise recheck on main at 1ae5e7c8d

Main's head: `git rev-parse HEAD` prints 1ae5e7c8d94cbe03a0b87e48850648c54ba23a8c.

The brief's base commit b3015df79 does not exist in the repository (`git cat-file -t b3015df79`: "fatal: Not a valid object name"). The history rewrite in ef4fb22b3 left it out of the hash map. The brief was saved in e91ac317a, so main at that time was its parent, 2984b0099. Every step the brief was waiting on is now on main. `git merge-base --is-ancestor <c> HEAD` holds for each landing commit: X3f e6d00fb0f, S5 30b4ddced, D20 722a287a7, O30 3cb170eae with O30b 4ce24363b, A3 09509b5b6, E4 10ac00c69 with E4g c86f10f2f, Q125 e7952e163, Q126 6561f82ae, D45 0753a5e76, and X3e 1ae5e7c8d. D11 landed as c88b76443; that one was read from `git log --oneline -15`, not checked with the ancestor command. `git diff --stat 2984b0099 HEAD` over the brief's files lists 113 changed files.

Four findings matter most:
- Breakage testing: the brief's Cases section (lines 222-223) asks for "one small change to the code under test that the case must catch". spec.md:62 and the global rule ban this.
- Tests: the G13 test file the brief names does not exist, and the N1 to N6 entries are not written in `agents/guarded.md`.
- Work already on main: X3e drew the struck-through "Deleted" tab, and `lsp-edit.ts` already holds the SHA-256 base, BOM and UTF-8 rules.
- C1's comparison: X3e made the `files` channel cover every served root, so Z528's stated reason for rejecting option (b) no longer holds.

## 1. Premises

What is on the tree, the save path:
- `src/routes/api/(files)/source/+server.ts`: moved. The file is 33 lines, not 31. POST now passes `() => textCatalog(locals.config().config)` as a new third argument (:26-33). Command: `cat -n`.
- `src/lib/server/files/source.ts`: moved, and its claim holds. The file is 181 lines, not 180.
  - `SourceBody` :29 and `sourceBodyShape` :75-79: hold.
  - `handleSource` is at :144-181 and takes `(request, token, text, rootList, history)`.
  - The 404 is at :159-162, `readonly` :164, `binary` :165, `local.yml` :166-167, the history copy :168 (`historyRefusal` :116-122), `writeTextAtomic` :170.
  - Reading the whole file with `cat -n` shows no base, no hash and no compare.
- `isBinaryFile` :60-72, and `text-kind.ts` (41 lines: `TEXT_SNIFF` :16, `TEXT_SNIFF_READ` :22, `isTextBytes` :31-41): hold. Command: `cat -n`.
- "isBinaryFile goes (its only callers are handleSource)" in part 4: false. `grep -rn "isBinaryFile\|TEXT_SNIFF_READ" src tests` also lists `fs/replace.ts:52,:156` (`readChecked`, used by lsp-edit and replace), `fs/ops.ts:68,:754` (`side` of the compare) and `machine/lsp/library/read.ts:17,:53`.
- Page decode: moved from `fs-transport.ts:309` to :376 (`readCapped` :371-377), and `readCappedBytes` from :313 to :380. The decoder facts hold: `node -e` (Node v24.21.0) prints `"a"` and `"a"` followed by U+FFFD, and `buffer.isUtf8` gives false then true.
- `files.ts`: `resolveRootFileResult` moved from :81-93 to :82-93, and `resolveRootPath` from :102 to :103. `json.ts` `writeTextAtomic` :72 holds; `writeBytesAtomic` :81 is beside it. `package.json:108` `write-file-atomic` ^8.0.0 holds. Command: `grep -n`.
- New, and not in the brief: the server already has the base rule for edits it makes to files no tab holds. In `src/lib/server/files/fs/lsp-edit.ts`:
  - `hashOf` SHA-256 at :62-64, compared at :72
  - the BOM constant :46, kept at :73-80
  - a UTF-8 round-trip refusal as `binary` at :76
  - `writeBytesAtomic` and a read-back compare at :105-122.
  The page has `readHash` (`fs-transport.ts:435-445`, `crypto.subtle.digest`). Command: `sed -n`.

What is on the tree, the tab's state:
- `state/sessions/source.svelte.ts`: moved. 636 lines, not 490. New line numbers (old in brackets):
  - `SourceDraft` :60 [:45], with no base and no disk field (holds); `draftShape` :127 [:107]
  - `loadSource` :222 [:178]; `loadSourceReadonly` :258 [:214]
  - `SourceStore` :269 [:225]; `createSource(writes, ui, saved)` :323 [:252]
  - `sourceDirty` :343 [:270]; `loadSourceDraft` :354 [:292]
  - `reloadSource` :472 [:360]; `saveSourceDraft` :561 [:419]; `saveSource` :610 [:468]
  - New since the brief: `reloadHead` :489 (X3e); `editSourceDraft(id, text, edits?)` :508 and `sourceReach` :515, from D23b; `revertSourceDraft` :520, which takes `saved`.
- "reloadSource is called only by reloadClean": false. It is called by `reloadClean` at `ops.svelte.ts:297-307` (was :284-290) and also by `views/academic/present/Present.svelte:175`. Command: `grep -rn "reloadSource\|reloadClean" src`.
- "a source tab never hears of a change on disk": partly false. A HEAD or index tab is read again when git's signature moves (`save/tab-draft.svelte.ts:50-62`). A tab over the working file still hears nothing.
- `state/sessions/` holds 10 items: holds (`ls | wc -l` prints 10).
- Client `context.ts:329-335`: moved to :449-455.
- The unsaved dot: `PaneView.svelte:192` passes `dirty: unsaved` into the strip facts (`strip/strip-tab.ts:27,:64`). `TabFace.svelte` is 383 lines, not 362; the dot is at :97 and :172-174.
- New: the deleted-file tab mark is already built by X3e (`git log -S tab_deleted` names only 1ae5e7c8d).
  - `Tab.gone`: `ui/tabs/tab-strip.ts:41-42`.
  - Set in `strip-tab.ts:41,:47` from `fs.gone` (`fs.svelte.ts:488-499`, which reads the folder's listing).
  - Drawn struck through in the error colour at `TabFace.svelte:29-30,:107,:373-377`.
  - The tooltip gets `ui.tab_deleted` through `pane-view.ts:484-485`, and `config/text/ui.yml:100` already holds `tab_deleted: Deleted`.
- The page socket: moved. `subscribe` is at :226 and `unsubscribe` at :238 (was :173-187); `listen` is at :245. The "no unsubscribe on the wire" comment holds at :234-240.
- The server hub: moved. `subscribe` :97-120, `onFirstSubscriber` :88 (was :84), `hasSubscriber` :75 (was :71).
- New: the hub has no listener for a family of channels. `onFirstSubscriber` takes one exact channel name. `server/root/socket.ts:178-186` sends `pty:` and `lsp:` channels to their own consumers and every other channel to the hub. Command: `sed -n`.
- `file-poll.ts`: holds (`POLL` :19, `pollFile` :74-103, head comment :6-10). One detail: `changed` must call `reading()` first (:60-73).
- The `files` channel premise (brief line 42): false since X3e.
  - It is now published for every browser root except `engine`, repository or not (`watch/git-start.ts:33`, `repositoryRoots` in `roots.ts:45-49`).
  - Folders under `node_modules`, `build` and the like are named too. `heard` (:488-501) adds every folder; `relevant` (:158) only decides whether git re-reads.
  - The window is still 2 s per root, it names folders and never files, and a window of more than 64 folders names the whole root (`git.ts:44-51`, `announceFiles` :342-352, the timer :439-456).

What is on the tree, the tab's view:
- `Source.svelte`: moved. 519 lines against the 520 limit (`wc -l`). `repoSettings` is at :124 and the status effect at :338-369.
- `views/sources/source/`: holds 9 items, not 10: `actions/`, `Editor.svelte`, `Gutter.svelte`, `language/`, `latex/`, `save/`, `source-gutter.svelte.ts`, `Source.svelte`, `status/`. Inside:
  - `save/` holds 8, with `SourceNote.svelte` at 69 lines.
  - `status/` holds 6.
  - `read-again.ts` is now under `actions/`.
- The waiting sentence: moved. `<Empty message={t('app.waiting')} glyph="edit" />` is at `Source.svelte:437-438`. `app.waiting` is at `config/text/app.yml:234`, not :65. Its other users are Inbox:178, Radar:100, Status:72, Leads:198 and Linkedin:128.
- Cmd+S: moved.
  - The key is at `keys.ts:62,:238`, taken in `shell/keys/workbench-keys.svelte.ts:226-229`; `Workbench.svelte` `saveSource` is at :232-236.
  - The tab's save is `save/tab-save.svelte.ts:22-29`: `prepare` (the format before a save, D23) then `saveSourceDraft`.
  - `ask-perform.ts:57` holds; `OpenEditors.svelte` moved from :103 to :110; `Timeline.svelte` from :224 to :229.
  - New callers of `saveSourceDraft`: the LaTeX save-all (`context.ts:410-420`) and the debug launch (`context.ts:594`). Add Configuration's `saveText` writes a new file with no draft (`:596-598`, `debug-file.ts:59`).
- The editor primitive: moved and changed. The effect is at `ui/controls/editor/Editor.svelte:347-371`. It already applies the parent's edits through `reachedBy` (`commands.ts:167-190`), fed by `sourceReach`, and replaces the whole model only when no edits are named. The file is 513 lines, not 499. `editor/` and `kit/` hold 10 items each (holds).

The editor's options:
- `editor-options.ts`: moved. 208 lines. `readRecord` :56-99 (five cases, with `format_on_save` at :91-93), `readLanguages` :102-123, `readEditorOptions` :131-163, `parseRepoSettings` :187-208.
- `data/helpers/editor.ts`: moved. 129 lines. `LanguageRecord` :21-27, `EditorOptions` :33-49, `EditorResolved` :68-76, `layered` :82, `resolveEditor` :98-118.
- `options.yml`: moved. The editor entries are at :448-526: `paint_limit_kb` :448, `sticky_scroll` :490, `languages` :496, `format_on_save` :524-526, then `latex.auto_build` :527. The value-rule words are explained at :11, not :10. Command: `grep -n`.
- `behavior.yml`: moved. The comment is at :111-113 and the `editor:` block at :114-125. There is no `config/catalogs/behavior.yml`.
- The Settings view drawing a new key with no view change: not verified. I did not read `views/system/workbench/settings/`.
- `tests/data/sources/config/editor-options.test.ts`: false. `ls` gives "No such file". G13's row for the editor block is `tests/checks/config/config.test.ts:412` ('words each wrong setting against behavior.yml from the catalog, and nothing for the shipped files', with `format_on_save` at :424 and :487; `guarded.md:127`).
- VS Code 1.137.0 (`package.json`): holds. Re-read with `python3 -I` over `nls.messages.json`: 16406, 16453-16456, 16474, 16500, 16501, 16205, 16187, 16192, 16202, 16348, 16201, 23871 and 6448 all match. 16406 has a second sentence: "Only applies when `#files.autoSave#` is set to `{0}`."
- New VS Code facts:
  - 16467: under `afterDelay` the file is formatted only when saved explicitly.
  - The save participants are registered in this order: trim whitespace (`tRt`), code actions (`rRt`), format (`nRt`), insert final newline (`iRt`), trim final newlines (`oRt`). Source: `workbench.desktop.main.js`, from `grep -o`.

What to build:
- 1.1: the read is at `readCappedBytes` :380, and `crypto.subtle` is already in use (`readHash`).
- 1.2:
  - Folder counts: `server/files` holds 10 (holds), and `fs/` holds 9, not 7.
  - "registers with the hub ... a listener for the channel family": no such hub API exists (see above).
  - The git watcher start moved from :355 to `startGitWatcher` :327 and `const git` :386; `close()` moved from :471-480 to :496-521. D35's rebuild code is at `starters` :525-550 and `rebuild` :576-610.
  - `DESIGN.md:114` is now :121, and `reloadSource` :355-369 is now :472-487.
- 1.3: `keepCopy` reads the file itself (`history.ts:132-160`, `readFileSync` :144): holds.
- 1.4, the conflict compare:
  - `DiffSubject` moved from :133-156 to :139-166, and its key from :167-169 to `sideOf` :170-181.
  - The brief's `compare@` collides: `compare@` is already the side word of `against`, Compare Selected (:173-174).
  - The shape is `heldDiffShape` :208. `diff-read.ts` holds (74 lines).
  - `ops.ts:794-803` is `handleCompare`, the comparison of two files (:782-812); the Replace Preview is `previewed` :816-849.
- 1.4 `registerUnsaved`: moved from :335 to :346 (type :166). The struck label is already built (see above).
- 2.2 `close-question.svelte.ts` (80 lines) asks only the ui store (:23-27). It is not in the brief's write list.
- 3.2 `data/helpers/files` holds 7, not 5. `lineEnding` is at `editor-text.ts:78`, `languageOf` at `explorer/file-type.ts:44`, `repoSettings` at `selectors.svelte.ts:106,:522`: all hold.
- 3.4: changed by D23b. The edit path exists already (see the editor primitive above).
- 4, "the code window under the line, as a read-only file is": false. A read-only file opens in the editor with `readOnly` set (`save/locked-words.ts:3-6,:37`; `DESIGN.md:510`). The code window is for truncated files and HEAD or index versions.
- 5, the hypotheses:
  - H1 ("run is spawnSync, run.ts:156"): false. `run` uses `execFile` (`run.ts:217-240`). `grep -rn spawnSync src/lib/server` lists only `sessions/registry.ts:66` and `sessions/stores/codex.ts:387`. The probe `$TMPDIR/d28brief/probe-status.ts` is gone (`ls`: no such directory).
  - H2: holds, at `hooks.server.ts:86-91` (comment :67-72); both the file route and the source route call `locals.config()`.
  - H3, "two reads in a row": false. They run in parallel (`Promise.all`, `source.svelte.ts:363-366`), and they already did at the brief's base (`git show 2984b0099:...` line 307). `readFileKind` moved from :560-580 to :591-600 (`readKind` :608-620).
  - H4: the diagnosis is written. Its Cause section (:164-168) names the watcher's synchronous git reads, which X3e fixed.
- 6.1: 23 files import the store (`grep -rln "sessions/source.svelte" src tests`). Also `tests/checks/tree/boundaries.test.ts:194` allows `'state/sessions/source'` for the shell, with its comment at :157.
- 6.3: `source.yml` is 119 lines, not 40. None of the new keys exist in the `source` group (`grep -rn --exclude=local.yml` over `config/text`). `ui.tab_deleted` already exists.
- 6.4: false. Q125 and Q126 moved the text.
  - `HELP.md` has 185 lines; its :165 is now the Debug paragraph and :267 does not exist.
  - The text now lives in:
    - `docs/files-and-search.md:59` (opening), `:65` (editor options), `:51` (local history)
    - `docs/configuration.md:13` (the `behavior.yml` row)
    - `docs/window.md:66` (the close question)
    - `DESIGN.md:121` (socket), `:125` (Watchers), `:455` (the page's timers), `:509`, `:510`, `:512`, `:515`.
  - The plan line's widening says the UTF-8 rule is stated in DESIGN.md and HELP.md; `grep -rn -i "8192\|8,192\|utf-8"` finds no such sentence there.

Tests and checks:
- The G2 row 'refuses a path outside the named root' (`source.test.ts:54`): holds.
- G1 'requires the current write token' (:44) and G9 'replaces the complete file through a temporary neighbour and atomic rename' (:72): hold.
- `history.test.ts:63` holds; its full title is 'keeps a copy before the write, so the copy is the text the save replaced'.
- The G8, G28 and G2 Code-line claims hold (`guarded.md:44,:54,:11`).
- `size.test.ts:28-29` (900, 540): holds; `utils/size-allow.txt` has no entries.
- The verify list `npm run test:quick` holds (`orchestrator-state.md` block).
- The verify list's file `tests/data/sources/config/editor-options.test.ts` is missing.
- Lines 222-223 ask for breakage testing, which spec.md:62 bans.

## 2. Sizes

All counts are `wc -l` on main. Limits are 880 lines for a module and 520 for a component.

| File | Lines | Room | Risk |
|---|---|---|---|
| views Source.svelte | 519 | 1 | must split first |
| ui editor Editor.svelte | 513 | 7 | `onblur` fits; effect rewrite would not |
| PaneView.svelte | 510 | 10 | one fact line fits |
| repositories.ts | 843 | 37 | `unsaved` field, shape, side |
| server context.ts | 778 | 102 | fits |
| client context.ts | 724 | 156 | fits |
| ui.svelte.ts | 716 | 164 | fits |
| source.svelte.ts | 636 | 244 | base, disk, channel, conflict, saveText likely need `disk.svelte.ts` |
| fs-transport.ts | 465 | 415 | fits |
| socket.svelte.ts | 445 | - | not written |
| TabFace.svelte | 383 | - | needs no change now |
| history.ts | 349 | fits | |
| channels.ts | 219 | fits | |
| socket.ts | 210 | fits | |
| editor-options.ts | 208 | fits | |
| source.ts | 181 | fits | |
| lsp-edit.ts | 151 | fits | |
| source-options.ts | 146 | fits | |
| data/prose/text-edits.ts | 120 | fits | |
| editor.ts | 129 | fits | |
| close-question.svelte.ts | 80 | fits | |
| SourceNote.svelte | 69 | fits | |
| text-kind.ts | 41 | fits | |
| tab-save.svelte.ts | 38 | fits | |

Tests: `config.test.ts` 620, `source.test.ts` 93, `tests/state/sessions/source.test.ts` 42.

Folder item counts (`ls | wc -l`):
- `server/files/fs` 9 (one free slot), `data/helpers/files` 7, `data/prose` 9, `state/sessions` 10, `views/sources/source` 9, `save/` 8.
- Tests: `tests/routes/files` 10 (full), `tests/server/files` 9.
- YAML is not measured by the size check (`size.test.ts:50`, the `.ts|svelte|mjs|js|sh` filter).

## 3. Guarded entries

N1 to N6 are not written. `grep -n "^- N[0-9]\|N1\|N6" agents/guarded.md` prints nothing. A grep for autosave, saveText, open-files, `source:`, byte order or UTF-8 hits only G1's and G8's existing test titles.

Z530 (plan.md:1318) says they are written into guarded.md before D28 is dispatched, so this is the orchestrator's next write. With no Code or Test lines written, I checked the files those lines would name:
- N1 (base compare, second stat, `hash` answer): Code `src/lib/server/files/source.ts` exists; Test `tests/routes/files/source.test.ts` exists.
- N2 (whole-file UTF-8, kept BOM): Code `data/helpers/files/text-kind.ts` exists, plus `source.ts`, and `fs/lsp-edit.ts` if the rule is shared. Test: the same route test, or a new `tests/data/helpers/files/text-kind.test.ts` (that folder holds 1).
- N3 (`saveText`): new module; no file yet.
- N4 (autosave timing): new store; no file yet. It fits a `*.client.test.ts` under spec.md:65.
- N5 (disk change on dirty and clean tabs): G28's Code line names `state/sessions/source.svelte.ts`, which this step moves; `tests/state/sessions/source.test.ts` exists. C5 also needs G28's text widened and `close-question.svelte.ts` (exists).
- N6 (`source:` resolution): new `fs/open-files.ts`; its test fits `tests/server/files` (9 items).

## 4. Shared paths with M8

From M8's "Paths this step writes" (`agents/briefs/M8.md:138-165`) against D28's corrected list:
- `config/catalogs/options.yml`: not simple. M8 renames every `description:` to `help:` and `values:` to `options:` across the file, including the editor block :448-526 (M8.md:62, :225). D28 inserts entries after :495 and fields after :526 in the old words. The hunks touch, and whichever lands second rewrites the other's entries.
- `src/lib/data/sources/config/editor-options.ts`: judged on M8's diff. M8 replaces the catalog readers this file imports (`FieldSpec`, `settingEntry`, `valueProblem`; M8.md:73). D28 adds two cases and two reads. It is not simple if M8 renames the spec fields those reads use.
- `config/text/views/sources/source.yml`: simple. M8 adds `cmd_yaml_restart` and `cmd_yaml_output` after :36; D28 adds keys from :37 on and rewords :9. The hunks are one line apart and may need a join by hand.
- `src/lib/server/root/context.ts`: simple. M8 changes the relay construction (:242-260); D28 changes :327, :386 and :496-521.
- `docs/configuration.md`: judged on M8's diff. M8 writes "the file" and names `config/schemas/` at :19; D28 writes :13.
- `docs/files-and-search.md`: simple. M8 writes :69-71; D28 writes :51, :59 and :65.
- `DESIGN.md`: simple. M8 writes :23, :24, :44, :165 and :571; D28 writes :121, :125, :455, :509, :510, :512 and :515.
- `docs/diagrams/`: regenerated at each landing.
- No shared tests: M8 writes `config-folder.test.ts` and `catalog/options.test.ts`; D28 writes `config.test.ts`.

Coupled but not shared: M8 changes the Settings components (`Control/Item/List/Settings.svelte`) and the catalog readers that draw D28's new keys.

Under spec.md:93 the pair is not simple, so one waits. The queue puts D28 first. M8's premise recheck (aca73f6f335a1fa89) may move M8's lines.

## 5. Libraries

`npm view <name> version license time.modified`, run 2026-10-08. Every row holds, with no newer release:
- utf-8-validate 6.0.6, MIT, 2026-07-30
- isutf8 4.0.4, MIT, 2026-09-11
- chardet 2.2.0, MIT, 2026-06-20
- iconv-lite 0.7.3, MIT, 2026-07-17
- js-sha256 1.0.0, MIT, 2026-07-27
- hash-wasm 4.12.0, MIT, 2024-11-19
- chokidar 5.0.0, MIT, 2026-05-21
- @parcel/watcher 2.6.0, MIT, 2026-07-20
- diff 9.0.0, BSD-3-Clause, 2026-04-13
- write-file-atomic 8.0.0, ISC, 2026-09-09

New in the tree, to reuse rather than rewrite:
- `hashOf`, the BOM constant and the UTF-8 round trip in `lsp-edit.ts:46,:62-64,:73-80`
- `readHash` in `fs-transport.ts:435-445`
- `writeBytesAtomic` in `json.ts:81`

## 6. D13a-3

Two of the three parts still describe main.
- The words are still drawn: `grep -rn "app.waiting" src` gives `Source.svelte:438`, while `!draft.loaded` (:437).
- The load path is unchanged:
  1. A press runs `readFileKind` (`opening.ts:103`; `fs.svelte.ts:591`), which is held in queries.
  2. The tab mounts, and `tab-draft.svelte.ts:40-48` runs `loadSourceDraft`.
  3. That makes two parallel GETs, `/api/file` and `/api/source`, and each parses the whole config through `locals.config()` (`hooks.server.ts:86-91`; about 46 ms a request by `X3e-diagnosis-graph.md:168`).

The cause changed with X3e. H1 named the synchronous git reads; X3e moved every git read to `execFile`, which is the cause its Graph diagnosis proved and fixed. The only synchronous calls left on the server are `spawnSync('ps')` at `registry.ts:66` and `codex.ts:387`. D45 changed nothing on this path.

Whether the 4 to 6 s still happens on main is not verified: I may start no server and open no page. The builder's first run of case 39 decides whether a probe is needed. If it does not reproduce, the part reduces to C7's empty pane.

## 7. New choices (none taken)

NC1. C1's comparison. Z528 rejected the `files` channel as "blind to roots that are not repositories and to ignored folders". Since X3e that is false: the channel covers every served root except `engine`, ignored folders included.
- (a) Keep the `source:` channel polled at 500 ms.
  - Pros: within a second; no dependence on FSEvents, which can drop a write that lands while its stream registers (`file-poll.ts:6-10`); no collapse to the whole root past 64 folders.
  - Cons: a new channel family; a stat per open file every 500 ms until the page closes.
- (b) Use the `files` channel and re-hash each open tab's file in a named folder through `readHash`.
  - Pros: no new wire shape.
  - Cons: up to 2 s late; a read per open file per message; silent when FSEvents drops an event.
- (c) Both.
  - Pros: the faster of the two.
  - Cons: two paths for one fact.
- Recommendation: (a). The lazy option is (b). Z528's booking text (plan.md:1361, choices.md:1224) needs its stated reason corrected whichever is chosen.

NC2. The deleted mark exists already: X3e's `Tab.gone`, from the folder listing, refreshed by the `files` channel.
- (a) The source store's `disk: 'gone'` also feeds the strip's existing `gone` fact, through a ui registration that `strip-tab.ts:41` ORs in.
  - Pros: one mark, shown within 0.5 s for a source tab.
  - Cons: two inputs to one fact.
- (b) The strip stays on X3e's listing alone, and only the tab's own line comes from the channel.
  - Pros: no new code.
  - Cons: the line and the label can disagree for up to 2 s.
- (c) Build the brief's separate `deleted` flag and drawing.
  - Cons: two marks for one fact.
- Recommendation: (a). The lazy option is (b).

NC3. `format_on_save` (D23, run in the view through `tab-save.svelte.ts` `prepare`) under autosave, and the order of the save steps. VS Code trims trailing whitespace before formatting and adds the final newline after it (registration order above). VS Code formats an `afterDelay` save only when it is explicit (16467). The brief runs trim and the final newline after the format.
- (a) Follow VS Code.
  - The trim runs before the format and the final newline after it.
  - An `after_delay` save never formats.
  - An `on_focus_change` save formats while the tab's editor is mounted; an unmounted tab saves unformatted, with the existing `source.format_failed` line.
- (b) Keep the brief's order; automatic saves never format.
- (c) Every automatic save formats where it can.
- Recommendation: (a). The lazy option is (b).

NC4. Revert File. Today's Revert File (`revertSourceDraft` :520, the bar and the palette) takes `saved`. VS Code's Revert File reads the disk again, as the brief's conflict Revert does.
- (a) One Revert: it reads the file again everywhere, and takes `saved` only for a deleted file.
  - Pros: one action, and VS Code's behaviour.
  - Cons: Revert becomes a request.
- (b) Two Reverts with different results.
  - Cons: a reader cannot tell them apart.
- Recommendation: (a). The lazy option is (b).

NC5. The conflict pane's saved state. A diff pane's state is saved with the layout, so it is a saved-record shape under spec.md:18, and `compare@` is taken.
- (a) Field `unsaved`, side word `unsaved@<instance id>`.
- (b) Reuse `against` with a marker field.
  - Cons: overloads the Compare Selected pane.
- Recommendation: (a). Neither is the lazy option.

## 8. Corrections the brief needs

1. Lines 15-22, the whole "The base this brief is written against" section. Replace it with: "This brief is written against main at 1ae5e7c8d, after X3f (e6d00fb0f), S5 (30b4ddced), D20 (722a287a7), O30 (3cb170eae, 4ce24363b), A3 (09509b5b6), E4 (10ac00c69, c86f10f2f), Q125 (e7952e163), Q126 (6561f82ae), D45 (0753a5e76), D11 (c88b76443) and X3e (1ae5e7c8d). Every line number is main's at that head." Drop every "(main)", "(X3f)" and "(S5)" mark.
2. Line 28: "(main, 31 lines)" becomes "(33 lines)". "POST calls `handleSource` with `locals.server.local.history ?? defaultHistoryDir()`" becomes "POST calls `handleSource(request, locals.token, () => textCatalog(locals.config().config), roots(locals), locals.server.local.history ?? defaultHistoryDir())` (:26-33)".
3. Line 29:
   - "(main, 180 lines; S5 rewrites only the doc comment of `localRefusal` at :87-94)" becomes "(181 lines)".
   - "(:144-180)" becomes "(:144-181)"; "(:159-160)" becomes "(:159-162)".
   - "(:165-166)" becomes "(:166-167)"; "(:167, `historyRefusal`" becomes "(:168, `historyRefusal`"; "(:169)" becomes "(:170)".
4. Line 31: "`fs-transport.ts:309`" becomes "`fs-transport.ts:376`". In 1.1, "`fs-transport.ts:313`" becomes "`fs-transport.ts:380`".
5. Line 32: "`files.ts:81-93`" becomes "`files.ts:82-93`", and "`resolveRootPath` (:102)" becomes "`resolveRootPath` (:103)". Append the bullet "`server/files/fs/lsp-edit.ts` already compares a SHA-256 base (`hashOf` :62-64, :72), keeps a BOM (:46, :73-80), refuses bytes that are not UTF-8 by a round trip (:76), and writes through `writeBytesAtomic` with a read-back compare (:105-122); the page has `readHash` (`fs-transport.ts:435-445`)."
6. Line 36: replace the line-number list with the numbers in section 1, the tab's state. The new text reads: "(636 lines): `SourceDraft` :60, `draftShape` :127, `loadSource` :222, `loadSourceReadonly` :258, `SourceStore` :269, `createSource(writes, ui, saved)` :323, `sourceDirty` :343, `loadSourceDraft` :354 (the two reads in parallel, :363-366), `reloadSource` :472, `reloadHead` :489, `editSourceDraft(id, text, edits?)` :508, `sourceReach` :515, `revertSourceDraft` :520, `saveSourceDraft` :561, `saveSource` :610". Drop "Main's numbers are 5 lower from :90 on."
7. Line 37:
   - "is called only by `reloadClean` in `src/lib/state/sources/explorer/ops.svelte.ts:284-290` (main)" becomes "is called by `reloadClean` (`ops.svelte.ts:297-307`) and by `views/academic/present/Present.svelte:175`".
   - "Nothing reloads a tab when another program writes its file" becomes "Nothing reloads a working-file tab when another program writes its file (a HEAD or index tab is read again by `save/tab-draft.svelte.ts:50-62`)".
8. Line 39 becomes: "`context.ts:449-455`; the unsaved dot is `dirty: unsaved` in the strip facts at `PaneView.svelte:192` (`strip/strip-tab.ts:27,:64`), drawn at `TabFace.svelte:97,:172-174` (383 lines). A tab whose file is off the disk is already struck through in the error colour with `Deleted` in its tooltip: `Tab.gone` (`tab-strip.ts:41-42`), from `fs.gone` (`fs.svelte.ts:488-499`) at `strip-tab.ts:41,:47`, `TabFace.svelte:107,:373-377`, `pane-view.ts:484-485`, `config/text/ui.yml:100`."
9. Line 40: the socket and hub numbers become "socket.svelte.ts:226-243, `listen` :245", "channels.ts:97-120", "`onFirstSubscriber` (:88, one exact name)", "`hasSubscriber` (:75)" and "socket.svelte.ts:234-240". Append: "`server/root/socket.ts:178-186` hands `pty:` and `lsp:` channels to their consumers and the rest to the hub; nothing registers for a family of channels."
10. Line 42: replace the bullet with the `files` channel facts in section 1, the tab's state.
11. Line 46: "(X3f) is 512 lines (`wc -l`); S5 adds ... `status/source-status.svelte.ts`)." becomes "is 519 lines (`wc -l`)."
12. Line 47: replace with the folder contents in section 1, the tab's view (9 items; `save/` 8; `status/` 6; `actions/read-again.ts`).
13. Line 48: "(X3f :432-433)" becomes "(`Source.svelte:437-438`)", and "`config/text/app.yml:65`, main" becomes "`config/text/app.yml:234`".
14. Line 49:
    - "(X3f, the hunk at :182-189)" becomes "(:232-236; the key in `shell/keys/workbench-keys.svelte.ts:226-229`)".
    - "the tab's `save()` (X3f `Source.svelte:355-370`)" becomes "`tabSave.save()` (`save/tab-save.svelte.ts:22-29`: `prepare`, the format when `format_on_save` is on, then `saveSourceDraft`)".
    - "OpenEditors.svelte:103" becomes ":110", and "Timeline.svelte:224" becomes ":229".
    - Append the LaTeX save-all (`context.ts:410-420`), the debug save (`:594`) and the new-file `saveText` (`:596-598`).
15. Line 50 becomes: "`ui/controls/editor/Editor.svelte:347-371` applies the parent's text by the edits the store names (`reachedBy`, `commands.ts:167-190`; `editSourceDraft`/`sourceReach`, `source.svelte.ts:508-517`; `TextEdit`, `data/prose/text-edits.ts:23`) and replaces the whole model only when none are named. 513 lines."
16. Lines 54-55: use the numbers in section 1, the editor's options.
17. Line 57 becomes: "No test file of `editor-options.ts` exists; G13's row is `tests/checks/config/config.test.ts:412` (`guarded.md:127`)."
18. 1.1: "computes `base` with `crypto.subtle.digest('SHA-256', bytes)`" becomes "computes `base` with the digest of `readHash`, taken out into one helper both call".
19. 1.2:
    - "`fs/` holds 7" becomes "`fs/` holds 9".
    - "registers with the hub at start a listener for the channel family" becomes "receives the `source:` channels of each subscribe message through `server/root/socket.ts` (beside `options.terminals`, :178-186) or a prefix listener added beside `onFirstSubscriber` (`channels.ts:88`), the builder reporting which; the roots are resolved again at each `config` push".
    - "(the `make.watchGit` call at :355 and `close()` at :471-480, main)" becomes "(`const git` :386, `close()` :496-521, the rebuild `starters` :525-550)".
    - "`DESIGN.md:114`" becomes "`DESIGN.md:121`", and "main :355-369" becomes ":472-487".
    - `createSource` gains the socket, which is made at `context.ts:286`.
20. 1.3: append "The hash, the BOM rule and the whole-file UTF-8 rule are `lsp-edit.ts`'s, taken out into one module that it and `source.ts` use."
21. 1.4:
    - "`repositories.ts:133-156`, main" becomes ":139-166".
    - "its key (`compare@...` beside `save@...`, :167-169)" becomes "its side word `unsaved@<id>` in `sideOf` (:170-181; `compare@` is `against`'s, :173-174) and `heldDiffShape` (:208)".
    - "(`server/files/fs/ops.ts:794-803` builds the same shape for the Replace Preview)" becomes "(`ops.ts` builds the same shape in `handleCompare` :782-812 and `previewed` :816-849)".
22. 1.4, the deleted bullet: "`ui.svelte.ts` gains `registerDeleted` beside `registerUnsaved` (:335, main), `context.ts` registers the source store's `sourceGone`, `PaneView.svelte` passes `deleted` beside `dirty` (X3f :212), and `TabFace.svelte` draws it." becomes (under NC2 (a)): "`ui.svelte.ts` gains a registration beside `registerUnsaved` (:346), `context.ts` registers `sourceGone` beside :455, `PaneView.svelte:192` passes it as a fact and `strip-tab.ts:41` ORs it into `gone`; `TabFace.svelte` and `ui.yml` do not change."
23. 2.2: "(`close-question.svelte.ts`, X3f)" becomes "(`shell/panes/strip/close-question.svelte.ts:55-60`, reached through a ui-store registration, since the shell asks only the ui store, :23-27)". Append: "An automatic save calls `saved`, so `latex.auto_build: on_save` builds after it, as LaTeX Workshop 10.19.0 does (`out/src/main.js:98-112`)."
24. 2.2 and 3.3: write the format and order rule as NC3 settles.
25. 3.2: "`data/helpers/files/` holds 5" becomes "holds 7".
26. 3.3: "Cmd+S, the palette's Save, Open Editors' Save, an untitled text's first Save and an automatic save all run it" becomes "... an automatic save, the LaTeX save-all and the debug launch's save all run it".
27. 3.4: replace the section with: "The trim, the final newline and a clean tab's read again hand the editor their edits: a function beside `applyTextEdits` in `data/prose/text-edits.ts` computes `TextEdit[]` from the two texts (common leading and trailing lines left; each changed line one edit when the count between is equal, else the span one edit), set with the text through `editSourceDraft(id, text, edits)` or the same record for `reloadSource`, so `reachedBy` applies them as one undo with the caret and the scroll kept. The effect at `Editor.svelte:347-371` is unchanged."
28. 4:
    - "`isBinaryFile` goes (its only callers are `handleSource`, `grep -rn isBinaryFile src tests`)" becomes "`handleSource` stops calling `isBinaryFile`, which stays for `fs/replace.ts:156`, `fs/ops.ts:754` and `machine/lsp/library/read.ts:53`".
    - "`text-kind.ts` gains `isTextFile(bytes)`" becomes "one whole-file rule, used by `handleSource` and `lsp-edit.ts` (:73-76)".
    - "drawn as a locked tab (the code window under the line, as a read-only file is)" becomes "drawn by the code window under `source.not_text` (`save/locked-words.ts`, `window: true`), as a truncated file is, since its decoded text is not the file on disk (`DESIGN.md:510`)".
29. 5:
    - H1 becomes: "the git reads run through `execFile` (`run.ts:217-240`) since X3e; the synchronous calls left are `spawnSync('ps')` at `server/sessions/registry.ts:66` and `stores/codex.ts:387`." Drop the `probe-status.ts` run.
    - H2: "`src/hooks.server.ts:54-59`, main" becomes ":86-91".
    - H3: "(`readFileKind`, `fs.svelte.ts:560-580`, main), the mount, then two reads in a row" becomes "(`readFileKind` :591-600, `readKind` :608-620), the mount, then the two reads in parallel (`source.svelte.ts:363-366`)".
    - H4: "being written" becomes "written; its cause is fixed on main by X3e".
    - Add: "The first run of case 39 states whether the wait reproduces on main before any probe."
30. 6.1: append "and the shell's allow entry `'state/sessions/source'` at `tests/checks/tree/boundaries.test.ts:194` with its comment at :157".
31. 6.2: "`views/sources/source/` stays at 10 items" becomes "holds 9 and stays at or under 10".
32. 6.3: "(main, 40 lines)" becomes "(119 lines)". Delete "`config/text/ui.yml` gains `tab_deleted: Deleted` in the `ui` group where it already is."
33. 6.4: replace the doc list with the targets in section 1 under "6.4". `HELP.md:33,:41,:63` are read and changed only where what a user does changes (spec.md:66). Widen the grep to `HELP.md DESIGN.md README.md docs/*.md`.
34. Cases: delete "For each case kept as a test, the report names one small change to the code under test that the case must catch." and "The report quotes the test's failing line with that change made." Replace them with "A test is judged by reading it (spec.md:62); its failing line on the unchanged tree is quoted (spec.md:63)."
35. Tests:
    - The G13 bullet: "S5's `tests/data/sources/config/editor-options.test.ts`" becomes "`tests/checks/config/config.test.ts`, 'words each wrong setting against behavior.yml from the catalog, and nothing for the shipped files' (:412)".
    - "No other test is written. The behaviours below need an entry Axel has not given, and no test is written for any of them until he rules; each is checked by a run the report quotes:" becomes "Axel gave N1 to N6 (Z530, plan.md:1318); each behaviour below gets its test under the entry the orchestrator writes into `agents/guarded.md`, named by file and title, and N5 widens G28's text for C5:".
36. Paths this step writes:
    - Drop `ui/tabs/TabFace.svelte`, `config/text/ui.yml` and `data/helpers/files/text-edits.ts`.
    - Add: `shell/panes/strip/strip-tab.ts`; `shell/panes/strip/close-question.svelte.ts`; `server/root/socket.ts` or `server/core/channels.ts`; `server/files/fs/lsp-edit.ts`; `state/sources/fs-transport.ts`; `data/prose/text-edits.ts`; `views/sources/source/save/locked-words.ts`, `save/tab-save.svelte.ts`, `status/tab-shown.ts`; `tests/checks/tree/boundaries.test.ts:157,:194`; `tests/checks/config/config.test.ts`; the N-entry test files.
    - Add `data/model/model-sessions.ts` for the channel's payload type, and `server/root/process/server-context.ts` if the context gains a member.
    - Line ranges: `server/root/context.ts` (:327, :386, :496-550); `ui.svelte.ts` (:346-353, :166); `repositories.ts` (:139-181, :208); `behavior.yml` lines 111-125; `options.yml` lines 490-526.
    - Replace `HELP.md 165`, `HELP.md 267`, `DESIGN.md 114/116/395-398` with the docs list of item 33.
37. Shared paths with the steps in flight: replace the section with section 4 of this report. X3e, D45, D20, A3, O30 and E4 have all landed.
38. Verify list:
    - Item 2: replace `tests/data/sources/config/editor-options.test.ts` with the N-entry test files.
    - Item 5: add `ls src/lib/data/prose | wc -l` and `ls tests/server/files | wc -l`.
    - Item 7: "the save path no longer reads a window" stays; isBinaryFile keeps its three other callers.
39. Report, "Doc text": drop "the lines of `HELP.md` and `DESIGN.md` shared with A3 and E4 (`HELP.md:267`, `DESIGN.md:114`, `:116`)". Keep G28's Code line, and add the moved path in the N entries' Code lines.
40. Read list:
    - Item 3: `source.svelte.ts` whole, `fs-transport.ts:370-445`, `ops.svelte.ts:290-310`, `socket.svelte.ts:220-260`, `context.ts:280-290,:405-460,:590-600`, `ui.svelte.ts:160-170,:340-355`.
    - Item 4: `channels.ts:70-125`, `socket.ts:140-200`, `context.ts:320-400,:490-610`, `watch/git.ts:1-60,:440-505`.
    - Item 5: `Source.svelte` whole, `save/*`, `status/tab-shown.ts`, `actions/read-again.ts`, `workbench-keys.svelte.ts:220-232`, `Workbench.svelte:228-240`, `Editor.svelte:340-372`, `commands.ts:160-190`, `PaneView.svelte:180-200`, `strip-tab.ts` whole, `TabFace.svelte:25-35,:100-110,:370-380`.
    - Item 6: `options.yml:1-14,:445-530`, `behavior.yml:108-126`.
    - Item 7: `repositories.ts:130-235`, `ops.ts:740-849`.
    - Item 9: `docs/files-and-search.md:49-67`, `docs/configuration.md:13`, `docs/window.md:66`, `DESIGN.md:119-126,:455,:503-515`.
    - Add `server/files/fs/lsp-edit.ts` whole, `fs/replace.ts:130-180` and `data/prose/text-edits.ts` whole.
    - Item 10: X3e's diagnosis is written.

## Declined to judge

- Whether D13a-3's 4 to 6 s still happens on main. Measuring it needs a running server or page, which this task forbids.
- Whether the Settings view draws the new keys and fields with no view change. I did not read `views/system/workbench/settings/`.
- Whether VS Code's `participate` walks its participants in registration order. I read the registration, not the loop.
- How M8's diff changes `editor-options.ts` and `docs/configuration.md`. That waits on M8's diff.

Usage: a9503ab88614faf3d, claude-opus-5-5, 385,915 tokens, 143 tool uses, 18.5 min.
