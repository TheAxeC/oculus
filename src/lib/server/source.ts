// Layer 2, server. The whole-file source write: authenticate one same-origin request, resolve its
// existing file inside a configured root, allow only configured editable extensions, and replace
// its text through a temporary neighbour and atomic rename.

import { extname } from 'node:path';
import { LOCAL_NAME, checkLocal, engineDir, loadConfig } from '../data/sources/config.ts';
import { hasToken, sameOrigin } from './auth.ts';
import { ENGINE_ROOT, resolveRootFileResult, resolveRootPath, roots, type Root } from './files.ts';
import { writeTextAtomic } from './sessions/json.ts';

export type SourceBody = { root: string; path: string; content: string };

function json(status: number, body: unknown): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'content-type': 'application/json' }
    });
}

function refuse(reason: string): Response {
    return json(403, { ok: false, error: reason, refused: [{ field: 'path', reason }] });
}

/** A normalised extension list from one merged config key. Invalid entries are ignored. */
export function extensionList(config: Record<string, unknown>, key: string): string[] {
    const value = config[key];
    if (!Array.isArray(value)) return [];
    return value
        .filter(
            (entry): entry is string => typeof entry === 'string' && /^\.[a-z0-9]+$/i.test(entry)
        )
        .map((entry) => entry.toLowerCase());
}

/** The configured writable extensions, read for each request like the configured roots. */
export function editableExtensions(): string[] {
    return extensionList(loadConfig(engineDir()).config, 'editable_extensions');
}

/** A valid whole-file source body, or null when any required field is absent or malformed. */
export function sourceBody(value: unknown): SourceBody | null {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return null;
    const held = value as Record<string, unknown>;
    if (
        typeof held.root !== 'string' ||
        held.root === '' ||
        typeof held.path !== 'string' ||
        held.path === '' ||
        typeof held.content !== 'string'
    ) {
        return null;
    }
    return { root: held.root, path: held.path, content: held.content };
}

/**
 * The sentence a save of the machine's own file is refused with, or null for any other file and for
 * a body that reads. That one file of the config folder is read by its own rules rather than merged,
 * and a malformed value in it throws: saved, it would take the source route down with it, this
 * endpoint included, so the file could not be put back from the page it was broken on. The path is
 * resolved through the same resolver the request went through, so the two strings are comparable.
 */
function localRefusal(list: Root[], path: string, content: string): string | null {
    const own = resolveRootPath(list, ENGINE_ROOT, LOCAL_NAME);
    if ('error' in own || own.path !== path) return null;
    return checkLocal(content, LOCAL_NAME);
}

/** Refuse a source write or replace its complete text and answer in the write route's shape. */
export async function handleSource(
    request: Request,
    token: string,
    rootList: Root[] = roots(),
    editable: string[] = editableExtensions()
): Promise<Response> {
    if (!sameOrigin(request, request.headers.get('host') ?? '')) {
        return json(403, { ok: false, error: 'the request did not come from this page' });
    }
    if (!hasToken(request, token)) {
        return json(403, { ok: false, error: 'the write token is missing or stale' });
    }

    let raw: unknown;
    try {
        raw = await request.json();
    } catch {
        return json(400, { ok: false, error: 'the body is not JSON' });
    }
    const body = sourceBody(raw);
    if (body === null) {
        return json(400, { ok: false, error: 'root, path and content are required' });
    }

    const resolved = resolveRootFileResult(rootList, body.root, body.path);
    if ('error' in resolved) {
        return resolved.error === 'missing'
            ? json(404, { ok: false, error: 'the file is not there' })
            : refuse('the path is outside the named root');
    }
    if (!editable.includes(extname(resolved.path).toLowerCase())) {
        return refuse('the extension is not editable');
    }
    const refusal = localRefusal(rootList, resolved.path, body.content);
    if (refusal !== null) return json(400, { ok: false, error: refusal });
    try {
        writeTextAtomic(resolved.path, body.content);
    } catch (error) {
        const reason = error instanceof Error ? error.message : String(error);
        return json(500, { ok: false, error: `the source could not be saved: ${reason}` });
    }
    return json(200, { ok: true });
}
