// Layer 2, client state. The update tray's reader and writer of the single `schedule` entity: the
// schedules file as rows with every word and time already formatted, the lines for a file that does
// not read, the dialog's draft with its preview and its checks, and the posts to /api/schedules
// (save, delete, pause, resume, run). The tray, its list and its dialog draw these and read neither
// the payload nor the rules themselves, so what the dialog refuses and what the server refuses are
// one rule (data/helpers/run/schedules.ts) said in the catalog's words.
//
// The dialog's draft is held here, one per client, since two places open it: the tray's
// "Schedule..." beside a task and the command bar's "Schedule..." on a saved command, and the
// second does not draw the tray. Opening it fills the draft; the dialog edits it through `edit`,
// and a save that lands, or a close, puts it away.

import { z } from 'zod';
import { cronRuns } from '../../../../data/helpers/run/cron.ts';
import { nameKey, readEntry } from '../../../../data/helpers/run/schedules.ts';
import { UPDATE_TASKS, type UpdateTask } from '../../../../data/helpers/run/tasks.ts';
import type { ScheduleRow, Terminal, UnchosenKey } from '../../../../data/model/index.ts';
import { readAs } from '../../../../data/shapes/shapes.ts';
import {
    failedAnswer,
    unreachableAnswer,
    unreadableAnswer
} from '../../../shared/answers/answers.ts';
import type { EntitiesStore, WritesStore } from '../../../shared/stores/shapes.ts';
import { ahead, stamp } from '../../../shared/words/format.ts';
import { t } from '../../../shared/words/text.ts';
import { whenOf, patternOf, WEEK_DAYS, WHEN_CHOICES, type WhenChoice } from './schedule-when.ts';
import { wordSentence } from './schedule-words.ts';

/** How many of an entry's latest runs a row lists. */
const RUNS_SHOWN = 5;

/** How many characters of a prompt's first line a row shows. */
const PROMPT_SHOWN = 60;

/** How many runs the dialog previews. */
const PREVIEWED = 3;

/** What an entry runs, as the dialog chooses it. */
const KINDS = ['task', 'command', 'prompt'] as const;
type RunsKind = (typeof KINDS)[number];

/** The dialog's draft of one entry. */
type ScheduleDraft = {
    /** The entry being edited, by its position and the name read there; null for a new one. */
    was: { at: number; name: string } | null;
    name: string;
    kind: RunsKind;
    /** The chosen update task; '' while the entry's own value does not read and none is chosen. */
    task: UpdateTask | '';
    /** The chosen saved command, as `commands()` keys it; '' is none. */
    commandKey: string;
    /** The folder a prompt starts in: `hub`, an absolute path or a path under `~/`. */
    folder: string;
    prompt: string;
    when: WhenChoice;
    /** HH:MM, for Every day and Weekly. */
    time: string;
    /** One flag per day, Monday first, for Weekly. */
    days: boolean[];
    /** The cron pattern, for Custom. */
    pattern: string;
    /** The choice; null while the entry's own value does not read and none is chosen. */
    unattended: boolean | null;
    /** The keys the entry being edited holds a value for that does not read. */
    unchosen: UnchosenKey[];
    /** Kept from the entry being edited, which the dialog does not change. */
    paused: boolean;
};

/** What opens the dialog: an entry to edit, or the values a new entry starts with. */
type DialogFill = {
    /** The position of an entry to edit. */
    at?: number;
    name?: string;
    task?: UpdateTask;
    /** A saved command's name, with the `folder` of its repository. */
    command?: string;
    folder?: string;
};

/** One run of an entry as a row lists it. */
type ScheduleRunView = {
    /** A key no other run of the row has: the run's time with its place in the list. */
    key: string;
    /** The run as a line: its time, what started it and how it went. */
    text: string;
    /** The terminal the run started or found going, while the page still lists it. */
    terminal: Terminal | null;
};

/** One entry of the file as the tray draws it. */
type ScheduleRowView = {
    key: string;
    /** The position in the file, which a write names the entry by. */
    at: number;
    name: string;
    /** Whether the entry's shape reads, so it has values to edit. */
    readable: boolean;
    /** What it runs, in words. */
    what: string;
    /** The pattern as written, or the word for none. */
    pattern: string;
    paused: boolean;
    /** The sentence for why it does not run, or ''. */
    problem: string;
    /** `Next: <day and time>`, or ''. */
    next: string;
    runs: ScheduleRunView[];
};

/** The part of a row a write names an entry by: its position and the name read there. */
type RowRef = Pick<ScheduleRowView, 'at' | 'name'>;

/** What a save, a delete, a pause or a resume, or a Run now, came to. */
type ScheduleAnswer =
    { ok: true; terminal: string | null; skipped: string } | { ok: false; error: string };

/** One choice of a box the dialog draws: an id the draft holds and the words beside it. */
type CommandChoice = { id: string; label: string };

export type ScheduleStore = {
    /** The entries of the file, in its order; none before the first payload. */
    rows: () => ScheduleRowView[];
    /** The line for a file that reads and holds no entry; '' otherwise. */
    none: () => string;
    /** One line for each file that does not read. */
    unread: () => string[];
    /** The earliest next run of the entries that run a task, as a line of the task's row. */
    nextOfTask: (kind: UpdateTask) => string;
    /** A task's label in the tray. */
    taskLabel: (kind: UpdateTask) => string;
    /** The choices of the dialog's Runs, Task and When boxes, and the names of the seven days. */
    kinds: () => CommandChoice[];
    tasks: () => CommandChoice[];
    whens: () => CommandChoice[];
    dayNames: () => string[];
    /** The saved commands the dialog offers, with the draft's own when the list lacks it. */
    commands: () => CommandChoice[];
    /** `hub` and the other folders a prompt may start in. */
    folders: () => string[];
    dialog: () => ScheduleDraft | null;
    openDialog: (fill: DialogFill) => void;
    closeDialog: () => void;
    /** Change fields of the open draft. */
    edit: (patch: Partial<Omit<ScheduleDraft, 'was'>>) => void;
    /** Set one of the draft's three boxes of choices from the text a box hands on. */
    choose: (box: 'kind' | 'task' | 'when', value: string) => void;
    /** Choose a saved command by its key in `commands()`. */
    pickCommand: (key: string) => void;
    /** The next runs of the draft's pattern, or why it has none; '' for Off. */
    preview: (draft: ScheduleDraft) => string;
    /** The sentences for every problem the draft has; none when it can be saved. */
    check: (draft: ScheduleDraft) => string[];
    save: (draft: ScheduleDraft) => Promise<ScheduleAnswer>;
    remove: (row: RowRef) => Promise<ScheduleAnswer>;
    pause: (row: RowRef) => Promise<ScheduleAnswer>;
    resume: (row: RowRef) => Promise<ScheduleAnswer>;
    runNow: (row: RowRef) => Promise<ScheduleAnswer>;
};

/** The server's answer to a POST. */
const answerShape = z.object({
    error: z.string().optional().catch(undefined),
    names: z.array(z.string()).optional().catch(undefined),
    terminal: z.string().optional().catch(undefined),
    skipped: z.string().nullable().optional().catch(undefined)
});

/** The last segment of a path, for a line that names a folder. */
function lastSegment(path: string): string {
    const trimmed = path.replace(/\/+$/, '');
    return trimmed.slice(trimmed.lastIndexOf('/') + 1) || path;
}

/** The first line of a prompt, cut for a row. */
function firstLine(prompt: string): string {
    const line = (prompt.split('\n')[0] ?? '').trim();
    return line.length > PROMPT_SHOWN ? `${line.slice(0, PROMPT_SHOWN)}...` : line;
}

/** A saved command's key in the dialog's list: its repository and its name. */
function commandKeyOf(folder: string, name: string): string {
    return JSON.stringify([folder, name]);
}

/** The folder and the name a key stands for, or null for a key that is none. */
function readKey(key: string): { folder: string; name: string } | null {
    try {
        const read: unknown = JSON.parse(key);
        if (Array.isArray(read) && typeof read[0] === 'string' && typeof read[1] === 'string') {
            return { folder: read[0], name: read[1] };
        }
    } catch {
        return null;
    }
    return null;
}

const TASK_LABELS: Record<UpdateTask, () => string> = {
    litwatch: () => t('app.tasks.lit_label'),
    scout: () => t('app.tasks.scout_label'),
    linkedin: () => t('app.tasks.linkedin_label'),
    inbox: () => t('app.tasks.inbox_label')
};

const TRIGGERS = {
    schedule: () => t('app.schedules.trigger_schedule'),
    'catch-up': () => t('app.schedules.trigger_catch_up'),
    hand: () => t('app.schedules.trigger_hand')
};

const KIND_LABELS: Record<RunsKind, () => string> = {
    task: () => t('app.schedules.kind_task'),
    command: () => t('app.schedules.kind_command'),
    prompt: () => t('app.schedules.kind_prompt')
};

const WHEN_LABELS: Record<WhenChoice, () => string> = {
    off: () => t('app.schedules.when_off'),
    hour: () => t('app.schedules.when_hour'),
    day: () => t('app.schedules.when_day'),
    week: () => t('app.schedules.when_week'),
    custom: () => t('app.schedules.when_custom')
};

const DAY_LABELS: Record<(typeof WEEK_DAYS)[number], () => string> = {
    mon: () => t('app.schedules.day_mon'),
    tue: () => t('app.schedules.day_tue'),
    wed: () => t('app.schedules.day_wed'),
    thu: () => t('app.schedules.day_thu'),
    fri: () => t('app.schedules.day_fri'),
    sat: () => t('app.schedules.day_sat'),
    sun: () => t('app.schedules.day_sun')
};

const REFUSED = {
    refused_time: () => t('app.schedules.refused_time'),
    refused_days: () => t('app.schedules.refused_days')
};

/** A choice for each id of a table of labels. */
function choice<Id extends string>(labels: Record<Id, () => string>) {
    return (id: Id): CommandChoice => ({ id, label: labels[id]() });
}

export function createSchedule(
    entities: EntitiesStore,
    deps: { terminalById: (id: string | null) => Terminal | null; writes: WritesStore }
): ScheduleStore {
    const { terminalById, writes } = deps;
    let draft: ScheduleDraft | null = $state(null);

    function wordOf(word: string, names: readonly string[]): string {
        return wordSentence(word, names) ?? t('app.schedules.outcome_failed_unknown');
    }

    function whatOf(row: ScheduleRow): string {
        const runs = row.entry?.runs;
        if (runs === undefined) return '';
        if ('task' in runs) return TASK_LABELS[runs.task]();
        if ('command' in runs) {
            return t('app.schedules.runs_command', runs.command, lastSegment(runs.folder));
        }
        const folder = runs.folder === 'hub' ? runs.folder : lastSegment(runs.folder);
        return t('app.schedules.runs_prompt', folder, firstLine(runs.prompt));
    }

    /** The words of a failed run: its reason, or that it has none, or that no words are known. */
    function failedLine(run: ScheduleRow['runs'][number]): string {
        if (run.why === undefined) return t('app.schedules.outcome_failed_bare');
        const said = wordSentence(run.why.word, run.why.names);
        return said === null
            ? t('app.schedules.outcome_failed_unknown')
            : t('app.schedules.outcome_failed', said);
    }

    function runView(run: ScheduleRow['runs'][number], at: number): ScheduleRunView {
        const outcome =
            run.outcome === 'started'
                ? t('app.schedules.outcome_started')
                : run.outcome === 'skipped'
                  ? t('app.schedules.outcome_skipped')
                  : failedLine(run);
        return {
            key: `${run.at}-${at}`,
            text: `${stamp(run.at)} ${TRIGGERS[run.trigger]()} ${outcome}`,
            terminal: terminalById(run.terminal)
        };
    }

    function rowView(row: ScheduleRow): ScheduleRowView {
        const problem =
            row.problem === null
                ? ''
                : wordOf(
                      row.problem.word,
                      row.problem.word === 'entry-wrong' && row.problem.names.length === 0
                          ? [String(row.at + 1)]
                          : row.problem.names
                  );
        return {
            key: `${row.at}-${row.name}`,
            at: row.at,
            name: row.name,
            readable: row.entry !== null,
            what: whatOf(row),
            pattern:
                row.entry === null
                    ? ''
                    : row.entry.when === ''
                      ? t('app.schedules.off')
                      : row.entry.when,
            paused: row.entry?.paused === true,
            problem,
            next: row.next === null ? '' : t('app.schedules.next', ahead(row.next)),
            runs: row.runs.slice(0, RUNS_SHOWN).map(runView)
        };
    }

    function rows(): ScheduleRowView[] {
        return (entities.schedule()?.schedules ?? []).map(rowView);
    }

    function none(): string {
        const payload = entities.schedule();
        const empty = payload !== null && payload.schedules.length === 0;
        return empty && !payload.unread.some((one) => one.file === 'schedules')
            ? t('app.schedules.none')
            : '';
    }

    function unread(): string[] {
        return (entities.schedule()?.unread ?? []).map((one) => {
            if (one.file === 'record') return t('app.schedules.unread_record');
            if (one.file === 'commands') return t('app.schedules.unread_commands');
            return one.line === null
                ? t('app.schedules.unread_schedules')
                : t('app.schedules.unread_schedules_at', one.line);
        });
    }

    function nextOfTask(kind: UpdateTask): string {
        let best: { next: string; name: string } | null = null;
        for (const row of entities.schedule()?.schedules ?? []) {
            const runs = row.entry?.runs;
            if (runs === undefined || !('task' in runs) || runs.task !== kind) continue;
            if (row.next === null || row.problem !== null) continue;
            if (best === null || Date.parse(row.next) < Date.parse(best.next)) {
                best = { next: row.next, name: row.name };
            }
        }
        return best === null
            ? t('app.tasks.no_schedule')
            : t('app.tasks.next', ahead(best.next), best.name);
    }

    function commands(): CommandChoice[] {
        const listed = (entities.schedule()?.commands ?? []).map((one) => ({
            id: commandKeyOf(one.folder, one.name),
            label: `${one.name} (${lastSegment(one.folder)})`
        }));
        const held = readKey(draft?.commandKey ?? '');
        if (draft === null || held === null || listed.some((one) => one.id === draft?.commandKey)) {
            return listed;
        }
        return [
            ...listed,
            { id: draft.commandKey, label: `${held.name} (${lastSegment(held.folder)})` }
        ];
    }

    function folders(): string[] {
        return ['hub', ...(entities.schedule()?.folders ?? []).slice(1)];
    }

    function blank(fill: DialogFill): ScheduleDraft {
        const command = fill.command !== undefined && fill.folder !== undefined;
        return {
            was: null,
            name: fill.name ?? '',
            kind: command ? 'command' : 'task',
            task: fill.task ?? UPDATE_TASKS[0],
            commandKey: command ? commandKeyOf(fill.folder ?? '', fill.command ?? '') : '',
            folder: 'hub',
            prompt: '',
            when: 'off',
            time: '07:00',
            days: WEEK_DAYS.map(() => false),
            pattern: '',
            unattended: false,
            unchosen: [],
            paused: false
        };
    }

    function openDialog(fill: DialogFill): void {
        const base = blank(fill);
        if (fill.at === undefined) {
            draft = base;
            return;
        }
        const row = entities.schedule()?.schedules.find((one) => one.at === fill.at);
        const entry = row?.entry;
        if (row === undefined || entry === null || entry === undefined) return;
        const shape = whenOf(entry.when);
        const runs = entry.runs;
        draft = {
            ...base,
            was: { at: row.at, name: row.name },
            name: entry.name,
            kind: 'task' in runs ? 'task' : 'command' in runs ? 'command' : 'prompt',
            task: 'task' in runs ? (row.unchosen.includes('task') ? '' : runs.task) : base.task,
            commandKey: 'command' in runs ? commandKeyOf(runs.folder, runs.command) : '',
            folder: 'prompt' in runs ? runs.folder : base.folder,
            prompt: 'prompt' in runs ? runs.prompt : '',
            when: shape.when,
            time: shape.time,
            days: shape.days,
            pattern: shape.pattern,
            unattended: row.unchosen.includes('unattended') ? null : entry.unattended,
            unchosen: row.unchosen,
            paused: entry.paused
        };
    }

    function edit(patch: Partial<Omit<ScheduleDraft, 'was'>>): void {
        if (draft !== null) Object.assign(draft, patch);
    }

    function choose(box: 'kind' | 'task' | 'when', value: string): void {
        if (box === 'kind') {
            const kind = KINDS.find((one) => one === value);
            if (kind !== undefined) edit({ kind });
        } else if (box === 'task') {
            const task = UPDATE_TASKS.find((one) => one === value);
            if (task !== undefined) edit({ task });
        } else {
            const when = WHEN_CHOICES.find((one) => one === value);
            if (when !== undefined) edit({ when });
        }
    }

    function pickCommand(key: string): void {
        edit({ commandKey: key });
    }

    /** The entry the draft stands for, as the file and the route read it. */
    function rawOf(one: ScheduleDraft, when: string): Record<string, unknown> {
        const chosen = readKey(one.commandKey);
        const runs =
            one.kind === 'task'
                ? { task: one.task }
                : one.kind === 'command'
                  ? { command: chosen?.name ?? '', folder: chosen?.folder ?? '' }
                  : { prompt: one.prompt, folder: one.folder };
        return {
            name: one.name.trim(),
            runs,
            when,
            paused: one.paused,
            unattended: one.kind === 'command' ? false : one.unattended === true
        };
    }

    function preview(one: ScheduleDraft): string {
        const made = patternOf(one);
        if ('refused' in made) return REFUSED[made.refused]();
        if (made.pattern === '') return '';
        const found = cronRuns(made.pattern, PREVIEWED, new Date());
        if (found.ok) {
            return t(
                'app.schedules.next_runs',
                found.runs.map((run) => ahead(run.toISOString())).join(', ')
            );
        }
        return found.why === 'never'
            ? t('app.schedules.problem_when_never', made.pattern)
            : t('app.schedules.problem_when_unreadable', made.pattern);
    }

    function check(one: ScheduleDraft): string[] {
        const found: string[] = [];
        const made = patternOf(one);
        if ('refused' in made) found.push(REFUSED[made.refused]());
        const chosen = readKey(one.commandKey);
        const noTask = one.kind === 'task' && one.task === '';
        if (noTask) found.push(t('app.schedules.refused_task'));
        if (one.kind !== 'command' && one.unattended === null) {
            found.push(t('app.schedules.refused_unattended'));
        }
        if (one.kind === 'command' && chosen === null) {
            found.push(t('app.schedules.refused_command'));
        } else if (!noTask) {
            const read = readEntry(rawOf(one, 'pattern' in made ? made.pattern : ''));
            if (read.problem !== null) found.push(wordOf(read.problem.word, read.problem.names));
        }
        const name = one.name.trim();
        const clash = (entities.schedule()?.schedules ?? []).some(
            (row) =>
                row.at !== one.was?.at && row.name !== '' && nameKey(row.name) === nameKey(name)
        );
        if (clash) found.push(wordOf('name-twice', [name]));
        return found;
    }

    async function send(body: Record<string, unknown>, name: string): Promise<ScheduleAnswer> {
        const posted = await writes.postCommand('/api/schedules', body);
        if (posted.failed === 'unreachable') return { ok: false, error: unreachableAnswer() };
        if (posted.failed === 'unreadable') {
            return { ok: false, error: unreadableAnswer(posted.status) };
        }
        const read = readAs(answerShape, posted.body);
        if (!posted.ok || read === null) {
            const said = wordSentence(read?.error, read?.names ?? []);
            return { ok: false, error: said ?? failedAnswer(posted, posted.body) };
        }
        if (read.skipped !== undefined) {
            return { ok: true, terminal: null, skipped: t('app.schedules.run_now_skipped', name) };
        }
        return { ok: true, terminal: read.terminal ?? null, skipped: '' };
    }

    async function save(one: ScheduleDraft): Promise<ScheduleAnswer> {
        const made = patternOf(one);
        const entry = rawOf(one, 'pattern' in made ? made.pattern : '');
        const answer = await send(
            { action: 'save', at: one.was?.at ?? null, was: one.was?.name ?? null, entry },
            one.name
        );
        if (answer.ok) draft = null;
        return answer;
    }

    const act = (action: 'delete' | 'pause' | 'resume') => (row: RowRef) =>
        send({ action, at: row.at, name: row.name }, row.name);

    return {
        rows,
        none,
        unread,
        nextOfTask,
        taskLabel: (kind) => TASK_LABELS[kind](),
        kinds: () => KINDS.map(choice(KIND_LABELS)),
        tasks: () => UPDATE_TASKS.map(choice(TASK_LABELS)),
        whens: () => WHEN_CHOICES.map(choice(WHEN_LABELS)),
        dayNames: () => WEEK_DAYS.map((day) => DAY_LABELS[day]()),
        commands,
        folders,
        dialog: () => draft,
        openDialog,
        closeDialog: () => {
            draft = null;
        },
        edit,
        choose,
        pickCommand,
        preview,
        check,
        save,
        remove: act('delete'),
        pause: act('pause'),
        resume: act('resume'),
        runNow: (row) => send({ action: 'run', name: row.name }, row.name)
    };
}
