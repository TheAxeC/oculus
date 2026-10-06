// The app files endpoint: an approved app's files at /apps/<name>/<key>/<path> and the two shared
// files at /apps/-/. A route module may export only its verbs, so everything it does lives in
// lib/server/machine/apps/ and this is the lines that join them.
//
// The route is outside /api/, so the origin guard of src/hooks.server.ts does not judge it: a frame
// with an opaque origin would be refused by it. serveApp applies its own conditions to every
// request and answers an empty 404 for any that fails one, whatever the method, so the fallback
// handles the verbs the route does not export.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { appsSettings } from '$lib/data/sources/config';
import oculus from '$lib/server/machine/apps/oculus.js?raw';
import { serveApp } from '$lib/server/machine/apps/serve';
import type { RequestHandler } from './$types';

/** The bytes of penpal's module as the package ships it, or null when they cannot be read. */
function penpal(): Uint8Array | null {
    try {
        return readFileSync(fileURLToPath(import.meta.resolve('penpal')));
    } catch {
        return null;
    }
}

const answer: RequestHandler = ({ request, locals }) =>
    serveApp({
        request,
        held: locals.server.apps.held(),
        limits: () => {
            const settings = appsSettings(locals.config().config);
            return { files: settings.maxFiles, bytes: settings.maxMb * 1024 * 1024 };
        },
        penpal,
        oculus
    });

export const GET: RequestHandler = answer;
export const fallback: RequestHandler = answer;
