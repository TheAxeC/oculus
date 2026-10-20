<script lang="ts">
    // Layer 3, Present partial. The governing equation at the top of a project slide, and the
    // equation of an equation slide, in the card the deck gives it. A slide writes it as LaTeX,
    // which is typeset in the page; a formula that does not parse is drawn as its own source in the
    // error colour, so one mistyped line costs its own slide. A formula wider than the card is
    // drawn smaller until it fits (equationScale).

    import type { Attachment } from 'svelte/attachments';
    import { tex } from '../markup';
    import { equationScale, type PresentSlide } from '$lib/state/life/present';

    type Props = { slide: Pick<PresentSlide, 'equation'> };

    let { slide }: Props = $props();

    /**
     * Draw the typeset formula at the scale that fits the card's content width, measured at its own
     * size first. It runs again when the slide's formula changes and when the card's width does,
     * after the browser has laid the new formula out.
     */
    function fitted(equation: string | undefined): Attachment<HTMLElement> {
        return (card) => {
            const apply = (): void => {
                const math = card.querySelector<HTMLElement>('.katex-display');
                if (math === null) return;
                math.style.fontSize = '';
                const style = getComputedStyle(card);
                const room =
                    card.clientWidth -
                    parseFloat(style.paddingLeft) -
                    parseFloat(style.paddingRight);
                math.style.fontSize = `${equationScale(math.scrollWidth, room)}em`;
            };
            const frame = equation === undefined ? 0 : requestAnimationFrame(apply);
            const watcher = new ResizeObserver(apply);
            watcher.observe(card);
            return () => {
                cancelAnimationFrame(frame);
                watcher.disconnect();
            };
        };
    }
</script>

<div class="eqcard" {@attach fitted(slide.equation)}>
    {#if slide.equation !== undefined}
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

    /* Over a wallpaper the surface goes translucent, as every other card surface does; inside the
       slide's frame (screen/Stage.svelte), the one translucent layer, it paints nothing. */
    :global(body.wall) .eqcard {
        background: color-mix(in srgb, var(--card) var(--wall-panel), transparent);
        backdrop-filter: blur(var(--wall-blur));
    }

    :global(body.wall [data-surface]) .eqcard {
        background: transparent;
        backdrop-filter: none;
    }
</style>
