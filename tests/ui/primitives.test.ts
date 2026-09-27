// Every primitive rendered to HTML on the server, with props: the roles and the ARIA attributes it
// owes a screen reader, the tone it was given, and what it does with a value or a row it cannot
// draw as it stands.
//
// What this does NOT cover: anything that needs a DOM. There is no browser in this suite, so a sort
// is not clicked, Escape is not pressed and no $effect runs; the sort itself is checked through the
// exported order() and the interactions are checked in a browser. The colours are covered by
// tests/ui/colours.test.ts and tests/checks/look/contrast.test.ts, which read the style rather than
// the markup.

import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import { createRawSnippet } from 'svelte';
import type { Component } from 'svelte';
import Card from '../../src/lib/ui/frame/Card.svelte';
import Chip from '../../src/lib/ui/controls/Chip.svelte';
import Confirm from '../../src/lib/ui/controls/Confirm.svelte';
import Empty from '../../src/lib/ui/frame/Empty.svelte';
import KeySheet from '../../src/lib/ui/menu/KeySheet.svelte';
import { sheetRows } from '../../src/lib/ui/menu/key-rows.ts';
import Menu from '../../src/lib/ui/menu/Menu.svelte';
import Meter from '../../src/lib/ui/display/Meter.svelte';
import Pane from '../../src/lib/ui/frame/Pane.svelte';
import { heldStop, nextStop } from '../../src/lib/ui/tree/roving.ts';
import RowButton from '../../src/lib/ui/controls/RowButton.svelte';
import Search from '../../src/lib/ui/controls/Search.svelte';
import Segment from '../../src/lib/ui/controls/Segment.svelte';
import Tabs from '../../src/lib/ui/tabs/Tabs.svelte';
import Table from '../../src/lib/ui/display/Table.svelte';
import { order, type Column } from '../../src/lib/ui/display/table-rows.ts';
import Ticker from '../../src/lib/ui/display/Ticker.svelte';
import type { TickerRow } from '../../src/lib/ui/display/ticker-rows.ts';
import Toolbar from '../../src/lib/ui/frame/Toolbar.svelte';
import ToolButton from '../../src/lib/ui/controls/ToolButton.svelte';
import Gallery from '../../src/lib/views/system/gallery/Gallery.svelte';
import {
    engineDir,
    glyphCatalog,
    loadConfig,
    textCatalog,
    vocabCatalog
} from '../../src/lib/data/sources/config.ts';
import {
    glyph,
    setCatalog,
    setGlyphMode,
    setGlyphs,
    t
} from '../../src/lib/state/shared/words/text.ts';
import { setVocab } from '../../src/lib/state/shared/words/tones.ts';
import { noop } from '../fixtures/doubles.ts';
import { clientContext, createClientState, type ClientState } from '../fixtures/client.ts';

let client: ClientState;

beforeEach(() => {
    client = createClientState();
});

const { config } = loadConfig(engineDir());
setCatalog(textCatalog(config));
setGlyphs(glyphCatalog(config));
setVocab(vocabCatalog(config));

/**
 * The rendered body of a component, which is what every assertion below reads. The props are typed
 * by the component, so a test that hands a primitive a prop it does not have fails `npm run check`
 * rather than quietly rendering nothing.
 */
function html<Props extends Record<string, unknown>>(
    component: Component<Props>,
    props: Props
): string {
    return render(component, { context: clientContext(client), props }).body;
}

describe('Card', () => {
    it('draws its title at the level it was given', () => {
        expect(html(Card, { id: 'alpha', cursor: false, title: 'Alpha', level: 2 })).toContain(
            '<h2 class="title'
        );
        expect(html(Card, { id: 'alpha', cursor: false, title: 'Alpha' })).toContain(
            '<h3 class="title'
        );
    });

    it('clamps a heading level no document has', () => {
        expect(html(Card, { id: 'alpha', cursor: false, title: 'Alpha', level: 0 })).toContain(
            '<h1 class="title'
        );
        expect(html(Card, { id: 'alpha', cursor: false, title: 'Alpha', level: 9 })).toContain(
            '<h6 class="title'
        );
    });

    it('puts the tone on the card as a token and draws the bar', () => {
        const body = html(Card, { id: 'alpha', cursor: false, title: 'Alpha', tone: 'teal' });
        expect(body).toContain('--tone: var(--c-teal)');
        expect(body).toContain('class="bar');
    });

    it('draws no bar and sets no tone without one', () => {
        const body = html(Card, { id: 'alpha', cursor: false, title: 'Alpha' });
        expect(body).not.toContain('class="bar');
        expect(body).not.toContain('--tone:');
    });

    it('marks a pinned card', () => {
        expect(html(Card, { id: 'alpha', cursor: false, title: 'Alpha', pinned: true })).toContain(
            'pinned'
        );
    });

    it('marks every card for the shell cursor', () => {
        const body = html(Card, { id: 'alpha', cursor: true, title: 'Alpha' });
        expect(body).toContain('data-card="alpha"');
        expect(body).toContain('data-cursor="true"');
    });

    it('renders plain, HTML and clickable HTML title shapes', () => {
        const plain = html(Card, { id: 'plain', cursor: false, title: 'Plain title' });
        const rich = html(Card, {
            id: 'rich',
            cursor: false,
            title: 'Fallback',
            titleHtml: 'Rich <strong>title</strong>'
        });
        const clickable = html(Card, {
            id: 'clickable',
            cursor: false,
            title: 'Fallback',
            titleHtml: 'Open <strong>title</strong>',
            ontitle: noop
        });
        expect(plain).toContain('Plain title');
        expect(plain).not.toContain('class="open ');
        expect(rich).toContain('Rich <strong>title</strong>');
        expect(rich).not.toContain('class="open ');
        expect(clickable).toContain('class="open ');
        expect(clickable).toContain('Open <strong>title</strong>');
    });
});

describe('Chip', () => {
    it('shows its label and its tone', () => {
        const body = html(Chip, { label: 'submitted', tone: 'violet' });
        expect(body).toContain('submitted');
        expect(body).toContain('toned');
        expect(body).toContain('--tone: var(--c-violet)');
        expect(body).toContain('--tone-txt: var(--c-violet-txt)');
        expect(body).toContain('--on-tone: var(--on-c-violet)');
    });

    it('is muted and untoned without a tone', () => {
        const body = html(Chip, { label: 'submitted' });
        expect(body).not.toContain('toned');
        expect(body).not.toContain('--tone');
    });

    it('marks the filled form', () => {
        expect(html(Chip, { label: 'a', tone: 'teal', filled: true })).toContain('filled');
    });

    // revert: src/lib/ui/controls/Chip.svelte "<span class=\"chip\" class:toned={tone !== undefined} class:filled class:bracketed {style}>" +2 => delete
    it('draws a glyph by name', () => {
        const body = html(Chip, { label: 'a', glyph: 'pin' });
        expect(body).toContain('class="glyph');
        expect(body).not.toContain(glyphCatalog(config).pin);
    });

    it('draws no glyph when none is named', () => {
        expect(html(Chip, { label: 'a' })).not.toContain('class="glyph');
    });

    it('draws no glyph for the empty name an unlisted status chip carries', () => {
        expect(html(Chip, { label: 'a', glyph: '' })).not.toContain('class="glyph');
    });

    // The cut itself is a layout effect no server render measures; what is read here is the rule
    // that makes a long value end in an ellipsis inside the chip rather than at the card's edge.
    it('cuts a long label at its own edge', () => {
        const source = readFileSync('src/lib/ui/controls/Chip.svelte', 'utf8');
        const label = source.slice(source.indexOf('.chip .label {'));
        const rule = label.slice(0, label.indexOf('}'));
        expect(rule).toContain('overflow: hidden');
        expect(rule).toContain('text-overflow: ellipsis');
        expect(source).toContain('max-width: 100%');
    });

    // revert: src/lib/state/shared/words/text.ts "return drawn.startsWith('[') && drawn.endsWith(']');" => return false;
    it('marks a chip whose stand-in already reads as a bracketed tag, so it draws no second pair', () => {
        setGlyphMode('ascii');
        try {
            expect(glyph('code').startsWith('[')).toBe(true);
            expect(html(Chip, { label: 'a', glyph: 'code' })).toContain('bracketed');
            expect(glyph('live').startsWith('[')).toBe(false);
            expect(html(Chip, { label: 'a', glyph: 'live' })).not.toContain('bracketed');
        } finally {
            setGlyphMode('icon');
        }
    });

    it('leaves the mark off under a theme that draws the glyph itself', () => {
        expect(html(Chip, { label: 'a', glyph: 'code' })).not.toContain('bracketed');
        expect(html(Chip, { label: 'a' })).not.toContain('bracketed');
    });

    it('is a mark and not a control when it is given no press', () => {
        const body = html(Chip, { label: 'a', tone: 'teal' });
        expect(body).toContain('<span class="chip');
        expect(body).not.toContain('<button');
        expect(body).not.toContain('aria-pressed');
    });

    it('is a button reporting its own state when it is given a press', () => {
        const on = html(Chip, { label: 'a', tone: 'teal', onclick: noop, pressed: true });
        expect(on).toContain('<button type="button"');
        expect(on).toContain('aria-pressed="true"');
        const off = html(Chip, { label: 'a', tone: 'teal', onclick: noop, pressed: false });
        expect(off).toContain('aria-pressed="false"');
    });

    it('wears the same tone in both forms, so a pressed chip is the chip beside it', () => {
        const mark = html(Chip, { label: 'a', tone: 'teal', filled: true });
        const control = html(Chip, {
            label: 'a',
            tone: 'teal',
            filled: true,
            onclick: noop,
            pressed: true
        });
        for (const written of ['toned', 'filled', '--tone: var(--c-teal)']) {
            expect(mark, written).toContain(written);
            expect(control, written).toContain(written);
        }
        expect(control).toContain('pressable');
    });
});

describe('Meter', () => {
    it('is a meter with its name and its bounds', () => {
        const body = html(Meter, { value: 0.5, label: 'Half' });
        expect(body).toContain('role="meter"');
        expect(body).toContain('aria-label="Half"');
        expect(body).toContain('aria-valuenow="0.5"');
        expect(body).toContain('aria-valuemin="0"');
        expect(body).toContain('aria-valuemax="1"');
    });

    it('clamps a value outside its bounds and a value that is not one', () => {
        expect(html(Meter, { value: 4, label: 'x' })).toContain('aria-valuenow="1"');
        expect(html(Meter, { value: -2, label: 'x' })).toContain('aria-valuenow="0"');
        expect(html(Meter, { value: Number.NaN, label: 'x' })).toContain('aria-valuenow="0"');
    });

    it('fills in its tone, and in the accent colour without one', () => {
        expect(html(Meter, { value: 1, label: 'x', tone: 'green' })).toContain(
            '--tone: var(--c-green)'
        );
        expect(html(Meter, { value: 1, label: 'x' })).toContain('--tone: var(--accent)');
    });

    it('shows the text beside the bar only when it was given one', () => {
        expect(html(Meter, { value: 1, label: 'x', text: '12' })).toContain('>12<');
        expect(html(Meter, { value: 1, label: 'x' })).not.toContain('class="text"');
    });
});

describe('Table', () => {
    const columns: Column[] = [
        { key: 'name', label: 'Name' },
        { key: 'count', label: 'Count', numeric: true, width: '5rem' }
    ];
    const rows = [
        { name: 'beta', count: 9 },
        { name: 'alpha', count: 10 }
    ];

    it('draws one row per input row and one cell per column', () => {
        const body = html(Table, { columns, rows, rowKey: 'name' });
        expect([...body.matchAll(/<tr/g)]).toHaveLength(3);
        expect([...body.matchAll(/<td/g)]).toHaveLength(4);
    });

    it('draws an empty cell for a value that is no scalar, rather than its stringification', () => {
        const held = [
            { name: 'alpha', count: { high: 1 } },
            { name: 'beta', count: [1, 2] }
        ];
        const body = html(Table, { columns: columns, rows: held, rowKey: 'name' });
        expect(body).toContain('alpha');
        expect(body).toContain('beta');
        expect(body).not.toContain('object Object');
        expect(body).not.toContain('1,2');
        // The cell is drawn and holds no text: what is between its tags is svelte's own markers.
        expect([...body.matchAll(/<td[^>]*>(?:<!--[^>]*-->)*<\/td>/g)]).toHaveLength(2);
    });

    it('marks the numeric column in the head and in every cell', () => {
        const body = html(Table, { columns, rows, rowKey: 'name' });
        expect([...body.matchAll(/class="[^"]*numeric/g)]).toHaveLength(3);
    });

    it('gives a column its width', () => {
        expect(html(Table, { columns, rows, rowKey: 'name' })).toContain('width: 5rem');
    });

    it('says how each column is sorted only when it can be', () => {
        const plain = html(Table, { columns, rows, rowKey: 'name' });
        expect(plain).not.toContain('<button');
        expect([...plain.matchAll(/aria-sort="none"/g)]).toHaveLength(2);
        const sortable = html(Table, { columns, rows, rowKey: 'name', sortable: true });
        expect([...sortable.matchAll(/<button/g)]).toHaveLength(2);
    });

    it('sorts numbers by value and everything else by locale, and turns round', () => {
        expect(order(rows, { key: 'name', direction: 'asc' }).map((row) => row.name)).toEqual([
            'alpha',
            'beta'
        ]);
        expect(order(rows, { key: 'name', direction: 'desc' }).map((row) => row.name)).toEqual([
            'beta',
            'alpha'
        ]);
        expect(order(rows, { key: 'count', direction: 'asc' }).map((row) => row.count)).toEqual([
            9, 10
        ]);
    });

    it('leaves the rows alone when nothing sorts them, and never mutates them', () => {
        const given = [...rows];
        expect(order(given, null)).toBe(given);
        order(given, { key: 'name', direction: 'asc' });
        expect(given.map((row) => row.name)).toEqual(['beta', 'alpha']);
    });

    it('sorts a row missing the value last, whichever way the column is turned', () => {
        const gappy = [{ name: 'a' }, { name: 'b', count: 1 }];
        expect(order(gappy, { key: 'count', direction: 'asc' }).map((row) => row.name)).toEqual([
            'b',
            'a'
        ]);
        expect(order(gappy, { key: 'count', direction: 'desc' }).map((row) => row.name)).toEqual([
            'b',
            'a'
        ]);
    });
});

describe('Pane, Empty, Toolbar, ToolButton, Segment and Search', () => {
    it('gives a pane its title', () => {
        expect(html(Pane, { title: 'Gallery' })).toContain('Gallery');
    });

    it('marks the view body as the keyboard scroll region', () => {
        expect(html(Pane, { title: 'Gallery' })).toMatch(/<div class="body[^"']*" data-scroll/);
    });

    it('shows an empty state its message and its glyph', () => {
        const body = html(Empty, { message: 'Nothing here.', glyph: 'circle_empty' });
        expect(body).toContain('Nothing here.');
        expect(body).toContain('class="glyph');
    });

    it('is a toolbar with a name', () => {
        const body = html(Toolbar, { label: 'Controls' });
        expect(body).toContain('role="toolbar"');
        expect(body).toContain('aria-label="Controls"');
    });

    it('draws a tool button, its tooltip and the one in force', () => {
        const body = html(ToolButton, {
            label: 'Reset',
            title: 'Put it back',
            active: true,
            onclick: noop
        });
        expect(body).toContain('Reset');
        // The words are the tooltip's, not the browser's `title`, which waits about a second and
        // never appears for a control reached by keyboard.
        expect(body).not.toContain('title="Put it back"');
        expect(body).toContain('role="tooltip"');
        expect(body).toContain('Put it back');
        expect(body).toContain('active');
        expect(body).not.toContain('role="radio"');
    });

    it('draws the rail variant as the shared rail box and keeps toggle state', () => {
        const body = html(ToolButton, {
            label: 'Overlay',
            glyph: 'darkmode',
            compact: true,
            rail: true,
            pressed: true,
            onclick: noop
        });
        expect(body).toContain('rail-control');
        expect(body).toContain('aria-pressed="true"');
        expect(body).toContain('Overlay');
    });

    // revert: src/lib/ui/controls/ToolButton.svelte "const named = $derived(iconOnly || cell || children !== undefined);" => const named = $derived(iconOnly || children !== undefined);
    // revert: src/lib/ui/controls/ToolButton.svelte "{...attributes}" => delete
    it('draws a cell button with its children, its label as its name and its data attributes', () => {
        const words = createRawSnippet(() => ({ render: () => '<span>12</span>' }));
        const body = html(ToolButton, {
            label: 'Choose line 12',
            cell: true,
            pressed: false,
            data: { choose: 4 },
            children: words,
            onclick: noop
        });
        expect(body).toMatch(/class="tool[^"]*\bcell\b/);
        expect(body).toContain('aria-label="Choose line 12"');
        expect(body).toContain('data-choose="4"');
        expect(body).toContain('<span>12</span>');
        const mark = html(ToolButton, {
            label: 'Modified lines',
            cell: true,
            data: { mark: 'modified', 'mark-line': 3 },
            onclick: noop
        });
        expect(mark).toContain('aria-label="Modified lines"');
        expect(mark).toContain('data-mark="modified"');
        expect(mark).toContain('data-mark-line="3"');
        // A mark alone draws no words: its name is its label, and the cell around it its colour.
        expect(mark).not.toContain('Modified lines</span>');
    });

    it('draws no tooltip for a tool button that was given no words', () => {
        const body = html(ToolButton, { label: 'Reset', onclick: noop });
        expect(body).not.toContain('role="tooltip"');
        expect(body).not.toContain('aria-describedby');
    });

    it('is a radio only inside an exclusive group', () => {
        const body = html(ToolButton, { label: 'a', checked: false, onclick: noop });
        expect(body).toContain('role="radio"');
        expect(body).toContain('aria-checked="false"');
    });

    it('is a radiogroup with one checked button', () => {
        const items = [
            { id: 'one', label: 'One' },
            { id: 'two', label: 'Two' }
        ];
        const body = html(Segment, { items, value: 'two', label: 'Shape', onchange: noop });
        expect(body).toContain('role="radiogroup"');
        expect([...body.matchAll(/aria-checked="true"/g)]).toHaveLength(1);
        expect([...body.matchAll(/aria-checked="false"/g)]).toHaveLength(1);
    });

    it('is a search box named by its placeholder', () => {
        const body = html(Search, { value: 'bt', placeholder: 'Filter', oninput: noop });
        expect(body).toContain('type="search"');
        expect(body).toContain('data-search');
        expect(body).toContain('aria-label="Filter"');
        expect(body).toContain('value="bt"');
    });
});

describe('KeySheet', () => {
    it('splits catalog rows on the row and column separators', () => {
        expect(sheetRows('1-9 | switch tab;;g g | top | smooth')).toEqual([
            { key: '1-9', meaning: 'switch tab' },
            { key: 'g g', meaning: 'top' }
        ]);
    });

    it('draws its heading, hint, and one row per shortcut', () => {
        const body = html(KeySheet, {
            title: 'Keyboard',
            hint: 'Press ? to close',
            rows: '1-9 | switch tab;;g g | top',
            onclose: () => undefined
        });
        expect(body).toContain('role="dialog"');
        expect(body).toContain('Keyboard');
        expect(body).toContain('Press ? to close');
        expect([...body.matchAll(/<kbd\b/g)]).toHaveLength(2);
        expect(body).toContain('1-9');
        expect(body).toContain('switch tab');
    });
});

describe('Ticker', () => {
    const rows = [
        {
            id: 'one',
            glyph: 'paper',
            label: 'A paper',
            tail: 'in 3d',
            tone: 'amber',
            actions: [
                { id: 'snooze:7', label: '1w', title: 'snooze 1w' },
                { id: 'hide', label: 'hide' }
            ]
        },
        { id: 'two', glyph: 'coin', label: 'A grant', plain: true }
    ];

    it('draws a row with its glyph, its name and its dated tail', () => {
        const body = html(Ticker, { rows });
        expect(body).toContain('A paper');
        expect(body).toContain('in 3d');
    });

    // Revert: in Ticker.svelte, draw a row's buttons whether or not the caller said what one means.
    // revert: src/lib/ui/display/Ticker.svelte "{#if onaction !== undefined && row.actions !== undefined}" => {#if row.actions !== undefined}
    it('draws a row action as a button only when the caller says what one means', () => {
        expect(html(Ticker, { rows })).not.toContain('1w');
        const body = html(Ticker, { rows, onaction: noop });
        expect(body).toContain('>1w<');
        expect(body).toContain('title="snooze 1w"');
        expect(body).toContain('>hide<');
    });

    // Revert: in Ticker.svelte, mark no button as the one the row keeps.
    // revert: src/lib/ui/display/Ticker.svelte "class:kept={action.id === keep}" => class:kept={false}
    it('lists the buttons in the order the row gives them, marking the one it keeps', () => {
        const body = html(Ticker, {
            rows,
            onaction: noop,
            reveal: true,
            kept: (row: TickerRow) => (row.id === 'one' ? 'snooze:7' : undefined)
        });
        // The row lists its snooze first and its hide second. That is the order the markup carries,
        // and with it the order the keyboard walks and a screen reader reads: the button the row
        // keeps is marked where it stands rather than moved.
        const drawn = [
            ...body.matchAll(/<button type="button" class="act([^"]*)"[^>]*>\s*([^\s<]+)/g)
        ].map((one) => [one[2], one[1].includes('kept')]);
        expect(drawn).toEqual([
            ['1w', true],
            ['hide', false]
        ]);
        expect(body).toContain('title="snooze 1w"');
    });

    it('leaves a plain row as text in a list that can otherwise be picked', () => {
        const body = html(Ticker, { rows, onpick: noop });
        expect(body).toContain('<button type="button" class="name');
        const grant = body.slice(body.indexOf('A grant') - 200, body.indexOf('A grant'));
        expect(grant).toContain('class="name plain');
    });
});

describe('the gallery', () => {
    let body: string;

    beforeEach(() => {
        body = html(Gallery, { instance: { id: 'g1', view: 'gallery', state: {} } });
    });

    it('renders every primitive it is made of', () => {
        expect(body).toContain('role="toolbar"');
        expect(body).toContain('role="radiogroup"');
        expect(body).toContain('role="meter"');
        expect(body).toContain('type="search"');
        expect(body).toContain('aria-sort');
        expect(body).toContain('class="bar');
        expect(body).toContain('class="empty');
    });

    it('shows chips in at least six tones from the config', () => {
        const tones = new Set(
            [...body.matchAll(/--tone: var\(--c-([a-z-]+)\)/g)].map((match) => match[1])
        );
        expect(tones.size).toBeGreaterThanOrEqual(6);
    });

    it('shows both the outline and the filled chip form', () => {
        const chips = [...body.matchAll(/class="chip[^"]*"/g)].map((match) => match[0]);
        expect(chips.filter((one) => one.includes('filled')).length).toBeGreaterThan(0);
        expect(chips.filter((one) => !one.includes('filled')).length).toBeGreaterThan(0);
    });

    it('fills its table from the chip vocabulary', () => {
        expect([...body.matchAll(/<tbody/g)]).toHaveLength(1);
        expect([...body.matchAll(/<tr/g)].length).toBeGreaterThan(4);
    });
});

describe('RowButton', () => {
    const lines = createRawSnippet(() => ({ render: () => '<span>two lines</span>' }));

    // revert: src/lib/ui/controls/RowButton.svelte "<button type=\"button\" class=\"row-button\" class:selected {title} {onclick} {ondblclick}>" => <button class="row-button" class:selected {title} {onclick} {ondblclick}>
    it('is a button that submits nothing, holding the lines the caller draws', () => {
        const body = html(RowButton, {
            title: 'Select',
            onclick: () => undefined,
            children: lines
        });
        expect(body).toMatch(/<button type="button" class="row-button[^"]*" title="Select"/);
        expect(body).toContain('<span>two lines</span>');
    });

    // revert: src/lib/ui/controls/RowButton.svelte "<button type=\"button\" class=\"row-button\" class:selected {title} {onclick} {ondblclick}>" => <button type="button" class="row-button" {title} {onclick} {ondblclick}>
    it('draws the selected row in the ink of the selection tint', () => {
        const on = html(RowButton, { selected: true, onclick: () => undefined, children: lines });
        expect(on).toMatch(/class="row-button[^"]* selected/);
    });
});

describe('Confirm', () => {
    const props = {
        message: 'Throw the change away?',
        detail: 'There is no undo.',
        confirm: 'Confirm',
        cancel: 'Cancel',
        onconfirm: () => undefined,
        oncancel: () => undefined
    };

    it('draws its message, its detail and both controls', () => {
        const body = html(Confirm, props);
        expect(body).toContain('Throw the change away?');
        expect(body).toContain('There is no undo.');
        expect(body).toContain('>Confirm<');
        expect(body).toContain('>Cancel<');
    });

    it('reports itself as a modal dialog named by its message', () => {
        const body = html(Confirm, props);
        expect(body).toContain('role="alertdialog"');
        expect(body).toContain('aria-modal="true"');
        expect(body).toContain('aria-label="Throw the change away?"');
    });

    it('leaves the detail line out when there is none', () => {
        const body = html(Confirm, { ...props, detail: '' });
        expect(body).not.toContain('There is no undo.');
        expect(body).toContain('Throw the change away?');
    });
});

describe('one strip, one stop of the focus order', () => {
    it('steps along the row and wraps at both ends', () => {
        expect(nextStop('ArrowRight', 0, 3, 'row')).toBe(1);
        expect(nextStop('ArrowRight', 2, 3, 'row')).toBe(0);
        expect(nextStop('ArrowLeft', 0, 3, 'row')).toBe(2);
        expect(nextStop('ArrowLeft', 1, 3, 'row')).toBe(0);
    });

    it('answers the column keys for a strip drawn downward and not the row keys', () => {
        expect(nextStop('ArrowDown', 0, 3, 'column')).toBe(1);
        expect(nextStop('ArrowUp', 0, 3, 'column')).toBe(2);
        expect(nextStop('ArrowRight', 0, 3, 'column')).toBe(null);
        expect(nextStop('ArrowDown', 0, 3, 'row')).toBe(null);
    });

    it('lands on the ends for Home and End, and on the first from nowhere', () => {
        expect(nextStop('Home', 2, 3, 'row')).toBe(0);
        expect(nextStop('End', 0, 3, 'row')).toBe(2);
        expect(nextStop('ArrowLeft', -1, 3, 'row')).toBe(0);
        expect(nextStop('ArrowRight', 9, 3, 'row')).toBe(0);
    });

    it('answers nothing for a key the strip does not own, or for an empty strip', () => {
        expect(nextStop('a', 0, 3, 'row')).toBe(null);
        expect(nextStop('Tab', 0, 3, 'row')).toBe(null);
        expect(nextStop('ArrowRight', 0, 0, 'row')).toBe(null);
        expect(nextStop('Home', 0, 0, 'row')).toBe(null);
    });

    it('holds the stop where the ring changed under it, and gives it up with the ring', () => {
        expect(heldStop(['a', 'b', 'c'], ['a', 'b', 'c'], 'b')).toBe('b');
        // The control after the one that went now sits where it sat.
        expect(heldStop(['a', 'b', 'c'], ['a', 'c'], 'b')).toBe('c');
        // The last one hands the stop back rather than forward.
        expect(heldStop(['a', 'b', 'c'], ['a', 'b'], 'c')).toBe('b');
        expect(heldStop(['a', 'b', 'c'], ['b'], 'c')).toBe('b');
        expect(heldStop(['a', 'b', 'c'], [], 'b')).toBe('');
        expect(heldStop(['a', 'b'], ['a', 'b'], 'zz')).toBe('a');
    });

    it('gives the whole tab strip one stop, the scroll controls and close controls included', () => {
        const body = html(Tabs, {
            tabs: [
                { id: 'one', label: 'One' },
                { id: 'two', label: 'Two' },
                { id: 'three', label: 'Three' }
            ],
            active: 'two',
            onselect: noop,
            onclose: noop
        });
        // Every control the strip draws: three tab faces, three close controls, two scroll
        // controls.
        const controls = [...body.matchAll(/<button[^>]*/g)].map((found) => found[0]);
        expect(controls).toHaveLength(8);
        const stops = controls.filter((control) => control.includes('tabindex="0"'));
        expect(stops).toHaveLength(1);
        expect(stops[0]).toContain('role="tab"');
        expect(stops[0]).toContain('aria-selected="true"');
        expect(controls.filter((control) => control.includes('tabindex="-1"'))).toHaveLength(7);
        // Nothing in the strip is left without a place in the order.
        expect(controls.filter((control) => !/tabindex="(0|-1)"/.test(control))).toEqual([]);
    });
});

// What a node render can show of the tab look: the classes a tab carries for being the one shown
// and for holding unsaved text, the dot drawn only for the latter, and a preview's mark. The
// pointer's hover, and what each class paints, are tests/browser/workbench/tabs.spec.ts.
describe('the marks a tab carries', () => {
    function strip(): string {
        return html(Tabs, {
            tabs: [
                { id: 'shown', label: 'Shown', glyph: 'refresh' },
                { id: 'other', label: 'Other' },
                { id: 'held', label: 'Held', dirty: true },
                { id: 'kept', label: 'Kept', preview: true }
            ],
            active: 'shown',
            onselect: noop,
            onclose: noop
        });
    }

    /** The tab wrapper of one tab by its label, from its opening tag to the next tab's. */
    function tabOf(body: string, label: string): string {
        const parts = body.split(/(?=<div class="tab[ "])/);
        const found = parts.find((part) => part.includes(`>${label}</span>`));
        expect(found).toBeDefined();
        return found ?? '';
    }

    function classOf(tab: string): string {
        return /^<div class="([^"]*)"/.exec(tab)?.[1].replace(/\s*svelte-\S+/g, '') ?? '';
    }

    // Revert: drop `class:current` from ui/tabs/TabFace.svelte, and the shown tab loses its mark.
    // revert: src/lib/ui/tabs/TabFace.svelte "class:current" => class:current={false}
    it('marks the shown tab current and no other', () => {
        const body = strip();
        expect(classOf(tabOf(body, 'Shown'))).toBe('tab current');
        expect(classOf(tabOf(body, 'Other'))).toBe('tab');
    });

    // Revert: drop `class:dirty` or the dot's block from ui/tabs/TabFace.svelte.
    // revert: src/lib/ui/tabs/TabFace.svelte "class:dirty={tab.dirty === true}" => class:dirty={false}
    it('marks a tab holding unsaved text and draws its dot, and draws no dot on a clean tab', () => {
        const body = strip();
        const held = tabOf(body, 'Held');
        expect(classOf(held)).toBe('tab dirty');
        expect(held).toContain('class="dot');
        expect(held).toContain('class="cross');
        for (const label of ['Shown', 'Other', 'Kept']) {
            expect(tabOf(body, label)).not.toContain('class="dot');
            expect(tabOf(body, label)).toContain('class="cross');
        }
    });

    // Revert: drop the `aria-label` of the tab face in ui/tabs/TabFace.svelte.
    // revert: src/lib/ui/tabs/TabFace.svelte "aria-label={tab.dirty === true ? t('ui.tab_unsaved', tab.label) : undefined}" => aria-label={undefined}
    it('names a tab holding unsaved text with the catalog word, and leaves a clean tab its label', () => {
        const body = strip();
        const face = (label: string): string =>
            /<button[^>]*role="tab"[^>]*>/.exec(tabOf(body, label))?.[0] ?? '';
        expect(face('Held')).toContain(`aria-label="${t('ui.tab_unsaved', 'Held')}"`);
        for (const label of ['Shown', 'Other', 'Kept']) {
            expect(face(label)).toContain('role="tab"');
            expect(face(label)).not.toContain('aria-label=');
        }
    });

    // Revert: drop `class:unfocused` from the strip in ui/tabs/Tabs.svelte.
    it('marks the strip unfocused only when asked', () => {
        // revert: src/lib/ui/tabs/Tabs.svelte "class:unfocused={!focused}" => class:unfocused={focused}
        const classes = (body: string): string =>
            /<div class="(strip[^"]*)"/.exec(body)?.[1].replace(/\s*svelte-\S+/g, '') ?? '';
        expect(classes(strip())).toBe('strip');
        const asked = html(Tabs, {
            tabs: [{ id: 'one', label: 'One' }],
            active: 'one',
            onselect: noop,
            onclose: noop,
            focused: false
        });
        expect(classes(asked)).toBe('strip unfocused');
    });

    // Revert: drop `class:bare` from ui/controls/ToolButton.svelte or from the opener of
    // ui/menu/Menu.svelte.
    it('draws a bare tool button and a bare menu opener only when asked', () => {
        const tool = (bare: boolean): string =>
            html(ToolButton, {
                label: 'Split',
                glyph: 'refresh',
                compact: true,
                bare,
                onclick: noop
            });
        expect(tool(true)).toMatch(/class="tool[^"]*\bbare\b/);
        expect(tool(false)).not.toMatch(/class="tool[^"]*\bbare\b/);
        const opener = (bare: boolean): string =>
            html(Menu, {
                label: 'More',
                glyph: 'refresh',
                compact: true,
                bare,
                items: [],
                onpick: noop
            });
        expect(opener(true)).toMatch(/class="opener[^"]*\bbare\b/);
        expect(opener(false)).not.toMatch(/class="opener[^"]*\bbare\b/);
    });

    // Revert: drop the Glyph before the label in ui/tabs/TabFace.svelte.
    // revert: src/lib/ui/tabs/TabFace.svelte "<Glyph name={tab.glyph} />" => delete
    it('draws the glyph before the label, and the preview mark on the preview tab alone', () => {
        const body = strip();
        const shown = tabOf(body, 'Shown');
        expect(shown.indexOf('class="glyph')).toBeGreaterThan(-1);
        expect(shown.indexOf('class="glyph')).toBeLessThan(shown.indexOf('>Shown</span>'));
        expect(tabOf(body, 'Kept')).toContain('data-tab-preview');
        expect(tabOf(body, 'Other')).not.toContain('data-tab-preview');
    });
});
