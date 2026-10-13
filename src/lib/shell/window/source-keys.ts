// Layer 3, shell. What the workbench's keys ask of the source tab on screen: whether a debug key
// may set a breakpoint in its file (the debug store takes the file), and what the save key does,
// which is the editor's own save action for a source tab and the app's save for any other tab.

import type { ClientState } from '$lib/state/client/context';
import { SAVE_ACTION, sourceOnScreen } from '$lib/state/workbench/navigation/editor-status.svelte';

/** The two answers for the tab `active()` names. */
export function sourceKeys(
    client: Pick<ClientState, 'debug' | 'apps' | 'editorStatus'>,
    active: () => { id: string; view: string } | null
): { breakpointFileOnScreen: () => boolean; saveSource: () => void } {
    return {
        breakpointFileOnScreen: () => {
            const file = sourceOnScreen(active(), client.editorStatus.statusOf)?.status.file;
            return file !== undefined && client.debug.takes(file);
        },
        saveSource: () => {
            const tab = sourceOnScreen(active(), client.editorStatus.statusOf);
            if (tab === null) void client.apps.save(active()?.id ?? '');
            else client.editorStatus.ask(tab.instance, { kind: 'action', id: SAVE_ACTION });
        }
    };
}
