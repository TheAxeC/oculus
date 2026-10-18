// Layer 2, client state tests. The family editor's Save (state/system/config/editors/writer.ts):
// once the write answers that the file holds the value sent, the draft ends and the row is marked
// saved, which the editor (views/system/workbench/editors/Editor.svelte) says as "Saved." until the
// next edit, the value sent shown until the watcher's push brings it; a push that brings another
// value says the file changed. The emptied `read_limits` family of the shipped behavior.yml is the
// case. The write is a stub that answers as the server does, and the push is the row read again
// from the text the file then holds.
//
// It does not cover the line the editor draws, nor the empty family's line, which the look does.

import { describe, expect, it, vi } from 'vitest';
import { fileRows, type ConfigRow } from '../../../../src/lib/state/system/config/rows.ts';
import { applyEdit, draftOf } from '../../../../src/lib/state/system/config/editors/draft.ts';
import { createEditorWriter } from '../../../../src/lib/state/system/config/editors/writer.ts';
import type { Lists } from '../../../../src/lib/state/system/config/editors/sources.ts';
import { shipped } from './fixture.ts';

const FILE = 'behavior.yml';
const text = (body: string) => ({ text: body, truncated: false, error: '', loading: false });

/** The `read_limits` row of a behavior.yml holding `body`. */
function limits(body: string): ConfigRow {
    const row = fileRows(FILE, shipped[FILE], text(body)).rows.find(
        (one) => one.key === 'read_limits'
    );
    if (row === undefined) throw new Error('no read_limits row');
    return row;
}

const ROWS = [
    {
        row: 'is marked saved once the file holds the empty family, until it is edited',
        pushed: 'read_limits: {}\n',
        saved: true,
        said: undefined
    },
    {
        row: 'says the file changed when the push after the answer brings another value',
        pushed: 'read_limits: { next: 500 }\n',
        saved: false,
        said: 'workbench.settings_changed_since'
    }
];

describe('a family whose last entry is removed and saved', () => {
    it.each(ROWS)('$row', async ({ pushed, saved, said }) => {
        const row = limits('read_limits: { next: 300 }\n');
        const draft = draftOf(row);
        if (draft === null) throw new Error('no draft');
        const emptied = applyEdit(draft, { do: 'remove', index: 0 });
        const write = vi.fn(() =>
            Promise.resolve({ ok: true, changed: ['read_limits'], refused: [] })
        );
        const ended = vi.fn();
        const writer = createEditorWriter(write, {
            changed: () => undefined,
            ended,
            held: () => true,
            lists: () => ({}) as Lists
        });
        await writer.save(row, emptied);
        expect(write).toHaveBeenCalledWith(FILE, 'read_limits', {}, { next: 300 });
        expect([writer.saved(row), writer.shown(row)]).toEqual([true, {}]);
        expect(ended).toHaveBeenCalledWith(row);
        writer.pushed(limits(pushed));
        expect([writer.saved(row), writer.shown(row)]).toEqual([saved, undefined]);
        expect(writer.said(row)?.key).toBe(said);
        writer.clear(row);
        expect(writer.saved(row)).toBe(false);
    });
});
