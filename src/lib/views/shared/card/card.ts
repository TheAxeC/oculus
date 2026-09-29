// Layer 3, view helpers. Project-card path, label and deadline calculations, and what a session
// press on the card opens, live here because pure display rules change independently of Svelte
// markup.

import { DEADLINE_SOON, daysUntil, type BoardItem, type BoardTag } from '$lib/state/boards/board';
import type { ClientState } from '$lib/state/client/context';
import { findView, type Layout } from '$lib/state/workbench/layout';

export type Translate = (key: string, ...args: (string | number)[]) => string;

/**
 * The views that follow the selected session, so a session pressed on a card shows in one of them
 * when the page holds one. A Terminal tab draws only the terminals it owns and follows no
 * selection, so it is not among them.
 */
export const SESSION_VIEWS = [
    'session-list',
    'session-detail',
    'timeline',
    'changes',
    'agents'
] as const;

/**
 * Whether a tree already shows a view that follows the selected session; when it shows none, a
 * session pressed on a card opens that session's own detail tab.
 */
export function sessionViewShown(tree: Layout): boolean {
    return SESSION_VIEWS.some((view) => findView(tree, view, null) !== null);
}

/** How many entries of one tag kind a collapsed card draws before the rest need its own control. */
export const SHOWN = 3;

/** What one tag kind draws: every entry while that kind is expanded, the first SHOWN otherwise. */
export function shownTags(tags: BoardTag[], expanded: boolean): BoardTag[] {
    return expanded ? tags : tags.slice(0, SHOWN);
}

/**
 * The view one tag kind's entries open, and the empty string for a kind that is not a cross-link.
 * A collaborator tag names a person rather than a record of a collection, so it opens the Person
 * view for that key; the funding tag opens the collection the scheme is an entry of.
 */
export function linkView(kind: string): string {
    if (kind === 'funding') return 'funding';
    if (kind === 'collaborators') return 'person';
    return '';
}

/** The last segment of a path. */
export function nameOf(path: string): string {
    const at = path.lastIndexOf('/');
    return at < 0 ? path : path.slice(at + 1);
}

/** The folder part of a path. */
export function subOf(path: string): string {
    const at = path.lastIndexOf('/');
    return at < 0 ? '' : path.slice(0, at);
}

/** The encoded api/file address for a project-relative file. */
export function urlOf(folder: string, path: string): string {
    const parts = `${folder}/${path}`
        .split('/')
        .filter((one) => one !== '')
        .map((one) => encodeURIComponent(one));
    return `/api/file/hub/${parts.join('/')}`;
}

/**
 * Open a registered collection or registry view at one label, and nothing when none is registered.
 */
export function goto(client: ClientState, view: string, label: string): void {
    if (client.registry.viewFor(view) !== undefined) {
        client.layout.openView(view, { label });
    }
}

/** Open one of a project's fixed documents in a document tab under the hub root. */
export function openDocument(client: ClientState, folder: string, path: string): void {
    client.layout.openView('document', {
        root: 'hub',
        path: `${folder}/${path}`,
        label: path
    });
}

/**
 * The slide the deck opens at for one project: the first of the slides its PRESENT.md declares, and
 * nothing for a project that declares none. It is the whole of what the card's deck control
 * decides, so which slide a card opens is a plain call rather than a rendered page.
 */
export function deckSlideOf(project: BoardItem['project']): string | null {
    return (project.present ?? [])[0]?.id ?? null;
}

/** The catalogued label for a code-deposit state. */
export function codeLabel(value: string, translate: Translate): string {
    if (value === 'deposited') return translate('board.code_deposited');
    if (value === 'review-anon') return translate('board.code_anon');
    if (value === 'none') return translate('board.code_pending');
    return translate('board.code_none');
}

/** The deadline badge label and tone for one project. */
export function deadline(
    project: BoardItem['project'],
    chips: string[],
    now: number,
    translate: Translate
): { label: string; tone?: string } | null {
    const date = project.deadline;
    if (date === undefined || date === '') return null;
    const days = daysUntil(date, now);
    if (days === null || chips.includes('submitted')) return { label: date };
    if (days < 0) return { label: translate('project.card.overdue', -days), tone: 'red' };
    if (days <= DEADLINE_SOON) {
        return { label: translate('project.card.due_days', days), tone: 'amber' };
    }
    return { label: date };
}
