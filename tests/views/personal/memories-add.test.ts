// Layer 4, view test. The Memories wall's add: the file chooser the view draws, and what a choice
// of pictures hands to the upload.
//
// The chooser primitive is wrapped by a recorder that renders the real one and keeps the props the
// view gave it, so a case hands the view a choice the way the primitive would. FileReader is a
// stub that reads each file as its own name, since Node has none. What this does NOT cover: the
// press on the add control opening the browser's file dialog, which is the primitive's `open()`
// reached through `bind:this`, and a server render binds no element; the look on landing sees it.

import { render } from 'svelte/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Memories from '../../../src/lib/views/personal/memories/Memories.svelte';
import FileChooser from '../../../src/lib/ui/forms/FileChooser.svelte';
import {
    engineDir,
    glyphCatalog,
    loadConfig,
    textCatalog
} from '../../../src/lib/data/sources/config.ts';
import { setCatalog, setGlyphs } from '../../../src/lib/state/shared/words/text.ts';
import type { Instance } from '../../../src/lib/state/workbench/layout/index.ts';
import { clientContext, createClientState, type ClientState } from '../../fixtures/client.ts';

vi.mock('../../../src/lib/ui/forms/FileChooser.svelte', async (original) =>
    (await import('../../checks/diagrams/counted.ts')).counted(
        await original<Record<string, unknown>>(),
        'default'
    )
);

/** The props each drawn file chooser was given, in the order they were drawn. */
function drawnChoosers(): Record<string, unknown>[] {
    return vi
        .mocked(FileChooser as unknown as (...args: unknown[]) => unknown)
        .mock.calls.map((call) => call[1] as Record<string, unknown>);
}

const config = loadConfig(engineDir()).config;
setCatalog(textCatalog(config));
setGlyphs(glyphCatalog(config));

const instance: Instance = { id: 'memories-one', view: 'memories', state: {} };

let client: ClientState;

beforeEach(() => {
    client = createClientState();
    vi.mocked(FileChooser as unknown as (...args: unknown[]) => unknown).mockClear();
    vi.stubGlobal(
        'FileReader',
        class {
            result = '';
            onload: (() => void) | null = null;
            onerror: (() => void) | null = null;
            readAsDataURL(file: File): void {
                this.result = `data:image/png;base64,${file.name}`;
                this.onload?.();
            }
        }
    );
});

afterEach(() => vi.unstubAllGlobals());

describe('adding pictures to the wall', () => {
    it('draws one chooser of JPEG and PNG pictures, several at once', () => {
        client.memories.hold([]);
        const body = render(Memories, { context: clientContext(client), props: { instance } }).body;
        expect(body).toContain('type="file"');
        const choosers = drawnChoosers();
        expect(choosers).toHaveLength(1);
        expect(choosers[0]).toMatchObject({ accept: 'image/jpeg,image/png', multiple: true });
    });

    it('hands every picture of a choice of two to the upload, then asks the folder again', async () => {
        const uploaded: string[] = [];
        const reload = vi.fn();
        const context = clientContext({
            ...client,
            memories: { ...client.memories, reload },
            writes: {
                ...client.writes,
                addMemory: (name: string, data: string) => {
                    uploaded.push(`${name}:${data}`);
                    return Promise.resolve({ ok: true, changed: [name], refused: [] });
                }
            }
        });
        client.memories.hold([]);
        expect(render(Memories, { context, props: { instance } }).body).toContain('data-memories');
        const choose = drawnChoosers()[0]?.onchoose as ((files: File[]) => void) | undefined;
        expect(choose).toBeTypeOf('function');
        choose?.([new File(['a'], 'one.png'), new File(['b'], 'two.jpg')]);
        await vi.waitFor(() => {
            expect(reload).toHaveBeenCalledTimes(1);
        });
        expect(uploaded).toEqual([
            'one.png:data:image/png;base64,one.png',
            'two.jpg:data:image/png;base64,two.jpg'
        ]);
    });
});
