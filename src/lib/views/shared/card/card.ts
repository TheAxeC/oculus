// Layer 3, view helpers. Project-card path, label and deadline calculations, what a session press
// on the card opens, and the shape of a card's control, live here because pure display rules
// change independently of Svelte markup.

import { DEADLINE_SOON, daysUntil, type BoardItem, type BoardTag } from '$lib/state/boards/board';
import { pausesCountdown } from '$lib/state/boards/focus';
import type { ClientState } from '$lib/state/client/context';
import {
    isInstanceOf,
    recordState,
    tabsOf,
    type Instance,
    type Layout
} from '$lib/state/workbench/layout';
import { placeOf } from '$lib/state/shared/page/hubs';
import { fileBytesUrl } from '$lib/state/sources/fs-transport';
import { t } from '$lib/state/shared/words/text';
import { openPage } from '../explorer/opening';

export type Translate = (key: string, ...args: (string | number)[]) => string;

/**
 * One control a card carries (CardActions.svelte draws the row): its words, its hover words, its
 * glyph and what pressing it does.
 */
export type CardAction = {
    /** Stable within one card, so a control keeps its measured width when it moves. */
    id: string;
    label: string;
    title?: string;
    /** A glyph name; a control with one is drawn as its icon, one without as its words. */
    glyph?: string;
    /** Turn the glyph round and round while the action it started is under way. */
    turning?: boolean;
    active?: boolean;
    /** Drawn disabled, with `title` saying why; pressing it does nothing. */
    disabled?: boolean;
    /** The control that opens and closes the card, which the keyboard's Enter reaches. */
    toggle?: boolean;
    onclick: () => void | Promise<void>;
};

/**
 * The views that follow the selected session, so a session pressed on a card shows in one of them
 * when the page holds one. A Terminal tab draws only the terminals it owns and follows no
 * selection, so it is not among them.
 */
export const SESSION_VIEWS = ['session-list', 'session-detail', 'transcript', 'timeline'] as const;

/**
 * The tab a session pressed on a card opens in: of the tabs of a tree that follow the selected
 * session, a view of SESSION_VIEWS that pins no session, the one the page used last (`used`, the
 * page's tabs, the one activated last first), else the first; null when the tree holds none, and
 * the press then opens the session's own detail tab.
 */
export function sessionTab(tree: Layout, used: readonly string[]): Instance | null {
    const following = tabsOf(tree).filter((tab) =>
        SESSION_VIEWS.some((view) => isInstanceOf(tab, view, null))
    );
    const last = used.find((id) => following.some((tab) => tab.id === id));
    return following.find((tab) => tab.id === last) ?? following.at(0) ?? null;
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

/** A path below a project's folder against its Files root; the folder is empty at a root's top. */
export function below(folder: string, path: string): string {
    return folder === '' ? path : `${folder}/${path}`;
}

/** The encoded api/file address for a project-relative file. */
export function urlOf(folder: string, path: string, root: string): string {
    return fileBytesUrl(root, below(folder, path));
}

/**
 * Open a registered collection or registry view at one label, and nothing when none is registered.
 */
export function goto(client: ClientState, view: string, label: string): void {
    if (client.registry.viewFor(view) !== undefined) {
        client.layout.openView(view, { label });
    }
}

/**
 * Open one of a project's fixed documents in a document tab under the root of the hub `root` names.
 */
export function openDocument(
    client: ClientState,
    folder: string,
    path: string,
    root: string
): void {
    openPage(client, { root, path: below(folder, path), label: path });
}

/**
 * Open the workbench of a project's folder, under the Files root that holds it, named by the
 * project's title, with the project view in its documents pane.
 */
export function openWorkbench(client: ClientState, item: BoardItem, tab: string): void {
    const first = { view: 'project', state: recordState(item.id, tab) };
    const { root, path } = placeOf(item.project);
    client.folders.open({ root, path }, { label: item.project.title, item: first });
}

/**
 * The deck a card's presentation control opens: the project's own `present/` folder, relative to
 * the hub, and nothing for a project that holds none. It is the whole of what the control decides,
 * so which deck a card opens is a plain call rather than a rendered page.
 */
export function deckOf(project: BoardItem['project']): string | null {
    return project.deck ?? null;
}

/** The catalogued label for a code-deposit state. */
export function codeLabel(value: string, translate: Translate): string {
    if (value === 'deposited') return translate('board.code_deposited');
    if (value === 'review-anon') return translate('board.code_anon');
    if (value === 'none') return translate('board.code_pending');
    return translate('board.code_none');
}

/**
 * The deadline badge label and tone for one project; a project carrying a chip with
 * `pauses_countdown` (submitted) shows its date with no countdown.
 */
export function deadline(
    project: BoardItem['project'],
    chips: string[],
    now: number,
    translate: Translate,
    config: Record<string, unknown>
): { label: string; tone?: string } | null {
    const date = project.deadline;
    if (date === undefined || date === '') return null;
    const days = daysUntil(date, now);
    if (days === null || pausesCountdown({ chips }, config)) return { label: date };
    if (days < 0) return { label: translate('project.card.overdue', -days), tone: 'red' };
    if (days <= DEADLINE_SOON) {
        return { label: translate('project.card.due_days', days), tone: 'amber' };
    }
    return { label: date };
}

/** How many projects a registry card holds, as its tag reads: a count, singular or plural. */
export function projectCount(count: number): string {
    return `${count} ${count === 1 ? t('pillars.project') : t('pillars.projects')}`;
}

/** The control that opens a registry card's entry in its file, titled with the file's name. */
export function editAction(fileName: string, onedit: () => void): CardAction {
    return {
        id: 'edit',
        label: t('collection.edit_in_file'),
        title: t('collection.edit_in_file_title', fileName),
        glyph: t('collection.edit_glyph'),
        onclick: onedit
    };
}
