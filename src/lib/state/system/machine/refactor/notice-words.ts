// Layer 2, client state. The words of a notice the language server client
// (ui/controls/editor/kit/lsp/) gives the page by name, and of the notices a Markdown link
// rewrite is refused with: a notice of an edit a server asks for (`LSP_EDIT_NOTICES`) and the few
// of formatting and rename, each in the catalog's sentence. Any other name is shown as it is
// given. A notice that says how many files were written carries that count among its words
// (`LSP_COUNTED_NOTICES` names its place), and its sentence takes the form of the count.

import { LSP_COUNTED_NOTICES, LSP_EDIT_NOTICES } from '../../../../data/prose/text-edits.ts';
import { plural, t } from '../../../shared/words/text.ts';

/** A notice of the editor extension, by its name, in the catalog's words. */
export function noticeWords(key: string, words: string[]): string {
    if ((LSP_EDIT_NOTICES as readonly string[]).includes(key)) {
        const at = Object.hasOwn(LSP_COUNTED_NOTICES, key)
            ? LSP_COUNTED_NOTICES[key as keyof typeof LSP_COUNTED_NOTICES]
            : undefined;
        if (at !== undefined) return plural(`source.${key}`, Number(words[at]), ...words);
        return t(`source.${key}`, ...words);
    }
    if (key === 'format_failed') return t('source.format_failed', ...words);
    if (key === 'format_timeout') return t('source.format_timeout');
    if (key === 'rename_none') return t('source.rename_none');
    if (key === 'rename_preview') return t('source.rename_preview');
    return key;
}
