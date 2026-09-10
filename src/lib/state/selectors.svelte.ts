// Layer 2, client state. The joins, as DESIGN.md's "Client state" names them: the reactive face of
// the pure logic beside it, over what the socket delivered. A component reads a selector and never
// joins anything itself, so what a card shows is decided in one place and tested without a browser.
//
// There is no $derived in this file, and that is deliberate. A selector reads the entities store
// inside the caller's reactive scope, so a component writing `const items = $derived(board(preset))`
// gets a derived that re-runs when the snapshot changes, exactly as if the join were written in the
// component. A $derived created inside a function would be a second derived per call and would say
// nothing more.

import { boardItems, presetFor } from './board.ts';
import { config, portfolio } from './entities.svelte.ts';
import { choicesFor, formFields, formSections } from './schema.ts';
import type { BoardItem, BoardPreset } from './board.ts';
import type { Choice, FormField } from './schema.ts';
import type { Id, Project } from '../data/model.ts';

/** The merged config the `config` channel delivered, or an empty map before the first message. */
export function configMap(): Record<string, unknown> {
    return config()?.config ?? {};
}

/** The preset of one view id, over the config as it currently stands. */
export function boardPreset(view: string): BoardPreset {
    return presetFor(view, configMap());
}

/**
 * The projects of one board, joined and sorted. Before the first snapshot there are none, which is
 * the empty board the view shows its empty state for.
 */
export function board(preset: BoardPreset): BoardItem[] {
    const snapshot = portfolio();
    return snapshot === null ? [] : boardItems(snapshot, preset);
}

/** One project of the snapshot, or null before the first one arrives and for an id it does not hold. */
export function projectOf(id: Id): Project | null {
    return portfolio()?.entities.projects[id] ?? null;
}

/** The edit form as config/manifest-schema.yml describes it, in file order. */
export function manifestFields(): FormField[] {
    return formFields(configMap());
}

/** The form's sections, in the order the schema lists them. */
export function manifestSections(): string[] {
    return formSections(configMap());
}

/** What one field of choices may be set to, over the snapshot and the vocabulary as they stand. */
export function fieldChoices(field: FormField): Choice[] {
    return choicesFor(field, portfolio(), configMap());
}
