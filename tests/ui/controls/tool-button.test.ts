// The full-width button of ui/controls/ToolButton.svelte that the commit box draws, rendered to
// HTML on the server, with the measures of its rules read from the source. A server rendering
// runs no layout, so what a rule sets is an audit of the source; the look on TEST judges it.

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import ToolButton from '../../../src/lib/ui/controls/ToolButton.svelte';
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
const context = clientContext(createClientState());

/** The button element's opening tag of a rendering. */
function tagOf(body: string): string {
    const at = body.indexOf('<button');
    return body.slice(at, body.indexOf('>', at) + 1);
}

/** The declarations of the first rule whose selector is `selector`, or the empty string. */
function rule(source: string, selector: string): string {
    const at = source.indexOf(`${selector} {`);
    return at < 0 ? '' : source.slice(at, source.indexOf('}', at));
}

describe('the primary look of a tool button', () => {
    it('draws the glyph and then the words, and carries the look as a class', () => {
        const { body } = render(ToolButton, {
            context,
            props: { label: 'Commit', glyph: 'check', primary: true, onclick: noop }
        });

        expect(tagOf(body)).toMatch(/class="tool[^"]*\bprimary\b/);
        expect(body.indexOf('data-glyph="check"')).toBeLessThan(body.indexOf('>Commit<'));
    });

    it('is joined to a dropdown only when it is told so', () => {
        const joined = render(ToolButton, {
            context,
            props: { label: 'Commit', primary: true, joined: true, onclick: noop }
        }).body;
        const alone = render(ToolButton, {
            context,
            props: { label: 'Commit', primary: true, onclick: noop }
        }).body;

        expect(tagOf(joined)).toMatch(/class="tool[^"]*\bjoined\b/);
        expect(tagOf(alone)).not.toContain('joined');
    });

    it('is disabled with the reason as its words when it cannot be pressed', () => {
        const { body } = render(ToolButton, {
            context,
            props: {
                label: 'Commit',
                title: 'Write a commit message first.',
                primary: true,
                disabled: true,
                onclick: noop
            }
        });

        expect(tagOf(body)).toMatch(/class="tool[^"]*\bprimary\b/);
        expect(tagOf(body)).toContain('disabled');
        expect(body).toContain('Write a commit message first.');
    });

    it('audits that sets VS Code button measures: 4px 8px, a 16px line, 12px words, the input radius', () => {
        const source = readFileSync('src/lib/ui/controls/ToolButton.svelte', 'utf8');
        const primary = rule(source, '.tool.primary');

        expect(primary).toContain('width: 100%');
        expect(primary).toContain('padding: 4px 8px');
        expect(primary).toContain('line-height: calc(var(--button-line) * var(--text-scale, 1))');
        expect(primary).toContain('font-size: calc(var(--button-font) * var(--text-scale, 1))');
        expect(primary).toContain('border-radius: var(--input-radius)');
        expect(primary).toContain('background: var(--accent)');
        expect(primary).toContain('color: var(--on-accent)');
    });

    it('audits that squares the right corners of a joined button and draws a 1px separator leaving 4px', () => {
        const source = readFileSync('src/lib/ui/controls/ToolButton.svelte', 'utf8');
        const joined = rule(source, '.tool.primary.joined');
        const separator = rule(source, '.tool.primary.joined::after');

        expect(joined).toMatch(/border-radius:[^;]*0 0/);
        expect(separator).toContain('border-left: 1px solid var(--on-accent)');
        expect(separator).toContain('top: 4px');
        expect(separator).toContain('bottom: 4px');
        expect(separator).toContain('opacity: 0.4');
    });
});
