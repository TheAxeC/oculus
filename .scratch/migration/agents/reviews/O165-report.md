# O165 report: the guides redesigned

Everything in the brief and in repair round 1 (`.scratch/migration/agents/briefs/O165-round-1.md`, items 1 to 13) is done.

## Open items of the state file, verbatim

From `.scratch/migration/orchestrator-state.md:182-186`:

> ## Open items (only what Axel must rule on; every report tells him these in plain words, decisions first, until he has ruled)
>
> An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own.
>
> None.

## Repair round 1: each item and how it was closed

1. **S1, Literature.** The Literature entry is gone (`grep -n "^### Literature$" docs/HELP.md` prints nothing). Its facts are one bullet of Collection views, `docs/HELP.md:318`: the key rule (`src/lib/server/edit/feeds/literature-key.ts:1-4`), Add by DOI, arXiv or PubMed and by address (`src/lib/views/shared/forms/entry/entry-add.ts:31-35`), Save to Literature with its hub question, and the duplicate refusal (`src/lib/server/edit/feeds/literature.ts:1-11`). The Collection views summary line, `docs/HELP.md:310`, names Literature among the views it covers.
2. **S2 and P1, the `h` row.** `docs/HELP.md` keys table: `| h1 / h2 / h3-h7 / h8, h9 | Help / Keyboard Shortcuts / the Apps guide, Templates, Data map, Palette and Decks guide, in the Help page's order / the hub's docs: entries of the Help group |`. Source: the Help arrangement `config/defaults/layout.yml:136-145` (help, keys, then the five `engine: true` docs in that order), `arrangedDocs` in `src/lib/state/workbench/navigation/arrangement.ts:206-224` (the group's views, then its engine docs, then its `docs:` entries), `Workbench.svelte:201-212` and `rail.ts:52-61` (digit = place). The `Cmd+K Shift+Enter` row reads "in the editor: pin or unpin the tab" (`src/lib/ui/controls/editor/chords.ts:15-17, 51`, `PIN_KEYS`). The User-visible changes line below gives the row as built.
3. **S3 and P3, what the screen shows.** The base sentences of case C3 are quoted in full below with their base lines. Every view entry was read against its strings in `config/text/views/` and its markup, and each sentence the screen draws is removed; the list of removals, each with the string or markup that shows it, is under "Sentences removed in this round because the screen draws them".
4. **S4.** `docs/HELP.md:494` (the paragraph under The keys) says the Keyboard Shortcuts view lists the keys of the workbench, the palette, the debugger, the editor, the LaTeX tab and the apps, and in the app the desktop app's own: the four row groups `Keys.svelte:109-114` draws (`workbenchRows`, which holds the workbench's, the palette's and the debugger's keys and in the app the desktop rows, `rows.ts:285-313`; `editorRows`, `rows.ts:315-322`; `latexRows`, `rows.ts:210-249`; `appRows`, `rows.ts:324-327`). It then says the table also gives the keys a view binds on its own box (the Present view's, the Files tree's and the Search view's). The Keyboard Shortcuts entry, `docs/HELP.md:427`, says the same.
5. **S5, citations.** Every paragraph, list item and table row of the three pages has its code below, under "Code read per paragraph, item and row". Sentences with no code to cite were removed; they are listed under "Sentences removed in this round for want of a citation".
6. **S6.** The base sentence of `HELP.md:3` ("It writes only where a control says so: ...") is removed: the full set of writes oculus makes without a control (the nested-repos block, the layout, the state files) is not one list in the code, so the sentence cannot be made true and complete. The write without a control is stated where it happens: the nested-repos block at `docs/data-map.md:383` ("writes that block alone, with no control", `src/lib/server/git/clone/exclude.ts:5-17`) and the layout at `docs/HELP.md:30`. `docs/HELP.md:173` gives the global option's range, 0 to 3 and 1 unset (`config/options/sources.yml:181-188`, `config/defaults/sources.yml:78`), and that a workspace folder's own `repository_scan_depth` takes any whole number from -1, -1 meaning no limit (`src/lib/server/files/workspace/folders.ts:15-17`, `src/lib/data/sources/config/merge/workspace-file.ts:35-41`); `docs/data-map.md:174` says the same.
7. **S7.** `docs/decks.md:120`: the categories go in the order of the hub's `deck_order`, set in the hub's `.oculus/config.yml` with a link to the data map's place, oculus's value in `config/catalogs/vocab.yml` (`deckOrderOf`, `src/lib/data/shapes/boards/order.ts:99-104`; a per-hub key, `src/lib/data/shapes/hub-keys.ts:36`; `vocab.yml:280`). "A deck reads no pin." is removed.
8. **S8, one home for a hub file's keys.** Deposit (`docs/HELP.md:121`), Inbox (`:127`), Calendar (`:148`), Live HPC (`:480`) and Settings (`:433`) link to the data map's section instead of restating the keys; so do Schedules (`:24`), Files (`:166`), Repositories (`:173`, `:180`), Debug (`:235`), Collection views (`:312`) and Findings (`:462`). The Live HPC sentence that restated the `resources` file's `host` field is now a link to Collection files. The Person sentence on `self` is removed under item 3.
9. **P2, the LaTeX chords.** The row `| Cmd+L, then Cmd+L / Ctrl+Shift+M | select the line / tab focus mode, so Tab leaves the editor, in a .tex tab; off macOS the second is Ctrl+M |` is in the keys table (`src/lib/data/helpers/keys/oculus/editor-keys.ts:50-51` LATEX_SCOPES `selectLine` and `tabFocus` both `tex`, `:66-82` SECONDS_MAC and the off-macOS `Cmd+M`). The first round's reason for dropping them is gone from this report.
10. **P4.** The section "Verify before you report 6: the prose rule" is below.
11. **ST1.** Each sentence of the three pages that said what something is not is rewritten to what it is or does, or removed. The named ones: base `HELP.md:88` (the landing rule's "never covers the tool views") is removed and the landing order stands alone at `docs/HELP.md:32`; base `:164` and `:413` are removed; `decks.md:120`'s "A deck reads no pin." is removed; `data-map.md:369` reads "Live HPC checks the keys `slurm.resource` lists, and says in that cluster's section which condition fails. A field that names a path is checked by the Audit, which reports a missing path for the `link` of the `funding`, `events`, `education` and `applications` files." Every rewrite is listed under "Sentences rewritten for ST1". What remains with a negative word is a condition that leads to a positive action ("a project no board takes ... is a finding", "a tab with no unsaved text reloads it") or a When unset value ("no group", "none").
12. **The Files row keys.** The keys table has nine Files rows from `ENTRIES`, `src/lib/state/sources/explorer/acts/keys.ts:43-61`: Enter, F2 (rename); Cmd+Down (open), Space (open in the background); Cmd+Enter (open beside, Files and Repositories); Cmd+Backspace (delete); Cmd+C, Cmd+X, Cmd+V and Esc (copy, cut, paste, drop the cut); Cmd+Alt+C and Cmd+Alt+Shift+C (copy the path, the relative path); Cmd+Z and Cmd+Shift+Z (undo, redo); Cmd+A, Shift+Up and Shift+Down (select all, extend). Alt+Up and Alt+Down keep their row. Cmd is Ctrl off macOS (`keys.ts:7-8, 73-83`).
13. **The "This machine's values" table.** Each row's code and When unset value are under "docs/data-map.md, This machine's values"; all come from `src/`. One value changed: `commit_message_account` unset is "Claude's default folder" (`src/lib/server/git/git-message.ts:45, 53-61`), in place of `~/.claude`. No `local.yml` file was read.

ST2 needed no change.

## The cases' first run (unchanged tree)

- C1: the registered views today's Help does not name are `awaiting_board`, `keys` and `recover` (`comm -23 c1-components.txt c1-help-all.txt` in the scratchpad's `O165build/`). Today's Help named the 16 boards and collection views one by one, with no single entry for the collection view or the project board, and the title bar, the update tray and Linux each had a subsection of their own.
- C2: the row `p1-p4` was false, since the shipped Projects group holds 6 boards (`config/defaults/layout.yml:216` `boards:`; `src/lib/state/workbench/navigation/catalogue.ts:219-244` `railOrder`). The deck rows are bound in the Present box (`src/lib/views/academic/present/screen/keys.ts:74-91` `moveOf`, and the box's o/O, f/F, p/P and Escape), not in `rows.ts`.
- C3: five sentences repeated the screen, quoted in full here from `git show HEAD:docs/HELP.md`:
  - `HELP.md:288`: "  - The form has a rule above it, a heading and a label over each box. A follow-up is headed "New follow-up" and asks What, Not before, Lead, Supervisors and Collaborators; a subtask is headed "New subtask" and asks What, Deadline, Lead, Supervisors and Collaborators. Lead, Supervisors and Collaborators each pick any number of the people the registry holds. A line's Edit form asks the same, its three picks starting from the line's people, and a save writes only the fields it changed." (against `config/text/views/boards/project.yml:34-37`)
  - `HELP.md:314`: "- **The board's header.** After New project come Cards and List, the one in force pressed, Full titles, pressed while the cards and rows show full titles instead of short handles, and, in list mode, Columns." (against `config/text/views/boards/projects.yml:20, 45`)
  - `HELP.md:306`: "  - The strips: a project has Ask, Open Workbench and Open project page; an entry Open Workbench at its folder and Page; a venue, a dataset, a domain and a pillar line Page; a lead Applied and Page; a Lit Watch paper Dismiss (Restore while dismissed) and Page; a LinkedIn post Mark posted while an idea, and Edit; an inbox thread Draft reply, Triaged (Restore once triaged) and Archive. On a record's own page Edit stands where Page stood. A card of the Career page has Edit. A Literature search hit has none, its Open PDF, Copy BibTeX, Add to Lit Watch and Save to Literature drawn in its top row. Archival, Orphans and No funding have none; their title opens a page listing their projects as closed project cards." (against `config/text/views/feeds/literature.yml:5, 14, 38, 94`)
  - `HELP.md:90`: "- The Workbenches view (`w` then `3`) has Open (one row per open workbench, with its folder and branch) and Closed (kept layouts, last closed first). Reopen restores a kept layout; Forget drops it. New workbench opens one for a root, or for a folder picked in the folder panel." (against `config/text/views/system/workbench.yml:293-302`)
  - `HELP.md:262`: "| `apps` | Apps | Every app, with its state, Add app from folder, Disable, Enable, Remove. |" (against `config/text/views/apps/apps.yml:101-102`)
- C4: today's map named the files of item 2 but left out the keys of `local.yml`, `bookmarks.yml`, `schedules.yml`, the workspace file, the tasks, the repository's `settings.yml`, `commands.yml`, `launch.yml` and `cpp.yml`, and the app-data files. Its config block listed the 69 entries of `HUB_LIST` (`src/lib/data/helpers/hub-names.ts:712-792`).
- C5: today's guide matched `spec.ts`, `kinds.ts` and `project.ts`: every key was present and all 10 kinds had an example. Summary and grid are order entries, not kinds.
- C6: every item 5 line was true of today's pages.
- C7: `npx vitest run tests/checks/source/history.test.ts --reporter=dot` failed both times it ran: 5 passed and 1 failed, the case "names no package id, date or session in any comment" timing out at its 5000 ms default (13769 ms, load average about 9.8). The documents test passed.
- C8: every link of the three pages resolved, `HELP.md#the-keys` of `src/lib/views/shared/prose/doc-link.ts:3` included.
- No case showed a rule of the brief to be wrong, so there was no stop.

## DONE / NOT DONE

| Item | State | Proof |
|---|---|---|
| 1 Help: one entry per view the reader reaches, the collection view and the project board one entry each, each shell part one entry | DONE | `grep -n "^#" docs/HELP.md`: 5 entries under The window (The rail, Pages and panes, Workbenches, The palette, The status bar) and 64 under The views (listed below) |
| 1 Help: one sentence on what the view is for, then only what its screen does not show | DONE | each entry read against its strings and markup; the removals are listed below |
| 1 Help: a keys table under "The keys", each row true of a binding, the deck rows of ruling 706 kept | DONE | `grep -n "^## The keys" docs/HELP.md` gives line 492; each row's binding is listed below |
| 2 Data map: each hub file oculus reads, with its path, keys and links | DONE | `grep -n "^## " docs/data-map.md`; the code per paragraph and table below |
| 3 Decks guide: a deck's files, the keys with their values when unset, one example per slide kind | DONE | `grep -n "When unset\|^### " docs/decks.md` shows two tables with a When unset column and 10 kind headings |
| 4 every sentence true and needed; the kept sentences quoted | DONE | the kept lists and the citations are below |
| 5 the lines describing or citing the pages left true | DONE | below |
| 6 headings and counts before and after | DONE | below |
| Round 1 items 1 to 13 | DONE | each closed above |
| Check 3 (the brief's character-set check over the 12 files) | DONE | `LC_ALL=C perl -ne 'my $l = $_; $l =~ s/\xC3[\x80-\xBF]//g if $ARGV =~ m{^config/}; print "$ARGV:$.:$_" if $l =~ /[^\x20-\x7E\n]/; close ARGV if eof' docs/HELP.md docs/data-map.md docs/decks.md README.md docs/templates.md docs/apps.md src/lib/state/workbench/layout/open/float/return-place.ts src/lib/ui/controls/editor/chords.ts tests/server/git/clone-exclude.test.ts tests/server/git/git-scan-depth.test.ts config/defaults/sources.yml config/text/views/system/help.yml; echo "check3 exit $?"` printed no line and `check3 exit 0`, after the last change |
| Check 4 (the counts) | DONE | `wc -l -w docs/HELP.md docs/data-map.md docs/decks.md` prints 571 6890, 383 5542, 361 3049 after the last change |
| spec.md verify: `LC_ALL=C grep -n '[^ -~]'` over the touched pages and README | DONE | `LC_ALL=C grep -n '[^ -~]' docs/HELP.md docs/data-map.md docs/decks.md README.md; echo "grep exit $?"` printed no line and `grep exit 1` |
| History words in the changed comments | DONE | `git diff -U0 -- src tests \| grep "^+" \| grep -inE "\b(now\|no longer\|used to\|previously\|formerly\|renamed\|moved\|was\|were)\b"` prints one line: the return-place comment's "which moved or closed that node", which describes a page rearranged at runtime; `git show HEAD:` of the file has the same clause |
| Comment width of the changed comment | DONE | `awk 'length>100' src/lib/state/workbench/layout/open/float/return-place.ts \| wc -l` prints 0 |
| C8 links | DONE | `grep -rnoh "HELP.md#[a-z0-9-]*\|data-map.md#[a-z0-9-]*\|decks.md#[a-z0-9-]*"` over src, config, docs, README.md and tests lists `HELP.md#the-keys` and seven data-map anchors; each matches a heading under GitHub's slug rule (`src/lib/data/prose/markdown/markdown.ts:10`): the-files, the-hubs-settings, this-machines-values, the-workspace-file, bookmarks-schedules-and-tasks, collection-files, repositories-below-a-hub. `## The keys` is `docs/HELP.md:492` |
| `npm run diagrams` then `npm run test:quick` after the last change | DONE | `(npm run diagrams && npm run test:quick) > O165build/quick6.log 2>&1; echo "exit $?"` printed `exit 0`; every step printed `ok`: prettier, ASCII gate, svelte-kit sync, eslint, svelte-check (585 files, 0 errors, 0 warnings), vitest, vitest slow and vitest checks (`test:quick: 105.2 s; every command passed`). It does not cover tests that reach no changed file within the import depth, the build, or the lint of unchanged files (its own "not covered" line). `git status --short` after it lists the 8 modified files, the round-1 brief and this report; diagrams changed no tracked file |
| Number of full-list runs | 6 started, 5 complete | Runs 1 to 4 are the first round's: runs 1 and 3 passed every step; run 2 failed only in "vitest slow", two real-git cases in `clone-exclude.test.ts` and `git-scan-depth.test.ts` timing out at 20000 ms under a load average of 18.65, and those two files run alone (`npx vitest run tests/server/git/clone-exclude.test.ts tests/server/git/git-scan-depth.test.ts --tagsFilter slow --testTimeout 20000`) passed 18 of 18, 10 skipped; run 4 passed every step. Run 5 of this round was stopped before it finished, because `README.md:95` was changed after it started. Run 6 started after the last change of this round and passed every step |
| `sh utils/unused-exports.sh` | not needed | no export was added or removed |

## docs/HELP.md

Before: 646 lines, 32223 words (`git show HEAD:docs/HELP.md | wc -l -w`). After: 571 lines, 6890 words (`wc -l -w docs/HELP.md`).

Headings before: The window (On Linux and WSL2, The title bar, The rail, Pages and the pane tree, Workbenches, The palette, The update tray and schedules, The status bar and notifications); The keys; The views (Entries and their editor, Notes on single views, LaTeX builds); Files and the editor (Notes, Language servers, Hub keys in YAML, Linters); Searching the files; Terminals; Project commands; Debugging; Apps; Source Control and worktrees; Configuration and the data (Hubs and projects, Mail and calendar, Git hosts and clusters).

Headings after (`grep -n "^#" docs/HELP.md`): Oculus; Contents; The window (The rail, Pages and panes, Workbenches, The palette, The status bar); The views (Focus, Awaiting board, Project boards, Project, Editor, Deposit, Inbox, Position Leads, LinkedIn, Calendar, Post, Files, Repositories, Sessions, Search, TeX view, Terminal, Problems, References, Debug, Debug Console, Notes Graph, Session, Source, File, Document, Doc, Markdown Preview, Math Preview, Diff, Merge, Refactor Preview, Customization, Language server output, Collection views, Memories, Career, Entry, Pillars, Domains, Map, Listing, Venues, Journal Browser, Data, Person, Recover, Literature search, Lit Watch, Present, Apps, Help, Keyboard Shortcuts, Settings, Account setup, Views, Pages, Status, Findings, History, Processes, Live HPC, Usage, Workbenches view); The keys.

The order is the rail's (`config/defaults/layout.yml:9-21`) and each group's `order` (the registrations under `src/lib/views`), a view opened for one thing after the group of the view that opens it (decision 2).

### Code read per paragraph, item and row

Line numbers are of `docs/HELP.md` as it stands. A view's head comment is the leading comment of its component, given with its range.

The window:

- 3: the four guides and `README.md` exist (`test -f`); `src/lib/views/sources/doc/Doc.svelte:18-73` (the guides open as Doc tabs).
- 13: `src/desktop/app.ts:1-11, 284-289, 326-334` (single instance, quit leaves tmux, the restart dialog, windows reconnect), `src/desktop/windows/menu-template.ts:1-12` (menu items run the page commands), `src/lib/server/root/process/start/first-run.ts:14-22` (zenity, xdg-open, wslview, optional lacks), `src/lib/server/root/process/build-folders.ts:1-18` (the app forms).
- 17: `config/defaults/layout.yml:8`, `src/lib/data/sources/config/merge/keyed.ts:2, 7` (the workspace overlay by `page`).
- 19: `layout.yml:33` (arrangements, Reset), `src/lib/state/workbench/navigation/pages.ts:326-336`.
- 20: `src/lib/shell/rail/rail.ts:1-5, 76-82` (URGENT_TONES red, amber, green), `layout.yml:303` (`counts`), `src/lib/views/boards/projects/Projects.svelte:2-9`.
- 21: `src/lib/server/edit/writes/config/lists/rail.ts:1-14, 30-44`.
- 22: `rail.ts` (server) `:30-44` (`unplaced_collections`, `project_boards`), `src/lib/state/workbench/navigation/catalogue.ts:219-244`.
- 23: `src/lib/server/machine/runs/schedules/task.ts:5-14`, `src/lib/server/machine/runs/schedules/watch.ts:1-7`, `src/lib/server/machine/pty/start/context.ts:3, 37` (`chat_context`).
- 24: `src/lib/server/machine/runs/schedules/run.ts:1-16, 87`, `watch.ts:1-4, 16-25`.

Pages and panes:

- 28: `src/lib/state/workbench/layout/model.ts`, `tree.ts` (a page is one tree of splits and panes), `layout/workbench.ts:11-14`.
- 30: `src/lib/server/files/workspace/page-state/files.ts:2, 19` (`layouts.json`).
- 31: `src/lib/state/workbench/layout/open/opening.ts:4-8`, and `grep -rn "unique: true" src/lib/views` lists Status, Settings, Pages, Workbenches, Findings, Processes, Usage, Hpc, History, Focus and Apps.
- 32: `src/lib/state/workbench/layout/open/landing.ts:1-11` and the rule below it.
- 33: `opening.ts:179-181` (`options.preview`).
- 34: `src/lib/shell/panes/floats/FloatLayer.svelte:25`, `float-geometry.ts:18` (SNAP_PX 24), `src/lib/state/workbench/layout/open/float/return-place.ts:1-6`.
- 35: `layout.yml:33` (an empty pane of the arrangement), `src/lib/state/workbench/layout.svelte.ts:688` (Lock Group).
- 36: `layout.yml:33` (pinned tabs: Close All, Close Others and Cmd+W leave them open).
- 37: `src/lib/state/workbench/layout/tabs/closed.ts:19` (20), `src/lib/state/workbench/history/history.ts:16` (HISTORY_MAX 50).
- 38: `src/lib/state/forms/form-draft.ts:1-3`, `src/lib/state/sessions/source/source.svelte.ts:430-433`.
- 39: `src/lib/ui/menu/ContextMenu.svelte:4, 29, 135`.

Workbenches:

- 43: `src/lib/state/workbench/layout/open/float/folder-opener.ts:1-14`, `layout.yml:183` (`workbench:`).
- 45: `config/text/views/boards/project.yml:161`, `collection.yml:30-32`, `entry.yml:18`, `shared/folder-files.yml:7`; Open in New Files `config/text/views/sources/files.yml:104-154`.
- 46: `src/lib/state/workbench/layout/open/float/folder-pages.ts:5`.
- 47: `folder-opener.ts:9-13`.
- 48: `folder-pages.ts:5-11`, `model.ts:213` (KEPT_MAX 20), `folder-opener.ts:5` (Reset layout).

The palette:

- 52, 54: `src/lib/state/workbench/palette.ts:1-18`, `src/lib/data/helpers/keys/oculus/palette-keys.ts` (`paletteKeyOf`).
- 55: `palette.ts:1, 67-71` (fuzzy), `palette.ts:778-790` (the modes); every command in `docs/palette.md`.
- 56: `palette.ts:778-787` (`#` the symbols mode).
- 57: `src/lib/shell/keys/lists/file-window.svelte.ts:2` (200), `src/lib/data/helpers/search/query.ts:53-54, 342-344` (`--files --hidden`, SKIP_GLOBS), `config/defaults/behavior.yml:489-493`.
- 58: `src/lib/state/forms/new-entry.ts:1-5, 102-121` (`default_task`), `config/catalogs/vocab.yml:108, 133`, `src/lib/shell/keys/lists/task-hub-list.svelte.ts:1-7`.

The status bar:

- 62, 64: `src/lib/shell/status/status-items.ts:1-3, 15-19`.
- 65: `status-items.ts:19-22`.
- 66: `status-items.ts:1-3`, `src/lib/shell/status/StatusBar.svelte:102`.
- 67: `src/lib/shell/status/notices/Bell.svelte:2-10`.

The views (one line per entry; the first line number is the summary sentence):

- Focus 73-79: `src/lib/views/boards/focus/Focus.svelte:15-52`, `config/defaults/behavior.yml:50, 62`, `config/catalogs/vocab.yml:182-192` (lanes, `move_writes`), `vocab.yml:61, 103` (`deadline_met`), `src/lib/state/boards/focus/filter.ts:321` (a feed line stays), `vocab.yml:197, 203, 210`, `config/defaults/sources.yml:47-48` (`band_teaching`, `band_positions`).
- Awaiting board 83-85: `Projects.svelte:11-14, 47-52`, `Focus.svelte:43-49`.
- Project boards 89-96: `Projects.svelte:2-9, 40-84`, `layout.yml:216-260` (`boards:`), `vocab.yml:260, 270` (`roles`, `categories`), `src/lib/state/boards/board/new-project.ts`, `config/defaults/sources.yml:20-21` (`new_project_dir`), `src/lib/views/shared/card/project/ProjectCard.svelte:13, 295-297` (preview tab), `src/lib/server/content/audit/projects.ts:3-9, 396-406`.
- Project 100-103: `src/lib/views/boards/project/Project.svelte:2-54`, `behavior.yml:70-76` (`file_index`), `config/schemas/manifest-schema.yml:88-91` (`after`, `done`).
- Editor 107-112: `src/lib/views/boards/editor/Editor.svelte:15-53`, `src/lib/server/core/files/yaml/yaml-edit.ts:1-6` (one field's bytes), `src/lib/server/machine/lsp/adapters/yaml/hub-keys.ts:22` (F2), `src/lib/state/forms/new-entry.ts:1-5` (`addPerson`).
- Deposit 116-121: `src/lib/views/boards/deposit/Deposit.svelte:16-41`, `src/lib/server/git/deposit/deposit-git.ts:143-146`, `src/lib/server/git/deposit/zenodo-copy.ts:6-14` (a file holding a term refuses), `zenodo.ts:11-20` (new version or new record; the manifest writes).
- Inbox 125-130: `src/lib/views/feeds/inbox/Inbox.svelte:20-36`, `src/lib/server/accounts/mail/plate.ts:4-8`, `triage.ts:1-7, 33-34`, `InboxCard.svelte:8-10`, `microsoft.ts:1`.
- Position Leads 134-138: `src/lib/views/feeds/leads/Leads.svelte:17-34`, `src/lib/state/feeds/lead-application.ts:1-7`, `lead-apply.ts:1-10`, `LeadCard.svelte:23-29`, `src/lib/state/feeds/leads.ts:1-5, 43`.
- LinkedIn 142: `src/lib/views/feeds/linkedin/Linkedin.svelte:2-33`, `config/defaults/sources.yml:60-63`.
- Calendar 146-149: `src/lib/views/personal/calendar/Calendar.svelte:22-41`, `src/lib/server/accounts/connect/store.ts:19-21, 48`, `src/lib/server/accounts/calendar/poll.ts:12-14`, `connectors.ts:263-265`.
- Post 153-155: `src/lib/views/feeds/post/Post.svelte:16-24`.
- Files 159-167: `src/lib/views/sources/files/Files.svelte:15-73`, `src/lib/server/files/fs/history.ts:4, 10-11, 17-20`, `file-undo.ts:9, 15`, `src/lib/server/files/fs/notes.ts:1-17`, `behavior.yml:451` (800 ms), `src/lib/data/prose/markdown/note-names.ts:6-12`, `note-attach.ts:1-8`, `src/lib/views/shared/explorer/tree/make/make-words.ts`, `src/lib/server/machine/apps/reach/private.ts:1-3`, `search-routes.ts:19`.
- Repositories 171-180: `src/lib/views/sources/repositories/Repositories.svelte:2-73`, `config/options/sources.yml:181-188`, `config/defaults/sources.yml:78`, `folders.ts:15-17`, `workspace-file.ts:35-41`, `src/lib/server/git/git-write.ts:16-17, 34-38, 107, 112, 539-544`, `deposit-git.ts:18-23` (the one force push), `autofetch.ts:1-4`, `behavior.yml:472`, `RepoItems.svelte:35`, `credentials.ts:4-5`, `exclude.ts:5-17`.
- Sessions 184-187: `src/lib/views/sessions/session-list/SessionList.svelte:2-5, 23-27, 46-50`, `src/lib/state/sessions/folds.ts:162-172`.
- Search 191-195: `src/lib/server/files/search/search.ts:1-12, 20-24`, `src/lib/data/helpers/search/query.ts:14, 26-34, 51-54, 166-189`, `config/text/views/sources/files.yml:150`, `behavior.yml:489-492`, `replace.ts:14-19, 23`.
- TeX view 199-205: `src/lib/views/academic/latex/Latex.svelte:17-28`, `root.ts:5`, `latex.ts:17`, `recipes.ts:2, 13, 72`, `LatexItem.svelte:10`, `builds.ts:40`, `saves.ts:2`, `endpoint.ts:494`.
- Terminal 209-215: `src/lib/views/sessions/terminal/Terminal.svelte:15-73`, `composer.ts:390`, `src/lib/server/machine/pty/routes.ts:325`, `channel.ts:16-22, 30, 64`, `src/lib/state/sessions/terminal/terminal-tabs.ts:124-141`, `pty/sessions.ts:13`, `src/lib/state/workbench/navigation/pages.ts:153`.
- Problems 219-223: `src/lib/views/sources/search/Problems.svelte:19-48` (`:33-34` the filter).
- References 227-229: `src/lib/views/sources/search/References.svelte:15-41`.
- Debug 233-237: `src/lib/views/system/machine/debug/Debug.svelte:16-30`, `src/lib/server/machine/debug/launch/read.ts:1-13`, `debug/routes.ts:7`, `page-state/files.ts:5, 22`.
- Debug Console 241: `src/lib/views/system/machine/debug/Console.svelte:2-31`.
- Notes Graph 245: `src/lib/views/sources/notes-graph/NotesGraph.svelte:16-29`.
- Session 249: `src/lib/views/sessions/session-detail/SessionDetail.svelte:2-20`.
- Source 253-262: `src/lib/views/sources/source/Source.svelte:16-81`, `editor-options.ts:101, 104`, `autosave.svelte.ts:3`, `cpp-file.ts:5`, `src/lib/server/machine/lsp/held/held.ts:10-12` (60 s), `src/lib/server/machine/lsp/adapters/yaml/hub-keys.ts:22`.
- File 266, Document 270, Doc 274, Markdown Preview 278-280, Math Preview 284: the head comments `File.svelte:16-84`, `Document.svelte:16-50`, `Doc.svelte:18-73`, `MarkdownPreview.svelte:18-41`, `latex-widget.ts:132` (KaTeX `throwOnError: false`), `MathPreview.svelte:17-25`.
- Diff 288-290, Merge 294, Refactor Preview 298: `Diff.svelte:18-55` (`:38-39`), `Merge.svelte:18-45` (`:34-36`), `RefactorPreview.svelte:18-30`.
- Customization 302: `src/lib/views/sessions/customization/CustomizationView.svelte:2-20`. Language server output 306: `src/lib/views/system/machine/output/Output.svelte:17-22`.
- Collection views 310-318: `src/lib/views/boards/collection/Collection.svelte:11-56, 225-227, 271-276`, `config/defaults/sources.yml:26-55`, `src/lib/data/model/model-collections.ts:167, 185` (display), `entry-add.ts:3, 16-17, 31-35`, `src/lib/server/edit/primary-key.ts:1-10`, `literature-key.ts:1-4`, `server/edit/feeds/literature.ts:1-11`.
- Memories 322-325: `src/lib/views/personal/memories/Memories.svelte:16-36`.
- Career 329-332: `src/lib/views/academic/career/Career.svelte:16-35`.
- Entry 336-338: `src/lib/views/boards/entry/Entry.svelte:17-52` (`:28-29` Delete and Undo).
- Pillars 342-344, Domains 348, Map 352-356, Listing 360: `Pillars.svelte:14-27`, `Domains.svelte:2-16`, `Map.svelte:15-37`, `Listing.svelte:16-25`.
- Venues 364-367, Journal Browser 371-373: `Venues.svelte:14-26`, `Browser.svelte:15-25`, `registries/browser.ts:8, 157`.
- Data 377-379: `src/lib/views/sources/data/Data.svelte:14-17`.
- Person 383: `src/lib/views/boards/person/Person.svelte:17-50`.
- Recover 387-391: `src/lib/views/sources/data/recover/Recover.svelte:16-28`.
- Literature search 395-398: `src/lib/views/feeds/literature/Literature.svelte:2-5`, `behavior.yml:496`.
- Lit Watch 402: `src/lib/views/feeds/radar/Radar.svelte:15-27`.
- Present 406-411: `src/lib/views/academic/present/Present.svelte:15-85`, `src/lib/state/boards/board/state.ts:157, 170`.
- Apps 415-419: `src/lib/views/apps/Apps.svelte:18-33`, `AppFrame.svelte:13`, `apps/shell/contributions.ts:3`, `private.ts:1-3`.
- Help 423: `src/lib/views/system/help/Help.svelte:2-5, 18-23`, `layout.yml:136-145`.
- Keyboard Shortcuts 427: `Keys.svelte:16-26, 109-114`, `rows.ts:285-327`.
- Settings 431-436: `src/lib/views/system/workbench/Settings.svelte:15-67`, `src/lib/data/sources/config/local.ts:131-138` (no value of a `downloads` row reaches a page).
- Account setup 440-444: `AccountSetup.svelte:17-34`, `src/lib/server/machine/hpc/clusters/keys.ts:4-15`, `askpass.ts:1-3`, `credentials.ts:5`.
- Views 448: `Catalogue.svelte:15-50`. Pages 452: `Pages.svelte:15-25`. Status 456: `Status.svelte:15-28`.
- Findings 460-464: `Findings.svelte:20-48`, `config/text/views/system/audit.yml:73`.
- History 468-470: `History.svelte:17-44`.
- Processes 474: `Processes.svelte:2-27`.
- Live HPC 478-482: `Hpc.svelte:22-28`, `connectors.ts:64`, `src/lib/server/machine/hpc/ssh.ts:46-57`, `submit.ts:1-14`, `scratch.ts:2, 29-32`, `transfer.ts:11-12`.
- Usage 486: `Usage.svelte:19-40`. Workbenches view 490: `Workbenches.svelte:17-35`.

The keys:

- 494: `Keys.svelte:109-114`, `rows.ts:285-327`, `catalogue.ts:219-249` (the chords), `layout.yml:9-21` (`chord`), `src/lib/data/helpers/keys/oculus/resolve.ts:376-379` (letter then digit), Cmd as Ctrl off macOS in each key table.
- the digits, Ctrl+digit, Ctrl+] and Ctrl+[, `n`, `/`, `g g`, `G`, j, k, i, o, Esc and Enter: `resolve.ts:376-379` and its chord and cursor code
- Ctrl+Tab: `src/lib/data/helpers/keys/oculus/page-keys.ts:44-47`
- Cmd+W, Cmd+N, Cmd+F, Cmd+T and Cmd+Shift+T: `resolve.ts:174-181`, `page-keys.ts:35`
- Ctrl+- and Ctrl+Shift+-: `resolve.ts` back and forward bindings, `history.ts:16`
- Cmd+Shift+N, Cmd+Shift+W, Cmd+, and Cmd+R: OWN_ACCELERATORS in `desktop-keys.ts`
- Tab and Shift+Tab, the arrows and Home and End of the rail, the strip and the tree: `src/lib/ui/tree/tree-keys.ts`, `src/lib/shell/rail/rail.ts:1-5` (`nextStop`)
- Delete on a tab: `src/lib/ui/tabs/Tabs.svelte:252`
- the group chords f1 to y1-y8, w1-w3, a1-a9 and the `h` row: `catalogue.ts:219-249`, `layout.yml:9-21, 136-145, 334`, `src/routes/views.ts:211-261`, `arrangement.ts:206-224`
- Cmd+Shift+F and Cmd+Shift+H, the Search box rows and the Search row keys: `src/lib/state/sources/search/keys.ts:35-40`, `box-keys.ts`
- the Files rows: `src/lib/state/sources/explorer/acts/keys.ts:43-61`
- Cmd+S: `resolve.ts:168-171, 280`, `src/lib/shell/window/source-keys.ts:28-33`
- Alt+Z: `src/lib/views/sources/source/status/ask-perform.ts:75-79`
- build, test, Problems and F8: `resolve.ts:116-117, 141-157`
- the LaTeX rows, Cmd+L Cmd+L and Cmd+L Ctrl+Shift+M among them: `src/lib/data/helpers/keys/oculus/editor-keys.ts:50-51, 66-82`, `src/lib/ui/controls/editor/kit/latex/latex-editing.ts:187, 204`
- Cmd+K, Cmd+Shift+P, F1, Cmd+P, Cmd+T, Shift+Enter and `:`: `palette-table.ts` (KEY_ROWS, PREFIX_ROWS)
- Cmd+K Shift+Enter: `chords.ts:15-17, 51`
- F2, F12, Cmd+click: `src/lib/views/shared/prose/editor/lsp.ts:127-133`, `hub-keys.ts:22`
- Shift+Alt+F12, F4 and Shift+F4, Shift+Alt+H, Alt+O: `lsp.ts:127-133`
- Alt+F5 and Shift+Alt+F5: `gutter.ts:116-117`
- F5, Shift+F5, Cmd+Shift+F5, F9, F10, F11 and Shift+F11: the debugger's bindings in `workbenchBindings`, `rows.ts:285-313`
- the Debug Console row: `Console.svelte:2-31`
- Ctrl+Enter and Cmd+Enter: the commit box and the diff comment box bindings, `resolve.ts`
- the terminal row: `src/lib/views/sessions/terminal/terminal-list.ts:216-226`
- Shift+F10: `ContextMenu.svelte:135, 277`
- the float handle: `src/lib/ui/frame/sash/Sash.svelte`
- the Present rows: `src/lib/views/academic/present/screen/keys.ts:74-91`, and the box's o/O, f/F, p/P and Escape

### Sentences removed in this round because the screen draws them

Each is a sentence of the first round's page; the string or markup that shows it follows.

- The Views entry's click sentence: `workbench.catalogue_hint`, `config/text/views/system/workbench.yml:126`.
- The Pages entry's row-controls sentence: `pages_close`, `pages_rename`, `pages_reset`, `workbench.yml:130-136`, drawn on each row (`Pages.svelte:20-24`).
- The Pages entry's Reset all pages bullet: `reset_all`, `reset_all_tip`, `workbench.yml:178, 181`.
- The Workbenches view's "Reopen restores a kept layout, and Forget drops it": `workbenches_forget`, `workbenches_forget_question`, `workbenches_forget_detail`, `workbench.yml:293-295`.
- Processes' "with Stop, which asks first, and Restart": `host_restart`, `host_stop_question`, `config/text/views/system/machine/processes.yml:41, 46`.
- LinkedIn's Mark posted bullet: `markpost_tip`, `config/text/views/feeds/linkedin.yml:18`.
- Deposit's For review and Publish descriptions (the anonymisation, Anonymous, the share link, the real files and authors, the confirmations): `zenodo_review_confirm`, `zenodo_review_detail`, `zenodo_review_title`, `zenodo_publish_confirm`, `zenodo_publish_detail`, `zenodo_publish_title`, `config/text/views/boards/deposit.yml:83-89`; the sign-in row: `zenodo_off`, `deposit.yml:81`.
- Person's "this is me" bullet and its disabled clause: `self`, `self_tip`, `self_held_tip`, `self_no_primary_tip`, `config/text/views/boards/person.yml:10-15`.
- Session's Resume bullet: `resume_confirm` and `resume_live`, `config/text/views/sessions/session-detail.yml:34, 36`.
- Terminal's "Lock leaves every grid and steer box of the tab read-only": `terminal_lock_tip`, `config/text/views/sessions/terminal.yml:105`.
- Repositories' New worktree path and branch, and the branch going with a removed worktree: `worktree_new_detail`, `remove_detail`, `config/text/views/sources/repositories.yml:254, 269`.
- Present's "Export to PDF writes `<name>.pdf` in the deck's folder": `export_tip`, `config/text/views/academic/present.yml:54`.
- Findings' "and the finding leaves the count": `mute_tip`, `config/text/views/system/audit.yml:19`.
- Inbox's "each behind a confirmation": the confirm the card draws before Send and Archive, `InboxCard.svelte:8-10`, and `archive_tip`, `config/text/views/feeds/inbox.yml:10`.
- Search's "asks first" of Replace All: the confirm of `Search.svelte:37-38`.
- Settings' "is shown as Set or Not set": `secret_set`, `secret_unset`, `workbench.yml:112-113`.
- Position Leads' "opens the Applications file beside the leads with a new entry filled from the lead ... then sets the lead applied; ... it asks which": `applied_tip`, `applied_hub_tip`, `config/text/views/feeds/leads.yml:6-7`; the disabled title: `applied_none`, `leads.yml:8`.
- Career's sentence naming the files Write the website writes: `website_tip`, `website_tip_run`, `config/text/views/academic/career.yml:27-28`; and "Edit needs the file's `schema:`": `no_schema`, `career.yml:10`.
- Entry's "An entry of a file with no `schema:` opens a read-only page": `no_schema`, `config/text/views/boards/entry.yml:13`, and the page drawing no control that writes (`Entry.svelte:31-34`).
- Apps' Remove and the approval labels: `menu_remove`, `remove_question`, `remove_confirm`, `config/text/views/apps/apps.yml:101, 118, 124`.

### Sentences removed in this round for want of a citation

- "Every drag has a menu equivalent" (the drag clause of the Shift+F10 item): no code states it as a rule; the item keeps Shift+F10 (`ContextMenu.svelte:4`).
- "while a tab holds it every control that would write that file is disabled": no single module gives it; the item keeps that the unsaved text survives (`form-draft.ts:1-3`, `source.svelte.ts:430-433`).
- Collection views' "those references become findings" after a delete: `Entry.svelte:28-29` gives the question and the Undo only; the Delete item moved to Entry with that text.
- The Files sentence on a 32 MB upload limit, Repositories' commit signing and its list of what asks first, Search's "searched even when hidden or ignored", the TeX view's `brew install texlab`, and Debug's list of what `rite_dap` lacks: no code was found that states them.

### Sentences rewritten for ST1

Help: the landing rule (no "never covers the tool views"); Lock Group; pinned tabs ("only Close in a tab's menu closes one"); the status bar menu ("offers Save Workspace As..."); Mine only ("a feed line stays"); New project ("It is on the boards whose rule takes the project it writes"); Other ("for any other project that names people"); the Editor rename (F2); the local history ("up to 256 KB"); Make Folder a Hub ("stops at a folder that holds one of its files, and names it"); the secrets folder ("left out of"); the force push ("Only a deposit's snapshot is force-pushed"); autofetch ("0 is the default"); the hooks write ("has no time limit and Cancel stops it"); the terminal close ("keep them running"); the Literature search ("is asked once that row is set"); Journal Browser ("Only a press asks the browser"); Present's filter ("leaves the deck's files as they are"); Apps ("reaches the folders of the workspace apart from ..."); Settings ("its comments and its other keys kept"; "its value stays on the server"); Account setup ("keeps a key file that is there"); Live HPC ("adds and updates files on the cluster"); the File view ("for any other file the editor leaves to it"); the chords ("the first nine views of a group have a chord"); Findings ("applies once the hub sets it"); Pages ("each shown by a press on its row"). Removed: the intro's "It writes only where a control says so ..." and the page's structure sentence; base `HELP.md:88`, `:150`, `:164`, `:183`, `:247`, `:310` (Discard), `:413`, the "no pause" Debug sentence, and the negative list of the Account setup password.

Data map: `:31` ("in the folder the key names"); `:44` ("which oculus writes ... or where the keys of `local.yml` put them"); `:50` ("Any other key is a finding, and oculus skips it"); `:124` ("the deck skips it", `order.ts:88-90`); `:128` and `:134` ("the primary's value stands", `machine.ts:8-9`); `:174` (the depth's range; the sentence on a workspace without `primary:` removed); `:195` (`unattended` starts the session with `--dangerously-skip-permissions`, `run.ts:87`); `:210` ("A collection has a view while a hub lists it"); `:231` ("whatever its schema"); `:233` ("Any other type is read as `text`"); `:252` ("a field of one value"); `:270` ("the user name comes from this machine's row"); `:282` ("skips a dot folder, `node_modules` and a symbolic link"); `:288` ("read-only", `manifest-schema.yml:8, 49`); `:307` ("kept away from its usual place"); `:311` ("takes it off the Focus board"; "A project's Focus lane follows from its stage and chips"); `:315` ("the field's list is empty"); `:369` (as in item 11); `:383` ("writes that block alone, with no control").

Decks guide: `:13` ("A deck folder needs its `present.yml`, and one that lacks it is a finding"); `:66` ("The reader reads the keys below"); `:102` (the frame "anything but a map of `width` and `height`, each in its range"; the list "written in brackets even for one word"; "while all four are unset"; "the group skips it"); `:106` ("one of the four below"); `:111` ("is placed once", `read.ts:13-14`); `:112`, `:322` and `:361` ("a deck of no project"); `:120` (item 7); `:123` ("finds outside the group"); `:127` ("outside a fenced code block and an HTML comment"); `:128` ("A blank line after a slide's `---` starts its body at once"); `:129` ("fails to parse"); `:130` ("Its first line with words"; "A slide needs a heading, or ... a title ...; one that lacks both is a finding"); `:162` ("Any other `kind:` is a finding, and the deck skips the slide", `kinds.ts:266-273`); `:212` and `:257` ("alone"); `:323` ("They narrow the slides on screen and leave `present.yml` and the slide files as they are"); `:329` ("stays the same either way"); `:358-360` ("is shown as its key; a reference to a missing record is left out"; "filled with the empty text"; "Any other name stays as written").

README: `README.md:95` reads "is the manual: each part of the window and each view, with the rules, files and limits behind what its screen shows, and the keys", in place of "with what its screen does not show".

## docs/data-map.md

Before: 311 lines, 5206 words. After: 383 lines, 5542 words (`wc -l -w`).

Headings before: Contents; Files in `.oculus`; Data files; Views that draw these files; The hub's settings; The workspace's settings; Keys and links; Fields that hold only under a condition; Schema fields; A second hub; The primary hub; Repositories below a hub.

Headings after: Contents; The files; The hub's settings; This machine's values; The workspace file; Bookmarks, schedules and tasks; Collection files; The career file; Project manifests; Keys and links; Several hubs; Repositories below a hub.

### Code read per paragraph, item and row

- 3: the two links resolve (`test -f`).
- 13: `src/lib/data/helpers/hub-names.ts:574-576` (a hub holds `.oculus/config.yml`).
- The files table, 17-31: `.oculus/config.yml` `hub-names.ts:574-576`; `local.yml` `src/lib/data/sources/config/local.ts:1-7, 548` (LOCAL_NAME under `.oculus`); workspaces `src/lib/server/files/workspace/open.ts:1-17`; bookmarks `src/lib/server/files/fs/bookmarks.ts:1-24`, `config/options/sources.yml` `bookmarks`; schedules `src/lib/data/helpers/run/schedules.ts:9-17`; tasks `src/lib/server/machine/runs/schedules/task.ts:5-11`; collections `config/defaults/sources.yml:26-55`; career `config/options/sources.yml:149`; project manifests `config/options/sources.yml:12` (`scan`), `src/lib/data/sources/projects` walk; deck `config/defaults/sources.yml` `portfolio_deck`; notes `src/lib/server/files/fs/notes.ts:1-17`; memories `config/options/sources.yml:154`; wallpaper `wallpaper_dir`; apps `src/lib/server/machine/apps/store/store.ts:1-6`; LinkedIn `config/defaults/sources.yml:60-63`.
- 33 and the repository table 37-42: `src/lib/data/model/machine/model-machine.ts:13`, `src/lib/data/sources/config/editor-options.ts:1-4, 198-206`, `src/lib/server/machine/runs/commands/files.ts:1-14`, `src/lib/server/machine/debug/launch/read.ts:1-13, 37-38`, `config/schemas/cpp-schema.yml`, `store.ts:22` (app-data).
- 44: `local.ts:50-87` (the state paths and their `~/.oculus` defaults), `local.ts:559-569` (STATE_PATHS).
- 46: `src/lib/data/sources/documents/templates.ts:1-14`, `config/text/views/sources/files.yml:104-154`.
- 50 and the key block 53-121: `hub-names.ts:712-792` (HUB_LIST, one entry per line of the block), the option help of each key in `config/options/*.yml`.
- 124: `src/lib/data/sources/config/merge/hub-layer.ts:1-21, 569-606`, `in-place.ts:10, 147-158` (ROW_SHAPES), `config/catalogs/vocab.yml:4`, `order.ts:88-90`.
- 126: `vocab.yml:4`.
- 128: `src/lib/data/shapes/hub-keys.ts:11-60` (OWN_HUB_KEYS, 42 keys, `primaryOnly`), and the 27 from `comm -23` of HUB_LIST and OWN_HUB_KEYS.
- 130: `config/defaults/sources.yml:72-75`.
- 134: `src/lib/data/sources/config/machine.ts:1-12, 56-58`.
- This machine's values, one row each, the type field, the read and the unset value, all in `src/lib/data/sources/config/local.ts` unless named:
  - `port`: `:38-39`, read `:619-623`, unset `:161` (DEFAULT_PORT 8790); bound to 127.0.0.1 `src/lib/server/root/socket.ts:24`.
  - `self`: `:40-44` ("empty when the file names nobody"), read `:632-635`, unset `:201`.
  - `clusters`: `:45-49`, read `:643-646`, unset `:202` (empty); with no row ssh gets no `-l` and no `-i`, so ssh's own configuration applies (`src/lib/server/machine/hpc/ssh.ts:46-57`).
  - `sessions_cache`: `:50-54` (unset `~/.oculus/transcript-cache.json`), read `:559-561, 679-684`.
  - `sessions_overrides`: `:55-59` (unset `~/.oculus/sessions.json`), read as above.
  - `changes`: `:60-64` (unset `~/.oculus/changes.jsonl`).
  - `history`: `:65-69` (unset `~/.oculus/history`).
  - `approvals`: `:70-75` (unset `~/.oculus/approvals.json`).
  - `lsp`: `:76-82` (unset `~/.oculus/lsp`).
  - `schedule_record`: `:83-87` (unset `~/.oculus/schedule.json`).
  - `claude_bin`: `:88-91`, read `:552-556, 624-629`, unset `:203` (`claude`).
  - `commit_message_account`: `:92-97`, read `:636-642`, unset: the default folder (`src/lib/server/git/git-message.ts:45, 53-61`).
  - `open_bin`: `:98-104` (unset the platform's opener: /usr/bin/open, xdg-open, wslview), read `:552-556`; `src/lib/server/root/context.ts:837`.
  - `rite_dap_bin`: `:105-109`, unset `:204` (`rite_dap`).
  - `accounts`: `:110-111`, read `:647-650`, unset `:205-208` (`~/.claude` and `~/.codex`).
  - `calendars`: `:112-113`, read `:651-659` (google, microsoft or ics), unset `:209` (empty).
  - `calendar_dir`: `:114-118` (unset `~/.oculus/calendar`).
  - `mail`: `:119-120`, read `:660-668` (google or microsoft), unset `:210` (empty).
  - `mail_dir`: `:121-125` (unset `~/.oculus/mail`).
  - `literature.mailto`: `:28-35, 126-131`, read `:669-672`, unset: absent.
  - `downloads`: `:132-138`, read `:673-676`, unset `:211` (empty); the row shape `:156-160`.
- 160: `localPath`, `local.ts:215-223`.
- 164-172 and 174: `src/lib/data/sources/config/merge/workspace-file.ts:1-56`, `folders.ts:15-17`.
- 176-189: `src/lib/data/sources/config/merge/workspace-layer.ts:1-21`.
- 193: `src/lib/server/files/fs/bookmarks.ts:1-70`.
- 195: `schedules.ts:9-17, 37-43, 175-235`, `run.ts:1-16, 87`.
- 197: `task.ts:5-14`.
- 201-208: `config/options/sources.yml:50-140` (the `collections` fields).
- 210 and the collections table 213-229: `config/defaults/sources.yml:26-50` (one entry per row), `docs/templates.md:1148, 1163-1164, 1302-1303, 1427, 1481` (the template schemas' primary keys), `src/lib/state/shared/page/hubs.ts:8-12`.
- 231: `src/lib/data/snapshot/schema/record.ts:1-18, 89-101`, `src/lib/data/snapshot/validate.ts:450-471, 528`.
- 233 and the type table 236-246: `src/lib/data/model/model-collections.ts:64-82` (the types; FILTERED_TYPES).
- The attribute table 249-262: `model-collections.ts:167, 185, 209-287` (display, `when` glob, `KeyPicked`), `record.ts:9-12`.
- 264: `record.ts:89-101`.
- 266-274: `config/catalogs/vocab.yml:106, 139, 141`, `docs/templates.md:1481`, `src/lib/server/machine/hpc/ssh.ts:46-57` (the user from `clusters:`).
- 278: `config/options/sources.yml:149`.
- 282: `config/options/sources.yml:12` (`scan`), `config/schemas/manifest-schema.yml:49` (the id).
- 284 and the manifest table 287-309: `config/schemas/manifest-schema.yml:1-135` (one field per row; `:8, 49` the read-only id; `:103` `paths`).
- 311: `manifest-schema.yml:88-91`, `vocab.yml:182`.
- 315: `manifest-schema.yml:18-26`, `model-collections.ts:220-226`.
- 317-363: the `foreign_key:` lines of `manifest-schema.yml` and of the template schemas, `docs/templates.md:1322`.
- 365, 367: `vocab.yml:4`, `src/lib/data/snapshot/validate.ts:450-471`.
- 369: `Hpc.svelte:22-28`, `src/lib/server/content/audit` link rows.
- 373-379: `hub-keys.ts:1-6`, `machine.ts:1-12`, `hubs.ts:8-12, 31-36`.
- 383: `src/lib/server/git/clone/exclude.ts:5-35`.

## docs/decks.md

Before: 434 lines, 5687 words. After: 361 lines, 3049 words (`wc -l -w`).

Headings before: A first deck; What a deck is (Where decks are); present.yml (deck, defaults, groups, order); How a group picks its decks; The order (Counts); Slides; Slide kinds (title, section, text, image, columns, equation, code, closing, project, idea, summary, grid); Front-matter keys; Notes, images and tags; The filter; The project facts strip; Project fields in a slide; Slide findings.

Headings after: Contents; A deck's files; present.yml; The order; How a group picks its decks; Slides; Front-matter keys; Slide kinds (title, section, text, image, columns, equation, code, closing, project, idea); The filter; The project facts strip.

### Code read per paragraph, item and row

- 13-17: `src/lib/data/sources/deck/read.ts:1-38, 75`, `src/lib/server/edit/writes/config/lists/deck/deck-files.ts:51-52, 414-441` (images, the name rule), `src/lib/data/file-ops.ts:46` (32 MB), `src/lib/views/academic/present/acts/run.ts:111-150` (`dropImage`), `config/text/views/academic/present.yml:4, 34-37`.
- 19-62 (the example): `spec.ts`, `kinds.ts:82-93`, `split.ts:50-85`.
- 66 and the example block: `src/lib/data/sources/deck/spec.ts:104-112`.
- The present.yml table 88-100: `spec.ts:121-135, 138-212` (one key per row, with its unset value), `config/options/present.yml:7-22`, `config/defaults/present.yml`.
- 102: `spec.ts:121-135` (the frame and its ranges), `read.ts:240-256, 305, 326, 343-355` (the lists, the deck of no project, the glob refusal).
- 106 and the order table 110-113: `spec.ts:163-198`, `read.ts:13-14, 117, 132, 551-626, 639`.
- 115: `read.ts:551-626`.
- 119-123: `src/lib/data/sources/deck/groups.ts:1-18, 110, 178, 185, 217`, `order.ts:85-104`, `hub-keys.ts:36`, `vocab.yml:280`.
- 127-132: `src/lib/data/sources/deck/split.ts` head comment and `:50-85`, `read.ts:426-447, 470-491`.
- The front-matter table: `kinds.ts:163-177, 239-253`, `project.ts` (`projectSlide`, IMAGE_SUFFIXES).
- 162: `kinds.ts:262-273`.
- Each kind, 164-317: `kinds.ts:266-398` (one builder per kind), `src/lib/views/academic/present/parts/project/Project.svelte:52, 157`.
- 321-323: `src/lib/state/boards/board/state.ts:157, 170`, `config/text/views/academic/present.yml:123`.
- 327-331: `src/lib/data/shapes/project-facts.ts:83-180`, `config/text/views/boards/projects.yml:16-19`, `src/lib/state/life/present.ts:120, 145`, `parts/project/Facts.svelte:130`.
- The facts table 341-356 and 358-361: `project-facts.ts:83-180` (one field per row), `read.ts:470-491`.

## Sentences of today's pages kept word for word

How the lists were made: each page, before and after, was split at a period followed by a space and a capital. Each table row and each code line counts as one unit, and only units over 25 characters are counted. `comm -12` of the before and after lists of each page gives the kept units, held in the scratchpad's `O165build/kept-HELP.txt`, `kept-data-map.txt` and `kept-decks.txt`. Those lists were made over the first round's pages; this round removed or rewrote, of the units they hold, the Help sentences on `rite_dap`'s missing features, `Set or Not set`, "A file with no `schema:` has no Edit", "A view opened for something ... never covers the tool views", "Apply writes the checked edits; Discard writes nothing", "Delete asks first and names everything that refers to the entry; those references become findings", "It writes only where a control says so: ...", "No app can reach ...", "No draft is made at the provider", "Nothing force-pushes except a deposit's snapshot", "Reopen restores a kept layout; Forget drops it", "Resume asks once ...", "Search and More each send one request, and nothing else asks the browser", "The `secrets` folder of every hub is private: ...", the Delete row "(not a pinned one)"; the data map's `:50`, `:270`, `:231` (snooze), `:315`, `:210`, `:369` sentences; and the decks guide's `:127`, `:128`, `:106`, `:323` and `:257` sentences, each rewritten as listed under ST1. The other kept units stand unchanged, among them the key rows of `docs/HELP.md:496-571` other than the Delete row, the data map's key block, collections table and link block, and the decks guide's examples and facts table.

One sentence moved between pages by decision 3: "Nothing else in that file changes." It was in today's Help at line 631 and moved to the data map's last section, where this round rewrote it to "and writes that block alone, with no control" (`docs/data-map.md:383`).

## Item 5 lines

- `README.md:42`: "The [Decks guide](docs/decks.md) shows how to write one." Still true.
- `README.md:95`: before "is the manual: every view, key, setting and file. The app shows it on its Help page." After "is the manual: each part of the window and each view, with the rules, files and limits behind what its screen shows, and the keys. The app shows it on its Help page."
- `README.md:96`, `:98` and `:100` (templates, apps, palette): still true.
- `README.md:97`: before "maps a hub's data files, the views that show them and the keys that link them." After "maps the files oculus reads from a hub and from a repository: where each is, its keys and the keys that link them."
- `README.md:99`: before "shows how to write a deck: every key of `present.yml` and every slide kind, each with an example." After "shows how to write a deck: its files, every key of `present.yml` and of a slide's front matter with its value when unset, and an example of every slide kind."
- `docs/templates.md:1924`: before "The [Decks guide](decks.md) gives every key and every slide kind, each with an example." After "The [Decks guide](decks.md) gives every key with its value when unset, and an example of every slide kind." The rest of the line is unchanged and still true.
- `docs/apps.md:3`: "The rest of the manual is [HELP.md](HELP.md)." Still true.
- `src/lib/state/workbench/layout/open/float/return-place.ts:3`: before "(docs/HELP.md, Pages and the pane tree)", after "(docs/HELP.md, Pages and panes)". The paragraph is rewrapped at 100 columns.
- `src/lib/ui/controls/editor/chords.ts:120`: "Alt keeps its name on macOS, as docs/HELP.md's key table writes it." Still true: the table writes Shift+Alt+F12, Alt+O, Alt+Z, Alt+F5 and Alt+Up.
- `tests/server/git/clone-exclude.test.ts:25` and `tests/server/git/git-scan-depth.test.ts:210`: before "as docs/HELP.md names them", after "as docs/data-map.md names them". The block is at `docs/data-map.md:383` (decision 3).
- `config/defaults/sources.yml:35`: "The links between files are in docs/data-map.md, the Data map tab of the Help page." Still true (Keys and links, `docs/data-map.md:313`).
- `config/text/views/system/help.yml:1`: "the tool's own manual, the docs/HELP.md of oculus's folder, and the Keyboard Shortcuts view with what each key does." Still true.
- Help's scope as built, for the orchestrator's rewrite of `CLAUDE.md:5`: `docs/HELP.md` gives each part of the window and each view, with what it is for and the rules, files and limits its screen does not draw, and then the keys.

## Verify before you report 6: the prose rule

Every list item and sentence new or changed in this round was read against the prose rule of `.scratch/migration/agents/spec.md` (plain, ASCII, no em dashes, no quips, no 'not X but Y', one line per paragraph) and the brief's Conventions (no sentence says what something is not; a page's own structure is never narrated). Checks run: check 3 and `LC_ALL=C grep -n '[^ -~]'` (no line); `grep -n "\bnot\b\|\bnever\b\|\bnone\b\|n't\|\bnothing\b\|\bwithout\b\|\bno\b"` over the three pages, each hit read.

Departures kept, each with why it needs its form:

- Conditions phrased with "no" or "without" that lead to a positive action stay, since the condition is what the reader must match: "a project no board takes ... is a finding" (`docs/HELP.md:96`), "a tab with no unsaved text reloads it" (`:256`), "With no stage picked the map draws ..." (`:356`), "an entry of a file with no primary key" (`:316`), "a lead with ... with or without a day" (`:138`), and the data map's and decks guide's finding rules of the same shape.
- When unset cells that name an absence ("no group", "none", "no chip", "nobody is marked", "no calendar") stay, since the absence is the value.
- "only" in "Only a deposit's snapshot is force-pushed", "Only a press asks the browser", "Send and Archive are the only writes to a mailbox" and "only Close in a tab's menu closes one" states the one thing that does it.
- The keys paragraph's "The table below also gives ..." (`docs/HELP.md:494`) points at the table because item 4 asks Help to say the table covers the view-bound keys the view does not list; it is the one sentence that refers to the page's own parts.
- "is a finding, and oculus skips it" and "the deck skips it" say what the reader sees: the key has no effect.

## Judgment calls

- The apps' own views (one registration per app, `src/routes/views.ts:211-234`) and the views the apps contribute (`views.ts:236-261`) have no Help entry, as item 1 says. The Apps entry and the a1-a9 row name them.
- Literature is one bullet of Collection views (item 1), since it is a collection view whose Add, key rule and Save to Literature are its own.
- Workbenches is both a shell part (under The window) and a view (the float). The view's entry is headed "Workbenches view" and holds its one-line description.
- The title bar, the update tray and Linux have no entries of their own. The update tray and the schedules are in the rail's entry, since Update sits at the rail's foot. The app and Linux facts are the opening paragraph of The window.
- "A second hub" and "The primary hub" of the data map are one section, Several hubs. It holds only what changes which file is read or written (decision 5).
- The data map has no Views table. The collections table keeps a View column, and Help names the file each view draws.
- The keys table leaves out the rows whose binding is Monaco's own and which the Keyboard Shortcuts view lists (Shift+F12, Cmd+., Shift+Alt+F, Shift+Alt+O), and the arrows of a menu and of a terminal row. The LaTeX tab's own chords Cmd+L Cmd+L and Cmd+L Ctrl+Shift+M are in the table (item 9).
- The per-row citations of the This machine's values table are in this report, not on the page: the page is a reader's guide, and the When unset column carries each row's value from the code.

## User-visible changes

- Help is 6890 words, down from 32223. It has a short entry for each part of the window and each view, then the key table. Each entry holds what the view is for and the rules, files and limits its screen does not draw; the configuration chapter, the Files chapter and the per-view notes are cut to those, and the keys of the hub files are on the data map, linked from Help.
- Help's heading "Pages and the pane tree" is now "Pages and panes". "The keys" keeps its anchor `#the-keys`. The Literature entry is folded into Collection views.
- In Help's key table:
  - `p1-p6` replaces `p1-p4`.
  - `h1 / h2 / h3-h7 / h8, h9` replaces `h1-h9 | the Help page's tabs`: h1 Help, h2 Keyboard Shortcuts, h3 to h7 the Apps guide, Templates, Data map, Palette and Decks guide (the Help arrangement's order, `layout.yml:136-145`), and h8 and h9 the hub's `docs:` entries of the Help group, which oculus ships empty (`layout.yml:334`).
  - Escape in Present, Cmd+K Shift+Enter (pin or unpin the tab), the nine Files row rows, and Cmd+L Cmd+L and Cmd+L Ctrl+Shift+M are added.
  - Cmd+Enter names the Files and Repositories row.
- The data map gives:
  - the keys of `local.yml` with each value when unset, the workspace file, `bookmarks.yml`, `schedules.yml`, `project.yml` and the repository's `.oculus/` files
  - which of the 69 config keys are read from the primary hub only
  - the workspace folder's `repository_scan_depth` range
- The decks guide says the deck order is the hub's merged `deck_order`, set in the hub's `.oculus/config.yml`.
- Sentences of today's pages that the code shows to be false or incomplete, corrected:
  - An update task is a file of any hub, and the tray offers the task of every hub that holds its file (`task.ts:5-11`). Today's Help and data map said it was a file of the primary hub.
  - `filter: true` also takes a `period` field (FILTERED_TYPES in `model-collections.ts`).
  - An event's `link` is required when `role: present` and `status` is `upcoming` or `planned` (`docs/templates.md:1481`).
  - `literature.sources`, `recover.sources`, `links`, `sign_in` and `connections.failures` are laid over oculus's rows row by row (`hub-layer.ts:18-21`, `in-place.ts:147-153`).
  - Breakpoints and watches are kept in `~/.oculus/debug.json` (`page-state/files.ts:5, 22`).
  - Cmd+P skips `.svelte-kit-app` as well as `node_modules`, `.git` and `.svelte-kit` (`query.ts:54`).
  - "Stage All never stages new files" was false: Stage All adds the untracked group, with no time limit (`git-write.ts:34-38`).
  - `:task-add` writes the status carrying `default_task`, `todo` in oculus's vocabulary (`new-entry.ts:102-121`, `vocab.yml:133`).
  - `commit_message_account` unset runs under Claude's default folder (`git-message.ts:45, 53-61`).

## Anything in the brief that was wrong or impossible

Nothing in the brief or the round-1 brief was wrong or impossible.

## Paths corrected at landing

A file named by its file name alone stands for the file below. `private.ts` is `src/lib/server/machine/apps/reach/private.ts`; `editor-keys.ts` is `src/lib/data/helpers/keys/oculus/editor-keys.ts`; `literature-key.ts` is `src/lib/server/edit/feeds/literature-key.ts`; `folders.ts` is `src/lib/server/files/workspace/folders.ts`; `hub-keys.ts` at the F2 row is `src/lib/server/machine/lsp/adapters/yaml/hub-keys.ts` and elsewhere `src/lib/data/shapes/hub-keys.ts`; `latex-editing.ts` is `src/lib/ui/controls/editor/kit/latex/latex-editing.ts`; `markdown.ts` is `src/lib/data/prose/markdown/markdown.ts`; `order.ts` is `src/lib/data/shapes/boards/order.ts`; the leads files are `src/lib/state/feeds/leads.ts` (`isExpired`) and `src/lib/data/accounts/leads.ts`.
