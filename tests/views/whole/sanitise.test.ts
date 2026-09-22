// Layer 4, view test. What a hub file, a feed or a transcript puts on the page passes the sanitiser
// on the way: the title a card draws, the document body a project tab draws, and the assistant turn
// a transcript draws.
//
// What this does NOT cover: the filtering itself. DOMPurify needs a document and this suite runs in
// node, so `sanitise` returns its argument here and no script is removed in this file; what is
// checked is that each of the three draws the sanitiser's result and nothing around it, which is
// the part that would rot if a later site drew the raw value instead. tests/ui/html.test.ts holds
// the same note and the profile the browser is given, and tests/browser/workbench/sanitise.spec.ts
// presses the filtering itself in Chrome, the card title among it.

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { marked } from 'marked';
import { render } from 'svelte/server';
import { beforeEach, describe, expect, it } from 'vitest';
import Card from '../../../src/lib/ui/frame/Card.svelte';
import { inlineMarkdown, sanitise } from '../../../src/lib/ui/html.ts';
import { noop } from '../../fixtures/doubles.ts';
import { clientContext, createClientState, type ClientState } from '../../fixtures/client.ts';

let client: ClientState;

beforeEach(() => {
    client = createClientState();
});

const VIEWS = 'src/lib/views';

function files(at: string): string[] {
    return readdirSync(at)
        .flatMap((name) => {
            const path = join(at, name);
            return statSync(path).isDirectory() ? files(path) : [path];
        })
        .filter((path) => path.endsWith('.svelte'));
}

describe('a title out of a feed', () => {
    const title = 'Attention <script>alert(1)</script> is all you need';

    it('reaches the card as the sanitiser leaves it', () => {
        const body = render(Card, {
            context: clientContext(client),
            props: { id: 'one', cursor: false, title, titleHtml: inlineMarkdown(title) }
        }).body;
        expect(body).toContain(sanitise(inlineMarkdown(title)));
        expect(body).toContain('Attention');
    });

    it('reaches a clickable card title the same way', () => {
        const body = render(Card, {
            context: clientContext(client),
            props: {
                id: 'two',
                cursor: false,
                title,
                titleHtml: inlineMarkdown(title),
                ontitle: noop
            }
        }).body;
        expect(body).toContain('class="open ');
        expect(body).toContain(sanitise(inlineMarkdown(title)));
    });

    it('is built with inlineMarkdown by every card that draws one', () => {
        const built: string[] = [];
        for (const file of files(VIEWS)) {
            for (const match of readFileSync(file, 'utf8').matchAll(/titleHtml=\{([^}]*)\}/g)) {
                built.push(`${file}: ${match[1]}`);
            }
        }
        expect(built.length).toBeGreaterThan(0);
        expect(built.filter((one) => !one.includes(': inlineMarkdown('))).toEqual([]);
    });
});

describe('a body rendered from a file on disk', () => {
    it('is drawn through the sanitiser in the project tab', () => {
        const source = readFileSync(join(VIEWS, 'boards/project/Project.svelte'), 'utf8');
        expect(source).toContain('{@html sanitise(shown.html)}');
        // every rendered body goes through the sanitiser, so the raw one is never drawn
        expect(source).not.toContain('{@html shown.html}');
    });

    it('is drawn through the sanitiser in the transcript', () => {
        const source = readFileSync(join(VIEWS, 'sessions/transcript/Transcript.svelte'), 'utf8');
        expect(source).toContain('{@html sanitise(turn.html)}');
        // every rendered body goes through the sanitiser, so the raw one is never drawn
        expect(source).not.toContain('{@html turn.html}');
    });

    it('keeps the words of a document and the address of its links', () => {
        const document = marked.parse('A line with a [link](one.md).\n', { async: false });
        const drawn = sanitise(document);
        expect(drawn).toContain('A line with a');
        expect(drawn).toContain('href="one.md"');
    });
});
