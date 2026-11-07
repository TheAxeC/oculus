# Step O165 refuter report (on .agents/worktrees/migration-O165, base 9dfe43d14)

A page this report cites (the rules file, a standard, a skill's text) is named with its section, never with a line number, since a page's lines move and a section's name does not. A finding in code keeps its `file:line`.

The report is written in the rules file's character set. A character outside it in a quoted line is written by its name in angle brackets, such as `<tab>` or `<em dash>`.

## Verification (rerun by the reviewer)

```
$ npm run test:quick
not run: the review brief says the whole verify list runs at landing

$ npx vitest run tests/checks/source/history.test.ts --reporter=dot
Error: Test timed out in 5000ms.   (the case 'names no package id, date or session in any comment')
Test Files  1 failed (1)   Tests  1 failed | 5 passed (6)   Duration 22.29s
load averages: 16.34 15.35 15.14 (uptime, right after)

$ npx vitest run tests/checks/source/history.test.ts --reporter=dot --testTimeout=120000
Test Files  1 passed (1)   Tests  6 passed (6)   Duration 56.98s

$ LC_ALL=C perl -ne '...brief verify 3, exact form...' docs/HELP.md docs/data-map.md docs/decks.md README.md docs/templates.md docs/apps.md src/lib/state/workbench/layout/open/float/return-place.ts src/lib/ui/controls/editor/chords.ts tests/server/git/clone-exclude.test.ts tests/server/git/git-scan-depth.test.ts config/defaults/sources.yml config/text/views/system/help.yml; echo "exit $?"
exit 0   (no line printed)

$ wc -l -w docs/HELP.md docs/data-map.md docs/decks.md
590 7391 docs/HELP.md | 383 5587 docs/data-map.md | 361 3065 docs/decks.md
$ git show 9dfe43d14:<page> | wc -l -w
646 32223 | 311 5206 | 434 5687

$ links of the three pages (grep -o "\]([^)]*)") and test -f of each target
HELP.md: apps.md x2, data-map.md x3, decks.md x2, palette.md, templates.md; data-map.md: apps.md, decks.md, HELP.md, templates.md; decks.md: HELP.md, figure.png and <file> (both inside code)
ok apps.md, data-map.md, decks.md, HELP.md, palette.md, templates.md
grep -n "^## The keys" docs/HELP.md -> 519:## The keys
grep -rno "HELP.md#...|data-map.md#...|decks.md#..." docs README.md config src --exclude=local.yml -> src/lib/views/shared/prose/doc-link.ts:3:HELP.md#the-keys

The report's quoted commands:
$ git diff 9dfe43d14 -U0 -- src tests | grep "^+" | grep -inE "\b(now|no longer|used to|previously|formerly|renamed|moved|was|were)\b"
4:+// pane floated, which moved or closed that node, gives no place and Return to Page splits the pane
$ awk 'length>100' src/lib/state/workbench/layout/open/float/return-place.ts | wc -l
0
$ grep -c "New follow-up\|Full titles\|Open PDF, Copy BibTeX\|Add app from folder\|Reopen, Forget and New" docs/HELP.md
0
$ awk (### headings under The window / The views) docs/HELP.md
5 65
$ npx vitest run tests/server/git/clone-exclude.test.ts tests/server/git/git-scan-depth.test.ts --tagsFilter slow --testTimeout 20000 --reporter=dot
Test Files  2 passed (2)   Tests  18 passed | 10 skipped (28)
$ grep -rln "unique: true" src/lib/views | wc -l
11
$ grep -rln "export const registration" src/lib/views | wc -l
62
```

Not rerun: the report's `comm -23 c1-components.txt c1-help-all.txt` and the `comm -12` kept-sentence lists (files in the builder's scratchpad, not on the worktree); in their place I enumerated the 62 registrations myself (below, C1).

## Verdicts

Items of the brief's "What to build", in its numbering:

- 1: violated. Every one of the 62 component registrations (the Awaiting board of `Projects.svelte:18-27` among them) has an entry, the collection view and the project board have one each, and the shell's five parts have an entry each; but Help gives the literature collection a second entry (Spec 1), the keys table's `h` row is false (Spec 2), two entries repeat the screen (Spec 3), and the keys paragraph says the Keyboard Shortcuts view lists every key bound (Spec 4).
- 2: holds. `docs/data-map.md` gives every file of item 2's list with its path, keys and links: the collections and feeds (`:212-229`, against `config/defaults/sources.yml:41-50`), `project.yml` (`:280-311`), the hub's `.oculus/` files (`:15-31`, `:48-197`), the repository's `.oculus/` files (`:35-42`); the 42 per-hub keys match `OWN_HUB_KEYS` (`src/lib/data/shapes/hub-keys.ts:11-54`, counted), and the 27 primary-only keys are 69 minus 42. The `local.yml` table is under "Declined to judge".
- 3: holds. Ten kind headings (`grep -c "^### " docs/decks.md` prints 10) match `KINDS` (`src/lib/data/sources/deck/kinds.ts:83-92`); the `present.yml` keys match `readSpec`, `groupsOf`, `find` and `orderOf` (`src/lib/data/sources/deck/spec.ts:121-212`); the front-matter rows match `buildSlide` and `ideaCard` (`kinds.ts:240-330`). One sentence of the page is false (Spec 7, under item 4).
- 4: violated. The report gives the code read per section, several sections citing the old page instead of code (Spec 5); kept or written sentences are false (Spec 6, Spec 7); decision 3's single home for hub-file keys is not kept (Spec 8); the sentences that say what something is not stay (Standards 1).
- 5: holds. README.md:95, :97, :99 and docs/templates.md:1924 are rewritten to the ruled scope (diff read); README.md:42, docs/apps.md:3, chords.ts:120, sources.yml:35 and help.yml:1 read true against the new pages (read above); return-place.ts:3 names "Pages and panes", which is HELP.md:26, and the two test comments name docs/data-map.md, whose `:383` holds the block.
- 6: holds for the step's part: the report gives each page's headings and its line and word counts before and after, which my `wc` reproduces. The writing review and Axel's approval are the orchestrator's (Declined to judge).

Cases of the brief's "Cases":

- C1: partial. The 62 registrations, the collection view and the project board all have entries; Help also names Literature as a view of its own (HELP.md:419), a second entry for the one collection view (Spec 1).
- C2: partial. The `h1, h2, h3-h9` row (HELP.md:539) does not give what the chord list holds, and the `Cmd+K Shift+Enter` row (HELP.md:565) gives half of what its binding does (Spec 2); the deck rows of ruling 706 are present (HELP.md:587-590) and match `moveOf` (`src/lib/views/academic/present/screen/keys.ts:74-91`) and `deckKey` (`screen/box.ts:57-80`).
- C3: unmet. HELP.md:473 and HELP.md:477 repeat what the Views and Pages screens draw (Spec 3); the report's after-check is a grep of five strings (Proof 3).
- C4: met by reading, the `local.yml` table aside (Declined to judge): no file of item 2 is missing and none listed is unread (`order.json`, `src/lib/server/files/fs/notes.ts:13`; `wallpaper_dir`, `apps_dir`, `memories_dir`, `config/defaults/sources.yml:67-75`; the task names, `src/lib/data/model/machine/model-machine.ts:13`).
- C5: met by reading `spec.ts:121-212` and `kinds.ts:83-92, 240-330`: no key missing, each of the ten kinds has an example, summary and grid stand as order entries.
- C6: met: each item 5 line read against the base page it cites and against the new page (item 5 above).
- C7: met with `--testTimeout=120000` (6 of 6). With the default 5000 ms the case "names no package id, date or session in any comment" times out under a load average of 16.34, and the assertion does not fail.
- C8: met: every link target exists and `#the-keys` resolves to HELP.md:519.

## 1. Spec

- S1. docs/HELP.md, The views, "Literature" (HELP.md:419-424): "### Literature / The papers kept in the `literature` file, keyed by citation key ..."; item 1 says the collection view gets one entry, and C1 says Help names no view outside that set. The literature collection is drawn by the generic `Collection.svelte` (registered per entry by `src/lib/views/boards/collection/registration.ts:43-66`; its literature branch `Collection.svelte:225-227, 271-276`), and no component registers an id `literature`. HELP.md:322 already names Literature among the collection views, so the kind has two entries. Failure scenario: a reader looking for what Add does in the Literature tab finds two entries for one view, and a later step follows the precedent and grows one entry per collection again; verdict: item 1 violated, C1 partial.
- S2. docs/HELP.md, The keys, rows `:539` and `:565`: "| h1, h2, h3-h9 | Help, Keyboard Shortcuts, then the hub's documents of the Help group |" and "| Cmd+K Shift+Enter | in the editor: pin the tab |"; the chord list of `h` is the group's views, then the documents of oculus's own folder the rail page's arrangement shows, then the `docs:` entries (`src/lib/state/workbench/navigation/arrangement.ts:206-224`, `src/lib/shell/Workbench.svelte:201-212`, `src/lib/state/workbench/navigation/rail.ts:52-61`, `config/defaults/layout.yml:141-145`), so `h3` to `h7` open the Apps guide, Templates, Data map, Palette and Decks guide. `PIN_KEYS` pins or unpins the tab (`src/lib/ui/controls/editor/chords.ts:15-17, 51`). Failure scenario: a reader presses `h3` expecting a hub document and gets the Apps guide; verdict: item 1 violated, C2 partial.
- S3. docs/HELP.md, The views, "Views" (`:473`) and "Pages" (`:477`): "A click opens the view on the page you came from, and Shift-click in a new pane to the right. A view already open somewhere is shown where it is." and "Every page, with show, rename and close; a rail page also has Reset."; the Views view draws `workbench.catalogue_hint` (`Catalogue.svelte:246`; `config/text/views/system/workbench.yml:126`), and the Pages view draws Rename, Reset to its arrangement and Close as its controls' labels (`Pages.svelte:281, 290, 308`; `workbench.yml:130-134`). Failure scenario: the reader reads in Help the sentence the screen already shows; verdict: item 1 violated, C3 unmet.
- S4. docs/HELP.md, The keys (`:521`): "`?`, the palette's `:keys` and the app's Help > Keyboard Shortcuts open the Keyboard Shortcuts view, which lists every key bound."; the view draws only the rows of `workbenchRows`, `latexRows`, `editorRows` and `appRows` (`src/lib/views/system/help/keys/Keys.svelte:109-114`, `rows.ts:1-8`); the Present keys and the component keys the table carries are in no row. Failure scenario: a reader searches the view for the key that ends a presentation, finds nothing, and concludes there is none; verdict: item 1 violated.
- S5. The builder's report, "Code read, per section": several sections cite "today's page lines ..." or "their head comments"; item 4 asks for the code read per paragraph, list item or table row (`file:line`). Failure scenario: the writing review and Axel cannot check a sentence against its code, and a sentence carried from the old page stays unchecked (Spec 6 is one); verdict: item 4 violated.
- S6. docs/HELP.md:3 and :181: "It writes only where a control says so: back into the file a value came from, and files and folders you make from the Files view." and "the repositories below them down to `repository_scan_depth` levels (1 unless set, at most 3)"; oculus rewrites the `nested-repos` block of a hub's git exclude file with no control (`src/lib/server/git/clone/exclude.ts:5-17`, from `src/lib/server/root/watch/repos/git-start.ts:21`), and the layout is saved as it changes (HELP.md:30); a workspace folder's own `repository_scan_depth` takes any whole number from -1 (`src/lib/server/files/workspace/folders.ts:15-17`, `src/lib/data/sources/config/merge/workspace-file.ts:39`). Failure scenario: a reader is surprised by a changed `.git/info/exclude`; a reader with deep clones believes 3 is the limit; verdict: item 4 violated.
- S7. docs/decks.md:120: "category by category, the categories in the order of `deck_order` in `vocab.yml` and then those it leaves out"; the order is the merged config's `deck_order` (`src/lib/data/shapes/boards/order.ts:99`), a key each hub may set (`src/lib/data/shapes/hub-keys.ts:36`; data-map.md:86). Failure scenario: a reader edits oculus's `vocab.yml` instead of the hub's `.oculus/config.yml`; verdict: item 4 violated.
- S8. docs/HELP.md, Deposit (`:127`), Inbox (`:133`), Calendar (`:156`), Live HPC (`:507`), Settings (`:456`): these restate keys data-map.md gives at `:119-121`, `:153`, `:155`, `:140` and `:270`, against decision 3's one home for a hub file's keys. Failure scenario: a later key change is made on one page and not the other; verdict: none (decision 3, under item 1).

## 2. Proof

- P1. The report's claim that only Help, Keyboard Shortcuts and the hub's `docs:` entries have `h` chords does not reproduce (`arrangement.ts:206-224`, `Workbench.svelte:201-212`, `rail.ts:52-61`, `layout.yml:141-145`); the row at HELP.md:539 rests on it; verdict: C2 partial.
- P2. The report drops "Cmd+L Cmd+L" as Monaco's own; Cmd+L Cmd+L and Cmd+L Ctrl+Shift+M are the LaTeX tab's own chords (`src/lib/data/helpers/keys/oculus/editor-keys.ts:50-51, 75-76, 82`; `rows.ts` `latexRows`). Failure scenario: a reader of a `.tex` tab no longer finds how to make Tab leave the editor; verdict: none.
- P3. C3's five sentences are given as line numbers, unquoted, and the after-check is a grep for five strings, which passes with any other repeated sentence in place; Spec 3 shows two; verdict: C3 unmet.
- P4. The brief's "Verify before you report" 6 (each new sentence read against the prose rule, each departure named with why) has no section in the report, while its first line reads "Everything in the brief is done"; verdict: item 4 violated.

## 3. Standards

- ST1. docs/HELP.md:88, :164, :413, docs/decks.md:120, docs/data-map.md:369: "It offers no New project and is not in the view catalogue.", "Edit opens the text file, so the page has no editor.", "Copy BibTeX writes no file", "A deck reads no pin.", "Fields that name a path are not keys"; the brief's Conventions and item 4 say no sentence says what something is not; verdict: item 4 violated.
- ST2. Four full-list runs, two before the last change, beyond the rules file's "Token discipline"; verdict: none.

## 4. Behaviour

- none.

## Declined to judge

- The "This machine's values" table of docs/data-map.md (`:132-160`): read from `config/options/local.yml`, which the review brief says not to read.
- Every sentence of the three pages against its code: checked were the views set, the keys table, the data map's key counts and file list, the decks guide's keys and kinds, and Help's :3, :13 (in part), :17-24, :31, :32, :36-37, :48, :57, :65, :88, :171-172, :181, :222, :271, :446, :450, :473, :477, :521, the key rows named above and the 706 rows.
- `npm run test:quick`: runs at landing.
- The writing review, Axel's approval (item 6), and the rewrite of `CLAUDE.md:5`.
- Whether Literature keeps an entry of its own (Spec 1) and whether the shell parts keep theirs (decision 4).
- Whether the keys table should carry the Files row keys of `src/lib/state/sources/explorer/acts/keys.ts:43-61`.

Reviewer usage: afbf839ba49f56236, claude-opus-5-5, 279824 tokens, 87 tool uses, 18.4 min

## Repair round 1, refuted

```
$ npm run test:quick
not run: the review brief says it runs at landing

$ npx vitest run tests/checks/source/history.test.ts --reporter=dot
FAIL  |unit| tests/checks/source/history.test.ts > no history in code > names no package id, date or session in any comment
Error: Test timed out in 5000ms.
Test Files  1 failed (1)   Tests  1 failed | 5 passed (6)   Duration 11.17s
load averages: 7.66 9.91 10.63 (uptime, right after)

$ npx vitest run tests/checks/source/history.test.ts --reporter=dot --testTimeout=120000
Test Files  1 passed (1)   Tests  6 passed (6)   Duration 9.15s

$ LC_ALL=C perl -ne '...brief verify 3, exact form...' docs/HELP.md docs/data-map.md docs/decks.md README.md docs/templates.md docs/apps.md src/lib/state/workbench/layout/open/float/return-place.ts src/lib/ui/controls/editor/chords.ts tests/server/git/clone-exclude.test.ts tests/server/git/git-scan-depth.test.ts config/defaults/sources.yml config/text/views/system/help.yml; echo "check3 exit $?"
check3 exit 0   (no line printed)

$ wc -l -w docs/HELP.md docs/data-map.md docs/decks.md
571 6890 docs/HELP.md | 383 5542 docs/data-map.md | 361 3049 docs/decks.md
$ git show 9dfe43d14:<page> | wc -l -w
646 32223 | 311 5206 | 434 5687

$ links of the three pages (grep -o "\]([^)]*)")
HELP.md: apps.md x2, data-map.md, data-map.md#bookmarks-schedules-and-tasks, #collection-files x2, #repositories-below-a-hub, #the-files x3, #the-hubs-settings x3, #the-workspace-file x2, #this-machines-values x6, decks.md x2, palette.md, templates.md
data-map.md: apps.md, decks.md, HELP.md, templates.md
decks.md: data-map.md#the-hubs-settings, HELP.md, figure.png and <file> (inside code)
grep -n "^## " docs/data-map.md -> The files :11, The hub's settings :48, This machine's values :132, The workspace file :162, Bookmarks, schedules and tasks :191, Collection files :199, Repositories below a hub :381 (each anchor resolves under the GitHub slug rule of src/lib/data/prose/markdown/markdown.ts:10)
grep -n "^## The keys" docs/HELP.md -> 492:## The keys
grep -rno "HELP.md#...|data-map.md#...|decks.md#..." docs README.md config src tests --exclude=local.yml -> doc-link.ts:3 HELP.md#the-keys, and the 19 data-map anchors of HELP.md and decks.md above

The round's report quotes:
$ LC_ALL=C grep -n '[^ -~]' docs/HELP.md docs/data-map.md docs/decks.md README.md; echo "grep exit $?"
grep exit 1
$ git diff 9dfe43d14 -U0 -- src tests | grep "^+" | grep -inE "\b(now|no longer|used to|previously|formerly|renamed|moved|was|were)\b"
4:+// pane floated, which moved or closed that node, gives no place and Return to Page splits the pane
$ awk 'length>100' src/lib/state/workbench/layout/open/float/return-place.ts | wc -l
0
$ every `src/`, `config/`, `tests/` path the report cites, tested with [ -e ]
MISSING config/options/*.yml, src/lib/data/helpers/files/private.ts, src/lib/data/helpers/keys/editor-keys.ts, src/lib/data/helpers/literature-key.ts, src/lib/data/sources/config/folders.ts, src/lib/data/sources/projects, src/lib/server/edit/adapters/yaml/hub-keys.ts, src/lib/server/edit/feeds/leads.ts, src/lib/views/shared/prose/editor/latex-editing.ts
```

Not rerun: `(npm run diagrams && npm run test:quick)`, the whole verify list, which runs at landing; the `comm -12` kept-unit lists, which are files in the builder's scratchpad.

The round's delta: `diff -u` of each of the 8 paths of `files.txt` against the worktree. The delta changes `docs/HELP.md` (642 diff lines), `docs/data-map.md` (164), `docs/decks.md` (123) and `README.md:95`. It leaves `docs/templates.md`, `return-place.ts` and the two test files unchanged. No path outside `files.txt` changed (`git status --short`: the 8 paths, the round brief and the report).

### Verdicts

Items of the brief's "What to build", for the whole diff since the base:

- 1: holds. The Literature entry is gone (`grep -n "^### Literature$"` prints nothing). Its facts are one bullet at HELP.md:318. Every view of the first review's enumeration keeps its entry. The keys table rows checked below match the code: the `h` row against `layout.yml:135-145` and `arrangement.ts:206-224`, the pin row against `chords.ts:15-17, 51`, the Files rows against `keys.ts:43-61`, the LaTeX chords against `oculus/editor-keys.ts:50-51, 66-82`, and the Present rows.
- 2: holds. Sampled: This machine's values (`local.ts:159-161, 199-212`, `git-message.ts:45, 53-61`), the workspace depth (`src/lib/server/files/workspace/folders.ts:15-17`) and the repositories block (`exclude.ts`).
- 3: holds. decks.md:120 matches `order.ts:99` and `hub-keys.ts:36`, and the delta's rewrites, read, keep each rule.
- 4: violated. Sentences that are true and needed were removed without being asked for (Spec 1, Spec 2). Two removals give "no code" as their reason, and the code exists (Proof 1). The citations hold paths that do not exist (Proof 2).
- 5: holds. Each line still reads true; `README.md:95` was changed again in the round (Spec 3).
- 6: holds for the step's part (the headings and counts are given, and `wc` reproduces them).

Cases:

- C1: met. The views set is unchanged except that Literature is folded into Collection views.
- C2: met. The `h1 / h2 / h3-h7 / h8, h9` row matches the Help arrangement, the two editor views of group `help` (`Help.svelte:12`, `Keys.svelte:10`) and `docs: []` (`layout.yml:334`). The pin row says pin or unpin, the nine Files rows match `ENTRIES`, and the 706 rows are present at HELP.md:568-571.
- C3: met by reading a sample. HELP.md:446-452 no longer repeat `workbench.catalogue_hint` or the Pages controls (`workbench.yml:126-135`). Each removal the report attributes to a string was checked against that string and the string holds the fact: `deposit.yml:83-89`, `person.yml:11-15`, `linkedin.yml:18`, `present.yml:54`, `career.yml:27-29`, `session-detail.yml:34-36`, `terminal.yml:105`, `repositories.yml:254, 268`. The C3 base sentences at base HELP.md:90, :262, :288, :306 and :314 are quoted in full.
- C4: met (as item 2).
- C5: met (unchanged in the round apart from wording).
- C6: met. README.md:42, :95, :97 and :99, templates.md:1924, apps.md:3 and the six comments read true against the new pages.
- C7: met only with `--testTimeout=120000`. At the default 5000 ms the comment case times out under a load average of 7.66, and the report quotes no run of this check after the change (Proof 3).
- C8: met. Every link and anchor resolves, `#the-keys` to HELP.md:492.

Items of the round's brief:

- 1 (S1 Literature): holds. HELP.md:310 and :318.
- 2 (S2, P1 `h` row and pin row): holds. The report's citation of the LaTeX file uses a wrong path (Proof 2).
- 3 (S3, P3): violated. The two named sentences are removed and the C3 quotes are given. The report's list of "every sentence removed in this round" is incomplete (Spec 4), and the sweep removed sentences that the screen does not draw (Spec 1).
- 4 (S4): holds. HELP.md:494 against `Keys.svelte:109-114` and `rows.ts:285-327`.
- 5 (S5 citations): violated (Proof 1, Proof 2).
- 6 (S6): holds. The HELP.md:3 sentence is removed. HELP.md:173 gives 0 to 3, 1 when unset (`config/options/sources.yml:181-188`, `config/defaults/sources.yml:78`), and -1 meaning no limit (`src/lib/server/files/workspace/folders.ts:15-17`).
- 7 (S7): holds.
- 8 (S8): holds for the five named entries and those the report adds (links at HELP.md:121, :127, :148, :433, :480 and others).
- 9 (P2 LaTeX chords): holds. HELP.md:543 matches `SECONDS_MAC` and `SECONDS_ELSEWHERE` (`src/lib/data/helpers/keys/oculus/editor-keys.ts:66-82`).
- 10 (P4 verify 6): holds. The section exists.
- 11 (ST1): violated for one removal (Spec 1, the no-primary sentence of the data map). Otherwise holds: the grep of `not|never|cannot|nothing` over the three pages leaves only conditions and values.
- 12 (Files row keys): holds. HELP.md:522-530 match `src/lib/state/sources/explorer/acts/keys.ts:43-61`.
- 13 (This machine's values): holds by a sample of three rows, `port`, `self` and `commit_message_account`, against `local.ts:159-161, 199-212` and `git-message.ts:45, 53-61`. The citations are in the report and not on the page (Declined to judge).

### Findings

Spec

- S1. Removals in this round of true facts that a reader needs. No round item asked for them, and the round brief's preamble says "No line of the pages is cut to save words where the reader needs it". Each was read against its code:
  - HELP.md:34, base "Float, in the pane menu or a tab's menu, or a drag with Alt held, floats a pane" became "Float, in the pane menu or a tab's menu, floats a pane". A tab dragged with Alt held becomes a float (`src/lib/shell/panes/DropLayer.svelte:14-16, 37`).
  - Files, base "Show Hidden Files, Show Ignored Files and File Nesting are kept per tab." was removed. The code keeps them in the instance's own state (`src/lib/views/sources/files/Files.svelte:29-33`).
  - Terminal, base "Each pane of a tmux session you started yourself is a terminal while Claude or Codex runs in it; Attach to Session takes it in, and closing its tab leaves the tmux session running." was removed. The code has by-hand panes (`src/lib/server/machine/pty/channel.ts:32, 551-573`; `src/lib/views/sessions/terminal/terminal-list.ts:18-19`).
  - Debug, base "One session runs at a time." was removed. The debug client runs "one debug session at a time" (`src/lib/server/machine/debug/session.ts:1`).
  - TeX view, base "and a changed file asks again" was removed. The approval hashes the rc files (`src/lib/server/machine/pty/latex/approval.ts:10, 118-130`).
  - data-map.md:173, base "Without `primary:` the workspace has no primary hub, and then it has no bookmarks file and no schedules." was removed (the report lists it under ST1). The schedules file is null with no primary (`src/lib/server/machine/runs/schedules/watch.ts:90`). The brief's decision 5 keeps the primary hub where it changes which file is read, and the Several hubs section (:377) does not say what happens without one.
  - None of the first five is in either removal list of the report.
  - Failure scenario: a reader never learns that an Alt-drag floats a tab, or that a changed `latexmkrc` asks again. A reader whose second debug launch is refused finds no reason. A reader with no `primary:` looks for their schedules.
  - Verdict: item 4 violated, round items 3 and 11 violated.
- S2. HELP.md:138, base "a lead with `rolling: true` and no day stays live until it is closed" became "a lead with `rolling: true` reads applications as they arrive, with or without a day". The new clause describes the posting and not what oculus does. It drops the rule `isExpired` applies: a lead with no day stays live until it is closed, rolling or not, and a rolling lead whose day has passed is expired (`src/lib/state/feeds/leads.ts:155-166`). No round item asked for it. Failure scenario: a reader keeps a rolling lead with a past deadline and expects it to stay live, and it moves to Expired. Verdict: item 4 violated.
- S3. README.md:95, "with what its screen does not show" became "with the rules, files and limits behind what its screen shows". No round item asks for it: round item 11 covers the three pages. The line is still true of the new Help. Failure scenario: none for a reader; the change reaches beyond the round. Verdict: none.
- S4. The report's "Sentences removed in this round because the screen draws them" and "... for want of a citation" omit the five removals of Spec 1 and, among others:
  - "It and Role are drawn only while `self` names a person" (Focus);
  - "Mine only is on by default while `self` names a person" (Project boards);
  - "and a project that stops waiting leaves it" (Awaiting board);
  - "the first account of a provider opens Account setup" (Inbox);
  - "and is disabled while no word or two words carry it" (Position Leads);
  - "It follows the disk within a couple of seconds" (Files);
  - the one-way and mutual edge clause (Map);
  - "the months are approximate" (Venues);
  - the Tasks section sentence (Focus);
  - the title bar strip sentence (The window).

  Round item 3 asks the report to list every sentence removed in this round with the string or markup that shows it. Failure scenario: the orchestrator and Axel, reading the report to approve the pages, cannot see which facts left. Verdict: round item 3 violated.

Proof

- P1. The report's "Sentences removed in this round for want of a citation" gives two removals as having no code, and both have code:
  - "The Files sentence on a 32 MB upload limit ... no code was found". A pasted picture goes through the upload and its limit (`src/lib/state/sources/explorer/notes/note-attach.ts:6-7, 15`, `MAX_UPLOAD_BYTES = 32 * 1024 * 1024` at `src/lib/data/file-ops.ts:46`). The decks guide cites the same constant for images.
  - "while a tab holds it every control that would write that file is disabled: no single module gives it". The code does: "A write over a hub file that a source tab of this page holds unsaved text of is refused before it is sent, whichever control sent it" (`src/lib/state/client/writes.svelte.ts:15-18`), and a form is blocked with `collection.file_unsaved` (`src/lib/views/shared/forms/entry-file.ts:150-157`).

  The decision that rests on this claim is round item 5's removal rule. Failure scenario: a reader pastes a 40 MB picture, or presses Save in a form while a source tab holds unsaved text, and gets a refusal no Help line explains. Verdict: round item 5 violated, item 4 violated.
- P2. Report, "Code read per paragraph, item and row": nine cited paths do not exist ([ -e ] above). The right files are:
  - `src/lib/server/machine/apps/reach/private.ts`;
  - `src/lib/data/helpers/keys/oculus/editor-keys.ts`;
  - `src/lib/server/edit/feeds/literature-key.ts`;
  - `src/lib/server/files/workspace/folders.ts`;
  - `src/lib/server/machine/lsp/adapters/yaml/hub-keys.ts`;
  - `src/lib/ui/controls/editor/kit/latex/latex-editing.ts`;
  - `src/lib/data/prose/markdown/markdown.ts`;
  - two leads files, of which the intended one is not clear.

  Several rows give a file with no line: `model.ts`, `tree.ts`, `new-project.ts`, `make-words.ts`, `resolve.ts`, `Sash.svelte`, `desktop-keys.ts`, `palette-table.ts`, `box-keys.ts`, `tree-keys.ts`, `project.ts`, and "the commit box and the diff comment box bindings, `resolve.ts`". Round item 5 asks for `file:line` for each paragraph, list item and table row. Failure scenario: Axel or the writing review checks a sentence against its citation and finds no such file. Verdict: round item 5 violated.
- P3. Report, DONE / NOT DONE: the brief's "Verify before you report" 2 (`npx vitest run tests/checks/source/history.test.ts --reporter=dot` passes) has no row and no quoted run after the change. Its only run in the report is the first run, which failed. My rerun fails at the default 5000 ms timeout and passes at 120000 ms. Failure scenario: the landing reads C7 as proven by the quick list, which the report does not show covering this file. Verdict: C7 met only with the longer timeout.

Standards

- ST1. Report, "Number of full-list runs": this round started the list twice (run 5 stopped, run 6). The rules file's "Token discipline" allows one run after the last change, and the round brief says "once after the last change". Failure scenario: the machine's load during the review rises, as it did for the history case. Verdict: none.
- ST2. The report has no table of the files changed with line counts. The rules file's "Report" section asks for one, and only the three pages carry counts. Failure scenario: the landing cannot check the size of the change to the five other paths from the report. Verdict: none.

Behaviour

- none. The pages, the key table rows and `README.md:95` are stated in "User-visible changes".

### Declined to judge

- `npm run test:quick` and every whole-suite command: they run at landing.
- Whether a tooltip or a confirm dialog counts as "what the screen shows by itself". The builder read the brief's "its strings under `config/text/views/`" that way for the Deposit, Person, LinkedIn, Present, Career, Session, Terminal and Repositories removals. The strings do hold the facts. Whether Help should still carry them is Axel's reading of the pages (item 6).
- "Every drag has a menu item that does the same": a read of every drag in the tree would settle whether it is true; not done.
- Whether round item 13 meant the citations to stand on the page or in the report. The builder put them in the report and named that as a judgment call.
- The writing review and Axel's approval (item 6). The round brief carries no writing-review findings, though item 6 says the orchestrator sends them in the repair round. This is the orchestrator's part.
- Every sentence of the three pages against its code. Read here: the round's delta in full; the code of HELP.md:24, :34, :138, :159-167, :173, :177, :195, :201-205, :209-215, :233-237, :318, :336-338, :352-356, :494, :512, :522-546; and data-map.md:132-160, :173 and :377.

Reviewer usage: af6f8bb10a8b887c8, claude-opus-5-5, 261745 tokens, 78 tool uses, 10.0 min
