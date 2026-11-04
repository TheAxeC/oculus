# O143 report: a `stopped` status

Everything in the brief is done.

## Open items of the state file, verbatim

From `.scratch/migration/orchestrator-state.md:181-184` (read with the Read tool):

```
## Open items (only what Axel must rule on; every report tells him these in plain words, decisions first, until he has ruled)

An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own.
```

The list holds no entry.

## The cases' first run, on the unchanged tree

Run from the worktree root before any edit, `git status --short` printing nothing afterwards.

- C1. `python3 -c "import yaml; print(yaml.safe_load(open('config/catalogs/vocab.yml'))['statuses'].get('stopped', 'ABSENT'))"` printed `ABSENT`. Holds as the brief says.
- C2. Case-run program: `C2 stopped: deadline radar lines 1 "Scheme at stopped"` and `C2 withdrawn: deadline radar lines 0`. The scheme at `stopped` is on the radar, the one at `withdrawn` is not.
- C3. Case-run program: `C3 findings 1`, `C3   entries[0].status: status "stopped" is not a word of the statuses list; the closest word is dropped`.
- C4. Case-run program: `C4 stopped: awaiting grants 0`, with the control `C4 submitted: awaiting grants 1 "Scheme at submitted"` showing the box lists a `deadline_met` scheme on the same input.
- C5. `sed -n 1407p docs/templates.md` printed `... options: [in-prep, planned, submitted, contributing, awarded, rejected, withdrawn], ...`; `sed -n 1436,1437p` printed `# required: in-prep, planned, submitted, contributing,` / `# awarded, rejected or withdrawn`. Neither names `stopped`; `grep -n stopped docs/templates.md` hits only `:376`, `:909` and `:975`, none in the Funding template.
- C6. `sed -n 1565p docs/templates.md` printed `options: [active, applied, interview, offered, accepted, not-applied, declined, rejected, withdrawn]`.
- C7. Case-run program: `C7 stopped: task lines 2 "Scheme at stopped - Chase the funder" "Scheme at stopped: Draft the budget"`. Both the follow-up and the subtask are lines.
- C8. Case-run program: `C8 stopped: tone grey`.

Every case reproduced the brief's base result; no case was wrong.

## DONE / NOT DONE

| Item | State | Command | Last line printed |
| --- | --- | --- | --- |
| 1. `stopped` in `statuses:` after `not-applied` | DONE | `git diff config/catalogs/vocab.yml` | `+  stopped:       { color: "#9ca3af", closes_deadline: true }` |
| 2. Funding template options and entry comment | DONE | `git diff docs/templates.md` | `+#                                 # awarded, rejected, withdrawn or stopped` |
| 3. Item 3's grep, each hit named | DONE | the grep below | every hit judged in the section below; none made false |
| Verify 1, the four test files | DONE | `npx vitest run tests/data/shapes/catalog-files/vocab.test.ts tests/data/sources/config/layers/hub-vocab.test.ts tests/checks/config/config-folder.test.ts tests/data/snapshot/schema-rules.test.ts` | `Test Files  4 passed (4)` / `Tests  139 passed \| 2 skipped (141)` |
| Verify 2, diagrams then the verify list once | DONE | `npm run diagrams`, then `npm run test:quick` | `test:quick: 35.5 s; every command passed` |
| Verify 3, ASCII of the two files | DONE | `LC_ALL=C perl -ne 'print "$ARGV:$.: $_" if /[^\x20-\x7E\n]/; close ARGV if eof' config/catalogs/vocab.yml docs/templates.md` | nothing (exit 0) |
| Verify 4, YAML parses | DONE | `python3 -c "import yaml; yaml.safe_load(open('config/catalogs/vocab.yml'))"` | nothing (exit 0) |
| Cases C1 to C8 after the change | DONE | the reads and the case-run program below | see "The cases after the change" |

The two skipped tests of verify 1 are named by the verbose reporter: `tests/checks/config/config-folder.test.ts > oculus's own config directory > names a group of its own and a path under the hub for every document of the real hub (skipped: OCULUS_TEST_HUB is not set)` and `... > matches the real hub's own files to a schema each, read with no finding (skipped: OCULUS_TEST_HUB is not set)`.

The verify list's result lines (`npm run test:quick`, exit 0):

```
test:quick: 2 changed file(s), from git since HEAD
test:quick: 2 test file(s)
        tests/checks/config/templates.test.ts: named for a changed file
        tests/data/shapes/catalog-files/vocab.test.ts: named for a changed file
ok      prettier (1.4 s): All matched files use Prettier code style!
ok      ASCII gate (1.5 s)
ok      svelte-kit sync (2.9 s)
ok      vitest checks (16.8 s): Duration  1.78s (transform 687ms, setup 0ms, import 1.59s, tests 24ms, environment 0ms)
ok      vitest (27.8 s): Duration  12.77s (transform 3.00s, setup 0ms, import 4.51s, tests 8.13s, environment 0ms)
ok      svelte-check (32.4 s): 1793753202739 COMPLETED 581 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
test:quick: 35.5 s; every command passed
```

The verify list ran once. No whole-suite command ran. The four-file vitest run of verify 1 ran twice, the second time with the verbose reporter only to name the two skipped tests.

The full ASCII gate of spec.md over the two files (`LC_ALL=C perl -ne 'my $l = $_; $l =~ s/\xC3[\x80-\xBF]//g if $ARGV =~ m{^config/}; ...' config/catalogs/vocab.yml docs/templates.md`) printed nothing.

`sh utils/unused-exports.sh` after the last change, compared with `diff .agents/worktrees/O143-base/unused-exports.txt <the new list>`: no difference (exit 0, 335 lines). The step changes no TypeScript.

No test is added or changed.

## The cases after the change

- C1. The same `python3` read printed `{'color': '#9ca3af', 'closes_deadline': True}`.
- C2. `C2 stopped: deadline radar lines 0` and `C2 withdrawn: deadline radar lines 0`. The scheme at `stopped` leaves the radar as the one at `withdrawn` does.
- C3. `C3 findings 0`.
- C4. `C4 stopped: awaiting grants 0`, control `C4 submitted: awaiting grants 1 "Scheme at submitted"`. Unchanged.
- C5. `sed -n 1407p docs/templates.md | grep -o 'options: \[[^]]*\]'` printed `options: [in-prep, planned, submitted, contributing, awarded, rejected, withdrawn, stopped]`; `sed -n 1436,1437p` printed `#    status: in-prep              # required: in-prep, planned, submitted, contributing,` / `#                                 # awarded, rejected, withdrawn or stopped`.
- C6. `sed -n 1565p docs/templates.md | grep -o ...` printed `options: [active, applied, interview, offered, accepted, not-applied, declined, rejected, withdrawn]`; its comment `:1582-1583` reads `# required: active, applied, interview, offered, accepted,` / `# not-applied, declined, rejected or withdrawn`. Unchanged, no `stopped`.
- C7. `C7 stopped: task lines 0`.
- C8. `C8 stopped: tone grey`.

## The case-run program, its source and every run

Three files in `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o143-builder/`, run from the worktree root with:

```
PATH=/Users/axelfaes/.nvm/versions/node/v24.21.0/bin:$PATH npx tsx --import <scratch>/svelte-hook.mjs <scratch>/cases.mts
```

`ticker.ts`, `focus.ts` and `tones.ts` import `src/lib/state/shared/words/generation.svelte.ts`, which holds a `$state` rune, so tsx alone stops with `$state is not defined`. The two hook files compile every `.svelte.ts` module with Svelte's own `compileModule` (`generate: 'server'`) after Node's `stripTypeScriptTypes`, so the rune runs as Svelte compiles it; nothing in the tree is shimmed. The program writes no file; `git status --short` after each run printed only the step's two files.

`svelte-hook.mjs`:

```js
// Registers svelte-hooks.mjs, a load hook that runs every `.svelte.ts` module through Svelte's own
// module compiler, so the runes in the tree's state modules ($state) are compiled as Svelte
// compiles them. Svelte's compiler is resolved from the current directory, the worktree's root.
import { createRequire, register } from 'node:module';
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';

const fromRoot = createRequire(join(process.cwd(), 'package.json'));
const compiler = pathToFileURL(fromRoot.resolve('svelte/compiler')).href;
register('./svelte-hooks.mjs', import.meta.url, { data: { compiler } });
```

`svelte-hooks.mjs`:

```js
// The load hook svelte-hook.mjs registers: a `.svelte.ts` module has its types stripped by Node's
// own stripTypeScriptTypes and is then compiled by Svelte's compileModule for the server.
import { stripTypeScriptTypes } from 'node:module';

let compileModule;

export async function initialize(data) {
    const compiler = await import(data.compiler);
    compileModule = compiler.compileModule ?? compiler.default.compileModule;
}

export async function load(url, context, nextLoad) {
    if (!url.split('?')[0].endsWith('.svelte.ts')) return nextLoad(url, context);
    const result = await nextLoad(url, { ...context, format: 'module' });
    const source =
        typeof result.source === 'string' ? result.source : new TextDecoder().decode(result.source);
    const plain = stripTypeScriptTypes(source);
    const compiled = compileModule(plain, { filename: new URL(url).pathname, generate: 'server' });
    return { format: 'module', source: compiled.js.code, shortCircuit: true };
}
```

`cases.mts`:

```ts
// Case-run program of O143: C2, C3, C4, C7 and C8 over the tree in the current directory, each
// built in memory and run through the tree's own code. It prints one result per case and writes
// nothing.
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const from = (rel: string): Promise<any> => import(pathToFileURL(join(root, rel)).href);

const { engineDir, loadConfig, textCatalog } = await from('src/lib/data/sources/config.ts');
const { portfolioConfigFrom } = await from('src/lib/data/index.ts');
const { validate } = await from('src/lib/data/snapshot/validate.ts');
const { ticker } = await from('src/lib/state/boards/ticker.ts');
const { waiting, setting } = await from('src/lib/state/boards/focus.ts');
const { setCatalog } = await from('src/lib/state/shared/words/text.ts');
const { setVocab, statusTone } = await from('src/lib/state/shared/words/tones.ts');
const { NO_FEEDS } = await from('tests/fixtures/entities-fixture.ts');

const OWN = loadConfig(engineDir()).config;
const CONFIG = portfolioConfigFrom(OWN);
setCatalog(textCatalog(OWN));
setVocab({ primary: null, lists: {}, order: [], own: OWN, ownCollections: [] });

/** Oculus's own `collections:` entry of the funding registry, by which the ticker finds it. */
const ownCollections = (OWN.collections as { registry?: string }[]).filter(
    (one) => one.registry === 'funding'
);
const lists = { lists: {}, ownCollections };

const NOW = Date.parse('2026-11-04T12:00:00Z');
const horizon = setting(OWN, 'deadline_horizon_days', 90);

/** A funding scheme at `status`, its deadline 27 days ahead, with what `extra` adds. */
function scheme(status: string, extra: Record<string, unknown> = {}): Record<string, unknown> {
    return {
        id: `s-${status}`,
        title: `Scheme at ${status}`,
        status,
        deadline: '2026-12-01',
        followups: [],
        subtasks: [],
        tags: [],
        projectIds: [],
        pillarIds: [],
        ...extra
    };
}

/** A snapshot holding the given funding schemes and nothing else. */
function snapshotOf(schemes: Record<string, unknown>[]): Record<string, unknown> {
    const funding = Object.fromEntries(schemes.map((one) => [one.id, one]));
    return {
        version: 1,
        entities: {
            projects: {},
            venues: {},
            datasets: {},
            pillars: {},
            domains: {},
            funding,
            people: {},
            organisations: {},
            resources: {},
            collections: {},
            feeds: NO_FEEDS,
            career: null
        },
        relations: {},
        findings: []
    };
}

const titles = (lines: { label?: string; title?: string; text?: string }[]): string[] =>
    lines.map((one) => JSON.stringify(one.label ?? one.title ?? one.text ?? one));

console.log(`deadline_horizon_days = ${horizon}; now = 2026-11-04; deadline = 2026-12-01`);

// C2: a scheme at stopped, and one at withdrawn, each with a deadline inside the horizon.
for (const status of ['stopped', 'withdrawn']) {
    const out = ticker(snapshotOf([scheme(status)]), OWN, NOW, undefined, lists);
    const lines = [...out.overdue, ...out.deadlines];
    console.log(`C2 ${status}: deadline radar lines ${lines.length} ${titles(lines).join(' ')}`);
}

// C3: the vocabulary check over a funding file holding one entry at stopped.
const file = '/synthetic/hub/.oculus/data/academic/funding.yml';
const raw = {
    manifests: [],
    registries: Object.fromEntries(
        [
            'venues',
            'datasets',
            'pillars',
            'domains',
            'funding',
            'people',
            'organisations',
            'resources'
        ].map((name) => [name, { entries: [], meta: {} }])
    ),
    collections: {
        funding: {
            key: 'funding',
            file,
            meta: {},
            entries: [{ key: 'g1', title: 'G', status: 'stopped', provenance: { file, index: 0 } }],
            index: 0
        }
    },
    feeds: {},
    career: null,
    docs: {},
    decks: {},
    findings: []
};
const found = validate(raw, { vocab: CONFIG.vocab, text: CONFIG.text });
console.log(`C3 findings ${found.length}`);
for (const one of found) console.log(`C3   ${one.key}: ${one.message}`);

// C4: the Focus awaiting box's grants, over a scheme at stopped.
for (const status of ['stopped', 'submitted']) {
    const box = waiting(snapshotOf([scheme(status)]), OWN, {});
    const named = box.grants.map((one: { title?: string }) => JSON.stringify(one.title));
    console.log(`C4 ${status}: awaiting grants ${box.grants.length} ${named.join(' ')}`);
}

// C7: a scheme at stopped with a due follow-up and an open subtask.
const busy = scheme('stopped', {
    deadline: undefined,
    followups: [{ key: 'f1', do: 'Chase the funder', after: '2026-10-01', done: false }],
    subtasks: [{ key: 't1', do: 'Draft the budget', done: false }]
});
const tasks = ticker(snapshotOf([busy]), OWN, NOW, undefined, lists).tasks;
console.log(`C7 stopped: task lines ${tasks.length} ${titles(tasks).join(' ')}`);

// C8: the tone an entry at stopped is drawn in.
console.log(`C8 stopped: tone ${statusTone('stopped')}`);
```

Run on the unchanged tree (Node's `ExperimentalWarning` for `stripTypeScriptTypes` filtered out):

```
deadline_horizon_days = 90; now = 2026-11-04; deadline = 2026-12-01
C2 stopped: deadline radar lines 1 "Scheme at stopped"
C2 withdrawn: deadline radar lines 0 
C3 findings 1
C3   entries[0].status: status "stopped" is not a word of the statuses list; the closest word is dropped
C4 stopped: awaiting grants 0 
C4 submitted: awaiting grants 1 "Scheme at submitted"
C7 stopped: task lines 2 "Scheme at stopped - Chase the funder" "Scheme at stopped: Draft the budget"
C8 stopped: tone grey
```

Run after the change:

```
deadline_horizon_days = 90; now = 2026-11-04; deadline = 2026-12-01
C2 stopped: deadline radar lines 0 
C2 withdrawn: deadline radar lines 0 
C3 findings 0
C4 stopped: awaiting grants 0 
C4 submitted: awaiting grants 1 "Scheme at submitted"
C7 stopped: task lines 0 
C8 stopped: tone grey
```

## Item 3's grep and what it found

`grep -rn -e 'withdrawn' -e 'not-applied' -e 'rejected or withdrawn' config docs src tests README.md --exclude=local.yml`, after the change:

| Hit | What it is | Judgment |
| --- | --- | --- |
| `config/catalogs/vocab.yml:145`, `:146` | the `withdrawn` and `not-applied` rows of `statuses:` | the list itself; `stopped` follows at `:147`; still true |
| `docs/templates.md:1407`, `:1437` | the Funding template's options and entry comment | changed by item 2 |
| `docs/templates.md:1565`, `:1583` | the Applications template's options and entry comment | kept, as the ruling and C6 say; still true |
| `src/lib/server/machine/lsp/relay/relay-server.ts:10,243,245,256,262,271` | the word "withdrawn" about language-server capabilities | unrelated to statuses |
| `src/lib/server/machine/apps/shell/registry.ts:371`, `src/lib/state/system/apps/shell/requests.svelte.ts:14` | the word "withdrawn" about an app's requests | unrelated to statuses |
| `tests/server/machine/apps/tools/language-features.test.ts:9,212,217,218,219`, `tests/server/machine/apps/tools/languages.test.ts:280,322,326` | the same language-server sense in tests | unrelated to statuses |
| `tests/fixtures/hubs/demo/.oculus/data/academic/applications.yml:8` | the demo hub's own Applications options | a fixture hub's own list of an Applications file, no copy of the Funding template; unchanged |
| `tests/data/snapshot/schema-rules.test.ts:250` | the closest-word row `not applied` to `not-applied` | still true: verify 1 ran this file green with `stopped` in the list |

A second grep for the Funding options in other words, `grep -rn -e 'in-prep, planned' -e 'contributing, awarded' config docs src tests README.md --exclude=local.yml`, hits only `docs/templates.md:1407` and `:1436`. The demo hub's `tests/fixtures/hubs/demo/.oculus/data/academic/funding.yml:8` (`options: [in-prep, planned, submitted, awarded, rejected]`, found with `find tests/fixtures -name funding.yml`) is that fixture hub's own list, which already differs from the template (no `contributing`, no `withdrawn`); it is not changed.

No hit is made false by the change, so no path was widened.

## The places of "What is on the tree" that describe `statuses:`

- `config/catalogs/vocab.yml:101-108`, the comment over `statuses:` defining the flags: still true.
- `docs/HELP.md:562` and `:565`: still true (they name the list, not its words).
- `docs/data-map.md:104` and `:226`: still true (same).
- `src/lib/data/shapes/catalog-files/vocab.ts:212-219`, the flag descriptions: still true.
- The head comments and doc comments of `closesDeadline`, `deadlineMet`, `statusFlag` (`src/lib/state/boards/focus.ts:189-225`), `wordFlag` (`src/lib/data/shapes/vocab-keys.ts:178-189`), `statusTone` (`src/lib/state/shared/words/tones.ts:228-232`) and `checkEntryStatus` (`src/lib/data/snapshot/validate.ts:258-279`): still true; no code changed.

## Files with line counts

From `diff -rq .agents/worktrees/O143-base/<d> .agents/worktrees/migration-O143/<d> --exclude=local.yml` over `src tests utils config` (one line: `config/catalogs/vocab.yml differ`), and `git diff --numstat` for `docs/`, which the base copy does not hold:

| Path | Change | In the write list |
| --- | --- | --- |
| `config/catalogs/vocab.yml` | +1 -0 (line 147), 312 lines | yes |
| `docs/templates.md` | +2 -2 (lines 1407, 1437), 1925 lines | yes |
| `.scratch/migration/agents/reviews/O143-report.md` | this report | yes |

`npm run diagrams` rewrote nothing tracked: `git status --short` after it printed only the two files above.

## Judgment calls the brief left open

1. The case-run program needs two hook files beside it, which compile the tree's `.svelte.ts` modules with Svelte's `compileModule` so tsx can import `ticker.ts`, `focus.ts` and `tones.ts`. They live in the scratch folder, outside the worktree, kept there so the reviewer can run the program again; their source is above.
2. C2, C4 and C7 run through the whole `ticker()` and `waiting()` of the tree, with `lists` holding oculus's own funding entry of `collections:` (from `loadConfig(engineDir()).config.collections`), since a scheme gets no line when no entry names the funding registry. C3 runs the whole `validate()` on an in-memory raw portfolio. C8 calls `statusTone` after `setVocab` installs oculus's own words.
3. C4 carries a control row at `submitted` and C2 one at `withdrawn`, so a 0 is shown to come from the status and not from an input the function ignores.
4. `docs/HELP.md` gains no bullet: it lists no status words (the item 3 grep finds none there), and the brief names no HELP line.

## Host- or user-visible changes, before and after

- Findings view, on the research hub: before, the two entries of `.oculus/data/academic/funding.yml` at `status: stopped` (`:56` and `:69`, keys `2026-fwo-senior-stopped-meyfroidt` and `2026-fwo-senior-stopped-stalmans`, read with `grep -n "status: stopped"` and `awk` over lines 50-80 there) each carry `status "stopped" is not a word of the statuses list; the closest word is dropped`; after, neither finding is listed. Neither entry has a `deadline`, a follow-up or a subtask (the same `awk` read), so nothing else on the research hub changes. The hub's `.oculus/config.yml` sets no `statuses` (`grep -n 'statuses'` printed nothing). Look on landing: open Findings over the research hub and filter on `funding.yml`.
- Colour: an entry at `stopped` is grey before and after (C8); the Funding view's card of either research-hub entry is drawn in the same grey.
- Focus board: a funding scheme at `stopped` whose deadline lies inside 90 days was a command center Deadlines line and is not after; its due follow-ups and open subtasks were Tasks lines and are not after (C2, C7). No research-hub entry shows this; the look needs a hub entry at `stopped` with a deadline, a follow-up or a subtask.
- Files view make item: a new hub's `funding.yml` written from the Funding template names `stopped` in its `status` options and in the entry comment (C5), and its Funding view's status select offers `stopped` after `withdrawn`.

## Anything in the brief that was wrong or impossible

- The brief's pointer for `closesDeadline` (`src/lib/data/shapes/vocab-keys.ts:188`) names the return line of `wordFlag`, which `closesDeadline` (`src/lib/state/boards/focus.ts:196-198`) reaches through `statusFlag` (`:190-192`). The behaviour the brief states holds (C2's first run).
- Nothing else was wrong: every case reproduced its base result, and tsx's failure on the `$state` rune (`npx tsx -e "import('./src/lib/state/boards/ticker.ts')..."` printed `ERR $state is not defined`) was met inside the case-run program by the hook files above.

## Limitations

- The case-run program reaches the ticker, the awaiting box, the vocabulary check and the tone through their functions; what the Focus board, the Findings view and the Funding view draw is the look on landing, as the section above names.
- C2 and C7 use a funding scheme only; an entry of another collection at `stopped` goes through the same `closesDeadline` call of `ticker.ts:328`, `:463` and `:524`, read and not run.
