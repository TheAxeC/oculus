<script lang="ts">
    // Layer 3, route. Every slide of one deck, in order, each in the deck's frame at scale 1 and
    // one to a printed page, for the PDF of the Present view. The deck is the one the Present view
    // draws: `?root=&path=` name it, the deck route answers it, and the slides are drawn by the
    // same component, in the page's theme and at the app's text size (the `text_size` option, as
    // the shell draws it), so a slide is laid out as the Present view lays it out. The printed
    // page and each `.page` take the size of the deck's frame (`deck.frame`, or the setting
    // defaults.frame): the `@page` rule is written into the document's head from the deck once it
    // is read, and the desktop host's hidden window opens at the same frame. A page keeps the
    // frame's border, transparent, so the slide has the inner box it has in the Present view. The
    // page installs the config once, when it opens (+page.ts), so it draws the text size the
    // config held then.
    //
    // A slide whose text or figures do not fit at its least size is taller than its page; it is
    // scaled down to fit it, from the top and centred, so every slide is printed whole on one
    // page; the Present pane scrolls such a slide.
    //
    // The deck is drawn as the exporting pane filters it. The address names the deck alone, so
    // before it reads the deck the page asks over the deck's channel which projects the filter
    // keeps (`keep-asked`), takes the first answer of an export (state/life/present.svelte.ts
    // `exportKeep`) and reads the deck under it. The answer carries the pane's Project facts
    // toggle as it was at the press, which the strip of a project's facts at the foot of its slides
    // shows its words by. With no answer within `KEEP_WAIT_MS`, well inside the desktop host's
    // wait, the page says so and fails, and prints no deck.
    //
    // The page says it is ready with a `data-ready` attribute on its root once the deck is read and
    // drawn, the fonts are loaded, every image has loaded or failed and every slide has been laid
    // out (Slide.svelte lays a slide out again when one of its images loads or fails, before the
    // image's own wait ends); the desktop app's hidden window prints it then. A deck that cannot
    // be read, or that draws no slide, is told on the page and the root carries `data-failed`, so
    // the host answers at once. In a browser tab there is no host, so the page opens the
    // browser's print dialog once it is ready.

    import { onMount, tick } from 'svelte';
    import Slide from '$lib/views/academic/present/Slide.svelte';
    import type { Deck } from '$lib/state/life/present';
    import { exportKeep, readDeck } from '$lib/state/life/present.svelte';
    import { configuredLook } from '$lib/state/shared/words/appearance';
    import { desktopOf } from '$lib/state/shared/stores/desktop';
    import { t } from '$lib/state/shared/words/text';
    import { createTipIds, provideTipIds } from '$lib/ui/menu/tip-ids';
    import { drawConfiguredTheme } from '$lib/ui/theme/app-theme';
    import type { PageData } from './$types';

    let { data }: { data: PageData } = $props();

    provideTipIds(createTipIds());

    /** The frame's padding above and below the slide, in px (themes/slide.css). */
    const PAGE_PADDING = 128;

    /**
     * The longest the page waits for the exporting pane to say which projects its filter keeps and
     * whether the strip shows its words.
     */
    const KEEP_WAIT_MS = 5000;

    let deck = $state<Deck | null>(null);
    /** The exporting pane's Project facts toggle at the press. */
    let facts = $state(true);
    let failed = $state('');
    let ready = $state(false);

    /**
     * The rule that sizes every printed page to the deck's frame. The frame's sides are whole
     * numbers above zero, which the deck answer's shape checks (`deckShape`), so the rule holds
     * nothing but two numbers.
     */
    const pageRule = $derived(
        deck === null
            ? ''
            : `<style>@page { size: ${deck.frame.width}px ${deck.frame.height}px; margin: 0; }</style>`
    );

    /** The keys of the slides laid out since the deck was drawn. */
    const laid: string[] = [];
    /** Ends the wait for the layouts, once every slide has been laid out. */
    let allLaid = (): void => undefined;

    /** Whether every slide of the deck has been laid out once. */
    function everyLaid(): boolean {
        return deck?.slides.every((row) => laid.includes(row.key)) === true;
    }

    function slideLaid(key: string): void {
        if (!laid.includes(key)) laid.push(key);
        if (everyLaid()) allLaid();
    }

    /** Wait until every slide of the deck has been laid out once. */
    function layoutsSettled(): Promise<void> {
        return new Promise((settle) => {
            allLaid = settle;
            if (everyLaid()) settle();
        });
    }

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

    /**
     * Read the deck the address names, under the kept list the exporting pane answers, and keep the
     * pane's Project facts toggle it answers with; what the page fails with when it is not
     * answered.
     */
    async function read(): Promise<Deck | string> {
        const asked = new URLSearchParams(window.location.search);
        const ref = { root: asked.get('root') ?? '', path: asked.get('path') ?? '' };
        const held = await exportKeep(ref, KEEP_WAIT_MS);
        if (held === undefined) return t('present.print_unanswered', String(KEEP_WAIT_MS / 1000));
        facts = held.facts;
        return readDeck(ref, data.token, held.keep);
    }

    $effect(() => {
        // Read inside the effect, the text size is drawn again whenever the page's config is
        // installed anew.
        const scale = String(configuredLook().textSize);
        document.documentElement.style.setProperty('--text-scale', scale);
    });

    onMount(() => {
        void drawConfiguredTheme(document, desktopOf(window, '') !== undefined, data.appThemes);
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
            await layoutsSettled();
            fitSlides();
            ready = true;
            // The host's hidden window has the bridge and prints it itself; a tab has none.
            if (desktopOf(window, '') === undefined) window.print();
        })();
    });
</script>

<svelte:head>
    <!-- eslint-disable-next-line svelte/no-at-html-tags -- two numbers deckShape checked -->
    {@html pageRule}
</svelte:head>

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
            <section
                class="slide-frame page"
                data-slide-key={row.key}
                style:width="{deck.frame.width}px"
                style:height="{deck.frame.height}px"
            >
                <div class="fit" data-fit>
                    <Slide {row} {deck} {facts} first={false} onlaid={() => slideLaid(row.key)} />
                </div>
            </section>
        {/each}
    {/if}
</div>

<style>
    /* One slide to a page, at the deck's frame, which the element and the head's `@page` rule
       set. */
    .page {
        overflow: hidden;
        border-color: transparent;
        border-radius: 0;
        break-after: page;
    }

    /* The slide takes the page's inner height, as it takes the frame's in the Present view. */
    .fit {
        height: 100%;
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
