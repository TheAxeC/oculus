// Layer 1, data. File nesting: which files of one folder are drawn under another, by the patterns
// of config/catalogs/file-nesting.yml (`patterns:`), as VS Code's `explorer.fileNesting.patterns`.
//
// A pattern is a file name glob with one rule: the key names the parent and each text of its list
// of children names the files that nest under it. In the key, `*` stands for any text and
// the text the first `*` matched is `${capture}`. A child may use `*` for any text, and the words
// `${capture}`, `${basename}` (the parent's name without its last extension), `${extname}` (that
// extension without its dot) and `${dirname}` (the folder's name). Names compare as written, case
// included.
//
// One rule, imported by both layers: the page nests the rows it draws through `nestNames`, and the
// server words what the reader drops as findings (data/sources/config/catalog/nesting.ts) from the
// same read, so the two cannot disagree about what was dropped. A pattern the reader cannot use is
// dropped alone and the rest are kept.
//
// A file is nested under at most one parent, the first whose pattern names it in file order, and a
// child that is itself a parent brings its own children up: with `*.ts: ${capture}.js` and `*.js:
// ${capture}.d.ts`, `index.js` and `index.d.ts` both sit under `index.ts`.

import { isMap } from '../guards.ts';

/** One pattern: the key naming a parent, and the child patterns that nest under it. */
export type NestingRule = { key: string; children: string[] };

/** What the reader left out of `patterns:`, in the order of the file. */
export type NestingDrop =
    { kind: 'not-a-map' } | { kind: 'key'; key: string } | { kind: 'value'; key: string };

/** The rules the config carries and what was left out of it. */
export type NestingRead = { rules: NestingRule[]; drops: NestingDrop[] };

/** The children a value names: a list of non-empty texts; null for anything else. */
function childrenOf(value: unknown): string[] | null {
    if (!Array.isArray(value) || value.length === 0) return null;
    const children: string[] = [];
    for (const one of value) {
        if (typeof one !== 'string' || one.trim() === '') return null;
        children.push(one.trim());
    }
    return children;
}

/**
 * The rules `patterns:` holds, and each pattern it drops. An absent key is no rule and no drop; a
 * value that is not a map is no rule and one drop. A key that is empty or holds a slash, and a
 * value that is not a list of non-empty texts, drop that pattern alone.
 */
export function readNesting(config: Record<string, unknown>): NestingRead {
    const rules: NestingRule[] = [];
    const drops: NestingDrop[] = [];
    const held = config.patterns;
    if (held === undefined) return { rules, drops };
    if (!isMap(held)) return { rules, drops: [{ kind: 'not-a-map' }] };
    for (const [key, value] of Object.entries(held)) {
        if (key.trim() === '' || key.includes('/')) {
            drops.push({ kind: 'key', key });
            continue;
        }
        const children = childrenOf(value);
        if (children === null) {
            drops.push({ kind: 'value', key });
            continue;
        }
        rules.push({ key: key.trim(), children });
    }
    return { rules, drops };
}

/** A text as a regular expression source that matches it and nothing else. */
function literal(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * The pattern as a regular expression over a whole name: each `${word}` is the text `words` gives
 * it, and each `*` is `star`.
 */
function globOf(pattern: string, words: Record<string, string>, star: string): RegExp {
    const tokens = pattern.split(/(\$\{(?:capture|basename|extname|dirname)\}|\*)/);
    const source = tokens
        .map((token) => {
            if (token === '*') return star;
            if (token.startsWith('${')) return literal(words[token.slice(2, -1)] ?? '');
            return literal(token);
        })
        .join('');
    return new RegExp(`^${source}$`);
}

/** The text a name's first `*` matched against a key, or null when the key does not name it. */
function captureOf(key: string, name: string): string | null {
    const found = globOf(key, {}, '(.*)').exec(name);
    return found === null ? null : (found.at(1) ?? '');
}

/** The parts of a name the child patterns can name. */
function wordsOf(name: string, capture: string, folder: string): Record<string, string> {
    const dot = name.lastIndexOf('.');
    return {
        capture,
        basename: dot > 0 ? name.slice(0, dot) : name,
        extname: dot > 0 ? name.slice(dot + 1) : '',
        dirname: folder
    };
}

/** Whether `name` is `other` or sits below it, following the parents found so far. */
function under(parentOf: Map<string, string>, name: string, other: string): boolean {
    for (let at: string | undefined = name; at !== undefined; at = parentOf.get(at)) {
        if (at === other) return true;
    }
    return false;
}

/**
 * The files of one folder that are drawn under another: the parent's name to the names under it, in
 * the order of `names`. A name appears under one parent only, and never under a name that is itself
 * drawn under another one. `folder` is the folder's own name, for `${dirname}`.
 */
export function nestNames(
    names: string[],
    rules: NestingRule[],
    folder = ''
): Map<string, string[]> {
    const present = new Set(names);
    const parentOf = new Map<string, string>();
    for (const rule of rules) {
        for (const name of names) {
            const capture = captureOf(rule.key, name);
            if (capture === null) continue;
            const words = wordsOf(name, capture, folder);
            for (const child of rule.children) {
                const pattern = globOf(child, words, '.*');
                for (const other of names) {
                    if (other === name || parentOf.has(other) || !present.has(other)) continue;
                    if (pattern.test(other) && !under(parentOf, name, other)) {
                        parentOf.set(other, name);
                    }
                }
            }
        }
    }
    const top = (name: string): string => {
        let at = name;
        for (let parent = parentOf.get(at); parent !== undefined; parent = parentOf.get(at)) {
            at = parent;
        }
        return at;
    };
    const nested = new Map<string, string[]>();
    for (const name of names) {
        if (!parentOf.has(name)) continue;
        const root = top(name);
        if (root === name) continue;
        nested.set(root, [...(nested.get(root) ?? []), name]);
    }
    return nested;
}
