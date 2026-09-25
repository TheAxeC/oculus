// The sentence a refused upload reads as, one case per word the endpoint answers with, and the size
// the page refuses a file at before it reads one.
//
// The endpoint's own vocabulary (`name`, `data`, `unwritable`) never reaches the reader: each word
// has a sentence of its own in the catalog, and a word this does not know reads as the general one.
// The words are the engine's catalog, so a case asserts what the reader sees and not a copy of it.

import { describe, expect, it } from 'vitest';
import {
    MAX_UPLOAD_BYTES,
    MAX_UPLOAD_MB,
    tooLarge,
    uploadMessage
} from '../../../../src/lib/state/feeds/life/memories.ts';
import { MAX_UPLOAD_BYTES as SERVER_LIMIT } from '../../../../src/lib/server/content/memories.ts';
import { engineDir, loadConfig, textCatalog } from '../../../../src/lib/data/sources/config.ts';
import { setCatalog } from '../../../../src/lib/state/words/text.ts';

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
