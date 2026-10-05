<script lang="ts">
    // Layer 3, primitive. One hue of the palette, picked from a list that draws a swatch of each
    // hue beside its name, which a native select cannot: its options hold text alone. It is
    // bits-ui's Select, drawn by FieldSelect.svelte as ui/forms/choice/GlyphSelect.svelte is, so
    // the keys, type-ahead and where the list is placed are bits-ui's, and the list is drawn with
    // the box the menus use.
    //
    // The hues come in as props, with the words of each: ui reads no config. A swatch is the
    // hue's own colour token, `var(--c-<hue>)`, so it follows the theme as the page's tones do.
    // The empty choice is there and first whenever the caller gives its words, and a value the
    // hues lack is still shown, so a file is never silently retyped by a field that could not
    // name its value.
    //
    // The trigger is named by the field's label and the chosen hue after it.

    import { Select } from 'bits-ui';
    import FloatingList from '../../../frame/FloatingList.svelte';
    import FieldSelect from './FieldSelect.svelte';
    import { isStray } from '../choices';

    type Props = {
        /** The hue chosen: its name, or the empty string for none. */
        value: string;
        /** The control's accessible name, already translated by the view. */
        label: string;
        /** The words of the empty choice, already translated; omitted, there is no empty choice. */
        empty?: string;
        /** The hues offered, by name. */
        hues: string[];
        onchange: (value: string) => void;
    };

    let { value, label, empty, hues, onchange }: Props = $props();

    /** The entries in the order they are listed: the empty choice, a stray value, every hue. */
    const items = $derived([
        ...(empty === undefined ? [] : [{ value: '', label: empty, swatch: false }]),
        ...(isStray(value, hues) ? [{ value, label: value, swatch: false }] : []),
        ...hues.map((hue) => ({ value: hue, label: hue, swatch: true }))
    ]);

    const drawn = $derived(value !== '' && !isStray(value, hues));
</script>

<FieldSelect {value} {label} {empty} {items} {onchange}>
    {#snippet lead()}
        {#if drawn}
            <span class="swatch" style:background="var(--c-{value})"></span>
        {/if}
    {/snippet}
    {#snippet list(props)}
        <FloatingList {label} list={props} shape="field">
            <Select.Viewport>
                {#snippet child({ props: viewport })}
                    <div {...viewport} class="viewport">
                        {#each items as item (item.value)}
                            <Select.Item value={item.value} label={item.label}>
                                {#snippet child({ props: entry })}
                                    <div {...entry} class="item">
                                        <span class="name">{item.label}</span>
                                        {#if item.swatch}
                                            <span
                                                class="lead swatch"
                                                style:background="var(--c-{item.value})"
                                            ></span>
                                        {/if}
                                    </div>
                                {/snippet}
                            </Select.Item>
                        {/each}
                    </div>
                {/snippet}
            </Select.Viewport>
        </FloatingList>
    {/snippet}
</FieldSelect>

<style>
    .swatch {
        flex: none;
        width: 1em;
        height: 1em;
        border: 1px solid var(--line);
        border-radius: var(--radius-sm);
    }

    .name {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .viewport {
        display: flex;
        flex-direction: column;
        min-height: 0;
    }

    .viewport[data-select-viewport] {
        scrollbar-width: thin !important;
        scrollbar-color: var(--scroll-thumb) var(--scroll-track) !important;
    }

    /* The empty choice and a stray value have no swatch, so their words keep the swatches'
       column. */
    .item .name:only-child {
        padding-left: calc(1em + 6px);
    }

    .item[data-highlighted] {
        background: var(--chip);
    }

    .item[data-selected] {
        color: var(--accent-txt, var(--accent));
    }
</style>
