# Brief check: Q88b

Model: claude-sonnet-5-5 (served, read from the agent's record at 11:45). Usage: 317240 tokens, 107 tool uses, 948 s (15 min 48 s), from the completion notice.

BRIEF CHECK, step Q88b (oculus/migration). Read-only. No file edited, no git command beyond `git status`, `git log`, `git diff --stat`. `config/local.yml` was not opened, printed or hashed. No request went to localhost. VS Code source at e4f7a6f2 was fetched with `curl https://raw.githubusercontent.com/microsoft/vscode/e4f7a6f2/<path>` (it worked) into the scratchpad. `.vscode` was not read. Main's head is 07ee40d1; `git diff --stat bf9b3da0 07ee40d1 -- tools/oculus/src tools/oculus/tests tools/oculus/DESIGN.md tools/oculus/package.json` prints nothing, so the tree is the one the brief read.

Summary: the brief has 9 findings that would make the built step wrong or unsafe if left as written (marked **must fix** below), plus smaller ones. The most serious: a path-traversal hole in the name rule, `trash` globbing absolute paths, upload-replace writing through a symlink, a symlinked `under` letting Find in Folder search outside the roots, three VS Code behaviours misstated (Paste, rename key, delete words), and Files.svelte at 538 of 540 lines with no extraction planned.

## Names

Command for each: `grep -rn "<name>" src tests config DESIGN.md HELP.md README.md --exclude=local.yml`. Hits inside the brief's Paths are not listed.

N1 (**must fix**). `RowMenuFacts`, `rowMenu`, `rowPicker`, `RowStores`. `tests/ui/menu/menu-words.test.ts:65-67` calls `rowMenu({ kind, path, removable, addable }, words)` with literals; `RowMenuFacts` gaining a required field (clipboard, selection, writable, selected-for-compare) breaks `npm run check` there. The same file's header says each builder is "called in the state that gives it its most items", so the new labels are unaudited unless the call is updated. The file is not in Paths. Close: add it to Paths and say the three calls pass the fullest facts.

N2 (**must fix**). `SearchQuery`, `searchArgs`, `searchParams`, `refusalOf`. `tests/data/helpers/search.test.ts:29` builds a `SearchQuery` literal in `query()`; `:43` and `:111` assert `searchArgs` output; `:117-129` assert `refusalOf`; `:180` asserts `queryFrom(searchParams(held))` equals `held`. A required `under` breaks the literal. The file is not in Paths. Also `refusalOf` returning `outside` adds a member to `SearchRefusal` (`data/helpers/search.ts:30`): `REFUSALS` in `server/files/search-routes.ts:30-33` and `refusalWords` in `state/sources/search.svelte.ts` must gain it, and `config/text/views/sources/search.yml` needs `refused_outside` (existing keys `refused_empty`, `refused_too_long`, `refused_unknown_root`). The brief names only "the Search view's words file". Close: add `tests/data/helpers/search.test.ts` to Paths; name `SearchRefusal`, `REFUSALS`, `refusalWords` and `search.yml`; state that `queryOf` (`state/sources/search.ts:122`) and `emptyQuery` (`data/helpers/search.ts:54`) gain `under`.

N3 (**must fix**). `OpenTarget`, `openArgs`, `openable`, `handleOpen`. Their tests are `tests/routes/files/open-program.test.ts` (:309, :311, :319-362), `open-fixture.ts:14,120` and `open.test.ts`. The brief's Paths name `tests/server/files/open-bin.test.ts`, whose head (lines 1-3) tests `open_bin` and `addressOpener` only, so Case 25 has no home. The existing assertion `openable({kind:'folder', path: report})` is false (`open-program.test.ts:345`), which supports a separate `reveal` kind. Close: replace the Paths entry with `tests/routes/files/open-program.test.ts` and `open.test.ts` (the `reveal: true` body).

N4 (**must fix**). Documents made false or incomplete by the change, none in Paths:
- `DESIGN.md:401` describes `/api/open` ("A folder is revealed ... a file is opened only by `open -b`", the `macOpenPath` floor); it must state the reveal kind.
- `DESIGN.md:148` lists the routes whose bodies are read through zod; `/api/ops` is absent.
- `DESIGN.md:378` says `POST /api/memories` is "the one write in oculus that lands bytes"; upload makes that false.
- `src/lib/server/core/json.ts:57-61` comment says `writeBytesAtomic` is "the one write in oculus that carries a picture".
- `HELP.md:3` says oculus "writes only where a control says it writes, and only back into the same files".
- `HELP.md:111` (the `files` table row) says "Enter opens a file".
- `HELP.md:160-166` says everything under a hidden folder is never opened; Find in Folder on a dot folder opens it (checked, see Implied inputs I9).
- `HELP.md:43` (Right-click menus bullet) omits the Files menu. There is no "Files view's section" in HELP.md (`grep -n "^#" HELP.md` shows only `## Searching the files`); item 14 should name `HELP.md:111` and `:43`.
- The brief's `DESIGN.md:382` is not "the Files view's paragraph". Line 382 starts "The file browser's box and its scratch notes: the Files view asks `ui/frame/Pane.svelte` for the tint ...". The Files behaviours are in `:383`, `:405`, `:409`, `:414`.
Close: add `DESIGN.md:148,378,401` and the right Files paragraph, `json.ts:57`, and the HELP lines to item 13/14 and Paths.

N5 (**must fix**). Writers of files the brief does not list:
- The explorer store (clipboard, compare selection) joins `ClientState`: `src/lib/state/client/context.ts:78,127,275,346` is the pattern (`createSearch`). Not in Paths.
- `revealPath` joins the `WritesStore` type at `src/lib/state/shared/stores/shapes.ts:130-131`. Not in Paths.
- Item 8's pending-name state needs a home. The view convention is instance state (`Files.svelte` header: "Which folders are open, the selected row ... live in the instance's own state"), i.e. `FilesView` in `state/sources/fs.ts:132`, which Paths lists "for its import" only. An inline row inside the virtualised tree also needs a row source (`treeRows`, `fs.ts:621`, or `ui/tree/VirtualRows.svelte`) and `ui/tree/TreeItem.svelte` has only a "field drawn after the name" prop. `ui/tree` is not in Paths.
- `tests/checks/tree/allow-duplication.txt:154` names `tests/state/sources/explorer.test.ts`; moving that file makes the entry stale and `duplication.test.ts` fails on a stale entry. Not in Paths.
- `src/lib/state/sources/fs.ts:2` (head comment names `state/sources/file-type.ts`) is a sentence the move makes false; Paths allows only "its import". `file-type.ts:9-11` imports `../../data/...`, which become `../../../data/...`.
- `docs/diagrams/*` is regenerated by verify step 1 (`npm run diagrams`) and its edge counts change when files move (`layer-state.dot:23` holds import counts). The Paths sentence "writes these paths and nothing else" omits it.
Close: add all of the above to Paths; state where the pending-name state lives.

N6 (checked, no change needed). `DiffSubject` gaining `against?` (optional) leaves `Worktrees.svelte:33,45`, `repositories.svelte.ts:19,100,222` and `Diff.svelte` compiling. `diffUrl`/`diffActs`/`heldDiff` tests (`repositories.test.ts:814-826`, `view-state.test.ts:101`, `diff-view.test.ts:147-164`) keep passing since all use optional fields or `toMatchObject`. `file-type` importers: `fs.ts:20`, `Usage.svelte:31`, `TerminalRows.svelte:14`, `Timeline.svelte:30`, `DESIGN.md:379` match the brief (`grep -rn "file-type" ... --exclude-dir=.scratch` also shows `config/catalogs/icons.yml:176 encoding: file-type`, an unrelated icon name).

## The step line

Command: `grep -n "^- Q88b" plan.md` prints line 272 (shown in full above in the brief).

S1. Mapping: New File and New Folder = items 1 (`create`), 7, 8; Rename = 1, 7, 8; Delete to Trash = 1 (`trash`, `delete`), 7, 9; Cut, Copy, Paste = 1 (`paste`), 6, 7, 10, 11; Upload = 1 (`upload`), 7; Select for Compare and Compare Selected = 2, 3, 6, 7; Reveal in Finder for a file = 4; Find in Folder = 5; "writing only under the served roots" = item 1; items 12-14 are words and documents. No part of the line is without an item.
S2. The Upload client flow has no item: the file picker (`ui/forms/FileChooser.svelte` exists with a `multiple` prop; `Memories.svelte:150` already turns a file into base64 and `writes.svelte.ts:343` posts it), several files in one pick, a per-file size check, a per-file replace question, a result line. Item 7 lists the menu entry, item 9 the question. Close: add an item for it and name `FileChooser` and the reuse of the Memories base64 reader.
S3. `plan.md` has no Goal section (`grep -n -i "goal" plan.md` prints only line 211, an unrelated step). The goal was taken from your prompt and Z52 (b).
S4. Z151: the brief (line 19) says "Decisions 1 to 6"; `choices.md:9` says "Decisions 1 to 8". Close: make both say 1 to 8, and add the decisions below that are not listed (see C9).

## Premises

Confirmed by rerun (command, then result): `wc -l` of `row-menu.ts` 194, `Files.svelte` 538, `Tree.svelte` 350, `fs.svelte.ts` 711, `fs.ts` 786. `ls | wc -l` of `src/lib/server/files` 10, `server/files/fs` 2, `state/sources` 10, `views/sources/files/tree` 7, `routes/api/(files)` 6, `tests/state/sources` 10, `tests/server/files` 5. `grep -n '"trash"' package.json` prints nothing. `npm view trash` gives 10.1.1, MIT, type module, engines node >=20, modified 2026-02-25. Line citations hold: `writes.svelte.ts:180`, `open.ts:47-49,246-248`, `row-menu.ts:183-184`, `search.ts:32-45,101-115,150-158`, `state/sources/search.ts:20`, `repositories.ts:107-117,143,161-166,172-179`, `model-sessions.ts:447-455`, `fs.ts:547,562`, `json.ts:113`, `files.ts:102`, `source.ts:36,54,89`, `git.ts:205-207`, `memories.ts:49,59`, `server.ts:37`, `files.yml:44,82`, `Files.svelte:504-517`, `parity.md:46-70,207-232`, `library-audit.md:205`, `plan.md:168`. History claim: `grep -n "change" src/lib/server/files/source.ts` prints nothing, rc=1. `MenuItem` (`menu-items.ts:13-48`) has `disabled`, `badge`, no keybinding field. Wrong premises:

P1 (**must fix**). Files-channel claim is false. Brief line 31: a root that is no repository "gets no message". `git.ts:296-306` watches `[root, true, '']` recursively for every root it is given, whether or not `.git` exists (comment at :298-300), and `relevant()` (:112-119) passes every path not in `IGNORED`. `repositoryRoots` (`roots.ts:46-48`) leaves out only the `engine` root. So the explicit re-read is still needed for the `engine` root and ignored folders, but the reason given is wrong. Close: reword to "the engine root and ignored folders get no message".

P2 (**must fix**). `localRefusal` is described as the guard on `config/local.yml` ("guarded on the source write only"). `source.ts:89-93` returns `checkLocal(content, LOCAL_NAME)`, a validity check of the text being saved, not a refusal to write the file. `files.ts:236-241` says the engine root serves local.yml "read and saved like the tracked ones", and `grep -n "local.yml" DESIGN.md` shows the Config view lists it. The `protected` refusal is therefore a new rule, and it is user-visible (the Files view refuses to rename, trash, copy or compare a file the Config view and the source tab read and save). It is in no ruling: `grep -n "protected" plan.md choices.md orchestrator-state.md` finds nothing. Close: state it as a decision (with what it protects and why compare is refused when the source tab can read the same file), book it as part of Z151, or drop the read refusal on compare.

P3 (**must fix**). The `engine` root's directory is the `config/` folder itself (`files.ts:242-250`, `engineRoot` = `configDir(engine)`); local.yml is path `local.yml` under root `engine`. So "the root's own folder" refusal `root` and the `protected` refusal collide on `engine` + `path: ''`, and the brief's "the `config` folder holding it" is `engine:''` through that root but `tools/oculus/config` through the hub root. Refusal order is not stated (see C9).

P4 (**must fix**). Item 2: "The text cap is the one the source route reads a file under". No server-side cap exists: `grep -rn "1024 \* 1024\|MAX_FILE\|TEXT_LIMIT" src/lib/server/files` shows only `search.ts:41 MAX_OUTPUT`. The 2 MiB `TEXT_LIMIT` is client-side (`state/sources/fs.ts:81`, "The largest text a code window draws"), unreachable from `server/`. Close: name the cap constant and where it lives (`data/`), or state the number.

P5 (**must fix**). Zod in the state layer. Items 3, 5, 6 require zod reads in `state/` (`heldDiff`, Search held state, ops answers) citing `DESIGN.md:148`; line 148 begins "In `server/core`, `server/root`, ... `server/transcripts`" (server only), and `grep -rln "from 'zod'" src/lib/state src/lib/views src/lib/data` prints nothing, so no state module imports zod yet. Q85b (in flight, base 402437e8, `orchestrator-state.md:56`, brief `Q85b.md:42`) converts every state reader, `heldDiff` and the Search state reader included, and moves the helper to `src/lib/data/shapes/shapes.ts` (`Q85b.md:38`), not `src/lib/data/shapes.ts` as brief line 180 says. Q88b is based on a head where none of this exists. Close: state that `heldDiff` and the Search reader stay hand-written in the current style with `against` and `under` added, and that the orchestrator adds them to Q85b's schemas at the second landing (the note `orchestrator-state.md:56` already says so); correct the path; drop the `DESIGN.md:148` citation for state code.

P6. Two `MAX_UPLOAD_BYTES` exist: server `content/memories.ts:49` and page `state/life/memories.ts:32` (a test equates them, `memories-message.test.ts:74`). Item 1 says "the page checks `MAX_UPLOAD_BYTES`" without saying which; a third copy duplicates a rule, and importing `state/life` from `state/sources` ties the Files upload to the Memories wall. Both are documented as the Memories picture limit. Close: name one shared constant and its home. The body cap itself is sound: `BODY_LIMIT_BYTES = ceil(32 MiB * 4/3) + 64 KiB` (`memories.ts:59`).

P7. `Escape`-to-cancel-cut and other VS Code key facts are in Cases and checks (C2).

## Cases and checks

C1 (**must fix**). Paste is misstated. Item 7 and Case 27: "Paste (when the clipboard holds something; disabled is not drawn, the item is absent, as VS Code's `when` hides it)". `fileActions.contribution.ts:559-567` registers Paste with `when: ExplorerFolderContext` and `precondition: ContextKeyExpr.and(ExplorerResourceWritableContext, FileCopiedContext)`: it is always drawn on a folder and disabled without a clipboard. Close: Paste always on a folder and root row, `disabled: true` without a clipboard (and on a folder that is not writable); Case 27 asserts the disabled item, not an absent one.

C2 (**must fix**). Item 10, Case 36: "F2 renames ... as VS Code's Explorer keys on macOS". `fileActions.contribution.ts:51-60`: `primary: KeyCode.F2, mac: { primary: KeyCode.Enter }`, so on macOS rename is Enter (F2 inside the open input cycles the selection, `explorerViewer.ts:1118-1131`). Enter in oculus's tree opens a file (`HELP.md:111`), so VS Code's mac key clashes with an existing oculus behaviour: that is a rule clash to put to Axel, not for the builder to settle. Keys the brief omits: plain Delete is the mac secondary of move-to-trash (`:63-74`), Cmd+Alt+Backspace deletes permanently (`:76-86`), Escape cancels a cut (`:128-134`), Cut and Rename need a writable item. Close: list the exact keys with the Enter clash as an open item with options.

C3 (**must fix**). Name rule. Decision 4 and item 1 say the rule "follows VS Code's `validateFileName`" but refuse "an empty segment". `fileActions.ts:714-770`: whitespace-only is empty; trailing `/` and `\` are stripped; `coalesce(name.split(/[\\/]/))` drops empty segments, so `a//b` and `a/` are valid; `\` is a separator; every segment must be a valid basename (a `..` segment is invalid); a leading `/` or `\` is refused; length is limited. The brief's list ("is `.` or `..`") covers only a whole-name `..`, so `../x` and `a/../../b` pass it, and Case 4 tests neither. With `path` resolved and `name` appended afterwards, `create` of `../../x` in `dir` escapes the root unless a final containment check exists, which is not stated. Close: define the rule per segment (`.`/`..`/NUL invalid per segment, empty segments dropped as VS Code does or refused with a stated reason), add a containment check of the final parent chain by realpath, and add cases `../x`, `a/../../b`, `a\b`, `'  '`, `a/`, a 256-byte name.

C4 (**must fix**). Delete words. Item 9 says "Are you sure you want to delete '{0}'?" with "You can restore this file from the Trash." and for a folder "...this folder and its contents?". VS Code (`fileActions.ts:214-250`, `getMoveToTrashMessage`): folder message is "Are you sure you want to delete '{0}' and its contents?", the detail is always "You can restore this file from the Trash.", and a symlink to a folder uses the file message. The permanent question is not "Delete '{0}' permanently?" but "Failed to delete using the Trash. Do you want to permanently delete instead?" with button "Delete Permanently" and detail "This action is irreversible!" (folder) or the Undo line (`:222-231`). The replace question (`fileActions.ts:489`) has no detail on paste; on upload (`fileImportExport.ts:864-866`) it adds "This action is irreversible!". The dirty warning is "Your changes will be lost if you don't save them." (`:120`). Close: quote the strings and their line numbers in the brief.

C5 (**must fix**, orchestrator decision). Find in Folder on a root. `search...searchActionsFind.ts:265-300` (file `searchActionsFind.ts`): Find in Folder shows on `ExplorerFolderContext`; Find in Workspace only on `ExplorerRootContext && ExplorerFolderContext.toNegated()`. `explorerView.ts:682-685` sets `folderContext = stat.isDirectory` (true for a root row). So in the source a root row offers Find in Folder..., and Find in Workspace is the empty-area item. The brief and Q88's menu give a root Find in Workspace and a folder Find in Folder. The parity file (`:207-232`) says "a folder / a root", the source says otherwise. Close: put to the orchestrator: root rows offer Find in Folder... (whole root, `under: ''`), or keep the Q88 choice with the reason.

C6. Compare conditions. `fileActions.contribution.ts:517-536`: Select for Compare and Compare with Selected are hidden when exactly two rows are selected (`WorkbenchListDoubleSelection.toNegated()`); Compare Selected shows only then. Item 7 and Case 27 lack the hiding. Close: add to item 7 and Case 27.

C7 (**must fix**). `trash` library behaviour the brief does not account for. From `npm pack trash@10.1.1` (index.js, lib/macos.js, lib/chunked-exec.js, read in the scratchpad):
- `const {glob = true} = options`: each argument is a glob pattern by default, so an absolute path containing `* ? [ ] { } ( ) !` trashes every match as well (a file `/root/a*.md` takes `/root/ab.md`). The brief's `trash?: (paths: string[]) => Promise<void>` hides the options; the default adapter must pass `{ glob: false }`.
- Missing paths are ignored silently (`ENOENT` skipped), so a vanished path "succeeds".
- macOS runs `macos-trash` in chunks (`chunkedExec`, 1000 paths): an error on one path leaves earlier paths trashed, so "nothing was removed" (item 1, `no_trash`) is false for a list.
- No typed "no Trash" error exists. `macos.js` falls back to moving into `~/.Trash` or `<cwd>/.Trash` when the message contains "couldn't be moved to the trash because you don't have permission" or `TRASH_FALLBACK=1`. The mapping to `no_trash` is undefined, and Case 11's "the no-Trash error" is whatever the test fakes.
Close: call per item; pass `{glob:false}`; define the error-to-refusal mapping (VS Code treats any trash failure as "ask to delete permanently"); add a case with a file literally named `*.md` beside `a.md` and a test where the library function is the injected parameter (a spy asserting options `{glob:false}` and exact absolute paths), so the default adapter is exercised without the real Trash.

C8 (**must fix**). Upload `replace` through a symlink. Item 1: "a path that is a symbolic link is acted on as the link". `writeBytesAtomic` goes to `writeAtomic` (`json.ts:93-97`) and `writeFileAtomic.sync`, which does `fs.realpathSync(filename)` (`node_modules/write-file-atomic/lib/index.js:189`), so replacing a taken name that is a symlink writes at its target, possibly outside the root. Case 19 does not cover it. Close: on `replace`, remove or trash the taken item first and write a fresh file, or refuse a symlink; add a case with a symlink to an outside file.

C9. Case 20 and the `protected` rule. (a) Via root `engine`, `path: ''` is the root's own folder: `root` or `protected`? Order is not stated. (b) Ancestors reached through the hub root (`tools/oculus`, `tools/oculus/config`), the file reached through a symlinked path, and a copy of the `config` folder (which would duplicate local.yml) are not cases; the brief says "or holds" but tests only the folder. (c) A symlink that points at local.yml: acting on the link is harmless, but a realpath comparison refuses it; the expected answer is not stated. Close: state precedence (`root` before `protected`), add cases for `tools/oculus`, `tools/oculus/config`, `engine:local.yml`, `engine:''`, and a symlinked route, plus the P2 decision.

C10. Case 7 (rename `a.md` to `A.md`): passes trivially on a case-sensitive volume; on APFS assert the name through a directory listing (`readdir`), not `existsSync`, and add a different-file collision (`a.md` to `B.md` when `b.md` exists: `exists`).

C11. Case 24 (compare): does not assert `oldPath`, `newPath`, `head`, `encoded`; two files at the same path under two roots give identical headers. And the Diff pane shows the answer's `error` verbatim: `Diff.svelte` `load()` sets `failure = body.error` when it is a string (lines ~190-196), so `protected`, `missing`, `too_large` would reach the reader as wire words, against item 1's "never the wire word". `Diff.svelte` is 530 lines (limit 540). Close: set the fields in the brief, add a case for the diff pane's refusal sentence, and map the words in `files.yml`.

C12. Spec compliance. `spec.md:56-57`: behaviour needing a DOM is seen at the look; the unit suite renders strings. Cases 32, 33, 36 and item 8's input behaviours (Enter, blur, Escape, selection) need a DOM; they pass only as audits, and Cases 30 and 31 over fake stores pass without `Tree.svelte`/`Files.svelte` wiring. `spec.md:59` requires every asynchronous path exercised "in flight, after close, and superseded by a later one" and ids empty, duplicated and colliding; the brief has no such case (an answer landing after the tab closed, two pastes in flight, a second operation during the first). Close: name those cases as audits with the look list (create, rename, delete to the real Trash of a scratch file, paste, upload, compare on TEST), and add the async cases.

C13. Case 15 covers move only. VS Code throws "File to paste is an ancestor of the destination folder" for copy as well (`fileActions.ts:1191-1193`); item 1 says into_itself for any paste. Add the copy case. Case 23 (two creates together) passes without the chain if `create` uses an exclusive open; make the first operation slow by injection if the chain is the subject. Case 18 asserts link-ness, not the target after the copy lands in another folder (`verbatimSymlinks` keeps a relative target string, so a copied relative link points somewhere else); state the expected result.

C14 (lazy-option candidates for the orchestrator). Decision 6 omits keybinding hints for lack of a `MenuItem` field, and "Do not ask me again". Extending the shared `MenuItem` (one optional field) is the option that ends the cause; the omission is the cheaper one. VS Code's menu draws the key beside Cut, Copy, Paste, Rename, Delete.

## The question

"Could this pass without the goal (the Files view's right-click menu offering VS Code's file operations, working on disk, safely under the served roots)?"

- Cases 1-23 test `ops.ts` directly with a faked trash. They pass with no menu item, no `Tree.svelte` wiring and no `ClientState` store, so they cannot show the menu reaches them. Case 10 passes with an adapter that globs (C7).
- Case 11, 14, 32: pass with whichever error mapping the builder chose, since the fake defines the error.
- Case 20: passes with a check on the literal path only (misses the hub-root routes, C9).
- Case 27 (menu items) passes while `Tree.svelte` never supplies the clipboard or selection facts to `rowFacts` (the call is `rowMenu(rowFacts(row, fixed, onaddroot !== undefined), t)`, `Tree.svelte:261`); Paste would never appear and the case stays green. Close: make `rowFacts` take the store state and test it.
- Cases 30, 31, 33, 35: pass over fakes with no component wiring; 31's fake must enumerate instances, the real enumeration is unspecified (see I7).
- Case 34 passes without the diff pane drawing the comparison.
- Case 36 passes by testing a key map; it does not press a key (C12).
- Case 26 passes with a lexical-only `under` check, which is the actual hole (I9).
- Items 1-12 as a whole: nothing in Cases moves a scratch file to the real Trash or drives a menu. The goal is proven only by the landing look; the brief should list it (right-click a scratch file in a scratch root on TEST, Delete, find it in Trash) as the step's before/after.

## Implied inputs

Each is missing from Cases. Expected result is my recommendation, to be set in the brief.

I1. A name that is `*.md`, `[a].md`, `{a,b}`, `!x` under `trash`: trashed exactly, nothing else (C7).
I2. A name with a trailing dot or space, `a.`, `a ` : valid on macOS; create accepts, the page warns for whitespace; the server accepts.
I3. A name of 256 or more bytes: `ENAMETOOLONG` has no word in the closed union; give it `invalid_name`.
I4. Names that differ only in case (`README.md` when `readme.md` exists), or in Unicode normalisation (NFC vs NFD): `exists`, decided by the file system.
I5. `create` with `a.md/b.md` where `a.md` is a file: `exists` or `invalid_name`, not a raw `ENOTDIR` as `denied`.
I6. A root whose folder is gone: `resolveRootPath` returns `outside` when `realPath(root.dir)` is null (`files.ts:109-111`); the page would say "outside" for a missing root. Expected `missing` and the matching sentence.
I7. A file open in a source tab with a draft when it is renamed or moved: the tab is restated and keeps the draft (VS Code keeps a dirty editor). The draft is bound to the file it was read for (`source.svelte.ts:59`), so a restate to a new path may drop it; and no brief text enumerates which views' states hold a path (source, file, diff, merge ...) or the API that lists instances (`layout.restateInstance(id, state)` restates one instance only). Also a tab on a file that is trashed or deleted: state the result (close when clean, keep with the draft when dirty). Also Files tabs' `expanded` and `selected` keys and bookmarks naming a renamed or deleted path.
I8. The engine root reached through a symlink, or `tools/oculus` symlinked into the hub: protected by realpath, see C9.
I9. Find in Folder: `under` a symlink to a folder outside the root. `refusalOf` is lexical. Checked: in a scratch tree (`ln -s <outside> link`), `rg --json ... --regexp hello ./link` printed `./link/o.txt`, a match outside the root. Also `under` of a missing folder: ripgrep exits with "IO error ... No such file or directory"; `under` a file: searches the file; `under: node_modules` or a gitignored folder: searched despite `SKIP_GLOBS` (printed `./node_modules/a.txt`, `./ign/b.txt`); `under: .hid` : searched, though a whole-root search does not open it (`./.hid/x.txt` printed). Expected: refuse a symlinked or non-folder `under` on the server with a realpath check, and say what node_modules and hidden folders do. Also the root dropdown: changing the root must clear `under` (it belongs to the old root); `setSearchState(.., { root })` in Find in Workspace (`row-menu.ts:183`) merges over the old state (`search.svelte.ts:60`), so a later Find in Workspace keeps a stale `under`: it must reset `under: ''`.
I10. A paste whose source was deleted after Cut: `missing`; clipboard kept or cleared (VS Code clears cut state in a `finally`, `fileActions.ts:1263-1267`). Partial multi-item failure: items before the failing one stay; the answer lists `paths` done and the failed one. A cut paste answered `exists` and cancelled: clipboard stays.
I11. `replace` on a volume with no Trash, or when the taken item cannot be trashed: the refusal (`no_trash`) path for paste is unspecified.
I12. Create or paste of a hidden or ignored name (`.env`, `.git`) while the `hidden`/`ignored` toggles hide it: created, no row, source tab opens, no error; re-read every toggle form of the folder (the store has `relist` only for all folders, `fs.svelte.ts:315`; a per-folder re-read is new and `fs.svelte.ts` is in Paths).
I13. Writable: `FsEntry` is `{name, kind, size, mtime}` (`fs.ts:53`), no writable flag. Cut, Rename, Upload and Paste "writable only" have no source; either add a listing field (server `fs.ts`, wire shape) or always offer them and answer `denied`.
I14. Upload: a name holding `/` (a crafted request): `invalid_name`, no folders made; `data` not base64: a refusal word (none in the union); an empty file (0 bytes): accepted (VS Code uploads empty files; `memories.ts:135` rejects empty, do not copy it); `replace` over a folder: refuse; a file whose size is over the cap: `too_large` by the page.
I15. Rename `dir` to `dir/sub/x` (a `/` in the name moves it into its own subtree): `into_itself`.
I16. Compare a file with itself, or with a selected file that has been deleted or renamed since: empty diff; `missing`.
I17. A long copy holds `chained(server.fsWrites, ...)`, the chain `/api/fs` uses for workspaces, bookmarks and notes (`fs.ts:578`), blocking those writes for the copy's duration; use a chain of its own or state the cost.
I18. `trash` or `delete` of paths `['dir', 'dir/a.md']` or duplicates: dedupe (the library drops nested paths); empty `paths` or `items`: `invalid_name`-class refusal or ok, stated.
I19. Case-sensitivity of the page's taken-name check (from the listing) against the server's (from the disk): the server decides, the page only warns.

## ADRs

`ls docs/adr tools/oculus/docs/adr` prints "No such file or directory" for both (from `/Users/axelfaes/workspace/research-hub`). `grep -n "adr" orchestrator-state.md` prints nothing. None.

## Folder limits

- Command: `git ls-files -co --exclude-standard -- src tests utils config | awk ...` (the folder-check.sh counting) lists folders at 10: `src/lib/server/files`, `src/lib/state/sources`, `tests/state/sources`, also `src/lib/data/helpers`, `config/text/views/sources`, `tests/views/sources`, `tests/server`, `tests/state`, `tests/checks/tree`, `tests/state/sources/repositories`, `tests/data/sources`. The brief's three are full: confirmed.
- `tests/checks/tree/size.test.ts` enforces two things: the file size rule (900 lines, 540 for `.svelte`, with the allow list `utils/size-allow.txt`, which has no entries: `grep -v "^#" utils/size-allow.txt` prints nothing) and, by running `utils/folder-check.sh`, at most ten items per folder under `src`, `tests`, `utils`, `config`, counted over `git ls-files -co --exclude-standard`, a subfolder counting as one item. `sh utils/folder-check.sh` and `sh utils/size-check.sh` both exit 0 at head.
- The brief's moves are sufficient for these: `src/lib/state/sources` (file-type.ts out, `explorer/` in: 10), `tests/state/sources` (explorer.test.ts out, `explorer/` in: 10), `src/lib/server/files` (ops.ts goes to `fs/`: 2 to 3, `server/files` stays 10), `src/routes/api/(files)` 6 to 7, `views/sources/files/tree` 7 to 9, `src/lib/data` 8 to 9, `tests/server/files` 5 to 6. Needed: yes. The `explorer/` test folder is named for the new module but `explorer.test.ts` tests `state/sources/fs.ts` (its header, lines 1-3); a mismatch to note.
- Not sufficient (**must fix**):
  - `src/lib/views/sources/files/Files.svelte` is 538 lines against the component limit 540 (`size.test.ts` `COMPONENT = 540`); the three Confirm blocks, the pending-name state, the keys and the cut look all land in or beside it. The brief names no extraction. Close: name a new component or module for the questions (for example a file under `views/sources/files/`, which holds 4 items) and keep Files.svelte under 540.
  - `Diff.svelte` is 530 (limit 540): the compare label and refusal sentence must go to a partial.
  - Tests: `tests/views/sources/files/files.test.ts` is 886 of 900 and `tests/state/sources/repositories/repositories.test.ts` is 880 of 900, both in Paths; `tests/state/sources/repositories/` is full (10 files), so a new test there is a new file that breaks the limit; `heldDiff` tests belong in `diff-view.test.ts`. Close: say so.
  - `config/text/views/sources` is full: no new words file; the Files words go in `files.yml` and the Search scope line in `search.yml`.

## Declined to judge

- Whether VS Code on vscode.dev behaves as `fileActions.contribution.ts` says: I read the source at e4f7a6f2 only; I did not open vscode.dev.
- Real `trash` behaviour on this machine, on a volume without a Trash, and whether `macos-trash` runs under the built server: not run (moving to the real Trash is outside this check; `npm pack` and reading its source only). Node here is 24.21.0, macOS 15.6.1.
- Whether `write-file-atomic` 8.0.0's `.sync` follows a symlink on every path: read `lib/index.js:189` only; not run.
- Whether `ui/tree/VirtualRows.svelte` can draw a pending input row: read neither it nor `TreeView` fully, so N5's list of UI files is a lead.
- Whether the Z151 closures (automode) are the right ones; the decisions list is Axel's.
- `tests/routes/files/search.test.ts` was not read for literals of `SearchQuery`; grep it when closing N2.

Usage: one session, about 80 tool calls; the token counter moved from 15,000,000 to about 14,700,000 (about 300,000 tokens); wall time not measured. Files written: none under the repository; scratch files only under the scratchpad directory.

## Closed

Every finding is closed by a change to `agents/briefs/Q88b.md`; the user-visible ones are in Z151 (automode), widened to Decisions 1 to 11 in `plan.md` Rulings, the state file and `choices.md`.

- N1: `menu-words.test.ts` added to the paths; item 8 says it passes the facts that give each builder its most items.
- N2: item 6 names `SearchRefusal`, `REFUSALS`, `refusalWords`, `refused_outside`/`refused_missing` in `search.yml`, `emptyQuery`, `queryOf`; `tests/data/helpers/search.test.ts` in the paths; case 30.
- N3: case 29 and the paths name `open-program.test.ts`, `open.test.ts` and `open-fixture.ts`; `open-bin.test.ts` removed.
- N4: item 15 and the paths name `DESIGN.md:148,376,378,379,383,401`, `json.ts:52-56` and `HELP.md:3,43,111,160-166`; the wrong `:382` is gone.
- N5: `context.ts` (the explorer store), `shared/stores/shapes.ts` (`WritesStore`), `fs.ts` (pending name, `treeRows`, the sentence at 2), `ui/tree/TreeItem.svelte` (one prop if needed), `allow-duplication.txt:154`, the moved file's own imports and `docs/diagrams/` added to the paths and items 7 and 9.
- N6: no change.
- S1: no change. S2: item 12 builds the upload flow over `FileChooser` and the Memories base64 reader, moved to a shared place; case 42. S3: no change (the goal is the step line and Z52). S4: Z151 says Decisions 1 to 11 in all three files.
- P1: the files-channel premise reworded (the engine root and ignored folders get no message); item 7 re-reads every changed folder.
- P2: `localRefusal` described as a text check; `protected` is Decision 9, with what it guards and why the compare is allowed.
- P3: refusal order stated (`root` before `protected`); case 24 covers `engine:''`, the hub routes and a link.
- P4: `TEXT_LIMIT` moves to `data/file-ops.ts`, used by the compare (item 3).
- P5: item 4 and item 7 say the state readers stay in the current style and Q85b's landing converts them; the `DESIGN.md:148` citation is the server route's only.
- P6: one `MAX_UPLOAD_BYTES` in `data/file-ops.ts`, imported by both memories modules (item 1).
- C1: Paste always on folder and root rows, `disabled` without a clipboard (item 8, case 31).
- C2: the keys move to X3a (Decision 8), with the Enter clash booked on X3a's line in `plan.md` for its /spec to raise to Axel.
- C3: the name rule is VS Code's per segment with a real-path containment check of the final parent (items 1, 2); case 4 adds `../x`, `a/../../b`, `\a`, whitespace, and 256 bytes; case 2 adds `\`, `//` and a trailing `/`.
- C4: item 11 quotes VS Code's words with their lines.
- C5: Find in Folder on every folder row, a root's included, and the root's Find in Workspace goes (Decision 10).
- C6: Select for Compare and Compare with Selected hidden at `selection: 2` (item 8, case 31).
- C7: one call per path with `{ glob: false }`, any failure `trash_failed` with `done` and `failed`, asking to delete permanently as VS Code does (item 2); cases 11 to 13 with a spy standing in for the library.
- C8: upload `replace` trashes the taken item and writes a fresh file, refusing a folder (item 2); case 23.
- C9: refusal order and the protected routes (item 2, case 24).
- C10: case 8 asserts by `readdir`; case 7 adds the `B.md` collision.
- C11: the compare answer's fields are set (item 3, case 28); the pane says a refusal as a sentence through a module beside `Diff.svelte` (item 4, case 41).
- C12: the DOM behaviours are named audits for the landing's look on TEST, with the step's before and after; case 36 adds the answer after close and two pastes in flight.
- C13: case 17 adds the copy into itself; case 27 holds the chain by an injected slow step; case 20 states the relative link's target string.
- C14: the keybinding hints go with the keys to X3a (Decision 8), where they first have keys to show.
- I1: case 12. I2: case 4 (`' a.md'`, `'a.'` created). I3: `ENAMETOOLONG` and a 256-byte segment are `invalid_name`. I4: case 3. I5: `not_a_folder`, case 6. I6: a gone root is `missing`, case 5. I7: item 10 (restate with the draft kept, bookmarks and the Files state following, a trashed file's tab kept open); case 35. I8: case 24 by real path. I9: item 6 (a real-path check, a missing or file `under` is `missing`, an explicit folder searched whole and HELP saying so, a root change clearing `under`); cases 30 and 40. I10: item 2 (`done`, `failed`), item 7 (clipboard rules); cases 21, 34. I11: case 16 (`trash_failed` on replace). I12: item 7 re-reads every toggle form of the folder. I13: Decision 11. I14: case 22. I15: case 10. I16: case 28. I17: `opsWrites`, a chain of its own (item 2). I18: case 11 dedupes; case 25 empty lists. I19: item 9 (the page warns, the server decides).
- Folder limits: the questions go to a new component beside `Files.svelte`, the compare sentence to a module beside `Diff.svelte`, verify 5 checks both sizes; new tests beside `files.test.ts` in a new file and `heldDiff` in `diff-view.test.ts`; words in the existing `files.yml` and `search.yml`.
