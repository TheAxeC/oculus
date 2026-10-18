// Layer 3, shell, partial of shell/keys/Palette.svelte. The rows of the palette's file mode. With
// nothing typed, and until the matcher has answered a query (file-names.svelte.ts), they are the
// files open in tabs of the trees on screen: the page, the pages it shows and its floats, or this
// window's float, the active tab of the pane in use first. Once the matcher has answered, they are
// the matches of the newest query it answered.

import type { ClientState } from '$lib/state/client/context';
import {
    openFileEntries,
    plainFile,
    shownTrees,
    type FileMatch
} from '$lib/state/workbench/palette';
import type { FileNames } from './file-names.svelte';

/** What the file mode's rows are read from. */
export type FileListOptions = {
    /** Whether the palette is open in the file mode. */
    active: () => boolean;
    /** The text in the field. */
    query: () => string;
    names: FileNames;
    hosts: ClientState['layout']['hosts'];
    /** The trees on screen, by the page, the floats it shows and this window's float. */
    shown: () => { page: string; floats: readonly string[]; float: string | null };
    /** The active tab of the pane the reader last worked in, whose file is listed first. */
    first: () => string | null;
};

/** The file mode's rows, none while the palette is in another mode. */
export function createFileList(options: FileListOptions): { readonly rows: FileMatch[] } {
    const openFiles = $derived(
        options.active()
            ? openFileEntries(shownTrees(options.hosts(), options.shown()), options.first()).map(
                  plainFile
              )
            : []
    );
    const rows = $derived.by(() => {
        if (!options.active()) return [];
        const query = options.query();
        return query.trim() === '' || !options.names.started() ? openFiles : options.names.rows();
    });
    return {
        get rows() {
            return rows;
        }
    };
}
