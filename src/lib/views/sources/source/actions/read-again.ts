// Layer 3, view partial of Source.svelte. Reading again a file the tab could not open. A file that
// was gone when the tab opened may be back as something other than text, so the tab asks what the
// file is before it reads: a text file, or one still gone, is read into the tab again, and any
// other kind opens in the view that shows it, taking this tab's place (a preview tab keeps its
// place in the strip) or closing this tab when the file was already open there. An answer that
// lands after the tab closed or was pointed at another file changes nothing.

import type { ClientState } from '$lib/state/client/context';
import type { HeadStage } from '$lib/state/sources/repositories/file-git';
import { instanceText } from '$lib/state/workbench/layout/instance';
import { tabForKind } from '../../../shared/explorer/opening';

/** The tab being read again: its instance, whether it is a preview tab, and its file. */
export type ReadAgain = {
    id: string;
    preview: boolean;
    root: string;
    path: string;
    /** The version a tab over the file at HEAD or in the index holds. */
    head: HeadStage | undefined;
};

export async function readAgain(client: ClientState, tab: ReadAgain): Promise<void> {
    const {
        apps: { holds },
        fs: { readFileKind },
        layout: { closeInstance, instanceLayoutState, instanceView, openView },
        source: { loadSourceDraft }
    } = client;
    if (tab.head === undefined) {
        const found = await readFileKind(tab.root, tab.path);
        const state = instanceLayoutState(tab.id);
        const here =
            instanceView(tab.id) === 'source' &&
            instanceText(state, 'root') === tab.root &&
            instanceText(state, 'path') === tab.path;
        if (!here) return;
        if (found.kind !== 'text' && found.kind !== 'missing') {
            const next = tabForKind(found.kind, tab.root, tab.path, undefined, holds);
            const opened = openView(next.view, next.state, undefined, { preview: tab.preview });
            if (opened !== tab.id) closeInstance(tab.id);
            return;
        }
    }
    await loadSourceDraft(tab.id, tab.root, tab.path, tab.head);
}
