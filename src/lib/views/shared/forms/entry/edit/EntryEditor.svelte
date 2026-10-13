<script lang="ts">
    // Layer 3, shared view partial. The editor of one entry: a collection entry, a feed entry, a
    // person, or the sections of the career file. It draws the fields of the entry's own file
    // schema as a form (EntryForm.svelte), with Save and Revert above it.
    //
    // What it holds is the edits, not the values: a field shows the saved value until it is edited,
    // and the edit sits over it until it is saved or reverted. The edits are kept in the instance's
    // state through state/forms/form-draft.ts, so a tab switch, a reload and a change of the file
    // on disk keep them, and the tab asks before it closes over them. Save posts only the fields
    // whose payload differs from the saved one (state/forms/entry-save.ts), the identity of the
    // entry never among them. A field the server refused keeps its edit and shows the reason under
    // it; the others are dropped from the draft once the file has them, and the form shows the
    // values the server took at once, since the page holds them over the snapshot's until the
    // snapshot shows them (state/forms/settled.svelte.ts). A feed entry's save refused as a whole
    // after some fields were written drops those fields, keeps the rest as edits, and says both
    // what was saved and why the save stopped. Of two saves in flight the newest one's answer is
    // the one the form words.
    //
    // While a source tab holds unsaved text of the entry's file, Save is disabled with the words
    // saying so, and a write sent from anywhere else is refused before it is sent.

    import Tag from '$lib/ui/controls/Tag.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import EntryForm from './EntryForm.svelte';
    import { blockedBy } from '../../entry-file';
    import { pagePayload, savePage } from '$lib/state/forms/entry-save';
    import { pageFields, sampleOf, type PageEntry } from '$lib/state/forms/page-entry';
    import { fieldDiffers, payloadOf, toEdit } from '$lib/state/forms/record-values';
    import type { IdentityFault } from '$lib/state/boards/collection';
    import type { FormField } from '$lib/state/forms/schema';
    import type { ViewSource } from '$lib/state/sessions/view-source';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';

    const {
        formDraft: { draftEdits, editDraft, revertDraft, settleDraft },
        selectors: { fieldChoices },
        source: { unsavedFile },
        writes
    } = useState();

    type Props = {
        page: PageEntry;
        /** The view instance that keeps the draft. */
        instance: string;
        /** The file the entry is written in, whose unsaved text in a source tab disables Save. */
        file: ViewSource | null;
        /** Why a write cannot address the entry, when the file's identities say so. */
        fault?: IdentityFault;
    };

    let { page, instance, file, fault }: Props = $props();

    /** The kind of draft every page entry keeps (state/client/context.ts names its target). */
    const DRAFT_KIND = 'page';

    const fields = $derived(pageFields(page));
    const edits = $derived(draftEdits(instance, DRAFT_KIND, page.name));
    const blocked = $derived(
        blockedBy(file, file !== null && unsavedFile(file.root, file.path), fault)
    );

    /** What the last save said, as lines under the form, and why each refused field was refused. */
    let result = $state<string[]>([]);
    let refusals = $state<Record<string, string>>({});
    let saving = $state(false);

    const changedFields = $derived(fields.filter((one) => changed(one.field)));

    function writable(name: string): boolean {
        return !page.fixed.includes(name);
    }

    /** The value a control shows: the edit when there is one, the saved value otherwise. */
    function valueOf(field: FormField): unknown {
        return field.field in edits && writable(field.field)
            ? edits[field.field]
            : toEdit(field, page.values[field.field], sampleOf(page, field.field));
    }

    function changed(name: string): boolean {
        const field = fields.find((one) => one.field === name);
        return (
            field !== undefined &&
            writable(name) &&
            name in edits &&
            fieldDiffers(field, edits[name], page.values[name], sampleOf(page, name))
        );
    }

    function edit(field: FormField, value: unknown): void {
        editDraft(instance, DRAFT_KIND, page.name, field.field, value);
        const { [field.field]: _gone, ...rest } = refusals;
        refusals = rest;
    }

    function revert(): void {
        revertDraft(instance);
        refusals = {};
        result = [];
    }

    /** Whether the field holds nothing as it is now, which a required field is reminded of. */
    function empty(field: FormField): boolean {
        return payloadOf(field, valueOf(field), page.values[field.field]) === null;
    }

    /** How many saves of this editor are out, and the number of the newest one sent. */
    let sending = 0;
    let newest = 0;

    async function save(): Promise<void> {
        const { body, taken } = pagePayload(page, fields, edits);
        if (Object.keys(body).length === 0) {
            result = [t('editor.saved_none')];
            return;
        }
        const from = instance;
        newest += 1;
        const mine = newest;
        sending += 1;
        saving = true;
        try {
            const answer = await savePage(page, body, writes);
            // A save refused as a whole took the fields in `changed` and no others.
            const took = answer.ok
                ? taken
                : Object.fromEntries(
                      Object.entries(taken).filter(([name]) => answer.changed.includes(name))
                  );
            settleDraft(
                from,
                took,
                answer.refused.map((one) => one.field)
            );
            if (mine !== newest) return;
            refusals = Object.fromEntries(answer.refused.map((one) => [one.field, one.reason]));
            result = answer.ok
                ? [t('editor.saved', answer.changed.join(', '))]
                : [
                      ...(answer.changed.length > 0
                          ? [t('editor.saved', answer.changed.join(', '))]
                          : []),
                      t('editor.failed', answer.error ?? '')
                  ];
        } finally {
            sending -= 1;
            saving = sending > 0;
        }
    }
</script>

<div class="editor" data-editor={page.name}>
    <div class="bar">
        <ToolButton
            label={t('editor.save')}
            glyph={t('editor.save_glyph')}
            active={changedFields.length > 0}
            disabled={blocked !== ''}
            title={blocked === '' ? undefined : blocked}
            onclick={save}
        />
        <ToolButton label={t('editor.revert')} glyph={t('editor.revert_glyph')} onclick={revert} />
        <Tag
            label={saving
                ? t('editor.saving')
                : changedFields.length === 0
                  ? t('editor.clean')
                  : t('editor.dirty', changedFields.length)}
        />
    </div>
    <EntryForm
        {fields}
        {valueOf}
        onedit={edit}
        {writable}
        {changed}
        choices={(one: FormField) =>
            fieldChoices(one, null, page.root === '' ? undefined : page.root)}
        {refusals}
        {empty}
    />
    {#if result.length > 0}
        <p class="result">
            {#each result as line, at (`${at}:${line}`)}
                <span class="line">{line}</span>
            {/each}
        </p>
    {/if}
</div>

<style>
    .editor {
        display: flex;
        flex-direction: column;
        gap: 2px;
    }

    .bar {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 6px;
        margin-bottom: 4px;
    }

    .result {
        margin: 0;
        padding-top: 8px;
        border-top: 1px solid var(--line);
        font-size: var(--fs-md);
        color: var(--muted-txt, var(--muted));
    }

    .line {
        display: block;
    }
</style>
