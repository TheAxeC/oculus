// Layer 3, view helper. The write sequence of state/system/config/write.ts made reactive: the
// sequence is a plain closure, and this reads a version number that its `changed` callback moves,
// so a `$derived` or a template that asks what a row shows or says is drawn again when a write is
// sent or answered.

import type { Lists } from '$lib/state/system/config/editors/sources';
import {
    createRowWriter,
    type RowWriter,
    type WriteConfigKey
} from '$lib/state/system/config/write';

/** A write sequence whose `shown` and `said` redraw whatever read them when a write moves. */
export function reactiveWriter(write: WriteConfigKey, lists: () => Lists): RowWriter {
    let version = $state(0);
    const inner = createRowWriter(
        write,
        () => {
            version += 1;
        },
        lists
    );
    return {
        ...inner,
        shown: (row) => (version < 0 ? undefined : inner.shown(row)),
        said: (row) => (version < 0 ? null : inner.said(row))
    };
}
