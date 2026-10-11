// Layer 2, client-state tests. Every view the build registers names a glyph that resolves: its
// glyph key is in the text catalog and the name it holds is one the glyph vocabulary draws, so a
// view registered without its glyph key fails here and not when a tab strip draws it.

import { describe, expect, it } from 'vitest';
import {
    collectionKeys,
    engineDir,
    loadConfig,
    textCatalog
} from '../../../../src/lib/data/sources/config.ts';
import { registrationGlyph } from '../../../../src/lib/state/workbench/navigation/registry.ts';
import { setCatalog } from '../../../../src/lib/state/shared/words/text.ts';
import { registerAll, registerCollections } from '../../../../src/routes/views.ts';
import { createClientState } from '../../../fixtures/client.ts';

const { config } = loadConfig(engineDir());
setCatalog(textCatalog(config));
const drawn = new Set(Object.keys(config.glyphs ?? {}));

const client = createClientState();
registerAll(client.registry);
registerCollections(client.registry, collectionKeys(config));
const views = client.registry.views().map((view) => [view.id, view] as const);

describe('the glyph of every registered view', () => {
    it('is not empty, so there are views to check', () => {
        expect(views.length).toBeGreaterThan(0);
    });

    it.each(views)('resolves for the view %s', (_id, view) => {
        const name = registrationGlyph(view);
        expect(drawn.has(name), `${view.id} names the glyph ${name}`).toBe(true);
    });
});
