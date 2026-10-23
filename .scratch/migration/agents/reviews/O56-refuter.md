# Step O56 refuter report (on .agents/worktrees/migration-O56, base 892189d7)

A page this report cites (the rules file, a standard, a skill's text) is named with its section, never with a line number, since a page's lines move and a section's name does not. A finding in code keeps its `file:line`.

The report is written in the rules file's character set. A character outside it in a quoted line is written by its name in angle brackets, such as `<tab>` or `<em dash>`.

## Verification (rerun by the reviewer)

```
# Brief verify 2, run twice, from the worktree root, over the 30 changed paths (the 26 changed source, config and doc files, the three test files and the deleted literature-home.test.ts):
$ npm run test:quick -- config/text/app.yml ... tests/state/feeds/literature-home.test.ts
  first run (output tail):
  Error: [vitest-pool]: Failed to start forks worker for test files /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O56/tests/ui/html.dom.test.ts.
  Caused by: Error: [vitest-pool-runner]: Timeout waiting for worker to respond
   Test Files  73 passed | 37 skipped (110)
        Tests  814 passed | 436 skipped (1250)
       Errors  1 error
  ok      vitest checks (316.9 s): Duration  270.65s (transform 248.46s, setup 0ms, import 641.08s, tests 293.74s, environment 2ms)
  ok      vitest slow (367.2 s): Duration  323.25s (transform 73.28s, setup 0ms, import 426.65s, tests 843.73s, environment 11ms)
  test:quick: 447.1 s; failed: vitest
  (tests/ui/html.dom.test.ts is no file the step changes or reaches by name; a worker that did not start under load, not counted, per the rules file's "Verify before you report". The run's prettier, eslint and svelte-check lines were cut by the tail, so the list was run once more with its output kept.)
  second run, exit 0:
  test:quick: 30 changed file(s), from the given paths
  test:quick: 117 test file(s)
  ok      ASCII gate (2.0 s)
  ok      prettier (2.0 s): All matched files use Prettier code style!
  ok      svelte-kit sync (6.1 s)
  ok      eslint (67.2 s)
  ok      svelte-check (94.1 s): 1792748435070 COMPLETED 537 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
  ok      vitest checks (220.5 s): Duration  209.88s (transform 134.03s, setup 0ms, import 514.44s, tests 213.75s, environment 2ms)
  ok      vitest (233.7 s): Duration  224.39s (transform 356.72s, setup 0ms, import 530.30s, tests 190.44s, environment 44.90s)
  ok      vitest slow (352.2 s): Duration  342.92s (transform 27.96s, setup 0ms, import 582.50s, tests 751.66s, environment 11ms)
  test:quick: 358.4 s; every command passed
  (chosen and run among them: hub-writes, new-entry, entry-add, writes, writes-collection, feeds, literature, hub-routing, hub-undo, held-unsaved (G28), app-setting (G77), changes, order (G17), boundaries)

# Brief verify 3, the ASCII gate of spec.md over the 40 changed and new files (the report and the diagrams included):
$ LC_ALL=C perl -ne '...' $(cat files.txt)
  (nothing printed), exit 0

# Brief verify 4:
$ wc -l <changed files>
  Palette.svelte 519, CommandRows.svelte 269, LeadCard.svelte 317, NewIdeaForm.svelte 182, SaveToLiterature.svelte 118;
  writes.svelte.ts 868, hub-writes.test.ts 841, writes.ts 804, selectors.svelte.ts 747, bodies.ts 706, shapes.ts 514,
  hubs.ts (writes) 291, new-entry.test.ts 237, entry-add.ts 188, feed-route.ts 181, mode-lists.svelte.ts 147, new-entry.ts 136,
  saved.ts 81, task-hub-list.svelte.ts 76, lead-apply.ts 65, hubs.test.ts 57, state/shared/page/hubs.ts 40
$ ls <folder> | wc -l
  src/lib/shell/keys/lists 10, tests/state/shared 1, tests/state 9, src/lib/state/shared/page 4

# Brief verify 5:
$ sh utils/unused-exports.sh > scratchpad/unused.txt; diff .agents/worktrees/migration-O56-base/unused-exports.txt scratchpad/unused.txt
  script exit 0; diff printed nothing, exit 0

# Brief verify 6:
$ grep -rn "literatureHome\|homeCollection" src tests
  (nothing), exit 1
$ grep -rn "primary()" src/lib/views/shared/card/feed src/lib/views/shared/forms src/lib/shell/keys/rows
  lead-apply.ts:27, lead-apply.ts:43, SaveToLiterature.svelte:44, NewIdeaForm.svelte:51, NewIdeaForm.svelte:65,
  entry-add.ts:52, entry/edit/page-file.ts:19, registry/registry-file.svelte.ts:56,62,64, CommandRows.svelte:122
  (each read: the primary passed for the order, the primary's folder or file path, or a file that makes no record)

# Brief verify 7:
$ diff migration-O56-base/tests/state/forms/new-entry.test.ts migration-O56/tests/state/forms/new-entry.test.ts
  the head comment; entry(key, root?) -> entry(key, root); tasks(keys, root?) -> tasks(keys, root = 'research'); the helper addedTo added;
  the two rows of 'the hub a task is added to' rewritten to toEqual({ root, key }) with two rows added; the row
  'is none when the primary hub holds no tasks collection' -> 'is none for a hub chosen that holds no tasks collection'
  (matches the report's verify 7 list row for row)
$ diff migration-O56-base/tests/routes/hubs/hub-writes.test.ts migration-O56/tests/routes/hubs/hub-writes.test.ts | grep '^<'
  (nothing), exit 1: additions only

# Brief verify 8, the history-word grep of the added lines and the two new files:
$ (git diff 892189d7 -- src tests config docs/... | grep '^+'; sed 's/^/+/' <new files>) | grep -n -i -E "\bbefore\b|used to|no longer|\bstill\b|..."
  CommandRows comment "refused before any hub is asked", selectors "None before the config's first message",
  new-entry.ts "what Add Task says before it asks the hub": run-time order, accepted;
  hub-writes.test.ts `const before` (4 lines): a variable, not a comment or title. Same hits as the report.

# Commands the report quotes, rerun in the same form:
$ npx vitest run tests/state/shared/hubs.test.ts                  ->  Tests  7 passed (7)
$ npx vitest run tests/state/forms/new-entry.test.ts              ->  Tests  20 passed (20)
$ npx vitest run tests/views/shared/forms/entry-add.test.ts       ->  Tests  8 passed (8)
$ npx vitest run tests/routes/hubs/hub-writes.test.ts             ->  Tests  44 passed (44)
$ npx vitest run tests/checks/tree/boundaries.test.ts --testTimeout 0                          ->  Tests  11 passed (11)
$ npx vitest run tests/data/hubs/hub-portfolio.test.ts --tagsFilter slow --testTimeout 20000   ->  Tests  16 passed (16)
  (The report's "entry-add.test.ts (13 passed, C1)" on the unchanged tree is the joint count of entry-add's 8 and
  literature-home's 5; the file is unchanged by the step; no decision rests on the figure.)
```

## Verdicts

Items of the brief's "What to build", in its numbering:

- 1: holds. `src/lib/state/shared/page/hubs.ts:32-40` `hubsTaking(holders, primary)` takes plain values (G17 order test green); `entry-add.ts:52` `hubChoices` reads it, its order the same as the base's stable sort; `literatureHome` and `homeCollection` are gone (verify 6 grep exit 1); `literature-home.test.ts` deleted and `tests/state/shared/hubs.test.ts` in its place (7 passed).
- 2: holds. `NewIdeaForm.svelte:46-52` the hubs, `:115` the field only with more than one, label `board.new_idea_hub` (the brief's second option, lower case as the board's other labels); `:63-66` `startFolder`; `:78-82` `choose` resets Folder and clears a Domain; `:97-101` no `folder` when empty, `root` sent; `:104-105` `answerWords` and close only with nothing refused (on the base the form said `editor.saved` and closed on an `idea_no_folder` refusal, since `ideaRefusal`, `manifest.ts:523-525`, answers ok with `refused`); `selectors.svelte.ts:326-331` the chosen hub's registry; `bodies.ts:457`, `writes.ts:687`, `hubs.ts:170-181` `rootedHome`. The widening: `writes.ts:579` and `feed-route.ts:136` move the two existing copies of the same refusal onto `rootedHome`; by reading the behaviour is identical (status 404, key `server.workspace.no_hub_named`, the same `into.config.text`, `refused()` at `feed-route.ts:58-60` is `json({ error }, { status })`, the same `noHub` fallback), the report names both places with the reason as the rules file's "Where you work" asks, a third copy would break the rules file's DRY principle, and G8's rows over both (hub-writes, writes, feeds, literature) are green in test:quick. No finding. `root: ''`: `z.string().optional()` admits it, `hubTarget` (`hubs.ts:99-104`) finds no hub keyed `''`, so the write is refused 404 with "The workspace has no hub named " and nothing after it, the same as `new-entry` and `literature-save` on the base; the page never sends it (`NewIdeaForm.svelte:101`); the report states it, as the rules file asks for an introduced key. No finding.
- 3: violated, Spec 1 (the focus after a pick that saves). The rest holds: `SaveToLiterature.svelte:44-53` In Literature over every hub's Literature, `:79-88` a `Menu` from `ui/menu/Menu.svelte` with the hubs by name, `:89-95` one hub saves at once; new key `literature.save_hub_tip` is the menu's word the brief's path list names.
- 4: holds. `new-entry.ts:118-129` `addTask(..., hub?)`; `task-hub-list.svelte.ts` the second list, `Palette.svelte:303-307` selects its first row; `CommandRows.svelte:109-111,232-243`; `task_add_collection` reworded as item 4 asks; new keys `app.palette.kind_hub` and `app.palette.task_hub_title` are the palette list's words; G8 rows at `new-entry.test.ts:102-141`. `taskHubOrder` (`new-entry.ts:97-99`) only forwards to `hubsTaking`; it exists because the shell's row in `tests/checks/tree/boundaries.test.ts` names `state/forms/new-entry` and not `state/shared/page/hubs` (the row is a list of modules, read at `boundaries.test.ts:160-170`); no finding.
- 5: holds. `lead-apply.ts:26-28` `applyHubs`, `:42-49` the chosen hub's collection, its file (`viewSourceFile` for the primary, `fileUnder(held.file, ...)` otherwise) and its schema; `LeadCard.svelte:163-179` a `Menu` with more than one hub, else the ToolButton; new keys `leads.action.applied_hub_tip` (the menu's word) and `leads.action.no_applications` (see Behaviour 1).
- 6: holds. `docs/HELP.md:97,286,303,305`, `docs/apps.md:426`, `docs/data-map.md:214`, the head of `routedRoot` at `hubs.ts:154-159`, the head comments of each changed file; `docs/palette.md:119,200` and `write-files.ts:5-18` read and still true; diagrams regenerated (not rerun, see Declined).
- 7: holds. `hub-writes.test.ts:625-667` the three `new-idea` rows, `hubs.test.ts` the seven-row table with the project variant, `new-entry.test.ts` the `addTask` rows; every new or changed row's failure on the unchanged tree is quoted in the report, and each quoted failure agrees with a read of the base code (no `hubsTaking` export; the base `addTask` ignores a seventh argument; the base `newIdeaShape` strips `root`, so the write answers 200 with `hub:new-idea`). G8's Code line still names `saved.ts` (`literatureHome`) and its Test line `literature-home.test.ts`: the orchestrator's at landing, with the new rows.

Cases of the brief's "Cases":

- C1: met, `entry-add.test.ts` 8 passed; `hubsTaking` gives the order the base's sort gave (hubs.test.ts row 1).
- C2: met by the code and the server row (`NewIdeaForm.svelte:46-52,97-101,115-122`; hub-writes "writes the project into the hub its root names, and no byte of the primary (G8)"); the screen is the orchestrator's look.
- C3: met, `NewIdeaForm.svelte:115` draws no field for one hub; the write names that hub (`:101`).
- C4: met, `selectors.svelte.ts:326-331` reads `hubVocabs().lists[hub].domains`, `NewIdeaForm.svelte:74`.
- C5: met, hub-writes "refuses a new project for a hub no workspace folder carries, and writes nothing (G8)", 404 and no file, no change record.
- C6: met by the code (`SaveToLiterature.svelte:79-88`, the pick passes the hub to `saveLiterature`); the screen is the orchestrator's look.
- C7: met, `SaveToLiterature.svelte:46-53` reads every hub's Literature.
- C8: met, one hub gives the ToolButton saving to `hubs.at(0)` (`:89-95`); hubs.test.ts row "the others, when the primary does not hold the collection".
- C9: met by the code and `new-entry.test.ts` row "is the hub chosen, the primary not"; the screen is the orchestrator's look.
- C9b: met, row "is the one hub holding tasks when the primary holds none" and the row "no tasks collection" (`new-entry.test.ts:209`) with the reworded words.
- C10: met by the code (`LeadCard.svelte:163-172`, `lead-apply.ts:42-49`); the screen is the orchestrator's look.
- C10b: met by reading, `lead-apply.ts:46-49`: `lab` not the primary, or no primary, takes `fileUnder(held.file, roots, primary)`, which names an absolute file under its root (`hub-names.ts:153-168`).
- C11: met, `hubsTaking` with no primary keeps the given order (hubs.test.ts row 3); the form chooses `hubs.at(0)` (`NewIdeaForm.svelte:56`), the palette selects its first row.
- C12: partial, the focus after a pick that saves or applies does not stay on the button (Spec 1). Escape on either menu closes it with the focus on the button (`Menu.svelte:14-16`) and writes nothing; the arrows and Enter are bits-ui's (`MenuList.svelte`); Escape on the palette's hub list closes the palette with nothing written.
- C12b: met, `NewIdeaForm.svelte:78-82`.
- C12c: met, `NewIdeaForm.svelte:97-105` sends no folder for an empty Folder and says the `idea_no_folder` refusal (`manifest.ts:626-629`) and stays open.
- C12d: met by reading, `CommandRows.svelte:110` keeps the press's Shift in `asked.open`, `:239` passes `asked.open || shifted`, and `shifted` is set on every key down and up (`:204-205`).
- C13: met, `rootedHome` serves `new-entry`, `new-idea` and `literature-save`; the form says the error through `answerWords`, the card through `refusalWords`; the apply control's file open is unchanged in reaching the file route. See Proof 1 for the words a chosen hub that left gives in Add Task and the apply control.

## 1. Spec

- `src/lib/views/shared/card/feed/SaveToLiterature.svelte:70-88`: "{#if saved} <ToolButton label={t('literature.in_literature')} ... disabled ... /> {:else if hubs.length > 1} <Menu ... onpick={(hub: string) => void save(hub)} />"; what is wrong: the report's first line says "Everything in the brief is done", while item 3 and C12 ask that after Enter saves to the hub chosen "the focus returns to the button", and the report itself says this holds for Escape only. `Menu.svelte` gives the focus back to its opener before `onpick` runs; once the save lands, `saved` turns true, the `{#if}` swaps the Menu for a different element, the `disabled` In Literature ToolButton, which cannot take the focus, so the focus falls to the document. The same holds for the apply menu, which `LeadCard.svelte:162` stops drawing once the lead reads applied. A fix inside the brief's paths exists: ToolButton has a `waiting` look that stays in the focus order with `aria-disabled` (`ToolButton.svelte:27,100-102`), so In Literature drawn that way and given the focus once the save lands keeps the keyboard on the card; the report names the gap as a sharp edge and hands it to the look rather than fixing it; failure scenario: a keyboard reader on a Lit Watch card in a workspace of two hubs presses Save, picks `lab` with Enter; the paper is saved, the button becomes In Literature, and the focus is on the page's body, so the next Tab starts from the top of the page; verdict: item 3 violated, C12 partial.

## 2. Proof

- `tests/state/forms/new-entry.test.ts:138-141`: "it('is none for a hub chosen that holds no tasks collection', async () => { expect(await addedTo([other, own], 'research', 'nowhere')).toBe( t('app.palette.task_add_collection')"; what is wrong: the row asserts, as the expected result, the sentence "No hub of the workspace holds a tasks collection, so no task can be added." (`config/text/app.yml:156`) for an input where two hubs (`research`, `second`) hold one; the sentence is false for the input the row gives. `lead-apply.ts:45` does the same for a picked hub that holds no Applications: "if (held === undefined) return t('leads.action.no_applications');", which says no hub holds an Applications collection; failure scenario: a hub leaves the workspace between the moment the palette draws its hub list (or the apply menu its items) and the press, with another hub still holding the collection; `addTask` (`new-entry.ts:127-129`) or `applyFromLead` says that no hub of the workspace holds the collection, and the reader goes looking for a missing Tasks or Applications file that is there; the live lists make the window short, so the cost is a wrong sentence, and the row fixes it in place as the expected result; verdict: none (C13 is met for the writes it names).

## 3. Standards

- `.scratch/migration/agents/reviews/O56-report.md`, "Verify lines" item 2: "The verify list was started four times. Two runs were stopped before they finished (one for a comment edit, one by the user's pause)"; what is wrong: the rules file's "Token discipline" allows the list once after the last change, and once more after a red line in a changed file is fixed; a start stopped for a comment edit made after it is a run of the list beyond that allowance, which the paragraph names a finding of the review (the run stopped by the pause and the red third run followed by the fourth are allowed); failure scenario: with six steps in flight, each extra start of a list of about 140 s to 360 s loads the machine every other builder's run shares, which is what the paragraph limits; verdict: none.
- `.scratch/migration/agents/reviews/O56-report.md`, "Findings, sharp edges": only `root: ''` is stated; what is wrong: the rules file's "What every package obeys" asks that every id or key a step introduces be checked empty, duplicated and colliding, and every asynchronous path in flight, after close and superseded, with what the code does in each case stated in the report; the report says nothing of the palette row value `task-hub:<hub>` (`task-hub-list.svelte.ts:51`) against the other row values of the palette, nor of a pick on the apply menu while an earlier `applyFromLead` is still placing its entry (`LeadCard.svelte:123-125` has no guard, where `SaveToLiterature.svelte:56` guards with `saving`), nor of `addTaskTitled` answering after the palette closed; failure scenario: the orchestrator reading the report cannot tell whether a second pick on the apply menu, made while the first placement is out, places a second Applications entry, and the look is the only place left to find out; verdict: none.

## 4. Behaviour

- `src/lib/views/shared/card/feed/lead-apply.ts:42-45`: "const held = collectionsOfKey(APPLICATIONS).find((one) => rootOf(one) === hub); if (held === undefined) return t('leads.action.no_applications');"; what is wrong: on the base the apply control opened the path the merged configuration's `collections:` names for `applications` under the primary (`viewSourceFile`, whose default lists it at `.oculus/data/academic/applications.yml`, `config/defaults/sources.yml:41`), whether or not the hub held the file, and drew nothing with no primary (`if (file === null) return '';`); now, with no hub holding Applications, the card says "No hub of the workspace holds an Applications collection, so no application can be opened." The report's judgment calls state the after alone ("The apply control with no hub holding Applications says leads.action.no_applications"), with no before, and its "Cases before and after" has no row for it; failure scenario: the orchestrator at the look, reading the report's before-and-after section, opens a lead in a workspace whose hubs hold no Applications file and has no stated before to compare the new sentence against; verdict: none.

## Declined to judge

- The first run of each new and changed test on the unchanged tree: rerunning it needs the new test files copied into the base copy, a write; judged by reading the base code against each quoted failure, which agree (Verdicts, item 7).
- `npm run format` and `npm run diagrams` (brief verify 2, and the report's "npm run format exited 0 and changed no file outside the step's" and "npm run diagrams changed docs/diagrams/ ..."): both write into the tree, which this review does not do; prettier's check over the changed files is green in the reviewer's test:quick, and whether the committed diagrams match the source is settled at landing by `npm run diagrams` in the gate worktree.
- The report's "the feeds and writes route tests (95 passed in one run)": the files are not named, so the run cannot be repeated in the same form; the files test:quick chose (writes, writes-collection, feeds, literature, hub-routing, hub-undo) are green in the reviewer's run.
- The report's third verify run, red in `boundaries.test.ts` with "shell/keys/lists/task-hub-list.svelte.ts imports state/shared/page/hubs" before the change to `taskHubOrder`: reproducing it needs the earlier code back, which the rules forbid; the shell's row in `boundaries.test.ts` read as a list of named modules is consistent with it.
- On screen, under the configuration block's `look:`: C2, C6, C9 and C10 with two hubs; the arrows, Enter, Escape and the focus of C12 in the Save and apply menus and the palette's hub list; the look of the Save and apply controls as a `MenuOpener` (full-width border and fill, `MenuOpener.svelte:123-139`) beside the ToolButton they replace in a workspace of two hubs; where the focus lands after a pick on the apply menu, where the source tab opened beside may take it (whether that or the button is wanted is the orchestrator's call).
- Whether two picks on the apply menu during one placement place two entries (`placeInFile` with a tab already holding the first entry's unsaved text): not traced, and it is settled by the look or by reading `src/lib/views/shared/forms/entry-file.ts` and `state/sessions/source/place`.
- ADRs: `ls docs/adr` gives "No such file or directory" in the worktree; no ADR governs the diff.

Reviewer usage: a11ec4587720951e0, claude-opus-5-5, 281356 tokens, 71 tool uses, 26 min 1 s.

## Repair round 1, refuted

```
# The round's delta: diff -u of each path of files.txt, snapshot (.agents/worktrees/migration-O56-round-1) against the worktree
$ for f in <files.txt paths>; do diff -u migration-O56-round-1/$f migration-O56/$f; done
  changed in the round: config/text/app.yml, config/text/views/feeds/leads.yml, src/lib/shell/keys/rows/CommandRows.svelte,
  src/lib/state/forms/new-entry.ts, src/lib/views/shared/card/feed/LeadCard.svelte,
  src/lib/views/shared/card/feed/SaveToLiterature.svelte, src/lib/views/shared/card/feed/lead-apply.ts,
  tests/state/forms/new-entry.test.ts
$ git status --short     (in the worktree)
  the same 40 paths as files.txt, no other path; no new-entry-onbase.test.ts; ToolButton.svelte not listed
$ git diff 892189d7 --stat | tail -1
  39 files changed, 1306 insertions(+), 945 deletions(-)

# Brief verify 2 (npm run format and npm run diagrams not run: both write), from the worktree root:
$ npm run test:quick 2>&1 | tail -25
  ok      prettier (7.9 s): All matched files use Prettier code style!
  ok      ASCII gate (8.1 s)
  ok      svelte-kit sync (58.1 s)
  ok      eslint (99.8 s)
  ok      svelte-check (141.0 s): 1792751124752 COMPLETED 537 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
  ok      vitest checks (193.3 s): Duration  164.46s (transform 158.60s, setup 0ms, import 367.97s, tests 256.45s, environment 4ms)
  ok      vitest (209.7 s): Duration  181.62s (transform 335.40s, setup 0ms, import 500.65s, tests 97.50s, environment 94.89s)
  ok      vitest slow (237.7 s): Duration  209.92s (transform 46.67s, setup 0ms, import 271.37s, tests 541.72s, environment 12ms)
  test:quick: 297.7 s; every command passed

# Brief verify 3, the ASCII gate of spec.md over the 39 changed and new paths (diagrams included):
$ ... | xargs env LC_ALL=C perl -ne '...'
  (nothing printed), ascii exit 0

# Brief verify 4:
$ wc -l <changed files, diagrams left out>
  SaveToLiterature.svelte 141, LeadCard.svelte 327, CommandRows.svelte 276, Palette.svelte 519, NewIdeaForm.svelte 182,
  new-entry.ts 143, lead-apply.ts 70, app.yml 321, leads.yml 38, new-entry.test.ts 237, writes.svelte.ts 868,
  hub-writes.test.ts 841, writes.ts 804, selectors.svelte.ts 747, bodies.ts 706, shapes.ts 514, hubs.ts (writes) 291
$ ls <folder> | wc -l
  src/lib/shell/keys/lists 10, tests/state/shared 1, src/lib/state/shared/page 4

# Brief verify 5:
$ diff ../migration-O56-base/unused-exports.txt <(sh utils/unused-exports.sh)
  diff exit 0

# Brief verify 6:
$ grep -rn "literatureHome\|homeCollection" src tests
  exit 1
$ grep -rn "primary()" src/lib/views/shared/card/feed src/lib/views/shared/forms src/lib/shell/keys/rows
  SaveToLiterature.svelte:52, lead-apply.ts:27,43, NewIdeaForm.svelte:51,65, entry-add.ts:52, entry/edit/page-file.ts:19,
  registry/registry-file.svelte.ts:56,62,64, CommandRows.svelte:127 (each the order, the primary's folder or file, or no record made)

# Brief verify 7, the changed test file against the snapshot (the round) and the base:
$ diff ../migration-O56-round-1/tests/state/forms/new-entry.test.ts tests/state/forms/new-entry.test.ts
  138c138  it('is none for a hub chosen that holds no tasks collection', ...)  ->  ..., said by its name', ...)
  140c140  t('app.palette.task_add_collection')  ->  t('app.palette.task_hub_collection', 'nowhere')
  (matches the report's ruling 2 before and after)

# Brief verify 8, history words over the round's added lines:
$ diff -u <snapshot> <worktree> | grep '^+' | grep -i -E "\bbefore\b|used to|no longer|\bstill\b|..."
  CommandRows.svelte "A title that makes no task is refused before any hub is asked." (the rewrapped head, run-time order; accepted)

# Commands the round's report quotes, rerun in the same form:
$ npx vitest run tests/state/forms/new-entry.test.ts      ->  Tests  20 passed (20)
$ grep -rln "lead-apply" tests                           ->  (nothing), exit 1
$ grep -rhoE "`[a-z-]+:\$\{" src/lib/shell/keys src/lib/state/workbench | sort | uniq -c
  app: clone: collection: command: config: database: editor: eslint-config: feed: finding: folder: group: hidden-view:
  interpreter: language-action: language: oculus-page: page: project: symbol: tab: task-hub: task: view: workspace:
  (the report's list leaves out oculus-page:, page: and tab:; none equals task-hub:, so its conclusion holds; no decision rests on the list)
$ git status --short | grep -c diagrams                  ->  10
  The case-run program on the base copy (sed copy into tests/state/forms/, vitest, rm): not rerun, it writes a file.
```

### Verdicts

Items of the brief's "What to build":

- 1: holds. `hubsTaking` in `src/lib/state/shared/page/hubs.ts`, read by every path; verify 6 grep exit 1; `tests/state/shared/hubs.test.ts` in place of the deleted `literature-home.test.ts`; test:quick green. Unchanged by the round.
- 2: holds, as the first report gives it (`NewIdeaForm.svelte`, `newIdeaShape` with `root`, `rootedHome`); unchanged by the round; hub-writes rows green in test:quick.
- 3: holds for what the item's text says: In Literature over every hub's Literature (`SaveToLiterature.svelte:53-60`), the Menu of the hubs (`:101-110`), one hub saves at once (`:111-118`), and the focus is handed to In Literature after a save that landed from the control (`:65-89`, with `Menu.svelte` giving the focus back before `onpick`, `menu-items.ts:155-159`). The way that focus is given carries Findings R1-1 and R1-2, which make C12 partial.
- 4: holds. `addTask(..., hub?)` (`new-entry.ts:118-143`), the palette's hub list, `task_add_collection` for no hub holding tasks and `task_hub_collection` for a chosen hub holding none (`new-entry.ts:131-137`); G8 rows 20 passed.
- 5: holds. `lead-apply.ts:26-28,44-50` and the Menu in `LeadCard.svelte:168-189`; a picked hub holding none says `hub_no_applications`, no hub holding one `no_applications`; a second press or pick while one placement is out does nothing (`LeadCard.svelte:128-136`).
- 6: holds. The head comments of the round's five changed sources state the new behaviour (SaveToLiterature `:10-13`, LeadCard `:11-12`, CommandRows `:22`, `addTask` and `applyFromLead` doc comments); `docs/HELP.md:97,303,305` read again and still true; diagrams 10 files changed as in round 0.
- 7: holds. The changed row `new-entry.test.ts:138-141` asserts the new sentence for its input; its base failure ("text key not in the text catalog ... task_hub_collection") agrees with a read of the base, which has neither the key nor the `hub` argument.

Cases of the brief's "Cases":

- C1: met, `entry-add.ts:52` reads `hubsTaking`; test:quick green.
- C2: met by the code and the hub-writes row; the screen is the look's.
- C3: met, `NewIdeaForm.svelte` draws no Hub field for one hub.
- C4: met, the chosen hub's domains registry.
- C5: met, hub-writes row: 404 `no_hub_named`, nothing written.
- C6: met by the code (`SaveToLiterature.svelte:102-110`, the pick passes the hub to `saveLiterature`); the screen is the look's.
- C7: met, `:53-60` reads every hub's Literature.
- C8: met, one hub gives the ToolButton saving to `hubs.at(0)` (`:111-118`).
- C9: met by the code and the new-entry row "is the hub chosen, the primary not"; the screen is the look's.
- C9b: met, the rows of `new-entry.test.ts` and `task_add_collection` at `new-entry.test.ts:209`.
- C10: met by the code (`LeadCard.svelte:168-178`, `lead-apply.ts:44-63`); the screen is the look's.
- C10b: met by reading, `lead-apply.ts:51-54`.
- C11: met, `hubsTaking` with no primary keeps the workspace's order (hubs.test.ts).
- C12: partial, Findings R1-1 and R1-2. Escape on the Save and apply menus writes nothing and gives the focus back to the opener (`menu-items.ts:155-159`); the arrows and Enter are bits-ui's; Escape on the palette's hub list closes the palette with nothing written. After a pick on the apply menu that places the entry, the focus goes to the Applications tab's editor, as after the base's press (`entry-file.ts:45-60`, `openSourceFile` with a range; `place.ts` leaves `focus` unset and `tab-state.ts:27` defaults it to true; `Editor.svelte:200-214` asks the range command with the focus; `commands.ts:93` `made.focus()`). The builder's reading of the base and of the new menu path is right, so the ruling's second half has no case to act on. One correction to the report's account, on which no decision rests: a placement refused with a line (`entry-file.ts:62`) also opens the tab at that line and the editor takes the focus, so "When nothing is placed ... its opener keeps the focus" holds only for no tab opened. What is missing: that In Literature takes the focus after a save from the Save menu or the one-hub button when the browser still reports the removed opener as the active element (R1-1), and that it takes it without opening its tooltip, as the tree's menus give the focus back (R1-2).
- C12b: met, `NewIdeaForm.svelte` `choose`.
- C12c: met, no `folder` sent for an empty Folder, `idea_no_folder` said in the form.
- C12d: met by reading, `CommandRows.svelte:255` passes `asked.open || shifted`.
- C13: met. `rootedHome` serves the three writes; a chosen hub that has left gives Add Task `task_hub_collection` with its name and the apply control `hub_no_applications`, while another hub holds the collection.

### Findings

- R1-1, spec (the claimed closure of Spec 1 that the read does not reproduce), `src/lib/views/shared/card/feed/SaveToLiterature.svelte:86-87`: "const now = document.activeElement; if (now === null || now === document.body) box?.querySelector('button')?.focus();". What is wrong: the report says "Removing the focused opener leaves the focus on the body, and the effect then gives the focus to In Literature", checked by reading only. The tree's own helper for this question, `focusIsFree` (`src/lib/ui/frame/quiet-focus.ts:24-32`), also counts a control taken off the page as holding nothing, because "A button taken off the page keeps the focus until the browser hands it to the document". `Tabs.svelte:208-215`, `NoticeCentre.svelte:44` and `ActivityRail.svelte:247` use it for exactly this case: the focused control removed by a re-render. The effect runs in the same Svelte flush that removed the opener, leaves that case out, and clears `refocus` before it decides (`:85`). It also hand-writes a check the tree already has, against the rules file's "The principles every package is judged on" (DRY, and "reuse what exists"). Failure scenario: a keyboard reader on a Lit Watch card in a workspace of two hubs picks `lab` with Enter. The save lands and `saved` turns true, so the `{#if}` swaps the opener for In Literature. When the effect runs, `document.activeElement` is still the removed opener, so the condition is false, `refocus` is cleared, and nothing is focused. The browser then hands the focus to the document and the next Tab starts from the top of the page: the defect ruling 1 was sent to close. The fix is `if (focusIsFree())` from `$lib/ui/frame/quiet-focus`, one line inside the brief's paths. Verdict: C12 partial.
- R1-2, standards and behaviour, `src/lib/views/shared/card/feed/SaveToLiterature.svelte:87`: "box?.querySelector('button')?.focus();". What is wrong: the tree gives a focus that is the page's, and not a move of the reader's, through `focusQuietly`, so that the control's tooltip does not open (`quiet-focus.ts:1-4,13-22`; `Menu.svelte:14`: "Escape and a pick close the list and give the focus back to the button without opening its tooltip"). `Tooltip.svelte:142-147` opens the words on any focus that matches `:focus-visible` and is not marked quiet. A plain `.focus()` given just after a keyboard pick is such a focus. The round's report does not state that the tooltip opens. Failure scenario: Enter on `lab` in the Save menu, or Enter on the one-hub Save. The save lands, In Literature takes the focus, and its tooltip "The Literature collection holds this paper" opens below the button (ToolButton's placement `below`, `ToolButton.svelte:64`). It covers the line "Saved as <key>" that the save has just written under the button (`SaveToLiterature.svelte:120-122`, `.save` a column) until the reader moves the focus. The fix is `focusQuietly` in place of `.focus()`, inside the brief's paths. Verdict: C12 partial.
- R1-3, behaviour, `src/lib/views/shared/card/feed/SaveToLiterature.svelte:94-100` and `:112-118`: "waiting" in place of "disabled", and "waiting={saving}" in place of "disabled={saving}". What is wrong: ruling 1 asks for the `waiting` look and the round builds it, but the round's report gives no before-and-after row for what a reader sees change. The rules file's "What every package obeys" needs that row for the look ("Visible includes ... focus and tab stops"). The change reaches every card whose paper a hub holds, not only a card just saved. Before, In Literature was a disabled button, skipped by Tab, with no tooltip on keyboard focus. After, it is a Tab stop on every such card in the Literature search view and on Lit Watch. A screen reader announces it as a dimmed button, Enter and Space do nothing (`ToolButton.svelte:101-103`), and keyboard focus opens its tooltip. The one-hub Save during a save keeps its place in the focus order. With `pointer-events: none` (`ToolButton.svelte:212-215`), the hover reaches the tooltip wrapper, so its tooltip can open while the save is out. Its look is otherwise the same (opacity 0.5 under both `.tool:disabled` and `.tool.waiting`). Failure scenario: the orchestrator at the look Tabs through a Literature search list that holds saved papers, meets one stop per saved card that did not exist before, and has no stated before and after to judge it against. Verdict: none.
- R1-4, behaviour (the `adding` guard), `src/lib/shell/keys/rows/CommandRows.svelte:114-133`: "let adding = false; ... if (adding) return; adding = true; ... ).finally(() => { adding = false; });". What is wrong: the round brief did not ask for this guard. It closes the in-flight case that the rules file's "Every id or key ... every asynchronous path in flight ... and superseded by a later one" asks about, for the hub rows the step adds. It sits in a write-list file and in the function the step rewrote, so it does not reach beyond the finding in substance. A plain `let` is enough, since nothing draws it. But it also changes the title press, which the base had: base `CommandRows.svelte:98-104` has no guard, so a second press of the title while the first write was out sent a second `new-entry` write. The report states only the after ("The press does nothing, so no second new-entry write is sent"). Failure scenario: a reader who presses Enter twice on `:task-add Review` gets one write now and two before. The look has no stated before for whatever the second write said. Verdict: none.
- R1-5, standards, the builder's stated sharp edge, `SaveToLiterature.svelte:68,72,82-89`. What is wrong: the edge is real. `saved` turns true only when the next snapshot holds the paper: `collectionsOfKey` reads `entities.portfolio()` (`selectors.svelte.ts:400-403`), while `settle.added` records a page (`page-entry.ts:331-333`) and not the collection. So `refocus` stays set from the press until that snapshot, and it stays set for the life of the card when an ok save never matches the card's ids under `samePaper`. The rules file's "Nothing left undone" says a miss inside the brief is never listed as a sharp edge, and its working rules say a named risk is fixed or stated prominently. The report states it in its last paragraph, under a first line saying every ruling is done. Failure scenario: a save answers ok but the snapshot's entry does not match the card. Later the reader clicks an empty part of the page (focus on the body), and an edit makes the card's paper match. The effect then moves the focus to that card's In Literature and scrolls the page to it. The harm is narrow, since the effect acts only from the body. A bound that ends it, such as clearing `refocus` at the first change of `held` after an ok answer that leaves `saved` false, is the builder's or the landing's to choose. Verdict: none.
- R1-6, standards, the round's report, "Ruling 2", the case-run program: "sed ... tests/state/forms/new-entry.test.ts > tests/state/forms/new-entry-onbase.test.ts ... rm tests/state/forms/new-entry-onbase.test.ts". What is wrong: the rules file's "What every package obeys" allows a case-run program whose needed file "lives in the scratchpad or the base copy and is gone before the report". This one wrote its copy into the worktree's `tests/state/forms/`. It is gone now (`git status --short` lists no such file), and the result it gave agrees with a read of the base. Failure scenario: while the copy existed, a test:quick or a vitest run in that worktree that selects test files by folder could pick up a file that imports the base copy's `src`, and its result would count against the step. Verdict: none.

### Declined to judge

- Whether Chrome reports the body or the removed opener as `document.activeElement` when the Svelte effect runs (R1-1), and whether the programmatic focus matches `:focus-visible` after a keyboard pick (R1-2). A read cannot settle this, and this review runs no browser. The look on TEST with two hubs settles it, but R1-1's and R1-2's fixes are right whichever way it falls.
- The run of the changed test row on the base copy: rerunning it needs a copy of the test file written into a tree. It was judged by reading the base, which has neither `task_hub_collection` nor the `hub` argument, and that read agrees with the quoted failure.
- What the base's second `new-entry` write answered after a double press of Add Task's title (R1-4): not traced.
- `npm run format` and `npm run diagrams`: both write into the tree. Prettier's check is green in this test:quick. That the committed diagrams match the source is settled at landing.
- On screen, under the configuration block's `look:`: C2, C6, C9 and C10 with two hubs, the focus after a Save pick and after an apply pick, the tooltip of R1-2 and the Tab stops of R1-3.
- ADRs: `ls docs/adr` gives "No such file or directory" (first report); no ADR governs the diff.

Reviewer usage: ab082e1a8e90c900f, claude-opus-5-5, 226623 tokens, 57 tool uses, 14 min 21 s.
