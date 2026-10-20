// Layer 1, data. The text catalog of the merged config and the findings of the merge. The catalog
// is the one top-level key every text fragment under config/text/ carries, so the fragments are
// folded into one flat map of dotted keys instead of being reported as a key defined twice. The
// findings of the merge are worded only once every file is merged, from the catalog the merge
// produced, since the catalog is one of the things being read. The read of one file of oculus's
// config folder into its top-level map, with the findings of what is wrong with it, is here too,
// since the defaults, catalog, schema and text files (merge.ts) and the options files
// (options-folder.ts) are read by it alike.

import { parse } from 'yaml';
import { findingText, type TextCatalog } from '../../../helpers/finding-text.ts';
import { isMap } from '../../../helpers/guards.ts';
import type { Finding } from '../../../model/index.ts';
import { issueText, shapeIssues } from '../../../shapes/shape-issues.ts';
import { mapOfShape, readAs, textOrNumberOnlyShape } from '../../../shapes/shapes.ts';
import { errorLine } from '../../yaml-file.ts';
import { z } from 'zod';

/** The one top-level key more than one file may carry. Catalog fragments merge by dotted leaf. */
export const TEXT_KEY = 'text';

/** A catalog leaf: a text, or a number or a boolean written out. */
const leafShape = z.union([textOrNumberOnlyShape, z.boolean().transform(String)]);

/** A finding of loadConfig before its words are known: the file, the key and how to word it. */
export type PendingFinding = { file: string; key: string; words: (catalog: TextCatalog) => string };

/** The finding of a config file whose text does not parse, with the parser's line. */
export function unparsed(file: string, error: unknown): PendingFinding {
    const message = errorLine(error);
    return {
        file,
        key: '',
        words: (catalog) => findingText(catalog, 'findings.file.does_not_parse', message)
    };
}

/** The finding of a config file whose text parses to something other than a map. */
export function notAMap(file: string): PendingFinding {
    return { file, key: '', words: (catalog) => findingText(catalog, 'findings.file.not_a_map') };
}

/** The top-level keys of one config file, in their order, without an own `__proto__` key. */
export const keysShape = mapOfShape(z.unknown());

/**
 * One file of oculus's config folder read into its top-level map, each thing wrong with it pushed
 * as a finding: a text that does not parse, one that is no map, and each issue of the whole-file
 * shape that `name` gives it (data/shapes/catalog-files/). Null when the text does not parse or is
 * no map. `empty` is what a file with no content reads as.
 */
export function readConfigFile(
    file: string,
    name: string,
    text: () => string,
    pending: PendingFinding[],
    empty: unknown
): Record<string, unknown> | null {
    let parsed: unknown;
    try {
        parsed = parse(text()) ?? empty;
    } catch (error) {
        pending.push(unparsed(file, error));
        return null;
    }
    const top = readAs(keysShape, parsed);
    if (top === null) {
        pending.push(notAMap(file));
        return null;
    }
    for (const issue of shapeIssues(name, parsed)) {
        pending.push({ file, key: issue.key, words: (catalog) => issueText(catalog, issue) });
    }
    return top;
}

/** Fold one catalog fragment into the flat dotted map, naming any key read twice. */
export function mergeText(
    config: Record<string, unknown>,
    value: unknown,
    name: string,
    file: string,
    from: Record<string, string>,
    pending: PendingFinding[]
): void {
    let flat: Record<string, string>;
    try {
        flat = flattenText(value);
    } catch (error) {
        if (error instanceof TextNotAMap) {
            const path = error.path;
            pending.push({
                file,
                key: TEXT_KEY,
                words: (catalog) => findingText(catalog, 'findings.config.text_not_a_map', path)
            });
            return;
        }
        // Anything else (a fragment whose aliases loop, say) is reported in the parser's own words,
        // so one bad fragment is a finding rather than a failed request.
        const message = error instanceof Error ? error.message : String(error);
        pending.push({ file, key: TEXT_KEY, words: () => message });
        return;
    }
    const held = (config[TEXT_KEY] ??= {}) as Record<string, string>;
    for (const [key, entry] of Object.entries(flat)) {
        const dotted = `${TEXT_KEY}.${key}`;
        if (key in held) {
            const earlier = from[dotted];
            pending.push({
                file,
                key: dotted,
                words: (catalog) =>
                    findingText(catalog, 'findings.config.defined_twice', dotted, earlier, name)
            });
        }
        held[key] = entry;
        from[dotted] = name;
    }
}

/** loadConfig's findings in the words of the catalog its merge produced, in the order raised. */
export function worded(pending: PendingFinding[], config: Record<string, unknown>): Finding[] {
    const catalog = textCatalog(config);
    return pending.map(({ file, key, words }) => ({ file, key, message: words(catalog) }));
}

/**
 * What flattenText throws for a catalog node that is neither a string nor a map, with the node's
 * dotted path (`root` for the whole block), so loadConfig can word the finding from the catalog.
 */
class TextNotAMap extends Error {
    readonly path: string;

    constructor(path: string) {
        super(`text catalog: ${path} is not a map`);
        this.path = path;
    }
}

/**
 * Flatten a nested map of strings to dotted keys. Values are strings; anything else is an error. An
 * own `__proto__` key is skipped at every level, because it is no key of the flat map.
 */
function flattenText(node: unknown, prefix = ''): Record<string, string> {
    const flat: Record<string, string> = {};
    if (!isMap(node)) throw new TextNotAMap(prefix || 'root');
    for (const [key, value] of Object.entries(node)) {
        if (key === '__proto__') continue;
        const dotted = prefix === '' ? key : `${prefix}.${key}`;
        const leaf = readAs(leafShape, value);
        if (leaf !== null) flat[dotted] = leaf;
        else Object.assign(flat, flattenText(value, dotted));
    }
    return flat;
}

/**
 * The flat catalog held in the merged config's `text` key. Owner files may move without changing
 * readers because their dotted keys are the public vocabulary.
 */
export function textCatalog(config: Record<string, unknown>): Record<string, string> {
    return flattenText(config.text ?? {});
}
