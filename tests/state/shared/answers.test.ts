// Layer 2, client-state tests. The sentence a failed read is told in. Every store that fetches from
// the server says a refused or an unreadable answer through failedAnswer, so the bodies and the
// statuses are tried here once, and a store's own test holds the one case that shows it calls this.

import { describe, expect, it } from 'vitest';
import { OPS_REFUSALS } from '../../../src/lib/data/file-ops.ts';
import { LATEX_REFUSALS } from '../../../src/lib/data/prose/latex.ts';
import { failedAnswer, refusedAnswer } from '../../../src/lib/state/shared/answers/answers.ts';
import { setCatalog, t } from '../../../src/lib/state/shared/words/text.ts';
import { refused, unreadable } from '../../fixtures/client.ts';

// Every key answers with its own name and a placeholder for the status, so a word is held to its
// own key and no case reads the shipped configuration.
setCatalog(
    new Proxy({}, { get: (_catalog, key) => (typeof key === 'string' ? `${key} {0}` : undefined) })
);

describe('the sentence of a refusal word', () => {
    it('is the sentence of the word alone, whatever the status', () => {
        expect(refusedAnswer(404, 'outside')).toBe(t('files.refused_outside'));
        expect(refusedAnswer(500, 'outside')).toBe(t('files.refused_outside'));
    });

    it('is one sentence of its own for each word the file operations refuse with', () => {
        const sentences = OPS_REFUSALS.map((word) => refusedAnswer(400, word));
        expect(new Set(sentences).size).toBe(OPS_REFUSALS.length);
        expect(sentences).not.toContain(refused(400));
    });

    it('is one sentence of its own for each word the LaTeX endpoint refuses with', () => {
        const sentences = LATEX_REFUSALS.map((word) => refusedAnswer(400, word));
        expect(new Set(sentences).size).toBe(LATEX_REFUSALS.length);
        expect(sentences).not.toContain(refused(400));
    });
});

describe('the sentence of a failed read', () => {
    it('says the catalog sentence for an error that is a refusal word, and not the status', () => {
        expect(failedAnswer({ status: 404 }, { error: 'missing' })).toBe(
            t('files.refused_missing')
        );
    });

    it.each([
        ['an error that is a text of its own', { error: 'gone' }, 404],
        ['an error that is a number', { error: 3 }, 500]
    ])('says the refusal sentence with the status for %s', (_name, body, status) => {
        expect(failedAnswer({ status }, body)).toBe(refused(status));
    });

    it('says the unreadable sentence with the status for a body that is null or not JSON', () => {
        expect(failedAnswer({ status: 200 }, undefined)).toBe(unreadable(200));
        expect(failedAnswer({ status: 502 }, undefined)).toBe(unreadable(502));
    });
});
