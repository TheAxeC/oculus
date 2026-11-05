<script lang="ts">
    // Layer 3, Present partial. One tile of the Overview: a slide drawn small in its frame
    // (screen/Stage.svelte and Slide.svelte, scaled to the tile) with its place and its title
    // under it, or, for a deck that draws no slide, a title tile naming the deck. The tile carries
    // the hue of the project the slide belongs to on its left edge, the hairline of the slide in
    // force, the shell's card cursor through its card, and the menu of the slide and of its
    // arranging acts on a right-click.
    //
    // The drawn slide is inert: nothing inside it takes a press or the focus, so a press anywhere
    // on the tile is the tile's press, which shows the slide, and the keyboard presses the card's
    // title, which is what the card cursor's Enter presses too. A title tile's title is a menu
    // button holding the tile's arranging acts, the keyboard's way to them, which Enter under the
    // card cursor opens. The drag a tile takes part in is the Overview's (arrange.svelte.ts); the
    // tile is its source and its target.

    import Card from '$lib/ui/frame/Card.svelte';
    import ContextMenu from '$lib/ui/menu/ContextMenu.svelte';
    import Menu from '$lib/ui/menu/Menu.svelte';
    import type { MenuItem } from '$lib/ui/menu/menu-items';
    import Slide from '../Slide.svelte';
    import Stage from '../screen/Stage.svelte';
    import { t } from '$lib/state/shared/words/text';
    import { slideTone, type DeckSlide } from '$lib/state/life/present';
    import type { TileView } from '$lib/state/life/arrange';

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
            <div class="shot" inert>
                <Stage>
                    <Slide {row} deck={view.deck} first={false} />
                </Stage>
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

    /* The slide's frame keeps the proportions of the 1280 by 720 frame it is laid out in. */
    .shot {
        aspect-ratio: 16 / 9;
        min-width: 0;
    }

    .at {
        color: var(--muted-txt, var(--muted));
        font-family: var(--font-num);
        font-size: var(--fs-sm);
    }
</style>
