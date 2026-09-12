// Layer 3, shell. Opens one palette result through the layout, then puts transient reveal state in
// the UI store of the activated instance. Project state remains layout identity; reveal state does
// not create a second tab for the same feed or collection view. The saved search of the instance is
// cleared with it, so a card the search would hide is mounted for the reveal.

import { openView } from '$lib/state/layout.svelte';
import type { PaletteItem } from '$lib/state/palette';
import { instanceState, setInstanceState } from '$lib/state/ui.svelte';

/** Open one result and return the instance the layout activated or created. */
export function openPaletteItem(item: PaletteItem): string {
    if (item.kind === 'project') return openView(item.view, 'main', item.state);

    const id = openView(item.view, 'main');
    const reveal = item.state?.reveal;
    if (typeof reveal !== 'string' || reveal === '') return id;
    const current = instanceState(id);
    const held =
        typeof current === 'object' && current !== null && !Array.isArray(current) ? current : {};
    setInstanceState(id, { ...held, ...item.state, search: '' });
    return id;
}
