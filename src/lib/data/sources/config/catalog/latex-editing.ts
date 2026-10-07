// Layer 1, data. What is wrong with the `latex_editing:` tables of config/catalogs/latex.yml that
// only the reader can say, as findings on the config channel: one for each list that lost a row (an
// `@` suggestion, a chord, a symbol or a group). The reader drops the row and keeps the rest
// (catalog/latex-tables.ts), and the finding names the key of the list, so the findings and
// the editor's commands cannot disagree about what was dropped.

import { join } from 'node:path';
import { findingText } from '../../../helpers/finding-text.ts';
import type { Finding } from '../../../model/index.ts';
import { readLatexEditing } from './latex-tables.ts';
import { configDir } from '../folder.ts';
import { textCatalog } from '../merge.ts';

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
