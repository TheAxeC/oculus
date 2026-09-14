// Layer 3, shared view support. What one source strip control names and what pressing it opens,
// apart from the strip so the tab it opens can be read without a rendering.

import type { ClientState } from '$lib/state/context';
import { sourceTabState } from '$lib/state/source.svelte';

export type EditSource = { root: string; path: string; label?: string };

export function openSourceFile(client: ClientState, file: EditSource): string {
    const tab = sourceTabState(file.root, file.path);
    return client.layout.openView(
        'source',
        file.label === undefined ? tab : { ...tab, label: file.label }
    );
}
