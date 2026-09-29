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
// A Terminal tab is a terminal panel of its own, and this store keeps which tab owns which terminal
// over every page's Terminal tabs (the rules over one tab's state are state/sessions/terminal/
// terminal-tabs.ts): `showTerminal` shows a terminal in the tab that owns it, switching to its
// page, or hands a terminal no tab owns to the Terminal tab of the page on screen, or a new one;
// `moveTerminal` moves one from its tab to another; `composeIn` puts New's composer in the page's
// Terminal tab, its folder and kind back to a new composer's own. A terminal that ends leaves the
// `sessions` payload's list, and the store takes it out of every tab that owned it, closes a tab
// left owning none, on any page, unless the reader is composing in it, and clears a selection that
// was that terminal. A closed tab stops nothing, so its terminals run on unowned and
// listed in the Sessions view. The workbench is handed in by state/client/context.ts, since a
// hidden page mounts no view that could notice.
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
import {
    TERMINAL_VIEW,
    composingIn,
    emptyTab,
    isTerminalId,
    ownerOf,
    pageTarget,
    readTab,
    showingRow,
    withTerminal,
    withoutTerminal,
    type TerminalTabState
} from './terminal/terminal-tabs.ts';
import { freshComposer } from './terminal/composer.ts';

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

/**
 * The terminals that have ended, as one `sessions` message says: those not in its list that an
 * earlier message listed, and, on the first message the page hears, those a tab or the selection
 * holds, which ended while the page was away. A terminal started from this page after the first
 * message and not listed yet has not ended, since no message listed it. A message with no list
 * says nothing about any terminal.
 */
export function endedTerminals(
    before: ReadonlySet<string>,
    now: readonly string[] | null,
    first: boolean,
    held: readonly string[]
): string[] {
    if (now === null) return [];
    const listed = new Set(now);
    const known = first ? [...before, ...held] : [...before];
    return [...new Set(known)].filter((id) => !listed.has(id));
}

/** One tab of any page, as the layout holds it: its view is read to find the Terminal tabs. */
export type TerminalTab = { id: string; page: string; view: string; state: unknown };

/**
 * What the terminals store needs of the workbench to keep which tab owns which terminal: the tabs
 * of every page in page and tab order (a hidden page mounts no view, so no view can be the one that
 * keeps it), a tab's state replaced, a tab activated, a page switched to, the page on screen, the
 * active tab of a page's focused pane, a tab opened on a page with a state (answering its id), a
 * tab closed, and the selection as it stands.
 */
export type TerminalTabs = {
    tabs: () => TerminalTab[];
    restate: (id: string, page: string, state: TerminalTabState) => void;
    activate: (id: string, page: string) => void;
    switchPage: (page: string) => void;
    currentPage: () => string;
    activeTab: (page: string) => string | null;
    open: (page: string, state: TerminalTabState) => string;
    close: (id: string, page: string) => void;
    /** A tab's instance state, which holds its composer record. */
    instanceState: (id: string) => unknown;
    setInstanceState: (id: string, state: unknown) => void;
    selected: () => string | null;
    select: (id: string | null) => void;
};

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
    /**
     * Show a terminal: in the tab that owns it, on its page, else in the Terminal tab of the page
     * on screen or a new one, which takes it. The label names a tab that takes it until the
     * terminal's own name arrives.
     */
    showTerminal: (id: string, label?: string) => void;
    /**
     * Move a terminal to a Terminal tab at an index of its order; a tab left owning none closes
     * unless the reader is composing in it.
     */
    moveTerminal: (id: string, toTab: string, toPage: string, index: number) => void;
    /**
     * New: the composer in the Terminal tab of a page (the one on screen by default), or a new one.
     */
    composeIn: (page?: string) => void;
    /** New in one Terminal tab, the bar's New: the composer there, as `composeIn` shows it. */
    composeInTab: (tab: string) => void;
};

export function createTerminals(
    entities: EntitiesStore,
    socket: SocketStore,
    writes: WritesStore,
    workbench?: TerminalTabs
): TerminalsStore {
    /**
     * Every terminal id a `sessions` message has listed, and whether a message with a list came.
     */
    const seen = new Set<string>();
    let heard = false;

    /** The Terminal tabs of every page. */
    function terminalTabs(): TerminalTab[] {
        return workbench?.tabs().filter((tab) => tab.view === TERMINAL_VIEW) ?? [];
    }

    /**
     * Take the ended terminals out of every tab that owned them, on any page; a tab left owning
     * none closes unless the reader is composing in it, where it keeps its composer, shown alone,
     * and what was typed. A selection that was one of them is cleared. A tab that owned none of
     * them is left as it is, so a tab showing a composer it never started from stays.
     */
    function closeEnded(ended: string[]): void {
        if (workbench === undefined || ended.length === 0) return;
        for (const tab of terminalTabs()) {
            const held = readTab(tab.state);
            if (!ended.some((id) => held.terminals.includes(id))) continue;
            const next = ended.reduce(withoutTerminal, held);
            if (next.terminals.length === 0 && !held.composing) workbench.close(tab.id, tab.page);
            else workbench.restate(tab.id, tab.page, next);
        }
        const selected = workbench.selected();
        if (selected !== null && ended.includes(selected)) workbench.select(null);
    }

    entities.afterReceive((message) => {
        if (message.channel !== 'sessions') return;
        const payload = mapOf(message.payload);
        const list = payload?.terminals;
        // A message with no list says nothing about any terminal, so it is not the first one.
        if (!Array.isArray(list)) return;
        const first = !heard;
        heard = true;
        const now = list
            .map((one: unknown) => mapOf(one)?.id)
            .filter((id): id is string => typeof id === 'string');
        if (workbench !== undefined) {
            const selected = workbench.selected();
            const held = terminalTabs().flatMap((tab) => readTab(tab.state).terminals);
            if (isTerminalId(selected)) held.push(selected);
            closeEnded(endedTerminals(seen, now, first, held));
        }
        for (const id of now) seen.add(id);
    });

    /**
     * The Terminal tab of a page that a terminal no tab owns, or New, goes to: pageTarget's rule.
     */
    function pageTab(tabs: readonly TerminalTab[], page: string): TerminalTab | null {
        if (workbench === undefined) return null;
        const onPage = tabs.filter((tab) => tab.page === page);
        const chosen = pageTarget(onPage, workbench.activeTab(page));
        return onPage.find((tab) => tab.id === chosen) ?? null;
    }

    /**
     * Show a terminal. The tab that owns it is activated, its page switched to when it is another,
     * and shows it, alone unless it is one half of the tab's split. A terminal no tab owns joins
     * the end of the Terminal tab of the page on screen, or of a new Terminal tab there, and is
     * shown. An id that is not a terminal's shows nothing.
     */
    function showTerminal(id: string, label = ''): void {
        if (workbench === undefined || !isTerminalId(id)) return;
        const tabs = terminalTabs();
        const owner = ownerOf(tabs, id);
        if (owner !== null) {
            if (owner.page !== workbench.currentPage()) workbench.switchPage(owner.page);
            const held = readTab(owner.state);
            const next = showingRow(held, id);
            if (next !== held) workbench.restate(owner.id, owner.page, next);
            workbench.activate(owner.id, owner.page);
            return;
        }
        const page = workbench.currentPage();
        const target = pageTab(tabs, page);
        if (target === null) {
            const joined = withTerminal(emptyTab(crypto.randomUUID()), id, 0);
            workbench.open(page, { ...joined, label });
            return;
        }
        const held = readTab(target.state);
        const joined = withTerminal(held, id, held.terminals.length);
        workbench.restate(target.id, page, label === '' ? joined : { ...joined, label });
        workbench.activate(target.id, page);
    }

    /**
     * Move a terminal into a Terminal tab before the row at `index` of that tab's order (`index`
     * equal to its length puts it last), shown there. Within one tab it is a reorder. The tab it
     * left closes when it owns nothing more, unless the reader is composing in it, where it keeps
     * its composer shown alone. A tab id no page holds moves nothing.
     */
    function moveTerminal(id: string, toTab: string, toPage: string, index: number): void {
        if (workbench === undefined || !isTerminalId(id)) return;
        const tabs = terminalTabs();
        const target =
            tabs.find((tab) => tab.id === toTab && tab.page === toPage) ??
            tabs.find((tab) => tab.id === toTab);
        if (target === undefined) return;
        const from = ownerOf(tabs, id);
        if (from !== null && from.id !== target.id) {
            const was = readTab(from.state);
            const left = withoutTerminal(was, id);
            if (left.terminals.length === 0 && !was.composing) workbench.close(from.id, from.page);
            else workbench.restate(from.id, from.page, left);
        }
        const held = readTab(target.state);
        const before = held.terminals.indexOf(id);
        const at = before >= 0 && before < index ? index - 1 : index;
        workbench.restate(target.id, target.page, withTerminal(held, id, at));
        workbench.activate(target.id, target.page);
    }

    /**
     * New: the composer in the Terminal tab of a page, which keeps the terminals it owns, or in a
     * new Terminal tab there; the tab is activated. The page is the one on screen unless named.
     */
    function composeIn(page?: string): void {
        if (workbench === undefined) return;
        const on = page ?? workbench.currentPage();
        const target = pageTab(terminalTabs(), on);
        if (target === null) {
            workbench.open(on, emptyTab(crypto.randomUUID()));
            return;
        }
        showComposer(target);
        workbench.activate(target.id, on);
    }

    /** New in the Terminal tab of this id; an id no page holds shows nothing. */
    function composeInTab(id: string): void {
        const target = terminalTabs().find((tab) => tab.id === id);
        if (target !== undefined) showComposer(target);
    }

    /**
     * The composer shown in a tab, which keeps the terminals it owns, its folder and kind back to a
     * new composer's own, so a Split made in the tab earlier does not carry into New.
     */
    function showComposer(target: TerminalTab): void {
        if (workbench === undefined) return;
        workbench.setInstanceState(target.id, freshComposer(workbench.instanceState(target.id)));
        workbench.restate(target.id, target.page, composingIn(readTab(target.state)));
    }

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
        unsubscribePty,
        showTerminal,
        moveTerminal,
        composeIn,
        composeInTab
    };
}
