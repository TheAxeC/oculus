<script lang="ts">
    // Layer 3, primitive. A text of the hub's data (a meta row's value, a subtitle, a note, a
    // free-text field, a card's line) with each web address in it drawn as a link: the runs
    // ui/html.ts's linkRuns cuts the text into, an address as an `<a>` holding the address as
    // written, opened in a new browser tab, and a plain run as text, with no element of its own
    // around them, so the text sits in its parent's layout as the bare text did. In the desktop
    // app the window guard (src/desktop/windows/) sends such a link to the system browser. A
    // press on a link opens it and goes no further, so the row or card it sits in does not take
    // the press as its own. CodeText.svelte draws its plain words through this when it is asked to
    // link them, for a data text whose backticked words are code.

    import { linkRuns } from '../../html';

    type Props = {
        /** The text as the data holds it. */
        text: string;
    };

    let { text }: Props = $props();

    const runs = $derived(linkRuns(text));
</script>

{#each runs as run, index (index)}
    {#if run.href !== undefined}
        <!-- eslint-disable svelte/no-navigation-without-resolve -- the address is data, an external web page, and no route id resolve() takes -->
        <a
            href={run.href}
            target="_blank"
            rel="noreferrer"
            onclick={(event) => event.stopPropagation()}>{run.text}</a
        >
        <!-- eslint-enable svelte/no-navigation-without-resolve -->
    {:else}
        {run.text}
    {/if}
{/each}

<style>
    a {
        color: var(--accent-txt, var(--accent));
        overflow-wrap: anywhere;
    }
</style>
