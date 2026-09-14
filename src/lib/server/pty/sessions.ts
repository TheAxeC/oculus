// Layer 2, server. The terminals as records: what `tmux list-sessions` says, and the four commands
// that start, resize, stop and capture one. DESIGN.md's "PTY" puts a session inside tmux so it
// outlives the server; the `oculus-` prefix is the only thing that tells a session oculus started
// from one Axel started in a terminal window, and the kind is the suffix of the same name.
//
// Nothing on the page reaches a command line here. A cwd is checked to be an absolute existing
// directory, the geometry is checked to be a small positive integer, the id is checked against the
// shape start() gives it, and what the page typed goes out only through `send-keys -l`.

import { randomBytes } from 'node:crypto';
import { statSync } from 'node:fs';
import { isAbsolute } from 'node:path';
import type { Terminal, TerminalKind, TerminalResume } from '../../data/model.ts';
import { run, type KeyChunk, type TmuxOptions } from './tmux.ts';

/** Every tmux session oculus owns carries this prefix and nothing else does. */
export const PREFIX = 'oculus-';

/** Hidden Claude usage sessions begin with this full tmux session-name prefix. */
export const USAGE_PREFIX = `${PREFIX}usage-`;

/** The three things a terminal runs: DESIGN.md's two agents and a shell. */
export const KINDS: TerminalKind[] = ['claude', 'codex', 'shell'];

/** The default scrollback handed to a page that attaches. */
export const SCROLLBACK_LINES = 2000;

/** The widest geometry accepted from the page; a terminal larger than this is not a terminal. */
export const MAX_GEOMETRY = 2000;

/** The name a terminal gets when the starter named nothing is its id, so the field is never empty. */
const NAME_OPTION = '@oculus_name';

/**
 * Which session a terminal continues, kept as a tmux user option beside the name so tmux stays the
 * only store: `<tool>:<session id>`, and unset on a terminal that continues nothing.
 */
const RESUMES_OPTION = '@oculus_resumes';

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
 * seventh is the label the starter gave, kept as a tmux user option so tmux stays the only store.
 */
export const LIST_FORMAT = [
    '#{session_name}',
    '#{session_created}',
    '#{session_attached}',
    '#{pane_current_command}',
    '#{pane_pid}',
    '#{pane_current_path}',
    `#{${NAME_OPTION}}`,
    `#{${RESUMES_OPTION}}`
].join('\t');

export type StartRequest = {
    /** A preallocated id when a caller must prepare a resource named after the terminal. */
    id?: string;
    kind: TerminalKind;
    cwd: string;
    cols: number;
    rows: number;
    name?: string;
    /**
     * The session this terminal continues. With it the command is the tool's own resume command
     * rather than a bare `claude` or `codex`, and the kind is that tool.
     */
    resume?: TerminalResume;
};

/** One tmux call, the shape run() of tmux.ts has, for a test that records the argv instead. */
export type Runner = (args: string[], options?: TmuxOptions) => Promise<string>;

export type RunOptions = TmuxOptions & {
    /**
     * The tmux call to make. Server-side only: the endpoint never passes it, and
     * tests/routes/terminal.test.ts uses it to record what would have been run.
     */
    run?: Runner;
};

export type StartOptions = RunOptions & {
    /**
     * The command to run instead of the one the kind names. Server-side only: the endpoint never
     * passes it, and tests/server/pty/sessions.test.ts uses it to run `cat` rather than a shell.
     */
    command?: string;
};

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
    return typeof id === 'string' && /^[0-9a-f]{6}-(claude|codex|shell)$/.test(id);
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
    if (!isSessionId(resume.id)) throw new Error(`not a session id: ${String(resume.id)}`);
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
    if (name.length > 80) throw new Error('name must be at most 80 characters');
    return name;
}

/** The arguments of the list; separate from listTerminals so a test can read them. */
export function listArgs(): string[] {
    return ['list-sessions', '-F', LIST_FORMAT];
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
    return {
        resumes: parseResumes(fields[7] ?? ''),
        // A session named by hand under the prefix is listed and flagged: the page can say why its
        // controls are refused instead of offering a stop that cannot be built.
        foreign: !isTerminalId(id),
        id,
        name: named === '' ? id : named,
        kind: kindOf(id, command),
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

/** The arguments that start a terminal, with the command already chosen. */
export function startArgs(id: string, request: StartRequest, command: string): string[] {
    return [
        'new-session',
        '-d',
        '-s',
        sessionName(id),
        '-c',
        request.cwd,
        '-x',
        String(request.cols),
        '-y',
        String(request.rows),
        command
    ];
}

/** Start a terminal and answer with the record the list then reports for it. */
export async function startTerminal(
    request: StartRequest,
    options: StartOptions = {}
): Promise<Terminal> {
    const kind = request.kind;
    if (!KINDS.includes(kind)) throw new Error(`kind must be one of ${KINDS.join(', ')}`);
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
    // The argv is joined into the one shell-command new-session takes. Both words of it are fixed
    // and the third is a UUID, so there is nothing here for a shell to read as anything else.
    const command =
        options.command ?? (resume === undefined ? commandFor(kind) : resumeArgs(resume).join(' '));
    const exec = options.run ?? run;
    await exec(startArgs(id, { kind, cwd, cols, rows }, command), options);
    if (name !== id) {
        await exec(['set-option', '-t', sessionName(id), NAME_OPTION, name], options);
    }
    if (resume !== undefined) {
        await exec(
            ['set-option', '-t', sessionName(id), RESUMES_OPTION, resumeOption(resume)],
            options
        );
    }
    const terminals = await listTerminals(options);
    const found = terminals.find((terminal) => terminal.id === id);
    if (found !== undefined) return found;
    throw new Error(`the terminal did not start: ${id}`);
}

/** The arguments that resize a terminal's window. */
export function resizeArgs(id: string, cols: number, rows: number): string[] {
    return ['resize-window', '-t', sessionName(id), '-x', String(cols), '-y', String(rows)];
}

export async function resizeTerminal(
    id: string,
    cols: number,
    rows: number,
    options: RunOptions = {}
): Promise<void> {
    if (!isTerminalId(id)) throw new Error(`not a terminal id: ${String(id)}`);
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
    if (!isTerminalId(id)) throw new Error(`not a terminal id: ${String(id)}`);
    await (options.run ?? run)(stopArgs(id), options);
}

/** The arguments that capture what the pane already shows, escape sequences and all. */
export function captureArgs(id: string, lines: number = SCROLLBACK_LINES): string[] {
    return ['capture-pane', '-p', '-e', '-S', `-${lines}`, '-t', sessionName(id)];
}

/** What the pane already shows, so an attaching page starts with the screen rather than blank. */
export async function scrollback(
    id: string,
    lines: number = SCROLLBACK_LINES,
    options: RunOptions = {}
): Promise<string> {
    if (!isTerminalId(id)) throw new Error(`not a terminal id: ${String(id)}`);
    return (options.run ?? run)(captureArgs(id, lines), options);
}

/**
 * The arguments that send one chunk of what the page typed. `--` is what stops getopt inside tmux
 * from reading a line beginning with a dash as flags; tests/server/pty/sessions.test.ts types such a
 * line through a real tmux and reads it back.
 */
export function sendKeysArgs(id: string, chunk: KeyChunk): string[] {
    const target = sessionName(id);
    if ('literal' in chunk) return ['send-keys', '-t', target, '-l', '--', chunk.literal];
    return ['send-keys', '-t', target, '--', chunk.key];
}
