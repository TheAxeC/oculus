// Layer 2, client state, pure. The rows a typed filter leaves, and the pieces of a row's name a
// match is drawn in.
//
// The filter matches names in one of two ways, the instance's `fuzzy` toggle: a substring of the
// name whatever its case, or every letter of the text in order through state/shared/words/fuzzy.ts,
// the one matcher of the page. Either way a matching row carries the positions of the letters that
// matched, for the row to draw them marked.

import { fuzzyMatches } from '../../../shared/words/fuzzy.ts';
import { childPath, type FsEntry, type FsRoot, type TreeRow, type TreeTop } from '../view/place.ts';

/**
 * The entries of a folder a text matches, each with the positions of the letters that matched: the
 * run of the substring, or the letters fuzzysort matched.
 */
function matches(entries: FsEntry[], wanted: string, fuzzy: boolean): Map<string, number[]> {
    const found = new Map<string, number[]>();
    if (fuzzy) {
        for (const one of fuzzyMatches(wanted, entries, [(entry) => entry.name])) {
            found.set(one.row.name, [...(one.keys[0]?.indexes ?? [])]);
        }
        return found;
    }
    const lower = wanted.toLowerCase();
    for (const entry of entries) {
        const at = entry.name.toLowerCase().indexOf(lower);
        if (at >= 0)
            found.set(
                entry.name,
                Array.from({ length: lower.length }, (_, i) => at + i)
            );
    }
    return found;
}

/**
 * The rows a filter leaves: every root's line, every entry whose name matches the text, and every
 * folder above one of those, drawn open so the match is seen under the folders it sits in. The
 * entries are the listings already read, `null` for a folder never read: a folder the reader opened
 * once and closed again is searched, and a folder nobody opened is not, since reading it would walk
 * the whole root for one keystroke. An empty filter is no filter, and the view draws treeRows() for
 * it instead. The rows are flat: nothing is nested or compacted while a filter draws them.
 */
export function filterRows(
    roots: FsRoot[],
    heldOf: (root: string, path: string) => FsEntry[] | null,
    text: string,
    top: TreeTop | null = null,
    fuzzy = false
): TreeRow[] {
    const wanted = text.trim();
    const walk = (root: string, path: string, depth: number): TreeRow[] => {
        const found: TreeRow[] = [];
        const entries = heldOf(root, path) ?? [];
        const named = matches(entries, wanted, fuzzy);
        for (const entry of entries) {
            const child = childPath(path, entry.name);
            const below = entry.kind === 'dir' ? walk(root, child, depth + 1) : [];
            const hits = named.get(entry.name);
            if (below.length === 0 && hits === undefined) continue;
            found.push({
                root,
                path: child,
                name: entry.name,
                kind: entry.kind,
                size: entry.size,
                ...(entry.link === true ? { link: true as const } : {}),
                ...(entry.ignored === true ? { ignored: true as const } : {}),
                ...(hits !== undefined && hits.length > 0 ? { hits } : {}),
                depth,
                open: below.length > 0
            });
            found.push(...below);
        }
        return found;
    };
    return roots.flatMap((root) => {
        const path = top?.path ?? '';
        const below = walk(root.key, path, 1);
        const own: TreeRow = {
            root: root.key,
            path,
            name: top?.name ?? root.key,
            kind: 'dir',
            size: 0,
            depth: 0,
            open: below.length > 0
        };
        return [own, ...below];
    });
}

/** One run of a name: the text, and whether the filter matched it. */
export type NamePart = { text: string; hit: boolean };

/** A name split into the runs the filter matched and the runs between them. */
export function namePartsOf(name: string, hits: readonly number[] | undefined): NamePart[] {
    if (hits === undefined || hits.length === 0) return [{ text: name, hit: false }];
    const marked = new Set(hits);
    const parts: NamePart[] = [];
    for (let at = 0; at < name.length; at += 1) {
        const hit = marked.has(at);
        const last = parts.at(-1);
        if (last?.hit === hit) last.text += name[at];
        else parts.push({ text: name[at], hit });
    }
    return parts;
}
