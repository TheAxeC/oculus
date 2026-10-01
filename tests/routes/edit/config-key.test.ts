// Layer 4, route test. What the /api/write route does with a config-key write: the setting written
// into a scratch engine's file, its record in the change log and the word the History view draws
// for it, the undo through the same writer, the refusal an undo gets from the readers, two writes
// in a row and at once, and the answers for a file that cannot be read or written.
//
// The engine is a scratch copy of the checkout's config/ folder (write-fixture.ts), and the target
// names it, so no case here writes the checkout's config or reads the machine's own file. What this
// does NOT cover: the Settings control that sends the write, which is a later view.

import { chmodSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect } from 'vitest';
import { engineDir, loadConfig, textCatalog } from '../../../src/lib/data/sources/config.ts';
import { Hub } from '../../../src/lib/server/core/channels.ts';
import { logChanges } from '../../../src/lib/server/core/changes.ts';
import type { ChangeRecord } from '../../../src/lib/server/core/changes.ts';
import { fsWrites } from '../../../src/lib/server/core/json.ts';
import { handleWrite, target as targetOf } from '../../../src/lib/server/edit/writes.ts';
import type { WriteTarget } from '../../../src/lib/server/edit/writes.ts';
import { it } from '../../fixtures/scratch.ts';
import { recordedKinds } from '../../fixtures/kinds.ts';
import {
    TOKEN,
    changesOf,
    configTarget,
    engineFile,
    request,
    scratchEngine,
    undone
} from './write-fixture.ts';

const KEEP_BLOCK = 'changes:\n  keep: 500\n';
const KEEP_HELD = 'changes:\n  # how long the log is\n  keep: 200  # how many\n';

/** A target over a scratch engine whose `changes.keep` holds 200 under a comment of its own. */
function keepTarget(): WriteTarget {
    const into = configTarget();
    const file = engineFile(into.engine, 'behavior.yml');
    const original = readFileSync(file, 'utf8');
    expect(original).toContain(KEEP_BLOCK);
    writeFileSync(file, original.replace(KEEP_BLOCK, KEEP_HELD));
    return into;
}

/** The behavior file of a target, as it is now. */
function behaviorOf(into: WriteTarget): string {
    return readFileSync(into.behaviorFile, 'utf8');
}

/** One config-key write as the page sends it. */
function send(into: WriteTarget, file: string, key: string, value: unknown): Promise<Response> {
    return handleWrite(request({ kind: 'config-key', file, key, value }), TOKEN, into);
}

describe('a setting written through the route', () => {
    it('answers what changed, writes the file and records the change as a setting', async () => {
        const into = keepTarget();
        const before = behaviorOf(into);
        const response = await send(into, 'behavior.yml', 'changes.keep', 300);
        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({
            ok: true,
            changed: ['behavior.yml:changes.keep'],
            refused: []
        });
        expect(behaviorOf(into)).toBe(
            before.replace('keep: 200  # how many', 'keep: 300  # how many')
        );
        const [change] = changesOf(into);
        expect(change).toMatchObject({
            kind: 'config-key',
            file: into.behaviorFile,
            key: 'behavior.yml',
            field: 'changes.keep',
            before: 200,
            after: 300,
            undo: 'field'
        });
    });

    it('has a word of its own in the History view, a setting', () => {
        expect(recordedKinds()).toContain('config-key');
        expect(textCatalog(loadConfig(engineDir()).config)['history.kind_config_key']).toBe(
            'setting'
        );
    });

    it('answers the reason of a refusal with a 200, and writes and records nothing', async () => {
        const into = keepTarget();
        const before = behaviorOf(into);
        const response = await send(into, 'behavior.yml', 'changes.keep', 0);
        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({
            ok: true,
            changed: [],
            refused: [
                {
                    field: 'behavior.yml:changes.keep',
                    reason: 'config/behavior.yml: changes.keep must be a whole number above zero'
                }
            ]
        });
        expect(behaviorOf(into)).toBe(before);
        expect(changesOf(into)).toEqual([]);
    });

    it('writes nothing and records nothing for the value the file already holds', async () => {
        const into = keepTarget();
        const response = await send(into, 'behavior.yml', 'changes.keep', 200);
        expect(await response.json()).toEqual({ ok: true, changed: [], refused: [] });
        expect(changesOf(into)).toEqual([]);
    });
});

describe('taking a setting back', () => {
    it('puts the file back byte for byte and logs the undo above the write', async () => {
        const into = keepTarget();
        const before = behaviorOf(into);
        await send(into, 'behavior.yml', 'changes.keep', 300);
        const [change] = changesOf(into);
        const response = await undone(into, change);
        expect(response.status).toBe(200);
        expect(behaviorOf(into)).toBe(before);
        const [back, first] = changesOf(into);
        expect(first.at).toBe(change.at);
        expect(back).toMatchObject({
            kind: 'config-key',
            field: 'changes.keep',
            before: 300,
            after: 200,
            undoes: change.at
        });
    });

    it('answers moved when the file has been edited since, and leaves it alone', async () => {
        const into = keepTarget();
        await send(into, 'behavior.yml', 'changes.keep', 300);
        const [change] = changesOf(into);
        await send(into, 'behavior.yml', 'changes.keep', 400);
        const held = behaviorOf(into);
        const response = await undone(into, change);
        expect(response.status).toBe(409);
        expect(await response.json()).toEqual({ error: 'moved' });
        expect(behaviorOf(into)).toBe(held);
    });

    it('is refused by the same readers, with their sentence, when it would put a refused value back', async () => {
        const into = configTarget();
        const file = into.behaviorFile;
        writeFileSync(
            file,
            readFileSync(file, 'utf8').replace('  max_hits: 500\n', '  max_hits: 0\n')
        );
        const written = await send(into, 'behavior.yml', 'search.max_hits', 500);
        expect((await written.json()) as { changed: string[] }).toMatchObject({
            changed: ['behavior.yml:search.max_hits']
        });
        const held = behaviorOf(into);
        const [change] = changesOf(into);
        const response = await undone(into, change);
        expect(response.status).toBe(400);
        expect(await response.json()).toEqual({
            error: 'refused',
            refused: [
                {
                    field: 'behavior.yml:search.max_hits',
                    reason: 'config/behavior.yml: search.max_hits must be a number above zero'
                }
            ]
        });
        expect(behaviorOf(into)).toBe(held);
        expect(changesOf(into)).toHaveLength(1);
    });

    it('answers gone once the key has left the file or the file no longer parses', async () => {
        for (const spoil of [
            (text: string) => text.replace(/\n {2}keep: 300 {2}# how many\n/, '\n'),
            (text: string) => `${text}\nbroken: [unclosed\n`
        ]) {
            const into = keepTarget();
            await send(into, 'behavior.yml', 'changes.keep', 300);
            const [change] = changesOf(into);
            const spoiled = spoil(behaviorOf(into));
            expect(spoiled).not.toBe(behaviorOf(into));
            writeFileSync(into.behaviorFile, spoiled);
            const response = await undone(into, change);
            expect(response.status).toBe(404);
            expect(await response.json()).toEqual({ error: 'gone' });
            expect(behaviorOf(into)).toBe(spoiled);
        }
    });

    it('answers gone for a record naming a file the catalog does not track', async () => {
        const into = keepTarget();
        const outside = join(into.engine, 'behavior.yml');
        writeFileSync(outside, 'changes:\n  keep: 500\n');
        const record: ChangeRecord = {
            file: outside,
            key: '../behavior.yml',
            field: 'changes.keep',
            before: 200,
            after: 500,
            undo: 'field'
        };
        await logChanges(into.changes, 'config-key', [record]);
        const response = await undone(into, changesOf(into)[0]);
        expect(response.status).toBe(404);
        expect(await response.json()).toEqual({ error: 'gone' });
        expect(readFileSync(outside, 'utf8')).toBe('changes:\n  keep: 500\n');
    });
});

describe('several settings written', () => {
    it('lands two writes of different keys in a row, each record naming its key', async () => {
        const into = keepTarget();
        await send(into, 'behavior.yml', 'changes.keep', 300);
        await send(into, 'behavior.yml', 'search.max_hits', 600);
        expect(behaviorOf(into)).toContain('keep: 300  # how many');
        expect(behaviorOf(into)).toContain('  max_hits: 600\n');
        expect(changesOf(into).map((one) => one.field)).toEqual([
            'search.max_hits',
            'changes.keep'
        ]);
    });

    it('lands two writes made at once, none lost to the other', async () => {
        const into = keepTarget();
        const answers = await Promise.all([
            send(into, 'behavior.yml', 'changes.keep', 300),
            send(into, 'behavior.yml', 'search.max_hits', 600)
        ]);
        expect(answers.map((one) => one.status)).toEqual([200, 200]);
        expect(behaviorOf(into)).toContain('keep: 300  # how many');
        expect(behaviorOf(into)).toContain('  max_hits: 600\n');
        expect(
            changesOf(into)
                .map((one) => one.field)
                .sort()
        ).toEqual(['changes.keep', 'search.max_hits']);
    });
});

describe('a file the route cannot read or write', () => {
    it('answers unwritable for a file that is not there, and records nothing', async () => {
        const into = keepTarget();
        rmSync(into.behaviorFile);
        const response = await send(into, 'behavior.yml', 'changes.keep', 300);
        expect(response.status).toBe(500);
        expect(await response.json()).toEqual({ error: 'unwritable' });
        expect(changesOf(into)).toEqual([]);
    });

    it('answers unwritable for a read-only file, and leaves it and its mode as they were', async () => {
        const into = keepTarget();
        chmodSync(into.behaviorFile, 0o444);
        const before = behaviorOf(into);
        const response = await send(into, 'behavior.yml', 'changes.keep', 300);
        expect(response.status).toBe(500);
        expect(await response.json()).toEqual({ error: 'unwritable' });
        expect(behaviorOf(into)).toBe(before);
        expect(statSync(into.behaviorFile).mode & 0o777).toBe(0o444);
        expect(changesOf(into)).toEqual([]);
    });
});

describe('the change log without its bound', () => {
    it('stops the target before any writer runs, so the file stays as it is', () => {
        const engine = scratchEngine();
        const file = engineFile(engine, 'behavior.yml');
        writeFileSync(
            file,
            readFileSync(file, 'utf8').replace(KEEP_BLOCK, 'changes:\n  keep: 0\n')
        );
        const before = readFileSync(file, 'utf8');
        const server = { hub: new Hub(), fsWrites: fsWrites() };
        expect(() => targetOf(engine, loadConfig(engine).config, server)).toThrow(
            'config/behavior.yml: changes.keep must be a whole number above zero'
        );
        expect(readFileSync(file, 'utf8')).toBe(before);
    });
});
