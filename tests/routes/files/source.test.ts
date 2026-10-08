// Layer 2, route tests. The source endpoint against one synthetic root under the system temporary
// directory: the write's authentication, root refusals, its replacement and the neighbour-rename
// result, and one table of the saves of text: the base the file must hold, the stats around the
// write, the file made where none is, the copies of the history, the bytes it refuses to replace or
// keeps (the whole-file UTF-8 rule and the byte order mark).

import { createHash } from 'node:crypto';
import {
    existsSync,
    mkdirSync,
    readFileSync,
    readdirSync,
    realpathSync,
    statSync,
    unlinkSync,
    writeFileSync
} from 'node:fs';
import { join, resolve, sep } from 'node:path';
import { describe, expect } from 'vitest';
import { mintToken, TOKEN_HEADER } from '../../../src/lib/server/core/auth.ts';
import { savesOf } from '../../../src/lib/server/files/fs/history.ts';
import { handleSource, type StatOf } from '../../../src/lib/server/files/source.ts';
import type { Root } from '../../../src/lib/server/files/files.ts';
import { it, scratchDir } from '../../fixtures/scratch.ts';
import { TEXT } from '../../server/text.ts';

const HOST = '127.0.0.1:8790';

function fixture(): { dir: string; root: Root; file: string; outside: string } {
    const dir = scratchDir('oculus-source-');
    const rootDir = join(dir, 'root');
    mkdirSync(rootDir);
    const file = join(rootDir, 'notes.md');
    const outside = join(dir, 'outside.md');
    for (const path of [file, outside]) {
        expect(resolve(path).startsWith(resolve(dir) + sep)).toBe(true);
        writeFileSync(path, 'before\n');
    }
    return { dir, root: { key: 'fixture', dir: rootDir }, file, outside };
}

const hashOf = (content: string | Buffer): string =>
    createHash('sha256').update(content).digest('hex');

/** Save `body` into the fixture's root, over its history folder and the system's own stat. */
async function save(
    one: ReturnType<typeof fixture>,
    body: Record<string, unknown>,
    stat?: StatOf
): Promise<Response> {
    const token = mintToken();
    return handleSource(
        request(token, { root: one.root.key, ...body }),
        token,
        () => TEXT,
        [one.root],
        join(one.dir, 'history'),
        stat
    );
}

function request(token: string, body: unknown): Request {
    const headers: Record<string, string> = {
        'content-type': 'application/json',
        host: HOST,
        'sec-fetch-site': 'same-origin',
        [TOKEN_HEADER]: token
    };
    return new Request(`http://${HOST}/api/source`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
    });
}

describe('POST /api/source', () => {
    it('requires the current write token', async () => {
        const one = fixture();
        const token = mintToken();
        const body = { root: one.root.key, path: 'notes.md', content: 'after\n' };
        expect(
            (await handleSource(request('stale', body), token, () => TEXT, [one.root])).status
        ).toBe(403);
        expect(readFileSync(one.file, 'utf8')).toBe('before\n');
    });

    it('refuses a path outside the named root', async () => {
        const one = fixture();
        const token = mintToken();
        const response = await handleSource(
            request(token, { root: one.root.key, path: '../outside.md', content: 'after\n' }),
            token,
            () => TEXT,
            [one.root]
        );
        expect(response.status).toBe(403);
        expect(await response.json()).toEqual({
            ok: false,
            error: 'the path is outside the named root',
            refused: [{ field: 'path', reason: 'the path is outside the named root' }]
        });
        expect(readFileSync(one.outside, 'utf8')).toBe('before\n');
        // A file that does not exist yet is made only inside the root.
        const made = await save(one, { path: '../fresh.md', content: 'new\n', create: true });
        expect(made.status).toBe(403);
        expect(existsSync(join(one.dir, 'fresh.md'))).toBe(false);
    });

    it('replaces the complete file through a temporary neighbour and atomic rename', async () => {
        const one = fixture();
        const token = mintToken();
        const inode = statSync(one.file).ino;
        const held = readdirSync(one.root.dir).sort();
        const response = await handleSource(
            request(token, {
                root: one.root.key,
                path: 'notes.md',
                content: 'whole replacement\n'
            }),
            token,
            () => TEXT,
            [one.root]
        );
        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({
            ok: true,
            hash: createHash('sha256').update('whole replacement\n').digest('hex')
        });
        expect(readFileSync(one.file, 'utf8')).toBe('whole replacement\n');
        expect(statSync(one.file).ino).not.toBe(inode);
        expect(readdirSync(one.root.dir).sort()).toEqual(held);
    });
});

/** The text a file starts as and the bytes its saves are judged against. */
const BEFORE = 'before\n';
const OTHER = 'another program wrote this\n';
const BOM = Buffer.from([0xef, 0xbb, 0xbf]);

/** A file of 9,000 bytes of text, then `tail`, which is past the head a browser reads. */
const longHead = (tail: number[]): Buffer =>
    Buffer.concat([Buffer.alloc(9000, 0x61), Buffer.from(tail)]);

/** How a row moves the second stat: it differs from the first, or either stat throws. */
type Stamp = ReturnType<StatOf>;

type Stats =
    'moves' | 'throws before the read' | 'throws before the write' | 'gone before the read';

/** One save of a row, and the answer it expects. */
type Save = {
    body: Record<string, unknown>;
    stat?: Stats;
    status?: number;
    /** The whole JSON answer. */
    answer?: unknown;
    /** A subset of the JSON answer. */
    among?: unknown;
};

/** What the row finds once its saves were answered. */
type Row = {
    title: string;
    /** The bytes notes.md starts with; `before` and a line ending by default. */
    file?: Buffer | string;
    /** Folders made in the root before the first save. */
    folders?: string[];
    saves: Save[];
    /** The bytes notes.md holds at the end. */
    holds?: Buffer | string;
    /** Whether notes.md is not there at the end. */
    absent?: boolean;
    /** Whether the history folder exists at the end. */
    history?: boolean;
    /** How many copies of notes.md the history holds at the end. */
    copies?: number;
    /** Files of the root and what they hold at the end. */
    made?: Record<string, string>;
};

const rows: Row[] = [
    {
        title: 'refuses a save whose base differs from the hash of the file and writes nothing',
        file: OTHER,
        saves: [
            {
                body: { path: 'notes.md', content: 'mine\n', base: hashOf(BEFORE) },
                status: 409,
                answer: {
                    ok: false,
                    error: 'changed',
                    code: 'changed',
                    refused: [{ field: 'base', reason: 'changed' }]
                }
            }
        ],
        holds: OTHER,
        history: false
    },
    {
        title: 'writes a save whose base the file holds and answers the hash of the bytes written',
        saves: [
            {
                body: { path: 'notes.md', content: 'one\n', base: hashOf(BEFORE) },
                answer: { ok: true, hash: hashOf('one\n') }
            },
            {
                body: { path: 'notes.md', content: 'two\n', base: hashOf('one\n') },
                answer: { ok: true, hash: hashOf('two\n') }
            }
        ],
        holds: 'two\n'
    },
    {
        title: 'writes over whatever is there when the body carries no base',
        file: OTHER,
        saves: [
            {
                body: { path: 'notes.md', content: 'mine\n' },
                answer: { ok: true, hash: hashOf('mine\n') }
            }
        ],
        copies: 1
    },
    {
        title: 'keeps at most 50 copies of a file over 51 saves',
        saves: Array.from({ length: 51 }, (_, at): Save => ({
            body: { path: 'notes.md', content: `save ${String(at)}\n` },
            status: 200
        })),
        holds: 'save 50\n',
        copies: 50
    },
    {
        title: 'refuses a save when a second stat right before the write differs from the first',
        saves: [
            {
                body: { path: 'notes.md', content: 'mine\n', base: hashOf(BEFORE) },
                stat: 'moves',
                status: 409,
                among: { code: 'changed' }
            }
        ],
        holds: BEFORE,
        history: false
    },
    {
        title: 'answers changed, and writes nothing, when the file cannot be stat-ed before the read',
        saves: [
            {
                body: { path: 'notes.md', content: 'mine\n', base: hashOf(BEFORE) },
                stat: 'throws before the read',
                status: 409,
                among: { code: 'changed' }
            }
        ],
        holds: BEFORE,
        history: false
    },
    {
        title: 'answers changed, and writes nothing, when the file is deleted between its stat and its read',
        saves: [
            {
                body: { path: 'notes.md', content: 'mine\n', base: hashOf(BEFORE) },
                stat: 'gone before the read',
                status: 409,
                among: { code: 'changed' }
            }
        ],
        absent: true,
        history: false
    },
    {
        title: 'answers changed, and writes nothing, when the file cannot be stat-ed before the write',
        saves: [
            {
                body: { path: 'notes.md', content: 'mine\n', base: hashOf(BEFORE) },
                stat: 'throws before the write',
                status: 409,
                among: { code: 'changed' }
            }
        ],
        holds: BEFORE,
        history: false
    },
    {
        title: 'makes a file that is not there when its folder is in the root, and refuses a folder in its place',
        folders: ['dir'],
        saves: [
            {
                body: { path: 'new.md', content: 'text\n', create: true },
                answer: { ok: true, hash: hashOf('text\n') }
            },
            {
                body: { path: 'dir', content: 'text\n', create: true },
                status: 409,
                among: { refused: [{ field: 'path', reason: 'folder' }] }
            },
            {
                body: { path: 'gone/new.md', content: 'text\n', create: true },
                status: 404,
                answer: { ok: false, error: 'the file is not there' }
            }
        ],
        made: { 'new.md': 'text\n' }
    },
    ...[
        ['a Latin-1 byte after 9,000 bytes of ASCII', longHead([0xe9])],
        ['a NUL byte at byte 10,000', Buffer.concat([Buffer.alloc(10000, 0x61), Buffer.from([0])])],
        ['a lone continuation byte', Buffer.from([0x61, 0x80, 0x62])]
    ].map(([what, bytes]): Row => ({
        title: `refuses a file holding ${String(what)}, and leaves its bytes`,
        file: bytes,
        saves: [
            {
                body: { path: 'notes.md', content: 'text\n' },
                status: 403,
                among: { error: 'binary' }
            }
        ],
        holds: bytes
    })),
    {
        title: 'keeps the byte order mark of a file that starts with one',
        file: Buffer.concat([BOM, Buffer.from('a\n')]),
        saves: [
            {
                body: { path: 'notes.md', content: 'edited\n' },
                among: { hash: hashOf(Buffer.concat([BOM, Buffer.from('edited\n')])) }
            }
        ],
        holds: Buffer.concat([BOM, Buffer.from('edited\n')])
    },
    {
        title: 'saves a file whose multi-byte character straddles byte 8,192',
        file: Buffer.concat([Buffer.alloc(8191, 0x61), Buffer.from('\u20ac\n')]),
        saves: [{ body: { path: 'notes.md', content: 'ok\n' }, status: 200 }],
        holds: 'ok\n'
    },
    {
        title: 'saves an empty file',
        file: '',
        saves: [
            { body: { path: 'notes.md', content: '' }, answer: { ok: true, hash: hashOf('') } }
        ],
        holds: ''
    }
];

describe('POST /api/source, a save of text', () => {
    it.each(rows)('$title', async (row) => {
        const one = fixture();
        if (row.file !== undefined) writeFileSync(one.file, row.file);
        for (const folder of row.folders ?? []) mkdirSync(join(one.root.dir, folder));
        for (const each of row.saves) {
            const stamps: Record<Stats, Stamp[]> = {
                moves: [
                    { ino: 1, size: 7, mtimeMs: 1000, ctimeMs: 1000 },
                    { ino: 1, size: 7, mtimeMs: 2000, ctimeMs: 2000 }
                ],
                'throws before the read': [],
                'throws before the write': [{ ino: 1, size: 7, mtimeMs: 1000, ctimeMs: 1000 }],
                'gone before the read': [{ ino: 1, size: 7, mtimeMs: 1000, ctimeMs: 1000 }]
            };
            const seen = each.stat === undefined ? [] : stamps[each.stat];
            const stat: StatOf | undefined =
                each.stat === undefined
                    ? undefined
                    : (path) => {
                          if (each.stat === 'gone before the read') unlinkSync(path);
                          const next = seen.shift();
                          if (next === undefined) throw new Error('ENOENT');
                          return next;
                      };
            const response = await save(one, each.body, stat);
            expect(response.status).toBe(each.status ?? 200);
            const answered: unknown = await response.json();
            if (each.answer !== undefined) expect(answered).toEqual(each.answer);
            if (each.among !== undefined) expect(answered).toMatchObject(each.among as object);
        }
        if (row.absent !== undefined) expect(existsSync(one.file)).toBe(!row.absent);
        if (row.holds !== undefined) {
            const held = readFileSync(one.file);
            expect(held.equals(Buffer.from(row.holds))).toBe(true);
        }
        if (row.history !== undefined) {
            expect(existsSync(join(one.dir, 'history'))).toBe(row.history);
        }
        if (row.copies !== undefined) {
            expect(savesOf(join(one.dir, 'history'), realpathSync(one.file)).saves).toHaveLength(
                row.copies
            );
        }
        for (const [path, text] of Object.entries(row.made ?? {})) {
            expect(readFileSync(join(one.root.dir, path), 'utf8')).toBe(text);
        }
    });
});
