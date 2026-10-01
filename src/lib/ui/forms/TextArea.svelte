<script lang="ts">
    // Layer 3, primitive. Several lines of text: the prose fields, and the list fields that are one
    // item per line. Like every control here it holds nothing of its own.
    //
    // A right-click on the box opens its editing menu (TextBoxMenu.svelte), read from the box as
    // the right-click arrives; the menu is the box's own, so a menu of a row or a view around it
    // does not open over it.
    //
    // Given `grow`, the box takes the height of its text, wrapped lines included, between `min` and
    // `max` lines, and scrolls past `max`. The browser does that through `field-sizing`; `rows` is
    // then the text's own line count held between the two, which is the height in a browser that
    // has no `field-sizing`. An empty growing box is one line high: a placeholder wider than the
    // box is cut at its edge, not wrapped. `size: 'tree'` draws the text at a tree row's
    // size.

    import TextBoxMenu from '../controls/text/TextBoxMenu.svelte';
    import { boxValue } from '../controls/text/text-menu';

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
        /**
         * No border, fill or padding of its own and no resize handle, for a field inside a box that
         * draws them, as the composer's box holds its prompt and its controls under one border.
         */
        bare?: boolean;
        /** What the empty box shows, already translated by the view. */
        placeholder?: string;
        /** The text size: the small one of the forms, or a tree row's. */
        size?: 'sm' | 'tree';
        /** The least and the most lines the box grows between with its text. */
        grow?: { min: number; max: number };
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
        bare = false,
        placeholder,
        size = 'sm',
        grow
    }: Props = $props();

    const lines = $derived(
        grow === undefined ? rows : Math.min(grow.max, Math.max(grow.min, rows))
    );
    const bounds = $derived(
        grow === undefined
            ? undefined
            : `--grow-min: ${String(grow.min)}; --grow-max: ${String(grow.max)}`
    );

    let box: HTMLTextAreaElement | null = $state(null);

    function typed(event: Event): void {
        const typedValue = boxValue(event);
        if (typedValue !== null) oninput(typedValue);
    }
</script>

<TextBoxMenu {label} box={() => box}>
    <textarea
        class="area"
        class:bare
        class:code
        class:grow={grow !== undefined}
        class:tree={size === 'tree'}
        style={bounds}
        wrap={code ? 'off' : undefined}
        rows={lines}
        aria-label={label}
        {placeholder}
        {value}
        readonly={readOnly}
        {spellcheck}
        oninput={typed}
        {onkeydown}
        bind:this={box}></textarea>
</TextBoxMenu>

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

    .area.tree {
        font-size: calc(var(--tree-font) * var(--text-scale, 1));
    }

    .area.grow {
        resize: none;
        field-sizing: content;
        min-height: calc(var(--grow-min) * 1lh);
        max-height: calc(var(--grow-max) * 1lh);
        overflow-y: auto;
    }

    /* An empty growing field is one line high whatever the width: a placeholder longer than the
       field is cut at its edge rather than wrapped into a second line. */
    .area.grow:placeholder-shown {
        overflow: hidden;
        white-space: nowrap;
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
