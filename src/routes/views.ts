// Layer 3, routes. Discover view modules and register their exported metadata with each module's
// default component. The route layer owns discovery so the view boundary does not import views.

import type { Component } from 'svelte';
import { registerComponent, type ViewProps, type ViewRegistration } from '$lib/views/registry';

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

/** Register the generic Collection view once per configured collection key. */
export function registerCollections(keys: string[]): void {
    for (const unknownModule of Object.values(modules)) {
        const module = unknownModule as ViewModule;
        if (typeof module.registration !== 'function') continue;
        registerComponent(module.default, definitions(module.registration, keys));
    }
}
