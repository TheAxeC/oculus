// Layer 2, server. The terminals as records: what `tmux list-sessions` says, the pane process of
// every oculus session (`tmux list-panes`, which the Processes view walks down from), and the
// commands that start, resize, stop, capture, steer and interrupt one. DESIGN.md's "PTY" puts a
// session inside tmux so it outlives the server; the `oculus-` prefix is all that tells a session
// oculus started from one Axel started in a terminal window, and the kind is the suffix of the same
// name.
//
// Nothing the page sends is read by a shell on its way to tmux. A cwd is checked to be an absolute
// existing directory, the geometry a small positive integer, and the id the shape start() gives it.
// A composer's start is an argument vector of at least two words, which tmux runs directly, with
// the prompt as one word of it and the account as one `-e NAME=folder` pair, or, for the default
// account, `env -u NAME` leading the argument vector; every start also carries `GRID_ENV` as a `-e`
// pair. What the page types into a running terminal and the text of a steer go out as their bytes,
// through `send-keys -H` in pieces (inputArgs), a steer then Enter, and an interrupt is the one
// Escape key.
//
// A start sets the session's name, its resume mark and a task's mark in the `new-session`
// invocation itself, so a command that ends at once leaves a named, marked session.

import { randomBytes } from 'node:crypto';
import { statSync } from 'node:fs';
import { isAbsolute } from 'node:path';
import { z } from 'zod';
import { SCROLLBACK_LINES, STEER_CONTROL, STEER_MAX } from '../../../data/model/index.ts';
import type {
    Terminal,
    TerminalJob,
    TerminalKind,
    TerminalResume
} from '../../../data/model/index.ts';
import { PREFIX, USAGE_PREFIX } from '../../transcripts/names.ts';
import { captureArgs } from './capture.ts';
import { TerminalRefused } from './refusal.ts';
import { inputChunks, run, type KeyChunk, type TmuxOptions } from './tmux.ts';

/** The things a terminal runs: DESIGN.md's two agents and a shell, and a program an app started. */
export const KINDS: TerminalKind[] = ['claude', 'codex', 'shell', 'app'];

/** Whether a value is one of the kinds a terminal runs. */
export function isTerminalKind(value: unknown): value is TerminalKind {
    return KINDS.some((kind) => kind === value);
}

/** The longest name a terminal may carry, which is what `label` accepts. */
export const NAME_MAX = 80;

/** The widest geometry accepted from the page; a terminal larger than this is not a terminal. */
export const MAX_GEOMETRY = 2000;

/**
 * The name a terminal gets when the starter named nothing is its id, so the field is never empty.
 */
const NAME_OPTION = '@oculus_name';

/**
 * Which session a terminal continues, kept as a tmux user option beside the name so tmux stays the
 * only store: `<tool>:<session id>`, and unset on a terminal that continues nothing.
 */
const RESUMES_OPTION = '@oculus_resumes';

/**
 * Marks a terminal a project command started and holds the command it ran as JSON,
 * `{"repo":..., "name":..., "source":..., "token":..., "chain":[{"name":..., "cwd":...}]}`: the
 * token its line prints before each command's name and the commands of its chain with their
 * folders. tmux stays the only store and the mark survives a server restart. Unset on a terminal
 * that is no task.
 */
const TASK_OPTION = '@oculus_task';

/**
 * The view id of the app whose host made a terminal, kept as a tmux user option; unset for none.
 */
const APP_OPTION = '@oculus_app';

/** The title, icon and colour a reader gave a terminal, each a tmux user option. */
export const TITLE_OPTION = '@oculus_title';
export const ICON_OPTION = '@oculus_icon';
export const COLOR_OPTION = '@oculus_color';

/** The two tools whose sessions can be resumed. A shell has no session to continue. */
export const RESUME_TOOLS: TerminalResume['tool'][] = ['claude', 'codex'];

/**
 * The id shape both tools use. Claude Code names a session by a UUID and Codex names a rollout by
 * `session_meta.id`, which is a UUID too, so anything that is not one is refused before a command
 * is built from it.
 */
const UUID = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

/** Whether a value is a session id either tool could have written. Everything else is refused. */
export function isSessionId(id: unknown): id is string {
    return typeof id === 'string' && UUID.test(id);
}

/**
 * The fields a terminal is read from. The first six are the session and its active pane; the
 * seventh is the label the starter gave, the eighth the session it resumes, and the ninth to the
 * eleventh the title, icon and colour the reader gave, each kept as a tmux user option so tmux
 * stays the only store. The twelfth is the task mark, the thirteenth whether the pane's process
 * has ended (`remain-on-exit` keeps a task's pane) and the fourteenth the status it ended with.
 * The fifteenth is the view id of the app whose host made the terminal. The sixteenth and last is
 * the pid of the tmux server that answered, the same on every row, which names that server to
 * whoever cannot reach it by its socket later (see serverPid).
 */
export const LIST_FORMAT = [
    '#{session_name}',
    '#{session_created}',
    '#{session_attached}',
    '#{pane_current_command}',
    '#{pane_pid}',
    '#{pane_current_path}',
    `#{${NAME_OPTION}}`,
    `#{${RESUMES_OPTION}}`,
    `#{${TITLE_OPTION}}`,
    `#{${ICON_OPTION}}`,
    `#{${COLOR_OPTION}}`,
    `#{${TASK_OPTION}}`,
    '#{pane_dead}',
    '#{pane_dead_status}',
    `#{${APP_OPTION}}`,
    '#{pid}'
].join('\t');

export type StartRequest = {
    /** A preallocated id when a caller must prepare a resource named after the terminal. */
    id?: string;
    /**
     * The kind, the directory and the geometry as the starter named them: startTerminal checks
     * each one and refuses a bad one as `bad-terminal`, so a request body hands them on as sent.
     */
    kind: unknown;
    cwd: unknown;
    cols: unknown;
    rows: unknown;
    name?: string;
    /** The view id of the app whose host starts the terminal; recorded with it. */
    app?: string;
    /**
     * The session this terminal continues. With it the command is the tool's own resume command
     * rather than a bare `claude` or `codex`, and the kind is that tool.
     */
    resume?: TerminalResume;
    /**
     * The environment the session's process starts with beside tmux's own, each `NAME=value` set
     * with new-session's `-e`: the account folder an agent reads its login and settings from.
     */
    env?: Record<string, string>;
};

/** A start whose kind, directory and geometry are checked, as its argument vector needs. */
export type CheckedStart = {
    kind: TerminalKind;
    cwd: string;
    cols: number;
    rows: number;
    env?: Record<string, string>;
};

/** One tmux call, the shape run() of tmux.ts has, for a test that records the argv instead. */
export type Runner = (args: string[], options?: TmuxOptions) => Promise<string>;

export type RunOptions = TmuxOptions & {
    /**
     * The tmux call to make. Server-side only: the endpoint never passes it, and
     * tests/routes/sessions/terminal.test.ts uses it to record what would have been run.
     */
    run?: Runner;
};

export type StartOptions = RunOptions & {
    /**
     * The command to run instead of the one the kind names. Server-side only: the endpoint never
     * passes it, and tests/server/machine/pty/sessions.test.ts uses it to run `cat` rather than a
     * shell.
     */
    command?: string;
    /**
     * The command as an argument vector, run by tmux directly and never through a shell: tmux
     * hands a command of more than one word to execvp as it stands, so a word holding `$(...)` or a
     * quote reaches the process as those characters. Wins over `command`.
     */
    argv?: string[];
    /**
     * Makes the terminal a task terminal of a project command or a LaTeX build: its session is kept
     * after its line ended, with the status of the line, and marked so the list reports it.
     * Server-side only.
     */
    task?: TerminalJob;
    /**
     * The values of a task's placeholders, each set in the session's environment under a name
     * that starts with TASK_ENV_PREFIX, which the line names as `"$OCULUS_ARG_<n>"`. Server-side
     * only, and only beside `task`.
     */
    taskEnv?: Record<string, string>;
};

/** The environment names a start may set: the two agents' account folders. */
export const ENV_NAMES = ['CLAUDE_CONFIG_DIR', 'CODEX_HOME'];

/**
 * The variable every terminal oculus starts carries: Claude Code draws in the classic renderer when
 * it is set, which scrolls in the terminal's normal buffer, where the fullscreen renderer draws in
 * the alternate screen that keeps no scrollback in the grid or in tmux. A Claude that is running
 * keeps the renderer it started with.
 */
const GRID_ENV = 'CLAUDE_CODE_DISABLE_ALTERNATE_SCREEN=1';

/** The prefix of the environment names a task's placeholder values are set under. */
export const TASK_ENV_PREFIX = 'OCULUS_ARG_';

/**
 * A value as one tmux argument that reads back as the value. tmux takes an argument ending in `;`
 * as the end of a command, and `\;` as a literal `;`, so a value ending in `;` has that last
 * character escaped.
 */
export function tmuxValue(value: string): string {
    return value.endsWith(';') ? `${value.slice(0, -1)}\\;` : value;
}

/** The task mark of a job, and the job a mark names or null when it names none. */
function jobOption(job: TerminalJob): string {
    return JSON.stringify(job);
}

const jobShape = z.object({
    repo: z.string(),
    name: z.string(),
    source: z.enum(['file', 'saved', 'found', 'app', 'latex']).optional().catch(undefined),
    token: z.string().optional().catch(undefined),
    chain: z
        .array(z.object({ name: z.string(), cwd: z.string() }))
        .optional()
        .catch(undefined),
    app: z
        .object({
            app: z.string(),
            title: z.string(),
            type: z.string(),
            background: z.boolean()
        })
        .optional()
        .catch(undefined),
    matchers: z.array(z.string()).optional().catch(undefined),
    latex: z
        .object({
            step: z.string(),
            main: z.string(),
            recipe: z.string().optional().catch(undefined),
            target: z
                .union([
                    z.object({ id: z.string() }),
                    z.object({ root: z.string(), path: z.string() })
                ])
                .optional()
                .catch(undefined)
        })
        .optional()
        .catch(undefined)
});

/** The job a task mark holds, or null for a mark that is not the JSON of one. */
function parseJob(value: string): TerminalJob | null {
    try {
        const read = jobShape.safeParse(JSON.parse(value));
        return read.success ? read.data : null;
    } catch {
        return null;
    }
}

/** The tmux session name of a terminal id. */
export function sessionName(id: string): string {
    return `${PREFIX}${id}`;
}

/** The id of a tmux session name, or null when the session is not oculus's. */
export function terminalId(session: string): string | null {
    return session.startsWith(PREFIX) ? session.slice(PREFIX.length) : null;
}

/** Whether a string is an id start() could have produced. Everything else is refused unread. */
export function isTerminalId(id: unknown): id is string {
    return typeof id === 'string' && /^[0-9a-f]{6}-(claude|codex|shell|app)$/.test(id);
}

/** The kind an id ends in, or the kind a pane's command names when the suffix says nothing. */
export function kindOf(id: string, command: string): TerminalKind {
    for (const kind of KINDS) if (id.endsWith(`-${kind}`)) return kind;
    if (command === 'claude') return 'claude';
    if (command === 'codex') return 'codex';
    return 'shell';
}

/** What a kind runs: the two agents by name, and the user's own shell for a plain terminal. */
export function commandFor(kind: TerminalKind): string {
    if (kind === 'claude') return 'claude';
    if (kind === 'codex') return 'codex';
    const shell = process.env.SHELL;
    return shell === undefined || shell === '' ? '/bin/zsh' : shell;
}

/**
 * The argv that continues one session: what the tool's own CLI is called with. `claude --resume
 * <id>` and `codex resume <id>` are the documented forms, and the id is a UUID, so the argv holds
 * nothing a shell would read as anything but three words.
 */
export function resumeArgs(resume: TerminalResume): string[] {
    if (!RESUME_TOOLS.includes(resume.tool)) {
        throw new Error(`tool must be one of ${RESUME_TOOLS.join(', ')}`);
    }
    if (!isSessionId(resume.id)) throw new TerminalRefused('not-a-session');
    if (resume.tool === 'claude') return ['claude', '--resume', resume.id];
    return ['codex', 'resume', resume.id];
}

/** What the `@oculus_resumes` option holds for a resume, and what parseResumes reads back. */
export function resumeOption(resume: TerminalResume): string {
    return `${resume.tool}:${resume.id}`;
}

/** The option's value as a resume, or null when the terminal continues nothing. */
export function parseResumes(value: string): TerminalResume | null {
    const at = value.indexOf(':');
    if (at < 0) return null;
    const tool = value.slice(0, at) as TerminalResume['tool'];
    const id = value.slice(at + 1);
    if (!RESUME_TOOLS.includes(tool) || !isSessionId(id)) return null;
    return { tool, id };
}

/** A fresh id: three random bytes as hex, then the kind, so the name carries what the pane runs. */
export function newId(kind: TerminalKind): string {
    return `${randomBytes(3).toString('hex')}-${kind}`;
}

function geometry(value: unknown, field: string): number {
    if (
        typeof value !== 'number' ||
        !Number.isInteger(value) ||
        value < 1 ||
        value > MAX_GEOMETRY
    ) {
        throw new Error(`${field} must be a whole number between 1 and ${MAX_GEOMETRY}`);
    }
    return value;
}

function directory(cwd: unknown): string {
    if (typeof cwd !== 'string' || cwd === '' || !isAbsolute(cwd)) {
        throw new Error('cwd must be an absolute path');
    }
    let stat;
    try {
        stat = statSync(cwd);
    } catch {
        throw new Error(`cwd does not exist: ${cwd}`);
    }
    if (!stat.isDirectory()) throw new Error(`cwd is not a directory: ${cwd}`);
    return cwd;
}

function label(name: unknown, id: string): string {
    if (name === undefined || name === null || name === '') return id;
    if (typeof name !== 'string') throw new Error('name must be a string');
    // eslint-disable-next-line no-control-regex
    if (/[\u0000-\u001f]/.test(name)) throw new Error('name must not hold control characters');
    if (name.length > NAME_MAX) throw new Error(`name must be at most ${NAME_MAX} characters`);
    return name;
}

/** The arguments of the list; separate from listTerminals so a test can read them. */
export function listArgs(): string[] {
    return ['list-sessions', '-F', LIST_FORMAT];
}

/**
 * The status a task terminal's line ended with, or null while it runs. A line that ended with no
 * status (tmux reports none for a process a signal ended) is read as 1, so it is shown as a
 * failure and not as still running.
 */
function exitOf(dead: string, status: string): number | null {
    if (dead !== '1') return null;
    return /^\d+$/.test(status) ? Number(status) : 1;
}

/** One line of the list as a Terminal, or null when it is not an oculus session. */
export function parseTerminal(line: string): Terminal | null {
    const fields = line.split('\t');
    if (fields.length < 6) return null;
    if (fields[0].startsWith(USAGE_PREFIX)) return null;
    const id = terminalId(fields[0]);
    if (id === null || id === '') return null;
    const created = Number(fields[1]);
    const command = fields[3] ?? '';
    const named = fields[6] ?? '';
    const mark = fields[11] ?? '';
    return {
        resumes: parseResumes(fields[7] ?? ''),
        task: mark !== '',
        exit: mark === '' ? null : exitOf(fields[12] ?? '', fields[13] ?? ''),
        job: parseJob(mark),
        // A session named by hand under the prefix is listed and flagged: the page can say why its
        // controls are refused instead of offering a stop that cannot be built.
        foreign: !isTerminalId(id),
        id,
        name: named === '' ? id : named,
        title: fields[8] ?? '',
        icon: fields[9] ?? '',
        color: fields[10] ?? '',
        kind: kindOf(id, command),
        app: fields[14] ?? '',
        cwd: fields[5] ?? '',
        command,
        pid: Number.isFinite(Number(fields[4])) ? Number(fields[4]) : 0,
        created: Number.isFinite(created) ? new Date(created * 1000).toISOString() : '',
        attached: Number(fields[2]) > 0
    };
}

/** Every oculus session, newest last, as the list reported them. */
export function parseTerminals(text: string): Terminal[] {
    const found: Terminal[] = [];
    for (const line of text.split('\n')) {
        if (line === '') continue;
        const terminal = parseTerminal(line);
        if (terminal !== null) found.push(terminal);
    }
    return found;
}

/**
 * The pid of the tmux server that answered a list, the last field of its last row; null when the
 * list has no row or that field is no pid. The last field is read because a folder or a title may
 * hold a tab or a newline, which moves the fields of its own row and cuts it, while the list's text
 * always ends with the pid of its last row. It is a number the operating system can be asked about
 * after the server's socket file is gone, which tmux itself cannot be.
 */
export function serverPid(text: string): number | null {
    const row = text.split('\n').findLast((line) => line !== '');
    const field = row?.split('\t').at(-1);
    if (field === undefined || !/^\d+$/.test(field)) return null;
    const pid = Number(field);
    return pid > 0 ? pid : null;
}

/**
 * The terminals. A tmux server with no session at all exits non-zero on list-sessions, which is not
 * a failure here: it is the ordinary state of a machine where nothing was started yet.
 */
export async function listTerminals(options: RunOptions = {}): Promise<Terminal[]> {
    try {
        return parseTerminals(await (options.run ?? run)(listArgs(), options));
    } catch {
        return [];
    }
}

/** The pane process of one pane of an oculus session. */
export type Pane = {
    session: string;
    /** The terminal id of a terminal session; null for a hidden usage session. */
    terminal: string | null;
    /** True for a hidden usage session. */
    usage: boolean;
    pid: number;
};

/** The arguments of the pane list: every pane of every session, with its session and pane pid. */
function paneArgs(): string[] {
    return ['list-panes', '-a', '-F', '#{session_name} #{pane_pid}'];
}

/**
 * The panes of the terminal sessions and of the hidden usage sessions, one per line of the list.
 * A session that is neither (not oculus's, or named `oculus-` by hand with no terminal id) and a
 * line with no whole positive pid are left out.
 */
function parsePanes(text: string): Pane[] {
    const panes: Pane[] = [];
    for (const line of text.split('\n')) {
        const cut = line.lastIndexOf(' ');
        const field = line.slice(cut + 1);
        if (cut < 0 || !/^\d+$/.test(field) || Number(field) === 0) continue;
        const session = line.slice(0, cut);
        const pid = Number(field);
        if (session.startsWith(USAGE_PREFIX)) {
            panes.push({ session, terminal: null, usage: true, pid });
            continue;
        }
        const id = terminalId(session);
        if (isTerminalId(id)) panes.push({ session, terminal: id, usage: false, pid });
    }
    return panes;
}

/** Every pane of every terminal and usage session; none when tmux is not running. */
export async function listPanes(options: RunOptions = {}): Promise<Pane[]> {
    try {
        return parsePanes(await (options.run ?? run)(paneArgs(), options));
    } catch {
        return [];
    }
}

/**
 * The `-e NAME=value` pairs of a start. A name outside ENV_NAMES, or a value that is not an
 * absolute path, is refused: the only environment a start carries is an account folder.
 */
export function envArgs(env: Record<string, string> | undefined): string[] {
    const args: string[] = [];
    for (const [name, value] of Object.entries(env ?? {})) {
        if (!ENV_NAMES.includes(name)) {
            throw new Error(`env must name one of ${ENV_NAMES.join(', ')}`);
        }
        // eslint-disable-next-line no-control-regex
        if (!isAbsolute(value) || /[\u0000-\u001f]/.test(value)) {
            throw new Error(`${name} must be an absolute path`);
        }
        args.push('-e', `${name}=${value}`);
    }
    return args;
}

/**
 * The `-e NAME=value` pairs of a task's placeholder values. A name that is not TASK_ENV_PREFIX and
 * a number, or a value holding a NUL, is refused; any other text is a value, line breaks included,
 * since it reaches the shell as a variable and is never read as code.
 */
export function taskEnvArgs(env: Record<string, string> | undefined): string[] {
    const args: string[] = [];
    const named = new RegExp(`^${TASK_ENV_PREFIX}[1-9][0-9]*$`);
    for (const [name, value] of Object.entries(env ?? {})) {
        if (!named.test(name)) throw new Error(`env must name ${TASK_ENV_PREFIX}<n>`);
        if (value.includes('\u0000')) throw new Error(`${name} must hold no NUL`);
        args.push('-e', tmuxValue(`${name}=${value}`));
    }
    return args;
}

/** A vector tmux runs directly: at least two words, `env` before a vector of one. */
function vector(command: string[]): string[] {
    return command.length === 1 ? ['env', ...command] : command;
}

/**
 * What a start joins to its `new-session`: a task's mark and the environment of its placeholders,
 * the fixed `NAME=value` pairs the process starts with, and the user options of the session (its
 * name, the session it resumes) as name and value.
 */
type Joined = {
    task?: TerminalJob;
    taskEnv?: Record<string, string>;
    fixedEnv?: string[];
    options?: [string, string][];
};

/**
 * The arguments that start a terminal, with the command already chosen: one shell command as one
 * word, or an argument vector after `--`. tmux runs a command of one word through `sh -c` and one
 * of more words directly, so a vector of one word gets `env` in front: `env` runs the word as the
 * program it names, and no shell reads it. The commands that set the session up follow, joined by
 * tmux's `;`, so they run in the invocation that creates the session: a session whose command ends
 * at once is set up too, which a later call would find gone. The environment of the process is the
 * account folder pairs of the request, then the fixed pairs of `joined`, then a task's placeholder
 * values, each as a `-e` pair ahead of the `--`.
 */
export function startArgs(
    id: string,
    request: CheckedStart,
    command: string | string[],
    joined: Joined = {}
): string[] {
    const { task, taskEnv, fixedEnv = [], options = [] } = joined;
    const session = sessionName(id);
    return [
        'new-session',
        '-d',
        '-s',
        session,
        '-c',
        request.cwd,
        '-x',
        String(request.cols),
        '-y',
        String(request.rows),
        ...envArgs(request.env),
        ...fixedEnv.flatMap((pair) => ['-e', pair]),
        ...(task === undefined ? [] : taskEnvArgs(taskEnv)),
        '--',
        ...(typeof command === 'string' ? [command] : vector(command)),
        ...(task === undefined ? [] : taskArgs(session, task)),
        ...options.flatMap(([option, value]) => [
            ';',
            'set-option',
            '-t',
            session,
            option,
            tmuxValue(value)
        ])
    ];
}

/**
 * The commands that make a session a task terminal, joined to its `new-session` by tmux's `;`
 * separator so they run in the same invocation: a session set up by a later call loses the status
 * of a line that ended before that call arrived. `remain-on-exit` keeps the pane after its line
 * ended, and the task option marks the session and names the job.
 */
function taskArgs(session: string, task: TerminalJob): string[] {
    return [
        ';',
        'set-option',
        '-t',
        session,
        'remain-on-exit',
        'on',
        ';',
        'set-option',
        '-t',
        session,
        TASK_OPTION,
        jobOption(task)
    ];
}

/**
 * Start a terminal and answer with the record the list then reports for it. Every terminal it
 * starts carries the account folder of the request, `CLAUDE_CODE_DISABLE_ALTERNATE_SCREEN=1` (so a
 * Claude the terminal runs, or a shell runs later, draws in a grid that keeps its scrollback), and
 * a task's placeholder values.
 */
export async function startTerminal(
    request: StartRequest,
    options: StartOptions = {}
): Promise<Terminal> {
    const kind = request.kind;
    if (!isTerminalKind(kind)) throw new Error(`kind must be one of ${KINDS.join(', ')}`);
    if (kind === 'app' && (request.app === undefined || request.app === '')) {
        throw new Error('an app terminal names its app');
    }
    const cwd = directory(request.cwd);
    const cols = geometry(request.cols, 'cols');
    const rows = geometry(request.rows, 'rows');
    const resume = request.resume;
    if (resume !== undefined && resume.tool !== kind) {
        throw new Error(`kind must be the tool being resumed: ${resume.tool}`);
    }
    const id = request.id ?? newId(kind);
    if (!isTerminalId(id) || !id.endsWith(`-${kind}`)) {
        throw new Error(`id must be a terminal id for ${kind}`);
    }
    const name = label(request.name, id);
    // A resume is its argument vector, run by tmux directly; a bare kind is its one command word.
    const command =
        options.argv ??
        options.command ??
        (resume === undefined ? commandFor(kind) : resumeArgs(resume));
    if (Array.isArray(command) && command.length === 0) throw new Error('argv must not be empty');
    const exec = options.run ?? run;
    const labels: [string, string][] = [
        ...(name === id ? [] : [[NAME_OPTION, name] as [string, string]]),
        ...(resume === undefined
            ? []
            : [[RESUMES_OPTION, resumeOption(resume)] as [string, string]]),
        ...(request.app === undefined || request.app === ''
            ? []
            : [[APP_OPTION, request.app] as [string, string]])
    ];
    await exec(
        startArgs(id, { kind, cwd, cols, rows, env: request.env }, command, {
            task: options.task,
            taskEnv: options.taskEnv,
            fixedEnv: [GRID_ENV],
            options: labels
        }),
        options
    );
    const terminals = await listTerminals(options);
    const found = terminals.find((terminal) => terminal.id === id);
    if (found !== undefined) return found;
    throw new TerminalRefused('terminal-not-started');
}

/**
 * The arguments that run a task terminal's line again in the same pane. `-k` ends a line still
 * running first; without a command, tmux runs the one the pane was started with, and with one the
 * pane runs it and keeps it for the next run.
 */
function respawnArgs(id: string, command?: string): string[] {
    return [
        'respawn-pane',
        '-k',
        '-t',
        sessionName(id),
        ...(command === undefined ? [] : [command])
    ];
}

/**
 * Run a task terminal's line again, with the line `command` names when it is given. A `task` is
 * written to the terminal's mark first, so the mark names the job the pane now runs.
 */
export async function respawnTerminal(
    id: string,
    options: RunOptions = {},
    command?: string,
    task?: TerminalJob
): Promise<void> {
    if (!isTerminalId(id)) throw new TerminalRefused('not-ours');
    const exec = options.run ?? run;
    if (task !== undefined) {
        await exec(['set-option', '-t', sessionName(id), TASK_OPTION, jobOption(task)], options);
    }
    await exec(respawnArgs(id, command), options);
}

/** The arguments that resize a terminal's window. */
export function resizeArgs(id: string, cols: number, rows: number): string[] {
    return ['resize-window', '-t', sessionName(id), '-x', String(cols), '-y', String(rows)];
}

export async function resizeTerminal(
    id: string,
    cols: unknown,
    rows: unknown,
    options: RunOptions = {}
): Promise<void> {
    if (!isTerminalId(id)) throw new TerminalRefused('not-ours');
    await (options.run ?? run)(
        resizeArgs(id, geometry(cols, 'cols'), geometry(rows, 'rows')),
        options
    );
}

/** The arguments that kill a terminal's session. */
export function stopArgs(id: string): string[] {
    return ['kill-session', '-t', sessionName(id)];
}

export async function stopTerminal(id: string, options: RunOptions = {}): Promise<void> {
    if (!isTerminalId(id)) throw new TerminalRefused('not-ours');
    await (options.run ?? run)(stopArgs(id), options);
}

/**
 * The arguments that capture all the text a pane holds, its history and its screen, as lines
 * rather than as the screen's rows: a line the pane wrapped is joined again.
 */
function outputArgs(id: string): string[] {
    return ['capture-pane', '-p', '-J', '-S', '-', '-t', sessionName(id)];
}

/** All the text a terminal's pane holds, for the output of a task no grid shows. */
export async function paneOutput(id: string, options: RunOptions = {}): Promise<string> {
    if (!isTerminalId(id)) throw new TerminalRefused('not-ours');
    return (options.run ?? run)(outputArgs(id), options);
}

/** What the pane already shows, so an attaching page starts with the screen rather than blank. */
export async function scrollback(
    id: string,
    lines: number = SCROLLBACK_LINES,
    options: RunOptions = {}
): Promise<string> {
    if (!isTerminalId(id)) throw new TerminalRefused('not-ours');
    return (options.run ?? run)(captureArgs(sessionName(id), lines), options);
}

/** The arguments that type bytes into a pane as they are: two lowercase hex digits per byte. */
export function sendBytesArgs(id: string, bytes: Uint8Array): string[] {
    const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0'));
    return ['send-keys', '-t', sessionName(id), '-H', ...hex];
}

/**
 * The commands that type bytes into a pane: one `send-keys -H` per piece of inputChunks, in order.
 * The page's typing and a steer both go this way, so a text of any length fits tmux's cap on one
 * command and no escape sequence or character is split across two.
 */
export function inputArgs(id: string, bytes: Uint8Array): string[][] {
    return inputChunks(Buffer.from(bytes)).map((piece) => sendBytesArgs(id, piece));
}

/**
 * The arguments that send one chunk of text a server-built message types: literal text or a key by
 * name. `--` is what stops getopt inside tmux from reading a line beginning with a dash
 * as flags.
 */
export function sendKeysArgs(id: string, chunk: KeyChunk): string[] {
    const target = sessionName(id);
    if ('literal' in chunk) return ['send-keys', '-t', target, '-l', '--', chunk.literal];
    return ['send-keys', '-t', target, '--', chunk.key];
}

/**
 * The calls that type one message into a running agent and send it: the text as its UTF-8 bytes,
 * in as many `send-keys -H` commands as its length takes, a line break inside it typed as the byte
 * it is, then Enter. Both agents read a typed line feed as a new line of the message and Enter as
 * its end.
 */
export function steerArgs(id: string, text: string): string[][] {
    return [...inputArgs(id, Buffer.from(text, 'utf8')), sendKeysArgs(id, { key: 'Enter' })];
}

/** Type one message into a terminal oculus started, then Enter. */
export async function steerTerminal(id: string, text: string, options: RunOptions = {}) {
    if (!isTerminalId(id)) throw new TerminalRefused('not-ours');
    if (typeof text !== 'string' || text.trim() === '') throw new Error('text must not be empty');
    if (text.length > STEER_MAX) throw new Error(`text must be at most ${STEER_MAX} chars`);
    // A control character typed literally is a key of its own, which a message must not carry.
    if (STEER_CONTROL.test(text)) {
        throw new Error('text must not hold control characters');
    }
    for (const args of steerArgs(id, text)) await (options.run ?? run)(args, options);
}

/**
 * Send Ctrl+C to a terminal's pane: the terminal's line reads it as an interrupt, so the program
 * in the foreground and its children end. The tmux session stays, with the line's exit status.
 */
export async function stopForeground(id: string, options: RunOptions = {}): Promise<void> {
    if (!isTerminalId(id)) throw new TerminalRefused('not-ours');
    await (options.run ?? run)(sendKeysArgs(id, { key: 'C-c' }), options);
}

/**
 * Interrupt the turn a terminal's agent is running: Escape, which both agents read as stopping the
 * turn and keeping the session. It is not a stop: the tmux session and its process stay.
 */
export async function interruptTerminal(id: string, options: RunOptions = {}): Promise<void> {
    if (!isTerminalId(id)) throw new TerminalRefused('not-ours');
    await (options.run ?? run)(sendKeysArgs(id, { key: 'Escape' }), options);
}
