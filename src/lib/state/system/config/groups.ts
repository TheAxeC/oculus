// Layer 2, client state. The groups and sections of the Settings view: one group per subject
// heading (Appearance, Editor, Terminal, Sessions and usage, Cluster, Boards and audit, Rail and
// pages, Presentation, Project sources, Calendar and mail, Apps), a group "Without a heading" while
// an option names no heading the catalog knows, This machine, and the Catalogs, Schemas and Texts
// groups. Inside a group its rows are gathered under their section in the order the sections'
// first rows appear: the defaults files in the order below, then the catalog's.
//
// A heading draws from the files the options folder describes (the defaults files, and the catalog
// and schema files of its subfolders and the workspace's words, FILES) that hold an option of its
// subject, and shows one line for each (FileLine): the file's subject as a short title, its
// description and the file of oculus's Show Defaults opens (`defaultsOf`), which only shows it. No
// line opens a user's file: the user's values are set in the rows. A heading exists only while the
// options catalog holds an option of its subject, so a merged config with no catalog has none.
//
// The rows are read from the merged configuration and the user's files the caller hands in
// (rows.ts). The This machine group is there only when the caller hands in the `local.yml` of one
// hub (`localRows`), which the This machine scope does; its line describes the file. After it come
// the Catalogs, Schemas and Texts groups, one row per file of config/catalogs/, config/schemas/ and
// config/text/ and its subfolders, made from the listings the caller hands in (view/folders.ts).

import {
    HEADINGS,
    UNHEADED,
    type Catalog,
    type Heading
} from '../../../data/sources/config/catalog/options.ts';
import { toggled } from '../../shared/lists/lists.ts';
import { t } from '../../shared/words/text.ts';
import type { AppSettingRow } from './other-rows/app-rows.ts';
import { LOCAL_NAME, LOCAL_PATH, defaultsOf, describedAs } from './config-files.ts';
import type { Message } from './messages.ts';
import type { FileRow, Listed } from './view/folders.ts';
import { fileRows, localRows, type ConfigRow, type LocalScope, type UserFiles } from './rows.ts';

export { catalogOf } from '../../../data/sources/config/catalog/options.ts';

/**
 * The files the options folder describes that the Settings view lists, in the order of their rows:
 * the defaults files, the hub's vocabulary and project form fields, the catalogs a workspace sets,
 * and the workspace's own words.
 */
export const FILES: readonly string[] = [
    'appearance.yml',
    'behavior.yml',
    'layout.yml',
    'present.yml',
    'sources.yml',
    'catalogs/vocab.yml',
    'schemas/manifest-schema.yml',
    'catalogs/agents.yml',
    'catalogs/file-nesting.yml',
    'catalogs/glyphs.yml',
    'catalogs/icons.yml',
    'catalogs/latex.yml',
    'catalogs/unimath.yml',
    'text.yml'
];

/**
 * The ids of the rows the view draws its own editors in: the rail list, and the page layouts with
 * the reset of the pages.
 */
export const RAIL_ROW = 'layout.yml:rail';
export const PAGES_ROW = 'layout.yml:arrangements';

/** The id of the group of the machine's own file. */
const MACHINE_GROUP = 'machine';

/** The ids of the groups listing the catalog files, the schema files and the text files. */
export const CATALOGS_GROUP = 'catalogs';
export const SCHEMAS_GROUP = 'schemas';
export const TEXTS_GROUP = 'texts';

/** Every kind of row a group holds and a search reads. */
export type Row = ConfigRow | AppSettingRow | FileRow;

/** One section of a group: its title, a table-of-contents id, and its rows. */
export type Section = { id: string; title: string; rows: Row[] };

/** One file a heading draws from: a file the options folder describes, or the machine's file. */
type FileLine = {
    /**
     * The file's name: the described file's under config/options/ (`behavior.yml`,
     * `catalogs/vocab.yml`), or the path of the machine's file.
     */
    file: string;
    /** The file's subject in a few words. */
    title: string;
    /**
     * The file under config/ Show Defaults opens (`defaultsOf`), null for a line that has none: the
     * machine's file, and the workspace's words, whose default is the text catalog.
     */
    defaults: string | null;
    /** What the file holds, in one sentence, or the empty string. */
    description: string;
    /** Whether the file is the machine's own, which the view tags. */
    local: boolean;
};

/** One group: a subject heading, the machine's file or a folder's files. */
export type Group = {
    /** The heading's id, `machine`, `catalogs`, `schemas` or `texts`. */
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

/** Whether a group holds no row and says why: its folder is not listed. */
export function saysWhyEmpty(group: Group): boolean {
    return group.sections.length === 0 && group.said !== null;
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

/** The subject of a file of the user's or of a file the options folder describes, as a title. */
function fileTitle(file: string): string {
    switch (file) {
        case 'appearance.yml':
            return t('settings.title_appearance');
        case 'behavior.yml':
            return t('settings.title_behavior');
        case 'layout.yml':
            return t('settings.title_layout');
        case 'present.yml':
            return t('settings.title_present');
        case 'sources.yml':
            return t('settings.title_sources');
        case 'catalogs/vocab.yml':
            return t('settings.title_vocab');
        case 'schemas/manifest-schema.yml':
            return t('settings.title_manifest_schema');
        case 'catalogs/agents.yml':
            return t('settings.title_agents');
        case 'catalogs/file-nesting.yml':
            return t('settings.title_file_nesting');
        case 'catalogs/glyphs.yml':
            return t('settings.title_glyphs');
        case 'catalogs/icons.yml':
            return t('settings.title_icons');
        case 'catalogs/latex.yml':
            return t('settings.title_latex');
        case 'catalogs/unimath.yml':
            return t('settings.title_unimath');
        case 'text.yml':
            return t('settings.title_text');
        case LOCAL_PATH:
            return t('settings.title_local');
        default:
            return file;
    }
}

/** The line of a file the options folder describes: its subject, description and defaults. */
function fileLine(file: string): FileLine {
    return {
        file,
        title: fileTitle(file),
        defaults: defaultsOf(file),
        description: describedAs(file),
        local: false
    };
}

/** The line of the machine's own file: its subject and description, tagged as the machine's. */
function machineLine(): FileLine {
    return {
        file: LOCAL_PATH,
        title: fileTitle(LOCAL_PATH),
        defaults: null,
        description: describedAs(LOCAL_NAME),
        local: true
    };
}

/**
 * The groups of the view. `config` is the merged configuration, whose values are the values in
 * force, and `user` the user's files: the hub's settings file, given when there is a primary hub
 * or a hub is read, and the open workspace file, null for the unsaved workspace. `folders` are the
 * listings of the catalog, schema and text folders, and none leaves the three groups out. `apps`
 * are the rows of the settings the apps declare, which stand last in the Apps heading. `machine`
 * is the `local.yml` of one hub the This machine group is made from, and none leaves it out.
 */
export function settingsGroups(
    catalog: Catalog,
    config: Record<string, unknown>,
    user: UserFiles,
    folders?: FolderListings,
    apps: AppSettingRow[] = [],
    machine?: LocalScope
): Group[] {
    const groups: Group[] = [];
    const files = FILES.filter((file) => Object.hasOwn(catalog, file));
    const results = new Map(
        files.map((file) => [file, fileRows(file, catalog[file], config, user)] as const)
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
            lines.push(fileLine(file));
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
    if (machine !== undefined && Object.hasOwn(catalog, LOCAL_NAME)) {
        groups.push({
            id: MACHINE_GROUP,
            title: t('workbench.settings_heading_machine'),
            about: '',
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
 * typed, `searchGroups` has already left out every group holding no row. A folder group has one
 * section without a title, which is not listed.
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

/**
 * The ids of the closed groups after a press on a group's row: a group with sections closes when
 * it is open and opens when it is closed, as a press on a collapsible row of VS Code's tree does,
 * and a group with none has nothing to close.
 */
export function pressedGroups(closed: string[], entry: TocEntry): string[] {
    return entry.sections.length === 0 ? closed : toggled(closed, entry.id);
}
