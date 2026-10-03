// Layer 4, test helper. Registers the Alpha test view on a client's registry, in the group the
// shell tests draw tabs of, so a case that renders a strip or a float need not spell the
// registration.

import type { ClientState } from '../../fixtures/client.ts';
import Alpha from './Alpha.svelte';

/** Register the `alpha` view on this client. */
export function registerAlpha(client: ClientState): void {
    client.registry.registerView({
        id: 'alpha',
        label: 'views.status',
        glyph: 'views.status_glyph',
        component: Alpha,
        group: 'probe',
        order: 0
    });
}
