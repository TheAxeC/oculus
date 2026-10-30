// Layer 3, support of PostCard.svelte and of the post's page, views/feeds/post/Post.svelte. Where
// one post's source file sits under the hub root, what opening it does, the state its page opens
// with and the file an idea became, apart from the card so they can be read without a rendering.

import type { LayoutStore } from '$lib/state/workbench/layout.svelte';
import { sourceTabState } from '$lib/state/sessions/source/draft';

/** The state of the page of the post `file` of `hub`, `label` the words of its tab. */
export function postState(
    hub: string,
    file: string,
    label: string
): { hub: string; key: string; label: string } {
    return { hub, key: file, label };
}

/**
 * The numbered file among `files` that the idea `file` was renamed to by Mark posted, which keeps
 * the name after its `xx-`, or null for a file that is no idea or was not renamed.
 */
export function promotedFile(file: string, files: readonly string[]): string | null {
    if (!file.startsWith('xx-')) return null;
    const rest = file.slice('xx-'.length);
    return files.find((one) => /^\d+-/.test(one) && one.replace(/^\d+-/, '') === rest) ?? null;
}

export function linkedinSourcePath(folder: string, file: string): string {
    return `${folder.replace(/\/$/, '')}/${file}`;
}

export function openLinkedinSource(
    layout: LayoutStore,
    folder: string,
    file: string,
    root: string
): string {
    return layout.openView('source', sourceTabState(root, linkedinSourcePath(folder, file)));
}
