// Layer 4, test. The function that writes docs/palette.md from a registry and a text catalog: one
// row per entry of the registry, in its order, in the catalog's words, with the colon commands and
// their arguments in code type and a table cell kept to one line. The registry here is small and
// written out, so what is checked is the page, not the palette
// (tests/checks/diagrams/palette.test.ts holds the committed page against the real palette).

import { describe, expect, it } from 'vitest';
import { engineDir, loadConfig, textCatalog } from '../../../src/lib/data/sources/config.ts';
import {
    keyInputs,
    palettePage,
    prefixInputs,
    type PaletteRegistry
} from '../../../src/lib/shell/keys/palette-page.ts';

const CATALOG = textCatalog(loadConfig(engineDir()).config);

const REGISTRY: PaletteRegistry = {
    views: [{ id: 'focus', label: 'Focus' }],
    commands: [{ name: 'goto', hint: '<project>', description: 'Open a project' }],
    editor: [{ id: 'editor.action.commentLine', chord: 'Cmd+K Cmd+C' }],
    pin: { labels: ['Pin Editor'], chord: 'Cmd+K Enter' },
    present: ['Edit Slide'],
    prefixes: [{ input: ['#'], word: 'palette_page.prefix_symbols' }],
    keys: [{ input: ['Cmd+K'], word: 'palette_page.key_open' }]
};

/** The lines of the page that are rows of its commands table. */
function commandRows(page: string): string[] {
    return page.split('\n').filter((line) => line.startsWith('| `:'));
}

describe('palettePage', () => {
    it('writes one row for the command, with the name and the argument in code type', () => {
        expect(commandRows(palettePage(REGISTRY, CATALOG))).toEqual([
            '| `:goto` | `<project>` | Open a project |'
        ]);
    });

    it('writes one more row for one more command, and a dash for a command with no argument', () => {
        const more = {
            ...REGISTRY,
            commands: [...REGISTRY.commands, { name: 'help', hint: '', description: 'Open Help' }]
        };
        expect(commandRows(palettePage(more, CATALOG))).toEqual([
            '| `:goto` | `<project>` | Open a project |',
            '| `:help` | - | Open Help |'
        ]);
    });

    it('keeps a description to one table cell', () => {
        const odd = {
            ...REGISTRY,
            commands: [{ name: 'x', hint: '', description: 'one | two\n  three' }]
        };
        expect(commandRows(palettePage(odd, CATALOG))).toEqual(['| `:x` | - | one / two three |']);
    });

    it('writes the editor actions, the pin items, the slide commands and the keys', () => {
        const page = palettePage(REGISTRY, CATALOG);
        expect(page).toContain('| editor.action.commentLine | Cmd+K Cmd+C |');
        expect(page).toContain('| Pin Editor | Cmd+K Enter |');
        expect(page).toContain('| Edit Slide |');
        expect(page).toContain('| `#` |');
        expect(page).toContain('| `Cmd+K` |');
        expect(page.endsWith('\n')).toBe(true);
        expect(page.endsWith('\n\n')).toBe(false);
    });

    it('writes a row for each prefix and each key of the palette table, in code type', () => {
        const page = palettePage(
            { ...REGISTRY, prefixes: prefixInputs(), keys: keyInputs() },
            CATALOG
        );
        expect(page).toContain('| `:<number>` |');
        expect(page).toContain('| `Cmd+P` |');
        expect(page).toContain('| `Cmd+Shift+P`, `F1` |');
        expect(page).toContain('| `Shift+Enter` |');
    });

    it('says the catalog sentence for a section with no rows', () => {
        const page = palettePage({ ...REGISTRY, commands: [] }, CATALOG);
        expect(commandRows(page)).toEqual([]);
        expect(page).toContain(CATALOG['palette_page.none']);
    });

    it('fails on a catalog that lacks a word the page needs', () => {
        expect(() => palettePage(REGISTRY, {})).toThrow('text key not in the text catalog');
    });
});
