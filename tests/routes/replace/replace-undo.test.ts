// Layer 4, route test. The undo and the redo of a replace: what POST /api/write with the kind
// `undo` (server/edit/writes/file-undo.ts) checks before it writes each file of a `replace` record
// back from the copy the replace kept, and what it records so that the redo is the same path.
//
// What this does NOT cover: the History view that issues the undo, which is the page's.

import { readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect } from 'vitest';
import { handleHistory, savesOf } from '../../../src/lib/server/files/fs/history.ts';
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

    it('writes the replaced text back when the undo is taken back', async () => {
        const { w, made } = await replaced();
        await undo(w, made.at);
        const [reverse] = records(w);
        const redo = await undo(w, reverse.at);
        expect(redo.status).toBe(200);
        expect([text(w, 'a.txt'), text(w, 'b.txt')]).toEqual(['bar a\n', 'b bar\n']);
    });

    it('refuses `moved` after a later edit of one file, and writes neither file', async () => {
        const { w, made } = await replaced();
        writeFileSync(join(w.hub, 'b.txt'), 'b bar and more\n');
        expect(await undo(w, made.at)).toEqual({ status: 409, body: { error: 'moved' } });
        expect([text(w, 'a.txt'), text(w, 'b.txt')]).toEqual(['bar a\n', 'b bar and more\n']);
    });

    it('says `gone` for a file that is no longer there and `copy-gone` for a copy the history lost', async () => {
        const gone = await replaced();
        rmSync(join(gone.w.hub, 'a.txt'));
        expect((await undo(gone.w, gone.made.at)).body).toEqual({ error: 'gone' });
        const lost = await replaced();
        const history = lost.w.ops.history ?? '';
        rmSync(history, { recursive: true, force: true });
        expect((await undo(lost.w, lost.made.at)).body).toEqual({ error: 'copy-gone' });
        expect([text(lost.w, 'a.txt'), text(lost.w, 'b.txt')]).toEqual(['bar a\n', 'b bar\n']);
    });

    it("lists the copy a replace kept under the kind `replace` in the file's history", async () => {
        const { w } = await replaced();
        const history = w.ops.history ?? '';
        const url = new URL('http://localhost/api/history?root=hub&path=a.txt');
        const listed = (await handleHistory(url, w.ops.roots, history).json()) as {
            saves: { id: string; kind: string }[];
        };
        expect(listed.saves.map((one) => one.kind)).toEqual(['replace']);
        const copy = new URL(`${url.toString()}&id=${listed.saves[0].id}`);
        const body = (await handleHistory(copy, w.ops.roots, history).json()) as {
            content: string;
        };
        expect(body.content).toBe('foo a\n');
        expect(savesOf(history, join(w.hub, 'a.txt')).saves).toHaveLength(1);
    });
});
