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
