// Layer 3, shell. What the workbench's keys ask of the source tab on screen: whether a debug key
// may set a breakpoint in its file (the debug store takes the file), and what the save key does,
// which is the editor's own save action for a source tab, what the tab's views registered for it
// (a Settings tab's rail list, editor drafts and typed field texts), and the app's save for a tab
// whose views registered nothing.

import type { ClientState } from '$lib/state/client/context';
import { SAVE_ACTION, sourceOnScreen } from '$lib/state/workbench/navigation/editor-status.svelte';

/** The two answers for the tab `active()` names. */
export function sourceKeys(
    client: Pick<ClientState, 'debug' | 'apps' | 'editorStatus' | 'ui'>,
    active: () => { id: string; view: string } | null
): { breakpointFileOnScreen: () => boolean; saveSource: () => void } {
    return {
        breakpointFileOnScreen: () => {
            const file = sourceOnScreen(active(), client.editorStatus.statusOf)?.status.file;
            return file !== undefined && client.debug.takes(file);
        },
        saveSource: () => {
            const tab = sourceOnScreen(active(), client.editorStatus.statusOf);
            const id = active()?.id ?? '';
            if (tab !== null)
                client.editorStatus.ask(tab.instance, { kind: 'action', id: SAVE_ACTION });
            else if (!client.ui.saveTab(id)) void client.apps.save(id);
        }
    };
}
