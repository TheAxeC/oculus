// Layer 4, view test. The shared cross-link partial renders each project type as a closed
// disclosure; the open state is exercised in the browser suite.

import { render } from 'svelte/server';
import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it } from 'vitest';
import CrossLinks from '../../../../src/lib/views/shared/links/CrossLinks.svelte';
import type { CrossGroup } from '../../../../src/lib/state/boards/collection.ts';
import {
    engineDir,
    glyphCatalog,
    loadConfig,
    textCatalog
} from '../../../../src/lib/data/sources/config.ts';
import { setCatalog, setGlyphs } from '../../../../src/lib/state/words/text.ts';
import { clientContext, createClientState, type ClientState } from '../../../fixtures/client.ts';

let client: ClientState;

beforeEach(() => {
    client = createClientState();
});

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
        const body = render(CrossLinks, { context: clientContext(client), props: { groups } }).body;
        expect(body).toMatch(/class="disclosure(?:\s|")/);
        expect(body).toContain('class="count">1</strong>');
        expect(body).toContain('class="label">active</span>');
        expect(body).toContain('aria-expanded="false"');
        expect(body).toContain('data-project-group="work"');
        // the group is closed, so its members are named only once it is expanded
        expect(body).not.toContain('>ALPHA</span>');
    });
});

describe('the members of one group', () => {
    // The cut is a layout effect no server render measures; the rule and the tooltip are what a
    // reader is left with when a title is longer than the card.
    it('cuts a long project title inside the card and keeps the whole title in its tooltip', () => {
        const source = readFileSync('src/lib/views/shared/links/CrossLinks.svelte', 'utf8');
        expect(source).toContain('title={member.label}');
        const rule = source.slice(source.indexOf('.member :global(.label) {'));
        expect(rule.slice(0, rule.indexOf('}'))).toContain('text-overflow: ellipsis');
    });
});
