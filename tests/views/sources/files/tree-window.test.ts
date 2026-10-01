// The Files tree drawn on the server before it has found its scroll box: a long tree draws the rows
// of its first window and holds the height of the rest in the spacer after them.
//
// What this does NOT cover: the window once the list has its scroll box, a scroll, or a key moving
// to a row not drawn, which run only in a browser and are looked at on landing.

import { beforeEach, describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import Tree from '../../../../src/lib/views/sources/files/tree/Tree.svelte';
import { treeKey, treeRows } from '../../../../src/lib/state/sources/fs.ts';
import {
    engineDir,
    glyphCatalog,
    loadConfig,
    textCatalog
} from '../../../../src/lib/data/sources/config.ts';
import { setCatalog, setGlyphs } from '../../../../src/lib/state/shared/words/text.ts';
import { OVERSCAN } from '../../../../src/lib/ui/tree/virtual.ts';
import { noop } from '../../../fixtures/doubles.ts';
import { clientContext, createClientState, type ClientState } from '../../../fixtures/client.ts';

let client: ClientState;

beforeEach(() => {
    client = createClientState();
});

const { config } = loadConfig(engineDir());
setCatalog(textCatalog(config));
setGlyphs(glyphCatalog(config));

/** How many times `needle` occurs in `body`. */
function count(body: string, needle: string): number {
    return body.split(needle).length - 1;
}

/** The tree's props over `rows`, every callback a no-op. */
function treeProps(rows: ReturnType<typeof treeRows>, fixed: string[]) {
    return {
        rows,
        filtering: false,
        selected: null,
        owner: 'files-one',
        fixed,
        marked: [],
        onselect: noop,
        ontoggle: noop,
        onopen: noop,
        onremove: noop,
        onbookmark: noop,
        onrefresh: noop,
        oncollapse: noop
    };
}

describe('a long tree before it has its scroll box', () => {
    // Revert: draw `{#each rows}` straight into the list in Tree.svelte rather than through
    // ui/tree/VirtualRows.svelte, or set `shown` to `count` in ui/tree/virtual.ts's firstWindow.
    // An audit of the markup: a server rendering has no scroll box, so it draws the first window
    // and holds the rest after it; which rows a browser draws once scrolled it says nothing of.
    it('audits that draws the first rows of a long tree and holds the rest in a spacer after them', () => {
        const files = Array.from({ length: 30 }, (_, at) => ({
            name: `f${String(at).padStart(2, '0')}.txt`,
            kind: 'file' as const,
            size: 1,
            mtime: 1
        }));
        const rows = treeRows(
            [{ key: 'big', dir: '/tmp/big', fixed: true }],
            (root, path) => (treeKey(root, path) === 'big:' ? files : []),
            ['big:']
        );
        const { body } = render(Tree, {
            context: clientContext(client),
            props: treeProps(rows, ['big'])
        });
        const shown = OVERSCAN * 2;
        const after = body.indexOf('data-virtual="after"');

        expect(rows).toHaveLength(31);
        expect(count(body, 'data-fs-row="')).toBe(shown);
        expect(body.indexOf('data-fs-row="big:"')).toBeGreaterThan(
            body.indexOf('data-virtual="before"')
        );
        expect(body).toContain(`data-fs-row="big:f${String(shown - 2).padStart(2, '0')}.txt"`);
        // The root's head is the first row drawn, so the window's last file is the ninth: the tenth
        // file is past the rows a list draws before it has found its scroll box.
        expect(body).not.toContain(`data-fs-row="big:f${String(shown - 1).padStart(2, '0')}.txt"`);
        expect(after).toBeGreaterThan(body.lastIndexOf('data-fs-row="'));
        expect(body.slice(after, body.indexOf('>', after))).toContain(
            `calc(${String(31 - shown)} * var(--tree-row)`
        );
    });
});
