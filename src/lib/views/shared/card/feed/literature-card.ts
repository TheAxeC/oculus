// Layer 3, shared view helper. Copy BibTeX of the collection whose entry names the `literature`
// registry: on one entry's card, which the collection view
// (views/boards/collection/Collection.svelte) and the entry page (views/boards/entry/Entry.svelte)
// both draw, and of every entry the view shows, from its toolbar. The entries are made by
// state/feeds/literature/bibtex.ts under each entry's own key; the copy puts them on the clipboard
// and says how many it copied and which it could not.

import { routeBody } from '$lib/state/feeds/literature/answers';
import { savedEntriesFor, type Copied } from '$lib/state/feeds/literature/bibtex';
import { savedPaperOf } from '$lib/state/feeds/literature/saved';
import type { Collection, Entry } from '$lib/state/boards/collection';
import { t } from '$lib/state/shared/words/text';
import type { CardAction } from '../CardActions.svelte';

/** What a copy says: how many entries it copied, and the keys of those it could not make. */
function copiedWords(copied: Copied): string {
    const count =
        copied.copied.length === 1
            ? t('literature.bibtex_copied_one')
            : t('literature.bibtex_copied', copied.copied.length);
    if (copied.failed.length === 0) return count;
    return t('literature.bibtex_not_copied', count, copied.failed.join(', '));
}

/** Copy the BibTeX of the entries given, in their order, and say what was copied. */
export async function copyBibtex(entries: Entry[], token: string): Promise<string> {
    const papers = entries.map((entry) => savedPaperOf(entry.fields));
    const copied = await savedEntriesFor(papers, (url) => routeBody(url, token));
    if (copied.copied.length === 0) return copiedWords(copied);
    try {
        await navigator.clipboard.writeText(copied.text);
    } catch {
        return t('literature.copy_failed');
    }
    return copiedWords(copied);
}

/**
 * The extra control of a Literature entry's card, Copy BibTeX, for an entry of the collection whose
 * entry names the `literature` registry (`collection` holds the entry, null for none), and none
 * for another collection.
 */
export function literatureCardActions(
    collection: Pick<Collection, 'registry'> | null,
    entry: Entry,
    token: () => string,
    onsaid: (words: string) => void
): CardAction[] {
    if (collection?.registry !== 'literature') return [];
    return [
        {
            id: 'bibtex',
            label: t('literature.bibtex'),
            title: t('literature.bibtex_entry_tip'),
            glyph: 'copy',
            onclick: async () => {
                onsaid(await copyBibtex([entry], token()));
            }
        }
    ];
}
