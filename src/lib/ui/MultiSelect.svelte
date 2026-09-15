<script lang="ts">
    // Layer 3, primitive. Several of a list of choices: the chosen ones as chips that remove
    // themselves, a box that filters the rest, and the keyboard through them. It is the control the
    // relation fields need, where the list is a registry of a hundred keys and nobody scrolls it.
    //
    // `free` is what tells a field of names from a field of keys: with it, what is typed is a choice
    // of its own, which is how `authors` and `waiting-on` take a person the registries do not hold.

    import Tag from './Tag.svelte';
    import ToolButton from './ToolButton.svelte';

    type Choice = { id: string; label: string };

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
        none
    }: Props = $props();

    /** How many choices are offered at once; the filter is how the rest are reached. */
    const LIMIT = 12;

    let typed = $state('');
    let at = $state(0);

    const matches = $derived(filtered(typed));
    const shown = $derived(matches.slice(0, LIMIT));

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
        onchange([...values, id]);
    }

    function drop(id: string): void {
        onchange(values.filter((held) => held !== id));
    }

    /** The words a chosen value is shown by, or the value itself when it names no choice. */
    function wordsOf(id: string): string {
        return choices.find((choice) => choice.id === id)?.label ?? id;
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
        }
    }

    function changed(event: Event): void {
        const field = event.currentTarget;
        if (field instanceof HTMLInputElement) {
            typed = field.value;
            at = 0;
        }
    }
</script>

<div class="multi" role="group" aria-label={label}>
    {#if values.length > 0}
        <div class="chosen">
            {#each values as value (value)}
                <ToolButton
                    label={wordsOf(value)}
                    glyph={removeGlyph}
                    title={remove}
                    onclick={() => drop(value)}
                />
            {/each}
        </div>
    {/if}
    <input
        class="filter"
        type="search"
        value={typed}
        placeholder={search}
        aria-label={search}
        oninput={changed}
        onkeydown={keys}
    />
    <div class="choices">
        {#each shown as choice, index (choice.id)}
            <ToolButton
                label={choice.label}
                active={index === at}
                onclick={() => add(choice.id)}
                title={choice.id}
            />
        {/each}
        {#if shown.length === 0}
            {#if free && typed.trim() !== ''}
                <ToolButton label={typed.trim()} active onclick={() => add(typed.trim())} />
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

    .filter {
        min-width: 0;
        border: 1px solid var(--line);
        border-radius: var(--radius-sm);
        background: var(--chip);
        color: var(--ink-txt, var(--ink));
        font: inherit;
        font-size: var(--fs-sm);
        padding: 3px 8px;
    }

    .filter::placeholder {
        color: var(--muted-txt, var(--muted));
    }

    .filter:focus-visible {
        outline: 2px solid var(--accent);
        outline-offset: -2px;
    }

    :global(body.rice) .filter {
        border: 0;
        border-bottom: 1px solid var(--line);
        border-radius: 0;
        background: none;
        font-family: var(--font-mono);
    }
</style>
