<script lang="ts">
    // Layer 3, primitive. One line of text. It holds nothing of its own: the value comes in as a
    // prop and every keystroke goes out as a call, which is the rule ui/controls/Search.svelte
    // already follows, so a form that keeps a draft and one that writes straight through use the
    // same box.

    type Props = {
        value: string;
        /** The box's accessible name, already translated by the view. */
        label: string;
        oninput: (value: string) => void;
        /** Shown and not editable, for a field a write never touches. */
        readonly?: boolean;
        placeholder?: string;
    };

    let { value, label, oninput, readonly = false, placeholder }: Props = $props();

    function typed(event: Event): void {
        const field = event.currentTarget;
        if (field instanceof HTMLInputElement) oninput(field.value);
    }
</script>

<input
    class="text"
    type="text"
    {value}
    {readonly}
    {placeholder}
    aria-label={label}
    aria-readonly={readonly ? 'true' : undefined}
    oninput={typed}
/>

<style>
    .text {
        width: 100%;
        box-sizing: border-box;
        min-width: 0;
        border: 1px solid var(--line);
        border-radius: var(--radius-sm);
        background: var(--chip);
        color: var(--ink-txt, var(--ink));
        font: inherit;
        font-size: var(--fs-sm);
        padding: 3px 8px;
    }

    .text::placeholder {
        color: var(--muted-txt, var(--muted));
    }

    .text:focus-visible {
        outline: 2px solid var(--accent);
        outline-offset: -2px;
    }

    .text[readonly] {
        color: var(--muted-txt, var(--muted));
        background: none;
    }

    /* The terminal shape: a prompt on the panel, no box round it. */
    :global(body.rice) .text {
        border: 0;
        border-bottom: 1px solid var(--line);
        border-radius: 0;
        background: none;
        font-family: var(--font-mono);
    }
</style>
