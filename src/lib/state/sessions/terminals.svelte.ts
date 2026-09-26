// Layer 2, client state. The page's end of DESIGN.md's "PTY": the terminals the sessions payload
// carries, the actions of /api/terminal, and the two messages a page writes on a `pty:`
// channel.
//
// The bytes of a pane are not state. entities.receive keeps one message per channel, the latest,
// which for a stream of output would be the page seeing only the chunk that happened to be last; so
// a `pty:` channel is read through socket.listen instead and nothing of it is stored. The server
// sends the scrollback to the attaching socket alone at version 0 and counts the chunks from 1
// (server/machine/pty/channel.ts, `#attach`), so the listener is told which of the two it was
// handed and a reconnect repaints rather than appending a second copy of the scrollback.
//
// Every action is a write in DESIGN.md's "Auth" sense, since it runs a process on the machine: the
// POST carries the token state/client/writes.svelte.ts holds, and the socket carries it in its
// subscribe message, which is what lets that socket send input at all.

import { taskSkipPermissions } from '../../data/helpers/tasks.ts';
import type { EntitiesStore, SocketStore, WritesStore } from '../shared/stores/shapes.ts';
import { t } from '../shared/words/text.ts';
import type {
    ComposeStart,
    SessionRecord,
    SessionsPayload,
    PtyPayload,
    Terminal,
    TerminalKind,
    TerminalInput,
    TerminalResize,
    TerminalResume
} from '../../data/model/index.ts';
import { isMap } from '../../data/helpers/guards.ts';

// The three model types a view needs of a terminal. The boundary table lets `state/` import
// `data/model` and lets a view import `state/`, so they reach a view from here, the way
// state/client/selectors.svelte.ts re-exports the ones the session views read.
export type { Terminal, TerminalKind, TerminalResume } from '../../data/model/index.ts';

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

/** The four update skills accepted by the server's task action. */
export type TaskKind = 'litwatch' | 'scout' | 'linkedin' | 'inbox';

/** What a LaTeX terminal does to one main file: build it, or clear what a build left beside it. */
export type LatexStep = 'build' | 'clean';

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

/**
 * A refused resume in words. The endpoint answers the catalog key of the two refusals the page has
 * words for, so the keys stay literal here and tests/checks/source/keys.test.ts can still see them;
 * anything else is already a sentence and is shown as it came.
 */
export function resumeRefusal(error: string): string {
    if (error === 'sessions.resume_live') return t('sessions.resume_live');
    if (error === 'sessions.resume_unknown') return t('sessions.resume_unknown');
    return error;
}

/** ESC, the byte a title sequence opens and closes with. */
const ESC = 0x1b;

/**
 * A filter that drops the window-title sequences of a pane, `ESC k <name> ESC \`: a shell writes
 * one to name its tmux window after the running command, tmux passes it through as pane output, and
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
                // A lone ESC at the very end may be the first byte of a title: carried, not
                // written.
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

/** A plain map, or null. */
function mapOf(value: unknown): Record<string, unknown> | null {
    return isMap(value) ? value : null;
}

/** The view a composer is drawn in. */
export const COMPOSER_VIEW = 'terminal';

/**
 * The layout state of a Terminal tab asked to show a fresh composer by New: an identity of its
 * own, so it draws the composer rather than the selected terminal, and `follow`, so what it starts
 * becomes the selection and the tab goes back to following it.
 */
export function composerState(id: string): { id: string; follow: true } {
    return { id, follow: true };
}

function identity(state: unknown): string | null {
    const held = mapOf(state);
    if (held === null) return null;
    for (const key of ['id', 'session']) {
        const value = held[key];
        if (typeof value === 'string' && value !== '') return value;
    }
    return null;
}

/**
 * Whether a Terminal tab follows the selection rather than owning one terminal: it carries no
 * identity, or it is a composer New put there, which returns to following once it starts.
 */
export function followsSelection(state: unknown): boolean {
    return identity(state) === null || mapOf(state)?.follow === true;
}

/**
 * The Terminal tab New shows its composer in: the first that follows the selection, so a tab the
 * reader pinned to a terminal keeps it. Null when the page holds none, and New opens a tab.
 */
export function composerTarget(
    tabs: readonly { id: string; view: string; state: unknown }[]
): string | null {
    return (
        tabs.find((tab) => tab.view === COMPOSER_VIEW && followsSelection(tab.state))?.id ?? null
    );
}

/** The terminals one client owns, and the actions it runs on them. */
export type TerminalsStore = {
    terminals: () => Terminal[];
    terminalById: (id: string | null) => Terminal | null;
    startTerminal: (
        kind: TerminalKind,
        cwd: string,
        cols?: number,
        rows?: number
    ) => Promise<TerminalAnswer>;
    recoverDataset: (key: string, cols?: number, rows?: number) => Promise<TerminalAnswer>;
    startTask: (kind: TaskKind, cols?: number, rows?: number) => Promise<TerminalAnswer>;
    taskSkipsPermissions: () => boolean;
    latex: (
        id: string,
        main: string,
        step: LatexStep,
        cols?: number,
        rows?: number
    ) => Promise<TerminalAnswer>;
    startChat: (id: string | null, cols?: number, rows?: number) => Promise<TerminalAnswer>;
    resumeTerminal: (
        tool: TerminalResume['tool'],
        id: string,
        cols?: number,
        rows?: number
    ) => Promise<TerminalAnswer>;
    stopTerminal: (id: string) => Promise<TerminalAnswer>;
    composeTerminal: (start: ComposeStart, cols?: number, rows?: number) => Promise<TerminalAnswer>;
    steerTerminal: (id: string, text: string) => Promise<TerminalAnswer>;
    interruptTerminal: (id: string) => Promise<TerminalAnswer>;
    forkTerminal: (
        tool: TerminalResume['tool'],
        id: string,
        cols?: number,
        rows?: number
    ) => Promise<TerminalAnswer>;
    terminalOfSession: (record: Pick<SessionRecord, 'id' | 'pid'> | null) => Terminal | null;
    resizeTerminal: (id: string, cols: number, rows: number) => Promise<TerminalAnswer>;
    sendInput: (id: string, text: string) => boolean;
    sendResize: (id: string, cols: number, rows: number) => boolean;
    subscribePty: (id: string, onBytes: PtyListener) => () => void;
    unsubscribePty: (id: string) => void;
};

export function createTerminals(
    entities: EntitiesStore,
    socket: SocketStore,
    writes: WritesStore
): TerminalsStore {
    /** Every terminal oculus owns, as the last `sessions` payload reported them. */
    function terminals(): Terminal[] {
        const held = entities.message('sessions');
        if (held === null) return [];
        const payload = held.payload as SessionsPayload;
        return Array.isArray(payload.terminals) ? payload.terminals : [];
    }

    /** One terminal by id, or null when the payload does not hold it. */
    function terminalById(id: string | null): Terminal | null {
        if (id === null || id === '') return null;
        return terminals().find((one) => one.id === id) ?? null;
    }

    async function post(body: unknown): Promise<TerminalAnswer> {
        // There is no fetch while the page is rendered on the server, and nothing to start there
        // either.
        if (typeof fetch !== 'function') return { ok: false, id: '', error: '' };
        try {
            const response = await fetch('/api/terminal', {
                method: 'POST',
                headers: {
                    'content-type': 'application/json',
                    'x-oculus-token': writes.writeToken()
                },
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
            return {
                ok: false,
                id: '',
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }

    /**
     * Start one terminal in a directory. The geometry goes with the request because the tmux
     * session is created at a size and the server requires one (server/machine/pty/sessions.ts,
     * `geometry`); the view passes what the fit addon measured, and the default is a terminal
     * nobody has measured yet.
     */
    async function startTerminal(
        kind: TerminalKind,
        cwd: string,
        cols: number = COLS,
        rows: number = ROWS
    ): Promise<TerminalAnswer> {
        return post({ action: 'start', kind, cwd, cols, rows });
    }

    /**
     * Recover one dataset in a shell terminal; the server supplies both the command and the hub
     * cwd.
     */
    async function recoverDataset(
        key: string,
        cols: number = COLS,
        rows: number = ROWS
    ): Promise<TerminalAnswer> {
        return post({ action: 'recover', key, cols, rows });
    }

    /**
     * Start one update skill as a Claude terminal; the server supplies its argv and hub directory.
     */
    async function startTask(
        kind: TaskKind,
        cols: number = COLS,
        rows: number = ROWS
    ): Promise<TerminalAnswer> {
        return post({ action: 'task', kind, cols, rows });
    }

    /**
     * Whether a task started now runs with the CLI's permission prompts turned off. The rule is
     * data/helpers/tasks.ts's, the one the server builds the argv from, so what the tray tells the
     * reader and what the command does are one answer to one configured key.
     */
    function taskSkipsPermissions(): boolean {
        return taskSkipPermissions(entities.config()?.config ?? {});
    }

    /**
     * Build or clean one main file of a project's manuscript. The page sends the project id and the
     * file's name; the server checks the name against the project's own main files and supplies
     * both the latexmk command and the manuscript folder it runs in.
     */
    async function latex(
        id: string,
        main: string,
        step: LatexStep,
        cols: number = COLS,
        rows: number = ROWS
    ): Promise<TerminalAnswer> {
        return post({ action: 'latex', id, main, step, cols, rows });
    }

    /**
     * Start a project-focused or portfolio-wide Claude chat; the server supplies argv and
     * directory.
     */
    async function startChat(
        id: string | null,
        cols: number = COLS,
        rows: number = ROWS
    ): Promise<TerminalAnswer> {
        return post({ action: 'chat', id, cols, rows });
    }

    /**
     * Continue an observed session in a terminal: DESIGN.md's one explicit migration, which runs
     * `claude --resume <id>` or `codex resume <id>` in the session's own directory. The server
     * reads the directory off the record, so nothing about where it starts travels from the page.
     */
    async function resumeTerminal(
        tool: TerminalResume['tool'],
        id: string,
        cols: number = COLS,
        rows: number = ROWS
    ): Promise<TerminalAnswer> {
        return post({ action: 'resume', tool, id, cols, rows });
    }

    /** Stop one terminal. Its tmux session ends, and with it everything running inside it. */
    async function stopTerminal(id: string): Promise<TerminalAnswer> {
        return post({ action: 'stop', id });
    }

    /**
     * Start what the composer asked for: an agent with the picked flags, the account and the prompt
     * as its first message, or a shell with the prompt as its first command. The server builds the
     * argv from config/catalogs/agents.yml; the page sends ids and the prompt, never a command.
     */
    async function composeTerminal(
        start: ComposeStart,
        cols: number = COLS,
        rows: number = ROWS
    ): Promise<TerminalAnswer> {
        return post({ action: 'compose', ...start, cols, rows });
    }

    /** Send one message to a running terminal: the text typed literally, then Enter. */
    async function steerTerminal(id: string, text: string): Promise<TerminalAnswer> {
        return post({ action: 'steer', id, text });
    }

    /**
     * Interrupt the turn a terminal's agent is on with Escape. The session goes on; ending it is
     * stopTerminal's.
     */
    async function interruptTerminal(id: string): Promise<TerminalAnswer> {
        return post({ action: 'interrupt', id });
    }

    /**
     * Continue a session as a new one in a new terminal: `claude --resume <id> --fork-session` or
     * `codex fork <id>`, in the session's own directory, which the server reads off the record.
     */
    async function forkTerminal(
        tool: TerminalResume['tool'],
        id: string,
        cols: number = COLS,
        rows: number = ROWS
    ): Promise<TerminalAnswer> {
        return post({ action: 'fork', tool, id, cols, rows });
    }

    /**
     * The oculus terminal a session runs in: the one that resumed it, or the one whose pane process
     * is the session's own. The pane's process is the agent itself, since tmux runs the argv
     * directly, so a Claude session the registry reports by pid is found by it. Null for a session
     * that runs in a terminal of its own.
     */
    function terminalOfSession(record: Pick<SessionRecord, 'id' | 'pid'> | null): Terminal | null {
        if (record === null) return null;
        const all = terminals().filter((one) => one.foreign !== true);
        return (
            all.find((one) => one.resumes?.id === record.id) ??
            all.find((one) => record.pid !== null && one.pid !== 0 && one.pid === record.pid) ??
            null
        );
    }

    /**
     * Resize one terminal's tmux window, for a page whose socket is not open to carry the message.
     */
    async function resizeTerminal(id: string, cols: number, rows: number): Promise<TerminalAnswer> {
        return post({ action: 'resize', id, cols, rows });
    }

    /** Send keystrokes to a terminal. The text is what xterm.js's `onData` produced. */
    function sendInput(id: string, text: string): boolean {
        const input: TerminalInput = {
            type: 'input',
            channel: ptyChannel(id),
            bytes: encodeBytes(text)
        };
        return socket.send(input);
    }

    /**
     * Tell a terminal its pane's new size. Whole numbers from 1 to 2000, which is the range
     * server/machine/pty/channel.ts accepts.
     */
    function sendResize(id: string, cols: number, rows: number): boolean {
        const resize: TerminalResize = {
            type: 'resize',
            channel: ptyChannel(id),
            cols: Math.round(cols),
            rows: Math.round(rows)
        };
        return socket.send(resize);
    }

    /**
     * Read one terminal's output. The listener is handed the scrollback first, then every chunk
     * after it, and the call returned takes the listener off without unsubscribing, for a view that
     * is swapping one terminal for another.
     */
    function subscribePty(id: string, onBytes: PtyListener): () => void {
        const channel = ptyChannel(id);
        const off = socket.listen(channel, (received) => {
            const payload = received.payload as PtyPayload | null;
            const encoded = typeof payload?.bytes === 'string' ? payload.bytes : '';
            onBytes(decodeBytes(encoded), received.version === 0);
        });
        socket.subscribe([channel]);
        return off;
    }

    /**
     * Stop reading one terminal's output, and stop asking for its channel on the next reconnect.
     */
    function unsubscribePty(id: string): void {
        socket.unsubscribe([ptyChannel(id)]);
    }

    return {
        terminals,
        terminalById,
        startTerminal,
        recoverDataset,
        startTask,
        taskSkipsPermissions,
        latex,
        startChat,
        resumeTerminal,
        stopTerminal,
        composeTerminal,
        steerTerminal,
        interruptTerminal,
        forkTerminal,
        terminalOfSession,
        resizeTerminal,
        sendInput,
        sendResize,
        subscribePty,
        unsubscribePty
    };
}
