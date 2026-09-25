<script lang="ts">
    // Layer 3, Present partial. A project's slide: the domain and status chips, the headline and
    // the hook, the spec strip, then the method and results beside the equation and the figures. A
    // PRESENT.md that wrote no front matter reaches here as a slide carrying its narrative alone,
    // and that narrative is what the slide draws.

    import Chip from '$lib/ui/controls/Chip.svelte';
    import Tag from '$lib/ui/controls/Tag.svelte';
    import Equation from './Equation.svelte';
    import Panel from '../Panel.svelte';
    import Words from './Words.svelte';
    import { hasSlideContent } from '$lib/state/life/present';
    import { typeTone } from '$lib/state/shared/words/tones';
    import { t } from '$lib/state/shared/words/text';
    import type { DeckTheme, PresentSlide, Project } from '$lib/state/life/present';

    type Props = {
        slide: PresentSlide;
        project: Project;
        /** The deck's theme for the project's domain, absent when the deck names none. */
        theme?: DeckTheme;
        /** The hue the slide's `tag.class` wears, from the deck's `tag_tones`. */
        tagTone?: string;
    };

    let { slide, project, theme, tagTone }: Props = $props();

    const rich = $derived(hasSlideContent(slide));
    const style = $derived(theme === undefined ? undefined : `--tone: var(--c-${theme.tone})`);
</script>

<section class="slide" data-slide-kind="project" data-slide={slide.id} {style}>
    <div class="top">
        {#if theme !== undefined}
            <Tag label={theme.label} tone={theme.tone} />
        {/if}
        {#if project.type !== undefined}
            <Chip label={project.type} tone={typeTone(project.type)} filled />
        {/if}
        {#if slide.tag?.text !== undefined && slide.tag.text !== ''}
            <Tag label={slide.tag.text} tone={tagTone} />
        {/if}
    </div>
    <h3 class="headline"><Words text={slide.title ?? project.title} /></h3>
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
            <div class="right">
                {#if slide.equation !== undefined}
                    <Equation {slide} />
                {/if}
                {#each slide.panels as panel, at (`${at}:${panel.figure ?? panel.caption ?? ''}`)}
                    <Panel {panel} folder={project.folder} />
                {/each}
            </div>
        </div>
    {:else if slide.body !== undefined}
        <div class="body"><Words text={slide.body} block /></div>
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
        max-width: 34ch;
        margin: 0.1em 0 0.3em;
        font-size: var(--fs-2xl);
        line-height: 1.15;
    }

    .sub {
        margin: 2px 0 9px;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-lg);
        font-weight: 600;
    }

    .hook {
        max-width: 96ch;
        margin: 0 0 12px;
        padding: 2px 0 2px 13px;
        border-left: 3px solid var(--tone, var(--line));
        font-size: var(--fs-lg);
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
        font-size: var(--fs-sm);
        line-height: 1.3;
    }

    .spec b {
        display: block;
        margin-bottom: 1px;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-3xs);
        font-weight: 700;
        letter-spacing: 0.07em;
        text-transform: uppercase;
    }

    .cols {
        display: grid;
        grid-template-columns: 1.08fr 0.92fr;
        gap: 26px;
        align-items: start;
    }

    /* One column once the pane is too narrow to read two, which a split pane very soon is. */
    @media (max-width: 860px) {
        .cols {
            grid-template-columns: 1fr;
        }
    }

    .lbl {
        margin: 0 0 5px;
        color: var(--accent-txt, var(--accent));
        font-size: var(--fs-xs);
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
        font-size: var(--fs-md);
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
        font-size: var(--fs-xxs);
        font-weight: 800;
        letter-spacing: 0.1em;
        text-transform: uppercase;
    }

    .e5 p {
        margin: 0;
        font-size: var(--fs-md);
        line-height: 1.45;
    }

    .body {
        max-width: 90ch;
        font-size: var(--fs-md);
    }

    /* Over a wallpaper the surface goes translucent, as every other card surface does. */
    :global(body.wall) .eli5 {
        background: color-mix(in srgb, var(--card) var(--wall-panel), transparent);
        backdrop-filter: blur(var(--wall-blur));
    }
</style>
