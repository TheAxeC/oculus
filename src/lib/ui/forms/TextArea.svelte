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
        /** Source text: in the code font, each line kept whole and scrolled rather than wrapped. */
        code?: boolean;
        /**
         * A key pressed in the box, for a caller where a key means something other than a
         * character: the composer sends on Enter and recalls what it sent on the up arrow. The
         * caller decides whether the key still types, since only it knows.
         */
        onkeydown?: (event: KeyboardEvent) => void;
        /** The caller may keep a visual mirror aligned with this field. */
        onscroll?: (event: Event) => void;
        /**
         * No border, fill or padding of its own and no resize handle, for a field inside a box that
         * draws them, as the composer's box holds its prompt and its controls under one border.
         */
        bare?: boolean;
        /** What the empty box shows, already translated by the view. */
        placeholder?: string;
    };

    let {
        value,
        label,
        oninput,
        rows = 3,
        readOnly = false,
        spellcheck = true,
        code = false,
        onkeydown,
        onscroll,
        bare = false,
        placeholder
    }: Props = $props();

    function typed(event: Event): void {
        const field = event.currentTarget;
        if (field instanceof HTMLTextAreaElement) oninput(field.value);
    }
</script>

<textarea
    class="area"
    class:bare
    class:code
    wrap={code ? 'off' : undefined}
    {rows}
    aria-label={label}
    {placeholder}
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

    .area.bare,
    :global(body.rice) .area.bare {
        border: 0;
        background: none;
        padding: 0;
        resize: none;
    }

    .area::placeholder {
        color: var(--muted-txt, var(--muted));
    }

    .area.bare:focus-visible {
        outline: none;
    }

    .area.code {
        font-family: var(--font-mono);
        white-space: pre;
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
