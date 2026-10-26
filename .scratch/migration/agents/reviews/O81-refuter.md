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
