// One collection file as its own tab, rendered to HTML on the server: the cards in file order, what
// a card draws for each kind of field, the search box, the status facet, and the empty state.
//
// The catalog, glyphs and tone vocabulary are the real config. The collection is synthetic: what is
// checked is the view over a file's own schema, not the hub's seven files.
//
// What this does NOT cover: anything needing a DOM. No menu opens and no key is typed here; the
// state a click would write is written through setInstanceState instead, and the pure rules behind
// it are tests/state/boards/collection.test.ts.

import { beforeEach, describe, expect, it } from 'vitest';
import { statusTone } from '../../../../src/lib/state/shared/words/tones.ts';
import {
    receive,
    catalog,
    entry,
    PLAIN_ENTRIES,
    snapshot,
    html,
    cards,
    freshClient,
    FUNDING_ENTRIES
} from './collection-fixture.ts';

beforeEach(freshClient);

describe('a collection as its own tab', () => {
    let body: string;
    beforeEach(() => {
        body = html();
    });

    it("draws the pane with the file's own title and its intro as rendered Markdown", () => {
        expect(body).toMatch(/class="intro(?:\s|")/);
        expect(body).toContain('Talks and Events');
        expect(body).toContain('one <strong>calendar</strong> of appearances');
    });

    it('draws one card per entry, in file order', () => {
        const found = cards(body);
        expect(found.length).toBe(3);
        expect(found[0]).toContain('A talk');
        expect(found[1]).toContain('A visit');
        expect(found[2]).toContain('A pitch');
    });

    it('offers the search box and the add control the catalog names', () => {
        expect(body).toContain('Search Talks and Events ...');
        expect(body).toContain(catalog['collection.add']);
    });

    it('says which collection it is drawing', () => {
        expect(body).toContain('data-collection="events"');
    });

    it('closes the toolbar, after the add control, with the control over its own file', () => {
        expect(body).toContain('data-source-root="hub"');
        expect(body).toContain('data-source-path="network/events.yml"');
        expect(body).toContain(catalog['views.open_source']);
        expect(body).toContain(
            catalog['views.open_source_tip'].replace('{0}', 'network/events.yml')
        );
        expect(body.indexOf('data-source-path')).toBeGreaterThan(
            body.indexOf(catalog['collection.add'])
        );
    });
});

describe('a card', () => {
    let card: string;
    beforeEach(() => {
        card = cards(html())[0];
    });

    it('draws the status as a chip in the tone of the status palette', () => {
        expect(card).toContain(`--tone: var(--c-${statusTone('upcoming')})`);
        expect(card).toContain('>upcoming</span>');
    });

    it('draws a metalist as one wrapping line per label-value pair', () => {
        expect(card).toContain('>When: 16 Feb 2027</span>');
        expect(card).toContain('>Where: Enschede</span>');
    });

    it('draws every tag as its own chip', () => {
        expect(card).toContain('>core-ml</span>');
        expect(card).toContain('>conference</span>');
    });

    it('draws a local HTML link as a control that opens it as a document tab', () => {
        expect(card).toContain('network/a-talk/slides.html');
        // an HTML file opens as a document tab of its own, so the card names the path and carries
        // no file link
        expect(card).not.toContain('href="/api/file/hub/network/a-talk/slides.html"');
    });

    // Revert: in isDocument of views/boards/collection/EntryCard.svelte, drop the isHubPath test
    // and put back the `!link.startsWith('/')` one.
    it('draws an HTML link written as a web address as a link that leaves the page', () => {
        const snap = snapshot();
        snap.version = 9;
        snap.entities.collections.events.entries = [
            entry(0, 'A page', { link: 'www.example.org/index.html' })
        ];
        receive({ channel: 'portfolio', version: 9, payload: snap });
        const [page] = cards(html());
        expect(page).toContain('href="https://www.example.org/index.html"');
        // a web page is opened as one, so no address is served through the hub's own file route
        expect(page).not.toContain('href="/api/file/hub/www.example.org/index.html"');
        expect(page).toContain('target="_blank"');
    });

    it('draws a hub link the list lets open as the ui/controls/ToolButton that opens it in its program', () => {
        const snap = snapshot();
        snap.version = 7;
        snap.entities.collections.events.entries = [
            entry(0, 'A budget', { link: 'network/a-talk/budget.xlsx' }),
            entry(1, 'A report', { link: 'network/a-talk/report.docx' }),
            entry(2, 'Some notes', { link: 'network/a-talk/notes.md' }),
            entry(3, 'A paper', { link: 'network/a-talk/paper.pdf' }),
            entry(4, 'A script', { link: 'network/a-talk/run.py' }),
            entry(5, 'A picture', { link: 'network/a-talk/plot.png' }),
            entry(6, 'An address', { link: 'https://example.org/report.docx' }),
            entry(7, 'An installer', { link: 'network/a-talk/setup.dmg' })
        ];
        receive({ channel: 'portfolio', version: 7, payload: snap });
        const [budget, report, notes, paper, script, picture, address, installer] = cards(html());

        for (const card of [budget, report]) {
            expect(card).toContain('<button type="button" class="tool');
            expect(card).toContain(catalog['file.open_program']);
            // a .docx and a .xlsx open in their own program, so neither card offers a link to fetch
            // the bytes
            expect(card).not.toContain('href="/api/file/hub/');
        }
        const kept: [string, string][] = [
            [notes, 'href="/api/file/hub/network/a-talk/notes.md"'],
            [paper, 'href="/api/file/hub/network/a-talk/paper.pdf"'],
            [script, 'href="/api/file/hub/network/a-talk/run.py"'],
            [picture, 'href="/api/file/hub/network/a-talk/plot.png"'],
            [address, 'href="https://example.org/report.docx"'],
            [installer, 'href="/api/file/hub/network/a-talk/setup.dmg"']
        ];
        for (const [card, href] of kept) {
            expect(card).toContain(href);
            // each of these is read in a tab, so none of them is offered the open-in-program
            // control
            expect(card).not.toContain(catalog['file.open_program']);
        }
    });

    // Revert: in hubPathsOf of state/boards/collection.ts, take every `link` value, or drop the
    // `shows` from the actions of views/boards/collection/EntryCard.svelte.
    it('offers Show in Files on a card whose link is a hub path, and not on one whose link is an address', () => {
        const snap = snapshot();
        snap.version = 8;
        snap.entities.collections.funding.entries = [
            {
                ...FUNDING_ENTRIES[0],
                fields: { ...FUNDING_ENTRIES[0].fields, link: 'https://example.org/call' }
            },
            {
                ...FUNDING_ENTRIES[1],
                fields: { ...FUNDING_ENTRIES[1].fields, link: 'funding/2026-veni' }
            }
        ];
        receive({ channel: 'portfolio', version: 8, payload: snap });
        const drawnCards = cards(html('funding'));
        const address = drawnCards.find((one) => one.includes('data-card="A later scheme"')) ?? '';
        const path = drawnCards.find((one) => one.includes('data-card="A funded scheme"')) ?? '';
        expect(address).not.toBe('');
        // this entry's link is a web address, which no folder holds, so there is nothing to show in
        // the file browser
        expect(address).not.toContain('data-action="files:');
        // and the control that would open that folder is not offered on it either
        expect(address).not.toContain(catalog['collection.show_in_files']);
        expect(path).toContain('data-action="files:funding/2026-veni"');
        expect(path).toContain(`aria-label="${catalog['collection.show_in_files']}"`);
        expect(path).toContain(
            catalog['collection.show_in_files_tip'].replace('{0}', 'funding/2026-veni')
        );
    });

    // Revert: in views/boards/collection/EntryCard.svelte, return the status buttons without the
    // `shows`.
    it('offers Show in Files on a card of a file with no schema too', () => {
        const snap = snapshot();
        snap.version = 9;
        snap.entities.collections.tasks.entries = PLAIN_ENTRIES.map((one) => ({
            ...one,
            fields: { ...one.fields, folder: 'tasks/one' }
        }));
        receive({ channel: 'portfolio', version: 9, payload: snap });
        const found = cards(html('tasks'));
        expect(found.length).toBeGreaterThan(0);
        for (const card of found) expect(card).toContain('data-action="files:tasks/one"');
    });

    it("draws every other link as an anchor into the hub, in a tab of the browser's own", () => {
        const body = html('funding');
        expect(body).toContain('href="https://example.org/call"');
        expect(body).toContain('target="_blank"');
    });

    it("draws the fields in the order the file's schema lists them", () => {
        // The status is drawn once, as the chip in the meta row over the fields, so it is not in
        // this list: what it checks is the order of the fields the card's body draws.
        const order = ['the subtitle', '2027-02-16', 'When: 16 Feb 2027', 'core-ml'];
        const places = order.map((words) => card.indexOf(words));
        expect(places.filter((at) => at < 0)).toEqual([]);
        expect([...places].sort((a, b) => a - b)).toEqual(places);
    });

    it('skips a field the schema names and the entry does not carry', () => {
        // the schema names a field this entry carries nothing for, and an empty field draws no row
        expect(card).not.toContain('deadline');
        expect(cards(html())[2]).toContain('2030-01-01');
    });
});

describe('a field the schema does not name', () => {
    let card: string;

    beforeEach(() => {
        card = cards(html())[1];
    });

    it('is drawn after every field the schema does name', () => {
        expect(card).toContain('>role</span>');
        expect(card.indexOf('>role</span>')).toBeGreaterThan(card.indexOf('>completed</span>'));
    });
});

describe('the status facet', () => {
    it('draws one toggle per status, with its count, all of them on', () => {
        const body = html();
        expect(body).toContain(catalog['collection.status_facet']);
        expect(body).toContain('upcoming 2');
        expect(body).toContain('completed 1');
        expect(body).toContain(`--accent: var(--c-${statusTone('upcoming')})`);
        expect(body).toContain(`--accent: var(--c-${statusTone('completed')})`);
    });

    it("hides a status's cards when its toggle is switched off", () => {
        const found = cards(html('events', { hidden: ['upcoming'] }));
        expect(found.length).toBe(1);
        expect(found[0]).toContain('A visit');
    });

    it('shows only the entries whose status is selected', () => {
        const found = cards(html('events', { statuses: ['completed'] }));
        expect(found.length).toBe(1);
        expect(found[0]).toContain('A visit');
    });

    it('shows the empty state when a search matches nothing', () => {
        const body = html('events', { search: 'nothing-matches-this' });
        expect(cards(body).length).toBe(0);
        expect(body).toContain(catalog['collection.empty']);
    });

    it('searches every field, not only the title', () => {
        expect(cards(html('events', { search: 'Enschede' })).length).toBe(1);
    });
});

describe('a collection the snapshot does not carry', () => {
    let body: string;

    beforeEach(() => {
        body = html('statements');
    });

    it('says there is nothing rather than drawing a card', () => {
        expect(cards(body).length).toBe(0);
        expect(body).toContain(catalog['collection.empty']);
    });

    it('falls back to the name the view is registered under', () => {
        expect(body).toContain(catalog['views.statements']);
    });

    it('offers no control over a file it has not read', () => {
        // no file has been read, so there is no path for the source control to name
        expect(body).not.toContain('data-source-path');
    });
});

describe('a palette reveal', () => {
    it('keeps the target id in instance state and marks the matching card for the mount effect', () => {
        const body = html('events', { reveal: 'A visit' });
        expect(body).toContain('data-reveal="A visit"');
        expect(body).toContain('data-reveal="A talk"');
    });
});

describe('the controls a card carries', () => {
    let card: string;

    beforeEach(() => {
        card = cards(html())[0];
    });

    it('carries the grip, the pin and the edit control the catalog names', () => {
        expect(card).toContain(catalog['collection.reorder_hint']);
        expect(card).toContain(catalog['collection.pin_to_top']);
        expect(card).toContain(catalog['collection.edit_delete']);
    });

    it('draws no subtasks block for an entry with none, and offers adding the first as a control', () => {
        // the entry carries no subtasks, so neither the block nor its heading is drawn
        expect(card).not.toContain('class="subtasks');
        // with no block drawn there is no subtasks heading to name it
        expect(card).not.toContain(catalog['project.action.subtasks']);
        const actions = card.slice(card.indexOf('data-card-actions'), card.indexOf('class="entry'));
        expect(actions).toContain(`aria-label="${catalog['project.action.add_subtask']}"`);
    });

    it('draws the subtasks block for an entry that has subtasks, and no first-subtask control', () => {
        const funded = cards(html('funding'))[0];
        expect(funded).toContain('A funded scheme');
        expect(funded).toContain(catalog['project.action.subtasks']);
        expect(funded).toContain('paste the statement');
        const actions = funded.slice(
            funded.indexOf('data-card-actions'),
            funded.indexOf('class="entry')
        );
        // the add-first control is for an entry with no subtasks, and this one already has them
        expect(actions).not.toContain(catalog['project.action.add_subtask']);
    });

    it('cuts a long body to its clamp until the instance holds the entry open', () => {
        const cut = cards(html('funding'))[0];
        expect(cut).toContain('data-clamp="cut"');
        const open = cards(html('funding', { more: ['FAIR'] }))[0];
        expect(open).toContain('data-clamp="open"');
        // the instance holds this entry open, so the body is drawn whole rather than cut
        expect(open).not.toContain('data-clamp="cut"');
        // Another entry the instance does not hold open stays cut.
        expect(cards(html('funding', { more: ['later'] }))[0]).not.toContain('data-clamp="open"');
    });
});

describe('a collection whose file has no schema', () => {
    let body: string;

    beforeEach(() => {
        body = html('tasks');
    });

    it('offers no add control, since there is no schema to draw a form from', () => {
        // with no schema there is no form to add an entry with, so the control is not offered
        expect(body).not.toContain(catalog['collection.add']);
    });

    it("draws the file's other statuses as buttons, the current one left out", () => {
        const card = cards(body)[0];
        expect(card).toContain('>doing</span>');
        // the edit control opens a form built from the schema, and this file has none
        expect(card).not.toContain(catalog['collection.edit_delete']);
        expect(cards(body)[1]).toContain('>todo</span>');
    });
});
