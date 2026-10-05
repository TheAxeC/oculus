Not done in this worktree: `docs/DATA-MAP.md` item 6 (the `[TOC]` line is the orchestrator's at landing, outside the sparse checkout) and every behaviour that needs a browser, which no command here proves: cases 1 to 9, 11, 13 to 15, 18 to 20, 22 to 28 and 30 to 32 are (look) cases, case 33 is the landing check, and cases 10, 12, 16, 17, 21 and 29 are proved only by the code lines named in the tables (case 10 also by the `opening.client.test.ts` row for a key). Items 1 to 5, 7 and 8 are built, and each check named below ran.

## Open items of the state file (orchestrator-state.md, "Open items", verbatim)

- Z511 (2026-10-05, A3's choice 5, unattended runs and permissions): with `tasks.skip_permissions: true`, a scheduled Update run starts a Claude session with no person present. (a) it starts with `--dangerously-skip-permissions`, the written schedule standing as the yes. For: VS Code's Automations run with the agent's configured permissions; a scheduled run actually runs. Against: an agent edits and runs commands with nobody asked, on a timer. (b) a scheduled run is held in the tray until a press starts it. For: nothing runs unasked. Against: no unattended run, which is what A3 is for. (c) scheduled runs always start with prompts on, whatever `skip_permissions` says. For: nothing skips a prompt unasked. Against: the run stops at its first prompt with nobody there, so it rarely finishes. Recommendation: (a), the risk stated in HELP.md and the option's description. Yours, since it decides what runs on your machine without you.
- Z512 (2026-10-05, A3's guarded entries): (1) a new entry: "A scheduled update task starts once per due time: a due time missed while the server was down starts one catch-up run at the next start, a due time while that task's earlier run is going starts nothing and is recorded as skipped, a due time already recorded as handled never starts again, and close() leaves no timer and starts nothing." Code: `src/lib/server/machine/tasks/schedule.ts`, `src/lib/server/machine/tasks/start.ts`. For: a run started twice, or never, costs a Claude run or a missed one. Against: one more guarded test. (2) G31 widened: `~/.oculus/schedule.json` joins its files and `src/lib/server/machine/tasks/record.ts` its Code line. Recommendation: yes to both. Without them, those cases are runs the report quotes and nothing guards them later.
- Z514 (2026-10-05, D20's guarded entries): four new entries, each with its test: (1) "A seeded agent runs only after its exact seed, folder and agent are approved; a changed seed asks again." (rows in `tests/routes/sessions/compose.test.ts`); (2) "A start in a mode the agents catalog marks `confirm: true` is refused without the confirmation." (a row there); (3) "A transcript above Node's string limit is read whole in pieces, and the next read asks from where the last one stopped." (a new `tests/server/sessions/transcripts.test.ts`, a small piece size); (4) "A git command that fails says why: timed out, ended by a signal, an exit status with no output, or too much output." (a table beside `shortReason`). For: an agent run without approval, a transcript that shows no turns and a failure with no reason each cost real work. Against: four more guarded tests. Recommendation: yes to all four.
- Z515 (2026-10-05, D20's causes not found read-only): (1) Z307's Terminal tab dropping out of the layout: tried the server list paths, the path with no server, cut rows, `survivorsShape`, `takeSaved` across browser tabs, the control client's lifetime, `endedTerminals` on the first `sessions` message; settled by a log of the layout writes per browser tab or the server's stderr of 2026-10-03 20:12 to 20:15. (2) Z313's Sessions New button opening nothing: the button and the `n` key reach the same `composeIn`; settled on TEST by `document.elementFromPoint` at the button and whether its `onclick` runs. (3) Z312's pill opening nothing while a write is in flight: the commit's menu answers four items while busy; settled by ContextMenu's state during a write on TEST. Recommendation: the orchestrator takes (2) and (3) on TEST before D20's builder starts and writes what it finds into the brief; (1) stays out of D20 until it recurs with the log in place. Yours, since a cause not found leaves part of a ruling unbuilt.
- Z507 (2026-10-05, S5's look with Q119, an exception to the looks rule): the round moves oculus's port default (8791 to 8790) and makes a wrong value take its default with a finding at start; showing that needs a server started with a wrong value, which Axel's server on 8790 never is. (a) the look runs on a scratch oculus with its own config, HOME and TMUX_TMPDIR, as D35's port move was looked at. For: the look is taken before the commit (Z467); Axel's server is never restarted. Against: a second exception to "looks only on TEST". (b) the look on Axel's server after he restarts it with a wrong value. For: the TEST page. Against: the look is owed, which Z494 forbids, and it needs Axel's hands. Recommendation: (a).
- Z504 (2026-10-05, D45's choice 8, a feature dropped): LaTeX Workshop runs its tools in a Docker image when `docker.enabled` is on (off by default; three keys: `docker.enabled`, `docker.image.latex`, `docker.path`) and shares its viewer over Live Share. `command -v docker` prints nothing on this machine, and oculus has no shared-session layer, so Live Share cannot be built under either option. (a) the Docker wrapper built (three `latex.docker_*` keys, the tools looked up as `docker`, SyncTeX paths translated from the container), Live Share left out. For: one of the two features kept. Against: no case or look can run it here, so every Docker claim stays not verified. (b) both left out. For: nothing built that cannot be tried. Against: two LaTeX Workshop features dropped, which needs your yes (Z468). Recommendation: (b), with Docker added when a machine with Docker is in use.

## Round 2 in one table (briefs/X3f-round2.md)

| Item | State | Proof |
| --- | --- | --- |
| 1 Second press taken on mousedown | DONE. `ui/tree/item-props.ts` has `onpressagain`; `TreeItem.svelte` calls it from `onmousedown` when `event.button === 0 && event.detail === 2`; `FileRow.svelte` passes `onkeep(row, event.timeStamp)` for a file row and the launch button passes it too; `Tree.svelte` forwards `pressedAt` to `onopen`. `HELP.md:168` names a file still being read. | `grep -rn ondblclick src/lib/ui/tree src/lib/views/shared/explorer` prints nothing. Test: `opening.client.test.ts` row "a double click from a pointer press". Behaviour: look cases 1, 2. |
| 2 The kept tab takes the keyboard | DONE. `armed-keep.svelte.ts` has `askFocus`, `focusAsked`, `focusGiven`; `layout.svelte.ts` exposes them; `openRow` asks after `keepPreview` when `pressedAt` is given; `rooted-tree.svelte.ts` passes `askFocus` through `closed`; `PaneBody.svelte` has `inputOf(view)` (`.monaco-editor .native-edit-context`, `.monaco-editor textarea.inputarea`, `iframe`, `[data-tab-focus]`) and the effect with a `MutationObserver`. | Tests below. Behaviour: look cases 1 to 7. |
| 2a `data-tab-focus` marks | DONE on `File.svelte:198` (picture) and `:211` (download box), `Doc.svelte:115`, `RenderedMarkdown.svelte:95` (`tabFocus`, used by the Markdown preview), `Code.svelte:56` (locked text), `Source.svelte:429` (cannot-open box). | `grep -rn "data-tab-focus" src`. |
| 3 `handUp` hands up again | DONE. `tab-actions.svelte.ts:78` `untrack(() => handed?.set(mine, actions))` in the effect; `TabActions` keeps a plain `#latest` map and publishes a copy in `$state.raw`. | Test `tab-actions.client.test.ts`, red lines below. |
| 4 Tab row, Cmd+S, palette, menus | DONE. Strip: `views/sources/source/StripActions.svelte` (31 lines, Open Preview to the Side only, lucide `file-search` as `open_preview` in `glyphs.yml` and `icons.yml`). Cmd+S: `keys.ts:50,113,152` (`{ kind: 'save' }`), `workbench-keys.svelte.ts`, `Workbench.svelte:185` (`saveSource` asks the tab on screen with `SAVE_ACTION`). Palette: `status/ask-perform.ts` builds `File: Save`, `File: Revert File`, `View: Toggle Word Wrap`, `Markdown: Toggle Rendered Half`, `Markdown: Open Preview to the Side`, `Git: Toggle Git Blame Editor Decoration`; the editor primitive takes `actions: EditorOwnAction[]` in place of `wrap`. Tab menu: `tab-menu.ts` (group after Reveal and Show in Files), `tab-menu-state.svelte.ts`, helpers in `state/workbench/navigation/pages.ts` (`tabFileFacts`, `bookmarkTabFile`, `openInBrowserTab`). Row menu: `row-menu.ts` (`ROW_ADD_BOOKMARK`, `ROW_REMOVE_BOOKMARK`, `ROW_OPEN_BROWSER`), `picks.svelte.ts`, `Tree.svelte`. Open Source is gone from the preview tab. `FileTab.svelte`, `SaidLine.svelte`, `shared/links/StripActions.svelte` and `BookmarkStar.svelte` are deleted (no user left: `grep -rn "FileTab\b\|SaidLine\|BookmarkStar" src tests config` prints only `followedFileTab` of `follow.ts`, a different name). Orphan catalog keys deleted (`tests/checks/source/keys.test.ts` passes). `Source.svelte` is 512 lines (limit 520), the folder `views/sources/source` holds 10 items. | Greps and checks below. Behaviour: look cases 11 to 19. |
| 5 Outline | DONE. `sections/followed-tab.ts` (39 lines), `sections/headings.svelte.ts` (59), `outline.ts` (`headingOutline`), `Outline.svelte` rewritten (follows `followedTab`, reads source text, Doc and preview headings, press scrolls through `jump.ts` `scrollToFragment`), `STARTS_CLOSED = ['editors', 'timeline']`, `headings: HeadingsStore` in `context.ts`, `renderDocumentParts` in `data/prose/markdown.ts`, `headings` in `DocAnswer` (`server/content/docs.ts`) and `DocState` (`state/system/docs.svelte.ts`), new key `files.outline_go_heading_title` ("Go to {0}") beside `files.outline_go_title`. | Look cases 20 to 32. The render's heading list: a probe with `node --experimental-strip-types` over `renderDocumentParts('# Title ... [TOC] ... ## Folders ... ### The `hub` root ... ## Folders')` printed `[{"level":1,"text":"Title","id":"user-content-title"},{"level":2,"text":"Folders","id":"user-content-folders"},{"level":3,"text":"The hub root","id":"user-content-the-hub-root"},{"level":2,"text":"Folders","id":"user-content-folders-1"}]`, the same ids on the HTML's `id=` attributes and on the `[TOC]` list's `href="#..."`, and `[]` for a text with no heading. No test covers the `api/docs` answer's `headings` field (`grep -rln "content/docs" tests` finds none), so the server field is checked by the type check and the probe only. |
| 6 DATA-MAP | NOT mine. The orchestrator adds `[TOC]` at landing. `grep -c` on main's `docs/DATA-MAP.md`: `^# ` 1, `^## ` 6, `^### ` 18, `^#### ` 0, matching case 24. | |
| 7 Tests under G37 | DONE, three client test files, no DOM, no new dependency; `tests/ui/frame/rooted.svelte.ts` moved from `tests/state/sources/repositories/diff/` and the import in `comment-draft.client.test.ts` changed. | Below. |
| 8 Dispositions | DONE, below. | |

## Verification

Full-list runs: 1 (`npm run diagrams`, then `npm run test:quick`, after the last change; nothing changed afterwards). Final lines, verbatim:

```
ok      ASCII gate (1.6 s)
ok      prettier (1.9 s): All matched files use Prettier code style!
ok      svelte-kit sync (5.5 s)
ok      eslint (35.8 s)
ok      svelte-check (57.3 s): 1791167622455 COMPLETED 355 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (68.7 s): Duration  59.78s (transform 88.60s, setup 0ms, import 206.52s, tests 26.33s, environment 2.42s)
test:quick: 70.5 s (limit 45.0 s); every command passed
test:quick: over the time limit
test:quick: not covered: tests outside the selection, tests/checks, slow tests,
            build, lint of unchanged files; npm run test:landing runs them
```

The list reports `over the time limit` (70.5 s against 45.0 s) on this machine while other builders were running; every command passed.

Extras after the last change:

1. `npx vitest run tests/state/workbench/layout/armed-keep.client.test.ts tests/views/shared/explorer/opening.client.test.ts tests/ui/tabs/tab-actions.client.test.ts tests/state/sources/repositories/diff/comment-draft.client.test.ts`: `Test Files  4 passed (4)` / `Tests  33 passed (33)`. G28's tests (`tests/shell/panes/strip/tab-menu.test.ts`, `tests/state/forms/form-drafts.test.ts`, `tests/state/forms/manifest-draft.test.ts`, `tests/state/sessions/source.test.ts`, `tests/state/sources/repositories`): `Test Files  5 passed (5)` / `Tests  11 passed (11)`.
2. `npx vitest run tests/checks/tree/boundaries.test.ts tests/checks/tree/size.test.ts tests/checks/tree/duplication.test.ts tests/checks/source/comment-width.test.ts tests/checks/source/history.test.ts tests/checks/source/keys.test.ts tests/checks/config/config.test.ts tests/checks/imports/order.test.ts tests/checks/diagrams`: `Test Files  9 passed (9)` / `Tests  138 passed (138)`. Beside them, `npx vitest run tests/checks --tagsFilter '!slow'`: `Test Files  15 passed | 1 skipped (16)` / `Tests  224 passed | 3 skipped (227)`; the skipped file and tests are the ones tagged slow, so the slow tree checks were not run.
3. `sh utils/unused-exports.sh` against `.agents/worktrees/X3f-base/unused-exports.txt`: `diff` prints `1c1 < Unused exports (257) --- > Unused exports (256)` and `235d234 < src/lib/ui/controls/editor/options.ts: WRAP_ACTION`. No line is added; the one removed line is `WRAP_ACTION`, which `ask-perform.ts` now imports. (New exports that appeared unused while building, `ownListing` users, `renderDocument`, `TAB_ADD_BOOKMARK`, `TAB_REMOVE_BOOKMARK`, `TAB_OPEN_BROWSER`, `TAB_OPEN_PROGRAM`, `ROW_OPEN_BROWSER`, `ROW_ADD_BOOKMARK`, `ROW_REMOVE_BOOKMARK` and `HeadingAsk`, are not exported now: the constants and the type are module-private, and `renderDocument` is deleted because `renderDocumentParts` replaced its one caller.)
4. Greps over `src tests config HELP.md DESIGN.md README.md` (`--exclude=local.yml`): `focusKept`, `FileTab\b`, `SaidLine`, `BookmarkStar`, `ontogglewrap`, `wrapAction`, `wrapListing`, `file.bookmark`, `file.unbookmark`, `file.open_outside`, `file.open_source`, `file.toolbar`, `source.blame`, `source.blame_title`, `source.preview`, `source.preview_title` print nothing. `STARTS_CLOSED` is in `section-state.ts:10,17,22` only. `StripActions` is in `Source.svelte:42,98,396` and `DESIGN.md:427`, all the moved component. `ondblclick` remains only on other components' own props (`TabFace`, `Tabs`, `ToolButton`, `RowButton`, `Sash`, `PaneView`, `PaneStrip`, `SessionWorkspace`, `TerminalTitle`, `TerminalList`, `Graph`), none on the tree. `outline_go_title` remains, used for source rows (`Outline.svelte:173`, `files.yml:139`).
5. ASCII gate of spec.md over `src tests config` (`bin` does not exist in this checkout): `LC_ALL=C perl -ne '...' $(find src tests config -type f ! -name local.yml)` printed nothing; `LC_ALL=C grep -nP '[^\x00-\x7F]' HELP.md DESIGN.md` printed nothing. `ls tests/diag` prints `No such file or directory`.

Folder item counts (`ls -A`): `state/sources/explorer/sections` 7, `views/shared/prose` 8, `views/shared/links` 6, `views/sources/source` 10, `views/sources/source/status` 2, `state/workbench/navigation` 10, `views/sources/files/sections` 8, `ui/tabs` 6, `ui/controls/editor` 10, `views/shared/explorer/tree/menu` 3, `shell/panes/strip` 6, `tests/ui/frame` 2, `tests/ui/tabs` 1.

## G37, for `agents/guarded.md` under "Your work is not lost or misplaced"

```
- G37. A file opened from the Files tree by a double click is one kept tab with the keyboard in it, whether the second press lands on the row or on the opened tab, and a file tab keeps the actions it hands up to its pane's strip through a keep and a walk to another file.
  Code: `src/lib/state/workbench/layout/open/armed-keep.svelte.ts`, `openRow` in `src/lib/views/shared/explorer/opening.ts`, `handUp` in `src/lib/ui/tabs/tab-actions.svelte.ts`.
  Test: armed keep: `tests/state/workbench/layout/armed-keep.client.test.ts`, 'the armed keep and the ask for the keyboard'; openRow: `tests/views/shared/explorer/opening.client.test.ts`, 'opening a file of the file browser'; handUp: `tests/ui/tabs/tab-actions.client.test.ts`, 'the actions a tab hands up'.
```

Tests (17 + 10 + 5 = 32 rows, one table per unit, one row per input with a different outcome). No title carries history wording.

Each row failing with its behaviour removed (a scratch edit of the source file, the test run, the file put back, `cmp` against a copy in the scratchpad printing no difference for all three files after the last run). The ask rows (`askFocus`, `focusAsked`, `focusGiven`), `openRow`'s ask and `handUp`'s same-id copy are the code the unchanged worktree lacks, so removing the line gives the unchanged worktree's behaviour for them.

| Removed from | Row that fails | Failing line |
| --- | --- | --- |
| `armed-keep.svelte.ts`: `asked = id;` | 4 rows: answers 'a' after an ask for a, 'b' after a then b, 'b' after a, b, given a; keeps the ask when the keep is disarmed | `armed-keep.client.test.ts:99:36` (and `:107:36`) |
| `focusGiven` made `asked = null` | answers 'b' after asks for a and b, then a is given the keyboard | `:99:36` |
| `focusGiven` never clears | answers null after an ask for b, then b is given it | `:99:36` |
| `disarm` also clears the ask | keeps the ask when the keep is disarmed | `:107:36` |
| `!isPreview(instance) \|\|` | arms for a kept tab | `:41:46` |
| `instance === null \|\|` | arms for an id no tab has | `:40:15` |
| `left <= 0` made `left < 0` | arms for a preview tab, 500 ms after the press | `:41:46` |
| `\|\| left <= 0` | the 500 ms and 600 ms rows | `:41:46` |
| the `setTimeout(...)` line | ends an armed keep when the clock passes the rest of the window | `:51:40` |
| `setTimeout(..., left - 1)` | the clock is a millisecond short of it | `:51:40` |
| the owner test in `disarm` | a disarm from another owner | `:62:40` |
| the owner test made `owner !== undefined` return | a disarm from its owner | `:62:40` |
| `opening.ts`: the `askFocus` line | a double click from a pointer press | `opening.client.test.ts:75:28` |
| `askFocus` without the `pressedAt` test | a double click from a key | `:75:28` |
| `opener.keepPreview(id)` | pointer and key double click rows | `:75:28` |
| the `armKeep` branch | a single click from a pointer press | `:75:28` |
| `armKeep(id, pressedAt ?? 0)` | a single click from a key | `:75:28` |
| `tabForKind`: html, missing, image branches | the document, source (missing) and file (image, pdf, other) rows | `:88:31` |
| `tab-actions.svelte.ts`: both `set` calls | mounting hands the snippet up; both same-id copy rows | `tab-actions.client.test.ts:28:33`, `:45:33` |
| the effect's `set` only | both same-id copy rows (a keep; a keep and a walk) | `:45:33` |
| the effect's cleanup | the view is torn down | `:55:33` |
| `clear` without its identity test (`#latest.get(id) !== actions`) | a newer snippet another view handed up survives | `:67:33` |
| `TabActions` storing in one reactive map read at teardown, in place of `#latest` and the published copy | the same row | `:67:33` |

## Dispositions (item 8)

- `.body { position: relative; }` (`PaneBody.svelte:285`). `grep -rnE "position:\s*(absolute|fixed)" src/lib/views` finds seven rules; each has a positioned ancestor inside its own view, so none is placed against the pane body: `Memories.svelte:377` `.alt` (in `.tile`, relative `:339`), `:397` `.lightbox` (fixed, to the viewport), `:409` `.backdrop` and `:432` `.shut` (in `.lightbox`), `Settings.svelte:285` `.contents.over` (in `.body`, relative `:266`), `settings/Item.svelte:234` `.bar` (in `.item`, relative `:218`), `map/Graph.svelte:436` `.status` (in `.graph-wrap`, relative `:419`). Two boxes outside the views stand against the nearest positioned ancestor and are worth a glance at the look: `ui/frame/Modal.svelte:144` `.anchor` (1 px, hidden, takes no room) and `ui/tree/list/VirtualRows.svelte:266` `.probe` (hidden measuring box); `ui/frame/FloatingBar.svelte` is placed in `TerminalGrid.svelte`, relative at `:501`. The look checks a Settings tab, a Memories tab with a picture open, a Graph tab and a terminal's find bar for position. Nothing else changed for it.
- Case 33 for a name the browser draws, before and after (the same, no change): `readFileKind` answers `.png`, `.pdf` and `.html` from the name without a request (`fs.svelte.ts:544-547`), so the removed-file read never runs. A removed picture: the picture request fails, `File.svelte:202` `onerror` sets `unreadable`, and `:192-193` draws `file.unreadable` with Read again. A removed PDF opens `File.svelte`'s frame (`:207`) and shows the route's 404 answer inside it. A removed HTML file opens the document view's frame (`Document.svelte:119`) and shows the same 404. A removed `.md` still opens the source tab with `source.cannot_open` and Retry.
- Ten files for the look (Z467): `tools/oculus/package.json` (case 1), `CLAUDE.md` (cases 2, 11, 15, 17, 18, 22, 23, 27), `projects/coauthor/active/clinical-hccnet/manuscript/main.pdf` (3, 14), `projects/active/linfoot-estimator/results/changes_overview.png` (4, 14), `tools/cockpit/cockpit.html` (5, 14), `applications/VacancyPages.xlsx` (6, 14), `docs/DATA-MAP.md` (7, 14, 24, 25, 33), `tools/cockpit/build.py` (13, 17, 29), `projects/coauthor/active/clinical-hccnet/manuscript/main.tex` (13, 29), `applications/archive/declined/2025-wageningen-fl/info.md` (26); also `tools/oculus/vite.config.ts`, `applications/applications.yml` and `projects/ideas/engram/skills-lock.json` (13). That is thirteen files of six types.
- Refutation Standards 2 (`PaneBody.svelte` "the window"): reads "the double-click time (`KEEP_WINDOW_MS`) runs out". The race of the first read resolving between the second `pointerdown` and its `click`: item 1 takes the press on `mousedown`; look case 2. One `tick()`: the watch in `PaneBody.svelte` tries on every change until an input exists. Default action after the focus is given: the press on the layer is cancelled in `layerPressed`; look case 1 reads `document.activeElement`. Non-primary press: `layerPressed` ends the keep and lets it through; look case 9. `DESIGN.md:334`: no change. `file-type.ts`: kept. Step 0's "double click opens no tab": not sent in this round (ruling Z495).

## Cases 1 to 33: first run on the unchanged worktree (read from the code, round 1 state), then after

"Look" means the result needs a pointer in Chrome and is what the landing look reads. "After" is read from the code lines named; nothing here ran in a browser.

| Case | File and state | First run on the unchanged worktree | After this round |
| --- | --- | --- | --- |
| 1 (look) | `tools/oculus/package.json`, kind read before | Fails: the second press lands on the layer and keeps, then `focusKept` looks for `.monaco-editor textarea`, which with EditContext is the read-only IME textarea (`textarea.ime-text-area`); the keyboard is not on `.native-edit-context`. | `inputOf` tries `.monaco-editor .native-edit-context` first (`PaneBody.svelte`); both paths ask through `askFocus`. |
| 2 (look) | `CLAUDE.md` after a reload, both presses before the read returns | Fails: the read resolves between the second `mousedown` and its release, the layer takes the release and the click, and neither the row's `dblclick` nor the layer's `pointerdown` sees the press (diagnosis symptom 1). | The second press is taken on `mousedown` (`TreeItem.svelte`, `onpressagain`), so the keep and the ask happen at the press. |
| 3 (look) | `main.pdf` | Holds on the layer path (`focusKept` finds the `iframe`); the read-before-gate path asks nothing. | Both paths ask; `inputOf` answers `iframe`. |
| 4 (look) | `changes_overview.png` | Fails: no input exists in the picture view; the keyboard stays on the hidden tree. | The picture carries `data-tab-focus tabindex="-1"` (`File.svelte:198`); the ask ends on it. |
| 5 (look) | `cockpit.html` | Holds on the layer path as case 3. | As case 3. |
| 6 (look) | `VacancyPages.xlsx` | Fails as case 4 (the download line has no input). | The download box carries the mark (`File.svelte:211`). |
| 7 (look) | `DATA-MAP.md` | Fails as case 4 (the Doc view has no input). | `Doc.svelte:115`, the `.view` scroll box carries the mark. |
| 8 (look) | single press, press on the editor 600 ms later | Holds: nothing is armed after 500 ms (`armed-keep.svelte.ts`). | Unchanged; test row "a preview tab, 600 ms after the press". |
| 9 (look) | single press, right press inside 500 ms | Holds: `layerPressed` ends the keep and lets a non-primary press through. | Unchanged. |
| 10 | Enter on a file row | Holds: the keyed `onopen` passes no time. | Unchanged; test row "a double click from a key" asks nothing. |
| 11 (look) | `CLAUDE.md` source tab | Fails: the strip held Save, Revert, star, Open in Program, Preview, Blame (and Open Source on the preview tab). | `StripActions.svelte` draws Open Preview to the Side when `previewable` (`Source.svelte:397`), then the pane's Split and `...`. A press calls `openBeside(MARKDOWN_PREVIEW_VIEW, ...)`. |
| 12 | Markdown source tab read at a commit | Fails: the star, Open in Program and Blame were drawn. | `previewable` is `markdown && head === undefined && !blocked` (`Source.svelte:268`), so Split and `...` only. |
| 13 (look) | `build.py`, `main.tex`, `vite.config.ts`, `applications.yml`, `skills-lock.json` | Fails: Save, Revert, star, Open in Program and Blame on each. | Not previewable: Split and `...` only. |
| 14 (look) | PDF, picture, `.xlsx`, HTML, `DATA-MAP.md`, `Preview CLAUDE.md` | Fails: star, Open in a browser tab, Open in Program; the preview tab also Open Source. | These views hand nothing up (`File.svelte`, `Document.svelte`, `Doc.svelte`, `MarkdownPreview.svelte` have no strip snippet), so Split and `...`. |
| 15 (look) | `CLAUDE.md` kept, walked to `build.py` and back | Fails: a keep and a walk replace the instance with a same-id copy, the effect's cleanup clears the snippet and nothing hands it up again. | `handUp` sets again in the effect; test rows "keeps the snippet through a keep" and "a keep and a walk". |
| 16 | Cmd+S | Fails: no key action exists, so the browser's save dialog opens. | `savesFile` (`keys.ts:113`) resolves Cmd/Ctrl+S before the default command; `workbench-keys.svelte.ts` prevents the dialog always and skips the save under a palette, tray or dialog; `Workbench.svelte:185` asks the source tab on screen with `SAVE_ACTION`. A PDF tab, no tab, or a tab read at a commit: `sourceOnScreen` answers null or the tab refuses (`save` is only in the listed actions while the text may be written, `ask-perform.ts:40-43`). |
| 17 | palette on a source tab | Fails: `Source.svelte` published `[]` while not editing and `performAsk` returned on `!editing`; a writable tab listed `View: Toggle Word Wrap` only. | `tabActions` (`ask-perform.ts`) lists Save, Revert (editing), Toggle Word Wrap, Toggle Rendered Half (editing and markdown), Open Preview to the Side (`previewable`), Git Blame (`blameable`); a read-only tab lists only the rows that apply. |
| 18 (look) | tab menus | Fails: `tabMenu` had no bookmark, browser or program item. | The group after Show in Files (`tab-menu.ts:104-114`); a refusal is written to the menu's `said` line by `bookmarkTabFile`. |
| 19 (look) | row menu | Fails: Open in Program only. | `ROW_ADD_BOOKMARK` / `ROW_REMOVE_BOOKMARK` on every row except the up row and a root; `ROW_OPEN_BROWSER` on `html`, `image`, `pdf` names. |
| 20 (look) | fresh Files tab | Fails: `STARTS_CLOSED` held `outline`. | `['editors', 'timeline']`; a closed Outline stays in `collapsed`. |
| 21 | no file tab | Holds (`files.outline_no_editor`). | `followedTab` answers null: same line. |
| 22 (look) | `CLAUDE.md` shown, Files tab pressed | Fails: read `activeInstance(currentPage().id)`, which is the Files tab. | `followedTab(panes, focused, accepts)` answers the file tab shown last. |
| 23 (look) | Terminal tab shown after the source tab | Fails: the active tab was the terminal. | The terminal is not accepted; the source tab is followed. |
| 24 (look) | `CLAUDE.md` left, `DATA-MAP.md` right, right used last | Fails: a Doc tab was not read. | The pane used last is searched first; the Doc headings come from the server answer (`headings`): 1, 6 and 18 by level, as main's file counts. |
| 25 (look) | press on `Collection schema types` | Fails: no Doc headings. | `askHeading` -> `shareHeadings` -> `scrollToFragment(box, 'user-content-...')`; no tab opens. |
| 26 (look) | `info.md` preview | Fails: the preview tab was not read. | Empty heading list: `files.outline_empty`. |
| 27 (look) | `Preview CLAUDE.md` | Fails as 26. | Headings from `blockMarkdownParts`; a press scrolls the preview. |
| 28 (look) | PDF, picture, `.xlsx`, HTML | Holds (no-editor line). | Same line. |
| 29 | `build.py`, `main.tex` | Holds. | Unchanged (`outline_none`; LaTeX headings). |
| 30 (look) | Doc tab loading or failed | Not applicable (the Doc tab was not read; the no-editor line was shown). | `DocState.headings` is empty while loading or failed; the Outline shows no rows and no error of its own. |
| 31 (look) | Doc tab closed while followed | Not applicable (no followed tab). | `followedTab` falls to the next tab in its order or null (no-editor line). |
| 32 (look) | two asks for the same heading | Not applicable for rendered tabs (no ask store). | `askHeading` numbers its asks (`seq`); `asked` returns each once. |
| 33 (landing) | `DATA-MAP.md` after the insertion | Not runnable here: the file has no `[TOC]` in the worktree. | The orchestrator inserts `[TOC]` under the h1; `renderDocumentParts` replaces the mark with the list built from the same heading list. |

## What a reader sees change (view, state, before and after)

| View and state | Before | After |
| --- | --- | --- |
| Files tab, double click, the read of the file's kind returns while the second press is down | The release and click land on the layer; the tab stays a preview. | The second press is taken when it goes down; the tab is kept and takes the keyboard. |
| Any kept tab by a double click (source, PDF, HTML, picture, download, Doc, preview) | Keyboard sometimes on the IME textarea or on the hidden tree. | On `.native-edit-context`, the frame, or the tab's `data-tab-focus` box. |
| Source tab strip (writable Markdown) | Save, Revert, star, Open in Program, Preview, Blame. | Open Preview to the Side (icon `[v]` / `file-search`), Split, `...`. |
| Source tab strip (other files, files at a commit) | Same row of controls. | Split and `...`. |
| File, document, doc and preview tabs | Star, Open in a browser tab, Open in Program, Open Source, a red refusal line. | Split and `...`; no refusal line of their own. |
| Cmd+S | The browser's save dialog. | Saves the source tab on screen; the dialog never opens. |
| Palette on a source tab | `View: Toggle Word Wrap` only. | Also `File: Save`, `File: Revert File`, `Markdown: Toggle Rendered Half`, `Markdown: Open Preview to the Side`, `Git: Toggle Git Blame Editor Decoration`, each where it applies. |
| Tab right-click menu | Closes, copies, reveal, compare, keep/pin, splits. | Adds `Add Bookmark` / `Remove Bookmark`, `Open in Browser Tab`, `Open in Program` after Show in Files, each where it applies. |
| File row menu | `Open in Program`. | Adds `Add Bookmark` / `Remove Bookmark` and, on html/image/pdf names, `Open in Browser Tab`. |
| Outline | Closed at first; follows the active tab; source only. | Open at first; follows the file tab shown last; also Doc and Markdown preview headings; a press scrolls that tab. |
| `api/docs` answer | `html`, parts. | Adds `headings: [{level, text, id}]`. |

## Files changed (`diff -rq` against `.agents/worktrees/X3f-base/tools/oculus`, line counts after the last change)

New: `state/sources/explorer/sections/followed-tab.ts` 39, `sections/headings.svelte.ts` 59, `views/shared/prose/rendered-headings.svelte.ts` 42, `views/shared/prose/RenderedMarkdown.svelte` 126, `views/sources/doc/MarkdownPreview.svelte` 128, `views/sources/source/read-again.ts` 45, `views/sources/source/status/ask-perform.ts` 105 (moved from `views/sources/source/`), `status/source-status.svelte.ts` 44, `state/workbench/layout/open/armed-keep.svelte.ts` 90, `tests/state/workbench/layout/armed-keep.client.test.ts` 109, `tests/views/shared/explorer/opening.client.test.ts` 91, `tests/ui/tabs/tab-actions.client.test.ts` 69, `tests/ui/frame/rooted.svelte.ts` 23 (moved from `tests/state/sources/repositories/diff/`).

Removed: `views/shared/links/BookmarkStar.svelte`, `views/sources/source/Preview.svelte`, `views/sources/source/ask-perform.ts` (moved), `tests/state/sources/repositories/diff/rooted.svelte.ts` (moved). `views/shared/links/FileTab.svelte`, `SaidLine.svelte` and `StripActions.svelte` (round 1) are deleted and absent from the diff.

Changed (lines): `HELP.md` 349, `DESIGN.md` 435, `data/model/index.ts` 512, `data/model/model-entities.ts` 744, `data/prose/markdown.ts` 136, `server/content/docs.ts` 563, `shell/Workbench.svelte` 440, `shell/keys/keys.ts` 246, `shell/keys/workbench-keys.svelte.ts` 448, `shell/panes/PaneBody.svelte` 308, `shell/panes/PaneView.svelte` 496, `shell/panes/strip/tab-menu-state.svelte.ts` 163, `shell/panes/strip/tab-menu.ts` 256, `state/client/context.ts` 505, `state/sources/explorer/file-type.ts` 85, `follow.ts` 158, `sections/outline.ts` 152, `sections/section-state.ts` 25, `state/sources/fs.svelte.ts` 819, `fs.ts` 61, `state/system/docs.svelte.ts` 313, `state/workbench/layout.svelte.ts` 848, `layout/index.ts` 145, `layout/open/opening.ts` 301, `layout/open/preview.ts` 79, `navigation/editor-status.svelte.ts` 165, `navigation/pages.ts` 489, `ui/controls/editor/Editor.svelte` 499, `chords.ts` 127, `gutter/gutter.ts` 397, `kit/load.ts` 385, `options.ts` 51, `types.ts` 107, `ui/html.ts` 372, `ui/tabs/tab-actions.svelte.ts` 81, `ui/tree/item-props.ts` 81, `ui/tree/TreeItem.svelte` 486, `views/shared/explorer/RootedTree.svelte` 94, `opening.ts` 110, `rooted-tree.svelte.ts` 233, `tree/FileRow.svelte` 162, `tree/Tree.svelte` 384, `tree/control/picks.svelte.ts` 195, `tree/control/pressing.ts` 56, `tree/menu/row-menu.ts` 538, `views/shared/links/ProgramButton.svelte` 68, `views/shared/prose/Code.svelte` 102, `Markdown.svelte` 221, `jump.ts` 97, `views/sources/doc/Doc.svelte` 146, `document/Document.svelte` 154, `file/File.svelte` 281, `files/Files.svelte` 321, `files/sections/Outline.svelte` 185, `Sections.svelte` 110, `source/Editor.svelte` 263, `source/Source.svelte` 512, `source/StripActions.svelte` 31, `source/save/SourceNote.svelte` 56, `tests/state/sources/repositories/diff/comment-draft.client.test.ts` 72, config `catalogs/glyphs.yml` 191, `catalogs/icons.yml` 190, `text/views/sources/doc.yml` 15, `document.yml` 8, `file.yml` 18, `files.yml` 234, `source.yml` 41, and `docs/diagrams/*` as `npm run diagrams` wrote it.

Paths outside "Paths this round writes", each with its reason:
- `shell/Workbench.svelte`: the `saveSource` option of the key handler (the brief names `keys.ts` and `workbench-keys.svelte.ts` only).
- `state/workbench/navigation/editor-status.svelte.ts`: exports `SAVE_ACTION`, the id Cmd+S asks for.
- `state/workbench/navigation/pages.ts`: `tabFileFacts`, `bookmarkTabFile`, `openInBrowserTab`. The brief has `tab-menu-state.svelte.ts` call `fs`, `writes` and `fs-transport` directly; `tests/checks/tree/boundaries.test.ts` forbids `shell/` importing `state/sessions/source.svelte`, `state/sources/fs` and `state/sources/fs-transport`, and allows `state/workbench/navigation/**`.
- `ui/controls/editor/types.ts`, `chords.ts`, `kit/load.ts`, `gutter/gutter.ts`: `KeyPress` moves to `types.ts` with the new `EditorOwnAction`, so the `actions` prop has one shape.
- `data/model/index.ts`, `model-entities.ts`: `RenderedHeading`; `ui/html.ts`: `blockMarkdownParts`, so the preview tab gets headings from the same render function as the server.
- `views/shared/explorer/tree/control/picks.svelte.ts`: passes the new row-menu dependencies.
- `views/shared/prose/Code.svelte`, `rendered-headings.svelte.ts`: the focus mark and the heading publisher.
- `views/sources/source/Editor.svelte`, `save/SourceNote.svelte`, `status/source-status.svelte.ts`: the editor's `actions` prop; the refusal line now only carries first-Save and LaTeX words; the split of `Source.svelte`.
- Listed in the brief but not changed because nothing in them needed to change: `state/workbench/palette.ts`, `config/text/views/boards/editor.yml`, `shell/panes/TabView.svelte`. The palette rows come from the editor actions that `Source.svelte` publishes through the editor-status store.

## Judgment calls the brief left open (each reversible)

- A pointerdown or keydown ends a pending focus ask for another tab (`PaneBody.svelte` effect), so a late ask does not take the keyboard from what the reader moved to.
- `TabActions` keeps its map in a plain `#latest` and publishes a copy in `$state.raw`, because Svelte's teardown reads reactive state as it was before the flush.
- The tab menu's bookmark, browser tab and program calls live in `pages.ts` (boundaries row above).
- `data-tab-focus` is also on `Code.svelte`'s locked text and on `Source.svelte`'s cannot-open box, so those states end the ask on something.
- `RenderedMarkdown.svelte` takes `tabFocus` and `onheadings`; the source tab's rendered half passes neither.
- `ask-perform.ts` and `source-status.svelte.ts` live in a `status/` subfolder so `views/sources/source` stays at 10 items.
- Cmd+S is a `save` key action that always returns true so the default is prevented, and performs nothing while the palette, the tray or a dialog is open.
- The `headings` text is the library's `raw` heading text; the id is the prefixed one the HTML carries.
- `renderDocument` was deleted because its only caller moved to `renderDocumentParts`.

## Keys and ids this round introduces

- Action ids `oculus.save` (`SAVE_ACTION`), `oculus.revert`, `oculus.toggleRendered`, `oculus.previewSide`, `oculus.blame`, and `WRAP_ACTION`: one definition each in `status/ask-perform.ts` / `editor-status.svelte.ts` / `options.ts`; a duplicate id in `actions` would bind twice, and the list builds each once. Empty list: the palette lists none and `performAsk` falls through.
- Menu ids `add-bookmark`-style constants are module-private to `tab-menu.ts` and `row-menu.ts`; the tab menu offers add or remove, never both (`bookmarked` is boolean or null).
- Heading ids: the server and the client both take `getHeadingList()` of one parse, so a duplicated heading text gets the library's suffixed ids; the store is keyed by instance, `forget(instance, headings)` removes only the list it published, an ask is numbered, and a destroyed tab publishes nothing after close.

## Comments and documents that describe the changed behaviour

Rewritten: `HELP.md:49` (A file tab's actions), `:86` (Cmd+S row), the Outline sentences in the Files row (`:121`), `:168` (double click), the blame and preview sentences (`:103`, `:248`); `DESIGN.md:391`, `:395`, `:417`, `:422`, `:427`; head comments of `PaneBody.svelte`, `tab-actions.svelte.ts`, `armed-keep.svelte.ts`, `layout.svelte.ts` (`LayoutStore` docs), `opening.ts`, `Source.svelte`, `StripActions.svelte`, `Editor.svelte` (ui and source), `File.svelte`, `Document.svelte`, `Doc.svelte`, `MarkdownPreview.svelte`, `RenderedMarkdown.svelte`, `Code.svelte`, `ProgramButton.svelte`, `SourceNote.svelte`, `tab-menu.ts`, `row-menu.ts`, `Files.svelte:17,38`, `Sections.svelte:3`, `Outline.svelte`, `outline.ts`, `section-state.ts`, `context.ts` (`headings`), `markdown.ts` (`renderDocumentParts`), `server/content/docs.ts`; catalog entries in `source.yml`, `file.yml`, `files.yml`.

Still true: `Tree.svelte` and `RootedTree.svelte` head comments, `landing.ts`, `attention.ts`, `DESIGN.md:334`.

## Anything wrong in the brief

- Item 4 has `tab-menu-state.svelte.ts` import `fs`, `writes` and `fs-transport` for the bookmark, program and browser actions; `boundaries.test.ts` rejects those imports from `shell/`. The calls are in `state/workbench/navigation/pages.ts`.
- "`views/shared/links/` holds 10 items" was true before the deletions; it holds 6 now.
- Item 5b names `server/content/docs.ts` line numbers (`:88-93`, `:236-241`, `:316`, `:337-356`) that differ in the worktree after the change; the content matches.
- Case 24's counts (1, 6, 18) match `grep -c` on main's `docs/DATA-MAP.md` (`^# ` 1, `^## ` 6, `^### ` 18).

## Other

Two read-only git commands were typed by mistake in the work of this step (`git diff --stat` in round 0 and `git -C . status >/dev/null 2>&1` in round 2); both changed nothing. No browser, no server, no port, no `config/local.yml` was touched.
