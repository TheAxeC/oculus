// Layer 2, server. One audit finding parked or brought back, written into the `audit_ignore:` list
// of config/behavior.yml.
//
// It is the second write that touches an engine file rather than the hub, after the deck's: the
// mute list is oculus's own configuration and not the researcher's data. The edit is over the bytes
// through server/edit/list-edit.ts, so the file's comments and every other key stay as they were,
// and the result is read back and compared with the original before anything is written; a file the
// line edit cannot keep is refused whole rather than written in a shape the audit would no longer
// read.
//
// The watcher watches `config/`, so the file this writes is pushed on the `config` channel within a
// second and the audit is published again with the new muted list; there is no build step and
// nothing to invalidate.

import { readFileSync, writeFileSync } from 'node:fs';
import { parse } from 'yaml';
import { othersThan, readBack, setList } from '../list-edit.ts';
import { SIGNATURE } from '../../content/audit.ts';

/** The top-level key of config/behavior.yml the parked signatures live under. */
export const IGNORE = 'audit_ignore';

/** What a mute write answers with: what it changed, or the one word saying what was wrong. */
export type MuteOutcome = { changed: string[]; refused: [] } | { error: 'invalid' | 'unwritable' };

/**
 * Every entry of the list as the file writes it, in its order. A line that is not a signature (a
 * note the reader left there by hand) is kept and written back where it was;
 * server/content/audit.ts's `mutedSignatures` is what decides which of them are muted findings, so
 * such a line mutes nothing and is not lost either.
 */
function held(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    return value.filter((one): one is string => typeof one === 'string');
}

/** A map of a parsed document, or an empty one for anything that is not a map. */
function mapOf(value: unknown): Record<string, unknown> {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return {};
    return value as Record<string, unknown>;
}

/**
 * Whether the edited source still says what the original said, with the one list replaced: it must
 * parse, it must hold exactly the signatures asked for, and every other top-level key must be
 * unchanged.
 */
function kept(source: string, edited: string, wanted: string[]): boolean {
    const read = readBack(source, edited);
    if (read === null) return false;
    if (othersThan(read.before, [IGNORE]) !== othersThan(read.after, [IGNORE])) return false;
    return JSON.stringify(read.after[IGNORE] ?? []) === JSON.stringify(wanted);
}

/** The list one write leaves behind: the signature added at the end, or taken out. */
function nextList(current: string[], signature: string, muted: boolean): string[] {
    const without = current.filter((one) => one !== signature);
    return muted ? [...without, signature] : without;
}

/**
 * Park one finding or bring it back. A signature that is not twelve hex characters is refused
 * without reading the file, and a write that would leave the list as it is writes nothing.
 */
export function writeMute(file: string, signature: string, muted: boolean): MuteOutcome {
    if (!SIGNATURE.test(signature)) return { error: 'invalid' };
    let source: string;
    try {
        source = readFileSync(file, 'utf8');
    } catch {
        return { error: 'unwritable' };
    }
    let current: string[];
    try {
        current = held(mapOf(parse(source))[IGNORE]);
    } catch {
        return { error: 'invalid' };
    }
    const wanted = nextList(current, signature, muted);
    const edited = setList(source, null, IGNORE, wanted);
    if (!kept(source, edited, wanted)) return { error: 'invalid' };
    if (edited === source) return { changed: [], refused: [] };
    try {
        writeFileSync(file, edited, 'utf8');
    } catch {
        return { error: 'unwritable' };
    }
    return { changed: [IGNORE], refused: [] };
}
