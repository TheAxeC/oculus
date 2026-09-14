// Layer 3, routes. Discover view modules and register their exported metadata with each module's
// default component. The route layer owns discovery so the view boundary does not import views.

import type { Component } from 'svelte';
import {
    registerComponent,
    unregisterView,
    views,
    type ViewProps,
    type ViewRegistration
} from '$lib/views/registry';

type RegistrationSource =
    ViewRegistration | ViewRegistration[] | ((keys: string[]) => ViewRegistration[]);

type ViewModule = {
    default: Component<ViewProps>;
    registration?: RegistrationSource;
};

/** Read one source as a list, leaving collection factories for registerCollections(). */
function definitions(source: RegistrationSource, keys?: string[]): ViewRegistration[] {
    if (typeof source === 'function') return keys === undefined ? [] : source(keys);
    return Array.isArray(source) ? source : [source];
}

/** Register every discovered module that exports registration; other modules are view partials. */
export function registerModules(modules: Record<string, unknown>): void {
    for (const [, unknownModule] of Object.entries(modules).sort(([left], [right]) =>
        left.localeCompare(right)
    )) {
        const module = unknownModule as ViewModule;
        if (module.registration === undefined) continue;
        registerComponent(module.default, definitions(module.registration));
    }
}

const modules = import.meta.glob('$lib/views/**/*.svelte', { eager: true });
registerModules(modules);

/**
 * Register the generic Collection view once per configured collection key, and drop the views of
 * every key the list no longer holds, so a collection taken out of config/sources.yml leaves the
 * rail and the palette with the keys that took it out rather than at the next reload.
 *
 * What a factory module registered last time is read back from the registry, as the registrations
 * drawn by that module's own component, so this module owns the collection registrations without
 * keeping a second record of them anywhere.
 */
export function registerCollections(keys: string[]): void {
    for (const unknownModule of Object.values(modules)) {
        const module = unknownModule as ViewModule;
        if (typeof module.registration !== 'function') continue;
        const wanted = definitions(module.registration, keys);
        const ids = new Set(wanted.map((registration) => registration.id));
        for (const registration of views()) {
            if (registration.component !== module.default) continue;
            if (!ids.has(registration.id)) unregisterView(registration.id);
        }
        registerComponent(module.default, wanted);
    }
}
