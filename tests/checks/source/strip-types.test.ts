// Layer 4, tree check. Every TypeScript file under src can have its types stripped. The desktop app
// ships and runs src unbuilt, so Node's type stripping loads the server's sources, and stripping
// refuses any syntax that needs a transform, such as a parameter property or an enum. A refused
// file ends the app's server the moment it is imported, so the list names each one with Node's own
// message. The check reads src alone and every file of it, since computing which files the server
// reaches would be more code than the check.
//
// Stripping reads one file at a time and follows no import: an import Node cannot resolve, such as
// a `$lib` alias, is not seen here.

import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { treeFiles } from '../walk.ts';

const ENGINE = resolve(fileURLToPath(import.meta.url), '..', '..', '..', '..');

/** The message stripping refuses a file's text with, or null when it can strip it. */
function refusal(text: string): string | null {
    try {
        stripTypeScriptTypes(text);
        return null;
    } catch (error) {
        return (error as Error).message;
    }
}

describe('a TypeScript file under src', () => {
    it('can have its types stripped, as Node does to run it unbuilt', () => {
        const found = treeFiles(join(ENGINE, 'src'))
            .filter((rel) => rel.endsWith('.ts') && !rel.endsWith('.d.ts'))
            .flatMap((rel) => {
                const message = refusal(readFileSync(join(ENGINE, 'src', rel), 'utf8'));
                return message === null ? [] : [`src/${rel}: ${message}`];
            });
        expect(found).toEqual([]);
    });
});
