// Layer 3, shell. The document title: the words on the active main tab and the count of sessions
// waiting in front of them. Apart from the component so the DOM-free string contract is testable.

import { t as catalogText } from '$lib/state/text';
import { registrationLabel, viewFor } from '$lib/views/registry';
import type { Instance } from '$lib/state/layout';

/** The words on the active main tab, including the per-instance label when it has one. */
export function activeLabel(instance: Instance | null): string {
    if (instance === null) return catalogText('app.title');
    if (typeof instance.state === 'object' && instance.state !== null) {
        const held = (instance.state as Record<string, unknown>).label;
        if (typeof held === 'string' && held !== '') return held;
    }
    const registered = viewFor(instance.view);
    return registered === undefined
        ? catalogText('ui.unknown_view', instance.view)
        : registrationLabel(registered);
}

/** The active main tab title, with a waiting count in front when a session needs attention. */
export function windowTitle(waiting: number, label: string): string {
    const active = catalogText('app.nav.title_fmt', catalogText('app.nav.host'), label);
    return waiting > 0 ? catalogText('app.title_waiting', waiting, active) : active;
}
