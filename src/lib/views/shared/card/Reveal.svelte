<script lang="ts">
    // Layer 3, shared view partial. One wrapper around a card that may be the palette's
    // destination: it scrolls that card to the middle, flashes it once, then tells the owning view
    // to clear the reveal id from its instance state.

    import type { Snippet } from 'svelte';

    type Props = {
        id: string;
        wanted?: string;
        onrevealed: () => void;
        children?: Snippet;
    };

    let { id, wanted = '', onrevealed, children }: Props = $props();
    let node: HTMLDivElement | undefined = $state();
    let flashing = $state(false);

    $effect(() => {
        if (node === undefined || wanted === '' || wanted !== id) return;
        node.scrollIntoView({ block: 'center' });
        flashing = true;
        const timer = window.setTimeout(() => {
            flashing = false;
            onrevealed();
        }, 900);
        return () => window.clearTimeout(timer);
    });
</script>

<div bind:this={node} class:flashing data-reveal={id}>
    {#if children}
        {@render children()}
    {/if}
</div>

<style>
    .flashing {
        animation: reveal-flash 900ms ease-out;
    }

    @keyframes reveal-flash {
        0%,
        100% {
            box-shadow: none;
        }
        20%,
        75% {
            box-shadow: inset 0 0 0 2px var(--accent);
        }
    }
</style>
