# O137 builder report

Everything in the brief is done, and the nine items of repair round 1 are made. After the round's last change check 1 printed `Test Files  50 passed (50)` and `npm run test:quick` printed `test:quick: 351.1 s; every command passed` (section "Repair round 1"). The checks 1 and 2 quoted under "DONE / NOT DONE" are the runs before the round, whose red lines were timeouts in three unchanged files. Two findings for the orchestrator are in "Repair round 1", item 2: the new `sortFindings` in `run.ts` shares its name with `validate.ts`'s exported `sortFindings`, and `sortText` could take its text case from `filledText`. Neither was changed, because the round makes only its nine ruled changes.

## Open items of the state file (verbatim, `.scratch/migration/orchestrator-state.md` lines 185-186)

- Open item 660 (2026-11-03, O137 and O138, from O137's brief check): once O137 lands, a collection's cards go by its `sort:`, and applications by `[status, deadline]`, a status in the order of the file's own status options. The research hub's `.oculus/data/academic/applications.yml` lists them as not-applied, active, accepted, rejected, declined, withdrawn, applied, so the nine not-applied entries are drawn first and the applications waiting on an answer (applied, and interview and offered once O138 adds them) last, after rejected and withdrawn. O138's landing already writes that list, adding `interview` and `offered`. (a) O138's landing also reorders the list: active, applied, interview, offered, accepted, not-applied, declined, rejected, withdrawn, so live applications come first, then the accepted, then those not applied for, then the closed ones. Pros: the cards that need you are on top. Cons: none in oculus; the order is your data. (b) O138's landing adds `interview` and `offered` after `applied` and keeps the rest as it is. Cons: the live applications stay at the bottom of the Applications view. (b) is the lazy option. Recommended: (a), my judgment.
- Open item 661 (2026-11-03, every step, from O137's brief check): the rules file `.scratch/migration/agents/spec.md:36` says "You never edit anything under `.scratch/`", while every brief names the builder's report path `.scratch/migration/agents/reviews/<step>-report.md` and the builder writes it in the worktree's copy of the ledger, as `plan-orchestration` Steps 4 ("In the ledger it writes only its report, at the path the brief names in the worktree's copy of the ledger") says; every step from O130 to O136 did so. Until you rule, the builders go on writing their report there, as every step so far has. (a) `spec.md:36` gains the exception: "You never edit anything under `.scratch/` but your report, at the path the brief names in the worktree's copy of the ledger." Pros: the rule and the practice agree; no change to how a step runs. (b) the builder writes its report to its session scratchpad and the orchestrator copies it into the ledger. Pros: the rule stands as written. Cons: a briefing and a copy rule change for every step, and the report is no longer beside the step's work in the worktree. (c) no change: the lazy option; the rules file stays false about what every builder does. Recommended: (a), my judgment.

## The ruling this step ran under (`.scratch/migration/agents/briefs/O137-cases.md`, verbatim)

1. C13's second sentence reads: "A hub whose own list names no literature entry reads oculus's literature entry (`src/lib/data/index.ts:199-202`), and so its `sort: [title]`. A hub whose own list names no people or funding entry has no card list of either, so there is nothing of it to sort." The first sentence is unchanged. A card list for a hub that names no people or funding entry is no part of this step, whose goal is the order of the cards a collection draws.
2. C17's Add reads: "an Add on such a collection: the new entry is drawn in its sorted place, and the card cursor stays on the card it was on." The status change and the pin are unchanged.
3. The paths this step writes gain `src/lib/server/files/project/make.ts` lines 17-18: its head comment lists what each template line sets for an entry, and item 3 adds `sort:` to those lines, so the list names its sort.
4. C18's slices are taken at `src/lib/state/boards/board/bar.ts:467`, not :466; the expected result is unchanged.

The file is at `src/lib/state/boards/collection/bar.ts` (`find src -name bar.ts` prints only that path); line 467 is `const words = [...countsOf(entries, statusRule).keys()].filter((one) => one !== '');`, the line the ruling means.

## The case-run program

It runs under vitest with a scratch config, since `src/lib/state/boards/collection/index.ts` uses `$state` and does not load under plain node. Command, from the worktree root: `CASE_OUT=<file> npx vitest run --config /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o137/vitest.case.config.mjs`. It reads the research hub's files only through `readYamlMap`, plants its scratch hubs under its own folder and removes them at the end. On the unchanged tree it orders by `pinnedFirst`, the order the cards were drawn in there, since `cardOrder` does not exist yet.

`vitest.case.config.mjs`:

```js
// The config the case-run of step O137 runs under: the worktree's own vite config, its root the
// worktree, with the one case file of this folder as the only test file.
import base from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O137/vite.config.ts';

const WORKTREE = '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O137';
const HERE = '/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o137';

export default async (env) => {
    const resolved = typeof base === 'function' ? await base(env) : base;
    return {
        ...resolved,
        root: WORKTREE,
        test: {
            ...resolved.test,
            projects: undefined,
            environment: 'node',
            globals: true,
            dir: HERE,
            include: ['cases.case.ts'],
            expect: { requireAssertions: false }
        }
    };
};
```

`cases.case.ts` (the non-ASCII letters of its source written by name):

```ts
// The case-run of step O137: prints the result of each case for its input, writes nothing into the
// worktree. The scratch hubs it plants live under this folder's hubs/ and are removed at the end.
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';

const WT = '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O137';
const HERE = '/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o137';
const HUB = join(homedir(), 'workspace/research-hub');

const lines: string[] = [];
const ascii = (text: string): string =>
    text.replace(/[^\x20-\x7e]/g, (ch) => {
        const names: Record<string, string> = {
            '<O diaeresis>': '<O diaeresis>',
            '<o diaeresis>': '<o diaeresis>',
            '<e acute>': '<e acute>',
            '<u diaeresis>': '<u diaeresis>',
            '<a diaeresis>': '<a diaeresis>'
        };
        return names[ch] ?? `<U+${ch.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0')}>`;
    });
const say = (...parts: unknown[]): void => {
    lines.push(ascii(parts.map((one) => (typeof one === 'string' ? one : JSON.stringify(one))).join(' ')));
};

it('runs the cases of O137', async () => {
    const config = await import(`${WT}/src/lib/data/sources/config.ts`);
    const sources = await import(`${WT}/src/lib/data/sources/collections.ts`);
    const data = await import(`${WT}/src/lib/data/index.ts`);
    const model = await import(`${WT}/src/lib/data/model/index.ts`);
    const normalise = await import(`${WT}/src/lib/data/snapshot/normalise.ts`);
    const field = await import(`${WT}/src/lib/data/snapshot/schema/field.ts`);
    const yamlFile = await import(`${WT}/src/lib/data/sources/yaml-file.ts`);
    const state = await import(`${WT}/src/lib/state/boards/collection/index.ts`);
    const build = await import(`${WT}/tests/fixtures/hubs/hub-build.ts`);

    const OWN = config.loadConfig(config.engineDir()).config;
    const CATALOG = config.textCatalog(OWN);
    const WORDS = sources.listWords(OWN);

    const ordered = typeof state.cardOrder === 'function';
    say('order function:', ordered ? 'cardOrder(entries, sort, schema)' : 'pinnedFirst(entries), no sort read');
    type E = { id: string; title: string; fields: Record<string, unknown>; file: string; index: number };
    const order = (entries: E[], sort: string[] | undefined, schema: unknown): E[] =>
        ordered ? state.cardOrder(entries, sort, schema) : state.pinnedFirst(entries);

    /** The entries of a file as normalise.ts makes them (`entry`, normalise.ts:551-569). */
    function fileOf(text: Record<string, unknown>, path: string): { schema: unknown; entries: E[] } {
        const schema = normalise.collectionSchema(text.schema);
        const key = model.primaryKeyOf(field.keyedSchema(text.schema), undefined);
        const raw = Array.isArray(text.entries) ? (text.entries as Record<string, unknown>[]) : [];
        const entries = raw.map((fields, index) => ({
            id: model.entryIdOf(fields, key),
            title: model.entryTitleOf(fields, schema, key),
            fields,
            file: path,
            index
        }));
        return { schema, entries };
    }
    const hubFile = (rel: string): { schema: unknown; entries: E[] } => {
        const path = join(HUB, rel);
        return fileOf(yamlFile.readYamlMap(path, CATALOG, [], () => 'unread') ?? {}, path);
    };
    const own = (key: string): string[] | undefined =>
        (sources.engineDefaults().collections.find((one: { key: string }) => one.key === key) as { sort?: string[] })?.sort;

    // C1 to C3: the reading of sort: on a list entry.
    const LIST = '/hub/.oculus/config.yml';
    const read = (name: string, list: unknown[]): void => {
        const entries = sources.collectionFiles(list, WORDS).map((one: { sort?: unknown }) => one.sort ?? '(no sort)');
        const found = sources.collectionListFindings(list, WORDS, LIST, CATALOG).map((one: { key: string; message: string }) => `${one.key}: ${one.message}`);
        say(name, 'sort:', entries, 'problems:', found);
    };
    read('C1', [{ key: 'events', file: 'events.yml', sort: ['status', 'date'] }]);
    read('C2 text', [{ key: 'events', file: 'events.yml', sort: 'deadline' }]);
    read('C2 empty', [{ key: 'events', file: 'events.yml', sort: [] }]);
    read('C3 map', [{ key: 'events', file: 'events.yml', sort: { by: 'date' } }]);
    read('C3 number', [{ key: 'events', file: 'events.yml', sort: ['status', 3] }]);

    // C4, C5: a sort word the schema does not name.
    const TASKS = '.oculus/data/academic/tasks.yml';
    const plant = (name: string, files: Record<string, string>): string => {
        const hub = join(HERE, 'hubs', name);
        rmSync(hub, { recursive: true, force: true });
        mkdirSync(join(hub, 'projects/active'), { recursive: true });
        for (const [rel, body] of Object.entries(files)) {
            const full = join(hub, rel);
            if (!full.startsWith(HERE)) throw new Error('outside the scratch folder');
            mkdirSync(dirname(full), { recursive: true });
            writeFileSync(full, body);
        }
        return hub;
    };
    const tasksText = [
        'schema:',
        '  - { field: key, type: text, primary_key: true }',
        '  - { field: title, type: text, display: 1 }',
        '  - { field: status, type: text }',
        'entries:',
        '  - { key: t1, title: One }',
        ''
    ].join('\n');
    for (const [name, sort] of [
        ['C4', ['status', 'due']],
        ['C5', ['status', 'title']]
    ] as const) {
        const list = (OWN.collections as Record<string, unknown>[]).map((one) => (one.key === 'tasks' ? { ...one, sort } : one));
        const cfg = data.portfolioConfigFrom({ ...OWN, collections: list });
        const hub = plant(name, { [TASKS]: tasksText });
        const found = build.buildOneHub(hub, cfg).snapshot.findings.filter((one: { file: string }) => one.file.endsWith(`/${TASKS}`));
        say(name, `sort ${JSON.stringify(sort)} findings on tasks.yml:`, found.map((one: { key: string; message: string }) => `${one.key}: ${one.message}`));
    }

    // C6, C7, C18: the research hub's events and applications.
    const events = hubFile('.oculus/data/academic/events.yml');
    say('C6 events sort', own('events') ?? '(none on the entry)');
    const ev = order(events.entries, own('events'), events.schema);
    for (const one of ev) say('  C6', one.fields.status, one.fields.date ?? '-', '|', one.title);
    say('C18 events slices (first occurrence over the drawn entries, bar.ts:467):', state.statusFacets(ev).map((one: { value: string }) => one.value));
    const apps = hubFile('.oculus/data/academic/applications.yml');
    say('C7 applications sort', own('applications') ?? '(none on the entry)');
    for (const one of order(apps.entries, own('applications'), apps.schema)) say('  C7', one.fields.status, one.fields.deadline ?? '-', '|', one.title);

    // C8, C9, C11, C12: synthetic files.
    const evSchema = events.schema;
    const synth = (rows: Record<string, unknown>[]): E[] => rows.map((fields, index) => ({ id: String(fields.key), title: String(fields.title ?? ''), fields, file: 'x.yml', index }));
    const c8 = synth([
        { key: 'a', title: 'A upcoming', status: 'upcoming' },
        { key: 'b', title: 'B not-attending pinned', status: 'not-attending', pin: true },
        { key: 'c', title: 'C planned pinned', status: 'planned', pin: true },
        { key: 'd', title: 'D planned', status: 'planned' }
    ]);
    say('C8', order(c8, ['status'], evSchema).map((one) => one.title));
    const c9 = synth([
        { key: 'x', title: 'Same', status: 'planned', date: '2026' },
        { key: 'y', title: 'Same', status: 'planned', date: '2026' }
    ]);
    say('C9', order(c9, ['status', 'date', 'title'], evSchema).map((one) => one.id));
    const c11 = synth([
        { key: 'g', title: 'gamma' },
        { key: 'b', title: 'beta' },
        { key: 'a', title: 'Alpha' }
    ]);
    say('C11', order(c11, undefined, evSchema).map((one) => one.title));
    const c12 = synth([
        { key: 'p', title: 'P', status: 'paused' },
        { key: 'n', title: 'N', status: 'not-attending' },
        { key: 'l', title: 'L', status: 'planned' }
    ]);
    say('C12', order(c12, ['status'], evSchema).map((one) => one.fields.status));

    // C10: people by name, and the collation of synthetic names.
    const people = hubFile('.oculus/data/people/people.yml');
    say('C10 people sort', own('people') ?? '(none on the entry)');
    say('C10', order(people.entries, own('people'), people.schema).slice(0, 8).map((one) => one.fields.name));
    const names = synth(['Zeta', 'Ozone', '<O diaeresis>sterg<o diaeresis>tland', 'Oslo', 'item 10', 'Item 2', 'aur<e acute>lie', 'Axel'].map((name, index) => ({ key: `n${index}`, name })));
    const nameSchema = [{ field: 'key', type: 'text' }, { field: 'name', type: 'text' }];
    say('C10 synthetic', order(names, ['name'], nameSchema).map((one) => one.fields.name));

    // C13: two hubs listing events, one with its own sort; a hub whose list names no literature entry.
    const evText = ['schema:', '  - { field: key, type: text, primary_key: true }', '  - { field: title, type: text, display: 1 }', '  - { field: status, type: select, options: [planned, completed] }', '  - { field: date, type: text }', 'entries:', '  - { key: e1, title: Late, status: planned, date: "2027" }', '  - { key: e2, title: Early, status: completed, date: "2016" }', ''].join('\n');
    const litText = ['schema:', '  - { field: key, type: text, primary_key: true }', '  - { field: title, type: text, display: 1 }', 'entries:', '  - { key: l1, title: Zebra }', '  - { key: l2, title: Aardvark }', ''].join('\n');
    const EV = '.oculus/data/academic/events.yml';
    const LIT = '.oculus/data/literature/literature.yml';
    const peopleText = ['schema:', '  - { field: key, type: text, primary_key: true }', '  - { field: name, type: text, display: 1 }', 'entries:', '  - { key: z, name: Zoe }', '  - { key: a, name: Ada }', ''].join('\n');
    const fundText = ['schema:', '  - { field: key, type: text, primary_key: true }', '  - { field: title, type: text, display: 1 }', '  - { field: status, type: select, options: [planned, submitted] }', '  - { field: deadline, type: date }', 'entries:', '  - { key: f1, title: Later, status: submitted, deadline: 2026-01-01 }', '  - { key: f2, title: Sooner, status: planned, deadline: 2027-01-01 }', ''].join('\n');
    const second = plant('C13-second', {
        '.oculus/config.yml': `collections:\n  - { key: events, file: "${EV}", sort: [date] }\n`,
        [EV]: evText,
        [LIT]: litText,
        '.oculus/data/people/people.yml': peopleText,
        '.oculus/data/academic/funding.yml': fundText
    });
    const primary = plant('C13-primary', { [EV]: evText });
    for (const [name, hub] of [
        ['primary (names no list)', primary],
        ['second (own events sort [date], no literature entry)', second]
    ] as const) {
        const loaded = config.loadConfig(config.engineDir(), { hub });
        const cfg = data.portfolioConfigFrom(loaded.config, loaded.from);
        const snap = build.buildOneHub(hub, cfg).snapshot;
        say('C13', name, 'collections read:', Object.values(snap.entities.collections).map((one: { id: string }) => one.id));
        for (const one of Object.values(snap.entities.collections) as { id: string; sort?: string[]; schema: unknown; entries: E[] }[]) {
            if (one.entries.length === 0) continue;
            say('C13', name, one.id, 'sort:', one.sort ?? '(none)', 'order:', order(one.entries, one.sort, one.schema).map((entry) => entry.title));
        }
    }
    // C2 in a hub's own settings: every finding the config merge gives for a sort written as a text.
    const texted = plant('C2-hub', {
        '.oculus/config.yml': `collections:\n  - { key: events, file: "${EV}", sort: deadline }\n`,
        [EV]: evText
    });
    const merged = config.loadConfig(config.engineDir(), { hub: texted });
    const naming = (list: { key: string; message: string }[]): string[] => list.filter((one) => one.key.includes('sort')).map((one) => `${one.key}: ${one.message}`);
    say('C2 hub settings, merge findings naming sort:', naming(merged.findings));
    const built = build.buildOneHub(texted, data.portfolioConfigFrom(merged.config, merged.from)).snapshot;
    say('C2 hub settings, snapshot findings naming sort:', naming(built.findings));
    rmSync(join(HERE, 'hubs'), { recursive: true, force: true });

    writeFileSync(join(HERE, process.env.CASE_OUT ?? 'out.txt'), `${lines.join('\n')}\n`);
});
```

## The cases' first run (unchanged tree)

Output of the case-run on the unchanged tree (`CASE_OUT=first-run.txt`), as printed. The `C2 hub settings` lines are a further check of C2 written into the program for the after run (whether a hub's own `sort:` written as a text gives one finding or two); the first run has none of them.

```
order function: pinnedFirst(entries), no sort read
C1 sort: ["(no sort)"] problems: []
C2 text sort: ["(no sort)"] problems: []
C2 empty sort: ["(no sort)"] problems: []
C3 map sort: ["(no sort)"] problems: []
C3 number sort: ["(no sort)"] problems: []
C4 sort ["status","due"] findings on tasks.yml: []
C5 sort ["status","title"] findings on tasks.yml: []
C6 events sort (none on the entry)
  C6 planned - | 3MI Labs talk
  C6 completed 2026-10-29 | FLTA 2026
  C6 completed 2026-10-27 | Info session mentoring trajectory: academic and civic track
  C6 planned 2027-03-01 | Research visit - Link<o diaeresis>ping (Sweden)
  C6 not-attending 2026-09-14 | Graz BCI Conference 2026
  C6 completed 2025 | FLTA 2025
  C6 completed 2025 | FLLM 2025
  C6 completed 2024 | Inkendaal - Welcome 2024
  C6 completed 2026 | Modality-Specific Encoding with a Shared Backbone for Early HCC Prediction from Multi-Modal Liver MRI
  C6 completed 2025 | OHDSI Europe Symposium 2025
  C6 completed 2025 | Guest Lecture "Federated Finger movement decoding - brain-computer interfacing"
  C6 completed 2024 | Use Case - Real-World Evidence
  C6 completed 2024 | FAIR Use Case Real World Evidence Kick-off Event
  C6 completed 2023 | Decoding finger movements from invasive recordings in human motor cortex
  C6 completed 2023 | Guest Lecture "Finger movement decoding - brain-computer interfacing"
  C6 completed 2022 | Coordinated Finger Movements Predicted from Intracranial Brain Activity
  C6 completed 2022 | BCI demo - Advanced Engineering, Antwerp Expo
  C6 completed 2022 | Guest Lecture "Decoding single and coordinated finger actions from intracranial brain activity"
  C6 completed 2022 | Finger abduction trajectory prediction from high-density ECoG
  C6 completed 2021 | Decoding single and coordinated finger actions from intracranial brain activity.
  C6 completed 2021 | Guest Lecture "Finger Movement Decoding - From Source-Localisation to Tensor Regression Modelling"
  C6 completed 2021 | Reconstructing single finger trajectories from intracranial brain activity
  C6 cancelled 2021 | BCI demo - Day of Science
  C6 completed 2019 | Presentation "'MINDSPELLER' Medical Research Project on Brain Computer Interfaces" and concert (with Tigran Maytesian and his Mind Speller Chamber Orchestra)
  C6 completed 2017 | Honours student Axel Faes wins bronze medal in ACM SIGPLAN
  C6 completed 2017 | Student Axel Faes wins bronze medal in the ACM SIGPLAN Student Research Competition in ICFP conference
  C6 completed 2016 | Purpose-Centric Appropriation of Everyday Objects as Game Controllers
C18 events slices (first occurrence over the drawn entries, bar.ts:467): ["planned","completed","not-attending","cancelled"]
C7 applications sort (none on the entry)
  C7 active 2026-11-15 | VIB.AI, Group Leader
  C7 applied 2026-11-01 | Maastricht University, Assistant Professor in Predictive Brain Processes
  C7 active 2026-11-04 | Maastricht University, Universitair Docent Klinische Epidemiologie
  C7 active 2026-11-22 | Maastricht University, Assistant Professor in Methodology and Statistics
  C7 active 2026-11-27 | University of Luxembourg, Postdoctoral researcher in Biomedical AI & Federated MLOps
  C7 applied 2026-10-27 | BioML UGent Doctor-assistent
  C7 active 2027-01-21 | Defensie, Reservist Officer
  C7 rejected - | UHasselt, Immunology TT
  C7 rejected - | Larian Studios, Engine Programmer
  C7 rejected - | Guerrilla Games, Senior Data Analyst
  C7 accepted - | Twente, Cancer AI
  C7 accepted - | UHasselt, FL BDS
  C7 declined - | UCD, RWE postdoc
  C7 declined - | Wageningen, FL
  C7 rejected - | Oslo, ML Integreat
  C7 rejected - | Uppsala, ML Theory
  C7 rejected - | Twente, Aneurysm
  C7 rejected - | Maynooth, CS ZAP
  C7 rejected - | Hasselt, Data Science ZAP
  C7 withdrawn - | Oslo, Plague
  C7 withdrawn - | Tilburg, EEG
  C7 withdrawn - | Utrecht, NLP
  C7 not-applied - | Denmark, AI ZAP
  C7 not-applied - | KTH, Sign Language
  C7 not-applied - | Luxembourg, AI
  C7 not-applied - | Luxembourg, ZAP
  C7 not-applied - | Ume<U+00E5>, Precision ZAP
  C7 not-applied - | Uppsala, Precision ZAP
  C7 not-applied - | Lund, Paleogenomics
  C7 not-applied - | Hasselt, Neuroscience ZAP
  C7 not-applied - | UCD, RWE ZAP
C8 ["B not-attending pinned","C planned pinned","A upcoming","D planned"]
C9 ["x","y"]
C11 ["gamma","beta","Alpha"]
C12 ["paused","not-attending","planned"]
C10 people sort (none on the entry)
C10 ["Maryam Amir Haeri","St<e acute>phanie M. van den Berg","Maureen Guichelaar","Mattias Ekstedt","Yves Moreau","Liesbet M. Peeters","Ashkan Pirmani","Pieter Vandervoort"]
C10 synthetic ["Zeta","Ozone","<O diaeresis>sterg<o diaeresis>tland","Oslo","item 10","Item 2","aur<e acute>lie","Axel"]
C13 primary (names no list) collections read: ["applications","data","domains","education","events","funding","literature","organisations","people","pillars","resources","statements","tasks","venues"]
C13 primary (names no list) events sort: (none) order: ["Late","Early"]
C13 second (own events sort [date], no literature entry) collections read: ["events","literature"]
C13 second (own events sort [date], no literature entry) events sort: (none) order: ["Late","Early"]
C13 second (own events sort [date], no literature entry) literature sort: (none) order: ["Zebra","Aardvark"]
```

Each case by its name, on the unchanged tree:

- C1, C2, C3: no `sort` is read and no problem is given for any of the five values (the lines `C1` to `C3 number`). The tree has no `sort:` reading.
- C4, C5: no finding on the tasks file for either sort (lines `C4`, `C5`).
- C6: the events go in the file's order (lines `C6`), planned 3MI Labs first, the 2027-03-01 visit fourth, not-attending fifth.
- C7: the applications go in the file's order (lines `C7`), the nine not-applied last.
- C8: the two pinned cards first in the file's order, B before C (line `C8`).
- C9: x before y, the file's order (line `C9`).
- C10: people in the file's order, Maryam Amir Haeri first; the synthetic names in their given order (lines `C10`).
- C11: gamma, beta, Alpha, the file's order (line `C11`).
- C12: paused, not-attending, planned, the file's order (line `C12`).
- C13: the second hub reads only `events` and `literature`: a hub's list that names no people or funding entry has no such collection, even with the files on disk. This is the case the brief's rule got wrong: its second sentence said such a hub "reads oculus's entry of it and so its `sort`" for people, funding and literature, and the code adds only oculus's literature entry (`src/lib/data/index.ts:199-202`, line 201 `...(unnamed?.literature === true ? engineEntry('literature') : [])`). I handed this back before any code change; the ruling above rewords C13 to the literature entry, and the step ran under it.
- C14: read on the unchanged tree: the card's grip is drawn from `Grip.svelte` in `EntryCard.svelte`'s `meta`, the slot carries the drag handlers, and `resolve.ts:362-369` returns `{ kind: 'move' }` for Shift+J and Shift+K, run by `moveCard` in `workbench-keys.svelte.ts`.
- C15: read on the unchanged tree: `docs/HELP.md:148` reads "| j / k, J / K, i / o | move the card cursor left / right, move the card, cursor up / down a row |", and `rows.ts:101-102` words `keys.move_left` and `keys.move_right` in the Help view.
- C16: `grep -n reorderEntries src/lib/state/client/writes.svelte.ts src/lib/views/sources/files/sections/Sections.svelte` on the base prints `:429` and `:111` (and the same lines on the worktree, below).
- C17: read on the unchanged tree: a status change or a pin writes the entry and the card stays at its place in the file's order (pinned first); there is no sort to move it.
- C18: the slices over the drawn events (line `C18`) are planned, completed, not-attending, cancelled, in the order of first occurrence over the file's order.

The tests run on the unchanged tree before any code change (check 8), with the new and edited tests already in place: `npx vitest run tests/data/sources/collections.test.ts tests/data/snapshot/schema-rules.test.ts tests/state/boards/board/board-rules.test.ts tests/routes/hubs/make.test.ts`. Its failing lines as printed (the vitest glyphs written by name):

```
 FAIL  |unit| tests/data/snapshot/schema-rules.test.ts [ tests/data/snapshot/schema-rules.test.ts ]
AssertionError: the catalog holds findings.schema.sort_unknown: expected undefined to be defined
 FAIL  |unit| tests/data/sources/collections.test.ts > the fields of a collections entry > reads every field an entry sets, with no finding
AssertionError: expected [ { key: 'jobs', <horizontal ellipsis>(13) }, <horizontal ellipsis>(2) ] to deeply equal [ { key: 'jobs', <horizontal ellipsis>(14) }, <horizontal ellipsis>(2) ]
 FAIL  |unit| tests/data/sources/collections.test.ts > the fields of a collections entry > carries the registry, the flags, the skip, the ticker and the sort onto the collection read
AssertionError: expected { key: 'todo', <horizontal ellipsis>(8) } to match object { registry: 'funding', <horizontal ellipsis>(5) }
 FAIL  |unit| tests/data/sources/collections.test.ts > the fields of a collections entry > reads a sort that is 'a list of fields'
AssertionError: expected undefined to deeply equal [ 'status', 'date' ]
 FAIL  |unit| tests/data/sources/collections.test.ts > the fields of a collections entry > reads a sort that is 'a text'
AssertionError: expected [] to deeply equal [ Array(1) ]
 FAIL  |unit| tests/data/sources/collections.test.ts > the fields of a collections entry > reads a sort that is 'a map'
AssertionError: expected [] to deeply equal [ Array(1) ]
 FAIL  |unit| tests/data/sources/collections.test.ts > the fields of a collections entry > reads a sort that is 'a list holding a number'
AssertionError: expected [] to deeply equal [ Array(1) ]
 FAIL  |unit| tests/routes/hubs/make.test.ts > a make > makes a hub of two collections: .oculus/config.yml listing them and their two data files, recorded as one create of the .oculus folder
AssertionError: expected [ { key: 'funding', <horizontal ellipsis>(8) }, <horizontal ellipsis>(1) ] to deeply equal [ { key: 'funding', <horizontal ellipsis>(9) }, <horizontal ellipsis>(1) ]
 Test Files  3 failed | 1 passed (4)
      Tests  7 failed | 149 passed (156)
```

What each run proves:

- The four `reads a sort that is` rows for a list of fields, a text, a map and a number, `reads every field`, the renamed `carries ... and the sort` test, and the make test test behaviour the change adds; each fails on the unchanged tree with the assertion quoted, and that run is its proof.
- The `an empty list` row of `reads a sort that is` tests behaviour the change keeps (an empty list is no sort and no problem); it passes on the unchanged tree (it is not among the failures) and after. It is an audit: it passes on the unchanged tree, which reads no `sort:` at all, so it does not prove the reading.
- `schema-rules.test.ts` does not load on the unchanged tree: its catalog guard asserts that every finding key its rows name is in the catalog, and `findings.schema.sort_unknown` is not. So the row 'a sort naming a field the schema does not name' (C4) has the load failure as its first-run result, and the absence of the behaviour on the unchanged tree is shown by the case-run's `C4` line there (`findings on tasks.yml: []`). The row 'nothing for a sort whose fields the schema names' (C5) tests behaviour the change keeps and could not run on the unchanged tree; it passes after. It is an audit: it passes with `sortFindings` taken out.
- The edits to existing rows, below, keep the behaviour they test; the existing rows of `KEY_ROWS` and of `board-rules.test.ts` pass after the change.

The edits to existing tests, before and after:

- `tests/data/snapshot/schema-rules.test.ts`, the `tasks()` helper: before, the schema is the lines given; after, the lines given plus `{ field: status, type: text }` and `{ field: deadline, type: date }`, since oculus's tasks entry now sorts by `[status, deadline]` and a tasks schema that lacks either gives a `sort_unknown` finding the existing rows do not expect. Its doc says so.
- `tests/state/boards/board/board-rules.test.ts:759`, the tasks file of that test gains `'  - { field: deadline, type: date }',` for the same reason. This test passes on the unchanged tree and after.
- `tests/data/sources/collections.test.ts`: the `reads every field` jobs entry gains `sort: ['status', 'deadline']`; the test `carries the registry, the flags, the skip and the ticker onto the collection read` is renamed `carries the registry, the flags, the skip, the ticker and the sort onto the collection read` and gains `sort: ['status', 'title']` in its input and in its expected value.
- `tests/routes/hubs/make.test.ts:241`: the comment reads "Each entry as the template line writes it: its registry, flags, ticker, sort and words."; both expected entries gain `sort: ['status', 'deadline']`.

## DONE / NOT DONE

| Row | State | Evidence |
| --- | --- | --- |
| Items 1 to 7, Decisions 1 to 9, the write list | DONE | the diff below; `git diff --stat` prints `34 files changed, 661 insertions(+), 685 deletions(-)` |
| Check 1 | DONE | after the round: `Test Files  50 passed (50)` (Repair round 1); the run below, before the round, had 11 timeouts in three unchanged files |
| Check 2 | DONE | after the round: `every command passed` (Repair round 1); the run below, before the round, had two timeouts in the unchanged hub-portfolio.test.ts |
| Check 3 | DONE | the gate prints nothing, exit 0 |
| Check 4 | DONE | the one differing line is `CardMove` taken out of an existing line; no new name |
| Check 5 | DONE | `sh utils/folder-check.sh` prints nothing, exit 0; the largest changed sources are under the size rule |
| Check 6 | DONE | the grep prints nothing, exit 1 |
| Check 7 | DONE | `Collection.svelte:158` and `:219` |
| Check 8 | DONE | the unchanged-tree run above and the after runs below |

Check 1: `npx vitest run --reporter=dot` over the 16 files the brief names and the 34 files `grep -rln` of each changed module's path under `tests` prints, 50 in all (`tests/checks/config/config.test.ts tests/checks/source/keys.test.ts tests/data/hubs/connection-keys.test.ts tests/data/hubs/hub-portfolio.test.ts tests/data/hubs/website-files.test.ts tests/data/shapes/catalog-files/vocab.test.ts tests/data/sources/career.test.ts tests/data/sources/config/boards.test.ts tests/data/sources/config/layers/hub-vocab.test.ts tests/data/sources/config/layers/manifest-fields.test.ts tests/data/sources/registries.test.ts tests/routes/docs/audit.test.ts tests/routes/edit/apps/app-setting.test.ts tests/routes/edit/config-key.test.ts tests/routes/edit/undo/config-save.test.ts tests/routes/sessions/website.test.ts tests/server/core/credentials.test.ts tests/server/edit/config-key.test.ts tests/server/machine/hpc/clusters/setup.test.ts tests/server/root/watch/website-watch.test.ts tests/state/boards/board/board-new-project.test.ts tests/state/forms/choices.test.ts tests/state/forms/page-entry.test.ts tests/state/sessions/source/draft-entry.test.ts tests/state/shared/hub-words.test.ts tests/state/system/apps/app-keys.test.ts tests/state/system/settings/hub-scope.test.ts tests/state/system/settings/machine-section.test.ts tests/state/workbench/options-pages.test.ts tests/views/shared/explorer/opening-apps.test.ts tests/checks/config/integrity.test.ts tests/data/hubs/workspace-findings.test.ts tests/server/edit/writes-collection.test.ts tests/server/edit/writes.test.ts` beyond the 16), run after the last change. Last lines as printed:

```
 Test Files  3 failed | 47 passed (50)
      Tests  11 failed | 1249 passed | 9 skipped (1269)
   Start at  21:03:39
   Duration  164.54s (transform 42.02s, setup 0ms, import 151.12s, tests 496.96s, environment 12ms)
```

Every one of the 11 failures is `Error: Test timed out in 5000ms.`, in `tests/data/hubs/hub-portfolio.test.ts` (9), `tests/routes/edit/undo/config-save.test.ts` and `tests/routes/sessions/website.test.ts`, none a file the step changes. `uptime` right after printed `load averages: 14.65 12.69 11.49`, and 26.17 during the reruns. Each file rerun alone (`npx vitest run --reporter=dot <file>`):

```
== tests/data/hubs/hub-portfolio.test.ts
 Test Files  1 failed (1)
      Tests  2 failed | 14 passed (16)
== tests/routes/edit/undo/config-save.test.ts
 Test Files  1 failed (1)
      Tests  8 failed | 5 passed (13)
== tests/routes/sessions/website.test.ts
 Test Files  1 passed (1)
      Tests  20 passed (20)
```

The two files still red alone at the 5000ms default, rerun alone with `--testTimeout 30000` (`npx vitest run --reporter=dot --testTimeout 30000 <file>`), then `uptime`:

```
== tests/data/hubs/hub-portfolio.test.ts
 Test Files  1 passed (1)
      Tests  16 passed (16)
   Duration  44.97s (transform 1.52s, setup 0ms, import 2.18s, tests 42.65s, environment 0ms)
== tests/routes/edit/undo/config-save.test.ts
 Test Files  1 passed (1)
      Tests  13 passed (13)
   Duration  18.34s (transform 1.55s, setup 0ms, import 2.46s, tests 15.77s, environment 0ms)
21:12  up 1 day,  5:15, 1 user, load averages: 11.65 14.09 12.67
```

Every test of the 50 files passes when given the time; at the brief's default timeout and this load, 11 do not.

Check 2: `npm run diagrams`, then `npm run test:quick` once, after the last change. The list ran once; no whole-suite command was run. Result lines as printed:

```
test:quick: 35 changed file(s), from git since HEAD
test:quick: 228 test file(s)
ok      prettier (1.3 s): All matched files use Prettier code style!
ok      ASCII gate (1.3 s)
ok      svelte-kit sync (2.7 s)
ok      eslint (24.0 s)
ok      svelte-check (60.4 s): 1793735523622 COMPLETED 581 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest checks (287.5 s): Duration  262.02s (transform 160.29s, setup 0ms, import 326.07s, tests 554.23s, environment 7ms)
ok      vitest (345.8 s): Duration  323.13s (transform 317.49s, setup 0ms, import 589.35s, tests 617.53s, environment 21.18s)
FAILED  vitest slow (462.0 s)
 Test Files  1 failed | 58 passed (59)
      Tests  2 failed | 588 passed | 309 skipped (899)
test:quick: 464.9 s; failed: vitest slow
```

The two failures are in `tests/data/hubs/hub-portfolio.test.ts`, which the step does not change: 'names a record of the second hub in a relation pair only by ids of the second hub' and 'reports the findings each hub gives, the second hub own naming its files', each `Test timed out in 20000ms`. Rerun alone, the file printed `Test Files  1 passed (1)` and `Tests  16 passed (16)`, the two tests in 3356ms and 2823ms. The list was not run again for it.

Check 3, the rules file's gate (spec.md:103) over the changed files:

```
$ LC_ALL=C perl -ne 'my $l = $_; $l =~ s/\xC3[\x80-\xBF]//g if $ARGV =~ m{^config/}; print "$ARGV:$.:$_" if $l =~ /[^\x20-\x7E\n]/; close ARGV if eof' $(cat changed.txt)
exit 0
```

It printed nothing. Its whole-tree form `... $(find src tests bin config -type f ! -name local.yml)` printed `find: bin: No such file or directory` (the worktree has no `bin`) and no line of a file, exit 0. This report passes the same gate (the last command before the hand-back).

Check 4: `sh utils/unused-exports.sh` (exit 0), compared with `../O137-base/unused-exports.txt` by `diff`:

```
326c326
< src/lib/state/workbench/ui.svelte.ts: CardMove, OwnedInstance, TerminalOwner, PaneStripKey
---
> src/lib/state/workbench/ui.svelte.ts: OwnedInstance, TerminalOwner, PaneStripKey
```

`CardMove` is gone with the move; the other three names are listed on the base. No new unused export.

Check 5: `sh utils/folder-check.sh` printed nothing, exit 0. Sizes after (base in parentheses): `src/lib/state/boards/collection/index.ts` 872 (806), `src/lib/data/helpers/hub-names.ts` 857 (848), `src/lib/views/boards/collection/Collection.svelte` 447 (520), `src/lib/views/academic/present/Present.svelte` 518 (518), `src/lib/views/shared/forms/entry/card/EntryCard.svelte` 328 (366).

Check 6:

```
$ grep -rn 'requestCardMove\|cardMoveRequested\|CardMove\|moveCard\|fileOrder\|pinnedFirst\|reorder_hint\|grip_glyph\|move_left\|move_right\|ondragfrom\|ondropon' src tests docs config --exclude=local.yml
exit 1
```

Check 7, the two lines of `Collection.svelte` that hand the order function the sort and the schema:

```
158:            cardOrder(part.collection.entries, part.collection.sort, part.schema)   (in `entries`, :156)
219:            cardOrder(part.collection.entries, part.collection.sort, part.schema)   (in `shown`, :217, followed by `.filter(filtered.keeps)`)
```

Check 8: the unchanged-tree run is quoted under the first run. After the change, the same four files pass inside check 1 (none of the 11 failures is in them).

## The cases after the change

Output of the case-run after the last change (`CASE_OUT=after-run.txt`), as printed:

```
order function: cardOrder(entries, sort, schema)
C1 sort: [["status","date"]] problems: []
C2 text sort: ["(no sort)"] problems: ["collections[0].sort: the sort \"deadline\" of the entry events is not a list of fields; its cards go by their title"]
C2 empty sort: ["(no sort)"] problems: []
C3 map sort: ["(no sort)"] problems: ["collections[0].sort: the sort {\"by\":\"date\"} of the entry events is not a list of fields; its cards go by their title"]
C3 number sort: ["(no sort)"] problems: ["collections[0].sort: the sort [\"status\",3] of the entry events is not a list of fields; its cards go by their title"]
C4 sort ["status","due"] findings on tasks.yml: ["schema: the collections entry sorts by due, a field the schema does not name; the cards are not sorted by it"]
C5 sort ["status","title"] findings on tasks.yml: []
C6 events sort ["status","date"]
  C6 planned 2027-03-01 | Research visit - Link<o diaeresis>ping (Sweden)
  C6 planned - | 3MI Labs talk
  C6 completed 2016 | Purpose-Centric Appropriation of Everyday Objects as Game Controllers
  C6 completed 2017 | Honours student Axel Faes wins bronze medal in ACM SIGPLAN
  C6 completed 2017 | Student Axel Faes wins bronze medal in the ACM SIGPLAN Student Research Competition in ICFP conference
  C6 completed 2019 | Presentation "'MINDSPELLER' Medical Research Project on Brain Computer Interfaces" and concert (with Tigran Maytesian and his Mind Speller Chamber Orchestra)
  C6 completed 2021 | Decoding single and coordinated finger actions from intracranial brain activity.
  C6 completed 2021 | Guest Lecture "Finger Movement Decoding - From Source-Localisation to Tensor Regression Modelling"
  C6 completed 2021 | Reconstructing single finger trajectories from intracranial brain activity
  C6 completed 2022 | Coordinated Finger Movements Predicted from Intracranial Brain Activity
  C6 completed 2022 | BCI demo - Advanced Engineering, Antwerp Expo
  C6 completed 2022 | Guest Lecture "Decoding single and coordinated finger actions from intracranial brain activity"
  C6 completed 2022 | Finger abduction trajectory prediction from high-density ECoG
  C6 completed 2023 | Decoding finger movements from invasive recordings in human motor cortex
  C6 completed 2023 | Guest Lecture "Finger movement decoding - brain-computer interfacing"
  C6 completed 2024 | Inkendaal - Welcome 2024
  C6 completed 2024 | Use Case - Real-World Evidence
  C6 completed 2024 | FAIR Use Case Real World Evidence Kick-off Event
  C6 completed 2025 | FLTA 2025
  C6 completed 2025 | FLLM 2025
  C6 completed 2025 | OHDSI Europe Symposium 2025
  C6 completed 2025 | Guest Lecture "Federated Finger movement decoding - brain-computer interfacing"
  C6 completed 2026 | Modality-Specific Encoding with a Shared Backbone for Early HCC Prediction from Multi-Modal Liver MRI
  C6 completed 2026-10-27 | Info session mentoring trajectory: academic and civic track
  C6 completed 2026-10-29 | FLTA 2026
  C6 cancelled 2021 | BCI demo - Day of Science
  C6 not-attending 2026-09-14 | Graz BCI Conference 2026
C18 events slices (first occurrence over the drawn entries, bar.ts:467): ["planned","completed","cancelled","not-attending"]
C7 applications sort ["status","deadline"]
  C7 not-applied - | Denmark, AI ZAP
  C7 not-applied - | KTH, Sign Language
  C7 not-applied - | Luxembourg, AI
  C7 not-applied - | Luxembourg, ZAP
  C7 not-applied - | Ume<U+00E5>, Precision ZAP
  C7 not-applied - | Uppsala, Precision ZAP
  C7 not-applied - | Lund, Paleogenomics
  C7 not-applied - | Hasselt, Neuroscience ZAP
  C7 not-applied - | UCD, RWE ZAP
  C7 active 2026-11-04 | Maastricht University, Universitair Docent Klinische Epidemiologie
  C7 active 2026-11-15 | VIB.AI, Group Leader
  C7 active 2026-11-22 | Maastricht University, Assistant Professor in Methodology and Statistics
  C7 active 2026-11-27 | University of Luxembourg, Postdoctoral researcher in Biomedical AI & Federated MLOps
  C7 active 2027-01-21 | Defensie, Reservist Officer
  C7 accepted - | Twente, Cancer AI
  C7 accepted - | UHasselt, FL BDS
  C7 rejected - | UHasselt, Immunology TT
  C7 rejected - | Larian Studios, Engine Programmer
  C7 rejected - | Guerrilla Games, Senior Data Analyst
  C7 rejected - | Oslo, ML Integreat
  C7 rejected - | Uppsala, ML Theory
  C7 rejected - | Twente, Aneurysm
  C7 rejected - | Maynooth, CS ZAP
  C7 rejected - | Hasselt, Data Science ZAP
  C7 declined - | UCD, RWE postdoc
  C7 declined - | Wageningen, FL
  C7 withdrawn - | Oslo, Plague
  C7 withdrawn - | Tilburg, EEG
  C7 withdrawn - | Utrecht, NLP
  C7 applied 2026-10-27 | BioML UGent Doctor-assistent
  C7 applied 2026-11-01 | Maastricht University, Assistant Professor in Predictive Brain Processes
C8 ["C planned pinned","B not-attending pinned","A upcoming","D planned"]
C9 ["x","y"]
C11 ["Alpha","beta","gamma"]
C12 ["planned","not-attending","paused"]
C10 people sort ["name"]
C10 ["Anh Phuong DO","Ashkan Pirmani","Aur<e acute>lie de Borman","Axel Faes","Brecht Heeren","Brent Berghmans","Denzell Mgbokwere","Didier Quintius"]
C10 synthetic ["aur<e acute>lie","Axel","Item 2","item 10","Oslo","<O diaeresis>sterg<o diaeresis>tland","Ozone","Zeta"]
C13 primary (names no list) collections read: ["applications","data","domains","education","events","funding","literature","organisations","people","pillars","resources","statements","tasks","venues"]
C13 primary (names no list) events sort: ["status","date"] order: ["Late","Early"]
C13 second (own events sort [date], no literature entry) collections read: ["events","literature"]
C13 second (own events sort [date], no literature entry) events sort: ["date"] order: ["Early","Late"]
C13 second (own events sort [date], no literature entry) literature sort: ["title"] order: ["Aardvark","Zebra"]
C2 hub settings, merge findings naming sort: []
C2 hub settings, snapshot findings naming sort: ["collections[0].sort: the sort \"deadline\" of the entry events is not a list of fields; its cards go by their title"]
```

Each case after the change:

- C1: met, read `['status', 'date']`, no problem (line `C1`; test row 'a list of fields').
- C2: met. The text gives no sort and one `sort_unread` problem naming `"deadline"` and `events`; the empty list gives no sort, no problem (lines `C2`; rows 'a text', 'an empty list'). The same text written in a hub's own `.oculus/config.yml` gives one finding, from the snapshot, and none from the config merge (lines `C2 hub settings`).
- C3: met, one problem each, naming the value and the key (lines `C3`; rows 'a map', 'a list holding a number').
- C4: met, one `sort_unknown` finding naming `due` at `schema`, none for `status` (line `C4`; KEY_ROWS row 'a sort naming a field the schema does not name').
- C5: met, no finding (line `C5`; KEY_ROWS row 'nothing for a sort whose fields the schema names').
- C6: met: planned 2027-03-01, planned with no date, completed 2016 up to 2026-10-29, cancelled, not-attending.
- C7: met: the nine not-applied in the file's order (none has a deadline), then active oldest deadline first, accepted, rejected, declined, withdrawn, applied.
- C8: met: the two pinned first, C (planned) before B (not-attending) by the sort.
- C9: met: x before y.
- C10: met: Anh Phuong DO, Ashkan Pirmani, Aur<e acute>lie de Borman, Axel Faes, ...; `<O diaeresis>sterg<o diaeresis>tland` between Oslo and Ozone; Item 2 before item 10.
- C11: met: Alpha, beta, gamma.
- C12: met: paused after not-attending.
- C13 (as ruled): met. The primary hub, whose list names nothing, reads oculus's events entry with `[status, date]`; the second hub's own `sort: [date]` orders its events Early, Late; the second hub names no literature entry and reads oculus's, with `sort: [title]`, Aardvark before Zebra. Code path to the view: `Collection.svelte:144` `parts` holds one part per hub in the hubs' order, the primary first, and `:217-222` `shown` is `parts.flatMap((part) => cardOrder(part.collection.entries, part.collection.sort, part.schema).filter(filtered.keeps).map(...))`, so each hub's part is ordered by its own collection's sort and the parts keep their order. The hub's own `sort` reaches `part.collection.sort` through `hub-names.ts:343-346` (`entryOf`), `collections.ts:122` (`traitsOf`) and normalise's `collection()` spread of the traits.
- C14 (look case): the grip is gone: `Grip.svelte` is deleted, `EntryCard.svelte:297` is `<div class="slot" data-entry={entry.id} data-ident={value} role="listitem">` with no drag attribute, and `meta` (:281-291) draws the Lead tag, the status chip and the stray tag only. A press and drag moves nothing: `Collection.svelte` has no `dragged`, `drop`, `carry`, `writeOrder`, and `EntryCard.svelte` no `dragstart`, `dragover` or `drop` (check 6's grep over `ondragfrom` and `ondropon` prints nothing). Shift+J and Shift+K change no file: `resolve.ts` has no `move` kind (its J/K branch is gone; `'j'` is handled at :361 as the cursor move left), `workbench-keys.svelte.ts` has no `moveCard`, `ui.svelte.ts` no `requestCardMove`.
- C15 (look case): `docs/HELP.md:148` reads `| j / k, i / o | move the card cursor left / right, cursor up / down a row |`; `rows.ts` no longer has the move case and `help.yml` no `move_left` or `move_right`. The Slides view keeps its drag and step buttons: `slides.ts:178` holds `movedOrder` as a local function and `withMove` (:187) calls it, as before.
- C16: met: `grep -n reorderEntries src/lib/state/client/writes.svelte.ts src/lib/views/sources/files/sections/Sections.svelte` prints `writes.svelte.ts:429:    async function reorderEntries(...)`, `:846` (its return), `Sections.svelte:47` (its import) and `Sections.svelte:111:        const answer = await reorderEntries('bookmarks', ids);`, as on the base.
- C17 (look case): a status change (`EntryCard.svelte:276` `setStatus`, `writeEntry(collection, entry.id, { status: next })`) and a pin (`:271` `pin`, `{ pin: pinned ? null : true }`) write the file; the snapshot refreshes, `part.collection.entries` changes, and `entries` (:156) and `shown` (:217) are `$derived` from it through `cardOrder`, so the card is drawn at its sorted place. An Add (`newEntry`, `src/lib/state/client/writes.svelte.ts:392`) has the server append the entry at the end of the file's list (`createEntry`, `src/lib/server/edit/writes/entries.ts:568`, through `appendEntry`), and the same derivation draws it at its sorted place, the end of the file being only the last tie-break. The cursor is the identity of a card, `cursor = $derived(cardCursor(instance.state))` (:138), compared per card by `cursor={cursor === identityValue(entry)}` (:409), not an index, so it stays on the card it was on, which after a status change or pin is the moved card.
- C18 (look case): met: the slices are taken at `src/lib/state/boards/collection/bar.ts:467` (`countsOf(entries, statusRule).keys()`, first occurrence) over `entries`, which `Collection.svelte:202` hands `collectionBar` and which is sorted by `cardOrder` at :158; the case-run's `statusFacets` over the sorted events gives planned, completed, cancelled, not-attending.

## Files with line counts (after, `wc -l`; base in parentheses)

- `config/defaults/sources.yml` 115 (114)
- `config/options/sources.yml` 189 (186)
- `config/text/findings.yml` 496 (494)
- `config/text/views/boards/collection.yml` 79 (81)
- `config/text/views/system/help.yml` 59 (61)
- `docs/HELP.md` 620 (620), lines 148 and 279
- `docs/data-map.md` 306 (306), line 34
- `docs/templates.md` 1925 (1920), the config template's comment and commented list
- `docs/diagrams/layer-state.dot`, `layer-state.svg`, `layer-views.dot`, `layer-views.svg`, `layers.dot`, `layers.svg`, regenerated by `npm run diagrams`
- `src/lib/data/helpers/hub-names.ts` 857 (848)
- `src/lib/data/helpers/keys/oculus/resolve.ts` 393 (402)
- `src/lib/data/model/model-collections.ts` 559 (557)
- `src/lib/data/snapshot/schema/run.ts` 610 (573)
- `src/lib/data/sources/collections.ts` 218 (216)
- `src/lib/server/files/project/make.ts` 396 (396), lines 18-22 of its head comment
- `src/lib/shell/keys/workbench-keys.svelte.ts` 592 (610)
- `src/lib/state/boards/collection/index.ts` 872 (806)
- `src/lib/state/life/slides.ts` 401 (390)
- `src/lib/state/workbench/ui.svelte.ts` 570 (595)
- `src/lib/views/academic/present/Present.svelte` 518 (518), line 123
- `src/lib/views/boards/collection/Collection.svelte` 447 (520)
- `src/lib/views/shared/forms/entry/card/EntryCard.svelte` 328 (366)
- `src/lib/views/shared/forms/entry/card/Grip.svelte` deleted (38 on the base)
- `src/lib/views/system/help/keys/rows.ts` 344 (346)
- `tests/data/snapshot/schema-rules.test.ts` 786 (765)
- `tests/data/sources/collections.test.ts` 528 (490)
- `tests/fixtures/hubs/demo/.oculus/config.yml` 38 (38)
- `tests/routes/hubs/make.test.ts` 647 (645)
- `tests/state/boards/board/board-rules.test.ts` 823 (822)
- `.scratch/migration/agents/reviews/O137-report.md`, this report

Docs and comments the change touches, each read against the code: rewritten are the head comments of `Collection.svelte` (the `cardOrder` order, a write to a sorted field moves the card, no keyboard move), `EntryCard.svelte` (no grip), `index.ts` (names `cardOrder`), `collections.ts` :7-13, `run.ts` :7-13, `make.ts` :18-22, the docs of `CollectionTraits`, `entryOf`, `listProblems`, `traitsOf`, `HubFile` and `pin`, the comment over `sources.yml`'s list and its mirror in `docs/templates.md`, the demo config's comment at :7, `docs/data-map.md:34`, `docs/HELP.md:148` and :279. Still true and unchanged: the Slides view's comments on its drag and step buttons, and `writes.svelte.ts`'s doc of `reorderEntries` (it writes the file's order, which now breaks the sort's ties).

## Judgment calls the brief left open

- A sort word must be a text with something in it (`sortShape = z.array(wordShape)`, `hub-names.ts:267`); a list holding an empty text is read as not a list of fields and gives `sort_unread`.
- For the order, a boolean, a map and a text of only spaces count as a missing value, with the empty text, map and empty list the brief names (`sortText`, `index.ts:745`): a number becomes its text, a list its first item.
- With no sort, an entry whose card words are empty goes after those that have words, under the same missing-last rule.
- A `date` field compares by code units of its text (`fieldCompare`, `index.ts:777`), so `2026` sorts before `2026-10-27`; a field that is not `status` and not of type `date` goes through the collator.
- `docs/HELP.md:279` says, beyond the order, "When a write changes a card's pin or a field the collection's cards are sorted by, the card moves to its place.", so the Help page tells the reader why a card moves after a write.
- The demo hub fixture's applications entry sorts by `[status]`, since the demo applications schema has no `deadline` field; `[status, deadline]` there would give the demo a `sort_unknown` finding.
- `sort:` sits after `ticker:` and before `group:` on each list line, so the fields that say what the file is stay together and the placement fields follow.
- `cardOrder` is called twice in `Collection.svelte`, once in `entries` and once in `shown` (for the drawn cards), as item 4 names both. `entries` (`Collection.svelte:156`) is read by `lifecycle` (:164, the Status choices of a file with no schema) and `collectionBar` (:202, the bar's groups, slices and counts); the card cursor reads neither, it compares card identities (`cursor`, :138, against `identityValue(entry)` at :409). The second call could take `entries` per part instead, which the brief did not ask for.
- The `make.ts` head comment is rewrapped over lines 18-22, beyond the ruled lines 17-18: adding "sort" to line 18 pushed it over the 100-column width, and the rest of the paragraph rewraps from there. Line 17 is unchanged.
- The `tasks()` helper of `schema-rules.test.ts` gives every tasks schema `status` and `deadline`, so C4's file names key, title, status and deadline; `due` is still the one word the schema does not name.
- `schema.sort_unknown` sits after `schema.key_missing` in `findings.yml`, beside the other key findings of the schema check.

## Before and after

- Card order of the ten collections. Before: the file's order, pinned first, in every collection. After, pinned first and then: statements by status (options order) then title; people by name; organisations by name; resources by kind then name; funding by status then deadline; events by status then date; education by status then date; applications by status then deadline; tasks by status then deadline; literature by title. Ties go by the file's order.
- The card's grip. Before: a grip glyph in each card's meta with the hint "drag to reorder", and a press and drag reordered the file. After: no grip, and dragging a card does nothing.
- Shift+J and Shift+K. Before: with the card cursor active they moved the card left or right and wrote the file's order. After: they are unbound in the collection view and change nothing; in the Present view's grid `J` and `K` are no longer swallowed (`GRID_KEYS`, `Present.svelte:123`, without `'J'` and `'K'`).
- The keys table. Before: `docs/HELP.md:148` "| j / k, J / K, i / o | move the card cursor left / right, move the card, cursor up / down a row |", and the Help view listed "carry the card under the cursor left" and "... right". After: "| j / k, i / o | move the card cursor left / right, cursor up / down a row |", and the Help view lists no move.
- The Settings field. Before: a collections entry had no `sort` field in Settings. After: `config/options/sources.yml:106-108` adds `sort` with `control: list` and the help "the fields of the file's schema the cards of the file's card list are sorted by, in their order, after the pinned cards come first: the status field in the order of its options, a date field oldest first, any other field alphabetically, a missing value last, then the file's order; a field the schema does not name is a finding; with none the cards go by their title".
- A card after a status change, a pin or an Add with the cursor on it. Before: a status change left the card at its place; a pin moved it to the top; an Add drew the new card last among the unpinned, where the server appends it in the file. After: a status change moves the card to its status's place, a pin moves it to the pinned group and an unpin back to its sorted place, and an Add draws the new card at its sorted place; the cursor stays on the card it was on (C17).
- The status slices. Before (events): planned, completed, not-attending, cancelled, by first occurrence in the file. After: planned, completed, cancelled, not-attending, the options' order (C18).
- The status slices and the "other" values of a `filter: true` group in a workspace of several hubs. Both are taken by first occurrence over `entries` (`bar.ts:467` for the slices; `fieldOrder`, `bar.ts:339-354`, puts a group's values its options do not hold after the options, in the order `countsOf` meets them, and a field with no options by count, then by label). Before: `entries` was `pinnedFirst(parts.flatMap((part) => part.collection.entries))` (base `Collection.svelte:157`), so every hub's pinned entries came first across the hubs, then every hub's other entries in the file's order, hub after hub. After: `entries` is `parts.flatMap((part) => cardOrder(...))` (`Collection.svelte:156-160`), each hub's entries in its own collection's order, pinned first within that hub, then the next hub's. A value first met in a pinned entry of the second hub, which came before the first hub's unpinned entries, now comes after every value of the first hub. The cards drawn (`shown`) were already per hub on the base (`pinnedFirst(part.collection.entries)` per part, base :214-220), so their hub order does not change.
- The Status choices of a file with no schema (`lifecycle = offeredStatuses(schema, statusFacets(entries))`, `Collection.svelte:164`; `offeredStatuses`, `index.ts:843-848`). Before: the statuses in the order first met over the pinned-first file order across hubs. After: the order first met over `cardOrder`'s order per hub. A file with no schema reads every word of its `sort:`, and `status` there compares by the collator (no options), so with `status` in its sort the choices come alphabetically; with no `sort:` they come in the order first met over the cards' titles.
- List mode's rows (`EntryList`, given `shown` at `Collection.svelte:392-393`). Before: the rows started in the file's order, pinned first. After: they start in the collection's order, as the cards do; a click on a column header sorts by that column as before.
- A hub's own `collections:` entry with no `sort:`. Before: its cards went in the file's order, pinned first. After: they go by the card's title (`entryWords`), pinned first, by `CARD_COLLATOR`; oculus's own entry of the same key does not lend its `sort:` to a hub's own entry.

## Anything in the brief that was wrong

- C13's second sentence, handed back and ruled (above): a hub whose list names no people or funding entry has no such collection; only oculus's literature entry is added (`src/lib/data/index.ts:201`).
- C18 named `bar.ts:466`; the slice line is :467, ruled (above). The file is `src/lib/state/boards/collection/bar.ts`; the ruling's path `src/lib/state/boards/board/bar.ts` does not exist (`find src -name bar.ts` prints only the collection path).
- The paths list lacked `src/lib/server/files/project/make.ts`, whose head comment lists what each template line sets; ruled (above).
- `make.test.ts`'s expected entries and the `tasks()` helper of `schema-rules.test.ts` had to change for the new default sorts (above); both files are in the paths list.
- The brief's check 3 form names `bin`, which the worktree does not have; `find` reports it and the gate runs over the rest.
- The brief's 5000ms default test timeout is not met by three unchanged test files while other steps' test runs load the machine (check 1 and check 2 above); this is no defect of the step's code, and the files pass alone or with a longer timeout as quoted.

## Repair round 1

Every item of the round is made. After the last change, check 1 passes in full and `npm run test:quick` prints "every command passed".

The round's brief is `.scratch/migration/agents/briefs/O137-round-1.md`, over the review `.scratch/migration/agents/reviews/O137-refuter.md`. The nine items, each as made:

### Item 1 (Proof 1): the changed schema-rules test over the base's code

The scratch copy is `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o137/base-run`: `cp -R ../O137-base` (which holds `config docs src tests utils` only), with the worktree's unchanged `package.json`, `vite.config.ts`, `tsconfig.json`, `.npmrc`, `.svelte-kit` and `assets` copied in (none of them is changed by the step: `git status --short` lists none) and `node_modules` a symlink to the worktree's. The worktree's changed `tests/data/snapshot/schema-rules.test.ts` is copied in, and in the copy only the two sort rows are taken out of `KEY_ROWS` into an `it.skip('the two sort rows, held back on the base', ...)` whose body holds them, so `sentence('findings.schema.sort_unknown', 'due')`, which the catalog guard (`schema-rules.test.ts:40`) refuses on the base, is never called. Run from the copy's root:

```
$ npx vitest run --reporter=verbose tests/data/snapshot/schema-rules.test.ts
 <down arrow> |unit| tests/data/snapshot/schema-rules.test.ts > the primary key, the foreign keys and the display ranks of a hub schema > the two sort rows, held back on the base
 <check mark> ... > gives the findings of 'a schema that flags no primary key' 34ms
 <check mark> ... > gives the findings of 'a schema that flags two' 32ms
 <check mark> ... > gives the findings of 'an entry\'s primary_key beside the sc<horizontal ellipsis>' 31ms
 <check mark> ... > gives the findings of 'a primary key on a tags field' 30ms
 <check mark> ... > gives the findings of 'a primary_key that is not true' 33ms
 <check mark> ... > gives the findings of 'a primary key on a field of a records<horizontal ellipsis>' 32ms
 <check mark> ... > gives the findings of 'a file with no schema whose collectio<horizontal ellipsis>' 31ms
 <check mark> ... > gives the findings of 'nothing for a file with no schema who<horizontal ellipsis>' 33ms
 <check mark> ... > gives the findings of 'a foreign key naming nothing' 41ms
 <check mark> ... > gives the findings of 'an empty foreign key' 36ms
 <check mark> ... > gives the findings of 'a foreign key naming a collection who<horizontal ellipsis>' 35ms
 <check mark> ... > gives the findings of 'a target of a foreign key whose schem<horizontal ellipsis>' 31ms
 <check mark> ... > gives the findings of 'two fields of one display rank' 29ms
 <check mark> ... > gives the findings of 'a display rank that is no whole numbe<horizontal ellipsis>' 35ms
 <check mark> ... > gives the findings of 'a from: left on a schema field' 30ms
 <check mark> ... > gives the findings of 'a reference naming a venue by its nam<horizontal ellipsis>' 30ms
 Test Files  1 passed (1)
      Tests  54 passed | 1 skipped (55)
21:53  up 1 day,  5:56, 1 user, load averages: 4.57 7.74 10.14
```

(The `...` stands for the file and describe path printed in full on each line; the run's whole output is `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o137/base-run-schema.txt`.) What it shows: the twelve `KEY_ROWS` rows whose fixture plants a tasks file through `tasks()` ('a schema that flags no primary key', 'a schema that flags two', "an entry's primary_key beside the schema's flag", 'a primary key on a tags field', 'a primary_key that is not true', 'a primary key on a field of a records field', 'a foreign key naming nothing', 'an empty foreign key', 'a foreign key naming a collection whose file has no primary key', 'two fields of one display rank', 'a display rank that is no whole number from 1', 'a from: left on a schema field') pass over the base's code with the schema's `status` and `deadline` added, so the two added fields change no expected finding there; the other 38 tests of the file, and the four `KEY_ROWS` rows that plant no tasks file, pass as well. The same rows pass after the change (check 1 below). This is the run on the unchanged tree that check 8 asks for, for the behaviour those rows preserve.

### Item 2 (Proof 2): the greps and the duplicate key

History words, over the added comment lines and test titles of the whole step:

```
$ git diff 6779731e1 -- src tests config docs/HELP.md docs/templates.md docs/data-map.md | grep '^+' | grep -v '^+++' | grep -E '^\+\s*(//|\*|/\*\*|#)|describe\(|it\(|it\.each|name:' | grep -n -i -E "before|used to|no longer|still|always has been|always had|as before|previously|the step adds|after this package lands|\bO[0-9]+\b|20[0-9][0-9]-[0-9][0-9]"
72:+ * so `2` sorts before `10`.
```

The one hit, in the doc of `CARD_COLLATOR` (`index.ts:734-737`), states an order (the digits read as a number), and no earlier state: no history.

Reuse, the base's `src` and `tests` for each new name and its key call (`grep -rn` from `../O137-base`):

- The six names: `grep -rn "cardOrder\|sortText\|filledFirst\|CARD_COLLATOR\|sortShape\|sortFindings" src tests` prints `sortText: item.sortText` in `src/lib/server/machine/apps/host/runner/tools/languages/convert.mjs:94` (an LSP completion field, unrelated) and `export function sortFindings(findings: Finding[]): Finding[]` at `src/lib/data/snapshot/validate.ts:481`, imported by `hubs/self.ts:16`, `hubs/merge.ts:38`, `sources/clones.ts:19` and `data/index.ts:74`. That `sortFindings` sorts a list of findings; it is no rule the new one could reuse. The new `sortFindings` in `run.ts:366` is local to `run.ts` (which does not import validate's), so the build has no clash, but two functions of one name with two meanings sit in one folder tree (`data/snapshot/`). This is a finding for the orchestrator: renaming the new one (`sortFieldFindings`, for one) ends it; this round makes only the nine ruled changes, so it is not renamed here.
- `cardOrder` and `filledFirst`: the board's `compareCards` (`src/lib/state/boards/board/presets.ts:364`, pinned first, then each word of a category's `sort:`) and `byWord` (`presets.ts:340-357`, with `year` missing last inline) are the nearest. They compare a `BoardItem` by the three fixed words `stage`, `year` and `title` and cannot take a schema field; the missing-last rule there is an inline branch of `byWord`, no helper. `stageRank` (`presets.ts:327-330`) is the one rule of the two that fits a collection, and item 5 reuses it.
- `CARD_COLLATOR`: `grep -rn "Intl.Collator" src` prints nothing on the base; the existing sorts use `String.prototype.localeCompare` (47 files under the base's `src`, `grep -rln "localeCompare" src | wc -l`, among them `ui/display/table/table-rows.ts:52`, `state/boards/collection/bar.ts:352`, `state/boards/board/facets.ts:164,175,182`, `presets.ts:355`), whose order follows the reader's locale and which reads `10` before `2`. Item 4 of the brief asks for one collator with `numeric: true` that orders the same in every locale, so none of these is reused.
- `sortShape`: `grep -rn "z.array(wordShape)" src` prints `const keysShape = unchanged(z.array(wordShape));` (`src/lib/server/edit/writes/bodies.ts:293`, a server write body, wrapped in `unchanged`) and `const wordsShape = z.array(wordShape);` (`src/lib/data/snapshot/normalise-parts/retrieval.ts:49`, not exported). Neither is exported, and the snapshot's normaliser is a layer `data/helpers/hub-names.ts` does not import, so the shape is written in `hub-names.ts` from the file's own `wordShape` (`hub-names.ts:261`).
- `sortText`: the base's only `sortText` is the LSP completion field above. Its key call, the first item of a list value read as a text, has a near reader in `readAs(filledTextShape, ...)` (`entryStatus`, `index.ts:636`), which reads a filled text only and gives no text for a number or a list, and `filledText` (`src/lib/data/shapes/shapes.ts:59`), the same reader as a function. `sortText` could take its text case from `filledText`, but `filledText` keeps a text of only spaces, which `sortText` counts as missing (`text.trim() === ''`), so the number and list cases and the trim stay in `sortText`. No change is made here; the round makes only the ruled changes.

`movedOrder` after its move:

```
$ grep -rn "movedOrder" src tests docs config --exclude=local.yml
src/lib/state/life/slides.ts:178:function movedOrder(order: readonly string[], at: number, to: number): string[] | null {
src/lib/state/life/slides.ts:188:    return movedOrder(list, list.indexOf(name), to);
src/lib/views/sessions/terminal/list/TerminalList.svelte:75:        movedOrder,
src/lib/views/sessions/terminal/list/TerminalList.svelte:235:            restateInstance(instance, reordered(tab, movedOrder(order, moved, at)));
src/lib/views/sessions/terminal/terminal-list.ts:196:export function movedOrder(order: readonly string[], moved: string, index: number): string[] {
```

The slides one is local, its one caller `withMove`; the terminal list's `movedOrder` is a different function (it moves a name, not an index) and stands on the base the same (`TerminalList.svelte:75,235`, `terminal-list.ts:196`).

The key the step introduces, `sort:` on a `collections:` entry, by reading the code:

- Empty: `sort: []` is no sort and no problem (`hub-names.ts:346`, `else if (sort.length > 0)`); a list holding an empty text fails `wordShape` and is `sort_unread` (`hub-names.ts:345`); with no sort the cards go by title.
- A field given twice, `sort: [date, date]`: `entryOf` keeps the list as written, so the config merge gives no finding; `cardOrder` builds one compare per word (`index.ts:811`) and the second `date` compare runs only on the ties the first leaves, which it leaves tied, so the order is the order of `sort: [date]`. If the field is one the schema does not name, `sortFindings` gives one `sort_unknown` per occurrence (`run.ts:377`, a `filter` then `map` over the list), so two findings for a doubled unknown field.
- Colliding: the list entry's shape is a loose object (`entryShape`, `hub-names.ts:249`), and the base read no `sort` key of an entry (`grep -n sort` of the base's `hub-names.ts` prints only an `Array.prototype.sort` call at :186), so the key meets no earlier meaning on the list entry; a category's `sort:` (`config/catalogs/vocab.yml`) is a key of another file, read by `presets.ts`, and does not meet this one. A sort word naming the primary key or the title field is read like any other field.

The edits to existing tests, one row per changed line, from `git diff -U0 6779731e1 -- tests` (lines that only add new tests are left out):

| File:line (after) | Before | After |
| --- | --- | --- |
| schema-rules.test.ts:512 | `/** A tasks file whose schema is the lines given, holding one task. */` | `const STATUS = '{ field: status, type: text }';` |
| schema-rules.test.ts:513 | (none) | `const DEADLINE = '{ field: deadline, type: date }';` |
| schema-rules.test.ts:515-518 | (none) | the doc: the schema is the lines given and the `status` and `deadline` fields oculus's tasks entry sorts by |
| schema-rules.test.ts:520 | (none) | `const sorted = [...schema, STATUS, DEADLINE];` |
| schema-rules.test.ts:521 | `return ['schema:', ...schema.map(...)` | `return ['schema:', ...sorted.map(...)` |
| schema-rules.test.ts:700 | `describe('the primary key, the foreign keys and the display ranks of a hub schema'` | `describe('the primary key, the foreign keys, the display ranks and the sort fields of a hub schema'` |
| collections.test.ts:242 | (none) | `sort: ['status', 'deadline'],` in the jobs entry of 'reads every field' |
| collections.test.ts:261 | `it('carries the registry, the flags, the skip and the ticker onto the collection read'` | `it('carries the registry, the flags, the skip, the ticker and the sort onto the collection read'` |
| collections.test.ts:272 | `ticker: { category: 'task', undated: true }` | `ticker: { category: 'task', undated: true },` |
| collections.test.ts:273 | (none) | `sort: ['status', 'title']` (input) |
| collections.test.ts:284 | (none) | `sort: ['status', 'title'],` (expected) |
| demo config.yml:7 | the comment lists registry, features, ticker category, place, words | the same with "the fields its cards are sorted by (each one the file's own schema names)" |
| demo config.yml:13-22 | the ten card-list entries with no `sort:` | each with its `sort:` after `ticker:` (applications `[status]`) |
| make.test.ts:241 | `// ... its registry, flags, ticker and words.` | `// ... its registry, flags, ticker, sort and words.` |
| make.test.ts:248 | (none) | `sort: ['status', 'deadline'],` (first expected entry) |
| make.test.ts:260 | (none) | `sort: ['status', 'deadline'],` (second expected entry) |
| board-rules.test.ts:759 | (none) | `'  - { field: deadline, type: date }',` in the tasks fixture |

### Item 3 (Proof 3)

The judgment call on the two `cardOrder` calls is corrected in place above: `entries` (`Collection.svelte:156`) is read by `lifecycle` (:164) and `collectionBar` (:202), and the card cursor compares card identities (:138, :409).

### Item 4 (Standards 1): the rewrapped comments

Each paragraph is rewrapped whole at 100 columns, words unchanged (greedy: no line ends short of a next word that fits). Widths after, `awk '{print length}'` over each paragraph:

```
src/lib/data/helpers/hub-names.ts:304-309 (entryOf doc)         100 99 98 100 100 26
src/lib/state/boards/collection/index.ts:742-744 (sortText)     100 99 15
src/lib/state/boards/collection/index.ts:773-776 (fieldCompare) 100 97 98 22
src/lib/data/snapshot/schema/run.ts:7-16 (head comment)         94 95 92 97 100 95 100 97 98 98
src/lib/data/sources/collections.ts:7-13                        92 99 96 98 98 100 31
src/lib/views/shared/forms/entry/card/EntryCard.svelte:2-11     88 100 100 93 70 100 97 99 93 62
```

The run.ts paragraph now ends at :16 (it was :17); its first six lines are as they were, since they were already full. In `EntryCard.svelte` the line of 70 is followed by `(state/boards/structure/cross-links.ts,`, which does not fit. The `docs/templates.md` comment (item 6) is rewrapped the same way: `docs/templates.md:62-80`, widths `98 99 99 87 99 98 100 97 99 87 97 95 94 96 94 95 95 96 60`.

### Item 5 (Standards 2): `stageRank`

`fieldCompare` (`src/lib/state/boards/collection/index.ts:778-789`) ranks a status value by `stageRank` and its own `place` is gone:

```ts
    const options = field === STATUS_FIELD ? optionKeys(declared) : [];
    const texts =
        declared?.type === 'date'
            ? (left: string, right: string): number => (left < right ? -1 : left > right ? 1 : 0)
            : (left: string, right: string): number =>
                  stageRank(left, options) - stageRank(right, options) ||
                  CARD_COLLATOR.compare(left, right);
```

with `import { stageRank } from '../board/presets.ts';` (`index.ts:56`; `index.ts` already imports `../board/state.ts`, and `presets.ts` imports nothing of `collection/`). `presets.ts` is read, not changed. With no options `stageRank` gives every value `0`, so the collator decides, as before. The case-run after this round (`CASE_OUT=r1-after.txt npx vitest run --testTimeout 120000 --config /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o137/vitest.case.config.mjs`, the program unchanged, its timeout raised because test:quick was running beside it) prints `Test Files  1 passed (1)`, and `diff` of its output against the first after run differs only in the C7 lines: the research hub's `applications.yml` changed in between (`git log -1 -- .oculus/data/academic/applications.yml` in the hub: `1c0d40fdd 2026-11-03 21:31:35 +0100 Order the hub's status options by stage and mark the UGent application as interview`). Its C7 lines now, as printed:

```
C7 applications sort ["status","deadline"]
  C7 active 2026-11-04 | Maastricht University, Universitair Docent Klinische Epidemiologie
  C7 active 2026-11-15 | VIB.AI, Group Leader
  C7 active 2026-11-22 | Maastricht University, Assistant Professor in Methodology and Statistics
  C7 active 2026-11-27 | University of Luxembourg, Postdoctoral researcher in Biomedical AI & Federated MLOps
  C7 active 2027-01-21 | Defensie, Reservist Officer
  C7 applied 2026-11-01 | Maastricht University, Assistant Professor in Predictive Brain Processes
  C7 interview 2026-10-27 | BioML UGent Doctor-assistent
  C7 accepted - | Twente, Cancer AI
  C7 accepted - | UHasselt, FL BDS
  C7 not-applied - | Denmark, AI ZAP
  C7 not-applied - | KTH, Sign Language
  C7 not-applied - | Luxembourg, AI
  C7 not-applied - | Luxembourg, ZAP
  C7 not-applied - | Ume<U+00E5>, Precision ZAP
  C7 not-applied - | Uppsala, Precision ZAP
  C7 not-applied - | Lund, Paleogenomics
  C7 not-applied - | Hasselt, Neuroscience ZAP
  C7 not-applied - | UCD, RWE ZAP
  C7 declined - | UCD, RWE postdoc
  C7 declined - | Wageningen, FL
  C7 rejected - | UHasselt, Immunology TT
  C7 rejected - | Larian Studios, Engine Programmer
  C7 rejected - | Guerrilla Games, Senior Data Analyst
  C7 rejected - | Oslo, ML Integreat
  C7 rejected - | Uppsala, ML Theory
  C7 rejected - | Twente, Aneurysm
  C7 rejected - | Maynooth, CS ZAP
  C7 rejected - | Hasselt, Data Science ZAP
  C7 withdrawn - | Oslo, Plague
  C7 withdrawn - | Tilburg, EEG
  C7 withdrawn - | Utrecht, NLP
```

Every other line (C1 to C6, C8 to C18, the C2 hub lines) is the same as the first after run, so the order under `stageRank` is the order under the old `place`. The C7 order follows the file's new status options, with the deadline oldest first inside a status. C7's literal list in the brief ("the nine not-applied entries first") described the hub's old option order; under the hub's current options the applications go active, applied, interview, accepted, not-applied, declined, rejected, withdrawn. Open item 660's option (a) appears to be in the hub's data already.

### Item 6 (Standards 3): the `sort:` bullet

`config/defaults/sources.yml:32` now reads, in its second half: "...; any other field alphabetically, case and accents ignored; and a card that holds no value of a field after those that hold one. The six files drawn by oculus's own views carry none. A field the schema does not name is a finding and is not read, and a `collections:` entry with no `sort:` draws its cards by their title." ("a card" for a file's record, "a `collections:` entry" for the list entry; the sentence on the six files is moved up so the bullet ends as ruled.) The copy in `docs/templates.md`'s config comment said "with no `sort:` the cards go by their title"; it now says "a `collections:` entry with no `sort:` draws its cards by their title", and the paragraph is rewrapped (item 4's widths). Its words for the record were already "cards".

### Item 7 (Standards 5)

`tests/data/snapshot/schema-rules.test.ts:700`: `describe('the primary key, the foreign keys, the display ranks and the sort fields of a hub schema', () => {`. `prettier --check` accepts the line. G56 in `agents/guarded.md` is the orchestrator's file and is not touched.

### Item 8 (Behaviour 1)

The "Before and after" section above gains four rows: the status slices and the "other" values of a `filter: true` group in a workspace of several hubs; the Status choices of a file with no schema; List mode's rows; and a hub's own `collections:` entry with no `sort:`. A hub's own list replaces oculus's list (the case-run's C13 second hub reads only `["events","literature"]`), so a hub's own entry carries only the `sort:` it writes.

### Item 9 (Behaviour 2)

`docs/HELP.md:279`'s sentence now reads: "When a write changes a card's pin or a field the collection's cards are sorted by, the card moves to its place." The judgment call above quotes it.

### The round's verify list, after the last change

Check 1, the same 50 files as the first run:

```
21:57  up 1 day, 6 hrs, 1 user, load averages: 4.59 7.90 9.79
 Test Files  50 passed (50)
      Tests  1260 passed | 9 skipped (1269)
   Start at  21:57:53
   Duration  110.64s (transform 22.91s, setup 0ms, import 104.04s, tests 327.27s, environment 11ms)
21:59  up 1 day,  6:02, 1 user, load averages: 10.99 9.30 10.09
```

Check 2: `npm run diagrams` (exit 0), then `npm run test:quick` once. In the round the list ran once, and no whole-suite command was run. Result lines as printed:

```
test:quick: 38 changed file(s), from git since HEAD
test:quick: 228 test file(s)
ok      prettier (1.6 s): All matched files use Prettier code style!
ok      ASCII gate (1.6 s)
ok      svelte-kit sync (2.9 s)
ok      eslint (16.5 s)
ok      svelte-check (56.1 s): 1793739663270 COMPLETED 581 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest checks (234.5 s): Duration  214.18s (transform 133.05s, setup 0ms, import 266.14s, tests 456.51s, environment 6ms)
ok      vitest (272.0 s): Duration  252.97s (transform 247.03s, setup 0ms, import 451.56s, tests 497.77s, environment 17.41s)
ok      vitest slow (348.1 s): Duration  329.30s (transform 62.47s, setup 0ms, import 216.50s, tests 1086.33s, environment 15ms)
test:quick: 351.1 s; every command passed
22:05  up 1 day,  6:08, 1 user, load averages: 12.19 13.90 12.32
```

No red line, so no file was rerun alone.

Check 3, the rules file's gate over the changed files and this report: printed nothing, exit 0.

Check 4, `sh utils/unused-exports.sh` (exit 0) against `../O137-base/unused-exports.txt`:

```
326c326
< src/lib/state/workbench/ui.svelte.ts: CardMove, OwnedInstance, TerminalOwner, PaneStripKey
---
> src/lib/state/workbench/ui.svelte.ts: OwnedInstance, TerminalOwner, PaneStripKey
```

The one difference is `CardMove`, removed with the move; no new name.

Check 5: `sh utils/folder-check.sh` printed nothing, exit 0.

Check 6: the grep printed nothing, exit 1.

Check 7:

```
158:            cardOrder(part.collection.entries, part.collection.sort, part.schema)
219:            cardOrder(part.collection.entries, part.collection.sort, part.schema)
```

Check 8: item 1's run above, and check 1 after the change.

### The files this round changes, with line counts after (`wc -l`)

- `src/lib/data/helpers/hub-names.ts` 857 (the entryOf doc)
- `src/lib/state/boards/collection/index.ts` 872 (the `stageRank` import, `fieldCompare`, the sortText and fieldCompare docs)
- `src/lib/data/snapshot/schema/run.ts` 610 (the head comment)
- `src/lib/data/sources/collections.ts` 218 (the head comment)
- `src/lib/views/shared/forms/entry/card/EntryCard.svelte` 328 (the head comment)
- `config/defaults/sources.yml` 115 (the `sort:` bullet)
- `docs/templates.md` 1925 (the config comment, lines 62-80)
- `docs/HELP.md` 620 (line 279)
- `tests/data/snapshot/schema-rules.test.ts` 786 (the describe title at :700)
- `docs/diagrams/*`, regenerated by `npm run diagrams`; after it `git status --short docs/diagrams` lists the same six files the step changes (`layer-state`, `layer-views`, `layers`, each `.dot` and `.svg`), since the new import runs inside `state/boards` and adds no folder edge
- `.scratch/migration/agents/reviews/O137-report.md`, this report

The step as a whole: `git diff 6779731e1 --stat` prints `34 files changed, 663 insertions(+), 690 deletions(-)`.
