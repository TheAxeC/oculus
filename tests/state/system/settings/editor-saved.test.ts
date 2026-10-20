// Layer 2, client state tests. The family editor's Save (state/system/config/editors/writer.ts):
// once the write answers that the value sent is in force, the draft ends and the row is marked
// saved, which the editor (views/system/workbench/editors/Editor.svelte) says as "Saved." until the
// next edit, the value sent shown until the config channel's push brings it; a push that brings
// another value says the value changed. The emptied `read_limits` family is the case. The write is
// a stub that answers as the server does, and the push is the row read again from the merged
// configuration the page then holds. Reset of a family the workspace file sets sends the reset and
// shows the default until the push.
//
// It does not cover the line the editor draws, nor the empty family's line, which the look does,
// nor the server's write of the emptied family into the workspace file as every one of oculus's
// keys set to null (tests/server/edit/config-value.test.ts).

import { describe, expect, it, vi } from 'vitest';
import { fileRows, type ConfigRow } from '../../../../src/lib/state/system/config/rows.ts';
import { applyEdit, draftOf } from '../../../../src/lib/state/system/config/editors/draft.ts';
import { createEditorWriter } from '../../../../src/lib/state/system/config/editors/writer.ts';
import type { Lists } from '../../../../src/lib/state/system/config/editors/sources.ts';
import { shipped } from './fixture.ts';

const FILE = 'behavior.yml';
const text = (body: string) => ({ text: body, truncated: false, error: '', loading: false });

/** The `read_limits` row with `value` in force and a workspace file holding `settings`. */
function limits(value: unknown, settings = ''): ConfigRow {
    const row = fileRows(
        FILE,
        shipped[FILE],
        { read_limits: value },
        { workspace: { root: 'hub', path: '.oculus/workspaces/w.yml', text: text(settings) } }
    ).rows.find((one) => one.key === 'read_limits');
    if (row === undefined) throw new Error('no read_limits row');
    return row;
}

const ROWS = [
    {
        row: 'is marked saved once the file holds the empty family, until it is edited',
        pushed: {},
        saved: true,
        said: undefined
    },
    {
        row: 'says the file changed when the push after the answer brings another value',
        pushed: { next: 500 },
        saved: false,
        said: 'workbench.settings_changed_since'
    }
];

/** A writer over stubs that answer as the server does when the value lands. */
function writerOf(changed: string[]) {
    const write = vi.fn(() => Promise.resolve({ ok: true, changed, refused: [] }));
    const reset = vi.fn(() => Promise.resolve({ ok: true, changed, refused: [] }));
    const ended = vi.fn();
    const writer = createEditorWriter(write, {
        reset,
        changed: () => undefined,
        ended,
        held: () => true,
        lists: () => ({}) as Lists
    });
    return { writer, write, reset, ended };
}

describe('a family whose last entry is removed and saved', () => {
    it.each(ROWS)('$row', async ({ pushed, saved, said }) => {
        const row = limits({ next: 300 });
        const draft = draftOf(row);
        if (draft === null) throw new Error('no draft');
        const emptied = applyEdit(draft, { do: 'remove', index: 0 });
        const { writer, write, ended } = writerOf(['read_limits']);
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

describe('Reset on a family', () => {
    it('sends the reset of a family the workspace file sets and shows the default', async () => {
        const row = limits({ next: 300 }, 'settings:\n  read_limits: { next: 300 }\n');
        expect([row.own, row.line, row.modified]).toEqual([true, 2, true]);
        const { writer, write, reset } = writerOf(['read_limits']);
        await writer.reset(row);
        expect(reset).toHaveBeenCalledWith(FILE, 'read_limits');
        expect(write).not.toHaveBeenCalled();
        expect(writer.shown(row)).toEqual(row.default);
    });

    it('sends nothing for a family the workspace file does not set', async () => {
        const row = limits(shipped[FILE].read_limits.default);
        expect([row.own, row.modified]).toEqual([false, false]);
        const { writer, reset } = writerOf([]);
        await writer.reset(row);
        expect(reset).not.toHaveBeenCalled();
    });
});
