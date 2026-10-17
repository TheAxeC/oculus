// Layer 3, primitive tests. ui/tree/list/VirtualRows.svelte over a list that shrinks while rows
// past its new end are drawn, the list written from inside an effect, mounted on the document of
// tests/ui/tree/list/mini-dom.ts: the list asks its caller for no key and no item body at an index
// past the end, throws nothing, and draws the rows left.
//
// It does not cover scrolling or measuring, which the look does.

import { flushSync, mount, unmount } from 'svelte';
import { expect, it, onTestFinished, vi } from 'vitest';
import { cell } from '../../frame/rooted.svelte.ts';
import { documentGlobals } from './mini-dom.ts';
import ShrinkingRows from './ShrinkingRows.svelte';

const rowsOf = (count: number) =>
    Array.from({ length: count }, (_, at) => ({ id: `r${String(at)}`, name: `row ${String(at)}` }));

it('asks for no row past the end when a list of 20 shrinks to 3 inside an effect', () => {
    const { globals, body } = documentGlobals();
    for (const [name, value] of Object.entries(globals)) vi.stubGlobal(name, value);
    // The list is taken down while the document is still there, and the document is taken away
    // after it, since unmount() lets go of the events the mount listened to on the document.
    let list: ReturnType<typeof mount> | null = null;
    onTestFinished(async () => {
        if (list !== null) await unmount(list);
        vi.unstubAllGlobals();
    });
    const rows = cell(rowsOf(20));
    const past = { key: [] as number[], body: [] as number[] };
    list = mount(ShrinkingRows, { target: body, props: { rows: () => rows.get(), past } });
    flushSync();
    expect(body.textContent.match(/row \d+/g)).toHaveLength(10);
    let thrown = '';
    try {
        rows.set(rowsOf(3));
        flushSync();
    } catch (error) {
        thrown = String(error);
    }
    expect({ thrown, past, drawn: body.textContent.match(/row \d+/g) }).toEqual({
        thrown: '',
        past: { key: [], body: [] },
        drawn: ['row 0', 'row 1', 'row 2']
    });
});
