// Layer 4, server test. The config-value writer: one list option or family set at its place, the
// workspace file's `settings:` holding what makes the merge give back the value the reader sees,
// the refusals that leave every file as it was, and the bytes a write keeps.
//
// Every case runs over a scratch engine, a copy of the checkout's config/ folder
// (tests/routes/edit/write-fixture.ts), and a scratch hub with a saved workspace file
// (tests/fixtures/hubs/workspace.ts `plantSaved`), so the writer reads the options and the text
// from the copy and writes the scratch files. What this does NOT cover: the route that carries the
// writer, History and Undo (tests/routes/edit/config-value.test.ts) and the editors that send the
// write.
// @module-tag slow: every case takes 250 ms or more in a run of its own. The time is the writer's
// own reading: every write, a refusal included, first reads the whole configuration of the scratch
// engine (`loadConfig`, about 220 ms a read) for the catalog and the words of its answer, and a
// write reads it again after, to check it; no case waits.

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, vi } from 'vitest';
import { parse } from 'yaml';
import { engineDir, loadConfig, textCatalog } from '../../../src/lib/data/sources/config.ts';
import { words } from '../../../src/lib/server/core/words.ts';
import { loadLayers } from '../../../src/lib/server/edit/writes/config/config-place.ts';
import { writeConfigValue } from '../../../src/lib/server/edit/writes/config/config-value.ts';
import { plantSaved } from '../../fixtures/hubs/workspace.ts';
import { it, scratchDir } from '../../fixtures/scratch.ts';
import { defaultsFile, refusalOf, scratchEngine } from '../../routes/edit/write-fixture.ts';
import { linkedHub } from './writes-fixture.ts';

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

/** A scratch engine, a hub and a saved workspace whose `settings:` block is `settings`. */
type World = { engine: string; hub: string; workspace: string };

function world(settings = ''): World {
    const engine = scratchEngine();
    const hub = scratchDir('oculus-hub-');
    return { engine, hub, workspace: plantSaved(hub, settings).file };
}

/** The value at a dotted key path of a parsed map, or undefined. */
function at(parsed: unknown, key: string): unknown {
    let node = parsed;
    for (const segment of key.split('.')) {
        node = (node as Record<string, unknown> | undefined)?.[segment];
    }
    return node;
}

/** The value in force at a key over a world's layers, as the server merges them. */
function inForce(one: World, key: string): unknown {
    return at(loadLayers(one.engine, { hub: one.hub, workspace: one.workspace }).config, key);
}

/** A write over a world's layers with the value in force as its base. */
function write(one: World, file: string, key: string, value: unknown, own = false) {
    return writeConfigValue(
        one.engine,
        file,
        key,
        value,
        inForce(one, key),
        { hub: one.hub, workspace: one.workspace },
        { own }
    );
}

const PATTERNS = 'behavior.yml:processes.patterns';

describe('a list written into the workspace file', { tags: ['slow'] }, () => {
    it('adds the list under settings, then rewrites it in place, and leaves the defaults file', () => {
        const one = world();
        const defaults = readFileSync(defaultsFile(one.engine, 'behavior.yml'), 'utf8');
        const opened = readFileSync(one.workspace, 'utf8');
        const next = ['codex', 'python3', 'claude', 'node', 'pytest'];
        const first = write(one, 'behavior.yml', 'processes.patterns', next);
        expect(first.refused).toEqual([]);
        expect(first.changed).toEqual([PATTERNS]);
        expect(readFileSync(one.workspace, 'utf8')).toBe(
            `${opened}settings:\n  processes:\n    patterns: [ codex, python3, claude, node, pytest ]\n`
        );
        expect(first.records?.[0]).toMatchObject({
            file: one.workspace,
            key: 'behavior.yml',
            field: 'processes.patterns',
            before: ['python3', 'codex', 'claude', 'node', 'latexmk'],
            after: next,
            undo: 'field'
        });
        const second = write(one, 'behavior.yml', 'processes.patterns', ['node']);
        expect(second.changed).toEqual([PATTERNS]);
        expect(readFileSync(one.workspace, 'utf8')).toBe(
            `${opened}settings:\n  processes:\n    patterns: [ node ]\n`
        );
        expect(inForce(one, 'processes.patterns')).toEqual(['node']);
        expect(readFileSync(defaultsFile(one.engine, 'behavior.yml'), 'utf8')).toBe(defaults);
    });
});

describe(
    'a keyed list or a family written as what the merge gives back',
    { tags: ['slow'] },
    () => {
        it('writes the rail without a button as every entry then the removed one, and the merge has no button', () => {
            const one = world();
            const rail = inForce(one, 'rail') as { page: string }[];
            const seen = rail.filter((row) => row.page !== 'focus');
            const outcome = write(one, 'layout.yml', 'rail', seen, true);
            expect(outcome.changed).toEqual(['layout.yml:rail']);
            const stored = at(parse(readFileSync(one.workspace, 'utf8')), 'settings.rail');
            expect(stored).toEqual([...seen, { page: 'focus', removed: true }]);
            expect(inForce(one, 'rail')).toEqual(seen);
        });

        it('keeps a rail drag in its new order after the merge', () => {
            const one = world();
            const rail = inForce(one, 'rail') as { page: string }[];
            const dragged = [rail[2], rail[0], rail[1], ...rail.slice(3)];
            expect(write(one, 'layout.yml', 'rail', dragged, true).changed).toEqual([
                'layout.yml:rail'
            ]);
            expect(inForce(one, 'rail')).toEqual(dragged);
        });

        it('keeps a shipped theme removed by the Settings editor out of the merged list', () => {
            const one = world();
            const themes = inForce(one, 'themes') as { name: string }[];
            const seen = themes.filter((row) => row.name !== 'dark');
            expect(write(one, 'appearance.yml', 'themes', seen).changed).toEqual([
                'appearance.yml:themes'
            ]);
            const stored = at(parse(readFileSync(one.workspace, 'utf8')), 'settings.themes');
            expect((stored as unknown[]).at(-1)).toEqual({ name: 'dark', removed: true });
            expect((inForce(one, 'themes') as { name: string }[]).map((row) => row.name)).toEqual(
                seen.map((row) => row.name)
            );
        });

        it('writes a family without a key as every key then the removed key set to null', () => {
            const one = world();
            const tiers = inForce(one, 'usage_tiers') as Record<string, unknown>;
            const names = Object.keys(tiers);
            const seen = Object.fromEntries(Object.entries(tiers).slice(1));
            expect(write(one, 'behavior.yml', 'usage_tiers', seen).changed).toEqual([
                'behavior.yml:usage_tiers'
            ]);
            const stored = at(parse(readFileSync(one.workspace, 'utf8')), 'settings.usage_tiers');
            expect(stored).toEqual({ ...seen, [names[0]]: null });
            expect(Object.keys(inForce(one, 'usage_tiers') as object)).toEqual(names.slice(1));
        });

        it('refuses a family without an entry another option needs, and writes nothing', () => {
            const one = world();
            const before = readFileSync(one.workspace, 'utf8');
            const boards = inForce(one, 'boards') as Record<string, unknown>;
            const seen = Object.fromEntries(
                Object.entries(boards).filter(([key]) => key !== 'projects')
            );
            const outcome = write(one, 'layout.yml', 'boards', seen);
            expect(outcome.changed).toEqual([]);
            expect(outcome.refused.map((row) => row.field)).toEqual(['layout.yml:boards']);
            expect(readFileSync(one.workspace, 'utf8')).toBe(before);
        });
    }
);

describe("a hub's word written into the hub's settings file", { tags: ['slow'] }, () => {
    const STAGES = 'catalogs/vocab.yml';

    /** The stages the reader sees: oculus's without `nascent`, `exploring` relabelled. */
    function edited(shipped: Record<string, Record<string, unknown>>) {
        return Object.fromEntries(
            Object.entries(shipped)
                .filter(([word]) => word !== 'nascent')
                .map(([word, row]) => [
                    word,
                    word === 'exploring' ? { ...row, label: 'Experimenting' } : row
                ])
        );
    }

    it("writes a removed and a relabelled stage as what changed from oculus's, and the merge gives it back", () => {
        const one = world();
        const shipped = inForce(one, 'stages') as Record<string, Record<string, unknown>>;
        const seen = edited(shipped);
        const outcome = write(one, STAGES, 'stages', seen);
        expect(outcome.refused).toEqual([]);
        expect(outcome.changed).toEqual(['catalogs/vocab.yml:stages']);
        const stored = at(
            parse(readFileSync(join(one.hub, '.oculus', 'config.yml'), 'utf8')),
            'stages'
        );
        expect(stored).toEqual({
            nascent: null,
            exploring: { ...shipped.exploring, label: 'Experimenting' }
        });
        expect(inForce(one, 'stages')).toEqual(seen);
        const idea = (inForce(one, 'categories') as { key: string }[]).find(
            (row) => row.key === 'idea'
        );
        expect(idea).toEqual({
            key: 'idea',
            label: 'idea',
            color: '#7c5cff',
            stages: { words: ['scoping'] }
        });
        expect(readFileSync(one.workspace, 'utf8')).not.toContain('stages');
    });

    it('deletes the row of a word the hub added once the reader removes it', () => {
        const one = world();
        const file = join(one.hub, '.oculus', 'config.yml');
        writeFileSync(file, 'stages:\n  trialling: { label: Trialling, live: true }\n');
        const merged = inForce(one, 'stages') as Record<string, unknown>;
        expect(Object.keys(merged)).toContain('trialling');
        const seen = Object.fromEntries(
            Object.entries(merged).filter(([word]) => word !== 'trialling')
        );
        expect(write(one, STAGES, 'stages', seen).changed).toEqual(['catalogs/vocab.yml:stages']);
        expect(at(parse(readFileSync(file, 'utf8')) ?? {}, 'stages.trialling')).toBeUndefined();
        expect(inForce(one, 'stages')).toEqual(seen);
    });

    it('refuses a hub word with no primary hub, with the no-primary sentence, and writes nothing', () => {
        const one = world();
        const file = join(one.hub, '.oculus', 'config.yml');
        const before = readFileSync(file, 'utf8');
        const shipped = inForce(one, 'stages') as Record<string, Record<string, unknown>>;
        const outcome = writeConfigValue(one.engine, STAGES, 'stages', edited(shipped), shipped, {
            workspace: one.workspace
        });
        expect(refusalOf(outcome, 'catalogs/vocab.yml:stages')).toBe(
            words(CATALOG, 'server.workspace.no_primary')
        );
        expect(readFileSync(file, 'utf8')).toBe(before);
    });
});

describe("the machine's own file", { tags: ['slow'] }, () => {
    it("refuses local.yml without reading the hub's .oculus/local.yml", () => {
        const one = world();
        const local = join(one.hub, '.oculus', 'local.yml');
        writeFileSync(local, 'port: 8791\n');
        reads.paths.length = 0;
        const outcome = writeConfigValue(one.engine, 'local.yml', 'hub', ['x'], [], {
            hub: one.hub,
            workspace: one.workspace
        });
        expect(refusalOf(outcome, 'local.yml:hub')).toBe(why('local'));
        expect(reads.paths.filter((path) => path === local)).toEqual([]);
        expect(readFileSync(local, 'utf8')).toBe('port: 8791\n');
    });

    it("refuses a hub settings file that is a link to a hub's .oculus/local.yml, and writes nothing", () => {
        const engine = scratchEngine();
        const { hub, local } = linkedHub();
        const outcome = writeConfigValue(
            engine,
            'sources.yml',
            'scan',
            [{ dir: 'x' }],
            [],
            { hub },
            { hubs: [hub] }
        );
        expect(refusalOf(outcome, 'sources.yml:scan')).toBe(why('local'));
        expect(readFileSync(local, 'utf8')).toBe('port: 8791\n');
    });
});

describe("an entry's ticker and skip written into the hub's list", { tags: ['slow'] }, () => {
    /** The hub's list in force with the `events` entry changed by `change`. */
    function withEvents(one: World, change: Record<string, unknown>): Record<string, unknown>[] {
        const list = inForce(one, 'collections') as Record<string, unknown>[];
        return list.map((entry) => (entry.key === 'events' ? { ...entry, ...change } : entry));
    }

    /** A write of the list over a world's layers, its fields checked against the server's lists. */
    function writeList(one: World, value: unknown) {
        return writeConfigValue(
            one.engine,
            'sources.yml',
            'collections',
            value,
            inForce(one, 'collections'),
            { hub: one.hub, workspace: one.workspace },
            { inputs: { hub: one.hub, primary: 'hub', projects: () => [] } }
        );
    }

    it('writes an edited ticker and a skip of a list of values, and the merge gives them back', () => {
        const one = world();
        const seen = withEvents(one, {
            ticker: { category: 'conference', undated: true },
            dissemination_skip: { role: 'attend', kind: ['poster', 'demo'] }
        });
        const outcome = writeList(one, seen);
        expect(outcome.refused).toEqual([]);
        expect(outcome.changed).toEqual(['sources.yml:collections']);
        expect(inForce(one, 'collections')).toEqual(seen);
    });

    it.each([
        [
            'a ticker that is no record',
            { ticker: 'event' },
            'Entry 10, field ticker: This field takes one map of the fields of the record'
        ],
        [
            'a ticker naming no category',
            { ticker: { category: 'nonesuch' } },
            'Entry 10, field ticker: Entry 1, field category: This option takes one of the items of the list ticker_categories'
        ],
        [
            'a skip that is no map',
            { dissemination_skip: ['attend'] },
            'Entry 10, field dissemination_skip: This field takes a map whose every value is one value, or a list of values where the field takes one'
        ]
    ])('refuses %s, and writes nothing', (_row, change, reason) => {
        const one = world();
        const before = readFileSync(one.workspace, 'utf8');
        const outcome = writeList(one, withEvents(one, change));
        expect(outcome.changed).toEqual([]);
        expect(outcome.refused.map((refused) => refused.reason)).toEqual([reason]);
        expect(readFileSync(one.workspace, 'utf8')).toBe(before);
    });
});

describe('a write refused with nothing written', { tags: ['slow'] }, () => {
    it('refuses a base the merge no longer gives, with the sentence that it changed since it was read', () => {
        const one = world();
        const before = readFileSync(one.workspace, 'utf8');
        const outcome = writeConfigValue(
            one.engine,
            'behavior.yml',
            'processes.patterns',
            ['x'],
            ['python3', 'codex'],
            { hub: one.hub, workspace: one.workspace }
        );
        expect(refusalOf(outcome, PATTERNS)).toBe(why('changed'));
        expect(readFileSync(one.workspace, 'utf8')).toBe(before);
    });

    it('refuses a list with the unsaved workspace, with the no-workspace-file sentence', () => {
        const one = world();
        const before = readFileSync(one.workspace, 'utf8');
        const outcome = writeConfigValue(
            one.engine,
            'behavior.yml',
            'processes.patterns',
            ['x'],
            inForce(one, 'processes.patterns'),
            { hub: one.hub }
        );
        expect(refusalOf(outcome, PATTERNS)).toBe(words(CATALOG, 'server.config_key.no_workspace'));
        expect(readFileSync(one.workspace, 'utf8')).toBe(before);
    });
});
