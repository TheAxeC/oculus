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
    // the toolbar to move through it, `O` for the grid of the whole deck, and the Present control
    // or `F` for the slide on the whole monitor.
    //
    // A slide is drawn in a frame of 1280 by 720 px, the size its parts are laid out for, scaled
    // uniformly by `fit` to the pane and centred in it, so a slide keeps its proportions and its
    // words shrink or grow with the pane as a slide program's do. The frame draws its own surface
    // (the card colour, translucent over a wallpaper) and carries the slide type scale, in px at
    // the design size and multiplied by the text size. A slide taller than the frame scrolls
    // inside it. The overview grid and the empty state are not scaled and keep the UI's tokens.
    //
    // The deck is not a file this builds and it is not a copy of one: the deck-level slides are
    // config/present.yml and the project slides are the PRESENT.md front matter the snapshot
    // carries, so a slide edited on disk is the slide on screen at the next push.
    //
    // Where the reader is, and whether the grid is open, belong to the instance rather than to the
    // store, so two panes on the deck hold two positions and a push that rebuilds the deck leaves
    // each reader where they were. The instance's `slide` is the same key a project card sets.
    //
    // The keys are the pane's own, bound to the view's box rather than to the window: the shell
    // owns the digits and the chords, and a deck that swallowed an arrow key wherever the reader
    // was looking would take the pane strip's own keys with it. The box takes the focus when the
    // view is mounted and on a press inside it, so the arrows work from the moment the deck is
    // opened. The keys are the arrows, Page Up and Page Down, Home and End, Space (the next slide,
    // Shift+Space the previous one), `O` for the grid, `F` for full screen and Escape to close the
    // grid.
    //
    // Full screen is the box's own: the browser draws the box alone, so the rail, the tabs and the
    // toolbar are gone with no change to the shell, and leaving it puts the pane back as it was.
    // Whether this box is the full-screen element is read from the document on every
    // `fullscreenchange`, so a way out the page does not control (a browser tab's Esc, the app
    // window's menu) is seen too. In full screen the box fills the screen on the page's background
    // colour with the frame centred and edge to edge, a click on the slide moves to the next one,
    // and the pointer hides after it has rested. The box leaves full screen when its tab is hidden,
    // when the deck holds no slides and when the view unmounts, so a full screen never shows a
    // hidden or an empty box. In full screen the shell's keys are held back, since what they open
    // is drawn outside the box: the deck's keys, the card cursor's keys over the grid and Enter on
    // a control act, Tab wraps inside the box, and the focus leaving for an element outside the
    // box (a modified key such as Cmd+Shift+F) ends the full screen.

    import Empty from '$lib/ui/frame/Empty.svelte';
    import Pane from '$lib/ui/frame/Pane.svelte';
    import Chip from '$lib/ui/controls/Chip.svelte';
    import Toolbar from '$lib/ui/frame/toolbar/Toolbar.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import Overview from './Overview.svelte';
    import Slide from './Slide.svelte';
    import { cardCursor } from '$lib/state/workbench/layout/instance';
    import {
        FRAME_HEIGHT,
        FRAME_WIDTH,
        fit,
        parsePresentState,
        type PresentState
    } from '$lib/state/life/present';
    import { t } from '$lib/state/shared/words/text';
    import { useShown, useState } from '$lib/state/client/use';
    import type { ViewProps } from '$lib/state/workbench/navigation/registry';

    const {
        layout: { openBeside },
        present: { current, first, last, next, position, previous, slides },
        ui: { instanceState, setInstanceState }
    } = useState();

    let { instance }: ViewProps = $props();

    /** How long the pointer rests over the box in full screen before it is hidden. */
    const POINTER_REST_MS = 2000;

    /** What a press or a click inside the slide is left to: the control's own action. */
    const CONTROLS =
        'a[href], button, input, select, textarea, summary, [contenteditable], [role="button"], [role="link"]';

    /** What Tab stops at inside the box in full screen. */
    const FOCUSABLE = `${CONTROLS}, [tabindex]`;

    /** The card cursor's keys, which act on the overview grid's tiles inside the box. */
    const GRID_KEYS = new Set(['j', 'k', 'i', 'J', 'K', 'ArrowUp', 'ArrowDown']);

    const tabShown = useShown();

    let box = $state<HTMLElement | null>(null);

    /** Whether this box is the document's full-screen element. */
    let full = $state(false);
    /** Whether the pointer has rested long enough in full screen to be hidden. */
    let resting = $state(false);
    let restTimer: ReturnType<typeof setTimeout> | undefined;
    /** Whether a full-screen request is on its way, so a second press does not ask again. */
    let entering = false;
    /** Whether the view has gone, so a request that resolves after it leaves again. */
    let unmounted = false;

    /** The deck box's measured size, 0 until it has been laid out and while its tab is hidden. */
    let width = $state(0);
    let height = $state(0);
    const scale = $derived(fit(width, height));

    const held = $derived(parsePresentState(instanceState(instance.id)));
    const rows = $derived(slides());
    const shown = $derived(current(held.slide));
    const grid = $derived(held.overview);
    /** The shell's card cursor, which the overview grid's tiles carry as every card list does. */
    const cursor = $derived(cardCursor(instance.state));

    /**
     * Keep the pane's own place with the instance, so the pane is where it was when its page comes
     * back.
     */
    function write(changes: Partial<PresentState>): void {
        setInstanceState(instance.id, { ...held, ...changes });
    }

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

    /** A refused or superseded full-screen request leaves the pane as it is. */
    const ignore = (): undefined => undefined;

    function enterFull(): void {
        if (box === null || entering) return;
        const element = box;
        entering = true;
        element
            .requestFullscreen()
            .then(() => {
                if (unmounted && document.fullscreenElement === element) {
                    document.exitFullscreen().catch(ignore);
                }
            })
            .catch(ignore)
            .finally(() => (entering = false));
    }

    function leaveFull(): void {
        if (box !== null && document.fullscreenElement === box) {
            document.exitFullscreen().catch(ignore);
        }
    }

    function toggleFull(): void {
        if (box !== null && document.fullscreenElement === box) leaveFull();
        else enterFull();
    }

    /** Follow the document's full-screen element; the box takes the focus when it becomes it. */
    function syncFull(): void {
        full = box !== null && document.fullscreenElement === box;
        if (full) box?.focus();
    }

    /** The pointer moved over the box: show it, and hide it again once it has rested. */
    function rouse(): void {
        clearTimeout(restTimer);
        resting = false;
        if (full) restTimer = setTimeout(() => (resting = true), POINTER_REST_MS);
    }

    // The pointer's rest starts when full screen is entered, whether or not the pointer moves, and
    // ends with it.
    $effect(() => {
        if (full) rouse();
        else {
            clearTimeout(restTimer);
            resting = false;
        }
        return () => clearTimeout(restTimer);
    });

    // A full screen never outlives what it shows: a hidden tab, an empty deck or the view going.
    $effect(() => {
        if (full && (!tabShown() || rows.length === 0)) leaveFull();
    });

    $effect(() => {
        const element = box;
        if (element === null) return;
        return () => {
            unmounted = true;
            if (document.fullscreenElement === element) document.exitFullscreen().catch(ignore);
        };
    });

    /**
     * Move, and put the keys in force, so the next arrow key reaches this pane and not the shell.
     */
    function step(by: number): void {
        write({ slide: by > 0 ? next(held.slide) : previous(held.slide) });
        box?.focus();
    }

    function keys(event: KeyboardEvent): void {
        if (event.altKey || event.ctrlKey || event.metaKey) return;
        switch (event.key) {
            case 'ArrowRight':
            case 'PageDown':
                event.preventDefault();
                write({ slide: next(held.slide) });
                return;
            case 'ArrowLeft':
            case 'PageUp':
                event.preventDefault();
                write({ slide: previous(held.slide) });
                return;
            case 'Home':
                event.preventDefault();
                write({ slide: first() });
                return;
            case 'End':
                event.preventDefault();
                write({ slide: last() });
                return;
            case 'o':
            case 'O':
                event.preventDefault();
                write({ overview: !grid });
                return;
            case 'f':
            case 'F':
                if (rows.length === 0) return;
                event.preventDefault();
                if (!event.repeat) toggleFull();
                return;
            case ' ':
                if (inControl(event.target)) return;
                event.preventDefault();
                if (!event.repeat)
                    write({ slide: event.shiftKey ? previous(held.slide) : next(held.slide) });
                return;
            case 'Escape':
                if (!grid) return;
                event.preventDefault();
                write({ overview: false });
                return;
            case 'Tab':
                if (full) keepTab(event);
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

    /** Tab and Shift+Tab move through the slide's controls and wrap inside the box. */
    function keepTab(event: KeyboardEvent): void {
        if (box === null) return;
        const stops = [...box.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
            (element) => element.tabIndex >= 0 && element.getClientRects().length > 0
        );
        const at = document.activeElement;
        const first = stops.at(0);
        const final = stops.at(-1);
        if (first === undefined || final === undefined) {
            event.preventDefault();
            return;
        }
        if (event.shiftKey && (at === first || at === box)) {
            event.preventDefault();
            final.focus();
        } else if (!event.shiftKey && at === final) {
            event.preventDefault();
            first.focus();
        }
    }

    /** In full screen the focus leaving for an element outside the box ends the full screen. */
    function focusLeft(event: FocusEvent): void {
        const to = event.relatedTarget;
        if (full && box !== null && to instanceof Node && !box.contains(to)) leaveFull();
    }

    /** In full screen a click on the slide, or on the letterbox around it, shows the next one. */
    function advance(event: MouseEvent): void {
        if (!full || grid || shown === null || inControl(event.target)) return;
        if (window.getSelection()?.isCollapsed === false) return;
        write({ slide: next(held.slide) });
    }

    /** Show a slide picked in the grid, and close the grid over it. */
    function pick(key: string): void {
        write({ slide: key, overview: false });
        box?.focus();
    }
</script>

{#snippet bar()}
    <Toolbar label={t('present.toolbar')}>
        <ToolButton
            label={t('present.previous')}
            onclick={() => step(-1)}
            disabled={rows.length === 0}
        />
        <ToolButton
            label={t('present.next')}
            onclick={() => step(1)}
            disabled={rows.length === 0}
        />
        <Chip
            label={t('present.overview')}
            glyph={t('present.overview_glyph')}
            pressed={grid}
            onclick={() => {
                write({ overview: !grid });
                box?.focus();
            }}
        />
        <ToolButton
            label={t('present.present')}
            title={rows.length === 0 ? t('present.empty') : t('present.present_tip')}
            pressed={full}
            active={full}
            onclick={toggleFull}
            disabled={rows.length === 0}
        />
        <ToolButton
            label={t('slides.open')}
            title={t('slides.open_tip')}
            onclick={() => {
                openBeside('slides');
            }}
        />
        <span class="counter"
            >{t('present.counter', String(position(held.slide)), String(rows.length))}</span
        >
    </Toolbar>
{/snippet}

<svelte:document onfullscreenchange={syncFull} />

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
        bind:clientWidth={width}
        bind:clientHeight={height}
        onkeydown={keys}
        onfocusout={focusLeft}
        onpointerdown={() => box?.focus()}
        onpointermove={rouse}
        onclick={advance}
    >
        {#if rows.length === 0}
            <Empty message={t('present.empty')} glyph={t('present.empty_glyph')} />
        {:else if grid}
            <Overview {rows} current={shown?.key ?? ''} {cursor} onpick={pick} />
        {:else if shown !== null}
            <div
                class="stage"
                style:width="{FRAME_WIDTH * scale}px"
                style:height="{FRAME_HEIGHT * scale}px"
            >
                <div
                    class="frame"
                    data-frame
                    data-scroll
                    style:width="{FRAME_WIDTH}px"
                    style:height="{FRAME_HEIGHT}px"
                    style:transform="scale({scale})"
                    style:visibility={scale === 0 ? 'hidden' : undefined}
                >
                    <Slide row={shown} />
                </div>
            </div>
        {/if}
    </div>
</Pane>

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

    .present:fullscreen .frame {
        border: none;
        border-radius: 0;
    }

    /* A pointer that has rested in full screen is hidden over every part of the box. */
    .present.resting,
    .present.resting :global(*) {
        cursor: none;
    }

    /* The box the scaled frame occupies on screen: the frame's transform does not change its layout
       size, so this box is the one that takes room. */
    .stage {
        flex: 0 0 auto;
    }

    /* The frame is laid out at the design size and scaled from its top left corner. The slide
       type scale is in px at that size and follows the text size; the padding and the reading
       width are px of the frame too. */
    .frame {
        --slide-fs-title: calc(56px * var(--text-scale, 1));
        --slide-fs-h: calc(36px * var(--text-scale, 1));
        --slide-fs-sub: calc(28px * var(--text-scale, 1));
        --slide-fs-body: calc(24px * var(--text-scale, 1));
        --slide-fs-small: calc(18px * var(--text-scale, 1));
        --slide-reading: 1040px;
        box-sizing: border-box;
        padding: 64px;
        overflow-y: auto;
        transform-origin: 0 0;
        border: 1px solid var(--line);
        border-radius: var(--radius);
        background: var(--card);
        color: var(--ink-txt, var(--ink));
        font-size: var(--slide-fs-body);
    }

    /* Over a wallpaper the surface goes translucent, as every other card surface does. */
    :global(body.wall) .frame {
        background: color-mix(in srgb, var(--card) var(--wall-panel), transparent);
        backdrop-filter: blur(var(--wall-blur));
    }

    /* The place in the deck closes the bar. */
    .counter {
        margin-left: auto;
        color: var(--muted-txt, var(--muted));
        font-family: var(--font-num);
        font-size: var(--fs-sm);
    }
</style>
