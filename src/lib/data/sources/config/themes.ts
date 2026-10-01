// Layer 1, data. What is wrong with the `themes:` list and the `code_theme:` key of
// config/appearance.yml that the page cannot put right, as findings of that file. Each row names
// the glyph drawn before its words; a row whose glyph is missing, empty or not a name of
// config/catalogs/glyphs.yml is still offered, with its words alone, and a second row naming a
// theme already listed is not offered at all, since the picker keys its entries by the name.
// state/shared/words/appearance.ts draws by the same rules, so a row the finding names is drawn as
// the finding says. A `code_theme:` that is neither `tokens` nor the id of a Shiki theme
// (case-sensitive) is named too, since the editor then colours code from the tokens.

import { join } from 'node:path';
import { isCodeTheme } from '../../helpers/code-themes.ts';
import { findingText } from '../../helpers/finding-text.ts';
import type { Finding } from '../../model/index.ts';
import { filledText, itemsShape, mapShape, readAs } from '../../shapes/shapes.ts';
import { glyphCatalog } from './catalogs.ts';
import { configDir } from './folder.ts';
import { textCatalog } from './merge.ts';

/**
 * One finding per theme row whose glyph the picker cannot draw and per row that repeats a theme's
 * name, and one for a `code_theme:` that is no code theme. A row with no name is dropped by the
 * picker and says nothing here; a config with no `themes:` list has no row to report, and an
 * absent `code_theme:` says nothing.
 */
export function themeFindings(engine: string, config: Record<string, unknown>): Finding[] {
    const file = join(configDir(engine), 'appearance.yml');
    const catalog = textCatalog(config);
    const findings: Finding[] = [];
    if (Object.hasOwn(config, 'code_theme') && !isCodeTheme(config.code_theme)) {
        findings.push({
            file,
            key: 'code_theme',
            message: findingText(
                catalog,
                'findings.appearance.code_theme',
                JSON.stringify(config.code_theme)
            )
        });
    }
    const rows = readAs(itemsShape, config.themes);
    if (rows === null) return findings;
    const glyphs = glyphCatalog(config);
    const seen = new Set<string>();
    rows.forEach((raw, index) => {
        const row = readAs(mapShape, raw);
        const name = filledText(row?.name);
        if (name === undefined) return;
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
        const glyph = filledText(row?.glyph);
        if (glyph === undefined) {
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
