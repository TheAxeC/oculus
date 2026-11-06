# Step O149 refuter report (on .agents/worktrees/migration-O149, base 3c47a6c1e)

A page this report cites (the rules file, a standard, a skill's text) is named with its section, never with a line number, since a page's lines move and a section's name does not. A finding in code keeps its `file:line`.

The report is written in the rules file's character set. A character outside it in a quoted line is written by its name in angle brackets, such as `<tab>` or `<em dash>`.

## Verification (rerun by the reviewer)

```
$ npm run diagrams && npm run docs:palette        (from the worktree root)
... docs/diagrams/writes.svg
docs/palette.md
$ git status --short                               (after the two: the same 17 M and 3 ?? lines as before; no docs/diagrams or docs/palette.md line)

$ npm run test:quick -- --base 3c47a6c1e
ok      prettier (0.9 s): All matched files use Prettier code style!
ok      ASCII gate (1.0 s)
ok      svelte-kit sync (2.4 s)
ok      eslint (2.7 s)
ok      svelte-check (10.2 s): 1793938899323 COMPLETED 583 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest slow (41.8 s): Duration  29.45s (transform 14.57s, setup 0ms, import 19.26s, tests 10.02s, environment 0ms)
ok      vitest (52.2 s): Duration  40.12s (transform 73.13s, setup 0ms, import 131.40s, tests 6.28s, environment 840ms)
ok      vitest checks (64.4 s): Duration  52.13s (transform 31.92s, setup 0ms, import 58.77s, tests 107.14s, environment 3ms)
test:quick: 66.9 s; every command passed

$ npx vitest run tests/checks/source/history.test.ts tests/state/workbench/layout/saved/ --reporter=dot
 FAIL  |unit| tests/checks/source/history.test.ts > no history in code > names no package id, date or session in any comment
Error: Test timed out in 5000ms.
 Test Files  1 failed | 4 passed (5)
      Tests  1 failed | 54 passed (55)
$ npx vitest run tests/checks/source/history.test.ts --testTimeout=60000 --reporter=dot   (the report's own rerun)
 Test Files  1 passed (1)
      Tests  6 passed (6)

$ LC_ALL=C perl -ne '...ASCII gate of spec.md...' $(find src tests bin config -type f ! -name local.yml)
find: bin: No such file or directory
(nothing printed; exit 0)
$ LC_ALL=C grep -n '[^ -~]' docs/decks.md docs/HELP.md docs/templates.md README.md
(nothing printed; exit 1)

$ wc -l (every changed or added file)
     430 docs/decks.md
     391 tests/state/workbench/layout/saved/layout-given.test.ts
     869 src/lib/state/workbench/layout.svelte.ts   (largest module; every other module under it; Svelte files 469, 146, 98)
$ ls tests/state/workbench/layout/saved/
layout-given.test.ts  layout-saved.test.ts  layout-unread.test.ts  layout-workspaces.test.ts

$ sh utils/unused-exports.sh | diff ../O149-base/unused-exports.txt - ; echo "diff exit $?"
diff exit 0

$ grep -rn --exclude=local.yml 'docPaths\|withView\b\|docRecord\|engineDocTabs' src tests config docs README.md
(the 15 hits of the report's final-tree list; no withView; docPaths only at instance.ts:88, :113, :118)
$ grep -rn --exclude=local.yml 'first slide and in the deck list\|title shown on the first slide\|types and the statuses' src tests config docs README.md
(nothing)

$ history-word grep over the added src/config lines and the new test (git diff -U0 3c47a6c1e ...; the spec's words)
hits only "before" as a tab place: layout.yml:33, layout.svelte.ts comment, views.ts head and doc comments, views.ts `const before`, the test title 'the guide goes into the pane that holds the tab before it'

$ python3 yaml.safe_load of the four changed YAML files
ok config/defaults/layout.yml / ok config/options/layout.yml / ok config/schemas/deck-schema.yml / ok config/text/views/academic/present.yml

$ for d in src tests config; do diff -rq O149-base/$d migration-O149/$d; done
(the 14 files of the report's table under src and config, and "Only in migration-O149/tests/state/workbench/layout/saved: layout-given.test.ts")

$ node help-keys.mjs <worktree>          (the report's C5/C6 case program, rerun)
C5 fresh Help page tabs: help, the three hub docs, keys, Apps guide, Templates, Data map, Palette, Decks guide (each pinned=true)
C5 fresh Help page docs record: ["docs/RESEARCH-APPROACH.md","docs/AGENT-APPROACH.md","docs/HPC-UTwente-howto.md","engine:docs/apps.md","engine:docs/templates.md","engine:docs/data-map.md","engine:docs/palette.md","engine:docs/decks.md"]
C5 Help entry keys: help h1, keys h2, Apps guide h3, Templates h4, Data map h5, Palette h6, Decks guide h7, Research approach h8, Agent approach h9, HPC how-to: (none)
C6 decks.md from docs/HELP.md: {"kind":"engine","path":"docs/decks.md"}
C6 decks.md from docs/templates.md: {"kind":"engine","path":"docs/decks.md"}
$ node help-keys.mjs .agents/worktrees/O149-base
(the same without the Decks guide row; record the three hub paths only; Research approach h7, Agent approach h8, HPC how-to h9)

$ node read-examples.mjs <worktree>      (item 6's script, rerun)
deck deck: state ok, 4 slides ... findings: 0
deck projects/alpha/present: state ok, 12 slides
  title, section, text, image, columns, equation, code, closing, project, idea, summary, grid
  findings: 0
$ ls -A .../scratchpad/O149-examples
read-examples.mjs
```

The first run of the new test on the unchanged source was read from the saved log `.../scratchpad/O149-cases/given-base.txt` (RUN in the worktree before the source change): `Tests  8 failed | 3 passed (11)`, the three passing rows being the C9, C12 and C16 rows, each failing row at its `toEqual`.

## Verdicts

Items of the brief's "What to build":

- 1: violated, Standards 1 (one clause, `docs/decks.md:100` "No slide draws it."). The rest holds: the shape matches `docs/apps.md` (title, one sentence linking HELP.md, `[TOC]`, a first deck, the reference); spot reads of `spec.ts`, `groups.ts`, `read.ts`, `kinds.ts`, `project.ts`, `split.ts`, `project-facts.ts`, `hasSlideContent` (`state/life/present.ts:63`), the findings catalog and the Present catalog agree with the guide's statements on find, sort, discover, slides, order, counts, the split rule, every kind, every front-matter key, the drop limits (`MAX_UPLOAD_BYTES` 32 MB, `deck-files.ts:52`, `:393`), the strip, the toggle, the sixteen fields and the two findings.
- 2: holds, `config/defaults/layout.yml:145` after Palette; help-keys.mjs output above.
- 3: holds as item 3 is written (`saved/views.ts` `documented`, `instance.ts` `engineDocTabs`/`docRecord`, `newPage` and `remade` record the ids, `giveDocuments` still first at `rail-pages.ts:116`); C14 is partial under Spec 1.
- 4: holds, every listed line changed (`HELP.md:3`, `:56`, `:57`, `:331`, `:579`; `templates.md:1914`; `README.md:42`, `:44`, `:99`; `Help.svelte:2-5`).
- 5: holds, `deck-schema.yml:29` names folders, tiers, stages, forms and status, as `spec.ts:135-141` reads them.
- 6: holds, the script is quoted whole, writes only under its own mkdtemp folder and removes it; rerun gives the quoted output.
- 7: holds: one table of eleven rows driving `giveViews(giveDocuments(held, SOURCES), SOURCES)`, each row checking a second restore with `toBe`; see Proof 1 for its file-scope counter.

Cases:

- C1: met, by reading: the report's key table against `spec.ts:129-226`, `kinds.ts:239-303`, `project.ts:128-148`; every key the reader reads is in the guide and the guide names none it does not read (`desc` included, which the brief's list omitted).
- C2: met, twelve `###` sections under `## Slide kinds`, four entry shapes under `## The order`.
- C3: partial, the two placeholder examples are not read, Proof 3.
- C4: met, `decks.md:375-430` against `HELP.md:331-348`, `Facts.svelte:12`, `:136`, `present.svelte.ts:99`, `read.ts` fill rules and the catalog sentences.
- C5: met for the tab, its place, its record and the keys (help-keys.mjs on base and worktree); the drawing and the contents list are the look's.
- C6: met, the resolver run above.
- C7: met by content (6 passed with a 60 s limit; `vitest checks` ok inside test:quick); the default 5 s run times out, Proof 4.
- C8: met, rows 1 and 2.
- C9: met, row 3.
- C10: met, row 4 (an unpinned Decks guide tab gets no second tab, ids recorded).
- C11: met, row 5.
- C12: met, row 6.
- C14: partial, Spec 1.
- C15: met, row 8 (empty id given to no page; the twice-listed Apps guide given once, recorded once).
- C16: met, rows 6 and 9 and the code (`engineDocTabs` keeps only `engine: true` tabs, so `documented` never places a hub tab).
- C17: met, rows 10 and 11 (`newPage` and `rebuiltPage` record the five ids; a closed Data map is not given again).
- C13: met by reading (`deck-schema.yml:29`); the hover is the look's.

## 1. Spec

- `src/lib/state/workbench/layout/saved/views.ts:97-101`: "const at = order.indexOf(tab); const before = at > 0 ? order[at - 1] : undefined; const holds: Holds = before === undefined ? () => false : showing(before);"; what is wrong: the brief's two texts differ and the step built the narrower one without a row that tells them apart. Item 3 places a given tab after the arrangement's immediate predecessor, else at the end of the first pane's pinned tabs; C14 says the Decks guide "goes after the tab the arrangement shows before Palette that the page holds", which reads as the nearest held predecessor (Data map). The builder names this (judgment call 1) and built item 3; the C14 row, "with Palette closed the guide ends the pinned tabs of the first pane", is a one-pane page where both readings give the same place, so the test pins neither rule; failure scenario: a saved Help page split into pane 1 [help, hub docs, keys] and pane 2 [Apps guide, Templates, Data map], Palette closed and recorded: the Decks guide lands at the end of pane 1's pinned tabs after keys, away from the other guides, where C14's reading puts it after Data map in pane 2. Walking back to the nearest arrangement tab the page holds satisfies both texts (item 3's fallback still applies when none is held); which rule stands is the orchestrator's, and either way a two-pane row that separates them is missing; verdict: C14 partial.
- The five lines outside the write list, judged: `config/defaults/layout.yml:33` and `config/options/layout.yml:63` are needed (each described the giving and would be false of item 3 without the added clause; spec.md "What every package obeys", the rule that a sentence a change makes false is a defect of the change); `DeckForm.svelte:2-5` is needed (its comment said the title is drawn on the first slide, false of `kinds.ts`, which draws the heading). `config/schemas/deck-schema.yml:17` and `config/text/views/academic/present.yml:76` held the same false sentence and fixing them follows the brief's decision 4; their new text carries Standards 1. None of the five is a finding by itself.

## 2. Proof

- `tests/state/workbench/layout/saved/layout-given.test.ts:103`: "let minted = 0;"; what is wrong: a module-level mutable in a test file, which `tab()` (`:106-116`) increments for every tab any row builds; spec.md "The principles every package is judged on", No globals ("This holds in test fixtures and helpers too"); failure scenario: tab ids depend on how many rows ran before (a row run alone with `-t` gets `t1...`, in the full table `t40...`); no assertion compares ids across rows today, so nothing is red, but a row that does would pass or fail by run order. A counter made per `pagesOf` call, or ids from the tab's place, removes it.
- `.scratch/migration/agents/reviews/O149-report.md`, sections "The cases' first run" (C5) and "Host- and user-visible changes": "run with the case program `.../O149-cases/help-keys.mjs` (quoted in the C5 section)"; what is wrong: the C5 section quotes the program's output and one sentence about it, never its source; spec.md "What every package obeys", the case-run program paragraph, asks for its source and output quoted; failure scenario: a reviewer working from the report alone cannot rerun C5 and C6 (this rerun was possible only because the file is still in the session scratchpad); the program also sets `globalThis.$state`, `$derived` and `$effect` and hard-codes the worktree's jiti path, which a reader of the report cannot see.
- `docs/decks.md:156-158` and `:393-397`: "# {{members.count}} slides from the members" and "# Alpha at {{project.stage}} ... Led by {{project.lead}}, for {{project.venue}}."; what is wrong: two fenced slide examples of the guide that `read-examples.mjs` does not read (it reads only `## A first deck` and the `###` sections of `## Slide kinds`); C3 asks for each slide example; failure scenario: a broken example in either section (a placeholder the reader leaves as written, or a field name the reader does not know) would print no line; with the script's project, whose facts hold only `stage`, the second example would raise two `project_field_empty` findings that the example is not written to show, so a project with a lead and a venue is needed for it; verdict: C3 partial.
- Report, DONE row "Verify 2": "`npx vitest run tests/state/workbench/layout/saved/ tests/state/workbench/navigation/pages.test.ts`: ... 62 passed (62); history check see below"; what is wrong: the row cites a command other than the brief's, and the brief's command is red on this machine ("Test timed out in 5000ms", `Tests  1 failed | 54 passed (55)`, rerun above); spec.md "Report" says a row whose run is red is NOT DONE; the report states the timeout openly and its content passes (6 passed with `--testTimeout=60000`, `vitest checks` ok in test:quick); failure scenario: the orchestrator running Verify 2 as written at landing sees a red line and has to rerun to tell timing from a hit. No verdict rests on it.

## 3. Standards

- `config/schemas/deck-schema.yml:17`, `config/text/views/academic/present.yml:76` and `docs/decks.md:100`: "The deck's title: the words of its tab, of its entry in the deck menu and of the Overview's heading. No slide draws it."; what is wrong: a sentence the diff writes that is false of the code. A deck that is no project's and is a member of another deck's group has its `deck.title` drawn on that deck's summary slide (`read.ts` `summary()`: `project: project === null ? member.doc.title : ...`) and grid slide (`name: project === null ? member.doc.title : ...`). `decks.md:100` names both uses in the same bullet and then says "No slide draws it."; rules file, Writing, and the brief's item 1 ("Every statement is true of the code at the base"); failure scenario: a reader hovering `title:` or reading the Edit form's Title help leaves a working title such as "WIP" on a talks deck, believing no slide shows it, and the portfolio deck's summary row prints "WIP". "No slide of its own draws it" (or naming the summary and grid) is true; verdict: item 1 violated.
- `src/lib/state/workbench/layout/saved/views.ts:9` (96 columns, the next word "of" fits at 99), `views.ts:109` (90 columns, "oculus's" fits at 99), `src/lib/state/workbench/layout/model.ts:132` (96, "the" fits at 100), `model.ts:417` (96, "ids" fits at 100), `src/lib/views/system/help/Help.svelte:3` (91, "`help`)," fits at 100), `tests/state/workbench/layout/saved/layout-given.test.ts:1` (96, "the" fits at 100): what is wrong: comment paragraphs the step wrote or edited end lines short inside a sentence; spec.md "What every package obeys" ("A comment edited by the step is rewrapped as a whole paragraph at 100 columns, so no line inside a sentence ends short") and the rules file's Writing, "No hard wrapping in prose" (the code-comment exception); `tests/checks/source/comment-width.test.ts` checks only lines past 100, so the gate does not see these; failure scenario: the next edit of any of these paragraphs rewraps more lines than its change, and the diff a reviewer reads grows past the change.
- Report, "Judgment calls": what is wrong: `Page.docs` now holds two kinds of value, hub paths and engine ids (`engine:<path>`); spec.md "What every package obeys" asks the report to state what the code does for an id checked empty, duplicated and colliding; empty and duplicated are covered (C15), a collision is not stated; failure scenario: a hub `docs:` entry whose `path` is written `engine:docs/decks.md` is treated by `saved/docs.ts` `documented` as already given once the engine id is recorded, so its tab is never given. Contrived, but unstated.

## 4. Behaviour

- `src/lib/state/workbench/layout/saved/views.ts:91-106` (`documented`): what is wrong: a saved rail page whose `Page.docs` holds no engine id (every page saved before this change) is given once more each of the four older guides (Apps guide, Templates, Data map, Palette) it does not show, so a reader who had closed one sees it come back once. The report states it as judgment call 3 only, not in "Host- and user-visible changes, before and after", the section the look is read against; failure scenario: the look checks C8 on a saved Help page that shows all four guides and never sees the reappearance; a test layout with Templates closed shows Templates back after the restore, pinned after the Apps guide, and the look should confirm that it stays closed after a second close and reload.

## Declined to judge

- The look: the Decks guide tab drawing `docs/decks.md` with its contents list (C5), a press on the two links opening it (C6), the hover over `find` and `title` and the Edit form help (C13), the reappearance in Behaviour 1; the orchestrator's, since no page is run here.
- `docs/decks.md:77` "the YAML editor marks it" (an unknown `present.yml` key): the schema path (`snapshot/schema/static.ts:80-84`, `hub.ts:82` `additionalProperties: false`) was found but not traced to the editor's mark.
- The builder's C7 base timing ("timed out at the 5 s limit ... on the base"): running the check against the base copy was not done.
- The new test's first run on the unchanged source was read from its saved log, not rerun, since a rerun needs the test placed in a copy of the base tree.
- The report's quoted `git diff --numstat` and `git status --short docs/diagrams docs/palette.md` were not run (git forms outside the three allowed); `git status --short` after the diagrams run and `git diff 3c47a6c1e --stat` give the same facts. Its history grep over `git diff -U0 -- src config` was replaced by the same grep over `git diff -U0 3c47a6c1e`.
- The open-items section of the report was not compared word by word with the state file; the four item numbers (689 to 692) match the state file's position line.

Reviewer usage: a4b1d08d634ce40d6, claude-opus-5-5, 280247 tokens, 86 tool uses, 17 min 15 s.

## Repair round 1, refuted

```
$ npm run diagrams && npm run docs:palette        (worktree root)
docs/diagrams/channels.svg
docs/diagrams/writes.dot
docs/diagrams/writes.svg
docs/palette.md
$ git status --short        (after the two: the same 17 M and 4 ?? lines as before, the 4th being the orchestrator's .scratch/migration/agents/briefs/O149-round-1.md; no docs/diagrams or docs/palette.md line)

$ npm run test:quick -- --base 3c47a6c1e
test:quick: 21 changed file(s), from git since 3c47a6c1e
ok      prettier (1.2 s): All matched files use Prettier code style!
ok      ASCII gate (1.2 s)
ok      svelte-kit sync (3.3 s)
ok      eslint (3.1 s)
ok      svelte-check (11.9 s): 1793941195057 COMPLETED 583 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest slow (52.2 s): Duration  37.21s (transform 19.78s, setup 0ms, import 26.06s, tests 10.91s, environment 0ms)
ok      vitest (58.0 s): Duration  43.24s (transform 71.63s, setup 0ms, import 142.13s, tests 8.21s, environment 1.33s)
ok      vitest checks (73.1 s): Duration  58.25s (transform 31.99s, setup 0ms, import 60.96s, tests 127.70s, environment 4ms)
test:quick: 76.6 s; every command passed

$ npx vitest run tests/checks/source/history.test.ts --testTimeout 0 --hookTimeout 0 --reporter=dot
 Test Files  1 passed (1)
      Tests  6 passed (6)
$ npx vitest run tests/state/workbench/layout/saved/ --reporter=dot
 Test Files  4 passed (4)
      Tests  51 passed (51)
$ npx vitest run tests/state/workbench/layout/saved/layout-given.test.ts --reporter=verbose
 (13 rows, each passed, the three new ones among them: 'with Palette closed the guide goes af<horizontal ellipsis>', 'with Palette closed in one pane the g<horizontal ellipsis>', 'a page holding no tab before the guid<horizontal ellipsis>')
 Test Files  1 passed (1)
      Tests  13 passed (13)

$ LC_ALL=C perl -ne '<the ASCII gate of spec.md>' $(find src tests config -type f ! -name local.yml); echo "perl exit $?"
perl exit 0          (bin does not exist: "ls: bin: No such file or directory")
$ LC_ALL=C grep -n '[^ -~]' docs/decks.md docs/HELP.md docs/templates.md README.md; echo "grep exit $?"
grep exit 1

$ wc -l (every changed or added file)
 430 docs/decks.md / 466 tests/.../layout-given.test.ts / 869 src/lib/state/workbench/layout.svelte.ts (largest module) / 637 pages.ts / 438 model.ts / 382 instance.ts / 125 views.ts / 122 rail-pages.ts / 70 docs.ts; Svelte 469, 146, 98
$ ls tests/state/workbench/layout/saved/
layout-given.test.ts  layout-saved.test.ts  layout-unread.test.ts  layout-workspaces.test.ts

$ sh utils/unused-exports.sh | diff ../O149-base/unused-exports.txt - ; echo "diff exit $?"
diff exit 0

$ grep -rn --exclude=local.yml 'docPaths\|docRecord\|engineDocTabs\|withView\b\|paneMaker\|THREE_' src tests config docs README.md
 docPaths only at instance.ts:88 (now module-local), :113 (comment), :118; docRecord at instance.ts:116, model.ts:5, :428, pages.ts:10, :299; engineDocTabs at instance.ts:100, :117, views.ts:15, :95; paneMaker and THREE_* only in layout-given.test.ts (THREE_HUBS of terminal-actions.test.ts is unrelated); no withView

$ history-word grep of spec.md over (git diff 3c47a6c1e -U0 -- src config; the new test) for before|used to|no longer|still|always has been|always had|as before|previously|the step adds|after this package lands|<id>|<date>
 12 hits, every one "before" as a tab place: layout.yml:33, layout.svelte.ts:185, views.ts:5, :51, :61-62 (const before), :86, :88, :103-104 (const before), and the test titles 'the guide goes into the pane that holds the tab before it' and "a page holding no tab before the guide gets it after the first pane's pinned tabs"
$ the report's own history grep, run with the base named: (git diff 3c47a6c1e -U0 -- src config; cat <test> docs/decks.md | sed 's/^/+/') | grep '^+' | grep -nEi "\b(O[0-9]+|C[0-9]+|Q[0-9]+|still|no longer|anymore|previously|used to|older|20[0-9][0-9]-)"
 (nothing; exit 1), as the report says

$ grep -n "minted" tests/state/workbench/layout/saved/layout-given.test.ts
126:    let minted = 0;
128:        minted += 1;
138:        const made: Instance = { id: `t${minted}`, view: docId === null ? name : 'doc', state };

$ node <scratchpad>/O149-cases/short-lines.mjs <the 10 changed src files and the new test>
 23 lines, none inside a hunk of the step (cross-checked against git diff 3c47a6c1e -U0 -- src hunk ranges): Workbench.svelte:5, :133; layout.svelte.ts:246, :755; instance.ts:5, :45, :308; model.ts:8, :54, :151, :163, :165, :196, :364; pages.ts:3, :85, :185, :240, :261, :603; docs.ts:31; DeckForm.svelte:9; Help.svelte:55
$ awk 'length > 100' <same files>
 (nothing)
$ npx prettier --check <same files>
All matched files use Prettier code style!
$ word sequence of the rewrapped paragraphs, snapshot against worktree (comment markers stripped)
Help.svelte: same words / model.ts: same words / views.ts head: same words / test head: same words

$ cd <scratchpad>/O149-examples && node read-examples.mjs <worktree>
 output equal under diff to the report's quoted block: "fenced blocks in the guide: 17; written into a deck: 17", decks deck (4 slides), talk (21 slides), projects/active/alpha/present (14 slides), each "findings: 0"; the counts slide "2 slides from the members", the fields slide "Alpha at in prep" / "Led by Ada Lovelace, for JNM."
$ ls -A <scratchpad>/O149-examples
read-examples.mjs
$ grep -c '^```[a-z]' docs/decks.md
17          (16 outer three-backtick blocks plus the inner ```python of the code example; the code example's outer fence is ````markdown, so 17 outer blocks, as the script counts)
$ diff <report lines of read-examples.mjs> read-examples.mjs ; diff <report lines of help-keys.mjs> help-keys.mjs
 read-examples quoted whole / help-keys quoted whole
$ diff <report's short-lines.mjs block> short-lines.mjs
 equal but for the block's closing fence

$ cd <scratchpad>/O149-cases && node help-keys.mjs <worktree>
 output equal under diff to the report's C5/C6 block (Decks guide pinned after Palette; record with the five engine ids; Decks guide h7, Research approach h8, Agent approach h9, HPC how-to (none); both links {"kind":"engine","path":"docs/decks.md"})
$ node help-keys.mjs .agents/worktrees/O149-base
 record ["docs/RESEARCH-APPROACH.md","docs/AGENT-APPROACH.md","docs/HPC-UTwente-howto.md"]; Palette h6, Research approach h7, Agent approach h8, HPC how-to h9; both links resolve as on the worktree
$ node collide.mjs <worktree>
 output equal under diff to the report's judgment call 4 block

$ the report's open-items block against .scratch/migration/orchestrator-state.md
 equal to the worktree's copy of the state file; differs from the main checkout's state file in open item 690, which there carries two more sentences ("The rule line agrees with the hub's Hard rule ..." and "O151 (2026-11-06) writes seven more ...")

$ the saved run of ruling 1's row before the code change, <scratchpad>/O149-cases/round1-row-before.txt (Start at 05:39:09; views.ts mtime 05:43:14)
 FAIL ... 'with Palette closed the guide goes af<horizontal ellipsis>' ... Received "doc:engine:docs/decks.md" after "keys" in pane 1, Expected it after "doc:engine:docs/data-map.md" in pane 2
      Tests  1 failed | 12 passed (13)
 (equal to the report's quoted lines, the ellipsis written as "...")
```

### Verdicts

Items of the brief's "What to build", over the whole diff since the base:

- 1: holds. Standards 1 of the first report is closed: `docs/decks.md:100` now says no slide of its own deck draws the title and that the summary row and the grid card (when the member deck has no idea slide) draw it for a member deck that is no project's, which is what `read.ts:589` and `:613` do, with the idea card naming the deck by `context.deck` (`doc.name`, `read.ts:521`; `kinds.ts:239`). The rest of the guide carries the first report's reads, plus my spot reads this run: the fields table and the three placeholder findings, the two slide findings, the idea and grid titles, and the count of fenced blocks. The wording in the schema and the catalog is Standards finding 3 below; it does not change this verdict, since those two lines are outside item 1.
- 2: holds, `config/defaults/layout.yml:145`; help-keys.mjs on the worktree and the base.
- 3: holds. `documented` (`views.ts:99-106`) walks back through `order` to the nearest earlier tab the page holds (`:102-104`). `withTab` falls back to the end of the first pane's pinned tabs. `newPage` and `remade` record `docRecord`, and `giveDocuments` still runs first. C14 is now met.
- 4: holds, every listed line, as in the first report; the round changed none of them.
- 5: holds, `deck-schema.yml:29`.
- 6: holds. The script is quoted whole, and my rerun prints the same output: 17 of 17 blocks and zero findings in each deck. It leaves only itself in its folder.
- 7: holds. 13 rows drive `giveViews(giveDocuments(held, sources), sources)`, and each row gets a fresh `paneMaker()` (`:461`), so no module-level mutable is left (Proof 1 of the first report is closed). The new two-pane row's failing run on the unchanged `views.ts` is quoted.

Cases:

- C1: met, by reading (the first report's key table; nothing in the round changes a key).
- C2: met, twelve `###` kind sections and four order entry shapes.
- C3: met. All 17 fenced blocks are read, the `{{members.count}}` one and the `{{project.<field>}}` one included, with a project that holds a stage, a lead and a venue, and the run prints zero findings (my rerun). Proof 3 of the first report is closed.
- C4: met, as in the first report; the round changed none of the lines involved.
- C5: met for the tab, its place, the record and the keys (help-keys.mjs on both trees). The drawing and the contents list are the look's.
- C6: met, the resolver run above.
- C7: met, `Tests  6 passed (6)` with `--testTimeout 0 --hookTimeout 0` (Proof 4 of the first report is closed).
- C8: met, rows 1 and 2.
- C9: met, row 'a saved Help page whose record holds the closed Decks guide is given nothing'.
- C10: met, row 'a page that shows the guide with no record of it gets no second tab, and records it'.
- C11: met, row 'a page with no record is given every document it lacks, once, in order'.
- C12: met, row "another rail page gets none of Help's guides, and Help gets its hub document".
- C14: met. The rows 'with Palette closed the guide goes after the nearest earlier tab the page holds' (two panes, the guide after Data map in pane 2, failing before the change), 'with Palette closed in one pane the guide goes after the Data map, pinned' and "a page holding no tab before the guide gets it after the first pane's pinned tabs" (the fallback) give the expected places.
- C15: met, row 'an engine tab with an empty id is given to no page, and a repeated one once'.
- C16: met, the rows for C12 and 'a hub document the reader closed is not given again, at its place or another'; `engineDocTabs` keeps only `engine: true` tabs.
- C17: met, rows 'a fresh Help page records its guides, ...' and 'a Help page put back by Reset records its guides, ...'.
- C13: met by reading (`deck-schema.yml:29`); the hover is the look's.

### Findings

Spec

- `<scratchpad>/O149-cases/wrap.mjs`, `short-lines.mjs` and `collide.mjs` (report, under ruling 7 and judgment call 4): "A second print-only program, `wrap.mjs` in the same folder, printed each paragraph filled greedily at 100 columns, and that text was pasted with Edit."
  - What is wrong: three scripts were written in round 1 that the brief does not build under "What to build" and that no line of `plan.md`'s Rulings approves. The brief approves `read-examples.mjs` alone. Open item 262 (a) approves only case-run programs whose source and output are quoted.
    - `short-lines.mjs` is a read-only fact check for ruling 7, which is not a case; its source is quoted.
    - `collide.mjs` prints the colliding-id behaviour for ruling 8; its output is quoted and its source is not.
    - `wrap.mjs` produced the text of the refilled comment paragraphs in `model.ts:130-137` and `:417-418`, `views.ts:1-10` and `:111-116`, `Help.svelte:2-4` and `layout-given.test.ts:1-5`. The builder then pasted that text with Edit. The source of `wrap.mjs` is not quoted.
  - My read of those hunks against the snapshot finds the same words in each paragraph, with only the line breaks moved (the word-sequence compare above). The one exception is the doc comment of `documented`, whose new wording ruling 1 asked for and which says the rule the code runs.
  - Failure scenario: a reader of the report cannot rerun the colliding-id evidence or see how the comment text was produced. File content made by a program is the case the ruling "Unapproved builder scripts" exists for, even when Edit pastes it.
  - Disposition: the orchestrator's, under that ruling (the builder has already listed the paragraphs and files, and the hunks read clean) or as the skill's "Finding dispositions" says.
  - Verdict: none.

Proof

- Report, DONE row "Verify 7", and the history-grep paragraph under "Judgment calls": "prints nothing. No package id, case id or date appears in a comment or a test title."
  - What is wrong: the grep quoted there is not the rules file's word list. It leaves out "before", "always has been", "always had", "as before", "the step adds" and "after this package lands" (spec.md "What every package obeys", the history paragraph). That paragraph asks for the grep to be quoted with each hit judged.
  - My grep with the rules file's words gives 12 hits. Every one is "before" used as a tab's place, which is no history, so no decision rests on the miss.
  - Failure scenario: a comment written "as before" in the history sense would pass the report's grep and reach the landing unflagged.
  - Fix at landing: replace the paragraph in the report with the rules file's grep and its hits as judged.
  - Verdict: none.

Standards

- `src/lib/state/workbench/layout/saved/views.ts:5` (the head comment, which the round rewrapped): "a saved page that lacks one gains a pinned tab of it here, once, after the tab the arrangement shows before it". The same wording is in `src/lib/state/workbench/layout.svelte.ts:185` ("a tab after the tab the arrangement shows before it"), `config/defaults/layout.yml:33` ("after the tab the arrangement shows before it") and `docs/HELP.md:57` ("given once, after the tab before it").
  - What is wrong: ruling 1 asks that views.ts's comments say the rule. The doc comment of `documented` (`:84-91`) says it, and the head comment still gives one placement for views and documents.
    - For a document the code now walks back to the nearest earlier tab the page holds (`:102-104`).
    - For a view it takes the arrangement's immediately preceding view (`:61-62`) and otherwise the first pane's pinned end.
    - Read with "the tab", the four sentences name the immediately preceding tab, which is false for a guide whose preceding guide is closed.
    - The rules file says a sentence a change makes false is a defect of the change (spec.md "What every package obeys", the grep paragraph).
  - Failure scenario: a maintainer reading the views.ts head comment learns one rule and does not learn that views and documents are placed differently. A reader of HELP.md who closed Palette expects the Decks guide where Palette stood and finds it after the Data map.
  - Fix at landing: the four sentences read "after the nearest tab before it in the arrangement that the page holds" for documents, or the head comment names both rules.
  - Verdict: none.
- `npm run test:quick` ran twice in round 1 (report, under the DONE table: "The full verify list ran twice in round 1: once after the rulings, and once more after the test helper `panes` was renamed `paneMaker` ... which was the last change").
  - What is wrong: spec.md "Token discipline" says to run the list once, after the last change, and calls a run beyond that allowance a finding. The first run was green and was not after the last change, so the second run is the extra one. The rename itself is fine, since `panes` is also an export of `instance.ts`.
  - Failure scenario: the list's cost is doubled for a rename that a rerun of the one changed test file covers.
  - Verdict: none.
- `config/schemas/deck-schema.yml:17` and `config/text/views/academic/present.yml:76`: "the summary and grid slides of a deck whose group holds it draw it for a member deck that is no project's."
  - What is wrong: the grid draws a member deck's own idea card when that deck has an idea slide (`read.ts:585-586`). The card's name is the idea's `title:` or the deck's folder name (`kinds.ts:239`), never `deck.title`. So the grid draws the title only for a member deck with no idea slide, which `docs/decks.md:100` says ("on its grid card when it has no idea slide") and these two help lines do not. The wording follows ruling 6's text word for word; the qualifier is missing in the ruling too.
  - Failure scenario: an author hovering `title:` or reading the Edit form's Title help on a talk deck with an idea slide expects the portfolio grid card to read the deck's title, and it reads the idea's title.
  - Fix at landing: append ", the grid's only when that deck has no idea slide" in both lines.
  - Verdict: none.

Behaviour

- none. The round's visible changes are stated with before and after in the report: the C14 place, the reappearance of the older guides and the title help.

The `npx prettier --write tests/state/workbench/layout/saved/layout-given.test.ts` run (report, under the DONE table) is not a finding:
- spec.md "What every package obeys" says "Prettier is pinned in `.prettierrc`; run `npm run format` on what you wrote".
- `npm run format` is `prettier --write .` (`package.json:21`), so the rules file directs this program. The builder ran it narrowed to the one file it wrote.
- The ruling "Unapproved builder scripts" covers a program that no brief builds and no ruling approves (an inline `python3`, `perl`, `sed -i`, `awk` or a script file).
- The round brief's "Every file edit in this round is made with Edit or Write" cites the same spec.md section, which names the formatter, and spec.md says nothing in a brief overrides it.
- What prettier changed is layout only (the test's object literal at `:133-137`, the array at `:142-145`); `npx prettier --check` passes.

### Declined to judge

- The look:
  - the Decks guide tab drawing `docs/decks.md` with its contents list (C5);
  - a press on the two links (C6);
  - the hover over `find` and `title` and the Edit form help (C13);
  - the return of a closed older guide after a reload, and its staying closed after a second close (ruling 9);
  - the orchestrator's, since no page runs here.
- The failing run of ruling 1's row on the pre-change `views.ts` was read from its saved log, not rerun. A rerun needs the old code back, which this review does not do.
- The report's `git diff --name-only -- src`, `git diff --stat`, `git status --short docs/diagrams docs/palette.md` and `git diff -U0 -- src config` were not run, being git forms outside the three allowed. `git status --short` and `git diff 3c47a6c1e` (with `--stat` and `-U0`) gave the same facts.
- Which file the report's "Open items of the state file, verbatim" should mirror is the orchestrator's call. The block equals the worktree's copy of the state file and is behind main's in open item 690.
- The statements of `docs/decks.md` that the round did not change were checked against the code only by the spot reads named under item 1. The first report's full read stands for the rest.
- How much of the test file's layout prettier made and how much the builder's Write made cannot be told apart, since no snapshot exists between the two. The file as it stands was read whole.

Reviewer usage: a872a343a5a353d67, claude-opus-5-5, 247262 tokens, 57 tool uses, 11 min 28 s.

### Closed

- Spec 1 (`wrap.mjs`, `collide.mjs`, `short-lines.mjs`): closed in automode under the ruling "Unapproved builder scripts", as the standing demand says; the breach is recorded in the booking, the builder's list of the paragraphs and files is in its report, and the reviewer's word-sequence compare reads those hunks clean (same words, line breaks moved; the `documented` doc comment the wording ruling 1 asked for).
- Proof 1 (the report's history grep): fixed at landing in `agents/reviews/O149-report.md`, the rules file's grep run over the added lines with the landing fixes and `docs/decks.md`, its 17 lines as judged (none is history).
- Standards 1 (the "before it" placement sentences): fixed at landing in `views.ts:5`, `layout.svelte.ts:185`, `config/defaults/layout.yml:33` and `docs/HELP.md:57`.
- Standards 2 (a second run of the verify list): noted in the booking; nothing to change in the tree.
- Standards 3 (the grid qualifier): fixed at landing in `config/schemas/deck-schema.yml:17` and `config/text/views/academic/present.yml:76`.

