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
