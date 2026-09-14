// SplitView rendered to HTML on the server, which is enough to check what it puts on the page: one
// box per pane, drawn by the caller's snippet and given its path; one sash between neighbours; the
// sizes carried as flex on each child; and a folded child drawn as a strip through the fold
// snippet, with no sash on either side of it.
//
// What this does NOT cover: the sash's pointer behaviour and the drag arithmetic. There is no DOM in
// this suite, so a pointer drag cannot be simulated here; svelte-check and the page are what
// exercise Sash, and the drag itself is checked in a browser.

import { beforeEach, describe, expect, it } from 'vitest';
import { createRawSnippet } from 'svelte';
import { render } from 'svelte/server';
import SplitView from '../../src/lib/shell/SplitView.svelte';
import { engineDir, loadConfig, textCatalog } from '../../src/lib/data/sources/config.ts';
import { setCatalog } from '../../src/lib/state/text.ts';
import { FOLD_PX } from '../../src/lib/ui/sash-size.ts';
import type { Layout } from '../../src/lib/state/layout/index.ts';
import { noop } from '../doubles.ts';
import { clientContext, createClientState, type ClientState } from '../client.ts';

let client: ClientState;

beforeEach(() => {
    client = createClientState();
});

// Sash reads its label through t(), so the catalog the server ships is installed first.
setCatalog(textCatalog(loadConfig(engineDir()).config));

function pane(id: string): Layout {
    return { kind: 'pane', tabs: [{ id, view: 'projects', state: null }], active: id };
}

/** A row of a pane and a column of two panes: panes at [0], [1, 0] and [1, 1]. */
const tree: Layout = {
    kind: 'split',
    dir: 'row',
    sizes: [0.6, 0.4],
    children: [
        pane('a'),
        {
            kind: 'split',
            dir: 'col',
            sizes: [0.25, 0.75],
            children: [pane('b'), pane('c')]
        }
    ]
};

/** The caller's fold snippet: a box naming the direction of the split that holds the child. */
const foldSnippet = createRawSnippet<[Layout, 'row' | 'col', () => void]>((node, dir) => ({
    render: () => {
        const held = node();
        const id = held.kind === 'pane' ? (held.tabs[0]?.id ?? '') : '';
        return `<div class="folded" data-folded="${id}" data-dir="${dir()}"></div>`;
    }
}));

/** The caller's pane snippet: a box naming the path it was handed and the tab it holds. */
const paneSnippet = createRawSnippet<[Layout, number[]]>((node, path) => ({
    render: () => {
        const held = node();
        const id = held.kind === 'pane' ? (held.tabs[0]?.id ?? '') : '';
        return `<div class="probe" data-path="${path().join('.')}">${id}</div>`;
    }
}));

function html(layout: Layout): string {
    return render(SplitView, {
        context: clientContext(client),
        props: {
            layout,
            pane: paneSnippet,
            fold: foldSnippet,
            onresize: noop,
            onexpand: noop
        }
    }).body;
}

describe('SplitView', () => {
    let body: string;

    beforeEach(() => {
        body = html(tree);
    });

    it('draws one box per pane, through the snippet, with its path', () => {
        const paths = [...body.matchAll(/data-path="([^"]*)"/g)].map((match) => match[1]);
        expect(paths).toEqual(['0', '1.0', '1.1']);
    });

    it('puts a sash between neighbours and nowhere else', () => {
        expect([...body.matchAll(/role="separator"/g)]).toHaveLength(2);
        expect([...body.matchAll(/aria-orientation="vertical"/g)]).toHaveLength(1);
        expect([...body.matchAll(/aria-orientation="horizontal"/g)]).toHaveLength(1);
        expect(body).toContain('aria-label="Resize"');
    });

    it('tells each sash where it sits, so a focused separator says so', () => {
        expect(body).toContain('aria-valuenow="60"');
        expect(body).toContain('aria-valuenow="25"');
    });

    it('carries every size as the flex of its child', () => {
        expect(body).toContain('flex: 0.6 1 0');
        expect(body).toContain('flex: 0.4 1 0');
        expect(body).toContain('flex: 0.25 1 0');
        expect(body).toContain('flex: 0.75 1 0');
    });

    it('lays each split out in its own direction', () => {
        expect(body).toMatch(/class="split row/);
        expect(body).toMatch(/class="split col/);
    });

    it('draws a folded child through the fold snippet, at the strip thickness and with no sash', () => {
        const folded = html({ ...tree, folded: [0] });
        expect(folded).toContain('data-folded="a"');
        expect(folded).toContain(`flex: 0 0 ${FOLD_PX}px`);
        expect(folded).not.toContain('data-path="0"');
        expect([...folded.matchAll(/role="separator"/g)]).toHaveLength(1);
    });

    it('tells the fold snippet the direction of the split holding the child', () => {
        expect(html({ ...tree, folded: [0] })).toContain('data-dir="row"');
    });

    it('gives the one open child beside a folded one the whole of the space they share', () => {
        const folded = html({ ...tree, folded: [0] });
        expect(folded).toContain('flex: 1 1 0');
        expect(folded).not.toContain('flex: 0.4 1 0');
    });

    it('draws one handle between two open children with a folded one between them', () => {
        const three: Layout = {
            kind: 'split',
            dir: 'row',
            sizes: [0.5, 0.3, 0.2],
            children: [pane('a'), pane('b'), pane('c')],
            folded: [1]
        };
        const body = html(three);
        expect([...body.matchAll(/role="separator"/g)]).toHaveLength(1);
        // The handle sits after the strip and before the third child, on the far side of the strip.
        expect(body.indexOf('data-folded="b"')).toBeLessThan(body.indexOf('role="separator"'));
        expect(body.indexOf('role="separator"')).toBeLessThan(body.indexOf('data-path="2"'));
    });

    it('divides the space between the open children by their sizes over their sum', () => {
        const three: Layout = {
            kind: 'split',
            dir: 'row',
            sizes: [0.5, 0.3, 0.2],
            children: [pane('a'), pane('b'), pane('c')],
            folded: [0]
        };
        const body = html(three);
        // 0.3 and 0.2 of a sum of 0.5: the strip takes its thickness and these two take the rest.
        expect(body).toContain('flex: 0.6 1 0');
        expect(body).toContain('flex: 0.4 1 0');
    });

    it('renders a bare pane as the snippet alone, with no split and no sash', () => {
        const single = html(pane('only'));
        expect(single).toContain('data-path=""');
        expect(single).not.toContain('role="separator"');
        expect(single).not.toContain('flex:');
    });
});
