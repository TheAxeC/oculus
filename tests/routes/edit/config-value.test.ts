// Layer 4, route test. What the /api/write route does with a config-value write: a list or a family
// written into a scratch engine's file, its record in the change log and the word the History view
// draws for it, the undo through the same writer, the refusal an undo gets once the key was edited
// again or the file no longer parses, two writes at once, and the answers for a file that cannot be
// read or written.
//
// The engine is a scratch copy of the checkout's config/ folder (write-fixture.ts), and the target
// names it, so no case here writes the checkout's config or reads the machine's own file. What this
// does NOT cover: the editors that send the write, which are state/system/config/editors's and the
// look's, and the render of the bytes (tests/server/edit/yaml/block-edit.test.ts).

import { chmodSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { describe, expect } from 'vitest';
import { parse } from 'yaml';
import { fields } from '../../../src/lib/data/helpers/guards.ts';
import { engineDir, loadConfig, textCatalog } from '../../../src/lib/data/sources/config.ts';
import { handleWrite } from '../../../src/lib/server/edit/writes.ts';
import type { WriteTarget } from '../../../src/lib/server/edit/writes.ts';
import { it } from '../../fixtures/scratch.ts';
import { recordedKinds } from '../../fixtures/kinds.ts';
import {
    TOKEN,
    changesOf,
    configTarget,
    request,
    undone,
    undoneBack,
    undoneMoved
} from './write-fixture.ts';

const WAITING = 'submitted, pending, under review, under-review';

/** The behavior file of a target, as it is now. */
function behaviorOf(into: WriteTarget): string {
    return readFileSync(into.behaviorFile, 'utf8');
}

/** One config-value write as the page sends it. */
function send(
    into: WriteTarget,
    key: string,
    value: unknown,
    base: unknown,
    file = 'behavior.yml'
): Promise<Response> {
    return handleWrite(request({ kind: 'config-value', file, key, value, base }), TOKEN, into);
}

const ORIGINAL = ['submitted', 'pending', 'under review', 'under-review'];

describe('a list written through the route', () => {
    it('answers what changed, writes the file and records the change as a setting', async () => {
        const into = configTarget();
        const before = behaviorOf(into);
        const next = ['pending', 'submitted', 'under-review', 'queued'];
        const response = await send(into, 'waiting_status', next, ORIGINAL);
        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({
            ok: true,
            changed: ['behavior.yml:waiting_status'],
            refused: []
        });
        expect(behaviorOf(into)).toBe(
            before.replace(`[${WAITING}]`, '[pending, submitted, under-review, queued]')
        );
        const [change] = changesOf(into);
        expect(change).toMatchObject({
            kind: 'config-value',
            file: into.behaviorFile,
            key: 'behavior.yml',
            field: 'waiting_status',
            before: ORIGINAL,
            after: next,
            undo: 'field'
        });
    });

    it('has a word of its own in the History view', () => {
        expect(recordedKinds()).toContain('config-value');
        expect(textCatalog(loadConfig(engineDir()).config)['history.kind_config_value']).toBe(
            'list or family'
        );
    });

    it('answers the reason of a refusal with a 200, and writes and records nothing', async () => {
        const into = configTarget();
        const before = behaviorOf(into);
        const response = await send(into, 'waiting_status', ['x'], ['stale']);
        expect(response.status).toBe(200);
        const answer = (await response.json()) as {
            ok: boolean;
            changed: string[];
            refused: unknown[];
        };
        expect(answer.changed).toEqual([]);
        expect(answer.refused).toHaveLength(1);
        expect(behaviorOf(into)).toBe(before);
        expect(changesOf(into)).toEqual([]);
    });

    it('refuses a list in a family of records and a record in a key/value family, writing nothing', async () => {
        const into = configTarget();
        const behavior = behaviorOf(into);
        const layout = readFileSync(into.layoutFile, 'utf8');
        const groups = fields(parse(layout) as unknown).nav_groups as Record<string, unknown>;
        const limits = fields(parse(behavior) as unknown).read_limits as Record<string, unknown>;
        const text = textCatalog(loadConfig(engineDir()).config);

        const listed = await send(
            into,
            'nav_groups',
            { ...groups, help: [{ label: 'Help', glyph: 'page', chord: 'h' }] },
            groups,
            'layout.yml'
        );
        const record = await send(into, 'read_limits', { ...limits, next: { a: 1 } }, limits);

        for (const [response, key, field] of [
            [listed, 'wants_record', 'layout.yml:nav_groups'],
            [record, 'wants_value', 'behavior.yml:read_limits']
        ] as const) {
            expect(response.status).toBe(200);
            const answer = (await response.json()) as {
                changed: string[];
                refused: { field: string; reason: string }[];
            };
            expect(answer.changed).toEqual([]);
            expect(answer.refused).toHaveLength(1);
            expect(answer.refused[0].field).toBe(field);
            expect(answer.refused[0].reason).toBe(
                text[`server.config_value.${key}`].replace(
                    '{0}',
                    key === 'wants_record' ? 'help' : 'next'
                )
            );
        }
        expect(behaviorOf(into)).toBe(behavior);
        expect(readFileSync(into.layoutFile, 'utf8')).toBe(layout);
        expect(changesOf(into)).toEqual([]);
    });

    it('answers 400 for a body missing the base, which is not a write, where the same body with it is', async () => {
        const into = configTarget();
        const body = {
            kind: 'config-value',
            file: 'behavior.yml',
            key: 'waiting_status',
            value: ['one']
        };
        const without = await handleWrite(request(body), TOKEN, into);
        expect(without.status).toBe(400);
        expect(changesOf(into)).toEqual([]);
        const withBase = await handleWrite(request({ ...body, base: ORIGINAL }), TOKEN, into);
        expect(withBase.status).toBe(200);
        expect(changesOf(into)).toHaveLength(1);
    });
});

describe('taking a list back', () => {
    it('puts the file back byte for byte and logs the undo above the write', async () => {
        const into = configTarget();
        const before = behaviorOf(into);
        const next = ['pending', 'submitted', 'under-review', 'queued'];
        await send(into, 'waiting_status', next, ORIGINAL);
        const [change] = changesOf(into);
        const back = await undoneBack(into, change, into.behaviorFile, before);
        expect(back).toMatchObject({
            kind: 'config-value',
            field: 'waiting_status',
            before: next,
            after: ORIGINAL,
            undoes: change.at
        });
    });

    it('answers moved once the key was written again, and leaves the file alone', async () => {
        const into = configTarget();
        await send(into, 'waiting_status', ['one'], ORIGINAL);
        const [change] = changesOf(into);
        await send(into, 'waiting_status', ['two'], ['one']);
        await undoneMoved(into, change, into.behaviorFile, behaviorOf(into));
    });

    it('answers gone once the file no longer parses', async () => {
        const into = configTarget();
        await send(into, 'waiting_status', ['one'], ORIGINAL);
        const [change] = changesOf(into);
        const spoiled = `${behaviorOf(into)}\nbroken: [unclosed\n`;
        writeFileSync(into.behaviorFile, spoiled);
        const response = await undone(into, change);
        expect(response.status).toBe(404);
        expect(await response.json()).toEqual({ error: 'gone' });
        expect(behaviorOf(into)).toBe(spoiled);
    });
});

describe('several lists written', () => {
    it('lands two writes of different keys made at once, none lost to the other', async () => {
        const into = configTarget();
        const domains = ['heart', 'liver', 'liverfl', 'liversurv', 'immune', 'brain', 'brainbci'];
        const answers = await Promise.all([
            send(into, 'waiting_status', ['one'], ORIGINAL),
            send(into, 'data_domains', ['two'], domains)
        ]);
        expect(answers.map((one) => one.status)).toEqual([200, 200]);
        expect(behaviorOf(into)).toContain('waiting_status: [one]');
        expect(behaviorOf(into)).toContain('data_domains: [two]');
        expect(
            changesOf(into)
                .map((one) => one.field)
                .sort()
        ).toEqual(['data_domains', 'waiting_status']);
    });

    it('refuses the second of two writes of one key made at once with the same base', async () => {
        const into = configTarget();
        const answers = await Promise.all([
            send(into, 'waiting_status', ['one'], ORIGINAL),
            send(into, 'waiting_status', ['two'], ORIGINAL)
        ]);
        const bodies = (await Promise.all(answers.map((one) => one.json()))) as {
            changed: string[];
        }[];
        expect(bodies.map((one) => one.changed.length).sort()).toEqual([0, 1]);
        expect(changesOf(into)).toHaveLength(1);
    });
});

describe('a file the route cannot read or write', () => {
    it('answers unwritable for a file that is not there, and records nothing', async () => {
        const into = configTarget();
        rmSync(into.behaviorFile);
        const response = await send(into, 'waiting_status', ['x'], ORIGINAL);
        expect(response.status).toBe(500);
        expect(await response.json()).toEqual({ error: 'unwritable' });
        expect(changesOf(into)).toEqual([]);
    });

    it('answers unwritable for a read-only file, and leaves it as it was', async () => {
        const into = configTarget();
        chmodSync(into.behaviorFile, 0o444);
        const before = behaviorOf(into);
        const response = await send(into, 'waiting_status', ['x'], ORIGINAL);
        expect(response.status).toBe(500);
        expect(await response.json()).toEqual({ error: 'unwritable' });
        expect(behaviorOf(into)).toBe(before);
        expect(changesOf(into)).toEqual([]);
    });
});
