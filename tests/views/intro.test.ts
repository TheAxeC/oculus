// Layer 4, view test. The shared intro partial owns the bordered surface and renders trusted catalog HTML without flattening the markup the catalog carries.

import { readFileSync } from 'node:fs';
import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import Intro from '../../src/lib/views/shared/Intro.svelte';

describe('Intro', () => {
    it('draws trusted inline HTML inside the shared intro class', () => {
        const body = render(Intro, { props: { html: 'A <b>catalog</b> line.' } }).body;
        expect(body).toMatch(/class="intro(?:\s|")/);
        expect(body).toContain('A <b>catalog</b> line.');
    });

    it('uses the chip surface, accent rule and prose size', () => {
        const source = readFileSync('src/lib/views/shared/Intro.svelte', 'utf8');
        expect(source).toContain('background: var(--chip)');
        expect(source).toContain('border-left: 3px solid var(--accent)');
        expect(source).toContain('font-size: var(--fs-md)');
    });
});
