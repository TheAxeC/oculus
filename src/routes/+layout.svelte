<script lang="ts">
    // Layer 3, route. The page's root: the theme's styles, the code colours every painted block of
    // code takes (themes/code.css), the frame a slide is laid out in (themes/slide.css), the thin
    // bar every scrolling box draws (ui/theme/scrollbar.css) and the icon, and the one tooltip
    // group every control of the page is drawn under, so one tooltip is open at a time.

    import type { Snippet } from 'svelte';
    import TooltipGroup from '$lib/ui/menu/TooltipGroup.svelte';

    import '$lib/themes/tokens.css';
    import '$lib/themes/themes.css';
    import.meta.glob('/src/lib/themes/rice/*.css', { eager: true });
    import '$lib/themes/vscode.css';
    import '$lib/themes/code.css';
    import '$lib/themes/slide.css';
    import '$lib/ui/theme/scrollbar.css';
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
       component's, and every component reads the tokens; ui/theme/theme.ts sets the theme class on
       the body and the derived -txt tokens with it. Before the page's first draw the window's
       ground is the start theme's, painted on the root element by the ground element of the page's
       first HTML (hooks.server.ts); that draw takes the element away, so from then on this
       background is the whole window's, the area below a short page included. */
    :global(body) {
        margin: 0;
        background: var(--bg);
        color: var(--ink-txt, var(--ink));
        font: var(--fs-md) / 1.5 var(--font-ui);
    }
</style>
