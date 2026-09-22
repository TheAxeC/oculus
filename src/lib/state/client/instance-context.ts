// Layer 2, client state. Which view instance a component is drawn inside, read through Svelte's
// context rather than a prop.
//
// A pane provides it for the view it mounts, so a partial deep inside a view (the entry form a card
// opens) can key what it keeps by its instance without every component between the view and the
// partial carrying one more prop. What is provided is a reader, not a value: a pane keeps its
// component when its active tab changes to another instance of the same view, so the id a partial
// reads has to follow the tab rather than be the one it was mounted under.

import { getContext, setContext } from 'svelte';

/** The one key the instance reader is provided under. */
export const INSTANCE_KEY = Symbol('view instance');

/** What a component inside a pane reads: the id of the instance the pane shows, or null for none. */
export type InstanceReader = () => string | null;

/** Provide the reader of the instance a pane mounts. Called by the pane and by nothing else. */
export function provideInstance(current: InstanceReader): void {
    setContext(INSTANCE_KEY, current);
}

/** The instance reader, or null for a component drawn outside any pane. */
export function useInstance(): InstanceReader | null {
    return getContext<InstanceReader | undefined>(INSTANCE_KEY) ?? null;
}
