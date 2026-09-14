// Layer 2, client state. Board item construction and sorting live here because project joins change
// independently of filters, facets and statistics.

import { domainLabel, domainTone, typeTone } from '../tones.ts';
import type { Id, Project, Snapshot } from '../../data/model.ts';
import {
    SESSIONS_NONE,
    authorLine,
    bucketOf,
    venueText,
    type BoardItem,
    type BoardPreset,
    type BoardTag,
    type SessionsOf
} from './presets.ts';

function collaboratorNames(snapshot: Snapshot): Record<Id, string> {
    const names: Record<Id, string> = {};
    const collection = snapshot.entities.collections.collaborations;
    if (collection === undefined) return names;
    for (const entry of collection.entries) names[entry.id] = entry.title;
    return names;
}

/** Everything the search reads, from the project and from what it was joined with. */
function haystack(project: Project, item: Omit<BoardItem, 'haystack'>): string {
    const tags = [...item.programs, ...item.funding, ...item.datasets, ...item.collaborators];
    const parts = [
        project.title,
        project.short ?? '',
        project.eli5 ?? '',
        project.latest ?? '',
        project.next ?? '',
        project.outcome ?? '',
        item.venue?.text ?? project.venue ?? '',
        ...project.results,
        ...project.ideas,
        ...tags.map((tag) => tag.id),
        ...tags.map((tag) => tag.label)
    ];
    return parts.join(' ').toLowerCase();
}

/** One project with its joins, ready for a card, a row, a facet and a filter. */
function itemOf(
    project: Project,
    snapshot: Snapshot,
    preset: BoardPreset,
    names: Record<Id, string>,
    sessionsOf: SessionsOf
): BoardItem {
    const entities = snapshot.entities;
    const domainId = project.domainIds[0];
    const venue = project.venueId === undefined ? undefined : entities.venues[project.venueId];
    const tag = (id: Id, label: string): BoardTag => ({ id, label });

    const item: Omit<BoardItem, 'haystack'> = {
        id: project.id,
        project,
        tone: typeTone(project.type ?? ''),
        domain:
            domainId === undefined
                ? null
                : { id: domainId, label: domainLabel(domainId), tone: domainTone(domainId) },
        venue:
            venue === undefined
                ? null
                : {
                      id: venue.id,
                      text: venueText(venue),
                      short:
                          venue.short !== undefined && venue.short !== '' ? venue.short : venue.name
                  },
        programs: project.programIds.map((id) => tag(id, entities.programs[id]?.title ?? id)),
        funding: project.fundingIds.map((id) => tag(id, id)),
        datasets: project.datasetIds.map((id) => tag(id, id)),
        collaborators: project.collaborators.map((id) => tag(id, names[id] ?? id)),
        authors: authorLine(project),
        bucket: bucketOf(project, preset.rollup),
        code: project.codeAvailability?.status ?? '',
        compute: project.compute ?? '',
        reproduced: project.reproduced !== undefined,
        year: project.year === undefined ? '' : String(project.year),
        sessions: sessionsOf(project),
        chips: project.chips
    };
    return { ...item, haystack: haystack(project, item) };
}

/** Pinned first, then the config's type order, then the title. */
function compare(left: BoardItem, right: BoardItem, order: string[]): number {
    const pinned = Number(right.project.pin === true) - Number(left.project.pin === true);
    if (pinned !== 0) return pinned;
    const rank = (item: BoardItem): number => {
        const at = item.project.type === undefined ? -1 : order.indexOf(item.project.type);
        return at < 0 ? order.length : at;
    };
    const byType = rank(left) - rank(right);
    if (byType !== 0) return byType;
    return left.project.title.localeCompare(right.project.title);
}

/**
 * The projects of a board, joined and sorted. A project of another tier is not here, and nothing
 * is filtered: a facet counts what this returns, and a filter is applied to it afterwards.
 */
export function boardItems(
    snapshot: Snapshot,
    preset: BoardPreset,
    sessionsOf: SessionsOf = () => SESSIONS_NONE
): BoardItem[] {
    const names = collaboratorNames(snapshot);
    const items = Object.values(snapshot.entities.projects)
        .filter((project) => preset.tiers.includes(project.tier))
        .map((project) => itemOf(project, snapshot, preset, names, sessionsOf));
    return items.sort((left, right) => compare(left, right, preset.typeOrder));
}
