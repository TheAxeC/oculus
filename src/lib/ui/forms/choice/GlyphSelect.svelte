<script lang="ts">
    // Layer 3, primitive. One name of the glyph vocabulary, picked from a list that draws each
    // name's icon beside it, which a native select cannot: its options hold text alone. It is
    // bits-ui's Select, so the keys, type-ahead and where the list is placed are bits-ui's, and the
    // list is drawn on the body through bits-ui's portal, as the menus are.
    //
    // It follows Select.svelte's rules: the empty choice is always there and first, and a value the
    // choices lack is still shown, so a manifest is never silently retyped. The trigger wears
    // Select.svelte's look, so the field sits among the native selects of a form as one of them.
    //
    // The trigger is a button, whose own words a screen reader reads as its name. It is named by
    // the field's label, held out of sight, and the chosen name after it, as a native select reads
    // its label and its option: "Icon of button 2 sliders".

    import { Select } from 'bits-ui';
    import Glyph from '../../display/Glyph.svelte';
    import GlyphList from './GlyphList.svelte';
    import { glyphItems, isStray } from './choices';

    type Props = {
        value: string;
        /** The control's accessible name, already translated by the view. */
        label: string;
        /** The words of the empty choice, already translated. */
        empty: string;
        /** Names of the glyph vocabulary, each drawn with its icon. */
        choices: string[];
        onchange: (value: string) => void;
    };

    let { value, label, empty, choices, onchange }: Props = $props();

    /** How near the window's edges the list may be laid out. */
    const MARGIN = 8;

    const uid = $props.id();

    /** The ids of the trigger's two names: the field's label, then the chosen name. */
    const labelId = `${uid}-label`;
    const nameId = `${uid}-name`;

    const items = $derived(glyphItems(value, empty, choices));

    /** Whether the value is one of the choices, which is when the trigger has an icon to draw. */
    const drawn = $derived(value !== '' && !isStray(value, choices));
</script>

<Select.Root type="single" {value} {items} onValueChange={onchange}>
    <Select.Trigger>
        {#snippet child({ props })}
            <button {...props} class="select" aria-labelledby="{labelId} {nameId}">
                <span id={labelId} class="unseen">{label}</span>
                {#if drawn}
                    <span class="lead">
                        <Glyph name={value} />
                    </span>
                {/if}
                <span id={nameId} class="name">{value === '' ? empty : value}</span>
                <span class="caret">
                    <Glyph name="disclosure" />
                </span>
            </button>
        {/snippet}
    </Select.Trigger>
    <Select.Portal>
        <Select.Content collisionPadding={MARGIN} strategy="fixed">
            {#snippet child({ wrapperProps, props })}
                <div {...wrapperProps}>
                    <GlyphList {label} {items} list={props} />
                </div>
            {/snippet}
        </Select.Content>
    </Select.Portal>
</Select.Root>

<style>
    /* Select.svelte's .select, so the two kinds of field read as one kind. */
    .select {
        position: relative;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        max-width: 100%;
        min-width: 0;
        border: 1px solid var(--line);
        border-radius: var(--input-radius);
        background: var(--chip);
        color: var(--ink-txt, var(--ink));
        font: inherit;
        font-size: var(--fs-md);
        line-height: calc(var(--button-line) * var(--text-scale, 1));
        padding: 4px 6px;
        cursor: pointer;
    }

    .select:focus-visible {
        outline: 1px solid var(--accent);
        outline-offset: -1px;
    }

    :global(body.rice) .select {
        border: 0;
        border-bottom: 1px solid var(--line);
        border-radius: 0;
        background: none;
        font-family: var(--font-mono);
    }

    /* Read by a screen reader as the trigger's name and drawn nowhere. */
    .unseen {
        position: absolute;
        width: 1px;
        height: 1px;
        overflow: hidden;
        clip-path: inset(50%);
        white-space: nowrap;
    }

    .lead,
    .caret {
        display: inline-flex;
        flex: none;
    }

    .name {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .caret {
        margin-left: auto;
        color: var(--muted-txt, var(--muted));
    }
</style>
