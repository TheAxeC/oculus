// Layer 3, view helper of Settings.svelte beside this file. The ask a Settings tab is opened with
// to show one row, `reveal` in the tab's state, the row's id (state/system/config/typed.ts
// `settingsReveal`): the rail's Settings choice asks for the rail row (`RAIL_ROW`), and the tag
// of a resource's page that names the `slurm.resource` setting asks for that setting's row.
//
// While the ask stands, the row is in the rows the query keeps (`keep`), and a scope on screen
// that does not draw the row is set once to the one that does, from the layer the row's value
// lives in: Workspace for a workspace option, the primary hub's Hub scope for an option of the hub
// list and the primary's This machine for a machine key; a repository's row leaves the scope as
// it is. Once the row is shown the view clears a query that would have hidden it, waits for the
// mounted rows' `hidden` attributes, opens the folded group the row is in, scrolls the row into
// view and ends the ask. The row waits to be shown while its file is not read yet. An ask for
// another row written during that wait is left standing and shown next, and an ended ask frees
// its row, so asking for the same row again in an open tab sets its scope again.

import { tick, untrack } from 'svelte';
import type { Group } from '$lib/state/system/config/groups';
import { searchGroups } from '$lib/state/system/config/search';
import type { Scope } from '$lib/state/system/config/scopes/scope';

/** What the reveal reads from the view and what it asks the view to do. */
type RevealDeps = {
    /** The id of the row the tab asks to show, or undefined for no ask. */
    asked: () => string | undefined;
    /** The groups of every row, before the scope on screen keeps its own. */
    made: () => Group[];
    /** The groups the scope on screen draws. */
    groups: () => Group[];
    /** The groups with the rows the query keeps, the asked row among them. */
    found: () => Group[];
    query: () => string;
    /** The folder name of the primary hub, or null while there is none. */
    primary: () => string | null;
    pickScope: (next: Scope) => void;
    setQuery: (query: string) => void;
    /** The list's scrolled area, undefined before it is mounted. */
    list: () => HTMLElement | undefined;
    /** Open the folded group that holds a row. */
    unfold: (id: string) => Promise<void>;
    /** Take the ask out of the tab's state. */
    end: () => void;
};

/** Whether groups hold the row `id`. */
function holds(groups: Group[], id: string): boolean {
    return groups.some((group) =>
        group.sections.some((section) => section.rows.some((row) => row.id === id))
    );
}

/** The scope that draws a row of the layer `layer`, or null for one the layer does not name. */
function scopeOf(layer: string | undefined, primary: string | null): Scope | null {
    if (layer === 'workspace') return { kind: 'workspace' };
    if (primary === null) return null;
    if (layer === 'hub') return { kind: 'hub', hub: primary };
    if (layer === 'local') return { kind: 'local', hub: primary };
    return null;
}

/** The layer the value of the row `id` lives in, or undefined for a row of no layer. */
function layerOf(groups: Group[], id: string): string | undefined {
    for (const group of groups) {
        for (const section of group.sections) {
            const row = section.rows.find((one) => one.id === id);
            if (row?.kind === 'config') return row.place.layer;
        }
    }
    return undefined;
}

/**
 * Run the reveal of a Settings tab. Called once while the view is set up; `keep` is the ids of the
 * rows the query keeps for the ask, none without one.
 */
export function useReveal(deps: RevealDeps): { keep: () => string[] } {
    /** The ask the scope was last set for, so a scope is set once for each ask. */
    let scoped: string | undefined;

    $effect(() => {
        const id = deps.asked();
        // An ended ask frees its row, so a later ask for the same row picks its scope again.
        if (id === undefined) scoped = undefined;
        if (id === undefined || id === scoped || holds(deps.groups(), id)) return;
        const next = scopeOf(layerOf(deps.made(), id), deps.primary());
        if (next === null) return;
        scoped = id;
        untrack(() => deps.pickScope(next));
    });

    /**
     * Clear a query that hides the row, wait for the rows, scroll to it and end the ask. An ask for
     * another row written while it waits is left standing, and shown in its turn.
     */
    async function show(area: HTMLElement, id: string, hidden: boolean): Promise<void> {
        if (hidden) deps.setQuery('');
        await tick();
        await deps.unfold(id);
        if (deps.asked() !== id) return;
        area.querySelector<HTMLElement>(`[data-setting="${id}"]`)?.scrollIntoView({
            block: 'start'
        });
        deps.end();
    }

    // The reveal waits for the row to be shown: its file may not have been read yet.
    $effect(() => {
        const id = deps.asked();
        const area = deps.list();
        if (id === undefined || area === undefined || !holds(deps.found(), id)) return;
        const query = deps.query();
        const hidden = query !== '' && !holds(searchGroups(deps.groups(), query).groups, id);
        // Untracked whole: `setQuery` reads the instance state it writes, which would run the
        // effect a second time.
        untrack(() => void show(area, id, hidden));
    });

    return {
        keep: () => {
            const id = deps.asked();
            return id === undefined ? [] : [id];
        }
    };
}
