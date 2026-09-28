// Layer 4, view test. The Settings view drawn: the appearance controls with their names, what each
// text step can do, the wallpaper toggle only under a theme that has one, and the rail list as rows
// the reader edits, one row per button of the file or of the list being typed, with the rule's
// sentence for a row it refuses and Save waiting for it.
//
// What this does NOT cover: a control pressed, and the write it sends, which is
// tests/routes/edit/rail.test.ts's.

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

/**
 * The markup of one rail row's mark: from the row's opening to its label field, which is the next
 * thing the row draws. Empty when the row or its mark is not drawn.
 */
function markOf(body: string, at: number): string {
    const row = body.indexOf(`data-rail-row="${at}"`);
    if (row < 0) return '';
    const mark = body.indexOf('class="mark', row);
    const field = body.indexOf(words('workbench.rail_label', at + 1), row);
    return mark < 0 || field < 0 || mark > field ? '' : body.slice(mark, field);
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
        expect([...body.matchAll(/data-rail-row="/g)]).toHaveLength(11);
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

    it('draws a row "Add a button" appended, with an empty mark and the line naming its label', () => {
        const saved = configRail(config);
        client.ui.setInstanceState(
            instance.id,
            withRailDraft({}, [...saved, { label: '', glyph: '', page: '' }])
        );
        const body = draw();
        expect([...body.matchAll(/data-rail-row="/g)]).toHaveLength(12);
        expect(markOf(body, 11)).not.toBe('');
        // a new row names no glyph yet, and an empty name is none the vocabulary holds
        expect(markOf(body, 11)).not.toContain('data-glyph');
        expect(body).toContain(why('workbench.rail_why_label', 12));
        expect(buttonNamed(body, catalog['workbench.rail_save'])).toMatch(/\sdisabled/);
    });

    it('draws a row whose glyph the vocabulary lacks with an empty mark and names it', () => {
        client.ui.setInstanceState(
            instance.id,
            withRailDraft({}, [{ label: 'Odd', glyph: 'nonesuch', page: 'focus' }])
        );
        const body = draw();
        expect([...body.matchAll(/data-rail-row="/g)]).toHaveLength(1);
        expect(body).toContain('value="Odd"');
        expect(markOf(body, 0)).not.toBe('');
        // nonesuch is a name the vocabulary lacks, so the mark stays and draws nothing
        expect(markOf(body, 0)).not.toContain('data-glyph');
        expect(body).toContain(why('workbench.rail_why_glyph_unknown', 1));
    });

    it('draws the glyph in the mark of a row whose glyph the vocabulary holds', () => {
        client.ui.setInstanceState(
            instance.id,
            withRailDraft({}, [{ label: 'Only', glyph: 'compass', page: 'focus' }])
        );
        expect(markOf(draw(), 0)).toContain('data-glyph="compass"');
    });

    it('names each control of a row by the place of its button', () => {
        const body = draw();
        expect(buttonNamed(body, why('workbench.rail_remove', 11))).not.toBe('');
        expect(buttonNamed(body, why('workbench.rail_up', 1))).toMatch(/\sdisabled/);
    });
});
