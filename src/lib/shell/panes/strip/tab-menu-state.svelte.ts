// Layer 3, shell. The state behind the right-click menu of a pane's tabs: which tab the open menu
// is for, the items it reads from the right-click, and what each pick does over the stores. The
// pane's strip menu shares the right-click, so a pick that is not a tab's goes back to the pane.
// The items and the picks' dispatch are strip/tab-menu.ts's; this is the part that holds a value
// between the right-click and the pick, and the refusal a pick said.

import type { ClientState } from '$lib/state/client/context';
import { t } from '$lib/state/shared/words/text';
import { tabWithEditor, type Instance, type WindowBounds } from '$lib/state/workbench/layout';
import {
    bookmarkTabFile,
    fileOfTab,
    openComparison,
    openInBrowserTab,
    tabFileFacts,
    type TabRoot
} from '$lib/state/workbench/navigation/pages';
import type { MenuItem } from '$lib/ui/menu/menu-items';
import type { TabFile } from '$lib/state/workbench/navigation/status';
import { copyTabPath, tabMenu, tabPicked, tabsToClose, type CloseKind } from './tab-menu';

/** The entries apps add to a menu. */
type AppOffers = ReturnType<ClientState['appShell']['choices']>['offers'];

/** What the ids of the choices apps add to the menu start with. */
const APP_PICK = 'app';

/** The pick that opens the tab's file in another editor, and replaces the tab. */
const REOPEN_WITH = 'reopen-with';

/** What the menu reads of the pane it is in. */
export type TabMenuDeps = {
    client: ClientState;
    instances: () => Instance[];
    page: () => string;
    path: () => number[];
    /** The roots the server serves; a file under another is not offered the file items. */
    roots: () => TabRoot[];
    /** The pane's place on the screen, which a new window opens at; the app's panes give it. */
    windowBounds?: () => WindowBounds;
    /** The strip's own menu, for a right-click that lands on no tab. */
    stripItems: () => MenuItem[];
    /** A pick of the strip's menu. */
    stripPick: (id: string) => void;
    /** Close one tab, asking first when it holds unsaved text or a running program. */
    closeTab: (id: string) => void;
    /** Close these tabs, asking first, and run `act` once they may go. */
    askAndClose: (key: string, ids: string[], many: string, act: () => void) => Promise<void>;
};

/** The menu of the tabs of one pane. */
export function createTabMenu(deps: TabMenuDeps) {
    const { layout, explorer, fs, selectors, writes, ui } = deps.client;

    /** The tab the open right-click menu is for, or null when it is the strip's. */
    let menuTab: string | null = null;

    /**
     * The entries of `editor/title/context` the open menu ends with, by the position in its ids.
     */
    let appOffers: AppOffers = [];

    /** What the last pick could not do, said under the strip until the next right-click. */
    let said = $state('');

    const copier = copyTabPath(
        (text) => navigator.clipboard.writeText(text),
        (sentence) => (said = sentence),
        t
    );

    /** The menu of a right-click: the tab's when one is under the pointer, else the strip's. */
    function read(event: MouseEvent): MenuItem[] {
        const hit =
            event.target instanceof Element
                ? event.target.closest<HTMLElement>('[data-tab]')
                : null;
        menuTab = hit?.dataset.tab ?? null;
        said = '';
        const instances = deps.instances();
        const at = instances.findIndex((one) => one.id === menuTab);
        if (at < 0) return deps.stripItems();
        const found = instances[at];
        const place = selectors.docPlaceFor(found);
        const file = fileOfTab(found, place);
        const held = explorer.compareFile();
        const other =
            held !== null && !(held.root === file?.root && held.path === file.path) ? held : null;
        const served = file !== null && deps.roots().some((one) => one.key === file.root);
        const facts = tabFileFacts(found, served, {
            bookmarks: fs.bookmarks().entries,
            programs: selectors.programApps(),
            place
        });
        const apps = deps.client.appShell.choices(
            'editor/title/context',
            file === null ? {} : { resource: { root: file.root, path: file.path, language: '' } },
            APP_PICK
        );
        appOffers = apps.offers;
        const reopen =
            file !== null &&
            deps.client.appShell.reopens(found.view) &&
            deps.client.appShell.editorsOf(file.root, file.path).length > 0
                ? [{ id: REOPEN_WITH, label: t('apps.reopen_with') }]
                : [];
        return [
            ...tabMenu(
                {
                    pinned: found.pinned === true,
                    preview: found.preview === true,
                    file: served,
                    tabs: instances.length,
                    right: instances.length - at - 1,
                    compareWith: other !== null,
                    windows: deps.client.desktop !== undefined,
                    copyable: layout.copiesToWindow(found.id),
                    ...facts
                },
                t
            ),
            ...reopen,
            ...apps.items
        ];
    }

    /** A bookmark made or taken out over the tab's file; a refusal is said under the strip. */
    async function bookmark(file: TabFile, add: boolean): Promise<void> {
        const reason = await bookmarkTabFile(fs, file, add);
        said = reason === '' ? '' : t('files.bookmark_failed', reason);
    }

    /** The close items: the tabs each closes, after the guard's question. */
    function close(kind: CloseKind, id: string): void {
        if (kind === 'close') {
            deps.closeTab(id);
            return;
        }
        const { ids, keep } = tabsToClose(kind, deps.instances(), id, (one) => !ui.unsaved(one));
        void deps.askAndClose(`menu:${kind}:${id}`, ids, t('ui.tab_close_many', ids.length), () => {
            for (const one of ids) layout.closeInstance(one, deps.page());
            if (keep !== null) layout.keepPreview(keep);
        });
    }

    /**
     * Open the tab's file in the editor the reader chooses, in the tab's place: the new tab opens
     * first and the old one closes through the guard, which asks first when it holds unsaved work.
     */
    async function reopen(tab: string, file: TabFile, preview: boolean): Promise<void> {
        const choice = await deps.client.appShell.chooseEditor(file.root, file.path);
        if (choice === null) return;
        const next = tabWithEditor(choice, file.root, file.path);
        const opened = layout.openView(next.view, next.state, deps.page(), { preview });
        if (opened !== tab) deps.closeTab(tab);
    }

    /** A pick: the strip's when the menu was the strip's, else the tab's. */
    function pick(id: string, event?: MouseEvent): void {
        const tab = menuTab;
        menuTab = null;
        const found = deps.instances().find((one) => one.id === tab);
        if (tab === null || found === undefined) {
            deps.stripPick(id);
            return;
        }
        const file = fileOfTab(found, selectors.docPlaceFor(found));
        if (id.startsWith(`${APP_PICK}:`)) {
            const args = file === null ? [] : [{ root: file.root, path: file.path }];
            void deps.client.appShell.runEntry(appOffers, id, args, event?.altKey === true);
            return;
        }
        if (id === REOPEN_WITH) {
            if (file !== null) void reopen(tab, file, found.preview === true);
            return;
        }
        const dir = deps.roots().find((one) => one.key === file?.root)?.dir ?? '';
        tabPicked(id, {
            close: (kind) => close(kind, tab),
            copy: (which) => {
                if (file !== null) void copier(which, file, dir);
            },
            reveal: () => {
                if (file === null) return;
                void writes.revealPath(file.root, file.path).then((answer) => {
                    if (!answer.ok) said = t('files.reveal_failed', answer.error ?? '');
                });
            },
            showInFiles: () => {
                if (file !== null) layout.showInFiles(file.path, file.root);
            },
            timeline: () => {
                if (file !== null) layout.showTimeline(file.path, file.root);
            },
            bookmark: (add) => {
                if (file !== null) void bookmark(file, add);
            },
            openBrowser: () => {
                if (file !== null) openInBrowserTab(file);
            },
            openPdfTab: () => layout.keepPreview(tab),
            openPdfWindow: () => deps.client.windows.openInWindow(tab, deps.windowBounds?.()),
            openProgram: () => {
                if (file === null) return;
                void writes.openFile(file.root, file.path).then((answer) => {
                    if (!answer.ok) said = t('file.open_failed', answer.error ?? '');
                });
            },
            selectForCompare: () => {
                if (file !== null) explorer.selectForCompare(file);
            },
            compareWith: () => {
                const against = explorer.compareFile();
                if (file !== null && against !== null) {
                    openComparison(layout.openView, file, against);
                }
            },
            keepOpen: () => layout.keepPreview(tab),
            pin: () => layout.pinTab(tab),
            unpin: () => layout.unpinTab(tab),
            split: (edge) => layout.splitInstance(tab, deps.path(), edge, deps.page()),
            moveToWindow: () => {
                const at = deps.windowBounds?.();
                if (at !== undefined) layout.windowTab(tab, at);
            },
            copyToWindow: () => {
                const at = deps.windowBounds?.();
                if (at !== undefined) layout.copyTabToWindow(tab, at);
            }
        });
    }

    return { read, pick, said: () => said };
}
