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
import { handleDeck, handleDeckDrafts } from '../../../src/lib/server/content/deck/endpoint.ts';
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

/** One POST of the route, as the page makes it, over the drafts given. */
async function drawn(
    held: DeckSource,
    drafts: { root: string; path: string; text: string }[],
    over: { root?: string; path?: string; token?: string | null } = {}
): Promise<Response> {
    const headers: Record<string, string> = { 'content-type': 'application/json' };
    if (over.token !== null) headers['x-oculus-token'] = over.token ?? TOKEN;
    return handleDeckDrafts(
        new Request('http://127.0.0.1:8791/api/deck', {
            method: 'POST',
            headers,
            body: JSON.stringify({ root: over.root ?? 'hub', path: over.path ?? 'talk', drafts })
        }),
        TOKEN,
        held
    );
}

/** The title of every slide of an answer. */
function headings(deck: { slides: { title?: string }[] }): (string | undefined)[] {
    return deck.slides.map((one) => one.title);
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

    it('refuses a draft read without the token and one over a root nothing serves or a path that climbs out', async () => {
        const held = source().source;
        expect((await drawn(held, [], { token: null })).status).toBe(403);
        const refused: { row: string; over: { root?: string; path?: string } }[] = [
            { row: 'a root nothing serves', over: { root: 'nowhere' } },
            { row: 'a climb into a folder beside the root', over: { path: '../elsewhere/secret' } },
            { row: 'a link inside the root that leaves it', over: { path: 'link' } }
        ];
        for (const { row, over } of refused) {
            const response = await drawn(held, [], over);
            expect(response.status, row).toBe(403);
            expect(await response.json(), row).toEqual({ error: 'outside' });
        }
    });

    it('draws a slide from the text an editor holds, and ignores a draft of a file the deck does not read or of a path outside the roots', async () => {
        const { source: held, dir } = source();
        const file = (await (await drawn(held, [])).json()) as { slides: { title?: string }[] };
        expect(headings(file)).toEqual(['One', 'Two']);
        const alias = { ...held, roots: [...held.roots, { key: 'alias', dir: join(dir, 'hub') }] };
        const draft = '# Typed\n\n---\n\n# Two\n';
        const rows: {
            row: string;
            drafts: { root: string; path: string; text: string }[];
            heads: string[];
        }[] = [
            {
                row: 'a draft of the file the deck reads',
                drafts: [{ root: 'hub', path: 'talk/main.md', text: draft }],
                heads: ['Typed', 'Two']
            },
            {
                row: 'a draft of a file the deck does not read',
                drafts: [{ root: 'hub', path: 'talk/README.md', text: '# Elsewhere\n' }],
                heads: ['One', 'Two']
            },
            {
                row: 'a draft of a path outside the served roots',
                drafts: [{ root: 'hub', path: '../elsewhere/secret/main.md', text: '# Typed\n' }],
                heads: ['One', 'Two']
            }
        ];
        for (const { row, drafts, heads } of rows) {
            const deck = (await (await drawn(held, drafts)).json()) as {
                slides: { title?: string }[];
            };
            expect(headings(deck), row).toEqual(heads);
        }
        const second = [{ root: 'alias', path: 'talk/main.md', text: draft }];
        const reached = (await (await drawn(alias, second)).json()) as {
            slides: { title?: string }[];
        };
        expect(
            headings(reached),
            'a draft under a second root key that reaches the same file'
        ).toEqual(['Typed', 'Two']);
    });
});
