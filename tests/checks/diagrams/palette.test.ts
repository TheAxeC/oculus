// Layer 4, tree check. The palette page, docs/palette.md, against the palette it is written from.
//
// The case runs utils/diagrams/palette.mjs's paletteText() in memory, which loads the palette's
// modules through the project's Vite server and builds the page from the registry they give, and
// fails while the committed page differs from it. A command, an argument, a key or a view added to
// the palette without `npm run docs:palette` fails it. The function that writes the page from a
// registry is tested over a small registry in tests/shell/keys/palette-page.test.ts.
//
// Nothing is written: the page is read, not regenerated.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect } from 'vitest';
import { PAGE, paletteText } from '../../../utils/diagrams/palette.mjs';
import { it } from '../../fixtures/scratch.ts';
import { ENGINE } from './tree.ts';

describe('the palette page', () => {
    it('is what the palette gives now', { tags: ['slow'] }, async () => {
        const committed = readFileSync(join(ENGINE, PAGE), 'utf8');
        expect(committed).toBe(await paletteText(ENGINE));
    });
});
