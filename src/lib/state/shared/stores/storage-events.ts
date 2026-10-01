// Layer 2, client state. Hearing that another browser tab wrote a storage key.

/**
 * Call `changed` whenever another browser tab wrote `key`, as `source` (the window) reports it, and
 * answer how to stop. The browser fires the `storage` event in every tab but the writer's, so a
 * write made by this tab never calls it, and a write to any other key is not heard.
 */
export function followKey(source: EventTarget, key: string, changed: () => void): () => void {
    const heard = (event: Event): void => {
        if ((event as StorageEvent).key === key) changed();
    };
    source.addEventListener('storage', heard);
    return () => source.removeEventListener('storage', heard);
}
