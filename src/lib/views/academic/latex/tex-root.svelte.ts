// Layer 3, view partial of the TeX view. Which main file the view is about: the one the file tab
// the reader looked at last on the page builds through (the view follows the active LaTeX editor,
// as LaTeX Workshop's outline does), or one the reader picked from the roots this page has seen,
// which the view keeps in its state as `{ root, path, main }`. A saved tab of the folder-only view
// has `{ root, path }` and no main: it names that folder's first main file. A pin at a root the
// page's workspace does not serve names no file, so no root is asked of the server.
//
// The followed tab is read through `followedTab` (state/sources/explorer/sections/followed-tab.ts):
// a source tab of a LaTeX file, or a PDF tab of a build, and for the editing commands the source
// tab alone. The root of its file is asked of the server (`rootOfFile`), again whenever the saved
// text changes, since a root comment is part of the answer.

import type { ClientState } from '$lib/state/client/context';
import type { FollowTab } from '$lib/state/sources/explorer/sections/followed-tab';
import type { LatexRoot } from '$lib/state/sessions/latex/latex-state';
import type { LatexTarget } from '$lib/state/sessions/terminal/latex-target';
import { servesRoot } from '$lib/state/sources/fs-transport';
import { instanceMap, instanceText } from '$lib/state/workbench/layout/instance';
import { fileOfTab } from '$lib/state/workbench/navigation/pages';
import type { ViewProps } from '$lib/state/workbench/navigation/registry';
import { createFollowed } from '../../shared/latex/followed.svelte';
import { inFolder } from '../../shared/latex/places';
import { takeRoot } from '../../shared/latex/root-answer';
import { t } from '$lib/state/shared/words/text';

/** The id of the choice that goes back to following the active editor. */
const FOLLOW = 'follow';

/** One root the view can be pointed at. */
type RootChoice = { id: string; label: string };

/** What the view reads of its root. */
export type TexRoot = {
    /** The main file the view is about, or null while it is asked or when there is none. */
    readonly found: NonNullable<LatexRoot> | null;
    /** The folder of the root as the store reads it, or null with no root. */
    readonly target: (LatexTarget & { root: string; path: string }) | null;
    /** Whether the reader pointed the view at a root, so it does not follow the editor. */
    readonly pinned: boolean;
    /** The key of the pinned root when this page does not serve it, else the empty text. */
    readonly gone: string;
    /** The source tab of a LaTeX file the editing commands act on, or null. */
    readonly source: FollowTab | null;
    /** The file that tab shows, against its root, or null. */
    readonly sourceFile: { root: string; path: string } | null;
    /** The roots to pick from, the first being the way back to following the editor. */
    readonly choices: RootChoice[];
    /** The id of the choice in force. */
    readonly chosen: string;
    pick: (id: string) => void;
};

/** The identity of a root as a choice's id. */
function idOf(one: { root: string; path: string; main: string }): string {
    return JSON.stringify([one.root, one.path, one.main]);
}

/** Reads a value, so the effect that calls it runs again when the value changes. */
function reads(_value: unknown): void {
    // The call is the read.
}

/** Make the root reading of one TeX view. */
export function createTexRoot(input: {
    client: ClientState;
    instance: () => ViewProps['instance'];
}): TexRoot {
    const { client } = input;
    const {
        latex,
        latexActions,
        fs,
        layout: { restateInstance },
        source: { sourceDraft }
    } = client;

    const followed = createFollowed(client);
    const tab = $derived(followed.any);
    const source = $derived(followed.source);

    const state = $derived(input.instance().state);
    const pin = $derived({
        root: instanceText(state, 'root'),
        path: instanceText(state, 'path'),
        main: instanceText(state, 'main')
    });
    const pinned = $derived(pin.root !== '');
    /** The key of the pinned root while no root of this page's workspace carries it. */
    const gone = $derived(pinned && !servesRoot(fs.workspaces(), pin.root) ? pin.root : '');
    /** The main of a pin that names none: the first of its folder. */
    const mainOfPin = $derived(
        pin.main !== ''
            ? pin.main
            : pinned && gone === ''
              ? (latex.state({ root: pin.root, path: pin.path }).mains[0]?.main ?? '')
              : ''
    );

    /** The file whose root the view is about. */
    const file = $derived.by(() => {
        if (pinned) {
            return gone !== '' || mainOfPin === ''
                ? null
                : { root: pin.root, path: inFolder(pin.path, mainOfPin) };
        }
        return tab === null ? null : fileOfTab(tab);
    });

    let found = $state<NonNullable<LatexRoot> | null>(null);

    $effect(() => {
        const at = file;
        // The saved text of the followed tab holds its root comment.
        if (!pinned && tab?.view === 'source') reads(sourceDraft(tab.id).saved);
        if (at === null) {
            found = null;
            return;
        }
        return takeRoot(latexActions.rootOfFile(at.root, at.path), (answer) => (found = answer));
    });

    const choices = $derived<RootChoice[]>([
        { id: FOLLOW, label: t('latex.follow_editor') },
        ...latexActions.roots().map((one) => ({
            id: idOf(one),
            label: inFolder(one.path, one.main)
        }))
    ]);
    const chosen = $derived(
        pinned ? idOf({ root: pin.root, path: pin.path, main: mainOfPin }) : FOLLOW
    );

    function pick(id: string): void {
        const rest = Object.fromEntries(
            Object.entries(instanceMap(state)).filter(
                ([key]) => key !== 'root' && key !== 'path' && key !== 'main' && key !== 'label'
            )
        );
        if (id === FOLLOW) {
            restateInstance(input.instance().id, rest);
            return;
        }
        const named: unknown = JSON.parse(id);
        if (!Array.isArray(named) || named.length !== 3) return;
        const [root, path, main] = named as [string, string, string];
        restateInstance(input.instance().id, { ...rest, root, path, main });
    }

    return {
        get found() {
            return found;
        },
        get target() {
            return found === null ? null : { root: found.root, path: found.path };
        },
        get pinned() {
            return pinned;
        },
        get gone() {
            return gone;
        },
        get source() {
            return source;
        },
        get sourceFile() {
            return source === null ? null : fileOfTab(source);
        },
        get choices() {
            return choices;
        },
        get chosen() {
            return chosen;
        },
        pick
    };
}
