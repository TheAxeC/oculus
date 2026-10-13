// Layer 1, data test. The order `languageOf` reads a map joined with the apps' languages in
// (data/helpers/files/languages.ts, apps/tools/languages.ts): the `languages:` map's whole name and
// extension first, then the apps' globs, then the apps' own endings.

import { describe, expect, it } from 'vitest';
import type { AppLanguage } from '../../../../src/lib/data/model/index.ts';
import { languageOf } from '../../../../src/lib/data/helpers/files/languages.ts';
import { joinLanguages } from '../../../../src/lib/data/helpers/files/apps/tools/languages.ts';

/** An app language with only the members a case sets. */
const language = (id: string, over: Partial<AppLanguage>): AppLanguage => ({
    id,
    aliases: [],
    extensions: [],
    filenames: [],
    filenamePatterns: [],
    firstLine: '',
    configuration: '',
    icon: null,
    ...over
});

describe('the language of a name in a map joined with apps', () => {
    const base = new Map([['.md', 'markdown']]);

    it('stays the one the `languages:` map gives when an app glob matches the same name', () => {
        const { map } = joinLanguages(base, [
            { app: 'app:notes', languages: [language('notes', { filenamePatterns: ['**/*.md'] })] }
        ]);
        expect([languageOf('a.md', map), languageOf('docs/b.md', map)]).toEqual([
            'markdown',
            'markdown'
        ]);
    });

    it('is the language of the app glob for a name the map does not decide', () => {
        const { map } = joinLanguages(base, [
            {
                app: 'app:notes',
                languages: [language('notes', { filenamePatterns: ['**/notes/*.txt'] })]
            }
        ]);
        expect([languageOf('notes/a.txt', map), languageOf('other/a.txt', map)]).toEqual([
            'notes',
            'plaintext'
        ]);
    });

    it('is decided by an app glob before an app ending', () => {
        const { map } = joinLanguages(base, [
            {
                app: 'app:notes',
                languages: [
                    language('plain-notes', { extensions: ['.txt'] }),
                    language('notes', { filenamePatterns: ['**/notes/*.txt'] })
                ]
            }
        ]);
        expect([languageOf('notes/a.txt', map), languageOf('other/a.txt', map)]).toEqual([
            'notes',
            'plain-notes'
        ]);
    });
});
