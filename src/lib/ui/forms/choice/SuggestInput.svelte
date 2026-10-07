<script lang="ts">
    // Layer 3, primitive. A text box that offers suggestions. The value is the text, whatever it
    // is: a suggestion is a help to typing and never a limit, so a name that is only the start of a
    // suggestion (`wallhaven-83` for `wallhaven-83do1o.jpg`) is a value as it stands. It is
    // bits-ui's Combobox, so the keys, the type-ahead and where the list is placed are bits-ui's,
    // and the list is drawn on the body through bits-ui's portal with the box the menus and the
    // icon dropdown use.
    //
    // It follows ui/forms/TextInput.svelte: the text comes in as a prop and every keystroke goes
    // out as a call, with Enter and the loss of focus as the moments a form writes in. Enter hands
    // on the text typed, unless the arrow keys moved the cursor to a suggestion, which Enter then
    // takes. A press on a suggestion hands it on as the text and the value at once, and keeps the
    // focus in the box so the loss of focus does not hand the earlier text on first. The box
    // carries the text boxes' editing menu (TextBoxMenu.svelte).
    //
    // The box's own input and key handlers are given to Combobox.Input, which runs them before
    // bits-ui's and stops at a handled Enter; set on the input itself they would replace bits-ui's,
    // and the list would stay closed after Enter however much is typed. The editing menu wraps the
    // combobox, not the input alone: bits-ui takes an input as the anchor of the nearest floating
    // layer, so an input inside the menu's root anchors the menu and leaves the list unplaced.
    //
    // A caller whose list is not there yet gives `note` instead of suggestions: the list then
    // holds that sentence, already translated, and nothing to pick.

    import { Combobox } from 'bits-ui';
    import TextBoxMenu from '../../controls/text/TextBoxMenu.svelte';
    import { typedInto } from '../../controls/text/text-menu';
    import FloatingList from '../../frame/FloatingList.svelte';

    type Props = {
        value: string;
        /** The box's accessible name, already translated by the view. */
        label: string;
        oninput: (value: string) => void;
        /** Enter was pressed in the box, or a suggestion was taken, with the text. */
        onenter?: (value: string) => void;
        /** The box lost the focus, with its text. */
        onblur?: (value: string) => void;
        /** What the box offers; the ones holding the text typed are listed. */
        suggestions: string[];
        /** A sentence listed in place of the suggestions, for a list that is loading or failed. */
        note?: string;
        placeholder?: string;
    };

    let { value, label, oninput, onenter, onblur, suggestions, note, placeholder }: Props =
        $props();

    /** How many suggestions are listed at once; typing is how the rest are reached. */
    const LIMIT = 80;

    /** How near the window's edges the list may be laid out. */
    const MARGIN = 8;

    let open = $state(false);
    let input: HTMLInputElement | null = $state(null);

    /** The combobox's own value, which this box never keeps: a taken suggestion is handed on. */
    let taken = $state('');

    /** Whether an arrow key moved the cursor since the last keystroke of text. */
    let arrowed = false;

    const listed = $derived.by(() => {
        const needle = value.trim().toLowerCase();
        const matches =
            needle === ''
                ? suggestions
                : suggestions.filter((one) => one.toLowerCase().includes(needle));
        return matches.slice(0, LIMIT);
    });

    const items = $derived(listed.map((one) => ({ value: one, label: one })));

    function typed(event: Event): void {
        arrowed = false;
        typedInto(event, oninput);
    }

    function keyed(event: KeyboardEvent): void {
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') arrowed = true;
        if (event.key !== 'Enter' || event.isComposing || arrowed) return;
        event.preventDefault();
        open = false;
        const field = event.currentTarget;
        if (field instanceof HTMLInputElement) onenter?.(field.value);
    }

    function left(event: FocusEvent): void {
        const field = event.currentTarget;
        if (field instanceof HTMLInputElement) onblur?.(field.value);
    }

    function picked(next: string): void {
        arrowed = false;
        taken = '';
        if (next === '') return;
        oninput(next);
        onenter?.(next);
    }
</script>

<TextBoxMenu {label} box={() => input}>
    <Combobox.Root
        type="single"
        bind:value={taken}
        bind:open
        {items}
        inputValue={value}
        allowDeselect={false}
        onValueChange={picked}
    >
        <Combobox.Input oninput={typed} onkeydown={keyed}>
            {#snippet child({ props })}
                <input
                    {...props}
                    class="suggest"
                    type="text"
                    autocomplete="off"
                    aria-label={label}
                    {placeholder}
                    onblur={left}
                    onfocus={() => (open = true)}
                    bind:this={input}
                />
            {/snippet}
        </Combobox.Input>
        {#if listed.length > 0 || note !== undefined}
            <Combobox.Portal>
                <Combobox.Content collisionPadding={MARGIN} strategy="fixed">
                    {#snippet child({ wrapperProps, props })}
                        <div {...wrapperProps}>
                            <FloatingList {label} list={props} shape="field">
                                <Combobox.Viewport>
                                    {#snippet child({ props: viewport })}
                                        <div
                                            {...viewport}
                                            class="viewport"
                                            role="presentation"
                                            onmousedown={(event) => event.preventDefault()}
                                        >
                                            {#if note !== undefined}
                                                <div class="note">{note}</div>
                                            {/if}
                                            {#each listed as one (one)}
                                                <Combobox.Item value={one} label={one}>
                                                    {#snippet child({ props: entry })}
                                                        <div {...entry} class="item">
                                                            <span class="name">{one}</span>
                                                        </div>
                                                    {/snippet}
                                                </Combobox.Item>
                                            {/each}
                                        </div>
                                    {/snippet}
                                </Combobox.Viewport>
                            </FloatingList>
                        </div>
                    {/snippet}
                </Combobox.Content>
            </Combobox.Portal>
        {/if}
    </Combobox.Root>
</TextBoxMenu>

<style>
    /* The look of TextInput.svelte, so the two kinds of box read as one kind. */
    .suggest {
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

    .suggest::placeholder {
        color: var(--muted-txt, var(--muted));
    }

    .suggest:focus-visible {
        outline: 1px solid var(--accent);
        outline-offset: -1px;
    }

    :global(body.rice) .suggest {
        border: 0;
        border-bottom: 1px solid var(--line);
        border-radius: 0;
        background: none;
        font-family: var(--font-mono);
    }

    /* The box that scrolls, as GlyphList.svelte's: bits-ui scrolls the item the keys reach into
       view only inside its viewport. */
    .viewport {
        display: flex;
        flex-direction: column;
        min-height: 0;
    }

    .viewport[data-select-viewport] {
        scrollbar-width: thin !important;
        scrollbar-color: var(--scroll-thumb) var(--scroll-track) !important;
    }

    .note {
        padding: 4px 6px;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-sm);
    }

    .item[data-highlighted] {
        background: var(--chip);
    }

    .item[data-selected] {
        color: var(--accent-txt, var(--accent));
    }
</style>
