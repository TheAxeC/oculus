// Layer 4, server test. The config-value writer: one list option of a tracked config file set in
// place, the refusals that leave the file as it was, and the bytes it keeps.
//
// Every case runs over a scratch engine, a copy of the checkout's config/ folder with the machine's
// own file left out (tests/routes/edit/write-fixture.ts), so the writer reads the catalog, the text
// and the other files from the copy and writes the copy. What this does NOT cover: the route that
// carries the writer, History and Undo (tests/routes/edit/config-value.test.ts) and the editors
// that send the write.
//
// A case that merges the whole config folder takes 100 ms or more in a run of its own and is
// tagged slow; the refusal of the machine's own file reads no file and is not.

import { readFileSync } from 'node:fs';
import { describe, expect, vi } from 'vitest';
import { parse } from 'yaml';
import { engineDir, loadConfig, textCatalog } from '../../../src/lib/data/sources/config.ts';
import { words } from '../../../src/lib/server/core/words.ts';
import { writeConfigValue } from '../../../src/lib/server/edit/writes/config/config-value.ts';
import { it } from '../../fixtures/scratch.ts';
import { engineFile, refusalOf, scratchEngine } from '../../routes/edit/write-fixture.ts';
import { hubLinkedToEngine, linkedHub } from './writes-fixture.ts';

/** Every path the writer's module graph read through `readFileSync`, newest last. */
const reads = vi.hoisted(() => ({ paths: [] as string[] }));

// The node:fs module as it is, with the paths read through readFileSync recorded, so a case can
// say which files a refusal did and did not open.
vi.mock('node:fs', async (original) => {
    const actual = await original<typeof import('node:fs')>();
    return {
        ...actual,
        readFileSync: ((path: unknown, ...rest: unknown[]) => {
            reads.paths.push(String(path));
            return (actual.readFileSync as (...args: unknown[]) => unknown)(path, ...rest);
        }) as typeof actual.readFileSync
    };
});

const CATALOG = textCatalog(loadConfig(engineDir()).config);

/** One of the writer's own reason sentences, out of config/text/server.yml. */
function why(key: string, ...args: string[]): string {
    return words(CATALOG, `server.config_value.${key}`, ...args);
}

/** One file of a scratch engine, as it is now. */
function held(engine: string, file: string): string {
    return readFileSync(engineFile(engine, file), 'utf8');
}

/** The value a scratch engine's file holds at a dotted key path. */
function valueOf(engine: string, file: string, key: string): unknown {
    let node: unknown = parse(held(engine, file));
    for (const segment of key.split('.')) node = (node as Record<string, unknown>)[segment];
    return node;
}

/** A write with the value the file holds now as its base. */
function write(engine: string, file: string, key: string, value: unknown) {
    return writeConfigValue(engine, file, key, value, valueOf(engine, file, key));
}

const WAITING = 'behavior.yml:waiting_status';

describe('a list written in place', () => {
    it(
        'adds one item, removes one and swaps two, and keeps every other line',
        { tags: ['slow'] },
        () => {
            const engine = scratchEngine();
            const before = held(engine, 'behavior.yml');
            const next = ['pending', 'submitted', 'under-review', 'queued'];
            const outcome = write(engine, 'behavior.yml', 'waiting_status', next);
            expect(outcome.refused).toEqual([]);
            expect(outcome.changed).toEqual([WAITING]);
            expect(held(engine, 'behavior.yml')).toBe(
                before.replace(
                    '[submitted, pending, under review, under-review]',
                    '[pending, submitted, under-review, queued]'
                )
            );
            expect(valueOf(engine, 'behavior.yml', 'waiting_status')).toEqual(next);
            expect(outcome.records).toHaveLength(1);
            expect(outcome.records?.[0]).toMatchObject({
                key: 'behavior.yml',
                field: 'waiting_status',
                before: ['submitted', 'pending', 'under review', 'under-review'],
                after: next,
                undo: 'field'
            });
        }
    );
});

describe("the machine's own file", () => {
    it('refuses local.yml before any file is read', () => {
        const engine = scratchEngine();
        reads.paths.length = 0;
        const outcome = writeConfigValue(engine, 'local.yml', 'hub', ['x'], []);
        expect(refusalOf(outcome, 'local.yml:hub')).toBe(why('local'));
        expect(reads.paths.filter((path) => path.endsWith('local.yml'))).toEqual([]);
    });

    it("refuses a hub settings file that is a link to a hub's .oculus/local.yml, and writes nothing", () => {
        const engine = scratchEngine();
        const { hub, local } = linkedHub();
        const outcome = writeConfigValue(
            engine,
            'behavior.yml',
            'data_domains',
            ['x'],
            [],
            undefined,
            hub,
            [hub]
        );
        expect(refusalOf(outcome, 'behavior.yml:data_domains')).toBe(why('local'));
        expect(readFileSync(local, 'utf8')).toBe('port: 8791\n');
    });

    it("refuses a hub settings file that is a link to oculus's own config/local.yml, and writes nothing", () => {
        const engine = scratchEngine();
        const { hub, local } = hubLinkedToEngine(engine);
        const outcome = writeConfigValue(
            engine,
            'behavior.yml',
            'data_domains',
            ['x'],
            [],
            undefined,
            hub,
            [hub]
        );
        expect(refusalOf(outcome, 'behavior.yml:data_domains')).toBe(why('local'));
        expect(readFileSync(local, 'utf8')).toBe('port: 8791\n');
    });
});

describe('a write refused with nothing written', { tags: ['slow'] }, () => {
    it('refuses a base the file no longer holds, with the sentence that it changed since it was read', () => {
        const engine = scratchEngine();
        const before = held(engine, 'behavior.yml');
        const stale = ['submitted', 'pending'];
        const outcome = writeConfigValue(engine, 'behavior.yml', 'waiting_status', ['x'], stale);
        expect(refusalOf(outcome, WAITING)).toBe(why('changed'));
        expect(held(engine, 'behavior.yml')).toBe(before);
    });
});
