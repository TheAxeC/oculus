// Layer 4, view test. The shared cross-link partial renders each project type closed by default.
// It has its own file because every collection view delegates this repeated control to the partial.

import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import CrossLinks from '../../src/lib/views/shared/CrossLinks.svelte';
import type { CrossGroup } from '../../src/lib/state/collection.ts';

const groups: CrossGroup[] = [
    { type: 'active', count: 1, members: [{ id: 'alpha', label: 'ALPHA' }] }
];

describe('CrossLinks', () => {
    it('draws the closed group control and no member', () => {
        const body = render(CrossLinks, { props: { groups } }).body;
        expect(body).toContain('>1 active</span>');
        expect(body).toContain('aria-expanded="false"');
        expect(body).not.toContain('>ALPHA</span>');
    });
});
