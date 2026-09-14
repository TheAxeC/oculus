// Layer 4, view test. The shared intro partial owns the bordered surface, draws the catalog's own markup as written and cuts a hub value down first, and wraps its controls under the words rather than pushing them past its edge.
//
// What this does NOT cover: the filtering. DOMPurify needs a document and this suite runs in node, so `sanitise` returns its argument here; which of the two paths a line takes is read off the source, and tests/browser/sanitise.spec.ts presses the filtering itself in Chrome.

import { readFileSync } from 'node:fs';
import { render } from 'svelte/server';
import { beforeEach, describe, expect, it } from 'vitest';
import Intro from '../../src/lib/views/shared/Intro.svelte';
import { clientContext, createClientState, type ClientState } from '../client.ts';

let client: ClientState;

beforeEach(() => {
    client = createClientState();
});

describe('Intro', () => {
    it('draws a trusted catalog line inside the shared intro class', () => {
        const body = render(Intro, {
            context: clientContext(client),
            props: { html: 'A <b>catalog</b> line.', trusted: true }
        }).body;
        expect(body).toMatch(/class="intro(?:\s|")/);
        expect(body).toContain('A <b>catalog</b> line.');
    });

    it('takes a catalog line as it is written and puts a hub value through the sanitiser', () => {
        const source = readFileSync('src/lib/views/shared/Intro.svelte', 'utf8');
        expect(source).toContain('return trusted ? line : sanitise(line);');
        expect(source).toContain('{@html drawn(line)}');
        expect(source).toContain('{@html drawn(html)}');
    });

    it('draws the same lines whichever path they take, the caller choosing only the filter', () => {
        const line = 'A <b>catalog</b> line.';
        expect(
            render(Intro, { context: clientContext(client), props: { html: line, trusted: true } })
                .body
        ).toContain(line);
        expect(
            render(Intro, {
                context: clientContext(client),
                props: { lines: [line], trusted: true }
            }).body
        ).toContain(line);
    });

    it('wraps its row at every width, so a control beside a long line is not cut off', () => {
        const source = readFileSync('src/lib/views/shared/Intro.svelte', 'utf8');
        const intro = source.slice(source.indexOf('.intro {'));
        expect(intro.slice(0, intro.indexOf('}'))).toContain('flex-wrap: wrap');
    });

    it('uses the chip surface, accent rule and prose size', () => {
        const source = readFileSync('src/lib/views/shared/Intro.svelte', 'utf8');
        expect(source).toContain('background: var(--chip)');
        expect(source).toContain('border-left: 3px solid var(--accent)');
        expect(source).toContain('font-size: var(--fs-md)');
    });
});
