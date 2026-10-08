// Layer 2, client state. The words of the linters that more than one place draws: a linter's
// display name, which the status bar and the palette write the same way, and the title of a ChkTeX
// fix, which is LaTeX Workshop's text for the warning.

import type { LintId } from '../../../../data/model/index.ts';
import { t } from '../../../shared/words/text.ts';

/** The display name of a linter: ChkTeX, Ruff, ESLint, ShellCheck. */
export function lintName(id: LintId): string {
    return t(`lint.name_${id}`);
}

/** The title of the fix for a ChkTeX warning number that has one. */
export function chktexFixTitle(number: number): string {
    return t(`lint.chktex_fix_${number}`);
}
