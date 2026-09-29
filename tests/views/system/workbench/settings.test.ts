// Layer 4, view test. The Settings view drawn: the appearance controls with their names, what each
// text step can do, the wallpaper toggle only under a theme that has one, and the rail list as rows
// the reader edits, one row per button of the file or of the list being typed, each field with its
// word before it and the row's icon drawn in its icon field alone, with the sentence under the
// heading, the rule's sentence for a row it refuses and Save waiting for it.
//
// What this does NOT cover: a control pressed, and the write it sends, which is
// tests/routes/edit/rail.test.ts's; the icon field's open list, which
// tests/ui/forms/glyph-select.test.ts draws.

import { render } from 'svelte/server';
import { beforeEach, describe, expect, it } from 'vitest';
import Settings from '../../../../src/lib/views/system/workbench/Settings.svelte';
import { configRail, withRailDraft } from '../../../../src/lib/state/workbench/navigation/rail.ts';
import { clientContext, type ClientState } from '../../../fixtures/client.ts';
import { setAppearance } from '../../../../src/lib/state/shared/words/appearance.ts';
import { catalog, config, configured, words } from './workbench-fixture.ts';

let client: ClientState;

beforeEach(() => {
    client = configured();
});

const instance = { id: 'settings-one', view: 'settings', state: {} };

function draw(): string {
    return render(Settings, { context: clientContext(client), props: { instance } }).body;
}

/** The opening tag of the button carrying these words as its accessible name or label. */
function buttonNamed(body: string, words: string): string {
    return (
        [...body.matchAll(/<button\b[^>]*>[\s\S]*?<\/button>/g)]
            .map(([one]) => one)
            .find((one) => one.includes(`aria-label="${words}"`) || one.includes(`>${words}<`)) ??
        ''
    );
}

/** The markup of one rail row: from its opening to the next row, or to what follows the list. */
function rowOf(body: string, at: number): string {
    const from = body.indexOf(`data-rail-row="${at}"`);
    if (from < 0) return '';
    const ends = [`data-rail-row="${at + 1}"`, 'class="problems"', 'class="actions"']
        .map((end) => body.indexOf(end, from))
        .filter((end) => end >= 0);
    return body.slice(from, Math.min(...ends));
}

/**
 * The icon field's trigger in a row's markup: the button whose aria-labelledby names first the
 * element holding the field's label.
 */
function iconTrigger(row: string, place: number): string {
    const label = new RegExp(
        `<span id="([^"]+)"[^>]*>${words('workbench.rail_glyph', place)}</span>`
    ).exec(row);
    if (label === null) return '';
    return (
        [...row.matchAll(/<button\b[^>]*>[\s\S]*?<\/button>/g)]
            .map(([one]) => one)
            .find((one) => one.includes(`aria-labelledby="${label[1]} `)) ?? ''
    );
}

/** A trigger's accessible name: the words of each element its aria-labelledby names, in order. */
function nameOf(trigger: string): string {
    const ids = /aria-labelledby="([^"]+)"/.exec(trigger)?.[1].split(' ') ?? [];
    return ids
        .map((id) => new RegExp(`<span id="${id}"[^>]*>([^<]*)</span>`).exec(trigger)?.[1] ?? '')
        .join(' ');
}

/** The glyph names drawn in a piece of markup, in order. */
function glyphsIn(markup: string): string[] {
    return [...markup.matchAll(/data-glyph="([^"]*)"/g)].map(([, name]) => name);
}

/** The sentence a refused row is named by, with its place put in. */
function why(key: string, place: number): string {
    return words(key, place);
}

describe('the appearance half', () => {
    it('draws the theme menu, the text steps and the three toggles by their names', () => {
        const body = draw();
        for (const key of ['ui.theme', 'app.text_smaller', 'app.text_larger', 'ui.crt_on']) {
            expect(buttonNamed(body, catalog[key])).not.toBe('');
        }
        expect(buttonNamed(body, catalog['ui.icons'])).toContain('aria-pressed="false"');
    });

    it('draws the theme in force with its glyph beside plain words', () => {
        const body = draw();
        const from = body.indexOf('data-theme-name');
        const shown = body.slice(from, body.indexOf('</span>', body.indexOf('light', from)) + 7);
        expect(shown).toContain('data-glyph="theme_base"');
        expect(shown.indexOf('data-glyph="theme_base"')).toBeLessThan(shown.indexOf('light'));
        expect(shown).not.toMatch(/[^\t\n\r\x20-\x7E]/);
    });

    it('draws a theme whose glyph the vocabulary lacks with its words alone, and does not throw', () => {
        setAppearance({
            ...config,
            themes: [{ name: 'light', class: '', glyph: 'nonesuch', label: 'light' }]
        });
        try {
            const body = draw();
            const from = body.indexOf('data-theme-name');
            const shown = body.slice(from, body.indexOf('</span>', from));
            expect(shown).toContain('light');
            // a glyph the vocabulary lacks is no Glyph at all, so the words stand alone
            expect(shown).not.toContain('data-glyph');
        } finally {
            setAppearance(config);
        }
    });

    it('offers the reset only once the text size was changed, and no step past its end', () => {
        expect(buttonNamed(draw(), catalog['app.text_reset'])).toMatch(/\sdisabled/);
        client.ui.setTextScale(1.6);
        const grown = draw();
        expect(buttonNamed(grown, catalog['app.text_reset'])).not.toMatch(/\sdisabled/);
        expect(buttonNamed(grown, catalog['app.text_larger'])).toMatch(/\sdisabled/);
    });

    it('offers the wallpaper toggle under a theme that has one and not under another', () => {
        client.ui.setTheme('light');
        expect(buttonNamed(draw(), catalog['ui.wallpaper'])).toBe('');
        client.ui.setTheme('mocha');
        expect(buttonNamed(draw(), catalog['ui.wallpaper'])).not.toBe('');
    });
});

describe('the rail half', () => {
    it('draws one row per button of the file, holding its label', () => {
        const body = draw();
        expect([...body.matchAll(/data-rail-row="/g)]).toHaveLength(12);
        expect(body).toContain('value="Views and Settings"');
    });

    it('draws the list being typed rather than the file, and Save offered for it', () => {
        client.ui.setInstanceState(
            instance.id,
            withRailDraft({}, [{ label: 'Only', glyph: 'compass', page: 'focus' }])
        );
        const body = draw();
        expect([...body.matchAll(/data-rail-row="/g)]).toHaveLength(1);
        expect(body).toContain('value="Only"');
        expect(buttonNamed(body, catalog['workbench.rail_save'])).not.toMatch(/\sdisabled/);
    });

    it('names a row the rule refuses and holds Save back for it', () => {
        client.ui.setInstanceState(
            instance.id,
            withRailDraft({}, [
                { label: 'One', glyph: 'compass', page: 'focus' },
                { label: 'Two', glyph: 'compass', page: 'focus' },
                { label: '', glyph: 'compass', page: 'views' }
            ])
        );
        const body = draw();
        expect(body).toContain(why('workbench.rail_why_repeated', 2));
        expect(body).toContain(why('workbench.rail_why_label', 3));
        expect(buttonNamed(body, catalog['workbench.rail_save'])).toMatch(/\sdisabled/);
    });

    it('holds Save and Revert back while nothing is being typed', () => {
        const body = draw();
        expect(buttonNamed(body, catalog['workbench.rail_save'])).toMatch(/\sdisabled/);
        expect(buttonNamed(body, catalog['workbench.rail_revert'])).toMatch(/\sdisabled/);
    });

    it('draws a row "Add a button" appended, with no icon in its field and the line naming its label', () => {
        const saved = configRail(config);
        client.ui.setInstanceState(
            instance.id,
            withRailDraft({}, [...saved, { label: '', glyph: '', page: '' }])
        );
        const body = draw();
        expect([...body.matchAll(/data-rail-row="/g)]).toHaveLength(saved.length + 1);
        const field = iconTrigger(rowOf(body, saved.length), saved.length + 1);
        expect(field).toContain(catalog['workbench.rail_glyph_empty']);
        // a new row names no glyph, so its field draws the caret and no icon
        expect(glyphsIn(field)).toEqual(['disclosure']);
        expect(body).toContain(why('workbench.rail_why_label', saved.length + 1));
        expect(buttonNamed(body, catalog['workbench.rail_save'])).toMatch(/\sdisabled/);
    });

    it('draws a row whose glyph the vocabulary lacks by its name with no icon, and names it', () => {
        client.ui.setInstanceState(
            instance.id,
            withRailDraft({}, [{ label: 'Odd', glyph: 'nonesuch', page: 'focus' }])
        );
        const body = draw();
        expect([...body.matchAll(/data-rail-row="/g)]).toHaveLength(1);
        expect(body).toContain('value="Odd"');
        const field = iconTrigger(rowOf(body, 0), 1);
        expect(field).toContain('>nonesuch<');
        // nonesuch is a name the vocabulary lacks, so its field draws the caret and no icon
        expect(glyphsIn(field)).toEqual(['disclosure']);
        expect(body).toContain(why('workbench.rail_why_glyph_unknown', 1));
    });

    it('names each control of a row by the place of its button', () => {
        const body = draw();
        expect(buttonNamed(body, why('workbench.rail_remove', 11))).not.toBe('');
        expect(buttonNamed(body, why('workbench.rail_up', 1))).toMatch(/\sdisabled/);
    });
});

describe('the rail rows name their fields and draw the icon in its field', () => {
    beforeEach(() => {
        client.ui.setInstanceState(
            instance.id,
            withRailDraft({}, [
                { label: 'One', glyph: 'compass', page: 'focus' },
                { label: 'Two', glyph: 'sliders', page: 'views' },
                { label: 'Three', glyph: '', page: 'focus' }
            ])
        );
    });

    // Red when a word goes, moves after its field, leaves the row, or is read out beside the
    // field's own name.
    it('draws Label, Icon and Page before their fields in every row', () => {
        const body = draw();
        for (const at of [0, 1, 2]) {
            const row = rowOf(body, at);
            const order = [
                row.indexOf('aria-hidden="true">Label<'),
                row.indexOf(`aria-label="${words('workbench.rail_label', at + 1)}"`),
                row.indexOf('aria-hidden="true">Icon<'),
                row.indexOf(`>${words('workbench.rail_glyph', at + 1)}</span>`),
                row.indexOf('aria-hidden="true">Page<'),
                row.indexOf(`aria-label="${words('workbench.rail_page', at + 1)}"`)
            ];
            expect(order.every((place) => place >= 0)).toBe(true);
            expect([...order].sort((a, b) => a - b)).toEqual(order);
        }
        const second = rowOf(body, 1);
        expect(second).toContain('aria-label="Label of button 2"');
        expect(nameOf(iconTrigger(second, 2))).toMatch(/^Icon of button 2 /);
        expect(second).toContain('aria-label="Page of button 2"');
    });

    // Red when the sentence goes or is drawn anywhere but under the heading.
    it('draws the sentence under the heading', () => {
        const body = draw();
        const heading = body.indexOf(`>${catalog['workbench.rail_title']}</h3>`);
        const sentence = body.indexOf(
            '>Each row is a button on the rail: its words, its icon, and the page it shows.<'
        );
        expect(heading).toBeGreaterThanOrEqual(0);
        expect(sentence).toBeGreaterThan(heading);
        expect(sentence).toBeLessThan(body.indexOf('data-rail-row="0"'));
    });

    // Red when the trigger stops drawing the chosen icon before its name, or draws one for none.
    it('draws the chosen icon and name in the trigger, and the empty words with no icon', () => {
        const body = draw();
        const chosen = iconTrigger(rowOf(body, 1), 2);
        expect(chosen).toContain('data-glyph="sliders"');
        expect(chosen).toContain('>sliders<');
        const none = iconTrigger(rowOf(body, 2), 3);
        expect(none).toContain('Choose an icon');
        // a row naming no glyph has no icon to draw, so its field draws the caret alone
        expect(glyphsIn(none)).toEqual(['disclosure']);
    });

    // Red when the trigger is named by its label alone, as aria-label names a button, so a screen
    // reader never hears the chosen name.
    it('names the trigger by the field label and the chosen name', () => {
        const body = draw();
        expect(nameOf(iconTrigger(rowOf(body, 1), 2))).toBe('Icon of button 2 sliders');
        expect(nameOf(iconTrigger(rowOf(body, 2), 3))).toBe('Icon of button 3 Choose an icon');
    });

    // Red when the row draws its glyph a second time outside the icon field.
    it('draws the row glyph only inside its icon field', () => {
        const body = draw();
        const row = rowOf(body, 0);
        const trigger = iconTrigger(row, 1);
        // the separate mark is gone, so the icon field is the one place the row's glyph shows
        expect(row).not.toContain('class="mark');
        expect(row.split('data-glyph="compass"')).toHaveLength(2);
        expect(trigger).toContain('data-glyph="compass"');
    });

    // Red when the refusal lines go back to the word glyph.
    it('names a row with no icon and a row with an unknown one in the word icon', () => {
        client.ui.setInstanceState(
            instance.id,
            withRailDraft({}, [{ label: 'None', glyph: '', page: 'focus' }])
        );
        expect(draw()).toContain('button 1 names no icon');
        client.ui.setInstanceState(
            instance.id,
            withRailDraft({}, [{ label: 'Odd', glyph: 'nonesuch', page: 'focus' }])
        );
        expect(draw()).toContain('button 1 names an icon glyphs.yml does not hold');
    });
});
