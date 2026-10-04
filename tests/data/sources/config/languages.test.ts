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
});
