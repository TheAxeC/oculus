<script lang="ts">
    // Layer 3, primitive. One name of the glyph vocabulary, picked from a list that draws each
    // name's icon beside it, which a native select cannot: its options hold text alone. It is
    // bits-ui's Select, drawn by FieldSelect.svelte, so the keys, type-ahead and where the list is
    // placed are bits-ui's.
    //
    // It follows Select.svelte's rules: the empty choice is always there and first, and a value the
    // choices lack is still shown, so a manifest is never silently retyped. Each name is listed in
    // words with the name itself beside them (glyphItems of ./choices.ts). The trigger is named by
    // the field's label and the chosen name's words after it, as a native select reads its label
    // and its option: "Icon of button 2 Sliders".

    import Glyph from '../../display/Glyph.svelte';
    import FieldSelect from './select/FieldSelect.svelte';
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

    const items = $derived(glyphItems(value, empty, choices));

    /** Whether the value is one of the choices, which is when the trigger has an icon to draw. */
    const drawn = $derived(value !== '' && !isStray(value, choices));
</script>

<FieldSelect {value} {label} {empty} {items} {onchange}>
    {#snippet lead()}
        {#if drawn}
            <span class="lead">
                <Glyph name={value} />
            </span>
        {/if}
    {/snippet}
    {#snippet list(props)}
        <GlyphList {label} {items} list={props} />
    {/snippet}
</FieldSelect>

<style>
    .lead {
        display: inline-flex;
        flex: none;
    }
</style>
