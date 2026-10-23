<script lang="ts">
    // Layer 3, shared view partial. Save to Literature on a paper's card: the Literature search
    // card and the Lit Watch card draw it. It writes the paper to the Literature collection of the
    // primary hub when the primary holds one, else of the first hub that does, naming that hub in
    // the write so the server writes where the card looks. A hub holds the collection its list
    // names, and also the one its list leaves to the engine's path when the file is there. The
    // button reads In Literature, not pressable, once that collection holds the paper by the rule
    // the server refuses a second copy by. What the save answered is said under the button, in the
    // card; a refused save also gets the notification every refused write gets
    // (state/client/writes.svelte.ts).

    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import {
        inLiterature,
        literatureHome,
        LITERATURE,
        type PaperIds
    } from '$lib/state/feeds/literature/saved';
    import { keyOf } from '$lib/state/shared/page/hubs';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';
    import { refusalWords } from '../../forms/answer-words';

    const {
        fs: { primary },
        selectors: { collectionsOfKey },
        writes: { saveLiterature }
    } = useState();

    type Props = {
        /** What the paper is compared by. */
        ids: PaperIds;
        /** The fields the save sends; the server cleans them and makes the key. */
        paper: Record<string, unknown>;
        source: 'search' | 'lit-watch';
    };

    let { ids, paper, source }: Props = $props();
    let saving = $state(false);
    /** What the last save answered, the empty string before any. */
    let said = $state('');

    /** The collection a save writes to: the primary hub's, else the first hub's that holds it. */
    const home = $derived(literatureHome(collectionsOfKey(LITERATURE), primary()));
    const entries = $derived((home?.entries ?? []).map((entry) => entry.fields));
    const saved = $derived(inLiterature(ids, entries));

    async function save(): Promise<void> {
        if (saving) return;
        saving = true;
        try {
            const answer = await saveLiterature(source, paper, home?.root);
            const refused = refusalWords(answer);
            // The answer's id is the paper's id in the portfolio; its citation key is the key.
            said = refused === '' ? t('literature.saved', keyOf(answer.id ?? '')) : refused;
        } finally {
            saving = false;
        }
    }
</script>

<span class="save">
    {#if saved}
        <ToolButton
            label={t('literature.in_literature')}
            glyph="book"
            disabled
            title={t('literature.in_literature_tip')}
            onclick={() => undefined}
        />
    {:else}
        <ToolButton
            label={t('literature.save')}
            glyph="book"
            disabled={saving}
            title={t('literature.save_tip')}
            onclick={save}
        />
    {/if}
    {#if said !== ''}
        <span class="said" role="status">{said}</span>
    {/if}
</span>

<style>
    /* The answer sits under the button and wraps within the card. */
    .save {
        display: inline-flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 2px;
        min-width: 0;
        max-width: 100%;
    }

    .said {
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-sm);
        overflow-wrap: anywhere;
    }
</style>
