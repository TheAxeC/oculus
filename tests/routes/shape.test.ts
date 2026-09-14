// The shape every API route module has. A route file is the one place Kit looks for a verb, so it
// holds the verb itself and calls one server function; a module beside it that the route re-exports
// from puts the handler where nothing under src/routes shows it, and a reader looking for what the
// endpoint does has to find the second file first. This reads the source of every route rather than
// importing it, since importing a Kit route pulls its `./$types` in with it.

import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const API = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', 'src', 'routes', 'api');

/** The one filename Kit reads a route's verbs from. */
const ROUTE = '+server.ts';

/** The verbs Kit reads off a route module. */
const VERBS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS', 'fallback'];

/** Every file under the API tree, in one flat list. */
function filesUnder(dir: string): string[] {
    const found: string[] = [];
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = join(dir, entry.name);
        if (entry.isDirectory()) found.push(...filesUnder(full));
        else found.push(full);
    }
    return found;
}

describe('the API route modules', () => {
    it('hold nothing but route modules: no handler parked in a file beside one', () => {
        const stray = filesUnder(API).filter((file) => !file.endsWith(ROUTE));
        expect(stray).toEqual([]);
    });

    it('declare their own verbs rather than re-exporting them from somewhere else', () => {
        const routes = filesUnder(API);
        expect(routes.length).toBeGreaterThan(0);
        for (const route of routes) {
            const source = readFileSync(route, 'utf8');
            expect(source).not.toMatch(/export\s*\{[^}]*\}\s*from/);
            const declared = VERBS.filter((verb) =>
                new RegExp(`export\\s+(const|async function|function)\\s+${verb}\\b`).test(source)
            );
            expect(declared.length, `${route} declares no verb`).toBeGreaterThan(0);
        }
    });
});
