// Layer 3, shell test. The rail is one stop of the browser's focus order: rendered to HTML, exactly
// one of its controls carries tabindex 0 and every other carries -1, and a control that cannot be
// pressed is no stop at all.
//
// What this does NOT cover: the arrow keys themselves, which need a DOM and are pressed in
// tests/browser/keyboard.spec.ts.

import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import ActivityRail from '../../src/lib/shell/ActivityRail.svelte';
import {
    asciiCatalog,
    engineDir,
    glyphCatalog,
    loadConfig,
    textCatalog,
    vocabCatalog
} from '../../src/lib/data/sources/config.ts';
import { setAscii, setCatalog, setGlyphs } from '../../src/lib/state/text.ts';
import { setVocab } from '../../src/lib/state/tones.ts';
import { clientContext, createClientState } from '../client.ts';

const { config } = loadConfig(engineDir());
setCatalog(textCatalog(config));
setGlyphs(glyphCatalog(config));
setAscii(asciiCatalog(config));
setVocab(vocabCatalog(config));

/** The rail's markup, with the appearance controls at its foot and whatever views were registered. */
function railHtml(): string {
    const client = createClientState();
    return render(ActivityRail, { context: clientContext(client), props: {} }).body;
}

/** Every `data-stop` name in the order the rail draws them, with what the button says about itself. */
function stops(body: string): { name: string; tabindex: string; disabled: boolean }[] {
    const found: { name: string; tabindex: string; disabled: boolean }[] = [];
    const pattern = /data-stop="([^"]*)"([^>]*)/g;
    for (const [, name, rest] of body.matchAll(pattern)) {
        found.push({
            name,
            tabindex: /tabindex="(-?\d+)"/.exec(rest)?.[1] ?? '',
            disabled: rest.includes('disabled')
        });
    }
    return found;
}

describe('the rail as one stop of the focus order', () => {
    it('draws the ring as a vertical toolbar inside the navigation landmark', () => {
        const body = railHtml();
        expect(body).toContain('role="toolbar"');
        expect(body).toContain('aria-orientation="vertical"');
        // The toolbar sits inside the landmark, and neither takes a stop of its own.
        expect(body.indexOf('<nav')).toBeLessThan(body.indexOf('role="toolbar"'));
        expect(/<nav[^>]*tabindex/.test(body)).toBe(false);
        expect(/role="toolbar"[^>]*tabindex|tabindex[^>]*role="toolbar"/.test(body)).toBe(false);
    });

    it('gives exactly one control tabindex 0 and every other one -1', () => {
        const found = stops(railHtml());
        expect(found.length).toBeGreaterThan(1);
        expect(found.filter((one) => one.tabindex === '0').map((one) => one.name)).toEqual([
            found[0].name
        ]);
        expect(found.slice(1).every((one) => one.tabindex === '-1')).toBe(true);
    });

    it('names the appearance controls at the foot, so the arrows reach every one of them', () => {
        const names = stops(railHtml()).map((one) => one.name);
        expect(names).toContain('search');
        expect(names).toContain('update');
        expect(names).toContain('theme');
        expect(names).toContain('crt');
        expect(names).toContain('unicode');
    });

    it('never puts the stop on a control that cannot be pressed', () => {
        // Nothing has changed the text size yet, so the control that puts it back is unavailable.
        const found = stops(railHtml());
        const reset = found.find((one) => one.name === 'text-reset');
        expect(reset?.disabled).toBe(true);
        expect(reset?.tabindex).toBe('-1');
        expect(found.filter((one) => one.disabled && one.tabindex === '0')).toEqual([]);
    });
});
