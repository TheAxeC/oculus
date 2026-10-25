// Layer 1, data tests. The catalogs a workspace file's `settings:` lays over oculus's: the agents,
// the file nesting patterns, the glyphs, the icons and the LaTeX tables by their keys, and the
// Unicode math rows by their command, each in oculus's place; what cannot be applied, and what the
// reader of a catalog refuses in a value the workspace set, is a finding naming the workspace file
// and the key under `settings.`. The workspace file is given as text, so no file is read for it.

import { describe, expect, it } from 'vitest';
import {
    OCULUS,
    WORKSPACE_FILE as FILE,
    findingLines,
    mapOf,
    readerFindings,
    withSettings
} from './layers-fixture.ts';

/** The findings of the merge and of the config's readers, as `file | key | message`. */
function said(read: ReturnType<typeof withSettings>): string[] {
    return findingLines([...read.findings, ...readerFindings(read)]);
}

/** The Unicode math rows of a merged config. */
function unimath(config: Record<string, unknown>): { command: string }[] {
    return config.latex_unimath as { command: string }[];
}

describe("the catalogs a workspace lays over oculus's", () => {
    it("replaces one glyph's stand-in and keeps every other glyph as oculus ships it", () => {
        const read = withSettings('  glyphs: { red: "R" }\n');
        expect(said(read)).toEqual([]);
        const glyphs = mapOf(read.config, 'glyphs');
        expect(glyphs.red).toBe('R');
        expect(Object.keys(glyphs)).toEqual(Object.keys(mapOf(OCULUS, 'glyphs')));
        expect({ ...glyphs, red: mapOf(OCULUS, 'glyphs').red }).toEqual(OCULUS.glyphs);
        expect(read.from.glyphs).toBe(FILE);
        expect(read.from['glyphs.refresh']).toBe('catalogs/glyphs.yml');
    });

    it('takes an icon out with null and words a null naming an icon oculus does not hold', () => {
        const icon = Object.keys(mapOf(OCULUS, 'icons'))[0];
        const read = withSettings(`  icons: { ${icon}: null, nosuchicon: null }\n`);
        expect(read.findings.map((one) => `${one.file} | ${one.key} | ${one.message}`)).toEqual([
            `${FILE} | settings.icons.nosuchicon | settings.icons sets nosuchicon to null, which oculus's map does not hold`
        ]);
        expect(Object.hasOwn(mapOf(read.config, 'icons'), icon)).toBe(false);
    });

    it("replaces a Unicode math row in its place by its command and adds a new one after oculus's rows", () => {
        const read = withSettings(
            '  latex_unimath:\n    - { command: mbfalpha, detail: "a", documentation: "alpha" }\n    - { command: newsym, detail: "n", documentation: "new" }\n'
        );
        expect(said(read)).toEqual([]);
        const shipped = unimath(OCULUS);
        const rows = unimath(read.config);
        const at = shipped.findIndex((row) => row.command === 'mbfalpha');
        expect(at).toBeGreaterThan(-1);
        expect(rows[at]).toEqual({ command: 'mbfalpha', detail: 'a', documentation: 'alpha' });
        expect(rows).toHaveLength(shipped.length + 1);
        expect(rows.at(-1)).toEqual({ command: 'newsym', detail: 'n', documentation: 'new' });
        expect(rows.slice(0, at)).toEqual(shipped.slice(0, at));
    });

    it("takes a Unicode math row out by its command and keeps oculus's rows for a removal it lacks", () => {
        const read = withSettings('  latex_unimath: [ { command: mbfalpha, removed: true } ]\n');
        expect(said(read)).toEqual([]);
        const commands = unimath(read.config).map((row) => row.command);
        expect(commands).not.toContain('mbfalpha');
        expect(commands).toHaveLength(unimath(OCULUS).length - 1);
        const unknown = withSettings('  latex_unimath: [ { command: nosuch, removed: true } ]\n');
        expect(said(unknown)).toEqual([
            `${FILE} | settings.latex_unimath | settings.latex_unimath takes nosuch out, which oculus's list does not hold`
        ]);
        expect(unknown.config.latex_unimath).toEqual(OCULUS.latex_unimath);
    });

    it("replaces one section of the LaTeX tables and keeps oculus's other sections", () => {
        const read = withSettings(
            '  latex_editing: { at: [ { prefix: "@q", body: \'\\quad\', description: quad } ] }\n'
        );
        expect(said(read)).toEqual([]);
        const editing = mapOf(read.config, 'latex_editing');
        expect(editing.at).toEqual([{ prefix: '@q', body: '\\quad', description: 'quad' }]);
        expect(Object.keys(editing)).toEqual(Object.keys(mapOf(OCULUS, 'latex_editing')));
        for (const section of Object.keys(editing).filter((one) => one !== 'at')) {
            expect(editing[section], section).toEqual(mapOf(OCULUS, 'latex_editing')[section]);
        }
    });

    it("words a list where a catalog's map is merged, and keeps oculus's glyphs", () => {
        const read = withSettings('  glyphs: [a]\n');
        expect(said(read)).toEqual([
            `${FILE} | settings.glyphs | settings.glyphs must be a map; oculus's value stands`
        ]);
        expect(read.config.glyphs).toEqual(OCULUS.glyphs);
    });

    it('names the workspace file and settings.latex_unimath for a row the reader refuses', () => {
        const read = withSettings('  latex_unimath: [ { command: alpha } ]\n');
        expect(said(read)).toEqual([
            `${FILE} | settings.latex_unimath | settings.latex_unimath has a row that cannot be used (a command that is not a name of letters, or an empty detail) or is not a list; the row is left out`
        ]);
    });
});
