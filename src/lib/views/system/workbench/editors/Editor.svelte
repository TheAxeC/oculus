<script lang="ts">
    // Layer 3, view partial. The editor of a list, a multi, a word block or a family of a config
    // file, drawn in the item of its row: the entries as the draft's form draws them
    // (Cards.svelte), each field with the control its catalog spec gives it (a word block's lists
    // as the multi-picks of FieldControl.svelte), the problems of the draft named under them, the
    // line saying the row holds an unsaved change, and Discard while a draft or a change is held.
    //
    // The draft is the tab's instance state under the row's slot (state/system/config/editors/
    // slots.ts), its file and key and the hub or folder of its scope when that is not the primary,
    // so it is there again after a tab switch or a reload, and a draft made in the scope of one hub
    // is drawn only in that scope. An edit that leaves the draft equal to the file's puts the
    // file's own back, which holds nothing. Each edit whose draft reads back is held as an unsaved
    // change of the scope on screen through the editors' write (state/system/config/editors/
    // writer.ts), which the scope's Save writes; the save key on the tab (Cmd+S, Ctrl+S off macOS)
    // is the scope's. With no draft the editor draws the change held, if any, else the file's
    // value. A draft started over a value the file no longer holds is named, holds nothing more and
    // can only be discarded, since its change would write over the other one. A list or family with
    // no entry says so above its Add, so an empty family reads as one and not as a list that failed
    // to draw.
    //
    // The entries are drawn under a disclosure line (Fold.svelte) with the row's title and their
    // number, folded at first past five entries; the problems, the refusal and Save and Discard
    // stay drawn under a folded line. An edit keeps the line unfolded, so an entry added past the
    // fifth does not fold the editor being typed in.

    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { t } from '$lib/state/shared/words/text';
    import {
        applyEdit,
        draftOf,
        draftValue,
        isEdited,
        movedFrom,
        specsOf,
        type Draft,
        type Edit
    } from '$lib/state/system/config/editors/draft';
    import type { Lists } from '$lib/state/system/config/editors/sources';
    import {
        savedBase,
        savedDraft,
        slotOf,
        withSavedDraft
    } from '$lib/state/system/config/editors/slots';
    import type { EditorWriter } from '$lib/state/system/config/editors/writer';
    import { message } from '$lib/state/system/config/messages';
    import type { ConfigRow } from '$lib/state/system/config/rows';
    import { settingsQuery } from '$lib/state/system/config/typed';
    import { foundInside, heldFold, partTexts, withFold } from '$lib/state/system/config/view/fold';
    import { useState } from '$lib/state/client/use';
    import { said } from '../settings/said';
    import Cards from './Cards.svelte';
    import Fold from './Fold.svelte';

    const {
        ui: { instanceState, setInstanceState }
    } = useState();

    let {
        row,
        id,
        editors,
        lists
    }: { row: ConfigRow; id: string; editors: EditorWriter; lists: Lists } = $props();

    /** The draft the tab holds, if it holds one. */
    const held = $derived(savedDraft(instanceState(id), row));

    /** The row with the value of the change it holds in place of the file's, while one is held. */
    const current = $derived.by<ConfigRow>(() => {
        const sent = editors.shown(row);
        return sent === undefined ? row : { ...row, value: sent };
    });

    /** The draft drawn: the tab's, or the file's value read into one. */
    const draft = $derived<Draft | null>(held ?? draftOf(current));

    const problems = $derived.by(() => {
        if (draft === null) return [];
        const made = draftValue(draft, row, lists);
        return made.ok ? [] : made.problems;
    });

    /** Whether the file now holds another value than the one the draft was started over. */
    const stale = $derived(
        held !== undefined && movedFrom(savedBase(instanceState(id), slotOf(row)), current)
    );

    const refusal = $derived(editors.said(row));
    const unsaved = $derived(editors.unsaved(row));

    /** Whether the draft holds no entry. */
    const empty = $derived(draft !== null && draft.cards.length === 0);

    /** The specs the draft's fields are drawn by. */
    const specs = $derived(draft === null ? {} : specsOf(row, draft.form));

    /** Whether the query stands and is found inside the entries, which unfolds them. */
    const searched = $derived(
        foundInside(settingsQuery(instanceState(id)), partTexts(row, 'entries'))
    );

    /**
     * Put an edited draft in the tab's state, one equal to the file's being no draft, and hold its
     * value as the row's change while it reads back and the file has not moved under it.
     */
    function edit(next: Edit): void {
        if (draft === null) return;
        editors.clear(row);
        const changed = applyEdit(draft, next);
        const kept = instanceState(id);
        const state =
            heldFold(kept, row.id, 'entries') === undefined
                ? withFold(kept, row.id, 'entries', false)
                : kept;
        if (!isEdited(changed, row, lists)) {
            setInstanceState(id, withSavedDraft(state, slotOf(row), null));
            editors.save(row, changed);
            return;
        }
        const base = held === undefined ? row.value : savedBase(state, slotOf(row));
        setInstanceState(id, withSavedDraft(state, slotOf(row), changed, base));
        if (!stale) editors.save(row, changed);
    }

    /** How many Discards this editor has had, which a control's Add person compares. */
    let discards = $state(0);

    function discard(): void {
        discards += 1;
        editors.discard(row);
    }
</script>

{#if draft !== null}
    <div class="editor" data-editor={draft.form}>
        <Fold
            {id}
            row={row.id}
            part="entries"
            title={row.title}
            count={draft.cards.length}
            {searched}
        >
            {#if empty}
                <p class="empty" data-editor-empty>{t('settings.editor_empty')}</p>
            {/if}
            <Cards
                cards={draft.cards}
                fields={draft.fields}
                {specs}
                form={draft.form}
                {lists}
                instance={id}
                base={`${row.file}:${row.key}`}
                title={row.title}
                slots={row.entry.slots}
                removeOnly={row.control === 'parked'}
                ordered={row.ordered}
                single={draft.one === true}
                sparse={row.entry.sparse === true}
                {discards}
                onedit={edit}
            />
        </Fold>
        {#if problems.length > 0}
            <ul class="problems">
                {#each problems as problem, at (at)}
                    <li role="status">
                        {problem.where === undefined ? '' : `${said(problem.where)} `}{said(
                            problem.said
                        )}
                    </li>
                {/each}
            </ul>
        {/if}
        {#if stale}
            <p class="problem" role="status">{said(message('changedSince', row.file))}</p>
        {/if}
        {#if refusal !== null}
            <p class="problem" role="status">{said(refusal)}</p>
        {:else if unsaved}
            <p class="done" role="status">{t('settings.editor_unsaved')}</p>
        {/if}
        {#if held !== undefined || unsaved}
            <div class="actions">
                <ToolButton
                    label={t('settings.editor_discard')}
                    glyph="dismiss"
                    onclick={discard}
                />
            </div>
        {/if}
    </div>
{/if}

<style>
    .editor {
        display: flex;
        flex-direction: column;
        gap: 8px;
        min-width: 0;
    }

    .problems {
        margin: 0;
        padding-left: 18px;
    }

    .problems,
    .problem {
        color: var(--c-red-txt);
        font-size: var(--fs-md);
    }

    .problem,
    .empty,
    .done {
        margin: 0;
    }

    .empty,
    .done {
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-md);
    }

    .actions {
        display: flex;
        gap: 6px;
    }
</style>
