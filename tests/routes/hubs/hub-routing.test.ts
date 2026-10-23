// Layer 2, route tests. A record id names the hub a write goes to (G8): every record of every hub,
// the primary's included, is `<hub>:<key>`, so a bare key is refused as a write that lacks the
// record's hub and a hub no workspace folder carries answers not found. A rename of a key reaches
// every hub's reference that resolves to the renamed record and no other. Each case plants a hub
// of its own under the system temporary directory and compares the files byte for byte after the
// write.

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect } from 'vitest';
import { applyTextEdits } from '../../../src/lib/data/prose/text-edits.ts';
import { graphOf, hitAt } from '../../../src/lib/data/snapshot/references/lookup.ts';
import { planRename } from '../../../src/lib/data/snapshot/references/rename.ts';
import { mirrorOf, projectIds } from '../../../src/lib/server/git/deposit/deposit.ts';
import {
    handleWrite,
    type PrimaryTarget,
    type WriteTarget
} from '../../../src/lib/server/edit/writes.ts';
import { words } from '../../../src/lib/server/core/words.ts';
import { it, scratchDir, test } from '../../fixtures/scratch.ts';
import { copies, indexedOnce } from '../../data/hubs/hubs-fixture.ts';
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
    it('changes the primary hub and the other hub each for the id of its hub and its key', async () => {
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

        expect((await edit(into, 'hub:alpha')).status).toBe(200);
        expect(manifestOf(into)).toBe(primaryBefore.replace('the line', 'a routed line'));
    });

    it('names every hub by its prefix when the workspace has no primary, and refuses a bare id', async () => {
        const base = target();
        const into: WriteTarget = {
            ...base,
            hub: null,
            primary: null,
            hubs: [{ key: 'research-hub', hub: base.hub, config: base.config }]
        };
        const before = manifestOf(base);

        expect((await edit(into, 'alpha')).status).toBe(400);
        expect(manifestOf(base)).toBe(before);

        expect((await edit(into, 'research-hub:alpha')).status).toBe(200);
        expect(manifestOf(base)).toBe(before.replace('the line', 'a routed line'));
        const [change] = changesOf(into);
        expect(change.file).toBe(join(base.hub, 'projects', 'manuscripts', 'alpha', 'project.yml'));
    });
});

/** A target over the primary hub of `target()` and the second hub `lab` of `plantLab`. */
function twoHubs(): { into: PrimaryTarget; lab: { dir: string; file: string } } {
    const base = target();
    const lab = plantLab();
    return { into: { ...base, hubs: [{ key: 'lab', hub: lab.dir, config: base.config }] }, lab };
}

describe('a write names its record by its hub and its key', () => {
    it.each([
        [
            'a bare key, with 400 and the sentence that the write needs its hub',
            'alpha',
            400,
            'server.write_route.no_hub_part',
            'alpha'
        ],
        [
            'a hub no workspace folder carries, with 404 and the sentence naming the hub',
            'nowhere:alpha',
            404,
            'server.workspace.no_hub_named',
            'nowhere'
        ]
    ])('refuses %s, and writes nothing (C16)', async (_name, id, status, sentence, named) => {
        const { into, lab } = twoHubs();
        const primaryBefore = manifestOf(into);
        const labBefore = readFileSync(lab.file, 'utf8');
        const response = await edit(into, id);
        expect(response.status).toBe(status);
        expect(await response.json()).toEqual({ error: words(into.config.text, sentence, named) });
        expect(manifestOf(into)).toBe(primaryBefore);
        expect(readFileSync(lab.file, 'utf8')).toBe(labBefore);
        expect(changesOf(into)).toEqual([]);
    });

    it('reaches the manifest of a project of the primary and of another hub for a deposit (C14)', () => {
        const { into } = twoHubs();
        const mirrors = scratchDir('oculus-mirrors-');
        expect(projectIds({ into }).sort()).toEqual(['hub:alpha', 'lab:beta']);
        expect(mirrorOf('hub:alpha', { mirrors, into })).toBe(join(mirrors, 'alpha'));
        expect(mirrorOf('lab:beta', { mirrors, into })).toBe(join(mirrors, 'beta'));
        expect(mirrorOf('alpha', { mirrors, into })).toBe('');
    });
});

/** A venue of the id `id` put in front of the entries of a hub's venues file. */
function plantVenue(hub: string, id: string): void {
    const file = join(hub, '.oculus', 'data', 'research', 'venues.yml');
    const held = readFileSync(file, 'utf8');
    writeFileSync(
        file,
        held.replace(/\nentries:\n/, `\nentries:\n  - id: ${id}\n    name: ${id}\n`)
    );
}

/** A project of the ideas folder of a hub whose venue is `venue`; its path inside the hub. */
function plantPaper(hub: string, id: string, venue: string): string {
    const path = join('projects', 'ideas', id, 'project.yml');
    mkdirSync(join(hub, 'projects', 'ideas', id), { recursive: true });
    writeFileSync(
        join(hub, path),
        `title: ${id}\ntier: projects\nstage: nascent\nvenue: ${venue}\n`
    );
    return path;
}

describe('a rename of a key across the hubs of a workspace', () => {
    it.each([
        ['rewrites the reference of a hub that holds no such key', false, true],
        ['leaves the reference of a hub that holds its own key', true, false]
    ])("renames the primary's venue: %s (C8)", { tags: ['slow'] }, (_name, own, rewritten) => {
        const from = copies();
        plantVenue(from.hub, 'science');
        if (own) plantVenue(from.lab, 'science');
        const labPaper = plantPaper(from.lab, 'lab-paper', 'science');
        const dirs: Record<string, string> = { hub: from.hub, lab: from.lab };
        const { references } = indexedOnce(
            Object.entries(dirs).map(([name, dir]) => ({ name, dir })),
            'hub'
        );
        const graph = graphOf(references);
        const venues = '.oculus/data/research/venues.yml';
        const scan = graph.index.files.find(
            (one) => one.file.root === 'hub' && one.file.path === venues
        );
        const defined = scan?.definitions.find((one) => one.value === 'science');
        if (scan === undefined || defined === undefined) throw new Error('no science in hub');
        const hit = hitAt(graph, scan, defined.span.start);
        if (hit === null) throw new Error('the definition answers nothing');
        const plan = planRename(graph, hit, 'science-two', (one) => ({
            text: readFileSync(join(dirs[one.file.root], one.file.path), 'utf8')
        }));
        expect(plan.ok).toBe(true);
        const edited = plan.ok
            ? plan.files.map((one) => `${one.scan.file.root}/${one.scan.file.path}`)
            : [];
        expect(edited).toContain(`hub/${venues}`);
        expect(edited.includes(`lab/${labPaper}`)).toBe(rewritten);
        expect(edited.includes(`lab/${venues}`)).toBe(false);
        const lab = plan.ok ? plan.files.find((one) => one.scan.file.path === labPaper) : undefined;
        if (lab === undefined) return;
        const text = readFileSync(join(from.lab, labPaper), 'utf8');
        expect(applyTextEdits(text, lab.edits)).toEqual({
            ok: true,
            text: text.replace('venue: science', 'venue: science-two')
        });
    });
});
