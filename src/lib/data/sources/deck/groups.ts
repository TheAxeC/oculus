// Layer 1, data. The groups of a deck: which decks each one finds, which it names, which it adds by
// discovery, and what is wrong with the names.
//
// A group looks for decks with `find:` (globs of folders under the root, kept by the tiers, the
// stages, the forms and the chips of the deck's project) and lists them in `slides:`. The members
// are the decks `slides:` names, in its order, then, under `discover: true`, every found deck that
// no group of the deck names, in the deck order: the decks of each category of `categories:` in
// turn, the categories by `deck_order` (data/shapes/boards/order.ts), the decks of a category by
// its row's `sort:` and then the board's order, stage then title, with no pin read, then the decks
// in no category, by folder. Two groups that discover the same unnamed deck both lose it, and say
// so. A group with no `find:` names project decks of the hub. The candidates of the Add tile keep
// the order the finder gives.
//
// A read may be narrowed by a filter, the keys of the projects it keeps (`keptMembers`). It
// narrows only a group of project decks, one a member or a candidate of which is a project's deck
// before any filter, and keeps of it the members whose project's key the filter holds, a member
// that is no project's deck left out. A group of other decks keeps every member, and with no
// filter every group does. The candidates, the missing names and the conflicts are never narrowed.
//
// Nothing here reads a file: the reader hands in the decks each glob found.

import type { DeckState } from '../../model/index.ts';
import { categoryOf } from '../../shapes/boards/categories.ts';
import { BOARD_SORT, compareProjects, type DeckOrder } from '../../shapes/boards/order.ts';
import type { DeckProject } from './kinds.ts';
import type { DeckRoot } from './files.ts';
import type { DeckSpec, FindSpec, GroupSpec, Raise } from './spec.ts';

/** One deck folder as the reader holds it. */
export type Doc = {
    root: DeckRoot;
    /** The real path of the folder. */
    dir: string;
    /** The folder under its root, with `/` separators. */
    path: string;
    name: string;
    /** The `present.yml` of the folder. */
    file: string;
    project: DeckProject | null;
    /** What the file holds, or null when there is none or it cannot be read. */
    spec: DeckSpec | null;
    state: DeckState;
    title: string;
};

/** What a group needs of the reader. */
export type Finder = {
    /** The decks the globs find under a root, each deck once. */
    under: (root: DeckRoot, globs: string[], raise: Raise) => Doc[];
    /** The project decks of the hub. */
    projects: () => Doc[];
    /**
     * What the decks a group discovers are ordered by: the categories, the same categories in the
     * order a deck places them, the stage order and the config, read once for the reader.
     */
    order: DeckOrder;
};

/** A member of a group: the deck, and whether `slides:` names it. */
type Member = { doc: Doc; named: boolean };

/** One group resolved. */
export type Resolved = {
    spec: GroupSpec;
    members: Member[];
    candidates: Doc[];
    missing: string[];
    conflicts: { doc: Doc; others: string[] }[];
};

/**
 * Whether a value is one of the words of a `find:` list; a list the find does not give keeps all.
 */
function within(words: string[] | undefined, value: string | undefined): boolean {
    return words === undefined || (value !== undefined && words.includes(value));
}

/** Whether a found deck passes the tiers, stages, forms and status chips of a `find:`. */
function keeps(find: FindSpec, doc: Doc): boolean {
    const project = doc.project;
    if (!within(find.tiers, project?.tier)) return false;
    if (!within(find.stages, project?.stage)) return false;
    if (!within(find.forms, project?.form)) return false;
    if (find.status === undefined) return true;
    const wanted = find.status;
    return project?.chips.some((chip) => wanted.includes(chip)) === true;
}

/** The decks a group can see, with a name two decks share removed and reported. */
function visible(
    group: GroupSpec,
    doc: Doc,
    finder: Finder,
    raise: Raise
): { seen: Doc[]; found: Doc[] } {
    const find = group.find;
    const found =
        find === undefined
            ? []
            : finder
                  .under(doc.root, find.folders, raise)
                  .filter((one) => one.dir !== doc.dir && keeps(find, one));
    const pool = find === undefined ? finder.projects() : found;
    const byName = new Map<string, Doc[]>();
    for (const one of pool) byName.set(one.name, [...(byName.get(one.name) ?? []), one]);
    const clash = new Set<string>();
    for (const [name, many] of byName) {
        if (many.length < 2) continue;
        clash.add(name);
        raise(
            `groups.${group.name}`,
            'findings.deck.name_twice',
            group.name,
            name,
            many.map((one) => one.path).join(', ')
        );
    }
    return {
        seen: pool.filter((one) => !clash.has(one.name)),
        found: found.filter((one) => !clash.has(one.name))
    };
}

/**
 * The decks of a list in the deck order `order` holds, its categories already placed. A deck's
 * category is its project's, the first row of `categories:` that holds it (`categoryOf`, as the
 * boards file a project); the categories go in the order of `order.placed`, and the decks of one
 * category by its row's `sort:` words and then the board's order (`BOARD_SORT`), each word read
 * from the project's own stage, year and title under the stage order. The decks in no category, a
 * deck of no project and one whose project no row holds, come after every category. A tie, and the
 * decks in no category, go by the folder's path, so the order is the same on every read. No pin is
 * read: a pinned project's deck is placed as any other.
 */
function inDeckOrder(docs: readonly Doc[], order: DeckOrder): Doc[] {
    const ranked = order.placed;
    const placed = docs.map((doc) => {
        const project = doc.project;
        const category =
            project === null ? undefined : categoryOf(project, order.categories, order.vocab);
        return {
            doc,
            project,
            rank: category === undefined ? ranked.length : ranked.indexOf(category),
            words: category === undefined ? [] : [...category.sort, ...BOARD_SORT]
        };
    });
    placed.sort(
        (left, right) =>
            left.rank - right.rank ||
            (left.project === null || right.project === null
                ? 0
                : compareProjects(left.project, right.project, left.words, order.stages)) ||
            left.doc.path.localeCompare(right.doc.path)
    );
    return placed.map((one) => one.doc);
}

/** Every group of a deck, resolved. */
export function resolveGroups(
    doc: Doc,
    groups: GroupSpec[],
    finder: Finder,
    raise: Raise
): Map<string, Resolved> {
    const named = new Set(groups.flatMap((group) => group.slides));
    const seen = new Map<string, { seen: Doc[]; found: Doc[] }>();
    for (const group of groups) seen.set(group.name, visible(group, doc, finder, raise));

    const resolved = new Map<string, Resolved>();
    const discovered = new Map<string, Doc[]>();
    for (const group of groups) {
        const sight = seen.get(group.name) ?? { seen: [], found: [] };
        const members: Member[] = [];
        const missing: string[] = [];
        const names = new Set<string>();
        for (const name of group.slides) {
            if (names.has(name)) {
                raise(`groups.${group.name}`, 'findings.deck.slides_twice', group.name, name);
                continue;
            }
            names.add(name);
            const hit = sight.seen.find((one) => one.name === name);
            if (hit === undefined) {
                missing.push(name);
                raise(`groups.${group.name}`, 'findings.deck.slide_missing', group.name, name);
            } else members.push({ doc: hit, named: true });
        }
        resolved.set(group.name, { spec: group, members, candidates: [], missing, conflicts: [] });
        if (group.discover) {
            discovered.set(
                group.name,
                sight.found.filter((one) => !named.has(one.name))
            );
        }
    }

    // A deck two discovering groups both find, and neither names, goes in neither.
    const lost = new Map<string, { doc: Doc; groups: string[] }>();
    for (const [name, docs] of discovered) {
        for (const one of docs) {
            const held = lost.get(one.dir) ?? { doc: one, groups: [] };
            held.groups.push(name);
            lost.set(one.dir, held);
        }
    }
    for (const group of groups) {
        const out = resolved.get(group.name);
        if (out === undefined) continue;
        const mine: Doc[] = [];
        for (const one of discovered.get(group.name) ?? []) {
            const held = lost.get(one.dir);
            if (held === undefined || held.groups.length < 2) mine.push(one);
            else {
                const others = held.groups.filter((name) => name !== group.name);
                out.conflicts.push({ doc: one, others });
                if (held.groups[0] === group.name) {
                    raise(
                        `groups.${group.name}`,
                        'findings.deck.discover_conflict',
                        one.name,
                        held.groups.join(', ')
                    );
                }
            }
        }
        for (const one of inDeckOrder(mine, finder.order)) {
            out.members.push({ doc: one, named: false });
        }
        const sight = seen.get(group.name);
        const inGroup = new Set(out.members.map((member) => member.doc.dir));
        const clashing = new Set(out.conflicts.map((conflict) => conflict.doc.dir));
        out.candidates = (sight?.found ?? []).filter(
            (one) => !inGroup.has(one.dir) && !clashing.has(one.dir)
        );
    }
    return resolved;
}

/** Whether a group holds project decks: a member or a candidate, before any filter, is one. */
function ofProjects(group: Resolved): boolean {
    return (
        group.members.some((one) => one.doc.project !== null) ||
        group.candidates.some((one) => one.project !== null)
    );
}

/**
 * The members of a group a read draws: every member with no filter (`keep` undefined) and in a
 * group of other decks; in a group of project decks under a filter, the members whose project's
 * key `keep` holds, in their order.
 */
export function keptMembers(group: Resolved, keep: ReadonlySet<string> | undefined): Member[] {
    if (keep === undefined || !ofProjects(group)) return group.members;
    return group.members.filter((one) => one.doc.project !== null && keep.has(one.doc.project.id));
}
