// Layer 1, data, pure. How a list of records or a map family a workspace file's `settings:` sets is
// laid over oculus's value of it, entry by entry, so a workspace changes one rail button or one
// arrangement without copying the rest.
//
// A list of records whose option names a field under `key:` (the rail by `page`, the themes by
// `name`) is merged by that field: each workspace entry replaces oculus's entry of the same key, or
// is added when oculus has none, and the merged list holds the workspace's entries in its order,
// then oculus's other entries in oculus's order, so the order the reader saw is the order kept. An
// entry `{ <key field>: x, removed: true }` takes oculus's entry `x` out and is not itself in the
// list. A map family (a map whose keys are names the data chooses) is merged by its keys the same
// way, and `x: null` takes oculus's key `x` out.
//
// An entry that cannot be applied is a problem, and oculus's entry then stands: `removed` holding
// anything but true, `removed: true` or `x: null` naming an entry oculus does not hold, and two
// workspace entries naming one key (none of the two is applied). A workspace entry with no key to
// tell it by (not a map, or its key field not a text) is added as it is, and the reader of the list
// says what is wrong with it, as it does for a row of oculus's own file.

import { isMap } from '../../../helpers/guards.ts';

/** The field a workspace entry of a keyed list is taken out with. */
const REMOVED = 'removed';

/** What could not be applied of a workspace value, and the key of the entry it names. */
export type OverrideProblem = {
    kind: 'removed_value' | 'removed_unknown' | 'null_unknown' | 'repeated';
    entry: string;
};

/** A merged value and what of the workspace's value could not be applied. */
export type Merged<T> = { value: T; problems: OverrideProblem[] };

/** The key of a row of a keyed list, or null for a row with none to tell it by. */
function keyOf(row: unknown, field: string): string | null {
    if (!isMap(row)) return null;
    const key = row[field];
    return typeof key === 'string' ? key : null;
}

/** The keys that more than one row of a list names, each once, in the order first met. */
function repeatedKeys(rows: readonly unknown[], field: string): Set<string> {
    const seen = new Set<string>();
    const twice = new Set<string>();
    for (const row of rows) {
        const key = keyOf(row, field);
        if (key === null) continue;
        if (seen.has(key)) twice.add(key);
        seen.add(key);
    }
    return twice;
}

/**
 * A workspace list of records laid over oculus's list by the key field: the workspace's entries in
 * its order, then oculus's entries it neither replaced nor took out, in oculus's order.
 */
export function mergeRecords(
    oculus: readonly unknown[],
    workspace: readonly unknown[],
    field: string
): Merged<unknown[]> {
    const problems: OverrideProblem[] = [];
    const held = new Set(oculus.flatMap((row) => keyOf(row, field) ?? []));
    const twice = repeatedKeys(workspace, field);
    for (const key of twice) problems.push({ kind: 'repeated', entry: key });
    const head: unknown[] = [];
    const named = new Set<string>();
    for (const row of workspace) {
        const key = keyOf(row, field);
        if (key === null) {
            head.push(row);
            continue;
        }
        if (twice.has(key)) continue;
        const marked = isMap(row) && Object.hasOwn(row, REMOVED);
        if (marked && row[REMOVED] !== true) {
            problems.push({ kind: 'removed_value', entry: key });
            continue;
        }
        if (marked && !held.has(key)) {
            problems.push({ kind: 'removed_unknown', entry: key });
            continue;
        }
        named.add(key);
        if (!marked) head.push(row);
    }
    const tail = oculus.filter((row) => {
        const key = keyOf(row, field);
        return key === null || !named.has(key);
    });
    return { value: [...head, ...tail], problems };
}

/**
 * A workspace map laid over oculus's map family by its keys: the workspace's keys in its order,
 * then oculus's keys it neither replaced nor took out with a null, in oculus's order.
 */
export function mergeFamily(
    oculus: Readonly<Record<string, unknown>>,
    workspace: Readonly<Record<string, unknown>>
): Merged<Record<string, unknown>> {
    const problems: OverrideProblem[] = [];
    const head: [string, unknown][] = [];
    const named = new Set<string>();
    for (const [key, value] of Object.entries(workspace)) {
        if (value === null && !Object.hasOwn(oculus, key)) {
            problems.push({ kind: 'null_unknown', entry: key });
            continue;
        }
        named.add(key);
        if (value !== null) head.push([key, value]);
    }
    const tail = Object.entries(oculus).filter(([key]) => !named.has(key));
    return { value: Object.fromEntries([...head, ...tail]), problems };
}

/**
 * What a workspace file holds for a keyed list the reader sees as `seen`: every entry of it in its
 * order, then `{ <field>: x, removed: true }` for each of oculus's entries `x` it does not hold, so
 * mergeRecords over oculus's list gives `seen` back.
 */
export function recordsOverride(
    oculus: readonly unknown[],
    seen: readonly unknown[],
    field: string
): unknown[] {
    const kept = new Set(seen.flatMap((row) => keyOf(row, field) ?? []));
    const gone = oculus.flatMap((row) => {
        const key = keyOf(row, field);
        return key === null || kept.has(key) ? [] : [{ [field]: key, [REMOVED]: true }];
    });
    return [...seen, ...gone];
}

/**
 * What a workspace file holds for a map family the reader sees as `seen`: every key of it in its
 * order, then `x: null` for each of oculus's keys it does not hold, so mergeFamily over oculus's
 * map gives `seen` back.
 */
export function familyOverride(
    oculus: Readonly<Record<string, unknown>>,
    seen: Readonly<Record<string, unknown>>
): Record<string, unknown> {
    const gone = Object.keys(oculus).filter((key) => !Object.hasOwn(seen, key));
    return Object.fromEntries([
        ...Object.entries(seen),
        ...gone.map((key): [string, null] => [key, null])
    ]);
}
