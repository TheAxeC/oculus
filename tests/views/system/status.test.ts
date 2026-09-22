// Layer 4, view test. The Status view's hooks section draws the block state/sessions/hooks.ts
// builds from the page's origin, with the control that copies it, and draws nothing without an
// origin.

import { readFileSync } from 'node:fs';
import { render } from 'svelte/server';
import { beforeEach, describe, expect, it } from 'vitest';
import Hooks from '../../../src/lib/views/system/status/Hooks.svelte';
import { hooksSnippet } from '../../../src/lib/state/sessions/hooks.ts';
import { engineDir, loadConfig, textCatalog } from '../../../src/lib/data/sources/config.ts';
import { setCatalog } from '../../../src/lib/state/words/text.ts';
import { clientContext, createClientState, type ClientState } from '../../fixtures/client.ts';

let client: ClientState;

beforeEach(() => {
    client = createClientState();
});

const config = loadConfig(engineDir()).config;
const catalog = textCatalog(config);
setCatalog(catalog);

/** The markup's text as it reads, since Svelte writes `&` and `<` as entities. */
function plain(body: string): string {
    return body.replaceAll('&amp;', '&').replaceAll('&lt;', '<');
}

/** What the section printed for copying, or null when it printed nothing. */
function pre(body: string): string | null {
    const found = /<pre[^>]*>([\s\S]*?)<\/pre>/.exec(body);
    return found === null ? null : plain(found[1]);
}

describe('the status view hooks section', () => {
    it('prints the block for the origin it was given', () => {
        const body = render(Hooks, {
            context: clientContext(client),
            props: { origin: 'http://127.0.0.1:8793' }
        }).body;
        const printed = pre(body);
        expect(printed).not.toBeNull();
        expect(JSON.parse(printed ?? 'null')).toEqual(
            JSON.parse(hooksSnippet('http://127.0.0.1:8793'))
        );
    });

    it('names the file the block goes in and carries the copy control with its label', () => {
        const body = plain(
            render(Hooks, {
                context: clientContext(client),
                props: { origin: 'http://127.0.0.1:8790' }
            }).body
        );
        expect(body).toContain(catalog['status.hooks_title']);
        expect(body).toContain('~/.claude/settings.json');
        expect(body).toContain(catalog['status.hooks_copy']);
    });

    it('draws nothing where there is no origin to post to', () => {
        const body = render(Hooks, { context: clientContext(client), props: { origin: '' } }).body;
        expect(pre(body)).toBeNull();
        // there is no origin to post a hook to, so the block is not drawn at all
        expect(body).not.toContain(catalog['status.hooks_title']);
    });

    it('presses that control through the toolbar primitive', () => {
        const source = readFileSync('src/lib/views/system/status/Hooks.svelte', 'utf8');
        expect(source).toContain("import ToolButton from '$lib/ui/controls/ToolButton.svelte'");
        expect(source).toContain("<ToolButton label={t('status.hooks_copy')} onclick={copy} />");
    });
});
