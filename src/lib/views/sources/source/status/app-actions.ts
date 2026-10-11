// Layer 3, view partial of Source.svelte. The apps' entries of the `editor/context` menu as editor
// actions: an entry of the group `navigation` joins the editor's own `navigation` group at the top
// of the right-click menu, as VS Code places it, and every other entry is listed under a group of
// its own that sorts after the editor's. Each runs its command with the file as `{ root, path }`.
// The groups keep the order the menu gives them (state/system/apps/shell/contributions.ts
// `menuOffers`).

import type { MenuOffer } from '$lib/state/system/apps/shell/contributions';
import type { EditorOwnAction } from '$lib/ui/controls/editor/types';

/** The group ids of the entries, which sort after every group the editor names itself. */
const GROUP = 'zz_app_';

/** The group the editor's menu draws first, VS Code's and Monaco's name for it. */
const NAVIGATION = 'navigation';

/** The editor actions the entries stand for, with the command each runs for the file. */
export function appEditorActions(
    offers: readonly MenuOffer[],
    file: { root: string; path: string },
    run: (offer: MenuOffer, args: unknown[]) => void
): EditorOwnAction[] {
    const groups: string[] = [];
    return offers.map((offer, at) => {
        if (!groups.includes(offer.group)) groups.push(offer.group);
        return {
            id: `app.${offer.app}.${offer.command.command}.${at}`,
            label: offer.command.title,
            menu:
                offer.group === NAVIGATION
                    ? NAVIGATION
                    : `${GROUP}${String(groups.indexOf(offer.group)).padStart(3, '0')}`,
            order: at,
            run: () => run(offer, [{ root: file.root, path: file.path }])
        };
    });
}
