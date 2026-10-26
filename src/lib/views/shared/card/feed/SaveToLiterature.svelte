<script lang="ts">
    // Layer 3, shared view partial. Save to Literature as a control of the Literature search
    // card's meta row, drawn at rest too; the Lit Watch card and the search card's menu carry the
    // same Save as a row. Which hubs it offers and when it reads In Literature is the card's
    // `literature` (literature-save.svelte.ts).
    //
    // With more than one hub, a press opens a menu of them; with one, a press saves there at once.
    // In Literature is drawn waiting, not disabled, so it keeps a place in the focus order: when a
    // save pressed or picked from the control lands with the focus lost, In Literature takes it,
    // and the keyboard stays on the card. What the save answered is said under the button, in the
    // card; a refused save also gets the notification every refused write gets
    // (state/client/writes.svelte.ts).

    import { untrack } from 'svelte';
    import Menu from '$lib/ui/menu/Menu.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { focusIsFree, focusQuietly } from '$lib/ui/frame/quiet-focus';
    import { t } from '$lib/state/shared/words/text';
    import type { LiteratureSave } from './literature-save.svelte';

    type Props = {
        /** The card's Save, which its menu row shares, so a save from either waits in both. */
        literature: LiteratureSave;
    };

    let { literature }: Props = $props();

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

    /**
     * Save the paper to the hub named, or, with no hub holding Literature, where the server picks.
     */
    async function save(hub: string | undefined): Promise<void> {
        if (literature.saving) return;
        refocus = box?.contains(document.activeElement) ?? false;
        const answer = await literature.save(hub);
        if (answer === null) return;
        if (answer.refused) refocus = false;
        said = answer.words;
        landed = !answer.refused && !literature.saved;
    }

    // Once the paper is held and In Literature is drawn in the control's place, it takes the focus
    // the control held, unless the focus went somewhere else meanwhile. The control taken off the
    // page still counts as holding nothing (`focusIsFree`), and the focus is the page's, so it
    // opens no tooltip over the line the save wrote under the button.
    $effect(() => {
        if (!literature.saved || !refocus) return;
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
        literature.collections;
        untrack(() => {
            if (!landed) return;
            landed = false;
            if (!literature.saved) refocus = false;
        });
    });
</script>

<span class="save" bind:this={box}>
    {#if literature.saved}
        <ToolButton
            label={t('literature.in_literature')}
            glyph="book"
            waiting
            title={t('literature.in_literature_tip')}
            onclick={() => undefined}
        />
    {:else if literature.hubs.length > 1}
        <Menu
            label={t('literature.save')}
            glyph="book"
            title={t('literature.save_hub_tip')}
            placement="down"
            waiting={literature.saving}
            items={literature.hubs.map((hub) => ({ id: hub, label: hub }))}
            onpick={(hub: string) => void save(hub)}
        />
    {:else}
        <ToolButton
            label={t('literature.save')}
            glyph="book"
            waiting={literature.saving}
            title={t('literature.save_tip')}
            onclick={() => save(literature.hubs.at(0))}
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
