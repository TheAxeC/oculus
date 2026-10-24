// Layer 1, data. A deck's `present.yml` read into what the reader works from: the title, the tag
// tones, the groups and the order. Nothing here touches the disk; the text and a way to report a
// finding are handed in.
//
// A group or an order entry that is not of a shape the reader knows is reported and left out, and
// the rest of the file is read, so one mistyped entry costs its own place and not the deck.

import { isMap, str, strings } from '../../helpers/guards.ts';

/** Reports one finding: the key it is about, the catalog key of its sentence and its words. */
export type Raise = (key: string, id: string, ...args: (string | number)[]) => void;

/** Where a group looks for decks, and which of them it keeps. */
export type FindSpec = {
    /** Globs of folders, relative to the root the deck was found in. */
    folders: string[];
    /** The words of `tiers:` a deck's project must be in; absent keeps every tier. */
    tiers?: string[];
    /** The stages of `stages:` a deck's project must be at; absent keeps every stage. */
    stages?: string[];
    /** The forms of `forms:` a deck's project must have; absent keeps every form. */
    forms?: string[];
    /** The chips of `chips:` a deck's project must hold one of; absent keeps every deck. */
    status?: string[];
};

/** One group of a deck. */
export type GroupSpec = {
    name: string;
    find?: FindSpec;
    discover: boolean;
    sort: 'folder' | 'title';
    slides: string[];
};

/** One entry of `order:`. `at` names it in a finding and `index` is its place in the list. */
export type OrderEntry =
    | { kind: 'file'; file: string; at: string; index: number }
    | { kind: 'group'; group: string; at: string; index: number }
    | {
          kind: 'summary' | 'grid';
          of: string;
          title: string;
          lede: string;
          foot: string;
          at: string;
          index: number;
      };

/**
 * The token each entry of `order:` is named by in a write: a file by its name as `order:` writes
 * it, a group's slides as `slides:<group>`, a summary as `summary:<group>` and a grid as
 * `grid:<group>`. An entry that appears again takes `~2`, `~3` and on, as slide keys do.
 */
export function orderTokens(order: OrderEntry[]): string[] {
    const seen = new Map<string, number>();
    return order.map((entry) => {
        const name =
            entry.kind === 'file'
                ? entry.file
                : entry.kind === 'group'
                  ? `slides:${entry.group}`
                  : `${entry.kind}:${entry.of}`;
        const count = (seen.get(name) ?? 0) + 1;
        seen.set(name, count);
        return count === 1 ? name : `${name}~${count}`;
    });
}

/** What a `present.yml` holds. */
export type DeckSpec = {
    title: string | null;
    tagTones: Record<string, string>;
    groups: GroupSpec[];
    order: OrderEntry[];
};

/** The tones a deck's own `defaults.tag_tones` map, each a hue name. */
function tones(value: unknown): Record<string, string> {
    const held: Record<string, string> = {};
    if (!isMap(value)) return held;
    for (const [key, tone] of Object.entries(value)) {
        const name = str(tone);
        if (name !== undefined && name !== '') held[key] = name;
    }
    return held;
}

/** A glob or a list of globs as a list. */
function globs(value: unknown): string[] {
    if (typeof value === 'string') return value === '' ? [] : [value];
    return strings(value);
}

/** The `find:` of a group, or nothing when the group has none. */
function find(name: string, value: unknown, raise: Raise): FindSpec | undefined {
    if (value === undefined) return undefined;
    if (!isMap(value)) {
        raise(`groups.${name}.find`, 'findings.deck.find_not_a_map', name);
        return undefined;
    }
    const folders = globs(value.folders);
    if (folders.length === 0) raise(`groups.${name}.find`, 'findings.deck.find_no_folders', name);
    const spec: FindSpec = { folders };
    if (value.tiers !== undefined) spec.tiers = strings(value.tiers);
    if (value.stages !== undefined) spec.stages = strings(value.stages);
    if (value.forms !== undefined) spec.forms = strings(value.forms);
    if (value.status !== undefined) spec.status = strings(value.status);
    return spec;
}

/** The groups of a deck, in the order the file writes them. */
function groupsOf(value: unknown, raise: Raise): GroupSpec[] {
    if (value === undefined) return [];
    if (!isMap(value)) {
        raise('groups', 'findings.deck.groups_not_a_map');
        return [];
    }
    const groups: GroupSpec[] = [];
    for (const [name, body] of Object.entries(value)) {
        if (!isMap(body)) {
            raise(`groups.${name}`, 'findings.deck.group_not_a_map', name);
            continue;
        }
        const sort = str(body.sort);
        if (sort !== undefined && sort !== 'folder' && sort !== 'title') {
            raise(`groups.${name}.sort`, 'findings.deck.sort_unknown', name, sort);
        }
        const group: GroupSpec = {
            name,
            discover: body.discover === true,
            sort: sort === 'title' ? 'title' : 'folder',
            slides: strings(body.slides)
        };
        const looks = find(name, body.find, raise);
        if (looks !== undefined) group.find = looks;
        groups.push(group);
    }
    return groups;
}

/** The entries of `order:`. */
function orderOf(value: unknown, raise: Raise): OrderEntry[] {
    if (!Array.isArray(value)) return [];
    const order: OrderEntry[] = [];
    for (const [index, item] of value.entries()) {
        const at = `order[${index}]`;
        if (typeof item === 'string' && item.trim() !== '') {
            order.push({ kind: 'file', file: item.trim(), at, index });
            continue;
        }
        if (!isMap(item)) {
            raise(at, 'findings.deck.order_shape');
            continue;
        }
        const group = str(item.slides);
        if (group !== undefined && group !== '') {
            order.push({ kind: 'group', group, at, index });
            continue;
        }
        const kind = str(item.kind);
        const of = str(item.of);
        if ((kind === 'summary' || kind === 'grid') && of !== undefined && of !== '') {
            order.push({
                kind,
                of,
                title: str(item.title) ?? '',
                lede: str(item.lede) ?? '',
                foot: str(item.foot) ?? '',
                at,
                index
            });
            continue;
        }
        raise(at, 'findings.deck.order_shape');
    }
    return order;
}

/** What a parsed `present.yml` says, or null when it is not a map. */
export function readSpec(value: unknown, raise: Raise): DeckSpec | null {
    if (!isMap(value)) return null;
    const deck = isMap(value.deck) ? value.deck : {};
    const defaults = isMap(value.defaults) ? value.defaults : {};
    return {
        title: str(deck.title) ?? null,
        tagTones: tones(defaults.tag_tones),
        groups: groupsOf(value.groups, raise),
        order: orderOf(value.order, raise)
    };
}
