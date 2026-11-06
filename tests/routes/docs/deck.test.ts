// Layer 2, route tests. What the /api/deck route answers. The route itself joins Kit's request to
// lib/server/content/deck/endpoint.ts with the token ServerContext minted, which this calls.
//
// The roots are a temporary directory the case plants a deck in; a folder outside it is planted
// beside it, so a path that climbs out of the root or leaves it through a link has something real
// to reach. The case of a project's facts reads the two-hub workspace of
// tests/fixtures/hubs/deck-hub.ts: the hubs `hub` and `lab`, copied from the demo hub, and the
// repository folder `kit`, built as the portfolio watcher builds them. Nothing outside the
// temporary directories is read or written.
// @module-tag slow: its cases time out under the load of a full npm test, so npm test leaves
// it out.

import { symlinkSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect } from 'vitest';
import { portfolioConfigFrom } from '../../../src/lib/data/index.ts';
import { engineDir, loadConfig } from '../../../src/lib/data/sources/config.ts';
import { mintToken } from '../../../src/lib/server/core/auth.ts';
import { handleDeck, handleDeckDrafts } from '../../../src/lib/server/content/deck/endpoint.ts';
import type { DeckSource } from '../../../src/lib/server/content/deck/read.ts';
import type { Deck } from '../../../src/lib/data/model/index.ts';
import { factsWorkspace } from '../../fixtures/hubs/deck-hub.ts';
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
            primary: { key: 'hub', dir: join(dir, 'hub') },
            config: portfolioConfigFrom(loadConfig(engineDir()).config),
            projects: [],
            entities: () => null
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
                query: `root=hub&path=${encodeURIComponent(join(held.primary?.dir ?? '', '..', 'elsewhere', 'secret'))}`
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

    it('answers the portfolio deck of a hub that never names it as unnamed when its folder is missing, and a named one as missing', async () => {
        const rows: { row: string; layer: string; path: string; state: string }[] = [
            {
                row: 'a hub that names no deck',
                layer: 'scan:\n  - { dir: . }\n',
                path: 'deck',
                state: 'unnamed'
            },
            {
                row: 'a hub that names the deck',
                layer: 'scan:\n  - { dir: . }\nportfolio_deck: deck\n',
                path: 'deck',
                state: 'missing'
            },
            {
                row: 'another folder of a hub that names no deck',
                layer: 'scan:\n  - { dir: . }\n',
                path: 'talks',
                state: 'missing'
            }
        ];
        for (const { row, layer, path, state } of rows) {
            const dir = plantScratch('oculus-deck-unnamed-', {
                'hub/.oculus/config.yml': layer
            });
            const hub = join(dir, 'hub');
            const loaded = loadConfig(engineDir(), { hub });
            const held: DeckSource = {
                roots: [{ key: 'hub', dir: hub }],
                primary: { key: 'hub', dir: hub },
                config: portfolioConfigFrom(loaded.config, loaded.from),
                projects: [],
                entities: () => null
            };
            const deck = (await ask(held, `root=hub&path=${path}`).json()) as { state: string };
            expect(deck.state, row).toBe(state);
        }
    });

    it("answers each project's facts in the words of the hub its deck is read under, and each slide's domain", async () => {
        const { source } = factsWorkspace();
        const read = async (root: string, path: string): Promise<Deck> =>
            (await ask(source, `root=${root}&path=${encodeURIComponent(path)}`).json()) as Deck;
        const research = { field: 'tier', words: ['Research'] };
        const rows: {
            row: string;
            root: string;
            path: string;
            projects: Record<string, unknown[]>;
            slides: [string, string | undefined][];
        }[] = [
            {
                row: 'a portfolio deck placing a deck with every field and a repository project',
                root: 'hub',
                path: 'deck',
                projects: {
                    hccnet: [
                        {
                            field: 'stage',
                            words: ['submitted / under review'],
                            keys: ['submitted']
                        },
                        { field: 'domain', words: ['Graph learning'], keys: ['hub:graphs'] },
                        {
                            field: 'pillars',
                            words: [
                                'Graph learning over evolving relational structure and streaming interaction data'
                            ]
                        },
                        { field: 'datasets', words: ['synthgraph'] },
                        { field: 'lead', words: ['Dr. Dana Example', 'B. Coauthor'] },
                        {
                            field: 'collaborators',
                            words: ['B. Colleague', 'C. Senior', 'Ana Rivera']
                        },
                        { field: 'year', words: ['2026'] },
                        { field: 'venue', words: ['A*B_<x>'] },
                        { field: 'funding', words: ['ecf'] },
                        { field: 'compute', words: ['Demo cluster'], keys: ['cluster'] },
                        { field: 'code', words: ['deposited'] },
                        research
                    ],
                    kit: [
                        {
                            field: 'stage',
                            words: ['submitted / under review'],
                            keys: ['submitted']
                        },
                        { field: 'lead', words: ['Dr. Dana Example'] },
                        research
                    ]
                },
                slides: [
                    ['title.md#0', undefined],
                    ['hccnet/main.md#0', 'hccnet'],
                    ['kit/main.md#0', 'kit']
                ]
            },
            {
                row: 'a project deck with a few fields',
                root: 'hub',
                path: 'projects/ideas/quantum/present',
                projects: {
                    quantum: [
                        { field: 'stage', words: ['nascent (concept)'], keys: ['nascent'] },
                        {
                            field: 'domain',
                            words: ['Methods (domain-agnostic)'],
                            keys: ['hub:method']
                        },
                        {
                            field: 'pillars',
                            words: [
                                'Graph learning over evolving relational structure and streaming interaction data',
                                'Structured tensor methods'
                            ]
                        },
                        { field: 'lead', words: ['Dr. Dana Example'] },
                        research
                    ]
                },
                slides: [['main.md#0', 'quantum']]
            },
            {
                row: 'a failed project',
                root: 'hub',
                path: 'projects/archive/failedp/present',
                projects: {
                    failedp: [
                        {
                            field: 'stage',
                            words: ['failed (no-go or disproved)'],
                            keys: ['failed']
                        },
                        research
                    ]
                },
                slides: [['main.md#0', 'failedp']]
            },
            {
                row: 'a stopped project',
                root: 'hub',
                path: 'projects/archive/stoppedp/present',
                projects: {
                    stoppedp: [
                        {
                            field: 'stage',
                            words: ['stopped (dropped or abandoned)'],
                            keys: ['stopped']
                        },
                        research
                    ]
                },
                slides: [['main.md#0', 'stoppedp']]
            },
            {
                row: 'a person and a venue no registry holds, a person with no name and a reproduction with a note alone',
                root: 'hub',
                path: 'projects/manuscripts/ghost/present',
                projects: {
                    ghost: [
                        { field: 'stage', words: ['exploring'], keys: ['exploring'] },
                        { field: 'lead', words: ['Dr. Dana Example', 'nameless'] },
                        { field: 'reproduced', words: ['reproduced'] },
                        research
                    ]
                },
                slides: [['main.md#0', 'ghost']]
            },
            {
                row: 'empty values',
                root: 'hub',
                path: 'projects/manuscripts/empty/present',
                projects: {
                    empty: [{ field: 'stage', words: ['exploring'], keys: ['exploring'] }, research]
                },
                slides: [['main.md#0', 'empty']]
            },
            {
                row: "a deck in a second hub's root, in that hub's words",
                root: 'lab',
                path: 'projects/manuscripts/labp/present',
                projects: {
                    labp: [
                        { field: 'stage', words: ['sent out'], keys: ['submitted'] },
                        { field: 'lead', words: ['Dana of Lab'] },
                        research
                    ]
                },
                slides: [['main.md#0', 'labp']]
            }
        ];
        for (const one of rows) {
            const deck = await read(one.root, one.path);
            expect(deck.projects, one.row).toEqual(one.projects);
            expect(
                deck.slides.map((slide) => [slide.key, slide.project]),
                one.row
            ).toEqual(one.slides);
        }
        const graphs = await read('hub', 'projects/active/graph-bandits/present');
        const domains = graphs.slides.map((slide) =>
            slide.kind === 'project' ? slide.domain : null
        );
        expect(domains, 'a project slide of a project with a domain').toContain('hub:graphs');
        expect(
            graphs.findings.filter((one) => one.message.includes('domains registry')),
            'a domain the registry holds'
        ).toEqual([]);
    });
});
