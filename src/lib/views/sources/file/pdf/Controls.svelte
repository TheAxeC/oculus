<script lang="ts">
    // Layer 3, view partial of the file view. The controls of the PDF viewer, drawn at the right
    // end of the file tab's breadcrumb bar (File.svelte hands them up through ui/tabs/
    // tab-actions.svelte.ts): the side panel's two views, back from a followed link, the page
    // number, zoom, fit width and fit page, the search, how the pages are laid out and paired, the
    // colours inverted for a dark theme, and the four ways to open the PDF.
    //
    // Every control calls the viewer (viewer.svelte.ts) and reads its state, so a viewer the frame
    // layer holds across a layout change is the one the controls drive. The search box takes the
    // focus when the viewer is asked for the search (Cmd+F inside it); Enter in the box steps to
    // the next match and Shift+Enter to the previous one, and Escape closes it and clears the
    // marks.

    import { tick } from 'svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import TextInput from '$lib/ui/forms/TextInput.svelte';
    import Menu from '$lib/ui/menu/Menu.svelte';
    import type { MenuItem } from '$lib/ui/menu/menu-items';
    import { t } from '$lib/state/shared/words/text';
    import type { ScrollName, SpreadName } from '$lib/state/sources/explorer/pdf-place';
    import type { PdfViewer } from './viewer.svelte';

    type Props = {
        viewer: PdfViewer;
        /**
         * The ways to open the PDF the page offers, as menu items; a pick comes back through
         * `open`.
         */
        ways: MenuItem[];
        open: (id: string) => void;
    };

    let { viewer, ways, open }: Props = $props();

    /** The scroll modes in the order the control steps through them. */
    const SCROLLS: ScrollName[] = ['vertical', 'wrapped', 'horizontal', 'page'];

    /** The spread modes in the order the control steps through them. */
    const SPREADS: SpreadName[] = ['none', 'odd', 'even'];

    let finding = $state(false);
    let field = $state<HTMLInputElement | null>(null);
    let typed = $state('');
    let pageText = $state('');
    let pageEditing = $state(false);

    const pageShown = $derived(pageEditing ? pageText : String(viewer.page));
    const percent = $derived(`${Math.round(viewer.scale * 100)}%`);
    const count = $derived(
        viewer.found.state === 'notfound'
            ? t('file.pdf_find_none')
            : viewer.found.total > 0
              ? t('file.pdf_find_count', viewer.found.current, viewer.found.total)
              : ''
    );

    $effect(() => {
        if (viewer.asked === 0) return;
        finding = true;
        void tick().then(() => {
            field?.focus();
            field?.select();
        });
    });

    /** The words of a scroll mode's control, which say the mode a press switches to. */
    function scrollWords(mode: ScrollName): string {
        switch (mode) {
            case 'vertical':
                return t('file.pdf_scroll_vertical');
            case 'wrapped':
                return t('file.pdf_scroll_wrapped');
            case 'horizontal':
                return t('file.pdf_scroll_horizontal');
            default:
                return t('file.pdf_scroll_page');
        }
    }

    /** The words of a spread mode's control. */
    function spreadWords(mode: SpreadName): string {
        switch (mode) {
            case 'none':
                return t('file.pdf_spread_none');
            case 'odd':
                return t('file.pdf_spread_odd');
            default:
                return t('file.pdf_spread_even');
        }
    }

    function step<T>(order: readonly T[], now: T): T {
        return order[(order.indexOf(now) + 1) % order.length] ?? now;
    }

    function goPage(text: string): void {
        pageEditing = false;
        const wanted = Number.parseInt(text, 10);
        if (Number.isFinite(wanted)) viewer.goToPage(wanted);
    }

    function search(value: string): void {
        typed = value;
        viewer.find(value);
    }

    function keyed(event: KeyboardEvent): boolean {
        if (event.key === 'Escape') {
            finding = false;
            typed = '';
            viewer.find('');
            return true;
        }
        if (event.key === 'Enter') {
            viewer.find(typed, { again: true, previous: event.shiftKey });
            return true;
        }
        return false;
    }
</script>

<div class="controls" role="toolbar" aria-label={t('file.pdf_controls')}>
    <ToolButton
        bare
        label={t('file.pdf_outline')}
        glyph="pdf_outline"
        pressed={viewer.sidebar === 'outline'}
        onclick={() => viewer.showSide('outline')}
    />
    <ToolButton
        bare
        label={t('file.pdf_thumbnails')}
        glyph="pdf_thumbnails"
        pressed={viewer.sidebar === 'thumbnails'}
        onclick={() => viewer.showSide('thumbnails')}
    />
    <ToolButton
        bare
        label={t('file.pdf_back')}
        glyph="pdf_back"
        disabled={!viewer.canBack}
        onclick={() => viewer.back()}
    />
    <ToolButton
        bare
        label={t('file.pdf_prev_page')}
        glyph="pdf_prev"
        disabled={viewer.page <= 1}
        onclick={() => viewer.previous()}
    />
    <span class="page">
        <span class="number">
            <TextInput
                label={t('file.pdf_page')}
                value={pageShown}
                inputmode="decimal"
                oninput={(value: string) => {
                    pageEditing = true;
                    pageText = value;
                }}
                onenter={goPage}
                onblur={goPage}
            />
        </span>
        <span class="of">{t('file.pdf_of', viewer.pages)}</span>
    </span>
    <ToolButton
        bare
        label={t('file.pdf_next_page')}
        glyph="pdf_next"
        disabled={viewer.page >= viewer.pages}
        onclick={() => viewer.next()}
    />
    <ToolButton
        bare
        label={t('file.pdf_zoom_out')}
        glyph="pdf_zoom_out"
        onclick={() => viewer.zoomOut()}
    />
    <span class="percent" aria-live="polite">{percent}</span>
    <ToolButton
        bare
        label={t('file.pdf_zoom_in')}
        glyph="pdf_zoom_in"
        onclick={() => viewer.zoomIn()}
    />
    <ToolButton
        bare
        label={t('file.pdf_fit_width')}
        glyph="pdf_fit_width"
        pressed={viewer.scaleValue === 'page-width'}
        onclick={() => viewer.zoomTo('page-width')}
    />
    <ToolButton
        bare
        label={t('file.pdf_fit_page')}
        glyph="pdf_fit_page"
        pressed={viewer.scaleValue === 'page-fit'}
        onclick={() => viewer.zoomTo('page-fit')}
    />
    <ToolButton
        bare
        label={t('file.pdf_find')}
        glyph="pdf_find"
        pressed={finding}
        onclick={() => {
            finding = !finding;
            if (!finding) search('');
            else void tick().then(() => field?.focus());
        }}
    />
    {#if finding}
        <span class="find">
            <TextInput
                label={t('file.pdf_find_placeholder')}
                placeholder={t('file.pdf_find_placeholder')}
                value={typed}
                oninput={search}
                onkey={keyed}
                bind:input={field}
            />
            <span class="count" aria-live="polite">{count}</span>
            <ToolButton
                bare
                label={t('file.pdf_find_prev')}
                glyph="pdf_prev"
                disabled={typed === ''}
                onclick={() => viewer.find(typed, { again: true, previous: true })}
            />
            <ToolButton
                bare
                label={t('file.pdf_find_next')}
                glyph="pdf_next"
                disabled={typed === ''}
                onclick={() => viewer.find(typed, { again: true })}
            />
        </span>
    {/if}
    <ToolButton
        bare
        label={scrollWords(viewer.scroll)}
        glyph="pdf_scroll"
        onclick={() => viewer.setScroll(step(SCROLLS, viewer.scroll))}
    />
    <ToolButton
        bare
        label={spreadWords(viewer.spread)}
        glyph="pdf_spread"
        onclick={() => viewer.setSpread(step(SPREADS, viewer.spread))}
    />
    <ToolButton
        bare
        label={t('file.pdf_invert')}
        glyph="pdf_invert"
        pressed={viewer.invert}
        onclick={() => viewer.toggleInvert()}
    />
    <Menu
        bare
        compact
        label={t('file.pdf_open')}
        glyph="pdf_open"
        items={ways}
        placement="down"
        align="right"
        onpick={(id: string) => open(id)}
    />
</div>

<style>
    .controls {
        display: flex;
        align-items: center;
        gap: var(--tab-action-gap);
        min-width: 0;
    }

    .page {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font-size: var(--fs-sm);
        color: var(--muted);
    }

    .number {
        width: 3.2em;
    }

    .percent,
    .count {
        min-width: 3em;
        text-align: center;
        font-size: var(--fs-sm);
        color: var(--muted);
        font-variant-numeric: tabular-nums;
    }

    .find {
        display: inline-flex;
        align-items: center;
        gap: 2px;
        width: 18em;
        max-width: 40vw;
    }
</style>
