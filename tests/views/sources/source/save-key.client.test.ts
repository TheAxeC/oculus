// Layer 3, view-partial tests, in Svelte's client runtime so the tab's status and its asks run in
// their effects. Cmd+S in a source tab whose indentation is not known yet, because the config
// channel's first message has not arrived, saves the file: the tab of SaveKeyHost.svelte, built as
// Source.svelte builds one (views/sources/source/status/tab-asks.svelte.ts and
// views/shared/prose/editor/source-options.ts), says its status with a null indentation, and the
// workbench's save key (shell/window/source-keys.ts) asks that tab for its Save, which writes the
// draft through the source store to the fake server of source-server.ts.
//
// It does not cover the key's binding in the shell or the editor's own drawing, which the look
// does.

import { flushSync, mount, unmount } from 'svelte';
import { expect, it, onTestFinished, vi } from 'vitest';
import { sourceKeys } from '../../../../src/lib/shell/window/source-keys.ts';
import { engineDir, loadConfig, textCatalog } from '../../../../src/lib/data/sources/config.ts';
import { createClientState } from '../../../../src/lib/state/client/context.ts';
import { setCatalog } from '../../../../src/lib/state/shared/words/text.ts';
import { documentGlobals } from '../../../ui/tree/list/mini-dom.ts';
import { server } from '../../../state/sessions/source/source-server.ts';
import SaveKeyHost from './SaveKeyHost.svelte';

setCatalog(textCatalog(loadConfig(engineDir()).config));

it('saves the file on Cmd+S before the first config message has arrived', async () => {
    const env = server();
    // The client is made before the document is stubbed, as the page's is before it has focus.
    const client = createClientState();
    const { globals, body } = documentGlobals();
    for (const [name, value] of Object.entries(globals)) vi.stubGlobal(name, value);
    let tab: ReturnType<typeof mount> | null = null;
    onTestFinished(async () => {
        if (tab !== null) await unmount(tab);
        vi.unstubAllGlobals();
    });
    env.files.set('fixture/a.md', 'one\n');
    await env.source.loadSourceDraft('tab', 'fixture', 'a.md');
    await env.settled();
    env.source.editSourceDraft('tab', 'two\n');
    tab = mount(SaveKeyHost, {
        target: body,
        props: { client, source: env.source, id: 'tab', root: 'fixture', path: 'a.md' }
    });
    flushSync();
    const said = client.editorStatus.statusOf('tab');
    const saveTab = vi.fn(() => false);
    const appSave = vi.fn(() => Promise.resolve());
    const keys = sourceKeys(
        {
            ...client,
            ui: { ...client.ui, saveTab },
            apps: { ...client.apps, save: appSave }
        },
        () => ({ id: 'tab', view: 'source', state: {} })
    );
    keys.saveSource();
    flushSync();
    await env.settled();
    const seen = {
        options: client.selectors.editorOptions(),
        indent: said?.indent,
        file: env.files.get('fixture/a.md'),
        elsewhere: saveTab.mock.calls.length + appSave.mock.calls.length
    };
    console.info(`after Cmd+S before the config message: ${JSON.stringify(seen)}`);
    expect(seen).toEqual({ options: null, indent: null, file: 'two\n', elsewhere: 0 });
});
