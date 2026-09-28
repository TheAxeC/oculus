// Layer 2, server. The rail's list of pages, written into the `rail:` list of config/layout.yml by
// the Settings view.
//
// It is an engine file like the deck's and the audit's, since the rail is oculus's own
// configuration. The list is checked by the rule the page and the Settings view read it with,
// data/sources/config/rail.ts, against the arrangements the same file holds and the glyph names of
// the merged config, so a list the page would draw with a button missing is refused whole. The
// edit is over the bytes through server/edit/list-edit.ts, every other line of the file kept, and
// the result is read back and compared with the original before anything is written.
//
// The watcher watches `config/`, so the file this writes is pushed on the `config` channel within a
// second and the rail redraws from it; there is no build step and nothing to invalidate.

import { readFileSync, writeFileSync } from 'node:fs';
import { isDeepStrictEqual } from 'node:util';
import { parse } from 'yaml';
import {
    arrangementKeys,
    railRows,
    readRail,
    type RailEntry
} from '../../../data/sources/config/rail.ts';
import { entryText, othersThan, readBack, setItems } from '../list-edit.ts';
import type { ChangeRecord } from '../../core/changes.ts';

/** The top-level key of config/layout.yml the rail's list lives under. */
export const RAIL = 'rail';

/** What a rail write answers with: what it changed, or the one word saying what was wrong. */
export type RailOutcome =
    | { changed: string[]; refused: []; records?: ChangeRecord[] }
    | { error: 'invalid' | 'unwritable' };

/** A map of a parsed document, or an empty one for anything that is not a map. */
function mapOf(value: unknown): Record<string, unknown> {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return {};
    return value as Record<string, unknown>;
}

/**
 * The list one text of the file holds, every entry as three strings whether or not the rule keeps
 * it, which is what the change log records and what an undo compares against.
 */
export function railLists(source: string): RailEntry[] {
    let parsed: unknown;
    try {
        parsed = parse(source);
    } catch {
        return [];
    }
    return railRows(mapOf(parsed)[RAIL]) ?? [];
}

/** The list the file holds now, or null when it cannot be read. */
export function railNow(file: string): RailEntry[] | null {
    try {
        return railLists(readFileSync(file, 'utf8'));
    } catch {
        return null;
    }
}

/** One entry as the line the file carries: a flow map, its label always quoted. */
function itemText(entry: RailEntry): string {
    const label = JSON.stringify(entry.label);
    return `{ label: ${label}, glyph: ${entryText(entry.glyph)}, page: ${entryText(entry.page)} }`;
}

/**
 * Whether the edited source still says what the original said, with the one list replaced: it must
 * parse, it must hold exactly the entries asked for, and every other top-level key must be
 * unchanged.
 */
function kept(source: string, edited: string, wanted: RailEntry[]): boolean {
    const read = readBack(source, edited);
    if (read === null) return false;
    if (othersThan(read.before, [RAIL]) !== othersThan(read.after, [RAIL])) return false;
    return isDeepStrictEqual(read.after[RAIL] ?? [], wanted);
}

/**
 * Write the rail's list. Every entry must be one the rule keeps, against the arrangements this
 * file holds and the glyph names given, or nothing is written; a list the file already holds
 * writes nothing and answers so.
 */
export function writeRail(file: string, rail: RailEntry[], glyphs: string[]): RailOutcome {
    let source: string;
    try {
        source = readFileSync(file, 'utf8');
    } catch {
        return { error: 'unwritable' };
    }
    let parsed: Record<string, unknown>;
    try {
        parsed = mapOf(parse(source));
    } catch {
        return { error: 'invalid' };
    }
    const read = readRail(rail, arrangementKeys(parsed.arrangements), glyphs);
    if (read.problems.length > 0) return { error: 'invalid' };
    const wanted = read.entries;
    const edited = setItems(source, null, RAIL, wanted.map(itemText));
    if (!kept(source, edited, wanted)) return { error: 'invalid' };
    if (edited === source) return { changed: [], refused: [] };
    const before = railLists(source);
    try {
        writeFileSync(file, edited, 'utf8');
    } catch {
        return { error: 'unwritable' };
    }
    return {
        changed: [RAIL],
        refused: [],
        records: [{ file, key: RAIL, field: RAIL, before, after: wanted, undo: 'field' }]
    };
}
