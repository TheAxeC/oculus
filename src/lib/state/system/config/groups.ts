// Layer 2, client state. The groups and sections of the Settings view: "This browser" first, then
// the five tracked config files in the order below, then the machine's own file, and inside each
// group its rows gathered under their section in the order the sections' first rows appear in the
// catalog. A group of a file that is still being read, unreadable, cut or not parsed has no
// sections and says why. A group exists only for a file the options catalog describes, so a merged
// config with no catalog has no file group.
//
// The text of a tracked file comes from the function the caller hands in, asked once for each
// described file; the machine's own file is never asked for, since its rows are its catalog
// entries alone and its values are the machine's.

import type { Catalog } from '../../../data/sources/config/catalog/options.ts';
import type { FileText } from '../../sources/fs-transport.ts';
import { t } from '../../shared/words/text.ts';
import type { BrowserRow } from './browser.ts';
import { LOCAL_NAME } from './config-files.ts';
import type { Message } from './messages.ts';
import { fileRows, localRows, type ConfigRow, type FileStatus, type LocalRow } from './rows.ts';

export { catalogOf } from '../../../data/sources/config/catalog/options.ts';

/** The tracked config files the Settings view lists, in the order of its groups. */
export const FILES: readonly string[] = [
    'appearance.yml',
    'behavior.yml',
    'layout.yml',
    'present.yml',
    'sources.yml'
];

/** The ids of the two rows the view draws its own editors in: the rail list and the page reset. */
export const RAIL_ROW = 'layout.yml:rail';
export const PAGES_ROW = 'layout.yml:arrangements';

/** The id of the group of the per-browser values. */
export const BROWSER_GROUP = 'this-browser';

/** Every kind of row a group holds and a search reads. */
export type Row = ConfigRow | LocalRow | BrowserRow;

/** One section of a group: its heading, a table-of-contents id, and its rows. */
export type Section = { id: string; heading: string; rows: Row[] };

/** One group: the per-browser values or one config file. */
export type Group = {
    /** `this-browser` or the file's name. */
    id: string;
    title: string;
    /** The file's name, or null for the per-browser values. */
    file: string | null;
    /** Whether the group is the machine's own file, which the view tags. */
    local: boolean;
    status: FileStatus;
    said: Message | null;
    sections: Section[];
};

/** A section's id: the file and the heading in lower case with its spaces as hyphens. */
function sectionId(group: string, heading: string): string {
    return `${group}#${heading.toLowerCase().replaceAll(/\s+/g, '-')}`;
}

/** The rows gathered under their sections, in the order each section's first row appears. */
function sectionsOf(group: string, rows: Row[]): Section[] {
    const sections = new Map<string, Section>();
    for (const row of rows) {
        const id = sectionId(group, row.section);
        const held = sections.get(id) ?? { id, heading: row.section, rows: [] };
        held.rows.push(row);
        sections.set(id, held);
    }
    return [...sections.values()];
}

/**
 * The groups of the view. `texts` answers the text of a tracked file, and is asked for the files
 * the catalog describes and no other.
 */
export function settingsGroups(
    catalog: Catalog,
    texts: (file: string) => FileText,
    browser: BrowserRow[]
): Group[] {
    const groups: Group[] = [];
    if (browser.length > 0) {
        groups.push({
            id: BROWSER_GROUP,
            title: t('workbench.settings_this_browser'),
            file: null,
            local: false,
            status: 'rows',
            said: null,
            sections: [{ id: `${BROWSER_GROUP}#`, heading: '', rows: browser }]
        });
    }
    for (const file of FILES) {
        if (!Object.hasOwn(catalog, file)) continue;
        const result = fileRows(file, catalog[file], texts(file));
        groups.push({
            id: file,
            title: file,
            file,
            local: false,
            status: result.status,
            said: result.said ?? null,
            sections: sectionsOf(file, result.rows)
        });
    }
    if (Object.hasOwn(catalog, LOCAL_NAME)) {
        groups.push({
            id: LOCAL_NAME,
            title: LOCAL_NAME,
            file: LOCAL_NAME,
            local: true,
            status: 'rows',
            said: null,
            sections: sectionsOf(LOCAL_NAME, localRows(catalog[LOCAL_NAME]))
        });
    }
    return groups;
}

/** One entry of the table of contents: a group and its headed sections. */
export type TocEntry = {
    id: string;
    title: string;
    sections: { id: string; heading: string }[];
};

/**
 * The table of contents of the groups it is given, each with its headed sections. While a search is
 * typed, `searchGroups` has already left out every group holding no row. The per-browser group has
 * one section without a heading, which is not listed.
 */
export function tocOf(groups: Group[]): TocEntry[] {
    return groups.map((group) => ({
        id: group.id,
        title: group.title,
        sections: group.sections
            .filter((section) => section.heading !== '')
            .map((section) => ({ id: section.id, heading: section.heading }))
    }));
}

/** The ids of the closed groups after one group is closed or opened. */
export function toggledGroups(closed: string[], id: string): string[] {
    return closed.includes(id) ? closed.filter((one) => one !== id) : [...closed, id];
}

/**
 * The ids of the closed groups after a press on a group's row: a group with sections closes when
 * it is open and opens when it is closed, as a press on a collapsible row of VS Code's tree does,
 * and a group with none has nothing to close.
 */
export function pressedGroups(closed: string[], entry: TocEntry): string[] {
    return entry.sections.length === 0 ? closed : toggledGroups(closed, entry.id);
}
