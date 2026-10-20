// Layer 1, data. The typed readers of the settings of files, the editor and repositories: the
// search, the extensions handed to a program, the Trash confirmation, the Files view's icon place,
// the repository scan depth of sources.yml, the editor's paint limit and the automatic fetch. Each
// reads its key through settingReader (reader.ts); the readers the page calls before the config
// channel's first message answer a fixed value for a configuration that holds no catalog yet.

import type { ProgramApps } from '../../../helpers/files/opens-in-program.ts';
import { noRule, settingReader, type SettingProblem, type SettingReader } from './reader.ts';

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
