<script lang="ts">
    // Layer 3, shared view partial. The question asked before an entry is deleted, from a card's
    // menu and from the page's toolbar, and the delete itself once it is answered yes. For a record
    // other files refer to it names each of them, so the reader knows what will be left pointing at
    // nothing: the references stay in the files that hold them and show as findings on the Findings
    // view, and the delete is a row of History that Undo takes back. A refusal of the write is
    // handed to `onsaid` as a sentence.

    import Confirm from '$lib/ui/controls/confirm/Confirm.svelte';
    import { deletePage } from '$lib/state/forms/entry-save';
    import { referrersOf } from '$lib/state/forms/referrers';
    import { refusalWords } from '../answer-words';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';

    const {
        entities: { portfolio },
        pages: { pageOf },
        selectors: { configMap },
        writes
    } = useState();

    type Props = {
        /** The collection key, or the feed kind, of the entry. */
        collection: string;
        /** The key the entry's page is opened with. */
        id: string;
        onsaid: (said: string) => void;
        onclose: () => void;
    };

    let { collection, id, onsaid, onclose }: Props = $props();

    const page = $derived(pageOf(collection, id));
    const snapshot = $derived(portfolio());
    const referrers = $derived(
        snapshot === null ? [] : referrersOf(snapshot, configMap(), collection, id)
    );

    async function remove(): Promise<void> {
        const target = page;
        onclose();
        if (target === null) return;
        onsaid(refusalWords(await deletePage(target, writes)));
    }
</script>

{#if page !== null}
    <Confirm
        message={t('entry_form.delete_ask', page.title)}
        detail={referrers.length === 0
            ? ''
            : t('entry_form.delete_used', referrers.map((one) => one.label).join(', '))}
        confirm={t('entry_form.delete')}
        cancel={t('ui.confirm_cancel')}
        onconfirm={remove}
        oncancel={onclose}
    />
{/if}
