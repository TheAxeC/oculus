// The growing message field of ui/forms/TextArea.svelte that the commit box draws, rendered to HTML
// on the server. The height a browser gives a field that sizes to its content is layout, so what
// is asserted is the rows attribute, which is the height where a browser has no field sizing, and
// the measures the rules set, read from the source as an audit.

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import TextArea from '../../../src/lib/ui/forms/TextArea.svelte';
import { noop } from '../../fixtures/doubles.ts';
import { clientContext, createClientState } from '../../fixtures/client.ts';

const context = clientContext(createClientState());

/** The textarea's opening tag of a rendering with the props given. */
function tagOf(props: Record<string, unknown>): string {
    const { body } = render(TextArea, {
        context,
        props: { value: '', label: 'Message', oninput: noop, ...props }
    });
    const at = body.indexOf('<textarea');
    return body.slice(at, body.indexOf('>', at) + 1);
}

describe('a text area that grows with its text', () => {
    it('takes its rows from the caller, three by default, with no growth', () => {
        expect(tagOf({})).toContain('rows="3"');
        expect(tagOf({ rows: 5 })).toContain('rows="5"');
        expect(tagOf({})).not.toMatch(/class="[^"]*\bgrow\b/);
    });

    it('holds its rows between the least and the most it may grow to', () => {
        const grow = { min: 1, max: 10 };
        expect(tagOf({ grow, rows: 4 })).toContain('rows="4"');
        expect(tagOf({ grow, rows: 30 })).toContain('rows="10"');
        expect(tagOf({ grow, rows: 0 })).toContain('rows="1"');
        expect(tagOf({ grow, rows: 4 })).toMatch(/class="[^"]*\bgrow\b/);
    });

    it('carries the least and the most as the properties its rules size it with', () => {
        const tag = tagOf({ grow: { min: 1, max: 10 }, rows: 2 });

        expect(tag).toContain('--grow-min: 1');
        expect(tag).toContain('--grow-max: 10');
    });

    it('draws the tree text size when it is asked for, and the small one otherwise', () => {
        expect(tagOf({ size: 'tree' })).toMatch(/class="[^"]*\btree\b/);
        expect(tagOf({})).not.toMatch(/class="[^"]*\btree\b/);
    });

    it('audits that sizes to its content between the least and the most, and scrolls past the most', () => {
        const source = readFileSync('src/lib/ui/forms/TextArea.svelte', 'utf8');
        const at = source.indexOf('.area.grow {');
        const grow = at < 0 ? '' : source.slice(at, source.indexOf('}', at));

        expect(grow).toContain('field-sizing: content');
        expect(grow).toContain('min-height: calc(var(--grow-min) * 1lh)');
        expect(grow).toContain('max-height: calc(var(--grow-max) * 1lh)');
        expect(grow).toContain('overflow-y: auto');
        expect(source).toContain('font-size: calc(var(--tree-font) * var(--text-scale, 1))');
    });

    // Revert: drop the `.area.grow:placeholder-shown` rule of TextArea, and an empty box with a
    // placeholder wider than itself wraps it into a second line.
    it('audits that cuts a placeholder wider than the empty box rather than wrapping it', () => {
        const source = readFileSync('src/lib/ui/forms/TextArea.svelte', 'utf8');
        const at = source.indexOf('.area.grow:placeholder-shown {');
        const rule = at < 0 ? '' : source.slice(at, source.indexOf('}', at));

        expect(rule).toContain('white-space: nowrap');
        expect(rule).toContain('overflow: hidden');
    });

    it('audits that keeps the terminal form under body.rice', () => {
        const source = readFileSync('src/lib/ui/forms/TextArea.svelte', 'utf8');

        expect(source).toContain(':global(body.rice) .area {');
        expect(source).toContain('border-radius: 0;');
    });
});
