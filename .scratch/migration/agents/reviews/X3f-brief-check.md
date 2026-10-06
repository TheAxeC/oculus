# Step X3f brief check (on main at ad51b1fdd)

`git rev-parse HEAD` printed `ad51b1fddf7a506d67d36519bf2af25e97a6baa4`. `git status --short tools/oculus/src tools/oculus/HELP.md tools/oculus/DESIGN.md tools/oculus/config` printed nothing, so main's tree under these paths matches the head. `.agents/worktrees/` is empty, so the base copy `X3f-base` does not exist yet; every read below was taken from the main checkout.

## 1. Names

- Open Preview names: `git grep -n "ROW_PREVIEW\|menu_preview\|Open Preview\|open_preview" -- tools/oculus ':!tools/oculus/config/local.yml' ':!tools/oculus/.scratch'` hits HELP.md:120, config/text/views/sources/files.yml:100, and row-menu.ts:69, :212, :268 and :492. Every hit is inside the write list.
- Importers of the modules the step changes: `git grep -n -l "explorer/opening\|control/pressing\|menu/row-menu\|sources/source/Preview\|StripActions\|sources/file/File\|document/Document\|doc/Doc\|tab-actions.svelte" -- tools/oculus/tests tools/oculus/utils tools/oculus/src`. No test file is among the hits. The hits outside the write list:
  - `src/lib/views/sources/source/Editor.svelte:29` imports `./Preview.svelte`, and its head comment at :25 names `(StripActions.svelte)`. Item 3 and the boundary rule (section 4) force Preview's rendering into `views/shared/`, so this import changes. The comment becomes false if StripActions moves to `views/shared/links/`. Editor.svelte is outside the write list.
  - `control/keyed.ts:17` and `control/picks.svelte.ts:19` import `row-menu`. They do not change unless `rowStores` gains a dependency.
  - `Files.svelte:83` imports `openBookmark` from `opening.ts`, which is unchanged.
  - `PaneView.svelte:63,126` uses `provideTabActions`, which is unchanged.
- `src/lib/views/shared/explorer/RootedTree.svelte:70` wires `onopen` to `void openRow(tree.opener, row, preview)`. It holds `keepPreview`, and Tree.svelte holds no `keepPreview`. If item 1 is built as written ("keeps the tab the press opened through the same keepPreview"), the opened id must reach the listener. That changes `openRow`'s return and `onopen`'s type, so this file must change, and it is outside the write list. The way that stays inside the list is for the listener to call `onopen(row, false)`, which is what the row's dblclick does: Tree.svelte:336-339 calls `onopen`, never `keepPreview` directly.
- Comments outside the write list that the change makes false:
  - `src/lib/state/workbench/layout/open/opening.ts:135-139` says "it is the path that holds when the first click has taken the tree off the screen and the second one lands on the tab the tree opened". The brief's own probe says the second press lands on the editor (the same claim the brief rewrites in HELP.md:167 and DESIGN.md:395). The file is outside the write list.
  - `ui/tabs/tab-actions.svelte.ts:1-8` (the source tab is named as an example) and `PaneView.svelte:36-38` stay true.
  - `layout/open/landing.ts:1-3`, DESIGN.md:378 and HELP.md:33 list the opened views. They stay true, since a preview of a file reads as "a file".
- Doc sentences in the write list that item 4 does not name:
  - DESIGN.md:427: "The active file tab's Save, Revert, star, Open in Program, Preview and Blame are drawn at the strip's right end ... (`views/sources/source/StripActions.svelte`, handed up through `ui/tabs/tab-actions.svelte.ts`)". This becomes false: the list grows by Open in a browser tab and Open Source, and the component moves.
  - DESIGN.md:391 names `views/sources/source/Preview.svelte` as the renderer. It becomes false if the rendering moves.
  - HELP.md:161 lists the prose surfaces ("a hub document, a project's document, this manual, or the preview beside a Markdown file in the source tab"). The new preview tab is one more, so the list becomes incomplete.
- `state/sources/explorer/follow.ts:110` (`followedFileTab`) follows only `source`, `file` and `document` tabs on a rename or move. A `markdown-preview` tab is not followed, and the file is outside the write list (section 6).
- `views/shared/prose/` (6 items) or another `views/shared/` folder must receive the shared Markdown rendering (section 4). No such path is in the write list.

Findings: the write list lacks `views/shared/<folder>/` for the shared rendering, `views/sources/source/Editor.svelte` (import and :25 comment), `layout/open/opening.ts:135-139` (a comment made false) and, depending on the build, `RootedTree.svelte` and `state/sources/explorer/follow.ts`. Item 4 does not name DESIGN.md:427, DESIGN.md:391 or HELP.md:161.

## 2. The step line

- `grep -n "^- X3f " tools/oculus/.scratch/migration/plan.md` gives line 192, which matches the brief's quote. Z418 is at plan.md:1128 and Z424 at :1134. The line carries `(ruling Z418) (ruling Z424)` (the Z424 tag is uncommitted, per `git diff`).
- How each part of the step line maps to "What to build":
  - (A) maps to item 1, with the docs in item 4.
  - (B) maps to item 2, with item 4.
  - (C) maps to item 3, with item 4.
  - "reproduces each on TEST and finds each cause read-only":
    - (A) was reproduced on TEST (tab 812137347), but the cause it cites is the wrong code path (section 3).
    - (B) was seen on TEST for the `.xlsx` file tab only. The document and doc tabs come from reading the code.
    - (C) has no TEST reproduction in the brief, only the citation of `row-menu.ts:492-493`.
- Z418 records Axel's report as "a double click on a file opens nothing". The brief reproduces "the file stays a preview tab" and does not reconcile the two.

Findings: (C) is not reproduced on TEST, so the step line's "reproduces each on TEST" is not met for (C). The Z418 wording "opens nothing" is not reconciled with the reproduced symptom.

## 3. Premises

- `pressing.ts:56` is wrong. `wc -l` gives 53 lines, and `grep -n "onopen(row, true)"` prints `pressing.ts:51`.
- These hold:
  - FileRow.svelte:130 `ondblclick={row.kind === 'file' ? () => onkeep(row) : undefined}`.
  - Tree.svelte:336-339 `onkeep` answers `onselect(one); onopen(one, false)`.
  - explorer/opening.ts:55-60 `openRow`.
- The cause citation is wrong. "A file opens into the pane holding the instance activated last (`layout/open/opening.ts:51-66`)" describes the tool-view path. `grep -A8 "export const registration"` shows `source`, `file`, `document` and `doc` all register with `group: ''`, so they take `openOpened` (opening.ts:121, :197-253), which lands where `landingFor` says (landing.ts:28-67). On the TEST page the landing is the Files view's own pane because the reader's pane holds a tool and already holds opened tabs (landing.ts:45-57). The brief's conclusion stands, but the mechanism it names does not. Decision 1's "(the pane activated last)" carries the same error.
- The TEST probe (the second press landing on the editor at 250 ms, and the tool's double clicks keeping the tab) was not rerun here, since this check drives no browser: not verified.
- HELP.md:167 and DESIGN.md:395: `sed -n 167p HELP.md` and `sed -n 395p DESIGN.md` both say the second click "lands on the tab and keeps it". This holds.
- Source.svelte:300-305: `useTabActions()` at :300, `untrack(() => handed?.set(...))` at :301, and `clear` in the effect cleanup at :302-305. This holds; the effect ends at :305.
- PaneView.svelte: `provideTabActions()` at :126 and `tabActions.of(active)` at :423. This holds.
- `grep -rn "useTabActions()" src/lib` prints `tab-actions.svelte.ts:50` and `Source.svelte:300`. This holds.
- StripActions.svelte is 95 lines and its conditions match. The decisions sit at Source.svelte:386-391 inside the `stripActions` snippet (:382-399), so the brief's ":385-401" covers them.
- File.svelte:193-205 is the `tools` snippet with the star, `file.open_outside` and `ProgramButton` under `openable`. This holds; the TEST sighting was not rerun.
- Document.svelte:117-126 is the `tools` snippet with `document.open_outside`. This holds.
- Doc.svelte is 121 lines with no controls, and `fileOfTab` is at pages.ts:360-366 returning `{ root: HUB_ROOT, path }`. This holds.
- These hold as well:
  - HELP.md:49 text.
  - row-menu.ts:268 (`facts.markdown`).
  - files.yml:100 (`menu_preview: Open Preview`).
  - row-menu.ts:492-493.
  - source.svelte.ts:111 (`rendered: z.boolean().catch(false)`).
  - source.svelte.ts:164 (`/api/file/`).
  - Preview.svelte: 79 lines, with `FRONT_MATTER` and `blockMarkdown`.
- `src/routes/views.ts:43` globs `$lib/views/**/*.svelte`. This holds.
- Folder counts from `git ls-tree --name-only HEAD <dir>/ | wc -l`: `views/sources` 10, `source/` 10, `doc/` 1. These hold. Decision 3's "the one folder of `views/sources/` with room" is false, since `file/` and `document/` also hold 1 item each.
- Line counts: Source.svelte 502 and File.svelte 319. These hold.
- `grep -n -i "preview\|tab-actions\|row-menu\|opening" agents/guarded.md` prints nothing (exit 1). This holds as a grep. The conclusion "no entry covers this code" is incomplete, though: G12's Code line is `config/` and `config/catalogs/` (guarded.md:68-69), and the step writes three or four files under `config/text/`.
- Item 3's mechanism ("reads it again when the fs store's version of the file changes (a save from a source tab, a write on disk)") rests on a false premise. `git grep -n "\.bump(\|bump(" -- src` shows the only caller of `fs.bump` is `state/sessions/latex.svelte.ts:506`, the PDF rebuild. A source save does not move `fileVersion`, and nothing polls (fs.svelte.ts:12-19). The read that a save does refresh already exists: `fs.fileText` (fs.svelte.ts:497), whose query `['fs','text',root,key]` is marked on every source save by `fs.markText` (context.ts:329-331). It reads through `readText` with `cache: 'no-cache'` (fs-transport.ts:369-371), since the route lets a browser keep an address for a minute.
- `ls docs/adr tools/oculus/docs/adr` gives "No such file or directory" for both. This holds.

Findings:
- `pressing.ts:56` should be `:51`.
- The (A) cause cites the tool-view path (`opening.ts:51-66`) where files take `openOpened`/`landingFor`, and decision 1 repeats it.
- Decision 3's "the one folder with room" is false.
- The tests premise misses G12.
- Item 3's re-read rule names `fileVersion`, which a save and a disk write never move. The read to reuse is `fs.fileText`.

## 4. Cases and checks

- Item 2 offers "the source tab's `StripActions.svelte` widened". File.svelte, Document.svelte, Doc.svelte and MarkdownPreview.svelte importing `views/sources/source/StripActions.svelte` would break spec.md's "views/ imports no shell and no other view". `tests/checks/tree/boundaries.test.ts:181-190` (`ownPartials`: a view imports only `views/<group>/<name>/**`) and :138 (`views: ['ui/**', 'state/**', 'views/shared/**', ...]`) enforce it. Only the second option, under `views/shared/links/`, is legal.
- Item 3's "through `source/Preview.svelte`'s rendering ... may take a prop or be split" breaks the same rule when `views/sources/doc/MarkdownPreview.svelte` imports anything under `views/sources/source/`. The shared rendering must live under `views/shared/` (section 1).
- The brief's verify list cannot catch either import. `npm run test:quick` leaves out `tests/checks` (quick.mjs:22-23: "What a green run does not cover is printed with it: ... the tree checks under tests/checks"; essential.txt: "tests/checks is left to npm run test:checks"). The same holds for G24 (`file.toolbar` and `document.toolbar` become orphans when the views stop drawing their own Toolbar, and new keys are added), G20, G21, G22, G23 and G25.
- spec.md says "A step whose change touches an entry's code runs that entry's test". G12's test `tests/checks/config/config.test.ts` covers the catalog files written, and the brief neither names it nor runs it. The brief's "no test of guarded.md covers these behaviours" holds for behaviours, but the run requirement still applies.
- Case 5 (a PDF) and case 6 (an HTML file) conflict with item 1's mechanism.
  - The file view draws a PDF in `<iframe class="frame">` (File.svelte:238), and the document view draws HTML in a sandboxed iframe (Document.svelte:121-127).
  - In one pane the second press lands inside the frame's own document, and a click there never reaches the parent window. The window capture listener of item 1 never fires.
  - A PDF's kind comes from its name at once (`heldFileKind` "the name's answer for a format the browser draws"), so the frame replaces the tree without waiting for a read.
- Case 24 conflicts with item 3's mechanism (section 3): `fileVersion` does not move on a save. spec.md's "grep src and tests for its name and its key call and reuse what exists" points at `fs.fileText`.
- Case 11's "a later double click anywhere keeps nothing" conflicts with the strip, whose tab `ondblclick={(id) => keepPreview(id)}` (PaneView.svelte:432) keeps a tab on any later double click on its face. The case means the listener keeps nothing.
- spec.md requires "every asynchronous path in flight, after close, and superseded by a later one" to be stated. No case covers:
  - the preview tab's read in flight when the tab closes;
  - a press whose `openRow` is in flight when the Files tab closes.

Findings:
- Item 2's first option and item 3's import of `source/Preview.svelte` break the view boundary that `boundaries.test.ts` enforces, and the verify list does not run that check, `keys.test.ts` or G12's `config.test.ts`.
- Cases 5 (PDF) and 6 (HTML) cannot pass under item 1's window listener.
- Case 24 cannot pass under item 3's `fileVersion` rule.
- Case 11's wording is false against the strip's own double click.
- The async-path cases spec.md asks for are missing.

## 5. The question

- Cases 1, 2, 3, 4, 7, 9 and 10 cannot pass without the goal: each is a look at the outcome.
- Case 5: yes, it could pass without the goal, if the look uses a picture or the `.xlsx` and skips the PDF. The PDF is the input item 1 cannot handle (section 4).
- Case 6: it cannot pass under item 1 as written; a pass would need a mechanism item 1 does not describe.
- Case 8: yes. The capture listener on the window runs before the row's own click handler, so "removed on the next press of any row" comes too late in event order. The case passes only because the system does not count a press on another row 22 px away as the second click (not verified).
- Case 11: yes. The 500 ms timer removes the listener anyway, so "a later double click keeps nothing" passes even if destroy never removes it. The case needs the second press inside the window after the Files tab closes.
- Cases 12 to 17: yes. They pass on a tab opened fresh while the goal fails for a preview tab walked by single clicks.
  - A retarget keeps the instance id and swaps the view component (`retarget`, preview.ts:33-42; PaneBody.svelte:113 keys TabView by `instance.id`; TabView.svelte `<View {instance} />`).
  - Svelte 5.57.1's `BranchManager.ensure` (node_modules/svelte/src/internal/client/dom/blocks/branches.js:190-235) creates the new branch, running the new view's `untrack(() => handed?.set(id, ...))`, before `#commit` destroys the old one. The old view's cleanup `handed?.clear(id)` then deletes the new view's controls.
  - So after the step, a walk from a `.md` to an `.xlsx` (or back) draws no controls. Under the brief's "as `Source.svelte:300-304` does" this would also take a source tab's controls away when it is reached from a file tab.
- Case 18: no, it cannot pass without the goal.
- Case 19: no, it cannot pass without the goal.
- Cases 20 to 23 and 25 to 27: no.
- Case 24: it cannot pass under item 3's mechanism (section 4).
- The step line's check ("reproduces each on TEST and finds each cause"): yes, it could pass without the goal. A reproduction of (A) whose cause names the wrong code path was accepted, and (C) has no reproduction.
- Item 1: yes, it could be built and pass without the goal. It catches nothing inside an iframe (PDF, HTML). It also rests on an unverified premise: that the second press's `click` carries `detail === 2` when it lands on an element other than the one the first press hit.
- Item 2: yes, without a rule that a view's cleanup clears only the snippet it set (or an equivalent ownership check in `TabActions`), for the retarget reason above.
- Item 3: yes, as written. The `fileVersion` re-read never fires on a save, so the tab shows stale text.
- Item 4: yes. It names HELP.md:49, :167 and DESIGN.md:395 but not DESIGN.md:427, :391 or HELP.md:161, which a generic "every other paragraph" leaves to the builder's grep.
- Verify 1 (`test:quick`): yes. It runs no tree check, so a boundary breach or an orphan key passes.
- Verify 2 (ASCII gate): no.
- Verify 3 (unused exports): no.
- Verify 4 (`grep "useTabActions()"`): yes. It is a grep of a call and passes with the retarget defect.
- Verify 5: not applicable.

Findings:
- Item 1 misses iframes.
- Item 2 misses the retarget teardown order.
- Item 3 names the wrong re-read signal.
- Cases 8, 11 and 12 to 17 can pass without the goal.
- Verify 1 and 4 cannot catch the defects that matter here.

## 6. Implied inputs

- A preview tab retargeted from one view to another under one instance id (source to file, file to source, file to document): missing. Expected: the strip's end draws the new view's controls and none of the old.
- The preview tab's read in flight when its tab closes, or when its state changes: missing. Expected: a late answer is dropped. This holds by itself if the read is `fs.fileText`.
- A press's `openRow` in flight when the Files tab closes, or when the listener fires before the tab exists: partly covered by item 1's last sentence and case 3. No case covers the tree closing mid-read. Expected: one kept tab or one preview tab, never two.
- A file removed: covered by case 23 for the preview tab. Missing for a double click on a row whose file was removed before the read. Expected: the cannot-open line, no kept empty tab.
- A file that is a symlink: missing. Expected: the star, Open in Program and the preview act on the served root and path, as for a plain file.
- A path with a space or a `#`: missing. Expected: the preview reads it; `sourceFileUrl` and `fileBytesUrl` escape each segment.
- A Markdown preview tab of a file that is renamed or moved: missing. Expected: the tab follows the file as source, file and document tabs do. `followedFileTab` (follow.ts:110) does not know `markdown-preview`, and its label `Preview <name>` needs restating.
- Two panes each showing a different file tab: missing. Case 18 covers one pane only. Expected: each strip draws its own active tab's controls.
- A float holding a file tab, or the Files view in a float: missing. Expected: the controls are drawn at the float's strip end. In a float a file opens into the float's own pane (opening.ts:121 takes `openOpened` only for a page), which is the one-pane double-click case.
- A double click whose second press lands in a PDF frame or an HTML document frame: missing as such, and contradicted by cases 5 and 6. Expected: one kept tab.
- The second press landing in Monaco selects a word (the editor's own reaction to a detail-2 mousedown): missing. Expected: stated as a visible after-effect, or prevented.
- A system double-click interval longer than 500 ms: missing. Expected: stated, since `detail === 2` past 500 ms keeps nothing.
- A `markdown-preview` tab restored from a saved layout with an empty or missing root and path: missing. Expected: a none line, as `file.none` and `doc.none` give.

Findings: the retarget case, the in-flight reads, the rename-follow, two panes, a float, the iframe second press, symlink, path with a space, the Monaco selection, the interval, and the empty saved state are not listed under Cases.

## 7. ADRs

- `ls docs/adr tools/oculus/docs/adr` from the repository root gives "No such file or directory" for both. No ADR folder exists, so there is no record.

Findings: none.

## Declined to judge

- VS Code's exact Open Preview behaviour (label `Preview <name>`, whether its tab opens kept or as a preview, Open Source among the title actions) was not checked against VS Code's source; the brief's description matches what I know of `markdown.showPreview`.
- The TEST probe of (A) and the TEST sighting of (B) were not rerun, since this check drives no browser.
- Whether Chrome gives `click.detail === 2` to a second press that lands on a different element, and whether the system counts a press on another row as the second click (case 8), was not verified. My understanding is that Chromium takes the count from the OS event by time and distance, not by target.

Agent usage: ordo-high on claude-opus-5-5 (served model read from the agent record), 220933 tokens, 70 tool uses, 619 s.

## Closed

Each finding with the change to `agents/briefs/X3f.md` that closes it.

- Names, the shared rendering's folder: item 3 puts the rendering under `views/shared/prose/`, and the paths list it.
- Names, `source/Editor.svelte` (the import at :29, the comment at :25): added to the paths; item 4 names :25, and item 3 names the import.
- Names, `layout/open/opening.ts:135-139`: a premise names it false; item 4 rewrites it; the paths list it.
- Names, `RootedTree.svelte`: item 1 takes the opened id inside `openRow`, which already holds it, and the opener is built in `rooted-tree.svelte.ts:80`, which is in the paths; RootedTree.svelte does not change.
- Names, `follow.ts`: item 3 follows a `markdown-preview` tab on a rename; the paths list it; case 35.
- Names, DESIGN.md:427, DESIGN.md:391, HELP.md:161: item 4 names each.
- The step line, (C) not reproduced on TEST: reproduced (Open Preview on `docs/AGENT-APPROACH.md` opened the source tab with the raw Markdown); a premise records it.
- The step line, Z418's "opens nothing": a premise reconciles it with the symptom reproduced.
- Premises, `pressing.ts:56`: corrected to :51.
- Premises, the (A) cause's code path: rewritten to `openOpened` and `landingFor` (`landing.ts:54-57`); decision 1 rewritten.
- Premises, decision 3's "the one folder with room": rewritten; the folder counts are listed.
- Premises, G12 missed: the tests premise names G12, and verify 2 runs `tests/checks/config/config.test.ts`.
- Premises, item 3's `fileVersion`: item 3 reads through `fs.fileText`, which a source save marks; a premise records both reads; decision 2 rewritten.
- Cases and checks, the view boundary: item 2 puts the component under `views/shared/links/` only, item 3 the rendering under `views/shared/prose/`; a premise states the boundary; verify 2 runs `tests/checks/tree/boundaries.test.ts`.
- Cases and checks, cases 5 and 6 against the window listener: item 1 is now a layer over the pane body, which a press into a frame meets first; cases 5 and 6 name the frame.
- Cases and checks, case 24 against `fileVersion`: closed by item 3's `fs.fileText`.
- Cases and checks, case 11's wording: rewritten to the disarmed keep.
- Cases and checks, the async cases: cases 33 and 37, and item 1's last sentence (an `openRow` resolving after the Files tab closed arms nothing).
- The question, item 1 missing frames: closed by the layer.
- The question, item 2 and the retarget teardown: item 2 makes `TabActions.clear` take the snippet it clears; a premise states the order; case 28.
- The question, item 3's re-read signal: closed as above.
- The question, cases 8, 11 and 12 to 17 passing without the goal: case 8 rewritten (Files beside the editors, no layer there), case 11 rewritten, case 28 walks a preview tab across views.
- The question, verify 1 and 4: verify 2 runs the boundary, config and text-key checks; verify 4 says it shows wiring only and names the cases that show behaviour.
- Implied inputs: cases 28 to 37 add the retarget, two panes, a float, the Monaco selection, the interval, a removed file, a symlink and a name with a space or `#`, the rename, the empty saved state and a read out at close; the 500 ms interval is decision 1's and item 1's named constant.
