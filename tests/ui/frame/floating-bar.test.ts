// Layer 4, primitive test. The floating strip of ui/frame/FloatingBar.svelte: it draws what it is
// given inside its frame, and its surface is the card's colour on a plain page and the card's at
// the popover's share over a wallpaper, blurred, which is the answer tests/ui/theme/wall.test.ts
// asks of a surface. The find bar of the Terminal view draws inside it and paints no surface of
// its own, so the view's tinted box is still asked for (tests/views/whole/tinted.test.ts).
//
// What this does NOT cover: the frame over a real grid and a real picture, which is the look.

import { readFileSync } from 'node:fs';
import { createRawSnippet } from 'svelte';
import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import FloatingBar from '../../../src/lib/ui/frame/FloatingBar.svelte';
import { withoutComments } from '../../checks/source/code.ts';

/** The rules of a component's style block, comments removed, by their selector. */
function rules(path: string): Map<string, string> {
    const source = readFileSync(path, 'utf8');
    const css = /<style[^>]*>([\s\S]*?)<\/style>/.exec(source)?.[1] ?? '';
    const held = new Map<string, string>();
    for (const match of withoutComments('style.css', css).matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
        held.set(match[1].trim(), match[2].replace(/\s+/g, ' ').trim());
    }
    return held;
}

describe('the floating bar', () => {
    it('draws what it is given inside its frame', () => {
        const children = createRawSnippet(() => ({ render: () => '<span>held</span>' }));
        const { body } = render(FloatingBar, { props: { children } });
        expect(body.replace(/<!--[^>]*-->/g, '')).toMatch(
            /<div class="floating[^"]*"><span>held<\/span><\/div>/
        );
    });

    it('audits that its surface is the card, and the card at the popover share over a wallpaper', () => {
        const held = rules('src/lib/ui/frame/FloatingBar.svelte');
        expect(held.get('.floating')).toContain('background: var(--card);');
        expect(held.get(':global(body.wall) .floating')).toBe(
            'background: color-mix(in srgb, var(--card) var(--wall-popover), transparent); backdrop-filter: blur(var(--wall-blur));'
        );
    });

    it('audits that the find bar draws inside it and paints no surface of its own', () => {
        const path = 'src/lib/views/sessions/terminal/FindBar.svelte';
        expect(readFileSync(path, 'utf8')).toContain('<FloatingBar>');
        const painted = [...rules(path).entries()].filter(([, body]) =>
            body.includes('background')
        );
        expect(painted).toEqual([]);
    });
});
