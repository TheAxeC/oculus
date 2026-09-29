// Layer 4, view test. The card's cross-link tags: one labelled line per kind that has entries, the
// first three of a longer kind with a control for the rest, and the cross-link kinds drawn as the
// buttons that open their view. Pressing the control is a DOM event no case here fires.

import { render } from 'svelte/server';
import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it } from 'vitest';
import CardLinks from '../../../../src/lib/views/shared/card/CardLinks.svelte';
import { SHOWN, linkView, shownTags } from '../../../../src/lib/views/shared/card/card.ts';
import type { BoardItem, BoardTag } from '../../../../src/lib/state/boards/board/index.ts';
import type { Project } from '../../../../src/lib/data/model/index.ts';
import {
    engineDir,
    glyphCatalog,
    loadConfig,
    textCatalog
} from '../../../../src/lib/data/sources/config.ts';
import { setCatalog, setGlyphs } from '../../../../src/lib/state/shared/words/text.ts';
import { clientContext, createClientState, type ClientState } from '../../../fixtures/client.ts';

let client: ClientState;

beforeEach(() => {
    client = createClientState();
});

const config = loadConfig(engineDir()).config;
const catalog = textCatalog(config);
setGlyphs(glyphCatalog(config));
setCatalog(catalog);

const word = (key: string): string => catalog[key];
const openIn = (label: string): string => word('project.card.open_in').replace('{0}', label);
/**
 * The control that offers the rest of a kind, found by its own word (the catalog's `more_tags`
 * with any count), so a check that none is drawn holds whatever primitive or variant draws it and
 * is not tripped by the cross-links, which are buttons too.
 */
const CONTROL = new RegExp(
    `>${word('project.card.more_tags')
        .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        .replace('\\{0\\}', '\\d+')}<`
);
const more = (count: number): string =>
    word('project.card.more_tags').replace('{0}', String(count));

/** The four kind labels, in the order the card draws their lines. */
const LABELS = [
    'board.facet_funding',
    'board.facet_pillar',
    'board.facet_dataset',
    'project.card.collaborators'
].map(word);

/** The fifth line's two labels: the one a paper's card carries and the one a software card does. */
const SOFTWARE = word('project.card.software');
const PAPERS = word('project.card.software_papers');

function project(tier: Project['tier'] = 'active'): Project {
    return {
        id: 'one',
        title: 'One',
        tier,
        ghost: false,
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
        folder: '',
        file: ''
    };
}

/** Tags named by their kind and their position, so a line's own entries are recognisable. */
function tags(kind: string, count: number): BoardTag[] {
    return Array.from({ length: count }, (_ignored, at) => ({
        id: `${kind}-${at}`,
        label: `${kind.toUpperCase()}-${at}`
    }));
}

type Counts = {
    funding: number;
    pillars: number;
    datasets: number;
    collaborators: number;
    /** The software cross-links, which the four-kind cases leave at none. */
    software?: number;
    /** The tier the card's project is on, which decides what the software line is called. */
    tier?: Project['tier'];
};

function item(counts: Counts): BoardItem {
    return {
        id: 'one',
        project: project(counts.tier),
        tone: '',
        domain: null,
        venue: null,
        pillars: tags('pillar', counts.pillars),
        funding: tags('fund', counts.funding),
        datasets: tags('data', counts.datasets),
        collaborators: tags('collab', counts.collaborators),
        software: tags('soft', counts.software ?? 0),
        authors: '',
        bucket: '',
        code: '',
        compute: '',
        reproduced: false,
        year: '',
        sessions: 'none',
        chips: [],
        haystack: ''
    };
}

/** The rendered lines, each as the markup between one line's opening tag and the next. */
function lines(body: string): string[] {
    return body.split('class="taglist').slice(1);
}

/** One line's label, past the scoping class Svelte appends to the class it is written with. */
function kindOf(line: string): string {
    const found = /class="kind[^"]*">([^<]*)</.exec(line);
    return found === null ? '' : found[1];
}

/** Whether one kind's label is drawn as a line's label anywhere in the markup. */
function labelled(body: string, label: string): boolean {
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`class="kind[^"]*">${escaped}</span>`).test(body);
}

const FIVE_FUNDING_TWO_DATASETS = item({
    funding: 5,
    pillars: 0,
    datasets: 2,
    collaborators: 0
});

function draw(props: { item: BoardItem }): string {
    return render(CardLinks, { context: clientContext(client), props }).body;
}

describe('the card tag lines', () => {
    it('draws the four kinds in their order, each labelled, with the long ones cut', () => {
        const drawn = lines(
            draw({ item: item({ funding: 5, pillars: 2, datasets: 4, collaborators: 1 }) })
        );
        expect(drawn.map(kindOf)).toEqual(LABELS);
        const [funding, pillars, datasets, collaborations] = drawn;
        expect(funding.match(/class="tag/g)).toHaveLength(SHOWN);
        expect(funding).toContain(`>${more(2)}<`);
        expect(datasets.match(/class="tag/g)).toHaveLength(SHOWN);
        expect(datasets).toContain(`>${more(1)}<`);
        expect(funding).toMatch(CONTROL);
        expect(pillars.match(/class="tag/g)).toHaveLength(2);
        // this kind is no longer than SHOWN, so there is no control offering the rest
        expect(pillars).not.toMatch(CONTROL);
        expect(collaborations.match(/class="tag/g)).toHaveLength(1);
        // nor this one, which is shorter still
        expect(collaborations).not.toMatch(CONTROL);
    });

    it('draws the cross-link kinds as buttons naming their kind and the rest as plain tags', () => {
        const [funding, pillars, datasets, collaborations] = lines(
            draw({ item: item({ funding: 1, pillars: 1, datasets: 1, collaborators: 1 }) })
        );
        expect(funding).toContain(`class="words" hidden="">${openIn(LABELS[0])}<`);
        expect(funding).toContain('class="crosslink');
        expect(collaborations).toContain(`class="words" hidden="">${openIn(LABELS[3])}<`);
        expect(collaborations).toContain('class="crosslink');
        // a pillar is not a kind that opens a view of its own, so its tags stay plain
        expect(pillars).not.toContain('class="crosslink');
        // nor is a dataset
        expect(datasets).not.toContain('class="crosslink');
    });

    it('draws a labelled line per kind that has entries and none for a kind that has none', () => {
        const body = draw({ item: FIVE_FUNDING_TWO_DATASETS });
        expect(lines(body)).toHaveLength(2);
        expect(labelled(body, LABELS[0])).toBe(true);
        expect(labelled(body, LABELS[2])).toBe(true);
        expect(labelled(body, LABELS[1])).toBe(false);
        expect(labelled(body, LABELS[3])).toBe(false);
    });

    it('cuts a kind longer than SHOWN to that many entries and offers the rest', () => {
        const [funding] = lines(draw({ item: FIVE_FUNDING_TWO_DATASETS }));
        expect(funding.match(/class="tag/g)).toHaveLength(SHOWN);
        expect(funding).toContain('FUND-2');
        // the kind is cut to SHOWN entries, and this one is past that
        expect(funding).not.toContain('FUND-3');
        expect(funding).toContain(`>${more(2)}<`);
    });

    it('draws a kind no longer than SHOWN whole and offers no control', () => {
        const datasets = lines(draw({ item: FIVE_FUNDING_TWO_DATASETS })).at(1) ?? '';
        expect(datasets.match(/class="tag/g)).toHaveLength(2);
        expect(datasets).toContain('DATA-1');
        // the kind is no longer than SHOWN, so it is drawn whole and offers no control
        expect(datasets).not.toMatch(CONTROL);
    });

    // A server render carries no handler, so what pressing a cross-link does is read off the
    // source; the press itself, and the press of the control, are not run here.
    it('opens a cross-link entry by its label in the view of its own kind', () => {
        const source = readFileSync('src/lib/views/shared/card/CardLinks.svelte', 'utf8');
        expect(source).toContain('goto(client, linkView(kind.key), tag.label)');
    });

    it('draws nothing at all for an item with no tag of any kind', () => {
        const bare = item({ funding: 0, pillars: 0, datasets: 0, collaborators: 0 });
        // the item carries no tag of any kind, so the block is not drawn at all
        expect(draw({ item: bare })).not.toContain('class="links');
    });

    it("calls the software line Software on a paper's card and Papers on a software project's", () => {
        const counts = { funding: 0, pillars: 0, datasets: 0, collaborators: 0, software: 2 };
        const paper = draw({ item: item(counts) });
        expect(labelled(paper, SOFTWARE)).toBe(true);
        expect(labelled(paper, PAPERS)).toBe(false);

        const tool = draw({ item: item({ ...counts, tier: 'software' }) });
        expect(labelled(tool, PAPERS)).toBe(true);
        expect(labelled(tool, SOFTWARE)).toBe(false);
    });

    it('draws the software line after the four, as buttons over its entries', () => {
        const drawn = lines(
            draw({
                item: item({
                    funding: 1,
                    pillars: 1,
                    datasets: 1,
                    collaborators: 1,
                    software: 2
                })
            })
        );
        expect(drawn.map(kindOf)).toEqual([...LABELS, SOFTWARE]);
        const software = drawn[4];
        expect(software.match(/class="tag/g)).toHaveLength(2);
        expect(software).toContain('class="crosslink');
        expect(software).toContain(`class="words" hidden="">${openIn(SOFTWARE)}<`);
        expect(software).toContain('SOFT-1');
    });

    // A server render carries no handler, so where a software tag goes is read off the source; the
    // press itself is not run here.
    it("opens a software cross-link as the related project's own tab", () => {
        const source = readFileSync('src/lib/views/shared/card/CardLinks.svelte', 'utf8');
        expect(source).toContain("openView('project', { id: tag.id, label: tag.label })");
    });
});

describe('linkView', () => {
    it('audits that names the view each cross-link kind opens, and nothing for the other two', () => {
        expect(linkView('funding')).toBe('funding');
        expect(linkView('collaborators')).toBe('person');
        expect(linkView('pillars')).toBe('');
        expect(linkView('datasets')).toBe('');
    });
});

describe('shownTags', () => {
    const five = tags('fund', 5);

    it('holds a kind back to SHOWN entries until it is expanded', () => {
        expect(shownTags(five, false)).toEqual(five.slice(0, SHOWN));
        expect(shownTags(five, true)).toEqual(five);
        expect(shownTags(five, true).at(-1)?.label).toBe('FUND-4');
    });

    it('leaves a kind no longer than SHOWN whole either way', () => {
        const two = tags('data', 2);
        expect(shownTags(two, false)).toEqual(two);
        expect(shownTags(two, true)).toEqual(two);
    });
});
