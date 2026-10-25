# O70 report: the facts of a project card and the Career banner

Not done as the brief words it: verify item 4's grep does not print nothing. Its term "Career strategy" also matches the career file's own `title:` value in test inputs, the demo fixture's data line 2 and the template example of `docs/templates.md:1433`, eleven hits, none of which names the banner; every hit that named the banner is gone (the run is quoted under "Anything in the brief that was wrong"). One path outside the write list is changed: `src/lib/views/shared/card/card.ts`, which item 3 names as the home of the compute glyph function. Every other item of the brief is built and checked as quoted below; cases 1, 5, 6, 9, 11, 14 (its drawing half), 15 and 16 are proved at the look on landing, as the brief says.

## Open items of the state file (verbatim, `orchestrator-state.md` "Open items")

- 337 (2026-10-25, O60's builder's report, the breach it records; `agents/spec.md`'s rule that a builder writes no script the brief does not build): O60's builder aaf9969093ea82a29 wrote three helper scripts the brief does not build and no ruling approves, in the session's scratch folder outside the tree: `wrap.py` and `wrap2.py`, which rewrapped the comment paragraphs of the changed files at 100 columns, and `greps.sh`, which runs the brief's four reader greps over a tree and gave the report's counts of 68 reader files on the base and 85 on the worktree. (a) record it, and use nothing they printed as evidence: every rewrapped comment is judged by the reviewers' and the orchestrator's own reading of the diff, and the reader coverage by the reviewer's own greps, as open item 330 ruled for O63. Pros: the step keeps its work and no evidence rests on an unapproved script. Cons: none found. (b) send the rewraps back in the repair round to be redone by hand. Pros: no edit a script made stays. Cons: the same text again, at the cost of a round, when a read already judges each paragraph. Recommended (a); (b) is not the lazy option but costs a round for no change in the text. Left for Axel: `refute`'s Finding dispositions send an unapproved script to the user.
- 340 (2026-10-25, O60's look at landing, item 3 of `agents/briefs/O60.md`): the unknown-stage finding names the closest word of the hub's stages at any distance (`closestWord`, `src/lib/data/shapes/vocab-keys.ts:272`), as a collection entry's status finding does (`src/lib/data/snapshot/validate.ts:234`). Over the look's copy of the hub with `stages: { nascent: null }`, each of the 18 manifests at `nascent` reads 'stage "nascent" is not a word of the stages list; the closest word is failed', which points the reader at a stage that means the opposite. (a) both findings name the closest word only when it is within half the word's length in edits, rounded down, and otherwise end after 'is not a word of the stages list' (or of the statuses). Pros: no hint that misleads. Cons: a word mistyped beyond that distance gets no hint. (b) keep both as built. Pros: no change. Cons: the misleading hint on every word removed or far off. Recommended (a); (b) is the lazy option. Left for Axel: it changes the collection status finding too, which is outside O60's line, so it needs a step, and no step is scheduled without his word.

## The case-run program

A vitest one-off in the session scratchpad, run against the worktree's own `vite.config.ts` with the project list replaced by the scratch folder, so `.svelte.ts` modules compile as in the suite. Both files are deleted. Command, from the worktree root:

```
npx vitest run --config <scratch>/cases/vitest.cases.config.mts --root . --reporter=verbose
```

`vitest.cases.config.mts`:

```
import base from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O70/vite.config.ts';
export default async (env: { mode: string; command: string }) => {
    const config = await (base as (e: unknown) => Promise<Record<string, any>> | Record<string, any>)(env);
    config.test.projects = undefined;
    config.test.dir = '<scratch>/cases';
    config.test.include = ['**/*.cases.ts'];
    config.test.globals = true;
    config.test.testTimeout = 60000;
    config.test.environment = 'node';
    return config;
};
```

`o70.cases.ts` (final form; the first run used the same program with the lane glyph read from `focus.ts` instead of `card.ts`, no case 14 block and the stage reference rows added in a second pass on the unchanged tree):

```
// Case run of O70: prints each case's result for its input; asserts nothing beyond running.
import { cpSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
const WT = '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O70';
const SCRATCH = '<scratch>/cases';
const { engineDir, loadConfig, textCatalog } = await import(`${WT}/src/lib/data/sources/config.ts`);
const { READER_FINDINGS } = await import(`${WT}/src/lib/data/sources/config/sections/findings.ts`);
const text = await import(`${WT}/src/lib/state/shared/words/text.ts`);
const focus = await import(`${WT}/src/lib/state/boards/focus.ts`);
const career = await import(`${WT}/src/lib/state/boards/career.ts`);
const schema = await import(`${WT}/src/lib/state/forms/schema.ts`);
let card: Record<string, unknown> = {};
try { card = await import(`${WT}/src/lib/views/shared/card/card.ts`); } catch (e) { console.log('card.ts import:', String(e)); }
const oculus = loadConfig(engineDir());
text.setCatalog(textCatalog(oculus.config));
text.setGlyphs(oculus.config.glyphs as Record<string, string>);
function hubWith(extra: string): string {
    const dir = mkdtempSync(join(SCRATCH, 'demo-'));
    cpSync(`${WT}/tests/fixtures/hubs/demo`, dir, { recursive: true });
    const file = join(dir, '.oculus/config.yml');
    writeFileSync(file, readFileSync(file, 'utf8') + '\n' + extra);
    return dir;
}
function run(name: string, extra: string): void {
    const hub = hubWith(extra);
    const read = loadConfig(engineDir(), { hub });
    const where = { engine: engineDir(), hub, from: read.from };
    const findings = [...read.findings, ...READER_FINDINGS.flatMap((r: any) => r(where, read.config))];
    console.log(`== ${name}`);
    for (const f of findings) console.log(`finding: ${String(f.file).replace(hub, '<hub>')} | ${f.key} | ${f.message}`);
    if (findings.length === 0) console.log('findings: none');
    for (const lane of focus.lanes(read.config)) {
        const glyph = typeof card.laneGlyph === 'function' ? (card.laneGlyph as (i: string) => string)(lane.icon) : '(no laneGlyph function)';
        console.log(`lane ${lane.key}: icon=${JSON.stringify(lane.icon)} glyph=${glyph}`);
    }
}
const ROW = (icon: string) => `focus_lanes:\n  - { key: review, label: Review, color: "#475569", cluster: parked, stages: [submitted]${icon} }\n`;
it('case 1: oculus lane review', () => { for (const lane of focus.lanes(oculus.config)) { const glyph = typeof card.laneGlyph === 'function' ? (card.laneGlyph as (i: string) => string)(lane.icon) : '(no laneGlyph function)'; console.log(`case 1 lane ${lane.key}: icon=${JSON.stringify(lane.icon)} glyph=${glyph}`); } expect(true).toBe(true); });
it('cases 2-4: loader over a copy of the demo hub', () => {
    run('case 2a: a row naming no icon', ROW(''));
    run('case 2b: a row with icon: ""', ROW(', icon: ""'));
    run('case 3: a row with icon: rocket', ROW(', icon: rocket'));
    run('case 4: a row with icon: 3', ROW(', icon: 3'));
    run('case 4 reference: a stage with icon: 3', 'stages:\n  submitted: { label: submitted, icon: 3 }\n');
    run('case 2/3 reference: a stage with icon: ""', 'stages:\n  submitted: { label: submitted, icon: "" }\n');
    run('case 2/3 reference: a stage with icon: rocket', 'stages:\n  submitted: { label: submitted, icon: rocket }\n');
    expect(true).toBe(true);
});
it('case 14: a form or chip glyph', () => { for (const icon of ['', 'rocket', 'writing', 'done']) { const own = typeof card.wordGlyph === 'function' ? (card.wordGlyph as (k: string) => string)(icon) : '(no wordGlyph function)'; console.log(`case 14 icon ${JSON.stringify(icon)}: wordGlyph=${own}`); } expect(true).toBe(true); });
it('case 7: compute glyph', () => { for (const kind of ['cluster', 'machine', 'storage', 'gpu', '']) { const own = typeof card.computeGlyph === 'function' ? (card.computeGlyph as (k: string) => string)(kind) : '(no computeGlyph function)'; console.log(`case 7 kind ${JSON.stringify(kind)}: resourceGlyph=${String(schema.resourceGlyph(kind))} computeGlyph=${own}`); } expect(true).toBe(true); });
it('case 8: the Next line', () => {
    const at = (y: number, m: number, d: number) => new Date(y, m - 1, d, 12).getTime();
    const file = { milestone: 'FWO Senior', milestoneDate: '2026-11-17' };
    for (const [label, now] of [['2026-10-24', at(2026, 10, 24)], ['2026-11-16', at(2026, 11, 16)], ['2026-11-17', at(2026, 11, 17)], ['2026-11-18', at(2026, 11, 18)], ['2026-11-20', at(2026, 11, 20)]] as const) {
        const line = typeof career.nextLine === 'function' ? career.nextLine(file, now) : '(no nextLine function)';
        console.log(`case 8 on ${label}: ${typeof career.daysLeft === 'function' ? `daysLeft=${career.daysLeft(file.milestoneDate, now)} ` : ''}nextLine=${line}`);
    }
    const bare = typeof career.nextLine === 'function' ? career.nextLine({ milestone: 'FWO Senior' }, at(2026, 10, 24)) : '(no nextLine function)';
    console.log(`case 8 no milestone_date: nextLine=${bare}`);
    if (typeof career.foldedLine === 'function') console.log(`case 9 foldedLine: ${career.foldedLine({ title: 'Career strategy', ...file, situation: [], order: [] })}`);
    expect(true).toBe(true);
});
it('case 10: the track record table', () => {
    const lines = (a: number, b: number, c: number) => [
        { key: 'in-review', label: 'in review', count: a }, { key: 'in-flight', label: 'in flight', count: b },
        { key: 'publications', label: 'publications', count: c }, { key: 'other-outputs', label: 'other outputs', count: 0 }];
    const inputs = {
        'Lead 2/0/3, Supervisor 0/1/0, funding 1': { roles: [{ key: 'lead', label: 'Lead', lines: lines(2, 0, 3) }, { key: 'supervisor', label: 'Supervisor', lines: lines(0, 1, 0) }], funding: 1 },
        'same, funding 0': { roles: [{ key: 'lead', label: 'Lead', lines: lines(2, 0, 3) }, { key: 'supervisor', label: 'Supervisor', lines: lines(0, 1, 0) }], funding: 0 },
        'no role row, funding 2': { roles: [], funding: 2 } };
    for (const [name, record] of Object.entries(inputs)) {
        if (typeof career.recordTable !== 'function') { console.log(`case 10 ${name}: (no recordTable function)`); continue; }
        const table = career.recordTable(record);
        console.log(`case 10 ${name}: columns=${JSON.stringify(table.columns.map((c: any) => c.label))}`);
        for (const row of table.rows) console.log(`case 10 ${name}: row ${JSON.stringify(table.columns.map((c: any) => row[c.key] === undefined ? '' : row[c.key]))}`);
    }
    expect(true).toBe(true);
});
```

(`<scratch>` is `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad`. The lines of single-statement blocks are joined here for length; the program ran as listed.)

## The cases' first run (unchanged tree, before any change)

No case is one the brief's own rules get wrong, so the build went ahead.

1. Program, case 1: `case 1 lane review: icon=undefined glyph=(no laneGlyph function)` (every lane the same). Reading: `ProjectCard.svelte:387` `<Tag label={lane.label} />` draws no glyph and no title; `Lanes.svelte:226` passes no glyph to `LaneHead`.
2. Program: `== case 2a: a row naming no icon` / `findings: none` / `lane review: icon=undefined`. `== case 2b: a row with icon: ""` / `finding: <hub>/.oculus/config.yml | focus_lanes.0.icon | key focus_lanes.0.icon is not a key this file takes`. Reference: `== case 2/3 reference: a stage with icon: ""` / `findings: none`.
3. Program: `== case 3: a row with icon: rocket` / `finding: <hub>/.oculus/config.yml | focus_lanes.0.icon | key focus_lanes.0.icon is not a key this file takes`. Reference: `== case 2/3 reference: a stage with icon: rocket` / `findings: none`.
4. Program: `== case 4: a row with icon: 3` / `finding: <hub>/.oculus/config.yml | focus_lanes.0.icon | key focus_lanes.0.icon is not a key this file takes`. Reference: `== case 4 reference: a stage with icon: 3` / `finding: <hub>/.oculus/config.yml | stages.submitted.icon | stages.submitted.icon must be a text`.
5. Reading, `ProjectCard.svelte:382-402` at the base: Lead tag with the `author` glyph, the lane tag with no glyph, `CardStatus` chips, the code tag, reproduced, compute tags, then `<span class="venue">{item.venue.text}</span>` in the same row; no fact carries a hover title.
6. Reading, `CardLinks.svelte:52-83` at the base: no venue kind; the venue is only in the top row.
7. Program: `case 7 kind "gpu": resourceGlyph=undefined computeGlyph=(no computeGlyph function)`; `ProjectCard.svelte:397` passes `undefined`, so the tag draws no glyph.
8. Program: `case 8 on 2026-10-24: daysLeft=in 24d nextLine=(no nextLine function)`, `on 2026-11-16: daysLeft=in 1d`, `on 2026-11-17: daysLeft=today`, `on 2026-11-18: daysLeft=1d ago`, `on 2026-11-20: daysLeft=3d ago`, `case 8 no milestone_date: nextLine=(no nextLine function)`.
9. Program: `case 9 foldedLine: Career strategy | Next: FWO Senior (2026-11-17)` (the folded heading row's title at the base, `CareerPanel.svelte:106`).
10. Program: `case 10 ...: (no recordTable function)` for each input. Reading: the base draws a `facts` grid, one `focus.career_record_line` per record row, and `focus.career_funding` as a note.
11. Reading: the base stacks the sections one under another in `.body` with no grid (`CareerPanel.svelte:128-199`).
12. Reading: at the base a file with only a goal draws the Goal line alone (`CareerPanel.svelte:139-144`).
13. `grep -n "in_days\|days_ago" config/text/views/boards/focus.yml` printed `27: days_ago: '{0}d ago'`, `50: in_days: in {0}d`, `87: days_ago: '{0}d ago'`, `95: in_days: in {0}d`.
14. Reading: `CardStatus.svelte:22` passes `chipGlyphName(chip, hub)`, the empty string for a row naming no icon, which `Chip.svelte:68` draws as no glyph; an unknown name would reach `Glyph`, which throws (`text.ts:86`).
15. Reading: `CareerPanel.svelte:150` draws the milestone through `LinkedText`.
16. Reading: `Projects.svelte` list mode draws `projectLane(...).label` and `item.venue?.short`; `Lanes.svelte:127-144` `menuFor` lists lanes by label.

Verify item 2 on the unchanged tree: `npx vitest run tests/state/boards/board/board-rules.test.ts tests/checks/config/config.test.ts tests/checks/config/config-folder.test.ts` printed `Test Files  3 passed (3)` / `Tests  153 passed | 2 skipped (155)`.

## The cases after the change (final tree, the program above)

1. `case 1 lane review: icon="stale" glyph=stale`, and `run live`, `push draft`, `revise edit`, `blocked overdue`, `backburner snooze`, `scope compass`, `derisk flag`, `build build`, `idea idea`. Card: `CardFacts.svelte:51-53` wraps `<Tag label={lane.label} glyph={laneGlyph(lane.icon)} />` in `Tooltip text={t('project.card.lane_tip', lane.label)}` ("Focus lane: Review"). Heading: `Lanes.svelte:226` passes `glyph={one.icon}`, `LaneHead.svelte:40` draws `<Glyph name={laneGlyph(glyph)} />`. Seen at the look.
2. `== case 2a: a row naming no icon` / `findings: none` / `lane review: icon="" glyph=focus`; `== case 2b: a row with icon: ""` / `findings: none` / `lane review: icon="" glyph=focus`.
3. `== case 3: a row with icon: rocket` / `findings: none` / `lane review: icon="rocket" glyph=focus`. The guards are `laneGlyph` (`card.ts:157`, `hasGlyph(icon) ? icon : LANE_GLYPH`), called by `LaneHead.svelte:40` and `CardFacts.svelte:52`, so no unknown name reaches `Glyph`.
4. `== case 4: a row with icon: 3` / `finding: <hub>/.oculus/config.yml | focus_lanes.0.icon | focus_lanes.0.icon must be a text` / `lane review: icon="" glyph=focus`, the same wording as the stage reference `stages.submitted.icon must be a text`.
5. Reading `CardFacts.svelte`: in order Lead (`Role: Lead`), the lane (`Focus lane: <label>`), each of `item.chips`, the first one `Form: <label>` when the project has a form and the others `Status: <label>` (labels from `chipLabel`, so "journal article" and "parked (not being worked)"), code (`Code: <codeLabel>`), reproduced (tag `board.repro_yes` "reproduced", title "Reproduced"), each compute resource (`Compute: <label>`). `ProjectCard.svelte` has no venue in the row; `CardLinks.svelte` draws the Venue line last. The card is the same component in both views (`Projects.svelte:69`, `Project.svelte:124`). Seen at the look.
6. Reading `CardLinks.svelte`: the venue kind's tags are `item.venue === null ? [] : [one tag]`, and a kind line is drawn only with entries, so no venue draws no line, and a venue with no other cross-link makes `tagged` true with the Venue line alone. Seen at the look.
7. `case 7 kind "gpu": resourceGlyph=undefined computeGlyph=hpc`, `kind "": ... computeGlyph=hpc`; cluster `hpc`, machine `host`, storage `data`.
8. `case 8 on 2026-10-24: nextLine=FWO Senior on 2026-11-17, in 24 days`; `on 2026-11-16: ... in 1 day`; `on 2026-11-17: ... today`; `on 2026-11-18: ... 1 day ago`; `on 2026-11-20: ... 3 days ago`; `case 8 no milestone_date: nextLine=FWO Senior`.
9. `foldedLine` is gone (`grep -rn "foldedLine" src tests docs` prints nothing); `FoldHead` gets `title={t('focus.career_heading')}` = "Career" and `name` the same, so the control reads "Fold Career" / "Unfold Career". Seen at the look.
10. `columns=["","in review","in flight","publications"]`, rows `["Lead",2,0,3]`, `["Supervisor",0,1,0]`, `["Funding obtained",1,"",""]`; funding 0: the same without the Funding obtained row; no role row and funding 2: `columns=["",""]`, `row ["Funding obtained",2]`. other outputs, with no project, draws no column.
11. The grid rule written (`CareerPanel.svelte` `.sections`): `display: grid; grid-template-columns: repeat(auto-fit, minmax(min(calc(240px * var(--text-scale, 1)), 100%), 1fr))`, `gap: 4px 16px`. Arithmetic at text scale 1 (not measured): five columns need 5 x 240 + 4 x 16 = 1264px of content width; the banner takes 8px padding each side and 1px and 3px borders, so a pane of 1400px holds the five side by side, and two columns need 496px, more than a 500px pane's content width of 480px, so there each stands under the one before. Seen at the look.
12. Reading: each section is in its own `{#if}` (goal, `next !== ''`, situation, order, `record !== null`), and `auto-fit` collapses empty tracks, so a file with only a goal draws one column, Goal, across the width (the Track record column also draws when `self` is set and the user has projects, since it reads the snapshot and not the file).
13. `grep -n "in_days\|days_ago" config/text/views/boards/focus.yml` prints `9: career_days_ago: '{0} days ago'`, `16: career_in_days: 'in {0} days'`, `34: days_ago: '{0}d ago'`, `57: in_days: in {0}d`, `94: days_ago: '{0}d ago'`, `102: in_days: in {0}d`; the two `Band.svelte` reads, `focus.in_days` and `focus.days_ago`, stay.
14. `case 14 icon "": wordGlyph=tag`, `icon "rocket": wordGlyph=tag`, `icon "writing": wordGlyph=writing`; `CardFacts.svelte:63` draws `wordGlyph(chipGlyphName(chip, hub))`. Drawing seen at the look.
15. Reading: `CareerPanel.svelte` draws `<LinkedText text={next} />`, the whole Next line, so a web address in the milestone is a link. Seen at the look.
16. Reading: `Projects.svelte` and `menuFor` in `Lanes.svelte` are not changed (`git diff --name-only` lists neither `Projects.svelte` nor any `Lanes.svelte` line but 226).

## DONE / NOT DONE

| Item | State | Proof |
| --- | --- | --- |
| 1 A lane has an icon | DONE | `laneRow` gains `icon` (`vocab.ts:36-38`), `Lane.icon` and `laneShape.icon` (`focus.ts`), option field `icon` with `control: glyph` (`config/options/catalogs/vocab.yml:153-155`), ten rows with icons, `icons.yml` `build: hammer` and `glyphs.yml` `build: "[B]"` after `idea`; case run 1 to 4 above. |
| 2 Lane icon in its heading | DONE | `Lanes.svelte:226`, `LaneHead.svelte:40`; case 1. Look. |
| 3 Facts with glyph and hover title | DONE | `CardFacts.svelte` (new), `CardStatus.svelte` deleted; `card.ts` `laneGlyph`, `wordGlyph`, `computeGlyph`; cases 7 and 14. Look. |
| 4 Venue line | DONE | `CardLinks.svelte` venue kind with `wrap`, `LinkedItem` gains `venue` (`presets.ts:97-107`), `.venue` style gone. Look. |
| 5 Heading Career | DONE | `focus.career_heading: Career`; `foldedLine`, `career_next`, `career_milestone` removed (verify 4 grep below shows no hit). |
| 6 Sections side by side | DONE | `CareerPanel.svelte` `.sections` grid, five `career_*_glyph` keys; case 11 rule. Look. |
| 7 Next is one line | DONE | `nextLine` in `career.ts`; case 8; `.milestone` gone, `.when` kept for the order rows. |
| 8 Track record table | DONE | `recordTable` in `career.ts`, drawn with `Table.svelte` not sortable; case 10; `career_funding` and `career_record_line` removed. |
| 9 Words made true | DONE | the sentences listed under "Files"; `docs/HELP.md:287-288` rewritten. |
| Verify 1 | DONE | `npm run diagrams && npm run test:quick`, second run: `ok prettier (0.6 s): All matched files use Prettier code style!`, `ok ASCII gate (0.7 s)`, `ok svelte-kit sync (2.0 s)`, `ok svelte-check (9.7 s): 1792897450667 COMPLETED 537 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`, `ok eslint (10.0 s)`, `ok vitest (71.1 s): Duration  61.81s (transform 43.20s, setup 0ms, import 147.26s, tests 84.91s, environment 3.67s)`, `ok vitest slow (126.5 s): Duration  116.78s (transform 13.79s, setup 0ms, import 80.21s, tests 227.07s, environment 3ms)`, `ok vitest checks (150.5 s): Duration  139.67s (transform 60.17s, setup 0ms, import 146.92s, tests 126.61s, environment 1ms)`, `test:quick: 152.6 s; every command passed`. |
| Verify 2 | DONE | after the last change: `Test Files  3 passed (3)` / `Tests  153 passed | 2 skipped (155)`; the same on the unchanged tree. |
| Verify 3 | DONE | `sh utils/unused-exports.sh > <scratch>/unused-final.txt; diff .agents/worktrees/O70-base/unused-exports.txt <scratch>/unused-final.txt` printed nothing (`diff exit 0`): the step adds no unused-export line. |
| Verify 4 | NOT DONE as worded | prints 11 lines, each the career file's `title: Career strategy` value (see "Anything in the brief that was wrong"); no hit of `CardStatus`, `foldedLine`, the removed keys or `class="venue"`. |
| Verify 5 | DONE | `wc -l`: `ProjectCard.svelte` 473, `CardFacts.svelte` 82, `CardLinks.svelte` 202, `CareerPanel.svelte` 387, `LaneHead.svelte` 85, `career.ts` 183, `focus.ts` 599, `presets.ts` 424, `card.ts` 220, `catalog-files/vocab.ts` 368, `model-collections.ts` 257, `normalise-parts/career.ts` 87; every one under 520 or 880. |
| Verify 6 | DONE | the brief asks for no new test and the step adds or changes none (`git diff --name-only -- tests` lists only `tests/fixtures/hubs/demo/.oculus/data/academic/career.yml`, a comment line of a data fixture). |
| Verify 7 | DONE | each changed sentence read; departures named under "Judgment calls". |
| ASCII | DONE | `LC_ALL=C grep -n '[^ -~]'` over every added or modified file and `CardFacts.svelte` printed nothing (`grep exit 1`). |

The list ran twice. The first run was red on eslint (`CareerPanel.svelte` 210:53 and six more, `Unsafe member access .numeric on an any value`: the `cell` snippet's parameters had no types) and on `tests/checks/source/keys.test.ts` ("uses literals except at the documented computed prefixes": `lib/views/shared/card/project/CardFacts.svelte: t(`; "has a reader for every catalog key": `project.card.chip_tip`, `project.card.form_tip`). Both files were fixed (`cell(row: Record<string, unknown>, column: Column)` as `Gallery.svelte:178` and `Summary.svelte:55` type it; the form and chip titles as two literal `t(...)` calls), `npx eslint` over the two files printed nothing, `npx vitest run tests/checks/source/keys.test.ts --testTimeout=120000` printed `Tests  10 passed (10)`, and the list ran once more, green. No whole-suite command was run. `tests/checks/tree/boundaries.test.ts` timed out (5000 ms) once in a run of four files beside the list of another worktree, and alone with `--testTimeout=120000` printed `Tests  11 passed (11)`; the list's own run of it passed.

The history-word grep over the added lines (`grep -inE "\bbefore\b|used to|no longer|\bstill\b|always has been|always had|as before|previously|the step adds|after this package lands|\bO[0-9]+\b|<a date>"`): "drawn before the lane's label" (vocab.yml head comment, options help), "drawn before the words" (`LaneHead.svelte`), "before the day" (`career.ts` `daysLeft`) and "before its controls" (`CardFacts.svelte`) are places and times of the thing described, not history; the date `2026-11-17` appears only in `docs/HELP.md` as an example of the Next line, as the brief words it. No comment or test title compares with an earlier state.

Names changed, grepped across `src tests config docs README.md`: `grep -rn "daysLeft\|nextLine\|recordTable\|laneGlyph\|wordGlyph\|computeGlyph"` lists only `career.ts`, `card.ts`, `focus.ts:61` (its doc comment), `CardFacts.svelte`, `CareerPanel.svelte` and `LaneHead.svelte`; `daysLeft` is now local to `career.ts`.

## Files (from `git diff --numstat`, added and removed lines)

- `config/catalogs/glyphs.yml` +1, `config/catalogs/icons.yml` +1 (the `build` rows after `idea`).
- `config/catalogs/vocab.yml` +11 -11 (lines 171 and 173-182).
- `config/options/catalogs/vocab.yml` +4 -1 (lines 149, 153-155).
- `config/text/views/boards/focus.yml` +12 -5 (the `career_` keys, lines 8-23 after the change; nothing below line 24).
- `config/text/views/boards/project.yml` +8 (the card keys `chip_tip`, `code_tip`, `compute_tip`, `form_tip`, `lane_tip`, `lead_tip`, `repro_tip`, `venue`).
- `config/options/sources.yml` +1 -1 (line 74), `config/defaults/sources.yml` +1 -1 (line 52).
- `docs/HELP.md` +2 -2 (lines 287-288), `docs/templates.md` +2 -2 (lines 92 and 1415).
- `docs/diagrams/layer-views.dot` and `.svg` +4 -4 each, `layers.dot` and `.svg` +2 -2 each, `writes.dot` +34 -34, `writes.svg` +91 -91 (regenerated by `npm run diagrams`).
- `src/lib/data/model/model-collections.ts` +3 -3 (198-200), `src/lib/data/shapes/catalog-files/vocab.ts` +6 -3 (28-38), `src/lib/data/snapshot/normalise-parts/career.ts` +7 -7 (1-6 and 57).
- `src/lib/state/boards/board/presets.ts` +8 -2 (97-107), `src/lib/state/boards/career.ts` +88 -27, `src/lib/state/boards/focus.ts` +11 -5 (58-67 and 158-176).
- `src/lib/views/boards/focus/career/CareerPanel.svelte` +158 -124, `src/lib/views/boards/focus/lanes/LaneHead.svelte` +11 -8, `src/lib/views/boards/focus/lanes/Lanes.svelte` +1 -1 (line 226).
- `src/lib/views/shared/card/card.ts` +36 -4 (outside the write list, below).
- `src/lib/views/shared/card/project/CardFacts.svelte` new, 82 lines; `CardStatus.svelte` deleted, 23 lines; `CardLinks.svelte` +23 -5; `ProjectCard.svelte` +13 -42.
- `tests/fixtures/hubs/demo/.oculus/data/academic/career.yml` +1 -1 (line 1).

Outside the write list:

- `src/lib/views/shared/card/card.ts`: item 3 puts the compute glyph choice in "a function of `src/lib/views/shared/card/card.ts` or the state layer", and the write list does not hold it. It holds `laneGlyph`, `wordGlyph` and `computeGlyph`. `laneGlyph` is read by `LaneHead.svelte` as well as the card, since `Lanes.svelte` may change only line 226 and `focus.ts` only its two ranges, neither of which holds the import of `hasGlyph` a state-layer guard would need. O69's and O71's write lists, as the dispatch names them, do not hold `card.ts`.
- `src/lib/data/snapshot/normalise-parts/career.ts` lines 4-6: the brief names lines 1-3; the paragraph runs to line 6 and is rewrapped whole at 100 columns, as `spec.md` asks of an edited comment.
- `docs/diagrams/writes.dot` and `.svg` name `catalog-files/vocab.ts` line numbers, which O69 and O71 shift too; they conflict at a merge and are made again by `npm run diagrams`.

## Judgment calls the brief left open (each reversible)

1. The fact glyph guards live in `card.ts` (above). `LaneHead`'s `glyph` prop is now required, since both callers pass one, and every name it is given goes through `laneGlyph`, so a Band column's glyph is guarded the same way.
2. The fallback glyph names `focus` and `tag` and the Venue line's `venue` are literal glyph names in code (`card.ts`, `CardLinks.svelte`), as `ProjectCard.svelte` writes `'copy'` and `'chat'`; the brief adds no glyph key for them. The compute fallback reads `project.card.hpc_glyph` (`hpc`), the key `resourceGlyph` reads for a cluster.
3. `project.card.repro_tip` "Reproduced" is a new key as the brief names it, beside the existing `project.card.reproduced` "Reproduced" that `CardDetails.svelte:82` reads; the two hold the same words for two uses.
4. The form among `item.chips` is the first entry when `item.project.form` is set, since `items.ts:158` builds the list as `[form, ...chips]`; comparing words would mislabel a chip that shares the form's word. The chip loop is keyed by place and word.
5. `nextLine` draws the milestone alone when its day does not parse; the model already drops such a day (`Career.milestoneDate`, `model-collections.ts`), so the branch is not reached from a snapshot.
6. The track record table: columns keyed `label`, `record:<key>` and `count`, rows keyed by their place (`at`), so a role or record row with any key, the empty one included, never collides with another column or row; the count columns are `numeric` (right-aligned, the numeric font), the first column draws the role's words in the facts' label look through the `cell` snippet, and the table sits in a box with `overflow-x: auto`, which `Table.svelte`'s own doc names for a table in a narrow box.
7. The column's least width is 240px at the text scale, written as `min(..., 100%)` so a column never overflows a pane narrower than that.
8. `HELP.md:287` and `:288` are long bullets already; the changed sentences stay inside them rather than as new short bullets, since the brief names these two lines and O69 writes the bullets after `:290`.
9. The demo fixture's line 1 and `config/defaults/sources.yml:52` named the file "Career strategy" as a label; both now name it the career file.

## Host- or user-visible changes, before and after (for the look on TEST)

- Project board card (Projects view) and the same card in the project view: before, the top row read Lead, the lane with no glyph, the form and chips, code, reproduced, compute and the venue's text, with no hover title. After, the row reads Lead (author glyph), the lane with its lane glyph (Review: hourglass), the form and the chips (a form or chip with no icon draws the tag glyph), code (package glyph), reproduced (check), each compute resource (its kind's glyph, hpc for another kind); resting the pointer on each shows "Role: Lead", "Focus lane: Review", "Form: journal article", "Status: parked (not being worked)", "Code: deposited", "Reproduced", "Compute: <name>". The facts take no tab stop. The venue is gone from the row and stands as the last cross-link line, VENUE with the diamond glyph and its whole text wrapping, with no press; a project with no venue has no such line.
- Focus board lanes: each lane heading draws its glyph before its name (Run zap, Push pen-line, Revise pencil, Review hourglass, Blocked ban, Backburner moon, Scope compass, De-risk flag, Build hammer, Idea lightbulb). Under a terminal theme Push and Revise both draw `[e]`. The Funding, Jobs and Teaching column headings are unchanged. The lane card's move menu and the board's list mode are unchanged.
- Career banner, folded: before, the heading read the file's title and "Next: <milestone> (<day>)"; after, it reads Career and nothing else, the control named "Unfold Career".
- Career banner, unfolded: before, Situation, Goal, the milestone in an orange-edged box with a date box and a days tag, Order of work and Track record stacked. After, the columns Goal (flag), Next (calendar), Situation (info), Order of work (list) and Track record (book) side by side on a wide pane, each headed in the command center's group heading look, wrapping under one another on a narrow pane; Next is one plain line, "FWO Senior on 2026-11-17, in 24 days"; Track record is a table with an empty first heading and the record rows held as headings, a row per role and a last row Funding obtained. The table's heading row is `Table.svelte`'s own: a panel-coloured strip with muted capitals, which over the banner's chip background reads as a band of another colour; the look decides whether that stands.
- The settings form for `focus_lanes` (Settings, Vocabulary) gains a glyph field `icon` on each lane row.

## Anything in the brief that was wrong or impossible

- Verify item 4 cannot print nothing. After the last change `grep -rn "CardStatus\|foldedLine\|career_next\b\|career_next:\|career_milestone\|career_funding\b\|career_funding:\|career_record_line\|class=\"venue\"\|Career strategy" src tests config docs --exclude=local.yml` printed:
  - `tests/server/edit/writes.test.ts:339:    'title: Career strategy',`
  - `tests/server/edit/writes.test.ts:441:    const NO_SCHEMA = 'title: Career strategy\nmilestone: Veni 2026\n';`
  - `tests/state/forms/page-entry.test.ts:48:    title: 'Career strategy',`
  - `tests/state/forms/page-entry.test.ts:192:            title: 'Career strategy',`
  - `tests/fixtures/hubs/demo/.oculus/data/academic/career.yml:2:title: Career strategy`
  - `tests/routes/edit/undo/undo.test.ts:698:        const second = await made(into, { kind: 'career', fields: { title: 'Career strategy' } });`
  - `tests/routes/edit/undo/undo.test.ts:700:        expect(career()).toContain('title: Career strategy');`
  - `tests/routes/edit/undo/undo.test.ts:705:        expect(career()).toContain('title: Career strategy');`
  - `tests/data/sources/career.test.ts:19:const CAREER = `title: Career strategy`
  - `tests/data/sources/career.test.ts:72:        expect(held?.title).toBe('Career strategy');`
  - `docs/templates.md:1433:title: Career strategy`
  Each is the career file's `title:` value, which the model keeps for the editor's page (`page-entry.ts:200`); none names the banner, and every one is outside the write list. Renaming the title in test inputs, the fixture's data and the template example would change data, not a false sentence, so it is left for the orchestrator's ruling.
- The brief's "What is on the tree" says `LaneHead` takes an optional glyph drawn while defined; after this step it takes a required one (judgment call 1).

## Limitations and sharp edges

- The hover titles are for the pointer only: a fact's `Tooltip` has no tab stop and no control inside it, so `describedControl` (`tooltip-rules.ts`) puts no `aria-describedby` anywhere and a screen reader reads each fact's own words without its kind (decision 10 of the brief).
- `Table.svelte`'s header cells keep `white-space: nowrap`, so a long record-row label widens the table; the box scrolls sideways inside the column rather than wrapping the heading.
- `LaneHead.svelte` imports `views/shared/card/card.ts`, which also carries the card's opening helpers; the boundaries check passes (`Tests  11 passed (11)`), and the import is wider than the one function it needs.
- Not verified on screen: every drawing and the grid's wrap points (cases 1, 5, 6, 9, 11, 14, 15, 16) are left to the look on landing, as the brief says.
