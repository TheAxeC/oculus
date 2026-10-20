// Layer 2, client state. The debugger of a page: the session the server holds (the `debug` channel,
// replaced whole by each message) and its console (the `debug-console` channel, appended to), the
// breakpoints, function breakpoints and watch expressions the reader keeps, the launch
// configurations of the repository on screen, and the calls that start, step and stop.
//
// What the reader keeps is the debugger's record of the page state (`debug.json` of the state
// folder, state/shared/stores/page-state.svelte.ts), read through zod (debug.ts) whenever it
// changes, by this page or by another page's save; during a session every change of a list is
// posted to the server, and a launch carries the lists as they stand, each breakpoint with the
// condition, hit condition and log message it is set with. The lists belong to files by absolute
// path and only a file under a served root whose language takes breakpoints takes one: `rite`, and
// the languages the acting apps name under `contributes.breakpoints`.
//
// Start saves every unsaved tab of a language that takes breakpoints first, as Cmd+S does, and
// stops with the tab's own message when one is not saved. A configuration that names a `before`
// command runs it through the commands store and waits for its task terminal's exit: 0 goes on,
// anything else is asked. The launch is posted once, so an approval the server asks for is answered
// and the launch posted again without the command. A pause opens the top frame's file at its line,
// focuses the editor, the window and the Debug view; the console view opens at a session's start.
//
// What the controls offer follows what the adapter of the session, or of the debugger the file on
// screen starts, declared in its answer to `initialize` (`capabilities`): a control for a feature
// the adapter did not declare is not drawn and its action is not sent. Start with no configuration
// in `launch.yml` runs the debugger whose `languages` holds the file's language, with the first of
// its `initialConfigurations` or else the first configuration its providers give. Add
// Configuration lists the snippets, the `initialConfigurations` and the provided configurations of
// the acting debuggers beside oculus's own and writes the chosen one into `launch.yml`.
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
import { deepestHolding, joinPath } from '../../../../data/helpers/files/paths.ts';
import {
    RITE_TYPE,
    type ActingDebugger,
    type ConfigurationChoice
} from '../../../../data/helpers/files/apps/tools/debuggers.ts';
import type { EntitiesStore, Queries, WritesStore } from '../../../shared/stores/shapes.ts';
import type { PageStateStore } from '../../../shared/stores/page-state.svelte.ts';
import { t } from '../../../shared/words/text.ts';
import type { ServedRoot } from '../../../sources/repositories/file-git.ts';
import { filesNamed } from '../../../shared/answers/files-named.ts';
import { postDebug, readConsole, readLaunches, type DebugAnswer } from './debug-io.ts';
import {
    addConfiguration,
    configurationChoices,
    givenConfiguration,
    LAUNCH_FILE
} from './debug-file.ts';
import { createAdapterCalls } from './debug-adapter.svelte.ts';
import { createLists } from './debug-lists.ts';
import {
    consoleAfter,
    consoleOfSession,
    EMPTY_CONSOLE,
    enabledSpecs,
    functionSpecs,
    readSaved,
    repoOfFile,
    savedRecord,
    stateWords,
    type SavedDebug
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
    thread: null,
    scopes: [],
    watch: [],
    breakpoints: [],
    functions: [],
    ended: '',
    adapter: null,
    exceptions: [],
    declared: {}
};

/**
 * What a launch is made of: the repository, the configuration (none for the open file) and the
 * file on screen. `given` marks a configuration `launch.yml` does not hold, which the launch
 * carries whole.
 */
export type Target = {
    repo: string;
    config: DebugConfiguration | null;
    file: string;
    given?: boolean;
};

/** The question the reader is asked. */
type DebugAsking =
    | { kind: 'launch'; name: string; program: string; cwd: string; target: Target }
    | { kind: 'stop'; process: string; restart: boolean }
    | { kind: 'before'; name: string; code: number; terminal: string; target: Target }
    | { kind: 'abort'; name: string; terminal: string };

/** A source tab of a file that takes breakpoints, as the launch reads it. */
type DebugTab = { id: string; root: string; path: string; dirty: boolean };

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
    /** The page state, whose debugger's record holds what the reader keeps. */
    state: Pick<PageStateStore, 'debug' | 'setDebug'>;
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
    /** The source tabs over a file that takes breakpoints, on every page. */
    debugTabs: () => DebugTab[];
    /** The languages that take a breakpoint: `rite` and those the acting apps name. */
    breakpointLanguages: () => string[];
    /** The language the editor picks for a file by its name. */
    languageOf: (path: string) => string;
    /** The debuggers of the apps that act. */
    debuggers: () => ActingDebugger[];
    draft: (id: string) => { text: string; saved: string; message: string };
    saveDraft: (id: string, root: string, path: string) => Promise<boolean>;
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
        console: DebugConsole;
        asking: DebugAsking | null;
        waiting: Waiting | null;
        lastRepo: string | null;
        watching: Record<string, number>;
        /** The configurations Add Configuration offers, once asked for. */
        choosing: { repo: string; choices: ConfigurationChoice[] } | null;
    } = $state({
        console: EMPTY_CONSOLE,
        asking: null,
        waiting: null,
        lastRepo: null,
        watching: {},
        choosing: null
    });
    /** What the reader keeps, as the page state's record of the debugger holds it. */
    const saved = $derived(readSaved(deps.state.debug()));
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

    const adapter = createAdapterCalls({
        payload,
        active,
        paused,
        writes,
        languageOf: deps.languageOf,
        debuggers: deps.debuggers,
        configuredType() {
            const current = repo();
            const config = current === null ? null : chosen(current, launches(current));
            return config?.type ?? RITE_TYPE;
        },
        settled
    });
    const { capabilities } = adapter;

    // ---- what the reader keeps -----------------------------------------------------------

    function keep(next: SavedDebug): void {
        deps.state.setDebug(savedRecord(next));
    }

    const lists = createLists({
        saved: () => saved,
        keep,
        active,
        paused,
        payload,
        writes
    });

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
            const payload = entities.payloadOf(message, 'files');
            const root = payload?.root ?? '';
            for (const one of queries.entries<DebugLaunches>(['debug'])) {
                const file = joinPath(String(one.key[1]), LAUNCH_FILE);
                if (filesNamed(root, payload?.folders, file)) {
                    queries.mark(['debug', one.key[1]], 'replace');
                }
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
        const kept = saved.chosen[path];
        return configurations.find((one) => one.name === kept) ?? configurations.at(0) ?? null;
    }

    function choose(path: string, name: string): void {
        keep({ ...saved, chosen: { ...saved.chosen, [path]: name } });
    }

    // ---- start ---------------------------------------------------------------------------

    const say = (message: string, tone: 'warning' | 'error' = 'warning'): void => {
        notices.post(message, { tone });
    };

    /** Whether a language takes a breakpoint in the gutter. */
    const takesLanguage = (language: string): boolean =>
        deps.breakpointLanguages().includes(language);

    /** Whether a file, by its name, takes a breakpoint. */
    const takes = (path: string): boolean => takesLanguage(deps.languageOf(path));

    /** The repository, the file it runs and the configuration the next Start would use. */
    async function targetNow(): Promise<Target | null> {
        const screen = deps.onScreen() ?? deps.focusedSource();
        const file = screen?.status.file ?? '';
        const language = file === '' ? '' : deps.languageOf(file);
        if (takesLanguage(language) && repoOfFile(deps.gitRoots(), deps.served(), file) === null) {
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
        if (config !== null) return { repo: found, config, file };
        if (listed.exists) {
            say(t('debug.no_reading'));
            return null;
        }
        if (language === RITE_TYPE) return { repo: found, config: null, file };
        if (file === '') {
            say(t('debug.no_file'));
            return null;
        }
        const given = await givenConfiguration(deps, say, found, language);
        return given === null ? null : { repo: found, config: given, file, given: true };
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
        for (const tab of deps.debugTabs().filter((one) => one.dirty)) {
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
    function launchFiles(): { path: string; lines: ReturnType<typeof enabledSpecs> }[] {
        const roots = deps.served();
        return Object.keys(saved.breakpoints)
            .filter(
                (path) => takes(path) && deepestHolding(roots, (root) => root.dir, path) !== null
            )
            .map((path) => ({ path, lines: enabledSpecs(saved.breakpoints[path] ?? []) }))
            .filter((file) => file.lines.length > 0);
    }

    async function launch(target: Target): Promise<boolean> {
        last = target;
        const answer = await postDebug(
            {
                action: 'launch',
                repo: target.repo,
                name: target.given === true ? null : (target.config?.name ?? null),
                ...(target.given === true && target.config !== null
                    ? { configuration: target.config }
                    : {}),
                context: target.file === '' ? {} : { file: target.file },
                breakpoints: launchFiles(),
                functions: functionSpecs(saved.functions, saved.functionOptions),
                watch: saved.watch
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

    /**
     * Restart through the adapter's own request when it declared one, else stop and start again.
     */
    async function restart(): Promise<void> {
        if (active() && capabilities().restart) {
            settled(await postDebug({ action: 'restart' }, writes));
            return;
        }
        await stop(true);
    }

    // ---- Add Configuration ---------------------------------------------------------------

    /** Offer the configurations to add; a repository with no acting debugger adds oculus's own. */
    async function startAdding(path: string): Promise<void> {
        const choices = await configurationChoices(deps, path);
        if (choices.length === 1) {
            await writeAndChoose(path, choices[0]);
            return;
        }
        held.choosing = { repo: path, choices };
    }

    /** Write the configuration to the launch file and choose it. */
    async function writeAndChoose(path: string, choice: ConfigurationChoice): Promise<void> {
        const name = await addConfiguration(deps, queries, path, choice, launches(path));
        if (name !== null) keep({ ...saved, chosen: { ...saved.chosen, [path]: name } });
    }

    /** The reader picked the offered configuration at this place. */
    async function pickConfiguration(at: number): Promise<void> {
        const offered = held.choosing;
        held.choosing = null;
        const one = offered?.choices.at(at);
        if (offered !== null && one !== undefined) await writeAndChoose(offered.repo, one);
    }

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

    /**
     * F9: toggle a breakpoint on the caret line of the source tab on screen, when its file takes
     * one.
     */
    function toggleAtCaret(): boolean {
        const screen = deps.onScreen();
        const file = screen?.status.file ?? '';
        const line = screen?.status.caret?.line;
        if (file === '' || !takes(file) || line === undefined) return false;
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

    function moveToolbar(x: number): void {
        keep({ ...saved, toolbar: Math.max(0, Math.round(x)) });
    }

    return {
        payload,
        status,
        active,
        paused,
        console: consoleLines,
        stateWords: () => stateWords(payload(), t),
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
        hover: adapter.hover,
        pausedLine,
        toggleAtCaret,
        ...lists,
        addConfiguration: startAdding,
        choosing: () => held.choosing,
        pickConfiguration,
        cancelChoosing: () => {
            held.choosing = null;
        },
        takes,
        takesLanguage,
        capabilities,
        /** Whether the controls follow oculus's own adapter, which has Finish Frame. */
        ownAdapter: () => adapter.adapterType() === RITE_TYPE,
        capsOfFile: adapter.capsOfFile,
        pause: adapter.pause,
        setVariable: adapter.setVariable,
        complete: adapter.complete,
        readSources: adapter.readSources,
        sources: adapter.sources,
        contextKeys: adapter.contextKeys,
        sessionArg: adapter.sessionArg,
        setException: adapter.setException,
        setExceptionCondition: adapter.setExceptionCondition,
        openAt: openFrame,
        openLaunch: (path: string, line: number) => deps.openFile(path, LAUNCH_FILE, line),
        asking: () => held.asking,
        answer,
        choice,
        waiting: () => held.waiting?.name ?? null,
        ran: () => payload().session !== null,
        toolbar: () => saved.toolbar,
        moveToolbar
    };
}
