// Layer 3, view helper. The write sequence of the list, multi and family editors
// (state/system/config/editors/writer.ts) made reactive: the sequence is a plain closure, and this
// reads a version number that its `changed` callback moves, so a template that asks whether a write
// is out or what it said is drawn again when a write is sent or answered.

import {
    createEditorWriter,
    type EditorWriter,
    type WriteConfigValue
} from '$lib/state/system/config/editors/writer';
import type { Lists } from '$lib/state/system/config/editors/sources';
import type { ConfigRow } from '$lib/state/system/config/rows';

/**
 * An editors' write sequence whose `sending`, `shown`, `said` and `saved` redraw whatever read
 * them.
 */
export function reactiveEditors(
    write: WriteConfigValue,
    ended: (row: ConfigRow) => void,
    held: (row: ConfigRow) => boolean,
    lists: () => Lists
): EditorWriter {
    let version = $state(0);
    const inner = createEditorWriter(write, {
        changed: () => {
            version += 1;
        },
        ended,
        held,
        lists
    });
    return {
        ...inner,
        sending: (row) => (version < 0 ? false : inner.sending(row)),
        shown: (row) => (version < 0 ? undefined : inner.shown(row)),
        said: (row) => (version < 0 ? null : inner.said(row)),
        saved: (row) => (version < 0 ? false : inner.saved(row))
    };
}
