// Layer 3, shell. Opens one palette result through the layout, then puts transient reveal state in
// the UI store of the activated instance. Project state remains layout identity; reveal state does
// not create a second tab for the same feed or collection view. The saved search of the instance is
// cleared with it, so a card the search would hide is mounted for the reveal.
//
// An editor action opens nothing: it asks the source tab or diff pane it names to run the action,
// and answers that tab's instance. Pin Editor and Unpin Editor are editor items too, and act on the
// tab they name through the layout. A command a view offers runs the function the view handed in
// and answers that view's instance. A command an app declares is run by the apps' shell store and
// opens nothing here.
//
// `landOn` gives the keyboard to the tab head of the pane that shows an instance once the page has
// drawn it.

import type { ClientState } from '$lib/state/client/context';
import { tick } from 'svelte';
import { instanceMap } from '$lib/state/workbench/layout';
import type { LayoutStore } from '$lib/state/workbench/layout.svelte';
import type { PaletteItem } from '$lib/state/workbench/palette';
import type { PaletteSourceStore } from '$lib/state/workbench/palette-source.svelte';
import type { UiStore } from '$lib/state/workbench/ui.svelte';
import type { EditorStatusStore } from '$lib/state/workbench/navigation/editor-status.svelte';
import { focusQuietly } from '$lib/ui/frame/quiet-focus';

/** The stores a result is opened through. */
type Opener = {
    layout: LayoutStore;
    ui: UiStore;
    editorStatus: Pick<EditorStatusStore, 'ask'>;
    paletteSource: Pick<PaletteSourceStore, 'runOffered'>;
    appShell: Pick<ClientState['appShell'], 'run'>;
    commands: Pick<ClientState['commands'], 'press'>;
};

/** Open one result and return the instance the layout activated or created. */
export function openPaletteItem(
    { layout, ui, editorStatus: editor, paletteSource: offers, appShell, commands }: Opener,
    item: PaletteItem
): string {
    if (item.kind === 'project') return layout.openView(item.view, item.state);
    if (item.kind === 'app') {
        const app = item.state?.app;
        const command = item.state?.command;
        if (typeof app === 'string' && typeof command === 'string') void appShell.run(app, command);
        return '';
    }
    if (item.kind === 'task') {
        const repo = item.state?.repo;
        const name = item.state?.name;
        if (typeof repo === 'string' && typeof name === 'string')
            void commands.press(repo, name, 'app');
        return '';
    }
    if (item.kind === 'command') {
        const instance = item.state?.instance;
        const command = item.state?.command;
        if (typeof instance !== 'string' || typeof command !== 'string') return '';
        return offers.runOffered(instance, command) ? instance : '';
    }
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

/** Give the keyboard to the selected tab head of the pane showing an instance, if one does. */
export async function landOn(id: string): Promise<void> {
    await tick();
    const head = document.querySelector<HTMLElement>(
        `[data-pane-active="${CSS.escape(id)}"] [role="tab"][aria-selected="true"]`
    );
    if (head !== null) focusQuietly(head);
}
