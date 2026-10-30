// Layer 1, data. The typed readers of the settings of files, the editor and repositories: the
// search, the extensions handed to a program, the Trash confirmation, the Files view's icon place,
// the repository scan depth and the chat's collection keys (`chatContext`) of sources.yml, the
// editor's paint limit, the automatic fetch and the website the hub's files are written into
// (`websiteSettings`). Each reads its key through settingReader (reader.ts), except `chatContext`,
// which reads its value by kind alone; the readers the page calls before the config channel's first
// message answer a fixed value for a configuration that holds no catalog yet.

import { z } from 'zod';
import type { ProgramApps } from '../../../helpers/files/opens-in-program.ts';
import { byKey } from '../../../helpers/guards.ts';
import { catalogOf, sourcedItems, type CatalogEntry } from '../catalog/options.ts';
import { valueProblem, type ValueProblem } from '../catalog/value-rule.ts';
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
};

/** Read `search:`'s three keys, each its default when it is missing or wrong. */
export function searchSettings(
    config: Record<string, unknown>,
    problems: SettingProblem[] = []
): SearchSettings {
    const read = settingReader(config, problems);
    return {
        maxHits: read.number('search.max_hits'),
        timeoutS: read.number('search.timeout_s'),
        maxNames: read.number('search.max_names')
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

/**
 * Whether a file's row in the Files view drops the empty slot of a folder's arrow:
 * `files.file_icon_at_arrow`, its default when it is missing or wrong, and true for a configuration
 * that holds no catalog yet.
 */
export function fileIconAtArrow(
    config: Record<string, unknown>,
    problems: SettingProblem[] = []
): boolean {
    try {
        return settingReader(config, problems).flag('files.file_icon_at_arrow');
    } catch {
        return true;
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
 * Read `repository_scan_depth` of sources.yml: how many folder levels below a root the
 * Repositories view looks for repositories, 1 when the key is missing or wrong.
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
    if (written !== null && 'problem' in written) {
        problems.push({ key: CHAT_CONTEXT, where: 'value', problem: written.problem, spec: entry });
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
 * to, the section's title, the stages and forms the row takes (a side left out takes every one),
 * whether an entry says the user's place among the authors, and the words printed before and after
 * the venue.
 */
const websiteKindShape = z.object({
    kind: z.string().min(1),
    title: z.string().optional(),
    stages: z.array(z.string()).optional(),
    forms: z.array(z.string()).optional(),
    order: z.boolean().optional(),
    pub_pre: z.string().optional(),
    pub_post: z.string().optional()
});

/** One row of `website.kinds`, as read. */
export type WebsiteKind = z.infer<typeof websiteKindShape>;

/**
 * The website the primary hub's files are written into: its folder relative to the hub, empty when
 * none is set, the command run in it once the files are written, empty for none, and the rows of
 * its publications' sections in the file's order.
 */
export type WebsiteSettings = { folder: string; cv: string; kinds: WebsiteKind[] };

/** Read `website:`'s three keys, each its default when it is missing or wrong. */
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
    return {
        folder: read.text('website.folder').trim(),
        cv: read.text('website.cv').trim(),
        kinds
    };
}
