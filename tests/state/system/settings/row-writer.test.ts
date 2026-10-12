// Layer 2, client state tests. Which rows of the Settings view are written when the file they are
// read from lacks the key (state `missing`): a key of the hub list, whose primary hub layer takes
// the key and adds it (the first choice of `wallpaper.image`), is written; a key the engine's file
// alone holds is not, and neither is a hub key while the workspace has no primary hub, which gives
// the row no layer.
//
// What this does NOT cover: the server's write into the layer file (tests/routes/edit/
// config-key.test.ts).

import { describe, expect, it, vi } from 'vitest';
import { createRowWriter } from '../../../../src/lib/state/system/config/write.ts';
import { fileRows, type ConfigRow } from '../../../../src/lib/state/system/config/rows.ts';
import type { Lists } from '../../../../src/lib/state/system/config/editors/sources.ts';
import { shipped } from './fixture.ts';

const FILE = 'appearance.yml';
const ENGINE_TEXT = 'wallpaper:\n  dim: 0.5\n';
const text = (body: string) => ({ text: body, truncated: false, error: '', loading: false });

/**
 * The row of a key of `appearance.yml` over an engine file that lacks it, with or without a layer.
 */
function rowOf(key: string, layer: boolean): ConfigRow {
    const result = fileRows(
        FILE,
        shipped[FILE],
        text(ENGINE_TEXT),
        layer ? { text: text(''), present: false } : undefined
    );
    const row = result.rows.find((one) => one.key === key);
    if (row === undefined) throw new Error(`no row ${key}`);
    expect(row.state).toBe('missing');
    return row;
}

/** What the writer sends for one input to a row. */
async function sent(row: ConfigRow, input: string): Promise<unknown[]> {
    const write = vi.fn((_file: string, _key: string, _value: unknown) =>
        Promise.resolve({ ok: true, changed: [], refused: [] })
    );
    const writer = createRowWriter(
        write,
        () => undefined,
        () => ({}) as Lists
    );
    await writer.submit(row, input);
    return write.mock.calls;
}

describe('a row whose key the file lacks', () => {
    it('is written for a key of the hub list when the primary hub has a layer for it', async () => {
        const row = rowOf('wallpaper.image', true);
        expect(row.hub?.present).toBe(false);
        expect(await sent(row, 'lab/x.jpg')).toEqual([[FILE, 'wallpaper.image', 'lab/x.jpg']]);
    });

    it('is not written for a key of the hub list while the workspace has no primary', async () => {
        const row = rowOf('wallpaper.image', false);
        expect(row.hub).toBeNull();
        expect(await sent(row, 'lab/x.jpg')).toEqual([]);
    });

    it('is not written for a key the engine file alone holds', async () => {
        const row = rowOf('wallpaper.themes', true);
        expect(row.hub).toBeNull();
        expect(await sent(row, 'all')).toEqual([]);
    });
});
