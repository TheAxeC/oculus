// Layer 4, tree check. The catalog files' keys have readers: every top-level key of a file under
// config/catalogs/ is named outside a comment by a module or component under src, as a property or
// a quoted string, the catalog files' shapes left out since they name every key, or is drawn as a
// `foreign_key: vocab.<key>` list by a shipped schema or a template of docs/templates.md. A key
// whose name is a common word is read by any property of that name, which a check by name cannot
// tell apart.

import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';
import { engineDir } from '../../../src/lib/data/sources/config.ts';
import { CATALOGS, SCHEMAS } from '../../../src/lib/state/system/config/config-files.ts';
import { withoutComments } from './code.ts';
import { treeFiles } from '../walk.ts';

const SRC = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', 'src');

/** The folder of the catalog files' shapes, relative to src, whose keys name every catalog key. */
const SHAPES_DIR = 'lib/data/shapes/catalog-files/';

/**
 * The code of every module and component under src that may read a catalog file's key, the shapes
 * left out, each with its comments turned to spaces, so a key named only in a comment is not read.
 */
function keyReaderCode(): string[] {
    return treeFiles(SRC)
        .filter((rel) => /\.(ts|svelte|js|mjs|cjs)$/.test(rel) && !rel.startsWith(SHAPES_DIR))
        .map((rel) => {
            const file = join(SRC, rel);
            return withoutComments(file, readFileSync(file, 'utf8'));
        });
}

/**
 * The text of the shipped schemas and of the templates a hub's schemas are copied from, comment
 * lines left out: a field there draws a vocabulary list as `foreign_key: vocab.<key>`, read through
 * the vocabulary file's keys with no code naming the key.
 */
function schemaFilesText(): string {
    const dir = join(engineDir(), 'config', SCHEMAS);
    const files = [
        ...readdirSync(dir)
            .filter((name) => name.endsWith('.yml'))
            .map((name) => join(dir, name)),
        join(engineDir(), 'docs', 'templates.md')
    ];
    return files
        .flatMap((file) => readFileSync(file, 'utf8').split('\n'))
        .filter((line) => !line.trimStart().startsWith('#'))
        .join('\n');
}

describe('catalog file keys', () => {
    it('has a reader for every top-level key of every catalog file', () => {
        const dir = join(engineDir(), 'config', CATALOGS);
        const code = keyReaderCode();
        const schemas = schemaFilesText();
        const read = (key: string): boolean => {
            const name = RegExp.escape(key);
            const named = new RegExp(`\\.${name}\\b|['"]${name}['"]`);
            const drawn = new RegExp(`foreign_key:\\s*vocab\\.${name}\\b`);
            return drawn.test(schemas) || code.some((text) => named.test(text));
        };
        const orphaned = readdirSync(dir)
            .filter((name) => name.endsWith('.yml'))
            .sort()
            .flatMap((name) =>
                Object.keys(parse(readFileSync(join(dir, name), 'utf8')) as Record<string, unknown>)
                    .filter((key) => !read(key))
                    .map((key) => `${name}: ${key}`)
            );
        expect(orphaned).toEqual([]);
    });
});
