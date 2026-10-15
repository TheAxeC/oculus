<script lang="ts">
    // Layer 3, primitive. The trigger and the floating list of a field that picks one word and
    // draws something beside each word (GlyphSelect.svelte, HueSelect.svelte). It is bits-ui's
    // Select, so the keys, type-ahead and where the list is placed are bits-ui's, and the list is
    // drawn on the body through bits-ui's portal, as the menus are. The trigger wears the field
    // look of ui/theme/field.css, as Select.svelte does, so the field sits among the native selects
    // of a form as one of them.
    //
    // The trigger is a button, whose own words a screen reader reads as its name. It is named by
    // the field's label, held out of sight, and the chosen word after it, as a native select reads
    // its label and its option. What is drawn before the chosen word (`lead`) and the list itself
    // (`list`, handed bits-ui's props for it) are the caller's.

    import type { Snippet } from 'svelte';
    import { Select } from 'bits-ui';
    import Glyph from '../../../display/Glyph.svelte';
    import '../../../theme/field.css';

    type Props = {
        value: string;
        /** The control's accessible name, already translated by the view. */
        label: string;
        /**
         * The words of the empty choice, already translated; the empty value shows none without.
         */
        empty?: string;
        /** The entries in the order they are listed. */
        items: { value: string; label: string }[];
        onchange: (value: string) => void;
        /** What is drawn before the chosen word, when there is a chosen word to draw it for. */
        lead?: Snippet;
        /** The list, given the props bits-ui puts on the floating element. */
        list: Snippet<[Record<string, unknown>]>;
    };

    let { value, label, empty, items, onchange, lead, list }: Props = $props();

    /** How near the window's edges the list may be laid out. */
    const MARGIN = 8;

    const uid = $props.id();

    /** The ids of the trigger's two names: the field's label, then the chosen word. */
    const labelId = `${uid}-label`;
    const nameId = `${uid}-name`;
</script>

<Select.Root type="single" {value} {items} onValueChange={onchange}>
    <Select.Trigger>
        {#snippet child({ props })}
            <button {...props} class="select oculus-field" aria-labelledby="{labelId} {nameId}">
                <span id={labelId} class="unseen">{label}</span>
                {@render lead?.()}
                <span id={nameId} class="name">{value === '' ? (empty ?? '') : value}</span>
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
                    {@render list(props as Record<string, unknown>)}
                </div>
            {/snippet}
        </Select.Content>
    </Select.Portal>
</Select.Root>

<style>
    /* The trigger's own: its words and caret laid out in a row, and the pointer of a button. */
    .select {
        position: relative;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        max-width: 100%;
        cursor: pointer;
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

    .name {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .caret {
        display: inline-flex;
        flex: none;
        margin-left: auto;
        color: var(--muted-txt, var(--muted));
    }
</style>
