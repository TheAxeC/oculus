// Layer 3, routes. Discover view modules and register their exported metadata with each module's
// default component. The route layer owns discovery so the view boundary does not import views. The
// views a config names (the collection views and the project boards) are registered from the page
// data on the first frame and again from each config push.

import type { Component } from 'svelte';
import { z } from 'zod';
import { appActive, appViewId } from '$lib/data/helpers/files/apps/apps';
import { EDITOR_VIEW, PANEL_VIEW, contributedViewId } from '$lib/data/helpers/files/apps/views';
import type { AppRow, ConfigPayload, HubVocabs, ListedCollection } from '$lib/data/model';
import { workspaceCollectionViews, type CollectionViews } from '$lib/data/snapshot/normalise';
import { unplacedGroup } from '$lib/data/sources/config/rail';
import { itemsShape, mapShape, readAs } from '$lib/data/shapes/shapes';
import {
    boardViews,
    boardsSource,
    type BoardView,
    type BoardViews,
    type BoardsSource
} from '$lib/state/boards/board';
import { viewOffers, type ViewOffer } from '$lib/state/system/apps/shell/contributions';
import type {
    RegistryStore,
    ViewProps,
    ViewRegistration
} from '$lib/state/workbench/navigation/registry';

type RegistrationSource =
    | ViewRegistration
    | ViewRegistration[]
    | ((views: ListedCollection[], unplaced: string | null) => ViewRegistration[]);

type ViewModule = {
    default: Component<ViewProps>;
    registration?: RegistrationSource;
};

/** The `collections` field of a pushed configuration, when it holds a list. */
const pushedShape = z.object({ collections: itemsShape });

/**
 * Read one source as a list, leaving collection factories for registerCollections(), which hands a
 * factory the collection views and the group the rail places a view no entry places in.
 */
function definitions(
    source: RegistrationSource,
    given?: Pick<CollectionViews, 'views' | 'unplaced'>
): ViewRegistration[] {
    if (typeof source === 'function') {
        return given === undefined ? [] : source(given.views, given.unplaced);
    }
    return Array.isArray(source) ? source : [source];
}

/** Register every discovered module that exports registration; other modules are view partials. */
export function registerModules(registry: RegistryStore, modules: Record<string, unknown>): void {
    for (const [, unknownModule] of Object.entries(modules).sort(([left], [right]) =>
        left.localeCompare(right)
    )) {
        const module = unknownModule as ViewModule;
        if (module.registration === undefined) continue;
        registry.registerComponent(module.default, definitions(module.registration));
    }
}

/** Every view module the build discovered, which the page registers into its own registry. */
export const viewModules = import.meta.glob('$lib/views/**/*.svelte', { eager: true });

/** Fill one client's registry with every discovered view. */
export function registerAll(registry: RegistryStore): void {
    registerModules(registry, viewModules);
}

/** The ids of the views the discovered modules register as their own, each module's list. */
function moduleViewIds(): string[] {
    return Object.values(viewModules).flatMap((unknownModule) => {
        const source = (unknownModule as ViewModule).registration;
        return source === undefined || typeof source === 'function'
            ? []
            : definitions(source).map((registration) => registration.id);
    });
}

/**
 * The board views of a source with the findings of the boards left out: every view id a module
 * registers and every collection view's key is taken, so a board of such a key is not registered.
 */
export function pageBoards(
    source: BoardsSource,
    catalog: Record<string, string>,
    collections: Pick<CollectionViews, 'views'>
): BoardViews {
    const taken = new Set([...moduleViewIds(), ...collections.views.map((entry) => entry.key)]);
    return boardViews(source, catalog, taken);
}

/**
 * The source of the board views a pushed configuration names, the file `boards:` was read from
 * taken from the push's `from`; null when its `boards:` is not a map, which names no board.
 */
export function pushedBoards(pushed: ConfigPayload | null): BoardsSource | null {
    const config = pushed?.config;
    if (config === undefined || readAs(mapShape, config.boards) === null) return null;
    return boardsSource(config, (key) => pushed?.from[key] ?? '');
}

/** A module that draws the project board views: the one exporting `boardRegistration`. */
type BoardModule = ViewModule & {
    boardRegistration: (views: readonly BoardView[]) => ViewRegistration[];
};

/**
 * Register the project board views given with the component that exports `boardRegistration`
 * (views/boards/projects/Projects.svelte), which gives each its count hooks, and unregister the
 * board views it drew that they no longer hold, closing their tabs, so a board taken out of
 * `boards:` leaves the rail, the catalogue and the panes with the push that took it out. The
 * findings of the boards left out are the registry's `refused`, which the Findings view lists.
 */
export function registerBoards(registry: RegistryStore, given: BoardViews): void {
    registry.refuse(given.findings);
    const drawer = Object.values(viewModules).find(
        (one) => typeof (one as Partial<BoardModule>).boardRegistration === 'function'
    ) as BoardModule | undefined;
    if (drawer === undefined) return;
    const wanted = drawer.boardRegistration(given.views);
    const ids = new Set(wanted.map((registration) => registration.id));
    for (const registration of registry.views()) {
        if (registration.component === drawer.default && !ids.has(registration.id)) {
            registry.unregisterView(registration.id);
        }
    }
    registry.registerComponent(drawer.default, wanted);
}

/**
 * The collection views a pushed configuration names with the hubs it was pushed with: those
 * `workspaceCollectionViews` reads from its `collections` list and the hubs' lists, none for an
 * empty list and no hub listing one, and null when the configuration holds no list there. The
 * group a view no entry places goes in is the one the configuration's rail flags.
 */
export function pushedCollections(pushed: unknown, hubs: HubVocabs | null): CollectionViews | null {
    const held = readAs(pushedShape, pushed);
    if (held === null) return null;
    return workspaceCollectionViews(held, hubs, unplacedGroup(readAs(mapShape, pushed) ?? {}));
}

/**
 * Register the generic Collection view once per collection view given, and drop the views of
 * every key they no longer hold, so a collection taken out of config/defaults/sources.yml leaves
 * the rail and the palette with the keys that took it out rather than at the next reload. The
 * tabs of a key oculus's pages place (`placed`, the keys of oculus's entries with a `group:`) stay
 * in their panes, which leave them out while no hub lists the key and draw them again when one
 * does (state/workbench/layout/tabs/left-out.ts); the tabs of any other key close with its view.
 *
 * A key that is the id of a view a module registers as its own is left out, so a `collections:`
 * entry named `debug` or `files` never replaces a built-in view.
 *
 * What a factory module registered last time is read back from the registry, as the registrations
 * drawn by that module's own component, so this module owns the collection registrations without
 * keeping a second record of them anywhere.
 */
export function registerCollections(registry: RegistryStore, given: CollectionViews): void {
    const builtIn = new Set(moduleViewIds());
    const free = given.views.filter((entry) => !builtIn.has(entry.key));
    for (const unknownModule of Object.values(viewModules)) {
        const module = unknownModule as ViewModule;
        if (typeof module.registration !== 'function') continue;
        const wanted = definitions(module.registration, { views: free, unplaced: given.unplaced });
        const ids = new Set(wanted.map((registration) => registration.id));
        for (const registration of registry.views()) {
            if (registration.component !== module.default || ids.has(registration.id)) continue;
            if (given.placed.includes(registration.id)) registry.dropView(registration.id);
            else registry.unregisterView(registration.id);
        }
        registry.registerComponent(module.default, wanted);
    }
}

/** The badge glyphs of an app view: disabled, not approved, and kept approved. */
const DISABLED_GLYPH = 'app_disabled';
const LOCK_GLYPH = 'lock';
const EDIT_GLYPH = 'edit';

/**
 * The registration of one app: its view id, the manifest's title and glyph as data, the group
 * `apps`, and the order the section gives after the Apps view, which is the group's first row (the
 * machine apps by name, then the apps of each root).
 * The badge is the disabled glyph while the app is disabled, a lock while it is not approved and
 * the editing glyph while it is kept approved, with the words each mark has.
 */
function registrationOfApp(row: AppRow, index: number): ViewRegistration {
    return {
        id: appViewId(row.root, row.name),
        label: 'apps.label',
        glyph: 'apps.glyph',
        words: row.root === '' ? row.title : `${row.title} (${row.root})`,
        glyphName: row.glyph,
        group: 'apps',
        order: index + 1,
        badgeGlyph: () =>
            row.disabled ? DISABLED_GLYPH : !row.approved ? LOCK_GLYPH : row.kept ? EDIT_GLYPH : '',
        badgeMark: row.disabled
            ? 'apps.disabled_mark'
            : row.kept
              ? 'apps.editing_mark'
              : 'apps.unapproved_mark'
    };
}

/** The first position of the views apps contribute, after the apps themselves. */
const CONTRIBUTED_FROM = 1000;

/** Where the first tab of a view of each container kind opens. */
const DOCKS = { activitybar: 'left', panel: 'bottom', explorer: 'files' } as const;

/**
 * The registration of a view an app contributes: its declared name, the app's glyph, the group
 * `apps`, a place after the apps in the order of the contributions, the subtitle of its container
 * (the Files view's name for `explorer`) and the edge or pane its first tab opens in. A view of an
 * app that does not act stays registered, so its tab draws the app's state, and is not listed.
 */
function registrationOfView(
    offer: ViewOffer,
    row: AppRow | undefined,
    index: number
): ViewRegistration {
    return {
        id: contributedViewId(offer.app, offer.view.id),
        label: 'apps.label',
        glyph: 'apps.glyph',
        words: offer.view.name,
        glyphName: row?.glyph,
        group: 'apps',
        order: CONTRIBUTED_FROM + index,
        listed: row !== undefined && appActive(row),
        dock: DOCKS[offer.kind],
        ...(offer.kind === 'explorer'
            ? { headingKey: 'apps.heading_explorer' }
            : { heading: offer.containerTitle })
    };
}

/** The registrations of the panel and the custom editor tabs, which no catalogue lists. */
const OPENED: ViewRegistration[] = [
    {
        id: PANEL_VIEW,
        label: 'apps.panel_label',
        glyph: 'apps.glyph',
        group: '',
        order: 0,
        listed: false
    },
    {
        id: EDITOR_VIEW,
        label: 'apps.editor_label',
        glyph: 'apps.glyph',
        group: '',
        order: 0,
        listed: false
    }
];

/** The module a registerApps kind is drawn by: the one that exports `appRegistration` as it. */
function drawerOf(kind: string): ViewModule | undefined {
    return Object.values(viewModules).find(
        (one) => (one as { appRegistration?: unknown }).appRegistration === kind
    ) as ViewModule | undefined;
}

/** Drop the registrations a component drew that are not among the wanted ones, tabs left open. */
function dropOthers(
    registry: RegistryStore,
    module: ViewModule,
    wanted: readonly ViewRegistration[]
): void {
    const ids = new Set(wanted.map((registration) => registration.id));
    for (const registration of registry.views()) {
        if (registration.component === module.default && !ids.has(registration.id)) {
            registry.dropView(registration.id);
        }
    }
}

/**
 * Register one view per app row and one per view an app contributes, and drop the views of every
 * app the rows do not hold. The app, its webview views, its panels and its custom editors are
 * drawn by the component that exports `appRegistration` as `frame`, its tree views by the one that
 * exports `tree`. A tab on a dropped view stays open and draws as an unknown view until the app
 * returns. It runs again on every push of the `apps` channel, which is what keeps a badge and a
 * title following the row.
 *
 * A config push runs registerCollections alone: the factory it calls is the module's
 * `registration` export, which these components do not have, so neither call touches the other's
 * views.
 */
export function registerApps(registry: RegistryStore, rows: AppRow[]): void {
    const frame = drawerOf('frame');
    const tree = drawerOf('tree');
    if (frame === undefined || tree === undefined) return;
    const apps = rows.map(registrationOfApp);
    const offers = viewOffers(rows.map((row) => ({ id: appViewId(row.root, row.name), row })));
    const rowOf = (app: string): AppRow | undefined =>
        rows.find((row) => appViewId(row.root, row.name) === app);
    const views = offers.map((offer, at) => ({
        offer,
        registration: registrationOfView(offer, rowOf(offer.app), at)
    }));
    const framed = views.filter(({ offer }) => offer.view.type === 'webview');
    const wanted = [...apps, ...framed.map(({ registration }) => registration), ...OPENED];
    const treed = views.filter(({ offer }) => offer.view.type === 'tree');
    dropOthers(registry, frame, wanted);
    dropOthers(
        registry,
        tree,
        treed.map(({ registration }) => registration)
    );
    registry.registerComponent(frame.default, wanted);
    registry.registerComponent(
        tree.default,
        treed.map(({ registration }) => registration)
    );
}
