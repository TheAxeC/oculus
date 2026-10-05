<script lang="ts">
    // Layer 3, view partial of views/sessions/terminal/Terminal.svelte. What a Terminal tab with no
    // row of terminals shows: the composer, or, while New Terminal's start in this tab is on its
    // way, the line saying which kind is starting, so the composer does not stand in for a
    // terminal that is about to appear. The tab's state decides nothing here; the terminals store
    // knows which starts are in flight.

    import Empty from '$lib/ui/frame/Empty.svelte';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';
    import Composer from './Composer.svelte';

    type Props = {
        /** The tab whose start this is. */
        owner: string;
        /** What a start that landed does with the terminal it made, and the words for its tab. */
        onstarted: (id: string, label: string) => void;
    };

    let { owner, onstarted }: Props = $props();

    const {
        terminals: { startingIn }
    } = useState();

    const kind = $derived(startingIn(owner));

    /** The word for the kind that is starting. */
    function kindWord(one: string): string {
        if (one === 'claude') return t('sessions.kind_claude');
        if (one === 'codex') return t('sessions.kind_codex');
        return t('sessions.kind_shell');
    }
</script>

<div class="start">
    {#if kind !== null}
        <Empty message={t('sessions.terminal_starting', kindWord(kind))} />
    {:else}
        <Composer {owner} {onstarted} />
    {/if}
</div>

<style>
    .start {
        display: flex;
        flex-direction: column;
        flex: 1 1 auto;
        gap: 8px;
        min-width: 0;
    }
</style>
