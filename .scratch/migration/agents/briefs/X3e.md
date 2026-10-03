# Brief: X3e, the Files view's lists reordered by drag as VS Code's (the roots, the folder bookmarks, the notes and the view's sections), a second Collapse Folders press closing the roots, and the Repositories view finding repositories nested under every root to a configured depth

Read `tools/oculus/.scratch/migration/agents/spec.md` first; its rules govern this step unchanged. The plan names no further standards. No ADR touches the step: the repository has no `docs/adr` folder and the configuration block has no `adr:` key (`ls docs/adr` fails; `grep -n '^adr' .agents/plan.yaml` prints nothing).

A design ruling decides what is built. It never exempts the code: every line is written to the standards pages, so that people can read, use and maintain it.

## The plan line and the rulings

"X3e the Files view's lists reordered by drag as VS Code's: the roots (written to the workspace in force, `sources.yml` for the default one), the folder bookmarks (written to `~/.oculus/bookmarks.yml`, the rail menu following), the notes and the view's sections; a second Collapse Folders press, with no folder under a root open, closes the roots, as VS Code's `collapseAll` does (Axel 2026-10-02; brief at dispatch) (ruling Z263)" (`plan.md:188`).

- Z263 (a) (the user): the new step X3e, the roots, folder bookmarks, notes and sections reordered by drag, a second Collapse Folders press closing the roots.
- Z269 (b) (the user): nested repositories found by a scan one level deep under each root, with a setting for the depth, folded into X3e. Premise corrected: the step's line did not carry this part or its tag; `plan.md:188` now does.
- Z284 (the orchestrator, automode): the choices this brief takes below (decisions 1 to 6).

## Carried into this brief before dispatch

These widenings of the step's line in `plan.md` were booked after this brief was written. Before the builder is launched, each becomes an item under "What to build", its cases under "Cases" and its files under "Paths this step writes", with its premise checked on main's head; each defect's full look record is in `agents/reviews/owed-looks.md` under its id.

- Widened 2026-10-02 (Z289, the orchestrator, automode): the Files tree follows the disk (X3a-1), the breadcrumb row pushes no row (X3a-2), a deleted file's tab is marked (X3a-3), the folder-panel line clears (X3a-4), a Changes row shows its folder in Files (X3a-5), removed roots leave the tree (X3a-6), long paths show the file name first (X3a-7); the Source Control defects Q88c-1 to Q88c-14 and Q88c-19 to Q88c-22, a single click opens a text file (D27-3), a changed row offers Open File (D13a-5) and a click on it opens the diff (A1-4); the hub's Graph draws its count and rows without a 10 s wait at 0.
- Widened 2026-10-03 (Z311, the orchestrator, automode): Cmd+A in a tree selects its rows, as VS Code's `list.selectAll`, and no longer the page's text (Q82-look-1: in the Repositories changes tree it selected 121598 characters across every pane and no row); Cmd+Enter on a row opens it to the side, as VS Code's `list.openToSide` (Q82-look-2: on a staged change it opened nothing). Files: `ui/tree/TreeView.svelte`, `ui/tree/tree-keys.ts`.


## What is on the tree (read on main at a9c0d38d)

All paths below `tools/oculus/` unless they start with `.agents/`.

- **The roots.** The Files view's roots are `browserRoots` (`server/files/roots.ts:24-35`): the fixed two (the hub, the engine's config folder), then the configured roots of `config/sources.yml` `roots:` (`config/sources.yml:96-102`, six flow maps, column-aligned), then a named workspace's own roots from `~/.oculus/workspaces.json` (`server/files/fs.ts:245-256` `workspaceRoots`: fixed ones first, `fixed: true`; the workspace's own after, `fixed: false`). The default workspace's list is edited by `server/edit/writes/config/roots.ts` (215 lines; actions `add` and `remove`, body `rootsShape` at `server/edit/writes/bodies.ts:268-269`, over the bytes through `list-edit.ts`'s `setItems`); a named workspace's by `POST /api/fs` actions `add-root`, `remove-root`, `save-workspace` (`fs.ts:590-592`), the file written whole and atomically on a chain.
- **The bookmarks.** A collection file at `~/.oculus/bookmarks.yml` (`server/files/fs/bookmarks.ts`), resolved by `entries.ts` under the key `bookmarks` (`entries.ts:40`, `:60-62`). The `reorder` write exists (`bodies.ts:193-197` `{ kind: 'reorder', collection, order }`, `entries.ts:443-470` `reorderCollection`, undoable as `reorder`, `writes.ts:375-384` passes the bookmarks file as `own`; `writeReorder` in `state/client/writes.svelte.ts:297`). The rail's foot draws a menu of the bookmarks by name (`shell/rail/RailFoot.svelte:4-12`, `bookmarkChoices`), in the file's order.
- **The notes.** One `<id>.md` file per note under `~/.oculus/notes/` (`server/files/fs/notes.ts`, 125 lines; `NOTE_SUFFIX = '.md'` at `:28`); `listNotes` lists them newest first by modification time (`notes.ts:88-104`); a file without the suffix is not listed. Actions `note-save` and `note-delete` on `POST /api/fs` (`fs.ts:587-588`).
- **The sections.** `views/sources/files/sections/Sections.svelte` draws Open Editors above the tree and Outline, Timeline, Bookmarks and Notes under it in a fixed order; which are open is the tab's instance state (`state/sources/explorer/sections/section-state.ts`, `collapsed` and `opened`, `STARTS_CLOSED = ['editors', 'outline', 'timeline']`).
- **Collapse Folders.** `views/sources/files/control/tab-actions.ts:94-102` `collapseAll` closes every folder under the roots shown and leaves each root's own row open; a second press does nothing more.
- **Drag in the tree.** `state/sources/explorer/acts/drop.ts` (96) decides a drop of files and folders; a root's own line takes no move (`:44`). The board's drag reorder is `views/boards/collection/Collection.svelte:186-212`: `drop` and the keyboard `carry`, both through `movedOrder(order, at, to)` and one whole-order write.
- **Nested repositories.** `server/root/watch/git.ts:143-155` `subrepositories(root)` lists the direct subfolders holding a `.git`, and returns nothing for a root that is itself a repository (`:144`). So `~/workspace/research-hub/theaxec.github.io` (a repository inside the hub, `find . -maxdepth 3 -name .git` from the hub prints `./theaxec.github.io/.git`) is never on the `git` channel and never in the Repositories view.
- Folder sizes (`git ls-files <dir>`, first segment, `sort -u | wc -l`): `views/sources/files/sections/` 8, `state/sources/explorer/acts/` 8, `state/sources/explorer/sections/` 6, `server/files/fs/` 7, `server/root/watch/` 6.

## What to build

1. **One reorder rule** (`state/sources/explorer/acts/reorder.ts`, new, pure, under 150 lines): the place a dragged item lands among its siblings (before the row it is dropped on in its upper half, after it in its lower half), `movedOrder` reused from `state/boards/collection.ts:437` (the drop rule computes the target index and hands it that function), and the keyboard path (Alt+Up and Alt+Down on a focused row, VS Code's move keys for a list) through the same function. Each list below draws the drop line between rows while a drag is over it.
2. **The roots reordered.** A root row dragged onto another root row reorders the roots:
   - In the default workspace the configured roots move among themselves, written to `config/sources.yml` `roots:` by a new action `order` of the `roots` write (`{ kind: 'roots', action: 'order', keys: string[] }`), over the bytes through `setItems` (each item keeps its text, its padding included), read back before writing, recorded for History and Undo as the add and remove actions are.
   - In a named workspace its own roots move among themselves, written to `~/.oculus/workspaces.json` by a new `POST /api/fs` action `order-roots` (`{ name, keys }`) on the same chain as `add-root`.
   - The fixed roots (the hub, the engine's config folder, and in a named workspace the configured ones) take no drag and no drop between them; a drag that would cross from one group to the other draws no drop line and writes nothing (decision 1).
   - A drop of files onto a root row keeps today's meaning (into that root); only a root row dragged onto a root row reorders.
   - The `order` keys must be exactly the current keys of the group in some order, else refused with a sentence of `config/text/server.yml`.
3. **The bookmarks reordered**: the Bookmarks section's rows drag, written through the existing `reorder` write with `collection: 'bookmarks'`; the rail's bookmark menu follows on the file's push. A filter or a missing file draws no drop line.
4. **The notes reordered**: the Notes section's rows drag; the order is kept in `~/.oculus/notes/order.json` (a JSON list of note ids, written whole and atomically on the notes' write chain by a new `POST /api/fs` action `note-order`), and `listNotes` returns the ids in that file in its order, then every note it does not name newest first, above them (decision 3); a deleted note leaves the file at its next write; an id in the file with no note is skipped. The file does not end in `.md`, so it is never listed as a note.
5. **The sections reordered**: the section heads (Open Editors, the tree's own head, Outline, Timeline, Bookmarks, Notes) drag among themselves, the order kept in the tab's instance state as `sections: string[]` beside `collapsed` and `opened` (decision 4); an order that misses a section or names an unknown one is read as the default order with the missing ones appended.
6. **The second Collapse Folders press**: when no folder under any shown root is open, the press closes the roots themselves (VS Code's `collapseAll` collapsing the workspace folders); a rooted or following tab (one head row) closes its head likewise.
7. **Nested repositories** (Z269): `subrepositories` scans every root, a repository root included, down to `repository_scan_depth` levels (a new key of `config/sources.yml`, default `1`, an integer from 0 to 3, 0 turning the scan off, with its catalog entry in `config/catalogs/options.yml` and its row in the Settings view), skipping links, the `IGNORED` names and a folder inside a found repository's own `.git`; a repository found is on the `git` channel and in the Repositories view after its root, as a subfolder repository is today. The rescan rules stay (at start, on a config push, on the workspaces file moving, on an event naming a top-level entry).
8. **Words and docs**: every new sentence a key of the text catalog; HELP.md's Files view and Repositories passages and DESIGN.md's lines on the roots, the notes and the git watcher updated.

## Cases

Reorder rule and roots (items 1 and 2):

- C1. `movedOrder` over the drop rule: dropping the third of five on the upper half of the first gives it first; on the lower half of the first, second.
- C2. The default workspace's roots `cathedra, game-engine, ordo, scotoma, officium, youtube-downloader` with `ordo` moved first: `sources.yml` holds the six items in the new order, each line byte-identical to before (padding kept), every other line of the file byte-identical; History lists it; Undo gives back the original bytes.
- C3. `order` keys missing one, holding one twice, holding an unknown key, or naming `hub`: refused, nothing written.
- C4. A named workspace with two own roots swapped: `workspaces.json` holds them swapped; the configured roots unchanged.
- C5. A drag of the hub row, or of a configured root in a named workspace, or across the fixed and own groups: no drop line, no write.
- C6. A file row dropped on a root row: moved into that root as today (a preserved behaviour).
- C7. Alt+Down on a focused root row moves it one down through the same write.

Bookmarks, notes, sections (items 3 to 5):

- C8. Two bookmarks swapped by the reorder rule: one `reorder` write with the new order; the rail menu's choices after the push are in the new order.
- C9. Notes `a`, `b`, `c` with `c` dragged first: `order.json` holds `[c, a, b]` (or the full order sent), the listing gives `c, a, b`; a new note `d` is listed first; a deleted `a` drops out; an `order.json` naming `zz` (no note) lists the others; an `order.json` that does not parse lists newest first; an id with a separator in `order.json` is ignored.
- C10. `order.json` is never listed as a note.
- C11. Sections: Notes dragged above Outline: the tab's `sections` holds the new order and the view draws it; a second tab keeps its own; a `sections` missing `timeline` draws the default order's timeline last; an unknown id is dropped.

Collapse (item 6):

- C12. With folders open, the first press closes them and leaves the roots open (a preserved behaviour); the second press closes the roots; a third press changes nothing.
- C13. A rooted tab: the second press closes its head row.

Nested repositories (item 7):

- C14. A scratch root that is a repository holding `site/.git`: `site` is found at depth 1; at depth 0 nothing is found; a repository at `a/b/.git` is found at depth 2 and not at 1.
- C15. A root that is not a repository holding `x/.git` (today's case): still found (a preserved behaviour).
- C16. A link to a repository, `node_modules/y/.git` and a folder under a found repository's `.git`: not found.
- C17. `repository_scan_depth: 4`, `-1` or `"1"`: refused by the config reader with a finding, the default used.
- C18. The hub with `theaxec.github.io/.git` (a fixture copy of that shape): the Repositories view's list holds it after the hub.

The builder's first task, before any change, is the first run of every case above on the unchanged tree, with each case's result noted. A case of a code step becomes a test of the step, run on the unchanged tree first; no prototype script stands in for the test. A behaviour that needs a DOM (a drag, the drop line, a key press) is seen at the look, and its test is stated over the pure functions and the writes.

When the first run finds a case the brief's own rules get wrong, the builder stops there, before changing any code, and hands back the first run and that case, with the rule and the result it gives. The orchestrator rules on the case and resumes the builder with the ruling, and the final report carries it.

## Paths this step writes

- `tools/oculus/src/lib/state/sources/explorer/acts/reorder.ts` (new)
- `tools/oculus/src/lib/state/sources/explorer/acts/drop.ts`
- `tools/oculus/src/lib/state/sources/explorer/sections/section-state.ts`
- `tools/oculus/src/lib/state/sources/explorer/view/files-view.ts` (the `sections` field of the tab's state)
- `tools/oculus/src/lib/views/sources/files/tree/` (`Tree.svelte`, `FileRow.svelte`, `control/dragging.svelte.ts`, `control/keyed.ts`)
- `tools/oculus/src/lib/views/sources/files/sections/` (`Sections.svelte`, `Section.svelte`, `Bookmarks.svelte`, `Notes.svelte`)
- `tools/oculus/src/lib/views/sources/files/control/tab-actions.ts`
- `tools/oculus/src/lib/views/sources/files/Files.svelte`
- `tools/oculus/src/lib/server/edit/writes/config/roots.ts`
- `tools/oculus/src/lib/server/edit/writes/bodies.ts`
- `tools/oculus/src/lib/server/edit/writes/undo.ts`
- `tools/oculus/src/lib/server/files/fs.ts`
- `tools/oculus/src/lib/server/files/fs/notes.ts`
- `tools/oculus/src/lib/server/root/watch/git.ts`
- `tools/oculus/src/lib/state/client/writes.svelte.ts`
- `tools/oculus/src/lib/state/sources/files.svelte.ts` (the notes order and roots order calls)
- `tools/oculus/config/sources.yml` (the `repository_scan_depth` key)
- `tools/oculus/config/catalogs/options.yml` (its entry)
- `tools/oculus/config/text/server.yml`, `tools/oculus/config/text/views/sources/files.yml`
- `tools/oculus/HELP.md`, `tools/oculus/DESIGN.md`
- `tools/oculus/tests/` (the tests of the cases)
- `tools/oculus/.scratch/migration/agents/reviews/X3e-report.md`

## Decisions taken in this brief (each reversible, none silent; booked as Z284)

1. Roots reorder within their group only: the hub and the config folder stay first, the configured roots move only where they are written (the default workspace's `sources.yml`), a named workspace's own roots only among themselves, since a saved workspace "can only ever add a root and never redirect one" (`fs.ts:22-25`) and the fixed roots are in no file a drag could write.
2. The roots' new write is an action of the existing `roots` kind (`order`), and the named workspace's an action of `POST /api/fs` (`order-roots`), so each file keeps one writer.
3. The notes' order lives in `~/.oculus/notes/order.json` beside the notes, a new note going on top, since a note is a file the reader can copy and the folder is this machine's.
4. The sections' order is the tab's instance state beside which sections are open, so two Files tabs can differ as they already do in what is open.
5. Alt+Up and Alt+Down move a focused row in each reorderable list, the keyboard path a drag needs.
6. The depth setting is `repository_scan_depth` in `config/sources.yml`, default 1, range 0 to 3.

## Libraries checked

`libraries: check` (`.agents/plan.yaml:15`). Drag and drop uses the browser's own events as the tree and the boards already do; the reorder reuses `movedOrder`; the scan is `readdirSync` as today. No library would replace code this step writes: none found. The builder adds no dependency.

## Read, with sections or line ranges

1. `src/lib/server/edit/writes/config/roots.ts` whole, `src/lib/server/edit/list-edit.ts` whole.
2. `src/lib/server/files/fs.ts:1-120` and `:230-300` and its action dispatch `:570-618`; `src/lib/server/files/fs/notes.ts` whole.
3. `src/lib/views/boards/collection/Collection.svelte:130-230` (the drag and keyboard reorder).
4. `src/lib/views/sources/files/sections/Sections.svelte`, `Bookmarks.svelte`, `Notes.svelte` whole; `state/sources/explorer/sections/section-state.ts` whole.
5. `src/lib/views/sources/files/tree/control/dragging.svelte.ts`, `state/sources/explorer/acts/drop.ts` whole; `control/tab-actions.ts` whole.
6. `src/lib/server/root/watch/git.ts:1-160`.

## What it must do

As "What to build" says, items 1 to 8. Every sentence a reader sees is a key of the text catalog; no sentence is written in code.

## Conventions

The rules file's. ASCII only in `src` and `tests`. Comments say what and why, never when or which step. Files under the size limit the checks enforce, folders under the item limit. Tests that touch `~/.oculus` set HOME to a scratch folder under `$TMPDIR`. The ledger is not written beyond the report.

## Verify before you report

Run from the worktree's root, each must hold, each output piped through the filter the rules file names:

1. The plan's verify list, run as `sh ~/.claude/skills/land/templates/checks.sh tools/oculus/.scratch/migration/orchestrator-state.md` from the worktree's root, prints `$ <command>` and the output of each command, then `checks: 7 commands passed`, and exits 0; the lines it prints are what the report quotes.
2. Each new or changed test of a behaviour the change adds or changes fails on the unchanged tree, in the form it has after its last change, and the report quotes that failure; each new or changed test of a behaviour the change preserves passes after the change and, where it can run there, on the unchanged tree, and the report quotes those runs. A test that would still pass with the behaviour it is written for taken out of the code is an audit, not a proof, and this brief says which it is.

Look items on landing (TEST, the orchestrator): a root, a bookmark, a note and a section dragged, with the drop line; Collapse Folders pressed twice; the Repositories view listing `theaxec.github.io`.

## Report

Write it to `tools/oculus/.scratch/migration/agents/reviews/X3e-report.md` in the worktree. First line: anything NOT done, or "Everything in the brief is done". Then the open items of the state file, verbatim. Then the cases' first run: each case with its result on the unchanged tree, and each case the brief's rules got wrong with the rule, the result and the orchestrator's ruling. Then the DONE / NOT DONE table with the checks above and their output verbatim. Then files with line counts, every judgment call the brief left open, every host- or user-visible change with its before and after, and anything in the brief that was wrong or impossible, with the evidence.
