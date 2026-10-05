// Layer 2, route tests. What the /api/write route does with a config-key write: the undo through
// the same writer.
//
// The engine is a scratch copy of the checkout's config/ folder (write-fixture.ts), and the target
// names it, so no case here writes the checkout's config or reads the machine's own file. What this
// does NOT cover: the Settings control that sends the write.
// @module-tag slow: every case takes 140 ms or more to write a setting through the route.

import { readFileSync, writeFileSync } from 'node:fs';
import { describe, expect } from 'vitest';
import { handleWrite } from '../../../src/lib/server/edit/writes.ts';
import type { WriteTarget } from '../../../src/lib/server/edit/writes.ts';
import { it } from '../../fixtures/scratch.ts';
import {
    TOKEN,
    changesOf,
    configTarget,
    engineFile,
    request,
    undoneBack
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

describe('taking a setting back', () => {
    it('puts the file back byte for byte and logs the undo above the write', async () => {
        const into = keepTarget();
        const before = behaviorOf(into);
        await send(into, 'behavior.yml', 'changes.keep', 300);
        const [change] = changesOf(into);
        const back = await undoneBack(into, change, into.behaviorFile, before);
        expect(back).toMatchObject({
            kind: 'config-key',
            field: 'changes.keep',
            before: 300,
            after: 200,
            undoes: change.at
        });
    });
    it('puts back a value the file held that its catalog entry refuses', async () => {
        const into = configTarget();
        const file = into.behaviorFile;
        const original = readFileSync(file, 'utf8');
        expect(original).toContain('  days: 3\n');
        writeFileSync(file, original.replace('  days: 3\n', '  days: x\n'));
        const before = behaviorOf(into);
        const answer = await send(into, 'behavior.yml', 'slurm.days', 4);
        expect(answer.status).toBe(200);
        expect(behaviorOf(into)).toContain('  days: 4\n');
        const [change] = changesOf(into);
        const back = await undoneBack(into, change, file, before);
        expect(behaviorOf(into)).toContain('  days: x\n');
        expect(back).toMatchObject({
            kind: 'config-key',
            field: 'slurm.days',
            before: 4,
            after: 'x',
            undoes: change.at
        });
    });
});
