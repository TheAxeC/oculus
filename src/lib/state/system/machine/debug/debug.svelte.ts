// Layer 2, client state. The debugger of a page: the session the server holds (the `debug` channel,
// replaced whole by each message) and its console (the `debug-console` channel, appended to), the
// breakpoints, function breakpoints and watch expressions the reader keeps in the browser, the
// launch configurations of the repository on screen, and the calls that start, step and stop.
//
// What the browser keeps is `oculus.debug.v1` (debug.ts), read through zod and read again when
// another tab of the page writes it; during a session every change of a list is posted to the
// server, and a launch carries the lists as they stand. The lists belong to files by absolute path
// and only a `.rite` file under a served root takes a breakpoint.
//
// Start saves every unsaved `.rite` tab first, as Cmd+S does, and stops with the tab's own message
// when one is not saved. A configuration that names a `before` command runs it through the
// commands store and waits for its task terminal's exit: 0 goes on, anything else is asked. The
// launch is posted once, so an approval the server asks for is answered and the launch posted
// again without the command. A pause opens the top frame's file at its line, focuses the editor,
// the window and the Debug view; the console view opens at a session's start.
//
// A question the reader must answer (the launch's approval, the stop's confirmation, the failed
// command) is held as `asking`, which the shell draws once.

import { untrack } from 'svelte';
import type {
    DebugConfiguration,
    DebugConsole,
    DebugLaunches,
    DebugPayload,
    CommandSource,
    DebugStatus,
    Terminal
} from '../../../../data/model/index.ts';
import { deepestHolding } from '../../../../data/helpers/files/paths.ts';
import type { EntitiesStore, Queries, WritesStore } from '../../../shared/stores/shapes.ts';
import { followKey } from '../../../shared/stores/storage-events.ts';
import { t } from '../../../shared/words/text.ts';
import type { Outcome } from '../../../sources/explorer/ops.svelte.ts';
import type { ServedRoot } from '../../../sources/repositories/file-git.ts';
import { holds } from '../../docs.svelte.ts';
import { postDebug, readConsole, readLaunches, type DebugAnswer } from './debug-io.ts';
import { addConfiguration, LAUNCH_FILE } from './debug-file.ts';
import { createLists } from './debug-lists.ts';
import {
    consoleAfter,
    consoleOfSession,
    DEBUG_KEY,
    EMPTY_CONSOLE,
    enabledLines,
    loadSaved,
    nothingSaved,
    repoOfFile,
    scopeValue,
    writeSaved,
    type SavedDebug,
    type Storable
} from './debug.ts';

/** How long a `before` command may run before the reader is offered to go on without it. */
const SLOW_MS = 10_000;

/** The payload of a server that has run no session. */
const IDLE: DebugPayload = {
    status: 'idle',
    session: null,
    pause: null,
    frames: [],
    frame: null,
    scopes: [],
    watch: [],
    breakpoints: [],
    functions: [],
    ended: ''
};

/** What a launch is made of: the repository, the configuration (none for the open file), file. */
export type Target = { repo: string; config: DebugConfiguration | null; file: string };

/** The question the reader is asked. */
type DebugAsking =
    | { kind: 'launch'; name: string; program: string; cwd: string; target: Target }
    | { kind: 'stop'; process: string; restart: boolean }
    | { kind: 'before'; name: string; code: number; terminal: string; target: Target }
    | { kind: 'abort'; name: string; terminal: string };

/** A source tab of a `.rite` file, as the launch reads it. */
type RiteTab = { id: string; root: string; path: string; dirty: boolean };

/** What the store reads of the source tab on screen: the file it shows and its caret. */
type DebugScreen = { status: { file: string; caret: { line: number } | null } };

/** What the store asks of the notices: post one and take one back. */
type DebugNotices = {
    post: (
        message: string,
        options?: {
            tone?: 'info' | 'warning' | 'error';
            actions?: { label: string; run: () => void }[];
        }
    ) => number;
    clear: (id: number) => void;
};

/** How a press of a project command ended, as the commands store tells it. */
type DebugPressEnd = {
    repo: string;
    name: string;
    outcome: { kind: 'started'; terminal: string } | { kind: 'refused' } | { kind: 'dropped' };
};

/** What the store asks of the commands store: the commands of a repository, and a press. */
type DebugCommands = {
    load: (repo: string) => Promise<{ commands: { name: string; source: CommandSource }[] }>;
    press: (repo: string, name: string, source: CommandSource) => Promise<boolean>;
    afterPress: (listener: (end: DebugPressEnd) => void) => () => void;
};

/** What the store needs of the other stores and of the page. */
export type DebugDeps = {
    entities: EntitiesStore;
    writes: WritesStore;
    queries: Queries;
    notices: DebugNotices;
    commands: DebugCommands;
    terminalById: (id: string | null) => Terminal | null;
    showTerminal: (id: string) => void;
    stopTerminal: (id: string) => Promise<unknown>;
    /** The source tab on screen and the one whose editor the reader focused last, or null. */
    onScreen: () => DebugScreen | null;
    focusedSource: () => DebugScreen | null;
    gitRoots: () => string[];
    served: () => ServedRoot[];
    openFile: (root: string, path: string, line: number) => boolean;
    /** The source tabs over a `.rite` file on every page. */
    riteTabs: () => RiteTab[];
    draft: (id: string) => { text: string; saved: string; message: string };
    saveDraft: (id: string, root: string, path: string) => Promise<void>;
    create: (
        into: { root: string; path: string },
        name: string,
        folder: boolean
    ) => Promise<Outcome>;
    saveText: (root: string, path: string, text: string) => Promise<{ ok: boolean; error: string }>;
    openView: (view: string) => void;
    /** Put the caret at a line of the file open in the active tab and the focus in its editor. */
    focusEditor: (file: string, line: number) => boolean;
    focusWindow: () => void;
};

/** The wait for a launch's `before` command. */
type Waiting = { target: Target; name: string; terminal: string | null; seen: boolean };

export type DebugStore = ReturnType<typeof createDebug>;

export function createDebug(deps: DebugDeps) {
    const { entities, writes, queries, notices, commands } = deps;
    const held: {
        saved: SavedDebug;
        console: DebugConsole;
        asking: DebugAsking | null;
        waiting: Waiting | null;
        lastRepo: string | null;
        watching: Record<string, number>;
    } = $state({
        saved: nothingSaved(),
        console: EMPTY_CONSOLE,
        asking: null,
        waiting: null,
        lastRepo: null,
        watching: {}
    });
    let storage: Storable | undefined;
    let stopFollowing: () => void = () => undefined;
    let last: Target | null = null;
    let starting = false;
    let restarting = false;
    let slowTimer: ReturnType<typeof setTimeout> | null = null;
    let slowNotice: number | null = null;
    let reading = 0;
    let before: DebugStatus = 'idle';
    let session = 0;

    const payload = (): DebugPayload => entities.debug() ?? IDLE;
    const status = (): DebugStatus => payload().status;
    const paused = (): boolean => status() === 'paused';
    const active = (): boolean => ['starting', 'running', 'paused'].includes(status());

    // ---- what the browser keeps ----------------------------------------------------------

    function keep(saved: SavedDebug): void {
        held.saved = saved;
        writeSaved(storage, saved);
    }

    const lists = createLists({
        saved: () => held.saved,
        keep,
        active,
        paused,
        payload,
        writes
    });

    function load(from: Storable, source?: EventTarget): void {
        storage = from;
        held.saved = loadSaved(from);
        stopFollowing();
        stopFollowing =
            source === undefined
                ? () => undefined
                : followKey(source, DEBUG_KEY, () => {
                      // The tab that wrote the lists has posted them; this one only draws them.
                      held.saved = loadSaved(from);
                  });
    }

    // ---- the console ---------------------------------------------------------------------

    async function refetchConsole(): Promise<void> {
        reading += 1;
        const mine = reading;
        const whole = await readConsole();
        if (whole !== null && mine === reading) held.console = whole;
    }

    entities.afterReceive((message) => {
        if (message.channel === 'debug-console') {
            const append = entities.payloadOf(message, 'debug-console');
            if (append === null) return;
            const next = consoleAfter(held.console, append);
            if (next === null) void refetchConsole();
            else held.console = next;
            return;
        }
        if (message.channel === 'files') {
            const root = entities.payloadOf(message, 'files')?.root ?? '';
            for (const one of queries.entries<DebugLaunches>(['debug'])) {
                if (holds(root, String(one.key[1]))) queries.mark(['debug', one.key[1]], 'replace');
            }
            return;
        }
        if (message.channel === 'sessions') {
            checkWaiting();
            return;
        }
        if (message.channel === 'debug') heard(entities.payloadOf(message, 'debug'));
    });

    /** What a new state of the session does on the page. */
    function heard(next: DebugPayload | null): void {
        if (next === null) return;
        const number = next.session?.number ?? 0;
        if (number !== session) {
            session = number;
            held.console = consoleOfSession(number);
            if (next.status === 'starting') deps.openView('debug-console');
        }
        const was = before;
        before = next.status;
        if (next.status === 'paused' && was !== 'paused') {
            deps.openView('debug');
            deps.focusWindow();
            const top = next.frames.find((frame) => frame.id === next.frame) ?? next.frames.at(0);
            if (top !== undefined) openServed(top.path, top.line, 100);
        }
        if (next.status === 'ended' && restarting) {
            restarting = false;
            if (last !== null) void begin(last);
        }
    }

    function consoleLines(): DebugConsole {
        return held.console;
    }

    // ---- the launch configurations -------------------------------------------------------

    const keyOf = (repo: string): [string, string] => ['debug', repo];

    /** The repository of the source tab on screen, else of the one focused last, else the last. */
    /**
     * The repository of the file on screen, else the one last watched, else the session's, running
     * or last run, which is the one a page loaded after a launch has before the reader picks a tab.
     */
    function repo(): string | null {
        const file = (deps.onScreen() ?? deps.focusedSource())?.status.file ?? '';
        const found = file === '' ? null : repoOfFile(deps.gitRoots(), deps.served(), file);
        return found ?? held.lastRepo ?? payload().session?.repo ?? null;
    }

    function watchRepo(path: string): () => void {
        untrack(() => {
            held.watching[path] = (held.watching[path] ?? 0) + 1;
            held.lastRepo = path;
        });
        let released = false;
        return () => {
            if (released) return;
            released = true;
            untrack(() => {
                held.watching[path] = (held.watching[path] ?? 1) - 1;
            });
            queueMicrotask(() => {
                if ((held.watching[path] ?? 0) > 0) return;
                // eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- keyed by path
                delete held.watching[path];
                queries.forget(keyOf(path));
            });
        };
    }

    const fetcherOf = (path: string) => async (): Promise<DebugLaunches> => {
        const read = await readLaunches(path);
        if (!('error' in read)) return read;
        return {
            exists: false,
            configurations: [],
            findings: [{ file: path, field: '', message: read.error }]
        };
    };

    function launches(path: string): DebugLaunches | null {
        const { data } = queries.read(keyOf(path), fetcherOf(path), {
            enabled: (held.watching[path] ?? 0) > 0 && typeof fetch === 'function'
        });
        return data ?? null;
    }

    const loadLaunches = (path: string): Promise<DebugLaunches> =>
        queries.fetch(keyOf(path), fetcherOf(path));

    /** The configuration chosen for a repository: the kept one if it is listed, else the first. */
    function chosen(path: string, listed: DebugLaunches | null): DebugConfiguration | null {
        const configurations = listed?.configurations ?? [];
        const kept = held.saved.chosen[path];
        return configurations.find((one) => one.name === kept) ?? configurations.at(0) ?? null;
    }

    function choose(path: string, name: string): void {
        keep({ ...held.saved, chosen: { ...held.saved.chosen, [path]: name } });
    }

    // ---- start ---------------------------------------------------------------------------

    const say = (message: string, tone: 'warning' | 'error' = 'warning'): void => {
        notices.post(message, { tone });
    };

    /** The repository, the file it runs and the configuration the next Start would use. */
    async function targetNow(): Promise<Target | null> {
        const screen = deps.onScreen() ?? deps.focusedSource();
        const file = screen?.status.file ?? '';
        if (file.endsWith('.rite') && repoOfFile(deps.gitRoots(), deps.served(), file) === null) {
            say(t('debug.frame_unserved', file));
            return null;
        }
        const found = repo();
        if (found === null) {
            say(t('debug.no_file'));
            return null;
        }
        const listed = await loadLaunches(found);
        const config = chosen(found, listed);
        if (config === null) {
            if (listed.exists) {
                say(t('debug.no_reading'));
                return null;
            }
            if (!file.endsWith('.rite')) {
                say(t('debug.no_file'));
                return null;
            }
        }
        return { repo: found, config, file };
    }

    /** Start the configuration the picker shows, as F5 and the Start button do. */
    async function start(): Promise<boolean> {
        if (held.waiting !== null) {
            say(t('debug.waiting', held.waiting.name));
            return false;
        }
        if (active() || starting) {
            say(t('debug.running'));
            return false;
        }
        starting = true;
        try {
            const target = await targetNow();
            return target !== null && (await begin(target));
        } finally {
            starting = false;
        }
    }

    /** Save the unsaved `.rite` tabs, run the `before` command, and launch. */
    async function begin(target: Target): Promise<boolean> {
        for (const tab of deps.riteTabs().filter((one) => one.dirty)) {
            const sent = deps.draft(tab.id).text;
            await deps.saveDraft(tab.id, tab.root, tab.path);
            const after = deps.draft(tab.id);
            if (after.saved !== sent) {
                say(after.message === '' ? t('debug.not_saved', tab.path) : after.message);
                return false;
            }
        }
        const name = target.config?.before;
        if (name === undefined) return launch(target);
        const listed = await commands.load(target.repo);
        const found = listed.commands.find((one) => one.name === name);
        if (found === undefined) {
            say(t('debug.before_unknown', name), 'error');
            return false;
        }
        held.waiting = { target, name, terminal: null, seen: false };
        void commands.press(target.repo, name, found.source);
        return true;
    }

    /** The files under a served root that hold breakpoints the adapter takes. */
    function launchFiles(): { path: string; lines: number[] }[] {
        const roots = deps.served();
        return Object.keys(held.saved.breakpoints)
            .filter(
                (path) =>
                    path.endsWith('.rite') &&
                    deepestHolding(roots, (root) => root.dir, path) !== null
            )
            .map((path) => ({ path, lines: enabledLines(held.saved.breakpoints[path] ?? []) }))
            .filter((file) => file.lines.length > 0);
    }

    async function launch(target: Target): Promise<boolean> {
        last = target;
        const answer = await postDebug(
            {
                action: 'launch',
                repo: target.repo,
                name: target.config?.name ?? null,
                context: target.file === '' ? {} : { file: target.file },
                breakpoints: launchFiles(),
                functions: held.saved.functions,
                watch: held.saved.watch
            },
            writes
        );
        if (answer.kind === 'approve') {
            held.asking = {
                kind: 'launch',
                name: target.config === null ? '' : answer.name,
                program: answer.program,
                cwd: answer.cwd,
                target
            };
            return false;
        }
        return settled(answer);
    }

    /** Say a refusal; true for an answer that is none. */
    function settled(answer: DebugAnswer): boolean {
        if (answer.kind === 'refused') {
            if (answer.error !== '') say(answer.error, 'error');
            return false;
        }
        return true;
    }

    // ---- the wait for a `before` command -------------------------------------------------

    function dropWaiting(message: string): void {
        endWaiting();
        say(message);
    }

    function endWaiting(): void {
        if (slowTimer !== null) clearTimeout(slowTimer);
        slowTimer = null;
        if (slowNotice !== null) notices.clear(slowNotice);
        slowNotice = null;
        held.waiting = null;
    }

    commands.afterPress((end) => {
        const waiting = held.waiting;
        if (waiting?.terminal !== null) return;
        if (end.repo !== waiting.target.repo || end.name !== waiting.name) return;
        if (end.outcome.kind === 'refused') {
            dropWaiting(t('debug.not_started', waiting.name));
        } else if (end.outcome.kind === 'dropped') {
            dropWaiting(t('debug.not_approved', waiting.name));
        } else {
            held.waiting = { ...waiting, terminal: end.outcome.terminal };
            slowTimer = setTimeout(slow, SLOW_MS);
            checkWaiting();
        }
    });

    /** Read the waited-for terminal: its exit goes on or asks, and its leaving the list drops. */
    function checkWaiting(): void {
        const waiting = held.waiting;
        const terminal = waiting?.terminal ?? null;
        if (waiting === null || terminal === null) return;
        const one = deps.terminalById(terminal);
        if (one === null) {
            if (waiting.seen) dropWaiting(t('debug.terminal_closed', waiting.name));
            return;
        }
        if (!waiting.seen) held.waiting = { ...waiting, seen: true };
        if (one.exit === null) return;
        endWaiting();
        if (one.exit === 0) {
            void launch(waiting.target);
            return;
        }
        held.asking = {
            kind: 'before',
            name: waiting.name,
            code: one.exit,
            terminal,
            target: waiting.target
        };
    }

    /** Offer the reader to go on without a command that has run for SLOW_MS. */
    function slow(): void {
        const waiting = held.waiting;
        slowTimer = null;
        const terminal = waiting?.terminal ?? null;
        if (waiting === null || terminal === null) return;
        slowNotice = notices.post(t('debug.slow', waiting.name), {
            tone: 'info',
            actions: [
                {
                    label: t('debug.go_on'),
                    run: () => {
                        endWaiting();
                        void launch(waiting.target);
                    }
                },
                {
                    label: t('debug.abort'),
                    run: () => {
                        endWaiting();
                        held.asking = { kind: 'abort', name: waiting.name, terminal };
                    }
                }
            ]
        });
    }

    // ---- the questions -------------------------------------------------------------------

    /** The reader's answer to the launch's approval or the stop's confirmation. */
    async function answer(yes: boolean): Promise<void> {
        const asked = held.asking;
        held.asking = null;
        if (asked === null || !yes) return;
        if (asked.kind === 'launch') {
            const approved = await postDebug(
                {
                    action: 'approve',
                    repo: asked.target.repo,
                    cwd: asked.cwd,
                    program: asked.program
                },
                writes
            );
            if (settled(approved)) await launch(asked.target);
        } else if (asked.kind === 'stop') {
            restarting = asked.restart;
            if (!settled(await postDebug({ action: 'stop', confirmed: true }, writes))) {
                restarting = false;
            }
        } else if (asked.kind === 'abort') {
            await deps.stopTerminal(asked.terminal);
        }
    }

    /** The reader's choice after a `before` command ended other than 0. */
    function choice(which: 'anyway' | 'errors' | 'abort'): void {
        const asked = held.asking;
        if (asked?.kind !== 'before') return;
        held.asking = null;
        if (which === 'anyway') void launch(asked.target);
        else if (which === 'errors') deps.showTerminal(asked.terminal);
    }

    // ---- stepping, stop, evaluate --------------------------------------------------------

    async function resume(command: 'continue' | 'next' | 'stepIn' | 'stepOut' | 'finishFrame') {
        return settled(await postDebug({ action: command }, writes));
    }

    /** Stop: drops a waiting launch, else asks the server, which asks for a confirmation. */
    async function stop(restart = false): Promise<void> {
        if (held.waiting !== null) {
            endWaiting();
            return;
        }
        const answered = await postDebug({ action: 'stop' }, writes);
        if (answered.kind === 'confirm') {
            held.asking = { kind: 'stop', process: answered.process, restart };
        } else settled(answered);
    }

    /** Restart: stop behind its confirmation, then the same configuration again. */
    const restart = (): Promise<void> => stop(true);

    /** F5: continue when paused, else start. */
    function press(): Promise<boolean> {
        return paused() ? resume('continue') : start();
    }

    async function selectFrame(id: number): Promise<void> {
        if (!settled(await postDebug({ action: 'frame', id }, writes))) return;
        const frame = payload().frames.find((one) => one.id === id);
        if (frame !== undefined) openFrame(frame.path, frame.line);
    }

    /** Open a frame's file at its line and put the focus in its editor. */
    function openFrame(path: string, line: number): void {
        const place = deepestHolding(deps.served(), (root) => root.dir, path);
        if (place === null) {
            say(t('debug.frame_unserved', path));
            return;
        }
        if (!deps.openFile(place.item.key, place.path, line)) return;
        focusSoon(path, line, 20);
    }

    /**
     * A page loaded while the session is paused hears the pause before it has read the served
     * roots, so the frame is opened once they are there.
     */
    function openServed(path: string, line: number, left: number): void {
        if (deps.served().length > 0 || left <= 0) {
            openFrame(path, line);
            return;
        }
        setTimeout(() => openServed(path, line, left - 1), 50);
    }

    /** The editor mounts after the tab opens, so the focus is asked again until it takes. */
    function focusSoon(path: string, line: number, left: number): void {
        if (deps.focusEditor(path, line) || left <= 0) return;
        setTimeout(() => focusSoon(path, line, left - 1), 50);
    }

    /** Evaluate what the console's input holds in the selected frame. */
    async function evaluate(expression: string): Promise<void> {
        settled(
            await postDebug(
                { action: 'evaluate', expression, context: 'repl', frame: payload().frame },
                writes
            )
        );
    }

    /** What a hover over a word shows: the word's value in the selected frame, or null. */
    async function hover(word: string): Promise<string | null> {
        if (!paused()) return null;
        const shown = scopeValue(payload(), word);
        if (shown === null) return null;
        const answered = await postDebug(
            { action: 'evaluate', expression: word, context: 'hover', frame: payload().frame },
            writes
        );
        return answered.kind === 'value' ? answered.value : shown;
    }

    /** F9: toggle a breakpoint on the caret line of the `.rite` source tab on screen. */
    function toggleAtCaret(): boolean {
        const screen = deps.onScreen();
        const file = screen?.status.file ?? '';
        const line = screen?.status.caret?.line;
        if (!file.endsWith('.rite') || line === undefined) return false;
        lists.toggle(file, line);
        return true;
    }

    /** The line the paused program is on in a file, or null. */
    function pausedLine(path: string): number | null {
        if (!paused()) return null;
        const frame = payload().frames.find((one) => one.id === payload().frame);
        return frame?.path === path ? frame.line : null;
    }

    // ---- the toolbar and the status ------------------------------------------------------

    /** Say what a session is doing, in the words the Debug view's state line shows. */
    function stateWords(): string {
        const now = payload();
        switch (now.status) {
            case 'idle':
                return t('debug.state_idle');
            case 'starting':
                return t('debug.state_starting');
            case 'running':
                return t('debug.state_running');
            case 'paused':
                return now.pause?.reason === 'step'
                    ? t('debug.state_paused_step')
                    : t('debug.state_paused_breakpoint');
            case 'ended':
                return t('debug.state_ended', now.ended);
        }
    }

    function moveToolbar(x: number): void {
        keep({ ...held.saved, toolbar: Math.max(0, Math.round(x)) });
    }

    return {
        load,
        stopFollowing: () => stopFollowing(),
        payload,
        status,
        active,
        paused,
        console: consoleLines,
        stateWords,
        repo,
        watch: watchRepo,
        launches,
        chosen,
        choose,
        start,
        press,
        restart,
        stop,
        resume,
        selectFrame,
        evaluate,
        hover,
        pausedLine,
        toggleAtCaret,
        ...lists,
        addConfiguration: (path: string) => addConfiguration(deps, queries, path),
        openAt: openFrame,
        openLaunch: (path: string, line: number) => deps.openFile(path, LAUNCH_FILE, line),
        asking: () => held.asking,
        answer,
        choice,
        waiting: () => held.waiting?.name ?? null,
        ran: () => payload().session !== null,
        toolbar: () => held.saved.toolbar,
        moveToolbar
    };
}
