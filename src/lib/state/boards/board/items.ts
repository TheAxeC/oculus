// Layer 2, client state. Board item construction and sorting live here because project joins change
// independently of filters, facets and statistics. A project's people are read as its team, its
// lead, its collaborators, then its supervisors (team.ts beside this file): the card's team tags
// and the list's With column leave out the person the workspace setting `self` names, and the
// search reads the whole team. Which projects a board holds, a card's category and the user's role
// on a project are read by data/shapes/boards/, the rules the audit reads too, each under the words
// of the project's own hub; the cards sort by the stage order of every hub's words.

import { byKey } from '../../../data/helpers/guards.ts';
import { keyOf, rootOf } from '../../../data/helpers/hub-names.ts';
import { domainLabel, domainTone, stageTone } from '../../shared/words/tones.ts';
import type { Id, Project, Snapshot } from '../../../data/model/index.ts';
import { categoryOf } from '../../../data/shapes/boards/categories.ts';
import { isLead, isMine } from '../../../data/shapes/boards/roles.ts';
import {
    boardTakes,
    projectPeople,
    projectRole,
    type TakeContext
} from '../../../data/shapes/boards/takes.ts';
import { personNames } from '../person.ts';
import { sliceValue, sliceWord } from './facets.ts';
import { selfIds, shownTeam, teamOf } from './team.ts';
import {
    SESSIONS_NONE,
    stageRank,
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
 * The projects a project is related to, by their short name or title: those its own `related:`
 * names, in the manifest's order, then those whose `related:` names it, read over the snapshot's
 * related pairs, each project once and never the project itself. A key its `related:` names that
 * no project holds is kept as a tag that names no project (`held` false).
 */
function relatedTags(project: Project, snapshot: Snapshot): RelatedTag[] {
    const projects = snapshot.entities.projects;
    const backwards = snapshot.relations.projectRelated
        .filter((pair) => pair[1] === project.id)
        .map((pair) => pair[0]);
    const ids = [...new Set([...project.relatedIds, ...backwards])].filter(
        (id) => id !== project.id
    );
    return ids.map((id: Id): RelatedTag => {
        const held = byKey(projects, id);
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
    const tags = [
        ...item.pillars,
        ...item.funding,
        ...item.datasets,
        ...team,
        ...(item.related ?? [])
    ];
    const parts = [
        project.title,
        project.short ?? '',
        project.eli5 ?? '',
        project.latest ?? '',
        project.next ?? '',
        project.outcome ?? '',
        item.venue?.text ?? '',
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
    const isSelf = (id: Id): boolean => people.self.has(id);
    const named = people.self.size > 0;
    const hub = rootOf(project);
    const words = preset.words(hub);
    const category = categoryOf(project, words.categories, words.config);
    // A pillar's colour is the hex its entry writes; anything else gives the tag none.
    const pillar = (id: Id): BoardTag => {
        const held = byKey(entities.pillars, id);
        const color = held?.color ?? '';
        const made = tag(id, held?.title ?? own(id));
        return /^#[0-9a-f]{6}$/i.test(color) ? { ...made, color } : made;
    };

    const item: Omit<BoardItem, 'haystack'> = {
        id: project.id,
        project,
        tone: stageTone(project.stage ?? '', hub),
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
        pillars: project.pillarIds.map(pillar),
        funding: project.fundingIds.map((id) => tag(id, own(id))),
        datasets: project.datasetIds.map((id) => tag(id, own(id))),
        team,
        teamLine: teamLine(team),
        category: category?.key ?? '',
        slice: sliceValue(category?.key ?? '', sliceWord(category, project)),
        role: named ? (projectRole(project, words.roles, people.self)?.key ?? '') : '',
        lead: isLead(projectPeople(project), words.roles, isSelf),
        mine: !named || isMine(projectPeople(project), words.roles, isSelf),
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
    const byStage = stageRank(left.project.stage, order) - stageRank(right.project.stage, order);
    if (byStage !== 0) return byStage;
    return left.project.title.localeCompare(right.project.title);
}

/**
 * One project joined, whichever boards take it. A board reaches it through boardItems below; a tab
 * opened for a project no board takes reaches it here, since the join reads the preset for its
 * categories, its roles and its stage order alone and never for which projects the board takes.
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
 * What a board's rule is read with, from its preset and the user of a snapshot: the merged config
 * and the union's roles, and each project held to the words of its own hub.
 */
export function takeContextOf(preset: BoardPreset, self: ReadonlySet<Id>): TakeContext {
    return { config: preset.config, roles: preset.roles, self, wordsOf: preset.words };
}

/**
 * The projects of a board, every project whose keys meet the board's rule, joined and sorted.
 * Nothing is filtered: a facet counts what this returns, and a filter is applied to it afterwards.
 */
export function boardItems(
    snapshot: Snapshot,
    preset: BoardPreset,
    sessionsOf: SessionsOf = () => SESSIONS_NONE
): BoardItem[] {
    const people = peopleOf(snapshot);
    const context = takeContextOf(preset, people.self);
    const items = Object.values(snapshot.entities.projects)
        .filter((project) => boardTakes(preset.rule, project, context))
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
