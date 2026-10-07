<script lang="ts">
    // Layer 3, view partial of the file view. One control the PDF viewer draws inside its own DOM
    // (viewer.svelte.ts, side-panel.ts): the note's Retry and Build buttons, an outline entry, a
    // thumbnail. The viewer is plain DOM in a box the frame layer holds, so it mounts this
    // component with Svelte's `mount` where it needs a control, and the control is the ui/
    // primitive the rest of the page uses. The mounted tree has no parent component to inherit the
    // page's tooltip group and tooltip counter from, so this draws the group and provides the
    // counter it was given.

    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import TooltipGroup from '$lib/ui/menu/TooltipGroup.svelte';
    import { provideTipIds, type TipIds } from '$lib/ui/menu/tip-ids';

    type Props = {
        /** What the control is: a button of the note, an entry of the outline, or a thumbnail. */
        kind: 'button' | 'entry' | 'thumb';
        /** The words: the button's, the entry's title, or the thumbnail's page number. */
        label: string;
        /** The page's tooltip counter. */
        tips: TipIds;
        onclick: () => void;
        /** An outline entry drawn bold or italic by its document. */
        bold?: boolean;
        italic?: boolean;
        /** The width and height of a thumbnail's canvas in CSS pixels. */
        width?: number;
        height?: number;
        /** Called once with the function that marks a thumbnail as the page the viewer shows. */
        ready?: (mark: (on: boolean) => void) => void;
    };

    let {
        kind,
        label,
        tips,
        onclick,
        bold = false,
        italic = false,
        width,
        height,
        ready
    }: Props = $props();

    // The tooltip counter is provided once, when the control is made.
    // svelte-ignore state_referenced_locally
    provideTipIds(tips);

    let current = $state(false);

    // svelte-ignore state_referenced_locally
    ready?.((on) => {
        current = on;
    });
</script>

<TooltipGroup>
    {#if kind === 'button'}
        <ToolButton {label} {onclick} />
    {:else if kind === 'entry'}
        <span class="row">
            <ToolButton {label} {onclick} cell>
                <span class="entry" class:bold class:italic>{label}</span>
            </ToolButton>
        </span>
    {:else}
        <ToolButton {label} {onclick} cell {current}>
            <span class="thumb">
                <canvas {width} {height}></canvas>
                <span>{label}</span>
            </span>
        </ToolButton>
    {/if}
</TooltipGroup>

<style>
    .entry {
        display: block;
        border-radius: var(--radius-sm);
        padding: 2px 4px;
        text-align: left;
        overflow-wrap: anywhere;
        white-space: normal;
    }

    .row {
        display: block;
    }

    .row:hover .entry,
    .row:has(:focus-visible) .entry {
        background: var(--accent-bg);
    }

    .bold {
        font-weight: 700;
    }

    .italic {
        font-style: italic;
    }

    .thumb {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 2px;
        padding: 4px;
        font-size: var(--fs-sm);
    }

    canvas {
        display: block;
        background: var(--pdf-paper);
    }
</style>
