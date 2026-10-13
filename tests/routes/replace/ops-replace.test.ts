// Layer 2, route tests. POST /api/ops with the operation `replace`
// (server/files/fs/operations/replace.ts): what is written for the matches a request names, the
// order the checks refuse in, what a refused request leaves untouched, and the record a replace
// leaves in the change log.
//
// ripgrep is the real binary of the `@vscode/ripgrep` dependency, run over files in a scratch
// folder; the page's side (which hits a request names) is stood in for by the hits written in each
// case. What this does NOT cover: the undo (replace-undo.test.ts).
//
// The cases tagged slow run ripgrep; every other case runs in npm test. A hook loads the
// configuration once, since the first load costs more than a later one, so no case pays for it.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect } from 'vitest';
import { warmConfig } from '../edit/write-fixture.ts';
import { savesOf } from '../../../src/lib/server/files/fs/history.ts';
import { runSearch } from '../../../src/lib/server/files/search/search.ts';
import { emptyQuery } from '../../../src/lib/data/helpers/search/query.ts';
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
            expect(answer).toEqual({
                status: 200,
                body: {
                    ok: true,
                    paths: ['hub/a.txt'],
                    rereads: [
                        {
                            root: 'hub',
                            path: 'a.txt',
                            hits: [
                                {
                                    line: 1,
                                    column: 1,
                                    length: 3,
                                    text: 'foo bar',
                                    at: 0,
                                    was: { line: 1, at: 0, edited: true }
                                }
                            ]
                        }
                    ]
                }
            });
            expect(text(w, 'a.txt')).toBe('foo bar\n');
        }
    );
});

describe('what stops a replace', () => {
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
});
