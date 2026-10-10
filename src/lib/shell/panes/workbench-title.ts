// Layer 3, shell. The document title: the words on the active main tab and the count of sessions
// waiting in front of them. Apart from the component so the DOM-free string contract is testable.
// It sits in shell/panes beside the folded pane that draws it, below Workbench.svelte, which reads
// it too, so the shell's folders import downward only.

import { t as catalogText } from '$lib/state/shared/words/text';
import { engineDocName } from '$lib/state/workbench/navigation/pages';
import { registrationLabel } from '$lib/state/workbench/navigation/registry';
import type { RegistryStore } from '$lib/state/workbench/navigation/registry';
import { instanceLabel, type Instance } from '$lib/state/workbench/layout';

/** The words on the active main tab, including the per-instance label when it has one. */
export function activeLabel(registry: RegistryStore, instance: Instance | null): string {
    if (instance === null) return catalogText('app.title');
    const held = instanceLabel(instance.state) ?? engineDocName(instance);
    if (held !== null) return held;
    const registered = registry.viewFor(instance.view);
    return registered === undefined
        ? catalogText('ui.unknown_view', instance.view)
        : registrationLabel(registered);
}

/** The active main tab title, with a waiting count in front when a session needs attention. */
export function windowTitle(waiting: number, label: string): string {
    const active = catalogText('app.nav.title_fmt', catalogText('app.nav.host'), label);
    return waiting > 0 ? catalogText('app.title_waiting', waiting, active) : active;
}
