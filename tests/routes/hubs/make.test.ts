// Layer 2, route tests. POST /api/folders/make (server/files/project/make.ts), Make Folder a Hub
// and Make Folder a Project of the Files view: the token (G1), a folder outside the served roots
// (G2), what a folder offers, and the files a make writes, refuses and records in the change log.
//
// Each case plants its folders under the system temporary directory and a home folder of its own,
// so the walk up for a hub above a folder never reaches the machine's home folder. The templates
// are oculus's own docs/templates.md, read and never written. A make that is refused is checked
// to have written nothing by listing the planted folder before and after it.

import {
    lstatSync,
    readFileSync,
    readdirSync,
    readlinkSync,
    realpathSync,
    symlinkSync
} from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { describe, expect } from 'vitest';
import { readChanges, type ChangeLog } from '../../../src/lib/server/core/changes.ts';
import { fsWrites } from '../../../src/lib/server/core/json.ts';
import { engineDir } from '../../../src/lib/data/sources/config.ts';
import { handleMake, type MakeTarget } from '../../../src/lib/server/files/project/make.ts';
import { it, plantScratch, scratchDir } from '../../fixtures/scratch.ts';

const TOKEN = 'a-make-token';

/** A planted folder by its real path, so the paths the route answers compare with it. */
function planted(files: Record<string, string> = {}, folders: string[] = []): string {
    return realpathSync(plantScratch('oculus-make-', files, folders));
}

/** One world: a served root `ws` over a planted folder, a home folder and a change log. */
function world(files: Record<string, string> = {}, folders: string[] = []) {
    const ws = planted(files, folders);
    const log: ChangeLog = {
        file: join(scratchDir('oculus-make-log-'), 'changes.jsonl'),
        keep: 100,
        writes: fsWrites()
    };
    const target: MakeTarget = {
        roots: [{ key: 'ws', dir: ws }],
        engine: engineDir(),
        writes: fsWrites(),
        changes: log,
        home: planted()
    };
    return { ws, log, target };
}

/** Post one body to the route, with the token unless the case names other headers. */
async function post(
    target: MakeTarget,
    body: unknown,
    headers: Record<string, string> = { 'x-oculus-token': TOKEN }
): Promise<{ status: number; body: Record<string, unknown> }> {
    const request = new Request('http://localhost/api/folders/make', {
        method: 'POST',
        headers: { 'content-type': 'application/json', ...headers },
        body: JSON.stringify(body)
    });
    const response = await handleMake(request, TOKEN, target);
    return { status: response.status, body: (await response.json()) as Record<string, unknown> };
}

/** Every path under a folder, files and folders, relative to it and sorted. */
function tree(dir: string): string[] {
    return readdirSync(dir, { recursive: true, encoding: 'utf8' }).sort();
}

describe('the request', () => {
    it('refuses a request without the token and one with a wrong token with a 403, before it reads the folder, and writes nothing (G1)', async () => {
        const w = world({}, ['empty']);
        const before = tree(w.ws);
        const refused: Record<string, string>[] = [{}, { 'x-oculus-token': 'a-wrong-token' }];
        for (const headers of refused) {
            for (const body of [
                { action: 'hub', root: 'ws', path: 'empty', keys: ['venues'] },
                { action: 'project', root: 'nowhere', path: 'empty' }
            ]) {
                expect(await post(w.target, body, headers)).toEqual({
                    status: 403,
                    body: { error: 'token' }
                });
            }
        }
        expect(tree(w.ws)).toEqual(before);
        expect(readChanges(w.log)).toEqual([]);
    });

    it('refuses a path that climbs out of the root and a root nothing serves as outside, and writes nothing (G2)', async () => {
        const w = world({}, ['empty']);
        const before = tree(w.ws);
        for (const [root, path] of [
            ['ws', '../..'],
            ['ws', '../outside'],
            ['nowhere', 'empty'],
            ['', 'empty']
        ]) {
            for (const action of ['offer', 'hub', 'project']) {
                const answer = await post(w.target, { action, root, path, keys: [] });
                expect({ root, path, action, answer }).toEqual({
                    root,
                    path,
                    action,
                    answer: { status: 403, body: { error: 'outside' } }
                });
            }
        }
        expect(tree(w.ws)).toEqual(before);
    });
});

/** One folder the offer is asked of: what is planted, and what it is offered. */
type OfferRow = {
    name: string;
    files: Record<string, string>;
    folders: string[];
    offer: { hub: boolean; project: boolean };
};

describe('what a folder offers', () => {
    it.each<OfferRow>([
        {
            name: 'an empty folder offers both controls',
            files: {},
            folders: ['f'],
            offer: { hub: true, project: true }
        },
        {
            name: 'a hub, a folder holding .oculus/config.yml, offers neither',
            files: { 'f/.oculus/config.yml': '' },
            folders: [],
            offer: { hub: false, project: false }
        },
        {
            name: 'a folder inside a hub offers a project only',
            files: { '.oculus/config.yml': '' },
            folders: ['f'],
            offer: { hub: false, project: true }
        },
        {
            name: 'a folder holding .oculus/project.yml offers neither',
            files: { 'f/.oculus/project.yml': 'tier: projects\n' },
            folders: [],
            offer: { hub: false, project: false }
        },
        {
            name: 'a folder holding project.yml offers neither',
            files: { 'f/project.yml': 'tier: projects\n' },
            folders: [],
            offer: { hub: false, project: false }
        }
    ])('$name', async ({ files, folders, offer }) => {
        const w = world(files, folders);
        const answer = await post(w.target, { action: 'offer', root: 'ws', path: 'f' });
        expect(answer.status).toBe(200);
        expect({ hub: answer.body.hub, project: answer.body.project }).toEqual(offer);
        const keys = (answer.body.collections as { key: string }[]).map((one) => one.key);
        expect(keys).toEqual(expect.arrayContaining(['literature', 'venues']));
    });

    it("offers both controls on a folder under a home folder whose .oculus holds config.yml, and neither on the home folder itself, since the home folder's .oculus is oculus's own", async () => {
        const home = planted({ '.oculus/config.yml': '' }, ['work/f']);
        const target: MakeTarget = {
            roots: [{ key: 'home', dir: home }],
            engine: engineDir(),
            writes: fsWrites(),
            home
        };
        const under = await post(target, { action: 'offer', root: 'home', path: 'work/f' });
        expect({ hub: under.body.hub, project: under.body.project }).toEqual({
            hub: true,
            project: true
        });
        const itself = await post(target, { action: 'offer', root: 'home', path: '' });
        expect({ hub: itself.body.hub, project: itself.body.project }).toEqual({
            hub: false,
            project: false
        });
    });
});

describe('a make', () => {
    it('makes a hub of two collections: .oculus/config.yml listing them and their two data files, recorded as one create of the .oculus folder', async () => {
        const w = world({}, ['f']);
        const answer = await post(w.target, {
            action: 'hub',
            root: 'ws',
            path: 'f',
            keys: ['venues', 'literature']
        });
        expect(answer).toEqual({
            status: 200,
            body: {
                ok: true,
                written: [
                    '.oculus/config.yml',
                    '.oculus/data/venues.yml',
                    '.oculus/data/literature.yml'
                ]
            }
        });
        const folder = join(w.ws, 'f');
        const config = parse(readFileSync(join(folder, '.oculus/config.yml'), 'utf8')) as {
            collections: { key: string; file: string }[];
        };
        expect(config.collections).toEqual([
            { key: 'venues', file: '.oculus/data/venues.yml' },
            { key: 'literature', file: '.oculus/data/literature.yml' }
        ]);
        for (const file of ['.oculus/data/venues.yml', '.oculus/data/literature.yml']) {
            expect(parse(readFileSync(join(folder, file), 'utf8'))).toHaveProperty('schema');
        }
        const records = readChanges(w.log);
        expect(records).toHaveLength(1);
        expect(records[0]).toMatchObject({
            kind: 'files',
            field: 'create',
            before: [],
            after: [{ path: join(folder, '.oculus'), kind: 'dir' }]
        });
    });

    it('refuses a hub make as exists, naming the path, when one of its files is there, and writes nothing', async () => {
        const w = world({ 'f/.oculus/data/literature.yml': 'mine\n' });
        const before = tree(w.ws);
        expect(
            await post(w.target, {
                action: 'hub',
                root: 'ws',
                path: 'f',
                keys: ['venues', 'literature']
            })
        ).toEqual({ status: 409, body: { error: 'exists', path: '.oculus/data/literature.yml' } });
        expect(tree(w.ws)).toEqual(before);
        expect(readFileSync(join(w.ws, 'f/.oculus/data/literature.yml'), 'utf8')).toBe('mine\n');
        expect(readChanges(w.log)).toEqual([]);
    });

    it('refuses a hub make with a key no template offers, and writes nothing', async () => {
        const w = world({}, ['f']);
        const before = tree(w.ws);
        expect(
            await post(w.target, {
                action: 'hub',
                root: 'ws',
                path: 'f',
                keys: ['venues', 'no-such-collection']
            })
        ).toEqual({
            status: 400,
            body: { error: 'unknown-collection', key: 'no-such-collection' }
        });
        expect(tree(w.ws)).toEqual(before);
        expect(readChanges(w.log)).toEqual([]);
    });

    it('makes a project: .oculus/project.yml from the template, recorded as one create of the .oculus folder', async () => {
        const w = world({}, ['f']);
        expect(await post(w.target, { action: 'project', root: 'ws', path: 'f' })).toEqual({
            status: 200,
            body: { ok: true, written: ['.oculus/project.yml'] }
        });
        const manifest = parse(readFileSync(join(w.ws, 'f/.oculus/project.yml'), 'utf8')) as {
            tier?: unknown;
        };
        expect(manifest).toHaveProperty('tier');
        expect(readChanges(w.log)).toEqual([
            expect.objectContaining({
                kind: 'files',
                field: 'create',
                before: [],
                after: [expect.objectContaining({ path: join(w.ws, 'f/.oculus'), kind: 'dir' })]
            })
        ]);
    });

    it('records only the paths a make brings into being, so an undo of the make never takes a file or a link it found (G9)', async () => {
        const kept = world({ 'f/.oculus/notes.md': 'mine\n' });
        expect(await post(kept.target, { action: 'project', root: 'ws', path: 'f' })).toEqual({
            status: 200,
            body: { ok: true, written: ['.oculus/project.yml'] }
        });
        expect(readFileSync(join(kept.ws, 'f/.oculus/notes.md'), 'utf8')).toBe('mine\n');
        expect(readChanges(kept.log)).toEqual([
            expect.objectContaining({
                kind: 'files',
                field: 'create',
                before: [],
                after: [
                    expect.objectContaining({
                        path: join(kept.ws, 'f/.oculus/project.yml'),
                        kind: 'file'
                    })
                ]
            })
        ]);

        const dangling = world({}, ['f']);
        const link = join(dangling.ws, 'f/.oculus');
        symlinkSync(join(dangling.ws, 'gone'), link);
        const answer = await post(dangling.target, { action: 'project', root: 'ws', path: 'f' });
        expect(answer).toEqual({ status: 500, body: { error: 'failed', written: '' } });
        expect(lstatSync(link).isSymbolicLink()).toBe(true);
        expect(readlinkSync(link)).toBe(join(dangling.ws, 'gone'));
        expect(tree(dangling.ws)).toEqual(['f', join('f', '.oculus')]);
        expect(readChanges(dangling.log)).toEqual([]);
    });

    it('refuses a make the folder does not offer as not-offered, and writes nothing', async () => {
        const w = world({ 'f/project.yml': 'tier: projects\n', '.oculus/config.yml': '' }, ['g']);
        const before = tree(w.ws);
        for (const [action, path] of [
            ['hub', 'f'],
            ['project', 'f'],
            ['hub', 'g'],
            ['project', '']
        ]) {
            const answer = await post(w.target, { action, root: 'ws', path, keys: [] });
            expect({ action, path, answer }).toEqual({
                action,
                path,
                answer: { status: 409, body: { error: 'not-offered' } }
            });
        }
        expect(tree(w.ws)).toEqual(before);
        expect(readChanges(w.log)).toEqual([]);
    });
});
