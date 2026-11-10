// Layer 1, data. The typed readers of the keys each hub's own settings file sets: the lists of
// sources.yml, the registries whose files are feeds (`feed_registries`), the update tasks the tray
// offers (`update_tasks`) and the documents a project card marks (`project_docs`), and the hub's
// layout (`hubLayout`): the folders a project keeps its code and its deck in (`code_dir`,
// `deck_dir`), the word of a scout run in the leads feed (`leads_run_word`), the LinkedIn folder
// and the start of a LinkedIn idea's name (`linkedin_dir`, `linkedin_idea_prefix`), the folders of
// its secrets and its notes (`secrets_dir`, `notes_dir`), what a deposit's generated .gitignore
// adds (`deposit.default_ignore`), where and what a Submit sends to the cluster
// (`slurm.cluster_folder`, `slurm.unsent`) and the conventions the audit holds the hub's documents
// to (`audit.markers`, `audit.provisional_mark`, `audit.skip_folders`). Each reads one hub's merged
// map by the options catalog's rule for its key, so a value the rule refuses is a problem naming
// the key and the value and the entry's default is read in its place, and a row or a word it
// refuses is a problem naming its place and is not read, a refused field of a row naming that its
// row is not read: a hub's bad row reaches neither the tray nor a card. The primary hub's problems
// are findings through settings/problems.ts, and another hub's through `hubRowFindings` of
// config/catalogs.ts, which its own read (data/index.ts, `readOtherHub`) calls.

import { LAST_RUNS, type FeedKind, type HubLayout, type LastRun } from '../../../model/index.ts';
import { valueProblem } from '../catalog/value-rule.ts';
import {
    checkedRows,
    heldAt,
    settingEntry,
    settingReader,
    type CheckedRow,
    type SettingProblem
} from './reader.ts';

/** The options file the three lists and the layout's folders and words are described in. */
const SOURCES = 'sources.yml';

/**
 * The feeds whose file is a YAML file a `collections:` entry names, the words `feed_registries`
 * may hold, which its catalog entry's options are; the LinkedIn feed is a folder and no entry's.
 */
const FEEDS: readonly FeedKind[] = ['leads', 'radar'];

/** One update task as a row of `update_tasks` describes it, with the row's dotted place. */
export type UpdateTaskRow = {
    task: string;
    label: string;
    note: string;
    view: string;
    /** Where the tray reads the task's last run from; null for a row that names no place. */
    lastRun: LastRun | null;
    at: string;
};

/** One document of `project_docs`: its path inside the project folder and its card label. */
export type ProjectDoc = { name: string; label: string };

/** The text a row's field holds, which the rule has already held to a text. */
function textAt(row: Record<string, unknown>, name: string): string {
    const held = row[name];
    return typeof held === 'string' ? held : '';
}

/**
 * The problem of a field of a read row that must not be empty, or null: the rule of a `text`
 * field takes the empty text, and the three readers here want words.
 */
function emptyField(
    config: Record<string, unknown>,
    key: string,
    at: string,
    row: Record<string, unknown>,
    names: readonly string[]
): SettingProblem | null {
    const empty = names.find((name) => textAt(row, name).trim() === '');
    if (empty === undefined) return null;
    const spec = settingEntry(config, key, SOURCES).fields?.[empty];
    if (spec === undefined) return null;
    return {
        key: `${at}.${empty}`,
        where: 'field',
        problem: { kind: 'empty' },
        spec,
        value: '',
        row: true
    };
}

/**
 * The registry words whose files are feeds, each once, in the file's order. A value that is not a
 * list of words is a problem and the default is read; a word the rule does not take is a problem
 * naming its place and that word alone is not read, and so is a word given twice.
 */
export function feedRegistries(
    config: Record<string, unknown>,
    problems: SettingProblem[] = []
): FeedKind[] {
    const key = 'feed_registries';
    const held = heldAt(config, key, problems);
    const entry = settingEntry(config, key, SOURCES);
    const words =
        held.present && valueProblem(entry, held.value)?.kind !== 'words'
            ? wordsOf(held.value)
            : settingReader(config, problems, SOURCES).strings(key);
    const kept: FeedKind[] = [];
    for (const [index, word] of words.entries()) {
        const feed = FEEDS.find((one) => one === word);
        if (feed === undefined) {
            problems.push({
                key: `${key}[${index}]`,
                where: 'entry',
                problem: { kind: 'choice', values: [...FEEDS] },
                spec: entry,
                value: word
            });
        } else if (kept.includes(feed)) {
            problems.push({ key, where: 'repeat', name: word });
        } else {
            kept.push(feed);
        }
    }
    return kept;
}

/** The words of a value the rule of a multi reads as words: a list of texts, or one text. */
function wordsOf(value: unknown): string[] {
    if (typeof value === 'string') return [value];
    return Array.isArray(value) ? value.filter((one) => typeof one === 'string') : [];
}

/**
 * The rows of the list of records at `key` by `checkedRows`. A value that is no list is a problem
 * naming the key and the value, and the rows of the entry's default are read in its place.
 */
function rowsOf(
    config: Record<string, unknown>,
    key: string,
    problems: SettingProblem[]
): CheckedRow[] {
    const held = heldAt(config, key, problems);
    if (!held.present || held.value === null || Array.isArray(held.value)) {
        return [...checkedRows(config, key, problems, [], SOURCES)];
    }
    const entry = settingEntry(config, key, SOURCES);
    problems.push({
        key,
        where: 'value',
        problem: { kind: 'records' },
        spec: entry,
        value: held.value
    });
    return [...checkedRows({ ...config, [key]: entry.default }, key, problems, [], SOURCES)];
}

/**
 * The rows of `update_tasks` the rule takes, in the file's order: a row whose task is not of its
 * form, whose label, note or view is empty or whose last_run is set to none of LAST_RUNS is a
 * problem and is not read, and so is a row whose task an earlier row took. A row with no last_run
 * is read with no place its last run is read from. A view the rule cannot check here, since the
 * views are the page's, is checked where the tray draws the row.
 */
export function updateTasks(
    config: Record<string, unknown>,
    problems: SettingProblem[] = []
): UpdateTaskRow[] {
    const key = 'update_tasks';
    const kept: UpdateTaskRow[] = [];
    for (const { at, row } of rowsOf(config, key, problems)) {
        const empty = emptyField(config, key, at, row, ['label', 'note', 'view']);
        if (empty !== null) {
            problems.push(empty);
            continue;
        }
        const task = textAt(row, 'task');
        // The rule has held a last_run that is set to one of LAST_RUNS, the words of its options.
        const lastRun = LAST_RUNS.find((one) => one === row.last_run) ?? null;
        if (kept.some((one) => one.task === task)) {
            problems.push({ key, where: 'repeat', name: task });
            continue;
        }
        kept.push({
            task,
            label: textAt(row, 'label'),
            note: textAt(row, 'note'),
            view: textAt(row, 'view'),
            lastRun,
            at
        });
    }
    return kept;
}

/**
 * The documents of `project_docs` the rule takes, in the file's order: a row whose name is not a
 * path inside the project folder or whose label is empty is a problem and is not read, and so is a
 * row whose name or label an earlier row took, since a card marks a document by its label.
 */
export function projectDocList(
    config: Record<string, unknown>,
    problems: SettingProblem[] = []
): ProjectDoc[] {
    const key = 'project_docs';
    const kept: ProjectDoc[] = [];
    for (const { at, row } of rowsOf(config, key, problems)) {
        const empty = emptyField(config, key, at, row, ['label']);
        if (empty !== null) {
            problems.push(empty);
            continue;
        }
        const name = textAt(row, 'name');
        const label = textAt(row, 'label');
        const taken = kept.some((one) => one.name === name)
            ? name
            : kept.some((one) => one.label === label)
              ? label
              : null;
        if (taken !== null) {
            problems.push({ key, where: 'repeat', name: taken });
            continue;
        }
        kept.push({ name, label });
    }
    return kept;
}

/**
 * The folder of secrets of a hub by its folder, its `secrets_dir`, read from the hub's settings as
 * `settings` gives them; the finding of a refused value is the finding passes'.
 */
export function secretsOf(
    settings: (dir: string) => { config: Record<string, unknown> }
): (dir: string) => string {
    return (dir) => hubLayout(settings(dir).config, []).secretsDir;
}

/**
 * The notes folder of a hub by its folder, its `notes_dir`, read from the hub's settings as
 * `settings` gives them; the finding of a refused value is the finding passes'.
 */
export function notesOf(
    settings: (dir: string) => { config: Record<string, unknown> }
): (dir: string) => string {
    return (dir) => hubLayout(settings(dir).config, []).notesDir;
}

/**
 * Read the layout of one hub's merged map, each value its options entry refuses a problem naming
 * the key and the value, and the entry's default read in its place. `portfolioConfigFrom`
 * (data/index.ts) reads it once per hub configuration and every reader of these keys takes it from
 * `PortfolioConfig.layout`; the finding passes run it over the same map with the list they word.
 */
export function hubLayout(config: Record<string, unknown>, problems: SettingProblem[]): HubLayout {
    const sources = settingReader(config, problems, SOURCES);
    const behavior = settingReader(config, problems);
    return {
        codeDir: sources.text('code_dir'),
        deckDir: sources.text('deck_dir'),
        leadsRunWord: sources.text('leads_run_word'),
        linkedinDir: sources.text('linkedin_dir'),
        linkedinIdeaPrefix: sources.text('linkedin_idea_prefix'),
        secretsDir: sources.text('secrets_dir'),
        notesDir: sources.text('notes_dir'),
        depositIgnored: behavior.strings('deposit.default_ignore'),
        clusterFolder: behavior.text('slurm.cluster_folder'),
        unsent: behavior.strings('slurm.unsent'),
        auditMarkers: behavior.strings('audit.markers'),
        provisionalMark: behavior.text('audit.provisional_mark'),
        auditSkipFolders: behavior.strings('audit.skip_folders')
    };
}
