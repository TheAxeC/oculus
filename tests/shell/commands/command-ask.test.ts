// Layer 4, shell test. What a project command puts over the page, rendered to HTML on the server
// from the commands store: nothing while neither the form nor a question is open, the form with its
// heading and the fields of the command being edited, and the question of an unapproved command.
//
// The catalog is the real config. What this does NOT cover: the focus, Enter, Escape and Tab of
// the boxes, a save from the form, and the looks, which need a DOM and are seen on screen.

import { render } from 'svelte/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import CommandAsk from '../../../src/lib/shell/commands/CommandAsk.svelte';
import { engineDir, loadConfig, textCatalog } from '../../../src/lib/data/sources/config.ts';
import { setCatalog } from '../../../src/lib/state/shared/words/text.ts';
import { clientContext, createClientState, json, type ClientState } from '../../fixtures/client.ts';

const catalog = textCatalog(loadConfig(engineDir()).config);
setCatalog(catalog);

const REPO = '/work/repo';

let client: ClientState;

beforeEach(() => {
    client = createClientState();
});

afterEach(() => vi.unstubAllGlobals());

function drawn(): string {
    return render(CommandAsk, { context: clientContext(client) }).body;
}

describe('the commands over the page', () => {
    it('draws nothing while no form and no question is open', () => {
        expect(drawn()).not.toContain('role="dialog"');
    });

    it('draws the form for a new command under its heading, with empty fields', () => {
        client.commands.openForm(REPO, null);
        const html = drawn();
        expect(html).toContain('role="dialog"');
        expect(html).toContain(`aria-label="${catalog['commands.form_add']}"`);
        expect(html).toContain(`aria-label="${catalog['commands.field_name']}"`);
        expect(html).toContain(`>${catalog['commands.save']}<`);
    });

    it('draws the form for a command being edited under the edit heading, with its fields', () => {
        client.commands.openForm(REPO, { name: 'lint', run: 'npm run lint', cwd: 'web' });
        const html = drawn();
        expect(html).toContain(`aria-label="${catalog['commands.form_edit']}"`);
        expect(html).toContain('value="lint"');
        expect(html).toContain('npm run lint');
        expect(html).toContain('value="web"');
    });

    it('draws no form once it is closed', () => {
        client.commands.openForm(REPO, null);
        client.commands.closeForm();
        expect(drawn()).not.toContain('role="dialog"');
    });
});

describe('the question of an unapproved chain', () => {
    it('lists every line of the chain in run order, a line outside the repository with its folder', async () => {
        const lines = [
            { folder: '.', run: 'make build' },
            { folder: 'sub', run: 'make test' }
        ];
        vi.stubGlobal('fetch', () => Promise.resolve(json({ approve: lines })));
        await client.commands.press(REPO, 'test', 'file');
        const html = drawn();
        expect(html).toContain(catalog['commands.approve_ask'].replace('{0}', 'test'));
        expect(html).toContain('make build');
        expect(html).toContain(
            catalog['commands.approve_in'].replace('{0}', 'make test').replace('{1}', 'sub')
        );
        expect(html.indexOf('make build')).toBeLessThan(html.indexOf('make test'));
    });
});
