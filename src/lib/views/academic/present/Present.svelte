<script module lang="ts">
    // Layer 3, view registration. Present closes the Academic life group, after the collections.
    import type { ViewRegistration } from '$lib/state/workbench/navigation/registry';

    export const registration: ViewRegistration = {
        id: 'present',
        label: 'views.present',
        glyph: 'views.present_glyph',
        group: 'academic',
        order: 6
    };
</script>

<script lang="ts">
    // Layer 3, view. The public slide deck, live: one slide filling the pane, the arrow keys and
    // the toolbar to move through it, and `O` for the grid of the whole deck.
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
    // opened.

    import Empty from '$lib/ui/frame/Empty.svelte';
    import Pane from '$lib/ui/frame/Pane.svelte';
    import Toolbar from '$lib/ui/frame/Toolbar.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import Overview from './Overview.svelte';
    import Slide from './Slide.svelte';
    import { cardCursor } from '$lib/state/workbench/layout/instance';
    import { parsePresentState, type PresentState } from '$lib/state/feeds/life/present';
    import { t } from '$lib/state/words/text';
    import { useState } from '$lib/state/client/use';
    import type { ViewProps } from '$lib/state/workbench/navigation/registry';

    const {
        layout: { openBeside },
        present: { current, first, last, next, position, previous, slides },
        ui: { instanceState, setInstanceState }
    } = useState();

    let { instance }: ViewProps = $props();

    let box = $state<HTMLElement | null>(null);

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
            case 'Escape':
                if (!grid) return;
                event.preventDefault();
                write({ overview: false });
                return;
            default:
        }
    }

    /** Show a slide picked in the grid, and close the grid over it. */
    function pick(key: string): void {
        write({ slide: key, overview: false });
        box?.focus();
    }
</script>

{#snippet tools()}
    <Toolbar label={t('present.toolbar')}>
        <span class="counter"
            >{t('present.counter', String(position(held.slide)), String(rows.length))}</span
        >
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
        <ToolButton
            label={t('present.overview')}
            glyph={t('present.overview_glyph')}
            pressed={grid}
            onclick={() => {
                write({ overview: !grid });
                box?.focus();
            }}
        />
        <ToolButton
            label={t('slides.open')}
            title={t('slides.open_tip')}
            onclick={() => {
                openBeside('slides');
            }}
        />
    </Toolbar>
{/snippet}

<Pane title={t('present.title')} toolbar={tools}>
    <!-- The box is the deck's own key surface: it is focusable and named as a region, and the keys
         it takes move the reader through the deck rather than acting on the box itself. -->
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <div
        class="present"
        data-instance={instance.id}
        data-slide-key={shown?.key ?? ''}
        role="region"
        aria-label={t('present.title')}
        tabindex="-1"
        bind:this={box}
        onkeydown={keys}
        onpointerdown={() => box?.focus()}
    >
        {#if rows.length === 0}
            <Empty message={t('present.empty')} glyph={t('present.empty_glyph')} />
        {:else if grid}
            <Overview {rows} current={shown?.key ?? ''} {cursor} onpick={pick} />
        {:else if shown !== null}
            <Slide row={shown} />
        {/if}
    </div>
</Pane>

<style>
    .present {
        min-height: 100%;
        outline: none;
    }

    .counter {
        color: var(--muted-txt, var(--muted));
        font-family: var(--font-num);
        font-size: var(--fs-xs);
    }
</style>
