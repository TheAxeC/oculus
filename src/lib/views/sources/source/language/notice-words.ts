// Layer 3, view partial of Source.svelte. The words of a notice the language server client
// (ui/controls/editor/kit/lsp/) gives the page by name: a notice of an edit a server asks for
// (`LSP_EDIT_NOTICES`) and the few of formatting and rename, each in the catalog's sentence. Any
// other name is shown as it is given.

import { LSP_EDIT_NOTICES } from '$lib/data/prose/text-edits';
import { t } from '$lib/state/shared/words/text';

/** A notice of the editor extension, by its name, in the catalog's words. */
export function noticeWords(key: string, words: string[]): string {
    if ((LSP_EDIT_NOTICES as readonly string[]).includes(key)) {
        return t(`source.${key}`, ...words);
    }
    if (key === 'format_failed') return t('source.format_failed', ...words);
    if (key === 'format_timeout') return t('source.format_timeout');
    if (key === 'rename_none') return t('source.rename_none');
    if (key === 'rename_preview') return t('source.rename_preview');
    return key;
}
