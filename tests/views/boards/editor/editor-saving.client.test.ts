// Layer 3, view test. The manifest editor mounted in Svelte's client runtime
// (tests/ui/frame/client-runtime.ts) over the fake document, to read the words its status tag
// shows through a save: "saving" for the editor's own write, the summary while a write of another
// view is out, and the failure after a refused save.
//
// The pane, the toolbars, the buttons, the tag and the field frames are replaced by components that
// record the props they were handed, so Save is pressed by calling the handler the view gave its
// button. What this does NOT cover: the look of the bar, which is seen on screen.

import { flushSync, mount, unmount } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Editor from '../../../../src/lib/views/boards/editor/Editor.svelte';
import { engineDir, loadConfig, textCatalog } from '../../../../src/lib/data/sources/config.ts';
import { STATE_KEY } from '../../../../src/lib/state/client/use.ts';
import { setCatalog, t } from '../../../../src/lib/state/shared/words/text.ts';
import { json, settle } from '../../../fixtures/client.ts';
import { SNAPSHOT } from '../../../state/boards/board/board-fixture.ts';
import { domCase } from '../../shared/commands/commands-fixture.ts';

const { drawn, around, nothing } = vi.hoisted(() => ({
    drawn: {
        tags: [] as { label: string }[],
        buttons: [] as { label: string; onclick: () => void }[]
    },
    around: (anchor: unknown, props: Record<string, ((anchor: unknown) => void) | undefined>) => {
        props.toolbar?.(anchor);
        props.bar?.(anchor);
        props.children?.(anchor);
    },
    nothing: () => undefined
}));

vi.mock('../../../../src/lib/ui/frame/Pane.svelte', () => ({ default: around }));
vi.mock('../../../../src/lib/ui/frame/toolbar/Toolbar.svelte', () => ({ default: around }));
vi.mock('../../../../src/lib/ui/frame/Empty.svelte', () => ({ default: nothing }));
vi.mock('../../../../src/lib/ui/forms/Field.svelte', () => ({ default: nothing }));
vi.mock('../../../../src/lib/ui/controls/Tag.svelte', () => ({
    default: (_anchor: unknown, props: { label: string }) => {
        drawn.tags.push(props);
    }
}));
vi.mock('../../../../src/lib/ui/controls/ToolButton.svelte', () => ({
    default: (_anchor: unknown, props: { label: string; onclick: () => void }) => {
        drawn.buttons.push(props);
    }
}));

const { config } = loadConfig(engineDir());
const catalog = textCatalog(config);
setCatalog(catalog);

const state = domCase();

const TAB = 'editor-one';

/** The writes the stub holds: each manifest post waits for the answer the case gives it. */
let posts: { land: (answer: Response) => void }[] = [];

beforeEach(() => {
    drawn.tags.length = 0;
    drawn.buttons.length = 0;
    posts = [];
    state.client.writes.setToken('token');
    state.client.entities.receive({ channel: 'portfolio', version: 1, payload: SNAPSHOT });
    state.client.entities.receive({
        channel: 'config',
        version: 1,
        payload: { config, text: catalog, findings: [] }
    });
    vi.stubGlobal(
        'fetch',
        () =>
            new Promise<Response>((land) => {
                posts.push({ land });
            })
    );
});

afterEach(() => vi.unstubAllGlobals());

/** The editor mounted for `alpha` with one edit waiting to be saved. */
function editor(): ReturnType<typeof mount> {
    state.client.manifestDraft.editManifest(TAB, 'alpha', 'status.line', 'typed');
    const app = mount(Editor, {
        target: state.root as unknown as Element,
        props: { instance: { id: TAB, view: 'editor', state: { id: 'alpha' } } },
        context: new Map<unknown, unknown>([[STATE_KEY, state.client]])
    });
    flushSync();
    return app;
}

/** The words the status tag shows now. */
function status(): string {
    return drawn.tags.at(-1)?.label ?? '';
}

/** Press Save: the handler the view gave its button. */
function save(): void {
    const button = drawn.buttons.find((one) => one.label === catalog['editor.save']);
    if (button === undefined) throw new Error('no Save button was drawn');
    button.onclick();
    flushSync();
}

describe('the status words of the editor', () => {
    // Revert: leave the `saving` state out of save() in Editor.svelte.
    it("audits that they are saving during the editor's own save and the summary after it", async () => {
        const app = editor();
        expect(status()).toBe(t('editor.dirty', 1));

        save();
        await settle();
        flushSync();
        expect(status()).toBe(t('editor.saving'));

        posts[0].land(json({ ok: true, changed: ['status.line'], refused: [] }));
        await settle();
        flushSync();
        expect(status()).toBe(t('editor.clean'));
        void unmount(app);
    });

    it('audits that they are the summary again after a save the server refused, with the failure said', async () => {
        const app = editor();

        save();
        await settle();
        posts[0].land(json({ ok: false, error: 'refused', changed: [], refused: [] }, 409));
        await settle();
        flushSync();

        expect(status()).toBe(t('editor.dirty', 1));
        expect(state.root.textContent).toContain(t('editor.failed', 'refused'));
        void unmount(app);
    });

    it('audits that they are not saving once a save that threw has ended', async () => {
        const app = editor();

        save();
        await settle();
        posts[0].land(new Response('not json', { status: 500 }));
        await settle();
        flushSync();

        expect(status()).not.toBe(t('editor.saving'));
        void unmount(app);
    });
});
