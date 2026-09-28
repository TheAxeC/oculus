// Layer 3, primitive tests. The tooltip ids of one page: each counter the page root makes numbers
// its own bubbles from one, so two pages in one process never share a bubble id.

import { describe, expect, it } from 'vitest';
import { createTipIds } from '../../../src/lib/ui/menu/tip-ids.ts';

describe('the tooltip ids', () => {
    it('number the bubbles of two pages apart', () => {
        const one = createTipIds();
        const two = createTipIds();

        expect(one.nextTipId()).toBe('tip-1');
        expect(one.nextTipId()).toBe('tip-2');
        expect(two.nextTipId()).toBe('tip-1');
    });
});
