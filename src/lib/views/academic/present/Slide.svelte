<script lang="ts">
    // Layer 3, Present partial. One slide of the deck drawn as the kind it is. It is the one place
    // that knows which component each kind is, so the pane draws a slide by handing this the slide
    // and the deck and nothing else. The slide sits in a reading column as wide as the frame's
    // inner width and at most `--slide-reading` (1040 px, themes/slide.css), centred in the frame,
    // and a part that centres its content takes the column's height.
    //
    // The slide's foot, under its content, holds the key hint and then the strip of a project's
    // facts. The first slide of a deck carries the key hint when the pane draws it; no deck file
    // holds one. A slide that comes from a project's deck (`row.project`) carries the strip of that
    // project's facts (`deck.projects`, read by `slideFacts`, no strip for a project with none),
    // on every surface that draws a slide, its words shown by the pane's Project facts toggle
    // (`facts`) and hidden, their room kept, when it is off. A Stage that measures the slide leaves
    // the hint out of the measure and counts the strip, whose space above it is the same with the
    // hint drawn above it or not, so a deck's first slide measures the same on every surface.

    import Grid from './parts/Grid.svelte';
    import Plain from './parts/Plain.svelte';
    import Facts from './parts/project/Facts.svelte';
    import Project from './parts/project/Project.svelte';
    import Section from './parts/Section.svelte';
    import Summary from './parts/Summary.svelte';
    import Title from './parts/Title.svelte';
    import { slideFacts, tagToneOf } from '$lib/state/life/present';
    import { t } from '$lib/state/shared/words/text';
    import type { Deck, DeckSlide } from '$lib/state/life/present';

    type Props = {
        row: DeckSlide;
        deck: Deck;
        /** Whether this is the deck's first slide, which names the keys in its foot. */
        first: boolean;
        /** Whether the strip of a project's facts shows its words: the pane's toggle. */
        facts: boolean;
    };

    let { row, deck, first, facts }: Props = $props();

    /** The facts the slide's strip draws, null for a slide that has no strip. */
    const held = $derived(slideFacts(deck, row));
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
            hub={deck.hub}
        />
    {:else if row.kind === 'idea'}
        <Grid kind="idea" cards={[row.card]} hub={deck.hub} />
    {:else if row.kind === 'project'}
        <Project
            slide={row.slide}
            title={row.title}
            stage={row.stage}
            domain={row.domain}
            hub={deck.hub}
            tagTone={tagToneOf(deck, row.slide)}
        />
    {:else if row.kind === 'text' || row.kind === 'image' || row.kind === 'columns' || row.kind === 'equation' || row.kind === 'code'}
        <Plain {row} />
    {/if}
    {#if first || held !== null}
        <div class="foot">
            {#if first}
                <p class="keys" data-key-hint>{t('present.key_hint')}</p>
            {/if}
            {#if held !== null}
                <div class="strip">
                    <Facts facts={held} shown={facts} hub={deck.hub} />
                </div>
            {/if}
        </div>
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

    /* The foot sits at the bottom of the reading column, under the slide's content. Each of its
       parts holds its own space above it, the same space whether the other is drawn or not, so
       the measure that leaves the key hint out leaves its space out with it, and a deck's first
       slide measures the same in the pane as on every other surface. */
    .foot {
        margin-top: auto;
    }

    .strip {
        padding-top: 1.2em;
    }

    .keys {
        margin: 0;
        padding-top: 1.2em;
        color: var(--muted-txt, var(--muted));
        font-size: var(--slide-fs-small);
        text-align: center;
    }
</style>
