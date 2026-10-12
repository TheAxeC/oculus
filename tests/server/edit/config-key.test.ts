// Layer 4, server test. The config-key writer: one option of a tracked config file set in place,
// the refusals that leave the file as it was, and the bytes it keeps.
//
// Every case runs over a scratch engine, a copy of the checkout's config/ folder with the machine's
// own file left out (tests/routes/edit/write-fixture.ts), so the writer reads the catalog, the text
// and the other files from the copy and writes the copy. What this does NOT cover: the route that
// carries the writer (tests/routes/edit/config-key.test.ts) and the page's call of it.
//
// A case that merges the whole config folder and takes 100 ms or more in a run of its own is
// tagged slow.

import { existsSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect } from 'vitest';
import { engineDir, loadConfig, textCatalog } from '../../../src/lib/data/sources/config.ts';
import { words } from '../../../src/lib/server/core/words.ts';
import { writeConfigKey } from '../../../src/lib/server/edit/writes/config/config-key.ts';
import { it, scratchDir } from '../../fixtures/scratch.ts';
import { engineFile, refusalOf, scratchEngine } from '../../routes/edit/write-fixture.ts';
import { hubLinkedToEngine, linkedHub } from './writes-fixture.ts';

const CATALOG = textCatalog(loadConfig(engineDir()).config);

/** One of the writer's own reason sentences, out of config/text/server.yml. */
function why(key: string, ...args: string[]): string {
    return words(CATALOG, `server.config_key.${key}`, ...args);
}

const KEEP = 'behavior.yml:changes.keep';

/** The `changes:` block of config/behavior.yml as the checkout holds it. */
const KEEP_BLOCK = 'changes:\n  keep: 500\n';

/** The block a case starts from: a comment above `keep` and a comment after its value. */
const KEEP_HELD = 'changes:\n  # how long the log is\n  keep: 200  # how many\n';

/** A scratch engine whose file holds the text `change` made of the checkout's. */
function engineWith(file: string, change: (text: string) => string): string {
    const engine = scratchEngine();
    const path = engineFile(engine, file);
    const original = readFileSync(path, 'utf8');
    const changed = change(original);
    expect(changed).not.toBe(original);
    writeFileSync(path, changed);
    return engine;
}

/** The text with the `changes:` block of KEEP_HELD in it. */
function keepText(text: string): string {
    return text.replace(KEEP_BLOCK, KEEP_HELD);
}

/** A scratch engine whose `changes.keep` holds 200 with the comments of KEEP_HELD. */
function keepEngine(): string {
    return engineWith('behavior.yml', keepText);
}

/** One file of a scratch engine, as it is now. */
function held(engine: string, file = 'behavior.yml'): string {
    return readFileSync(engineFile(engine, file), 'utf8');
}

/** What one write left behind: its answer, the engine file, the hub layer's file, the records. */
type Left = {
    changed: string[];
    refused: unknown[];
    engine: string;
    layer: string | null;
    records: unknown[];
};

/**
 * The writes of one value, one row per place the value goes: the row names its scratch engine, the
 * key and value written, whether a hub is given, and what the write leaves in the engine file, in
 * the hub layer's file and in its record.
 */
const ROWS: {
    row: string;
    engine: () => string;
    key: string;
    value: unknown;
    hub: boolean;
    left: (before: string, engine: string, hub: string) => Left;
}[] = [
    {
        row: 'a key outside the hub list, with no hub',
        engine: keepEngine,
        key: 'changes.keep',
        value: 300,
        hub: false,
        left: (before, engine) => ({
            changed: [KEEP],
            refused: [],
            engine: before.replace('keep: 200  # how many', 'keep: 300  # how many'),
            layer: null,
            records: [
                {
                    file: engineFile(engine, 'behavior.yml'),
                    key: 'behavior.yml',
                    field: 'changes.keep',
                    before: 200,
                    after: 300,
                    undo: 'field'
                }
            ]
        })
    },
    {
        row: 'a key outside the hub list, whatever hub is given',
        engine: keepEngine,
        key: 'changes.keep',
        value: 300,
        hub: true,
        left: (before, engine) => ({
            changed: [KEEP],
            refused: [],
            engine: before.replace('keep: 200  # how many', 'keep: 300  # how many'),
            layer: null,
            records: [
                {
                    file: engineFile(engine, 'behavior.yml'),
                    key: 'behavior.yml',
                    field: 'changes.keep',
                    before: 200,
                    after: 300,
                    undo: 'field'
                }
            ]
        })
    },
    {
        row: 'a key of the hub list, with a hub that holds no layer file',
        engine: scratchEngine,
        key: 'slurm.resource',
        value: 'other',
        hub: true,
        left: (before, engine, hub) => ({
            changed: ['behavior.yml:slurm.resource'],
            refused: [],
            engine: before,
            layer: 'slurm: { resource: other }\n',
            records: [
                {
                    file: join(hub, '.oculus', 'config', 'behavior.yml'),
                    key: 'behavior.yml',
                    field: 'slurm.resource',
                    before: '',
                    after: 'other',
                    undo: 'field',
                    replaced: { offset: 0, before: '', after: 'slurm: { resource: other }\n' },
                    created: [
                        join(hub, '.oculus'),
                        join(hub, '.oculus', 'config'),
                        join(hub, '.oculus', 'config', 'behavior.yml')
                    ]
                }
            ]
        })
    }
];

describe('one value written over its own bytes', { tags: ['slow'] }, () => {
    it.each(ROWS)(
        'replaces the value and keeps every other byte, the comment on its line included: $row',
        ({ engine: make, key, value, hub: withHub, left }) => {
            const engine = make();
            const hub = scratchDir('oculus-hub-');
            const before = held(engine);
            const outcome = writeConfigKey(
                engine,
                'behavior.yml',
                key,
                value,
                undefined,
                withHub ? hub : undefined
            );
            const layer = join(hub, '.oculus', 'config', 'behavior.yml');
            expect({
                changed: outcome.changed,
                refused: outcome.refused,
                engine: held(engine),
                layer: existsSync(layer) ? readFileSync(layer, 'utf8') : null,
                records: outcome.records
            }).toEqual(left(before, engine, hub));
        }
    );
});

describe('an option the catalog does not hold', { tags: ['slow'] }, () => {
    it("refuses the machine's own file without reading it", () => {
        const engine = scratchEngine();
        const local = engineFile(engine, 'local.yml');
        writeFileSync(local, 'port: 8791\n');
        const stamp = statSync(local).mtimeMs;
        const outcome = writeConfigKey(engine, 'local.yml', 'port', 8792);
        expect(refusalOf(outcome, 'local.yml:port')).toBe(why('local'));
        expect(readFileSync(local, 'utf8')).toBe('port: 8791\n');
        expect(statSync(local).mtimeMs).toBe(stamp);
    });

    it("refuses a hub layer file that is a link to a hub's .oculus/local.yml, and writes nothing", () => {
        const engine = scratchEngine();
        const { hub, local } = linkedHub();
        const outcome = writeConfigKey(
            engine,
            'behavior.yml',
            'slurm.resource',
            'other',
            undefined,
            hub,
            [hub]
        );
        expect(refusalOf(outcome, 'behavior.yml:slurm.resource')).toBe(why('local'));
        expect(readFileSync(local, 'utf8')).toBe('port: 8791\n');
    });

    it("refuses a hub layer file that is a link to oculus's own config/local.yml, and writes nothing", () => {
        const engine = scratchEngine();
        const { hub, local } = hubLinkedToEngine(engine);
        const outcome = writeConfigKey(
            engine,
            'behavior.yml',
            'slurm.resource',
            'other',
            undefined,
            hub,
            [hub]
        );
        expect(refusalOf(outcome, 'behavior.yml:slurm.resource')).toBe(why('local'));
        expect(readFileSync(local, 'utf8')).toBe('port: 8791\n');
    });
});
