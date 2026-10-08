// Layer 2, client state. The builds of the LaTeX store: what the page knows of the build of each
// root, and everything that starts, follows, stops and repeats one.
//
// A root is a main file of a folder of a served root, held under one place whatever form of target
// reached it (placeOf). Its build is one of idle, building, succeeded, failed or stopped, with the
// recipe, the step and the time (RootBuild); the TeX view, the status item, the breadcrumb bar and
// the viewer read it, and a build started from any of them, from a key, from a save or from a
// change on disk is the same state. A build is a task terminal (state/sessions/terminals.svelte.ts)
// that tmux keeps after latexmk ended, with the exit status of the line, so a build has ended when
// its terminal shows an exit status or has left the terminals list of the `sessions` payload. A
// terminal the list has never shown running is taken as ended only when the server's own list, read
// after the answer that named it or after a push that shows it ended or lacks it, shows it ended or
// lacks it too, since a push can carry a list read before the terminal started or before a kept
// terminal ran again.
//
// A main file is never built twice at once: from the moment its build is asked for until its
// terminal has ended, a build that is asked for again is owed one more build after it, however many
// asked. A build the reader asks for saves every unsaved source tab first; a build a save, a change
// on disk or the end of another build asks for saves nothing. A build asked for after a stop or a
// failure, and one whose asker says so (the "no SyncTeX file" notice's Build), carries `force`, so
// latexmk builds what it believes is up to date. A build that ends non-zero, was not stopped and is
// not itself a retry is cleaned and run once more when `latex.clean_and_retry` is true, and
// `latex.auto_clean` cleans after the build that ended.
//
// `latex.auto_build` is `on_file_change`, `on_save` or `never`. On a change on disk the store asks
// the server for the root's dependency set (the include closure and the files the last build read,
// less what the build writes) on each `files` message for a root a view follows: the first answer
// is the baseline, a later answer with any file written after the time held builds once, and a
// build a change asks for starts at most once per `latex.auto_build_interval_ms`. A failed build
// posts one notice; a build a change on disk started posts it once until a build of that root
// succeeds.

import { joinPath } from '../../../data/helpers/files/paths.ts';
import { isLatexFile } from '../../../data/prose/latex.ts';
import type { LatexBuilding } from '../../../data/sources/config/settings.ts';
import { HUB_ROOT } from '../../sources/fs.ts';
import { t } from '../../shared/words/text.ts';
import { emptyTarget, type LatexTarget } from '../terminal/latex-target.ts';
import { readListed } from '../terminal/pty/pty-io.ts';
import type { TerminalAnswer } from '../terminal/pty/pty-io.ts';
import type { LatexBuildAsk, TerminalsStore } from '../terminals.svelte.ts';
import type { LatexCalls } from './calls.ts';
import {
    IDLE_BUILD,
    placeOf,
    type BuildStatus,
    type LatexState,
    type NoticeAction,
    type NoticeTone,
    type RootBuild
} from './latex-state.ts';

/** How long after a save without a build a change on disk is taken as the new baseline. */
const QUIET_MS = 2000;

/** What the builds read of the rest of the page. */
export type BuildDeps = {
    terminals: Pick<TerminalsStore, 'terminals' | 'latex'>;
    calls: Pick<LatexCalls, 'rootOf' | 'dependencies'>;
    /** What a build and its follow-ups are set by, or null while the page holds no catalog. */
    settings: () => LatexBuilding | null;
    /** The state held for a folder, which names the root and folder a project's mains are in. */
    held: (target: LatexTarget) => LatexState | undefined;
    /** Save every unsaved source tab. */
    saveAll: () => Promise<void>;
    /** Say something to the reader. */
    notify: (message: string, tone: NoticeTone, actions: NoticeAction[]) => void;
    /** Read the folder's state again now. */
    reload: (target: LatexTarget) => void;
    /** Wait on one terminal, so the folder's state is read again when it ends. */
    watch: (target: LatexTarget, terminal: string) => void;
    /** Count the words of a main file. */
    count: (target: LatexTarget, main: string) => Promise<unknown>;
    /** Show the terminal of a build as the compiler log. */
    openLog: (terminal: string) => void;
    /** Show the Problems view limited to the root of the target. */
    showProblems: (target: LatexTarget) => void;
    /** Tell the store that a build state moved, so the readers redraw. */
    touched: () => void;
    /** Read the count of moves, which makes the reader depend on every move. */
    landings: () => number;
    now?: () => number;
};

/** A build that ended: the root and how it ended. */
type BuiltListener = (built: {
    target: LatexTarget;
    main: string;
    status: Exclude<BuildStatus, 'idle' | 'building'>;
}) => void;

/** What asks for a build. */
type Ask = {
    recipe?: string;
    /**
     * True when the reader asked, which saves the unsaved tabs first and always posts a failure.
     */
    reader: boolean;
    /** True for the run that repeats a failed build after its clean. */
    retry?: boolean;
    /** True when the asker wants latexmk to build what it believes is up to date. */
    force?: boolean;
    /** True when a build is already owed after this one. */
    again?: boolean;
};

/** One run of a terminal the build of a root waits on: its build, or the clean of a retry. */
type Run = {
    step: 'build' | 'clean';
    asked: Promise<TerminalAnswer>;
    terminal: string | null;
    /** True once the terminal was seen running in the terminals list. */
    running: boolean;
    /** True while the server's own list is being read for the terminal. */
    asking: boolean;
    again: boolean;
    retry: boolean;
    reader: boolean;
};

/** What is held of one root. */
type Entry = {
    target: LatexTarget;
    main: string;
    build: RootBuild;
    run: Run | null;
    /** True from a stop's request until the run it stops has ended. */
    stopped: boolean;
    /** True once a failure notice was posted and no build of the root has succeeded since. */
    notified: boolean;
    /** When the last build started, in milliseconds. */
    started: number;
    timer: ReturnType<typeof setTimeout> | null;
    /** How many views follow the root's files. */
    follows: number;
    /** The time of each dependency at the last answer, or null before the first. */
    times: Map<string, number> | null;
    /**
     * Until when a change on disk is taken as the new baseline and builds nothing, in milliseconds.
     */
    quietUntil: number;
    polling: boolean;
    again: boolean;
};

/** The builds of every root the page has asked for or followed. */
export type BuildsStore = {
    /** What the page knows of the build of a main file of a target. */
    buildOf: (target: LatexTarget, main: string) => RootBuild;
    /** True from the moment a build of a main file is asked for until its terminal has ended. */
    building: (root: string, dir: string, main: string) => boolean;
    /** The target and main file of the build this page started last, while it runs; else null. */
    running: () => { target: LatexTarget; main: string } | null;
    /** Build a main file the reader asked for; the answer is the terminal's or the refusal. */
    run: (target: LatexTarget, main: string, ask?: LatexBuildAsk) => Promise<TerminalAnswer>;
    /** Build a main file with no reader asking: a save, a change on disk or an owed build. */
    build: (target: LatexTarget, main: string) => Promise<void>;
    /** Interrupt the build of a main file. */
    stop: (target: LatexTarget, main: string) => Promise<TerminalAnswer>;
    /**
     * Run a save of a LaTeX file that starts no build: neither the `on_save` build nor the one a
     * change on disk would ask for.
     */
    savingQuietly: (root: string, path: string, save: () => Promise<void>) => Promise<void>;
    /**
     * Show the terminal of the last build of a main file as the compiler log; false when none ran.
     */
    log: (target: LatexTarget, main: string) => boolean;
    /** Follow a root's files for a build on a change on disk; the answer lets go of it. */
    follow: (root: string, path: string, main: string) => () => void;
    /** Hear every build that ends; the answer stops listening. */
    onBuilt: (listener: BuiltListener) => () => void;
    /** Build the root a saved file builds through, when `latex.auto_build` says to. */
    onSaved: (root: string, path: string) => Promise<void>;
    /** The `sessions` list moved: end the runs whose terminals ended. */
    sessionsMoved: () => void;
    /**
     * A `files` message came: ask for the dependencies of the followed mains it concerns. The test
     * is handed each main's root key and folder and the dependency files last read for it, each
     * against the root's own directory.
     */
    filesMoved: (concerned: (root: string, dir: string, files: string[]) => boolean) => void;
};

export function createBuilds(deps: BuildDeps): BuildsStore {
    const now = deps.now ?? Date.now;

    /** What is held of each root, by its place. */
    const entries = new Map<string, Entry>();

    /** The newest save of each file, so an answer to an older one is dropped. */
    const saves = new Map<string, number>();

    const listeners = new Set<BuiltListener>();

    /** The files being saved without a build, by root and path. */
    const quiet = new Set<string>();

    /** The recipe the last build named, which `latex.recipe_default` `last_used` asks for. */
    let last = '';

    /** The place of a main file as the target names it, through the state held for a project. */
    function placeOfTarget(target: LatexTarget, main: string): string {
        if ('root' in target) return placeOf(target.root, target.path, main);
        const held = deps.held(target);
        return placeOf(held?.root ?? HUB_ROOT, held?.dir ?? '', main);
    }

    function entryOf(target: LatexTarget, main: string): Entry {
        const key = placeOfTarget(target, main);
        const held = entries.get(key);
        if (held !== undefined) return held;
        const made: Entry = {
            target,
            main,
            build: IDLE_BUILD,
            run: null,
            stopped: false,
            notified: false,
            started: 0,
            timer: null,
            follows: 0,
            times: null,
            quietUntil: 0,
            polling: false,
            again: false
        };
        entries.set(key, made);
        return made;
    }

    function setBuild(entry: Entry, patch: Partial<RootBuild>): void {
        entry.build = { ...entry.build, ...patch };
        deps.touched();
    }

    function buildOf(target: LatexTarget, main: string): RootBuild {
        // Read first so the caller redraws when a build starts or ends.
        void deps.landings();
        return entries.get(placeOfTarget(target, main))?.build ?? IDLE_BUILD;
    }

    function building(root: string, dir: string, main: string): boolean {
        void deps.landings();
        const entry = entries.get(placeOf(root, dir, main));
        return entry !== undefined && entry.run !== null;
    }

    function running(): { target: LatexTarget; main: string } | null {
        void deps.landings();
        let last: Entry | null = null;
        for (const entry of entries.values()) {
            if (entry.run !== null && (last === null || entry.started > last.started)) last = entry;
        }
        return last === null ? null : { target: last.target, main: last.main };
    }

    /** Whether one terminal is in the last `sessions` payload's list, its line running. */
    function live(terminal: string): boolean {
        return deps.terminals.terminals().some((one) => one.id === terminal && one.exit === null);
    }

    /**
     * The exit status the terminals list shows for a terminal, null when it has none or is gone.
     */
    function exitOf(terminal: string): number | null {
        return deps.terminals.terminals().find((one) => one.id === terminal)?.exit ?? null;
    }

    /** Whether a run is asked for or runs: its request is out, or its terminal has not ended. */
    function underway(run: Run): boolean {
        return run.terminal === null || !run.running || live(run.terminal);
    }

    /** The answer of a request that threw: a refusal carrying what it threw. */
    function failedRequest(error: unknown): TerminalAnswer {
        return { ok: false, id: '', error: error instanceof Error ? error.message : String(error) };
    }

    /** The notice a failed build posts, with the actions that lead to its log and its problems. */
    function noticeFailure(entry: Entry, reader: boolean, message: string, terminal: string): void {
        if (!reader && entry.notified) return;
        entry.notified = true;
        const actions: NoticeAction[] = [];
        if (terminal !== '') {
            actions.push({
                label: t('latex.open_compiler_log'),
                run: () => deps.openLog(terminal)
            });
        }
        actions.push({
            label: t('latex.show_problems'),
            run: () => deps.showProblems(entry.target)
        });
        deps.notify(message, 'error', actions);
    }

    /** Clean a main file after a build when `latex.auto_clean` says the outcome calls for it. */
    function autoClean(entry: Entry, status: 'succeeded' | 'failed'): void {
        const rule = deps.settings()?.autoClean ?? 'never';
        const wanted =
            rule === 'on_built' ||
            (rule === 'on_failed' && status === 'failed') ||
            (rule === 'on_succeeded' && status === 'succeeded');
        if (!wanted) return;
        void deps.terminals.latex(entry.target, entry.main, 'clean').then((answer) => {
            if (answer.ok) deps.watch(entry.target, answer.id);
        });
    }

    /** End one run: the build's outcome, or the clean that goes before a retry. */
    function finish(entry: Entry, run: Run, exit: number | null): void {
        if (entry.run === run) entry.run = null;
        deps.touched();
        if (run.step === 'clean') {
            void start(entry.target, entry.main, {
                reader: run.reader,
                retry: true,
                again: run.again
            });
            return;
        }
        const stopped = entry.stopped;
        entry.stopped = false;
        const failed = !stopped && exit !== null && exit !== 0;
        if (failed && !run.retry && deps.settings()?.cleanAndRetry === true) {
            void cleanBeforeRetry(entry, run);
            return;
        }
        const status = stopped || exit === null ? 'stopped' : failed ? 'failed' : 'succeeded';
        const reason = failed ? t('latex.failed_exit', exit) : '';
        setBuild(entry, { status, at: now(), reason });
        deps.reload(entry.target);
        if (status === 'succeeded') entry.notified = false;
        if (status === 'failed') {
            noticeFailure(
                entry,
                run.reader,
                t('latex.failed_notice', entry.main),
                run.terminal ?? ''
            );
        }
        if (status !== 'stopped') autoClean(entry, status);
        for (const listener of listeners)
            listener({ target: entry.target, main: entry.main, status });
        if (run.again) void start(entry.target, entry.main, { reader: false });
    }

    /** Clean the files a failed build left, then build once more when the clean has ended. */
    async function cleanBeforeRetry(entry: Entry, failed: Run): Promise<void> {
        const asked = deps.terminals.latex(entry.target, entry.main, 'clean').catch(failedRequest);
        const run: Run = {
            step: 'clean',
            asked,
            terminal: null,
            running: false,
            asking: false,
            again: failed.again,
            retry: true,
            reader: failed.reader
        };
        entry.run = run;
        deps.touched();
        const answer = await asked;
        if (!answer.ok || answer.id === '') {
            if (entry.run === run) entry.run = null;
            await start(entry.target, entry.main, {
                reader: failed.reader,
                retry: true,
                again: failed.again
            });
            return;
        }
        attach(entry, run, answer);
    }

    /** Name a run's terminal from the server's answer and see whether it has already ended. */
    function attach(entry: Entry, run: Run, answer: TerminalAnswer): void {
        run.terminal = answer.id;
        if (run.step === 'build') setBuild(entry, { terminal: answer.id });
        run.running = live(answer.id);
        deps.watch(entry.target, answer.id);
        // The answer names the terminal as the server listed it just now. A run that already ended
        // ends here, through the path a later push takes; any other is read once more, since a push
        // that came while the request was out was passed over for want of the terminal.
        if (typeof answer.terminal?.exit === 'number') {
            if (entry.run === run) finish(entry, run, answer.terminal.exit);
        } else if (!run.running) {
            void confirm(entry, run);
        }
    }

    /**
     * Ask the server whether a terminal the list has never shown running is running, after a push
     * that shows it ended or lacks it: a list that shows it ended or lacks it ends the run, and a
     * list that shows it running, or a read that failed, leaves the run for the next push.
     */
    async function confirm(entry: Entry, run: Run): Promise<void> {
        if (run.asking || run.terminal === null) return;
        const terminal = run.terminal;
        run.asking = true;
        const listed = await readListed();
        run.asking = false;
        if (entry.run !== run || listed === null || run.running) return;
        const found = listed.find((held) => held.id === terminal);
        if (found?.exit === null) return;
        finish(entry, run, found?.exit ?? null);
    }

    function sessionsMoved(): void {
        for (const entry of entries.values()) {
            const run = entry.run;
            if (run?.terminal == null) continue;
            if (live(run.terminal)) {
                run.running = true;
                continue;
            }
            if (run.running) finish(entry, run, exitOf(run.terminal));
            else void confirm(entry, run);
        }
    }

    /**
     * Start a build of one main file, or owe one more after the build under way. The recipe is the
     * one asked for, and `force` is set when the asker says so, after a stop or a failure and for a
     * retry.
     */
    async function start(target: LatexTarget, main: string, ask: Ask): Promise<TerminalAnswer> {
        if (emptyTarget(target)) return { ok: false, id: '', error: '' };
        if (ask.reader && ask.retry !== true) await deps.saveAll();
        const entry = entryOf(target, main);
        const under = entry.run;
        if (under !== null && underway(under)) {
            under.again = true;
            if (under.terminal === null) return under.asked;
            return { ok: true, id: under.terminal, error: '' };
        }
        const after = entry.build.status;
        const force =
            ask.force === true || ask.retry === true || after === 'failed' || after === 'stopped';
        const asked = deps.terminals
            .latex(target, main, 'build', { recipe: ask.recipe, last, force })
            .catch(failedRequest);
        const run: Run = {
            step: 'build',
            asked,
            terminal: null,
            running: false,
            asking: false,
            again: ask.again === true,
            retry: ask.retry === true,
            reader: ask.reader
        };
        entry.run = run;
        entry.stopped = false;
        entry.started = now();
        setBuild(entry, {
            status: 'building',
            recipe: ask.recipe ?? entry.build.recipe,
            step: 'build',
            at: entry.started,
            reason: '',
            terminal: ''
        });
        const answer = await asked;
        if (!answer.ok || answer.id === '') {
            if (entry.run === run) {
                entry.run = null;
                setBuild(entry, { status: 'failed', at: now(), reason: answer.error });
                noticeFailure(entry, ask.reader, answer.error, '');
            }
            return answer;
        }
        if (answer.recipe !== undefined && answer.recipe !== '') {
            last = answer.recipe;
            setBuild(entry, { recipe: answer.recipe });
        }
        attach(entry, run, answer);
        return answer;
    }

    function run(
        target: LatexTarget,
        main: string,
        ask: LatexBuildAsk = {}
    ): Promise<TerminalAnswer> {
        return start(target, main, { recipe: ask.recipe, force: ask.force, reader: true });
    }

    async function build(target: LatexTarget, main: string): Promise<void> {
        await start(target, main, { reader: false });
    }

    async function stop(target: LatexTarget, main: string): Promise<TerminalAnswer> {
        const entry = entries.get(placeOfTarget(target, main));
        const running = entry?.run ?? null;
        if (entry !== undefined && running !== null) entry.stopped = true;
        const answer = await deps.terminals.latex(target, main, 'stop');
        if (!answer.ok && entry?.run === running) entry.stopped = false;
        return answer;
    }

    async function savingQuietly(
        root: string,
        path: string,
        save: () => Promise<void>
    ): Promise<void> {
        const key = `${root}\n${path}`;
        quiet.add(key);
        try {
            await save();
        } finally {
            quiet.delete(key);
            for (const entry of entries.values()) {
                if ('root' in entry.target && entry.target.root === root) {
                    entry.quietUntil = now() + QUIET_MS;
                }
            }
        }
    }

    function log(target: LatexTarget, main: string): boolean {
        const terminal = buildOf(target, main).terminal;
        if (terminal === '') return false;
        deps.openLog(terminal);
        return true;
    }

    /** Build after a change on disk, at most once per `latex.auto_build_interval_ms`. */
    function schedule(entry: Entry): void {
        if (entry.timer !== null) return;
        const interval = deps.settings()?.autoBuildIntervalMs ?? 0;
        const wait = Math.max(0, entry.started + interval - now());
        entry.timer = setTimeout(() => {
            entry.timer = null;
            void build(entry.target, entry.main);
        }, wait);
    }

    /**
     * Ask for the dependencies of one followed root. The first answer is the baseline and builds
     * nothing; a later one with any file written after the time held asks for a build.
     */
    async function poll(entry: Entry): Promise<void> {
        const target = entry.target;
        if (!('root' in target) || deps.settings()?.autoBuild !== 'on_file_change') return;
        if (entry.polling) {
            entry.again = true;
            return;
        }
        entry.polling = true;
        try {
            const found = await deps.calls.dependencies(
                target.root,
                joinPath(target.path, entry.main)
            );
            if (found === null || entry.follows === 0) return;
            const before = now() < entry.quietUntil ? null : entry.times;
            entry.times = found.files;
            if (before === null) return;
            const changed = [...found.files].some(
                ([file, time]) => time > (before.get(file) ?? Number.NEGATIVE_INFINITY)
            );
            if (changed) schedule(entry);
        } finally {
            entry.polling = false;
            if (entry.again) {
                entry.again = false;
                void poll(entry);
            }
        }
    }

    function follow(root: string, path: string, main: string): () => void {
        const entry = entryOf({ root, path }, main);
        entry.follows += 1;
        void poll(entry);
        let released = false;
        return () => {
            if (released) return;
            released = true;
            entry.follows -= 1;
            if (entry.follows > 0) return;
            entry.times = null;
            if (entry.timer !== null) clearTimeout(entry.timer);
            entry.timer = null;
        };
    }

    function filesMoved(concerned: (root: string, dir: string, files: string[]) => boolean): void {
        for (const entry of entries.values()) {
            const target = entry.target;
            if (entry.follows === 0 || !('root' in target)) continue;
            if (concerned(target.root, target.path, [...(entry.times?.keys() ?? [])])) {
                void poll(entry);
            }
        }
    }

    function onBuilt(listener: BuiltListener): () => void {
        listeners.add(listener);
        return () => listeners.delete(listener);
    }

    async function onSaved(root: string, path: string): Promise<void> {
        if (!isLatexFile(path)) return;
        const settings = deps.settings();
        if (settings === null) return;
        const key = `${root}\n${path}`;
        const builds = settings.autoBuild === 'on_save' && !quiet.has(key);
        const counts = settings.texcountAutorun === 'on_save';
        if (!builds && !counts) return;
        const mine = (saves.get(key) ?? 0) + 1;
        saves.set(key, mine);
        const found = await deps.calls.rootOf(root, path);
        if (found === null || saves.get(key) !== mine) return;
        const target = { root: found.root, path: found.path };
        if (counts) void deps.count(target, found.main);
        if (builds) await build(target, found.main);
    }

    return {
        buildOf,
        building,
        running,
        run,
        build,
        stop,
        savingQuietly,
        log,
        follow,
        onBuilt,
        onSaved,
        sessionsMoved,
        filesMoved
    };
}
