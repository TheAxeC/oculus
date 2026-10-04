// Layer 2, route tests. What the /api/write route does with a config-value write: a list or a
// family written into a scratch engine's file and its record in the change log, the undo through
// the same writer, and two writes of one key at once.
//
// The engine is a scratch copy of the checkout's config/ folder (write-fixture.ts), and the target
// names it, so no case here writes the checkout's config or reads the machine's own file. What this
// does NOT cover: the editors that send the write, which are state/system/config/editors's and the
// look's, and the render of the bytes (tests/server/edit/yaml/block-edit.test.ts).
// @module-tag slow: every case takes 240 ms or more to write a list through the route.

import { readFileSync } from 'node:fs';
import { describe, expect } from 'vitest';
import { handleWrite } from '../../../src/lib/server/edit/writes.ts';
import type { WriteTarget } from '../../../src/lib/server/edit/writes.ts';
import { it } from '../../fixtures/scratch.ts';
import { TOKEN, changesOf, configTarget, request, undoneBack } from './write-fixture.ts';

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
});

describe('several lists written', () => {
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
