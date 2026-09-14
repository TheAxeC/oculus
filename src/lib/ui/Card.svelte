<script lang="ts">
    // Layer 3, primitive. A card-surface box with a title, a meta row under it, a body and an
    // optional footer. It knows no domain: what the chips in the meta row say and what the body
    // holds are the caller's snippets.
    //
    // The tone is a hue name, not a colour: the component turns it into `--c-<tone>` on its own
    // custom property and the bar paints that, so the only colours here are tokens.

    import type { Snippet } from 'svelte';
    import { sanitise } from './html';

    type Props = {
        /** The stable item id used by keyboard navigation. */
        id: string;
        /** Whether this card is the instance's current keyboard cursor. */
        cursor: boolean;
        /** The card's own words, already translated by the view. */
        title: string;
        /** The title as inline Markdown already rendered; the card sanitises it before drawing. */
        titleHtml?: string;
        /** A hue name from state/tones.ts. A card with none has no bar. */
        tone?: string;
        /** Draws an accent ring inside the border, for a card the view is holding on to. */
        pinned?: boolean;
        /** The heading level, so a card inside a section is not always an h3. */
        level?: number;
        /**
         * What a click on the title does. Given one, the title's words become a button inside the
         * heading; a card with none draws the words as text, which is what every other card does.
         */
        ontitle?: () => void;
        /** The row under the title, where chips go. */
        meta?: Snippet;
        /** The body. */
        children?: Snippet;
        /** A row along the foot, under a hairline. */
        footer?: Snippet;
    };

    let {
        id,
        cursor,
        title,
        titleHtml,
        tone,
        pinned = false,
        level = 3,
        ontitle,
        meta,
        children,
        footer
    }: Props = $props();

    const heading = $derived(`h${Math.min(6, Math.max(1, Math.trunc(level)))}`);
    const style = $derived(tone === undefined ? undefined : `--tone: var(--c-${tone})`);
</script>

<article
    class="card"
    class:toned={tone !== undefined}
    class:pinned
    {style}
    data-card={id}
    data-cursor={cursor || undefined}
>
    {#if tone !== undefined}
        <span class="bar"></span>
    {/if}
    <div class="face">
        <svelte:element this={heading} class="title">
            {#if ontitle !== undefined && titleHtml !== undefined}
                <button type="button" class="open" onclick={ontitle}>
                    <!-- eslint-disable-next-line svelte/no-at-html-tags -- the sanitiser writes this -->
                    {@html sanitise(titleHtml)}
                </button>
            {:else if ontitle !== undefined}
                <button type="button" class="open" onclick={ontitle}>{title}</button>
            {:else if titleHtml !== undefined}
                <!-- eslint-disable-next-line svelte/no-at-html-tags -- the sanitiser writes this -->
                {@html sanitise(titleHtml)}
            {:else}
                {title}
            {/if}
        </svelte:element>
        {#if meta}
            <div class="meta">{@render meta()}</div>
        {/if}
        {#if children}
            <div class="body">{@render children()}</div>
        {/if}
        {#if footer}
            <div class="footer">{@render footer()}</div>
        {/if}
    </div>
</article>

<style>
    .card {
        position: relative;
        display: flex;
        background: var(--card);
        border: 1px solid var(--line);
        border-radius: var(--radius);
        box-shadow: var(--shadow);
        overflow: hidden;
    }

    /* Over a wallpaper a card keeps most of its own colour and lets the picture through the rest. The backdrop blur takes the picture's detail out from behind the text without smearing the picture itself. */
    :global(body.wall) .card {
        background: color-mix(in srgb, var(--card) var(--wall-panel), transparent);
        backdrop-filter: blur(var(--wall-blur));
    }

    /* The ring is drawn inside the border rather than as a second border, so a pinned card and an
       unpinned one are the same size and a list of them does not jump. */
    .card.pinned {
        box-shadow: inset 0 0 0 2px var(--accent);
    }

    :global(.card[data-cursor]) {
        outline: 2px solid var(--accent);
        outline-offset: -3px;
    }

    .bar {
        flex: 0 0 3px;
        background: var(--tone);
    }

    .face {
        flex: 1 1 auto;
        min-width: 0;
        padding: 10px 12px;
    }

    .title {
        margin: 0;
        font-size: var(--fs-xl);
        font-weight: 700;
        color: var(--ink-txt, var(--ink));
    }

    /* The title as a control: the heading's own words, underlined only under the pointer, so the
       card still reads as a card rather than as a link. */
    .open {
        display: inline;
        margin: 0;
        padding: 0;
        border: none;
        background: none;
        color: inherit;
        font: inherit;
        text-align: left;
        cursor: pointer;
    }

    .open:hover {
        text-decoration: underline;
    }

    .open:focus-visible {
        outline: 2px solid var(--accent);
        outline-offset: 2px;
    }

    .meta {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 6px;
        margin-top: 6px;
    }

    .meta :global(.chip) {
        font-size: var(--fs-xs);
    }

    .body {
        margin-top: 8px;
        font-size: var(--fs-md);
        color: var(--ink-txt, var(--ink));
    }

    .footer {
        margin-top: 10px;
        padding-top: 8px;
        border-top: 1px solid var(--line);
        font-size: var(--fs-sm);
        color: var(--muted-txt, var(--muted));
    }

    /* The terminal shape: a window with a square frame, not a rounded panel. */
    :global(body.rice) .card {
        border-radius: var(--radius-sm);
        box-shadow: none;
    }

    :global(body.rice) .card.pinned {
        border-color: var(--accent);
    }

    :global(body.rice) .title {
        font-size: var(--fs-md);
        letter-spacing: 0.01em;
    }
</style>
