// Layer 3, view partial of Source.svelte. What a tab over a library file is: a file outside every
// served root that a language server named in an answer to this page,
// shown read-only. The tab's state holds the library address the relay gave this
// connection (state/sessions/source/draft.ts's `libraryTabState`) and no root or path; the root
// and the channel's language the address was named under are the lsp store's, which knows an
// address only for as long as the connection that was given it.
//
// While the store knows the address the text is read through the channel and the draft is that
// text, read-only, in the language of the server that named the file. When it does not (the page
// was reloaded, or the socket reconnected) the tab holds no text and says the library file is no
// longer open: going to definition opens it again, as a new tab.

import { untrack } from 'svelte';
import type { ClientState } from '$lib/state/client/context';
import type { LibraryAnswer } from '$lib/state/sessions/source/draft';
import { t } from '$lib/state/shared/words/text';
import { libraryAddress } from './tab-state';

/** What the tab says of itself, each as a function. */
export type LibraryTabInput = {
    client: ClientState;
    instance: () => string;
    /** The tab's saved state. */
    state: () => unknown;
    /** The tab's label, which is the library file's own name. */
    name: () => string;
};

/** The sentence of a read the relay or the page refused, by its code. */
function refusal(code: string): string {
    switch (code) {
        case 'not_served':
            return t('source.library_not_served');
        case 'not_file':
            return t('source.library_not_file');
        case 'moved':
            return t('source.library_moved');
        case 'binary':
            return t('source.library_binary');
        case 'too_large':
            return t('source.library_too_large');
        case 'unsent':
            return t('source.library_unsent');
        default:
            return t('source.library_gone');
    }
}

/** Make the library file facts of one source tab. */
export function createLibraryTab(input: LibraryTabInput) {
    const {
        lsp,
        source: { loadLibraryDraft }
    } = input.client;
    const address = $derived(libraryAddress(input.state()));
    const known = $derived(address === '' ? null : lsp.library(address));

    /** Read the file again whenever the address becomes known: after a reload it never does. */
    $effect(() => {
        const found = known;
        const wanted = address;
        if (found === null || wanted === '') return;
        const id = input.instance();
        untrack(() => {
            void loadLibraryDraft(id, wanted, async (): Promise<LibraryAnswer> => {
                const read = await lsp.readLibrary(wanted);
                return 'text' in read
                    ? { ok: true, text: read.text, language: found.language }
                    : { ok: false, error: refusal(read.code) };
            });
        });
    });

    return {
        /** The library address, or the empty string for a tab over a file. */
        get address() {
            return address;
        },
        /** Whether the tab is over a library file the connection no longer holds. */
        get gone() {
            return address !== '' && known === null;
        },
        /** The root key the file was named under, for the server's state and its output. */
        get root() {
            return known?.root ?? '';
        },
        /** The file's own name. */
        get name() {
            return input.name();
        }
    };
}
