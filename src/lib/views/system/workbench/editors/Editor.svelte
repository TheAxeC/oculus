<script lang="ts">
    // Layer 3, view partial. The editor of a list, a multi or a family of a config file, drawn in
    // the item of its row: the entries as the draft's form draws them (Cards.svelte,
    // Rollup.svelte), each field with the control its catalog spec gives it, the problems of the
    // draft named under them, the sentence of a refusal, and Save and Discard while a draft is
    // held.
    //
    // The draft is the tab's instance state under the file and key (state/system/config/editors/
    // slots.ts), so it is there again after a tab switch or a reload. An edit that leaves the draft
    // equal to the file's puts the file's own back, which holds nothing. Save sends the whole value
    // through the editors' write (state/system/config/editors/writer.ts); while the write is out
    // the draft is shown and Save waits, and the answer that the file holds the value ends the
    // draft, the value sent shown until the watcher's push of the file brings it. A draft started
    // over a value the file no longer holds is named and cannot be saved, only discarded, since a
    // Save would write over the other change. The save key on the tab (Cmd+S, Ctrl+S off macOS)
    // saves a held draft when Save could be pressed, and so does the Save of a close question,
    // which closes the tab once the write was taken. Once the file answers that it holds what was
    // sent the editor says "Saved." until the next edit, as the rail list's Save does, and a list
    // or family with no entry says so above its Add, so a saved empty family reads as one and not
    // as a list that failed to draw.

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
    import { savedBase, savedDraft, withSavedDraft } from '$lib/state/system/config/editors/slots';
    import type { EditorWriter } from '$lib/state/system/config/editors/writer';
    import { message } from '$lib/state/system/config/messages';
    import type { ConfigRow } from '$lib/state/system/config/rows';
    import { useState } from '$lib/state/client/use';
    import { said } from '../settings/said';
    import Cards from './Cards.svelte';
    import Rollup from './Rollup.svelte';

    const {
        ui: { instanceState, setInstanceState, registerTabSave }
    } = useState();

    let {
        row,
        id,
        editors,
        lists
    }: { row: ConfigRow; id: string; editors: EditorWriter; lists: Lists } = $props();

    /** The draft the tab holds, if it holds one. */
    const held = $derived(savedDraft(instanceState(id), row));

    /** The row with the value the file answered it holds in place of its own, until the push. */
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
        held !== undefined && movedFrom(savedBase(instanceState(id), row.file, row.key), current)
    );

    const sending = $derived(editors.sending(row));
    const refusal = $derived(editors.said(row));
    const saved = $derived(editors.saved(row));

    /** Whether the draft holds no entry: no key of a roll-up, no card of any other form. */
    const empty = $derived(
        draft !== null && (draft.form === 'rollup' ? draft.groups : draft.cards).length === 0
    );

    /** The specs the draft's fields are drawn by, and the one the keys of a roll-up are. */
    const specs = $derived(draft === null ? {} : specsOf(row, draft.form));
    const keySpec = $derived(
        (Object.hasOwn(row.fields, 'key') ? row.fields.key : undefined) ?? {
            help: '',
            control: 'text' as const
        }
    );

    /** Put an edited draft in the tab's state; one equal to the file's is no draft. */
    function edit(next: Edit): void {
        if (draft === null || sending) return;
        editors.clear(row);
        const changed = applyEdit(draft, next);
        const state = instanceState(id);
        if (!isEdited(changed, current, lists)) {
            setInstanceState(id, withSavedDraft(state, row.file, row.key, null));
            return;
        }
        const base = held === undefined ? current.value : savedBase(state, row.file, row.key);
        setInstanceState(id, withSavedDraft(state, row.file, row.key, changed, base));
    }

    function discard(): void {
        editors.clear(row);
        setInstanceState(id, withSavedDraft(instanceState(id), row.file, row.key, null));
    }

    /** Send the draft; whether the write was taken. */
    async function save(): Promise<boolean> {
        if (draft === null || stale) return false;
        await editors.save(current, draft);
        return editors.said(row) === null;
    }

    $effect(() =>
        registerTabSave(id, () => {
            if (held === undefined) return Promise.resolve(true);
            return !sending && problems.length === 0 ? save() : Promise.resolve(false);
        })
    );
</script>

{#if draft !== null}
    <div class="editor" data-editor={draft.form}>
        {#if empty}
            <p class="empty" data-editor-empty>{t('settings.editor_empty')}</p>
        {/if}
        {#if draft.form === 'rollup'}
            <Rollup
                {draft}
                {specs}
                {keySpec}
                {lists}
                instance={id}
                base={`${row.file}:${row.key}`}
                onedit={edit}
            />
        {:else}
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
                onedit={edit}
            />
        {/if}
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
        {:else if saved && held === undefined}
            <p class="done" role="status">{t('settings.editor_saved')}</p>
        {/if}
        {#if held !== undefined}
            <div class="actions">
                <ToolButton
                    label={t('settings.editor_save')}
                    glyph="save"
                    disabled={sending || stale || problems.length > 0}
                    onclick={save}
                />
                <ToolButton
                    label={t('settings.editor_discard')}
                    glyph="dismiss"
                    disabled={sending}
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
