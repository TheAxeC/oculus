<script lang="ts">
    // Layer 3, shared view partial. Rows of a label and a value, each a pair of boxes with a
    // control that removes it, and a control that adds one: the `meta` of a funding scheme or an
    // event, a section of the career file that is a map, and the keys a record carries that its
    // schema does not name.
    //
    // The rows are the caller's: they come in as a prop and every change goes out whole. With
    // `unique`, the label is the key of a map, so a label is committed when the reader is done with
    // the box (Enter, or the focus leaving) and only if it is not empty and no other row has it; a
    // label that fails is marked while it is typed and put back when the box is left. Without it
    // the label is free text and every keystroke goes out.

    import TextInput from '$lib/ui/forms/TextInput.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { blankRow, type Row } from '$lib/state/forms/record-values';
    import { t } from '$lib/state/shared/words/text';

    type Props = {
        rows: Row[];
        onchange: (rows: Row[]) => void;
        /** The accessible name of the group, already translated. */
        name: string;
        /** The label is a key of a map: not empty, and not one another row has. */
        unique?: boolean;
    };

    let { rows, onchange, name, unique = false }: Props = $props();

    /** The label being typed into a row's box, by the row's place, until the box is left. */
    let typing = $state<Record<number, string>>({});

    function replace(at: number, row: Row): void {
        onchange(rows.map((one, place) => (place === at ? row : one)));
    }

    /** Why the label typed into the row at `at` cannot be committed, or the empty text. */
    function refusal(at: number, label: string): string {
        if (!unique) return '';
        const words = label.trim();
        if (words === '') return rows[at].value === '' ? '' : t('entry_form.label_empty');
        return rows.some((one, place) => place !== at && one.label.trim() === words)
            ? t('entry_form.label_taken', words)
            : '';
    }

    function typed(at: number, label: string): void {
        if (unique) typing[at] = label;
        else replace(at, { ...rows[at], label });
    }

    /** The reader is done with the label: commit it when acceptable, else put the old one back. */
    function settle(at: number, label: string): void {
        if (!unique) return;
        const words = label.trim();
        if (words !== '' && refusal(at, label) === '') replace(at, { ...rows[at], label: words });
        else if (words === '' && rows[at].value === '') replace(at, { ...rows[at], label: '' });
        typing = Object.fromEntries(
            Object.entries(typing).filter(([place]) => Number(place) !== at)
        );
    }

    function remove(at: number): void {
        typing = {};
        onchange(rows.filter((_, place) => place !== at));
    }
</script>

<div class="rows" role="group" aria-label={name}>
    {#each rows as row, at (at)}
        <div class="row">
            <span class="label">
                <TextInput
                    value={typing[at] ?? row.label}
                    label={t('entry_form.row_label', name)}
                    placeholder={t('entry_form.row_label_placeholder')}
                    invalid={refusal(at, typing[at] ?? row.label) || undefined}
                    oninput={(label: string) => typed(at, label)}
                    onenter={(label: string) => settle(at, label)}
                    onblur={(label: string) => settle(at, label)}
                />
            </span>
            <span class="value">
                <TextInput
                    value={row.value}
                    label={t('entry_form.row_value', row.label)}
                    placeholder={t('entry_form.row_value_placeholder')}
                    oninput={(value: string) => replace(at, { ...row, value })}
                />
            </span>
            <ToolButton
                bare
                small
                label={t('entry_form.row_remove')}
                glyph={t('entry_form.row_remove_glyph')}
                onclick={() => remove(at)}
            />
        </div>
    {/each}
    <div class="add">
        <ToolButton
            small
            label={t('entry_form.row_add')}
            glyph={t('entry_form.row_add_glyph')}
            onclick={() => onchange([...rows, blankRow()])}
        />
    </div>
</div>

<style>
    .rows {
        display: flex;
        flex-direction: column;
        gap: 4px;
    }

    .row {
        display: flex;
        align-items: center;
        gap: 6px;
        min-width: 0;
    }

    .label {
        flex: 0 1 30%;
        min-width: 0;
    }

    .value {
        flex: 1 1 auto;
        min-width: 0;
    }

    .add {
        display: flex;
    }
</style>
