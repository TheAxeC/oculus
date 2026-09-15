// The sentence a refused mute reads as, one case per word the endpoint answers with.
//
// The endpoint's own vocabulary (`invalid`, `unwritable`) never reaches the reader: each word has a
// sentence of its own in the catalog, and a word this does not know reads as the general one, which
// is DESIGN.md's rule for the deck write applied to the audit's mute.

import { describe, expect, it } from 'vitest';
import { muteMessage } from '../../src/lib/state/audit.ts';
import { engineDir, loadConfig, textCatalog } from '../../src/lib/data/sources/config.ts';
import { setCatalog } from '../../src/lib/state/text.ts';

const catalog = textCatalog(loadConfig(engineDir()).config);
setCatalog(catalog);

describe('the sentence one refused mute reads as', () => {
    it('says nothing at all for a mute that was written', () => {
        expect(muteMessage({ ok: true })).toBe('');
    });

    it('has a sentence of its own for every word the endpoint answers with', () => {
        expect(muteMessage({ ok: false, error: 'invalid' })).toBe(catalog['audit.failed_invalid']);
        expect(muteMessage({ ok: false, error: 'unwritable' })).toBe(catalog['audit.failed_file']);
    });

    it('says the request never arrived when the fetch itself failed', () => {
        expect(muteMessage({ ok: false, network: true, error: 'invalid' })).toBe(
            catalog['audit.failed_network']
        );
    });

    it('gives a word it does not know the general sentence, and draws no wire word', () => {
        for (const error of ['', 'nonsense', 'the body is not a write this route knows']) {
            const said = muteMessage({ ok: false, error });
            expect(said).toBe(catalog['audit.failed_other']);
            if (error !== '') expect(said).not.toContain(error);
        }
        expect(muteMessage({ ok: false })).toBe(catalog['audit.failed_other']);
    });

    it('names no wire word in any of its sentences', () => {
        const sentences = [
            muteMessage({ ok: false, error: 'invalid' }),
            muteMessage({ ok: false, error: 'unwritable' }),
            muteMessage({ ok: false, error: 'nonsense' })
        ];
        for (const word of ['invalid', 'unwritable']) {
            expect(sentences.filter((one) => one.split(/\W+/).includes(word))).toEqual([]);
        }
    });
});
