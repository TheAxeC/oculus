// Layer 3, routes. Discover view modules and register their exported metadata with each module's
// default component. The route layer owns discovery so the view boundary does not import views.

import type { Component } from 'svelte';
import { z } from 'zod';
import { appViewId } from '$lib/data/helpers/files/apps';
import type { AppRow } from '$lib/data/model';
import { collectionKeys } from '$lib/data/snapshot/normalise';
import { itemsShape, readAs } from '$lib/data/shapes/shapes';
import type {
    RegistryStore,
    ViewProps,
    ViewRegistration
} from '$lib/state/workbench/navigation/registry';

type RegistrationSource =
    ViewRegistration | ViewRegistration[] | ((keys: string[]) => ViewRegistration[]);

type ViewModule = {
    default: Component<ViewProps>;
    registration?: RegistrationSource;
};

/** The `collections` field of a pushed configuration, when it holds a list. */
const pushedShape = z.object({ collections: itemsShape });

/** Read one source as a list, leaving collection factories for registerCollections(). */
function definitions(source: RegistrationSource, keys?: string[]): ViewRegistration[] {
    if (typeof source === 'function') return keys === undefined ? [] : source(keys);
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

/**
 * The collection keys a pushed configuration names: those `collectionKeys` reads from its
 * `collections` list, none for an empty list, and null when the configuration holds no list there.
 */
export function pushedCollections(pushed: unknown): string[] | null {
    const held = readAs(pushedShape, pushed);
    return held === null ? null : collectionKeys(held);
}

/**
 * Register the generic Collection view once per configured collection key, and drop the views of
 * every key the list no longer holds, so a collection taken out of config/sources.yml leaves the
 * rail and the palette with the keys that took it out rather than at the next reload.
 *
 * A key that is the id of a view a module registers as its own is left out, so a `collections:`
 * entry named `debug` or `files` never replaces a built-in view.
 *
 * What a factory module registered last time is read back from the registry, as the registrations
 * drawn by that module's own component, so this module owns the collection registrations without
 * keeping a second record of them anywhere.
 */
export function registerCollections(registry: RegistryStore, keys: string[]): void {
    const builtIn = new Set(
        Object.values(viewModules).flatMap((unknownModule) => {
            const source = (unknownModule as ViewModule).registration;
            return source === undefined || typeof source === 'function'
                ? []
                : definitions(source).map((registration) => registration.id);
        })
    );
    const free = keys.filter((key) => !builtIn.has(key));
    for (const unknownModule of Object.values(viewModules)) {
        const module = unknownModule as ViewModule;
        if (typeof module.registration !== 'function') continue;
        const wanted = definitions(module.registration, free);
        const ids = new Set(wanted.map((registration) => registration.id));
        for (const registration of registry.views()) {
            if (registration.component !== module.default) continue;
            if (!ids.has(registration.id)) registry.unregisterView(registration.id);
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
 * `apps`, and the order the section gives (the machine apps by name, then the apps of each root).
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
        order: index,
        badgeGlyph: () =>
            row.disabled ? DISABLED_GLYPH : !row.approved ? LOCK_GLYPH : row.kept ? EDIT_GLYPH : '',
        badgeMark: row.disabled
            ? 'apps.disabled_mark'
            : row.kept
              ? 'apps.editing_mark'
              : 'apps.unapproved_mark'
    };
}

/**
 * Register one view per app row, each drawn by the one component that exports `appRegistration`,
 * and drop the views of every app the rows do not hold. A tab on a dropped view stays open and
 * draws as an unknown view until the app returns. It runs again on every push of the `apps`
 * channel, which is what keeps a badge and a title following the row.
 *
 * A config push runs registerCollections alone: the factory it calls is the module's
 * `registration` export, which AppFrame does not have, so neither call touches the other's views.
 */
export function registerApps(registry: RegistryStore, rows: AppRow[]): void {
    const module = Object.values(viewModules).find(
        (one) => (one as { appRegistration?: unknown }).appRegistration !== undefined
    ) as ViewModule | undefined;
    if (module === undefined) return;
    const wanted = rows.map(registrationOfApp);
    const ids = new Set(wanted.map((registration) => registration.id));
    for (const registration of registry.views()) {
        if (registration.component !== module.default) continue;
        if (!ids.has(registration.id)) registry.dropView(registration.id);
    }
    registry.registerComponent(module.default, wanted);
}
