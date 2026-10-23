// Layer 2, client state. Board item construction and sorting live here because project joins change
// independently of filters, facets and statistics. A project's people are read as its team, its
// lead then its collaborators (team.ts beside this file): the card's team tags and its team line
// leave out the person the workspace setting `self` names, and the search reads the whole team.

import { byKey } from '../../../data/helpers/guards.ts';
import { keyOf } from '../../../data/helpers/hub-names.ts';
import { domainLabel, domainTone, stageTone } from '../../shared/words/tones.ts';
import type { Id, Project, Snapshot } from '../../../data/model/index.ts';
import { personNames } from '../person.ts';
import { selfIds, shownTeam, teamOf } from './team.ts';
import {
    SESSIONS_NONE,
    bucketOf,
    venueText,
    type BoardItem,
    type BoardPreset,
    type BoardTag,
    type RelatedTag,
    type SessionsOf,
    teamLine
} from './presets.ts';

/**
 * The name a cross-link tag carries: the short handle when the manifest has one, else the title.
 */
function tagLabel(project: Pick<Project, 'title' | 'short'>): string {
    const short = project.short?.trim() ?? '';
    return short === '' ? project.title : short;
}

/**
 * The other end of one project's link with the software tier, as tags sorted by their label.
 *
 * Every project is read backwards, over the snapshot's related pairs, for the software whose
 * `related:` names it, so a paper carries no key of its own for the software that implements it;
 * a software project is read forwards as well, through its own `related:`, since that is where the
 * link is written. A project never links to itself, and one named from both sides is one tag. The
 * software tier is any tier of `tiers` carrying `software`.
 */
function softwareTags(project: Project, snapshot: Snapshot, software: string[]): BoardTag[] {
    const projects = snapshot.entities.projects;
    const isSoftware = (one: Project | undefined): boolean =>
        one?.tier !== undefined && software.includes(one.tier);
    const backwards = snapshot.relations.projectRelated
        .filter((pair) => pair[1] === project.id)
        .map((pair) => pair[0])
        .filter((id) => isSoftware(byKey(projects, id)));
    const forwards = isSoftware(project) ? project.relatedIds : [];
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

/** The projects a project's `related:` names, by their short name or title. */
function relatedTags(project: Project, snapshot: Snapshot): RelatedTag[] {
    return project.relatedIds.map((id: Id): RelatedTag => {
        const held = byKey(snapshot.entities.projects, id);
        return {
            id,
            label: held === undefined ? keyOf(id) : tagLabel(held),
            held: held !== undefined
        };
    });
}

/**
 * Everything the search reads, from the project and from what it was joined with. `team` is the
 * whole team, the user included, since a search finds a project by any of its people.
 */
function haystack(project: Project, item: Omit<BoardItem, 'haystack'>, team: BoardTag[]): string {
    const tags = [...item.pillars, ...item.funding, ...item.datasets, ...team, ...item.software];
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
        ...(project.tags ?? []),
        ...tags.map((tag) => tag.id),
        ...tags.map((tag) => tag.label)
    ];
    return parts.join(' ').toLowerCase();
}

/** The names of the people a board draws, and the ids of the person who is the user. */
type People = { names: Record<Id, string>; self: Set<Id> };

/** One project with its joins, ready for a card, a row, a facet and a filter. */
function itemOf(
    project: Project,
    snapshot: Snapshot,
    preset: BoardPreset,
    people: People,
    sessionsOf: SessionsOf
): BoardItem {
    const entities = snapshot.entities;
    const domainId = project.domainIds.at(0);
    const venue =
        project.venueId === undefined ? undefined : byKey(entities.venues, project.venueId);
    const tag = (id: Id, label: string): BoardTag => ({ id, label });
    // A tag named by its id shows the record's key, never its internal id.
    const own = (id: Id): string => keyOf(id);
    const person = (id: Id): BoardTag => tag(id, people.names[id] ?? own(id));
    const team = shownTeam(project, people.self).map(person);

    const item: Omit<BoardItem, 'haystack'> = {
        id: project.id,
        project,
        tone: stageTone(project.stage ?? ''),
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
        pillars: project.pillarIds.map((id) =>
            tag(id, byKey(entities.pillars, id)?.title ?? own(id))
        ),
        funding: project.fundingIds.map((id) => tag(id, own(id))),
        datasets: project.datasetIds.map((id) => tag(id, own(id))),
        team,
        software: softwareTags(project, snapshot, preset.softwareTiers),
        teamLine: teamLine(team),
        bucket: bucketOf(project, preset.rollup),
        code: project.codeAvailability?.status ?? '',
        compute: project.resourceIds.flatMap((id) => {
            const one = byKey(entities.resources, id);
            return one === undefined
                ? []
                : [{ id, label: one.name, kind: one.kind, order: one.order }];
        }),
        reproduced: project.reproduced !== undefined,
        year: project.year === undefined ? '' : String(project.year),
        sessions: sessionsOf(project),
        chips: project.form === undefined ? project.chips : [project.form, ...project.chips],
        related: relatedTags(project, snapshot)
    };
    return { ...item, haystack: haystack(project, item, teamOf(project).map(person)) };
}

/** The names and the user of a snapshot, read once for every item of a board. */
function peopleOf(snapshot: Snapshot): People {
    return { names: personNames(snapshot), self: selfIds(snapshot) };
}

/** Pinned first, then the config's stage order, then the title. */
function compare(left: BoardItem, right: BoardItem, order: string[]): number {
    const pinned = Number(right.project.pin === true) - Number(left.project.pin === true);
    if (pinned !== 0) return pinned;
    const rank = (item: BoardItem): number => {
        const at = item.project.stage === undefined ? -1 : order.indexOf(item.project.stage);
        return at < 0 ? order.length : at;
    };
    const byStage = rank(left) - rank(right);
    if (byStage !== 0) return byStage;
    return left.project.title.localeCompare(right.project.title);
}

/**
 * One project joined, whatever tier it is on. A board reaches it through boardItems below; a tab
 * opened for a project of a tier no board shows reaches it here, since the join itself reads the
 * preset for its rollup and its stage order alone and never for which tier the project is on.
 */
export function boardItemFor(
    snapshot: Snapshot,
    project: Project,
    preset: BoardPreset,
    sessionsOf: SessionsOf = () => SESSIONS_NONE
): BoardItem {
    return itemOf(project, snapshot, preset, peopleOf(snapshot), sessionsOf);
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
    const people = peopleOf(snapshot);
    const items = Object.values(snapshot.entities.projects)
        .filter((project) => project.tier !== undefined && preset.tiers.includes(project.tier))
        .map((project) => itemOf(project, snapshot, preset, people, sessionsOf));
    return items.sort((left, right) => compare(left, right, preset.stageOrder));
}

/** The Markdown a project's tab can draw: the fixed documents the folder holds. */
export function markdownDocNames(project: Project): string[] {
    return project.docs
        .filter((doc) => doc.present && doc.name.endsWith('.md'))
        .map((doc) => doc.name);
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
