// Layer 3, shell. Opens one palette result through the layout, then puts transient reveal state in
// the UI store of the activated instance. Project state remains layout identity; reveal state does
// not create a second tab for the same feed or collection view. The saved search of the instance is
// cleared with it, so a card the search would hide is mounted for the reveal.
//
// An editor action opens nothing: it asks the source tab or diff pane it names to run the action,
// and answers that tab's instance. Pin Editor and Unpin Editor are editor items too, and act on the
// tab they name through the layout.

import { z } from 'zod';
import { readOr, rowsShape } from '$lib/data/shapes/shapes';
import { instanceMap } from '$lib/state/workbench/layout';
import type { LayoutStore } from '$lib/state/workbench/layout.svelte';
import type { PaletteItem } from '$lib/state/workbench/palette';
import type { UiStore } from '$lib/state/workbench/ui.svelte';
import type { EditorStatusStore } from '$lib/state/workbench/navigation/editor-status.svelte';

/** The names of the rows of the configuration's `themes` list that hold one as text. */
const themeNamesShape = rowsShape(z.object({ name: z.string() }).transform((row) => row.name));

/** Open one result and return the instance the layout activated or created. */
export function openPaletteItem(
    layout: LayoutStore,
    ui: UiStore,
    item: PaletteItem,
    editor: Pick<EditorStatusStore, 'ask'>
): string {
    if (item.kind === 'project') return layout.openView(item.view, item.state);
    if (item.kind === 'editor') {
        const instance = item.state?.instance;
        const action = item.state?.action;
        const pin = item.state?.pin;
        if (typeof instance === 'string' && typeof pin === 'boolean') {
            if (pin) layout.pinTab(instance);
            else layout.unpinTab(instance);
            return instance;
        }
        if (typeof instance !== 'string' || typeof action !== 'string') return '';
        editor.ask(instance, { kind: 'action', id: action });
        return instance;
    }

    const id = layout.openView(item.view);
    const reveal = item.state?.reveal;
    if (typeof reveal !== 'string' || reveal === '') return id;
    ui.setInstanceState(id, { ...instanceMap(ui.instanceState(id)), ...item.state, search: '' });
    return id;
}

/** The names of the themes the configuration lists, which the `:theme` command accepts. */
export function configuredThemes(config: Record<string, unknown>): string[] {
    return readOr(themeNamesShape, config.themes, []);
}
