<script lang="ts">
    // Layer 3, shell. The debug toolbar: Continue, Step Over, Step Into, Step Out, Finish Frame,
    // Restart and Stop in a strip that floats over the top of the workbench while a session is
    // starting, running or paused and goes when it ends. A step and a continue are drawn off
    // unless the program is paused. The strip is dragged along the top edge by its grip, on
    // interactjs as a float is (shell/panes/floats/float-gesture.ts), and the place it is let go
    // at is kept in the debug store's record, so the next session draws it there; before it was
    // ever moved it is centred. A view cannot draw over the workbench, which is why this is a
    // shell part and not part of the Debug view.

    import interactjs from 'interactjs';
    import type { Attachment } from 'svelte/attachments';
    import Glyph from '$lib/ui/display/Glyph.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';

    /** The calls made on an interactable: its options and its removal. */
    type Interactable = {
        draggable: (options: {
            allowFrom: string;
            listeners: {
                start: () => void;
                move: (event: { clientX: number; clientX0: number }) => void;
                end: () => void;
            };
        }) => Interactable;
        styleCursor: (on: boolean) => Interactable;
        unset: () => void;
    };

    const interact = interactjs as unknown as (target: HTMLElement) => Interactable;

    const { debug } = useState();

    const drawn = $derived(debug.active());
    const paused = $derived(debug.paused());
    const saved = $derived(debug.toolbar());

    /** Where the strip is while it is being dragged, null otherwise. */
    let live: number | null = $state(null);

    /** The strip's left edge in pixels, or null while it is centred. */
    const left = $derived(live ?? saved);

    /** The strip kept inside the window. */
    function clamped(x: number, node: HTMLElement): number {
        return Math.max(0, Math.min(x, window.innerWidth - node.offsetWidth));
    }

    const dragging: Attachment<HTMLElement> = (node) => {
        let from = 0;
        const target = interact(node)
            .draggable({
                allowFrom: '[data-grip]',
                listeners: {
                    start: () => {
                        from = node.getBoundingClientRect().left;
                    },
                    move: (event) => {
                        live = clamped(from + event.clientX - event.clientX0, node);
                    },
                    end: () => {
                        if (live !== null) debug.moveToolbar(live);
                        live = null;
                    }
                }
            })
            .styleCursor(false);
        return () => target.unset();
    };
</script>

{#if drawn}
    <div
        class="toolbar"
        class:centred={left === null}
        style:left={left === null ? undefined : `${left}px`}
        role="toolbar"
        aria-label={t('debug.toolbar')}
        data-debug-toolbar
        {@attach dragging}
    >
        <span class="grip" data-grip aria-hidden="true"><Glyph name="grip" /></span>
        <ToolButton
            label={t('debug.continue')}
            glyph="debug_start"
            compact
            disabled={!paused}
            onclick={() => void debug.resume('continue')}
        />
        <ToolButton
            label={t('debug.step_over')}
            glyph="debug_over"
            compact
            disabled={!paused}
            onclick={() => void debug.resume('next')}
        />
        <ToolButton
            label={t('debug.step_into')}
            glyph="debug_into"
            compact
            disabled={!paused}
            onclick={() => void debug.resume('stepIn')}
        />
        <ToolButton
            label={t('debug.step_out')}
            glyph="debug_out"
            compact
            disabled={!paused}
            onclick={() => void debug.resume('stepOut')}
        />
        <ToolButton
            label={t('debug.finish_frame')}
            glyph="debug_finish"
            compact
            disabled={!paused}
            onclick={() => void debug.resume('finishFrame')}
        />
        <ToolButton
            label={t('debug.restart')}
            glyph="debug_restart"
            compact
            onclick={() => void debug.restart()}
        />
        <ToolButton
            label={t('debug.stop')}
            glyph="debug_stop"
            compact
            onclick={() => void debug.stop()}
        />
    </div>
{/if}

<style>
    .toolbar {
        position: fixed;
        top: 6px;
        z-index: 40;
        display: flex;
        align-items: center;
        gap: 2px;
        padding: 2px 6px 2px 2px;
        border: 1px solid var(--line);
        border-radius: var(--radius-sm);
        background: var(--card);
        box-shadow: var(--shadow);
        touch-action: none;
    }

    .toolbar.centred {
        left: 50%;
        transform: translateX(-50%);
    }

    :global(body.wall) .toolbar {
        background: color-mix(in srgb, var(--card) var(--wall-popover), transparent);
        backdrop-filter: blur(var(--wall-blur));
    }

    .grip {
        display: flex;
        align-items: center;
        padding: 0 2px;
        color: var(--muted-txt, var(--muted));
        cursor: grab;
    }
</style>
