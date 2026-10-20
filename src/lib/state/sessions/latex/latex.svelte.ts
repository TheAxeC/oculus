// Layer 2, client state. The LaTeX state of a folder: its main files, what the last build left
// beside each, the errors and warnings of that build, the outline and the word count of a main
// file, the main file a source file builds through, and the builds of those roots, which are
// builds.ts's.
//
// A folder is a project, whose main files sit in its `manuscript/` folder, or any folder of a
// served root (state/sessions/terminal/latex-target.ts); each is held under its own query key, so a
// project and a folder whose names match never share one. It is state/sources/files.svelte.ts's
// shape over a different endpoint, and for the same reason: the wire model keeps a folder read out
// of the snapshot, so a board of fifty projects carries none of it and an open tab asks api/latex
// for its own. Every path the page holds is against the root (latex-state.ts).
//
// The answer is held in the client state's query client (state/client/queries/queries.svelte.ts).
// What makes it stale is a build ending, which builds.ts hears, or a `files` message for the
// folder. watch() is told the terminal one press or one save started and every held folder is
// marked, and asked for again, on every `sessions` push until that terminal has ended (a tab the
// pane hides asks once when it is shown). The push that finds it ended is the one whose answer
// carries the new PDF, and the watch ends there, so an idle tab asks for nothing. A push that comes
// while a request is out marks the state again once that request lands, so an answer fetched before
// the list moved is never the last one. A folder is marked as a whole, not only the target that was
// watched, because a build of a project's manuscript changes what a view over the same folder holds
// as well.
//
// A PDF whose time moved is bumped in the fs store, which moves the address the file view draws it
// at: an open PDF viewer then fetches the new build instead of the bytes the browser cached. The
// answer says how the build of each main came to (`LatexMain.build`, read by the server from the
// kept build terminal, so every page reads the same): a PDF written by a build that is running,
// failed or was stopped is not bumped, since latexmk may write one the build did not stand
// behind, and the answer that finds the build ended well bumps it. A PDF no oculus build wrote is
// bumped unless its log holds errors. Every held folder is read again on a `sessions` push while a
// build of it runs in any page. The main file's row says `building` while its build is under way
// (`LatexMain.building`), whichever folder form the row was read by, since the span is kept per
// main file of a folder of a root and not per form.

import type { LatexApproval, Message } from '../../../data/model/index.ts';
import { joinPath } from '../../../data/helpers/files/paths.ts';
import type { LatexBuilding } from '../../../data/sources/config/settings/latex.ts';
import { latexBuild } from '../../../data/sources/config/settings/latex.ts';
import {
    readLatexEditing,
    readLatexUnimath,
    type LatexEditing,
    type UnimathSymbol
} from '../../../data/sources/config/catalog/latex-tables.ts';
import { readAs, readJson } from '../../../data/shapes/shapes.ts';
import { filesNamed, folderNamed } from '../../shared/answers/files-named.ts';
import { failedAnswer } from '../../shared/answers/answers.ts';
import type { EntitiesStore, Queries, WritesStore } from '../../shared/stores/shapes.ts';
import type { FsStore } from '../../sources/fs.svelte.ts';
import { emptyTarget, targetKey, type LatexTarget } from '../terminal/latex-target.ts';
import { servesRoot } from '../../sources/fs-transport.ts';
import { t } from '../../shared/words/text.ts';
import type { TerminalAnswer } from '../terminal/pty/pty-io.ts';
import type { LatexBuildAsk, LatexStep, TerminalsStore } from '../terminals.svelte.ts';
import { createBuilds, type BuildsStore } from './builds.ts';
import { createCalls, type LatexCalls } from './calls.ts';
import {
    NO_BODY,
    NOTHING,
    OUTLINE_NOTHING,
    OUTLINE_PENDING,
    PENDING,
    against,
    bodyShape,
    countBodyShape,
    outlineBodyShape,
    queryOf,
    placeOf,
    stateOf,
    type LatexCount,
    type LatexDiagnostic,
    type LatexNotices,
    type LatexOutline,
    type LatexState
} from './latex-state.ts';

/** What the store asks of the rest of the page that the stores it is built from do not hold. */
export type LatexHooks = {
    notices: LatexNotices;
    /** Save every unsaved source tab, which a build the reader asks for does first. */
    saveAll: () => Promise<void>;
    /** Show a build's terminal as the compiler log. */
    openLog: (terminal: string) => void;
    /** Show the Problems view limited to the root of the target. */
    showProblems: (target: LatexTarget) => void;
    /** Run a build or clean terminal again, or restart it, as its Rerun or Restart does. */
    again: (terminal: string, restart: boolean) => Promise<TerminalAnswer>;
};

/** The question of an approval: the main file it is about and what is to be approved. */
type LatexApproving = {
    target: LatexTarget;
    main: string;
    /** What the step waits on, or null when a refusal left nothing to approve. */
    approval: LatexApproval | null;
    /** The sentence of the refusal the last approval met, or the empty string. */
    message: string;
};

/** One folder's LaTeX state per target, and what is asked of a main file of one. */
export type LatexStore = Omit<
    BuildsStore,
    | 'run'
    | 'build'
    | 'clean'
    | 'approve'
    | 'building'
    | 'sessionsMoved'
    | 'settingsMoved'
    | 'filesMoved'
    | 'holdRerun'
    | 'cancel'
> &
    LatexCalls & {
        state: (target: LatexTarget) => LatexState;
        /**
         * Watch the terminal one build or clean started, so the state is read again when it ends.
         */
        watch: (target: LatexTarget, terminal: string) => void;
        /**
         * Start one step on a main file: a build (which saves the unsaved tabs first, and is owed
         * once more when a build of the main is under way), a clean, a checkcites or a stop. The
         * answer is the terminal's or the server's refusal.
         */
        run: (
            target: LatexTarget,
            main: string,
            step: LatexStep,
            ask?: LatexBuildAsk
        ) => Promise<TerminalAnswer>;
        /**
         * The question that asks the reader to approve what a main file's step waits on: the files
         * and weave tools to approve, or null approval with the sentence of a refusal that leaves
         * nothing to approve. Null while no question is open.
         */
        approving: () => LatexApproving | null;
        /** Open the question for the approval a main file's step waits on. */
        askApproval: (target: LatexTarget, main: string) => void;
        /** Approve what the open question lists and run the waiting step once. */
        approve: () => Promise<void>;
        /** Close the question without approving. */
        dismissApproval: () => void;
        /**
         * Hold what a Rerun or a Restart of a LaTeX build or clean terminal waits on and open the
         * question; approving runs the terminal again.
         */
        holdAgain: (terminal: string, approval: LatexApproval, restart: boolean) => void;
        invalidate: (target: LatexTarget) => void;
        /**
         * Forget the folder states and the outlines of every target whose root is none of the
         * roots, which are the served roots after a change, so the diagnostics of a root that is no
         * longer served leave with it. A project whose state names no root is kept.
         */
        forgetOutside: (roots: { key: string }[]) => void;
        /**
         * Read a target's state again when it is shown next: a view or a panel opening on a folder
         * calls it, so the files that changed while nothing watched the folder are read. A target
         * with nothing held is read for the first time anyway.
         */
        reread: (target: LatexTarget) => void;
        /**
         * The sections of a main file, followed through its includes. Asked for on the first read
         * and again once a build has changed the main file's log.
         */
        outline: (target: LatexTarget, main: string) => LatexOutline;
        /** Count the words of a main file; the number is held in the state until the next build. */
        count: (target: LatexTarget, main: string) => Promise<LatexCount>;
        /** The problems of the latest build of every folder held, as one list. */
        latexDiagnostics: () => LatexDiagnostic[];
        /** What a build and its follow-ups are set by, or null while the page holds no catalog. */
        settings: () => LatexBuilding | null;
        /** The names of the recipes a build can run, in the configuration's order. */
        recipes: () => string[];
        /** The editing tables of config/catalogs/latex.yml: `@` suggestions, chords, symbols. */
        editing: () => LatexEditing;
        /** The Unicode math symbols of config/catalogs/unimath.yml. */
        unimath: () => UnimathSymbol[];
        /** Show one task terminal, a step's output, in the terminals view. */
        showTerminal: (terminal: string) => void;
    };

/** What every folder's query key opens with. */
const KIND = 'latex';

/** What the query key of a main file's outline opens with, apart from the folders' own. */
const OUTLINES = 'latex-outline';

export function createLatex(
    entities: EntitiesStore,
    terminals: TerminalsStore,
    fs: FsStore,
    queries: Queries,
    writes: WritesStore,
    hooks: LatexHooks
): LatexStore {
    const calls = createCalls(writes, (root) => served(root));

    /** The terminal each target is waiting on, by the target's key. */
    const waiting = new Map<string, { target: LatexTarget; terminal: string }>();

    /** The time of the PDF each main file's viewers were last bumped for, by the main's place. */
    const drawn = new Map<string, number | null>();

    /** The newest count asked for each main file, so an answer to an older one is dropped. */
    const counts = new Map<string, number>();

    /** The version of the last `sessions` message heard, or null before the first. */
    let heard: number | null = null;

    /** The version of the last `files` message heard, or null before the first. */
    let filesHeard: number | null = null;

    /** The targets answered as unserved without a request, by key, read again once served. */
    const unservedTargets = new Map<string, LatexTarget>();

    /** Whether the workspace serves a root; a workspace not read yet serves every root. */
    const served = (root: string): boolean => servesRoot(fs.workspaces(), root);

    /** The root of a held state, from the state or else from its key; '' for a project's. */
    function rootOfHeld(key: readonly unknown[], data: LatexState | undefined): string {
        const named = data?.root ?? '';
        return named !== '' ? named : key[1] === 'folder' ? String(key[2]) : '';
    }

    /** Moves whenever a state lands or goes, which is what makes the diagnostics redraw. */
    let landed = $state(0);

    /** The count of states that landed or went; reading it makes the reader depend on it. */
    function landings(): number {
        return landed;
    }

    function touched(): void {
        landed += 1;
    }

    function settings(): LatexBuilding | null {
        try {
            return latexBuild(entities.config()?.config ?? {});
        } catch {
            return null;
        }
    }

    const builds = createBuilds({
        terminals,
        calls,
        settings,
        held: (target) => queries.peek<LatexState>([KIND, ...targetKey(target)]).data,
        saveAll: hooks.saveAll,
        notify: (message, tone, actions) => hooks.notices.post(message, { tone, actions }),
        reload: (target) => {
            queries.refetch<LatexState>(
                [KIND, ...targetKey(target)],
                (held) => load(target, held),
                'again'
            );
        },
        watch,
        count: (target, main) => count(target, main),
        openLog: hooks.openLog,
        showProblems: hooks.showProblems,
        openAsk: (target, main) => askApproval(target, main),
        again: hooks.again,
        touched,
        landings
    });

    entities.afterReceive((message) => {
        if (message.channel === 'files') {
            filesMoved(message);
            return;
        }
        // A save made before the settings came is built once a configuration brings them.
        if (message.channel === 'config') {
            builds.settingsMoved();
            return;
        }
        if (message.channel !== 'sessions' || message.version === heard) return;
        heard = message.version;
        if (waiting.size > 0) queries.mark([KIND], 'wait');
        // A build another page started ends in this list too, and the state it ended is read again.
        for (const one of queries.entries<LatexState>([KIND])) {
            if (!served(rootOfHeld(one.key, one.data))) continue;
            if (one.data?.mains.some((main) => main.build === 'running') === true) {
                queries.mark(one.key, 'again');
            }
        }
        builds.sessionsMoved();
    });

    /**
     * Whether a `files` message can concern a folder: the folder, which is the directory of its
     * root joined with its own, is named by the message (or the message names no folders and its
     * root holds it), or a file the folder's main depends on is in a folder the message names. A
     * folder of a root the page has no directory for yet cannot be placed, so it is concerned while
     * the workspace is being read; a root the workspace read does not serve concerns nothing, so a
     * tab of a root that left asks nothing of it.
     */
    function concerns(
        key: string,
        dir: string,
        root: string,
        folders: string[] | undefined,
        files: string[] = []
    ): boolean {
        const base = fs.roots().find((one) => one.key === key);
        if (base === undefined) return served(key);
        if (folderNamed(root, folders, joinPath(base.dir, dir))) return true;
        return files.some((file) => filesNamed(root, folders, joinPath(base.dir, file)));
    }

    /**
     * Mark every held folder state a `files` message concerns, so a shown one is read again, and
     * ask for the dependencies of every followed root it concerns: a gap in the versions concerns
     * everything, a message that names no root (the bookmarks') nothing.
     */
    function filesMoved(message: Message): void {
        if (filesHeard === message.version) return;
        const gap = filesHeard === null || message.version !== filesHeard + 1;
        filesHeard = message.version;
        const payload = entities.payloadOf(message, 'files');
        const root = payload?.root ?? '';
        const folders = payload?.folders;
        if (root === '' && !gap) return;
        for (const one of queries.entries<LatexState>([KIND])) {
            if (!served(rootOfHeld(one.key, one.data))) continue;
            if (
                gap ||
                one.data === undefined ||
                concerns(one.data.root, one.data.dir, root, folders)
            ) {
                queries.mark(one.key, 'again');
            }
        }
        builds.filesMoved(
            (key, dir, files) => (gap && served(key)) || concerns(key, dir, root, folders, files)
        );
    }

    /** Whether one terminal is in the last `sessions` payload's list, its line running. */
    function live(terminal: string): boolean {
        return terminals.terminals().some((one) => one.id === terminal && one.exit === null);
    }

    /**
     * One target's LaTeX state. The first call for a target asks the server; later calls read it.
     */
    function state(target: LatexTarget): LatexState {
        if (emptyTarget(target)) return NOTHING;
        // There is no fetch while the page is rendered on the server, and nothing to show there
        // either: the target stays pending and the browser asks for it on the first client render.
        const { data } = queries.read<LatexState>(
            [KIND, ...targetKey(target)],
            (held) => load(target, held),
            { enabled: typeof fetch === 'function' }
        );
        return data === undefined ? PENDING : withBuilding(data);
    }

    /** A state with each main file marked `building` while a build of it is asked for or runs. */
    function withBuilding(data: LatexState): LatexState {
        // Read first so the caller redraws when a build starts or ends.
        void landings();
        const mains = data.mains.map((main) => {
            const on = builds.building(data.root, data.dir, main.main);
            return on === main.building ? main : { ...main, building: on };
        });
        return mains.some((main, at) => main !== data.mains[at]) ? { ...data, mains } : data;
    }

    /**
     * Wait on one terminal, and ask again at once so the row says a build is under way; a hidden
     * tab asks when it is shown.
     */
    function watch(target: LatexTarget, terminal: string): void {
        if (emptyTarget(target) || terminal === '') return;
        waiting.set(targetKey(target).join('\n'), { target, terminal });
        queries.mark([KIND, ...targetKey(target)], 'wait');
    }

    function reread(target: LatexTarget): void {
        if (emptyTarget(target)) return;
        const key = [KIND, ...targetKey(target)];
        if (queries.peek<LatexState>(key).data !== undefined) queries.mark(key, 'again');
    }

    /** Forget what is held for one target, so the next call for it fetches again. */
    function invalidate(target: LatexTarget): void {
        queries.forget([KIND, ...targetKey(target)]);
        queries.forget([OUTLINES, ...targetKey(target)]);
        touched();
    }

    function forgetOutside(roots: { key: string }[]): void {
        let any = false;
        // A target answered as unserved is read again once its root is served again.
        for (const [named, target] of unservedTargets) {
            if (!('root' in target) || !roots.some((one) => one.key === target.root)) continue;
            unservedTargets.delete(named);
            queries.forget([KIND, ...targetKey(target)]);
            queries.forget([OUTLINES, ...targetKey(target)]);
            any = true;
        }
        for (const { key, data } of queries.entries<LatexState>([KIND])) {
            const root = rootOfHeld(key, data);
            if (root === '' || roots.some((one) => one.key === root)) continue;
            const target = key.slice(1).map(String);
            queries.forget([KIND, ...target]);
            queries.forget([OUTLINES, ...target]);
            waiting.delete(target.join('\n'));
            any = true;
        }
        if (any) touched();
    }

    async function load(target: LatexTarget, held: LatexState | undefined): Promise<LatexState> {
        try {
            if ('root' in target && !served(target.root)) {
                unservedTargets.set(targetKey(target).join('\n'), target);
                return { ...PENDING, error: t('latex.unserved', target.root), loading: false };
            }
            const response = await fetch(`/api/latex?${queryOf(target)}`);
            const raw = await readJson(response);
            if (raw === undefined || !response.ok) {
                return { ...PENDING, error: failedAnswer(response, raw), loading: false };
            }
            const body = readAs(bodyShape, raw) ?? NO_BODY;
            const next = carried(held, stateOf(target, body));
            redraw(next);
            builtAgain(target, held, next);
            return next;
        } catch (error) {
            const reason = error instanceof Error ? error.message : String(error);
            return { ...PENDING, error: reason, loading: false };
        } finally {
            settle(target);
            touched();
        }
    }

    /** The counts of the state held now, for the mains the new answer shows unbuilt since. */
    function carried(before: LatexState | undefined, next: LatexState): LatexState {
        if (before === undefined) return next;
        const mains = next.mains.map((main) => {
            const was = before.mains.find((one) => one.main === main.main);
            return was?.log === main.log ? { ...main, words: was.words } : main;
        });
        return { ...next, mains };
    }

    /** Mark the outline of every main file whose log moved, so its next read asks again. */
    function builtAgain(
        target: LatexTarget,
        before: LatexState | undefined,
        next: LatexState
    ): void {
        if (before === undefined) return;
        for (const main of next.mains) {
            const was = before.mains.find((one) => one.main === main.main);
            if (was === undefined || was.log === main.log) continue;
            queries.mark([OUTLINES, ...targetKey(target), main.main], 'again');
        }
    }

    /**
     * Stop waiting once the terminal has ended. An answer fetched before the list moved is one
     * build behind, and the push that moved the list marked the state again for when that answer
     * landed, so the next read asks for the build's own.
     */
    function settle(target: LatexTarget): void {
        const key = targetKey(target).join('\n');
        const one = waiting.get(key);
        if (one === undefined || live(one.terminal)) return;
        waiting.delete(key);
    }

    /**
     * Bump every PDF whose time moved since the last bump, which is what makes an open viewer draw
     * the new build. The server's answer says how the build that wrote the PDF came to, the same
     * for every page: a PDF that a build is still writing, or that a build which failed or was
     * stopped wrote, keeps the PDF the viewers show, and the next answer that finds the build
     * ended well bumps it. A PDF no oculus build wrote is shown unless its log holds errors.
     */
    function redraw(next: LatexState): void {
        if (next.root === '') return;
        for (const main of next.mains) {
            const place = placeOf(next.root, next.dir, main.main);
            if (!drawn.has(place)) {
                drawn.set(place, main.pdf);
                continue;
            }
            if (drawn.get(place) === main.pdf) continue;
            if (main.build === 'running' || main.build === 'failed') continue;
            if (main.build === 'none' && main.errors.length > 0) continue;
            drawn.set(place, main.pdf);
            fs.bump(next.root, main.pdfPath);
        }
    }

    /**
     * The answer of a GET over a target with one more parameter: its body when it succeeded, else
     * the reason it did not, the sentence `failedAnswer` tells a failed read in or what the request
     * threw.
     */
    async function ask(
        target: LatexTarget,
        extra: string
    ): Promise<{ body: unknown } | { reason: string }> {
        if ('root' in target && !served(target.root)) {
            unservedTargets.set(targetKey(target).join('\n'), target);
            return { reason: t('latex.unserved', target.root) };
        }
        try {
            const response = await fetch(`/api/latex?${queryOf(target)}&${extra}`);
            const raw = await readJson(response);
            if (response.ok) return { body: raw };
            return { reason: failedAnswer(response, raw) };
        } catch (error) {
            return { reason: error instanceof Error ? error.message : String(error) };
        }
    }

    function outline(target: LatexTarget, main: string): LatexOutline {
        if (emptyTarget(target)) return OUTLINE_NOTHING;
        const { data } = queries.read<LatexOutline>(
            [OUTLINES, ...targetKey(target), main],
            () => loadOutline(target, main),
            { enabled: typeof fetch === 'function' }
        );
        return data ?? OUTLINE_PENDING;
    }

    async function loadOutline(target: LatexTarget, main: string): Promise<LatexOutline> {
        const answer = await ask(target, `outline=${encodeURIComponent(main)}`);
        const body = 'body' in answer ? readAs(outlineBodyShape, answer.body) : null;
        if (body === null) {
            const error = 'reason' in answer ? answer.reason : '';
            return { ...OUTLINE_NOTHING, error };
        }
        // A project's files are against its folder, a folder's against its root.
        const placed = (file: string): string =>
            'id' in target ? against(body.folder, file) : file;
        return {
            sections: body.sections.map((one) => ({ ...one, file: placed(one.file) })),
            labels: body.labels.map((one) => ({ ...one, file: placed(one.file) })),
            floats: body.floats.map((one) => ({ ...one, file: placed(one.file) })),
            partial: body.partial.map(placed),
            unread: body.unread.map(placed),
            error: '',
            loading: false
        };
    }

    async function count(target: LatexTarget, main: string): Promise<LatexCount> {
        const key = [...targetKey(target), main].join('\n');
        const mine = (counts.get(key) ?? 0) + 1;
        counts.set(key, mine);
        const answer = await ask(target, `count=${encodeURIComponent(main)}`);
        const body = 'body' in answer ? readAs(countBodyShape, answer.body) : null;
        const counted: LatexCount = {
            words: body?.words ?? null,
            error: 'reason' in answer ? answer.reason : ''
        };
        if (counts.get(key) !== mine || counted.words === null) return counted;
        const queryKey = [KIND, ...targetKey(target)];
        const held = queries.peek<LatexState>(queryKey).data;
        if (held === undefined) return counted;
        const mains = held.mains.map((one) =>
            one.main === main ? { ...one, words: counted.words } : one
        );
        queries.hold(queryKey, { ...held, mains });
        touched();
        return counted;
    }

    /**
     * Start one step on a main file. A build goes through the builds (which watch their own
     * terminal), a stop interrupts the kept build terminal, and a clean or a citation check is a
     * terminal of its own that is watched until it ends.
     */
    async function run(
        target: LatexTarget,
        main: string,
        step: LatexStep,
        options: LatexBuildAsk = {}
    ): Promise<TerminalAnswer> {
        if (step === 'build') return builds.run(target, main, options);
        if (step === 'stop') return builds.stop(target, main);
        const answer =
            step === 'clean'
                ? await builds.clean(target, main)
                : await terminals.latex(target, main, step);
        if (answer.ok && answer.id !== '') watch(target, answer.id);
        return answer;
    }

    /** The question open on an approval: the main file and the sentence of the last refusal. */
    let asking = $state<{ target: LatexTarget; main: string; message: string } | null>(null);

    function askApproval(target: LatexTarget, main: string): void {
        asking = { target, main, message: '' };
    }

    function approving(): LatexApproving | null {
        const open = asking;
        if (open === null) return null;
        const approval = builds.buildOf(open.target, open.main).approval;
        if (approval === null && open.message === '') return null;
        return { ...open, approval };
    }

    /** Whether the open question is about the main file `open` was, which asking again reopens. */
    function sameAsk(open: NonNullable<typeof asking>): boolean {
        return (
            asking !== null &&
            asking.main === open.main &&
            targetKey(asking.target).join('\n') === targetKey(open.target).join('\n')
        );
    }

    async function approve(): Promise<void> {
        const open = asking;
        if (open === null) return;
        const answer = await builds.approve(open.target, open.main);
        // A step asked again opens the question afresh, which is the same question.
        if (!sameAsk(open)) return;
        const waits = builds.buildOf(open.target, open.main).approval !== null;
        if (answer.ok && answer.id !== '') watch(open.target, answer.id);
        const refused = !answer.ok && answer.error !== '';
        asking = waits || refused ? { ...open, message: answer.error } : null;
    }

    function dismissApproval(): void {
        if (asking !== null) builds.cancel(asking.target, asking.main);
        asking = null;
    }

    function holdAgain(terminal: string, approval: LatexApproval, restart: boolean): void {
        const kept = terminals.terminalById(terminal)?.job?.latex;
        if (kept?.target === undefined) return;
        builds.holdRerun(kept.target, approval, { terminal, restart }, kept.recipe ?? '');
    }

    function latexDiagnostics(): LatexDiagnostic[] {
        // Read first so the caller redraws when a state lands or goes.
        void landings();
        const found: LatexDiagnostic[] = [];
        const seen = new Set<string>();
        for (const { data } of queries.entries<LatexState>([KIND])) {
            if (data === undefined || data.root === '') continue;
            for (const main of data.mains) {
                const issues = [
                    ...main.errors.map((one) => ({ one, severity: 'error' as const })),
                    ...main.warnings.map((one) => ({ one, severity: 'warning' as const }))
                ];
                for (const { one, severity } of issues) {
                    const file = one.file === '' ? against(data.dir, main.main) : one.file;
                    const key = [data.root, file, one.line, severity, one.message].join('\n');
                    if (seen.has(key)) continue;
                    seen.add(key);
                    const base = { root: data.root, file, severity, message: one.message };
                    const line = one.line === null ? {} : { line: one.line };
                    found.push({ ...base, ...line, source: 'latex' });
                }
            }
        }
        return found;
    }

    /** The config the held tables were read from, and the tables. */
    let tabled: { from: unknown; read: LatexEditing } | null = null;

    function editing(): LatexEditing {
        const config = entities.config()?.config;
        if (tabled === null || tabled.from !== config) {
            tabled = { from: config, read: readLatexEditing(config ?? {}).editing };
        }
        return tabled.read;
    }

    /** The config the held symbols were read from, and the symbols. */
    let symbolled: { from: unknown; read: UnimathSymbol[] } | null = null;

    function unimath(): UnimathSymbol[] {
        const config = entities.config()?.config;
        if (symbolled === null || symbolled.from !== config) {
            symbolled = { from: config, read: readLatexUnimath(config ?? {}).symbols };
        }
        return symbolled.read;
    }

    function recipes(): string[] {
        return (settings()?.recipes ?? []).map((one) => one.name);
    }

    return {
        ...calls,
        buildOf: builds.buildOf,
        running: builds.running,
        waiting: builds.waiting,
        approving,
        askApproval,
        approve,
        dismissApproval,
        holdAgain,
        stop: builds.stop,
        log: builds.log,
        savingQuietly: builds.savingQuietly,
        follow: builds.follow,
        onBuilt: builds.onBuilt,
        onSaved: builds.onSaved,
        state,
        watch,
        run,
        invalidate,
        forgetOutside,
        reread,
        outline,
        count,
        latexDiagnostics,
        settings,
        recipes,
        editing,
        unimath,
        showTerminal: hooks.openLog
    };
}
