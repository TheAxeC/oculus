// Layer 1, data. The typed readers of single settings out of the merged map: the cluster, the
// calendar, the search, the Literature search, the open list, the mail, the change log's length,
// the usage tiers and the refresh, the Processes view's program names, the LaTeX formatter and its
// auto build, the automatic fetch, the Trash confirmation and the editor's paint limit, and the
// repository scan depth of sources.yml, the one setting here that lives outside behavior.yml. Each
// reads a key by the rule of its entry in the options catalog (catalog/value-rule.ts), the same
// rule the Settings view and the server's write refuse a value by: a key that is missing is the
// entry's `default`, and a key whose value the rule refuses is the `default` too and comes back as
// a problem naming the key, so a typo costs one setting and the server starts. A reader throws only
// when the catalog holds no rule for a key it reads, or no default that reads, since without one no
// value can be read.

import { closedPathEntryOk } from '../../helpers/files/apps.ts';
import type { ProgramApps } from '../../helpers/files/opens-in-program.ts';
import { byKey } from '../../helpers/guards.ts';
import {
    AUTO_BUILDS,
    AUTO_CLEANS,
    FORMATTERS,
    RECIPE_DEFAULTS,
    REVERSE_SYNCTEX,
    TEXCOUNT_AUTORUNS,
    type AutoBuild,
    type AutoClean,
    type Formatter,
    type RecipeDefault,
    type ReverseSynctex,
    type TexcountAutorun
} from '../../prose/latex.ts';
import { mapShape, readAs } from '../../shapes/shapes.ts';
import {
    catalogOf,
    configItems,
    listedSources,
    type CatalogEntry,
    type FieldSpec
} from './catalog/options.ts';
import { valueProblem, type RuleLists, type ValueProblem } from './catalog/value-rule.ts';

/**
 * A setting the rule refuses, by the dotted key it was written at. `value` is a key whose default
 * is used, `entry` a member of a family that is not read, `field` a field of a record that is not
 * read; `spec` is the entry or field that holds the rule. `block` is a block that is not a map,
 * whose keys all take their defaults, and `family` a family that is not a map, none of whose
 * entries is read. `repeat` is a row of a list of records whose name an earlier row already took,
 * and `unnamed` a row with no name; neither is read. A `value` problem of a key outside
 * behavior.yml names its `file`.
 */
export type SettingProblem =
    | { key: string; where: 'block' | 'family' }
    | { key: string; where: 'repeat'; name: string }
    | { key: string; where: 'unnamed' }
    | {
          key: string;
          where: 'value' | 'entry' | 'field';
          problem: ValueProblem;
          spec: CatalogEntry;
          file?: string;
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
    for (const source of listedSources(entry)) {
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

/** The file the settings of the merged map are read from unless a reader names another. */
const BEHAVIOR = 'behavior.yml';

/** The entry of a key of config/behavior.yml in the merged map's catalog; throws without one. */
export function settingEntry(config: Record<string, unknown>, key: string): CatalogEntry {
    const entries = byKey(catalogOf(config), BEHAVIOR);
    const entry = entries === undefined ? undefined : byKey(entries, key);
    if (entry === undefined) throw noRule(key);
    return entry;
}

/**
 * A reader over the merged map, pushing what it finds wrong to `problems`. It reads the entries of
 * `file` in the options catalog, behavior.yml unless the caller names another, and a problem of a
 * leaf names that file when it is not behavior.yml.
 */
export function settingReader(
    config: Record<string, unknown>,
    problems: SettingProblem[] = [],
    file: string = BEHAVIOR
): SettingReader {
    const entries = byKey(catalogOf(config), file);
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
        problems.push(
            file === BEHAVIOR
                ? { key, where: 'value', problem, spec: entry }
                : { key, where: 'value', problem, spec: entry, file }
        );
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
 * Read `repository_scan_depth` of config/sources.yml: how many folder levels below a root the
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

/** The word `latex.auto_build` holds, which the catalog's choice keeps to the three words. */
function latexAutoBuild(
    config: Record<string, unknown>,
    problems: SettingProblem[] = []
): AutoBuild {
    const word = settingReader(config, problems).text('latex.auto_build');
    const found = AUTO_BUILDS.find((one) => one === word);
    if (found === undefined) throw noRule('latex.auto_build');
    return found;
}

/** One tool of `latex.tools`: a program and its arguments, called by its name. */
export type LatexTool = { name: string; command: string; args: string[] };

/** One recipe of `latex.recipes`: the tools run one after the other, by tool name. */
export type LatexRecipe = { name: string; tools: string[] };

/** What a LaTeX build and its follow-ups are set by, every key of `latex:` but the formatter's. */
export type LatexBuilding = {
    recipes: LatexRecipe[];
    tools: LatexTool[];
    recipeDefault: RecipeDefault;
    outDir: string;
    auxDir: string;
    autoBuild: AutoBuild;
    autoBuildIntervalMs: number;
    cleanAndRetry: boolean;
    autoClean: AutoClean;
    synctexPath: string;
    reverseSynctex: ReverseSynctex;
    texcountAutorun: TexcountAutorun;
    contextMenu: boolean;
    texlabPath: string;
    unimathSymbols: boolean;
    includegraphicsPreview: boolean;
};

/** The word of a choice key, which the catalog's `values` already holds to the list's words. */
function wordOf<T extends string>(list: readonly T[], word: string, key: string): T {
    const found = list.find((one) => one === word);
    if (found === undefined) throw noRule(key);
    return found;
}

/** A field of a records entry: its spec, which the rows are read against. */
function fieldOf(
    fields: Record<string, FieldSpec> | undefined,
    name: string,
    key: string
): FieldSpec {
    const spec = fields === undefined ? undefined : byKey(fields, name);
    if (spec === undefined) throw noRule(key);
    return spec;
}

/** The rows a records entry holds: its list, or none when the key is missing or no list. */
function rowsOf(
    config: Record<string, unknown>,
    key: string,
    problems: SettingProblem[]
): unknown[] {
    const held = heldAt(config, key, problems);
    if (!held.present || held.value === null) return [];
    if (!Array.isArray(held.value)) {
        problems.push({ key, where: 'family' });
        return [];
    }
    return held.value;
}

/**
 * The rows of a list of records, each read by the entry's own fields: a row that is no map, or
 * whose `name` or any other field the rule refuses is not read and comes back as a problem at
 * `<key>[<index>]`, a row with no name is not read, and a row repeating a name an earlier row took
 * is not read either. `pick` takes a row's fields out of it, and `refuse` names a problem a read
 * row has beyond its fields' own, which leaves the row out.
 */
function recordRows<T extends { name: string }>(
    config: Record<string, unknown>,
    key: string,
    problems: SettingProblem[],
    pick: (row: Record<string, unknown>) => T,
    refuse: (one: T, at: string) => SettingProblem | null = () => null
): T[] {
    const entry = settingEntry(config, key);
    const named = new Set<string>();
    const kept: T[] = [];
    rowsOf(config, key, problems).forEach((raw, index) => {
        const at = `${key}[${index}]`;
        const row = readAs(mapShape, raw);
        if (row === null) {
            problems.push({ key: at, where: 'entry', problem: { kind: 'records' }, spec: entry });
            return;
        }
        for (const [name, spec] of Object.entries(entry.fields ?? {})) {
            const problem = valueProblem(spec, row[name]);
            if (problem !== null) {
                problems.push({ key: `${at}.${name}`, where: 'field', problem, spec });
                return;
            }
        }
        const one = pick(row);
        if (one.name === '') {
            problems.push({ key: at, where: 'unnamed' });
            return;
        }
        if (named.has(one.name)) {
            problems.push({ key, where: 'repeat', name: one.name });
            return;
        }
        const refused = refuse(one, at);
        if (refused !== null) {
            problems.push(refused);
            return;
        }
        named.add(one.name);
        kept.push(one);
    });
    return kept;
}

/** The text items of a field the rule has already held to a list of texts. */
function itemsAt(row: Record<string, unknown>, name: string): string[] {
    const held = row[name];
    return Array.isArray(held) ? held.filter((one) => typeof one === 'string') : [];
}

/** The text a field the rule has already held to a text holds. */
function textAt(row: Record<string, unknown>, name: string): string {
    const held = row[name];
    return typeof held === 'string' ? held : '';
}

/**
 * Read the tools of `latex.tools`, then the recipes of `latex.recipes` against them: a tool with
 * no program is not read, and neither is a recipe that names no tool or a tool the list does not
 * hold.
 */
function latexRecipes(
    config: Record<string, unknown>,
    problems: SettingProblem[]
): { recipes: LatexRecipe[]; tools: LatexTool[] } {
    const commandSpec = fieldOf(
        settingEntry(config, 'latex.tools').fields,
        'command',
        'latex.tools'
    );
    const tools = recordRows<LatexTool>(
        config,
        'latex.tools',
        problems,
        (row) => ({
            name: textAt(row, 'name'),
            command: textAt(row, 'command'),
            args: itemsAt(row, 'args')
        }),
        (tool, at) =>
            tool.command === ''
                ? {
                      key: `${at}.command`,
                      where: 'field',
                      problem: { kind: 'empty' },
                      spec: commandSpec
                  }
                : null
    );
    const known = tools.map((tool) => tool.name);
    const toolsSpec = fieldOf(
        settingEntry(config, 'latex.recipes').fields,
        'tools',
        'latex.recipes'
    );
    const recipes = recordRows<LatexRecipe>(
        config,
        'latex.recipes',
        problems,
        (row) => ({ name: textAt(row, 'name'), tools: itemsAt(row, 'tools') }),
        (recipe, at) =>
            recipe.tools.length > 0 && recipe.tools.every((name) => known.includes(name))
                ? null
                : {
                      key: `${at}.tools`,
                      where: 'field',
                      problem: { kind: 'choice', values: known },
                      spec: toolsSpec
                  }
    );
    return { recipes, tools };
}

/** Read every key of `latex:` a build, its follow-ups and its SyncTeX are set by. */
export function latexBuild(
    config: Record<string, unknown>,
    problems: SettingProblem[] = []
): LatexBuilding {
    const read = settingReader(config, problems);
    return {
        ...latexRecipes(config, problems),
        recipeDefault: wordOf(
            RECIPE_DEFAULTS,
            read.text('latex.recipe_default'),
            'latex.recipe_default'
        ),
        outDir: read.text('latex.out_dir'),
        auxDir: read.text('latex.aux_dir'),
        autoBuild: latexAutoBuild(config, problems),
        autoBuildIntervalMs: read.number('latex.auto_build_interval_ms'),
        cleanAndRetry: read.flag('latex.clean_and_retry'),
        autoClean: wordOf(AUTO_CLEANS, read.text('latex.auto_clean'), 'latex.auto_clean'),
        synctexPath: read.text('latex.synctex_path'),
        reverseSynctex: wordOf(
            REVERSE_SYNCTEX,
            read.text('latex.reverse_synctex'),
            'latex.reverse_synctex'
        ),
        texcountAutorun: wordOf(
            TEXCOUNT_AUTORUNS,
            read.text('latex.texcount_autorun'),
            'latex.texcount_autorun'
        ),
        contextMenu: read.flag('latex.context_menu'),
        texlabPath: read.text('latex.texlab_path'),
        unimathSymbols: read.flag('latex.unimath_symbols'),
        includegraphicsPreview: read.flag('latex.includegraphics_preview')
    };
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
    repositoryScanDepth,
    paintLimit,
    processesSettings,
    latexFormatting,
    latexBuild
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
