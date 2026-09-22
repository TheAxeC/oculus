// Layer 3, shell. Opens one palette result through the layout, then puts transient reveal state in
// the UI store of the activated instance. Project state remains layout identity; reveal state does
// not create a second tab for the same feed or collection view. The saved search of the instance is
// cleared with it, so a card the search would hide is mounted for the reveal.

import type { LayoutStore } from '$lib/state/workbench/layout.svelte';
import type { PaletteItem } from '$lib/state/workbench/palette';
import type { UiStore } from '$lib/state/workbench/ui.svelte';

/** Open one result and return the instance the layout activated or created. */
export function openPaletteItem(layout: LayoutStore, ui: UiStore, item: PaletteItem): string {
    if (item.kind === 'project') return layout.openView(item.view, item.state);

    const id = layout.openView(item.view);
    const reveal = item.state?.reveal;
    if (typeof reveal !== 'string' || reveal === '') return id;
    const current = ui.instanceState(id);
    const held =
        typeof current === 'object' && current !== null && !Array.isArray(current) ? current : {};
    ui.setInstanceState(id, { ...held, ...item.state, search: '' });
    return id;
}
