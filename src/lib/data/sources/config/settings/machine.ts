// Layer 1, data. The typed readers of the settings of this machine's processes and apps: the limits
// of the `apps:` block and the folders closed to an app's `open`, the change log's length and the
// Processes view's program names. Each reads its keys of behavior.yml through settingReader
// (reader.ts), but for `apps.closed_paths`, which is read without its default.

import { closedPathEntryOk } from '../../../helpers/files/apps/apps.ts';
import { mapShape, readAs } from '../../../shapes/shapes.ts';
import { settingReader, type SettingProblem } from './reader.ts';

/**
 * The folders `apps.closed_paths` names, which `open({ file })` refuses for every app. `folders` is
 * null while the key is missing or is not a list of strings, and every file target is then closed;
 * `shaped` is false for that and for a list holding an entry that is not a folder path, which is
 * left out while the others apply.
 */
export type ClosedPaths = { folders: string[] | null; shaped: boolean };

/** The limits of the `apps:` block of behavior.yml and the folders closed to `open`. */
export type AppsSettings = {
    connectTimeoutS: number;
    stateMaxKb: number;
    storeMaxKb: number;
    writesPerMin: number;
    opensPerMin: number;
    keysPerS: number;
    messagesPerMin: number;
    maxFiles: number;
    maxMb: number;
    hostOutputKb: number;
    hostStopSeconds: number;
    scanEntries: number;
    closedPaths: ClosedPaths;
};

/**
 * Read `apps.closed_paths` without the entry's default: a key that is missing, or a value that is
 * not a list of strings, closes every file target instead of reading as `[secrets]`, so a damaged
 * key can only close files. An entry that is not a folder path is left out; a repeated entry is
 * applied once and is no problem.
 */
export function closedPaths(config: Record<string, unknown>): ClosedPaths {
    const block = readAs(mapShape, config.apps);
    const held = block === null ? undefined : block.closed_paths;
    if (!Array.isArray(held) || !held.every((one) => typeof one === 'string')) {
        return { folders: null, shaped: false };
    }
    const folders = [...new Set(held.filter((one: string) => closedPathEntryOk(one)))];
    return { folders, shaped: folders.length === new Set(held).size };
}

/**
 * Read `apps:`'s twelve limits, each its default when it is missing or wrong, and `closed_paths`.
 */
export function appsSettings(
    config: Record<string, unknown>,
    problems: SettingProblem[] = []
): AppsSettings {
    const read = settingReader(config, problems);
    return {
        connectTimeoutS: read.number('apps.connect_timeout_s'),
        stateMaxKb: read.number('apps.state_max_kb'),
        storeMaxKb: read.number('apps.store_max_kb'),
        writesPerMin: read.number('apps.writes_per_min'),
        opensPerMin: read.number('apps.opens_per_min'),
        keysPerS: read.number('apps.keys_per_s'),
        messagesPerMin: read.number('apps.messages_per_min'),
        maxFiles: read.number('apps.max_files'),
        maxMb: read.number('apps.max_mb'),
        hostOutputKb: read.number('apps.host_output_kb'),
        hostStopSeconds: read.number('apps.host_stop_seconds'),
        scanEntries: read.number('apps.scan_entries'),
        closedPaths: closedPaths(config)
    };
}

/** Read `changes.keep`, how many change-log lines are kept. */
export function changesKeep(
    config: Record<string, unknown>,
    problems: SettingProblem[] = []
): number {
    return settingReader(config, problems).number('changes.keep');
}

/** The Processes view's settings of behavior.yml. */
export type ProcessesSettings = {
    /** The program names the view lists, each once, in the order the file first names it. */
    patterns: string[];
};

/**
 * Read `processes.patterns`; a list holding a name the entry refuses is the default list. An empty
 * list is accepted and lists oculus's own processes only.
 */
export function processesSettings(
    config: Record<string, unknown>,
    problems: SettingProblem[] = []
): ProcessesSettings {
    const names = settingReader(config, problems).strings('processes.patterns');
    return { patterns: [...new Set(names)] };
}
