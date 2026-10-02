// Layer 2, client state, pure. File nesting in one folder's listing: which files are drawn under
// another file of the same folder, by the patterns of config/catalogs/file-nesting.yml. The rule
// itself is data/helpers/files/nesting.ts's `nestNames`, the one the server words its findings by;
// this module turns its answer into the entries a folder draws.
//
// Only files nest. A folder is never a parent and never a child, and the order of the listing is
// kept: a parent stands where it stood, and its children follow it in the listing's order.

import {
    nestNames,
    readNesting,
    type NestingRule
} from '../../../../data/helpers/files/nesting.ts';
import type { FsEntry } from '../view/place.ts';

/** One entry a folder draws at its own level, with the files nested under it. */
export type NestedEntry = { entry: FsEntry; children: FsEntry[] };

/**
 * The entries of one folder as it draws them: each entry that is not nested under another, with
 * the files nested under it. `folder` is the folder's own name, for the patterns' `${dirname}`.
 * With no rules every entry stands alone.
 */
export function nestEntries(
    entries: FsEntry[],
    rules: NestingRule[],
    folder: string
): NestedEntry[] {
    if (rules.length === 0) return entries.map((entry) => ({ entry, children: [] }));
    const files = entries.filter((one) => one.kind === 'file');
    const nested = nestNames(
        files.map((one) => one.name),
        rules,
        folder
    );
    const child = new Set([...nested.values()].flat());
    const byName = new Map(files.map((one) => [one.name, one]));
    return entries.flatMap((entry) => {
        if (entry.kind === 'file' && child.has(entry.name)) return [];
        const names = entry.kind === 'file' ? (nested.get(entry.name) ?? []) : [];
        const children = names.flatMap((name) => {
            const held = byName.get(name);
            return held === undefined ? [] : [held];
        });
        return [{ entry, children }];
    });
}

/**
 * The nesting rules a merged configuration carries in `patterns:`; a pattern it cannot use is left
 * out.
 */
export function nestingRulesOf(config: Record<string, unknown>): NestingRule[] {
    return readNesting(config).rules;
}
