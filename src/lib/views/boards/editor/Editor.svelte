<script module lang="ts">
    // Layer 3, view registration. An editor opens from a record's card and is not listed.
    import type { ViewRegistration } from '$lib/state/workbench/navigation/registry';
    export const registration: ViewRegistration = {
        id: 'editor',
        label: 'views.editor',
        glyph: 'views.editor_glyph',
        group: '',
        order: 0,
        listed: false
    };
</script>

<script lang="ts">
    // Layer 3, view. The one editor of every record: a project, an entry of a collection, a person,
    // a lead, a Lit Watch paper and the career file, each a tab opened beside the record's page.
    // The tab's state names the record: the project's `recordField`, an entry's `entryPageState`
    // and `{ id: 'career', label }`, so one record is one tab (`stateId`). What differs by kind is
    // editor-target.ts beside this file; this file names no field, no section and no list of
    // choices, and draws each kind's form the same way: the sections of the form in order, one
    // widget per field, and a Save that posts only what was changed.
    //
    // What it holds is the edits, not the values. A field reads the record's current value until
    // it is edited, and the edit sits over it until it is saved or reverted; so nothing has to be
    // copied when the record changes, and what Save posts is exactly the map of edits. The edits
    // are kept in the instance's state through state/forms/form-draft.ts rather than in this
    // component, so a reload keeps them as a tab switch does, and the tab asks before it closes
    // over them, also when the record is gone. The controls are
    // views/shared/forms/entry/edit/EntryForm.svelte.
    //
    // A save the server took drops the edits it took, keeping an edit typed while it was on its way
    // and one the server refused. The saved values are held over the record's own
    // (state/forms/settled.svelte.ts) until the watcher's rebuilt snapshot shows them, so the form
    // and the tab's title show them at once; a snapshot that shows another value for a field than
    // the one the save was made over replaces the held value, and of two saves in flight the
    // newest one's words are the ones the pane shows. A save that gives an entry a new title or key
    // moves the tab to them, the folds kept.
    //
    // A manifest's follow-up notes and subtasks are shown read-only, each list as one text: the
    // project's card adds, changes and removes them line by line (state/forms/schema.ts decides
    // which fields write).
    //
    // A person field's Add person writes the new person to the people registry of the record's own
    // hub, the primary's for a record that names none (state/forms/new-entry.ts `addPerson`), since
    // a key the record writes resolves in its own hub first; the new key is then an edit of the
    // field like any pick. A Revert while the write is out leaves the field as the Revert left it
    // (`unlessReverted`).
    //
    // Each section is the group every grouping of a view is drawn as
    // (ui/controls/heads/GroupHead.svelte), headed with its name and folded by it under `folded` of
    // the tab's state (views/shared/card/pane-fold.ts), beside the edits the draft keeps there. The
    // groups are `formGroups` of state/forms/record-fields.ts, so no field of a schema is left
    // undrawn.

    import Tag from '$lib/ui/controls/Tag.svelte';
    import Empty from '$lib/ui/frame/Empty.svelte';
    import GroupHead from '$lib/ui/controls/heads/GroupHead.svelte';
    import Pane from '$lib/ui/frame/Pane.svelte';
    import Toolbar from '$lib/ui/frame/toolbar/Toolbar.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import EntryForm from '../../shared/forms/entry/edit/EntryForm.svelte';
    import { usePaneFold } from '../../shared/card/pane-fold';
    import { editorRecord, editorTarget, recordWords } from './editor-target';
    import { addPerson, unlessReverted } from '$lib/state/forms/new-entry';
    import { formGroups } from '$lib/state/forms/record-fields';
    import type { FormField } from '$lib/state/forms/schema';
    import { instanceFolded } from '$lib/state/shared/page/folds';
    import { t } from '$lib/state/shared/words/text';
    import { instanceText, stateId, withInstanceKey } from '$lib/state/workbench/layout/instance';
    import type { ViewProps } from '$lib/state/workbench/navigation/registry';
    import { useState } from '$lib/state/client/use';

    const client = useState();
    const {
        formDraft: { draftEdits, editDraft, revertDraft, settleDraft },
        fs: { primary },
        layout: { restateInstance },
        selectors: { manifestSections, registryCollections },
        writes: { newEntry }
    } = client;

    let { instance }: ViewProps = $props();

    /** Which of the form's sections are open, kept in the tab's state. */
    const fold = usePaneFold();

    /** The record this instance was opened for, from the state the card handed openView. */
    const record = $derived(editorRecord(instance.state));
    const target = $derived(editorTarget(client, record));
    const manifest = $derived(record.kind === 'project');
    const groups = $derived(
        target === null ? [] : formGroups(target.fields, manifestSections(), t('editor.other'))
    );

    /** The edits over the record's own values, by field name. Cleared by Revert and by a save. */
    const edits = $derived(
        target === null ? {} : draftEdits(instance.id, target.draftKind, target.name)
    );
    /** What the last save said, as lines the pane shows under the form. */
    let result = $state<string[]>([]);
    /** Why the server refused each field of the last save, by field name. */
    let refusals = $state<Record<string, string>>({});
    /** Whether this editor's own save is on its way. */
    let saving = $state(false);

    const dirty = $derived((target?.fields ?? []).filter((one) => changed(one.field)));

    // A save that gave the entry a new key or a new title moves the tab to them, so the tab's title
    // follows the saved words from the first frame, the folded sections kept.
    $effect(() => {
        const next = target?.tab ?? null;
        if (next === null) return;
        const same =
            stateId(next) === stateId(instance.state) &&
            instanceText(next, 'label') === instanceText(instance.state, 'label');
        if (same) return;
        const folded = instanceFolded(instance.state);
        restateInstance(instance.id, withInstanceKey(next, 'folded', folded));
    });

    /** Whether the form may write a field: a read-only one shows the record's value only. */
    function writable(field: string): boolean {
        return target?.writable(field) ?? false;
    }

    /** The form field of a name, which says how its value is shown and compared. */
    function fieldOf(field: string): FormField | undefined {
        return target?.fields.find((one) => one.field === field);
    }

    /** The value a control shows: the edit when there is one, the record's value otherwise. */
    function valueOf(field: FormField): unknown {
        if (field.field in edits && writable(field.field)) return edits[field.field];
        return target?.shown(field);
    }

    /**
     * Whether a field has an edit that says something other than what the record says, by the rule
     * the tab's close asks by: a row that says it is waiting to be saved when nothing will be
     * written says the wrong thing.
     */
    function changed(field: string): boolean {
        const form = fieldOf(field);
        if (target === null || form === undefined) return false;
        return writable(field) && field in edits && target.differs(form, edits[field]);
    }

    /** Keep an edit of a field, which takes the reason it was refused away. */
    function edit(field: FormField, value: unknown): void {
        if (target === null) return;
        editDraft(instance.id, target.draftKind, target.name, field.field, value);
        const { [field.field]: _gone, ...rest } = refusals;
        refusals = rest;
    }

    /** How many Reverts this editor has had, which an Add person compares across its write. */
    let reverts = 0;

    function revert(): void {
        reverts += 1;
        revertDraft(instance.id);
        refusals = {};
        result = [];
    }

    /** What the toolbar says about the form: how much is waiting to be saved. */
    function summary(): string {
        return dirty.length === 0 ? t('editor.clean') : t('editor.dirty', dirty.length);
    }

    /** How many saves of this editor are out, and the number of the newest one sent. */
    let sending = 0;
    let newest = 0;

    /**
     * Post the changed fields. The instance is taken before the request goes, so an answer that
     * lands after the tab was switched settles the draft it was sent from, and the newest save sent
     * is the one whose words the pane shows.
     */
    async function save(): Promise<void> {
        const sent = target;
        const payload = sent?.payload(
            edits,
            dirty.map((one) => one.field)
        );
        if (sent === null || payload === undefined || Object.keys(payload.body).length === 0) {
            result = [t('editor.saved_none')];
            return;
        }
        const from = instance.id;
        newest += 1;
        const mine = newest;
        sending += 1;
        saving = true;
        try {
            const answer = await sent.send(payload.body);
            const took = sent.took(answer, payload.taken);
            if (took !== null) {
                settleDraft(
                    from,
                    took,
                    answer.refused.map((one) => one.field)
                );
            }
            if (mine !== newest) return;
            refusals = sent.refusals(answer);
            result = sent.said(answer);
        } finally {
            sending -= 1;
            saving = sending > 0;
        }
    }

    /**
     * Write a new person to the people registry of the hub `hub`, the record's own, or the
     * primary's for a record that names none.
     */
    function addTo(hub: string): (name: string) => ReturnType<typeof addPerson> {
        const home = hub === '' ? primary() : hub;
        return unlessReverted(
            (name) => addPerson(name, registryCollections('people'), home, newEntry),
            () => reverts
        );
    }

    /** Whether a field holds nothing as it is now, which a required field is reminded of. */
    function empty(field: FormField): boolean {
        return target?.isEmpty(field, valueOf(field)) ?? false;
    }
</script>

{#snippet tools()}
    <Toolbar label={manifest ? t('editor.toolbar') : t('editor.record_toolbar')} overflow>
        <ToolButton
            bare
            label={t('editor.save')}
            glyph={t('editor.save_glyph')}
            active={dirty.length > 0}
            disabled={(target?.blocked ?? '') !== ''}
            title={(target?.blocked ?? '') === '' ? undefined : target?.blocked}
            onclick={save}
        />
        <ToolButton
            bare
            label={t('editor.revert')}
            glyph={t('editor.revert_glyph')}
            onclick={revert}
        />
    </Toolbar>
{/snippet}

{#snippet bar()}
    <Toolbar label={manifest ? t('editor.status') : t('editor.record_status')}>
        <span class="status">
            <Tag label={saving ? t('editor.saving') : summary()} />
        </span>
    </Toolbar>
{/snippet}

<Pane
    title={target?.title ?? (manifest ? t('editor.title') : t('editor.record_title'))}
    toolbar={tools}
    {bar}
    tinted
>
    <div
        class="editor"
        data-instance={instance.id}
        data-project={record.kind === 'project' ? record.id : undefined}
        data-entry={target?.draftKind === 'page' ? target.name : undefined}
    >
        {#if record.kind === 'none'}
            <Empty message={t('editor.none')} glyph={t('editor.none_glyph')} />
        {:else if target === null}
            <Empty
                message={t('editor.unknown', recordWords(record))}
                glyph={t('editor.none_glyph')}
            />
        {:else}
            {#each groups as group (group.name)}
                <GroupHead
                    data-section={group.name}
                    label={group.name}
                    open={fold.open(group.name)}
                    ontoggle={() => fold.toggle(group.name)}
                >
                    <EntryForm
                        fields={group.fields}
                        {valueOf}
                        onedit={edit}
                        {writable}
                        {changed}
                        choices={target.choices}
                        note={target.note}
                        {refusals}
                        {empty}
                        addPerson={addTo(target.root)}
                        people={target.people}
                    />
                </GroupHead>
            {/each}
            {#if result.length > 0}
                <p class="result">
                    {#each result as line, at (`${at}:${line}`)}
                        <span class="line">{line}</span>
                    {/each}
                </p>
            {/if}
        {/if}
    </div>
</Pane>

<style>
    .editor {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    /* The status words close the bar. */
    .status {
        margin-left: auto;
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
