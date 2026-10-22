// Layer 3, shell. The Open View item of the right-click menu of a pane's strip and of an empty
// pane's body, and what its picks do. Its submenu lists every listed view by the group the Views
// view lists it under, through the same fold (state/workbench/navigation/catalogue.ts `arrange`): a
// submenu per rail page in the rail's order, then the `nav_groups:` groups, then the views no group
// holds with no heading. The views apps add are registrations like any other, so they are listed
// under their group while their app acts. A pick opens the view as a new tab of the pane the menu
// was opened on, and a unique view a page or float holds is shown where it is, as every opener
// shows it; the item names that page or float as its hint. The menu is drawn from the state at the
// right-click and another window may change the layout or the apps while it is open, so a pick
// reads the registry and the holder again and never trusts what was drawn. It lives apart from
// pane-view.ts so stripMenu stays a function of the facts it is handed, and it reads the client as
// close-question.svelte.ts does.

import type { ClientState } from '$lib/state/client/context';
import { t } from '$lib/state/shared/words/text';
import {
    arrange,
    groupGlyph,
    listedViews,
    readGroups
} from '$lib/state/workbench/navigation/catalogue';
import {
    registrationGlyph,
    registrationHeading,
    registrationLabel,
    type Registration
} from '$lib/state/workbench/navigation/registry';
import type { MenuItem } from '$lib/ui/menu/menu-items';

/** What tells a pick of Open View, a view id after it, from every other item of the menu. */
const OPEN_VIEW = 'open-view:';

/** The Open View item itself, which opens its submenu and is never a pick. */
const OPEN_VIEW_LIST = 'open-view-list';

/** What tells a group's submenu in Open View, numbered by its place, which is never a pick. */
const OPEN_VIEW_GROUP = 'open-view-group:';

/** What the Open View item reads of the pane it is drawn for. */
export type OpenViewDeps = {
    client: ClientState;
    /** The page whose tree holds the pane, or the float's id for a float's pane. */
    page: () => string;
    /** The pane's path in that tree. */
    path: () => number[];
};

/** The Open View item of one pane, and the handling of its picks. */
export function createOpenView(deps: OpenViewDeps) {
    const {
        layout: { heldHost, openInPane, openView, pages },
        registry: { viewFor, views },
        selectors: { configMap }
    } = deps.client;

    /**
     * Where a unique view is held, in the words the reader knows the holder by: a page's name, or
     * its number in the page list when it has none, as the move-to-page items name it, or the
     * floating pane's name for a float, which has none of its own. Undefined when nothing holds it.
     */
    function holderWords(view: Registration): string | undefined {
        const host = heldHost(view.id);
        if (host === null) return undefined;
        const all = pages();
        const at = all.findIndex((page) => page.id === host.id);
        if (at < 0) return t('ui.float_label');
        const label = all[at].label;
        return label === '' ? t('ui.page_default', at + 1) : label;
    }

    /**
     * One view as a pick: its name and glyph, the title of the container an app's view is listed
     * under as its hover words, which tell two views of one name apart, and where it is held.
     */
    function viewItem(view: Registration): MenuItem {
        const heading = registrationHeading(view);
        const held = holderWords(view);
        return {
            id: `${OPEN_VIEW}${view.id}`,
            label: registrationLabel(view),
            glyph: registrationGlyph(view),
            ...(heading === '' ? {} : { title: heading }),
            ...(held === undefined ? {} : { hint: held })
        };
    }

    /** The Open View item, its submenu built from the state as it is now. */
    function item(): MenuItem {
        // Until the config has come the map is empty, which reads as no group, so every listed view
        // is listed with no heading.
        const sections = arrange(listedViews(views()), readGroups(configMap()));
        const groups = sections.flatMap((section, at) =>
            section.label === null
                ? []
                : [
                      {
                          id: `${OPEN_VIEW_GROUP}${at}`,
                          label: section.label,
                          glyph: groupGlyph(section),
                          items: section.items.map(viewItem)
                      }
                  ]
        );
        const loose = sections
            .filter((section) => section.label === null)
            .flatMap((section) => section.items.map(viewItem));
        return { id: OPEN_VIEW_LIST, label: t('ui.strip_open_view'), items: [...groups, ...loose] };
    }

    /**
     * Run a pick of Open View and answer true, or answer false for an id of another item. A view
     * the registry does not hold or does not list at the pick, an app's view whose app was removed
     * or stopped acting while the menu was open, opens nothing. A unique view a page or float holds
     * at the pick is shown there; any other view opens as a new tab of this pane.
     */
    function picked(id: string): boolean {
        if (!id.startsWith(OPEN_VIEW)) return false;
        const view = id.slice(OPEN_VIEW.length);
        const registration = viewFor(view);
        if (registration === undefined || listedViews([registration]).length === 0) return true;
        if (heldHost(view) !== null) openView(view);
        else openInPane(view, undefined, deps.page(), deps.path());
        return true;
    }

    return { item, picked };
}
