// Layer 4, tool. What the diagrams read of each source file, computed once and shared: its imports
// as imports.mjs's importsOf() gives them and its code as code.mjs's codeOf() gives it.
//
// Every diagram reads the same files, and parsing them is what a generation spends its time on, so
// every diagram of one generation reads through one reader, and each file's imports and its code
// are each computed once per generation. The reader keeps each result under the file's path with
// the text it was computed from and computes it again only when it is handed a different text, so
// a caller that generates twice over trees that differ in a few files hands the same cache to both
// and only the changed files are parsed again. The cache is the caller's, passed in, and lives as
// long as the caller keeps it.

import { codeOf } from './code.mjs';
import { importsOf } from './imports.mjs';

/**
 * @typedef {import('./imports.mjs').Import} Import
 * @typedef {{ text: string, imports?: Import[], code?: string }} Parsed What one file's text gave.
 * @typedef {{ imports: (path: string, text: string) => Import[],
 *     code: (path: string, text: string) => string }} Reader
 *     The parse of a file by its path and text, from the cache while the text is the same.
 */

/**
 * A reader over a cache of parses keyed by path. A result is reused only when the text given is
 * the same string the result was parsed from; a different text replaces the file's entry.
 *
 * @param {Map<string, Parsed>} [cache]
 * @returns {Reader}
 */
export function parseReader(cache = new Map()) {
    /** @param {string} path @param {string} text @returns {Parsed} */
    const entry = (path, text) => {
        const held = cache.get(path);
        if (held !== undefined && held.text === text) return held;
        /** @type {Parsed} */
        const fresh = { text };
        cache.set(path, fresh);
        return fresh;
    };
    return {
        imports(path, text) {
            const held = entry(path, text);
            held.imports ??= importsOf(path, text);
            return held.imports;
        },
        code(path, text) {
            const held = entry(path, text);
            held.code ??= codeOf(path, text);
            return held.code;
        }
    };
}
