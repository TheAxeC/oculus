// Layer 3, primitive test. CodeText rendered on the server: a backticked word of a catalog line
// drawn as code, the backticks gone, and the code's text escaped like any other text.
//
// What this does NOT cover: the look of the code piece, which is its style and is seen on screen.

import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import CodeText from '../../../src/lib/ui/display/CodeText.svelte';

/** The markup of one line, without Svelte's markers and its scoping class. */
function drawn(text: string): string {
    return render(CodeText, { props: { text } })
        .body.replace(/<!--[\s\S]*?-->/g, '')
        .replace(/ class="svelte-[\w-]+"/g, '');
}

describe('CodeText', () => {
    it('draws a backticked word as code and leaves no backtick', () => {
        expect(drawn('missing `title`')).toBe('missing <code>title</code>');
    });

    it('escapes the text inside a code piece', () => {
        expect(drawn('`a<b & c`')).toBe('<code>a&lt;b &amp; c</code>');
    });
});
