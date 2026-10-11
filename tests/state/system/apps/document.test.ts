// Layer 2, client state test. The bytes of the file a custom editor was opened on
// (lib/state/system/apps/frame/documents.ts): `document.read`, `document.save` and `document.dirty`
// over the calls of the document route. These are the custom editor's save rows of G77 on the
// page's side: a save while a source tab of the same file holds unsaved text is refused and sends
// nothing, a file changed on disk since it was read is saved over only when the reader says yes,
// and the dirty mark follows the editor's flag.
//
// The route is a double that answers as tests/routes/apps/app-document.test.ts shows it does. What
// this does NOT cover: the route's own checks and the question's dialog.

import { describe, expect, vi } from 'vitest';
import { fromBase64, toBase64 } from '../../../../src/lib/state/system/apps/frame/bytes.ts';
import { createDocument } from '../../../../src/lib/state/system/apps/frame/documents.ts';
import type { Posted } from '../../../../src/lib/state/shared/stores/shapes.ts';
import { it } from '../../../fixtures/scratch.ts';
import { installRealText } from '../../../views/shared/real-text.ts';

installRealText();

const FILE = { root: 'one', path: 'data.json' };

const answer = (body: Record<string, unknown>, status = 200): Posted => ({
    ok: status === 200,
    status,
    body,
    failed: ''
});

type Reply = { read?: Record<string, unknown>; saves?: Record<string, unknown>[] };

/** A document over a route that answers the read and then each save in turn. */
function document(reply: Reply = {}, unsaved = false, yes = true) {
    const gets: string[] = [];
    const posts: Record<string, unknown>[] = [];
    const questions: string[] = [];
    const marks: boolean[] = [];
    const saves = [...(reply.saves ?? [{ ok: true, hash: 'h2' }])];
    const doc = createDocument({
        app: 'app:notes',
        title: () => 'Notes',
        file: FILE,
        get: (address) => {
            gets.push(address);
            return Promise.resolve(
                new Response(
                    JSON.stringify(
                        reply.read ?? {
                            ok: true,
                            content: toBase64(new Uint8Array([1, 2])),
                            hash: 'h1'
                        }
                    )
                )
            );
        },
        post: vi.fn((_path: string, body: unknown) => {
            posts.push(body as Record<string, unknown>);
            return Promise.resolve(answer(saves.shift() ?? { ok: true, hash: 'h9' }));
        }),
        unsaved: () => unsaved,
        ask: (question) => {
            questions.push(question.message);
            return Promise.resolve(yes);
        },
        mark: (flag) => void marks.push(flag)
    });
    return { doc, gets, posts, questions, marks };
}

describe('the bytes of the file a custom editor was opened on', () => {
    it('are read from the route with the app, the root and the path', async () => {
        const { doc, gets } = document();
        const read = await doc.read();
        expect(read).toEqual({ ok: true, value: new Uint8Array([1, 2]) });
        expect(gets).toEqual(['/api/app-document?app=app%3Anotes&root=one&path=data.json']);
    });

    it('are refused with the word the route gave', async () => {
        const { doc } = document({ read: { ok: false, word: 'closed' } });
        expect(await doc.read()).toEqual({ ok: false, word: 'closed' });
    });
});

describe('a save of the document', () => {
    it('sends the bytes as base64 over the hash of the bytes last read', async () => {
        const { doc, posts } = document();
        await doc.read();
        const saved = await doc.save(new Uint8Array([7, 8, 9]));
        expect(saved).toEqual({ ok: true, value: null });
        expect(posts).toEqual([
            {
                app: 'app:notes',
                ...FILE,
                base: 'h1',
                content: toBase64(new Uint8Array([7, 8, 9]))
            }
        ]);
        expect(fromBase64(posts[0].content as string)).toEqual(new Uint8Array([7, 8, 9]));
    });

    it('sends the hash a save answered as the base of the next', async () => {
        const { doc, posts } = document({
            saves: [
                { ok: true, hash: 'h2' },
                { ok: true, hash: 'h3' }
            ]
        });
        await doc.read();
        await doc.save(new Uint8Array([1]));
        await doc.save(new Uint8Array([2]));
        expect(posts.map((one) => one.base)).toEqual(['h1', 'h2']);
    });

    it('is refused `refused:unsaved` and sends nothing while a source tab of the file holds unsaved text', async () => {
        const { doc, posts, questions } = document({}, true);
        await doc.read();
        expect(await doc.save(new Uint8Array([1]))).toEqual({ ok: false, word: 'refused:unsaved' });
        expect([posts, questions]).toEqual([[], []]);
    });

    it('asks before it saves over a file that changed on disk, and saves over the current one on yes', async () => {
        const { doc, posts, questions } = document({
            saves: [
                { ok: false, word: 'changed' },
                { ok: true, hash: 'h5' }
            ],
            read: { ok: true, content: '', hash: 'h4' }
        });
        await doc.read();
        const saved = await doc.save(new Uint8Array([1]));
        expect(saved).toEqual({ ok: true, value: null });
        expect(questions).toEqual([
            'The app Notes saves data.json, which changed on disk since it was opened. Replace it?'
        ]);
        expect(posts.map((one) => one.base)).toEqual(['h4', 'h4']);
    });

    it('is declined on no, and the second send is never made', async () => {
        const { doc, posts } = document({ saves: [{ ok: false, word: 'changed' }] }, false, false);
        await doc.read();
        expect(await doc.save(new Uint8Array([1]))).toEqual({ ok: false, word: 'declined' });
        expect(posts).toHaveLength(1);
    });

    it('answers a refusal of the route as it is', async () => {
        const { doc } = document({ saves: [{ ok: false, word: 'readonly' }] });
        await doc.read();
        expect(await doc.save(new Uint8Array([1]))).toEqual({ ok: false, word: 'readonly' });
    });
});

describe('the dirty mark of the editor', () => {
    it('follows the flag the editor sets', () => {
        const { doc, marks } = document();
        doc.dirty(true);
        doc.dirty(false);
        expect(marks).toEqual([true, false]);
    });
});
