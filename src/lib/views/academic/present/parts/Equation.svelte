<script lang="ts">
    // Layer 3, Present partial. The governing equation at the top of a project slide, in the card
    // the deck gives it. A slide writes it as LaTeX, which is typeset in the page, or as the name
    // of an image rendered elsewhere, which the reader of the snapshot has already resolved to the
    // one path that holds it; an image named in neither place is said to be missing rather than
    // drawn dead.

    import { fileUrl } from '$lib/views/shared/links/file-url';
    import { HUB_ROOT } from '$lib/state/sources/fs';
    import { t } from '$lib/state/words/text';
    import { tex } from '../markup';
    import type { PresentSlide } from '$lib/state/feeds/life/present';

    type Props = { slide: PresentSlide };

    let { slide }: Props = $props();

    const src = $derived(
        slide.equationImage === undefined ? '' : fileUrl(HUB_ROOT, slide.equationImage)
    );
</script>

<div class="eqcard">
    {#if src !== ''}
        <img {src} alt={t('present.equation_alt')} />
    {:else if slide.equationMissing === true}
        <p class="gap">{t('present.equation_missing', slide.equation ?? '')}</p>
    {:else if slide.equation !== undefined}
        <!-- eslint-disable-next-line svelte/no-at-html-tags -- tex() is KaTeX's own markup over escaped source, and the sanitiser would drop the boxes it positions -->
        {@html tex(slide.equation, true)}
    {/if}
</div>

<style>
    .eqcard {
        margin-bottom: 12px;
        padding: 14px 12px;
        border: 1px solid var(--line);
        border-radius: var(--radius);
        background: var(--card);
        text-align: center;
        overflow-x: auto;
    }

    .eqcard img {
        max-width: 100%;
        height: auto;
    }

    .gap {
        margin: 0;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-md);
    }

    /* Over a wallpaper the surface goes translucent, as every other card surface does. */
    :global(body.wall) .eqcard {
        background: color-mix(in srgb, var(--card) var(--wall-panel), transparent);
        backdrop-filter: blur(var(--wall-blur));
    }
</style>
