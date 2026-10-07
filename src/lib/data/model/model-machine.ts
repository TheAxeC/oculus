// Layer 1, data. What the machine views read: the Processes view's rows and the payload of one read
// of the machine's process table, the update tray's schedules (the entries of
// `~/.oculus/schedules.yml` with their problems, next runs and latest runs), the terminals tmux
// holds and the words a terminal request is refused with, the messages the page and the language
// server relay exchange besides JSON-RPC, and the debug session's state and console.

import type { CommandFinding, CommandSource } from './model-sessions.ts';

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

// ------------------------------------------------------------------ terminals
// The tmux side of DESIGN.md's "PTY": one record per tmux session oculus started, and the three
// messages the `pty:<id>` channel carries. JSON-safe like everything above, so the bytes of a pane
// travel as base64 rather than as a string that a lone surrogate could break.

/** What a terminal pane runs: DESIGN.md's two agents and a shell. */
export type TerminalKind = 'claude' | 'codex' | 'shell';

/**
 * Which agent session a terminal continues. A terminal started fresh carries none; one started by
 * the resume action carries the tool it was resumed with and that session's own id, which is what
 * `claude --resume <id>` and `codex resume <id>` were given.
 */
export type TerminalResume = {
    tool: 'claude' | 'codex';
    id: string;
};

/** The eight colour names a terminal may carry, VS Code's ANSI colours, in the order offered. */
export const TERMINAL_COLORS = [
    'black',
    'red',
    'green',
    'yellow',
    'blue',
    'magenta',
    'cyan',
    'white'
] as const;

/** One of the eight colour names. */
export type TerminalColor = (typeof TERMINAL_COLORS)[number];

/** The longest message one steer types into a terminal, which the server refuses to pass. */
export const STEER_MAX = 100_000;

/**
 * The control characters a steer refuses: each would be typed as a key of its own (Escape,
 * Ctrl-C). A line break and a tab are the two a message holds. The server refuses them and the
 * page checks a comment against the same expression before it types or copies it.
 */
// eslint-disable-next-line no-control-regex
export const STEER_CONTROL = /[\u0000-\u0008\u000b-\u001f\u007f]/;

/** Where a task terminal's job came from: a project command's source, or a LaTeX build. */
type JobSource = CommandSource | 'latex';

/**
 * The words a request to /api/terminal is refused with. The server answers a refusal as one of
 * them, with the names it is about in `names` where a sentence needs them, and the page says the
 * sentence the catalog holds for it (state/shared/answers/terminal-words.ts); an engine's own text
 * (tmux's, a validator's) never reaches the page.
 */
export const TERMINAL_REFUSALS = [
    'not-ours',
    'not-a-session',
    'session-unknown',
    'session-live',
    'bad-terminal',
    'terminal-ended',
    'terminal-failed',
    'terminal-not-started',
    'not-a-task',
    'still-running',
    'bad-repo',
    'command-unknown',
    'dependency-unknown',
    'dependency-self',
    'dependency-cycle',
    'no-file',
    'no-selection',
    'nul-value',
    'task-unknown',
    'task-changed',
    'task-too-long',
    'task-needs-agent',
    'needs-confirm',
    'approvals-unwritable',
    'latex-program',
    'latex-recipe',
    'latex-no-recipe',
    'latex-folder',
    'latex-building',
    'latex-idle'
] as const;
export type TerminalRefusal = (typeof TERMINAL_REFUSALS)[number];

/**
 * The command a task terminal runs (a LaTeX build's job is the folder it builds in, the build's
 * name and the source `latex`): the repository it belongs to, the command's name and the source
 * that name was read from, which tells apart two commands of one name, the token its line prints
 * with each command's name, and the commands of its chain in run order, each with the folder it
 * runs in, so the output is read by the chain the line was made of whatever the repository's list
 * says now. A mark that carries no source, no token or no chain leaves it absent.
 */
export type TerminalJob = {
    repo: string;
    name: string;
    source?: JobSource;
    token?: string;
    chain?: { name: string; cwd: string }[];
    /** A LaTeX job's step and main file, which find its kept terminal whatever its name says. */
    latex?: { step: string; main: string };
};

/**
 * What the server knows of the last build of one main file: its kept build terminal is `running`,
 * ended with status 0 (`ok`) or ended otherwise, a stopped build included (`failed`); `none` when
 * no oculus terminal built it, as when another program did.
 */
export const BUILD_OUTCOMES = ['running', 'ok', 'failed', 'none'] as const;
export type BuildOutcome = (typeof BUILD_OUTCOMES)[number];

/** One tmux session oculus started, as `tmux list-sessions` reports it. */
export type Terminal = {
    /** The session name without the `oculus-` prefix; the `pty:<id>` channel is named from it. */
    id: string;
    /** What to call it on the page. The id when the starter named nothing. */
    name: string;
    /** The title the reader gave it (tmux user option `@oculus_title`); empty when it has none. */
    title: string;
    /** The glyph name the reader gave it (`@oculus_icon`); empty for the kind's own. */
    icon: string;
    /** One of the eight ANSI colour names (`@oculus_color`); empty for the default. */
    color: string;
    kind: TerminalKind;
    /** The pane's current directory. */
    cwd: string;
    /** The pane's current command, which is what tmux reports is running right now. */
    command: string;
    /** The pane's process id, for a page that wants to show it. Zero when tmux reported none. */
    pid: number;
    /** When the session was created, as an ISO instant. */
    created: string;
    /** Whether any client (oculus or a terminal window) is attached to the tmux session. */
    attached: boolean;
    /** The session this terminal continues, or null when it continues nothing. */
    resumes: TerminalResume | null;
    /**
     * True for a terminal a project command or a LaTeX build started (tmux user option
     * `@oculus_task`). Its session stays in the list after its line ended, with the status of that
     * line in `exit`.
     */
    task: boolean;
    /**
     * The exit status of a task terminal's line once it ended, and null while it runs and on a
     * terminal that is no task.
     */
    exit: number | null;
    /** The repository and command or build name a task terminal ran, or null when it is no task. */
    job: TerminalJob | null;
    /**
     * True for a tmux session that carries the `oculus-` prefix but whose name oculus did not mint.
     * It is listed, since it is there and the prefix claims it, and the stop and resize actions
     * refuse it: the commands they build are keyed on an id of oculus's own shape.
     */
    foreign?: boolean;
};

/** The payload of a `pty:<id>` message: a chunk of pane output, or the scrollback, as base64. */
export type PtyPayload = {
    bytes: string;
};

/** Keystrokes from the page, as base64 of the UTF-8 bytes xterm.js produced. */
export type TerminalInput = {
    type: 'input';
    channel: string;
    bytes: string;
};

/** The page's terminal was resized, so the tmux window follows it. */
export type TerminalResize = {
    type: 'resize';
    channel: string;
    cols: number;
    rows: number;
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

/** Where a debug session stands: no session yet, starting, running, paused, or ended. */
export const DEBUG_STATUSES = ['idle', 'starting', 'running', 'paused', 'ended'] as const;
export type DebugStatus = (typeof DEBUG_STATUSES)[number];

/** The session a debug launch made: what it runs, where, and the adapter's process. */
export type DebugSession = {
    /** The repository the launch belongs to, as a real path. */
    repo: string;
    /** The configuration's name, or the default configuration's. */
    name: string;
    /** The program as run: an absolute path. */
    program: string;
    /** The folder the adapter runs in: an absolute real path. */
    cwd: string;
    /** The adapter's process id, 0 while it has none. */
    pid: number;
    /** The session's number, which grows by one for each launch the server answers. */
    number: number;
};

/** One frame of the stack, the top one first; `path` is the file as the page named it. */
export type DebugFrame = {
    id: number;
    name: string;
    path: string;
    line: number;
    column: number;
};

/** One name and the value the adapter gives it. */
type DebugVariable = { name: string; value: string };

/** One scope of the selected frame and what it holds. */
export type DebugScope = { name: string; variables: DebugVariable[] };

/** A watch expression's result at the pause: its value or the adapter's error, one of them. */
export type DebugWatch = { expression: string; value?: string; error?: string };

/** One line the adapter answered a breakpoint for. `line` is the line the page asked for. */
export type DebugBreakpoint = {
    line: number;
    verified: boolean;
    /** The adapter's reason a breakpoint is not verified; empty when it is. */
    message: string;
};

/** The breakpoints of one file as the adapter last answered them. */
export type DebugFileBreakpoints = { path: string; breakpoints: DebugBreakpoint[] };

/** One function breakpoint as the adapter last answered it. */
export type DebugFunctionBreakpoint = { name: string; verified: boolean; message: string };

/** Why the program is paused, as the adapter says it. */
type DebugPause = {
    /** `breakpoint` or `step`. */
    reason: string;
    description: string;
};

/** The payload of the `debug` channel: the whole state, replaced by each message. */
export type DebugPayload = {
    status: DebugStatus;
    /** The session running or the last one that ran since the server started; null before any. */
    session: DebugSession | null;
    /** The reason of the current pause, null unless the status is `paused`. */
    pause: DebugPause | null;
    frames: DebugFrame[];
    /** The id of the selected frame, null unless the status is `paused`. */
    frame: number | null;
    scopes: DebugScope[];
    watch: DebugWatch[];
    breakpoints: DebugFileBreakpoints[];
    functions: DebugFunctionBreakpoint[];
    /** Why the session ended, in words; empty unless the status is `ended`. */
    ended: string;
};

/**
 * The kind of a console line: what the program wrote (`stdout`, `stderr`), what the adapter said
 * (`console`), an expression the reader typed (`input`) and its result or its error.
 */
export const DEBUG_CONSOLE_KINDS = [
    'stdout',
    'stderr',
    'console',
    'input',
    'result',
    'error'
] as const;
export type DebugConsoleKind = (typeof DEBUG_CONSOLE_KINDS)[number];

/** The most lines a session's console holds, on the server and on a page. */
export const DEBUG_CONSOLE_MAX = 10_000;

/** One line of the console. */
export type DebugConsoleLine = { kind: DebugConsoleKind; text: string };

/**
 * The payload of the `debug-console` channel: lines of one session appended to its console, the
 * first of them the console's line number `start`. Lines are numbered from 0 in each session.
 */
export type DebugConsoleAppend = { session: number; start: number; lines: DebugConsoleLine[] };

/** The console as the server holds it: `first` is the number of its first held line. */
export type DebugConsole = { session: number; first: number; lines: DebugConsoleLine[] };

/** One configuration of a repository's `.oculus/launch.yml`, its fields as written. */
export type DebugConfiguration = {
    name: string;
    /** The `.rite` file to run: a path in the repository or a text holding placeholders. */
    program: string;
    /** The folder the adapter runs in relative to the repository; `.` for the repository. */
    cwd: string;
    /** The name of a command to run first; absent when none is named. */
    before?: string;
    /** The line the entry starts on in the file. */
    line?: number;
};

/** The answer of GET /api/debug: what the launch file holds and what in it did not read. */
export type DebugLaunches = {
    /** Whether `.oculus/launch.yml` is there. */
    exists: boolean;
    configurations: DebugConfiguration[];
    findings: CommandFinding[];
};

/** A JSON-RPC message of the protocol, carried as the payload of a frame. */
export type LspRpc = {
    jsonrpc: '2.0';
    id?: number | string | null;
    method?: string;
    params?: unknown;
    result?: unknown;
    error?: { code: number; message: string; data?: unknown };
};
