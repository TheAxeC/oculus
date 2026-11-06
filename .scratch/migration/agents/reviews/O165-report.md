# O165 report: the guides redesigned

Everything in the brief is done.

## Open items of the state file, verbatim

From `.scratch/migration/orchestrator-state.md:182-186`:

> ## Open items (only what Axel must rule on; every report tells him these in plain words, decisions first, until he has ruled)
>
> An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own.
>
> None.

## The cases' first run (unchanged tree)

- C1: the registered views today's Help does not name are `awaiting_board`, `keys` and `recover` (`comm -23 c1-components.txt c1-help-all.txt` in the scratchpad's `O165build/`, rerun for this report). Today's Help named the 16 boards and collection views one by one, with no single entry for the collection view or the project board, and the title bar, the update tray and Linux each had a subsection of their own.
- C2: the row `p1-p4` was false, since the shipped Projects group holds 6 boards (`config/defaults/layout.yml:216` `boards:`; `src/lib/state/workbench/navigation/catalogue.ts:219-244` `railOrder`). The deck rows are bound in the Present box (`src/lib/views/academic/present/screen/keys.ts:74-91` `moveOf`, and the box's o/O, f/F, p/P and Escape), not in `rows.ts`.
- C3: five sentences repeated the screen: HELP.md:288 (the follow-up and subtask form headings, against `config/text/views/boards/project.yml:34-37`), HELP.md:314 (the board header's Full titles and Columns, against `projects.yml:20,45`), HELP.md:306 (the Literature hit's Open PDF, Copy BibTeX, Add to Lit Watch and Save to Literature, against `literature.yml:5,14,38,94`), HELP.md:90 (Workbenches' Reopen, Forget and New workbench, against `workbench.yml:293-302`), and HELP.md:262 (Apps: Add app from folder and Remove, against `apps.yml:101-102`).
- C4: today's map named the files of item 2 but left out the keys of `local.yml`, `bookmarks.yml`, `schedules.yml`, the workspace file, the tasks, the repository's `settings.yml`, `commands.yml`, `launch.yml` and `cpp.yml`, and the app-data files. Its config block listed the 69 entries of `HUB_LIST` (`src/lib/data/helpers/hub-names.ts:712-792`).
- C5: today's guide matched `spec.ts`, `kinds.ts` and `project.ts`: every key was present and all 10 kinds had an example. Summary and grid are order entries, not kinds.
- C6: every item 5 line was true of today's pages.
- C7: `npx vitest run tests/checks/source/history.test.ts --reporter=dot` failed both times it ran: 5 passed and 1 failed, the case "names no package id, date or session in any comment" timing out at its 5000 ms default (13769 ms, load average about 9.8). The documents test passed.
- C8: every link of the three pages resolved, `HELP.md#the-keys` of `src/lib/views/shared/prose/doc-link.ts:3` included.
- No case showed a rule of the brief to be wrong, so there was no stop.

## DONE / NOT DONE

| Item | State | Proof |
|---|---|---|
| 1 Help: one entry per view the reader reaches, the collection view and the project board one entry each, each shell part one entry | DONE | the `awk` count of `###` headings per section prints `5 65`: 5 shell entries under The window and 65 entries under The views (listed below) |
| 1 Help: one sentence on what the view is for, then only what its screen does not show | DONE | `grep -c "New follow-up\|Full titles\|Open PDF, Copy BibTeX\|Add app from folder\|Reopen, Forget and New" docs/HELP.md` prints 0. The Workbenches view entry (line 517) keeps "Reopen restores a kept layout; Forget drops it.", which says what each control does to a kept layout. |
| 1 Help: a keys table under "The keys", each row true of a binding, the deck rows of ruling 706 kept | DONE | `grep -n "^## The keys" docs/HELP.md` gives line 519; each row's binding is listed under "The keys" below |
| 2 Data map: each hub file oculus reads, with its path, keys and links | DONE | `grep -n "^## " docs/data-map.md`; the code read per section is listed below |
| 3 Decks guide: a deck's files, the keys with their values when unset, one example per slide kind | DONE | `grep -n "When unset\|^### " docs/decks.md` shows two tables with a When unset column and 10 kind headings |
| 4 every sentence true and needed; the kept sentences quoted | DONE | the kept lists are below. Every Help sentence carried from today's page was traced to its code (list below). Two of them were incomplete in today's page and are completed: Cmd+P also skips `.svelte-kit-app` (`src/lib/data/helpers/search/query.ts:54`), and the limits of its name list are given (`config/defaults/behavior.yml:489-493`) |
| 5 the lines describing or citing the pages left true | DONE | before and after, below |
| 6 headings and counts before and after | DONE | below |
| Character-set check over the 12 files | DONE | `perl -ne 'print "$ARGV:$.: $_" if /[^\x00-\x7F]/; close ARGV if eof' docs/HELP.md docs/data-map.md docs/decks.md README.md docs/templates.md docs/apps.md src/lib/state/workbench/layout/open/float/return-place.ts src/lib/ui/controls/editor/chords.ts tests/server/git/clone-exclude.test.ts tests/server/git/git-scan-depth.test.ts config/defaults/sources.yml config/text/views/system/help.yml; echo "charset exit $?"` printed no line and `charset exit 0`, after the last change |
| History words in the changed comments | DONE | `git diff -U0 -- src tests \| grep "^+" \| grep -inE "\b(now\|no longer\|used to\|previously\|formerly\|renamed\|moved\|was\|were)\b"` prints one line: the return-place comment's "which moved or closed that node". It describes a page rearranged at runtime, and `git show HEAD:` of the file has the same clause |
| Comment width of the changed comment | DONE | `awk 'length>100' src/lib/state/workbench/layout/open/float/return-place.ts \| wc -l` prints 0 |
| C7 history test | DONE | the test times out at its 5000 ms default under load, as in the first run; with `--testTimeout=120000` the file passes 6 of 6; its run inside `npm run test:quick` ("vitest checks") passes |
| C8 links | DONE | every link target of the three pages exists: apps.md, data-map.md, decks.md, HELP.md, palette.md and templates.md (`test -f`). `figure.png` is inside a code block and `<file>` inside a code span. `HELP.md#the-keys` resolves to line 519 |
| `npm run diagrams` then `npm run test:quick` after the last change | DONE | exit 0. Every step printed `ok`: prettier, ASCII gate, svelte-kit sync, eslint, svelte-check (0 errors, 0 warnings), vitest, vitest slow and vitest checks (`test:quick: 115.3 s; every command passed`). `git status --short` lists the 8 modified files and this report; diagrams changed no tracked file |
| Number of full-list runs | 4 | Runs 1 and 3 passed every step. Run 2 failed only in "vitest slow": two real-git cases, in `clone-exclude.test.ts` and in `git-scan-depth.test.ts`, timed out at 20000 ms under a load average of 18.65. The same two files run alone (`npx vitest run tests/server/git/clone-exclude.test.ts tests/server/git/git-scan-depth.test.ts --tagsFilter slow --testTimeout 20000`) passed 18 of 18, 10 skipped. Run 4 came after the last page change and passed every step |
| `sh utils/unused-exports.sh` | not needed | no export was added or removed |

## docs/HELP.md

Before: 646 lines, 32223 words (`git show HEAD:docs/HELP.md | wc -l -w`). After: 590 lines, 7391 words (`wc -l -w docs/HELP.md`).

Headings before: The window (On Linux and WSL2, The title bar, The rail, Pages and the pane tree, Workbenches, The palette, The update tray and schedules, The status bar and notifications); The keys; The views (Entries and their editor, Notes on single views, LaTeX builds); Files and the editor (Notes, Language servers, Hub keys in YAML, Linters); Searching the files; Terminals; Project commands; Debugging; Apps; Source Control and worktrees; Configuration and the data (Hubs and projects, Mail and calendar, Git hosts and clusters).

Headings after: Oculus; Contents; The window (The rail, Pages and panes, Workbenches, The palette, The status bar); The views (Focus, Awaiting board, Project boards, Project, Editor, Deposit, Inbox, Position Leads, LinkedIn, Calendar, Post, Files, Repositories, Sessions, Search, TeX view, Terminal, Problems, References, Debug, Debug Console, Notes Graph, Session, Source, File, Document, Doc, Markdown Preview, Math Preview, Diff, Merge, Refactor Preview, Customization, Language server output, Collection views, Memories, Career, Entry, Pillars, Domains, Map, Listing, Venues, Journal Browser, Data, Person, Recover, Literature search, Lit Watch, Literature, Present, Apps, Help, Keyboard Shortcuts, Settings, Account setup, Views, Pages, Status, Findings, History, Processes, Live HPC, Usage, Workbenches view); The keys.

The order is the rail's (`config/defaults/layout.yml:9-21`) and each group's `order` (the registrations under `src/lib/views`). A view opened for one thing comes after the group of the view that opens it (decision 2).

Code read, per section:

- The window: `config/defaults/layout.yml:1-21` (the rail); the app and Linux facts carried from today's page lines 13-47; `src/lib/server/root/process/build-folders.ts:1-18`.
- The rail: `layout.yml:9-21, 304` (the rail and its counts), `src/lib/shell/rail/rail.ts:1-5, 79-82`, `src/lib/server/machine/runs/schedules/task.ts:1-17` (the tasks of any hub), `src/lib/data/helpers/run/schedules.ts:9-17, 37-43`, `src/lib/server/machine/runs/schedules/run.ts:2, 87`, `config/defaults/sources.yml:53` (`chat_context`).
- Pages and panes: `src/lib/state/workbench/navigation/registry.ts:120-135` (`unique`), the eleven `unique: true` registrations (`grep -rln "unique: true" src/lib/views` gives Status, Settings, Pages, Workbenches, Findings, Processes, Usage, Hpc, History, Focus and Apps), `src/lib/state/workbench/layout/open/landing.ts:1-11` (where an opened view lands), `src/lib/state/workbench/layout/open/float/return-place.ts:1-6`, `src/lib/data/helpers/keys/oculus/resolve.ts:174-181`.
- Workbenches: the `workbench:` arrangement of `layout.yml`.
- The palette: `src/lib/data/helpers/keys/oculus/palette-table.ts` (KEY_ROWS, PREFIX_ROWS), `src/lib/views/system/help/keys/rows.ts:1-8`, `src/lib/shell/keys/lists/file-window.svelte.ts:2` (200 files per answer), `src/lib/data/helpers/search/query.ts:53-54, 336-345` (hidden files listed, the skipped folders), `config/defaults/behavior.yml:489-493` (`max_names`, `timeout_s`).
- The status bar: carried from today's page lines 118-125.
- Focus: the head comment of `src/lib/views/boards/focus/Focus.svelte`, `config/defaults/behavior.yml:48-50`.
- Awaiting board: `src/lib/views/boards/projects/Projects.svelte:1-26` and its registration's head comment, `Focus.svelte:40-56`.
- Project boards: the head comment of `Projects.svelte`, `layout.yml:216-260` (`boards:`).
- Project, Editor, Deposit, Entry, Listing, Person, Post: the head comments of `boards/project/Project.svelte`, `boards/editor/Editor.svelte`, `boards/deposit/Deposit.svelte`, `boards/entry/Entry.svelte`, `boards/listing/Listing.svelte`, `boards/person/Person.svelte` and `feeds/post/Post.svelte`; `config/schemas/manifest-schema.yml:88-91`; `src/lib/server/git/deposit/deposit-git.ts:143-146` and `deposit.ts:115` (the mirror under `~/.oculus/deposits`).
- Inbox, Calendar, Account setup: their head comments, `config/options/local.yml` (`calendars`, `calendar_dir`, `mail`, `mail_dir`, `clusters`), `src/lib/server/accounts/connect/store.ts:1-21, 48` (tokens and calendar links in account files at 0600), `src/lib/server/accounts/mail/triage.ts:6, 24`, `src/lib/server/machine/hpc/clusters/keys.ts:4-15` (`ssh-keygen`, `known_hosts`).
- Position Leads, LinkedIn, Lit Watch, Literature search, Literature: their head comments, `config/options/sources.yml:143` (`linkedin_dir`).
- Files and Source: the head comments of `src/lib/views/sources/files/Files.svelte` and `sources/source/Source.svelte`, `src/lib/server/files/fs/notes.ts:1-17`, `src/lib/data/prose/markdown/note-names.ts:10, 33`, `config/defaults/behavior.yml:451` (note autosave 800 ms), `src/lib/server/machine/lsp/held/held.ts:48` (server linger 60 s), `src/lib/views/shared/explorer/tree/make/make-words.ts`, `config/text/views/sources/files.yml:104-154`, `src/lib/state/sources/explorer/acts/keys.ts:44-62`.
- Repositories: its head comment, `src/lib/server/git/git-write.ts:107, 112` (10 s and 60 s), `config/defaults/sources.yml:78` and `config/options/sources.yml:181-188` (scan depth 1, at most 3).
- Search: `src/lib/server/files/search/search.ts:1-12`, `query.ts:51, 184-188` (2M).
- TeX view, Math Preview: their head comments; the LaTeX root rule carried from today's page lines 382-390.
- Terminal, Sessions, Session, Customization: their head comments, `src/lib/server/machine/pty/channel.ts:18-30, 64` (agent detection 5 s), `src/lib/state/sessions/terminal/terminal-tabs.ts:1-6, 124-141` (Lock is part of the saved tab state, so it survives a reload), `src/lib/views/sessions/terminal/transcript/tab-session.svelte.ts:79-98`, `src/lib/state/sessions/folds.ts:162-172` (pinned rows and rows needing input first, then newest), `src/lib/views/sessions/terminal/terminal-list.ts:216-226`.
- Problems, References, Refactor Preview, Diff, Merge, Doc, Markdown Preview, File, Document, Language server output, Notes Graph, Debug, Debug Console: their head comments; `src/lib/server/files/workspace/page-state/files.ts:5, 22` (breakpoints in `debug.json`).
- Collection views: `src/lib/views/boards/collection/registration.ts`, `config/defaults/sources.yml:26-55`, `src/lib/state/shared/page/hubs.ts:8-12`.
- Memories, Career: their head comments, `config/options/sources.yml:149, 154`.
- Pillars, Domains, Map, Venues, Journal Browser, Data, Recover: their head comments.
- Present: its head comment, and `docs/decks.md` as built.
- Apps: `src/routes/views.ts:205-261` (the apps group), the head comment of the Apps view.
- Help, Keyboard Shortcuts: `src/lib/views/system/help/Help.svelte:18-23`, `keys/rows.ts:1-8`, `layout.yml:138-145, 334` (`docs: []`).
- Settings, Views, Pages, Status, Findings, History, Processes, Usage, Workbenches view: their head comments.
- Live HPC: its head comment, `src/lib/server/machine/hpc/submit.ts:1-14` (the plan shown and confirmed before it runs), `scratch.ts:2, 29-32` (the `/local/$SLURM_JOB_ID` warning), `transfer.ts:11` (no `--delete`).

The keys: each row is a row `rows.ts` builds from its sources, or a key a view binds on its own box. The checks:

- the digits, Ctrl+digit, Ctrl+[ ], `n`, `/`, `g g`, `G`, the cursor keys and Escape: `resolve.ts:376-379` and its chord and cursor code
- Ctrl+Tab: `page-keys.ts:44-47`
- Cmd+W, Cmd+N, Cmd+F, Cmd+T and Cmd+Shift+T: `resolve.ts:174-181`, `page-keys.ts:35`
- Cmd+Shift+N, Cmd+Shift+W, Cmd+, and Cmd+R: OWN_ACCELERATORS in `desktop-keys.ts`
- Cmd+S: `resolve.ts:168-171, 280`, `src/lib/shell/window/source-keys.ts:28-33`
- build, test, Problems and F8: `resolve.ts:116-117, 141-157`
- the chords: `catalogue.ts:219-249`, `layout.yml:9-21, 334`, `src/routes/views.ts:211-261`
- the palette keys: `palette-table.ts`
- the LaTeX keys: `editor-keys.ts`, `src/lib/views/shared/prose/editor/latex-editing.ts:187, 204`
- Shift+Alt+F12, Shift+Alt+H, Alt+O and F4: `src/lib/views/shared/prose/editor/lsp.ts:127-133`
- Alt+F5: `gutter.ts:116-117`
- Cmd+K Shift+Enter: `src/lib/ui/controls/editor/chords.ts`
- Alt+Z: `src/lib/views/sources/source/status/ask-perform.ts:75-79`
- the Files row keys: `src/lib/state/sources/explorer/acts/keys.ts:44-62`
- the Search keys: `src/lib/state/sources/search/keys.ts:35-40`, `box-keys.ts`
- Delete on a tab: `src/lib/ui/tabs/Tabs.svelte:252`
- the terminal row: `terminal-list.ts:216-226`
- Shift+F10: `src/lib/ui/menu/ContextMenu.svelte:135, 277`
- the float handle: `src/lib/ui/frame/sash/Sash.svelte`
- the Debug Console: `src/lib/views/system/machine/debug/Console.svelte`
- the tree: `src/lib/ui/tree/tree-keys.ts`
- the deck rows: `present/screen/keys.ts:74-91`, and the box's o/O, f/F, p/P and Escape

## docs/data-map.md

Before: 311 lines, 5206 words. After: 383 lines, 5587 words.

Headings before: Contents; Files in `.oculus`; Data files; Views that draw these files; The hub's settings; The workspace's settings; Keys and links; Fields that hold only under a condition; Schema fields; A second hub; The primary hub; Repositories below a hub.

Headings after: Contents; The files; The hub's settings; This machine's values; The workspace file; Bookmarks, schedules and tasks; Collection files; The career file; Project manifests; Keys and links; Several hubs; Repositories below a hub.

Code read, per section:

- The files: `src/lib/data/helpers/hub-names.ts:574-576` (what a hub is), `config/defaults/sources.yml:22-75` (the default paths), `config/options/sources.yml:12-170` (`scan`, `collections`, `linkedin_dir`, `career_file`, `memories_dir`, `bookmarks`), `src/lib/server/files/fs/notes.ts:1-17`, `src/lib/server/machine/runs/schedules/task.ts:5-11`, `src/lib/data/model/machine/model-machine.ts:13`, `src/lib/data/sources/config/editor-options.ts:1-4, 198-206`, `config/options/behavior.yml:500-505`, `src/lib/server/machine/runs/commands/files.ts:1-14`, `src/lib/server/machine/debug/launch/read.ts:1-13, 37-38`, `config/schemas/cpp-schema.yml`, `src/lib/server/machine/apps/store/store.ts:1-6, 22`, `config/options/local.yml` (the `~/.oculus` defaults), `src/lib/data/sources/documents/templates.ts:1-14`, `config/text/views/sources/files.yml:104-154`.
- The hub's settings: `hub-names.ts:712-792` (HUB_LIST, 69 keys), `src/lib/data/shapes/hub-keys.ts:11-60` (OWN_HUB_KEYS, 42 keys, and `primaryOnly`), the 27 keys read from the primary only, from `comm -23` of the two lists, `src/lib/data/sources/config/merge/hub-layer.ts:1-21, 569-606`, `src/lib/data/sources/config/merge/in-place.ts:10, 147-158` (ROW_SHAPES), the option help of each key in `config/options/*.yml`, `config/defaults/sources.yml:72-75`.
- This machine's values: every key of `config/options/local.yml`, `src/lib/data/sources/config/local.ts:160-189, 600-660`, `src/lib/data/sources/config/machine.ts:1-12, 56-58`.
- The workspace file: `src/lib/data/sources/config/merge/workspace-file.ts:1-56`, `src/lib/server/files/workspace/open.ts:1-17`, `src/lib/data/sources/config/merge/workspace-layer.ts:1-21`, `src/lib/server/root/watch/bookmarks.ts:21-24`, `src/lib/server/machine/runs/schedules/watch.ts:90`.
- Bookmarks, schedules and tasks: `src/lib/server/files/fs/bookmarks.ts:1-70`, `src/lib/data/helpers/run/schedules.ts:9-17, 37-43, 175-235`, `src/lib/server/machine/runs/schedules/task.ts:5-14`, `run.ts:87`.
- Collection files: `config/options/sources.yml:50-140` (the `collections` fields), `config/defaults/sources.yml:26-50`, `docs/templates.md:1148, 1163-1164, 1302-1303, 1427, 1481` (the template schemas), `src/lib/data/model/model-collections.ts:64-82, 209-287` (FILTERED_TYPES, `KeyPicked`, the `when` glob), `src/lib/data/snapshot/schema/record.ts:1-18, 89-101`, `src/lib/data/snapshot/validate.ts:450-471, 528`, `config/catalogs/vocab.yml:106, 139, 141`.
- The career file: `config/options/sources.yml:149`.
- Project manifests: `config/schemas/manifest-schema.yml:1-135`, `config/options/sources.yml:12` (`scan`).
- Keys and links: `manifest-schema.yml:18-26`, `record.ts:9-12`, `model-collections.ts:220-226`, `docs/templates.md:1322`.
- Several hubs: `hub-keys.ts:1-6`, `machine.ts:1-12`, `src/lib/state/shared/page/hubs.ts:8-12, 31-36`, `config/options/local.yml` (`self`).
- Repositories below a hub: `src/lib/server/git/clone/exclude.ts:7-35`.

## docs/decks.md

Before: 434 lines, 5687 words. After: 361 lines, 3065 words.

Headings before: A first deck; What a deck is (Where decks are); present.yml (deck, defaults, groups, order); How a group picks its decks; The order (Counts); Slides; Slide kinds (title, section, text, image, columns, equation, code, closing, project, idea, summary, grid); Front-matter keys; Notes, images and tags; The filter; The project facts strip; Project fields in a slide; Slide findings.

Headings after: Contents; A deck's files; present.yml; The order; How a group picks its decks; Slides; Front-matter keys; Slide kinds (title, section, text, image, columns, equation, code, closing, project, idea); The filter; The project facts strip.

Code read, per section:

- A deck's files: `src/lib/data/sources/deck/read.ts:1-38, 75`, `deck-files.ts:52, 388-396, 414-458` (images), `src/lib/data/file-ops.ts:46`, `src/lib/views/academic/present/acts/run.ts:111-150` (`dropImage`), `config/text/views/academic/present.yml:4, 34-37`.
- present.yml: `src/lib/data/sources/deck/spec.ts:104-112, 121-135, 138-212`, `read.ts:240-256, 305, 326, 343-355`, `config/options/present.yml:7-22`, `config/defaults/present.yml`.
- The order: `spec.ts:163-198`, `read.ts:117, 132, 551-626, 639`.
- How a group picks its decks: `src/lib/data/sources/deck/groups.ts:1-18, 110, 178, 185, 217`.
- Slides: the head comment and lines 50-85 of `src/lib/data/sources/deck/split.ts`.
- Front-matter keys and Slide kinds: `src/lib/data/sources/deck/kinds.ts:82-93, 163-177, 239-253, 266-398`, `project.ts` (`projectSlide`, IMAGE_SUFFIXES), `src/lib/views/academic/present/parts/project/Project.svelte:52, 157`, `read.ts:426-447, 529`, `config/text/views/academic/present.yml:109`.
- The filter: `src/lib/state/boards/board/state.ts:157, 170`, `config/text/views/academic/present.yml:123`.
- The project facts strip: `src/lib/data/shapes/project-facts.ts:83-180`, `config/text/views/boards/projects.yml:16-19`, `src/lib/state/life/present.ts:120, 145`, `parts/project/Facts.svelte:130`, `read.ts:470-491`.

## Sentences of today's pages kept word for word

How the lists were made: each page, before and after, was split at a period followed by a space and a capital. Each table row and each code line counts as one unit, and only units over 25 characters are counted. `comm -12` of the before and after lists of each page gives the kept units, held in the scratchpad's `O165build/kept-HELP.txt` (88), `kept-data-map.txt` (120) and `kept-decks.txt` (60).

One sentence moved between pages by decision 3: "Nothing else in that file changes." It was in today's Help at line 631 and is now at `docs/data-map.md:383`. A cross-page `comm -12` of before and after gives this sentence and two table separator rows, and nothing else.

docs/HELP.md (88):

```
`rite_dap` has no pause, conditional breakpoints or Set Value; an app's debugger offers what it declares.
`search.max_hits` and `search.timeout_s` limit it.
| : | command line |
| / | focus the board's search; in Search, back to the query box |
| 1-9 / Ctrl+1-9 | show that rail page / that tab of the focused pane |
| Alt+F5 / Shift+Alt+F5 | next / previous change |
| Alt+Up / Alt+Down | move a root, bookmark, note or section of Files |
| Alt+Z | toggle word wrap |
| arrows | on a docked float's handle: resize it |
| arrows, Home / End | along the rail or a tab strip |
| Cmd+Alt+[ / Cmd+Alt+] | promote / demote sections, in a `.tex` tab |
| Cmd+Alt+B / Cmd+Alt+C / Cmd+Alt+V | LaTeX build / clean / view PDF, in a `.tex`, `.sty` or `.cls` tab |
| Cmd+Alt+Enter / Cmd+Shift+1 / Cmd+Backspace | in Search: Replace All / replace the focused row / dismiss it |
| Cmd+Alt+J | LaTeX: show the caret's line in the PDF, in a `.tex` tab |
| Cmd+Alt+M / Cmd+Alt+X | Math Preview, in a `.tex` tab / TeX view |
| Cmd+F | find in a terminal, or in the app's window for a view with no find of its own |
| Cmd+K | open the palette, or close it when open; in the editor, the first key of the editor's chords |
| Cmd+L, then Cmd+B, I, U, E, R, T, S, C, N, 6 or - | wrap in `\textbf`, `\textit`, `\underline`, `\emph`, `\textrm`, `\texttt`, `\textsl`, `\textsc`, `\textnormal`, `\textsuperscript`, `\textsubscript`, in a `.tex` or `.bib` tab |
| Cmd+L, then Cmd+Enter / Cmd+W | insert `\item` / surround with a command, in a `.tex` tab |
| Cmd+N; Cmd+Shift+N / Cmd+Shift+W; Cmd+,; Cmd+R | new text file; new window / close window; settings; reload (in the app) |
| Cmd+P | find a file by name |
| Cmd+Shift+B / Cmd+Alt+T | default build / default test of the repository |
| Cmd+Shift+F / Cmd+Shift+H | Search / Search with replace |
| Cmd+Shift+M; F8 / Shift+F8 | Problems view; next / previous problem |
| Cmd+Shift+P, F1 | palette in command mode |
| Cmd+Shift+T | reopen the tabs closed last (in the app) |
| Cmd+T | symbols of the workspace (in the app) |
| Ctrl+] / Ctrl+[ | next / previous tab of the focused pane |
| Ctrl+Enter / Cmd+Enter | commit; send a diff comment |
| Ctrl+Shift+M, then Cmd+B, I, R, T, S, Shift+B or C | wrap in `\mathbf`, `\mathit`, `\mathrm`, `\mathtt`, `\mathsf`, `\mathbb`, `\mathcal`, in a `.tex` or `.bib` tab |
| Ctrl+Tab / Ctrl+Shift+Tab | next / previous tab (in the app) |
| Delete | close the focused tab (not a pinned one) |
| Enter, Tab, Up / Down | in the Debug Console: send, complete, history |
| Enter; Up / Down | in a Search box: run; walk the last twenty texts |
| Esc / Enter | in a Files name box: cancel / accept |
| F / P / O | in Present: full screen / presenter screen / overview |
| F10 / F11 / Shift+F11 | step over / into / out |
| F12 / Cmd+click | go to definition; on a hub key, open its entry; on a Markdown link, follow it |
| F4 / Shift+F4; Shift+Alt+H | next / previous reference; call hierarchy |
| F5 | start or continue debugging |
| F9 | toggle a breakpoint |
| g g / G | top / bottom of the page |
| Home / End | in Present: first / last slide |
| Key | What it does |
| n | new agent session in the page's Terminal tab |
| Right / Left, Page Down / Page Up, Space / Shift+Space | in Present: next / previous slide |
| Shift+Enter | palette, on `:task-add`: add and open |
| Shift+F10 | the right-click menu of the focused control |
| Shift+F5 / Cmd+Shift+F5 | stop / restart debugging |
| Tab / Shift+Tab | move between controls; in an editor Tab indents, and Escape then Tab moves on |
| w1-w3 | Live HPC, Usage, Workbenches |
A `downloads` secret is shown as Set or Not set and is never sent to the page.
A file builds through its root: a `% !TEX root = <path>` comment, else the file itself if it has `\documentclass`, else the main file that includes it, else the only main file of its folder.
A file with no `schema:` has no Edit.
A folder has at most one workbench.
A limited tab says `In <root>/<path>` and has a control that widens it to the whole root.
A location in a library opens a read-only tab.
A page is a working surface: a tree of splits and panes, each pane a strip of tabs.
A pane from the arrangement stays, empty, when its last tab closes; a pane you split off closes with its last tab.
A save is atomic and refuses a file with a NUL byte or that is not UTF-8.
A schedule runs a task, a command of a repository's `.oculus/commands.yml` or a prompt on a cron pattern, in local time.
A view opened for something (a project, a person, an entry, a document, a file, a diff) never covers the tool views.
An option that makes the agent ask less (Accept edits, Auto, Bypass permissions, Full access) asks first, every time.
Apply writes the checked edits; Discard writes nothing.
Delete asks first and names everything that refers to the entry; those references become findings.
Eleven views exist once: Settings, Focus, Usage, Live HPC, Findings, History, Processes, Pages, Workbenches, Status and Apps.
Fetch downloads every missing, partial or different file, and a partial file resumes.
Indentation, word wrap and rulers come from, in order: the tab's own choice, the file, the repository's `.oculus/settings.yml`, `editor.languages`, the global keys.
It lands, in this order: in a workbench's documents pane; in the pane that took the last such tab; in the pane you are in, if it holds such tabs; in an empty documents pane; in a new pane split off to the right.
It runs `squeue`, `sacct` and `sinfo` on each cluster over ssh every `slurm.poll_min` minutes.
It writes only where a control says so: back into the file a value came from, and files and folders you make from the Files view.
No app can reach `~/.oculus`, oculus's `config/`, a hub's `secrets` folder or any `local.yml`.
No draft is made at the provider.
Nothing force-pushes except a deposit's snapshot.
Oculus shows the research hub's YAML and Markdown files as boards, lists and documents, in a browser tab or in its own app.
Opening one goes to wherever it is.
Reopen restores a kept layout; Forget drops it.
Results with one DOI, PubMed id or arXiv id merge, each field taken from the source `literature.prefer` puts first.
Resume asks once and runs on the second press, and is disabled while the session runs.
Save writes only the changed fields and keeps the file's other lines and comments.
Search and More each send one request, and nothing else asks the browser.
Switching branch and Sync ask first.
The `secrets` folder of every hub is private: no search, language server, linter fix or app reads it.
The app starts the server and stops it when it quits; tmux terminals keep running.
The deck menu opens the portfolio deck (`portfolio_deck`), a project's `present/` deck, or one opened from Files.
The FILES block lists the files of the extensions in `file_index.ext`.
The layout is Graphviz's neato.
The notes per thread are in `<mail_dir>/triage.json`, written by the card and by the Inbox update task.
```

docs/data-map.md (120):

```
  access: vocab data_access
  affiliations: [organisations key]
  bucket: vocab radar_buckets
  category: vocab venue_categories
  collaborators: [people key]
  compute: [resources key]
  funder: organisations key
  groups.<name>.slides: [a project]
  kind: vocab pillar_kinds
  lead, collaborators, supervisors: [people key]
  maps_to: a project, or new-idea-candidate
  status.chips: [vocab chips]
  supervisors: [people key]
  themes: [an option of the themes field]
  waiting-on: [people key, or a project]
`.oculus/config.yml` may set these 69 keys and no others; any other key is a finding and is not applied.
`radar`: an `idea` entry carries `motif`, `maps_to` and `idea_spark`; the other buckets carry `project`, `relevance` and `why`, and a `preemption` entry also `threatens`.
`resources`: `host` is needed for `slurm.resource` to poll the cluster; it is an ssh alias, a DNS name or an address, with no user name, which is this machine's row of `clusters:` in `local.yml`.
`snooze`, `subtasks` and `followup` are written by oculus into any entry and need no line in a schema.
`text` is laid over the display language and over oculus's English words, key by key.
| `applications` | none | `.oculus/data/academic/applications.yml` | a position application | `key` | Applications |
| `checkbox` | `true` or `false` |
| `data` | `datasets` | `.oculus/data/research/data.yml` | a dataset | `key` | Data |
| `date` | `YYYY-MM-DD` |
| `display` | a whole number from 1: what a card heading and a reference to the entry show, the filled field of the lowest rank first |
| `domains` | `domains` | `.oculus/data/pillars/domains.yml` | an application domain | `key` | Domains |
| `education` | none | `.oculus/data/academic/education.yml` | a course, supervision or service role | `key` | Education & Service |
| `events` | none | `.oculus/data/academic/events.yml` | a talk, visit or conference | `key` | Talks & Events |
| `fields` | the fields of each record of a `records` field |
| `funding` | `funding` | `.oculus/data/academic/funding.yml` | a grant application or programme | `key` | Funding |
| `help` | the hover text in the editor |
| `label` | the field's name on screen |
| `leads` | `leads` | `.oculus/data/academic/leads.yml` | an opening the scout found | `title` | Position Leads |
| `map` | `true` on a `records` field that is a map from a name to a record |
| `metalist` | a list of `{ label, value }` |
| `open` | `true` allows undeclared keys in a `records` or `raw` field |
| `options` | the allowed values of a `select` or `tags` field, each a word or `{ key, label }` |
| `organisations` | `organisations` | `.oculus/data/people/organisations.yml` | a university, hospital, funder or company | `key` | Organisations |
| `people` | `people` | `.oculus/data/people/people.yml` | a person | `key` | People, Person |
| `period` | a date or a span, EDTF: a year `2025`, a month `2025-09`, a day `YYYY-MM-DD`, a moment `YYYY-MM-DDTHH:MM:SS`, with an optional `Z`, `+HH:MM` or `-HH:MM`, a span `2025-09/2026-09`, an open span `2025/..` |
| `pillars` | `pillars` | `.oculus/data/pillars/pillars.yml` | a research line | `key` | Pillars, Map |
| `radar` | `radar` | `.oculus/data/literature/radar.yml` | a paper the literature scout found | `title` | Lit Watch |
| `raw` | a nested map |
| `records` | a list of maps with the fields `fields` lists; with `map: true`, a map from a name to one such map |
| `required` | `true`, or `{ when: ... }` |
| `resources` | `resources` | `.oculus/data/research/resources.yml` | a cluster, machine or storage | `key` | Resources, Live HPC |
| `select` | one of `options`, or a key from `foreign_key` |
| `statements` | none | `.oculus/data/research/statements.yml` | a reusable manuscript statement | `key` | Statements |
| `tags` | a list of strings |
| `tasks` | none | `.oculus/data/academic/tasks.yml` | a task | `key` | Tasks |
| `text` | one line |
| `textarea` | several lines |
| `venues` | `venues` | `.oculus/data/research/venues.yml` | a journal or conference | `id` | Venues |
| Attribute | Meaning |
| Key | Registry | Default file | One entry is | Primary key | View |
| Type | Value |
A `foreign_key:` that is empty, names nothing, or names a collection with no primary key is a finding, and the field offers nothing.
A collection the hub does not list has no view: its tab is left out of its page, and the pane says which key is missing.
A hub keys its files as it likes.
A link between a project and another record is written on one side only.
A project names what it belongs to: its venue, domain, pillars, funding, datasets, compute and people.
A record that is about projects names them: an event, a teaching entry or an application in its `related:`, a literature entry in its `projects:`, a Lit Watch paper in its `project:`.
A record that owns a folder of work, such as a paper, a tool or a study, is a project: its manifest is a `project.yml` at the folder's top or in its `.oculus/`, found by `scan:`, so it moves, is archived and is deleted with its folder.
A status that is no word of its list is a finding naming the closest word of the list when that word is within half the written word's length in single-letter changes, rounded down, and a stage word or a form written as a chip is a finding naming the field it belongs in.
agents:                   # the composer's agents (by name)
An empty value of any other field passes for every type.
app_settings:             # the values of the settings apps declare
apps_dir:                 # where the machine's apps are kept
audit.required_sections:  # the headings a project's file must hold while a manifest key has a value
audit.stage_folders:      # the folders a project at a stage is kept under
Below, each file is named by its collection key, and `[ ]` marks a list.
categories:               # the categories a project is filed under, each with its colour (by key)
chat_context:             # the collections whose files a chat's index holds for the hub
collections:              # the data files and the two feeds, each a key, a file and the fields of what it is
data_access:              # the colour of a dataset's access chip (by word)
deck_order:               # the order a deck places the categories in (whole)
deposit.zenodo.address:   # the address every call of the Deposit view is built from
deposit.zenodo.auth:      # the header, prefix and downloads row of the token every Zenodo call carries
deposit.zenodo.timeout_s: # the seconds one upload of a project's zip is given
events, education, applications:
Fields that name a path are not keys: an Audit row reports a missing path for the `link` of the `funding`, `events`, `education` and `applications` files.
focus_lane_tones:         # the colour of each collection lane bar of Focus (by word)
focus_lanes:              # the Focus lanes, in order, with what a move onto each writes (whole)
forms:                    # the forms of a project's output (by word)
fund_stages:              # the stages stacked in the Focus Funding column, in order (whole)
funding, events, education, applications, tasks:
glyphs:                   # the glyphs' ASCII stand-ins (by name)
icons:                    # the icon map (by name)
In the editor, Cmd+click on a foreign key opens the entry, Find All References lists every place that names it, and F2 renames a registry entry's key everywhere it is named.
latex_editing:            # the sections of the LaTeX tables (by name)
latex_unimath:            # the Unicode math rows (by command)
leads_fit:                # the fit colours of the Position Leads (by word)
lint.writing_skip:        # the files the writing rules skip
locale:                   # the display language: en, or the languageId an app contributes
manifest_fields:          # the fields the hub adds to the form of its own projects (by row)
new_project_dir:          # the folder a new project is made in, per tier
patterns:                 # the file nesting patterns (by pattern)
position_stages:          # the stages stacked in the Focus Job applications column, in order (whole)
radar_buckets:            # the buckets of Lit Watch, in order (whole)
rail_color:               # the colour of a project board's rail count (the hub's value)
recover.sources:          # the reader rows Recover lists a dataset's files with, one per source kind (by key)
research_audit:           # the tiers the audit's research rules skip (by word)
scan:                     # the folders projects are found in
schedules:                # where the schedules are kept
sign_in:                  # the providers a reader signs in with: google, microsoft and git hosts (by key)
slurm.resource:           # the clusters Live HPC polls, in order
teaching_stages:          # the stages stacked in the Focus Teaching & supervision column, in order (whole)
text:                     # words of the interface, by the dotted key of the text catalog
The field flagged `primary_key: true` is the one a write finds the entry by, and its value is required.
The view of either side finds the other by reading the side that names it.
ticker_categories:        # the command center's deadline groups, with their words (by word)
tiers:                    # the kinds of project a manifest's tier names (by word)
venue_tiers:              # the tiers of venues, in order (whole)
venues.browser:           # the reader row of the hub's journal browser
website.cv:               # the command run in that folder after a write
website.files.cv:         # the CV's file, relative to the website's folder
website.files.industry:   # the employer CVs' file, relative to the website's folder
website.files.papers:     # the publications' file, relative to the website's folder
website.files.site:       # the website's own file, relative to its folder
website.kinds:            # the sections of the website's publications, by stage and form
```

docs/decks.md (60):

```
    find: { folders: "projects/*/*/present", tiers: [research], stages: [in-prep], forms: [article], status: [active] }
  frame: { width: 1280, height: 720 }
  tag_tones: { measured: green }
![Loss per epoch](figure.png)
{ figure: figure.png, caption: "Loss per epoch", explain: "Lower is better." }
{ kind: grid, of: members, title: "The ideas", lede: "One card each.", foot: "Drawn by stage." }
{ kind: summary, of: members, title: "Where each project stands", foot: "From the last runs." }
{ label: "Data", value: "two cohorts" }
| `chips` | `status.chips`, each by its label in `chips:` |
| `code` | `code_availability.status`: deposited, anon for `review-anon`, pending for `none`, no code for any other |
| `collaborators` | `collaborators`, each by the person's name |
| `compute` | `compute`, each by the resource's name |
| `datasets` | `datasets`, each by its key |
| `domain` | `domain`, by the domain's title |
| `form` | `form`, by its label in `forms:` |
| `funding` | `funding`, each by its key |
| `lead` | `lead`, each by the person's name |
| `pillars` | `pillars`, each by the pillar's title |
| `reproduced` | `reproduced.date`, else the word reproduced |
| `stage` | `stage`, by its label in `stages:` |
| `supervisors` | `supervisors`, each by the person's name |
| `tier` | `tier`, by its label in `tiers:` |
| `venue` | `venue`, by the venue's short name, else its name |
| `year` | `year`, as it is written |
| Field | Filled from the manifest |
$$ L = \sum_i (y_i - \hat{y}_i)^2 $$
1. **Faster** The model trains in half the time.
2. **Smaller** It needs a third of the memory.
3. **Clearer** Its errors are easier to read.
A `---` inside a fenced code block or an HTML comment does not cut.
A group of other decks keeps every deck.
A name written twice is placed once, and a name that matches no deck the group can see is a finding.
A project slide that sets none of `title`, `sub`, `hook`, `tag`, `eli5`, `equation`, `specs`, `panels`, `method` and `results` draws its body instead.
A slide with no front matter leaves a blank line after its `---`.
Alpha at {{project.stage}}
contact: "name@example.org"
desc: "A model that learns the same with less work."
Each entry of `order:` is one of four things.
eli5: { purpose: "Train faster.", plain: "It learns the same with less work." }
equation: "L = \\sum_i (y_i - \\hat{y}_i)^2"
headline: "Half the training time"
hook: "Half the training time."
How a group picks its decks
Led by {{project.lead}}, for {{project.venue}}.
Measured on the first cohort.
mechanism: "A smaller model"
method: ["Train on the first cohort.", "Test on the second."]
model.fit(data, epochs=10)
Naming it in one group's `slides:` places it there.
No control writes `present.yml` or a slide file.
results: ["Half the training time."]
Spaces inside the braces are allowed.
sub: "A smaller model for the same task"
tag: { class: measured, text: "Measured" }
The decks `slides:` names, in its order.
The heading and the body's first fenced code block; the rest of the body is not drawn.
The heading, the body's first `$$ ... $$` formula as the display formula, and the rest of the words under it.
The new one reads the cache.
The old pipeline read every file.
Write the methods section.
```

## Item 5 lines

- `README.md:42`: "The [Decks guide](docs/decks.md) shows how to write one." Still true.
- `README.md:95`: before "is the manual: every view, key, setting and file. The app shows it on its Help page." After "is the manual: each part of the window and each view, with what its screen does not show, and the keys. The app shows it on its Help page."
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
- Help's scope as built, for the orchestrator's rewrite of `CLAUDE.md:5`: `docs/HELP.md` gives each part of the window and each view, with what it is for and what its screen does not show, and then the keys.

## Judgment calls

- The apps' own views (one registration per app, `src/routes/views.ts:211-234`) and the views the apps contribute (`views.ts:236-261`) have no Help entry, as item 1 says. The Apps entry and the a1-a9 row name them.
- Literature has an entry of its own beside Collection views, since it is the one collection with Save to Literature, Add by DOI and its own key rule. Collection views lists it among the collections it draws.
- Workbenches is both a shell part (under The window) and a view (the float). The view's entry is headed "Workbenches view" and holds only Reopen and Forget, so no fact is written twice.
- The title bar, the update tray and Linux have no entries of their own. The update tray and the schedules are in the rail's entry, since Update sits at the rail's foot. The app and Linux facts are the opening paragraph of The window.
- "A second hub" and "The primary hub" of the data map are now one section, Several hubs. It holds only what changes which file is read or written (decision 5).
- The data map drops its Views table. The collections table keeps a View column, and Help names the file each view draws.
- The keys table drops the rows whose binding is Monaco's own and which the Keyboard Shortcuts view lists (Shift+F12, Cmd+., Shift+Alt+F, Shift+Alt+O, Cmd+L Cmd+L). It also drops the arrows of a menu and of a terminal row.

## User-visible changes

- Help is 7391 words, down from 32223. It has a short entry for each part of the window and each view, then the key table, and it does not describe what the screen shows. The configuration chapter, the Files chapter and the per-view notes are cut to the facts each view's screen does not show, and the keys of the files are on the data map.
- Help's heading "Pages and the pane tree" is now "Pages and panes". "The keys" keeps its anchor `#the-keys`.
- In Help's key table:
  - `p1-p6` replaces `p1-p4`.
  - `h1, h2, h3-h9` replaces `h1-h9 | the Help page's tabs`. Only Help, Keyboard Shortcuts and the hub's `docs:` entries of the Help group have chords, and `layout.yml:334` ships `docs: []`.
  - Escape in Present and Cmd+K Shift+Enter are added.
  - Cmd+Enter now names the Files row too.
- The data map now gives:
  - the keys of `local.yml`, the workspace file, `bookmarks.yml`, `schedules.yml`, `project.yml` and the repository's `.oculus/` files
  - which of the 69 config keys are read from the primary hub only
- Sentences of today's pages that the code shows to be false or incomplete, now corrected:
  - An update task is a file of any hub, and the tray offers the task of every hub that holds its file (`task.ts:5-11`). Today's Help and data map said it was a file of the primary hub.
  - `filter: true` also takes a `period` field (FILTERED_TYPES in `model-collections.ts`).
  - An event's `link` is required when `role: present` and `status` is `upcoming` or `planned` (`docs/templates.md:1481`).
  - `literature.sources`, `recover.sources`, `links`, `sign_in` and `connections.failures` are laid over oculus's rows row by row. They do not replace oculus's value whole (`hub-layer.ts:18-21`, `in-place.ts:147-153`).
  - Breakpoints and watches are kept in `~/.oculus/debug.json` (`page-state/files.ts:5, 22`).
  - Cmd+P skips `.svelte-kit-app` as well as `node_modules`, `.git` and `.svelte-kit` (`query.ts:54`).

## Anything in the brief that was wrong or impossible

Nothing in the brief was wrong or impossible.
