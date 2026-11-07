<script lang="ts">
    // Layer 3, Present partial. The strip of a project's facts at the foot of a slide that comes
    // from the project's deck (Slide.svelte): each field that holds a value, in the order of
    // `FACT_FIELDS`, drawn one way, its label in small muted capitals and then its value in the
    // slide's text colour, with no box, fill or border around any fact. The words are the
    // server's (data/shapes/project-facts.ts), so every surface draws the same strip. The form,
    // the stage, the status chips and the domain carry their hue as a dot before the value
    // (parts/Dot.svelte): the form and the chips in the project card's hues, the chips' dot red
    // when any chip blocks, the stage in its own hue, `failed` and `stopped` as they are, the
    // domain in its hue, and a word with no colour in the grey tone those hues give it. The other
    // fields carry no dot.
    //
    // A list draws its first entry and the count of the others ("Maryam Amir Haeri +2"), a list
    // of one its entry alone. A value is drawn whole; only a fact wider than the strip's whole
    // line, which happens in a narrow frame, has its value end in an ellipsis at the strip's edge,
    // and a list's count stays drawn after its cut first entry. Each fact's tooltip gives the
    // whole fact, its label and every entry, in `present.fact`'s words, and a screen reader reads
    // the same whole fact from a copy drawn nowhere, since the drawn label and value carry no
    // colon between them and the drawn list is shortened.
    //
    // A rule runs across the strip above its first line, in a mix of the muted text colour and
    // the hairline colour, so it shows on the slide's frame under every theme. The facts wrap to
    // as many lines as they need, every fact drawn and none broken across two lines. The strip is
    // set in a type size of its own (`--slide-fs-fact`, themes/slide.css), its values at 12 px and
    // its labels at 10 px at the design size, below the slide's small type, so the facts read as
    // a foot under the content. The size carries no fit factor: it scales with the text size and
    // the theme, outside the content's factor. With the pane's Project facts toggle off its words
    // and its rule are hidden and its room is kept, so the slide is laid out and measured the same
    // either way.

    import Dot from '../Dot.svelte';
    import Tooltip from '$lib/ui/menu/Tooltip.svelte';
    import { isBlocked } from '$lib/state/boards/focus';
    import { domainTone, stageTone, statusMarkTone, vocabOf } from '$lib/state/shared/words/tones';
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

    /** One fact as the strip draws it. */
    type Drawn = {
        field: FactField;
        label: string;
        /** The value's first entry, the whole value for a field of one word. */
        first: string;
        /** The count of the entries after the first ("+2"), the empty string for none. */
        count: string;
        /** The hue of the dot before the value; none for a field that draws no dot. */
        tone?: string;
        /** The whole fact, every entry, for the tooltip and for a screen reader. */
        whole: string;
    };

    const words = $derived(vocabOf(hub));

    /** A fact's first key, the word or id its hue is read by. */
    function key(fact: ProjectFact): string {
        return fact.keys?.at(0) ?? '';
    }

    /** The hue of a fact's dot, for the four fields that draw one. */
    function toneOf(fact: ProjectFact): string | undefined {
        switch (fact.field) {
            case 'form':
                return statusMarkTone(key(fact), hub);
            case 'chips':
                return isBlocked({ chips: fact.keys ?? [] }, words)
                    ? 'red'
                    : statusMarkTone(key(fact), hub);
            case 'stage':
                return stageTone(key(fact), hub);
            case 'domain':
                return domainTone(key(fact));
            default:
                return undefined;
        }
    }

    function drawnOf(fact: ProjectFact): Drawn {
        const label = labels[fact.field];
        const first = fact.words.at(0) ?? '';
        const others = fact.words.length - 1;
        const count = others > 0 ? t('present.fact_count', others) : '';
        const one: Drawn = {
            field: fact.field,
            label,
            first,
            count,
            whole: t('present.fact', label, fact.words.join(', '))
        };
        const tone = toneOf(fact);
        if (tone !== undefined) one.tone = tone;
        return one;
    }

    const drawn = $derived(facts.map(drawnOf));
</script>

<div class="facts" class:hidden={!shown} aria-hidden={shown ? undefined : 'true'} data-facts>
    <ul class="list">
        {#each drawn as one (one.field)}
            <li class="fact" data-fact={one.field}>
                <span class="read">{one.whole}</span>
                <Tooltip text={shown ? one.whole : ''}>
                    <span class="drawn" aria-hidden="true">
                        <span class="label">{one.label}</span>
                        {#if one.tone !== undefined}
                            <span class="mark">
                                <Dot tone={one.tone} />
                            </span>
                        {/if}
                        <span class="value">
                            <span class="entry">{one.first}</span>
                            {#if one.count !== ''}
                                <span class="count">{one.count}</span>
                            {/if}
                        </span>
                    </span>
                </Tooltip>
            </li>
        {/each}
    </ul>
</div>

<style>
    /* The strip is set in its own type, and every measure below is in that type: the rule above
       it and the room between the rule and the first line of facts, the gap between two facts on
       a line and between two lines, the gap between a label and its value and the label's size,
       10 px of the 12 px design size. The dot before a hued value is as wide as half the strip's
       type, 6 px at the design size. */
    .facts {
        --fact-label: calc(10em / 12);
        --fact-gap: 1em;
        --fact-between: 0.4em;
        --dot-size: 0.5em;

        padding-top: 0.6em;
        border-top: 1px solid color-mix(in srgb, var(--muted-txt, var(--muted)) 50%, var(--line));
        font-size: var(--slide-fs-fact);
        line-height: 1.3;
    }

    /* The facts wrap as words do, each one whole on its line. */
    .list {
        display: flex;
        flex-wrap: wrap;
        gap: 0.2em var(--fact-gap);
        margin: 0;
        padding: 0;
        list-style: none;
    }

    /* A fact, and the tooltip wrapper inside it, are no wider than the strip's line, so in a
       narrow frame a value gives way to what its fact's line leaves it and ends in an ellipsis at
       the strip's edge. */
    .fact {
        position: relative;
        min-width: 0;
        max-width: 100%;
    }

    .fact > :global(*) {
        min-width: 0;
        max-width: 100%;
    }

    /* The fact as a screen reader reads it, drawn nowhere. */
    .read {
        position: absolute;
        width: 1px;
        height: 1px;
        overflow: hidden;
        clip-path: inset(50%);
        white-space: nowrap;
    }

    /* Label, dot and value on one line, the label and the value on one baseline and the dot
       centred on the line. */
    .drawn {
        display: flex;
        align-items: baseline;
        gap: var(--fact-between);
        min-width: 0;
        white-space: nowrap;
    }

    .mark {
        display: inline-flex;
        flex: none;
        align-self: center;
    }

    .label {
        flex: none;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fact-label);
        letter-spacing: 0.04em;
        text-transform: uppercase;
    }

    /* A value is drawn whole while its fact fits the strip's line; past that its first entry
       gives way and ends in an ellipsis, and a list's count after it is always drawn. */
    .value {
        display: flex;
        min-width: 0;
    }

    .entry {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .count {
        flex: none;
        margin-left: 0.3em;
    }

    /* With the toggle off the strip keeps its room, so the slide is laid out the same. */
    .hidden {
        visibility: hidden;
    }
</style>
