// Every primitive rendered to HTML on the server, with props: the roles and the ARIA attributes it
// owes a screen reader, the tone it was given, and what it does with a value or a row it cannot draw
// as it stands.
//
// What this does NOT cover: anything that needs a DOM. There is no browser in this suite, so a sort
// is not clicked, Escape is not pressed and no $effect runs; the sort itself is checked through the
// exported order() and the interactions are checked in a browser. The colours are covered by
// tests/ui/colours.test.ts and tests/contrast.test.ts, which read the style rather than the markup.

import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import { createRawSnippet } from 'svelte';
import type { Component } from 'svelte';
import Card from '../../src/lib/ui/Card.svelte';
import Chip from '../../src/lib/ui/Chip.svelte';
import Confirm from '../../src/lib/ui/Confirm.svelte';
import Empty from '../../src/lib/ui/Empty.svelte';
import KeySheet from '../../src/lib/ui/KeySheet.svelte';
import { sheetRows } from '../../src/lib/ui/key-rows.ts';
import Meter from '../../src/lib/ui/Meter.svelte';
import { menuPlacement } from '../../src/lib/ui/menu-items.ts';
import Pane from '../../src/lib/ui/Pane.svelte';
import { heldStop, nextStop } from '../../src/lib/ui/roving.ts';
import Search from '../../src/lib/ui/Search.svelte';
import Segment from '../../src/lib/ui/Segment.svelte';
import Tabs from '../../src/lib/ui/Tabs.svelte';
import Table from '../../src/lib/ui/Table.svelte';
import { order, type Column } from '../../src/lib/ui/table-rows.ts';
import Ticker from '../../src/lib/ui/Ticker.svelte';
import Toolbar from '../../src/lib/ui/Toolbar.svelte';
import ToolButton from '../../src/lib/ui/ToolButton.svelte';
import Tooltip from '../../src/lib/ui/Tooltip.svelte';
import { describedBy, describedControl } from '../../src/lib/ui/tooltip-target.ts';
import Gallery from '../../src/lib/views/Gallery.svelte';
import {
    asciiCatalog,
    engineDir,
    glyphCatalog,
    loadConfig,
    textCatalog,
    vocabCatalog
} from '../../src/lib/data/sources/config.ts';
import { glyph, setAscii, setCatalog, setGlyphMode, setGlyphs } from '../../src/lib/state/text.ts';
import { setVocab } from '../../src/lib/state/tones.ts';
import { noop } from '../doubles.ts';
import { clientContext, createClientState, type ClientState } from '../client.ts';

let client: ClientState;

beforeEach(() => {
    client = createClientState();
});

const { config } = loadConfig(engineDir());
setCatalog(textCatalog(config));
setGlyphs(glyphCatalog(config));
setAscii(asciiCatalog(config));
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

describe('Menu placement', () => {
    it('anchors beside the containing rail and falls back to the button', () => {
        const button = { right: 44, top: 100, height: 20, bottom: 120 };
        const rail = { right: 52, top: 0, height: 800, bottom: 800 };
        expect(menuPlacement(button, rail, 800)).toBe('left: 56px; top: 100px; max-height: 692px;');
        expect(menuPlacement(button, null, 800)).toBe('left: 48px; top: 100px; max-height: 692px;');
    });

    it('anchors a button in the lower half by its bottom edge', () => {
        const button = { right: 44, top: 600, height: 20, bottom: 620 };
        const rail = { right: 52, top: 0, height: 800, bottom: 800 };
        expect(menuPlacement(button, rail, 800)).toBe(
            'left: 56px; bottom: 180px; max-height: 612px;'
        );
    });
});

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

    it('draws a glyph by name', () => {
        const body = html(Chip, { label: 'a', glyph: 'pin' });
        expect(body).toContain('class="glyph');
        expect(body).toContain(glyphCatalog(config).pin);
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
        const source = readFileSync('src/lib/ui/Chip.svelte', 'utf8');
        const label = source.slice(source.indexOf('.chip .label {'));
        const rule = label.slice(0, label.indexOf('}'));
        expect(rule).toContain('overflow: hidden');
        expect(rule).toContain('text-overflow: ellipsis');
        expect(source).toContain('max-width: 100%');
    });

    it('marks a chip whose stand-in already reads as a bracketed tag, so it draws no second pair', () => {
        setGlyphMode('ascii');
        try {
            expect(glyph('code').startsWith('[')).toBe(true);
            expect(html(Chip, { label: 'a', glyph: 'code' })).toContain('bracketed');
            expect(glyph('live').startsWith('[')).toBe(false);
            expect(html(Chip, { label: 'a', glyph: 'live' })).not.toContain('bracketed');
        } finally {
            setGlyphMode('unicode');
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

    it('draws a row action as a button only when the caller says what one means', () => {
        expect(html(Ticker, { rows })).not.toContain('1w');
        const body = html(Ticker, { rows, onaction: noop });
        expect(body).toContain('>1w<');
        expect(body).toContain('title="snooze 1w"');
        expect(body).toContain('>hide<');
    });

    it('leaves a plain row as text in a list that can otherwise be picked', () => {
        const body = html(Ticker, { rows, onpick: noop });
        expect(body).toContain('<button type="button" class="name');
        const grant = body.slice(body.indexOf('A grant') - 200, body.indexOf('A grant'));
        expect(grant).toContain('class="name plain');
    });
});

describe('Tooltip', () => {
    /** The control a tooltip wraps. Every use of it wraps exactly one. */
    const control = createRawSnippet(() => ({ render: () => '<button type="button">Go</button>' }));

    /** A wrapper round one button, which is every way it is used. */
    function tip(props: Record<string, unknown>): string {
        return render(Tooltip, {
            context: clientContext(client),
            props: { text: 'Put it back', children: control, ...props }
        }).body;
    }

    /** An element as the description code uses it: what it holds, and the attributes it was given. */
    function element(child: Element | null = null): {
        attributes: Record<string, string>;
        querySelector: (selectors: string) => Element | null;
        setAttribute: (name: string, value: string) => void;
        removeAttribute: (name: string) => void;
    } {
        const attributes: Record<string, string> = {};
        return {
            attributes,
            querySelector: () => child,
            setAttribute: (name, value) => {
                attributes[name] = value;
            },
            removeAttribute: (name) => {
                // eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- a Map here would change the shape every reader of this record depends on
                delete attributes[name];
            }
        };
    }

    it('draws its bubble hidden, with no description on the wrapper itself', () => {
        const body = tip({});
        const bubble = /id="(tip-\d+)"/.exec(body);
        expect(bubble).not.toBe(null);
        // The description is put on the control on mount, so the markup carries none of its own.
        expect(body).not.toContain('aria-describedby');
        expect(body).toContain('role="tooltip"');
        expect(body).toContain('hidden');
        expect(body).toContain('Put it back');
    });

    it('describes the control the wrapper holds, and not the wrapper', () => {
        const button = element();
        const box = element(button as unknown as Element);
        expect(describedControl(box, false)).toBe(button);
        expect(describedControl(box, true)).toBe(button);
    });

    it('describes nothing where the words repeat the control name or there are none', () => {
        expect(describedBy('tip-1', 'Put it back', false)).toBe('tip-1');
        expect(describedBy('tip-1', '', false)).toBe('');
        expect(describedBy('tip-1', 'Put it back', true)).toBe('');
    });

    it('describes a focusable wrapper itself when it holds no control', () => {
        const box = element();
        expect(describedControl(box, true)).toBe(box);
        expect(describedControl(box, false)).toBe(null);
    });

    it('describes nothing when it was given no words', () => {
        const body = tip({ text: '' });
        expect(body).not.toContain('aria-describedby');
        expect(body).not.toContain('role="tooltip"');
        expect(body).toContain('<button');
    });

    it('is presentational where the control it wraps is owned by its parent', () => {
        const body = tip({ presentational: true });
        expect(body).toContain('role="presentation"');
        expect(body).not.toContain('aria-describedby');
        expect(body).toContain('role="tooltip"');
    });

    it('puts only a focusable wrapper in the tab order', () => {
        expect(tip({ focusable: true })).toContain('tabindex="0"');
        expect(tip({})).not.toContain('tabindex=');
    });

    // There is no DOM in this suite, so the listener is read off the source rather than fired: an
    // overlay taking focus while the pointer rests on a control is a browser-suite check.
    it('puts an open bubble away when focus lands outside its own wrapper', () => {
        const source = readFileSync('src/lib/ui/Tooltip.svelte', 'utf8');
        expect(source).toContain("document.addEventListener('focusin', elsewhere)");
        expect(source).toContain("document.removeEventListener('focusin', elsewhere)");
        expect(source).toContain('if (target instanceof Node && box.contains(target)) return;');
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
        // Every control the strip draws: three tab faces, three close controls, two scroll controls.
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
