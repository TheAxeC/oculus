// The number box of ui/forms/NumberInput.svelte, rendered to HTML on the server: a text box that
// asks a phone for a decimal keypad and holds whatever text is typed, so the view can say why a
// text is not a number rather than the browser silently dropping it. The Enter and blur callbacks
// run on events, which the unit suite has none of, and are looked at on landing.

import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import NumberInput from '../../../src/lib/ui/forms/NumberInput.svelte';
import { noop } from '../../fixtures/doubles.ts';
import { clientContext, createClientState } from '../../fixtures/client.ts';

const context = clientContext(createClientState());

/** The input's opening tag of a rendering with the props given. */
function tagOf(props: Record<string, unknown>): string {
    const { body } = render(NumberInput, {
        context,
        props: {
            value: '12',
            label: 'Minutes',
            oninput: noop,
            onenter: noop,
            onblur: noop,
            ...props
        }
    });
    const at = body.indexOf('<input');
    return body.slice(at, body.indexOf('>', at) + 1);
}

describe('a number box', () => {
    // Revert: draw it as type="number", which drops the text a browser cannot read as a number.
    it('is a text box asking for a decimal keypad, never a spinner', () => {
        const tag = tagOf({});
        expect(tag).toContain('type="text"');
        expect(tag).toContain('inputmode="decimal"');
        expect(tag).not.toContain('type="number"');
    });

    it('holds the text it is given and is named by its label', () => {
        const tag = tagOf({ value: '1x' });
        expect(tag).toContain('value="1x"');
        expect(tag).toContain('aria-label="Minutes"');
    });

    it('can be read-only and can carry a placeholder', () => {
        const tag = tagOf({ readonly: true, placeholder: '12.5' });
        expect(tag).toContain('readonly');
        expect(tag).toContain('placeholder="12.5"');
    });
});
