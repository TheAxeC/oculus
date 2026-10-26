// Layer 1, data. The rule for one entry of the schedules file, `schedules.yml` in the hub's
// `.oculus` folder, shared by the update tray's dialog, which checks an entry before it sends it,
// and by the server, which reads the file and runs the timer by the same rule, so the two cannot
// disagree on what runs. It looks at the shape and the values of an entry and nothing on the
// machine: the checks that need the disk (a folder that exists, a command the repository's
// `.oculus/commands.yml` holds, a repository the file browser serves) are the server's
// (server/machine/runs/schedules/file.ts).
//
// An entry is `{ name, runs, when, paused?, unattended? }`. `runs` holds exactly one of `task` (an
// update task, with the `hub` whose task it is, the primary's when `hub` is absent), `command` (the
// name of a command of a repository's `.oculus/commands.yml`, with that repository's `folder`) or
// `prompt` (the first message of a Claude session, with the `folder` the session starts in). A
// `hub` is a name as written, compared with the hubs' names by the server's disk checks, so text
// that is empty or only white space, or a value that is not text, is `hub-wrong` here. An entry
// that is not a map, or whose name or `runs` has no readable shape, has no entry to edit; one whose
// shape reads but whose value is refused keeps its entry, so its row can be edited, and says why it
// does not run. Of several problems an entry has, the first in the order of the checks below is the
// one it says.

import type {
    ScheduleEntry,
    ScheduleProblem,
    ScheduleWord,
    UnchosenKey
} from '../../model/index.ts';
import { byKey, isMap } from '../guards.ts';
import { cronRuns } from './cron.ts';
import { UPDATE_TASKS, isUpdateTask } from './tasks.ts';

/** The largest prompt a Claude session starts with, far past anything typed into a box. */
export const PROMPT_MAX = 100_000;

/** The longest name a schedule has: it is the record's key and a prompt run's terminal name. */
const SCHEDULE_NAME_MAX = 80;

/** The keys of an entry. */
const ENTRY_KEYS = ['name', 'runs', 'when', 'paused', 'unattended'];

/** The keys of `runs` for each of the three things a schedule runs. */
const RUNS_KEYS = {
    task: ['task', 'hub'],
    command: ['command', 'folder'],
    prompt: ['prompt', 'folder']
};

type Kind = keyof typeof RUNS_KEYS;

/** What `readEntry` answers: the entry when its shape reads, and the first problem it has. */
export type EntryRead =
    | { entry: ScheduleEntry; problem: ScheduleProblem | null }
    | { entry: null; problem: ScheduleProblem };

/** The text a name is compared by in the clash rule: trimmed, with the case ignored. */
export function nameKey(name: string): string {
    return name.trim().toLowerCase();
}

/** A control character other than a tab or a new line, which a prompt may not hold. */
// eslint-disable-next-line no-control-regex
const PROMPT_CONTROL = /[\u0000-\u0008\u000b-\u001f\u007f]/;

/** Any control character, which a name may not hold. */
// eslint-disable-next-line no-control-regex
const NAME_CONTROL = /[\u0000-\u001f\u007f]/;

function problem(word: ScheduleWord, ...names: string[]): ScheduleProblem {
    return { word, names };
}

/** A value as the file writes it, for a sentence that names it. */
function written(value: unknown): string {
    if (Array.isArray(value)) return `[${value.map(written).join(', ')}]`;
    if (isMap(value)) {
        const items = Object.entries(value).map(([key, one]) => `${key}: ${written(one)}`);
        return `{ ${items.join(', ')} }`;
    }
    return typeof value === 'string' ? value : String(value);
}

/**
 * The name a raw entry holds as its row shows it: the text trimmed, a number as its text, and the
 * empty text when the entry is no map or holds no name of either kind.
 */
export function nameOf(raw: unknown): string {
    if (!isMap(raw)) return '';
    const name = byKey(raw, 'name');
    return typeof name === 'string' || typeof name === 'number' ? String(name).trim() : '';
}

/**
 * The name an entry holds: its text, a number as its text, and the problem with it. A name that is
 * neither text nor a number has no shape, so the entry has nothing to edit.
 */
function readName(raw: unknown): {
    name: string;
    problem: ScheduleProblem | null;
    shaped: boolean;
} {
    if (raw === undefined || raw === null) {
        return { name: '', problem: problem('name-missing'), shaped: true };
    }
    if (typeof raw !== 'string' && typeof raw !== 'number') {
        return { name: '', problem: problem('name-wrong', written(raw)), shaped: false };
    }
    const name = String(raw).trim();
    if (name === '') return { name, problem: problem('name-missing'), shaped: true };
    const bad = name.length > SCHEDULE_NAME_MAX || NAME_CONTROL.test(name);
    return { name, problem: bad ? problem('name-wrong', name) : null, shaped: true };
}

/**
 * The one of `task`, `command` and `prompt` that `runs` holds, or null when it holds none or more.
 */
function kindOf(runs: Record<string, unknown>): Kind | null {
    const held = (Object.keys(RUNS_KEYS) as Kind[]).filter((kind) => Object.hasOwn(runs, kind));
    return held.length === 1 ? held[0] : null;
}

/** The folder a command or a prompt runs in, or the problem with it. */
function readFolder(runs: Record<string, unknown>): { folder: string } | ScheduleProblem {
    const raw = byKey(runs, 'folder');
    if (raw === undefined || raw === null || raw === '') return problem('folder-empty');
    if (typeof raw !== 'string') return problem('folder-wrong', written(raw));
    const path = raw.startsWith('/') || raw.startsWith('~/') || raw === 'hub';
    return path ? { folder: raw } : problem('folder-wrong', raw);
}

/**
 * The hub a task's `runs` names: none when `hub` is absent, the text as written, or the problem
 * with a value that is not text or is text that is empty or only white space.
 */
function readHub(runs: Record<string, unknown>): { hub?: string } | ScheduleProblem {
    if (!Object.hasOwn(runs, 'hub')) return {};
    const raw = byKey(runs, 'hub');
    if (typeof raw !== 'string' || raw.trim() === '') return problem('hub-wrong', written(raw));
    return { hub: raw };
}

/** What `runs` holds, with the first problem its values have; null when its shape does not read. */
function readRuns(
    raw: unknown
): { target: ScheduleEntry['runs']; problem: ScheduleProblem | null } | null {
    if (!isMap(raw)) return null;
    const kind = kindOf(raw);
    if (kind === null) return null;
    const unknown = Object.keys(raw).find((key) => !RUNS_KEYS[kind].includes(key));
    const keyProblem = unknown === undefined ? null : problem('key-unknown', unknown);
    if (kind === 'task') {
        const task = byKey(raw, 'task');
        if (!isUpdateTask(task)) {
            const named = problem('update-task-unknown', written(task), UPDATE_TASKS.join(', '));
            return { target: { task: UPDATE_TASKS[0] }, problem: named };
        }
        const hub = readHub(raw);
        if ('word' in hub) return { target: { task }, problem: keyProblem ?? hub };
        return { target: { task, ...hub }, problem: keyProblem };
    }
    const text = byKey(raw, kind);
    if (typeof text !== 'string' || (kind === 'command' && text.trim() === '')) return null;
    const folder = readFolder(raw);
    const where = 'folder' in folder ? folder.folder : '';
    if (kind === 'command') {
        const first = keyProblem ?? ('folder' in folder ? null : folder);
        return { target: { command: text, folder: where }, problem: first };
    }
    let first: ScheduleProblem | null = keyProblem ?? ('folder' in folder ? null : folder);
    if (first === null && text.trim() === '') first = problem('prompt-empty');
    else if (first === null && text.length > PROMPT_MAX) {
        first = problem('prompt-too-long', String(PROMPT_MAX));
    } else if (first === null && PROMPT_CONTROL.test(text)) first = problem('prompt-control');
    return { target: { prompt: text, folder: where }, problem: first };
}

/** The pattern an entry holds, and the problem with it: Off is the empty pattern. */
function readWhen(raw: unknown): { when: string; problem: ScheduleProblem | null } {
    if (raw === undefined || raw === null || raw === '') return { when: '', problem: null };
    if (typeof raw !== 'string') {
        const named = written(raw);
        return { when: named, problem: problem('when-unreadable', named) };
    }
    const runs = cronRuns(raw, 1, new Date());
    if (runs.ok) return { when: raw, problem: null };
    return {
        when: raw,
        problem: problem(runs.why === 'never' ? 'when-never' : 'when-unreadable', raw)
    };
}

/** A flag of an entry: false when absent, and the problem when it is not true or false. */
function readFlag(
    raw: Record<string, unknown>,
    key: string
): { value: boolean; problem: ScheduleProblem | null } {
    const value = byKey(raw, key);
    if (value === undefined) return { value: false, problem: null };
    if (typeof value === 'boolean') return { value, problem: null };
    return { value: false, problem: problem('flag-wrong', key) };
}

/**
 * The keys of a raw entry whose value is there and does not read: the task of a `runs` that names
 * a task, when it is not an update task, its hub when that is `hub-wrong`, and an `unattended`
 * that is not true or false. The reader gives each a default (the first task, the primary's hub,
 * off), which the entry shows but the file does not hold, so the dialog opens such a key with no
 * value chosen and a save writes the one chosen.
 */
export function unchosenKeys(raw: unknown): UnchosenKey[] {
    if (!isMap(raw)) return [];
    const keys: UnchosenKey[] = [];
    const runs = byKey(raw, 'runs');
    if (isMap(runs) && kindOf(runs) === 'task') {
        if (!isUpdateTask(byKey(runs, 'task'))) keys.push('task');
        if ('word' in readHub(runs)) keys.push('hub');
    }
    const flag = byKey(raw, 'unattended');
    if (flag !== undefined && typeof flag !== 'boolean') keys.push('unattended');
    return keys;
}

/**
 * Read one entry of the file from its parsed value. The answer holds the entry when its name and
 * `runs` have a shape, and the first problem the entry has, or null when it runs. The names a
 * sentence needs are in the problem; the position `entry-wrong` is about is the reader's to add,
 * since a value does not know where it was found.
 */
export function readEntry(raw: unknown): EntryRead {
    if (!isMap(raw)) return { entry: null, problem: problem('entry-wrong') };
    const name = readName(byKey(raw, 'name'));
    const runs = readRuns(byKey(raw, 'runs'));
    const strange = Object.keys(raw).find((key) => !ENTRY_KEYS.includes(key));
    const when = readWhen(byKey(raw, 'when'));
    const paused = readFlag(raw, 'paused');
    const unattended = readFlag(raw, 'unattended');
    const command = runs !== null && 'command' in runs.target;
    const refused = command && unattended.value ? problem('unattended-command') : null;
    const first =
        name.problem ??
        (strange === undefined ? null : problem('key-unknown', strange)) ??
        (runs === null ? problem('runs-wrong') : runs.problem) ??
        when.problem ??
        paused.problem ??
        unattended.problem ??
        refused;
    if (!name.shaped || runs === null) {
        return { entry: null, problem: first ?? problem('runs-wrong') };
    }
    const entry: ScheduleEntry = {
        name: name.name,
        runs: runs.target,
        when: when.when,
        paused: paused.value,
        unattended: unattended.value
    };
    return { entry, problem: first };
}
