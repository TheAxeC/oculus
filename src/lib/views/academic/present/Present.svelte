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
    // A slide is drawn in a frame of 1280 by 720 px, scaled uniformly to the pane and centred in it
    // (screen/Stage.svelte). The overview grid and the empty state are not scaled and keep the
    // UI's tokens.
    //
    // The deck is a folder the server reads (api/deck): `present.yml` and the Markdown slide files,
    // so a slide edited on disk is the slide on screen at the next push. A pane shows the portfolio
    // deck until it is pointed at another: a project's deck, a deck it has shown, or the one a
    // folder of the Files view opened it on. The deck menu in the toolbar lists them.
    //
    // Where the reader is, and whether the grid is open, belong to the instance rather than to the
    // store, so two panes on the deck hold two positions and a push that rebuilds the deck leaves
    // each reader where they were. The instance's `slide` is the key a slide of the deck carries.
    //
    // The keys are the pane's own, bound to the view's box rather than to the window: the shell
    // owns the digits and the chords, and a deck that swallowed an arrow key wherever the reader
    // was looking would take the pane strip's own keys with it. The box takes the focus when the
    // view is mounted and on a press inside it, so the arrows work from the moment the deck is
    // opened. The keys are the arrows, Page Up and Page Down, Home and End, Space (the next slide,
    // Shift+Space the previous one), `O` for the grid, `F` for full screen, `P` for the presenter
    // screen and Escape to close the grid, and then to end the presentation.
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
    // the deck's keys, the card cursor's keys over the grid and Enter on a control act, Tab wraps
    // inside the box, and the focus leaving for an element outside the box (a modified key such as
    // Cmd+Shift+F) ends the full screen.
    //
    // A slide has a menu on a right-click, on the slide and on its tile in the grid (acts/menu.ts):
    // Edit Slide, New Slide, Duplicate Slide and Delete Slide, which are also commands in the
    // palette for the slide on screen. An image dropped on a slide of the deck's own files is added
    // to it. While a source tab of the same page holds text its file does not, the slide is drawn
    // from that text (acts/live.svelte.ts), except while the presenter screen is on. The pane's
    // status line, at the end of the toolbar, says what an act came to.
    //
    // Over a wallpaper the slide's frame is the one surface under the slide (screen/Stage.svelte),
    // the overview's tiles are cards, and the empty line is read off a `Surface`.

    import Empty from '$lib/ui/frame/Empty.svelte';
    import Pane from '$lib/ui/frame/Pane.svelte';
    import ContextMenu from '$lib/ui/menu/ContextMenu.svelte';
    import AskConfirm from '$lib/views/shared/writes/AskConfirm.svelte';
    import Bar from './Bar.svelte';
    import { createActs } from './acts/acts.svelte';
    import { createLive } from './acts/live.svelte';
    import { slideMenu } from './acts/menu';
    import Overview from './Overview.svelte';
    import Presenter from './presenter/Presenter.svelte';
    import { createFullscreen } from './screen/fullscreen.svelte';
    import { CONTROLS, keepTab, moveOf } from './screen/keys';
    import Slide from './Slide.svelte';
    import Stage from './screen/Stage.svelte';
    import { cardCursor, tabsOf } from '$lib/state/workbench/layout/instance';
    import {
        deckChoices,
        deckRefOf,
        deckState,
        deckLabel,
        indexOf,
        labelOf,
        leftDeck,
        movedKey,
        nothingToShow,
        pageDrafts,
        parsePresentState,
        sameDeck,
        slideAt,
        stepKey,
        tabDeck,
        withLabel,
        type Deck,
        type DeckRef,
        type DeckSlide,
        type PresentState
    } from '$lib/state/life/present';
    import type { PresentLink } from '$lib/state/life/present.svelte';
    import { t } from '$lib/state/shared/words/text';
    import { useShown, useState } from '$lib/state/client/use';
    import type { ViewProps } from '$lib/state/workbench/navigation/registry';

    const {
        desktop,
        explorer,
        layout: { holding, hosts, openBeside, pointInstance, restateInstance },
        paletteSource: { offer, withdraw },
        present: { deck: deckOf, drawn, portfolio, presenting, projectDecks, shown: shownDeck },
        source: { reloadSource, sourceDirty, sourceDraft },
        ui: { instanceState, setInstanceState },
        writes: { writeDeckEdit }
    } = useState();

    let { instance }: ViewProps = $props();

    /** The card cursor's keys, which act on the overview grid's tiles inside the box. */
    const GRID_KEYS = new Set(['j', 'k', 'i', 'J', 'K', 'ArrowUp', 'ArrowDown']);

    const tabShown = useShown();

    let box = $state<HTMLElement | null>(null);

    const held = $derived(parsePresentState(instanceState(instance.id)));
    const ref = $derived(shownDeck(deckRefOf(instance.state)));
    const answer = $derived(ref === null ? null : deckOf(ref));
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
    const liveDeck = createLive({
        ref: () => ref,
        drafts: () => (presented ? [] : drafts),
        files: () => filesDeck,
        drawn
    });
    const deck = $derived(presented ? filesDeck : (liveDeck() ?? filesDeck));
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
        shown: () => shown,
        grid: () => grid,
        write: writeDeckEdit,
        bridge: desktop?.bridge,
        upload: explorer.upload,
        openTab: (address) => window.open(address, '_blank', 'noopener'),
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

    // While the presenter screen is on, the audience window is told which slide is on and when
    // the deck was read again, and the presentation ends with the deck's last slide gone.
    $effect(() => {
        if (presented && shown !== null) presenting.send(instance.id, shown.key);
    });
    let sentDeck: Deck | null = null;
    $effect(() => {
        const read = filesDeck;
        if (presented && sentDeck !== null && read !== sentDeck) presenting.changed(instance.id);
        sentDeck = read;
    });
    $effect(() => {
        if (presented && rows.length === 0) presenting.end(instance.id);
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

    /** Whether `target` is, or is inside, a control of the slide that acts on a press itself. */
    function inControl(target: EventTarget | null): boolean {
        if (!(target instanceof Element) || box === null) return false;
        const control = target.closest(CONTROLS);
        return control !== null && box.contains(control);
    }

    /**
     * Move, and put the keys in force, so the next arrow key reaches this pane and not the shell.
     */
    function step(by: number): void {
        write({ slide: stepKey(rows, held.slide, by) });
        box?.focus();
    }

    /** Start the presenter screen over the deck as saved, and the audience window beside it. */
    function present(): void {
        if (ref === null || rows.length === 0) return;
        const id = instance.id;
        const link: PresentLink = {
            current: () => parsePresentState(instanceState(id)).slide,
            show: (key) =>
                setInstanceState(id, { ...parsePresentState(instanceState(id)), slide: key }),
            held: () => holding(id) !== null
        };
        presenting.start(id, ref, link);
        box?.focus();
    }

    function keys(event: KeyboardEvent): void {
        if (event.altKey || event.ctrlKey || event.metaKey) return;
        const move = moveOf(event);
        if (move !== null && (event.key !== ' ' || !inControl(event.target))) {
            event.preventDefault();
            if (event.key !== ' ' || !event.repeat) {
                write({ slide: movedKey(rows, held.slide, move) });
            }
            return;
        }
        switch (event.key) {
            case 'o':
            case 'O':
                event.preventDefault();
                write({ overview: !grid });
                return;
            case 'f':
            case 'F':
                if (rows.length === 0) return;
                event.preventDefault();
                if (!event.repeat) screen.toggle();
                return;
            case 'p':
            case 'P':
                event.preventDefault();
                if (!event.repeat) present();
                return;
            case 'Escape':
                if (grid) {
                    event.preventDefault();
                    write({ overview: false });
                } else if (presented) {
                    event.preventDefault();
                    presenting.end(instance.id);
                }
                return;
            case ' ':
                // Space on a control of the slide acts on the control.
                return;
            case 'Tab':
                if (full && box !== null) keepTab(event, box);
                return;
            default:
                // A key the deck does not own is not left to the shell in full screen: its keys
                // open sheets, search and chords that are drawn outside the full-screen element,
                // so the keyboard would be lost with the slide in view. The card cursor's keys act
                // on the grid's tiles inside the box and pass while the grid is open, and a
                // control inside the slide keeps Enter, which activates it.
                if (!full) return;
                if (grid && GRID_KEYS.has(event.key)) return;
                if (event.key === 'Enter' && (inControl(event.target) || (grid && cursor !== null)))
                    return;
                event.preventDefault();
        }
    }

    /** In full screen the focus leaving for an element outside the box ends the full screen. */
    function focusLeft(event: FocusEvent): void {
        const to = event.relatedTarget;
        if (full && box !== null && to instanceof Node && !box.contains(to)) screen.leave();
    }

    /**
     * A click on the slide shows the next one: in full screen on the letterbox around it too, and
     * on the presenter screen on the current slide alone.
     */
    function advance(event: MouseEvent): void {
        if (grid || shown === null || inControl(event.target)) return;
        if (window.getSelection()?.isCollapsed === false) return;
        write({ slide: stepKey(rows, held.slide, 1) });
    }

    /** The click on the pane's box: in full screen it moves on, except on the presenter screen. */
    function boxClicked(event: MouseEvent): void {
        if (full && !presented) advance(event);
    }

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
        {full}
        onstep={step}
        onoverview={() => {
            write({ overview: !grid });
            box?.focus();
        }}
        onpresent={screen.toggle}
        presenting={presented}
        onpresenter={present}
        onslides={() => {
            openBeside('slides', deckState({}, deckRefOf(instance.state)));
        }}
        onexport={acts.exportPdf}
        said={acts.said()}
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
        {#if rows.length === 0 || deck === null}
            <Empty
                message={nothing.message}
                error={nothing.error}
                glyph={t('present.empty_glyph')}
            />
        {:else if grid}
            <Overview
                {rows}
                current={shown?.key ?? ''}
                {cursor}
                onpick={pick}
                menu={(row: DeckSlide) => slideMenu(deck, row)}
                onact={acts.act}
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
                    <Stage bare={full}>
                        <Slide row={shown} {deck} first={at === 0} />
                    </Stage>
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
