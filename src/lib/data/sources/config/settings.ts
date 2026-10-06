// Layer 1, data. The typed readers of single settings out of the merged map: the cluster, the
// calendar, the search, the Literature search, the open list, the mail, the change log's length,
// the usage tiers and the refresh, the Processes view's program names, the LaTeX formatter and its
// auto build, the automatic fetch, the Trash confirmation and the editor's paint limit. Each reads
// a key by the rule of its entry in the options catalog (catalog/value-rule.ts), the same rule the
// Settings view and the server's write refuse a value by: a key that is missing is the entry's
// `default`, and a key whose value the rule refuses is the `default` too and comes back as a
// problem naming the key, so a typo costs one setting and the server starts. A reader throws only
// when the catalog holds no rule for a key it reads, or no default that reads, since without one no
// value can be read.

import { closedPathEntryOk } from '../../helpers/files/apps.ts';
import type { ProgramApps } from '../../helpers/files/opens-in-program.ts';
import { byKey } from '../../helpers/guards.ts';
import { FORMATTERS, type Formatter } from '../../prose/latex.ts';
import { mapShape, readAs } from '../../shapes/shapes.ts';
import { catalogOf, configItems, type CatalogEntry } from './catalog/options.ts';
import { valueProblem, type RuleLists, type ValueProblem } from './catalog/value-rule.ts';

/**
 * A setting the rule refuses, by the dotted key it was written at. `value` is a key whose default
 * is used, `entry` a member of a family that is not read, `field` a field of a record that is not
 * read; `spec` is the entry or field that holds the rule. `block` is a block that is not a map,
 * whose keys all take their defaults, and `family` a family that is not a map, none of whose
 * entries is read.
 */
export type SettingProblem =
    | { key: string; where: 'block' | 'family' }
    | {
          key: string;
          where: 'value' | 'entry' | 'field';
          problem: ValueProblem;
          spec: CatalogEntry;
      };

/** The value at a key of the merged map, if the file holds one. */
type Held = { present: false } | { present: true; value: unknown };

/** What a setting reader asks of the catalog and the map. */
export type SettingReader = {
    number: (key: string) => number;
    flag: (key: string) => boolean;
    text: (key: string) => string;
    /** The items of a list option, as the file holds them or the entry's default. */
    strings: (key: string) => string[];
    /** The members of a family that the entry's fields accept, as key and value. */
    family: (key: string) => [string, unknown][];
};

/** The throw for a key the catalog gives no rule for, or no default that reads. */
export function noRule(key: string): Error {
    return new Error(
        `config/catalogs/options.yml holds no entry, or no default that reads, for ${key}, so ${key} cannot be read`
    );
}

/** The items of the sources the entry names, together; null while one is not held. */
function listsOf(entry: CatalogEntry, config: Record<string, unknown>): RuleLists {
    let sourced: string[] | null = [];
    for (const source of entry.values_from ?? []) {
        const items = configItems(source, config);
        sourced = items === null || sourced === null ? null : [...sourced, ...items];
    }
    return { sourced };
}

/**
 * The value a dotted key holds in the merged map. A block that is null or missing holds nothing; a
 * block that is not a map holds nothing and is a problem of its own, named once.
 */
function heldAt(config: Record<string, unknown>, key: string, problems: SettingProblem[]): Held {
    const dot = key.indexOf('.');
    const name = dot < 0 ? key : key.slice(0, dot);
    const raw = Object.hasOwn(config, name) ? config[name] : undefined;
    if (dot < 0) return raw === undefined ? { present: false } : { present: true, value: raw };
    if (raw === undefined || raw === null) return { present: false };
    const block = readAs(mapShape, raw);
    if (block === null) {
        if (!problems.some((one) => one.key === name && one.where === 'block')) {
            problems.push({ key: name, where: 'block' });
        }
        return { present: false };
    }
    const rest = key.slice(dot + 1);
    const value = Object.hasOwn(block, rest) ? block[rest] : undefined;
    return value === undefined ? { present: false } : { present: true, value };
}

/** The entry of a key of config/behavior.yml in the merged map's catalog; throws without one. */
export function settingEntry(config: Record<string, unknown>, key: string): CatalogEntry {
    const entries = byKey(catalogOf(config), 'behavior.yml');
    const entry = entries === undefined ? undefined : byKey(entries, key);
    if (entry === undefined) throw noRule(key);
    return entry;
}

/** A reader over the merged map, pushing what it finds wrong to `problems`. */
export function settingReader(
    config: Record<string, unknown>,
    problems: SettingProblem[] = []
): SettingReader {
    const entries = byKey(catalogOf(config), 'behavior.yml');
    const entryOf = (key: string): CatalogEntry => {
        const entry = entries === undefined ? undefined : byKey(entries, key);
        if (entry === undefined) throw noRule(key);
        return entry;
    };
    /** The entry's default, which must read by the entry's own rule. */
    const defaultOf = (entry: CatalogEntry, key: string): unknown => {
        if (!Object.hasOwn(entry, 'default')) throw noRule(key);
        if (valueProblem(entry, entry.default, listsOf(entry, config)) !== null) throw noRule(key);
        return entry.default;
    };
    const leaf = (key: string): unknown => {
        const entry = entryOf(key);
        const held = heldAt(config, key, problems);
        if (!held.present) return defaultOf(entry, key);
        const problem = valueProblem(entry, held.value, listsOf(entry, config));
        if (problem === null) return held.value;
        problems.push({ key, where: 'value', problem, spec: entry });
        return defaultOf(entry, key);
    };
    const family = (key: string): [string, unknown][] => {
        const entry = entryOf(key);
        const keySpec = entry.fields === undefined ? undefined : byKey(entry.fields, 'key');
        const valueSpec = entry.fields === undefined ? undefined : byKey(entry.fields, 'value');
        if (keySpec === undefined || valueSpec === undefined) throw noRule(key);
        const held = heldAt(config, key, problems);
        if (!held.present || held.value === null) return [];
        const map = readAs(mapShape, held.value);
        if (map === null) {
            problems.push({ key, where: 'family' });
            return [];
        }
        const members: [string, unknown][] = [];
        for (const [name, value] of Object.entries(map)) {
            const wrongKey = valueProblem(keySpec, name);
            const wrongValue = wrongKey === null ? valueProblem(valueSpec, value) : null;
            const problem = wrongKey ?? wrongValue;
            if (problem === null) {
                members.push([name, value]);
                continue;
            }
            const spec = wrongKey === null ? valueSpec : keySpec;
            problems.push({ key: `${key}.${name}`, where: 'entry', problem, spec });
        }
        return members;
    };
    return {
        number: (key) => {
            const value = leaf(key);
            if (typeof value !== 'number') throw noRule(key);
            return value;
        },
        flag: (key) => {
            const value = leaf(key);
            if (typeof value !== 'boolean') throw noRule(key);
            return value;
        },
        text: (key) => {
            const value = leaf(key);
            if (typeof value !== 'string') throw noRule(key);
            return value;
        },
        strings: (key) => {
            const value = leaf(key);
            if (!Array.isArray(value) || !value.every((one) => typeof one === 'string')) {
                throw noRule(key);
            }
            return value;
        },
        family
    };
}

/** The Live HPC settings of config/behavior.yml. */
export type SlurmSettings = {
    /** The key of the cluster entry of registries/resources.yml the poller queries. */
    resource: string;
    days: number;
    pollMin: number;
    quotaMin: number;
    prewarm: boolean;
};

/** Read `slurm:`'s five keys, each its default when it is missing or wrong. */
export function slurmSettings(
    config: Record<string, unknown>,
    problems: SettingProblem[] = []
): SlurmSettings {
    const read = settingReader(config, problems);
    return {
        resource: read.text('slurm.resource'),
        days: read.number('slurm.days'),
        pollMin: read.number('slurm.poll_min'),
        quotaMin: read.number('slurm.quota_min'),
        prewarm: read.flag('slurm.prewarm')
    };
}

/** The calendar connector's settings of config/behavior.yml. */
export type CalendarSettings = {
    pollMin: number;
    /** Days before now the calendar window opens. */
    daysBack: number;
    /** Days after now the calendar window closes. */
    daysAhead: number;
};

/** Read `calendar:`'s three keys, each its default when it is missing or wrong. */
export function calendarSettings(
    config: Record<string, unknown>,
    problems: SettingProblem[] = []
): CalendarSettings {
    const read = settingReader(config, problems);
    return {
        pollMin: read.number('calendar.poll_min'),
        daysBack: read.number('calendar.days_back'),
        daysAhead: read.number('calendar.days_ahead')
    };
}

/** The search settings of config/behavior.yml. */
export type SearchSettings = {
    /** How many hits one answer carries before it says it was cut. */
    maxHits: number;
    /** How long one root's search is given, in seconds. */
    timeoutS: number;
};

/** Read `search:`'s two keys, each its default when it is missing or wrong. */
export function searchSettings(
    config: Record<string, unknown>,
    problems: SettingProblem[] = []
): SearchSettings {
    const read = settingReader(config, problems);
    return { maxHits: read.number('search.max_hits'), timeoutS: read.number('search.timeout_s') };
}

/** The Literature search settings of config/behavior.yml. */
export type LiteratureSettings = {
    /** How long one source is given to answer a request, in seconds. */
    timeoutS: number;
    /** How many hits one page asks of each source. */
    perSource: number;
    /** How long an answer is kept for the same request, in minutes; 0 keeps none. */
    cacheMin: number;
};

/** Read `literature:`'s three keys, each its default when it is missing or wrong. */
export function literatureSettings(
    config: Record<string, unknown>,
    problems: SettingProblem[] = []
): LiteratureSettings {
    const read = settingReader(config, problems);
    return {
        timeoutS: read.number('literature.timeout_s'),
        perSource: read.number('literature.per_source'),
        cacheMin: read.number('literature.cache_min')
    };
}

/** The open action's settings of config/behavior.yml. */
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

/** The mail connector's settings of config/behavior.yml. */
export type MailSettings = {
    pollMin: number;
    /** How many threads each of the plate's three signals is read at most. */
    perSignal: number;
};

/** Read `mail:`'s two keys, each its default when it is missing or wrong. */
export function mailSettings(
    config: Record<string, unknown>,
    problems: SettingProblem[] = []
): MailSettings {
    const read = settingReader(config, problems);
    return { pollMin: read.number('mail.poll_min'), perSignal: read.number('mail.per_signal') };
}

/**
 * The folders `apps.closed_paths` names, which `open({ file })` refuses for every app. `folders` is
 * null while the key is missing or is not a list of strings, and every file target is then closed;
 * `shaped` is false for that and for a list holding an entry that is not a folder path, which is
 * left out while the others apply.
 */
export type ClosedPaths = { folders: string[] | null; shaped: boolean };

/** The limits of the `apps:` block of config/behavior.yml and the folders closed to `open`. */
export type AppsSettings = {
    connectTimeoutS: number;
    stateMaxKb: number;
    storeMaxKb: number;
    writesPerMin: number;
    opensPerMin: number;
    keysPerS: number;
    maxFiles: number;
    maxMb: number;
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

/** Read `apps:`'s eight limits, each its default when it is missing or wrong, and `closed_paths`.
 * */
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
        maxFiles: read.number('apps.max_files'),
        maxMb: read.number('apps.max_mb'),
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

/**
 * Read `usage_tiers:`, a map of plan id to label, leaving out each entry the catalog's fields
 * refuse. The map keeps an own `__proto__` key as the file holds it.
 */
export function usageTiers(
    config: Record<string, unknown>,
    problems: SettingProblem[] = []
): Record<string, string> {
    const members = settingReader(config, problems).family('usage_tiers');
    const labels = members.map(([name, label]): [string, string] => {
        if (typeof label !== 'string') throw noRule('usage_tiers');
        return [name, label];
    });
    return Object.fromEntries(labels);
}

/** The usage refresher's settings of config/behavior.yml. */
export type RefreshSettings = { refreshMin: number; model: string };

/** Read `usage_refresh_min` and `usage_refresh_model`, each its default when missing or wrong. */
export function refreshSettings(
    config: Record<string, unknown>,
    problems: SettingProblem[] = []
): RefreshSettings {
    const read = settingReader(config, problems);
    return {
        refreshMin: read.number('usage_refresh_min'),
        model: read.text('usage_refresh_model')
    };
}

/** Read `git.autofetch_minutes`, the minutes between two automatic fetches, 0 for none. */
export function autofetchMin(
    config: Record<string, unknown>,
    problems: SettingProblem[] = []
): number {
    return settingReader(config, problems).number('git.autofetch_minutes');
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

/** The Processes view's settings of config/behavior.yml. */
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

/** The LaTeX formatter of config/behavior.yml: the one Format Document runs, and each path. */
export type LatexFormatting = {
    formatter: Formatter;
    /** Each program's path; empty runs the program found on PATH. */
    paths: Record<Exclude<Formatter, 'none'>, string>;
};

/** Read `latex:`'s four formatter keys, each its default when it is missing or wrong. */
export function latexFormatting(
    config: Record<string, unknown>,
    problems: SettingProblem[] = []
): LatexFormatting {
    const read = settingReader(config, problems);
    const word = read.text('latex.formatter');
    const formatter = FORMATTERS.find((one) => one === word);
    if (formatter === undefined) throw noRule('latex.formatter');
    return {
        formatter,
        paths: {
            latexindent: read.text('latex.latexindent_path'),
            'tex-fmt': read.text('latex.tex_fmt_path'),
            badness: read.text('latex.badness_path')
        }
    };
}

/** Read `latex.auto_build`, what saving a .tex file does, its default when missing or wrong. */
export function latexAutoBuild(
    config: Record<string, unknown>,
    problems: SettingProblem[] = []
): string {
    return settingReader(config, problems).text('latex.auto_build');
}

/** Every reader above that takes the problems it finds, in the order of their blocks. */
const PROBLEM_READERS: ((
    config: Record<string, unknown>,
    problems: SettingProblem[]
) => unknown)[] = [
    slurmSettings,
    calendarSettings,
    searchSettings,
    literatureSettings,
    openSettings,
    confirmDelete,
    mailSettings,
    appsSettings,
    changesKeep,
    usageTiers,
    refreshSettings,
    autofetchMin,
    paintLimit,
    processesSettings,
    latexFormatting,
    latexAutoBuild
];

/**
 * What is wrong with every setting above in a merged map. A reader that finds no rule for a key
 * adds nothing: options.yml's own finding names that file.
 */
export function settingProblems(config: Record<string, unknown>): SettingProblem[] {
    const problems: SettingProblem[] = [];
    for (const read of PROBLEM_READERS) {
        try {
            read(config, problems);
        } catch {
            // A key the catalog holds no rule for is options.yml's finding, not a setting's.
        }
    }
    return problems;
}
