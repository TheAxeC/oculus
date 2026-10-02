// The Present view rendered over the real deck of config/present.yml and one synthetic project, one
// case per slide kind, plus the overview grid, the empty deck and the frame a slide is drawn in.
//
// The deck is the shipped one on purpose: the six components are what draws it, so a key renamed in
// config/present.yml or a section dropped from it fails here rather than on screen.

import { render } from 'svelte/server';
import { beforeEach, describe, expect, it } from 'vitest';
import Present from '../../../src/lib/views/academic/present/Present.svelte';
import {
    engineDir,
    glyphCatalog,
    loadConfig,
    textCatalog,
    vocabCatalog
} from '../../../src/lib/data/sources/config.ts';
import { setCatalog, setGlyphs } from '../../../src/lib/state/shared/words/text.ts';
import { setVocab } from '../../../src/lib/state/shared/words/tones.ts';
import type { PresentSlide, Project, Snapshot } from '../../../src/lib/data/model/index.ts';
import type { Instance } from '../../../src/lib/state/workbench/layout/index.ts';
import { clientContext, createClientState, type ClientState } from '../../fixtures/client.ts';

const { config } = loadConfig(engineDir());
const catalog = textCatalog(config);
setCatalog(catalog);
setGlyphs(glyphCatalog(config));
setVocab(vocabCatalog(config));

const SLIDES: PresentSlide[] = [
    {
        id: 'alpha',
        projectId: 'alpha',
        tag: { class: 'measured', text: 'Measured' },
        title: 'A headline for the slide',
        sub: 'A technical subtitle',
        hook: 'One sentence of framing.',
        eli5: { purpose: 'Why it is done.', plain: 'What it does.' },
        equation: '\\min_{x} f(x)',
        specs: [{ label: 'Model', value: 'rank-(L,L,1)' }],
        panels: [
            {
                figure: 'a figure.png',
                caption: 'A caption.',
                explain: 'An explanation of the figure.'
            },
            {
                diagramHtml:
                    '<div class="dgrid" style="grid-template-columns:1fr 1fr"><div class="dnode" style="border-color:#2563eb">a node</div></div>',
                caption: 'A diagram.'
            },
            { figure: 'gone.png', missing: true, caption: 'A figure that is not there.' }
        ],
        method: ['The first step of the method.'],
        results: ['The measured number, $\\rho$ 0.49.']
    },
    {
        id: 'alpha/plain',
        projectId: 'alpha',
        specs: [],
        panels: [],
        method: [],
        results: [],
        body: '## A narrative heading\n\nA paragraph of the narrative.\n'
    }
];

const PROJECT: Project = {
    id: 'alpha',
    tier: 'active',
    ghost: false,
    type: 'active',
    title: 'The alpha project',
    chips: [],
    results: [],
    ideas: [],
    waitingOn: [],
    followups: [],
    subtasks: [],
    relatedIds: [],
    fundingIds: [],
    datasetIds: [],
    pillarIds: [],
    domainIds: ['heart'],
    collaborators: [],
    docs: [],
    present: SLIDES,
    folder: 'projects/active/alpha',
    file: 'projects/active/alpha/project.yml'
};

let client: ClientState;

function snapshot(projects: Project[]): Snapshot {
    return {
        version: 1,
        entities: { projects: Object.fromEntries(projects.map((one) => [one.id, one])) },
        relations: {},
        findings: []
    } as unknown as Snapshot;
}

beforeEach(() => {
    client = createClientState();
    client.entities.receive({
        channel: 'config',
        version: 1,
        payload: { config, text: catalog, findings: [] }
    });
    client.entities.receive({ channel: 'portfolio', version: 1, payload: snapshot([PROJECT]) });
});

const instance: Instance = { id: 'present-one', view: 'present', state: {} };

/** The view of one instance whose own state names the slide and the grid, as its markup. */
function draw(id: string, state: Record<string, unknown>): string {
    client.ui.setInstanceState(id, state);
    return render(Present, {
        context: clientContext(client),
        props: { instance: { id, view: 'present', state: {} } }
    }).body;
}

/** The markup of the equation card of a drawn slide, from its opening tag to its closing one. */
function eqcard(body: string): string {
    const start = body.indexOf('<div class="eqcard');
    expect(start).toBeGreaterThan(-1);
    return body.slice(start, body.indexOf('</div>', start));
}

/** The view at one slide, as the markup a reader would be shown. */
function at(key: string): string {
    return draw(instance.id, { slide: key, overview: false });
}

describe('the Present view', () => {
    it('draws the title slide with the deck kicker, headline, legend and hint', () => {
        const body = at('title');
        expect(body).toContain('data-slide-kind="title"');
        expect(body).toContain('technical briefing');
        expect(body).toContain('everywhere they hide');
        expect(body).toContain('Liver | imaging');
        expect(body).toContain('for the overview');
        // every glyph is filled in from the catalog, so no placeholder is left in the words
        expect(body).not.toContain('{G.');
    });

    it('draws a framing slide with its lede and its three cards', () => {
        const body = at('framing:engine');
        expect(body).toContain('data-slide-kind="framing"');
        expect(body).toContain('The common engine');
        expect(body).toContain('Interpretable by construction.');
        expect(body).toContain('Composable with constraints.');
    });

    it('draws a summary slide as a table with the catalog column names', () => {
        const body = at('summary:summary1');
        expect(body).toContain('data-slide-kind="summary"');
        expect(body).toContain('Active pillars');
        expect(body).toContain(catalog['present.col_mechanism']);
        expect(body).toContain(catalog['present.col_headline']);
        expect(body).toContain('HCCNet-FL');
        // The summary's own inline mathematics is typeset rather than shown as its source.
        expect(body).toContain('katex');
        // the mathematics is typeset, so its source is not drawn as text
        expect(body).not.toContain('$\\sqrt');
    });

    it('draws the idea grid with its cards and their maturity', () => {
        const body = at('ideas');
        expect(body).toContain('data-slide-kind="ideas"');
        expect(body).toContain('The idea pipeline');
        expect(body).toContain('BTD Autoencoder');
        expect(body).toContain('de-risking');
    });

    it('draws the closing slide with the contact line', () => {
        const body = at('closing');
        expect(body).toContain('data-slide-kind="closing"');
        expect(body).toContain('collaborations welcome');
        expect(body).toContain('axel.faes@gmail.com');
    });

    it('draws a project slide with its chips, spec strip, method, results, equation and panels', () => {
        const body = at('alpha');
        expect(body).toContain('data-slide-kind="project"');
        expect(body).toContain('data-slide="alpha"');
        expect(body).toContain('A headline for the slide');
        expect(body).toContain('A technical subtitle');
        expect(body).toContain('Cardiology | ECG');
        expect(body).toContain('Measured');
        expect(body).toContain(catalog['present.method']);
        expect(body).toContain(catalog['present.results']);
        expect(body).toContain(catalog['present.eli5_purpose']);
        expect(body).toContain('The first step of the method.');
        // The figure is the project's own file through the file route, each segment escaped.
        expect(body).toContain('/api/file/hub/projects/active/alpha/present/a%20figure.png');
        // The diagram keeps the geometry and the colour the slide wrote on its own elements.
        expect(body).toContain('a node');
        expect(body).toContain('grid-template-columns:1fr 1fr');
        expect(body).toContain('border-color:#2563eb');
        // A figure the folder does not hold is named in place of a dead image.
        expect(body).toContain(catalog['present.figure_missing'].replace('{0}', 'gone.png'));
        // the folder does not hold that figure, so it is named rather than drawn as a dead image
        expect(body).not.toContain('present/gone.png');
        // The equation is typeset inside its card and the card holds no image; the figure beside
        // it keeps its own.
        const card = eqcard(body);
        expect(card).toContain('katex');
        // the card holds the typeset formula alone, since a slide's equation is never an image
        expect(card).not.toContain('<img');
        expect(body).toContain('<img');
    });

    it('draws a slide that carries only a narrative as that narrative', () => {
        const body = at('alpha/plain');
        expect(body).toContain('A narrative heading');
        expect(body).toContain('A paragraph of the narrative.');
        // the slide carries a narrative alone, so the method heading is not drawn
        expect(body).not.toContain(catalog['present.method']);
    });

    it('draws a formula that does not parse as KaTeX error markup in the card', () => {
        const broken: Project = {
            ...PROJECT,
            present: [{ ...SLIDES[0], equation: '\\frac{' }]
        };
        client.entities.receive({ channel: 'portfolio', version: 2, payload: snapshot([broken]) });
        const card = eqcard(at('alpha'));
        expect(card).toContain('katex-error');
        // the broken formula is shown as its own source and no picture stands in
        expect(card).not.toContain('<img');
    });

    it('draws no equation card for a slide that carries none', () => {
        const bare: Project = {
            ...PROJECT,
            present: [{ ...SLIDES[0], equation: undefined }]
        };
        client.entities.receive({ channel: 'portfolio', version: 3, payload: snapshot([bare]) });
        // the slide carries no equation, so its card is left out of the markup altogether
        expect(at('alpha')).not.toContain('class="eqcard');
    });

    it('draws the slide the instance was opened on', () => {
        expect(draw('present-opened', { slide: 'alpha/plain' })).toContain('A narrative heading');
    });

    it('leaves each instance on its own slide, and a push does not move either', () => {
        expect(draw('present-a', { slide: 'framing:engine' })).toContain('The common engine');
        expect(draw('present-b', { slide: 'ideas' })).toContain('The idea pipeline');
        client.entities.receive({ channel: 'portfolio', version: 4, payload: snapshot([PROJECT]) });
        expect(
            draw('present-a', client.ui.instanceState('present-a') as Record<string, unknown>)
        ).toContain('The common engine');
        expect(
            draw('present-b', client.ui.instanceState('present-b') as Record<string, unknown>)
        ).toContain('The idea pipeline');
    });

    it('draws the overview grid with one tile per slide, and the counter over the deck', () => {
        const body = draw(instance.id, { slide: 'alpha', overview: true });
        expect(body).toContain('data-overview');
        expect(body).toContain('The common engine');
        expect(body).toContain('A headline for the slide');
        const rows = client.present.slides().length;
        expect(body).toContain(`${client.present.position('alpha')} / ${rows}`);
    });

    it('offers the slide catalog from its toolbar, beside the overview control', () => {
        const body = at('title');
        expect(body).toContain(catalog['slides.open']);
        expect(body).toContain(catalog['slides.open_tip']);
        expect(body).toContain(catalog['present.overview']);
    });

    it('keeps the header empty and puts every control in the bar, the place in the deck last', () => {
        const body = at('title');
        const header = body.slice(body.indexOf('<header'), body.indexOf('</header>'));
        // the header carries no control in this view, as every control belongs to the bar
        expect(header).not.toContain('<button');
        const bar = body.slice(
            body.indexOf('<div class="viewbar'),
            body.indexOf('<div class="body')
        );
        const order = [
            catalog['present.previous'],
            catalog['present.next'],
            catalog['present.overview'],
            catalog['slides.open'],
            `${client.present.position('title')} / ${client.present.slides().length}`
        ].map((words) => bar.indexOf(words));
        expect(order.every((at) => at > 0)).toBe(true);
        expect(order).toEqual([...order].sort((one, two) => one - two));
    });

    it('draws the overview control as a toggle that says whether the grid is open', () => {
        const shut = at('title');
        const open = draw(instance.id, { slide: 'title', overview: true });
        const toggle = (body: string): string =>
            /<button[^>]*aria-pressed="(?:true|false)"[^>]*>/.exec(body)?.[0] ?? '';
        expect(toggle(shut)).toContain('aria-pressed="false"');
        expect(toggle(open)).toContain('aria-pressed="true"');
    });

    it('draws its empty state when no config and no snapshot have arrived', () => {
        const bare = createClientState();
        const body = render(Present, {
            context: clientContext(bare),
            props: { instance }
        }).body;
        expect(body).toContain(catalog['present.empty']);
    });
});

describe('the frame a slide is drawn in', () => {
    /** The markup from the frame's opening tag to the slide, or the empty text with no frame. */
    function framed(body: string): { tag: string; inside: string } {
        const at = body.indexOf('data-frame');
        if (at < 0) return { tag: '', inside: '' };
        const open = body.lastIndexOf('<div', at);
        const close = body.indexOf('>', at);
        return { tag: body.slice(open, close + 1), inside: body.slice(close + 1) };
    }

    it('draws the slide inside the frame, which carries the 1280 by 720 design size', () => {
        const { tag, inside } = framed(at('framing:engine'));
        expect(tag).toContain('width: 1280px');
        expect(tag).toContain('height: 720px');
        expect(tag).toContain('data-scroll');
        expect(inside).toContain('data-slide-kind="framing"');
    });

    it('draws the frame hidden until the pane has been measured, so no unscaled slide shows', () => {
        expect(framed(at('title')).tag).toContain('visibility: hidden');
    });

    it('draws the empty deck outside any frame', () => {
        const bare = createClientState();
        const body = render(Present, {
            context: clientContext(bare),
            props: { instance }
        }).body;
        expect(body).toContain(catalog['present.empty']);
        // an empty deck has no slide, so there is nothing to scale and no frame is drawn
        expect(body).not.toContain('data-frame');
    });

    it('draws the overview grid outside any frame', () => {
        const body = draw(instance.id, { slide: 'alpha', overview: true });
        expect(body).toContain('data-overview');
        // the grid keeps the interface's own sizes, so no scaled frame is drawn around it
        expect(body).not.toContain('data-frame');
    });
});
