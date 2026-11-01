// Layer 3, view helpers. Project-card path, label and deadline calculations, the glyph each fact
// of the card's top row is drawn with, what a session press on the card opens, and the shape of a
// card's control, live here because pure display rules change independently of Svelte markup.

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
import { hasGlyph, t } from '$lib/state/shared/words/text';
import { resourceGlyph } from '$lib/state/forms/schema';
import { openPage } from '../explorer/opening';

export type Translate = (key: string, ...args: (string | number)[]) => string;

/**
 * One control a card carries (record/CardActions.svelte draws the strip, record/record-menu.ts the
 * menu): its words, its hover words, its glyph and what pressing it does.
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
    /**
     * The control is one of a set of which one is in force: its row in the menu is drawn with a
     * check mark when true and the empty box when false.
     */
    checked?: boolean;
    /** Drawn disabled, with `title` saying why; pressing it does nothing. */
    disabled?: boolean;
    /** The control that opens and closes the card, which the keyboard's Enter reaches. */
    toggle?: boolean;
    /**
     * The controls this one stands for: in the menu a submenu, in the strip a menu opened by the
     * control. A control with them is never a pick itself, so its `onclick` is not run.
     */
    items?: CardAction[];
    onclick: () => void | Promise<void>;
};

/**
 * The views that follow the selected session, so a session pressed on a card shows in one of them
 * when the page holds one. A Terminal tab draws only the terminals it owns and follows no
 * selection, so it is not among them.
 */
export const SESSION_VIEWS = ['session-list', 'session-detail', 'transcript'] as const;

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
 * A tag of the team names a person rather than a record of a collection, so it opens the Person
 * view for that key; the funding tag opens `funding`, the view of the funding registry under the
 * key the project's hub gives it.
 */
export function linkView(kind: string, funding: string): string {
    if (kind === 'funding') return funding;
    if (kind === 'team') return 'person';
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

/** The glyph a lane is drawn with when its row names none, or a name the glyph vocabulary lacks. */
const LANE_GLYPH = 'focus';

/** The glyph a form or a chip is drawn with when its word names none, or a name it lacks. */
const WORD_GLYPH = 'tag';

/**
 * The glyph a lane of `focus_lanes` is drawn with, on a project card and in the lane's heading on
 * the Focus board: the row's `icon` where the glyph vocabulary holds it, else the Focus board's own
 * glyph, so every lane carries one and no name from a hub's file reaches a Glyph that would throw.
 */
export function laneGlyph(icon: string): string {
    return hasGlyph(icon) ? icon : LANE_GLYPH;
}

/**
 * The glyph a form or a chip is drawn with in a card's top row: its word's `icon` where the glyph
 * vocabulary holds it, else the glyph `tag`, so every fact carries one.
 */
export function wordGlyph(icon: string): string {
    return hasGlyph(icon) ? icon : WORD_GLYPH;
}

/**
 * The glyph a compute resource is drawn with in a card's top row: the one of its kind
 * (`resourceGlyph`), and the cluster's for a kind outside the three, so every fact carries one.
 */
export function computeGlyph(kind: string): string {
    return resourceGlyph(kind) ?? t('project.card.hpc_glyph');
}

/** The catalogued label for a code-deposit state. */
export function codeLabel(value: string, translate: Translate): string {
    if (value === 'deposited') return translate('board.code_deposited');
    if (value === 'review-anon') return translate('board.code_anon');
    if (value === 'none') return translate('board.code_pending');
    return translate('board.code_none');
}

/**
 * The deadline badge label and tone for one project; a project whose stage carries
 * `pauses_countdown` in `stages` (submitted) shows its date with no countdown.
 */
export function deadline(
    project: BoardItem['project'],
    now: number,
    translate: Translate,
    config: Record<string, unknown>
): { label: string; tone?: string } | null {
    return dueBadge(project.deadline, now, translate, pausesCountdown(project, config));
}

/**
 * The deadline badge label and tone for one date, as every card draws it: overdue in red with its
 * days, due within `DEADLINE_SOON` days in amber with its days, the date itself otherwise or when
 * `paused`; null for no date.
 */
export function dueBadge(
    date: string | undefined,
    now: number,
    translate: Translate,
    paused = false
): { label: string; tone?: string } | null {
    if (date === undefined || date === '') return null;
    const days = daysUntil(date, now);
    if (days === null || paused) return { label: date };
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
