// Layer 3, view helpers. Project-card path, label and deadline calculations live here because pure
// display rules change independently of Svelte markup.

import { DEADLINE_SOON, daysUntil, type BoardItem } from '$lib/state/board';
import type { ClientState } from '$lib/state/context';

export type FileRow = { path: string; size: number; mtime: number };
export type Translate = (key: string, ...args: (string | number)[]) => string;

/** The file rows whose folder-relative path contains the case-insensitive query. */
export function matching(all: FileRow[], needle: string): FileRow[] {
    const text = needle.trim().toLowerCase();
    return text === '' ? all : all.filter((row) => row.path.toLowerCase().includes(text));
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

/** Open a registered collection or registry view at one label, and nothing when none is registered. */
export function goto(client: ClientState, view: string, label: string): void {
    if (client.registry.viewFor(view) !== undefined) {
        client.layout.openView(view, 'main', { label });
    }
}

/** Open one of a project's fixed documents in a document tab under the hub root. */
export function openDocument(client: ClientState, folder: string, path: string): void {
    client.layout.openView('document', 'main', {
        root: 'hub',
        path: `${folder}/${path}`,
        label: path
    });
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
