// Layer 1, data. What the machine views read: the Processes view's rows and the payload of one read
// of the machine's process table, and the update tray's schedules: the entries of
// `~/.oculus/schedules.yml` with their problems, next runs and latest runs.

/** The four update tasks, in the order the tray lists them. */
export const UPDATE_TASKS = ['litwatch', 'scout', 'linkedin', 'inbox'] as const;

/** One of the four update tasks. */
export type UpdateTask = (typeof UPDATE_TASKS)[number];

/** The state of a read: `failed` carries the rows of the last good read under the error. */
type ProcessesStatus = 'ok' | 'failed';

/** One listed process, with the figures `ps` reports for it. */
export type ProcessRow = {
    pid: number;
    /** The parent's pid; 0 when the table gave none. */
    ppid: number;
    user: string;
    /** When the process started, an ISO time in UTC; empty when the table's value did not parse. */
    started: string;
    /** The percentage of one core `ps` reports, at least 0. */
    cpu: number;
    /** The resident set in bytes. */
    memory: number;
    /** The program path and its arguments, cut at 1,000 characters with `...`. */
    command: string;
    /** The process's working folder; empty when `lsof` did not answer for it. */
    folder: string;
    /** The id of the oculus terminal whose tree holds the process; absent for a matched process. */
    terminal?: string;
};

/** The `processes` channel: one complete read. */
export type ProcessesPayload = {
    status: ProcessesStatus;
    /** When the rows were read; empty before the first good read. */
    updated: string;
    /** Oculus's own processes grouped by terminal, then the matched processes by CPU. */
    rows: ProcessRow[];
    /** The `claude` and `codex` programs on the machine, one per tree of the same program. */
    agents: number;
    /** The projects an oculus terminal or an agent works in. */
    projects: number;
    /** The sentence of the failure while `status` is `failed`. */
    error?: string;
};

/** Every word that names why a schedule does not run or a start of it was refused. */
export const SCHEDULE_WORDS = [
    'name-missing',
    'name-wrong',
    'name-twice',
    'runs-wrong',
    'update-task-unknown',
    'command-missing',
    'commands-unread',
    'folder-empty',
    'folder-wrong',
    'folder-missing',
    'folder-not-served',
    'prompt-empty',
    'prompt-too-long',
    'prompt-control',
    'when-unreadable',
    'when-never',
    'key-unknown',
    'flag-wrong',
    'unattended-command',
    'needs-approval',
    'record-locked',
    'record-unread',
    'record-unwritten',
    'schedules-unread',
    'schedules-unwritten',
    'entry-changed',
    'entry-unwritable',
    'entry-wrong',
    'server-stopped'
] as const;

export type ScheduleWord = (typeof SCHEDULE_WORDS)[number];

/**
 * What a schedule runs: an update task, a saved command or the first message of a Claude session.
 */
type ScheduleTarget =
    { task: UpdateTask } | { command: string; folder: string } | { prompt: string; folder: string };

/** One schedule as `schedules.yml` writes it, with its defaults filled in. */
export type ScheduleEntry = {
    name: string;
    runs: ScheduleTarget;
    /** The cron pattern; '' is Off. */
    when: string;
    paused: boolean;
    unattended: boolean;
};

/** Why an entry does not run, with the names its sentence is about. */
export type ScheduleProblem = { word: ScheduleWord | 'bad-repo'; names: string[] };

/** One run of a schedule, as the record keeps it. */
export type ScheduleRun = {
    /** What started it: the cron pattern, a catch-up of a missed due time, or Run now. */
    trigger: 'schedule' | 'catch-up' | 'hand';
    /** The due time the run was decided for, an ISO time in UTC; null for Run now. */
    due: string | null;
    /** When the run was decided, an ISO time in UTC. */
    at: string;
    outcome: 'started' | 'skipped' | 'failed';
    /**
     * The id of the terminal the run started; for a skipped run, of the earlier run that was still
     * working; null for a run still being started and for a failed one.
     */
    terminal: string | null;
    /** The refusal a failed start was answered with. */
    why?: { word: string; names: string[] };
};

/** A key whose value is in the file and does not read: the task of `runs`, or `unattended`. */
export type UnchosenKey = 'task' | 'unattended';

/** One entry of `schedules.yml` as a row of the tray lists it. */
export type ScheduleRow = {
    /** The entry's position in the file; a write names the entry by this position and its name. */
    at: number;
    /** The name as written, '' when there is none. */
    name: string;
    /** The entry, or null when its shape does not read. */
    entry: ScheduleEntry | null;
    problem: ScheduleProblem | null;
    /** The keys whose value does not read, which the dialog opens with no value chosen. */
    unchosen: UnchosenKey[];
    /** The next due time, an ISO time in UTC; null when Off, paused or with a problem. */
    next: string | null;
    runs: ScheduleRun[];
};

/** The `schedule` channel: one complete read of the schedules and what the tray's dialog offers. */
export type SchedulePayload = {
    schedules: ScheduleRow[];
    /** Every saved command, for the dialog's command list. */
    commands: { folder: string; name: string }[];
    /**
     * The hub folder first, then each root the file browser serves, for the dialog's folder box.
     */
    folders: string[];
    /** The files that do not read, with the parser's line when it gave one. */
    unread: { file: 'schedules' | 'record' | 'commands'; line: number | null }[];
};
