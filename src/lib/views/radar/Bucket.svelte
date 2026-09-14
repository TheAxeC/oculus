<script lang="ts">
    // Layer 3, view partial of views/Radar.svelte. One ordered radar bucket and its cards.
    // The heading is a ToolButton and the section begins open, without owning feed rules.

    import ToolButton from '$lib/ui/ToolButton.svelte';
    import RadarCard from './RadarCard.svelte';
    import Reveal from '../shared/Reveal.svelte';
    import { feedIdentity } from '$lib/state/palette';
    import { sortBucket, type Project, type RadarBucket, type RadarEntry } from '$lib/state/radar';
    import { t } from '$lib/state/text';
    import { toneOf } from '$lib/state/tones';

    type Props = {
        bucket: RadarBucket;
        entries: RadarEntry[];
        lastRun: unknown;
        projects: Record<string, Project>;
        cursor: string | null;
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
            {#each ordered as entry, at (`${String(entry.title ?? '')}:${at}`)}
                <Reveal id={feedIdentity('radar', entry)} wanted={reveal} {onrevealed}>
                    <RadarCard
                        {entry}
                        id={feedIdentity('radar', entry)}
                        cursor={cursor === feedIdentity('radar', entry)}
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
