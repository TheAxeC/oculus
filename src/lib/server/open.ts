// Layer 2, server. The authenticated open-folder action. A requested directory is resolved through
// the same hub and configured roots as the file endpoint before the operating system sees it.

import { scalar } from '../data/guards.ts';
import { execFile } from 'node:child_process';
import { realpathSync, statSync } from 'node:fs';
import { isAbsolute, resolve, sep } from 'node:path';
import { hasToken, sameOrigin } from './auth.ts';
import type { Root } from './files.ts';

/**
 * How one address reaches the operating system: a folder for the file endpoint, an `https` page for
 * the calendar's consent and event links. It is injectable so route tests open nothing.
 */
export type Opener = (target: string) => Promise<void> | void;

function json(status: number, body: unknown): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'content-type': 'application/json' }
    });
}

/** Whether a resolved path is the root itself or below it. */
function inside(path: string, root: string): boolean {
    return path === root || path.startsWith(root + sep);
}

/** Resolve an existing directory without following a symlink beyond an allowed root. */
function allowed(path: string, roots: Root[]): string | null {
    const hub = roots.find((root) => root.key === 'hub');
    const candidate = isAbsolute(path) ? path : hub === undefined ? path : resolve(hub.dir, path);
    let real: string;
    try {
        real = realpathSync(candidate);
        if (!statSync(real).isDirectory()) return null;
    } catch {
        return null;
    }
    for (const root of roots) {
        try {
            if (inside(real, realpathSync(root.dir))) return real;
        } catch {
            continue;
        }
    }
    return null;
}

/**
 * What macOpen will hand to the operating system, which is its own rule and not its caller's: an
 * absolute path that is a directory right now, or an `https` address. Anything else is refused here,
 * so the two call sites (the file endpoint's `allowed`, which resolves a directory inside a
 * configured root, and the calendar route, which reads a link out of the state it published) are the
 * narrowing and this is the floor under both. A relative path, a `file:` or `javascript:` address
 * and an argument `open` would read as an option of its own all fall outside it.
 */
export function openable(target: string): boolean {
    if (target.startsWith('-') || target === '') return false;
    if (isAbsolute(target)) {
        try {
            return statSync(target).isDirectory();
        } catch {
            return false;
        }
    }
    try {
        return new URL(target).protocol === 'https:';
    } catch {
        return false;
    }
}

/** Hand one existing folder or `https` address to macOS; anything else is refused unopened. */
export function macOpen(target: string): Promise<void> {
    if (!openable(target)) return Promise.reject(new Error('open refused'));
    return new Promise((resolveOpen, reject) => {
        execFile('open', [target], (error) => {
            if (error === null) resolveOpen();
            else reject(error instanceof Error ? error : new Error(scalar(error, 'open refused')));
        });
    });
}

/** Refuse an untrusted path, or invoke the supplied opener with its canonical directory. */
export async function handleOpen(
    request: Request,
    token: string,
    roots: Root[],
    opener: Opener = macOpen
): Promise<Response> {
    if (!sameOrigin(request, request.headers.get('host') ?? '')) {
        return json(403, { error: 'the request did not come from this page' });
    }
    if (!hasToken(request, token)) {
        return json(403, { error: 'the write token is missing or stale' });
    }
    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return json(400, { error: 'the body is not JSON' });
    }
    if (
        typeof body !== 'object' ||
        body === null ||
        Array.isArray(body) ||
        typeof (body as { path?: unknown }).path !== 'string' ||
        (body as { path: string }).path.trim() === ''
    ) {
        return json(400, { error: 'the path is required' });
    }
    const path = allowed((body as { path: string }).path, roots);
    if (path === null) {
        const reason = 'the path is outside the configured roots';
        return json(403, { error: reason, refused: [{ field: 'path', reason }] });
    }
    try {
        await opener(path);
    } catch (error) {
        const reason = error instanceof Error ? error.message : String(error);
        return json(500, { error: `the folder could not be opened: ${reason}` });
    }
    return json(200, { ok: true, changed: [], refused: [] });
}
