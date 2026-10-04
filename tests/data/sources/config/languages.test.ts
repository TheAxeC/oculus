// Layer 1, data tests. The findings over the `languages:` map of config/sources.yml: one sentence
// for each entry, language or ending the reader drops, each naming the key it is about, in the
// words of the findings catalog. Findings are compared whole, in order, with the file each names.

import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
    engineDir,
    languageFindings,
    loadConfig
} from '../../../../src/lib/data/sources/config.ts';

const ENGINE = engineDir();
const SOURCES = join(ENGINE, 'config', 'sources.yml');

/** A merged config holding the shipped sentences and this `languages:` value. */
function configWith(languages?: unknown): Record<string, unknown> {
    const { text } = loadConfig(ENGINE).config;
    return languages === undefined ? { text } : { text, languages };
}

/** The finding for a key of sources.yml. */
function finding(key: string, message: string) {
    return { file: SOURCES, key, message };
}

describe('languageFindings', () => {
    it('reports nothing for a config without the key', () => {
        expect(languageFindings(ENGINE, configWith())).toStrictEqual([]);
    });

    it.each([
        ['a list', ['python']],
        ['text', 'python'],
        ['null', null]
    ])('reports one finding for a key that is %s', (_label, value) => {
        expect(languageFindings(ENGINE, configWith(value))).toStrictEqual([
            finding(
                'languages',
                'languages is not a map of language name to a list of endings; every file opens as plain text'
            )
        ]);
    });

    it('reports a language whose value is not a list, and keeps reading the others', () => {
        expect(
            languageFindings(ENGINE, configWith({ python: '.py', bash: ['.sh'], r: null }))
        ).toStrictEqual([
            finding(
                'languages.python',
                'language python is not a list of endings; its endings are not read'
            ),
            finding('languages.r', 'language r is not a list of endings; its endings are not read')
        ]);
    });

    it('reports an ending that is not a file name or an extension of one dot', () => {
        expect(
            languageFindings(
                ENGINE,
                configWith({ python: ['.py', '.tar.gz', 'src/Makefile', ''], r: [3] })
            )
        ).toStrictEqual([
            finding(
                'languages.python',
                'language python lists .tar.gz, which is not a file name or an extension with one dot; the entry is not read'
            ),
            finding(
                'languages.python',
                'language python lists src/Makefile, which is not a file name or an extension with one dot; the entry is not read'
            ),
            finding('languages.python', 'language python lists an empty file name'),
            finding(
                'languages.r',
                'language r lists 3, which is not a file name or an extension with one dot; the entry is not read'
            )
        ]);
    });

    it('reports a language the editor does not colour, by the name as written', () => {
        expect(
            languageFindings(
                ENGINE,
                configWith({ cobol: ['.cbl'], Python: ['.py'], python: ['.pyw'] })
            )
        ).toStrictEqual([
            finding(
                'languages.cobol',
                'language cobol is not one the editor colours; its endings are not read'
            ),
            finding(
                'languages.Python',
                'language Python is not one the editor colours; its endings are not read'
            )
        ]);
    });

    it('reports an ending two languages claim, naming it and both languages', () => {
        expect(
            languageFindings(ENGINE, configWith({ c: ['.h'], cpp: ['.H', '.hpp'] }))
        ).toStrictEqual([
            finding('languages.cpp', 'ending .h is listed under c and under cpp; c keeps it')
        ]);
    });

    it('reports nothing for an ending one language lists twice', () => {
        expect(languageFindings(ENGINE, configWith({ python: ['.py', '.py'] }))).toStrictEqual([]);
    });
});
