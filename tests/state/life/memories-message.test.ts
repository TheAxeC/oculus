// The sentence a refused upload reads as, one case per word the endpoint answers with, the size the
// page refuses a file at before it reads one, and the wall the store holds for each shape of answer
// that GET /api/memories gives.
//
// The endpoint's own vocabulary (`name`, `data`, `unwritable`) never reaches the reader: each word
// has a sentence of its own in the catalog, and a word this does not know reads as the general one.
// The words are the engine's catalog, so a case asserts what the reader sees and not a copy of it.

import { afterEach, describe, expect, it, vi } from 'vitest';
import {
    MAX_UPLOAD_BYTES,
    MAX_UPLOAD_MB,
    tooLarge,
    uploadMessage
} from '../../../src/lib/state/life/memories.ts';
import { MAX_UPLOAD_BYTES as SERVER_LIMIT } from '../../../src/lib/server/content/memories.ts';
import { engineDir, loadConfig, textCatalog } from '../../../src/lib/data/sources/config.ts';
import { setCatalog } from '../../../src/lib/state/shared/words/text.ts';
import type { Wall } from '../../../src/lib/state/life/memories.svelte.ts';
import { createClientState } from '../../fixtures/client.ts';

const catalog = textCatalog(loadConfig(engineDir()).config);
setCatalog(catalog);

describe('the sentence one refusal reads as', () => {
    it('says nothing at all for a picture that was written', () => {
        expect(uploadMessage({ ok: true })).toBe('');
    });

    it('has a sentence of its own for every word the endpoint answers with', () => {
        expect(uploadMessage({ ok: false, error: 'name' })).toBe(catalog['memories.failed_name']);
        expect(uploadMessage({ ok: false, error: 'unwritable' })).toBe(
            catalog['memories.failed_file']
        );
        expect(uploadMessage({ ok: false, error: 'taken' })).toBe(catalog['memories.failed_taken']);
        expect(uploadMessage({ ok: false, error: 'data' })).toBe(
            catalog['memories.failed_data'].replace('{0}', String(MAX_UPLOAD_MB))
        );
    });

    it('says the request never arrived when the fetch itself failed', () => {
        expect(uploadMessage({ ok: false, network: true, error: 'anything' })).toBe(
            catalog['memories.failed_network']
        );
    });

    it('gives a word it does not know the general sentence, and draws no wire word', () => {
        for (const error of [
            '',
            'nonsense',
            'the body is not JSON',
            'no memories folder is configured'
        ]) {
            const said = uploadMessage({ ok: false, error });
            expect(said).toBe(catalog['memories.failed_other']);
            if (error !== '') expect(said).not.toContain(error);
        }
        expect(uploadMessage({ ok: false })).toBe(catalog['memories.failed_other']);
    });

    it('names no wire word in any of its sentences', () => {
        const sentences = [
            uploadMessage({ ok: false, error: 'name' }),
            uploadMessage({ ok: false, error: 'data' }),
            uploadMessage({ ok: false, error: 'unwritable' }),
            uploadMessage({ ok: false, error: 'taken' }),
            uploadMessage({ ok: false, error: 'nonsense' })
        ];
        for (const word of ['name', 'data', 'taken', 'unwritable']) {
            expect(sentences.filter((one) => one.split(/\W+/).includes(word))).toEqual([]);
        }
    });
});

describe('the size the page refuses at', () => {
    it('matches the server limit, so nothing is sent that the server would refuse', () => {
        expect(MAX_UPLOAD_BYTES).toBe(SERVER_LIMIT);
    });

    it('takes a file at the limit and refuses one past it', () => {
        expect(tooLarge(MAX_UPLOAD_BYTES)).toBe(false);
        expect(tooLarge(MAX_UPLOAD_BYTES + 1)).toBe(true);
        expect(tooLarge(0)).toBe(false);
    });
});

describe('the wall read from an answer of the wrong shape', () => {
    afterEach(() => vi.unstubAllGlobals());

    /** The wall once a fresh store has read one answer of GET /api/memories with this text. */
    async function wallOf(text: string, status = 200): Promise<Wall> {
        const client = createClientState();
        vi.stubGlobal('window', {});
        vi.stubGlobal('fetch', () => Promise.resolve(new Response(text, { status })));
        client.memories.wall();
        await vi.waitFor(() => expect(client.memories.wall().loading).toBe(false));
        return client.memories.wall();
    }
    const failed = (error: string): Wall => ({ images: [], error, loading: false });

    it.each(['{"images":{}}', '{"images":"x"}', '{"images":null}', '{}', '[]'])(
        'reads the answer %s as a failed read naming a list that is missing',
        async (text) => {
            expect(await wallOf(text)).toStrictEqual(failed('images_not_a_list'));
        }
    );

    it('reads a picture size that is not a whole number above zero as none, a text one included', async () => {
        const images = [
            { name: 'a', width: '5', height: '5' },
            { name: 'b', width: 5, height: 5, extra: 3 },
            { name: '', width: Infinity, height: 1 },
            { name: 'c', width: -1, height: 2 },
            { name: 'd', width: 2.5, height: 2 },
            { name: 'e', width: 5 }
        ];
        const none = { width: null, height: null };
        expect(await wallOf(JSON.stringify({ images }))).toStrictEqual({
            images: [
                { name: 'a', ...none },
                { name: 'b', width: 5, height: 5 },
                { name: '', width: null, height: null },
                { name: 'c', ...none },
                { name: 'd', ...none },
                { name: 'e', ...none }
            ],
            error: '',
            loading: false
        });
    });

    it.each([1e-20, 5e-324, 0.5])('reads a picture side of %s pixels as none', async (side) => {
        const text = `{"images":[{"name":"a","width":${side},"height":4}]}`;
        expect((await wallOf(text)).images).toStrictEqual([
            { name: 'a', width: null, height: null }
        ]);
    });

    it('keeps a whole number past the safe integers as the number it parses to', async () => {
        const wall = await wallOf('{"images":[{"name":"d","width":9007199254740993,"height":1}]}');
        expect(wall.images).toStrictEqual([{ name: 'd', width: 9007199254740992, height: 1 }]);
        expect(Object.keys(wall.images[0])).toEqual(['name', 'width', 'height']);
    });

    it.each([
        '{"images":[{"width":1}]}',
        '{"images":[3]}',
        '{"images":[null]}',
        '{"images":[[]]}',
        '{"images":[{"name":3}]}'
    ])(
        'reads the answer %s, an item with no text name, as one failed read of the whole wall',
        async (text) => {
            expect(await wallOf(text)).toStrictEqual(failed('image_without_name'));
        }
    );

    it('reads a refused request as the text of its error, an empty one kept, else its status', async () => {
        expect(await wallOf('{"error":"boom"}', 500)).toStrictEqual(failed('boom'));
        expect(await wallOf('{"error":""}', 500)).toStrictEqual(failed(''));
        for (const text of ['{"error":null}', '{}', '[]']) {
            expect(await wallOf(text, 500)).toStrictEqual(failed('500'));
        }
        expect(await wallOf('{"images":[{"name":"a"}],"error":"x"}', 404)).toStrictEqual(
            failed('x')
        );
    });

    it('reads a refusal whose error is a number as its status', async () => {
        expect(await wallOf('{"error":3}', 500)).toStrictEqual(failed('500'));
    });

    it('reads a body that is JSON null or is not JSON as a failed read carrying the status', async () => {
        for (const status of [200, 500]) {
            expect(await wallOf('null', status)).toStrictEqual(failed(String(status)));
            expect(await wallOf('not json', status)).toStrictEqual(failed(String(status)));
        }
    });

    it('reads a body that is JSON but no map as a list that is missing, or as a refusal by status', async () => {
        for (const text of ['[1]', '"x"', '7', 'true']) {
            expect(await wallOf(text)).toStrictEqual(failed('images_not_a_list'));
            expect(await wallOf(text, 500)).toStrictEqual(failed('500'));
        }
    });
});
