// Layer 4, test helper. The props of the Files view's tree with every callback a no-op, for the
// cases that render it over rows of their own.

import type { ComponentProps } from 'svelte';
import type Tree from '../../../../src/lib/views/shared/explorer/tree/Tree.svelte';
import type { TreeRow } from '../../../../src/lib/state/sources/fs.ts';
import { noop } from '../../../fixtures/doubles.ts';

/** The tree's props over `rows`, with the fields a case sets laid over them. */
export function treePropsOver(
    rows: TreeRow[],
    over: Record<string, unknown> = {}
): ComponentProps<typeof Tree> {
    return {
        rows,
        filtering: false,
        selected: null,
        owner: 'files-one',
        fixed: ['hub'],
        marked: [],
        onselect: noop,
        ontoggle: noop,
        onopen: noop,
        onremove: noop,
        onbookmark: noop,
        ...over
    };
}
