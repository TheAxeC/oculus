// Layer 2, client state. The page's end of DESIGN.md's "PTY": the terminals the sessions payload
// carries, the actions of /api/terminal, and the two messages a page writes on a `pty:`
// channel.
//
// The `pty:` channel of a terminal, its two messages and the panes reading its output are
// state/sessions/terminal/pty/pty-wire.ts's; this store builds one wire over its socket and hands
// its calls on.
//
// A Terminal tab is a terminal panel of its own, and this store keeps which tab owns which terminal
// over every page's Terminal tabs (the rules over one tab's state are state/sessions/terminal/
// terminal-tabs.ts): `showTerminal` shows a terminal in the tab that owns it, switching to its
// page, or hands a terminal no tab owns to the Terminal tab of the page on screen, or a new one;
// `moveTerminal` moves one from its tab to another; `attachable` lists the running terminals no tab
// owns, and `attachTerminal` joins one of them to the end of a Terminal tab and shows it there (the
// tab's Attach to Session); `startInTab` starts a terminal of a kind at once in the tab's folder,
// or in a folder given, and shows it, `newTerminalIn` does the same in a Terminal tab of one pane,
// and `splitTerminal` starts one of the split terminal's kind and folder right of it in the tab's
// row; `composeIn` puts the composer of a start with a prompt in the page's Terminal tab, in the
// tab's folder; `composeAt` does the same for a folder and an agent a worktree names, or for a hub
// task, whose seed it asks the server for (state/sessions/terminal/composer/opening.svelte.ts holds
// the three composers and the held seeds); `approveSeed` posts the approval a task's seed asked
// for, and `startingIn` says that a tab's start is in flight. A start the server refuses is said on
// the tab (`refusal`) and changes nothing.
// The store keeps what each start answered until the payload lists it, so a terminal started a
// moment ago can be split. A terminal that ends leaves the `sessions` payload's list, and the store
// takes it out of every tab that owned it, closes a tab left owning none, on any page, unless the
// reader is composing in it, and clears a selection that was that terminal. A closed Terminal tab,
// pane or page, and a page reset that removes a tab, end the running terminals the tab lists (the
// registration the ui store holds), and a start answered after its tab closed is ended; a tab that
// is moved, split or reloaded ends none. The workbench is handed in by state/client/context.ts,
// since a hidden page mounts no view that could notice.
//
// Every action is a write in DESIGN.md's "Auth" sense, since it runs a process on the machine: the
// POST carries the token state/client/writes.svelte.ts holds, and the socket carries it in its
// subscribe message, which is what lets that socket send input at all.

import type { UpdateTask } from '../../data/helpers/run/tasks.ts';
import type { EntitiesStore, SocketStore, WritesStore } from '../shared/stores/shapes.ts';
import { t } from '../shared/words/text.ts';
import type {
    ComposeStart,
    LatexApproval,
    SessionRecord,
    TaskRef,
    Terminal,
    StartKind,
    TerminalKind,
    TerminalResume
} from '../../data/model/index.ts';
import { tabMarkOf } from './terminal/terminal-marks.ts';
import { targetFields, type LatexTarget } from './terminal/latex-target.ts';
import {
    TERMINAL_VIEW,
    emptyTab,
    isTerminalId,
    ownerOf,
    pageTarget,
    readTab,
    showingRow,
    splitRight,
    tabFolder,
    withTerminal,
    type TerminalTabState
} from './terminal/terminal-tabs.ts';
import {
    createComposerOpening,
    type ComposeAt,
    type HeldTask
} from './terminal/composer/opening.svelte.ts';
import {
    closeEnded,
    endedTerminals,
    moveInto,
    terminalLabel,
    terminalTabTitle,
    unownedTerminals
} from './terminal/terminal-lists.ts';
import type { TerminalTab, TerminalTabs } from './terminal/workbench-shape.ts';
import { createPtyOrder, type PtySize } from './terminal/pty/pty-subscribe.ts';
import { createPtyWire, type PtyListener } from './terminal/pty/pty-wire.ts';
import { terminalsReader } from './terminal/terminal-payloads.ts';
import { createViewports, type Viewport } from './terminal/viewport.ts';
import {
    COLS,
    ROWS,
    postTerminal,
    readBusy,
    type BusyTerminal,
    type SeedApproval,
    type TerminalAnswer
} from './terminal/pty/pty-io.ts';

export type { BusyTerminal, SeedApproval };

export { endedTerminals, terminalLabel, unownedTerminals } from './terminal/terminal-lists.ts';
export type { TerminalTab, TerminalTabs } from './terminal/workbench-shape.ts';

export { decodeBytes, encodeBytes, titleStripper } from './terminal/pty/pty-bytes.ts';
export { ptyChannel, type PtyListener } from './terminal/pty/pty-wire.ts';
export { RESIZE_WAIT } from './terminal/pty/pty-subscribe.ts';

// The three model types a view needs of a terminal. The boundary table lets `state/` import
// `data/model` and lets a view import `state/`, so they reach a view from here, the way
// state/client/selectors.svelte.ts re-exports the ones the session views read.
export type { TaskRef, Terminal, TerminalKind, TerminalResume } from '../../data/model/index.ts';

// The name of an update task the server's task action accepts. The boundary table lets a shell
// file import this module and not `data/helpers/run/tasks`, so the type reaches the tray from here.
export type { UpdateTask };

/**
 * What a LaTeX terminal does to one main file: build it, clear what a build left beside it, stop
 * the build that runs, or check its citations.
 */
export type LatexStep = 'build' | 'clean' | 'stop' | 'checkcites';

/** What a build asks for beyond the main file: a recipe by name, the last one used, and force. */
export type LatexBuildAsk = { recipe?: string; last?: string; force?: boolean };

/** The terminals one client owns, and the actions it runs on them. */
export type TerminalsStore = {
    terminals: () => Terminal[];
    terminalById: (id: string | null) => Terminal | null;
    /** The strip mark of a tab: its shown terminal's icon and colour token, for a Terminal tab. */
    tabMark: (instance: { view: string; state: unknown }) => { glyph?: string; token?: string };
    startTerminal: (
        kind: TerminalKind,
        cwd: string,
        cols?: number,
        rows?: number
    ) => Promise<TerminalAnswer>;
    recoverDataset: (key: string, cols?: number, rows?: number) => Promise<TerminalAnswer>;
    startTask: (kind: UpdateTask, cols?: number, rows?: number) => Promise<TerminalAnswer>;
    latex: (
        target: LatexTarget,
        main: string,
        step: LatexStep,
        ask?: LatexBuildAsk,
        cols?: number,
        rows?: number
    ) => Promise<TerminalAnswer>;
    /**
     * Approve what a build or clean asked about, with the texts it was shown; the answer is ok, or
     * the refusal, `latex-changed` when the files changed since they were listed.
     */
    approveLatex: (
        target: LatexTarget,
        main: string,
        approval: LatexApproval,
        ask?: LatexBuildAsk
    ) => Promise<TerminalAnswer>;
    startChat: (id: string | null, cols?: number, rows?: number) => Promise<TerminalAnswer>;
    resumeTerminal: (
        tool: TerminalResume['tool'],
        id: string,
        cols?: number,
        rows?: number
    ) => Promise<TerminalAnswer>;
    stopTerminal: (id: string) => Promise<TerminalAnswer>;
    composeTerminal: (
        start: ComposeStart,
        owner: string,
        cols?: number,
        rows?: number
    ) => Promise<TerminalAnswer>;
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
    /**
     * Read one terminal's output once its window has the size `size()` answers: the scrollback is
     * captured at the window's size with the cursor placed from the pane's top. The resize is
     * posted again when `size` changed while it was out, and the channel is asked for after its
     * answer, or at `RESIZE_WAIT`. The call returned takes the listener off.
     */
    subscribePty: (id: string, size: () => PtySize, onBytes: PtyListener) => () => void;
    unsubscribePty: (id: string) => void;
    /** Whether a call of `subscribePty` for the terminal is still reading its output. */
    subscribed: (id: string) => boolean;
    /**
     * Show a terminal: in the tab that owns it, on its page, else in the Terminal tab of the page
     * on screen or a new one, which takes it. The label names a tab that takes it until the
     * terminal's own name arrives. The terminal's grid takes the keyboard unless `preserveFocus`,
     * which is the default: a terminal shown from a list is shown where the reader already is.
     */
    showTerminal: (id: string, label?: string, preserveFocus?: boolean) => void;
    /** The terminal whose grid is asked to take the keyboard, or null. */
    focusAsked: () => string | null;
    /** A grid took the keyboard it was asked for. */
    focusTaken: (id: string) => void;
    /** Take a terminal out of the Terminal tabs that show it, without ending it. */
    hideTerminal: (id: string) => void;
    /** Show and select a terminal a project command just started, before the list names it. */
    adopt: (made: Terminal) => void;
    /**
     * Move a terminal to a Terminal tab at an index of its order; a tab left owning none closes
     * unless the reader is composing in it.
     */
    moveTerminal: (id: string, toTab: string, toPage: string, index: number) => void;
    /** The running terminals no Terminal tab on any page owns, in the order the list names them. */
    attachable: () => Terminal[];
    /**
     * Attach to Session: a running terminal no tab owns joins the end of a Terminal tab's order and
     * is shown alone there, the tab is activated, and a composer the tab showed is gone. An id the
     * latest list does not name, one a tab owns by now, a foreign one, and a tab no page holds
     * change nothing.
     */
    attachTerminal: (tab: string, id: string) => void;
    /**
     * New: the composer in the Terminal tab of a page (the one on screen by default), or a new one.
     */
    composeIn: (page?: string) => void;
    /** New in one Terminal tab, the bar's New: the composer there, as `composeIn` shows it. */
    composeInTab: (tab: string, agent?: StartKind) => void;
    /**
     * Open the composer at a folder (a worktree start) or on a hub task, in the Terminal tab of the
     * page on screen or a new one (in the page's documents pane for a folder start that asks for
     * it), with the agent's lists at the catalog's defaults. A task first asks the server for its
     * seed; a refusal is answered as its sentence and opens nothing, and the empty string is a
     * composer opened.
     */
    composeAt: (at: ComposeAt) => Promise<string>;
    /** The seed the composer of a tab shows for its task, or null when it has none. */
    taskOf: (tab: string) => HeldTask | null;
    /**
     * Ask the server for the seed of a tab's task when the tab holds none, or again with `fresh`.
     * A refusal drops the task from the tab and is answered as its sentence.
     */
    loadTask: (tab: string, fresh?: boolean) => Promise<string>;
    /** Take the task off a tab's composer. */
    dropTask: (tab: string) => void;
    /** Approve the seed, folder and agent a composer start with a task asked about. */
    approveSeed: (
        task: TaskRef,
        seed: string,
        cwd: string,
        agent: string
    ) => Promise<TerminalAnswer>;
    /**
     * Start a terminal of a kind at once in `folder`, else in the Terminal tab's folder (the shown
     * terminal's, else the first one's, else the hub root, waited for while it is not known yet),
     * and show it there.
     */
    startInTab: (tab: string, kind: TerminalKind, folder?: string) => Promise<TerminalAnswer>;
    /** The kind a tab's New Terminal is starting now, or null when it is starting none. */
    startingIn: (tab: string) => TerminalKind | null;
    /**
     * New Terminal from a pane: the start goes into the active Terminal tab of the pane at `path`
     * of the page, or into a new Terminal tab opened in that pane.
     */
    newTerminalIn: (page: string, path: number[]) => Promise<TerminalAnswer>;
    /**
     * Split a terminal of a tab: a terminal of its kind and folder starts and is put right of it in
     * the tab's row. A terminal the store knows nothing of is refused in words on the tab.
     */
    splitTerminal: (tab: string, terminal: string) => Promise<TerminalAnswer>;
    /** What the last refused action of a tab said, or the empty string. */
    refusal: (tab: string) => string;
    /** Say a failure on a tab's bar, or clear it with the empty string. */
    say: (tab: string, words: string) => void;
    /** Give a terminal a title, or clear its title with an empty one. */
    renameTerminal: (id: string, title: string) => Promise<TerminalAnswer>;
    /** Give a terminal an icon and/or a colour; an empty value returns it to the default. */
    restyleTerminal: (
        id: string,
        style: { icon?: string; color?: string }
    ) => Promise<TerminalAnswer>;
    /** Empty a terminal's history on the server (the grid empties itself). */
    clearHistory: (id: string) => Promise<TerminalAnswer>;
    /**
     * The running terminals that Terminal tabs among the instances list, the fresh read of which of
     * them run a program other than their shell, and the ending of terminals: the three the ui
     * store's registration takes.
     */
    runningOf: (instances: readonly { view: string; state?: unknown }[]) => string[];
    busyOf: (ids: string[]) => Promise<BusyTerminal[]>;
    endTerminals: (ids: string[]) => void;
    /** Keep where a terminal's viewport sat as its grid goes, and hand it to the next grid once. */
    keepViewport: (id: string, viewport: Viewport) => void;
    takeViewport: (id: string) => Viewport | undefined;
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

    /** The terminals of a payload's list, read once for each list. */
    const readTerminals = terminalsReader();

    /**
     * What each start answered, kept until the payload lists the terminal: a terminal started a
     * moment ago is not in the payload yet, but its kind and folder are known, and it is running.
     */
    const started = new Map<string, Terminal>();
    /** Where each terminal's viewport sat when its grid went, for the grid drawn next. */
    const viewports = createViewports();

    /** The kind each tab's New Terminal is starting while its start is in flight, by tab id. */
    const starting: { kinds: Record<string, TerminalKind> } = $state({ kinds: {} });

    /** What a tab's last refused action said, by tab id. */
    const refused: { words: Record<string, string> } = $state({ words: {} });

    /** The terminal a show asked the keyboard for, until its grid has taken it. */
    const focus: { id: string | null } = $state({ id: null });

    /** The Terminal tabs of every page. */
    function terminalTabs(): TerminalTab[] {
        return workbench?.tabs().filter((tab) => tab.view === TERMINAL_VIEW) ?? [];
    }

    entities.afterReceive((message) => {
        if (message.channel !== 'sessions') return;
        const list = readTerminals(entities.payloadOf(message, 'sessions')?.terminals);
        // A message with no list says nothing about any terminal, so it is not the first one.
        if (list === null) return;
        const first = !heard;
        heard = true;
        const now = list.map((one) => one.id);
        if (workbench !== undefined) {
            const selected = workbench.selected();
            const held = terminalTabs().flatMap((tab) => readTab(tab.state).terminals);
            if (isTerminalId(selected)) held.push(selected);
            const ended = endedTerminals(seen, now, first, held);
            for (const id of ended) viewports.drop(id);
            if (workbench.upkeep !== false) closeEnded(workbench, terminalTabs(), ended);
        }
        for (const id of now) {
            seen.add(id);
            started.delete(id);
        }
    });

    /**
     * The folder a New Terminal starts in when its tab names none: the primary hub's folder, else
     * the home folder, waited for while the workspace is being read.
     */
    function defaultFolder(): Promise<string> {
        const root = workbench?.hubRoot() ?? null;
        if (root !== null) return Promise.resolve(root);
        return workbench?.defaultFolder() ?? Promise.resolve('');
    }

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
     * and shows it in the tab's row. A terminal no tab owns joins the end of the Terminal tab of
     * the page on screen, or of a new Terminal tab there, and is shown. An id that is not a
     * terminal's shows nothing.
     */
    function showTerminal(id: string, label = '', preserveFocus = true): void {
        if (workbench === undefined || !isTerminalId(id)) return;
        focus.id = preserveFocus ? null : id;
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

    function hideTerminal(id: string): void {
        if (workbench !== undefined) closeEnded(workbench, terminalTabs(), [id]);
    }

    /** Move a terminal into a Terminal tab; the rule is moveInto's. */
    function moveTerminal(id: string, toTab: string, toPage: string, index: number): void {
        if (workbench !== undefined) moveInto(workbench, terminalTabs(), id, toTab, toPage, index);
    }

    /** The running terminals no Terminal tab owns, from the latest list and every page's tabs. */
    function attachable(): Terminal[] {
        return unownedTerminals(terminals(), terminalTabs());
    }

    /**
     * Join a terminal no tab owns to the end of one Terminal tab and show it alone there, the rule
     * `showTerminal` holds for such a terminal applied to the tab it is asked of rather than the
     * page's. The terminal is checked against the latest list at the pick, so one that ended or
     * that another tab took since a menu offered it changes nothing.
     */
    function attachTerminal(tab: string, id: string): void {
        if (workbench === undefined || !isTerminalId(id)) return;
        const target = terminalTabs().find((one) => one.id === tab);
        if (target === undefined || !attachable().some((one) => one.id === id)) return;
        const held = readTab(target.state);
        workbench.restate(target.id, target.page, withTerminal(held, id, held.terminals.length));
        workbench.activate(target.id, target.page);
    }

    /** A terminal's record: the payload's, else what its start answered. */
    function terminalRecord(id: string | null): Terminal | null {
        return terminalById(id) ?? (id === null ? null : (started.get(id) ?? null));
    }

    /** Every terminal oculus owns, as the last `sessions` payload reported them. */
    function terminals(): Terminal[] {
        return readTerminals(entities.sessions()?.terminals) ?? [];
    }

    /** One terminal by id, or null when the payload does not hold it. */
    function terminalById(id: string | null): Terminal | null {
        if (id === null || id === '') return null;
        return terminals().find((one) => one.id === id) ?? null;
    }

    function post(body: unknown): Promise<TerminalAnswer> {
        return postTerminal(body, writes);
    }

    const opening = createComposerOpening({
        workbench,
        terminalTabs,
        pageTab,
        folderOf: (tab) => tabFolder(readTab(tab.state), (one) => terminalRecord(one)?.cwd ?? null),
        seedTask: (task) => post({ action: 'seed', task })
    });

    /** Approve the seed, folder and agent a composer start with a task asked about. */
    function approveSeed(
        task: TaskRef,
        seed: string,
        cwd: string,
        agent: string
    ): Promise<TerminalAnswer> {
        return post({ action: 'approve-seed', task, seed, cwd, agent });
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
        kind: UpdateTask,
        cols: number = COLS,
        rows: number = ROWS
    ): Promise<TerminalAnswer> {
        return post({ action: 'task', kind, cols, rows });
    }

    /**
     * Build, clean, stop or check the citations of one main file of a project's manuscript or of a
     * folder of a served root. The page sends the folder's name and the file's, and for a build the
     * recipe it asks for; the server checks the name against the folder's own main files and
     * supplies both the command and the folder it runs in.
     */
    async function latex(
        target: LatexTarget,
        main: string,
        step: LatexStep,
        ask: LatexBuildAsk = {},
        cols: number = COLS,
        rows: number = ROWS
    ): Promise<TerminalAnswer> {
        return post({ action: 'latex', ...targetFields(target), main, step, ...ask, cols, rows });
    }

    async function approveLatex(
        target: LatexTarget,
        main: string,
        approval: LatexApproval,
        ask: LatexBuildAsk = {}
    ): Promise<TerminalAnswer> {
        const { step, texts } = approval;
        return post({
            action: 'approve-latex',
            ...targetFields(target),
            main,
            step,
            ...ask,
            texts
        });
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
     * Start what the composer of the Terminal tab `owner` asked for. The server builds the argv
     * from config/catalogs/agents.yml; the page sends ids and the prompt, never a command. A
     * terminal answered after its tab closed is ended and refused, since no tab is left to show it.
     */
    async function composeTerminal(
        start: ComposeStart,
        owner: string,
        cols: number = COLS,
        rows: number = ROWS
    ): Promise<TerminalAnswer> {
        const answer = await post({ action: 'compose', ...start, cols, rows });
        if (!answer.ok || answer.terminal === undefined) return answer;
        started.set(answer.terminal.id, answer.terminal);
        if (tabById(owner) !== null) return answer;
        endTerminals([answer.terminal.id]);
        return { ok: false, id: '', error: '' };
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
     * Resize one terminal's tmux window, for a page whose socket is not open to carry the message,
     * and for the order in which a grid attaches. A refusal is said on the bar of the tab that owns
     * the terminal, so a window that cannot be sized is not left silent.
     */
    async function resizeTerminal(id: string, cols: number, rows: number): Promise<TerminalAnswer> {
        const answer = await post({ action: 'resize', id, cols, rows });
        if (!answer.ok) {
            const owner = ownerOf(terminalTabs(), id);
            if (owner !== null) say(owner.id, answer.error);
        }
        return answer;
    }

    const order = createPtyOrder(resizeTerminal);

    /** The refusal a tab is showing, or the empty string. */
    function refusal(tab: string): string {
        return refused.words[tab] ?? '';
    }

    /** Say something on a tab's bar; an empty string clears it. */
    function say(tab: string, words: string): void {
        const others = Object.entries(refused.words).filter(([id]) => id !== tab);
        refused.words = Object.fromEntries(words === '' ? others : [...others, [tab, words]]);
    }

    /** A refusal in words: the catalog's sentence for it, else the start's own words. */
    function refusalWords(error: string): string {
        return error === '' ? t('sessions.terminal_start_failed') : error;
    }

    /** The Terminal tab of this id, as the workbench lists it now, or null when it is gone. */
    function tabById(id: string): TerminalTab | null {
        return terminalTabs().find((tab) => tab.id === id) ?? null;
    }

    /**
     * Post a start, and put the terminal it answers in the tab as `join` says. A refusal is said on
     * the tab and changes nothing; a terminal answered after its tab was closed is ended, since no
     * tab is left to show it.
     */
    async function startFor(
        tab: string,
        kind: TerminalKind,
        folder: string,
        join: (held: TerminalTabState, id: string) => TerminalTabState
    ): Promise<TerminalAnswer> {
        const answer = await startTerminal(kind, folder);
        if (!answer.ok || answer.terminal === undefined) {
            say(tab, refusalWords(answer.error));
            return { ...answer, ok: false };
        }
        const made = answer.terminal;
        started.set(made.id, made);
        const target = tabById(tab);
        if (target === null || workbench === undefined) {
            endTerminals([made.id]);
            return answer;
        }
        say(tab, '');
        workbench.restate(target.id, target.page, join(readTab(target.state), made.id));
        workbench.activate(target.id, target.page);
        return answer;
    }

    /**
     * New Terminal in a tab: a terminal of a kind at once, in the tab's folder, shown. The tab is
     * marked as starting that kind from the call until it answers, whichever way it answers, so a
     * tab with no row says that a shell is starting rather than drawing the composer meanwhile.
     */
    async function startInTab(id: string, kind: TerminalKind, at = ''): Promise<TerminalAnswer> {
        starting.kinds[id] = kind;
        try {
            const target = tabById(id);
            if (target === null) return { ok: false, id: '', error: '' };
            const known = tabFolder(
                readTab(target.state),
                (one) => terminalRecord(one)?.cwd ?? null
            );
            const folder = at !== '' ? at : (known ?? (await defaultFolder()));
            if (folder === '') {
                say(id, t('sessions.terminal_no_folder'));
                return { ok: false, id: '', error: '' };
            }
            return await startFor(id, kind, folder, (held, made) =>
                withTerminal(held, made, held.terminals.length)
            );
        } finally {
            // eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- the record is keyed by tab id, and a Map would not be reactive through $state
            delete starting.kinds[id];
        }
    }

    /** The kind a tab's New Terminal is starting, or null when the tab is not starting one. */
    function startingIn(tab: string): TerminalKind | null {
        return starting.kinds[tab] ?? null;
    }

    /**
     * New Terminal from a pane's strip: a shell in the active Terminal tab of that pane, or in a
     * Terminal tab opened in it, never another pane's.
     */
    async function newTerminalIn(page: string, path: number[]): Promise<TerminalAnswer> {
        if (workbench === undefined) return { ok: false, id: '', error: '' };
        const tab =
            workbench.paneTab(page, path) ??
            workbench.openIn(page, path, emptyTab(crypto.randomUUID()));
        if (tab === '') return { ok: false, id: '', error: '' };
        return startInTab(tab, 'shell');
    }

    /** Split a terminal of a tab: one of its kind and folder starts right of it in the row. */
    async function splitTerminal(tab: string, terminal: string): Promise<TerminalAnswer> {
        const target = tabById(tab);
        const record = terminalRecord(terminal);
        const owned = target !== null && readTab(target.state).terminals.includes(terminal);
        if (!owned || record === null) {
            const words = t('sessions.terminal_split_unknown');
            say(tab, words);
            return { ok: false, id: '', error: words };
        }
        return startFor(tab, record.kind, record.cwd, (held, id) => splitRight(held, terminal, id));
    }

    /** Give a terminal a title; an empty one clears it. */
    async function renameTerminal(id: string, title: string): Promise<TerminalAnswer> {
        return post({ action: 'rename', id, title });
    }

    /** Give a terminal an icon and/or a colour; an empty string is the default. */
    async function restyleTerminal(
        id: string,
        style: { icon?: string; color?: string }
    ): Promise<TerminalAnswer> {
        return post({ action: 'restyle', id, ...style });
    }

    /** Empty a terminal's tmux history. */
    async function clearHistory(id: string): Promise<TerminalAnswer> {
        return post({ action: 'clear', id });
    }

    /**
     * Whether a terminal is running as far as the page knows: listed, or started and not yet, and
     * every terminal until the first `sessions` message says which ones are.
     */
    function running(id: string): boolean {
        return !heard || terminalById(id) !== null || started.has(id);
    }

    /** The running terminals the Terminal tabs among these instances list. */
    function runningOf(instances: readonly { view: string; state?: unknown }[]): string[] {
        const ids = instances
            .filter((one) => one.view === TERMINAL_VIEW)
            .flatMap((one) => readTab(one.state).terminals);
        return [...new Set(ids)].filter(running);
    }

    /**
     * Which of these terminals run a program other than their shell, from a fresh read of the
     * server. An ended task terminal is not asked about; a running one is always busy.
     */
    function busyOf(ids: string[]): Promise<BusyTerminal[]> {
        const open = ids.filter((id) => (terminalRecord(id)?.exit ?? null) === null);
        return readBusy(
            open,
            (id) => {
                const record = terminalRecord(id);
                return record === null ? id : terminalLabel(record);
            },
            (id) => terminalRecord(id)?.task === true
        );
    }

    function adopt(made: Terminal): void {
        started.set(made.id, made);
        showTerminal(made.id, terminalTabTitle(made));
        workbench?.select(made.id);
    }

    /** End terminals: their tmux sessions stop, and with them what runs inside. */
    function endTerminals(ids: string[]): void {
        for (const id of ids) {
            started.delete(id);
            viewports.drop(id);
            void stopTerminal(id);
        }
    }

    const { sendInput, sendResize, subscribePty, unsubscribePty, subscribed } = createPtyWire(
        socket,
        order
    );

    return {
        terminals,
        terminalById,
        tabMark: (instance) => tabMarkOf(instance, terminalById),
        startTerminal,
        recoverDataset,
        startTask,
        latex,
        approveLatex,
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
        subscribed,
        showTerminal,
        focusAsked: () => focus.id,
        focusTaken: (id) => {
            if (focus.id === id) focus.id = null;
        },
        hideTerminal,
        adopt,
        moveTerminal,
        attachable,
        attachTerminal,
        ...opening,
        approveSeed,
        startInTab,
        startingIn,
        newTerminalIn,
        splitTerminal,
        refusal,
        say,
        renameTerminal,
        restyleTerminal,
        clearHistory,
        runningOf,
        busyOf,
        endTerminals,
        keepViewport: viewports.keep,
        takeViewport: viewports.take
    };
}
