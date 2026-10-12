// Layer 2, route tests. A record id names the hub a write goes to (G32): the primary hub's records
// are bare ids and every other hub's are `<name>:id`, and a workspace with no primary names every
// hub's records with its prefix, so a bare id answers not found. Each case plants a hub of its own
// under the system temporary directory and compares the manifest files byte for byte after the
// write.

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect } from 'vitest';
import {
    handleWrite,
    type PrimaryTarget,
    type WriteTarget
} from '../../../src/lib/server/edit/writes.ts';
import { it, scratchDir, test } from '../../fixtures/scratch.ts';
import {
    MANIFEST,
    TOKEN,
    changesOf,
    manifestOf,
    request,
    target,
    warmConfig
} from '../edit/write-fixture.ts';

test.beforeAll(warmConfig);

/** A second hub holding the project `beta`, and its manifest file. */
function plantLab(): { dir: string; file: string } {
    const dir = scratchDir('oculus-lab-');
    const folder = join(dir, 'projects', 'manuscripts', 'beta');
    mkdirSync(folder, { recursive: true });
    const file = join(folder, 'project.yml');
    writeFileSync(file, MANIFEST.replace('id: alpha', 'id: beta'));
    return { dir, file };
}

const edit = (into: WriteTarget, id: string) =>
    handleWrite(
        request({ kind: 'manifest', id, fields: { 'status.line': 'a routed line' } }),
        TOKEN,
        into
    );

describe('a write routed by the id of a record', () => {
    it('changes the primary hub for a bare id and the other hub for its prefixed id', async () => {
        const base = target();
        const lab = plantLab();
        const into: PrimaryTarget = {
            ...base,
            hubs: [{ key: 'lab', hub: lab.dir, config: base.config }]
        };
        const primaryBefore = manifestOf(into);
        const labBefore = readFileSync(lab.file, 'utf8');

        expect((await edit(into, 'lab:beta')).status).toBe(200);
        expect(readFileSync(lab.file, 'utf8')).toBe(labBefore.replace('the line', 'a routed line'));
        expect(manifestOf(into)).toBe(primaryBefore);

        expect((await edit(into, 'alpha')).status).toBe(200);
        expect(manifestOf(into)).toBe(primaryBefore.replace('the line', 'a routed line'));
    });

    it('names every hub by its prefix when the workspace has no primary, and a bare id is not found', async () => {
        const base = target();
        const into: WriteTarget = {
            ...base,
            hub: null,
            primary: null,
            hubs: [{ key: 'research-hub', hub: base.hub, config: base.config }]
        };
        const before = manifestOf(base);

        expect((await edit(into, 'alpha')).status).toBe(404);
        expect(manifestOf(base)).toBe(before);

        expect((await edit(into, 'research-hub:alpha')).status).toBe(200);
        expect(manifestOf(base)).toBe(before.replace('the line', 'a routed line'));
        const [change] = changesOf(into);
        expect(change.file).toBe(join(base.hub, 'projects', 'manuscripts', 'alpha', 'project.yml'));
    });
});
