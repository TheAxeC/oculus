// Layer 3, shared view support. What the control that opens a view's own file does, apart from the
// control so the tab it opens can be read without a rendering.

import type { ClientState } from '$lib/state/context';
import type { OpenOptions } from '$lib/state/layout.svelte';
import { sourceTabState } from '$lib/state/source.svelte';
import type { ViewSource } from '$lib/state/view-source';

/**
 * A file to open, with the words the tab carries when its own name is not what to call it and the
 * line the tab opens at when the caller knows one: a search hit names its line, and everything that
 * opens a whole file names none.
 */
export type SourceFile = ViewSource & { label?: string; line?: number };

export function openSourceFile(
    client: ClientState,
    file: SourceFile,
    options?: OpenOptions
): string {
    const tab = sourceTabState(file.root, file.path, file.line);
    return client.layout.openView(
        'source',
        file.label === undefined ? tab : { ...tab, label: file.label },
        undefined,
        options
    );
}
