// Layer 3, view partial of Source.svelte. The actions the tab hands its editor, which the editor
// binds to their keys and lists in its right-click menu: the tab's own that apply now
// (tab-asks.svelte.ts), then one per source control of an app that gives the file a quick diff,
// then the entries apps add to `editor/context` for the tab (app-actions.ts). Source.svelte derives
// the list from this function, so it is made again whenever anything the function reads changes.

import type { ClientState } from '$lib/state/client/context';
import type { Instance } from '$lib/state/workbench/layout';
import type { EditorOwnAction } from '$lib/ui/controls/editor/types';
import { appEditorActions, quickDiffActions } from './app-actions';

/** The editor actions of one tab over the file `{ root, path }` in the language it paints in. */
export function tabEditorActions(
    client: Pick<ClientState, 'appShell' | 'appTools' | 'repositories'>,
    instance: Pick<Instance, 'id' | 'view' | 'state'>,
    own: readonly EditorOwnAction[],
    file: { root: string; path: string },
    language: string
): EditorOwnAction[] {
    const { appShell } = client;
    const tab = { id: instance.id, view: instance.view, state: instance.state };
    return [
        ...own,
        ...quickDiffActions(client.appTools.scm.sources(), file, client.repositories.openDiff),
        ...appEditorActions(
            appShell.menu('editor/context', appShell.place(tab, { language }, true)),
            file,
            (offer, args) => void appShell.runOffer(offer, args)
        )
    ];
}
