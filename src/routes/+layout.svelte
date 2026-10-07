<script lang="ts">
    // Layer 3, route. The page's root: the theme's styles, the code colours every painted block of
    // code takes (themes/code.css), the frame a slide is laid out in (themes/slide.css) and the
    // icon, and the one tooltip group every control of the page is drawn under, so one tooltip is
    // open at a time.

    import type { Snippet } from 'svelte';
    import TooltipGroup from '$lib/ui/menu/TooltipGroup.svelte';

    import '$lib/themes/tokens.css';
    import '$lib/themes/themes.css';
    import '$lib/themes/code.css';
    import '$lib/themes/slide.css';
    import favicon from '$lib/assets/favicon.svg';

    let { children }: { children: Snippet } = $props();
</script>

<svelte:head>
    <link rel="icon" href={favicon} />
</svelte:head>

<TooltipGroup>
    {@render children()}
</TooltipGroup>

<style>
    /* The page's own two colours and the body's text size, the main-words step, which text drawn
       outside a pane (a popover or a menu portalled out of one) inherits. Every other surface is a
       component's, and every component reads the tokens; ui/theme.ts sets the theme class on the
       body and the derived -txt tokens with it. */
    :global(body) {
        margin: 0;
        background: var(--bg);
        color: var(--ink-txt, var(--ink));
        font: var(--fs-md) / 1.5 var(--font-ui);
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
