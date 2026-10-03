<script lang="ts">
    // Layer 3, primitive. A text box that filters something. It holds no text of its own: the value
    // comes in as a prop and every keystroke goes out as a call, so a view that saves its filter
    // and one that does not use the same box.
    //
    // Escape clears it, which is the one behaviour a search box is expected to have and the reason
    // this is a component rather than an input a view writes out itself. Enter is the other: a box
    // that filters what is already on screen has nothing to do with it, and a box that asks the
    // server for an answer runs on it, so the caller says whether Enter means anything here.
    //
    // A box that is the input of a list it steers, as the palette's is of its bits-ui Command list,
    // is handed that list's attributes as `field`: its role, the list it controls and the row that
    // is selected. The box's own value, name and keys stay its own.
    //
    // A right-click on the box opens the text boxes' editing menu (TextBoxMenu.svelte), as a
    // TextInput's does.
    //
    // A caller that moves the cursor into the box binds `input`, and one that gives a key a meaning
    // of its own in the box (Up and Down in a box with a history) hands `onkey`, which is asked
    // first and answers true for a press it took.

    import TextBoxMenu from './TextBoxMenu.svelte';
    import { typedInto } from './text-menu';

    type Props = {
        value: string;
        /** The placeholder, which is also the box's accessible name. Already translated. */
        placeholder: string;
        oninput: (value: string) => void;
        /** What Enter does, for a box whose value is asked for rather than filtered with. */
        onenter?: () => void;
        /** The attributes of the list this box steers, put on the input under its own. */
        field?: Record<string, unknown>;
        /** The box takes the width its row leaves free, for a box set in a flex row. */
        fill?: boolean;
        /** The input element, for a caller that puts the cursor in it. */
        input?: HTMLInputElement | null;
        /** A key press the caller takes for itself; true when it did. */
        onkey?: (event: KeyboardEvent) => boolean;
    };

    let {
        value,
        placeholder,
        oninput,
        onenter,
        field = {},
        fill = false,
        input = $bindable(null),
        onkey
    }: Props = $props();

    function keys(event: KeyboardEvent): void {
        if (onkey?.(event) === true) {
            event.preventDefault();
            return;
        }
        if (event.key === 'Enter' && onenter !== undefined) {
            event.preventDefault();
            onenter();
            return;
        }
        if (event.key !== 'Escape') return;
        event.preventDefault();
        oninput('');
    }
</script>

<TextBoxMenu label={placeholder} box={() => input}>
    <input
        {...field}
        class="search"
        class:fill
        data-search
        type="search"
        {value}
        {placeholder}
        aria-label={placeholder}
        oninput={(event) => typedInto(event, oninput)}
        onkeydown={keys}
        bind:this={input}
    />
</TextBoxMenu>

<style>
    .search {
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

    .fill {
        flex: 1 1 12em;
        max-width: 32em;
    }

    .search::placeholder {
        color: var(--muted-txt, var(--muted));
    }

    .search:focus-visible {
        outline: 1px solid var(--accent);
        outline-offset: -1px;
    }

    /* The terminal shape: a prompt on the panel, no box round it. */
    :global(body.rice) .search {
        border: 0;
        border-bottom: 1px solid var(--line);
        border-radius: 0;
        background: none;
        font-family: var(--font-mono);
    }
</style>
