// Layer 3, view helper. The write sequence of state/system/config/write.ts made reactive: the
// sequence is a plain closure, and this reads a version number that its `changed` callback moves,
// so a `$derived` or a template that asks what a row shows or says is drawn again when a write is
// sent or answered.

import type { Lists } from '$lib/state/system/config/editors/sources';
import type { ConfigRow } from '$lib/state/system/config/rows';
import {
    createRowWriter,
    type ResetConfig,
    type RowWriter,
    type WriteConfigKey
} from '$lib/state/system/config/write';

/**
 * A write sequence whose `shown`, `pending` and `said` redraw whatever read them when a write
 * moves. `lists` answers the lists a row's control draws from.
 */
export function reactiveWriter(
    write: WriteConfigKey,
    reset: ResetConfig,
    lists: (row: ConfigRow) => Lists
): RowWriter {
    let version = $state(0);
    const inner = createRowWriter(
        write,
        reset,
        () => {
            version += 1;
        },
        lists
    );
    return {
        ...inner,
        shown: (row) => (version < 0 ? undefined : inner.shown(row)),
        pending: (row) => version >= 0 && inner.pending(row),
        said: (row) => (version < 0 ? null : inner.said(row))
    };
}
