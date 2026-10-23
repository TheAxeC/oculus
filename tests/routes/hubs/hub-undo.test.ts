// Layer 2, route tests. A change record names its file by the absolute path, so an undo changes the
// file the write changed whichever hub is primary when the undo runs. A write made while
// `research-hub` is primary is undone after a switch to a workspace whose primary is `lab`, which
// holds a file of the same relative path with the same value as the write left: the research hub's
// file goes back to what it was and the lab's file is left byte for byte.
//
// What this does NOT cover: the History view showing the record.
// @module-tag slow: its case builds two hubs and times out under the load of a full npm test, so
// npm test leaves it out.

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect } from 'vitest';
import { handleWrite, type PrimaryTarget } from '../../../src/lib/server/edit/writes.ts';
import { it, scratchDir, test } from '../../fixtures/scratch.ts';
import {
    GOOD,
    MANIFEST,
    TOKEN,
    changesOf,
    manifestOf,
    request,
    target,
    undone,
    warmConfig
} from '../edit/write-fixture.ts';

test.beforeAll(warmConfig);

describe('an undo after the primary hub changed', () => {
    it("changes the file the write changed and leaves the new primary's file of the same path alone", async () => {
        const research = target();
        const before = manifestOf(research);
        expect((await handleWrite(request(GOOD), TOKEN, research)).status).toBe(200);
        const [change] = changesOf(research);
        const written = manifestOf(research);
        expect(written).not.toBe(before);
        expect(change.file).toBe(
            join(research.hub, 'projects', 'manuscripts', 'alpha', 'project.yml')
        );

        const base = target();
        const lab: PrimaryTarget = {
            ...base,
            primary: 'lab',
            changes: research.changes,
            hubs: [{ key: 'research-hub', hub: research.hub, config: research.config }]
        };
        const labFile = join(lab.hub, 'projects', 'manuscripts', 'alpha', 'project.yml');
        writeFileSync(labFile, written);

        expect((await undone(lab, change)).status).toBe(200);

        expect(manifestOf(research)).toBe(before);
        expect(readFileSync(labFile, 'utf8')).toBe(written);
    });
});

describe('a write and its undo in each of two hubs holding one key', () => {
    it("changes only the manifest of the record's own hub, and the undo puts it back (C7)", async () => {
        const into = target();
        const dir = scratchDir('oculus-lab-');
        mkdirSync(join(dir, 'projects', 'manuscripts', 'alpha'), { recursive: true });
        const labFile = join(dir, 'projects', 'manuscripts', 'alpha', 'project.yml');
        writeFileSync(labFile, MANIFEST);
        const both: PrimaryTarget = {
            ...into,
            hubs: [{ key: 'lab', hub: dir, config: into.config }]
        };
        const write = (id: string) =>
            handleWrite(
                request({ kind: 'manifest', id, fields: { 'status.line': `line of ${id}` } }),
                TOKEN,
                both
            );
        const primaryBefore = manifestOf(both);
        const labBefore = readFileSync(labFile, 'utf8');
        for (const [id, own, file, before, other, otherBefore] of [
            ['hub:alpha', 'hub', '', primaryBefore, labFile, labBefore],
            ['lab:alpha', 'lab', labFile, labBefore, '', primaryBefore]
        ]) {
            const read = (path: string): string =>
                path === '' ? manifestOf(both) : readFileSync(path, 'utf8');
            expect((await write(id)).status, own).toBe(200);
            expect(read(file)).toBe(before.replace('the line', `line of ${id}`));
            expect(read(other)).toBe(otherBefore);
            const [change] = changesOf(both);
            expect((await undone(both, change)).status, own).toBe(200);
            expect(read(file)).toBe(before);
            expect(read(other)).toBe(otherBefore);
        }
    });
});
