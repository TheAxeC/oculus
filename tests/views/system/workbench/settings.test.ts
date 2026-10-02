// Layer 4, view test. The Settings view drawn as VS Code's Settings editor over the options
// catalog: the search with its count, one item per option with its control, its default and its
// file and line, the groups for a file still being read, the per-browser values as the "This
// browser" rows, the rail list and Reset all pages as the controls of their rows, and the tab's
// saved query and reveal. The file browser is doubled with a map of file names to texts, and every
// name the view asked of it is recorded.
//
// What this does NOT cover: a control pressed and the write it sends, the gear opening on hover,
// the table of contents following the scroll and hiding under 700 px, Down and Escape in the
// search and in a field, and the effect of a reveal, which run in a browser and are seen on
// landing; the rail write is tests/routes/edit/rail.test.ts's, the config-key write is the
// server's; the icon field's open list is tests/ui/forms/glyph-select.test.ts's.

import { render } from 'svelte/server';
import { beforeEach, describe, expect, it } from 'vitest';
import Settings from '../../../../src/lib/views/system/workbench/Settings.svelte';
import { configRail, withRailDraft } from '../../../../src/lib/state/workbench/navigation/rail.ts';
import { clientContext, createClientState, type ClientState } from '../../../fixtures/client.ts';
import { setAppearance } from '../../../../src/lib/state/shared/words/appearance.ts';
import type { FileText } from '../../../../src/lib/state/sources/fs-transport.ts';
import {
    catalog,
    config,
    configured,
    read,
    READING,
    shippedTexts,
    withFiles,
    words,
    type FileLog
} from './workbench-fixture.ts';

let client: ClientState;
let log: FileLog;

beforeEach(() => {
    client = configured();
    log = { asked: [], refreshed: [] };
});

const instance = { id: 'settings-one', view: 'settings', state: {} };

/** The view over the shipped texts of the five tracked files, or over the texts given. */
function draw(files: Record<string, FileText> = shippedTexts(), shown = instance): string {
    return render(Settings, {
        context: clientContext(withFiles(client, files, log)),
        props: { instance: shown }
    }).body;
}

/** The shipped text of one tracked file with one line replaced. */
function shippedWith(name: string, from: string, to: string): Record<string, FileText> {
    const files = shippedTexts();
    const text = files[name].text;
    if (!text.includes(from)) throw new Error(`${name} has no ${from}`);
    return { ...files, [name]: read(text.replace(from, to)) };
}

/** The 1-based line of the first line of a shipped file that starts, indented or not, as given. */
function lineOf(name: string, start: RegExp): number {
    const lines = shippedTexts()[name].text.split('\n');
    return lines.findIndex((one) => start.test(one)) + 1;
}

/** The markup of one item, from its opening tag to the next item or group. */
function itemOf(body: string, id: string): string {
    const open = new RegExp(
        `<[a-z0-9]+[^>]*data-setting="${id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*>`
    );
    const from = body.search(open);
    if (from < 0) return '';
    const inside = from + (open.exec(body.slice(from))?.[0].length ?? 1);
    const rest = body.slice(inside);
    const ends = [rest.search(/data-setting="/), rest.search(/data-settings-group="/)].filter(
        (at) => at >= 0
    );
    return body.slice(from, ends.length === 0 ? body.length : inside + Math.min(...ends));
}

/** The markup of one group, from its opening to the next group. */
function groupOf(body: string, id: string): string {
    const from = body.indexOf(`data-settings-group="${id}"`);
    if (from < 0) return '';
    const next = body.indexOf('data-settings-group="', from + 10);
    return body.slice(from, next < 0 ? body.length : next);
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

    /** The words drawn in the code theme's value span. */
    function codeThemeShown(body: string): string {
        const from = body.indexOf('data-code-theme');
        const start = body.indexOf('>', from) + 1;
        return body
            .slice(start, body.indexOf('</span>', start))
            .replace(/<[^>]*>/g, '')
            .trim();
    }

    // Revert: leave the Code theme menu out of BrowserControl.svelte; no opener and no value.
    it('draws the code theme menu and the theme in force, From the theme under tokens', () => {
        const body = draw();
        expect(buttonNamed(body, catalog['ui.code_theme'])).not.toBe('');
        expect(codeThemeShown(body)).toBe(catalog['ui.code_theme_tokens']);
    });

    // Revert: show the id instead of the theme's displayName.
    it('draws a picked code theme under its own display name', () => {
        client.ui.setCodeTheme('nord');
        expect(codeThemeShown(draw())).toBe('Nord');
        client.ui.setCodeTheme('dark-plus');
        expect(codeThemeShown(draw())).toBe('Dark Plus');
        client.ui.setCodeTheme('tokens');
        expect(codeThemeShown(draw())).toBe(catalog['ui.code_theme_tokens']);
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
        expect(buttonNamed(groupOf(draw(), 'this-browser'), catalog['ui.wallpaper'])).toBe('');
        client.ui.setTheme('mocha');
        expect(buttonNamed(groupOf(draw(), 'this-browser'), catalog['ui.wallpaper'])).not.toBe('');
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

    // Red when the sentence goes, or is drawn anywhere but before the list of rows.
    it('draws the sentence before the rows, and no heading of its own', () => {
        const rail = itemOf(draw(), 'layout.yml:rail');
        const sentence = rail.indexOf(
            '>Each row is a button on the rail: its words, its icon, and the page it shows.<'
        );
        expect(sentence).toBeGreaterThanOrEqual(0);
        expect(sentence).toBeLessThan(rail.indexOf('data-rail-row="0"'));
        // the row's title is its heading, so no second heading is drawn inside the row
        expect(rail).not.toContain('<h3');
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

describe('the search and its count', () => {
    it('draws a search box and the count of the settings found', () => {
        const body = draw();
        expect(body).toContain(`placeholder="${words('workbench.settings_search')}"`);
        const found = [...body.matchAll(/data-setting="/g)].length;
        expect(body).toContain(words('workbench.settings_found', found));
    });

    // Revert: draw the saved query nowhere, and the box opens empty.
    it('draws the query saved in the tab in the search box, and only the rows it keeps', () => {
        client.ui.setInstanceState(instance.id, { query: '@id:slurm.poll_min' });
        const body = draw();
        expect(body).toMatch(/<input[^>]*value="@id:slurm.poll_min"/);
        expect(itemOf(body, 'behavior.yml:slurm.poll_min')).not.toBe('');
        expect(itemOf(body, 'behavior.yml:slurm.resource')).toBe('');
        expect(itemOf(body, 'appearance.yml:terminal.cursor_style')).toBe('');
        const kept = [...body.matchAll(/data-setting="/g)].length;
        expect(body).toContain(
            kept === 1
                ? words('workbench.settings_found_one')
                : words('workbench.settings_found', kept)
        );
    });

    it('says No Settings Found for a query that keeps no row', () => {
        client.ui.setInstanceState(instance.id, { query: 'no setting is called this' });
        const body = draw();
        expect(body).toContain(words('workbench.settings_found_none'));
        // a query that matches nothing leaves no setting drawn
        expect(body).not.toContain('data-setting="');
    });
});

describe('the controls of the options', () => {
    // Revert: draw every option with a text input.
    it('draws each kind of option with its own control', () => {
        const body = draw();
        const toggle = itemOf(body, 'appearance.yml:terminal.mac_option_is_meta');
        expect(toggle).toContain('data-control="toggle"');
        expect(toggle).toContain('type="checkbox"');
        const number = itemOf(body, 'appearance.yml:terminal.font_px');
        expect(number).toContain('data-control="number"');
        expect(number).toContain('inputmode="decimal"');
        const text = itemOf(body, 'appearance.yml:wallpaper.dir');
        expect(text).toContain('data-control="text"');
        expect(text).toContain('type="text"');
        expect(text).toContain('value="tools/oculus/assets/wallpaper"');
        const choice = itemOf(body, 'appearance.yml:terminal.cursor_style');
        expect(choice).toContain('data-control="choice"');
        expect(choice).toContain('<select');
        for (const value of ['block', 'line', 'underline']) {
            expect(choice).toContain(`<option value="${value}"`);
        }
    });

    it('draws the description of a toggle as its label, with no backtick left', () => {
        const options = structuredClone(config.options) as Record<
            string,
            Record<string, { description: string }>
        >;
        options['appearance.yml']['terminal.cursor_blinking'].description =
            'Whether the `grid` cursor blinks.';
        client = createClientState();
        client.entities.receive({
            channel: 'config',
            version: 1,
            payload: { config: { ...config, options }, text: catalog, findings: [] }
        });
        const toggle = itemOf(draw(), 'appearance.yml:terminal.cursor_blinking');
        expect(toggle).toContain('Whether the grid cursor blinks.');
        // the description is the label of the toggle with its code marks taken off
        expect(toggle).not.toContain('`');
    });

    it('summarises a list and a family and offers to edit them in the file, with no input', () => {
        const body = draw();
        const list = itemOf(body, 'behavior.yml:waiting_status');
        expect(list).toContain('data-control="list"');
        expect(list).toContain(words('workbench.settings_items', 4));
        expect(list).toContain(words('workbench.settings_edit_in', 'behavior.yml'));
        // a list is edited in its file, so the item draws no field for it
        expect(list).not.toContain('<input');
        const family = itemOf(body, 'appearance.yml:themes');
        expect(family).toContain('data-control="family"');
        expect(family).toContain(words('workbench.settings_edit_in', 'appearance.yml'));
        expect(family).toMatch(/<code[^>]*>class<\/code>/);
        // a family is edited in its file, so the item draws no field for it
        expect(family).not.toContain('<input');
        // a family has no single starting value, only the fields of its entries
        expect(family).not.toContain('Default:');
    });

    it('draws a value the control cannot show as the file has it, with the message', () => {
        const body = draw(
            shippedWith('appearance.yml', 'cursor_style: block', 'cursor_style: bar')
        );
        const choice = itemOf(body, 'appearance.yml:terminal.cursor_style');
        expect(choice).toContain('<option value="bar" selected');
        expect(choice).toContain('data-modified');
        expect(choice).toContain(words('workbench.settings_mismatch_choice', 'bar'));
    });
});

describe('the machine-local rows', () => {
    it('draws the description and key path of a local.yml key and nothing to set', () => {
        const log2: FileLog = log;
        const body = draw();
        const hub = itemOf(body, 'local.yml:hub');
        expect(hub).toContain('data-control="none"');
        expect(hub).toContain('>hub<');
        // the machine's own keys are not typed into here
        expect(hub).not.toContain('<input');
        // the machine's own keys are not chosen from a list here
        expect(hub).not.toContain('<select');
        // the machine's own keys have no starting value to list
        expect(hub).not.toContain('Default:');
        // the machine's own keys have no actions, so the item draws no menu for them
        expect(hub).not.toContain(words('workbench.settings_gear'));
        // a key of the machine's own file has no value here to differ from a default
        expect(hub).not.toContain('data-modified');
        const group = groupOf(body, 'local.yml');
        expect(group).toContain(words('config.local_tag'));
        // the machine's own file is described from the catalog and its text is never read
        expect(log2.asked).not.toContain('local.yml');
        expect(log2.asked.sort()).toEqual([
            'appearance.yml',
            'behavior.yml',
            'layout.yml',
            'present.yml',
            'sources.yml'
        ]);
    });
});

describe('Modified, the default and the file and line of an option', () => {
    // Revert: never mark a row Modified.
    it('marks a Modified row with its bar and no other', () => {
        const body = draw(shippedWith('behavior.yml', 'poll_min: 20', 'poll_min: 5'));
        const changed = itemOf(body, 'behavior.yml:slurm.poll_min');
        expect(changed).toContain('data-modified');
        expect(changed).toContain('class="bar');
        const plain = itemOf(body, 'behavior.yml:slurm.resource');
        // an option at its default is not Modified
        expect(plain).not.toContain('data-modified');
        // an option at its default shows no bar on its left edge
        expect(plain).not.toContain('class="bar');
        expect([...body.matchAll(/data-modified/g)].length, 'only the one row is Modified').toBe(1);
    });

    it('draws the default of a row and the file and line it opens, and the row without a line', () => {
        const body = draw();
        const row = itemOf(body, 'behavior.yml:slurm.poll_min');
        expect(row).toContain(words('workbench.settings_default', 20));
        const line = lineOf('behavior.yml', /^\s+poll_min:/);
        expect(line).toBeGreaterThan(1);
        expect(row).toContain(`behavior.yml:${line}`);
        const list = itemOf(body, 'behavior.yml:data_domains');
        expect(list).toContain(words('workbench.settings_default_items', 7));
    });

    it('says a key that is not in the file is not set, with no control but the edit link', () => {
        const body = draw(shippedWith('behavior.yml', 'poll_min: 20', 'poll_min:'));
        const row = itemOf(body, 'behavior.yml:slurm.poll_min');
        expect(row).toContain('data-missing');
        expect(row).toContain('data-control="none"');
        expect(row).toContain(words('workbench.settings_missing', 'behavior.yml'));
        expect(row).toContain(words('workbench.settings_edit_in', 'behavior.yml'));
        // a missing key has nothing to be typed into, so its row offers no field
        expect(row).not.toContain('<input');
        // a missing key is not set, so it differs from no default
        expect(row).not.toContain('data-modified');
    });
});

describe('a file that is not drawn as rows', () => {
    it('says a file still being read, and draws no row of it', () => {
        const files = { ...shippedTexts(), 'behavior.yml': READING };
        const group = groupOf(draw(files), 'behavior.yml');
        expect(group).toContain(words('workbench.settings_loading', 'behavior.yml'));
        // a file still being read has not been parsed, so it lists no option yet
        expect(group).not.toContain('data-setting="');
    });

    it('says a file it could not read, one that is cut and one that does not parse', () => {
        const files = {
            ...shippedTexts(),
            'behavior.yml': { text: '', truncated: false, error: '404', loading: false },
            'layout.yml': { text: 'rail: [', truncated: true, error: '', loading: false },
            'present.yml': read('deck: [\n')
        };
        const body = draw(files);
        expect(groupOf(body, 'behavior.yml')).toContain(
            words('workbench.settings_unreadable', 'behavior.yml', '404')
        );
        expect(groupOf(body, 'layout.yml')).toContain(
            words('workbench.settings_cut', 'layout.yml')
        );
        expect(groupOf(body, 'present.yml')).toContain(
            words('workbench.settings_unparsed', 'present.yml', '').trim()
        );
        // a file that does not parse lists none of its options as rows
        expect(groupOf(body, 'present.yml')).not.toContain('data-setting="');
        expect(groupOf(body, 'appearance.yml')).toContain('data-setting="');
    });
});

describe('a file that is not drawn as rows, under a query', () => {
    const unreadable = { text: '', truncated: false, error: '404', loading: false };

    // Revert: keep a group with no row whatever the query.
    it('is left out once a query is typed, and drawn for an empty query', () => {
        const files = { ...shippedTexts(), 'behavior.yml': unreadable };
        const line = words('workbench.settings_unreadable', 'behavior.yml', '404');
        const id = client.layout.openView('settings');
        client.ui.setInstanceState(id, { query: 'cursor' });
        // a typed query shows only rows, so a group that holds none says nothing
        expect(draw(files, { id, view: 'settings', state: {} })).not.toContain(line);
        client.ui.setInstanceState(id, { query: '' });
        expect(draw(files, { id, view: 'settings', state: {} })).toContain(line);
    });
});

describe('the rail and the page reset as rows', () => {
    // Revert: draw the rail row with a text input in place of the rail list.
    it('draws the rail list in its row and Reset all pages in its own, neither under a heading', () => {
        const body = draw();
        const rail = itemOf(body, 'layout.yml:rail');
        expect(rail).toContain('data-control="rail"');
        expect(rail).toContain('data-rail-row="0"');
        // the rail row's title is its heading, so no second heading is drawn inside it
        expect(rail).not.toContain('<h3');
        const pages = itemOf(body, 'layout.yml:arrangements');
        expect(pages).toContain('data-control="arrangements"');
        expect(buttonNamed(pages, catalog['workbench.reset_all'])).not.toBe('');
        // the page reset row's title is its heading, so no second heading is drawn inside it
        expect(pages).not.toContain('<h3');
    });

    it('lists the fields of the rail family under its description', () => {
        const rail = itemOf(draw(), 'layout.yml:rail');
        expect(rail).toMatch(/<code[^>]*>glyph<\/code>/);
        expect(rail).toMatch(/<code[^>]*>page<\/code>/);
    });
});

describe('the This browser rows', () => {
    it('draws the seven values under a theme that has a wallpaper', () => {
        client.ui.setTheme('mocha');
        const group = groupOf(draw(), 'this-browser');
        expect([...group.matchAll(/data-setting="this-browser:/g)]).toHaveLength(7);
        for (const name of [
            'theme',
            'code_theme',
            'text_size',
            'terminal_font',
            'crt',
            'wallpaper',
            'icons'
        ]) {
            expect(itemOf(group, `this-browser:${name}`)).not.toBe('');
        }
        expect(itemOf(group, 'this-browser:terminal_font')).toContain('inputmode="decimal"');
    });

    // Revert: draw the wallpaper row under every theme.
    it('draws the wallpaper row only under a theme that has one', () => {
        client.ui.setTheme('light');
        const group = groupOf(draw(), 'this-browser');
        expect([...group.matchAll(/data-setting="this-browser:/g)]).toHaveLength(6);
        // a theme without a wallpaper has no wallpaper to switch, so the row is not made
        expect(group).not.toContain('this-browser:wallpaper');
    });

    it('marks a value this browser holds of its own as Modified, and nothing else', () => {
        // nothing in the browser group differs from its start, so no row carries the bar
        expect(groupOf(draw(), 'this-browser')).not.toContain('data-modified');
        client.ui.setCodeTheme('nord');
        const group = groupOf(draw(), 'this-browser');
        expect(itemOf(group, 'this-browser:code_theme')).toContain('data-modified');
        expect([...group.matchAll(/data-modified/g)]).toHaveLength(1);
    });

    // Revert: give every This browser row the control `browser`.
    it('names on each row the control it draws, and no other word', () => {
        client.ui.setTheme('mocha');
        const group = groupOf(draw(), 'this-browser');
        const controls = Object.fromEntries(
            ['theme', 'code_theme', 'text_size', 'terminal_font', 'crt', 'wallpaper', 'icons'].map(
                (name) => [
                    name,
                    /data-control="([a-z]+)"/.exec(itemOf(group, `this-browser:${name}`))?.[1]
                ]
            )
        );
        expect(controls).toEqual({
            theme: 'choice',
            code_theme: 'choice',
            text_size: 'number',
            terminal_font: 'number',
            crt: 'toggle',
            wallpaper: 'toggle',
            icons: 'toggle'
        });
    });

    // Revert: draw the gear on every row, whatever its menu holds.
    it('draws no gear on a row whose menu is empty, and one once the row is Modified', () => {
        const fresh = groupOf(draw(), 'this-browser');
        for (const name of ['theme', 'code_theme', 'text_size', 'terminal_font', 'crt', 'icons']) {
            // an unmodified row has nothing to reset and no setting ID, so it has no menu
            expect(itemOf(fresh, `this-browser:${name}`), name).not.toContain(
                words('workbench.settings_gear')
            );
        }
        client.ui.setCrt(true);
        const changed = groupOf(draw(), 'this-browser');
        expect(itemOf(changed, 'this-browser:crt')).toContain(words('workbench.settings_gear'));
        // a "This browser" row has no setting ID in a file, so its menu offers Reset alone
        expect(itemOf(draw(), 'behavior.yml:slurm.poll_min')).toContain(
            words('workbench.settings_gear')
        );
    });

    // Revert: make the wallpaper row depend on the theme alone.
    it('draws the wallpaper row under a theme without one while a wallpaper choice is saved', () => {
        client.ui.setTheme('light');
        client.ui.setWallpaper(false);
        const row = itemOf(groupOf(draw(), 'this-browser'), 'this-browser:wallpaper');
        expect(row).toContain('data-modified');
    });

    it('draws the terminal text size from the store, empty while the config default is in force', () => {
        const empty = itemOf(draw(), 'this-browser:terminal_font');
        expect(empty).toContain('value=""');
        client.ui.setTerminalFont(14);
        expect(itemOf(draw(), 'this-browser:terminal_font')).toContain('value="14"');
    });
});

describe('the reveal of the rail list', () => {
    it('draws the rail row whatever the query when the tab was opened to show it', () => {
        const id = client.layout.openView('settings', { reveal: 'rail' });
        client.ui.setInstanceState(id, { query: '@id:slurm.poll_min' });
        const body = draw(shippedTexts(), { id, view: 'settings', state: {} });
        expect(itemOf(body, 'layout.yml:rail')).not.toBe('');
        expect(itemOf(body, 'behavior.yml:slurm.poll_min')).not.toBe('');
        expect(itemOf(body, 'behavior.yml:slurm.resource')).toBe('');
    });

    it('draws only what the query keeps when the tab was not opened to show it', () => {
        const id = client.layout.openView('settings');
        client.ui.setInstanceState(id, { query: '@id:slurm.poll_min' });
        const body = draw(shippedTexts(), { id, view: 'settings', state: {} });
        expect(itemOf(body, 'behavior.yml:slurm.poll_min')).not.toBe('');
        expect(itemOf(body, 'layout.yml:rail')).toBe('');
    });
});

describe('the pane the view is drawn in', () => {
    // Revert: leave `tinted` off the pane.
    it('is a tinted pane, as every view drawn over the wallpaper is', () => {
        expect(draw()).toMatch(/<section class="[^"]*\btinted\b/);
    });
});

describe('the table of contents', () => {
    // Revert: give every group row of the contents its open state.
    it('gives a group with no section no open state, and a group with sections its own', () => {
        const body = draw();
        const row = (id: string): string =>
            (body.match(/<[^>]*role="treeitem"[^>]*>/g) ?? []).find((tag) =>
                tag.includes(`data-value="${id}"`)
            ) ?? '';
        expect(row('this-browser')).not.toBe('');
        // the per-browser group holds one unheaded section, so it has nothing to open or close
        expect(row('this-browser')).not.toContain('aria-expanded');
        expect(row('behavior.yml')).toContain('aria-expanded="true"');
    });
});

describe('the files the view asks for', () => {
    it('asks the file browser for the five tracked files only', () => {
        draw();
        expect(new Set(log.asked)).toEqual(
            new Set(['appearance.yml', 'behavior.yml', 'layout.yml', 'present.yml', 'sources.yml'])
        );
    });
});
