// The deck as the view reads it: the `deck:` map parsed, the slides ordered, the saved selection
// and order applied, and the store's own position through them.
//
// The colours of the deck are resolved to palette hues, so the real config's own vocabulary is
// installed before any case runs, the way a component would have it installed by the first push.

import { beforeEach, describe, expect, it } from 'vitest';
import {
    deckCatalog,
    deckCatalogKeys,
    deckDefaultKeys,
    deckFrom,
    deckSlides,
    hasSlideContent,
    parsePresentState,
    plainTitle,
    slideKey,
    slideSources,
    tagToneOf,
    themeOf
} from '../../../src/lib/state/life/present.ts';
import { engineDir, loadConfig, vocabCatalog } from '../../../src/lib/data/sources/config.ts';
import { setVocab } from '../../../src/lib/state/shared/words/tones.ts';
import type { PresentSlide, Project } from '../../../src/lib/data/model/index.ts';
import { createClientState, type ClientState } from '../../fixtures/client.ts';

setVocab(vocabCatalog(loadConfig(engineDir()).config));

/** A project carrying the slides given, with the fields the deck reads and nothing else. */
function project(id: string, slides: PresentSlide[], over: Partial<Project> = {}): Project {
    return {
        id,
        tier: 'active',
        ghost: false,
        type: 'active',
        title: id,
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
        domainIds: [],
        collaborators: [],
        docs: [],
        present: slides,
        folder: `projects/active/${id}`,
        file: `projects/active/${id}/project.yml`,
        ...over
    };
}

/** One slide of a project, with only the id and whatever the case names. */
function slide(id: string, over: Partial<PresentSlide> = {}): PresentSlide {
    return {
        id,
        projectId: id.split('/')[0],
        specs: [],
        panels: [],
        method: [],
        results: [],
        ...over
    };
}

const CONFIG = {
    deck: {
        equations_dir: 'tools/present/assets/equations',
        tag_tones: { measured: 'green', proof: 'purple' },
        meta: {
            kicker: 'A briefing',
            title_html: 'Structured models,<br>everywhere they hide',
            lede: 'A dozen projects.',
            legend: [{ label: 'Heart', color: '#e2374d' }],
            hint: 'left and right to move',
            closing_kicker: 'Thank you',
            closing_title_html: 'Questions &amp;<br>collaborations welcome',
            closing_lede: 'Happy to go deeper.',
            contact: 'someone@example.org'
        },
        themes: {
            heart: { color: '#e2374d', label: 'Cardiology' },
            method: { color: '#ea580c', label: 'Methods' }
        },
        order: [
            { slide: 'title' },
            { slide: 'framing', ref: 'engine' },
            { slide: 'summary', ref: 'one' },
            { slide: 'ideas' },
            { slide: 'closing' }
        ],
        framing: {
            engine: {
                title: 'The engine',
                lede: 'A sum of blocks.',
                cards: [{ n: '1', title: 'Interpretable.', body: 'The cores are the reason.' }],
                legend: [{ label: 'Brain', color: '#7c3aed' }],
                hint: 'Then the projects.'
            }
        },
        summaries: {
            one: {
                title: 'At a glance',
                rows: [
                    {
                        field: 'Heart',
                        color: '#e2374d',
                        project: 'A project',
                        mechanism: 'A mechanism',
                        headline: 'A number'
                    }
                ],
                foot: 'A foot.'
            }
        },
        ideas: {
            title: 'Next',
            lede: 'Early directions.',
            items: [
                {
                    title: 'An idea',
                    desc: 'Its description.',
                    color: '#ea580c',
                    maturity: 'scoping'
                }
            ],
            hint: 'Gated on a novelty check.'
        }
    }
};

const DECK = deckFrom(CONFIG);

const PROJECTS = [
    project('alpha', [slide('alpha', { title: 'Alpha slide' }), slide('alpha/data')], {
        domainIds: ['heart']
    }),
    project('beta', [slide('beta')], {
        tier: 'manuscripts',
        type: 'manuscript',
        title: 'Beta',
        domainIds: ['nowhere']
    }),
    project('gamma', [], { tier: 'ideas', type: 'idea', title: 'Gamma' })
];

/** A published project with a slide, which is the archived work a public deck leaves out. */
const ARCHIVED = project('delta', [slide('delta')], {
    tier: 'archive',
    type: 'published',
    title: 'Delta'
});

describe('deckFrom', () => {
    it('reads every part of the deck and resolves its colours to palette hues', () => {
        expect(DECK.meta.kicker).toBe('A briefing');
        expect(DECK.meta.legend).toEqual([{ label: 'Heart', tone: 'crimson' }]);
        expect(DECK.themes.heart).toEqual({ tone: 'crimson', label: 'Cardiology' });
        expect(DECK.framing.engine.cards).toEqual([
            { n: '1', title: 'Interpretable.', body: 'The cores are the reason.' }
        ]);
        expect(DECK.summaries.one.rows[0]).toEqual({
            field: 'Heart',
            tone: 'crimson',
            project: 'A project',
            mechanism: 'A mechanism',
            headline: 'A number'
        });
        expect(DECK.ideas?.items[0]).toEqual({
            title: 'An idea',
            desc: 'Its description.',
            tone: 'orange',
            maturity: 'scoping'
        });
        expect(DECK.equationsDir).toBe('tools/present/assets/equations');
        expect(DECK.tagTones).toEqual({ measured: 'green', proof: 'purple' });
        expect(DECK.selection).toBeNull();
        expect(DECK.slideOrder).toBeNull();
    });

    it('reads an empty deck out of a config that holds none', () => {
        const empty = deckFrom({});
        expect(empty.order).toEqual([]);
        expect(empty.ideas).toBeNull();
        expect(empty.meta.legend).toEqual([]);
    });

    it('drops an order line that names a kind the deck has no slide of', () => {
        const deck = deckFrom({ deck: { order: [{ slide: 'interlude' }, { slide: 'title' }] } });
        expect(deck.order).toEqual([{ slide: 'title' }]);
    });
});

describe('slideKey', () => {
    it('names a project slide by its own id and a deck slide by its kind and ref', () => {
        expect(slideKey({ slide: 'project', ref: 'alpha/data' })).toBe('alpha/data');
        expect(slideKey({ slide: 'framing', ref: 'engine' })).toBe('framing:engine');
        expect(slideKey({ slide: 'title' })).toBe('title');
    });
});

describe('plainTitle', () => {
    it('strips the markup and the escapes a deck title is written with', () => {
        expect(plainTitle('Questions &amp;<br>collaborations welcome')).toBe(
            'Questions & collaborations welcome'
        );
    });

    it('decodes a named, a no-break and a numeric escape, the no-break space folded to a plain one', () => {
        expect(plainTitle('Tom&nbsp;&amp;&nbsp;Jerry&#39;s <em>deck</em>')).toBe(
            "Tom & Jerry's deck"
        );
    });
});

describe('slideSources', () => {
    it('orders the slides active first, then manuscripts, then ideas, each by title', () => {
        expect(slideSources(PROJECTS).map((source) => source.slide.id)).toEqual([
            'alpha',
            'alpha/data',
            'beta'
        ]);
    });
});

describe('deckSlides', () => {
    it('places every project slide the order does not name before the closing slide', () => {
        expect(deckSlides(DECK, PROJECTS).map((row) => row.key)).toEqual([
            'title',
            'framing:engine',
            'summary:one',
            'ideas',
            'alpha',
            'alpha/data',
            'beta',
            'closing'
        ]);
    });

    it('keeps a project slide the order names where the order put it', () => {
        const deck = deckFrom({
            deck: { ...CONFIG.deck, order: [{ slide: 'project', ref: 'beta' }, { slide: 'title' }] }
        });
        expect(deckSlides(deck, PROJECTS).map((row) => row.key)).toEqual([
            'beta',
            'title',
            'alpha',
            'alpha/data',
            'closing'
        ]);
    });

    it('ends with a closing slide even when the order names none', () => {
        const deck = deckFrom({ deck: { order: [{ slide: 'title' }] } });
        expect(deckSlides(deck, []).map((row) => row.key)).toEqual(['title', 'closing']);
    });

    it('holds no slides at all when the config holds no deck', () => {
        expect(deckSlides(deckFrom({}), [])).toEqual([]);
    });

    it('places the project slides alone when the deck places nothing of its own', () => {
        const deck = deckFrom({ deck: { order: [] } });
        expect(deckSlides(deck, PROJECTS).map((row) => row.key)).toEqual([
            'alpha',
            'alpha/data',
            'beta'
        ]);
    });

    it('drops an order entry naming a project slide no project declares', () => {
        const deck = deckFrom({ deck: { order: [{ slide: 'project', ref: 'nowhere' }] } });
        expect(deckSlides(deck, PROJECTS).map((row) => row.key)).not.toContain('nowhere');
    });

    it('gives each row the plain title and the hue of the project it belongs to', () => {
        const rows = deckSlides(DECK, PROJECTS);
        expect(rows.find((row) => row.key === 'title')?.title).toBe(
            'Structured models, everywhere they hide'
        );
        expect(rows.find((row) => row.key === 'framing:engine')?.title).toBe('The engine');
        expect(rows.find((row) => row.key === 'alpha')?.title).toBe('Alpha slide');
        expect(rows.find((row) => row.key === 'alpha')?.tone).toBe('crimson');
        // beta's domain is not one the deck themes, so its row carries no hue at all.
        expect(rows.find((row) => row.key === 'beta')?.tone).toBe(undefined);
    });

    it('leaves an unnamed slide of an archived project off the deck', () => {
        expect(deckSlides(DECK, [...PROJECTS, ARCHIVED]).map((row) => row.key)).not.toContain(
            'delta'
        );
    });

    it('places an archived slide the order names, where the order names it', () => {
        const deck = deckFrom({
            deck: {
                ...CONFIG.deck,
                order: [{ slide: 'title' }, { slide: 'project', ref: 'delta' }]
            }
        });
        expect(deckSlides(deck, [ARCHIVED]).map((row) => row.key)).toEqual([
            'title',
            'delta',
            'closing'
        ]);
    });

    it('places an archived slide a saved selection holds', () => {
        const deck = deckFrom({ deck: { ...CONFIG.deck, selection: ['title', 'delta'] } });
        expect(deckSlides(deck, [...PROJECTS, ARCHIVED]).map((row) => row.key)).toEqual([
            'title',
            'delta'
        ]);
    });

    it('shows only the slides a saved selection names', () => {
        const deck = deckFrom({
            deck: { ...CONFIG.deck, selection: ['title', 'alpha', 'closing'] }
        });
        expect(deckSlides(deck, PROJECTS).map((row) => row.key)).toEqual([
            'title',
            'alpha',
            'closing'
        ]);
    });

    it('places them in the saved order, leaving a key it does not name at the end', () => {
        const deck = deckFrom({
            deck: {
                ...CONFIG.deck,
                selection: ['title', 'alpha', 'closing'],
                slide_order: ['closing', 'alpha', 'gone']
            }
        });
        expect(deckSlides(deck, PROJECTS).map((row) => row.key)).toEqual([
            'closing',
            'alpha',
            'title'
        ]);
    });
});

describe('deckCatalog', () => {
    it('offers every slide the deck places, whatever a saved selection keeps', () => {
        const deck = deckFrom({
            deck: { ...CONFIG.deck, selection: ['title', 'alpha', 'closing'] }
        });
        expect(deckSlides(deck, PROJECTS).map((row) => row.key)).toEqual([
            'title',
            'alpha',
            'closing'
        ]);
        expect(deckCatalog(deck, PROJECTS).map((row) => row.key)).toEqual([
            'title',
            'framing:engine',
            'summary:one',
            'ideas',
            'alpha',
            'alpha/data',
            'beta',
            'closing'
        ]);
    });

    it('offers the catalog in the saved order, so the rows sit where the deck shows them', () => {
        const deck = deckFrom({
            deck: { ...CONFIG.deck, slide_order: ['closing', 'alpha'] }
        });
        const keys = deckCatalog(deck, PROJECTS).map((row) => row.key);
        expect(keys.slice(0, 2)).toEqual(['closing', 'alpha']);
        expect([...keys].sort()).toEqual(deckCatalogKeys(DECK, PROJECTS).sort());
    });

    it('offers an archived slide, which the deck with no selection does not show', () => {
        const all = [...PROJECTS, ARCHIVED];
        expect(deckCatalogKeys(DECK, all)).toContain('delta');
        expect(deckSlides(DECK, all).map((row) => row.key)).not.toContain('delta');
        expect(deckDefaultKeys(DECK, all)).not.toContain('delta');
    });

    it('is ticked by the saved selection when there is one, archived work included', () => {
        const all = [...PROJECTS, ARCHIVED];
        const deck = deckFrom({ deck: { ...CONFIG.deck, selection: ['title', 'delta'] } });
        expect(deckCatalogKeys(deck, all)).toContain('delta');
        expect(deck.selection).toEqual(['title', 'delta']);
        expect(deckSlides(deck, all).map((row) => row.key)).toEqual(['title', 'delta']);
    });

    it('names each row with its words and its kind, as the deck draws them', () => {
        const rows = deckCatalog(DECK, PROJECTS);
        expect(rows.find((row) => row.key === 'title')?.title).toBe(
            'Structured models, everywhere they hide'
        );
        expect(rows.find((row) => row.key === 'alpha')).toMatchObject({
            kind: 'project',
            title: 'Alpha slide'
        });
    });

    it('offers nothing for a deck that places nothing over no projects', () => {
        expect(deckCatalog(deckFrom({}), [])).toEqual([]);
        expect(deckCatalogKeys(deckFrom({}), [])).toEqual([]);
    });
});

describe('parsePresentState', () => {
    it('reads a pane place, with the first slide and a closed grid for what is missing', () => {
        expect(parsePresentState({ slide: 'alpha/data', overview: true })).toEqual({
            slide: 'alpha/data',
            overview: true
        });
        expect(parsePresentState({})).toEqual({ slide: '', overview: false });
        expect(parsePresentState(null)).toEqual({ slide: '', overview: false });
        expect(parsePresentState({ slide: 7, overview: 'yes' })).toEqual({
            slide: '',
            overview: false
        });
    });
});

describe('themeOf and tagToneOf', () => {
    it('themes a project by the first of its domains the deck names', () => {
        expect(themeOf(DECK, PROJECTS[0])).toEqual({ tone: 'crimson', label: 'Cardiology' });
        expect(themeOf(DECK, PROJECTS[1])).toBe(undefined);
    });

    it('gives a slide the hue its tag class names, and none for a class the deck omits', () => {
        expect(tagToneOf(DECK, slide('alpha', { tag: { class: 'measured' } }))).toBe('green');
        expect(tagToneOf(DECK, slide('alpha', { tag: { class: 'other' } }))).toBe(undefined);
        expect(tagToneOf(DECK, slide('alpha'))).toBe(undefined);
    });
});

describe('hasSlideContent', () => {
    it('tells a slide that was written as a slide from one carrying only a narrative', () => {
        expect(hasSlideContent(slide('alpha', { body: 'Only words.' }))).toBe(false);
        expect(hasSlideContent(slide('alpha', { title: 'A headline' }))).toBe(true);
        expect(hasSlideContent(slide('alpha', { method: ['A step.'] }))).toBe(true);
    });
});

describe('the present store', () => {
    let client: ClientState;

    beforeEach(() => {
        client = createClientState();
        client.entities.receive({
            channel: 'config',
            version: 1,
            payload: { config: CONFIG, text: {}, findings: [] }
        });
        client.entities.receive({
            channel: 'portfolio',
            version: 1,
            payload: {
                version: 1,
                entities: { projects: Object.fromEntries(PROJECTS.map((p) => [p.id, p])) },
                relations: {},
                findings: []
            }
        });
    });

    it('reads the empty key and an unknown one as the first slide of the deck', () => {
        expect(client.present.current('')?.key).toBe('title');
        expect(client.present.current('nowhere')?.key).toBe('title');
        expect(client.present.position('')).toBe(1);
        expect(client.present.slides()).toHaveLength(8);
    });

    it('answers the key one slide on and one back, stopping at each end', () => {
        const { next, previous, first, last } = client.present;
        expect(previous('title')).toBe('title');
        expect(next('title')).toBe('framing:engine');
        expect(previous('framing:engine')).toBe('title');
        expect(next('closing')).toBe('closing');
        expect(first()).toBe('title');
        expect(last()).toBe('closing');
    });

    it('counts a position from one, wherever in the deck the slide is', () => {
        expect(client.present.position('alpha')).toBe(5);
        expect(client.present.position('closing')).toBe(8);
    });

    it('holds nothing of its own, so two readers of one key get one answer', () => {
        expect(client.present.current('alpha/data')?.key).toBe('alpha/data');
        expect(client.present.current('title')?.key).toBe('title');
        expect(client.present.current('alpha/data')?.key).toBe('alpha/data');
    });

    it('answers over an empty deck without a slide to name', () => {
        const bare = createClientState();
        expect(bare.present.slides()).toEqual([]);
        expect(bare.present.current('title')).toBeNull();
        expect(bare.present.position('title')).toBe(0);
        expect(bare.present.next('title')).toBe('title');
        expect(bare.present.first()).toBe('');
    });

    it('answers the whole catalog beside the slides the deck shows', () => {
        expect(client.present.catalog().map((row) => row.key)).toEqual(
            client.present.slides().map((row) => row.key)
        );
        const narrowed = createClientState();
        narrowed.entities.receive({
            channel: 'config',
            version: 1,
            payload: {
                config: { deck: { ...CONFIG.deck, selection: ['title', 'alpha'] } },
                text: {},
                findings: []
            }
        });
        narrowed.entities.receive({
            channel: 'portfolio',
            version: 1,
            payload: {
                version: 1,
                entities: { projects: Object.fromEntries(PROJECTS.map((p) => [p.id, p])) },
                relations: {},
                findings: []
            }
        });
        expect(narrowed.present.slides().map((row) => row.key)).toEqual(['title', 'alpha']);
        expect(narrowed.present.catalog()).toHaveLength(8);
    });

    it('answers the project and the slide behind a row, and nothing for a deck-level row', () => {
        expect(client.present.projectOf('alpha/data')?.id).toBe('alpha');
        expect(client.present.slideOf('alpha/data')?.id).toBe('alpha/data');
        expect(client.present.projectOf('framing:engine')).toBeNull();
        expect(client.present.slideOf('framing:engine')).toBeNull();
    });
});
