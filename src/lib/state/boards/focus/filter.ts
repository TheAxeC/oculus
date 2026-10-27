// Layer 2, client state, pure. The Focus filter: which records the Focus board keeps under the
// choice its Filter list holds, and how many rows each section of the board hides by it. The board
// computes it once and hands each section the records it keeps, so every section counts over the
// same records.
//
// The choice is kept in the tab's instance state beside the folds, under the key `filter`: `mine`,
// whether Mine only is on, and the unticked `roles`, `tiers` and `hubs`, so a role, a tier or a hub
// added later starts ticked. Mine only keeps a record `isMine` keeps; an unticked role hides the
// records whose role (`roleOf`) it is, a role with no field never being one of the list; both read
// a record's role fields only while a person is marked as the user, and a collection entry's only
// where its file's `schema:` declares one. An unticked tier hides the projects of that tier and
// nothing else. An unticked hub hides every record whose `root` names it, and only while the
// workspace has more than one hub (`hubList` of state/shared/page/hubs.ts). The career banner and
// the feed lines (a calendar, a lead, a refresh nudge) name no role and carry no hub of their own,
// so the filter never hides them. Mine only is offered, and applied, only while it would hide a
// row of the whole page, read before the rest of the choice, as a project board reads it.

import type {
    Collection,
    Entry,
    Funding,
    Id,
    Project,
    Snapshot
} from '../../../data/model/index.ts';
import { byKey, text as str } from '../../../data/helpers/guards.ts';
import {
    bareId,
    flaggedCollections,
    hubId,
    registryCollection,
    rootOf
} from '../../../data/helpers/hub-names.ts';
import {
    entryPeople,
    isMine,
    isSelfByKey,
    roleFields,
    roleOf,
    rolesOf,
    type PeopleOf
} from '../../../data/shapes/boards/roles.ts';
import { projectPeople } from '../../../data/shapes/boards/takes.ts';
import { fieldItemsShape, mapShape, readAs } from '../../../data/shapes/shapes.ts';
import type { WordsOf } from '../../../data/shapes/vocab-keys.ts';
import {
    deadlineMet,
    focusWords,
    laneItems,
    lanes,
    tierWords,
    unplaced,
    waiting,
    type TierWord,
    type Waiting
} from '../focus.ts';
import { personNames } from '../person.ts';
import { ticker, type Ticker, type TickerItem, type TickerLists } from '../ticker.ts';
import { collectionLanes, stageItemCount, type Band } from './focus-lanes.ts';

/** The choice of the Filter list: Mine only, and the roles, tiers and hubs left unticked. */
export type FocusFilter = { mine: boolean; roles: string[]; tiers: string[]; hubs: string[] };

/** The key of a Focus tab's instance state the choice is kept under. */
const KEY = 'filter';

/** The choice as saved; a missing or wrong value reads as Mine only on and everything ticked. */
const filterShape = mapShape.transform((held): FocusFilter => ({
    mine: held.mine !== false,
    roles: fieldItemsShape.parse(held.roles),
    tiers: fieldItemsShape.parse(held.tiers),
    hubs: fieldItemsShape.parse(held.hubs)
}));

/** The choice a Focus tab's instance state holds, and the starting one where it holds none. */
export function focusFilter(state: unknown): FocusFilter {
    const held = readAs(mapShape, state)?.[KEY];
    return readAs(filterShape, held) ?? { mine: true, roles: [], tiers: [], hubs: [] };
}

/** The tab's state with the choice set to `filter`, and every other key of it kept. */
export function withFocusFilter(state: unknown, filter: FocusFilter): Record<string, unknown> {
    return { ...(readAs(mapShape, state) ?? {}), [KEY]: filter };
}

/**
 * The rows of the Role and the Tier checklists under a hub's words: the roles of `roles:` that
 * have a field, a role with none standing under Mine only, and the words of `tiers:`.
 */
export function filterLists(words: Record<string, unknown>): {
    roles: { key: string; label: string }[];
    tiers: TierWord[];
} {
    const roles = rolesOf(words)
        .filter((role) => role.field !== undefined)
        .map((role) => ({ key: role.key, label: role.label }));
    return { roles, tiers: tierWords(words) };
}

/**
 * What the filter is read against: the ids of the people marked `self: true`, the user (none when
 * no one is marked), the hubs the Hub list names (none while the workspace has one), and the words
 * of each hub, which give the roles a record of that hub is read under.
 */
export type FilterScope = {
    self: ReadonlySet<Id>;
    hubs: readonly string[];
    wordsOf: WordsOf;
    /**
     * The hubs' `collections:` lists and oculus's own, which the ticker reads the registries by.
     */
    lists: TickerLists;
};

/** The choice as the rule applies it: what is hidden, each list a set. */
type Rule = {
    mine: boolean;
    roles: ReadonlySet<string>;
    tiers: ReadonlySet<string>;
    hubs: ReadonlySet<string>;
};

/**
 * The rule a choice gives under a scope, Mine only taken as `mine`: no role is read while no `self`
 * is named, and no hub is hidden while the Hub list is not drawn.
 */
function ruleOf(filter: FocusFilter, scope: FilterScope, mine: boolean): Rule {
    const named = scope.self.size > 0;
    return {
        mine: named && mine,
        roles: new Set(named ? filter.roles : []),
        tiers: new Set(filter.tiers),
        hubs: new Set(filter.hubs.filter((hub) => scope.hubs.includes(hub)))
    };
}

/** Whether a rule hides anything at all. */
function hidesAny(rule: Rule): boolean {
    return rule.mine || rule.roles.size + rule.tiers.size + rule.hubs.size > 0;
}

/**
 * Whether Mine only and the Role list keep a record, read under the roles of its hub: Mine only
 * keeps what `isMine` keeps, and an unticked role hides the record whose role it is.
 */
function rolesKeep(
    people: PeopleOf,
    root: string,
    rule: Rule,
    scope: FilterScope,
    isSelf: (person: string) => boolean
): boolean {
    const roles = rolesOf(scope.wordsOf(root));
    if (rule.mine && !isMine(people, roles, isSelf)) return false;
    const role = roleOf(people, roles, isSelf);
    return role?.field === undefined || !rule.roles.has(role.key);
}

/** Whether the filter keeps a project: by its hub, its tier and the user's role on it. */
function keepsProject(project: Project, rule: Rule, scope: FilterScope): boolean {
    const root = rootOf(project);
    if (rule.hubs.has(root)) return false;
    if (project.tier !== undefined && rule.tiers.has(project.tier)) return false;
    if (scope.self.size === 0) return true;
    return rolesKeep(projectPeople(project), root, rule, scope, (id) => scope.self.has(id));
}

/**
 * Whether the filter keeps an entry of a collection: by its hub, and by the user's role on it where
 * the collection's `schema:` declares a field of a role of its hub.
 */
function keepsEntry(entry: Entry, collection: Collection, rule: Rule, scope: FilterScope): boolean {
    const root = rootOf(entry);
    if (rule.hubs.has(root)) return false;
    if (scope.self.size === 0) return true;
    const fields = roleFields(rolesOf(scope.wordsOf(root)));
    const declared = (collection.schema ?? []).some((one) => fields.includes(one.field));
    if (!declared) return true;
    return rolesKeep(entryPeople(entry.fields), root, rule, scope, isSelfByKey(scope.self));
}

/**
 * Whether the filter keeps a funding scheme: as the entry of its hub's collection whose entry names
 * the `funding` registry that holds it, and by its hub alone where that collection holds no such
 * entry.
 */
function keepsScheme(
    scheme: Funding,
    collections: Record<Id, Collection>,
    rule: Rule,
    scope: FilterScope
): boolean {
    const root = rootOf(scheme);
    if (rule.hubs.has(root)) return false;
    const file = registryCollection(collections, 'funding', root);
    const entry = file?.entries.find((one) => bareId(one) === bareId(scheme));
    return file === undefined || entry === undefined || keepsEntry(entry, file, rule, scope);
}

/** The records of an id map a test keeps, in the map's order. */
function keptOf<T>(records: Record<Id, T>, keeps: (record: T) => boolean): Record<Id, T> {
    return Object.fromEntries(Object.entries(records).filter(([, record]) => keeps(record)));
}

/**
 * The snapshot with only the records a rule keeps: its projects, the entries of its collections
 * and its funding schemes. The registries, the feeds and the career are kept whole, so a kept
 * project still reads its venue and a feed line is never hidden.
 */
function keptSnapshot(snapshot: Snapshot, rule: Rule, scope: FilterScope): Snapshot {
    if (!hidesAny(rule)) return snapshot;
    const held = snapshot.entities;
    const collections = Object.fromEntries(
        Object.entries(held.collections).map(([id, one]) => [
            id,
            { ...one, entries: one.entries.filter((entry) => keepsEntry(entry, one, rule, scope)) }
        ])
    );
    return {
        ...snapshot,
        entities: {
            ...held,
            projects: keptOf(held.projects, (project) => keepsProject(project, rule, scope)),
            collections,
            funding: keptOf(held.funding, (scheme) =>
                keepsScheme(scheme, held.collections, rule, scope)
            )
        }
    };
}

/** What the board's sections are drawn from: the ticker, the awaiting box, the band, the lanes. */
type FocusSections = {
    week: Ticker;
    strip: Waiting;
    band: Band;
    /** The projects on each lane of the board, by lane key. */
    lanes: Record<string, Project[]>;
};

/** How many rows each section hides: the command center, the tasks, the awaiting box, each lane. */
type FocusHidden = {
    command: number;
    tasks: number;
    awaiting: number;
    lanes: Record<string, number>;
    band: { funding: number; jobs: number; teaching: number };
};

/** What the board draws: the sections over the kept records, what each hides, and Mine only. */
export type FocusPage = {
    /** The portfolio with only the records the filter keeps, its registries and feeds whole. */
    snapshot: Snapshot;
    sections: FocusSections;
    hidden: FocusHidden;
    /** Whether the filter hides any row of the page, which draws the Filter action pressed. */
    hides: boolean;
    /** Whether Mine only would hide a row of the whole page, else its row is drawn disabled. */
    mineHides: boolean;
};

/** The sections of a snapshot, its projects named in the awaiting box from `known`. */
function sectionsOf(
    snapshot: Snapshot,
    config: Record<string, unknown>,
    now: number,
    scope: FilterScope,
    known: Record<Id, Project>
): FocusSections {
    const wordsOf = scope.wordsOf;
    const board = lanes(wordsOf());
    return {
        week: ticker(snapshot, config, now, wordsOf, scope.lists),
        strip: waiting(snapshot, config, personNames(snapshot), wordsOf, known),
        band: collectionLanes(snapshot, config, wordsOf),
        lanes: laneItems(Object.values(snapshot.entities.projects), board, config, wordsOf)
    };
}

/**
 * The ticker without the lines of a hidden hub: a venue's call is a line of the venues registry,
 * kept whole in the snapshot, so it is taken out here. A line of no record (a lead) stays.
 */
function hubLines(week: Ticker, rule: Rule): Ticker {
    if (rule.hubs.size === 0) return week;
    const keeps = (line: TickerItem): boolean =>
        (line.id === undefined && line.entry === undefined) || !rule.hubs.has(line.root ?? '');
    return {
        ...week,
        overdue: week.overdue.filter(keeps),
        deadlines: week.deadlines.filter(keeps),
        followups: week.followups.filter(keeps),
        subtasks: week.subtasks.filter(keeps),
        tasks: week.tasks.filter(keeps),
        snoozed: week.snoozed.filter(keeps)
    };
}

/** What makes a ticker line the same line in two tickers; a paper's folded venue is left out. */
function lineKey(line: TickerItem): string {
    const target = line.target;
    return JSON.stringify([
        line.kind,
        line.label,
        line.id ?? '',
        line.entry ?? '',
        line.root ?? '',
        line.days,
        line.months ?? null,
        line.snoozed,
        target?.kind ?? '',
        target?.id ?? '',
        target?.collection ?? '',
        target?.subtask ?? '',
        target?.note ?? ''
    ]);
}

/** How many lines of `whole` have no line of `kept` to match, each kept line matching one. */
function missing<T>(whole: readonly T[], kept: readonly T[], key: (one: T) => string): number {
    const left = new Map<string, number>();
    for (const one of kept) left.set(key(one), (left.get(key(one)) ?? 0) + 1);
    let gone = 0;
    for (const one of whole) {
        const held = left.get(key(one)) ?? 0;
        if (held > 0) left.set(key(one), held - 1);
        else gone += 1;
    }
    return gone;
}

/** How many names the awaiting box lists, each tally by its count and the blocked by theirs. */
function awaitingTotal(strip: Waiting): number {
    const sum = (tallies: Waiting['people']): number =>
        tallies.reduce((total, one) => total + one.count, 0);
    return (
        sum(strip.people) +
        sum(strip.venues) +
        strip.blocked +
        strip.grants.length +
        strip.applications.length
    );
}

/**
 * How many rows the kept sections lack against the whole ones. The command center counts its
 * dated, follow-up, subtask and snoozed lines, its venue-load rows and the projects its rows of
 * manifests behind and of projects on no lane name; the tasks section its lines; the awaiting box
 * the names it lists; each lane and each column of the band its cards.
 */
function hiddenOf(whole: FocusSections, kept: FocusSections): FocusHidden {
    const lines = (pick: (week: Ticker) => TickerItem[]): number =>
        missing(pick(whole.week), pick(kept.week), lineKey);
    const command =
        lines((week) => week.overdue) +
        lines((week) => week.deadlines) +
        lines((week) => week.followups) +
        lines((week) => week.subtasks) +
        lines((week) => week.snoozed) +
        missing(whole.week.venueLoad, kept.week.venueLoad, (one) => one.id ?? one.label) +
        (whole.week.behind?.count ?? 0) -
        (kept.week.behind?.count ?? 0) +
        (whole.week.unplaced?.count ?? 0) -
        (kept.week.unplaced?.count ?? 0);
    const laneHidden = Object.fromEntries(
        Object.entries(whole.lanes).map(([key, held]) => [
            key,
            held.length - (kept.lanes[key] ?? []).length
        ])
    );
    return {
        command,
        tasks: lines((week) => week.tasks),
        awaiting: awaitingTotal(whole.strip) - awaitingTotal(kept.strip),
        lanes: laneHidden,
        band: {
            funding: stageItemCount(whole.band.funding) - stageItemCount(kept.band.funding),
            jobs: whole.band.applications.length - kept.band.applications.length,
            teaching: whole.band.education.length - kept.band.education.length
        }
    };
}

/** How many rows a page hides in all. */
function hiddenTotal(hidden: FocusHidden): number {
    const lanes = Object.values(hidden.lanes).reduce((sum, one) => sum + one, 0);
    const band = hidden.band.funding + hidden.band.jobs + hidden.band.teaching;
    return hidden.command + hidden.tasks + hidden.awaiting + lanes + band;
}

/** The entry of a collection a row names: its collection's key, its hub and its id. */
function entryAt(
    collections: Record<Id, Collection>,
    key: string,
    root: string,
    id: string
): { entry: Entry; collection: Collection } | null {
    for (const collection of Object.values(collections)) {
        if (bareId(collection) !== key || rootOf(collection) !== root) continue;
        const entry = collection.entries.find((one) => one.id === id);
        if (entry !== undefined) return { entry, collection };
    }
    return null;
}

/**
 * Whether Mine only would hide a row of the whole page, read before any other choice of the
 * filter, as a project board reads its own before any filter: whether a record the page's
 * sections draw is one Mine only does not keep. The records are each lane card's project, the
 * projects no lane takes, each ticker line's project, entry or funding scheme, each band card's
 * entry, and the grants and applications the Awaiting box lists. Every live project the
 * venue-load and manifests-behind rows count is on a lane or is one no lane takes, and the
 * Awaiting box's other rows count lane projects. A record is read under its own hub's roles.
 */
function mineWouldHide(
    snapshot: Snapshot,
    config: Record<string, unknown>,
    whole: FocusSections,
    scope: FilterScope
): boolean {
    if (scope.self.size === 0) return false;
    const rule: Rule = { mine: true, roles: new Set(), tiers: new Set(), hubs: new Set() };
    const held = snapshot.entities;
    const project = (one: Project | undefined): boolean =>
        one !== undefined && !keepsProject(one, rule, scope);
    const entry = (key: string, root: string, id: string): boolean => {
        const found = entryAt(held.collections, key, root, id);
        return found !== null && !keepsEntry(found.entry, found.collection, rule, scope);
    };
    const scheme = (one: Funding | undefined): boolean =>
        one !== undefined && !keepsScheme(one, held.collections, rule, scope);
    const projects = Object.values(held.projects);
    if (Object.values(whole.lanes).some((lane) => lane.some(project))) return true;
    if (unplaced(projects, config, scope.wordsOf).some(project)) return true;
    const week = whole.week;
    const lines = [
        ...week.overdue,
        ...week.deadlines,
        ...week.followups,
        ...week.subtasks,
        ...week.tasks,
        ...week.snoozed
    ];
    // A scheme's follow-up names the collection of its hub whose entry names the funding registry.
    const ofFunding = (collection: string, root: string): boolean =>
        byKey(held.collections, hubId(root, collection))?.registry === 'funding';
    const hidesLine = (line: TickerItem): boolean => {
        const target = line.target;
        if (target?.kind === 'funding') return scheme(byKey(held.funding, target.id));
        if (
            target?.kind === 'followup' &&
            target.collection !== undefined &&
            ofFunding(target.collection, line.root ?? '')
        ) {
            return scheme(byKey(held.funding, target.id));
        }
        if (target?.collection !== undefined) {
            return entry(target.collection, line.root ?? '', target.id);
        }
        return line.id !== undefined && project(byKey(held.projects, line.id));
    };
    if (lines.some(hidesLine)) return true;
    const band = whole.band;
    const cards = [...band.funding.flatMap((stage) => stage.items), ...band.applications];
    if ([...cards, ...band.education].some((card) => entry(card.entry, card.root ?? '', card.id))) {
        return true;
    }
    const at = (record: { root?: string }): Record<string, unknown> =>
        scope.wordsOf(rootOf(record));
    const grants = Object.values(held.funding).filter((one) =>
        deadlineMet(at(one), one.status ?? '')
    );
    if (grants.some(scheme)) return true;
    const sent = focusWords(config, 'applications_sent');
    return flaggedCollections(held.collections, 'awaiting').some((collection) =>
        collection.entries
            .filter((one) => sent.includes(str(one.fields.status).trim().toLowerCase()))
            .some((one) => entry(bareId(collection), rootOf(one), one.id))
    );
}

/**
 * The Focus page under a choice: each section over the records the filter keeps, how many rows
 * each hides, and whether Mine only would hide a row of the whole page (`mineWouldHide`). Mine
 * only applies, with the rest of the choice, only while it would. The whole page is built once,
 * and the page under the choice once more only when the choice hides something.
 */
export function focusPage(
    snapshot: Snapshot,
    config: Record<string, unknown>,
    now: number,
    filter: FocusFilter,
    scope: FilterScope
): FocusPage {
    const known = snapshot.entities.projects;
    const whole = sectionsOf(snapshot, config, now, scope, known);
    const mineHides = mineWouldHide(snapshot, config, whole, scope);
    const rule = ruleOf(filter, scope, filter.mine && mineHides);
    if (!hidesAny(rule)) {
        return {
            snapshot,
            sections: whole,
            hidden: hiddenOf(whole, whole),
            hides: false,
            mineHides
        };
    }
    const held = keptSnapshot(snapshot, rule, scope);
    const made = sectionsOf(held, config, now, scope, known);
    const sections = { ...made, week: hubLines(made.week, rule) };
    const hidden = hiddenOf(whole, sections);
    return { snapshot: held, sections, hidden, hides: hiddenTotal(hidden) > 0, mineHides };
}
