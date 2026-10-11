// Layer 3, view-partial tests. Opening a file of the file browser (views/shared/explorer/
// opening.ts): which tab a press opens, and whether the press keeps it, arms a keep for the next
// press, or asks the pane to put the keyboard in the kept tab. Every store call is a fake that
// records what it was asked.
//
// It does not cover the tree that raises the press or the pane that draws the tab, which the look
// does.

import { describe, expect, it } from 'vitest';
import { openRow } from '../../../../src/lib/views/shared/explorer/opening.ts';
import { tabForKind } from '../../../../src/lib/state/workbench/layout/instance.ts';
import type { Opener } from '../../../../src/lib/views/shared/explorer/opening.ts';
import type { TreeRow } from '../../../../src/lib/state/sources/fs.ts';

const ROW: TreeRow = {
    root: 'hub',
    path: 'notes/a.md',
    name: 'a.md',
    kind: 'file',
    size: 12,
    depth: 1,
    open: false
};

/** An opener over fakes: the calls it recorded, in order, as readable lines. */
function make(kind: string) {
    const calls: string[] = [];
    const opener: Opener = {
        openView: (view, _state, _where, options) => {
            calls.push(`open ${view} preview=${String(options?.preview)}`);
            return 'tab-1';
        },
        keepPreview: (id) => {
            calls.push(`keep ${id}`);
        },
        readFileKind: () => Promise.resolve({ kind }) as ReturnType<Opener['readFileKind']>,
        opens: { holds: () => false, editorFor: () => null },
        armKeep: (id, pressedAt) => {
            calls.push(`arm ${id} at ${pressedAt}`);
        },
        askFocus: (id) => {
            calls.push(`ask ${id}`);
        }
    };
    return { opener, calls };
}

describe('opening a file of the file browser', () => {
    it.each([
        {
            row: 'a double click from a pointer press',
            preview: false,
            at: 40,
            calls: ['open source preview=false', 'keep tab-1', 'ask tab-1']
        },
        {
            row: 'a double click from a key',
            preview: false,
            at: undefined,
            calls: ['open source preview=false', 'keep tab-1']
        },
        {
            row: 'a single click from a pointer press',
            preview: true,
            at: 40,
            calls: ['open source preview=true', 'arm tab-1 at 40']
        },
        {
            row: 'a single click from a key',
            preview: true,
            at: undefined,
            calls: ['open source preview=true']
        }
    ])('does $calls for $row', async ({ preview, at, calls }) => {
        const made = make('text');
        await openRow(made.opener, ROW, preview, at);
        expect(made.calls).toEqual(calls);
    });

    it.each([
        { kind: 'text', view: 'source' },
        { kind: 'missing', view: 'source' },
        { kind: 'html', view: 'document' },
        { kind: 'image', view: 'file' },
        { kind: 'pdf', view: 'file' },
        { kind: 'other', view: 'file' }
    ])('opens the $view view for a file of kind $kind', async ({ kind, view }) => {
        const made = make(kind);
        await openRow(made.opener, ROW, true);
        expect(made.calls[0]).toBe(`open ${view} preview=true`);
        expect(
            tabForKind(kind, ROW.root, ROW.path, ROW.size, {
                holds: () => false,
                editorFor: () => null
            }).view
        ).toBe(view);
    });
});
