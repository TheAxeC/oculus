<script lang="ts">
    // Layer 3, Present partial. One slide of the deck drawn as the kind it is. It is the one place
    // that knows which component each kind is, so the pane draws a slide by handing this the slide
    // and the deck and nothing else. The slide sits in a reading column of at most
    // `--slide-reading` (the frame's width less its padding, set by Present.svelte), centred in the
    // frame, and a part that centres its content takes the column's height.
    //
    // The first slide of a deck carries the key hint in its foot; no deck file holds one.

    import Grid from './parts/Grid.svelte';
    import Plain from './parts/Plain.svelte';
    import Project from './parts/Project.svelte';
    import Section from './parts/Section.svelte';
    import Summary from './parts/Summary.svelte';
    import Title from './parts/Title.svelte';
    import { tagToneOf } from '$lib/state/life/present';
    import { t } from '$lib/state/shared/words/text';
    import type { Deck, DeckSlide } from '$lib/state/life/present';

    type Props = {
        row: DeckSlide;
        deck: Deck;
        /** Whether this is the deck's first slide, which names the keys in its foot. */
        first: boolean;
    };

    let { row, deck, first }: Props = $props();
</script>

<div class="reading" data-slide-key={row.key}>
    {#if row.kind === 'title' || row.kind === 'closing'}
        <Title
            kind={row.kind}
            kicker={row.kicker}
            heading={row.heading}
            lede={row.lede}
            contact={row.contact}
            legend={row.legend}
        />
    {:else if row.kind === 'section'}
        <Section
            heading={row.heading}
            lede={row.lede}
            cards={row.cards}
            foot={row.foot}
            legend={row.legend}
        />
    {:else if row.kind === 'summary'}
        <Summary heading={row.heading} rows={row.rows} foot={row.foot} />
    {:else if row.kind === 'grid'}
        <Grid
            kind="grid"
            heading={row.heading}
            lede={row.lede}
            cards={row.cards}
            foot={row.foot}
            legend={row.legend}
        />
    {:else if row.kind === 'idea'}
        <Grid kind="idea" cards={[row.card]} />
    {:else if row.kind === 'project'}
        <Project
            slide={row.slide}
            title={row.title}
            type={row.type}
            domain={row.domain}
            tagTone={tagToneOf(deck, row.slide)}
        />
    {:else if row.kind === 'text' || row.kind === 'image' || row.kind === 'columns' || row.kind === 'equation' || row.kind === 'code'}
        <Plain {row} />
    {/if}
    {#if first}
        <p class="keys" data-key-hint>{t('present.key_hint')}</p>
    {/if}
</div>

<style>
    .reading {
        display: flex;
        flex-direction: column;
        width: 100%;
        max-width: var(--slide-reading);
        min-height: 100%;
        margin-inline: auto;
    }

    .keys {
        margin: auto 0 0;
        padding-top: 1.2em;
        color: var(--muted-txt, var(--muted));
        font-size: var(--slide-fs-small);
        text-align: center;
    }
</style>
