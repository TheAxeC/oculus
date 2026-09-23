// What the /api/fs route answers. The route itself is a few lines handing the request to
// lib/server/files/fs.ts with the workspaces file of local.yml, the roots of config/sources.yml and
// the process's write chain, which is what this calls: handleFs and handleFsWrite take a Request
// and the target to read and write.
//
// Every root and every workspaces file here is synthetic, under the system temporary directory, and
// every path written is asserted to be inside it first. What this does NOT cover: the route module
// reading the machine's own config/local.yml, which is exercised by the browser layer.

import { existsSync, mkdirSync, realpathSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import {
    addedRoots,
    fsWrites,
    ignoredCache,
    handleFs,
    handleFsWrite,
    readSaved,
    type FsTarget
} from '../../../src/lib/server/files/fs.ts';
import { ENGINE_ROOT, engineRoot } from '../../../src/lib/server/files/files.ts';
import { BOOKMARKS } from '../../../src/lib/server/files/fs/bookmarks.ts';
import { createEntry } from '../../../src/lib/server/edit/writes/entries.ts';
import { portfolioConfigFrom } from '../../../src/lib/data/index.ts';
import { engineDir, loadConfig } from '../../../src/lib/data/sources/config.ts';
import type { Root } from '../../../src/lib/server/files/files.ts';
import { scratchDir, sweepScratch } from '../../fixtures/scratch.ts';

afterAll(sweepScratch);

const HOST = '127.0.0.1:8791';
const TOKEN = 'a-write-token';

/** A directory under the temporary directory, holding the files and folders named. */
function folder(files: Record<string, string> = {}, dirs: string[] = []): string {
    const dir = scratchDir('oculus-fsroute-');
    expect(resolve(dir).startsWith(resolve(tmpdir()) + sep)).toBe(true);
    for (const name of dirs) {
        const full = join(dir, name);
        expect(resolve(full).startsWith(resolve(dir) + sep)).toBe(true);
        mkdirSync(full, { recursive: true });
    }
    for (const [name, body] of Object.entries(files)) {
        const full = join(dir, name);
        expect(resolve(full).startsWith(resolve(dir) + sep)).toBe(true);
        mkdirSync(join(full, '..'), { recursive: true });
        writeFileSync(full, body);
    }
    // The real path: a root stores what realpath gave, and on this platform the temporary
    // directory is reached through a link.
    return realpathSync(dir);
}

/**
 * One target: a hub root holding two entries, and the three files and folders the reader's own
 * writes land in, every one of them inside a fresh temporary directory. Nothing here names
 * ~/.oculus.
 */
function target(): FsTarget & { hub: string } {
    const hub = folder({ 'README.md': '# hub\n' }, ['code']);
    const store = scratchDir('oculus-fsstore-');
    expect(resolve(store).startsWith(resolve(tmpdir()) + sep)).toBe(true);
    const fixed: Root[] = [{ key: 'hub', dir: hub }];
    return {
        hub,
        file: join(store, 'workspaces.json'),
        bookmarks: join(store, 'bookmarks.yml'),
        notes: join(store, 'notes'),
        fixed,
        writes: fsWrites(),
        ignored: ignoredCache()
    };
}

/** The roots the file route would serve for this target right now. */
function served(into: FsTarget): Root[] {
    const saved = readSaved(
        into.file,
        into.fixed.map((one) => one.key)
    );
    return [...into.fixed, ...addedRoots(into.fixed, saved)];
}

/** A GET as the page makes it, with whatever headers a case wants instead. */
function get(query: string, headers: Record<string, string> = {}): Request {
    return new Request(`http://${HOST}/api/fs${query}`, {
        headers: { host: HOST, origin: `http://${HOST}`, ...headers }
    });
}

/** A POST as the page makes it, with the token unless a case takes it away. */
function post(body: unknown, headers: Record<string, string> = {}): Request {
    return new Request(`http://${HOST}/api/fs`, {
        method: 'POST',
        headers: {
            host: HOST,
            origin: `http://${HOST}`,
            'content-type': 'application/json',
            'x-oculus-token': TOKEN,
            ...headers
        },
        body: typeof body === 'string' ? body : JSON.stringify(body)
    });
}

async function read(response: Response): Promise<Record<string, unknown>> {
    return (await response.json()) as Record<string, unknown>;
}

describe('the fs route, reading', () => {
    it('answers the entries of the folder a root and a path name', async () => {
        const into = target();
        const response = handleFs(get('?root=hub&path='), into);
        const body = await read(response);

        expect(response.status).toBe(200);
        expect(body.root).toBe('hub');
        const entries = body.entries as { name: string; kind: string }[];
        expect(entries.map((entry) => entry.name)).toEqual(['code', 'README.md']);
    });

    it('answers the config folder of the engine under the engine root, and nothing above it', async () => {
        // The machine's own file is one of that folder and is listed; the one above the folder is
        // outside the root and is reached by nothing.
        const engine = folder(
            {
                'config/layout.yml': 'nav_groups: {}\n',
                'config/local.yml': 'hub: /elsewhere\n',
                'local.yml': 'hub: /above\n'
            },
            ['config/text']
        );
        const into = target();
        into.fixed = [...into.fixed, engineRoot(engine)];

        const response = handleFs(get(`?root=${ENGINE_ROOT}&path=`), into);
        const body = await read(response);
        expect(response.status).toBe(200);
        const entries = body.entries as { name: string; kind: string }[];
        expect(entries.map((entry) => `${entry.kind}:${entry.name}`)).toEqual([
            'dir:text',
            'file:layout.yml',
            'file:local.yml'
        ]);
        expect(handleFs(get(`?root=${ENGINE_ROOT}&path=..`), into).status).toBe(404);
    });

    it('answers 404 for a path outside the root and for a root nothing names', () => {
        const into = target();

        expect(handleFs(get('?root=hub&path=../..'), into).status).toBe(404);
        expect(handleFs(get('?root=nowhere&path='), into).status).toBe(404);
    });

    it('answers the workspaces when the request names no root', async () => {
        const into = target();
        const body = await read(handleFs(get(''), into));

        expect(body.current).toBe('');
        expect(body.dropped).toEqual([]);
        const workspaces = body.workspaces as {
            name: string;
            roots: { key: string; fixed: boolean }[];
        }[];
        expect(workspaces).toHaveLength(1);
        expect(workspaces[0].name).toBe('');
        // The hub alone is configured, so the reader's own workspace folder is offered beside it.
        expect(workspaces[0].roots.map((root) => `${root.key}:${root.fixed}`)).toEqual([
            'hub:true',
            'workspace:true'
        ]);
    });

    it('names a saved root the configuration reserves, and does not serve it', async () => {
        const into = target();
        const elsewhere = folder({ 'secret.txt': 's\n' });
        writeFileSync(
            into.file,
            JSON.stringify({
                current: '',
                workspaces: [{ name: '', roots: [{ key: 'hub', dir: elsewhere }] }]
            })
        );
        const body = await read(handleFs(get(''), into));

        expect(body.dropped).toEqual(['hub']);
        expect(served(into).find((one) => one.key === 'hub')?.dir).toBe(into.hub);
        const entries = (await read(handleFs(get('?root=hub&path='), into))).entries as {
            name: string;
        }[];
        expect(entries.map((entry) => entry.name)).toEqual(['code', 'README.md']);
    });

    it('refuses a read from another origin, saying why', async () => {
        const into = target();
        const response = handleFs(
            get('?root=hub&path=', { origin: 'https://elsewhere.test' }),
            into
        );

        expect(response.status).toBe(403);
        expect((await read(response)).error).toBe('origin');
    });
});

describe('the fs route, writing', () => {
    it('adds a folder as a root of the workspace in force, keyed by its own name', async () => {
        const into = target();
        const added = folder({ 'note.txt': 'n\n' });
        const response = await handleFsWrite(post({ action: 'add-root', dir: added }), TOKEN, into);

        expect(response.status).toBe(200);
        expect((await read(response)).changed).toEqual(['workspaces']);
        expect(readSaved(into.file).workspaces[0].roots).toEqual([
            { key: added.split(sep).at(-1), dir: added }
        ]);
        expect(served(into).map((root) => root.key)).toContain(added.split(sep).at(-1));
    });

    it('refuses a dir that is relative, absent, a file, or already a root', async () => {
        const into = target();
        const added = folder({ 'note.txt': 'n\n' });
        const say = async (dir: string): Promise<unknown> =>
            (await read(await handleFsWrite(post({ action: 'add-root', dir }), TOKEN, into))).error;

        expect(await say('')).toBe('no-dir');
        expect(await say('notes')).toBe('not-absolute');
        expect(await say(join(added, 'nowhere'))).toBe('no-such-dir');
        expect(await say(join(added, 'note.txt'))).toBe('not-a-directory');
        expect(await say(added)).toBe(undefined);
        expect(await say(added)).toBe('root-held');
    });

    it('refuses the same folder reached through a trailing slash or through a link', async () => {
        const into = target();
        const added = folder({ 'note.txt': 'n\n' });
        const near = folder();
        symlinkSync(added, join(near, 'to-added'));
        const say = async (dir: string): Promise<unknown> =>
            (await read(await handleFsWrite(post({ action: 'add-root', dir }), TOKEN, into))).error;

        expect(await say(added)).toBe(undefined);
        expect(await say(`${added}${sep}`)).toBe('root-held');
        expect(await say(join(near, 'to-added'))).toBe('root-held');
        expect(readSaved(into.file).workspaces[0].roots).toHaveLength(1);
    });

    it('takes a reader-added root out again and refuses a configured one', async () => {
        const into = target();
        const added = folder();
        await handleFsWrite(post({ action: 'add-root', dir: added }), TOKEN, into);
        const key = added.split(sep).at(-1) ?? '';

        const fixed = await handleFsWrite(post({ action: 'remove-root', key: 'hub' }), TOKEN, into);
        expect(fixed.status).toBe(400);
        expect((await read(fixed)).error).toBe('root-fixed');

        const gone = await handleFsWrite(post({ action: 'remove-root', key }), TOKEN, into);
        expect(gone.status).toBe(200);
        expect(readSaved(into.file).workspaces[0].roots).toEqual([]);

        const twice = await handleFsWrite(post({ action: 'remove-root', key }), TOKEN, into);
        expect((await read(twice)).error).toBe('no-such-root');
    });

    it('keeps both changes when two adds are in flight at once', async () => {
        const into = target();
        const one = folder({ 'a.txt': 'a\n' });
        const two = folder({ 'b.txt': 'b\n' });
        const [first, second] = await Promise.all([
            handleFsWrite(post({ action: 'add-root', dir: one }), TOKEN, into),
            handleFsWrite(post({ action: 'add-root', dir: two }), TOKEN, into)
        ]);

        expect([first.status, second.status]).toEqual([200, 200]);
        expect(
            readSaved(into.file)
                .workspaces[0].roots.map((root) => root.dir)
                .sort()
        ).toEqual([one, two].sort());
    });

    it('saves the roots in force under a name and puts that workspace in force', async () => {
        const into = target();
        const added = folder();
        await handleFsWrite(post({ action: 'add-root', dir: added }), TOKEN, into);
        const response = await handleFsWrite(
            post({ action: 'save-workspace', name: 'thesis' }),
            TOKEN,
            into
        );

        expect(response.status).toBe(200);
        const saved = readSaved(into.file);
        expect(saved.current).toBe('thesis');
        expect(saved.workspaces.map((one) => one.name)).toEqual(['', 'thesis']);
        expect(saved.workspaces[1].roots).toEqual([{ key: added.split(sep).at(-1), dir: added }]);
    });

    it('refuses a workspace with no name and one whose name is taken', async () => {
        const into = target();
        const blank = await handleFsWrite(
            post({ action: 'save-workspace', name: '  ' }),
            TOKEN,
            into
        );
        expect((await read(blank)).error).toBe('no-name');

        await handleFsWrite(post({ action: 'save-workspace', name: 'thesis' }), TOKEN, into);
        const twice = await handleFsWrite(
            post({ action: 'save-workspace', name: 'thesis' }),
            TOKEN,
            into
        );
        expect((await read(twice)).error).toBe('name-held');
    });

    it('puts another saved workspace, or the default one, in force', async () => {
        const into = target();
        await handleFsWrite(post({ action: 'save-workspace', name: 'thesis' }), TOKEN, into);

        const back = await handleFsWrite(
            post({ action: 'select-workspace', name: '' }),
            TOKEN,
            into
        );
        expect(back.status).toBe(200);
        expect(readSaved(into.file).current).toBe('');

        const gone = await handleFsWrite(
            post({ action: 'select-workspace', name: 'nowhere' }),
            TOKEN,
            into
        );
        expect((await read(gone)).error).toBe('no-such-workspace');
    });

    it('refuses another origin, a missing token, a body that is not JSON, and an unknown action', async () => {
        const into = target();

        const elsewhere = await handleFsWrite(
            post({ action: 'select-workspace', name: '' }, { origin: 'https://elsewhere.test' }),
            TOKEN,
            into
        );
        expect(elsewhere.status).toBe(403);
        expect((await read(elsewhere)).error).toBe('origin');

        const stale = await handleFsWrite(
            post({ action: 'select-workspace', name: '' }, { 'x-oculus-token': 'stale' }),
            TOKEN,
            into
        );
        expect(stale.status).toBe(403);
        expect((await read(stale)).error).toBe('token');

        const broken = await handleFsWrite(post('not json at all'), TOKEN, into);
        expect(broken.status).toBe(400);
        expect((await read(broken)).error).toBe('not-json');

        const unknown = await handleFsWrite(post({ action: 'drop-everything' }), TOKEN, into);
        expect(unknown.status).toBe(400);
        expect((await read(unknown)).error).toBe('not-an-action');
    });
});

describe("the fs route, the reader's own bookmarks and notes", () => {
    it("answers no bookmarks and the scaffold's schema, and writes no file to do it", async () => {
        const into = target();
        const body = await read(handleFs(get('?bookmarks=1'), into));

        // The form that adds the first bookmark is drawn from this schema, so the reader has the
        // three controls before anything is on the disk; the file is made by the first write alone.
        expect(body.entries).toEqual([]);
        expect((body.schema as { field: string }[]).map((one) => one.field)).toEqual([
            'label',
            'root',
            'path'
        ]);
        expect(existsSync(into.bookmarks)).toBe(false);
    });

    it('answers the bookmarks a write left in the file, with their schema', async () => {
        const into = target();
        const config = portfolioConfigFrom(loadConfig(engineDir()).config, engineDir());
        createEntry(
            into.hub,
            config,
            BOOKMARKS,
            { label: 'manual', root: 'hub', path: 'README.md' },
            into.bookmarks
        );
        const body = await read(handleFs(get('?bookmarks=1'), into));

        const entries = body.entries as { id: string; fields: Record<string, unknown> }[];
        expect(entries.map((one) => one.id)).toEqual(['manual']);
        expect(entries[0].fields).toEqual({ label: 'manual', root: 'hub', path: 'README.md' });
        expect((body.schema as { field: string }[]).map((one) => one.field)).toEqual([
            'label',
            'root',
            'path'
        ]);
    });

    it('writes one note, lists it, reads it back and takes it away again', async () => {
        const into = target();
        const id = '20260915-120000-001';

        const written = await handleFsWrite(
            post({ action: 'note-save', id, title: 'a title', body: 'the body\n' }),
            TOKEN,
            into
        );
        expect(written.status).toBe(200);
        expect((await read(written)).changed).toEqual(['note']);

        const listed = (await read(handleFs(get('?notes=1'), into))).notes as { id: string }[];
        expect(listed.map((one) => one.id)).toEqual([id]);

        const one = await read(handleFs(get(`?note=${id}`), into));
        expect(one).toMatchObject({ id, title: 'a title', body: 'the body\n' });

        const gone = await handleFsWrite(post({ action: 'note-delete', id }), TOKEN, into);
        expect(gone.status).toBe(200);
        expect((await read(handleFs(get('?notes=1'), into))).notes).toEqual([]);
        expect(handleFs(get(`?note=${id}`), into).status).toBe(404);
    });

    it('refuses a note id that would leave the folder, and writes nothing', async () => {
        const into = target();
        const say = async (id: string): Promise<unknown> =>
            (await read(await handleFsWrite(post({ action: 'note-save', id }), TOKEN, into))).error;

        expect(await say('../away')).toBe('no-such-note');
        expect(await say('sub/deep')).toBe('no-such-note');
        expect(await say('')).toBe('no-such-note');
        expect(existsSync(into.notes)).toBe(false);
    });

    it('refuses a bookmarks read from another origin, as every other read is refused', async () => {
        const into = target();
        const response = handleFs(get('?bookmarks=1', { origin: 'https://elsewhere.test' }), into);

        expect(response.status).toBe(403);
        expect((await read(response)).error).toBe('origin');
    });
});
