// Layer 2, server. The one process boundary of DESIGN.md's "PTY": every tmux call this application
// makes goes through run() or control(), as a list of arguments and never as a shell string, the
// same rule server/git.ts holds for git.
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

/** The binary. Resolved on PATH, since a homebrew tmux and a system tmux sit in different places. */
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

/** The `-S <socket>` prefix, or nothing when the default tmux server is meant. */
export function socketArgs(options: TmuxOptions = {}): string[] {
    const socket = options.socket;
    return socket === undefined || socket === '' ? [] : ['-S', socket];
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
                const said = String(stderr).trim();
                reject(new Error(said === '' ? error.message : said));
            }
        );
    });
}

/**
 * One argument as tmux's own lexer reads it: double quotes, with a backslash, a double quote and a
 * dollar escaped. The dollar matters because tmux expands `$name` inside double quotes, so a page
 * that types `$HOME` must not have tmux read its environment; tests/server/pty/sessions.test.ts
 * sends exactly that through a real tmux and asserts the characters come back.
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
    output(pane: string, bytes: Buffer): void;
    event(event: ControlEvent): void;
    /** The child ended. The caller decides whether to open another one. */
    exit(): void;
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
 * oculus started is also reachable from any terminal with `tmux attach -t oculus-<id>`. Replies come
 * back in the order the commands went out, so the pending queue is a plain FIFO.
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
    const pending: Array<{ resolve(text: string): void; reject(error: Error): void }> = [];

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

/** One piece of what the page typed: literal text, or a key tmux has a name for. */
export type KeyChunk = { literal: string } | { key: string };

/** The escape sequences xterm.js sends, longest first, each with tmux's name for that key. */
const SEQUENCES: Array<[string, string]> = [
    ['\u001b[1~', 'Home'],
    ['\u001b[4~', 'End'],
    ['\u001b[3~', 'DC'],
    ['\u001b[5~', 'PageUp'],
    ['\u001b[6~', 'PageDown'],
    ['\u001b[A', 'Up'],
    ['\u001b[B', 'Down'],
    ['\u001b[C', 'Right'],
    ['\u001b[D', 'Left'],
    ['\u001b[H', 'Home'],
    ['\u001b[F', 'End'],
    ['\u001bOA', 'Up'],
    ['\u001bOB', 'Down'],
    ['\u001bOC', 'Right'],
    ['\u001bOD', 'Left'],
    ['\u001bOH', 'Home'],
    ['\u001bOF', 'End']
];

/** The single characters with a tmux name. Everything else below 0x20 is a Ctrl-letter. */
const SINGLES = new Map<string, string>([
    ['\r', 'Enter'],
    ['\n', 'Enter'],
    ['\t', 'Tab'],
    ['\u001b', 'Escape'],
    ['\u007f', 'BSpace'],
    ['\u0008', 'BSpace'],
    ['\u0000', 'C-Space']
]);

/** tmux's name for a control byte, or null when the byte is not one. */
export function keyName(character: string): string | null {
    const named = SINGLES.get(character);
    if (named !== undefined) return named;
    const code = character.charCodeAt(0);
    if (code >= 1 && code <= 26) return `C-${String.fromCharCode(96 + code)}`;
    if (code < 0x20) return `C-${String.fromCharCode(64 + code)}`;
    return null;
}

/**
 * What the page typed, split into the runs `send-keys` can carry: literal text goes out with `-l`
 * and a named key goes out as its name, because `-l` would type the letters of the name instead.
 */
export function splitKeys(input: string): KeyChunk[] {
    const chunks: KeyChunk[] = [];
    let literal = '';
    const flush = (): void => {
        if (literal === '') return;
        chunks.push({ literal });
        literal = '';
    };
    let at = 0;
    while (at < input.length) {
        const sequence = SEQUENCES.find(([text]) => input.startsWith(text, at));
        if (sequence !== undefined) {
            flush();
            chunks.push({ key: sequence[1] });
            at += sequence[0].length;
            continue;
        }
        const character = input[at];
        const named = keyName(character);
        if (named !== null) {
            flush();
            chunks.push({ key: named });
            at += 1;
            continue;
        }
        literal += character;
        at += 1;
    }
    flush();
    return chunks;
}
