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
        /** Whether the caller offers this text for viewing but not editing. */
        readOnly?: boolean;
        /** Browser spelling support, off for source code. */
        spellcheck?: boolean;
        /**
         * A key pressed in the box, for a caller where a key means something other than a
         * character: the composer sends on Enter and recalls what it sent on the up arrow. The
         * caller decides whether the key still types, since only it knows.
         */
        onkeydown?: (event: KeyboardEvent) => void;
        /** The caller may keep a visual mirror aligned with this field. */
        onscroll?: (event: Event) => void;
    };

    let {
        value,
        label,
        oninput,
        rows = 3,
        readOnly = false,
        spellcheck = true,
        onkeydown,
        onscroll
    }: Props = $props();

    function typed(event: Event): void {
        const field = event.currentTarget;
        if (field instanceof HTMLTextAreaElement) oninput(field.value);
    }
</script>

<textarea
    class="area"
    {rows}
    aria-label={label}
    {value}
    readonly={readOnly}
    {spellcheck}
    oninput={typed}
    {onkeydown}
    {onscroll}></textarea>

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
