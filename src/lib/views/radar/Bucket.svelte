<script lang="ts">
    // Layer 3, view partial of views/Radar.svelte. One ordered radar bucket and its cards.
    // The heading is a ToolButton and the section begins open, without owning feed rules.

    import ToolButton from '$lib/ui/ToolButton.svelte';
    import RadarCard from './RadarCard.svelte';
    import Reveal from '../shared/Reveal.svelte';
    import type { FeedIdent } from '$lib/state/palette';
    import { sortBucket, type Project, type RadarBucket, type RadarEntry } from '$lib/state/radar';
    import { asText } from '$lib/state/schema';
    import { t } from '$lib/state/text';
    import { toneOf } from '$lib/state/tones';

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
</script>

<section style={`--bucket-tone: var(--c-${toneOf(bucket.color)})`}>
    <ToolButton
        label={t('radar.count', bucket.label, entries.length)}
        glyph={bucket.glyph}
        active={open}
        onclick={() => (open = !open)}
    />
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

    .cards {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(min(340px, 100%), 1fr));
        gap: 8px;
        margin-top: 8px;
    }
</style>
