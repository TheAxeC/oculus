<script lang="ts">
    // Layer 3, primitive. One control in a toolbar. It is a button and nothing else: what pressing
    // it means, and whether it is the one in force, are the caller's.
    //
    // `checked` is what makes an exclusive group possible without a second component: given it, the
    // button reports itself as a radio and says whether it is the chosen one, which is what
    // Segment.svelte needs and a lone button does not.

    import Glyph from './Glyph.svelte';

    type Props = {
        /** The button's words, already translated by the view. */
        label: string;
        /** A name in `glyphs:`, drawn before the label. */
        glyph?: string;
        /** Draw it as the one in force. */
        active?: boolean;
        onclick: () => void;
        /** The tooltip, when it should say more than the label does. */
        title?: string;
        /** One of an exclusive group: the button becomes a radio and reports this as its state. */
        checked?: boolean;
    };

    let { label, glyph, active = false, onclick, title, checked }: Props = $props();
</script>

<button
    type="button"
    class="tool"
    class:active
    role={checked === undefined ? undefined : 'radio'}
    aria-checked={checked}
    {title}
    {onclick}
>
    {#if glyph !== undefined}
        <Glyph name={glyph} />
    {/if}
    <span class="label">{label}</span>
</button>

<style>
    .tool {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        border: 1px solid var(--line);
        border-radius: var(--radius-sm);
        background: var(--panel);
        color: var(--muted-txt, var(--muted));
        font: inherit;
        font-size: var(--fs-sm);
        padding: 3px 8px;
        cursor: pointer;
        white-space: nowrap;
    }

    .tool:hover {
        border-color: var(--accent);
    }

    .tool.active {
        border-color: var(--accent);
        background: var(--accent);
        color: var(--on-accent);
    }

    .tool:focus-visible {
        outline: 2px solid var(--accent);
        outline-offset: -2px;
    }

    /* The terminal shape: a bracketed word, and the one in force is the only one in ink. */
    :global(body.rice) .tool {
        border: 0;
        border-radius: 0;
        background: none;
        padding: 3px 4px;
    }

    :global(body.rice) .tool.active {
        background: none;
        color: var(--accent-txt, var(--accent));
    }

    :global(body.rice) .tool::before {
        content: '[';
        opacity: 0.5;
    }

    :global(body.rice) .tool::after {
        content: ']';
        opacity: 0.5;
    }
</style>
