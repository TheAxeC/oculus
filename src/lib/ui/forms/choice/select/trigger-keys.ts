// Layer 3, primitive. The key handler of a select trigger drawn by FieldSelect.svelte. bits-ui's
// Select reads every key pressed on its closed trigger as a letter of its type-ahead and passes the
// key on without its modifiers, so Cmd+S would pick the entry starting with "s". A key pressed with
// Cmd, Ctrl or Alt held is never handed to it, and goes on to the workbench's own keys unprevented.

/** The modifiers of a key press. */
type Held = Pick<KeyboardEvent, 'metaKey' | 'ctrlKey' | 'altKey'>;

/** The trigger's handler: bits-ui's own for a key with no Cmd, Ctrl or Alt held, else nothing. */
export function triggerKeys<Press extends Held>(
    own: ((event: Press) => void) | undefined
): (event: Press) => void {
    return (event) => {
        if (event.metaKey || event.ctrlKey || event.altKey) return;
        own?.(event);
    };
}
