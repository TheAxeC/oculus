# Step D49 brief check (on main at 652f5104a)

The report of the fresh agent of the `spec` skill's "Steps / The brief check", on `agents/briefs/D49.md`. A page this report cites (the rules file, a standard, a skill's text) is named with its section, never with a line number, since a page's lines move and a section's name does not. A line of code or a hit of a grep keeps its `file:line`.

`git rev-parse HEAD` printed `652f5104a8559f843354360ab5da2392dcf3ab53`. `plan.md` has no section named Goal (`grep -n '^## ' plan.md` prints Packages in execution order, Could run in parallel, Rulings (2026-09-10), Agents, Blocked and by what), so the goal used below is the one the task states. `plan.md:716` and the ruling at `plan.md:1627`, item (8), read as the brief quotes them.

## 1. Names

**The seven guide file names.** `for g in configuration debugging files-and-search source-control terminals views window; do git grep -n "$g\.md" -- . ':!tools/oculus/.scratch' ':!tools/oculus/config/local.yml'; done`. Hits in files on the write list: `.oculus/config/layout.yml:14-20`, `tools/oculus/HELP.md` (17, 99, 103-154, 156, 160, 164, 168, 184, 188), `tools/oculus/config/layout.yml:93`, `doc-link.ts:3`, `README.md:9`, and the guides themselves, which are deleted. The hits outside the write list are all in `tools/oculus/DESIGN.md`. The write list limits that file to lines 82, 140, 238, 482, 491, 521, 530, 533 and 556, but the guides are named on 50 lines:

- `grep -nE "docs/(configuration|debugging|files-and-search|source-control|terminals|views|window)\.md|(Window|Views|Configuration|Debugging|Source Control|Terminals and commands|Files and search) guide" DESIGN.md | cut -d: -f1` prints `91 140 142 144 146 148 150 152 156 238 240 266 462 464 469 472 474 478 480 482 484 488 497 506 509 517 521 524 527 528 530 531 533 535 536 537 538 539 554 556 563 565 566 567 568 570 577 581 590 591`.
- The brief misses 43 of those lines: 91, 142, 144, 146, 148, 150, 152, 156, 240, 266, 462, 464, 469, 472, 474, 478, 480, 484, 488, 497, 506, 509, 517, 524, 527, 528, 531, 535, 536, 537, 538, 539, 554, 563, 565, 566, 567, 568, 570, 577, 581, 590 and 591.
- Examples:
  - `DESIGN.md:91` "which the Configuration guide (`docs/configuration.md`) lists with what each holds"
  - `:266` "the user's side of this is `docs/configuration.md`, "`local.yml`""
  - `:591` "What a reader meets is in `docs/debugging.md`."
- Each of these becomes false once the files are deleted.
- Lines 266, 462, 464 and 469 also lie outside the brief's "Read" ranges for DESIGN.md (30-95, 130-160, 230-245, 470-595).

**The guide titles.** `git grep -n -E "(Window|Views|Configuration|Debugging|Source Control|Terminals and commands|Files and search) guide" -- . ':!tools/oculus/.scratch' ':!tools/oculus/config/local.yml'`. Outside the write list it hits `DESIGN.md:91, 144, 146, 148, 150, 152, 156`, for example `:144` "What a reader sees is in the Views guide (Literature search), and the keys are in the Configuration guide". All of these become false. Every other hit is on the write list (`config-folder.test.ts:3`, HELP.md, the two layout files, README.md:9) or in a deleted guide.

**The phrase "the guides" and "guide" in comments and documents.** `git grep -n -i "guide" -- tools/oculus/src tools/oculus/config tools/oculus/tests ... ':!tools/oculus/config/local.yml'`.

- `src/lib/views/shared/prose/doc-link.ts:2` reads "Help and the doc view draw oculus's manual, its guides and the hub's documents". This file is on the write list, but item 7 names only line 3's example. Line 2 becomes false.
- `tests/checks/source/history.test.ts:24` reads "The folder holding the guides". It is on the write list as "comments", and item 7's text covers it only generally.
- `HELP.md:3`, the opening paragraph, reads "This page is the short guide to using it; each section links to the guide that holds the detail". This becomes false. Item 2 says "HELP.md keeps its title, its opening paragraph", which read literally keeps this sentence. Case 2's regex does not match it.
- `HELP.md:17` reads "The Help page holds this manual, the hub's documents and the guides". It is covered only through the rule that its links go.

**The "Design" entry.** `git grep -n -E "\"Design\"" -- . ':!tools/oculus/.scratch' ':!tools/oculus/config/local.yml'` hits only `.oculus/config/layout.yml:21`, which is on the write list. `DESIGN.md:493` ("whether or not the `docs:` list names it") and `:495` stay true.

**The Apps guide's description.** `HELP.md:180` reads "`docs/apps.md` is the guide to building an app, step by step with a worked example". Item 3 cuts the tour and the large example, so "step by step" becomes false. Item 2 says only that "a link to `docs/apps.md` stays".

**HELP.md headings and anchors.**

- `grep -rnoE "HELP\.md#[a-z0-9-]+" --exclude=local.yml src config tests docs DESIGN.md README.md ../../docs ../../.oculus` prints `src/lib/views/shared/prose/doc-link.ts:3:HELP.md#the-keys` and `docs/window.md:3:HELP.md#the-keys`. "The keys" is kept, so both stay true. The second is deleted with its guide.
- No file links `#files-and-the-editor` or `#terminals`.
- Anchors are the GitHub-style slugs of marked-gfm-heading-id (`src/lib/data/prose/markdown.ts:10`), so case 5's GitHub-style check matches the app.

**DATA-MAP's section "oculus configuration files".** `git grep -n -i "oculus configuration files\|DATA-MAP" -- . ':!tools/oculus/.scratch' ':!tools/oculus/config/local.yml'`. The section heading appears only at `docs/DATA-MAP.md:226`, and nothing links to its anchor. Lines outside the write list that cite the page:

- `.oculus/config/sources.yml:47`: the same sentence as `config/sources.yml:49`, "the links between files are in docs/DATA-MAP.md". The brief does not name it.
- `DESIGN.md:583`: "One rule is not in a schema and is stated once, in `specs.ts` and in `docs/DATA-MAP.md`: the keys of the `domains:` map...". Not named.
- `CONTEXT.md:3` and `:6`, `README.md:6` (hub root), `docs/RESEARCH-APPROACH.md:57`.
- None becomes false provided the links table and the domains rule (`DATA-MAP.md:303`) stay. The brief names only the two lines at `config/sources.yml:49` and `specs.ts:11` as the ones that must stay true.

**The h1-h9 row.** `git grep -n "h1-h9\|a hub document or a guide" -- . ':!tools/oculus/.scratch' ...` hits `HELP.md:51` and `config/text/app.yml:13`, both on the write list.

**The rules file.** It is under `.scratch`, so outside the grep, but it is the step's standard. `agents/spec.md`, section "What every package obeys", says: "A step writes HELP.md only where what a user does changes, in the guide's short form; every other detail goes to the guide under `docs/` that owns it". After the step, no guide under `docs/` owns any user behaviour except apps, and item 2 puts that detail into HELP.md as bullets. The sentence becomes false and conflicts with this step. The rules file also says "Nothing in a brief overrides anything here". Only the orchestrator can change that file, and the brief does not mention it.

Findings:
1. **DESIGN.md is under-listed.** The premise at brief line 23, item 5 and the line-restricted write entry for `tools/oculus/DESIGN.md` miss 43 of the 50 lines that name a removed guide (listed above). Case 2 cannot pass without writing outside the listed lines.
2. **`HELP.md:3` would be kept false.** Item 2 says to keep the opening paragraph, whose sentence "each section links to the guide that holds the detail" becomes false.
3. **`HELP.md:180` is not addressed.** "step by step with a worked example" becomes false under item 3.
4. **`doc-link.ts:2` is not named.** Its "its guides" is outside item 7's explicit list.
5. **Two lines that cite DATA-MAP are not named.** `.oculus/config/sources.yml:47` and `DESIGN.md:583` both rest on DATA-MAP and are not among the lines that must stay true.
6. **The rules file's HELP.md/guide sentence clashes with item 2.** It sits in spec.md, section "What every package obeys", becomes false after the step and is not raised by the brief.

## 2. The step line

| Part of `plan.md:716` | Requirement in "What to build" |
|---|---|
| the seven guides removed | item 1; case 1 |
| what is worth keeping folded into HELP.md as short bullets | item 2 and its sub-bullets |
| (the debugging keys and the `launch.yml` example among them) | item 2, Debugging sub-bullet; case 3 |
| the Apps guide rewritten short | item 3; cases 4 and 10 |
| DATA-MAP rewritten to give each file's fields and links itself instead of pointing into oculus's source and config | item 4; cases 7, 8 and 9 |
| DESIGN.md kept as a file, taken out of the app's view list | item 5, first sentence; case 6 |
| its links into the removed guides rewritten | item 5, second sentence, but only for 7 of 50 lines (section 1) |
| the Help page's arrangement and the `docs:` list follow | item 6; case 6 |

Item 7 (comments and README) serves "links rewritten" and keeps the change consistent.

Findings:
1. **Links rewritten: only partly required.** The part "its links into the removed guides rewritten" is required for 7 of the 50 DESIGN.md lines.
2. **"Instead of pointing into oculus's ... config" is only partly required.** Item 4 removes the schema column, the vocab-key targets and the "oculus configuration files" section. It then says "Every other fact of the page stays", which keeps:
   - the "Where each schema is" rows for "the oculus option files", `tools/oculus/config/local.yml` and "the catalog files and the text files of `tools/oculus/config/`" (`DATA-MAP.md:378-380`);
   - the section "Option files" (`DATA-MAP.md:508-510`), which describes `tools/oculus/config/catalogs/options.yml` and its controls.

   These are the same class of content that decision 3 removes ("the engine's files are oculus's configuration, which the ruling takes out of DATA-MAP"). The brief is inconsistent with its own reason.
3. **Item 3 leaves apps.md part 11 undecided.** `docs/apps.md:830-861`, "When something goes wrong", a troubleshooting table and console steps, is in neither item 3's keep list nor its cut list ("the step-by-step tour and the large example of part 10").

## 3. Premises

| Brief line | Command rerun | Result |
|---|---|---|
| 19, sizes | `wc -l` of the files | 861, 88, 109, 154, 67, 69, 287, 98, HELP 188, DESIGN 591, DATA-MAP 519: holds. `wc -c docs/*.md` total 333860. The seven guides sum to 872 lines, matching decision 1's "some 870". |
| 20, docs folder and diagrams | `ls docs`; `grep -ln "diagrams/" docs/*.md HELP.md DESIGN.md README.md` | eight guides plus `diagrams`; DESIGN.md and README.md only: holds |
| 21, headings | `grep -n '^#' docs/*.md HELP.md` | HELP.md sections as stated; key table 27-95; debug keys 88-92; view table 101-154: holds |
| 22, HELP links and key row | `grep -n "docs/" HELP.md`; `grep -o "h1-h9[^;]*" config/text/app.yml` | lines 13, 17, 21, 25, 99, 103-154, 156, 160, 164, 168, 180, 184, 188; `h1-h9 \| open the manual, the Memories wall, a hub document or a guide, the Help page's group`: holds |
| 23, DESIGN.md lines | `grep -nE ... DESIGN.md` (section 1) | **Does not hold.** The guides are named on 50 lines, not 82, 140, 238, 482, 491, 521, 530, 533 and 556. The brief's own command `grep -n "docs/\|guide" DESIGN.md` prints them all. |
| 24, README | `grep -o ".\{100\}docs/window.md.\{60\}" README.md` | the Window guide link on line 9: holds |
| 25, comments | `git grep -n -i "guide" -- <files>` | holds for the lines named. Also hit: `doc-link.ts:2` ("its guides"), `history.test.ts:24` and `:153`, and the test title at `:155` ("every guide"). |
| 26, Help arrangement | `sed -n 91p config/layout.yml`; `grep -n "^docs:"` | 92 is `help:` and 93 its root, eight doc tabs; `docs: []` at 182: holds |
| 27, hub's layer and demo | `cat -n .oculus/config/layout.yml`; `git ls-files .oculus`; `ls demo/.oculus/config` | 13 entries at 9-21, tracked; demo holds `behavior.yml catalogs`: holds |
| 28, tests | `git grep -ln "HELP\|views\.md\|window\.md\|docs/apps" -- tests`; `grep -n "path" tests/checks/config/arrangements.test.ts` | `tests/checks/source/history.test.ts` only; the second prints nothing (exit 1): holds |
| 29, no other file | the per-file grep of section 1 | holds at file level |
| 30, DATA-MAP pointers | `grep -nE "tools/oculus\|src/lib\|config/\|catalogs/\|schemas/" docs/DATA-MAP.md` | **Incomplete.** The brief stops at "the Links table from line 263 on". There are also hits at 317, 319, 325, 340, 344-365 (section "Fields that hold only under a condition", whose last column names source functions), 374-384, 388, 402, 409, 426, 437, 446, 472, 489, 504, 506, 510 and 518. |
| 31, two lines | `sed -n 49p config/sources.yml`; `sed -n 9,14p specs.ts` | holds |
| 32, sparse checkout | state file block, `worktree_paths` | holds `docs`, not `.oculus`: holds |
| 26 and 45, bridge path | `ls -d static`; `grep -rln "oculus.js" src` | `static` does not exist. The bridge is `src/lib/server/machine/apps/oculus.js` (150 lines), served by `src/lib/server/machine/apps/serve.ts`. The brief names a path that is not there, though its find command reaches the right file. |
| 5, ADR | `ls docs/adr tools/oculus/docs/adr` | both "No such file or directory": holds |

DATA-MAP facts the brief does not state:

- `DATA-MAP.md:424-434` already holds a side-project field table. It lists 5 fields (`title`, `status`, `eli5`, `next`, `links`) and says "any other key is a finding".
- `side-project-schema.yml` holds 17 `field:` rows (`grep -c "field:"`), so that table is false on the base.
- Item 4 adds a new side-project table in the Data files table and says "Every other fact of the page stays", which leaves the old table both duplicated and false.
- DATA-MAP's convention sentence "A function or constant named without a path is in the file that the sentence above or below its table names" (line 20) has nothing to apply to once item 4 removes every source name, and item 4 does not mention it.

## 4. Cases and checks

**Case 2 conflicts with the brief's own ban on `config/local.yml`.**

- The case dictates `grep -rnE` over `tools/oculus .oculus docs` in place of `git grep`, with no `--exclude=local.yml` and no exclusion for `.scratch`, `node_modules` or the build folders.
- Read literally, it greps `tools/oculus/config/local.yml`, which the brief's own "Verify before you report" forbids ("Never read, print, grep or hash `config/local.yml`").
- Its "Before: the lines of 'What is on the tree'" is also wrong: the before output holds the 43 DESIGN.md lines of section 1 and the guides' references to each other (for example `docs/views.md:157`, `docs/files-and-search.md:3`).

**Case 2 cannot pass under the write list**, which limits DESIGN.md to nine lines (section 1).

**Case 11 offers "a server over the demo hub" as one way to run it.** The rules file, section "What every package obeys", says "A builder runs no page: it starts no scratch oculus for a browser". The case's proof is `npx vitest run tests/checks/config` anyway. Keep the vitest run and drop the server alternative.

**Case 12 checks code the step does not change**: the layout reader and the doc view's missing line. It is justified as an implied input. Its expected result, "draws the doc view's missing line", is a drawn result. The rules file, section "What every package obeys", says a behaviour that needs a DOM is seen at the look, so the case should name the look as the proof of the drawing and the run as the proof of the state only.

**Case 10 checks code the step does not change** (the bridge, the manifest reader, the write gate). This is the necessary check of item 3's "every fact kept is checked against the code", so it is justified.

**Case 9's "the keys of that map" fits only some of the vocab entries**, so the case is ambiguous for the rest. `python3` over `config/catalogs/vocab.yml`:

- maps: `type_color`, `data_access`, `career_host_status`, `side_project_status`, `palette`;
- lists of `{key: ...}` records: `status_legend` (30 records), `focus_lanes`, `priority_levels`, `venue_tiers` (with `unrated` marked `assignable: false`), `radar_buckets`;
- a plain list: `venue_categories`.

The case needs to say that "key" means the `key:` field of a list record, and whether a word with `assignable: false` is an allowed word.

**The brief's verify item 4 uses the `LC_ALL=C grep -n '[^ -~]'` form.** The rules file, section "Nothing left undone, no yes for a fix, reported means booked", ends with the ASCII gate paragraph, which says its perl form "replaces the `grep '[^ -~]'` form wherever a brief or a check names it". That form is defined over `src tests bin config` and does not cover Markdown, so the grep over the Markdown files is reasonable. The brief should say why it departs from the rules file.

**Item 2 clashes with the rules file** (section 1, finding 6).

**No other case conflicts with the rules file.** The rule "no test added" matches the test rule in the rules file, section "What every package obeys".

## 5. The question

Could each check pass without the goal being reached?

**The step line's check.** `plan.md:716` names no check of its own. The brief's "What it must do" is "every item met, every case met, the verify list green". That can pass only as far as the cases below reach.

**The cases:**

1. Case 1 (`ls docs`) can pass with the guides deleted and nothing folded into HELP.md. It proves removal only.
2. Case 2 (empty grep) can pass by deleting every sentence that points at a guide, with nothing kept. It also misses `HELP.md:3`'s "the guide that holds the detail" and DESIGN.md:82's "the guides".
3. Case 3 checks only the Configuration and Debugging content. The Window, Views, Files and search, Terminals and commands, and Source Control guides could be dropped almost whole and every case would still pass. Only the report's per-guide "kept / dropped" list, read by the reviewer, checks them.
   - Item 2's selection rule makes "every key and chord" the first thing worth keeping, and a case can compute it exactly: list the chords and keys written in the five guides (for example the tree keys in `docs/files-and-search.md`, "Keys and selection in the tree", and the terminal find keys in `docs/terminals.md`) and diff them against HELP.md.
4. Case 4 (line counts) passes with any content under the bounds.
5. Case 5 (anchors) passes with no links at all. It was empty before (`grep -noE "\]\((HELP\.md)?#[^)]*\)" HELP.md DESIGN.md README.md` printed nothing).
6. Case 6 proves the files exist, which is part of item 6's goal.
7. Case 7 can pass while DATA-MAP still names oculus functions. `grep -nvE "<case 7 regex>" docs/DATA-MAP.md` then grep of backticked camelCase or CONSTANT names prints `272:checkSelfRelated`, `275:checkWaitingOn`, `309:hpcHostOf`, `352:checkPeople`, `353:checkFundingStatements`, `355:hpcHostOf` and `467:matchesGlob`. These are lines case 7's regex does not match. Item 4 forbids any "function, shape or constant of oculus's source".
8. Case 8 passes with the new tables complete while the old 5-row side-project table at `DATA-MAP.md:424-434` stays, false and duplicated.
9. Case 9 cannot pass without the words listed. It is ambiguous for lists of records (section 4).
10. Case 10 is a two-way diff and cannot pass with a fact missing or wrong. It does not reach part 11 or the length of the worked example. Item 3's "at most 60 lines in total" for the example has no check.
11. Case 11: the config checks pass whatever the docs' content and existence are. `config-folder.test.ts:590-604` checks only the shape of a path (relative, no `..`, ends in `.md`), and that run is skipped where `realHub()` finds no hub. It does not show the goal, but case 6 covers existence.
12. Case 12 checks behaviour the step leaves alone. It shows a saved guide tab is harmless, not that the goal is reached.

**The items:**

- Item 1: case 1 is enough.
- Item 2 can pass with five of the seven guides mostly dropped (case 3 above). "The view table... the description at most one sentence" has no check: the `present` row at `HELP.md:129` holds three sentences today. "A bullet is one line of at most three sentences" is checked only by the 600-character proxy.
- Item 3: cases 4 and 10. Part 11 and the 60-line example are unchecked.
- Item 4 can pass with source function names left (case 7) and with the stale side-project table (case 8). Nothing checks the replacement section, the hub's layer with its four files and keys, against `docs/configuration.md:35-40` or the config reader.
- Item 5 cannot pass under the write list (section 1). The 491 rewrite has no check beyond reading.
- Item 6: case 6, together with the YAML parse of verify item 7, is enough.
- Item 7: case 2 covers names. `doc-link.ts:2`'s "its guides" is not caught.

## 6. Implied inputs

**A saved layout with a removed guide's tab** is in Cases (case 12, with its expected result). The look half of that result is in section 4.

**A saved Help page with a "Design" doc tab** is not in Cases. DESIGN.md stays on disk, so the tab keeps drawing. Its expected result (the tab draws DESIGN.md) belongs in the before-and-after list.

**Links from elsewhere to removed guides** are missing from Cases with their expected result for the 43 DESIGN.md lines (section 1). Case 2 names the grep, but the write list forbids the fix.

- No file outside the guides links a removed HELP.md anchor. `HELP.md#the-keys` (`doc-link.ts:3`) survives.
- No file links a DATA-MAP anchor. `.oculus/config/sources.yml:47` and `DESIGN.md:583` cite DATA-MAP's content and are missing from the list of lines that must stay true.

**The demo hub** has no `layout.yml` (`ls demo/.oculus/config` prints `behavior.yml catalogs`), so its Help page is the engine's arrangement.

- DESIGN.md:493 says a document of oculus's own answers 404 when the engine is outside the hub. Over the demo hub the Apps guide tab would draw the missing line.
- That is unchanged behaviour and not a step defect, but it is the expected result of case 11's "server over the demo hub" alternative, and the brief does not state it.

**The key sheet** row's text is dictated in item 2 but no case checks it. Nothing compares `HELP.md:51` with `config/text/app.yml:13`. The row also keeps "h1-h9" while the Help group of this hub holds 7 entries after the step:

- `help` is order 0 (`Help.svelte:10`), `memories` order 1 (`Memories.svelte:9-10`), then the five documents.
- `keyOf` reaches the first nine of a list (`src/lib/state/workbench/navigation/catalogue.ts`, `at < 9`).
- So h8 and h9 open nothing. Today the group holds 15 entries and h1-h9 is exact.
- Every other row of the table names its group's exact range (for example `t1`, `l1-l3`). The brief should either state that the range is the cap of nine, since the documents are the hub's, or dictate the range this hub reaches.

**The Help group of the Views catalogue** is in the report's before-and-after list, not in Cases. That is acceptable, since it is a drawn result.

## 7. ADRs

`ls docs/adr tools/oculus/docs/adr` prints `ls: docs/adr: No such file or directory` and `ls: tools/oculus/docs/adr: No such file or directory`. Neither folder exists, and `grep -n "adr" .agents/plan.yaml tools/oculus/.scratch/migration/orchestrator-state.md` prints nothing. No ADR touches the step, as the brief says.

## 8. Dictated text

The standard is the rules file: section "The working rules that bind every package", Prose bullet ("plain, ASCII, no em dashes, no quips, no 'not X but Y' construction; name the actual function, file and line"), and section "What every package obeys" (no history words; one line per paragraph or bullet). `LC_ALL=C grep -n '[^ -~]' D49.md` prints nothing.

| Dictated text | `grep -n` in the brief | Verdict |
|---|---|---|
| The h1-h9 row, "open the manual, the Memories wall, a hub document or the Apps guide, the Help page's group" | `grep -n "a hub document or the Apps guide" D49.md` gives 43 | holds against the prose rules. The "h1-h9" range is a separate defect of fact (section 6). The Apps guide is itself an entry of the hub's `docs:` list, so "a hub document or the Apps guide" names one class twice; that is a wording point, not a rule breach. |
| The `help` arrangement, `[help, { view: doc, state: { id: tools/oculus/docs/apps.md, path: tools/oculus/docs/apps.md, label: "Apps guide" } }, memories]` | `grep -n "\[help, { view: doc" D49.md` gives 48 | holds: ASCII, one line, the shape of the existing entries |
| The docs list order, "Research approach, Agent approach, HPC how-to, Data map and Apps guide" | `grep -n "Research approach, Agent approach, HPC how-to, Data map and Apps guide" D49.md` gives 48 | holds: the labels are the existing ones at `.oculus/config/layout.yml:9-13` |
| The heading "Files and the editor" | `grep -n '"Files and the editor"' D49.md` gives 37, 107 | holds. HELP.md already says "a source tab's editor" (`HELP.md:63`, `:83`), so "the editor" names the same thing. |
| The heading "Terminals" | `grep -n '"Terminals"' D49.md` gives 37, 107 | holds. It differs from the view name "Terminal" (`HELP.md:137`) and covers the terminals, not the view, which is consistent. |
| DESIGN.md:82, "`docs/` holds `apps.md`, the guide to building an app, opened in oculus as Apps guide, and `diagrams/`" | `grep -n "opened in oculus as Apps guide, and" D49.md` gives 47 | holds against the prose rules. It repeats `docs/diagrams/`, which the folder tree already lists as its own row at `DESIGN.md:80`. |
| DESIGN.md:491, "`HELP.md` is the reader's manual and holds the detail a reader needs in short bullets, `docs/apps.md` is the guide to building an app, and DESIGN.md holds the decisions and is read as a file" | `grep -n "is read as a file" D49.md` gives 47 | Breaks the Prose bullet's "plain" rule ("The working rules that bind every package"): "is read as a file" does not say how a reader reaches DESIGN.md, which is opened from the Files view or a source tab and listed in no view. The brief also does not say whether the existing 491 sentence "a behaviour a user meets is in HELP.md or a guide" is kept or rewritten. |
| DATA-MAP's sentence, "oculus's own settings are in its manual, `tools/oculus/HELP.md`, section Configuration and the data" | `grep -n "section Configuration and the data" D49.md` gives 46 | holds |
| `doc-link.ts:3`'s example "becomes `docs/apps.md`" | `grep -n "doc-link.ts:3's example" D49.md` gives 49 | holds |

## Declined to judge

- Whether 450 lines for HELP.md and 350 for the Apps guide are the right bounds. Decisions 1 and 2 are the brief's own reversible choices, and the evidence here does not settle them. A count of the keys and files the selection rule keeps would.
- Whether listing every vocab word in DATA-MAP (for example the 39 palette hexes and the 30 `status_legend` keys) is the reading of the ruling the user intends. It follows the step line's "give each file's fields and links itself", and only the user's ruling settles it.
- Whether stating the hub's layer and its keys in both HELP.md (case 3) and DATA-MAP (item 4) conflicts with DESIGN.md:491's "A fact has one home", given that the brief rewrites 491 without saying whether that sentence survives. This is the orchestrator's design call.

Agent usage: a2bb671665419901b, claude-opus-5-5, 233,680 tokens, 62 tool uses, 10.6 min.

## Closed (the session's change to the brief for every finding above, and each dictated line added after the check, made before the preparation commit)

- Names 1, the step line 1, premise line 23 (DESIGN.md under-listed): the premise lists the 50 lines with the command; item 5 rewrites every one; the path entry is the whole file; "Read" names DESIGN.md whole.
- Names 2 (HELP.md:3 kept false): the premise quotes HELP.md:3 and :17; item 2 rewrites both sentences.
- Names 3 (HELP.md:180): the premise quotes it; item 2 rewrites it to what the Apps guide holds.
- Names 4 (doc-link.ts:2, history.test.ts:24, :153, :155): named in the premise and in item 7.
- Names 5 (`.oculus/config/sources.yml:47`, `DESIGN.md:583`): named among the four lines that must stay true, in the premise and item 4.
- Names 6 (the rules file's HELP.md sentence): closed under self-rule as Z764 (`plan.md` Rulings, `choices.md`, `orchestrator-history.md`): ruling (8) of Additions of 2026-10-09 decides that the guides are cut into HELP.md, so the standing spec's sentence is corrected to follow it in this step's preparation commit; the premise quotes both.
- The step line 2 (DATA-MAP still pointing into oculus's config): item 4 removes the "Where each schema is" rows and the "Option files" section that describe oculus's files, replaces the stale side-project table, states what the condition table's checks check and removes line 20's sentence; decision 3 says why; case 7 widened to backticked function and constant names.
- The step line 3 (apps.md part 11): item 3 keeps it as a short symptom and cause table.
- Premises 30 (DATA-MAP pointers incomplete) and the side-project table and line 20: the premise lists every line and the names the path grep misses.
- Premises 26 and 45 (the bridge path): the premise and item 3 name `src/lib/server/machine/apps/oculus.js` and `serve.ts`.
- Cases 2 (local.yml, wrong before, write list): case 2 is a `grep -rnE` with `--exclude=local.yml` and the build and scratch folders excluded, its before output corrected; DESIGN.md's path entry is whole. The pattern also catches "the guides" and "guide that holds".
- Case 11 (a server): the server alternative is removed.
- Case 12 (a drawn result): the run proves the state; the drawing is seen at the look.
- Case 9 (what a key is): the case says how each vocab shape gives its words and how a word with `assignable: false` is listed.
- Verify 4 (the ASCII form): the item says why the Markdown grep stands in for the perl gate and that the gate runs too for the comments and the text file.
- The question, case 3 (five guides could be dropped): item 2 and case 3 require every key and chord of the seven guides in HELP.md, checked by a quoted diff; the per-guide kept or dropped list of the report covers the rest, read by the reviewer.
- The question, case 7 and case 8: closed by the widened case 7 and the one-table check of case 8.
- The question, item 2's view table and item 3's example length: case 13 counts the view table's sentences and case 10 counts the example's lines.
- The question, case 5 (passes with no links): left as is; it checks that every link kept resolves, and the content is checked by cases 2 and 3.
- Implied inputs, the "Design" tab of a saved Help page: in the report's before-and-after list.
- Implied inputs, the key sheet and the h1-h9 range: item 2 dictates one row for HELP.md:51 and `config/text/app.yml:13` that names the first nine of the group, since the group's length is the hub's; case 13 compares the two.
- Implied inputs, the demo hub: the server alternative is gone, so no expected result over the demo is needed.
- Dictated text, DESIGN.md:491 ("is read as a file"): rewritten to "is opened from the Files view, listed in no view", and the item says that "A fact has one home" stays with its HELP.md and Apps guide wording.
- Dictated text, the h1-h9 row naming one class twice: rewritten as above.
- Dictated text, DESIGN.md:82 repeating `diagrams/`: left to the builder's wording of the folder tree row, which item 5 states as a requirement and does not dictate.
- Dictated lines added after the check, each read against `agents/spec.md`'s prose rules: "h1-h9 | open the manual, the Memories wall or a document of the Help page's group, its first nine" holds (plain, ASCII, the row's existing form); "A step writes what a user does into HELP.md as short bullets, what an app builder meets into the Apps guide `docs/apps.md`, and a decision with its reason into DESIGN.md." holds; "is opened from the Files view, listed in no view" holds; "a behaviour a user meets is in HELP.md, or in the Apps guide for building an app" holds.
