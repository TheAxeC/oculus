// Layer 3, view helper. The writes of the list, multi and family editors
// (state/system/config/editors/writer.ts) made reactive: the writer is a plain closure, and this
// reads a version number that its `changed` callback moves, so a template that asks what a row
// holds or what it said is drawn again when a change is held or dropped.

import {
    createEditorWriter,
    type EditorHooks,
    type EditorWriter
} from '$lib/state/system/config/editors/writer';

/**
 * An editors' writer whose `shown`, `said` and `unsaved` redraw whatever read them. The hooks are
 * the writer's own but for `changed`, which this supplies.
 */
export function reactiveEditors(hooks: Omit<EditorHooks, 'changed'>): EditorWriter {
    let version = $state(0);
    const inner = createEditorWriter({
        ...hooks,
        changed: () => {
            version += 1;
        }
    });
    return {
        ...inner,
        shown: (row) => (version < 0 ? undefined : inner.shown(row)),
        said: (row) => (version < 0 ? null : inner.said(row)),
        unsaved: (row) => (version < 0 ? false : inner.unsaved(row))
    };
}
