// Layer 1, data. What is wrong with the `latex_editing:` tables of config/catalogs/latex.yml and
// the `latex_unimath:` rows of config/catalogs/unimath.yml that only the reader can say, as
// findings on the config channel: one for each list of the tables that lost a row (an `@`
// suggestion, a chord, a symbol or a group) and one when the unimath list lost a row. The reader
// (catalog/latex-tables.ts) drops the row and keeps the rest, and the finding names the key of the
// list, so the findings and the editor's commands cannot disagree about what was dropped.

import { join } from 'node:path';
import { findingText } from '../../../helpers/finding-text.ts';
import type { Finding } from '../../../model/index.ts';
import { readLatexEditing, readLatexUnimath } from './latex-tables.ts';
import { configDir } from '../folder.ts';
import { textCatalog } from '../merge/text.ts';

/** One finding for each list of `latex_editing:` that lost a row. */
export function latexEditingFindings(engine: string, config: Record<string, unknown>): Finding[] {
    const file = join(configDir(engine), 'catalogs', 'latex.yml');
    const catalog = textCatalog(config);
    return readLatexEditing(config).dropped.map((key) => ({
        file,
        key,
        message: findingText(catalog, 'findings.config.latex_editing_row', key)
    }));
}

/** One finding when `latex_unimath:` lost a row. */
export function latexUnimathFindings(engine: string, config: Record<string, unknown>): Finding[] {
    if (readLatexUnimath(config).lost === 0) return [];
    return [
        {
            file: join(configDir(engine), 'catalogs', 'unimath.yml'),
            key: 'latex_unimath',
            message: findingText(textCatalog(config), 'findings.config.latex_unimath_row')
        }
    ];
}
