// Layer 1, data. The typed readers of the settings of files, the editor and repositories: the
// search, the extensions handed to a program, the Trash confirmation, the Files view's icon place,
// the repository scan depth and the chat's collection keys (`chatContext`) of sources.yml, the
// editor's paint limit, the automatic fetch, the Zenodo deposit of a hub's projects
// (`zenodoSettings`) and the website the hub's files are written into (`websiteSettings`). Each
// reads its key through settingReader (reader.ts), except `chatContext`, which reads its value by
// kind alone; the readers the page calls before the config channel's first message answer a fixed
// value for a configuration that holds no catalog yet.

import { z } from 'zod';
import type { ProgramApps } from '../../../helpers/files/opens-in-program.ts';
import { byKey } from '../../../helpers/guards.ts';
import { CV_FIELD_ROLES, type CvFieldRole } from '../../../model/index.ts';
import { catalogOf, sourcedItems, type CatalogEntry } from '../catalog/options.ts';
import { valueProblem, type ValueProblem } from '../catalog/value-rule.ts';
import { authShape, type Auth } from './rows/grammar.ts';
import {
    checkedRows,
    heldAt,
    noRule,
    settingReader,
    type SettingProblem,
    type SettingReader
} from './reader.ts';

/** The search settings of behavior.yml. */
export type SearchSettings = {
    /** How many hits one answer carries before it says it was cut. */
    maxHits: number;
    /** How long one root's search is given, in seconds. */
    timeoutS: number;
    /** How many file names the palette's file mode lists before it says the list was cut. */
    maxNames: number;
    /** The names of the folders no search and no name list descends into. */
    skipFolders: string[];
};

/** Read `search:`'s four keys, each its default when it is missing or wrong. */
export function searchSettings(
    config: Record<string, unknown>,
    problems: SettingProblem[] = []
): SearchSettings {
    const read = settingReader(config, problems);
    return {
        maxHits: read.number('search.max_hits'),
        timeoutS: read.number('search.timeout_s'),
        maxNames: read.number('search.max_names'),
        skipFolders: read.strings('search.skip_folders')
    };
}

/** The open action's settings of behavior.yml. */
export type OpenSettings = {
    /** Each extension that may open, lowercased with its dot, to the bundle id it opens in. */
    programApps: ProgramApps;
};

/** The members of `open.program_ext` that the entry accepts, each extension lowercased. */
function appsOf(read: SettingReader): ProgramApps {
    const apps: ProgramApps = {};
    for (const [extension, app] of read.family('open.program_ext')) {
        if (typeof app !== 'string') throw noRule('open.program_ext');
        apps[extension.toLowerCase()] = app;
    }
    return apps;
}

/** Read `open.program_ext`, leaving out each extension or bundle id the entry refuses. */
export function openSettings(
    config: Record<string, unknown>,
    problems: SettingProblem[] = []
): OpenSettings {
    return { programApps: appsOf(settingReader(config, problems)) };
}

/**
 * The extensions a file may carry to be handed to a program, for the page: the same map the server
 * reads, and none for a configuration that holds no catalog yet, which is what the page holds until
 * the config channel's first message lands.
 */
export function programApps(config: Record<string, unknown>): ProgramApps {
    try {
        return openSettings(config).programApps;
    } catch {
        return {};
    }
}

/**
 * The names of the folders `files.hidden_folders` gives: the folders the Files view lists only when
 * hidden files are asked for, and that no walk of a served folder (an app's file search and its
 * `workspaceContains` look, a folder's Fix All, the Markdown server's file list) enters. Its
 * default when it is missing or wrong.
 */
export function hiddenFolders(
    config: Record<string, unknown>,
    problems: SettingProblem[] = []
): string[] {
    return settingReader(config, problems).strings('files.hidden_folders');
}

/**
 * Whether a move to the Trash asks first: `files.confirm_delete`, its default when it is missing
 * or wrong, and true for a configuration that holds no catalog yet, so a delete asks until the
 * setting says it need not.
 */
export function confirmDelete(
    config: Record<string, unknown>,
    problems: SettingProblem[] = []
): boolean {
    try {
        return settingReader(config, problems).flag('files.confirm_delete');
    } catch {
        return true;
    }
}

/** The file finder of a project card, as the `file_index` block sets it. */
type FileIndex = { enabled: boolean; ext: string[]; cap: number; skipFolders: string[] };

/**
 * The file finder of a project card: whether it lists at all (`file_index.enabled`), the
 * extensions it lists in lower case (`file_index.ext`), how many files of one project at most
 * (`file_index.max_per_project`) and the names of the folders it never enters
 * (`file_index.skip_folders`), each the entry's default when it is missing or wrong.
 */
export function fileIndexSettings(
    config: Record<string, unknown>,
    problems: SettingProblem[] = []
): FileIndex {
    const read = settingReader(config, problems);
    return {
        enabled: read.flag('file_index.enabled'),
        ext: read.strings('file_index.ext').map((one) => one.toLowerCase()),
        cap: read.number('file_index.max_per_project'),
        skipFolders: read.strings('file_index.skip_folders')
    };
}

/**
 * Whether a file's row in the Files view drops the empty slot of a folder's arrow:
 * `files.file_icon_at_arrow`, its default when it is missing or wrong, and null for a configuration
 * that holds no catalog yet, which is what the page holds until the config channel's first message
 * lands; the tree draws the slot until then.
 */
export function fileIconAtArrow(
    config: Record<string, unknown>,
    problems: SettingProblem[] = []
): boolean | null {
    try {
        return settingReader(config, problems).flag('files.file_icon_at_arrow');
    } catch {
        return null;
    }
}

/**
 * The `section:` word of a collection schema's fields that feed the website, which a card does not
 * draw: `website.schema_section` trimmed, the empty text for none, and null for a configuration
 * that holds no catalog yet, which is what the page holds until the config channel's first message
 * lands; a card draws every field until then.
 */
export function websiteSection(
    config: Record<string, unknown>,
    problems: SettingProblem[] = []
): string | null {
    try {
        return settingReader(config, problems).text('website.schema_section').trim();
    } catch {
        return null;
    }
}

/** Read `git.autofetch_minutes`, the minutes between two automatic fetches, 0 for none. */
export function autofetchMin(
    config: Record<string, unknown>,
    problems: SettingProblem[] = []
): number {
    return settingReader(config, problems).number('git.autofetch_minutes');
}

/**
 * Read `git.worktrees_dir`, the folder relative to a repository that holds the worktrees oculus
 * makes, the entry's default when the key is missing or wrong.
 */
export function worktreesDir(
    config: Record<string, unknown>,
    problems: SettingProblem[] = []
): string {
    return settingReader(config, problems).text('git.worktrees_dir');
}

/**
 * Read `repository_scan_depth` of sources.yml: how many folder levels below a root the
 * Repositories view looks for repositories, the entry's default when the key is missing or wrong.
 */
export function repositoryScanDepth(
    config: Record<string, unknown>,
    problems: SettingProblem[] = []
): number {
    return settingReader(config, problems, 'sources.yml').number('repository_scan_depth');
}

/** The key of sources.yml that names the collections a chat's index holds for a hub. */
const CHAT_CONTEXT = 'chat_context';

/**
 * The words of a `chat_context` value by the kind of its `multi` control alone, a list of words or
 * one word, or the rule's problem for a value of another kind. The list the entry's `from` names is
 * not checked here: `chatContext` leaves out each word it does not hold.
 */
function contextWords(
    entry: CatalogEntry,
    value: unknown
): { words: string[] } | { problem: ValueProblem } {
    const problem = valueProblem(entry, value, { sourced: null });
    if (problem !== null) return { problem };
    if (typeof value === 'string') return { words: [value] };
    if (Array.isArray(value) && value.every((one) => typeof one === 'string')) {
        return { words: value };
    }
    throw noRule(CHAT_CONTEXT, 'sources.yml');
}

/**
 * Read `chat_context` of sources.yml: the keys of the merged map's `collections:` list whose files
 * a portfolio or project chat's index holds for the hub, in the order written and each once. A
 * value of another kind than the `multi` control takes is a problem naming the key, and the entry's
 * default is read in its place. The list is the one the entry's `from` names, the keys of every
 * entry of `collections:`, the entries naming the feeds `leads` and `radar` among them; a word that
 * names none of them adds nothing and is no problem, since the merged map cannot tell a word the
 * hub wrote from oculus's default and a hub whose own list is shorter wrote nothing wrong, while
 * the Settings view and the server's write refuse such a word by the same `from`. It throws only
 * when the catalog holds no entry for the key, or a default of another kind.
 */
export function chatContext(
    config: Record<string, unknown>,
    problems: SettingProblem[] = []
): string[] {
    const entries = byKey(catalogOf(config), 'sources.yml');
    const entry = entries === undefined ? undefined : byKey(entries, CHAT_CONTEXT);
    if (entry === undefined) throw noRule(CHAT_CONTEXT, 'sources.yml');
    const held = heldAt(config, CHAT_CONTEXT, problems);
    const written = held.present ? contextWords(entry, held.value) : null;
    if (held.present && written !== null && 'problem' in written) {
        problems.push({
            key: CHAT_CONTEXT,
            where: 'value',
            problem: written.problem,
            spec: entry,
            value: held.value
        });
    }
    const read =
        written !== null && 'words' in written ? written : contextWords(entry, entry.default);
    if ('problem' in read) throw noRule(CHAT_CONTEXT, 'sources.yml');
    const listed = sourcedItems(entry, config) ?? [];
    return [...new Set(read.words)].filter((word) => listed.includes(word));
}

/**
 * The size in bytes above which the source editor opens a file as plaintext, and null for a
 * configuration that holds no catalog yet, which is what the page holds until the config channel's
 * first message lands; the editor paints plain over that.
 */
export function paintLimit(
    config: Record<string, unknown>,
    problems: SettingProblem[] = []
): number | null {
    try {
        return settingReader(config, problems).number('editor.paint_limit_kb') * 1024;
    } catch {
        return null;
    }
}

/**
 * One row of `website.kinds`: the key of the section of the website's publications its papers go
 * to, the stages and forms the row takes (a side left out takes every one), whether an entry says
 * the user's place among the authors, and the words printed before and after the venue.
 */
const websiteKindShape = z.object({
    kind: z.string().min(1),
    stages: z.array(z.string()).optional(),
    forms: z.array(z.string()).optional(),
    order: z.boolean().optional(),
    pub_pre: z.string().optional(),
    pub_post: z.string().optional()
});

/** One row of `website.kinds`, as read. */
export type WebsiteKind = z.infer<typeof websiteKindShape>;

/** The setting the CV's sections are read from. */
const CV_SECTIONS_KEY = 'website.cv_sections';

/** The setting the fields of a publications entry are read from. */
const PAPER_FIELDS_KEY = 'website.paper_fields';

/**
 * A key a row of the website's settings writes into a generated file: lower case and starting with
 * a letter, so no row reads as the empty key or as `__proto__`.
 */
const websiteRowKey = z.string().regex(/^[a-z][a-z0-9_-]*$/);

/**
 * One row of `website.cv_sections`: the key of a CV section, the fields its rows print in that
 * order, how its rows print their period (`timestamp`, else the empty text or none for the period
 * text), and the fields an employer CV's row of that section takes from the record it names. A row
 * must print at least one field.
 */
const cvSectionShape = z.object({
    key: websiteRowKey,
    fields: z.array(z.string()).min(1),
    period: z.union([z.literal('timestamp'), z.literal('').transform(() => undefined)]).optional(),
    record_fields: z.array(z.string()).optional()
});

/** One row of `website.cv_sections`, as read. */
export type CvSection = z.infer<typeof cvSectionShape>;

/** The shape of a row of `website.cv_sections` whose key is not the person block `personBlock`. */
function cvSectionOf(personBlock: string): z.ZodType<CvSection> {
    return cvSectionShape.refine((row) => row.key !== personBlock);
}

/**
 * One row of `website.cv_lists`: a list of the career file, the CV section its rows go to unless a
 * row names one, and whether its rows are built from the person each names.
 */
const cvListShape = z.object({
    list: websiteRowKey,
    section: websiteRowKey,
    reference: z.boolean().optional()
});

/** One row of `website.cv_lists`, as read. */
export type CvList = z.infer<typeof cvListShape>;

/**
 * One row of `website.cv_entry_fields`: the field `from` of a collection entry, where it holds one,
 * is written as `key`, and `own: false` leaves the entry's own field `key` out.
 */
const cvEntryFieldShape = z.object({
    key: websiteRowKey,
    from: z.string().min(1),
    own: z.boolean().optional()
});

/** One row of `website.cv_entry_fields`, as read. */
export type CvEntryField = z.infer<typeof cvEntryFieldShape>;

/** The word of each role of `website.cv_fields`; the empty text where the hub sets none. */
export type CvFields = Record<CvFieldRole, string>;

/** The two words of the code deposit's status the website links by, `website.code_statuses`. */
export type CodeStatuses = { deposited: string; review_copy: string };

/** The words a row of `website.paper_fields` names a value of the hub by. */
const paperFromShape = z.enum([
    'project_title',
    'project_year',
    'author_place',
    'kind_pre',
    'kind_post',
    'links_with_code'
]);

/** One word of `from` of a row of `website.paper_fields`. */
export type PaperFrom = z.infer<typeof paperFromShape>;

/**
 * One row of `website.paper_fields`: the key an entry of the publications file writes and the value
 * it takes, a word of `paperFromShape`, or the record's own field of that key when `from` is left
 * out or the empty text.
 */
const paperFieldShape = z.object({
    key: websiteRowKey,
    from: z.union([paperFromShape, z.literal('').transform(() => undefined)]).optional()
});

/** One row of `website.paper_fields`, as read. */
export type PaperField = z.infer<typeof paperFieldShape>;

/** The word of the user's place among a paper's authors, `website.author_places`, by place. */
export type AuthorPlaces = { lead: string; supervisor: string; collaborator: string };

/** The words a CV's period prints, from the hub's `website.cv_words`. */
export type CvWords = { months: string[]; open_end: string; award_time: string };

/**
 * The website's four files, each a path relative to its folder: its own file and the three the
 * hub's files are written into.
 */
export type WebsiteFiles = { site: string; cv: string; papers: string; industry: string };

/**
 * The website the primary hub's files are written into: its folder relative to the hub, empty when
 * none is set, the command run in it once the files are written, empty for none, the rows of its
 * publications' sections in the file's order, the rows of an entry's fields in the file's order,
 * the key a section holds its entries under, the code link's name, the words of the user's place
 * among the authors, the code statuses the website links by, the address a DOI resolves at, the key
 * of its own file that holds the research lines, the rows of the CV's sections in the file's order,
 * the career lists the CV reads, the rows of a collection entry's CV fields, the word of each
 * field the CV reads or writes, the words a CV's period prints, and its four files.
 */
export type WebsiteSettings = {
    folder: string;
    cv: string;
    kinds: WebsiteKind[];
    paperFields: PaperField[];
    paperList: string;
    codeLinkName: string;
    authorPlaces: AuthorPlaces;
    codeStatuses: CodeStatuses;
    doiOrigin: string;
    /** The comment line each generated file opens with, `website.file_header`; empty for none. */
    fileHeader: string;
    sitePrograms: string;
    cvSections: CvSection[];
    cvLists: CvList[];
    cvEntryFields: CvEntryField[];
    cvFields: CvFields;
    cvWords: CvWords;
    files: WebsiteFiles;
};

/**
 * The Zenodo deposit of a hub's projects: the base of every call, the seconds one upload is given,
 * and the entries the token is read and sent by. A field the hub's file does not set is oculus's
 * own, since each is a key of the hub list of its own (data/shapes/hub-keys.ts).
 */
export type ZenodoSettings = { address: string; timeoutS: number; auth: Auth[] };

/**
 * Read `deposit.zenodo`'s three keys, each its default when it is missing or wrong; an `auth` row
 * the options' fields refuse, or the entry's own shape refuses, is left out with its problem. A
 * `required` the row sets to false is read as not set, which is what the entry's shape says.
 */
export function zenodoSettings(
    config: Record<string, unknown>,
    problems: SettingProblem[] = []
): ZenodoSettings {
    const read = settingReader(config, problems);
    const auth: Auth[] = [];
    for (const { at, row } of checkedRows(config, 'deposit.zenodo.auth', problems)) {
        const { required, ...rest } = row;
        const entry = authShape.safeParse(required === true ? { ...rest, required } : rest);
        if (entry.success) auth.push(entry.data);
        else {
            const issue = { kind: 'shape' as const, row: at, at: '' };
            problems.push({ key: 'deposit.zenodo.auth', where: 'row', issue });
        }
    }
    return {
        address: read.text('deposit.zenodo.address').trim().replace(/\/+$/, ''),
        timeoutS: read.number('deposit.zenodo.timeout_s'),
        auth
    };
}

/**
 * The rows of the setting `key` that `shape` takes, each name (`nameOf`) once, the first standing;
 * a row the shape refuses is left out with a `shape` problem at the row, and a repeated name with a
 * `repeat` problem naming it.
 */
function namedRows<T>(
    config: Record<string, unknown>,
    key: string,
    shape: z.ZodType<T>,
    problems: SettingProblem[],
    nameOf: (row: T) => string
): T[] {
    const rows: T[] = [];
    for (const { at, row } of checkedRows(config, key, problems)) {
        const read = shape.safeParse(row);
        if (!read.success) {
            const issue = { kind: 'shape' as const, row: at, at: '' };
            problems.push({ key, where: 'row', issue });
        } else if (rows.some((one) => nameOf(one) === nameOf(read.data))) {
            problems.push({ key, where: 'repeat', name: nameOf(read.data) });
        } else {
            rows.push(read.data);
        }
    }
    return rows;
}

/** A row's name where it is its `key`. */
const keyOf = (row: { key: string }): string => row.key;

/**
 * Read `website:`'s keys, each its default when it is missing or wrong. A key of `website.files` is
 * a key of the hub list of its own (data/shapes/hub-keys.ts), so a hub that sets one keeps
 * oculus's other three, and so is a key of `website.cv_words`, `website.cv_fields`,
 * `website.code_statuses` and `website.author_places`. A row of a list of rows its own shape
 * refuses is left out with a `shape` problem at the row, and a row whose name an earlier row holds
 * with a `repeat` problem naming it, the earlier one standing.
 */
/**
 * Whether the settings hold what a CV is built from besides its sections: a row of
 * `website.cv_lists` and the field of every role of `website.cv_fields`.
 */
export function cvSettingsHeld(setting: Pick<WebsiteSettings, 'cvLists' | 'cvFields'>): boolean {
    return setting.cvLists.length > 0 && Object.values(setting.cvFields).every((one) => one !== '');
}

export function websiteSettings(
    config: Record<string, unknown>,
    problems: SettingProblem[] = []
): WebsiteSettings {
    const read = settingReader(config, problems);
    const kinds: WebsiteKind[] = [];
    for (const { row } of checkedRows(config, 'website.kinds', problems)) {
        const kind = websiteKindShape.safeParse(row);
        if (kind.success) kinds.push(kind.data);
    }
    const cvFields = Object.fromEntries(
        CV_FIELD_ROLES.map((role) => [role, read.text(`website.cv_fields.${role}`).trim()])
    ) as CvFields;
    return {
        folder: read.text('website.folder').trim(),
        cv: read.text('website.cv').trim(),
        kinds,
        paperFields: namedRows(config, PAPER_FIELDS_KEY, paperFieldShape, problems, keyOf),
        paperList: read.text('website.paper_list').trim(),
        codeLinkName: read.text('website.code_link_name').trim(),
        authorPlaces: {
            lead: read.text('website.author_places.lead').trim(),
            supervisor: read.text('website.author_places.supervisor').trim(),
            collaborator: read.text('website.author_places.collaborator').trim()
        },
        codeStatuses: {
            deposited: read.text('website.code_statuses.deposited').trim(),
            review_copy: read.text('website.code_statuses.review_copy').trim()
        },
        doiOrigin: read.text('website.doi_origin').trim(),
        fileHeader: read.text('website.file_header').trim(),
        sitePrograms: read.text('website.site_programs').trim(),
        cvSections: namedRows(
            config,
            CV_SECTIONS_KEY,
            cvSectionOf(cvFields.person_block),
            problems,
            keyOf
        ),
        cvLists: namedRows(config, 'website.cv_lists', cvListShape, problems, (row) => row.list),
        cvEntryFields: namedRows(
            config,
            'website.cv_entry_fields',
            cvEntryFieldShape,
            problems,
            keyOf
        ),
        cvFields,
        cvWords: {
            months: read.strings('website.cv_words.months'),
            open_end: read.text('website.cv_words.open_end').trim(),
            award_time: read.text('website.cv_words.award_time').trim()
        },
        files: {
            site: read.text('website.files.site').trim(),
            cv: read.text('website.files.cv').trim(),
            papers: read.text('website.files.papers').trim(),
            industry: read.text('website.files.industry').trim()
        }
    };
}
