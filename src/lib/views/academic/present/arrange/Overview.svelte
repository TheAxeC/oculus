<script lang="ts">
    // Layer 3, Present partial. The whole deck at once, arranged as its `order:` places it: a
    // header line with the deck's title and the Edit control of its own keys (DeckForm.svelte),
    // then each entry in order. A file, a summary or a grid draws its slides as tiles
    // (Tile.svelte), each its slide drawn small with its place and title under it; a group draws
    // its heading, its rule and the slides of its decks (Group.svelte); an entry that places no
    // slide draws a placeholder tile naming the entry and what the deck's reader found about it.
    // Pressing a slide's tile shows that slide and closes the grid, and a right-click on a tile
    // opens the menu of that slide with the arranging acts after it.
    //
    // Arranging writes at once (arrange.svelte.ts): an entry's tile, a placeholder or a group's
    // heading is dragged to another place among the entries, a deck's tile within its group or onto
    // another group, and Move Earlier and Move Later in each menu are the keyboard's way to each
    // drag. History undoes every one. Every arranging control is held from a write until its answer
    // and, after a write that changed the file, until the server pushes the deck read again or a
    // bound after the answer passes; a refusal or a failure holds nothing. The layout is
    // state/life/arrange.ts's (`overviewRuns`), read from the deck the server sent, so a push that
    // changes the file draws the Overview again in every pane that shows the deck.
    //
    // The deck is the pane's, read under the pane's filter: a group draws the decks the filter
    // keeps and counts them, and a move made while it is in force writes the group's whole list,
    // the decks it hides kept in their places. The Add tile lists the decks the group's `find:`
    // matches and does not hold, which the filter does not narrow.

    import ContextMenu from '$lib/ui/menu/ContextMenu.svelte';
    import Menu from '$lib/ui/menu/Menu.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import DeckForm from './DeckForm.svelte';
    import Group from './Group.svelte';
    import Tile from './Tile.svelte';
    import { createArrange, createOpener } from './arrange.svelte';
    import { isArrange, isAct, tileMenu } from '../acts/menu';
    import {
        deckHues,
        overviewRuns,
        FIND_LISTS,
        type EntryBlock,
        type FindList,
        type KeyEdit,
        type TileView
    } from '$lib/state/life/arrange';
    import { vocabChoices } from '$lib/state/forms/schema';
    import { deckLabel, type Deck, type DeckRef, type DeckSlide } from '$lib/state/life/present';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';

    type Props = {
        deck: Deck;
        /**
         * The deck as the server read it from its files, under the pane's filter as `deck` is,
         * which an arranging act's hold waits on; null while it is not read.
         */
        saved: Deck | null;
        ref: DeckRef | null;
        /** The key of the slide the reader was on, marked as the one in force. */
        current: string;
        /** The shell's card cursor, the card its keys act on; null for none. */
        cursor: string | null;
        onpick: (key: string) => void;
        /** A pick of a slide act of a tile's menu. */
        onact: (id: string, row: DeckSlide) => void;
        /** Say a line in the pane's status line. */
        say: (line: string) => void;
    };

    let { deck, saved, ref, current, cursor, onpick, onact, say }: Props = $props();

    const {
        entities: { config },
        writes: { writeDeckSlides }
    } = useState();

    const arrange = createArrange({
        ref: () => ref,
        deck: () => deck,
        files: () => saved,
        write: writeDeckSlides,
        say: (line) => say(line)
    });
    const busy = $derived(arrange.busy());

    const runs = $derived(overviewRuns(deck));
    const last = $derived(deck.order.length - 1);

    /** The place of each slide in the deck, which its tile names. */
    const places = $derived(new Map(deck.slides.map((row, at) => [row.key, at + 1])));
    function placeOf(row: DeckSlide): string {
        return t('present.at', String(places.get(row.key) ?? 0));
    }

    /** What every tile reads, the tiles of the groups as well. */
    const view: TileView = $derived({ deck, placeOf, current, cursor, onpick });

    /**
     * The engine's configuration, whose palette and vocabulary the forms offer and whose labels the
     * rule sentences read.
     */
    const engine = $derived(config()?.config);
    const hues = $derived(deckHues(engine));
    function choices(list: FindList): { id: string; label: string }[] {
        const vocab = FIND_LISTS.find((one) => one.key === list)?.vocab ?? list;
        return vocabChoices(engine ?? {}, vocab);
    }

    /** Whether the deck's own form is open, under its Edit control. */
    const keysForm = createOpener();

    /** The menu of an entry's tile or placeholder: its slide's acts, then the entry's moves. */
    function entryMenu(block: EntryBlock, row: DeckSlide | null) {
        const place = { first: block.at === 0, last: block.at === last, removable: false, busy };
        return tileMenu(deck, row, row !== null && row.source === undefined ? null : place);
    }

    function entryPick(id: string, block: EntryBlock, row: DeckSlide | null): void {
        if (isArrange(id)) arrange.pickEntry(id, block.entry.token);
        else if (row !== null && isAct(id)) onact(id, row);
    }

    /** The drag handlers of an entry's tile or placeholder. */
    function entryDrag(block: EntryBlock, row: DeckSlide | null) {
        const token = block.entry.token;
        return {
            draggable: (row === null || row.source !== undefined) && !busy,
            ondragstart: (event: DragEvent) => arrange.start(event, { kind: 'entry', token }),
            ondragover: (event: DragEvent) => arrange.overEntry(event, token),
            ondrop: (event: DragEvent) => arrange.dropOnEntry(event, token),
            ondragend: (event: DragEvent) => arrange.end(event)
        };
    }

    /** The key a run is drawn under: its group and place, or its first entry's place. */
    function runKey(run: (typeof runs)[number]): string {
        return run.kind === 'group'
            ? `group:${run.group.name}:${run.at}`
            : `entries:${run.entries[0].at}`;
    }
</script>

<div class="overview" data-overview>
    <div class="head">
        <h3 class="title">{deckLabel(deck)}</h3>
        <span bind:this={keysForm.box}>
            <ToolButton
                small
                label={t('present.deck_edit')}
                title={t('present.deck_edit_tip')}
                pressed={keysForm.open()}
                disabled={busy || deck.keys === null}
                onclick={keysForm.toggle}
            />
        </span>
    </div>
    {#if keysForm.open()}
        <DeckForm
            keys={deck.keys}
            {hues}
            {busy}
            onapply={(changes: KeyEdit[]) => arrange.setKeys(changes, t('present.said_deck_set'))}
            oncancel={() => void keysForm.close()}
        />
    {/if}
    {#each runs as run (runKey(run))}
        {#if run.kind === 'group'}
            <Group
                block={run}
                {view}
                {arrange}
                first={run.at === 0}
                last={run.at === last}
                {choices}
                {onact}
            />
        {:else if run.kind === 'entries'}
            <div class="tiles">
                {#each run.entries as block (block.entry.token)}
                    {#if block.slides.length === 0}
                        <ContextMenu
                            label={t('present.menu_label')}
                            items={entryMenu(block, null)}
                            own
                            onpick={(id: string) => entryPick(id, block, null)}
                        >
                            <div
                                class="placeholder"
                                data-placeholder={block.entry.token}
                                {...entryDrag(block, null)}
                            >
                                <Menu
                                    label={t(
                                        'present.arrange_placeholder',
                                        block.entry.name,
                                        block.finding
                                    )}
                                    items={entryMenu(block, null)}
                                    placement="down"
                                    onpick={(id: string) => entryPick(id, block, null)}
                                />
                            </div>
                        </ContextMenu>
                    {:else}
                        {#each block.slides as row (row.key)}
                            <Tile
                                {row}
                                {view}
                                items={entryMenu(block, row)}
                                onmenu={(id: string) => entryPick(id, block, row)}
                                {...entryDrag(block, row)}
                            />
                        {/each}
                    {/if}
                {/each}
            </div>
        {/if}
    {/each}
</div>

<style>
    .overview {
        display: flex;
        flex-direction: column;
        gap: 14px;
        min-width: 0;
    }

    /* The deck's header line: its title, then the control that edits its keys. */
    .head {
        display: flex;
        align-items: center;
        gap: 8px;
        min-width: 0;
    }

    .title {
        margin: 0;
        min-width: 0;
        overflow: hidden;
        font-size: var(--fs-md);
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .tiles {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(min(220px, 100%), 1fr));
        gap: 12px;
    }

    /* An entry that places no slide is drawn as a place in the order, named with its finding. */
    .placeholder {
        display: flex;
        align-items: center;
        justify-content: center;
        min-width: 0;
        min-height: 72px;
        border: 1px dashed var(--line);
        border-left-width: 4px;
        border-radius: var(--radius-sm);
    }
</style>
