// Layer 3, view partial of tree/Tree.svelte. What a pick on a row runs: the right-click menu of a
// row (menu/row-menu.ts), the file operations the menu and the keys start (menu/row-ops.ts), the
// name being typed (menu/row-ops.ts's rowNaming) and the drops (menu/row-drop.ts), all over the
// explorer store.
//
// It holds the refusal line a pick said, until the next pick, and the row a menu or a key was
// opened on, which the pick the menu hands back acts on.

import type { ClientState } from '$lib/state/client/context';
import { nameOf, shownOf, type FsRoot, type TreeRow } from '$lib/state/sources/fs';
import { rowsActed } from '$lib/state/sources/explorer/acts/selection';
import { confirmDelete } from '$lib/state/sources/explorer/acts/confirm';
import { diffState } from '$lib/state/sources/repositories/repositories';
import { DIFF_VIEW } from '$lib/state/sources/repositories/repositories.svelte';
import { t } from '$lib/state/shared/words/text';
import { targetOf } from '../drag';
import { rowDropper } from '../menu/row-drop';
import { rowFacts, rowMenu, rowPicker, rowStores } from '../menu/row-menu';
import { holdsContents, rowNaming, rowOpsPicker } from '../menu/row-ops';
import type { Asking } from './asking.svelte';
import type { ViewAccess } from './view-access';

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
    /** The key hints the menu shows at its items' right. */
    hints: Record<string, string>;
    /** Whether a row is part of what is selected, a segment of a folder chain included. */
    isSelected: (row: TreeRow) => boolean;
    /** A plain press moved the cursor to a row. */
    select: (row: TreeRow) => void;
};

export type Picks = ReturnType<typeof createPicks>;

export function createPicks(deps: PicksDeps) {
    const { client, view, asking } = deps;
    const { explorer } = client;

    /** A pick the server refused, said above the rows until the next pick. */
    let refused = $state('');

    /** The row a menu or a key acts on; a segment of a folder chain when one was pressed. */
    let target: TreeRow | null = null;

    const say = (note: string): void => {
        refused = note;
    };

    /** The rows a pick on a row acts on: the selection when the row is in it. */
    const acted = (row: TreeRow): TreeRow[] => rowsActed(view.picked(), deps.rows(), row);

    const menuPicked = rowPicker(
        {
            ...rowStores(client),
            dirOf: (root: string) => deps.roots()?.find((one) => one.key === root)?.dir ?? '',
            say,
            addRoot: deps.addRoot,
            removeRoot: deps.removeRoot,
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
                client.fs.heldEntries(root, path, shownOf(view.now()))
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
            openCompare: (file, against) => {
                client.layout.openView(
                    DIFF_VIEW,
                    diffState(
                        {
                            root: file.root,
                            path: file.path,
                            staged: false,
                            worktree: false,
                            against
                        },
                        t('files.compare_title', nameOf(against.path), nameOf(file.path))
                    )
                );
            },
            draftOf: (row: TreeRow) =>
                explorer.unsaved({ root: row.root, path: row.path }, holdsContents(row)),
            selected: () =>
                target === null
                    ? []
                    : acted(target)
                          .filter((one) => one.kind === 'file')
                          .map((one) => ({ root: one.root, path: one.path })),
            acting: acted,
            confirmDelete: () => confirmDelete(client.selectors.configMap())
        },
        t
    );

    const dropper = rowDropper({ explorer, say, confirm: asking.ask }, t);

    /** Run a pick on a row: the menu's, then the file operations'. */
    function run(row: TreeRow, pick: string): void {
        refused = '';
        target = row;
        menuPicked(row, pick);
        opsPicked(row, pick);
    }

    /** Run the pick a menu handed back on the row it was opened on. */
    function pickTarget(pick: string): void {
        if (target !== null) run(target, pick);
    }

    /** The menu of a row: a right-click on a row outside the selection selects it first. */
    function menuOf(row: TreeRow, event: MouseEvent) {
        const here = targetOf(row, event);
        target = here;
        if (!deps.isSelected(here)) deps.select(here);
        const group = acted(here);
        return rowMenu(
            rowFacts(
                here,
                deps.fixed(),
                deps.addable(),
                explorer,
                client.selectors.languages(),
                { size: group.length, files: group.filter((one) => one.kind === 'file').length },
                deps.hints
            ),
            t
        );
    }

    return {
        refused: () => refused,
        clear: () => {
            refused = '';
        },
        say,
        acted,
        naming,
        dropper,
        run,
        pickTarget,
        menuOf
    };
}
