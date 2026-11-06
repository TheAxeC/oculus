<script module lang="ts">
    // Layer 3, view registration. Present is the Present page's group.
    import type { ViewRegistration } from '$lib/state/workbench/navigation/registry';

    export const registration: ViewRegistration = {
        id: 'present',
        label: 'views.present',
        glyph: 'views.present_glyph',
        group: 'present',
        order: 0
    };
</script>

<script lang="ts">
    // Layer 3, view. The public slide deck, live: one slide filling the pane, the arrow keys and
    // the toolbar to move through it, `O` for the grid of the whole deck, the Present control or
    // `F` for the slide on the whole monitor, and the Presenter control or `P` for the presenter
    // screen.
    //
    // A slide is drawn in its deck's frame (the deck's `deck.frame`, else the setting
    // `defaults.frame`), scaled uniformly to the pane and centred in it, and measured
    // (screen/Framed.svelte). The overview draws every slide the same way, scaled to its tile, and
    // is where the deck is arranged (arrange/Overview.svelte); a deck with an entry or a group and
    // no slide draws it in place of a slide. The empty state keeps the UI's tokens.
    //
    // The deck is a folder the server reads (api/deck): `present.yml` and the Markdown slide files,
    // so a slide edited on disk is the slide on screen at the next push. A pane shows the portfolio
    // deck until it is pointed at another: a project's deck, a deck it has shown, or the one a
    // folder of the Files view opened it on. The deck menu in the toolbar lists them.
    //
    // A deck whose groups hold project decks draws the Projects board's filter under the toolbar,
    // the same bar and rules over the projects whose decks those groups hold
    // (acts/filter.svelte.ts): its controls are the pane's, saved with its instance under the
    // board's keys and set back as a board starts when it opens another deck, the deck is read with
    // the projects the bar shows, and the pane, the overview, the presenter screen, the audience
    // window and the PDF draw that deck. The file is never written for a control.
    //
    // Where the reader is, and whether the grid is open, belong to the instance rather than to the
    // store, so two panes on the deck hold two positions and a push that rebuilds the deck leaves
    // each reader where they were. The instance's `slide` is the key a slide of the deck carries.
    //
    // The keys are the pane's own (screen/box.ts), bound to the view's box rather than to the
    // window: the shell owns the digits and the chords, and a deck that swallowed an arrow key
    // wherever the reader was looking would take the pane strip's own keys with it. The box takes
    // the focus when the view is mounted and on a press inside it, so the arrows work from the
    // moment the deck is opened. The keys are the arrows, Page Up and Page Down, Home and End,
    // Space (the next slide, Shift+Space the previous one), `O` for the grid, `F` for full screen,
    // `P` for the presenter screen and Escape to close the grid, and then to end the presentation.
    // A key pressed in a field inside the box (an input, a text area, a select, editable text) is
    // the field's, so a form of the overview keeps what is typed in it; Escape in a field closes
    // the grid unless the field or the form around it took it. On a button or a link the deck's
    // keys act, except Space, which presses the control.
    //
    // The presenter screen (presenter/Presenter.svelte) takes the place of the slide in the pane:
    // the slide, the next one, the slide's notes, the time and a timer, while the audience sees
    // the slide alone in a window of its own (routes/present/show). The presentation is the
    // page's, not the component's (state/life/present.svelte.ts), so it goes on while the pane is
    // not drawn. While it is on, the slides are the deck as saved: an editor's unsaved text
    // changes neither window until it is saved.
    //
    // Full screen is the box's own (screen/fullscreen.svelte.ts): the browser draws the box alone,
    // so the rail, the tabs and the toolbar are gone with no change to the shell. In full screen
    // the box fills the screen on the page's background colour with the frame centred and edge to
    // edge, a click on the slide moves to the next one, and the pointer hides after it has rested.
    // In full screen the shell's keys are held back, since what they open is drawn outside the box:
    // the deck's keys, the card cursor's keys over the grid, Enter and Space on a control and what
    // is typed in a field act, Tab wraps inside the box, and the focus leaving for an element
    // outside the box (a modified key such as Cmd+Shift+F) ends the full screen.
    //
    // A slide that comes from a project's deck, whose project has a field that holds a value,
    // carries the strip of the project's facts at its foot (`slideFacts`), on the pane, the
    // presenter screen, the tiles, the audience window and the PDF. The toolbar's Project facts
    // toggle, drawn while the slide on screen carries a project, shows or hides its words; it is
    // the pane's, kept with the instance and through a change of deck.
    //
    // A slide has a menu on a right-click, on the slide and on its tile in the grid (acts/menu.ts):
    // Edit Slide, New Slide, Duplicate Slide and Delete Slide, which are also commands in the
    // palette for the slide on screen, and on a tile the arranging acts after them. An image
    // dropped on a slide of the deck's own files is added to it. While a source tab of the same
    // page holds text its file does not, the slide is drawn from that text (acts/live.svelte.ts),
    // except while the presenter screen is on. The pane's status line, at the end of the toolbar,
    // says what an act came to, an arranging act's included.
    //
    // Over a wallpaper the slide's frame is the one surface under the slide (screen/Stage.svelte),
    // the overview's tiles are cards, and the empty line is read off a `Surface`.

    import Empty from '$lib/ui/frame/Empty.svelte';
    import Pane from '$lib/ui/frame/Pane.svelte';
    import ContextMenu from '$lib/ui/menu/ContextMenu.svelte';
    import AskConfirm from '$lib/views/shared/writes/AskConfirm.svelte';
    import Bar from './Bar.svelte';
    import { createActs } from './acts/acts.svelte';
    import { createFilter } from './acts/filter.svelte';
    import { createDrawn } from './acts/live.svelte';
    import { slideMenu } from './acts/menu';
    import { createPresentation } from './acts/presentation.svelte';
    import Overview from './arrange/Overview.svelte';
    import Presenter from './presenter/Presenter.svelte';
    import { createFullscreen } from './screen/fullscreen.svelte';
    import { createBoxKeys } from './screen/box';
    import Framed from './screen/Framed.svelte';
    import { cardCursor, tabsOf } from '$lib/state/workbench/layout/instance';
    import {
        deckChoices,
        deckRefOf,
        deckState,
        deckLabel,
        indexOf,
        labelOf,
        leftDeck,
        nothingToShow,
        pageDrafts,
        parsePresentState,
        sameDeck,
        slideAt,
        stepKey,
        tabDeck,
        withLabel,
        type DeckRef,
        type PresentState
    } from '$lib/state/life/present';
    import { t } from '$lib/state/shared/words/text';
    import { useShown, useState } from '$lib/state/client/use';
    import type { ViewProps } from '$lib/state/workbench/navigation/registry';

    const {
        desktop,
        explorer,
        layout: { holding, hosts, openBeside, pointInstance, restateInstance },
        paletteSource: { offer, withdraw },
        present: { portfolio, presenting, projectDecks, shown: shownDeck },
        source: { reloadSource, sourceDirty, sourceDraft },
        ui: { instanceState, setInstanceState },
        writes: { writeDeckEdit }
    } = useState();

    let { instance }: ViewProps = $props();

    const tabShown = useShown();

    let box = $state<HTMLElement | null>(null);

    const held = $derived(parsePresentState(instanceState(instance.id)));
    const ref = $derived(shownDeck(deckRefOf(instance.state)));
    const filter = createFilter({
        ref: () => ref,
        instance: () => instance.id,
        slide: () => held.slide,
        write: (changes) => write(changes)
    });
    const answer = $derived(filter.answer());
    const filesDeck = $derived(answer?.deck ?? null);

    /** The unsaved text of the source tabs of this pane's page, which the slide is drawn from. */
    const drafts = $derived(
        pageDrafts(
            tabsOf(holding(instance.id)?.workbench.root ?? { kind: 'pane', tabs: [], active: '' }),
            sourceDraft
        )
    );
    /** Whether this pane shows the presenter screen, which draws the deck as the files hold it. */
    const presented = $derived(presenting.on(instance.id));
    const drawnDeck = createDrawn({
        ref: () => ref,
        instance: () => instance.id,
        presented: () => presented,
        drafts: () => drafts,
        keep: filter.keep,
        files: () => filesDeck
    });
    const deck = $derived(drawnDeck());
    const rows = $derived(deck?.slides ?? []);
    const shown = $derived(slideAt(rows, held.slide));
    const at = $derived(indexOf(rows, held.slide));
    const next = $derived(rows.at(at + 1) ?? null);
    const grid = $derived(held.overview);

    const screen = createFullscreen({
        box: () => box,
        showable: () => tabShown() && rows.length > 0
    });
    const full = $derived(screen.full());
    const resting = $derived(screen.resting());

    const acts = createActs({
        instance: () => instance.id,
        ref: () => ref,
        deck: () => deck,
        saved: () => filesDeck,
        keep: filter.keep,
        facts: () => held.facts,
        shown: () => shown,
        grid: () => grid,
        write: writeDeckEdit,
        bridge: desktop?.bridge,
        upload: explorer.upload,
        openTab: (address) => window.open(address, '_blank'),
        openBeside,
        reread: (place) => {
            const folder = `${place.root}/${place.path}/`;
            for (const tab of hosts().flatMap((host) => tabsOf(host.workbench.root))) {
                if (tab.view !== 'source' || sourceDirty(tab.id)) continue;
                if (sourceDraft(tab.id).file.startsWith(folder)) void reloadSource(tab.id);
            }
        },
        show: (key) => write({ slide: key }),
        offer,
        withdraw
    });
    /** The shell's card cursor, which the overview grid's tiles carry as every card list does. */
    const cursor = $derived(cardCursor(instance.state));

    /**
     * Keep the pane's own place with the instance, so the pane is where it was when its page comes
     * back.
     */
    function write(changes: Partial<PresentState>): void {
        setInstanceState(instance.id, { ...held, ...changes });
    }

    const present = createPresentation({
        instance: () => instance.id,
        ref: () => ref,
        presented: () => presented,
        shown: () => shown,
        rows: () => rows,
        files: () => filesDeck,
        keepFor: filter.keepFor,
        focus: () => box?.focus()
    });

    /** The deck menu: the deck on screen, the portfolio deck, the projects' decks, recent ones. */
    const choices = $derived(
        deckChoices(
            ref !== null && deck !== null ? { ref, deck } : null,
            portfolio(),
            projectDecks(),
            held.recent,
            t
        )
    );

    /** The menu's id for the deck on screen. */
    const chosen = $derived(
        choices.find((one) => ref !== null && sameDeck(one.ref, ref))?.id ?? ''
    );

    /**
     * End the pane's presentation if it runs, then point the pane at another deck, remembering the
     * one it leaves, or bring forward the tab that already shows it. The deck is named in the
     * tab's layout state, as an opener names it (layout/open/show.ts), and the place in it is the
     * pane's.
     */
    function open(target: DeckRef): void {
        presenting.end(instance.id);
        if (!pointInstance(instance.id, deckState(instance.state, tabDeck(target, portfolio())))) {
            return;
        }
        setInstanceState(instance.id, leftDeck(held, ref, target));
        box?.focus();
    }

    function choose(id: string): void {
        const found = choices.find((one) => one.id === id);
        if (found !== undefined) open(found.ref);
    }

    // The tab is named by the deck it shows, as a source tab is by its file.
    $effect(() => {
        const label = deck === null ? '' : deckLabel(deck);
        if (label !== '' && labelOf(instance.state) !== label) {
            restateInstance(instance.id, withLabel(instance.state, label));
        }
    });

    /** What a deck that draws nothing says, and whether it is a failure. */
    const nothing = $derived(nothingToShow(ref, answer, t));

    // The box is what the keys are bound to, so it takes the focus as soon as it exists: a reader
    // who opens the deck from the rail presses an arrow next, not a control. It never takes the
    // keyboard from a control the reader is typing in or from another pane the reader is inside: a
    // page switch mounts every view of the page again, and the deck is not what they were doing.
    $effect(() => {
        if (box === null) return;
        const active = document.activeElement;
        const held =
            active !== null &&
            active !== document.body &&
            !box.contains(active) &&
            (active.closest('[data-pane-page]') !== null ||
                active instanceof HTMLInputElement ||
                active instanceof HTMLTextAreaElement);
        if (!held) box.focus();
    });

    /**
     * Move, and put the keys in force, so the next arrow key reaches this pane and not the shell.
     */
    function step(by: number): void {
        write({ slide: stepKey(rows, held.slide, by) });
        box?.focus();
    }

    const { keys, focusLeft, advance, boxClicked } = createBoxKeys({
        box: () => box,
        rows: () => rows,
        slide: () => held.slide,
        shown: () => shown,
        grid: () => grid,
        full: () => full,
        presented: () => presented,
        cursor: () => cursor !== null,
        write,
        toggleFull: screen.toggle,
        leaveFull: screen.leave,
        present: () => present(),
        endPresenting: () => presenting.end(instance.id)
    });

    /** Show a slide picked in the grid, and close the grid over it. */
    function pick(key: string): void {
        write({ slide: key, overview: false });
        box?.focus();
    }
</script>

{#snippet bar()}
    <Bar
        {choices}
        {chosen}
        onchoose={choose}
        count={rows.length}
        at={rows.length === 0 ? 0 : at + 1}
        overview={grid}
        facts={shown?.project === undefined ? null : held.facts}
        onfacts={() => {
            write({ facts: !held.facts });
            box?.focus();
        }}
        {full}
        onstep={step}
        onoverview={() => {
            write({ overview: !grid });
            box?.focus();
        }}
        onpresent={screen.toggle}
        presenting={presented}
        onpresenter={present}
        onexport={acts.exportPdf}
        said={acts.said()}
        filter={filter.bar()}
    />
{/snippet}

<svelte:document onfullscreenchange={screen.sync} />

<Pane title={t('present.title')} {bar}>
    <!-- The box is the deck's own key surface: it is focusable and named as a region, and the keys
         it takes move the reader through the deck rather than acting on the box itself. -->
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <div
        class="present"
        class:framed={!grid && shown !== null}
        class:resting
        data-instance={instance.id}
        data-slide-key={shown?.key ?? ''}
        role="region"
        aria-label={t('present.title')}
        tabindex="-1"
        bind:this={box}
        onkeydown={keys}
        onfocusout={focusLeft}
        onpointerdown={() => box?.focus()}
        onpointermove={screen.rouse}
        onclick={boxClicked}
        ondragover={(event: DragEvent) => acts.carriesFiles(event) && event.preventDefault()}
        ondrop={acts.dropped}
    >
        {#if deck === null || (rows.length === 0 && deck.order.length === 0 && deck.groups.length === 0)}
            <Empty
                message={nothing.message}
                error={nothing.error}
                glyph={t('present.empty_glyph')}
            />
        {:else if grid || shown === null}
            <Overview
                {deck}
                saved={filesDeck}
                {ref}
                facts={held.facts}
                current={shown?.key ?? ''}
                {cursor}
                onpick={pick}
                onact={acts.act}
                say={acts.say}
            />
        {:else if shown !== null}
            <ContextMenu
                label={t('present.menu_label')}
                items={slideMenu(deck, shown)}
                onpick={(id: string) => acts.act(id, shown)}
            >
                {#if presented}
                    <Presenter
                        row={shown}
                        {next}
                        {deck}
                        facts={held.facts}
                        at={at + 1}
                        count={rows.length}
                        timer={presenting.timer(instance.id)}
                        onadvance={advance}
                        onpause={() => presenting.pause(instance.id)}
                        onresume={() => presenting.resume(instance.id)}
                        onreset={() => presenting.reset(instance.id)}
                        onend={() => presenting.end(instance.id)}
                    />
                {:else}
                    <Framed row={shown} {deck} facts={held.facts} bare={full} />
                {/if}
            </ContextMenu>
        {/if}
    </div>
</Pane>

<AskConfirm asking={acts.asking()} onclose={acts.closeQuestion} />

<style>
    .present {
        min-height: 100%;
        outline: none;
    }

    /* A slide fills the pane's body and is centred in it; what is not the frame's is letterbox. */
    .present.framed {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        overflow: hidden;
    }

    /* In full screen the box is the screen, drawn on the page's background colour, which stands in
       for the wallpaper the shell draws outside the box. What is taller than the screen scrolls,
       and the frame goes edge to edge, centred, with no border and no corner. */
    .present:fullscreen {
        background: var(--bg);
        overflow: auto;
        padding: 10px 12px;
    }

    .present.framed:fullscreen {
        overflow: hidden;
        padding: 0;
    }

    /* A pointer that has rested in full screen is hidden over every part of the box. */
    .present.resting,
    .present.resting :global(*) {
        cursor: none;
    }
</style>
