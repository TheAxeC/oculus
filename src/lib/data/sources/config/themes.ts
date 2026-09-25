// Layer 1, data. What is wrong with the `themes:` list of config/appearance.yml that the theme
// picker cannot put right, as findings of that file. Each row names the glyph drawn before its
// words; a row whose glyph is missing, empty or not a name of config/catalogs/glyphs.yml is still
// offered, with its words alone, and a second row naming a theme already listed is not offered at
// all, since the picker keys its entries by the name. state/shared/words/appearance.ts draws by the
// same rules, so a row the finding names is drawn as the finding says.

import { join } from 'node:path';
import { findingText } from '../../helpers/finding-text.ts';
import type { Finding } from '../../model/index.ts';
import { glyphCatalog } from './catalogs.ts';
import { configDir } from './folder.ts';
import { textCatalog } from './merge.ts';

/** A row of `themes:` as a map, or null for anything else. */
function rowOf(row: unknown): Record<string, unknown> | null {
    return typeof row === 'object' && row !== null && !Array.isArray(row)
        ? (row as Record<string, unknown>)
        : null;
}

/**
 * One finding per theme row whose glyph the picker cannot draw and per row that repeats a theme's
 * name. A row with no name is dropped by the picker and says nothing here; a config with no
 * `themes:` list has nothing to report.
 */
export function themeFindings(engine: string, config: Record<string, unknown>): Finding[] {
    const rows = config.themes;
    if (!Array.isArray(rows)) return [];
    const file = join(configDir(engine), 'appearance.yml');
    const catalog = textCatalog(config);
    const glyphs = glyphCatalog(config);
    const seen = new Set<string>();
    const findings: Finding[] = [];
    rows.forEach((raw, index) => {
        const row = rowOf(raw);
        const name = row?.name;
        if (typeof name !== 'string' || name === '') return;
        const key = `themes[${index}]`;
        if (seen.has(name)) {
            findings.push({
                file,
                key,
                message: findingText(catalog, 'findings.appearance.repeated', name)
            });
            return;
        }
        seen.add(name);
        const glyph = row?.glyph;
        if (typeof glyph !== 'string' || glyph === '') {
            findings.push({
                file,
                key,
                message: findingText(catalog, 'findings.appearance.glyph', name)
            });
        } else if (!Object.hasOwn(glyphs, glyph)) {
            findings.push({
                file,
                key,
                message: findingText(catalog, 'findings.appearance.glyph_unknown', name)
            });
        }
    });
    return findings;
}
