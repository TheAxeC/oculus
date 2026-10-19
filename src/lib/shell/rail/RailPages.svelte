<script lang="ts">
    // Layer 3, shell. The rail's page buttons, drawn as the items of VS Code's activity bar: an
    // icon each, its page's name and digit as the tooltip, the page on screen marked by the accent
    // bar, and one badge inside the button over the icon's lower right corner: the sum of the
    // counts of the page's views whose row of `counts` says `rail: true` (the registry's
    // railPartOf), in the most urgent of their tones, with each part above zero named in the
    // tooltip (rail.ts, `railBadge`); with no count, the mark of the first view whose badge is a
    // mark. The tabs keep their own counts.
    //
    // A button dragged along the rail and let go elsewhere on it moves its page there, with a line
    // between two buttons saying where it would land, and its right-click menu offers Hide, Reset
    // to its arrangement while the button's page has been made, and Settings. Each is asked of the
    // rail, which writes `rail:` through the rail write or resets the page after a confirm: this
    // draws the buttons and turns the gestures into what was asked, and holds only the drag in
    // hand.
    //
    // The keyboard ring is the rail's, so each button is handed its place in the focus order and
    // its key handler.

    import ContextMenu from '$lib/ui/menu/ContextMenu.svelte';
    import Glyph from '$lib/ui/display/Glyph.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { railBadge, railInsertAt, railMenu, type RailBadge } from '$lib/shell/rail/rail';
    import { THRESHOLD, type Point } from '$lib/state/workbench/drag.svelte';
    import { railPageViews } from '$lib/state/workbench/navigation/pages';
    import type { RailPage } from '$lib/state/workbench/navigation/rail';
    import {
        badgeOf,
        railPartOf,
        registrationLabel
    } from '$lib/state/workbench/navigation/registry';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';

    const client = useState();
    const {
        layout: { currentPage, openRailPage, pages: allPages },
        registry: { viewFor }
    } = client;

    type Props = {
        pages: RailPage[];
        /** A control's place in the browser's focus order, which the rail's ring decides. */
        stopIndex: (id: string) => number;
        /** The key handler of one control of the ring. */
        ringKeys: (id: string) => (event: KeyboardEvent) => void;
        /** A page button let go at a new place: its page, to stand before `before` or last. */
        onmove: (page: string, before: string | null) => void;
        /** A choice of a page button's right-click menu. */
        onmenu: (page: string, pick: string) => void;
    };

    let { pages, stopIndex, ringKeys, onmove, onmenu }: Props = $props();

    /** How many rail pages a digit reaches: the bare digits 1 to 9, resolved in shell/keys. */
    const SHORTCUTS = 9;

    /** The rail key of the page on screen, which is the button drawn as the one in force. */
    const shown = $derived(currentPage().rail);

    /**
     * The badge one page button draws, from the views its page holds in the order of the page's
     * tabs: each one's name, the part it gives the rail and its tab's badge.
     */
    function badgeFor(entry: RailPage): RailBadge | null {
        const views = railPageViews(allPages(), entry.page, entry.node).flatMap((id) => {
            const found = viewFor(id);
            if (found === undefined) return [];
            return [
                {
                    label: registrationLabel(found),
                    part: railPartOf(found, client),
                    badge: badgeOf(found, client)
                }
            ];
        });
        return railBadge(views);
    }

    /** The theme token pair a toned badge is drawn from; nothing for one that takes the accent. */
    function badgeStyle(tone: string | undefined): string | undefined {
        return tone === undefined
            ? undefined
            : `--rail-badge-bg: var(--c-${tone}); --rail-badge-fg: var(--on-c-${tone})`;
    }

    /**
     * The hover words of one page button: its name, the digit that reaches it for the first nine,
     * and what its badge counts.
     */
    function tip(entry: RailPage, index: number, badge: RailBadge | null): string {
        const name =
            index < SHORTCUTS ? t('ui.page_shortcut', entry.label, index + 1) : entry.label;
        return badge === null ? name : t('ui.page_badge_tip', name, badge.title);
    }

    let box: HTMLElement | undefined = $state();

    /** The press a drag may grow out of: the page pressed and where the pointer went down. */
    let pressed: { page: string; origin: Point } | null = null;

    /** The page being dragged along the rail, and the place among the buttons it would land. */
    let carried: { page: string; at: number } | null = $state(null);

    /** Where the pointer went down on the last press, which tells a click from a drag's release. */
    let pressedAt: Point | null = null;

    /** The drawn buttons' boxes, top to bottom, in the viewport. */
    function boxes(): DOMRect[] {
        return [...(box?.querySelectorAll<HTMLElement>('[data-rail-page]') ?? [])].map((node) =>
            node.getBoundingClientRect()
        );
    }

    /** The line between two buttons a drag would land at, from the top of the page buttons. */
    const insertTop = $derived.by((): number | null => {
        if (carried === null || box === undefined) return null;
        const drawn = boxes();
        const origin = box.getBoundingClientRect().top;
        if (drawn.length === 0) return null;
        const edge =
            carried.at < drawn.length ? drawn[carried.at].top : drawn[drawn.length - 1].bottom;
        return edge - origin;
    });

    function press(page: string, event: PointerEvent): void {
        if (event.button !== 0) return;
        pressedAt = { x: event.clientX, y: event.clientY };
        pressed = { page, origin: pressedAt };
        track(true);
    }

    function moved(event: PointerEvent): void {
        const held = pressed;
        if (held === null) return;
        const far = Math.hypot(event.clientX - held.origin.x, event.clientY - held.origin.y);
        if (carried === null && far < THRESHOLD) return;
        carried = { page: held.page, at: railInsertAt(event.clientY, boxes()) };
    }

    /**
     * The pointer came up. A drag let go at a place other than its own asks for the move; the
     * places either side of the dragged button are its own place, and ask for nothing.
     */
    function released(): void {
        const held = carried;
        track(false);
        if (held === null) return;
        const from = pages.findIndex((entry) => entry.page === held.page);
        if (from < 0 || held.at === from || held.at === from + 1) return;
        onmove(held.page, pages.at(held.at)?.page ?? null);
    }

    function cancelled(event: KeyboardEvent): void {
        if (event.key !== 'Escape' || carried === null) return;
        event.preventDefault();
        track(false);
    }

    /** The document listeners a press needs, installed while a press is held and no longer. */
    function track(on: boolean): void {
        if (on) {
            document.addEventListener('pointermove', moved);
            document.addEventListener('pointerup', released);
            document.addEventListener('pointercancel', released);
            document.addEventListener('keydown', cancelled);
            return;
        }
        pressed = null;
        carried = null;
        document.removeEventListener('pointermove', moved);
        document.removeEventListener('pointerup', released);
        document.removeEventListener('pointercancel', released);
        document.removeEventListener('keydown', cancelled);
    }

    $effect(() => () => {
        if (typeof document !== 'undefined') track(false);
    });

    /** A press shows the button's page; the release that ends a drag is the drag's, not a press. */
    function show(entry: RailPage, event: MouseEvent): void {
        const from = pressedAt;
        pressedAt = null;
        const drag =
            from !== null &&
            event.detail !== 0 &&
            Math.hypot(event.clientX - from.x, event.clientY - from.y) >= THRESHOLD;
        if (!drag) openRailPage(entry.page, entry.label, entry.node);
    }
</script>

<div class="pages" bind:this={box}>
    <!-- Keyed by the arrangement key, which the rule over the list holds unique. -->
    {#each pages as entry, index (entry.page)}
        {@const badge = badgeFor(entry)}
        {@const stop = `page:${entry.page}`}
        <ContextMenu
            label={entry.label}
            items={railMenu(allPages().some((page) => page.rail === entry.page))}
            onpick={(pick: string) => onmenu(entry.page, pick)}
        >
            <!-- The button is where a drag along the rail starts; it is pressed as it is. -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div
                class="control"
                class:carried={carried?.page === entry.page}
                data-rail-page={entry.page}
                onpointerdown={(event) => press(entry.page, event)}
            >
                <ToolButton
                    label={entry.label}
                    title={tip(entry, index, badge)}
                    glyph={entry.glyph}
                    active={shown === entry.page}
                    compact
                    rail
                    {stop}
                    tabindex={stopIndex(stop)}
                    onkeydown={ringKeys(stop)}
                    onclick={(event: MouseEvent) => show(entry, event)}
                />
                {#if badge !== null}
                    <span
                        class="badge"
                        style={badgeStyle(badge.tone)}
                        aria-hidden="true"
                        data-rail-badge
                    >
                        {#if badge.glyph !== ''}
                            <Glyph name={badge.glyph} />
                        {/if}
                        {badge.text}
                    </span>
                {/if}
            </div>
        </ContextMenu>
    {/each}
    {#if insertTop !== null}
        <span class="insert" style="top: {insertTop}px" aria-hidden="true" data-rail-insert></span>
    {/if}
</div>

<style>
    .pages {
        position: relative;
        display: flex;
        flex-direction: column;
    }

    .control {
        position: relative;
        display: block;
        width: 100%;
    }

    /* The button being dragged stays where it is, faded, while the line says where it would go. */
    .control.carried {
        opacity: 0.5;
    }

    /* VS Code's activity badge: a 16 px pill of 9 px bold text in the UI face, its right edge 8 px
       in from the item's and its top at the item's middle, so it sits over the icon's lower right
       corner inside the item's box. A badge with a tone is drawn in that tone's pair, the tokens a
       tab's badge uses, and one without in the accent with its black or white. It grows leftward
       with its text and is cut before it would leave the box. It takes no pointer, so the button
       under it is pressed through it, and the button's tooltip carries what it counts. */
    .badge {
        position: absolute;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 1px;
        top: 24px;
        right: 8px;
        box-sizing: border-box;
        min-width: var(--rail-badge-height);
        max-width: calc(100% - 8px);
        height: var(--rail-badge-height);
        padding: 0 4px;
        overflow: hidden;
        border-radius: var(--radius-pill);
        background: var(--rail-badge-bg, var(--accent));
        color: var(--rail-badge-fg, var(--on-accent));
        font-family: var(--font-ui);
        font-size: var(--rail-badge-text);
        font-weight: 600;
        line-height: var(--rail-badge-height);
        text-align: center;
        text-overflow: ellipsis;
        white-space: nowrap;
        pointer-events: none;
    }

    /* A terminal palette draws a glyph as a stand-in of up to three characters across the middle of
       the item, which the badge at the icon's corner would cover; there it sits under the text in
       the item's lower right corner, still inside the item's box. */
    :global(body.rice) .badge {
        top: 31px;
        right: 2px;
    }

    /* Where a dragged button would land: a 2 px line across the rail between two buttons, VS Code's
       insertion border. */
    .insert {
        position: absolute;
        left: 0;
        right: 0;
        height: 2px;
        margin-top: -1px;
        background: var(--accent);
        pointer-events: none;
    }
</style>
