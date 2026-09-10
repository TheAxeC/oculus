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
import { join } from 'node:path';
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
        if (isMap(value)) found[key] = value as Override;
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
    else delete sessions[ident];
    data.sessions = sessions;
    writeJsonAtomic(file, data);
    return hidden;
}
