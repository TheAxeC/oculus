// Layer 4, view test. The shared cross-link partial renders each project type as a closed disclosure; the open state is exercised in the browser suite.

import { render } from 'svelte/server';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import CrossLinks from '../../src/lib/views/shared/CrossLinks.svelte';
import { byType } from '../../src/lib/views/shared/cross-links.ts';
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

describe('the members of one group', () => {
    it('nest under their own project type, one row per type, in the members own order', () => {
        expect(
            byType({
                type: 'work',
                count: 3,
                members: [
                    { id: 'a', label: 'A', type: 'active' },
                    { id: 'b', label: 'B', type: 'manuscript' },
                    { id: 'c', label: 'C', type: 'active' }
                ],
                warn: false
            })
        ).toEqual([
            {
                type: 'active',
                members: [
                    { id: 'a', label: 'A', type: 'active' },
                    { id: 'c', label: 'C', type: 'active' }
                ]
            },
            { type: 'manuscript', members: [{ id: 'b', label: 'B', type: 'manuscript' }] }
        ]);
    });

    it('is one row for a group whose members are all of one type', () => {
        expect(byType(groups[0]).map((kind) => kind.type)).toEqual(['active']);
    });

    // The cut is a layout effect no server render measures; the rule and the tooltip are what a
    // reader is left with when a title is longer than the card.
    it('cuts a long project title inside the card and keeps the whole title in its tooltip', () => {
        const source = readFileSync('src/lib/views/shared/CrossLinks.svelte', 'utf8');
        expect(source).toContain('title={member.label}');
        const rule = source.slice(source.indexOf('.member :global(.label) {'));
        expect(rule.slice(0, rule.indexOf('}'))).toContain('text-overflow: ellipsis');
    });
});
