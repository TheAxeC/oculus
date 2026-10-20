// Layer 1, data. What the machine views read: the Processes view's rows and the payload of one read
// of the machine's process table, the update tray's schedules (the entries of `schedules.yml` in
// the hub's `.oculus` folder with their problems, next runs and latest runs), the terminals tmux
// holds and the words a terminal request is refused with, the messages the page and the language
// server relay exchange besides JSON-RPC, and what a linter run answers.

import type { AppJob } from '../apps/model-apps-tools.ts';
import type { CommandSource } from '../model-sessions.ts';

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

/** Where an app's host stands: starting, running, ended, or waiting on something. */
type AppHostState = 'starting' | 'running' | 'ended' | 'waiting';

/**
 * What a waiting host waits on: an approval of changed files, a dependency that cannot run, a
 * dependency no app provides, a cycle of dependencies.
 */
type AppHostWait = '' | 'approval' | 'dependency' | 'missing' | 'cycle';

/**
 * One app's host as the `app-hosts` channel carries it. `pid` is 0 and `started` empty while no
 * process runs. `code` and `signal` say how an ended host ended (one of them is set). `dependency`
 * names the dependency a waiting host waits for, and `stoppedBy` the dependency whose revoke
 * stopped the host. `outputBytes` is how many bytes of output the host has written since the
 * server started, which grows with every write; the text is not in the row, the page asks the
 * `app-host` route for it.
 */
export type AppHostRow = {
    /** The app's view id. */
    app: string;
    name: string;
    root: string;
    title: string;
    pid: number;
    /** When the process started, an ISO time in UTC. */
    started: string;
    state: AppHostState;
    code: number | null;
    signal: string;
    waiting: AppHostWait;
    dependency: string;
    stoppedBy: string;
    outputBytes: number;
};

/** The `app-hosts` channel: one complete read of every host the server knows. */
export type AppHostsPayload = { rows: AppHostRow[] };

/**
 * One message a host sent to the page, on the `app-messages` channel: to the tab `tab` of the
 * app, or to every open tab of it when `tab` is empty.
 */
export type AppMessage = { app: string; tab: string; method: string; params: unknown };

/** The `app-messages` channel: the messages sent since the page's last one, in order. */
export type AppMessagesPayload = { messages: AppMessage[] };

/** Every word that says why a schedule does not run, or why a save or a start of it was refused. */
export const SCHEDULE_WORDS = [
    'name-missing',
    'name-wrong',
    'name-twice',
    'no-primary',
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
    'approval-unwritten',
    'chain-changed',
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
 * What a schedule runs: an update task, a command of a repository's `.oculus/commands.yml` or the
 * first message of a Claude session.
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
    /**
     * The commands of `.oculus/commands.yml` that a schedule can run, each with its repository's
     * real path, for the dialog's command list: those of the hub, of each root the file browser
     * serves that is a repository, and of the repository each entry names.
     */
    commands: { folder: string; name: string }[];
    /**
     * The hub folder first, then each root the file browser serves, for the dialog's folder box.
     */
    folders: string[];
    /**
     * The update tasks whose file `.oculus/tasks/<kind>.md` the primary hub holds, which the tray
     * offers; null while the workspace has no primary.
     */
    tasks: UpdateTask[] | null;
    /** The files that do not read, with the parser's line when it gave one. */
    unread: { file: 'schedules' | 'record'; line: number | null }[];
    /**
     * Tmux's words for why the terminal list cannot be read, while no list was ever read and so no
     * due time is decided; null otherwise.
     */
    waiting: string | null;
};

// ------------------------------------------------------------------ terminals
// The tmux side of DESIGN.md's "PTY": one record per tmux session oculus started, and the three
// messages the `pty:<id>` channel carries. JSON-safe like everything above, so the bytes of a pane
// travel as base64 rather than as a string that a lone surrogate could break.

/**
 * What a terminal pane runs: DESIGN.md's two agents and a shell, or a program an app's host
 * started (`app`).
 */
export type TerminalKind = 'claude' | 'codex' | 'shell' | 'app';

/** The kinds a page may ask to start: an `app` terminal is made by an app's host alone. */
export type StartKind = Exclude<TerminalKind, 'app'>;

/** The shape of a terminal id the server's start makes: six hex digits and the kind. */
export const TERMINAL_ID = /^[0-9a-f]{6}-(claude|codex|shell|app)$/;

/**
 * Whether an id names an oculus terminal, by TERMINAL_ID, which the server and the page both test
 * by. It cannot collide with a Claude session id (a UUID) or a Codex slug (a day path), which is
 * why a terminal selects through the one selection the session views share.
 */
export function isTerminalId(id: unknown): id is string {
    return typeof id === 'string' && TERMINAL_ID.test(id);
}

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
 * The lines of a terminal's scrollback the server hands a page that attaches, which is also all
 * the output of a terminal the page keeps before it hears of the terminal.
 */
export const SCROLLBACK_LINES = 2000;

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
    'no-primary',
    'nul-value',
    'task-unknown',
    'task-gone',
    'dependency-task',
    'task-changed',
    'task-too-long',
    'task-needs-agent',
    'task-file-missing',
    'needs-confirm',
    'approvals-unwritable',
    'latex-program',
    'latex-recipe',
    'latex-no-recipe',
    'latex-folder',
    'latex-building',
    'latex-idle',
    'latex-unmarked',
    'latex-unserved'
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
    /**
     * A LaTeX job's step and main file, which find its kept terminal whatever its name says, the
     * recipe its line was made from (empty for a step of none) and the folder the request named,
     * from which a Rerun or Restart works out what the step asks to have approved.
     */
    latex?: { step: string; main: string; recipe?: string; target?: LatexJobTarget };
    /** An app's task: the app that runs it. */
    app?: AppJob;
    /** The problem matchers (`$name`) the output of the command is read with. */
    matchers?: string[];
};

/** The folder a LaTeX request named: a project by its id, or a folder of a served root. */
export type LatexJobTarget = { id: string } | { root: string; path: string };

/**
 * What a build or a clean of one main file asks the reader to approve before it starts: the
 * latexmkrc files latexmk would read, and the weave tools of the recipe with the recipe's name. The
 * `texts` are the two approved texts that are missing, null for one that is held or not needed, and
 * the page posts them back so the server can tell that nothing changed since they were listed.
 */
export type LatexApproval = {
    main: string;
    step: 'build' | 'clean';
    latexmkrc: string[];
    weave: { recipe: string; tools: string[] } | null;
    texts: { latexmkrc: string | null; weave: string | null };
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
    /**
     * The view id of the app whose host made the terminal (tmux user option `@oculus_app`), empty
     * for a terminal no app made. A terminal of an app is of the kind `app`.
     */
    app: string;
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

/**
 * Why the Markdown servers gave no edit for the moves of a root: the request could not be sent
 * (`unsent`), the server did not answer in time or ended (`no_answer`), or the moves name no place
 * under a served root (`no_place`).
 */
export type LinksFailure = 'unsent' | 'no_answer' | 'no_place';

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
    /** `server` names one server of an app when several serve the language; absent, oculus's. */
    | { oculus: 'restart'; root: string; server?: string }
    | { oculus: 'output'; root: string; server?: string }
    | { oculus: 'output_off'; root: string; server?: string }
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
    | { oculus: 'held_ask'; id: number; files: LspPlace[] }
    /**
     * On the channel `lsp:markdown`: the moves a reader made in the Files view of one served root
     * (paths under the root), after they happened, and the question which edits to Markdown files
     * keep their links and backticked paths pointing at the moved items.
     */
    | {
          oculus: 'links';
          id: number;
          root: string;
          moves: { from: string; to: string }[];
          /** The texts of the page's tabs with unsaved text in the root, by path under it. */
          texts: { path: string; text: string }[];
      };

/** The relay's message to a page, besides the JSON-RPC ones. */
export type LspToPage =
    | {
          oculus: 'state';
          root: string;
          /** The id and name of a server an app registered; absent for oculus's own. */
          server?: string;
          name?: string;
          state: LspState;
          /** The files indexed and the files to index, while `indexing`. */
          done?: number;
          total?: number;
          code?: LspCode;
          /** The program that was not found, for the code `not_found`. */
          program?: string;
      }
    | { oculus: 'output'; root: string; server?: string; lines: string[]; append: boolean }
    /** A server an app registered is gone: its app stopped acting or unregistered it. */
    | { oculus: 'gone'; root: string; server: string }
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
          /** The id and name of a server an app registered; absent for oculus's own. */
          server?: string;
          name?: string;
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
    | { oculus: 'held_answer'; id: number; files: LspPlace[] }
    /**
     * The answer to a `links`: the workspace edit as the page spells its addresses, null when no
     * file needs one, with the text each Markdown server holds of the documents the page opened
     * (the texts the edit's positions are of), the files the edit leaves out because two served
     * roots rewrite the same text of one differently, and the keys of the roots whose Markdown
     * server gave no answer, or why no Markdown server gave one.
     */
    | {
          oculus: 'links_answer';
          id: number;
          edit: unknown;
          held: { uri: string; text: string }[];
          overlaps: string[];
          unanswered: string[];
      }
    | { oculus: 'links_answer'; id: number; error: LinksFailure };

/**
 * The linters oculus runs on a file, in the order the status bar draws them. Four run a program;
 * `writing` runs none: it reads the hub's writing rules off the file's text (server/machine/runs/
 * lint/writing/).
 */
export const LINT_IDS = ['chktex', 'ruff', 'eslint', 'shellcheck', 'writing'] as const;

/** One linter's id. */
export type LintId = (typeof LINT_IDS)[number];

/**
 * The extensions each linter takes, in lower case: ShellCheck takes no zsh, ChkTeX no .sty. The
 * writing rules take Markdown and YAML whole and the comments of the code files they list (a
 * comment finder per language is the reader's, which picks the grammar by extension).
 */
const LINT_EXTENSIONS: Record<LintId, readonly string[]> = {
    chktex: ['.tex', '.latex'],
    ruff: ['.py', '.pyi'],
    eslint: ['.ts', '.tsx', '.mts', '.cts', '.js', '.jsx', '.mjs', '.cjs', '.svelte'],
    shellcheck: ['.sh', '.bash', '.slurm'],
    writing: [
        '.md',
        '.markdown',
        '.mkdown',
        '.mkd',
        '.yml',
        '.yaml',
        '.py',
        '.pyi',
        '.ts',
        '.mts',
        '.cts',
        '.tsx',
        '.js',
        '.mjs',
        '.cjs',
        '.jsx',
        '.svelte',
        '.sh',
        '.bash',
        '.zsh',
        '.slurm',
        '.css',
        '.scss',
        '.c',
        '.cpp',
        '.cc',
        '.cxx',
        '.hpp',
        '.hh',
        '.hxx',
        '.h',
        '.lua',
        '.tex',
        '.latex'
    ]
};

/** The linters that take a file, by its extension. */
export function lintersOf(path: string): LintId[] {
    const name = path.slice(path.lastIndexOf('/') + 1).toLowerCase();
    const dot = name.lastIndexOf('.');
    const extension = dot < 0 ? '' : name.slice(dot);
    return LINT_IDS.filter((id) => LINT_EXTENSIONS[id].includes(extension));
}

/** The numbers of the ChkTeX warnings that have a fix, which LaTeX Workshop's code actions make. */
export const CHKTEX_FIXABLE = [
    1, 2, 4, 5, 6, 11, 12, 13, 18, 24, 26, 28, 32, 33, 34, 35, 39, 42, 45, 46
] as const;

/**
 * One text edit of a fix, in the editor's positions: lines and columns count from one, columns in
 * UTF-16 units, and the end is where the replaced text stops (not part of it).
 */
export type LintEdit = {
    line: number;
    column: number;
    endLine: number;
    endColumn: number;
    text: string;
};

/**
 * One fix a linter offers for a row. `fix` is the linter's own fix (the one Fix All applies) and
 * `suggestion` an alternative it lists beside it. `title` is the linter's own words, empty for a
 * fix the page titles from its row.
 */
export type LintFix = { kind: 'fix' | 'suggestion'; title: string; edits: LintEdit[] };

/**
 * One finding of a linter. The line, column and end are the editor's (see `LintEdit`); `code` is
 * the rule (ChkTeX's number, ruff's and ESLint's rule id, ShellCheck's `SC<n>`) and absent for a
 * finding with no rule, `href` the page that documents the rule, and `noqa` the line ruff's
 * `# noqa` comment for this finding goes on.
 */
export type LintRow = {
    line: number;
    column: number;
    endLine: number;
    endColumn: number;
    severity: 'error' | 'warning' | 'info';
    message: string;
    code?: string;
    href?: string;
    noqa?: number;
    fixes: LintFix[];
};

/** Why a linter gave no rows: it is missing, failed, ran out of time, or has nothing to run on. */
export type LintState = 'not_found' | 'failed' | 'timeout' | 'not_approved' | 'no_config' | 'off';

/**
 * The answer of POST /api/lint to a run: the file's rows with the hash of the bytes they were read
 * from (the `base` a source tab holds for the same bytes), or the state it gave none in.
 */
export type LintAnswer =
    { ok: true; rows: LintRow[]; hash: string } | { ok: false; state: LintState; reason?: string };

/** A position of the Language Server Protocol: a line and a character of it, both from zero. */
type LintFolderPosition = { line: number; character: number };

/**
 * One file of a folder's writing-rules plan: its path against the folder's root, the SHA-256 of the
 * bytes the plan was made from, how many fixes its edits make, and the edits in the protocol's
 * positions (the shape of a text edit in `data/prose/text-edits.ts`). A file the plan could not
 * check carries no edits and `reason`, the sentence that says why.
 */
export type LintFolderFile = {
    path: string;
    hash: string;
    count: number;
    edits: { range: { start: LintFolderPosition; end: LintFolderPosition }; newText: string }[];
    reason?: string;
};

/**
 * The answer of POST /api/lint to the action `folder`: the files of the folder the writing rules
 * can fix, or the sentence that refuses the folder.
 */
export type LintFolderAnswer =
    { ok: true; files: LintFolderFile[] } | { ok: false; reason: string };

/**
 * The `eslint.config.*` file ESLint is given for a file, as its path under the folder it sits in,
 * whether its present text is approved, and the key an approval of that text is named by.
 */
export type LintConfig = { files: string[]; approved: boolean; key: string };

/** A JSON-RPC message of the protocol, carried as the payload of a frame. */
export type LspRpc = {
    jsonrpc: '2.0';
    id?: number | string | null;
    method?: string;
    params?: unknown;
    result?: unknown;
    error?: { code: number; message: string; data?: unknown };
};
