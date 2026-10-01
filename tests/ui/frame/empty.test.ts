// Layer 3, primitive test. The empty and the error state of ui/frame/Empty.svelte rendered to HTML
// on the server: the message is text, the action follows the words, the error box is an alert with
// the error class, and a state with no error is the centred empty markup with neither.

import { describe, expect, it } from 'vitest';
import { createRawSnippet } from 'svelte';
import { render } from 'svelte/server';
import Empty from '../../../src/lib/ui/frame/Empty.svelte';
import { setGlyphs, setIcons } from '../../../src/lib/state/shared/words/text.ts';
import {
    engineDir,
    glyphCatalog,
    iconSet,
    loadConfig
} from '../../../src/lib/data/sources/config.ts';
import { clientContext, createClientState } from '../../fixtures/client.ts';

const { config } = loadConfig(engineDir());
setGlyphs(glyphCatalog(config));
setIcons(iconSet(config));
const context = clientContext(createClientState());

const retry = createRawSnippet(() => ({ render: () => '<button type="button">Retry</button>' }));

describe('the error state', () => {
    it('draws the message as text, never as markup', () => {
        const { body } = render(Empty, {
            context,
            props: { message: 'error: <b>unclosed</b> group', error: true }
        });
        expect(body).toContain('&lt;b>unclosed&lt;/b>');
        expect(body).not.toContain('<b>');
    });

    it('draws the action after the words', () => {
        const { body } = render(Empty, {
            context,
            props: { message: 'error: unclosed group', error: true, action: retry }
        });
        expect(body.indexOf('unclosed group')).toBeLessThan(body.indexOf('<button'));
    });

    it('draws no button without an action', () => {
        const { body } = render(Empty, {
            context,
            props: { message: 'error: unclosed group', error: true }
        });
        expect(body).not.toContain('<button');
    });

    it('draws the error box as an alert with the error class', () => {
        const { body } = render(Empty, {
            context,
            props: { message: 'error: unclosed group', error: true }
        });
        expect(body).toMatch(/<p class="empty[^"]*\berror\b[^"]*"[^>]*role="alert"/);
    });

    it('draws the centred empty markup without error', () => {
        const { body } = render(Empty, { context, props: { message: 'Nothing here.' } });
        expect(body).toContain('class="empty');
        // a plain empty state is no alert and carries no error class, so it is not announced
        expect(body).not.toContain('role="alert"');
        expect(body).not.toMatch(/class="empty[^"]*\berror\b/);
    });
});
