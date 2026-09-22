<script lang="ts">
    import type { Snippet } from 'svelte';

    import '$lib/themes/tokens.css';
    import '$lib/themes/themes.css';
    import favicon from '$lib/assets/favicon.svg';

    let { children }: { children: Snippet } = $props();
</script>

<svelte:head>
    <link rel="icon" href={favicon} />
</svelte:head>

{@render children()}

<style>
    /* The page's own two colours. Every other surface is a component's, and every component reads
       the tokens; ui/theme.ts sets the theme class on the body and the derived -txt tokens with
       it. */
    :global(body) {
        margin: 0;
        background: var(--bg);
        color: var(--ink-txt, var(--ink));
        font: var(--fs-xl) / 1.5 var(--font-ui);
    }

    /* Every scrolling box draws a thin bar in the theme's two scrollbar tokens, which ui/theme.ts
       derives for every theme, so no box draws the browser's light bar on a dark theme. A box that
       keeps no bar at all, the rail's list and the tab strip, says so in its own component, whose
       class outranks this. tokens.css gives the two tokens the default theme's values on :root, so
       the first paint draws the same bar. */
    :global(*) {
        scrollbar-width: thin;
        scrollbar-color: var(--scroll-thumb) var(--scroll-track);
    }
</style>
