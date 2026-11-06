// Layer 1, data tests. The one module that reads a deck folder (data/sources/documents/decks.ts),
// for the snapshot build and for the deck route: the projects of a deck's slides, their facts and
// their domains, and the findings the build raises over them, which the Findings view lists. Each
// row reads one deck through the route's read (`readDeck`) and through the module over the build's
// own input, and compares the two answers whole. The workspace is planted in a temporary directory
// (tests/fixtures/hubs/deck-hub.ts); nothing outside it is read or written.
// @module-tag slow: it builds two copies of the demo hub and reads each of them again.

import { describe, expect } from 'vitest';
import { ofHub } from '../../../src/lib/data/helpers/hub-names.ts';
import type { Deck, Finding } from '../../../src/lib/data/model/index.ts';
import { readDeck } from '../../../src/lib/server/content/deck/read.ts';
import { factsWorkspace } from '../../fixtures/hubs/deck-hub.ts';
import { it } from '../../fixtures/scratch.ts';

/** A finding by its file under the workspace folder, its line and its message. */
function line(found: Pick<Finding, 'file' | 'line' | 'message'>): string {
    const file = found.file.replace(/^.*oculus-deck-facts-[^/]+\//, '');
    return `${file}:${String(found.line)} ${found.message}`;
}

/** Whether a finding is one of a `{{project.<field>}}` placeholder. */
const placeholder = (found: Finding): boolean => found.message.startsWith('{{project.');

/** The domain each summary row, grid card and legend of a deck draws, by the slide's kind. */
function domainsOf(deck: Deck): Record<string, (string | undefined)[]> {
    const drawn: Record<string, (string | undefined)[]> = {};
    for (const slide of deck.slides) {
        if (slide.kind === 'summary') drawn.summary = slide.rows.map((row) => row.domain);
        if (slide.kind === 'grid') drawn.grid = slide.cards.map((card) => card.domain);
        if (slide.kind === 'title') drawn.legend = slide.legend;
    }
    return drawn;
}

const research = { field: 'tier', words: ['Research'] };
const exploring = { field: 'stage', words: ['exploring'], keys: ['exploring'] };
const submitted = { field: 'stage', words: ['submitted / under review'], keys: ['submitted'] };
const graphs = { field: 'domain', words: ['Graph learning'], keys: ['hub:graphs'] };
const labOnly = { field: 'domain', words: ['Lab only'], keys: ['lab:labonly'] };

/** The merge's finding of the domain key `key` of the project `id`, held by the hubs `hubs`. */
const ambiguous = (id: string, key: string, hubs: string): string =>
    `hub/projects/manuscripts/${id}/project.yml:undefined domain is ${key}, which the hubs ${hubs} each hold and its own hub does not, so it names no record`;

/**
 * The finding of the manifest check on the domain key `key` of the project `id`, at the line of its
 * `domain:`, which the check raises for a key no hub holds, the empty key among them.
 */
const notKey = (id: string, key: string): string =>
    `hub/projects/manuscripts/${id}/project.yml:5 domain is ${key}, which is not a key of domains`;

/** One deck read on the route, with what the build and the route should give for it. */
type Row = {
    row: string;
    root: string;
    path: string;
    /** Each slide's key, project and domain. */
    slides: [string, string | undefined, string | undefined][];
    /** The facts of each project the deck's slides name, when the row pins them. */
    projects?: Record<string, unknown[]>;
    /** The domains of the summary rows, the grid cards and the legend, when the deck has them. */
    drawn?: Record<string, (string | undefined)[]>;
    /** The placeholder findings on the deck's files, on both reads. */
    placeholders?: string[];
    /** The build's findings on the domain of the projects the deck's slides name. */
    domains?: string[];
    /** The title of the deck's first slide, when the row pins it. */
    title?: string;
};

const hccnet: unknown[] = [
    submitted,
    graphs,
    {
        field: 'pillars',
        words: ['Graph learning over evolving relational structure and streaming interaction data']
    },
    { field: 'datasets', words: ['synthgraph'] },
    { field: 'lead', words: ['Dr. Dana Example', 'B. Coauthor'] },
    { field: 'collaborators', words: ['B. Colleague', 'C. Senior', 'Ana Rivera'] },
    { field: 'year', words: ['2026'] },
    { field: 'venue', words: ['A*B_<x>'] },
    { field: 'funding', words: ['ecf'] },
    { field: 'compute', words: ['Demo cluster'], keys: ['cluster'] },
    { field: 'code', words: ['deposited'] },
    research
];

const ROWS: Row[] = [
    {
        row: 'a portfolio deck placing decks of a domain of the own hub, of another hub, of no hub and of two other hubs, and a repository project',
        root: 'hub',
        path: 'deck',
        slides: [
            ['title.md#0', undefined, undefined],
            ['hccnet/main.md#0', 'hccnet', undefined],
            ['crossd/main.md#0', 'crossd', 'lab:labonly'],
            ['stray/main.md#0', 'stray', undefined],
            ['twind/main.md#0', 'twind', undefined],
            ['summary:project', undefined, undefined],
            ['grid:project', undefined, undefined],
            ['kit/main.md#0', 'kit', 'hub:graphs']
        ],
        projects: {
            hccnet,
            crossd: [exploring, labOnly, research],
            stray: [exploring, research],
            twind: [exploring, research],
            kit: [submitted, graphs, { field: 'lead', words: ['Dr. Dana Example'] }, research]
        },
        drawn: {
            legend: ['hub:graphs', 'lab:labonly'],
            summary: ['hub:graphs', 'lab:labonly', undefined, undefined],
            grid: ['hub:graphs', 'lab:labonly', undefined, undefined]
        },
        domains: [ambiguous('twind', 'twin', 'lab, far'), notKey('stray', 'nowhere')]
    },
    {
        row: 'a project deck naming a domain key only another hub holds',
        root: 'hub',
        path: 'projects/manuscripts/crossd/present',
        slides: [['main.md#0', 'crossd', 'lab:labonly']]
    },
    {
        row: 'a project deck naming a domain key no hub holds',
        root: 'hub',
        path: 'projects/manuscripts/stray/present',
        slides: [['main.md#0', 'stray', undefined]],
        domains: [notKey('stray', 'nowhere')]
    },
    {
        row: 'a project deck naming a domain key two other hubs hold and its own hub does not',
        root: 'hub',
        path: 'projects/manuscripts/twind/present',
        slides: [['main.md#0', 'twind', undefined]],
        domains: [ambiguous('twind', 'twin', 'lab, far')]
    },
    {
        row: 'a project deck naming a domain key its own hub holds',
        root: 'hub',
        path: 'projects/active/graph-bandits/present',
        slides: [
            ['main.md#0', 'graph-bandits', 'hub:graphs'],
            ['main.md#1', 'graph-bandits', 'hub:graphs']
        ]
    },
    {
        row: 'the deck of a repository project of the primary hub, its domain resolved in the primary',
        root: 'kit',
        path: 'present',
        slides: [['main.md#0', 'kit', 'hub:graphs']]
    },
    {
        row: 'a project deck with a few fields and a placeholder with no value',
        root: 'hub',
        path: 'projects/ideas/quantum/present',
        slides: [['main.md#0', 'quantum', undefined]],
        projects: {
            quantum: [
                { field: 'stage', words: ['nascent (concept)'], keys: ['nascent'] },
                { field: 'domain', words: ['Methods (domain-agnostic)'], keys: ['hub:method'] },
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
        placeholders: [
            'hub/projects/ideas/quantum/present/main.md:1 {{project.venue}} holds no value for the project quantum; it is filled with nothing'
        ],
        title: 'Quantum'
    },
    {
        row: 'a project deck whose placeholders all hold a value',
        root: 'hub',
        path: 'projects/manuscripts/hccnet/present',
        slides: [['main.md#0', 'hccnet', undefined]],
        projects: { hccnet },
        title: 'At A*B_<x>'
    },
    {
        row: 'a failed project with no domain',
        root: 'hub',
        path: 'projects/archive/failedp/present',
        slides: [['main.md#0', 'failedp', undefined]],
        projects: {
            failedp: [
                { field: 'stage', words: ['failed (no-go or disproved)'], keys: ['failed'] },
                research
            ]
        }
    },
    {
        row: 'a stopped project',
        root: 'hub',
        path: 'projects/archive/stoppedp/present',
        slides: [['main.md#0', 'stoppedp', undefined]],
        projects: {
            stoppedp: [
                { field: 'stage', words: ['stopped (dropped or abandoned)'], keys: ['stopped'] },
                research
            ]
        }
    },
    {
        row: 'a person and a venue no registry holds, a person with no name and a reproduction with a note alone',
        root: 'hub',
        path: 'projects/manuscripts/ghost/present',
        slides: [['main.md#0', 'ghost', undefined]],
        projects: {
            ghost: [
                exploring,
                { field: 'lead', words: ['Dr. Dana Example', 'nameless'] },
                { field: 'reproduced', words: ['reproduced'] },
                research
            ]
        },
        placeholders: [
            'hub/projects/manuscripts/ghost/present/main.md:1 {{project.venue}} holds no value for the project ghost; it is filled with nothing'
        ],
        title: 'Ghost'
    },
    {
        row: 'empty values, an empty domain key among them',
        root: 'hub',
        path: 'projects/manuscripts/empty/present',
        slides: [['main.md#0', 'empty', undefined]],
        projects: { empty: [exploring, research] },
        domains: [notKey('empty', '')],
        placeholders: [
            'hub/projects/manuscripts/empty/present/main.md:1 {{project.lead}} holds no value for the project empty; it is filled with nothing',
            'hub/projects/manuscripts/empty/present/main.md:1 {{project.venue}} holds no value for the project empty; it is filled with nothing',
            'hub/projects/manuscripts/empty/present/main.md:1 {{project.year}} holds no value for the project empty; it is filled with nothing'
        ],
        title: 'Empty'
    },
    {
        row: "a venue and a lead only a second hub's registries hold",
        root: 'hub',
        path: 'projects/manuscripts/crossp/present',
        slides: [['main.md#0', 'crossp', undefined]],
        title: 'At Lab J'
    },
    {
        row: "a deck in a second hub's root, in that hub's words, naming a domain key only the primary holds",
        root: 'lab',
        path: 'projects/manuscripts/labp/present',
        slides: [['main.md#0', 'labp', 'hub:hubonly']],
        projects: {
            labp: [
                { field: 'stage', words: ['sent out'], keys: ['submitted'] },
                { field: 'domain', words: ['Hub only'], keys: ['hub:hubonly'] },
                { field: 'lead', words: ['Dana of Lab'] },
                research
            ]
        }
    }
];

describe("a deck's projects, facts and domains", () => {
    it("gives each deck the same slides, projects, domains and facts on the build's read and the route's, and leaves a project's domain to the manifest check's finding", () => {
        const workspace = factsWorkspace();
        const { findings, snapshot, source } = workspace;
        const built = findings.map((one) => ({ one, at: line(one) }));
        for (const one of ROWS) {
            const deck = readDeck(source, one.root, one.path);
            if (deck === 'outside') throw new Error(`${one.path} is outside`);
            const root = source.roots.find((held) => held.key === one.root);
            if (root === undefined) throw new Error(`no root ${one.root}`);
            const own = workspace.built(deck.hub).read({ key: root.key, dir: root.dir }, one.path);
            expect.soft(own, `${one.row}: the build's read and the route's`).toEqual(deck);
            expect
                .soft(
                    deck.slides.map((slide) => [
                        slide.key,
                        slide.project,
                        slide.kind === 'project' ? slide.domain : undefined
                    ]),
                    one.row
                )
                .toEqual(one.slides);
            if (one.projects !== undefined)
                expect.soft(deck.projects, one.row).toEqual(one.projects);
            if (one.drawn !== undefined) expect.soft(domainsOf(deck), one.row).toEqual(one.drawn);
            if (one.title !== undefined)
                expect.soft(deck.slides[0]?.title, one.row).toBe(one.title);
            const placeholders = one.placeholders ?? [];
            const folder = `${one.root}/${one.path}/`;
            expect
                .soft(deck.findings.filter(placeholder).map(line).sort(), one.row)
                .toEqual(placeholders);
            expect
                .soft(
                    built
                        .filter(({ one: found, at }) => placeholder(found) && at.startsWith(folder))
                        .map(({ at }) => at)
                        .sort(),
                    one.row
                )
                .toEqual(placeholders);
            const manifests = new Set(
                ofHub(source.projects, deck.hub)
                    .filter((project) => Object.hasOwn(deck.projects, project.id))
                    .map((project) => project.file)
            );
            expect
                .soft(
                    built
                        .filter(
                            ({ one: found }) => found.key === 'domain' && manifests.has(found.file)
                        )
                        .map(({ at }) => at)
                        .sort(),
                    one.row
                )
                .toEqual([...(one.domains ?? [])].sort());
            expect
                .soft(deck.findings.filter((found) => found.key === 'domain').map(line), one.row)
                .toEqual([]);
        }
        expect(
            Object.values(snapshot.entities.projects)
                .filter((project) => project.deck !== undefined)
                .map((project) => [project.id, project.deck, project.deckTags])
                .sort(),
            "the build's decks record"
        ).toEqual(DECKS);
    });
});

/** The snapshot's deck path and tags of each project with a deck, in the order of the ids. */
const DECKS: unknown[] = [
    ['hub:crossd', 'projects/manuscripts/crossd/present', ['measured']],
    ['hub:crossp', 'projects/manuscripts/crossp/present', undefined],
    ['hub:empty', 'projects/manuscripts/empty/present', undefined],
    ['hub:failedp', 'projects/archive/failedp/present', undefined],
    ['hub:ghost', 'projects/manuscripts/ghost/present', undefined],
    ['hub:graph-bandits', 'projects/active/graph-bandits/present', ['measured', 'design']],
    ['hub:hccnet', 'projects/manuscripts/hccnet/present', undefined],
    ['hub:kit', 'present', undefined],
    ['hub:quantum', 'projects/ideas/quantum/present', undefined],
    ['hub:stoppedp', 'projects/archive/stoppedp/present', undefined],
    ['hub:stray', 'projects/manuscripts/stray/present', undefined],
    ['hub:twind', 'projects/manuscripts/twind/present', undefined],
    ['lab:graph-bandits', 'projects/active/graph-bandits/present', ['measured', 'design']],
    ['lab:labp', 'projects/manuscripts/labp/present', undefined]
];
