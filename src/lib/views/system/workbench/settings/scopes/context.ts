// Layer 3, view helper. The scopes of a Settings view handed to the partials drawn inside it (a
// secret's box, an app's setting, a rail list, a layout tree) through Svelte's context, so a
// control deep in an editor's cards holds its change in the scope on screen without each partial
// between them passing it on. A partial drawn outside a Settings view finds none.

import { getContext, setContext } from 'svelte';
import type { Scopes } from './scopes.svelte';

/** The key the scopes are kept under in the context. */
const KEY = Symbol('settings-scopes');

/** Hand the scopes to the partials of the view. */
export function provideScopes(scopes: Scopes): void {
    setContext(KEY, scopes);
}

/** The scopes of the Settings view the partial is drawn in, or null outside one. */
export function scopesHere(): Scopes | null {
    return getContext<Scopes | undefined>(KEY) ?? null;
}
