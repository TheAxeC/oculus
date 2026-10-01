// The badge pair of a tree row's count badge (ui/tree/TreeItem.svelte) reads in every theme, and
// the badge Monaco draws in its own surfaces (the find widget's count, a peek view's title) keeps
// the colours the editor kit gave it. The first is kept out of theme.test.ts, which npm test
// leaves out as slow, so the verify list runs it.

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { COLOURS } from '../../../../../src/lib/ui/controls/editor/kit/colours.ts';
import { ratio } from '../../../../../src/lib/themes/derive.ts';
import { NAMES, themeTokens } from '../../../../checks/look/themes.ts';

describe('the badge of a tree row', () => {
    // Red when the rule paints the badge from another pair, or the pair does not read in a theme.
    it('audit: is painted from --line and --on-line, which read at 4.5:1 in every theme', () => {
        const source = readFileSync('src/lib/ui/tree/TreeItem.svelte', 'utf8');
        expect(source).toMatch(/background: var\(--line\);\s*color: var\(--on-line\);/);

        const failures: string[] = [];
        for (const name of NAMES) {
            const { theme, derived } = themeTokens(name);
            const tokens: Record<string, string> = { ...theme, ...derived };
            const found = ratio(tokens['--on-line'], tokens['--line']);
            if (found < 4.5) failures.push(`${name}: ${found.toFixed(2)}:1`);
        }
        expect(failures).toEqual([]);
    });
});

describe('the badge of a Monaco-drawn surface', () => {
    // Preserved behaviour: passes on the unchanged tree as well as after the change.
    it('keeps the editor kit colours, the muted fill and the text on a filled control', () => {
        expect(COLOURS['badge.background']).toBe('--muted');
        expect(COLOURS['badge.foreground']).toBe('--c-on');
    });
});
