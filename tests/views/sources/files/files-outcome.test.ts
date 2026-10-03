// Layer 4, test. The Files view's outcome line for an ask to reveal a path.

import { beforeEach, describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import Files from '../../../../src/lib/views/sources/files/Files.svelte';
import {
    engineDir,
    glyphCatalog,
    loadConfig,
    textCatalog
} from '../../../../src/lib/data/sources/config.ts';
import { setCatalog, setGlyphs } from '../../../../src/lib/state/shared/words/text.ts';
import type { Instance } from '../../../../src/lib/state/workbench/layout/index.ts';
import { clientContext, createClientState, type ClientState } from '../../../fixtures/client.ts';

const { config } = loadConfig(engineDir());
const catalog = textCatalog(config);
setCatalog(catalog);
setGlyphs(glyphCatalog(config));

let client: ClientState;

beforeEach(() => {
    client = createClientState();
});

function instance(state: unknown = {}): Instance {
    return { id: 'files-one', view: 'files', state };
}

describe('the outcome line of an ask to show a path', () => {
    function drawn(state: Record<string, unknown>): string {
        client.ui.setInstanceState('files-one', state);
        return render(Files, { context: clientContext(client), props: { instance: instance() } })
            .body;
    }

    function words(key: string, ...args: string[]): string {
        return args.reduce((held, arg, at) => held.replace(`{${at}}`, arg), catalog[key]);
    }

    const asked = { root: 'hub', path: 'funding/gone/CALL.md' };

    // Revert: in lineOf of views/shared/explorer/tree/ShowPath.svelte, answer '' for every outcome.
    it('says a path is not there and names the nearest folder selected in its place', () => {
        const body = drawn({
            revealed: { kind: 'missing', asked, shown: { root: 'hub', path: 'funding' }, error: '' }
        });
        expect(body).toContain('data-fs-revealed');
        expect(body).toContain(
            words('files.reveal_missing', 'hub/funding/gone/CALL.md', 'hub/funding')
        );
    });

    // Revert: in lineOf, say `reveal_missing` for an unread folder too.
    it('says which folder on the way could not be read, and why', () => {
        const body = drawn({
            revealed: { kind: 'unread', asked, shown: { root: 'hub', path: '' }, error: 'EACCES' }
        });
        expect(body).toContain(
            words('files.reveal_unread', 'hub/funding/gone/CALL.md', 'hub', 'EACCES')
        );
    });

    // Revert: in lineOf, say `reveal_missing` for a root the workspace lacks.
    it('says the workspace has no such root', () => {
        const body = drawn({
            revealed: {
                kind: 'no-root',
                asked: { root: 'gone', path: 'a' },
                shown: null,
                error: ''
            }
        });
        expect(body).toContain(words('files.reveal_no_root', 'gone/a', 'gone'));
    });

    // Revert: in lineOf of views/shared/explorer/tree/ShowPath.svelte, drop the `no-roots` line.
    it('says the file browser could not read its roots, and why', () => {
        const body = drawn({
            revealed: { kind: 'no-roots', asked, shown: null, error: 'boom' }
        });
        expect(body).toContain(words('files.reveal_no_roots', 'hub/funding/gone/CALL.md', 'boom'));
    });

    // Revert: in lineOf, draw a line for a `found` outcome.
    it('draws no line for a path found as asked, or before any ask', () => {
        const found = drawn({ revealed: { kind: 'found', asked, shown: asked, error: '' } });
        // the requested path needs no correction message
        expect(found).not.toContain('data-fs-revealed');
        const untouched = drawn({});
        // no request means there is no outcome to explain
        expect(untouched).not.toContain('data-fs-revealed');
    });
});
