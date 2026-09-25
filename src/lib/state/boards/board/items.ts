// Layer 2, client state. Board item construction and sorting live here because project joins change
// independently of filters, facets and statistics.

import { byKey } from '../../../data/helpers/guards.ts';
import { domainLabel, domainTone, typeTone } from '../../words/tones.ts';
import type { Id, Project, Snapshot } from '../../../data/model/index.ts';
import { personNames } from '../person.ts';
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

/**
 * The name a cross-link tag carries: the short handle when the manifest has one, else the title.
 */
function tagLabel(project: Project): string {
    const short = project.short?.trim() ?? '';
    return short === '' ? project.title : short;
}

/**
 * The other end of one project's link with the software tier, as tags sorted by their label.
 *
 * Every project is read backwards, over the snapshot's related pairs, for the software whose
 * `related:` names it, so a paper carries no key of its own for the software that implements it;
 * a software project is read forwards as well, through its own `related:`, since that is where the
 * link is written. A project never links to itself, and one named from both sides is one tag.
 */
function softwareTags(project: Project, snapshot: Snapshot): BoardTag[] {
    const projects = snapshot.entities.projects;
    const backwards = snapshot.relations.projectRelated
        .filter((pair) => pair[1] === project.id)
        .map((pair) => pair[0])
        .filter((id) => byKey(projects, id)?.tier === 'software');
    const forwards = project.tier === 'software' ? project.relatedIds : [];
    const ids = [...new Set([...forwards, ...backwards])];
    const tags: BoardTag[] = [];
    for (const id of ids) {
        if (id === project.id) continue;
        const found = byKey(projects, id);
        if (found === undefined) continue;
        tags.push({ id, label: tagLabel(found) });
    }
    return tags.sort((left, right) => left.label.localeCompare(right.label));
}

/** Everything the search reads, from the project and from what it was joined with. */
function haystack(project: Project, item: Omit<BoardItem, 'haystack'>): string {
    const tags = [
        ...item.pillars,
        ...item.funding,
        ...item.datasets,
        ...item.collaborators,
        ...item.software
    ];
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
    const domainId = project.domainIds.at(0);
    const venue =
        project.venueId === undefined ? undefined : byKey(entities.venues, project.venueId);
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
        pillars: project.pillarIds.map((id) => tag(id, byKey(entities.pillars, id)?.title ?? id)),
        funding: project.fundingIds.map((id) => tag(id, id)),
        datasets: project.datasetIds.map((id) => tag(id, id)),
        collaborators: project.collaborators.map((id) => tag(id, names[id] ?? id)),
        software: softwareTags(project, snapshot),
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
 * One project joined, whatever tier it is on. A board reaches it through boardItems below; a tab
 * opened for a project of a tier no board shows reaches it here, since the join itself reads the
 * preset for its rollup and its type order alone and never for which tier the project is on.
 */
export function boardItemFor(
    snapshot: Snapshot,
    project: Project,
    preset: BoardPreset,
    sessionsOf: SessionsOf = () => SESSIONS_NONE
): BoardItem {
    return itemOf(project, snapshot, preset, personNames(snapshot), sessionsOf);
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
    const names = personNames(snapshot);
    const items = Object.values(snapshot.entities.projects)
        .filter((project) => preset.tiers.includes(project.tier))
        .map((project) => itemOf(project, snapshot, preset, names, sessionsOf));
    return items.sort((left, right) => compare(left, right, preset.typeOrder));
}

/** Whether a project's README is there to open, which is all a ghost project's title can open. */
export function hasReadme(project: Project): boolean {
    return project.docs.some((doc) => doc.name === 'README.md' && doc.present);
}

/**
 * The Markdown a project's tab can draw: the fixed documents the folder holds, then the narrative
 * document `presentDoc` names when the project has a present narrative.
 */
export function markdownDocNames(project: Project, presentDoc: string): string[] {
    const found = project.docs
        .filter((doc) => doc.present && doc.name.endsWith('.md'))
        .map((doc) => doc.name);
    return (project.present ?? []).length > 0 ? [...found, presentDoc] : found;
}

/** The known documents a project has not got, in the order the project lists them. */
export function absentDocs(project: Project): Project['docs'] {
    return project.docs.filter((doc) => !doc.present);
}

/** The day the project's newest document was last written, and '' when none says when. */
export function newestDocDate(project: Project): string {
    const newest = project.docs.reduce((top, doc) => Math.max(top, doc.mtime ?? 0), 0);
    return newest === 0 ? '' : new Date(newest).toISOString().slice(0, 10);
}
