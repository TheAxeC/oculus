<script lang="ts">
    // Layer 3, shared view partial. Save to Literature on a paper's card: the Literature search
    // card and the Lit Watch card draw it. The hubs it offers are those that could take a new entry
    // of the Literature collection (`hubsTaking` of state/shared/page/hubs.ts): a hub holds the
    // collection its list names, and also the one its list leaves to the engine's path when the
    // file is there. With more than one, a press opens a menu of them, the primary first, each by
    // its name, and the pick saves the paper there; with one, a press saves there at once, primary
    // or not. The save names the hub, so the server writes where the card looks. The button reads
    // In Literature, not pressable, once any of those hubs' collections holds the paper by the rule
    // the server refuses a second copy by, so a card offers Save only while no hub holds it. In
    // Literature is drawn waiting, not disabled, so it keeps a place in the focus order: when a
    // save pressed or picked from the control lands with the focus lost, In Literature takes it,
    // and the keyboard stays on the card. What the save answered is said under the button, in the
    // card; a refused save also gets the notification every refused write gets
    // (state/client/writes.svelte.ts).

    import { untrack } from 'svelte';
    import Menu from '$lib/ui/menu/Menu.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { focusIsFree, focusQuietly } from '$lib/ui/frame/quiet-focus';
    import { inLiterature, LITERATURE, type PaperIds } from '$lib/state/feeds/literature/saved';
    import { hubsTaking, keyOf } from '$lib/state/shared/page/hubs';
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
    /** The control's box, which In Literature is found in. */
    let box = $state<HTMLElement | undefined>(undefined);
    /** Whether In Literature takes the focus once drawn: the save came from the focused control. */
    let refocus = $state(false);
    /**
     * Whether a save answered ok while no hub's collection held the paper yet: the next change of
     * the collections either holds it, and In Literature takes the focus, or ends the wait for it.
     */
    let landed = false;

    /** The Literature collection of each hub that holds one. */
    const held = $derived(collectionsOfKey(LITERATURE));
    /** The hubs a save can write to, the primary first. */
    const hubs = $derived(hubsTaking(held, primary()));
    const saved = $derived(
        held.some((one) =>
            inLiterature(
                ids,
                one.entries.map((entry) => entry.fields)
            )
        )
    );

    /**
     * Save the paper to the hub named, or, with no hub holding Literature, where the server picks.
     */
    async function save(hub: string | undefined): Promise<void> {
        if (saving) return;
        saving = true;
        refocus = box?.contains(document.activeElement) ?? false;
        try {
            const answer = await saveLiterature(source, paper, hub);
            const refused = refusalWords(answer);
            if (refused !== '') refocus = false;
            // The answer's id is the paper's id in the portfolio; its citation key is the key.
            said = refused === '' ? t('literature.saved', keyOf(answer.id ?? '')) : refused;
            landed = refused === '' && !saved;
        } finally {
            saving = false;
        }
    }

    // Once the paper is held and In Literature is drawn in the control's place, it takes the focus
    // the control held, unless the focus went somewhere else meanwhile. The control taken off the
    // page still counts as holding nothing (`focusIsFree`), and the focus is the page's, so it opens
    // no tooltip over the line the save wrote under the button.
    $effect(() => {
        if (!saved || !refocus) return;
        untrack(() => {
            refocus = false;
            const button = box?.querySelector('button');
            if (button && focusIsFree()) focusQuietly(button);
        });
    });

    // A save that answered ok waits for the collections to hold the paper for one change of them
    // only, so a paper the answer's entry does not match never takes the focus later.
    $effect(() => {
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions -- the read is the dependency
        held;
        untrack(() => {
            if (!landed) return;
            landed = false;
            if (!saved) refocus = false;
        });
    });
</script>

<span class="save" bind:this={box}>
    {#if saved}
        <ToolButton
            label={t('literature.in_literature')}
            glyph="book"
            waiting
            title={t('literature.in_literature_tip')}
            onclick={() => undefined}
        />
    {:else if hubs.length > 1}
        <Menu
            label={t('literature.save')}
            glyph="book"
            title={t('literature.save_hub_tip')}
            placement="down"
            waiting={saving}
            items={hubs.map((hub) => ({ id: hub, label: hub }))}
            onpick={(hub: string) => void save(hub)}
        />
    {:else}
        <ToolButton
            label={t('literature.save')}
            glyph="book"
            waiting={saving}
            title={t('literature.save_tip')}
            onclick={() => save(hubs.at(0))}
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
