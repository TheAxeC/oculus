// Layer 1, data. What the machine views read: the Processes view's rows and the payload of one read
// of the machine's process table, the update tray's schedules (the entries of
// `~/.oculus/schedules.yml` with their problems, next runs and latest runs), and the messages the
// page and the language server relay exchange besides JSON-RPC.

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

// ------------------------------------------------------------------ language servers
// What the page and the language server relay (server/machine/lsp/) say to each other on a
// language's `lsp:<language>` channel beside the JSON-RPC messages of the protocol: the oculus
// messages, told apart from a JSON-RPC message by their `oculus` field. The relay sends codes and
// the page words them from its catalogs.

/** The states of one root's language server, as the status bar says them. */
export type LspState = 'starting' | 'indexing' | 'ready' | 'not_found' | 'failed';

/** Why a server is `not_found` or `failed`; `root_gone` is one ended as its root is not served. */
export type LspCode = 'not_found' | 'exited' | 'refused' | 'no_answer' | 'lsp_folder' | 'root_gone';

/** Why a choice was not written. */
export type LspRefusal = 'choices_unread' | 'choices_write';

/**
 * Why a library file was not read: the token is not one this page was given for that root and
 * language (`unknown`), the root is not served any more (`not_served`), the path is no longer a
 * regular file (`not_file`) or now resolves to another real path (`moved`), the file is not text
 * (`binary`), or it is over the limit a source tab reads (`too_large`).
 */
export type LspReadRefusal =
    'unknown' | 'not_served' | 'not_file' | 'moved' | 'binary' | 'too_large';

/** One Python interpreter a root can use, as the picker lists it. */
export type LspInterpreter = {
    /** The path as found or typed, never resolved through a link. */
    path: string;
    /** `3.13.4`; the interpreter's `sys.version_info[:3]`. */
    version: string;
    /** The folder name of the virtual environment, null for an interpreter outside one. */
    venv: string | null;
    /** Where it came from: the repository's own `.venv` or `venv`, the PATH, or a typed path. */
    found: 'venv' | 'path' | 'typed';
    /** False for a repository's own interpreter its reader has not approved on this machine. */
    approved: boolean;
};

/** One compile database a root can use, as the picker lists it. */
export type LspDatabase = {
    /** The configuration's name, or the database's folder under the repository for a found one. */
    key: string;
    /** What the status bar and the picker show: the key. */
    name: string;
    /** True for a configuration of `.oculus/cpp.yml`, false for a database oculus found. */
    configuration: boolean;
    /** The folder holding `compile_commands.json`, relative to the repository; empty for none. */
    folder: string;
};

/**
 * What a reader approves for a root: the interpreter at a path, or the text of the repository's
 * own Svelte and Vite configuration files.
 */
export type LspApproval = { kind: 'interpreter'; path: string } | { kind: 'config'; key: string };

/**
 * The repository configuration a language server would run, and whether it is approved: `files`
 * are the configuration files' paths (relative to the root, absolute above it), `approved` is
 * whether their present text is, `key` is the key that text is approved under (an approval names
 * the key the list showed) and `svelte` is whether the repository has a `svelte` package, which a
 * trusted Svelte server then uses in place of its own.
 */
export type LspConfig = { files: string[]; approved: boolean; key: string; svelte: boolean };

/** A file as the page names it: a served root's key and the path under it. */
export type LspPlace = { root: string; path: string };

/** A page's message to the relay, besides the JSON-RPC ones. */
export type LspToServer =
    | { oculus: 'restart'; root: string }
    | { oculus: 'output'; root: string }
    | { oculus: 'output_off'; root: string }
    | { oculus: 'choices'; root: string }
    | { oculus: 'choose'; root: string; interpreter?: string; database?: string }
    /** Approve what a repository would run: its interpreter or its Svelte and Vite config. */
    | { oculus: 'approve'; root: string; approval: LspApproval }
    /** Take an approval back; the server that runs on it restarts without it. */
    | { oculus: 'revoke'; root: string; approval: { kind: 'config' } }
    /**
     * Read a library file: `uri` is the `oculus-lib:` address a language server's answer gave this
     * page, and `root` the root key of the document the request that got it was made for.
     */
    | { oculus: 'read'; root: string; uri: string }
    /**
     * On the channel `lsp:workspace`, which no document is on: every file the page holds open in a
     * tab, whatever its language, sent whole each time the set changes.
     */
    | { oculus: 'held'; files: LspPlace[] }
    /** On the same channel: which of these files another page holds open in a tab. */
    | { oculus: 'held_ask'; id: number; files: LspPlace[] };

/** The relay's message to a page, besides the JSON-RPC ones. */
export type LspToPage =
    | {
          oculus: 'state';
          root: string;
          state: LspState;
          /** The files indexed and the files to index, while `indexing`. */
          done?: number;
          total?: number;
          code?: LspCode;
          /** The program that was not found, for the code `not_found`. */
          program?: string;
      }
    | { oculus: 'output'; root: string; lines: string[]; append: boolean }
    | {
          oculus: 'choices';
          root: string;
          /** Each list and choice is present for the server that asks for it. */
          interpreters?: LspInterpreter[];
          /** The path of the interpreter in force, null when there is none. */
          interpreter?: string | null;
          databases?: LspDatabase[];
          /** The key of the database in force, null when there is none. */
          database?: string | null;
          findings?: { file: string; field: string; message: string }[];
          /** The configuration a Svelte server would run, with the approval it is held under. */
          config?: LspConfig;
      }
    | { oculus: 'refused'; root: string; code: LspRefusal }
    | {
          oculus: 'legend';
          root: string;
          /**
           * The token types of the server's semantic tokens, in the order its answers index them.
           */
          types: string[];
          /** The token modifiers, by the bit each one is. */
          modifiers: string[];
      }
    /** The answer to a `read`: the file's text, or why it may not be read. */
    | { oculus: 'file'; root: string; uri: string; text: string }
    | { oculus: 'file'; root: string; uri: string; code: LspReadRefusal }
    /** The answer to a `held_ask`: those of its files that another page holds open. */
    | { oculus: 'held_answer'; id: number; files: LspPlace[] };

/** A JSON-RPC message of the protocol, carried as the payload of a frame. */
export type LspRpc = {
    jsonrpc: '2.0';
    id?: number | string | null;
    method?: string;
    params?: unknown;
    result?: unknown;
    error?: { code: number; message: string; data?: unknown };
};
