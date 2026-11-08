// Layer 4, test helper of keys.test.ts. The source files the catalog key gate reads, each as its
// code with the comments turned to spaces; what one read of the text catalog found there is; and
// which catalog keys a set of such reads reaches: a plain read reaches its key, and a read of a
// plural key by a count reaches every form of it the catalog holds, since finding-text.ts picks
// between those forms by the count. Apart from the gate so the gate's file holds the scan and its
// rows, and these rules are read on their own.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PLURAL_FORMS } from '../../../src/lib/data/helpers/finding-text.ts';
import { withoutComments } from './code.ts';
import { treeFiles } from '../walk.ts';

/** Every module and component under a folder, as full paths, in name order. */
export function sources(dir: string): string[] {
    return treeFiles(dir)
        .filter((rel) => /\.(ts|svelte)$/.test(rel))
        .map((rel) => join(dir, rel));
}

/** Each file's text with its comments turned to spaces, by its full path, read and parsed once. */
const uncommented = new Map<string, string>();

/** A file's text with its comments turned to spaces (code.ts's withoutComments), read once. */
export function codeOf(file: string): string {
    let source = uncommented.get(file);
    if (source === undefined) {
        source = withoutComments(file, readFileSync(file, 'utf8'));
        uncommented.set(file, source);
    }
    return source;
}

/** One catalog read: its file, its reader, its key when the argument is a literal, its text. */
export type Call = { file: string; reader: string; key: string | null; text: string };

/**
 * The readers whose key is a plural key: a map of the CLDR forms in config/text/, flattened to
 * `<key>.<form>`. Such a read names a key whose `other` form the catalog holds, and reads every
 * form the catalog holds of it, the forms finding-text.ts picks between by the count.
 */
export const PLURAL_READERS = new Set(['plural', 'pluralSentence', 'pluralWords']);

/** The forms of a plural key the catalog holds, each as its dotted key. */
export function formsOf(key: string, keys: readonly string[]): string[] {
    return PLURAL_FORMS.map((form) => `${key}.${form}`).filter((one) => keys.includes(one));
}

/**
 * The catalog keys no read reaches, of `keys`, given the literal reads `found` and the keys
 * `allowed` otherwise reach: a plural read reaches every form of its key, and a plain read its key.
 */
export function orphansOf(found: Call[], keys: readonly string[], allowed: Set<string>): string[] {
    const reached = new Set(allowed);
    for (const call of found) {
        if (call.key === null) continue;
        const read = PLURAL_READERS.has(call.reader) ? formsOf(call.key, keys) : [call.key];
        for (const one of read) reached.add(one);
    }
    return keys.filter((key) => !reached.has(key));
}

/** Whether a literal read names a key of the catalog: a plural read its `other` form. */
export function namesKey(call: Call, held: Readonly<Record<string, string>>): boolean {
    if (call.key === null) return true;
    return PLURAL_READERS.has(call.reader) ? `${call.key}.other` in held : call.key in held;
}

/** A key of a findings file with its plural form taken off, so a plural key is named once. */
export function sentenceBase(key: string, keys: readonly string[]): string {
    const at = key.lastIndexOf('.');
    const base = key.slice(0, at);
    const form = key.slice(at + 1);
    return (PLURAL_FORMS as readonly string[]).includes(form) && keys.includes(`${base}.other`)
        ? base
        : key;
}

/**
 * The text after the first argument of a call whose argument list starts at `at`, or null when the
 * list closes before a comma at its own depth. Quotes and nested brackets are skipped, so a first
 * argument such as `textCatalog(config)` is passed over whole.
 */
export function afterFirstArgument(source: string, at: number): string | null {
    let depth = 0;
    let quote = '';
    for (let index = at; index < source.length; index += 1) {
        const char = source[index];
        if (quote !== '') {
            if (char === '\\') index += 1;
            else if (char === quote) quote = '';
        } else if (char === "'" || char === '"' || char === '`') {
            quote = char;
        } else if ('([{'.includes(char)) {
            depth += 1;
        } else if (')]}'.includes(char)) {
            if (depth === 0) return null;
            depth -= 1;
        } else if (char === ',' && depth === 0) {
            return source.slice(index + 1, index + 201);
        }
    }
    return null;
}
