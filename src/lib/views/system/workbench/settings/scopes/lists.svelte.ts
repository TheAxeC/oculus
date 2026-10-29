// Layer 3, view helper. The lists the controls of a Settings view draw from
// (state/system/config/editors/sources.ts), built from the stores the page holds: over the merged
// configuration with the records and the folders of the primary, and for a row of the Hub scope's
// hub other than the primary over that hub's own settings with its records and folders, once they
// are read. A list that is not there yet is drawn as loading. Made while the view is set up, since
// it reads the page's stores from the context.

import { useState } from '$lib/state/client/use';
import { listsOf, type Folder, type Lists } from '$lib/state/system/config/editors/sources';
import type { Row } from '$lib/state/system/config/groups';
import { themeClasses } from '$lib/ui/theme/theme';

/** What the lists are built over. */
export type ListsDeps = {
    /** The merged configuration of the config channel. */
    merged: () => Record<string, unknown>;
    /** The folder name of the primary hub, or null while there is none. */
    primary: () => string | null;
    /** The Hub scope's hub other than the primary, or null. */
    hub: () => string | null;
    /** The merged configuration of a hub's settings, null while they are not read. */
    hubConfig: (hub: string) => Record<string, unknown> | null;
    /** One folder of a hub, by its path under the hub. */
    folderIn: (root: string | null, path: string) => Folder;
};

/** The lists of a view: the primary's, and those a row's controls draw from. */
export type ScopeLists = {
    lists: () => Lists;
    listsFor: (row: Row) => Lists;
};

/** Build the lists of a Settings view. */
export function scopeLists(deps: ListsDeps): ScopeLists {
    const {
        appShell,
        entities: { config, portfolio, usage },
        registry
    } = useState();

    /** The body classes the theme sheets hold a block for, read once from the sheets. */
    const classes = themeClasses();

    /** The lists over a merged configuration, with the records and folders of the hub `root`. */
    function listsWith(over: Record<string, unknown>, root: string | null): Lists {
        const snapshot = portfolio();
        return listsOf({
            config: over,
            portfolio:
                snapshot === null
                    ? null
                    : {
                          primary: root,
                          domains: snapshot.entities.domains,
                          resources: snapshot.entities.resources,
                          people: snapshot.entities.people,
                          projects: Object.values(snapshot.entities.projects)
                      },
            views: registry.views().map((one) => one.id),
            tiers: usage()?.accounts.map((account) => account.tier) ?? null,
            themeClasses: classes,
            codeThemeClasses: config()?.codeThemeClasses ?? [],
            offers: appShell.offers(),
            folder: (path) => deps.folderIn(root, path)
        });
    }

    const lists = $derived(listsWith(deps.merged(), deps.primary()));

    const hubLists = $derived.by(() => {
        const hub = deps.hub();
        return hub === null ? null : listsWith(deps.hubConfig(hub) ?? deps.merged(), hub);
    });

    return {
        lists: () => lists,
        listsFor: (row) => {
            const hub = deps.hub();
            if (row.kind !== 'config' || row.hub === undefined || row.hub !== hub) return lists;
            return hubLists ?? lists;
        }
    };
}
