// Layer 1, data, pure. How a hub's settings file lays its vocabulary over oculus's, and a
// workspace file's `settings:` its catalogs, each key by its shape, so a hub changes one word of
// oculus's lists without copying the rest and oculus's order stays the order every list is drawn
// in.
//
// A map is merged by its keys: a key named replaces oculus's entry of that key in oculus's place, a
// new key comes after oculus's keys in the order it is written, and `<key>: null` takes oculus's
// entry out. A list of rows told apart by a field (`categories` by `key`, `latex_unimath` by
// `command`) is merged the same way, `{ <field>: x, removed: true }` taking oculus's row `x` out.
// Any other list is replaced whole, since its order is its meaning, and a colour (`rail_color`)
// replaces oculus's when it is written `#rrggbb`. What cannot be applied is a problem and oculus's
// entry stands: a null or a removal naming an entry oculus does not hold, `removed` holding
// anything but true, and two rows naming one key (none of the two is applied). A row with no key to
// tell it by comes after oculus's rows as it is, and the reader of the list says what is wrong with
// it. The rows of a list replaced whole are told apart by their `key`, or by their `label` in a
// list of the Focus band's stages, which has no key: a row naming the key of an earlier row is a
// problem naming its place, and oculus's list stands. The hub layer (hub-layer.ts) lets oculus's
// list stand too when a row of such a list is not of the shape oculus's file takes, and takes a
// word the hub's values no longer give out of the lists that name it. `focus_clusters` is applied
// as written, since its reader (sections/vocab.ts) takes it row by row.
//
// The inverse is here too: the value a settings file holds for a value the reader sees, so the
// merge over oculus's value gives the seen value back. It holds only the entries the reader
// changed or added and a removal for each of oculus's the reader took out; an entry left as oculus
// ships it is not written. The workspace's other keyed options keep the order of keyed.ts, the
// workspace's entries first.

import { isEqual } from 'lodash-es';
import { findingText, type TextCatalog } from '../../../helpers/finding-text.ts';
import { isMap } from '../../../helpers/guards.ts';
import { HEX_COLOUR } from '../../../shapes/catalog-files/common.ts';
import type { Merged, OverrideProblem } from './keyed.ts';
import type { PendingFinding } from './text.ts';

/** The field a row of a keyed list is taken out with. */
const REMOVED = 'removed';

/**
 * How one key is laid over oculus's value: a map by its keys, rows by a field, a list whole, its
 * rows told apart by `field` when it names one, or a colour that replaces oculus's.
 */
export type InPlace =
    | { kind: 'map' }
    | { kind: 'rows'; field: string }
    | { kind: 'whole'; field?: string }
    | { kind: 'colour' };

/**
 * What of a value laid in place cannot be applied: a problem of a merge by key, or a row of a list
 * replaced whole naming the key `entry` an earlier row names, at the index `at` of the list.
 */
type InPlaceProblem = OverrideProblem | { kind: 'repeated_row'; entry: string; at: number };

/** The kind of value a key's shape takes, named by a value that is not of it. */
export type WrongKind = 'map' | 'list' | 'colour';

/** A map merged by its keys. */
const MAP: InPlace = { kind: 'map' };

/** A list replaced whole, its rows told apart by their `key`. */
const WHOLE: InPlace = { kind: 'whole', field: 'key' };

/** A colour, written `#rrggbb`, that replaces oculus's. */
const COLOUR: InPlace = { kind: 'colour' };

/** A list of the Focus band's stages, replaced whole, its rows told apart by their `label`. */
const STAGES: InPlace = { kind: 'whole', field: 'label' };

/**
 * A list replaced whole and applied as written, since its reader takes it row by row and says what
 * is wrong with a row it leaves out (`focus_clusters`, sections/vocab.ts).
 */
const READ_BY_ROW: InPlace = { kind: 'whole' };

/**
 * The keys of config/catalogs/vocab.yml a hub's settings file sets, every key of the file, each
 * with its shape. `leads_fit`, which oculus ships none of, is a map.
 */
export const VOCAB_SHAPES: Readonly<Record<string, InPlace>> = {
    palette: MAP,
    stages: MAP,
    forms: MAP,
    chips: MAP,
    statuses: MAP,
    lead_statuses: MAP,
    focus_clusters: READ_BY_ROW,
    focus_lanes: WHOLE,
    fund_stages: STAGES,
    position_stages: STAGES,
    teaching_stages: STAGES,
    focus_lane_tones: MAP,
    facet_tones: MAP,
    tiers: MAP,
    research_audit: MAP,
    roles: WHOLE,
    categories: { kind: 'rows', field: 'key' },
    rail_color: COLOUR,
    leads_fit: MAP,
    data_access: MAP,
    venue_categories: WHOLE,
    pillar_kinds: WHOLE,
    venue_tiers: WHOLE,
    radar_buckets: WHOLE,
    ticker_categories: MAP
};

/**
 * The catalogs a workspace file's `settings:` sets, by the key each holds in the merged config,
 * each with its shape: an agent's entry, a nesting pattern, a glyph, an icon and a section of the
 * LaTeX tables each whole by its key, and the Unicode math rows by their command.
 */
export const CATALOG_SHAPES: Readonly<Record<string, InPlace>> = {
    agents: MAP,
    patterns: MAP,
    glyphs: MAP,
    icons: MAP,
    latex_editing: MAP,
    latex_unimath: { kind: 'rows', field: 'command' }
};

/** The shape a key of either table is merged by, or none for a key of neither. */
export function inPlaceOf(key: string): InPlace | undefined {
    if (Object.hasOwn(VOCAB_SHAPES, key)) return VOCAB_SHAPES[key];
    return Object.hasOwn(CATALOG_SHAPES, key) ? CATALOG_SHAPES[key] : undefined;
}

/**
 * The finding of one entry a merge could not apply: `key` is the finding's key and `name` the key
 * of the value the sentence names, with the entry's own key beside it. A row naming the key of an
 * earlier row is named by its own place, `name` and its index.
 */
export function problemFinding(
    file: string,
    key: string,
    name: string,
    problem: InPlaceProblem
): PendingFinding {
    const entry = problem.entry;
    if (problem.kind === 'repeated_row') {
        const place = `${name}.${problem.at}`;
        return {
            file,
            key: place,
            words: (catalog) =>
                findingText(catalog, 'findings.config.settings_row_repeated', place, entry)
        };
    }
    const words = {
        removed_value: (catalog: TextCatalog) =>
            findingText(catalog, 'findings.config.settings_removed_value', name, entry),
        removed_unknown: (catalog: TextCatalog) =>
            findingText(catalog, 'findings.config.settings_removed_unknown', name, entry),
        null_unknown: (catalog: TextCatalog) =>
            findingText(catalog, 'findings.config.settings_null_unknown', name, entry),
        repeated: (catalog: TextCatalog) =>
            findingText(catalog, 'findings.config.settings_repeated', name, entry)
    }[problem.kind];
    return { file, key, words };
}

/** The finding of a value that is not of the kind its key takes, oculus's value standing. */
export function wrongKindFinding(
    file: string,
    key: string,
    name: string,
    wrong: WrongKind
): PendingFinding {
    const kind = (catalog: TextCatalog): string =>
        wrong === 'map'
            ? findingText(catalog, 'findings.shape.is_map')
            : wrong === 'list'
              ? findingText(catalog, 'findings.shape.is_list')
              : findingText(catalog, 'findings.shape.is_colour');
    return {
        file,
        key,
        words: (catalog) =>
            findingText(catalog, 'findings.config.settings_value', name, kind(catalog))
    };
}

/** The key of a row of a keyed list, or null for a row with none to tell it by. */
function rowKey(row: unknown, field: string): string | null {
    if (!isMap(row)) return null;
    const key = row[field];
    return typeof key === 'string' ? key : null;
}

/**
 * A map laid over oculus's map by its keys: oculus's keys in oculus's order, each replaced by the
 * value written for it or taken out by a null, then the new keys in the order written.
 */
function mergeMapInPlace(
    oculus: Readonly<Record<string, unknown>>,
    over: Readonly<Record<string, unknown>>
): Merged<Record<string, unknown>> {
    const problems: OverrideProblem[] = [];
    const merged: [string, unknown][] = [];
    for (const [key, value] of Object.entries(oculus)) {
        if (!Object.hasOwn(over, key)) merged.push([key, value]);
        else if (over[key] !== null) merged.push([key, over[key]]);
    }
    for (const [key, value] of Object.entries(over)) {
        if (Object.hasOwn(oculus, key)) continue;
        if (value === null) problems.push({ kind: 'null_unknown', entry: key });
        else merged.push([key, value]);
    }
    return { value: Object.fromEntries(merged), problems };
}

/**
 * The rows of a list that name the key `field` of an earlier row, one problem each with the key and
 * the row's index, in the list's order.
 */
function repeatedRows(rows: readonly unknown[], field: string): InPlaceProblem[] {
    const seen = new Set<string>();
    return rows.flatMap((row, at): InPlaceProblem[] => {
        const key = rowKey(row, field);
        if (key === null) return [];
        if (!seen.has(key)) {
            seen.add(key);
            return [];
        }
        return [{ kind: 'repeated_row', entry: key, at }];
    });
}

/**
 * A list of rows laid over oculus's list by the field `field`: oculus's rows in oculus's order,
 * each replaced by the row written for its key or taken out by a removal, then the new rows and
 * the rows with no key in the order written.
 */
function mergeRowsInPlace(
    oculus: readonly unknown[],
    over: readonly unknown[],
    field: string
): Merged<unknown[]> {
    const problems: OverrideProblem[] = [];
    const held = new Set(oculus.flatMap((row) => rowKey(row, field) ?? []));
    const twice = new Set(repeatedRows(over, field).map((one) => one.entry));
    for (const key of twice) problems.push({ kind: 'repeated', entry: key });
    const named = new Map<string, unknown>();
    const tail: unknown[] = [];
    for (const row of over) {
        const key = rowKey(row, field);
        if (key === null) {
            tail.push(row);
            continue;
        }
        if (twice.has(key)) continue;
        const marked = isMap(row) && Object.hasOwn(row, REMOVED);
        if (marked && row[REMOVED] !== true) {
            problems.push({ kind: 'removed_value', entry: key });
        } else if (marked && !held.has(key)) {
            problems.push({ kind: 'removed_unknown', entry: key });
        } else if (marked || held.has(key)) {
            named.set(key, marked ? null : row);
        } else {
            tail.push(row);
        }
    }
    const kept = oculus.flatMap((row) => {
        const key = rowKey(row, field);
        if (key === null || !named.has(key)) return [row];
        const replaced = named.get(key);
        return replaced === null ? [] : [replaced];
    });
    return { value: [...kept, ...tail], problems };
}

/**
 * A value laid over oculus's by its shape, or `wrong` naming the kind of value the shape takes when
 * the value is not of it: a map for a map, a list for rows and for a list replaced whole, a colour
 * written `#rrggbb` for a colour. A list replaced whole two of whose rows name one key is oculus's
 * value, with a problem for each row that names an earlier row's key.
 */
export function layInPlace(
    shape: InPlace,
    oculus: unknown,
    value: unknown
): { value: unknown; problems: InPlaceProblem[] } | { wrong: WrongKind } {
    if (shape.kind === 'colour') {
        const written = typeof value === 'string' && HEX_COLOUR.test(value);
        return written ? { value, problems: [] } : { wrong: 'colour' };
    }
    if (shape.kind === 'map') {
        if (!isMap(value)) return { wrong: 'map' };
        return mergeMapInPlace(isMap(oculus) ? oculus : {}, value);
    }
    if (!Array.isArray(value)) return { wrong: 'list' };
    if (shape.kind === 'whole') {
        const problems = shape.field === undefined ? [] : repeatedRows(value, shape.field);
        return { value: problems.length > 0 ? oculus : value, problems };
    }
    return mergeRowsInPlace(Array.isArray(oculus) ? oculus : [], value, shape.field);
}

/**
 * What a settings file holds for a map the reader sees as `seen`: in oculus's order, each of
 * oculus's keys the reader changed with its value and each one the reader took out as null, then
 * each key oculus lacks in the reader's order. A key as oculus ships it is left out.
 */
function mapInPlaceOverride(
    oculus: Readonly<Record<string, unknown>>,
    seen: Readonly<Record<string, unknown>>
): Record<string, unknown> {
    const written: [string, unknown][] = [];
    for (const [key, value] of Object.entries(oculus)) {
        if (!Object.hasOwn(seen, key)) written.push([key, null]);
        else if (!isEqual(seen[key], value)) written.push([key, seen[key]]);
    }
    for (const [key, value] of Object.entries(seen)) {
        if (!Object.hasOwn(oculus, key)) written.push([key, value]);
    }
    return Object.fromEntries(written);
}

/**
 * What a settings file holds for a keyed list the reader sees as `seen`: in oculus's order, each
 * of oculus's rows the reader changed and `{ <field>: x, removed: true }` for each one the reader
 * took out, then each row oculus lacks in the reader's order. A row as oculus ships it is left
 * out.
 */
function rowsInPlaceOverride(
    oculus: readonly unknown[],
    seen: readonly unknown[],
    field: string
): unknown[] {
    const byKey = new Map<string, unknown>();
    for (const row of seen) {
        const key = rowKey(row, field);
        if (key !== null && !byKey.has(key)) byKey.set(key, row);
    }
    const held = new Set<string>();
    const written: unknown[] = [];
    for (const row of oculus) {
        const key = rowKey(row, field);
        if (key === null) continue;
        held.add(key);
        if (!byKey.has(key)) written.push({ [field]: key, [REMOVED]: true });
        else if (!isEqual(byKey.get(key), row)) written.push(byKey.get(key));
    }
    const added = seen.filter((row) => {
        const key = rowKey(row, field);
        return key === null || !held.has(key);
    });
    return [...written, ...added];
}

/** The settings file's form of a seen value by its shape: the inverse of layInPlace. */
export function inPlaceOverride(shape: InPlace, oculus: unknown, seen: unknown): unknown {
    if (shape.kind === 'map' && isMap(seen)) {
        return mapInPlaceOverride(isMap(oculus) ? oculus : {}, seen);
    }
    if (shape.kind === 'rows' && Array.isArray(seen)) {
        return rowsInPlaceOverride(Array.isArray(oculus) ? oculus : [], seen, shape.field);
    }
    return seen;
}
