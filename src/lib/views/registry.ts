// Layer 3, views. The registry is the vocabulary of ViewId: view modules describe themselves and
// the route loader registers them, so no shell module imports a view by name and no view knows
// where it is mounted. It is the one module the shell and the views share.
//
// A registration's label and glyph are catalog keys rather than words: the label reads through t()
// at the call site that draws it, and the glyph key's value is a name in
// config/catalogs/glyphs.yml. A view is therefore renamed or re-iconed in config, and
// tests/views/whole/registry.test.ts checks that both keys resolve, which is the gate
// tests/checks/source/keys.test.ts cannot give a key that comes from data.

import type { Component } from 'svelte';
import type { Instance, ViewId } from '$lib/state/workbench/layout';
import type { LayoutStore } from '$lib/state/workbench/layout.svelte';
import type { ClientState } from '$lib/state/client/context';
import { glyph, lookup, t } from '$lib/state/words/text';

/** A split cell carries a theme hue, its count and its configured label. */
export type BadgeCell = { count: number; color: string; label: string };

/** The badge values shared by the rail and pane tabs. */
export type RegistrationBadge = {
    text: string;
    /** The glyph name drawn before the text, empty for a badge that is a count and nothing else. */
    glyph: string;
    /**
     * The text a pane tab draws: the rail's, unless the registration says its cells carry it all.
     */
    tabText: string;
    tone?: string;
    title: string;
    cells?: BadgeCell[];
};

/**
 * Every view takes the instance it was mounted as, and reads its own state by that instance's id.
 */
export type ViewProps = { instance: Instance };

export type Registration = {
    id: ViewId;
    /** A key in the text catalog holding the view's name. */
    label: string;
    /**
     * A text-catalog key whose value is a name in the `glyphs:` map of config/catalogs/glyphs.yml.
     */
    glyph: string;
    component: Component<ViewProps>;
    /** The stable id of the rail group that owns this view. */
    group: string;
    /** Position inside the group; equal positions are resolved by id. */
    order: number;
    /**
     * Whether the rail offers the view. Every view is listed unless it says otherwise; one that is
     * only ever opened for something (a project's editor, a project, a document) says `false`,
     * since opened bare it can only report that it was opened for nothing.
     */
    listed?: boolean;
    /** Live text drawn beside the rail glyph; an empty string draws no badge. */
    badge?: (state: ClientState) => string;
    /** A glyph name drawn in the badge before its text, for a badge that is a mark, not a count. */
    badgeGlyph?: (state: ClientState) => string;
    /** A hue name from state/words/tones.ts; absent keeps the rail's accent badge. */
    badgeTone?: (state: ClientState) => string;
    /** The badge's hover words, supplied by the registration's state selectors. */
    badgeTitle?: (state: ClientState) => string;
    /** The split counts shown on a pane tab. */
    badgeCells?: (state: ClientState) => BadgeCell[];
    /**
     * The text a pane tab draws when it differs from the rail's; empty when the cells say it all.
     */
    badgeTabText?: (state: ClientState) => string;
};

/** What a view module exports; the loader supplies the module's default component. */
export type ViewRegistration = Omit<Registration, 'component'>;

/** Resolve the catalog label key carried by registration metadata. */
export function registrationLabel(registration: Pick<Registration, 'label'>): string {
    return lookup(registration.label);
}

/** Resolve the catalog glyph key carried by registration metadata. */
export function registrationGlyph(registration: Pick<Registration, 'glyph'>): string {
    return lookup(registration.glyph);
}

/**
 * Assemble a registration's hooks without depending on any particular view or state selector. The
 * hooks read stores, so the client they read is handed to them rather than reached from a module.
 */
export function badgeOf(registration: Registration, client: ClientState): RegistrationBadge {
    const text = registration.badge?.(client) ?? '';
    const mark = registration.badgeGlyph?.(client) ?? '';
    // The hover words are text, so a badge that is a mark rather than a count says it with the
    // glyph's character: an icon cannot be read out of a title attribute.
    const said = text === '' && mark !== '' ? glyph(mark) : text;
    return {
        text,
        glyph: mark,
        tabText: registration.badgeTabText?.(client) ?? text,
        tone: registration.badgeTone?.(client),
        title:
            registration.badgeTitle?.(client) ??
            t('views.badge_title', registrationLabel(registration), said),
        cells: registration.badgeCells?.(client)
    };
}

/** The views one client knows about, in registration order. */
export type RegistryStore = {
    registerView: (registration: Registration) => void;
    registerComponent: (component: Component<ViewProps>, registrations: ViewRegistration[]) => void;
    unregisterView: (id: ViewId) => void;
    viewFor: (id: ViewId) => Registration | undefined;
    views: () => Registration[];
};

export function createRegistry(layout: LayoutStore): RegistryStore {
    /**
     * Insertion order is registration order, and a re-registration keeps the id's first position.
     */
    const registry = new Map<ViewId, Registration>();

    /** Register a view, replacing an earlier registration of the same id. */
    function registerView(registration: Registration): void {
        registry.set(registration.id, registration);
    }

    /** Supply one module component to each metadata record the module exports. */
    function registerComponent(
        component: Component<ViewProps>,
        registrations: ViewRegistration[]
    ): void {
        for (const registration of registrations) registerView({ ...registration, component });
    }

    /**
     * Drop a view's registration and close the tabs open on it; an id the registry does not hold is
     * left alone. A tab whose view has gone has no body the shell can draw, so it goes with the
     * key.
     */
    function unregisterView(id: ViewId): void {
        if (!registry.delete(id)) return;
        layout.closeInstancesOfView(id);
    }

    /** The registration of a view, or undefined when the id names none. */
    function viewFor(id: ViewId): Registration | undefined {
        return registry.get(id);
    }

    /** Every registration, in registration order. */
    function views(): Registration[] {
        return [...registry.values()];
    }

    return { registerView, registerComponent, unregisterView, viewFor, views };
}
