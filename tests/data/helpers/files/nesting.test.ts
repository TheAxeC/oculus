// Layer 1, data tests. File nesting (data/helpers/files/nesting.ts) over the shipped defaults of
// config/catalogs/file-nesting.yml: the finding each drop gives, in its catalog sentence and on its
// key (data/sources/config/catalog/nesting.ts).

import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { engineDir, loadConfig } from '../../../../src/lib/data/sources/config.ts';
import { nestingFindings } from '../../../../src/lib/data/sources/config/catalog/nesting.ts';

describe('the findings', () => {
    const ENGINE = engineDir();
    const FILE = join(ENGINE, 'config', 'catalogs', 'file-nesting.yml');
    const { text } = loadConfig(ENGINE).config;

    it('says each dropped pattern in the sentence of its kind, on its own key', () => {
        const patterns = { 'a/b': ['x'], 'ok.ts': ['${capture}.js'], 'text.ts': '${capture}.js' };
        expect(nestingFindings(ENGINE, { text, patterns })).toEqual([
            {
                file: FILE,
                key: 'patterns.a/b',
                message:
                    'pattern a/b has no usable parent name (empty, or holding a slash); the pattern is not read'
            },
            {
                file: FILE,
                key: 'patterns.text.ts',
                message:
                    'pattern text.ts does not name its nested files as a list of non-empty texts; the pattern is not read'
            }
        ]);
    });
});
