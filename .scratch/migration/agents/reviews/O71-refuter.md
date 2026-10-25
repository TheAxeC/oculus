# Step O71 refuter report (on .agents/worktrees/migration-O71, base bc4fce66)

A page this report cites (the rules file, a standard, a skill's text) is named with its section, never with a line number, since a page's lines move and a section's name does not. A finding in code keeps its `file:line`.

The report is written in the rules file's character set. A character outside it in a quoted line is written by its name in angle brackets, such as `<tab>` or `<em dash>`.

The repository has no ADR folder: the brief says so (`ls docs/adr`: "No such file or directory"), the configuration names no `adr` key (`.agents/plan.yaml` holds none), and no ADR governs the step. The base unused-exports output named in the dispatch is at `.agents/worktrees/O71-base/unused-exports.txt` (343 lines, `wc -l`); the path `.agents/worktrees/O7x-base/` does not exist (`ls`: "No such file or directory").

Scratch files: to rerun the builder's case-run program in the same form, I recreated its program and config from the report's quoted source in my session scratchpad (`/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o71/`), outside every repository. `npm run diagrams` rewrote `docs/diagrams/` with the same bytes (`shasum docs/diagrams/* | shasum` printed `b23a229f1ff0f0674bd0a3714ddc66a3062ef37a` before and after). No repository file was edited; `git status --short` after the runs lists the same 26 modified paths and the same two untracked ledger files as before.

## Verification (rerun by the reviewer)

```
$ npm run diagrams && npm run test:quick -- --base bc4fce66      (worktree root; exit 0)
test:quick: 28 changed file(s), from git since bc4fce66
test:quick: 228 test file(s)
ok      prettier (10.5 s): All matched files use Prettier code style!
ok      ASCII gate (10.6 s)
ok      svelte-kit sync (19.6 s)
ok      eslint (76.4 s)
ok      svelte-check (79.1 s): 1792897555478 COMPLETED 537 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest checks (165.1 s): Duration  127.99s (transform 90.73s, setup 0ms, import 257.92s, tests 191.51s, environment 2ms)
ok      vitest (189.8 s): Duration  154.48s (transform 218.46s, setup 0ms, import 335.85s, tests 200.59s, environment 37.03s)
ok      vitest slow (224.8 s): Duration  189.82s (transform 21.42s, setup 0ms, import 175.57s, tests 570.06s, environment 13ms)
test:quick: 245.6 s; every command passed
test:quick: not covered: tests that reach no changed file within the import depth,
            the build, the lint of unchanged files

$ npx vitest run tests/data/snapshot/normalise.test.ts tests/checks/config/config-folder.test.ts tests/checks/config/config.test.ts tests/state/boards/board/board-rules.test.ts tests/checks/config/templates.test.ts tests/data/sources/config/layers/hub-vocab.test.ts tests/data/sources/config/layers/manifest-fields.test.ts --reporter=dot
 Test Files  7 passed (7)
      Tests  179 passed | 2 skipped (181)

$ grep -rn "priority_levels\|flamesOf\|nextPriority\|fire_glyph\|set_priority\|priority_none\|cyclePriority\|prioritiesShape\|oncycle" src config tests docs --exclude=local.yml
docs/HELP.md:517:- A hub sets its own words in its `.oculus/config.yml` under the keys of `vocab.yml` (every list but `priority_levels`), each laid over oculus's by its shape. A map (`palette`, `stage   [cut at 200 columns by the reviewer's cut -c1-200]
$ grep -rn -w "fire" config/catalogs
(nothing; exit 1)
$ grep -n -i "priority\|flame" <the twelve files of case 7>
docs/apps.md:191:| `customEditors` | list | `viewType`, `displayName`, `selector` (list of `{ filenamePattern }`), `priority?` (`default` or `option`), `entry` |
docs/apps.md:260:A host calls `oculus.window.createStatusBarItem(id, alignment, priority)`; a page calls `register('statusItem', id, { alignment, priority })` and then `changed('statusItem', id, field   [cut at 200 columns]

$ sh utils/unused-exports.sh > <scratch>/o71-unused-after.txt; wc -l; diff .agents/worktrees/O71-base/unused-exports.txt <scratch>/o71-unused-after.txt
exit 0
     343
diff exit 0

$ LC_ALL=C grep -n '[^ -~]' <every changed path but docs/diagrams>
(nothing; exit 1)

$ SCRATCH=<scratch>/o71/run1 npx vitest run --config <scratch>/o71/vitest.case.mts --project case --reporter=verbose   (the report's case-run program, worktree after the change)
case 1: projects 13 | with a priority value 0 | findings naming priority 0
case 2: finding projects/active/graph-bandits/project.yml | priority | key priority is not declared by the schema of this file
case 2: graph-bandits priority value undefined
case 2 control: finding projects/active/graph-bandits/project.yml | no_such_key | key no_such_key is not declared by the schema of this file
case 3: finding .oculus/config.yml | priority_levels | key priority_levels is not one the hub's settings file takes; it is not applied
case 3: merged priority_levels undefined
case 6: Core fields id,tier,stage,form,short,title,status.chips,status.line,pin,venue,links,tags,year
case 9: {"priority":"high"} | changed [] | refused [{"field":"priority","reason":"the manifest schema does not name the field"}] | file unchanged by this write true | file holds a priority line false
case 9: {"priority":null} | changed [] | refused [{"field":"priority","reason":"the manifest schema does not name the field"}] | file unchanged by this write true | file holds a priority line false
case 10: the form opens with a priority value false | the form draws a priority field false
case 10: save of status.line | changed ["status.line"] | refused [] | priority line kept true
case 10: finding after the save projects/active/graph-bandits/project.yml | priority | key priority is not declared by the schema of this file
case 11: field priority | no finding
case 11: field priority | form fields priority:text:null
case 11: from vocab.priority_levels | no finding
case 11: from vocab.priority_levels | form fields urgency:select:"vocab.priority_levels"
case 11: from vocab.no_such_list | no finding
case 11: from vocab.no_such_list | form fields urgency:select:"vocab.no_such_list"
 Test Files  1 passed (1)
      Tests  1 passed (1)
(identical, line for line, to the report's "Run after the change")

$ grep -rn "'lane:\|\`lane:\|\"lane:\|prio:" src tests        (the report's judgment call 2)
(nothing; exit 1)
$ git show bc4fce66:src/lib/views/boards/focus/lanes/Lanes.svelte | grep -n "'lane:\|\`lane:\|\"lane:\|prio:"
133:                    id: `lane:${lane.key}`,
138:                id: `prio:${level.key}`,
142:            { id: 'prio:', label: t('focus.priority_none'), active: project.priority === undefined }
154:        if (!choice.startsWith('lane:')) {

$ diff <(top-level keys of config/catalogs/vocab.yml) <(keys of VOCAB_SHAPES in merge/in-place.ts)   (the report's judgment call 6)
8a9
> leads_fit

$ find ~/workspace/research-hub -name project.yml -not -path "*/node_modules/*" | xargs grep -ln "^priority:"
exit 1
$ grep -ln "^priority:" ~/workspace/*/.oculus/project.yml
exit 1
$ grep -rln "flames:" ~/workspace/*/.oculus/config.yml
exit 1

$ wc -l src/lib/state/boards/focus.ts src/lib/views/boards/focus/lanes/Lanes.svelte src/lib/views/boards/focus/lanes/LaneCard.svelte src/lib/data/shapes/catalog-files/vocab.ts
     544 focus.ts | 343 Lanes.svelte | 194 LaneCard.svelte | 360 vocab.ts

$ awk 'length($0)>100' over the changed comment paragraphs
src/lib/views/boards/focus/lanes/Lanes.svelte:120: 101
```

Not rerun: the case-run program's first run on the unchanged tree (see "Declined to judge").

## Verdicts

Items of the brief's "What to build", in its numbering:

- 1: holds. The field row leaves `config/schemas/manifest-schema.yml` and `vocab.priority_levels` leaves its `from:` examples (the paragraph rewrapped), `Project.priority` leaves `model-entities.ts`, `normalise.ts` no longer reads it, `fieldValues` (`forms/schema.ts`) no longer sends it; the case run gives `findings.schema.not_declared` for a manifest holding `priority: high`, the value `undefined`, and Core fields without `priority`. No code reads or converts the old field.
- 2: holds. The key, its rows and its comment leave `config/catalogs/vocab.yml`, the key and the row field `flames` leave `vocab.ts`, `'priority_levels'` leaves `config-folder.test.ts`, and the five comments (`vocab.yml:4`, `options/catalogs/vocab.yml:3`, `vocab.ts:4-6`, `in-place.ts:42-43`, `hub-names.ts:367-368`) state every list; the key comparison prints only `> leads_fit`, the hub-only key the comment names. The hunk takes blank line 191, one past the write range 185-190 (judgment call 1); I judge it inside item 2, since it keeps the file's two blank lines between sections, and merge-safe, since lines 183-184 stay unchanged between it and O70's 171-182.
- 3: holds. `LaneCard.svelte` draws no badge and takes no `flames`, `unset` or `oncycle`; `menuFor` lists lanes alone; `choose` handles a lane only; `cyclePriority`, `flames` and `levels` are gone; `focus.ts` loses `Priority`, `priorityShape`, `prioritiesShape`, `priorities`, `flamesOf` and `nextPriority`; the three head comments state what holds now; the name `ToolButton` (`LaneCard.svelte:93`) is the first control of `.card-h`, after the status-mark `Tag`s, which are no controls. One comment line is over 100 columns (Standards 1).
- 4: holds. `fire_glyph`, `priority_none`, `set_priority` leave `focus.yml`; `fire` leaves `icons.yml` and `glyphs.yml`; `grep -rn -w "fire" config/catalogs` prints nothing, and no hub or workspace settings file names the glyph (`grep -rn -w fire` over `~/workspace/*/.oculus` finds only prose in `scotoma/.oculus/project.yml:8`).
- 5: holds, by reading. `normalise.test.ts` drops the expected `priority: 'high'` (`:262` base) and beta's `priority: 7` (`:127` base), keeps alpha's `priority: 'high'` input (`:95`), so `toEqual` at `:252` fails if `normalise` reads the key again; `config-folder.test.ts` drops `'priority_levels'`, read by `:375` and `:799`. No failing line was quoted (Proof 1).
- 6: holds. `docs/templates.md:648` and `docs/data-map.md:171` lose the line, `docs/apps.md:402` loses `` `priority?`, ``; the report's Doc text for `docs/HELP.md:517` is the line with " (every list but `priority_levels`)" removed, as decision 5 gives it.

Cases of the brief's "Cases" (case 7 and case 11 as `agents/briefs/O71-cases.md` rules them):

- 1, a manifest with no `priority:`: met. Case run "case 1: projects 13 | with a priority value 0 | findings naming priority 0"; by reading `LaneCard.svelte:82-104`, no badge is drawn; what is drawn is for the look at landing.
- 2, a manifest still writing `priority: high`: met. Case run: "key priority is not declared by the schema of this file", value `undefined`, no error; the card part by reading, and at the look.
- 3, a hub `.oculus/config.yml` setting `priority_levels:`: met. Case run: "key priority_levels is not one the hub's settings file takes; it is not applied".
- 4, oculus's `vocab.yml` without `priority_levels`: met. `config-folder.test.ts` in the seven-file run: 7 passed, 179 passed, 2 skipped.
- 5, the move menu: met, by reading `Lanes.svelte:123-128` (lanes from `hubMovable`, `active` on the held lane, no priority item) and `choose` at `:136-139` (a pick moves the card through `move`); the look at landing.
- 6, the project form: met. Case run: Core fields without `priority`.
- 7, the greps: met under the ruling. The first grep prints only `docs/HELP.md:517`; the second prints nothing; the third prints only `docs/apps.md:191` and `:260`.
- 8, keyboard on a lane card: met by reading `LaneCard.svelte:82-104` (name button, `RootChip`, deadline `Tag`, `Menu`, in that order, no badge); the look at landing.
- 9, a write naming `priority`: met. Case run: both `{"priority":"high"}` and `{"priority":null}` refused with "the manifest schema does not name the field", file unchanged.
- 10, the form saved over a manifest with `priority: high`: met. Case run: no priority value in the form, `status.line` written, "priority line kept true", the finding after the save.
- 11, a hub `manifest_fields:` row: met under the ruling. Case run: a row naming `priority` gets no finding and gives the field `priority:text`; a row with `from: vocab.priority_levels` gets no finding, as `vocab.no_such_list` does (open item 342).

## 1. Spec

none

## 2. Proof

- `tests/data/snapshot/normalise.test.ts:252` and `tests/checks/config/config-folder.test.ts:375`, `:799`, with the report's section "Anything in the brief that was wrong or impossible": "For this step that means putting the changed tests over the unchanged code under test, which the no-breakage rule bans."; what is wrong: no failing line is quoted for either changed test, which `spec.md` "What every package obeys" asks for and `refute`'s Proof heading counts as a finding. The stated reason holds only after the code was changed: editing the two test files first and running them on the unchanged code is the red-first run the rules file asks for, removes or breaks no code under test, and is not breakage testing. By reading, both changed tests fail on the base and pass after: base `normalise.ts:258` puts `priority: 'high'` into alpha and `toEqual` refuses the extra key; base `vocab.yml` holds `priority_levels`, so `Object.keys(...)` at `:375` and `:799` differ from the trimmed `EXPECTED`. No further run on the unchanged tree is asked for, since that would now need a revert; failure scenario: an orchestrator who reads "impossible" in the report carries it into later briefs and drops the red-first run where it could be taken without breaking anything; verdict: none (item 5 holds by reading).
- `.scratch/migration/agents/reviews/O71-report.md`, judgment call 2: "`grep -rn "'lane:\|\`lane:\|\"lane:\|prio:" src tests` printed nothing before the change, so no other reader of the prefixed ids exists."; what is wrong: on the base, the grep prints four lines of `Lanes.svelte` itself (`git show bc4fce66:...Lanes.svelte | grep`: `:133`, `:138`, `:142`, `:154`); it prints nothing only after the change. The decision on bare-key menu ids rests on it. The conclusion holds: every base hit is in `Lanes.svelte`, the reader the step rewrites, and neither changed test names the ids; failure scenario: a reader who reruns the quoted grep on the base sees four hits, and the report's evidence for the decision reads as false; verdict: none.

## 3. Standards

- `src/lib/views/boards/focus/lanes/Lanes.svelte:120`: "     * The menu a card carries: every lane the card may move to (`hubMovable`), each by its key, with"; what is wrong: the line is 101 columns (`awk 'length($0)>100'`), where `spec.md` "What every package obeys" rewraps an edited comment at 100 columns (and `.prettierrc` has `printWidth: 100`, which prettier does not apply to comment text). The report's "Prose check" says "The longest is 100", which this run does not reproduce; failure scenario: the next step that edits this comment finds a line over the width the rules file states, and the report tells the orchestrator the widths were measured and clean; verdict: none.
- `src/lib/data/shapes/catalog-files/vocab.ts:1-6`: "// Layer 1, data. The whole-file shape of config/catalogs/vocab.yml, the controlled vocabularies" (96 columns) followed by "// the boards and the schemas draw from, ..."; what is wrong: the step rewrote lines 4-6 of this paragraph but did not rewrap it whole; line 1 ends with room for the next word ("the", 96 + 1 + 3 = 100), which `spec.md` "What every package obeys" ("A comment edited by the step is rewrapped as a whole paragraph at 100 columns, so no line inside a sentence ends short") forbids; the report says each edited paragraph was rewrapped whole. The short line was there at the base too; failure scenario: a reader of the head comment sees a ragged paragraph the rules file says no edited comment keeps; verdict: none.
- `src/lib/views/boards/focus/lanes/Lanes.svelte:127`: "            .map((lane) => ({ id: lane.key, label: lane.label, active: lane.key === held }));"; what is wrong: the step introduces a new id form (the bare lane key as a menu id) and the report does not state what the code does for an empty, duplicated or colliding id, which `spec.md` "What every package obeys" asks of every id a step introduces. By reading: an empty key cannot reach the menu (`focus.ts:153`, `wordShape.refine((key) => key !== '')`); two rows of one hub's `focus_lanes` with the same key give two items of one id, exactly as the prefixed ids did (`rowsShape`, `shapes.ts:179-186`, does not dedupe); `MenuItem` (`ui/menu/menu-items.ts`) reserves no id; failure scenario: a hub writing two `focus_lanes` rows of one key gets two menu items of one id, unchanged from the base, and the report gives the orchestrator no statement of it to check; verdict: none.
- `docs/HELP.md:517` and `.scratch/migration/agents/guarded.md:189` (G126: "lays each key of `config/catalogs/vocab.yml` but `priority_levels` over oculus's by its shape"); what is wrong: both sentences are false once the step lands; the brief assigns both to the orchestrator at landing, and the report's Doc text for line 517 is correct (the parenthesis removed, the rest byte for byte); failure scenario: if landing skips them, a hub author reads that `priority_levels` is a list oculus keeps for itself, and a builder reads G126 as covering a key that no longer exists; verdict: none (landing work, as the brief says).
- `.scratch/migration/parity.md:12`: "- The priority flame is drawn only when set; the cockpit draws it always, faint when unset, and a click cycles it (unset, low, med, high). oculus has a menu instead."; what is wrong: a parity row about a feature the step removes, in a ledger whose head says "a row is struck through here when its package lands"; it is a ledger file, the orchestrator's, outside the builder's paths; failure scenario: a later parity step reads the row as an open gap and rebuilds a priority flame Axel ruled out (ruling 329 (a)); verdict: none (for the orchestrator at landing).

## 4. Behaviour

- `src/lib/data/shapes/catalog-files/vocab.ts:12-18`, the shared `keyed` row shape without `flames`; what is wrong: a hub or oculus row of `venue_tiers` or `radar_buckets` (`vocab.ts:346`, `:352`) that writes `flames:` was accepted and is now an issue of the strict shape, which `loadConfig` turns into a finding on the config channel and the YAML editor marks (`shapes/catalog-files.ts` head comment). The report states it only as judgment call 5 ("now refused by that strict shape"), not in its "Host- and user-visible changes" section with what the user sees before and after. The brief asks for the field's removal (item 2), and no row writes it today (`grep -rln "flames:" ~/workspace/*/.oculus/config.yml` exit 1; the report's `grep -rn flames config` prints nothing); failure scenario: a hub author who copied a `flames:` field into a `venue_tiers` row sees a new config finding at landing that the look's before-and-after list never mentioned; verdict: none.

## Declined to judge

- The case-run program's first run on the unchanged tree (the report's "First run" block): not reproduced. No tree at bc4fce66 is on disk (`.agents/worktrees/O71-base/` holds only `unused-exports.txt`; the gate worktree differs from the base, `git diff bc4fce66 --stat` there: "14 files changed"), and making one needs a git command outside the three the reviewer runs. The base behaviour each first-run line states agrees with my reading of the base code (`git show bc4fce66:` of `Lanes.svelte`, `focus.ts`, `vocab.yml`), and the after-run is reproduced line for line.
- What a lane card draws, its tab order with focus visible, and the menu as shown (cases 1, 2, 5 and 8, their drawn parts): outside what a read and a unit run settle; the look on TEST at landing settles them.
- Whether the hunks merge simply with O69 and O70 at landing: the orchestrator's `shared_paths:` judgment. I checked only that this step's hunks keep unchanged lines between them and the ranges the dispatch entry gives O70 (`vocab.yml` 183-184, `focus.ts` 71 and 184, `Lanes.svelte` 227-240).
- Who placed the untracked `.scratch/migration/agents/briefs/O71-cases.md` in the worktree: it equals the main checkout's copy (`cmp`: SAME), so it is the orchestrator's ruling and not a builder change; who copied it is not settled by the three git commands.
- Open item 342 (a hub `manifest_fields:` row whose `from` names no list gets no finding): already raised and booked (`orchestrator-state.md:204`); the user's call, not judged here.
- What the project form's select draws for a hub row whose `from` names no list: not run; it belongs to open item 342.

Reviewer usage: a9d96075314610db6, claude-opus-5-5, 221201 tokens, 61 tool uses, 13 min 13 s.
