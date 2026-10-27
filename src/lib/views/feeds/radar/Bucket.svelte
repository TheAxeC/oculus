<script lang="ts">
    // Layer 3, view partial of views/feeds/radar/Radar.svelte. One ordered radar bucket and its
    // cards, without owning feed rules. The bucket is the group every grouping of a view is drawn
    // as (ui/controls/heads/GroupHead.svelte), headed by the bucket's glyph, where it has one, and
    // its label in the bucket's hue, the unknown tone `toneOf` gives for a colour that names no
    // hue, with the count of its papers; it folds by its control, and the radar keeps the fold. The
    // cards are drawn in the shared card grid (views/shared/card/record/CardGrid.svelte), each with
    // its own relevance bar, so the bucket's hue is the heading's alone.

    import GroupHead from '$lib/ui/controls/heads/GroupHead.svelte';
    import RadarCard from '../../shared/card/feed/RadarCard.svelte';
    import CardGrid from '../../shared/card/record/CardGrid.svelte';
    import Reveal from '../../shared/card/Reveal.svelte';
    import type { FeedIdent } from '$lib/state/shared/page/idents';
    import {
        sortBucket,
        type Project,
        type RadarBucket,
        type RadarEntry
    } from '$lib/state/feeds/radar';
    import { asText } from '$lib/state/forms/schema';
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
        /** Whether the bucket is open, and the press of its fold control. */
        open: boolean;
        ontoggle: () => void;
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
        onrevealed,
        open,
        ontoggle
    }: Props = $props();
    const ordered = $derived(sortBucket(entries));
    const tone = $derived(toneOf(bucket.color));
</script>

<GroupHead
    data-bucket={bucket.key}
    label={bucket.label}
    glyph={bucket.glyph === '' ? undefined : bucket.glyph}
    {tone}
    count={entries.length}
    {open}
    {ontoggle}
>
    <CardGrid>
        {#each ordered as entry, at (`${asText(entry.title)}:${at}`)}
            {@const ident = identOf(entry)}
            <Reveal id={ident} wanted={open ? reveal : ''} {onrevealed}>
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
    </CardGrid>
</GroupHead>
