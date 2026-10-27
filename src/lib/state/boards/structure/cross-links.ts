// Layer 2, client state. The projects that name one entry of a collection, grouped by the rows of
// `categories:` as a project board files them into its sections, a row carrying `archival` left out
// and the projects in no row last as "other": one strip for a funding scheme, an organisation, a
// resource and an entry's `related:` list, and one labelled strip per role for a person
// (`roleLinks`); the projects at one stage as one group (the Archival card's); and the live
// projects no funding scheme covers, which the Funding tab draws as one card. Pure joins of the
// snapshot, like the Pillars and Domains joins beside it, so they are checked without a browser. A
// project's category and chips, and a person's roles, are read under the words of their own hub
// when the caller gives them (`wordsOf`). A strip can be narrowed to the projects a predicate keeps
// (`keeps`), which a collection's Projects section in More gives (state/boards/collection/bar.ts).

import { anyWord, hasWord, type WordsOf } from '../../../data/shapes/vocab-keys.ts';
import { holdersOf, resolvedId, rootOf } from '../../../data/helpers/hub-names.ts';
import {
    categoriesBy,
    categoriesOf,
    categoryOf,
    type Category
} from '../../../data/shapes/boards/categories.ts';
import { rolesOf } from '../../../data/shapes/boards/roles.ts';
import type { Collection, Entry, Id, Person, Project } from '../../../data/model/index.ts';
import { t } from '../../shared/words/text.ts';
import { teamOf } from '../board/team.ts';
import { listWords } from '../collection/index.ts';

/** One member of a cross-link group. Its project stage remains visible inside the broader group. */
type CrossMember = { id: string; label: string; stage: string };

/**
 * The row of `categories:` a group of type `category` holds: its key, its label and its colour,
 * the empty text for a row that names none; the projects in no row have the empty key and the
 * words "other".
 */
type CrossCategory = Pick<Category, 'key' | 'label' | 'color'>;

/**
 * One cross-link group: the projects of one row of `categories:` (`category`), or the projects at
 * one stage (`stage`), which the Archival card draws a group of per stage that carries a `dead`
 * number.
 */
export type CrossGroup = {
    type: 'category' | 'stage';
    count: number;
    members: CrossMember[];
    warn: boolean;
    /** The row a group of type `category` holds. */
    category?: CrossCategory;
    /** The stage a group of type `stage` holds: its word, and the label and glyph drawn for it. */
    stage?: { word: string; label: string; glyph: string };
};

/** Whether a strip draws a project; a strip handed none draws every project it names. */
export type Keeps = (project: Project) => boolean;

/** The predicate that keeps every project. */
const KEEPS_ALL: Keeps = () => true;

/** The key one group is told apart by: its type, and its row's key or its stage's word. */
export function groupKey(group: CrossGroup): string {
    return `${group.type}:${group.stage?.word ?? group.category?.key ?? ''}`;
}

/**
 * The projects at one stage as one group, in the order the snapshot gives them, each named by its
 * short name or else its title; the stage's label and glyph are the caller's, read in the words it
 * draws them in.
 */
export function stageGroup(
    stage: { word: string; label: string; glyph: string },
    projects: Project[]
): CrossGroup {
    const members = projects.map((project) => {
        const short = project.short?.trim() ?? '';
        return {
            id: project.id,
            label: short === '' ? project.title : short,
            stage: stage.word
        };
    });
    return { type: 'stage', count: members.length, members, warn: false, stage };
}

/** The word a cross-link member is filed under: the project's own `stage:`, else the empty word. */
function stageOf(project: Project): string {
    return project.stage ?? '';
}

/**
 * The projects whose team (state/boards/board/team.ts: `lead:`, `collaborators:` and
 * `supervisors:`) holds a person whose `affiliations` hold the organisation `organisation`, each
 * project once however many of its people the organisation holds.
 */
function affiliatedTo(
    organisation: Id,
    projects: Project[],
    people: readonly Pick<Person, 'id' | 'affiliations'>[]
): Project[] {
    const members = new Set(
        people.filter((one) => one.affiliations.includes(organisation)).map((one) => one.id)
    );
    return projects.filter((project) => teamOf(project).some((id) => members.has(id)));
}

/**
 * The projects that name one entry, grouped by stage with a count each.
 *
 * Which projects those are is the collection's own question and has four answers: an entry of the
 * collection whose entry names the `funding` registry is a scheme, named by the manifests'
 * `funding:` tags; an entry of the `organisations` registry is an organisation, named by the
 * projects whose team holds a person affiliated to it (`affiliatedTo`, among `people`, the people
 * of the snapshot); an entry of the `resources` registry is a resource, named by the manifests'
 * `compute:`; and every other collection has no project-side inverse, so it is the entry's own
 * `related:` list of keys. A person's projects are drawn one strip per role (`roleLinks`).
 * `collection` is the collection of the entry's own hub that holds it, none when the snapshot holds
 * no such collection. An entry of a registry has the id of its record, which every reference of a
 * manifest is resolved to. A key of the entry's `related:` names the project its hub resolves it
 * to, the entry's own hub first, then the one other hub that holds it (`resolvedId`), and one no
 * project of the snapshot resolves is left out rather than drawn as a dead link. Each project is
 * grouped under its own hub's words when `wordsOf` gives them (`groupProjects`), and only the
 * projects `keeps` keeps are grouped.
 */
export function crossLinks(
    entry: Entry,
    collection: Pick<Collection, 'registry'> | undefined,
    projects: Project[],
    people: readonly Pick<Person, 'id' | 'affiliations'>[],
    config: Record<string, unknown>,
    wordsOf?: WordsOf,
    keeps: Keeps = KEEPS_ALL
): CrossGroup[] {
    let named: Project[];
    if (collection?.registry === 'funding') {
        named = projects.filter((project) => project.fundingIds.includes(entry.id));
    } else if (collection?.registry === 'organisations') {
        named = affiliatedTo(entry.id, projects, people);
    } else if (collection?.registry === 'resources') {
        named = projects.filter((project) => project.resourceIds.includes(entry.id));
    } else {
        const held = holdersOf(projects);
        named = listWords(entry.fields.related)
            .map((key) => resolvedId(held, rootOf(entry), key))
            .map((id) => projects.find((project) => project.id === id))
            .filter((project): project is Project => project !== undefined);
    }
    return groupProjects(named.filter(keeps), config, wordsOf);
}

/** The lists of a manifest that hold person ids, each the `field` of a row of `roles:`. */
const ROLE_FIELDS = ['lead', 'supervisors', 'collaborators'] as const;

/** One of the lists of a manifest that hold person ids. */
type RoleField = (typeof ROLE_FIELDS)[number];

/** The manifest list a role's `field` names, or null for a field that is none of them. */
function roleField(field: string | undefined): RoleField | null {
    return ROLE_FIELDS.find((one) => one === field) ?? null;
}

/** One labelled strip: the key it is told apart by, the words it is headed by, and its groups. */
export type StripRow = { key: string; label: string; groups: CrossGroup[] };

/**
 * The strips of a person's card: one per row of `roles:` whose `field` is `lead`, `supervisors`
 * or `collaborators`, in the order of `roles:`, each holding the projects whose list of that name
 * holds the person and `keeps` keeps, grouped as `groupProjects` groups them and headed by the
 * role's `label`. The roles are read under the words of the person's hub when `wordsOf` gives
 * them. A role whose field is none of the three draws no strip, since no other field of a manifest
 * holds person ids, and a role with no project in any group draws none; a person on two lists of
 * one project is in both strips. Null for an entry of a collection whose entry names no `people`
 * registry, whose card draws the one strip of `crossLinks`.
 */
export function roleLinks(
    entry: Entry,
    collection: Pick<Collection, 'registry'> | undefined,
    projects: Project[],
    config: Record<string, unknown>,
    wordsOf?: WordsOf,
    keeps: Keeps = KEEPS_ALL
): StripRow[] | null {
    if (collection?.registry !== 'people') return null;
    const rows: StripRow[] = [];
    for (const role of rolesOf(wordsOf?.(rootOf(entry)) ?? config)) {
        const field = roleField(role.field);
        if (field === null) continue;
        const named = projects.filter(
            (project) => project[field].includes(entry.id) && keeps(project)
        );
        const groups = groupProjects(named, config, wordsOf);
        if (groups.length > 0) rows.push({ key: role.key, label: role.label, groups });
    }
    return rows;
}

/**
 * The projects an entry's card draws at its foot, each once: those of a person's strips, one per
 * role (`roleLinks`), or those of the one strip of any other entry (`crossLinks`), the projects in
 * a row carrying `archival` left out as the strips leave them out.
 */
export function stripProjects(
    entry: Entry,
    collection: Pick<Collection, 'registry'> | undefined,
    projects: Project[],
    people: readonly Pick<Person, 'id' | 'affiliations'>[],
    config: Record<string, unknown>,
    wordsOf?: WordsOf
): Project[] {
    const rows = roleLinks(entry, collection, projects, config, wordsOf);
    const groups =
        rows === null
            ? crossLinks(entry, collection, projects, people, config, wordsOf)
            : rows.flatMap((row) => row.groups);
    return membersOf(groups, projects);
}

/**
 * The projects a strip of `projects` draws, each once: the No funding card's, whose strip is the
 * record card's grouping of the projects it is handed (`groupProjects`).
 */
export function drawnProjects(
    projects: Project[],
    config: Record<string, unknown>,
    wordsOf?: WordsOf
): Project[] {
    return membersOf(groupProjects(projects, config, wordsOf), projects);
}

/** The projects of `projects` that are members of `groups`, in the order of `projects`. */
function membersOf(groups: readonly CrossGroup[], projects: readonly Project[]): Project[] {
    const drawn = new Set(groups.flatMap((group) => group.members.map((member) => member.id)));
    return projects.filter((project) => drawn.has(project.id));
}

/** The projects of one group as they are drawn, and whether one of them is blocked. */
type HeldGroup = { row: CrossCategory; members: CrossMember[]; warn: boolean };

/**
 * The rows a strip's groups stand in the order of: the rows of the projects' hub when they are all
 * of one hub, and with projects of several hubs the rows of every hub's words (`wordsOf` with no
 * hub, their union), as a project board's sections stand.
 */
function rowOrder(
    projects: readonly Project[],
    config: Record<string, unknown>,
    wordsOf: WordsOf | undefined
): Category[] {
    const hubs = new Set(projects.map((project) => rootOf(project)));
    const first = projects.at(0);
    if (hubs.size > 1) return categoriesOf(wordsOf?.() ?? config);
    if (first === undefined) return [];
    return categoriesOf(wordsOf?.(rootOf(first)) ?? config);
}

/**
 * The groups of a strip: one per row of `categories:` that holds one of `projects`, then one last
 * group, "other", for the projects in no row, as a project board's sections are. A project's row
 * is the first whose `stages:` and `forms:` blocks it meets (data/shapes/boards/categories.ts,
 * `categoryOf`), read under its own hub's words when `wordsOf` gives them and under `config`
 * otherwise; a project in a row carrying `archival: true` is no real work and is left out. The
 * groups stand in the rows' order (`rowOrder`) and carry those rows' labels and colours; a row a
 * project's own hub holds and that order does not stands after the rows it names. The members of
 * a group are sorted by project id, and a group is flagged when one of its projects carries a chip
 * carrying `blocked` in `chips`.
 */
export function groupProjects(
    projects: Project[],
    config: Record<string, unknown>,
    wordsOf?: WordsOf
): CrossGroup[] {
    const filed = categoriesBy(config, wordsOf);
    const held = new Map<string, HeldGroup>();
    for (const project of [...projects].sort((a, b) => a.id.localeCompare(b.id))) {
        const own = filed(project);
        const row = categoryOf(project, own.categories, own.words);
        if (row?.archival === true) continue;
        const key = row?.key ?? '';
        const group = held.get(key) ?? {
            row: row ?? { key, label: t('board.section_other'), color: '' },
            members: [],
            warn: false
        };
        const short = project.short?.trim() ?? '';
        group.members.push({
            id: project.id,
            label: short === '' ? project.title : short,
            stage: stageOf(project)
        });
        group.warn ||= anyWord(own.words, 'chips', 'blocked', project.chips);
        held.set(key, group);
    }
    const order = rowOrder(projects, config, wordsOf);
    const listed = (key: string): boolean => order.some((row) => row.key === key);
    const otherGroup = held.get('');
    const groups = [
        ...order.flatMap((row) => held.get(row.key) ?? []),
        ...[...held].flatMap(([key, group]) => (key === '' || listed(key) ? [] : [group])),
        ...(otherGroup === undefined ? [] : [otherGroup])
    ];
    return groups.map((group) => {
        const row = order.find((one) => one.key === group.row.key) ?? group.row;
        return {
            type: 'category',
            count: group.members.length,
            members: group.members,
            warn: group.warn,
            category: { key: row.key, label: row.label, color: row.color }
        };
    });
}

/**
 * The projects whose stage carries `live` in `stages` (the work in flight) no funding scheme of
 * the file covers, which is the Funding tab's one synthetic card. A project naming a scheme the
 * file does not hold is not covered by it, so the schemes are the file's own keys rather than
 * whatever a manifest happens to name. A project's stage is read under its own hub's words when
 * `wordsOf` gives them.
 */
function noFunding(
    projects: Project[],
    schemes: string[],
    config: Record<string, unknown>,
    wordsOf?: WordsOf
): Project[] {
    return projects.filter(
        (project) =>
            hasWord(wordsOf?.(rootOf(project)) ?? config, 'stages', 'live', project.stage) &&
            !project.fundingIds.some((id) => schemes.includes(id))
    );
}

/** The live projects no entry of the funding file covers, the file's entries handed in whole. */
export function unfundedBy(
    projects: Project[],
    entries: readonly Entry[],
    config: Record<string, unknown>,
    wordsOf?: WordsOf
): Project[] {
    return noFunding(
        projects,
        entries.map((entry) => entry.id),
        config,
        wordsOf
    );
}

/** One cross-link group's members by their own project stage, in the order the members are in. */
export function membersByStage(
    group: CrossGroup
): { stage: string; members: CrossGroup['members'] }[] {
    const held = new Map<string, CrossGroup['members']>();
    for (const member of group.members) {
        const found = held.get(member.stage);
        if (found === undefined) held.set(member.stage, [member]);
        else found.push(member);
    }
    return [...held].map(([stage, members]) => ({ stage, members }));
}
