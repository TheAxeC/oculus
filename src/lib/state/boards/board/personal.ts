// Layer 2, client state. The Personal board's arithmetic: the statuses of `side_project_status` in
// their order, the cards sorted by it, the search and status toggles a view instance remembers, and
// where the title and Show in Files of a card point. Pure over the config and the side projects of
// the snapshot; no words live here but the label of the unknown status, which comes from the
// catalog.
//
// A card whose status is not in the vocabulary is drawn as `unknown` and sorted last. That status
// has no toggle, so a card the vocabulary does not name is never hidden by a control it cannot see.

import { z } from 'zod';
import type { Id, SideProject, Snapshot } from '../../../data/model/index.ts';
import { byKey } from '../../../data/helpers/guards.ts';
import {
    fieldItemsShape,
    mapShape,
    optionalTextShape,
    readAs
} from '../../../data/shapes/shapes.ts';
import { rootOf } from '../../../data/helpers/hub-names.ts';
import { t } from '../../shared/words/text.ts';
import { statusRows, type StatusRow } from '../../shared/words/status-rows.ts';
import { UNKNOWN_TONE } from '../../shared/words/tones.ts';
import { personNames } from '../person.ts';
import { tagLabel } from './items.ts';
import type { LinkedItem, RelatedTag } from './presets.ts';

export type { SideProject } from '../../../data/model/index.ts';

/** The status key of a card whose manifest names none of the vocabulary's. */
export const UNKNOWN_SIDE_STATUS = 'unknown';

/** The `live` flag of a `side_project_status` row; any value other than false is live. */
const liveShape = z.object({ live: z.boolean().catch(true) });

/** One status of `side_project_status`: the value a manifest carries, its words and its hue. */
export type SideStatus = StatusRow;

/** A side project with the status it is drawn under. */
export type SideCard = { project: SideProject; status: SideStatus };

/**
 * What a view instance remembers: the search text, the statuses toggled off and the ids of the
 * cards whose explanation is drawn whole.
 */
export type PersonalState = { search: string; hidden: string[]; more: string[] };

/** Where a card's title or folder opens: a Files root, a path in it and the tab's words. */
export type SideTarget = { root: string; path: string };

/**
 * The statuses of `side_project_status`, in the config's order. An own `__proto__` key is skipped,
 * since no manifest can name it as a status.
 */
export function sideStatuses(config: Record<string, unknown>): SideStatus[] {
    return statusRows(config, 'side_project_status', ['__proto__']);
}

/** The status a card with a status outside the vocabulary is drawn under. */
function unknownStatus(): SideStatus {
    return {
        key: UNKNOWN_SIDE_STATUS,
        label: t('personal.status_unknown'),
        glyph: t('personal.status_unknown_glyph'),
        tone: UNKNOWN_TONE
    };
}

/**
 * The cards of the side projects: each under its status, sorted by the vocabulary's order, the
 * unknown ones last, a pinned card first within its status, then by title.
 */
export function sideCards(projects: SideProject[], statuses: SideStatus[]): SideCard[] {
    const unknown = unknownStatus();
    const rank = (card: SideCard): number => {
        const at = statuses.findIndex((status) => status.key === card.status.key);
        return at === -1 ? statuses.length : at;
    };
    return projects
        .map((project): SideCard => {
            const status = statuses.find((one) => one.key === project.status) ?? unknown;
            return { project, status };
        })
        .sort(
            (a, b) =>
                rank(a) - rank(b) ||
                Number(b.project.pin === true) - Number(a.project.pin === true) ||
                a.project.title.localeCompare(b.project.title, undefined, {
                    sensitivity: 'base'
                })
        );
}

/**
 * Whether the Focus board reads a side project: its status row in `side_project_status` does not
 * carry `live: false`. A status the vocabulary does not name is read.
 */
export function sideLive(
    project: Pick<SideProject, 'status'>,
    config: Record<string, unknown>
): boolean {
    const rows = readAs(mapShape, config.side_project_status);
    const row = rows === null ? undefined : byKey(rows, project.status);
    return readAs(liveShape, row)?.live !== false;
}

/** The state a view instance starts in: no search, every status shown, every explanation cut. */
export function emptyPersonalState(): PersonalState {
    return { search: '', hidden: [], more: [] };
}

/** The fields of a saved state, each read apart, so a wrong one costs that field alone. */
const stateShape = z.object({
    search: optionalTextShape,
    hidden: fieldItemsShape,
    more: fieldItemsShape
});

/** Read a saved state, falling back one field at a time when a value is invalid. */
export function parsePersonalState(value: unknown): PersonalState {
    const held = readAs(stateShape, value);
    if (held === null || readAs(mapShape, value) === null) return emptyPersonalState();
    return { search: held.search ?? '', hidden: held.hidden, more: held.more };
}

/** The state with one status toggled: off when it was on, on when it was off. */
export function toggleStatus(state: PersonalState, key: string): PersonalState {
    const hidden = state.hidden.includes(key)
        ? state.hidden.filter((one) => one !== key)
        : [...state.hidden, key];
    return { ...state, hidden };
}

/** The state with one card's explanation drawn whole, or cut again. */
export function toggleMore(state: PersonalState, id: string): PersonalState {
    const more = state.more.includes(id)
        ? state.more.filter((one) => one !== id)
        : [...state.more, id];
    return { ...state, more };
}

/**
 * The cards the search and the toggles leave. The search is a case-insensitive match of title,
 * eli5 or next; a card of the unknown status is never hidden by a toggle.
 */
export function filterCards(cards: SideCard[], state: PersonalState): SideCard[] {
    const needle = state.search.trim().toLowerCase();
    return cards.filter((card) => {
        if (card.status.key !== UNKNOWN_SIDE_STATUS && state.hidden.includes(card.status.key)) {
            return false;
        }
        if (needle === '') return true;
        const { title, eli5, next } = card.project;
        return [title, eli5, next].some((text) => text.toLowerCase().includes(needle));
    });
}

/** The line under a card's title that says where the project lives. */
export function sourceLine(project: SideProject): string {
    return project.source.kind === 'hub' ? project.source.folder : project.source.key;
}

/** The file a card's title opens: its manifest, under the Files root that holds it. */
export function manifestTarget(project: SideProject): SideTarget & { label: string } {
    if (project.source.kind === 'hub') {
        return {
            root: rootOf(project),
            path: `${project.source.folder}/project.yml`,
            label: project.source.folder.split('/').pop() ?? project.source.folder
        };
    }
    return { root: project.source.key, path: '.oculus/project.yml', label: project.title };
}

/** What Show in Files selects: a hub side project's folder, a repository's top folder. */
export function folderTarget(project: SideProject): SideTarget {
    return project.source.kind === 'hub'
        ? { root: rootOf(project), path: project.source.folder }
        : { root: project.source.key, path: '' };
}

/**
 * The people and projects a side project's card links to: its `collaborators:` as people, drawn by
 * their names in the registry, and its `related:` as projects, drawn by their short name or title,
 * and by the id itself, marked not held, when no project has it.
 */
export function sideLinks(project: SideProject, snapshot: Snapshot | null): LinkedItem {
    const names = personNames(snapshot);
    const projects = snapshot?.entities.projects ?? {};
    const related = (project.relatedIds ?? []).map((id: Id): RelatedTag => {
        const held = byKey(projects, id);
        return { id, label: held === undefined ? id : tagLabel(held), held: held !== undefined };
    });
    return {
        id: project.id,
        pillars: [],
        funding: [],
        datasets: [],
        collaborators: (project.collaborators ?? []).map((id) => ({
            id,
            label: byKey(names, id) ?? id
        })),
        software: [],
        related
    };
}
