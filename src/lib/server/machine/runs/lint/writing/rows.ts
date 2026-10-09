// Layer 2, server. The marks of the writing rules as the rows of a lint answer: each mark's
// offsets as lines and columns of the editor, its message and the titles of its fixes worded from
// the text catalog the caller passes in (`words`, the server's one reader of the catalog), and
// the reasons a run gave no rows worded the same way. Every key is written out in `say` and
// `reasonOf` as a literal, which is how tests/checks/source/keys.test.ts finds the keys the
// server reads.

import type { LintEdit, LintFix, LintRow } from '../../../../../data/model/index.ts';
import { words } from '../../../../core/words.ts';
import type { Source } from '../readers.ts';
import { pointAt } from '../text.ts';
import type { CommentFailure } from './comments.ts';
import type { Line, Mark, Replacement } from './characters.ts';

/** The sentence of a catalog line with its arguments filled. */
function say(catalog: Record<string, string>, line: Line): string {
    const args = line.args ?? [];
    switch (line.id) {
        case 'writing_message_em_dash':
            return words(catalog, 'lint.writing_message_em_dash');
        case 'writing_message_en_dash':
            return words(catalog, 'lint.writing_message_en_dash');
        case 'writing_message_en_dash_range':
            return words(catalog, 'lint.writing_message_en_dash_range');
        case 'writing_message_curly_quote':
            return words(catalog, 'lint.writing_message_curly_quote');
        case 'writing_message_ellipsis':
            return words(catalog, 'lint.writing_message_ellipsis');
        case 'writing_message_arrow':
            return words(catalog, 'lint.writing_message_arrow', ...args);
        case 'writing_message_arrow_other':
            return words(catalog, 'lint.writing_message_arrow_other');
        case 'writing_message_nbsp':
            return words(catalog, 'lint.writing_message_nbsp');
        case 'writing_message_wrapped':
            return words(catalog, 'lint.writing_message_wrapped', ...args);
        case 'writing_fix_ellipsis':
            return words(catalog, 'lint.writing_fix_ellipsis');
        case 'writing_fix_quote_single':
            return words(catalog, 'lint.writing_fix_quote_single');
        case 'writing_fix_quote_double':
            return words(catalog, 'lint.writing_fix_quote_double');
        case 'writing_fix_nbsp':
            return words(catalog, 'lint.writing_fix_nbsp');
        case 'writing_fix_hyphen':
            return words(catalog, 'lint.writing_fix_hyphen');
        case 'writing_fix_arrow':
            return words(catalog, 'lint.writing_fix_arrow', ...args);
        case 'writing_fix_join':
            return words(catalog, 'lint.writing_fix_join');
        case 'writing_suggest_comma':
            return words(catalog, 'lint.writing_suggest_comma');
        case 'writing_suggest_colon':
            return words(catalog, 'lint.writing_suggest_colon');
        case 'writing_suggest_semicolon':
            return words(catalog, 'lint.writing_suggest_semicolon');
        case 'writing_suggest_arrow':
            return words(catalog, 'lint.writing_suggest_arrow');
    }
}

/** The reason a code file's comments could not be read, as the status item shows it. */
export function reasonOf(catalog: Record<string, string>, failure: CommentFailure): string {
    switch (failure.kind) {
        case 'grammar':
            return words(catalog, 'lint.writing_reason_grammar', failure.detail ?? '');
        case 'ended':
            return words(catalog, 'lint.writing_reason_ended');
        case 'timeout':
            return words(catalog, 'lint.writing_reason_timeout');
        case 'closed':
            return words(catalog, 'lint.writing_reason_closed');
        case 'stopped':
            return 'stopped';
    }
}

/** A replacement as an edit of the editor's places. */
function editOf(source: Source, edit: Replacement): LintEdit {
    const from = pointAt(source.starts, edit.from);
    const to = pointAt(source.starts, edit.to);
    return {
        line: from.line,
        column: from.column,
        endLine: to.line,
        endColumn: to.column,
        text: edit.text
    };
}

/** The rows of the marks of a file, worded from the catalog. */
export function rowsOf(
    marks: readonly Mark[],
    source: Source,
    catalog: Record<string, string>
): LintRow[] {
    return marks.map((mark): LintRow => {
        const from = pointAt(source.starts, mark.from);
        const to = pointAt(source.starts, mark.to);
        const fixes = mark.fixes.map((fix): LintFix => ({
            kind: fix.kind,
            title: say(catalog, fix.title),
            edits: fix.edits.map((edit) => editOf(source, edit))
        }));
        return {
            line: from.line,
            column: from.column,
            endLine: to.line,
            endColumn: to.column,
            severity: 'warning',
            message: say(catalog, mark.message),
            code: mark.code,
            fixes
        };
    });
}
