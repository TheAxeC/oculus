// Layer 2, route tests. POST /api/ops with the operation `replace` (server/files/fs/replace.ts):
// what is written for the matches a request names, the order the checks refuse in, what a refused
// request leaves untouched, and the record a replace leaves in the change log.
//
// ripgrep is the real binary of the `@vscode/ripgrep` dependency, run over files in a scratch
// folder; the page's side (which hits a request names) is stood in for by the hits written in each
// case. What this does NOT cover: the replace text as typed (tests/data/helpers/replace.test.ts),
// the preview (preview.test.ts) and the undo (replace-undo.test.ts).
//
// The cases tagged slow run ripgrep, except the one that refuses empty items, which takes 100 ms or
// more; every other case runs in npm test. A hook loads the configuration once, since the first
// load costs more than a later one, so no case pays for it.

import { chmodSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect } from 'vitest';
import { warmConfig } from '../edit/write-fixture.ts';
import { SAVE_MAX_BYTES, savesOf } from '../../../src/lib/server/files/fs/history.ts';
import { runSearch } from '../../../src/lib/server/files/search.ts';
import { emptyQuery } from '../../../src/lib/data/helpers/search/query.ts';
import { matchOf } from '../../../src/lib/state/sources/search/search.ts';
import { it, test } from '../../fixtures/scratch.ts';
import {
    hit,
    queryOf,
    records,
    replacePost,
    replaceWorld,
    stamps,
    TIMEOUT
} from './replace-fixture.ts';

const text = (w: { hub: string }, name: string): string => readFileSync(join(w.hub, name), 'utf8');

test.beforeAll(warmConfig);

describe('what a replace writes', () => {
    it(
        'replaces the second of two matches on one line and leaves the first',
        { tags: ['slow'] },
        async () => {
            const w = replaceWorld({ 'a.txt': 'foo foo\n' });
            const found = await runSearch(
                w.ops.roots,
                { ...emptyQuery(500), q: 'foo', root: 'hub' },
                {
                    timeout: TIMEOUT
                }
            );
            expect(found.ok && found.answer.files[0].hits.map((one) => one.at)).toEqual([0, 4]);
            const answer = await replacePost(w, {
                query: queryOf('foo'),
                replace: 'bar',
                items: [{ root: 'hub', path: 'a.txt', hits: [hit(1, 4, 'foo')] }]
            });
            expect(answer).toEqual({ status: 200, body: { ok: true, paths: ['hub/a.txt'] } });
            expect(text(w, 'a.txt')).toBe('foo bar\n');
        }
    );

    it('replaces every match a request names, in several files', { tags: ['slow'] }, async () => {
        const w = replaceWorld({ 'a.txt': 'foo foo\nfoo\n', 'd/b.txt': 'x foo\n' });
        const answer = await replacePost(w, {
            query: queryOf('foo'),
            replace: 'bar',
            items: [
                {
                    root: 'hub',
                    path: 'a.txt',
                    hits: [hit(1, 0, 'foo'), hit(1, 4, 'foo'), hit(2, 0, 'foo')]
                },
                { root: 'hub', path: 'd/b.txt', hits: [hit(1, 2, 'foo')] }
            ]
        });
        expect(answer.body).toEqual({ ok: true, paths: ['hub/a.txt', 'hub/d/b.txt'] });
        expect(text(w, 'a.txt')).toBe('bar bar\nbar\n');
        expect(text(w, 'd/b.txt')).toBe('x bar\n');
    });

    it(
        'reads $1 and \\U of a regular expression from the groups ripgrep reports',
        { tags: ['slow'] },
        async () => {
            const w = replaceWorld({ 'a.txt': 'foo ab\n' });
            await replacePost(w, {
                query: queryOf('f(o)o|(\\w+)', { regex: true }),
                replace: '[$1]',
                items: [{ root: 'hub', path: 'a.txt', hits: [hit(1, 0, 'foo')] }]
            });
            expect(text(w, 'a.txt')).toBe('[o] ab\n');
            await replacePost(w, {
                query: queryOf('(\\w+)$', { regex: true }),
                replace: '\\U$1',
                items: [{ root: 'hub', path: 'a.txt', hits: [hit(1, 4, 'ab')] }]
            });
            expect(text(w, 'a.txt')).toBe('[o] AB\n');
        }
    );

    it(
        'counts the place of a match in UTF-16 units on a line with multibyte letters',
        { tags: ['slow'] },
        async () => {
            const w = replaceWorld({ 'a.txt': '\u00e9 foo foo\n', 'b.txt': '\u{1F600} foo foo\n' });
            const found = await runSearch(
                w.ops.roots,
                { ...emptyQuery(500), q: 'foo', root: 'hub' },
                {
                    timeout: TIMEOUT
                }
            );
            const places = found.ok
                ? Object.fromEntries(
                      found.answer.files.map((one) => [one.path, one.hits.map((h) => h.at)])
                  )
                : {};
            expect(places).toEqual({ 'a.txt': [2, 6], 'b.txt': [3, 7] });
            const answer = await replacePost(w, {
                query: queryOf('foo'),
                replace: 'bar',
                items: [
                    { root: 'hub', path: 'a.txt', hits: [hit(1, 6, 'foo')] },
                    { root: 'hub', path: 'b.txt', hits: [hit(1, 7, 'foo')] }
                ]
            });
            expect(answer.body.ok).toBe(true);
            expect(text(w, 'a.txt')).toBe('\u00e9 foo bar\n');
            expect(text(w, 'b.txt')).toBe('\u{1F600} foo bar\n');
        }
    );

    it(
        'replaces a match longer than a hit row is wide, from the whole text the page keeps',
        { tags: ['slow'] },
        async () => {
            const long = 'x'.repeat(300);
            const w = replaceWorld({ 'a.txt': `a ${long} b\n` });
            const found = await runSearch(
                w.ops.roots,
                { ...emptyQuery(500), q: 'x+', regex: true, root: 'hub' },
                {
                    timeout: TIMEOUT
                }
            );
            expect(found.ok).toBe(true);
            const row = found.ok ? found.answer.files[0].hits[0] : undefined;
            expect(row && matchOf(row)).toBe(long);
            const answer = await replacePost(w, {
                query: queryOf('x+', { regex: true }),
                replace: 'Y',
                items: [{ root: 'hub', path: 'a.txt', hits: [hit(1, 2, long)] }]
            });
            expect(answer.body.ok).toBe(true);
            expect(text(w, 'a.txt')).toBe('a Y b\n');
        }
    );
});

describe('what stops a replace', () => {
    it(
        'refuses `changed` when the line changed since the run, keeps the files before it and writes none after',
        { tags: ['slow'] },
        async () => {
            const w = replaceWorld({ 'a.txt': 'foo\n', 'b.txt': 'foo\n', 'c.txt': 'foo\n' });
            writeFileSync(join(w.hub, 'b.txt'), 'bar foo\n');
            const answer = await replacePost(w, {
                query: queryOf('foo'),
                replace: 'X',
                items: ['a', 'b', 'c'].map((name) => ({
                    root: 'hub',
                    path: `${name}.txt`,
                    hits: [hit(1, 0, 'foo')]
                }))
            });
            expect(answer).toEqual({
                status: 400,
                body: { ok: false, error: 'changed', done: ['hub/a.txt'], failed: 'hub/b.txt' }
            });
            expect([text(w, 'a.txt'), text(w, 'b.txt'), text(w, 'c.txt')]).toEqual([
                'X\n',
                'bar foo\n',
                'foo\n'
            ]);
        }
    );

    it(
        'refuses `changed` when the text at the place is no longer the text that was found',
        { tags: ['slow'] },
        async () => {
            const w = replaceWorld({ 'a.txt': 'fooo\n' });
            const answer = await replacePost(w, {
                query: queryOf('fo+', { regex: true }),
                replace: 'X',
                items: [{ root: 'hub', path: 'a.txt', hits: [hit(1, 0, 'foo')] }]
            });
            expect(answer.body).toMatchObject({ error: 'changed', done: [], failed: 'hub/a.txt' });
            expect(text(w, 'a.txt')).toBe('fooo\n');
        }
    );

    it('refuses `denied` for a file its mode locks, and writes nothing', async () => {
        const w = replaceWorld({ 'a.txt': 'foo\n' });
        chmodSync(join(w.hub, 'a.txt'), 0o444);
        const answer = await replacePost(w, {
            query: queryOf('foo'),
            replace: 'X',
            items: [{ root: 'hub', path: 'a.txt', hits: [hit(1, 0, 'foo')] }]
        });
        chmodSync(join(w.hub, 'a.txt'), 0o644);
        expect(answer.body).toMatchObject({ error: 'denied', failed: 'hub/a.txt' });
        expect(text(w, 'a.txt')).toBe('foo\n');
    });

    it("refuses `protected` for the machine's local file of the engine root, which it never opens", async () => {
        const w = replaceWorld({ 'a.txt': 'foo\n' });
        const before = readFileSync(join(w.engine, 'local.yml'), 'utf8');
        const answer = await replacePost(w, {
            query: queryOf('needle'),
            replace: 'X',
            items: [{ root: 'engine', path: 'local.yml', hits: [hit(2, 0, 'needle')] }]
        });
        expect(answer.body).toMatchObject({ error: 'protected', failed: 'engine/local.yml' });
        expect(readFileSync(join(w.engine, 'local.yml'), 'utf8')).toBe(before);
    });

    it('refuses `marker` for a file holding a private-use marker, and for a replace text holding one', async () => {
        const w = replaceWorld({ 'a.txt': 'foo \ue000\n', 'b.txt': 'foo\n' });
        const inFile = await replacePost(w, {
            query: queryOf('foo'),
            replace: 'X',
            items: [{ root: 'hub', path: 'a.txt', hits: [hit(1, 0, 'foo')] }]
        });
        expect(inFile.body).toMatchObject({ error: 'marker', failed: 'hub/a.txt' });
        expect(text(w, 'a.txt')).toBe('foo \ue000\n');
        const inText = await replacePost(w, {
            query: queryOf('foo'),
            replace: 'a\ue002b',
            items: [{ root: 'hub', path: 'b.txt', hits: [hit(1, 0, 'foo')] }]
        });
        expect(inText).toEqual({ status: 400, body: { ok: false, error: 'marker' } });
        expect(text(w, 'b.txt')).toBe('foo\n');
    });

    it(
        'refuses `too_large` for a file over what the history keeps, and for a result over it',
        { tags: ['slow'] },
        async () => {
            const big = 'foo\n'.repeat(70000);
            const near = `foo${'.'.repeat(SAVE_MAX_BYTES - 40000)}\n`;
            const w = replaceWorld({ 'big.txt': big, 'near.txt': near });
            expect(big.length).toBeGreaterThan(SAVE_MAX_BYTES);
            const over = await replacePost(w, {
                query: queryOf('foo'),
                replace: 'X',
                items: [{ root: 'hub', path: 'big.txt', hits: [hit(1, 0, 'foo')] }]
            });
            expect(over.body).toMatchObject({ error: 'too_large', failed: 'hub/big.txt' });
            const grows = await replacePost(w, {
                query: queryOf('foo'),
                replace: 'Y'.repeat(50000),
                items: [{ root: 'hub', path: 'near.txt', hits: [hit(1, 0, 'foo')] }]
            });
            expect(grows.body).toMatchObject({ error: 'too_large', failed: 'hub/near.txt' });
            expect(text(w, 'big.txt')).toBe(big);
            expect(text(w, 'near.txt')).toBe(near);
        }
    );

    it('refuses `binary`, `missing` and `outside` by file', async () => {
        const w = replaceWorld({ 'bin.dat': Buffer.from([102, 111, 111, 0, 1, 2]) });
        const refuse = async (root: string, path: string) =>
            (
                await replacePost(w, {
                    query: queryOf('foo'),
                    replace: 'X',
                    items: [{ root, path, hits: [hit(1, 0, 'foo')] }]
                })
            ).body.error;
        expect(await refuse('hub', 'bin.dat')).toBe('binary');
        expect(await refuse('hub', 'none.txt')).toBe('missing');
        expect(await refuse('hub', '../elsewhere.txt')).toBe('outside');
        expect(await refuse('nope', 'a.txt')).toBe('outside');
    });

    it(
        'refuses a pattern ripgrep rejects as `search-failed`, and a target with no timeout the same',
        { tags: ['slow'] },
        async () => {
            const w = replaceWorld({ 'a.txt': 'foo(\n' });
            const bad = await replacePost(w, {
                query: queryOf('fo(', { regex: true }),
                replace: 'X',
                items: [{ root: 'hub', path: 'a.txt', hits: [hit(1, 0, 'fo')] }]
            });
            expect(bad.body).toMatchObject({ error: 'search-failed' });
            expect(text(w, 'a.txt')).toBe('foo(\n');
            w.ops.searchTimeout = undefined;
            const none = await replacePost(w, {
                query: queryOf('foo'),
                replace: 'X',
                items: [{ root: 'hub', path: 'a.txt', hits: [hit(1, 0, 'foo')] }]
            });
            expect(none.body).toMatchObject({ error: 'search-failed' });
        }
    );
});

describe('a request that is no replace', () => {
    const base = { query: queryOf('foo'), replace: 'X', preserveCase: false };
    const forged = async (items: unknown) => {
        const w = replaceWorld({ 'a.txt': 'foo foo\n' });
        const answer = await replacePost(w, { op: 'replace', ...base, items });
        return { answer, text: text(w, 'a.txt'), changes: records(w) };
    };

    it(
        'refuses empty items, empty hits, a file named twice and a hit named twice as not-an-action',
        { tags: ['slow'] },
        async () => {
            const one = hit(1, 0, 'foo');
            const file = { root: 'hub', path: 'a.txt' };
            const cases: unknown[] = [
                [],
                [{ ...file, hits: [] }],
                [
                    { ...file, hits: [one] },
                    { ...file, hits: [hit(1, 4, 'foo')] }
                ],
                [{ ...file, hits: [one, one] }]
            ];
            for (const items of cases) {
                const held = await forged(items);
                expect(held.answer.body.error).toBe('not-an-action');
                expect(held.text).toBe('foo foo\n');
                expect(held.changes).toEqual([]);
            }
        }
    );

    it('refuses a body that is no operation at all as not-an-action', async () => {
        const w = replaceWorld({ 'a.txt': 'foo\n' });
        const answer = await replacePost(w, { op: 'replace', query: 'foo', items: 3 });
        expect(answer).toEqual({ status: 400, body: { error: 'not-an-action' } });
    });

    it('refuses an empty pattern as bad-query', async () => {
        const w = replaceWorld({ 'a.txt': 'foo\n' });
        const answer = await replacePost(w, {
            query: queryOf(''),
            replace: 'X',
            items: [{ root: 'hub', path: 'a.txt', hits: [hit(1, 0, 'foo')] }]
        });
        expect(answer.body).toEqual({ ok: false, error: 'bad-query' });
        expect(text(w, 'a.txt')).toBe('foo\n');
    });
});

describe('what a replace records', () => {
    it(
        'appends one files record naming each file, its kept copy and the file as it is',
        { tags: ['slow'] },
        async () => {
            const w = replaceWorld({ 'a.txt': 'foo\n', 'b.txt': 'foo\n' });
            await replacePost(w, {
                query: queryOf('foo'),
                replace: 'bar',
                items: ['a', 'b'].map((name) => ({
                    root: 'hub',
                    path: `${name}.txt`,
                    hits: [hit(1, 0, 'foo')]
                }))
            });
            const all = records(w);
            expect(all).toHaveLength(1);
            expect(all[0]).toMatchObject({ kind: 'files', field: 'replace', undo: 'file' });
            const [before, after] = [stamps(all[0].before), stamps(all[0].after)];
            expect(before.map((one) => one.path)).toEqual([
                join(w.hub, 'a.txt'),
                join(w.hub, 'b.txt')
            ]);
            expect(after.map((one) => one.path)).toEqual(before.map((one) => one.path));
            for (const one of before) expect(one.kept).toEqual(expect.any(String));
            expect(savesOf(w.ops.history ?? '', join(w.hub, 'a.txt')).saves).toMatchObject([
                { kind: 'replace' }
            ]);
        }
    );

    it(
        'records the files done before a refusal, and records nothing when the first is refused',
        { tags: ['slow'] },
        async () => {
            const w = replaceWorld({ 'a.txt': 'foo\n', 'b.txt': 'zzz\n' });
            const items = ['a', 'b'].map((name) => ({
                root: 'hub',
                path: `${name}.txt`,
                hits: [hit(1, 0, 'foo')]
            }));
            await replacePost(w, { query: queryOf('foo'), replace: 'X', items });
            expect(stamps(records(w)[0].after).map((one) => one.path)).toEqual([
                join(w.hub, 'a.txt')
            ]);
            const again = replaceWorld({ 'b.txt': 'zzz\n' });
            await replacePost(again, { query: queryOf('foo'), replace: 'X', items: [items[1]] });
            expect(records(again)).toEqual([]);
            expect(existsSync(join(again.hub, 'b.txt'))).toBe(true);
        }
    );
});
