// The two form primitives the Source Control views added to: ui/forms/Prompt.svelte, the dialog
// that asks for a line or two of text before a write, and the code mode of ui/forms/TextArea.svelte
// the merge editor's result is typed in. Rendered on the server; the focus, Enter, Escape and Tab
// of the prompt are tests/browser/scm/, where a stash's message and a tag's name are typed in it.

import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import Prompt from '../../../src/lib/ui/forms/Prompt.svelte';
import TextArea from '../../../src/lib/ui/forms/TextArea.svelte';

const REQUEST = {
    message: 'Create Tag',
    detail: 'A tag names the commit checked out.',
    fields: [
        { label: 'Tag name', value: 'v1' },
        { label: 'Message', value: '', placeholder: 'optional' }
    ],
    verb: 'Create',
    act: () => undefined
};

function prompt(request = REQUEST): string {
    return render(Prompt, { props: { request, cancel: 'Cancel', oncancel: () => undefined } }).body;
}

describe('Prompt', () => {
    // revert: src/lib/ui/forms/Prompt.svelte "<div class=\"box\" bind:this={box} role=\"dialog\" aria-modal=\"true\" aria-label={request.message}>" =>     <div class="box" bind:this={box}>
    it('reports itself as a modal dialog named by what it asks', () => {
        const body = prompt();
        expect(body).toContain('role="dialog"');
        expect(body).toContain('aria-modal="true"');
        expect(body).toContain('aria-label="Create Tag"');
    });

    // revert: src/lib/ui/forms/Prompt.svelte "value={values[at]}" => value=""
    it('draws each field by its label with the text it begins with, and its yes and its cancel', () => {
        const body = prompt();
        expect(body).toContain('aria-label="Tag name"');
        expect(body).toContain('value="v1"');
        expect(body).toContain('placeholder="optional"');
        expect(body).toContain('>Create<');
        expect(body).toContain('>Cancel<');
        expect(body).toContain('A tag names the commit checked out.');
    });

    // revert: src/lib/ui/forms/Prompt.svelte "{#if (request.detail ?? '') !== ''}" => {#if true}
    it('leaves the detail line out when there is none', () => {
        const body = prompt({ ...REQUEST, detail: '' });
        expect(body.match(/class="detail/g)).toBeNull();
    });
});

describe('TextArea', () => {
    // revert: src/lib/ui/forms/TextArea.svelte "wrap={code ? 'off' : undefined}" => delete
    it('sets source text in the code font on one line each, and leaves prose to wrap', () => {
        const props = { value: 'a', label: 'Result', oninput: () => undefined };
        const code = render(TextArea, { props: { ...props, code: true } }).body;
        expect(code).toContain('wrap="off"');
        expect(code).toMatch(/class="area[^"]*\bcode\b/);
        const prose = render(TextArea, { props }).body;
        expect(prose.includes('wrap=')).toBe(false);
    });
});
