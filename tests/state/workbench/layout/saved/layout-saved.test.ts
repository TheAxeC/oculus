// Layer 2, client-state tests. The saved form of a layout: the older envelope read by migration. A
// browser that holds a workbench of two trees and a docked panel opens it as the one tree a page
// now is, and no tab is lost on the way.
//
// Nothing here touches localStorage or the DOM: every case reads a hand-built envelope.

import { describe, expect, it } from 'vitest';
import { PAGES_VERSION, parseLayout } from '../../../../../src/lib/state/workbench/layout/index.ts';
import { bench, docked, pane, split } from '../layout-fixture.ts';

describe('the version 3 envelope, read as pages of one tree', () => {
    /** A version 3 envelope over pages whose workbenches hold two trees. */
    function saved(...held: Record<string, unknown>[]): unknown {
        const pages = held.map((workbench, at) => ({
            id: `page-${at}`,
            label: `Page ${at + 1}`,
            workbench
        }));
        return { version: PAGES_VERSION, pages, current: 'page-0' };
    }

    it('migrates every page, and reads which one was current', () => {
        const read = parseLayout(
            saved(docked(pane(['a']), pane([]), 'hidden'), docked(pane(['b']), pane(['p']))),
            'Page 1'
        );
        expect(read?.pages.map((page) => page.workbench)).toEqual([
            bench(pane(['a'])),
            bench(split('row', [0.7, 0.3], [pane(['b']), pane(['p'])]))
        ]);
        expect(read?.current).toBe('page-0');
    });
});
