<script lang="ts">
    // Layer 3, Pillars partial. Non-real work as the record card
    // (views/shared/card/record/RecordCard.svelte), grouped by the words of `stages` that carry a
    // `dead` number, in the order of those numbers. The groups are the project strip at its foot
    // (views/shared/links/CrossLinks.svelte), each headed by its stage's label and glyph with its
    // count and opening to its project links in the snapshot's order, one stage open at a time. The
    // card has no action, so no menu of its own.

    import Tag from '$lib/ui/controls/Tag.svelte';
    import Glyph from '$lib/ui/display/Glyph.svelte';
    import RecordCard from '$lib/views/shared/card/record/RecordCard.svelte';
    import { wordGlyph } from '$lib/views/shared/card/card';
    import { archivedCount, type ArchiveGroup } from '$lib/state/boards/structure/lines';
    import { stageGroup } from '$lib/state/boards/structure/cross-links';
    import { chipGlyphName, chipLabel } from '$lib/state/shared/words/tones';
    import { inlineMarkdown } from '$lib/ui/html';
    import { t } from '$lib/state/shared/words/text';

    type Props = { id: string; cursor: boolean; groups: ArchiveGroup[] };
    let { id, cursor, groups }: Props = $props();
    const count = $derived(archivedCount(groups));

    /** One strip group per stage, headed by the stage's label and glyph. */
    const strip = $derived(
        groups.map((group) =>
            stageGroup(
                {
                    word: group.stage,
                    label: chipLabel(group.stage),
                    glyph: wordGlyph(chipGlyphName(group.stage))
                },
                group.projects
            )
        )
    );
</script>

{#snippet meta()}
    <Glyph name="archived" />
    <Tag label={t('pillars.not_active', count)} />
{/snippet}

{#snippet text()}
    <!-- eslint-disable-next-line svelte/no-at-html-tags -- inline Markdown sanitises what it renders -->
    <p>{@html inlineMarkdown(t('pillars.archival_blurb'))}</p>
{/snippet}

<div class="muted" data-pillar-archival>
    <RecordCard {id} {cursor} title={t('pillars.archival')} {meta} {text} groups={strip} oneOpen />
</div>

<style>
    /* The archival card is faded as archival; while the pointer is over it or the keyboard focus
       is inside it the fade lifts, so it is read at full strength. */
    .muted {
        display: flex;
        flex-direction: column;
        min-width: 0;
        opacity: 0.62;
        transition: opacity 120ms ease;
    }

    .muted:hover,
    .muted:focus-within {
        opacity: 1;
    }

    @media (prefers-reduced-motion: reduce) {
        .muted {
            transition: none;
        }
    }

    p {
        margin: 0;
        color: var(--muted-txt, var(--muted));
    }
</style>
