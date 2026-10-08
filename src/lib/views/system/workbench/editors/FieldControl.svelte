<script lang="ts">
    // Layer 3, view partial. The control of one option of a config file or of one field of a family
    // entry, drawn from its catalog spec: a checkbox for true or false (with a third state, unset,
    // for a field a record may lack), a number box held to its range, a text box (with suggestions
    // when the spec names a source), a text area, a choice or a multi-pick over the list the spec
    // names, a glyph picker, a hue or colour picker drawing the palette, a folder, file or path
    // box, and an inline list of items. The rules each control follows are
    // state/system/config/editors/ fields.ts; this draws them.
    //
    // The partial holds nothing: the value comes in as the field's typed value and every change
    // goes out as a call. A box hands on its text at each keystroke (`ontext`) and, when the caller
    // writes as the box is left, when Enter is pressed or the box loses the focus (`onsettle`); a
    // pick, a toggle or an item list hands on the field's new value (`onpick`), undefined for a
    // field taken out of its record.
    //
    // A value outside what the control offers is shown and marked: a Tag with the words that it is
    // not in the list beside a single value, and the same words after a multi-pick's chip. While
    // the list the control draws from is still being read the held value is shown as the one item,
    // with the sentence that the list is loading; a list that could not be read says so.

    import Checkbox from '$lib/ui/forms/Checkbox.svelte';
    import GlyphSelect from '$lib/ui/forms/choice/GlyphSelect.svelte';
    import HueSelect from '$lib/ui/forms/choice/drawn/HueSelect.svelte';
    import MultiSelect from '$lib/ui/forms/choice/MultiSelect.svelte';
    import Select from '$lib/ui/forms/choice/Select.svelte';
    import SuggestInput from '$lib/ui/forms/choice/SuggestInput.svelte';
    import NumberInput from '$lib/ui/forms/NumberInput.svelte';
    import TextArea from '$lib/ui/forms/TextArea.svelte';
    import TextInput from '$lib/ui/forms/TextInput.svelte';
    import Tag from '$lib/ui/controls/Tag.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { t } from '$lib/state/shared/words/text';
    import {
        controlOf,
        fromPick,
        fromWords,
        hueOf,
        isStray,
        offerFor,
        poolOf,
        numberRefusal,
        suggests,
        textOf,
        toggleOf,
        wordsOf,
        type CatalogEntry,
        type FieldValue
    } from '$lib/state/system/config/editors/fields';
    import type { Lists } from '$lib/state/system/config/editors/sources';
    import { said } from '../settings/said';

    type Props = {
        spec: CatalogEntry;
        /** The field's typed value; undefined when the record does not hold it. */
        value: FieldValue | undefined;
        /** The control's accessible name, already translated by the view. */
        label: string;
        lists: Lists;
        /** The other fields of the record, which some lists and checks read. */
        record?: Record<string, FieldValue>;
        /** Whether the field may be absent from its record. */
        optional?: boolean;
        /** The text a box shows while the caller holds text not yet sent, else the value's. */
        text?: string;
        /** Each keystroke of a box. */
        ontext?: (text: string) => void;
        /** Enter in a box, and a box left, with its text. */
        onsettle?: (text: string) => void;
        /** A pick, a toggle or a new list of items. */
        onpick: (value: FieldValue | undefined) => void;
    };

    let {
        spec,
        value,
        label,
        lists,
        record = {},
        optional = false,
        text,
        ontext,
        onsettle,
        onpick
    }: Props = $props();

    const control = $derived(controlOf(spec));

    /** The text a box shows. */
    const boxText = $derived(text ?? textOf(value));

    /** The word a single-value picker holds. */
    const held = $derived(textOf(value));

    /** The words of the choice's empty item: the spec's own, else the unset words of a field. */
    const emptyWords = $derived.by(() => {
        if (typeof spec.empty === 'string') return spec.empty;
        return spec.empty === true || optional ? t('settings.unset') : undefined;
    });

    /** The list a choice or multi draws from. */
    const pool = $derived(poolOf(spec, record, lists));

    /** Whether the held word is outside the list, null while the list is not there yet. */
    const stray = $derived(isStray(spec, held, record, lists));

    /** The sentence under a control whose list is loading or could not be read. */
    const listNote = $derived.by(() => {
        if (control !== 'choice' && control !== 'multi') return '';
        if (pool.state === 'loading') return t('settings.list_loading');
        return pool.state === 'failed' ? t('settings.list_failed', pool.error) : '';
    });

    /** The choices of a choice: its list, or while the list is not there the held word alone. */
    const choices = $derived(
        (pool.state === 'ready' ? pool.items : held === '' ? [] : [held]).map((id) => ({
            id,
            label: id
        }))
    );

    /** The choices of a multi: its list, and each held word the list lacks, marked. */
    const picks = $derived.by(() => {
        const words = wordsOf(value);
        if (pool.state !== 'ready') return words.map((id) => ({ id, label: id }));
        const marked = words
            .filter((word) => !pool.items.includes(word))
            .map((id) => ({ id, label: `${id} (${t('settings.not_in_list')})` }));
        return [...pool.items.map((id) => ({ id, label: id })), ...marked];
    });

    /** What the suggestion box offers for its text. */
    const offer = $derived(offerFor(spec, boxText, lists));
    const offerNote = $derived.by(() => {
        if (offer.note === 'loading') return t('settings.list_loading');
        return offer.note === 'failed' ? t('settings.list_failed', offer.error) : undefined;
    });

    /** The words refusing a number box's text as typed, or undefined while it passes. */
    const refusedWords = $derived.by(() => {
        const refusal = numberRefusal(spec, boxText);
        return refusal === null ? undefined : said(refusal);
    });

    /** The hue a hue or colour control shows chosen: the held one, or the held text when stray. */
    const hueHeld = $derived(hueOf(spec, held, lists) ?? held);

    /** The items of an inline list. */
    const items = $derived(wordsOf(value));

    function setItem(at: number, next: string): void {
        onpick(items.map((one, place) => (place === at ? next : one)));
    }

    function moveItem(at: number, by: number): void {
        const next = [...items];
        const [taken] = next.splice(at, 1);
        next.splice(at + by, 0, taken);
        onpick(next);
    }

    /** A text area is left: its text is the one to settle. */
    function areaLeft(event: FocusEvent): void {
        const field = event.target;
        if (field instanceof HTMLTextAreaElement) onsettle?.(field.value);
    }
</script>

<div class="control" data-control={control}>
    {#if control === 'toggle'}
        {#if optional}
            <Checkbox
                checked={toggleOf(value)}
                {label}
                unset={t('settings.unset')}
                onchange={(next: boolean) => onpick(next)}
                onunset={() => onpick(undefined)}
            />
        {:else}
            <Checkbox
                checked={toggleOf(value) === true}
                {label}
                onchange={(next: boolean) => onpick(next)}
            />
        {/if}
    {:else if control === 'number'}
        <NumberInput
            value={boxText}
            {label}
            refused={refusedWords}
            oninput={(next: string) => ontext?.(next)}
            onenter={onsettle}
            onblur={onsettle}
        />
    {:else if control === 'long'}
        <div class="area" role="presentation" onfocusout={areaLeft}>
            <TextArea
                value={boxText}
                {label}
                oninput={(next: string) => ontext?.(next)}
                grow={{ min: 2, max: 10 }}
            />
        </div>
    {:else if control === 'choice'}
        <Select
            value={held}
            {label}
            empty={emptyWords}
            {choices}
            onchange={(next: string) => onpick(fromPick(spec, next, lists))}
        />
        {#if stray === true}
            <Tag label={t('settings.not_in_list')} tone="amber" />
        {/if}
    {:else if control === 'glyph'}
        <GlyphSelect
            value={held}
            {label}
            empty={emptyWords ?? t('settings.unset')}
            choices={lists.glyphs}
            onchange={(next: string) => onpick(fromPick(spec, next, lists))}
        />
        {#if stray === true}
            <Tag label={t('settings.not_in_list')} tone="amber" />
        {/if}
    {:else if control === 'hue' || control === 'colour'}
        <HueSelect
            value={hueHeld}
            {label}
            empty={emptyWords}
            hues={lists.hues}
            onchange={(next: string) => onpick(fromPick(spec, next, lists))}
        />
        {#if stray === true}
            <Tag label={t('settings.not_in_list')} tone="amber" />
        {/if}
    {:else if control === 'multi'}
        <MultiSelect
            values={wordsOf(value)}
            {label}
            choices={picks}
            search={t('editor.search')}
            remove={t('editor.remove')}
            removeGlyph={t('editor.remove_glyph')}
            none={t('editor.no_choices')}
            onchange={(next: string[]) => onpick(fromWords(spec, value, next))}
        />
    {:else if control === 'folder' || control === 'file'}
        <SuggestInput
            value={boxText}
            {label}
            suggestions={offer.items}
            note={offerNote}
            oninput={(next: string) => ontext?.(next)}
            onenter={onsettle}
            onblur={onsettle}
        />
    {:else if control === 'list' || control === 'parked'}
        <div class="items">
            {#each items as item, at (at)}
                <div class="item">
                    {#if spec.items === 'number'}
                        <NumberInput
                            value={item}
                            label={t('settings.editor_item', at + 1, label)}
                            oninput={(next: string) => setItem(at, next)}
                        />
                    {:else}
                        <TextInput
                            value={item}
                            label={t('settings.editor_item', at + 1, label)}
                            oninput={(next: string) => setItem(at, next)}
                        />
                    {/if}
                    <ToolButton
                        label={t('settings.editor_item_up', at + 1, label)}
                        glyph="collapse"
                        compact
                        disabled={at === 0}
                        onclick={() => moveItem(at, -1)}
                    />
                    <ToolButton
                        label={t('settings.editor_item_down', at + 1, label)}
                        glyph="expand"
                        compact
                        disabled={at === items.length - 1}
                        onclick={() => moveItem(at, 1)}
                    />
                    <ToolButton
                        label={t('settings.editor_item_remove', at + 1, label)}
                        glyph="trash"
                        compact
                        onclick={() => onpick(items.filter((_, place) => place !== at))}
                    />
                </div>
            {/each}
            <ToolButton
                label={t('settings.editor_add')}
                glyph="add"
                onclick={() => onpick([...items, ''])}
            />
        </div>
    {:else if suggests(spec)}
        <SuggestInput
            value={boxText}
            {label}
            suggestions={offer.items}
            note={offerNote}
            oninput={(next: string) => ontext?.(next)}
            onenter={onsettle}
            onblur={onsettle}
        />
    {:else}
        <TextInput
            value={boxText}
            {label}
            oninput={(next: string) => ontext?.(next)}
            onenter={onsettle}
            onblur={onsettle}
        />
    {/if}
    {#if listNote !== ''}
        <p class="note">{listNote}</p>
    {/if}
</div>

<style>
    .control {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 6px;
        min-width: 0;
    }

    .area {
        flex: 1 1 100%;
        min-width: 0;
        max-width: 720px;
    }

    .items {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 4px;
        min-width: 0;
    }

    .item {
        display: flex;
        align-items: center;
        gap: 2px;
    }

    .note {
        flex: 1 0 100%;
        margin: 0;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-sm);
    }
</style>
