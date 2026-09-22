<script lang="ts">
    // Layer 3, primitive. A text box that filters something. It holds no text of its own: the value
    // comes in as a prop and every keystroke goes out as a call, so a view that saves its filter
    // and one that does not use the same box.
    //
    // Escape clears it, which is the one behaviour a search box is expected to have and the reason
    // this is a component rather than an input a view writes out itself. Enter is the other: a box
    // that filters what is already on screen has nothing to do with it, and a box that asks the
    // server for an answer runs on it, so the caller says whether Enter means anything here.

    type Props = {
        value: string;
        /** The placeholder, which is also the box's accessible name. Already translated. */
        placeholder: string;
        oninput: (value: string) => void;
        /** What Enter does, for a box whose value is asked for rather than filtered with. */
        onenter?: () => void;
    };

    let { value, placeholder, oninput, onenter }: Props = $props();

    function typed(event: Event): void {
        const field = event.currentTarget;
        if (field instanceof HTMLInputElement) oninput(field.value);
    }

    function keys(event: KeyboardEvent): void {
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

<input
    class="search"
    data-search
    type="search"
    {value}
    {placeholder}
    aria-label={placeholder}
    oninput={typed}
    onkeydown={keys}
/>

<style>
    .search {
        min-width: 0;
        border: 1px solid var(--line);
        border-radius: var(--radius-sm);
        background: var(--chip);
        color: var(--ink-txt, var(--ink));
        font: inherit;
        font-size: var(--fs-sm);
        padding: 3px 8px;
    }

    .search::placeholder {
        color: var(--muted-txt, var(--muted));
    }

    .search:focus-visible {
        outline: 2px solid var(--accent);
        outline-offset: -2px;
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
