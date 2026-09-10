<script lang="ts">
    import '$lib/themes/tokens.css';
    import '$lib/themes/themes.css';
    import favicon from '$lib/assets/favicon.svg';

    let { children } = $props();
</script>

<svelte:head>
    <link rel="icon" href={favicon} />
</svelte:head>

{@render children()}

<style>
    /* The page's own two colours. Every other surface is a component's, and every component reads
       the tokens; O8 sets the theme class on the body and the derived -txt tokens with it. */
    :global(body) {
        margin: 0;
        background: var(--bg);
        color: var(--ink-txt, var(--ink));
        font: var(--fs-xl) / 1.5 var(--font-ui);
    }
</style>
