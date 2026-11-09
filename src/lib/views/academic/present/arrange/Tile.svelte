<script lang="ts">
    // Layer 3, Present partial. One tile of the Overview: a slide drawn small in its frame and
    // measured (screen/Framed.svelte, at the size of the tile) with its place and its title under
    // it, or, for a deck that draws no slide, a title tile naming the deck. The tile carries the
    // hue of the project the slide belongs to on its left edge, the hairline of the slide in force,
    // the shell's card cursor through its card, the Too tall mark beside its place once its slide
    // has been laid out and while the Present store holds the slide as taller than its frame, with
    // the finding's message as its tooltip, and the menu of the slide and of its arranging acts on
    // a right-click.
    //
    // The tile's shape, place, title, menu and drag are drawn at once. Its slide is mounted at the
    // tile's turn on the Overview's queue (screen/layout-turns.ts), flushed inside that turn so its
    // cost counts against the queue's budget, and every layout of the slide waits on that queue
    // too, so a deck of many tiles leaves the page answering while they arrive. Until then the shot
    // holds the slide's shape, empty. A tile's turn does not depend on its being on screen, so
    // every slide is drawn and measured once the queue has emptied. The shot is contained, so the
    // forced layouts of one slide do not lay out the rest of the page.
    //
    // The drawn slide is inert: nothing inside it takes a press or the focus, so a press anywhere
    // on the tile is the tile's press, which shows the slide, and the keyboard presses the card's
    // title, which is what the card cursor's Enter presses too. A title tile's title is a menu
    // button holding the tile's arranging acts, the keyboard's way to them, which Enter under the
    // card cursor opens. The drag a tile takes part in is the Overview's (arrange.svelte.ts); the
    // tile is its source and its target.

    import { flushSync } from 'svelte';
    import Card from '$lib/ui/frame/card/Card.svelte';
    import Chip from '$lib/ui/controls/Chip.svelte';
    import ContextMenu from '$lib/ui/menu/ContextMenu.svelte';
    import Menu from '$lib/ui/menu/Menu.svelte';
    import Tooltip from '$lib/ui/menu/Tooltip.svelte';
    import type { MenuItem } from '$lib/ui/menu/menu-items';
    import Framed from '../screen/Framed.svelte';
    import { layoutTurns } from '../screen/layout-turns';
    import { t } from '$lib/state/shared/words/text';
    import { SLIDE_SHAPE, slideTone, type DeckSlide } from '$lib/state/life/present';
    import type { TileView } from '$lib/state/life/arrange';
    import { useState } from '$lib/state/client/use';

    type Props = {
        /** The slide the tile draws, or null for a title tile. */
        row: DeckSlide | null;
        view: TileView;
        /** A title tile's card id, which the card cursor names, and the deck's title it shows. */
        id?: string;
        title?: string;
        items: MenuItem[];
        /** A pick of the tile's menu. */
        onmenu: (id: string) => void;
        /** Whether the tile can be dragged, and the drag's handlers. */
        draggable: boolean;
        ondragstart?: (event: DragEvent) => void;
        ondragover?: (event: DragEvent) => void;
        ondrop?: (event: DragEvent) => void;
        ondragend?: (event: DragEvent) => void;
    };

    let {
        row,
        view,
        id = '',
        title = '',
        items,
        onmenu,
        draggable,
        ondragstart,
        ondragover,
        ondrop,
        ondragend
    }: Props = $props();

    /**
     * A slide tile is the slide's card: its key, its title (the key for none), its place in the
     * deck and its press. A title tile names the deck and says it draws no slide, with no press.
     */
    const card = $derived(row?.key ?? id);
    const words = $derived(row === null ? title : row.title === '' ? row.key : row.title);
    const place = $derived(row === null ? t('present.arrange_no_slide') : view.placeOf(row));
    const current = $derived(row !== null && row.key === view.current);
    const onpress = $derived(row === null ? undefined : () => view.onpick(row.key));

    const tone = $derived(row === null ? undefined : slideTone(row));

    const {
        present: { tallMark }
    } = useState();

    const turns = layoutTurns();

    /** Whether the slide is mounted, which waits for the tile's turn on the Overview's queue. */
    let mounted = $state(false);
    /** Whether the slide has been laid out once, before which the tile carries no mark. */
    let laid = $state(false);

    /** Whether the tile draws a slide, read apart from `row` so a new row asks for no new turn. */
    const drawsSlide = $derived(row !== null);

    $effect(() => {
        if (!drawsSlide) return;
        const mount = (): void => {
            flushSync(() => {
                mounted = true;
            });
        };
        turns.ask(mount);
        return () => turns.drop(mount);
    });

    /** The slide's mark, found apart from its reading so that the reading tracks it. */
    const mark = $derived(row === null ? null : tallMark(view.deck, row.key));
    /** The finding of a slide measured taller than its frame, which the tile's mark carries. */
    const tall = $derived(mark === null || !laid ? '' : mark.message);

    /** The row's hue as a custom property, so the edge below names a token and not a colour. */
    const toneStyle = $derived(tone === undefined ? undefined : `--tone: var(--c-${tone})`);

    /** A press on the tile shows its slide; the card's title button presses it itself. */
    function pressed(event: MouseEvent): void {
        if (onpress === undefined) return;
        if (event.target instanceof Element && event.target.closest('button') !== null) return;
        onpress();
    }
</script>

<ContextMenu label={t('present.menu_label')} {items} own onpick={onmenu}>
    <!-- The press on the tile repeats its title's, which the keyboard reaches; the drawn slide is
         inert, so a press inside it lands here. -->
    <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
    <div
        class="tile"
        class:toned={tone !== undefined}
        class:current
        class:pressable={onpress !== undefined}
        style={toneStyle}
        data-tile={card}
        {draggable}
        {ondragstart}
        {ondragover}
        {ondrop}
        {ondragend}
        onclick={pressed}
    >
        {#if row !== null}
            <div class="shot" inert style:aspect-ratio="{SLIDE_SHAPE.width} / {SLIDE_SHAPE.height}">
                {#if mounted}
                    <Framed
                        {row}
                        deck={view.deck}
                        facts={view.facts}
                        {turns}
                        onlaid={() => (laid = true)}
                    />
                {/if}
            </div>
        {/if}
        <Card
            id={card}
            cursor={card === view.cursor}
            title={words}
            heading={row === null ? titleMenu : undefined}
            level={4}
            ontitle={onpress}
        >
            {#snippet meta()}
                <span class="at">{place}</span>
                {#if tall !== ''}
                    <Tooltip text={tall}>
                        <Chip
                            label={t('present.too_tall')}
                            glyph={t('present.too_tall_glyph')}
                            tone="amber"
                        />
                    </Tooltip>
                {/if}
            {/snippet}
        </Card>
    </div>
</ContextMenu>

<!-- A title tile's title opens the tile's menu, so its acts are reached from the keyboard. -->
{#snippet titleMenu()}
    <Menu label={words} {items} placement="down" onpick={(id: string) => onmenu(id)} />
{/snippet}

<style>
    /* The theme hue rides the left edge of the tile, as it does on the slide itself. */
    .tile {
        display: flex;
        flex-direction: column;
        gap: 6px;
        min-width: 0;
        border-left: 4px solid var(--line);
        border-radius: var(--radius-sm);
    }

    .tile.toned {
        border-left-color: var(--tone);
    }

    .tile.pressable {
        cursor: pointer;
    }

    /* The slide in force is told from the rest by its own hairline, apart from the shell's
       cursor. */
    .tile.current {
        outline: 1px solid var(--accent);
        outline-offset: 1px;
    }

    /* The shot keeps the slide's shape, set on the element, and is contained, so a layout inside
       its slide does not lay out the rest of the page. */
    .shot {
        min-width: 0;
        contain: strict;
    }

    .at {
        color: var(--muted-txt, var(--muted));
        font-family: var(--font-num);
        font-size: var(--fs-sm);
    }
</style>
