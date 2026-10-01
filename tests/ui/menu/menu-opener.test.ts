// The dropdown part of the commit button, ui/menu/MenuOpener.svelte in its primary look, drawn by
// the Menu that owns it and rendered to HTML on the server. The measures its rules set are read
// from the source as an audit, since a server rendering runs no layout.

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import Menu from '../../../src/lib/ui/menu/Menu.svelte';
import {
    engineDir,
    glyphCatalog,
    iconSet,
    loadConfig
} from '../../../src/lib/data/sources/config.ts';
import { setGlyphs, setIcons } from '../../../src/lib/state/shared/words/text.ts';
import { noop } from '../../fixtures/doubles.ts';
import { clientContext, createClientState } from '../../fixtures/client.ts';

const { config } = loadConfig(engineDir());
setGlyphs(glyphCatalog(config));
setIcons(iconSet(config));

/** The opener button's opening tag of a menu drawn with the props given. */
function openerOf(props: Record<string, unknown>): string {
    const { body } = render(Menu, {
        context: clientContext(createClientState()),
        props: {
            label: 'More ways to commit',
            glyph: 'disclosure',
            compact: true,
            items: [],
            onpick: noop,
            ...props
        }
    });
    const at = body.indexOf('<button');
    return body.slice(at, body.indexOf('>', at) + 1);
}

describe('the primary look of a menu opener', () => {
    it('is drawn only when the menu is asked for it', () => {
        expect(openerOf({ primary: true })).toMatch(/class="opener[^"]*\bprimary\b/);
        expect(openerOf({})).not.toMatch(/class="opener[^"]*\bprimary\b/);
    });

    it('keeps the words of the menu as its accessible name', () => {
        expect(openerOf({ primary: true })).toContain('aria-label="More ways to commit"');
    });

    it('audits that sets the dropdown part measures: 0 4px, square left corners, the button colours', () => {
        const source = readFileSync('src/lib/ui/menu/MenuOpener.svelte', 'utf8');
        const at = source.indexOf('.opener.primary {');
        const primary = at < 0 ? '' : source.slice(at, source.indexOf('}', at));

        expect(primary).toContain('padding: 0 4px');
        expect(primary).toMatch(/border-radius:[^;]*0 [^;]*0/);
        expect(primary).toContain('background: var(--accent)');
        expect(primary).toContain('color: var(--on-accent)');
        expect(primary).toContain('width: auto');
        expect(primary).toContain('font-size: calc(var(--button-font) * var(--text-scale, 1))');
        expect(primary).toContain('line-height: calc(var(--button-line) * var(--text-scale, 1))');
    });
});
