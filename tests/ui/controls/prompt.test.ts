// The two form primitives the Source Control views added to: ui/forms/Prompt.svelte, the dialog
// that asks for a line or two of text before a write, and the code mode of ui/forms/TextArea.svelte
// the merge editor's result is typed in. Rendered on the server; the focus, Enter, Escape and Tab
// of the prompt need a DOM and are not run here.

import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import Prompt from '../../../src/lib/ui/forms/Prompt.svelte';
import TextArea from '../../../src/lib/ui/forms/TextArea.svelte';
import type { PromptRequest } from '../../../src/lib/ui/forms/prompt.ts';

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

function prompt(request: PromptRequest = REQUEST): string {
    return render(Prompt, { props: { request, cancel: 'Cancel', oncancel: () => undefined } }).body;
}

describe('Prompt', () => {
    it('reports itself as a modal dialog named by what it asks', () => {
        const body = prompt();
        expect(body).toContain('role="dialog"');
        expect(body).toContain('aria-modal="true"');
        expect(body).toContain('aria-label="Create Tag"');
    });

    // An audit of the markup the prompt keeps. Red when a field loses its label or the text it
    // begins with, or the yes or the cancel goes.
    it('draws each field by its label with the text it begins with, and its yes and its cancel', () => {
        const body = prompt();
        expect(body).toContain('aria-label="Tag name"');
        expect(body).toContain('value="v1"');
        expect(body).toContain('placeholder="optional"');
        expect(body).toContain('>Create<');
        expect(body).toContain('>Cancel<');
        expect(body).toContain('A tag names the commit checked out.');
    });

    // Revert: draw a field that has choices as a text input.
    it('draws a field that has choices as a select of them with its value chosen', () => {
        const body = prompt({
            ...REQUEST,
            fields: [
                {
                    label: 'Folder',
                    value: 'data',
                    choices: [
                        { id: 'hub', label: 'hub' },
                        { id: 'data', label: 'data' }
                    ]
                },
                { label: 'File name', value: '' }
            ]
        });
        const options = [...body.matchAll(/<option value="([^"]*)"( selected)?/g)].map(
            (found) => `${found[1]}${found[2] ? '*' : ''}`
        );
        expect(options).toEqual(['hub', 'data*']);
        expect(body).toContain('aria-label="File name"');
    });

    it('leaves the detail line out when there is none', () => {
        const body = prompt({ ...REQUEST, detail: '' });
        expect(body.match(/class="detail/g)).toBeNull();
    });
});

describe('TextArea', () => {
    it('sets source text in the code font on one line each, and leaves prose to wrap', () => {
        const props = { value: 'a', label: 'Result', oninput: () => undefined };
        const code = render(TextArea, { props: { ...props, code: true } }).body;
        expect(code).toContain('wrap="off"');
        expect(code).toMatch(/class="area[^"]*\bcode\b/);
        const prose = render(TextArea, { props }).body;
        expect(prose.includes('wrap=')).toBe(false);
    });
});
