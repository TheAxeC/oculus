# Step O59 brief check (on main at cfa2d965)

`git log -1 --format=%h` prints `cfa2d965`. `git status --short` shows ` M .scratch/migration/orchestrator-state.md`, ` M .scratch/migration/queue.md` and `?? .scratch/migration/agents/briefs/O59.md`. Nothing under `src`, `tests`, `config` or `docs` is changed.

## 1. Names

Commands:
- `grep -rn "closes_deadline\|closesDeadline" src tests config docs README.md utils --exclude=local.yml` prints nothing (exit 1). Both new names are free.
- `grep -rn "\bterminal(" src` (the function `terminal`).
- `grep -rn "'terminal'" src` (the flag read by name).
- `grep -rn '`terminal`\|"terminal"\|terminal flag\|terminal chip\|terminal entr\|terminal status\|status is terminal\|is terminal\|are terminal\|terminal project\|terminal type' src tests config docs README.md utils --exclude=local.yml`
- `grep -rn "terminal" ... | grep -i "status\|flag\|vocab\|deadline\|radar\|ticker\|chip\|statuses\|wordFlag\|types"` over the same trees, leaving out the four files the brief writes.
- `grep -rn "terminal: *true\|terminal: *false..." ...` outside `vocab.yml` prints nothing.
- `grep -rlw -i terminal` counts: src 259 files, tests 62, config 29, docs 6, README.md 6 lines. In utils the hits are `scratch-count.sh:10` and `claude-usage.sh:3`.

Hits outside "Paths this step writes" that name the status flag or its reader:
- `src/lib/views/boards/focus/rows.ts:13` (head comment): "Another entry's statuses are all left under the pointer: the palette's `terminal` says a status drops off the deadline radar, which is not the same as the status a reader closes it with." The rename makes this false. It is not on the write list and the brief does not mention it. `spec.md` "What every package obeys" (line 70) makes "a head comment that the change makes false" a defect of the change. The step's line says "in the documents", and the brief reads that as the comments and descriptions (brief line 18), so this comment falls under the step's line. Fixing it in the brief still adds a path (`src/lib/views/boards/focus/rows.ts`, lines 9-14). **Widens the step's paths. For Axel to decide.**

The function `terminal` of `focus.ts` has no callers outside the write list. `grep -rn "boards/focus['.]" src` lists the importers of `focus.ts`: `rail-badges.svelte.ts:34` (`focusWords`), `focus-lanes.ts:17`, `selectors.svelte.ts:51` (`movable`), `card.ts:6` (`pausesCountdown`), `ticker.ts:49` and `task-card.ts:10`. Only the last two import `terminal`.

Hits that are about something else, by group:
- **The type flag `terminal` of `types` (stays):**
  - `src/lib/server/content/audit/rules.ts:37` and `:192`
  - `src/lib/server/content/audit/projects.ts:388` (`terminalTypes`)
  - `config/text/views/system/audit.yml:61-62` (`msg_terminal_live`, `msg_terminal_live_one`)
  - `vocab.yml:52`, `:62-74` and `:241`
  - `vocab.ts:111` and `:215`
- **The Terminal view and terminal sessions:**
  - `src/lib/shell/window/menu-answer.ts:96-99` (`page.terminal(...)`, a hit of `\bterminal(`)
  - `src/lib/state/sources/repositories/review-comment.ts:104` (`deps.terminal()`, a hit of `\bterminal(`)
  - in src: the `'terminal'` literals in `apps/tools/routes.ts`, `run/tasks.ts`, `streams.ts`, `runner/streams.mjs`, `terminals.mjs`, `tasks.mjs`, `runs/schedules/*`, `terminal-tabs.ts:25`, `row-menu.ts:82`, `Terminal.svelte`, `repo-menu.ts`, `RepoList.svelte`, `tools.svelte.ts:55` and `Pane.svelte:44`
  - the other 62 test files
  - `config/defaults/layout.yml:60`, `config/catalogs/icons.yml`, `config/catalogs/glyphs.yml:110` and the `config/text` session and LaTeX catalogs
  - `docs/HELP.md`, `docs/apps.md`, `docs/palette.md:44` and `docs/diagrams/channels.*`
  - `README.md` (6 lines)
  - `utils/scratch-count.sh:10` and `utils/claude-usage.sh:3`
- **The `terminal:` settings block and its Settings heading:**
  - `src/lib/data/sources/config/catalogs.ts:36,59`
  - `src/lib/data/shapes/catalog-words.ts:34`
  - `src/lib/state/shared/words/appearance.ts:88,271`
  - `src/lib/state/system/config/groups.ts:128`
  - `config/defaults/appearance.yml`, `config/options/appearance.yml` and `config/options/behavior.yml:185`
  - `tests/checks/config/config-folder.test.ts:141`
  - `docs/HELP.md:511` and `docs/templates.md:297`
  - the hub's workspace file `research-hub.yml:22`
- **The terminal themes (`rice`):**
  - `src/lib/ui/controls/Chip.svelte:54,166,186`, `Tag.svelte:83`, `Pane.svelte:246` and `theme.ts:90`
  - `config/catalogs/glyphs.yml:1`, `icons.yml:3` and `config/text/views/system/workbench.yml:14,20`
  - `config-folder.test.ts:463`
- **The ordinary word:** `config/catalogs/unimath.yml:2328` ("terminal sigma").

## 2. The step line

`plan.md:678`: "the status flag `terminal` becomes `closes_deadline` in the vocabulary, in every reader of it and in the documents; the type flag keeps `terminal` (ruling 216)".

- **"becomes `closes_deadline` in the vocabulary":** item 1 (the 25 rows of `vocab.yml` and line 81) and item 2 (the shape key on `statusWord`).
- **"in every reader of it":** item 3 (`focus.ts`, where the reader reads `'closes_deadline'`) and item 4 (the imports and calls in `ticker.ts` and `task-card.ts`).
- **"in the documents":** served in part:
  - item 1 (`vocab.yml:81-83`), item 2 (`vocab.ts:46-52`), item 3 (the doc comments at `focus.ts:76` and `:108-113`) and item 4 (`task-card.ts:5`);
  - no requirement covers `src/lib/views/boards/focus/rows.ts:13`, which names the flag (section 1).
  - No page under `docs/` or `README.md` names the flag (section 3), so that part has nothing more to serve.
- **"the type flag keeps `terminal`":** the last sentences of items 1 and 2, brief line 37, and C5.
- **"(ruling 216)":** the source of items 1 and 2.
- **Parts of the brief with no part of the step's line:**
  - Item 5 (`docs/diagrams/` regenerated).
  - The function's new name `closesDeadline` in item 3. The step's line asks for the flag to change in every reader, not for the reader function to be renamed; that comes from the brief's Decision 1.

## 3. Premises

Each command of "What is on the tree" was rerun.

- **Step line and ruling 216** (`grep -n '^- O59 '`, `grep -n 'Open item 216'`): `plan.md:678` and `:2415` match the quotes word for word. Holds.
- **`grep -n "^types:\|^statuses:\|^focus_lanes:" config/catalogs/vocab.yml`** prints `60:types:`, `97:statuses:` and `175:focus_lanes:`. Holds.
- **The awk count of status rows** prints `25`. `grep -n terminal` shows them at 101, 102, 111, 124, 146-164 and 166-167, and the 8 type rows at 62 and 67-74. Holds.
- **`vocab.yml:81-83`, `:52` and `:241`:** the text is as quoted. Holds.
- **`vocab.ts`:** `statusWord = z.strictObject` at line 34, `terminal: flag(` at 45-47, "a terminal chip" at 49, "A terminal entry" at 52, the type flag at 111 and the `lifecycle` help at 215. Holds.
- **The reader:** `focus.ts:77-79` reads `statusFlag(config, status, 'terminal')`. `grep -rn "\bterminal(" src` gives the callers at `ticker.ts:221, 249, 351, 369, 406, 427` (imported at `:45`) and at `task-card.ts:29` (imported at `:10`). The same grep also prints `menu-answer.ts:96-99` and `review-comment.ts:104`, which are not the reader and which the brief does not mention. `focus.ts:110-112` and `task-card.ts:5` read as quoted. Holds.
- **`rules.ts:192` and `audit.yml:61-62`:** as quoted. Holds.
- **No hub or fixture sets the flag:** `grep -rln "terminal: true" ~/workspace/research-hub/.oculus --exclude=local.yml` and `grep -rln "terminal: true" tests/fixtures` each exit 1 with no output. The research hub's `.oculus/config.yml` has no `statuses:`. The other folders of the workspace file (cathedra, game-engine, ordo, scotoma, officium, youtube-downloader, theaxec.github.io) hold no `terminal: true` and no `statuses:` under `.oculus` (`grep -rln ... --exclude=local.yml`, empty output). Holds.
- **The documents:** `grep -rn "terminal" docs/*.md README.md`. Every hit is about the Terminal view, terminals or the `terminal:` block (section 1). `docs/HELP.md:282` names `live_subtasks` and `deadline_met` and never the flag. `docs/templates.md:133-139` shows `on-hold: { ..., blocked: true }`. `docs/HELP.md:506` describes flags in general and names no flag `terminal`. The conclusion "so the documents the step's line names are the comments and descriptions above" does not hold: `src/lib/views/boards/focus/rows.ts:13` is another such comment (section 1).
- **The new name is free:** `grep -rn "closes_deadline\|closesDeadline" src tests config docs` prints nothing. Holds.
- **`config-folder.test.ts:141`:** `'terminal'` sits in the `defaults/appearance.yml` key list. Holds.
- **Tests that reach the changed files:** partly wrong.
  - `grep -rl` with the full paths (`state/boards/focus`, `state/boards/ticker`, `shapes/catalog-files/vocab`, `views/shared/forms/entry/task-card`) finds no test file.
  - `catalogs/vocab` is found in `config-folder.test.ts`, `references.test.ts`, `rename.test.ts` and `tests/data/snapshot/reference-hub.ts`.
  - `config-folder.test.ts` "names `boards/focus`" only as `views/boards/focus.yml` (`:264`). `boundaries.test.ts` names only `views/boards/focus/` (`:347-773`). Neither names `state/boards/focus.ts`.
  - `references.test.ts` and `rename.test.ts` read `catalogs/vocab.yml` as a synthetic file planted by `reference-hub.ts:186-196`, which holds only `palette:` and `types:`. They do not read the shipped `vocab.yml` and do not reach the change.
  - The tests that do reach it: `config-folder.test.ts`, at `:317` ("merges without a finding"), `:618` (every config file through its schema) and `:658-692` (the count of 38 flags, 17 of them status flags).
  - "No test imports `state/boards/ticker.ts`, `catalog-files/vocab.ts` or `task-card.ts`" holds.
- **`agents/guarded.md`:** `grep -n` of each path prints nothing. Holds.
- **The base copy:** `ls .agents/worktrees/migration-O59-base/` gives "No such file or directory", and `.agents/worktrees/` is empty. The base copy and its `unused-exports.txt` do not exist on the tree yet.
- **"The configuration lists one standards page"** (brief line 5): `orchestrator-state.md:11` and `.agents/plan.yaml` hold `standards: [.scratch/migration/agents/spec.md]`. Holds. `ls docs/adr docs/glossary.md` gives "No such file or directory" for both. Holds.
- **Brief line 35, the key checks:** no flag of `statusWord` or `typeWord` is named `closes_deadline` (`grep -rn closes_deadline`, empty), and `hub-layer.ts:21-22` documents that a key given twice fails to parse. Holds.
- **Item 5's reason** ("since its files name imported functions"): false.
  - `grep -c "entriesOf\|focusLabel\|wordFlag\|anyWord" docs/diagrams/*.dot` prints 0 for all nine files.
  - The layer diagrams draw folders with import counts (`layer-state.dot`: `"folder state/client to folder state/boards" [label="4", ...]`).
  - The rename does not change any import count, so `npm run diagrams` should write no change (a judgment, not run).

## 4. Cases and checks

Inconsistent with `spec.md`:
- **Verify 3** gives the ASCII gate as `LC_ALL=C grep -n '[^ -~]' ...`. `spec.md` line 101 (the ASCII gate paragraph) says the perl form "replaces the `grep '[^ -~]'` form wherever a brief or a check names it". The grep form prints nothing on main over these five files (run above), so it is not red today. It still breaks the rule.
- **Verify 1** runs `tests/data/snapshot/references.test.ts`, `tests/data/snapshot/rename.test.ts` and `tests/checks/tree/boundaries.test.ts`. The first two read a planted synthetic `vocab.yml` (section 3), so they do not cover the change. `spec.md` "Token discipline" says to run "only the test files that cover what you are changing". `boundaries.test.ts` checks the imports of the whole tree, so it does reach the changed import lines.
- **Verify 5** compares with the base copy's `unused-exports.txt`, which does not exist yet (section 3).
- **Report part, brief line 124:** see section 8.

Cases with a wrong citation:
- **C2** places an Applications entry at `ticker.ts:221` and `:249`. `ticker.ts:218-221` is the loop over `snapshot.entities.funding` (funding schemes). An Applications entry passes only through `:249`, the loop over `ticker_sources`, where `applications` is a row of `config/defaults/behavior.yml:59` and is not in `OWN_LOOPS` (`ticker.ts:106`).

Cases and report parts that ask the builder to check or quote a place the step does not change:
- **C5:** `src/lib/server/content/audit/rules.ts:192`.
- **C6:** `src/lib/data/sources/config/merge/hub-layer.ts:17-24` and `:76-85`. C6 also has a gap: `hub-layer.ts:87-92` applies every listed value whatever `shapeIssues` reported, so a hub's `terminal: true` on a status gives a finding and is also applied to the config, where no code reads it. C6's "no code reads or converts it" holds.
- **The report part at brief line 122** asks the builder to mark `docs/HELP.md:282`, which the step does not change. `spec.md` line 70 asks for this list "after changing what code does".

Also noted, not judged as a defect: the write list's `.scratch/migration/agents/reviews/O59-report.md` sits against `spec.md` line 36 ("You never edit anything under `.scratch/`"). 33 briefs in `.scratch/migration/agents/briefs/` name the same report path (`grep -l "agents/reviews/O[0-9]*-report.md" ... | wc -l` prints 33).

Holds against `spec.md`:
- C1, C3, C4, C7 and C8.
- The rule that the step writes no test (`spec.md` line 59; `guarded.md` names none of the files).
- Verify 2 (format, diagrams, the list once).
- Verify 4 (`spec.md` line 70).
- Verify 6 (`spec.md` line 44).
- Verify 7 (`spec.md` line 67).
- Verify 8.

## 5. The question

The goal: the status flag is renamed `closes_deadline` everywhere it is written, declared, read and described, and the type flag stays `terminal`.

- **C1: yes, it could pass.**
  - It counts 25 `closes_deadline: true` and checks where `terminal` remains. It does not check that the 25 are the same rows that carried the flag before.
  - It does not check that line 81 names `closes_deadline`: a line 81 deleted or reworded without the key passes.
  - It reads one file. A file elsewhere that describes the flag (`rows.ts:13`) is not reached.
- **C2: yes.** It is a reading of a call that passes as long as the call compiles. It does not show that the shipped `rejected` row carries the new key, which only C1 and C8 reach.
- **C3 and C4: yes.** Readings of conditions whose shape is unchanged. They hold before the change as well as after, so they show only that the logic was not altered.
- **C5: it checks the opposite direction** (the type flag kept), which it does. It cannot fail for a missing rename.
- **C6: yes.** It is a reading of `hub-layer.ts`, which the step does not change. Its claim about a hub's `terminal:` becomes true only once `vocab.ts:45` changes, and a reading of the cited lines alone could pass without that. It is not checked by a run.
- **C7: yes, for "described".** It finds no reader on the old name. Comments are outside its greps, so `rows.ts:13` and any stale comment pass.
- **C8: no**, for the declaration. With `vocab.yml` renamed and the shape not renamed, `config-folder.test.ts:317` and `:618` give a finding. With both keys declared, `:690` (`toHaveLength(38)`) fails. It does not check comments or readers.
- **The check on the step's line** (Verify 4's `terminal` grep, each hit "carried to the new name or named with why not"): **yes.** The `rows.ts:13` hit lies outside the write list, so the builder can only name it, and every check passes with the comment false.
- **Item 1** (C1, C8): could pass with different rows or a missing line-81 key name (above).
- **Item 2** (C8): could not pass without the declaration renamed. The descriptions at 49 and 52 are checked only by the Verify 4 grep and the Verify 8 reading.
- **Item 3** (C7, C2): could not pass with the reader on `'terminal'`. Its comments are checked only by Verify 4 and Verify 8.
- **Item 4** (C7): could not pass with an old import or call. The `task-card.ts:5` comment is checked only by Verify 4.
- **Item 5:** no check is tied to it, and it serves no part of the goal (section 3).

## 6. Implied inputs

Not stated in "Cases", each with its expected result. Adding any of them as a case is beyond the brief's present cases and is marked **widens the step** where noted.

- **A hub's `.oculus/config.yml` whose `statuses:` gives a word `closes_deadline: true`** (`statuses` is in the hub list, `hub-names.ts:345`). Expected: no finding, and an entry with that status leaves the radar. C6 covers only the old key. A wrong answer would refuse the new key for every hub. Widens the step (a case).
- **A hub's status with `terminal: true`.** Expected: a finding naming the hub's file and `statuses.<word>.terminal`, and the value applied by `hub-layer.ts:87-92` with no reader. That status's entries then stay on the radar. C6 states the finding but not this visible result. Widens the step (a case).
- **A status written with other case or surrounding spaces** (`" Rejected "`). Expected: `closesDeadline` true, since `wordFlag` trims and lowers (`vocab-keys.ts:137`). Unchanged by the rename. Widens the step (a case).
- **An empty status or a word not in the vocabulary** (`task-card.ts:28` passes `''` for an entry with no status). Expected: false, so the entry stays listed and the task keeps Start Agent. Widens the step (a case).
- **`closes_deadline` given on a type row** (shipped or a hub's `types:`). Expected: a finding for an unknown key, since `typeWord` is a `z.strictObject` (`vocab.ts:97`). Widens the step (a case).
- **The editor's schema built from the shape** (hover and completion in `vocab.yml` and a hub's `config.yml`). Expected: it offers `closes_deadline` under `statuses` with its description and `terminal` only under `types`. C8's count test (`config-folder.test.ts:690`) checks the number of flags, not their names. Widens the step (a case).

## 7. ADRs

`.agents/plan.yaml` names no `adr` key. `ls docs/adr` gives "No such file or directory", and `ls docs` lists `apps.md data-map.md diagrams HELP.md palette.md templates.md`. No ADR exists.

## 8. Dictated text

- `grep -n '"Everything in the brief is done"' ...` gives brief line 117, the report's first line "Everything in the brief is done". Holds (`spec.md` "Report").
- `grep -n "'still true' or 'rewritten'"` gives brief line 122. Holds (`spec.md` line 70).
- `grep -n "closes_deadline: true"` gives brief lines 29 and 41, the YAML value `closes_deadline: true` for the 25 rows. Holds (ruling 216).
- `grep -n "closesDeadline"` gives brief lines 31-32 and 73, the identifier `closesDeadline`. Holds: it follows `deadlineMet` for `deadline_met` at `focus.ts:104-105`.
- `grep -n "refused\|workspace file"` gives brief line 124. Breaks `spec.md` "Verify before asserting". The before/after line given for the report reads "a hub or workspace file writes `closes_deadline` for a status that takes an entry off the deadline radar, and `terminal` on a status is refused". Two parts are false on the tree:
  - A workspace file cannot set `statuses`. `statuses` belongs to the hub list (`src/lib/data/helpers/hub-names.ts:345`, file `catalogs/vocab.yml`), and the workspace's `settings:` takes the keys of the defaults files (`docs/HELP.md:511`). `grep -rn statuses config/options/*.yml` shows no option for it.
  - A hub's `terminal` on a status is not refused. It gives a finding, and the value is still applied (`hub-layer.ts:83-92`).

## 9. Sources

- **Items 1 and 2:** "(Step line, ruling 216.)". Sourced.
- **Item 3:** the flag read is sourced to the step's line ("in every reader of it"). The function's new name `closesDeadline` is sourced only to "Decisions 1", the brief's own decision, which is not Axel's words, a ruling or the step's line.
- **Item 4:** "(Step line, 'in every reader of it'.)". Sourced. Its comment requirement (`task-card.ts:5`) falls under "in the documents" rather than the part it cites.
- **Item 5:** sourced to "`spec.md`, Token discipline", which is not Axel's words, a ruling or the step's line, and its stated reason is false (section 3).

## Declined to judge

- Whether the report path under `.scratch/` conflicts with `spec.md` line 36, given that 33 earlier briefs use the same form (section 4).
- Whether `npm run diagrams` writes any change after the rename. I ran no build or diagram command; my judgment that it writes none rests on the import counts being unchanged.
- How O59's write ranges in `config/catalogs/vocab.yml` (76-167) and `vocab.ts` (42-53) merge with the steps in flight that write the same files (O62: `vocab.ts:286` and `archive_order`). That judgment belongs to the orchestrator's `shared_paths`.

Agent usage: a836f5a00ff244775, claude-opus-5-5, 189285 tokens, 66 tool uses, 7 min 13 s.

## Closed

Each finding is closed by a change to `agents/briefs/O59.md`, inside the step's line (ruling Brief check scope: a finding is closed in the brief only when it corrects the brief inside the step's line).

1. Names, `rows.ts:13`: the step's line asks for the flag's new name "in the documents", and this head comment names the flag, so the fix is inside the line. Added the premise, item 5 (rows.ts lines 9-14) and the path `src/lib/views/boards/focus/rows.ts` lines 9-14; `rows.ts:9-14` is in the report's list of comments and in the ASCII gate. The `menu-answer.ts` and `review-comment.ts` hits are named in the premises as not the reader.
2. The step line, item 5 (diagrams) with no part of the line: item 5 removed from "What to build" (the new item 5 is the rows.ts comment); the diagrams premise now says they count imports and that `npm run diagrams` runs before the verify list by `spec.md`; the path reads "`docs/diagrams/`, only where `npm run diagrams` changes it".
3. The step line, the name `closesDeadline` sourced only to Decision 1: item 3 and Decision 1 cite the step's line ("in every reader of it"), the reader being named for the flag it reads.
4. Premises, the documents conclusion: rewritten to name `rows.ts:9-14` among the comments; the `docs/HELP.md:282` sentence removed.
5. Premises, tests that reach the change: rewritten; `references.test.ts` and `rename.test.ts` named as not reaching it; Verify 1 runs `config-folder.test.ts` and `boundaries.test.ts` alone.
6. Premises, the base copy: the premise says it is made at preparation, before the builder starts.
7. Premises, item 5's reason false: closed with finding 2.
8. Cases and checks, Verify 3: the ASCII gate is the perl form of `spec.md`'s last paragraph, over the six files.
9. Cases and checks, Verify 5 before the base copy exists: closed by finding 6.
10. C2's citation: rewritten to `ticker.ts:249`, the loop over `ticker_sources`, and to the shipped `rejected` row; the premise names `behavior.yml:59` and `OWN_LOOPS`.
11. C5 asked about `rules.ts:192`, which the step does not change: C5 reads the type rows of `vocab.yml` and `typeWord` in `vocab.ts`; `rules.ts` removed from "Read".
12. C6 asked about `hub-layer.ts`, and missed that the value is merged: C6 reads the shape after the change and states the finding, the merged value and that the status's entries stay on the radar; the merge's behaviour is a premise.
13. The report part asking to mark `docs/HELP.md:282`: replaced by `rows.ts:9-14`.
14. The question, C1 could pass with other rows or line 81 without the key: C1 now compares the status words carrying `closes_deadline: true` with those carrying `terminal: true` in the base copy, and checks the comment line names `closes_deadline`.
15. The question, C2 to C7: C2 now reads the shipped row too; C3 and C4 are checks that preserved behaviour stays, which is their purpose; C7 and the comments are covered by Verify 4's `terminal` grep across the trees, whose hits are carried or named.
16. Implied inputs: added C6b (a hub's `closes_deadline` gives no finding and takes the entry off the radar), C6c (`closes_deadline` on a type row is a finding) and C6d (the editor's schema offers the new key under a status only), each checking the renamed key the step's line names. Not added: the status written in other case or with spaces, and the empty or unknown status, since the step changes neither and a case checks what the step changes (`templates/brief.md`, Cases).
17. Dictated text, brief line 124 (the before and after): rewritten to what the tree shows; a hub's `.oculus/config.yml` gives `closes_deadline`, and `terminal` on a status there gives a finding and takes no entry off the radar; the workspace file is no longer named. Held line by line after the rewrite: it names only `statuses`, the hub file and the finding, each checked above (`hub-names.ts:345`, `hub-layer.ts:83-92`), and breaks no rule of `spec.md`.
18. Sources, item 4's comment requirement: item 4 cites "in the documents" for it.
19. Declined to judge, the report path under `.scratch/`: unchanged; every brief of the plan names the report there, and the builder writes it in its worktree's copy of the ledger.
