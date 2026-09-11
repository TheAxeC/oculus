<script lang="ts">
    // Layer 3, primitive. Several lines of text: the prose fields, and the list fields that are one
    // item per line. Like every control here it holds nothing of its own.

    type Props = {
        value: string;
        /** The box's accessible name, already translated by the view. */
        label: string;
        oninput: (value: string) => void;
        /** How tall it opens. It grows no further on its own; the box scrolls. */
        rows?: number;
        /**
         * A key pressed in the box, for a caller where a key means something other than a character:
         * the composer sends on Enter and recalls what it sent on the up arrow. The caller decides
         * whether the key still types, since only it knows.
         */
        onkeydown?: (event: KeyboardEvent) => void;
    };

    let { value, label, oninput, rows = 3, onkeydown }: Props = $props();

    function typed(event: Event): void {
        const field = event.currentTarget;
        if (field instanceof HTMLTextAreaElement) oninput(field.value);
    }
</script>

<textarea class="area" {rows} aria-label={label} oninput={typed} {onkeydown}>{value}</textarea>

<style>
    .area {
        width: 100%;
        box-sizing: border-box;
        min-width: 0;
        resize: vertical;
        border: 1px solid var(--line);
        border-radius: var(--radius-sm);
        background: var(--chip);
        color: var(--ink-txt, var(--ink));
        font: inherit;
        font-size: var(--fs-sm);
        padding: 3px 8px;
    }

    .area:focus-visible {
        outline: 2px solid var(--accent);
        outline-offset: -2px;
    }

    :global(body.rice) .area {
        border: 0;
        border-left: 1px solid var(--line);
        border-radius: 0;
        background: none;
        font-family: var(--font-mono);
    }
</style>
