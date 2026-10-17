// Layer 2, client state. What a reader does with a LaTeX file or the PDF it builds, from wherever
// the reader is: the source tab's bar and keys, the PDF tab's keys and its click, the TeX view and
// the status item. Each takes a root key and a path of a LaTeX source file or of a PDF, finds the
// main file it builds through (the server's root rules, `rootOf` and `rootOfPdf`), and does the one
// thing, so no caller repeats the lookup or the words said when there is nothing to do.
//
// - build, stop and clean run the step on the root's main file through the LaTeX store, which saves
//   the open tabs first, owes a second build to one that is running, and says what failed.
// - viewPdf shows the root's PDF as a `file` tab beside the tab that asked, or activates the one
//   open. The PDF may not be built yet; the file tab says so and offers the build.
// - forward finds where a source line was typeset (SyncTeX) and asks the PDF tab for it: the place
//   is held here under the PDF's address (`revealFor`) until the tab that draws that PDF takes it
//   (`taken`), so a PDF opened by the same press shows it once it has loaded.
// - inverse opens the source line a place of a page of a PDF was typeset from, in a pane other than
//   the PDF's, and a place with no record does nothing.
// - compilerLog shows the terminal of the root's last build, buildLog opens the build's `.log` file
//   as a source tab, count says the words of the root, checkcites runs checkcites on it and shows
//   the terminal, texdoc opens a package's documentation, revealOutput shows the output folder in
//   the Files view, and rootComment is the `% !TEX root` line a file of the root would carry.
// - roots lists the main files `rootOfFile` has found on this page, which the TeX view offers, and
//   texView shows that view beside the Files tab.
//
// An answer that cannot be acted on is said as a notice, with the action that fixes it when there
// is one (a missing SyncTeX file offers the build that writes it).
// An answer that comes after the tab that asked has closed changes nothing, and a forward search
// that a later one superseded draws nothing.

import { SvelteMap } from 'svelte/reactivity';
import { relativePath } from '../../../data/helpers/files/paths.ts';
import { t } from '../../shared/words/text.ts';
import { sourceTabState } from '../source/draft.ts';
import type { Jump, JumpMessage, Message } from '../../../data/model/index.ts';
import type { LatexBuildAsk } from '../terminals.svelte.ts';
import type { LatexStore } from './latex.svelte.ts';
import type { LatexNotices, LatexRoot, SyncPlace } from './latex-state.ts';

/**
 * What the actions ask of the layout: open a view, beside a tab, away from one, or show a folder.
 */
type LatexLayout = {
    openView: (view: string, state?: unknown) => string;
    openBeside: (view: string, state?: unknown, page?: string, asker?: string) => string;
    openAway: (view: string, state: unknown, page: string, avoid: string) => string;
    holding: (id: string) => { id: string } | null;
    showFolderInFiles: (path: string, root: string) => string;
    showTexView: () => string;
};

/** What the actions read of the rest of the page. */
export type LatexActionDeps = {
    latex: Pick<
        LatexStore,
        | 'rootOf'
        | 'rootOfPdf'
        | 'run'
        | 'forward'
        | 'inverse'
        | 'count'
        | 'log'
        | 'texdoc'
        | 'showTerminal'
        | 'savingQuietly'
    >;
    layout: LatexLayout;
    notices: LatexNotices;
    /** The float this page draws alone in a window of its own, or null for a main page. */
    float: string | null;
    /** The id of this page when it is a main page. */
    pageId: string;
    /** The id of the main page that opened this page's window, or null for a main page. */
    owner: string | null;
    /** The socket: write a message, and hear the messages of a channel. */
    socket: {
        send: (message: unknown) => boolean;
        listen: (channel: string, fn: (message: Message) => void) => () => void;
    };
    /** The place a `jump` message carries, or null when the message does not read as one. */
    jumpOf: (message: Message) => Jump | null;
    /** Whether the main page with this id is still open. */
    ownerOpen: (id: string) => Promise<boolean>;
    /** Bring this page's window to the front where the host allows it. */
    focus: () => void;
};

/** The actions of a LaTeX file and of its PDF. */
export type LatexActions = {
    /** The root a LaTeX source file or a PDF belongs to, or null when it has none. */
    rootOfFile: (root: string, file: string) => Promise<LatexRoot>;
    /** Build the root of a file; `ask` may name a recipe. */
    build: (root: string, file: string, ask?: LatexBuildAsk) => Promise<void>;
    /** Interrupt the build of the root of a file. */
    stop: (root: string, file: string) => Promise<void>;
    /** Remove what the build of the root of a file left, keeping the PDF. */
    clean: (root: string, file: string) => Promise<void>;
    /** Show the PDF of the root of a file, beside `asker` when it is a tab that is open. */
    viewPdf: (root: string, file: string, asker?: string) => Promise<void>;
    /** Show where a line of a source file was typeset in its PDF. */
    forward: (
        root: string,
        file: string,
        line: number,
        column: number,
        asker: string
    ) => Promise<void>;
    /** Open the source line a place of a page of a PDF came from. */
    inverse: (
        root: string,
        pdf: string,
        page: number,
        x: number,
        y: number,
        from: string
    ) => Promise<void>;
    /** The place a forward search asked a PDF to show, until the tab that draws it takes it. */
    revealFor: (root: string, pdf: string) => SyncPlace | null;
    /** Take the place a forward search asked a PDF to show. */
    taken: (root: string, pdf: string) => void;
    /** Show the terminal of the last build of the root of a file as the compiler log. */
    compilerLog: (root: string, file: string) => Promise<void>;
    /** Open the log file of the build of the root of a file as a source tab. */
    buildLog: (root: string, file: string) => Promise<void>;
    /** Count the words of the root of a file and say the number. */
    count: (root: string, file: string) => Promise<void>;
    /** Run checkcites on the root of a file and show its terminal. */
    checkcites: (root: string, file: string) => Promise<void>;
    /** Open the documentation of a package. */
    texdoc: (name: string) => Promise<void>;
    /** Show the output folder of the root of a file in the Files view. */
    revealOutput: (root: string, file: string) => Promise<void>;
    /** Save with `save` without the build a save asks for. */
    saveWithoutBuilding: (root: string, file: string, save: () => Promise<void>) => Promise<void>;
    /** The `% !TEX root = <path>` line a file of the root carries, or null when it has no root. */
    rootComment: (root: string, file: string) => Promise<string | null>;
    /** The main files found on this page so far, in the order they were found. */
    roots: () => NonNullable<LatexRoot>[];
    /** Show the TeX view in the pane that holds the Files tab. */
    texView: () => void;
    /** Say a sentence to the reader as a notice. */
    say: (message: string, error?: boolean) => void;
};

/** The key a PDF is held under. */
function keyOf(root: string, pdf: string): string {
    return JSON.stringify([root, pdf]);
}

export function createLatexActions(deps: LatexActionDeps): LatexActions {
    const { latex, layout, notices, float, pageId, owner, socket, jumpOf, ownerOpen, focus } = deps;

    /** The place each PDF was last asked to show, by its key. */
    const reveals = new SvelteMap<string, SyncPlace>();

    /** The main files found so far, by their place. */
    const seen = new SvelteMap<string, NonNullable<LatexRoot>>();

    /** The number of the newest forward search, so the answer of an earlier one draws nothing. */
    let newestForward = 0;

    /** Whether the tab that asked has closed, so that its answer changes nothing. */
    function gone(asker: string | undefined): boolean {
        return asker !== undefined && asker !== '' && layout.holding(asker) === null;
    }

    function say(message: string, error = false): void {
        notices.post(message, { tone: error ? 'error' : 'warning' });
    }

    async function rootOfFile(root: string, file: string): Promise<LatexRoot> {
        const found = file.toLowerCase().endsWith('.pdf')
            ? await latex.rootOfPdf(root, file)
            : await latex.rootOf(root, file);
        if (found !== null) seen.set(keyOf(found.root, `${found.path}/${found.main}`), found);
        return found;
    }

    /** The root of a file, or a notice that there is none. */
    async function rooted(root: string, file: string): Promise<LatexRoot> {
        const found = await rootOfFile(root, file);
        if (found === null) say(t('latex.no_main', file));
        return found;
    }

    async function build(root: string, file: string, ask: LatexBuildAsk = {}): Promise<void> {
        const found = await rooted(root, file);
        if (found === null) return;
        await latex.run({ root: found.root, path: found.path }, found.main, 'build', ask);
    }

    async function stop(root: string, file: string): Promise<void> {
        const found = await rooted(root, file);
        if (found === null) return;
        await latex.run({ root: found.root, path: found.path }, found.main, 'stop');
    }

    async function clean(root: string, file: string): Promise<void> {
        const found = await rooted(root, file);
        if (found === null) return;
        const answer = await latex.run({ root: found.root, path: found.path }, found.main, 'clean');
        if (!answer.ok && answer.error !== '') say(answer.error, true);
    }

    /** Open the PDF of a root as a tab, beside the asker when one is given. */
    function showPdf(found: NonNullable<LatexRoot>, asker?: string): string {
        const state = { root: found.root, path: found.pdf, label: found.pdf.split('/').at(-1) };
        return asker === undefined
            ? layout.openBeside('file', state)
            : layout.openBeside('file', state, undefined, asker);
    }

    async function viewPdf(root: string, file: string, asker?: string): Promise<void> {
        const found = await rooted(root, file);
        if (found === null || found.pdf === '' || gone(asker)) return;
        showPdf(found, asker);
    }

    async function forward(
        root: string,
        file: string,
        line: number,
        column: number,
        asker: string
    ): Promise<void> {
        const mine = (newestForward += 1);
        const found = await rooted(root, file);
        if (found === null || mine !== newestForward || gone(asker)) return;
        const answer = await latex.forward(root, file, line, column);
        if (mine !== newestForward || gone(asker)) return;
        if (answer.unbuilt) {
            notices.post(answer.error, {
                tone: 'warning',
                actions: [
                    {
                        label: t('latex.build'),
                        run: () => void build(root, file, { force: true })
                    }
                ]
            });
            return;
        }
        if (answer.error !== '') {
            say(answer.error, true);
            return;
        }
        const place = answer.places.at(0);
        if (place === undefined) {
            say(t('latex.no_records'));
            return;
        }
        reveals.set(keyOf(found.root, found.pdf), place);
        showPdf(found, asker);
    }

    async function inverse(
        root: string,
        pdf: string,
        page: number,
        x: number,
        y: number,
        from: string
    ): Promise<void> {
        const answer = await latex.inverse(root, pdf, page, x, y);
        if (gone(from)) return;
        if (answer.error !== '') {
            say(answer.error, true);
            return;
        }
        const source = answer.source;
        if (source === null) return;
        if (float !== null) {
            // A window of its own has no page of the main window to open a tab in, so the main
            // page that opened it is asked over the server's socket, by its id. A page that has
            // closed answers nothing, so the notice is said instead of a jump no page hears.
            const place: JumpMessage = { type: 'jump', owner: owner ?? '', root, ...source };
            if (owner === null || !(await ownerOpen(owner)) || !socket.send(place)) {
                say(t('latex.jump_failed'), true);
            }
            return;
        }
        const state = sourceTabState(root, source.file, source.line, source.column);
        const host = layout.holding(from);
        if (host === null) layout.openView('source', state);
        else layout.openAway('source', state, host.id, from);
    }

    // The main page that opened a window of its own opens the source that window asked for; the
    // other pages that hear the place leave it.
    if (float === null) {
        socket.listen('jump', (message) => {
            const place = jumpOf(message);
            if (place?.owner !== pageId) return;
            layout.openView(
                'source',
                sourceTabState(place.root, place.file, place.line, place.column)
            );
            focus();
        });
    }

    /** The target of a found root: its folder of a root. */
    function targetOf(found: NonNullable<LatexRoot>): { root: string; path: string } {
        return { root: found.root, path: found.path };
    }

    async function compilerLog(root: string, file: string): Promise<void> {
        const found = await rooted(root, file);
        if (found === null) return;
        if (!latex.log(targetOf(found), found.main)) say(t('latex.no_build', found.main));
    }

    async function buildLog(root: string, file: string): Promise<void> {
        const found = await rooted(root, file);
        if (found === null) return;
        layout.openView('source', sourceTabState(found.root, found.log));
    }

    async function count(root: string, file: string): Promise<void> {
        const found = await rooted(root, file);
        if (found === null) return;
        const counted = await latex.count(targetOf(found), found.main);
        if (counted.words === null) {
            say(counted.error, true);
            return;
        }
        say(
            counted.words === 1
                ? t('latex.words_of_one', found.main)
                : t('latex.words_of', found.main, counted.words)
        );
    }

    async function checkcites(root: string, file: string): Promise<void> {
        const found = await rooted(root, file);
        if (found === null) return;
        const answer = await latex.run(targetOf(found), found.main, 'checkcites');
        if (!answer.ok) {
            say(answer.error, true);
            return;
        }
        latex.showTerminal(answer.id);
    }

    async function texdoc(name: string): Promise<void> {
        const answer = await latex.texdoc(name);
        if (!answer.ok) say(answer.error, true);
    }

    async function revealOutput(root: string, file: string): Promise<void> {
        const found = await rooted(root, file);
        if (found === null) return;
        const at = found.pdf.lastIndexOf('/');
        layout.showFolderInFiles(at < 0 ? '' : found.pdf.slice(0, at), found.root);
    }

    async function saveWithoutBuilding(
        root: string,
        file: string,
        save: () => Promise<void>
    ): Promise<void> {
        await latex.savingQuietly(root, file, save);
    }

    async function rootComment(root: string, file: string): Promise<string | null> {
        const found = await rootOfFile(root, file);
        if (found === null) return null;
        const folder = file.slice(0, Math.max(0, file.lastIndexOf('/')));
        const main = found.path === '' ? found.main : `${found.path}/${found.main}`;
        return `% !TEX root = ${relativePath(folder, main)}`;
    }

    return {
        rootOfFile,
        build,
        stop,
        clean,
        viewPdf,
        forward,
        inverse,
        compilerLog,
        buildLog,
        count,
        checkcites,
        texdoc,
        revealOutput,
        saveWithoutBuilding,
        rootComment,
        roots: () => [...seen.values()],
        revealFor: (root, pdf) => reveals.get(keyOf(root, pdf)) ?? null,
        taken: (root, pdf) => void reveals.delete(keyOf(root, pdf)),
        texView: () => void layout.showTexView(),
        say
    };
}
