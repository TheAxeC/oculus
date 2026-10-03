// Layer 4, view test. A repository whose file and saved commands both hold a name, mounted in
// Svelte's client runtime (tests/ui/frame/client-runtime.ts) over the fake document of
// tests/ui/frame/fake-dom.ts, where a keyed each block throws on a key it meets twice. The real
// CommandBar is mounted; the bits-ui menus and the buttons it draws are replaced by components
// that record the props they were handed, so a case presses the handler the bar gave a button.
//
// What this does NOT cover: what the menus and buttons look like and do on a pointer, which need a
// browser and are seen on screen.

import { flushSync, mount, unmount } from 'svelte';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CommandBar from '../../../../src/lib/views/shared/sessions/CommandBar.svelte';
import { engineDir, loadConfig, textCatalog } from '../../../../src/lib/data/sources/config.ts';
import { STATE_KEY } from '../../../../src/lib/state/client/use.ts';
import { setCatalog } from '../../../../src/lib/state/shared/words/text.ts';
import { json, settle } from '../../../fixtures/client.ts';
import { serveInto } from '../../../state/sessions/terminal/commands-fixture.ts';
import { REPO, SHARED, command, domCase } from './commands-fixture.ts';

type Item = { id: string; label: string; items?: Item[] };

const drawn = vi.hoisted(() => ({
    buttons: [] as { label: string; press: () => void }[],
    menus: [] as { label: string; items: Item[]; pick: (id: string) => void }[]
}));

vi.mock('../../../../src/lib/ui/controls/ToolButton.svelte', () => ({
    default: (_anchor: unknown, props: { label: string; onclick?: () => void }) => {
        drawn.buttons.push({ label: props.label, press: props.onclick ?? (() => undefined) });
    }
}));
vi.mock('../../../../src/lib/ui/menu/ContextMenu.svelte', () => ({
    default: (anchor: unknown, props: { children: (anchor: unknown) => void }) => {
        props.children(anchor);
    }
}));
vi.mock('../../../../src/lib/ui/menu/Menu.svelte', () => ({
    default: (
        _anchor: unknown,
        props: { label: string; items: Item[]; onpick: (id: string) => void }
    ) => {
        drawn.menus.push({ label: props.label, items: props.items, pick: props.onpick });
    }
}));
vi.mock('../../../../src/lib/ui/controls/Tag.svelte', () => ({ default: () => undefined }));
vi.mock('../../../../src/lib/views/shared/writes/AskConfirm.svelte', () => ({
    default: () => undefined
}));

const catalog = textCatalog(loadConfig(engineDir()).config);
setCatalog(catalog);

const state = domCase();

beforeEach(() => {
    drawn.buttons.length = 0;
    drawn.menus.length = 0;
});

/** The bar mounted over this list, which is also what the server answers when it is asked. */
async function mounted(answer: { commands: unknown[]; findings: unknown[] }) {
    serveInto(state.asked, (call) => (call.method === 'GET' ? json(answer) : json({ ok: true })));
    state.client.commands.seed(REPO, answer as never);
    const app = mount(CommandBar, {
        target: state.root as unknown as Element,
        props: { repo: REPO },
        context: new Map([[STATE_KEY, state.client]])
    });
    flushSync();
    await settle();
    return app;
}

const file = catalog['commands.word_file'];
const saved = catalog['commands.word_saved'];

describe('the command bar over a name two sources hold', () => {
    it('audits that both commands mount, each with its source beside the name', async () => {
        const app = await mounted(SHARED);
        expect(drawn.buttons.map((one) => one.label).slice(0, 2)).toEqual([
            `build (${file})`,
            `build (${saved})`
        ]);
        expect(
            state.root
                .all('data-command-source')
                .map((one) => one.getAttribute('data-command-source'))
        ).toEqual(['file', 'saved']);
        void unmount(app);
    });

    it('audits that a press sends the source of the button pressed', async () => {
        const app = await mounted(SHARED);
        drawn.buttons[1].press();
        await settle();
        const posts = state.asked.filter((call) => call.url === '/api/terminal');
        expect(posts.map((call) => call.body)).toMatchObject([
            { action: 'command', repo: REPO, name: 'build', source: 'saved' }
        ]);
        void unmount(app);
    });

    it('audits that the pair after the fifth button is two overflow items under distinct ids', async () => {
        const first = ['a', 'b', 'c', 'd', 'e'].map((name) => command(name, 'file'));
        const app = await mounted({ commands: [...first, ...SHARED.commands], findings: [] });
        const menu = drawn.menus.find((one) => one.label === catalog['commands.more']);
        const runs = menu?.items.filter((one) => one.id.startsWith('run:'));
        expect(runs?.map((one) => [one.id, one.label])).toEqual([
            ['run:file:build', `build (${file})`],
            ['run:saved:build', `build (${saved})`]
        ]);
        menu?.pick('run:saved:build');
        await settle();
        expect(
            state.asked.filter((call) => call.body !== null).map((call) => call.body)
        ).toMatchObject([{ action: 'command', name: 'build', source: 'saved' }]);
        void unmount(app);
    });

    it('audits that a name only one source holds is drawn without its source', async () => {
        const app = await mounted({
            commands: [command('build', 'file'), command('deploy', 'saved')],
            findings: []
        });
        expect(drawn.buttons.map((one) => one.label).slice(0, 2)).toEqual(['build', 'deploy']);
        void unmount(app);
    });

    it('audits that the list is held while the bar is mounted and let go when it unmounts', async () => {
        const app = await mounted(SHARED);
        expect(state.client.commands.commands(REPO)?.commands).toHaveLength(2);
        void unmount(app);
        await settle();
        expect(state.client.commands.commands(REPO)).toBeNull();
    });
});
