// Layer 2, client state. The registry is the vocabulary of ViewId: view modules describe themselves
// and the route loader registers them, so no shell module imports a view by name and no view knows
// where it is mounted. It is a state module like the rest of the navigation folder: the client
// object builds one per page, the shell and the views both read it, and its one runtime import is
// the state layer's own text catalog, so the state layer names nothing of `views/` to hold it. Its
// type imports are the stores a badge hook reads, each below the navigation folder in the state
// order or beside it in state/workbench.
//
// A registration's label, glyph and badge mark words are catalog keys rather than words: the label
// reads through t() at the call site that draws it, the glyph key's value is a name in
// config/catalogs/glyphs.yml, and the mark words are what a badge that is a mark says on hover. A
// view is therefore renamed or re-iconed in config.

import type { Component } from 'svelte';
import { SvelteMap } from 'svelte/reactivity';
import type { Instance, ViewId } from '../layout/index.ts';
import type { LayoutStore } from '../layout.svelte.ts';
import type { BadgeCell, RailBadgesStore } from '../rail-badges.svelte.ts';
import type { CalendarStore } from '../../life/calendar.svelte.ts';
import type { HpcStore } from '../../system/machine/hpc/hpc.svelte.ts';
import { lookup, t } from '../../shared/words/text.ts';

/**
 * What a registration's badge hooks read of the client: the calendar's and the HPC queue's badge
 * words, and the rail badges' counts, hues, hover words and cells, each taken out of its store's
 * own type, so a store that changes a member's shape changes it here too. The client object
 * (state/client/context.ts) holds these stores, so it is handed to badgeOf as it is.
 */
export type BadgeClient = {
    calendar: Pick<CalendarStore, 'badgeText'>;
    hpc: Pick<HpcStore, 'badgeText'>;
    railBadges: Pick<
        RailBadgesStore,
        | 'boardBadge'
        | 'personalBadge'
        | 'boardBadgeTitle'
        | 'boardCells'
        | 'collectionBadge'
        | 'collectionBadgeTone'
        | 'collectionBadgeTitle'
        | 'applicationsBadge'
        | 'inboxBadge'
        | 'leadsBadge'
        | 'linkedinBadgeGlyph'
        | 'auditBadge'
        | 'repositoriesBadge'
        | 'queueBadgeTitle'
        | 'queueCells'
        | 'calendarBadgeTitle'
        | 'calendarCells'
    >;
};

/** The badge values shared by the view catalogue and pane tabs. */
export type RegistrationBadge = {
    text: string;
    /** The glyph name drawn before the text, empty for a badge that is a count and nothing else. */
    glyph: string;
    /**
     * The text a pane tab draws: the catalogue's, unless the registration says its cells carry it
     * all.
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
    /**
     * The view's name as it is drawn, for a view whose name is data and not a catalog word: an
     * app's title. When present it is the label, and `label` is not looked up.
     */
    words?: string;
    /** A glyph name drawn as it is, for a view whose glyph is data: an app's manifest names one. */
    glyphName?: string;
    component: Component<ViewProps>;
    /** The stable id of the `nav_groups` group of the view catalogue that owns this view. */
    group: string;
    /** Position inside the group; equal positions are resolved by id. */
    order: number;
    /**
     * Whether the view catalogue lists the view. Every view is listed unless it says otherwise; one
     * that is only ever opened for something (a project's editor, a project, a document) says
     * `false`, since opened bare it can only report that it was opened for nothing.
     */
    listed?: boolean;
    /** Live text drawn beside the view's glyph in the catalogue; an empty string draws no badge. */
    badge?: (state: BadgeClient) => string;
    /** A glyph name drawn in the badge before its text, for a badge that is a mark, not a count. */
    badgeGlyph?: (state: BadgeClient) => string;
    /**
     * A text-catalog key whose value says in words what the badge's mark means, which is the
     * badge's hover words when it is a mark and no count. A registration with `badgeGlyph` names
     * one; a mark drawn without it is hovered by the view's name alone.
     */
    badgeMark?: string;
    /** A hue name from state/shared/words/tones.ts; absent keeps the accent badge. */
    badgeTone?: (state: BadgeClient) => string;
    /** The badge's hover words, supplied by the registration's state selectors. */
    badgeTitle?: (state: BadgeClient) => string;
    /** The split counts shown on a pane tab. */
    badgeCells?: (state: BadgeClient) => BadgeCell[];
    /**
     * The text a pane tab draws when it differs from the catalogue's; empty when the cells say it
     * all.
     */
    badgeTabText?: (state: BadgeClient) => string;
};

/** What a view module exports; the loader supplies the module's default component. */
export type ViewRegistration = Omit<Registration, 'component'>;

/** Resolve the label a registration carries: its own words, or the catalog key's value. */
export function registrationLabel(registration: Pick<Registration, 'label' | 'words'>): string {
    return registration.words ?? lookup(registration.label);
}

/** Resolve the glyph a registration carries: its own glyph name, or the catalog key's value. */
export function registrationGlyph(registration: Pick<Registration, 'glyph' | 'glyphName'>): string {
    return registration.glyphName ?? lookup(registration.glyph);
}

/**
 * Assemble a registration's hooks without depending on any particular view or state selector. The
 * hooks read stores, so the client they read is handed to them rather than reached from a module.
 */
export function badgeOf(registration: Registration, client: BadgeClient): RegistrationBadge {
    const text = registration.badge?.(client) ?? '';
    const mark = registration.badgeGlyph?.(client) ?? '';
    // The hover words are text, so a badge that is a mark rather than a count says what the mark
    // means in the words its registration names: an icon cannot be read out of a title attribute.
    const marked = text === '' && mark !== '';
    const means = registration.badgeMark;
    const words = marked && means !== undefined ? lookup(means) : text;
    const label = registrationLabel(registration);
    return {
        text,
        glyph: mark,
        tabText: registration.badgeTabText?.(client) ?? text,
        tone: registration.badgeTone?.(client),
        title:
            registration.badgeTitle?.(client) ??
            (marked && means === undefined ? label : t('views.badge_title', label, words)),
        cells: registration.badgeCells?.(client)
    };
}

/** The views one client knows about, in registration order. */
export type RegistryStore = {
    registerView: (registration: Registration) => void;
    registerComponent: (component: Component<ViewProps>, registrations: ViewRegistration[]) => void;
    unregisterView: (id: ViewId) => void;
    /**
     * Take a registration out and close no tab: a tab on a view that has no registration draws as
     * an unknown view, and draws the view again when it is registered again.
     */
    dropView: (id: ViewId) => void;
    viewFor: (id: ViewId) => Registration | undefined;
    views: () => Registration[];
};

export function createRegistry(layout: LayoutStore): RegistryStore {
    /**
     * Insertion order is registration order, and a re-registration keeps the id's first position.
     */
    const registry = new SvelteMap<ViewId, Registration>();

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
        if (!registry.has(id)) return;
        // The tabs close while the registration is still held, since whether a pane is kept empty
        // after its last tab goes is read from what the registry says that view is.
        layout.closeInstancesOfView(id);
        registry.delete(id);
    }

    /** Drop a registration and leave every tab on it open. */
    function dropView(id: ViewId): void {
        registry.delete(id);
    }

    /** The registration of a view, or undefined when the id names none. */
    function viewFor(id: ViewId): Registration | undefined {
        return registry.get(id);
    }

    /** Every registration, in registration order. */
    function views(): Registration[] {
        return [...registry.values()];
    }

    return { registerView, registerComponent, unregisterView, dropView, viewFor, views };
}
