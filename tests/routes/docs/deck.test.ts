// Layer 2, route tests. What the /api/deck route answers. The route itself joins Kit's request to
// lib/server/content/deck/endpoint.ts with the token ServerContext minted, which this calls.
//
// The roots are a temporary directory the case plants a deck in; a folder outside it is planted
// beside it, so a path that climbs out of the root or leaves it through a link has something real
// to reach. Nothing outside the temporary directory is read or written.

import { symlinkSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect } from 'vitest';
import { portfolioConfigFrom } from '../../../src/lib/data/index.ts';
import { engineDir, loadConfig } from '../../../src/lib/data/sources/config.ts';
import { mintToken } from '../../../src/lib/server/core/auth.ts';
import { handleDeck } from '../../../src/lib/server/content/deck/endpoint.ts';
import type { DeckSource } from '../../../src/lib/server/content/deck/read.ts';
import { it, plantScratch } from '../../fixtures/scratch.ts';

const TOKEN = mintToken();

/** A root with one deck, and a folder beside the root that holds a deck too. */
function source(): { source: DeckSource; dir: string } {
    const dir = plantScratch('oculus-deck-route-', {
        'hub/talk/present.yml': 'deck: { title: A talk }\norder: [main.md]\n',
        'hub/talk/main.md': '# One\n\n---\n\n# Two\n',
        'elsewhere/secret/present.yml': 'deck: { title: Secret }\norder: [main.md]\n',
        'elsewhere/secret/main.md': '# Secret\n'
    });
    symlinkSync(join(dir, 'elsewhere', 'secret'), join(dir, 'hub', 'link'));
    return {
        dir,
        source: {
            roots: [{ key: 'hub', dir: join(dir, 'hub') }],
            hub: join(dir, 'hub'),
            config: portfolioConfigFrom(loadConfig(engineDir()).config),
            projects: []
        }
    };
}

/** One request of the route, as the page makes it. */
function ask(held: DeckSource, query: string, token: string | null = TOKEN): Response {
    const headers: Record<string, string> = token === null ? {} : { 'x-oculus-token': token };
    return handleDeck(
        new Request(`http://127.0.0.1:8791/api/deck?${query}`, { headers }),
        TOKEN,
        held
    );
}

describe('the deck route', () => {
    it('refuses a root nothing serves, a path that climbs out of the root, a link and an absolute path', async () => {
        const held = source().source;
        const refused: { row: string; query: string }[] = [
            { row: 'a root nothing serves', query: 'root=nowhere&path=talk' },
            {
                row: 'a climb into a folder beside the root',
                query: 'root=hub&path=..%2Felsewhere%2Fsecret'
            },
            { row: 'a climb to the root parent', query: 'root=hub&path=..' },
            { row: 'a link inside the root that leaves it', query: 'root=hub&path=link' },
            {
                row: 'an absolute path',
                query: `root=hub&path=${encodeURIComponent(join(held.hub, '..', 'elsewhere', 'secret'))}`
            }
        ];
        for (const { row, query } of refused) {
            const response = ask(held, query);
            expect(response.status, row).toBe(403);
            expect(await response.json(), row).toEqual({ error: 'outside' });
        }
    });
});
