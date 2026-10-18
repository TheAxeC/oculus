// Layer 3, view partial of tree/Tree.svelte. What a pick on a row runs: the right-click menu of a
// row (menu/row-menu.ts), the file operations the menu and the keys start (menu/row-ops.ts), the
// name being typed (menu/row-ops.ts's rowNaming) and the drops (menu/row-drop.ts), all over the
// explorer store, and the hub and project controls (making.svelte.ts).
//
// The entries apps add to `explorer/context` end the menu of a row, run with the row's root and
// path.
//
// It holds the refusal line a pick said, until the next pick, and hands it to the caller's
// `onrefused` when the caller says refusals on a line of its own, and the row a menu or a key was
// opened on, which the pick the menu hands back acts on.

import type { ClientState } from '$lib/state/client/context';
import type { CommandSource, ProjectCommand } from '$lib/state/sessions/terminal/commands.svelte';
import {
    languageOf,
    nameOf,
    shownOf,
    type FsEntry,
    type FsRoot,
    type TreeRow
} from '$lib/state/sources/fs';
import type { DeckEditAct } from '$lib/state/shared/stores/shapes';
import { rowsActed } from '$lib/state/sources/explorer/acts/selection';
import { confirmDelete } from '$lib/state/sources/explorer/acts/confirm';
import { writingFixOffered } from '$lib/state/sources/explorer/acts/writing-fix';
import { absoluteOf, openComparison } from '$lib/state/workbench/navigation/pages';
import { t } from '$lib/state/shared/words/text';
import type { MenuItem } from '$lib/ui/menu/menu-items';
import { targetOf } from '../drag';
import { rowDropper } from '../menu/row-drop';
import {
    ROW_MAKE_HUB,
    ROW_MAKE_PROJECT,
    ROW_WRITING_FIX,
    rootNameIn,
    rowFacts,
    rowMenu,
    rowPicker,
    rowStores
} from '../menu/row-menu';
import { holdsContents, rowNaming, rowOpsPicker, shownAt, type NamingHooks } from '../menu/row-ops';
import { landingRefusal } from '$lib/state/sources/explorer/notes/note-tree';
import type { Asking } from './asking.svelte';
import { createFixing } from './fixing.svelte';
import { createMaking } from './making.svelte';
import type { ViewAccess } from './view-access';

/** What the ids of the choices apps add to the menu start with. */
const APP_PICK = 'app';

export type PicksDeps = {
    client: ClientState;
    view: ViewAccess;
    asking: Asking;
    rows: () => TreeRow[];
    roots: () => FsRoot[] | undefined;
    /** The root keys a removal refuses. */
    fixed: () => string[];
    /** Whether Add Folder to Workspace is offered, and what it runs. */
    addable: () => boolean;
    addRoot: () => void;
    removeRoot: (root: string) => void;
    /** Bookmark a row, or take its bookmark out. */
    bookmark: (row: TreeRow) => void;
    /** Whether a row is bookmarked. */
    isMarked: (row: TreeRow) => boolean;
    /** The key hints the menu shows at its items' right. */
    hints: Record<string, string>;
    /** Whether a row is part of what is selected, a segment of a folder chain included. */
    isSelected: (row: TreeRow) => boolean;
    /** A plain press moved the cursor to a row. */
    select: (row: TreeRow) => void;
    /**
     * Say a refusal, or its end with the empty text, on the caller's own line; `told` is true for
     * a result that went through whole, which the line draws as information.
     */
    onrefused?: (note: string, told: boolean) => void;
    /** What the tree does with a typed name beyond the Files tree's (the Notes section's notes). */
    naming?: NamingHooks;
    /** Open a file New File... made, as a kept tab in the editor. */
    opened?: (file: { root: string; path: string }) => void;
    /** Bring a row the tree selected into view and focus it, once it is drawn. */
    shown?: (row: { root: string; path: string }) => void;
};

export type Picks = ReturnType<typeof createPicks>;

export function createPicks(deps: PicksDeps) {
    const { client, view, asking } = deps;
    const { explorer } = client;

    /** A pick the server refused, said until the next pick. */
    let refused = $state('');
    /** Whether `refused` says a result that went through whole rather than a refusal. */
    let told = $state(false);

    /** The row a menu or a key acts on; a segment of a folder chain when one was pressed. */
    let target: TreeRow | null = null;

    /** Set the refusal line and hand it to the caller; the end of no line is not handed on. */
    const say = (note: string, whole = false): void => {
        if (note === '' && refused === '') return;
        refused = note;
        told = whole;
        deps.onrefused?.(note, whole);
    };

    /** The absolute folder of a root or folder row that is a repository, else null. */
    function repoOf(row: TreeRow): string | null {
        if (row.kind === 'file') return null;
        const dir = deps.roots()?.find((one) => one.key === row.root)?.dir ?? '';
        const folder = absoluteOf(dir, row.path);
        return client.selectors.gitRoots().includes(folder) ? folder : null;
    }

    /** The rows a pick on a row acts on: the selection when the row is in it. */
    const acted = (row: TreeRow): TreeRow[] => rowsActed(view.picked(), deps.rows(), row);

    const stores = rowStores(client);

    const fixing = createFixing(client);

    const making = createMaking(client, say);

    /**
     * One act that makes a deck, then the deck shown in a Present tab named as the folder is: the
     * sentence for why nothing was made, and the empty string once the deck is shown.
     */
    async function deckMade(act: DeckEditAct, root: string): Promise<string> {
        const answer = await client.writes.writeDeckEdit(act, true);
        if (!answer.ok || answer.refused.length > 0 || answer.id === undefined) {
            return answer.refused.at(0)?.reason ?? answer.error ?? t('present.failed_network');
        }
        const label = answer.id === '' ? rootNameIn(deps.rows(), root) : nameOf(answer.id);
        stores.showDeck({ root, path: answer.id }, label);
        return '';
    }

    const menuPicked = rowPicker(
        {
            ...stores,
            dirOf: (root: string) => deps.roots()?.find((one) => one.key === root)?.dir ?? '',
            rootName: (root: string) => rootNameIn(deps.rows(), root),
            say,
            bookmark: deps.bookmark,
            addRoot: deps.addRoot,
            removeRoot: deps.removeRoot,
            addApp: (folder: string) => void client.apps.addPath(folder),
            runCommand: (repo: string, name: string, source: CommandSource) =>
                void client.commands.press(repo, name, source),
            acting: acted
        },
        t
    );

    const naming = rowNaming(
        {
            explorer,
            view: view.now,
            patch: view.patch,
            say,
            entries: (root: string, path: string) =>
                client.fs.heldEntries(root, path, shownOf(view.now())),
            deck: (folder, title) =>
                deckMade(
                    { act: 'create', root: folder.root, folder: folder.path, title },
                    folder.root
                ),
            refuse: (root: string, path: string) =>
                landingRefusal(
                    client.fs.roots().some((one) => one.key === root && one.hub === true),
                    path,
                    t
                ),
            open: (file) => deps.opened?.(file),
            get hooks() {
                return deps.naming;
            }
        },
        t
    );

    const opsPicked = rowOpsPicker(
        {
            explorer,
            say,
            confirm: asking.ask,
            choose: asking.choose,
            startName: naming.start,
            outline: (file) =>
                deckMade({ act: 'outline', root: file.root, file: file.path }, file.root),
            openCompare: (file, against) => openComparison(client.layout.openView, file, against),
            draftOf: (row: TreeRow) =>
                explorer.unsaved({ root: row.root, path: row.path }, holdsContents(row)),
            selected: () =>
                target === null
                    ? []
                    : acted(target)
                          .filter((one) => one.kind === 'file')
                          .map((one) => ({ root: one.root, path: one.path })),
            acting: acted,
            confirmDelete: () => confirmDelete(client.selectors.configMap()),
            reveal: (item) => {
                view.patch(shownAt(view.now().expanded, item));
                deps.shown?.(item);
            }
        },
        t
    );

    const dropper = rowDropper({ explorer, say, confirm: asking.ask }, t);

    /** The entries of `explorer/context` the open menu ends with. */
    let appOffers: ReturnType<ClientState['appShell']['choices']>['offers'] = [];

    /** Run a pick on a row: an app's, else the menu's, then the file operations'. */
    function run(row: TreeRow, pick: string, alt = false): void {
        say('');
        target = row;
        if (pick.startsWith(`${APP_PICK}:`)) {
            void client.appShell.runEntry(
                appOffers,
                pick,
                [{ root: row.root, path: row.path }],
                alt
            );
            return;
        }
        if (pick === ROW_WRITING_FIX) void fixing.start(row, rootNameIn(deps.rows(), row.root));
        const label = row.path === '' ? rootNameIn(deps.rows(), row.root) : nameOf(row.path);
        if (pick === ROW_MAKE_HUB) void making.startHub(row, label);
        if (pick === ROW_MAKE_PROJECT) void making.project(row);
        menuPicked(row, pick);
        opsPicked(row, pick);
    }

    /** Run the pick a menu handed back on the row it was opened on. */
    function pickTarget(pick: string, event?: MouseEvent): void {
        if (target !== null) run(target, pick, event?.altKey === true);
    }

    /**
     * The menu of a row: a right-click on a row outside the selection selects it first. A row that
     * is a repository has its list of commands read when its menu opens, not before, and a folder
     * or root whose listing is not held has its listing read then too, which says whether Open
     * Presentation or New Presentation is offered. A folder or root alone in the selection offers
     * Make Folder a Hub... and Make Folder a Project by the marks the page holds of it
     * (making.svelte.ts), so those two items are in the menu as it opens, with no request. The
     * menu is returned at once, as reactive items that the Run Command submenu and the
     * presentation items join when their answers arrive, whichever lands first. A read that fails
     * leaves the menu as it was.
     */
    function menuOf(row: TreeRow, event: MouseEvent) {
        const here = targetOf(row, event);
        target = here;
        if (!deps.isSelected(here)) deps.select(here);
        const group = acted(here);
        const repo = repoOf(here);
        const shown = shownOf(view.now());
        let commandsRead: readonly ProjectCommand[] = [];
        let listingRead: FsEntry[] | null = null;
        const offered =
            here.kind !== 'file' && here.up !== true && group.length === 1
                ? making.offerAt(here, shown)
                : null;
        const apps = client.appShell.choices(
            'explorer/context',
            {
                resource: {
                    root: here.root,
                    path: here.path,
                    language: languageOf(here.path, client.selectors.languages())
                },
                folder: here.kind !== 'file'
            },
            APP_PICK
        );
        appOffers = apps.offers;
        const built = (): MenuItem[] => [
            ...rowMenu(
                rowFacts(
                    here,
                    deps.fixed(),
                    deps.addable(),
                    explorer,
                    client.selectors.languages(),
                    {
                        size: group.length,
                        files: group.filter((one) => one.kind === 'file').length
                    },
                    deps.hints,
                    (root: string, path: string) =>
                        client.fs.heldEntries(root, path, shown) ?? listingRead,
                    commandsRead,
                    client.selectors.programApps(),
                    deps.isMarked(here),
                    writingFixOffered(client.selectors.configMap()),
                    client.folders.served(here.root),
                    client.appShell.editorsOf(here.root, here.path).length > 0,
                    offered
                ),
                t
            ),
            ...apps.items
        ];
        const items: MenuItem[] = $state(built());
        const rebuild = (): void => {
            items.splice(0, items.length, ...built());
        };
        if (repo !== null) {
            void client.commands.load(repo).then((answer) => {
                commandsRead = answer.commands;
                rebuild();
            });
        }
        if (here.kind !== 'file' && client.fs.heldEntries(here.root, here.path, shown) === null) {
            void client.fs.readListing(here.root, here.path, shown).then((answer) => {
                if (answer.error !== '') return;
                listingRead = answer.entries;
                rebuild();
            });
        }
        return items;
    }

    return {
        refused: () => refused,
        told: () => told,
        clear: () => say(''),
        say,
        acted,
        naming,
        dropper,
        fixing,
        making,
        run,
        pickTarget,
        menuOf
    };
}
