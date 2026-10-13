// Layer 3, view helper of views/sessions/session-detail/. The sections of the Session view and what
// a Session tab keeps of them in its own state: `sections`, the order they are drawn in, and
// `closed`, the ones the reader closed. Both live beside the tab's `session` and `label`, so a
// reload, a switch of tab and a move of the tab keep them, and a pick or a pin changes only the two
// fields it is about (state/workbench/layout/tabs/instances.ts). A section starts open, and a list
// the state holds wrongly (a name no section has, a section twice, a value that is no list) is read
// as if the bad part were absent.

import { instanceMap } from '$lib/state/workbench/layout/instance';

/** The sections in the order a new tab draws them. */
const SECTIONS = ['details', 'changes', 'agents'] as const;

export type SectionId = (typeof SECTIONS)[number];

function isSection(id: unknown): id is SectionId {
    return SECTIONS.some((one) => one === id);
}

/** The sections a state names under `key`, each once, in the order it names them. */
function named(state: unknown, key: string): SectionId[] {
    const held = instanceMap(state)[key];
    const listed = Array.isArray(held) ? held.filter(isSection) : [];
    return listed.filter((id, at) => listed.indexOf(id) === at);
}

/** The sections in the order the tab keeps: the ones it names, then the rest in default order. */
export function sectionOrder(state: unknown): SectionId[] {
    const kept = named(state, 'sections');
    return [...kept, ...SECTIONS.filter((id) => !kept.includes(id))];
}

/** Whether the tab holds a section open. */
export function sectionIsOpen(state: unknown, id: SectionId): boolean {
    return !named(state, 'closed').includes(id);
}

/** The tab's state with one section opened if it was closed and closed if it was open. */
export function sectionToggled(state: unknown, id: SectionId): Record<string, unknown> {
    const closed = named(state, 'closed');
    return {
        ...instanceMap(state),
        closed: closed.includes(id) ? closed.filter((one) => one !== id) : [...closed, id]
    };
}

/** The tab's state with its sections in this order. */
export function sectionsOrdered(state: unknown, order: string[]): Record<string, unknown> {
    return { ...instanceMap(state), sections: order.filter(isSection) };
}

/** The id of a row in a section's tree, from the kind of row and what it stands for. */
export function rowKey(kind: 'file' | 'agent', id: string): string {
    return `${kind}:${id}`;
}
