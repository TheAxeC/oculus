// Layer 2, route tests. The /api/app-document route (lib/server/machine/apps/routes/document.ts)
// that gives a custom editor the bytes of the file it was opened on and saves new bytes: the reads
// and saves it answers, the recording of a save in the local history, a file changed on disk since
// the read, and every file and app it closes. These are the custom editor's save-route rows of G77.
//
// Every folder is synthetic, under the system temporary directory. What this does NOT cover: the
// page's own checks before a save (tests/state/system/apps/document.test.ts) and the editor's
// frame.

import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect } from 'vitest';
import {
    handleDocumentGet,
    handleDocumentPost
} from '../../../src/lib/server/machine/apps/routes/document.ts';
import { it } from '../../fixtures/scratch.ts';
import { TOKEN, request } from '../edit/write-fixture.ts';
import { PORT, approveAll, notesFiles, routeSetup } from './apps-fixture.ts';

const EDITOR =
    'contributes:\n  customEditors:\n    - viewType: notes.edit\n      displayName: Edit\n      selector:\n        - filenamePattern: "*"\n      entry: index.html\n';
const MANIFEST = `name: notes\ntitle: Notes\nbridge: 1\n${EDITOR}`;

const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0xff]);
const NEW_PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x00, 0x01, 0x02, 0xfe]);

const hashOf = (bytes: Buffer | string): string => createHash('sha256').update(bytes).digest('hex');

type Plan = { manifest?: string; approve?: boolean };

/** A world: the app `notes`, a root `one` with a text file, a `secrets` folder and a png. */
function world({ manifest = MANIFEST, approve = true }: Plan = {}) {
    const setup = routeSetup({
        machine: notesFiles(manifest),
        roots: {
            one: {
                'data.json': '{"a":1}\n',
                'secrets/k.json': '{"key":1}\n',
                'sub/x.csv': 'a,b\n'
            },
            two: { 'other.json': '{}\n' }
        }
    });
    writeFileSync(join(setup.fixture.base, 'roots', 'one', 'pic.png'), PNG);
    if (approve) approveAll(setup);
    const file = (name: string): string => join(setup.fixture.base, 'roots', 'one', name);
    return { setup, file };
}

type Answer = { ok: boolean; word?: string; content?: string; hash?: string; kept?: boolean };

/** The route's GET for a file. */
async function read(setup: ReturnType<typeof world>['setup'], root: string, path: string) {
    const query = new URLSearchParams({ app: 'app:notes', root, path });
    const response = handleDocumentGet(
        new Request(`http://localhost:${PORT}/api/app-document?${query.toString()}`),
        setup.options
    );
    return (await response.json()) as Answer;
}

/** The route's POST of new bytes for a file, over the hash of the bytes the editor read. */
async function save(
    setup: ReturnType<typeof world>['setup'],
    root: string,
    path: string,
    bytes: Buffer,
    base: string,
    headers: Record<string, string> = {}
) {
    const body = { app: 'app:notes', root, path, base, content: bytes.toString('base64') };
    const response = await handleDocumentPost(request(body, headers), TOKEN, setup.options);
    return { status: response.status, body: (await response.json()) as Answer };
}

describe('the bytes a custom editor reads', () => {
    it('are the file whole, in base64, with their hash', async () => {
        const { setup } = world();
        expect(await read(setup, 'one', 'data.json')).toEqual({
            ok: true,
            content: Buffer.from('{"a":1}\n').toString('base64'),
            hash: hashOf('{"a":1}\n')
        });
    });

    it('are those of a binary file, byte for byte', async () => {
        const { setup } = world();
        const answer = await read(setup, 'one', 'pic.png');
        expect(Buffer.from(answer.content ?? '', 'base64').equals(PNG)).toBe(true);
    });
});

describe('a save of new bytes', () => {
    it('replaces the file and answers the hash of the bytes now on disk', async () => {
        const { setup, file } = world();
        const next = Buffer.from('{"a":2}\n');
        const sent = await save(setup, 'one', 'data.json', next, hashOf('{"a":1}\n'));
        expect([sent.status, sent.body]).toEqual([
            200,
            { ok: true, hash: hashOf(next), kept: true }
        ]);
        expect(readFileSync(file('data.json'), 'utf8')).toBe('{"a":2}\n');
    });

    it('keeps the bytes it replaces in the local history', async () => {
        const { setup, file } = world();
        const history = setup.options.history();
        await save(setup, 'one', 'data.json', Buffer.from('{"a":2}\n'), hashOf('{"a":1}\n'));
        const kept = readdirSync(history, { recursive: true, withFileTypes: true }).filter((one) =>
            one.isFile()
        );
        expect(kept.map((one) => readFileSync(join(one.parentPath, one.name), 'utf8'))).toContain(
            '{"a":1}\n'
        );
        expect(readFileSync(file('data.json'), 'utf8')).toBe('{"a":2}\n');
    });

    it('writes the bytes of a binary file as they are', async () => {
        const { setup, file } = world();
        const sent = await save(setup, 'one', 'pic.png', NEW_PNG, hashOf(PNG));
        expect(sent.body.ok).toBe(true);
        expect(readFileSync(file('pic.png')).equals(NEW_PNG)).toBe(true);
    });

    it('is refused `changed` when the file changed on disk after the read, and the disk keeps its bytes', async () => {
        const { setup, file } = world();
        const answer = await read(setup, 'one', 'data.json');
        writeFileSync(file('data.json'), '{"a":9}\n');
        const sent = await save(
            setup,
            'one',
            'data.json',
            Buffer.from('{"a":2}\n'),
            answer.hash ?? ''
        );
        expect(sent.body).toEqual({ ok: false, word: 'changed' });
        expect(readFileSync(file('data.json'), 'utf8')).toBe('{"a":9}\n');
    });

    it('is refused without the write token', async () => {
        const { setup, file } = world();
        const sent = await save(setup, 'one', 'data.json', Buffer.from('x'), hashOf('{"a":1}\n'), {
            'x-oculus-token': 'wrong'
        });
        expect(sent.status).toBe(403);
        expect(readFileSync(file('data.json'), 'utf8')).toBe('{"a":1}\n');
    });
});

describe('what a custom editor is closed out of', () => {
    it.each([
        ['a file under closed_paths', 'one', 'secrets/k.json'],
        ['a root other than the one the path names', 'two', '../one/data.json'],
        ['a file with a dot folder in its path', 'one', '.git/config']
    ])('reads and saves nothing of %s', async (_row, root, path) => {
        const { setup, file } = world();
        const before = readFileSync(file('secrets/k.json'), 'utf8');
        const asked = await read(setup, root, path);
        const sent = await save(setup, root, path, Buffer.from('x'), hashOf(before));
        expect([asked.ok, sent.body.ok]).toEqual([false, false]);
        expect(readFileSync(file('secrets/k.json'), 'utf8')).toBe(before);
    });

    it('answers `closed` for a file of closed_paths', async () => {
        const { setup } = world();
        expect(await read(setup, 'one', 'secrets/k.json')).toEqual({ ok: false, word: 'closed' });
    });

    it('answers `missing` for a file that is not there', async () => {
        const { setup } = world();
        expect(await read(setup, 'one', 'gone.json')).toEqual({ ok: false, word: 'missing' });
    });

    it('answers `not_declared` for an app with no custom editor', async () => {
        const { setup } = world({ manifest: 'name: notes\ntitle: Notes\nbridge: 1\n' });
        expect(await read(setup, 'one', 'data.json')).toEqual({ ok: false, word: 'not_declared' });
    });

    it('answers `closed` for an app that is not approved', async () => {
        const { setup, file } = world({ approve: false });
        expect(await read(setup, 'one', 'data.json')).toEqual({ ok: false, word: 'closed' });
        const sent = await save(setup, 'one', 'data.json', Buffer.from('x'), hashOf('{"a":1}\n'));
        expect(sent.body).toEqual({ ok: false, word: 'closed' });
        expect(readFileSync(file('data.json'), 'utf8')).toBe('{"a":1}\n');
    });
});
