<script lang="ts">
    // Layer 3, shared view. A project's addresses, one line each: first the code line, the
    // manifest's `repository.url`, or its `code_availability.url` where it has no repository
    // address, and then the manifest's `links:`. A value that holds only spaces is no address. An
    // address is a link only when views/shared/card/feed/posting.ts says it names a web page. The
    // code line carries the glyph of repositories, as a link or as the words it is. A `links:`
    // entry that names a web page is a link with the glyph of a link; any other entry is the words
    // it is with no glyph, a web address written among them a link
    // (ui/display/text/LinkedText.svelte). A `links:` entry that is the code line's address is
    // drawn once, as the code line.

    import Glyph from '$lib/ui/display/Glyph.svelte';
    import LinkedText from '$lib/ui/display/text/LinkedText.svelte';
    import { posting } from '../feed/posting';
    import type { BoardItem } from '$lib/state/boards/board';

    type Props = {
        /** The joined board item whose addresses are drawn. */
        item: BoardItem;
    };
    let { item }: Props = $props();

    /**
     * The code line's address as the manifest writes it: the repository's, else the code
     * deposit's, each only when it holds more than spaces; undefined when neither does.
     */
    const code = $derived(
        [item.project.repository?.url, item.project.codeAvailability?.url].find(
            (url) => url !== undefined && url.trim() !== ''
        )
    );
    const codeHref = $derived(code === undefined ? undefined : posting(code));

    /**
     * Whether two values are one address: the same web page by `posting`, or, where `posting`
     * names a web page for neither, the same trimmed text.
     */
    function same(one: string, other: string): boolean {
        const page = posting(one);
        const otherPage = posting(other);
        if (page !== undefined || otherPage !== undefined) return page === otherPage;
        return one.trim() === other.trim();
    }

    /** The manifest's `links:`, the code line's address left out. */
    const links = $derived(
        (item.project.links ?? []).filter((link) => code === undefined || !same(link, code))
    );
</script>

{#if code !== undefined || links.length > 0}
    <ul class="links">
        {#if code !== undefined}
            <li>
                {#if codeHref !== undefined}
                    <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- the address is data, an external web page, and no route id resolve() takes -->
                    <a href={codeHref} target="_blank" rel="noreferrer">
                        <Glyph name="repositories" />
                        <span>{code}</span>
                    </a>
                {:else}
                    <span class="words">
                        <Glyph name="repositories" />
                        <span>{code}</span>
                    </span>
                {/if}
            </li>
        {/if}
        {#each links as link, index (`${index}:${link}`)}
            {@const href = posting(link)}
            <li>
                {#if href !== undefined}
                    <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- the address is data, an external web page, and no route id resolve() takes -->
                    <a {href} target="_blank" rel="noreferrer">
                        <Glyph name="link" />
                        <span>{link}</span>
                    </a>
                {:else}
                    <span><LinkedText text={link} /></span>
                {/if}
            </li>
        {/each}
    </ul>
{/if}

<style>
    .links {
        display: flex;
        flex-direction: column;
        gap: 2px;
        margin: 6px 0 0;
        padding: 0;
        overflow-wrap: anywhere;
        list-style: none;
        font-size: var(--fs-sm);
    }

    .links a,
    .words {
        display: inline-flex;
        align-items: center;
        gap: 4px;
    }

    .links a {
        color: var(--accent-txt, var(--accent));
    }
</style>
