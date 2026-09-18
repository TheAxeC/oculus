// readPresent and deckFindings against synthetic files in a temporary directory. Nothing outside it
// is read or written, and every write asserts its path is inside the temporary directory first.

import { mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve, sep } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { deckFindings, equationIsImage, readPresent } from '../../src/lib/data/sources/present.ts';
import { engineDir, loadConfig, textCatalog } from '../../src/lib/data/sources/config.ts';
import { scratchDir, sweepScratch } from '../scratch.ts';

afterAll(sweepScratch);

/** The catalog the findings are worded from: the one oculus ships, read as the server reads it. */
const CATALOG = textCatalog(loadConfig(engineDir()).config);

function scratch(): string {
    const dir = scratchDir('oculus-present-');
    expect(resolve(dir).startsWith(resolve(tmpdir()) + sep)).toBe(true);
    return dir;
}

function write(root: string, rel: string, body: string): string {
    const full = join(root, rel);
    expect(resolve(full).startsWith(resolve(root) + sep)).toBe(true);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, body);
    return full;
}

/** A hub holding one project folder whose PRESENT.md is the body given. */
function project(body: string[]): { hub: string; folder: string; equationsDir: string } {
    const hub = scratch();
    write(hub, join('projects', 'active', 'alpha', 'PRESENT.md'), body.join('\n'));
    return { hub, folder: 'projects/active/alpha', equationsDir: 'tools/present/equations' };
}

/** The absolute PRESENT.md of such a hub, which is the file every finding names. */
function doc(paths: { hub: string; folder: string }): string {
    return join(paths.hub, paths.folder, 'PRESENT.md');
}

const RICH = [
    '---',
    'present:',
    '  tag: { class: measured, text: Measured }',
    '  title: A headline',
    '  sub: A subtitle',
    '  hook: One sentence of framing.',
    '  eli5:',
    '    purpose: Why it is done.',
    '    plain: What it does.',
    '  equation: eq_one.png',
    '  specs:',
    '    - { label: Model, value: "rank-(L,L,1)" }',
    '  panels:',
    '    - { diagram_html: "<div>a</div>", caption: A caption, explain: An explanation }',
    '  method:',
    '    - The first step.',
    '  results:',
    '    - The measured number.',
    '---',
    '',
    '# PRESENT, the narrative',
    '',
    'The body.',
    ''
];

describe('readPresent', () => {
    it('has no slides and no findings for a folder with no PRESENT.md', () => {
        const hub = scratch();
        expect(
            readPresent(
                { hub, folder: 'projects/active/alpha', equationsDir: '' },
                'alpha',
                CATALOG
            )
        ).toEqual({ slides: [], findings: [] });
    });

    it('reads the front matter into one slide under the project id', () => {
        const paths = project(RICH);
        write(paths.hub, join('tools', 'present', 'equations', 'eq_one.png'), 'not really a png');
        const { slides, findings } = readPresent(paths, 'alpha', CATALOG);
        expect(findings).toEqual([]);
        expect(slides).toHaveLength(1);
        expect(slides[0]).toMatchObject({
            id: 'alpha',
            projectId: 'alpha',
            tag: { class: 'measured', text: 'Measured' },
            title: 'A headline',
            sub: 'A subtitle',
            hook: 'One sentence of framing.',
            eli5: { purpose: 'Why it is done.', plain: 'What it does.' },
            equation: 'eq_one.png',
            specs: [{ label: 'Model', value: 'rank-(L,L,1)' }],
            panels: [
                { diagramHtml: '<div>a</div>', caption: 'A caption', explain: 'An explanation' }
            ],
            method: ['The first step.'],
            results: ['The measured number.']
        });
        // A slide was declared, so its narrative stays on disk and out of the snapshot.
        expect(slides[0].body).toBe(undefined);
    });

    it('reads a slides list as further slides of the same project, under project/slug ids', () => {
        const paths = project([
            '---',
            'present: { title: The first }',
            'slides:',
            '  - { id: data, title: The second }',
            '  - { id: method, title: The third }',
            '---',
            ''
        ]);
        const { slides, findings } = readPresent(paths, 'alpha', CATALOG);
        expect(findings).toEqual([]);
        expect(slides.map((slide) => slide.id)).toEqual(['alpha', 'alpha/data', 'alpha/method']);
        expect(slides.map((slide) => slide.projectId)).toEqual(['alpha', 'alpha', 'alpha']);
        expect(slides[1].title).toBe('The second');
    });

    it('gives a file with no front matter one slide carrying its narrative', () => {
        const paths = project(['# PRESENT, a project', '', 'Only the narrative.', '']);
        const { slides, findings } = readPresent(paths, 'alpha', CATALOG);
        expect(findings).toEqual([]);
        expect(slides).toHaveLength(1);
        expect(slides[0]).toMatchObject({ id: 'alpha', specs: [], panels: [] });
        expect(slides[0].body).toBe('\nOnly the narrative.\n');
    });

    it('reports a slide id declared twice and keeps the first of the two', () => {
        const paths = project([
            '---',
            'present: { title: The first }',
            'slides:',
            '  - { id: data, title: The second }',
            '  - { id: data, title: The clash }',
            '---',
            ''
        ]);
        const { slides, findings } = readPresent(paths, 'alpha', CATALOG);
        expect(slides.map((slide) => slide.id)).toEqual(['alpha', 'alpha/data']);
        expect(slides[1].title).toBe('The second');
        expect(findings).toEqual([
            {
                file: doc(paths),
                key: 'slides',
                message: 'slide id alpha/data is declared twice'
            }
        ]);
    });

    it('reports an entry of the slides list that names no id', () => {
        const paths = project(['---', 'slides:', '  - { title: No id here }', '---', '']);
        const { findings } = readPresent(paths, 'alpha', CATALOG);
        expect(findings).toEqual([{ file: doc(paths), key: 'slides[0]', message: 'has no id' }]);
    });

    it('marks and reports a figure that names no file under present/, and passes one that is there', () => {
        const paths = project([
            '---',
            'present:',
            '  panels:',
            '    - { figure: there.png }',
            '    - { figure: missing.png }',
            '---',
            ''
        ]);
        write(paths.hub, join(paths.folder, 'present', 'there.png'), 'not really a png');
        const { slides, findings } = readPresent(paths, 'alpha', CATALOG);
        expect(slides[0].panels.map((panel) => panel.figure)).toEqual(['there.png', 'missing.png']);
        expect(slides[0].panels.map((panel) => panel.missing)).toEqual([undefined, true]);
        expect(findings).toEqual([
            {
                file: doc(paths),
                key: 'alpha',
                message: 'figure missing.png is not in present/'
            }
        ]);
    });

    it('reports a front matter block that does not parse and still draws the narrative', () => {
        const paths = project([
            '---',
            'present: [unclosed',
            '---',
            '',
            '# PRESENT, a project',
            '',
            'The narrative stands.',
            ''
        ]);
        const { slides, findings } = readPresent(paths, 'alpha', CATALOG);
        expect(findings).toHaveLength(1);
        expect(findings[0].key).toBe('frontmatter');
        expect(slides).toHaveLength(1);
        expect(slides[0].id).toBe('alpha');
        expect(slides[0].body).toBe('\nThe narrative stands.\n');
    });
});

describe('equationIsImage', () => {
    it('reads an image name by its suffix and anything else as LaTeX', () => {
        expect(equationIsImage('eq_one.png')).toBe(true);
        expect(equationIsImage('EQ_ONE.PNG')).toBe(true);
        expect(equationIsImage('\\min_{x} f(x)')).toBe(false);
    });
});

describe('the equation image', () => {
    const SLIDE = ['---', 'present: { equation: eq_one.png }', '---', ''];

    it('resolves against the deck equations folder first', () => {
        const paths = project(SLIDE);
        write(paths.hub, join('tools', 'present', 'equations', 'eq_one.png'), 'shared');
        write(paths.hub, join(paths.folder, 'present', 'eq_one.png'), 'own');
        const { slides, findings } = readPresent(paths, 'alpha', CATALOG);
        expect(findings).toEqual([]);
        expect(slides[0].equationImage).toBe('tools/present/equations/eq_one.png');
    });

    it("falls back to the project's own present folder", () => {
        const paths = project(SLIDE);
        write(paths.hub, join(paths.folder, 'present', 'eq_one.png'), 'own');
        const { slides, findings } = readPresent(paths, 'alpha', CATALOG);
        expect(findings).toEqual([]);
        expect(slides[0].equationImage).toBe('projects/active/alpha/present/eq_one.png');
    });

    it('marks and reports an image neither place holds', () => {
        const paths = project(SLIDE);
        const { slides, findings } = readPresent(paths, 'alpha', CATALOG);
        expect(slides[0].equationImage).toBe(undefined);
        expect(slides[0].equationMissing).toBe(true);
        expect(findings).toEqual([
            {
                file: doc(paths),
                key: 'alpha',
                message:
                    "equation eq_one.png is in neither the deck's equations folder nor present/"
            }
        ]);
    });

    it('leaves LaTeX alone', () => {
        const paths = project(['---', 'present: { equation: "\\\\min_{x} f(x)" }', '---', '']);
        const { slides, findings } = readPresent(paths, 'alpha', CATALOG);
        expect(findings).toEqual([]);
        expect(slides[0].equation).toBe('\\min_{x} f(x)');
        expect(slides[0].equationImage).toBe(undefined);
        expect(slides[0].equationMissing).toBe(undefined);
    });
});

const DECK = {
    framing: { engine: { title: 'The engine' } },
    summaries: { one: { title: 'At a glance' } },
    ideas: { title: 'Next' },
    order: [
        { slide: 'title' },
        { slide: 'framing', ref: 'engine' },
        { slide: 'summary', ref: 'one' },
        { slide: 'ideas' },
        { slide: 'project', ref: 'alpha' },
        { slide: 'closing' }
    ]
};

describe('deckFindings', () => {
    it('finds nothing wrong with an order whose every entry resolves', () => {
        expect(deckFindings(DECK, ['alpha'], 'config/present.yml', CATALOG)).toEqual([]);
    });

    it('says nothing about an order entry naming a project slide this hub does not declare', () => {
        expect(deckFindings(DECK, [], 'config/present.yml', CATALOG)).toEqual([]);
    });

    it('reports a project slide whose id is a deck-level key', () => {
        const ids = ['title', 'ideas', 'closing', 'framing:engine', 'summary:one', 'alpha'];
        expect(deckFindings({ order: [] }, ids, 'config/present.yml', CATALOG)).toEqual(
            ['closing', 'framing:engine', 'ideas', 'summary:one', 'title'].map((id) => ({
                file: 'config/present.yml',
                key: 'deck',
                message: `project slide ${id} is a deck slide key and cannot be placed`
            }))
        );
    });

    it('reports a framing and a summary entry naming a key the deck does not hold', () => {
        const deck = {
            ...DECK,
            order: [
                { slide: 'framing', ref: 'nowhere' },
                { slide: 'summary', ref: 'nowhere' }
            ]
        };
        expect(deckFindings(deck, [], 'config/present.yml', CATALOG)).toEqual([
            {
                file: 'config/present.yml',
                key: 'deck.order[0]',
                message: 'deck.framing has no nowhere'
            },
            {
                file: 'config/present.yml',
                key: 'deck.order[1]',
                message: 'deck.summaries has no nowhere'
            }
        ]);
    });

    it('reports an entry with no kind, an unknown kind, and a ref that is missing', () => {
        const deck = {
            order: [{}, { slide: 'interlude' }, { slide: 'project' }, { slide: 'framing' }, 'text']
        };
        expect(
            deckFindings(deck, [], 'config/present.yml', CATALOG).map((one) => one.message)
        ).toEqual([
            'names no slide kind',
            'unknown slide kind interlude',
            'names no project slide',
            'a framing slide names no ref',
            'is not a map of keys'
        ]);
    });

    it('says nothing about a saved selection or order naming a slide that is gone', () => {
        const deck = { order: [], selection: ['alpha'], slide_order: ['beta'] };
        expect(deckFindings(deck, [], 'config/present.yml', CATALOG)).toEqual([]);
    });
});
