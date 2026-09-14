// Layer 3, shared view support. What one source strip control names and what pressing it opens,
// apart from the strip so the tab it opens can be read without a rendering.

import { openView } from '$lib/state/layout.svelte';
import { sourceTabState } from '$lib/state/source.svelte';

export type EditSource = { root: string; path: string; label?: string };

export function openSourceFile(file: EditSource): string {
    const state = sourceTabState(file.root, file.path);
    return openView(
        'source',
        'main',
        file.label === undefined ? state : { ...state, label: file.label }
    );
}
