// Layer 2, client state. The page's end of DESIGN.md's "PTY": the terminals the sessions payload
// carries, the three actions of /api/terminal, and the two messages a page writes on a `pty:`
// channel.
//
// The bytes of a pane are not state. entities.receive keeps one message per channel, the latest,
// which for a stream of output would be the page seeing only the chunk that happened to be last; so
// a `pty:` channel is read through socket.listen instead and nothing of it is stored. The server
// sends the scrollback to the attaching socket alone at version 0 and counts the chunks from 1
// (server/pty/channel.ts, `#attach`), so the listener is told which of the two it was handed and a
// reconnect repaints rather than appending a second copy of the scrollback.
//
// Every action is a write in DESIGN.md's "Auth" sense, since it runs a process on the machine: the
// POST carries the token state/writes.svelte.ts holds, and the socket carries it in its subscribe
// message (O17), which is what lets that socket send input at all.

import { message } from './entities.svelte.ts';
import { listen, send, subscribe, unsubscribe } from './socket.svelte.ts';
import { t } from './text.ts';
import { writeToken } from './writes.svelte.ts';
import type {
    SessionsPayload,
    PtyPayload,
    Terminal,
    TerminalKind,
    TerminalInput,
    TerminalResize,
    TerminalResume
} from '../data/model.ts';

// The three model types a view needs of a terminal. The boundary table lets `state/` import
// `data/model` and lets a view import `state/`, so they reach a view from here, the way
// state/selectors.svelte.ts re-exports the ones the session views read.
export type { Terminal, TerminalKind, TerminalResume } from '../data/model.ts';

/** The prefix of a terminal's channel, the server's `ptyChannel` seen from the page. */
const PREFIX = 'pty:';

/** The geometry a terminal is started at when the pane has not been measured yet. */
const COLS = 80;
const ROWS = 24;

/** What an action answered: the terminal it names, or what the server refused it with. */
export type TerminalAnswer = {
    ok: boolean;
    /** The terminal the action was about, empty when the server refused before naming one. */
    id: string;
    /** What went wrong, or the empty string. Already the server's words. */
    error: string;
};

/** What a `pty:` subscriber is handed: the decoded bytes, and whether they are the scrollback. */
export type PtyListener = (bytes: Uint8Array, scrollback: boolean) => void;

/** The channel one terminal's output travels on. */
export function ptyChannel(id: string): string {
    return `${PREFIX}${id}`;
}

/**
 * Whether an id names a terminal. It is the same shape the server's `isTerminalId` tests, six hex
 * digits and the kind, and it cannot collide with a Claude session id (a UUID) or a Codex slug (a
 * day path), which is why a terminal selects through the one selection the session views share.
 */
export function isTerminalId(id: unknown): id is string {
    return typeof id === 'string' && /^[0-9a-f]{6}-(claude|codex|shell)$/.test(id);
}

/** Every terminal oculus owns, as the last `sessions` payload reported them. */
export function terminals(): Terminal[] {
    const held = message('sessions');
    if (held === null) return [];
    const payload = held.payload as SessionsPayload;
    return Array.isArray(payload?.terminals) ? payload.terminals : [];
}

/** One terminal by id, or null when the payload does not hold it. */
export function terminalById(id: string | null): Terminal | null {
    if (id === null || id === '') return null;
    return terminals().find((one) => one.id === id) ?? null;
}

/** The base64 of a string's UTF-8 bytes, which is how the wire carries a pane's input. */
export function encodeBytes(text: string): string {
    let binary = '';
    for (const byte of new TextEncoder().encode(text)) binary += String.fromCharCode(byte);
    return btoa(binary);
}

/** The bytes of a base64 payload. Anything that is not base64 reads as no bytes at all. */
export function decodeBytes(encoded: string): Uint8Array {
    let binary: string;
    try {
        binary = atob(encoded);
    } catch {
        return new Uint8Array(0);
    }
    const bytes = new Uint8Array(binary.length);
    for (let at = 0; at < binary.length; at += 1) bytes[at] = binary.charCodeAt(at);
    return bytes;
}

async function post(body: unknown): Promise<TerminalAnswer> {
    // There is no fetch while the page is rendered on the server, and nothing to start there either.
    if (typeof fetch !== 'function') return { ok: false, id: '', error: '' };
    try {
        const response = await fetch('/api/terminal', {
            method: 'POST',
            headers: { 'content-type': 'application/json', 'x-oculus-token': writeToken() },
            body: JSON.stringify(body)
        });
        const answer = (await response.json()) as {
            ok?: boolean;
            id?: string;
            terminal?: Terminal;
            error?: string;
        };
        if (!response.ok) {
            return {
                ok: false,
                id: '',
                error: typeof answer.error === 'string' ? answer.error : String(response.status)
            };
        }
        return { ok: true, id: answer.terminal?.id ?? answer.id ?? '', error: '' };
    } catch (error) {
        return { ok: false, id: '', error: error instanceof Error ? error.message : String(error) };
    }
}

/**
 * Start one terminal in a directory. The geometry goes with the request because the tmux session is
 * created at a size and the server requires one (server/pty/sessions.ts, `geometry`); the view
 * passes what the fit addon measured, and the default is a terminal nobody has measured yet.
 */
export async function startTerminal(
    kind: TerminalKind,
    cwd: string,
    cols: number = COLS,
    rows: number = ROWS
): Promise<TerminalAnswer> {
    return post({ action: 'start', kind, cwd, cols, rows });
}

/** Recover one dataset in a shell terminal; the server supplies both the command and the hub cwd. */
export async function recoverDataset(
    key: string,
    cols: number = COLS,
    rows: number = ROWS
): Promise<TerminalAnswer> {
    return post({ action: 'recover', key, cols, rows });
}

/**
 * Continue an observed session in a terminal: DESIGN.md's one explicit migration, which runs
 * `claude --resume <id>` or `codex resume <id>` in the session's own directory. The server reads
 * the directory off the record, so nothing about where it starts travels from the page.
 */
export async function resumeTerminal(
    tool: TerminalResume['tool'],
    id: string,
    cols: number = COLS,
    rows: number = ROWS
): Promise<TerminalAnswer> {
    return post({ action: 'resume', tool, id, cols, rows });
}

/**
 * A refused resume in words. The endpoint answers the catalog key of the two refusals the page has
 * words for, so the keys stay literal here and tests/keys.test.ts can still see them; anything else
 * is already a sentence and is shown as it came.
 */
export function resumeRefusal(error: string): string {
    if (error === 'sessions.resume_live') return t('sessions.resume_live');
    if (error === 'sessions.resume_unknown') return t('sessions.resume_unknown');
    return error;
}

/** Stop one terminal. Its tmux session ends, and with it everything running inside it. */
export async function stopTerminal(id: string): Promise<TerminalAnswer> {
    return post({ action: 'stop', id });
}

/** Resize one terminal's tmux window, for a page whose socket is not open to carry the message. */
export async function resizeTerminal(
    id: string,
    cols: number,
    rows: number
): Promise<TerminalAnswer> {
    return post({ action: 'resize', id, cols, rows });
}

/** Send keystrokes to a terminal. The text is what xterm.js's `onData` produced. */
export function sendInput(id: string, text: string): boolean {
    const input: TerminalInput = {
        type: 'input',
        channel: ptyChannel(id),
        bytes: encodeBytes(text)
    };
    return send(input);
}

/** Tell a terminal its pane's new size. Whole numbers from 1 to 2000, which is what O17 accepts. */
export function sendResize(id: string, cols: number, rows: number): boolean {
    const resize: TerminalResize = {
        type: 'resize',
        channel: ptyChannel(id),
        cols: Math.round(cols),
        rows: Math.round(rows)
    };
    return send(resize);
}

/** ESC, the byte a title sequence opens and closes with. */
const ESC = 0x1b;

/**
 * A filter that drops the window-title sequences of a pane, `ESC k <name> ESC \`: a shell writes one
 * to name its tmux window after the running command, tmux passes it through as pane output, and
 * xterm.js does not know it and would print the name as text. The filter keeps what a chunk ends
 * with when a sequence is cut across two chunks, so each call is handed the bytes to write and the
 * next call finishes the sequence. Anything else in the stream passes through unchanged.
 */
export function titleStripper(): (bytes: Uint8Array) => Uint8Array {
    let carry = new Uint8Array(0);
    let inside = false;
    return (bytes) => {
        const all = new Uint8Array(carry.length + bytes.length);
        all.set(carry, 0);
        all.set(bytes, carry.length);
        const out: number[] = [];
        let at = 0;
        while (at < all.length) {
            if (inside) {
                // Read to the ESC \ that closes the title; an open title at the end is carried.
                const close = indexOfPair(all, ESC, 0x5c, at);
                if (close === -1) {
                    carry = all.slice(at);
                    return Uint8Array.from(out);
                }
                at = close + 2;
                inside = false;
                continue;
            }
            const open = indexOfPair(all, ESC, 0x6b, at);
            if (open === -1) {
                // A lone ESC at the very end may be the first byte of a title: carried, not written.
                const last = all.length - 1;
                if (all[last] === ESC && last >= at) {
                    for (let i = at; i < last; i += 1) out.push(all[i]);
                    carry = all.slice(last);
                } else {
                    for (let i = at; i < all.length; i += 1) out.push(all[i]);
                    carry = new Uint8Array(0);
                }
                return Uint8Array.from(out);
            }
            for (let i = at; i < open; i += 1) out.push(all[i]);
            at = open + 2;
            inside = true;
        }
        carry = new Uint8Array(0);
        return Uint8Array.from(out);
    };
}

/** The index of the first `first, second` pair at or after `from`, or -1. */
function indexOfPair(bytes: Uint8Array, first: number, second: number, from: number): number {
    for (let i = from; i + 1 < bytes.length; i += 1) {
        if (bytes[i] === first && bytes[i + 1] === second) return i;
    }
    return -1;
}

/**
 * Read one terminal's output. The listener is handed the scrollback first, then every chunk after
 * it, and the call returned takes the listener off without unsubscribing, for a view that is
 * swapping one terminal for another.
 */
export function subscribePty(id: string, onBytes: PtyListener): () => void {
    const channel = ptyChannel(id);
    const off = listen(channel, (received) => {
        const payload = received.payload as PtyPayload | null;
        const encoded = typeof payload?.bytes === 'string' ? payload.bytes : '';
        onBytes(decodeBytes(encoded), received.version === 0);
    });
    subscribe([channel]);
    return off;
}

/** Stop reading one terminal's output, and stop asking for its channel on the next reconnect. */
export function unsubscribePty(id: string): void {
    unsubscribe([ptyChannel(id)]);
}
