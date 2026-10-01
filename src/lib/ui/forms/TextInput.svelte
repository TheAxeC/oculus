<script lang="ts">
    // Layer 3, primitive. One line of text. It holds nothing of its own: the value comes in as a
    // prop and every keystroke goes out as a call, which is the rule ui/controls/text/Search.svelte
    // already follows, so a form that keeps a draft and one that writes straight through use the
    // same box.
    //
    // A form that writes a value when the reader is done with the box, rather than at each
    // keystroke, hands `onenter` and `onblur`: each is called with the box's text, Enter outside an
    // input method's composition and the loss of focus respectively. The box keeps nothing of its
    // own either way.
    //
    // A right-click on the box opens its editing menu (TextBoxMenu.svelte), read from the box as
    // the right-click arrives; the menu is the box's own, so a menu of a row or a view around it
    // does not open over it.

    import TextBoxMenu from '../controls/text/TextBoxMenu.svelte';
    import { typedInto } from '../controls/text/text-menu';

    type Props = {
        value: string;
        /** The box's accessible name, already translated by the view. */
        label: string;
        oninput: (value: string) => void;
        /** Enter was pressed in the box, with its text. */
        onenter?: (value: string) => void;
        /** The box lost the focus, with its text. */
        onblur?: (value: string) => void;
        /** Shown and not editable, for a field a write never touches. */
        readonly?: boolean;
        placeholder?: string;
        /** Drawn as dots and never offered to the browser's autofill, for a secret. */
        secret?: boolean;
        /** The keypad a touch screen offers, for a box holding a number. */
        inputmode?: 'decimal';
    };

    let {
        value,
        label,
        oninput,
        onenter,
        onblur,
        readonly = false,
        placeholder,
        secret = false,
        inputmode
    }: Props = $props();

    let box: HTMLInputElement | null = $state(null);

    function keyed(event: KeyboardEvent): void {
        if (event.key !== 'Enter' || event.isComposing || onenter === undefined) return;
        const field = event.currentTarget;
        if (field instanceof HTMLInputElement) onenter(field.value);
    }

    function left(event: FocusEvent): void {
        const field = event.currentTarget;
        if (field instanceof HTMLInputElement) onblur?.(field.value);
    }
</script>

<TextBoxMenu {label} box={() => box} {secret}>
    <input
        class="text"
        type={secret ? 'password' : 'text'}
        autocomplete={secret ? 'off' : undefined}
        {value}
        {readonly}
        {placeholder}
        {inputmode}
        aria-label={label}
        aria-readonly={readonly ? 'true' : undefined}
        oninput={(event) => typedInto(event, oninput)}
        onkeydown={keyed}
        onblur={left}
        bind:this={box}
    />
</TextBoxMenu>

<style>
    .text {
        width: 100%;
        max-width: 40em;
        box-sizing: border-box;
        min-width: 0;
        border: 1px solid var(--line);
        border-radius: var(--input-radius);
        background: var(--chip);
        color: var(--ink-txt, var(--ink));
        font: inherit;
        font-size: var(--fs-md);
        line-height: calc(var(--button-line) * var(--text-scale, 1));
        padding: 4px 6px;
    }

    .text::placeholder {
        color: var(--muted-txt, var(--muted));
    }

    .text:focus-visible {
        outline: 1px solid var(--accent);
        outline-offset: -1px;
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
