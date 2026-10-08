// Layer 2, client state. The sentences an endpoint's answer is said in when the page cannot use
// it: an answer it could not read, and a refusal.
//
// A refusal's own text is never shown here. The server answers a refusal as a word
// (data/file-ops.ts OPS_REFUSALS, and data/prose/latex.ts LATEX_REFUSALS for the LaTeX endpoint and
// the LaTeX terminal action, and data/model TERMINAL_REFUSALS for the terminal actions with the
// names their sentences are about, terminal-words.ts), and the page says the sentence the catalog
// holds for that word; any other body text, a status with no body and a body that is no word all
// say the refusal with its status. The status is in parentheses so the reader is told in words and
// a bug report still carries it.

import { z } from 'zod';
import { OPS_REFUSALS, type OpsRefusal } from '../../../data/file-ops.ts';
import { LATEX_REFUSALS, type LatexRefusal } from '../../../data/prose/latex.ts';
import { readAs } from '../../../data/shapes/shapes.ts';
import { t as catalogText } from '../words/text.ts';
import { terminalSentence, terminalWord } from './terminal-words.ts';

/** A catalog lookup: the key and the values filled into its placeholders. */
type Say = (key: string, ...values: (string | number)[]) => string;

/**
 * The sentence the catalog holds for one refusal word, read through `t`, which is the page's own
 * lookup unless a caller holds another.
 */
export function refusalSentence(word: OpsRefusal, t: Say = catalogText): string {
    switch (word) {
        case 'outside':
            return t('files.refused_outside');
        case 'missing':
            return t('files.refused_missing');
        case 'root':
            return t('files.refused_root');
        case 'protected':
            return t('files.refused_protected');
        case 'invalid_name':
            return t('files.refused_invalid_name');
        case 'exists':
            return t('files.refused_exists');
        case 'into_itself':
            return t('files.refused_into_itself');
        case 'not_a_folder':
            return t('files.refused_not_a_folder');
        case 'denied':
            return t('files.refused_denied');
        case 'trash_failed':
            return t('files.refused_trash_failed');
        case 'too_large':
            return t('files.refused_too_large');
        case 'not_base64':
            return t('files.refused_not_base64');
        case 'token':
            return t('files.refused_token');
        case 'not-an-action':
            return t('files.refused_not_an_action');
        case 'bad-query':
            return t('files.refused_bad_query');
        case 'binary':
            return t('files.refused_binary');
        case 'search-failed':
            return t('files.refused_search_failed');
        case 'changed':
            return t('files.refused_changed');
        case 'marker':
            return t('files.refused_marker');
    }
}

/** The catalog's sentence for a word the LaTeX endpoint or terminal action refuses with. */
function latexSentence(word: LatexRefusal, names: readonly string[] = []): string {
    switch (word) {
        case 'no-project':
            return catalogText('latex.refused_no_project');
        case 'not-a-file':
            return catalogText('latex.refused_not_a_file');
        case 'not-a-main':
            return catalogText('latex.refused_not_a_main');
        case 'count-missing':
            return catalogText('latex.refused_count_missing');
        case 'count-timeout':
            return catalogText('latex.refused_count_timeout');
        case 'count-failed':
            return catalogText('latex.refused_count_failed');
        case 'format-none':
            return catalogText('latex.refused_format_none');
        case 'latexindent-missing':
            return catalogText('latex.refused_latexindent_missing');
        case 'tex-fmt-missing':
            return catalogText('latex.refused_tex_fmt_missing');
        case 'badness-missing':
            return catalogText('latex.refused_badness_missing');
        case 'format-timeout':
            return catalogText('latex.refused_format_timeout');
        case 'format-failed':
            return catalogText('latex.refused_format_failed');
        case 'synctex-missing':
            return catalogText('latex.refused_synctex_missing');
        case 'synctex-timeout':
            return catalogText('latex.refused_synctex_timeout');
        case 'synctex-failed':
            return catalogText('latex.refused_synctex_failed');
        case 'synctex-outside':
            return catalogText('latex.refused_synctex_outside');
        case 'synctex-no-pdf':
            return catalogText('latex.refused_synctex_no_pdf');
        case 'synctex-no-file':
            return catalogText('latex.refused_synctex_no_file');
        case 'texdoc-name':
            return catalogText('latex.refused_texdoc_name');
        case 'texdoc-missing':
            return catalogText('latex.refused_texdoc_missing');
        case 'texdoc-timeout':
            return catalogText('latex.refused_texdoc_timeout');
        case 'texdoc-failed':
            return catalogText('latex.refused_texdoc_failed');
        case 'latex-changed':
            return catalogText('latex.refused_latex_changed');
        case 'latexmkrc-unread':
            return catalogText('latex.refused_latexmkrc_unread', names[0] ?? '');
    }
}

/** The refusal word a value is, or null for any other value. */
export function refusalWord(value: unknown): OpsRefusal | null {
    return OPS_REFUSALS.find((one) => one === value) ?? null;
}

/** The LaTeX refusal word a value is, or null for any other value. */
function latexWord(value: unknown): LatexRefusal | null {
    return LATEX_REFUSALS.find((one) => one === value) ?? null;
}

/** The sentence for a request that got no answer at all. */
export function unreachableAnswer(): string {
    return catalogText('ui.answer_unreachable');
}

/** The sentence for an answer the page could not read, with the status it came with. */
export function unreadableAnswer(status: number | string): string {
    return catalogText('ui.answer_unreadable', status);
}

/**
 * The sentence for a refused answer: the catalog's sentence when `error` is a refusal word, said
 * with the `names` the answer carried, else the refusal with the status it came with.
 */
export function refusedAnswer(
    status: number | string,
    error?: unknown,
    names: readonly string[] = []
): string {
    const word = refusalWord(error);
    if (word !== null) return refusalSentence(word);
    const latex = latexWord(error);
    if (latex !== null) return latexSentence(latex, names);
    const terminal = terminalWord(error);
    if (terminal !== null) return terminalSentence(terminal, names);
    return catalogText('ui.answer_refused', status);
}

/** The `error` of a refused answer's body, when the body carries one that is text. */
const refusalShape = z.object({ error: z.string() });

/**
 * The sentence a failed read is told in. `body` is what `readJson` made of the response: undefined
 * for a body that is JSON null or is not JSON, which is an answer the page could not read at any
 * status, and otherwise the parsed body, whose `error` is said as a catalog word when it is one.
 */
export function failedAnswer(response: { status: number }, body: unknown): string {
    if (body === undefined) return unreadableAnswer(response.status);
    return refusedAnswer(response.status, readAs(refusalShape, body)?.error);
}
