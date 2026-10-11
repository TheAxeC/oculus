<script lang="ts">
    // Layer 3, view partial. The control of one setting an app declares, drawn by the same control
    // the options of the config files use (editors/FieldControl.svelte) over the spec its type
    // gives (state/system/config/other-rows/app-rows.ts). A pick, a toggle and a list are written
    // as they are made; a number or a text is kept in the box until Enter or leaving the box writes
    // it, and Escape drops it. A number the setting's bounds refuse is marked under the box and not
    // written. The write is `app-setting`, which refuses a value that breaks the declaration in the
    // words of the answer; the refusal stands under the control until the next change.

    import {
        numberRefusal,
        textOf,
        type FieldValue
    } from '$lib/state/system/config/editors/fields';
    import type { Lists } from '$lib/state/system/config/editors/sources';
    import { settingFlaw, type AppSettingRow } from '$lib/state/system/config/other-rows/app-rows';
    import { useState } from '$lib/state/client/use';
    import FieldControl from '../../editors/FieldControl.svelte';

    const {
        writes: { writeAppSetting }
    } = useState();

    type Props = { row: AppSettingRow; lists: Lists };

    let { row, lists }: Props = $props();

    /** The text typed in a number or text box and the value it was typed over. */
    let typed: { text: string; over: unknown } | undefined = $state();

    /** The text the box shows over the value: the typed text until the file holds another value. */
    const text = $derived(typed !== undefined && typed.over === row.value ? typed.text : undefined);

    /** What the last write was refused with, until the next change. */
    let refused = $state('');

    const control = $derived(row.control);

    /** Whether the control is a box, whose text is kept until it is written. */
    const boxed = $derived(control === 'number' || control === 'text');

    /** The value in force as the control holds it. */
    const value = $derived.by((): FieldValue => {
        const held = row.value;
        if (typeof held === 'boolean' || typeof held === 'string') return held;
        if (typeof held === 'number') return String(held);
        return Array.isArray(held) ? held.map(String) : '';
    });

    async function write(next: unknown): Promise<void> {
        refused = '';
        const flaw = settingFlaw(row.setting, next);
        if (flaw !== null) {
            refused = flaw;
            return;
        }
        const answer = await writeAppSetting(row.setting.key, next);
        refused = answer.ok ? '' : (answer.error ?? answer.refused.at(0)?.reason ?? '');
    }

    function type(next: string): void {
        refused = '';
        typed = { text: next, over: row.value };
    }

    /**
     * A box is left or Enter is pressed in it: a number is read from the text, a text is the text.
     */
    function settle(written: string): void {
        if (text === undefined) return;
        if (row.setting.type === 'string') {
            void write(written);
            return;
        }
        if (written.trim() === '' || numberRefusal(row.entry, written) !== null) return;
        void write(Number(written.trim()));
    }

    function revert(event: KeyboardEvent): void {
        if (event.key !== 'Escape' || text === undefined) return;
        event.stopPropagation();
        typed = undefined;
        refused = '';
    }

    /** A pick, a toggle or a new list: a choice of numbers is written as the number it names. */
    function pick(next: FieldValue | undefined): void {
        if (typeof next === 'boolean' || Array.isArray(next)) void write(next);
        else if (typeof next === 'string') {
            void write(row.setting.enum.find((one) => String(one) === next) ?? next);
        }
    }
</script>

<div class="box" role="presentation" onkeydown={revert}>
    <FieldControl
        spec={row.entry}
        {value}
        label={control === 'toggle' ? row.help.replaceAll('`', '') : row.title}
        {lists}
        text={boxed ? (text ?? textOf(value)) : undefined}
        ontext={type}
        onsettle={settle}
        onpick={pick}
    />
</div>
{#if refused !== ''}
    <p class="said" role="status">{refused}</p>
{/if}

<style>
    .box {
        width: 420px;
        max-width: 100%;
    }

    .said {
        margin: 4px 0 0;
        color: var(--c-red-txt);
        font-size: var(--fs-sm);
    }
</style>
