<script lang="ts">
    // Layer 3, view partial. The control of one setting an app declares, drawn by the same control
    // the options of the config files use (editors/FieldControl.svelte) over the spec its type
    // gives (state/system/config/other-rows/app-rows.ts). A pick, a toggle and a list are held as
    // they are made as a change of the primary hub's scope (settings/scopes/scopes.svelte.ts),
    // saved with it into the hub's `app_settings:`; a number or a text is kept in the box until
    // Enter or leaving the box holds it, and Escape drops it. A value the setting's declaration
    // refuses (a number outside its bounds, a word it does not list) is marked under the box and
    // not held; the Save refuses one the server finds breaking it, in the words of its answer,
    // under the scope bar. While a change is held the control shows it.

    import { isEqual } from 'lodash-es';
    import {
        numberRefusal,
        textOf,
        type FieldValue
    } from '$lib/state/system/config/editors/fields';
    import type { Lists } from '$lib/state/system/config/editors/sources';
    import { settingFlaw, type AppSettingRow } from '$lib/state/system/config/other-rows/app-rows';
    import FieldControl from '../../editors/FieldControl.svelte';
    import { scopesHere } from '../scopes/context';

    const scopes = scopesHere();

    type Props = { row: AppSettingRow; lists: Lists };

    let { row, lists }: Props = $props();

    /** The change held for the setting in the scope on screen, if any. */
    const held = $derived(scopes?.heldApp(row.setting.key));

    /**
     * The value the control shows: the one held, the default for a reset, else the one in force.
     */
    const shown = $derived.by(() => {
        if (held === undefined) return row.value;
        return 'reset' in held ? row.setting.default : held.value;
    });

    /** The text typed in a number or text box and the value it was typed over. */
    let typed: { text: string; over: unknown } | undefined = $state();

    /** The text the box shows over the value: the typed text until another value is shown. */
    const text = $derived(typed !== undefined && typed.over === shown ? typed.text : undefined);

    /** Why the last value given was not held, until the next change. */
    let refused = $state('');

    const control = $derived(row.control);

    /** Whether the control is a box, whose text is kept until it is held. */
    const boxed = $derived(control === 'number' || control === 'text');

    /** The value shown as the control holds it. */
    const value = $derived.by((): FieldValue => {
        if (typeof shown === 'boolean' || typeof shown === 'string') return shown;
        if (typeof shown === 'number') return String(shown);
        return Array.isArray(shown) ? shown.map(String) : '';
    });

    /** Hold a value as the scope's change, or drop the change for the value the file stores. */
    function hold(next: unknown): void {
        refused = '';
        const flaw = settingFlaw(row.setting, next);
        if (flaw !== null) {
            refused = flaw;
            return;
        }
        typed = undefined;
        if (isEqual(next, row.value)) {
            scopes?.stageApp(row.setting.key, null);
        } else {
            scopes?.stageApp(row.setting.key, { value: next });
        }
    }

    function type(next: string): void {
        refused = '';
        typed = { text: next, over: shown };
    }

    /**
     * A box is left or Enter is pressed in it: a number is read from the text, a text is the text.
     */
    function settle(written: string): void {
        if (text === undefined) return;
        if (row.setting.type === 'string') {
            hold(written);
            return;
        }
        if (written.trim() === '' || numberRefusal(row.entry, written) !== null) return;
        hold(Number(written.trim()));
    }

    function revert(event: KeyboardEvent): void {
        if (event.key !== 'Escape' || text === undefined) return;
        event.stopPropagation();
        typed = undefined;
        refused = '';
    }

    /** A pick, a toggle or a new list: a choice of numbers is held as the number it names. */
    function pick(next: FieldValue | undefined): void {
        if (typeof next === 'boolean' || Array.isArray(next)) hold(next);
        else if (typeof next === 'string') {
            hold(row.setting.enum.find((one) => String(one) === next) ?? next);
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
