// Layer 3, primitive test. watchShown (ui/shown.ts) over an element that is not there: the
// Memories overlay binds its element with `bind:this`, which sets it to null when the overlay
// goes, and the watch over it answers nothing and reads nothing from it.
//
// What this does NOT cover: the watch over a real element and its resize observer, which need a
// DOM and are seen at the look (a tab hidden and shown again).

import { describe, expect, it, vi } from 'vitest';
import { watchShown } from '../../../src/lib/ui/shown.ts';

describe('watchShown over an element that is gone', () => {
    // Revert: read `clientWidth` of the element before checking it is there.
    it('throws nothing and answers no teardown for null', () => {
        const changed = vi.fn();
        expect(() => watchShown(null, changed)).not.toThrow();
        expect(watchShown(null, changed)).toBeUndefined();
        expect(changed).not.toHaveBeenCalled();
    });

    it('answers no teardown for undefined, as the overlay before it is bound', () => {
        expect(watchShown(undefined, vi.fn())).toBeUndefined();
    });
});
