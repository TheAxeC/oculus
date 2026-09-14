// Layer 2, server. The per-session overrides file: what the user dismissed, pinned or renamed.
//
// `{"sessions": {"<id>": {"hidden": true, "area": "/path", "title": "my name"}}}` at
// ~/.oculus/sessions.json by default. The scoring in group.ts is a heuristic and is wrong
// sometimes, which is why a session can be pinned to an area by hand; a dismissal hides a session
// that has ended and nothing else.
//
// A write keeps every other key of the file and every other key of the session's own entry, and
// goes through one atomic replace, because the file holds work the user did by hand.

import { homedir } from 'node:os';
import { isAbsolute, join } from 'node:path';
import { isMap, readJson, writeJsonAtomic } from './json.ts';

/** What one session's entry may hold. Any other key the file carries is kept but not read. */
export type Override = {
    hidden?: boolean;
    area?: string;
    title?: string;
    [key: string]: unknown;
};

/** ~/.oculus/sessions.json, resolved at the call rather than at import. */
export function defaultOverridesPath(): string {
    return join(homedir(), '.oculus', 'sessions.json');
}

/** Every session entry the file holds. Missing or corrupt yields nothing. */
export function overrides(path?: string): Record<string, Override> {
    const data = readJson(path ?? defaultOverridesPath());
    if (!isMap(data) || !isMap(data.sessions)) return {};
    const found: Record<string, Override> = {};
    for (const [key, value] of Object.entries(data.sessions)) {
        if (isMap(value)) found[key] = value;
    }
    return found;
}

/** The session ids the user dismissed. A missing or corrupt file hides nothing. */
export function hiddenIds(path?: string): Set<string> {
    const ids = new Set<string>();
    for (const [key, value] of Object.entries(overrides(path))) {
        if (value.hidden === true) ids.add(key);
    }
    return ids;
}

/**
 * Dismiss one session, or restore it. Every other key in the file, and every other key on this
 * session's own entry, is preserved; a restore that empties an entry removes the entry rather than
 * leaving a shell behind. Returns the flag that was written.
 */
export function setHidden(sessionId: unknown, hidden: boolean, path?: string): boolean {
    if (typeof sessionId !== 'string' || sessionId.trim() === '') {
        throw new Error('a session id is required');
    }
    const ident = sessionId.trim();
    const file = path ?? defaultOverridesPath();
    const read = readJson(file);
    const data: Record<string, unknown> = isMap(read) ? { ...read } : {};
    const sessions: Record<string, unknown> = isMap(data.sessions) ? { ...data.sessions } : {};
    const existing = sessions[ident];
    const entry: Record<string, unknown> = isMap(existing) ? { ...existing } : {};
    if (hidden) entry.hidden = true;
    else delete entry.hidden;
    if (Object.keys(entry).length > 0) sessions[ident] = entry;
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- a Map here would change the shape every reader of this record depends on
    else delete sessions[ident];
    data.sessions = sessions;
    writeJsonAtomic(file, data);
    return hidden;
}

/** What one refusal says: the field that was not written, and why it was not. */
export type OverrideRefusal = { field: string; reason: string };

/** The two fields a pin write carries. An absent field is left exactly as the file has it. */
export type OverrideFields = { area?: string; title?: string };

/** What a pin write did: the keys whose value changed, and the ones that were refused. */
export type OverrideResult = { changed: string[]; refused: OverrideRefusal[] };

/**
 * Pin one session to an area, rename it, or clear either. Only the fields named are touched: every
 * other key of the file, and every other key of that session's own entry, is kept, and an entry left
 * with nothing in it is removed rather than left as a shell. An area that is not an absolute path is
 * refused rather than written, because group.ts matches a pin against absolute workspace paths and a
 * relative one would silently never match. Nothing is written when nothing changed.
 */
export function setOverride(
    sessionId: unknown,
    fields: OverrideFields,
    path?: string
): OverrideResult {
    if (typeof sessionId !== 'string' || sessionId.trim() === '') {
        throw new Error('a session id is required');
    }
    const ident = sessionId.trim();
    const file = path ?? defaultOverridesPath();
    const read = readJson(file);
    const data: Record<string, unknown> = isMap(read) ? { ...read } : {};
    const sessions: Record<string, unknown> = isMap(data.sessions) ? { ...data.sessions } : {};
    const existing = sessions[ident];
    const entry: Record<string, unknown> = isMap(existing) ? { ...existing } : {};
    const changed: string[] = [];
    const refused: OverrideRefusal[] = [];

    for (const key of ['area', 'title'] as const) {
        const value = fields[key];
        if (value === undefined) continue;
        const wanted = value.trim();
        if (key === 'area' && wanted !== '' && !isAbsolute(wanted)) {
            refused.push({ field: key, reason: 'the area must be an absolute path' });
            continue;
        }
        const before = entry[key];
        if (wanted === '') {
            if (before === undefined) continue;
            // eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- a Map here would change the shape every reader of this record depends on
            delete entry[key];
        } else {
            if (before === wanted) continue;
            entry[key] = wanted;
        }
        changed.push(key);
    }

    if (changed.length === 0) return { changed, refused };
    if (Object.keys(entry).length > 0) sessions[ident] = entry;
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- a Map here would change the shape every reader of this record depends on
    else delete sessions[ident];
    data.sessions = sessions;
    writeJsonAtomic(file, data);
    return { changed, refused };
}
