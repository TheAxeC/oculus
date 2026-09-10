// Layer 3, views. The registry is the vocabulary of ViewId: a view registers itself here and the
// shell mounts whatever a pane names, so no shell module imports a view by name and no view knows
// where it is mounted. It is the one module the shell and the views share.
//
// A registration's label and glyph are catalog keys rather than words: the label reads through
// t() at the call site that draws it, and the glyph key's value is a name in config/glyphs.yml. A
// view is therefore renamed or re-iconed in config, and tests/views/registry.test.ts checks that
// both keys resolve, which is the gate tests/keys.test.ts cannot give a key that comes from data.

import type { Component } from 'svelte';
import type { Instance, ViewId } from '$lib/state/layout';

/** Every view takes the instance it was mounted as, and reads its own state by that instance's id. */
export type ViewProps = { instance: Instance };

export type Registration = {
    id: ViewId;
    /** A key in config/text.yml holding the view's name. */
    label: string;
    /** A key in config/text.yml whose value is a name in the `glyphs:` map of config/glyphs.yml. */
    glyph: string;
    component: Component<ViewProps>;
};

/** Insertion order is registration order, and a re-registration keeps the id's first position. */
const registry = new Map<ViewId, Registration>();

/** Register a view, replacing an earlier registration of the same id. */
export function registerView(registration: Registration): void {
    registry.set(registration.id, registration);
}

/** The registration of a view, or undefined when the id names none. */
export function viewFor(id: ViewId): Registration | undefined {
    return registry.get(id);
}

/** Every registration, in registration order. */
export function views(): Registration[] {
    return [...registry.values()];
}
