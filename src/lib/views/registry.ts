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
import { lookup, t } from '$lib/state/text';

/** A split cell carries a theme hue, its count and its configured label. */
export type BadgeCell = { count: number; color: string; label: string };

/** The badge values shared by the rail and pane tabs. */
export type RegistrationBadge = {
    text: string;
    /** The text a pane tab draws: the rail's, unless the registration says its cells carry it all. */
    tabText: string;
    tone?: string;
    title: string;
    cells?: BadgeCell[];
};

/** Every view takes the instance it was mounted as, and reads its own state by that instance's id. */
export type ViewProps = { instance: Instance };

export type Registration = {
    id: ViewId;
    /** A key in config/text.yml holding the view's name. */
    label: string;
    /** A key in config/text.yml whose value is a name in the `glyphs:` map of config/glyphs.yml. */
    glyph: string;
    component: Component<ViewProps>;
    /**
     * Whether the rail offers the view. Every view is listed unless it says otherwise; one that is
     * only ever opened for something (a project's editor, a project, a document) says `false`,
     * since opened bare it can only report that it was opened for nothing.
     */
    listed?: boolean;
    /** Live text drawn beside the rail glyph; an empty string draws no badge. */
    badge?: () => string;
    /** A hue name from state/tones.ts; absent keeps the rail's accent badge. */
    badgeTone?: () => string;
    /** The badge's hover words, supplied by the registration's state selectors. */
    badgeTitle?: () => string;
    /** The split counts shown on a pane tab. */
    badgeCells?: () => BadgeCell[];
    /** The text a pane tab draws when it differs from the rail's; empty when the cells say it all. */
    badgeTabText?: () => string;
};

/** Assemble a registration's hooks without depending on any particular view or state selector. */
export function badgeOf(registration: Registration): RegistrationBadge {
    const text = registration.badge?.() ?? '';
    return {
        text,
        tabText: registration.badgeTabText?.() ?? text,
        tone: registration.badgeTone?.(),
        title:
            registration.badgeTitle?.() ?? t('views.badge_title', lookup(registration.label), text),
        cells: registration.badgeCells?.()
    };
}

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
