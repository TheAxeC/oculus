<script lang="ts">
    // Layer 3, view partial of views/feeds/radar/Radar.svelte. One ordered radar bucket and its
    // cards. The heading is a ToolButton and the section begins open, without owning feed rules.

    import Glyph from '$lib/ui/display/Glyph.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import RadarCard from './RadarCard.svelte';
    import Reveal from '../../shared/card/Reveal.svelte';
    import type { FeedIdent } from '$lib/state/feeds/idents';
    import {
        sortBucket,
        type Project,
        type RadarBucket,
        type RadarEntry
    } from '$lib/state/feeds/radar';
    import { asText } from '$lib/state/forms/schema';
    import { t } from '$lib/state/shared/words/text';
    import { toneOf } from '$lib/state/shared/words/tones';

    type Props = {
        bucket: RadarBucket;
        entries: RadarEntry[];
        lastRun: unknown;
        projects: Record<string, Project>;
        cursor: string | null;
        /** The identity of one entry over the whole feed, so two equal titles stay apart. */
        identOf: FeedIdent;
        onsaid: (words: string) => void;
        reveal?: string;
        onrevealed: () => void;
    };

    let {
        bucket,
        entries,
        lastRun,
        projects,
        cursor,
        identOf,
        onsaid,
        reveal = '',
        onrevealed
    }: Props = $props();
    let open = $state(true);
    const ordered = $derived(sortBucket(entries));
    const heading = $derived(t('radar.count', bucket.label, entries.length));
</script>

<section
    style={`--bucket-tone: var(--c-${toneOf(bucket.color)}); --bucket-txt: var(--c-${toneOf(bucket.color)}-txt)`}
>
    <ToolButton label={heading} active={open} onclick={() => (open = !open)}>
        <span class="heading">
            <span class="mark"><Glyph name={bucket.glyph} /></span>
            {heading}
        </span>
    </ToolButton>
    {#if open}
        <div class="cards">
            {#each ordered as entry, at (`${asText(entry.title)}:${at}`)}
                {@const ident = identOf(entry)}
                <Reveal id={ident} wanted={reveal} {onrevealed}>
                    <RadarCard
                        {entry}
                        id={ident}
                        cursor={cursor === ident}
                        {lastRun}
                        {projects}
                        {onsaid}
                    />
                </Reveal>
            {/each}
        </div>
    {/if}
</section>

<style>
    section {
        padding-left: 8px;
        border-left: 3px solid var(--bucket-tone);
    }

    /* The bucket glyphs are colour names in the vocabulary, and a line icon carries no colour, so
       the heading's mark is drawn in the bucket's own hue. The cards below keep their own. */
    .heading {
        display: inline-flex;
        align-items: center;
        gap: 4px;
    }

    .mark {
        display: inline-flex;
        color: var(--bucket-txt);
    }

    /* A column is never wider than the pane, and a card never wider than its column, so a card
       holding one long line shrinks with the pane rather than widening it. */
    .cards {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(min(340px, 100%), 1fr));
        gap: 8px;
        margin-top: 8px;
    }

    .cards > :global(*) {
        min-width: 0;
    }
</style>
