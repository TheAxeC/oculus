<script lang="ts">
    // Layer 3, view partial under views/shared/. The head of a card's dated list and its add form:
    // the list's name, its count where it has one, the button that opens the add form, and the
    // form itself (DatedForm.svelte, with its rule, its heading and its labels) while it is open.
    // views/shared/forms/dated/Subtasks.svelte and Followups.svelte draw it, so the two lists of
    // one card head and add alike.
    //
    // A list with no items draws no head (`shown` false), and the add form then opens alone, from
    // the card's own action.

    import DatedForm from './DatedForm.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import type { WriteAnswer } from '$lib/state/client/writes.svelte';

    type Props = {
        /** Whether the head row is drawn: the list holds at least one item. */
        shown: boolean;
        /** The list's name, already translated. */
        label: string;
        /** The count beside the name, already translated; none for a list that shows no count. */
        count?: string;
        /** The add button's words and its title, already translated. */
        addLabel: string;
        addTip: string;
        /** Which list the form adds a line to. */
        kind: 'followup' | 'subtask';
        /** The record the lines hang under, by a key that changes when the record does. */
        record: string;
        /** Why the buttons that write are disabled, already translated; '' when they are not. */
        blocked: string;
        /** True while the add form is open. */
        adding: boolean;
        /** Open or close the add form. */
        onadding: (next: boolean) => void;
        /** The add form's save: the text and the date, '' when none was given. */
        onadd: (text: string, date: string) => Promise<WriteAnswer>;
        /** The answer of a save, while the form is drawn for its record. */
        onanswer: (answer: WriteAnswer) => void;
    };

    const {
        shown,
        label,
        count,
        addLabel,
        addTip,
        kind,
        record,
        blocked,
        adding,
        onadding,
        onadd,
        onanswer
    }: Props = $props();
</script>

{#if shown}
    <div class="hdr">
        <span class="label">{label}</span>
        {#if count !== undefined}
            <span class="count">{count}</span>
        {/if}
        <ToolButton
            small
            label={addLabel}
            title={blocked === '' ? addTip : blocked}
            disabled={blocked !== ''}
            active={adding}
            onclick={() => onadding(!adding)}
        />
    </div>
{/if}

{#if adding}
    <DatedForm {kind} {record} {blocked} save={onadd} {onanswer} oncancel={() => onadding(false)} />
{/if}

<style>
    /* The head is one row of the tree's height, as a line of the list is. */
    .hdr {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 6px;
        min-height: calc(var(--tree-row) * var(--text-scale, 1));
    }

    .label {
        font-size: var(--fs-xs);
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--accent-txt, var(--accent));
    }

    .count {
        font-size: var(--fs-sm);
        color: var(--muted-txt, var(--muted));
    }
</style>
