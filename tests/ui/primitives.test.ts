// Every primitive rendered to HTML on the server, with props: the roles and the ARIA attributes it
// owes a screen reader, the tone it was given, and what it does with a value or a row it cannot draw
// as it stands.
//
// What this does NOT cover: anything that needs a DOM. There is no browser in this suite, so a sort
// is not clicked, Escape is not pressed and no $effect runs; the sort itself is checked through the
// exported order() and the interactions are checked in a browser. The colours are covered by
// tests/ui/colours.test.ts and tests/contrast.test.ts, which read the style rather than the markup.

import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import type { Component } from 'svelte';
import Card from '../../src/lib/ui/Card.svelte';
import Chip from '../../src/lib/ui/Chip.svelte';
import Empty from '../../src/lib/ui/Empty.svelte';
import Meter from '../../src/lib/ui/Meter.svelte';
import Pane from '../../src/lib/ui/Pane.svelte';
import Search from '../../src/lib/ui/Search.svelte';
import Segment from '../../src/lib/ui/Segment.svelte';
import Table, { order, type Column } from '../../src/lib/ui/Table.svelte';
import Toolbar from '../../src/lib/ui/Toolbar.svelte';
import ToolButton from '../../src/lib/ui/ToolButton.svelte';
import Gallery from '../../src/lib/views/Gallery.svelte';
import {
    engineDir,
    glyphCatalog,
    loadConfig,
    textCatalog,
    vocabCatalog
} from '../../src/lib/data/sources/config.ts';
import { setCatalog, setGlyphs } from '../../src/lib/state/text.ts';
import { setVocab } from '../../src/lib/state/tones.ts';

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
    return render(component, { props }).body;
}

describe('Card', () => {
    it('draws its title at the level it was given', () => {
        expect(html(Card, { title: 'Alpha', level: 2 })).toContain('<h2 class="title');
        expect(html(Card, { title: 'Alpha' })).toContain('<h3 class="title');
    });

    it('clamps a heading level no document has', () => {
        expect(html(Card, { title: 'Alpha', level: 0 })).toContain('<h1 class="title');
        expect(html(Card, { title: 'Alpha', level: 9 })).toContain('<h6 class="title');
    });

    it('puts the tone on the card as a token and draws the bar', () => {
        const body = html(Card, { title: 'Alpha', tone: 'teal' });
        expect(body).toContain('--tone: var(--c-teal)');
        expect(body).toContain('class="bar');
    });

    it('draws no bar and sets no tone without one', () => {
        const body = html(Card, { title: 'Alpha' });
        expect(body).not.toContain('class="bar');
        expect(body).not.toContain('--tone:');
    });

    it('marks a pinned card', () => {
        expect(html(Card, { title: 'Alpha', pinned: true })).toContain('pinned');
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

    it('draws a glyph by name and an icon character from the config', () => {
        expect(html(Chip, { label: 'a', glyph: 'pin' })).toContain('class="glyph');
        const body = html(Chip, { label: 'a', icon: 'S' });
        expect(body).toContain('class="icon" aria-hidden="true">S<');
    });

    it('draws nothing for an icon the legend did not give it', () => {
        expect(html(Chip, { label: 'a', icon: '' })).not.toContain('class="icon"');
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
            onclick: () => {}
        });
        expect(body).toContain('Reset');
        expect(body).toContain('title="Put it back"');
        expect(body).toContain('active');
        expect(body).not.toContain('role="radio"');
    });

    it('is a radio only inside an exclusive group', () => {
        const body = html(ToolButton, { label: 'a', checked: false, onclick: () => {} });
        expect(body).toContain('role="radio"');
        expect(body).toContain('aria-checked="false"');
    });

    it('is a radiogroup with one checked button', () => {
        const items = [
            { id: 'one', label: 'One' },
            { id: 'two', label: 'Two' }
        ];
        const body = html(Segment, { items, value: 'two', label: 'Shape', onchange: () => {} });
        expect(body).toContain('role="radiogroup"');
        expect([...body.matchAll(/aria-checked="true"/g)]).toHaveLength(1);
        expect([...body.matchAll(/aria-checked="false"/g)]).toHaveLength(1);
    });

    it('is a search box named by its placeholder', () => {
        const body = html(Search, { value: 'bt', placeholder: 'Filter', oninput: () => {} });
        expect(body).toContain('type="search"');
        expect(body).toContain('aria-label="Filter"');
        expect(body).toContain('value="bt"');
    });
});

describe('the gallery', () => {
    const body = html(Gallery, { instance: { id: 'g1', view: 'gallery', state: {} } });

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
