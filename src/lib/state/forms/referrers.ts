// Layer 2, client state. What refers to a record: the projects whose manifest names a pillar, a
// domain, a venue, a dataset, a funding scheme or a resource; the people and funding schemes that
// name an organisation; the projects and joint work that name a person; and the `slurm.resource`
// setting that names a resource. A record's page lists them and the question that asks before a
// delete names them, so both read this one answer.
//
// Pure over the snapshot and the merged configuration it is given. Every join goes through the ids
// of the merged portfolio, each the record's hub and its key, so a reference names the record it
// resolved to in its own hub or in the one other hub that holds its key, and a record of one hub is
// never taken for the record of the same key in another. A collection whose entries nothing refers
// to (a statement, an event) has no referrers.

import { byKey, isMap } from '../../data/helpers/guards.ts';
import { bareId, joinedEntries } from '../../data/helpers/hub-names.ts';
import type { Project, Snapshot } from '../../data/model/index.ts';

/** The collection key of the joint work, whose entries each name one person. */
export const JOINT_WORK = 'joint-work';

/** The settings of behavior.yml that name a resource. */
const RESOURCE_SETTINGS: { key: string; field: string }[] = [{ key: 'slurm', field: 'resource' }];

/** The collections whose entries other records refer to, so their pages list the referrers. */
export const REFERRED = [
    'pillars',
    'domains',
    'venues',
    'data',
    'funding',
    'people',
    'organisations',
    'resources'
];

/** One thing that refers to a record, and what opens it. */
export type Referrer = {
    kind: 'project' | 'person' | 'funding' | 'entry' | 'setting';
    /** The project, person, funding scheme or entry id, or the dotted setting. */
    id: string;
    label: string;
    /** The collection of an `entry` referrer. */
    collection?: string;
};

/** The words a project is named by: its short name, else its title. */
function projectLabel(project: Project): string {
    const label =
        project.short === undefined || project.short === '' ? project.title : project.short;
    return label === '' ? bareId(project) : label;
}

/** The projects of the snapshot that satisfy a test, as referrers. */
function projectsWhere(snapshot: Snapshot, test: (project: Project) => boolean): Referrer[] {
    return Object.values(snapshot.entities.projects)
        .filter(test)
        .map((project) => ({ kind: 'project', id: project.id, label: projectLabel(project) }));
}

/** The setting of the configuration at `key.field`, as text, or the empty text. */
function settingOf(config: Record<string, unknown>, key: string, field: string): string {
    const section = config[key];
    const value = isMap(section) ? section[field] : undefined;
    return typeof value === 'string' ? value : '';
}

/** The referrers a person has: their projects, their joint work and the projects waiting. */
function personReferrers(snapshot: Snapshot, id: string): Referrer[] {
    const person = byKey(snapshot.entities.people, id);
    const joint = new Set(person?.jointWorkIds ?? []);
    const entries = joinedEntries(snapshot.entities.collections, JOINT_WORK)
        .filter((entry) => joint.has(entry.id))
        .map((entry): Referrer => ({
            kind: 'entry',
            id: entry.id,
            label: entry.title === '' ? bareId(entry) : entry.title,
            collection: JOINT_WORK
        }));
    const projects = projectsWhere(
        snapshot,
        (project) => project.collaborators.includes(id) || project.waitingOn.includes(id)
    );
    return [...projects, ...entries];
}

/** The referrers an organisation has: the people affiliated to it and the schemes it funds. */
function organisationReferrers(snapshot: Snapshot, id: string): Referrer[] {
    const people = Object.values(snapshot.entities.people)
        .filter((person) => person.affiliations.includes(id))
        .map((person): Referrer => ({
            kind: 'person',
            id: person.id,
            label: person.name === '' ? bareId(person) : person.name
        }));
    const schemes = Object.values(snapshot.entities.funding)
        .filter((scheme) => scheme.funder === id)
        .map((scheme): Referrer => ({
            kind: 'funding',
            id: scheme.id,
            label: scheme.title === '' ? bareId(scheme) : scheme.title
        }));
    return [...people, ...schemes];
}

/**
 * What refers to the entry `id` of the collection `collection`. `config` is the merged
 * configuration, whose settings can name a resource.
 */
export function referrersOf(
    snapshot: Snapshot,
    config: Record<string, unknown>,
    collection: string,
    id: string
): Referrer[] {
    if (collection === 'pillars') return projectsWhere(snapshot, (p) => p.pillarIds.includes(id));
    if (collection === 'domains') return projectsWhere(snapshot, (p) => p.domainIds.includes(id));
    if (collection === 'venues') return projectsWhere(snapshot, (p) => p.venueId === id);
    if (collection === 'data') return projectsWhere(snapshot, (p) => p.datasetIds.includes(id));
    if (collection === 'funding') return projectsWhere(snapshot, (p) => p.fundingIds.includes(id));
    if (collection === 'people') return personReferrers(snapshot, id);
    if (collection === 'organisations') return organisationReferrers(snapshot, id);
    if (collection !== 'resources') return [];
    const settings = RESOURCE_SETTINGS.filter(
        (one) => settingOf(config, one.key, one.field) === id
    ).map((one): Referrer => ({
        kind: 'setting',
        id: `${one.key}.${one.field}`,
        label: `${one.key}.${one.field}`
    }));
    return [...projectsWhere(snapshot, (p) => p.resourceIds.includes(id)), ...settings];
}
