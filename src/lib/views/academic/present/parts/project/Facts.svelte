<script lang="ts">
    // Layer 3, Present partial. The strip of a project's facts at the foot of a slide that comes
    // from the project's deck (Slide.svelte): each field that holds a value as one short chip, the
    // field's label and then its words, a list's words joined in the one chip, in the order of
    // `FACT_FIELDS`. The words are the server's (data/shapes/project-facts.ts), so every surface
    // draws the same strip. The form and the status chips wear the project card's hues, a blocking
    // chip red; the stage is the card's filled stage chip in the stage's hue, `failed` and
    // `stopped` as they are; the domain wears its hue; the year, the code, reproduced and compute
    // carry the card's glyphs; the rest are plain tags.
    //
    // The strip wraps and is two lines at most: a third line is not drawn, and a chip whose words
    // are longer than its room ends in an ellipsis, its tooltip giving the whole. Its chips and
    // its tags, their words and their glyphs, are drawn at one size, the slide's small type
    // (`--slide-fs-small`, themes/slide.css), so the strip scales with the slide, the text size
    // and the theme; each line is as tall as the tallest chip or tag on it. With the pane's
    // Project facts toggle off its words are hidden and its room is kept, so the slide is laid out
    // and measured the same either way.

    import Chip from '$lib/ui/controls/Chip.svelte';
    import Tag from '$lib/ui/controls/Tag.svelte';
    import Tooltip from '$lib/ui/menu/Tooltip.svelte';
    import { computeGlyph, wordGlyph } from '$lib/views/shared/card/card';
    import { isBlocked } from '$lib/state/boards/focus';
    import {
        chipGlyphName,
        domainTone,
        stageTone,
        statusMarkTone,
        vocabOf
    } from '$lib/state/shared/words/tones';
    import { t } from '$lib/state/shared/words/text';
    import type { FactField, ProjectFact } from '$lib/state/life/present';

    type Props = {
        facts: ProjectFact[];
        /** Whether the words are drawn; with false the strip keeps its room and shows nothing. */
        shown: boolean;
        /** The hub the deck is read under, whose words the hues are read in. */
        hub: string;
    };

    let { facts, shown, hub }: Props = $props();

    /** The words each field is labelled with. */
    const labels: Record<FactField, string> = $derived({
        form: t('board.facet_form'),
        stage: t('board.cell_stage'),
        chips: t('present.fact_chips'),
        domain: t('board.facet_domain'),
        pillars: t('present.fact_pillars'),
        datasets: t('board.facet_dataset'),
        lead: t('project.action.line_lead'),
        supervisors: t('project.action.line_supervisors'),
        collaborators: t('project.action.line_collaborators'),
        year: t('board.facet_year'),
        venue: t('board.facet_venue'),
        funding: t('board.facet_funding'),
        compute: t('board.facet_compute'),
        code: t('board.facet_code'),
        reproduced: t('board.facet_reproduced'),
        tier: t('board.facet_tier')
    });

    /** The glyph the card draws a field with, for the three fields whose glyph is fixed. */
    const glyphs: Partial<Record<FactField, string>> = $derived({
        year: t('project.card.year_glyph'),
        code: t('project.card.code_glyph'),
        reproduced: t('project.card.repro_glyph')
    });

    /** One fact as the strip draws it: its words, and how it is drawn. */
    type Drawn = {
        field: FactField;
        text: string;
        look: 'chip' | 'stage' | 'tag';
        tone?: string;
        glyph?: string;
    };

    const words = $derived(vocabOf(hub));

    /** A fact's first key, the word or id its hue and glyph are read by. */
    function first(fact: ProjectFact): string {
        return fact.keys?.at(0) ?? '';
    }

    function drawnOf(fact: ProjectFact): Drawn {
        const text = t('present.fact', labels[fact.field], fact.words.join(', '));
        const keys = fact.keys ?? [];
        switch (fact.field) {
            case 'form':
                return {
                    field: fact.field,
                    text,
                    look: 'chip',
                    tone: statusMarkTone(first(fact), hub),
                    glyph: wordGlyph(chipGlyphName(first(fact), hub))
                };
            case 'chips':
                return {
                    field: fact.field,
                    text,
                    look: 'chip',
                    tone: isBlocked({ chips: keys }, words)
                        ? 'red'
                        : statusMarkTone(first(fact), hub),
                    glyph: wordGlyph(chipGlyphName(first(fact), hub))
                };
            case 'stage':
                return {
                    field: fact.field,
                    text,
                    look: 'stage',
                    tone: stageTone(first(fact), hub)
                };
            case 'domain':
                return { field: fact.field, text, look: 'tag', tone: domainTone(first(fact)) };
            case 'compute':
                return { field: fact.field, text, look: 'tag', glyph: computeGlyph(first(fact)) };
            default: {
                const glyph = glyphs[fact.field];
                return glyph === undefined
                    ? { field: fact.field, text, look: 'tag' }
                    : { field: fact.field, text, look: 'tag', glyph };
            }
        }
    }

    const drawn = $derived(facts.map(drawnOf));
</script>

<div class="facts" class:hidden={!shown} aria-hidden={shown ? undefined : 'true'} data-facts>
    <ul class="list">
        {#each drawn as one (one.field)}
            <li class="fact" data-fact={one.field}>
                <Tooltip text={shown ? one.text : ''}>
                    {#if one.look === 'tag'}
                        <Tag label={one.text} tone={one.tone} glyph={one.glyph} />
                    {:else}
                        <Chip
                            label={one.text}
                            tone={one.tone}
                            glyph={one.glyph}
                            filled={one.look === 'stage'}
                        />
                    {/if}
                </Tooltip>
            </li>
        {/each}
    </ul>
</div>

<style>
    /* The strip is set in the slide's small type: the words of its chips and its tags and their
       glyphs are drawn at `--slide-fs-small`, and a chip's line and height grow with its words
       (`--chip-text`, ui/controls/Chip.svelte). Its facts are laid out as words are, each one a box
       in a line, so a line is as tall as the tallest chip or tag on it at every text size, and the
       strip is clamped to its first two lines: a third is not drawn, and a box is never cut. */
    .facts {
        --chip-text: var(--slide-fs-small);
        --tag-text: var(--slide-fs-small);
        --glyph-size: var(--slide-fs-small);

        display: -webkit-box;
        overflow: hidden;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 2;
        line-clamp: 2;
        font-size: var(--slide-fs-small);
        line-height: 1.3;
    }

    .list {
        margin: 0;
        padding: 0;
        list-style: none;
    }

    /* The room between two facts and between two lines, in the strip's own type. */
    .fact {
        display: inline-flex;
        align-items: center;
        min-width: 0;
        max-width: 100%;
        margin: 0.15em 0.35em 0.15em 0;
        vertical-align: middle;
    }

    .fact > :global(*) {
        min-width: 0;
        max-width: 100%;
    }

    /* With the toggle off the strip keeps its room, so the slide is laid out the same. */
    .hidden {
        visibility: hidden;
    }
</style>
