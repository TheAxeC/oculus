<script lang="ts">
    // Layer 3, Present partial. A project's slide: the domain and stage chips and the headline,
    // then its text (the sub line, the hook, the spec strip, the plain-words callout and the
    // method and results lists beside the equation, a diagram and the name of a missing figure)
    // and its figures. A slide that wrote none of the rich keys reaches here carrying its Markdown
    // alone, and that Markdown is what the slide draws.
    //
    // A slide with a figure draws its text and its figures in a room under the headline, at the
    // boxes the slide's layout gives (`place`, Slide.svelte and screen/slide-layout.ts): the
    // figures as one block, a column at the room's right with the text beside it, or across the
    // room's width under the text, or centred in the room when the slide has no text. While the
    // room is measured the text takes the room's width and no figure is drawn. The room is as tall
    // as the layout, or as the lowest figure's box where that ends lower (`place.depth`), so a
    // slide whose figures run past its frame is measured too tall. A slide with no figure draws
    // its text as it is: the callout and the lists in one column and the right-hand column beside
    // them, which is drawn only while it holds the equation, a diagram or a figure's name, so a
    // slide with none of them draws its callout and lists across the text's whole width. One that
    // draws its Markdown alone marks the body as its room (`data-room`), the room a Markdown image
    // is held to.

    import Chip from '$lib/ui/controls/Chip.svelte';
    import Tag from '$lib/ui/controls/Tag.svelte';
    import Equation from '../Equation.svelte';
    import Panel from '../../Panel.svelte';
    import Words from '../Words.svelte';
    import { TEXT_GAP, type SlidePlace } from '../../screen/slide-layout';
    import { hasSlideContent } from '$lib/state/life/present';
    import { chipLabel, domainLabel, domainTone, stageTone } from '$lib/state/shared/words/tones';
    import { t } from '$lib/state/shared/words/text';
    import type { PresentSlide } from '$lib/state/life/present';

    type Props = {
        slide: PresentSlide;
        /** The words naming the slide when it wrote no title of its own. */
        title: string;
        /**
         * The project's stage, drawn as its chip with the label and colour of its word of `stages`.
         */
        stage?: string;
        /**
         * The internal id of the domain the project's `domain:` resolves to, as the merge resolves
         * it, which the chip's words and the slide's edge come from.
         */
        domain?: string;
        /** The hub the deck is read under, whose words the stage is drawn in. */
        hub?: string;
        /** The hue the slide's `tag.class` wears, from the deck's `tag_tones`. */
        tagTone?: string;
        /** Where the slide's layout puts the room's text and figures. */
        place: SlidePlace;
    };

    let { slide, title, stage, domain, hub, tagTone, place }: Props = $props();

    const rich = $derived(hasSlideContent(slide));
    const tone = $derived(domain === undefined ? undefined : domainTone(domain));
    const style = $derived(tone === undefined ? undefined : `--tone: var(--c-${tone})`);

    /** Whether each panel is drawn as a figure: an image the folder holds that has not failed. */
    const figures = $derived(
        slide.panels.map(
            (panel, at) =>
                rich &&
                panel.missing !== true &&
                (panel.src ?? '') !== '' &&
                !place.failed.includes(at)
        )
    );
    const pictured = $derived(figures.includes(true));
    /**
     * Whether the right-hand column is drawn: it holds the equation, a diagram or a figure's name.
     */
    const right = $derived(slide.equation !== undefined || figures.includes(false));
    /** Whether the slide has text beside or above its figures. */
    const worded = $derived(
        slide.sub !== undefined ||
            slide.hook !== undefined ||
            (rich &&
                (slide.specs.length > 0 ||
                    slide.eli5 !== undefined ||
                    slide.method.length > 0 ||
                    slide.results.length > 0 ||
                    right)) ||
            (!rich && slide.body !== undefined)
    );
    const shape = $derived(place.layout?.shape ?? null);
    /** The room's height: the layout's, or the lowest figure's bottom where that is lower. */
    const height = $derived(
        place.layout === null ? null : Math.max(place.layout.height, place.depth)
    );
    /** The box the layout gives the text, null while the room is measured. */
    const given = $derived(place.layout?.text ?? null);
</script>

{#snippet words()}
    {#if slide.sub !== undefined}
        <div class="sub"><Words text={slide.sub} /></div>
    {/if}
    {#if slide.hook !== undefined}
        <p class="hook"><Words text={slide.hook} /></p>
    {/if}

    {#if rich}
        {#if slide.specs.length > 0}
            <div class="specs">
                {#each slide.specs as spec, at (`${at}:${spec.label}`)}
                    <span class="spec">
                        <b><Words text={spec.label} /></b>
                        <Words text={spec.value} />
                    </span>
                {/each}
            </div>
        {/if}
        <div class="cols">
            <div class="left">
                {#if slide.eli5 !== undefined}
                    <div class="eli5">
                        {#if slide.eli5.purpose !== undefined}
                            <div class="e5">
                                <span>{t('present.eli5_purpose')}</span>
                                <p><Words text={slide.eli5.purpose} /></p>
                            </div>
                        {/if}
                        {#if slide.eli5.plain !== undefined}
                            <div class="e5">
                                <span>{t('present.eli5_plain')}</span>
                                <p><Words text={slide.eli5.plain} /></p>
                            </div>
                        {/if}
                    </div>
                {/if}
                {#if slide.method.length > 0}
                    <div class="lbl">{t('present.method')}</div>
                    <ul>
                        {#each slide.method as line, at (`${at}:${line}`)}
                            <li><Words text={line} /></li>
                        {/each}
                    </ul>
                {/if}
                {#if slide.results.length > 0}
                    <div class="lbl">{t('present.results')}</div>
                    <ul>
                        {#each slide.results as line, at (`${at}:${line}`)}
                            <li><Words text={line} /></li>
                        {/each}
                    </ul>
                {/if}
            </div>
            {#if right}
                <div class="right">
                    {#if slide.equation !== undefined}
                        <Equation {slide} />
                    {/if}
                    {#each slide.panels as panel, at (`${at}:${panel.figure ?? panel.caption ?? ''}`)}
                        {#if !figures[at]}
                            <Panel {panel} index={at} failed={place.failed.includes(at)} />
                        {/if}
                    {/each}
                </div>
            {/if}
        </div>
    {:else if slide.body !== undefined}
        <div class="body" data-room><Words text={slide.body} block /></div>
    {/if}
{/snippet}

<section class="slide" data-slide-kind="project" {style}>
    <div class="top">
        {#if domain !== undefined}
            <Tag label={domainLabel(domain)} {tone} />
        {/if}
        {#if stage !== undefined}
            <Chip label={chipLabel(stage, hub)} tone={stageTone(stage, hub)} filled />
        {/if}
        {#if slide.tag?.text !== undefined && slide.tag.text !== ''}
            <Tag label={slide.tag.text} tone={tagTone} />
        {/if}
    </div>
    <h3 class="headline"><Words text={slide.title ?? title} /></h3>
    {#if pictured}
        <div class="room" data-room style:min-height={height === null ? undefined : `${height}px`}>
            {#if worded}
                <div
                    class="text"
                    data-text
                    style:width={given === null ? undefined : `${given.width}px`}
                    style:padding-bottom={shape === 'tall' ? undefined : `${TEXT_GAP}px`}
                >
                    <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                    {@render words()}
                </div>
            {/if}
            {#each slide.panels as panel, at (`${at}:${panel.figure ?? panel.caption ?? ''}`)}
                {#if figures[at]}
                    <Panel {panel} index={at} box={place.boxes[at]} />
                {/if}
            {/each}
        </div>
    {:else}
        <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
        {@render words()}
    {/if}
</section>

<style>
    .slide {
        padding-left: 13px;
        border-left: 4px solid var(--tone, var(--line));
    }

    .top {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 10px;
        margin-bottom: 5px;
    }

    .headline {
        margin: 0.1em 0 0.3em;
        font-size: var(--slide-fs-h);
        line-height: 1.15;
    }

    .sub {
        margin: 2px 0 9px;
        color: var(--muted-txt, var(--muted));
        font-size: var(--slide-fs-body);
        font-weight: 600;
    }

    .hook {
        margin: 0 0 12px;
        padding: 2px 0 2px 13px;
        border-left: 3px solid var(--tone, var(--line));
        font-size: var(--slide-fs-body);
        line-height: 1.45;
    }

    .specs {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-bottom: 14px;
    }

    .spec {
        padding: 5px 9px;
        border: 1px solid var(--line);
        border-radius: var(--radius-sm);
        font-size: var(--slide-fs-small);
        line-height: 1.3;
    }

    .spec b {
        display: block;
        margin-bottom: 1px;
        color: var(--muted-txt, var(--muted));
        font-size: var(--slide-fs-small);
        font-weight: 700;
        letter-spacing: 0.07em;
        text-transform: uppercase;
    }

    /* The room under the headline the figures and the text share: the text in its flow, so a text
       taller than its box makes the slide taller and the slide is measured too tall, and each
       figure at its box (Panel.svelte). */
    .room {
        position: relative;
    }

    .text {
        box-sizing: border-box;
        min-width: 0;
    }

    /* The callout and lists on the left and the right-hand column side by side wherever the text's
       box holds two columns of at least 300 px, as the reading width does; the narrower text
       beside a column of figures holds one. A slide with no right-hand column draws its left
       column alone, and the tracks `auto-fit` leaves empty collapse, so that column takes the
       box's whole width. */
    .cols {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(min(300px, 100%), 1fr));
        gap: 26px;
        align-items: start;
    }

    .left,
    .right {
        min-width: 0;
    }

    .lbl {
        margin: 0 0 5px;
        color: var(--accent-txt, var(--accent));
        font-size: var(--slide-fs-small);
        font-weight: 800;
        letter-spacing: 0.13em;
        text-transform: uppercase;
    }

    ul {
        margin: 0 0 14px;
        padding-left: 17px;
    }

    li {
        margin-bottom: 7px;
        font-size: var(--slide-fs-small);
        line-height: 1.46;
    }

    .eli5 {
        margin-bottom: 13px;
        padding: 11px 13px;
        border: 1px solid var(--tone, var(--line));
        border-radius: var(--radius);
        background: var(--card);
    }

    .e5 {
        display: flex;
        align-items: baseline;
        gap: 9px;
    }

    .e5 + .e5 {
        margin-top: 6px;
        padding-top: 6px;
        border-top: 1px dashed var(--line);
    }

    .e5 span {
        flex: 0 0 92px;
        color: var(--accent-txt, var(--accent));
        font-size: var(--slide-fs-small);
        font-weight: 800;
        letter-spacing: 0.1em;
        text-transform: uppercase;
    }

    .e5 p {
        margin: 0;
        font-size: var(--slide-fs-small);
        line-height: 1.45;
    }

    .body {
        font-size: var(--slide-fs-body);
    }

    /* Over a wallpaper the surface goes translucent, as every other card surface does; inside the
       slide's frame (screen/Stage.svelte), the one translucent layer, it paints nothing. */
    :global(body.wall) .eli5 {
        background: color-mix(in srgb, var(--card) var(--wall-panel), transparent);
        backdrop-filter: blur(var(--wall-blur));
    }

    :global(body.wall [data-surface]) .eli5 {
        background: transparent;
        backdrop-filter: none;
    }
</style>
