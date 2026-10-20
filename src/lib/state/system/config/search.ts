// Layer 2, client state. The Settings view's search over its groups: the query split on white
// space, where `@modified` (in any case) keeps only the Modified rows, `@id:<text>` keeps the rows
// whose key path holds the text and `@id:` alone keeps every row, and every other word, an unknown
// `@word` included, must occur in the row's title, key path, section or description, in the words
// of the heading it is listed under, or inside the row's entries or Fields list (view/fold.ts,
// which unfolds the part it is found in), whatever the case. An empty query keeps every row. The
// result carries the count of the rows kept and the groups and sections that still hold one.
//
// Under an empty query a group that says why it holds no row (its files are loading, unreadable,
// cut or unparsed, or its folder is not listed) is kept, so the reader sees why. Under a typed
// query a group that holds no row is dropped, as the table of contents drops it. A row named in
// `keep` is kept whatever the query: the view keeps the rail's row while the tab was opened to show
// it.

import { saysWhyEmpty, type Group, type Row, type Section } from './groups.ts';
import { partTexts } from './view/fold.ts';

/** The prefix of the filter that looks at the key path alone. */
const ID_FILTER = '@id:';

/** The filter that keeps the Modified rows. */
const MODIFIED_FILTER = '@modified';

/** A query read into what it asks of a row. */
type Query = { modified: boolean; ids: string[]; words: string[] };

/** Read a query: its filters, and the lower-case words that must each occur. */
function readQuery(query: string): Query {
    const read: Query = { modified: false, ids: [], words: [] };
    for (const word of query.split(/\s+/).filter((one) => one !== '')) {
        const lower = word.toLowerCase();
        if (lower === MODIFIED_FILTER) read.modified = true;
        else if (lower.startsWith(ID_FILTER)) {
            const text = lower.slice(ID_FILTER.length);
            if (text !== '') read.ids.push(text);
        } else read.words.push(lower);
    }
    return read;
}

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
