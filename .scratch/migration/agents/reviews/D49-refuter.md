# Step D49 refuter report (on /Users/axelfaes/workspace/research-hub/.agents/worktrees/D49, base 9337c3ad4)

A page this report cites (the rules file, a standard, a skill's text) is named with its section, never with a line number, since a page's lines move and a section's name does not. A finding in code keeps its `file:line`.

## Verification (rerun by the reviewer)

Every run from `tools/oculus` in the worktree unless named, with `HOME=$TMPDIR/d49-review-home` and Node v24.21.0 first on PATH. The worktree's `git status --short` after every run matched its state before (the 21 step paths plus the untracked report).

```
# Verify 1. `npm run diagrams` writes into docs/diagrams/, so I ran the in-memory staleness test of the committed diagrams in its place:
npx vitest run tests/checks/diagrams --reporter=dot
 FAIL  |unit| tests/checks/diagrams/diagrams.test.ts > the committed diagrams > are what the source gives now, each file byte for byte
Error: Test timed out in 5000ms.
 FAIL  |unit| tests/checks/diagrams/diagrams.test.ts > the committed diagrams > are named stale, every one at once, when an import and a publish are added
Error: Test timed out in 5000ms.
 Test Files  1 failed (1)
      Tests  2 failed | 44 passed (46)
npx vitest run tests/checks/diagrams/diagrams.test.ts -t "byte for byte" --testTimeout 300000 --reporter=dot
 Test Files  1 passed (1)
      Tests  1 passed | 45 skipped (46)
npm run test:quick
test:quick: 20 changed file(s), from git since HEAD
test:quick: 14 test file(s), 10 essential
ok      prettier (2.1 s): All matched files use Prettier code style!
ok      svelte-kit sync (2.3 s)
ok      ASCII gate (2.5 s)
ok      eslint (14.4 s)
ok      svelte-check (20.6 s): 1791597021382 COMPLETED 454 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (24.3 s): Duration  20.62s (transform 41.49s, setup 0ms, import 48.54s, tests 5.41s, environment 3ms)
test:quick: 26.5 s (limit 45.0 s); every command passed

# Verify 2, after the change:
npx vitest run tests/checks/config tests/checks/source tests/data/sources/docs.test.ts --testTimeout 300000
 Test Files  9 passed (9)
      Tests  115 passed | 1 skipped (116)
# Verify 2, on the base copy (D49-base/tools/oculus), twice:
Error: EACCES: permission denied, open '.../D49-base/tools/oculus/vite.config.ts.timestamp-1791597070840-960f29c4288348.mjs'
(with --configLoader runner) Error: [TSCONFIG_ERROR] Failed to load tsconfig '.svelte-kit/tsconfig.json': Tsconfig not found

# Verify 4
LC_ALL=C grep -n '[^ -~]' HELP.md docs/apps.md ../../docs/DATA-MAP.md DESIGN.md README.md   -> prints nothing, exit 1
perl ASCII gate of agents/spec.md over $(find src tests bin config -type f ! -name local.yml)   -> "bfs: error: bin: No such file or directory." then nothing, perl exit 0
LC_ALL=C grep -n '[^ -~]' ../../.oculus/config/layout.yml   -> nothing, exit 1

# Verify 6, 7
sh utils/folder-check.sh   -> exit 0
wc -l: HELP.md 401, docs/apps.md 349, DESIGN.md 591, README.md 48, config/layout.yml 182, config/text/app.yml 258, doc-link.ts 56, docs.ts 624, Doc.svelte 209, Help.svelte 95, config-folder.test.ts 649, history.test.ts 186, ../../.oculus/config/layout.yml 13, ../../docs/DATA-MAP.md 563
python3 -c "import yaml,sys; ..." config/layout.yml config/text/app.yml ../../.oculus/config/layout.yml   -> yaml exit 0

# Cases (the builder's scripts, found in .../scratchpad/d49b/cases/, rerun with python3 -I; my own runs named)
1  ls docs   -> apps.md  diagrams
2  grep -rnE "docs/(configuration|...)\.md|... guide|the guides\b|guide that holds" ... tools/oculus .oculus docs (worktree root)   -> nothing, exit 1
   whole-hub grep of the same names over the main checkout (CLAUDE.md CONTEXT.md README.md docs tools .oculus registries side-projects deck): hits only in files on this step's write list
3  c03_keys.py <base> <base HELP.md>   -> chords and function keys in the seven guides: 78 / missing from .../D49-base/tools/oculus/HELP.md : 23
   c03_keys.py <base> <worktree HELP.md>   -> chords and function keys in the seven guides: 78 / missing from .../D49/tools/oculus/HELP.md : 0
4  c04_bullets.py HELP.md docs/apps.md   -> HELP.md: 190 bullet/paragraph lines checked, 0 over the rule / docs/apps.md: 61 bullet/paragraph lines checked, 0 over the rule
   awk 'length > 600 && !/^\|/' HELP.md docs/apps.md | wc -l   -> 0
   my own count of sentences per bullet (code spans and quotes masked): no bullet over 3
5  c05_anchors.py <worktree>   -> HELP.md heading anchors: 20 / targets: 58 unmatched: 0;  <base>   -> targets: 0 unmatched: 0
6  c06_docpaths.py <worktree>   -> help arrangement doc tabs: 1 existing: 1 / hub docs entries: 5 existing: 5;  <base>   -> 8 existing: 8 / 13 existing: 13
7  grep -nE "tools/oculus/src|tools/oculus/config|\.ts\b|\.svelte\b|Shape\b|ENTRY_CATEGORIES|`[a-z]+[A-Z][A-Za-z]*`|`[A-Z][A-Z_]{3,}`" docs/DATA-MAP.md   -> nothing
8  c08_fields.py   -> project.yml table at line 383: 46 names; schema keys missing from the table: [] ; table names not in schema: [] / side-project table at line 462: 17 names; ... [] ; ... [] / count of "| Field | Holds |" heads in the page: 2
   my own script against the base schemas: manifest 46 46 missing [] extra [] same order True; side 17 17 missing [] extra []; types, sections and required flags equal
9  c09_vocab.py   -> rows with a difference: 0 (type_order 14/14, status_legend 30/30, focus_lanes 9/9, priority_levels 3/3, data_access 4/4, venue_categories 4/4, venue_tiers 3/3, radar_buckets 4/4, career_host_status 5/5, side_project_status 4/4, status_palette 45/45, palette 39/39, data_themes 11/11, venue_themes 13/13, domains (hub) 12/12); venue_tiers assignable false: ['unrated'] | page says unrated with `assignable: false`: True
10 c10_apps.py   -> methods, channels (open + machine), open write kinds, refusal words: "code not in guide: []" and "guide not in code: []" for each; closed channels named 3 of 3; closed write kinds named 23 of 23
   worked example: app.yml 6 + index.html 12 + app.js 31 = 49 lines
11 npx vitest run tests/checks/config --testTimeout 300000   -> Test Files  4 passed (4) / Tests  81 passed | 1 skipped (82)   (base run not reproducible here, see Declined)
12 SCRATCH_FILES=c12.test.ts npx vitest run --config vitest.scratch.config.ts --silent=false
   CASE12 tab {"id":"doc-views","view":"doc","state":{"id":"tools/oculus/docs/views.md","path":"tools/oculus/docs/views.md","label":"Views guide"}}
   CASE12 tab {"id":"doc-design","view":"doc","state":{"id":"tools/oculus/DESIGN.md","path":"tools/oculus/DESIGN.md","label":"Design"}}
13 c13_views.py   -> view table rows: 52 | rows whose description is not exactly one sentence: 0 / link in a name cell: 0 / HELP.md : open the manual, the Memories wall or a document of the Help page's group, its first nine / app.yml : (same) / equal   : True
```

## Verdicts

Items of the brief's "What to build":

- 1: holds. `ls docs` gives `apps.md diagrams`.
- 2: violated. The plain keys the guides name are not all in HELP.md (Spec 1). Facts the report marks as kept were dropped (Spec 2). HELP.md:24 states something the code does not do (Spec 4). HELP.md:270 uses a not-X construction (Standards 3). The rest holds: the sections, their order, the Contents, the debugging keys and the `launch.yml` fence with its four bullets, the h1-h9 row in both files, and the 401 lines.
- 3: holds. Case 10 is met. I checked these facts against the code: the sandbox attribute (`address.ts:28`), the `apps_dir` default (`watch/apps.ts:93-95`), the store folders (`store.ts:23-30`), the limit defaults (`config/behavior.yml:297-309`), the `subtask-add` body (`writes/bodies.ts:229-233`) and the `open` refusals (`state/system/apps/methods.ts:258-314`).
- 4: violated in part. The `present.yml` row of "Where each schema is" points to a HELP.md section that does not give the deck's fields (Spec 3). Everything else holds: cases 7, 8 and 9, the layer table checked against `.oculus/config/*`, line 20 removed, "Option files" removed and the condition table's last column reworded.
- 5: violated. Four rewritten pointers name a HELP.md section that does not hold what the sentence says it holds, and a fifth names the wrong section (Standards 1). Lines 82 and 491 hold, and the "Design" entry is gone from `.oculus/config/layout.yml`.
- 6: holds. Case 6.
- 7: violated in part. The comments at `config-folder.test.ts:1-5` and `Help.svelte:23-24` are false after the step (Standards 2). README.md:9, `doc-link.ts`, `docs.ts`, `Doc.svelte` and `history.test.ts` hold.
- 8: violated. The case scripts are not in the report and not under $TMPDIR (Proof 1). Verify 5, the history-word grep and the line on the changed test title are missing (Proof 2). The wrong premise about the "Design" tab is not named (Proof 3). One visible change is not stated (Behaviour 1).

Cases of the brief's "Cases":

- 1: met.
- 2: met, by my run and by the whole-hub grep.
- 3: partial. The run lists only chords that hold a modifier, and F-keys. The guides' plain keys are not in the list, and several of them are missing from HELP.md (Spec 1). The other parts are met: the fence, the five debugging rows, the `local.yml` keys, the hub's layer, `.oculus/` and `~/.oculus`.
- 4: met (401, 349, 0).
- 5: met (58 targets, 0 unmatched).
- 6: met (1 of 1, 5 of 5).
- 7: met (prints nothing).
- 8: met.
- 9: met.
- 10: met.
- 11: met after the change (4 files, 81 passed, 1 skipped). The base run is not verifiable here, see Declined.
- 12: met. The tab keeps its `path`. How it is drawn is for the landing look.
- 13: met.

## 1. Spec

- tools/oculus/HELP.md, The keys and the sections, against the removed guides:
  - Quoted hunk: the case 3 script's pattern `CHORD = re.compile(r'(?<![A-Za-z0-9])(?:' + MODS + r'[+-]){1,3}' + KEY ...)` plus `FKEY`.
  - What is wrong: item 2 asks for every key and chord the seven guides name, and the case 3 run counts only keys with a modifier, and F-keys. These plain keys are named in the base guides and absent from HELP.md (each checked with `grep -n` over HELP.md):
    - debugging.md:59 and views.md:93: in the Debug Console, "Tab or a press takes one into it without sending it".
    - files-and-search.md:150: in the Search view, "the last twenty texts each box ran, which Up and Down in the box walk, newest first".
    - files-and-search.md:142: "`/` puts the cursor back in the box from anywhere in the results".
    - window.md:67: in menus, "ArrowRight or Enter on one of them opens its list, and ArrowLeft or Escape in that list goes back", and "typing the start of a choice's name goes to it".
    - window.md:64: a docked float's handle "sets its size, by drag or by the arrow keys".
    - files-and-search.md:47: in the tree's name box, "Enter or leaving the box accepts a valid name, Escape cancels".
    - views.md:85: in the References view, Enter "keeps the tab and moves the caret to the range".
  - Failure scenario: a reader who wants an earlier search query, or a submenu from the keyboard, finds no key in the manual, and the guide that named it is gone.
  - Verdict: item 2 violated, case 3 partial.
- tools/oculus/HELP.md, Configuration and the data, Source Control and worktrees and The views, against the report's "What became of each removed guide":
  - What is wrong: the report marks these sections "kept", but facts of them that no view shows are absent from HELP.md (my `grep -n` over HELP.md for each finds nothing):
    - configuration.md:74: "A mail account is its own consent with the mail scopes alone, so a calendar account of the same mailbox never gains the right to send".
    - configuration.md:78 and :84: mail and calendar are read "every 2 minutes while a provider refuses".
    - configuration.md:27: "A `collections:` entry named as the id of a built-in view (`debug` or `files`, for one) is not registered".
    - configuration.md:56: `rite_dap_bin` takes "an absolute path, a path under `~/` or a name on PATH, `rite_dap` when absent".
    - configuration.md:62: "An entry still written with the one key `affiliation:` is read as a list of that one and gets a finding". DATA-MAP does not state this either.
    - views.md, Live HPC: "One run per `<host>:<folder>` goes at a time".
    - source-control.md, autofetch: "when only the older `GIT_SSH` variable names the ssh program, nothing is added for ssh, which may then still ask".
  - Failure scenario: a reader asks whether adding a calendar account of a mailbox lets oculus send mail, or why a collection named `files` never shows up, and the manual does not answer.
  - Verdict: item 2 violated.
- docs/DATA-MAP.md, "Where each schema is":
  - Quoted hunk: "| the `present.yml` of every deck | `tools/oculus/HELP.md`, section The views (the Present bullets) |"
  - What is wrong: item 4 asks this row to say where the file's fields are given, on this page or, for a root's `.oculus/` file, in HELP.md. The Present bullets (HELP.md:225-229) give only `notes:`, `slides:` and `order:`. The deck schema's `deck.title`, `defaults.tag_tones` and `groups.<name>.find`, `sort` and `discover` (`config/schemas/deck-schema.yml:13-32`) are given nowhere on the page or in HELP.md. HELP.md:383 only names `deck-schema.yml`. The base row named that schema file.
  - Failure scenario: a reader writing a deck's `present.yml` follows the row to HELP.md and finds no `groups.find` or `discover`.
  - Verdict: item 4 violated in part.
- tools/oculus/HELP.md:24:
  - Quoted hunk: "Its tabs are the `help` arrangement of `config/layout.yml` and the `docs:` list of the hub's layer."
  - What is wrong: the Help page's tabs are only the `help` arrangement (`config/layout.yml:93`: help, the Apps guide, memories). An entry of `docs:` is opened by its chord or its catalogue row on the page the reader is in (`src/lib/shell/keys/workbench-keys.svelte.ts:198-202, 210-211`), never as a tab of the Help page. The bullet's first clause ("holds ... the hub's documents") follows the brief's dictated wording. The second sentence is the builder's.
  - Failure scenario: a reader adds a document to `docs:` and looks for it as a tab on the Help page.
  - Verdict: item 2 violated.

## 2. Proof

- The report, "The cases, first run":
  - Quoted hunk: "Scripts are in the builder's scratch folder (`.../scratchpad/d49b/cases/`)".
  - What is wrong: the brief says "each quoted run is a command line or a scratch script under `$TMPDIR`, given whole in the report", and that scratch files are under `$TMPDIR` only. The eleven scripts (409 lines by `wc -l`) are not in the report, their path is elided, and they live under `/private/tmp/claude-502/.../scratchpad`, outside `$TMPDIR`. I found them only because that folder survived.
  - Failure scenario: a reader of the ledger after the scratchpad is cleaned cannot rerun or read any case check, cases 3 and 10 included, whose scope is exactly what Spec 1 disputes.
  - Verdict: item 8 violated.
- The report, missing parts:
  - What is wrong:
    - Verify 5 asks that each new sentence is read against the prose rules and each departure named. The report has no such part (`grep -n -i prose` finds only file paths), and HELP.md:270 departs from them (Standards 3).
    - The rules file's "What every package obeys" asks for the history-word grep of changed comment lines and test titles, quoted with each hit judged. It is absent. My grep of the added `src` and `tests` lines finds only "removed from the state" in Doc.svelte, which is not history.
    - The step renames the test title at `history.test.ts:155`, and the report neither quotes a run of it nor says in one line that the change is to the title only.
  - Failure scenario: the orchestrator cannot tell from the ledger that the prose and history checks were done.
  - Verdict: item 8 violated.
- The report, "Anything in the brief that was wrong":
  - Quoted hunk: "Nothing that stopped the work."
  - What is wrong: the brief's report list says a saved "Design" tab "keeps drawing DESIGN.md, since the file stays". That premise is wrong. `followDoc` (`src/lib/state/workbench/navigation/catalogue.ts:44-48`) returns no entry for a path and label no `docs:` entry carries, and then `Doc.svelte:84-89` and `:169-170` draw `doc.unlisted`. The report's visible-change table gives the correct after state, but the brief error is not named where the rules file's Report section asks for it.
  - Failure scenario: the orchestrator reads that section, finds nothing, and expects DESIGN.md at the landing look.
  - Verdict: item 8 violated.

## 3. Standards

- tools/oculus/DESIGN.md, pointers rewritten by the step (rules file, "What every package obeys": a sentence the change makes false is a defect; brief item 5: a pointer goes to the HELP.md section that now holds the rule):
  - :91: "`HELP.md#configuration-and-the-data` lists with what each holds". HELP.md:381 lists the files' names only.
  - :156: "What an undo of a removed field or a rewritten note puts back is in `HELP.md#configuration-and-the-data`". The report says this rule was "dropped as detail of one control", and `grep -i "removed field\|following text"` over HELP.md finds nothing.
  - :539: "the views that carry it are listed in `HELP.md#the-views`". HELP.md:217 lists none. The base views.md:249 listed them: the three feeds, the collection views, Person, Venues, Data, Pillars, Domains and the Settings file lines.
  - :566: "(the hue names are in `HELP.md#the-views`)". HELP.md:222 names no hue. The base views.md Focus section did: "Run green, Push blue, Revise amber ...".
  - :150: "the view's forms in `HELP.md#the-views`". The Calendar's Add account and Remove are at HELP.md:398-399, under Configuration and the data.
  - Failure scenario: a maintainer follows the pointer to learn which views carry the file control, or the lane hues, and the section is silent.
  - Verdict: item 5 violated.
- tools/oculus/tests/checks/config/config-folder.test.ts:1-5 and tools/oculus/src/lib/views/system/help/Help.svelte:23-24:
  - Quoted hunks: "that every file carries the one line the Settings view and the manual's Configuration section show", and "the diagrams of docs/diagrams/ are drawn by the doc view over DESIGN.md and the Apps guide".
  - What is wrong:
    - The test checks a description key per config file (`:364-379`), and HELP.md's Configuration section shows no file's line.
    - After the step the doc view never draws DESIGN.md: no `docs:` entry names it, so a doc tab over it draws `doc.unlisted`. The Apps guide holds no diagram (`grep -n "diagrams/" docs/apps.md` prints nothing).
  - Failure scenario: a maintainer trusts the comment and looks in HELP.md for each file's line, or for where DESIGN.md's diagrams are drawn.
  - Verdict: item 7 violated in part.
- tools/oculus/HELP.md:270:
  - Quoted hunk: "what counts as text is the file's own first bytes, not its extension".
  - What is wrong: the rules file's prose rule bans the "not X but Y" construction, and this sentence is new (`grep -c ", not its extension"` of the base files-and-search.md gives 0).
  - Failure scenario: none at run time. The manual carries a construction the prose rules forbid.
  - Verdict: item 2 (prose).

## 4. Behaviour

- tools/oculus/.oculus/config/layout.yml (the "Design" entry removed) together with Doc.svelte:84-89:
  - What a user sees change: before, DESIGN.md opened from the Help group with its `docs/diagrams/` drawings, because only `Doc.svelte` draws a diagram (`grep -rln Diagram src/lib/views` names Doc.svelte and the present Panel). After, no view draws DESIGN.md's diagrams: a doc tab over it shows the unlisted line, and the Files view opens it as source text.
  - Where the report should have stated it: the report names the saved "Design" tab, but not that the diagrams are no longer drawn anywhere in oculus. It also does not name, for the look, the rewritten content of the Apps guide and Data map tabs.
  - Failure scenario: Axel looks for the layer diagrams in oculus after landing, finds them nowhere, and has not been told this is the cost of ruling (8).
  - Verdict: item 8 violated.

## Declined to judge

- The base run of verify 2 and case 11. The base copy is read-only, and vitest writes a config timestamp file beside `vite.config.ts` and needs `.svelte-kit/tsconfig.json`, which the copy lacks. Running it would mean writing into the copy.
- `npm run diagrams` itself, since it writes into `docs/diagrams/`. The in-memory byte-for-byte test stood in for it and passed. Its first run timed out at the default 5 s in a file the step does not change.
- Whether each dropped description of a visible control or menu item was right to drop under item 2's selection rule. I read the configuration and debugging guides whole, read the rest by their backticked and key tokens absent from the three pages, and sampled the sentences around them. A full sentence-by-sentence pass over views.md and files-and-search.md was not done.
- The rule "a section's bullets are in the order a reader meets the things they describe". It is a reading judgement that I did not test bullet by bullet.
- The Help page, the Views catalogue, the key sheet and the saved tabs on screen. These are for the landing look.

Reviewer usage: add1d084012545bb6, claude-opus-5-5, 352,420 tokens, 138 tool uses, 26.2 min.

## Paths

- /Users/axelfaes/workspace/research-hub/.agents/worktrees/D49/tools/oculus/HELP.md
- /Users/axelfaes/workspace/research-hub/.agents/worktrees/D49/tools/oculus/DESIGN.md
- /Users/axelfaes/workspace/research-hub/.agents/worktrees/D49/tools/oculus/docs/apps.md
- /Users/axelfaes/workspace/research-hub/.agents/worktrees/D49/docs/DATA-MAP.md
- /Users/axelfaes/workspace/research-hub/.agents/worktrees/D49/tools/oculus/tests/checks/config/config-folder.test.ts
- /Users/axelfaes/workspace/research-hub/.agents/worktrees/D49/tools/oculus/src/lib/views/system/help/Help.svelte
- /Users/axelfaes/workspace/research-hub/tools/oculus/.scratch/migration/agents/reviews/D49-report.md
- /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/d49b/cases/ (the builder's case scripts)

## Repair round 1, refuted

All runs were made from the worktree `/Users/axelfaes/workspace/research-hub/.agents/worktrees/D49` (base 9337c3ad4), with `HOME=$TMPDIR/d49rr1/home` and Node v24.21.0 first on PATH. The builder's scripts were copied from `$TMPDIR/d49r1/cases` (the folder the report names, under the builder's scratchpad) into my own `$TMPDIR/d49rr1/d49r1/cases`, and run there with `python3 -I`. `git status --short` gave the same 21 step paths plus the untracked report before my runs and after them. No snapshot of the tree was taken when the round was sent, so the delta was read as the whole diff since the base, with the builder's `HELP.before-r1.md` used only to find which HELP.md lines this round changed.

```
# Verify 1 (npm run diagrams writes into docs/diagrams/, so the in-memory diagram check stands in for it, as the round brief allows)
npm run test:quick
test:quick: 20 changed file(s), from git since HEAD
test:quick: 14 test file(s), 10 essential
ok      prettier (0.6 s): All matched files use Prettier code style!
ok      ASCII gate (0.7 s)
ok      svelte-kit sync (2.3 s)
ok      eslint (2.0 s)
ok      svelte-check (10.3 s): 1791608046278 COMPLETED 454 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (18.1 s): Duration  12.69s (transform 15.52s, setup 0ms, import 27.29s, tests 9.88s, environment 4ms)
test:quick: 18.8 s (limit 45.0 s); every command passed
npx vitest run tests/checks/diagrams --testTimeout 300000 --reporter=dot
 Test Files  1 passed (1)
      Tests  46 passed (46)
# Verify 2, after the change (the base copy is read-only, see Declined)
npx vitest run tests/checks/config tests/checks/source tests/data/sources/docs.test.ts --testTimeout 300000 --reporter=dot
 Test Files  9 passed (9)
      Tests  115 passed | 1 skipped (116)
npx vitest run tests/checks/source/history.test.ts --reporter=verbose
 ✓ ... names no package id, date or session in any comment
 ✓ ... names no package id, date or session in any document
 ✓ ... reads every line of a text file, every document and every comment of code
      Tests  3 passed (3)
# Verify 4
LC_ALL=C grep -n '[^ -~]' HELP.md docs/apps.md ../../docs/DATA-MAP.md DESIGN.md README.md   -> nothing, grep exit 1
perl ASCII gate of agents/spec.md over $(find src tests config -type f ! -name local.yml)   -> nothing, perl exit 0
LC_ALL=C grep -n '[^ -~]' ../../.oculus/config/layout.yml   -> nothing, exit 1
# Verify 6, 7
sh utils/folder-check.sh   -> exit 0
python3 -c "import yaml,sys; ..." config/layout.yml config/text/app.yml ../../.oculus/config/layout.yml   -> exit 0
wc -l: HELP.md 450, docs/apps.md 349, DESIGN.md 591, README.md 48, config/layout.yml 182, config/text/app.yml 258, doc-link.ts 56, docs.ts 624, Doc.svelte 209, Help.svelte 96, config-folder.test.ts 649, history.test.ts 186, ../../.oculus/config/layout.yml 13, ../../docs/DATA-MAP.md 579
# Cases (the builder's scripts, rerun)
1, 2, 7  sh c01_c02_c07.sh $W   -> "apps.md diagrams"; case 2 grep exit 1; case 7 grep exit 1. On $B: 269 output lines.
3   c03_keys.py $B $W/HELP.md   -> chords and function keys in the seven guides: 78 / missing ... : 0   (base HELP.md: 23 missing)
3b  c03b_plain.py $B $W/HELP.md   -> guide-line/key pairs: 122, NONE rows 0   (base HELP.md: 30 NONE)
4   c04_bullets.py HELP.md   -> 254 bullet/paragraph lines checked, 0 over the rule; docs/apps.md 61 checked, 0 over; awk 'length > 600' HELP.md | grep -v '^|' | wc -l -> 0
5   c05_anchors.py   -> every target "ok"; base: targets: 0 unmatched: 0
6   c06_docpaths.py   -> help arrangement doc tabs: 1 existing: 1 / hub docs entries: 5 existing: 5   (base 8/8, 13/13)
8   c08_fields.py   -> project.yml table at line 385: 46 names, [] / []; side-project table at line 464: 17 names, [] / []; project.yml field tables in the page: 1, side-project field tables: 1
    c08_deck.py   -> deck-schema leaf fields: 7; table at line 489: 7 names; missing [] ; extra []
9   c09_vocab.py   -> 15 vocab rows, every "vocab not on page: [] | page not in vocab: []"; venue_tiers assignable false: ['unrated'] | page says unrated with `assignable: false`: True
10  c10_apps.py   -> methods, channels, open write kinds, refusal words: "code not in guide: []" and "guide not in code: []" for each; closed channels 3 of 3; closed write kinds 23 of 23
12  SCRATCH_FILES=c12.test.ts npx vitest run -c vitest.scratch.config.ts (copied to the session scratchpad, since the config cannot resolve @sveltejs/kit from /var/folders)
    CASE12 tab {"id":"doc-views","view":"doc","state":{"id":"tools/oculus/docs/views.md","path":"tools/oculus/docs/views.md","label":"Views guide"}}
    CASE12 tab {"id":"doc-design","view":"doc","state":{"id":"tools/oculus/DESIGN.md","path":"tools/oculus/DESIGN.md","label":"Design"}}
    Tests  1 passed (1)
13  c13_views.py   -> view table rows: 52 | not exactly one sentence: 0 / link in a name cell: 0 / HELP.md and app.yml h1-h9 rows equal: True
extra  keys_exist.py   -> 183 key-like tokens; not found: 9 (commit.gpgsign, desktop.yml, launch.json, microsoft.json, pull.rebase, pyproject.toml, pyrightconfig.json, statusbar.yml, ui.yml), the same as the report
extra  claims.py   -> output byte-equal to the report's section 9.14 (see the note below)
```

A note on `claims.py`, the report's section 9.14 ("Numbers HELP.md states against the code"). My run prints what the report quotes. That output proves no number. Five claims print `MISSING`, and many lines match unrelated constants: "lsp edit file 5 MB" matches `ANSWER_MAX` of `literature/ask.ts`, "poll files twice a second" matches `STOP_WAIT_MS` of `desktop/app.ts`, and "fix writing 2 MB left out" matches git's 32 MB `MAX_OUTPUT`. The report quotes this without reading it. I checked the five `MISSING` numbers in the code by grep, and each holds:
- `SNAP_PX = 24` (`float-geometry.ts:18`)
- `RETURN_WAIT_MS = 3000` (`present.svelte.ts:108`)
- the console's 10,000 lines (`Console.svelte:21`)
- `PDF_PLACES_LIMIT = 50` (`pdf-place.ts:22`)
- `--dangerously-skip-permissions` (`schedules/run.ts:76`)

No decision rests on section 9.14, so I do not raise it as a finding.

### Closure of the first review's findings

- **Spec 1 (plain keys): closed.** Cases 3 and 3b give 0 missing and 0 `NONE`. My grep of the base guides for Escape, Esc, Space, Backspace, PageUp and PageDown finds each clause in HELP.md, for example `terminals.md:37` at HELP.md:148 and `files-and-search.md:31` at HELP.md:282. The seven named keys are at HELP.md:154/382, 109/331, 106/328, 46/129, 38/130, 110 and 153.
- **Spec 2 (facts no view shows): partly closed.** The seven named facts are at HELP.md:445, 446, 429, 378/436, 248 and 398, and at DATA-MAP.md:267, each found by grep. The full read misses facts, listed under Spec 2 below.
- **Spec 3 (deck fields): closed.** DATA-MAP.md:485-499 has the table and case 8 for the deck schema prints no difference. I read the table against `deck/spec.ts` and `groups.ts`: `sort` defaults to `folder` (`spec.ts:126`); a group with no `find` names project decks (`groups.ts:8`). An empty `order` is a finding (`read.ts:179`, `findings.deck.no_order`). Section 11.3 is correct that the schema has no `notes` field (`grep -c notes` prints 0).
- **Spec 4 (the Help page's tabs): closed.** HELP.md:25 matches `config/layout.yml:93` and `followDoc` (`catalogue.ts:38-48`). The tab closing into the one already showing the entry is `Doc.svelte:116-128`.
- **Proof 1 (case scripts not in the report): closed.** Every case script is given whole in section 9. My copies reproduce every output I reran. A gap remains: the locator `local_all.py`, on which section 2.3's completeness rests, is not given (Proof 1 below).
- **Proof 2 (prose pass, history grep, renamed test title): closed.** These are sections 7 and 6.1 and the history test rows of sections 8 and 10. My run of `history.test.ts` passes 3 of 3.
- **Proof 3 (the brief's premise about the "Design" tab): closed.** It is section 11.1, and `catalogue.ts:44-48` and `Doc.svelte:169-170` bear it out.
- **Standards 1 (the five pointers): closed.** `DESIGN.md:91` points to HELP.md:422-425, `:150` to 437 and 446-447, `:156` to 444, `:539` to 223 and `:566` to 229. Another pointer is now false: Standards 1 below.
- **Standards 2 (the comments): closed.** `config-folder.test.ts:1-5` now matches the check at `:364-379`. `Help.svelte:23-25` is rewritten, with one inaccuracy (Standards 2 below).
- **Standards 3 (the "not X" construction at HELP.md:270): closed.** HELP.md:294 reads "a file counts as text by its own first bytes, whatever its extension".
- **Behaviour 1 (visible changes): closed.** Section 14 names the DESIGN.md diagrams that no view draws any more, and the Apps guide and Data map tabs.

### Verdicts

Items of the brief's "What to build", over the whole diff since the base:

- **1: holds.** `ls docs` gives `apps.md diagrams`.
- **2: violated.**
  - HELP.md keeps what the selection rule says not to keep (Spec 1).
  - HELP.md drops facts of the kinds the rule keeps, without a row in the ledger (Spec 2).
  - The rest holds: the sections and Contents, the debugging keys and the `launch.yml` fence with its four bullets, the h1-h9 row in both files, the 450-line cap, 3 sentences or fewer per bullet, and every key of the guides.
- **3: holds.** Case 10 reruns clean, and the worked example is 49 lines by the report's count, which I did not recount.
- **4: holds.** Cases 7, 8 (with the deck table) and 9 rerun clean. The schema rows point to their places, line 20's sentence is gone, and the domains rule stays.
- **5: violated in part.** `DESIGN.md:146` claims HELP.md holds every Live HPC refusal word (Standards 1). The other 57 pointers I read hold, and so do `DESIGN.md:82` and `:491`. The "Design" entry is gone from `.oculus/config/layout.yml`.
- **6: holds.** Case 6 gives 1 of 1 and 5 of 5, and the hub's `docs:` order is Research approach, Agent approach, HPC how-to, Data map, Apps guide.
- **7: violated in part.** The `Help.svelte:23-25` and `Doc.svelte:24-26` comments are inaccurate (Standards 2). README.md:9, `doc-link.ts`, `docs.ts`, `config-folder.test.ts` and `history.test.ts` hold.
- **8: violated in part.** The dropped-sentence ledger lists as dropped sentences that HELP.md states. It also misses partial drops and does not give its locator (Proof 1).

Cases:

- **1: met.**
- **2: met.**
- **3: met.** There are 78 chords and function keys, 0 missing, and 122 plain-key pairs, 0 `NONE`. The fence, the five debug rows, the `local.yml` keys at HELP.md:435-439, the hub's layer at :427-433, `.oculus/` at :434 and `~/.oculus` at :441 are each read in place.
- **4: met.** 450 lines, 349 lines, and 0 lines over 600 characters.
- **5: met.**
- **6: met.**
- **7: met.**
- **8: met.**
- **9: met.**
- **10: met.**
- **11: met after the change** (inside my verify 2 run, 9 files passed). The base run is not verifiable by me (see Declined).
- **12: met.** The tab keeps its `path`. How it is drawn is for the landing look.
- **13: met.**

### Findings

#### Spec

**Spec 1. HELP.md keeps what item 2's selection rule says not to keep.**

- **Place:** `tools/oculus/HELP.md`, the lines listed below.
- **What is wrong:** item 2 says not to keep "descriptions of what a control looks like or where it sits, lists of every item of a menu, ... and repetition of what the key table or another bullet already says". The report says HELP.md has no room for more facts ("costs HELP.md lines it does not have"). At the same time, HELP.md spends text, and whole lines, on the following.

**(a) Lists of every item of a menu, toolbar or dialog:**
- :15 "(Move into New Window in the pane's and the tab's menus, Copy into New Window in the tab's, Restore into Main Window and Switch to Main Window in the popped-out one)"
- :38 "A float's menu offers Dock Left, Dock Right and Dock Bottom, Float on a docked float, Return to Page (...), Move into New Window (in the app) and Close". The effect of Return to Page is the only part to keep.
- :44, both sentences ("offers Open File..., New Text File (...), the splits, Float, Lock Group, Tab Bar, ..." and "A right-click on a tab offers VS Code's groups: Close, Close Others, ..."). The New Text File save rule is the only part to keep.
- :45 "Every text box offers Undo, Redo, Cut, Copy, Paste and Select All"
- :47 "The bar's right end carries the tab's own actions (Save, Revert File, the bookmark star, ...)"
- :73 "takes a name, what it runs, when (Off, Every hour, ...) and Run unattended"
- :252 "the Code theme menu offers From the theme, the 19 VS Code themes and Shiki's bundled themes"
- :257 "a row's menu has Copy, Copy Message and Show Documentation"
- :259 "the pane's actions refresh, clear, clear the last ten searches, collapse all"
- :269 "Open in New Tab, Open in New Window, Open in Browser and Open in Program are in the viewer's, the tab's and the Files row menu"
- :279 "The `...` menu of the view holds Add Folder to Workspace, Switch Workspace, Save Workspace As and Open Folder"
- :354 "a right-click on a button offers Edit, Schedule... and Delete ..."
- :381 "the floating toolbar over the top of the workbench offers Continue, Step Over, ..., Restart and Stop". The ledger drops this same sentence, `debugging.md:47.3`, as `A`.
- :404 "offers per conflict Accept Incoming, Accept Current, Accept Both in either order and Ignore"
- :408 "the commit's menu holds Open Changes, Copy Commit ID, Copy Commit Message, ... and the compares"
- :415 "carries four controls on hover or focus (...); its menu holds Start Claude Here and Start Codex Here"

**(b) What a control looks like or where it sits:**
- :13 "the window is a rail down the left, a status bar along the bottom and, between them, the pane tree"
- :20 "As shipped there are twelve, top to bottom: Focus, Projects, ..."
- :21 "Hovering it shows the page's name and the digit that reaches it"
- :23 "which sit in a float docked at the right edge"
- :26 "At the foot of the rail are ..." and "A fade at the top or bottom edge of the rail's list says more entries are past it, and the rail's list and the tab strips draw no scrollbar"
- :31 "the page on screen is the bold row with a check ... carries the unsaved dot"
- :37 "A floating pane has an orange border"
- :47 "under the strip as a breadcrumb"
- :51, the whole bullet: tooltip behaviour, the accent line and the dimmer strip. The ledger drops the same tooltip class (`window.md:11.2`, `:84.2`) as `A`.
- :58 "with a button at the end of each row that closes that workbench"
- :84 "as a spinner, a check ..., a cross ..., and a hammer ..." and "the whole bar is painted in the theme's orange"
- :229, the second sentence. The hue names of its first sentence are dictated by the round brief's item 5.
- :230, the first sentence.
- :232 "a label that would cover another label ... is hidden ..., a pillar's label is placed before its projects' and an archived project's label is dimmed"
- :235 "a card draws one tag per resource, a card with no subtasks offers adding the first among its controls and draws no subtasks block until it has one, and the cards of a grid are stretched to one height". Report section 2.2 lists this as added in this round.
- :251 "Under 700 px of width the table of contents hides behind a header button"
- :254 "One row per file (name, folder, number of edits) with a row per edit under it (line, the text taken out struck through, ...)"
- :257 "mark a file with its error or warning count and a folder with a dot"
- :278 "is drawn with it as one row (`a / b / c`)"
- :281 "is one line over the foot with a close control"
- :399 "grows with what is typed up to ten lines"
- :404 "shows Incoming and Current above the Result"
- :408 "drawn with dashed circles"
- :412 "a bar beside added and modified lines, a wedge where lines were deleted"

**(c) Descriptions of what a view draws:**
- :72, the tray's contents
- :82 and :83, the status bar items
- :219, what `person` and `entry` draw
- :220, the last sentence
- :234 "an opened card draws the project's fields (Status, Latest, ...)"
- :239, the Slides catalog
- :249, the Usage status words
- :250, the Audit sections, which also repeat the view table at :208
- :258, the TeX view's three sections
- :269 "with zoom, fit, find, an outline, thumbnails, ..."
- :287 "Open Editors and Timeline are closed at first; Open Editors lists the tabs ..."
- :394 "Pressing a repository shows its commit box, Changes, Graph, ..."

**(d) Repetition of the key table or of another bullet** (each pair says the same thing):
- :46 repeats :129, the whole bullet.
- :50 repeats :98 (Tab indents) and :94 (a bracket in a field).
- :64 repeats :132.
- :68, its second sentence, repeats :134.
- :328 repeats :106 (`/`).
- :331 repeats :109 and :152.
- :281 repeats :111.
- :280 repeats :112.
- :296 repeats :115.
- :257 repeats :117 (F8).
- :359, the whole bullet but its last clause, repeats :118.
- :272 repeats :124.
- :38 repeats :130.
- :315, :317 and :259 repeat :136-138.
- :401 and :412 repeat :143.
- :346 repeats :148.
- :399 repeats :150.
- :396 repeats :151.
- :382 repeats :154, in the same words.
- :344 repeats :155.
- :237 repeats :156-157.
- :283 repeats :105.
- :282 repeats :100.

Four DESIGN.md pointers lean on (b): `:554` and `:568` point to HELP.md:51, `:556` to :26, and `:565` to :235 and :232. Item 5's third option ("names the code that holds it") is the fix for those pointers. Keeping appearance text in HELP.md to serve them is not.

- **Failure scenario:** a reader looking for what HELP.md alone can tell them (a key, a file, a refusal, a limit) reads through menu lists and colour descriptions that the screen already shows. The step's decision 1 says the 450-line bound is met "only as the selection rule of item 2 cuts it". The cap was reached with text the rule excludes, and the builder then cites the cap as the reason not to keep facts (section 13.1).
- **Verdict:** item 2 violated.

**Spec 2. Facts the rule keeps are dropped with no ledger row, and one `OBS` drop makes a kept sentence false.**

- **Place:** HELP.md:356, :67, :24 and :425-426.
- **What is wrong:** the round brief's item 2 asks for every sentence of the guides to be read and each dropped one named. Section 2.3 claims "A sentence not listed here is stated in HELP.md". `sentences.py`, run on the base guides, gives these partial drops:
  - **`terminals.md:57.7`**, not in the ledger: "a line that evaluates text itself (`eval`, `sh -c`, and `$((...))` arithmetic in bash) runs the value as code". HELP.md:356 keeps only "`eval` or `sh -c` runs the value as code". `grep -n '\$((' HELP.md` prints nothing. This is a safety fact: a `${selectedText}` inside bash arithmetic runs as code.
  - **`files-and-search.md:146.6`**, not in the ledger: "a served root that is a private folder or lies inside one lists no name at all, where a search runs over it". HELP.md:67 keeps only "the machine's private folders are left out". This is the sentence D46's landing added as its fix of finding 2 (`plan.md:708`).
  - **`files-and-search.md:146.12`**, not in the ledger: each root's name listing gets `search.timeout_s` seconds, and a root that fails or runs out of time is answered with the paths read so far. This is a limit and its setting. HELP.md:67 names only `search.max_names`.
  - **`window.md:21.2`**, an `OBS` row: "A catalogue the reader has moved onto a page of their own opens the view on that page". Without it, HELP.md:24's "A click on a Views catalogue entry opens the view on the page you were on before the System page" is false for a moved catalogue. This is taken from the base guide, which I did not run.
  - **`configuration.md:52.3`**, an `R` row: the `{0}` and `{1}` placeholders of `config/text/findings.yml`, a file a reader edits by hand. `grep -n '{0}' HELP.md` prints nothing.
- Each fits as a clause of an existing bullet at no line cost.
- **Failure scenario:** a reader writes `run: echo $(( ${selectedText} + 1 ))` in `.oculus/commands.yml` believing the manual's "never read as shell text", and a selection runs as code. Another reader serving a root under a private folder finds Cmd+P empty and no sentence in the manual explains why.
- **Verdict:** item 2 violated (the round's item 2 is partly closed).

#### Proof

**Proof 1. The dropped-sentence ledger lists as dropped sentences HELP.md states, and its completeness claim does not reproduce.**

- **Place:** report section 2.3 and section 13.1.
- **What is wrong:** these rows say dropped, but HELP.md states them:
  - `window.md:21.6`, `:21.7` (with the key Shift+F10), `:21.9` and `:21.10`, at HELP.md:24 ("An entry's right-click menu (or Shift+F10) offers Open on this page and Open beside on this page, a drag onto a pane of that page opens it there, and the catalogue's own pane is never covered").
  - `window.md:39.2` at HELP.md:42 ("closing the shown tab shows the one shown before it").
  - `views.md:125.7` at HELP.md:237 ("both draw the deck as saved"), its first half.
  - `files-and-search.md:91.4` at HELP.md:317 ("also in a tab's unsaved text").
  - `debugging.md:47.3` (`A`) at HELP.md:381.
- The claim that every unlisted sentence is stated does not hold either (Spec 2). The locator `local_all.py`, whose threshold ("not mostly on one HELP.md or DATA-MAP line") chose which sentences were read, is named but not given in the report.
- **Decision that rests on it:** the ruling the builder asks for in section 13.1, to accept `OBS`, which lists these rows as drops to accept.
- **Failure scenario:** the orchestrator rules on 20 "dropped" `OBS` rows, 6 of which are kept, and accepts the claim that nothing else was dropped, while three facts are gone.
- **Verdict:** item 8 violated in part.

#### Standards

**Standards 1. `tools/oculus/DESIGN.md:146` claims more than the HELP.md section holds.**

- **Quoted hunk:** "how a failing poll looks, what Submit Job runs and each refusal word are in `HELP.md#the-views`"
- **What is wrong:** HELP.md:246-248 names `unreachable`, `changed`, `copy-failed` and `submit-failed`. `SubmitReason` (`src/lib/server/machine/hpc/submit.ts:37-52`) holds 16 words (`outside`, `not-slurm`, `no-project`, `outside-code`, `bad-cluster`, `no-host`, `no-files`, `not-sent`, `unconfirmed`, `changed`, `busy`, `closed`, `copy-failed`, `submit-failed`, `no-job-id`). Item 5 and the round brief's item 5 ask that the named section holds what the sentence says. Report section 5 marks it holding.
- **Failure scenario:** a maintainer looks in HELP.md for the meaning of `no-host` or `busy` and finds nothing.
- **Verdict:** item 5 violated in part.

**Standards 2. The two view comments are inaccurate.**

- **`tools/oculus/src/lib/views/system/help/Help.svelte:24`:** "only over a document listed in `docs:` of config/layout.yml". `config/layout.yml:182` is `docs: []`. The list is the hub's layer, `.oculus/config/layout.yml`, as the view's own `doc.unlisted` sentence says.
- **`tools/oculus/src/lib/views/sources/doc/Doc.svelte:24-26`:** "A listed document of oculus's own (the Apps guide) comes back with its diagrams cut out". `grep -c "diagrams/" docs/apps.md` prints 0, and Help.svelte says the Apps guide holds none.
- **Failure scenario:** a maintainer adds a document to the engine's `docs:` to get its diagrams drawn on this hub, and nothing changes, because the hub's layer replaces the key.
- **Verdict:** item 7 violated in part.

**Standards 3. A line the step edited keeps history wording.**

- **Place:** `docs/DATA-MAP.md:243`.
- **Quoted hunk:** "the `tools/present` build used; the build is no longer run"
- **What is wrong:** the brief's Conventions ban history wording in a document. The diff edits this line (it removes the source path), and report section 13.8 says it is "not a sentence of this step".
- **Failure scenario:** none at run time. The page carries a phrase the brief bars.
- **Verdict:** none (prose).

#### Behaviour

None.

### Judgement of the `OBS`, `R` and `HIST` rows

The standard is item 2's selection rule. Keep a key, a hand-written file with its keys and place, what is kept where, what asks first or is refused, and a limit with its setting. Also keep a fact whose absence costs work or data.

**`OBS` (20 rows):**

| Row | Judgement |
|---|---|
| `window.md:21.2` | Should be kept (Spec 2). |
| `window.md:21.6` | Kept in HELP.md (HELP.md:24); the ledger row is wrong. |
| `window.md:21.7` | Kept in HELP.md (HELP.md:24); the ledger row is wrong. |
| `window.md:21.9` | Kept in HELP.md (HELP.md:24); the ledger row is wrong. |
| `window.md:21.10` | Kept in HELP.md (HELP.md:24); the ledger row is wrong. |
| `window.md:39.2` | Kept in HELP.md (HELP.md:42); the ledger row is wrong. |
| `files-and-search.md:91.4` | Kept in HELP.md (HELP.md:317); the ledger row is wrong. |
| `views.md:125.7` | Kept in part (HELP.md:237, "as saved", which covers what unsaved text reaches). The rest, slide 1 fallback and an empty deck ending, is correctly dropped. |
| `window.md:21.8` | Correctly dropped: none of the kinds the rule keeps, and no loss. |
| `window.md:35.5` | Correctly dropped: none of the kinds the rule keeps, and no loss. |
| `window.md:88.7` | Correctly dropped: none of the kinds the rule keeps, and no loss. |
| `views.md:7.10` | Correctly dropped: none of the kinds the rule keeps, and no loss. |
| `views.md:123.3` | Correctly dropped: none of the kinds the rule keeps, and no loss. |
| `views.md:125.8` | Correctly dropped: none of the kinds the rule keeps, and no loss. |
| `views.md:125.11` | Correctly dropped: none of the kinds the rule keeps, and no loss. |
| `views.md:129.2` | Correctly dropped: none of the kinds the rule keeps, and no loss. |
| `views.md:133.8` | Correctly dropped: none of the kinds the rule keeps, and no loss. |
| `views.md:145.3` | Correctly dropped; HELP.md:48 already says text Add puts in a tab is unsaved. |
| `source-control.md:7.12` | Correctly dropped: none of the kinds the rule keeps, and no loss. |
| `files-and-search.md:144.1` | Correctly dropped: none of the kinds the rule keeps, and no loss. |

**`R` (14 rows):**

| Row | Judgement |
|---|---|
| `configuration.md:52.3` | Should be kept in part: the `{0}`/`{1}` rule of a hand-edited file. The code `R` does not fit this sentence. |
| `window.md:90.6` | Correctly dropped: a route or worker. HELP.md:67 keeps the reader's fact. |
| `configuration.md:52.1` | Correctly dropped; HELP.md:425 keeps the folder rule. |
| `configuration.md:52.5` | Correctly dropped; HELP.md:426 keeps the findings. |
| `terminals.md:37.5` | Correctly dropped: internal byte transport, nothing a reader sets or acts on. The label `R` misnames it. |
| `terminals.md:57.6` | Correctly dropped; HELP.md:356 keeps the rule. |
| `terminals.md:57.9` | Correctly dropped: the terminal prints the line. |
| `terminals.md:65.6` | Correctly dropped; HELP.md:358 keeps the diagnostics. |
| `files-and-search.md:35.1` | Correctly dropped (routes). |
| `files-and-search.md:51.6` | Correctly dropped (routes). |
| `files-and-search.md:146.1`, `:146.2` | Correctly dropped (routes). |
| `files-and-search.md:146.3`, `:146.9` | Correctly dropped (framing sentences). The ledger misses `146.6` and `146.12` (Spec 2). |

**`HIST` (1 row):** `terminals.md:61.5` is correctly dropped. It describes approvals from an earlier format, which the brief's Conventions bar from a document.

**On the ruling the builder asks for:** `R`, `HIST` and `OBS` are acceptable as reasons. None of them covers a kind the rule keeps, except for the rows named above. The builder's reason against keeping them ("costs HELP.md lines it does not have") is the lazy argument. Each row that should be kept fits as a clause of an existing bullet, and HELP.md's lines are spent on the content Spec 1 lists.

### Brief errors in report section 11

All four are correct:
- **The saved "Design" tab:** `catalogue.ts:44-48` and `Doc.svelte:169-170` bear it out.
- **`views.md:85`:** it is the Problems section (heading `## Problems` at :83).
- **No `notes` field:** `grep -c notes config/schemas/deck-schema.yml` prints 0.
- **The rail order:** `window.md:15` gives Focus, Sessions, Projects, while `config/layout.yml:10-13` gives Focus, Projects, Incoming, Sessions.

### Declined to judge

- **The base run of verify 2 and case 11.** The base copy is read-only, and vitest writes beside its config. The report's base output is a saved file from the first round (`d49b/c11-first.txt`, 02:33). I did not rerun it.
- **`npm run diagrams` itself,** which writes into `docs/diagrams/`. The in-memory diagram test stood in for it and passed (46 of 46).
- **Whether HELP.md:24 is false for a moved catalogue.** I took this from the base guide's `window.md:21.2` and did not run the catalogue.
- **The rule "a section's bullets are in the order a reader meets the things they describe."** This is a reading judgement I did not test bullet by bullet.
- **The S, L, A, T, X and G rows of the ledger (176 rows).** I read only the `configuration.md` and `debugging.md` rows besides the `OBS`, `R` and `HIST` rows.
- **The screen** (the Help page, the Views catalogue, the key sheet, the saved tabs, and the Apps guide and Data map tabs). These are for the landing look.

Reviewer usage: a7ac7ddb45eb85813, claude-opus-5-5, 373,779 tokens, 80 tool uses, 21.4 min (from the completion notice).

Paths:
- `/Users/axelfaes/workspace/research-hub/.agents/worktrees/D49/tools/oculus/HELP.md`
- `/Users/axelfaes/workspace/research-hub/.agents/worktrees/D49/tools/oculus/DESIGN.md`
- `/Users/axelfaes/workspace/research-hub/.agents/worktrees/D49/docs/DATA-MAP.md`
- `/Users/axelfaes/workspace/research-hub/.agents/worktrees/D49/tools/oculus/src/lib/views/system/help/Help.svelte`
- `/Users/axelfaes/workspace/research-hub/.agents/worktrees/D49/tools/oculus/src/lib/views/sources/doc/Doc.svelte`
- `/Users/axelfaes/workspace/research-hub/.agents/worktrees/D49/tools/oculus/src/lib/server/machine/hpc/submit.ts`
- `/Users/axelfaes/workspace/research-hub/tools/oculus/.scratch/migration/agents/reviews/D49-report.md`
- `/var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/d49rr1/d49r1/cases/` (my copies of the builder's case scripts)

## Closed (at landing)

The findings of the review over repair round 1, the last round, fixed on main at landing (`repair_rounds: 1`, so none went back to the builder):

- Spec 1 (HELP.md kept what the selection rule says not to keep): fixed. The menu lists, the descriptions of where a control sits or what it looks like, the descriptions of what a view draws and the bullets repeating the key table are cut or rewritten to the fact they carry (HELP.md 450 to 447 lines); a fact inside a cut sentence is kept (the Return to Page effect, New Text File's save rule, the Problems F8 range in the key table, Right and Left in the tree row). Case 3 after the fix: 78 chords, 0 missing; case 3b: 0 rows naming a key HELP.md lacks.
- Spec 2 (facts dropped with no row): fixed. HELP.md now states the `$((...))` arithmetic with `eval` and `sh -c`, the private-folder root that lists no name, the `search.timeout_s` limit of the name listing, the moved Views catalogue opening on its own page, and the `{0}` and `{1}` of `text/findings.yml`.
- Proof 1 (the ledger listed as dropped sentences HELP.md states, and its locator was not given): closed by this record; the builder's report is a record and is not rewritten. Rows `window.md:21.6`, `:21.7`, `:21.9`, `:21.10`, `:39.2`, `files-and-search.md:91.4`, `views.md:125.7` (first half) and `debugging.md:47.3` are stated in HELP.md; the reviewer's judgement of each `OBS`, `R` and `HIST` row above is the ruling on them.
- Standards 1 (`DESIGN.md:146`): fixed; the refusal words are named as `SubmitReason` of `src/lib/server/machine/hpc/submit.ts`. The pointers at `DESIGN.md:554`, `:565` and `:568` that leaned on cut text are removed, and `:533` says what a reader does with the view is in the section.
- Standards 2 (the two view comments): fixed; `Help.svelte` names the hub's layer as where `docs:` is set, and `Doc.svelte` says a document of oculus's own that holds a diagram comes back cut at its diagrams.
- Standards 3 (`docs/DATA-MAP.md:243`): fixed; the line says `tools/present/build.py` reads the file and the Present view does not.
