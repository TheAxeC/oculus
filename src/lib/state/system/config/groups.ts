// Layer 2, client state. The groups and sections of the Settings view: "This browser" first, then
// one group per subject heading (Appearance, Editor, Terminal, Sessions and usage, Cluster, Boards
// and audit, Rail and pages, Presentation, Project sources, Calendar and mail), a group "Without a
// heading" while an option names no heading the catalog knows, This machine, and the Catalogs and
// Texts groups. Inside a group its rows are gathered under their section in the order the
// sections' first rows appear: the tracked files in the order below, then the catalog's.
//
// A heading draws from the files that hold an option of its subject, and shows one line for each
// (FileLine): the file's name and description, whether it is the machine's own, and why it has no
// row when it is still being read, unreadable, cut or not parsed. A file with keys of the hub list
// has a second line when the heading holds one of those keys: the hub layer's file of the same name
// under `.oculus/config/`, opened in the hub's root, with its own status and, when it is not there,
// the sentence that a change creates it. The rows of such a file are in no heading. A heading
// exists only while the options catalog holds an option of its subject, so a merged config with no
// catalog has none.
//
// The text of a tracked file comes from the function the caller hands in, asked once for each
// described file; the machine's own file is never asked for, since its rows are its catalog
// entries and the values the server sent of it. After This machine come the Catalogs and Texts
// groups, one row per file of config/catalogs/ and of config/text/ and its subfolders, made from
// the listings the caller hands in (view/folders.ts).

import { hubKeysOf } from '../../../data/helpers/hub-names.ts';
import {
    HEADINGS,
    UNHEADED,
    type Catalog,
    type Heading
} from '../../../data/sources/config/catalog/options.ts';
import type { FileText } from '../../sources/fs-transport.ts';
import { t } from '../../shared/words/text.ts';
import { OCULUS_CONFIG_ROOT } from '../../../data/helpers/files/address.ts';
import { PRIMARY_ROOT } from './config-files.ts';
import type { AppSettingRow } from './other-rows/app-rows.ts';
import type { BrowserRow } from './other-rows/browser.ts';
import { LOCAL_NAME, LOCAL_PATH, describedAs } from './config-files.ts';
import type { Message } from './messages.ts';
import type { FileRow, Listed } from './view/folders.ts';
import {
    fileRows,
    localRows,
    type ConfigRow,
    type FileStatus,
    type HubLayer,
    type LayerResult,
    type LocalRow,
    type MachineState
} from './rows.ts';

export { catalogOf } from '../../../data/sources/config/catalog/options.ts';

/** The tracked config files the Settings view lists, in the order of their rows. */
export const FILES: readonly string[] = [
    'appearance.yml',
    'behavior.yml',
    'layout.yml',
    'present.yml',
    'sources.yml'
];

/**
 * The ids of the rows the view draws its own editors in: the rail list and the page reset, and the
 * workbench layout, which has no editor and is edited in the file.
 */
export const RAIL_ROW = 'layout.yml:rail';
export const PAGES_ROW = 'layout.yml:arrangements';
export const WORKBENCH_ROW = 'layout.yml:workbench';

/** The id of the group of the per-browser values. */
export const BROWSER_GROUP = 'this-browser';

/** The id of the group of the machine's own file. */
const MACHINE_GROUP = 'machine';

/** The ids of the groups listing the catalog files, the schema files and the text files. */
export const CATALOGS_GROUP = 'catalogs';
const SCHEMAS_GROUP = 'schemas';
export const TEXTS_GROUP = 'texts';

/** Every kind of row a group holds and a search reads. */
export type Row = ConfigRow | LocalRow | BrowserRow | AppSettingRow | FileRow;

/** One section of a group: its title, a table-of-contents id, and its rows. */
export type Section = { id: string; title: string; rows: Row[] };

/** One file a heading draws from, with the reason it has no row when it has none. */
type FileLine = {
    file: string;
    /** The root the file is opened in: the engine's, or the hub's for a hub layer file. */
    root: string;
    /** What the file holds, in one sentence, or the empty string. */
    description: string;
    /** Whether the file is the machine's own, which the view tags. */
    local: boolean;
    status: FileStatus;
    said: Message | null;
};

/** One group: the per-browser values, a subject heading, the machine's file or a folder's files. */
export type Group = {
    /** The heading's id, `this-browser`, `machine`, `catalogs` or `texts`. */
    id: string;
    title: string;
    /** What the group's folder holds, in one sentence; the empty string for the other groups. */
    about: string;
    /** The files a heading draws from, in the order of FILES; none for the other groups. */
    lines: FileLine[];
    /** The sentence of a folder group that lists no file yet, or null. */
    said: Message | null;
    sections: Section[];
};

/** The words of a heading, each read by a literal key. */
function headingTitle(id: Heading | typeof UNHEADED): string {
    switch (id) {
        case 'appearance':
            return t('workbench.settings_heading_appearance');
        case 'editor':
            return t('workbench.settings_heading_editor');
        case 'terminal':
            return t('workbench.settings_heading_terminal');
        case 'sessions':
            return t('workbench.settings_heading_sessions');
        case 'cluster':
            return t('workbench.settings_heading_cluster');
        case 'boards':
            return t('workbench.settings_heading_boards');
        case 'rail':
            return t('workbench.settings_heading_rail');
        case 'presentation':
            return t('workbench.settings_heading_presentation');
        case 'sources':
            return t('workbench.settings_heading_sources');
        case 'calendar':
            return t('workbench.settings_heading_calendar');
        case 'apps':
            return t('workbench.settings_heading_apps');
        case 'unheaded':
            return t('workbench.settings_heading_unheaded');
    }
}

/** A section's id: the group and the title in lower case with its spaces as hyphens. */
function sectionId(group: string, title: string): string {
    return `${group}#${title.toLowerCase().replaceAll(/\s+/g, '-')}`;
}

/** The rows gathered under their sections, in the order each section's first row appears. */
function sectionsOf(group: string, rows: Row[]): Section[] {
    const sections = new Map<string, Section>();
    for (const row of rows) {
        const id = sectionId(group, row.section);
        const held = sections.get(id) ?? { id, title: row.section, rows: [] };
        held.rows.push(row);
        sections.set(id, held);
    }
    return [...sections.values()];
}

/**
 * Whether a group holds no row and says why: its files are not read, or its folder is not listed.
 */
export function saysWhyEmpty(group: Group): boolean {
    if (group.sections.length > 0) return false;
    if (group.lines.length === 0) return group.said !== null;
    return group.lines.every((line) => line.status !== 'rows');
}

/** The group of the files of one folder: a row per file, or the sentence of the listing. */
function folderGroup(
    id: string,
    title: string,
    about: string,
    listed: Listed,
    described: boolean
): Group {
    const rows: FileRow[] = listed.files.map((file) => ({
        kind: 'file',
        id: `${id}:${file}`,
        file,
        title: file,
        path: file,
        help: described ? describedAs(file) : '',
        section: '',
        modified: false
    }));
    return {
        id,
        title,
        about,
        lines: [],
        said: listed.said,
        sections: rows.length === 0 ? [] : [{ id: `${id}#`, title: '', rows }]
    };
}

/** The listings of the three folders the Catalogs, Schemas and Texts groups are made from. */
export type FolderListings = { catalogs: Listed; schemas: Listed; texts: Listed };

/** The file line of a tracked file over what was read of it. */
function lineOf(file: string, status: FileStatus, said: Message | null): FileLine {
    return {
        file,
        root: OCULUS_CONFIG_ROOT,
        description: describedAs(file),
        local: file === LOCAL_NAME,
        status,
        said
    };
}

/**
 * The file line of the machine's own file: the `.oculus/local.yml` of the primary hub, which opens
 * through the primary's folder. With no primary no folder holds it and the view says so.
 */
function machineLine(): FileLine {
    return {
        file: LOCAL_PATH,
        root: PRIMARY_ROOT,
        description: describedAs(LOCAL_NAME),
        local: true,
        status: 'rows',
        said: null
    };
}

/** The file line of a hub layer file: its path under the hub, read as the layer result says. */
function layerLine(file: string, layer: LayerResult): FileLine {
    return {
        file: layer.path,
        root: PRIMARY_ROOT,
        description: describedAs(file),
        local: false,
        status: layer.status,
        said: layer.said
    };
}

/**
 * The groups of the view. `texts` answers the text of a tracked file, and is asked for the files
 * the catalog describes and no other. `layers` answers the hub layer's file of a tracked file, and
 * is asked for the files that hold keys of the hub list; without it no file has a layer. `folders`
 * are the listings of the catalog, schema and text folders, and none leaves the three groups out.
 * `apps` are the rows of the settings the apps declare, which stand last in the Apps heading.
 * `machine` is what the server sent of the machine's `local.yml` files: which keys the primary's
 * sets, the default of each key and the value in force of each key that has one.
 */
export function settingsGroups(
    catalog: Catalog,
    texts: (file: string) => FileText,
    browser: BrowserRow[],
    folders?: FolderListings,
    layers?: (file: string) => HubLayer,
    apps: AppSettingRow[] = [],
    machine: MachineState = { primary: null, set: [], defaults: {}, values: {}, hubs: {} }
): Group[] {
    const groups: Group[] = [];
    if (browser.length > 0) {
        groups.push({
            id: BROWSER_GROUP,
            title: t('workbench.settings_this_browser'),
            about: '',
            lines: [],
            said: null,
            sections: [{ id: `${BROWSER_GROUP}#`, title: '', rows: browser }]
        });
    }
    const files = FILES.filter((file) => Object.hasOwn(catalog, file));
    const results = new Map(
        files.map((file) => {
            const hubbed = layers !== undefined && hubKeysOf(file) !== undefined;
            return [
                file,
                fileRows(file, catalog[file], texts(file), hubbed ? layers(file) : undefined)
            ];
        })
    );
    const headings: (Heading | typeof UNHEADED)[] = [...HEADINGS, UNHEADED];
    for (const id of headings) {
        const lines: FileLine[] = [];
        const rows: Row[] = [];
        for (const file of files) {
            const entries = Object.entries(catalog[file]).filter(
                ([, entry]) => entry.heading === id
            );
            if (entries.length === 0) continue;
            const result = results.get(file);
            if (result === undefined) continue;
            lines.push(lineOf(file, result.status, result.said ?? null));
            const listed = hubKeysOf(file) ?? [];
            if (result.layer !== undefined && entries.some(([key]) => listed.includes(key))) {
                lines.push(layerLine(file, result.layer));
            }
            rows.push(...result.rows.filter((row) => row.entry.heading === id));
        }
        if (lines.length === 0) continue;
        groups.push({
            id,
            title: headingTitle(id),
            about: '',
            lines,
            said: null,
            sections: sectionsOf(id, id === 'apps' ? [...rows, ...apps] : rows)
        });
    }
    if (Object.hasOwn(catalog, LOCAL_NAME)) {
        groups.push({
            id: MACHINE_GROUP,
            title: t('workbench.settings_heading_machine'),
            about: machine.primary === null ? t('workbench.settings_machine_no_primary') : '',
            lines: [machineLine()],
            said: null,
            sections: sectionsOf(MACHINE_GROUP, localRows(catalog[LOCAL_NAME], machine))
        });
    }
    if (folders !== undefined) {
        groups.push(
            folderGroup(
                CATALOGS_GROUP,
                t('settings.catalogs_title'),
                t('settings.catalogs_about'),
                folders.catalogs,
                true
            ),
            folderGroup(
                SCHEMAS_GROUP,
                t('settings.schemas_title'),
                t('settings.schemas_about'),
                folders.schemas,
                true
            ),
            folderGroup(
                TEXTS_GROUP,
                t('settings.texts_title'),
                t('settings.texts_about'),
                folders.texts,
                false
            )
        );
    }
    return groups;
}

/** One entry of the table of contents: a group and its titled sections. */
export type TocEntry = {
    id: string;
    title: string;
    sections: { id: string; title: string }[];
};

/**
 * The table of contents of the groups it is given, each with its titled sections. While a search is
 * typed, `searchGroups` has already left out every group holding no row. The per-browser group and
 * the folder groups have one section without a title, which is not listed.
 */
export function tocOf(groups: Group[]): TocEntry[] {
    return groups.map((group) => ({
        id: group.id,
        title: group.title,
        sections: group.sections
            .filter((section) => section.title !== '')
            .map((section) => ({ id: section.id, title: section.title }))
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
