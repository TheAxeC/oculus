<script lang="ts">
    // Layer 3, Present partial. One group of a deck at its place in the Overview: the heading every
    // grouping of a view is drawn with (ui/controls/heads/GroupHead.svelte), naming the group and
    // the count of its decks, with the names its `slides:` holds that match no deck and the decks
    // two discovering groups both find as tags, and its Edit Rule control; under it the group's
    // rule as one sentence, the rule's form while it is open, the slides of its decks as tiles in
    // the group's order, a title tile for a deck that draws no slide, and the Add tile last.
    //
    // The heading does not fold, so the pane's saved state holds nothing of it. The heading's strip
    // is dragged to move the entry the group is headed at. The group's place is a drop target: an
    // entry of the order dropped on it goes before or after the entry the group is headed at, by
    // the half it is dropped on, and a deck of another group joins it. A deck's tiles are dragged
    // within the group or onto another, and a right-click on a tile or on the heading offers Move
    // Earlier and Move Later, the keyboard's way to each drag, and Remove from Group for a deck the
    // group names. The Add tile opens the decks the group's `find:` matches and does not hold; with
    // none it says so and opens nothing.

    import GroupHead from '$lib/ui/controls/heads/GroupHead.svelte';
    import Tag from '$lib/ui/controls/Tag.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import ContextMenu from '$lib/ui/menu/ContextMenu.svelte';
    import Menu from '$lib/ui/menu/Menu.svelte';
    import RuleForm from './RuleForm.svelte';
    import Tile from './Tile.svelte';
    import { arrangeMenu, isArrange, tileMenu } from '../acts/menu';
    import {
        ruleSentence,
        type DeckTile,
        type FindChoices,
        type KeyEdit,
        type GroupBlock,
        type TileView
    } from '$lib/state/life/arrange';
    import { t } from '$lib/state/shared/words/text';
    import { deckWords, type DeckSlide } from '$lib/state/life/present';
    import { createOpener, type Arrange } from './arrange.svelte';

    type Props = {
        block: GroupBlock;
        /** What the group's tiles read: the deck, the slide in force, the cursor, the press. */
        view: TileView;
        arrange: Arrange;
        /** Whether the entry the group is headed at is the order's first or its last. */
        first: boolean;
        last: boolean;
        /** The words each list of the rule's `find:` offers. */
        choices: FindChoices;
        /** A pick of a slide act of a tile's menu. */
        onact: (id: string, row: DeckSlide) => void;
    };

    let { block, view, arrange, first, last, choices, onact }: Props = $props();

    const deck = $derived(view.deck);
    const name = $derived(block.group.name);
    const busy = $derived(arrange.busy());

    /** Whether the rule's form is open, under its Edit Rule control. */
    const rule = createOpener();

    /** The heading's menu: the moves of the entry the group is headed at, none at the end. */
    const headMenu = $derived(
        block.token === null ? [] : arrangeMenu({ first, last, removable: false, busy })
    );

    /** The decks the Add tile offers, each by its title in plain words. */
    const candidates = $derived(
        block.group.candidates.map((one) => ({
            id: one.name,
            label: deckWords(one.title, one.name)
        }))
    );

    /** The menu of a deck's tile: its slide's acts, then the deck's moves in the group. */
    function deckMenu(row: DeckSlide | null, one: DeckTile, at: number) {
        const place = {
            first: at === 0,
            last: at === block.decks.length - 1,
            removable: one.named,
            busy
        };
        return tileMenu(deck, row, row !== null && row.source === undefined ? null : place);
    }

    function deckPick(id: string, row: DeckSlide | null, one: DeckTile): void {
        if (isArrange(id)) arrange.pickDeck(id, name, one.name);
        else if (row !== null) onact(id, row);
    }

    /** The drag handlers of a tile of one deck. */
    function deckDrag(one: DeckTile, row: DeckSlide | null) {
        const movable = row === null || row.source !== undefined;
        return {
            draggable: movable && !busy,
            ondragstart: (event: DragEvent) =>
                arrange.start(event, { kind: 'deck', group: name, name: one.name }),
            ondragover: (event: DragEvent) => arrange.overDeck(event),
            ondrop: (event: DragEvent) => arrange.dropOnDeck(event, name, one.name),
            ondragend: (event: DragEvent) => arrange.end(event)
        };
    }

    /** Where the pointer last went down in the group, which tells its heading from its body. */
    let grabbed: EventTarget | null = null;

    /**
     * A drag of the group's section, which is the drag of its entry when it began on the heading's
     * strip (GroupHead's `h3`). A drag that began in the body, on the rule or around the tiles, is
     * no drag at all; a tile's drag starts and ends on the tile and never reaches the section.
     */
    function headDrag(event: DragEvent): void {
        const section = event.currentTarget;
        const strip = section instanceof Element ? section.querySelector(':scope > h3') : null;
        const onStrip = grabbed instanceof Node && strip?.contains(grabbed) === true;
        if (block.token === null || !onStrip) {
            event.preventDefault();
            return;
        }
        arrange.start(event, { kind: 'entry', token: block.token });
    }
</script>

<ContextMenu
    label={t('present.menu_label')}
    items={headMenu}
    onpick={(id: string) => {
        if (isArrange(id) && block.token !== null) arrange.pickEntry(id, block.token);
    }}
>
    <GroupHead
        data-group={name}
        aria-label={name}
        label={name}
        count={block.group.members.length}
        draggable={block.token !== null && !busy && !rule.open()}
        onpointerdown={(event: PointerEvent) => (grabbed = event.target)}
        ondragstart={headDrag}
        ondragover={(event: DragEvent) => arrange.overGroup(event, block.token)}
        ondrop={(event: DragEvent) => arrange.dropOnGroup(event, name, block.token)}
        ondragend={(event: DragEvent) => arrange.end(event)}
    >
        {#snippet actions()}
            {#each block.group.missing as one (one)}
                <Tag label={t('present.arrange_missing', deckWords(one, one))} />
            {/each}
            {#each block.group.conflicts as one (one.path)}
                <Tag
                    label={t(
                        'present.arrange_conflict',
                        deckWords(one.name, one.name),
                        one.others.join(t('present.rule_comma'))
                    )}
                />
            {/each}
            <span bind:this={rule.box}>
                <ToolButton
                    small
                    label={t('present.rule_edit')}
                    title={t('present.rule_edit_tip', name)}
                    pressed={rule.open()}
                    disabled={busy || deck.keys === null}
                    onclick={rule.toggle}
                />
            </span>
        {/snippet}
        <p class="rule" data-rule={name}>{ruleSentence(deck.keys, name, choices)}</p>
        {#if rule.open()}
            <RuleForm
                group={name}
                keys={deck.keys}
                {choices}
                {busy}
                onapply={(changes: KeyEdit[]) =>
                    arrange.setKeys(changes, t('present.said_rule_set', name))}
                oncancel={() => void rule.close()}
            />
        {/if}
        <div class="tiles">
            {#each block.decks as one, at (`${at}:${one.name}`)}
                {#if one.slides.length === 0}
                    <Tile
                        id={`deck-title:${name}:${block.at}:${at}:${one.name}`}
                        row={null}
                        {view}
                        title={one.title}
                        items={deckMenu(null, one, at)}
                        onmenu={(id: string) => deckPick(id, null, one)}
                        {...deckDrag(one, null)}
                    />
                {:else}
                    {#each one.slides as row (row.key)}
                        <Tile
                            {row}
                            {view}
                            items={deckMenu(row, one, at)}
                            onmenu={(id: string) => deckPick(id, row, one)}
                            {...deckDrag(one, row)}
                        />
                    {/each}
                {/if}
            {/each}
            <div class="add" data-add={name}>
                <Menu
                    label={candidates.length === 0
                        ? t('present.arrange_add_none')
                        : t('present.arrange_add')}
                    items={candidates}
                    placement="down"
                    waiting={busy || candidates.length === 0}
                    onpick={(id: string) =>
                        arrange.addDeck(
                            name,
                            id,
                            candidates.find((one) => one.id === id)?.label ?? id
                        )}
                />
            </div>
        </div>
    </GroupHead>
</ContextMenu>

<style>
    .rule {
        margin: 0 0 8px;
        padding: 0 8px;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-sm);
    }

    .tiles {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(min(220px, 100%), 1fr));
        gap: 12px;
    }

    /* The Add tile closes the group's tiles, drawn as a place a deck can go. */
    .add {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 72px;
        border: 1px dashed var(--line);
        border-radius: var(--radius-sm);
    }
</style>
