// Layer 2, server. The one process boundary of DESIGN.md's "PTY": every tmux call this application
// makes goes through run() or control(), as a list of arguments and never as a shell string, the
// same rule server/core/git.ts holds for git.
//
// There is no native pty module here and there will not be one. tmux is the terminal, and its
// control mode is the bridge: `tmux -C attach-session -t <session>` with piped stdio prints
// `%begin`/`%end` around each command's reply, `%output %<pane-id> <bytes>` for each chunk a pane
// wrote, and `%session-changed` and its relatives as the server's state moves. One control client
// per tmux server sees every session's output, so the server holds one, not one per terminal.
//
// The bytes of `%output` are escaped by tmux: a byte below 0x20 and a backslash become `\ooo` in
// octal, and every other byte is written through as itself. A UTF-8 sequence therefore arrives as
// its raw bytes, possibly split across two reads, which is why the stream is buffered as latin1
// (one character per byte, and reversible) and decoded to a Buffer only once a whole line is in.

import { execFile, spawn } from 'node:child_process';
import type { ChildProcessWithoutNullStreams } from 'node:child_process';
import { basename } from 'node:path';

/**
 * The binary. Resolved on PATH, since a homebrew tmux and a system tmux sit in different places.
 */
export const TMUX = 'tmux';

/** How long a tmux command may take before it is killed, in milliseconds. */
export const TIMEOUT_MS = 5000;

/** How long the control client waits before it is restarted after an unexpected exit. */
export const RESTART_MS = 1000;

export type TmuxOptions = {
    /** `-S` socket path. A test points this at a private server so the user's tmux is untouched. */
    socket?: string;
    /** The binary, for a test that wants a stub. Defaults to TMUX. */
    binary?: string;
};

/**
 * The prefix of every tmux call: `-u`, and `-S <socket>` when a private server is meant. `-u` tells
 * tmux the client takes UTF-8, which it otherwise decides from the locale of the process that runs
 * it; a server started with no UTF-8 locale would have every tab of a list format and every
 * character outside ASCII in a pane's output written as `_`, and then no terminal would be read.
 */
export function socketArgs(options: TmuxOptions = {}): string[] {
    const socket = options.socket;
    return socket === undefined || socket === '' ? ['-u'] : ['-u', '-S', socket];
}

/**
 * One tmux command. The arguments are a list, so nothing here is ever parsed by a shell, and the
 * timeout is what stops a hung tmux from hanging a watcher. A non-zero exit rejects with tmux's own
 * stderr, which is what the terminal endpoint reports back to the page.
 */
export function run(
    args: string[],
    options: TmuxOptions = {},
    timeout: number = TIMEOUT_MS
): Promise<string> {
    const binary = options.binary ?? TMUX;
    const argv = [...socketArgs(options), ...args];
    return new Promise((resolve, reject) => {
        execFile(
            binary,
            argv,
            { timeout, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 },
            (error, stdout, stderr) => {
                if (error === null) {
                    resolve(stdout);
                    return;
                }
                const said = stderr.trim();
                reject(new Error(said === '' ? error.message : said));
            }
        );
    });
}

/**
 * Whether the command `ps` printed for a process is tmux: its base name is `tmux`, or `tmux:` and
 * a title, which is how a tmux server names itself on Linux. A name that only holds `tmux`, such as
 * `tmuxinator`, is another program.
 */
export function isTmuxCommand(printed: string): boolean {
    const name = basename(printed.trim().split('\n')[0] ?? '');
    return name === 'tmux' || name.startsWith('tmux:');
}

/**
 * Whether the process with this pid is a running tmux: the operating system knows the pid
 * (`kill -0`) and the command it runs is tmux (`ps`). Neither needs the server's socket, so the
 * answer holds while the socket file is moved or removed, and turns false when the server exits or
 * the pid goes to another program.
 */
export async function tmuxRuns(pid: number): Promise<boolean> {
    if (!Number.isInteger(pid) || pid <= 1) return false;
    try {
        process.kill(pid, 0);
    } catch {
        // No such process, or one of another user (EPERM), which is not this user's tmux.
        return false;
    }
    return new Promise((resolve) => {
        execFile(
            'ps',
            ['-o', 'comm=', '-p', String(pid)],
            { timeout: TIMEOUT_MS, encoding: 'utf8' },
            (error, stdout) => {
                resolve(error === null && isTmuxCommand(stdout));
            }
        );
    });
}

/**
 * One argument as tmux's own lexer reads it: double quotes, with a backslash, a double quote and a
 * dollar escaped. The dollar matters because tmux expands `$name` inside double quotes, so a page
 * that types `$HOME` must not have tmux read its environment;
 * tests/server/machine/pty/sessions.test.ts sends exactly that through a real tmux and asserts the
 * characters come back.
 */
export function quote(arg: string): string {
    return `"${arg.replace(/([\\"$])/g, '\\$1')}"`;
}

/** A whole command line for the control client's stdin. */
export function commandLine(args: string[]): string {
    return `${args.map(quote).join(' ')}\n`;
}

/**
 * The bytes of one `%output` line. tmux escapes a byte below 0x20 and a backslash as three octal
 * digits; `\\` is accepted as well, since that is what the documentation calls a backslash.
 */
export function decodeOutput(escaped: string): Buffer {
    const bytes: number[] = [];
    for (let i = 0; i < escaped.length; i += 1) {
        if (escaped[i] === '\\' && i + 1 < escaped.length) {
            if (escaped[i + 1] === '\\') {
                bytes.push(0x5c);
                i += 1;
                continue;
            }
            const digits = escaped.slice(i + 1, i + 4);
            if (/^[0-7]{3}$/.test(digits)) {
                bytes.push(parseInt(digits, 8) & 0xff);
                i += 3;
                continue;
            }
        }
        bytes.push(escaped.charCodeAt(i) & 0xff);
    }
    return Buffer.from(bytes);
}

/** A reply block: the lines between `%begin` and its `%end`, or an `%error` instead. */
export type ControlReply = {
    /** tmux's command number, from the `%begin` line. */
    number: string;
    lines: string[];
    error: boolean;
};

/** Anything the control client said that was neither a reply nor pane output. */
export type ControlEvent = {
    /** The notification's name without its `%`, such as `session-changed`. */
    name: string;
    rest: string;
};

export type ParserHandlers = {
    output(pane: string, bytes: Buffer): void;
    reply(reply: ControlReply): void;
    event(event: ControlEvent): void;
};

export type ControlParser = {
    /** Feed one read from the child's stdout. Partial lines are held until the rest arrives. */
    feed(chunk: Buffer): void;
};

/**
 * The control stream, as a parser with no process in it, which is what lets the whole protocol be
 * tested on recorded text. tmux writes a command's reply as one contiguous block, so a line inside
 * a block is a reply line and nothing else.
 */
export function createParser(handlers: ParserHandlers): ControlParser {
    let held = '';
    let block: { number: string; lines: string[] } | null = null;

    const line = (text: string): void => {
        if (block !== null) {
            if (text.startsWith('%end ') || text.startsWith('%error ')) {
                const reply: ControlReply = {
                    number: block.number,
                    lines: block.lines,
                    error: text.startsWith('%error ')
                };
                block = null;
                handlers.reply(reply);
                return;
            }
            block.lines.push(text);
            return;
        }
        if (text.startsWith('%begin ')) {
            // `%begin <time> <number> <flags>`; the number is what tmux repeats on %end and %error.
            block = { number: text.split(' ')[2] ?? '', lines: [] };
            return;
        }
        if (text.startsWith('%output ')) {
            const rest = text.slice('%output '.length);
            const space = rest.indexOf(' ');
            const pane = space === -1 ? rest : rest.slice(0, space);
            const bytes = space === -1 ? '' : rest.slice(space + 1);
            handlers.output(pane, decodeOutput(bytes));
            return;
        }
        if (text.startsWith('%')) {
            const space = text.indexOf(' ');
            const name = space === -1 ? text.slice(1) : text.slice(1, space);
            handlers.event({ name, rest: space === -1 ? '' : text.slice(space + 1) });
        }
    };

    return {
        feed(chunk: Buffer): void {
            held += chunk.toString('latin1');
            let at = held.indexOf('\n');
            while (at !== -1) {
                const text = held.slice(0, at).replace(/\r$/, '');
                held = held.slice(at + 1);
                line(text);
                at = held.indexOf('\n');
            }
        }
    };
}

export type ControlHandlers = {
    output: (pane: string, bytes: Buffer) => void;
    event: (event: ControlEvent) => void;
    /** The child ended. The caller decides whether to open another one. */
    exit: () => void;
};

export type ControlClient = {
    /** Send one tmux command and resolve with its reply text, or reject on `%error`. */
    command(args: string[]): Promise<string>;
    /** Whether the child is still running. */
    live(): boolean;
    close(): void;
};

/**
 * A control client attached to one session of the user's own tmux server, which is why a session
 * oculus started is also reachable from any terminal with `tmux attach -t oculus-<id>`. Replies
 * come back in the order the commands went out, so the pending queue is a plain FIFO.
 */
export function control(
    session: string,
    handlers: ControlHandlers,
    options: TmuxOptions = {}
): ControlClient {
    const binary = options.binary ?? TMUX;
    const argv = [...socketArgs(options), '-C', 'attach-session', '-t', session];
    const child: ChildProcessWithoutNullStreams = spawn(binary, argv, {
        stdio: ['pipe', 'pipe', 'pipe']
    });
    let alive = true;
    const pending: { resolve(text: string): void; reject(error: Error): void }[] = [];

    const parser = createParser({
        output: handlers.output,
        event: handlers.event,
        reply: (reply) => {
            const waiting = pending.shift();
            if (waiting === undefined) return;
            const text = reply.lines.join('\n');
            if (reply.error) waiting.reject(new Error(text === '' ? 'tmux refused' : text));
            else waiting.resolve(text);
        }
    });

    child.stdout.on('data', (chunk: Buffer) => parser.feed(chunk));
    // tmux writes nothing useful on stderr in control mode, but an unread pipe would fill.
    child.stderr.resume();
    child.on('error', () => {
        alive = false;
    });
    child.on('exit', () => {
        alive = false;
        while (pending.length > 0) pending.shift()?.reject(new Error('the control client exited'));
        handlers.exit();
    });

    return {
        command(args: string[]): Promise<string> {
            if (!alive) return Promise.reject(new Error('the control client is not running'));
            return new Promise((resolve, reject) => {
                const entry = { resolve, reject };
                pending.push(entry);
                child.stdin.write(commandLine(args), (error) => {
                    if (error === undefined || error === null) return;
                    const at = pending.indexOf(entry);
                    if (at !== -1) pending.splice(at, 1);
                    reject(error);
                });
            });
        },
        live(): boolean {
            return alive;
        },
        close(): void {
            alive = false;
            child.stdin.end();
            child.kill();
        }
    };
}

/** One argument of a `send-keys` a server-built message types: literal text, or a key by name. */
export type KeyChunk = { literal: string } | { key: string };

/**
 * The most bytes one `send-keys -H` carries. `-H` takes one byte per word, and tmux's command-line
 * client refuses a command of more than 1000 words with "command too long" (measured on tmux 3.7c:
 * 996 bytes after `send-keys -t <session> -H` went through, 997 did not), so a piece is 996 bytes.
 */
export const INPUT_MOST = 996;

const ESC = 0x1b;
const BEL = 0x07;

/** Whether a byte continues a UTF-8 character rather than starting one. */
function continues(byte: number): boolean {
    return byte >= 0x80 && byte <= 0xbf;
}

/**
 * For each position of the input, whether an escape sequence is open there, so a cut before it
 * would split the sequence. A sequence opens at ESC and ends: a CSI (`ESC [`) at its final byte
 * 0x40-0x7E after parameter bytes 0x30-0x3F and intermediate bytes 0x20-0x2F, an SS3 (`ESC O`) at
 * the byte after the `O`, an OSC, DCS, APC or PM (`ESC ]`, `ESC P`, `ESC _`, `ESC ^`) at BEL or at
 * `ESC \`, and any other `ESC x` at `x`. A CSI broken by a byte outside those ranges ends before
 * that byte.
 */
function openAt(bytes: Buffer): boolean[] {
    const open: boolean[] = new Array<boolean>(bytes.length).fill(false);
    type Mode = 'ground' | 'escape' | 'csi' | 'ss3' | 'string' | 'string-escape';
    let mode: Mode = 'ground';
    for (let at = 0; at < bytes.length; at += 1) {
        const byte = bytes[at];
        if (mode === 'csi' && !(byte >= 0x20 && byte <= 0x7e)) mode = 'ground';
        // The position before this byte is inside a sequence when one is open and not yet ended.
        open[at] = mode !== 'ground';
        switch (mode) {
            case 'ground':
                if (byte === ESC) mode = 'escape';
                break;
            case 'escape':
                if (byte === 0x5b) mode = 'csi';
                else if (byte === 0x4f) mode = 'ss3';
                else if (byte === 0x5d || byte === 0x50 || byte === 0x5f || byte === 0x5e) {
                    mode = 'string';
                } else mode = 'ground';
                break;
            case 'csi':
                if (byte >= 0x40 && byte <= 0x7e) mode = 'ground';
                break;
            case 'ss3':
                mode = 'ground';
                break;
            case 'string':
                if (byte === BEL) mode = 'ground';
                else if (byte === ESC) mode = 'string-escape';
                break;
            case 'string-escape':
                mode = byte === 0x5c ? 'ground' : 'string';
                break;
        }
    }
    return open;
}

/**
 * What the page typed, cut into the pieces one `send-keys -H` each carries, at most `most` bytes a
 * piece. A cut never falls inside a UTF-8 character or inside an escape sequence, since a sequence
 * split across two commands reaches the pane as two writes and a program reads the lone ESC of the
 * first as the Escape key. A single sequence longer than `most` is cut at the last character
 * boundary within it.
 */
export function inputChunks(bytes: Buffer, most: number = INPUT_MOST): Buffer[] {
    const open = openAt(bytes);
    const cuttable = (at: number): boolean =>
        at === bytes.length || (!open[at] && !continues(bytes[at]));
    const pieces: Buffer[] = [];
    let start = 0;
    while (start < bytes.length) {
        const limit = Math.min(start + most, bytes.length);
        let end = limit;
        while (end > start && !cuttable(end)) end -= 1;
        if (end === start) {
            end = limit;
            while (end > start && end < bytes.length && continues(bytes[end])) end -= 1;
            if (end === start) end = limit;
        }
        pieces.push(bytes.subarray(start, end));
        start = end;
    }
    return pieces;
}
