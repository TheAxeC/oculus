// The collections that draw a view of their own, rendered to HTML on the server: the funding view,
// the code view and a joint-work card, each over the same synthetic collection file and snapshot.
// Nothing here needs a DOM.

import { beforeEach, describe, expect, it } from 'vitest';
import {
    receive,
    catalog,
    project,
    snapshot,
    html,
    cards,
    freshClient,
    PROJECTS
} from './collection-fixture.ts';

beforeEach(freshClient);

describe('the funding view', () => {
    let body: string;

    beforeEach(() => {
        body = html('funding');
    });

    it('combines active and manuscript funding users into one work disclosure', () => {
        const snap = snapshot();
        snap.entities.projects = {
            ...snap.entities.projects,
            beta: { ...snap.entities.projects.beta, fundingIds: ['FAIR'] }
        };
        receive({ channel: 'portfolio', version: 1, payload: snap });
        try {
            const mixed = html('funding');
            expect(mixed.match(/data-project-group="work"/g)).toHaveLength(1);
            expect(mixed).toMatch(/data-project-group="work"[\s\S]*?class="count">2<\/strong>/);
            // an active and a manuscript project fold into the one work group, so no manuscript
            // group is drawn
            expect(mixed).not.toContain('data-project-group="manuscript"');
        } finally {
            receive({ channel: 'portfolio', version: 1, payload: snapshot() });
        }
    });

    it('is drawn from the funding collection the snapshot now carries', () => {
        expect(body).toContain('data-collection="funding"');
        expect(cards(body).length).toBeGreaterThan(1);
    });

    it('draws the pinned scheme first, marked as pinned', () => {
        const found = cards(body);
        expect(found[0]).toContain('A funded scheme');
        expect(found[0]).toContain('pinned');
        expect(found[1]).toContain('A later scheme');
    });

    it('draws the statement as a blockquote with the tooltip the catalog names', () => {
        expect(body).toContain('<blockquote');
        expect(body).toContain(catalog['collection.fundstmt_tip']);
        expect(body).toContain('This work was funded by FAIR.');
    });

    it('draws the note as rendered Markdown', () => {
        expect(body).toContain('what it <strong>is</strong>');
    });

    it("groups the projects whose manifest names the scheme's key", () => {
        expect(body).toContain(catalog['collection.related']);
        expect(body).toContain('class="label">active</span>');
        expect(body).toContain('aria-expanded="false"');
        // the related list is closed, so its members are named only once it is expanded
        expect(body).not.toContain('>Alpha</span>');
    });

    it('draws the card of the projects no scheme covers, and its facet toggle', () => {
        expect(body).toContain(catalog['collection.no_funding']);
        expect(body).toContain(catalog['collection.no_funding_sub']);
        expect(body).toContain('>beta</span>');
    });

    it('drops that card when its toggle is switched off', () => {
        const off = html('funding', { hidden: ['no-funding'] });
        // the toggle is off, so the card and its sub-line are not drawn
        expect(off).not.toContain(catalog['collection.no_funding_sub']);
    });
});

describe('the code view', () => {
    let body: string;

    beforeEach(() => {
        body = html('code');
    });

    it('draws the coverage groups over the projects, with a count each', () => {
        expect(body).toContain(catalog['collection.coverage']);
        expect(body).toContain(catalog['collection.coverage_deposited']);
        expect(body).toContain(catalog['collection.coverage_anon']);
        expect(body).toContain(catalog['collection.coverage_none']);
        expect(body).toContain('data-group="deposited"');
    });

    it("draws the repo cards under it, with the projects the entry's related list names", () => {
        const card = cards(body)[0];
        expect(card).toContain('a repo');
        expect(card).toContain('class="label">active</span>');
        expect(card).toContain('aria-expanded="false"');
        // the related list is closed, so its members are named only once it is expanded
        expect(card).not.toContain('>Alpha</span>');
    });

    it('says the tier holds nothing while the portfolio has no software project', () => {
        expect(body).toContain(catalog['collection.software']);
        expect(body).toContain(catalog['collection.software_none']);
        // the portfolio holds no software project, so there is no row to draw
        expect(body).not.toContain('data-software-row=');
    });

    it('draws one row per software project, with its deposit state and the papers it names', () => {
        const withTool = html(
            'code',
            {},
            {
                ...PROJECTS,
                kit: project('kit', {
                    tier: 'software',
                    type: 'software',
                    title: 'A toolkit',
                    codeAvailability: { status: 'deposited' },
                    relatedIds: ['alpha']
                })
            }
        );
        // a software project is there now, so the line saying the tier holds nothing is gone
        expect(withTool).not.toContain(catalog['collection.software_none']);
        expect(withTool).toContain('data-software-row="kit"');
        expect(withTool).toContain('>A toolkit<');
        expect(withTool).toContain(catalog['board.code_deposited']);
        expect(withTool).toContain(catalog['collection.software_papers']);
        expect(withTool).toContain('>Alpha<');
    });
});

describe('a joint-work card', () => {
    it("draws its person as the control that opens them, by the registry's name", () => {
        const body = html('joint-work');
        expect(body).toContain(catalog['collection.open_person']);
        expect(body).toContain('Maarten Naesens');
        // The key itself is not what the card draws; the name the registry holds is.
        expect(body).not.toContain('>naesens<');
    });
});
