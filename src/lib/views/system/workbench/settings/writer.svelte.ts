// Layer 3, view helper. The writer of state/system/config/scopes/write.ts made reactive: the writer
// is a plain closure, and this reads a version number that its `changed` callback moves, so a
// `$derived` or a template that asks what a row shows or says is drawn again when a change is held
// or dropped.

import type { Lists } from '$lib/state/system/config/editors/sources';
import type { ConfigRow } from '$lib/state/system/config/rows';
import { createRowWriter, type RowWriter, type Stage } from '$lib/state/system/config/scopes/write';

/**
 * A writer whose `shown`, `pending` and `said` redraw whatever read them when a change moves.
 * `stage` holds a row's change in the scope on screen, `lists` answers the lists a row's control
 * draws from.
 */
export function reactiveWriter(stage: Stage, lists: (row: ConfigRow) => Lists): RowWriter {
    let version = $state(0);
    const inner = createRowWriter(
        stage,
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
