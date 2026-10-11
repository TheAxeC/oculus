// Layer 1, data tests. The deck reader against synthetic decks in a temporary directory: how a
// slide file is cut into slides, and how a deck folder is read into the slides and groups it holds.
// Nothing outside the temporary directory is read or written.

import { describe, expect } from 'vitest';
import { engineDir, loadConfig, textCatalog } from '../../../src/lib/data/sources/config.ts';
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
                '        find: { folders: projects/*/*/present, tiers: [projects] }',
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
                project('alpha', 'projects', { domain: 'heart', short: 'Alpha' }),
                project('beta', 'projects', { domain: 'heart', short: 'Beta' })
            ],
            domains: ['heart'],
            tagTones: { measured: 'green' },
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
