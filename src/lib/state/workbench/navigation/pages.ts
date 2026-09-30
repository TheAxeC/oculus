// Layer 2, client state. What a page and a tab are called, which tabs a page holds, what a close
// asks before it happens, and what a reset asks before it runs: its own question, then the close
// question of each tab holding unsaved text (resetAfterAsking), each held for a dialog to draw
// through questionFor. The shell's pane menus, page leaves and rail, and the Pages view on the
// Views and Settings page all name a page, close one and reset one, so the rules live here, where
// each of them may read them.
//
// Whether an instance holds unsaved text is not decided here. The caller passes the ui store's
// answer for an instance id, so a view that keeps unsaved text registers its rule once and none of
// the closes is edited for it.

import { tabsOf, type Instance, type Page } from '../layout/index.ts';
import { registrationLabel, type Registration } from './registry.ts';
import { t } from '../../shared/words/text.ts';
import { parseArrangement } from './arrangement.ts';
import type { BusyTerminal } from '../ui.svelte.ts';

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
 * What a tab is called: the `label` its state carries, else its view's name, else the view's id
 * when the registry holds no such view. A pane's tab strip names a tab the same way, so a question
 * about a tab calls it what its strip does.
 */
export function tabNameOf(
    instance: Instance,
    viewFor: (id: string) => Pick<Registration, 'label'> | undefined
): string {
    const state = instance.state;
    if (typeof state === 'object' && state !== null && !Array.isArray(state)) {
        const own = (state as Record<string, unknown>).label;
        if (typeof own === 'string' && own !== '') return own;
    }
    const found = viewFor(instance.view);
    return found === undefined ? instance.view : registrationLabel(found);
}

/**
 * Every instance a page holds, pane by pane in the tree's own order. Closing the page closes all of
 * them at once, so it is the list the close question is asked over.
 */
export function pageInstanceIds(page: Page): string[] {
    return tabsOf(page.workbench.root).map((instance) => instance.id);
}

/** Every instance the pages hold, in page order and then tree order. */
export function instancesOfPages(pages: readonly Page[]): Instance[] {
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

/** What a close asks, already translated: the question and the line under it. */
export type CloseAsk = { message: string; detail: string };

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
 * it acts at once. Without a busy terminal it is closeQuestion's answer in words: nothing for one
 * saved tab, the unsaved question for one holding unsaved text, the caller's own `many` question
 * for more than one. With a busy terminal the one question names it and its program, and a close
 * that also loses unsaved text names those tabs first, so one press asks one question.
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
    const asked = closeQuestion(ids, unsaved);
    if (busy.length === 0) {
        if (asked === 'many') return { message: many, detail: '' };
        return asked === 'dirty' ? { message: t('ui.tab_close_dirty'), detail: '' } : null;
    }
    const lost = ids.filter(unsaved).map(nameOf);
    const lines = [lost.length > 0 ? t('ui.terminal_close_unsaved', lost.join(', ')) : '']
        .concat(busyLines(busy))
        .filter((line) => line !== '');
    const message =
        asked === 'many'
            ? many
            : lost.length > 0
              ? t('ui.tab_close_dirty')
              : t('ui.terminal_close_busy');
    return { message, detail: lines.join(' ') };
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
 * The first tab holding text no save has taken, in page order and then tree order, with the page
 * it is on; null when no tab holds any. The status bar's unsaved count opens this one.
 */
export function firstUnsaved(
    pages: readonly Page[],
    unsaved: (id: string) => boolean
): { page: string; instance: string } | null {
    for (const page of pages) {
        const found = pageInstanceIds(page).find(unsaved);
        if (found !== undefined) return { page: page.id, instance: found };
    }
    return null;
}

/** How many tabs across every page hold text no save has taken. */
export function unsavedCount(pages: readonly Page[], unsaved: (id: string) => boolean): number {
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
 * reset of every page names none. The tabs holding unsaved text are asked about after it, one by
 * one (resetAfterAsking).
 */
export function resetAsk(
    all: readonly Page[],
    rebuilt: readonly Page[],
    removed: readonly Page[],
    one?: Page
): { message: string; detail: string } {
    const names = (chosen: readonly Page[]): string =>
        chosen.map((page) => pageNameOf(all, page.id)).join(', ');
    const lines = [
        rebuilt.length > 0 ? t('workbench.reset_rebuilt', names(rebuilt)) : '',
        removed.length > 0 ? t('workbench.reset_removed', names(removed)) : ''
    ].filter((line) => line !== '');
    const message =
        one === undefined
            ? t('workbench.reset_all_confirm')
            : t('workbench.reset_page_confirm', pageNameOf(all, one.id));
    return { message, detail: lines.join(' ') };
}

/** A question held for a confirm to draw, and the answer that lets it go. */
export type Question = { message: string; detail: string; answer: (yes: boolean) => void };

/** Asks one question and answers whether the reader said yes. */
export type Asker = (message: string, detail: string) => Promise<boolean>;

/**
 * An asker over a component's held question: each call hands `show` a question, and the answer
 * given to it takes the question away and settles the call. A question asked while another is held
 * answers the held one no, so no call is left waiting.
 */
export function questionFor(show: (held: Question | null) => void): Asker {
    let waiting: ((yes: boolean) => void) | null = null;
    return (message, detail) =>
        new Promise<boolean>((resolve) => {
            waiting?.(false);
            waiting = resolve;
            show({
                message,
                detail,
                answer: (yes) => {
                    if (waiting !== resolve) return;
                    waiting = null;
                    show(null);
                    resolve(yes);
                }
            });
        });
}

/**
 * Run a reset once the reader agreed to it: the reset's own question first, then, for each tab of
 * the pages it rebuilds or removes that holds unsaved text, the question closing that tab asks
 * (closeQuestion over the one tab), one tab at a time, with the tab and its page named under it,
 * since the tab may not be on screen; then, once, the busy question naming each terminal of those
 * pages running a program (`busy` is the fresh read). A no to any of them ends it with nothing
 * done. Answers whether the reset ran.
 */
export async function resetAfterAsking(
    all: readonly Page[],
    words: { message: string; detail: string },
    touched: readonly Page[],
    unsaved: (id: string) => boolean,
    name: (instance: Instance) => string,
    ask: Asker,
    act: () => void,
    busy: () => Promise<readonly BusyTerminal[]>
): Promise<boolean> {
    if (!(await ask(words.message, words.detail))) return false;
    for (const page of touched) {
        for (const instance of tabsOf(page.workbench.root)) {
            if (closeQuestion([instance.id], unsaved) !== 'dirty') continue;
            const detail = t('workbench.reset_tab', name(instance), pageNameOf(all, page.id));
            if (!(await ask(t('ui.tab_close_dirty'), detail))) return false;
        }
    }
    const running = await busy();
    if (running.length > 0 && !(await ask(t('ui.terminal_close_busy'), busyLines(running)))) {
        return false;
    }
    act();
    return true;
}
