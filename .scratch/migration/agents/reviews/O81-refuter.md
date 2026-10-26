# Step O81 refuter report (on .agents/worktrees/migration-O81, base 335db1c9)

A page this report cites (the rules file, a standard, a skill's text) is named with its section, never with a line number, since a page's lines move and a section's name does not. A finding in code keeps its `file:line`.

## Verification (rerun by the reviewer)

```
$ npm run diagrams && npm run test:quick -- --base 335db1c9     (check 1, once; PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH)
test:quick: 48 changed file(s), from git since 335db1c9
test:quick: 299 test file(s)
ok      prettier (2.0 s): All matched files use Prettier code style!
ok      ASCII gate (2.2 s)
ok      svelte-kit sync (13.7 s)
ok      eslint (69.7 s)
ok      svelte-check (91.7 s): 1793021109820 COMPLETED 545 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest checks (182.7 s): Duration  169.97s (...)
ok      vitest (225.7 s): Duration  213.89s (...)
ok      vitest slow (262.8 s): Duration  250.82s (...)
test:quick: 276.7 s; every command passed
test:quick: not covered: tests that reach no changed file within the import depth,
            the build, the lint of unchanged files
exit 0; `git diff 335db1c9 -- docs/diagrams | md5` before and after the run: 49c6397e7e75753f45dd019e52f12854 both (the committed diagrams match the source)

$ npx vitest run tests/data/sources/config/layers/hub-vocab.test.ts          (check 2, after)
 Test Files  1 passed (1)
      Tests  16 passed (16)
$ npx vitest run tests/checks/config/config-folder.test.ts
 Test Files  1 passed (1)
      Tests  28 passed | 2 skipped (30)
$ npx vitest run tests/state/boards/board/board-rules.test.ts
 Test Files  1 passed (1)
      Tests  104 passed (104)
$ npx vitest run tests/state/boards/board/board-rules.test.ts -t "New project on a board" --reporter=verbose
 ... > New project on a board > is offered on no role's track record board, 'with self named' 1ms
 ... > New project on a board > is offered on no role's track record board, 'with no self' 0ms
 ... > New project on a board > leaves a role's track record board without a project while no self is named 1ms
      Tests  20 passed | 84 skipped (104)

$ npx vitest run --config <scratch>/o81-cases/caserun.config.mts --disableConsoleIntercept <scratch>/o81-cases/after.case.ts   (check 3)
exit 0; 84 `case` lines;  Test Files  1 passed (1) / Tests  1 passed (1)
diff of my run's `case` lines against the report's quoted block (report lines 1031-1114): diff exit 0
afterwards `ls <scratch>/o81-cases`: after.case.ts before.case.ts before.out board-rules-before.out case28.case.ts case28.out caserun.config.mts hub-vocab-before.out (hub28/ and hub29/ removed by the program)
$ ... case28.case.ts (on the changed tree; server reader unchanged)
case 28 collectionListFindings of an entry keyed debug: []
case 28 collectionListFindings of an entry keyed track_record: []
case 28 collectionListFindings of an entry keyed venues: ["config.yml | collections[0].key | the key venues is the id of one of oculus's own views; the collection gets no card-list view"]
saved first-run outputs: `before.out` `case` lines against the report's quote (report lines 581-637): one difference, line 39, which the report abbreviates as "(quoted whole under case 14 above)"; `case28.out` against the report's quote: same; hub-vocab-before.out "Tests  1 passed | 15 skipped (16)"; board-rules-before.out "Tests  17 passed | 84 skipped (101)"

$ sh utils/unused-exports.sh | diff .agents/worktrees/O81-base/unused-exports.txt -        (check 4)
diff exit 0
$ grep -rn "'journal'\|'conference'\|\"journal\"\|\"conference\"" src/lib/state/sources/registries src/lib/views/sources/venues   (check 5)
exit 1 (nothing)
$ grep -rn "roleBoard\|boardOf\|venuesByCategory\|journalsOpen\|conferencesOpen\|venues\.journals\|venues\.conferences\|cards_group" src config tests --exclude=local.yml   (check 6)
src/lib/views/boards/focus/Band.svelte:159:                label={t('focus.cards_group')}
src/lib/views/boards/focus/Band.svelte:160:                name={t('focus.cards_group')}
config/text/views/boards/focus.yml:7:        cards_group: Funding | positions | teaching
$ grep -rln "FoldHead" src        (check 7)
src/lib/views/shared/card/heads/GroupHead.svelte
src/lib/views/boards/focus/CommandCenterView.svelte
src/lib/views/boards/focus/career/CareerPanel.svelte
src/lib/views/boards/focus/Tasks.svelte
$ grep -rn "<details\|<summary" src/lib/views/boards/focus        (check 8)
exit 1 (nothing)
$ grep -rn 'Z10[0-9][0-9]\|ruling 4[0-9][0-9]\|\bO8[0-9]\b' src config docs tests --exclude=local.yml   (check 9)
exit 1 (nothing)
$ LC_ALL=C perl -ne '...spec.md gate...' $(find src tests config -type f ! -name local.yml)   (check 10; bin does not exist)
(nothing)
$ LC_ALL=C grep -n '[^ -~]' .scratch/migration/agents/reviews/O81-report.md
exit 1 (nothing)
$ wc -l (check 11), the largest changed files
395 Lanes.svelte, 480 Projects.svelte, 334 Band.svelte, 203 Venues.svelte, 123 heads/FoldHead.svelte, 89 heads/GroupHead.svelte; 612 presets.ts, 710 focus.ts, 782 data/index.ts, 825 board-rules.test.ts, 837 model/index.ts, 840 keys.test.ts, 877 hub-names.ts
$ node -e (zod probe, z.unknown() against z.unknown().optional() in a looseObject over { key: 'journal' })
z.unknown():            {"success":false, ... "expected": "nonoptional", "path": ["label"] ... ["ribbon"] ...}
z.unknown().optional(): {"success":true,"data":{"key":"journal"}}
```

## Verdicts

Items of the brief's "What to build", in its numbering:

- 1: holds. `src/lib/views/shared/card/heads/GroupHead.svelte:39-56`: a bare `ToolButton` named `focus.fold`/`focus.unfold` with the collapse or expand glyph, the optional `Glyph`, the label in `var(--c-<tone>-txt)` or `--muted-txt` at `--fs-md` (`:61-69`), the count as plain text at `--fs-sm` (`:86-88`); props label, name, open, ontoggle, tone, glyph, count; no state; the head comment names its users and that `FoldHead` heads a box. Its folder `heads/` is required by the folder rule (base `views/shared/card/` held ten items, `ls` of the base copy).
- 2: holds. `Projects.svelte` draws `GroupHead` in the sticky `.heading` with the section title, `open={!folded.has(section.key)}`, `toggleFold`; `FoldHead`'s head comment no longer names the board.
- 3: holds. `Lanes.svelte` `group` snippet and `Band.svelte` use `GroupHead`, `groupFold` keys (`focus.ts:764-766`), `hidden={open ? false : 'until-found'}` with `onbeforematch`; `Focus.svelte` hands `isOpen`/`ontoggle`; muted cluster CSS fades only `.lane-sub`/`.lane-body`; check 8 prints nothing; cases 2 to 5 reproduced.
- 4: holds. Rows in `config/catalogs/vocab.yml:271-276` with their own comment; strict row shape `vocab.ts:471-488`; `UNION_FIELD` `venue_categories: 'key'`; options entry with `fields`, `ribbon` a toggle; `hub-vocab.test.ts` row in the new shape, 16 passed; cases 9, 10, 11, 25 reproduced.
- 5: holds. `venueSections` (`venues.ts:209-231`) with `sectionRowShape` (`.optional()` on `label` and `ribbon`, without which, by the zod probe above, every row lacking `ribbon` would read as no section); `Venues.svelte` one `GroupHead` per section, ribbon by flag, `folded: string[]`; check 5 prints nothing; cases 7, 8, 12, 24 reproduced.
- 6: holds. Ruling 1 built: `BoardRule.record` (`takes.ts:33-38`), `boardRuleOf` gives null, `boardTakes` record branch (`takes.ts:147-152`); `recordPreset` (`presets.ts:530-563`); `RECORD_VIEW` registered by `Projects.svelte`'s `registration`, kept by `registerBoards` (`views.ts:125-126`); `recordRows` opens `track_record` with `{ id, label }`; `items.ts` and `new-project.ts` unchanged; G124 rows pass; cases 14 to 22, 26, 27 reproduced.
- 7: holds. Head comments of every file the item names rewritten (read); `grep -rn "card/FoldHead"` hits only the new paths; no docs line names a changed identifier (`grep` over docs).
- 8: holds. Check 4: diff exit 0.
- 9: violated, Spec 1.

Cases of the brief's "Cases":

- 1: not verifiable here; the markup read gives the chevron, the label in the category tone at `--fs-md`, the count, other last, `folded` kept; the look on landing settles it.
- 2: met, the after run (`cluster:now` false, `cluster:parked`, `cluster:incubate`, `lane:idea`, `band` true); the page on the look.
- 3: met, `foldToggled({ closed: [cluster:now] }, band)` gives `["cluster:now","band"]`.
- 4: met, `career` false, every other key true.
- 5: met, `groupFold(cluster, career)` is `cluster:career`; each fold leaves the other open.
- 6: met by reading (`hidden="until-found"` and `onbeforematch` in `Lanes.svelte` and `Band.svelte`); the find bar on the look.
- 7: met, `["journal: Journals 46","conference: Conferences 27 ribbon","thesis: Theses 2","meeting: Meetings 1"]`.
- 8: met, `[["journal",["j1"]],["meeting",["m1"]],["",["w1","n1"]]]`.
- 9: met, no finding; Conferences with ribbon, Journals, Other 3.
- 10: met, `venue_categories.0 must be a map` on the hub's config.yml; Other 5; form options `[{"id":"journal","label":"journal"}]`.
- 11: met, `venue_categories.0.label must be a text`, `venue_categories.0.ribbon must be true or false`.
- 12: met, `folded: ["thesis"]`; `{ journalsOpen: false }` reads `folded: []`; the reload on the look.
- 13: met under ruling 3, labels Journals, Conferences, Theses, Meetings with the keys as ids.
- 14: met, each role's row lines equal its record board's sections (lead 9/16/10/9, supervisor 4, collaborator 1/2/6/6); the look of one board on landing.
- 15: met, `asthma-geo-tensor` not on the Lead record board.
- 16: met by run (`[true,true]`); the look on landing.
- 17: met, `[44,26,5,44]`, tab state `{"id":"lead","label":"Lead: track record"}` after two board writes.
- 18: met, registration `listed: false`, `group: ""`, no badge or countPart; `offersNewProject` false for every role.
- 19: met, `views: ["projects"]` with the `boards.track_record` finding.
- 20: met, the record view unchanged after both pushes.
- 21: met, `career:role:ghost` opens `track_record` with `{"id":"ghost","label":"Ghost: track record"}`.
- 22: met, `career:funding` opens `funding`.
- 23: not verifiable here; reading shows only the import path of `FoldHead` changed in the three users; the look on landing.
- 24: met, union `[{"key":"journal","label":"Journals"}]`, one section with `a` and `b`.
- 25: met, `venue_categories.2.key` finding; one Journals section with the first row; Other alone keyed `''`.
- 26: met, `trackRecord` null, Lead board 0, role `gone` 0, message "No entries match.".
- 27: met, 0 projects and the `board.record_no_role` message; the look on landing.
- 28: met under ruling 2, `collectionRefusals` gives `view_id` for `debug` and `track_record`, the server's `venues` finding unchanged, `registry.refused()` lists the board finding beside them and keeps the collection findings after a boards push; raised on the page (`+page.svelte:125`, `:169`) through `registry.refuse('collections', ...)`, which keeps each source's findings in its own map entry (`registry.ts:308-312`); the one list of ids is `moduleViewIds()` (`views.ts:197`).
- 29: met by run (options entry with three fields, write `changed`, read back with no finding); the Settings look on landing.

## 1. Spec

- Report "Doc text" item 4: "`docs/HELP.md`, a new line after `:301` (the **Data.** note), for the Venues view: \"- **Venues.** ...\""; what is wrong: `docs/HELP.md:301` is the `- **Data.**` bullet and lines 302-311 are its ten indented sub-bullets (`sed -n 301,312p docs/HELP.md`: "  - Recover opens the dataset's Recover view ...", "  - The plan lists every file ...", ... "  - The log under the plan lists every request ..."), so a line inserted after 301 sits between the Data bullet and its sub-list; the brief's item 9 asks for a Venues sentence where the guide describes the Registries views or after `:217`'s table row. Also, items 1 to 3 give "Current words inside the line" rather than each current line as `grep -n` prints it (the words do occur verbatim: `grep -nF` finds them at `:287`, `:287`, `:292`); failure scenario: the orchestrator applies the text as written at landing, and the Recover, Fetch, Verify, Unpack, Stop and log sub-bullets of the Data view then read as sub-bullets of the Venues note in the user guide; verdict: item 9 violated.
- `src/lib/data/helpers/hub-names.ts:384`, `src/lib/data/model/model-collections.ts`, `src/lib/data/index.ts`, `src/lib/data/sources/collections.ts` (paths outside the brief, each with a reason in the report's Files table): "function readList(value: unknown, words?: ListWords, views?: ReadonlySet<string>): ReadList {"; what is wrong: the reasons hold (ruling 2's place, the size rule), but these four files are also changed by O79, in flight, while the dispatch entry's `shared_paths` names only `board-rules.test.ts` with O79 and the report does not say the step now shares them. `hub-names.ts` is 843 lines at both bases (`diff -q` of the two base copies: same); O79 takes it to 874 (`wc -l .agents/worktrees/migration-O79/...`) and O81 to 877; `model-collections.ts` goes 348 to 408 in O79 and 348 to 396 here; failure scenario: whichever of O79 and O81 lands second carries `hub-names.ts` to about 908 lines, which the size check refuses at 900 (`spec.md`, "What every package obeys", the size rule), and meets overlapping hunks in `model-collections.ts`, so that landing is red until the file is split; verdict: none.

## 2. Proof

none.

## 3. Standards

- `src/lib/state/boards/board/presets.ts:463`: "type VocabOf = (hub?: string) => Record<string, unknown>;"; what is wrong: the same type with the same meaning is exported as `WordsOf` at `src/lib/data/shapes/vocab-keys.ts:27` ("The words the records of the hub `hub` are read under, and the union of every hub's words for none") and is already used by `career.ts`; `spec.md`, "The principles every package is judged on" (grep for a type's name and key call before writing one, and reuse what exists; DRY); the report's reuse grep does not list `VocabOf`; failure scenario: a later change to the words-reader signature is made in one of the two types and the record preset and the track record drift apart without a type error; verdict: none.
- Report, all sections: no table of edits to existing assertions and allow lists; what is wrong: `spec.md`, "What every package obeys", asks for every edit to an existing assertion, allow list or predicate with its before and after, one row per changed line. Two exist: `tests/checks/source/keys.test.ts:187` `{ file: 'lib/data/sources/collections.ts', key: 'one.word' }` to `{ file: 'lib/data/helpers/hub-names.ts', key: 'one.word' }`, and `tests/data/sources/config/layers/hub-vocab.test.ts:194,206` the input `venue_categories: [journal]` and the expected `['journal']` to the row form. Read: the allow entry follows the one computed `findingText` call, which moved from `collections.ts:68` (base) to `hub-names.ts:459`, and `collections.ts` holds no computed call now (`grep -n findingText`), so it is the same exemption moved with its code, not a check made to pass; the hub-vocab row keeps `expect(said(read)).toEqual([])` and asserts the new rows, not a loosening; failure scenario: the orchestrator reads the report for loosened checks and finds no list to read them from; verdict: none.
- Report, "Runs of the verify list and whole-suite commands": "The verify list's check (`npm run diagrams && npm run test:quick -- --base 335db1c9`) ran three times."; what is wrong: `spec.md`, "Token discipline": the list runs once after the last change; a red line in a file the step does not change is rerun alone and the list is not run again for it. Run 1 came before the last change (the two size splits followed it), and run 3 was made for timeouts in seven unchanged files that had passed alone; failure scenario: about 200 to 350 s of suite time and its tokens per extra run, on a machine where several suites run at once; verdict: none.
- Report, "Greps": the history grep pattern lacks `still`, `before`, `always had`, `always has been`, `as before` and `the step adds`, which `spec.md`, "What every package obeys" (no history in comments), names. My grep of the added lines finds "found still draw their margin" (`Band.svelte` CSS comment, `Lanes.svelte` CSS comment), "drawn before the label" (`GroupHead.svelte:30`) and `beforematch`, none of them history; failure scenario: none in this diff, the grep would miss such a word in another; verdict: none.

## 4. Behaviour

- `src/lib/data/model/model-collections.ts` (`HubVocab`), `src/lib/data/index.ts:666`: "list: { file: listFileOf(hub, config), value: config.merged.collections },"; what is wrong: every hub's vocabulary on the `config` channel now carries `list`, the hub's merged `collections:` list as written and the absolute path of the file it was read from. Apps read that channel (`docs/apps.md:423`: "`config` | `{ config, hubs: { primary, lists }, ... }`"), so an app sees a new field. This wire-shape addition (`spec.md`, working rules, no silent design decisions: a wire format) is not among the report's visible changes, its judgment calls or its Doc text; failure scenario: an app author reading the `config` channel finds a `list` field with a server path that the apps guide does not describe, and the orchestrator lands a wire change no one ruled on; verdict: none.

## Declined to judge

- The look cases and the look parts (1, 2, 3, 6, 7, 12, 14, 16, 17, 18, 23, 27, 29: drawn headings, find-in-page, the second press, reload, the Settings and venue form views). The review starts no page; the landing's look on the TEST page settles them.
- The first-run programs `before.case.ts` and the two test runs on the unchanged tree. `before.case.ts` imports `venuesByCategory`, `roleBoard` and the `boardOf` input, which the step removed, so it cannot run on the changed tree, and the base copy has no runnable setup. I compared their saved outputs with the report's quotes instead (verification block above).
- The exact landing order of O79 and O81, and whether `hub-names.ts` is split in O81, in O79 or at the second landing. That is the orchestrator's call; the size arithmetic is in Spec 2.
- Whether the record board's columns, label mode and search should come from the first `boards:` row (judgment call 2, `presets.ts` `recordPreset`). The report names it as a reversible decision, and it is the orchestrator's to keep or reverse.

Reviewer usage: acff93497f9c76629, claude-opus-5-5, 319541 tokens, 89 tool uses, 19 min 1 s.

# Repair round 1, refuted

The round closes all four items of `agents/briefs/O81-round1.md`. Its only code change is the type swap in `presets.ts`, and every claim of the round section that I reran gave the same result. Item 9 now holds, so every item of the brief holds. Every case is met, except those that only the look on landing can show. One minor Standards finding, which needs no change to the step.

## Round delta (what changed since the snapshot `.agents/worktrees/migration-O81-round-1`)

```
$ git status --short  vs  migration-O81-round-1/files.txt
the same 44 tracked paths; the heads/ folder now listed as one untracked directory
(it holds the two files that files.txt lists as untracked); plus the untracked ledger
copies .scratch/migration/agents/briefs/O81-cases.md, O81-round1.md, reviews/O81-report.md
$ cmp of every path of files.txt, snapshot against worktree
CHANGED src/lib/state/boards/board/presets.ts      (no other path differs)
$ cmp heads/FoldHead.svelte, heads/GroupHead.svelte against the snapshot: same, same
$ cmp worktree O81-report.md against the main ledger's copy: report-identical
$ diff -u snapshot presets.ts  worktree presets.ts
-import { vocabKeys } from '../../../data/shapes/vocab-keys.ts';
+import { vocabKeys, type WordsOf } from '../../../data/shapes/vocab-keys.ts';
-/** What gives the words of the records of a hub, and the union of every hub's words for none. */
-type VocabOf = (hub?: string) => Record<string, unknown>;
-function wordsReader(vocab: VocabOf): (hub?: string) => BoardWords {
+function wordsReader(vocab: WordsOf): (hub?: string) => BoardWords {
-    vocab: VocabOf = () => config      (presetFor)
+    vocab: WordsOf = () => config
-    vocab: VocabOf = () => config      (recordPreset)
+    vocab: WordsOf = () => config
```

## Verification (rerun by the reviewer, from the worktree root, PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH)

```
$ git diff 335db1c9 -- docs/diagrams | md5 ; git status --short | md5      (before the list)
49c6397e7e75753f45dd019e52f12854
b2da7a5d1dcbab0221ebc0391de2b76a
$ uptime
15:10  up 3 days,  5:15, 1 user, load averages: 19.64 15.85 14.89
$ npm run diagrams && npm run test:quick -- --base 335db1c9      (once)
test:quick: 49 changed file(s), from git since 335db1c9
test:quick: 299 test file(s)
ok      prettier (2.3 s): All matched files use Prettier code style!
ok      ASCII gate (2.4 s)
ok      svelte-kit sync (4.8 s)
ok      eslint (95.9 s)
ok      svelte-check (131.9 s): 1793023986919 COMPLETED 545 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest checks (235.2 s): Duration  217.55s (transform 168.24s, setup 0ms, import 439.07s, tests 401.70s, environment 4ms)
ok      vitest (317.9 s): Duration  301.86s (transform 397.49s, setup 0ms, import 622.92s, tests 468.29s, environment 69.05s)
FAILED  vitest slow (352.5 s)
 FAIL  |unit| tests/server/git/git-ops.test.ts [ tests/server/git/git-ops.test.ts ]
Error: Hook timed out in 10000ms.
 Test Files  1 failed | 75 passed (76)
      Tests  674 passed | 234 skipped (908)
test:quick: 358.3 s; failed: vitest slow
test:quick: not covered: tests that reach no changed file within the import depth,
exit 1
$ uptime
15:16  up 3 days,  5:22, 1 user, load averages: 18.75 18.59 16.63
$ git diff 335db1c9 --stat -- tests/server/git/git-ops.test.ts ; git status --short tests/server/git
(nothing; the step does not change the file)
$ npx vitest run tests/server/git/git-ops.test.ts            (the red file, alone by name)
 Test Files  1 passed (1)
      Tests  17 passed (17)
$ git diff 335db1c9 -- docs/diagrams | md5 ; git status --short | md5      (after the list)
49c6397e7e75753f45dd019e52f12854
b2da7a5d1dcbab0221ebc0391de2b76a
$ npx vitest run tests/state/boards/board/board-rules.test.ts
 Test Files  1 passed (1)
      Tests  104 passed (104)
$ sh utils/unused-exports.sh | diff /Users/axelfaes/workspace/oculus/.agents/worktrees/O81-base/unused-exports.txt -     (check 4)
check4 diff exit 0
$ grep -rn 'Z10[0-9][0-9]\|ruling 4[0-9][0-9]\|\bO8[0-9]\b' src config docs tests --exclude=local.yml     (check 9)
check9 exit 1 (nothing)
$ LC_ALL=C perl -ne '<spec.md gate>' $(find src tests config -type f ! -name local.yml)     (check 10; bin does not exist)
perl gate exit 0 (nothing)
$ the same perl gate over every path git status --short lists (svg excluded), then a plain perl byte check over docs/diagrams/*.svg *.dot
changed-files gate exit 0 (nothing); diagrams: nothing
$ LC_ALL=C grep -n '[^ -~]' .scratch/migration/agents/reviews/O81-report.md
report grep exit 1 (nothing)
$ wc -l of every changed file (check 11), the largest
609 presets.ts, 710 focus.ts, 782 data/index.ts, 825 board-rules.test.ts, 837 model/index.ts, 840 keys.test.ts, 877 hub-names.ts;
components: 480 Projects.svelte, 395 Lanes.svelte, 389 Focus.svelte, 361 +page.svelte, 334 Band.svelte, 317 CommandCenterView.svelte, 248 CareerPanel.svelte, 203 Venues.svelte, 157 Tasks.svelte, 123 heads/FoldHead.svelte, 89 heads/GroupHead.svelte

Reruns of the commands the round section quotes as evidence:
$ grep -n "VocabOf\|WordsOf" src/lib/state/boards/board/presets.ts
20:import { vocabKeys, type WordsOf } from '../../../data/shapes/vocab-keys.ts';
463:function wordsReader(vocab: WordsOf): (hub?: string) => BoardWords {
497:    vocab: WordsOf = () => config
534:    vocab: WordsOf = () => config
$ grep -rn "VocabOf" src tests      (only hits: hubVocabOf, a different, older name; no type VocabOf left)
$ for each quoted current line: "<n>:$(sed -n <n>p <base file>)" looked up with grep -Fxq in the report's round section;
  base files from git show 335db1c9:docs/<file>, each cmp-equal to the worktree's copy
HELP.md:287 match / HELP.md:292 match / HELP.md:311 match / HELP.md:312 match / data-map.md:117 match /
templates.md:335 match / :336 match / :337 match / :338 match / apps.md:423 match
$ word diff (one word per line) of each replacement against its base line
:287  hunks at words 172-210 (cluster heading, lane colour and count, the fold sentence) and 1544-1563 (Track record role row); nothing else
:292  291c291 with -> of; 292a293,295 fold / control, / the       (the report's "`with` to `of the fold control,`")
data-map:117  adds "rows { key, label, ribbon? }," only
apps:423  data_themes }` -> data_themes, collections, list, words }`: ... ; adds the descriptions of collections, list, words only
$ grep -n "export type HubVocab = {" -A 8 src/lib/data/model/model-collections.ts
217-224: domains, venue_themes, data_themes, collections, list: { file: string; value: unknown }, words
$ git show 335db1c9:src/lib/data/model/index.ts | grep -n "type HubVocab = {" -A 9
296-302: domains, venue_themes, data_themes, collections, words      (the payload "before" of Visible changes item 9 holds)
src/lib/data/model/index.ts:272  hubs: HubVocabs;   src/lib/data/index.ts:666  list: { file: listFileOf(hub, config), value: config.merged.collections },
$ git diff 335db1c9 -U0 -- tests   (item 3's completeness)
keys.test.ts 158-159 a comment; :168 the COMPUTED_FINDING_KEYS entry (in the table);
hub-names.test.ts :278 one fixture field "list: { file: '', value: collections }," (no assertion; named in the report's Items row 3);
hub-vocab.test.ts :194 and :206-208 (in the table);
board-rules.test.ts: the head comment, imports, fixtures moved verbatim to board-fixture.ts (read side by side: same text), three added rows; no existing assertion changed
$ npx vitest run <the five files with failed rows, one run>
 Test Files  5 passed (5)
      Tests  84 passed (84)
$ npx vitest run tests/routes/edit/config-key.test.ts
 Test Files  1 passed (1)
      Tests  11 passed (11)
$ npx vitest run tests/ui/html.dom.test.ts
 Test Files  1 passed (1)
      Tests  8 passed (8)
$ uptime
15:20  up 3 days,  5:25, 1 user, load averages: 13.68 15.44 15.62

The case-run program (for the case verdicts over the whole diff):
$ npx vitest run --config <scratch>/o81-cases/caserun.config.mts --disableConsoleIntercept <scratch>/o81-cases/after.case.ts
exit 0; 84 `case` lines;  Test Files  1 passed (1) / Tests  1 passed (1)
diff of its `case` lines against the report's quoted block (report lines 723-1160): diff exit 0
git status --short | md5 before and after: b2da7a5d1dcbab0221ebc0391de2b76a both; ls <scratch>/o81-cases unchanged
```

My run of the list was red on a different file than the builder's run (`git-ops.test.ts`, a 10 s hook time-out under load averages near 19). The step does not change that file, and it passes alone. The six files the builder named as timed out all pass in my reruns.

## Round items

- Item 1: closed.
  - Each Doc text item quotes the current line as `grep -n` prints it on the base tree, every one an exact match, and then its whole replacement.
  - The Venues bullet is given as a new top-level line after `311:  - The log under the plan lists every request...` and before `312:- **Present.**...`, with both neighbours quoted.
  - The word diffs show that the replacements change only the sentences they name.
- Item 2: closed. `type VocabOf` is gone, and `wordsReader`, `presetFor` and `recordPreset` take `WordsOf` from `vocab-keys.ts`, as `career.ts:19,72` does.
- Item 3: closed. The table holds every changed line of an existing assertion or allow list in `git diff 335db1c9 -U0 -- tests`. The one other changed line, `hub-names.test.ts:278`, is a fixture field that the widened `HubVocab` type requires; it is no assertion, and the Items row names it.
- Item 4: closed.
  - The `docs/apps.md:423` row is quoted and replaced with the fields `{ domains, venue_themes, data_themes, collections, list, words }`, each checked against `model-collections.ts:217-224`.
  - Visible changes item 9 gives the payload before (base `HubVocab`, checked above) and after.

No finding was closed by removing a check, and no fix reaches beyond its finding: the only code delta is the type swap.

## Verdicts

Items of the brief's "What to build", over the whole diff since 335db1c9:

- 1: holds. `heads/GroupHead.svelte` (read whole):
  - a bare `ToolButton` named `focus.fold`/`focus.unfold` with the collapse or expand glyph;
  - the optional `Glyph`;
  - the label at `--fs-md` in `var(--c-<tone>-txt)`, or in `--muted-txt` when there is no tone;
  - the count as plain text at `--fs-sm`;
  - no state, and a head comment that names its users and says that `FoldHead` heads a box.
- 2: holds. `Projects.svelte` heads each section with `GroupHead` (label, name, `open={!folded.has(section.key)}`, `toggleFold`). `FoldHead`'s comment no longer names the board.
- 3: holds.
  - `Lanes.svelte` and `Band.svelte` draw `GroupHead`, with the keys from `groupFold` (`focus.ts`).
  - Each group's content uses `hidden={open ? false : 'until-found'}` with `onbeforematch`.
  - Check 8 printed nothing in the first refutation, and the round did not touch these files (cmp).
- 4: holds.
  - `config/catalogs/vocab.yml` holds the four rows, with their own comment.
  - The row shape in `vocab.ts` is strict: `key` min 1, `label` required, `ribbon` a flag.
  - `UNION_FIELD` maps `venue_categories` to `key`, and the options entry has three fields, `ribbon` a toggle.
  - The hub-vocab row is in the new shape (cases 9, 10, 11 and 25 in the rerun output).
- 5: holds.
  - `venueSections` in `venues.ts` gives one section per row, the first row of a key winning, then Other keyed `''`, and drops empty sections.
  - The Venues tab keeps `folded: string[]`.
  - The words `venues.journals` and `venues.conferences` are gone, `venues.intro` is reworded, and no code names a category word (check 5 ran clean in the first refutation; the round did not touch these files).
- 6: holds.
  - `BoardRule.record` and its branch in `boardTakes` (`takes.ts`); `recordPreset`, which now takes `WordsOf`.
  - `RECORD_VIEW` is registered by `Projects.svelte` and kept by `registerBoards` (`views.ts`).
  - `recordRows` opens `track_record` with `{ id, label }`. `roleBoard` and `boardOf` are gone.
  - The rows in G124's test pass (104 passed).
- 7: holds. The head comments named by the item are rewritten (read in the diff).
- 8: holds. Check 4 gives diff exit 0.
- 9: holds. The Doc text is complete and placed as the round brief asks (round item 1 above). The `docs/apps.md` row is given too (round item 4).

Cases of the brief's "Cases" (my rerun of `after.case.ts` matches the report's block line for line):

- 1: not verifiable here. By reading the markup: the chevron, the label in the category tone at `--fs-md`, the count, Other last, and `folded` kept. The look on landing settles it.
- 2: met: `cluster:now` false; `cluster:parked`, `cluster:incubate`, `lane:idea` and `band` true. The page itself on the look.
- 3: met, `band` folds and is kept.
- 4: met: `career` false, every other key true.
- 5: met: `groupFold('cluster','career')` gives `cluster:career`, separate from `career`.
- 6: met by reading (`until-found` and `onbeforematch`). The find bar on the look.
- 7: met: `["journal: Journals 46","conference: Conferences 27 ribbon","thesis: Theses 2","meeting: Meetings 1"]`.
- 8: met: workshop and no-category venues under Other after Meetings.
- 9: met: Conferences with the ribbon, then Journals, then Other.
- 10: met.
  - Finding: `venue_categories.0 must be a map` on the hub's `config.yml`.
  - Sections: `["(other): Other 5"]`; the form's options are `[{"id":"journal","label":"journal"}]`.
- 11: met: the label finding and the ribbon finding, each naming the hub's file.
- 12: met: `folded: ["thesis"]`, and an old `journalsOpen: false` reads as `folded: []`. The reload on the look.
- 13: met under cases ruling 3: the labels Journals, Conferences, Theses and Meetings, with the keys as ids.
- 14: met: each role's row lines equal its record board's sections (lead 9/16/10/9, supervisor 4, collaborator 1/2/6/6). One board on the look.
- 15: met: the idea project is not on the Lead record board.
- 16: met by the run. The second press on the look.
- 17: met: search and facet narrow the projects, and the tab keeps `{id, label}` through the board's writes.
- 18: met: the registration has `listed: false`, `group: ""` and no count hooks, and no role is offered New project.
- 19: met: the `boards.track_record` finding, and the record view is unchanged.
- 20: met: the record view stays registered through both pushes.
- 21: met: `career:role:ghost` opens `track_record`.
- 22: met: `career:funding` opens `funding`.
- 23: not verifiable here. By reading, only the import path of `FoldHead` changed in its three users; the look on landing settles it.
- 24: met: one Journals section holding the primary's row and the journals of both hubs.
- 25: met: an empty key is a shape finding, a repeated key gives one section, and only Other has the key `''`.
- 26: met: no project and the board's empty message.
- 27: met: 0 projects and `board.record_no_role`. The look on landing.
- 28: met under cases ruling 2: `view_id` for `debug` and `track_record`, the `venues` finding unchanged, and the board finding listed beside them.
- 29: met by the run. The Settings view on the look.

## 1. Spec

none.

## 2. Proof

none. Every claim of the round section I reran gave the same result:
- the line matches and word diffs of item 1;
- the grep of item 2;
- item 3's diff;
- item 4's `HubVocab` fields and line numbers;
- board-rules 104 passed; checks 4, 9 and 10 printing nothing; the line counts of check 11;
- each red file passing alone.

## 3. Standards

- Report, "# Repair round 1", Checks 1, the rerun bullet: "The five files with failed rows, in one `npx vitest run`: `Test Files  1 failed | 4 passed (5)`".
  - What is wrong: `spec.md`, "Token discipline", says a red line in a file the step does not change is rerun alone. Five files were rerun in one run, and only `config-key.test.ts` and `html.dom.test.ts` were then run by themselves.
  - Failure scenario: none in this round. My own run of the same five files passed 84 of 84, and each file the step does not change is outside what the step can influence. A combined rerun is a heavier load than a run alone, so it cannot hide a failure that a run alone would show.
  - Verdict: no change needed.

## 4. Behaviour

none.

## Declined to judge

- Whether the quoted Doc text lines still match `docs/HELP.md`, `docs/apps.md`, `docs/data-map.md` and `docs/templates.md` on main's current head. O83 has landed and O79 is in flight, and both write these files. I checked them against the base 335db1c9 only, as the round brief asks. `git show main:docs/HELP.md` (and the same for the other three files) would settle it, and that command is outside the ones allowed to me.
- The look cases and look parts (1, 2, 3, 6, 7, 12, 14, 16, 17, 18, 23, 27, 29). The review starts no page; the look on landing on the TEST page settles them.
- Whether the builder left a background command running when it stopped in this round. The state file's `builder_usage` records "3 min 49 s to its first stop while its checks ran, then ... 24 min 46 s to its report". `spec.md` ("What every package obeys", the rule on hand-backs) asks that nothing of the agent is still running at a hand-back. Only the builder's transcript shows whether that stop was a hand-back with a command still running.
- The first-run programs on the unchanged tree. `before.case.ts` imports exports the step removed, and the base copy has no setup to run it in. The first refutation compared its saved outputs with the report.

Usage: ad19dc3160a25fdc1, claude-opus-5-5, 228877 tokens, 46 tool uses, 16 min 56 s
