// Layer 2, route tests. Taking back a Settings write to the settings file of a hub other than the
// primary: the undo finds that hub among the hubs the workspace holds now and puts its file back,
// refuses a file another hand changed since as moved, and answers gone once the hub has left. The
// undo of every other kind of change is tests/routes/edit/undo/undo.test.ts's.
//
// The hubs and the change log are the fixture of tests/routes/edit/write-fixture.ts (`labTarget`),
// all under the system temporary directory, so no case here reaches ~/.oculus or the checkout.
// @module-tag slow: each case merges the whole config folder several times and takes over 100 ms.

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect } from 'vitest';
import { parse } from 'yaml';
import type { Change } from '../../../../src/lib/server/core/changes.ts';
import { handleWrite, type PrimaryTarget } from '../../../../src/lib/server/edit/writes.ts';
import { loadLayers } from '../../../../src/lib/server/edit/writes/config/config-place.ts';
import {
    LAB,
    TOKEN,
    changesOf,
    labTarget,
    request,
    undone,
    undoneBack,
    warmConfig
} from '../write-fixture.ts';
import { it, test } from '../../../fixtures/scratch.ts';

test.beforeAll(warmConfig);

/** The stages a merge gives, by key. */
type Stages = Record<string, Record<string, unknown>>;

/**
 * A workspace with the hub `lab` beside the primary, with lab's and the primary's settings files,
 * the stages lab's merge gives, and the write that relabels lab's `exploring` stage, which answers
 * the change the log records.
 */
function labWrites() {
    const made = labTarget();
    const into = made.into as PrimaryTarget;
    const file = join(made.lab, '.oculus', 'config.yml');
    const primaryFile = join(made.hub, '.oculus', 'config.yml');
    const merged = (): Stages => loadLayers(into.engine, { hub: made.lab }).config.stages as Stages;
    const relabelled = (stages: Stages, label: string): Stages => ({
        ...stages,
        exploring: { ...stages.exploring, label }
    });
    const write = async (label: string): Promise<Change> => {
        const base = merged();
        const body = {
            kind: 'config-value',
            file: 'catalogs/vocab.yml',
            key: 'stages',
            value: relabelled(base, label),
            base,
            root: LAB
        };
        expect((await handleWrite(request(body), TOKEN, into)).status).toBe(200);
        const [change] = changesOf(into);
        expect(change.file).toBe(file);
        return change;
    };
    return { into, file, primaryFile, merged, relabelled, write };
}

describe('taking back a Settings write to a hub other than the primary', () => {
    it("puts lab's settings file back and leaves the primary's as it was", async () => {
        const { into, file, primaryFile, merged, write } = labWrites();
        const before = readFileSync(file, 'utf8');
        const first = await write('Experimenting');
        expect(parse(readFileSync(file, 'utf8'))).toEqual({
            ...parse(before),
            stages: { exploring: { ...merged().exploring } }
        });
        expect(readFileSync(primaryFile, 'utf8')).toBe('{}\n');
        await undoneBack(into, first, file, before);
        expect(readFileSync(primaryFile, 'utf8')).toBe('{}\n');
    });

    it("refuses as moved a write whose stage another hand changed since in lab's file", async () => {
        const { into, file, merged, relabelled, write } = labWrites();
        const second = await write('Trying');
        const hand = relabelled(merged(), 'By hand').exploring;
        const text = `stages:\n  exploring: ${JSON.stringify(hand)}\n`;
        writeFileSync(file, text);
        const moved = await undone(into, second);
        expect(moved.status).toBe(409);
        expect(await moved.json()).toEqual({ error: 'moved' });
        expect(readFileSync(file, 'utf8')).toBe(text);
    });

    it('answers gone for a write of a hub that has left the workspace, and writes nothing', async () => {
        const { into, file, write } = labWrites();
        const third = await write('Again');
        const after = readFileSync(file, 'utf8');
        const gone = await undone({ ...into, hubs: [] }, third);
        expect(gone.status).toBe(404);
        expect(await gone.json()).toEqual({ error: 'gone' });
        expect(readFileSync(file, 'utf8')).toBe(after);
    });
});
