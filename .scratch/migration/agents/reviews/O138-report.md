# Step O138 report: an `interview` and an `offered` status oculus offers

Everything in the brief is done, with the two rulings of `agents/briefs/O138-cases.md` (664 (a) and 663 (a)) built in.

## Open items of the state file, verbatim

From `.scratch/migration/orchestrator-state.md` lines 193-199 of the worktree's copy of the ledger (`sed -n 193,199p`). Both items are ruled (a) in `agents/briefs/O138-cases.md`, and this step builds those rulings; the worktree's copy of the state file still lists them, since the state file is the orchestrator's.

> - Open item 664 (2026-11-03, O138, from O138's brief check, finding I1): `interview` and `offered` carry `closes_deadline` as ruled, and no `live_subtasks`, so once an application is at interview or offered its follow-up notes and subtasks leave the Focus radar (`src/lib/state/boards/ticker.ts:461-466` and `:522-527`), as an `applied` entry's do today; `ongoing` carries `live_subtasks: true` (`config/catalogs/vocab.yml:136`) to keep its own. (a) Both carry `live_subtasks: true`, so the preparation for an interview and the follow-up of an offer stay on the radar; `applied` unchanged; one word on each row, set at O138's landing. Pros: the tasks that matter most at those stages stay in view. Cons: a follow-up an entry no longer needs stays until it is ticked. (b) `interview` only. Cons: an offer's follow-ups leave the radar. (c) Neither, as built: the lazy option. Recommended (a), a judgment.
> - Open item 663 (2026-11-03, O137 and O138, from Axel's question on 660): once O137 lands, every collection whose `sort:` starts with `status` draws its cards in the order of its file's own status options, and six do (statements, funding, events, education, applications, tasks; O137's brief item 3). Applications is ruled (660 (a)). In the research hub's files, events (`[upcoming, planned, completed, cancelled, not-attending]`, talks among them, `role: present`), funding (`[in-prep, planned, submitted, contributing, awarded, rejected, withdrawn]`) and statements (`[draft, ready]`) already draw the live entries first. Education (`[planned, ongoing, completed]`, `.oculus/data/academic/education.yml:9`) draws its 7 planned entries before its 2 ongoing ones, and tasks (`[todo, doing, done, dropped]`, `tasks.yml:10`) draws todo before doing. (a) At O138's landing the hub's `education.yml` options become `[ongoing, planned, completed]` and `tasks.yml`'s `[doing, todo, done, dropped]`, and the templates take the same orders (`docs/templates.md:1505` and `:1600`, added to O138's paths), so every status-sorted list starts with what is in progress. Pros: the work under way is on top in every list. Cons: two template lines and two hub lines more in O138. (b) No change: the lazy option. Recommended (a), a judgment.

## Rulings this step carries

- Ruling 664 (a) (`agents/briefs/O138-cases.md` item 1): `interview` and `offered` carry `live_subtasks: true` beside `closes_deadline` and `deadline_met`. C8 reads: the entry's own deadline line leaves the radar, and its follow-up note and subtask stay; an `applied` entry's leave, as on the base.
- Ruling 663 (a) (`agents/briefs/O138-cases.md` item 2): the Education template's options read `[ongoing, planned, completed]` and its comment `# required: ongoing, planned or completed`; the Tasks template's options read `[doing, todo, done, dropped]` and its comment `# required: doing, todo, done or dropped`, each in its own column. C7 covers both.
- The research hub's `education.yml`, `tasks.yml` and `applications.yml` are untouched (item 3 of the same file); the diff holds no hub data path (`diff -rq` below).

## The case-run program

It lives in the session scratchpad at `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o138/`, two files. It runs under vitest so the rune of `src/lib/state/shared/words/generation.svelte.ts` compiles, with its own configuration naming only the program. It plants its hubs in the scratchpad and removes them in `finally` (`ls` of the folder after each run shows only `cases.config.mts`, `cases.test.mts` and the brief check's `probe.mts`). It asserts nothing and writes nothing in the worktree.

Command, from the worktree root:

```
npx vitest run --config /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o138/cases.config.mts
```

`cases.config.mts`:

```ts
// The vitest configuration of the O138 case-run program: the worktree as root, the Svelte plugin so
// the rune of state/shared/words/generation.svelte.ts compiles, and the one program file.
const W = process.env.O138_TREE ?? '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O138';
const { defineConfig } = await import(`${W}/node_modules/vitest/dist/config.js`);
const { svelte } = await import(`${W}/node_modules/@sveltejs/vite-plugin-svelte/src/index.js`);
const HERE = new URL('.', import.meta.url).pathname;

export default defineConfig({
    root: W,
    plugins: [svelte({ configFile: false })],
    test: { include: [`${HERE}cases.test.mts`], reporters: ['dot'], silent: false }
});
```

`cases.test.mts`:

```ts
// The O138 case-run program. It prints the result of each case of the brief for oculus's own config
// (loadConfig(engineDir())) and a hub planted in this scratch folder, removed again at the end. It
// asserts nothing and writes nothing in the worktree.
import { it } from 'vitest';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const W = process.env.O138_TREE ?? '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O138';
const HERE = new URL('.', import.meta.url).pathname;
const { engineDir, loadConfig, textCatalog } = await import(`${W}/src/lib/data/sources/config.ts`);
const { setCatalog } = await import(`${W}/src/lib/state/shared/words/text.ts`);
const { HUB_FILE, bareId } = await import(`${W}/src/lib/data/helpers/hub-names.ts`);
const { READER_FINDINGS } = await import(`${W}/src/lib/data/sources/config/sections/findings.ts`);
const { portfolioConfigFrom, readHub, builtHub, workspaceVocabs } = await import(
    `${W}/src/lib/data/index.ts`
);
const { createChecker } = await import(`${W}/src/lib/data/snapshot/schema/check.ts`);
const { closestWord } = await import(`${W}/src/lib/data/shapes/vocab-keys.ts`);
const { ticker } = await import(`${W}/src/lib/state/boards/ticker.ts`);
const { waiting } = await import(`${W}/src/lib/state/boards/focus.ts`);
const { collectionLanes, stagedEntries } = await import(
    `${W}/src/lib/state/boards/focus/focus-lanes.ts`
);
const { setVocab, statusTone, toneOf } = await import(`${W}/src/lib/state/shared/words/tones.ts`);

const OWN = loadConfig(engineDir());
const RAW = OWN.config as Record<string, unknown>;
const CONFIG = portfolioConfigFrom(RAW);
const FILE = '.oculus/data/academic/applications.yml';

/** A hub in this scratch folder holding the applications file `text`. */
function plant(text: string): string {
    const hub = mkdtempSync(join(HERE, 'hub-'));
    mkdirSync(join(hub, 'projects/active'), { recursive: true });
    mkdirSync(join(hub, '.oculus/data/academic'), { recursive: true });
    writeFileSync(join(hub, FILE), text);
    return hub;
}

/** The snapshot of the hub at `hub`, built as tests/fixtures/hubs/hub-build.ts builds one. */
function build(hub: string) {
    const read = readHub(hub, CONFIG, [], 'lab');
    return builtHub(read, { version: 0, checker: createChecker(), engine: null, workspace: null, others: {} })
        .snapshot;
}

/** One entry of the applications file, with a past deadline, a follow-up and a subtask. */
function entry(key: string, status: string): string {
    return [
        `  - key: ${key}`,
        `    title: ${key}`,
        `    status: ${status}`,
        '    deadline: 2026-10-01',
        `    followup: [ { do: "write to ${key}" } ]`,
        `    subtasks: [ { do: "prepare ${key}" } ]`
    ].join('\n');
}

/** An applications file whose `status` options are `options`, with `entries`. */
function file(options: string[], entries: string[]): string {
    return [
        'title: Applications',
        'schema:',
        '  - { field: key, type: text, primary_key: true, required: true }',
        '  - { field: title, type: text, display: 1, required: true }',
        `  - { field: status, type: select, options: [${options.join(', ')}], required: true }`,
        '  - { field: deadline, type: date }',
        'entries:',
        ...entries,
        ''
    ].join('\n');
}

const made: string[] = [];

it('O138 cases', () => {
    const out: string[] = [];
    const say = (line: string) => out.push(line);
    try {
        const { vocabs } = workspaceVocabs({ name: null, dir: null }, OWN, [], (dir: string) =>
            loadConfig(engineDir(), { hub: dir }), { folders: [], own: RAW });
        setVocab(vocabs);
        setCatalog(textCatalog(RAW));

        // C1, C2, C3, C8, C9, C10: a hub whose schema offers the new words.
        const hub = plant(
            file(['active', 'applied', 'interview', 'offered'], [
                entry('at-interview', 'interview'),
                entry('at-offered', 'offered'),
                entry('at-applied', 'applied')
            ])
        );
        made.push(hub);
        const snap = build(hub);
        const now = Date.parse('2026-11-03T12:00:00Z');
        const tick = ticker(snap, RAW, now);
        const wait = waiting(snap, RAW, {});
        const band = collectionLanes(snap, RAW);
        const ofKey = Object.values(snap.entities.collections).filter(
            (one: { id: string }) => bareId(one) === 'applications'
        );
        // rail-badges.svelte.ts:279-287 `openCount`, with the collections of the key given directly.
        const counted = new Set(
            stagedEntries(ofKey, 'position_stages', RAW).flatMap((stage: { held: { entry: { id: string } }[] }) =>
                stage.held.map((one) => one.entry.id)
            )
        );
        say(`openCount (applications) = ${counted.size}`);
        const collection = ofKey[0] as { entries: { id: string; title: string; fields: Record<string, unknown> }[] };
        for (const one of collection.entries) {
            const status = String(one.fields.status);
            const radar = [...tick.overdue, ...tick.deadlines].filter(
                (line: { target?: { id?: string; kind?: string } }) =>
                    line.target?.id === one.id && line.target?.kind === 'entry'
            );
            const tasks = tick.tasks.filter((line: { target?: { id?: string } }) => line.target?.id === one.id);
            const kinds = tasks.map((line: { kind: string; label: string }) => `${line.kind} "${line.label}"`).sort();
            const stack = band.applications.filter((stage: { items: { id: string }[] }) =>
                stage.items.some((item) => item.id === one.id)
            );
            const cards = stack.flatMap((stage: { items: { id: string; deadline?: string }[] }) =>
                stage.items.filter((item) => item.id === one.id)
            );
            say(`[${status}] radar deadline line: ${radar.length > 0 ? radar.map((line: { kind: string; label: string; days: number | null }) => `yes, ${line.kind} "${line.label}" ${line.days}d`).join(', ') : 'no'}`);
            say(`[${status}] awaiting box applications: ${wait.applications.some((a: { id: string }) => a.id === one.id) ? 'yes' : 'no'}`);
            say(`[${status}] Job applications stack: ${stack.map((s: { label: string; color: string }) => `${s.label} ${s.color} (${toneOf(s.color)})`).join(', ') || 'none'}`);
            say(`[${status}] counted in openCount: ${counted.has(one.id) ? 'yes' : 'no'}`);
            say(`[${status}] statusTone: ${statusTone(status)}`);
            say(`[${status}] band card countdown: ${cards.length === 0 ? 'no card' : cards.map((c: { deadline?: string }) => c.deadline ?? 'none').join(', ')}`);
            say(`[${status}] tasks-section lines (follow-up, subtask): ${kinds.join(', ') || 'none'}`);
        }

        // C4: a hub's statuses take `interview` out.
        const hubPath = '/scratch/lab';
        const read = loadConfig(engineDir(), {
            hub: hubPath,
            instead: { layer: 'hub', name: HUB_FILE, text: 'statuses: { interview: null }\n' }
        });
        const where = { engine: engineDir(), hub: hubPath, from: read.from };
        const findings = [
            ...read.findings,
            ...READER_FINDINGS.flatMap((reader: (a: unknown, b: unknown) => unknown[]) => reader(where, read.config))
        ];
        const rows = read.config.position_stages as { label: string }[];
        say(`C4 Interview row: ${JSON.stringify(rows.find((row) => row.label === 'Interview') ?? null)}`);
        say(`C4 findings: ${findings.length}`);
        for (const f of findings as { key: string; message: string }[]) say(`C4 finding: ${f.key} | ${f.message}`);

        // C5: the closest word of a near miss.
        const words = Object.keys(RAW.statuses as Record<string, unknown>);
        say(`C5 closestWord('interveiw') = ${closestWord('interveiw', words) ?? 'none'}`);
        const near = plant(file(['active', 'applied', 'interview', 'offered'], [entry('typo', 'interveiw')]));
        made.push(near);
        for (const f of build(near).findings.filter((one: { key: string }) => one.key === 'entries[0].status')) {
            say(`C5 finding: ${f.message}`);
        }

        // C6: a schema that does not offer `interview`, an entry set to it.
        const narrow = plant(file(['active', 'applied'], [entry('narrow', 'interview')]));
        made.push(narrow);
        for (const f of build(narrow).findings.filter((one: { key: string }) => one.key === 'entries[0].status')) {
            say(`C6 finding: ${f.message}`);
        }
    } finally {
        for (const dir of made) rmSync(dir, { recursive: true, force: true });
        console.log(out.join('\n'));
    }
});
```

How to read its lines: "radar deadline line" is the entry's own line in the ticker's `overdue` or `deadlines` (`ticker.ts:326-345`, skipped at `:328`); "awaiting box applications" is `waiting(...).applications` (`focus.ts:713-718`, `deadlineMet` at `:223-224`); "Job applications stack" is the stage of `collectionLanes(...).applications` holding the card (`focus-lanes.ts:231-261`, `stagedEntries` at `:165-187`) with `toneOf` of its colour (`tones.ts:198-200`); "counted in openCount" is the expression of `openCount` (`rail-badges.svelte.ts:279-287`) over the snapshot's collections of key `applications`, since the store itself needs a client; "statusTone" is `tones.ts:229-232` under oculus's own words installed by `setVocab`; "band card countdown" is the `deadline` of the band card (`focus-lanes.ts:207-217`, the test at `:211`), "none" meaning the card draws no countdown; "tasks-section lines" are the ticker's `tasks` lines of the entry, a follow-up line of kind `followup` (`ticker.ts:456-480`) and a subtask line whose kind is the entry's `kind` field, empty here (`ticker.ts:518-540`).

## The cases' first run, on the unchanged tree

Output of the command above before any change (the lines between the vitest header and summary; summary "Tests  1 passed (1)"):

```
openCount (applications) = 1
[interview] radar deadline line: yes, position "at-interview" -33d
[interview] awaiting box applications: no
[interview] Job applications stack: none
[interview] counted in openCount: no
[interview] statusTone: grey
[interview] band card countdown: no card
[interview] tasks-section lines (follow-up, subtask):  "at-interview: prepare at-interview", followup "at-interview - write to at-interview"
[offered] radar deadline line: yes, position "at-offered" -33d
[offered] awaiting box applications: no
[offered] Job applications stack: none
[offered] counted in openCount: no
[offered] statusTone: grey
[offered] band card countdown: no card
[offered] tasks-section lines (follow-up, subtask):  "at-offered: prepare at-offered", followup "at-offered - write to at-offered"
[applied] radar deadline line: no
[applied] awaiting box applications: yes
[applied] Job applications stack: Applied #0891b2 (cyan)
[applied] counted in openCount: yes
[applied] statusTone: cyan
[applied] band card countdown: none
[applied] tasks-section lines (follow-up, subtask): none
C4 Interview row: null
C4 findings: 1
C4 finding: statuses.interview | statuses sets interview to null, which oculus's map does not hold
C5 closestWord('interveiw') = none
C5 finding: status "interveiw" is not a word of the statuses list
C5 finding: entries[0].status is interveiw, which is not one of active, applied, interview, offered
C6 finding: status "interview" is not a word of the statuses list
C6 finding: entries[0].status is interview, which is not one of active, applied
```

- C1 (interview, past deadline): on the radar 33 days overdue, not in the awaiting box, in no stack of the Job applications column, not counted in the badge. The base offers no `interview` word, so every reader treats it as an unknown status.
- C2 (offered): the same as C1.
- C3 (applied): off the radar, in the awaiting box, in the Applied stack in cyan, counted.
- C4 (`statuses: { interview: null }`): no Interview row, and one finding: `statuses sets interview to null, which oculus's map does not hold`.
- C5 (`interveiw`): `closestWord` gives none; the entry's vocabulary finding is `findings.validate.status_unknown` (`config/text/findings.yml:371`), with no closest word.
- C6 (schema without `interview`, entry at `interview`): two findings, `findings.validate.status_unknown` (`findings.yml:371`) and `findings.schema.not_allowed` (`findings.yml:323`), as the brief expects on the base.
- C7 (templates, read): `docs/templates.md:1560` read `[not-applied, active, accepted, rejected, declined, withdrawn, applied]` with the comment at :1577-1578 in the same order; :1505 read `[planned, ongoing, completed]` with :1538 `# required: planned, ongoing or completed`; :1600 read `[todo, doing, done, dropped]` with :1612 `# required: todo, doing, done or dropped`. The Make reader writes the block under each heading as the page has it (`src/lib/data/sources/documents/templates.ts:8-14`).
- C8 (follow-up and subtask): at `interview` and `offered` both lines are on the radar (the status is unknown, so `closesDeadline` is false at `ticker.ts:463` and `:524`); at `applied` both leave.
- C9 (status chip): grey for `interview` and `offered`, the unknown tone; cyan for `applied`.
- C10 (band card countdown): no card for `interview` and `offered`, since no stage holds them; the `applied` card draws no countdown.

No case is one the brief's rules get wrong: each first-run result is what the base's vocabulary gives, and the expected results after the change follow the rule over `statuses:` (`vocab.yml:101-108`) and the rule over a hub's `<word>: null` (`vocab.yml:4`).

## DONE / NOT DONE

| Item | State | Command | Output |
| --- | --- | --- | --- |
| 1. `statuses:` gains `interview` and `offered` after `applied`, with `live_subtasks: true` (ruling 664 (a)) | DONE | `grep -n "  applied:\|  interview:\|  offered:" config/catalogs/vocab.yml` | `154:  applied:       { color: "#0891b2", closes_deadline: true, deadline_met: true }`, `155:  interview:     { color: "#7c3aed", closes_deadline: true, deadline_met: true, live_subtasks: true }`, `156:  offered:       { color: "#0d9488", closes_deadline: true, deadline_met: true, live_subtasks: true }` (and `167:` the `lead_statuses` `applied`, untouched) |
| 2. `position_stages` gains Interview and Offered after Applied | DONE | `grep -n "label: \"Active\"\|label: \"Applied\"\|label: \"Interview\"\|label: \"Offered\"" config/catalogs/vocab.yml` | `203:  - { label: "Active",    color: "#16a34a", statuses: [active] }`, `204:  - { label: "Applied",   color: "#0891b2", statuses: [applied] }`, `205:  - { label: "Interview", color: "#7c3aed", statuses: [interview] }`, `206:  - { label: "Offered",   color: "#0d9488", statuses: [offered] }` |
| 3. Applications template options and comment | DONE | `git diff -U0 docs/templates.md` | `+  - { field: status,   type: select,   options: [active, applied, interview, offered, accepted, not-applied, declined, rejected, withdrawn], required: true, section: Core, help: "Where it stands." }`, `+#    status: active               # required: active, applied, interview, offered, accepted,`, `+#                                 # not-applied, declined, rejected or withdrawn`; `awk` lengths `1577: 92 cols`, `1578: 80 cols` |
| Ruling 663 (a): Education and Tasks templates | DONE | `git diff -U0 docs/templates.md` | `+  - { field: status,   type: select,   options: [ongoing, planned, completed], required: true, section: Core, help: "Where it stands." }`, `+#    status: ongoing              # required: ongoing, planned or completed`, `+  - { field: status,   type: select,   options: [doing, todo, done, dropped], required: true, section: Core, help: "Where it stands." }`, `+#    status: todo                 # required: doing, todo, done or dropped` |
| 4. `docs/HELP.md:296` parenthesis | DONE | `git diff -U0 docs/HELP.md` | the line now holds ``(`submitted`, `under-review`, `applied`, `interview` and `offered` in oculus's)`` |
| 5. Nothing under `src/` changes | DONE | `diff -rq` of `config docs src tests utils` against the base copy | three lines: `config/catalogs/vocab.yml`, `docs/HELP.md`, `docs/templates.md` differ; nothing under `src/` |
| Verify 1: the test files that read `statuses` or `position_stages` | DONE | `npx vitest run tests/data/sources/config/layers/hub-vocab.test.ts tests/data/snapshot/schema-rules.test.ts tests/checks/config/config-folder.test.ts tests/data/shapes/catalog-files/vocab.test.ts tests/data/sources/config/layers/manifest-fields.test.ts tests/data/sources/feeds.test.ts tests/state/forms/new-entry.test.ts tests/state/shared/hub-words.test.ts tests/state/workbench/count-row.test.ts --reporter=dot` | `Test Files  9 passed (9)`, `Tests  177 passed \| 2 skipped (179)`; the 2 skipped are `config-folder.test.ts:643` and `:819`, `it.skipIf(!REAL.asked)`, the real-hub cases that skip in a checkout without the hub's folders |
| Verify 2: `npm run diagrams`, then `npm run test:quick` once | DONE | `npm run diagrams`; `npm run test:quick` | diagrams rewrote no tracked file (`git status --short` after it: the three changed files and the orchestrator's `O138-cases.md`); quick: `test:quick: 4 changed file(s), from git since HEAD` (the three files and the orchestrator's untracked `O138-cases.md`), `ok      prettier (4.2 s): All matched files use Prettier code style!`, `ok      ASCII gate (4.4 s)`, `ok      svelte-kit sync (6.3 s)`, `ok      vitest checks (47.0 s): Duration  5.29s (transform 1.94s, setup 0ms, import 4.97s, tests 23ms, environment 0ms)`, `ok      svelte-check (61.4 s): 1793735990246 COMPLETED 582 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`, `ok      vitest (62.7 s): Duration  20.99s (transform 6.91s, setup 0ms, import 10.60s, tests 10.09s, environment 0ms)`, `test:quick: 69.3 s; every command passed`; its test files were `tests/checks/config/templates.test.ts` and `tests/data/shapes/catalog-files/vocab.test.ts` |
| Verify 3: perl ASCII gate over the three files | DONE | `LC_ALL=C perl -ne 'print "$ARGV:$.: $_" if /[^\x20-\x7E\n]/; close ARGV if eof' config/catalogs/vocab.yml docs/templates.md docs/HELP.md; echo "perl exit $?"` | prints nothing, then `perl exit 0` |
| Verify 4: YAML parse | DONE | `python3 -c "import yaml; yaml.safe_load(open('config/catalogs/vocab.yml'))"; echo "yaml exit $?"` | `yaml exit 0` |
| Unused exports | DONE | `sh utils/unused-exports.sh` compared with `diff` against `O138-base/unused-exports.txt` | `diff exit 0`, no line added (335 lines, as the base) |

The list ran once. No whole-suite command was run. The step adds and changes no test.

## The cases after the change

Output of the same command after the last change (summary "Tests  1 passed (1)"):

```
openCount (applications) = 3
[interview] radar deadline line: no
[interview] awaiting box applications: yes
[interview] Job applications stack: Interview #7c3aed (purple)
[interview] counted in openCount: yes
[interview] statusTone: purple
[interview] band card countdown: none
[interview] tasks-section lines (follow-up, subtask):  "at-interview: prepare at-interview", followup "at-interview - write to at-interview"
[offered] radar deadline line: no
[offered] awaiting box applications: yes
[offered] Job applications stack: Offered #0d9488 (teal)
[offered] counted in openCount: yes
[offered] statusTone: teal
[offered] band card countdown: none
[offered] tasks-section lines (follow-up, subtask):  "at-offered: prepare at-offered", followup "at-offered - write to at-offered"
[applied] radar deadline line: no
[applied] awaiting box applications: yes
[applied] Job applications stack: Applied #0891b2 (cyan)
[applied] counted in openCount: yes
[applied] statusTone: cyan
[applied] band card countdown: none
[applied] tasks-section lines (follow-up, subtask): none
C4 Interview row: {"label":"Interview","color":"#7c3aed","statuses":[]}
C4 findings: 0
C5 closestWord('interveiw') = interview
C5 finding: status "interveiw" is not a word of the statuses list; the closest word is interview
C5 finding: entries[0].status is interveiw, which is not one of active, applied, interview, offered
C6 finding: entries[0].status is interview, which is not one of active, applied
```

- C1: not on the radar, in the awaiting box, in the Interview stack in `#7c3aed` (purple), counted in the badge. Holds. The look on landing: Focus, an applications entry at `interview` with a past deadline (the hub's UGent entry after the landing edit).
- C2: the same in the Offered stack in `#0d9488` (teal). Holds; look on landing as C1 with `offered`.
- C3: unchanged from the base. Holds.
- C4: the Interview row reads `statuses: []` and no finding is written. Holds.
- C5: `closestWord` gives `interview`, and the entry's finding is `findings.validate.status_not_in_vocab` naming it (`findings.yml:370`). Holds.
- C6: only `findings.schema.not_allowed` stays. Holds.
- C7: read after the change at `docs/templates.md:1505`, `:1538`, `:1560`, `:1577-1578`, `:1600` and `:1612` (the diff in the table above): each holds the ruled order. The Make reader copies the block as the page has it (`templates.ts:8-14`). Holds.
- C8 (ruling 664 (a)): at `interview` and `offered` the deadline line leaves the radar and the follow-up and the subtask stay (`statusFlag(..., 'live_subtasks')` at `ticker.ts:464` and `:525`); at `applied` both leave. Holds.
- C9: `statusTone` gives purple for `interview` and teal for `offered`. Holds; look on landing: the Applications view, the entry's status chip.
- C10: the band card of each draws no countdown (`focus-lanes.ts:211`). Holds; look on landing: the Focus band's Job applications column.

## Files

From `diff -rq` against `/Users/axelfaes/workspace/oculus/.agents/worktrees/O138-base` over `config docs src tests utils`, with `wc -l` and `git diff --numstat`:

| File | Lines (base, now) | Change | In the write list |
| --- | --- | --- | --- |
| `config/catalogs/vocab.yml` | 307, 311 | 6 added, 2 removed | yes: two rows after line 154, and lines 199-202 (the Active and Applied rows re-padded, two rows added) |
| `docs/templates.md` | 1920, 1920 | 7 added, 7 removed | yes: 1505, 1538 (ruling 663), 1560, 1577-1578, 1600, 1612 (ruling 663) |
| `docs/HELP.md` | 620, 620 | 1 added, 1 removed | yes: 296 |
| `.scratch/migration/agents/reviews/O138-report.md` | new | this report | yes |

## New keys and labels

- `interview`: not empty. It stands once among the words of `statuses` (`vocab.yml:155`) and once in a list (`:205`). `grep -rni "interview" src tests docs README.md utils config --exclude=local.yml` prints only `docs/templates.md:1560`, `:1577`, `docs/HELP.md:296`, `config/catalogs/vocab.yml:155` and `:205`, so it is no word of `stages` (from :63) or `lead_statuses` (from :165) and no other key.
- `offered`: not empty. `grep -rn "\`offered\`\|'offered'\|\"offered\"\|offered:\|, offered\|offered\]\|\[offered\|\"Offered\"\|Offered" src tests docs README.md utils config --exclude=local.yml` finds it as a status only at `config/catalogs/vocab.yml:156` and `:206`, `docs/templates.md:1560`, `:1577` and `docs/HELP.md:296`. Every other hit is the English verb or a variable name in `src` and `tests` (`gutter.ts:352`, `prepared-message.ts:8` and so on); none is a word of `stages`, `lead_statuses` or `statuses`.
- Interview and Offered: labels of `position_stages`, which holds Active, Applied, Interview and Offered (`vocab.yml:203-206`), four distinct labels, so the rule that two rows naming one label are a finding (`vocab.yml:4`) is not met. Each label is not empty.
- Two hubs' words: a hub that sets either word to null leaves the row with no word and no finding (C4). A hub that replaces `position_stages` whole keeps its own list (brief check I4).

## Judgment calls

- The Active and Applied rows of `position_stages` are re-padded so the four rows align on `color:`, as the rows of `fund_stages` align on their longest label (`vocab.yml:195-197`). It changes two lines' spacing within the paths 199-202; the parsed values are unchanged (`hub-vocab.test.ts` passes, which compares Applied's parsed row).
- `live_subtasks: true` goes last on each row, after `deadline_met`, as the rulings file dictates.
- The case-run program computes `openCount`'s expression over the snapshot's collections directly, since the rail-badge store is a client store; the expression is the store's own (`rail-badges.svelte.ts:280-286`).

## Names grepped, documents re-read

- `grep -rn "live_subtasks" src tests docs config README.md --exclude=local.yml`: `ticker.ts:415` (the follow-ups comment), `catalog-files/vocab.ts:218`, `config/options/catalogs/vocab.yml:104`, `config/catalogs/vocab.yml:104` and `docs/HELP.md:296` ("An entry whose status keeps its lines live (`live_subtasks`) shows its follow-ups as it shows its subtasks") describe the flag and list no words: still true.
- `grep -rn "not-applied\|position_stages\|Job applications" docs README.md`: `docs/templates.md:493-497` (one Applied row as an example), `docs/HELP.md:564`, `docs/data-map.md:82` and `:109`: still true.
- `grep -rn "planned, ongoing\|todo, doing\|not-applied, active\|declined, withdrawn or applied\|withdrawn, applied" src tests docs README.md utils config --exclude=local.yml`: `tests/fixtures/hubs/demo/.oculus/data/academic/tasks.yml:8` (the demo hub's own options, which do not claim to be oculus's template), `tests/data/shapes/catalog-files/vocab.test.ts:209` and `:274` (the `default_task` finding over `todo, doing`, unrelated to an order) and `config/defaults/layout.yml:322` (the Tasks count's `match: [todo, doing]`, a set): still true.
- `vocab.yml:101-108`, the comment over `statuses:`, describes the flags and lists no words: still true. HELP:296's band-card sentence gives `submitted` as an example: still true.
- History-word grep over the added lines (`git diff -U0 | grep '^+[^+]' | grep -i -E "before|used to|no longer|still|always has been|always had|as before|previously|the step adds|after this package lands|O1[0-9][0-9]|20[0-9][0-9]-"`): one hit, HELP:296, whose match is "Not before date", a field name present on the base line too; the step's added words carry none.

## Host- and user-visible changes, before and after

For the look on landing, over the research hub after the orchestrator's landing edit (the UGent entry set to `interview`, the options extended):

| What | Before | After |
| --- | --- | --- |
| Deadline radar (Focus command center), an application at `interview` or `offered` with a past deadline | an overdue line of the position group | no line |
| Awaiting box, Applications row | not listed | listed by its title |
| Focus band, Job applications column | no card | a card in an Interview stack in purple, or an Offered stack in teal, below Active and Applied |
| Applications view's green badge | not counted | counted |
| Applications view, the entry's status chip | grey | purple (`interview`), teal (`offered`) |
| The band card's countdown | no card | no countdown |
| Follow-up notes and subtasks of such an entry in the Tasks section | shown (unknown status) | shown (`live_subtasks`); an `applied` entry's stay off, as on the base |
| Applications template (Make Folder a Hub) | `[not-applied, active, accepted, rejected, declined, withdrawn, applied]` | `[active, applied, interview, offered, accepted, not-applied, declined, rejected, withdrawn]` |
| Education template | `[planned, ongoing, completed]` | `[ongoing, planned, completed]` |
| Tasks template | `[todo, doing, done, dropped]` | `[doing, todo, done, dropped]` |
| HELP, Focus bullet | `submitted`, `under-review` and `applied` | `submitted`, `under-review`, `applied`, `interview` and `offered` |

## Anything in the brief that was wrong or impossible

Nothing. The brief's "lines 199-202" for `position_stages` holds the comment at 199, the key at 200 and the rows at 201-202 on the base; the step wrote within that range.

## Limitations

- The case program reads every record under oculus's own words (no `wordsOf`), for a single planted hub; the per-hub reading of C1, C2, C9 and C10 in a workspace of several hubs is seen at the look on landing.
- Whether purple `#7c3aed` (c-purple) reads apart from violet `#7c5cff` (c-violet) in each theme is not measured; no stack of the Job applications column uses violet.
