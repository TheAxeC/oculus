// Opening one bookmark of the file browser, and the place its row names. A bookmark opens only
// when its root and its path are both texts, a page in the document view and any other file in the
// file view; the row says the root and the path each on its own.
//
// The opener is a recording double and the row is rendered on the server, so nothing here reads a
// file or a store. What this does NOT cover: opening a file row, which needs a file's kind read
// from the server and is files-ops.test.ts's.

import { beforeEach, describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import Bookmarks from '../../../../src/lib/views/sources/files/sections/Bookmarks.svelte';
import { openBookmark } from '../../../../src/lib/views/sources/files/opening.ts';
import { documentState } from '../../../../src/lib/state/workbench/layout/index.ts';
import { installRealText } from '../../shared/real-text.ts';
import { noop } from '../../../fixtures/doubles.ts';
import { clientContext, createClientState, type ClientState } from '../../../fixtures/client.ts';
import type { Entry } from '../../../../src/lib/state/boards/collection.ts';

let client: ClientState;

beforeEach(() => {
    client = createClientState();
});

installRealText();

/** The calls of the opener one bookmark makes. */
function opened(fields: Record<string, unknown>): unknown[][] {
    const calls: unknown[][] = [];
    const opener = { openView: (...args: unknown[]) => calls.push(args) };
    openBookmark(opener as never, { id: 'e', title: 'T', fields } as unknown as Entry);
    return calls;
}

describe('opening one bookmark', () => {
    it('audits that a bookmark with a root and a path as texts opens, an empty root included', () => {
        expect(opened({ root: 'r', path: 'p' })).toHaveLength(1);
        expect(opened({ root: '', path: 'p' })).toHaveLength(1);
    });

    it('audits that a bookmark with a root or a path that is no text opens nothing', () => {
        const rows: Record<string, unknown>[] = [
            { root: 3, path: 'p' },
            { path: 'p' },
            { root: 'r', path: 3 },
            { root: 'r' }
        ];
        for (const fields of rows) expect(opened(fields)).toHaveLength(0);
    });

    it('audits that a file opens in the file view under the label the reader gave', () => {
        expect(opened({ root: 'r', path: 'p' })).toStrictEqual([
            ['file', { root: 'r', path: 'p', label: 'T' }]
        ]);
    });

    it('audits that a page opens in the document view as the rail opens it', () => {
        expect(opened({ root: 'r', path: 'a.html' })).toStrictEqual([
            ['document', documentState({ label: 'T', root: 'r', path: 'a.html' })]
        ]);
    });
});

describe('the place a bookmark row names', () => {
    /** The detail the row drew after its label: the root, a slash and the path. */
    function placeOf(fields: Record<string, unknown>): string | undefined {
        const body = render(Bookmarks, {
            context: clientContext(client),
            props: {
                rows: [{ id: 'b', title: 'T', fields, file: 'f', index: 0 }],
                error: '',
                open: true,
                editing: '',
                adding: false,
                ontoggle: noop,
                onadd: noop,
                onopen: noop,
                onedit: noop,
                onretry: noop
            }
        }).body.replace(/<!--[\s\S]*?-->/g, '');
        return /data-fs-bookmark="b"[\s\S]*?class="detail[^"]*">([^<]*)</.exec(body)?.[1];
    }

    it('reads the root and the path each on its own, and a field that is no text as empty', () => {
        const rows: Record<string, unknown>[] = [
            { root: 'r', path: 'p' },
            { root: '', path: 'p' },
            { root: 3, path: 'p' },
            { path: 'p' },
            { root: 'r', path: 3 },
            { root: 'r' }
        ];
        expect(rows.map(placeOf)).toEqual(['r/p', '/p', '/p', '/p', 'r/', 'r/']);
    });
});
