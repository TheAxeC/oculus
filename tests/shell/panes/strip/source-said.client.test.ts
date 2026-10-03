// Layer 3, view test. What the source tab of a file it may not write says about a refused
// bookmark write, in Svelte's client runtime (tests/ui/frame/client-runtime.ts) over the fake
// document of tests/ui/frame/fake-dom.ts. The real Source tab is mounted over a read-only file,
// the controls it hands up to the pane's strip are mounted as the strip would, and the star is
// pressed; the bookmark write is refused by the stubbed server, and the sentence of the refusal
// is read from what the tab draws.
//
// The frame, the code window and the buttons are replaced by components that record the props
// they were handed; the star's own press, the write and the refusal are the app's.
//
// What this does NOT cover: how the line looks, which needs a browser and is seen on screen.

import { flushSync, mount, unmount } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Source from '../../../../src/lib/views/sources/source/Source.svelte';
import SnippetProbe from '../../../views/shared/SnippetProbe.svelte';
import { engineDir, loadConfig, textCatalog } from '../../../../src/lib/data/sources/config.ts';
import { sourceTabState } from '../../../../src/lib/state/sessions/source.svelte.ts';
import { STATE_KEY } from '../../../../src/lib/state/client/use.ts';
import { setCatalog } from '../../../../src/lib/state/shared/words/text.ts';
import { TAB_ACTIONS, TabActions } from '../../../../src/lib/ui/tabs/tab-actions.svelte.ts';
import { json, settle } from '../../../fixtures/client.ts';
import { domCase } from '../../../views/shared/commands/commands-fixture.ts';

const { drawn, frame, nothing } = vi.hoisted(() => ({
    drawn: { buttons: [] as { label: string; click: () => void }[] },
    frame: (anchor: unknown, props: { children?: (anchor: unknown) => void }) => {
        props.children?.(anchor);
    },
    nothing: () => undefined
}));

vi.mock('../../../../src/lib/ui/frame/Pane.svelte', () => ({ default: frame }));
vi.mock('../../../../src/lib/ui/frame/toolbar/Toolbar.svelte', () => ({ default: frame }));
vi.mock('../../../../src/lib/ui/frame/Empty.svelte', () => ({ default: nothing }));
vi.mock('../../../../src/lib/ui/display/Glyph.svelte', () => ({ default: nothing }));
vi.mock('../../../../src/lib/ui/controls/Chip.svelte', () => ({ default: nothing }));
vi.mock('../../../../src/lib/ui/forms/Prompt.svelte', () => ({ default: nothing }));
vi.mock('../../../../src/lib/views/shared/prose/Code.svelte', () => ({ default: nothing }));
vi.mock('../../../../src/lib/views/sources/source/Editor.svelte', () => ({ default: nothing }));
vi.mock('../../../../src/lib/views/shared/links/ProgramButton.svelte', () => ({
    default: nothing
}));
vi.mock('../../../../src/lib/ui/controls/ToolButton.svelte', () => ({
    default: (_anchor: unknown, props: { label: string; onclick?: () => void }) => {
        drawn.buttons.push({ label: props.label, click: props.onclick ?? (() => undefined) });
    }
}));

const catalog = textCatalog(loadConfig(engineDir()).config);
setCatalog(catalog);

const state = domCase();

beforeEach(() => {
    drawn.buttons.length = 0;
    vi.stubGlobal('window', {});
    vi.stubGlobal('fetch', (url: string, init?: { method?: string }) => {
        if (url.startsWith('/api/source'))
            return Promise.resolve(json({ ok: true, readonly: true }));
        if (url === '/api/fs') {
            return Promise.resolve(
                json({
                    home: '/home/reader',
                    current: 'main',
                    workspaces: [
                        {
                            name: 'main',
                            roots: [{ key: 'hub', dir: '/home/reader/hub', fixed: true }]
                        }
                    ],
                    dropped: []
                })
            );
        }
        if (init?.method === 'POST') {
            return Promise.resolve(
                json({ ok: false, error: 'the bookmarks file is read-only' }, 500)
            );
        }
        return Promise.resolve(new Response('print("hello")\n'));
    });
});
afterEach(() => vi.unstubAllGlobals());

/** Mount the tab over a read-only file and its controls as the strip would; press the star. */
async function pressedStar() {
    const actions = new TabActions();
    const context = new Map<unknown, unknown>([
        [STATE_KEY, state.client],
        [TAB_ACTIONS, actions]
    ]);
    const instance = { id: 'tab', view: 'source', state: sourceTabState('hub', 'run.py') };
    await state.client.source.loadSourceDraft('tab', 'hub', 'run.py');
    const tab = mount(Source, {
        target: state.root as unknown as Element,
        props: { instance },
        context
    });
    flushSync();
    await settle();
    const handed = actions.of('tab');
    if (handed === undefined) throw new Error('the tab handed up no controls');
    const strip = mount(SnippetProbe, {
        target: state.root as unknown as Element,
        props: { snippet: handed },
        context
    });
    flushSync();
    const star = drawn.buttons.find((one) => one.label === catalog['file.bookmark']);
    if (star === undefined) throw new Error('the strip drew no star');
    star.click();
    await settle();
    flushSync();
    return { tab, strip };
}

describe('a refused bookmark write on a file the source tab may not write', () => {
    // Revert: draw the line under the tab only while the text may be written.
    it('says the refusal under the tab, whose text is read-only', async () => {
        const { tab, strip } = await pressedStar();
        const said = catalog['file.bookmark_failed'].replace(
            '{0}',
            'the bookmarks file is read-only'
        );
        expect(state.root.textContent).toContain(said);
        void unmount(strip);
        void unmount(tab);
    });
});
