// Layer 2, client state. Which view instance a component is drawn inside, read through Svelte's
// context rather than a prop.
//
// A pane provides it for each tab view it mounts (shell/panes/TabView.svelte), so a partial deep
// inside a view (the entry form a card opens) can key what it keeps by its instance without every
// component between the view and the partial carrying one more prop. What is provided is a reader,
// not a value, so a caller reads the id at the moment it acts rather than at its mount.

import { getContext, setContext } from 'svelte';

/** The one key the instance reader is provided under. */
export const INSTANCE_KEY = Symbol('view instance');

/**
 * What a component inside a pane reads: the id of the instance the pane shows, or null for none.
 */
export type InstanceReader = () => string | null;

/** Provide the reader of the instance a tab view is drawn for. Called by that tab view alone. */
export function provideInstance(current: InstanceReader): void {
    setContext(INSTANCE_KEY, current);
}

/** The instance reader, or null for a component drawn outside any pane. */
export function useInstance(): InstanceReader | null {
    return getContext<InstanceReader | undefined>(INSTANCE_KEY) ?? null;
}
