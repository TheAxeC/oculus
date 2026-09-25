// Layer 3, Linkedin support. Where one post's source file sits under the hub root and what opening
// it does, apart from the card so the path and the tab can be read without a rendering.

import { HUB_ROOT } from '$lib/state/sources/fs';
import type { LayoutStore } from '$lib/state/workbench/layout.svelte';
import { sourceTabState } from '$lib/state/sessions/source.svelte';

export function linkedinSourcePath(folder: string, file: string): string {
    return `${folder.replace(/\/$/, '')}/${file}`;
}

export function openLinkedinSource(layout: LayoutStore, folder: string, file: string): string {
    return layout.openView('source', sourceTabState(HUB_ROOT, linkedinSourcePath(folder, file)));
}
