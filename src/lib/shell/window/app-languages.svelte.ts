// Layer 3, shell. What the acting apps give the editor, handed to the editor's kit. The kit
// (ui/controls/editor/kit/languages/apps.svelte.ts) imports no state, so the page sets the value
// state computes (state/system/apps/tools/languages.svelte.ts) whenever it changes. Called once
// from the page's script body (Workbench.svelte), in the main window and in a window popped out of
// it, since an editor is drawn in both.

import { setAppKit } from '$lib/ui/controls/editor/kit/languages/apps.svelte';
import type { ClientState } from '$lib/state/client/context';

/** Keep the editor's kit in line with what the acting apps give. */
export function useAppLanguages(client: Pick<ClientState, 'appTools'>): void {
    $effect(() => {
        setAppKit(client.appTools.languages.kit());
    });
}
