<script lang="ts">
    // Layer 3, primitive. A compact disclosure control on the same surface as a Chip. It keeps the
    // count, label and open state separate so grouped links read as a group rather than an action.
    // A control handed a hue (`tone`) draws its count, its label and its marker in that hue's text
    // colour, as a group's heading is drawn in its category's colour
    // (ui/controls/heads/GroupHead.svelte); one handed none draws them in the muted text colour.

    import Glyph from '../display/Glyph.svelte';

    type Props = {
        count: number;
        label: string;
        expanded: boolean;
        onclick: (event: MouseEvent) => void;
        /** A hue name the control's words are drawn in, or nothing for the muted colour. */
        tone?: string;
    };

    let { count, label, expanded, onclick, tone }: Props = $props();
</script>

<button
    type="button"
    class="disclosure"
    class:open={expanded}
    aria-expanded={expanded}
    style={tone === undefined ? undefined : `--disclosure-tone: var(--c-${tone}-txt)`}
    {onclick}
>
    <strong class="count">{count}</strong>
    <span class="label">{label}</span>
    <span class="marker">
        <Glyph name="disclosure" />
    </span>
</button>

<style>
    .disclosure {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        box-sizing: border-box;
        min-height: calc(18px * var(--text-scale, 1));
        padding: 3px 5px;
        border: 1px solid var(--line);
        border-radius: var(--radius-pill);
        background: var(--chip);
        /* The hue the control is handed, its own property so a hue an enclosing card or chip sets
           does not reach it. */
        color: var(--disclosure-tone, var(--muted-txt, var(--muted)));
        font: inherit;
        font-size: var(--fs-xs);
        line-height: calc(11px * var(--text-scale, 1));
        cursor: pointer;
        white-space: nowrap;
    }

    .disclosure:hover {
        border-color: var(--accent);
    }

    .disclosure:focus-visible {
        outline: 1px solid var(--accent);
        outline-offset: -1px;
    }

    /* The 16 px marker is taller than the 11 px line; its margin gives the room back, so the pill
       is as high as a Chip. */
    .marker {
        display: inline-flex;
        margin: calc(-3px * var(--text-scale, 1)) 0;
        transition: transform 120ms ease;
    }

    .open .marker {
        transform: rotate(180deg);
    }

    :global(body.rice) .disclosure {
        padding: 1px 0;
        border: 0;
        background: none;
    }
</style>
