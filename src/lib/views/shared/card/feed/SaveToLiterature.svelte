<script lang="ts">
    // Layer 3, shared view partial. Save to Literature on a paper's card: the Literature search
    // card and the Lit Watch card draw it. It writes the paper to the Literature collection of the
    // primary hub when the primary names the collection, else of the first hub that does, naming
    // that hub in the write so the server writes where the card looks, and reads In Literature, not
    // pressable, once that collection holds the paper by the rule the server refuses a second copy
    // by. What the save answered is said through `onsaid`, the line every write of the view answers
    // on.

    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import {
        inLiterature,
        literatureHome,
        LITERATURE,
        type PaperIds
    } from '$lib/state/feeds/literature/saved';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';
    import { refusalWords } from '../../forms/answer-words';

    const {
        selectors: { collectionsOfKey },
        writes: { saveLiterature }
    } = useState();

    type Props = {
        /** What the paper is compared by. */
        ids: PaperIds;
        /** The fields the save sends; the server cleans them and makes the key. */
        paper: Record<string, unknown>;
        source: 'search' | 'lit-watch';
        onsaid: (words: string) => void;
    };

    let { ids, paper, source, onsaid }: Props = $props();
    let saving = $state(false);

    /** The collection a save writes to: the primary hub's, else the first hub's that names it. */
    const home = $derived(literatureHome(collectionsOfKey(LITERATURE)));
    const entries = $derived((home?.entries ?? []).map((entry) => entry.fields));
    const saved = $derived(inLiterature(ids, entries));

    /**
     * The citation key the save gave the paper: its portfolio id, without the hub's name that the
     * id of an entry of a hub other than the primary starts with.
     */
    function citationKey(id: string): string {
        const prefix = home === undefined ? '' : `${home.root}:`;
        return prefix !== '' && id.startsWith(prefix) ? id.slice(prefix.length) : id;
    }

    async function save(): Promise<void> {
        if (saving) return;
        saving = true;
        try {
            const answer = await saveLiterature(source, paper, home?.root);
            const refused = refusalWords(answer);
            onsaid(refused === '' ? t('literature.saved', citationKey(answer.id ?? '')) : refused);
        } finally {
            saving = false;
        }
    }
</script>

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
