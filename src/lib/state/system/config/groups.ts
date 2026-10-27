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
// description, the file Open Settings File opens and the file of oculus's Show Defaults opens
// (`defaultsOf`). A file with a key the workspace sets opens the open workspace file, where the
// user's values of its options are kept, with the sentence of why no line of a key is known when
// the workspace file is still being read, unreadable, cut or not parsed, or that the workspace is
// not saved to a file. A file whose keys under the heading are all keys of the hub list (the hub's
// vocabulary, its form fields) opens the hub's settings file, `.oculus/config.yml`, read as that
// file is. A heading that holds a key of the hub list from a file that also holds keys the
// workspace sets has one more line, once whatever number of files it draws from: the hub's settings
// file, opened in the hub's root, with its own status and, when it is not there, the sentence that
// a change creates it. A heading exists only while the options catalog holds an option of its
// subject, so a merged config with no catalog has none.
//
// The rows are read from the merged configuration and the user's files the caller hands in
// (rows.ts); the machine's own file is never read here, since its rows are its catalog entries and
// the values the server sent of it. After This machine come the Catalogs, Schemas and Texts groups,
// one row per file of config/catalogs/, config/schemas/ and config/text/ and its subfolders, made
// from the listings the caller hands in (view/folders.ts).

import { hubKeysOf } from '../../../data/helpers/hub-names.ts';
import {
    HEADINGS,
    UNHEADED,
    type Catalog,
    type Heading
} from '../../../data/sources/config/catalog/options.ts';
import { toggled } from '../../shared/lists/lists.ts';
import { t } from '../../shared/words/text.ts';
import { HUB_FILE } from '../../../data/helpers/hub-names.ts';
import { PRIMARY_ROOT } from './config-files.ts';
import type { AppSettingRow } from './other-rows/app-rows.ts';
import { LOCAL_NAME, LOCAL_PATH, defaultsOf, describedAs } from './config-files.ts';
import { message, type Message } from './messages.ts';
import type { FileRow, Listed } from './view/folders.ts';
import {
    fileRows,
    machineRows,
    type ConfigRow,
    type FileResult,
    type FileStatus,
    type LocalRow,
    type MachineState,
    type UserFileResult,
    type UserFiles
} from './rows.ts';

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
 * The ids of the rows the view draws its own editors in: the rail list and the page reset, and the
 * workbench layout, which has no editor and is edited in the file.
 */
export const RAIL_ROW = 'layout.yml:rail';
export const PAGES_ROW = 'layout.yml:arrangements';
export const WORKBENCH_ROW = 'layout.yml:workbench';

/** The id of the group of the machine's own file. */
const MACHINE_GROUP = 'machine';

/** The ids of the groups listing the catalog files, the schema files and the text files. */
export const CATALOGS_GROUP = 'catalogs';
const SCHEMAS_GROUP = 'schemas';
export const TEXTS_GROUP = 'texts';

/** Every kind of row a group holds and a search reads. */
export type Row = ConfigRow | LocalRow | AppSettingRow | FileRow;

/** One section of a group: its title, a table-of-contents id, and its rows. */
export type Section = { id: string; title: string; rows: Row[] };

/**
 * One file a heading draws from: a file the options folder describes (`defaults`), the hub's
 * settings file (`hub`) or the machine's own file (`machine`), with what became of the read of the
 * file it opens.
 */
type FileLine = {
    kind: 'defaults' | 'hub' | 'machine';
    /**
     * The file's name: the described file's under config/options/ (`behavior.yml`,
     * `catalogs/vocab.yml`), or the path of the hub's or the machine's file.
     */
    file: string;
    /** The file's subject in a few words. */
    title: string;
    /**
     * The file under config/ Show Defaults opens (`defaultsOf`), null for a line that has none: the
     * hub's and the machine's file, and the workspace's words, whose default is the text catalog.
     */
    defaults: string | null;
    /** What the file holds, in one sentence, or the empty string. */
    description: string;
    /** Whether the file is the machine's own, which the view tags. */
    local: boolean;
    /**
     * The file Open Settings File opens: its served root (`PRIMARY_ROOT` for a file of the primary
     * hub, null when no folder serves it) and its path, null for the unsaved workspace.
     */
    opens: { root: string | null; path: string | null };
    status: FileStatus;
    said: Message | null;
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
        case HUB_FILE:
            return t('settings.title_config');
        case LOCAL_PATH:
            return t('settings.title_local');
        default:
            return file;
    }
}

/**
 * The line of a file with a key the workspace sets: Open Settings File opens the open workspace
 * file, and the line says why no line of a key is known when that file is not read, or that the
 * workspace has no file.
 */
function defaultsLine(file: string, result: FileResult, user: UserFiles): FileLine {
    const open = user.workspace;
    const said = open === null ? message('noWorkspace') : (result.workspace?.said ?? null);
    return {
        kind: 'defaults',
        file,
        title: fileTitle(file),
        defaults: defaultsOf(file),
        description: describedAs(file),
        local: false,
        opens: { root: open?.root ?? null, path: open?.path ?? null },
        status: open === null ? 'rows' : (result.workspace?.status ?? 'rows'),
        said
    };
}

/**
 * The line of a file whose keys under a heading are all keys of the hub list: Open Settings File
 * opens the hub's settings file, read as `hubFile` says, and Show Defaults oculus's file. With no
 * primary hub (`hubFile` not given) no folder holds that file, and the line opens none and says so.
 */
function hubDefaultsLine(file: string, hubFile: UserFileResult | undefined): FileLine {
    const opens: Pick<FileLine, 'opens' | 'status' | 'said'> =
        hubFile === undefined
            ? { opens: { root: null, path: HUB_FILE }, status: 'rows', said: message('noPrimary') }
            : hubFileLine(hubFile);
    return {
        opens: opens.opens,
        status: opens.status,
        said: opens.said,
        local: false,
        kind: 'defaults',
        file,
        title: fileTitle(file),
        defaults: defaultsOf(file),
        description: describedAs(file)
    };
}

/**
 * The file line of the machine's own file: the `.oculus/local.yml` of the primary hub, which opens
 * through the primary's folder. With no primary no folder holds it and the view says so.
 */
function machineLine(): FileLine {
    return {
        kind: 'machine',
        file: LOCAL_PATH,
        title: fileTitle(LOCAL_PATH),
        defaults: null,
        description: describedAs(LOCAL_NAME),
        local: true,
        opens: { root: PRIMARY_ROOT, path: LOCAL_PATH },
        status: 'rows',
        said: null
    };
}

/** The file line of the hub's settings file: its path under the hub, read as the result says. */
function hubFileLine(hubFile: UserFileResult): FileLine {
    return {
        kind: 'hub',
        file: hubFile.path,
        title: fileTitle(hubFile.path),
        defaults: null,
        description: describedAs(hubFile.path),
        local: false,
        opens: { root: PRIMARY_ROOT, path: hubFile.path },
        status: hubFile.status,
        said: hubFile.said
    };
}

/** What the server sent of the machine's files before it has answered: nothing set. */
const NO_MACHINE: MachineState = {
    primary: null,
    set: [],
    defaults: {},
    values: {},
    hubs: {},
    portRefused: null
};

/**
 * The groups of the view. `config` is the merged configuration, whose values are the values in
 * force, and `user` the user's files: the hub's settings file, given when there is a primary hub,
 * and the open workspace file, null for the unsaved workspace. `folders` are the listings of the
 * catalog, schema and text folders, and none leaves the three groups out. `apps` are the rows of
 * the settings the apps declare, which stand last in the Apps heading. `machine` is what the server
 * sent of the machine's `local.yml` files: which keys the primary's sets, the default of each key
 * and the value in force of each key that has one.
 */
export function settingsGroups(
    catalog: Catalog,
    config: Record<string, unknown>,
    user: UserFiles,
    folders?: FolderListings,
    apps: AppSettingRow[] = [],
    machine: MachineState = NO_MACHINE
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
        let hubLine = false;
        for (const file of files) {
            const entries = Object.entries(catalog[file]).filter(
                ([, entry]) => entry.heading === id
            );
            if (entries.length === 0) continue;
            const result = results.get(file);
            if (result === undefined) continue;
            const listed = hubKeysOf(file) ?? [];
            const hubFile = result.hubFile;
            if (entries.every(([key]) => listed.includes(key))) {
                lines.push(hubDefaultsLine(file, hubFile));
            } else {
                lines.push(defaultsLine(file, result, user));
                if (hubFile !== undefined && entries.some(([key]) => listed.includes(key))) {
                    if (!hubLine) lines.push(hubFileLine(hubFile));
                    hubLine = true;
                }
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
            sections: sectionsOf(MACHINE_GROUP, machineRows(catalog[LOCAL_NAME], machine))
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
