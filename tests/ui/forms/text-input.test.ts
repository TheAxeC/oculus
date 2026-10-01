// The one-line box of ui/forms/TextInput.svelte, rendered to HTML on the server: what it draws for
// the value, the label and the secret mode.
//
// What this does NOT cover: the Enter and blur callbacks a form that writes on leaving the box
// hands it. They run on events, which the unit suite has none of, so Enter and blur writes are
// looked at on landing.

import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import TextInput from '../../../src/lib/ui/forms/TextInput.svelte';
import { noop } from '../../fixtures/doubles.ts';
import { clientContext, createClientState } from '../../fixtures/client.ts';

const context = clientContext(createClientState());

/** The input's opening tag of a rendering with the props given. */
function tagOf(props: Record<string, unknown>): string {
    const { body } = render(TextInput, {
        context,
        props: { value: 'utwente', label: 'Host', oninput: noop, ...props }
    });
    const at = body.indexOf('<input');
    return body.slice(at, body.indexOf('>', at) + 1);
}

describe('a text box', () => {
    it('draws its value and its label', () => {
        const tag = tagOf({});
        expect(tag).toContain('value="utwente"');
        expect(tag).toContain('aria-label="Host"');
        expect(tag).toContain('type="text"');
    });

    it('draws a secret as dots and keeps it out of the browser autofill', () => {
        const tag = tagOf({ secret: true });
        expect(tag).toContain('type="password"');
        expect(tag).toContain('autocomplete="off"');
    });
});
