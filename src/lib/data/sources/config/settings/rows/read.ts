// Layer 1, data. The readers of the four keys that hold reader rows and links in a hub's
// `.oculus/config.yml`: `literature.sources` and `links`, read from the primary hub, and
// `recover.sources` and `venues.browser`, read from each hub for its own records; with
// `literature.prefer`, the order the Literature search's merge takes a field from its sources in.
// Oculus ships the rows of `literature.sources`, `recover.sources` and `links` in its defaults, and
// a hub lays its own rows over them row by row (merge/in-place.ts); `venues.browser` is each hub's
// own. With no row, the feature that needs it says what is missing.
//
// Each reader takes the merged config of the hub it reads and pushes what is wrong with a row as a
// SettingProblem `row` (check.ts), which the findings of the hub's file word, so Settings and the
// Audit show a mistake the moment the file is read.

import { isMap } from '../../../../helpers/guards.ts';
import type { SettingProblem } from '../reader.ts';
import { checkLinkRow, checkReaderRow, checkRows, type RowIssue } from './check.ts';
import {
    literaturePreferShape,
    type LinkRow,
    type LiteraturePrefer,
    type ReaderRow
} from './grammar.ts';

/** The value of a dotted key of two parts in the merged map, absent when the block is no map. */
function heldAt(config: Record<string, unknown>, block: string, key: string): unknown {
    const held = config[block];
    return isMap(held) ? held[key] : undefined;
}

/** Each issue of a key's rows as a problem of that key. */
function pushed(problems: SettingProblem[], key: string, issues: RowIssue[]): void {
    for (const issue of issues) problems.push({ key, where: 'row', issue });
}

/** The reader rows of a list key, each checked, those that read in the file's order. */
function readerList(
    config: Record<string, unknown>,
    block: string,
    key: string,
    problems: SettingProblem[]
): ReaderRow[] {
    const read = checkRows(heldAt(config, block, key), checkReaderRow);
    pushed(problems, `${block}.${key}`, read.issues);
    return read.rows;
}

/** The rows of `literature.sources`, in the order the Literature search lists them. */
export function literatureRows(
    config: Record<string, unknown>,
    problems: SettingProblem[] = []
): ReaderRow[] {
    return readerList(config, 'literature', 'sources', problems);
}

/** The rows of `recover.sources`, each the `kind` a dataset source of this hub names. */
export function recoverRows(
    config: Record<string, unknown>,
    problems: SettingProblem[] = []
): ReaderRow[] {
    return readerList(config, 'recover', 'sources', problems);
}

/**
 * The row of `venues.browser`, or null when the hub names none (the key missing, null or the empty
 * map oculus's defaults hold) or it does not read.
 */
export function browserRow(
    config: Record<string, unknown>,
    problems: SettingProblem[] = []
): ReaderRow | null {
    const raw = heldAt(config, 'venues', 'browser');
    if (raw === undefined || raw === null || (isMap(raw) && Object.keys(raw).length === 0)) {
        return null;
    }
    const read = checkReaderRow(raw, 0);
    pushed(problems, 'venues.browser', read.issues);
    return read.row;
}

/** The rows of `links`, the addresses every page link is built from. */
export function linkRows(
    config: Record<string, unknown>,
    problems: SettingProblem[] = []
): LinkRow[] {
    const read = checkRows(config.links, checkLinkRow);
    pushed(problems, 'links', read.issues);
    return read.rows;
}

/** The orders of `literature.prefer`, each empty when the file names none or it does not read. */
export function literaturePrefer(
    config: Record<string, unknown>,
    problems: SettingProblem[] = []
): LiteraturePrefer {
    const raw = heldAt(config, 'literature', 'prefer');
    const empty: LiteraturePrefer = { fields: [], abstract: [], pdf: [] };
    if (raw === undefined || raw === null) return empty;
    const read = literaturePreferShape.safeParse(raw);
    if (read.success) return read.data;
    problems.push({
        key: 'literature.prefer',
        where: 'row',
        issue: { kind: 'value', row: '', at: '' }
    });
    return empty;
}

/**
 * The services the rows of `literature.sources` and `recover.sources` of each merged map sign in to
 * with a user: the `row` of every `auth` entry with `basic: true`.
 */
export function basicServices(configs: readonly Record<string, unknown>[]): Set<string> {
    const services = new Set<string>();
    for (const config of configs) {
        for (const row of [...literatureRows(config), ...recoverRows(config)]) {
            for (const entry of row.auth ?? []) if (entry.basic === true) services.add(entry.row);
        }
    }
    return services;
}

/** Every reader of this module over one merged map, for the findings of its problems. */
export function readRows(config: Record<string, unknown>, problems: SettingProblem[]): void {
    literatureRows(config, problems);
    recoverRows(config, problems);
    browserRow(config, problems);
    linkRows(config, problems);
    literaturePrefer(config, problems);
}
