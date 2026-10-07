<script lang="ts">
    // Layer 3, route. Every slide of one deck, in order, each in its 1280 by 720 frame at scale 1
    // and one to a printed page, for the PDF of the Present view. The deck is the one the Present
    // view draws: `?root=&path=` name it, the deck route answers it, and the slides are drawn by
    // the same component, in the page's theme.
    //
    // A slide taller than its page is scaled down to fit it, from the top and centred, so no slide
    // is cut or split over two pages; the Present pane scrolls such a slide instead.
    //
    // The page says it is ready with a `data-ready` attribute on its root once the deck is read and
    // drawn, the fonts are loaded and every image has loaded or failed; the desktop app's hidden
    // window prints it then. A deck that cannot be read, or that draws no slide, is told on the
    // page and the root carries `data-failed` instead, so the host answers at once and not after
    // its wait. In a browser tab there is no host, so the page opens the browser's print dialog
    // once it is ready.

    import { onMount, tick } from 'svelte';
    import Slide from '$lib/views/academic/present/Slide.svelte';
    import { deckShape, type Deck } from '$lib/state/life/present';
    import { readAnswer } from '$lib/state/sources/fs-transport';
    import { readAs } from '$lib/data/shapes/shapes';
    import { savedTheme, themeClass } from '$lib/state/shared/words/appearance';
    import { desktopOf } from '$lib/state/shared/stores/desktop';
    import { t } from '$lib/state/shared/words/text';
    import { createTipIds, provideTipIds } from '$lib/ui/menu/tip-ids';
    import { applyTheme } from '$lib/ui/theme';
    import type { PageData } from './$types';

    let { data }: { data: PageData } = $props();

    provideTipIds(createTipIds());

    /** The frame's padding above and below the slide, in px (themes/slide.css). */
    const PAGE_PADDING = 128;

    let deck = $state<Deck | null>(null);
    let failed = $state('');
    let ready = $state(false);

    /** Wait for every image of the page to load or fail, so none is half drawn when it prints. */
    function imagesSettled(): Promise<unknown> {
        return Promise.all(
            [...document.images].map((image) =>
                image.complete
                    ? Promise.resolve()
                    : new Promise((settle) => {
                          image.addEventListener('load', settle, { once: true });
                          image.addEventListener('error', settle, { once: true });
                      })
            )
        );
    }

    /** Scale each slide that is taller than its page down to the page's height. */
    function fitSlides(): void {
        for (const fit of document.querySelectorAll<HTMLElement>('[data-fit]')) {
            const room = (fit.parentElement?.clientHeight ?? 0) - PAGE_PADDING;
            if (fit.scrollHeight > room && room > 0) {
                fit.style.transform = `scale(${room / fit.scrollHeight})`;
            }
        }
    }

    /** Read the deck the address names. */
    async function read(): Promise<Deck | string> {
        const asked = new URLSearchParams(window.location.search);
        const query = new URLSearchParams({
            root: asked.get('root') ?? '',
            path: asked.get('path') ?? ''
        });
        try {
            const response = await fetch(`/api/deck?${query.toString()}`, {
                headers: { 'x-oculus-token': data.token }
            });
            const answer = await readAnswer(response);
            if (!answer.ok) return answer.error;
            return readAs(deckShape, answer.body) ?? 'deck';
        } catch (error) {
            return error instanceof Error ? error.message : String(error);
        }
    }

    onMount(() => {
        applyTheme(document, themeClass(savedTheme(localStorage.getItem('oculus.ui.v1'))), false);
        void (async () => {
            const held = await read();
            if (typeof held === 'string') {
                failed = held;
                return;
            }
            if (held.slides.length === 0) {
                failed = t('present.empty', held.path);
                return;
            }
            deck = held;
            await tick();
            await document.fonts.ready;
            await imagesSettled();
            fitSlides();
            ready = true;
            // The host's hidden window has the bridge and prints it itself; a tab has none.
            if (desktopOf(window, '') === undefined) window.print();
        })();
    });
</script>

<div
    class="print"
    data-print-root
    data-ready={ready ? '' : undefined}
    data-failed={failed === '' ? undefined : ''}
>
    {#if failed !== ''}
        <p class="failed">{t('present.failed', failed)}</p>
    {:else if deck !== null}
        {#each deck.slides as row (row.key)}
            <section class="slide-frame page" data-slide-key={row.key}>
                <div class="fit" data-fit>
                    <Slide {row} {deck} first={false} />
                </div>
            </section>
        {/each}
    {/if}
</div>

<style>
    /* One slide to a page, at the size the slides are laid out for. */
    @page {
        size: 1280px 720px;
        margin: 0;
    }

    .page {
        width: 1280px;
        height: 720px;
        overflow: hidden;
        border: none;
        border-radius: 0;
        break-after: page;
    }

    .fit {
        transform-origin: top center;
    }

    .page:last-child {
        break-after: auto;
    }

    .failed {
        margin: 0;
        padding: 16px;
    }
</style>
