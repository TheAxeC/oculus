// Layer 2, client state. What a page and a tab are called, which tabs a page holds, what a close
// asks before it happens, and what a reset asks before it runs: its own question, then the close
// question of each tab holding unsaved text (resetAfterAsking), each held for a dialog to draw
// through questionFor. The shell's pane menus, page leaves and rail, and the Pages view on the
// System page all name a page, close one and reset one, so the rules live here, where
// each of them may read them.
//
// The file a tab shows is defined here too, once, for the shell and the Files view alike: which
// file a tab shows, the file whose icon its face draws, the segments of its path, its absolute
// path, its path as a reader writes it, and the comparison of two files. The pane's tab strip, its
// breadcrumb and its right-click menu name a file by these rules, and so do the Files view's
// outline, timeline, tree and row menu. The tab menu's file items are here as well: what the menu
// offers for a tab's file (tabFileFacts), its bookmark made or taken out (bookmarkTabFile), and the
// file shown in a browser tab (openInBrowserTab). A document tab of oculus's own folder is placed
// in a hub by the folder's place there (`DocPlace`), which the caller passes from the server's
// answer (the client state's `docPlaceFor`); the tab's saved state never holds it.
//
// Whether an instance holds unsaved text is not decided here. The caller passes the ui store's
// answer for an instance id, so a view that keeps unsaved text registers its rule once and none of
// the closes is edited for it.
//
// A close question over unsaved text asks whether to save it, as VS Code's does, with three
// answers: Don't Save closes and loses the text, Cancel keeps every tab, and Save, which holds the
// keyboard, runs each unsaved tab's save (the ui store's `saveForClose`) and closes the tabs whose
// save took, keeping open, with its text, a tab whose save failed or that has no save.

import { z } from 'zod';
import {
    floatHost,
    tabsOf,
    type Arranged,
    type Float,
    type Host,
    type Instance,
    type Page
} from '../layout/index.ts';
import { filledTextShape, readAs } from '../../../data/shapes/shapes.ts';
import { engineHubPath } from './catalogue.ts';
import { registrationLabel, type Registration } from './registry.ts';
import { t } from '../../shared/words/text.ts';
import { parseArrangement } from './arrangement.ts';
import type { BusyTerminal } from '../ui.svelte.ts';
import type { TabFile } from './status.ts';
import { diffState } from '../../sources/repositories/diff/subject.ts';
import { DIFF_VIEW } from '../../sources/repositories/repositories.svelte.ts';
import { typeOfFile } from '../../sources/explorer/file-type.ts';
import type { RowRef } from '../../sources/explorer/view/place.ts';
import { nameOf } from '../../../data/helpers/files/paths.ts';
import { opensInProgram } from '../../../data/helpers/files/opens-in-program.ts';
import type { ProgramApps } from '../../../data/helpers/files/opens-in-program.ts';
import type { Entry } from '../../../data/model/index.ts';
import { headOf } from '../../sessions/source/draft.ts';
import { bookmarkAt, fileBytesUrl, markRefusal } from '../../sources/fs-transport.ts';
import type { WriteAnswer } from '../../shared/stores/shapes.ts';

/** The field of a tab's state that names the tab. */
const tabLabelShape = z.object({ label: filledTextShape });

/**
 * What a page is called: its own name, or its position in the page list when it has none. Every
 * place a page is named reads this, so the Pages view, a pane menu, a shown page's header and a
 * folded strip all call one page the same thing.
 */
export function pageName(page: Page, index: number): string {
    return page.label === '' ? t('ui.page_default', index + 1) : page.label;
}

/** What the page with this id is called, by its place in the page list. */
export function pageNameOf(pages: readonly Page[], id: string): string {
    const found = pageAt(pages, id);
    return found === null ? '' : pageName(found.page, found.at);
}

/**
 * What a tab is called: the `label` its state carries, else the last name of an engine document's
 * path, else its view's name, else the view's id when the registry holds no such view. A pane's
 * tab strip names a tab the same way, so a question about a tab calls it what its strip does.
 */
export function tabNameOf(
    instance: Instance,
    viewFor: (id: string) => Pick<Registration, 'label' | 'words'> | undefined
): string {
    const own = readAs(tabLabelShape, instance.state)?.label ?? engineDocName(instance);
    if (own !== null) return own;
    const found = viewFor(instance.view);
    return found === undefined ? instance.view : registrationLabel(found);
}

/**
 * Every instance a page holds, pane by pane in the tree's own order. Closing the page closes all of
 * them at once, so it is the list the close question is asked over.
 */
export function pageInstanceIds(page: Host): string[] {
    return tabsOf(page.workbench.root).map((instance) => instance.id);
}

/**
 * The floats as hosts, which a reset and a close ask about the tabs of as they ask about a page's.
 */
export function floatHosts(floats: readonly Float[]): Host[] {
    return floats.map(floatHost);
}

/** Every instance the pages or floats hold, in the order given and then tree order. */
export function instancesOfPages(pages: readonly Host[]): Instance[] {
    return pages.flatMap((page) => tabsOf(page.workbench.root));
}

/** What a close asks: nothing, the unsaved-text question, or the caller's own how-much question. */
export type CloseQuestion = 'none' | 'dirty' | 'many';

/**
 * The question closing these instances asks. One instance with nothing unsaved in it goes at once,
 * since a close control pressed over a saved tab is the reader saying exactly what they meant; one
 * holding unsaved text asks about the text; more than one asks the caller's own question, which
 * already says how much is about to go whether or not any of it is unsaved. A tab's own close, a
 * pane's and a page's all ask it, so the same press over the same tabs asks the same question
 * wherever it is made.
 */
export function closeQuestion(ids: string[], unsaved: (id: string) => boolean): CloseQuestion {
    if (ids.length > 1) return 'many';
    return ids.some((id) => unsaved(id)) ? 'dirty' : 'none';
}

/**
 * What a close asks, already translated: the question, the line under it, and the tabs holding
 * unsaved text, which a question with any asks to save.
 */
export type CloseAsk = { message: string; detail: string; dirty: string[] };

/** The question over the unsaved text of `count` tabs. */
function dirtyWords(count: number): string {
    return count === 1 ? t('ui.tab_close_dirty') : t('ui.tabs_close_dirty', count);
}

/** A close's question and the line under it as the one sentence a dialog with one field shows. */
export function closeWords(asked: CloseAsk): string {
    return asked.detail === '' ? asked.message : `${asked.message} ${asked.detail}`;
}

/** The lines naming each busy terminal and its program, or that it could not be read. */
export function busyLines(busy: readonly BusyTerminal[]): string {
    return busy
        .map((one) =>
            one.command === ''
                ? t('ui.terminal_busy_unread', one.name)
                : t('ui.terminal_busy_running', one.name, one.command)
        )
        .join(' ');
}

/**
 * What closing these instances asks, given a fresh read of the busy terminals they own; null when
 * it acts at once. A close that loses unsaved text asks whether to save it (dirtyWords over the
 * tabs holding it), and names them under the question when the close takes other tabs too. A close
 * with none asks closeQuestion's question in words: nothing for one saved tab, the caller's own
 * `many` question for more than one. A busy terminal is named with its program under whichever
 * question is asked, or under the busy question when there is no other, so one press asks one
 * question.
 */
export function closeAsk(over: {
    ids: string[];
    unsaved: (id: string) => boolean;
    nameOf: (id: string) => string;
    many: string;
    busy: readonly BusyTerminal[];
}): CloseAsk | null {
    const { ids, unsaved, nameOf, many, busy } = over;
    if (ids.length === 0) return null;
    const dirty = ids.filter(unsaved);
    const named =
        dirty.length > 0 && ids.length > 1
            ? t('ui.terminal_close_unsaved', dirty.map(nameOf).join(', '))
            : '';
    const detail = [named]
        .concat(busyLines(busy))
        .filter((line) => line !== '')
        .join(' ');
    if (dirty.length > 0) return { message: dirtyWords(dirty.length), detail, dirty };
    if (closeQuestion(ids, unsaved) === 'many') return { message: many, detail, dirty };
    return busy.length > 0 ? { message: t('ui.terminal_close_busy'), detail, dirty } : null;
}

/**
 * A guard over the async read a close asks first: a press of the same close (the same key) while
 * its read is in flight does nothing, so one read and one question come of it. The key is free
 * again once the read answered or failed; another key is not held by it.
 */
export function closeOnce(): <T>(
    key: string,
    read: () => Promise<T>,
    decide: (found: T) => void
) => Promise<void> {
    const reading = new Set<string>();
    return async (key, read, decide) => {
        if (reading.has(key)) return;
        reading.add(key);
        let found: Awaited<ReturnType<typeof read>>;
        try {
            found = await read();
        } finally {
            reading.delete(key);
        }
        decide(found);
    };
}

/**
 * The first tab holding text no save has taken, in host order (the pages, then the floats) and then
 * tree order, with the page or float it is on; null when no tab holds any. The status bar's unsaved
 * count opens this one.
 */
export function firstUnsaved(
    pages: readonly Host[],
    unsaved: (id: string) => boolean
): { page: string; instance: string } | null {
    for (const page of pages) {
        const found = pageInstanceIds(page).find(unsaved);
        if (found !== undefined) return { page: page.id, instance: found };
    }
    return null;
}

/** How many tabs across every page and float hold text no save has taken. */
export function unsavedCount(pages: readonly Host[], unsaved: (id: string) => boolean): number {
    return pages.reduce((sum, page) => sum + pageInstanceIds(page).filter(unsaved).length, 0);
}

/**
 * The views a rail button's page holds, in the order of that page's tabs, each once: the page that
 * carries the button's key when it has been made, and the arrangement it will be made from when it
 * has not, so a button draws the badges of its page before its first press. An arrangement that
 * does not parse holds none.
 */
export function railPageViews(pages: readonly Page[], key: string, node: unknown): string[] {
    const made = pages.find((page) => page.rail === key);
    const root = made?.workbench.root ?? parseArrangement(node)?.root;
    if (root === undefined) return [];
    return [...new Set(tabsOf(root).map((instance) => instance.view))];
}

/** Whether any tab of a page holds text no save has taken. */
export function pageUnsaved(page: Page, unsaved: (id: string) => boolean): boolean {
    return pageInstanceIds(page).some(unsaved);
}

/** The page with this id and its place in the page list, or null when the list holds none. */
export function pageAt(pages: readonly Page[], id: string): { page: Page; at: number } | null {
    const at = pages.findIndex((page) => page.id === id);
    return at < 0 ? null : { page: pages[at], at };
}

/** One rail button as a reset reads it: its arrangement key, its words and its arrangement. */
export type RailSource = { page: string; label: string; node: unknown };

/**
 * The workbenches the pages of `rebuilt` are made again as, by page id: each from the arrangement
 * of the button that carries the page's key, with that button's words. A page whose button is gone
 * or whose arrangement does not parse is left out.
 */
export function arrangedPages(
    rebuilt: readonly Page[],
    rail: readonly RailSource[]
): Map<string, Arranged> {
    const arranged = new Map<string, Arranged>();
    for (const page of rebuilt) {
        const source = rail.find((entry) => entry.page === page.rail);
        const workbench = source === undefined ? null : parseArrangement(source.node);
        if (source !== undefined && workbench !== null) {
            arranged.set(page.id, { label: source.label, workbench });
        }
    }
    return arranged;
}

/**
 * What resetting every page does: the saved pages a rail button carries the key of, rebuilt from
 * that button's arrangement, and the saved pages carrying a key no button carries, removed. A page
 * with no rail key (Page 1, a page New page made) is in neither list, and so is a page whose
 * button's arrangement does not parse, which a reset leaves as it is rather than emptying.
 */
export function resetPlan(
    pages: readonly Page[],
    rail: readonly RailSource[]
): { rebuilt: Page[]; removed: Page[] } {
    const rebuilt: Page[] = [];
    const removed: Page[] = [];
    for (const page of pages) {
        if (page.rail === undefined) continue;
        const button = rail.find((entry) => entry.page === page.rail);
        if (button === undefined) removed.push(page);
        else if (parseArrangement(button.node) !== null) rebuilt.push(page);
    }
    return { rebuilt, removed };
}

/**
 * What a reset asks before it runs, already translated: the question, and the line under it naming
 * each page it rebuilds and each it removes. `one` is the page a reset of a single page names; a
 * reset of every page names none. `floats` is whether the reset replaces the floats held. The tabs
 * holding unsaved text are asked about after it, one by one (resetAfterAsking).
 */
export function resetAsk(
    all: readonly Page[],
    rebuilt: readonly Page[],
    removed: readonly Page[],
    one?: Page,
    floats = false
): { message: string; detail: string } {
    const names = (chosen: readonly Page[]): string =>
        chosen.map((page) => pageNameOf(all, page.id)).join(', ');
    const lines = [
        rebuilt.length > 0 ? t('workbench.reset_rebuilt', names(rebuilt)) : '',
        removed.length > 0 ? t('workbench.reset_removed', names(removed)) : '',
        floats ? t('workbench.reset_floats') : ''
    ].filter((line) => line !== '');
    const message =
        one === undefined
            ? t('workbench.reset_all_confirm')
            : t('workbench.reset_page_confirm', pageNameOf(all, one.id));
    return { message, detail: lines.join(' ') };
}

/**
 * The answer to a question: yes (its confirm, or Don't Save over unsaved text), no (Cancel), or
 * save (the Save of a question over unsaved text).
 */
type Answer = 'yes' | 'no' | 'save';

/**
 * A question held for a confirm to draw, whether it asks to save unsaved text (and so draws Don't
 * Save, Cancel and Save), and the answer that lets it go.
 */
export type Question = {
    message: string;
    detail: string;
    saves: boolean;
    answer: (given: Answer) => void;
};

/** Asks one question, one over unsaved text when `saves`, and answers what the reader said. */
export type Asker = (message: string, detail: string, saves?: boolean) => Promise<Answer>;

/** The saves a reset makes: the ones the autosave mode makes on a close, and a close's Save. */
export type ResetSaves = {
    beforeClose: (ids: string[]) => Promise<string[]>;
    forClose: (ids: string[]) => Promise<string[]>;
};

/**
 * An asker over a component's held question: each call hands `show` a question, and the answer
 * given to it takes the question away and settles the call. A question asked while another is held
 * answers the held one no, so no call is left waiting.
 */
export function questionFor(show: (held: Question | null) => void): Asker {
    let waiting: ((given: Answer) => void) | null = null;
    return (message, detail, saves = false) =>
        new Promise<Answer>((resolve) => {
            waiting?.('no');
            waiting = resolve;
            show({
                message,
                detail,
                saves,
                answer: (given) => {
                    if (waiting !== resolve) return;
                    waiting = null;
                    show(null);
                    resolve(given);
                }
            });
        });
}

/**
 * Run a reset once the reader agreed to it: the reset's own question first, then, for each tab of
 * the pages it rebuilds or removes and of the floats it replaces that holds unsaved text after the
 * saves the autosave mode makes on a close, the question closing that tab asks (closeQuestion over
 * the one tab), one tab at a time, with the tab and its page (or its float) named under it, since
 * the tab may not be on screen; then, once, the busy question naming each terminal of those pages
 * running a program (`busy` is the fresh read). A no to any of them ends it with nothing done, and
 * so does a Save whose save failed, since the reset would take that tab away with its text. Answers
 * whether the reset ran.
 */
export async function resetAfterAsking(
    all: readonly Page[],
    words: { message: string; detail: string },
    touched: readonly Host[],
    unsaved: (id: string) => boolean,
    saves: ResetSaves,
    name: (instance: Instance) => string,
    ask: Asker,
    act: () => void,
    busy: () => Promise<readonly BusyTerminal[]>
): Promise<boolean> {
    if ((await ask(words.message, words.detail)) !== 'yes') return false;
    // The tabs `editor.autosave` saves on a close are saved, so only the ones left unsaved ask.
    await saves.beforeClose(
        touched.flatMap((page) => tabsOf(page.workbench.root).map((one) => one.id))
    );
    for (const page of touched) {
        for (const instance of tabsOf(page.workbench.root)) {
            if (closeQuestion([instance.id], unsaved) !== 'dirty') continue;
            const held = pageNameOf(all, page.id);
            const detail =
                held === ''
                    ? t('workbench.reset_float_tab', name(instance))
                    : t('workbench.reset_tab', name(instance), held);
            const given = await ask(dirtyWords(1), detail, true);
            if (given === 'no') return false;
            if (given === 'save' && (await saves.forClose([instance.id])).length > 0) return false;
        }
    }
    const running = await busy();
    if (
        running.length > 0 &&
        (await ask(t('ui.terminal_close_busy'), busyLines(running))) !== 'yes'
    ) {
        return false;
    }
    act();
    return true;
}

/**
 * A page's close that waits on its dialog: the words, the page, its tabs holding unsaved text, and
 * the close's Save (`saveAndClose` of the flows that hold it).
 */
export type HeldClose = { message: string; id: string; dirty: string[]; save: () => Promise<void> };

/** What the close and the reset of a page read of the client. */
export type PageFlowDeps = {
    pages: () => readonly Page[];
    unsaved: (id: string) => boolean;
    saveBeforeClose: (ids: string[]) => Promise<string[]>;
    /** The Save of a close question; see the ui store. */
    saveForClose: (ids: string[]) => Promise<string[]>;
    busyTerminals: (instances: readonly Instance[]) => Promise<readonly BusyTerminal[]>;
    viewFor: (id: string) => Pick<Registration, 'label' | 'words'> | undefined;
    closePage: (id: string) => void;
    /** Close one tab of a page. */
    closeTab: (id: string, page: string) => void;
    /** Hold a close's question and the page a yes closes for a dialog to draw; null drops it. */
    holdClose: (held: HeldClose | null) => void;
    /** Ask one question of a reset, as questionFor makes it. */
    ask: Asker;
};

/** The close of a page and the reset of a page, each asking what its tabs make it ask. */
export type PageFlows = {
    /**
     * Close a page, asking first unless it holds one tab with nothing unsaved in it. More than one
     * tab is the page's own sentence, which says how many go; one tab holding unsaved text is the
     * tab sentence. A close pressed again while its read is in flight does nothing.
     */
    close: (id: string) => void;
    /**
     * The Save of a page's close question: save its tabs holding unsaved text, then close the page,
     * or, when a save failed, every tab of it but the ones left holding unsaved text.
     */
    saveAndClose: (held: HeldClose) => Promise<void>;
    /**
     * Reset a page: the reset's own question naming it, then the close question of each tab holding
     * unsaved text, then the busy terminals; `act` makes the page again when every answer was yes.
     */
    reset: (id: string, act: () => void) => void;
};

export function createPageFlows(deps: PageFlowDeps): PageFlows {
    const once = closeOnce();

    function close(id: string): void {
        const found = pageAt(deps.pages(), id);
        if (found === null) return;
        const ids = pageInstanceIds(found.page);
        const tabs = instancesOfPages([found.page]);
        void once(
            `page:${id}`,
            async () => {
                await deps.saveBeforeClose(ids);
                return deps.busyTerminals(tabs);
            },
            (busy) => {
                const asked = closeAsk({
                    ids,
                    unsaved: deps.unsaved,
                    nameOf: (one) => {
                        const tab = tabs.find((each) => each.id === one);
                        return tab === undefined ? one : tabNameOf(tab, deps.viewFor);
                    },
                    many: t('ui.page_close_confirm', pageName(found.page, found.at), ids.length),
                    busy
                });
                if (asked === null) {
                    deps.closePage(id);
                    return;
                }
                const held: HeldClose = {
                    message: closeWords(asked),
                    id,
                    dirty: asked.dirty,
                    save: () => saveAndClose(held)
                };
                deps.holdClose(held);
            }
        );
    }

    async function saveAndClose(held: HeldClose): Promise<void> {
        const left = await deps.saveForClose(held.dirty);
        if (left.length === 0) {
            deps.closePage(held.id);
            return;
        }
        const found = pageAt(deps.pages(), held.id);
        if (found === null) return;
        for (const one of pageInstanceIds(found.page)) {
            if (!left.includes(one)) deps.closeTab(one, held.id);
        }
    }

    function reset(id: string, act: () => void): void {
        const all = deps.pages();
        const found = pageAt(all, id);
        if (found === null) return;
        const words = resetAsk(all, [found.page], [], found.page);
        void resetAfterAsking(
            all,
            words,
            [found.page],
            deps.unsaved,
            { beforeClose: deps.saveBeforeClose, forClose: deps.saveForClose },
            (instance) => tabNameOf(instance, deps.viewFor),
            deps.ask,
            act,
            () => deps.busyTerminals(instancesOfPages([found.page]))
        );
    }

    return { close, saveAndClose, reset };
}

/** A root the server serves: its key and the folder it stands for. */
export type TabRoot = { key: string; dir: string };

/** The root and path a tab's state names. */
const fileShape = z.object({ root: z.string().min(1), path: z.string().min(1) });

/**
 * The path a document tab holds: relative to the folder of its hub (`hub` names a hub of the
 * workspace, absent for the primary), or to the engine folder if flagged.
 */
const docShape = z.object({
    path: z.string().min(1),
    engine: z.boolean().optional(),
    hub: z.string().min(1).optional()
});

/**
 * Where a document tab's file is: the name of the primary hub, which a tab with no `hub` is a
 * document of, and where oculus's own folder lies, the hub that holds it and its path in that hub.
 * The primary is the empty string with none, and the engine parts are empty when no hub holds the
 * folder.
 */
export type DocPlace = { primary: string; engineHub: string; engineAt: string };

/** The place that puts no document tab's file anywhere. */
export const NO_PLACE: DocPlace = { primary: '', engineHub: '', engineAt: '' };

/**
 * Whether a tab is a document of oculus's own folder: a doc tab whose state flags `engine`, whose
 * path is relative to that folder.
 */
export function isEngineDoc(tab: { view: string; state: unknown }): boolean {
    return tab.view === 'doc' && readAs(docShape, tab.state)?.engine === true;
}

/**
 * The words of an engine document's tab when its state holds no label: the last name of its path.
 * Null for any other tab.
 */
export function engineDocName(tab: { view: string; state: unknown }): string | null {
    const doc = tab.view === 'doc' ? readAs(docShape, tab.state) : null;
    return doc?.engine === true ? nameOf(doc.path) : null;
}

/**
 * The file a tab shows, or null when its view shows no one file. A document tab holds a path under
 * its hub and no root, so it is read as a file of the folder named by its `hub`, else of the
 * primary's. A document tab of oculus's own folder holds a path under that folder, which is a file
 * of `place.engineHub` at `place.engineAt` joined with it, the folder's place in a hub as the
 * server's answer for the manual gives it; it shows no file when that place is empty, since the tab
 * alone cannot place the folder in a hub. The path `.` names a root's own folder (a Present tab of
 * a deck there), which is no file, as a Files tab of a root is not.
 */
export function fileOfTab(
    tab: { view: string; state: unknown },
    place: DocPlace = NO_PLACE
): RowRef | null {
    if (tab.view === 'doc') {
        const doc = readAs(docShape, tab.state);
        if (doc === null) return null;
        if (doc.engine !== true) {
            const root = doc.hub ?? place.primary;
            return root === '' ? null : { root, path: doc.path };
        }
        if (place.engineHub === '' || place.engineAt === '') return null;
        return { root: place.engineHub, path: engineHubPath(doc.path, place.engineAt) };
    }
    const file = readAs(fileShape, tab.state);
    return file === null || file.path === '.' ? null : file;
}

/**
 * The views whose tab draws its file's icon: source, file, document and Doc. A Markdown preview
 * keeps its view's glyph, as VS Code's preview tab carries the preview icon.
 */
const FILE_VIEWS: readonly string[] = ['source', 'file', 'document', 'doc'];

/**
 * The file a tab shows, which its face draws the icon of. A tab of another view keeps its view's
 * glyph though its state names a folder or a file: a Files tab opened on a folder, a LaTeX tab, a
 * Markdown preview.
 */
export function shownFileOfTab(
    tab: { view: string; state: unknown },
    place: DocPlace = NO_PLACE
): RowRef | null {
    return FILE_VIEWS.includes(tab.view) ? fileOfTab(tab, place) : null;
}

/**
 * The segments of the path one row sits at: the root, then each folder down to the row itself, each
 * with the row it names.
 */
export function crumbsOf(selected: RowRef | null): { row: RowRef; label: string }[] {
    if (selected === null) return [];
    const parts = selected.path.split('/').filter((part) => part !== '');
    return [
        { row: { root: selected.root, path: '' }, label: selected.root },
        ...parts.map((part, at) => ({
            row: { root: selected.root, path: parts.slice(0, at + 1).join('/') },
            label: part
        }))
    ];
}

/** The absolute path of a row, from its root's folder and its path inside it. */
export function absoluteOf(rootDir: string, path: string): string {
    const base = rootDir.endsWith('/') ? rootDir.slice(0, -1) : rootDir;
    return path === '' ? base : `${base}/${path}`;
}

/**
 * The path of a row as a reader writes it: the absolute path with the home folder written `~`. A
 * path outside the home folder is written whole, and so is every path when the home folder is not
 * known.
 */
export function shownPath(rootDir: string, path: string, home: string): string {
    const whole = absoluteOf(rootDir, path);
    const base = home.endsWith('/') ? home.slice(0, -1) : home;
    if (base === '') return whole;
    if (whole === base) return '~';
    return whole.startsWith(`${base}/`) ? `~${whole.slice(base.length)}` : whole;
}

/** Open the diff of `file` against the file selected for compare, titled by the two names. */
export function openComparison(
    openView: (view: string, state: unknown) => string,
    file: TabFile,
    against: TabFile
): void {
    openView(
        DIFF_VIEW,
        diffState(
            { root: file.root, path: file.path, staged: false, worktree: false, against },
            t('files.compare_title', nameOf(against.path), nameOf(file.path))
        )
    );
}

/** What the tab menu offers over the file a tab shows. */
export type TabFileFacts = {
    /**
     * Whether the file is bookmarked, or null for a tab whose file cannot be: one read at a commit
     * (its root is a repository's own directory) or one in a root the server does not serve.
     */
    bookmarked: boolean | null;
    /** Whether a browser tab draws the file itself: the file and document views. */
    browser: boolean;
    /** Whether `open.program_ext` names an application for the file. */
    program: boolean;
    /** Whether the tab is a PDF, which a tab of the page and a window of its own also show. */
    pdf: boolean;
};

/**
 * The bookmark, browser tab and program facts of a tab. `served` says the tab's root is one the
 * server serves; the bookmarks are the reader's own entries, `programs` the applications the
 * configuration names by extension and `place` where a document tab's file is (`fileOfTab`).
 */
export function tabFileFacts(
    tab: { view: string; state: unknown },
    served: boolean,
    held: { bookmarks: readonly Entry[]; programs: ProgramApps; place: DocPlace }
): TabFileFacts {
    const file = fileOfTab(tab, held.place);
    const bookmarkable = file !== null && served && headOf(tab.state) === undefined;
    return {
        bookmarked: bookmarkable
            ? bookmarkAt([...held.bookmarks], file.root, file.path) !== null
            : null,
        browser: served && (tab.view === 'file' || tab.view === 'document'),
        program: file !== null && opensInProgram(file.path, held.programs),
        pdf: served && tab.view === 'file' && file !== null && typeOfFile(file.path).kind === 'pdf'
    };
}

/** The store calls a bookmark write makes. */
export type BookmarkCalls = {
    bookmarks: () => { entries: Entry[] };
    addBookmark: (fields: Record<string, unknown>) => Promise<WriteAnswer>;
    removeBookmark: (label: string) => Promise<WriteAnswer>;
};

/**
 * Bookmark a tab's file, or take its bookmark out. The answer is the words of the write's refusal,
 * and the empty string when it was written.
 */
export async function bookmarkTabFile(
    calls: BookmarkCalls,
    file: RowRef,
    add: boolean
): Promise<string> {
    const held = bookmarkAt(calls.bookmarks().entries, file.root, file.path);
    if (add) {
        const written = await calls.addBookmark({
            label: nameOf(file.path),
            root: file.root,
            path: file.path
        });
        return markRefusal(written);
    }
    return held === null ? '' : markRefusal(await calls.removeBookmark(held.id));
}

/** The state of a `file` tab over one file of a served root. */
export function fileTabState(file: RowRef): { root: string; path: string; label: string } {
    return { root: file.root, path: file.path, label: nameOf(file.path) };
}

/** Show a file in a browser tab of its own, which is also how a picture or a PDF is saved. */
export function openInBrowserTab(file: RowRef): void {
    window.open(fileBytesUrl(file.root, file.path), '_blank', 'noopener');
}
