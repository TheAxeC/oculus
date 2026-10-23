<script lang="ts">
    // Layer 3, primitive. Several of a list of choices: the chosen ones as chips that remove
    // themselves, a box that filters the rest, and the keyboard through them. It is the control the
    // relation fields need, where the list is a registry of a hundred keys and nobody scrolls it.
    //
    // `free` is what tells a field of names from a field of keys: with it, what is typed is a
    // choice of its own, which is how `authors` and `waiting-on` take a person the registries do
    // not hold.
    //
    // A choice with a `glyph` draws it before its words, on its button and on its chip, so a field
    // whose choices have a kind (the resources of a project) shows the kind on both. A choice with
    // a `hub`, a record of a hub other than the record's own, draws that hub's name as a chip after
    // its words, on its button and on its chip, so two hubs' records of one name are told apart.
    // The choice at the cursor is drawn active only while the filter box has focus, since the
    // cursor is the keyboard's and a box nobody is typing in has no choice to take with Enter.
    //
    // The filter box carries the text boxes' editing menu (TextBoxMenu.svelte).
    //
    // At most LIMIT choices are drawn at once; when more match, a control after them says how many
    // more there are and draws them all when pressed, so every choice is reachable without typing,
    // and a filter typed after that starts from LIMIT again.

    import Glyph from '../../display/Glyph.svelte';
    import '../../theme/field.css';
    import TextBoxMenu from '../../controls/text/TextBoxMenu.svelte';
    import Chip from '../../controls/Chip.svelte';
    import Tag from '../../controls/Tag.svelte';
    import ToolButton from '../../controls/ToolButton.svelte';

    type Choice = { id: string; label: string; glyph?: string; hub?: string };

    type Props = {
        values: string[];
        /** The control's accessible name, already translated by the view. */
        label: string;
        choices: Choice[];
        onchange: (values: string[]) => void;
        /** The filter box's placeholder, which is also its accessible name. Already translated. */
        search: string;
        /** The tooltip on a chosen item, saying that clicking it removes it. Already translated. */
        remove: string;
        /** A name in `glyphs:` for the remove control. */
        removeGlyph: string;
        /** Take what is typed as a value of its own, for a field of free text. */
        free?: boolean;
        /** What to say when the filter matches nothing. Already translated. */
        none: string;
        /** The words of the control that draws the `count` choices past LIMIT. Translated. */
        more: (count: number) => string;
    };

    let {
        values,
        label,
        choices,
        onchange,
        search,
        remove,
        removeGlyph,
        free = false,
        none,
        more
    }: Props = $props();

    /** How many choices are drawn at once until the reader asks for the rest. */
    const LIMIT = 12;

    let typed = $state('');
    let at = $state(0);
    /** Whether the filter box has focus. */
    let focused = $state(false);
    let box: HTMLInputElement | null = $state(null);
    /** Whether the reader asked for every match, until the filter changes. */
    let whole = $state(false);

    const matches = $derived(filtered(typed));
    const shown = $derived(whole ? matches : matches.slice(0, LIMIT));
    /** How many matches are not drawn. */
    const past = $derived(matches.length - shown.length);

    function filtered(term: string): Choice[] {
        const needle = term.trim().toLowerCase();
        const left = choices.filter((choice) => !values.includes(choice.id));
        if (needle === '') return left;
        return left.filter(
            (choice) =>
                choice.id.toLowerCase().includes(needle) ||
                choice.label.toLowerCase().includes(needle)
        );
    }

    function add(id: string): void {
        if (id === '' || values.includes(id)) return;
        typed = '';
        at = 0;
        whole = false;
        onchange([...values, id]);
    }

    function drop(id: string): void {
        onchange(values.filter((held) => held !== id));
    }

    /** The words a chosen value is shown by, or the value itself when it names no choice. */
    function wordsOf(id: string): string {
        return choices.find((choice) => choice.id === id)?.label ?? id;
    }

    /** The glyph of a chosen value's choice, or undefined when it names no choice or has none. */
    function glyphOf(id: string): string | undefined {
        return choices.find((choice) => choice.id === id)?.glyph;
    }

    /** The hub of a chosen value's choice, or undefined when it names none or is of the own hub. */
    function hubOf(id: string): string | undefined {
        return choices.find((choice) => choice.id === id)?.hub;
    }

    function keys(event: KeyboardEvent): void {
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            const step = event.key === 'ArrowDown' ? 1 : -1;
            if (shown.length === 0) return;
            at = (at + step + shown.length) % shown.length;
            return;
        }
        if (event.key === 'Enter') {
            event.preventDefault();
            const choice = shown.at(at);
            if (choice !== undefined) add(choice.id);
            else if (free) add(typed.trim());
            return;
        }
        if (event.key === 'Escape') {
            event.preventDefault();
            typed = '';
            at = 0;
            whole = false;
        }
    }

    function changed(event: Event): void {
        const field = event.currentTarget;
        if (field instanceof HTMLInputElement) {
            typed = field.value;
            at = 0;
            whole = false;
        }
    }
</script>

<div class="multi" role="group" aria-label={label}>
    {#if values.length > 0}
        <div class="chosen">
            {#each values as value (value)}
                {@const kind = glyphOf(value)}
                {@const hub = hubOf(value)}
                {#if kind === undefined && hub === undefined}
                    <ToolButton
                        label={wordsOf(value)}
                        glyph={removeGlyph}
                        title={remove}
                        onclick={() => drop(value)}
                    />
                {:else}
                    <ToolButton
                        label={wordsOf(value)}
                        glyph={removeGlyph}
                        title={remove}
                        onclick={() => drop(value)}
                    >
                        {#if kind !== undefined}
                            <Glyph name={kind} />
                        {/if}
                        {wordsOf(value)}
                        {#if hub !== undefined}
                            <Chip label={hub} />
                        {/if}
                    </ToolButton>
                {/if}
            {/each}
        </div>
    {/if}
    <TextBoxMenu label={search} box={() => box}>
        <input
            class="oculus-field"
            type="search"
            value={typed}
            placeholder={search}
            aria-label={search}
            oninput={changed}
            onkeydown={keys}
            onfocusin={() => (focused = true)}
            onfocusout={() => (focused = false)}
            bind:this={box}
        />
    </TextBoxMenu>
    <div class="choices">
        {#each shown as choice, index (choice.id)}
            {#if choice.hub === undefined}
                <ToolButton
                    label={choice.label}
                    glyph={choice.glyph}
                    active={focused && index === at}
                    onclick={() => add(choice.id)}
                    title={choice.id}
                />
            {:else}
                <ToolButton
                    label={choice.label}
                    active={focused && index === at}
                    onclick={() => add(choice.id)}
                    title={choice.id}
                >
                    {#if choice.glyph !== undefined}
                        <Glyph name={choice.glyph} />
                    {/if}
                    {choice.label}
                    <Chip label={choice.hub} />
                </ToolButton>
            {/if}
        {/each}
        {#if past > 0}
            <ToolButton label={more(past)} onclick={() => (whole = true)} />
        {/if}
        {#if shown.length === 0}
            {#if free && typed.trim() !== ''}
                <ToolButton
                    label={typed.trim()}
                    active={focused}
                    onclick={() => add(typed.trim())}
                />
            {:else}
                <Tag label={none} />
            {/if}
        {/if}
    </div>
</div>

<style>
    .multi {
        display: flex;
        flex-direction: column;
        gap: 4px;
        min-width: 0;
    }

    .chosen,
    .choices {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 4px;
    }
</style>
