// The editor's languages: every name the highlighter registers answers the Shiki grammar the editor
// colours it with, checked against the grammars the installed shiki bundles.

import { bundledLanguages } from 'shiki';
import { describe, expect, it } from 'vitest';
import { SHIKI_LANGUAGES, shikiId } from '../../../../src/lib/ui/controls/editor/grammars.ts';
import { registered } from '../../../../src/lib/state/shared/words/languages.ts';

describe('the language map', () => {
    // Red when a name answers an id the installed shiki does not bundle.
    it('answers a grammar shiki bundles for each of the nineteen names, plaintext its own', () => {
        const names = registered();
        expect(names).toHaveLength(19);
        for (const name of names) {
            const id = shikiId(name);
            if (name === 'plaintext') expect(id).toBe('plaintext');
            else expect({ name, bundled: id in bundledLanguages }).toEqual({ name, bundled: true });
        }
    });

    // Red when one of the three names is looked up under oculus's spelling.
    it('maps the three names shiki spells otherwise, and the rest by their own name', () => {
        expect(shikiId('lisp')).toBe('common-lisp');
        expect(shikiId('makefile')).toBe('make');
        expect(shikiId('bash')).toBe('shellscript');
        expect(shikiId('python')).toBe('python');
        expect(shikiId('latex')).toBe('latex');
    });

    // Red when an unknown name, or a name on Object's prototype, answers anything but plaintext.
    it('answers plaintext for a name outside the nineteen', () => {
        expect(shikiId('cobol')).toBe('plaintext');
        expect(shikiId('')).toBe('plaintext');
        expect(shikiId('constructor')).toBe('plaintext');
    });

    // Red when a grammar is loaded twice or plaintext is asked of Shiki.
    it('loads the eighteen grammars once each, plaintext being the editor own', () => {
        expect(SHIKI_LANGUAGES).toHaveLength(18);
        expect(new Set(SHIKI_LANGUAGES).size).toBe(18);
        expect(SHIKI_LANGUAGES).not.toContain('plaintext');
    });
});
