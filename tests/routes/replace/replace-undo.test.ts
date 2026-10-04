// Layer 2, route tests. The undo and the redo of a replace: what POST /api/write with the kind
// `undo` (server/edit/writes/file-undo.ts) checks before it writes each file of a `replace` record
// back from the copy the replace kept, and what it records so that the redo is the same path.
//
// What this does NOT cover: the History view that issues the undo, which is the page's.
// @module-tag slow: every case runs ripgrep through the replace it undoes.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect } from 'vitest';
import { it } from '../../fixtures/scratch.ts';
import {
    hit,
    queryOf,
    records,
    replacePost,
    replaceWorld,
    stamps,
    undo,
    type ReplaceWorld
} from './replace-fixture.ts';

const text = (w: ReplaceWorld, name: string): string => readFileSync(join(w.hub, name), 'utf8');

/** A world whose two files were replaced by one request, and the record that request left. */
async function replaced() {
    const w = replaceWorld({ 'a.txt': 'foo a\n', 'b.txt': 'b foo\n' });
    const answer = await replacePost(w, {
        query: queryOf('foo'),
        replace: 'bar',
        items: [
            { root: 'hub', path: 'a.txt', hits: [hit(1, 0, 'foo')] },
            { root: 'hub', path: 'b.txt', hits: [hit(1, 2, 'foo')] }
        ]
    });
    expect(answer.body.ok).toBe(true);
    return { w, made: records(w)[0] };
}

describe('taking a replace back', () => {
    it('writes each file back from its copy and records the undo as a replace that can be taken back', async () => {
        const { w, made } = await replaced();
        expect([text(w, 'a.txt'), text(w, 'b.txt')]).toEqual(['bar a\n', 'b bar\n']);
        const answer = await undo(w, made.at);
        expect(answer.status).toBe(200);
        expect([text(w, 'a.txt'), text(w, 'b.txt')]).toEqual(['foo a\n', 'b foo\n']);
        const [reverse] = records(w);
        expect(reverse).toMatchObject({ field: 'replace', undoes: made.at, undo: 'file' });
        expect(stamps(reverse.before).map((one) => one.path)).toEqual([
            join(w.hub, 'a.txt'),
            join(w.hub, 'b.txt')
        ]);
    });
});
