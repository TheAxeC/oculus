// Layer 1, data tests. The deck reader against synthetic decks in a temporary directory: how a
// slide file is cut into slides, and how a deck folder is read into the slides and groups it holds.
// Nothing outside the temporary directory is read or written.

import { realpathSync } from 'node:fs';
import { relative } from 'node:path';
import { describe, expect } from 'vitest';
import {
    engineDir,
    frameSetting,
    loadConfig,
    textCatalog
} from '../../../src/lib/data/sources/config.ts';
import { createReader } from '../../../src/lib/data/sources/deck/read.ts';
import { outlineOf } from '../../../src/lib/data/sources/deck/outline.ts';
import { splitSlides } from '../../../src/lib/data/sources/deck/split.ts';
import type { DeckProject } from '../../../src/lib/data/sources/deck/kinds.ts';
import type { DeckSlide } from '../../../src/lib/data/model/index.ts';
import { it, plantScratch } from '../../fixtures/scratch.ts';

/** The catalog the findings are worded from: the one oculus ships, read as the server reads it. */
const CATALOG = textCatalog(loadConfig(engineDir()).config);

/** One project of a hub, its deck at `<folder>/present`. */
function project(id: string, tier: string, extra: Partial<DeckProject> = {}): DeckProject {
    return {
        id,
        file: `projects/manuscripts/${id}/project.yml`,
        folder: `projects/manuscripts/${id}`,
        tier,
        chips: [],
        short: id,
        title: id,
        facts: [],
        ...extra
    };
}

/** The kinds of a deck's slides, in order. */
function kindsOf(slides: DeckSlide[]): string[] {
    return slides.map((slide) => slide.kind);
}

describe('splitSlides', () => {
    it('cuts a file at each separator and gives a slide after one its own front matter', () => {
        const rows: {
            row: string;
            file: string[];
            metas: (Record<string, unknown> | null)[];
            heads: string[];
            has: string[];
        }[] = [
            {
                row: 'a front matter after a separator',
                file: [
                    '# First',
                    '',
                    'Words.',
                    '---',
                    'kind: image',
                    '---',
                    '# Second',
                    '',
                    '![A figure](fig.png)',
                    '---',
                    '',
                    '# Third'
                ],
                metas: [null, { kind: 'image' }, null],
                heads: ['# First', '# Second', '# Third'],
                has: []
            },
            {
                row: 'a front matter closed by a line of dots',
                file: ['# One', '---', 'kind: image', '...', '# Two', '---', '# Three'],
                metas: [null, { kind: 'image' }, null],
                heads: ['# One', '# Two', '# Three'],
                has: []
            },
            {
                row: 'a separator inside a fenced block or an HTML comment',
                file: [
                    '# One',
                    '',
                    '````text',
                    '---',
                    '```',
                    '---',
                    '````',
                    '',
                    '<!-- a note',
                    '---',
                    'continues -->',
                    '',
                    'After.'
                ],
                metas: [null],
                heads: ['# One'],
                has: ['continues -->', 'After.']
            },
            {
                row: 'lines after a separator that are not a front matter',
                file: ['# One', '---', '# Where it wins', '- item', '---', '# Last'],
                metas: [null, null, null],
                heads: ['# One', '# Where it wins', '# Last'],
                has: ['- item']
            }
        ];
        for (const { row, file, metas, heads, has } of rows) {
            const { slides, unreadable } = splitSlides(file.join('\n'));
            expect(unreadable, row).toBe(false);
            expect(
                slides.map((slide) => slide.meta),
                row
            ).toEqual(metas);
            expect(
                slides.map((slide) => slide.body.split('\n')[0]),
                row
            ).toEqual(heads);
            for (const piece of has) {
                expect(slides.map((slide) => slide.body).join('\n'), row).toContain(piece);
            }
        }
    });
});

describe('the deck reader', () => {
    /** A hub with two project decks and a portfolio deck that holds both as a group. */
    function hub(): string {
        return plantScratch('oculus-deck-', {
            'projects/manuscripts/alpha/present/present.yml': [
                'deck: { title: Alpha }',
                'order: [main.md]'
            ].join('\n'),
            'projects/manuscripts/alpha/present/main.md': [
                '---',
                'kind: project',
                'title: Alpha headline',
                'mechanism: A mechanism',
                'headline: A result',
                '---'
            ].join('\n'),
            'projects/manuscripts/beta/present/present.yml': [
                'deck: { title: Beta }',
                'order: [one.md, two.md]'
            ].join('\n'),
            'projects/manuscripts/beta/present/one.md': '# One\n\nFirst.\n',
            'projects/manuscripts/beta/present/two.md': '# Two\n\nSecond.\n\n---\n\n# Three\n',
            'deck/present.yml': [
                'deck: { title: Portfolio }',
                'groups:',
                '    pillars:',
                '        find: { folders: projects/*/*/present, tiers: [research] }',
                '        slides:',
                '            - alpha',
                '            - beta',
                'order:',
                '    - title.md',
                '    - { slides: pillars }',
                '    - { kind: summary, of: pillars, title: Overview }'
            ].join('\n'),
            'deck/title.md': [
                '---',
                'kind: title',
                'legend: pillars',
                '---',
                '# Portfolio',
                '',
                '{{pillars.count}} slides.'
            ].join('\n')
        });
    }

    function readHub(dir: string): ReturnType<ReturnType<typeof createReader>['read']> {
        const reader = createReader({
            hub: { key: 'hub', dir },
            projects: [
                project('alpha', 'research', { domain: 'heart', short: 'Alpha' }),
                project('beta', 'research', { domain: 'heart', short: 'Beta' })
            ],
            domains: ['heart'],
            tagTones: { measured: 'green' },
            frame: frameSetting(loadConfig(engineDir()).config),
            catalog: CATALOG
        });
        return reader.read({ key: 'hub', dir }, 'deck');
    }

    it('places the member decks of a group with every slide of their files, counts them and reads their summary rows', () => {
        const deck = readHub(hub());
        expect(deck.findings).toEqual([]);
        expect(deck.state).toBe('ok');
        expect(kindsOf(deck.slides)).toEqual([
            'title',
            'project',
            'text',
            'text',
            'text',
            'summary'
        ]);
        const at = (path: string, index: number, entry: number, line: number) => ({
            root: 'hub',
            path,
            index,
            entry,
            line
        });
        const beta = 'projects/manuscripts/beta/present';
        expect(deck.slides.map((slide) => [slide.key, slide.source])).toEqual([
            ['title.md#0', at('deck/title.md', 0, 0, 1)],
            ['alpha/main.md#0', at('projects/manuscripts/alpha/present/main.md', 0, 1, 1)],
            ['beta/one.md#0', at(`${beta}/one.md`, 0, 1, 1)],
            ['beta/two.md#0', at(`${beta}/two.md`, 0, 1, 1)],
            ['beta/two.md#1', at(`${beta}/two.md`, 1, 1, 6)],
            ['summary:pillars', at('deck/present.yml', 2, 2, 11)]
        ]);
        const title = deck.slides[0];
        expect(title.kind === 'title' ? title.lede : '').toBe('4 slides.');
        expect(deck.groups).toHaveLength(1);
        expect(deck.groups[0]).toMatchObject({
            name: 'pillars',
            slides: ['alpha', 'beta'],
            count: 4,
            missing: [],
            conflicts: []
        });
        expect(deck.groups[0].members.map((member) => member.name)).toEqual(['alpha', 'beta']);
        const summary = deck.slides.at(-1);
        expect(summary?.kind).toBe('summary');
        expect(summary?.kind === 'summary' ? summary.rows : []).toEqual([
            { domain: 'heart', project: 'Alpha', mechanism: 'A mechanism', headline: 'A result' },
            { domain: 'heart', project: 'Beta', mechanism: '', headline: '' }
        ]);
    });

    it('narrows every group of project decks to the kept projects, in the slides, counts, summary, grid, legend and nested groups, and marks each member', () => {
        const dir = plantScratch('oculus-deck-keep-', {
            'projects/manuscripts/alpha/present/present.yml': [
                'deck: { title: Alpha }',
                'order: [main.md]'
            ].join('\n'),
            'projects/manuscripts/alpha/present/main.md': '# Alpha\n',
            'projects/manuscripts/beta/present/present.yml': [
                'deck: { title: Beta }',
                'groups:',
                '    inner:',
                '        find: { folders: projects/*/*/present }',
                '        slides: [alpha, gamma]',
                'order: [one.md, { slides: inner }]'
            ].join('\n'),
            'projects/manuscripts/beta/present/one.md': '# Beta\n',
            'projects/manuscripts/gamma/present/present.yml': [
                'deck: { title: Gamma }',
                'order: [one.md]'
            ].join('\n'),
            'projects/manuscripts/gamma/present/one.md': '# Gamma\n',
            'talks/talk/present.yml': ['deck: { title: Talk }', 'order: [one.md]'].join('\n'),
            'talks/talk/one.md': '# Talk\n',
            'deck/present.yml': [
                'deck: { title: Portfolio }',
                'groups:',
                '    first:',
                '        find: { folders: [projects/*/*/present, talks/*] }',
                '        slides: [alpha, beta, talk]',
                '    second:',
                '        find: { folders: projects/*/*/present }',
                '        slides: [alpha, gamma]',
                'order:',
                '    - title.md',
                '    - { slides: first }',
                '    - { kind: summary, of: first, title: Overview }',
                '    - { kind: grid, of: second, title: Grid }'
            ].join('\n'),
            'deck/title.md': [
                '---',
                'kind: title',
                'legend: first',
                '---',
                '# Portfolio',
                '',
                '{{first.count}} slides.'
            ].join('\n')
        });
        const read = (keep?: string[]) =>
            createReader({
                hub: { key: 'hub', dir },
                projects: [
                    project('alpha', 'research', { domain: 'heart', short: 'Alpha' }),
                    project('beta', 'research', { domain: 'brain', short: 'Beta' }),
                    project('gamma', 'research', { domain: 'brain', short: 'Gamma' })
                ],
                domains: ['heart', 'brain'],
                tagTones: {},
                frame: frameSetting(loadConfig(engineDir()).config),
                catalog: CATALOG,
                ...(keep === undefined ? {} : { keep: new Set(keep) })
            }).read({ key: 'hub', dir }, 'deck');
        const rows: {
            row: string;
            keep?: string[];
            slides: string[];
            lede: string;
            legend: string[];
            summary: string[];
            grid: string[];
            counts: number[];
            members: [string, string | undefined, boolean][][];
            candidates: [string, string | undefined, boolean][][];
        }[] = [
            {
                row: 'no filter',
                slides: [
                    'title.md#0',
                    'alpha/main.md#0',
                    'beta/one.md#0',
                    'beta/alpha/main.md#0',
                    'beta/gamma/one.md#0',
                    'talk/one.md#0',
                    'summary:first',
                    'grid:second'
                ],
                lede: '5 slides.',
                legend: ['heart', 'brain'],
                summary: ['Alpha', 'Beta', 'Talk'],
                grid: ['Alpha', 'Gamma'],
                counts: [5, 2],
                members: [
                    [
                        ['alpha', 'alpha', true],
                        ['beta', 'beta', true],
                        ['talk', undefined, true]
                    ],
                    [
                        ['alpha', 'alpha', true],
                        ['gamma', 'gamma', true]
                    ]
                ],
                candidates: [[['gamma', 'gamma', true]], [['beta', 'beta', true]]]
            },
            {
                row: 'beta and gamma kept, a key no project has and a duplicate',
                keep: ['beta', 'gamma', 'gamma', 'nobody'],
                slides: [
                    'title.md#0',
                    'beta/one.md#0',
                    'beta/gamma/one.md#0',
                    'summary:first',
                    'grid:second'
                ],
                lede: '2 slides.',
                legend: ['brain'],
                summary: ['Beta'],
                grid: ['Gamma'],
                counts: [2, 1],
                members: [
                    [
                        ['alpha', 'alpha', false],
                        ['beta', 'beta', true],
                        ['talk', undefined, false]
                    ],
                    [
                        ['alpha', 'alpha', false],
                        ['gamma', 'gamma', true]
                    ]
                ],
                candidates: [[['gamma', 'gamma', true]], [['beta', 'beta', true]]]
            },
            {
                row: 'nothing kept',
                keep: [],
                slides: ['title.md#0', 'summary:first', 'grid:second'],
                lede: '0 slides.',
                legend: [],
                summary: [],
                grid: [],
                counts: [0, 0],
                members: [
                    [
                        ['alpha', 'alpha', false],
                        ['beta', 'beta', false],
                        ['talk', undefined, false]
                    ],
                    [
                        ['alpha', 'alpha', false],
                        ['gamma', 'gamma', false]
                    ]
                ],
                candidates: [[['gamma', 'gamma', true]], [['beta', 'beta', true]]]
            }
        ];
        for (const one of rows) {
            const deck = read(one.keep);
            expect(deck.findings, one.row).toEqual([]);
            expect(
                deck.slides.map((slide) => slide.key),
                one.row
            ).toEqual(one.slides);
            const title = deck.slides[0];
            expect(title.kind === 'title' ? title.lede : '', one.row).toBe(one.lede);
            expect(title.kind === 'title' ? title.legend : null, one.row).toEqual(one.legend);
            const summary = deck.slides.find((slide) => slide.kind === 'summary');
            expect(
                summary?.kind === 'summary' ? summary.rows.map((row) => row.project) : null,
                one.row
            ).toEqual(one.summary);
            const grid = deck.slides.find((slide) => slide.kind === 'grid');
            expect(
                grid?.kind === 'grid' ? grid.cards.map((card) => card.name) : null,
                one.row
            ).toEqual(one.grid);
            expect(
                deck.groups.map((group) => group.count),
                one.row
            ).toEqual(one.counts);
            const marks = (list: { name: string; projectId?: string; kept: boolean }[]) =>
                list.map((member) => [member.name, member.projectId, member.kept]);
            expect(
                deck.groups.map((group) => marks(group.members)),
                one.row
            ).toEqual(one.members);
            expect(
                deck.groups.map((group) => marks(group.candidates)),
                one.row
            ).toEqual(one.candidates);
        }
    });

    it('reads an image link percent-encoded by a drop back to the file of that name', () => {
        const dir = plantScratch('oculus-deck-image-', {
            'deck/present.yml': ['deck: { title: Images }', 'order: [one.md]'].join('\n'),
            'deck/one.md': [
                '# One',
                '',
                '![fig#1](fig%231.png)',
                '![my fig](my%20fig.png)',
                '![fig(1)](fig%281%29.png)'
            ].join('\n'),
            'deck/fig#1.png': 'x',
            'deck/my fig.png': 'x',
            'deck/fig(1).png': 'x'
        });
        expect(readHub(dir).findings).toEqual([]);
    });

    it("gives each slide the project of the deck whose file holds it, and fills {{project.<field>}} from that project's facts", () => {
        const dir = plantScratch('oculus-deck-facts-', {
            'projects/manuscripts/alpha/present/present.yml': [
                'deck: { title: Alpha }',
                'groups:',
                '    kin:',
                '        find: { folders: projects/*/*/present }',
                '        slides: [beta]',
                'order: [main.md, { kind: summary, of: kin, title: Kin }]'
            ].join('\n'),
            'projects/manuscripts/alpha/present/main.md': [
                '---',
                'kind: project',
                'title: "At {{project.venue}}"',
                'tag: { text: "{{project.venue}}" }',
                'equation: "v = {{project.venue}}"',
                'specs:',
                '  - { label: Venue, value: "{{project.venue}}" }',
                'panels:',
                '  - { figure: "{{project.venue}}.png", diagram_html: "<b>{{project.venue}}</b>" }',
                'notes: "Lead {{project.lead}}"',
                '---',
                '---',
                '',
                '# Text {{project.venue}}',
                '',
                'Lead {{project.lead}}, year {{ project.year }}, code `{{project.venue}}`.',
                '',
                '```',
                '{{project.venue}}',
                '```'
            ].join('\n'),
            'projects/manuscripts/beta/present/present.yml': [
                'deck: { title: Beta }',
                'order: [main.md]'
            ].join('\n'),
            'projects/manuscripts/alpha/present/A*B_<x>.png': 'x',
            'projects/manuscripts/beta/present/main.md':
                '# Beta\n\nVenue {{project.venue}}, {{project.nope}}, {{project.Venue}}.\n',
            'projects/manuscripts/gamma/present/present.yml': [
                'deck: { title: Gamma }',
                'order: [main.md]'
            ].join('\n'),
            'projects/manuscripts/gamma/present/main.md': '# Gamma\n\n{{project.count}} slides.\n',
            'talks/present.yml': ['deck: { title: Talks }', 'order: [main.md]'].join('\n'),
            'talks/main.md': '# Talks\n\n{{project.count}} talks.\n',
            'deck/present.yml': [
                'deck: { title: Portfolio }',
                'groups:',
                '    project:',
                '        find: { folders: projects/*/*/present }',
                '        slides: [alpha]',
                'order:',
                '    - title.md',
                '    - { slides: project }',
                '    - { kind: summary, of: project, title: Overview }'
            ].join('\n'),
            'deck/title.md': '# Portfolio\n\n{{project.count}} and {{project.venue}}\n'
        });
        const facts = [
            { field: 'venue' as const, words: ['A*B_<x>'] },
            { field: 'lead' as const, words: ['Ann Example', 'Bo'] },
            { field: 'year' as const, words: ['2026'] }
        ];
        const context = {
            hub: { key: 'hub', dir },
            projects: [
                project('alpha', 'research', { facts }),
                project('beta', 'research'),
                project('gamma', 'research')
            ],
            domains: [],
            tagTones: {},
            frame: frameSetting(loadConfig(engineDir()).config),
            catalog: CATALOG
        };
        const escaped = 'A\\*B\\_\\<x\\>';
        const filled = {
            project: {
                title: 'At A*B_<x>',
                heading: `At ${escaped}`,
                tag: 'A*B_<x>',
                equation: 'v = A*B_<x>',
                spec: escaped,
                figure: 'A*B_<x>.png',
                diagram: '<b>A*B_&lt;x&gt;</b>',
                notes: 'Lead Ann Example, Bo'
            },
            text: {
                title: 'Text A*B_<x>',
                body: [
                    `# Text ${escaped}`,
                    '',
                    'Lead Ann Example, Bo, year 2026, code `A*B_<x>`.',
                    '',
                    '```',
                    'A*B_<x>',
                    '```'
                ].join('\n')
            }
        };
        /** What a slide carries: its project, and its words where a placeholder may stand. */
        const carried = (slide: DeckSlide) => ({
            key: slide.key,
            project: slide.project,
            ...(slide.kind === 'project'
                ? {
                      title: slide.title,
                      heading: slide.slide.title,
                      tag: slide.slide.tag?.text,
                      equation: slide.slide.equation,
                      spec: slide.slide.specs.at(0)?.value,
                      figure: slide.slide.panels.at(0)?.figure,
                      diagram: slide.slide.panels.at(0)?.diagramHtml,
                      notes: slide.notes
                  }
                : {}),
            ...(slide.kind === 'text' ? { title: slide.title, body: slide.body } : {})
        });
        const beta = 'projects/manuscripts/beta/present/main.md';
        /** What a summary over beta's deck raises, since it reads beta's slides. */
        const betaFindings: [string, number | undefined, string][] = [
            [
                beta,
                1,
                '{{project.venue}} holds no value for the project beta; it is filled with nothing'
            ],
            [
                beta,
                1,
                "{{project.nope}} names no field of a project's facts (form, stage, chips, domain, pillars, datasets, lead, supervisors, collaborators, year, venue, funding, compute, code, reproduced, tier); it stays as written"
            ],
            [
                beta,
                1,
                "{{project.Venue}} names no field of a project's facts (form, stage, chips, domain, pillars, datasets, lead, supervisors, collaborators, year, venue, funding, compute, code, reproduced, tier); it stays as written"
            ]
        ];
        const rows: {
            row: string;
            path: string;
            slides: ReturnType<typeof carried>[];
            projects: string[];
            findings: [string, number | undefined, string][];
        }[] = [
            {
                row: "a deck that is no project's, placing a project deck and a summary of it",
                path: 'deck',
                slides: [
                    {
                        key: 'title.md#0',
                        project: undefined,
                        title: 'Portfolio',
                        body: '# Portfolio\n\n3 and {{project.venue}}'
                    },
                    { key: 'alpha/main.md#0', project: 'alpha', ...filled.project },
                    { key: 'alpha/main.md#1', project: 'alpha', ...filled.text },
                    { key: 'alpha/summary:kin', project: 'alpha' },
                    { key: 'summary:project', project: undefined }
                ],
                projects: ['alpha'],
                findings: [
                    ...betaFindings,
                    [
                        'deck/title.md',
                        1,
                        "{{project.venue}} is in a deck that is no project's; it stays as written"
                    ]
                ]
            },
            {
                row: "a project's own deck, its summary of another project's deck its own",
                path: 'projects/manuscripts/alpha/present',
                slides: [
                    { key: 'main.md#0', project: 'alpha', ...filled.project },
                    { key: 'main.md#1', project: 'alpha', ...filled.text },
                    { key: 'summary:kin', project: 'alpha' }
                ],
                projects: ['alpha'],
                findings: betaFindings
            },
            {
                row: 'a field with no value, a name that is no field and one of another case',
                path: 'projects/manuscripts/beta/present',
                slides: [
                    {
                        key: 'main.md#0',
                        project: 'beta',
                        title: 'Beta',
                        body: '# Beta\n\nVenue , {{project.nope}}, {{project.Venue}}.'
                    }
                ],
                projects: ['beta'],
                findings: betaFindings
            },
            {
                row: "{{project.count}} in a deck that is no project's",
                path: 'talks',
                slides: [
                    {
                        key: 'main.md#0',
                        project: undefined,
                        title: 'Talks',
                        body: '# Talks\n\n{{project.count}} talks.'
                    }
                ],
                projects: [],
                findings: [
                    [
                        'talks/present.yml',
                        undefined,
                        'a count of group project, which the deck does not define, stays as written'
                    ]
                ]
            },
            {
                row: "{{project.count}} in a project's deck that defines no group project",
                path: 'projects/manuscripts/gamma/present',
                slides: [
                    {
                        key: 'main.md#0',
                        project: 'gamma',
                        title: 'Gamma',
                        body: '# Gamma\n\n{{project.count}} slides.'
                    }
                ],
                projects: ['gamma'],
                findings: [
                    [
                        'projects/manuscripts/gamma/present/present.yml',
                        undefined,
                        'a count of group project, which the deck does not define, stays as written'
                    ]
                ]
            }
        ];
        const real = realpathSync(dir);
        for (const one of rows) {
            const deck = createReader(context).read({ key: 'hub', dir }, one.path);
            expect(deck.slides.map(carried), one.row).toEqual(one.slides);
            expect(Object.keys(deck.projects), one.row).toEqual(one.projects);
            const found = deck.findings.map((finding) => [
                relative(real, finding.file),
                finding.line,
                finding.message
            ]);
            expect(found.sort(), one.row).toEqual([...one.findings].sort());
        }
    });
});

describe('outlineOf', () => {
    it('cuts a file into one slide for each level-1 heading and reads the slide file back as those slides', () => {
        const rows: {
            row: string;
            text: string;
            title: string;
            slides: { kind: string; first: string }[];
            has?: string[];
        }[] = [
            {
                row: 'text before the first heading, a fenced block holding a heading line, and a level-2 heading',
                text: 'Some text\n\n# A\n\n```\n# not a heading\n```\n\n## B\n\n# C\n',
                title: 'A',
                slides: [
                    { kind: 'title', first: '# A' },
                    { kind: 'text', first: '# A' },
                    { kind: 'text', first: '# C' }
                ],
                has: ['# not a heading', '## B']
            },
            {
                row: 'a file with no level-1 heading',
                text: 'Just a paragraph.\n\nAnother one.\n',
                title: 'notes',
                slides: [{ kind: 'text', first: 'Just a paragraph.' }]
            },
            {
                row: 'a thematic break written as three hyphens between two headings',
                text: '# A\n\n---\n\n# B\n',
                title: 'A',
                slides: [
                    { kind: 'text', first: '# A' },
                    { kind: 'text', first: '# B' }
                ],
                has: ['***']
            },
            {
                row: 'front matter, a heading written over equals signs and a line of text over hyphens',
                text: '---\ntitle: x\n---\nIntro\n=====\n\nA line\n---\n',
                title: 'Intro',
                slides: [{ kind: 'text', first: '# Intro' }],
                has: ['## A line']
            }
        ];
        for (const { row, text, title, slides, has } of rows) {
            const outline = outlineOf(text, 'notes');
            expect(outline.title, row).toBe(title);
            const read = splitSlides(outline.slides).slides;
            expect(
                read.map((slide) => [slide.meta?.kind ?? 'text', slide.body.split('\n')[0]]),
                row
            ).toEqual(slides.map((one) => [one.kind, one.first]));
            for (const kept of has ?? []) expect(outline.slides, row).toContain(kept);
            expect(outline.slides, row).not.toContain('title: x');
        }
    });
});
