// Layer 4, view test. View-local type rules use the shared role scale and reserve the two smallest steps for the activity rail outside views.

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = 'src/lib/views';
const UI = 'src/lib/ui';

function files(at: string): string[] {
    return readdirSync(at)
        .flatMap((name) => {
            const path = join(at, name);
            return statSync(path).isDirectory() ? files(path) : [path];
        })
        .filter((path) => path.endsWith('.svelte'));
}

describe('the view type scale', () => {
    it('keeps the two rail-only sizes out of every view', () => {
        const offenders = files(ROOT).filter((file) =>
            /--fs-(?:xxs|3xs)/.test(readFileSync(file, 'utf8'))
        );
        expect(offenders).toEqual([]);
    });

    it('sets representative prose, sub-line, meta, table, badge and timestamp roles', () => {
        expect(readFileSync(join(ROOT, 'shared/Intro.svelte'), 'utf8')).toMatch(
            /\.intro\s*\{[^}]*font-size: var\(--fs-md\)/
        );
        expect(readFileSync(join(ROOT, 'collection/EntryCard.svelte'), 'utf8')).toMatch(
            /\.sub\s*\{[^}]*font-size: var\(--fs-sm\)/
        );
        expect(readFileSync(join(ROOT, 'Project.svelte'), 'utf8')).toMatch(
            /\.meta\s*\{[^}]*font-size: var\(--fs-sm\)/
        );
        expect(readFileSync(join(ROOT, 'hpc/Jobs.svelte'), 'utf8')).toMatch(
            /table\s*\{[^}]*font-size: var\(--fs-sm\)/
        );
        expect(readFileSync(join(ROOT, 'focus/Lanes.svelte'), 'utf8')).toMatch(
            /\.count\s*\{[^}]*font-size: var\(--fs-xs\)/
        );
        expect(readFileSync(join(ROOT, 'sessions/Timeline.svelte'), 'utf8')).toMatch(
            /\.ts\s*\{[^}]*font-size: var\(--fs-xs\)/
        );
    });

    it('sets body chips to small and Card meta-row chips to extra small', () => {
        expect(readFileSync(join(UI, 'Chip.svelte'), 'utf8')).toMatch(
            /\.chip\s*\{[^}]*font-size: var\(--fs-sm\)/
        );
        expect(readFileSync(join(UI, 'Card.svelte'), 'utf8')).toMatch(
            /\.meta :global\(\.chip\)\s*\{[^}]*font-size: var\(--fs-xs\)/
        );
    });
});
