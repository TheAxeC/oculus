// Layer 3, view helper of views/sources/repositories/diff/DiffSection.svelte. The actions an app's
// source control offers on one change, the entries of the app's `scm/change/title` menu, while a
// diff compares a file with the original that source control gives. Each hunk bar of the diff draws
// them (diff/HunkBar.svelte), and pressing one runs its command in the app's host with the file,
// the diff's line changes and the index of the hunk's first change among them.

import type { Hunk, LineChange } from '$lib/state/sources/repositories/diff/diff-hunks';
import type { ClientState } from '$lib/state/client/shapes/client-state';

/** What the offers are read from: the app stores, and the diff's source, file and changes. */
export type ChangeOffersFrom = {
    appShell: ClientState['appShell'];
    appTools: ClientState['appTools'];
    /** The app source control the diff compares with, or undefined for a diff of git's. */
    source: () => { app: string; id: string } | undefined;
    root: () => string;
    path: () => string;
    changes: () => LineChange[];
};

/** The actions on offer, null while no app source control is compared with, and how one runs. */
export type ChangeOffers = {
    readonly actions: ReturnType<ClientState['appShell']['strip']>['actions'] | undefined;
    /** Run the entry an action stands for on a hunk's changes, `alt` when Alt was held. */
    offer: (hunk: Hunk, pick: string, alt: boolean) => void;
};

export function createChangeOffers(from: ChangeOffersFrom): ChangeOffers {
    /** The app source control the diff compares with, while it exists. */
    const control = $derived.by(() => {
        const source = from.source();
        return source === undefined ? undefined : from.appTools.scm.stateOf(source.app, source.id);
    });
    /** The actions the control's app offers on a change. */
    const offered = $derived(
        control === undefined
            ? null
            : from.appShell.strip('scm/change/title', { keys: { scmProvider: control.id } })
    );

    function offer(hunk: Hunk, pick: string, alt: boolean): void {
        if (control === undefined || offered === null) return;
        const changes = from.changes();
        void from.appTools.scm.execute(
            control,
            offered.offers,
            pick,
            {
                scope: 'change',
                change: {
                    root: from.root(),
                    path: from.path(),
                    changes: $state.snapshot(changes),
                    index: Math.max(0, changes.indexOf(hunk.changes[0]))
                }
            },
            alt
        );
    }

    return {
        get actions() {
            return offered?.actions;
        },
        offer
    };
}
