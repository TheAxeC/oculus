// Layer 2, route tests. What the /api/write route does with a config-key write and a config-reset
// write: where each lands, and the undo through the same writers.
//
// The engine is a scratch copy of the checkout's config/ folder and the workspace file is under the
// fixture's hub (write-fixture.ts `configTarget`), so no case here writes the checkout's config or
// reads the machine's own file. What this does NOT cover: the Settings control that sends the
// write.
// @module-tag slow: every case takes 600 ms or more in a run of its own. The time is the write's
// own checks: a config-key write and its undo each read the whole configuration of the scratch
// engine before and after they write (`loadConfig`, about 220 ms a read), and no case waits.

import { existsSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect } from 'vitest';
import { HUB_FILE } from '../../../src/lib/data/helpers/hub-names.ts';
import { plantHub } from '../../fixtures/hubs/workspace.ts';
import { handleWrite } from '../../../src/lib/server/edit/writes.ts';
import type { PrimaryTarget, WriteTarget } from '../../../src/lib/server/edit/writes.ts';
import { loadLayers, layersOf } from '../../../src/lib/server/edit/writes/config/config-place.ts';
import { loadConfig, textCatalog } from '../../../src/lib/data/sources/config.ts';
import { words } from '../../../src/lib/server/core/words.ts';
import { it } from '../../fixtures/scratch.ts';
import {
    TOKEN,
    changesOf,
    configTarget,
    defaultsFile,
    request,
    undone,
    workspaceFileOf
} from './write-fixture.ts';

/** The workspace file's `settings:` block a case starts from, `changes.keep` under comments. */
const KEEP_HELD = 'settings:\n  changes:\n    # how long the log is\n    keep: 200  # how many\n';

/** One config-key write as the page sends it. */
function send(into: WriteTarget, file: string, key: string, value: unknown): Promise<Response> {
    return handleWrite(request({ kind: 'config-key', file, key, value }), TOKEN, into);
}

/** One reset as the page sends it. */
function reset(into: WriteTarget, file: string, key: string): Promise<Response> {
    return handleWrite(request({ kind: 'config-reset', file, key }), TOKEN, into);
}

/** The value in force at a dotted key over a target's layers. */
function inForce(into: PrimaryTarget, key: string): unknown {
    let node: unknown = loadLayers(into.engine, layersOf(into)).config;
    for (const segment of key.split('.')) node = (node as Record<string, unknown>)[segment];
    return node;
}

/**
 * The settings taken back, one row per place the setting was written: the key and the value sent,
 * the text planted as the hub's settings file when it has any, the file the write lands in, what
 * that file holds once the undo has run (null when the write made it and the undo removes it, with
 * the folders it made) and the record the undo logs.
 */
const ROWS: {
    row: string;
    key: string;
    value: unknown;
    settings?: string;
    file: (into: PrimaryTarget) => string;
    after: (before: string) => string | null;
    back: Record<string, unknown>;
}[] = [
    {
        row: 'an option the workspace file holds',
        key: 'changes.keep',
        value: 300,
        file: workspaceFileOf,
        after: (before) => before,
        back: { kind: 'config-key', field: 'changes.keep', before: 300, after: 200 }
    },
    {
        row: 'a key of the hub list, whose settings file the write made',
        key: 'clusters.key_type',
        value: 'rsa',
        file: (into) => join(into.hub, HUB_FILE),
        after: () => null,
        back: { kind: 'config-key', field: 'clusters.key_type', before: 'rsa' }
    },
    {
        row: 'a key of the hub list, whose settings file holds other keys and comments',
        key: 'clusters.key_type',
        value: 'rsa',
        settings:
            '# the keys of this hub\nscan:\n  - { dir: work }\nclusters:\n  key_type: ed25519  # the key type\n',
        file: (into) => join(into.hub, HUB_FILE),
        after: () =>
            '# the keys of this hub\nscan:\n  - { dir: work }\nclusters:\n  key_type: ed25519  # the key type\n',
        back: { kind: 'config-key', field: 'clusters.key_type', before: 'rsa' }
    },
    {
        row: 'a key of the hub list, whose settings file is the empty map',
        key: 'clusters.key_type',
        value: 'rsa',
        settings: '{}\n',
        file: (into) => join(into.hub, HUB_FILE),
        after: () => '{}\n',
        back: { kind: 'config-key', field: 'clusters.key_type', before: 'rsa' }
    }
];

describe('taking a setting back', { tags: ['slow'] }, () => {
    it.each(ROWS)(
        'puts the file back byte for byte and logs the undo above the write: $row',
        async ({ key, value, settings, file, after, back: record }) => {
            const into = configTarget(undefined, KEEP_HELD);
            if (settings !== undefined) plantHub(into.hub, settings);
            else rmSync(join(into.hub, HUB_FILE));
            const defaults = readFileSync(defaultsFile(into.engine, 'behavior.yml'), 'utf8');
            const workspace = readFileSync(workspaceFileOf(into), 'utf8');
            const expected = after(existsSync(file(into)) ? readFileSync(file(into), 'utf8') : '');
            await send(into, 'behavior.yml', key, value);
            const [change] = changesOf(into);
            expect(change.file).toBe(file(into));
            const response = await undone(into, change);
            expect(response.status).toBe(200);
            if (expected === null) expect(existsSync(file(into))).toBe(false);
            else expect(readFileSync(file(into), 'utf8')).toBe(expected);
            expect(readFileSync(workspaceFileOf(into), 'utf8')).toBe(workspace);
            expect(readFileSync(defaultsFile(into.engine, 'behavior.yml'), 'utf8')).toBe(defaults);
            const [back, first] = changesOf(into);
            expect(first.at).toBe(change.at);
            expect(back).toMatchObject({ ...record, undoes: change.at });
        }
    );
});

describe('the rows of the wallpaper section of Settings', { tags: ['slow'] }, () => {
    it.each([
        ['wallpaper.dim', 0.5],
        ['wallpaper.themes', 'rice']
    ])(
        "writes %s into the workspace file and neither oculus's file nor the hub file",
        async (key, value) => {
            const into = configTarget();
            rmSync(join(into.hub, HUB_FILE));
            const own = defaultsFile(into.engine, 'appearance.yml');
            const before = readFileSync(own, 'utf8');
            const response = await send(into, 'appearance.yml', key, value);
            expect(response.status).toBe(200);
            expect(readFileSync(own, 'utf8')).toBe(before);
            expect(readFileSync(workspaceFileOf(into), 'utf8')).toContain(
                `settings:\n  wallpaper: { ${key.split('.')[1]}: ${value} }\n`
            );
            expect(existsSync(join(into.hub, HUB_FILE))).toBe(false);
        }
    );

    it("writes wallpaper.image into the primary hub's .oculus/config.yml and not oculus's own", async () => {
        const into = configTarget();
        const own = defaultsFile(into.engine, 'appearance.yml');
        const before = readFileSync(own, 'utf8');
        const workspace = readFileSync(workspaceFileOf(into), 'utf8');
        const response = await send(into, 'appearance.yml', 'wallpaper.image', 'lab/x.jpg');
        expect(response.status).toBe(200);
        expect(readFileSync(own, 'utf8')).toBe(before);
        expect(readFileSync(workspaceFileOf(into), 'utf8')).toBe(workspace);
        expect(readFileSync(join(into.hub, HUB_FILE), 'utf8')).toContain('image: lab/x.jpg');
    });
});

describe('Reset of an option', { tags: ['slow'] }, () => {
    it("takes code_theme out of the workspace file, so the value in force is oculus's again", async () => {
        const into = configTarget(undefined, 'settings:\n  # mine\n  code_theme: nord\n');
        const file = workspaceFileOf(into);
        const before = readFileSync(file, 'utf8');
        expect(inForce(into, 'code_theme')).toBe('nord');
        const response = await reset(into, 'appearance.yml', 'code_theme');
        expect(response.status).toBe(200);
        expect(inForce(into, 'code_theme')).toBe('tokens');
        expect(readFileSync(file, 'utf8')).not.toContain('code_theme');
        const [change] = changesOf(into);
        expect(change).toMatchObject({ kind: 'config-reset', file, field: 'code_theme' });
        expect((await undone(into, change)).status).toBe(200);
        expect(readFileSync(file, 'utf8')).toBe(before);
    });

    it('takes a key of the hub list out of the hub settings file and leaves the empty map', async () => {
        const into = configTarget();
        plantHub(into.hub, 'wallpaper:\n  image: lab/x.jpg\n');
        const response = await reset(into, 'appearance.yml', 'wallpaper.image');
        expect(response.status).toBe(200);
        expect(readFileSync(join(into.hub, HUB_FILE), 'utf8')).toBe('{}\n');
        expect(inForce(into, 'wallpaper.image')).toBe('');
    });

    it('writes nothing for an option the workspace file does not set', async () => {
        const into = configTarget();
        const before = readFileSync(workspaceFileOf(into), 'utf8');
        const response = await reset(into, 'appearance.yml', 'code_theme');
        expect(response.status).toBe(200);
        expect(changesOf(into)).toEqual([]);
        expect(readFileSync(workspaceFileOf(into), 'utf8')).toBe(before);
    });
});

describe("a write to the machine's local.yml", { tags: ['slow'] }, () => {
    const reasons = async (into: WriteTarget): Promise<string[]> => {
        const response = await send(into, 'local.yml', 'port', 8801);
        const body = (await response.json()) as { refused?: { reason: string }[] };
        return (body.refused ?? []).map((one) => one.reason);
    };

    it('is refused with the catalog sentence whether the workspace has a primary or not', async () => {
        const into = configTarget();
        const none: WriteTarget = { ...into, hub: null, primary: null };
        const text = textCatalog(loadConfig(into.engine).config);
        const sentence = words(text, 'server.config_key.local');
        expect(await reasons(into)).toEqual([sentence]);
        expect(await reasons(none)).toEqual([sentence]);
        expect(existsSync(join(into.hub, '.oculus', 'local.yml'))).toBe(false);
    });
});

/**
 * People of three hubs as the published portfolio holds them: ada of the primary, kim of two
 * others.
 */
const PEOPLE: Record<string, unknown> = {
    'hub:ada': { id: 'hub:ada', root: 'hub', name: 'Ada' },
    'lab:kim': { id: 'lab:kim', root: 'lab', name: 'Kim' },
    'lab2:kim': { id: 'lab2:kim', root: 'lab2', name: 'Kim' },
    'lab:lee': { id: 'lab:lee', root: 'lab', name: 'Lee' }
};

describe("the user's key written through the route", { tags: ['slow'] }, () => {
    /** A target whose published people are PEOPLE. */
    const peopled = (): PrimaryTarget => ({
        ...configTarget(),
        entities: (kind) => (kind === 'people' ? PEOPLE : null)
    });

    it.each([
        { row: 'zed, a key no hub holds', value: 'zed' },
        { row: 'kim, a key two hubs other than the primary hold', value: 'kim' }
    ])('refuses $row by the value check, and writes nothing (case 17)', async ({ value }) => {
        const into = peopled();
        const response = await send(into, 'local.yml', 'self', value);
        const body = (await response.json()) as { refused?: { reason: string }[] };
        const text = textCatalog(loadConfig(into.engine).config);
        const sentence = words(text, 'server.config_key.not_in_source', 'people');
        expect((body.refused ?? []).map((one) => one.reason)).toEqual([sentence]);
        expect(existsSync(join(into.hub, '.oculus', 'local.yml'))).toBe(false);
        expect(changesOf(into)).toEqual([]);
    });

    it('writes lee, a key one hub other than the primary holds, and logs the key and its two values (case 17)', async () => {
        const into = peopled();
        const response = await send(into, 'local.yml', 'self', 'lee');
        expect(response.status).toBe(200);
        const file = join(into.hub, '.oculus', 'local.yml');
        expect(readFileSync(file, 'utf8')).toBe('self: lee\n');
        const [change] = changesOf(into);
        expect([change.kind, change.file, change.key, change.field]).toEqual([
            'config-key',
            file,
            'local.yml',
            'self'
        ]);
        expect([change.before, change.after]).toEqual(['', 'lee']);
    });
});
