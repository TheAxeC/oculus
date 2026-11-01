// Layer 2, client state. The Settings view's search over its groups: the query is read by
// `readQuery` of typed.ts, where `@modified` keeps only the Modified rows, `@id:<text>` keeps the
// rows whose key path holds the text and `@id:` alone keeps every row, and every plain word must
// occur in the row's title, key path, section or description, in the words of the heading it is
// listed under, or inside the file's value of the row's entries or its Fields list (view/fold.ts),
// whatever the case. An empty query keeps every row. The result carries the count of the rows kept
// and the groups and sections that still hold one; the list draws every row and hides the others
// (settings/List.svelte), and an editor draws the entries a word is found in (view/matches.ts).
//
// Under an empty query a group that says why it holds no row (its files are loading, unreadable,
// cut or unparsed, or its folder is not listed) is kept, so the reader sees why. Under a typed
// query a group that holds no row is dropped, as the table of contents drops it. A row named in
// `keep` is kept whatever the query: the view keeps the rail's row while the tab was opened to show
// it.

import { saysWhyEmpty, type Group, type Row, type Section } from './groups.ts';
import { MODIFIED_FILTER, readQuery, type Query } from './typed.ts';
import { partTexts } from './view/fold.ts';

/** Whether a row answers a query; `heading` is the title of the group the row is listed under. */
function answers(row: Row, query: Query, heading: string): boolean {
    if (query.modified && !row.modified) return false;
    const path = row.path.toLowerCase();
    if (!query.ids.every((text) => path.includes(text))) return false;
    const inside =
        row.kind === 'config' ? [...partTexts(row, 'entries'), ...partTexts(row, 'fields')] : [];
    const fields = [row.title, row.path, row.section, row.help, heading, ...inside].map((field) =>
        field.toLowerCase()
    );
    return query.words.every((word) => fields.some((field) => field.includes(word)));
}

/** Whether the query carries the filter that keeps the Modified rows. */
export function hasModifiedFilter(query: string): boolean {
    return readQuery(query).modified;
}

/**
 * The query with the Modified filter put in at its end, or taken out of wherever it stands, the
 * other words kept as typed and joined by single spaces.
 */
export function withModifiedFilter(query: string, on: boolean): string {
    const words = query.split(/\s+/).filter((one) => one !== '');
    const others = words.filter((one) => one.toLowerCase() !== MODIFIED_FILTER);
    return (on ? [...others, MODIFIED_FILTER] : others).join(' ');
}

/** The groups and sections of a result still holding a row, with the count of the rows. */
export type Found = { count: number; groups: Group[] };

/** What a result keeps: the rows of each group by its id, and its sections and rows. */
type Kept = { groups: Map<string, number>; sections: Set<string>; rows: Set<string> };

/** What the groups of a result keep, which the list shows and the rest of its rows hides. */
export function keptIn(groups: Group[]): Kept {
    const kept: Kept = { groups: new Map(), sections: new Set(), rows: new Set() };
    for (const group of groups) {
        const rows = group.sections.flatMap((section) => section.rows);
        kept.groups.set(group.id, rows.length);
        for (const section of group.sections) kept.sections.add(section.id);
        for (const row of rows) kept.rows.add(row.id);
    }
    return kept;
}

/** The groups with the rows that answer the query, and how many rows that is. */
export function searchGroups(groups: Group[], query: string, keep: readonly string[] = []): Found {
    const read = readQuery(query);
    const typed = query.trim() !== '';
    let count = 0;
    const kept: Group[] = [];
    for (const group of groups) {
        const sections: Section[] = [];
        for (const section of group.sections) {
            const rows = section.rows.filter(
                (row) => keep.includes(row.id) || answers(row, read, group.title)
            );
            if (rows.length > 0) sections.push({ ...section, rows });
            count += rows.length;
        }
        if (sections.length > 0 || (!typed && saysWhyEmpty(group))) {
            kept.push({ ...group, sections });
        }
    }
    return { count, groups: kept };
}
