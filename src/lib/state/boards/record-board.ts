// Layer 2, client state. A record's projects and the board a record's page opens over them. A
// record is a project, a person or an entry of a collection; its projects are one join, read here
// once, which the row of count buttons under its card counts (RecordCounts.svelte of
// views/shared/card/record/) and the record's board holds (views/boards/projects/Projects.svelte),
// so a count and the cards it opens are read from the same projects: a project's related projects
// (its `related:` both ways, `relatedTags`), a person's team projects (`personJoin`), every project
// whose `pillarIds`, `domainIds` or `venueId` names a pillar, a domain or a venue, a dataset's
// users as its card reads them (`datasetUsers`), and the projects naming a funding scheme, an
// organisation, a resource or any other entry (`namedProjects`). Every one keeps a project in a row
// carrying `archival`, so a dead end is counted under its own button and is on the board, and each
// project is counted once, by its id, however many times the join names it.
//
// A board's tab state names the record by its kind and its full id, an entry with its collection,
// the kind of board (the record's projects, or for a person the projects waiting on them) and the
// tab's title; its `id` carries all of them but the title, so a person's two boards, two records
// of one key in two hubs and two records of one key of two kinds are separate tabs, and a second
// press on one record's buttons is the same tab. The ids are computed from the live portfolio each
// time the board is drawn: a project that stops naming the record leaves it, and a record that is
// gone, an entry whose key changed since the tab was saved among them, gives no ids.
//
// A press sets the tab's whole board state (`pressedState`): the slices it picks, no search, no
// other facet or toggle, no folded section and Mine only off, so the board shows exactly the
// projects the button counts; the record the tab names, the mode, the label mode and the columns
// the reader chose are kept.
// Pure over the snapshot it is given, so it is read without a browser.

import { z } from 'zod';
import type { Id, Project, Snapshot } from '../../data/model/index.ts';
import { byKey, isMap } from '../../data/helpers/guards.ts';
import { addressOfId, hubId } from '../../data/helpers/hub-names.ts';
import { readAs } from '../../data/shapes/shapes.ts';
import type { WordsOf } from '../../data/shapes/vocab-keys.ts';
import { categoriesBy, categoryOf } from '../../data/shapes/boards/categories.ts';
import { datasetUsers } from '../sources/registries/datasets.ts';
import { sliceValue, sliceWord } from './board/facets.ts';
import { relatedTags } from './board/items.ts';
import { entryById } from './collection/index.ts';
import { personJoin } from './person.ts';
import { groupProjects, namedProjects } from './structure/cross-links.ts';

/** The record a row counts and a board is opened for: a project, a person or an entry. */
export type RecordRef =
    | { kind: 'project'; id: Id }
    | { kind: 'person'; id: Id }
    | { kind: 'entry'; collection: string; id: Id };

/** The kinds of board a record has: its projects, and a person's projects waiting on them. */
const BOARDS = ['projects', 'waiting'] as const;

/** One kind of board a record has. */
export type RecordBoard = (typeof BOARDS)[number];

/** The kinds of record, as `RecordRef` names them. */
const KINDS = ['project', 'person', 'entry'] as const;

/** The state of a tab of a record's board, which names the tab by its `id`. */
export type RecordTab = {
    id: string;
    board: RecordBoard;
    kind: RecordRef['kind'];
    /** The record's full id, its hub's name and its key. */
    record: Id;
    /** The collection key of an entry, the empty text for a project or a person. */
    collection: string;
    /** The tab's title. */
    label: string;
};

/** The fields of a saved tab state of a record's board. */
const recordTabShape = z.object({
    board: z.enum(BOARDS),
    kind: z.enum(KINDS),
    record: z.string().min(1),
    collection: z.string(),
    label: z.string()
});

/** The tab state of the board `board` of a record, titled `label`. */
export function recordTab(board: RecordBoard, record: RecordRef, label: string): RecordTab {
    const collection = record.kind === 'entry' ? record.collection : '';
    return {
        id: JSON.stringify([board, record.kind, collection, record.id]),
        board,
        kind: record.kind,
        record: record.id,
        collection,
        label
    };
}

/**
 * The tab state a tab of a record's board holds, and null for a tab opened with none or with one
 * that does not parse (from the palette, or a saved layout), which takes no project.
 */
export function recordTabOf(state: unknown): RecordTab | null {
    const held = readAs(recordTabShape, state);
    return held === null ? null : recordTab(held.board, refOf(held), held.label);
}

/** The record a tab state names. */
function refOf(tab: Pick<RecordTab, 'kind' | 'record' | 'collection'>): RecordRef {
    if (tab.kind === 'entry') return { kind: 'entry', collection: tab.collection, id: tab.record };
    return { kind: tab.kind, id: tab.record };
}

/**
 * The projects that name an entry of a collection, by the registry the collection's entry names
 * in the entry's own hub, and null when the snapshot holds no such entry.
 */
function entryProjects(
    snapshot: Snapshot,
    record: Extract<RecordRef, { kind: 'entry' }>,
    projects: Project[]
): Project[] | null {
    const id = record.id;
    const held = byKey(
        snapshot.entities.collections,
        hubId(addressOfId(id).hub, record.collection)
    );
    const entry = entryById(held, id);
    if (held === undefined || entry === null) return null;
    if (held.registry === 'pillars') return projects.filter((one) => one.pillarIds.includes(id));
    if (held.registry === 'domains') return projects.filter((one) => one.domainIds.includes(id));
    if (held.registry === 'venues') return projects.filter((one) => one.venueId === id);
    if (held.registry === 'datasets') {
        return datasetUsers(byKey(snapshot.entities.datasets, id)?.projectIds ?? [], projects);
    }
    return namedProjects(entry, held, projects, Object.values(snapshot.entities.people));
}

/**
 * `projects` with each project once, by its id, where its first place is: a list of keys can
 * name one project twice, by its key and by its hub-qualified id, and the row counts what the
 * board, which holds an id once, shows.
 */
function eachOnce(projects: Project[]): Project[] {
    const seen = new Set<Id>();
    return projects.filter((one) => {
        if (seen.has(one.id)) return false;
        seen.add(one.id);
        return true;
    });
}

/** A record's projects, each once, and null for a record the snapshot does not hold. */
function recordProjects(snapshot: Snapshot, record: RecordRef): Project[] | null {
    const joined = joinedProjects(snapshot, record);
    return joined === null ? null : eachOnce(joined);
}

/** The projects a record's join gives, in its order, and null for a record that is gone. */
function joinedProjects(snapshot: Snapshot, record: RecordRef): Project[] | null {
    const projects = snapshot.entities.projects;
    if (record.kind === 'entry') return entryProjects(snapshot, record, Object.values(projects));
    if (record.kind === 'person') {
        const join = personJoin(snapshot, record.id);
        return join.person === null ? null : join.projects;
    }
    const project = byKey(projects, record.id);
    if (project === undefined) return null;
    return relatedTags(project, snapshot).flatMap((tag) => {
        const held = byKey(projects, tag.id);
        return held === undefined ? [] : [held];
    });
}

/**
 * The ids of the projects a tab of a record's board holds: the record's projects, or for a person's
 * waiting board the projects whose `waiting-on:` names them; null for a record that is gone, and
 * for a waiting board of a record that is no person.
 */
export function recordIds(snapshot: Snapshot, tab: RecordTab): Id[] | null {
    const record = refOf(tab);
    if (tab.board === 'waiting') {
        if (record.kind !== 'person') return null;
        const join = personJoin(snapshot, record.id);
        return join.person === null ? null : join.waitingOn.map((one) => one.id);
    }
    return recordProjects(snapshot, record)?.map((one) => one.id) ?? null;
}

/**
 * One count button of a record's row: the row of `categories:` it counts (its key, its label and
 * its colour, the empty key and the words "other" for the projects in no row), how many of the
 * record's projects in that row carry a slice, and the slices those projects are in, which a press
 * picks on the board's second line.
 */
export type RecordButton = {
    key: string;
    label: string;
    color: string;
    count: number;
    slices: string[];
};

/**
 * The count buttons of `projects`: one per row of `categories:` that holds one of them, in the
 * rows' order and "other" last, as `groupProjects` groups them with a row carrying `archival` kept.
 * A button counts only the projects that carry a slice, `<row key>/<stage or form>` as the board
 * files them (`sliceWord`, `sliceValue`), since a pick of slices shows no project without one; a
 * project with no stage is counted in the total alone, and a row none of whose projects carries a
 * slice gets no button.
 */
function recordButtons(
    projects: Project[],
    config: Record<string, unknown>,
    wordsOf?: WordsOf
): RecordButton[] {
    const filed = categoriesBy(config, wordsOf);
    const byId = new Map(projects.map((one) => [one.id, one]));
    return groupProjects(projects, config, wordsOf, true).flatMap((group) => {
        const slices = new Set<string>();
        let count = 0;
        for (const member of group.members) {
            const project = byId.get(member.id);
            if (project === undefined) continue;
            const own = filed(project);
            const row = categoryOf(project, own.categories, own.words);
            const slice = sliceValue(row?.key ?? '', sliceWord(row, project));
            if (slice === '') continue;
            count += 1;
            slices.add(slice);
        }
        const category = group.category;
        if (count === 0 || category === undefined) return [];
        return [{ ...category, count, slices: [...slices] }];
    });
}

/**
 * What the row under a record's card draws: the record and the name its boards are titled by, its
 * count buttons, how many projects it has, and for a person how many projects wait on them.
 */
export type RecordRow = {
    record: RecordRef;
    name: string;
    buttons: RecordButton[];
    total: number;
    waiting: number;
};

/** The row of a record, read from the snapshot as its board reads it; empty with no snapshot. */
export function recordRow(
    snapshot: Snapshot | null,
    record: RecordRef,
    name: string,
    config: Record<string, unknown>,
    wordsOf?: WordsOf
): RecordRow {
    const projects = snapshot === null ? [] : (recordProjects(snapshot, record) ?? []);
    const waiting =
        snapshot === null || record.kind !== 'person'
            ? 0
            : personJoin(snapshot, record.id).waitingOn.length;
    const buttons = recordButtons(projects, config, wordsOf);
    return { record, name, buttons, total: projects.length, waiting };
}

/**
 * The state a press on a count button gives the tab, over the state it held (`saved`): the slices
 * `slices` picked, none for the total and a waiting board, and every other filter, the search, the
 * folds and Mine only off. The keys that name the record and the tab are kept, and so are the
 * mode, the label mode and the columns the reader chose.
 */
export function pressedState(saved: unknown, slices: readonly string[]): Record<string, unknown> {
    return {
        ...(isMap(saved) ? saved : {}),
        search: '',
        filters: slices.length === 0 ? {} : { slice: [...slices] },
        stale: false,
        dated: false,
        waiting: false,
        mine: false,
        folded: [],
        more: []
    };
}
