// Layer 4, view test. The shared cross-link partial renders each project type as a closed disclosure; the open state is exercised in the browser suite.

import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import CrossLinks from '../../src/lib/views/shared/CrossLinks.svelte';
import type { CrossGroup } from '../../src/lib/state/collection.ts';
import {
    engineDir,
    glyphCatalog,
    loadConfig,
    textCatalog
} from '../../src/lib/data/sources/config.ts';
import { setCatalog, setGlyphs } from '../../src/lib/state/text.ts';

const config = loadConfig(engineDir()).config;
const glyphs = glyphCatalog(config);
setGlyphs(glyphs);
setCatalog(textCatalog(config));

const groups: CrossGroup[] = [
    {
        type: 'work',
        count: 1,
        members: [{ id: 'alpha', label: 'ALPHA', type: 'active' }],
        warn: true
    }
];

describe('CrossLinks', () => {
    it('draws the closed group control and no member', () => {
        const body = render(CrossLinks, { props: { groups } }).body;
        expect(body).toMatch(/class="disclosure(?:\s|")/);
        expect(body).toContain('class="count">1</strong>');
        expect(body).toContain('class="label">active</span>');
        expect(body).toContain('aria-expanded="false"');
        expect(body).toContain('data-project-group="work"');
        expect(body).not.toContain('>ALPHA</span>');
    });
});
