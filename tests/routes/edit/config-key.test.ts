// Layer 2, route tests. What the /api/write route does with a config-key write: the undo through
// the same writer.
//
// The engine is a scratch copy of the checkout's config/ folder (write-fixture.ts), and the target
// names it, so no case here writes the checkout's config or reads the machine's own file. What this
// does NOT cover: the Settings control that sends the write.
// @module-tag slow: every case takes 140 ms or more to write a setting through the route.

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect } from 'vitest';
import { handleWrite } from '../../../src/lib/server/edit/writes.ts';
import type { PrimaryTarget, WriteTarget } from '../../../src/lib/server/edit/writes.ts';
import { loadConfig, textCatalog } from '../../../src/lib/data/sources/config.ts';
import { words } from '../../../src/lib/server/core/words.ts';
import { it } from '../../fixtures/scratch.ts';
import { TOKEN, changesOf, configTarget, engineFile, request, undone } from './write-fixture.ts';

const KEEP_BLOCK = 'changes:\n  keep: 500\n';
const KEEP_HELD = 'changes:\n  # how long the log is\n  keep: 200  # how many\n';

/** A target over a scratch engine whose `changes.keep` holds 200 under a comment of its own. */
function keepTarget(): PrimaryTarget {
    const into = configTarget();
    const file = engineFile(into.engine, 'behavior.yml');
    const original = readFileSync(file, 'utf8');
    expect(original).toContain(KEEP_BLOCK);
    writeFileSync(file, original.replace(KEEP_BLOCK, KEEP_HELD));
    return into;
}

/** The behavior file of a target, as it is now. */
function behaviorOf(into: PrimaryTarget): string {
    return readFileSync(into.behaviorFile, 'utf8');
}

/** One config-key write as the page sends it. */
function send(into: PrimaryTarget, file: string, key: string, value: unknown): Promise<Response> {
    return handleWrite(request({ kind: 'config-key', file, key, value }), TOKEN, into);
}

/**
 * The settings taken back, one row per place the setting was written: the key and the value sent,
 * the file the write lands in, what that file holds once the undo has run (null when the write made
 * it and the undo removes it, with the folders it made) and the record the undo logs.
 */
const ROWS: {
    row: string;
    key: string;
    value: unknown;
    file: (into: PrimaryTarget) => string;
    logged: (into: PrimaryTarget) => string;
    after: (before: string) => string | null;
    back: Record<string, unknown>;
}[] = [
    {
        row: 'a key outside the hub list',
        key: 'changes.keep',
        value: 300,
        file: (into) => into.behaviorFile,
        logged: (into) => into.behaviorFile,
        after: (before) => before,
        back: { kind: 'config-key', field: 'changes.keep', before: 300, after: 200 }
    },
    {
        row: 'a key of the hub list, whose layer file the write made',
        key: 'slurm.resource',
        value: 'other',
        file: (into) => join(into.hub, '.oculus', 'config', 'behavior.yml'),
        logged: (into) => join(into.hub, '.oculus', 'config', 'behavior.yml'),
        after: () => null,
        back: { kind: 'config-key', field: 'slurm.resource', before: 'other' }
    }
];

describe('taking a setting back', () => {
    it.each(ROWS)(
        'puts the file back byte for byte and logs the undo above the write: $row',
        async ({ key, value, file, logged, after, back: record }) => {
            const into = keepTarget();
            const engineBefore = behaviorOf(into);
            await send(into, 'behavior.yml', key, value);
            const [change] = changesOf(into);
            expect(change.file).toBe(logged(into));
            const expected = after(engineBefore);
            const response = await undone(into, change);
            expect(response.status).toBe(200);
            if (expected === null) expect(existsSync(join(into.hub, '.oculus'))).toBe(false);
            else expect(readFileSync(file(into), 'utf8')).toBe(expected);
            expect(behaviorOf(into)).toBe(engineBefore);
            const [back, first] = changesOf(into);
            expect(first.at).toBe(change.at);
            expect(back).toMatchObject({ ...record, undoes: change.at });
        }
    );
});

describe('the rows of the wallpaper section of Settings', () => {
    it.each([
        ['wallpaper.dim', 0.5],
        ['wallpaper.themes', 'all']
    ])("writes %s into oculus's own config/appearance.yml and no hub file", async (key, value) => {
        const into = configTarget();
        const own = engineFile(into.engine, 'appearance.yml');
        const before = readFileSync(own, 'utf8');
        const response = await send(into, 'appearance.yml', key, value);
        expect(response.status).toBe(200);
        expect(readFileSync(own, 'utf8')).not.toBe(before);
        expect(readFileSync(own, 'utf8')).toContain(`${key.split('.')[1]}: ${value}`);
        expect(existsSync(join(into.hub, '.oculus', 'config', 'appearance.yml'))).toBe(false);
    });

    it("writes wallpaper.image into the primary hub's .oculus/config/appearance.yml and not oculus's own", async () => {
        const into = configTarget();
        const own = engineFile(into.engine, 'appearance.yml');
        const before = readFileSync(own, 'utf8');
        const response = await send(into, 'appearance.yml', 'wallpaper.image', 'lab/x.jpg');
        expect(response.status).toBe(200);
        expect(readFileSync(own, 'utf8')).toBe(before);
        const layer = join(into.hub, '.oculus', 'config', 'appearance.yml');
        expect(readFileSync(layer, 'utf8')).toContain('image: lab/x.jpg');
    });
});

describe("a write to the machine's local.yml", () => {
    const reasons = async (into: WriteTarget): Promise<string[]> => {
        const response = await send(into as PrimaryTarget, 'local.yml', 'port', 8801);
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
